'use client'

import { useMemo, useRef, useState } from 'react'
import { Upload, FileText, Loader2, CheckSquare, Square } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  BrowserBookmarkImportPreview,
  parseBrowserBookmarkHtml,
} from '@/lib/browser-bookmark-import'

interface ImportBookmarksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (bookmarks: { title: string; url: string; favicon?: string }[]) => Promise<{ imported: number; skipped: number }>
}

export function ImportBookmarksModal({
  open,
  onOpenChange,
  onImport,
}: ImportBookmarksModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<BrowserBookmarkImportPreview | null>(null)
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  const selectedBookmarks = useMemo(() => {
    if (!preview) return []
    return preview.bookmarks.filter((bookmark) =>
      Array.from(selectedFolders).some((folderId) =>
        bookmark.folderId === folderId || bookmark.folderId.startsWith(`${folderId}\u001f`)
      )
    )
  }, [preview, selectedFolders])

  const reset = () => {
    setFileName('')
    setPreview(null)
    setSelectedFolders(new Set())
    setError('')
    setImporting(false)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) reset()
  }

  const handleFileChange = async (file?: File) => {
    reset()
    if (!file) return

    setFileName(file.name)
    try {
      const text = await file.text()
      const parsed = parseBrowserBookmarkHtml(text)
      if (parsed.bookmarks.length === 0) {
        setError('没有在文件中识别到可导入的网址。请确认选择的是浏览器导出的 HTML 收藏夹文件。')
        return
      }
      setPreview(parsed)
      setSelectedFolders(new Set(parsed.folders.map((folder) => folder.id)))
    } catch {
      setError('文件解析失败。请重新导出浏览器收藏夹后再试。')
    }
  }

  const toggleFolder = (folderId: string) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const toggleAll = () => {
    if (!preview) return
    if (selectedFolders.size === preview.folders.length) {
      setSelectedFolders(new Set())
    } else {
      setSelectedFolders(new Set(preview.folders.map((folder) => folder.id)))
    }
  }

  const handleImport = async () => {
    if (selectedBookmarks.length === 0) return

    setImporting(true)
    setError('')
    try {
      const nextResult = await onImport(
        selectedBookmarks.map((bookmark) => ({
          title: bookmark.title,
          url: bookmark.url,
          favicon: bookmark.favicon,
        }))
      )
      setResult(nextResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请稍后重试。')
    } finally {
      setImporting(false)
    }
  }

  const allSelected = !!preview && preview.folders.length > 0 && selectedFolders.size === preview.folders.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入浏览器收藏夹</DialogTitle>
          <DialogDescription>
            浏览器不允许网页直接读取本机收藏夹。请先从浏览器导出 HTML 收藏夹文件，再选择要导入的文件夹。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed p-4">
            <input
              ref={inputRef}
              type="file"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {fileName || '选择浏览器导出的 HTML 文件'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chrome、Edge、Firefox 导出的收藏夹 HTML 均可识别
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="mr-2 size-4" />
                选择文件
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>无法导入</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertTitle>导入完成</AlertTitle>
              <AlertDescription>
                已导入 {result.imported} 个书签到“待处理”，跳过 {result.skipped} 个重复网址。
              </AlertDescription>
            </Alert>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  已识别 {preview.bookmarks.length} 个书签，当前选择 {selectedBookmarks.length} 个
                </div>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {allSelected ? <Square className="mr-2 size-4" /> : <CheckSquare className="mr-2 size-4" />}
                  {allSelected ? '取消全选' : '全选'}
                </Button>
              </div>

              <ScrollArea className="h-72 rounded-md border">
                <div className="space-y-1 p-2">
                  {preview.folders.map((folder) => (
                    <label
                      key={folder.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
                    >
                      <Checkbox
                        checked={selectedFolders.has(folder.id)}
                        onCheckedChange={() => toggleFolder(folder.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{folder.path.join(' / ')}</p>
                        <p className="text-xs text-muted-foreground">{folder.count} 个书签</p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={handleImport} disabled={selectedBookmarks.length === 0 || importing}>
            {importing && <Loader2 className="mr-2 size-4 animate-spin" />}
            导入到待处理
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
