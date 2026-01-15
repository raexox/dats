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

type DatasetRunResult = {
  dataset_id: string
  status: "success" | "no_data" | "error"
  row_count: number
  preview: Record<string, string | number | null>[]
  metadata: Record<string, unknown>
  timing_ms: number
  error_reason?: string | null
}

type AutoRunResponse = {
  planned: PlannerCandidate[]
  results: DatasetRunResult[]
  summary: {
    success: number
    no_data: number
    error: number
    total_runtime_ms: number
  }
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8000"

const STATUS_STYLES: Record<DatasetRunResult["status"], string> = {
  success: "bg-emerald-100 text-emerald-800",
  no_data: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-800",
}

export default function RunAutoPage() {
  const [text, setText] = useState("population trends")
  const [geoLevel, setGeoLevel] = useState("state")
  const [startDate, setStartDate] = useState("2020-01-01")
  const [endDate, setEndDate] = useState("2023-12-31")
  const [metricHint, setMetricHint] = useState("population")
  const [k, setK] = useState(25)
  const [concurrency, setConcurrency] = useState(5)
  const [timeoutMs, setTimeoutMs] = useState(2000)
  const [response, setResponse] = useState<AutoRunResponse | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const submitRun = async (event?: FormEvent) => {
    event?.preventDefault()
    setStatus("loading")
    setError(null)
    setResponse(null)
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/query/run-auto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: {
            text,
            geo_level: geoLevel,
            start_date: startDate,
            end_date: endDate,
            metric_hint: metricHint || null,
          },
          k,
          concurrency,
          timeout_ms: timeoutMs,
        }),
      })
      if (!res.ok) {
        throw new Error(`Backend responded with ${res.status}`)
      }
      const payload = (await res.json()) as AutoRunResponse
      setResponse(payload)
      setSelectedId(payload.results[0]?.dataset_id ?? null)
      setStatus("idle")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unable to run auto query.")
    }
  }

  const selected = response?.results.find((item) => item.dataset_id === selectedId) ?? null

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Debug</p>
          <h1 className="text-3xl font-semibold">Run Auto Planner</h1>
          <p className="text-sm text-muted-foreground">
            Plan and execute multiple datasets with bounded concurrency.
          </p>
        </header>

        <form className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm" onSubmit={submitRun}>
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
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              Top K
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                type="number"
                min={1}
                max={100}
                value={k}
                onChange={(event) => setK(Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Concurrency
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                type="number"
                min={1}
                max={10}
                value={concurrency}
                onChange={(event) => setConcurrency(Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Timeout (ms)
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                type="number"
                min={100}
                max={30000}
                value={timeoutMs}
                onChange={(event) => setTimeoutMs(Number(event.target.value))}
              />
            </label>
          </div>
          <button
            className="flex h-11 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Running..." : "Run Auto"}
          </button>
          {status === "error" && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {response && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{response.results.length} results</span>
                <span>
                  {response.summary.success} success · {response.summary.no_data} no_data ·{" "}
                  {response.summary.error} error
                </span>
              </div>
              {response.results.map((item, index) => (
                <button
                  key={`${item.dataset_id}-${index}`}
                  type="button"
                  className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left shadow-sm ${
                    selectedId === item.dataset_id ? "border-primary" : "border-border"
                  }`}
                  onClick={() => setSelectedId(item.dataset_id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.dataset_id}</span>
                    <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Rows: {item.row_count}</span>
                    <span>{item.timing_ms.toFixed(0)} ms</span>
                  </div>
                  {item.error_reason && (
                    <span className="text-xs text-destructive">{item.error_reason}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold">Planned Candidates</h2>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground">
                  {response.planned.slice(0, 5).map((candidate, index) => (
                    <div key={`${candidate.dataset_id}-${index}`} className="flex items-center justify-between">
                      <span className="truncate">{candidate.dataset_id}</span>
                      <span>{candidate.score.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <h2 className="text-sm font-semibold">Preview</h2>
                  <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[11px] uppercase text-muted-foreground">
                        <tr>
                          {["geo_level", "geo_id", "geo_name", "date", "metric", "value"].map((header) => (
                            <th key={header} className="px-2 py-2">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.preview.map((row, index) => (
                          <tr key={`${row.geo_id}-${index}`} className="border-t border-border">
                            {["geo_level", "geo_id", "geo_name", "date", "metric", "value"].map((key) => (
                              <td key={key} className="px-2 py-2">
                                {String(row[key] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {selected.preview.length === 0 && (
                          <tr>
                            <td className="px-2 py-3 text-xs text-muted-foreground" colSpan={6}>
                              No preview rows available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
