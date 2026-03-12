# Requirements Document

## Introduction

本文档定义大杀四方（Smash Up）游戏的泰坦（Titan）机制需求。泰坦是一种全新的卡牌类型，区别于随从（Minion）和行动（Action），具有独特的出场、移动、冲突和计分规则。泰坦机制引入了新的战术深度，玩家需要在基地争夺中考虑泰坦的位置和力量对比。

## Glossary

- **Titan（泰坦）**：一种新的卡牌类型，不是随从也不是行动，每个玩家同时只能控制一个
- **Clash（冲突）**：当两个泰坦在同一基地时触发的力量比较机制，力量较低的泰坦被移除
- **Power_Token（力量指示物）**：可以放置在泰坦上的 +1 力量指示物，计入基地总力量
- **Titan_Zone（泰坦区域）**：牌库旁边的区域，用于存放未出场的泰坦卡
- **Control（控制权）**：泰坦的所有权，由泰坦卡的朝向表示
- **Placement（出场）**：泰坦从泰坦区域进入基地的过程
- **Removal（移除）**：泰坦从基地返回泰坦区域的过程
- **Target_Card（目标卡牌）**：可以指定任意卡牌（包括泰坦）的目标类型，区别于"目标随从"或"目标行动"
- **Scoring_Eligibility（计分资格）**：获得基地奖励的前提条件，必须至少有一个随从或至少 1 点总力量

## Requirements

### Requirement 1: 泰坦卡牌类型

**User Story:** 作为玩家，我想使用泰坦卡牌，以便在基地争夺中获得新的战术选择

#### Acceptance Criteria

1. THE Card_System SHALL 支持 `type: 'titan'` 卡牌类型
2. WHEN 定义泰坦卡时，THE Card_Definition SHALL 包含 `defId`、`name`、`factionId`、`abilities` 字段
3. THE Titan_Card SHALL 不包含 `power` 字段（泰坦本身无力量值）
4. THE Titan_Card SHALL 支持 `powerTokens` 字段（记录 +1 力量指示物数量）
5. THE Type_System SHALL 确保泰坦不被"目标随从"或"目标行动"的效果指定
6. THE Type_System SHALL 确保泰坦不触发"打出随从"或"打出行动"的效果

### Requirement 2: 泰坦区域管理

**User Story:** 作为玩家，我想在游戏开始时将泰坦卡放在牌库旁边，以便在特定时机出场

#### Acceptance Criteria

1. WHEN 游戏初始化时，THE Setup_System SHALL 检查玩家派系是否包含泰坦
2. IF 玩家派系包含泰坦，THEN THE Setup_System SHALL 将泰坦卡放入 `titanZone` 区域
3. THE Player_State SHALL 包含 `titanZone: TitanCard[]` 字段
4. THE Player_State SHALL 包含 `activeTitan: { titanUid: string, baseIndex: number, powerTokens: number } | null` 字段
5. THE Titan_Zone SHALL 不受洗牌、抽牌、弃牌等效果影响
6. WHEN 泰坦离场时，THE Titan_System SHALL 将泰坦卡返回 `titanZone` 并清除所有力量指示物

### Requirement 3: 泰坦出场机制

**User Story:** 作为玩家，我想在特定卡牌允许时出场泰坦，以便在基地上建立优势

#### Acceptance Criteria

1. WHEN 卡牌效果允许出场泰坦时，THE Ability_System SHALL 创建泰坦出场交互
2. THE Titan_Placement_Interaction SHALL 包含"选择基地"和"确认/跳过"选项
3. THE Titan_Placement_Interaction SHALL 标记为可选（玩家可以选择不出场）
4. WHEN 玩家已有出场的泰坦时，THE Validation_System SHALL 拒绝出场新泰坦
5. WHEN 玩家选择出场泰坦时，THE Execute_System SHALL 执行以下步骤：
   - 将泰坦从 `titanZone` 移动到 `activeTitan`
   - 记录泰坦所在基地索引
   - 触发泰坦卡上的能力
   - 检查目标基地是否已有其他泰坦，如有则触发冲突
6. THE Titan_Placement SHALL 不计入 Eliza 等能力的"额外卡牌"计数
7. THE Titan_Placement SHALL 不触发"打出随从"或"打出行动"的效果

