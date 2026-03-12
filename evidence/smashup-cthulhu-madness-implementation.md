# SmashUp Cthulhu 疯狂牌功能实现

**日期**: 2026-03-07
**任务**: 实现 Cthulhu 泰坦的疯狂牌抽取和转移功能

## 背景

Cthulhu 泰坦的 Special 和 Talent 能力涉及疯狂牌系统：
- **Special**: 抽取2张疯狂牌，打出泰坦到有己方随从的基地
- **Talent**: 抽取一张疯狂牌，或将手牌中的疯狂牌放入对手手牌

之前的实现是占位符（TODO 注释），需要实现完整的疯狂牌逻辑。

## 疯狂牌系统现状

项目中已经存在完整的疯狂牌系统：

### 常量定义（`src/games/smashup/domain/types.ts`）
```typescript
/** 疯狂牌库初始数量 */
export const MADNESS_DECK_SIZE = 30;
/** 疯狂卡 defId */
export const MADNESS_CARD_DEF_ID = 'special_madness';
/** 疯狂卡 faction */
export const MADNESS_FACTION = SMASHUP_FACTION_IDS.MADNESS;
/** 克苏鲁扩展派系（使用疯狂牌库的派系） */
export const CTHULHU_EXPANSION_FACTIONS = [
    SMASHUP_FACTION_IDS.MINIONS_OF_CTHULHU,
    SMASHUP_FACTION_IDS.ELDER_THINGS,
    SMASHUP_FACTION_IDS.INNSMOUTH,
    SMASHUP_FACTION_IDS.MISKATONIC_UNIVERSITY,
    // ... POD 派系
] as const;
```

### 状态字段（`SmashUpCore`）
```typescript
export interface SmashUpCore {
    // ...
    /** 疯狂牌库（克苏鲁扩展，defId 列表） */
    madnessDeck?: string[];
}
```

### 事件定义（`src/games/smashup/domain/events.ts`）
```typescript
export const SU_EVENT_TYPES = {
    // ...
    MADNESS_DRAWN: SU_EVENTS['su:madness_drawn'].type,
    MADNESS_RETURNED: SU_EVENTS['su:madness_returned'].type,
};
```

### 事件接口（`src/games/smashup/domain/types.ts`）
```typescript
/** 疯狂卡抽取事件 */
export interface MadnessDrawnEvent extends GameEvent<typeof SU_EVENTS.MADNESS_DRAWN> {
    payload: {
        playerId: PlayerId;
        /** 抽取数量 */
        count: number;
        /** 生成的疯狂卡实例 UID 列表 */
        cardUids: string[];
        reason: string;
    };
}

/** 疯狂卡返回事件 */
export interface MadnessReturnedEvent extends GameEvent<typeof SU_EVENTS.MADNESS_RETURNED> {
    payload: {
        playerId: PlayerId;
        cardUid: string;
        reason: string;
    };
}
```

## 实现方案

### 1. Cthulhu Special（抽2张疯狂牌）

#### 能力定义（`src/games/smashup/domain/abilities/titans/cthulhu.ts`）

**修改前**：
```typescript
export function cthulhuSpecial(ctx: AbilityContext): AbilityResult {
    // ...
    // TODO: 检查疯狂牌库是否有至少2张牌
    // if (state.core.madnessDeck.length < 2) {
    //     return {
    //         canActivate: false,
    //         reason: '疯狂牌库中没有足够的牌',
    //     };
    // }
    
    return {
        canActivate: true,
        requiresInteraction: true,
        interactionType: 'choice',
        interactionData: {
            title: '打出 Cthulhu',
            description: '抽取两张疯狂牌，选择一个有你随从的基地',
            // ...
        },
    };
}
```

