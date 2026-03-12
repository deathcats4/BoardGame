# Implementation Tasks

## Phase 1: 核心类型定义（Foundation）

### Task 1: 扩展 Core State 类型定义
**Requirements:** 1, 2  
**Description:** 在 `src/games/smashup/domain/core-types.ts` 中扩展 `SmashUpPlayer` 接口，添加泰坦相关字段

**Acceptance Criteria:**
- [ ] `SmashUpPlayer` 包含 `titanZone: TitanCard[]` 字段（未出场的泰坦）
- [ ] `SmashUpPlayer` 包含 `activeTitan: ActiveTitan | null` 字段（当前出场的泰坦）
- [ ] 定义 `TitanCard` 接口（uid, defId, type: 'titan', factionId, abilities）
- [ ] 定义 `ActiveTitan` 接口（titanUid, baseIndex, powerTokens）
- [ ] 运行 `npx tsc --noEmit` 确认类型定义无错误

---

### Task 2: 定义泰坦命令类型
**Requirements:** 3, 4, 9  
**Description:** 在 `src/games/smashup/domain/commands.ts` 中定义泰坦相关的命令类型

**Acceptance Criteria:**
- [ ] 在 `SU_COMMANDS` 常量表中添加 4 个泰坦命令常量
- [ ] 定义 4 个命令接口，包含必要的 payload 字段
- [ ] 更新 `SmashUpCommand` 联合类型，包含所有泰坦命令
- [ ] 运行 `npx tsc --noEmit` 确认类型定义无错误

---

### Task 3: 定义泰坦事件类型
**Requirements:** 15  
**Description:** 在 `src/games/smashup/domain/events.ts` 中定义泰坦相关的事件类型

**Acceptance Criteria:**
- [ ] 使用 `defineEvents()` 定义 6 种泰坦事件
- [ ] 所有事件使用 `'immediate'` 音频策略（EventStream）
- [ ] 添加对应的事件类型常量到 `SU_EVENT_TYPES`
- [ ] 运行 `npx tsc --noEmit` 确认类型定义无错误

---

## Phase 2: 核心系统实现（Core Systems）

### Task 4: 实现 TitanSystem
**Requirements:** 5, 8  
**Description:** 创建 `src/games/smashup/domain/systems/TitanSystem.ts`

**Acceptance Criteria:**
- [x] 实现 `checkClash(state, baseIndex)` 方法（O(1) 复杂度）
- [x] 实现 `calculatePlayerPower(state, playerId, baseIndex)` 方法
- [x] 实现 `hasScoringEligibility(state, playerId, baseIndex)` 方法
- [x] 实现 `removeTitan(state, playerId, reason)` 方法
- [x] 实现 `getTitansAtBase(state, baseIndex)` 方法
- [x] Kaiju Island 基地不触发冲突
- [x] 冲突时力量相等则防守方获胜
- [x] 单元测试覆盖所有方法

---

### Task 5: 实现泰坦命令验证逻辑
**Requirements:** 3, 4, 14  
**Description:** 在 `src/games/smashup/domain/validate.ts` 中添加泰坦命令的验证逻辑

**Acceptance Criteria:**
- [x] 验证 PLACE_TITAN 命令（玩家没有出场的泰坦、泰坦卡在 titanZone 中、基地索引有效）
- [x] 验证 MOVE_TITAN 命令（泰坦存在、目标基地不是当前基地、基地索引有效）
- [x] 验证 ADD_TITAN_POWER_TOKEN 命令（泰坦存在、数量 > 0）
- [x] 验证 REMOVE_TITAN_POWER_TOKEN 命令（泰坦存在、数量 > 0、不超过当前 powerTokens）
- [x] 返回清晰的错误信息
- [x] 单元测试覆盖所有验证规则

---

### Task 6: 实现泰坦命令执行逻辑
**Requirements:** 3, 4, 5, 9  
**Description:** 在 `src/games/smashup/domain/execute.ts` 中添加泰坦命令的执行逻辑

