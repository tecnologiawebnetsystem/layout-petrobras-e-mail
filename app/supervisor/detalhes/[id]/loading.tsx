import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function SupervisorDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="h-8 w-64 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-32 w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-48 w-full" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