**修改后**：
```typescript
export function cthulhuSpecial(ctx: AbilityContext): AbilityResult {
    const { state, playerId } = ctx;
    
    // 检查是否有基地上有己方随从
    const basesWithMyMinions = state.core.bases.filter((base, baseIndex) => {
        return base.minions.some(m => m.ownerId === playerId);
    });
    
    if (basesWithMyMinions.length === 0) {
        return {
            canActivate: false,
            reason: '没有基地上有你的随从',
        };
    }
    
    // 检查疯狂牌库是否有牌（至少1张，最多2张）
    const madnessDeck = state.core.madnessDeck || [];
    if (madnessDeck.length === 0) {
        return {
            canActivate: false,
            reason: '疯狂牌库中没有牌',
        };
    }
    
    return {
        canActivate: true,
        requiresInteraction: true,
        interactionType: 'choice',
        interactionData: {
            title: '打出 Cthulhu',
            description: `抽取${Math.min(2, madnessDeck.length)}张疯狂牌，选择一个有你随从的基地`,
            options: basesWithMyMinions.map((base, baseIndex) => ({
                id: `base-${baseIndex}`,
                label: `基地 ${baseIndex + 1}`,
                value: { baseIndex },
            })),
        },
    };
}
```

**关键改进**：
1. 检查疯狂牌库是否有牌（至少1张）
2. 动态显示抽取数量（1张或2张）
3. 移除了所有 TODO 注释

#### 交互处理器（`src/games/smashup/abilities/titans.ts`）

**修改前**：
```typescript
registerInteractionHandler(
    'cthulhu_minions_cthulhu_special',
    (state, playerId, value, _iData, _random, timestamp) => {
        const { baseIndex } = value as { baseIndex: number };
        const events: SmashUpEvent[] = [];
        const player = state.core.players[playerId];
        
        // 抽2张疯狂牌
        // TODO: 需要实现疯狂牌抽取逻辑
        
        const titanCard = player.titanZone.find(c => c.defId === 'titan_cthulhu');
        if (!titanCard) return { state, events };
        
        events.push({
            type: SU_EVENTS.TITAN_PLACED,
            payload: {
                playerId,
                titanUid: titanCard.uid,
                titanDefId: titanCard.defId,
                baseIndex
            },
            timestamp,
        });
        
        return { state, events };
    }
);
```

**修改后**：
```typescript
registerInteractionHandler(
    'cthulhu_minions_cthulhu_special',
    (state, playerId, value, _iData, _random, timestamp) => {
        const { baseIndex } = value as { baseIndex: number };
        const events: SmashUpEvent[] = [];
        const player = state.core.players[playerId];
        
        // 抽2张疯狂牌
        const madnessDeck = state.core.madnessDeck || [];
        const madnessCount = Math.min(2, madnessDeck.length);
        
        if (madnessCount > 0) {
            const cardUids: string[] = [];
            for (let i = 0; i < madnessCount; i++) {
                cardUids.push(`madness-${state.core.nextUid++}`);
            }
            
            events.push({
                type: SU_EVENTS.MADNESS_DRAWN,
                payload: {
                    playerId,
                    count: madnessCount,
                    cardUids,
                    reason: 'Cthulhu Special'
                },
                timestamp,
            });
        }
        
        // 打出泰坦
        const titanCard = player.titanZone.find(c => c.defId === 'titan_cthulhu');
        if (!titanCard) return { state, events };
        
        events.push({
            type: SU_EVENTS.TITAN_PLACED,
            payload: {
                playerId,
                titanUid: titanCard.uid,
                titanDefId: titanCard.defId,
                baseIndex
            },
            timestamp,
        });
        
        return { state, events };
    }
);
```

**关键改进**：
1. 从 `state.core.madnessDeck` 获取疯狂牌库
2. 计算实际抽取数量（最多2张）
3. 生成唯一的卡牌 UID（使用 `state.core.nextUid`）
4. 生成 `MADNESS_DRAWN` 事件

### 2. Cthulhu Talent（抽疯狂牌或给对手疯狂牌）

#### 能力定义（`src/games/smashup/domain/abilities/titans/cthulhu.ts`）

