"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"

interface SuccessAnimationProps {
  show: boolean
  onComplete?: () => void
}

export function SuccessAnimation({ show, onComplete }: SuccessAnimationProps) {
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{ id: number; left: number; delay: number; color: string }>
  >([])

  useEffect(() => {
    if (show) {
      const colors = ["#00A859", "#FDB913", "#003F7F"]
      const pieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
      setConfettiPieces(pieces)

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
              className="success-checkmark-circle"
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke="#00A859"
              strokeWidth="3"
            />
            <path
              className="success-checkmark-check"
              fill="none"
              stroke="#00A859"
              strokeWidth="3"
              strokeLinecap="round"
              d="M14 27l7 7 16-16"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle className="w-24 h-24 text-[#00A859] animate-in zoom-in-50 duration-500" />
          </div>
        </div>
      </div>

      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-particle absolute"
          style={{
            left: `${piece.left}%`,
            top: "50%",
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
