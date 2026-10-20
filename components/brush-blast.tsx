"use client"

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Image from "@/components/site-image"
import Link from "next/link"

import { BrushBlastLogo } from "@/components/brush-blast-logo"
import { HowToToothyWink } from "@/components/how-to-toothy"
import { ToothBackdrop } from "@/components/tooth-backdrop"
import { Button } from "@/components/ui/button"
import { withBasePath } from "@/lib/base-path"
import { useGameplayScrollLock } from "@/lib/use-gameplay-scroll-lock"

const BRUSH_WIDTH = 48
const BRUSH_IDLE_SRC = "/brush-blast-toothbrush-idle.png"
const BRUSH_SCRUB_SRC = "/brush-blast-toothbrush-scrub.png"
const BRUSH_ART_W = 253
const BRUSH_ART_H = 1493
const BRUSH_HEIGHT = (BRUSH_WIDTH * BRUSH_ART_H) / BRUSH_ART_W
const VIEW_W = 400
const VIEW_H = 700
const TOOTH_BOX = { x: 29.53, y: 147, w: 340.94, h: 410 }
const PLAQUE_DONE = 1
const SHINE_DONE = 1
const CLEAN_PLAQUE_SHARE = 33
const CLEAN_FOOD_SHARE = 33
const CLEAN_SHINE_SHARE = 34
const FOOD_REVEAL = 0.68
const BRUSH_RADIUS = 25
const BRUSH_STRENGTH_TOP = 0.16
const BRUSH_STRENGTH_BASE = 0.14
const RINSE_RADIUS = 34
const RINSE_STRENGTH = 0.2
const SPRAY_DELAY_MS = 480
const FOOD_FALL_MS = 1500
const LAST_LAYER_CUTOFF = 28
const LEVEL2_ART_SRC = "/brush-blast-level-2.png"
const LEVEL2_ART_SIZE = 1254

type ToolId = "brush" | "spray" | "rinse"

const TOOLS: { id: ToolId; label: string; src: string; job: string }[] = [
  { id: "brush", label: "Brush", src: "/toothbrush.svg", job: "plaque" },
  { id: "spray", label: "Blast", src: "/tool-sprayer.svg", job: "food" },
  { id: "rinse", label: "Rinse", src: "/tool-rinse.svg", job: "shine" },
]

type FoodKind = {
  id: string
  label: string
  src: string
}

const FOOD_KINDS: FoodKind[] = [
  { id: "corn", label: "corn", src: "/food-corn.svg" },
  { id: "noodle", label: "noodle", src: "/food-noodle.svg" },
  { id: "gummy", label: "gummy", src: "/food-gummy.svg" },
]

const FOOD_SLOTS = [
  { nx: 0.43, ny: 0.30 },
  { nx: 0.58, ny: 0.32 },
  { nx: 0.50, ny: 0.46 },
] as const

const LEVEL2_FOOD_SLOTS = [
  { nx: 0.36, ny: 0.39 },
  { nx: 0.62, ny: 0.39 },
  { nx: 0.372, ny: 0.64 },
  { nx: 0.604, ny: 0.64 },
] as const

type StuckFood = {
  id: number
  kind: FoodKind
  nx: number
  ny: number
  size: number
  uncovered: number
  blasted: boolean
  soaking: boolean
  popping: boolean
  exited: boolean
}

type Phase = "ready" | "playing" | "finished"

type Burst = {
  id: number
  x: number
  y: number
  kind: "pop" | "shine"
}

type Layout = {
  scale: number
  ox: number
  oy: number
  tooth: { x: number; y: number; w: number; h: number }
}

function layoutForSize(width: number, height: number, level: 1 | 2): Layout {
  if (level === 2) {
    const scale = Math.min(width / LEVEL2_ART_SIZE, height / LEVEL2_ART_SIZE)
    const ox = (width - LEVEL2_ART_SIZE * scale) / 2
    const oy = (height - LEVEL2_ART_SIZE * scale) / 2
    return {
      scale,
      ox,
      oy,
      tooth: {
        x: ox,
        y: oy,
        w: LEVEL2_ART_SIZE * scale,
        h: LEVEL2_ART_SIZE * scale,
      },
    }
  }
  const scale = Math.min(width / VIEW_W, height / VIEW_H)
  const ox = (width - VIEW_W * scale) / 2
  const oy = (height - VIEW_H * scale) / 2
  return {
    scale,
    ox,
    oy,
    tooth: {
      x: ox + TOOTH_BOX.x * scale,
      y: oy + TOOTH_BOX.y * scale,
      w: TOOTH_BOX.w * scale,
      h: TOOTH_BOX.h * scale,
    },
  }
}

function foodLayout(layout: Layout, food: StuckFood) {
  return {
    left: layout.tooth.x + food.nx * layout.tooth.w,
    top: layout.tooth.y + food.ny * layout.tooth.h,
    size: food.size * layout.tooth.w,
  }
}

function cleanPercentFrom(
  plaquePercent: number,
  blastedCount: number,
  foodTotal: number,
  shinePercent: number,
) {
  const plaquePart = Math.round((Math.min(100, Math.max(0, plaquePercent)) / 100) * CLEAN_PLAQUE_SHARE)
  const foodPart =
    foodTotal <= 0
      ? 0
      : Math.round((Math.min(foodTotal, Math.max(0, blastedCount)) / foodTotal) * CLEAN_FOOD_SHARE)
  const shinePart = Math.round((Math.min(100, Math.max(0, shinePercent)) / 100) * CLEAN_SHINE_SHARE)
  return Math.min(100, plaquePart + foodPart + shinePart)
}

function isWhiteToothPixel(r: number, g: number, b: number, a: number) {
  if (a < 80) return false
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  const chroma = Math.max(r, g, b) - Math.min(r, g, b)
  return lum > 165 && chroma < 50
}

function sampleArtNorm(
  art: { data: Uint8ClampedArray; width: number; height: number },
  nx: number,
  ny: number,
) {
  const x = Math.min(art.width - 1, Math.max(0, Math.round(nx * art.width)))
  const y = Math.min(art.height - 1, Math.max(0, Math.round(ny * art.height)))
  const i = (y * art.width + x) * 4
  return {
    r: art.data[i],
    g: art.data[i + 1],
    b: art.data[i + 2],
    a: art.data[i + 3],
  }
}

