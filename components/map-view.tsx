"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { MapGeoLevel } from "@/types/api"
import { Maximize2 } from "lucide-react"

interface MapViewProps {
  phrase: string
  geography: MapGeoLevel
  onGeographyChange: (value: MapGeoLevel) => void
}

export function MapView({ phrase, geography, onGeographyChange }: MapViewProps) {
  return (
    <Card className="h-full flex flex-col border-border">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>US Choropleth Map</CardTitle>
            <CardDescription>Visualization for "{phrase}"</CardDescription>
          </div>
          <Button variant="outline" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Geography Level</span>
          <ToggleGroup
            type="single"
            value={geography}
            onValueChange={onGeographyChange}
            className="border border-border rounded"
          >
            <ToggleGroupItem value="state" aria-label="State Level">
              State
            </ToggleGroupItem>
            <ToggleGroupItem value="county" aria-label="County Level">
              County
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-6">
        <div className="w-full h-full min-h-[360px] rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-8">
          <div className="flex h-full flex-col items-start justify-center space-y-6 text-left">
            <svg className="h-28 w-28 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.5}
                d="M9 20l-5.447-2.724A1 1 0 003 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3.5m-6 3.5V7m6 3.5l5.447-2.724A1 1 0 0021 5.618v10.764a1 1 0 01-1.447.894L15 13"
              />
            </svg>
            <div>
              <p className="font-semibold text-foreground">Interactive Map</p>
              <p className="text-sm text-muted-foreground">
                Map visualization for "{phrase}" at {geography} level
              </p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Hover over regions to see detailed information</p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-3 w-3 rounded bg-primary/30"></span>
                <span>Low values</span>
                <span className="inline-flex h-3 w-3 rounded bg-primary"></span>
                <span>High values</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
