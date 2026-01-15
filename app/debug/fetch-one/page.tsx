"use client"

import { type FormEvent, useState } from "react"

type DatasetResult = {
  dataset_id: string
  row_count: number
  rows_preview: Record<string, string | number | null>[]
  metadata: Record<string, unknown>
  no_data: boolean
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8000"

export default function FetchOnePage() {
  const [datasetId, setDatasetId] = useState("")
  const [geoLevel, setGeoLevel] = useState("")
  const [geoId, setGeoId] = useState("")
  const [metric, setMetric] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [result, setResult] = useState<DatasetResult | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const runFetch = async (event?: FormEvent) => {
    event?.preventDefault()
    setStatus("loading")
    setError(null)
    setResult(null)
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/datasets/fetch-one`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId.trim(),
          params: {
            geo_level: geoLevel || null,
            geo_id: geoId || null,
            metric: metric || null,
            start_date: startDate ? `${startDate}T00:00:00` : null,
            end_date: endDate ? `${endDate}T23:59:59` : null,
          },
        }),
      })
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`)
      }
      const payload = (await response.json()) as DatasetResult
      setResult(payload)
      setStatus("idle")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unable to fetch dataset.")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Debug</p>
          <h1 className="text-3xl font-semibold">Fetch One Dataset</h1>
          <p className="text-sm text-muted-foreground">
            Request a single dataset file via the provider plugin system.
          </p>
        </header>

        <form className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm" onSubmit={runFetch}>
          <label className="flex flex-col gap-2 text-sm">
            Dataset ID
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              placeholder="local:csv/population_city_10.csv"
              value={datasetId}
              onChange={(event) => setDatasetId(event.target.value)}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              Geo level
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                placeholder="state"
                value={geoLevel}
                onChange={(event) => setGeoLevel(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Geo ID
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                placeholder="CA"
                value={geoId}
                onChange={(event) => setGeoId(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Metric
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                placeholder="population"
                value={metric}
                onChange={(event) => setMetric(event.target.value)}
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
            {status === "loading" ? "Fetching..." : "Fetch Dataset"}
          </button>
          {status === "error" && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {result && (
          <section className="grid gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{result.dataset_id}</h2>
                  <p className="text-sm text-muted-foreground">
                    Row count: {result.row_count} {result.no_data ? "(no data)" : ""}
                  </p>
                </div>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-xs text-foreground">
                {JSON.stringify(result.metadata, null, 2)}
              </pre>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
                Preview (first {result.rows_preview.length} rows)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {["geo_level", "geo_id", "geo_name", "date", "metric", "value"].map((header) => (
                        <th key={header} className="px-4 py-3">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows_preview.map((row, index) => (
                      <tr key={`${row.geo_id}-${index}`} className="border-t border-border">
                        {["geo_level", "geo_id", "geo_name", "date", "metric", "value"].map((key) => (
                          <td key={key} className="px-4 py-2">
                            {String(row[key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {result.rows_preview.length === 0 && (
                      <tr>
                        <td className="px-4 py-4 text-sm text-muted-foreground" colSpan={6}>
                          No rows returned for this filter set.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
