# Hypit：研究与使用指南

审查日期：2026-09-15。仓库：`hypit-ai/hypit`。版本来自当前检出的 `package.json`：`0.1.8`。提交：`4894e625fe008415ed9702321699f5dcc069b769`。

## 结论

适合在个人、可信项目中试用的视频制作工具。当前不应把它作为隔离陌生用户代码的服务，也不宜直接把 Studio 暴露到公网。首次体验建议使用仓库中的纯本地聊天动画，不接入真实客户素材或付费账户。

本次完成克隆、应用研究及第一轮重点静态审核。没有安装项目依赖、运行应用、启动后台服务、登录第三方账户或提交付费生成。本次审核未修改应用源码。本仓库提交的是移除审查机器绝对路径后的公开文档副本。安全问题、证据和覆盖限制见 [Codex Security 生成报告](research/2026-09-15/security-report.md)；这不是全量逐行审计或安全认证。

| 定级 | 问题 | 必要前提 |
| --- | --- | --- |
| 中危 | Studio 未校验 Host，可在 DNS 重绑定后读写项目 | Studio 运行、访问恶意网页、浏览器/网络允许相关本地请求 |
| 中危 | Windows 导出可在目标目录外新建文件 | 恶意 S3 复合结果、Windows、目标与导出目录跨磁盘；不能覆盖已有文件 |
| 低危 | 跨站 POST 可写入伪造评论 | 已知 Run 路径，且浏览器允许本地请求；源码修改还需有效实体和版本 |
| 低危 | macOS 保存凭据时，秘密进入进程参数 | 具备本地进程观察权限，命中登录/刷新窗口 |
| 低危 | S3 外部文件引用可把本机文件加入导出包 | 低信任远端写入者、用户导出；后续共享才形成攻击者可见泄露 |

Windows 路径问题用 Node 标准库验证了当前判断会接受跨盘绝对路径，未写入文件；其余以静态调用链验证为主，没有执行真实浏览器攻击或读取秘密。

## 1. 它是什么

Hypit 给 Codex、Claude Code 等编程 Agent 提供视频制作语言、组件和执行工具。Agent 可以参考视频或文字需求，编写可编辑的工作流，再生成素材、编排字幕和画面、渲染成片。

它不是一个克隆后直接启动的普通 SaaS 网站，也不是自带通用大模型的聊天应用。

| 部分 | 用途 |
| --- | --- |
| Hypit Skill | 指导 Agent 如何制作视频；与可执行程序分别安装 |
| CLI | `check`、`plan`、`build`、导出、服务管理等 |
| Author Source：`.svml` | 描述作品、组件、字幕、镜头等 |
| Recipe：`.svs` | 可复用的创作配置或片段 |
| Run Source：`.svrun` | 指定本次目标、素材及历史结果复用 |
| `hypit.runtime.json` | 选择本地/远端 Provider、凭据引用和容量 |
| Studio | 浏览器中的预览、时间线、源码编辑和评论 |
| Local Runtime | 后台 Worker、任务执行、临时资源和状态 |

典型流程：需求/参考视频 → Agent 编写源码 → 检查计划 → 本地处理或远端生成 → 编排/预览 → 编码导出 MP4。

主要实现是 TypeScript/Node.js；界面使用 Vite，本地渲染使用 HyperFrames/Chromium，媒体处理使用 FFmpeg，部分转写和图像处理使用 Python。

## 2. 安全边界与数据去向

### 陌生项目会执行代码

项目可以选择带 `hypit.activation` 的扩展包，加载器会执行其 JavaScript/TypeScript。包可以使用 Node 内建模块、进程环境和文件系统。项目源码及扩展必须经过信任判断；`--workspace` 的文件边界不是操作系统沙箱。

`check` 和 `plan` 不提交生成任务，但解析源码时可能加载选中的可执行扩展，所以也不应直接对陌生项目运行。依据：`packages/cli/src/source-packages.ts`、`packages/package-loader-node/src/loader.ts` 以及该包 README 的明确说明。

### 本地与云端取决于 Runtime

- 默认初始化配置包含 `hypihub.default`，地址为 `https://hypit.ai`，以及本地媒体、渲染 Provider。存在此配置不代表已经登录或已授权消费。
- 使用 HypiHub 生成或转写时，相关提示词、文本及选中的参考素材会发送给服务；素材可以通过其 API 或协商的 S3 上传地址传输。
- 远端服务的内部鉴权、保存期限、训练用途、删除保证和费用上限无法由此客户端仓库证明。
- 纯本地动画可以不调用生成模型。它仍消耗本机计算资源，准备依赖时也可能联网下载软件。
- `transcribe` 可以直接调用所选转写 Provider，不需要先创建 Build；不能把“没有运行 build”理解为绝不会产生费用。

