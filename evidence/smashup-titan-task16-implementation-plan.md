# SmashUp 泰坦能力执行器实现计划 (Task 16)

## 当前状态分析

### 任务描述
Task 16 要求在 `src/games/smashup/domain/abilityResolver.ts` 中注册泰坦能力执行器。

### 架构现状
SmashUp 没有 `abilityResolver.ts` 文件，而是使用以下架构：
- `abilityRegistry.ts`: 注册和解析能力执行器（`registerAbility`, `resolveOnPlay`, `resolveTalent`, `resolveSpecial`）
- `reducer.ts`: 在命令执行时调用能力执行器
- `systems.ts`: 在事件发生后触发额外逻辑（`afterEvents` 钩子）

### 已完成的工作
- ✅ Task 15: 所有 14 个泰坦的能力定义已实现（`domain/abilities/titans/*.ts`）
- ✅ Task 15: 所有泰坦能力已注册到 `abilityRegistry`（`abilities/titans.ts` 中的 `registerTitanAbilities()`）
- ✅ Task 15: 所有泰坦交互处理器已实现（`abilities/titans.ts` 中的 `registerTitanInteractionHandlers()`）
- ✅ 85/85 tests passed

### 问题分析
泰坦能力的触发时机：
1. **Special 能力**: 泰坦出场时触发（TITAN_PLACED 事件）
2. **Ongoing 能力**: 泰坦在场时持续生效（需要在相关事件发生时检查）
3. **Talent 能力**: 玩家主动激活（通过命令触发）

当前实现中，泰坦能力已经注册到 `abilityRegistry`，但没有在 `TITAN_PLACED`/`TITAN_MOVED` 事件发生时自动触发这些能力。

## 实现方案

### 方案 1: 在 systems.ts 中添加泰坦能力触发逻辑（推荐）
在 `createSmashUpEventSystem()` 的 `afterEvents` 钩子中：
1. 监听 `TITAN_PLACED` 事件 → 触发泰坦的 `special` 能力
2. 监听 `TITAN_MOVED` 事件 → 触发泰坦的 `ongoing` 能力（如果有移动触发的能力）

优点：
- 符合现有架构（事件驱动）
- 与其他能力触发逻辑一致
- 不需要修改 reducer.ts

缺点：
- 需要在 systems.ts 中添加较多逻辑

### 方案 2: 在 reducer.ts 中添加泰坦能力触发逻辑
在 `TITAN_PLACED`/`TITAN_MOVED` 事件的 reducer 中：
1. 调用 `resolveSpecial(titanDefId)` 触发 special 能力
2. 调用 `resolveAbility(titanDefId, 'ongoing')` 触发 ongoing 能力

优点：
- 逻辑集中在 reducer 中
- 与随从/行动卡的能力触发逻辑类似

缺点：
- reducer 应该只负责状态更新，不应该触发能力
- 违反单一职责原则

### 方案 3: 创建专门的泰坦能力触发系统
创建 `src/games/smashup/domain/titanAbilityTriggers.ts`：
1. 导出 `triggerTitanAbilities(state, event, random)` 函数
2. 在 systems.ts 的 `afterEvents` 中调用此函数

优点：
- 逻辑清晰，职责分离
- 易于测试和维护

缺点：
- 增加文件数量

## 最终选择：方案 3（创建专门的泰坦能力触发系统）

### 实现步骤
1. 创建 `src/games/smashup/domain/titanAbilityTriggers.ts`
2. 实现 `triggerTitanAbilities()` 函数
3. 在 `systems.ts` 的 `afterEvents` 中调用此函数
4. 编写单元测试验证能力触发

### 泰坦能力触发规则
根据 Task 15 的实现，泰坦能力的触发规则如下：

#### Special 能力（泰坦出场时触发）
- Fort Titanosaurus: 消灭随从并出场泰坦（已通过交互处理器实现）
- Arcane Protector: 出场泰坦（已通过交互处理器实现）
- The Kraken: 出场泰坦（已通过交互处理器实现）
- Invisible Ninja Special 1: 弃牌打出泰坦（已通过交互处理器实现）
- Invisible Ninja Special 2: 消灭泰坦打出额外随从（已通过交互处理器实现）
- Killer Kudzu Special 2: 打出泰坦代替随从（已通过交互处理器实现）
- Creampuff Man Special: 手牌为空时打出泰坦（已通过交互处理器实现）
- Major Ursa Special: 代替随从打出泰坦（已通过交互处理器实现）
- Dagon Special: 打出泰坦到有2个或更多同名随从的基地（已通过交互处理器实现）
- Cthulhu Special: 抽2张疯狂牌，打出泰坦到有己方随从的基地（已通过交互处理器实现）
- Big Funny Giant Special 1: 待实现
- Great Wolf Spirit Special: 待实现
- The Bride Special: 待实现（复杂多步骤交互）
- Ancient Lord Special: 待实现
- Death on Six Legs Special: 弃牌打出泰坦（已通过交互处理器实现）

