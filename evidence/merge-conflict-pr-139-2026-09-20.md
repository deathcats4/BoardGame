# PR #139 合并冲突证据（2026-09-20）

## 背景

- base：远端 `main`，当前提交 `0e4401d07c5fedf22c1938e1cc4ccbaf8371fafa`
- head：PR #139 源分支 `deathcats4/BoardGame:codex/refactor-smashup-variant-binding-metadata`
- 合并工作树：`D:\gongzuo\webgame\BoardGame-merge-pr139-20260920`
- 共同祖先：`caef41b1e76093e20e01b033ea5e8f105d4cc984`
- 触发命令：`git merge origin/main --no-commit --no-ff`

## 冲突文件

- `src/games/smashup/domain/reactionResources.ts`

## 逐块裁决

- `main` 新增了 `commutativeOperation` 元数据，只对“独立持续行动被拆下并分别进入同一弃牌区”的场景放宽排序。
- PR 分支把所有共享 `playerDiscard` 写入都视为无需排序，范围过宽，可能错误放行其他会改变弃牌区语义的操作。
- 保留 `main` 的窄规则：双方必须都是同类持续行动拆除、都不打开交互、共享写入只能是弃牌区、卡实例必须不同，且不存在交叉读写；否则仍按普通资源冲突排序。

## 风险与验证

- 主要风险是为了解决一个并发弃牌场景而放宽全部弃牌操作的顺序约束，导致真实存在依赖关系的触发器并发执行。
- 已清除 `reactionResources.ts` 的 Git 冲突标记，并确认当前合并状态没有未解决冲突。
- Smash Up 相关验证通过：4 个测试文件共 119 个测试全部通过。
- `npx tsc --noEmit` 通过。
- `npx eslint src/ --ext .ts,.tsx` 通过，0 个错误；现有 warning 共 1461 条，未新增为阻塞错误。
- `npm run spec:lint` 在主工作树通过；合并工作树缺少宿主依赖的本地入口链接，临时补齐后通过，随后已恢复原工作树结构。
- 普通/严格合并审计待创建双亲合并提交后运行。

## 最终结果

- 解决提交：当前双亲合并提交；最终哈希以 `git show -s --format=%H HEAD` 回查为准。
- 普通合并审计：通过；冲突文件为混合结果，0 个单边覆盖。
- 严格合并审计：通过；未发现完全等于任一父提交的冲突文件。
- 推送目标：PR #139 原 head 分支 `deathcats4/BoardGame:codex/refactor-smashup-variant-binding-metadata`
- 下一步：推送源分支，再回查并合并 PR。
