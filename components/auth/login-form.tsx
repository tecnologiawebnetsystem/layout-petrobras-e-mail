"use client";

import type { FormEvent } from "react";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import { User, Lock, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginBackground } from "@/components/ui/login-background";
import { NotificationModal } from "@/components/shared/notification-modal";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { isBackendAvailable } from "@/lib/services/api-fetch";
import { getClientEnv } from "@/lib/env";
import { getMsalInstance, loginRequest } from "@/lib/auth/msal-config";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirectingToMicrosoft, setIsRedirectingToMicrosoft] =
    useState(false);
  const [externalStep, setExternalStep] = useState<"email" | "code">("email");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();

  const AUTH_MODE = getClientEnv("NEXT_PUBLIC_AUTH_MODE") || "entra";
  const isDevMode = AUTH_MODE !== "entra";
  
  // Detecta ambiente de desenvolvimento (localhost)
  const [isLocalhost, setIsLocalhost] = useState(false);
  useEffect(() => {
    setIsLocalhost(
      typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    );
  }, []);

  // Guard: se já autenticado, redirecionar para a página correta
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const dest =
      user.userType === "admin"
        ? "/admin"
        : user.userType === "supervisor"
          ? "/supervisor"
          : user.userType === "external"
            ? "/download"
            : "/upload";
    router.replace(dest);
  }, [isAuthenticated, user, router]);

  const isExternalUser =
    email.trim().length > 0 && !email.toLowerCase().includes("@petrobras");

  // Countdown timer for verification code
  useEffect(() => {
    if (externalStep === "code" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, externalStep]);

  // ─── Fluxo Externo (OTP) ─────────────────────────────────────────────

  const handleSendCode = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/external/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, validity_minutes: 10 }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.detail ?? data.error?.message ?? "Erro ao enviar codigo",
        );
      setExternalStep("code");
      setCountdown(60);
      setVerificationCode(["", "", "", "", "", ""]);
      // Em desenvolvimento, o backend retorna o codigo para facilitar os testes
      if (data.code) setGeneratedCode(data.code);
      setNotification({
        show: true,
        type: "success",
        title: "Codigo enviado!",
        message: `Um codigo de 6 digitos foi enviado para ${email}`,
      });
    } catch (error: any) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao enviar codigo",
        message:
          error.message || "Nao foi possivel enviar o codigo. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      const fullCode = newCode.join("");
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/external/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: fullCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Codigo invalido");
        // data = { token, expires_at, share_id }
        setAuth(
          { id: email, email, name: email, userType: "external" },
          data.token,
          data.token,
        );
        setNotification({
          show: true,
          type: "success",
          title: "Codigo verificado!",
          message: "Redirecionando para seus documentos...",
        });
        setTimeout(() => router.push("/download"), 1500);
      } catch (error: any) {
        setNotification({
          show: true,
          type: "error",
          title: "Codigo invalido",
          message:
            error.message ||
            "O codigo informado esta incorreto. Tente novamente.",
        });
        setVerificationCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setCountdown(60);
    setVerificationCode(["", "", "", "", "", ""]);
    try {
      const res = await fetch("/api/auth/external/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, validity_minutes: 10 }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.detail ?? data.error?.message ?? "Erro ao reenviar codigo",
        );
      if (data.code) setGeneratedCode(data.code);
      setNotification({
        show: true,
        type: "info",
        title: "Codigo reenviado",
        message: `Um novo codigo foi enviado para ${email}`,
      });
    } catch (resendError: unknown) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao reenviar",
        message:
          resendError instanceof Error
            ? resendError.message
            : "Nao foi possivel reenviar o codigo. Tente novamente.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToEmail = () => {
    setExternalStep("email");
    setVerificationCode(["", "", "", "", "", ""]);
    setGeneratedCode("");
  };

  // ─── Fluxo Interno DEV (email+senha local) ───────────────────────────

  const handleLocalLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/internal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Credenciais invalidas");
      const userType: "internal" | "supervisor" | "admin" | "external" =
        data.is_admin
          ? "admin"
          : data.is_supervisor
            ? "supervisor"
            : "internal";
      setAuth(
        {
          id: String(data.user_id),
          email: data.email ?? email,
          name: data.name ?? email.split("@")[0],
          userType,
          manager: data.manager
            ? {
                id: String(data.manager.id),
                name: data.manager.name,
                email: data.manager.email,
                jobTitle: data.manager.job_title || undefined,
                department: data.manager.department || undefined,
              }
            : undefined,
        },
        data.access_token,
        data.refresh_token ?? data.access_token,
      );
      // O guard useEffect acima cuida do redirecionamento
    } catch (error: unknown) {
      setNotification({
        show: true,
        type: "error",
        title: "Credenciais invalidas",
        message:
          error instanceof Error ? error.message : "Email ou senha incorretos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Fluxo Interno (Entra ID via backend) ─────────────────────────────

  const handleEntraIdLogin = async () => {
    // Mostra o FullPageLoader imediatamente ao clicar
    setIsRedirectingToMicrosoft(true);
    setIsLoading(true);
    try {
      // Verifica se o backend esta acessivel antes de redirecionar
      const backendOk = await isBackendAvailable();
      if (!backendOk) {
        throw new Error(
          "Servidor indisponivel. O login requer o backend ativo. Tente novamente em alguns instantes.",
        );
      }
      // MSAL conduz o fluxo Authorization Code + PKCE diretamente com a Microsoft.
      // Nao usa client_secret (compativel com app registrada como SPA no Azure AD).
      // Apos login, Microsoft redireciona para /auth/entra-callback onde MSAL
      // processa a resposta e o frontend troca os tokens com o backend.
      const msal = await getMsalInstance();
      await msal.loginRedirect(loginRequest);
      // O browser sera redirecionado — o estado de loading permanece ate o redirect.
    } catch (error: unknown) {
      setIsLoading(false);
      setIsRedirectingToMicrosoft(false);
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel iniciar o login com a Microsoft.";
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao autenticar",
        message,
      });
    }
  };

  // ─── Submit handler ───────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Usuarios externos SEMPRE usam o fluxo OTP
    if (isExternalUser) {
      await handleSendCode();
      return;
    }
    // Modo DEV: login local com email+senha
    if (isDevMode) {
      await handleLocalLogin();
      return;
    }
    // Modo Entra ID: orienta uso do botao Microsoft
    setNotification({
      show: true,
      type: "info",
      title: "Acessar com e-mail institucional",
      message:
        "Colaboradores Petrobras devem usar o botao 'Login com Microsoft' abaixo para acessar o sistema.",
    });
  };

  // ─── Loading overlay ──────────────────────────────────────────────────

  if (isRedirectingToMicrosoft) {
    return (
      <FullPageLoader
        message="Redirecionando para a Microsoft..."
        subMessage="Voce sera direcionado para a pagina de login corporativa"
      />
    );
  }

  return (
    <main
      className="min-h-screen flex"
      role="main"
      aria-label="Pagina de login"
    >
      <LoginBackground />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/images/petrobras-full-logo.png"
              alt="Petrobras - Logo oficial"
              className="h-14 sm:h-16 w-auto"
              width={200}
              height={64}
            />
          </div>

          {/* Header */}
          <header className="space-y-3 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-balance">
              Acesse sua conta
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed text-pretty">
              Sistema de transferencia segura de arquivos para destinatarios
              externos.
            </p>
          </header>

          {/* Formulario principal */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-label="Formulario de login"
          >
            {/* Campo de e-mail */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                E-mail
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (externalStep === "code") {
                      setExternalStep("email");
                      setVerificationCode(["", "", "", "", "", ""]);
                      setGeneratedCode("");
                    }
                  }}
                  disabled={isExternalUser && externalStep === "code"}
                  className="pl-10 h-12 bg-muted/50 border-border disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Campo de senha — modo DEV, usuario interno */}
            {!isExternalUser && isDevMode && (
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border"
                    required
                  />
                </div>
              </div>
            )}

            {/* Campos de codigo OTP - aparecem para externos apos envio */}
            {isExternalUser && externalStep === "code" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center text-pretty">
                  Digite o codigo de 6 digitos enviado para{" "}
                  <span className="text-primary font-semibold">{email}</span>
                </p>

                {/* Codigo retornado pelo backend em ambiente dev */}
                {generatedCode && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                          Codigo (apenas em dev):
                        </p>
                        <p className="text-2xl font-mono font-bold text-amber-900 dark:text-amber-100 tracking-wider">
                          {generatedCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inputs dos digitos */}
                <div className="flex justify-center gap-2">
                  {verificationCode.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        codeInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Reenviar codigo */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Reenviar codigo em {countdown}s
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="text-primary hover:text-primary/90"
                    >
                      {isResending ? "Reenviando..." : "Reenviar codigo"}
                    </Button>
                  )}
                </div>

                {/* Voltar */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToEmail}
                  className="w-full h-12 text-base font-medium"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar
                </Button>
              </div>
            )}

            {/* Botao de envio de codigo - apenas para externos na etapa de e-mail */}
            {isExternalUser && externalStep === "email" && (
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isLoading ? "Enviando..." : "Enviar codigo de acesso"}
              </Button>
            )}

            {/* Botao de login local — modo DEV, usuario interno */}
            {!isExternalUser && isDevMode && (
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            )}
          </form>

          {/* Botao Login com Microsoft (Entra ID via backend) — apenas modo entra */}
          {!isDevMode && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>
              {/* Hint para usuarios internos */}
              {!isExternalUser && !isDevMode && (
                <p className="text-sm text-center text-muted-foreground">
                  Colaboradores Petrobras devem acessar utilizando o botão{" "}
                  <span className="font-semibold text-secondary">
                    Login corporativo
                  </span>{" "}
                  abaixo.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleEntraIdLogin}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium border-2 hover:bg-accent bg-transparent"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" fill="none">
                  <path
                    d="M11.5 0L0 4.6V11.5C0 17.8 4.6 23 11.5 23C18.4 23 23 17.8 23 11.5V4.6L11.5 0Z"
                    fill="#00A4EF"
                  />
                </svg>
                {isLoading ? "Redirecionando..." : "Login corporativo"}
              </Button>

              {/* Link para Documentação */}
              <Link
                href="/docs"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                <BookOpen className="h-4 w-4" />
                <span>Acessar documentação do sistema</span>
              </Link>
            </div>
          )}

          {/* Botao de Teste Admin (somente em localhost) */}
          {isLocalhost && (
            <div className="border-t border-dashed border-amber-300 pt-6 mt-6">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-3 text-center uppercase tracking-wide">
                  Teste (Dev Only)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Simula login de admin para teste
                    const testAdminUser = {
                      id: "test-admin-001",
                      email: "admin@petrobras.com.br",
                      name: "Admin SCAC",
                      userType: "admin" as const,
                      isAdmin: true,
                      jobTitle: "Administrador do Sistema",
                      department: "TI - Sistemas Corporativos",
                      officeLocation: "EDISE",
                      manager: {
                        id: "mgr-001",
                        name: "Diretor Geral",
                        email: "diretor@petrobras.com.br",
                        jobTitle: "Diretor",
                        department: "Diretoria"
                      }
                    }
                    setAuth(testAdminUser, "test-token-admin", "test-refresh-admin")
                    router.push("/admin")
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold shadow-md transition-all"
                >
                  <span className="text-lg">👑</span>
                  <span>Entrar como Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground/60 pt-4">
            <p>2025 Petrobras. Todos os direitos reservados.</p>
          </footer>
        </div>
      </div>
      <NotificationModal
        open={notification.show}
        onOpenChange={(show) => setNotification({ ...notification, show })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </main>
  );
}
