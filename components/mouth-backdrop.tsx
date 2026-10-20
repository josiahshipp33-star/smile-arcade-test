import Image from "@/components/site-image"

export function MouthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[#fdceb2]">
      <Image
        src="/brush-blast-level-2.png"
        alt=""
        fill
        unoptimized
        draggable={false}
        className="object-contain"
        sizes="430px"
      />
    </div>
  )
}
