'use client'

import { Bookmark, initialTags } from '@/lib/bookmark-data'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExternalLink, GripVertical, Globe, Clock, Eye, Pencil, Trash2 } from 'lucide-react'
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  isManageMode: boolean
  selectedBookmarks: Set<string>
  onToggleSelection: (id: string) => void
  enableDrag?: boolean
  sortable?: boolean
  onReorder?: (newOrder: Bookmark[]) => void
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
}

interface DraggableBookmarkCardProps {
  bookmark: Bookmark
  isManageMode: boolean
  isSelected: boolean
  onToggleSelection: () => void
  enableDrag?: boolean
  sortable?: boolean
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
}

function SortableBookmarkCard({
  bookmark,
  isManageMode,
  isSelected,
  onToggleSelection,
  enableDrag,
  sortable,
  onEdit,
  onDelete,
}: DraggableBookmarkCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    disabled: !enableDrag || isManageMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
  }

  const getFavicon = (bookmark: Bookmark) => {
    if (bookmark.favicon) return bookmark.favicon
    try {
      const domain = new URL(bookmark.url).hostname
      return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`
    } catch {
      return null
    }
  }

  const getTagColor = (tagName: string) => {
    const tag = initialTags.find(t => t.name === tagName)
    return tag?.color || '#6b7280'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            className={cn(
              'group relative flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 transition-all w-[80px]',
              'hover:border-primary/50 hover:bg-accent',
              isManageMode && 'cursor-pointer',
              isSelected && 'border-primary bg-primary/10',
              isDragging && 'opacity-90 z-[100] scale-110 shadow-2xl ring-2 ring-primary/50 rotate-2',
              sortable && 'cursor-grab'
            )}
          >
            {enableDrag && (
              <button
                className={cn(
                  'absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity touch-none',
                  sortable ? 'cursor-grab' : 'cursor-grab'
                )}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="size-4 text-muted-foreground" />
              </button>
            )}

            {!isManageMode && (
              <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id) }}
                    className="flex size-5 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm hover:bg-accent hover:text-destructive"
                    title="删除"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(bookmark) }}
                    className="flex size-5 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
                    title="编辑"
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
              </div>
            )}

            {isManageMode && (
              <div className="absolute top-1.5 left-1.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelection}
                  onClick={(e) => e.stopPropagation()}
                  className="size-3.5"
                />
              </div>
            )}
            
            <a
              href={isManageMode ? undefined : bookmark.url}
              target={isManageMode ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isManageMode) {
                  e.preventDefault()
                  onToggleSelection()
                }
              }}
              className="flex w-full flex-col items-center gap-1.5 pt-5"
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
                {getFavicon(bookmark) ? (
                  <img
                    src={getFavicon(bookmark)!}
                    alt=""
                    className="size-6 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <ExternalLink className="size-5 text-muted-foreground" />
                )}
              </div>
              
              <span className="w-full truncate text-center text-xs font-medium">
                {bookmark.title}
              </span>
            </a>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          sideOffset={8}
          className="w-72 p-0 overflow-hidden rounded-xl border border-border/50 bg-popover/95 backdrop-blur-sm shadow-xl"
        >
          {/* Header with favicon and title */}
          <div className="flex items-start gap-3 p-3 border-b border-border/50">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary/80">
              {getFavicon(bookmark) ? (
                <img
                  src={getFavicon(bookmark)!}
                  alt=""
                  className="size-7 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <ExternalLink className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {bookmark.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <Globe className="size-4" />
                <span className="truncate">{getDomain(bookmark.url)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {bookmark.description && (
            <div className="px-3 py-2.5 border-b border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {bookmark.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {bookmark.tags.length > 0 && (
            <div className="px-3 py-2.5 border-b border-border/50">
              <div className="flex flex-wrap gap-1.5">
                {bookmark.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${getTagColor(tag)}20`,
                      color: getTagColor(tag),
                      border: `1px solid ${getTagColor(tag)}40`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats footer */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Eye className="size-4" />
              <span>{bookmark.visits} 次访问</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-4" />
              <span>{formatDate(bookmark.createdAt)}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function BookmarkGrid({
  bookmarks,
  isManageMode,
  selectedBookmarks,
  onToggleSelection,
  enableDrag = true,
  sortable = false,
  onEdit,
  onDelete,
}: BookmarkGridProps) {
  return (
    <SortableContext
      items={bookmarks.map(b => b.id)}
      strategy={rectSortingStrategy}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,80px))] gap-2">
        {bookmarks.map(bookmark => (
          <SortableBookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            isManageMode={isManageMode}
            isSelected={selectedBookmarks.has(bookmark.id)}
            onToggleSelection={() => onToggleSelection(bookmark.id)}
            enableDrag={enableDrag && !isManageMode}
            sortable={sortable}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </SortableContext>
  )
}
