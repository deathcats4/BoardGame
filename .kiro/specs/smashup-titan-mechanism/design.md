# Design Document: 大杀四方泰坦机制

## Overview

泰坦（Titan）是大杀四方游戏的一种全新卡牌类型，区别于随从（Minion）和行动（Action）。泰坦机制引入了独特的出场、移动、冲突和计分规则，为游戏增加了新的战术深度。

### 核心特性

1. **独占性**：每个玩家同时只能控制一个泰坦
2. **独立区域**：泰坦从专属的泰坦区域（Titan Zone）出场，不经过手牌
3. **冲突机制**：两个泰坦在同一基地时触发力量比较，力量较低者被移除
4. **力量指示物**：泰坦本身无力量值，通过 +1 力量指示物贡献基地力量
5. **特殊目标**：引入 `targetType: 'card'` 支持指定任意卡牌（包括泰坦）

### 设计目标

- **类型安全**：通过 TypeScript 类型系统确保泰坦不被错误的效果指定
- **性能优化**：冲突检查 O(1) 时间复杂度，避免遍历所有基地
- **可扩展性**：支持未来新增泰坦卡牌和泰坦专属能力
- **一致性**：与现有 1000+ 张卡牌正确交互，不破坏现有规则
- **可测试性**：完整的单元测试和 E2E 测试覆盖

### 架构原则

- **数据驱动**：泰坦配置通过 `AbilityDef` 注册，不硬编码逻辑
- **事件驱动**：所有泰坦操作通过事件系统记录，支持日志和动画
- **系统解耦**：泰坦系统独立实现，通过 `afterEvents` 钩子集成到现有流程
- **向后兼容**：不修改现有卡牌定义，通过新的目标类型扩展

## Architecture

### 系统层级

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  TitanZone, TitanCard, ClashAnimation, TitanTooltip         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Command Layer                            │
│  PLACE_TITAN, MOVE_TITAN, RESOLVE_TITAN_INTERACTION         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  validate.ts, execute.ts, reduce.ts                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Engine Layer                            │
│  TitanSystem, InteractionSystem, ScoringSystem              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Core State                             │
│  titanZone, activeTitan, bases                              │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **出场流程**：卡牌能力 → 创建交互 → 玩家选择基地 → PLACE_TITAN 命令 → 执行出场 → 检查冲突
2. **移动流程**：卡牌能力 → 创建交互 → 玩家选择基地 → MOVE_TITAN 命令 → 执行移动 → 检查冲突
3. **冲突流程**：泰坦到达基地 → TitanSystem.checkClash → 计算双方力量 → 移除失败方 → 触发事件
4. **计分流程**：基地达到 breakpoint → 计算总力量（包含泰坦力量指示物）→ 判定资格 → 分配奖励

### 系统集成点

- **InteractionSystem**：处理泰坦出场和移动的玩家选择
- **ScoringSystem**：计算基地力量时包含泰坦力量指示物，判定计分资格
- **AbilitySystem**：解析泰坦卡上的能力，触发泰坦相关效果
- **TargetSystem**：扩展目标类型，支持 `targetType: 'card'`
- **EventStreamSystem**：记录泰坦事件，供日志和动画使用

## Components and Interfaces

### Core State 扩展

```typescript
// src/games/smashup/types.ts

export interface SmashUpPlayer {
  // ... 现有字段
  titanZone: TitanCard[];           // 泰坦区域（未出场的泰坦）
  activeTitan: ActiveTitan | null;  // 当前出场的泰坦
}

export interface TitanCard {
  uid: string;
  defId: string;
  type: 'titan';
  factionId: string;
  abilities: string[];
}

export interface ActiveTitan {
  titanUid: string;      // 泰坦卡的 uid
  baseIndex: number;     // 泰坦所在基地索引
  powerTokens: number;   // 泰坦上的 +1 力量指示物数量
}
```

### 命令类型

```typescript
// src/games/smashup/domain/commands.ts

export interface PlaceTitanCommand {
  type: 'PLACE_TITAN';
  playerId: string;
  titanUid: string;
  baseIndex: number;
}

export interface MoveTitanCommand {
  type: 'MOVE_TITAN';
  playerId: string;
  titanUid: string;
  fromBaseIndex: number;
  toBaseIndex: number;
}

export interface AddTitanPowerTokenCommand {
  type: 'ADD_TITAN_POWER_TOKEN';
  playerId: string;
  titanUid: string;
  amount: number;
}

export interface RemoveTitanPowerTokenCommand {
  type: 'REMOVE_TITAN_POWER_TOKEN';
  playerId: string;
  titanUid: string;
  amount: number;
}
```

