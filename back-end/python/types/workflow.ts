export interface WorkflowStep {
  id: string
  name: string
  approver: string
  role: string
  status: "pending" | "approved" | "rejected" | "waiting"
  date?: string
  comments?: string
  order: number
}

export interface ApprovalWorkflow {
  documentId: string
  currentStep: number
  totalSteps: number
  steps: WorkflowStep[]
  status: "in_progress" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
}
