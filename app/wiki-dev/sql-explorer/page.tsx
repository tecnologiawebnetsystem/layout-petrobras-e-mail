"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Home, Database, Play, Table2, ChevronDown, ChevronRight,
  Clock, Rows3, Columns3, Search, Copy, Check, AlertTriangle,
  Loader2, ArrowLeft, Zap, BookOpen, Trash2,
} from "lucide-react"
import Link from "next/link"

interface Column {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

interface TableInfo {
  table_name: string
  table_type: string
  columns: Column[]
  column_count: number
  row_count: number
}

interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  duration: number
}

const QUICK_QUERIES = [
  { label: "Usuarios", query: "SELECT id, name, email, role, is_active, created_at FROM \"user\" ORDER BY created_at DESC LIMIT 50", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Arquivos", query: "SELECT id, filename, area, status, classificacao, created_at FROM restricted_file ORDER BY created_at DESC LIMIT 50", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "Compartilhamentos", query: "SELECT id, requester_id, status, share_type, expires_at, created_at FROM share ORDER BY created_at DESC LIMIT 50", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Audit Logs", query: "SELECT id, action, entity_type, user_email, ip_address, created_at FROM audit ORDER BY created_at DESC LIMIT 50", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Notificacoes", query: "SELECT id, user_id, type, title, is_read, created_at FROM notification ORDER BY created_at DESC LIMIT 50", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { label: "Emails Enviados", query: "SELECT id, to_email, subject, status, provider, created_at FROM email_log ORDER BY created_at DESC LIMIT 50", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { label: "Sessoes", query: "SELECT id, user_id, token_type, is_valid, created_at, expires_at FROM session_token ORDER BY created_at DESC LIMIT 50", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { label: "Roadmap Fases", query: "SELECT id, nome, periodo, progresso, status, risco FROM roadmap_fases ORDER BY ordem", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { label: "Roadmap Entregas", query: "SELECT id, nome, fase_id, status, tipo, data_prevista FROM roadmap_entregas ORDER BY fase_id, ordem", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { label: "Contagem por tabela", query: "SELECT 'user' as tabela, COUNT(*)::int as total FROM \"user\" UNION ALL SELECT 'restricted_file', COUNT(*)::int FROM restricted_file UNION ALL SELECT 'share', COUNT(*)::int FROM share UNION ALL SELECT 'audit', COUNT(*)::int FROM audit UNION ALL SELECT 'notification', COUNT(*)::int FROM notification UNION ALL SELECT 'email_log', COUNT(*)::int FROM email_log ORDER BY tabela", color: "bg-gray-50 text-gray-700 border-gray-200" },
]

