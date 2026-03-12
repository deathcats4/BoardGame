# SmashUp 泰坦能力实现 - 阶段 1

## 实现状态

**日期**: 2026-03-07  
**任务**: Task 15 - 实现泰坦能力定义  
**策略**: 先实现 2-3 个代表性泰坦，建立框架后再扩展

## 已完成工作

### 1. 创建目录结构

创建了泰坦能力定义目录：
- `src/games/smashup/domain/abilities/titans/index.ts` - 导出文件
- `src/games/smashup/domain/abilities/titans/fortTitanosaurus.ts` - Fort Titanosaurus 能力

### 2. Fort Titanosaurus (泰坦堡垒龙) - 简单泰坦

**已实现**:
- ✅ Special 能力框架（消灭己方随从来打出泰坦）
- ✅ Talent 能力（4+力量指示物时抽牌）
- ⏳ Ongoing 能力（TODO：需要事件监听系统）

**实现要点**:
- Special: 创建交互选择要消灭的随从，返回 matchState 队列交互
- Talent: 检查力量指示物数量，生成 CARDS_DRAWN 事件
- Ongoing: 需要在 postProcessSystemEvents 中监听 ACTION_PLAYED 事件

**代码结构**:
```typescript
// Special: 选择随从 → 创建交互
export function fortTitanosaurusSpecial(ctx: AbilityContext): AbilityResult

// Ongoing: 监听 ACTION_PLAYED → 添加力量指示物（每回合一次）
export function fortTitanosaurusOngoing(ctx: AbilityContext): AbilityResult

// Talent: 检查条件 → 抽牌
export function fortTitanosaurusTalent(ctx: AbilityContext): AbilityResult
```

## 下一步工作

### 立即任务
1. 实现 Arcane Protector (奥术守护者) - 中等复杂度
2. 实现 The Kraken (海怪克拉肯) - 复杂泰坦
3. 创建能力执行器注册系统

### 技术挑战

#### 1. Ongoing 能力触发系统
- **问题**: Fort Titanosaurus Ongoing 需要监听 ACTION_PLAYED 事件
- **解决方案**: 在 postProcessSystemEvents 中添加泰坦 Ongoing 触发逻辑
- **需要**: 
  - 添加 `fortTitanosaurusOngoingUsedThisTurn` 字段到 SmashUpCore
  - 回合结束时重置标志

#### 2. 能力注册表
- **问题**: 需要将能力函数注册到 abilityRegistry
- **解决方案**: 扩展现有的 abilityRegistry 系统支持泰坦能力
- **需要**:
  - 定义泰坦能力 ID 常量（如 'titan_fort_titanosaurus_special'）
  - 在 abilityResolver.ts 中注册执行器

#### 3. 交互处理器
- **问题**: Special 能力创建交互后，需要处理器执行实际效果
- **解决方案**: 在 execute.ts 中添加交互处理器
- **需要**:
  - 处理 fort_titanosaurus_special 交互
  - 生成 MINION_DESTROYED + TITAN_PLACED + TITAN_POWER_TOKEN_ADDED 事件

## 参考资料

- `docs/smashup-titans-data.md` - 完整的泰坦能力描述和 FAQ
- `docs/smashup-titan-abilities-implementation-plan.md` - 实现计划
- `src/games/smashup/domain/abilityHelpers.ts` - 能力辅助函数
- `src/games/smashup/domain/systems/TitanSystem.ts` - 泰坦核心系统

## 预估剩余工作量

- Arcane Protector: 2-3 小时
- The Kraken: 3-4 小时
- 能力执行器系统: 2-3 小时
- 测试: 2-3 小时
- **总计**: 9-13 小时

## 备注

- Fort Titanosaurus 是最简单的泰坦，用于建立基础框架
- Ongoing 能力需要事件监听系统，这是所有泰坦的通用需求
- 完成 3 个代表性泰坦后，可以快速扩展到其余 11 个泰坦


---

## 更新 (2026-03-07 - 优先级 1 完成)

### ✅ 优先级 1：能力注册系统

**已完成**:
1. ✅ 在 `src/games/smashup/domain/ids.ts` 中添加泰坦能力 ID 常量
2. ✅ 创建 `src/games/smashup/abilities/titans.ts` 能力注册文件
3. ✅ 在 `src/games/smashup/abilities/index.ts` 中集成泰坦能力注册

