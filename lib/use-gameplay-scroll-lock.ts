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

    const preventSelect = (event: Event) => {
      event.preventDefault()
    }

    document.addEventListener("touchmove", preventScroll, { passive: false })
    document.addEventListener("selectstart", preventSelect)
    document.addEventListener("dragstart", preventSelect)
    document.addEventListener("contextmenu", preventSelect)

    return () => {
      html.classList.remove("gameplay-lock")
      document.removeEventListener("touchmove", preventScroll)
      document.removeEventListener("selectstart", preventSelect)
      document.removeEventListener("dragstart", preventSelect)
      document.removeEventListener("contextmenu", preventSelect)
    }
  }, [locked])
}