### Requirement 4: 泰坦移动机制

**User Story:** 作为玩家，我想移动泰坦到不同基地，以便调整战术布局

#### Acceptance Criteria

1. WHEN 卡牌效果允许移动泰坦时，THE Ability_System SHALL 创建泰坦移动交互
2. THE Titan_Move_Interaction SHALL 包含"选择目标基地"选项（不包括当前基地）
3. WHEN 移动他人的泰坦时，THE Control_System SHALL 保持原控制权不变
4. WHEN 玩家选择移动泰坦时，THE Execute_System SHALL 执行以下步骤：
   - 更新泰坦的 `baseIndex`
   - 解析强制触发的卡牌效果（如"当泰坦移动时"）
   - 解析可选触发的卡牌效果（当前玩家优先，顺时针轮流）
   - 检查目标基地是否已有其他泰坦，如有则触发冲突
5. THE Move_System SHALL 支持移动自己控制的泰坦
6. THE Move_System SHALL 支持移动对手控制的泰坦（如果卡牌效果允许）

### Requirement 5: 泰坦冲突机制

**User Story:** 作为玩家，我想在两个泰坦在同一基地时触发冲突，以便通过力量对比移除对手的泰坦

#### Acceptance Criteria

1. WHEN 两个泰坦在同一基地时，THE Clash_System SHALL 自动触发冲突
2. THE Clash_System SHALL 计算双方在该基地的总力量（随从力量 + 行动修正 + 泰坦力量指示物）
3. THE Clash_System SHALL 比较双方总力量，力量较低的一方移除其泰坦
4. IF 双方力量相等，THEN THE Clash_System SHALL 保留防守方的泰坦（后到达的泰坦被移除）
5. WHERE 基地为 Kaiju Island，THE Clash_System SHALL 不触发冲突（允许多个泰坦共存）
6. WHEN 泰坦因冲突被移除时，THE Titan_System SHALL 将泰坦返回 `titanZone` 并清除所有力量指示物
7. THE Clash_System SHALL 在泰坦出场或移动后立即检查并解决冲突

### Requirement 6: 泰坦目标系统

**User Story:** 作为玩家，我想使用"目标卡牌"效果指定泰坦，以便移除或修改泰坦

#### Acceptance Criteria

1. THE Target_System SHALL 支持 `targetType: 'card'` 目标类型
2. WHEN 效果指定 `targetType: 'card'` 时，THE Target_System SHALL 允许选择随从、行动或泰坦
3. THE Target_System SHALL 确保 `targetType: 'minion'` 不能选择泰坦
4. THE Target_System SHALL 确保 `targetType: 'action'` 不能选择泰坦
5. THE Ability_Registry SHALL 为以下卡牌注册 `targetType: 'card'`：
   - Into the Time Slip（移除泰坦）
   - Purge the Demon（移除泰坦上的 +1 力量指示物）
   - Potion of Paralysis（取消泰坦能力）
   - There Goes Tokyo（在 Kaiju Island 上摧毁其他泰坦）
   - Cab-over Pete（移动你控制的泰坦）
   - Expert Timing（转移泰坦的 +1 力量指示物或额外使用泰坦天赋）
   - Stagecoach（移动你控制的泰坦）

### Requirement 7: 基地摧毁时的泰坦处理

**User Story:** 作为玩家，我想在基地被摧毁时移除泰坦，以便符合规则

#### Acceptance Criteria

1. WHEN 基地被摧毁时，THE Base_System SHALL 检查该基地是否有泰坦
2. IF 基地有泰坦，THEN THE Titan_System SHALL 移除所有在该基地的泰坦
3. THE Titan_Removal SHALL 将泰坦返回 `titanZone` 并清除所有力量指示物
4. THE Titan_Removal SHALL 不触发"随从被摧毁"或"卡牌被弃置"的效果
5. WHEN 基地被替换时，THE Base_System SHALL 同样移除该基地的泰坦

### Requirement 8: 泰坦计分规则

**User Story:** 作为玩家，我想在计分时正确计算泰坦的力量，以便公平竞争基地奖励

