# 线上反馈收口证据（2026-09-09）

## 本轮口径

- 处理口径：线上真实反馈。
- 初始统计时间：北京时间 2026-09-09 01:52:13。
- 真实读取入口：`https://api.easyboardgame.top/admin-api/feedback`。
- 真实写回入口：无管理 token 时使用生产 Mongo SSH 写入口，本轮接手与回写均为 `writer=mongo-ssh`。
- 本地镜像：`temp/feedback-closeout/status-board.json`，只作为线上状态镜像，不是正式源。

## 初始线上读取

- 命令：`node .spec/skills/feedback-closeout/scripts/triage-open-feedback.mjs --statuses open,in_progress --limit 100 --slots 6 --mark-in-progress`
- 结果：`open=1`，`in_progress=1`，共 2 条未收口代表项。
- 诊断批次：`temp/feedback-closeout/2026-09-08T17-52-09-404Z/summary.json`。
- 已接手反馈：
  - `6a9f3bc5def4f2f0ea835f07`：Smash Up 玩家反馈。
  - `6a9ed318def4f2f0ea835ba9`：基础设施 CPU 自动反馈。

## 反馈结论

### 6a9f3bc5def4f2f0ea835f07

- 反馈原文：`登圣长阶的天赋能力发动之后没有效果`
- 游戏 / 对象：Smash Up，圣骑士派系战术牌 `登圣长阶`，贴附在 `年迈导师` 上。
- 效果描述原文（来源：`public/locales/zh-CN/game-smashup.json` 当前运行文案）：`打出在一个你的随从上。\n持续能力：每当这个随从使用天赋能力后，在此随从上放置一个 +1 力量指示物。天赋能力：如果本随从力量至少为 4 且场上没有神圣炽天使，则打出神圣炽天使到这里并将本战术返回手牌。`
- 真实现场：操作记录里两次出现 `天赋触发： 登圣长阶  → 修道院`，但没有打出 `神圣炽天使`；当时 `年迈导师` 基础力量 2、+1 指示物 3，总力量为 5。
- 本地真相源：`evidence/smashup/2026-07-07-paladin-diy-intake-contract.md` 中 `登圣长阶` 合同写的是“若力量 ≥4 且无炽天使，可打出炽天使并返回本战术”。
- 根本机制：实现错误地检查“+1 指示物数量是否大于 4”，而不是检查随从当前总力量是否至少为 4；所以线上这个总力量 5、指示物 3 的真实局面会被静默判为不满足条件。
- 本轮修复：`src/games/smashup/abilities/paladins.ts` 改为用当前有效力量判定；`public/locales/zh-CN/game-smashup.json` 和 `public/locales/en/game-smashup.json` 同步把展示文本改为“力量至少为 4 / power 4 or more”。
- 回归测试：`src/games/smashup/__tests__/abilities/paladins.test.ts` 将 `登圣长阶` 用例改成宿主随从总力量达标但指示物不足 5 的场景，防止再次退回到按指示物数量判断。
- 漏审复盘：这次不是“没有审计维度”，而是旧执行没有真正按语义维度审到底。`evidence/smashup/2026-07-07-paladin-diy-intake-contract.md` 已写出 `登圣长阶` 应按“力量 ≥4”判断，但当时状态只写成“可玩 handler + 测试”，没有逐句追到实现到底读取“当前总力量”还是“+1 指示物数量”；旧测试又把宿主设成基础力量 2、指示物 5，导致正确实现和错误实现都会通过。
- 规范回代：已有审计主源本来要求“规则描述拆成原子语义并追实现消费点和最终权威状态”，已有回归收口标准也要求“漏审复盘和规范回代”。本轮实际缺口是反馈收口流程没有把这两项变成每条真 bug 的硬门槛，所以已更新 `.spec/skills/feedback-closeout/SKILL.md`：规则 / 效果类反馈必须带效果描述原文，真 bug 收口必须说明漏审原因和是否更新唯一规范源。

### 6a9ed318def4f2f0ea835ba9

