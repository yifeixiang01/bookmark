export interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  category: string
  tags: string[]
  visits: number
  createdAt: Date
  favicon?: string
  sortOrder?: number
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color?: string
  count: number
  order: number
  children?: Category[]
}

export const categoryIcons = [
  // 基础
  { name: '书签', value: 'BookmarkIcon' },
  { name: '文件夹', value: 'FolderIcon' },
  { name: '星标', value: 'StarIcon' },
  { name: '心形', value: 'HeartIcon' },
  { name: '收藏夹', value: 'ArchiveIcon' },
  { name: '标签', value: 'TagIcon' },
  { name: '包裹', value: 'PackageIcon' },
  { name: '盒子', value: 'BoxIcon' },
  { name: '组件盒', value: 'BoxesIcon' },
  // 开发
  { name: '代码', value: 'CodeIcon' },
  { name: 'XML代码', value: 'CodeXmlIcon' },
  { name: '括号', value: 'BracesIcon' },
  { name: '代码文件', value: 'FileCodeIcon' },
  { name: '终端', value: 'TerminalIcon' },
  { name: '数据库', value: 'DatabaseIcon' },
  { name: '服务器', value: 'ServerIcon' },
  { name: 'GitHub', value: 'GithubIcon' },
  { name: 'Git分支', value: 'GitBranchIcon' },
  { name: 'API', value: 'WebhookIcon' },
  { name: 'Bug', value: 'BugIcon' },
  { name: '芯片', value: 'CpuIcon' },
  { name: '网络', value: 'NetworkIcon' },
  { name: '模块', value: 'BlocksIcon' },
  // AI
  { name: '机器人', value: 'BotIcon' },
  { name: '大脑', value: 'BrainIcon' },
  { name: '灵感', value: 'SparklesIcon' },
  // 设计
  { name: '调色板', value: 'PaletteIcon' },
  { name: '布局', value: 'LayoutIcon' },
  { name: '画笔', value: 'PaintbrushIcon' },
  { name: '刷子', value: 'BrushIcon' },
  { name: '钢笔工具', value: 'PenToolIcon' },
  { name: '形状', value: 'ShapesIcon' },
  { name: '图层', value: 'LayersIcon' },
  { name: '图片', value: 'ImageIcon' },
  { name: '框架', value: 'FrameIcon' },
  { name: '表情', value: 'SmileIcon' },
  // 效率
  { name: '闪电', value: 'ZapIcon' },
  { name: '目标', value: 'TargetIcon' },
  { name: '日历', value: 'CalendarIcon' },
  { name: '日期', value: 'CalendarDaysIcon' },
  { name: '时钟', value: 'ClockIcon' },
  { name: '计时器', value: 'TimerIcon' },
  { name: '闹钟', value: 'AlarmClockIcon' },
  { name: '清单', value: 'ListChecksIcon' },
  { name: '任务板', value: 'ClipboardListIcon' },
  { name: '完成', value: 'CheckCircleIcon' },
  { name: '看板', value: 'KanbanIcon' },
  { name: '工具', value: 'WrenchIcon' },
  { name: '设置', value: 'SettingsIcon' },
  // 内容
  { name: '书籍', value: 'BookOpenIcon' },
  { name: '已标记书', value: 'BookMarkedIcon' },
  { name: '文本书', value: 'BookTextIcon' },
  { name: '图书馆', value: 'LibraryIcon' },
  { name: '学习', value: 'GraduationCapIcon' },
  { name: '长文', value: 'ScrollTextIcon' },
  { name: '文档', value: 'FileTextIcon' },
  { name: '文件组', value: 'FilesIcon' },
  { name: '归档文件', value: 'FileArchiveIcon' },
  { name: '笔记', value: 'StickyNoteIcon' },
  { name: '笔记本', value: 'NotebookIcon' },
  { name: '书写', value: 'PenLineIcon' },
  { name: '报纸', value: 'NewspaperIcon' },
  { name: '视频', value: 'VideoIcon' },
  { name: '电影', value: 'FilmIcon' },
  { name: '音乐', value: 'MusicIcon' },
  { name: '播客', value: 'PodcastIcon' },
  { name: '耳机', value: 'HeadphonesIcon' },
  { name: '麦克风', value: 'MicIcon' },
  { name: '广播', value: 'RadioIcon' },
  { name: '相机', value: 'CameraIcon' },
  // 社交
  { name: '用户', value: 'UsersIcon' },
  { name: '消息', value: 'MessageCircleIcon' },
  { name: '邮件', value: 'MailIcon' },
  { name: '分享', value: 'ShareIcon' },
  { name: '链接', value: 'LinkIcon' },
  // 商业
  { name: '购物', value: 'ShoppingBagIcon' },
  { name: '购物车', value: 'ShoppingCartIcon' },
  { name: '信用卡', value: 'CreditCardIcon' },
  { name: '钱包', value: 'WalletIcon' },
  { name: '收据', value: 'ReceiptIcon' },
  { name: '金额', value: 'BadgeDollarSignIcon' },
  { name: '图表', value: 'BarChartIcon' },
  { name: '综合图表', value: 'ChartIcon' },
  { name: '趋势', value: 'TrendingUpIcon' },
  { name: '公文包', value: 'BriefcaseIcon' },
  { name: '公司', value: 'BuildingIcon' },
  { name: '机构', value: 'LandmarkIcon' },
  { name: '演示', value: 'PresentationIcon' },
  // 安全与云
  { name: '锁', value: 'LockIcon' },
  { name: '盾牌', value: 'ShieldIcon' },
  { name: '安全', value: 'ShieldCheckIcon' },
  { name: '钥匙', value: 'KeyIcon' },
  { name: '指纹', value: 'FingerprintIcon' },
  { name: '云', value: 'CloudIcon' },
  { name: '硬盘', value: 'HardDriveIcon' },
  { name: '无线网', value: 'WifiIcon' },
  { name: '下载', value: 'DownloadIcon' },
  { name: '上传云', value: 'UploadCloudIcon' },
  // 生活与其他
  { name: '地球', value: 'GlobeIcon' },
  { name: '地图', value: 'MapIcon' },
  { name: '定位', value: 'MapPinIcon' },
  { name: '导航', value: 'CompassIcon' },
  { name: '火箭', value: 'RocketIcon' },
  { name: '灯泡', value: 'LightbulbIcon' },
  { name: '奖杯', value: 'TrophyIcon' },
  { name: '游戏', value: 'GamepadIcon' },
  { name: '健康', value: 'ActivityIcon' },
  { name: '健身', value: 'DumbbellIcon' },
  { name: '医疗', value: 'StethoscopeIcon' },
  { name: '自然', value: 'LeafIcon' },
  { name: '礼物', value: 'GiftIcon' },
  { name: '咖啡', value: 'CoffeeIcon' },
  { name: '餐饮', value: 'UtensilsIcon' },
  { name: '飞机', value: 'PlaneIcon' },
  { name: '汽车', value: 'CarIcon' },
  { name: '火车', value: 'TrainIcon' },
  { name: '轮船', value: 'ShipIcon' },
  { name: '家', value: 'HomeIcon' },
]

