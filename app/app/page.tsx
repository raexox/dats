"use client"

import { useState } from "react"
import { AppNavbar } from "@/components/app-navbar"
import { SearchInput } from "@/components/search-input"
import { MapView } from "@/components/map-view"
import { ControlsPanel } from "@/components/controls-panel"
import { DataTableView } from "@/components/data-table-view"

const mockData = [
  { id: "1", location: "California", value: 1245000, perCapitaValue: 31.2, changePercent: 2.5 },
  { id: "2", location: "Texas", value: 892000, perCapitaValue: 28.9, changePercent: 1.8 },
  { id: "3", location: "Florida", value: 756000, perCapitaValue: 34.5, changePercent: 3.2 },
  { id: "4", location: "New York", value: 654000, perCapitaValue: 32.1, changePercent: 0.9 },
  { id: "5", location: "Illinois", value: 523000, perCapitaValue: 29.8, changePercent: -1.2 },
  { id: "6", location: "Pennsylvania", value: 487000, perCapitaValue: 30.4, changePercent: -0.8 },
  { id: "7", location: "Ohio", value: 456000, perCapitaValue: 27.6, changePercent: 1.1 },
  { id: "8", location: "Georgia", value: 432000, perCapitaValue: 28.3, changePercent: 2.9 },
  { id: "9", location: "North Carolina", value: 401000, perCapitaValue: 26.9, changePercent: 2.4 },
  { id: "10", location: "Michigan", value: 378000, perCapitaValue: 25.7, changePercent: -0.5 },
  { id: "11", location: "New Jersey", value: 354000, perCapitaValue: 33.8, changePercent: 1.6 },
  { id: "12", location: "Virginia", value: 332000, perCapitaValue: 29.2, changePercent: 2.8 },
]

export default function AppPage() {
  const [searchPhrase, setSearchPhrase] = useState("bananas")
  const [metric, setMetric] = useState("population")
  const [geography, setGeography] = useState<"state" | "county">("state")
  const [timeRange, setTimeRange] = useState<[number, number]>([2020, 2024])
  const [perCapita, setPerCapita] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (phrase: string) => {
    setIsLoading(true)
    setSearchPhrase(phrase)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsLoading(false)
  }

  const handleApply = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsLoading(false)
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
          <DataTableView data={mockData} isLoading={isLoading} metric={metric} />
        </div>
      </main>
    </div>
  )
}
