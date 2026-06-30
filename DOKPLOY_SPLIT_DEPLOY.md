# Dokploy 前后端分开部署

## 后端服务

在 Dokploy 新建一个 Compose 应用：

```text
Compose Path: ./docker-compose.backend.yml
Domain: api.your-domain.com
Service: backend
Port: 3001
```

建议环境变量：

```env
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=https://bookmark.your-domain.com
APP_VERSION=manual
```

后端验证地址：

```text
https://api.your-domain.com/health
https://api.your-domain.com/api/diagnostics/version
https://api.your-domain.com/api/diagnostics/db
```

SQLite 数据保存在 `bookmark-data` volume。不要删除该 volume，除非确认要清空数据。

## 前端服务

在 Dokploy 新建另一个 Compose 应用：

```text
Compose Path: ./docker-compose.frontend.yml
Domain: bookmark.your-domain.com
Service: frontend
Port: 3000
```

前端构建环境变量：

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

注意：`NEXT_PUBLIC_API_URL` 是构建期变量，修改后必须重新构建前端镜像。

## 当前域名示例

如果继续使用现有域名，可以按下面方式拆：

```env
前端域名: https://bookmark.yifeixiang.com.cn
后端域名: https://bookmark-api.yifeixiang.com.cn
NEXT_PUBLIC_API_URL=https://bookmark-api.yifeixiang.com.cn/api
CORS_ORIGIN=https://bookmark.yifeixiang.com.cn
```

DNS 需要新增：

```text
bookmark-api.yifeixiang.com.cn -> 服务器 IP
bookmark.yifeixiang.com.cn -> 服务器 IP
```

## 排查顺序

1. 先部署后端。
2. 打开后端 `/health` 和 `/api/diagnostics/db`。
3. 确认后端正常后，再部署前端。
4. 前端 Network 面板里 API 应该请求 `https://api-domain/api/...`，不再请求前端同源 `/api/...`。
