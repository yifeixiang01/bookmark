# Dokploy 部署说明

当前推荐使用 Dokploy 直接从 GitHub 拉代码，并在服务器本地构建 Docker 镜像，不再通过 GHCR 拉取前后端镜像。

## Dokploy 配置

在 Dokploy 的 Compose 服务里这样配置：

| 配置项 | 值 |
| --- | --- |
| Provider | GitHub |
| Repository | `bookmark` |
| Branch | `main` |
| Compose Path | `./docker-compose.prod.yml` |
| Trigger Type | `On Push` |

保存后点击 `Deploy`。

## 环境变量

如果你想继续通过服务器 IP + 端口访问，在 Dokploy 的 `Environment` 中可以配置：

```env
HTTP_PORT=8080
```

如果不配置，默认也是 `8080`。

访问地址：

```text
http://你的服务器IP:8080/
```

健康检查：

```text
http://你的服务器IP:8080/health
```

## 域名方式

如果你准备用 Dokploy/Traefik 的域名功能，可以在 Dokploy 的 `Domains` 里添加域名，并指向：

| 项 | 值 |
| --- | --- |
| Service | `nginx` |
| Port | `80` |

这种情况下可以考虑去掉 `docker-compose.prod.yml` 里的 `ports` 映射，让 Dokploy 的 Traefik 统一接管 `80/443`。

## 数据持久化

后端 SQLite 数据保存在 Docker volume：

```text
bookmark-data
```

容器重建不会删除这个 volume。需要备份时，在服务器执行：

```bash
docker volume ls
docker volume inspect bookmark_bookmark-data
```

## 旧 GitHub Actions 部署

如果已经切到 Dokploy，建议不要再启用 `.github/workflows/deploy.yml` 里的 SSH/GHCR 部署流程，避免两套系统同时操作同一组容器。