**修改前**：
```typescript
export function cthulhuTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId } = ctx;
    const player = state.core.players[playerId];
    const titan = player.activeTitan;
    
    if (!titan) {
        return {
            canActivate: false,
            reason: '泰坦不在场上',
        };
    }
    
    // TODO: 检查手牌中是否有疯狂牌
    // const madnessCardsInHand = player.hand.filter(card => card.type === 'madness');
    
    // TODO: 检查疯狂牌库是否有牌
    // const canDrawMadness = state.core.madnessDeck.length > 0;
    
    // 临时实现：只提供"抽取疯狂牌"选项
    return {
        canActivate: true,
        requiresInteraction: true,
        interactionType: 'choice',
        interactionData: {
            title: 'Cthulhu - 天赋能力',
            description: '选择一个选项',
            options: [
                {
                    id: 'draw-madness',
                    label: '抽取一张疯狂牌',
                    value: { action: 'draw' },
                },
                // TODO: 添加"放入对手手牌"选项
            ],
        },
    };
}
```

**修改后**：
```typescript
export function cthulhuTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId } = ctx;
    const player = state.core.players[playerId];
    const titan = player.activeTitan;
    
    if (!titan) {
        return {
            canActivate: false,
            reason: '泰坦不在场上',
        };
    }
    
    // 检查手牌中是否有疯狂牌
    const madnessCardsInHand = player.hand.filter((card: any) => card.defId === 'special_madness');
    
    // 检查疯狂牌库是否有牌
    const madnessDeck = state.core.madnessDeck || [];
    const canDrawMadness = madnessDeck.length > 0;
    const canGiveMadness = madnessCardsInHand.length > 0;
    
    if (!canDrawMadness && !canGiveMadness) {
        return {
            canActivate: false,
            reason: '疯狂牌库中没有牌，且手牌中没有疯狂牌',
        };
    }
    
    const options: any[] = [];
    
    if (canDrawMadness) {
        options.push({
            id: 'draw-madness',
            label: '抽取一张疯狂牌',
            value: { action: 'draw' },
        });
    }
    
    if (canGiveMadness) {
        options.push({
            id: 'give-madness',
            label: '将疯狂牌放入对手手牌',
            value: { action: 'give' },
        });
    }
    
    return {
        canActivate: true,
        requiresInteraction: true,
        interactionType: 'choice',
        interactionData: {
            title: 'Cthulhu - 天赋能力',
            description: '选择一个选项',
            options,
        },
    };
}
```

**关键改进**：
1. 检查手牌中是否有疯狂牌（使用 `defId === 'special_madness'`）
2. 检查疯狂牌库是否有牌
3. 动态生成可用选项（至少有一个选项可用）
4. 移除了所有 TODO 注释

#### 交互处理器（`src/games/smashup/abilities/titans.ts`）

**修改前**：
```typescript
registerInteractionHandler(
    'cthulhu_minions_cthulhu_talent',
    (state, playerId, value, _iData, _random, timestamp) => {
        const { action } = value as { action: 'draw' | 'give' };
        const events: SmashUpEvent[] = [];
        
        if (action === 'draw') {
            // TODO: 抽取一张疯狂牌
        } else if (action === 'give') {
            // TODO: 将疯狂牌放入对手手牌
        }
        
        return { state, events };
    }
);
```

**修改后**：
```typescript
registerInteractionHandler(
    'cthulhu_minions_cthulhu_talent',
    (state, playerId, value, _iData, _random, timestamp) => {
        const { action } = value as { action: 'draw' | 'give' };
        const events: SmashUpEvent[] = [];
        
        if (action === 'draw') {
            // 抽取一张疯狂牌
            const madnessDeck = state.core.madnessDeck || [];
            if (madnessDeck.length > 0) {
                const cardUid = `madness-${state.core.nextUid++}`;
                events.push({
                    type: SU_EVENTS.MADNESS_DRAWN,
                    payload: {
                        playerId,
                        count: 1,
                        cardUids: [cardUid],
                        reason: 'Cthulhu Talent'
                    },
                    timestamp,
                });
            }
        } else if (action === 'give') {
            // 将疯狂牌放入对手手牌
            const player = state.core.players[playerId];
            const madnessCard = player.hand.find((c: any) => c.defId === MADNESS_CARD_DEF_ID);
            
            if (madnessCard) {
                // 找到对手
                const opponentId = state.core.turnOrder.find(pid => pid !== playerId);
                if (opponentId) {
                    events.push({
                        type: SU_EVENTS.CARD_TRANSFERRED,
                        payload: {
                            cardUid: madnessCard.uid,
                            defId: madnessCard.defId,
                            fromPlayerId: playerId,
                            toPlayerId: opponentId,
                            reason: 'Cthulhu Talent'
                        },
                        timestamp,
                    });
                }
            }
        }
        
        return { state, events };
    }
);
```

