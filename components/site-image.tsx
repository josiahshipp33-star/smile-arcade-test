import NextImage, { type ImageProps } from "next/image"

import { withBasePath } from "@/lib/base-path"

export default function Image({ src, ...props }: ImageProps) {
  const resolved =
    typeof src === "string" ? withBasePath(src) : src
  return <NextImage src={resolved} {...props} />
}
