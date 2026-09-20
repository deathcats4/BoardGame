# 大杀四方《环游世界：国际事件》四派系批次审计回写

## 基本信息

- 对象：相扑手、火枪手、骑警、摔角手
- 日期：2026-09-18
- 主真相源：`src/games/smashup/data/factions/international_incident.ts`、`src/games/smashup/abilities/international_incident.ts`、`2026-07-15-international-incident-effect-atom-matrix.md`
- 当前状态：四派系继续 `in_progress`。本轮确认 L2 全集矩阵和代表性真实入口有效，但未把 14 条 E2E 外推为 59 个对象全部 direct L3/L4。

## 2026-09-19 相扑手单派系回写

- 相扑手已按 12 张唯一卡 + 2 张基地完成单派系逐对象审计，详见 `evidence/smashup/2026-09-19-sumo-wrestlers-audit.md`。
- 本轮确认并修复 3 类真实问题：身体猛击自动取第一位玩家 / 第一来源基地 / 第一目的基地；关胁固定第一目的地且没有跳过入口；相扑新人有手牌时被迫弃牌。
- 修复后相扑手专属真实入口 E2E 已扩为 3 条并全部通过，覆盖相扑手 14/14 对象；相扑手相关领域 / 资源 / 共享反应测试为 57 条通过。
- 四派系共享 E2E 当前为 7 条通过、7 条失败；失败集中在共享选秀虚拟列表定位、其他派系计分前 / 额外行动 / 附着链，不将其外推为相扑手规则失败，也不把四派系批次写成已收口。
- 相扑手规则与逐对象真实入口已闭合；四派系批次仍保留 `in_progress`，原因是其它三派系的非代表入口、共享基线和远端 R2 / CDN 发布链尚未闭合。

### 同类扩审记录

- 搜索范围：相扑手 12 张唯一卡 + 2 张基地，以及国际事件共享移动、随从效果、弃牌触发、临时力量、基地 trigger queue、保护和真实交互响应链。
- 命中项：身体猛击、关胁、相扑新人；三类问题已修复并在新的相扑手 evidence 中逐项记录。
- 未命中项：其他相扑手对象未发现同形的自动取第一项、固定错误目的地或把可选动作强制执行问题；四派系共享失败未命中相扑手专属 E2E。
- 残余扩审范围：其它三派系的非代表对象真实入口、远端 R2 / CDN 公开地址、共享 targetType 基线和其他派系 E2E 失败仍需单独处理；相扑手 14 个对象已完成逐一真实入口覆盖。

## 审计范围

- 相扑手：12 张唯一卡 + 2 张基地，含 `sumo_wrestlers_technique_prize`、`sumo_wrestlers_performance_prize`、`sumo_wrestlers_head_butt`、`sumo_wrestlers_bulking_stew`、`sumo_wrestlers_body_slam`、`sumo_wrestlers_chikara_mizu`、`sumo_wrestlers_grasp_the_belt`、`sumo_wrestlers_fighting_spirit_prize`、`sumo_wrestlers_yokozuna`、`sumo_wrestlers_third_tier`、`sumo_wrestlers_top_tier`、`sumo_wrestlers_rookie_sumo`、`base_heya_training_stable`、`base_the_dohyo`。
- 火枪手：14 张唯一卡 + 2 张基地，含 `musketeers_on_a_roll`、`musketeers_make_way`、`musketeers_en_garde`、`musketeers_biding_time`、`musketeers_to_battle`、`musketeers_one_for_all`、`musketeers_last_stand`、`musketeers_all_for_one`、`musketeers_token_of_affection`、`musketeers_porthos`、`musketeers_athos`、`musketeers_young_musketeer`、`musketeers_dartagnan`、`musketeers_aramis`、`base_bastion_saint_gervais`、`base_the_golden_lily`。
- 骑警：12 张唯一卡 + 2 张基地，含 `mounties_eh`、`mounties_bring_em_in`、`mounties_when_calls_the_badge`、`mounties_always_get_our_man`、`mounties_battle_moose`、`mounties_power_poutine`、`mounties_move_aboot`、`mounties_haich_q`、`mounties_mountie_major`、`mounties_northern_mover`、`mounties_war_canuck`、`mounties_dudlee`、`base_strategic_syrup_reserve`、`base_great_white_north_eh`。
- 摔角手：13 张唯一卡 + 2 张基地，含 `luchadors_quick_set_up`、`luchadors_smart_set_up`、`luchadors_reversal`、`luchadors_pin`、`luchadors_powerful_set_up`、`luchadors_tag_team`、`luchadors_out_for_the_count`、`luchadors_senor_muchoslam_vs_the_monsters`、`luchadors_cheap_pop`、`luchadors_yellow_demon`、`luchadors_senor_muchoslam`、`luchadors_capa_roja`、`luchadors_flor_loca`、`base_ringside`、`base_the_squared_circle`。基地主源以 data 文件和旧 59 行矩阵为准，重复复用基地仍按对象 ID 去重。
- 总范围：旧矩阵已建立 51 张卡牌 + 8 张基地的 59 行对象表；本文件回写四派系状态与当前证据，不重写旧矩阵历史内容。
- 不在本轮范围：远端 R2 / CDN 上传、其它扩展、非代表对象逐张移动端视觉验收。

