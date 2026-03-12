# 大杀四方 - 泰坦目标选择 UI 实现

## 实现时间
2025-01-XX

## 任务概述
实现泰坦卡牌的目标选择 UI 支持，使得当 `targetType: 'card'` 时，PromptOverlay 组件能够正确显示和选择泰坦卡牌。

## 实现内容

### 1. 类型定义扩展

#### 1.1 添加 TitanCardDef 类型
**文件**: `src/games/smashup/domain/types.ts`

```typescript
/** 泰坦卡牌定义（静态数据） */
export interface TitanCardDef {
    defId: string;
    type: 'titan';
    name: string;
    factionId: string;
    abilities: string[];
    /** 卡牌预览引用（用于 UI 渲染） */
    previewRef?: CardPreviewRef;
}

/** 卡牌定义联合类型 */
export type CardDef = MinionCardDef | ActionCardDef | TitanCardDef;
```

**设计决策**:
- `TitanCardDef` 结构与 `MinionCardDef` 和 `ActionCardDef` 保持一致
- 包含 `previewRef` 字段用于 UI 渲染（与其他卡牌类型一致）
- `type: 'titan'` 用于类型区分

#### 1.2 扩展 CardMagnifyTarget 类型
**文件**: `src/games/smashup/ui/CardMagnifyOverlay.tsx`

```typescript
export interface CardMagnifyTarget {
    defId: string;
    type: 'minion' | 'base' | 'action' | 'titan';
}
```

**设计决策**:
- 添加 `'titan'` 到类型联合，使放大预览功能支持泰坦卡牌
- 保持与现有卡牌类型的一致性

### 2. UI 组件兼容性验证

#### 2.1 PromptOverlay 组件
**文件**: `src/games/smashup/ui/PromptOverlay.tsx`

**现有代码已支持泰坦**:
- `isCardOption` 函数：通过检查 `defId` 字段自动识别卡牌选项（包括泰坦）
- 卡牌渲染逻辑：使用 `getCardDef(defId)` 获取定义，支持所有 `CardDef` 类型
- 放大镜按钮：使用 `def?.type` 自动获取卡牌类型，无需特殊处理

**关键代码片段**:
```typescript
// Line 391: 通用卡牌展示模式
onClick={(e) => { 
    e.stopPropagation(); 
    setMagnifyTarget({ defId: card.defId, type: def?.type ?? 'action' }); 
}}

// Line 743: 卡牌选择模式
const cardType = getBaseDef(defId) 
    ? 'base' as const 
    : (def && 'type' in def ? def.type : 'action' as const);
setMagnifyTarget({ defId, type: cardType });
```

**为什么无需修改**:
1. `def?.type` 会自动返回 `'titan'`（当 def 是 TitanCardDef 时）
2. `getCardDef` 函数返回 `CardDef` 联合类型，已包含 `TitanCardDef`
3. 卡牌预览系统基于 `previewRef`，与卡牌类型无关

#### 2.2 CardMagnifyOverlay 组件
**文件**: `src/games/smashup/ui/CardMagnifyOverlay.tsx`

**现有代码已支持泰坦**:
```typescript
const def = target.type === 'base' 
    ? getBaseDef(target.defId) 
    : getCardDef(target.defId);
```

**为什么无需修改**:
- 泰坦不是基地，所以会走 `getCardDef` 分支
- `getCardDef` 返回的 `CardDef` 已包含 `TitanCardDef`

### 3. 测试覆盖

#### 3.1 单元测试
**文件**: `src/games/smashup/ui/__tests__/titanTargetSelection.test.tsx`

**测试用例**:
1. `CardMagnifyTarget` 类型支持 `'titan'`
2. `CardMagnifyTarget` 支持所有卡牌类型（minion, action, base, titan）
3. `TitanCardDef` 结构正确
4. `TitanCardDef` 支持可选的 `previewRef`
5. `CardDef` 联合类型包含 `TitanCardDef`

