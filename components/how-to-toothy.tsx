import Image from "@/components/site-image"

const toothyClass =
  "pointer-events-none absolute -top-3 -right-2 z-10 h-[5.4rem] w-auto rotate-[16deg] object-contain sm:-top-4 sm:-right-3 sm:h-24"

export function HowToToothy({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={160}
      height={200}
      unoptimized
      draggable={false}
      className={toothyClass}
    />
  )
}

export function HowToToothyWink() {
  return (
    <span className="how-to-toothy-wink pointer-events-none absolute -top-3 -right-2 z-10 sm:-top-4 sm:-right-3">
      <Image
        src="/toothy-smile.png"
        alt=""
        width={160}
        height={200}
        unoptimized
        draggable={false}
        className="how-to-toothy-open h-[5.4rem] w-auto object-contain sm:h-24"
      />
      <Image
        src="/toothy-wink.png"
        alt=""
        width={160}
        height={200}
        unoptimized
        draggable={false}
        className="how-to-toothy-shut h-[5.4rem] w-auto object-contain sm:h-24"
      />
    </span>
  )
}
