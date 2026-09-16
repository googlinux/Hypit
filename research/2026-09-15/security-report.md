> 发布副本：由 Codex Security 生成的 2026-09-15 静态审核报告，仅将审查机器的绝对路径替换为可移植标记。审核对象是上游提交 `4894e625fe008415ed9702321699f5dcc069b769`。原始封存的 JSON、SARIF 与报告保留在审查者本地；本副本不构成可重新校验封存哈希的完整扫描包。

# Security Review: hypit-source

## Scope

Standard, source-backed security review of the cloned Hypit repository at commit 4894e625fe008415ed9702321699f5dcc069b769 (package version 0.1.8), with independent baseline and targeted Studio/S3 investigations. All repository paths were authorized; completed security review covers selected boundaries only.

- Scan mode: repository
- Target kind: git_revision
- Target ID: target_sha256_2890d1a6acd8022c4ba9cb022046e6f81ec7329f8881875d463c7585e6be6ac2
- Revision: 4894e625fe008415ed9702321699f5dcc069b769
- Inventory strategy: repository
- Included paths: .
- Excluded paths: none
- Runtime or test status: Application not installed or executed. No services started, credentials read or paid operations submitted. Source tree unchanged.
- Artifacts reviewed: packages/studio/start.ts, packages/studio/src/server.ts, packages/studio/src/feedback-server.ts, packages/studio/src/feedback-store.ts, packages/studio/src/feedback.ts, packages/studio/src/source-transaction.ts, packages/studio/src/localization-node.ts, packages/studio/src/ui/i18n.ts, packages/cli/src/oauth.ts, packages/provider-hypihub/src/oauth.ts, packages/provider-hypihub/src/upload.ts, packages/provider-hypihub/src/routes.ts, packages/credential-store-os/src/store.ts, packages/resource-store-fs/src/store.ts, packages/workspace-fs-node/src/workspace.ts, packages/browser-capture/src/index.ts, packages/yt-dlp/src/download.ts, packages/provider-hyperframes-local/src/capture.ts, packages/provider-hyperframes-local/src/render.ts, packages/hyperframes/src/project.ts, packages/hyperframes/src/browser-program.ts, packages/package-loader-node/src/loader.ts, packages/package-loader-node/src/location.ts, packages/runtime-host-node/src/packages.ts, packages/transport-aws-lambda/src/index.ts, packages/protocol/src/canonical.ts, packages/markup/src/syntax.ts, packages/build-result/src/file-reference.ts, packages/build-result/src/store.ts, packages/build-result/src/writer.ts, packages/build-result/src/decode.ts, services/whisperx/src/hypit_whisperx_service/server.py, services/whisperx/src/hypit_whisperx_service/config.py, services/whisperx/src/hypit_whisperx_service/resources.py, services/whisperx/src/hypit_whisperx_service/application.py, services/whisperx/src/hypit_whisperx_service/audio.py, services/whisperx/src/hypit_whisperx_service/engine.py, bin/hypit.mjs, packages/studio/package.json, packages/studio/src/run.ts, packages/studio/src/compile.ts, packages/studio/src/surface-preview.ts, packages/studio/src/session.ts, packages/studio/src/domain.ts, packages/studio/src/companion-assembly.ts, packages/studio/src/execute.ts, packages/studio/src/build-library.ts, packages/studio/src/library-media.ts, packages/studio/src/parameter-values.ts, packages/studio/src/preview/render.ts, packages/studio/src/preview/runtime-shim.ts, packages/studio/src/ui/stage.ts, packages/studio/src/ui/material-preview.ts, packages/studio/src/ui/artifact-preview.ts, packages/studio/src/ui/scrub-preview.ts, packages/studio/src/ui/writeback.ts, packages/studio/src/ui/artifact-name.ts, packages/studio/src/ui/syntax.ts, packages/studio/src/ui/comments.ts, packages/hyperframes/src/types.ts, packages/hyperframes/src/document.ts, packages/visual-ir/src/style.ts, packages/build-result-fs/src/index.ts, packages/build-result-s3/src/activation.ts, packages/build-result-s3/src/client.ts, packages/build-result-s3/src/index.ts, packages/build-result-s3/src/repository.ts, packages/resource-store-s3/src/client.ts, packages/resource-store-s3/src/index.ts, packages/resource-store-s3/src/store.ts, packages/cli/src/result-export.ts, packages/credential-store-os/src/activation.ts, packages/credential-store-env/src/index.ts, packages/credential-store-env/src/activation.ts, packages/runtime-local/src/credentials.ts, packages/browser-capture/src/browser.ts, packages/cli/src/source-packages.ts, packages/cli/src/source-discovery.ts, packages/video-cli/src/cli.ts, packages/video-cli/src/distribution.ts, packages/provider-hypihub/src/activation.ts, packages/provider-media-local/src/program.ts, packages/provider-hyperframes-local/src/program.ts, .github/workflows/ci.yml, .github/workflows/publish-npm.yml, .github/workflows/sync-hypihub-docs.yml
- Scan context: git\\@github.com:hypit-ai/hypit.git clone并研究此应用 并审核是否安全 如何使用等等

Limitations and exclusions:
- Partial review; architecture mapping is not counted as completed security coverage.
- 1595 regular tracked files; many components, examples, tests and runtime internals were not fully audited.
- No dependency implementation/CVE audit, actual Windows application test, live browser exploit, media demuxer experiment or hosted-backend assessment.
- Excluded .git: Git history and repository metadata outside current-tree source review.
- Excluded node_modules: Dependencies were not installed; lockfile selection does not establish dependency security.
- Excluded External services and deployment configuration: HypiHub backend, IAM/bucket policies, npm account controls, browser defaults and third-party tool implementations were not fully assessed.

### Scan Summary

| Field | Value |
| --- | --- |
| Scan outcome | completed |
| Reportable findings | 5 |
| Severity mix | medium: 2, low: 3 |
| Confidence mix | high: 4, medium: 1 |
| Coverage | partial |
| Validation mode | Static source-to-sink review, primary documentation check for Vite ordering/browser restrictions, and non-writing Node standard-library Windows path experiment. |

Canonical artifacts: `scan-manifest.json`, `findings.json`, and `coverage.json`. This report is a deterministic projection of those files.

## Threat Model

Hypit is a local video-authoring toolchain for coding agents and human authors. The npm executable and repository shell launcher enter the same TypeScript CLI; Studio is a separate Vite browser interface. Author Sources and Run Sources are compiled using selected Node packages, then a local runtime schedules media, rendering, or hosted inference operations and publishes project Results. Normal startup is local and user-owned, not a multi-tenant service. Optional workflows include direct creation commands, browser capture, local WhisperX, S3 Results, package installation, and privileged npm/docs publication. Evidence: bin/hypit.mjs:21, bin/hypit.mjs:33, bin/hypit.mjs:45, hypit:4, hypit:11, packages/cli/src/main.ts:257, packages/cli/src/main.ts:383, packages/cli/src/main.ts:425, packages/video-cli/src/cli.ts:89. This architecture mapping does not constitute completed security-audit coverage.

### Assets

- Project Author/Run Sources, referenced media, and editable review comments. Studio maintains a compiled-source allowlist and writes FEEDBACK.json at the workspace root. Evidence: packages/studio/src/server.ts:142, packages/studio/src/server.ts:210, packages/studio/src/feedback-store.ts:12.
- Active runtime state: for the starter profile, \<profile directory\>/.hypit/runtimes/local/runtime.sqlite. The full configuration chain is profile JSON dataRoot resolved against the profile directory, then statePath(root). Evidence: packages/video-cli/src/distribution.ts:28, packages/runtime-local/src/config.ts:263, packages/runtime-local/src/config.ts:270, packages/runtime-local/src/config.ts:985.
- Runtime resource bytes: shared FileResourceStore receives \<runtime root\>/resources but itself adds resources/\<resource id\>, yielding \<runtime root\>/resources/resources/\<resource id\>; build-specific bytes live at \<runtime root\>/work/\<build id\>/resources/\<resource id\>. Build logs live at \<runtime root\>/work/\<build id\>/execution.jsonl, and worker logs at \<runtime root\>/worker/worker.log. Evidence: packages/runtime-local/src/config.ts:989, packages/runtime-local/src/config.ts:1266, packages/runtime-local/src/config.ts:1270, packages/runtime-local/src/config.ts:1271, packages/resource-store-fs/src/store.ts:16, packages/runtime-local/src/log.ts:17, packages/runtime-local/src/worker-process.ts:44.
- Durable default Results live at \<project\>/.hypit/results/\<UTC YYYY-MM-DD\>/\<build id\>/, independently of runtime dataRoot. hypit.results.json can select another filesystem path or S3 adapter. S3 keys use \<optional prefix\>/\<16-digit descending timestamp\>-\<build id\>/\<safe relative path\>. Evidence: packages/video-cli/src/distribution.ts:17, packages/runtime-local/src/config.ts:381, packages/build-result-fs/src/activation.ts:22, packages/build-result/src/store.ts:163, packages/build-result/src/store.ts:168, packages/build-result-s3/src/repository.ts:52, packages/build-result-s3/src/repository.ts:153.
- HypiHub OAuth access/refresh credentials: starter reference os:hypihub.oauth, default OS service hypit, stored in the current user's macOS Keychain or Windows Credential Manager and resolved into endpoint execution. The starter hosted API origin is https://hypit.ai; acquisition and refresh use its /oauth/token endpoint. Evidence: packages/video-cli/src/distribution.ts:30, packages/video-cli/src/distribution.ts:36, packages/credential-store-os/src/store.ts:20, packages/credential-store-os/src/store.ts:139, packages/credential-store-os/src/store.ts:177, packages/provider-hypihub/src/provider.ts:136, packages/provider-hypihub/src/provider.ts:575, packages/provider-hypihub/src/oauth.ts:58.
- Machine-owned installed programs and npm dependencies reside beneath HYPIT_STATE_HOME when set; otherwise ~/Library/Application Support/Hypit on macOS, LOCALAPPDATA/Hypit or ~/AppData/Local/Hypit on Windows, and XDG_STATE_HOME/hypit or ~/.local/state/hypit on other systems. Exact-version npm installs live under \<host state\>/packages/\<package-name\>/\<version\>/, with install.log in that installation. Evidence: packages/runtime-host-node/src/index.ts:316, packages/runtime-host-node/src/index.ts:340, packages/package-loader-node/src/location.ts:70, packages/runtime-host-node/src/packages.ts:135.
- Hosted inference account access, submitted private media/prompts, and billable execution capacity. HypiHub receives bearer-authenticated requests and supplies temporary signed upload capabilities to remote object storage. Evidence: packages/provider-hypihub/src/provider.ts:136, packages/provider-hypihub/src/provider.ts:575, packages/provider-hypihub/src/upload.ts:280, packages/provider-hypihub/src/upload.ts:307.
- Release/package integrity and privileged publication identities: npm publication receives GitHub OIDC authority; docs sync receives the repository secret reference HYPIHUB_SYNC_TOKEN and posts source commit metadata to hypit-ai/hypihub. Evidence: .github/workflows/publish-npm.yml:107, .github/workflows/publish-npm.yml:111, .github/workflows/publish-npm.yml:144, .github/workflows/sync-hypihub-docs.yml:25, .github/workflows/sync-hypihub-docs.yml:47.

### Trust Boundaries

- Author/project packages -\> Node host authority. The loader restricts declared activation paths to package-relative locations and reserves @hypit package resolution for Distribution roots when supplied, then imports activation code. These are package selection and integrity controls, not a sandbox; selected code runs with host authority. Evidence: packages/package-loader-node/src/loader.ts:85, packages/package-loader-node/src/loader.ts:90, packages/package-loader-node/src/loader.ts:100. Documentation explicitly agrees at docs/guide/runtime.md:130.
- CLI submission -\> coordinator/executor processes. Submitted execution context captures profile choices and Results destination; executors inherit process environment. Coordinator checks that reported completed builds were assigned to the carrier. Memory retirement affects completed-work process reuse rather than imposing a hard per-build memory limit. Evidence: packages/cli/src/main.ts:383, packages/runtime-local/src/config.ts:1251, packages/runtime-local/src/supervisor.ts:20, packages/runtime-local/src/supervisor.ts:28, packages/runtime-local/src/supervisor.ts:46, packages/runtime-local/src/supervisor.ts:53, packages/runtime-local/src/supervisor.ts:72.
- Browser -\> Studio source/result/comment operations. Starter Studio uses port 5179 unless overridden and delegates binding, Host, and browser-origin defaults to Vite; it sets configFile:false and a filesystem allowlist containing workspace, package, Distribution, and Studio roots. Its source write control enforces compiled-source membership, workspace-relative paths, revision/preimage matching, serialized mutation, and recompilation. Feedback separately enforces Run identity and previous-value matching. Those controls do not themselves authenticate browser callers. Evidence: packages/studio/start.ts:109, packages/studio/start.ts:146, packages/studio/start.ts:155, packages/studio/src/server.ts:210, packages/studio/src/server.ts:238, packages/studio/src/server.ts:438, packages/studio/src/server.ts:475, packages/studio/src/server.ts:526, packages/studio/src/feedback-server.ts:39, packages/studio/src/feedback-store.ts:33. Parent source validation confirms the custom API handlers are registered before Vite internal middleware and terminate matching requests. Vite's documented ordering therefore leaves those routes without the later internal Host guard; actual browser reachability remains conditional. References: https://vite.dev/guide/api-plugin.html and https://developer.chrome.com/release-notes/142 . Feedback additions require only a new unique identifier, not an existing preimage; prior-value matching applies to replacement/deletion.
- CLI/browser OAuth exchange -\> hosted account credentials. OAuth acquisition creates random state and S256 PKCE verifier/challenge, listens on an ephemeral 127.0.0.1 callback port, requires exact callback path and matching state, and exchanges the code at endpoint-declared token URL. The OS store enforces ownership by store identifier and uses platform credential facilities; server-side account authorization remains external. Evidence: packages/cli/src/oauth.ts:39, packages/cli/src/oauth.ts:58, packages/cli/src/oauth.ts:90, packages/cli/src/oauth.ts:118, packages/credential-store-os/src/store.ts:177, packages/provider-hypihub/src/provider.ts:580.
- Endpoint request -\> hosted inference and upload destinations. The configured HypiHub baseUrl determines the bearer-authenticated API and OAuth origin; external service authorization and media handling are outside this source tree. Signed upload URLs are treated as credentials and omitted from final upload errors. Evidence: packages/provider-hypihub/src/provider.ts:131, packages/provider-hypihub/src/provider.ts:570, packages/provider-hypihub/src/upload.ts:280, packages/provider-hypihub/src/upload.ts:307.
- Local provider -\> WhisperX HTTP service and local filesystem. Provider activation permits loopback HTTP destinations only; default is http://127.0.0.1:8765. The provider writes \<Node tmpdir\>/hypit-whisperx-local-\*/alignment-evidence.wav and passes its absolute path. The service binds 127.0.0.1, requires JSON, resolves and checks configured input roots, limits request/audio sizes, and accepts canonical 16 kHz mono PCM s16 WAV. The service has no inspected application authentication and relies on local exposure plus file access controls. Evidence: packages/provider-whisperx-local/src/activation.ts:23, packages/provider-whisperx-local/src/provider.ts:23, packages/provider-whisperx-local/src/provider.ts:139, packages/provider-whisperx-local/src/provider.ts:169, services/whisperx/src/hypit_whisperx_service/server.py:89, services/whisperx/src/hypit_whisperx_service/application.py:52, services/whisperx/src/hypit_whisperx_service/audio.py:39, services/whisperx/src/hypit_whisperx_service/audio.py:60.
- Results adapter -\> S3 account/bucket. Project-selected bucket, prefix, region, endpoint, path-style setting and optional expectedBucketOwner are supplied to the S3 adapter. The adapter validates key segments and passes ExpectedBucketOwner when configured; AWS SDK credential resolution and external IAM/bucket policy supply authorization. A prefix alone is not tenant isolation. Evidence: packages/build-result-s3/src/activation.ts:11, packages/build-result-s3/src/repository.ts:45, packages/build-result-s3/src/repository.ts:153, packages/build-result-s3/src/client.ts:55, packages/build-result-s3/src/client.ts:66.
- Local setup/capture -\> process and executable authority. Exact registry versions are required for managed npm packages, but npm installation runs under the user's account. Browser capture scripts are directly imported as ordinary project code, with full Node authority. Browser executable selection and media tools are operator-controlled dependencies. Evidence: packages/runtime-host-node/src/packages.ts:28, packages/runtime-host-node/src/packages.ts:76, packages/runtime-host-node/src/packages.ts:95, packages/video-cli/src/capture.ts:42, packages/video-cli/src/capture.ts:106, packages/browser-capture/src/browser.ts:12.
- Maintainer/release workflow -\> public npm and cross-repository dispatch. Release checks bind version to package.json and require source ancestry in main, CI runs before packaging, and the publish job uses the prepared artifact. Docs synchronization sends source SHA and asset paths to a fixed GitHub repository. Repository branch protections, npm trusted publisher configuration, and receiving repository behavior are external controls. Evidence: .github/workflows/publish-npm.yml:27, .github/workflows/publish-npm.yml:40, .github/workflows/publish-npm.yml:66, .github/workflows/publish-npm.yml:94, .github/workflows/publish-npm.yml:121, .github/workflows/publish-npm.yml:144, .github/workflows/sync-hypihub-docs.yml:25, .github/workflows/sync-hypihub-docs.yml:53.
- Remote persisted Result data -\> consumer filesystem: composite exports preserve build-file storage paths; Windows cross-drive containment must reject absolute relative() results. S3 external-file declarations default to localExternalFiles without provenance or allowed-root restrictions. These additional threats require a selected malicious Result and, for attacker-visible local-file disclosure, subsequent sharing. Evidence: packages/cli/src/result-export.ts:35, packages/cli/src/result-export.ts:90, packages/build-result-s3/src/repository.ts:149, packages/build-result/src/file-reference.ts:13.

### Attacker Capabilities

- A media/source supplier may control files, URLs, referenced media, or project source presented for authoring. This does not imply authority to alter trusted Distribution code, runtime configuration, installed packages, or OS credentials. A boundary failure could add unintended file access, data disclosure, execution, or billable requests.
- A browser-origin attacker may attempt requests to a running Studio or local helper. Network reachability and actual Vite origin/Host enforcement must be established before claiming impact; this review did not inspect installed Vite implementation.
- Another local OS account may reach a loopback service but does not automatically possess the running user's credential-store or file permissions. Same-user project code already has Node/process authority and should not be modeled as a sandbox escape.
- A compromised hosted service or malicious remote response could control returned metadata/media and signed upload destinations; it does not initially control local runtime configuration. The service's server-side enforcement is unavailable here.
- An ordinary outside contributor does not possess release, npm OIDC, or HYPIHUB_SYNC_TOKEN authority. Privileged CI effects require the actual workflow triggers and repository permission prerequisites.
- A less-trusted S3 Result writer can control selected composite metadata and object bytes without controlling the consumer's local files. Export translates that stored data into local paths and can resolve external-file URIs on the consumer's machine.

### Security Objectives

- Keep Source and Result reads/writes constrained to the intended project, selected files, and validated logical identities; preserve revision/preimage consistency during Studio editing. Evidence: packages/studio/src/server.ts:195, packages/studio/src/server.ts:210, packages/studio/src/server.ts:238, packages/build-result/src/store.ts:168, packages/build-result/src/store.ts:190.
- Protect OS-stored account credentials and signed upload capabilities from unrelated recipients, source files, and logs; bind OAuth acquisition to the initiating CLI exchange. Evidence: packages/credential-store-os/src/store.ts:177, packages/cli/src/oauth.ts:39, packages/cli/src/oauth.ts:58, packages/provider-hypihub/src/upload.ts:307.
- Treat project packages, capture scripts, configured executables, and managed installations as trusted executable code. Execution separation must not be represented as an OS sandbox. Evidence: packages/package-loader-node/src/loader.ts:100, packages/video-cli/src/capture.ts:106, docs/guide/runtime.md:133.
- Preserve separation between explicit provisioning and build execution, and report runtime readiness before submission. Evidence: docs/guide/runtime.md:88, packages/cli/src/main.ts:407, packages/cli/src/main.ts:425.
- Keep WhisperX within loopback/file-root/canonical-audio boundaries and enforce its configured size limits. Evidence: packages/provider-whisperx-local/src/activation.ts:23, services/whisperx/src/hypit_whisperx_service/server.py:64, services/whisperx/src/hypit_whisperx_service/audio.py:42, services/whisperx/src/hypit_whisperx_service/audio.py:46.
- Bind release publication to the checked version/source and prepared package, and restrict publication credentials to their intended workflow recipients. Evidence: .github/workflows/publish-npm.yml:40, .github/workflows/publish-npm.yml:94, .github/workflows/publish-npm.yml:111, .github/workflows/publish-npm.yml:144.

### Assumptions

