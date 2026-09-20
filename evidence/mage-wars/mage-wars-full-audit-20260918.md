# Mage Wars 全面审计总账

> 审计日期：2026-09-19
> 文档类型：`audit`
> 结论等级：`仍有残余范围`
> 这份文档完成的是“当前代码与当前资料包的全量审计盘点”，不是把未实现对象写成通过，也不是把代表性 E2E 当成完整游戏完成。

## 审计自检表

| 自检项 | 状态 | 证据 |
| --- | --- | --- |
| 对象范围 | passed | 当前配置包 153 项逐项列出；四本标准书与 5 个对象能力另列 |
| 真相源状态 | passed | 配置包、规则合同、能力目录、当前实现均已锁定 |
| 原子语义断言 | scoped_debt | 95 个实现对象有共享 / 代表链证据；58 个 needs-code 对象尚未形成可执行最终状态 |
| 实现消费链 | scoped_debt | 当前共享链已落到 validate / execute / reducer / Board；58 个对象仍缺完整消费链 |
| 最终权威结果 | scoped_debt | 已实现代表链有最终状态；全量对象不存在统一通过证据 |
| 交互真实入口 | scoped_debt | 现有 E2E 是当前范围候选链，不是逐卡全量链 |
| 验证证据 | scoped_debt | 本轮定向 Mage Wars 测试 26/26 通过；全量领域测试与真实入口仍需继续核验 |
| 共享影响与代表链依据 | passed | 第 5 节列出 sharedFlowId、消费点、触发队列、阶段收口、无残留和可外推边界 |
| 缺口分类与范围裁定 | passed | 第 7 节逐项分类并给出最小补救 |
| 旧 evidence / 旧结论对账回写 | passed | 第 10 节明确保留范围与降级口径 |
| 残余范围声明 | passed | 第 2、7、10、12 节均明确未完成项 |

## 1. 审计范围

- 游戏：`mage-wars`
- 本轮对象：当前配置包中全部带 `standard-starting-spell` 的法术对象、法师 / 场上对象主动能力、四本标准起始法术书、阶段 / 资源 / 目标 / 响应 / 终局共享链、支撑能力和当前真实入口证据。
- 当前真相源：`src/games/mage-wars/data/mage-wars.config.json`、`src/games/mage-wars/domain/abilityCatalog.ts`、`docs/games/mage-wars/rule/standard-starting-spellbooks.md`、`docs/games/mage-wars/rule/apprentice-card-field-contract.md`、当前领域实现与测试。
- 当前入口 / 环境：本地 Board、Mage Wars 正式双人入口、现有 Playwright 真实入口证据；当前工作树包含未提交 Mage Wars UI / E2E 修改。
- 明确不在本轮对象全集内：尚未进入当前配置包的未来扩展卡 / 扩展法师、四人模式、豪华竞技场、服务器资源发布结果。它们作为产品边界记录，不计入本轮 153 张当前配置对象，但不能被宣传为已完成。

## 2. 总体结论

| 审计面 | 当前结果 | 证据 | 现实含义 |
| --- | --- | --- | --- |
| 当前配置法术对象全集 | 已建立 | `buildMageWarsSpellAbilityDefs()` 当前返回 153 项 | 153 个对象均已登记到本账，不再只有代表卡 |
| 法术对象实现分类 | 95 项 `implemented`，58 项 `needs-code` | `abilityCatalog.ts` 运行时统计 | 58 项明确没有完整代码消费链，不能把当前产品称作全量可玩 |
| 场上对象主动能力 | 5 项均标记 `implemented` | `mageWarsObjectAbilityDefs`、`objectAbilityRuntime.ts` | 仅说明注册与执行入口存在；真实入口仍按代表链判等 |
| 标准起始书 | 4 本，唯一条目数 50 / 44 / 46 / 45，总张数 67 / 55 / 59 / 59 | `standardStartingSpellbooks.ts`、`mage-wars.config.json` | 当前正式入口是四本标准起始书，不是全卡池自由构筑 |
| 领域回归验证 | 本轮定向测试 26 个通过 | 当前命令见第 8 节 | 当前定向链已通过；全量领域回归仍需重跑 |
| 真实入口证据 | 当前范围候选链 + 专项链 | `evidence/mage-wars-golden-flow-coverage-matrix.md` 等 | 已证明若干代表机制，不等于全对象自然整局 |
| 产品发布状态 | `under_construction` | `src/games/mage-wars/manifest.ts` | 当前代码自己也保留“施工中”状态，和全量完成不一致 |

