# 泰坦出场验证与显示修复 - 实现证据

## 修复日期
2026-03-08

## Bug 描述

### Bug 1: 泰坦可以无视条件出场
- **现象**: 玩家可以直接点击泰坦卡牌出场，无需卡牌效果触发
- **根因**: `PLACE_TITAN` 命令验证缺少"卡牌效果允许"的检查
- **影响**: 违反游戏规则，泰坦应该只能在特定卡牌效果（如 Rainboroc、Megabot）允许时出场

### Bug 2: 泰坦出场后显示为问号
- **现象**: 泰坦出场后，场上显示为 "?" 占位符
- **根因**: `ActiveTitan` 接口缺少 `defId` 字段，导致 `TitanCard.tsx` 无法获取泰坦定义
- **影响**: UI 无法正确显示泰坦图片和能力

## 修复方案

### Bug 1 修复：添加出场权限标志

#### 1. 数据结构变更
在 `SmashUpCore` 接口添加标志字段：
```typescript
/**
 * 是否允许出场泰坦（由卡牌效果设置，如 Rainboroc、Megabot）
 * - true: 允许玩家点击泰坦卡牌出场
 * - undefined/false: 禁止出场泰坦
 * 生命周期：卡牌效果设置 → 泰坦出场后清除 / 回合结束清除
 */
titanPlacementAllowed?: boolean;
```

#### 2. 验证逻辑增强
在 `PLACE_TITAN` 命令验证中添加检查：
```typescript
// 检查是否有卡牌效果允许出场泰坦
if (!core.titanPlacementAllowed) {
    return { valid: false, error: '需要卡牌效果允许才能出场泰坦' };
}
```

#### 3. 标志生命周期管理
- **设置时机**: 卡牌效果（如 Rainboroc、Megabot）执行时设置 `titanPlacementAllowed = true`
- **清除时机**: 
  - 泰坦出场后（`TITAN_PLACED` reducer）
  - 回合结束时（`TURN_ENDED` reducer）

### Bug 2 修复：补全 ActiveTitan 数据

#### 1. 数据结构变更
在 `ActiveTitan` 接口添加 `defId` 字段：
```typescript
export interface ActiveTitan {
    titanUid: string;
    defId: string; // 新增：泰坦定义 ID（用于 UI 查找泰坦定义）
    baseIndex: number;
    powerTokens: number;
}
```

#### 2. Reducer 逻辑增强
在 `TITAN_PLACED` 事件处理中复制 `defId`：
```typescript
// 创建 activeTitan（包含 defId）
const newActiveTitan = {
    titanUid,
    baseIndex,
    powerTokens: 0,
    defId: titanCard.defId, // 复制 defId 用于 UI 查找泰坦定义
};

return {
    ...state,
    players: {
        ...state.players,
        [playerId]: {
            ...player,
            titanZone: newTitanZone,
            activeTitan: newActiveTitan,
        },
    },
    // 清除出场权限标志
    titanPlacementAllowed: undefined,
};
```

#### 3. UI 逻辑简化
简化 `TitanCard.tsx` 的 defId 查找逻辑：
```typescript
// 直接从 titan.defId 获取泰坦定义 ID
let titanDefId = titan.defId;
let def = titanDefId ? getTitanDef(titanDefId) : null;

// 向后兼容：如果 defId 缺失（旧存档），尝试从玩家派系推断
if (!def) {
    const player = core.players[ownerId];
    const factionId = player?.factions?.[0] || player?.factions?.[1];
    const fallbackDefId = factionId ? `titan_${factionId}` : null;
    if (fallbackDefId) {
        titanDefId = fallbackDefId;
        def = getTitanDef(fallbackDefId);
    }
}
```

## 修改文件清单

### 1. 数据结构
- ✅ `src/games/smashup/domain/types.ts`
  - 添加 `SmashUpCore.titanPlacementAllowed` 字段
  - `ActiveTitan.defId` 字段（已在之前的对话中添加）

### 2. Reducer 逻辑
- ✅ `src/games/smashup/domain/reduce.ts`
  - 修改 `TITAN_PLACED` reducer 复制 `defId` 并清除 `titanPlacementAllowed`
  - 修改 `TURN_ENDED` reducer 清除 `titanPlacementAllowed`
  - 修复重复的 `ON_TURN_START_ABILITY_HANDLED` case（删除第一个，保留第二个）

### 3. 命令验证
- ✅ `src/games/smashup/domain/commands.ts`
  - 修改 `PLACE_TITAN` 验证检查 `titanPlacementAllowed`

### 4. UI 组件
- ✅ `src/games/smashup/ui/TitanCard.tsx`
  - 简化 defId 查找逻辑，直接读取 `titan.defId`
  - 保留 fallback 逻辑处理旧存档

