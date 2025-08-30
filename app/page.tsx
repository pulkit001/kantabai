"use client"

import { Button } from "@/components/ui/button";
import { SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-4">
            Kantabai
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Your smart kitchen assistant for managing ingredients, tracking expiry dates, and creating delicious recipes
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
            🥕 Ingredient Tracking{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Track all your kitchen ingredients with quantities, locations, and expiry dates.
          </p>
        </div>

        <div className="group p-4 md:p-6 border rounded-lg hover:border-border hover:bg-muted/50 transition-colors">
          <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold">
            ⏰ Expiry Alerts{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Get notified when ingredients are about to expire to reduce food waste.
          </p>
        </div>

        <div className="group p-4 md:p-6 border rounded-lg hover:border-border hover:bg-muted/50 transition-colors">
          <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold">
            👨‍🍳 Recipe Management{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Create recipes and instantly check if you have all the required ingredients.
          </p>
        </div>

        <div className="group p-4 md:p-6 border rounded-lg hover:border-border hover:bg-muted/50 transition-colors">
          <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold">
            📱 Mobile PWA{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Install on your phone for quick kitchen access. Works offline too!
          </p>
        </div>
      </div>
    </main>
  )
}
