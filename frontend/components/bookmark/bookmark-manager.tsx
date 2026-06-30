'use client'

import { useBookmarkManager } from '@/hooks/use-bookmark-manager'
import { CategorySidebar } from './category-sidebar'
import { TagCloud } from './tag-cloud'
import { SearchBar } from './search-bar'
import { BookmarkGrid } from './bookmark-grid'
import { BookmarkList } from './bookmark-list'
import { BatchActionsBar } from './batch-actions-bar'
import { AddBookmarkModal } from './add-bookmark-modal'
import { EditBookmarkModal } from './edit-bookmark-modal'
import { TagManagerModal } from './tag-manager-modal'
import { CategoryManagerModal } from './category-manager-modal'
import { ImportBookmarksModal } from './import-bookmarks-modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useState, useMemo } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon, LogOut } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Bookmark } from '@/lib/bookmark-data'
import { getFaviconUrl } from '@/lib/favicon'

interface BookmarkManagerProps {
  user: { id: string; username: string }
  onLogout: () => void
}

export function BookmarkManager({ user, onLogout }: BookmarkManagerProps) {
  const {
    bookmarks,
    allBookmarks,
    categories,
    tags,
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
    addTag,
    updateTag,
    deleteTag,
    mergeTags,
    getTagUsageCount,
    categoryManagerOpen,
    setCategoryManagerOpen,
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
  } = useBookmarkManager()

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [tagSidebarCollapsed, setTagSidebarCollapsed] = useState(true)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  )

  const dropAnimation = {
    duration: 180,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.35',
        },
      },
    }),
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragCancel = () => {
    setActiveDragId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string
    const isActiveBookmark = allBookmarks.some(b => b.id === activeId)
    const isOverBookmark = bookmarks.some(b => b.id === overId)
    const isOverCategory = categories.some(category =>
      category.id === overId || category.children?.some(child => child.id === overId)
    )

    // Bookmark reordering within the list
    if (isActiveBookmark && isOverBookmark) {
      if (sortBy !== 'custom') {
        setSortBy('custom')
      }
      const oldIndex = bookmarks.findIndex(b => b.id === activeId)
      const newIndex = bookmarks.findIndex(b => b.id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(bookmarks, oldIndex, newIndex)
        reorderBookmarks(newOrder)
      }
      return
    }

    // Bookmark dropped on a category
    if (isActiveBookmark && isOverCategory && overId !== 'all') {
      moveBookmarkToCategory(activeId, overId)
    }
  }

  const activeBookmark = activeDragId
    ? allBookmarks.find(b => b.id === activeDragId)
    : null

  // Group bookmarks by category
  const flatCategories = useMemo(() => {
    return categories.flatMap((c) =>
      c.children ? [c, ...c.children] : [c]
    )
  }, [categories])

  const groupedBookmarks = useMemo(() => {
    return flatCategories
      .map((cat) => ({
        category: cat,
        bookmarks: bookmarks.filter((b) => b.category === cat.id),
      }))
      .filter((g) => g.bookmarks.length > 0)
  }, [flatCategories, bookmarks])

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (categoryId !== 'all') {
      const el = document.getElementById(`category-section-${categoryId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // Scroll to top
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollArea) {
        scrollArea.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setEditModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteBookmark(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const isAllSelected = bookmarks.length > 0 && selectedBookmarks.size === bookmarks.length

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Left sidebar - Categories */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          onAddBookmark={() => setAddModalOpen(true)}
          onImportBookmarks={() => setImportModalOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenCategoryManager={() => setCategoryManagerOpen(true)}
          onDropBookmark={moveBookmarkToCategory}
        />

        {/* Main content */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isManageMode={isManageMode}
            onManageModeChange={setIsManageMode}
            totalCount={allBookmarks.length}
            filteredCount={bookmarks.length}
          />

          <ScrollArea className="min-h-0 flex-1 p-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
              </div>
            )}

            {!loading && groupedBookmarks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  未找到书签
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  尝试调整筛选条件或添加新书签
                </p>
              </div>
            )}

            {!loading && (
              <div className="space-y-8">
                {groupedBookmarks.map((group) => (
                  <div
                    key={group.category.id}
                    id={`category-section-${group.category.id}`}
                  >
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.category.name}
                      <span className="ml-2 text-xs font-normal text-muted-foreground/60">
                        ({group.bookmarks.length})
                      </span>
                    </h3>
                    {viewMode === 'grid' ? (
                      <BookmarkGrid
                        bookmarks={group.bookmarks}
                        isManageMode={isManageMode}
                        selectedBookmarks={selectedBookmarks}
                        onToggleSelection={toggleBookmarkSelection}
                        sortable={sortBy === 'custom' && !isManageMode}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ) : (
                      <BookmarkList
                        bookmarks={group.bookmarks}
                        isManageMode={isManageMode}
                        selectedBookmarks={selectedBookmarks}
                        onToggleSelection={toggleBookmarkSelection}
                        sortable={sortBy === 'custom' && !isManageMode}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </main>

        {/* Right sidebar - Tags */}
        <TagCloud
          tags={tags}
          tagsData={tagsData}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onOpenTagManager={() => setTagManagerOpen(true)}
          isCollapsed={tagSidebarCollapsed}
          onToggleCollapse={() => setTagSidebarCollapsed(!tagSidebarCollapsed)}
        />

        {/* Batch actions bar */}
        {isManageMode && (
          <BatchActionsBar
            selectedCount={selectedBookmarks.size}
            totalCount={bookmarks.length}
            isAllSelected={isAllSelected}
            categories={categories}
            tags={tags}
            onSelectAll={selectAllVisible}
            onClearSelection={clearSelection}
            onDelete={deleteSelected}
            onMoveToCategory={moveSelectedToCategory}
            onAddTags={addTagsToSelected}
            onClose={() => {
              clearSelection()
              setIsManageMode(false)
            }}
          />
        )}

        {/* Add bookmark modal */}
        <AddBookmarkModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          categories={categories}
          tags={tags}
          onAdd={addBookmark}
        />

        <ImportBookmarksModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onImport={importBookmarks}
        />

        {/* Edit bookmark modal */}
        <EditBookmarkModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          categories={categories}
          tags={tags}
          bookmark={editingBookmark}
          onSave={updateBookmark}
        />

        {/* Tag manager modal */}
        <TagManagerModal
          open={tagManagerOpen}
          onOpenChange={setTagManagerOpen}
          tags={tagsData}
          onAddTag={addTag}
          onUpdateTag={updateTag}
          onDeleteTag={deleteTag}
          onMergeTags={mergeTags}
          getTagUsageCount={getTagUsageCount}
        />

        {/* Category manager modal */}
        <CategoryManagerModal
          open={categoryManagerOpen}
          onOpenChange={setCategoryManagerOpen}
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          getCategoryBookmarkCount={getCategoryBookmarkCount}
        />

        {/* Drag overlay */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeBookmark && (
            <div className="pointer-events-none flex w-[88px] select-none flex-col items-center gap-1.5 rounded-lg border border-primary/70 bg-card p-2.5 shadow-2xl ring-4 ring-primary/10">
              <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
                {getFaviconUrl(activeBookmark) ? (
                  <img
                    src={getFaviconUrl(activeBookmark)!}
                    alt=""
                    className="size-6 rounded"
                  />
                ) : (
                  <ExternalLink className="size-5 text-muted-foreground" />
                )}
              </div>
              <span className="w-full truncate text-center text-xs font-medium">{activeBookmark.title}</span>
            </div>
          )}
        </DragOverlay>

        {/* Floating user bar */}
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur-sm">
          <span className="text-xs font-medium text-muted-foreground">{user.username}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setLogoutConfirmOpen(true)}
            title="退出登录"
          >
            <LogOut className="size-4" />
          </Button>
        </div>

        {/* Delete bookmark confirmation */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除书签？</AlertDialogTitle>
              <AlertDialogDescription>
                删除后无法恢复，确定要删除这个书签吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout confirmation */}
        <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认退出登录？</AlertDialogTitle>
              <AlertDialogDescription>
                退出后需要重新登录才能访问书签数据。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLogoutConfirmOpen(false)}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction onClick={onLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                退出登录
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  )
}