export const categoryColors = [
  { name: '默认', value: '' },
  // 灰色系
  { name: '石板灰', value: '#64748b' },
  { name: '锌灰', value: '#71717a' },
  { name: '中性灰', value: '#737373' },
  { name: '深灰', value: '#525252' },
  // 红色系
  { name: '红色', value: '#ef4444' },
  { name: '玫瑰红', value: '#f43f5e' },
  { name: '深红', value: '#dc2626' },
  { name: '珊瑚红', value: '#fb7185' },
  // 橙色系
  { name: '橙色', value: '#f97316' },
  { name: '琥珀色', value: '#f59e0b' },
  { name: '杏色', value: '#fb923c' },
  // 黄色系
  { name: '黄色', value: '#eab308' },
  { name: '柠檬黄', value: '#facc15' },
  { name: '金色', value: '#ca8a04' },
  // 绿色系
  { name: '绿色', value: '#22c55e' },
  { name: '翠绿', value: '#10b981' },
  { name: '森林绿', value: '#16a34a' },
  { name: '薄荷绿', value: '#34d399' },
  { name: '酸橙绿', value: '#84cc16' },
  // 青色系
  { name: '青色', value: '#14b8a6' },
  { name: '蓝绿', value: '#06b6d4' },
  { name: '天蓝', value: '#0ea5e9' },
  // 蓝色系
  { name: '蓝色', value: '#3b82f6' },
  { name: '皇家蓝', value: '#2563eb' },
  { name: '海军蓝', value: '#1d4ed8' },
  { name: '天空蓝', value: '#38bdf8' },
  // 紫色系
  { name: '靛蓝', value: '#6366f1' },
  { name: '紫色', value: '#a855f7' },
  { name: '紫罗兰', value: '#8b5cf6' },
  { name: '深紫', value: '#7c3aed' },
  // 粉色系
  { name: '粉色', value: '#ec4899' },
  { name: '玫红', value: '#db2777' },
  { name: '浅粉', value: '#f472b6' },
  { name: '樱花粉', value: '#f9a8d4' },
]