function foodPixelAllowedAt(
  art: { data: Uint8ClampedArray; width: number; height: number },
  nx: number,
  ny: number,
  level: 1 | 2,
) {
  const pixel = sampleArtNorm(art, nx, ny)
  if (level === 1) return pixel.a > 80
  if (isWhiteToothPixel(pixel.r, pixel.g, pixel.b, pixel.a)) return true
  const lum = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b
  const chroma = Math.max(pixel.r, pixel.g, pixel.b) - Math.min(pixel.r, pixel.g, pixel.b)
  if (pixel.a < 40 || lum > 55 || chroma > 40) return false
  const left = sampleArtNorm(art, nx - 0.012, ny)
  const right = sampleArtNorm(art, nx + 0.012, ny)
  return (
    isWhiteToothPixel(left.r, left.g, left.b, left.a) &&
    isWhiteToothPixel(right.r, right.g, right.b, right.a)
  )
}

function readArtPixels(source: HTMLImageElement | HTMLCanvasElement) {
  const width =
    source instanceof HTMLCanvasElement ? source.width : source.naturalWidth
  const height =
    source instanceof HTMLCanvasElement ? source.height : source.naturalHeight
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(source, 0, 0)
  return { data: ctx.getImageData(0, 0, width, height).data, width, height }
}

function foodSquareFits(
  nx: number,
  ny: number,
  size: number,
  art: { data: Uint8ClampedArray; width: number; height: number },
  level: 1 | 2,
) {
  const { width, height } = art
  const cx = nx * width
  const cy = ny * height
  const half = (size * width) / 2 * 1.06
  for (const dx of [-1, -0.5, 0, 0.5, 1]) {
    for (const dy of [-1, -0.5, 0, 0.5, 1]) {
      const x = Math.round(cx + dx * half)
      const y = Math.round(cy + dy * half)
      if (x < 0 || y < 0 || x >= width || y >= height) return false
      if (!foodPixelAllowedAt(art, x / width, y / height, level)) {
        return false
      }
    }
  }
  return true
}

function constrainStuckFoods(
  foods: StuckFood[],
  art: { data: Uint8ClampedArray; width: number; height: number },
  level: 1 | 2,
) {
  return foods.flatMap((food) => {
    const homeX = food.nx
    const homeY = food.ny
    let nx = food.nx
    let ny = food.ny
    let size = food.size
    for (let step = 0; step < 48; step += 1) {
      if (foodSquareFits(nx, ny, size, art, level)) {
        return [{ ...food, nx, ny, size }]
      }
      nx += (homeX - nx) * 0.18
      ny += (homeY - ny) * 0.18
      if (step % 6 === 5) size *= 0.94
    }
    if (foodSquareFits(homeX, homeY, food.size * 0.92, art, level)) {
      return [{ ...food, nx: homeX, ny: homeY, size: food.size * 0.92 }]
    }
    if (level === 1) {
      return [{ ...food, nx, ny, size: size * 0.85 }]
    }
    return []
  })
}

function foodRevealAmount(
  food: StuckFood,
  layout: Layout,
  dpr: number,
  top: CanvasRenderingContext2D,
  base: CanvasRenderingContext2D,
  mask: CanvasRenderingContext2D,
) {
  const placed = foodLayout(layout, food)
  const sampleX = (placed.left - placed.size / 2) * dpr
  const sampleY = (placed.top - placed.size / 2) * dpr
  const sampleW = placed.size * dpr
  const sampleH = placed.size * dpr
  return Math.min(
    sampleRegion(top, mask, sampleX, sampleY, sampleW, sampleH),
    sampleRegion(base, mask, sampleX, sampleY, sampleW, sampleH),
  )
}

