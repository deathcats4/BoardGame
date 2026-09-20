# 大杀四方冰雪奇缘全量重审：牌面、录入与运行时对账

## 2026-09-19 重审结论

- 原始线上反馈：`冰雪奇缘的效果全是错的`。
- 生产反馈：`6aac10778e41d08302191228`，当前仍为 `in_progress`；本轮不回写终态。
- 本轮不是单点复核，而是重新对照 Frozen 的 15 张牌 + 2 个基地。
- 旧文档 `evidence/smashup/2026-09-01-frozen-closeout.md` 的“17 个对象全部 passed”结论失效，原因是它把局部测试和旧录入结果外推成整派系正确。
- 当前判定：`blocked / rework_required`。牌面真相已锁定，但实现、中文/英文录入、测试和真实入口仍需按新规则重做。

## 真相源与对照源

### 主真相源

- 中文 Frozen 卡图：`public/assets/i18n/zh-CN/smashup/cards/compressed/disney_four_factions.webp`，图集 6 x 10，Frozen 卡槽为 15-29。
- 中文 Frozen 基地图：`public/assets/i18n/zh-CN/smashup/base/compressed/disney_four_faction_bases.webp`，Frozen 基地槽为 8-9。
- 对应运行时对象索引：`src/games/smashup/data/factions/frozen.ts`。

### 实现与录入对照

- 运行时效果：`src/games/smashup/abilities/disney_four_factions.ts`。
- 中文/英文录入：`public/locales/zh-CN/game-smashup.json`、`public/locales/en/game-smashup.json`。
- 旧测试：`src/games/smashup/__tests__/abilities/disney-four-factions.test.ts`。
- 线上原始反馈与操作日志：`temp/feedback-closeout/20260919-continue/6aac10778e41d08302191228.md`。

## 对象级审计矩阵

状态含义：`confirmed_mismatch` = 牌面与当前录入/实现明确不一致；`partial` = 牌面与部分实现一致但仍缺完整行为验证；`blocked` = 旧证据不能继续作为放行依据。

