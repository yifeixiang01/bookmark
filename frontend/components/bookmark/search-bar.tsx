'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Search,
  LayoutGrid,
  List,
  Settings2,
} from 'lucide-react'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  isManageMode: boolean
  onManageModeChange: (value: boolean) => void
  totalCount: number
  filteredCount: number
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isManageMode,
  onManageModeChange,
  totalCount,
  filteredCount,
}: SearchBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background/50 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索书签..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-20 bg-secondary border-0"
          />

        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-md border border-border bg-secondary p-0.5">
          <Toggle
            pressed={viewMode === 'grid'}
            onPressedChange={() => onViewModeChange('grid')}
            size="sm"
            className="rounded-sm data-[state=on]:bg-background"
            aria-label="网格视图"
          >
            <LayoutGrid className="size-5" />
          </Toggle>
          <Toggle
            pressed={viewMode === 'list'}
            onPressedChange={() => onViewModeChange('list')}
            size="sm"
            className="rounded-sm data-[state=on]:bg-background"
            aria-label="列表视图"
          >
            <List className="size-5" />
          </Toggle>
        </div>

        {/* Manage mode toggle */}
        <Button
          variant={isManageMode ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onManageModeChange(!isManageMode)}
          className="gap-1.5"
        >
          <Settings2 className="size-5" />
          管理
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>共 {totalCount} 个书签</span>
        {filteredCount !== totalCount && (
          <span>筛选结果: {filteredCount} 个</span>
        )}
      </div>
    </div>
  )
}
