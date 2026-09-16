# 你好，Hypit：本地入门示例

9 秒，960 × 540，30 fps，三个颜色场景和标题。预览仅使用本地组件与随应用安装的 Inter 字体，不需要 API Key，不调用远程模型。

在仓库根目录运行：

```bash
node bin/hypit.mjs studio --example first-film
```

打开终端打印的 Getting started 地址，点击「带我体验」。不传参数的 `node bin/hypit.mjs studio` 也会打开此示例。

## 试一试

1. 播放或按空格开始 / 暂停，拖动播放头到第 3 秒和第 6 秒观察切换。
2. 选中 `rose` 背景片段，在属性中修改颜色；属性和时间线修改自动保存。
3. 在源码面板打开 `scene.svml`，修改 `Hello, Hypit.` 文本，停止输入后自动保存，也可按 Cmd/Ctrl+S。
4. 从「使用引导 → 示例文件与启动命令」复制当前练习的启动命令，下次继续。

每次以示例模式启动，都会在当前项目 `.hypit/studio-examples/first-film-*` 下创建新副本，已有练习与内置原稿均不会被覆盖。此目录不进入 Git。需要分享时，把完整副本复制到自己的项目目录再提交；源码无需携带密钥。

## 文件作用

- `scene.svml`：画布、时间线、背景轨道、标题轨道以及 Film 组合。
- `styles.svs`：文字大小、对齐、图层顺序、Film 背景。
- `preview.svrun`：将 `main.composition` 设为目标；用于预览，不导出 MP4。

继续已有副本时，在仓库根目录执行 `node bin/hypit.mjs studio --run '副本完整路径/preview.svrun'`。路径包含空格时需要引号。

AI 生成与 MP4 导出是后续步骤，需要对应运行环境、凭据与渲染依赖。此入门示例不会自动执行这些操作。