function buildTeethMask(source: HTMLImageElement) {
  const canvas = document.createElement("canvas")
  canvas.width = source.naturalWidth
  canvas.height = source.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas
  ctx.drawImage(source, 0, 0)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = image
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const nx = (p % width) / width
    const ny = Math.floor(p / width) / height
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const chroma = Math.max(r, g, b) - Math.min(r, g, b)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const inTeeth =
      ny > 0.3 && ny < 0.73 && nx > 0.14 && nx < 0.86 && lum > 145 && chroma < 28
    if (!inTeeth) data[i + 3] = 0
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

function placeFood(level: 1 | 2 = 1): StuckFood[] {
  const slots = level === 2 ? LEVEL2_FOOD_SLOTS : FOOD_SLOTS
  const size = level === 2 ? 0.042 : 0.1
  return slots.map((slot, index) => ({
    id: index + 1,
    kind: FOOD_KINDS[index % FOOD_KINDS.length],
    nx: slot.nx,
    ny: slot.ny,
    size,
    uncovered: 0,
    blasted: false,
    soaking: false,
    popping: false,
    exited: false,
  }))
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

function EndActions({
  onPlayAgain,
  onNextLevel,
}: {
  onPlayAgain: () => void
  onNextLevel?: () => void
}) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      {onNextLevel ? (
        <Button
          onClick={onNextLevel}
          className="h-auto rounded-full px-8 py-4 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
        >
          Next Level
        </Button>
      ) : null}
      <Button
        onClick={onPlayAgain}
        variant={onNextLevel ? "outline" : undefined}
        className={
          onNextLevel
            ? "h-auto rounded-full border-2 px-8 py-4 text-lg font-bold"
            : "h-auto rounded-full px-8 py-4 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
        }
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

const FOOD_POP_FRAMES: Keyframe[] = [
  { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", offset: 0 },
  {
    transform: "translate(-50%, calc(-50% + 16px)) scale(1.3, 0.64) rotate(-10deg)",
    offset: 0.12,
  },
  {
    transform: "translate(-50%, calc(-50% - 74px)) scale(1.2) rotate(-16deg)",
    offset: 0.28,
  },
  {
    transform: "translate(-50%, calc(-50% - 78px)) scale(1.08) rotate(8deg)",
    offset: 0.34,
  },
  {
    transform: "translate(calc(-50% + 24px), calc(-50% + 520px)) scale(1) rotate(400deg)",
    offset: 1,
  },
]

function PoppingFood({
  src,
  left,
  top,
  size,
  onDone,
}: {
  src: string
  left: number
  top: number
  size: number
  onDone: () => void
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const anim = node.animate(FOOD_POP_FRAMES, {
      duration: FOOD_FALL_MS,
      easing: "linear",
      fill: "forwards",
    })
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      onDoneRef.current()
    }
    anim.onfinish = finish
    const fallback = window.setTimeout(finish, FOOD_FALL_MS + 80)
    return () => {
      window.clearTimeout(fallback)
      anim.cancel()
    }
  }, [])

  return (
    <div
      ref={nodeRef}
      className="bb-food-popping pointer-events-none absolute z-30"
      data-food-pop="true"
      style={{
        left,
        top,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
      }}
    >
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        draggable={false}
        unoptimized
        className="h-full w-full object-contain"
      />
    </div>
  )
}

function BurstEffect({
  burst,
  onDone,
}: {
  burst: Burst
  onDone: (id: number) => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(burst.id), 620)
    return () => window.clearTimeout(timer)
  }, [burst.id, onDone])

  return (
    <div
      className="scrub-pop-layer"
      style={
        {
          "--burst-x": `${burst.x}px`,
          "--burst-y": `${burst.y}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {burst.kind === "shine" ? <div className="sparkle-pop-glow" /> : null}
      <p className={burst.kind === "shine" ? "shine-pop-label" : "pop-food-label"}>
        {burst.kind === "shine" ? "Shine!" : "Pop!"}
      </p>
    </div>
  )
}

function paintDirt(
  ctx: CanvasRenderingContext2D,
  mask: CanvasImageSource,
  tooth: Layout["tooth"],
  dpr: number,
  kind: "base" | "top",
) {
  const x = tooth.x * dpr
  const y = tooth.y * dpr
  const w = tooth.w * dpr
  const h = tooth.h * dpr
  const layer = document.createElement("canvas")
  layer.width = Math.max(1, Math.round(w))
  layer.height = Math.max(1, Math.round(h))
  const g = layer.getContext("2d")
  if (!g) return

  g.drawImage(mask, 0, 0, layer.width, layer.height)
  g.globalCompositeOperation = "source-in"
  if (kind === "base") {
    const stain = g.createLinearGradient(0, 0, layer.width, layer.height)
    stain.addColorStop(0, "#4a280c")
    stain.addColorStop(0.4, "#7a4312")
    stain.addColorStop(1, "#5a320e")
    g.fillStyle = stain
    g.fillRect(0, 0, layer.width, layer.height)
    g.globalCompositeOperation = "source-atop"
    for (let i = 0; i < 18; i += 1) {
      const blobX = Math.random() * layer.width
      const blobY = Math.random() * layer.height
      const radius = (0.05 + Math.random() * 0.12) * layer.width
      const blob = g.createRadialGradient(blobX, blobY, 0, blobX, blobY, radius)
      blob.addColorStop(0, "rgba(42, 22, 6, 0.82)")
      blob.addColorStop(1, "rgba(70, 38, 10, 0)")
      g.fillStyle = blob
      g.beginPath()
      g.arc(blobX, blobY, radius, 0, Math.PI * 2)
      g.fill()
    }
  } else {
    const stain = g.createLinearGradient(0, 0, layer.width, layer.height)
    stain.addColorStop(0, "#6b3e16")
    stain.addColorStop(0.35, "#a56a22")
    stain.addColorStop(0.7, "#c9a037")
    stain.addColorStop(1, "#7a4a18")
    g.fillStyle = stain
    g.fillRect(0, 0, layer.width, layer.height)
    g.globalCompositeOperation = "source-atop"
    for (let i = 0; i < 28; i += 1) {
      const blobX = Math.random() * layer.width
      const blobY = Math.random() * layer.height
      const radius = (0.04 + Math.random() * 0.1) * layer.width
      const blob = g.createRadialGradient(blobX, blobY, 0, blobX, blobY, radius)
      const dark = Math.random() > 0.45
      blob.addColorStop(0, dark ? "rgba(58, 30, 8, 0.72)" : "rgba(212, 176, 64, 0.7)")
      blob.addColorStop(1, "rgba(90, 50, 16, 0)")
      g.fillStyle = blob
      g.beginPath()
      g.arc(blobX, blobY, radius, 0, Math.PI * 2)
      g.fill()
    }
  }

  shadePlaqueWithToothLighting(g, mask, layer.width, layer.height)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.drawImage(layer, x, y)
}

function paintFilm(
  ctx: CanvasRenderingContext2D,
  mask: CanvasImageSource,
  tooth: Layout["tooth"],
  dpr: number,
) {
  const x = tooth.x * dpr
  const y = tooth.y * dpr
  const w = tooth.w * dpr
  const h = tooth.h * dpr
  const layer = document.createElement("canvas")
  layer.width = Math.max(1, Math.round(w))
  layer.height = Math.max(1, Math.round(h))
  const g = layer.getContext("2d")
  if (!g) return
  g.drawImage(mask, 0, 0, layer.width, layer.height)
  g.globalCompositeOperation = "source-in"
  const wash = g.createLinearGradient(0, 0, layer.width, layer.height)
  wash.addColorStop(0, "#f6d98a")
  wash.addColorStop(0.5, "#ead06a")
  wash.addColorStop(1, "#e4c056")
  g.fillStyle = wash
  g.fillRect(0, 0, layer.width, layer.height)
  g.globalCompositeOperation = "source-atop"
  for (let i = 0; i < 12; i += 1) {
    const blobX = Math.random() * layer.width
    const blobY = Math.random() * layer.height
    const radius = (0.06 + Math.random() * 0.1) * layer.width
    const blob = g.createRadialGradient(blobX, blobY, 0, blobX, blobY, radius)
    blob.addColorStop(0, "rgba(210, 160, 50, 0.45)")
    blob.addColorStop(1, "rgba(240, 210, 110, 0)")
    g.fillStyle = blob
    g.beginPath()
    g.arc(blobX, blobY, radius, 0, Math.PI * 2)
    g.fill()
  }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.globalAlpha = 0.72
  ctx.drawImage(layer, x, y)
  ctx.globalAlpha = 1
}

function shadePlaqueWithToothLighting(
  g: CanvasRenderingContext2D,
  tooth: CanvasImageSource,
  w: number,
  h: number,
) {
  const light = document.createElement("canvas")
  light.width = w
  light.height = h
  const lc = light.getContext("2d")
  if (!lc) return
  lc.drawImage(tooth, 0, 0, w, h)
  const image = lc.getImageData(0, 0, w, h)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 80) {
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = 0
      continue
    }
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    let factor = 1
    if (lum >= 40) {
      const t = Math.min(1, Math.max(0, (lum - 188) / (255 - 188)))
      const smooth = t * t * (3 - 2 * t)
      factor = 0.74 + 0.26 * smooth
    }
    const value = Math.round(factor * 255)
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
    data[i + 3] = 255
  }
  lc.putImageData(image, 0, 0)
  g.globalCompositeOperation = "multiply"
  g.drawImage(light, 0, 0)
  g.globalCompositeOperation = "source-over"
}

function eraseAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, `rgba(0, 0, 0, ${strength})`)
  gradient.addColorStop(0.3, `rgba(0, 0, 0, ${strength * 0.62})`)
  gradient.addColorStop(0.58, `rgba(0, 0, 0, ${strength * 0.28})`)
  gradient.addColorStop(0.82, `rgba(0, 0, 0, ${strength * 0.08})`)
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.globalCompositeOperation = "destination-out"
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = "source-over"
}

function snapLastLayerOpaque(data: Uint8ClampedArray) {
  for (let i = 3; i < data.length; i += 4) {
    data[i] = data[i] > LAST_LAYER_CUTOFF ? 255 : 0
  }
}

function drawSolidLastLayer(
  amount: CanvasRenderingContext2D,
  display: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  const pad = Math.ceil(radius + 2)
  const x = Math.max(0, Math.floor(cx - pad))
  const y = Math.max(0, Math.floor(cy - pad))
  const w = Math.max(1, Math.min(amount.canvas.width - x, pad * 2))
  const h = Math.max(1, Math.min(amount.canvas.height - y, pad * 2))
  if (w < 2 || h < 2) return
  const image = amount.getImageData(x, y, w, h)
  snapLastLayerOpaque(image.data)
  display.putImageData(image, x, y)
}

function copySolidLastLayer(
  amount: HTMLCanvasElement,
  display: HTMLCanvasElement,
) {
  const actx = amount.getContext("2d", { willReadFrequently: true })
  const dctx = display.getContext("2d", { willReadFrequently: true })
  if (!actx || !dctx) return
  const image = actx.getImageData(0, 0, amount.width, amount.height)
  snapLastLayerOpaque(image.data)
  dctx.putImageData(image, 0, 0)
}

const sampleScratch: { canvas: HTMLCanvasElement | null } = { canvas: null }

function sampleRegion(
  dirt: CanvasRenderingContext2D,
  mask: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const sx = Math.max(0, Math.floor(x))
  const sy = Math.max(0, Math.floor(y))
  const sw = Math.max(1, Math.min(Math.floor(w), dirt.canvas.width - sx))
  const sh = Math.max(1, Math.min(Math.floor(h), dirt.canvas.height - sy))
  if (sw < 2 || sh < 2) return 0
  const tw = Math.max(8, Math.min(72, Math.round(sw / 6)))
  const th = Math.max(8, Math.min(88, Math.round(sh / 6)))
  if (!sampleScratch.canvas) sampleScratch.canvas = document.createElement("canvas")
  const scratch = sampleScratch.canvas
  scratch.width = tw * 2
  scratch.height = th
  const ctx = scratch.getContext("2d")
  if (!ctx) return 0
  ctx.clearRect(0, 0, tw * 2, th)
  ctx.drawImage(dirt.canvas, sx, sy, sw, sh, 0, 0, tw, th)
  ctx.drawImage(mask.canvas, sx, sy, sw, sh, tw, 0, tw, th)
  const data = ctx.getImageData(0, 0, tw * 2, th).data
  let tooth = 0
  let dirty = 0
  for (let py = 0; py < th; py += 1) {
    for (let px = 0; px < tw; px += 1) {
      const maskA = data[(py * tw * 2 + (px + tw)) * 4 + 3]
      if (maskA < 80) continue
      tooth += 1
      const dirtA = data[(py * tw * 2 + px) * 4 + 3]
      if (dirtA > 48) dirty += 1
    }
  }
  if (tooth === 0) return 1
  return 1 - dirty / tooth
}

function sampleShineOnClean(
  film: CanvasRenderingContext2D,
  plaque: CanvasRenderingContext2D,
  mask: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const sx = Math.max(0, Math.floor(x))
  const sy = Math.max(0, Math.floor(y))
  const sw = Math.max(1, Math.min(Math.floor(w), film.canvas.width - sx))
  const sh = Math.max(1, Math.min(Math.floor(h), film.canvas.height - sy))
  if (sw < 2 || sh < 2) return 0
  const tw = Math.max(8, Math.min(72, Math.round(sw / 6)))
  const th = Math.max(8, Math.min(88, Math.round(sh / 6)))
  const scratch = document.createElement("canvas")
  scratch.width = tw * 3
  scratch.height = th
  const ctx = scratch.getContext("2d")
  if (!ctx) return 0
  ctx.drawImage(film.canvas, sx, sy, sw, sh, 0, 0, tw, th)
  ctx.drawImage(plaque.canvas, sx, sy, sw, sh, tw, 0, tw, th)
  ctx.drawImage(mask.canvas, sx, sy, sw, sh, tw * 2, 0, tw, th)
  const data = ctx.getImageData(0, 0, tw * 3, th).data
  let cleanTooth = 0
  let shiny = 0
  for (let py = 0; py < th; py += 1) {
    for (let px = 0; px < tw; px += 1) {
      const maskA = data[(py * tw * 3 + (px + tw * 2)) * 4 + 3]
      if (maskA < 80) continue
      const plaqueA = data[(py * tw * 3 + (px + tw)) * 4 + 3]
      if (plaqueA > 48) continue
      cleanTooth += 1
      const filmA = data[(py * tw * 3 + px) * 4 + 3]
      if (filmA <= 40) shiny += 1
    }
  }
  if (cleanTooth < 8) return 0
  return shiny / cleanTooth
}

function plaqueAlphaAt(plaque: CanvasRenderingContext2D, x: number, y: number) {
  const px = Math.max(0, Math.min(plaque.canvas.width - 1, Math.floor(x)))
  const py = Math.max(0, Math.min(plaque.canvas.height - 1, Math.floor(y)))
  return plaque.getImageData(px, py, 1, 1).data[3]
}

export function BrushBlast() {
  const [phase, setPhase] = useState<Phase>("ready")
  useGameplayScrollLock(phase === "playing")
  const [level, setLevel] = useState<1 | 2>(1)
  const [tool, setTool] = useState<ToolId>("brush")
  const [plaquePercent, setPlaquePercent] = useState(0)
  const [shinePercent, setShinePercent] = useState(0)
  const [foods, setFoods] = useState<StuckFood[]>([])
  const [wiggleId, setWiggleId] = useState<number | null>(null)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [cursor, setCursor] = useState({ x: 50, y: 72, using: false })
  const stageRef = useRef<HTMLElement | null>(null)
  const dirtRef = useRef<HTMLCanvasElement | null>(null)
  const dirtBaseRef = useRef<HTMLCanvasElement | null>(null)
  const dirtAmountRef = useRef<HTMLCanvasElement | null>(null)
  const filmRef = useRef<HTMLCanvasElement | null>(null)
  const maskRef = useRef<HTMLCanvasElement | null>(null)
  const toothImageRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null)
  const toothArtRef = useRef<HTMLImageElement | null>(null)
  const layoutRef = useRef<Layout | null>(null)
  const levelRef = useRef<1 | 2>(1)
  const toolRef = useRef<ToolId>("brush")
  const [layout, setLayout] = useState<Layout | null>(null)
  const [dirtReady, setDirtReady] = useState(false)
  const foodsRef = useRef<StuckFood[]>([])
  const usingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const finishingRef = useRef(false)
  const dprRef = useRef(1)
  const wiggleTimerRef = useRef(0)
  const soakTimersRef = useRef<Map<number, number>>(new Map())
  const fallTimersRef = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    foodsRef.current = foods
  }, [foods])

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    toolRef.current = tool
  }, [tool])

  const clearBurst = useCallback((id: number) => {
    setBursts((current) => current.filter((burst) => burst.id !== id))
  }, [])

  const syncCanvas = useCallback(() => {
    const stage = stageRef.current
    const dirt = dirtRef.current
    const dirtBase = dirtBaseRef.current
    const film = filmRef.current
    if (!stage || !dirt || !dirtBase || !film) return null
    const rect = stage.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    dprRef.current = dpr
    const pixelW = Math.max(1, Math.round(rect.width * dpr))
    const pixelH = Math.max(1, Math.round(rect.height * dpr))
    const sizeOnscreen = (canvas: HTMLCanvasElement) => {
      canvas.width = pixelW
      canvas.height = pixelH
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    sizeOnscreen(dirt)
    sizeOnscreen(dirtBase)
    sizeOnscreen(film)
    if (!dirtAmountRef.current) dirtAmountRef.current = document.createElement("canvas")
    const amount = dirtAmountRef.current
    amount.width = pixelW
    amount.height = pixelH
    if (!maskRef.current) maskRef.current = document.createElement("canvas")
    const mask = maskRef.current
    mask.width = pixelW
    mask.height = pixelH
    const nextLayout = layoutForSize(rect.width, rect.height, levelRef.current)
    layoutRef.current = nextLayout
    setLayout(nextLayout)
    const maskCtx = mask.getContext("2d", { willReadFrequently: true })
    const tooth = toothImageRef.current
    if (maskCtx && tooth) {
      maskCtx.clearRect(0, 0, mask.width, mask.height)
      maskCtx.drawImage(
        tooth,
        nextLayout.tooth.x * dpr,
        nextLayout.tooth.y * dpr,
        nextLayout.tooth.w * dpr,
        nextLayout.tooth.h * dpr,
      )
    }
    return nextLayout
  }, [])

  const paintRoundDirt = useCallback(() => {
    const dirt = dirtRef.current?.getContext("2d", { willReadFrequently: true })
    const amountCanvas = dirtAmountRef.current
    const baseCanvas = dirtBaseRef.current
    const film = filmRef.current?.getContext("2d", { willReadFrequently: true })
    const amount = amountCanvas?.getContext("2d", { willReadFrequently: true })
    const tooth = toothImageRef.current
    const nextLayout = layoutRef.current
    if (!dirt || !amountCanvas || !baseCanvas || !amount || !film || !tooth || !nextLayout) {
      return
    }
    paintDirt(amount, tooth, nextLayout.tooth, dprRef.current, "base")
    copySolidLastLayer(amountCanvas, baseCanvas)
    paintDirt(dirt, tooth, nextLayout.tooth, dprRef.current, "top")
    paintFilm(film, tooth, nextLayout.tooth, dprRef.current)
  }, [])

  const stampBrush = useCallback((cssX: number, cssY: number) => {
    const top = dirtRef.current?.getContext("2d", { willReadFrequently: true })
    const amount = dirtAmountRef.current?.getContext("2d", { willReadFrequently: true })
    const display = dirtBaseRef.current?.getContext("2d", { willReadFrequently: true })
    if (!top || !amount || !display) return
    const dpr = dprRef.current
    const x = cssX * dpr
    const y = cssY * dpr
    const radius = BRUSH_RADIUS * dpr
    eraseAt(top, x, y, radius, BRUSH_STRENGTH_TOP)
    eraseAt(amount, x, y, radius, BRUSH_STRENGTH_BASE)
    drawSolidLastLayer(amount, display, x, y, radius)
  }, [])

  const stampRinse = useCallback((cssX: number, cssY: number) => {
    const film = filmRef.current?.getContext("2d", { willReadFrequently: true })
    const plaque = dirtBaseRef.current?.getContext("2d", { willReadFrequently: true })
    if (!film || !plaque) return false
    const dpr = dprRef.current
    const x = cssX * dpr
    const y = cssY * dpr
    if (plaqueAlphaAt(plaque, x, y) > 50) return false
    eraseAt(film, x, y, RINSE_RADIUS * dpr, RINSE_STRENGTH)
    return true
  }, [])

  const stampStroke = useCallback(
    (x: number, y: number, kind: ToolId) => {
      const last = lastPointRef.current
      if (!last) {
        lastPointRef.current = { x, y }
        return
      }
      const dist = Math.hypot(x - last.x, y - last.y)
      if (dist < 6) return
      const steps = Math.max(1, Math.ceil(dist / 5))
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps
        const sx = last.x + (x - last.x) * t
        const sy = last.y + (y - last.y) * t
        if (kind === "brush") stampBrush(sx, sy)
        if (kind === "rinse") stampRinse(sx, sy)
      }
      lastPointRef.current = { x, y }
    },
    [stampBrush, stampRinse],
  )

  const inspectProgress = useCallback(() => {
    const top = dirtRef.current?.getContext("2d", { willReadFrequently: true })
    const base = dirtBaseRef.current?.getContext("2d", { willReadFrequently: true })
    const film = filmRef.current?.getContext("2d", { willReadFrequently: true })
    const maskCanvas = maskRef.current
    const mask = maskCanvas?.getContext("2d", { willReadFrequently: true })
    const nextLayout = layoutRef.current
    if (!top || !base || !film || !mask || !nextLayout) return

    const dpr = dprRef.current
    const topClean = sampleRegion(
      top,
      mask,
      nextLayout.tooth.x * dpr,
      nextLayout.tooth.y * dpr,
      nextLayout.tooth.w * dpr,
      nextLayout.tooth.h * dpr,
    )
    const baseClean = sampleRegion(
      base,
      mask,
      nextLayout.tooth.x * dpr,
      nextLayout.tooth.y * dpr,
      nextLayout.tooth.w * dpr,
      nextLayout.tooth.h * dpr,
    )
    const plaqueClean = topClean * 0.45 + baseClean * 0.55
    const shine = sampleShineOnClean(
      film,
      base,
      mask,
      nextLayout.tooth.x * dpr,
      nextLayout.tooth.y * dpr,
      nextLayout.tooth.w * dpr,
      nextLayout.tooth.h * dpr,
    )
    const plaquePct = Math.min(100, Math.round(plaqueClean * 100))
    const shinePct = Math.min(100, Math.round(shine * 100))
    setPlaquePercent(plaquePct)
    setShinePercent(shinePct)

    setFoods((current) => {
      let changed = false
      const next = current.map((food) => {
        if (food.blasted || food.popping || food.soaking || food.exited) return food
        const revealed = foodRevealAmount(food, nextLayout, dpr, top, base, mask) >= FOOD_REVEAL ? 1 : 0
        if (food.uncovered === revealed) return food
        changed = true
        return { ...food, uncovered: revealed }
      })
      if (!changed) return current
      foodsRef.current = next
      return next
    })

    const foodDone = foodsRef.current.every((food) => food.exited)
    if (
      !finishingRef.current &&
      foodDone &&
      plaquePct >= 100 &&
      shinePct >= 100
    ) {
      finishingRef.current = true
      window.setTimeout(() => setPhase("finished"), 800)
    }
  }, [])

  useEffect(() => {
    if (phase !== "playing") return
    const image = new window.Image()
    let applied = false
    const onToothArtReady = () => {
      if (applied) return
      applied = true
      toothArtRef.current = image
      toothImageRef.current = level === 2 ? buildTeethMask(image) : image
      syncCanvas()
      paintRoundDirt()
      const art = readArtPixels(image)
      if (art) {
        const fitted = constrainStuckFoods(foodsRef.current, art, level)
        foodsRef.current = fitted
        setFoods(fitted)
      }
      setDirtReady(true)
      inspectProgress()
    }
    image.onload = onToothArtReady
    image.src = withBasePath(level === 2 ? LEVEL2_ART_SRC : "/brush-tooth-clean.png")
    if (image.complete && image.naturalWidth > 0) onToothArtReady()
    const onResize = () => {
      const snapshotOf = (canvas: HTMLCanvasElement | null) => {
        if (!canvas || !canvas.width) return null
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return null
        return {
          image: ctx.getImageData(0, 0, canvas.width, canvas.height),
          w: canvas.width,
          h: canvas.height,
        }
      }
      const snapTop = snapshotOf(dirtRef.current)
      const snapAmount = snapshotOf(dirtAmountRef.current)
      const snapFilm = snapshotOf(filmRef.current)
      syncCanvas()
      paintRoundDirt()
      const restore = (
        target: HTMLCanvasElement | null,
        snap: { image: ImageData; w: number; h: number } | null,
      ) => {
        if (!snap || !target) return
        const ctx = target.getContext("2d")
        if (!ctx) return
        const tmp = document.createElement("canvas")
        tmp.width = snap.w
        tmp.height = snap.h
        tmp.getContext("2d")?.putImageData(snap.image, 0, 0)
        ctx.drawImage(tmp, 0, 0, target.width, target.height)
      }
      if (snapTop || snapAmount || snapFilm) {
        restore(dirtRef.current, snapTop)
        restore(dirtAmountRef.current, snapAmount)
        restore(filmRef.current, snapFilm)
        if (dirtAmountRef.current && dirtBaseRef.current) {
          copySolidLastLayer(dirtAmountRef.current, dirtBaseRef.current)
        }
      }
    }
    window.addEventListener("resize", onResize)
    return () => {
      applied = true
      window.removeEventListener("resize", onResize)
    }
  }, [phase, level, inspectProgress, paintRoundDirt, syncCanvas])

  useEffect(() => {
    if (phase !== "playing" || !cursor.using) return
    let frame = 0
    let lastInspect = 0
    const tick = (now: number) => {
      if (now - lastInspect > 140) {
        inspectProgress()
        lastInspect = now
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [phase, cursor.using, inspectProgress])

  function pointerToStage(event: ReactPointerEvent<HTMLElement>) {
    const stage = stageRef.current
    if (!stage) return null
    const rect = stage.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      xPct: ((event.clientX - rect.left) / rect.width) * 100,
      yPct: ((event.clientY - rect.top) / rect.height) * 100,
    }
  }

  function foodAtPoint(x: number, y: number) {
    const currentLayout = layoutRef.current
    if (!currentLayout) return null
    for (const food of foodsRef.current) {
      if (food.blasted || food.popping || food.soaking || food.exited) continue
      const placed = foodLayout(currentLayout, food)
      if (Math.hypot(x - placed.left, y - placed.top) <= placed.size / 2 + 16) {
        return food
      }
    }
    return null
  }

  function wiggleFood(id: number) {
    setWiggleId(id)
    window.clearTimeout(wiggleTimerRef.current)
    wiggleTimerRef.current = window.setTimeout(() => setWiggleId(null), 420)
  }

  function foodIsRevealed(food: StuckFood) {
    const currentLayout = layoutRef.current
    const top = dirtRef.current?.getContext("2d", { willReadFrequently: true })
    const base = dirtBaseRef.current?.getContext("2d", { willReadFrequently: true })
    const maskCanvas = maskRef.current
    const mask = maskCanvas?.getContext("2d", { willReadFrequently: true })
    if (!currentLayout || !top || !base || !mask) return false
    return foodRevealAmount(food, currentLayout, dprRef.current, top, base, mask) >= FOOD_REVEAL
  }

  function startSoak(food: StuckFood, clientX: number, clientY: number) {
    const live = foodsRef.current.find((item) => item.id === food.id)
    if (!live || live.blasted || live.popping || live.soaking) return
    if (foodsRef.current.some((item) => item.soaking || item.popping)) return
    const soaking = foodsRef.current.map((item) =>
      item.id === food.id ? { ...item, soaking: true } : item,
    )
    foodsRef.current = soaking
    setFoods(soaking)
    const timer = window.setTimeout(() => {
      soakTimersRef.current.delete(food.id)
      blastFood(food.id, clientX, clientY)
    }, SPRAY_DELAY_MS)
    soakTimersRef.current.set(food.id, timer)
  }

  function blastFood(id: number, clientX: number, clientY: number) {
    const live = foodsRef.current.find((item) => item.id === id)
    if (!live || live.blasted) return
    setFoods((current) => {
      const next = current.map((item) =>
        item.id === id
          ? { ...item, soaking: false, popping: true, blasted: true, exited: false }
          : item,
      )
      foodsRef.current = next
      return next
    })
    setBursts((current) => [
      ...current,
      { id: id + Date.now(), x: clientX, y: clientY, kind: "pop" },
    ])
    const existing = fallTimersRef.current.get(id)
    if (existing) window.clearTimeout(existing)
    fallTimersRef.current.set(
      id,
      window.setTimeout(() => finishFoodFall(id), FOOD_FALL_MS + 80),
    )
  }

  function finishFoodFall(id: number) {
    const timer = fallTimersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      fallTimersRef.current.delete(id)
    }
    if (!foodsRef.current.some((item) => item.id === id && item.popping && !item.exited)) {
      return
    }
    setFoods((current) => {
      const next = current.map((item) =>
        item.id === id ? { ...item, popping: false, exited: true } : item,
      )
      foodsRef.current = next
      return next
    })
  }

  function useTool(event: ReactPointerEvent<HTMLElement>) {
    const point = pointerToStage(event)
    if (!point) return
    const currentTool = toolRef.current
    setCursor({
      x: Math.min(96, Math.max(4, point.xPct)),
      y: Math.min(96, Math.max(6, point.yPct)),
      using: true,
    })
    const food = foodAtPoint(point.x, point.y)
    if (currentTool === "brush") {
      stampStroke(point.x, point.y, "brush")
      if (food) wiggleFood(food.id)
      return
    }
    if (currentTool === "spray") {
      if (food) {
        if (foodIsRevealed(food)) startSoak(food, event.clientX, event.clientY)
        else wiggleFood(food.id)
      }
      lastPointRef.current = { x: point.x, y: point.y }
      return
    }
    stampStroke(point.x, point.y, "rinse")
    if (food) wiggleFood(food.id)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    usingRef.current = true
    lastPointRef.current = null
    useTool(event)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!usingRef.current) return
    if (event.pointerType === "mouse" && event.buttons === 0) return
    useTool(event)
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    usingRef.current = false
    lastPointRef.current = null
    setCursor((current) => ({ ...current, using: false }))
    inspectProgress()
  }

  function resetPlay(nextLevel: 1 | 2) {
    finishingRef.current = false
    const nextFoods = placeFood(nextLevel)
    foodsRef.current = nextFoods
    setFoods(nextFoods)
    setTool("brush")
    toolRef.current = "brush"
    setPlaquePercent(0)
    setShinePercent(0)
    setWiggleId(null)
    soakTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    soakTimersRef.current.clear()
    fallTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    fallTimersRef.current.clear()
    setBursts([])
    setDirtReady(false)
    setCursor({ x: 50, y: 72, using: false })
    usingRef.current = false
    lastPointRef.current = null
    levelRef.current = nextLevel
    setLevel(nextLevel)
  }

  function startRound() {
    if (window.location.hash === "#level-2") {
      resetPlay(2)
      setPhase("playing")
      return
    }
    resetPlay(1)
    setPhase("playing")
  }

  function startLevel2() {
    resetPlay(2)
    setPhase("playing")
  }

  const blastedCount = foods.filter((food) => food.blasted).length
  const shineDone = shinePercent >= SHINE_DONE * 100
  const cleanPercent = cleanPercentFrom(
    plaquePercent,
    blastedCount,
    foods.length,
    shinePercent,
  )

  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <GameHeader />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-6 py-10 text-center">
          <BrushBlastLogo />
          <Button onClick={startRound} className="play-bubble-button">
            Play
          </Button>
          <section className="relative mt-8 w-full overflow-visible rounded-3xl bg-card p-5 pr-20 text-left shadow-sm ring-1 ring-border sm:p-6 sm:pr-24">
            <HowToToothyWink />
            <h2 className="text-xl font-extrabold text-foreground">
              How to play
            </h2>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              Pick a tool and clean the tooth. Each tool works on one kind of
              gunk. Finish with a rinse to make it pearly white!
            </p>
            <ul className="mt-5 space-y-3">
              <li className="flex items-center gap-3">
                <Image
                  src="/brush-blast-toothbrush-mark.png"
                  alt=""
                  width={173}
                  height={569}
                  unoptimized
                  className="size-10 object-contain"
                />
                <span className="text-base font-bold text-foreground">
                  Brush the brown plaque
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Image src="/tool-sprayer.svg" alt="" width={40} height={40} className="size-10 object-contain" />
                <span className="text-base font-bold text-foreground">
                  Blast food after you brush it free
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Image src="/tool-rinse.svg" alt="" width={40} height={40} className="size-10 object-contain" />
                <span className="text-base font-bold text-foreground">
                  Rinse for a shiny smile
                </span>
              </li>
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
          {level === 2 ? (
            <Image
              src={LEVEL2_ART_SRC}
              alt=""
              width={LEVEL2_ART_SIZE}
              height={LEVEL2_ART_SIZE}
              unoptimized
              draggable={false}
              className="mb-6 mx-auto h-auto w-56 object-contain sm:w-64"
            />
          ) : (
            <div className="finish-tooth-wrap mb-6">
              <Image
                src="/brush-tooth-clean.png"
                alt=""
                width={180}
                height={216}
                draggable={false}
                className="finish-tooth-sparkle mx-auto h-auto w-36 object-contain sm:w-44"
              />
            </div>
          )}
          <h1 className="font-[family-name:var(--font-fredoka)] text-4xl font-bold text-foreground sm:text-5xl">
            All clean!
          </h1>
          <p className="mt-3 text-lg font-bold text-muted-foreground">
            {level === 2
              ? "What a pearly white smile!"
              : "That tooth is pearly white. Ready for a whole mouth?"}
          </p>
          <EndActions
            onPlayAgain={startRound}
            onNextLevel={level === 1 ? startLevel2 : undefined}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GameHeader>
        <div className="rounded-full bg-mint px-4 py-2 text-sm font-bold text-foreground">
          {level === 2 ? "Level 2" : "Level 1"}
        </div>
      </GameHeader>
      <main
        ref={stageRef}
        className="relative mx-auto w-full max-w-[430px] flex-1 touch-none select-none overflow-hidden bg-[#d7f3e6]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        {level === 2 ? (
          <div className="pointer-events-none absolute inset-0 bg-[#d7f3e6]">
            <Image
              src={LEVEL2_ART_SRC}
              alt=""
              fill
              unoptimized
              draggable={false}
              className="object-contain"
              sizes="430px"
            />
          </div>
        ) : (
          <ToothBackdrop />
        )}
        <canvas
          ref={filmRef}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          aria-hidden="true"
        />
        {!dirtReady ? (
          <div className="absolute inset-0 z-[5] bg-[#d7f3e6]" />
        ) : null}
        {layout
          ? foods
              .filter((food) => !food.exited && !food.popping)
              .map((food) => {
                const placed = foodLayout(layout, food)
                return (
                  <div
                    key={`food-${food.id}`}
                    className={`pointer-events-none absolute z-[2] ${
                      food.soaking
                        ? "food-soaking"
                        : wiggleId === food.id
                          ? "food-wiggle"
                          : food.uncovered >= FOOD_REVEAL
                            ? "food-ready"
                            : ""
                    }`}
                    style={{
                      left: placed.left,
                      top: placed.top,
                      width: placed.size,
                      height: placed.size,
                    }}
                  >
                    <Image
                      src={food.kind.src}
                      alt=""
                      width={64}
                      height={64}
                      draggable={false}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )
              })
          : null}
        <canvas
          ref={dirtBaseRef}
          className="pointer-events-none absolute inset-0 z-[3] h-full w-full"
          aria-hidden="true"
        />
        <canvas
          ref={dirtRef}
          className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
          aria-hidden="true"
        />
        {layout
          ? foods
              .filter((food) => food.popping && !food.exited)
              .map((food) => {
                const placed = foodLayout(layout, food)
                return (
                  <PoppingFood
                    key={`food-pop-${food.id}`}
                    src={food.kind.src}
                    left={placed.left}
                    top={placed.top}
                    size={placed.size}
                    onDone={() => finishFoodFall(food.id)}
                  />
                )
              })
          : null}
        <div className="pointer-events-none absolute top-3 right-3 left-3 z-10 flex justify-center">
          <span className={`clean-chip ${cleanPercent >= 100 ? "clean-chip-done" : ""}`}>
            Clean {cleanPercent}%
          </span>
        </div>
        {shineDone ? <div className="pearly-glow" aria-hidden="true" /> : null}
        <div
          className={`pointer-events-none absolute z-10 ${
            tool === "spray"
              ? `tool-cursor-spray${cursor.using ? " tool-spray-use" : ""}`
              : tool === "rinse"
                ? `tool-cursor-rinse${cursor.using ? " tool-rinse-use" : ""}`
                : ""
          }`}
          style={
            tool === "brush"
              ? {
                  top: `${cursor.y}%`,
                  left: `${cursor.x}%`,
                  width: BRUSH_WIDTH,
                  height: BRUSH_HEIGHT,
                  transform: "translate(-50%, 0)",
                }
              : {
                  top: `${cursor.y}%`,
                  left: `${cursor.x}%`,
                  width: tool === "spray" ? 84 : 72,
                  height: tool === "spray" ? 110 : 72,
                }
          }
        >
          {tool === "brush" ? (
            <Image
              src={cursor.using ? BRUSH_SCRUB_SRC : BRUSH_IDLE_SRC}
              alt=""
              width={BRUSH_ART_W}
              height={BRUSH_ART_H}
              unoptimized
              draggable={false}
              className="h-full w-full object-contain"
            />
          ) : (
            <>
              <Image
                src={tool === "spray" ? "/tool-sprayer.svg" : "/tool-rinse.svg"}
                alt=""
                width={80}
                height={96}
                draggable={false}
                className="relative z-[1] h-full w-full object-contain"
              />
              {tool === "spray" && cursor.using ? (
                <div className="spray-stream" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, index) => (
                    <span key={index} className={`spray-bubble spray-bubble-${index + 1}`} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
      <div className="mx-auto flex w-full max-w-[430px] select-none justify-center gap-3 bg-[#c7ead9] px-3 py-3">
        {TOOLS.map((item) => {
          const selected = tool === item.id
          return (
            <button
              key={item.id}
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation()
                setTool(item.id)
              }}
              className={`tool-dock-btn ${selected ? "tool-dock-btn-on" : ""}`}
              aria-pressed={selected}
            >
              <Image
                src={item.src}
                alt=""
                width={48}
                height={48}
                draggable={false}
                className="size-11 object-contain"
              />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
      {bursts.map((burst) => (
        <BurstEffect key={burst.id} burst={burst} onDone={clearBurst} />
      ))}
    </div>
  )
}