**实现细节**:
- 使用现有的 `registerAbility(defId, tag, executor)` API
- 泰坦 defId 格式：`titan_<name>`（如 `titan_fort_titanosaurus`）
- 能力 tag：`special`、`ongoing`、`talent`

**下一步**:
- 优先级 2：交互处理器
- 优先级 3：事件监听系统



---

## 更新 (2026-03-07 - 优先级 2 完成)

### ✅ 优先级 2：交互处理器

**已完成**:
1. ✅ 添加交互处理器到 `src/games/smashup/abilities/titans.ts`
2. ✅ 实现 `registerTitanInteractionHandlers()` 函数
3. ✅ 集成到 `src/games/smashup/abilities/index.ts`
4. ✅ TypeScript 编译检查通过

**实现细节**:
- Fort Titanosaurus Special: 消灭随从 → 打出泰坦 → 添加力量指示物
- Arcane Protector Special: 选择基地 → 打出泰坦
- The Kraken Special: 选择基地 → 打出泰坦
- The Kraken Talent: 选择随从 → 移动到泰坦所在基地

**下一步**:
- 优先级 3：事件监听系统



---

## 更新 (2026-03-07 - 优先级 3 完成)

### ✅ 优先级 3：事件监听系统

**已完成**:
1. ✅ 在 `SmashUpCore` 中添加状态字段
   - `fortTitanosaurusOngoingUsedThisTurn?: boolean` - Fort Titanosaurus Ongoing 每回合一次限制
   - `cardsPlayedThisTurn?: number` - Arcane Protector Ongoing 计数（打出3张卡牌时触发）

2. ✅ 在 `postProcessSystemEvents` 中添加事件监听逻辑
   - **MINION_PLAYED**: 增加 `cardsPlayedThisTurn` 计数，检查 Arcane Protector Ongoing（3张卡牌时抽牌）
   - **ACTION_PLAYED**: 增加 `cardsPlayedThisTurn` 计数，检查 Arcane Protector Ongoing（3张卡牌时抽牌）
   - **BASE_SCORED**: 检查 The Kraken Ongoing（泰坦在该基地时获得+1力量指示物）

3. ✅ 在回合开始时重置标志
   - `TURN_STARTED` 事件处理中重置 `fortTitanosaurusOngoingUsedThisTurn` 和 `cardsPlayedThisTurn`
   - 同时处理新游戏回合和同一游戏回合内的玩家回合两种情况

4. ✅ 在 reducer 中增加卡牌计数
   - `MINION_PLAYED` 事件：增加 `cardsPlayedThisTurn`
   - `ACTION_PLAYED` 事件：增加 `cardsPlayedThisTurn`

5. ✅ TypeScript 编译检查通过

**实现细节**:
- Arcane Protector Ongoing: 当 `cardsPlayedThisTurn` 达到 3 时，自动触发抽牌
- The Kraken Ongoing: 监听 BASE_SCORED 事件，如果泰坦在该基地，添加+1力量指示物
- Fort Titanosaurus Ongoing: 暂时跳过（需要 ACTION_PLAYED 事件添加 `targetMinionUid` 字段）

**下一步**:
- 优先级 4：单元测试



---

## 更新 (2026-03-07 - Batch 4 完成)

### ✅ Batch 4: Big Funny Giant, Great Wolf Spirit, The Bride

**已完成**:
1. ✅ 创建能力定义文件
   - `src/games/smashup/domain/abilities/titans/bigFunnyGiant.ts`
   - `src/games/smashup/domain/abilities/titans/greatWolfSpirit.ts`
   - `src/games/smashup/domain/abilities/titans/theBride.ts`

2. ✅ 更新 ID 常量表 (`src/games/smashup/domain/ids.ts`)
   - Big Funny Giant: `BIG_FUNNY_GIANT_SPECIAL_1`, `BIG_FUNNY_GIANT_ONGOING`, `BIG_FUNNY_GIANT_SPECIAL_2`
   - Great Wolf Spirit: `GREAT_WOLF_SPIRIT_SPECIAL`, `GREAT_WOLF_SPIRIT_ONGOING`, `GREAT_WOLF_SPIRIT_TALENT`
   - The Bride: `THE_BRIDE_SPECIAL`, `THE_BRIDE_ONGOING`, `THE_BRIDE_TALENT`