**Acceptance Criteria:**
- [x] 实现 PLACE_TITAN 执行（生成 TITAN_PLACED 事件、触发冲突检查）
- [x] 实现 MOVE_TITAN 执行（生成 TITAN_MOVED 事件、触发冲突检查）
- [x] 实现 ADD_TITAN_POWER_TOKEN 执行（生成 TITAN_POWER_TOKEN_ADDED 事件）
- [x] 实现 REMOVE_TITAN_POWER_TOKEN 执行（生成 TITAN_POWER_TOKEN_REMOVED 事件）
- [x] 冲突检查后生成 TITAN_CLASH 和 TITAN_REMOVED 事件
- [x] 单元测试覆盖所有执行路径

---

### Task 7: 实现泰坦事件 Reducer
**Requirements:** 2, 3, 4, 5, 9  
**Description:** 在 `src/games/smashup/domain/reduce.ts` 中添加泰坦事件的状态更新逻辑

**Acceptance Criteria:**
- [x] 实现 TITAN_PLACED reducer（titanZone → activeTitan）
- [x] 实现 TITAN_MOVED reducer（更新 baseIndex）
- [x] 实现 TITAN_CLASH reducer（记录冲突信息）
- [x] 实现 TITAN_REMOVED reducer（activeTitan → titanZone，清除 powerTokens）
- [x] 实现 TITAN_POWER_TOKEN_ADDED reducer（增加 powerTokens）
- [x] 实现 TITAN_POWER_TOKEN_REMOVED reducer（减少 powerTokens）
- [x] 使用结构共享，避免全量深拷贝
- [x] 单元测试覆盖所有 reducer

---

## Phase 3: 游戏初始化与集成（Integration）

### Task 8: 扩展游戏初始化逻辑
**Requirements:** 2  
**Description:** 在 `src/games/smashup/game.ts` 中添加泰坦初始化逻辑

**Acceptance Criteria:**
- [x] 检查玩家派系是否包含泰坦卡
- [x] 将泰坦卡放入 `titanZone`
- [x] 初始化 `activeTitan` 为 null
- [x] 单元测试验证初始化逻辑

---

### Task 9: 集成 TitanSystem 到计分系统
**Requirements:** 8  
**Description:** 修改 `src/games/smashup/domain/index.ts`（计分逻辑），集成泰坦力量计算和资格判定

**Acceptance Criteria:**
- [x] 使用 `TitanSystem.calculatePlayerPower()` 计算基地总力量
- [x] 使用 `TitanSystem.hasScoringEligibility()` 判定计分资格
- [x] 单元测试验证泰坦计分逻辑（9/9 tests passing）
- [x] 手动验证完整计分流程（浏览器测试）

---

### Task 10: 集成泰坦移除到基地摧毁逻辑
**Requirements:** 7  
**Description:** 修改基地摧毁和替换逻辑，自动移除泰坦

**Acceptance Criteria:**
- [x] 基地摧毁时调用 `TitanSystem.removeTitan()`
- [x] 基地替换时调用 `TitanSystem.removeTitan()`
- [x] 生成 TITAN_REMOVED 事件（reason: 'base_destroyed'）
- [x] 单元测试验证移除逻辑

---

## Phase 4: 目标系统扩展（Target System）

### Task 11: 扩展引擎层目标类型
**Requirements:** 6  
**Description:** 在 `src/engine/primitives/target.ts` 中添加 `targetType: 'card'` 支持

**Acceptance Criteria:**
- [x] 扩展 `TargetType` 联合类型，添加 `'card'`
- [x] 定义 `CardTarget` 接口（包含 cardType: 'minion' | 'action' | 'titan'）
- [x] 更新目标选择逻辑，支持选择任意卡牌
- [x] 单元测试验证目标类型扩展

---

### Task 12: 实现泰坦目标选择 UI
**Requirements:** 6  
**Description:** 修改目标选择 UI，支持选择泰坦

