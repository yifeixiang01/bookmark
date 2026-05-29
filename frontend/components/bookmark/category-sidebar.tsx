'use client'

import { Category } from '@/lib/bookmark-data'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  Code2,
  Palette,
  Zap,
  BookOpen,
  Users,
  FileText,
  Wrench,
  Github,
  Layout,
  Smile,
  Folder,
  Star,
  Heart,
  Globe,
  Music,
  Video,
  ShoppingBag,
  ChevronRight,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Settings2,
  // 新增图标
  Archive,
  Tag,
  Terminal,
  Database,
  Server,
  GitBranch,
  Webhook,
  Bug,
  Paintbrush,
  Layers,
  Image,
  Frame,
  Target,
  Calendar,
  Clock,
  ListChecks,
  Settings,
  StickyNote,
  Newspaper,
  Podcast,
  Camera,
  MessageCircle,
  Mail,
  Share2,
  Link,
  ShoppingCart,
  CreditCard,
  Wallet,
  BarChart3,
  TrendingUp,
  Briefcase,
  Map,
  Compass,
  Rocket,
  Lightbulb,
  Trophy,
  Gamepad2,
  Activity,
  Coffee,
  Plane,
  Home,
  Lock,
  Cloud,
  Download,
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

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  // 基础
  BookmarkIcon: Bookmark,
  FolderIcon: Folder,
  StarIcon: Star,
  HeartIcon: Heart,
  ArchiveIcon: Archive,
  TagIcon: Tag,
  // 开发
  CodeIcon: Code2,
  TerminalIcon: Terminal,
  DatabaseIcon: Database,
  ServerIcon: Server,
  GithubIcon: Github,
  GitBranchIcon: GitBranch,
  WebhookIcon: Webhook,
  BugIcon: Bug,
  // 设计
  PaletteIcon: Palette,
  LayoutIcon: Layout,
  PaintbrushIcon: Paintbrush,
  LayersIcon: Layers,
  ImageIcon: Image,
  FrameIcon: Frame,
  SmileIcon: Smile,
  // 效率
  ZapIcon: Zap,
  TargetIcon: Target,
  CalendarIcon: Calendar,
  ClockIcon: Clock,
  ListChecksIcon: ListChecks,
  WrenchIcon: Wrench,
  SettingsIcon: Settings,
  // 内容
  BookOpenIcon: BookOpen,
  FileTextIcon: FileText,
  StickyNoteIcon: StickyNote,
  NewspaperIcon: Newspaper,
  VideoIcon: Video,
  MusicIcon: Music,
  PodcastIcon: Podcast,
  CameraIcon: Camera,
  // 社交
  UsersIcon: Users,
  MessageCircleIcon: MessageCircle,
  MailIcon: Mail,
  ShareIcon: Share2,
  LinkIcon: Link,
  // 商业
  ShoppingBagIcon: ShoppingBag,
  ShoppingCartIcon: ShoppingCart,
  CreditCardIcon: CreditCard,
  WalletIcon: Wallet,
  BarChartIcon: BarChart3,
  TrendingUpIcon: TrendingUp,
  BriefcaseIcon: Briefcase,
  // 其他
  GlobeIcon: Globe,
  MapIcon: Map,
  CompassIcon: Compass,
  RocketIcon: Rocket,
  LightbulbIcon: Lightbulb,
  TrophyIcon: Trophy,
  GamepadIcon: Gamepad2,
  ActivityIcon: Activity,
  CoffeeIcon: Coffee,
  PlaneIcon: Plane,
  HomeIcon: Home,
  LockIcon: Lock,
  CloudIcon: Cloud,
  DownloadIcon: Download,
}

interface CategorySidebarProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
  expandedCategories: Set<string>
  onToggleCategory: (id: string) => void
  onAddBookmark: () => void
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
  const Icon = iconMap[category.icon] || Bookmark

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
