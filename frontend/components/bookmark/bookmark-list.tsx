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
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getFaviconUrl } from '@/lib/favicon'

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
                  'group flex items-center gap-3 px-3 py-1.5 transition-[transform,background-color,box-shadow,opacity] duration-150 will-change-transform',
                  'hover:bg-accent',
                  isManageMode && 'cursor-pointer',
                  isSelected && 'bg-primary/10',
                  isDragging && 'z-50 bg-card opacity-80 shadow-lg',
                  enableDrag && 'cursor-grab',
                  isDragging && 'cursor-grabbing'
                )}
              >
                {enableDrag && (
                  <button
                    type="button"
                    className="pointer-events-none shrink-0 touch-none opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    tabIndex={-1}
                    aria-hidden="true"
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
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex size-4 shrink-0 items-center justify-center">
                    {getFaviconUrl(bookmark) ? (
                      <img
                        src={getFaviconUrl(bookmark)!}
                        alt=""
                        className="size-4"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <ExternalLink className="size-4 text-muted-foreground" />
                    )}
                  </div>

                  <span className="min-w-0 flex-1 truncate text-sm">{bookmark.title}</span>

                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                    {getDomain(bookmark.url)}
                  </span>

                  <div className="hidden shrink-0 gap-1 lg:flex">
                    {bookmark.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium"
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
    <SortableContext items={bookmarks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {bookmarks.map((bookmark) => (
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
