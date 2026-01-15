"use client"

import { useRef, useState } from "react"

type PlannerCandidate = {
  dataset_id: string
  name: string
  score: {
    total: number
  }
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

type RenderableResult = DatasetRunResult & { render_id: number }

type Summary = {
  success: number
  no_data: number
  error: number
  total_runtime_ms: number
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8000"

const STATUS_STYLES: Record<DatasetRunResult["status"], string> = {
  success: "bg-emerald-100 text-emerald-800",
  no_data: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-800",
}

export default function StreamAutoPage() {
  const [queryText, setQueryText] = useState("population trends")
  const [geoLevel, setGeoLevel] = useState("state")
  const [startDate, setStartDate] = useState("2020-01-01")
  const [endDate, setEndDate] = useState("2023-12-31")
  const [metricHint, setMetricHint] = useState("population")
  const [k, setK] = useState(25)
  const [concurrency, setConcurrency] = useState(5)
  const [timeoutMs, setTimeoutMs] = useState(2000)
  const [queryId, setQueryId] = useState<string | null>(null)
  const [planned, setPlanned] = useState<PlannerCandidate[]>([])
  const [results, setResults] = useState<RenderableResult[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [status, setStatus] = useState<"idle" | "running" | "error" | "done">("idle")
  const [disconnected, setDisconnected] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)
  const renderIdRef = useRef(0)

  const startRun = async () => {
    setStatus("running")
    setDisconnected(false)
    setPlanned([])
    setResults([])
    setSummary(null)
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/query/start-auto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: {
            text: queryText,
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
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`)
      }
      const payload = (await response.json()) as { query_id: string }
      setQueryId(payload.query_id)
      attachStream(payload.query_id)
    } catch (err) {
      setStatus("error")
    }
  }

  const attachStream = (id: string) => {
    sourceRef.current?.close()
    const source = new EventSource(`${BACKEND_BASE_URL}/query/stream/${id}`)
    sourceRef.current = source

    source.addEventListener("planned", (event) => {
      const data = JSON.parse(event.data) as PlannerCandidate[]
      setPlanned(data)
    })
    source.addEventListener("result", (event) => {
      const data = JSON.parse(event.data) as DatasetRunResult
      renderIdRef.current += 1
      setResults((prev) => [...prev, { ...data, render_id: renderIdRef.current }])
    })
    source.addEventListener("done", (event) => {
      const data = JSON.parse(event.data) as Summary
      setSummary(data)
      setStatus("done")
      source.close()
    })
    source.onerror = () => {
      setDisconnected(true)
      source.close()
    }
  }

  const retryStream = () => {
    if (queryId) {
      attachStream(queryId)
      setDisconnected(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Debug</p>
          <h1 className="text-3xl font-semibold">Stream Auto Run</h1>
          <p className="text-sm text-muted-foreground">Watch results arrive incrementally via SSE.</p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="flex flex-col gap-2 text-sm">
            Query text
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground"
              onClick={startRun}
              disabled={status === "running"}
              type="button"
            >
              {status === "running" ? "Running..." : "Start"}
            </button>
            {disconnected && (
              <button
                className="flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm"
                onClick={retryStream}
                type="button"
              >
                Retry stream
              </button>
            )}
            <span className="text-sm text-muted-foreground">
              {results.length} / {planned.length || 0} completed
            </span>
            {summary && (
              <span className="text-sm text-muted-foreground">
                Summary: {summary.success} success, {summary.no_data} no_data, {summary.error} error
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-3">
          {results.map((item) => (
            <div key={item.render_id} className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">{item.dataset_id}</h2>
                  <p className="text-xs text-muted-foreground">Rows: {item.row_count}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[item.status]}`}>
                  {item.status}
                </span>
              </div>
              {item.error_reason && <p className="mt-2 text-xs text-destructive">{item.error_reason}</p>}
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground">Preview rows</summary>
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
                      {item.preview.map((row, index) => (
                        <tr key={`${row.geo_id}-${index}`} className="border-t border-border">
                          {["geo_level", "geo_id", "geo_name", "date", "metric", "value"].map((key) => (
                            <td key={key} className="px-2 py-2">
                              {String(row[key] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {item.preview.length === 0 && (
                        <tr>
                          <td className="px-2 py-3 text-xs text-muted-foreground" colSpan={6}>
                            No preview rows available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          ))}
          {results.length === 0 && status !== "running" && (
            <div className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
              Start a run to see streamed results.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
