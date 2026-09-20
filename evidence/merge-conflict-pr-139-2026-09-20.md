# PR #139 合并冲突证据（2026-09-20）

## 背景

- base：远端 `main`，合并 #138 后提交 `caef41b1e76093e20e01b033ea5e8f105d4cc984`
- head：`origin/pr/139`，提交 `396344b8c83bd9e5886944a7071543c4ab60ca60`
- 触发命令：`git merge origin/pr/139 --no-commit --no-ff`
- 共同祖先：以当前 worktree 的 Git 合并结果为准

## 冲突文件

- `src/games/smashup/__tests__/variantBindingRuntime.test.ts`

## 逐块裁决

- 主线版本保留了 `all_stars_full_moon` 与 `bear_cavalry_polar_commando` 的力量修正关系断言。
- #139 版本新增了 `sinister_six_electro` 的 `baseOnly` 与“不生成 POD alias”断言。
- 两组断言覆盖不同派系元数据，没有互相覆盖或改变既有语义，因此合并为同一测试用例，完整保留两边内容。

## 风险与验证

- 主要风险是冲突处理时误删主线已有的派系绑定回归，或遗漏 #139 对 Sinister Six 的新增覆盖。
- 已通过未解决冲突扫描确认该文件已清除冲突标记；待提交后运行普通与严格合并审计。
- worktree 未安装 `node_modules`，不在本轮擅自安装依赖；远端 `quality-gate` 的已有失败另行记录，不把它误报为本次冲突处理已修复。

## 最终结果

- 解决提交：待提交
- 推送目标：PR #139 原 head 分支 `codex/refactor-smashup-variant-binding-metadata`
- 最小补救动作：提交并推送后重新读取 PR 状态，再执行 GitHub merge。
