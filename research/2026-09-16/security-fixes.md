# 五项安全问题修复记录

日期：2026-09-16。结果：**fixed（五项已修复）**。

对应 [2026-09-15 安全报告](../2026-09-15/security-report.md)。初始审查的上游提交为 `4894e625fe008415ed9702321699f5dcc069b769`；本次修复基于文档提交 `c87ff8725d304d54d036c8d49b25269365df4914`。原报告保留为历史记录，本次没有重新发布全量安全扫描，也不代表上游或 npm 发布版本已包含这些修复。

## 1. 修复与兼容性

### Studio Host 边界与跨站写入（两项）

- 新增 [统一请求保护](../../packages/studio/src/request-protection.ts)，在所有自定义路由之前验证精确回环 Host 和实际监听端口。拒绝异源 Origin、跨站/同站异源 Fetch Metadata，以及绝对形式和歧义请求 URL。
- 所有非 GET/HEAD 请求要求精确 Origin、`application/json` 和每次服务器启动生成的随机会话令牌。令牌通过不缓存的启动 HTML 提供；四个 UI 写入入口统一使用 [请求头助手](../../packages/studio/src/ui/request.ts)。
- [启动入口](../../packages/studio/start.ts) 固定监听 `127.0.0.1`；主服务、评论和本地化插件也分别安装同一保护，避免单独使用插件时漏检。
- 保留现有源码版本、路径与写回检查。合法同源评论写入、本地化读取、媒体 GET/HEAD 和 Range 请求通过回归。

使用时直接打开 CLI 打印的本机网址，服务重启后刷新页面。自定义域名、反向代理和跨源写入不属于这个本地 Studio 接口的支持方式。

### Windows 导出目录边界

- [共享结果路径校验器](../../packages/build-result/src/types.ts) 拒绝冒号，从而统一排除盘符绝对/相对路径和 NTFS 备用数据流；原有绝对路径、反斜杠、NUL、空段及目录穿越限制保留。
- [S3 解码和访问](../../packages/build-result-s3/src/repository.ts) 复用该校验器。[CLI 复合导出](../../packages/cli/src/result-export.ts) 在读取文件流或碰撞重命名前校验原始路径，并额外拒绝 `relative()` 返回的绝对路径。
- 合法 Unicode 相对路径仍能导出；已有文件的禁止覆盖语义和失败后的清理保持不变。

包含盘符或冒号的结果路径现在在所有平台拒绝，避免生成在另一平台具有不同含义的导出包。

### macOS 凭据进程参数泄露

- 新增 [原生 Keychain 后端](../../packages/credential-store-os/src/macos-keychain.ts)，通过 Koffi 调用 Security/CoreFoundation 框架，完成查询、新建、更新和删除。
- [凭据存储入口](../../packages/credential-store-os/src/store.ts) 按需加载 macOS 后端，不再通过 `security ... -w <secret>` 传递秘密。错误仅包含操作名和 OS 状态码，释放返回的原生内容及对象，并清零临时 JS 字节缓冲区。
- 保留原来的 generic-password、service/account 和存储内容格式。Windows 后端仍使用原有私有管道。包显式声明仓库已经锁定的 `koffi@3.2.1`，未升级其他依赖版本。

历史凭据的系统访问控制可能要求用户授权新的调用程序。本次测试使用独立临时 Keychain 和合成秘密，不读取用户现有凭据；未验证真实账户的首次迁移授权弹窗。

### S3 外部文件引用默认权限

- [S3 repository](../../packages/build-result-s3/src/repository.ts) 不再默认注入本机文件访问能力。外部引用的 size/open 路径统一拒绝，覆盖结果解析、文件描述、导出及其他经 repository 访问的消费者。
- 宿主代码仍可显式传入 `externalFiles: ExternalFileAccess`。该解析器必须自行限制可访问目录并验证来源，不能将任意远端 `file:` URI 当作本机授权。
- 普通对象存储素材、复合结果和显式授权解析器的现有测试继续通过。