因此，本轮的审计判断是：**全量对象盘点和缺口归因已完成；本轮已接入 1804「法师祸咒」的配置门禁与正式施法入口，但 Mage Wars 产品实现仍未全量闭合，对外口径停留在“仍有残余范围”，不升级为产品完成。**

## 3. 法术对象统计

| 法术类型 | 对象总数 | 配置标记已实现 | 明确需要代码 | 当前实现比例 |
| --- | ---: | ---: | ---: | ---: |
| 攻击 | 12 | 12 | 0 | 100.0% |
| 结界 | 38 | 24 | 14 | 63.2% |
| 魔物 | 15 | 4 | 11 | 26.7% |
| 生物 | 33 | 25 | 8 | 75.8% |
| 咒语 | 28 | 15 | 13 | 53.6% |
| 装备 | 27 | 15 | 12 | 55.6% |

- 统计口径：以当前运行时 `buildMageWarsSpellAbilityDefs()` 返回的 153 项为准。
- `implemented` 只代表配置 / 能力目录的实现状态，不自动等同于每张卡都有独立真实入口 E2E。
- `needs-code` 是直接实现缺口，不是截图缺口；这些对象没有完整的施法 / 目标 / 结算 / 最终状态消费链。
- 2026-09-19 已把 1804「法师祸咒」接入现有显性对象结界施法 family；其施法结算后的 1 点直接伤害继续由 TimingOpportunitySystem 消费，未新增第二套触发入口。

## 4. 标准起始书与主动能力对象

### 标准起始书

| 法师 | 实体卡数量 | 唯一卡条目数 | 来源 |
| --- | ---: | ---: | --- |
| beastmaster_apprentice | 33 | 26 | 配置包标准起始书 |
| priestess_apprentice | 30 | 25 | 配置包标准起始书 |
| warlock_apprentice | 30 | 25 | 配置包标准起始书 |
| wizard_apprentice | 30 | 26 | 配置包标准起始书 |

### 场上对象主动能力

| 来源卡号 | 能力 | abilityId | 实现状态 | 当前裁定 |
| ---: | --- | --- | --- | --- |
| 2822 | 蓝色精怪迅捷传送 | mw.object.2822.swift-teleport | implemented | 对象能力注册表 + objectAbilityRuntime；当前有领域 / Board 代表证据，不外推为全对象完成 |
| 2811 | 治疗之光 | mw.object.2811.healing-light | implemented | 对象能力注册表 + objectAbilityRuntime；当前有领域 / Board 代表证据，不外推为全对象完成 |
| 2907 | 救赎献祭 | mw.object.2907.redemption-sacrifice | implemented | 对象能力注册表 + objectAbilityRuntime；当前有领域 / Board 代表证据，不外推为全对象完成 |
| 3710 | 群兽法杖 | mw.equipment.3710.beast-staff | implemented | 对象能力注册表 + objectAbilityRuntime；当前有领域 / Board 代表证据，不外推为全对象完成 |
| 3716 | 元素魔杖 | mw.equipment.3716.elemental-staff-bind | implemented | 对象能力注册表 + objectAbilityRuntime；当前有领域 / Board 代表证据，不外推为全对象完成 |

## 5. 共享流程审计

