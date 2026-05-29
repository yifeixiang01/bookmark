'use client'

import { Category } from '@/lib/bookmark-data'
import { Button } from '@/components/ui/button'
import { Trash2, FolderInput, Tags, X, CheckSquare, Square } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

interface BatchActionsBarProps {
  selectedCount: number
  totalCount: number
  isAllSelected: boolean
  categories: Category[]
  tags: string[]
  onSelectAll: () => void
  onClearSelection: () => void
  onDelete: () => void
  onMoveToCategory: (categoryId: string) => void
  onAddTags: (tag: string) => void
  onClose: () => void
}

export function BatchActionsBar({
  selectedCount,
  totalCount: _totalCount,
  isAllSelected,
  categories,
  tags,
  onSelectAll,
  onClearSelection,
  onDelete,
  onMoveToCategory,
  onAddTags,
  onClose,
}: BatchActionsBarProps) {
  // Flatten categories for dropdown
  const flatCategories = categories.flatMap(cat => [
    cat,
    ...(cat.children || []).map(child => ({ ...child, name: `  ${child.name}` }))
  ]).filter(cat => cat.id !== 'all')

  const hasSelection = selectedCount > 0

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <span className="text-sm font-medium min-w-[4.5rem]">
        已选择 {selectedCount} 项
      </span>
      
      <div className="mx-2 h-4 w-px bg-border" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={isAllSelected ? onClearSelection : onSelectAll}
        className="gap-1.5"
      >
        {isAllSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
        {isAllSelected ? '取消全选' : '全选'}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!hasSelection} className="gap-1.5">
            <FolderInput className="size-4" />
            移动分类
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-64 overflow-y-auto">
          <DropdownMenuLabel>选择目标分类</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {flatCategories.map(cat => (
            <DropdownMenuItem 
              key={cat.id}
              onClick={() => onMoveToCategory(cat.id)}
            >
              {cat.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!hasSelection} className="gap-1.5">
            <Tags className="size-4" />
            添加标签
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-64 overflow-y-auto">
          <DropdownMenuLabel>选择要添加的标签</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tags.length === 0 ? (
            <DropdownMenuItem disabled>暂无标签</DropdownMenuItem>
          ) : (
            tags.map(tag => (
              <DropdownMenuItem key={tag} onClick={() => onAddTags(tag)}>
                {tag}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onDelete}
        disabled={!hasSelection}
        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-4" />
        删除
      </Button>
      
      <div className="mx-2 h-4 w-px bg-border" />
      
      <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
        <X className="size-4" />
      </Button>
    </div>
  )
}