### 文件和凭据在哪里

| 数据 | 默认位置/机制 |
| --- | --- |
| 项目 Runtime 选择 | 项目内 `.hypit/runtime` |
| 默认 Runtime 数据 | 相对 Profile 所在目录的 `.hypit/runtimes/local` |
| 默认成片与结果清单 | 项目内 `.hypit/results/<UTC-date>/<build-id>/` |
| Studio 评论 | 项目内 `FEEDBACK.json` |
| macOS 机器共享工具 | `~/Library/Application Support/Hypit/`；可被 `HYPIT_STATE_HOME` 覆盖 |
| 默认账户凭据 | macOS Keychain / Windows 系统凭据库；也可选择环境变量存储 |

macOS 凭据写入实现存在将秘密放入子进程参数的问题，详见安全报告。系统凭据库存储本身不消除这一传递过程的泄露窗口。

已看到的有效措施包括：源码/素材的 `realpath` 边界校验、OAuth 的随机 state 和 S256 PKCE、部分上传 URL/校验和检查、WhisperX 的本地监听、路径和 WAV 格式限制。它们不能替代 Studio 请求鉴权或扩展代码隔离。

## 3. 审查时的环境与依赖要求

以下为 2026-09-15 审查环境的只读检查结果，仅用于说明依赖要求，不代表你的机器状态，也不代表已经跑通应用：

| 工具 | 检测结果 | 处理方式 |
| --- | --- | --- |
| Node.js | `v26.4.0` | 满足最低版本，但仓库 `.node-version` 为 `24.14.1`，CI 使用 22/24；首次运行宜对齐仓库版本 |
| pnpm | `11.19.0` | 仓库要求 `10.33.0`，使用明确版本调用 |
| 默认 Python | `3.9.6` | WhisperX / yt-dlp 要求 3.10–3.13；image-opencv 要求 3.13；纯聊天动画无需 Python |
| uv | `0.12.10` | 已在 PATH 中；本次未创建 Python 服务环境 |
| ffmpeg / ffprobe | PATH 中未找到 | 完整本地渲染前需要安装或配置可执行路径 |
| 项目依赖 / Chromium | 未安装或验证 | 后续依赖安装与 `runtime up` 准备 |

中文 CONTRIBUTING 仍写 Node 22.12+，与 `package.json` 的 22.15+ 不一致；以代码清单的最低版本及 `.node-version` 为准。

## 4. 从已克隆源码开始

本仓库保留原上游历史，远端配置与同步方式见 [UPSTREAM.md](UPSTREAM.md)。新环境可先克隆：

```bash
git clone git@github.com:googlinux/Hypit.git
cd Hypit
```

以下命令是使用说明，本次没有执行。先准备匹配的 Node.js 和 FFmpeg/ffprobe，再安装依赖：

```bash
# 在克隆后的 Hypit 仓库根目录执行
npx --yes pnpm@10.33.0 install --frozen-lockfile
npx --yes pnpm@10.33.0 check
npx --yes pnpm@10.33.0 test
node bin/hypit.mjs --version
node bin/hypit.mjs --help
```

依赖安装会访问包仓库，并可能执行包的安装逻辑。锁文件固定了此源码版本的依赖解析，但本次未完成第三方依赖实现或在线漏洞库的全量审计。

### 推荐首次体验：8 秒纯聊天动画

`examples/semantic-composition/chat.svml` 是现成示例；配套 Profile 只选择本地媒体和 HyperFrames，渲染 workers 设置为 2，不需要生成模型账户或 WhisperX。

先在仓库根构建示例组件：

```bash
npx --yes pnpm@10.33.0 build:public-types
npx --yes pnpm@10.33.0 --filter @example/chat-scene build
cd examples/semantic-composition
node ../../bin/hypit.mjs runtime use hypit.runtime.json --workspace .
node ../../bin/hypit.mjs check chat.svml --workspace .
```

准备本地执行环境并检查计划：

```bash
node ../../bin/hypit.mjs runtime up --workspace .
node ../../bin/hypit.mjs doctor --workspace .
node ../../bin/hypit.mjs plan chat.svrun --workspace .
```

