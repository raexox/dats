import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Map, Download, FileJson } from "lucide-react"

export function FeaturesGrid() {
  const features = [
    {
      icon: Map,
      title: "Real Datasets Only",
      description: "Access authentic US government and census data at state and county levels.",
    },
    {
      icon: Database,
      title: "State & County Maps",
      description: "Visualize data at multiple geographic levels with interactive choropleth maps.",
    },
    {
      icon: Download,
      title: "CSV Export",
      description: "Download your explored datasets in CSV format for further analysis.",
    },
    {
      icon: FileJson,
      title: "Explainable Sources",
      description: "Every data point is traceable with clear attribution to original sources.",
    },
  ]

  return (
    <section id="features" className="py-16 md:py-24 bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col space-y-10 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Powerful Features</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to explore and understand US geographic data
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="border-border bg-card/80 shadow-sm transition hover:border-primary/40 hover:bg-card/90"
              >
                <CardHeader className="px-4 pt-6 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-6 pt-2">
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
