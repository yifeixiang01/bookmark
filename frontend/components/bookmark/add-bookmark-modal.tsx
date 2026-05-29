'use client'

import { useEffect, useRef, useState } from 'react'
import { Category } from '@/lib/bookmark-data'
import { api } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface AddBookmarkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  tags: string[]
  onAdd: (bookmark: {
    title: string
    url: string
    description?: string
    category: string
    tags: string[]
    favicon?: string
  }) => void
}

export function AddBookmarkModal({
  open,
  onOpenChange,
  categories,
  tags,
  onAdd,
}: AddBookmarkModalProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [previewFavicon, setPreviewFavicon] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  const titleTouched = useRef(false)
  const descTouched = useRef(false)

  const flatCategories = categories.flatMap((cat: Category) =>
    cat.children ? [cat, ...cat.children] : [cat]
  )

  useEffect(() => {
    if (!url) {
      setPreviewFavicon(null)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const finalUrl = url.startsWith('http') ? url : `https://${url}`
        new URL(finalUrl)
        setFetching(true)

        const meta = await api.fetchMeta(finalUrl)
        if (cancelled) return

        if (meta.favicon) {
          setPreviewFavicon(meta.favicon)
        } else {
          const domain = new URL(finalUrl).hostname
          setPreviewFavicon(`https://www.google.com/s2/favicons?sz=128&domain=${domain}`)
        }

        if (meta.title && !titleTouched.current) setTitle(meta.title)
        if (meta.description && !descTouched.current) setDescription(meta.description)
      } catch {
        try {
          const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
          if (!cancelled) {
            setPreviewFavicon(`https://www.google.com/s2/favicons?sz=128&domain=${domain}`)
          }
        } catch {
          if (!cancelled) setPreviewFavicon(null)
        }
      } finally {
        if (!cancelled) setFetching(false)
      }
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [url])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    if (!url || !title || !category) return

    const finalUrl = url.startsWith('http') ? url : `https://${url}`

    onAdd({
      title,
      url: finalUrl,
      description: description || undefined,
      category,
      tags: selectedTags,
      favicon: previewFavicon || undefined,
    })

    setUrl('')
    setTitle('')
    setDescription('')
    setCategory('')
    setSelectedTags([])
    setPreviewFavicon(null)
    titleTouched.current = false
    descTouched.current = false
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加新书签</DialogTitle>
          <DialogDescription>
            输入网址后，系统会自动获取网站标题、描述和图标。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">
              分类 <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="请选择分类" />
              </SelectTrigger>
              <SelectContent>
                {flatCategories
                  .filter((cat) => cat.id !== 'all')
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                  className={cn(
                    'cursor-pointer text-xs',
                    selectedTags.includes(tag) && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              网址 <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                {fetching ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : previewFavicon ? (
                  <img
                    src={previewFavicon}
                    alt=""
                    className="size-6"
                    onError={() => setPreviewFavicon(null)}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">图标</span>
                )}
              </div>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              标题 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="网站标题"
              value={title}
              onChange={(e) => {
                titleTouched.current = true
                setTitle(e.target.value)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述（可选）</Label>
            <Textarea
              id="description"
              placeholder="简短描述..."
              value={description}
              onChange={(e) => {
                descTouched.current = true
                setDescription(e.target.value)
              }}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!url || !title || !category}>
            添加书签
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
