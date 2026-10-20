"use client"

import type { CSSProperties, MouseEvent, ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Image from "@/components/site-image"
import Link from "next/link"

import { CavityCatchLogo } from "@/components/cavity-catch-logo"
import { HowToToothy } from "@/components/how-to-toothy"
import { MouthBackdrop } from "@/components/mouth-backdrop"
import { Button } from "@/components/ui/button"
import { useGameplayScrollLock } from "@/lib/use-gameplay-scroll-lock"

type GermType = {
  label: string
  src: string
  points: number
  hitPoints: number
  moves: boolean
  crackedSrc?: string
  rule: string
  howTo: string
}

const HIGH_SCORE_KEY = "toothy-town-cavity-catch-high-score"

const GREEN_GERM: GermType = {
  label: "green germ",
  src: "/germ.svg",
  points: 10,
  hitPoints: 1,
  moves: false,
  rule: "1 tap",
  howTo: "Tap it once to catch it! · 10 points",
}

const BLUE_GERM: GermType = {
  label: "blue germ",
  src: "/germ-blue.svg",
  points: 15,
  hitPoints: 1,
  moves: true,
  rule: "Moves around",
  howTo: "Catch it as it moves! · 15 points",
}

const PURPLE_GERM: GermType = {
  label: "purple germ",
  src: "/germ-purple.svg",
  crackedSrc: "/germ-purple-cracked.svg",
  points: 20,
  hitPoints: 2,
  moves: false,
  rule: "2 taps",
  howTo: "Break its shell, then tap it to catch it! · 20 points",
}

const GOLD_GERM: GermType = {
  label: "gold germ",
  src: "/germ-gold.svg",
  points: 50,
  hitPoints: 1,
  moves: false,
  rule: "Rare · 1 tap",
  howTo: "Rare! Tap it once for a big bonus! · 50 points",
}

const GERM_GUIDE = [GREEN_GERM, BLUE_GERM, PURPLE_GERM, GOLD_GERM] as const

function pickGermType(): GermType {
  const roll = Math.random()
  if (roll < 0.45) return GREEN_GERM
  if (roll < 0.75) return BLUE_GERM
  if (roll < 0.95) return PURPLE_GERM
  return GOLD_GERM
}

type Germ = {
  id: number
  top: number
  left: number
  sizeScale: number
  entranceDelayMs: number
  shakeDurationMs: number
  moveX: number
  moveY: number
  moveBackX: number
  moveBackY: number
  moveDurationMs: number
  hits: number
  germType: GermType
}

type Phase = "ready" | "playing" | "finished"

type GoldBurst = {
  id: number
  x: number
  y: number
}

type CatchPop = {
  id: number
  x: number
  y: number
  points: number
  breaks: boolean
}

function readHighScore() {
  if (typeof window === "undefined") return 0
  const parsed = Number.parseInt(
    window.localStorage.getItem(HIGH_SCORE_KEY) ?? "0",
    10,
  )
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function writeHighScore(score: number) {
  window.localStorage.setItem(HIGH_SCORE_KEY, String(score))
}

function spawnGerm(): Germ {
  const angle = Math.random() * Math.PI * 2
  const radius = Math.sqrt(Math.random())
  const moveX = (24 + Math.random() * 16) * (Math.random() < 0.5 ? -1 : 1)
  const moveY = (12 + Math.random() * 10) * (Math.random() < 0.5 ? -1 : 1)

  return {
    id: Date.now() + Math.random(),
    top: 49.5 + 5.5 * radius * Math.sin(angle),
    left: 50 + 29 * radius * Math.cos(angle),
    sizeScale: 0.75 + Math.random() * 0.3,
    entranceDelayMs: 50 + Math.random() * 50,
    shakeDurationMs: 1050 + Math.random() * 300,
    moveX,
    moveY,
    moveBackX: -moveX * 0.75,
    moveBackY: -moveY * 0.75,
    moveDurationMs: 1600 + Math.random() * 400,
    hits: 0,
    germType: pickGermType(),
  }
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

function GermKey({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-label="Germ point key"
      className={
        compact
          ? "pointer-events-none absolute top-2 right-2 z-10 rounded-2xl bg-white/90 px-2.5 py-2 shadow-sm"
          : "w-full"
      }
    >
      <ul className={compact ? "space-y-1" : "space-y-3"}>
        {GERM_GUIDE.map((germ) => (
          <li key={germ.label} className="flex items-center gap-2">
            <Image
              src={germ.src}
              alt=""
              width={compact ? 22 : 40}
              height={compact ? 22 : 40}
              draggable={false}
              className={compact ? "size-[22px]" : "size-10 overflow-visible object-contain"}
            />
            <div
              className={
                compact
                  ? "min-w-0 text-[11px] leading-tight font-bold text-foreground"
                  : "min-w-0 text-left text-base font-bold text-foreground"
              }
            >
              <div>
                {compact ? `${germ.points} points` : germ.howTo}
              </div>
              {compact ? (
                <div className="text-[10px] font-semibold text-muted-foreground">
                  {germ.rule}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function GoldBurstEffect({
  burst,
  onDone,
}: {
  burst: GoldBurst
  onDone: (id: number) => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(burst.id), 1100)
    return () => window.clearTimeout(timer)
  }, [burst.id, onDone])

  return (
    <div
      className="gold-burst-layer"
      style={
        {
          "--burst-x": `${burst.x}px`,
          "--burst-y": `${burst.y}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <div className="gold-burst-flash" />
      <div className="gold-burst-glow" />
      <div className="gold-burst-rays" />
      {Array.from({ length: 8 }, (_, index) => (
        <span
          key={index}
          className="gold-burst-sparkle"
          style={{ "--sparkle-i": index } as CSSProperties}
        />
      ))}
      <p className="gold-burst-label">{GOLD_GERM.points} Pts!</p>
    </div>
  )
}

function CatchPopEffect({
  pop,
  onDone,
}: {
  pop: CatchPop
  onDone: (id: number) => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(pop.id), 520)
    return () => window.clearTimeout(timer)
  }, [pop.id, onDone])

  return (
    <div
      className="catch-pop-layer"
      style={
        {
          "--burst-x": `${pop.x}px`,
          "--burst-y": `${pop.y}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {pop.breaks
        ? [0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="catch-pop-shard"
              style={{ "--sparkle-i": index } as CSSProperties}
            />
          ))
        : null}
      <p className={`catch-pop-label catch-pop-label-${pop.points}`}>
        +{pop.points} Pts!
      </p>
    </div>
  )
}

export function CavityCatch() {
  const [phase, setPhase] = useState<Phase>("ready")
  useGameplayScrollLock(phase === "playing")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(45)
  const [germs, setGerms] = useState<Germ[]>([])
  const [highScore, setHighScore] = useState(0)
  const [beatHighScore, setBeatHighScore] = useState(false)
  const [goldBursts, setGoldBursts] = useState<GoldBurst[]>([])
  const [catchPops, setCatchPops] = useState<CatchPop[]>([])
  const highScoreAtRoundStart = useRef(0)

  useEffect(() => {
    setHighScore(readHighScore())
  }, [])

  const addGerm = useCallback(() => {
    setGerms((current) => [...current, spawnGerm()])
  }, [])

  useEffect(() => {
    if (phase !== "playing") return

    const roundStartedAt = Date.now()
    let spawnTimer: ReturnType<typeof setTimeout> | undefined

    const scheduleNextGerm = () => {
      const elapsedSeconds = (Date.now() - roundStartedAt) / 1000
      const spawnDelay =
        elapsedSeconds < 15 ? 1000 : elapsedSeconds < 30 ? 750 : 500

      spawnTimer = setTimeout(() => {
        addGerm()
        scheduleNextGerm()
      }, spawnDelay)
    }

    scheduleNextGerm()

    const countdown = setInterval(() => {
      setTimeLeft((seconds) => {
        if (seconds <= 1) {
          setPhase("finished")
          if (spawnTimer) clearTimeout(spawnTimer)
          clearInterval(countdown)
          return 0
        }
        return seconds - 1
      })
    }, 1000)

    return () => {
      if (spawnTimer) clearTimeout(spawnTimer)
      clearInterval(countdown)
    }
  }, [phase, addGerm])

  useEffect(() => {
    if (phase !== "finished") return

    const previousHighScore = highScoreAtRoundStart.current
    const beat = score > previousHighScore
    if (beat) {
      writeHighScore(score)
      setHighScore(score)
    }
    setBeatHighScore(beat)
  }, [phase, score])

  const clearGoldBurst = useCallback((id: number) => {
    setGoldBursts((current) => current.filter((burst) => burst.id !== id))
  }, [])

  const clearCatchPop = useCallback((id: number) => {
    setCatchPops((current) => current.filter((pop) => pop.id !== id))
  }, [])

  function catchGerm(germ: Germ, event: MouseEvent<HTMLButtonElement>) {
    if (germ.hits + 1 < germ.germType.hitPoints) {
      setGerms((current) =>
        current.map((currentGerm) =>
          currentGerm.id === germ.id
            ? { ...currentGerm, hits: currentGerm.hits + 1 }
            : currentGerm,
        ),
      )
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    if (germ.germType === GOLD_GERM) {
      setGoldBursts((current) => [...current, { id: germ.id, x, y }])
    } else {
      setCatchPops((current) => [
        ...current,
        {
          id: germ.id,
          x,
          y,
          points: germ.germType.points,
          breaks: germ.germType === PURPLE_GERM,
        },
      ])
    }

    setGerms((current) =>
      current.filter((currentGerm) => currentGerm.id !== germ.id),
    )
    setScore((current) => current + germ.germType.points)
  }

  function startRound() {
    const currentHighScore = readHighScore()
    highScoreAtRoundStart.current = currentHighScore
    setHighScore(currentHighScore)
    setScore(0)
    setTimeLeft(45)
    setGerms([])
    setBeatHighScore(false)
    setGoldBursts([])
    setCatchPops([])
    setPhase("playing")
  }

  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <GameHeader>
          {highScore > 0 ? (
            <div className="rounded-full bg-honey px-4 py-2 text-sm font-bold text-foreground">
              High score: {highScore}
            </div>
          ) : null}
        </GameHeader>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-6 py-10 text-center">
          <CavityCatchLogo />
          <Button onClick={startRound} className="play-bubble-button">
            Play
          </Button>
          <section className="relative mt-8 w-full overflow-visible rounded-3xl bg-card p-5 pr-20 text-left shadow-sm ring-1 ring-border sm:p-6 sm:pr-24">
            <HowToToothy src="/toothy-grin.png" />
            <h2 className="text-xl font-extrabold text-foreground">
              How to play
            </h2>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              Tap the germs on the teeth before time runs out. You have 45
              seconds.
            </p>
            <div className="mt-5">
              <GermKey />
            </div>
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
          {beatHighScore ? (
            <>
              <div className="mb-6 text-7xl">🏆</div>
              <h2 className="text-4xl font-extrabold text-foreground sm:text-5xl">
                New high score!
              </h2>
              <p className="mt-4 text-5xl font-extrabold text-primary">
                {score}
              </p>
              <p className="mt-3 text-lg font-bold text-muted-foreground">
                That&apos;s your best catch yet!
              </p>
            </>
          ) : (
            <>
              <div className="mb-6 text-7xl">🎉</div>
              <h2 className="text-4xl font-extrabold text-foreground">
                Great brushing!
              </h2>
              <p className="mt-4 text-xl font-bold text-muted-foreground">
                You scored {score} points!
              </p>
              {highScore > 0 ? (
                <p className="mt-2 text-base font-bold text-foreground">
                  High score to beat: {highScore}
                </p>
              ) : null}
            </>
          )}
          <EndActions onPlayAgain={startRound} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GameHeader>
        <div className="rounded-full bg-mint px-4 py-2 text-sm font-bold text-foreground">
          Score: {score}
        </div>
        <div className="rounded-full bg-honey px-4 py-2 text-sm font-bold text-foreground">
          Time: {timeLeft}s
        </div>
      </GameHeader>
      <main className="relative mx-auto w-full max-w-[430px] flex-1 overflow-hidden bg-[#fdceb2]">
        <MouthBackdrop />
        <GermKey compact />
        {germs.map((germ) => (
          <button
            key={germ.id}
            type="button"
            onClick={(event) => catchGerm(germ, event)}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-5xl transition-transform hover:scale-125 active:scale-90 sm:text-6xl"
            style={{ top: `${germ.top}%`, left: `${germ.left}%` }}
            aria-label={`Whack the ${germ.germType.label}`}
          >
            <span
              className={
                germ.germType.moves
                  ? "inline-block animate-germ-move"
                  : "inline-block"
              }
              style={
                {
                  "--germ-scale": germ.sizeScale,
                  "--germ-enter-delay": `${germ.entranceDelayMs}ms`,
                  "--germ-shake-delay": `${germ.entranceDelayMs + 500}ms`,
                  "--germ-shake-duration": `${germ.shakeDurationMs}ms`,
                  "--germ-move-delay": `${germ.entranceDelayMs}ms`,
                  "--germ-move-duration": `${germ.moveDurationMs}ms`,
                  "--germ-move-x": `${germ.moveX}px`,
                  "--germ-move-y": `${germ.moveY}px`,
                  "--germ-move-back-x": `${germ.moveBackX}px`,
                  "--germ-move-back-y": `${germ.moveBackY}px`,
                } as CSSProperties
              }
            >
              <span className="inline-block animate-germ-pop">
                <span className="inline-block animate-germ-shake">
                  <Image
                    src={
                      germ.hits > 0 && germ.germType.crackedSrc
                        ? germ.germType.crackedSrc
                        : germ.germType.src
                    }
                    alt=""
                    width={64}
                    height={64}
                    draggable={false}
                    className="h-[1em] w-[1em]"
                  />
                </span>
              </span>
            </span>
          </button>
        ))}
      </main>
      {goldBursts.map((burst) => (
        <GoldBurstEffect
          key={burst.id}
          burst={burst}
          onDone={clearGoldBurst}
        />
      ))}
      {catchPops.map((pop) => (
        <CatchPopEffect key={pop.id} pop={pop} onDone={clearCatchPop} />
      ))}
    </div>
  )
}