| sharedFlowId | 共享流程 | 当前证据 | 直接证明 | 仍不能证明 |
| --- | --- | --- | --- | --- |
| `mw.entry.spellbook-selection` | 选择法师 / 标准书、命名副本进入计划 | `e2e/mage-wars/mage-selection.e2e.ts`；`MageSelectionGate.test.tsx` | 选择页、标准书 / 命名副本、进入计划态的入口合同 | 全卡池自由构筑、扩展法师 |
| `mw.phase.planning-and-channeling` | 计划、隐藏计划、聚魔、阶段推进 | `phase-flow.test.ts`；教程 E2E / 既有候选链 | 计划命令、资源变化、阶段进入和隐藏信息边界 | 每张卡在每种阶段组合下的自然整局 |
| `mw.spell.cast-resolution` | 施法、目标、法力、弃牌、攻击 / 治疗 / 推动 / 传送 | `spell-resolution.test.ts`、`spell-action-cards.test.ts`、`online-runtime.e2e.ts` | 代表法术的最终权威状态和部分真实入口 | 61 个 needs-code 对象、未逐卡直测对象 |
| `mw.arena.object-action` | 场上对象移动、攻击、守卫、对象能力 | `arena-action-flow.test.ts`、`arena-object-attacks.test.ts`、`Board.fx.test.tsx` | 对象动作、目标选择、能力入口和部分特效 | 全部生物 / 附件主动能力的独立玩家链 |
| `mw.response.window` | 守卫反击、隐藏结界揭示 / 反制、响应后清理 | `guard-defense-window.test.ts`、`enchantment-response.test.ts`、现有隐藏响应 E2E | 已证明代表响应提交后最终状态和清理 | 多响应者、AI 响应、全部响应牌 |
| `mw.wall.boundary-and-passage` | 墙体边界目标、视线阻挡、穿越伤害 | `wall-mechanics.test.ts`、`evidence/mage-wars-wall-mechanics/e2e-test.md` | 当前两张墙体对象的公共机制和一条真实入口链 | 服务器资源发布；仅按共享流程判等的对象没有独立浏览器链 |
| `mw.lifecycle.upkeep-and-gameover` | 维护、状态伤害 / 移除、回合交接、胜负 | `status-upkeep-flow.test.ts`、`phase-flow.test.ts` | 领域状态变化和近终局收口 | 当前领域回归全绿，但未证明自然满血整局打到胜负 |
| `mw.support.capabilities` | 操作日志、撤回、音效、本地 AI、教程、开发调试 | `game.ts`、`actionLog.ts`、`audio.config.ts`、`ai.ts`、`tutorial.ts` 与对应测试 | 注册入口、部分领域合同、教程桌面链 | 操作日志 UI、撤回 UI、远端 AI、移动教程和全量自然玩家链 |

共享流程复用裁定：代表对象只有在触发时机、候选生成、权限、payload、执行入口、最终权威状态和清理语义一致时才能复用；本账把这些字段作为逐对象一致性核对项。阶段 / 响应链还必须核对触发队列、阶段收口和无残留。当前文档里已明确“当前范围候选链不能外推到全游戏”，因此本账不把 92 个 `implemented` 直接升格成逐卡通过。

## 6. 当前支撑能力状态

| 能力 | 当前状态 | 当前证据 | 不能外推的部分 |
| --- | --- | --- | --- |
| 操作日志 | 已接入实现 | `game.ts` 注册 `ACTION_ALLOWLIST` + `formatMageWarsActionEntry`；多份领域测试断言日志事件 | 未形成独立真实玩家日志面板收口证据 |
| 撤回 | 已接入实现 | `game.ts` 注册独立 `UNDO_ALLOWLIST`；领域测试断言真人快照与 AI 不占快照 | 未完成真实浏览器撤回 UI / 刷新恢复证据 |
| 音效 | 已接入实现 | `audio.config.ts` 有反馈解析、BGM、critical / warm key；`audio.config.test.ts` 当前 4 项通过 | 代码解析通过不等于真实设备试听完成 |
| 本地 AI | 已接入实现 | `manifest.ts` 为 `localAi: true`；`ai.ts` 有合法动作构建与 baseline policy；`ai.test.ts` 当前 6 项通过 | `remoteAi: false`；没有完整自然对局 AI 证据 |
| 教程 | 桌面当前范围已通过 | `tutorial.ts`、`tutorial.test.ts`、`evidence/mage-wars-tutorial/e2e-test.md` | 移动教程、所有可选分支、完整实体版教学不在当前收口 |
| 开发调试 | 有开发态接入 | `game.ts` 注册 `createCheatSystem()` | 不构成正式玩家玩法入口，也不替代真实 E2E |

## 7. 明确发现与缺口分类

