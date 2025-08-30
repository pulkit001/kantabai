import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-4">
            Kantabai
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            A modern Next.js application with ShadCN UI components and Clerk authentication
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-12 px-4">
        <SignUpButton mode="modal">
          <Button size="lg" className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto">
            Get Started
          </Button>
        </SignUpButton>
        <Button variant="outline" size="lg" className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto" asChild>
          <Link href="/docs">Learn More</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl w-full px-4">
        <div className="group p-4 md:p-6 border rounded-lg hover:border-border hover:bg-muted/50 transition-colors">
          <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold">
            ShadCN UI{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Beautiful and accessible UI components built with Radix UI and Tailwind CSS.
          </p>
        </div>

        <div className="group p-4 md:p-6 border rounded-lg hover:border-border hover:bg-muted/50 transition-colors">
          <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold">
            Clerk Auth{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete authentication solution with social logins and user management.
          </p>
        </div>

        <div className="group p-4 md:p-6 border rounded-lg hover:border-border hover:bg-muted/50 transition-colors">
          <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold">
            TypeScript{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Type-safe development with full TypeScript support and IntelliSense.
          </p>
        </div>

        <div className="group p-4 md:p-6 border rounded-lg hover:border-border hover:bg-muted/50 transition-colors">
          <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold">
            Next.js 14{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest Next.js with App Router, Server Components, and optimizations.
          </p>
        </div>
      </div>
    </main>
  )
}
