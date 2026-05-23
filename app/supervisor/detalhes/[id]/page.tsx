"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Search,
  CheckCircle,
  MailCheck,
  MailX,
  Mail,
  SendHorizonal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZipViewerModal } from "@/components/supervisor/zip-viewer-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkflowStore } from "@/lib/stores/workflow-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/shared/app-header";
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { Separator } from "@/components/ui/separator";

export default function SupervisorDetailsPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    uploads,
    approveUpload,
    rejectUpload,
    initializeMockZip,
    mockZipBlob,
    loadAllSupervisorShares,
  } = useWorkflowStore();
  const { user } = useAuthStore();

  const [id, setId] = useState<string>("");
  const [uploadData, setUploadData] = useState<any>(null);
  const [localFiles, setLocalFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zipViewerOpen, setZipViewerOpen] = useState(false);
  const [selectedZipFile, setSelectedZipFile] = useState<{
    name: string;
    url?: string;
    blob?: Blob;
  } | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [individualApprovalMode, setIndividualApprovalMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [removingFileId, setRemovingFileId] = useState<number | null>(null);

  // Email log state
  const [emailLogs, setEmailLogs] = useState<
    Array<{
      id: number;
      email_type: string;
      to_email: string;
      subject: string;
      status: string;
      sent_at: string | null;
      error_message: string | null;
      created_at: string;
    }>
  >([]);
  const [emailLogsLoaded, setEmailLogsLoaded] = useState(false);
  const [resending, setResending] = useState(false);

  const fetchEmailLogs = useCallback(async (shareId: string) => {
    try {
      const token = useAuthStore(state => state.accessToken);
      const res = await fetch(`/api/supervisor/shares/${shareId}/email-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEmailLogs(data.email_logs || []);
      setEmailLogsLoaded(true);
    } catch {
      setEmailLogsLoaded(true);
    }
  }, []);

  const handleResendNotification = async () => {
    if (!id) return;
    setResending(true);
    try {
      const token = useAuthStore(state => state.accessToken);
      const res = await fetch(
        `/api/supervisor/shares/${id}/resend-notification`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        toast({
          title: "E-mail reenviado",
          description: "Notificação reenviada com sucesso.",
        });
        fetchEmailLogs(id);
      } else {
        const err = await res.json();
        toast({
          title: "Erro",
          description: err.detail || "Falha ao reenviar.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível reenviar.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const resolveParams = async () => {
      if (params instanceof Promise) {
        const resolvedParams = await params;
        setId(resolvedParams.id);
      } else {
        setId(params.id);
      }
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const init = async () => {
      await initializeMockZip();
      // Se o store não tiver os dados (acesso direto / refresh), busca da API
      let foundUpload = uploads.find((u) => u.id === id);
      if (!foundUpload) {
        await loadAllSupervisorShares();
        foundUpload = useWorkflowStore
          .getState()
          .uploads.find((u) => u.id === id);
      }
      setUploadData(foundUpload || null);
      setLocalFiles(foundUpload?.files || []);
      setIsLoading(false);
      // Busca logs de e-mail
      if (!id.startsWith("upload-")) {
        fetchEmailLogs(id);
      }
    };

    init();
  }, [id, uploads, initializeMockZip]);

  const handleApprove = () => {
    if (!uploadData) return;

    const supervisorName = user?.name || "Supervisor";
    approveUpload(uploadData.id, supervisorName);

    toast({
      title: "Documento aprovado",
      description: `O documento foi aprovado com sucesso`,
    });

    router.push("/supervisor");
  };

  // Download de todos os arquivos como ZIP
  const handleDownloadZip = async () => {
    if (!id) return;
    setIsDownloading(true);
    try {
      const token = useAuthStore(state => state.accessToken);
      const res = await fetch(`/api/supervisor/shares/${id}/download-zip`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let msg = "Falha ao gerar o arquivo ZIP.";
        try {
          const err = await res.json();
          msg = err.error?.message || err.detail || msg;
        } catch {}
        toast({
          title: "Erro no download",
          description: msg,
          variant: "destructive",
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compartilhamento-${id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Erro",
        description: "N\u00e3o foi poss\u00edvel baixar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Remove um arquivo individual do share
  const handleRemoveFile = async (shareFileId: number, index: number) => {
    if (!id) return;
    setRemovingFileId(shareFileId);
    try {
      const token = useAuthStore(state => state.accessToken);
      const res = await fetch(
        `/api/supervisor/shares/${id}/files/${shareFileId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Erro",
          description:
            data.error?.message || data.detail || "Falha ao remover arquivo.",
          variant: "destructive",
        });
        return;
      }
      // Remove da lista local
      const updatedFiles = localFiles.filter((_, i) => i !== index);
      setLocalFiles(updatedFiles);
      setSelectedFiles(new Set());
      // Sincroniza a store Zustand fora do updater para não disparar setState durante render
      useWorkflowStore.setState((state) => ({
        uploads: state.uploads.map((u) =>
          u.id === id ? { ...u, files: updatedFiles } : u,
        ),
      }));
      if (data.share_auto_rejected) {
        toast({
          title: "Compartilhamento rejeitado",
          description:
            "Todos os arquivos foram removidos. O compartilhamento foi rejeitado automaticamente.",
        });
        setUploadData((prev: any) =>
          prev ? { ...prev, status: "rejected" } : prev,
        );
        // Atualiza status na store também
        useWorkflowStore.setState((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id ? { ...u, status: "rejected" } : u,
          ),
        }));
        setIndividualApprovalMode(false);
      } else {
        toast({
          title: "Arquivo removido",
          description: `${data.remaining_files} arquivo(s) restante(s).`,
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "N\u00e3o foi poss\u00edvel remover o arquivo.",
        variant: "destructive",
      });
    } finally {
      setRemovingFileId(null);
    }
  };

  const handleConfirmRejection = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigat\u00f3rio",
        description: "Por favor, informe o motivo da rejei\u00e7\u00e3o",
        variant: "destructive",
      });
      return;
    }

    if (!uploadData) return;

    // Se estiver em modo individual, remove cada arquivo selecionado individualmente
    if (individualApprovalMode && selectedFiles.size > 0) {
      const selectedIndexes = Array.from(selectedFiles);
      const removeNext = async (indexes: number[]) => {
        for (const idx of indexes) {
          const file = localFiles[idx];
          if (file?.share_file_id) {
            await handleRemoveFile(file.share_file_id, idx);
          }
        }
      };
      removeNext(selectedIndexes);
      setShowRejectDialog(false);
      setRejectionReason("");
      return;
    }

    rejectUpload(uploadData.id, user?.name || "Supervisor", rejectionReason);

    toast({
      title: "Upload Rejeitado",
      description: `O envio foi rejeitado. ${uploadData.sender?.name || "Remetente"} foi notificado.`,
      variant: "destructive",
    });

    setShowRejectDialog(false);
    setRejectionReason("");
    router.push("/supervisor");
  };

  const handleOpenZipViewer = (
    fileName: string,
    fileUrl?: string,
    blob?: Blob,
  ) => {
    setSelectedZipFile({ name: fileName, url: fileUrl, blob });
    setZipViewerOpen(true);
  };

  const toggleFileSelection = (index: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (localFiles) {
      setSelectedFiles(new Set(localFiles.map((_: any, i: number) => i)));
    }
  };

  const deselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  const handleApproveSelected = () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para aprovar",
        variant: "destructive",
      });
      return;
    }

    if (!localFiles) return;

    const fileNames = localFiles
      .filter((_: any, i: number) => selectedFiles.has(i))
      .map((f: any) => f.name)
      .join(", ");

    toast({
      title: `${selectedFiles.size} arquivo(s) aprovado(s)`,
      description: `Arquivos aprovados: ${fileNames}`,
    });

    setIndividualApprovalMode(false);
    setSelectedFiles(new Set());
  };

  const handleRejectSelected = () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para rejeitar",
        variant: "destructive",
      });
      return;
    }

    setShowRejectDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader subtitle="Módulo Supervisor" />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                Carregando detalhes do documento...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!uploadData) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader subtitle="Módulo Supervisor" />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                Documento não encontrado
              </p>
              <Button
                onClick={() => router.push("/supervisor")}
                className="mt-4"
              >
                Voltar para Supervisor
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const files = uploadData.files || [];
  const sender = uploadData.sender || {
    name: "Desconhecido",
    email: "",
    role: "",
  };
  const history = uploadData.history || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Módulo Supervisor" />

      <div className="container max-w-7xl mx-auto px-6 py-8">
        <BreadcrumbNav
          items={[
            { label: "Início", href: "/supervisor" },
            { label: "Arquivos", href: "/supervisor" },
            { label: "Detalhe do Arquivo" },
          ]}
          dashboardLink="/supervisor"
        />

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Visualização de Documento
          </h1>
          <p className="text-muted-foreground text-lg">
            Visualize os detalhes do arquivo enviado e seu compartilhamento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Detalhes do Arquivo
                </h2>
                <Badge
                  className={
                    uploadData.status === "approved"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : uploadData.status === "rejected"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                  }
                >
                  {uploadData.status === "pending" && (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {uploadData.status === "approved" && (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  )}
                  {uploadData.status === "rejected" && (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {uploadData.status === "pending"
                    ? "Pendente"
                    : uploadData.status === "approved"
                      ? "Aprovado"
                      : "Rejeitado"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Nome do Arquivo
                  </p>
                  <p className="font-semibold text-foreground text-lg">
                    {uploadData.name}
                  </p>
                </div>

                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Remetente
                    </p>
                    <p className="font-medium text-foreground">{sender.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sender.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Destinatário
                    </p>
                    <p className="font-medium text-foreground">
                      {uploadData.recipient}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Data de Upload
                    </p>
                    <p className="font-medium text-foreground">
                      {uploadData.uploadDate}
                    </p>
                  </div>
                </div>

                {uploadData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Descrição
                    </p>
                    <p className="text-foreground">{uploadData.description}</p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Card de status de e-mail */}
              {emailLogsLoaded &&
                !id.startsWith("upload-") &&
                (() => {
                  const notifLog = emailLogs.find(
                    (l) => l.email_type === "approval_request",
                  );
                  const approvalLog = emailLogs.find(
                    (l) =>
                      l.email_type === "approval_granted" ||
                      l.email_type === "approval_rejected" ||
                      l.email_type === "file_share",
                  );

                  return (
                    <div className="mb-6 rounded-xl border bg-muted/30 p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Histórico de Notificações por E-mail
                      </h3>

                      {emailLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum e-mail registrado para este compartilhamento.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {emailLogs.map((log) => {
                            const isOk = log.status === "sent";
                            const label: Record<string, string> = {
                              approval_request: "Notificação ao supervisor",
                              approval_granted: "Aprovação ao solicitante",
                              file_share: "Disponibilização ao destinatário",
                              approval_rejected: "Rejeição ao solicitante",
                            };
                            return (
                              <div
                                key={log.id}
                                className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${isOk ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isOk ? (
                                    <MailCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <MailX className="h-4 w-4 text-red-600 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p
                                      className={`text-xs font-medium ${isOk ? "text-emerald-700" : "text-red-700"}`}
                                    >
                                      {label[log.email_type] || log.email_type}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {log.to_email}
                                      {log.sent_at
                                        ? ` · ${new Date(log.sent_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                                        : ""}
                                    </p>
                                    {!isOk && log.error_message && (
                                      <p className="text-xs text-red-600 truncate max-w-xs">
                                        {log.error_message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs flex-shrink-0 ${isOk ? "border-emerald-500/50 text-emerald-700" : "border-red-500/50 text-red-700"}`}
                                >
                                  {isOk ? "Enviado" : "Falhou"}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Botão de reenvio — disponível apenas para shares já decididos */}
                      {uploadData.status !== "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 mt-1"
                          disabled={resending}
                          onClick={handleResendNotification}
                        >
                          {resending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <SendHorizonal className="h-3 w-3" />
                          )}
                          Reenviar notificação de{" "}
                          {uploadData.status === "approved"
                            ? "aprovação"
                            : "rejeição"}
                        </Button>
                      )}
                    </div>
                  );
                })()}

              <div className="flex gap-3">
                {/* Botão Download ZIP — apenas enquanto PENDENTE */}
                {uploadData.status === "pending" &&
                  !id.startsWith("upload-") && (
                    <Button
                            className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
                      disabled={isDownloading}
                      onClick={handleDownloadZip}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isDownloading ? "Baixando..." : "Baixar Arquivos (ZIP)"}
                    </Button>
                  )}

                {uploadData.status === "pending" && (
                  <>
                    <Button
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => setShowRejectDialog(true)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </>
                )}
              </div>

              {localFiles.length > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Arquivos no pacote ({localFiles.length})
                    </h3>
                    {uploadData.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIndividualApprovalMode(!individualApprovalMode);
                          if (individualApprovalMode) {
                            setSelectedFiles(new Set());
                          }
                        }}
                      >
                        {individualApprovalMode
                          ? "Cancelar Seleção"
                          : "Remover Individual"}
                      </Button>
                    )}
                  </div>

                  {individualApprovalMode && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                        Selecione os arquivos que deseja remover deste
                        compartilhamento. Se todos forem removidos, o
                        compartilhamento será rejeitado automaticamente.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllFiles}
                        >
                          Selecionar Todos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={deselectAllFiles}
                        >
                          Desmarcar Todos
                        </Button>
                        {selectedFiles.size > 0 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleRejectSelected}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Remover {selectedFiles.size}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {localFiles.map((file: any, index: number) => {
                      const isZip = file.name?.toLowerCase().endsWith(".zip");
                      return (
                        <div
                          key={file.share_file_id ?? index}
                          className={`flex items-center justify-between p-3 rounded transition-colors ${
                            individualApprovalMode
                              ? selectedFiles.has(index)
                                ? "bg-blue-100 dark:bg-blue-950/40 border-2 border-blue-500"
                                : "bg-background hover:bg-muted cursor-pointer border-2 border-transparent"
                              : "bg-background"
                          }`}
                          onClick={() =>
                            individualApprovalMode && toggleFileSelection(index)
                          }
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {individualApprovalMode && (
                              <Checkbox
                                checked={selectedFiles.has(index)}
                                onCheckedChange={() =>
                                  toggleFileSelection(index)
                                }
                              />
                            )}
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">
                                {file.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {file.size} • {file.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isZip && file.url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenZipViewer(
                                    file.name,
                                    file.url,
                                    mockZipBlob || undefined,
                                  );
                                }}
                              >
                                <Search className="h-4 w-4 mr-2" />
                                Ver Conte\u00fado
                              </Button>
                            )}
                            {individualApprovalMode && file.share_file_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-500/10"
                                disabled={removingFileId === file.share_file_id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(file.share_file_id, index);
                                }}
                              >
                                {removingFileId === file.share_file_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Remetente
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">
                    {sender.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sender.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{sender.role}</p>
                </div>
              </div>
            </Card>

            {/* <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Histórico de Envios
              </h2>
              <div className="space-y-4">
                {history.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {item.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card> */}
          </div>
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Upload</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para notificar o remetente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Rejeição *</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmRejection}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedZipFile && (
        <ZipViewerModal
          isOpen={zipViewerOpen}
          onClose={() => {
            setZipViewerOpen(false);
            setSelectedZipFile(null);
          }}
          fileName={selectedZipFile.name}
          fileUrl={selectedZipFile.url}
          fileBlob={selectedZipFile.blob}
        />
      )}
    </div>
  );
}