- 反馈原文：`[system][infra-cpu-watch] game-server CPU sustained high: average=100.84% highSamples=3/3 threshold=80% decision=restarted restarted=yes`
- 现实含义：生产游戏服务连续 3 次 CPU 高于 80%，平均 100.84%，CPU 看门脚本已执行重启并上报系统反馈。
- 现场证据：生产文件 `/home/admin/BoardGame/logs/game-server-cpu-watch/20260907T150602Z-boardgame-game-server.txt` 记录采样 `86.09%`、`112.12%`、`104.30%`，并留有 `/home/admin/BoardGame/logs/game-server-cpu-watch/20260907T150602Z-boardgame-game-server.cpuprofile`。
- 当前恢复证据：北京时间 2026-09-09 01:55 左右，生产容器 `boardgame-game-server` 已运行约 27 小时；最近 CPU watch 多轮为 `decision=ok`、`highSamples=0/3`。
- 生产版本：`boardgame-game-server` 镜像 revision 为 `416e154d7b504a63c99c1f1cb6fae077f7e3b809`，该版本已包含 2026-09-05 之后上线的“清理存储已消失房间时卸载内存活跃对局”修复；现场日志也出现过 `[GameTransport] unloaded active matches missing from storage`。
- Profile 核验：已下载到 `temp/feedback-closeout/2026-09-08T17-52-09-404Z/20260907T150602Z-boardgame-game-server.cpuprofile`，用 `analyze-cpu-feedback.mjs` 统计后，热点集中在 `tryExecuteOnlineAiImmediateAction` / `executeOnlineAiLegalActionRecovery` 触发后的状态广播、投影序列化、diff 和 `setState`。
- 日志核验：下载的现场文件里，同一 Dice Throne 对局 `3uEIQpc_Wdd` 命中 14 条相关日志；有 3 条 `SYS_INTERACTION_CANCEL` 过期错误，以及多条玩家 `PLAY_CARD card-double` 因客户端状态号过旧被拒绝，状态号从 `838` 附近快速推进到 `1157` 附近。
- 当前判断：这条只确认了 CPU 高水位触发、自动重启止血和当前恢复；本轮新增证据把嫌疑范围缩到“在线 AI 恢复 / 状态广播 / 保存链路在特定 Dice Throne 对局中高频推进”，但还没有闭环到单一业务根因或可安全修改的代码 owner。
- 状态：保持 `in_progress`，不写 `resolved`。继续收口需要把 CPU profile 与该对局的状态推进 / AI 恢复链路做专项定位，或由用户决定仅按“自动重启后恢复、根因未定位”关闭。

## 验证

- `node scripts/infra/vitest-cli-safe.mjs run src/games/smashup/__tests__/abilities/paladins.test.ts --configLoader native`：1 个测试文件通过，14 passed。
- `node scripts/infra/vitest-cli-safe.mjs run src/games/smashup/__tests__/cardI18nIntegrity.test.ts --configLoader native`：1 个测试文件通过，26 passed。
- `npx eslint src/games/smashup/abilities/paladins.ts src/games/smashup/__tests__/abilities/paladins.test.ts`：通过。
- `node -e "JSON.parse(...)"` 检查中英文 `game-smashup.json`：通过。
- `npm run typecheck`：通过。
- 本地镜像初始化：`node .spec/skills/feedback-closeout/scripts/sync-feedback-status-board.mjs temp/feedback-closeout/2026-09-08T17-52-09-404Z/summary.json`：同步 2 条到 `temp/feedback-closeout/status-board.json`。
- 玩家反馈状态回写：`node .spec/skills/feedback-closeout/scripts/finalize-feedback-group.mjs temp/feedback-closeout/2026-09-08T17-52-09-404Z/summary.json 6a9f3bc5def4f2f0ea835f07 resolved ...`：通过生产 Mongo SSH 写回，`finalStatus=resolved`。

## 最终回查

- 最终线上回查时间：北京时间 2026-09-09 01:59:07。
- 命令：`node .spec/skills/feedback-closeout/scripts/triage-open-feedback.mjs --statuses open,in_progress --limit 100 --slots 6 --out-dir temp/feedback-closeout/2026-09-09-final-recheck`
- 结果：`open=0`，`in_progress=1`，剩余 1 条代表项：`6a9ed318def4f2f0ea835ba9`。
- 线上精确回读：`6a9f3bc5def4f2f0ea835f07` 为 `resolved`，`resolvedMethod` 已写入；`6a9ed318def4f2f0ea835ba9` 为 `in_progress`。
- 本地镜像同步：`node scripts/db/sync-feedback-board-last-fetched-status.mjs --apply --board temp/feedback-closeout/status-board.json`：更新 1 条镜像状态字段。
- 本地镜像校验：`node scripts/verify/verify-feedback-status.mjs temp/feedback-closeout/status-board.json`：`feedback-status: ok`。

## 剩余风险

- 本轮没有执行生产部署；Smash Up 代码修复进入线上仍需要后续按正式发布链路部署。
- CPU 自动反馈仍未解决根因，不能把“当前 CPU 正常”表述为根因已修复。
