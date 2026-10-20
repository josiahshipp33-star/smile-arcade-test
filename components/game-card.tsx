import Link from "next/link"

import type { Game } from "@/lib/games"

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border transition-all hover:-translate-y-2 hover:shadow-lg active:scale-95 sm:p-5"
    >
      <div
        className={`mb-3 grid aspect-square place-items-center rounded-2xl text-4xl sm:mb-4 md:text-6xl ${game.color}`}
      >
        <span className="transition-transform group-hover:scale-110 group-hover:rotate-3">
          {game.emoji}
        </span>
      </div>
      <h3 className="text-base font-bold text-card-foreground sm:text-xl">{game.title}</h3>
      <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
        {game.description}
      </p>
      <div className="mt-4 inline-flex items-center text-sm font-bold text-primary">
        Play
        <span className="ml-1 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  )
}
