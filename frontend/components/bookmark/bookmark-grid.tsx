'use client'

import { useMemo } from 'react'
import { Bookmark, initialTags } from '@/lib/bookmark-data'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExternalLink, GripVertical, Globe, Clock, Eye, Pencil, Trash2 } from 'lucide-react'
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getFaviconUrl } from '@/lib/favicon'

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
    transition: transition || 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
  }

  const tagColorMap = useMemo(
    () => new Map(initialTags.map(tag => [tag.name, tag.color])),
    []
  )

  const getTagColor = (tagName: string) => tagColorMap.get(tagName) || '#6b7280'

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                ref={setNodeRef}
                style={style}
                {...(enableDrag ? attributes : {})}
                {...(enableDrag ? listeners : {})}
                className={cn(
                  'group relative flex min-h-[98px] w-[84px] flex-col items-center justify-start gap-2 rounded-lg border border-border bg-card px-2 py-2 transition-[transform,border-color,background-color,box-shadow,opacity] duration-150 will-change-transform',
                  'hover:border-primary/50 hover:bg-accent',
                  isManageMode && 'cursor-pointer',
                  isSelected && 'border-primary bg-primary/10',
                  isDragging && 'z-[100] scale-[1.03] opacity-80 shadow-2xl ring-2 ring-primary/40',
                  enableDrag && 'cursor-grab',
                  isDragging && 'cursor-grabbing'
                )}
              >
                {enableDrag && (
                  <button
                    type="button"
                    className="pointer-events-none absolute top-1.5 right-1.5 touch-none opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <GripVertical className="size-4 text-muted-foreground" />
                  </button>
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
                  className="flex w-full flex-col items-center gap-2 pt-4"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-secondary">
                    {getFaviconUrl(bookmark) ? (
                      <img
                        src={getFaviconUrl(bookmark)!}
                        alt=""
                        className="size-6 rounded"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <ExternalLink className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-4">
                    {bookmark.title}
                  </span>
                </a>
              </div>
            </ContextMenuTrigger>
            {!isManageMode && (onEdit || onDelete) && (
              <ContextMenuContent className="w-36">
                {onEdit && (
                  <ContextMenuItem onClick={() => onEdit(bookmark)}>
                    <Pencil className="size-4" />
                    编辑
                  </ContextMenuItem>
                )}
                {onDelete && (
                  <ContextMenuItem onClick={() => onDelete(bookmark.id)} variant="destructive">
                    <Trash2 className="size-4" />
                    删除
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            )}
          </ContextMenu>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={8}
          className="w-72 overflow-hidden rounded-xl border border-border/50 bg-popover/95 p-0 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-start gap-3 border-b border-border/50 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary/80">
              {getFaviconUrl(bookmark) ? (
                <img
                  src={getFaviconUrl(bookmark)!}
                  alt=""
                  className="size-7 rounded"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <ExternalLink className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-foreground">{bookmark.title}</h4>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="size-4" />
                <span className="truncate">{getDomain(bookmark.url)}</span>
              </div>
            </div>
          </div>

          {bookmark.description && (
            <div className="border-b border-border/50 px-3 py-2.5">
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {bookmark.description}
              </p>
            </div>
          )}

          {bookmark.tags.length > 0 && (
            <div className="border-b border-border/50 px-3 py-2.5">
              <div className="flex flex-wrap gap-1.5">
                {bookmark.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
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

          <div className="flex items-center justify-between bg-muted/30 px-3 py-2">
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
    <SortableContext items={bookmarks.map((b) => b.id)} strategy={rectSortingStrategy}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,84px))] gap-3">
        {bookmarks.map((bookmark) => (
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
