# 大杀四方《半场战争》四派系批次审计回写

## 基本信息

- 对象：忍者神龟、特种部队杰拉尔德、宇宙的巨人希曼、珍珠和幻像
- 日期：2026-09-18
- 主真相源：`src/games/smashup/data/factions/half_the_battle.ts`、`src/games/smashup/abilities/half_the_battle.ts`、`src/games/smashup/__tests__/abilities/half-the-battle.test.ts`、`smashup-half-the-battle-four-factions.e2e.ts`
- 当前状态：四派系继续 `in_progress`。本轮完成对象范围与代表链对账，不把 3 条真实入口外推为整批 direct L3/L4。

## 审计范围

- 忍者神龟：14 张唯一卡 + 2 张基地，含 `geckos_hokusai`、`geckos_kandinsky`、`geckos_monet`、`geckos_van_gogh`、`geckos_june`、`geckos_breaking_news`、`geckos_flip_kick`、`geckos_gecko_blimp`、`geckos_gecko_power`、`geckos_gecko_rap`、`geckos_lasagna_party`、`geckos_now_you_know_bullying`、`geckos_masters_teachings`、`geckos_kc_smith`、`base_sewer_hideout`、`base_technoball`。
- 特种部队杰拉尔德：12 张唯一卡 + 2 张基地，含 `gi_gerald_viscount`、`gi_gerald_go_gerald`、`gi_gerald_now_you_know_home_safety`、`gi_gerald_mowat`、`gi_gerald_obstruction`、`gi_gerald_sawbones`、`gi_gerald_ski_lift`、`gi_gerald_can_do`、`gi_gerald_mabel_lean`、`gi_gerald_shellback`、`gi_gerald_dice_ninja`、`gi_gerald_rosie`、`base_gi_geralds_base`、`base_uss_banner`。
- 宇宙的巨人希曼：15 张唯一卡 + 2 张基地，含 `rulers_cosmos_gal_woman`、`rulers_cosmos_guy_man`、`rulers_cosmos_andko`、`rulers_cosmos_man_with_arms`、`rulers_cosmos_frogga`、`rulers_cosmos_young_noble`、`rulers_cosmos_armor_of_battle`、`rulers_cosmos_dolts_halfwits_fools_morons`、`rulers_cosmos_fearless_friend`、`rulers_cosmos_magic_weapon`、`rulers_cosmos_myaaah`、`rulers_cosmos_mystic_transference`、`rulers_cosmos_now_you_know_toxic_waste`、`rulers_cosmos_powerful_sword`、`rulers_cosmos_sword_thats_powerful`、`base_power_castle`、`base_slime_pool`。
- 珍珠和幻像：10 张唯一卡 + 2 张基地，含 `pearl_images_pearl`、`pearl_images_crystal`、`pearl_images_ruby`、`pearl_images_topaz`、`pearl_images_alls_right_with_the_world`、`pearl_images_dressing_room`、`pearl_images_jam_all_night_long`、`pearl_images_love_unites_us`、`pearl_images_now_you_know_bike_safety`、`pearl_images_shes_got_the_power`、`pearl_images_truly_outstanding`、`pearl_images_were_up_youre_down`、`base_concert_venue`、`base_recording_studio`。
- 不在本轮范围：POD 变体、远端素材发布、非代表对象的全量浏览器直测、其它半场战争扩展。

## 结论等级

结论等级：`代表性验证，批次仍有残余范围`。

- 领域测试已证明多步选择、随从返回、附着保护、额外行动 / 随从、牌库 / 弃牌堆和力量 / 生命周期局部最终状态。
- 真实入口已证明派系选择页、希瑞的真实天赋链、玩乐一整夜的真实持续战术链；这三条不是 4 派系全部对象的 direct L3/L4。
- 本地源 PNG 缺失、远端资源公开 URL / `HEAD 200` 未闭合，继续作为资源链残余；不把它误说成规则层根因。

## 审计自检表

| 自检项 | 状态 | 证据 |
| --- | --- | --- |
| 对象范围 | `passed` | 4 个正式数组的 51 张唯一卡 + 8 张基地已锁定，具体 ID 见本节。 |
| 真相源状态 | `scoped_debt` | 本地 TS / manifest / intake 合同可用；源 PNG 与远端发布链仍不完整。 |
| 原子语义断言 | `passed_scoped` | `half-the-battle.test.ts` 覆盖代表对象及共享 effect atom；非代表对象保持残余。 |
| 实现消费链 | `passed_scoped` | `half_the_battle.ts`、公共 interaction / ongoing / extra quota 与 base ability 入口均已对账。 |
| 最终权威结果 | `passed_scoped` | 领域测试与 3 条 E2E 回到手牌、牌库底、基地随从、力量、额外额度、triggerQueue / interaction 清理。 |
| 交互真实入口 | `representative_only` | 真实 E2E 只有选择页、希瑞、玩乐一整夜代表链。 |
| 验证证据 | `passed_scoped` | `half-the-battle.test.ts` 通过；E2E 3/3 代表链通过。 |
| 共享影响与代表链依据 | `passed` | `sharedFlowId` 见下表，清楚区分共享链与需要新增 direct L3/L4 的对象。 |
| 缺口分类与范围裁定 | `passed` | 主要是对象级证据和资源发布残余，不将其误归类为已经定位的玩法根因。 |
| 旧 evidence / 旧结论对账回写 | `passed` | 2026-07-28 文档顶部已追加 2026-09-18 当前回写。 |
| 残余范围声明 | `passed` | 明确禁止说四派系完整实装或全面审计已完成。 |

