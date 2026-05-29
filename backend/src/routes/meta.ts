import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const fetchMetaSchema = z.object({
  url: z.string().min(1),
})

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Invalid URL')
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return new URL(withProtocol).href
}

function resolveUrl(base: string, rel: string): string {
  try {
    return new URL(rel, base).href
  } catch {
    return rel
  }
}

function parseMeta(html: string, pageUrl: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : undefined

  let description: string | undefined
  let favicon: string | undefined

  const metaRegex = /<meta[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0]
    const property =
      tag.match(/property=["']([^"']+)["']/i)?.[1] ||
      tag.match(/name=["']([^"']+)["']/i)?.[1]
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1]

    if (!property || !content) continue

    const prop = property.toLowerCase()
    if ((prop === 'description' || prop === 'og:description') && !description) {
      description = content
    }
    if ((prop === 'og:image' || prop === 'og:image:url') && !favicon) {
      favicon = resolveUrl(pageUrl, content)
    }
  }

  const linkRegex = /<link\b[^>]*>/gi
  const links: string[] = []
  while ((match = linkRegex.exec(html)) !== null) {
    const tag = match[0]
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() || ''
    if (!rel.includes('icon')) continue

    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (href) {
      links.push(resolveUrl(pageUrl, href))
    }
  }

  if (links.length > 0) {
    const bestPng = links.find((link) => /\.png(\?|$)/i.test(link))
    favicon = bestPng || links[0]
  }

  if (!favicon) {
    try {
      const url = new URL('/favicon.ico', pageUrl)
      favicon = url.href
    } catch {
      try {
        const domain = new URL(pageUrl).hostname
        favicon = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
      } catch {
        // ignore
      }
    }
  }

  return { title, description, favicon }
}

router.post('/', async (req, res) => {
  const result = fetchMetaSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  let url: string
  try {
    url = normalizeUrl(result.data.url)
  } catch {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      res.status(502).json({ error: 'Failed to fetch page' })
      return
    }

    const finalUrl = response.url || url
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      res.status(200).json(parseMeta('', finalUrl))
      return
    }

    const html = await response.text()
    res.json(parseMeta(html, finalUrl))
  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Request timeout' })
      return
    }
    res.status(502).json({ error: err.message || 'Failed to fetch page' })
  }
})

export default router
