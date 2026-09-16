# Hypit 外联与后门专项检查

日期：2026-09-16。检查提交：`18c0e6a222b28086d95829e4f822d0c17e2a60a7`。

## 结论

在本次审阅的一方源码中，**未发现可确认的后门、SSH/反向 Shell、隐蔽遥测、批量扫描用户目录并外传，或开机持久化入口**。存在正常业务外联，以及一项与个人本地视频制作无关的上游 CI 文档同步。

这是离线静态检查：对当前提交的 1607 个普通受跟踪文件进行了网络/执行关键词及地址检索，并完整审阅去重后的 47 个关键文件。搜索命中不等于逐行审计。没有运行应用、连接列出的地址、抓取实际流量或查询账户秘密；第三方依赖内部不在“未发现”的保证范围内。

## 连接清单

| 目标 | 触发条件与数据 | 判断 |
| --- | --- | --- |
| `https://hypit.ai`，API 前缀 `/v1` | 选择 HypiHub 后，登录/刷新、主动诊断、价格/模型查询、生成或转录时使用。API 请求携带选定凭据；生成提交所选提示词、参数与参考素材 | 正常云端功能；不是纯离线应用 |
| HypiHub 响应中的 HTTPS 预签名存储地址 | 上传当前引用素材的分片；只发送所需长度和校验和头，不向该地址附带 HypiHub Bearer 凭据 | 正常媒体传输；具体域名由服务返回 |
| HypiHub 返回的结果下载 URL | 生成结果收集或语音 URL 响应触发；下载请求不携带 HypiHub Bearer | 正常下载，但没有固定域名/私网 IP 白名单，并使用默认重定向行为 |
| `127.0.0.1` | Studio 默认端口 5179；WhisperX 默认 8765；OAuth 回调使用随机端口 | 本机通信；Studio 固定监听回环地址并校验请求。渲染器的临时文件服务绑定由第三方实现，未验证 |
| npm 仓库、`pypi.org`、`files.pythonhosted.org`、浏览器/模型下载源 | 安装依赖、显式浏览器安装，或启动选中的本地 Provider 时准备工具和模型。锁文件给出 Python 包地址；其他具体源由库和环境配置决定 | 正常准备过程；本地推理不代表首次准备完全离线 |
| 用户提供的网站或视频 URL | `capture` 使用浏览器访问选定页面及其子资源；`media fetch` 使用 yt-dlp 获取视频 | 显式功能；所访问网站也可能带有自己的跟踪请求 |
| 配置的 S3 bucket/endpoint、Lambda function/region | 启用对应可选存储或传输组件后，由 AWS SDK 发送素材、结果或 JSON 请求 | 正常可选集成；没有找到隐藏固定账号或额外目标 |
| `storage.googleapis.com/hypit-public-assets/...` | 手动运行示例下载脚本获取两段足球视频，或显示文档/npm 页面中的示例媒体 | 示例资源；不是后台上传 |
| `api.github.com/repos/hypit-ai/hypihub/dispatches` | GitHub Actions 中 main 的 `docs/**` 更新，或手动触发；需有效 `HYPIHUB_SYNC_TOKEN` | 上游维护用途，与个人本地制作无关；建议个人分支禁用或限制仅上游仓库执行 |

### 最值得关闭的无关连接：上游文档同步

[工作流](../../.github/workflows/sync-hypihub-docs.yml)没有检查当前仓库是否为 `hypit-ai/hypit`。成功执行时，它发送：

- 当前仓库名；
- 提交 SHA；
- Git 引用；
- `docs/` 下匹配媒体/字体扩展名的文件路径列表。

它没有在这个 payload 中上传文件正文、视频项目或本机文件。脚本先检查 `HYPIHUB_SYNC_TOKEN` 非空；未配置时会在发送 HTTP 请求之前失败。有效 token 还需要访问目标仓库的权限。**本次没有查询你在 GitHub 上是否配置了该 secret，也没有禁用工作流。**

[发布工作流](../../.github/workflows/publish-npm.yml)另有 npm 发布和 GitHub Release 上传，只在发布 Release 或手动选择发布时使用，不是普通本机启动行为。个人分支通常也不需要沿用上游的发布目的地。

## 核心源码证据

以下链接在本仓库中可直接查看：

