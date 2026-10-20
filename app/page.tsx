import Image from "@/components/site-image"

import { GameCard } from "@/components/game-card"
import { ToothyLogo } from "@/components/toothy-logo"
import { GAMES } from "@/lib/games"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <section className="flex flex-col items-center justify-center px-6 pt-8 pb-5 text-center">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center justify-center rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
            <span className="mr-2">🦷</span>
            Interactive waiting room games for kids
          </div>
          <ToothyLogo />
        </div>
      </section>
      <section id="games" className="bg-sky/20 px-6 pt-5 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
            <Image
              src="/toothy-happy.png"
              alt=""
              width={254}
              height={291}
              unoptimized
              draggable={false}
              className="pointer-events-none mb-1 h-20 w-auto origin-bottom -rotate-[8deg] select-none sm:h-24"
            />
            <h2 className="text-2xl font-extrabold leading-none text-foreground sm:text-4xl">
              Pick a game
            </h2>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
              Toothy’s ready. Tap a card.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
            {GAMES.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Toothy Town · Made for tiny patients · Ask a grown-up if you need help
        </p>
      </footer>
    </div>
  )
}
