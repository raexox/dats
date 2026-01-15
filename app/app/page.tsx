"use client"

import { useMemo, useState } from "react"
import { AppNavbar } from "@/components/app-navbar"
import { SearchInput } from "@/components/search-input"
import { MapView } from "@/components/map-view"
import { ControlsPanel } from "@/components/controls-panel"
import { DataTableView } from "@/components/data-table-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { previewQuery } from "@/lib/api/query"
import type { MapGeoLevel, QueryRequest, QueryResponse } from "@/types/api"

export default function AppPage() {
  const [searchPhrase, setSearchPhrase] = useState("bananas")
  const [metric, setMetric] = useState("population")
  const [geography, setGeography] = useState<MapGeoLevel>("state")
  const [timeRange, setTimeRange] = useState<[number, number]>([2020, 2024])
  const [perCapita, setPerCapita] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)

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

  const runPreview = async (nextRequest: QueryRequest) => {
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
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-6 py-8 px-4 sm:px-6">
          <div className="space-y-6">
            {/* Search Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-4">Data Explorer</h1>
              <SearchInput onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Map */}
              <div className="lg:col-span-2">
                <MapView phrase={searchPhrase} geography={geography} onGeographyChange={setGeography} />
              </div>

              {/* Right: Controls */}
              <div className="lg:col-span-1">
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
