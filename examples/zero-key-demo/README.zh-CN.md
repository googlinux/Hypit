# 零 API Key 视频示例

9 秒、1280 × 720、30 fps 的三幕文字短片，用于验证本地渲染和 MP4 导出。含静音音轨，无 AI 配音；文字、背景与字体都在本地处理。无需模型 API Key，也不调用付费 Provider。首次准备依赖需要访问 npm 和浏览器下载源。

## 从示例目录运行

需要已安装 Hypit、兼容的 Node.js、FFmpeg 和 FFprobe；后两者需在 PATH 中可用。

```bash
cd examples/zero-key-demo
hypit runtime use ./hypit.runtime.json
hypit packages install hyperframes@0.7.101
hypit packages install @hyperframes/engine@0.7.101
hypit packages install @hyperframes/producer@0.7.101
hypit runtime up
hypit check render.svrun
hypit plan render.svrun
hypit build render.svrun --title "Zero-key local demo" --follow
```

将上一步返回的构建 ID 替换到以下命令：

```bash
hypit get <build-id> --output final.video --to ./zero-key-demo.mp4
```

打开交互预览：

```bash
hypit studio --run ./preview.svrun --runtime ./hypit.runtime.json
```

已部署的 Studio 需要以该项目的工作区和运行配置重新启动；在“设置 → 运行环境”应看到 `media.local` 和 `hyperframes.local`。生成结果在同一工作区的作品库中。服务器生产部署继续保留访问密码和 HTTPS 参数。

## 修改与再生成

- `scene.svml`：修改三段文字、背景颜色、画布大小与时间。
- `styles.svs`：调整字号和排版。
- `preview.svrun`：只预览组合画面。
- `render.svrun`：导出 `final.video`，执行画面渲染、静音音轨生成与封装。
- `hypit.runtime.json`：仅启用本地 Provider；不是默认 starter 中的远程服务配置。

修改后重新执行 `hypit build render.svrun --follow` 和 `hypit get`。预览成功不代表 MP4 已生成；以构建完成和实际 MP4 为准。

已在 Debian 13、Node.js 24.14.1 上实际导出并检查：H.264 视频、AAC 静音音轨、270 帧、9 秒。生产安装包的渲染子进程会继承主进程选定的模块解析配置，无需开发仓库的 workspace 链接。
