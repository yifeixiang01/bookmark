export function getFaviconUrl(bookmark: { url: string; favicon?: string | null }) {
  if (bookmark.favicon) return bookmark.favicon

  try {
    return new URL('/favicon.ico', bookmark.url).href
  } catch {
    try {
      const domain = new URL(bookmark.url).hostname
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`
    } catch {
      return null
    }
  }
}
