"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { getClientEnv } from "@/lib/env";

interface MipAuthModalProps {
  open: boolean;
  /** Nome do arquivo que requer autenticação */
  fileName: string;
  /** Token Bearer do usuário logado (necessário para device_code) */
  accessToken: string;
  /** Email do usuário logado — pré-preenche a conta no login_hint */
  userEmail?: string;
  onSuccess: (aadrmToken: string, policyToken: string | null) => void;
  onCancel: () => void;
}

/**
 * Modo de autenticação MIP — controlado por NEXT_PUBLIC_MIP_AUTH_MODE:
 *
 *  "popup"        → MSAL popup (1 clique, sem código)
 *                   Requer: permissão delegada AADRM no app AAD-DEV-A12022
 *                   Como habilitar: Azure AD → AAD-DEV-A12022 → API Permissions
 *                   → Add → Microsoft Rights Management Services
 *                   → Delegated → user_impersonation → Grant admin consent
 *
 *  "device_code"  → Device code via backend (padrão atual, sem permissão extra)
 *                   Gera código que o usuário digita em login.microsoft.com/device
 */
type MipAuthMode = "popup" | "device_code";

function getMipAuthMode(): MipAuthMode {
  const mode = getClientEnv("NEXT_PUBLIC_MIP_AUTH_MODE");
  return mode === "popup" ? "popup" : "device_code";
}

type Phase =
  | "idle"
  | "opening"
  | "waiting"
  | "success"
  | "error";

const POLL_INTERVAL_MS = 3000;