export const initialCategories: Category[] = [
  {
    id: 'all',
    name: '全部书签',
    icon: 'BookmarkIcon',
    count: 0,
    order: 0,
  },
  {
    id: 'dev',
    name: '开发工具',
    icon: 'CodeIcon',
    color: '#3b82f6',
    count: 0,
    order: 1,
    children: [
      { id: 'dev-docs', name: '文档', icon: 'FileTextIcon', count: 0, order: 0 },
      { id: 'dev-tools', name: '工具', icon: 'WrenchIcon', count: 0, order: 1 },
      { id: 'dev-github', name: 'GitHub', icon: 'GithubIcon', count: 0, order: 2 },
    ],
  },
  {
    id: 'design',
    name: '设计资源',
    icon: 'PaletteIcon',
    color: '#a855f7',
    count: 0,
    order: 2,
    children: [
      { id: 'design-ui', name: 'UI 组件', icon: 'LayoutIcon', count: 0, order: 0 },
      { id: 'design-icons', name: '图标', icon: 'SmileIcon', count: 0, order: 1 },
    ],
  },
  {
    id: 'productivity',
    name: '效率工具',
    icon: 'ZapIcon',
    color: '#22c55e',
    count: 0,
    order: 3,
  },
  {
    id: 'reading',
    name: '阅读收藏',
    icon: 'BookOpenIcon',
    color: '#f97316',
    count: 0,
    order: 4,
  },
  {
    id: 'social',
    name: '社交媒体',
    icon: 'UsersIcon',
    color: '#ec4899',
    count: 0,
    order: 5,
  },
]

// Keep backward compatibility
export const categories = initialCategories

export const tagColors = [
  { name: '灰色', value: '#6b7280' },
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '琥珀色', value: '#f59e0b' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '青色', value: '#14b8a6' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '靛蓝色', value: '#6366f1' },
  { name: '紫色', value: '#a855f7' },
  { name: '粉色', value: '#ec4899' },
]

export const initialTags: Tag[] = [
  { id: 'tag-1', name: 'productivity', color: '#22c55e' },
  { id: 'tag-2', name: 'coding', color: '#3b82f6' },
  { id: 'tag-3', name: 'design', color: '#a855f7' },
  { id: 'tag-4', name: 'frontend', color: '#14b8a6' },
  { id: 'tag-5', name: 'backend', color: '#f97316' },
  { id: 'tag-6', name: 'ai', color: '#ec4899' },
  { id: 'tag-7', name: 'tools', color: '#6b7280' },
  { id: 'tag-8', name: 'docs', color: '#eab308' },
  { id: 'tag-9', name: 'tutorial', color: '#6366f1' },
  { id: 'tag-10', name: 'inspiration', color: '#ef4444' },
  { id: 'tag-11', name: 'news', color: '#f59e0b' },
  { id: 'tag-12', name: 'learning', color: '#3b82f6' },
]

export const tags = initialTags.map(t => t.name)

