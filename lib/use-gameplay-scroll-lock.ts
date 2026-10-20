"use client"

import { useEffect } from "react"

/** Lock page bounce-scroll on phones while a game round is in progress. */
export function useGameplayScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const html = document.documentElement
    html.classList.add("gameplay-lock")

    const preventScroll = (event: TouchEvent) => {
      event.preventDefault()
    }

    document.addEventListener("touchmove", preventScroll, { passive: false })

    return () => {
      html.classList.remove("gameplay-lock")
      document.removeEventListener("touchmove", preventScroll)
    }
  }, [locked])
}
