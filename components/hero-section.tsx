"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function HeroSection() {
  const { user, isLoading } = useAuth()
  const showSignup = !isLoading && !user

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_auto] lg:gap-16">
        <div className="space-y-10 text-center lg:text-left">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary lg:mx-0">
            <TrendingUp className="h-4 w-4 text-primary" />
            Real-time US Data Exploration
          </div>

          <div className="space-y-4 max-w-3xl mx-auto lg:mx-0">
            <h1 className="text-4xl leading-tight md:text-6xl font-bold tracking-tight text-balance">
              Turn any phrase into US data maps
            </h1>
            <p className="text-lg text-muted-foreground text-balance leading-relaxed">
              Explore interactive maps and datasets at state and county levels. Search for anything, visualize instantly,
              and export your findings.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-start">
            <Button size="lg" asChild>
              <Link href="/app" className="flex items-center gap-2 justify-center">
                {user ? "Open your workspace" : "Try it now"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {showSignup && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup" className="flex items-center justify-center">
                  Sign up for free
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="rounded-3xl border border-border bg-card/70 p-5 shadow-xl ring-1 ring-border/40">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-6">
              <div className="aspect-video rounded-xl bg-background/60 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <svg
                    className="h-20 w-20 mx-auto text-primary/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19.5v-15m0 0h.008v.008H9v-.008zm0 2h.008v.008H9v-.008zm0 2h.008v.008H9v-.008zm0 2h.008v.008H9v-.008zm0 2h.008v.008H9v-.008zm0 2h.008v.008H9v-.008zm0 2h.008v.008H9v-.008zm0 2h.008v.008H9v-.008zm12-12h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008z"
                    />
                  </svg>
                  <p className="text-sm text-muted-foreground">Interactive US Choropleth Map</p>
                  <p className="text-xs text-muted-foreground">Example: "bananas"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
