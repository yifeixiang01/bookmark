export interface BrowserBookmarkFolder {
  id: string
  name: string
  path: string[]
  count: number
}

export interface ParsedBrowserBookmark {
  title: string
  url: string
  favicon?: string
  folderId: string
  folderPath: string[]
}

export interface BrowserBookmarkImportPreview {
  folders: BrowserBookmarkFolder[]
  bookmarks: ParsedBrowserBookmark[]
}

function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return parsed.toString()
  } catch {
    return null
  }
}

function getBookmarkFavicon(link: HTMLAnchorElement, url: string): string | undefined {
  const icon = link.getAttribute('icon')
  if (icon?.startsWith('data:image/') && icon.length <= 50000) {
    return icon
  }

  const iconUri = link.getAttribute('icon_uri')
  if (iconUri) {
    const normalizedIconUri = normalizeUrl(iconUri)
    if (normalizedIconUri) return normalizedIconUri
  }

  try {
    return new URL('/favicon.ico', url).href
  } catch {
    return undefined
  }
}

function folderIdFromPath(path: string[]): string {
  return path.join('\u001f') || 'root'
}

export function parseBrowserBookmarkHtml(html: string): BrowserBookmarkImportPreview {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const folders = new Map<string, BrowserBookmarkFolder>()
  const bookmarks: ParsedBrowserBookmark[] = []

  const ensureFolder = (path: string[]) => {
    const id = folderIdFromPath(path)
    if (!folders.has(id)) {
      const name = path[path.length - 1] || '未命名文件夹'
      folders.set(id, { id, name, path, count: 0 })
    }
    return folders.get(id)!
  }

  const visitList = (list: Element, path: string[]) => {
    ensureFolder(path)
    const children = Array.from(list.children)

    for (let index = 0; index < children.length; index += 1) {
      const child = children[index]
      if (child.tagName.toLowerCase() !== 'dt') continue

      const link = Array.from(child.children).find(
        (el) => el.tagName.toLowerCase() === 'a'
      ) as HTMLAnchorElement | undefined

      if (link) {
        const url = normalizeUrl(link.getAttribute('href') || '')
        if (!url) continue

        bookmarks.push({
          title: link.textContent?.trim() || url,
          url,
          favicon: getBookmarkFavicon(link, url),
          folderId: folderIdFromPath(path),
          folderPath: path,
        })
        ensureFolder(path).count += 1
        continue
      }

      const heading = Array.from(child.children).find((el) =>
        /^h[1-6]$/i.test(el.tagName)
      )
      const nestedList = Array.from(child.children).find(
        (el) => el.tagName.toLowerCase() === 'dl'
      )

      if (heading && nestedList) {
        const name = heading.textContent?.trim() || '未命名文件夹'
        visitList(nestedList, [...path, name])
        continue
      }

      const siblingList = children[index + 1]
      if (heading && siblingList?.tagName.toLowerCase() === 'dl') {
        const name = heading.textContent?.trim() || '未命名文件夹'
        visitList(siblingList, [...path, name])
        index += 1
      }
    }
  }

  const rootList = doc.querySelector('dl')
  if (rootList) {
    visitList(rootList, ['浏览器收藏夹'])
  }

  return {
    folders: Array.from(folders.values())
      .filter((folder) => folder.count > 0)
      .sort((a, b) => a.path.join('/').localeCompare(b.path.join('/'))),
    bookmarks,
  }
}
