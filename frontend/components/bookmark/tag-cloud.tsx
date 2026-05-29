'use client'

import { cn } from '@/lib/utils'
import { Tag } from '@/lib/bookmark-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Settings2, PanelRightClose, PanelRight } from 'lucide-react'

interface TagCloudProps {
  tags: string[]
  tagsData: Tag[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onOpenTagManager: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function TagCloud({ tags, tagsData, selectedTags, onToggleTag, onOpenTagManager, isCollapsed = false, onToggleCollapse }: TagCloudProps) {
  const getTagColor = (tagName: string) => {
    const tag = tagsData.find(t => t.name === tagName)
    return tag?.color || '#6b7280'
  }

  if (isCollapsed) {
    return (
      <aside className="flex h-full w-14 shrink-0 flex-col items-center border-l border-border bg-sidebar py-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onToggleCollapse}
          title="展开标签栏"
        >
          <PanelRight className="size-5" />
        </Button>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-48 shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <h3 className="text-sm font-medium text-muted-foreground">标签筛选</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onOpenTagManager}
            title="标签管理"
          >
            <Settings2 className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggleCollapse}
            title="收起标签栏"
          >
            <PanelRightClose className="size-5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => {
            const color = getTagColor(tag)
            const isSelected = selectedTags.includes(tag)
            
            return (
              <Badge
                key={tag}
                variant="secondary"
                className={cn(
                  'cursor-pointer transition-all text-xs border',
                  isSelected 
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' 
                    : 'hover:brightness-110'
                )}
                style={{
                  backgroundColor: isSelected ? color : `${color}20`,
                  borderColor: color,
                  color: isSelected ? '#fff' : color,
                }}
                onClick={() => onToggleTag(tag)}
              >
                {tag}
              </Badge>
            )
          })}
        </div>
      </ScrollArea>

      {selectedTags.length > 0 && (
        <div className="border-t border-border p-3">
          <button
            onClick={() => selectedTags.forEach(tag => onToggleTag(tag))}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            清除所有标签
          </button>
        </div>
      )}
    </aside>
  )
}