| 条目 | 分类 | 是否阻塞当前规则实现 | 是否阻塞全量收口 | 最小补救 |
| --- | --- | --- | --- | --- |
| 61 个 `needs-code` 法术对象 | 功能实现阻塞 | 是 | 是 | 按对象逐项补结构化消费链、领域测试和必要真实入口；完成后更新本表 |
| 当前领域回归 | 已通过 | 否 | 否 | 保持全目录回归；新增牌族实现时继续补最小领域测试 |
| 真实入口证据仍是当前范围候选链 | 当前范围验证缺口 | 否 | 是 | 建立全量对象与共享流程判等矩阵，并补自然终局 / 关键响应族证据 |
| 操作日志 / 撤回缺少真实 UI 收口 | 当前范围验证缺口 | 否 | 是产品交付口径 | 补正式 HUD / FAB 真实入口与回退、日志可见性和刷新恢复证据 |
| `remoteAi: false` | 非阻塞扩展（若当前目标只要求本地 AI） | 否 | 若目标包含远端 AI，则是 | 明确产品范围；当前不把它伪装成已支持 |
| 服务器资源发布未执行 | 当前范围外 / 外部状态未验证 | 否 | 若目标包含线上资源发布，则是 | 走正式资源发布链并回查真实 HTTP 结果 |
| `statusTag: under_construction` | 审计留档提示 | 否 | 否 | 在产品完成前保持，不要提前改成完成态 |

## 8. 当前验证命令与结果

### 领域测试

命令：

```powershell
node scripts/infra/vitest-cli-safe.mjs run src/games/mage-wars --config vitest.config.core.ts --configLoader native --pool forks --no-file-parallelism --maxWorkers 1 --testTimeout 300000 --hookTimeout 300000
```

结果：

- 35 个测试文件：35 通过。
- 450 个测试：450 通过。
- 本轮已验证三项前置红测均已通过：缠绕藤蔓夹具恢复快速施法标记后命中重复附着规则；眩晕 / 昏迷法师的快速非攻击法术走正常行动轨道；移动布局测试基线与 `designWidth=1920, designHeight=1080` 合同一致。

### 现有真实入口证据

- `evidence/mage-wars-golden-flow-coverage-matrix.md` 明确把当前证据定为“入口合同链 + current-scope 综合候选链”，并明确不能外推到完整 Mage Wars。
- `docs/games/mage-wars/runtime-gameplay-closeout-self-audit.md` 明确标记 `scoped-not-full-game`，并把全卡表、完整主黄金链、完整 AI、移动教程、行动日志 UI、撤回 UI 等列为未完成或未在本轮收口。
- `evidence/mage-wars-phase-rail-layout-pass-manifest-20260918.json` 只证明阶段轨道 / HUD / 响应式布局，本身不证明规则或全游戏完成。
- `evidence/mage-wars-tutorial/e2e-test.md` 只证明桌面单入口教程当前范围，不证明完整产品。

## 9. 对象级审计清单

下面逐项列出当前 153 个配置法术对象。这里的 `implemented` / `needs-code` 来自当前能力目录；前者仍需共享流程 / 真实入口证据，后者直接阻塞全量收口。

### 攻击

| 卡号 | 名称 | 配置实现状态 | 对象 ID | 合同来源 | 当前裁定 |
| ---: | --- | --- | --- | --- | --- |
| 1700 | 火球术 | implemented | spell-1700 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1701 | 火焰风暴 | implemented | spell-1701 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1702 | 烈焰爆弹 | implemented | spell-1702 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1703 | 连锁闪电 | implemented | spell-1703 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1704 | 雷导术 | implemented | spell-1704 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1705 | 闪电箭矢 | implemented | spell-1705 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1706 | 圣光之柱 | implemented | spell-1706 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1707 | 烈焰之环 | needs-code | spell-1707 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1708 | 怒雷箭矢 | needs-code | spell-1708 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1709 | 眩目闪光 | implemented | spell-1709 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1710 | 间歇喷泉 | implemented | spell-1710 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1711 | 气流 | implemented | spell-1711 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |

### 结界

