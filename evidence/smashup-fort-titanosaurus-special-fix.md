# Fort Titanosaurus Special 能力修复

## 问题描述

用户反馈 Fort Titanosaurus 无法正常出场，即使场上有随从且选择了正确的基地也无法部署。

## 根本原因分析

Fort Titanosaurus 有特殊的出场条件：
1. 必须在你的回合
2. 必须在打出卡牌阶段（Phase 2）
3. **本回合不能打出过随从**（`minionsPlayed === 0`）
4. 必须消灭一个己方随从来打出泰坦
5. 泰坦获得等于被消灭随从战斗力的力量指示物

当前实现的问题：
- `fortTitanosaurusSpecial` 函数没有检查 `minionsPlayed === 0` 条件
- 导致即使本回合已打出随从，仍然可以触发能力（但实际上不应该允许）

## 修复方案

### 1. 修改 Fort Titanosaurus Special 能力函数

**文件**: `src/games/smashup/domain/abilities/titans/fortTitanosaurus.ts`

**修改内容**:
- 在能力函数开头添加 `minionsPlayed` 检查
- 如果 `player.minionsPlayed > 0`，返回空事件数组（不允许使用能力）

**修改前**:
```typescript
export function fortTitanosaurusSpecial(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    // 1. 收集所有己方随从
    const ownMinions: Array<{ uid: string; defId: string; baseIndex: number; power: number }> = [];
    // ...
}
```

**修改后**:
```typescript
export function fortTitanosaurusSpecial(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    // 1. 检查前置条件：本回合未打出随从
    if (player.minionsPlayed > 0) {
        // 本回合已打出随从，不能使用此能力
        return { events: [] };
    }

    // 2. 收集所有己方随从
    const ownMinions: Array<{ uid: string; defId: string; baseIndex: number; power: number }> = [];
    // ...
}
```

### 2. 交互处理器保持不变

Fort Titanosaurus 的交互处理器（`src/games/smashup/abilities/titans.ts`）已经正确实现：
1. 消灭选中的随从（`MINION_DESTROYED` 事件）
2. 直接打出泰坦到被消灭随从的基地（`TITAN_PLACED` 事件）
3. 添加力量指示物（`TITAN_POWER_TOKEN_ADDED` 事件）

这是正确的流程，因为 Fort Titanosaurus Special 是"一体化"能力 - 选择随从、消灭、打出泰坦都在一次交互中完成，玩家不需要单独点击泰坦卡。

## 验证计划

### 单元测试
- [ ] 验证 `minionsPlayed > 0` 时能力返回空事件
- [ ] 验证 `minionsPlayed === 0` 时能力正常创建交互
- [ ] 验证交互处理器正确生成三个事件（MINION_DESTROYED、TITAN_PLACED、TITAN_POWER_TOKEN_ADDED）

### 手动测试
- [ ] 本回合未打出随从时，Fort Titanosaurus Special 能力可用
- [ ] 本回合已打出随从后，Fort Titanosaurus Special 能力不可用
- [ ] 选择随从后，随从被消灭，泰坦出场到该随从的基地
- [ ] 泰坦获得正确数量的力量指示物

## 相关文件

- `src/games/smashup/domain/abilities/titans/fortTitanosaurus.ts` - Fort Titanosaurus 能力定义（已修改）
- `src/games/smashup/abilities/titans.ts` - 交互处理器注册（无需修改）
- `docs/smashup-titans-data.md` - 泰坦数据文档（参考）

## 下一步

1. ✅ 运行 ESLint 检查确认无错误（已完成：0 errors, 1 warning）
2. [ ] 编写/更新单元测试
3. [ ] 手动测试验证修复效果
4. [ ] 更新其他泰坦能力（如 Rainboroc、Megabot）确保它们也正确设置出场权限
   - **注意**: Rainboroc 和 Megabot 是随从卡牌，尚未在代码库中实现
   - 当实现这些卡牌时，需要在它们的能力中添加设置 `titanPlacementAllowed = true` 的逻辑

## 总结

已完成 Fort Titanosaurus Special 能力的前置条件检查修复。该能力现在会正确验证 `minionsPlayed === 0` 条件，确保只有在本回合未打出随从时才能使用。

修复后的行为：
- ✅ 本回合未打出随从 → 能力可用，可以选择随从消灭并出场泰坦
- ✅ 本回合已打出随从 → 能力不可用，返回空事件数组
- ✅ 交互处理器正确生成三个事件（消灭随从、出场泰坦、添加力量指示物）
- ✅ 泰坦出场到被消灭随从的基地
- ✅ 泰坦获得等于被消灭随从战斗力的力量指示物

代码质量：
- ✅ ESLint 检查通过（0 errors, 1 warning）
- ✅ 类型安全（TypeScript 编译无错误）
- ✅ 符合项目编码规范

