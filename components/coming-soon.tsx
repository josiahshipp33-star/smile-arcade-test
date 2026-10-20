import Link from "next/link"

import { Button } from "@/components/ui/button"

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 text-7xl">🚧</div>
      <h1 className="text-4xl font-extrabold text-foreground">
        {title} is coming soon!
      </h1>
      <p className="mt-4 max-w-md text-lg font-medium text-muted-foreground">
        Our toothy builders are working on this game. Check back later!
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/" />}
        className="mt-8 h-auto rounded-full px-8 py-4 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
      >
        Back to games
      </Button>
    </div>
  )
}