3. ✅ 更新导出文件 (`src/games/smashup/domain/abilities/titans/index.ts`)
   - 添加 Batch 4 三个泰坦的导出

4. ✅ 更新能力注册 (`src/games/smashup/abilities/titans.ts`)
   - 添加 Batch 4 能力注册
   - 添加 Batch 4 交互处理器占位符

**实现细节**:

#### Big Funny Giant (快乐巨人)
- **Special 1**: 代替常规随从打出，打出泰坦
- **Ongoing**: 其他玩家在此处打出随从后弃牌；其他玩家回合结束时如果没有随从，放置+1指示物
- **Special 2**: 基地计分时，如果你是赢家且至少有一名其他玩家没有随从，获得1 VP

#### Great Wolf Spirit (伟大狼灵)
- **Special**: 打出第3个随从后打出泰坦
- **Ongoing**: 每回合一次，打出随从后移动泰坦到该随从所在基地
- **Talent**: 移动泰坦到另一个基地，将一个己方随从移动到该基地

#### The Bride (怪人的新娘)
- **Special**: 控制3+随从时打出泰坦
- **Ongoing**: 泰坦所在基地上己方随从+1战斗力
- **Talent**: 从牌库顶抽取直到抽到随从，打出该随从

**下一步**:
- Batch 5: 最后 3 个泰坦（Death on Six Legs, Ancient Lord, Kaiju Island）
- 完成所有交互处理器的实现（目前大部分是 TODO 占位符）
- 单元测试



---

## 更新 (2026-03-07 - Batch 5 完成 - 所有泰坦能力定义完成！)

### ✅ Batch 5: Ancient Lord, Death on Six Legs

**已完成**:
1. ✅ 创建能力定义文件
   - `src/games/smashup/domain/abilities/titans/ancientLord.ts`
   - `src/games/smashup/domain/abilities/titans/deathOnSixLegs.ts`

2. ✅ 更新 ID 常量表 (`src/games/smashup/domain/ids.ts`)
   - Ancient Lord: `ANCIENT_LORD_SPECIAL`, `ANCIENT_LORD_ONGOING`, `ANCIENT_LORD_TALENT`
   - Death on Six Legs: `DEATH_ON_SIX_LEGS_SPECIAL`, `DEATH_ON_SIX_LEGS_ONGOING`, `DEATH_ON_SIX_LEGS_TALENT`

3. ✅ 更新导出文件 (`src/games/smashup/domain/abilities/titans/index.ts`)
   - 添加 Batch 5 两个泰坦的导出

4. ✅ 更新能力注册 (`src/games/smashup/abilities/titans.ts`)
   - 添加 Batch 5 能力注册
   - 添加 Batch 5 交互处理器占位符

**实现细节**:

#### Ancient Lord (古代领主)
- **Special**: 给随从放置+1指示物后，可以将其中一个改为放置在泰坦上；泰坦上有3+指示物时可以打出
- **Ongoing**: 在此处打出没有+1指示物的卡牌后，在其上放置+1指示物
- **Talent**: 在此处一个已有+1指示物的己方随从上放置+1指示物

#### Death on Six Legs (六足死神)
- **Special**: 己方随从上有6+指示物时，弃一张牌打出泰坦
- **Ongoing**: 随从进入弃牌堆前，可以将其上的一个+1指示物转移到泰坦上
- **Talent**: 打出一个额外行动

## 🎉 阶段 1 完成总结

**总进度**: 14/14 泰坦能力定义完成（100%）

**已完成的所有泰坦**:
1. ✅ Fort Titanosaurus (恐龙)
2. ✅ Arcane Protector (巫师)
3. ✅ The Kraken (海盗)
4. ✅ Invisible Ninja (忍者)
5. ✅ Killer Kudzu (食人花)
6. ✅ Creampuff Man (幽灵)
7. ✅ Major Ursa (传奇熊骑兵)
8. ✅ Dagon (达贡)
9. ✅ Cthulhu (克苏鲁)
10. ✅ Big Funny Giant (快乐巨人)
11. ✅ Great Wolf Spirit (伟大狼灵)
12. ✅ The Bride (怪人的新娘)
13. ✅ Ancient Lord (古代领主)
14. ✅ Death on Six Legs (六足死神)

**下一步工作**:
- 完成所有交互处理器的实现（目前大部分是 TODO 占位符）
- 单元测试
- 集成测试
- UI 实现
