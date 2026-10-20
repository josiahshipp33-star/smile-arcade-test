import Image from "@/components/site-image"

export function ToothyLogo() {
  return (
    <Image
      src="/smile-arcade-logo.png"
      alt="Smile Arcade"
      width={1296}
      height={789}
      priority
      className="mx-auto h-auto w-full max-w-[15.5rem] select-none sm:max-w-[18rem]"
    />
  )
}
