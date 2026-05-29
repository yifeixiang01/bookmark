'use client'

import { useState } from 'react'
import { Tag, tagColors } from '@/lib/bookmark-data'
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
import { Badge } from '@/components/ui/badge'
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Merge,
  Check,
  X,
} from 'lucide-react'

interface TagManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tag[]
  onAddTag: (name: string, color: string) => void
  onUpdateTag: (id: string, name: string, color: string) => void
  onDeleteTag: (id: string) => void
  onMergeTags: (sourceId: string, targetId: string) => void
  getTagUsageCount: (tagName: string) => number
}

export function TagManagerModal({
  open,
  onOpenChange,
  tags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onMergeTags,
  getTagUsageCount,
}: TagManagerModalProps) {
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(tagColors[0].value)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<Tag | null>(null)
  const [mergeMode, setMergeMode] = useState(false)
  const [mergeSourceTag, setMergeSourceTag] = useState<Tag | null>(null)

  const handleAddTag = () => {
    if (!newTagName.trim()) return
    onAddTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setNewTagColor(tagColors[0].value)
  }

  const handleStartEdit = (tag: Tag) => {
    setEditingTag(tag)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const handleSaveEdit = () => {
    if (!editingTag || !editName.trim()) return
    onUpdateTag(editingTag.id, editName.trim(), editColor)
    setEditingTag(null)
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    setEditName('')
    setEditColor('')
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmTag) {
      onDeleteTag(deleteConfirmTag.id)
      setDeleteConfirmTag(null)
    }
  }

  const handleMergeClick = (tag: Tag) => {
    if (!mergeMode) {
      setMergeMode(true)
      setMergeSourceTag(tag)
    } else if (mergeSourceTag && mergeSourceTag.id !== tag.id) {
      onMergeTags(mergeSourceTag.id, tag.id)
      setMergeMode(false)
      setMergeSourceTag(null)
    }
  }

  const cancelMerge = () => {
    setMergeMode(false)
    setMergeSourceTag(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>标签管理</DialogTitle>
            <DialogDescription>
              添加、编辑或删除标签，管理书签分类
            </DialogDescription>
          </DialogHeader>

          {/* Add new tag */}
          <div className="space-y-3 border-b border-border pb-4">
            <Label>添加新标签</Label>
            <div className="flex gap-2">
              <div className="flex flex-1 gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="输入标签名称"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-10 px-0"
                    >
                      <div
                        className="size-5 rounded-full"
                        style={{ backgroundColor: newTagColor }}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {tagColors.map((color) => (
                        <button
                          key={color.value}
                          className={cn(
                            'size-6 rounded-full transition-transform hover:scale-110',
                            newTagColor === color.value && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          )}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setNewTagColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button onClick={handleAddTag} size="icon">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Merge mode hint */}
          {mergeMode && (
            <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2 text-sm">
              <span>
                选择要合并到的目标标签（{mergeSourceTag?.name} 将被合并）
              </span>
              <Button variant="ghost" size="sm" onClick={cancelMerge}>
                取消
              </Button>
            </div>
          )}

          {/* Tag list */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {tags.map((tag) => {
                const usageCount = getTagUsageCount(tag.name)
                const isEditing = editingTag?.id === tag.id
                const isMergeSource = mergeSourceTag?.id === tag.id

                if (isEditing) {
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 rounded-md border border-primary bg-accent/50 p-2"
                    >
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="size-8">
                            <div
                              className="size-4 rounded-full"
                              style={{ backgroundColor: editColor }}
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="grid grid-cols-4 gap-1 p-2">
                            {tagColors.map((color) => (
                              <button
                                key={color.value}
                                className={cn(
                                  'size-6 rounded-full transition-transform hover:scale-110',
                                  editColor === color.value && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                                )}
                                style={{ backgroundColor: color.value }}
                                onClick={() => setEditColor(color.value)}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button size="icon" className="size-8" onClick={handleSaveEdit}>
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )
                }

                return (
                  <div
                    key={tag.id}
                    className={cn(
                      'group flex items-center justify-between rounded-md p-2 transition-colors',
                      'hover:bg-accent',
                      mergeMode && !isMergeSource && 'cursor-pointer',
                      isMergeSource && 'bg-primary/10'
                    )}
                    onClick={() => mergeMode && !isMergeSource && handleMergeClick(tag)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {usageCount} 个书签
                      </span>
                    </div>

                    {!mergeMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStartEdit(tag)}>
                            <Pencil className="mr-2 size-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMergeClick(tag)}>
                            <Merge className="mr-2 size-4" />
                            合并到其他标签
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirmTag(tag)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-between border-t border-border pt-4 text-sm text-muted-foreground">
            <span>共 {tags.length} 个标签</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteConfirmTag}
        onOpenChange={(open) => !open && setDeleteConfirmTag(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除标签 <Badge variant="secondary">{deleteConfirmTag?.name}</Badge> 吗？
              此标签将从所有书签中移除。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
