export default function LoadingEntraIdWiki() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        <p className="mt-4 text-slate-600">Carregando documentação Entra ID...</p>
      </div>
    </div>
  )
}
