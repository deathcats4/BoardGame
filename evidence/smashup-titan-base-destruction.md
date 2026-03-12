# 大杀四方 - 泰坦基地摧毁集成

## 实现概述

为泰坦机制添加了基地摧毁和替换时的自动移除逻辑，确保泰坦在基地被清除或替换时正确返回泰坦区域。

## 实现内容

### 1. BASE_CLEARED 事件处理器扩展

**文件**: `src/games/smashup/domain/reduce.ts`

**功能**:
- 基地被清除时，检查所有玩家是否有泰坦在该基地上
- 如果有泰坦，将其返回泰坦区域（清除力量指示物）
- 调整其他基地上泰坦的 baseIndex（因为基地数组收缩）

**实现逻辑**:
```typescript
// 泰坦移除：检查所有玩家是否有泰坦在被清除的基地上
for (const playerId of state.turnOrder) {
    const player = newPlayers[playerId];
    if (player.activeTitan && player.activeTitan.baseIndex === baseIndex) {
        // 泰坦返回泰坦区域（清除力量指示物）
        const titanCard = player.titanZone.find(t => t.uid === player.activeTitan!.titanUid);
        if (!titanCard) {
            // 泰坦卡不在 titanZone 中，需要从 activeTitan 恢复
            const restoredTitanCard: CardInstance = {
                uid: player.activeTitan.titanUid,
                defId: 'unknown_titan', // 防御性：如果找不到 defId，使用占位符
                type: 'titan',
                owner: playerId,
            };
            newPlayers = {
                ...newPlayers,
                [playerId]: {
                    ...player,
                    activeTitan: null,
                    titanZone: [...player.titanZone, restoredTitanCard],
                },
            };
        } else {
            // 泰坦卡已在 titanZone 中，只需清除 activeTitan
            newPlayers = {
                ...newPlayers,
                [playerId]: {
                    ...player,
                    activeTitan: null,
                },
            };
        }
    } else if (player.activeTitan && player.activeTitan.baseIndex > baseIndex) {
        // 泰坦在后续基地上，需要调整 baseIndex（因为基地数组收缩）
        newPlayers = {
            ...newPlayers,
            [playerId]: {
                ...player,
                activeTitan: {
                    ...player.activeTitan,
                    baseIndex: player.activeTitan.baseIndex - 1,
                },
            },
        };
    }
}
```

### 2. BASE_REPLACED 事件处理器扩展

**文件**: `src/games/smashup/domain/reduce.ts`

**功能**:
- 基地被替换时（默认模式），移除该基地上的泰坦
- keepCards 模式（如 terraform 能力）时，保留泰坦

**实现逻辑**:
```typescript
// keepCards 模式：仅替换 defId，保留随从和 ongoing，旧 defId 回牌库
// 泰坦也保留（如 terraform 能力）
if (keepCards) {
    const updatedBases = state.bases.map((base, i) => {
        if (i !== baseIndex) return base;
        return { ...base, defId: newBaseDefId };
    });
    return { ...state, bases: updatedBases, baseDeck: [...newBaseDeck, oldBaseDefId] };
}

// 默认模式：插入新空基地（配合 BASE_SCORED 删除旧基地后使用）
// 需要移除该基地上的泰坦
let newPlayers = { ...state.players };
for (const playerId of state.turnOrder) {
    const player = newPlayers[playerId];
    if (player.activeTitan && player.activeTitan.baseIndex === baseIndex) {
        // 泰坦返回泰坦区域（清除力量指示物）
        // ... (与 BASE_CLEARED 相同的逻辑)
    }
}
```

## 测试覆盖

### 单元测试

**文件**: `src/games/smashup/domain/__tests__/titanBaseDestruction.test.ts`

**测试用例**:

1. **BASE_CLEARED 事件**:
   - ✅ 基地被清除时移除泰坦
   - ✅ 不影响其他基地上的泰坦（但调整 baseIndex）
   - ✅ 处理多个玩家的泰坦

2. **BASE_REPLACED 事件**:
   - ✅ 基地被替换时移除泰坦
   - ✅ keepCards=true 时保留泰坦

**测试结果**:
```
✓ Titan Base Destruction Integration (5)
  ✓ BASE_CLEARED event (3)
    ✓ should remove titan when base is cleared 3ms
    ✓ should not affect titans at other bases 0ms
    ✓ should handle multiple players with titans 0ms
  ✓ BASE_REPLACED event (2)
    ✓ should remove titan when base is replaced 0ms
    ✓ should not remove titan when keepCards is true 0ms

Test Files  1 passed (1)
     Tests  5 passed (5)
```

## 验证

### TypeScript 编译检查

```bash
npx tsc --noEmit
```

**结果**: ✅ 通过（无类型错误）

## 设计决策

### 1. 结构共享

使用结构共享而非全量深拷贝，确保性能：
```typescript
newPlayers = {
    ...newPlayers,
    [playerId]: {
        ...player,
        activeTitan: null,
    },
};
```

### 2. 防御性编程

处理泰坦卡不在 titanZone 中的边界情况：
```typescript
if (!titanCard) {
    // 泰坦卡不在 titanZone 中，需要从 activeTitan 恢复
    const restoredTitanCard: CardInstance = {
        uid: player.activeTitan.titanUid,
        defId: 'unknown_titan', // 防御性：如果找不到 defId，使用占位符
        type: 'titan',
        owner: playerId,
    };
    // ...
}
```

### 3. baseIndex 调整

基地数组收缩时，自动调整后续基地上泰坦的 baseIndex：
```typescript
else if (player.activeTitan && player.activeTitan.baseIndex > baseIndex) {
    // 泰坦在后续基地上，需要调整 baseIndex（因为基地数组收缩）
    newPlayers = {
        ...newPlayers,
        [playerId]: {
            ...player,
            activeTitan: {
                ...player.activeTitan,
                baseIndex: player.activeTitan.baseIndex - 1,
            },
        },
    };
}
```

### 4. keepCards 模式支持

terraform 等能力可以替换基地但保留卡牌（包括泰坦）：
```typescript
if (keepCards) {
    // 仅替换 defId，保留随从、ongoing 和泰坦
    const updatedBases = state.bases.map((base, i) => {
        if (i !== baseIndex) return base;
        return { ...base, defId: newBaseDefId };
    });
    return { ...state, bases: updatedBases, baseDeck: [...newBaseDeck, oldBaseDefId] };
}
```

## 符合规范

### DRY 原则

泰坦移除逻辑在 BASE_CLEARED 和 BASE_REPLACED 中复用相同的代码模式。

### 结构共享

所有状态更新使用结构共享，避免全量深拷贝。

### 中文注释

所有关键逻辑都有清晰的中文注释。

## 下一步

Task 10 已完成。下一步是 Task 11（扩展引擎层目标类型）。

## 相关文件

- `src/games/smashup/domain/reduce.ts` - 事件 reducer（已修改）
- `src/games/smashup/domain/__tests__/titanBaseDestruction.test.ts` - 单元测试（已创建）
- `.kiro/specs/smashup-titan-mechanism/tasks.md` - 任务清单（Task 10 已完成）
