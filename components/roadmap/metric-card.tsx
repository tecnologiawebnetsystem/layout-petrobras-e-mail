interface MetricCardProps {
  value: string
  label: string
}

export function MetricCard({ value, label }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border-2 border-teal-200 dark:border-teal-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-300 hover:scale-105">
      <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-sm text-center text-gray-600 dark:text-gray-400 font-medium">{label}</div>
    </div>
  )
}