| 对象 | 牌面规则原子 | 当前实现/录入 | 当前状态 | 最小修复范围 |
| --- | --- | --- | --- | --- |
| 迷你雪人 `frozen_snowgie` | 这里有力量 5+ 的角色时，在该角色上放置 +1 力量标记 | 当前改为选择这里任意角色并临时 +1 | `confirmed_mismatch` | 候选只保留同基地力量 5+；改为力量标记 |
| 棉花糖 `frozen_marshmallow` | 持续：如果艾莎在这里，棉花糖 +2 | 当前检查是否有敌方棉花糖并 -1 | `confirmed_mismatch` | 改为同基地己方艾莎条件 +2 |
| 雪宝 `frozen_olaf` | 天赋：查看牌库顶两张，任意数量弃置，其余任意顺序放回牌库顶 | 当前移动己方角色并抽 1 张 | `confirmed_mismatch` | 新增两张查看、逐张弃置、余牌排序 |
| 斯文 `frozen_sven` | 天赋：移动己方角色到这里，或搜索安娜/艾莎并抽取 | 当前从弃牌堆回收力量 4 或更低角色 | `confirmed_mismatch` | 新增双模式选择与指定卡搜索 |
| 安娜 `frozen_anna` | 搜索安娜/艾莎并抽取；持续保护这里其它己方角色不被其他玩家牌摧毁 | 当前只在克里斯托弗同基地时保护安娜 | `confirmed_mismatch` | 新增搜索；保护对象改为同基地其它己方角色且仅限摧毁 |
| 克里斯托弗 `frozen_kristoff` | 持续：同基地有安娜或艾莎时自身 +2；天赋搜索安娜/艾莎并抽取 | 当前仅在安娜同基地时 +2，无天赋 | `confirmed_mismatch` | 扩大条件；新增搜索天赋 |
| 艾莎 `frozen_elsa` | 天赋：从手牌/弃牌堆额外打出雪宝或迷你雪人，或把弃牌堆棉花糖拿回手牌 | 当前选择基地并压低该基地对手角色 | `confirmed_mismatch` | 改为卡牌来源与三种目标的真实选择链 |
| 真爱的行为 `frozen_act_of_true_love` | 摧毁己方角色，从弃牌堆额外打出另一个角色 | 当前抽 1 张并保护己方角色 | `confirmed_mismatch` | 先选并摧毁己方角色，再从弃牌堆额外打出角色 |
| 夏天大盛宴 `frozen_big_summer_blowout` | 丢弃一张牌，把弃牌堆一个角色拿回手牌 | 当前按基地己方角色数抽牌 | `confirmed_mismatch` | 新增弃牌选择与弃牌堆角色回手 |
| 你想和我堆个雪人吗 `frozen_do_you_want_to_build_a_snowman` | 从弃牌堆额外打出棉花糖、雪宝或迷你雪人 | 当前从牌库/弃牌堆回收至多两张迷你雪人 | `confirmed_mismatch` | 改为弃牌堆限定、三类 Frozen 角色、额外打出 |
| 冻结的港口 `frozen_frozen_port` | 持续：其他玩家若本回合能在其它基地打出角色，其第一个角色不能打到这里 | 当前拦截角色移动，不拦截正常打出 | `confirmed_mismatch` | 改为“每回合首个角色的目标基地”限制 |
| 汉斯·韦斯特加德 `frozen_hans_westergaard` | 每个玩家展示手牌中的一个角色，或展示没有角色；展示的角色洗入各自牌库 | 当前在目标基地摧毁力量 3 或更低角色 | `confirmed_mismatch` | 新增所有玩家依次展示/选择与回牌库 |
| 放手吧 `frozen_let_it_go` | 查看牌库顶三张，抽一张，剩余牌任意顺序进入弃牌堆和/或牌库顶 | 当前选择己方角色回手并获得额外行动 | `confirmed_mismatch` | 新增三张查看、抽一张、逐张去向与排序 |
| 锁上大门 `frozen_lock_the_gates` | 持续：这里的己方角色不被其他玩家牌摧毁；天赋查看牌库顶并弃掉或放回 | 当前阻止其他玩家打出力量 3 或更低角色 | `confirmed_mismatch` | 改为摧毁保护；新增天赋查看顶牌 |
| 驯鹿的心地比人好 `frozen_reindeers_are_better_than_people` | 搜索角色；牌库重洗；力量 3 以下额外打出，否则弃掉 | 实现大体接近牌面，但中文/英文 locale 仍是 +2/+4 力量旧文案 | `confirmed_mismatch` | 保留实现方向，修正文案并补边界验证 |
| 冰宫 `base_ice_palace` | 这里的角色不能被其他玩家牌摧毁或移动 | 当前有对手时角色有效力量 -1 | `confirmed_mismatch` | 改为同基地角色的摧毁/移动保护 |
| 阿伦黛尔 `base_arendelle` | 打出角色到这里后，查看牌库顶两张，抽一张，剩余放入弃牌堆 | 当前计分时角色最多玩家 +1 VP | `confirmed_mismatch` | 改为每次在此打出角色后的查看/抽牌链 |

## 当前验证边界

- 已确认：牌图文字与当前实现明显错配，且不是单个对象的局部偏差。
- 已确认：旧测试大量在验证错误的旧语义，因此“测试通过”不能作为本轮放行证据。
- 已确认：线上日志确实出现过 Frozen 的放手吧、堆雪人等牌，不是没有真实入口的抽象反馈。
- 未完成：实现重写、locale 重录、17 个对象回归测试、真实牌桌 E2E、生产部署和反馈终态回写。
- 未完成前：反馈保持 `in_progress`；旧 closeout 不再作为当前完成依据。