`runtime up` 会安装所选 Provider 声明的上游工具、准备浏览器并启动 Worker；系统 FFmpeg 需要事先就绪。准备成功、计划符合预期后：

```bash
node ../../bin/hypit.mjs build chat.svrun --workspace . --follow
```

使用输出中真实的 Build ID 替换下方占位符：

```bash
node ../../bin/hypit.mjs inspect <build-id> --workspace .
node ../../bin/hypit.mjs get <build-id> --workspace . --output final.video --to output/chat.mp4
```

导出目的地必须尚不存在。Studio 可通过以下命令打开；首次试用应仅在本机使用，考虑先修复报告中的浏览器请求保护问题：

```bash
node ../../bin/hypit.mjs studio --run chat.svrun --workspace .
```

默认请求端口 `5179`，以命令实际打印的网址为准。示例命令中的 `--workspace .` 必须保留：该目录没有自己的 `package.json`，否则项目自动发现会向上选择仓库根目录。正式视频项目建议另建独立目录；这里在仓库内运行的是随附示例。

## 5. 日常让 Agent 制作视频

常规分发安装有两个独立步骤，仓库文档给出的命令是：

```bash
npm install --global @hypit/hypit
npx skills add hypit-ai/hypit -g
```

这会安装所选渠道当时的版本，并不保证与本次审核提交一致。本次没有执行，也没有修改 Codex 的技能安装。

安装后，在独立视频项目中向 Agent 提交具体需求，例如：

```text
/hypit 做一个 8 秒中文产品介绍，9:16 画幅。
先用本地文字、图形和已有素材，不调用付费模型。
先说明脚本和制作计划，再生成成片。
```

确需云端生成时，先明确账户、素材能否上传及预算，再根据所选 Runtime 连接凭据：

```bash
hypit runtime init
hypit auth status hypihub.default
hypit auth login hypihub.default
hypit pricing build.svrun
hypit plan build.svrun
hypit runtime up
hypit build build.svrun --follow
```

`pricing` 提供费率材料，不是保证准确的最终总价；源文件名须换成项目真实文件。不要把 Key 放到 `.svml`、`.svrun`、Runtime JSON 或 Git 中。

### 任务观察、取消和停止

```bash
hypit status <build-id> --watch
hypit cancel <build-id>
hypit runtime down
hypit programs down
```

关闭终端或按 Ctrl-C 只会停止观察，不等于取消后台任务。取消某个远端任务应在执行上下文仍可用时使用 `cancel`；`runtime down` 不等于取消远端 Provider 工作，独立 Managed Program 也需要单独停止。

## 6. 许可证不是标准 Apache 2.0

本提交的 LICENSE 自述为添加条件的 Apache 2.0，明确写明：

- 可自行运行，用于自己组织的商业工作和为客户制作内容。
- 对外多租户、托管/SaaS 提供 Hypit 功能，及为商业获益再分发 Hypit 或衍生软件，需要相应商业授权。
- 对 CLI、报告等用户界面中的名称、Logo、版权信息有保留要求。
- 作者不主张生成内容的所有权；模型服务可能另有条款。

因此，自用或用它制作客户视频，与把它封装成面向外部用户的平台，是不同的用途。具体条款请阅读该提交的 `LICENSE`，不要只看 README 的 Apache 徽章。

## 7. 审核范围与后续优先级

安全报告记录了实际审阅路径、源代码证据及未解决问题。本轮完整安全审阅了去重后的 86 个文件；仓库有 1595 个受 Git 跟踪的普通文件。架构查阅和局部证据片段不计入这 86 个。本轮主要覆盖 Studio HTTP 接口、凭据/OAuth、文件访问、包加载、Provider 上传、本地服务及部分结果存储。第三方依赖实现、绝大多数组件/示例、全部运行时状态机和真实生产环境没有被完整验证。

后续优先顺序：修复 Studio Host/Origin/会话令牌校验；补全导出的跨平台路径限制和 S3 外部文件授权；避免 macOS 凭据进入进程参数；在隔离环境跑本地示例和浏览器回归；再按实际使用范围检查依赖、复杂媒体及云端服务。

用于判断浏览器前提的外部资料：[Vite 插件中间件顺序](https://vite.dev/guide/api-plugin.html)、[Chrome 142 本地网络权限](https://developer.chrome.com/release-notes/142)。浏览器权限可能阻断某些攻击路径，不能替代应用自己的请求验证。