## 共享流程审计与代表链依据

| sharedFlowId | 代表对象 | 一致性核对 | 当前裁定 |
| --- | --- | --- | --- |
| `smashup-half-the-battle-minion-target-choice` | 希瑞、北斋 / 康定斯基等艺术家随从 | 候选生成、来源玩家、目标随从 / 基地、payload、最终手牌 / 牌库底与交互清理已核对。 | 希瑞代表链通过；其它对象仍需 direct L3/L4 或共享判等。 |
| `smashup-half-the-battle-ongoing-base-talent` | 玩乐一整夜、壁虎力量、神秘转移 | 持续行动附着、天赋入口、额外额度、玩家范围、力量限制和回合结束清理已核对。 | 玩乐一整夜代表链通过；不外推整派系。 |
| `smashup-half-the-battle-fusion-card` | 杰拉尔德融合牌、希曼装备牌 | 融合对象、力量 / ability tags、出牌后效果和目标限制由静态数据与 L2 测试核对。 | L2 通过，真实入口仍需扩大。 |

## 原子语义与实现消费

| 派系 | 原子语义 / 实现消费 | 最终权威结果 | 直接证据 | 缺口分类 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 忍者神龟 | 画家随从天赋 / 持续效果、校园暴力计分后 special、额外行动与基地能力。 | 选择随从返回手牌、额外行动额度、基地力量和交互清理在领域测试中有断言；希瑞不属于本派系，不能替代本派系对象。 | `half-the-battle.test.ts` + 派系选择页 E2E；无本派系玩法 direct L3/L4 全量。 | `representative_only` / 资源链残余。 | `in_progress` |
| 特种部队杰拉尔德 | 融合牌出牌、挡路 / 外科医生 / 老水手目标选择、额外效果和基地能力。 | 融合牌拆分与目标选择在领域测试中有最终状态；无整派系浏览器直测。 | `half-the-battle.test.ts`；派系选择页代表入口。 | `representative_only` / 资源链残余。 | `in_progress` |
| 宇宙的巨人希曼 | 希瑞、希曼、奥克、邓肯武士、青蛙人、武器 / 保护 / 转移与基地能力。 | 希瑞天赋真实链将临时战术置于牌库底并清空 interaction；其它对象主要为 L2。 | 3/3 E2E 中希瑞真实天赋链；`half-the-battle.test.ts`。 | `representative_only` / 资源链残余。 | `in_progress` |
| 珍珠和幻像 | 珍珠 / 水晶 / 红宝石 / 黄玉、玩乐一整夜、力量与基地链。 | 玩乐一整夜真实链完成额外低力随从额度与奖励；其余对象缺整批 direct L3/L4。 | 3/3 E2E 中玩乐一整夜真实持续战术链；`half-the-battle.test.ts`。 | `representative_only` / 资源链残余。 | `in_progress` |

## 缺口分类与范围裁定

| 条目 | 分类 | 现实影响 | 最小补救 |
| --- | --- | --- | --- |
| 非代表对象 direct L3/L4 | 审计证据缺口 | 当前只能证明共享链和代表对象，不能证明每张卡从真实牌桌可操作并正确收口。 | 按 51 张卡 + 8 张基地对象表补真实入口，或为同一 sharedFlow 建立逐项判等证据。 |
| 本地源 PNG 缺失 | 真相源 / 资源缺口 | 不能完成原始图件到压缩产物的完整回查。 | 恢复正式源图后重跑资源合同与 manifest 校验。 |
| 远端资源公开回查 | 发布链阻塞 | 不能声称服务器资源已发布。 | 具备凭据后上传并验证代表 URL `HEAD 200`。 |

## 验证证据

- `src/games/smashup/__tests__/abilities/half-the-battle.test.ts`：定向领域行为测试通过，覆盖多个新增对象的最终状态、负向和清理。
- `node scripts/infra/run-e2e-single.mjs ci e2e/smashup/smashup-half-the-battle-four-factions.e2e.ts`：3/3 代表性真实入口通过，包含四派系选择页、希瑞真实天赋、玩乐一整夜真实持续战术。
- 证据限制：3 条通过只覆盖上述代表链，不覆盖 4 派系全部对象，不覆盖远端资源发布。

## 修订或失效记录

- 旧文档已经在 2026-08-19 将“四派系完成”降级为代表性验证；本轮继续沿用该降级，不重新摘牌。

## 残余范围声明

本文件完成半场战争四派系当前对象范围、共享流程和代表链对账；四派系仍保留 `in_progress`，直到非代表对象 direct L3/L4 与资源链残余分别关闭。
