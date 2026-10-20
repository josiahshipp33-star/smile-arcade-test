import Image from "@/components/site-image"

export function ToothBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[#d7f3e6]">
      <Image
        src="/brush-tooth.svg"
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