#### Acceptance Criteria

1. WHEN 计算基地总力量时，THE Scoring_System SHALL 包含泰坦上的力量指示物
2. THE Titan_Power SHALL 等于泰坦上的 `powerTokens` 数量
3. WHEN 判断计分资格时，THE Scoring_System SHALL 检查玩家是否至少有一个随从或至少 1 点总力量
4. IF 玩家只有泰坦且总力量为 0，THEN THE Scoring_System SHALL 拒绝该玩家获得基地奖励
5. IF 玩家有泰坦且总力量 ≥ 1，THEN THE Scoring_System SHALL 允许该玩家获得基地奖励
6. THE Scoring_System SHALL 在力量比较中包含泰坦力量指示物

### Requirement 9: 泰坦力量指示物管理

**User Story:** 作为玩家，我想在泰坦上放置和移除力量指示物，以便增强泰坦的力量

#### Acceptance Criteria

1. THE Titan_State SHALL 包含 `powerTokens: number` 字段
2. WHEN 卡牌效果添加力量指示物时，THE Token_System SHALL 增加 `powerTokens` 值
3. WHEN 卡牌效果移除力量指示物时，THE Token_System SHALL 减少 `powerTokens` 值（最小为 0）
4. WHEN 泰坦离场时，THE Titan_System SHALL 将 `powerTokens` 重置为 0
5. THE UI_System SHALL 在泰坦卡上显示力量指示物数量
6. THE Scoring_System SHALL 在计算基地总力量时包含泰坦的 `powerTokens`

### Requirement 10: 泰坦能力解析

**User Story:** 作为玩家，我想在泰坦出场时触发其能力，以便获得战术优势

#### Acceptance Criteria

1. THE Titan_Card SHALL 支持 `abilities: string[]` 字段
2. WHEN 泰坦出场时，THE Ability_System SHALL 解析泰坦卡上的所有能力
3. THE Ability_Resolution SHALL 遵循标准能力解析顺序（强制效果优先，可选效果按玩家顺序）
4. THE Ability_System SHALL 支持泰坦的持续能力（如"你的随从 +1 力量"）
5. THE Ability_System SHALL 支持泰坦的触发能力（如"当泰坦移动时"）
6. WHEN 泰坦离场时，THE Ability_System SHALL 停止解析泰坦的持续能力

### Requirement 11: 泰坦 UI 展示

**User Story:** 作为玩家，我想在游戏界面上清晰看到泰坦的状态，以便做出决策

#### Acceptance Criteria

1. THE Board_UI SHALL 在基地旁边显示泰坦卡
2. THE Titan_Card_UI SHALL 显示泰坦的名称、图片、能力描述
3. THE Titan_Card_UI SHALL 显示泰坦的控制权（朝向自己或对手）
4. THE Titan_Card_UI SHALL 显示泰坦上的力量指示物数量
5. THE Player_Area_UI SHALL 在牌库旁边显示泰坦区域（未出场的泰坦）
6. WHEN 泰坦冲突发生时，THE Animation_System SHALL 播放冲突动画
7. THE Tooltip_System SHALL 在鼠标悬停时显示泰坦的详细信息

### Requirement 12: 泰坦与现有机制的交互

**User Story:** 作为玩家，我想确保泰坦与现有卡牌效果正确交互，以便游戏规则一致

#### Acceptance Criteria

1. THE Ability_System SHALL 确保"打出随从"效果不触发泰坦出场
2. THE Ability_System SHALL 确保"打出行动"效果不触发泰坦出场
3. THE Ability_System SHALL 确保"摧毁随从"效果不能摧毁泰坦
4. THE Ability_System SHALL 确保"返回手牌"效果不能返回泰坦（泰坦永远不进入手牌）
5. THE Ability_System SHALL 确保"弃置卡牌"效果不能弃置泰坦（泰坦永远不进入弃牌堆）
6. THE Ability_System SHALL 确保"洗入牌库"效果不能洗入泰坦（泰坦永远不进入牌库）
7. THE Ability_System SHALL 确保"额外卡牌计数"效果不计入泰坦出场（如 Eliza）
8. THE Ability_System SHALL 确保"移动随从"效果不能移动泰坦（除非明确指定"移动泰坦"）

