'use client'

import { useMemo, useState } from 'react'
import { Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface ColorOption {
  name: string
  value: string
}

interface ColorPalettePickerProps {
  value: string
  onChange: (value: string) => void
  colors: ColorOption[]
  className?: string
}

function normalizeSearchText(text: string) {
  return text.toLowerCase().replace(/\s+/g, '')
}

export function ColorPalettePicker({ value, onChange, colors, className }: ColorPalettePickerProps) {
  const [query, setQuery] = useState('')

  const filteredColors = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)
    if (!normalizedQuery) return colors
    return colors.filter((color) => normalizeSearchText(color.name).includes(normalizedQuery))
  }, [colors, query])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索颜色 / search color"
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-28 rounded border p-2">
        <div className="grid grid-cols-8 gap-2">
          {filteredColors.map((color) => {
            const isDefault = !color.value
            const isSelected = value === color.value
            return (
              <button
                key={color.name}
                onClick={() => onChange(color.value)}
                className={cn(
                  'relative flex size-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110',
                  isSelected ? 'border-foreground scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: color.value || 'var(--muted)' }}
                title={color.name}
              >
                {isSelected && <Check className={cn('size-3', isDefault ? 'text-foreground' : 'text-white')} />}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
