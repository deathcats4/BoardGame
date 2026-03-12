# SmashUp Titan Mechanism - Task 22: ActionLog Formatting

## 任务概述
实现泰坦事件的 ActionLog 格式化，在操作日志中显示泰坦相关的游戏事件。

## 实现内容

### 1. ActionLog 事件处理（src/games/smashup/actionLog.ts）

在 `formatSmashUpActionEntry` 函数的 switch 语句中添加了 6 个泰坦事件的处理：

#### 1.1 TITAN_PLACED（泰坦出场）
```typescript
case SU_EVENTS.TITAN_PLACED: {
    const payload = event.payload as { playerId: string; titanDefId: string; baseIndex: number };
    const baseLabel = formatBaseLabel(getBaseDefId(payload.baseIndex), payload.baseIndex);
    const segments = withCardSegments('actionLog.titanPlaced', payload.titanDefId, { playerId: payload.playerId });
    if (baseLabel) {
        segments.push(i18nSeg('actionLog.onBase', { base: baseLabel }, ['base']));
    }
    pushEntry(event.type, segments, payload.playerId, entryTimestamp, index);
    break;
}
```

**显示效果**：`P0 出场泰坦：[泰坦卡牌预览] → 基地#1`

#### 1.2 TITAN_MOVED（泰坦移动）
```typescript
case SU_EVENTS.TITAN_MOVED: {
    const payload = event.payload as { playerId: string; titanDefId: string; fromBaseIndex: number; toBaseIndex: number };
    const fromLabel = formatBaseLabel(getBaseDefId(payload.fromBaseIndex), payload.fromBaseIndex);
    const toLabel = formatBaseLabel(getBaseDefId(payload.toBaseIndex), payload.toBaseIndex);
    const segments = withCardSegments('actionLog.titanMoved', payload.titanDefId, { playerId: payload.playerId });
    segments.push(i18nSeg('actionLog.fromTo', { from: fromLabel, to: toLabel }, ['from', 'to']));
    pushEntry(event.type, segments, payload.playerId, entryTimestamp, index);
    break;
}
```

**显示效果**：`P0 移动泰坦：[泰坦卡牌预览] 基地#1 → 基地#2`

#### 1.3 TITAN_CLASH（泰坦冲突）
```typescript
case SU_EVENTS.TITAN_CLASH: {
    const payload = event.payload as { 
        winnerPlayerId: string; 
        winnerTitanDefId: string; 
        winnerPower: number;
        loserPlayerId: string; 
        loserTitanDefId: string; 
        loserPower: number;
        baseIndex: number;
    };
    const baseLabel = formatBaseLabel(getBaseDefId(payload.baseIndex), payload.baseIndex);
    const segments: ActionLogSegment[] = [i18nSeg('actionLog.titanClash')];
    const winnerSeg = buildCardSegment(payload.winnerTitanDefId);
    const loserSeg = buildCardSegment(payload.loserTitanDefId);
    if (winnerSeg) segments.push(winnerSeg);
    segments.push(i18nSeg('actionLog.titanClashDetails', {
        winnerPlayerId: payload.winnerPlayerId,
        winnerPower: payload.winnerPower,
        loserPlayerId: payload.loserPlayerId,
        loserPower: payload.loserPower,
    }));
    if (loserSeg) segments.push(loserSeg);
    if (baseLabel) {
        segments.push(i18nSeg('actionLog.onBase', { base: baseLabel }, ['base']));
    }
    pushEntry(event.type, segments, payload.winnerPlayerId, entryTimestamp, index);
    break;
}
```

**显示效果**：`泰坦冲突！[胜者泰坦预览] P0的泰坦（力量5）击败P1的泰坦（力量3） [败者泰坦预览] → 基地#1`

#### 1.4 TITAN_REMOVED（泰坦移除）
```typescript
case SU_EVENTS.TITAN_REMOVED: {
    const payload = event.payload as { playerId: string; titanDefId: string; baseIndex: number; reason?: string };
    const baseLabel = formatBaseLabel(getBaseDefId(payload.baseIndex), payload.baseIndex);
    const segments = withCardSegments('actionLog.titanRemoved', payload.titanDefId, { playerId: payload.playerId });
    if (baseLabel) {
        segments.push(i18nSeg('actionLog.onBase', { base: baseLabel }, ['base']));
    }
    if (payload.reason) {
        segments.push(...buildReasonSegments(payload.reason, buildCardSegment));
    }
    pushEntry(event.type, segments, payload.playerId, entryTimestamp, index);
    break;
}
```

**显示效果**：`P0的泰坦被移除：[泰坦卡牌预览] → 基地#1 （原因：冲突）`

