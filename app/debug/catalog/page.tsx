"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"

type CatalogSearchResult = {
  dataset_id: string
  name: string
  score: number
}

const GEO_OPTIONS = [
  { label: "Any geography", value: "" },
  { label: "State", value: "state" },
  { label: "County", value: "county" },
  { label: "City", value: "city" },
  { label: "Metro", value: "metro" },
]

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8000"

export default function CatalogDebugPage() {
  const [query, setQuery] = useState("population")
  const [geo, setGeo] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [results, setResults] = useState<CatalogSearchResult[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (geo) params.set("geo", geo)
    if (start) params.set("start", start)
    if (end) params.set("end", end)
    params.set("limit", "30")
    return params.toString()
  }, [query, geo, start, end])

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault()
    setStatus("loading")
    setError(null)
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/catalog/search?${queryString}`)
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`)
      }
      const payload = (await response.json()) as CatalogSearchResult[]
      setResults(payload)
      setStatus("idle")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unable to load catalog results.")
    }
  }

  useEffect(() => {
    void runSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Debug</p>
          <h1 className="text-3xl font-semibold">Catalog Search</h1>
          <p className="text-sm text-muted-foreground">
            Query the in-memory dataset catalog and review the scored results.
          </p>
        </header>

        <form
          className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-4"
          onSubmit={runSearch}
        >
          <label className="flex flex-col gap-2 text-sm">
            Keyword
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              placeholder="population"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Geography
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={geo}
              onChange={(event) => setGeo(event.target.value)}
            >
              {GEO_OPTIONS.map((option) => (
                <option key={option.value || "any"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Start date
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            End date
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
          <button
            className="col-span-full flex h-11 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Searching..." : "Search Catalog"}
          </button>
          {status === "error" && (
            <p className="col-span-full text-sm text-destructive">{error}</p>
          )}
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{results.length} results</span>
            <span>Sorted by score</span>
          </div>
          <div className="grid gap-3">
            {results.map((item) => (
              <div
                key={item.dataset_id}
                className="flex flex-col gap-1 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base font-semibold">{item.name}</h2>
                  <span className="text-sm text-muted-foreground">Score {item.score.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.dataset_id}</p>
              </div>
            ))}
            {results.length === 0 && status === "idle" && (
              <div className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
                No results yet. Run a search to populate the catalog list.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
