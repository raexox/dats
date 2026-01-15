"use client"

import { useState } from "react"
import { AppNavbar } from "@/components/app-navbar"
import { HistoryCard } from "@/components/history-card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

const mockHistory = [
  { id: "1", phrase: "bananas", metric: "population", geography: "state", timestamp: new Date(Date.now() - 3600000) },
  {
    id: "2",
    phrase: "coffee",
    metric: "median-income",
    geography: "county",
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    id: "3",
    phrase: "solar energy",
    metric: "population-density",
    geography: "state",
    timestamp: new Date(Date.now() - 86400000),
  },
  { id: "4", phrase: "wheat", metric: "unemployment", geography: "state", timestamp: new Date(Date.now() - 172800000) },
  {
    id: "5",
    phrase: "tech jobs",
    metric: "education",
    geography: "county",
    timestamp: new Date(Date.now() - 259200000),
  },
]

export function HistoryClientPage() {
  const [history, setHistory] = useState(mockHistory)

  const handleDelete = (id: string) => {
    setHistory(history.filter((item) => item.id !== id))
  }

  const handleClearAll = () => {
    setHistory([])
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />

      <main className="flex-1 container py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Search History</h1>
              <p className="text-muted-foreground mt-2">View and manage your previous searches</p>
            </div>
            <Button variant="outline" onClick={handleClearAll} className="gap-2 bg-transparent">
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>

          {history.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="text-4xl text-muted-foreground">📋</div>
                <h2 className="text-xl font-semibold">No search history</h2>
                <p className="text-muted-foreground">Your searches will appear here</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <HistoryCard
                  key={item.id}
                  phrase={item.phrase}
                  metric={item.metric}
                  geography={item.geography}
                  timestamp={item.timestamp}
                  onReload={() => {
                    /* Navigate to app with these params */
                  }}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
