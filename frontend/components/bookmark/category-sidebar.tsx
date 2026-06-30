'use client'

import { Category } from '@/lib/bookmark-data'
import { categoryIconMap, DefaultCategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  ChevronRight,
  Plus,
  Upload,
  PanelLeftClose,
  PanelLeft,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CategorySidebarProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
  expandedCategories: Set<string>
  onToggleCategory: (id: string) => void
  onAddBookmark: () => void
  onImportBookmarks: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onOpenCategoryManager: () => void
  onDropBookmark?: (bookmarkId: string, categoryId: string) => void
}

interface DroppableCategoryProps {
  category: Category
  depth: number
  isSelected: boolean
  isExpanded: boolean
  hasChildren: boolean
  isCollapsed: boolean
  onSelect: () => void
  onToggle: () => void
}

function DroppableCategory({
  category,
  depth,
  isSelected,
  isExpanded,
  hasChildren,
  isCollapsed,
  onSelect,
  onToggle,
}: DroppableCategoryProps) {
  const { setNodeRef, isOver } = useDroppable({ id: category.id })
  const Icon = categoryIconMap[category.icon] || DefaultCategoryIcon

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={setNodeRef}
              onClick={onSelect}
              className={cn(
                'flex w-full items-center justify-center rounded-md p-2 transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isSelected && 'bg-accent text-accent-foreground',
                isOver && 'ring-2 ring-primary bg-primary/10',
                depth > 0 && 'hidden'
              )}
            >
              <Icon 
                className="size-5" 
                style={{ color: category.color || 'var(--muted-foreground)' }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p>{category.name} ({category.count})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <button
      ref={setNodeRef}
      onClick={() => {
        if (hasChildren) {
          onToggle()
        }
        onSelect()
      }}
      className={cn(
        'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        isOver && 'ring-2 ring-primary bg-primary/10',
        depth > 0 && 'ml-4'
      )}
    >
      {hasChildren && (
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            isExpanded && 'rotate-90'
          )}
        />
      )}
      {!hasChildren && depth > 0 && <span className="w-3.5" />}
      <Icon 
        className="size-5 shrink-0" 
        style={{ color: category.color || 'var(--muted-foreground)' }}
      />
      <span className="flex-1 truncate text-left">{category.name}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {category.count}
      </span>
    </button>
  )
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  expandedCategories,
  onToggleCategory,
  onAddBookmark,
  onImportBookmarks,
  isCollapsed,
  onToggleCollapse,
  onOpenCategoryManager,
  onDropBookmark,
}: CategorySidebarProps) {
  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = !!category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategory === category.id

    return (
      <div key={category.id} data-category-id={category.id}>
        <DroppableCategory
          category={category}
          depth={depth}
          isSelected={isSelected}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed}
          onSelect={() => onSelectCategory(category.id)}
          onToggle={() => onToggleCategory(category.id)}
        />
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={cn(
      'flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200',
      isCollapsed ? 'w-14' : 'w-56'
    )}>
      <div className={cn(
        'flex items-center border-b border-border px-3 py-3',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Bookmark className="size-5 text-primary" />
            <span className="font-semibold">书签管理器</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onOpenCategoryManager}
              title="分类管理"
            >
              <Settings2 className="size-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <PanelLeft className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
        </div>
      </div>
      
      <div className={cn('p-2', isCollapsed && 'px-2')}>
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={onAddBookmark} 
                  className="w-full"
                  size="icon"
                >
                  <Plus className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p>添加书签</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button 
            onClick={onAddBookmark} 
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Plus className="size-4" />
            添加书签
          </Button>
        )}
        {!isCollapsed && (
          <Button
            onClick={onImportBookmarks}
            className="mt-2 w-full justify-start gap-2"
            size="sm"
            variant="outline"
          >
            <Upload className="size-4" />
            导入收藏夹
          </Button>
        )}
        {isCollapsed && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onImportBookmarks}
                  className="mt-2 w-full"
                  size="icon"
                  variant="outline"
                >
                  <Upload className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p>导入收藏夹</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <ScrollArea className={cn('flex-1 pb-4', isCollapsed ? 'px-2' : 'px-2')}>
        <div className="space-y-0.5">
          {categories.map(cat => renderCategory(cat))}
        </div>
      </ScrollArea>

      {!isCollapsed && (
        <div className="border-t border-border p-2">
          <p className="text-[10px] text-muted-foreground text-center">
            拖拽书签到分类
          </p>
        </div>
      )}
    </aside>
  )
}