- Origin: user request asks to clone, study, assess safety, and explain usage. Authorized scope is the complete current tree at commit 4894e625fe008415ed9702321699f5dcc069b769. No deployment, tenant model, budget policy, or authoritative threat model was supplied.
- Read-only offline source inspection only; no application execution, external service calls, exploit inputs, source modifications, or dependency installation. 178 nonempty path/line anchors were batch-checked across 45 inspected files. This is architecture mapping, not a vulnerability coverage claim. Parent validation additionally consulted public primary Vite/Chrome documentation and evaluated Node's standard-library win32 path semantics without writing files. No repository program was executed.
- No inherited root SECURITY.md was resolved by the supplied resolver. Policy applicability for a subsequently narrowed surface should still be resolved by the parent.
- The default runtime profile is initialized at \<project\>/hypit.runtime.json unless explicitly chosen otherwise; --runtime supersedes the project .hypit/runtime pointer. Moving a profile changes the interpretation of its relative dataRoot. Evidence: packages/cli/src/main.ts:124, packages/cli/src/main.ts:181, packages/project-context-node/src/runtime-selection.ts:25, packages/project-context-node/src/runtime-selection.ts:71, packages/runtime-local/src/config.ts:270.
- Documentation says independent builds are not a security sandbox, and inspected imports/inherited environment agree. No discrepancy is established for that guarantee. Evidence: docs/guide/runtime.md:126, docs/guide/runtime.md:130, packages/package-loader-node/src/loader.ts:100, packages/runtime-local/src/supervisor.ts:53.
- The generated starter profile uses OS credentials, while the OS adapter throws on platforms other than macOS/Windows. Linux operation therefore needs an alternate credential store/configuration for hosted execution; default starter compatibility is not established there. Evidence: packages/video-cli/src/distribution.ts:30, packages/credential-store-os/src/store.ts:139.
- Managed WhisperX uses \<host state\>/programs/whisperx-\<encoded endpoint id\>-\<encoded service host\>/.venv and nltk_data, while its input staging still uses Node tmpdir and the service's default Python tempfile root. The systemd example instead uses User=hypit, /tmp input root, /var/cache/hypit/whisperx/nltk_data, and /opt/hypit/services/whisperx/.venv executables. Temporary-directory agreement and cross-UID readability must be supplied by that deployment; separate configuration does not prove isolation or compatibility. Evidence: packages/provider-whisperx-local/src/program.ts:74, packages/provider-whisperx-local/src/program.ts:81, packages/provider-whisperx-local/src/provider.ts:139, services/whisperx/src/hypit_whisperx_service/config.py:51, services/whisperx/deploy/hypit-whisperx.service.example:7, services/whisperx/deploy/hypit-whisperx.service.example:14, services/whisperx/deploy/hypit-whisperx.service.example:21.
- Studio sets no explicit bind host, origin allowlist, or authentication token in its startup or inspected route implementation. Its installed Vite version's actual defaults are an unresolved dependency-owned control, not evidence that Studio is internet-exposed. Evidence: packages/studio/start.ts:146, packages/studio/src/server.ts:473, packages/studio/src/feedback-server.ts:24.
- User/agent budget agreement is a documented production workflow; the inspected build submission performs capability/readiness checks then queues execution. A hard monetary spending limit or bound approval receipt is not established by this path. This is a control-ownership distinction rather than a confirmed contradictory guarantee. Evidence: docs/quickstart.md:62, packages/cli/src/main.ts:407, packages/cli/src/main.ts:425.
- S3 bucket/IAM policy, AWS credential chain implementation, npm registry trust, Vite implementation, HyperFrames engine/producer browser and file-server controls, and hosted HypiHub enforcement were not inspected. HyperFrames is imported dynamically at packages/provider-hyperframes-local/src/capture.ts:38.
- Result storage can retain external live file references; switching to S3 does not automatically upload those files, migrate history, or move runtime state. Documentation explicitly says so at docs/guide/runtime.md:149 and docs/guide/runtime.md:154. No isolation guarantee should be inferred merely from selecting S3.

## Findings

