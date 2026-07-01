'use client'

import { useMemo, useState } from 'react'
import { Category, categoryIcons, categoryColors } from '@/lib/bookmark-data'
import { categoryIconMap, DefaultCategoryIcon, FolderCategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Check,
  GripVertical,
  FolderPlus,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CategoryManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onAddCategory: (name: string, icon: string, color: string, parentId?: string) => void
  onUpdateCategory: (id: string, name: string, icon: string, color: string) => void
  onDeleteCategory: (id: string) => void
  onReorderCategories: (categories: Category[]) => void
  getCategoryBookmarkCount: (categoryId: string) => number
}

interface SortableCategoryItemProps {
  category: Category
  depth?: number
  isSelected: boolean
  draggable?: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onAddChild: () => void
  bookmarkCount: number
}

function SortableCategoryItem({
  category,
  depth = 0,
  isSelected,
  draggable = true,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  bookmarkCount,
}: SortableCategoryItemProps) {
  const sortable = useSortable({ id: category.id, disabled: !draggable || category.id === 'all' })
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable

  const style = draggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
      }
    : undefined

  const Icon = categoryIconMap[category.icon] || DefaultCategoryIcon
  const isAllCategory = category.id === 'all'

  return (
    <div
      ref={draggable ? setNodeRef : undefined}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border p-2 transition-[transform,background-color,box-shadow,opacity] duration-150',
        draggable && isDragging && 'opacity-50',
        isSelected ? 'border-primary bg-accent' : 'border-border bg-card hover:bg-accent/50',
        depth > 0 && 'ml-6'
      )}
    >
      {!isAllCategory && draggable && (
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      {(!draggable || isAllCategory) && <div className="w-4" />}
      
      <button
        onClick={onSelect}
        className="flex flex-1 items-center gap-2"
      >
        <div
          className="flex size-7 items-center justify-center rounded"
          style={{ backgroundColor: category.color ? `${category.color}20` : undefined }}
        >
          <Icon 
            className="size-4" 
            style={{ color: category.color || 'currentColor' }}
          />
        </div>
        <span className="flex-1 text-left text-sm">{category.name}</span>
        <span className="text-xs text-muted-foreground">{bookmarkCount}</span>
      </button>

      {!isAllCategory && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" />
              编辑
            </DropdownMenuItem>
            {depth === 0 && (
              <DropdownMenuItem onClick={onAddChild}>
                <FolderPlus className="mr-2 size-4" />
                添加子分类
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export function CategoryManagerModal({
  open,
  onOpenChange,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  getCategoryBookmarkCount,
}: CategoryManagerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [parentIdForChild, setParentIdForChild] = useState<string | undefined>()
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('FolderIcon')
  const [editColor, setEditColor] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const topLevelCategories = sortedCategories.filter(cat => cat.id !== 'all')
    const oldIndex = topLevelCategories.findIndex(c => c.id === active.id)
    const newIndex = topLevelCategories.findIndex(c => c.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newCategories = arrayMove(topLevelCategories, oldIndex, newIndex)
      const reordered = [
        sortedCategories.find(cat => cat.id === 'all'),
        ...newCategories,
      ]
        .filter((cat): cat is Category => Boolean(cat))
        .map((cat, index) => ({
          ...cat,
          order: index,
        }))
      onReorderCategories(reordered)
    }
  }

  const handleStartAdd = () => {
    setSelectedCategory(null)
    setIsEditing(true)
    setIsAddingChild(false)
    setParentIdForChild(undefined)
    setEditName('')
    setEditIcon('FolderIcon')
    setEditColor('')
  }

  const handleStartAddChild = (parentId: string) => {
    setSelectedCategory(null)
    setIsEditing(true)
    setIsAddingChild(true)
    setParentIdForChild(parentId)
    setEditName('')
    setEditIcon('FileTextIcon')
    setEditColor('')
  }

  const handleStartEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsEditing(true)
    setIsAddingChild(false)
    setParentIdForChild(undefined)
    setEditName(category.name)
    setEditIcon(category.icon)
    setEditColor(category.color || '')
  }

  const handleSave = () => {
    if (!editName.trim()) return

    if (selectedCategory) {
      onUpdateCategory(selectedCategory.id, editName.trim(), editIcon, editColor)
    } else {
      onAddCategory(editName.trim(), editIcon, editColor, parentIdForChild)
    }
    
    setIsEditing(false)
    setSelectedCategory(null)
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id)
      setCategoryToDelete(null)
      setDeleteConfirmOpen(false)
      if (selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(null)
        setIsEditing(false)
      }
    }
  }

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  )

  const SelectedIcon = categoryIconMap[editIcon] || FolderCategoryIcon

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-3rem)] overflow-hidden sm:max-w-[1100px] xl:max-w-[1240px]">
          <DialogHeader>
            <DialogTitle>分类管理</DialogTitle>
            <DialogDescription>
              添加、编辑或删除分类，拖拽调整顺序
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)] xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)]">
            {/* Category list */}
            <div className="min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">分类列表</h4>
                <Button size="sm" variant="outline" onClick={handleStartAdd}>
                  <Plus className="mr-1 size-3" />
                  新建
                </Button>
              </div>

              <ScrollArea className="h-[400px] rounded-md border p-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedCategories.filter(c => c.id !== 'all').map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {sortedCategories.map(category => (
                        <div key={category.id}>
                          <SortableCategoryItem
                            category={category}
                            isSelected={selectedCategory?.id === category.id}
                            draggable={category.id !== 'all' && !category.children?.length}
                            onSelect={() => setSelectedCategory(category)}
                            onEdit={() => handleStartEdit(category)}
                            onDelete={() => handleDeleteClick(category)}
                            onAddChild={() => handleStartAddChild(category.id)}
                            bookmarkCount={getCategoryBookmarkCount(category.id)}
                          />
                          {category.children?.map(child => (
                            <SortableCategoryItem
                              key={child.id}
                              category={child}
                              depth={1}
                              isSelected={selectedCategory?.id === child.id}
                              draggable={false}
                              onSelect={() => setSelectedCategory(child)}
                              onEdit={() => handleStartEdit(child)}
                              onDelete={() => handleDeleteClick(child)}
                              onAddChild={() => {}}
                              bookmarkCount={getCategoryBookmarkCount(child.id)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>

              <p className="text-xs text-muted-foreground">
                拖拽可调整顺序
              </p>
            </div>

            {/* Edit form */}
            <div className="min-w-0 space-y-4 rounded-lg border bg-muted/30 p-4">
              {isEditing ? (
                <>
                  <h4 className="text-sm font-medium">
                    {selectedCategory 
                      ? '编辑分类' 
                      : isAddingChild 
                        ? '添加子分类' 
                        : '新建分类'
                    }
                  </h4>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="category-name">名称</Label>
                      <Input
                        id="category-name"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="分类名称"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>图标</Label>
                      <ScrollArea className="h-32 rounded border p-2">
                        <div className="grid grid-cols-8 gap-1">
                          {categoryIcons.map(icon => {
                            const IconComponent = categoryIconMap[icon.value] || FolderCategoryIcon
                            return (
                              <button
                                key={icon.value}
                                onClick={() => setEditIcon(icon.value)}
                                className={cn(
                                  'flex size-7 items-center justify-center rounded border transition-colors',
                                  editIcon === icon.value
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
                    </div>

                    <div className="space-y-1.5">
                      <Label>颜色</Label>
                      <ScrollArea className="h-24 rounded border p-2">
                        <div className="grid grid-cols-10 gap-1.5">
                          {categoryColors.map(color => (
                            <button
                              key={color.value || 'default'}
                              onClick={() => setEditColor(color.value)}
                              className={cn(
                                'flex size-6 items-center justify-center rounded-full border-2 transition-all',
                                editColor === color.value
                                  ? 'border-foreground scale-110'
                                  : 'border-transparent hover:scale-105'
                              )}
                              style={{ 
                                backgroundColor: color.value || 'var(--muted)' 
                              }}
                              title={color.name}
                            >
                              {editColor === color.value && (
                                <Check className="size-3 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="space-y-1.5">
                      <Label>预览</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-background p-2">
                        <div
                          className="flex size-8 items-center justify-center rounded"
                          style={{ 
                            backgroundColor: editColor ? `${editColor}20` : 'var(--muted)' 
                          }}
                        >
                          <SelectedIcon 
                            className="size-4" 
                            style={{ color: editColor || 'currentColor' }}
                          />
                        </div>
                        <span className="text-sm">
                          {editName || '分类名称'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSave}
                      disabled={!editName.trim()}
                      className="flex-1"
                    >
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setSelectedCategory(null)
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <FolderCategoryIcon className="mb-2 size-8" />
                  <p className="text-sm">选择分类进行编辑</p>
                  <p className="text-xs">或点击"新建"创建分类</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除分类"{categoryToDelete?.name}"吗？
              {categoryToDelete?.children && categoryToDelete.children.length > 0 && (
                <span className="mt-1 block text-destructive">
                  该分类包含 {categoryToDelete.children.length} 个子分类，将一并删除。
                </span>
              )}
              <span className="mt-1 block">
                分类下的书签将被移至"全部书签"。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
