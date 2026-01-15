"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react"

interface ControlsPanelProps {
  metric: string
  onMetricChange: (value: string) => void
  timeRange: [number, number]
  onTimeRangeChange: (value: [number, number]) => void
  perCapita: boolean
  onPerCapitaChange: (value: boolean) => void
  onApply: () => void
  onReset: () => void
}

export function ControlsPanel({
  metric,
  onMetricChange,
  timeRange,
  onTimeRangeChange,
  perCapita,
  onPerCapitaChange,
  onApply,
  onReset,
}: ControlsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className="border-border">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Customize your data exploration</CardDescription>
          </div>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            )}
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="metric">Metric</Label>
            <Select value={metric} onValueChange={onMetricChange}>
              <SelectTrigger id="metric">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="population">Population</SelectItem>
                <SelectItem value="density">Population Density</SelectItem>
                <SelectItem value="median-income">Median Income</SelectItem>
                <SelectItem value="unemployment">Unemployment Rate</SelectItem>
                <SelectItem value="education">Education Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Time Range</Label>
            <div className="space-y-2">
              <Slider
                defaultValue={timeRange}
                min={2020}
                max={2024}
                step={1}
                onValueChange={(value) => onTimeRangeChange([value[0], value[1]])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{timeRange[0]}</span>
                <span>{timeRange[1]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="per-capita" className="cursor-pointer">
              Per Capita Values
            </Label>
            <Switch id="per-capita" checked={perCapita} onCheckedChange={onPerCapitaChange} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button onClick={onReset} variant="outline" className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={onApply} className="gap-2">
              Apply
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
