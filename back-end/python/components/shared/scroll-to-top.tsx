"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostra o botão quando o usuário rola mais de 300px
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-gradient-to-br from-[#00A859] to-[#003F7F] hover:from-[#008A48] hover:to-[#00305D] shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-5 w-5 text-white" />
    </Button>
  )
}