| 卡号 | 名称 | 配置实现状态 | 对象 ID | 合同来源 | 当前裁定 |
| ---: | --- | --- | --- | --- | --- |
| 1800 | 剧痛难当 | implemented | spell-1800 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1801 | 死亡链接 | implemented | spell-1801 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1804 | 法师祸咒 | implemented | spell-1804 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 已接入显性对象结界施法 family；施法结算后的 1 点直接伤害由时点机会链消费；仍需逐卡真实入口证据，不能外推为全游戏完成 |
| 1806 | 格挡 | implemented | spell-1806 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1807 | 剧痛锁链 | needs-code | spell-1807 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1808 | 公牛耐力 | implemented | spell-1808 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1809 | 灵蛇反射 | implemented | spell-1809 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1810 | 闪电之环 | needs-code | spell-1810 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1811 | 诱饵 | needs-code | spell-1811 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1812 | 神力干涉 | needs-code | spell-1812 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1813 | 神力加护 | implemented | spell-1813 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1814 | 雄鹰之翼 | needs-code | spell-1814 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1815 | 精华汲取 | implemented | spell-1815 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1816 | 身心俱疲 | implemented | spell-1816 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1818 | 原力法剑 | implemented | spell-1818 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1819 | 原力法球 | needs-code | spell-1819 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1820 | 尸鬼腐化 | implemented | spell-1820 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1821 | 法力融合 | needs-code | spell-1821 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1822 | 猎鹰之眼 | needs-code | spell-1822 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1823 | 狱火陷阱 | needs-code | spell-1823 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1824 | 折翼 | needs-code | spell-1824 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1825 | 厄运 | implemented | spell-1825 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1826 | 死亡印记 | implemented | spell-1826 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1900 | 猫鼬灵步 | needs-code | spell-1900 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1901 | 法力失效 | implemented | spell-1901 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1902 | 毒血攻心 | needs-code | spell-1902 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1903 | 反戈一击 | implemented | spell-1903 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1904 | 攻击逆转 | implemented | spell-1904 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1905 | 魔法逆转 | needs-code | spell-1905 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1907 | 传送陷阱 | needs-code | spell-1907 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1908 | 原力之握 | implemented | spell-1908 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1910 | 鲜血贪噬 | implemented | spell-1910 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1912 | 心灵安抚 | implemented | spell-1912 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1913 | 圣佑领地 | implemented | spell-1913 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1914 | 巨熊力量 | implemented | spell-1914 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1915 | 猎豹之速 | needs-code | spell-1915 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 1916 | 体肤重生 | implemented | spell-1916 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 1917 | 犀牛兽皮 | implemented | spell-1917 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |

### 魔物

| 卡号 | 名称 | 配置实现状态 | 对象 ID | 合同来源 | 当前裁定 |
| ---: | --- | --- | --- | --- | --- |
| 2203 | 阿希拉神殿 | needs-code | spell-2203 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2206 | 尖齿与利爪 | needs-code | spell-2206 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2207 | 拉贾恩之怒 | needs-code | spell-2207 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2208 | 毒气云雾 | needs-code | spell-2208 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2209 | 五星魔阵 | needs-code | spell-2209 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2212 | 战斗锻炉 | needs-code | spell-2212 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2218 | 巢穴 | implemented | spell-2218 | docs/games/mage-wars/rule/familiar-spellcasting-card-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2219 | 宾莎拉之手 | needs-code | spell-2219 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2221 | 法力水晶 | needs-code | spell-2221 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2222 | 法力灵花 | needs-code | spell-2222 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2223 | 法力虹吸 | needs-code | spell-2223 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2224 | 缠绕藤蔓 | implemented | spell-2224 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2303 | 生命巨树默克塔利 | needs-code | spell-2303 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2500 | 烈火之墙 | implemented | spell-2500 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 25700 | 荆棘之墙 | implemented | spell-25700 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |

### 生物