### 事件类型

```typescript
// src/games/smashup/domain/events.ts

export interface TitanPlacedEvent {
  type: 'TITAN_PLACED';
  playerId: string;
  titanUid: string;
  titanDefId: string;
  baseIndex: number;
  timestamp: number;
}

export interface TitanMovedEvent {
  type: 'TITAN_MOVED';
  playerId: string;
  titanUid: string;
  titanDefId: string;
  fromBaseIndex: number;
  toBaseIndex: number;
  timestamp: number;
}

export interface TitanClashEvent {
  type: 'TITAN_CLASH';
  baseIndex: number;
  attacker: {
    playerId: string;
    titanUid: string;
    titanDefId: string;
    totalPower: number;
  };
  defender: {
    playerId: string;
    titanUid: string;
    titanDefId: string;
    totalPower: number;
  };
  loser: string; // playerId of the loser
  timestamp: number;
}

export interface TitanRemovedEvent {
  type: 'TITAN_REMOVED';
  playerId: string;
  titanUid: string;
  titanDefId: string;
  baseIndex: number;
  reason: 'clash' | 'base_destroyed' | 'ability';
  timestamp: number;
}

export interface TitanPowerTokenAddedEvent {
  type: 'TITAN_POWER_TOKEN_ADDED';
  playerId: string;
  titanUid: string;
  amount: number;
  newTotal: number;
  timestamp: number;
}

export interface TitanPowerTokenRemovedEvent {
  type: 'TITAN_POWER_TOKEN_REMOVED';
  playerId: string;
  titanUid: string;
  amount: number;
  newTotal: number;
  timestamp: number;
}
```

### TitanSystem 接口

```typescript
// src/games/smashup/domain/systems/TitanSystem.ts

export interface TitanSystem {
  /**
   * 检查并解决泰坦冲突
   * @returns 冲突事件（如果发生冲突）
   */
  checkClash(state: SmashUpCore, baseIndex: number): TitanClashEvent | null;

  /**
   * 计算玩家在指定基地的总力量（包含泰坦力量指示物）
   */
  calculatePlayerPower(state: SmashUpCore, playerId: string, baseIndex: number): number;

  /**
   * 检查玩家是否满足计分资格
   */
  hasScoringEligibility(state: SmashUpCore, playerId: string, baseIndex: number): boolean;

  /**
   * 移除泰坦（返回泰坦区域）
   */
  removeTitan(state: SmashUpCore, playerId: string, reason: 'clash' | 'base_destroyed' | 'ability'): TitanRemovedEvent;

  /**
   * 获取基地上的所有泰坦
   */
  getTitansAtBase(state: SmashUpCore, baseIndex: number): Array<{ playerId: string; titan: ActiveTitan }>;
}
```

### 目标系统扩展

```typescript
// src/engine/primitives/target.ts

export type TargetType = 
  | 'minion'
  | 'action'
  | 'card'        // 新增：任意卡牌（随从、行动或泰坦）
  | 'base'
  | 'player';

export interface CardTarget {
  type: 'card';
  cardUid: string;
  cardType: 'minion' | 'action' | 'titan';
  playerId: string;
  location: 'field' | 'hand' | 'discard' | 'ongoing' | 'titan';
}
```

## Data Models

### 泰坦卡牌定义

```typescript
// src/games/smashup/domain/cards/titans.ts

export const TITAN_CARDS: Record<string, TitanCardDef> = {
  titan_rainboroc: {
    defId: 'titan_rainboroc',
    type: 'titan',
    factionId: 'kaiju',
    name: 'Rainboroc',
    abilities: ['titan_rainboroc_ability'],
    image: 'kaiju/titans/rainboroc.png',
  },
  titan_megabot: {
    defId: 'titan_megabot',
    type: 'titan',
    factionId: 'robots',
    name: 'Megabot',
    abilities: ['titan_megabot_ability'],
    image: 'robots/titans/megabot.png',
  },
  // ... 更多泰坦卡牌
};
```

### 泰坦能力定义