### Requirement 13: 泰坦数据持久化

**User Story:** 作为玩家，我想在游戏保存和加载时保留泰坦状态，以便继续游戏

#### Acceptance Criteria

1. THE Save_System SHALL 序列化 `titanZone` 和 `activeTitan` 状态
2. THE Load_System SHALL 反序列化泰坦状态并恢复到正确位置
3. THE Undo_System SHALL 支持撤销泰坦出场、移动和冲突操作
4. THE Replay_System SHALL 正确记录和回放泰坦相关事件
5. THE Network_System SHALL 同步泰坦状态到所有玩家客户端

### Requirement 14: 泰坦验证规则

**User Story:** 作为玩家，我想在尝试非法操作时收到提示，以便了解规则限制

#### Acceptance Criteria

1. WHEN 玩家已有出场的泰坦时，THE Validation_System SHALL 拒绝出场新泰坦并显示提示
2. WHEN 玩家尝试移动不存在的泰坦时，THE Validation_System SHALL 拒绝操作并显示提示
3. WHEN 玩家尝试移动对手的泰坦但卡牌效果不允许时，THE Validation_System SHALL 拒绝操作并显示提示
4. WHEN 玩家尝试将泰坦移动到当前基地时，THE Validation_System SHALL 拒绝操作并显示提示
5. WHEN 玩家尝试使用"目标随从"效果指定泰坦时，THE Validation_System SHALL 拒绝操作并显示提示

### Requirement 15: 泰坦事件系统

**User Story:** 作为开发者，我想通过事件系统记录泰坦操作，以便日志和动画系统使用

#### Acceptance Criteria

1. THE Event_System SHALL 定义 `TITAN_PLACED` 事件（泰坦出场）
2. THE Event_System SHALL 定义 `TITAN_MOVED` 事件（泰坦移动）
3. THE Event_System SHALL 定义 `TITAN_CLASH` 事件（泰坦冲突）
4. THE Event_System SHALL 定义 `TITAN_REMOVED` 事件（泰坦移除）
5. THE Event_System SHALL 定义 `TITAN_POWER_TOKEN_ADDED` 事件（添加力量指示物）
6. THE Event_System SHALL 定义 `TITAN_POWER_TOKEN_REMOVED` 事件（移除力量指示物）
7. THE ActionLog_System SHALL 为所有泰坦事件生成可读的日志条目
8. THE Animation_System SHALL 订阅泰坦事件并播放对应动画

### Requirement 16: 泰坦测试覆盖

**User Story:** 作为开发者，我想确保泰坦机制有完整的测试覆盖，以便保证质量

#### Acceptance Criteria

1. THE Test_Suite SHALL 包含泰坦出场的单元测试（正常流程、边界条件、错误处理）
2. THE Test_Suite SHALL 包含泰坦移动的单元测试（自己的泰坦、对手的泰坦、冲突触发）
3. THE Test_Suite SHALL 包含泰坦冲突的单元测试（力量比较、平局处理、Kaiju Island 例外）
4. THE Test_Suite SHALL 包含泰坦计分的单元测试（力量计算、资格判定）
5. THE Test_Suite SHALL 包含泰坦与现有机制交互的单元测试（不触发随从/行动效果）
6. THE Test_Suite SHALL 包含泰坦目标系统的单元测试（目标卡牌 vs 目标随从）
7. THE Test_Suite SHALL 包含泰坦 E2E 测试（完整游戏流程，包括出场、移动、冲突、计分）

### Requirement 17: 泰坦性能优化

**User Story:** 作为玩家，我想在使用泰坦时保持流畅的游戏体验，以便享受游戏

#### Acceptance Criteria

1. THE Clash_System SHALL 在 O(1) 时间内完成冲突检查（不遍历所有基地）
2. THE Scoring_System SHALL 缓存泰坦力量计算结果，避免重复计算
3. THE UI_System SHALL 使用虚拟化技术渲染泰坦卡，避免性能问题
4. THE Animation_System SHALL 使用 GPU 加速渲染泰坦动画
5. THE Network_System SHALL 批量同步泰坦状态变更，减少网络开销

