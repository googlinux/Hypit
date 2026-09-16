# 从内置示例开始使用 Hypit

需要密码登录、重启后继续同一份作品或通过自己的 HTTPS 域名访问，请看 [个人生产模式](PRODUCTION.zh-CN.md)。下面介绍开发模式的入门操作。

在已安装依赖的仓库根目录运行：

```bash
node bin/hypit.mjs studio
```

打开终端中的 **Getting started** 地址。点击 **带我体验**，会进入真实编辑器的四步引导；也可以点击 **直接打开示例** 自由体验。顶部的 **使用引导** 可随时回到入门页。

全新检出需要先安装依赖：使用项目 `.node-version` 指定的 Node.js，再运行 `pnpm install --frozen-lockfile`。仓库开发环境的完整说明见 [研究与使用说明](RESEARCH.zh-CN.md)。安装版命令可将 `node bin/hypit.mjs` 替换成 `hypit`。

## 1. 看懂示例

内置「你好，Hypit」是 9 秒、960 × 540、30 fps 的短片，包含三个背景场景和一条标题轨道。它使用随应用安装的字体和本地绘制，不需要运行环境、API Key、视频素材下载或模型调用。预览不会产生模型费用。

| 操作 | 方法 |
| --- | --- |
| 播放 / 暂停 | 点击播放按钮，或在未编辑输入框时按空格 |
| 跳到某一时刻 | 点击时间线标尺，或拖动预览下方的进度条 |
| 修改背景色 | 选择 backgrounds 最左侧的 color wash 片段，进入右侧「样式 → Color」，输入颜色后按 Tab |
| 修改标题 | 左侧点击 scene SVML，再点击「编辑源文件」，修改 `Hello, Hypit.`，停止输入后自动保存，也可按 Cmd/Ctrl+S |
| 查看源文件结构 | `scene.svml` 定义内容与时间，`styles.svs` 定义样式，`preview.svrun` 定义目标 |
| 重看引导 | 顶部「使用引导 → 带我体验」；引导支持上一步、下一步、跳过和 Esc 关闭 |

手机上使用编辑器顶部的「预览 / 源文件 / 属性」切换面板；引导会自动切换到当前步骤需要的面板。入门页、命令和设置同样可以在手机尺寸下阅读。

## 2. 保存、继续或重新练习

每次执行 `studio`、`studio --settings`（未提供 `--run`）或 `studio --example first-film`，都会在所选项目的 `.hypit/studio-examples/first-film-*` 下创建一份新的可编辑副本。现有练习与内置原稿不会被覆盖。

属性和时间线修改自动写回副本；源码编辑在停止输入后自动保存，也可按 Cmd/Ctrl+S 立即保存。关闭 Studio 后副本仍保留。进入 **入门与示例 → 示例文件与启动命令** 可复制当前路径和准确的继续命令，例如：

```bash
node bin/hypit.mjs studio --run '/完整路径/.hypit/studio-examples/first-film-xxxxxx/preview.svrun'
```

创建一份新的练习：

```bash
node bin/hypit.mjs studio --example first-film
```

`.hypit/` 被 Git 忽略。需要分享作品时，将完整副本复制到自己的项目目录再提交。运行环境和密钥不在示例文件中。

## 3. 打开自己的项目

```bash
node bin/hypit.mjs studio --run /path/to/project/preview.svrun --workspace /path/to/project
```

也可使用 `--port 5180` 指定端口。在已有项目中，「使用引导」会说明当前编辑的是项目原文件，并提供另开内置示例的命令。不会将当前 Run 替换成示例。

## 4. 接入生成服务

本地预览熟悉后，再准备生成所需的运行环境：

```bash
node bin/hypit.mjs runtime init
node bin/hypit.mjs studio --settings
```

初始化或切换运行环境后应重启 Studio。在终端打印的 Settings 地址打开 **API Key**，保存对应 Provider 的凭据。默认配置使用 HypiHub。详见 [设置与 API Key 管理](SETTINGS.zh-CN.md)。

保存密钥不会测试远程服务，也不会发起生成。主动执行生成类 Run 时，可能产生服务商费用；请先查看该示例的具体说明。

## 预览与导出的区别

此示例的目标是 `main.composition`，用于浏览器预览，**不是 MP4 导出任务**。导出需要具有视频输出目标的 Run、渲染运行环境和相关依赖。参阅 [更多示例](examples/README.md)，其中生成类示例需要额外配置。

内置示例源文件与逐项练习见 [示例说明](packages/studio/examples/first-film/README.zh-CN.md)。
