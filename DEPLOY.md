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
sudo mkdir -p /opt/bookmark
sudo chown -R "$USER:$USER" /opt/bookmark
```

如果你的 `SERVER_USER` 是 `ubuntu`，上面的命令会让 `ubuntu` 用户可以写入 `/opt/bookmark`。否则 GitHub Actions 同步部署文件时会因为权限不足失败。

如果服务器有防火墙或云厂商安全组，需要放行对外 HTTP 端口。当前默认端口是 `8080`。

## GitHub 配置

在仓库的 `Settings -> Secrets and variables -> Actions` 中添加 Secrets：

| 名称 | 说明 |
| --- | --- |
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USER` | SSH 用户名 |
| `SERVER_SSH_KEY` | 可登录服务器的 SSH 私钥；和 `SERVER_PASSWORD` 二选一 |
| `SERVER_SSH_PASSPHRASE` | SSH 私钥密码；如果私钥没有密码可以不填 |
| `SERVER_PASSWORD` | SSH 登录密码；和 `SERVER_SSH_KEY` 二选一 |
| `SERVER_PORT` | SSH 端口，可不填，默认 `22` |
| `SERVER_APP_DIR` | 服务器部署目录，例如 `/opt/bookmark` |
| `GHCR_TOKEN` | GitHub Personal Access Token，至少需要 `read:packages` 权限；如果仓库或 package 是私有的，通常还需要 `repo` 权限 |

如果你的 GHCR 镜像包设置为 Public，`GHCR_TOKEN` 仍可保留；如果是 Private，服务器必须用它登录后才能拉取镜像。

推荐使用 `SERVER_SSH_KEY` 私钥登录。如果你想先用密码登录，也可以只配置 `SERVER_PASSWORD`，不配置 `SERVER_SSH_KEY`。

使用私钥时，`SERVER_SSH_KEY` 要填私钥完整内容，不是 `.pub` 公钥。对应的公钥必须已经放在服务器该用户的 `~/.ssh/authorized_keys` 中。

可以先在本机验证这组 SSH 信息是否能登录：

```bash
ssh -i ~/.ssh/id_ed25519 用户名@服务器IP
```

如果你用的是 `root` 用户，`SERVER_USER` 就填 `root`；如果你用的是 `ubuntu`、`debian`、`admin` 等用户，就填对应用户名。GitHub Actions 里填的用户必须和服务器 `authorized_keys` 所在用户一致。

可选：在 `Variables` 中添加：

| 名称 | 说明 |
| --- | --- |
| `HTTP_PORT` | 对外 HTTP 端口，默认 `8080` |

如果不想占用服务器的 `80` 端口，可以保持默认 `8080`。部署完成后访问：

```text
http://你的服务器IP或域名:8080/
```

如果你以后使用统一的 Nginx/Caddy/Traefik 反向代理占用 `80` 和 `443`，可以让它把域名转发到这个服务的 `8080` 端口。

## 首次部署

确认 `.github/workflows/deploy.yml` 中的分支是你的实际默认分支：

```yaml
branches:
  - main
```

如果你的默认分支是 `master`，把这里改成 `master`。

提交并 push 后，GitHub Actions 会自动执行部署。部署完成后访问：

```text
http://你的服务器IP或域名:8080/
```

后端健康检查地址：

```text
http://你的服务器IP或域名:8080/health
```

如果你在 GitHub Actions Variables 中设置了其他 `HTTP_PORT`，访问地址也要对应换成那个端口。

首次部署需要从 GHCR 拉取前端、后端和 Nginx 镜像，耗时可能较长。Workflow 的部署命令超时时间已设置为 `20m`。

部署时 workflow 会在 `SERVER_APP_DIR` 下写入 `.env`，其中包含：

```bash
FRONTEND_IMAGE=ghcr.io/你的仓库/frontend:latest
BACKEND_IMAGE=ghcr.io/你的仓库/backend:latest
HTTP_PORT=8080
```

因此首次成功部署后，可以在服务器上手动执行：

```bash
cd /opt/bookmark
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

如果你要在首次自动部署前手动测试，需要先自己创建 `.env` 并填入上面这些变量。

## 数据持久化

生产环境使用 Docker volume `bookmark-data` 保存 SQLite 数据库，容器重建不会删除数据。

如需备份数据：

```bash
docker run --rm -v bookmark_bookmark-data:/data -v "$PWD":/backup alpine tar czf /backup/bookmark-data.tgz /data
```
