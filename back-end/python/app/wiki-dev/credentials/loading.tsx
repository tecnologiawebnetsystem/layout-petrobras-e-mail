import { Skeleton } from "@/components/ui/skeleton"

export default function CredentialsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}