### 5. 代码质量修复
- ✅ `src/games/smashup/domain/types.ts`
  - 修复空对象类型错误：`{}` → `Record<string, never>`

## 代码质量检查

### ESLint 检查结果
```bash
npx eslint src/games/smashup/domain/types.ts src/games/smashup/domain/reduce.ts src/games/smashup/domain/commands.ts src/games/smashup/ui/TitanCard.tsx
```

**结果**: ✅ 0 errors, 11 warnings（仅有可接受的警告）

### 警告说明
- `@typescript-eslint/no-unused-vars`: 未使用的类型定义（不影响功能）
- `@typescript-eslint/no-explicit-any`: 使用 `any` 类型（历史代码，不影响本次修复）

## 待完成任务

### Task 5: 更新卡牌效果
需要在以下卡牌效果中设置 `titanPlacementAllowed = true`：
- [ ] Rainboroc（机器人派系）
- [ ] Megabot（机器人派系）
- [ ] 其他允许泰坦出场的卡牌（需要搜索确认）

**注意**: 这些卡牌的能力实现尚未在代码库中找到，可能还未实现。需要在实现这些卡牌能力时添加 `titanPlacementAllowed = true` 的逻辑。

### Task 6: 更新测试
- [ ] 更新 `src/games/smashup/domain/__tests__/titanCommands.test.ts` 添加权限验证测试
- [ ] 更新 `src/games/smashup/domain/__tests__/titanReducer.test.ts` 验证 defId 复制
- [ ] 运行所有测试确保通过

### Task 7: TypeScript 编译检查
- [ ] 运行 `npx tsc --noEmit` 确认无类型错误

### Task 8: 手动测试验证
- [ ] 验证未设置权限时无法出场泰坦
- [ ] 验证使用 Rainboroc 后可以出场泰坦
- [ ] 验证泰坦出场后显示正确图片
- [ ] 验证泰坦悬停显示中文能力
- [ ] 验证放大镜功能正常

## 向后兼容性

### 数据迁移
- `titanPlacementAllowed` 为可选字段，默认 `undefined`（拒绝出场）
- 现有存档中的 `activeTitan` 缺少 `defId`，UI 组件保留 fallback 逻辑：
  1. 尝试从玩家派系推断 defId（`titan_${factionId}`）
  2. 如果推断失败，显示 "?" 占位符

### 降级策略
如果 `activeTitan.defId` 缺失，`TitanCard.tsx` 会：
1. 尝试从 `core.players[ownerId].factions` 推断 defId
2. 使用推断的 defId 查找泰坦定义
3. 如果仍然失败，显示错误占位符

## 验收标准

### Bug 1 验收
- [ ] 未设置 `titanPlacementAllowed` 时，点击泰坦卡牌无法出场
- [ ] 使用 Rainboroc 后，可以成功出场泰坦
- [ ] 泰坦出场后，`titanPlacementAllowed` 被清除
- [ ] 回合结束后，`titanPlacementAllowed` 被清除

### Bug 2 验收
- [ ] 泰坦出场后，场上显示正确的泰坦图片（非问号）
- [ ] 泰坦卡牌悬停时显示正确的中文能力描述
- [ ] 点击放大镜按钮可以查看泰坦详情

### 回归测试
- [ ] 现有泰坦功能不受影响（计分、能力触发、移除）
- [ ] 所有单元测试通过
- [ ] ESLint 检查通过（0 errors）

## 实现时间线

- **2026-03-08 14:00**: 开始实现
- **2026-03-08 14:30**: 完成数据结构、Reducer、验证逻辑、UI 简化
- **2026-03-08 14:35**: 完成代码质量检查（ESLint 0 errors）
- **待定**: 完成卡牌效果更新（需要先实现 Rainboroc、Megabot 能力）
- **待定**: 完成测试更新和手动验证

## 技术债务

1. **卡牌效果未实现**: Rainboroc 和 Megabot 的能力尚未在代码库中找到，需要在实现这些卡牌时添加 `titanPlacementAllowed = true` 的逻辑
2. **测试覆盖不足**: 需要补充权限验证测试和 defId 复制测试
3. **手动测试待执行**: 需要在游戏中实际测试两个 bug 的修复效果

## 相关文档

- Bugfix Spec: `.kiro/specs/smashup-titan-deployment-validation-and-display-fix/bugfix.md`
- Design Doc: `.kiro/specs/smashup-titan-deployment-validation-and-display-fix/design.md`
- Tasks: `.kiro/specs/smashup-titan-deployment-validation-and-display-fix/tasks.md`
- Titan Requirements: `.kiro/specs/smashup-titan-mechanism/requirements.md`
