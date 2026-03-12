# 大杀四方泰坦机制 - Task 18: TitanCard 组件实现

## 实现日期
2026-03-07

## 任务概述

实现 TitanCard 组件，用于显示场上的泰坦卡（已出场的泰坦在基地上）。

## 实现内容

### 1. 组件文件

**文件路径**：`src/games/smashup/ui/TitanCard.tsx`

### 2. 核心功能

#### 2.1 数据展示
- ✅ **泰坦名称**：显示泰坦卡牌名称
- ✅ **泰坦图片**：使用 CardPreview 组件渲染泰坦图片
- ✅ **能力描述**：悬停时显示完整的能力列表和描述
- ✅ **力量指示物**：右上角显示 +1 力量指示物数量（如果有）

#### 2.2 控制权标识
- ✅ **边框颜色**：使用 PLAYER_CONFIG 配置的玩家颜色区分己方/对手
- ✅ **卡牌朝向**：对手的泰坦旋转 180 度（`transform rotate-180`）
- ✅ **文字标识**：悬停详情面板中显示"你的泰坦"或"对手的泰坦"

#### 2.3 交互功能
- ✅ **可点击状态**：通过 `clickable` prop 控制是否可点击
- ✅ **选中状态**：通过 `isSelected` prop 显示选中标识（用于移动泰坦）
- ✅ **悬停效果**：悬停时放大卡牌并显示详情面板
- ✅ **点击回调**：通过 `onClick` prop 触发移动泰坦等操作

#### 2.4 视觉设计
- ✅ **紧凑尺寸**：卡牌尺寸为 4vw × 5.6vw，适合在基地上方显示
- ✅ **动画效果**：
  - 进入动画：从上方淡入并缩放
  - 悬停动画：放大并上移
  - 选中动画：边框高亮 + 缩放
- ✅ **层级管理**：使用 z-index 确保悬停详情面板在最上层

### 3. 组件接口

```typescript
interface TitanCardProps {
    /** 泰坦状态数据 */
    titan: ActiveTitan;
    /** 泰坦所有者 ID */
    ownerId: string;
    /** 当前玩家 ID */
    currentPlayerId: string;
    /** 游戏核心状态（用于查询泰坦卡牌数据） */
    core: SmashUpCore;
    /** 是否可点击（用于移动泰坦） */
    clickable?: boolean;
    /** 是否被选中（移动模式） */
    isSelected?: boolean;
    /** 点击回调 */
    onClick?: () => void;
}
```

### 4. 集成到 BaseZone

TitanCard 组件已集成到 BaseZone 组件中，显示在基地卡片上方、持续行动卡下方：

```tsx
{/* --- TITANS (above base card, below ongoing actions) --- */}
{titansOnBase.length > 0 && (
    <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[0.8vw] z-25"
        style={{ top: `-${layout.ongoingTopOffset + 6}vw` }}
    >
        {titansOnBase.map(({ playerId, titan }) => (
            <TitanCard
                key={titan.titanUid}
                titan={titan}
                ownerId={playerId}
                currentPlayerId={myPlayerId || '0'}
                core={core}
                clickable={isMyTurn && myPlayerId === playerId}
                isSelected={movingTitanUid === titan.titanUid}
                onClick={() => {
                    if (onTitanInPlayClick) {
                        onTitanInPlayClick(titan.titanUid);
                    }
                }}
            />
        ))}
    </div>
)}
```

### 5. 设计亮点

#### 5.1 智能降级
- 如果找不到泰坦卡牌定义，显示占位符而不是崩溃
- 尝试从所有玩家的 titanZone 中查找泰坦数据

#### 5.2 响应式悬停详情
- 己方泰坦：详情面板显示在卡牌下方
- 对手泰坦：详情面板显示在卡牌上方（因为卡牌旋转 180 度）

#### 5.3 视觉反馈
- 可点击时显示"点击移动"提示
- 选中时显示勾选标识
- 力量指示物使用渐变背景和动画效果

### 6. 技术细节

#### 6.1 泰坦数据查询
```typescript
// 优先从所有者的 titanZone 查找
const titanCard = player?.titanZone?.find(c => c.uid === titan.titanUid);

// 如果找不到，尝试从派系推断 defId
if (!titanDefId) {
    for (const pid of Object.keys(core.players)) {
        const p = core.players[pid];
        if (p.activeTitan?.titanUid === titan.titanUid) {
            const factionId = p.factions?.[0] || p.factions?.[1];
            if (factionId) {
                titanDefId = `titan_${factionId}`;
            }
            break;
        }
    }
}
```

#### 6.2 能力翻译
```typescript
const getAbilityInfo = (id: string, t: any) => {
    const name = t(`cards.${id}.name`, t(`titans.${id}.name`, id));
    const description = t(`cards.${id}.abilityText`, 
        t(`titans.${id}.abilityText`, 
        t(`cards.${id}.effectText`, '能力描述尚未实现')));
    return { name, description };
};
```

#### 6.3 控制权判断
```typescript
const isMyTitan = ownerId === currentPlayerId;
const pConf = PLAYER_CONFIG[parseInt(ownerId) % PLAYER_CONFIG.length];
```

### 7. 验收标准完成情况

- [x] **显示泰坦名称、图片、能力描述**：完成
  - 卡牌主体显示图片
  - 悬停详情面板显示名称和完整能力描述
  
- [x] **显示力量指示物数量**：完成
  - 右上角显示 +N 徽章
  - 悬停详情面板中显示详细信息
  
- [x] **显示控制权（朝向自己或对手）**：完成
  - 对手泰坦旋转 180 度
  - 使用玩家配置的边框颜色
  - 详情面板中显示文字标识
  
- [x] **支持悬停显示详细信息**：完成
  - 悬停时显示放大的卡牌
  - 显示泰坦名称、力量指示物、能力列表、控制权标识
  
- [ ] **E2E 测试验证 UI 交互**：待完成（Task 27）

### 8. TypeScript 编译验证

```bash
npx tsc --noEmit
# Exit Code: 0 ✅
```

所有类型定义正确，无编译错误。

## 后续工作

1. **人工测试**：在浏览器中验证 TitanCard 组件的显示效果
2. **交互测试**：测试点击移动泰坦的交互流程
3. **多场景测试**：测试不同数量的泰坦、不同力量指示物数量的显示
4. **E2E 测试**：编写自动化测试验证 UI 交互（Task 27）

## 设计参考

### 类似游戏的设计
1. **炉石传说**：英雄卡牌显示在战场上方，悬停显示详情
2. **万智牌竞技场**：指挥官卡牌显示在战场边缘，点击查看详情
3. **昆特牌**：英雄卡牌显示在玩家区域，悬停放大

### 设计原则
- **清晰可见**：卡牌尺寸适中，能清晰看到图片
- **不遮挡视野**：显示在基地上方，不影响随从区域
- **快速识别**：通过颜色和朝向快速区分己方/对手
- **详细信息按需显示**：悬停时显示完整能力描述

## 总结

Task 18 已完成，成功实现了 TitanCard 组件。组件功能完整，视觉效果良好，已集成到 BaseZone 中。用户可以在浏览器中测试泰坦卡牌的显示和交互效果。
