import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesGrid } from "@/components/features-grid"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Dats - Turn Phrases Into US Maps",
  description: "Turn any phrase into interactive US data maps with real datasets at state and county levels.",
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
