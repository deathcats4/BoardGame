# Bugfix Requirements Document

## Introduction

本文档描述大杀四方（Smash Up）游戏中泰坦机制的两个关键 bug：

1. **泰坦无视条件出场**：玩家可以在任何时候直接出场泰坦，无需卡牌效果触发
2. **泰坦显示为问号占位符**：泰坦出场后无法显示完整的卡片信息，只显示灰色占位符

这两个 bug 严重影响游戏规则的正确性和用户体验。Bug 1 破坏了泰坦机制的核心规则（只能通过特定卡牌效果出场），Bug 2 导致玩家无法看到泰坦的图片、名称和能力描述。

## Bug Analysis

### Current Behavior (Defect)

#### Bug 1: 泰坦出场验证缺失

1.1 WHEN 玩家在出牌阶段点击泰坦区域的泰坦卡 THEN 系统允许玩家直接选择基地并出场泰坦，无需任何卡牌效果触发

1.2 WHEN 玩家未打出任何允许出场泰坦的卡牌（如 Rainboroc、Megabot 等）THEN 系统仍然允许玩家出场泰坦

1.3 WHEN `PLACE_TITAN` 命令执行验证逻辑时 THEN 系统只检查阶段、玩家 ID、是否已有出场泰坦、泰坦是否在 titanZone、基地索引有效性，但不检查是否有卡牌效果允许出场

#### Bug 2: 泰坦出场后显示异常

1.4 WHEN 泰坦出场到基地上后 THEN 系统在基地上显示灰色占位符，中间显示"?"，无法看到泰坦的图片和信息

1.5 WHEN `TitanCard.tsx` 组件尝试渲染出场的泰坦时 THEN 组件无法找到泰坦的 `defId`，导致 `getTitanDef(titanDefId)` 返回 `null`

1.6 WHEN 泰坦出场后 `activeTitan` 状态只包含 `titanUid`、`baseIndex`、`powerTokens` THEN 组件无法从 `activeTitan` 获取 `defId`，也无法从 `titanZone` 查找（因为泰坦已移除）

1.7 WHEN 组件尝试从 `factionId` 推断 `defId`（`titan_<factionId>`）THEN 推断结果不可靠，导致显示错误

### Expected Behavior (Correct)

#### Bug 1: 泰坦出场必须有卡牌效果允许

2.1 WHEN 玩家在出牌阶段点击泰坦区域的泰坦卡，但当前没有卡牌效果允许出场泰坦 THEN 系统 SHALL 拒绝出场请求，并提示"需要卡牌效果允许才能出场泰坦"

2.2 WHEN 玩家打出允许出场泰坦的卡牌（如 Rainboroc、Megabot 等）THEN 系统 SHALL 设置"允许出场泰坦"标志，允许玩家在该回合内出场泰坦

2.3 WHEN `PLACE_TITAN` 命令执行验证逻辑时 THEN 系统 SHALL 检查"允许出场泰坦"标志，只有标志为 true 时才允许出场

2.4 WHEN 泰坦出场成功或回合结束时 THEN 系统 SHALL 清除"允许出场泰坦"标志，防止下回合无条件出场

#### Bug 2: 泰坦出场后必须显示完整信息

2.5 WHEN 泰坦出场到基地上后 THEN 系统 SHALL 在基地上显示完整的泰坦卡片，包括图片、名称、能力描述、力量指示物

2.6 WHEN `TITAN_PLACED` 事件的 reducer 处理泰坦出场时 THEN 系统 SHALL 将泰坦的 `defId` 从 `titanZone` 的卡牌复制到 `activeTitan` 状态中

2.7 WHEN `TitanCard.tsx` 组件渲染出场的泰坦时 THEN 组件 SHALL 优先从 `activeTitan.defId` 获取 `defId`（如果存在），确保能正确查找泰坦定义

2.8 WHEN 己方或对手的泰坦出场后 THEN 玩家 SHALL 能够悬停查看泰坦能力，点击放大查看泰坦详情

### Unchanged Behavior (Regression Prevention)

#### 泰坦机制的其他功能必须保持正常

3.1 WHEN 玩家通过合法的卡牌效果出场泰坦时 THEN 系统 SHALL CONTINUE TO 正确处理泰坦出场流程（选择基地、放置泰坦、触发能力）

3.2 WHEN 泰坦在基地上参与计分时 THEN 系统 SHALL CONTINUE TO 正确计算泰坦的力量值（基础力量 + 力量指示物）

3.3 WHEN 基地被摧毁时 THEN 系统 SHALL CONTINUE TO 正确处理泰坦的返回逻辑（返回泰坦区域，保留力量指示物）

3.4 WHEN 玩家为泰坦添加力量指示物时 THEN 系统 SHALL CONTINUE TO 正确更新泰坦的力量值并在 UI 上显示

3.5 WHEN 泰坦区域显示未出场的泰坦时 THEN 系统 SHALL CONTINUE TO 正确显示泰坦卡片（图片、名称、能力）

3.6 WHEN 玩家已有出场的泰坦时 THEN 系统 SHALL CONTINUE TO 拒绝出场第二个泰坦（每个玩家同时只能有一个出场的泰坦）

## Bug Condition and Property

### Bug Condition 1: 无效的泰坦出场请求

```pascal
FUNCTION isBugCondition1(X)
  INPUT: X of type PlaceTitanCommand
  OUTPUT: boolean
  
  // 当玩家尝试出场泰坦，但没有卡牌效果允许时，触发 bug
  RETURN X.type = 'PLACE_TITAN' 
    AND state.core.currentPlayer = X.playerId
    AND state.core.phase = 'playCards'
    AND NOT state.core.titanPlacementAllowed
END FUNCTION
```

### Property 1: 泰坦出场必须验证权限

```pascal
// Property: Fix Checking - 泰坦出场权限验证
FOR ALL X WHERE isBugCondition1(X) DO
  result ← validate'(X, state)
  ASSERT result.valid = false 
    AND result.error CONTAINS "需要卡牌效果允许"
END FOR
```

### Bug Condition 2: 泰坦出场后缺少 defId

```pascal
FUNCTION isBugCondition2(X)
  INPUT: X of type TitanPlacedEvent
  OUTPUT: boolean
  
  // 当泰坦出场事件被 reduce 后，activeTitan 缺少 defId
  RETURN X.type = 'TITAN_PLACED'
    AND state'.core.players[X.playerId].activeTitan != null
    AND state'.core.players[X.playerId].activeTitan.defId = undefined
END FUNCTION
```

### Property 2: 泰坦出场后必须包含 defId

```pascal
// Property: Fix Checking - 泰坦状态完整性
FOR ALL X WHERE isBugCondition2(X) DO
  state' ← reduce'(state, X)
  activeTitan ← state'.core.players[X.playerId].activeTitan
  ASSERT activeTitan != null
    AND activeTitan.defId != undefined
    AND activeTitan.defId = originalTitanCard.defId
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT (isBugCondition1(X) OR isBugCondition2(X)) DO
  ASSERT F(X) = F'(X)
END FOR
```

这确保对于所有非 bug 场景（合法的泰坦出场、泰坦计分、泰坦返回等），修复后的代码行为与原始代码完全一致。
