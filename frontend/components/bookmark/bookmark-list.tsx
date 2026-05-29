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
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BookmarkListProps {
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

interface DraggableBookmarkRowProps {
  bookmark: Bookmark
  isManageMode: boolean
  isSelected: boolean
  onToggleSelection: () => void
  enableDrag?: boolean
  sortable?: boolean
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
}

function SortableBookmarkRow({
  bookmark,
  isManageMode,
  isSelected,
  onToggleSelection,
  enableDrag,
  sortable,
  onEdit,
  onDelete,
}: DraggableBookmarkRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    disabled: !enableDrag || isManageMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getFavicon = (bookmark: Bookmark) => {
    if (bookmark.favicon) return bookmark.favicon
    try {
      const domain = new URL(bookmark.url).hostname
      return `https://www.google.com/s2/favicons?sz=16&domain=${domain}`
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
              'group flex items-center gap-3 px-3 py-1.5 transition-colors',
              'hover:bg-accent',
              isManageMode && 'cursor-pointer',
              isSelected && 'bg-primary/10',
              isDragging && 'opacity-50 z-50 bg-card',
            sortable && 'cursor-grab'
            )}
          >
            {enableDrag && (
              <button
                className={cn(
                  'opacity-0 group-hover:opacity-100 transition-opacity touch-none shrink-0',
                  sortable ? 'cursor-grab' : 'cursor-grab'
                )}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="size-5 text-muted-foreground" />
              </button>
            )}

            {isManageMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelection}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
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
              className="flex flex-1 items-center gap-3 min-w-0"
            >
              <div className="flex size-4 shrink-0 items-center justify-center">
                {getFavicon(bookmark) ? (
                  <img
                    src={getFavicon(bookmark)!}
                    alt=""
                    className="size-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <ExternalLink className="size-4 text-muted-foreground" />
                )}
              </div>
              
              <span className="min-w-0 flex-1 truncate text-sm">
                {bookmark.title}
              </span>
              
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {getDomain(bookmark.url)}
              </span>
              
              <div className="hidden shrink-0 gap-1 lg:flex">
                {bookmark.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${getTagColor(tag)}20`,
                      color: getTagColor(tag),
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {bookmark.visits} 次访问
              </span>
            </a>

            {!isManageMode && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(bookmark) }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="编辑"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id) }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
                    title="删除"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            )}
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

export function BookmarkList({
  bookmarks,
  isManageMode,
  selectedBookmarks,
  onToggleSelection,
  enableDrag = true,
  sortable = false,
  onEdit,
  onDelete,
}: BookmarkListProps) {
  return (
    <SortableContext
      items={bookmarks.map(b => b.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {bookmarks.map(bookmark => (
          <SortableBookmarkRow
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
