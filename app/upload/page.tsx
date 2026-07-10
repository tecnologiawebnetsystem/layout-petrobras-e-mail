"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWorkflowStore } from "@/lib/stores/workflow-store";
import { AppHeader } from "@/components/shared/app-header";
import { DragDropZone } from "@/components/upload/drag-drop-zone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NotificationModal } from "@/components/shared/notification-modal";
import { Send, Sparkles } from "lucide-react";
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard";
import type { FileDetail } from "@/components/dashboard/metric-detail-modal";
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { UploadSuccessModal } from "@/components/upload/upload-success-modal";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/shared/page-header";
import { ApproverInfoCard } from "@/components/sender/approver-info-card";
import { RecipientField } from "@/components/upload/recipient-field";
import { ExpirationSelect } from "@/components/upload/expiration-select";

export default function UploadPage() {
  const { user, isAuthenticated, _hasHydrated, accessToken } = useAuthStore();
  const { uploads, loadUploads } = useWorkflowStore();
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [expirationHours, setExpirationHours] = useState<number>(168); // Padrão: 7 dias
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
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

  const [uploadSuccessData, setUploadSuccessData] = useState<{
    name: string;
    recipient: string;
    files: Array<{ name: string; size: string; type: string }>;
    expirationHours: number;
    senderEmail: string; // Adicionado campo senderEmail
  } | null>(null);
  // Validação de e-mail
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || (user?.userType !== "internal" && user?.userType !== "supervisor")) {
      router.push("/");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    loadUploads();
  }, []);

  const handleFilesSelected = async (newFiles: File[]) => {
    const dangerousExtensions = [
      ".exe",
      ".dll",
      ".bat",
      ".cmd",
      ".com",
      ".msi",
      ".scr",
      ".vbs",
      ".ps1",
      ".sh",
    ];
    const blockedFiles: string[] = [];

    for (const file of newFiles) {
      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      if (dangerousExtensions.includes(extension)) {
        blockedFiles.push(file.name);
      }
    }

    if (blockedFiles.length > 0) {
      setNotification({
        show: true,
        type: "error",
        title: "Arquivos Bloqueados por Segurança",
        message: `Os seguintes arquivos não podem ser enviados por motivos de segurança: ${blockedFiles.join(", ")}. Extensões bloqueadas: .exe, .dll, .bat, .cmd, .com, .msi, .scr, .vbs, .ps1, .sh`,
      });
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campo obrigatório",
        message: "Por favor, informe o destinatário.",
      });
      return;
    }
    if (!isValidEmail(recipient)) {
      setNotification({
        show: true,
        type: "warning",
        title: "E-mail inválido",
        message: "Por favor, informe um e-mail de destinatário válido.",
      });
      return;
    }
    if (files.length === 0) {
      setNotification({
        show: true,
        type: "warning",
        title: "Nenhum arquivo",
        message: "Por favor, selecione pelo menos um arquivo.",
      });
      return;
    }

    if (!description) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campo obrigatório",
        message: "Por favor, descreva o conteúdo dos arquivos.",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Monta payload JSON exigido pelo backend
      const payload = JSON.stringify({
        area_id: null, // null = usar/criar área automática do usuário
        external_email: recipient,
        created_by_id: Number(user!.id),
        expiration_hours: expirationHours,
        name: description.substring(0, 255),
        description,
        consumption_policy: "apos_todos",
        file_ids: [],
      });

      // FormData com payload + arquivos
      const formData = new FormData();
      formData.append("payload", payload);
      for (const file of files) {
        formData.append("files", file, file.name);
      }

      // XHR para rastrear progresso real de upload
      const result = await new Promise<{
        success?: boolean;
        data?: unknown;
        error?: { code: string; message: string };
        _status: number;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/shares/create");
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText) as {
              success?: boolean;
              data?: unknown;
              error?: { code: string; message: string };
            };
            resolve({ ...data, _status: xhr.status });
          } catch {
            resolve({ _status: xhr.status });
          }
        };
        xhr.onerror = () =>
          reject(new Error("Falha de rede ao enviar os arquivos."));
        xhr.ontimeout = () =>
          reject(new Error("Tempo de envio esgotado. Tente novamente."));
        xhr.send(formData);
      });

      if (result._status >= 400 || result.success === false) {
        const isS3Failure = result._status === 502;
        const isMipFailure = result._status === 422;
        const errorCode = result.error?.code ?? "";

        let title = "Erro ao enviar arquivos";
        let message =
          result.error?.message ?? "Ocorreu um erro inesperado. Tente novamente.";

        if (isS3Failure) {
          title = "Falha no armazenamento seguro";
          message =
            "Os arquivos não foram enviados ao armazenamento seguro (S3). Nenhum registro foi criado. Tente novamente ou contate o suporte.";
        } else if (isMipFailure) {
          if (errorCode === "MIP_UNSUPPORTED_EXTENSION") {
            title = "Formato de arquivo não suportado";
            // mensagem detalhada vem do backend (ex: "O arquivo 'foo.zip' possui extensão...")
          } else if (errorCode === "MIP_SDK_ERROR") {
            title = "Falha no processamento de segurança";
          } else if (errorCode === "MIP_NOT_CONFIGURED") {
            title = "Serviço de segurança indisponível";
          } else {
            title = "Impedimento no processamento de segurança (MIP)";
          }
        }

        setNotification({
          show: true,
          type: "error",
          title,
          message,
        });
        return;
      }

      // Sucesso: atualiza store a partir do backend (evita duplicação de share)
      const filesMeta = files.map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        type: f.name.split(".").pop()?.toUpperCase() || "FILE",
      }));

      // NÃO chamar addUpload() — ele faria um segundo POST ao backend criando share duplicado.
      // O share já foi criado pelo XHR acima. Apenas recarrega a lista.
      loadUploads();

      setUploadSuccessData({
        name: description.substring(0, 50),
        recipient,
        files: filesMeta,
        expirationHours,
        senderEmail: user!.email,
      });

      setShowSuccess(true);

      setTimeout(() => {
        setRecipient("");
        setDescription("");
        setFiles([]);
        setExpirationHours(168);
        setShowSuccess(false);
      }, 1000);
    } catch (error) {
      console.error("[upload] handleSubmit error:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao enviar arquivos",
        message: msg,
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const uploadStats = {
    total: uploads.length,
    pending: uploads.filter((u) => u.status === "pending").length,
    approved: uploads.filter((u) => u.status === "approved").length,
    rejected: uploads.filter((u) => u.status === "rejected").length,
  };

  const uploadFiles: FileDetail[] = uploads.flatMap((u) =>
    (u.files ?? []).map((f, i) => ({
      id: `${u.id}-${i}`,
      name: f.name,
      size: f.size,
      date: u.uploadDate,
      recipient: u.recipient,
      status: u.status,
    })),
  );

  return (
    <ProtectedRoute allowedUserTypes={["internal", "supervisor"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppHeader subtitle="Solucao de Compartilhamento de Arquivos Confidenciais" />

        <main className="container mx-auto px-4 py-6 max-w-7xl pb-20">
          <BreadcrumbNav
            items={[
              { label: "Inicio", href: "/upload" },
              { label: "Upload de Arquivos" },
            ]}
            dashboardLink="/upload"
          />

          <PageHeader
            icon={Sparkles}
            title="Transferencia Segura de Arquivos"
            subtitle="Envie documentos para destinatarios externos com seguranca"
          />

          <MetricsDashboard
            {...uploadStats}
            userType="internal"
            files={uploadFiles}
          />

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border p-10 space-y-8 relative overflow-hidden mt-8">
            <form onSubmit={handleSubmit} className="space-y-7">
              <ApproverInfoCard userType={user?.userType} manager={user?.manager} />

              <RecipientField
                value={recipient}
                onChange={setRecipient}
                disabled={isLoading || showSuccess}
              />
              <div className="space-y-3">
                <Label className="text-base font-medium">Anexar Arquivos</Label>
                <DragDropZone
                  onFilesSelected={handleFilesSelected}
                  selectedFiles={files}
                  onRemoveFile={handleFileRemove}
                  aria-label="Área para anexar arquivos"
                />
              </div>
              <ExpirationSelect
                value={expirationHours}
                onChange={setExpirationHours}
                disabled={isLoading || showSuccess}
              />
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-medium">
                  Descrição do Envio (obrigatório)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o conteúdo e a finalidade dos arquivos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[140px] resize-none text-base"
                  required
                  aria-label="Descrição do envio"
                  disabled={isLoading || showSuccess}
                />
              </div>
              <div className="flex flex-col gap-3 pt-6">
                {isLoading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Enviando arquivos ({files.length})…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading || showSuccess}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-10 text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar arquivos para aprovacao"
                  >
                    {isLoading && (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    )}
                    {showSuccess && <Sparkles className="h-5 w-5 mr-2" />}
                    <Send className="h-5 w-5 mr-2" />
                    {isLoading
                      ? `Enviando ${files.length} arquivo${files.length !== 1 ? "s" : ""}…`
                      : showSuccess
                        ? "Enviado!"
                        : "Enviar para Aprovação"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </main>
        <ScrollToTop />
        <NotificationModal
          open={notification.show}
          onOpenChange={(show) => setNotification({ ...notification, show })}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />
        {uploadSuccessData && (
          <UploadSuccessModal
            open={uploadSuccessData !== null}
            onOpenChange={(open) => {
              if (!open) setUploadSuccessData(null);
            }}
            uploadData={uploadSuccessData}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