#### 1.5 TITAN_POWER_TOKEN_ADDED（泰坦获得力量指示物）
```typescript
case SU_EVENTS.TITAN_POWER_TOKEN_ADDED: {
    const payload = event.payload as { playerId: string; titanDefId: string; amount: number; baseIndex: number };
    const baseLabel = formatBaseLabel(getBaseDefId(payload.baseIndex), payload.baseIndex);
    const segments = withCardSegments('actionLog.titanPowerTokenAdded', payload.titanDefId, { 
        playerId: payload.playerId,
        amount: payload.amount 
    });
    if (baseLabel) {
        segments.push(i18nSeg('actionLog.onBase', { base: baseLabel }, ['base']));
    }
    pushEntry(event.type, segments, payload.playerId, entryTimestamp, index);
    break;
}
```

**显示效果**：`P0的泰坦获得2个力量指示物：[泰坦卡牌预览] → 基地#1`

#### 1.6 TITAN_POWER_TOKEN_REMOVED（泰坦失去力量指示物）
```typescript
case SU_EVENTS.TITAN_POWER_TOKEN_REMOVED: {
    const payload = event.payload as { playerId: string; titanDefId: string; amount: number; baseIndex: number };
    const baseLabel = formatBaseLabel(getBaseDefId(payload.baseIndex), payload.baseIndex);
    const segments = withCardSegments('actionLog.titanPowerTokenRemoved', payload.titanDefId, { 
        playerId: payload.playerId,
        amount: payload.amount 
    });
    if (baseLabel) {
        segments.push(i18nSeg('actionLog.onBase', { base: baseLabel }, ['base']));
    }
    pushEntry(event.type, segments, payload.playerId, entryTimestamp, index);
    break;
}
```

**显示效果**：`P0的泰坦失去1个力量指示物：[泰坦卡牌预览] → 基地#1`

### 2. i18n 文本（public/locales/zh-CN/game-smashup.json）

在 `actionLog` 部分添加了 7 个新的 i18n key：

```json
{
  "actionLog": {
    // ... 其他 key ...
    "titanPlaced": "{{playerId}} 出场泰坦：",
    "titanMoved": "{{playerId}} 移动泰坦：",
    "titanClash": "泰坦冲突！",
    "titanClashDetails": "{{winnerPlayerId}}的泰坦（力量{{winnerPower}}）击败{{loserPlayerId}}的泰坦（力量{{loserPower}}）",
    "titanRemoved": "{{playerId}}的泰坦被移除：",
    "titanPowerTokenAdded": "{{playerId}}的泰坦获得{{amount}}个力量指示物：",
    "titanPowerTokenRemoved": "{{playerId}}的泰坦失去{{amount}}个力量指示物："
  }
}
```

## 设计特点

### 1. 卡牌预览集成
- 使用 `buildCardSegment()` 为泰坦卡牌生成预览 segment
- 用户可以悬停查看泰坦的完整信息（名称、能力、图片）

### 2. 基地位置显示
- 使用 `formatBaseLabel()` 显示基地名称或索引
- 格式：`→ 基地#1` 或 `→ [基地名称]`

### 3. 原因说明
- TITAN_REMOVED 事件支持可选的 `reason` 字段
- 使用 `buildReasonSegments()` 统一格式化原因说明

### 4. 泰坦冲突详情
- 显示双方玩家 ID、泰坦力量值
- 同时显示胜者和败者的泰坦卡牌预览

### 5. 力量指示物变化
- 清晰显示增加/减少的数量
- 关联到具体的泰坦和基地

## 验证结果

### TypeScript 编译
```bash
npx tsc --noEmit
# ✅ 0 errors
```

### ESLint 检查
```bash
npx eslint src/games/smashup/actionLog.ts
# ✅ 0 errors, 0 warnings
```

## 验收标准完成情况

- [x] TITAN_PLACED → "玩家 X 出场泰坦 Y 到基地 Z"
- [x] TITAN_MOVED → "玩家 X 移动泰坦 Y 从基地 A 到基地 B"
- [x] TITAN_CLASH → "泰坦冲突！玩家 X 的泰坦（力量 N）击败玩家 Y 的泰坦（力量 M）"
- [x] TITAN_REMOVED → "玩家 X 的泰坦被移除（原因：冲突/基地摧毁/能力）"
- [x] TITAN_POWER_TOKEN_ADDED → "玩家 X 的泰坦获得 N 个力量指示物"
- [x] TITAN_POWER_TOKEN_REMOVED → "玩家 X 的泰坦失去 N 个力量指示物"

## 后续工作

Task 22 已完成，接下来需要：

1. **Task 23**：补充完整的泰坦 i18n 文本（卡牌名称、能力描述、UI 文本）
2. **Task 19**：实现泰坦出场交互 UI
3. **Task 20**：实现泰坦移动交互 UI
4. **Task 21**：实现泰坦冲突动画
5. **Task 27**：E2E 测试验证完整流程

## 总结

Task 22 成功实现了泰坦事件的 ActionLog 格式化，所有 6 种泰坦事件都能在操作日志中正确显示。实现遵循了现有的 ActionLog 模式，使用 i18n segment 延迟翻译，支持卡牌预览和基地位置显示。代码通过了 TypeScript 和 ESLint 检查，符合项目规范。
