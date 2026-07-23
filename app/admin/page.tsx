"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiFetch } from "@/lib/services/api-fetch";
import { AppHeader } from "@/components/shared/app-header";
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DraggableScroll } from "@/components/ui/draggable-scroll";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  FileText,
  Activity,
  HardDrive,
  Mail,
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Download,
} from "lucide-react";

// Tipos
interface DashboardMetrics {
  users: {
    total: number;
    internal: number;
    external: number;
    supervisors: number;
    admins: number;
    active: number;
  };
  shares: {
    total: number;
    pending: number;
    approved: number;
    active: number;
    rejected: number;
    expired: number;
  };
  files: {
    total: number;
    storage_bytes: number;
    storage_mb: number;
  };
  audit: {
    total_logs: number;
    logs_last_7_days: number;
  };
  emails: {
    total_sent: number;
  };
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  type: string;
  department: string | null;
  job_title: string | null;
  is_supervisor: boolean;
  is_admin: boolean;
  status: boolean;
  created_at: string | null;
  last_login: string | null;
}

interface ShareItem {
  id: number;
  name: string;
  description: string | null;
  external_email: string;
  status: string;
  created_at: string | null;
  expires_at: string | null;
  approved_at: string | null;
  files_count: number;
  creator: { id: number; name: string; email: string } | null;
  approver: { id: number; name: string; email: string } | null;
}

interface LogItem {
  id: number;
  action: string;
  detail: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string | null;
  share_id: number | null;
  user: { id: number; name: string; email: string } | null;
}

interface TrackingData {
  user: UserItem & { manager_id: number | null };
  shares_created: Array<{
    id: number;
    name: string;
    external_email: string;
    status: string;
    created_at: string | null;
  }>;
  shares_approved: Array<{
    id: number;
    name: string;
    external_email: string;
    status: string;
    approved_at: string | null;
  }>;
  files_uploaded: Array<{
    id: number;
    name: string;
    size_bytes: number;
    mime_type: string;
    created_at: string | null;
  }>;
  recent_logs: Array<{
    id: number;
    action: string;
    detail: string | null;
    ip: string | null;
    created_at: string | null;
  }>;
  stats: {
    total_shares_created: number;
    total_shares_approved: number;
    total_files_uploaded: number;
    total_logs: number;
  };
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  limit: number;
}

