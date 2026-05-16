"use client"

import { Check, X, Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { WorkflowStep } from "@/types/workflow"

interface WorkflowTimelineProps {
  steps: WorkflowStep[]
  currentStep: number
}

export function WorkflowTimeline({ steps, currentStep }: WorkflowTimelineProps) {
  const getStepIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "approved":
        return <Check className="h-5 w-5 text-white" />
      case "rejected":
        return <X className="h-5 w-5 text-white" />
      case "pending":
        return <Clock className="h-5 w-5 text-white" />
      case "waiting":
        return <User className="h-5 w-5 text-white" />
    }
  }

  const getStepColor = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-600"
      case "rejected":
        return "bg-red-600"
      case "pending":
        return "bg-yellow-600"
      case "waiting":
        return "bg-gray-400"
    }
  }

  const getStatusBadge = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Em análise</Badge>
      case "waiting":
        return <Badge variant="secondary">Aguardando</Badge>
    }
  }

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isActive = index === currentStep

        return (
          <div key={step.id} className="relative pb-8">
            {/* Linha conectora */}
            {!isLast && (
              <div
                className={`absolute left-5 top-12 w-0.5 h-full -ml-px ${
                  step.status === "approved" ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            )}

            <div className="relative flex items-start gap-4">
              {/* Ícone do passo */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(
                  step.status,
                )} ${isActive ? "ring-4 ring-[#00A99D]/20" : ""}`}
              >
                {getStepIcon(step.status)}
              </div>

              {/* Conteúdo do passo */}
              <div
                className={`flex-1 ${isActive ? "bg-teal-50 dark:bg-teal-900/10 p-4 rounded-lg border-2 border-[#00A99D]" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {step.name}
                      {isActive && <span className="ml-2 text-[#00A99D]">(Atual)</span>}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.approver} - {step.role}
                    </p>
                  </div>
                  {getStatusBadge(step.status)}
                </div>

                {step.date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {step.status === "approved" ? "Aprovado em: " : "Processado em: "}
                    {step.date}
                  </p>
                )}

                {step.comments && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Comentários:</span> {step.comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
