import type { Metadata } from "next"

import { BrushBlast } from "@/components/brush-blast"
import { CavityCatch } from "@/components/cavity-catch"
import { ComingSoon } from "@/components/coming-soon"
import { SmileMatch } from "@/components/smile-match"
import { GAMES, titleFromGameId } from "@/lib/games"

type GamePageProps = {
  params: Promise<{ gameId: string }>
}

export function generateStaticParams() {
  return GAMES.map((game) => ({ gameId: game.id }))
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { gameId } = await params
  const title = titleFromGameId(gameId)

  return {
    title,
    description: `Play ${title} on Smile Arcade.`,
    openGraph: {
      title: `${title} - Smile Arcade`,
    },
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params

  if (gameId === "cavity-catch") {
    return <CavityCatch />
  }

  if (gameId === "brush-blast") {
    return <BrushBlast />
  }

  if (gameId === "smile-match") {
    return <SmileMatch />
  }

  return <ComingSoon title={titleFromGameId(gameId)} />
}
