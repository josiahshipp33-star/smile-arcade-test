import Image from "@/components/site-image"

export function SmileMatchLogo() {
  return (
    <h1 className="flex select-none flex-col items-center">
      <Image
        src="/match-tooth.png"
        alt=""
        width={72}
        height={72}
        unoptimized
        draggable={false}
        className="mb-3 size-[4.5rem] object-contain"
      />
      <span className="font-[family-name:var(--font-fredoka)] text-[2.35rem] leading-none font-bold tracking-tight text-foreground sm:text-5xl">
        Smile
      </span>
      <span className="mt-1.5 font-[family-name:var(--font-fredoka)] text-[1.7rem] leading-none font-bold tracking-[0.14em] text-primary sm:text-[2rem]">
        Match
      </span>
    </h1>
  )
}