**测试结果**:
```
✓ src/games/smashup/ui/__tests__/titanTargetSelection.test.tsx (5 tests) 4ms
  ✓ Titan Target Selection UI (5)
    ✓ CardMagnifyTarget type (2)
      ✓ should support titan card type 1ms
      ✓ should support all card types 0ms
    ✓ TitanCardDef type (2)
      ✓ should have correct structure 1ms
      ✓ should support optional previewRef 0ms
    ✓ CardDef union type (1)
      ✓ should include TitanCardDef in union 0ms

Test Files  1 passed (1)
     Tests  5 passed (5)
```

### 4. TypeScript 编译验证

**命令**: `npx tsc --noEmit`
**结果**: ✅ 通过（Exit Code: 0）

**验证内容**:
- `TitanCardDef` 类型定义正确
- `CardDef` 联合类型包含 `TitanCardDef`
- `CardMagnifyTarget` 类型扩展正确
- 所有使用 `CardDef` 的代码兼容 `TitanCardDef`

## 设计原则遵循

### 1. 面向百游戏设计
- ✅ **显式 > 隐式**: `TitanCardDef` 显式声明所有字段，不依赖推断
- ✅ **智能默认 + 可覆盖**: UI 组件自动识别卡牌类型，无需特殊配置
- ✅ **单一真实来源**: 卡牌定义统一在 `CardDef` 联合类型中
- ✅ **类型安全**: TypeScript 编译期检查，防止类型错误
- ✅ **最小化游戏层代码**: 无需修改 UI 组件，只需扩展类型定义

### 2. DRY 原则
- ✅ 复用现有的 `getCardDef` 函数，无需创建 `getTitanDef`
- ✅ 复用现有的卡牌渲染逻辑，无需特殊处理泰坦
- ✅ 复用现有的放大预览功能，无需重复实现

### 3. 开闭原则
- ✅ 对扩展开放：添加 `TitanCardDef` 不影响现有代码
- ✅ 对修改关闭：UI 组件无需修改即可支持泰坦

## 后续工作

### Task 13: 更新现有卡牌能力定义
需要为以下卡牌更新 `targetType` 为 `'card'`:
- Into the Time Slip
- Purge the Demon
- Potion of Paralysis
- There Goes Tokyo
- Cab-over Pete
- Expert Timing
- Stagecoach

### Task 14+: 泰坦卡牌数据录入
需要创建实际的泰坦卡牌定义数据，包括:
- 泰坦卡牌的 `defId`、`name`、`factionId`、`abilities`
- 泰坦卡牌的图片资源和 `previewRef`
- 注册到 `_cardRegistry`

## 总结

Task 12 已完成，UI 层已准备好支持泰坦卡牌的目标选择。关键成就:

1. **类型系统扩展**: 添加 `TitanCardDef` 和扩展 `CardMagnifyTarget`
2. **零修改兼容**: 现有 UI 组件无需修改即可支持泰坦
3. **测试覆盖**: 5 个单元测试全部通过
4. **类型安全**: TypeScript 编译通过，无类型错误

下一步可以继续 Task 13（更新现有卡牌能力定义）或 Task 14+（泰坦卡牌数据录入）。


## E2E 测试状态

**状态**: ⏸️ 待后续实现

**原因**:
E2E 测试需要以下前置条件，这些将在后续任务中完成:
1. **Task 14+**: 泰坦卡牌定义数据（defId, name, abilities, previewRef）
2. **Task 14+**: 泰坦卡牌注册到 `_cardRegistry`
3. **Task 13**: 更新现有卡牌能力定义，使用 `targetType: 'card'`
4. **Task 15+**: 泰坦能力实现（创建交互时使用 `targetType: 'card'`）

**E2E 测试计划**:
当上述前置条件完成后，E2E 测试应验证:
1. 使用支持泰坦的卡牌（如 Into the Time Slip）
2. 创建包含泰坦的游戏状态
3. 触发卡牌能力，打开目标选择 UI
4. 验证 UI 显示泰坦卡牌
5. 点击选择泰坦
6. 验证选择后高亮显示
7. 确认选择，验证能力正确执行

**建议**:
- E2E 测试应在 Task 15+ 完成后创建
- 可以与其他泰坦功能的 E2E 测试合并（如泰坦放置、移动、冲突等）