| Finding | Severity | Confidence | Detailed write-up |
| --- | --- | --- | --- |
| [Studio 自定义接口未校验 Host，可在 DNS 重绑定条件下读写项目](#finding-1) | medium | high | inline below |
| [Windows 跨盘导出恶意 S3 结果时可在目标目录外新建文件](#finding-2) | medium | high | inline below |
| [Studio 接受跨站简单 POST，可被写入伪造评论](#finding-3) | low | high | inline below |
| [macOS 保存凭据时将完整秘密放入进程参数](#finding-4) | low | high | inline below |
| [导出低信任 S3 结果可能把消费端本地文件复制进结果包](#finding-5) | low | medium | inline below |

### Confidence Scale

| Label | Meaning |
| --- | --- |
| high | Direct evidence supports the finding with no material unresolved blocker. |
| medium | Evidence supports a plausible issue, but material runtime or reachability proof remains. |
| low | Evidence is incomplete and the item is retained only for explicit follow-up. |

<a id="finding-1"></a>

### [1] Studio 自定义接口未校验 Host，可在 DNS 重绑定条件下读写项目

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | 启动器、完整路由与源码写入链条互相吻合；Vite 官方文档确认 configureServer 的中间件顺序。未安装 Vite 或完成真实浏览器重绑定复现。 |
| Category | origin-validation |
| CWE | CWE-346 |
| Affected lines | packages/studio/src/server.ts:473-475 |

#### Summary

Studio 开启时，能完成 DNS 重绑定的恶意网页可读取会话中的源码与版本号，再修改允许列表内的项目源码。自定义接口在 Vite 内部保护之前处理请求，没有自己的 Host 验证或会话凭证。此路径受浏览器本地网络权限及 DNS 行为限制。

#### Root Cause

启动器注册 Studio 插件，但没有放置先于插件的请求授权。插件在 `configureServer` 中直接注册中间件，按路径处理请求而不验证 `Host`；Vite 文档说明这一位置先于内部中间件。`/__studio/session` 直接返回含源码文本和当前修订号的快照。重绑定后能读响应的网页可取允许路径与修订号，再向 `PUT /__studio/source` 提交替换文本；服务端自己生成当前 `preimage` 并通过既有事务写入文件。路径和版本保护保留了写入范围，却没有判断网页是否有权操作项目。

**Studio 插件在 Vite 中注册** — `packages/studio/start.ts:146-157`

启动器把项目可读目录和 Studio 插件交给 Vite，没有配置更早的应用级请求鉴权；端口可选，不能据此断言公网监听。

```typescript
  const server = await createServer({
    configFile: false,
    root: here,
    server: {
      port,
      // Vite resolves package assets through pnpm's real paths. The package root
      // must therefore be readable for self-hosted fonts and other declared
      // Studio dependencies, while the author workspace remains separately
      // available for Source and material previews.
      fs: { allow: [workspaceRoot, packageRoot, distributionPackageRoot, here] },
    },
    plugins: [distributionImports, studioLocalizationPlugin(languages), studioFeedbackPlugin(workspaceRoot, runPath), studioPlugin({
```

**自定义路由先处理请求** — `packages/studio/src/server.ts:469-475`

调用者控制的请求进入直接注册的 `configureServer` 中间件；路径解析没有验证 `Host`，匹配的 API 会在 Vite 内部中间件之前结束响应。

```typescript
    configureServer(value) {
      server = value;
      watchSource(options.runPath);
      watchSource(currentSource);
      value.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://studio.hypit.local");
        if (request.method === "PUT" && url.pathname === "/__studio/source") {
```

**会话接口返回项目快照** — `packages/studio/src/server.ts:583-598`

命中 `/__studio/session` 的请求直接得到当前 `snapshot`；成功重绑定后的同源网页可读取其中的版本号及源码。

```typescript
        if (url.pathname === "/__studio/session") {
          void (async () => {
            if (snapshot === undefined && failure === undefined) {
              const attempt = ++requestedRevision;
              await publish(attempt);
            }
            if (failure !== undefined && (snapshot === undefined || failure.revision > snapshot.revision)) {
              json(response, 500, failure);
            } else if (snapshot !== undefined) {
              json(response, 200, snapshot);
            } else {
              json(response, 500, failure);
            }
          })();
          return;
        }
```

**快照包含源文件文本** — `packages/studio/src/session.ts:85-105`

编译后的源文件闭包进入会话快照，提供后续合法路径和当前版本所需的信息。

```typescript
  const text = readFileSync(input.run.authorSource, "utf8");
  const files = sourceFiles(input.run);
  return {
    snapshot: snapshot(input.registry, built, {
      revision: input.revision,
      path: input.sourcePath ?? input.run.authorSource,
      text,
      run: {
        path: relative(input.workspaceRoot, input.run.runPath),
        targets: input.run.targets,
        satisfactions: input.run.run.graph.satisfactions.map((item) => ({
          output: item.output,
          candidate: item.candidate,
        })),
      },
      canvas: built.canvas,
      frameRate: built.frameRate,
      preview: { kind: "hyperframes", srcdoc: rendered },
      workspaceRoot: input.workspaceRoot,
      sourceFiles: files,
      surfaces: input.domain.surfaces,
```

**允许列表内的整文件替换** — `packages/studio/src/server.ts:503-514`

请求提供路径和替换文本，服务端自行读取当前内容作为 `preimage`；现有检查约束文件范围，但不识别网页调用者。

```typescript
              const sourcePath = body.path ?? relative(options.workspaceRoot, currentSource);
              const absolute = resolve(options.workspaceRoot, sourcePath);
              if (isAbsolute(sourcePath) || !allowedSourceFiles.has(absolute)) {
                throw new Error(`Studio cannot write source file ${sourcePath}.`);
              }
              const current = await readFile(absolute, "utf8");
              await applyTransaction([{
                path: sourcePath,
                range: { start: 0, end: current.length },
                replacement: body.text,
                preimage: current,
              }], body.revision);
```

**替换写入磁盘** — `packages/studio/src/source-transaction.ts:27-35`

通过语义与版本检查的内容先写入临时文件，再替换原源码，形成持久修改。

```typescript
    for (const [absolute, text] of files) {
      previous.set(absolute, await operations.read(absolute));
      const temporary = join(dirname(absolute), `.${basename(absolute)}.hypit-studio.tmp`);
      await operations.write(temporary, text);
      temporaries.push({ path: absolute, temporary });
    }
    for (const item of temporaries) {
      await operations.move(item.temporary, item.path);
      applied.push(item.path);
```

#### Validation

完整追踪了先于 Vite 内部中间件的请求入口、快照源码泄露、合法版本/路径取得，以及整文件替换的持久写入。缺失 Host 检查是根因；浏览器可达性是保留前提。

Validation method: static source trace plus primary Vite/Chrome documentation verification

**Studio 插件在 Vite 中注册** — `packages/studio/start.ts:146-157`

启动器把项目可读目录和 Studio 插件交给 Vite，没有配置更早的应用级请求鉴权；端口可选，不能据此断言公网监听。

```typescript
  const server = await createServer({
    configFile: false,
    root: here,
    server: {
      port,
      // Vite resolves package assets through pnpm's real paths. The package root
      // must therefore be readable for self-hosted fonts and other declared
      // Studio dependencies, while the author workspace remains separately
      // available for Source and material previews.
      fs: { allow: [workspaceRoot, packageRoot, distributionPackageRoot, here] },
    },
    plugins: [distributionImports, studioLocalizationPlugin(languages), studioFeedbackPlugin(workspaceRoot, runPath), studioPlugin({
```

**自定义路由先处理请求** — `packages/studio/src/server.ts:469-475`

调用者控制的请求进入直接注册的 `configureServer` 中间件；路径解析没有验证 `Host`，匹配的 API 会在 Vite 内部中间件之前结束响应。

```typescript
    configureServer(value) {
      server = value;
      watchSource(options.runPath);
      watchSource(currentSource);
      value.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://studio.hypit.local");
        if (request.method === "PUT" && url.pathname === "/__studio/source") {
```

**会话接口返回项目快照** — `packages/studio/src/server.ts:583-598`

命中 `/__studio/session` 的请求直接得到当前 `snapshot`；成功重绑定后的同源网页可读取其中的版本号及源码。

```typescript
        if (url.pathname === "/__studio/session") {
          void (async () => {
            if (snapshot === undefined && failure === undefined) {
              const attempt = ++requestedRevision;
              await publish(attempt);
            }
            if (failure !== undefined && (snapshot === undefined || failure.revision > snapshot.revision)) {
              json(response, 500, failure);
            } else if (snapshot !== undefined) {
              json(response, 200, snapshot);
            } else {
              json(response, 500, failure);
            }
          })();
          return;
        }
```

**快照包含源文件文本** — `packages/studio/src/session.ts:85-105`

编译后的源文件闭包进入会话快照，提供后续合法路径和当前版本所需的信息。

```typescript
  const text = readFileSync(input.run.authorSource, "utf8");
  const files = sourceFiles(input.run);
  return {
    snapshot: snapshot(input.registry, built, {
      revision: input.revision,
      path: input.sourcePath ?? input.run.authorSource,
      text,
      run: {
        path: relative(input.workspaceRoot, input.run.runPath),
        targets: input.run.targets,
        satisfactions: input.run.run.graph.satisfactions.map((item) => ({
          output: item.output,
          candidate: item.candidate,
        })),
      },
      canvas: built.canvas,
      frameRate: built.frameRate,
      preview: { kind: "hyperframes", srcdoc: rendered },
      workspaceRoot: input.workspaceRoot,
      sourceFiles: files,
      surfaces: input.domain.surfaces,
```

**允许列表内的整文件替换** — `packages/studio/src/server.ts:503-514`

请求提供路径和替换文本，服务端自行读取当前内容作为 `preimage`；现有检查约束文件范围，但不识别网页调用者。

```typescript
              const sourcePath = body.path ?? relative(options.workspaceRoot, currentSource);
              const absolute = resolve(options.workspaceRoot, sourcePath);
              if (isAbsolute(sourcePath) || !allowedSourceFiles.has(absolute)) {
                throw new Error(`Studio cannot write source file ${sourcePath}.`);
              }
              const current = await readFile(absolute, "utf8");
              await applyTransaction([{
                path: sourcePath,
                range: { start: 0, end: current.length },
                replacement: body.text,
                preimage: current,
              }], body.revision);
```

**替换写入磁盘** — `packages/studio/src/source-transaction.ts:27-35`

通过语义与版本检查的内容先写入临时文件，再替换原源码，形成持久修改。

```typescript
    for (const [absolute, text] of files) {
      previous.set(absolute, await operations.read(absolute));
      const temporary = join(dirname(absolute), `.${basename(absolute)}.hypit-studio.tmp`);
      await operations.write(temporary, text);
      temporaries.push({ path: absolute, temporary });
    }
    for (const item of temporaries) {
      await operations.move(item.temporary, item.path);
      applied.push(item.path);
```

Assertions:
- 匹配 API 的中间件直接结束响应，不继续调用 Vite 的内部处理。
- 快照提供后续写操作所需的源码路径和修订号。
- 源文件允许列表、版本和 preimage 检查有效，未证明越过项目文件范围。
- 官方资料：https://vite.dev/guide/api-plugin.html ；https://developer.chrome.com/release-notes/142 。

Limitations:
- 没有部署 Studio 或执行 DNS 重绑定攻击；未审阅所锁 Vite 版本的安装代码。
- 要求用户访问攻击者控制 DNS 的同端口网页，并且浏览器/网络允许回环访问；Chrome 142 引入本地网络权限，不能断言所有浏览器中静默成功。
- 官方启动器没有 --host 参数，未确认默认 LAN/公网监听。
- 不主张任意文件写入或直接代码执行。

#### Dataflow

攻击者 Host → 早期 Studio 路由 → session 快照 → 合法路径/版本 → source 替换 → 磁盘源码

- **Source:** 攻击者网页控制的 Host 与 API 请求

- **Sink:** 项目快照响应和 `replaceSourceFiles`

- **Outcome:** 读取源码、修改允许列表内的项目文件

**Studio 插件在 Vite 中注册** — `packages/studio/start.ts:146-157`

启动器把项目可读目录和 Studio 插件交给 Vite，没有配置更早的应用级请求鉴权；端口可选，不能据此断言公网监听。

```typescript
  const server = await createServer({
    configFile: false,
    root: here,
    server: {
      port,
      // Vite resolves package assets through pnpm's real paths. The package root
      // must therefore be readable for self-hosted fonts and other declared
      // Studio dependencies, while the author workspace remains separately
      // available for Source and material previews.
      fs: { allow: [workspaceRoot, packageRoot, distributionPackageRoot, here] },
    },
    plugins: [distributionImports, studioLocalizationPlugin(languages), studioFeedbackPlugin(workspaceRoot, runPath), studioPlugin({
```

**自定义路由先处理请求** — `packages/studio/src/server.ts:469-475`

调用者控制的请求进入直接注册的 `configureServer` 中间件；路径解析没有验证 `Host`，匹配的 API 会在 Vite 内部中间件之前结束响应。

```typescript
    configureServer(value) {
      server = value;
      watchSource(options.runPath);
      watchSource(currentSource);
      value.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://studio.hypit.local");
        if (request.method === "PUT" && url.pathname === "/__studio/source") {
```

**会话接口返回项目快照** — `packages/studio/src/server.ts:583-598`

命中 `/__studio/session` 的请求直接得到当前 `snapshot`；成功重绑定后的同源网页可读取其中的版本号及源码。

```typescript
        if (url.pathname === "/__studio/session") {
          void (async () => {
            if (snapshot === undefined && failure === undefined) {
              const attempt = ++requestedRevision;
              await publish(attempt);
            }
            if (failure !== undefined && (snapshot === undefined || failure.revision > snapshot.revision)) {
              json(response, 500, failure);
            } else if (snapshot !== undefined) {
              json(response, 200, snapshot);
            } else {
              json(response, 500, failure);
            }
          })();
          return;
        }
```

**快照包含源文件文本** — `packages/studio/src/session.ts:85-105`

编译后的源文件闭包进入会话快照，提供后续合法路径和当前版本所需的信息。

```typescript
  const text = readFileSync(input.run.authorSource, "utf8");
  const files = sourceFiles(input.run);
  return {
    snapshot: snapshot(input.registry, built, {
      revision: input.revision,
      path: input.sourcePath ?? input.run.authorSource,
      text,
      run: {
        path: relative(input.workspaceRoot, input.run.runPath),
        targets: input.run.targets,
        satisfactions: input.run.run.graph.satisfactions.map((item) => ({
          output: item.output,
          candidate: item.candidate,
        })),
      },
      canvas: built.canvas,
      frameRate: built.frameRate,
      preview: { kind: "hyperframes", srcdoc: rendered },
      workspaceRoot: input.workspaceRoot,
      sourceFiles: files,
      surfaces: input.domain.surfaces,
```

**允许列表内的整文件替换** — `packages/studio/src/server.ts:503-514`

请求提供路径和替换文本，服务端自行读取当前内容作为 `preimage`；现有检查约束文件范围，但不识别网页调用者。

```typescript
              const sourcePath = body.path ?? relative(options.workspaceRoot, currentSource);
              const absolute = resolve(options.workspaceRoot, sourcePath);
              if (isAbsolute(sourcePath) || !allowedSourceFiles.has(absolute)) {
                throw new Error(`Studio cannot write source file ${sourcePath}.`);
              }
              const current = await readFile(absolute, "utf8");
              await applyTransaction([{
                path: sourcePath,
                range: { start: 0, end: current.length },
                replacement: body.text,
                preimage: current,
              }], body.revision);
```

**替换写入磁盘** — `packages/studio/src/source-transaction.ts:27-35`

通过语义与版本检查的内容先写入临时文件，再替换原源码，形成持久修改。

```typescript
    for (const [absolute, text] of files) {
      previous.set(absolute, await operations.read(absolute));
      const temporary = join(dirname(absolute), `.${basename(absolute)}.hypit-studio.tmp`);
      await operations.write(temporary, text);
      temporaries.push({ path: absolute, temporary });
    }
    for (const item of temporaries) {
      await operations.move(item.temporary, item.path);
      applied.push(item.path);
```

#### Reachability

需要正在运行的 Studio、攻击者控制的域名/DNS及同端口网页、受害者访问、允许本地访问的浏览器行为。

- **Attacker:** 外部网页及其 DNS 控制者

- **Entry point:** Studio `/__studio/session` 与 `PUT /__studio/source`

- **Outcome:** 读取源码、修改允许列表内的项目文件

Limitations:
- 没有部署 Studio 或执行 DNS 重绑定攻击；未审阅所锁 Vite 版本的安装代码。
- 要求用户访问攻击者控制 DNS 的同端口网页，并且浏览器/网络允许回环访问；Chrome 142 引入本地网络权限，不能断言所有浏览器中静默成功。
- 官方启动器没有 --host 参数，未确认默认 LAN/公网监听。
- 不主张任意文件写入或直接代码执行。

#### Severity

**Medium** — 中危：成功路径涉及私有源码泄露和项目文件持久修改；但要求运行 Studio、访问同端口的攻击者网页，以及浏览器/网络允许重绑定后的本地访问。未确认公网暴露、任意文件访问或直接代码执行，故下调调查员原始 high 评级。

Additional runtime or deployment evidence could raise or lower this severity.

Impact assessment:
- **Level:** high
- **Why:** 成功后泄露项目源码并持久修改可编辑源文件；影响受现有允许列表限制。

Likelihood assessment:
- **Level:** low
- **Why:** DNS重绑定、本地网络许可及端口条件叠加，没有无条件的远程入口。

#### Remediation

在所有 Studio 插件接口之前统一校验 Host 为实际配置的受信回环主机/端口，或确保处理器处于相应 Vite 保护之后；为项目 API 增加不可预测的会话凭证，并独立校验写请求来源，保留现有路径和修订号保护。

Tests:
- 向会话与写接口发送非允许 Host，断言在读取源码或正文前拒绝。
- 用有效会话凭证验证正常本地预览/编辑仍可工作。
- 覆盖反馈及所有提前结束响应的接口，不能只测试 Vite 静态文件路由。

<a id="finding-2"></a>

### [2] Windows 跨盘导出恶意 S3 结果时可在目标目录外新建文件

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | 已核对 S3 解码、对象读取和本地导出完整链；使用 Node 标准库 win32.resolve/relative 复现当前谓词接受跨盘绝对结果，无文件写入。 |
| Category | path-traversal |
| CWE | CWE-36 |
| Affected lines | packages/cli/src/result-export.ts:35-40 |

#### Summary

用户在 Windows 将恶意 S3 复合结果导出到另一磁盘时，远端资源路径可被解释为绝对本地路径。包含检查未拒绝跨盘 path.relative 的绝对结果，允许在所选导出目录外写入新文件。

#### Root Cause

共享 Result 校验和 S3 `safePath` 均接受盘符加正斜杠的路径。S3 把该字符串作为对象键读取字节；复合导出却保留 `file.path` 并传入本地 `containedPath`。Windows 的 `resolve` 可切换到声明的盘符，跨盘 `relative` 返回绝对路径。当前判断只排除空值和父目录相对路径，没有排除绝对结果，随后 `writeStream` 在目录外创建文件。已有文件因 `wx` 受到保护。

**可移植结果路径未拒绝盘符** — `packages/build-result/src/types.ts:75-81`

结果路径验证拒绝斜杠开头、反斜杠和点段，却接受带 Windows 盘符的正斜杠路径；恶意资源声明可通过共享校验。

```typescript
export function assertBuildResultPath(value: unknown, subject: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/")
    || value.includes("\\") || value.includes("\0")
    || value.split("/").some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new Error(`${subject} is not a Result-relative path`);
  }
}
```

**S3 路径保持盘符字符串** — `packages/build-result-s3/src/repository.ts:65-68`

S3 的 `safePath` 同样未排除 Windows 盘符；存储路径随后成为对象键的一部分。

```typescript
function safePath(path: string): string {
  assert(path.length > 0 && !path.startsWith("/") && !path.includes("\\"), "Build Result path must be relative");
  assert(!path.split("/").some((part) => part.length === 0 || part === "." || part === ".."), `Build Result path ${path} is invalid`);
  return path;
```

**远端复合结果被解码** — `packages/build-result-s3/src/repository.ts:325-337`

选中的复合输出文档从 S3 读回并通过共享解码器，资源绑定由远端文档决定。

```typescript
      if (entry.value.kind === "value") {
        const rawDocument = await this.#readJson(currentBuild, entry.value.path);
        assert(rawDocument !== undefined, `Build ${currentBuild} value ${entry.value.path} is unavailable`);
        const document = decodeBuildResultValueDocument(
          rawDocument,
          `Build ${currentBuild} Output ${currentOutput}`,
        );
        return {
          build: currentBuild,
          output: currentOutput,
          type: entry.type,
          value: { ...entry.value, document },
        };
```

**S3 以字面对象键提供攻击者字节** — `packages/build-result-s3/src/repository.ts:355-367`

`build-file` 通过校验后的路径从配置的桶读取；它在 S3 是键文本，在导出端却被解释为 Windows 本地路径。

```typescript
  async openFile(
    build: string,
    file: BuildResultFileRef,
    range?: BuildResultFileRange,
  ): Promise<AsyncIterable<Uint8Array> | undefined> {
    if (file.kind === "external-file") return await this.#externalFiles.open(file.uri, range);
    if (range !== undefined) {
      assert(Number.isSafeInteger(range.start) && range.start >= 0, "Build Result file range start is invalid");
      assert(Number.isSafeInteger(range.endExclusive) && range.endExclusive > range.start,
        "Build Result file range end is invalid");
      assert(range.endExclusive <= file.size, "Build Result file range exceeds the declared file size");
    }
    return await this.#client.open(this.#key(file.build ?? build, file.path), range);
```

**存储路径被重新解释为本地导出路径** — `packages/cli/src/result-export.ts:90-102`

`exportComposite` 保留 `build-file.path` 并传给 `containedPath`，然后把仓库返回的字节写到该本地路径。

```typescript
    for (const binding of resolvedOutput.value.document.resources) {
      const file = await repository.describeFile(resolvedOutput.build, binding.file);
      const identity = fileReferenceIdentity(resolvedOutput.build, file);
      let local = copied.get(identity);
      if (local === undefined) {
        let path = file.kind === "build-file" ? file.path : `files/file-${copied.size + 1}`;
        const name = basename(path);
        let index = copied.size + 1;
        while (paths.has(path) || path === "value.json") path = `files/import-${index++}/${name}`;
        paths.add(path);
        local = { kind: "build-file", path, size: file.size, mediaType: file.mediaType };
        copied.set(identity, local);
        await writeStream(containedPath(temporary, path), await openResultFile(repository, resolvedOutput.build, file));
```

**跨盘的绝对 relative 结果通过检查** — `packages/cli/src/result-export.ts:35-48`

`relative` 在 Windows 跨盘时可能返回绝对路径；这里仅检查空值和父目录前缀，因此可写到所选目录外。`wx` 阻止覆盖已有文件。

```typescript
function containedPath(root: string, path: string): string {
  const target = resolve(root, path);
  const relation = relative(root, target);
  assert(relation.length > 0 && relation !== ".." && !relation.startsWith(`..${sep}`),
    `Result file ${path} leaves export directory ${root}`);
  return target;
}

async function writeStream(
  path: string,
  input: AsyncIterable<Uint8Array>,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, input, { flag: "wx" });
```

#### Validation

用 D: 导出根和 C:/hypit-audit-placeholder/new-file.txt 输入，win32.relative 返回 C: 绝对路径，当前谓词结果为 true，且 win32.isAbsolute 为 true。该实验未调用仓库代码、未创建目标文件；源码链证明 S3 文档可把该值送入实际导出。

Validation method: static source-to-sink trace plus non-writing Node standard-library Windows path semantics experiment

**可移植结果路径未拒绝盘符** — `packages/build-result/src/types.ts:75-81`

结果路径验证拒绝斜杠开头、反斜杠和点段，却接受带 Windows 盘符的正斜杠路径；恶意资源声明可通过共享校验。

```typescript
export function assertBuildResultPath(value: unknown, subject: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/")
    || value.includes("\\") || value.includes("\0")
    || value.split("/").some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new Error(`${subject} is not a Result-relative path`);
  }
}
```

**S3 路径保持盘符字符串** — `packages/build-result-s3/src/repository.ts:65-68`

S3 的 `safePath` 同样未排除 Windows 盘符；存储路径随后成为对象键的一部分。

```typescript
function safePath(path: string): string {
  assert(path.length > 0 && !path.startsWith("/") && !path.includes("\\"), "Build Result path must be relative");
  assert(!path.split("/").some((part) => part.length === 0 || part === "." || part === ".."), `Build Result path ${path} is invalid`);
  return path;
```

**远端复合结果被解码** — `packages/build-result-s3/src/repository.ts:325-337`

选中的复合输出文档从 S3 读回并通过共享解码器，资源绑定由远端文档决定。

```typescript
      if (entry.value.kind === "value") {
        const rawDocument = await this.#readJson(currentBuild, entry.value.path);
        assert(rawDocument !== undefined, `Build ${currentBuild} value ${entry.value.path} is unavailable`);
        const document = decodeBuildResultValueDocument(
          rawDocument,
          `Build ${currentBuild} Output ${currentOutput}`,
        );
        return {
          build: currentBuild,
          output: currentOutput,
          type: entry.type,
          value: { ...entry.value, document },
        };
```

**S3 以字面对象键提供攻击者字节** — `packages/build-result-s3/src/repository.ts:355-367`

`build-file` 通过校验后的路径从配置的桶读取；它在 S3 是键文本，在导出端却被解释为 Windows 本地路径。

```typescript
  async openFile(
    build: string,
    file: BuildResultFileRef,
    range?: BuildResultFileRange,
  ): Promise<AsyncIterable<Uint8Array> | undefined> {
    if (file.kind === "external-file") return await this.#externalFiles.open(file.uri, range);
    if (range !== undefined) {
      assert(Number.isSafeInteger(range.start) && range.start >= 0, "Build Result file range start is invalid");
      assert(Number.isSafeInteger(range.endExclusive) && range.endExclusive > range.start,
        "Build Result file range end is invalid");
      assert(range.endExclusive <= file.size, "Build Result file range exceeds the declared file size");
    }
    return await this.#client.open(this.#key(file.build ?? build, file.path), range);
```

**存储路径被重新解释为本地导出路径** — `packages/cli/src/result-export.ts:90-102`

`exportComposite` 保留 `build-file.path` 并传给 `containedPath`，然后把仓库返回的字节写到该本地路径。

```typescript
    for (const binding of resolvedOutput.value.document.resources) {
      const file = await repository.describeFile(resolvedOutput.build, binding.file);
      const identity = fileReferenceIdentity(resolvedOutput.build, file);
      let local = copied.get(identity);
      if (local === undefined) {
        let path = file.kind === "build-file" ? file.path : `files/file-${copied.size + 1}`;
        const name = basename(path);
        let index = copied.size + 1;
        while (paths.has(path) || path === "value.json") path = `files/import-${index++}/${name}`;
        paths.add(path);
        local = { kind: "build-file", path, size: file.size, mediaType: file.mediaType };
        copied.set(identity, local);
        await writeStream(containedPath(temporary, path), await openResultFile(repository, resolvedOutput.build, file));
```

**跨盘的绝对 relative 结果通过检查** — `packages/cli/src/result-export.ts:35-48`

`relative` 在 Windows 跨盘时可能返回绝对路径；这里仅检查空值和父目录前缀，因此可写到所选目录外。`wx` 阻止覆盖已有文件。

```typescript
function containedPath(root: string, path: string): string {
  const target = resolve(root, path);
  const relation = relative(root, target);
  assert(relation.length > 0 && relation !== ".." && !relation.startsWith(`..${sep}`),
    `Result file ${path} leaves export directory ${root}`);
  return target;
}

async function writeStream(
  path: string,
  input: AsyncIterable<Uint8Array>,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, input, { flag: "wx" });
```

Assertions:
- 共享与 S3 校验没有拒绝 Windows 盘符格式。
- 导出保留 build-file 的存储路径。
- 标准库实验：acceptedByCurrentPredicate=true，inputIsAbsolute=true，relativeResultIsAbsolute=true。
- POSIX 以及同盘常见逃逸受不同语义/既有检查约束；FS 适配器另有绝对路径检查。

Limitations:
- 未在 Windows 运行应用或执行真实导出。
- 要求攻击者可修改所选 S3 Result 的复合文档与对应对象。
- 导出临时根与攻击者目标必须在不同 Windows 磁盘。
- 目标必须为当前用户可写且不存在的文件；未证明覆盖或自动执行。

#### Dataflow

S3 复合资源 path → 合法字面对象键 → 保留 file.path → Windows resolve/relative → 目录外 writeFile(wx)

- **Source:** 攻击者可写 S3 Result 的 build-file 路径与字节

- **Sink:** `writeStream` 的本地文件创建

- **Outcome:** 在导出目录外、当前用户可写位置创建新文件

**可移植结果路径未拒绝盘符** — `packages/build-result/src/types.ts:75-81`

结果路径验证拒绝斜杠开头、反斜杠和点段，却接受带 Windows 盘符的正斜杠路径；恶意资源声明可通过共享校验。

```typescript
export function assertBuildResultPath(value: unknown, subject: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/")
    || value.includes("\\") || value.includes("\0")
    || value.split("/").some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new Error(`${subject} is not a Result-relative path`);
  }
}
```

**S3 路径保持盘符字符串** — `packages/build-result-s3/src/repository.ts:65-68`

S3 的 `safePath` 同样未排除 Windows 盘符；存储路径随后成为对象键的一部分。

```typescript
function safePath(path: string): string {
  assert(path.length > 0 && !path.startsWith("/") && !path.includes("\\"), "Build Result path must be relative");
  assert(!path.split("/").some((part) => part.length === 0 || part === "." || part === ".."), `Build Result path ${path} is invalid`);
  return path;
```

**远端复合结果被解码** — `packages/build-result-s3/src/repository.ts:325-337`

选中的复合输出文档从 S3 读回并通过共享解码器，资源绑定由远端文档决定。

```typescript
      if (entry.value.kind === "value") {
        const rawDocument = await this.#readJson(currentBuild, entry.value.path);
        assert(rawDocument !== undefined, `Build ${currentBuild} value ${entry.value.path} is unavailable`);
        const document = decodeBuildResultValueDocument(
          rawDocument,
          `Build ${currentBuild} Output ${currentOutput}`,
        );
        return {
          build: currentBuild,
          output: currentOutput,
          type: entry.type,
          value: { ...entry.value, document },
        };
```

**S3 以字面对象键提供攻击者字节** — `packages/build-result-s3/src/repository.ts:355-367`

`build-file` 通过校验后的路径从配置的桶读取；它在 S3 是键文本，在导出端却被解释为 Windows 本地路径。

```typescript
  async openFile(
    build: string,
    file: BuildResultFileRef,
    range?: BuildResultFileRange,
  ): Promise<AsyncIterable<Uint8Array> | undefined> {
    if (file.kind === "external-file") return await this.#externalFiles.open(file.uri, range);
    if (range !== undefined) {
      assert(Number.isSafeInteger(range.start) && range.start >= 0, "Build Result file range start is invalid");
      assert(Number.isSafeInteger(range.endExclusive) && range.endExclusive > range.start,
        "Build Result file range end is invalid");
      assert(range.endExclusive <= file.size, "Build Result file range exceeds the declared file size");
    }
    return await this.#client.open(this.#key(file.build ?? build, file.path), range);
```

**存储路径被重新解释为本地导出路径** — `packages/cli/src/result-export.ts:90-102`

`exportComposite` 保留 `build-file.path` 并传给 `containedPath`，然后把仓库返回的字节写到该本地路径。

```typescript
    for (const binding of resolvedOutput.value.document.resources) {
      const file = await repository.describeFile(resolvedOutput.build, binding.file);
      const identity = fileReferenceIdentity(resolvedOutput.build, file);
      let local = copied.get(identity);
      if (local === undefined) {
        let path = file.kind === "build-file" ? file.path : `files/file-${copied.size + 1}`;
        const name = basename(path);
        let index = copied.size + 1;
        while (paths.has(path) || path === "value.json") path = `files/import-${index++}/${name}`;
        paths.add(path);
        local = { kind: "build-file", path, size: file.size, mediaType: file.mediaType };
        copied.set(identity, local);
        await writeStream(containedPath(temporary, path), await openResultFile(repository, resolvedOutput.build, file));
```

**跨盘的绝对 relative 结果通过检查** — `packages/cli/src/result-export.ts:35-48`

`relative` 在 Windows 跨盘时可能返回绝对路径；这里仅检查空值和父目录前缀，因此可写到所选目录外。`wx` 阻止覆盖已有文件。

```typescript
function containedPath(root: string, path: string): string {
  const target = resolve(root, path);
  const relation = relative(root, target);
  assert(relation.length > 0 && relation !== ".." && !relation.startsWith(`..${sep}`),
    `Result file ${path} leaves export directory ${root}`);
  return target;
}

async function writeStream(
  path: string,
  input: AsyncIterable<Uint8Array>,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, input, { flag: "wx" });
```

#### Reachability

需要恶意远端结果被用户选中导出、Windows 路径语义及跨盘目标。

- **Attacker:** 较低信任的 S3 结果生产者/对象写入者

- **Entry point:** 复合结果导出 `get ... --to`

- **Outcome:** 在导出目录外、当前用户可写位置创建新文件

Limitations:
- 未在 Windows 运行应用或执行真实导出。
- 要求攻击者可修改所选 S3 Result 的复合文档与对应对象。
- 导出临时根与攻击者目标必须在不同 Windows 磁盘。
- 目标必须为当前用户可写且不存在的文件；未证明覆盖或自动执行。

#### Severity

**Medium** — 中危：违反导出目录边界，可在当前用户可写位置创建攻击者选择的新文件；需恶意 S3 结果、Windows 和不同磁盘。wx 阻止覆盖已有文件，未把可能的后续执行认定为已复现。

Additional runtime or deployment evidence could raise or lower this severity.

Impact assessment:
- **Level:** high
- **Why:** 目录外攻击者内容的新文件创建；若用户或系统随后执行该文件，可能产生更高影响，但本次未验证。

Likelihood assessment:
- **Level:** low
- **Why:** 三项关键前提及目标不存在/可写限制使常规自用风险较低。

#### Remediation

在可移植 Result 校验中拒绝 Windows 盘符限定路径，并在导出端同时拒绝绝对输入和绝对 relative 结果；优先生成导出目录内的文件名，避免把存储键作为本地路径。

Tests:
- 用 win32 路径实现测试 D: 根与 C:/... 输入，断言拒绝。
- 跨平台拒绝 drive-qualified、UNC、父目录与其他绝对路径，同时允许正常资源子路径。
- 合成 S3 复合导出确认所有新建文件都位于选定目标内，且已有文件不被覆盖。

<a id="finding-3"></a>

### [3] Studio 接受跨站简单 POST，可被写入伪造评论

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | 两个 POST 入口都无来源/令牌/内容类型检查，评论追加不需旧值或修订号；源码修改的额外检查与浏览器前提已单列。 |
| Category | csrf |
| CWE | CWE-352 |
| Affected lines | packages/studio/src/feedback-server.ts:34-40 |

#### Summary

在浏览器允许访问本地 Studio 的条件下，恶意网页可用 text/plain 正文提交 JSON，向已知 Run 写入伪造评论。接口不验证 Origin 或会话令牌；知道有效实体与当前修订号时，同类源码 mutation 也受影响。

#### Root Cause

反馈 POST 不检查 `Origin`、会话令牌或 `Content-Type`，直接缓冲正文并 `JSON.parse`。因此 JSON 格式并不强制 CORS 预检：正文可由浏览器简单请求的 `text/plain` 携带。`run` 检查只限制评论所属 Run；新增操作只需唯一 ID，随后替换 `FEEDBACK.json`。同类 `/__studio/mutation` 入口也没有来源保护，但仍要求有效版本、实体和可写参数。

**POST 不检查浏览器来源** — `packages/studio/src/feedback-server.ts:34-40`

来自调用者的正文在未检查 `Origin`、令牌或 `Content-Type` 时被解析为 JSON；`run` 匹配仅约束评论所属项目。

```typescript
            if (request.method !== "POST") { response.statusCode = 405; response.end(); return; }
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.from(chunk));
            const mutation = readFeedbackMutation(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            const comment = mutation.type === "delete" ? mutation.before : mutation.comment;
            if (comment.run !== run) throw new Error("The comment belongs to another Run.");
            const result = view(await store.mutate(mutation));
```

**新增评论无需旧值** — `packages/studio/src/feedback-store.ts:24-30`

攻击者选择唯一评论 ID 即可进入追加路径，无须旧评论或源码修订号。

```typescript
  const apply = async (mutation: FeedbackMutation): Promise<FeedbackDocument> => {
    const previous = await readText();
    const document = decode(previous);
    const comments = [...document.comments];
    if (mutation.type === "add") {
      if (comments.some((comment) => comment.id === mutation.comment.id)) throw new FeedbackConflict("This comment already exists.");
      comments.push(mutation.comment);
```

**评论持久保存** — `packages/studio/src/feedback-store.ts:44-49`

由请求追加的评论被写到临时文件并替换项目 `FEEDBACK.json`；并发旧值检查不会认证请求来源。

```typescript
    const next = { ...document, comments };
    const temporary = join(workspaceRoot, `.FEEDBACK.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      if (await readText() !== previous) throw new FeedbackConflict("FEEDBACK.json changed while saving. Your draft is kept; please try again.");
      await rename(temporary, path);
```

**同类来源缺失也存在于源码 mutation** — `packages/studio/src/server.ts:548-570`

该 POST 接口也直接解析正文；若调用者另外掌握有效实体与版本，可继续触发已有源码修改流程。

```typescript
        if (request.method === "POST" && url.pathname === "/__studio/mutation") {
          void (async () => {
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of request) chunks.push(Buffer.from(chunk));
              const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Partial<StudioMutation>;
              if ((body.type !== "timeline.adjust" && body.type !== "parameter.adjust")
                || typeof body.revision !== "number"
                || typeof body.entityId !== "string") {
                json(response, 400, { error: "Expected a Studio author mutation." });
                return;
              }
              if (body.type === "timeline.adjust"
                && (typeof body.gesture !== "string" || typeof body.target !== "object" || body.target === null)) {
                json(response, 400, { error: "Expected a timeline gesture and target." });
                return;
              }
              if (body.type === "parameter.adjust"
                && (typeof body.parameterId !== "string" || body.value === undefined)) {
                json(response, 400, { error: "Expected a parameter identity and value." });
                return;
              }
              const committed = await commitMutation(body as StudioMutation);
```

#### Validation

将浏览器可发送的简单 POST 类型与服务器无条件 JSON 解析对照，追踪至评论追加和文件替换。无需读取跨源响应就能产生持久变化；未把普通 POST 误作 PUT 源码替换。

Validation method: static source-to-sink trace

**POST 不检查浏览器来源** — `packages/studio/src/feedback-server.ts:34-40`

来自调用者的正文在未检查 `Origin`、令牌或 `Content-Type` 时被解析为 JSON；`run` 匹配仅约束评论所属项目。

```typescript
            if (request.method !== "POST") { response.statusCode = 405; response.end(); return; }
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.from(chunk));
            const mutation = readFeedbackMutation(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            const comment = mutation.type === "delete" ? mutation.before : mutation.comment;
            if (comment.run !== run) throw new Error("The comment belongs to another Run.");
            const result = view(await store.mutate(mutation));
```

**新增评论无需旧值** — `packages/studio/src/feedback-store.ts:24-30`

攻击者选择唯一评论 ID 即可进入追加路径，无须旧评论或源码修订号。

```typescript
  const apply = async (mutation: FeedbackMutation): Promise<FeedbackDocument> => {
    const previous = await readText();
    const document = decode(previous);
    const comments = [...document.comments];
    if (mutation.type === "add") {
      if (comments.some((comment) => comment.id === mutation.comment.id)) throw new FeedbackConflict("This comment already exists.");
      comments.push(mutation.comment);
```

**评论持久保存** — `packages/studio/src/feedback-store.ts:44-49`

由请求追加的评论被写到临时文件并替换项目 `FEEDBACK.json`；并发旧值检查不会认证请求来源。

```typescript
    const next = { ...document, comments };
    const temporary = join(workspaceRoot, `.FEEDBACK.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      if (await readText() !== previous) throw new FeedbackConflict("FEEDBACK.json changed while saving. Your draft is kept; please try again.");
      await rename(temporary, path);
```

**同类来源缺失也存在于源码 mutation** — `packages/studio/src/server.ts:548-570`

该 POST 接口也直接解析正文；若调用者另外掌握有效实体与版本，可继续触发已有源码修改流程。

```typescript
        if (request.method === "POST" && url.pathname === "/__studio/mutation") {
          void (async () => {
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of request) chunks.push(Buffer.from(chunk));
              const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Partial<StudioMutation>;
              if ((body.type !== "timeline.adjust" && body.type !== "parameter.adjust")
                || typeof body.revision !== "number"
                || typeof body.entityId !== "string") {
                json(response, 400, { error: "Expected a Studio author mutation." });
                return;
              }
              if (body.type === "timeline.adjust"
                && (typeof body.gesture !== "string" || typeof body.target !== "object" || body.target === null)) {
                json(response, 400, { error: "Expected a timeline gesture and target." });
                return;
              }
              if (body.type === "parameter.adjust"
                && (typeof body.parameterId !== "string" || body.value === undefined)) {
                json(response, 400, { error: "Expected a parameter identity and value." });
                return;
              }
              const committed = await commitMutation(body as StudioMutation);
```

Assertions:
- `text/plain` JSON 正文被与 application/json 相同地解析。
- 评论追加只需符合字段形状、唯一 ID 和匹配的 Run。
- UI 使用 textContent，未把评论内容认定为 XSS。
- 仅修复 Host 仍会接受发往正常 localhost Host 的跨站 POST。

Limitations:
- 未做浏览器或实际写文件复现。
- 本地网络权限、混合内容等浏览器规则可能阻止或要求许可。
- 需要知道或猜中 Run 相对路径；源码 mutation 还需要有效的当前修订号与实体标识。
- 反馈替换/删除有旧值比较，源码编辑保留语义及路径检查。

#### Dataflow

跨站 text/plain POST → JSON 解析 → Run 匹配 → 评论追加 → FEEDBACK.json

- **Source:** 外部网页的请求正文

- **Sink:** `feedbackStore.mutate` 与 `FEEDBACK.json`

- **Outcome:** 伪造持久评论；满足更多状态条件时可修改部分源码绑定

**POST 不检查浏览器来源** — `packages/studio/src/feedback-server.ts:34-40`

来自调用者的正文在未检查 `Origin`、令牌或 `Content-Type` 时被解析为 JSON；`run` 匹配仅约束评论所属项目。

```typescript
            if (request.method !== "POST") { response.statusCode = 405; response.end(); return; }
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.from(chunk));
            const mutation = readFeedbackMutation(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            const comment = mutation.type === "delete" ? mutation.before : mutation.comment;
            if (comment.run !== run) throw new Error("The comment belongs to another Run.");
            const result = view(await store.mutate(mutation));
```

**新增评论无需旧值** — `packages/studio/src/feedback-store.ts:24-30`

攻击者选择唯一评论 ID 即可进入追加路径，无须旧评论或源码修订号。

```typescript
  const apply = async (mutation: FeedbackMutation): Promise<FeedbackDocument> => {
    const previous = await readText();
    const document = decode(previous);
    const comments = [...document.comments];
    if (mutation.type === "add") {
      if (comments.some((comment) => comment.id === mutation.comment.id)) throw new FeedbackConflict("This comment already exists.");
      comments.push(mutation.comment);
```

**评论持久保存** — `packages/studio/src/feedback-store.ts:44-49`

由请求追加的评论被写到临时文件并替换项目 `FEEDBACK.json`；并发旧值检查不会认证请求来源。

```typescript
    const next = { ...document, comments };
    const temporary = join(workspaceRoot, `.FEEDBACK.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      if (await readText() !== previous) throw new FeedbackConflict("FEEDBACK.json changed while saving. Your draft is kept; please try again.");
      await rename(temporary, path);
```

**同类来源缺失也存在于源码 mutation** — `packages/studio/src/server.ts:548-570`

该 POST 接口也直接解析正文；若调用者另外掌握有效实体与版本，可继续触发已有源码修改流程。

```typescript
        if (request.method === "POST" && url.pathname === "/__studio/mutation") {
          void (async () => {
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of request) chunks.push(Buffer.from(chunk));
              const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Partial<StudioMutation>;
              if ((body.type !== "timeline.adjust" && body.type !== "parameter.adjust")
                || typeof body.revision !== "number"
                || typeof body.entityId !== "string") {
                json(response, 400, { error: "Expected a Studio author mutation." });
                return;
              }
              if (body.type === "timeline.adjust"
                && (typeof body.gesture !== "string" || typeof body.target !== "object" || body.target === null)) {
                json(response, 400, { error: "Expected a timeline gesture and target." });
                return;
              }
              if (body.type === "parameter.adjust"
                && (typeof body.parameterId !== "string" || body.value === undefined)) {
                json(response, 400, { error: "Expected a parameter identity and value." });
                return;
              }
              const committed = await commitMutation(body as StudioMutation);
```

#### Reachability

需要运行 Studio、浏览器允许请求及已知所选 Run；不需要跨源读取响应。

- **Attacker:** 用户访问的第三方网页

- **Entry point:** Studio feedback POST，及条件更严格的 `/__studio/mutation`

- **Outcome:** 伪造持久评论；满足更多状态条件时可修改部分源码绑定

Limitations:
- 未做浏览器或实际写文件复现。
- 本地网络权限、混合内容等浏览器规则可能阻止或要求许可。
- 需要知道或猜中 Run 相对路径；源码 mutation 还需要有效的当前修订号与实体标识。
- 反馈替换/删除有旧值比较，源码编辑保留语义及路径检查。

#### Severity

**Low** — 低危：无需读响应的明确影响是持久评论污染，但要求知道所选 Run 且浏览器允许回环请求。源码修改还需要有效实体和修订号。保留原始 medium 建议并按最小已证明影响下调；若实测暴露更广或实体可稳定取得应重评。

Additional runtime or deployment evidence could raise or lower this severity.

Impact assessment:
- **Level:** low
- **Why:** 最低可证实结果是项目反馈污染；其他写入需要额外有效状态。

Likelihood assessment:
- **Level:** low
- **Why:** 本地访问和 Run 知识限制常规攻击；没有默认无条件的远程效果。

#### Remediation

在读取正文前统一要求可信 Origin 和不可预测的会话 CSRF 令牌；为反馈、源码 mutation、整文件替换和元数据写入采用同一规则。额外拒绝跨站 Fetch Metadata 和非 application/json 内容类型。

Tests:
- 从非可信 Origin 提交 text/plain JSON，断言不新增评论且文件不变。
- 缺失或错误令牌的写请求失败。
- 正常带凭证编辑成功；错误版本和旧值仍被拒绝。

<a id="finding-4"></a>

### [4] macOS 保存凭据时将完整秘密放入进程参数

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | 登录入口、Runtime 转发和 OS 写入实现形成完整静态链，明确显示 secret 被传入 argv；没有使用真实凭据测试。 |
| Category | credential-exposure |
| CWE | CWE-214 |
| Affected lines | packages/credential-store-os/src/store.ts:39-40 |

#### Summary

macOS 登录或刷新保存凭据时，系统存储后端把完整 API Key 或 OAuth 密钥封装作为 /usr/bin/security 的命令行参数。能观察该短命进程参数的本地进程或采集系统可能取得明文。

#### Root Cause

登录流程将获取的完整秘密交给 `putCredential`，Runtime 将其作为 `secret` 原样传入所选凭据存储。macOS 后端最终在 `execFile('/usr/bin/security', ...)` 的参数列表里把该值放在 `-w` 后面。Keychain 的静态存储保护不能消除启动子进程时的明文参数。`shell:false` 和错误脱敏分别处理 shell 解释和日志，均没有移除这个通道。

**登录获取的秘密交给凭据控制器** — `packages/cli/src/commands/environment.ts:386-403`

交互登录、OAuth 或输入文件产生的完整秘密被传给 `putCredential`，随后进入配置的系统存储。

```typescript
          throw new Error(`${item.label} cannot be written by this command; ${source}`);
        }
        const raw = item.acquisition !== undefined && args.credentialFile === undefined
          ? await acquireOAuthCredential(item.acquisition, {
            ...(reportCredentialProgress === undefined ? {} : {
              onProgress: (message) => reportCredentialProgress(`  · ${message}\n`),
            }),
          })
          : args.credentialFile === undefined
            ? await io.readSecret?.(`${item.label}: `)
            : await readFile(args.credentialFile, "utf8");
        if (raw === undefined) throw new Error("interactive credential input is unavailable; use --from <file>");
        const secret = raw.trim();
        if (secret.length === 0) throw new Error("credential input is empty");
        if (item.kind === "json") {
          try { JSON.parse(secret); } catch { throw new Error(`${item.label} is not valid JSON`); }
        }
        const stored = await credentialsControl.putCredential(item.endpoint, item.slot, secret);
```

**Runtime 原样传递秘密** — `packages/runtime-local/src/credentials.ts:42-47`

凭据控制器把完整 `secret` 放入存储值，未改变后端的传递方式。

```typescript
    async putCredential(endpoint, slot, secret) {
      assert(secret.length > 0, "credential secret is empty");
      const item = credential(endpoint, slot);
      const store = await writableCredentialStore(options.credentialStore, item.ref);
      assert(store !== undefined, `CredentialStore ${item.ref.store} is not writable`);
      await store.put(item.ref, { secret });
```

**系统存储调用写入后端** — `packages/credential-store-os/src/store.ts:185-190`

macOS 选择的写入函数收到完整 `value.secret`，即将通过子进程参数传递。

```typescript
    verifyCredentialRef(ref);
    if (!this.owns(ref)) throw new Error(`OS CredentialStore does not own ${ref.store}`);
    if (value.secret.length === 0) throw new Error("credential secret is empty");
    await this.#write(this.#service, ref.key, value.secret);
  }

```

**秘密进入 security 的命令参数** — `packages/credential-store-os/src/store.ts:34-45`

`execFile` 将完整秘密放在 `-w` 后的参数中；`shell:false` 防止 shell 解释，却不移除进程参数的明文观察窗口。

```typescript
function macosWriter(service: string): OsCredentialWriter {
  return async (_service, account, secret) => await new Promise((resolve, reject) => {
    // macOS security(1) requires the password as the argument to -w; it does
    // not read an omitted -w value from stdin. execFile keeps shell expansion
    // out of the path and the callback never includes the secret in errors.
    execFile("/usr/bin/security", [
      "add-generic-password", "-U", "-s", service, "-a", account, "-w", secret,
    ], {
      timeout: 10_000, shell: false, windowsHide: true,
    }, (error) => {
      if (error === null) resolve();
      else reject(new Error(`OS credential write for ${account} failed`));
```

#### Validation

追踪完整秘密从 CLI 到系统后端，确认落在子进程 argv，而非私有标准输入或原生 API。Windows 后端使用 stdin，未扩大到其他平台。

Validation method: static source-to-sink trace

**登录获取的秘密交给凭据控制器** — `packages/cli/src/commands/environment.ts:386-403`

交互登录、OAuth 或输入文件产生的完整秘密被传给 `putCredential`，随后进入配置的系统存储。

```typescript
          throw new Error(`${item.label} cannot be written by this command; ${source}`);
        }
        const raw = item.acquisition !== undefined && args.credentialFile === undefined
          ? await acquireOAuthCredential(item.acquisition, {
            ...(reportCredentialProgress === undefined ? {} : {
              onProgress: (message) => reportCredentialProgress(`  · ${message}\n`),
            }),
          })
          : args.credentialFile === undefined
            ? await io.readSecret?.(`${item.label}: `)
            : await readFile(args.credentialFile, "utf8");
        if (raw === undefined) throw new Error("interactive credential input is unavailable; use --from <file>");
        const secret = raw.trim();
        if (secret.length === 0) throw new Error("credential input is empty");
        if (item.kind === "json") {
          try { JSON.parse(secret); } catch { throw new Error(`${item.label} is not valid JSON`); }
        }
        const stored = await credentialsControl.putCredential(item.endpoint, item.slot, secret);
```

**Runtime 原样传递秘密** — `packages/runtime-local/src/credentials.ts:42-47`

凭据控制器把完整 `secret` 放入存储值，未改变后端的传递方式。

```typescript
    async putCredential(endpoint, slot, secret) {
      assert(secret.length > 0, "credential secret is empty");
      const item = credential(endpoint, slot);
      const store = await writableCredentialStore(options.credentialStore, item.ref);
      assert(store !== undefined, `CredentialStore ${item.ref.store} is not writable`);
      await store.put(item.ref, { secret });
```

**系统存储调用写入后端** — `packages/credential-store-os/src/store.ts:185-190`

macOS 选择的写入函数收到完整 `value.secret`，即将通过子进程参数传递。

```typescript
    verifyCredentialRef(ref);
    if (!this.owns(ref)) throw new Error(`OS CredentialStore does not own ${ref.store}`);
    if (value.secret.length === 0) throw new Error("credential secret is empty");
    await this.#write(this.#service, ref.key, value.secret);
  }

```

**秘密进入 security 的命令参数** — `packages/credential-store-os/src/store.ts:34-45`

`execFile` 将完整秘密放在 `-w` 后的参数中；`shell:false` 防止 shell 解释，却不移除进程参数的明文观察窗口。

```typescript
function macosWriter(service: string): OsCredentialWriter {
  return async (_service, account, secret) => await new Promise((resolve, reject) => {
    // macOS security(1) requires the password as the argument to -w; it does
    // not read an omitted -w value from stdin. execFile keeps shell expansion
    // out of the path and the callback never includes the secret in errors.
    execFile("/usr/bin/security", [
      "add-generic-password", "-U", "-s", service, "-a", account, "-w", secret,
    ], {
      timeout: 10_000, shell: false, windowsHide: true,
    }, (error) => {
      if (error === null) resolve();
      else reject(new Error(`OS credential write for ${account} failed`));
```

Assertions:
- `OsCredentialStore.put` 把 `value.secret` 交给 macOS writer。
- writer 的 `-w` 后为完整 secret。
- OAuth 保存内容可能包含 access/refresh 信息；无真实账户数据被读取。

Limitations:
- 未运行 security 命令，未读取真实 API Key/OAuth 凭据。
- 未测试其他 UID 的 macOS 进程可见性；观察者必须具有足够权限。
- 只在保存/刷新时存在短暂窗口，不声称 Keychain 静态存储失效。

#### Dataflow

登录秘密 → putCredential → OsCredentialStore.put → macosWriter → execFile argv

- **Source:** 用户 API Key 或 OAuth 秘密封装

- **Sink:** `/usr/bin/security` 进程 argv

- **Outcome:** 具备观察权限的一方可获取明文凭据

**登录获取的秘密交给凭据控制器** — `packages/cli/src/commands/environment.ts:386-403`

交互登录、OAuth 或输入文件产生的完整秘密被传给 `putCredential`，随后进入配置的系统存储。

```typescript
          throw new Error(`${item.label} cannot be written by this command; ${source}`);
        }
        const raw = item.acquisition !== undefined && args.credentialFile === undefined
          ? await acquireOAuthCredential(item.acquisition, {
            ...(reportCredentialProgress === undefined ? {} : {
              onProgress: (message) => reportCredentialProgress(`  · ${message}\n`),
            }),
          })
          : args.credentialFile === undefined
            ? await io.readSecret?.(`${item.label}: `)
            : await readFile(args.credentialFile, "utf8");
        if (raw === undefined) throw new Error("interactive credential input is unavailable; use --from <file>");
        const secret = raw.trim();
        if (secret.length === 0) throw new Error("credential input is empty");
        if (item.kind === "json") {
          try { JSON.parse(secret); } catch { throw new Error(`${item.label} is not valid JSON`); }
        }
        const stored = await credentialsControl.putCredential(item.endpoint, item.slot, secret);
```

**Runtime 原样传递秘密** — `packages/runtime-local/src/credentials.ts:42-47`

凭据控制器把完整 `secret` 放入存储值，未改变后端的传递方式。

```typescript
    async putCredential(endpoint, slot, secret) {
      assert(secret.length > 0, "credential secret is empty");
      const item = credential(endpoint, slot);
      const store = await writableCredentialStore(options.credentialStore, item.ref);
      assert(store !== undefined, `CredentialStore ${item.ref.store} is not writable`);
      await store.put(item.ref, { secret });
```

**系统存储调用写入后端** — `packages/credential-store-os/src/store.ts:185-190`

macOS 选择的写入函数收到完整 `value.secret`，即将通过子进程参数传递。

```typescript
    verifyCredentialRef(ref);
    if (!this.owns(ref)) throw new Error(`OS CredentialStore does not own ${ref.store}`);
    if (value.secret.length === 0) throw new Error("credential secret is empty");
    await this.#write(this.#service, ref.key, value.secret);
  }

```

**秘密进入 security 的命令参数** — `packages/credential-store-os/src/store.ts:34-45`

`execFile` 将完整秘密放在 `-w` 后的参数中；`shell:false` 防止 shell 解释，却不移除进程参数的明文观察窗口。

```typescript
function macosWriter(service: string): OsCredentialWriter {
  return async (_service, account, secret) => await new Promise((resolve, reject) => {
    // macOS security(1) requires the password as the argument to -w; it does
    // not read an omitted -w value from stdin. execFile keeps shell expansion
    // out of the path and the callback never includes the secret in errors.
    execFile("/usr/bin/security", [
      "add-generic-password", "-U", "-s", service, "-a", account, "-w", secret,
    ], {
      timeout: 10_000, shell: false, windowsHide: true,
    }, (error) => {
      if (error === null) resolve();
      else reject(new Error(`OS credential write for ${account} failed`));
```

#### Reachability

需要同机观察权限及保存/刷新同时发生；不是远程接口。

- **Attacker:** 可观察进程参数的本地进程或遥测采集系统

- **Entry point:** macOS 凭据保存与刷新

- **Outcome:** 具备观察权限的一方可获取明文凭据

Limitations:
- 未运行 security 命令，未读取真实 API Key/OAuth 凭据。
- 未测试其他 UID 的 macOS 进程可见性；观察者必须具有足够权限。
- 只在保存/刷新时存在短暂窗口，不声称 Keychain 静态存储失效。

#### Severity

**Low** — 低危：秘密影响可大，但需要本地进程观察权限和命中短暂保存/刷新窗口；未证明任意其他 OS 用户都可读取。

Additional runtime or deployment evidence could raise or lower this severity.

Impact assessment:
- **Level:** high
- **Why:** 若成功取得有效账户密钥，可用其既有权限访问服务。

Likelihood assessment:
- **Level:** low
- **Why:** 本地权限和短暂窗口限制可利用性。

#### Remediation

使用原生 macOS Security.framework 绑定写入 Keychain，或使用通过私有管道/标准输入接收秘密的辅助程序；任何凭据值都不得出现在 argv。

Tests:
- 以合成秘密替身调用存储后端，断言所有子进程 argv 中都不存在该值。
- 验证原生存储仍支持保存、更新和读取，并维持错误脱敏。

<a id="finding-5"></a>

### [5] 导出低信任 S3 结果可能把消费端本地文件复制进结果包

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | medium |
| Confidence rationale | 完整源代码链证明 URI 会进入本地 stat/read 并被导出；但实际安全边界依赖部署是否接受低信任结果，未在真实共享存储中验证。 |
| Category | external-file-control |
| CWE | CWE-73 |
| Affected lines | packages/build-result-s3/src/repository.ts:149 |

#### Summary

S3 结果可声明 external-file URI，适配器默认使用本机文件解析器。若远端结果写入者比本地用户信任级别低，导出恶意复合结果可能把本机可读文件复制到结果包；继续共享该包才会使远端攻击者得到文件。

#### Root Cause

共享 Result 解码允许语法有效的 `external-file` URI。S3 适配器未指定解析器时默认选择 `localExternalFiles`，资源描述和打开都会传入远端声明的 URI。本地解析器直接执行 `fileURLToPath`、`stat` 和 `createReadStream`，没有本机允许根目录或来源授权。复合导出随后把这些本地字节复制到生成的 `files/file-N`，远端声明因而获得消费端文件读取能力。

**远端资源可声明外部 URI** — `packages/build-result/src/types.ts:83-99`

外部文件声明只要求语法可解析的 URI，没有把它绑定到经本机授权的项目根目录。

```typescript
export function assertBuildResultFileRef(value: unknown, subject: string): asserts value is BuildResultFileRef {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${subject} is not a Build file reference`);
  }
  const item = value as Readonly<Record<string, unknown>>;
  if ((item.kind !== "build-file" && item.kind !== "external-file")
    || typeof item.size !== "number" || !Number.isSafeInteger(item.size) || item.size < 0
    || typeof item.mediaType !== "string" || item.mediaType.length === 0) {
    throw new Error(`${subject} is not a valid Build file reference`);
  }
  if (item.kind === "external-file") {
    if (typeof item.uri !== "string" || item.uri.length === 0) throw new Error(`${subject}.uri is missing`);
    new URL(item.uri);
  } else {
    assertBuildResultPath(item.path, `${subject}.path`);
    if (item.build !== undefined) assertOrderedBuildId(item.build as string);
  }
```

**远端复合结果被解码** — `packages/build-result-s3/src/repository.ts:325-337`

选中的复合输出文档从 S3 读回并通过共享解码器，资源绑定由远端文档决定。

```typescript
      if (entry.value.kind === "value") {
        const rawDocument = await this.#readJson(currentBuild, entry.value.path);
        assert(rawDocument !== undefined, `Build ${currentBuild} value ${entry.value.path} is unavailable`);
        const document = decodeBuildResultValueDocument(
          rawDocument,
          `Build ${currentBuild} Output ${currentOutput}`,
        );
        return {
          build: currentBuild,
          output: currentOutput,
          type: entry.type,
          value: { ...entry.value, document },
        };
```

**S3 默认启用本机文件解析器** — `packages/build-result-s3/src/repository.ts:146-151`

远端结果适配器在未显式传入解析器时选择 `localExternalFiles`，把结果声明接入消费端文件系统。

```typescript
  constructor(options: S3BuildResultRepositoryOptions) {
    assert(options.bucket.trim().length > 0, "S3 Build Result bucket must not be empty");
    this.#prefix = normalizePrefix(options.prefix);
    this.#externalFiles = options.externalFiles ?? localExternalFiles;
    this.#client = options.client ?? new AwsBuildResultS3Client(options);
  }
```

**远端 URI 传给本地解析器** — `packages/build-result-s3/src/repository.ts:351-360`

资源描述与打开都交给配置的外部文件解析器；默认解析器会根据远端声明访问当前机器上的路径。

```typescript
  async describeFile(_build: string, file: BuildResultFileRef): Promise<BuildResultFileRef> {
    return await currentFileReference(file, this.#externalFiles);
  }

  async openFile(
    build: string,
    file: BuildResultFileRef,
    range?: BuildResultFileRange,
  ): Promise<AsyncIterable<Uint8Array> | undefined> {
    if (file.kind === "external-file") return await this.#externalFiles.open(file.uri, range);
```

**直接读取当前用户可读的文件** — `packages/build-result/src/file-reference.ts:13-23`

`fileURLToPath` 后直接 `stat` / `createReadStream`，没有允许目录或来源验证；导出者随后把这些字节复制进结果包。

```typescript
export const localExternalFiles: ExternalFileAccess = {
  async size(uri) { return (await stat(fileURLToPath(uri))).size; },
  async open(uri, range) {
    if (range !== undefined) {
      const size = await localExternalFiles.size(uri);
      if (!Number.isSafeInteger(range.start) || range.start < 0
        || !Number.isSafeInteger(range.endExclusive) || range.endExclusive <= range.start
        || range.endExclusive > size) throw new Error(`Invalid file range for ${uri}`);
    }
    return createReadStream(fileURLToPath(uri), range === undefined ? {} : { start: range.start, end: range.endExclusive - 1 });
  },
```

**存储路径被重新解释为本地导出路径** — `packages/cli/src/result-export.ts:90-102`

`exportComposite` 保留 `build-file.path` 并传给 `containedPath`，然后把仓库返回的字节写到该本地路径。

```typescript
    for (const binding of resolvedOutput.value.document.resources) {
      const file = await repository.describeFile(resolvedOutput.build, binding.file);
      const identity = fileReferenceIdentity(resolvedOutput.build, file);
      let local = copied.get(identity);
      if (local === undefined) {
        let path = file.kind === "build-file" ? file.path : `files/file-${copied.size + 1}`;
        const name = basename(path);
        let index = copied.size + 1;
        while (paths.has(path) || path === "value.json") path = `files/import-${index++}/${name}`;
        paths.add(path);
        local = { kind: "build-file", path, size: file.size, mediaType: file.mediaType };
        copied.set(identity, local);
        await writeStream(containedPath(temporary, path), await openResultFile(repository, resolvedOutput.build, file));
```

#### Validation

静态追踪了远端复合文档解码、S3 默认解析器、当前本机文件描述/读取，以及导出复制。明确区分本地文件包含与后续对外共享，未断言自动外传。

Validation method: static source-to-sink trace

**远端资源可声明外部 URI** — `packages/build-result/src/types.ts:83-99`

外部文件声明只要求语法可解析的 URI，没有把它绑定到经本机授权的项目根目录。

```typescript
export function assertBuildResultFileRef(value: unknown, subject: string): asserts value is BuildResultFileRef {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${subject} is not a Build file reference`);
  }
  const item = value as Readonly<Record<string, unknown>>;
  if ((item.kind !== "build-file" && item.kind !== "external-file")
    || typeof item.size !== "number" || !Number.isSafeInteger(item.size) || item.size < 0
    || typeof item.mediaType !== "string" || item.mediaType.length === 0) {
    throw new Error(`${subject} is not a valid Build file reference`);
  }
  if (item.kind === "external-file") {
    if (typeof item.uri !== "string" || item.uri.length === 0) throw new Error(`${subject}.uri is missing`);
    new URL(item.uri);
  } else {
    assertBuildResultPath(item.path, `${subject}.path`);
    if (item.build !== undefined) assertOrderedBuildId(item.build as string);
  }
```

**远端复合结果被解码** — `packages/build-result-s3/src/repository.ts:325-337`

选中的复合输出文档从 S3 读回并通过共享解码器，资源绑定由远端文档决定。

```typescript
      if (entry.value.kind === "value") {
        const rawDocument = await this.#readJson(currentBuild, entry.value.path);
        assert(rawDocument !== undefined, `Build ${currentBuild} value ${entry.value.path} is unavailable`);
        const document = decodeBuildResultValueDocument(
          rawDocument,
          `Build ${currentBuild} Output ${currentOutput}`,
        );
        return {
          build: currentBuild,
          output: currentOutput,
          type: entry.type,
          value: { ...entry.value, document },
        };
```

**S3 默认启用本机文件解析器** — `packages/build-result-s3/src/repository.ts:146-151`

远端结果适配器在未显式传入解析器时选择 `localExternalFiles`，把结果声明接入消费端文件系统。

```typescript
  constructor(options: S3BuildResultRepositoryOptions) {
    assert(options.bucket.trim().length > 0, "S3 Build Result bucket must not be empty");
    this.#prefix = normalizePrefix(options.prefix);
    this.#externalFiles = options.externalFiles ?? localExternalFiles;
    this.#client = options.client ?? new AwsBuildResultS3Client(options);
  }
```

**远端 URI 传给本地解析器** — `packages/build-result-s3/src/repository.ts:351-360`

资源描述与打开都交给配置的外部文件解析器；默认解析器会根据远端声明访问当前机器上的路径。

```typescript
  async describeFile(_build: string, file: BuildResultFileRef): Promise<BuildResultFileRef> {
    return await currentFileReference(file, this.#externalFiles);
  }

  async openFile(
    build: string,
    file: BuildResultFileRef,
    range?: BuildResultFileRange,
  ): Promise<AsyncIterable<Uint8Array> | undefined> {
    if (file.kind === "external-file") return await this.#externalFiles.open(file.uri, range);
```

**直接读取当前用户可读的文件** — `packages/build-result/src/file-reference.ts:13-23`

`fileURLToPath` 后直接 `stat` / `createReadStream`，没有允许目录或来源验证；导出者随后把这些字节复制进结果包。

```typescript
export const localExternalFiles: ExternalFileAccess = {
  async size(uri) { return (await stat(fileURLToPath(uri))).size; },
  async open(uri, range) {
    if (range !== undefined) {
      const size = await localExternalFiles.size(uri);
      if (!Number.isSafeInteger(range.start) || range.start < 0
        || !Number.isSafeInteger(range.endExclusive) || range.endExclusive <= range.start
        || range.endExclusive > size) throw new Error(`Invalid file range for ${uri}`);
    }
    return createReadStream(fileURLToPath(uri), range === undefined ? {} : { start: range.start, end: range.endExclusive - 1 });
  },
```

**存储路径被重新解释为本地导出路径** — `packages/cli/src/result-export.ts:90-102`

`exportComposite` 保留 `build-file.path` 并传给 `containedPath`，然后把仓库返回的字节写到该本地路径。

```typescript
    for (const binding of resolvedOutput.value.document.resources) {
      const file = await repository.describeFile(resolvedOutput.build, binding.file);
      const identity = fileReferenceIdentity(resolvedOutput.build, file);
      let local = copied.get(identity);
      if (local === undefined) {
        let path = file.kind === "build-file" ? file.path : `files/file-${copied.size + 1}`;
        const name = basename(path);
        let index = copied.size + 1;
        while (paths.has(path) || path === "value.json") path = `files/import-${index++}/${name}`;
        paths.add(path);
        local = { kind: "build-file", path, size: file.size, mediaType: file.mediaType };
        copied.set(identity, local);
        await writeStream(containedPath(temporary, path), await openResultFile(repository, resolvedOutput.build, file));
```

Assertions:
- S3 默认解析器为 localExternalFiles。
- URI 语法校验不等于本机文件读取授权。
- 导出中的 external-file 使用生成名称，但仍从声明 URI 读取本机字节。
- 远端文档不能更改配置的 S3 Endpoint 或 AWS 凭据。

Limitations:
- 外部 live file 引用是受支持功能；只有低信任生产者与高信任消费端的边界才适用。
- 没有读取任何真实本地秘密，没有执行网络请求或导出。
- 代码未自动把字节发送回远端；攻击者获知内容需要用户继续共享/暴露导出包。
- 访问受当前 OS 用户的文件权限及文件存在性限制。

#### Dataflow

远端 external-file URI → S3 默认 localExternalFiles → 本机 stat/read → 导出 files/file-N → 条件性共享

- **Source:** 远端 Result 中的外部文件 URI

- **Sink:** 本机 `createReadStream` 与导出复制

- **Outcome:** 本地可读文件被包含进结果包；后续共享时可能泄露

**远端资源可声明外部 URI** — `packages/build-result/src/types.ts:83-99`

外部文件声明只要求语法可解析的 URI，没有把它绑定到经本机授权的项目根目录。

```typescript
export function assertBuildResultFileRef(value: unknown, subject: string): asserts value is BuildResultFileRef {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${subject} is not a Build file reference`);
  }
  const item = value as Readonly<Record<string, unknown>>;
  if ((item.kind !== "build-file" && item.kind !== "external-file")
    || typeof item.size !== "number" || !Number.isSafeInteger(item.size) || item.size < 0
    || typeof item.mediaType !== "string" || item.mediaType.length === 0) {
    throw new Error(`${subject} is not a valid Build file reference`);
  }
  if (item.kind === "external-file") {
    if (typeof item.uri !== "string" || item.uri.length === 0) throw new Error(`${subject}.uri is missing`);
    new URL(item.uri);
  } else {
    assertBuildResultPath(item.path, `${subject}.path`);
    if (item.build !== undefined) assertOrderedBuildId(item.build as string);
  }
```

**远端复合结果被解码** — `packages/build-result-s3/src/repository.ts:325-337`

选中的复合输出文档从 S3 读回并通过共享解码器，资源绑定由远端文档决定。

```typescript
      if (entry.value.kind === "value") {
        const rawDocument = await this.#readJson(currentBuild, entry.value.path);
        assert(rawDocument !== undefined, `Build ${currentBuild} value ${entry.value.path} is unavailable`);
        const document = decodeBuildResultValueDocument(
          rawDocument,
          `Build ${currentBuild} Output ${currentOutput}`,
        );
        return {
          build: currentBuild,
          output: currentOutput,
          type: entry.type,
          value: { ...entry.value, document },
        };
```

**S3 默认启用本机文件解析器** — `packages/build-result-s3/src/repository.ts:146-151`

远端结果适配器在未显式传入解析器时选择 `localExternalFiles`，把结果声明接入消费端文件系统。

```typescript
  constructor(options: S3BuildResultRepositoryOptions) {
    assert(options.bucket.trim().length > 0, "S3 Build Result bucket must not be empty");
    this.#prefix = normalizePrefix(options.prefix);
    this.#externalFiles = options.externalFiles ?? localExternalFiles;
    this.#client = options.client ?? new AwsBuildResultS3Client(options);
  }
```

**远端 URI 传给本地解析器** — `packages/build-result-s3/src/repository.ts:351-360`

资源描述与打开都交给配置的外部文件解析器；默认解析器会根据远端声明访问当前机器上的路径。

```typescript
  async describeFile(_build: string, file: BuildResultFileRef): Promise<BuildResultFileRef> {
    return await currentFileReference(file, this.#externalFiles);
  }

  async openFile(
    build: string,
    file: BuildResultFileRef,
    range?: BuildResultFileRange,
  ): Promise<AsyncIterable<Uint8Array> | undefined> {
    if (file.kind === "external-file") return await this.#externalFiles.open(file.uri, range);
```

**直接读取当前用户可读的文件** — `packages/build-result/src/file-reference.ts:13-23`

`fileURLToPath` 后直接 `stat` / `createReadStream`，没有允许目录或来源验证；导出者随后把这些字节复制进结果包。

```typescript
export const localExternalFiles: ExternalFileAccess = {
  async size(uri) { return (await stat(fileURLToPath(uri))).size; },
  async open(uri, range) {
    if (range !== undefined) {
      const size = await localExternalFiles.size(uri);
      if (!Number.isSafeInteger(range.start) || range.start < 0
        || !Number.isSafeInteger(range.endExclusive) || range.endExclusive <= range.start
        || range.endExclusive > size) throw new Error(`Invalid file range for ${uri}`);
    }
    return createReadStream(fileURLToPath(uri), range === undefined ? {} : { start: range.start, end: range.endExclusive - 1 });
  },
```

**存储路径被重新解释为本地导出路径** — `packages/cli/src/result-export.ts:90-102`

`exportComposite` 保留 `build-file.path` 并传给 `containedPath`，然后把仓库返回的字节写到该本地路径。

```typescript
    for (const binding of resolvedOutput.value.document.resources) {
      const file = await repository.describeFile(resolvedOutput.build, binding.file);
      const identity = fileReferenceIdentity(resolvedOutput.build, file);
      let local = copied.get(identity);
      if (local === undefined) {
        let path = file.kind === "build-file" ? file.path : `files/file-${copied.size + 1}`;
        const name = basename(path);
        let index = copied.size + 1;
        while (paths.has(path) || path === "value.json") path = `files/import-${index++}/${name}`;
        paths.add(path);
        local = { kind: "build-file", path, size: file.size, mediaType: file.mediaType };
        copied.set(identity, local);
        await writeStream(containedPath(temporary, path), await openResultFile(repository, resolvedOutput.build, file));
```

#### Reachability

需要较低信任的远端结果写入者、用户选择消费/导出该结果、有效可读本地路径；共享是泄露给远端攻击者的额外前提。

- **Attacker:** 没有本机文件访问权的远端结果生产者或 S3 对象写入者

- **Entry point:** S3 复合结果中的 external-file 资源

- **Outcome:** 本地可读文件被包含进结果包；后续共享时可能泄露

Limitations:
- 外部 live file 引用是受支持功能；只有低信任生产者与高信任消费端的边界才适用。
- 没有读取任何真实本地秘密，没有执行网络请求或导出。
- 代码未自动把字节发送回远端；攻击者获知内容需要用户继续共享/暴露导出包。
- 访问受当前 OS 用户的文件权限及文件存在性限制。

#### Severity

**Low** — 低危、部署条件明确：未经授权的本地文件包含影响敏感，但外部 live file 引用是预期功能；需要较低信任的远端写入者、用户消费结果，以及后续共享才能形成攻击者可见泄露。独占可信自用桶不构成本发现的信任边界。

Additional runtime or deployment evidence could raise or lower this severity.

Impact assessment:
- **Level:** high
- **Why:** 被包含的本机文件可能敏感；外泄取决于后续共享。

Likelihood assessment:
- **Level:** low
- **Why:** 可信自用存储没有额外越权边界，跨主体消费与分享均需发生。

#### Remediation

S3 适配器默认拒绝主机本地 external-file 引用。确需使用时，要求消费端显式提供带允许根目录和来源策略的解析器；共享前把资源实体化到对象存储。

Tests:
- 合成低信任 S3 文档引用未授权 file URI，断言在 stat/read 前拒绝。
- 显式允许的工作区文件仍可消费，根目录外或不可信来源的引用失败。
- 验证共享结果使用已实体化资源，不意外包含消费端文件。

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
| --- | --- | --- | --- |
| Independent review of primary browser, credential, filesystem, package and media boundaries | not recorded | Reported | 37 implementation files fully reviewed; no SECURITY.md found. Workspace source/assets use realpath containment. OAuth state and S256 PKCE + loopback callback confirmed; invalid callback can stop login, no theft found. Scoped npm spec suspicion rejected by downstream complete segment validation in externalPackageInstallRoot. Selected package/capture code is intentionally trusted Node execution, not sandbox. Multipart upload validates exact API URL; HTTPS signed parts receive size/checksum headers without bearer token. WhisperX loopback, JSON/size/root/WAV checks and single-inference lock confirmed; no live service tested. Prototype handling and externally authored Result manifests lack established security-sensitive attacker path; unresolved. Coverage is partial: most component code, examples and dependency implementations not audited. Parent validation completed. Findings retain browser, storage trust, platform and permission prerequisites; see canonical findings. Unresolved leads remain deferred. Superseding the preliminary manifest uncertainty above: the S3/export follow-up established two conditional flows, reported separately. General prototype exploitation remains unproven. |
| Studio browser request authorization, source writes and preview rendering | not recorded | Reported | Does the real launcher intentionally expose Studio to other machines? No public bind was found. bin/hypit.mjs dispatches to packages/studio/start.ts; accepted options omit host, Vite configFile is false, and server configuration sets only port and fs.allow. The pinned Vite package is not installed in this checkout, so dependency implementation was unavailable. Do not report an unconditional LAN service exposure. Do source revision and path checks prevent arbitrary filesystem writes? For the reviewed normal request paths, yes: allowedSourceFiles is derived from the selected Run, Author and existing source closure; applyTransaction rejects absolute paths, lexical workspace escapes and files outside that set, validates ranges and overlapping edits, and compares preimages. The findings concern unauthorized use of those permitted writes. Symlink races requiring separate local filesystem control were not established under the assigned website attacker model. Can request parameters directly name arbitrary files in Studio media endpoints? No direct path-to-read sink was found in the Studio handler. Material/storyboard routes use constrained resource IDs and an in-memory map; surface previews resolve selected module/surface descriptors; artifact routes resolve build/output through the result repository and restrict media types. Repository internals were outside this completed subtask. Does the preview iframe isolate renderer scripts from Studio? No. Both main and scrub previews use sandbox='allow-scripts allow-same-origin', and HyperFrames deliberately executes BrowserProgram.setup with new Function and includes program HTML/CSS. This permits a renderer program to access Studio's same origin. A separate confirmed finding was withheld because selected packages already execute server-side, and this review did not establish an unprivileged website-to-program input path independent of the reported API issues. Can ordinary source/style data escape generated HTML? Unresolved concern, not a confirmed finding: assertVisualStyleV1 in packages/visual-ir/src/style.ts rejects declaration separators, URL functions and control characters but does not reject HTML angle brackets. packages/hyperframes/src/document.ts:474-490 renders animation declaration values into raw style-element text. Composition restricts local animation properties to backdrop-filter, clip-path, filter, opacity and transform; normal typography markup constructs filter/transform values from numbers, so that inspected markup path does not supply arbitrary strings. A lower-trust source path constructing raw VisualTrack/Composition records must be demonstrated before reporting stored XSS. No exploit input was created or executed. Are ordinary UI labels and feedback rendered as active HTML? The reviewed feedback, artifact naming and localization helpers use textContent or explicit HTML escaping. Preview programs have intentionally different behavior. The full Studio/UI package family was not exhaustively audited; only the complete files listed below qualify as fully reviewed. Are request-body bounds enforced? The source, mutation, feedback and artifact-name handlers buffer complete bodies without application size limits. No separate availability finding is asserted here because browser delivery constraints and practical impact were not validated. Were security policy instructions or repository programs executed? Nested policy resolution for packages/studio returned empty. Repository content was treated only as analysis data. This subtask performed source reads/searches and the parent-authorized policy resolver; it did not run application code, tests, exploits, network requests, scan tools, modifications or delegation. Parent validation completed. Findings retain browser, storage trust, platform and permission prerequisites; see canonical findings. Unresolved leads remain deferred. |
| S3 Results, resource storage and local export boundary | not recorded | Reported | Was a more-specific SECURITY.md present? No SECURITY.md was found in the requested package directories. The previously resolved inherited policy remained empty. Can ordinary S3 object keys escape their configured prefix or redirect AWS-signed requests? No such flow was established. Resource identifiers exclude slashes, prefixes reject dot segments, Result keys combine a validated build identifier with a checked path, and AWS requests use the configured client and bucket. Object keys do not select endpoint URLs. The Windows export issue arises when an accepted storage path is subsequently interpreted as a local path. Can a malicious manifest override the configured S3 endpoint or credentials? No. Endpoint, region, bucket, and optional expectedBucketOwner are constructor/runtime configuration. They are not read from Result manifests. AWS credentials come from the SDK default chain. Trusting an attacker-controlled runtime configuration remains a separate deployment trust decision. Can exports clobber an existing destination? An existing destination is checked with lstat and rejected, and individual staged writes use wx. The final rename is not an atomic no-replace operation, so a destination created concurrently after the initial check could be replaced. No distinct attacker privilege boundary was established for that race; retained as a correctness concern rather than a security finding. Do malicious object property names establish prototype pollution? No new exploitable flow was established in this bounded group. Lookup of inherited output names can cause invalid access/errors, but the previously reviewed decoder constructs own output properties with Object.fromEntries and validates composite resource binding paths. Are transfer limits fully defensive? Resource multipart streams validate minimum part size and support cancellation. The Result S3 client directly accepts partSizeBytes without equivalent validation, and whole-object JSON reads lack an application-level byte limit. These are robustness concerns under trusted configuration/storage assumptions; no additional attacker-controlled execution path was established. What coverage was completed? All nine requested files were completely reviewed statically. Supporting shared Result decoder, path validation, and local-file-access behavior had been reviewed in the preceding baseline task. No application execution, network access, file modification, or delegation occurred. Parent validation completed. Findings retain browser, storage trust, platform and permission prerequisites; see canonical findings. Unresolved leads remain deferred. |
| Parent verification of runtime selection, activation, tool installation and release workflow controls | not recorded | No issue found | 15 additional complete source/workflow files reviewed, with further excerpts used only as supporting evidence. No additional confirmed issue from this group. Trusted package execution, program installation and hosted inference are explicit capabilities, not treated as sandbox escapes. Hosted account/IAM/registry/browser dependency enforcement remains outside verified code. |

## Open Questions And Follow Up

- Does a deployed/shared Results repository accept writers less trusted than local consumers?
- Can a particular target browser reach Studio under DNS rebinding/simple cross-site POST conditions?
- What protections apply to uploaded media, retention, training use and final billed totals on HypiHub?
- Are all dependencies free of known vulnerabilities?
- Requires verification of external ffmpeg/ffprobe demuxer behavior; source alone does not establish exploit outcome.
  - Follow-up prompt: Review deferred unit candidate-media-playlist-network and close its stated proof gap.
- Unreviewed remainder of the authorized current tree. Architecture/documentation mapping or a supporting excerpt does not count as complete per-file security review. This Standard scan is partial; no safety conclusion applies to this remainder.
  - Follow-up prompt: Review deferred unit deferred-431ff24f94a40d53 and close its stated proof gap. Paths: .gitattributes, .github/FUNDING.yml, .gitignore, .node-version, CONTRIBUTING.md, CONTRIBUTING.zh-CN.md, LICENSE, README.md, README.zh-CN.md, docs/guide/author-packages.md, docs/guide/component-anatomy.md, docs/guide/conventions.md, docs/guide/develop.md, docs/guide/packages.md, docs/guide/providers.md, docs/guide/runtime.md, docs/guide/service-partners.md, docs/guide/skill.md, docs/guide/studio-companion-architecture.md, docs/guide/studio-temporal-windows.md, docs/guide/testing.md, docs/public/hypit-logo-dark.svg, docs/public/hypit-logo-light.svg, docs/public/hypit-logo.svg, docs/public/logo-line-dark.svg, docs/public/logo-line-light.svg, docs/public/logo-mark.svg, docs/public/zh/index.html, docs/quickstart.md, docs/quickstart/composition.md, docs/quickstart/generation.md, docs/quickstart/images.md, docs/quickstart/preview.md, docs/quickstart/run.md, docs/quickstart/script.md, docs/quickstart/styles.md, docs/quickstart/timing.md, docs/quickstart/tracks.md, docs/zh/guide/author-packages.md, docs/zh/guide/component-anatomy.md, docs/zh/guide/conventions.md, docs/zh/guide/develop.md, docs/zh/guide/packages.md, docs/zh/guide/providers.md, docs/zh/guide/runtime.md, docs/zh/guide/skill.md, docs/zh/guide/studio-companion-adapter-architecture.md, docs/zh/guide/studio-temporal-windows.md, docs/zh/guide/testing.md, docs/zh/quickstart.md, docs/zh/quickstart/composition.md, docs/zh/quickstart/generation.md, docs/zh/quickstart/images.md, docs/zh/quickstart/preview.md, docs/zh/quickstart/run.md, docs/zh/quickstart/script.md, docs/zh/quickstart/styles.md, docs/zh/quickstart/timing.md, docs/zh/quickstart/tracks.md, examples/README.md, examples/complex-explainer/.gitignore, examples/complex-explainer/README.md, examples/complex-explainer/hypit.runtime.json, examples/complex-explainer/package-lock.json, examples/complex-explainer/package.json, examples/complex-explainer/packages/launch-scenes/README.md, examples/complex-explainer/packages/launch-scenes/package.json, examples/complex-explainer/packages/launch-scenes/src/activation.js, examples/complex-explainer/packages/launch-scenes/src/render.js, examples/complex-explainer/packages/launch-scenes/src/studio.js, examples/complex-explainer/packages/opening-system/README.md, examples/complex-explainer/packages/opening-system/package.json, examples/complex-explainer/packages/opening-system/src/activation.js, examples/complex-explainer/packages/opening-system/src/definition.js, examples/complex-explainer/packages/opening-system/src/flag-cloth.js, examples/complex-explainer/packages/opening-system/src/performance-media.js, examples/complex-explainer/packages/opening-system/src/portrait-inset.js, examples/complex-explainer/packages/opening-system/src/portrait-transition.js, examples/complex-explainer/packages/opening-system/src/pullback.js, examples/complex-explainer/packages/opening-system/src/reframe.js, examples/complex-explainer/packages/opening-system/src/render.js, examples/complex-explainer/packages/opening-system/src/studio.js, examples/complex-explainer/packages/single-line-captions/README.md, examples/complex-explainer/packages/single-line-captions/package.json, examples/complex-explainer/packages/single-line-captions/src/activation.js, examples/complex-explainer/packages/visual-language/package.json, examples/complex-explainer/packages/visual-language/src/index.js, examples/complex-explainer/packages/web-scenes/README.md, examples/complex-explainer/packages/web-scenes/package.json, examples/complex-explainer/packages/web-scenes/src/activation.js, examples/complex-explainer/packages/web-scenes/src/render.js, examples/complex-explainer/packages/web-scenes/src/scenes/code-route/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/code-route/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/code-route/styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/comparison/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/comparison/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/comparison/styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/components/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/components/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/components/styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/delivery/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/delivery/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/delivery/styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/editor-route/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/editor-route/editor-styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/editor-route/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/editor-route/materials-styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/editor-route/output-styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/editor-route/stage-styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/editor-route/styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/introduction/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/introduction/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/introduction/styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/outro/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/outro/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/outro/styles.js, examples/complex-explainer/packages/web-scenes/src/scenes/semantic-time/animation.js, examples/complex-explainer/packages/web-scenes/src/scenes/semantic-time/index.js, examples/complex-explainer/packages/web-scenes/src/scenes/semantic-time/styles.js, examples/complex-explainer/packages/web-scenes/src/shared/beats.js, examples/complex-explainer/packages/web-scenes/src/shared/brand-marks.js, examples/complex-explainer/packages/web-scenes/src/shared/pixel-type.js, examples/complex-explainer/packages/web-scenes/src/shared/route-cards.js, examples/complex-explainer/packages/web-scenes/src/shared/scene-styles.js, examples/complex-explainer/packages/web-scenes/src/shared/scene.js, examples/complex-explainer/packages/web-scenes/src/shared/studio-art.js, examples/complex-explainer/packages/web-scenes/src/shared/terminal.js, examples/complex-explainer/packages/web-scenes/src/shared/workshop-language.js, examples/complex-explainer/packages/web-scenes/src/studio.js, examples/complex-explainer/productions/explainer/ASSET-PROVENANCE.md, examples/complex-explainer/productions/explainer/BRIEF.md, examples/complex-explainer/productions/explainer/CRAFT-NOTES.md, examples/complex-explainer/productions/explainer/README.md, examples/complex-explainer/productions/explainer/TREATMENT.md, examples/complex-explainer/productions/explainer/authors/assets.svml, examples/complex-explainer/productions/explainer/authors/direction.svml, examples/complex-explainer/productions/explainer/authors/main.svml, examples/complex-explainer/productions/explainer/authors/script.svml, examples/complex-explainer/productions/explainer/recipes/composition.svs, examples/complex-explainer/productions/explainer/recipes/performance.svs, examples/complex-explainer/productions/explainer/runs/export-parts.svrun, examples/complex-explainer/productions/explainer/runs/prepare-example.svrun, examples/complex-explainer/productions/explainer/runs/render.svrun, examples/complex-explainer/productions/explainer/scripts/assemble-final-export.py, examples/interview/README.md, examples/interview/ada-tracking.svs, examples/interview/assets/aida.wav, examples/interview/assets/chad.wav, examples/interview/assets/emoji-reveal/rendered/building-estate.png, examples/interview/assets/emoji-reveal/rendered/currency-bitcoin.png, examples/interview/assets/emoji-reveal/rendered/question-mark.png, examples/interview/assets/emoji-reveal/rendered/sparkles.png, examples/interview/assets/guy.wav, examples/interview/assets/leon.wav, examples/interview/assets/rule-reveal.wav, examples/interview/assets/shared-soundtrack.m4a, examples/interview/assets/wife.wav, examples/interview/assets/wojak.wav, examples/interview/hypit.runtime.json, examples/interview/package.json, examples/interview/recipes.svs, examples/interview/reference.svml, examples/interview/reference.svrun, examples/interview/reference.svs, examples/interview/spanish-tracking.svs, examples/interview/swap-host-README.md, examples/interview/swap-host.svml, examples/interview/swap-host.svrun, examples/interview/swap-lang-README.md, examples/interview/swap-lang.svml, examples/interview/swap-lang.svrun, examples/interview/swap-ride-README.md, examples/interview/swap-ride.svml, examples/interview/swap-ride.svrun, examples/interview/tracking.svs, examples/interview/variants.md, examples/interview/wojak-tracking.svs, examples/minimal-author-package/README.md, examples/minimal-author-package/packages/example-component/README.md, examples/minimal-author-package/packages/example-component/package.json, examples/minimal-author-package/packages/example-component/preview/Box.png, examples/minimal-author-package/packages/example-component/preview/build.svrun, examples/minimal-author-package/packages/example-component/preview/preview.svml, examples/minimal-author-package/packages/example-component/preview/recipes.svs, examples/minimal-author-package/packages/example-component/src/activation.ts, examples/minimal-author-package/packages/example-component/src/component.ts, examples/minimal-author-package/packages/example-component/src/fragment.ts, examples/minimal-author-package/packages/example-component/src/index.ts, examples/minimal-author-package/packages/example-component/src/manifest.ts, examples/minimal-author-package/packages/example-component/src/style.ts, examples/minimal-author-package/packages/example-component/src/surface.ts, examples/minimal-author-package/packages/example-component/src/temporal.ts, examples/minimal-author-package/packages/example-component/tsconfig.json, examples/podcast/README.md, examples/podcast/assets/doge.wav, examples/podcast/assets/idol.wav, examples/podcast/assets/jock.wav, examples/podcast/assets/nerd.wav, examples/podcast/assets/pepe.wav, examples/podcast/assets/shared-soundtrack.m4a, examples/podcast/assets/tboy.wav, examples/podcast/hypit.runtime.json, examples/podcast/kits/split-opening.svs, examples/podcast/package.json, examples/podcast/recipes.svs, examples/podcast/reference.svml, examples/podcast/reference.svrun, examples/podcast/reference.svs, examples/podcast/swap-app-README.md, examples/podcast/swap-app.svml, examples/podcast/swap-app.svrun, examples/podcast/swap-host-README.md, examples/podcast/swap-host.svml, examples/podcast/swap-host.svrun, examples/podcast/swap-item-README.md, examples/podcast/swap-item.svml, examples/podcast/swap-item.svrun, examples/podcast/variants.md, examples/provider-package/README.md, examples/provider-package/hypit.runtime.json, examples/provider-package/packages/provider-images/package.json, examples/provider-package/packages/provider-images/src/activation.ts, examples/provider-package/packages/provider-images/src/provider.ts, examples/provider-package/packages/provider-images/test/provider.test.ts, examples/provider-package/packages/provider-images/tsconfig.json, examples/ranking-football/README.md, examples/ranking-football/assets/bellingham-new.jpg, examples/ranking-football/assets/benzema.jpg, examples/ranking-football/assets/cat.wav, examples/ranking-football/assets/debrunye.jpg, examples/ranking-football/assets/goth.wav, examples/ranking-football/assets/haaland.jpg, examples/ranking-football/assets/kane.jpg, examples/ranking-football/assets/mbappe-new.jpg, examples/ranking-football/assets/messi.jpeg, examples/ranking-football/assets/modric.jpg, examples/ranking-football/assets/neymar.jpg, examples/ranking-football/assets/ranking-appear.wav, examples/ranking-football/assets/ranking-move.wav, examples/ranking-football/assets/ronaldo.jpeg, examples/ranking-football/assets/shared-soundtrack.m4a, examples/ranking-football/assets/yamal.jpg, examples/ranking-football/column-recipes.svs, examples/ranking-football/download-reused-media.mjs, examples/ranking-football/hypit.runtime.json, examples/ranking-football/package.json, examples/ranking-football/recipes.svs, examples/ranking-football/reference-banana-from-swap/README.md, examples/ranking-football/reference-banana-from-swap/assets/bellingham-new.jpg, examples/ranking-football/reference-banana-from-swap/assets/benzema.jpg, examples/ranking-football/reference-banana-from-swap/assets/cat.wav, examples/ranking-football/reference-banana-from-swap/assets/debrunye.jpg, examples/ranking-football/reference-banana-from-swap/assets/goth.wav, examples/ranking-football/reference-banana-from-swap/assets/haaland.jpg, examples/ranking-football/reference-banana-from-swap/assets/kane.jpg, examples/ranking-football/reference-banana-from-swap/assets/mbappe-new.jpg, examples/ranking-football/reference-banana-from-swap/assets/messi.jpeg, examples/ranking-football/reference-banana-from-swap/assets/modric.jpg, examples/ranking-football/reference-banana-from-swap/assets/neymar.jpg, examples/ranking-football/reference-banana-from-swap/assets/ranking-appear.wav, examples/ranking-football/reference-banana-from-swap/assets/ranking-move.wav, examples/ranking-football/reference-banana-from-swap/assets/ronaldo.jpeg, examples/ranking-football/reference-banana-from-swap/assets/shared-soundtrack.m4a, examples/ranking-football/reference-banana-from-swap/assets/yamal.jpg, examples/ranking-football/reference-banana-from-swap/build.svrun, examples/ranking-football/reference-banana-from-swap/hypit.runtime.json, examples/ranking-football/reference-banana-from-swap/kits/speaker-v1.svs, examples/ranking-football/reference-banana-from-swap/package.json, examples/ranking-football/reference-banana-from-swap/recipes.svs, examples/ranking-football/reference-banana-from-swap/reference-banana-from-swap.svml, examples/ranking-football/reference-banana-from-swap/reference-banana-from-swap.svrun, examples/ranking-football/reference-banana-from-swap/studio.svrun, examples/ranking-football/reference-banana/README.md, examples/ranking-football/reference-banana/assets/bellingham-new.jpg, examples/ranking-football/reference-banana/assets/benzema.jpg, examples/ranking-football/reference-banana/assets/cat.wav, examples/ranking-football/reference-banana/assets/debrunye.jpg, examples/ranking-football/reference-banana/assets/goth.wav, examples/ranking-football/reference-banana/assets/haaland.jpg, examples/ranking-football/reference-banana/assets/kane.jpg, examples/ranking-football/reference-banana/assets/mbappe-new.jpg, examples/ranking-football/reference-banana/assets/messi.jpeg, examples/ranking-football/reference-banana/assets/modric.jpg, examples/ranking-football/reference-banana/assets/neymar.jpg, examples/ranking-football/reference-banana/assets/ranking-appear.wav, examples/ranking-football/reference-banana/assets/ranking-move.wav, examples/ranking-football/reference-banana/assets/ronaldo.jpeg, examples/ranking-football/reference-banana/assets/shared-soundtrack.m4a, examples/ranking-football/reference-banana/assets/yamal.jpg, examples/ranking-football/reference-banana/build.svrun, examples/ranking-football/reference-banana/hypit.runtime.json, examples/ranking-football/reference-banana/kits/speaker-v1.svs, examples/ranking-football/reference-banana/package.json, examples/ranking-football/reference-banana/recipes.svs, examples/ranking-football/reference-banana/reference-banana.svml, examples/ranking-football/reference-banana/reference-banana.svrun, examples/ranking-football/reference-banana/studio.svrun, examples/ranking-football/reference-gpt.svml, examples/ranking-football/reference-gpt.svrun, examples/ranking-football/reference.svml, examples/ranking-football/reference.svrun, examples/ranking-football/swap-effect-README.md, examples/ranking-football/swap-effect-banana-reference-sync/README.md, examples/ranking-football/swap-effect-banana-reference-sync/assets/bellingham-new.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/benzema.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/cat.wav, examples/ranking-football/swap-effect-banana-reference-sync/assets/debrunye.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/goth.wav, examples/ranking-football/swap-effect-banana-reference-sync/assets/haaland.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/kane.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/mbappe-new.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/messi.jpeg, examples/ranking-football/swap-effect-banana-reference-sync/assets/modric.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/neymar.jpg, examples/ranking-football/swap-effect-banana-reference-sync/assets/ranking-appear.wav, examples/ranking-football/swap-effect-banana-reference-sync/assets/ranking-move.wav, examples/ranking-football/swap-effect-banana-reference-sync/assets/ronaldo.jpeg, examples/ranking-football/swap-effect-banana-reference-sync/assets/shared-soundtrack.m4a, examples/ranking-football/swap-effect-banana-reference-sync/assets/yamal.jpg, examples/ranking-football/swap-effect-banana-reference-sync/build.svrun, examples/ranking-football/swap-effect-banana-reference-sync/column-recipes.svs, examples/ranking-football/swap-effect-banana-reference-sync/hybrid-recipes.svs, examples/ranking-football/swap-effect-banana-reference-sync/hypit.runtime.json, examples/ranking-football/swap-effect-banana-reference-sync/kits/speaker-v1.svs, examples/ranking-football/swap-effect-banana-reference-sync/package.json, examples/ranking-football/swap-effect-banana-reference-sync/swap-effect-banana-reference-sync.svml, examples/ranking-football/swap-effect-banana-reference-sync/swap-effect-banana-reference-sync.svrun, examples/ranking-football/swap-effect-banana/README.md, examples/ranking-football/swap-effect-banana/assets/bellingham-new.jpg, examples/ranking-football/swap-effect-banana/assets/benzema.jpg, examples/ranking-football/swap-effect-banana/assets/cat.wav, examples/ranking-football/swap-effect-banana/assets/debrunye.jpg, examples/ranking-football/swap-effect-banana/assets/goth.wav, examples/ranking-football/swap-effect-banana/assets/haaland.jpg, examples/ranking-football/swap-effect-banana/assets/kane.jpg, examples/ranking-football/swap-effect-banana/assets/mbappe-new.jpg, examples/ranking-football/swap-effect-banana/assets/messi.jpeg, examples/ranking-football/swap-effect-banana/assets/modric.jpg, examples/ranking-football/swap-effect-banana/assets/neymar.jpg, examples/ranking-football/swap-effect-banana/assets/ranking-appear.wav, examples/ranking-football/swap-effect-banana/assets/ranking-move.wav, examples/ranking-football/swap-effect-banana/assets/ronaldo.jpeg, examples/ranking-football/swap-effect-banana/assets/shared-soundtrack.m4a, examples/ranking-football/swap-effect-banana/assets/yamal.jpg, examples/ranking-football/swap-effect-banana/column-recipes.svs, examples/ranking-football/swap-effect-banana/hypit.runtime.json, examples/ranking-football/swap-effect-banana/kits/speaker-v1.svs, examples/ranking-football/swap-effect-banana/package.json, examples/ranking-football/swap-effect-banana/reuse.svrun, examples/ranking-football/swap-effect-banana/swap-effect-banana.svml, examples/ranking-football/swap-effect-banana/swap-effect-banana.svrun, examples/ranking-football/swap-effect.svml, examples/ranking-football/swap-effect.svrun, examples/ranking-football/swap-host-README.md, examples/ranking-football/swap-host.svml, examples/ranking-football/swap-host.svrun, examples/ranking-football/swap-topic-README.md, examples/ranking-football/swap-topic.svml, examples/ranking-football/swap-topic.svrun, examples/ranking-football/tech-tier-recipes.svs, examples/ranking-football/tier-banana-recipes.svs, examples/ranking-football/variants.md, examples/semantic-composition/README.md, examples/semantic-composition/chat.svml, examples/semantic-composition/chat.svrun, examples/semantic-composition/chat.svs, examples/semantic-composition/hypit.runtime.json, examples/semantic-composition/packages/chat-scene/README.md, examples/semantic-composition/packages/chat-scene/package.json, examples/semantic-composition/packages/chat-scene/src/activation.ts, examples/semantic-composition/packages/chat-scene/src/render.ts, examples/semantic-composition/packages/chat-scene/test/render.test.ts, examples/semantic-composition/packages/chat-scene/tsconfig.json, examples/semantic-composition/packages/performance-styles/README.md, examples/semantic-composition/packages/performance-styles/package.json, examples/semantic-composition/packages/performance-styles/src/activation.ts, examples/semantic-composition/packages/performance-styles/src/render.ts, examples/semantic-composition/packages/performance-styles/src/studio.ts, examples/semantic-composition/packages/performance-styles/tsconfig.json, examples/semantic-composition/packages/responsive-explainer/README.md, examples/semantic-composition/packages/responsive-explainer/package.json, examples/semantic-composition/packages/responsive-explainer/src/activation.ts, examples/semantic-composition/packages/responsive-explainer/src/render.ts, examples/semantic-composition/packages/responsive-explainer/tsconfig.json, examples/semantic-composition/packages/sound-styles/README.md, examples/semantic-composition/packages/sound-styles/package.json, examples/semantic-composition/packages/sound-styles/src/activation.ts, examples/semantic-composition/packages/sound-styles/src/render.ts, examples/semantic-composition/packages/sound-styles/tsconfig.json, hypit, package.json, packages/artifact/README.md, packages/artifact/package.json, packages/artifact/src/activation.ts, packages/artifact/src/index.ts, packages/audio-track-studio/README.md, packages/audio-track-studio/package.json, packages/audio-track-studio/src/activation.ts, packages/audio-track-studio/src/index.ts, packages/audio-track/README.md, packages/audio-track/package.json, packages/audio-track/src/activation.ts, packages/audio-track/src/component.ts, packages/audio-track/src/fragment.ts, packages/audio-track/src/index.ts, packages/audio-track/src/manifest.ts, packages/audio-track/src/program.ts, packages/audio-track/src/surface.ts, packages/audio-track/src/types.ts, packages/audio-track/test/audio-track.test.ts, packages/author-kit/README.md, packages/author-kit/package.json, packages/author-kit/src/index.ts, packages/background-removal/README.md, packages/background-removal/package.json, packages/background-removal/src/activation.ts, packages/background-removal/src/component.ts, packages/background-removal/src/fragment.ts, packages/background-removal/src/index.ts, packages/background-removal/src/manifest.ts, packages/background-removal/src/program.ts, packages/background-removal/src/surface.ts, packages/background-removal/src/types.ts, packages/background-removal/test/background-removal.test.ts, packages/browser-capture/README.md, packages/browser-capture/package.json, packages/browser-capture/test/capture.test.ts, packages/build-result-fs/README.md, packages/build-result-fs/package.json, packages/build-result-fs/src/activation.ts, packages/build-result-kit/README.md, packages/build-result-kit/package.json, packages/build-result-kit/src/index.ts, packages/build-result-s3/README.md, packages/build-result-s3/package.json, packages/build-result-s3/test/repository.test.ts, packages/build-result/README.md, packages/build-result/package.json, packages/build-result/src/execution-log.ts, packages/build-result/src/index.ts, packages/build-result/src/replace-file-windows.ts, packages/build-result/src/replace-file.ts, packages/build-result/src/types.ts, packages/build-result/test/replace-file.test.ts, packages/build-result/test/result.test.ts, packages/caption-fine-studio/README.md, packages/caption-fine-studio/package.json, packages/caption-fine-studio/src/activation.ts, packages/caption-fine-studio/src/index.ts, packages/caption-fine-studio/test/adapter.test.ts, packages/caption-fine/README.md, packages/caption-fine/package.json, packages/caption-fine/preview/Track.png, packages/caption-fine/src/activation.ts, packages/caption-fine/src/component.ts, packages/caption-fine/src/fragment.ts, packages/caption-fine/src/index.ts, packages/caption-fine/src/manifest.ts, packages/caption-fine/src/recipe.ts, packages/caption-fine/src/render.ts, packages/caption-fine/src/schedule.ts, packages/caption-fine/src/spacing.ts, packages/caption-fine/src/style.ts, packages/caption-fine/src/surface.ts, packages/caption-fine/src/types.ts, packages/caption-fine/test/caption-fine.test.ts, packages/caption/README.md, packages/caption/package.json, packages/caption/src/activation.ts, packages/caption/src/component.ts, packages/caption/src/display.ts, packages/caption/src/error.ts, packages/caption/src/fragment.ts, packages/caption/src/index.ts, packages/caption/src/manifest.ts, packages/caption/src/style.ts, packages/caption/src/surface.ts, packages/caption/src/temporalize.ts, packages/caption/src/types.ts, packages/caption/src/visibility.ts, packages/caption/test/caption.test.ts, packages/caption/test/chinese-pipeline.test.ts, packages/cli/README.md, packages/cli/package.json, packages/cli/src/arguments.ts, packages/cli/src/build-planning.ts, packages/cli/src/command.ts, packages/cli/src/commands/environment.ts, packages/cli/src/commands/execution.ts, packages/cli/src/commands/results.ts, packages/cli/src/commands/types.ts, packages/cli/src/distribution.ts, packages/cli/src/index.ts, packages/cli/src/machine-view.ts, packages/cli/src/main.ts, packages/cli/src/observation.ts, packages/cli/src/output.ts, packages/cli/src/paths.ts, packages/cli/src/reachability.ts, packages/cli/src/result-query.ts, packages/cli/src/run-file.ts, packages/cli/src/runtime-port.ts, packages/cli/src/runtime-view.ts, packages/cli/src/usage-error.ts, packages/cli/src/view.ts, packages/cli/test/build-programs.test.ts, packages/cli/test/build-results.test.ts, packages/cli/test/control-commands.test.ts, packages/cli/test/oauth.test.ts, packages/cli/test/observation.test.ts, packages/cli/test/output.test.ts, packages/cli/test/plan-needs.test.ts, packages/cli/test/programs-command.test.ts, packages/cli/test/reachability.test.ts, packages/cli/test/runtime-selection.test.ts, packages/cli/test/source-discovery.test.ts, packages/cli/test/view.test.ts, packages/comment-sticker-studio/README.md, packages/comment-sticker-studio/package.json, packages/comment-sticker-studio/src/activation.ts, packages/comment-sticker-studio/src/index.ts, packages/comment-sticker/README.md, packages/comment-sticker/package.json, packages/comment-sticker/preview/Track.png, packages/comment-sticker/src/activation.ts, packages/comment-sticker/src/author.ts, packages/comment-sticker/src/component.ts, packages/comment-sticker/src/fragment.ts, packages/comment-sticker/src/index.ts, packages/comment-sticker/src/manifest.ts, packages/comment-sticker/src/program.ts, packages/comment-sticker/src/surface.ts, packages/comment-sticker/src/types.ts, packages/comment-sticker/test/comment-sticker.test.ts, packages/compiler-markup-node/README.md, packages/compiler-markup-node/package.json, packages/compiler-markup-node/src/index.ts, packages/compiler-markup-node/test/compiler.test.ts, packages/compiler-node/README.md, packages/compiler-node/package.json, packages/compiler-node/src/compiler.ts, packages/compiler-node/src/error.ts, packages/compiler-node/src/graph-query.ts, packages/compiler-node/src/index.ts, packages/compiler-node/src/modules.ts, packages/compiler-node/src/run.ts, packages/compiler-node/test/compiler.test.ts, packages/component-kit/README.md, packages/component-kit/package.json, packages/component-kit/src/index.ts, packages/composition/README.md, packages/composition/package.json, packages/composition/src/activation.ts, packages/composition/src/audio-presentation.ts, packages/composition/src/component.ts, packages/composition/src/index.ts, packages/composition/src/manifest.ts, packages/composition/src/schema.ts, packages/composition/src/track.ts, packages/composition/test/render.test.ts, packages/composition/test/track.test.ts, packages/core/README.md, packages/core/package.json, packages/core/src/error.ts, packages/core/src/graph.ts, packages/core/src/index.ts, packages/core/src/link.ts, packages/core/src/machine.ts, packages/core/src/plan.ts, packages/core/src/reducer.ts, packages/core/src/reference.ts, packages/core/src/slice.ts, packages/core/test/core.test.ts, packages/core/test/demand.test.ts, packages/core/test/greeting-fixture.ts, packages/credential-store-env/README.md, packages/credential-store-env/package.json, packages/credential-store-env/test/store.test.ts, packages/credential-store-os/README.md, packages/credential-store-os/package.json, packages/credential-store-os/runtime/windows-credential.ps1, packages/credential-store-os/src/index.ts, packages/credential-store-os/test/store.test.ts, packages/deck-track-studio/README.md, packages/deck-track-studio/package.json, packages/deck-track-studio/src/activation.ts, packages/deck-track-studio/src/index.ts, packages/deck-track/README.md, packages/deck-track/package.json, packages/deck-track/preview/DepthStack.png, packages/deck-track/src/activation.ts, packages/deck-track/src/author.ts, packages/deck-track/src/component.ts, packages/deck-track/src/fragment.ts, packages/deck-track/src/index.ts, packages/deck-track/src/lower.ts, packages/deck-track/src/manifest.ts, packages/deck-track/src/program.ts, packages/deck-track/src/surface.ts, packages/deck-track/src/types.ts, packages/deck-track/test/deck-track.test.ts, packages/driver-node/README.md, packages/driver-node/package.json, packages/driver-node/src/driver.ts, packages/driver-node/src/index.ts, packages/driver-node/src/planning.ts, packages/driver-node/src/registry.ts, packages/driver-node/src/resources.ts, packages/driver-node/src/types.ts, packages/driver-node/test/driver.test.ts, packages/driver-node/test/scheduler.test.ts, packages/driver-node/test/validation.test.ts, packages/elaborator/README.md, packages/elaborator/package.json, packages/elaborator/src/author.ts, packages/elaborator/src/fragment.ts, packages/elaborator/src/frontend-facet.ts, packages/elaborator/src/index.ts, packages/elaborator/src/source.ts, packages/elaborator/test/author.test.ts, packages/elaborator/test/fragment.test.ts, packages/elaborator/test/source.test.ts, packages/elevenlabs-speech/README.md, packages/elevenlabs-speech/package.json, packages/elevenlabs-speech/src/activation.ts, packages/elevenlabs-speech/src/fragment.ts, packages/elevenlabs-speech/src/index.ts, packages/elevenlabs-speech/src/surface.ts, packages/elevenlabs-speech/test/elevenlabs-speech.test.ts, packages/endpoint-kit/README.md, packages/endpoint-kit/package.json, packages/endpoint-kit/src/index.ts, packages/endpoint-kit/test/endpoint.test.ts, packages/estimate/README.md, packages/estimate/package.json, packages/estimate/src/activation.ts, packages/estimate/src/index.ts, packages/estimate/src/manifest.ts, packages/estimate/src/policy.ts, packages/estimate/src/program.ts, packages/estimate/src/types.ts, packages/estimate/test/estimate.test.ts, packages/film-studio/package.json, packages/film-studio/src/activation.ts, packages/film-studio/src/index.ts, packages/film/README.md, packages/film/package.json, packages/film/src/activation.ts, packages/film/src/component.ts, packages/film/src/fragment.ts, packages/film/src/index.ts, packages/film/src/manifest.ts, packages/film/src/program.ts, packages/film/src/recipe.ts, packages/film/src/surface.ts, packages/film/src/types.ts, packages/film/test/film.test.ts, packages/film/test/surface.test.ts, packages/fishaudio-speech/README.md, packages/fishaudio-speech/package.json, packages/fishaudio-speech/src/activation.ts, packages/fishaudio-speech/src/fragment.ts, packages/fishaudio-speech/src/index.ts, packages/fishaudio-speech/src/surface.ts, packages/fishaudio-speech/test/fishaudio-speech.test.ts, packages/fonts-open/README.md, packages/fonts-open/package.json, packages/fonts-open/src/activation.ts, packages/fonts-open/src/catalog.ts, packages/fonts-open/src/index.ts, packages/fonts-open/src/manifest.ts, packages/fonts-open/src/studio.ts, packages/fonts-open/src/surface.ts, packages/fonts-open/test/fonts-open.test.ts, packages/generation/README.md, packages/generation/package.json, packages/generation/src/activation.ts, packages/generation/src/component.ts, packages/generation/src/identity.ts, packages/generation/src/index.ts, packages/generation/src/manifest.ts, packages/generation/src/mapping.ts, packages/generation/src/ports.ts, packages/generation/src/request.ts, packages/generation/src/schema.ts, packages/generation/src/types.ts, packages/generation/test/identity.test.ts, packages/generation/test/ports.test.ts, packages/gpt-image-kits/README.md, packages/gpt-image-kits/kits/phone-ugc-v1.svs, packages/gpt-image-kits/package.json, packages/gpt-image/README.md, packages/gpt-image/package.json, packages/gpt-image/src/activation.ts, packages/gpt-image/src/fragment.ts, packages/gpt-image/src/index.ts, packages/gpt-image/src/surface.ts, packages/gpt-image/test/broll-graph.test.ts, packages/gpt-image/test/surface.test.ts, packages/grok-imagine/README.md, packages/grok-imagine/package.json, packages/grok-imagine/src/activation.ts, packages/grok-imagine/src/index.ts, packages/grok-imagine/src/surface.ts, packages/host/README.md, packages/host/package.json, packages/host/src/facet.ts, packages/host/src/frontend.ts, packages/host/src/index.ts, packages/hyperframes/README.md, packages/hyperframes/package.json, packages/hyperframes/src/activation.ts, packages/hyperframes/src/component.ts, packages/hyperframes/src/fragment.ts, packages/hyperframes/src/index.ts, packages/hyperframes/src/manifest.ts, packages/hyperframes/src/text.ts, packages/hyperframes/test/document.test.ts, packages/hyperframes/test/project.test.ts, packages/image-compose/README.md, packages/image-compose/package.json, packages/image-compose/src/activation.ts, packages/image-compose/src/component.ts, packages/image-compose/src/fragment.ts, packages/image-compose/src/index.ts, packages/image-compose/src/manifest.ts, packages/image-compose/src/program.ts, packages/image-compose/src/surface.ts, packages/image-compose/src/types.ts, packages/image-compose/test/image-compose.test.ts, packages/image-transform/README.md, packages/image-transform/package.json, packages/image-transform/src/activation.ts, packages/image-transform/src/component.ts, packages/image-transform/src/fragment.ts, packages/image-transform/src/index.ts, packages/image-transform/src/manifest.ts, packages/image-transform/src/program.ts, packages/image-transform/src/surface.ts, packages/image-transform/src/types.ts, packages/image-transform/test/image-transform.test.ts, packages/interview-emoji-reveal/README.md, packages/interview-emoji-reveal/package.json, packages/interview-emoji-reveal/preview/Track.png, packages/interview-emoji-reveal/src/activation.ts, packages/interview-emoji-reveal/src/component.ts, packages/interview-emoji-reveal/src/fragment.ts, packages/interview-emoji-reveal/src/index.ts, packages/interview-emoji-reveal/src/manifest.ts, packages/interview-emoji-reveal/src/program.ts, packages/interview-emoji-reveal/src/style.ts, packages/interview-emoji-reveal/src/surface.ts, packages/interview-emoji-reveal/src/types.ts, packages/markup/README.md, packages/markup/package.json, packages/markup/src/element.ts, packages/markup/src/error.ts, packages/markup/src/frontend.ts, packages/markup/src/host-facet.ts, packages/markup/src/index.ts, packages/markup/src/registry.ts, packages/markup/src/types.ts, packages/markup/test/author-integration.test.ts, packages/media-execution/README.md, packages/media-execution/package.json, packages/media-execution/src/audio-presentation.ts, packages/media-execution/src/execute.ts, packages/media-execution/src/index.ts, packages/media-execution/src/probe.ts, packages/media-execution/src/surface.ts, packages/media-execution/src/toolchain.ts, packages/media-execution/src/webp.ts, packages/media-execution/test/alpha.test.ts, packages/media-execution/test/probe.test.ts, packages/media-execution/test/surface.test.ts, packages/media-execution/test/webp.test.ts, packages/media-pipeline/README.md, packages/media-pipeline/package.json, packages/media-pipeline/src/activation.ts, packages/media-pipeline/src/audio-plan.ts, packages/media-pipeline/src/component.ts, packages/media-pipeline/src/fragment.ts, packages/media-pipeline/src/index.ts, packages/media-pipeline/src/manifest.ts, packages/media-pipeline/src/operations.ts, packages/media-pipeline/src/selection.ts, packages/media-pipeline/src/surface.ts, packages/media-pipeline/src/types.ts, packages/media-pipeline/test/manifest.test.ts, packages/media-pipeline/test/presentation.test.ts, packages/media-pipeline/test/selection.test.ts, packages/media-track-studio/README.md, packages/media-track-studio/package.json, packages/media-track-studio/src/activation.ts, packages/media-track-studio/src/index.ts, packages/media-track/README.md, packages/media-track/package.json, packages/media-track/preview/Track.png, packages/media-track/preview/build.svrun, packages/media-track/preview/flush.png, packages/media-track/preview/preview.svml, packages/media-track/preview/recipes.svs, packages/media-track/preview/rounded.png, packages/media-track/src/activation.ts, packages/media-track/src/author.ts, packages/media-track/src/component.ts, packages/media-track/src/fragment.ts, packages/media-track/src/index.ts, packages/media-track/src/layers.ts, packages/media-track/src/lower.ts, packages/media-track/src/manifest.ts, packages/media-track/src/motion.ts, packages/media-track/src/presentation.ts, packages/media-track/src/program.ts, packages/media-track/src/sampling.ts, packages/media-track/src/sequence.ts, packages/media-track/src/sounds.ts, packages/media-track/src/surface.ts, packages/media-track/src/types.ts, packages/media-track/test/media-track.test.ts, packages/media/README.md, packages/media/package.json, packages/media/src/activation.ts, packages/media/src/component.ts, packages/media/src/frame-range.ts, packages/media/src/identity.ts, packages/media/src/index.ts, packages/media/src/manifest.ts, packages/media/src/render.ts, packages/media/src/schema.ts, packages/media/src/surface.ts, packages/media/src/types.ts, packages/media/test/asset-surface.test.ts, packages/media/test/font-surface.test.ts, packages/mimo-speech/README.md, packages/mimo-speech/package.json, packages/mimo-speech/src/activation.ts, packages/mimo-speech/src/fragment.ts, packages/mimo-speech/src/index.ts, packages/mimo-speech/src/surface.ts, packages/mimo-speech/test/mimo-speech.test.ts, packages/minimax-h3/README.md, packages/minimax-h3/package.json, packages/minimax-h3/src/activation.ts, packages/minimax-h3/src/index.ts, packages/minimax-h3/src/surface.ts, packages/model-kit/README.md, packages/model-kit/package.json, packages/model-kit/src/index.ts, packages/model-kit/test/model-kit.test.ts, packages/nano-banana/README.md, packages/nano-banana/package.json, packages/nano-banana/src/activation.ts, packages/nano-banana/src/index.ts, packages/nano-banana/src/surface.ts, packages/narrative/README.md, packages/narrative/package.json, packages/narrative/src/activation.ts, packages/narrative/src/component.ts, packages/narrative/src/identity.ts, packages/narrative/src/index.ts, packages/narrative/src/manifest.ts, packages/narrative/src/schema.ts, packages/narrative/src/selection.ts, packages/narrative/src/types.ts, packages/package-loader-node/README.md, packages/package-loader-node/package.json, packages/package-loader-node/src/contribution.ts, packages/package-loader-node/src/distribution-resolution.ts, packages/package-loader-node/src/index.ts, packages/package-loader-node/src/module-scope.ts, packages/package-loader-node/src/types.ts, packages/package-loader-node/test/distribution-resolution.test.ts, packages/package-loader-node/test/loader.test.ts, packages/package-loader-node/test/location.test.ts, packages/package-loader-node/test/module-scope.test.ts, packages/performance-studio/README.md, packages/performance-studio/package.json, packages/performance-studio/src/activation.ts, packages/performance-studio/src/index.ts, packages/performance-studio/test/companion.test.ts, packages/performance/README.md, packages/performance/package.json, packages/performance/src/activation.ts, packages/performance/src/component.ts, packages/performance/src/index.ts, packages/performance/src/manifest.ts, packages/performance/src/media.ts, packages/performance/src/program.ts, packages/performance/src/style.ts, packages/performance/src/surface.ts, packages/performance/test/performance.test.ts, packages/program-space/README.md, packages/program-space/package.json, packages/program-space/src/activation.ts, packages/program-space/src/index.ts, packages/program-space/src/surface.ts, packages/project-context-node/README.md, packages/project-context-node/package.json, packages/project-context-node/src/index.ts, packages/project-context-node/src/project-context.ts, packages/project-context-node/src/runtime-selection.ts, packages/protocol/README.md, packages/protocol/package.json, packages/protocol/src/build-id.ts, packages/protocol/src/build.ts, packages/protocol/src/error.ts, packages/protocol/src/identity.ts, packages/protocol/src/index.ts, packages/protocol/src/module.ts, packages/protocol/src/value.ts, packages/protocol/test/canonical.test.ts, packages/provider-hyperframes-local/README.md, packages/provider-hyperframes-local/package.json, packages/provider-hyperframes-local/src/activation.ts, packages/provider-hyperframes-local/src/capture-process.ts, packages/provider-hyperframes-local/src/capture-worker.ts, packages/provider-hyperframes-local/src/concurrency.ts, packages/provider-hyperframes-local/src/index.ts, packages/provider-hyperframes-local/src/opaque-capture.ts, packages/provider-hyperframes-local/src/options.ts, packages/provider-hyperframes-local/src/output.ts, packages/provider-hyperframes-local/src/process.ts, packages/provider-hyperframes-local/src/progress.ts, packages/provider-hyperframes-local/src/provider.ts, packages/provider-hyperframes-local/src/sampling.ts, packages/provider-hyperframes-local/test/alpha.test.ts, packages/provider-hyperframes-local/test/capture-process.test.ts, packages/provider-hyperframes-local/test/concurrency.test.ts, packages/provider-hyperframes-local/test/performance.test.ts, packages/provider-hyperframes-local/test/progress.test.ts, packages/provider-hyperframes-local/test/provider.test.ts, packages/provider-hyperframes-local/test/range.test.ts, packages/provider-hypihub/README.md, packages/provider-hypihub/package.json, packages/provider-hypihub/src/index.ts, packages/provider-hypihub/src/mapping.ts, packages/provider-hypihub/src/provider.ts, packages/provider-hypihub/test/oauth.test.ts, packages/provider-hypihub/test/provider.test.ts, packages/provider-hypihub/test/routes.test.ts, packages/provider-hypihub/test/upload.test.ts, packages/provider-image-opencv-local/README.md, packages/provider-image-opencv-local/package.json, packages/provider-image-opencv-local/runtime/raster_execute.py, packages/provider-image-opencv-local/src/activation.ts, packages/provider-image-opencv-local/src/deployment.ts, packages/provider-image-opencv-local/src/index.ts, packages/provider-image-opencv-local/src/program.ts, packages/provider-image-opencv-local/src/provider.ts, packages/provider-image-opencv-local/test/program.test.ts, packages/provider-image-opencv-local/test/provider.test.ts, packages/provider-media-local/README.md, packages/provider-media-local/package.json, packages/provider-media-local/src/activation.ts, packages/provider-media-local/src/index.ts, packages/provider-media-local/src/provider.ts, packages/provider-media-local/test/provider.test.ts, packages/provider-whisperx-local/README.md, packages/provider-whisperx-local/package.json, packages/provider-whisperx-local/src/activation.ts, packages/provider-whisperx-local/src/index.ts, packages/provider-whisperx-local/src/program.ts, packages/provider-whisperx-local/src/provider.ts, packages/provider-whisperx-local/test/program.test.ts, packages/provider-whisperx-local/test/provider.test.ts, packages/ranking-studio/README.md, packages/ranking-studio/package.json, packages/ranking-studio/src/activation.ts, packages/ranking-studio/src/index.ts, packages/ranking-studio/test/companion.test.ts, packages/ranking/README.md, packages/ranking/package.json, packages/ranking/preview/Column.svg, packages/ranking/preview/TierBoard.png, packages/ranking/preview/TierBoard.svg, packages/ranking/preview/TopThree.png, packages/ranking/src/activation.ts, packages/ranking/src/component.ts, packages/ranking/src/fragment.ts, packages/ranking/src/index.ts, packages/ranking/src/manifest.ts, packages/ranking/src/render.ts, packages/ranking/src/schedule.ts, packages/ranking/src/style.ts, packages/ranking/src/surface.ts, packages/ranking/src/tier.ts, packages/ranking/src/types.ts, packages/ranking/test/ranking.test.ts, packages/raster/README.md, packages/raster/package.json, packages/raster/src/activation.ts, packages/raster/src/index.ts, packages/raster/src/manifest.ts, packages/raster/src/program.ts, packages/raster/src/schema.ts, packages/raster/src/types.ts, packages/raster/test/raster.test.ts, packages/render-hyperframes/README.md, packages/render-hyperframes/package.json, packages/render-hyperframes/src/activation.ts, packages/render-hyperframes/src/component.ts, packages/render-hyperframes/src/fragment.ts, packages/render-hyperframes/src/index.ts, packages/render-hyperframes/src/manifest.ts, packages/render-hyperframes/src/product.ts, packages/render-hyperframes/src/surface.ts, packages/render-hyperframes/test/presentation.test.ts, packages/render-hyperframes/test/render.test.ts, packages/resource-store-fs/README.md, packages/resource-store-fs/package.json, packages/resource-store-fs/src/index.ts, packages/resource-store-fs/test/store.test.ts, packages/resource-store-s3/README.md, packages/resource-store-s3/package.json, packages/resource-store-s3/test/store.test.ts, packages/run-markup/README.md, packages/run-markup/package.json, packages/run-markup/src/activation.ts, packages/run-markup/src/frontend.ts, packages/run-markup/src/index.ts, packages/run-markup/src/syntax.ts, packages/run-markup/test/run.test.ts, packages/run/README.md, packages/run/package.json, packages/run/src/candidate.ts, packages/run/src/facet.ts, packages/run/src/frontend-facet.ts, packages/run/src/frontend.ts, packages/run/src/graph.ts, packages/run/src/index.ts, packages/run/src/registry.ts, packages/run/src/resolve.ts, packages/run/src/types.ts, packages/runtime-host-node/README.md, packages/runtime-host-node/package.json, packages/runtime-host-node/src/index.ts, packages/runtime-host-node/test/runtime-host-node.test.ts, packages/runtime-kit/README.md, packages/runtime-kit/package.json, packages/runtime-kit/src/index.ts, packages/runtime-kit/src/request-deadline.ts, packages/runtime-kit/test/registry.test.ts, packages/runtime-local/README.md, packages/runtime-local/package.json, packages/runtime-local/src/actions.ts, packages/runtime-local/src/config.ts, packages/runtime-local/src/control.ts, packages/runtime-local/src/executor.ts, packages/runtime-local/src/host.ts, packages/runtime-local/src/index.ts, packages/runtime-local/src/log.ts, packages/runtime-local/src/process-control.ts, packages/runtime-local/src/process-logs.ts, packages/runtime-local/src/programs.ts, packages/runtime-local/src/result-writer.ts, packages/runtime-local/src/runtime.ts, packages/runtime-local/src/supervisor.ts, packages/runtime-local/src/types.ts, packages/runtime-local/src/worker-process.ts, packages/runtime-local/src/worker.ts, packages/runtime-local/test/concurrency-process.test.ts, packages/runtime-local/test/config.test.ts, packages/runtime-local/test/execution-process.test.ts, packages/runtime-local/test/local.test.ts, packages/runtime-local/test/log.test.ts, packages/runtime-local/test/programs.test.ts, packages/runtime-local/test/rotation-process.test.ts, packages/runtime-local/test/worker-process.test.ts, packages/runtime/README.md, packages/runtime/package.json, packages/runtime/src/capacity.ts, packages/runtime/src/catalog.ts, packages/runtime/src/credentials.ts, packages/runtime/src/execution.ts, packages/runtime/src/index.ts, packages/runtime/src/log.ts, packages/runtime/src/operations.ts, packages/runtime/src/scheduler.ts, packages/runtime/src/submission.ts, packages/runtime/src/types.ts, packages/screen-overlay-studio/README.md, packages/screen-overlay-studio/package.json, packages/screen-overlay-studio/src/activation.ts, packages/screen-overlay-studio/src/index.ts, packages/screen-overlay/README.md, packages/screen-overlay/package.json, packages/screen-overlay/preview/Track.png, packages/screen-overlay/src/activation.ts, packages/screen-overlay/src/component.ts, packages/screen-overlay/src/fragment.ts, packages/screen-overlay/src/index.ts, packages/screen-overlay/src/manifest.ts, packages/screen-overlay/src/program.ts, packages/screen-overlay/src/surface.ts, packages/screen-overlay/src/types.ts, packages/screen-overlay/test/screen-overlay.test.ts, packages/script-studio/package.json, packages/script-studio/src/activation.ts, packages/script-studio/src/index.ts, packages/script-studio/src/projection.ts, packages/script/README.md, packages/script/package.json, packages/script/src/activation.ts, packages/script/src/edit.ts, packages/script/src/error.ts, packages/script/src/format.ts, packages/script/src/index.ts, packages/script/src/lexical.ts, packages/script/src/manifest.ts, packages/script/src/narrative.ts, packages/script/src/parser.ts, packages/script/src/surface.ts, packages/script/src/types.ts, packages/script/test/edit.test.ts, packages/script/test/markup-integration.test.ts, packages/script/test/narrative-views.test.ts, packages/script/test/script.test.ts, packages/seedance-kits/README.md, packages/seedance-kits/kits/broll-v1.svs, packages/seedance-kits/kits/call-v1.svs, packages/seedance-kits/kits/camera-reference-v1.svs, packages/seedance-kits/kits/motion-reference-v1.svs, packages/seedance-kits/kits/podcast-v1.svs, packages/seedance-kits/kits/speaker-v1.svs, packages/seedance-kits/kits/street-interview-v1.svs, packages/seedance-kits/package.json, packages/seedance-kits/test/kits.test.ts, packages/seedance/README.md, packages/seedance/package.json, packages/seedance/src/activation.ts, packages/seedance/src/fragment.ts, packages/seedance/src/index.ts, packages/seedance/src/surface.ts, packages/seedance/test/surface.test.ts, packages/seedream/README.md, packages/seedream/package.json, packages/seedream/src/activation.ts, packages/seedream/src/index.ts, packages/seedream/src/surface.ts, packages/semantic-take-adjust/package.json, packages/semantic-take-adjust/src/activation.ts, packages/semantic-take-adjust/src/component.ts, packages/semantic-take-adjust/src/fragment.ts, packages/semantic-take-adjust/src/index.ts, packages/semantic-take-adjust/src/manifest.ts, packages/semantic-take-adjust/src/program.ts, packages/semantic-take-adjust/src/surface.ts, packages/semantic-take-adjust/src/types.ts, packages/semantic-take-adjust/test/semantic-take-adjust.test.ts, packages/sound-studio/README.md, packages/sound-studio/package.json, packages/sound-studio/src/activation.ts, packages/sound-studio/src/index.ts, packages/sound-studio/test/companion.test.ts, packages/sound/README.md, packages/sound/package.json, packages/sound/src/activation.ts, packages/sound/src/component.ts, packages/sound/src/index.ts, packages/sound/src/manifest.ts, packages/sound/src/program.ts, packages/sound/src/style.ts, packages/sound/src/surface.ts, packages/sound/test/sound.test.ts, packages/source/README.md, packages/source/package.json, packages/source/src/header.ts, packages/source/src/index.ts, packages/source/src/unit.ts, packages/source/test/header.test.ts, packages/spatial/README.md, packages/spatial/package.json, packages/spatial/src/activation.ts, packages/spatial/src/author.ts, packages/spatial/src/component.ts, packages/spatial/src/fragment.ts, packages/spatial/src/geometry.ts, packages/spatial/src/index.ts, packages/spatial/src/manifest.ts, packages/spatial/src/region-timeline.ts, packages/spatial/src/schema.ts, packages/spatial/src/surface.ts, packages/spatial/src/types.ts, packages/spatial/test/spatial.test.ts, packages/speech-alignment/README.md, packages/speech-alignment/package.json, packages/speech-alignment/src/activation.ts, packages/speech-alignment/src/align.ts, packages/speech-alignment/src/component.ts, packages/speech-alignment/src/error.ts, packages/speech-alignment/src/index.ts, packages/speech-alignment/src/local.ts, packages/speech-alignment/src/locate.ts, packages/speech-alignment/src/manifest.ts, packages/speech-alignment/src/normalize.ts, packages/speech-alignment/src/types.ts, packages/speech-alignment/test/speech-align.test.ts, packages/speech-evidence/README.md, packages/speech-evidence/package.json, packages/speech-evidence/src/activation.ts, packages/speech-evidence/src/index.ts, packages/speech/README.md, packages/speech/package.json, packages/speech/src/activation.ts, packages/speech/src/component.ts, packages/speech/src/identity.ts, packages/speech/src/index.ts, packages/speech/src/manifest.ts, packages/speech/src/materialize.ts, packages/speech/src/schema.ts, packages/speech/src/types.ts, packages/speech/test/evidence.test.ts, packages/speech/test/identity.test.ts, packages/store-sqlite/README.md, packages/store-sqlite/package.json, packages/store-sqlite/src/index.ts, packages/store-sqlite/src/store.ts, packages/store-sqlite/test/store.test.ts, packages/studio-adapter/README.md, packages/studio-adapter/package.json, packages/studio-adapter/src/index.ts, packages/studio-adapter/test/identity.test.ts, packages/studio/INSPECTOR.md, packages/studio/LOCALIZATION.md, packages/studio/README.md, packages/studio/index.html, packages/studio/locales/en.json, packages/studio/locales/zh-CN.json, packages/studio/src/fallback-companions.ts, packages/studio/src/localization.ts, packages/studio/src/observe.ts, packages/studio/src/parameters.ts, packages/studio/src/programme.ts, packages/studio/src/shared.ts, packages/studio/src/snapshot.ts, packages/studio/src/storyboard.ts, packages/studio/src/studio-preflight.ts, packages/studio/src/studio-registry.ts, packages/studio/src/studio-trace.ts, packages/studio/src/style.css, packages/studio/src/temporal-edit.ts, packages/studio/src/temporal-graph.ts, packages/studio/src/ui/code.ts, packages/studio/src/ui/dropdown.ts, packages/studio/src/ui/icons.ts, packages/studio/src/ui/library.ts, packages/studio/src/ui/main.ts, packages/studio/src/ui/markers.ts, packages/studio/src/ui/overlay.ts, packages/studio/src/ui/resize.ts, packages/studio/src/ui/selection.ts, packages/studio/src/ui/sidebar-panel.ts, packages/studio/src/ui/timeline.ts, packages/studio/src/ui/zoom.ts, packages/studio/test/attribute-groups.test.ts, packages/studio/test/audio-preview.test.ts, packages/studio/test/build-library.test.ts, packages/studio/test/companion-assembly.test.ts, packages/studio/test/feedback.test.ts, packages/studio/test/localization.test.ts, packages/studio/test/material-companions.test.ts, packages/studio/test/parameter-companions.test.ts, packages/studio/test/parameter-values.test.ts, packages/studio/test/parameters.test.ts, packages/studio/test/preflight.test.ts, packages/studio/test/provenance.test.ts, packages/studio/test/registry.test.ts, packages/studio/test/semantic-gesture.test.ts, packages/studio/test/snapshot-range.test.ts, packages/studio/test/source-transaction.test.ts, packages/studio/test/studio-trace.test.ts, packages/studio/test/temporal-graph.test.ts, packages/svs/README.md, packages/svs/package.json, packages/svs/src/activation.ts, packages/svs/src/format.ts, packages/svs/src/frontend.ts, packages/svs/src/index.ts, packages/svs/src/manifest.ts, packages/svs/src/parser.ts, packages/svs/src/types.ts, packages/svs/test/source-closure.test.ts, packages/temporal-markup/EDITING.md, packages/temporal-markup/README.md, packages/temporal-markup/package.json, packages/temporal-markup/src/index.ts, packages/temporal-markup/src/space.ts, packages/temporal-markup/test/temporal-markup.test.ts, packages/temporal/README.md, packages/temporal/package.json, packages/temporal/src/activation.ts, packages/temporal/src/component.ts, packages/temporal/src/index.ts, packages/temporal/src/location.ts, packages/temporal/src/projection.ts, packages/temporal/src/rational.ts, packages/temporal/src/sample.ts, packages/temporal/src/schedule.ts, packages/temporal/src/types.ts, packages/temporal/test/temporal.test.ts, packages/text/README.md, packages/text/package.json, packages/text/src/activation.ts, packages/text/src/component.ts, packages/text/src/fragment.ts, packages/text/src/frontend.ts, packages/text/src/index.ts, packages/text/src/manifest.ts, packages/text/src/program.ts, packages/text/src/surface.ts, packages/text/src/svs.ts, packages/text/src/types.ts, packages/text/test/text.test.ts, packages/timeline-author/README.md, packages/timeline-author/package.json, packages/timeline-author/preview/Track.png, packages/timeline-author/src/activation.ts, packages/timeline-author/src/component.ts, packages/timeline-author/src/fragment.ts, packages/timeline-author/src/index.ts, packages/timeline-author/src/manifest.ts, packages/timeline-author/src/program.ts, packages/timeline-author/src/surface.ts, packages/timeline-author/src/types.ts, packages/timeline-author/test/program.test.ts, packages/timeline-author/test/surface.test.ts, packages/timeline/README.md, packages/timeline/package.json, packages/timeline/src/activation.ts, packages/timeline/src/component.ts, packages/timeline/src/identity.ts, packages/timeline/src/index.ts, packages/timeline/src/location.ts, packages/timeline/src/manifest.ts, packages/timeline/src/projection.ts, packages/timeline/src/types.ts, packages/transport-aws-lambda/README.md, packages/transport-aws-lambda/package.json, packages/transport-aws-lambda/test/invoker.test.ts, packages/typography-track-studio/README.md, packages/typography-track-studio/package.json, packages/typography-track-studio/src/activation.ts, packages/typography-track-studio/src/index.ts, packages/typography-track/README.md, packages/typography-track/package.json, packages/typography-track/preview/Mask.png, packages/typography-track/preview/Track.png, packages/typography-track/src/activation.ts, packages/typography-track/src/component.ts, packages/typography-track/src/fragment.ts, packages/typography-track/src/index.ts, packages/typography-track/src/manifest.ts, packages/typography-track/src/program.ts, packages/typography-track/src/surface.ts, packages/typography-track/src/types.ts, packages/typography-track/test/typography-track.test.ts, packages/validation/README.md, packages/validation/package.json, packages/validation/src/index.ts, packages/video-cli/README.md, packages/video-cli/package.json, packages/video-cli/src/capture.ts, packages/video-cli/src/compiler.ts, packages/video-cli/src/creation.ts, packages/video-cli/src/index.ts, packages/video-cli/src/media.ts, packages/video-cli/src/package-selection.ts, packages/video-cli/src/process.ts, packages/video-cli/src/studio-distribution.ts, packages/video-cli/src/transcript.ts, packages/video-cli/src/vocabulary.ts, packages/video-cli/test/capture.test.ts, packages/video-cli/test/cli.test.ts, packages/video-cli/test/creation.test.ts, packages/video-cli/test/media.test.ts, packages/video-cli/test/packages.ts, packages/video-cli/test/transcript.test.ts, packages/video-cli/test/vocabulary.test.ts, packages/visual-ir/README.md, packages/visual-ir/package.json, packages/visual-ir/src/activation.ts, packages/visual-ir/src/index.ts, packages/volcengine-matting/README.md, packages/volcengine-matting/package.json, packages/volcengine-matting/src/activation.ts, packages/volcengine-matting/src/index.ts, packages/volcengine-matting/src/surface.ts, packages/volcengine-matting/test/matting.test.ts, packages/whisperx/README.md, packages/whisperx/package.json, packages/whisperx/src/activation.ts, packages/whisperx/src/component.ts, packages/whisperx/src/evidence.ts, packages/whisperx/src/fragment.ts, packages/whisperx/src/index.ts, packages/whisperx/src/manifest.ts, packages/whisperx/src/surface.ts, packages/whisperx/src/transcript.ts, packages/whisperx/src/types.ts, packages/whisperx/test/whisperx.test.ts, packages/workspace-fs-node/README.md, packages/workspace-fs-node/package.json, packages/workspace-fs-node/src/index.ts, packages/workspace/README.md, packages/workspace/package.json, packages/workspace/src/index.ts, packages/yt-dlp/README.md, packages/yt-dlp/package.json, packages/yt-dlp/src/index.ts, pnpm-lock.yaml, pnpm-workspace.yaml, scripts/build-public-type-entry.mjs, scripts/build-public-types.mjs, scripts/pack-distribution.mjs, scripts/tsconfig.public-types.json, services/image-opencv/.python-version, services/image-opencv/README.md, services/image-opencv/package.json, services/image-opencv/pyproject.toml, services/image-opencv/uv.lock, services/whisperx/.python-version, services/whisperx/README.md, services/whisperx/deploy/hypit-whisperx.service.example, services/whisperx/package.json, services/whisperx/pyproject.toml, services/whisperx/src/hypit_whisperx_service/__init__.py, services/whisperx/src/hypit_whisperx_service/__main__.py, services/whisperx/src/hypit_whisperx_service/check.py, services/whisperx/src/hypit_whisperx_service/prepare.py, services/whisperx/tests/test_service.py, services/whisperx/uv.lock, services/yt-dlp/README.md, services/yt-dlp/package.json, services/yt-dlp/pyproject.toml, services/yt-dlp/uv.lock, skills/hypit/SKILL.md, skills/hypit/agents/openai.yaml, skills/hypit/references/creation/brief.md, skills/hypit/references/creation/project-files.md, skills/hypit/references/creation/reference-video.md, skills/hypit/references/creation/script-and-time.md, skills/hypit/references/creation/transformations.md, skills/hypit/references/environment/distribution.md, skills/hypit/references/environment/local-tools.md, skills/hypit/references/environment/model-and-provider.md, skills/hypit/references/environment/profile.md, skills/hypit/references/playbooks/craft/b-roll.md, skills/hypit/references/playbooks/craft/caption-tracking.md, skills/hypit/references/playbooks/craft/captions.md, skills/hypit/references/playbooks/craft/compositing.md, skills/hypit/references/playbooks/craft/examples/conversation-images.md, skills/hypit/references/playbooks/craft/examples/image-direction.md, skills/hypit/references/playbooks/craft/frame-coverage.md, skills/hypit/references/playbooks/craft/generated-dependencies.md, skills/hypit/references/playbooks/craft/graphic-compositions.md, skills/hypit/references/playbooks/craft/image-direction.md, skills/hypit/references/playbooks/craft/sound-mix.md, skills/hypit/references/playbooks/craft/video-direction.md, skills/hypit/references/playbooks/craft/visual-continuity.md, skills/hypit/references/playbooks/craft/voice-and-performance.md, skills/hypit/references/playbooks/craft/voice-direction.md, skills/hypit/references/playbooks/formats/narration-led-demo.md, skills/hypit/references/playbooks/formats/ranking-listicle.md, skills/hypit/references/playbooks/formats/short-drama.md, skills/hypit/references/playbooks/formats/street-interview.md, skills/hypit/references/playbooks/formats/talking-head.md, skills/hypit/references/playbooks/formats/two-person-podcast.md, skills/hypit/references/playbooks/index.md, skills/hypit/references/production/authoring.md, skills/hypit/references/production/browser-capture.md, skills/hypit/references/production/builds.md, skills/hypit/references/production/caption-authoring.md, skills/hypit/references/production/caption-presentation.md, skills/hypit/references/production/component-design.md, skills/hypit/references/production/component-sharing.md, skills/hypit/references/production/component-visuals.md, skills/hypit/references/production/examples/detail.svrun, skills/hypit/references/production/examples/look.svs, skills/hypit/references/production/examples/material.svrun, skills/hypit/references/production/examples/production.svml, skills/hypit/references/production/examples/production.svrun, skills/hypit/references/production/examples/visuals.ts, skills/hypit/references/production/fonts-and-text.md, skills/hypit/references/production/image-operations.md, skills/hypit/references/production/media.md, skills/hypit/references/production/performance.md, skills/hypit/references/production/prompt-kits.md, skills/hypit/references/production/rendering.md, skills/hypit/references/production/review.md, skills/hypit/references/production/runs.md, skills/hypit/references/production/sound.md, skills/hypit/references/production/source-syntax.md, skills/hypit/references/production/spatial.md, skills/hypit/references/production/studio-companions.md, skills/hypit/references/production/studio.md, skills/hypit/references/production/system.md, skills/hypit/references/production/timeline.md, skills/hypit/references/production/track-authoring.md, skills/hypit/references/production/tracks.md, skills/hypit/references/production/video-downloads.md, skills/hypit/references/production/vocabulary.md, test/alpha-video-fixture.ts, test/fixture-resource.ts, test/run.mjs, test/support/video-domain.ts, test/temporal-fixture.ts, test/timeline-fixture.ts, tsconfig.json.
- Style validation permits HTML angle brackets and HyperFrames writes raw style text, but no demonstrated lower-trust value path reaches that sink. Not a confirmed XSS finding.
  - Follow-up prompt: Review deferred unit deferred-style-html-boundary and close its stated proof gap. Paths: packages/visual-ir/src/style.ts, packages/hyperframes/src/document.ts.
- Canonicalization prototype behavior was noted; no global prototype pollution or security-sensitive attacker-to-sink path was established. No vulnerability asserted.
  - Follow-up prompt: Review deferred unit deferred-prototype-sensitive-sink and close its stated proof gap. Paths: packages/protocol/src/canonical.ts.
- Independent confirmation of baseline CSRF; awaiting reconciliation after parent validation.
  - Follow-up prompt: Review deferred unit candidate-studio-cross-origin-focused and close its stated proof gap.
