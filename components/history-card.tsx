"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, RotateCw } from "lucide-react"

interface HistoryCardProps {
  phrase: string
  metric: string
  geography: string
  timestamp: Date
  onReload: () => void
  onDelete: () => void
}

export function HistoryCard({ phrase, metric, geography, timestamp, onReload, onDelete }: HistoryCardProps) {
  const timeAgo = Math.floor((Date.now() - timestamp.getTime()) / 1000)
  let timeString = ""

  if (timeAgo < 60) timeString = "Just now"
  else if (timeAgo < 3600) timeString = `${Math.floor(timeAgo / 60)}m ago`
  else if (timeAgo < 86400) timeString = `${Math.floor(timeAgo / 3600)}h ago`
  else if (timeAgo < 604800) timeString = `${Math.floor(timeAgo / 86400)}d ago`
  else timeString = timestamp.toLocaleDateString()

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">"{phrase}"</CardTitle>
            <CardDescription>{timeString}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Metric</p>
              <p className="font-medium">{metric}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Geography</p>
              <p className="font-medium capitalize">{geography} level</p>
            </div>
          </div>
          <Button onClick={onReload} className="w-full gap-2 bg-primary/90 hover:bg-primary">
            <RotateCw className="h-4 w-4" />
            Reload Search
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