**Acceptance Criteria:**
- [x] 目标选择器显示泰坦卡（当 targetType 为 'card' 时）
- [x] 泰坦卡可点击选择
- [x] 选择后高亮显示
- [x] 手动验证目标选择流程（浏览器测试）

---

### Task 13: 更新现有卡牌能力定义
**Requirements:** 6  
**Description:** 为支持泰坦的卡牌更新 `targetType` 为 `'card'`

**注意：以下卡牌还未在游戏中实现，等实现后再更新 targetType**

**Acceptance Criteria:**
- [x] Into the Time Slip → `targetType: 'card'`
- [ ] Purge the Demon → `targetType: 'card'` （卡牌未实现）
- [ ] Potion of Paralysis → `targetType: 'card'` （卡牌未实现）
- [ ] There Goes Tokyo → `targetType: 'card'` （卡牌未实现）
- [ ] Cab-over Pete → `targetType: 'card'` （卡牌未实现）
- [ ] Expert Timing → `targetType: 'card'` （卡牌未实现）
- [ ] Stagecoach → `targetType: 'card'` （卡牌未实现）
- [ ] 单元测试验证目标类型更新

---

## Phase 5: 泰坦卡牌与能力（Titan Cards & Abilities）

### Task 14: 定义泰坦卡牌数据
**Requirements:** 1, 10  
**Description:** 创建 `src/games/smashup/data/titans.ts`，定义泰坦卡牌

**Acceptance Criteria:**
- [x] 定义 14 个 POD 派系泰坦（Pirates, Wizards, Ninjas, Dinosaurs, Killer Plants, Ghosts, Bear Cavalry, Innsmouth, Cthulhu, Tricksters/Aliens, Werewolves, Frankenstein, Vampires, Giant Ants）
- [x] 每个泰坦包含 defId、name、factionId、abilities、previewRef
- [x] 注册到卡牌注册表
- [x] 配置图集映射（atlasCatalog.ts）
- [x] 更新所有泰坦的图集索引
- [x] 添加 TITANS 图集常量到 ids.ts（修复图片加载问题）

---

### Task 14*: 定义更多泰坦卡牌（可选）
**Requirements:** 1, 10  
**Description:** 为其他派系定义泰坦卡牌

**Acceptance Criteria:**
- [ ]* 定义至少 5 个不同派系的泰坦
- [ ]* 每个泰坦有独特的能力
- [ ]* 注册到卡牌注册表

---

### Task 15: 实现泰坦能力定义
**Requirements:** 10  
**Description:** 创建 `src/games/smashup/domain/abilities/titans.ts`，定义泰坦能力

**Acceptance Criteria:**
- [x] 定义所有 14 个 POD 泰坦的能力（Fort Titanosaurus, Arcane Protector, The Kraken, Invisible Ninja, Killer Kudzu, Creampuff Man, Major Ursa, Dagon, Cthulhu, Big Funny Giant, Great Wolf Spirit, The Bride, Ancient Lord, Death on Six Legs）
- [x] 使用能力注册表注册所有能力
- [x] 创建能力执行函数和交互处理器框架
- [x] 单元测试验证能力触发和效果

---

### Task 16: 实现泰坦能力执行器
**Requirements:** 10  
**Description:** 在 `src/games/smashup/domain/abilityResolver.ts` 中注册泰坦能力执行器

**Acceptance Criteria:**
- [x] 注册泰坦出场触发器（TITAN_PLACED 事件）
- [x] 注册泰坦移动触发器（TITAN_MOVED 事件）
- [x] 实现能力执行逻辑
- [x] 单元测试验证能力执行（85/85 tests passed）

---

## Phase 6: UI 组件（UI Components）

### Task 17: 实现 TitanZone 组件
**Requirements:** 11  
**Description:** 创建 `src/games/smashup/ui/TitanZone.tsx`，显示泰坦区域