- 默认服务：[distribution.ts](../../packages/video-cli/src/distribution.ts)，32–38 行。
- API 认证与结果下载：[provider.ts](../../packages/provider-hypihub/src/provider.ts)，131–172、397–400、570–584 行。
- 素材上传：[upload.ts](../../packages/provider-hypihub/src/upload.ts)，275–284、393–404、420–434 行。上传协商会发送文件大小、类型、SHA-256 和前 512 字节，随后上传所选素材。
- Studio 监听：[start.ts](../../packages/studio/start.ts)，147–166 行；OAuth 回调：[oauth.ts](../../packages/cli/src/oauth.ts)，39–95 行。
- WhisperX 回环地址限制：[provider.ts](../../packages/provider-whisperx-local/src/provider.ts)，103–107 行；依赖准备：[program.ts](../../packages/provider-whisperx-local/src/program.ts)，120–136 行。
- NLTK 下载：[resources.py](../../services/whisperx/src/hypit_whisperx_service/resources.py)，24–41 行；语音模型/对齐模型加载：[engine.py](../../services/whisperx/src/hypit_whisperx_service/engine.py)，107–131 行。
- npm 工具安装：[packages.ts](../../packages/runtime-host-node/src/packages.ts)，78–105 行。
- 用户指定视频下载：[download.ts](../../packages/yt-dlp/src/download.ts)，62–78 行；示例下载：[download-reused-media.mjs](../../examples/ranking-football/download-reused-media.mjs)，6–10 行。
- 编码的 Windows 启动命令：[programs.ts](../../packages/runtime-local/src/programs.ts)，184–233 行。
- 第三方渲染文件服务入口：[capture.ts](../../packages/provider-hyperframes-local/src/capture.ts)，122 行。

## 容易误判的字符串和代码

- `http://www.w3.org/...` 是 SVG/XML 命名空间，不是发送请求的代码。
- `http://studio.hypit.local` 是解析相对请求 URL 的占位基址；对应代码没有向这个域名发起连接。
- `*.test`、`*.example` 和多数 `example.com` 位于测试或使用示例，不能算作默认外联。
- `img.shields.io`、`api.star-history.com` 是 README 图片；是否直接请求取决于查看器或图片代理。社区、赞助和厂商文档链接也不是运行时遥测。
- `hf-mirror.com`、`npmmirror.com`、清华镜像仅出现在工具准备参考文档中，该文档明确将它们作为用户可选择的镜像，并非代码默认地址。
- OAuth 中固定的 client ID 是公共客户端标识，不是硬编码秘密。
- Windows 的 PowerShell `-EncodedCommand` 解码后的源码逻辑是 `Start-Process`、日志重定向和输出 PID。凭据脚本访问 Windows PasswordVault，秘密经私有管道传递；没有看到远控服务器。
- 两个仓库内技能软链接都指向 `../../skills/hypit`，没有指向外部机器或用户秘密目录。

## 仍需信任的边界

1. **所选云端服务。** 返回的素材 URL 和重定向会扩大实际访问的域名范围。若需要严格限制外联，应增加 HTTPS、目标地址和重定向校验，或使用网络出口白名单；本次没有把“信任所选 Provider”误报为已确认后门。
2. **安装包和扩展。** 第一方 package.json 中未发现 preinstall/install/postinstall；六个生命周期入口均为 prepack 构建。不过按需 npm 工具安装未使用 `--ignore-scripts`，第三方包可能运行自己的安装脚本。精确版本不等于依赖实现已被审计。
3. **项目代码。** 项目 JS/TS、Provider 和浏览器组件可以执行代码。`NodeModuleScope` 明确不是安全沙箱，不能安全加载陌生扩展后再假定其无权联网或读取文件。
4. **实际运行。** 本次没有验证已下载的 Chromium、HyperFrames、WhisperX、AWS SDK 等内部联网，也没有检查云服务的数据保留行为。动态来源不能通过字符串搜索穷尽。

## 建议

- 个人分支先关闭上游文档同步工作流，按需保留发布工作流。
- 纯本地制作采用只含本地 Provider 的 Profile，提前准备依赖、模型和本地素材；不要把普通 `runtime init` 生成的 HypiHub 条目理解为离线模式。
- 在独立系统用户、容器或虚拟机中运行不熟悉的项目，避免给进程不必要的云端凭据。
- 如需验证实际联网，下一步应在隔离环境用合成素材运行指定流程并记录 DNS、目标 IP、端口与请求时机；不要直接用真实账户和私密素材做探测。

本次保留应用源码、配置和工作流不变。正式扫描报告另行由 Codex Security 生成；本文件是面向使用者的连接清单和说明。


## 扫描输出

- [Codex Security 生成报告（路径脱敏副本）](network-security-report.md)。
- 扫描 ID：`3956fd1a-6fc1-464c-bd7c-e3f505854507`；0 项确认漏洞；覆盖为 partial。
- 原始封存的 report.md、scan-manifest.json、findings.json、coverage.json 和 SARIF 保存在审查工作区同级的 `hypit-network-audit-2026-09-16/`，未将含机器路径的原始包上传。
- 插件返回的累计计量：9,765,362 tokens，其中缓存输入 9,318,912；输出 47,446。该统计包含缓存上下文重复读取，不等于本次新输入字数。
