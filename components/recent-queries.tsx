"use client"

import type { QueryHistoryItem } from "@/types/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface RecentQueriesProps {
  items: QueryHistoryItem[]
  isLoading?: boolean
  onSelect: (item: QueryHistoryItem) => void
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export function RecentQueries({ items, isLoading = false, onSelect }: RecentQueriesProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Recent Queries</CardTitle>
        <CardDescription>Re-run a saved query to restore its inputs.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading recent queries...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved queries yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                type="button"
                className="w-full items-start justify-between gap-3 overflow-hidden bg-transparent text-left"
                onClick={() => onSelect(item)}
              >
                <span className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate font-medium text-foreground">{item.request.phrase}</span>
                  <span className="mt-1 text-xs text-muted-foreground leading-relaxed break-words">
                    {item.request.geography} • {item.request.metric} • {item.request.timeRange[0]}-
                    {item.request.timeRange[1]}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatTime(item.createdAt)}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
