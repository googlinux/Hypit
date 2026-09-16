# Hypit Studio 个人生产模式

此模式面向**一个可信使用者、一个工作区、一个服务进程**。提供静态前端、独立 Node HTTP 服务、密码登录、会话保护与实时更新。开发模式仍使用 `hypit studio`；生产模式明确使用 `--production`，不依赖 Vite 开发服务器、热更新或任意源码文件服务。

不提供注册、多用户隔离或公共素材上传。SVML、项目包及其预览代码属于可信项目内容；不要把此服务开放给不受信任的作者。生产模式不自动安装 FFmpeg、浏览器、模型服务，也不会自动产生生成费用。

## 1. 准备与构建

使用仓库 `.node-version` 中的 Node.js 版本。在依赖已经安装的仓库根目录运行：

```bash
npm run check
npm run studio:build
```

构建产物在 `packages/studio/dist/`，不提交 Git，但包含在 npm 发布包中。`npm run pack:distribution` 和普通 `npm pack` 会构建前端。已经包含构建产物的安装包不需要再次构建。

## 2. 设置访问密码

选择由运行服务的账户拥有、仅该账户可访问的配置目录。以下是在 macOS/Linux 上的例子：

```bash
mkdir -p "$HOME/.config/hypit"
chmod 700 "$HOME/.config/hypit"
node bin/hypit.mjs studio --create-password "$HOME/.config/hypit/studio-password"
```

在终端输入两次至少 16 个字符的密码，输入不会回显。文件只保存带随机盐的 scrypt 哈希，创建权限为 `0600`，不会覆盖已有文件。密码不要放进命令行、Git、反向代理配置或浏览器存储。Windows 请使用当前账户的私人目录，并限制文件 ACL。

修改密码：先停止服务，移走旧哈希文件，重新执行创建命令，再启动服务。重启会使所有旧登录会话失效。密码文件可通过 `--password-file` 或环境变量 `HYPIT_STUDIO_PASSWORD_FILE` 指定；后者保存的是**路径**。

## 3. 先在本机运行

```bash
node bin/hypit.mjs studio --production \
  --password-file "$HOME/.config/hypit/studio-password" \
  --port 5179
```

打开 `http://127.0.0.1:5179/`，输入密码后进入引导与内置示例。生产模式的默认示例固定保存在 `.hypit/studio-examples/personal/`，重启不会覆盖你的修改。开发模式仍然每次新建练习副本。

打开自己的项目可增加：

```bash
--workspace /absolute/path/to/project \
--run /absolute/path/to/project/preview.svrun \
--runtime /absolute/path/to/project/hypit.runtime.json
```

三个路径由服务启动者确定，网页不能切换到任意服务器目录。一个工作区只运行一个生产实例；不要同时从多个进程编辑同一份源文件。已启动其他 Studio 时，请换一个端口。

会话最长 12 小时，重启失效。最多保留 8 个登录会话，每个会话最多 8 条实时连接；新会话超出上限时会移除最早会话。在「设置 → 通用」中退出登录，会立即撤销该会话与实时连接。退出前等待编辑保存完成。

## 4. 通过自己的 HTTPS 域名访问

本机服务始终只监听 `127.0.0.1`。公网域名必须使用 HTTPS，由**同一台主机上**的反向代理终止 TLS；不要直接转发裸端口到公网。

```bash
node bin/hypit.mjs studio --production \
  --password-file /home/hypit/.config/hypit/studio-password \
  --workspace /srv/hypit/project \
  --origin https://studio.example.com \
  --port 5179
```

将域名替换为你拥有的域名。`--origin` 必须是完整来源（协议、域名、必要时的端口），不包含路径或末尾 `/`。只支持域名根路径，不支持 `/studio/` 等子路径。

下面是 Nginx 配置示例，需要已有域名、Nginx 和 TLS 证书。本文不会自动安装或应用这些配置：

```nginx
server {
    listen 443 ssl;
    server_name studio.example.com;
    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:5179;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 60s;
    }
}
```

HTTP 入口应重定向到 HTTPS。Host 必须与 `--origin` 一致；保持浏览器原始 Origin，不要伪造为 localhost。服务不信任 `X-Forwarded-Host` 等头来放宽校验。生产域名使用 `Secure; HttpOnly; SameSite=Strict` 会话 Cookie。

`/__studio/events` 使用 SSE（服务器发送事件）实时更新，每 15 秒保活；代理不能缓冲此连接。`/healthz` 返回简单的 `ok`，不暴露工作区或密钥。因为 Host 校验，主机上的探测可用：

```bash
curl -fsS -H 'Host: studio.example.com' http://127.0.0.1:5179/healthz
```

## 5. Linux 运行与 API Key

系统凭据存储目前支持 macOS Keychain 与 Windows Credential Manager。Linux 使用现有的 `@hypit/credential-store-env` 配置，把 Provider 凭据映射到服务进程的环境变量。环境变量中的密钥在设置页面显示配置状态，**不支持从网页修改**；修改环境文件后重启服务。请按运行环境文档配置 Provider，不要直接把 macOS 的 `credential-store-os` 配置复制到 Linux。

环境文件权限设为 `0600`，只由服务账户读取，存放在仓库之外。页面不返回原始密钥，错误响应不包含凭据适配器的内部错误。访问密码与模型 API Key 是两类独立凭据。

可用 systemd 管理已准备好的 Linux 部署；以下路径必须按实际安装位置修改：

```ini
[Unit]
Description=Hypit Personal Studio
After=network.target

[Service]
Type=simple
User=hypit
Group=hypit
WorkingDirectory=/srv/hypit/project
Environment=NODE_ENV=production
# 如需 Provider 密钥，创建权限为 0600 的环境文件并启用下一行。
# EnvironmentFile=/home/hypit/.config/hypit/runtime.env
ExecStart=/usr/local/bin/node /opt/hypit/bin/hypit.mjs studio --production --workspace /srv/hypit/project --password-file /home/hypit/.config/hypit/studio-password --origin https://studio.example.com --port 5179
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

运行账户需能写入工作区与运行环境的数据目录。内置预览可直接运行；实际生成/MP4 导出依然需要选择合适的 Run、配置 Provider、FFmpeg/Chromium 等运行时依赖，按已有运行环境配置限制 worker 并发和内存。

## 6. 备份、更新与上线检查

- 备份自己的项目、`.hypit/` 下的练习与运行环境选择、`FEEDBACK.json`、运行环境实际的数据目录、数据库和作品。数据库宜停止写入后备份，或使用 SQLite 的一致性备份方式。密钥与密码哈希另行安全备份。
- 更新前停止 Studio，备份状态，构建新版本，再重启；不要在进程运行时替换前端构建目录。收到 SIGINT/SIGTERM 后服务关闭实时连接，等待请求结束并释放资源；超过 10 秒的连接会断开。
- 部署后确认：未登录无法读取 API、作品或前端资源；登录后能打开预览；修改源码自动保存并更新画面；刷新与重启后修改仍在；退出后 API 返回 401。
- 公网登录采用全局 15 分钟最多 10 次失败/进行中尝试的限制。成功登录会清空失败计数。个人站点可在反向代理另加来源 IP 限制，以减少外部尝试影响本人登录。
- 本地验证不代替你实际主机上的 HTTPS、代理、密钥存储、渲染导出及备份恢复验证。`/healthz` 只表示 HTTP 服务就绪，不表示远程 Provider 或渲染工具可用。

更多操作见 [快速入门](QUICKSTART.zh-CN.md) 和 [设置与 API Key](SETTINGS.zh-CN.md)。
