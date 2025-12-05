import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface RoadmapCardProps {
  icon: string
  title: string
  items: string[]
  priority: "high" | "medium" | "low"
}

const priorityConfig = {
  high: { label: "Alta Prioridade", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  medium: {
    label: "Média Prioridade",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  low: { label: "Baixa Prioridade", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
}

export function RoadmapCard({ icon, title, items, priority }: RoadmapCardProps) {
  const config = priorityConfig[priority]

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 hover:border-teal-500 dark:hover:border-teal-400">
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {title}
              </CardTitle>
            </div>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
