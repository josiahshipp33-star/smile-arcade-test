import type { Metadata, Viewport } from "next"
import { Fredoka, Geist, Geist_Mono } from "next/font/google"

import { withBasePath } from "@/lib/base-path"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "Toothy Town — Dental Games for Kids",
    template: "%s — Toothy Town",
  },
  description:
    "Play fun dental-themed games while you wait. Designed for kids in the dentist's waiting room.",
  authors: [{ name: "Toothy Town" }],
  openGraph: {
    title: "Toothy Town — Dental Games for Kids",
    description:
      "Play fun dental-themed games while you wait. Designed for kids in the dentist's waiting room.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toothy Town — Dental Games for Kids",
    description:
      "Play fun dental-themed games while you wait. Designed for kids in the dentist's waiting room.",
  },
  icons: {
    icon: withBasePath("/favicon.svg"),
  },
}

export const viewport: Viewport = {
  themeColor: "#f7f9f4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
