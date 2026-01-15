"use client"

import { useEffect, useMemo, useState } from "react"
import { AppNavbar } from "@/components/app-navbar"
import { SearchInput } from "@/components/search-input"
import { MapView } from "@/components/map-view"
import { ControlsPanel } from "@/components/controls-panel"
import { DataTableView } from "@/components/data-table-view"
import { RecentQueries } from "@/components/recent-queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { previewQuery } from "@/lib/api/query"
import { fetchRecentQueries, saveQuery } from "@/lib/api/queries"
import type { MapGeoLevel, QueryHistoryItem, QueryRequest, QueryResponse } from "@/types/api"

export default function AppPage() {
  const [searchPhrase, setSearchPhrase] = useState("bananas")
  const [metric, setMetric] = useState("population")
  const [geography, setGeography] = useState<MapGeoLevel>("state")
  const [timeRange, setTimeRange] = useState<[number, number]>([2020, 2024])
  const [perCapita, setPerCapita] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [recentQueries, setRecentQueries] = useState<QueryHistoryItem[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState<string | null>(null)

  const queryRequest = useMemo<QueryRequest>(
    () => ({
      phrase: searchPhrase,
      metric,
      geography,
      timeRange,
      perCapita,
    }),
    [searchPhrase, metric, geography, timeRange, perCapita]
  )

  const runPreview = async (nextRequest: QueryRequest, options?: { save?: boolean }) => {
    const shouldSave = options?.save ?? true
    setIsLoading(true)
    setQueryError(null)
    try {
      const response = await previewQuery(nextRequest)
      setQueryResponse(response)
    } catch (error) {
      setQueryResponse(null)
      setQueryError(error instanceof Error ? error.message : "Unable to load preview data.")
    } finally {
      setIsLoading(false)
    }

    if (shouldSave) {
      try {
        await saveQuery(nextRequest)
        await loadRecentQueries()
      } catch (error) {
        setRecentError(error instanceof Error ? error.message : "Unable to save recent query.")
      }
    }
  }

  const loadRecentQueries = async () => {
    setRecentLoading(true)
    setRecentError(null)
    try {
      const items = await fetchRecentQueries()
      setRecentQueries(items)
    } catch (error) {
      setRecentError(error instanceof Error ? error.message : "Unable to load recent queries.")
    } finally {
      setRecentLoading(false)
    }
  }

  useEffect(() => {
    void loadRecentQueries()
  }, [])

  const handleSearch = async (phrase: string) => {
    setSearchPhrase(phrase)
    await runPreview({
      ...queryRequest,
      phrase,
    })
  }

  const handleApply = async () => {
    await runPreview(queryRequest)
  }

  const handleSelectQuery = async (item: QueryHistoryItem) => {
    const request = item.request
    setSearchPhrase(request.phrase)
    setMetric(request.metric)
    setGeography(request.geography)
    setTimeRange(request.timeRange)
    setPerCapita(request.perCapita)
    await runPreview(request, { save: false })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-6 py-8 px-4 sm:px-6">
          <div className="space-y-6">
            {/* Search Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-4">Data Explorer</h1>
              <SearchInput
                value={searchPhrase}
                onValueChange={setSearchPhrase}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Map */}
              <div className="lg:col-span-2">
                <MapView phrase={searchPhrase} geography={geography} onGeographyChange={setGeography} />
              </div>

              {/* Right: Controls */}
              <div className="lg:col-span-1 space-y-6">
                <ControlsPanel
                  metric={metric}
                  onMetricChange={setMetric}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  perCapita={perCapita}
                  onPerCapitaChange={setPerCapita}
                  onApply={handleApply}
                  onReset={() => {
                    setMetric("population")
                    setTimeRange([2020, 2024])
                    setPerCapita(false)
                  }}
                />
                <RecentQueries
                  items={recentQueries}
                  isLoading={recentLoading}
                  onSelect={handleSelectQuery}
                />
                {recentError && <p className="text-sm text-destructive">{recentError}</p>}
              </div>
            </div>
          </div>

          {/* Data Table */}
          {queryError ? (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardHeader>
                <CardTitle>Preview Error</CardTitle>
                <CardDescription>We could not reach the preview API.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">{queryError}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <DataTableView data={queryResponse?.rows ?? []} isLoading={isLoading} metric={metric} />
              {queryResponse?.source && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Source Metadata</CardTitle>
                    <CardDescription>Snapshot for this preview request.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Source:</span> {queryResponse.source.name}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Updated:</span>{" "}
                      {new Date(queryResponse.source.updatedAt).toLocaleString()}
                    </p>
                    {queryResponse.source.notes && (
                      <p>
                        <span className="font-medium text-foreground">Notes:</span>{" "}
                        {queryResponse.source.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