**Acceptance Criteria:**
- [x] 显示玩家的 titanZone 中的泰坦卡
- [x] 泰坦卡显示名称、图片、能力描述
- [x] 响应式布局（PC 和移动端）
- [x] 调整布局位置（右上角，不遮挡手牌）
- [ ] E2E 测试验证 UI 显示

---

### Task 18: 实现 TitanCard 组件
**Requirements:** 11  
**Description:** 创建 `src/games/smashup/ui/TitanCard.tsx`，显示泰坦卡

**Acceptance Criteria:**
- [x] 显示泰坦名称、图片、能力描述
- [x] 显示力量指示物数量
- [x] 显示控制权（朝向自己或对手）
- [x] 支持悬停显示详细信息
- [ ] E2E 测试验证 UI 交互

---

### Task 19: 实现泰坦出场交互 UI
**Requirements:** 3, 11  
**Description:** 创建泰坦出场的交互界面

**Acceptance Criteria:**
- [x] 显示"选择基地"选项
- [x] 显示"取消"按钮（替代跳过/确认）
- [x] 选择基地后高亮显示
- [ ] E2E 测试验证交互流程

---

### Task 20: 实现泰坦移动交互 UI
**Requirements:** 4, 11  
**Description:** 创建泰坦移动的交互界面

**Acceptance Criteria:**
- [x] 显示"选择目标基地"选项（排除当前基地）
- [x] 显示"确认/取消"按钮
- [x] 选择基地后高亮显示
- [ ] E2E 测试验证交互流程

---

### Task 21: 实现泰坦冲突动画
**Requirements:** 11  
**Description:** 创建泰坦冲突的动画效果

**Acceptance Criteria:**
- [ ] 订阅 TITAN_CLASH 事件
- [ ] 播放冲突动画（两个泰坦碰撞）
- [ ] 显示力量对比
- [ ] 失败方泰坦消失动画
- [ ] E2E 测试验证动画播放

---

## Phase 7: 日志与国际化（Logging & i18n）

### Task 22: 实现泰坦事件日志格式化
**Requirements:** 15  
**Description:** 在 `src/games/smashup/domain/actionLog.ts` 中添加泰坦事件的日志格式化

**Acceptance Criteria:**
- [x] TITAN_PLACED → "玩家 X 出场泰坦 Y 到基地 Z"
- [x] TITAN_MOVED → "玩家 X 移动泰坦 Y 从基地 A 到基地 B"
- [x] TITAN_CLASH → "泰坦冲突！玩家 X 的泰坦（力量 N）击败玩家 Y 的泰坦（力量 M）"
- [x] TITAN_REMOVED → "玩家 X 的泰坦被移除（原因：冲突/基地摧毁/能力）"
- [x] TITAN_POWER_TOKEN_ADDED → "玩家 X 的泰坦获得 N 个力量指示物"
- [x] TITAN_POWER_TOKEN_REMOVED → "玩家 X 的泰坦失去 N 个力量指示物"

---

### Task 23: 添加泰坦相关 i18n 文本
**Requirements:** 18  
**Description:** 在 `public/locales/zh-CN/game-smashup.json` 中添加泰坦相关文本

**Acceptance Criteria:**
- [x] 泰坦卡牌名称翻译
- [x] 泰坦能力描述翻译
- [x] UI 文本翻译（"出场泰坦"、"移动泰坦"、"泰坦冲突"等）
- [x] 日志条目翻译
- [x] 提示信息翻译

---

### Task 23*: 添加英文翻译（可选）
**Requirements:** 18  
**Description:** 在 `public/locales/en/game-smashup.json` 中添加英文翻译

**Acceptance Criteria:**
- [ ]* 所有泰坦相关文本的英文翻译
- [ ]* 与中文版本保持一致

---

## Phase 8: 撤销与网络同步（Undo & Network Sync）

### Task 24: 实现泰坦操作撤销逻辑
**Requirements:** 13  
**Description:** 确保泰坦操作可以正确撤销

