import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">🦷</div>
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Oops, this page is missing!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            className="h-auto rounded-full px-6 py-3 text-base font-bold transition-transform hover:scale-105 active:scale-95"
          >
            Back to games
          </Button>
        </div>
      </div>
    </div>
  )
}
