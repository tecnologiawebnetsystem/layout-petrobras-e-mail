import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}
