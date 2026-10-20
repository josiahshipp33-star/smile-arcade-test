"use client"

import { useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">😕</div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn&apos;t load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => retry()}
            className="h-auto rounded-full px-6 py-3 text-base font-bold transition-transform hover:scale-105 active:scale-95"
          >
            Try again
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            variant="outline"
            className="h-auto rounded-full border-2 px-6 py-3 text-base font-bold"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
