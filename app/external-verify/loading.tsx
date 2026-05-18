export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5 flex items-center justify-center">
      <div className="animate-pulse space-y-4">
        <div className="h-12 w-48 bg-muted rounded-lg mx-auto" />
        <div className="h-64 w-96 bg-muted rounded-lg" />
      </div>
    </div>
  )
}