```typescript
// src/games/smashup/domain/abilities/titans.ts

export const TITAN_ABILITIES: Record<string, AbilityDef> = {
  titan_rainboroc_ability: {
    id: 'titan_rainboroc_ability',
    name: 'Rainboroc Ability',
    description: '当 Rainboroc 出场时，你可以摧毁一个力量 ≤ 3 的随从',
    trigger: {
      event: 'TITAN_PLACED',
      condition: (state, event) => event.titanDefId === 'titan_rainboroc',
    },
    effects: [
      {
        type: 'createInteraction',
        interactionType: 'choice',
        options: (state, ctx) => {
          // 获取所有力量 ≤ 3 的随从
          const targets = getAllMinions(state).filter(m => getMinionPower(m, state) <= 3);
          return targets.map(m => ({
            id: m.uid,
            label: `摧毁 ${getMinionName(m.defId)}`,
            value: { targetUid: m.uid },
          }));
        },
        optional: true,
      },
    ],
  },
  // ... 更多泰坦能力
};
```

### 冲突算法数据结构

```typescript
// src/games/smashup/domain/systems/TitanSystem.ts

interface ClashContext {
  baseIndex: number;
  base: BaseCard;
  titans: Array<{
    playerId: string;
    titan: ActiveTitan;
    totalPower: number;
    isDefender: boolean; // 先到达的泰坦为防守方
  }>;
}

interface ClashResult {
  winner: string;  // playerId
  loser: string;   // playerId
  winnerPower: number;
  loserPower: number;
}
```

### 计分资格数据结构

