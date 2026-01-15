"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy } from "lucide-react"
import { useEffect, useState } from "react"

interface PublicMapClientPageProps {
  mapId: string
}

// Mock data for shared map
const mockPublicMap = {
  id: "map_123",
  title: "Banana Production by State",
  description: "Distribution of banana-related data across US states",
  phrase: "bananas",
  geography: "state" as const,
  metric: "production",
  createdBy: "John Doe",
  createdAt: new Date("2026-01-10"),
  views: 342,
}

const mockData = [
  { location: "California", value: 1245000, changePercent: 2.5 },
  { location: "Texas", value: 892000, changePercent: 1.8 },
  { location: "Florida", value: 756000, changePercent: 3.2 },
  { location: "New York", value: 654000, changePercent: 0.9 },
  { location: "Illinois", value: 523000, changePercent: -1.2 },
]

export function PublicMapClientPage({ mapId }: PublicMapClientPageProps) {
  const [shareUrl, setShareUrl] = useState<string>("")

  useEffect(() => {
    setShareUrl(`${window.location.origin}/public/${mapId}`)
  }, [mapId])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">{mockPublicMap.title}</h1>
              <p className="text-lg text-muted-foreground">{mockPublicMap.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Shared by <span className="text-foreground font-medium">{mockPublicMap.createdBy}</span>
                </p>
                <p className="text-muted-foreground">{mockPublicMap.views} views</p>
              </div>

              <Button onClick={handleCopyLink} className="gap-2 bg-primary/90 hover:bg-primary">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>

          {/* Map Preview */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Map Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-video bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-border flex items-center justify-center">
                <div className="text-center space-y-2">
                  <svg
                    className="w-24 h-24 mx-auto text-primary/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={0.5}
                      d="M9 20l-5.447-2.724A1 1 0 003 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3.5m-6 3.5V7m6 3.5l5.447-2.724A1 1 0 0021 5.618v10.764a1 1 0 01-1.447.894L15 13"
                    />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    {mockPublicMap.geography} level map for "{mockPublicMap.phrase}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>Read-only data from this shared map</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Change %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockData.map((row) => (
                      <TableRow key={row.location} className="border-border">
                        <TableCell className="font-medium">{row.location}</TableCell>
                        <TableCell className="text-right">{row.value.toLocaleString()}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${row.changePercent >= 0 ? "text-green-500" : "text-destructive"}`}
                        >
                          {row.changePercent > 0 ? "+" : ""}
                          {row.changePercent.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">This map uses data from the following sources:</p>
              <ul className="space-y-2 text-sm">
                <li>• U.S. Census Bureau - Primary data source</li>
                <li>• Bureau of Labor Statistics - Economic metrics</li>
                <li>• USDA - Agricultural data</li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Create your own maps</h3>
                <p className="text-muted-foreground">
                  Sign up for Dats to create and share your own geographic data visualizations
                </p>
                <Button asChild>
                  <a href="/signup">Get Started Free</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
