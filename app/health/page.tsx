import { HealthWidget } from "@/components/health-widget"

export default function HealthPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Health</p>
          <h1 className="text-3xl font-semibold">Backend Health Check</h1>
          <p className="text-sm text-muted-foreground">
            This page calls the FastAPI /health route and shows a timestamped status or an error if the
            service is unreachable.
          </p>
        </header>

        <HealthWidget />
      </div>
    </main>
  )
}
