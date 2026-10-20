"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import Image from "@/components/site-image"
import Link from "next/link"

import { HowToToothy } from "@/components/how-to-toothy"
import { SmileMatchLogo } from "@/components/smile-match-logo"
import { Button } from "@/components/ui/button"
import { useGameplayScrollLock } from "@/lib/use-gameplay-scroll-lock"

type MatchItem = {
  id: string
  name: string
  src: string
}

const MATCH_ITEMS: MatchItem[] = [
  { id: "toothbrush", name: "Toothbrush", src: "/match-toothbrush.png" },
  { id: "floss", name: "Floss", src: "/match-floss.png" },
  { id: "toothpaste", name: "Toothpaste", src: "/match-toothpaste.png" },
  { id: "mirror", name: "Mirror", src: "/match-mirror.png" },
  { id: "cup", name: "Cup", src: "/match-cup.png" },
  { id: "tooth", name: "Tooth", src: "/match-tooth.png" },
]

type MatchCard = {
  uid: string
  itemId: string
  faceUp: boolean
  matched: boolean
}

type Phase = "ready" | "playing" | "finished"

function shuffleCards(): MatchCard[] {
  const deck = MATCH_ITEMS.flatMap((item) => [
    { uid: `${item.id}-a`, itemId: item.id, faceUp: false, matched: false },
    { uid: `${item.id}-b`, itemId: item.id, faceUp: false, matched: false },
  ])
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = deck[index]
    deck[index] = deck[swap]
    deck[swap] = current
  }
  return deck
}

function itemById(itemId: string) {
  return MATCH_ITEMS.find((item) => item.id === itemId) ?? MATCH_ITEMS[0]
}

function GameHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          variant="secondary"
          className="h-auto rounded-full bg-muted px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          ← Back
        </Button>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  )
}

function EndActions({ onPlayAgain }: { onPlayAgain: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button
        onClick={onPlayAgain}
        className="h-auto rounded-full px-8 py-4 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
      >
        Play Again
      </Button>
      <Button
        nativeButton={false}
        render={<Link href="/" />}
        variant="outline"
        className="h-auto rounded-full border-2 px-8 py-4 text-lg font-bold"
      >
        More Games
      </Button>
    </div>
  )
}

export function SmileMatch() {
  const [phase, setPhase] = useState<Phase>("ready")
  useGameplayScrollLock(phase === "playing")
  const [cards, setCards] = useState<MatchCard[]>([])
  const [moves, setMoves] = useState(0)
  const lockRef = useRef(false)
  const flipTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) window.clearTimeout(flipTimerRef.current)
    }
  }, [])

  const matchedCount = cards.filter((card) => card.matched).length / 2

  function startRound() {
    if (flipTimerRef.current) window.clearTimeout(flipTimerRef.current)
    lockRef.current = false
    setCards(shuffleCards())
    setMoves(0)
    setPhase("playing")
  }

  function tapCard(uid: string) {
    if (phase !== "playing" || lockRef.current) return

    const tapped = cards.find((card) => card.uid === uid)
    if (!tapped || tapped.faceUp || tapped.matched) return

    const openUnmatched = cards.filter((card) => card.faceUp && !card.matched)
    if (openUnmatched.length >= 2) return

    const nextCards = cards.map((card) =>
      card.uid === uid ? { ...card, faceUp: true } : card,
    )
    const showing = nextCards.filter((card) => card.faceUp && !card.matched)
    setCards(nextCards)

    if (showing.length < 2) return

    setMoves((current) => current + 1)
    const [first, second] = showing
    if (first.itemId === second.itemId) {
      const matched = nextCards.map((card) =>
        card.itemId === first.itemId ? { ...card, matched: true } : card,
      )
      setCards(matched)
      if (matched.every((card) => card.matched)) {
        lockRef.current = true
        flipTimerRef.current = window.setTimeout(() => {
          setPhase("finished")
          lockRef.current = false
        }, 650)
      }
      return
    }

    lockRef.current = true
    flipTimerRef.current = window.setTimeout(() => {
      setCards((current) =>
        current.map((card) =>
          card.matched ? card : { ...card, faceUp: false },
        ),
      )
      lockRef.current = false
    }, 850)
  }

  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <GameHeader />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-6 py-10 text-center">
          <SmileMatchLogo />
          <Button onClick={startRound} className="play-bubble-button">
            Play
          </Button>
          <section className="relative mt-8 w-full overflow-visible rounded-3xl bg-card p-5 pr-20 text-left shadow-sm ring-1 ring-border sm:p-6 sm:pr-24">
            <HowToToothy src="/toothy-smile.png" />
            <h2 className="text-xl font-extrabold text-foreground">
              How to play
            </h2>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              Flip two cards. Find the matching pair of each dental tool. Match
              every pair to win!
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {MATCH_ITEMS.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <Image
                    src={item.src}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    draggable={false}
                    className="pointer-events-none size-9 select-none object-contain"
                  />
                  <span className="text-sm font-bold text-foreground">
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    )
  }

  if (phase === "finished") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <GameHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-6 text-7xl">🎉</div>
          <h1 className="font-[family-name:var(--font-fredoka)] text-4xl font-bold text-foreground sm:text-5xl">
            All matched!
          </h1>
          <p className="mt-3 text-lg font-bold text-muted-foreground">
            You found every pair in {moves} {moves === 1 ? "move" : "moves"}.
          </p>
          <EndActions onPlayAgain={startRound} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GameHeader>
        <div className="rounded-full bg-arcade-purple px-4 py-2 text-sm font-bold text-white">
          Pairs {matchedCount}/6
        </div>
        <div className="rounded-full bg-honey px-4 py-2 text-sm font-bold text-foreground">
          Moves {moves}
        </div>
      </GameHeader>
      <main className="mx-auto grid w-full max-w-[430px] flex-1 select-none grid-cols-3 content-center gap-2.5 px-4 py-5">
        {cards.map((card) => {
          const item = itemById(card.itemId)
          const open = card.faceUp || card.matched
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => tapCard(card.uid)}
              onContextMenu={(event) => event.preventDefault()}
              onDragStart={(event) => event.preventDefault()}
              aria-label={
                open ? item.name : "Face-down card"
              }
              className={`match-card ${open ? "is-up" : ""} ${
                card.matched ? "is-matched" : ""
              }`}
            >
              <span className="match-card-inner">
                <span className="match-card-back" aria-hidden="true">
                  <Image
                    src="/smile-match-mark.svg"
                    alt=""
                    width={140}
                    height={120}
                    unoptimized
                    draggable={false}
                    className="h-[78%] w-[78%] object-contain"
                  />
                </span>
                <span className="match-card-face">
                  <Image
                    src={item.src}
                    alt=""
                    width={72}
                    height={72}
                    unoptimized
                    draggable={false}
                    className="h-14 w-14 object-contain"
                  />
                  <span className="match-card-name">{item.name}</span>
                </span>
              </span>
            </button>
          )
        })}
      </main>
    </div>
  )
}
