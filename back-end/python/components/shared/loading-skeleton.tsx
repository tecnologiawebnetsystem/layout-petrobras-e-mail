export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 bg-muted rounded-xl skeleton" />
              <div className="h-4 w-12 bg-muted rounded skeleton" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-16 bg-muted rounded skeleton" />
              <div className="h-4 w-24 bg-muted rounded skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="bg-card rounded-xl border p-8 space-y-6">
        <div className="h-6 w-48 bg-muted rounded skeleton" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg skeleton" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-7xl mx-auto px-6 py-8 pb-16">
        {/* Breadcrumb Skeleton */}
        <div className="mb-8 pb-6 border-b">
          <div className="h-6 w-64 bg-muted rounded skeleton" />
        </div>

        {/* Content */}
        <DashboardSkeleton />
      </div>
    </div>
  )
}
