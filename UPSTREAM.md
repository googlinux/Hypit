# 上游与本仓库维护

本仓库保留 [hypit-ai/hypit](https://github.com/hypit-ai/hypit) 的完整 Git 历史，在此基础上添加中文研究、安全审核文档及安全修复。

| 远端 | 地址 | 用途 |
| --- | --- | --- |
| `origin` | `git@github.com:googlinux/Hypit.git` | 本仓库，推送个人修改 |
| `upstream` | `https://github.com/hypit-ai/hypit.git` | 原项目，获取上游更新 |

Git 的远端配置不会随 clone 传递。首次克隆本仓库后，在仓库目录内配置上游：

```bash
git remote add upstream https://github.com/hypit-ai/hypit.git
git remote -v
```

在工作区干净且本地改动已提交的情况下同步：

```bash
git switch main
git fetch upstream
git merge upstream/main
# 有冲突时先解决、审阅并提交，再推送。
git push origin main
```

使用 merge 保留本仓库新增提交及上游历史，不需要 force push。向 `origin` 推送需要本机配置有效的 GitHub SSH 身份；GitHub App/连接器登录并不自动为命令行 Git 提供凭据。

## 文档

- [中文研究与使用指南](RESEARCH.zh-CN.md)
- [2026-09-15 安全审核报告（公开副本）](research/2026-09-15/security-report.md)
- [2026-09-16 安全修复记录与验证结果](research/2026-09-16/security-fixes.md)
- [报告范围及发布说明](research/README.md)

本次审查基线为 `4894e625fe008415ed9702321699f5dcc069b769`，对应 `package.json` 版本 `0.1.8`。初始文档提交 `c87ff872` 未修改应用源码；后续安全修复已覆盖报告中的五项问题。合并上游时应保留这些边界检查、运行回归测试，并按新代码重新评估相关结论。

原项目的 LICENSE 和版权信息保持原有内容。使用或分发时仍需遵守该许可证中的额外条件。