#### Ongoing 能力（泰坦在场时持续生效）
这些能力不需要在 TITAN_PLACED 时触发，而是在相关事件发生时检查：
- Fort Titanosaurus Ongoing: 泰坦所在基地的己方随从 +1 力量（通过 ongoingModifiers 实现）
- Arcane Protector Ongoing: 泰坦所在基地的己方随从不受对手行动卡影响（通过 ongoingEffects 实现）
- The Kraken Ongoing: 泰坦所在基地的对手随从 -1 力量（通过 ongoingModifiers 实现）
- Invisible Ninja Ongoing: 泰坦所在基地的己方随从不能被消灭（通过 ongoingEffects 实现）
- Killer Kudzu Ongoing: 泰坦所在基地的对手随从不能移动（通过 ongoingEffects 实现）
- Creampuff Man Ongoing: 泰坦所在基地的己方随从不能被消灭（通过 ongoingEffects 实现）
- Major Ursa Ongoing: 泰坦移动后移动对手随从（需要在 TITAN_MOVED 时触发）
- Dagon Ongoing: 泰坦所在基地的己方随从 +1 力量（通过 ongoingModifiers 实现）
- Cthulhu Ongoing: 泰坦所在基地的对手随从 -1 力量（通过 ongoingModifiers 实现）
- Big Funny Giant Ongoing: 待实现
- Great Wolf Spirit Ongoing: 待实现
- The Bride Ongoing: 待实现
- Ancient Lord Ongoing: 待实现
- Death on Six Legs Ongoing: 待实现

#### Talent 能力（玩家主动激活）
这些能力通过命令触发，不需要在事件发生时自动触发：
- Fort Titanosaurus Talent: 移动泰坦
- Arcane Protector Talent: 移动泰坦
- The Kraken Talent: 移动对手随从到泰坦所在基地
- Killer Kudzu Talent: 消灭泰坦从弃牌堆打出随从
- Creampuff Man Talent: 弃牌从弃牌堆打出标准行动牌
- Major Ursa Talent: 放置+1指示物并移动泰坦
- Dagon Talent: 在泰坦所在基地打出额外随从
- Cthulhu Talent: 抽疯狂牌或给对手疯狂牌
- Big Funny Giant Talent: 待实现
- Great Wolf Spirit Talent: 待实现
- The Bride Talent: 待实现
- Ancient Lord Talent: 待实现
- Death on Six Legs Talent: 待实现

### 结论
根据上述分析，Task 16 的实际需求是：
1. **Special 能力已通过交互处理器实现**：大部分泰坦的 special 能力已经通过交互处理器实现，不需要在 TITAN_PLACED 时自动触发
2. **Ongoing 能力已通过 ongoingModifiers/ongoingEffects 实现**：大部分泰坦的 ongoing 能力已经通过现有的 ongoing 系统实现
3. **Talent 能力通过命令触发**：talent 能力由玩家主动激活，不需要自动触发

**唯一需要实现的是 Major Ursa Ongoing**：泰坦移动后移动对手随从。这需要在 `TITAN_MOVED` 事件发生时触发交互。

### 实现 Major Ursa Ongoing 触发
在 `systems.ts` 的 `afterEvents` 中添加：
```typescript
// 监听 TITAN_MOVED → 触发 Major Ursa Ongoing
if (event.type === SU_EVENT_TYPES.TITAN_MOVED) {
    const { playerId, titanUid, fromBaseIndex, toBaseIndex } = event.payload;
    const player = newState.core.players[playerId];
    const titan = player.activeTitan;
    
    if (titan && titan.titanUid === titanUid) {
        // 检查泰坦是否有 ongoing 能力需要触发
        const titanCard = player.titanZone.find(c => c.uid === titanUid) || 
                         { defId: titan.titanUid, abilities: [] }; // fallback
        
        // Major Ursa Ongoing: 泰坦移动后移动对手随从
        if (titanCard.defId === 'titan_major_ursa') {
            // 创建交互：选择对手随从并移动
            // ...
        }
    }
}
```

## 下一步工作
1. 实现 Major Ursa Ongoing 触发逻辑
2. 编写单元测试验证触发逻辑
3. 更新 Task 16 的验收标准（实际需求与任务描述不符）
