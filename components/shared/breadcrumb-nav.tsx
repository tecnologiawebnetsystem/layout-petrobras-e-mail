"use client"

import { useRouter } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbNavProps {
  items: { label: string; href?: string }[]
  dashboardLink: string
}

export function BreadcrumbNav({ items, dashboardLink }: BreadcrumbNavProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between mb-8 pb-6 border-b">
      <div className="flex items-center gap-2.5 text-sm">
        <button
          onClick={() => router.push(dashboardLink)}
          className="text-[#0047BB] hover:text-[#003A99] hover:bg-blue-50 dark:hover:bg-blue-950/20 p-1.5 rounded-md transition-all"
          aria-label="Ir para Dashboard"
        >
          <Home className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2.5">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {item.href ? (
              <button
                onClick={() => router.push(item.href!)}
                className="text-[#0047BB] hover:text-[#003A99] hover:underline font-medium transition-colors text-base"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-muted-foreground font-medium text-base">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => router.push(dashboardLink)}
        className="text-[#0047BB] hover:text-[#003A99] hover:bg-blue-50 dark:hover:bg-blue-950/20 border-[#0047BB]/30 font-semibold"
      >
        <Home className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
    </div>
  )
}
