import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl justify-center px-4 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card/90 px-6 py-10 text-center shadow-xl ring-1 ring-border/40 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to explore?</h2>
          <p className="text-lg text-muted-foreground">
            Start visualizing US data maps in seconds. No credit card required.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/app">Launch App</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
