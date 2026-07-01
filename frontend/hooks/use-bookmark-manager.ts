'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Bookmark, Category, Tag, initialCategories } from '@/lib/bookmark-data'
import { api, ApiBookmark, ApiCategory, ApiTag } from '@/lib/api'

type ViewMode = 'grid' | 'list'
type SortOption = 'visits' | 'recent' | 'alpha' | 'custom'

function apiToBookmark(b: ApiBookmark): Bookmark {
  return {
    ...b,
    createdAt: new Date(b.createdAt),
  }
}

function apiToCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    count: c.count ?? 0,
    order: c.order ?? 0,
    children: c.children?.map(apiToCategory),
  }
}

function apiToTag(t: ApiTag): Tag {
  return { ...t }
}

export function useBookmarkManager() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categoriesData, setCategoriesData] = useState<Category[]>([])
  const [tagsData, setTagsData] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('visits')
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [commandOpen, setCommandOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  // Fetch initial data
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const [bms, cats, tgs] = await Promise.all([
          api.bookmarks.list(),
          api.categories.list(),
          api.tags.list(),
        ])
        if (cancelled) return
        setBookmarks(bms.map(apiToBookmark))
        setCategoriesData(cats.length > 0 ? cats.map(apiToCategory) : initialCategories)
        setTagsData(tgs.map(apiToTag))
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Keyboard shortcut for command palette (disabled per requirement)
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
  //       e.preventDefault()
  //       setCommandOpen(true)
  //     }
  //   }
  //   window.addEventListener('keydown', handleKeyDown)
  //   return () => window.removeEventListener('keydown', handleKeyDown)
  // }, [])

  // Fuzzy search
  const fuzzyMatch = useCallback((text: string, query: string): boolean => {
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    let queryIndex = 0
    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        queryIndex++
      }
    }
    return queryIndex === lowerQuery.length
  }, [])

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks]

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter(b =>
        selectedTags.some(tag => b.tags.includes(tag))
      )
    }

    // Search filter
    if (searchQuery) {
      result = result.filter(b =>
        fuzzyMatch(b.title, searchQuery) ||
        fuzzyMatch(b.url, searchQuery) ||
        (b.description && fuzzyMatch(b.description, searchQuery))
      )
    }

    // Sort
    switch (sortBy) {
      case 'visits':
        result.sort((a, b) => b.visits - a.visits)
        break
      case 'alpha':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'custom':
        result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        break
    }

    return result
  }, [bookmarks, selectedTags, searchQuery, sortBy, fuzzyMatch])

  // Category counts
  const categoriesWithCounts = useMemo(() => {
    const countMap = new Map<string, number>()
    bookmarks.forEach(b => {
      const cat = b.category
      countMap.set(cat, (countMap.get(cat) || 0) + 1)
      if (cat.includes('-')) {
        const parent = cat.split('-')[0]
        countMap.set(parent, (countMap.get(parent) || 0) + 1)
      }
    })
    countMap.set('all', bookmarks.length)

    const updateCounts = (cats: Category[]): Category[] => {
      return cats
        .map(c => ({
          ...c,
          count: countMap.get(c.id) || 0,
          children: c.children ? updateCounts(c.children) : undefined,
        }))
        .filter(c => c.name !== '待处理' || c.count > 0)
    }

    return updateCounts(categoriesData)
  }, [bookmarks, categoriesData])

  // Actions
  const toggleBookmarkSelection = useCallback((id: string) => {
    setSelectedBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAllVisible = useCallback(() => {
    setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.id)))
  }, [filteredBookmarks])

  const clearSelection = useCallback(() => {
    setSelectedBookmarks(new Set())
  }, [])

  const deleteSelected = useCallback(async () => {
    const ids = Array.from(selectedBookmarks)
    if (ids.length === 0) return
    await api.bookmarks.batchDelete(ids)
    setBookmarks(prev => prev.filter(b => !selectedBookmarks.has(b.id)))
    setSelectedBookmarks(new Set())
  }, [selectedBookmarks])

  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'id' | 'visits' | 'createdAt'>) => {
    const newBm = await api.bookmarks.create({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      category_id: bookmark.category,
      tags: bookmark.tags,
      favicon: bookmark.favicon,
    })
    setBookmarks(prev => [apiToBookmark(newBm), ...prev])
  }, [])

  const importBookmarks = useCallback(async (bookmarksToImport: { title: string; url: string; favicon?: string }[]) => {
    const result = await api.bookmarks.import(bookmarksToImport)
    if (result.imported.length > 0) {
      const imported = result.imported.map(apiToBookmark)
      setBookmarks(prev => [...imported, ...prev])
      setCategoriesData(prev => {
        const hasPending = prev.some(cat => cat.id === result.category.id)
        if (hasPending) return prev
        return [...prev, apiToCategory(result.category)]
      })
    }
    return { imported: result.imported.length, skipped: result.skipped }
  }, [])

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  // Tag management
  const addTag = useCallback(async (name: string, color: string) => {
    const newTag = await api.tags.create({ name, color })
    setTagsData(prev => [...prev, apiToTag(newTag)])
  }, [])

  const updateTag = useCallback(async (id: string, name: string, color: string) => {
    const oldTag = tagsData.find(t => t.id === id)
    await api.tags.update(id, { name, color })
    setTagsData(prev => prev.map(t => t.id === id ? { ...t, name, color } : t))
    if (oldTag && oldTag.name !== name) {
      setBookmarks(prev => prev.map(b => ({
        ...b,
        tags: b.tags.map(t => t === oldTag.name ? name : t)
      })))
    }
  }, [tagsData])

  const deleteTag = useCallback(async (id: string) => {
    const tag = tagsData.find(t => t.id === id)
    if (!tag) return
    await api.tags.delete(id)
    setBookmarks(prev => prev.map(b => ({
      ...b,
      tags: b.tags.filter(t => t !== tag.name)
    })))
    setTagsData(prev => prev.filter(t => t.id !== id))
    setSelectedTags(prev => prev.filter(t => t !== tag.name))
  }, [tagsData])

  const mergeTags = useCallback(async (sourceId: string, targetId: string) => {
    await api.tags.merge(sourceId, targetId)
    const sourceTag = tagsData.find(t => t.id === sourceId)
    const targetTag = tagsData.find(t => t.id === targetId)
    if (sourceTag && targetTag) {
      setBookmarks(prev => prev.map(b => ({
        ...b,
        tags: b.tags.includes(sourceTag.name)
          ? [...new Set(b.tags.map(t => t === sourceTag.name ? targetTag.name : t))]
          : b.tags
      })))
      setTagsData(prev => prev.filter(t => t.id !== sourceId))
      setSelectedTags(prev => prev.filter(t => t !== sourceTag.name))
    }
  }, [tagsData])

  const getTagUsageCount = useCallback((tagName: string) => {
    return bookmarks.filter(b => b.tags.includes(tagName)).length
  }, [bookmarks])

  // Category management
  const addCategory = useCallback(async (name: string, icon: string, color: string, parentId?: string) => {
    const newCategory = await api.categories.create({
      name,
      icon,
      color: color || undefined,
      parent_id: parentId,
    })
    setCategoriesData(prev => {
      if (parentId) {
        return prev.map(cat =>
          cat.id === parentId
            ? { ...cat, children: [...(cat.children || []), apiToCategory(newCategory)] }
            : cat
        )
      }
      return [...prev, apiToCategory(newCategory)]
    })
  }, [])

  const updateCategory = useCallback(async (id: string, name: string, icon: string, color: string) => {
    await api.categories.update(id, { name, icon, color })
    setCategoriesData(prev => {
      const updateInList = (cats: Category[]): Category[] =>
        cats.map(cat => {
          if (cat.id === id) return { ...cat, name, icon, color: color || undefined }
          if (cat.children) return { ...cat, children: updateInList(cat.children) }
          return cat
        })
      return updateInList(prev)
    })
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    await api.categories.delete(id)
    setBookmarks(prev => prev.map(b =>
      b.category === id || b.category.startsWith(id + '-')
        ? { ...b, category: 'all' }
        : b
    ))
    setCategoriesData(prev => {
      let updated = prev.filter(cat => cat.id !== id)
      updated = updated.map(cat => ({
        ...cat,
        children: cat.children?.filter(c => c.id !== id)
      }))
      return updated
    })
  }, [])

  const reorderCategories = useCallback(async (newCategories: Category[]) => {
    const items = newCategories.map((c, i) => ({ id: c.id, sort_order: i }))
    await api.categories.reorder(items)
    setCategoriesData(newCategories)
  }, [])

  const moveBookmarkToCategory = useCallback(async (bookmarkId: string, categoryId: string) => {
    await api.bookmarks.update(bookmarkId, { category_id: categoryId })
    setBookmarks(prev => prev.map(b =>
      b.id === bookmarkId ? { ...b, category: categoryId } : b
    ))
  }, [])

  const updateBookmark = useCallback(async (id: string, data: Partial<Omit<Bookmark, 'id' | 'createdAt'>>) => {
    const updated = await api.bookmarks.update(id, {
      title: data.title,
      url: data.url,
      description: data.description,
      category_id: data.category,
      tags: data.tags,
      favicon: data.favicon,
    })
    setBookmarks(prev => prev.map(b => b.id === id ? apiToBookmark(updated) : b))
  }, [])

  const deleteBookmark = useCallback(async (id: string) => {
    await api.bookmarks.delete(id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
    setSelectedBookmarks(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const reorderBookmarks = useCallback(async (newOrder: Bookmark[]) => {
    const items = newOrder.map((b, i) => ({ id: b.id, sort_order: i }))
    const orderMap = new Map(items.map(item => [item.id, item.sort_order]))
    setBookmarks(prev => prev.map(b => ({
      ...b,
      sortOrder: orderMap.get(b.id) ?? b.sortOrder,
    })))

    try {
      await api.bookmarks.reorder(items)
    } catch (error) {
      console.error('Failed to reorder bookmarks:', error)
      throw error
    }
  }, [])

  const moveSelectedToCategory = useCallback(async (categoryId: string) => {
    const ids = Array.from(selectedBookmarks)
    if (ids.length === 0) return
    await api.bookmarks.batchMove(ids, categoryId)
    setBookmarks(prev => prev.map(b =>
      selectedBookmarks.has(b.id) ? { ...b, category: categoryId } : b
    ))
    setSelectedBookmarks(new Set())
  }, [selectedBookmarks])

  const addTagsToSelected = useCallback(async (tag: string) => {
    const ids = Array.from(selectedBookmarks)
    if (ids.length === 0) return
    await Promise.all(ids.map(async id => {
      const bookmark = bookmarks.find(b => b.id === id)
      if (!bookmark || bookmark.tags.includes(tag)) return
      await api.bookmarks.update(id, { tags: [...bookmark.tags, tag] })
    }))
    setBookmarks(prev => prev.map(b => {
      if (selectedBookmarks.has(b.id) && !b.tags.includes(tag)) {
        return { ...b, tags: [...b.tags, tag] }
      }
      return b
    }))
  }, [selectedBookmarks, bookmarks])

  const getCategoryBookmarkCount = useCallback((categoryId: string) => {
    if (categoryId === 'all') return bookmarks.length
    return bookmarks.filter(b =>
      b.category === categoryId || b.category.startsWith(categoryId + '-')
    ).length
  }, [bookmarks])

  return {
    bookmarks: filteredBookmarks,
    allBookmarks: bookmarks,
    categories: categoriesWithCounts,
    tags: tagsData.map(t => t.name),
    tagsData,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    isManageMode,
    setIsManageMode,
    selectedBookmarks,
    toggleBookmarkSelection,
    selectAllVisible,
    clearSelection,
    deleteSelected,
    addBookmark,
    importBookmarks,
    commandOpen,
    setCommandOpen,
    addModalOpen,
    setAddModalOpen,
    importModalOpen,
    setImportModalOpen,
    expandedCategories,
    toggleCategory,
    sidebarCollapsed,
    setSidebarCollapsed,
    tagManagerOpen,
    setTagManagerOpen,
    categoryManagerOpen,
    setCategoryManagerOpen,
    addTag,
    updateTag,
    deleteTag,
    mergeTags,
    getTagUsageCount,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    moveBookmarkToCategory,
    moveSelectedToCategory,
    reorderBookmarks,
    updateBookmark,
    deleteBookmark,
    addTagsToSelected,
    getCategoryBookmarkCount,
    loading,
  }
}