### Requirement 18: 泰坦国际化支持

**User Story:** 作为玩家，我想在不同语言环境下看到正确的泰坦文本，以便理解规则

#### Acceptance Criteria

1. THE i18n_System SHALL 支持泰坦卡牌名称的多语言翻译
2. THE i18n_System SHALL 支持泰坦能力描述的多语言翻译
3. THE i18n_System SHALL 支持泰坦相关 UI 文本的多语言翻译（如"出场泰坦"、"泰坦冲突"）
4. THE i18n_System SHALL 支持泰坦相关日志条目的多语言翻译
5. THE i18n_System SHALL 支持泰坦相关提示信息的多语言翻译

## 特殊场景与边界条件

### 场景 1: 同时触发多个泰坦出场效果
- **描述**：玩家打出 Rainboroc 和 Megabot，两者都允许出场泰坦
- **预期行为**：只能出场一个泰坦（因为每个玩家同时只能控制一个泰坦），第二个效果自动跳过

### 场景 2: 泰坦在 Kaiju Island 上的冲突
- **描述**：两个泰坦在 Kaiju Island 上相遇
- **预期行为**：不触发冲突，允许多个泰坦共存

### 场景 3: 泰坦所在基地被摧毁
- **描述**：基地达到 breakpoint 并被摧毁，泰坦在该基地上
- **预期行为**：泰坦返回泰坦区域，随从转移到新基地

### 场景 4: 移动泰坦到已有泰坦的基地
- **描述**：玩家使用 Cab-over Pete 移动自己的泰坦到对手泰坦所在的基地
- **预期行为**：移动完成后立即触发冲突，力量较低的泰坦被移除

### 场景 5: 泰坦力量指示物为 0 时的计分
- **描述**：玩家只有泰坦在基地上，泰坦力量指示物为 0，无随从
- **预期行为**：不能获得基地奖励（不满足计分资格）

### 场景 6: 泰坦力量指示物 ≥ 1 时的计分
- **描述**：玩家只有泰坦在基地上，泰坦力量指示物为 1，无随从
- **预期行为**：可以获得基地奖励（满足计分资格）

### 场景 7: 使用 Into the Time Slip 移除泰坦
- **描述**：玩家使用 Into the Time Slip（目标卡牌）指定对手的泰坦
- **预期行为**：泰坦被移除，返回泰坦区域

### 场景 8: 使用 Destroy a Minion 尝试摧毁泰坦
- **描述**：玩家使用"摧毁一个随从"效果尝试指定泰坦
- **预期行为**：验证失败，提示"泰坦不是随从"

### 场景 9: 泰坦冲突平局
- **描述**：两个泰坦在同一基地，双方总力量相等
- **预期行为**：防守方（先到达的泰坦）保留，进攻方（后到达的泰坦）被移除

### 场景 10: 撤销泰坦出场
- **描述**：玩家出场泰坦后立即撤销
- **预期行为**：泰坦返回泰坦区域，基地状态恢复

## 依赖关系

- **引擎层**：需要扩展 `CardType` 枚举，支持 `'titan'` 类型
- **目标系统**：需要扩展 `TargetType`，支持 `'card'` 类型
- **计分系统**：需要修改力量计算和资格判定逻辑
- **UI 系统**：需要新增泰坦卡展示组件和冲突动画
- **事件系统**：需要新增泰坦相关事件类型
- **验证系统**：需要新增泰坦相关验证规则

## 风险与挑战

1. **复杂度**：泰坦机制引入了新的卡牌类型和交互规则，可能增加代码复杂度
2. **性能**：冲突检查和力量计算可能影响性能，需要优化
3. **兼容性**：需要确保泰坦与现有 1000+ 张卡牌正确交互
4. **测试覆盖**：需要大量测试用例覆盖所有边界条件和特殊场景
5. **UI 设计**：需要设计清晰的泰坦展示方式，避免界面混乱

## 后续扩展

- 支持更多泰坦卡牌（不同派系的泰坦）
- 支持泰坦专属能力关键词（如"Titan Talent"）
- 支持泰坦与其他扩展机制的交互（如 Treasure、Madness）
- 支持泰坦相关成就和统计
