# 自动部署到个人服务器

这套部署方式会在每次 push 到 `main` 分支时：

1. 在 GitHub Actions 中构建前端和后端 Docker 镜像。
2. 推送镜像到 GitHub Container Registry。
3. 通过 SSH 登录你的服务器。
4. 拉取最新镜像并用 Docker Compose 重启服务。

## 服务器准备

服务器需要安装 Docker 和 Docker Compose 插件：

```bash
docker --version
docker compose version
```

运行部署的 SSH 用户需要能执行 Docker 命令。常见做法是把该用户加入 `docker` 用户组，或者使用已经具备 Docker 权限的部署用户。

创建部署目录，例如：

```bash
mkdir -p /opt/bookmark
```

如果服务器有防火墙或云厂商安全组，需要放行 HTTP 端口，默认是 `80`。

## GitHub 配置

在仓库的 `Settings -> Secrets and variables -> Actions` 中添加 Secrets：

| 名称 | 说明 |
| --- | --- |
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USER` | SSH 用户名 |
| `SERVER_SSH_KEY` | 可登录服务器的 SSH 私钥 |
| `SERVER_PORT` | SSH 端口，可不填，默认 `22` |
| `SERVER_APP_DIR` | 服务器部署目录，例如 `/opt/bookmark` |
| `GHCR_TOKEN` | GitHub Personal Access Token，至少需要 `read:packages` 权限；如果仓库或 package 是私有的，通常还需要 `repo` 权限 |

如果你的 GHCR 镜像包设置为 Public，`GHCR_TOKEN` 仍可保留；如果是 Private，服务器必须用它登录后才能拉取镜像。

可选：在 `Variables` 中添加：

| 名称 | 说明 |
| --- | --- |
| `HTTP_PORT` | 对外 HTTP 端口，默认 `80` |

## 首次部署

确认 `.github/workflows/deploy.yml` 中的分支是你的实际默认分支：

```yaml
branches:
  - main
```

如果你的默认分支是 `master`，把这里改成 `master`。

提交并 push 后，GitHub Actions 会自动执行部署。部署完成后访问：

```text
http://你的服务器IP或域名/
```

后端健康检查地址：

```text
http://你的服务器IP或域名/health
```

## 数据持久化

生产环境使用 Docker volume `bookmark-data` 保存 SQLite 数据库，容器重建不会删除数据。

如需备份数据：

```bash
docker run --rm -v bookmark_bookmark-data:/data -v "$PWD":/backup alpine tar czf /backup/bookmark-data.tgz /data
```
