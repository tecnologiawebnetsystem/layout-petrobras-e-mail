export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A99D]"></div>
        <p className="text-gray-600 dark:text-gray-400">Carregando configurações...</p>
      </div>
    </div>
  )
}