export function MipAuthModal({
  open,
  fileName,
  accessToken,
  userEmail,
  onSuccess,
  onCancel,
}: MipAuthModalProps) {
  const mode = getMipAuthMode();

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // device_code mode
  const [userCode, setUserCode] = useState("");
  const [verificationUri, setVerificationUri] = useState("");
  const [copied, setCopied] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<string | null>(null);
  const tabRef = useRef<Window | null>(null);

  useEffect(() => {
    if (!open) {
      stopPolling();
      setPhase("idle");
      setErrorMsg(null);
      setUserCode("");
    }
  }, [open]);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  // ── Modo POPUP ──────────────────────────────────────────────────────────────

  async function handlePopup() {
    setPhase("opening");
    setErrorMsg(null);
    try {
      const { acquireMipTokens } = await import("@/lib/msal-aip");
      const { aadrmToken, policyToken } = await acquireMipTokens();
      setPhase("success");
      setTimeout(() => onSuccess(aadrmToken, policyToken), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha na autenticação.";
      setPhase("error");
      setErrorMsg(msg);
    }
  }

  // ── Modo DEVICE CODE ────────────────────────────────────────────────────────

  async function handleDeviceCode() {
    setPhase("opening");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/mip/auth/device-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.session_id)
        throw new Error(data?.error?.message ?? "Falha ao iniciar autenticação.");

      sessionRef.current = data.session_id;
      setUserCode(data.user_code ?? "");
      setVerificationUri(data.verification_uri ?? "https://login.microsoft.com/device");
      setPhase("waiting");
      pollRef.current = setInterval(() => pollDeviceCodeToken(data.session_id), POLL_INTERVAL_MS);
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  }

  async function pollDeviceCodeToken(sessionId: string) {
    try {
      const res = await fetch(`/api/mip/auth/token/${sessionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        stopPolling();
        setPhase("error");
        setErrorMsg(data?.error?.message ?? "Autenticação falhou ou código expirou.");
        return;
      }
      if (data.status === "ready") {
        stopPolling();
        try { tabRef.current?.close(); } catch { /* ignorar */ }
        setPhase("success");
        setTimeout(() => onSuccess(data.aadrm_token, data.policy_token ?? null), 800);
      }
    } catch { /* erro transitório */ }
  }

  function handleOpenTab() {
    const url = userEmail
      ? `${verificationUri}?login_hint=${encodeURIComponent(userEmail)}`
      : verificationUri;
    tabRef.current = window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCancel() {
    stopPolling();
    try { tabRef.current?.close(); } catch { /* ignorar */ }
    const sid = sessionRef.current;
    if (sid) {
      fetch(`/api/mip/auth/token/${sid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
      sessionRef.current = null;
    }
    onCancel();
  }

  const handleAuthorize = mode === "popup" ? handlePopup : handleDeviceCode;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-4">
          <div className={`flex justify-center p-4 rounded-full w-fit mx-auto transition-colors ${
            phase === "success"
              ? "bg-green-50 dark:bg-green-950/20"
              : "bg-amber-50 dark:bg-amber-950/20"
          }`}>
            {phase === "success"
              ? <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              : <ShieldCheck   className="h-12 w-12 text-amber-600 dark:text-amber-400" />}
          </div>

          <DialogTitle className="text-center text-xl font-bold">
            {phase === "success" ? "Autenticado com sucesso!" : "Autorização necessária"}
          </DialogTitle>

          <DialogDescription className="text-center text-sm leading-relaxed">
            {phase === "idle" && (
              <>
                O arquivo <strong>"{fileName}"</strong> está protegido com criptografia.
                <span className="block mt-1 text-muted-foreground">
                  {mode === "popup"
                    ? <>Clique em <strong>Autorizar</strong> — uma janela da Microsoft abrirá.
                        Basta selecionar sua conta e confirmar.</>
                    : <>Clique em <strong>Autorizar</strong> para gerar um código de acesso.</>}
                </span>
              </>
            )}
            {phase === "opening" && (
              <span className="text-muted-foreground">
                {mode === "popup" ? "Abrindo janela de autenticação…" : "Gerando código de acesso…"}
              </span>
            )}
            {phase === "waiting" && mode === "device_code" && (
              <span className="text-muted-foreground">
                Use o código abaixo para autorizar na janela da Microsoft.
              </span>
            )}
            {phase === "success" && (
              <span className="text-muted-foreground">Processando o arquivo…</span>
            )}
            {phase === "error" && (
              <span className="text-muted-foreground">
                Tente novamente ou entre em contato com o suporte.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* ── Device Code: código em destaque ── */}
        {phase === "waiting" && mode === "device_code" && userCode && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Código de acesso
              </p>
              <div className="flex items-center justify-between rounded-md bg-background border px-4 py-3">
                <span className="font-mono text-3xl font-bold tracking-[0.4em] select-all">
                  {userCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="ml-3 p-1.5 rounded hover:bg-muted transition-colors"
                  title="Copiar código"
                >
                  {copied
                    ? <CheckCheck className="h-5 w-5 text-green-500" />
                    : <Copy       className="h-5 w-5 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Passos</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li><strong className="text-foreground">Copie o código</strong> acima</li>
                <li>
                  <button
                    onClick={handleOpenTab}
                    className="text-primary underline inline-flex items-center gap-1 font-medium"
                  >
                    Abrir janela Microsoft <ExternalLink className="h-3 w-3" />
                  </button>
                </li>
                <li>
                  Cole o código e confirme com sua conta{" "}
                  <strong className="text-foreground">@petrobras.com.br</strong>
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Aguardando confirmação automaticamente…</span>
            </div>
          </div>
        )}

        {/* ── Erro ── */}
        {phase === "error" && errorMsg && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {phase !== "success" && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={phase === "opening"}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          )}

          {(phase === "idle" || phase === "error") && (
            <Button onClick={handleAuthorize} className="w-full sm:w-auto gap-2">
              <ShieldCheck className="h-4 w-4" />
              {phase === "error" ? "Tentar novamente" : "Autorizar processamento"}
            </Button>
          )}

          {phase === "opening" && (
            <Button disabled className="w-full sm:w-auto gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "popup" ? "Aguardando popup…" : "Gerando código…"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
