import { withBasePath } from "@/lib/base-path"

export function ToothBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#d7f3e6]">
      <svg
        viewBox="0 0 400 700"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <image
          href={withBasePath("/brush-tooth.svg")}
          x="0"
          y="0"
          width="400"
          height="700"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  )
}
