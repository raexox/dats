"use client"

import { useEffect, useState } from "react"
import { fetchHealth, type HealthResponse } from "@/lib/api/health"

const statusMessages: Record<"idle" | "loading" | "success" | "error", string> = {
  idle: "Waiting for health check",
  loading: "Checking backend availability...",
  success: "Backend is responding",
  error: "Backend is unreachable",
}

export function HealthWidget() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setStatus("loading")
    setError(null)

    fetchHealth()
      .then((response) => {
        if (!isMounted) return
        setHealth(response)
        setStatus("success")
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to reach backend")
        setStatus("error")
      })

    return () => {
      isMounted = false
    }
  }, [])

  const headlineClass =
    status === "error"
      ? "text-destructive"
      : status === "success"
      ? "text-green-400"
      : "text-muted-foreground"

  return (
    <div className="rounded-xl border border-border bg-card/80 p-6 shadow">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Backend health</p>
          <h3 className={`text-lg font-semibold ${headlineClass}`}>
            {status === "success" ? "ok" : statusMessages[status] ?? "Waiting..."}
          </h3>
        </div>
        {status === "loading" && <span className="text-xs text-muted-foreground">Requesting...</span>}
      </header>

      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-base font-medium">
            {status === "success" ? health?.status : statusMessages[status]}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Timestamp</p>
          <p className="text-base font-medium">
            {status === "success" ? new Date(health?.time ?? "").toLocaleString() : "-"}
          </p>
        </div>

        {status === "error" && (
          <p className="text-xs font-medium text-destructive">
            {error ?? "No connection to backend"}
          </p>
        )}
      </div>
    </div>
  )
}
