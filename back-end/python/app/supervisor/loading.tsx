export default function SupervisorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-[#0047BB] border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Carregando módulo supervisor...</p>
      </div>
    </div>
  )
}