```typescript
// src/games/smashup/domain/systems/ScoringSystem.ts

interface ScoringEligibility {
  playerId: string;
  hasMinion: boolean;
  hasTitan: boolean;
  totalPower: number;
  isEligible: boolean; // hasMinion || totalPower >= 1
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 泰坦类型隔离

*For any* 泰坦卡牌，它不应该被"目标随从"或"目标行动"的效果指定，也不应该触发"打出随从"或"打出行动"的效果

**Validates: Requirements 1.5, 1.6, 12.1, 12.2**

### Property 2: 泰坦卡牌定义完整性

*For any* 泰坦卡牌定义，它必须包含 `defId`、`name`、`factionId`、`abilities` 字段，且不包含 `power` 字段

**Validates: Requirements 1.2, 1.3**

### Property 3: 泰坦区域隔离性

*For any* 洗牌、抽牌或弃牌操作，它不应该修改玩家的 `titanZone` 字段

**Validates: Requirements 2.5**

### Property 4: 泰坦离场清理

*For any* 泰坦移除操作（冲突、基地摧毁或能力效果），泰坦卡应该返回 `titanZone`，`activeTitan` 应该为 null，且所有力量指示物应该被清除

**Validates: Requirements 2.6, 5.6, 7.3, 9.4**

### Property 5: 泰坦出场独占性

*For any* 玩家，如果 `activeTitan` 不为 null，则 PLACE_TITAN 命令应该被验证系统拒绝

**Validates: Requirements 3.4, 14.1**

### Property 6: 泰坦出场状态变更

*For any* 成功的泰坦出场操作，泰坦卡应该从 `titanZone` 移除，`activeTitan` 应该包含正确的 `titanUid`、`baseIndex` 和 `powerTokens`（初始为 0）

**Validates: Requirements 3.5**

### Property 7: 泰坦出场不计入额外卡牌

*For any* 泰坦出场操作，它不应该触发"额外卡牌计数"效果（如 Eliza 的能力）

**Validates: Requirements 3.6, 12.7**

### Property 8: 泰坦移动所有权不变

*For any* 泰坦移动操作，移动后泰坦的 `playerId` 应该与移动前相同

**Validates: Requirements 4.3**

### Property 9: 泰坦移动状态变更

*For any* 成功的泰坦移动操作，泰坦的 `baseIndex` 应该更新为目标基地索引，且不应该等于原基地索引

**Validates: Requirements 4.4, 14.4**

### Property 10: 泰坦冲突触发

*For any* 基地，如果有两个不同玩家的泰坦在该基地上（且基地不是 Kaiju Island），则应该触发 TITAN_CLASH 事件

**Validates: Requirements 5.1, 5.7**

### Property 11: 泰坦冲突力量比较

*For any* 泰坦冲突，力量较低的泰坦应该被移除，如果力量相等则后到达的泰坦（进攻方）被移除

**Validates: Requirements 5.3, 5.4**

### Property 12: Kaiju Island 冲突例外

*For any* 基地，如果基地是 Kaiju Island，则不应该触发泰坦冲突，允许多个泰坦共存

**Validates: Requirements 5.5**

### Property 13: 目标类型 'card' 包含所有卡牌

*For any* 使用 `targetType: 'card'` 的能力，它应该允许选择随从、行动或泰坦

**Validates: Requirements 6.1, 6.2**

### Property 14: 目标类型 'minion' 和 'action' 排除泰坦

*For any* 使用 `targetType: 'minion'` 或 `targetType: 'action'` 的能力，它不应该允许选择泰坦

**Validates: Requirements 6.3, 6.4**

### Property 15: 特定卡牌使用 targetType 'card'

*For any* 以下卡牌（Into the Time Slip、Purge the Demon、Potion of Paralysis、There Goes Tokyo、Cab-over Pete、Expert Timing、Stagecoach），它们的能力定义应该包含 `targetType: 'card'`

**Validates: Requirements 6.5**

### Property 16: 基地摧毁时移除泰坦

*For any* 基地摧毁或替换操作，该基地上的所有泰坦应该被移除并返回 `titanZone`

**Validates: Requirements 7.1, 7.2, 7.5**

### Property 17: 泰坦移除不触发随从事件

*For any* 泰坦移除操作，它不应该触发 MINION_DESTROYED 或 CARD_DISCARDED 事件

**Validates: Requirements 7.4**

### Property 18: 计分包含泰坦力量指示物

*For any* 基地力量计算，玩家的总力量应该包含其泰坦上的 `powerTokens` 数量

**Validates: Requirements 8.1, 8.2, 8.6, 9.6**

### Property 19: 计分资格判定

*For any* 玩家在基地上的计分资格判定，玩家应该满足以下条件之一：至少有一个随从，或总力量 ≥ 1

**Validates: Requirements 8.3**

### Property 20: 力量指示物添加和移除

*For any* 力量指示物添加操作，泰坦的 `powerTokens` 应该增加对应数量；*For any* 力量指示物移除操作，泰坦的 `powerTokens` 应该减少对应数量且不小于 0

**Validates: Requirements 9.2, 9.3**

### Property 21: 泰坦能力触发

*For any* 泰坦出场操作，泰坦卡上的所有能力应该被解析并触发

**Validates: Requirements 10.2**

### Property 22: 泰坦持续能力生效和失效

*For any* 泰坦的持续能力，它应该在泰坦在场时生效，在泰坦离场时失效

**Validates: Requirements 10.6**

### Property 23: 泰坦不受随从操作影响

*For any* 以下操作（摧毁随从、返回手牌、弃置卡牌、洗入牌库、移动随从），它们不应该能够指定泰坦作为目标

**Validates: Requirements 12.3, 12.4, 12.5, 12.6, 12.8**

### Property 24: 泰坦状态序列化和反序列化

*For any* 游戏状态，序列化后再反序列化应该保留 `titanZone` 和 `activeTitan` 的完整信息（round trip）

**Validates: Requirements 13.1, 13.2**

### Property 25: 泰坦操作可撤销

*For any* 泰坦出场、移动或冲突操作，撤销后游戏状态应该恢复到操作前的状态

**Validates: Requirements 13.3**

### Property 26: 泰坦事件可回放

*For any* 包含泰坦操作的游戏记录，回放后的最终状态应该与原始游戏的最终状态一致

**Validates: Requirements 13.4**

### Property 27: 泰坦验证规则

*For any* 以下非法操作（已有泰坦时出场新泰坦、移动不存在的泰坦、未授权移动对手泰坦、移动到当前基地），验证系统应该拒绝并返回错误信息

**Validates: Requirements 14.1, 14.2, 14.3, 14.4**

### Property 28: 泰坦事件日志

*For any* 泰坦相关事件（TITAN_PLACED、TITAN_MOVED、TITAN_CLASH、TITAN_REMOVED、TITAN_POWER_TOKEN_ADDED、TITAN_POWER_TOKEN_REMOVED），ActionLog 系统应该生成对应的可读日志条目

**Validates: Requirements 15.7**

## Error Handling

### 验证错误

- **已有泰坦时出场新泰坦**：返回错误 `"你已经有一个出场的泰坦"`
- **移动不存在的泰坦**：返回错误 `"你没有出场的泰坦"`
- **未授权移动对手泰坦**：返回错误 `"你不能移动对手的泰坦"`
- **移动到当前基地**：返回错误 `"泰坦已经在该基地上"`
- **使用错误目标类型**：返回错误 `"泰坦不是随从/行动"`

### 执行错误

- **泰坦卡不在 titanZone**：记录警告并跳过出场操作
- **基地索引越界**：返回错误 `"无效的基地索引"`
- **力量指示物数量为负**：自动修正为 0 并记录警告

### 状态不一致

- **activeTitan 引用的泰坦卡不存在**：自动清除 activeTitan 并记录错误
- **titanZone 包含重复的泰坦卡**：自动去重并记录警告
- **泰坦在不存在的基地上**：自动移除泰坦并记录错误

## Testing Strategy

### 单元测试

使用 GameTestRunner 覆盖以下场景：

1. **泰坦出场**
   - 正常出场流程（titanZone → activeTitan）
   - 已有泰坦时拒绝出场
   - 出场后触发泰坦能力
   - 出场后触发冲突（如果目标基地已有对手泰坦）

2. **泰坦移动**
   - 移动自己的泰坦
   - 移动对手的泰坦（需要特殊能力）
   - 移动到当前基地被拒绝
   - 移动后触发冲突

3. **泰坦冲突**
   - 力量较低的泰坦被移除
   - 力量相等时后到达的泰坦被移除
   - Kaiju Island 上不触发冲突
   - 冲突后泰坦返回 titanZone

4. **泰坦计分**
   - 计算基地力量时包含泰坦力量指示物
   - 只有泰坦且力量为 0 时不能计分
   - 只有泰坦且力量 ≥ 1 时可以计分
   - 有随从时无论泰坦力量多少都可以计分

5. **泰坦力量指示物**
   - 添加力量指示物
   - 移除力量指示物（不小于 0）
   - 泰坦离场时清除力量指示物

6. **泰坦与现有机制交互**
   - 泰坦不触发"打出随从"效果
   - 泰坦不能被"摧毁随从"效果指定
   - 泰坦不能被"返回手牌"效果指定
   - 泰坦不计入"额外卡牌"计数

7. **目标系统**
   - `targetType: 'card'` 可以选择泰坦
   - `targetType: 'minion'` 不能选择泰坦
   - `targetType: 'action'` 不能选择泰坦

8. **基地摧毁**
   - 基地摧毁时移除泰坦
   - 基地替换时移除泰坦

### 属性测试

使用 Property-Based Testing 覆盖以下属性（每个测试至少 100 次迭代）：

1. **Property 1-28**：按照 Correctness Properties 部分定义的属性编写测试
2. **标签格式**：`Feature: smashup-titan-mechanism, Property {number}: {property_text}`

### E2E 测试

使用 Playwright 覆盖以下完整流程：

1. **泰坦出场和冲突**
   - 玩家 A 出场泰坦到基地 0
   - 玩家 B 出场泰坦到基地 0
   - 验证冲突触发，力量较低的泰坦被移除
   - 验证 UI 显示冲突动画和日志

2. **泰坦移动和冲突**
   - 玩家 A 出场泰坦到基地 0
   - 玩家 B 出场泰坦到基地 1
   - 玩家 B 使用 Cab-over Pete 移动泰坦到基地 0
   - 验证冲突触发

3. **泰坦计分**
   - 玩家 A 出场泰坦到基地 0，添加 2 个力量指示物
   - 基地达到 breakpoint
   - 验证玩家 A 可以获得基地奖励

4. **Kaiju Island 特殊规则**
   - 基地 0 是 Kaiju Island
   - 玩家 A 和玩家 B 都出场泰坦到基地 0
   - 验证不触发冲突，两个泰坦共存

5. **目标系统**
   - 玩家 A 出场泰坦到基地 0
   - 玩家 B 使用 Into the Time Slip（targetType: 'card'）移除泰坦
   - 验证泰坦被移除

### 测试覆盖目标

- 单元测试：覆盖所有命令、事件和验证规则
- 属性测试：覆盖所有 28 个 Correctness Properties
- E2E 测试：覆盖所有交互链和特殊场景
- 代码覆盖率：≥ 90%

