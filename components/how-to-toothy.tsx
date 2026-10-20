import Image from "@/components/site-image"

export function HowToToothy({ src }: { src: string }) {
  return (
    <span className="how-to-toothy-wink pointer-events-none absolute -top-3 -right-2 z-10 sm:-top-4 sm:-right-3">
      <Image
        src={src}
        alt=""
        width={160}
        height={200}
        unoptimized
        draggable={false}
        className="how-to-toothy-open h-[5.4rem] w-auto object-contain sm:h-24"
        style={{ width: "auto" }}
      />
      <Image
        src="/toothy-wink.png"
        alt=""
        width={160}
        height={200}
        unoptimized
        draggable={false}
        className="how-to-toothy-shut h-[5.4rem] w-auto object-contain sm:h-24"
        style={{ width: "auto" }}
      />
    </span>
  )
}

export function HowToToothyWink() {
  return <HowToToothy src="/toothy-smile.png" />
}
