import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useNotificationStore } from "./notification-store";
import { useAuditLogStore } from "./audit-log-store";
import { showAlert } from "./alert-store";
import { apiFetch } from "@/lib/services/api-fetch";

export interface ExpirationLog {
  timestamp: string;
  changedBy: string;
  previousValue: number | null;
  newValue: number;
  reason?: string;
}

export interface FileUpload {
  id: string;
  file: {
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: string;
  };
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    manager?: {
      name: string;
      email: string;
    };
    employeeId: string;
  };
  name: string;
  recipient: string;
  description: string;
  files: Array<{
    name: string;
    size: string;
    type: string;
    url?: string;
    share_file_id?: number;
    file_id?: number;
  }>;
  status: "pending" | "approved" | "rejected" | "cancelled";
  uploadDate: string;
  approvalDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  cancellationDate?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  expirationHours: number;
  expiresAt?: string;
  expiresIn?: number;
  expirationLogs: ExpirationLog[];
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    title: string;
    status: "pending" | "approved" | "rejected" | "in_progress";
    date?: string;
    comments?: string;
  }>;
}

/**
 * Converte resposta da API Python para o formato FileUpload do frontend.
 */
function mapApiToFileUpload(item: Record<string, unknown>): FileUpload {
  const sender = (item.sender as Record<string, unknown>) || {};
  const files = (item.files as Array<Record<string, unknown>>) || [];
  const workflow = (item.workflow as Record<string, unknown>) || {};
  const steps = (workflow.steps as Array<Record<string, unknown>>) || [];

  return {
    id: String(item.id),
    file: {
      name: String(item.name || ""),
      type: files[0] ? String(files[0].type || "") : "",
      size: files[0] ? String(files[0].size || "0") : "0",
      uploadDate: String(item.created_at || ""),
      status: String(item.status || "pending"),
    },
    sender: {
      id: String(sender.id || ""),
      name: String(sender.name || ""),
      email: String(sender.email || ""),
      role: String(sender.department || ""),
      avatar: null,
      manager: sender.manager
        ? {
            name: String(
              (sender.manager as Record<string, unknown>).name || "",
            ),
            email: String(
              (sender.manager as Record<string, unknown>).email || "",
            ),
          }
        : undefined,
      employeeId: String(sender.employee_id || ""),
    },
    name: String(item.name || ""),
    recipient: String(item.recipient_email || ""),
    description: String(item.description || ""),
    files: files.map((f) => ({
      name: String(f.name || ""),
      size: String(f.size || "0"),
      type: String(f.type || ""),
      url: f.url ? String(f.url) : undefined,
      share_file_id: f.share_file_id != null ? Number(f.share_file_id) : undefined,
      file_id: f.file_id != null ? Number(f.file_id) : undefined,
    })),
    status: mapStatus(String(item.status || "pending")),
    uploadDate: item.created_at
      ? new Date(String(item.created_at)).toLocaleString("pt-BR")
      : "",
    approvalDate: item.approved_at
      ? new Date(String(item.approved_at)).toLocaleString("pt-BR")
      : undefined,
    approvedBy: item.approved_by ? String(item.approved_by) : undefined,
    rejectionReason: item.rejection_reason
      ? String(item.rejection_reason)
      : undefined,
    expirationHours: Number(item.expiration_hours || 72),
    expiresAt: item.expires_at
      ? new Date(String(item.expires_at)).toLocaleString("pt-BR")
      : undefined,
    expirationLogs: [],
    currentStep: Number(workflow.current_step || 1),
    totalSteps: Number(workflow.total_steps || 3),
    steps: steps.map((s) => ({
      title: String(s.name || ""),
      status: mapStepStatus(String(s.status || "pending")),
    })),
  };
}