**关键改进**：
1. **选项1（抽疯狂牌）**：
   - 从 `state.core.madnessDeck` 获取疯狂牌库
   - 生成唯一的卡牌 UID
   - 生成 `MADNESS_DRAWN` 事件
2. **选项2（给对手疯狂牌）**：
   - 从手牌中找到疯狂牌（使用 `MADNESS_CARD_DEF_ID` 常量）
   - 找到对手玩家 ID
   - 生成 `CARD_TRANSFERRED` 事件

### 3. Import 修复

在 `src/games/smashup/abilities/titans.ts` 中添加 `MADNESS_CARD_DEF_ID` import：

```typescript
import { MADNESS_CARD_DEF_ID } from '../domain/types';
```

## 测试结果

### 单元测试
```bash
npm test -- src/games/smashup/domain/__tests__/titanAbilities.test.ts
```

**结果**: ✅ 85/85 tests passed

### TypeScript 编译检查
```bash
npx tsc --noEmit
```

**结果**: ✅ 无错误

## 修改的文件

1. **`src/games/smashup/domain/abilities/titans/cthulhu.ts`**
   - 移除了所有 TODO 注释
   - 完善了 `cthulhuSpecial` 能力定义（检查疯狂牌库、动态显示抽取数量）
   - 完善了 `cthulhuTalent` 能力定义（检查疯狂牌库和手牌、动态生成选项）

2. **`src/games/smashup/abilities/titans.ts`**
   - 实现了 `cthulhu_minions_cthulhu_special` 交互处理器（疯狂牌抽取）
   - 实现了 `cthulhu_minions_cthulhu_talent` 交互处理器（完整的两个选项）
   - 添加了 `MADNESS_CARD_DEF_ID` import

## 技术要点

### 1. 疯狂牌 UID 生成
使用 `state.core.nextUid++` 生成唯一的卡牌 UID：
```typescript
const cardUid = `madness-${state.core.nextUid++}`;
```

### 2. 疯狂牌识别
使用 `MADNESS_CARD_DEF_ID` 常量（值为 `'special_madness'`）：
```typescript
const madnessCard = player.hand.find((c: any) => c.defId === MADNESS_CARD_DEF_ID);
```

### 3. 动态选项生成
根据游戏状态动态生成可用选项：
```typescript
const options: any[] = [];

if (canDrawMadness) {
    options.push({
        id: 'draw-madness',
        label: '抽取一张疯狂牌',
        value: { action: 'draw' },
    });
}

if (canGiveMadness) {
    options.push({
        id: 'give-madness',
        label: '将疯狂牌放入对手手牌',
        value: { action: 'give' },
    });
}
```

### 4. 事件生成
使用正确的事件类型和 payload 结构：
```typescript
// 抽疯狂牌
events.push({
    type: SU_EVENTS.MADNESS_DRAWN,
    payload: {
        playerId,
        count: 1,
        cardUids: [cardUid],
        reason: 'Cthulhu Talent'
    },
    timestamp,
});

// 转移卡牌
events.push({
    type: SU_EVENTS.CARD_TRANSFERRED,
    payload: {
        cardUid: madnessCard.uid,
        defId: madnessCard.defId,
        fromPlayerId: playerId,
        toPlayerId: opponentId,
        reason: 'Cthulhu Talent'
    },
    timestamp,
});
```

## 总结

成功实现了 Cthulhu 泰坦的疯狂牌功能：
- ✅ Special: 抽取2张疯狂牌（或更少，如果牌库不足）
- ✅ Talent: 抽取一张疯狂牌，或将手牌中的疯狂牌放入对手手牌
- ✅ 所有测试通过（85/85）
- ✅ TypeScript 编译无错误
- ✅ 移除了所有 TODO 注释
- ✅ 代码质量良好，符合项目规范

疯狂牌系统已经完整实现，Cthulhu 泰坦的能力可以正常使用。
