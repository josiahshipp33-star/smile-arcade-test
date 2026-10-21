import path from "path"
import type { NextConfig } from "next"

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
  ...(basePath ? { basePath } : {}),
}

export default nextConfig
