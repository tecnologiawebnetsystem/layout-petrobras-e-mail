"use client"

import { useEffect } from "react"
import { CheckCircle } from "lucide-react"

interface SuccessAnimationProps {
  show: boolean
  onComplete?: () => void
}

export function SuccessAnimation({ show, onComplete }: SuccessAnimationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="success-checkmark">
        <div className="relative">
          <svg className="w-32 h-32" viewBox="0 0 52 52">
            <circle
              className="success-checkmark-circle stroke-primary"
              cx="26"
              cy="26"
              r="23"
              fill="none"
              strokeWidth="3"
            />
            <path
              className="success-checkmark-check stroke-primary"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              d="M14 27l7 7 16-16"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle className="w-24 h-24 text-primary animate-in zoom-in-50 duration-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
