# 书签管理器 (Bookmark Manager)

一个支持数千书签的高效管理工具，包含美观的 Web 前端和轻量级 REST API 后端。

## 项目结构

```
.
├── frontend/          # Next.js 前端
├── backend/           # Express + SQLite 后端
├── docker-compose.yml # Docker Compose 配置
└── README.md
```

## 快速开始

### 1. 启动后端

```bash
cd backend
npm install
npm run seed    # 初始化数据库并填充示例数据（仅首次）
npm run dev     # 开发模式，监听 3001 端口
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev     # 开发模式，监听 3000 端口
```

前端默认通过 `NEXT_PUBLIC_API_URL=http://localhost:3001/api` 连接后端。如需修改，编辑 `frontend/.env.local`。

## 生产部署

### Docker Compose（推荐）

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f backend

# 停止
docker-compose down
```

后端服务将运行在 `3001` 端口，数据持久化在 `./data` 目录。

### 手动部署

#### 后端

```bash
cd backend
npm install
npm run build
npm run seed
NODE_ENV=production PORT=3001 npm start
```

#### 前端

```bash
cd frontend
npm install
npm run build
# 将 dist 目录部署到任意静态托管服务
# 并确保 API 地址指向你的后端
```

## API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/bookmarks` | 获取书签列表（支持 `q`, `category`, `tags`, `sort` 查询参数） |
| POST | `/api/bookmarks` | 创建书签 |
| PATCH | `/api/bookmarks/:id` | 更新书签 |
| DELETE | `/api/bookmarks/:id` | 删除书签 |
| POST | `/api/bookmarks/batch-delete` | 批量删除书签 |
| POST | `/api/bookmarks/batch-move` | 批量移动书签到分类 |
| GET | `/api/categories` | 获取分类列表 |
| POST | `/api/categories` | 创建分类 |
| PUT | `/api/categories/:id` | 更新分类 |
| DELETE | `/api/categories/:id` | 删除分类 |
| PUT | `/api/categories/reorder` | 重新排序分类 |
| GET | `/api/tags` | 获取标签列表 |
| POST | `/api/tags` | 创建标签 |
| PUT | `/api/tags/:id` | 更新标签 |
| DELETE | `/api/tags/:id` | 删除标签 |
| POST | `/api/tags/merge` | 合并标签 |

## 环境变量

### 后端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 服务端口 |
| `DATA_DIR` | `./data` | 数据库文件存放目录 |
| `NODE_ENV` | `development` | 运行环境 |

### 前端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | 后端 API 地址 |

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Dnd Kit
- **后端**: Express, TypeScript, better-sqlite3, Zod
- **部署**: Docker, Docker Compose
