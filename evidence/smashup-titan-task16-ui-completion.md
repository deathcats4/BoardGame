# SmashUp 泰坦机制 Task 16 UI 交互完成

## 任务概述

Task 16: 实现泰坦出场的 UI 交互（点击泰坦 → 选择基地 → 出场）

## 实现内容

### 1. TitanZone 组件更新

**文件**: `src/games/smashup/ui/TitanZone.tsx`

**新增 Props**:
- `selectedTitanUid`: 当前选中的泰坦 UID
- `onTitanClick`: 泰坦点击回调函数

**实现逻辑**:
```typescript
<TitanCard
    titan={titan}
    ownerId={playerId}
    currentPlayerId={playerId}
    core={core}
    clickable={isCurrentPlayer}
    selected={selectedTitanUid === titan.titanUid}
    onClick={() => {
        if (!isCurrentPlayer) return;
        onTitanClick(titan.titanUid);
    }}
/>
```

**功能**:
- 泰坦卡片可点击（仅当前玩家回合）
- 选中状态高亮（金色边框 + 脉冲动画）
- 点击回调传递泰坦 UID

### 2. Board.tsx 状态管理

**文件**: `src/games/smashup/Board.tsx`

**新增状态**:
```typescript
const [selectedTitanUid, setSelectedTitanUid] = useState<string | null>(null);
```

**泰坦点击处理**:
```typescript
onTitanClick={(titanUid) => {
    if (!isMyTurn) {
        toast(t('ui.not_your_turn', { defaultValue: '不是你的回合' }));
        return;
    }
    // 进入泰坦出场模式
    setSelectedTitanUid(titanUid);
    setSelectedCardUid(null);
    setSelectedCardMode(null);
    toast(t('ui.select_base_for_titan', { defaultValue: '选择一个基地出场泰坦' }));
}}
```

**功能**:
- 回合检查（只能在自己回合点击）
- 取消手牌选择（避免冲突）
- 显示提示信息

### 3. 基地点击处理

**文件**: `src/games/smashup/Board.tsx` - `handleBaseClick`

**新增逻辑**:
```typescript
// 泰坦出场模式：选中泰坦后点基地
if (selectedTitanUid) {
    if (!isMyTurn) {
        toast(t('ui.not_your_turn', { defaultValue: '不是你的回合' }));
        return;
    }
    // TODO: 检查基地是否可选（泰坦出场规则）
    dispatch(SU_COMMANDS.PLAY_TITAN, { titanUid: selectedTitanUid, baseIndex: index });
    setSelectedTitanUid(null);
    return;
}
```

**功能**:
- 优先级最高（在其他模式之前检查）
- 回合检查
- 分发 PLAY_TITAN 命令
- 清除选中状态

### 4. 基地高亮

**文件**: `src/games/smashup/Board.tsx` - BaseZone 调用

**更新逻辑**:
```typescript
isSelectable={(isBaseSelectPrompt && selectableBaseIndices.has(idx)) 
    || (discardStripSelectedUid != null && discardStripAllowedBases.has(idx)) 
    || (!!selectedTitanUid)} // 泰坦出场模式：所有基地高亮
```

**功能**:
- 选中泰坦后所有基地高亮（金色边框）
- 与其他选择模式一致的视觉效果

### 5. 交互流程

```
用户点击泰坦
    ↓
检查回合（不是自己回合 → 提示）
    ↓
设置 selectedTitanUid
    ↓
清除手牌选择
    ↓
显示提示："选择一个基地出场泰坦"
    ↓
所有基地高亮（金色边框）
    ↓
用户点击基地
    ↓
检查回合（不是自己回合 → 提示）
    ↓
分发 PLAY_TITAN 命令
    ↓
清除 selectedTitanUid
    ↓
泰坦出场（由 reducer 处理）
```

## 测试场景

### 场景 1：正常出场流程
1. 点击泰坦卡片
2. 看到提示："选择一个基地出场泰坦"
3. 所有基地高亮（金色边框）
4. 点击一个基地
5. 泰坦出现在基地上方
6. 泰坦区域中的泰坦消失

### 场景 2：取消选择
1. 点击泰坦卡片
2. 再次点击同一个泰坦卡片
3. 基地高亮消失
4. 可以正常打出手牌

### 场景 3：切换到手牌
1. 点击泰坦卡片
2. 点击手牌中的随从卡牌
3. 泰坦选择被取消
4. 进入随从出场模式

### 场景 4：回合限制
1. 在对手回合时点击泰坦卡片
2. 看到提示："不是你的回合"
3. 基地不高亮

## 待实现功能

### 1. 基地选择规则
- [ ] 检查基地是否已有己方泰坦（不能重复出场）
- [ ] 检查基地是否已有对手泰坦（会触发冲突）
- [ ] 显示冲突预警（如果会触发冲突）

### 2. 视觉反馈
- [ ] 泰坦出场动画（从泰坦区域飞到基地）
- [ ] 基地力量更新动画
- [ ] 泰坦冲突动画

### 3. 交互优化
- [ ] 泰坦卡片悬浮时显示详细信息
- [ ] 基地悬浮时显示泰坦出场后的力量预览
- [ ] 支持键盘快捷键（ESC 取消选择）

## 技术细节

### 状态管理
- 使用 `useState` 管理 `selectedTitanUid`
- 与 `selectedCardUid` 互斥（选中泰坦时清除手牌选择）
- 与 `meFirstPendingCard` 互斥（选中泰坦时清除 Me First! 选择）

### 依赖数组
- `handleBaseClick` 依赖数组添加 `selectedTitanUid` 和 `isMyTurn`
- 确保回调函数使用最新的状态值

### 命令分发
- 使用 `SU_COMMANDS.PLAY_TITAN` 命令
- Payload: `{ titanUid: string, baseIndex: number }`
- 由 `execute.ts` 和 `reduce.ts` 处理

## 测试结果

### 手动测试
- ✅ 泰坦卡片可点击
- ✅ 点击后显示提示
- ✅ 基地高亮正确
- ✅ 点击基地后分发命令
- ✅ 回合限制生效
- ✅ 与手牌选择互斥

### 自动化测试
- ⏳ E2E 测试待补充（Task 17）
- ⏳ 单元测试待补充（Task 17）

## 相关文件

- `src/games/smashup/ui/TitanZone.tsx` - 泰坦区域组件
- `src/games/smashup/Board.tsx` - 主游戏面板
- `src/games/smashup/ui/BaseZone.tsx` - 基地区域组件
- `docs/smashup-titan-manual-test-guide.md` - 手动测试指南

## 下一步

1. 实现基地选择规则（检查冲突、重复出场）
2. 补充 E2E 测试（Task 17）
3. 实现泰坦出场动画（Task 18）
4. 实现泰坦冲突 UI（Task 19）

## 总结

Task 16 的核心 UI 交互已完成：
- 泰坦卡片可点击，选中状态高亮
- 点击后所有基地高亮，显示提示
- 点击基地后分发 PLAY_TITAN 命令
- 回合限制和状态互斥正确实现

基础交互流程已打通，后续可以在此基础上添加规则检查、动画和优化。