## 结论等级

结论等级：`L2 对象矩阵通过，L3/L4 代表性验证，批次未收口`。

- 相扑手、火枪手、骑警、摔角手的静态合同和领域行为证据有效。
- 四派系真实入口 E2E 共 14 条用例，其中 7 条通过、7 条失败；已通过样本覆盖真实选秀、代表卡牌、计分前 special、附着行动、触发队列和多个基地能力，但不证明 59 个对象逐项完成。
- 资源发布仍是独立残余：本地压缩资源和 manifest 已有，但远端代表 URL 曾返回 `404` / R2 环境未闭合；因此不移除四派系 `in_progress`。

## 2026-09-19 火枪手单派系回写

- 火枪手 14 张唯一卡牌 + 2 张基地已完成对象级静态、领域和共享流程审计，逐项 evidence 见 `evidence/smashup/2026-09-19-musketeers-audit.md`。
- 本轮补齐并通过圣热尔韦堡垒真实入口：`廉价欢呼` 后由玩家选择己方随从，`团队标记` 后由玩家选择打出基地；额外行动成功消费，interaction / triggerQueue 清空。
- 本轮修正火枪手 7 个静态 fallback 名称与中文 locale 漂移，补资源合同测试；`international-incident.test.ts` 53 条、资源合同 5 条通过。
- 火枪手仍保留 `仍有残余范围`：8 个对象尚未各自补独立浏览器 direct E2E，现有证据为领域测试 + 共享流程判等 + 代表性真实入口；不能外推为四派系批次发布收口。

## 审计自检表

| 自检项 | 状态 | 证据 |
| --- | --- | --- |
| 对象范围 | `passed` | 旧矩阵 59 行、data 文件四派系数组和本文件四组对象清单一致。 |
| 真相源状态 | `scoped_debt` | 本地 TS、图片合同和 manifest 可用；远端资源公开回查未闭合。 |
| 原子语义断言 | `passed_scoped` | 旧矩阵逐对象记录随从效果、行动、附着、额外额度、special、基地能力与负向边界。 |
| 实现消费链 | `passed` | `international_incident.ts`、共享 prompt / trigger / ongoing / base ability handler 已在旧矩阵和当前代码中对账。 |
| 最终权威结果 | `passed_scoped` | 领域测试和 E2E 回到力量指示物、临时力量、手牌、弃牌堆、附着、额外行动、VP、triggerQueue 与 interaction 清理。 |
| 交互真实入口 | `representative_only` | 14 条真实入口 E2E 为代表链，未覆盖 59 对象逐项页面入口。 |
| 验证证据 | `passed_scoped` | `international-incident.test.ts` 43 条定向行为测试通过；真实入口文件 14 条通过。 |
| 共享影响与代表链依据 | `passed` | `sharedFlowId` 见下表，明确配置差异与失效影响面。 |
| 缺口分类与范围裁定 | `passed` | 剩余是 direct L3/L4 和远端资源链残余，不把它们冒充为已定位的玩法根因。 |
| 旧 evidence / 旧结论对账回写 | `passed` | 旧 2026-07-15 矩阵顶部已追加 2026-09-18 当前回写。 |
| 残余范围声明 | `passed` | 明确不能说四派系已完整审计或当前发布口径已收口。 |

## 共享流程审计与代表链依据

| sharedFlowId | 代表对象 | 一致性核对 | 当前裁定 |
| --- | --- | --- | --- |
| `smashup-international-minion-effect` | 技术奖、炖肉、斗志奖 | 触发时机、候选随从、来源玩家、payload、力量指示物 / 临时力量、抽牌和交互清理已核对。 | 代表链通过；其它配置差异仍按旧对象矩阵保留。 |
| `smashup-international-extra-action` | 一为全、全为一、阿拉密斯、快速 Set-Up、圣热尔维堡垒 | 额外行动来源、限制到目标随从 / 基地、消费方式、回合生命周期和 triggerQueue 清理已核对。 | 代表链通过；不外推全派系 direct L3/L4。 |
| `smashup-international-response-window` | 逆转、最后一搏、Capa Roja、阿拉密斯 | beforeScoring / reaction session、玩家提交、目标过滤、最终 VP / 摧毁 / 控制和窗口清空已核对。 | 代表链通过；非代表响应对象仍在残余范围。 |
| `smashup-international-base-ability` | 方形擂台、圣热尔维堡垒、擂台边 | 基地触发时机、目标类型、额外额度 / 抽牌 / 回收、计分后清理已核对。 | 代表链通过；不替代 8 张基地逐项页面证据。 |

