export type Game = {
  id: string
  title: string
  description: string
  emoji: string
  color: string
}

export const GAMES: Game[] = [
  {
    id: "brush-blast",
    title: "Brush Blast",
    description: "Brush plaque to uncover food, blast it, and rinse for a shiny smile.",
    emoji: "🪥",
    color: "bg-arcade-blue",
  },
  {
    id: "floss-run",
    title: "Floss Run",
    description: "Slide the floss between teeth to collect shiny stars.",
    emoji: "✨",
    color: "bg-arcade-green",
  },
  {
    id: "cavity-catch",
    title: "Cavity Catch",
    description: "Catch the wiggly germs and keep every tooth happy.",
    emoji: "🦠",
    color: "bg-arcade-yellow",
  },
  {
    id: "sugar-sort",
    title: "Sugar Sort",
    description: "Sort sweet treats into healthy and not-so-healthy piles.",
    emoji: "🍭",
    color: "bg-arcade-orange",
  },
  {
    id: "smile-match",
    title: "Smile Match",
    description: "Flip cards and match each dental tool to its twin.",
    emoji: "🃏",
    color: "bg-arcade-purple",
  },
  {
    id: "smile-art",
    title: "Smile Art",
    description: "Color and decorate your own happy smile.",
    emoji: "🎨",
    color: "bg-arcade-pink",
  },
]

export function getGame(gameId: string) {
  return GAMES.find((game) => game.id === gameId)
}

export function titleFromGameId(gameId: string) {
  const known = getGame(gameId)
  if (known) return known.title
  return gameId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