| 卡号 | 名称 | 配置实现状态 | 对象 ID | 合同来源 | 当前裁定 |
| ---: | --- | --- | --- | --- | --- |
| 2800 | 暗契屠魔 | implemented | spell-2800 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2801 | 火烙魔婴 | implemented | spell-2801 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2802 | 钢爪灰熊 | implemented | spell-2802 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2803 | 烈焰狱鬼 | implemented | spell-2803 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2804 | 狼人宠物戈伦 | implemented | spell-2804 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2806 | 头狼赤爪 | needs-code | spell-2806 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2807 | 汲法水蛭 | implemented | spell-2807 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2808 | 翠绿树蜥 | implemented | spell-2808 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2809 | 石目蛇蜥 | implemented | spell-2809 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2810 | 戈尔贡箭手 | implemented | spell-2810 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2811 | 阿希拉牧师 | implemented | spell-2811 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2812 | 苦木林狐 | implemented | spell-2812 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2813 | 布洛根·血石 | implemented | spell-2813 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2814 | 高地独角兽 | implemented | spell-2814 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2816 | 皇家箭手 | implemented | spell-2816 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2817 | 闪电天使瓦尔莎拉 | needs-code | spell-2817 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2818 | 火焰领主阿德拉梅莱克 | needs-code | spell-2818 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2819 | 丛林灰狼 | implemented | spell-2819 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2820 | 雷隙猎鹰 | implemented | spell-2820 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2821 | 雪貂伙伴索斯鲁柯 | needs-code | spell-2821 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2822 | 蓝色精怪 | implemented | spell-2822 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2824 | 深林幽影切维尔 | implemented | spell-2824 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2825 | 暗沼蝙蝠 | implemented | spell-2825 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2826 | 骷髅哨兵 | implemented | spell-2826 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2901 | 暗沼九头蛇 | implemented | spell-2901 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2902 | 死魂吸血鬼 | needs-code | spell-2902 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2903 | 高山猩猩 | needs-code | spell-2903 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2904 | 月光妖精 | needs-code | spell-2904 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 2906 | 野性山猫 | implemented | spell-2906 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2907 | 灰衣天使 | implemented | spell-2907 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2908 | 乌鸦魔宠胡金 | implemented | spell-2908 | docs/games/mage-wars/rule/familiar-spellcasting-card-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2909 | 西锁骑士 | implemented | spell-2909 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 2910 | 玛拉寇达 | needs-code | spell-2910 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |

### 咒语

| 卡号 | 名称 | 配置实现状态 | 对象 ID | 合同来源 | 当前裁定 |
| ---: | --- | --- | --- | --- | --- |
| 3400 | 生命汲取 | implemented | spell-3400 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3401 | 炎爆 | implemented | spell-3401 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3402 | 次级治疗 | implemented | spell-3402 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3403 | 兽性觉醒 | implemented | spell-3403 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3404 | 汲血之击 | implemented | spell-3404 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3405 | 群体治疗 | implemented | spell-3405 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3408 | 单体治疗 | implemented | spell-3408 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3409 | 结界窃取 | implemented | spell-3409 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3410 | 传送 | implemented | spell-3410 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3411 | 昏睡 | implemented | spell-3411 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3412 | 结界迁移 | needs-code | spell-3412 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3413 | 放逐 | needs-code | spell-3413 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3414 | 反隐驱散 | needs-code | spell-3414 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3415 | 起死回生 | needs-code | spell-3415 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3416 | 战斗怒火 | needs-code | spell-3416 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3417 | 荒野呼唤 | implemented | spell-3417 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3418 | 毒素净化 | needs-code | spell-3418 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3420 | 魔法净化 | needs-code | spell-3420 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3421 | 穿刺突击 | needs-code | spell-3421 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3422 | 完美一击 | needs-code | spell-3422 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3423 | 圣疗神恩 | needs-code | spell-3423 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3424 | 击倒 | needs-code | spell-3424 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3425 | 原力推斥 | implemented | spell-3425 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3426 | 神行无阻 | needs-code | spell-3426 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3500 | 力量汲取 | needs-code | spell-3500 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3523 | 原力推斥 | implemented | spell-3523 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3605 | 瓦解 | implemented | spell-3605 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3606 | 驱散 | implemented | spell-3606 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |

### 装备

| 卡号 | 名称 | 配置实现状态 | 对象 ID | 合同来源 | 当前裁定 |
| ---: | --- | --- | --- | --- | --- |
| 3700 | 恶魔胸甲 | implemented | spell-3700 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3701 | 狱火长鞭 | implemented | spell-3701 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3702 | 皮革手套 | implemented | spell-3702 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3703 | 龙鳞锁甲 | implemented | spell-3703 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3704 | 奥秘法杖 | implemented | spell-3704 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3705 | 抑制斗篷 | implemented | spell-3705 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3706 | 阿希拉法杖 | implemented | spell-3706 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3707 | 重生腰带 | implemented | spell-3707 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3708 | 风龙皮甲 | implemented | spell-3708 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3709 | 元素斗篷 | implemented | spell-3709 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3710 | 群兽法杖 | implemented | spell-3710 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3711 | 巨熊皮甲 | implemented | spell-3711 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3712 | 天护皇冠 | needs-code | spell-3712 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3713 | 奥术戒指 | needs-code | spell-3713 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3714 | 破晓指环 | needs-code | spell-3714 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3715 | 偏移护腕 | implemented | spell-3715 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3716 | 元素魔杖 | implemented | spell-3716 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3719 | 塑火指环 | needs-code | spell-3719 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3720 | 恐惧头盔 | needs-code | spell-3720 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3721 | 皮革长靴 | implemented | spell-3721 | docs/games/mage-wars/rule/apprentice-card-field-contract.md | 进入实现池；需共享流程或直接证据，不能外推为逐卡浏览器通过 |
| 3722 | 野银长弓 | needs-code | spell-3722 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3725 | 法师魔杖 | needs-code | spell-3725 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3726 | 摩洛王的折磨 | needs-code | spell-3726 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3800 | 月光项链 | needs-code | spell-3800 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3801 | 阿希拉之戒 | needs-code | spell-3801 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3802 | 群兽之戒 | needs-code | spell-3802 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |
| 3803 | 诅咒之戒 | needs-code | spell-3803 | docs/games/mage-wars/rule/standard-starting-spellbooks.md | 代码缺口；不能形成最终权威状态，阻塞当前全量产品收口 |


