/** Prefix a root-relative public asset path for GitHub Pages subfolder hosting. */
export function withBasePath(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  if (!path.startsWith("/") || path.startsWith("//")) return path
  if (!base) return path
  return `${base}${path}`
}
