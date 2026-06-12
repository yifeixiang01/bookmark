'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from '@/lib/bookmark-data'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ExternalLink, Plus, Search, Settings } from 'lucide-react'
import { getFaviconUrl } from '@/lib/favicon'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarks: Bookmark[]
  onAddBookmark: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  bookmarks,
  onAddBookmark,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const filteredBookmarks = bookmarks
    .filter(b => 
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 10)

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="命令面板"
      description="搜索书签或执行操作"
    >
      <CommandInput 
        placeholder="搜索书签或输入命令..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>未找到结果</CommandEmpty>
        
        <CommandGroup heading="快捷操作">
          <CommandItem onSelect={() => {
            onOpenChange(false)
            onAddBookmark()
          }}>
            <Plus className="mr-2 size-4" />
            <span>添加新书签</span>
          </CommandItem>
          <CommandItem>
            <Search className="mr-2 size-4" />
            <span>高级搜索</span>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 size-4" />
            <span>设置</span>
          </CommandItem>
        </CommandGroup>

        {filteredBookmarks.length > 0 && (
          <CommandGroup heading="书签">
            {filteredBookmarks.map(bookmark => (
              <CommandItem
                key={bookmark.id}
                onSelect={() => {
                  window.open(bookmark.url, '_blank')
                  onOpenChange(false)
                }}
                className="flex items-center gap-2"
              >
                {getFaviconUrl(bookmark) ? (
                  <img
                    src={getFaviconUrl(bookmark)!}
                    alt=""
                    className="size-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <ExternalLink className="size-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{bookmark.title}</span>
                <span className="text-xs text-muted-foreground truncate max-w-32">
                  {new URL(bookmark.url).hostname}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