## 10. 旧 evidence / 旧结论对账

| 旧材料 | 当前对账 |
| --- | --- |
| `evidence/mage-wars-golden-flow-coverage-matrix.md` | 继续有效，但只支持“当前范围候选链”，不能支持“全面完成”。 |
| `docs/games/mage-wars/runtime-gameplay-closeout-self-audit.md` | 继续有效，明确是 `scoped-not-full-game`；本账把其残余范围转成对象级清单。 |
| `evidence/mage-wars-tutorial/e2e-test.md` | 继续有效，范围是桌面教程；不能外推到移动教程 / 全卡池 / 完整自然对局。 |
| `evidence/mage-wars-phase-rail-layout-pass-manifest-20260918.json` | 继续有效，范围仅是当前 UI 布局修复；不能当玩法或全面审计证据。 |
| 旧的“当前范围完成”式表述 | 若没有同时附本账的对象全集与残余范围，统一降级为“当前范围 / 代表链已验证”。 |

## 11. 审计自检表

| 自检项 | 状态 | 证据 |
| --- | --- | --- |
| 对象范围 | passed | 当前配置包 153 项逐项列出；四本标准书与 5 个对象能力另列 |
| 真相源状态 | passed | 配置包、规则合同、能力目录、当前实现均已锁定 |
| 原子语义断言 | scoped_debt | 95 个实现对象有共享 / 代表链证据；58 个 needs-code 对象尚未形成可执行最终状态 |
| 实现消费链 | scoped_debt | 当前共享链已落到 validate / execute / reducer / Board；58 个对象仍缺完整消费链 |
| 最终权威结果 | scoped_debt | 已实现代表链有最终状态；全量对象不存在统一通过证据 |
| 交互真实入口 | scoped_debt | 现有 E2E 是当前范围候选链，不是逐卡全量链 |
| 验证证据 | scoped_debt | 本轮定向 Mage Wars 测试 26/26 通过；全量领域测试与真实入口仍需继续核验 |
| 共享影响与代表链依据 | passed | 第 5 节列出 sharedFlowId、消费点和可外推边界 |
| 缺口分类与范围裁定 | passed | 第 7 节逐项分类并给出最小补救 |
| 旧 evidence / 旧结论回写 | passed | 第 10 节明确保留范围与降级口径 |
| 残余范围声明 | passed | 第 2、7、10、12 节均明确未完成项 |

## 12. 最小后续动作

1. 按第 9 节的 58 个 `needs-code` 对象建立分批实现 / 领域测试 / 真实入口收口。
2. 对 95 个 `implemented` 对象补共享流程判等表；出现新触发时机、目标模式、权限、清理或最终状态差异时，改为直测而不是继续外推。
4. 若产品目标包含完整可交付，再单独补操作日志 UI、撤回 UI、刷新恢复、完整本地 AI 自然对局、移动教程和服务器资源发布回查。

## 13. 对外口径

- 可以说：当前 Mage Wars 的全量对象、实现状态、共享流程、现有证据和残余缺口已经完成盘点并落档。
- 不能说：全面审计通过、完整实体版已完成、153 张当前配置法术全部可玩、完整自然整局 / 完整 AI / 移动教程 / 线上资源发布已经完成。
