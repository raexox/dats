import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export const metadata = {
  title: "About - Dats",
  description: "Learn about Dats and our data sources",
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About Dats</h1>
              <p className="text-lg text-muted-foreground">
                Making US geographic data accessible, visual, and understandable
              </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">
                    Dats exists to democratize access to US geographic data. We believe that understanding how data
                    varies across states and counties is crucial for informed decision-making. By turning phrases into
                    interactive maps, we make complex datasets accessible to everyone.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>We use only authentic, verified data sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      "U.S. Census Bureau - Population and demographic data",
                      "Bureau of Labor Statistics - Employment and economic data",
                      "U.S. Department of Agriculture - Agricultural and environmental data",
                      "CDC - Health and disease statistics",
                      "USDA - Food and nutrition data",
                      "EPA - Environmental quality metrics",
                    ].map((source) => (
                      <div key={source} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{source}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-foreground">
                  <p>
                    When you search for a phrase on Dats, our system searches through thousands of real US datasets
                    at state and county levels. We visualize matching data on interactive choropleth maps, allowing you
                    to explore geographic patterns instantly.
                  </p>
                  <p>
                    Every data point is traceable to its original source. We believe in transparency and accuracy, so
                    you can always verify where your data comes from.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>AI Interpretation Disclaimer</CardTitle>
                </CardHeader>
                <CardContent className="text-foreground">
                  <p>
                    While Dats provides accurate data visualization, any AI-generated insights about your data are
                    provided "as-is" for educational purposes. Always verify conclusions with domain experts and
                    official sources before making important decisions.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Version Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Dats Version</p>
                    <p className="font-semibold">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-semibold">January 2026</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