function mapStatus(status: string): FileUpload["status"] {
  switch (status.toLowerCase()) {
    case "ativo":
    case "aprovado":
    case "concluido":
    case "approved":
    case "active":
      return "approved";
    case "rejeitado":
    case "rejected":
      return "rejected";
    case "cancelado":
    case "expirado":
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function mapStepStatus(
  status: string,
): "pending" | "approved" | "rejected" | "in_progress" {
  if (status === "completed") return "approved";
  if (status === "current") return "in_progress";
  if (status === "failed") return "rejected";
  return "pending";
}

interface WorkflowState {
  uploads: FileUpload[];
  isLoadingUploads: boolean;
  mockZipUrl: string | null;
  mockZipBlob: Blob | null;

  // API actions
  loadUploads: (statusFilter?: string) => Promise<void>;
  loadAllSupervisorShares: () => Promise<void>;

  // Local + API actions
  initializeMockZip: () => Promise<void>;
  approveUpload: (id: string, approvedBy: string) => void;
  rejectUpload: (id: string, rejectedBy: string, reason: string) => void;
  cancelUpload: (id: string, cancelledBy: string, reason?: string) => void;
  updateExpiration: (
    id: string,
    newHours: number,
    changedBy: string,
    reason?: string,
  ) => void;
  checkIfExpired: (id: string) => boolean;
  getUploadsByStatus: (status: FileUpload["status"]) => FileUpload[];
  getUploadById: (id: string) => FileUpload | undefined;
  getUploadsByRecipient: (recipientEmail: string) => FileUpload[];
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      uploads: [],
      isLoadingUploads: false,
      mockZipUrl: null,
      mockZipBlob: null,

      /**
       * Carrega uploads do backend Python.
       * GET /api/files?status=X
       */
      loadUploads: async (statusFilter?: string) => {
        set({ isLoadingUploads: true });
        try {
          const params = new URLSearchParams();
          if (statusFilter) params.set("status", statusFilter);
          params.set("limit", "100");

          const data = await apiFetch<{ files: Record<string, unknown>[] }>(
            `/files?${params.toString()}`,
          );

          const uploads = (data.files || []).map(mapApiToFileUpload);

          // Merge com dados locais (preserva uploads locais nao sincronizados)
          set((state) => {
            const apiIds = new Set(uploads.map((u) => u.id));
            const localOnly = state.uploads.filter(
              (u) => u.id.startsWith("upload-") && !apiIds.has(u.id),
            );
            return {
              uploads: [...uploads, ...localOnly],
              isLoadingUploads: false,
            };
          });
        } catch (err) {
          // console.error(" Erro ao carregar uploads:", err)
          set({ isLoadingUploads: false });
        }
      },

      /**
       * Carrega TODOS os compartilhamentos do supervisor (pending + active + rejected).
       * GET /api/supervisor/shares
       * Usa o backend como fonte de verdade — sem dependência de estado local.
       */
      loadAllSupervisorShares: async () => {
        set({ isLoadingUploads: true });
        try {
          const data = await apiFetch<{ files: Record<string, unknown>[] }>(
            "/supervisor/shares?limit=200",
          );
          const allUploads = (data.files || []).map(mapApiToFileUpload);
          set({ uploads: allUploads, isLoadingUploads: false });
        } catch (err) {
          // console.error(" Erro ao carregar shares do supervisor:", err)
          set({ isLoadingUploads: false });
        }
      },

      initializeMockZip: async () => {
        if (get().mockZipUrl) return;

        const { createMockZipFile } =
          await import("@/lib/utils/create-mock-zip");
        const { url, blob } = await createMockZipFile();

        set((state) => ({
          mockZipUrl: url,
          mockZipBlob: blob,
          uploads: state.uploads.map((u) =>
            u.id === "upload-3"
              ? {
                  ...u,
                  files: u.files.map((f) =>
                    f.name === "Documentos_Tecnicos_Q4.zip" ? { ...f, url } : f,
                  ),
                }
              : u,
          ),
        }));
      },

      approveUpload: (id, approvedBy) => {
        const upload = get().uploads.find((u) => u.id === id);
        if (!upload) return;

        const expiresAt = new Date(
          Date.now() + upload.expirationHours * 60 * 60 * 1000,
        ).toLocaleString("pt-BR");

        // Atualiza store local imediatamente
        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "approved" as const,
                  approvalDate: new Date().toLocaleString("pt-BR"),
                  approvedBy,
                  expiresAt,
                  currentStep: u.totalSteps,
                }
              : u,
          ),
        }));

        // Chama API real do backend Python
        apiFetch(`/supervisor/approve/${id}`, {
          method: "POST",
          body: { message: `Aprovado por ${approvedBy}` },
        }).catch((err) => {
          // console.error(" Erro ao aprovar no backend:", err)
          // Reverte se a API falhar
          set((state) => ({
            uploads: state.uploads.map((u) =>
              u.id === id
                ? {
                    ...u,
                    status: "pending" as const,
                    approvalDate: undefined,
                    approvedBy: undefined,
                  }
                : u,
            ),
          }));
          showAlert.error("Erro", "Nao foi possivel aprovar no servidor");
        });

        // O backend envia e-mail de aprovação via background task.
        // O externo deve solicitar o OTP separadamente via POST /download/verify.

        useAuditLogStore.getState().addLog({
          action: "approve",
          level: "success",
          user: {
            id: "supervisor-id",
            name: approvedBy,
            email: "supervisor@petrobras.com.br",
            type: "supervisor",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Upload "${upload.name}" aprovado e disponibilizado para ${upload.recipient}`,
            metadata: {
              sender: upload.sender.name,
              recipient: upload.recipient,
              expiresAt,
              expirationHours: upload.expirationHours,
              otpSent: true,
            },
          },
        });

        useNotificationStore.getState().addNotification({
          type: "upload_success",
          priority: "high",
          title: "Upload Aprovado!",
          message: `Seu envio "${upload.name}" para ${upload.recipient} foi aprovado por ${approvedBy}. Valido por ${upload.expirationHours}h.`,
          actionUrl: "/historico",
        });
      },

      rejectUpload: (id, rejectedBy, reason) => {
        const upload = get().uploads.find((u) => u.id === id);
        if (!upload) return;

        // Atualiza store local imediatamente
        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "rejected" as const,
                  approvalDate: new Date().toLocaleString("pt-BR"),
                  approvedBy: rejectedBy,
                  rejectionReason: reason,
                }
              : u,
          ),
        }));

        // Chama API real do backend Python
        apiFetch(`/supervisor/reject/${id}`, {
          method: "POST",
          body: { reason },
        }).catch((err) => {
          // console.error(" Erro ao rejeitar no backend:", err)
          set((state) => ({
            uploads: state.uploads.map((u) =>
              u.id === id
                ? {
                    ...u,
                    status: "pending" as const,
                    rejectionReason: undefined,
                  }
                : u,
            ),
          }));
          showAlert.error("Erro", "Nao foi possivel rejeitar no servidor");
        });

        useAuditLogStore.getState().addLog({
          action: "reject",
          level: "warning",
          user: {
            id: "supervisor-id",
            name: rejectedBy,
            email: "supervisor@petrobras.com.br",
            type: "supervisor",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Upload "${upload.name}" rejeitado. Motivo: ${reason}`,
            metadata: {
              sender: upload.sender.name,
              recipient: upload.recipient,
              rejectionReason: reason,
            },
          },
        });

        useNotificationStore.getState().addNotification({
          type: "upload_error",
          priority: "high",
          title: "Upload Rejeitado",
          message: `Seu envio "${upload.name}" foi rejeitado por ${rejectedBy}. Motivo: ${reason}`,
          actionUrl: "/upload",
        });
      },

      cancelUpload: (id, cancelledBy, reason) => {
        const upload = get().uploads.find((u) => u.id === id);
        if (!upload) return;

        if (upload.status === "approved") {
          showAlert.warning(
            "Nao e Possivel Cancelar",
            "Este compartilhamento ja foi aprovado pelo supervisor e nao pode ser cancelado.",
          );
          return;
        }
        if (upload.status === "rejected") {
          showAlert.warning(
            "Nao e Possivel Cancelar",
            "Este compartilhamento ja foi rejeitado pelo supervisor e nao pode ser cancelado.",
          );
          return;
        }
        if (upload.status === "cancelled") {
          showAlert.info(
            "Ja Cancelado",
            "Este compartilhamento ja foi cancelado anteriormente.",
          );
          return;
        }

        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "cancelled" as const,
                  cancellationDate: new Date().toLocaleString("pt-BR"),
                  cancelledBy,
                  cancellationReason: reason || "Cancelado pelo usuario",
                }
              : u,
          ),
        }));

        // Chama API real para cancelar
        apiFetch(`/files/${id}`, { method: "DELETE" }).catch((err) => {
          // console.error(" Erro ao cancelar no backend:", err)
        });

        useAuditLogStore.getState().addLog({
          action: "cancel",
          level: "info",
          user: {
            id: upload.sender.id,
            name: cancelledBy,
            email: upload.sender.email,
            type: "internal",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Compartilhamento "${upload.name}" cancelado pelo usuario. Motivo: ${reason || "Nao informado"}`,
            metadata: {
              recipient: upload.recipient,
              cancellationReason: reason || "Nao informado",
            },
          },
        });

        useNotificationStore.getState().addNotification({
          type: "upload_cancelled",
          priority: "high",
          title: "Compartilhamento Cancelado",
          message: `Seu compartilhamento "${upload.name}" foi cancelado com sucesso.`,
          actionUrl: "/historico",
        });
      },

      updateExpiration: (id, newHours, changedBy, reason) => {
        const upload = get().uploads.find((u) => u.id === id);
        if (!upload) return;

        const previousValue = upload.expirationHours;
        const newExpiresAt =
          upload.status === "approved"
            ? new Date(Date.now() + newHours * 60 * 60 * 1000).toLocaleString(
                "pt-BR",
              )
            : undefined;

        const log: ExpirationLog = {
          timestamp: new Date().toLocaleString("pt-BR"),
          changedBy,
          previousValue,
          newValue: newHours,
          reason: reason || "Ajuste pelo supervisor",
        };

        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  expirationHours: newHours,
                  expiresAt: newExpiresAt,
                  expirationLogs: [...u.expirationLogs, log],
                  expiresIn: newHours,
                }
              : u,
          ),
        }));

        // Chama API real para estender
        const additionalHours = newHours - previousValue;
        if (additionalHours > 0) {
          apiFetch(`/supervisor/extend/${id}`, {
            method: "PUT",
            body: {
              additional_hours: additionalHours,
              reason: reason || "Ajuste pelo supervisor",
            },
          }).catch((err) => {
            // console.error(" Erro ao estender no backend:", err)
          });
        }

        useAuditLogStore.getState().addLog({
          action: "expiration_change",
          level: "info",
          user: {
            id: "supervisor-id",
            name: changedBy,
            email: "supervisor@petrobras.com.br",
            type: "supervisor",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Tempo de expiracao alterado de ${previousValue}h para ${newHours}h`,
            metadata: {
              previousValue,
              newValue: newHours,
              reason: reason || "Ajuste pelo supervisor",
              sender: upload.sender.name,
            },
          },
        });

        useNotificationStore.getState().addNotification({
          type: "file_expired",
          priority: "medium",
          title: "Tempo de expiracao alterado",
          message: `${changedBy} alterou o tempo de validade de "${upload.name}" de ${previousValue}h para ${newHours}h`,
          actionUrl: "/historico",
        });
      },

      checkIfExpired: (id) => {
        const upload = get().uploads.find((u) => u.id === id);
        if (!upload || !upload.expiresAt) return false;
        const expirationDate = new Date(
          upload.expiresAt.split(" - ")[0].split("/").reverse().join("-"),
        );
        return expirationDate < new Date();
      },

      getUploadsByStatus: (status) => {
        return get().uploads.filter((u) => u.status === status);
      },

      getUploadById: (id) => {
        return get().uploads.find((u) => u.id === id);
      },

      getUploadsByRecipient: (recipientEmail: string) => {
        return get().uploads.filter(
          (u) => u.recipient === recipientEmail && u.status === "approved",
        );
      },
    }),
    {
      name: "petrobras-workflow-storage",
    },
  ),
);