// Generate mock bookmarks with deterministic values
function generateMockBookmarks(count: number): Bookmark[] {
  const sites = [
    { title: 'GitHub', url: 'github.com', category: 'dev-github', tags: ['coding', 'tools'] },
    { title: 'Next.js 文档', url: 'nextjs.org', category: 'dev-docs', tags: ['frontend', 'docs'] },
    { title: 'Tailwind CSS', url: 'tailwindcss.com', category: 'dev-docs', tags: ['frontend', 'design'] },
    { title: 'React', url: 'react.dev', category: 'dev-docs', tags: ['frontend', 'docs'] },
    { title: 'TypeScript', url: 'typescriptlang.org', category: 'dev-docs', tags: ['coding', 'docs'] },
    { title: 'Vercel', url: 'vercel.com', category: 'dev-tools', tags: ['tools', 'frontend'] },
    { title: 'Figma', url: 'figma.com', category: 'design-ui', tags: ['design', 'tools'] },
    { title: 'Dribbble', url: 'dribbble.com', category: 'design', tags: ['design', 'inspiration'] },
    { title: 'Notion', url: 'notion.so', category: 'productivity', tags: ['productivity', 'tools'] },
    { title: 'Linear', url: 'linear.app', category: 'productivity', tags: ['productivity', 'tools'] },
    { title: 'Raycast', url: 'raycast.com', category: 'productivity', tags: ['productivity', 'tools'] },
    { title: 'Medium', url: 'medium.com', category: 'reading', tags: ['reading', 'learning'] },
    { title: 'Dev.to', url: 'dev.to', category: 'reading', tags: ['coding', 'learning'] },
    { title: 'Twitter', url: 'twitter.com', category: 'social', tags: ['news'] },
    { title: 'Discord', url: 'discord.com', category: 'social', tags: ['tools'] },
    { title: 'Stack Overflow', url: 'stackoverflow.com', category: 'dev', tags: ['coding', 'learning'] },
    { title: 'MDN Web Docs', url: 'developer.mozilla.org', category: 'dev-docs', tags: ['docs', 'frontend'] },
    { title: 'npm', url: 'npmjs.com', category: 'dev-tools', tags: ['tools', 'coding'] },
    { title: 'Supabase', url: 'supabase.com', category: 'dev-tools', tags: ['backend', 'tools'] },
    { title: 'Prisma', url: 'prisma.io', category: 'dev-docs', tags: ['backend', 'docs'] },
    { title: 'Radix UI', url: 'radix-ui.com', category: 'design-ui', tags: ['frontend', 'design'] },
    { title: 'shadcn/ui', url: 'ui.shadcn.com', category: 'design-ui', tags: ['frontend', 'design'] },
    { title: 'Lucide Icons', url: 'lucide.dev', category: 'design-icons', tags: ['design', 'tools'] },
    { title: 'Heroicons', url: 'heroicons.com', category: 'design-icons', tags: ['design', 'tools'] },
    { title: 'OpenAI', url: 'openai.com', category: 'dev', tags: ['ai', 'tools'] },
    { title: 'Anthropic', url: 'anthropic.com', category: 'dev', tags: ['ai', 'docs'] },
    { title: 'Hugging Face', url: 'huggingface.co', category: 'dev', tags: ['ai', 'tools'] },
    { title: 'Hacker News', url: 'news.ycombinator.com', category: 'reading', tags: ['news', 'coding'] },
    { title: 'Product Hunt', url: 'producthunt.com', category: 'productivity', tags: ['tools', 'inspiration'] },
    { title: 'CodePen', url: 'codepen.io', category: 'dev-tools', tags: ['frontend', 'coding'] },
  ]

  // Simple seeded random function for deterministic values
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  const bookmarks: Bookmark[] = []
  const baseDate = new Date('2024-01-01').getTime()

  for (let i = 0; i < count; i++) {
    const site = sites[i % sites.length]
    const suffix = i >= sites.length ? ` ${Math.floor(i / sites.length) + 1}` : ''
    
    bookmarks.push({
      id: `bookmark-${i}`,
      title: site.title + suffix,
      url: `https://${site.url}`,
      description: `${site.title} - 高效开发必备工具和资源`,
      category: site.category,
      tags: site.tags,
      visits: Math.floor(seededRandom(i * 13) * 500) + 1,
      createdAt: new Date(baseDate + i * 24 * 60 * 60 * 1000),
    })
  }

  return bookmarks
}

export const mockBookmarks = generateMockBookmarks(500)
