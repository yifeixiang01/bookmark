# Dokploy 部署指南

## 一页式 SOP

按这个顺序做，基本可以完成一个新项目的 Dokploy 部署。

### 1. 准备项目文件

确保仓库里至少有：

```text
docker-compose.prod.yml
frontend/Dockerfile
backend/Dockerfile
deploy/nginx/default.conf
```

### 2. 准备生产 Compose

核心原则：

- 前端、后端都只跑在 Docker 网络里
- 统一由 `nginx` 作为入口
- 不再把 `8080` 之类的宿主机端口作为长期公网入口

Next.js 前端要特别确认：

```yaml
environment:
  - HOSTNAME=0.0.0.0
```

### 3. 准备前端 API 地址

- 本地开发：`NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- 生产部署：`NEXT_PUBLIC_API_URL=/api`

不要混用。

### 4. 在 Dokploy 创建 Compose 服务

配置项：

```text
Repository: 你的 GitHub 仓库
Branch: main
Compose Path: ./docker-compose.prod.yml
Trigger Type: On Push
```

### 5. 绑定域名

在 Dokploy 的 Domain 里配置：

```text
Domain: 你的域名
Service: nginx
Port: 80
```

注意：

- 绑定 `nginx`
- 填 `80`
- 不要填 `8080`
- 不要直接绑 `frontend`

### 6. 配 DNS

添加 A 记录到服务器公网 IP：

```text
bookmark.example.com -> 服务器公网 IP
```

### 7. 开启 HTTPS

在 Dokploy 打开证书申请，确保：

- 80 端口放行
- 443 端口放行
- DNS 已生效

### 8. 推代码并观察部署

如果 Trigger Type 是 `On Push`：

```bash
git push
```

然后去 Dokploy 看：

- `Deployments` 是否出现新记录
- `Containers` 是否都为 running

### 9. 上线后检查

先检查页面：

```text
https://你的域名
```

再检查健康接口：

```text
https://你的域名/health
```

如果 `/health` 返回 JSON，说明前端入口、Nginx、后端链路都通了。

### 10. 出问题时优先判断

#### 页面 502

先查：

```bash
docker exec <nginx-container> wget -S -O- http://frontend:3000
docker exec <nginx-container> wget -S -O- http://backend:3001/health
```

#### 页面能开但 `/api/*` 404

优先检查 Dokploy Domain 是否错误绑定到了 `frontend`，正确值必须是：

```text
Service = nginx
Port = 80
```

#### 本地 dev 模式 `/api/categories` 404

说明开发环境把 API 地址写成了 `/api`，应该改回完整地址：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

这份文档整理了当前项目在 Dokploy 中的推荐部署方式，也可以直接复用到新的前后端分离项目。

适用场景：

- 代码托管在 GitHub
- 使用 Dockerfile 或 Docker Compose 构建
- 希望 `git push` 后由 Dokploy 自动部署
- 前端和后端通过 Nginx 统一暴露到一个域名

---

## 1. 推荐架构

推荐使用三层结构：

1. `frontend`
   Next.js 前端容器
2. `backend`
   Express / API 容器
3. `nginx`
   统一入口，负责：
   - `/` 转发到前端
   - `/api/*` 转发到后端
   - `/health` 转发到后端健康检查

公网访问不要直接暴露 `frontend:3000` 或 `backend:3001`，而是由 Dokploy 的 Traefik 代理到 `nginx:80`。

---

## 2. 项目文件建议

项目根目录建议包含：

```text
.
├─ docker-compose.prod.yml
├─ frontend/
│  └─ Dockerfile
├─ backend/
│  └─ Dockerfile
└─ deploy/
   └─ nginx/
      └─ default.conf
```

---

## 3. 推荐的生产 Compose

当前项目的推荐生产编排如下：

```yaml
services:
  nginx:
    image: nginx:1.27-alpine
    depends_on:
      - frontend
      - backend
    volumes:
      - ./deploy/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: /api
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    restart: unless-stopped

  backend:
    build:
      context: ./backend
    volumes:
      - bookmark-data:/data
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATA_DIR=/data
    restart: unless-stopped

volumes:
  bookmark-data:
```

关键点：

- `frontend` 必须显式设置 `HOSTNAME=0.0.0.0`
  否则 Next.js 可能只监听容器内 `127.0.0.1`，导致 `nginx -> frontend` 返回 502
- 生产环境前端 API 地址要使用 `/api`
- 不要在 Compose 里继续暴露 `8080:80` 之类的宿主机端口
  让 Dokploy / Traefik 接管公网入口

---

## 4. Nginx 反向代理示例

`deploy/nginx/default.conf` 推荐如下：

```nginx
server {
  listen 80;
  server_name _;

  client_max_body_size 10m;

  location /api/ {
    proxy_pass http://backend:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /health {
    proxy_pass http://backend:3001/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }

  location / {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 5. 前端环境变量规则

### 开发环境

本地开发时，前端不能使用相对路径 `/api`，否则请求会先打到 Next 开发服务器，出现 `404`。

`frontend/.env.local`：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

如果后端不在本机，把地址换成实际可访问地址即可。

### 生产环境

生产部署时，前端应使用：

```env
NEXT_PUBLIC_API_URL=/api
```

这样所有 API 请求都走同源，再由 Nginx 代理到后端。

---

## 6. Dokploy 配置步骤

### 6.1 创建 Compose 服务

在 Dokploy 中：

1. 创建 Project
2. 新建 Compose 服务
3. 选择 GitHub 仓库
4. 选择分支，例如 `main`
5. `Compose Path` 填：

```text
./docker-compose.prod.yml
```

6. `Trigger Type` 推荐使用：

```text
On Push
```

这样后续 `git push` 后会自动部署。

### 6.2 绑定域名

在 Dokploy 的 Domain 配置中：

- `Domain`：你的域名，例如 `bookmark.example.com`
- `Service`：`nginx`
- `Port`：`80`

注意：

- 这里必须绑定到 `nginx`
- 这里填写的是容器内部端口 `80`
- 不能填 `8080`
- 不能直接绑定到 `frontend:3000`

### 6.3 HTTPS

开启 Dokploy / Traefik 的 HTTPS 证书签发。

前提：

- 域名 DNS 已正确解析到服务器
- 服务器安全组和防火墙放行 `80` / `443`

---

## 7. 域名解析

在 DNS 服务商处添加 A 记录：

```text
类型: A
主机记录: bookmark
记录值: 你的服务器公网 IP
```

例如：

```text
bookmark.yifeixiang.com.cn -> 81.70.95.23
```

如果使用根域名，就把主机记录设为 `@`。

---

## 8. 自动部署与手动部署

是否需要手动点 Deploy，取决于 Dokploy 的触发方式。

### 如果 Trigger Type 是 `On Push`

执行：

```bash
git push
```

Dokploy 会自动开始新部署。

### 如果不是 `On Push`

那就需要：

1. 先 `git push`
2. 再到 Dokploy 页面手动点击 `Deploy`

判断方法：

- push 之后，Dokploy 的 `Deployments` 里是否自动出现新的部署记录

---

## 9. 常见问题排查

### 9.1 页面 502

先看容器状态：

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

如果容器都在运行，再检查：

```bash
docker exec <nginx-container> wget -S -O- http://frontend:3000
docker exec <nginx-container> wget -S -O- http://backend:3001/health
```

判断：

- 如果 `frontend:3000` 不通，常见原因是前端没监听 `0.0.0.0`
- 如果 `backend:3001/health` 不通，说明后端容器本身异常

### 9.2 域名能打开页面，但 `/api/*` 返回 404

这通常说明域名绑定错了，流量打到了 `frontend`，没有经过 `nginx`。

正确配置应为：

- `Service = nginx`
- `Port = 80`

快速验证：

访问：

```text
http://你的域名/health
```

正确结果应为 JSON。

如果访问的是前端页面或 404，说明域名没走 Nginx。

### 9.3 本地 dev 模式下 `/api/categories` 返回 404

这是开发环境配置问题，不是接口本身不存在。

原因：

- `NEXT_PUBLIC_API_URL` 被设成了 `/api`
- Next 开发服务器没有内置该 API route

修复：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 9.4 页面只能通过 `:8080` 访问

这是因为你仍在走宿主机端口映射。

如果想直接用：

```text
http://bookmark.example.com
```

就要：

1. 使用 Dokploy Domain
2. 绑定 `nginx:80`
3. 不再依赖 `8080:80` 这种宿主机映射

### 9.5 `pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS`

这是 `pnpm` 的构建脚本审批机制导致的，常见于 `sharp`。

可选方案：

```bash
pnpm approve-builds
pnpm install
```

或者直接统一改用 `npm`，因为本项目 Dockerfile 默认也是 `npm ci`。

---

## 10. 新项目复用清单

下次部署新项目时，可以直接照这个清单核对：

1. 准备 `docker-compose.prod.yml`
2. 准备前端 Dockerfile、后端 Dockerfile
3. 准备 `deploy/nginx/default.conf`
4. 前端生产环境 API 走 `/api`
5. Next 容器监听 `0.0.0.0`
6. Dokploy `Compose Path` 指向生产 compose
7. 域名绑定到 `nginx:80`
8. 开启 HTTPS
9. push 后检查 `Deployments`
10. 访问 `/health` 验证链路

---

## 11. 当前项目的关键经验

这次项目里实际踩到的关键点有两个：

1. `frontend` 缺少 `HOSTNAME=0.0.0.0`
   导致 `nginx -> frontend` 返回 502
2. 开发模式下前端如果使用 `/api`
   会因为没有 Next API route 而出现 `/api/categories` 404

把这两个点记住，后面同类项目能少掉大部分排障时间。