## 原子语义与实现消费

| 派系 | 原子语义 / 实现消费 | 最终权威结果 | 直接证据 | 缺口分类 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 相扑手 | 横纲 / 关胁 / 大关 / 相扑新人持续力量与天赋；技术奖、炖肉、斗志奖等力量指示物 / 抽牌 / 多选；两个基地能力。 | 选择随从、力量指示物、临时力量、手牌与基地状态均有 L2 / 真实入口最终状态。 | `international-incident.test.ts`；相扑手专属 E2E 3 条通过，覆盖 14/14 对象。 | 相扑手规则与真实入口已闭合；远端资源公开回查仍为 404。 | `in_progress`（批次发布残余） |
| 火枪手 | 连连获胜、让路、预备姿势、等待时间、一为全、最后一搏、全为一、阿拉密斯等多步额外行动 / special / 附着链。 | 额外额度、目标选择、附着、计分前响应、回合末清理和 VP 结果有代表性最终状态。 | `international-incident.test.ts`；真实 E2E 的全为一、最后一搏、阿拉密斯等。 | 缺全对象 direct L3/L4，资源远端回查未闭合。 | `in_progress` |
| 骑警 | 嗯？、带进来、呼叫警徽、战斗麋鹿、Haich-Q 等响应、保护、移动与基地范围链。 | 目标随从 / 基地、保护、移动、响应窗口清理和力量结果在 L2 / 代表链中有证据。 | `international-incident.test.ts`；真实选秀与计分前 representative。 | 缺全对象 direct L3/L4，资源远端回查未闭合。 | `in_progress` |
| 摔角手 | Quick / Smart Set-Up、逆转、压制、Powerful Set-Up、Tag Team、廉价欢呼、黄色恶魔、Capa Roja 等附着 / special / 计分链。 | 附着行动、宿主、夺控 / 摧毁、抽牌、低力量过滤、VP 和 triggerQueue 清理已有代表链。 | `international-incident.test.ts`；真实 E2E 的逆转、Capa Roja、Set-Up、基地能力。 | 缺全对象 direct L3/L4，资源远端回查未闭合。 | `in_progress` |

## 缺口分类与范围裁定

| 条目 | 分类 | 现实影响 | 最小补救 |
| --- | --- | --- | --- |
| 非代表对象真实入口 | 审计证据缺口 | 其它三派系仍只能证明共享流程与代表对象从牌桌可完成；相扑手 14/14 对象已完成逐对象真实入口。 | 按剩余 45 行对象矩阵补 direct L3/L4，或为每个对象写清共享流程判等依据。 |
| R2 / CDN 远端公开回查 | 发布链阻塞 | 不能声称资源已发布到目标公开地址。 | 具备有效凭据后上传并验证代表 URL `HEAD 200`。 |
| 全局历史 audit property 基线 | 非本批次范围 | 旧 penguins / marvel_villains / skeletons 等失败会污染全局审计命令，但不直接证明国际事件对象失败。 | 另开共享审计基线修复，不在本批次降级国际事件对象实现。 |

## 验证证据

- `src/games/smashup/__tests__/abilities/international-incident.test.ts`：43 条定向行为测试通过。
- `node scripts/infra/run-e2e-single.mjs ci e2e/smashup/smashup-international-incident-four-factions.e2e.ts`：7 条通过、7 条失败；通过样本覆盖选秀、手牌 / 弃牌堆、计分前响应、附着、基地能力、额外额度和队列清理代表链。
- 旧矩阵同时记录了静态 / 资源合同、对象级 effect atom、共享流程、代表链和 R2 阻塞；本文件不扩大其证据覆盖面。

## 修订或失效记录

- 旧矩阵中“L3/L4 只有代表链通过”的结论继续有效，本轮将其明确回写到当前日期和状态表。
- 本轮不移除四派系批次的 `in_progress`：相扑手 14/14 对象真实入口已闭合，但其它三派系的非代表对象和远端发布链仍未闭合。

## 残余范围声明

本文件完成国际事件四派系当前范围、共享流程、最终状态与资源 / 证据缺口的审计分流；四派系仍保留 `in_progress`，直到非代表对象 direct L3/L4 和资源发布链分别完成。
