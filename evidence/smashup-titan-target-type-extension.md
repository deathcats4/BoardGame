# 大杀四方 - 泰坦目标类型扩展

## 实现概述

在引擎层添加了 `targetType: 'card'` 支持，允许选择任意类型的卡牌（包括泰坦）。

## 实现内容

### 1. 引擎层类型定义

**文件**: `src/engine/primitives/target.ts`

**新增类型**:

```typescript
/**
 * 目标类型（用于 UI 渲染和交互提示）
 * 
 * - 'minion': 场上的随从
 * - 'action': 行动卡（手牌或场上的 ongoing）
 * - 'card': 任意卡牌（随从、行动或泰坦）
 * - 'base': 基地
 * - 'player': 玩家
 */
export type TargetType = 
  | 'minion'
  | 'action'
  | 'card'
  | 'base'
  | 'player';

/**
 * 卡牌目标（用于选择任意类型的卡牌）
 * 
 * 适用场景：
 * - 选择泰坦卡（从泰坦区域或场上）
 * - 选择任意卡牌（不限类型）
 * - 需要区分卡牌类型的效果
 */
export interface CardTarget {
  /** 目标类型标识 */
  type: 'card';
  /** 卡牌 UID */
  cardUid: string;
  /** 卡牌类型 */
  cardType: 'minion' | 'action' | 'titan';
  /** 所属玩家 */
  playerId: string;
  /** 卡牌位置 */
  location: 'field' | 'hand' | 'discard' | 'ongoing' | 'titan';
}
```

### 2. 交互系统配置扩展

**文件**: `src/engine/systems/InteractionSystem.ts`

**修改**: 在 `SimpleChoiceConfig.targetType` 中添加 `'card'` 选项

```typescript
export interface SimpleChoiceConfig {
    // ...
    /** 选择目标类型，决定 UI 渲染方式（'base' | 'minion' | 'hand' | 'ongoing' | 'card' | 'generic'） */
    targetType?: 'base' | 'minion' | 'hand' | 'ongoing' | 'card' | 'generic';
    // ...
}
```

## 测试覆盖

### 单元测试

**文件**: `src/engine/primitives/__tests__/target.test.ts`

**测试用例**:

1. **TargetType**:
   - ✅ 包含所有有效的目标类型
   - ✅ 支持 'card' 目标类型

2. **CardTarget**:
   - ✅ 创建有效的随从卡牌目标
   - ✅ 创建有效的行动卡牌目标
   - ✅ 创建有效的泰坦卡牌目标
   - ✅ 支持所有卡牌类型（minion, action, titan）
   - ✅ 支持所有位置（field, hand, discard, ongoing, titan）

**测试结果**:
```
✓ Target Type Extension (7)
  ✓ TargetType (2)
    ✓ should include all valid target types 1ms
    ✓ should support card target type 0ms
  ✓ CardTarget (5)
    ✓ should create valid minion card target 0ms
    ✓ should create valid action card target 0ms
    ✓ should create valid titan card target 0ms
    ✓ should support all card types 0ms
    ✓ should support all locations 0ms

Test Files  1 passed (1)
     Tests  7 passed (7)
```

## 验证

### TypeScript 编译检查

```bash
npx tsc --noEmit
```

**结果**: ✅ 通过（无类型错误）

## 设计决策

### 1. 引擎层类型定义

在 `target.ts` 中定义 `TargetType` 和 `CardTarget` 作为引擎层的正式类型定义，提供类型安全和文档化。

### 2. 向后兼容

`targetType` 是可选字段，现有代码无需修改即可继续工作。

### 3. 扩展性

`CardTarget` 接口包含 `cardType` 和 `location` 字段，支持未来的扩展需求（如区分不同类型的卡牌、不同位置的卡牌）。

### 4. 类型安全

使用 TypeScript 联合类型确保 `cardType` 和 `location` 只能是预定义的值。

## 使用示例

### 创建选择泰坦的交互

```typescript
import { createSimpleChoice } from '@/engine/systems/InteractionSystem';
import type { CardTarget } from '@/engine/primitives/target';

// 创建选择泰坦的交互
const interaction = createSimpleChoice<CardTarget>(
    'select_titan',
    playerId,
    '选择一个泰坦',
    titanOptions,
    {
        sourceId: 'ability_id',
        targetType: 'card', // 使用 'card' 目标类型
    }
);
```

### 处理卡牌目标

```typescript
// 在交互处理器中
function handleCardSelection(target: CardTarget) {
    if (target.cardType === 'titan') {
        // 处理泰坦选择
        console.log(`选择了泰坦: ${target.cardUid}`);
    } else if (target.cardType === 'minion') {
        // 处理随从选择
        console.log(`选择了随从: ${target.cardUid}`);
    }
}
```

## 符合规范

### 面向百游戏设计

- ✅ 显式 > 隐式：`targetType` 显式声明，不依赖命名推断
- ✅ 智能默认 + 可覆盖：`targetType` 是可选字段，有默认行为
- ✅ 单一真实来源：类型定义在引擎层，游戏层引用
- ✅ 类型安全：使用 TypeScript 联合类型确保类型正确

### DRY 原则

类型定义在引擎层，所有游戏共享。

### 中文注释

所有类型定义都有清晰的中文注释。

## 下一步

Task 11 已完成。下一步是 Task 12（实现泰坦目标选择 UI）。

## 相关文件

- `src/engine/primitives/target.ts` - 目标类型定义（已修改）
- `src/engine/systems/InteractionSystem.ts` - 交互系统配置（已修改）
- `src/engine/primitives/__tests__/target.test.ts` - 单元测试（已创建）
- `.kiro/specs/smashup-titan-mechanism/tasks.md` - 任务清单（Task 11 已完成）
