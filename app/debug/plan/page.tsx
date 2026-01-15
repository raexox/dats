"use client"

import { type FormEvent, useState } from "react"

type PlannerScore = {
  keyword: number
  geo: number
  time: number
  metric: number
  total: number
}

type PlannerCandidate = {
  dataset_id: string
  name: string
  score: PlannerScore
}

type PlannerResponse = {
  top_k: number
  candidates: PlannerCandidate[]
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8000"

export default function PlanDebugPage() {
  const [text, setText] = useState("population trends")
  const [geoLevel, setGeoLevel] = useState("state")
  const [startDate, setStartDate] = useState("2020-01-01")
  const [endDate, setEndDate] = useState("2023-12-31")
  const [metricHint, setMetricHint] = useState("population")
  const [response, setResponse] = useState<PlannerResponse | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const submitPlan = async (event?: FormEvent) => {
    event?.preventDefault()
    setStatus("loading")
    setError(null)
    setResponse(null)
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/planner/plan?top_k=25`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          geo_level: geoLevel,
          start_date: startDate,
          end_date: endDate,
          metric_hint: metricHint || null,
        }),
      })
      if (!res.ok) {
        throw new Error(`Backend responded with ${res.status}`)
      }
      const payload = (await res.json()) as PlannerResponse
      setResponse(payload)
      setStatus("idle")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unable to plan datasets.")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Debug</p>
          <h1 className="text-3xl font-semibold">Dataset Planner</h1>
          <p className="text-sm text-muted-foreground">
            Rank catalog entries with deterministic, explainable scoring.
          </p>
        </header>

        <form className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm" onSubmit={submitPlan}>
          <label className="flex flex-col gap-2 text-sm">
            Query text
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              Geo level
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={geoLevel}
                onChange={(event) => setGeoLevel(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Metric hint
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={metricHint}
                onChange={(event) => setMetricHint(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Start date
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              End date
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
          <button
            className="flex h-11 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Planning..." : "Plan Datasets"}
          </button>
          {status === "error" && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {response && (
          <section className="grid gap-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Top {response.top_k} datasets</span>
              <span>Ordered by total score</span>
            </div>
            {response.candidates.map((candidate) => (
              <div
                key={candidate.dataset_id}
                className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold">{candidate.name}</h2>
                    <p className="text-xs text-muted-foreground">{candidate.dataset_id}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total {candidate.score.total.toFixed(2)}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <span>Keyword: {candidate.score.keyword.toFixed(2)}</span>
                  <span>Geo: {candidate.score.geo.toFixed(2)}</span>
                  <span>Time: {candidate.score.time.toFixed(2)}</span>
                  <span>Metric: {candidate.score.metric.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {response.candidates.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
                No candidates returned.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
