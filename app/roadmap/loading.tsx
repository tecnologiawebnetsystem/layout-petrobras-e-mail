import { Skeleton } from "@/components/ui/skeleton"

export default function RoadmapLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>

          <div className="space-y-16">
            {[1, 2, 3].map((phase) => (
              <div key={phase}>
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="ml-24 grid gap-6 md:grid-cols-2">
                  {[1, 2].map((card) => (
                    <Skeleton key={card} className="h-64 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
