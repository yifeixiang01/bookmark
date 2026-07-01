'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { categoryIconMap } from '@/lib/category-icons'
import { categoryIcons } from '@/lib/bookmark-data'
import type { LucideIcon } from 'lucide-react'

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
  fallbackIcon?: LucideIcon
  className?: string
}

function normalizeSearchText(text: string) {
  return text.toLowerCase().replace(/\s+/g, '')
}

export function IconPicker({ value, onChange, fallbackIcon: FallbackIcon, className }: IconPickerProps) {
  const [query, setQuery] = useState('')

  const filteredIcons = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)
    if (!normalizedQuery) return categoryIcons

    return categoryIcons.filter((icon) => {
      const iconText = normalizeSearchText(`${icon.name}${icon.value}`)
      const iconName = normalizeSearchText(icon.value.replace(/Icon$/, '').replace(/([a-z])([A-Z])/g, '$1 $2'))
      return iconText.includes(normalizedQuery) || iconName.includes(normalizedQuery)
    })
  }, [query])

  const SelectedIcon = categoryIconMap[value] || FallbackIcon

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索图标 / search icon"
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-40 rounded border p-2">
        <div className="grid grid-cols-8 gap-1">
          {filteredIcons.map((icon) => {
            const IconComponent = categoryIconMap[icon.value] || FallbackIcon
            return (
              <button
                key={icon.value}
                onClick={() => onChange(icon.value)}
                className={cn(
                  'flex size-7 items-center justify-center rounded border transition-colors',
                  value === icon.value
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-accent'
                )}
                title={icon.name}
              >
                <IconComponent className="size-4" />
              </button>
            )
          })}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 rounded-md border bg-background p-2">
        <div className="flex size-8 items-center justify-center rounded bg-muted/60">
          {SelectedIcon ? <SelectedIcon className="size-4" /> : null}
        </div>
        <span className="text-sm text-muted-foreground">{value || '未选择图标'}</span>
      </div>
    </div>
  )
}