**兼容性变化：历史 S3 结果中的本机文件引用也会默认失败。** 推荐将对应素材存入对象存储；确有需要时由可信宿主代码显式提供受限解析器。常规 Runtime JSON 没有新增的隐式本机授权开关，FS repository 的原有行为不变。详见 [S3 说明](../../packages/build-result-s3/README.md)。

## 2. 验证结果

在 macOS 上分别使用仓库指定的 Node **24.14.1** 和本机 Node **26.4.0**。包管理器为 pnpm **10.33.0**。

| 验证层 | 结果 |
| --- | --- |
| 类型与补丁检查 | 两个 Node 版本的 TypeScript 检查通过；`git diff --check` 通过；冻结锁文件安装通过 |
| 定向安全回归 | 16 项通过、0 失败、0 跳过；其中新增 6 项测试用例，覆盖恶意输入和合法控制 |
| 原始行为对照 | 原版本的两个 Studio 写入入口条件、路径判断、S3 本机文件读取和 macOS 秘密 argv 均能由隔离验证重现；修复后相应请求/访问被拒绝或改走无子进程的原生路径 |
| 完整套件 | 两个 Node 版本各 860 项：**832 通过、0 失败、28 跳过** |
| 独立复核 | 一名只读调查者核对边界与调用者；一名全新只读审阅者检查最终候选补丁，未发现可操作的绕过或回归 |

主要回归代码：

- [Studio HTTP 测试](../../packages/studio/test/request-protection.test.ts)：真实 Vite 临时监听端口，验证启动页令牌、插件顺序、所有写入路由、伪造 Host/Origin、缺失和错误令牌、简单表单内容类型、URL 变体、媒体范围读取及服务重启令牌失效。
- [导出测试](../../packages/cli/test/result-export-security.test.ts)：真实导出实现拒绝盘符、备用数据流、穿越等路径，拒绝前不打开素材流，正常路径可导出且不覆盖已有文件。以 `path.win32` 验证跨盘 `relative()` 的绝对路径行为。
- [S3 测试](../../packages/build-result-s3/test/repository.test.ts)：内存对象存储中的顶层及复合外部引用默认失败，导出不留下半成品，显式授权解析器保留正常行为。
- [macOS 测试](../../packages/credential-store-os/test/macos-keychain.test.ts)：独立临时 Keychain 中验证缺失、保存、更新、读取、删除、service 隔离，以及 Unicode/NUL/换行内容；所有子进程入口替换为直接失败，确认后端不调用它们。

原始行为对照使用本次修复前的 Git 源码、临时文件和合成秘密；macOS 原始写入命令被 mock 截获，没有启动携带秘密的进程。该对照工具与执行日志保留于审查工作区的 `.git/`，不作为公开报告的可移植附件；上列已提交的回归测试可重复执行。

### 可复现命令

在 Node 24.14.1 下，于仓库根目录执行：

```bash
npx --yes pnpm@10.33.0 install --frozen-lockfile --ignore-scripts
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
node --import tsx --test --test-timeout=60000 \
  packages/studio/test/request-protection.test.ts \
  packages/credential-store-os/test/macos-keychain.test.ts \
  packages/cli/test/result-export-security.test.ts \
  packages/build-result-s3/test/repository.test.ts
node test/run.mjs
git diff --check
```

macOS 原生测试在其他操作系统上跳过；本次是在 macOS 上实际执行并通过。完整套件的 28 项跳过来自现有 Chromium、FFmpeg、渲染及 image-opencv 等环境依赖测试，不能当作已验证通过。

## 3. 仍未覆盖的范围

- 未在 Windows 真机文件系统执行导出；已验证可移植输入规则、Win32 路径语义和实际 CLI 拒绝逻辑。
- 未执行真实 DNS 重绑定攻击或真实浏览器端到端流程；已运行实际 HTTP 服务验证请求边界。未验证自定义浏览器插件或第三方 Vite 插件组合。
- 未完成全媒体渲染、真实账户登录、付费生成、第三方依赖实现或云端服务审计。
- 这些修复不为陌生 Hypit 项目/扩展提供进程隔离，也不使 Studio 成为可公开部署的多用户服务。

结论仅针对这五项问题及本次补丁，不构成整套应用的安全认证。