function DataTypeColor({ type }: { type: string }) {
  const colors: Record<string, string> = {
    integer: "bg-blue-100 text-blue-800",
    bigint: "bg-blue-100 text-blue-800",
    smallint: "bg-blue-100 text-blue-800",
    "character varying": "bg-green-100 text-green-800",
    text: "bg-green-100 text-green-800",
    boolean: "bg-purple-100 text-purple-800",
    "timestamp without time zone": "bg-amber-100 text-amber-800",
    "timestamp with time zone": "bg-amber-100 text-amber-800",
    date: "bg-amber-100 text-amber-800",
    jsonb: "bg-rose-100 text-rose-800",
    json: "bg-rose-100 text-rose-800",
    uuid: "bg-cyan-100 text-cyan-800",
    real: "bg-indigo-100 text-indigo-800",
    numeric: "bg-indigo-100 text-indigo-800",
  }
  const color = colors[type] || "bg-gray-100 text-gray-800"
  const short = type.replace("character varying", "varchar").replace("timestamp without time zone", "timestamp").replace("timestamp with time zone", "timestamptz")
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-mono font-medium ${color}`}>{short}</span>
}

export default function SqlExplorerPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("SELECT id, name, email, role, is_active, created_at FROM \"user\" ORDER BY created_at DESC LIMIT 20")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState("")
  const [running, setRunning] = useState(false)
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [tableSearch, setTableSearch] = useState("")
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/sql-explorer")
      .then((r) => r.json())
      .then((data) => {
        setTables(data.tables || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const runQuery = useCallback(async () => {
    if (!query.trim()) return
    setRunning(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/sql-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro desconhecido")
      } else {
        setResult(data)
        setHistory((h) => [query.trim(), ...h.filter((q) => q !== query.trim())].slice(0, 20))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexao")
    } finally {
      setRunning(false)
    }
  }, [query])

  const copyResult = () => {
    if (!result) return
    const header = result.columns.join("\t")
    const rows = result.rows.map((r) => result.columns.map((c) => String(r[c] ?? "")).join("\t")).join("\n")
    navigator.clipboard.writeText(`${header}\n${rows}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      runQuery()
    }
  }

  const filteredTables = tables.filter((t) => t.table_name.toLowerCase().includes(tableSearch.toLowerCase()))
  const totalRows = tables.reduce((sum, t) => sum + (t.row_count > 0 ? t.row_count : 0), 0)
  const totalColumns = tables.reduce((sum, t) => sum + t.column_count, 0)

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "NULL"
    if (typeof val === "boolean") return val ? "true" : "false"
    if (typeof val === "object") return JSON.stringify(val)
    return String(val)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/wiki-dev">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Wiki Dev
              </Button>
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">SQL Petrobras</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Badge variant="outline" className="border-emerald-800 bg-emerald-950/50 text-emerald-400">
              {tables.length} tabelas
            </Badge>
            <Badge variant="outline" className="border-blue-800 bg-blue-950/50 text-blue-400">
              {totalColumns} colunas
            </Badge>
            <Badge variant="outline" className="border-amber-800 bg-amber-950/50 text-amber-400">
              {totalRows.toLocaleString()} registros
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-0">
        {/* Sidebar - Tabelas */}
        <div className="h-[calc(100vh-73px)] w-80 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-950/50">
          <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 p-3 backdrop-blur-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar tabela..."
                className="h-9 border-slate-700 bg-slate-900 pl-9 text-sm text-white placeholder:text-slate-600 focus:border-emerald-600"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-16">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">Carregando tabelas...</p>
                <p className="mt-1 text-xs text-slate-500">Isso pode levar ate 15 segundos</p>
                <p className="mt-0.5 text-xs text-slate-600">na primeira consulta do dia.</p>
              </div>
              <div className="mt-2 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-800">
                <div className="h-1 animate-pulse rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ animation: "loading-bar 3s ease-in-out infinite", width: "60%" }} />
              </div>
            </div>
          ) : (
            <div className="p-2">
              {filteredTables.map((table) => (
                <div key={table.table_name} className="mb-1">
                  <button
                    onClick={() => setExpandedTable(expandedTable === table.table_name ? null : table.table_name)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      expandedTable === table.table_name
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    }`}
                  >
                    {expandedTable === table.table_name ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <Table2 className="h-4 w-4 shrink-0 text-emerald-500/70" />
                    <span className="flex-1 truncate font-mono text-xs">{table.table_name}</span>
                    <span className="shrink-0 rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {table.row_count >= 0 ? table.row_count : "?"}
                    </span>
                  </button>

                  {expandedTable === table.table_name && table.columns && (
                    <div className="mb-2 ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                      {table.columns.map((col) => (
                        <button
                          key={col.column_name}
                          onClick={() => {
                            const tableName = table.table_name === "user" ? '"user"' : table.table_name
                            setQuery(`SELECT ${col.column_name} FROM ${tableName} LIMIT 20`)
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-slate-800/50"
                        >
                          <span className="flex-1 truncate font-mono text-[11px] text-slate-400">{col.column_name}</span>
                          <DataTypeColor type={col.data_type} />
                          {col.is_nullable === "NO" && (
                            <span className="text-[9px] font-bold text-red-400/60">NOT NULL</span>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const tableName = table.table_name === "user" ? '"user"' : table.table_name
                          setQuery(`SELECT * FROM ${tableName} LIMIT 20`)
                        }}
                        className="mt-1 flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-[11px] text-emerald-500 transition-colors hover:bg-emerald-950/30"
                      >
                        <Play className="h-3 w-3" /> SELECT * FROM {table.table_name} LIMIT 20
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Query Editor */}
          <div className="border-b border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-300">Editor SQL</span>
                <span className="text-xs text-slate-600">(Ctrl+Enter para executar)</span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-white"
                    onClick={() => setHistory([])}
                  >
                    <Trash2 className="h-3 w-3" /> Limpar historico
                  </Button>
                )}
                <Button
                  onClick={runQuery}
                  disabled={running || !query.trim()}
                  size="sm"
                  className="h-8 gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 text-white hover:from-emerald-500 hover:to-cyan-500"
                >
                  {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Executar
                </Button>
              </div>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-emerald-300 placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              rows={4}
              placeholder="SELECT * FROM ..."
              spellCheck={false}
            />

            {/* Quick Queries */}
            <div className="mt-3">
              <span className="mb-2 block text-xs font-medium text-slate-500">Consultas rapidas:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUERIES.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setQuery(q.query)
                      setError("")
                      setResult(null)
                    }}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all hover:scale-105 ${q.color}`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <Card className="border-red-900/50 bg-red-950/20">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Erro na consulta</p>
                    <p className="mt-1 font-mono text-xs text-red-400/80">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {running && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-500">Executando consulta...</p>
                </div>
              </div>
            )}

            {result && !running && (
              <div>
                {/* Stats Bar */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Rows3 className="h-3.5 w-3.5" /> {result.rowCount} {result.rowCount === 1 ? "registro" : "registros"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Columns3 className="h-3.5 w-3.5" /> {result.columns.length} colunas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {result.duration}ms
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs text-slate-500 hover:text-white"
                    onClick={copyResult}
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>

                {/* Result Table */}
                {result.rowCount === 0 ? (
                  <Card className="border-slate-800 bg-slate-900/50">
                    <CardContent className="py-12 text-center">
                      <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                      <p className="text-sm text-slate-500">Nenhum registro encontrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-900">
                            <th className="sticky left-0 z-10 border-b border-r border-slate-700 bg-slate-900 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              #
                            </th>
                            {result.columns.map((col) => (
                              <th
                                key={col}
                                className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, i) => (
                            <tr key={i} className={`${i % 2 === 0 ? "bg-slate-950/50" : "bg-slate-900/30"} hover:bg-slate-800/50`}>
                              <td className="sticky left-0 z-10 border-r border-slate-800 bg-inherit px-3 py-1.5 text-[11px] text-slate-600">
                                {i + 1}
                              </td>
                              {result.columns.map((col) => {
                                const val = row[col]
                                const display = formatValue(val)
                                const isNull = val === null || val === undefined
                                return (
                                  <td
                                    key={col}
                                    className={`max-w-xs truncate whitespace-nowrap px-3 py-1.5 font-mono text-xs ${
                                      isNull
                                        ? "italic text-slate-700"
                                        : typeof val === "number"
                                          ? "text-cyan-400"
                                          : typeof val === "boolean"
                                            ? "text-purple-400"
                                            : "text-slate-300"
                                    }`}
                                    title={display}
                                  >
                                    {display.length > 80 ? `${display.slice(0, 80)}...` : display}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Welcome state */}
            {!result && !error && !running && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/20 to-cyan-600/20">
                    <Database className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h2 className="mb-2 text-lg font-semibold text-slate-300">Pronto para consultar</h2>
                  <p className="mb-4 max-w-md text-sm text-slate-600">
                    Selecione uma tabela na barra lateral, clique em uma coluna, ou use as consultas rapidas acima.
                    Apenas comandos SELECT sao permitidos.
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs text-slate-500">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">Ctrl</span>
                    <span>+</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">Enter</span>
                    <span>para executar</span>
                  </div>
                </div>
              </div>
            )}

            {/* Query History */}
            {history.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Clock className="h-3.5 w-3.5" /> Historico de consultas
                </h3>
                <div className="space-y-1">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(h)
                        setError("")
                      }}
                      className="block w-full truncate rounded border border-slate-800/50 bg-slate-900/30 px-3 py-2 text-left font-mono text-xs text-slate-500 transition-colors hover:border-slate-700 hover:text-slate-300"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