function AdminContent() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(
    null,
  );
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersTypeFilter, setUsersTypeFilter] = useState("all");

  // Shares state
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [sharesPagination, setSharesPagination] = useState<Pagination | null>(
    null,
  );
  const [sharesPage, setSharesPage] = useState(1);
  const [sharesSearch, setSharesSearch] = useState("");
  const [sharesStatusFilter, setSharesStatusFilter] = useState("all");

  // Logs state
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState<Pagination | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsActionFilter, setLogsActionFilter] = useState("all");
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  // Tracking state
  const [trackingUserEmail, setTrackingUserEmail] = useState("");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Initial load
  useEffect(() => {
    if (!_hasHydrated) return;
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, [_hasHydrated]);

  // Load dashboard metrics
  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const data = await apiFetch<DashboardMetrics>("/admin/dashboard");
      setMetrics(data);
    } catch (error) {
      console.error("[Admin] Erro ao carregar metricas:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(usersPage),
        limit: "20",
      });
      if (usersSearch) params.set("search", usersSearch);
      if (usersTypeFilter !== "all") params.set("user_type", usersTypeFilter);

      const data = await apiFetch<{
        users: UserItem[];
        pagination: Pagination;
      }>(`/admin/users?${params.toString()}`);
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (error) {
      console.error("[Admin] Erro ao carregar usuarios:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load shares
  const loadShares = async () => {
    setSharesLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(sharesPage),
        limit: "20",
      });
      if (sharesSearch) params.set("search", sharesSearch);
      if (sharesStatusFilter !== "all")
        params.set("status", sharesStatusFilter);

      const data = await apiFetch<{
        shares: ShareItem[];
        pagination: Pagination;
      }>(`/admin/shares?${params.toString()}`);
      setShares(data.shares);
      setSharesPagination(data.pagination);
    } catch (error) {
      console.error("[Admin] Erro ao carregar shares:", error);
    } finally {
      setSharesLoading(false);
    }
  };

  // Load logs
  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(logsPage),
        limit: "50",
      });
      if (logsSearch) params.set("search", logsSearch);
      if (logsActionFilter !== "all") params.set("action", logsActionFilter);

      const data = await apiFetch<{ logs: LogItem[]; pagination: Pagination }>(
        `/admin/logs?${params.toString()}`,
      );
      setLogs(data.logs);
      setLogsPagination(data.pagination);
    } catch (error) {
      console.error("[Admin] Erro ao carregar logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Load available actions for filter
  const loadActions = async () => {
    try {
      const data = await apiFetch<{ actions: string[] }>("/admin/actions");
      setAvailableActions(data.actions);
    } catch (error) {
      console.error("[Admin] Erro ao carregar acoes:", error);
    }
  };

  // Load tracking data
  const loadTracking = async () => {
    if (!trackingUserEmail || !trackingUserEmail.includes("@")) {
      setTrackingError("Digite um email valido");
      return;
    }
    setTrackingLoading(true);
    setTrackingError("");
    setTrackingData(null);
    try {
      const data = await apiFetch<TrackingData>(
        `/admin/tracking/by-email?email=${encodeURIComponent(trackingUserEmail)}`,
      );
      setTrackingData(data);
    } catch (error: any) {
      setTrackingError(
        error?.message || "Usuario nao encontrado com este email",
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  // Effects to load data based on active tab
  useEffect(() => {
    if (pageLoading) return;
    if (activeTab === "dashboard") loadMetrics();
  }, [activeTab, pageLoading]);

  useEffect(() => {
    if (pageLoading || activeTab !== "users") return;
    loadUsers();
  }, [activeTab, usersPage, usersSearch, usersTypeFilter, pageLoading]);

  useEffect(() => {
    if (pageLoading || activeTab !== "shares") return;
    loadShares();
  }, [activeTab, sharesPage, sharesSearch, sharesStatusFilter, pageLoading]);

  useEffect(() => {
    if (pageLoading || activeTab !== "logs") return;
    loadLogs();
    if (availableActions.length === 0) loadActions();
  }, [activeTab, logsPage, logsSearch, logsActionFilter, pageLoading]);

  // Helpers
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending: { variant: "secondary", label: "Pendente" },
      approved: { variant: "default", label: "Aprovado" },
      active: { variant: "default", label: "Ativo" },
      rejected: { variant: "destructive", label: "Rejeitado" },
      expired: { variant: "outline", label: "Expirado" },
    };
    const s = statusMap[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (pageLoading) {
    return <FullPageLoader message="Carregando painel do auditor..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Solucao de Compartilhamento de Arquivos Confidenciais" />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <BreadcrumbNav
          dashboardLink="/admin"
          items={[{ label: "Inicio", href: "/" }, { label: "Auditoria" }]}
        />

        {/* Header com gradiente */}
        <div className="mb-8 mt-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Painel do Auditor
              </h1>
              <p className="text-muted-foreground">
                Visao completa de todos os usuarios, compartilhamentos e logs do
                sistema
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="shares" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Compartilhamentos
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Rastreamento
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMetrics}
                disabled={metricsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${metricsLoading ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
            </div>

            {metrics && (
              <>
                {/* Users Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Usuarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.users.total}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Internos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics.users.internal}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Externos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {metrics.users.external}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Gestores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.users.supervisors}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Auditores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {metrics.users.admins}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-600">
                        {metrics.users.active}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Shares Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Shares
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.shares.total}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Pendentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">
                        {metrics.shares.pending}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Aprovados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.shares.approved}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics.shares.active}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Rejeitados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {metrics.shares.rejected}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Expirados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-500">
                        {metrics.shares.expired}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Files & Audit Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Total Arquivos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.files.total}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <HardDrive className="h-3 w-3" /> Storage Usado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.files.storage_mb.toFixed(2)} MB
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Total Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.audit.total_logs}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metrics.audit.logs_last_7_days} nos ultimos 7 dias
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Emails Enviados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.emails.total_sent}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={usersTypeFilter}
                onValueChange={(v) => {
                  setUsersTypeFilter(v);
                  setUsersPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="internal">Internos</SelectItem>
                  <SelectItem value="external">Externos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <DraggableScroll>
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Gestor</TableHead>
                        <TableHead>Auditor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ultimo Login</TableHead>
                        <TableHead>Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhum usuario encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono text-sm">
                              {u.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {u.name}
                            </TableCell>
                            <TableCell className="text-sm">{u.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  u.type === "internal"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {u.type === "internal" ? "Interno" : "Externo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {u.job_title || "-"}
                            </TableCell>
                            <TableCell>
                              {u.is_supervisor && (
                                <Badge variant="outline">Sim</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {u.is_admin && (
                                <Badge variant="destructive">Sim</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={u.status ? "default" : "secondary"}
                              >
                                {u.status ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(u.last_login)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTrackingUserEmail(u.email);
                                  setActiveTab("tracking");
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DraggableScroll>
            </Card>

            {/* Pagination */}
            {usersPagination && usersPagination.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {usersPagination.current_page} de{" "}
                  {usersPagination.total_pages} ({usersPagination.total_items}{" "}
                  usuarios)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersPage === 1}
                    onClick={() => setUsersPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersPage >= usersPagination.total_pages}
                    onClick={() => setUsersPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Shares Tab */}
          <TabsContent value="shares" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email destinatario..."
                  value={sharesSearch}
                  onChange={(e) => {
                    setSharesSearch(e.target.value);
                    setSharesPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={sharesStatusFilter}
                onValueChange={(v) => {
                  setSharesStatusFilter(v);
                  setSharesPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <DraggableScroll>
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Arquivos</TableHead>
                        <TableHead>Criado por</TableHead>
                        <TableHead>Aprovado por</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Expira em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sharesLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : shares.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhum compartilhamento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        shares.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-sm">
                              {s.id}
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {s.name || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {s.external_email}
                            </TableCell>
                            <TableCell>{getStatusBadge(s.status)}</TableCell>
                            <TableCell>{s.files_count}</TableCell>
                            <TableCell className="text-sm">
                              {s.creator?.name || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {s.approver?.name || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(s.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(s.expires_at)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DraggableScroll>
            </Card>

            {/* Pagination */}
            {sharesPagination && sharesPagination.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {sharesPagination.current_page} de{" "}
                  {sharesPagination.total_pages} ({sharesPagination.total_items}{" "}
                  compartilhamentos)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sharesPage === 1}
                    onClick={() => setSharesPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sharesPage >= sharesPagination.total_pages}
                    onClick={() => setSharesPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por acao ou detalhe..."
                  value={logsSearch}
                  onChange={(e) => {
                    setLogsSearch(e.target.value);
                    setLogsPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={logsActionFilter}
                onValueChange={(v) => {
                  setLogsActionFilter(v);
                  setLogsPage(1);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Acao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <DraggableScroll>
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Acao</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Detalhe</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhum log encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">
                              {log.id}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.user ? (
                                <span title={log.user.email}>
                                  {log.user.name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell
                              className="text-sm max-w-[300px] truncate"
                              title={log.detail || ""}
                            >
                              {log.detail || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.ip || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(log.created_at)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DraggableScroll>
            </Card>

            {/* Pagination */}
            {logsPagination && logsPagination.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {logsPagination.current_page} de{" "}
                  {logsPagination.total_pages} ({logsPagination.total_items}{" "}
                  logs)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPage === 1}
                    onClick={() => setLogsPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPage >= logsPagination.total_pages}
                    onClick={() => setLogsPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rastreamento de Usuario</CardTitle>
                <CardDescription>
                  Digite o email do usuario para ver todo o historico de
                  atividades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Email do usuario (ex: usuario@petrobras.com.br)"
                    value={trackingUserEmail}
                    onChange={(e) => setTrackingUserEmail(e.target.value)}
                    className="max-w-[400px]"
                    type="email"
                  />
                  <Button onClick={loadTracking} disabled={trackingLoading}>
                    {trackingLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Buscar
                  </Button>
                </div>
                {trackingError && (
                  <p className="text-sm text-destructive mt-2">
                    {trackingError}
                  </p>
                )}
              </CardContent>
            </Card>

            {trackingData && (
              <div className="space-y-6">
                {/* User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Dados do Usuario
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{trackingData.user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{trackingData.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo</p>
                        <Badge
                          variant={
                            trackingData.user.type === "internal"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {trackingData.user.type === "internal"
                            ? "Interno"
                            : "Externo"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          variant={
                            trackingData.user.status ? "default" : "destructive"
                          }
                        >
                          {trackingData.user.status ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Departamento
                        </p>
                        <p className="font-medium">
                          {trackingData.user.department || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cargo</p>
                        <p className="font-medium">
                          {trackingData.user.job_title || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Gestor
                        </p>
                        <p className="font-medium">
                          {trackingData.user.is_supervisor ? "Sim" : "Nao"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Auditor</p>
                        <p className="font-medium">
                          {trackingData.user.is_admin ? "Sim" : "Nao"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Criado em
                        </p>
                        <p className="font-medium">
                          {formatDate(trackingData.user.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ultimo Login
                        </p>
                        <p className="font-medium">
                          {formatDate(trackingData.user.last_login)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {trackingData.stats.total_shares_created}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Shares Criados
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {trackingData.stats.total_shares_approved}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Shares Aprovados
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {trackingData.stats.total_files_uploaded}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Arquivos Enviados
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {trackingData.stats.total_logs}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Logs Registrados
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Shares Created */}
                {trackingData.shares_created.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Compartilhamentos Criados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Destinatario</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trackingData.shares_created.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.id}</TableCell>
                              <TableCell>{s.name || "-"}</TableCell>
                              <TableCell>{s.external_email}</TableCell>
                              <TableCell>{getStatusBadge(s.status)}</TableCell>
                              <TableCell>{formatDate(s.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Logs */}
                {trackingData.recent_logs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Logs Recentes (ultimos 100)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Acao</TableHead>
                              <TableHead>Detalhe</TableHead>
                              <TableHead>IP</TableHead>
                              <TableHead>Data/Hora</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trackingData.recent_logs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell>{log.id}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{log.action}</Badge>
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate">
                                  {log.detail || "-"}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {log.ip || "-"}
                                </TableCell>
                                <TableCell>
                                  {formatDate(log.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ScrollToTop />
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedUserTypes={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
