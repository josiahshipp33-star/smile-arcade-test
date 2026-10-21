"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import Image from "@/components/site-image"

const WELCOME_PAGES = [
  {
    src: "/toothy-smile.png",
    text: "Hey there! I'm Toothy. Welcome to Smile Arcade!",
  },
  {
    src: "/toothy-happy.png",
    text: "I've got some fun games for you to check out!",
  },
  {
    src: "/toothy-grin.png",
    text: "Pick a game and see what you can do!",
  },
  {
    src: "/toothy-wink.png",
    text: "Go ahead and pick a game. Have fun, and enjoy your visit!",
  },
] as const

const DISMISS_MS = 420
const WELCOME_SEEN_KEY = "smile-arcade-welcome"

export function WelcomeIntro({ children }: { children: ReactNode }) {
  const [page, setPage] = useState(0)
  const [typed, setTyped] = useState("")
  const [phase, setPhase] = useState<"pending" | "open" | "leaving" | "done">("pending")
  const pageRef = useRef(0)
  const hitRef = useRef<HTMLButtonElement>(null)

  const active = phase === "open" || phase === "leaving"
  const current = WELCOME_PAGES[page]

  useEffect(() => {
    if (sessionStorage.getItem(WELCOME_SEEN_KEY) === "1") {
      setPhase("done")
      return
    }
    sessionStorage.setItem(WELCOME_SEEN_KEY, "1")
    setPhase("open")
  }, [])

  useEffect(() => {
    if (phase !== "open") return
    hitRef.current?.focus()
  }, [phase])

  useEffect(() => {
    if (phase !== "open") return
    const full = WELCOME_PAGES[page].text
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setTyped(full)
      return
    }
    setTyped("")
    let count = 0
    const id = window.setInterval(() => {
      count += 1
      setTyped(full.slice(0, count))
      if (count >= full.length) window.clearInterval(id)
    }, 28)
    return () => window.clearInterval(id)
  }, [page, phase])

  useEffect(() => {
    if (!active) return
    document.documentElement.classList.add("welcome-lock")
    return () => {
      document.documentElement.classList.remove("welcome-lock")
    }
  }, [active])

  useEffect(() => {
    if (phase !== "leaving") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = window.setTimeout(() => setPhase("done"), reduce ? 0 : DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  function advance() {
    if (phase !== "open") return
    const next = pageRef.current + 1
    if (next >= WELCOME_PAGES.length) {
      setPhase("leaving")
      return
    }
    pageRef.current = next
    setPage(next)
  }

  return (
    <>
      <div className={phase === "open" ? "welcome-hub is-blurred" : "welcome-hub"} inert={active}>
        {children}
      </div>
      {active ? (
        <div className={phase === "leaving" ? "welcome-root is-leaving" : "welcome-root"}>
          <div className="welcome-gradient" aria-hidden="true" />
          <div className="welcome-cast">
            <div className="welcome-bubble" aria-live="polite">
              <p className="welcome-line">
                {typed}
                <span className="welcome-typed-rest" aria-hidden="true">
                  {current.text.slice(typed.length)}
                </span>
              </p>
            </div>
            <Image
              src={current.src}
              alt=""
              width={254}
              height={291}
              priority
              unoptimized
              draggable={false}
              className="welcome-toothy"
              style={{ width: "auto" }}
            />
          </div>
          <button
            ref={hitRef}
            type="button"
            className="welcome-hit"
            onClick={advance}
            aria-label={current.text}
          />
        </div>
      ) : null}
    </>
  )
}