**Acceptance Criteria:**
- [ ] 撤销泰坦出场（activeTitan → titanZone）
- [ ] 撤销泰坦移动（恢复 baseIndex）
- [ ] 撤销泰坦冲突（恢复被移除的泰坦）
- [ ] 撤销力量指示物变更
- [ ] 单元测试验证撤销逻辑

---

### Task 25: 实现泰坦状态网络同步
**Requirements:** 13  
**Description:** 确保泰坦状态在联机模式下正确同步

**Acceptance Criteria:**
- [ ] 泰坦出场同步到所有玩家
- [ ] 泰坦移动同步到所有玩家
- [ ] 泰坦冲突同步到所有玩家
- [ ] 力量指示物变更同步到所有玩家
- [ ] E2E 测试验证多玩家同步

---

## Phase 9: 测试（Testing）

### Task 26: 编写泰坦机制单元测试
**Requirements:** 16  
**Description:** 补充完整的单元测试覆盖

**Acceptance Criteria:**
- [ ] 泰坦出场测试（正常流程、边界条件、错误处理）
- [ ] 泰坦移动测试（自己的泰坦、对手的泰坦、冲突触发）
- [ ] 泰坦冲突测试（力量比较、平局处理、Kaiju Island 例外）
- [ ] 泰坦计分测试（力量计算、资格判定）
- [ ] 泰坦与现有机制交互测试（不触发随从/行动效果）
- [ ] 目标系统测试（目标卡牌 vs 目标随从）
- [ ] 代码覆盖率 ≥ 90%

---

### Task 27: 编写泰坦机制 E2E 测试
**Requirements:** 16  
**Description:** 编写完整的端到端测试

**Acceptance Criteria:**
- [ ] 泰坦出场和冲突流程测试
- [ ] 泰坦移动和冲突流程测试
- [ ] 泰坦计分流程测试
- [ ] Kaiju Island 特殊规则测试
- [ ] 目标系统测试（使用 Into the Time Slip 移除泰坦）
- [ ] 所有测试通过并生成截图

---

## Phase 10: 文档与优化（Documentation & Optimization）

### Task 28: 编写泰坦机制文档
**Requirements:** 所有  
**Description:** 编写完整的泰坦机制文档

**Acceptance Criteria:**
- [ ] 更新 `src/games/smashup/rule/` 中的规则文档
- [ ] 添加泰坦机制使用指南
- [ ] 添加 API 文档（TitanSystem 接口）
- [ ] 添加开发者指南（如何添加新泰坦）
- [ ] 添加常见问题解答

---

### Task 28*: 性能优化（可选）
**Requirements:** 17  
**Description:** 优化泰坦机制的性能

**Acceptance Criteria:**
- [ ]* 缓存泰坦力量计算结果
- [ ]* 使用虚拟化技术渲染泰坦卡
- [ ]* 使用 GPU 加速渲染泰坦动画
- [ ]* 批量同步泰坦状态变更
- [ ]* 性能测试验证优化效果

---

## Checkpoint 1: 核心功能验证
**After Tasks 1-10**

验证以下功能：
- [ ] 泰坦可以正确出场和移动
- [ ] 泰坦冲突正确触发和解决
- [ ] 泰坦力量正确计入基地计分
- [ ] 基地摧毁时泰坦正确移除
- [ ] 所有单元测试通过

---

## Checkpoint 2: UI 和交互验证
**After Tasks 11-21**

验证以下功能：
- [ ] 泰坦 UI 正确显示
- [ ] 泰坦交互流程流畅
- [ ] 泰坦动画正确播放
- [ ] 目标系统正确工作
- [ ] 所有 E2E 测试通过

---

## Checkpoint 3: 完整功能验证
**After Tasks 22-28**

验证以下功能：
- [ ] 泰坦日志正确显示
- [ ] 泰坦操作可以撤销
- [ ] 泰坦状态正确同步
- [ ] 所有测试通过
- [ ] 文档完整

---
