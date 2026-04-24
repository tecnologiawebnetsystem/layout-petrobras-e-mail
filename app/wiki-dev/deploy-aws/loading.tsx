export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-gray-200 rounded w-1/2"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}
