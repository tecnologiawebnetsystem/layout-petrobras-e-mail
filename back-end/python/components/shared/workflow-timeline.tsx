"use client"

import { CheckCircle2, Clock, XCircle } from "lucide-react"

interface WorkflowStep {
  name: string
  status: "completed" | "pending" | "approved" | "rejected"
  date?: string
  comments?: string
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[]
  currentStep: number
}

export function WorkflowTimeline({ steps, currentStep }: WorkflowTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                step.status === "approved" || step.status === "completed"
                  ? "bg-green-100 border-green-500 text-green-700"
                  : step.status === "rejected"
                    ? "bg-red-100 border-red-500 text-red-700"
                    : index === currentStep
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-gray-100 border-gray-300 text-gray-500"
              }`}
            >
              {step.status === "approved" || step.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : step.status === "rejected" ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-0.5 h-12 ${index < currentStep ? "bg-green-500" : "bg-gray-300"}`} />
            )}
          </div>

          <div className="flex-1 pb-8">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-foreground">{step.name}</h4>
              {step.date && <span className="text-xs text-muted-foreground">{step.date}</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              {step.status === "approved" || step.status === "completed"
                ? "Etapa concluída"
                : step.status === "rejected"
                  ? "Rejeitado nesta etapa"
                  : index === currentStep
                    ? "Em análise"
                    : "Aguardando"}
            </p>
            {step.comments && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground italic">{step.comments}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
