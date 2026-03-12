# 大杀四方 - 泰坦卡放大功能实现

## 功能概述

为泰坦卡添加放大查看功能和中文悬浮翻译，与其他卡牌保持一致的交互体验。

## 实现方案

### 1. 放大按钮（Magnify Button）

**设计原则**：与其他卡牌保持一致，使用右上角放大镜按钮

**参考实现**：
- `src/games/smashup/ui/BaseZone.tsx` line 302-308：基地卡的放大按钮
- `src/games/summonerwars/ui/BoardGrid.tsx` line 557-560：单位卡的放大按钮
- `src/games/summonerwars/ui/HandArea.tsx` line 162-165：手牌的放大按钮

**按钮特征**：
- 位置：`absolute top-[0.6vw] right-[0.6vw]`（右上角）
- 样式：`opacity-0 group-hover:opacity-100`（悬停时显示）
- 图标：SVG 放大镜图标
- 点击：`onClick={(e) => { e.stopPropagation(); onMagnify(); }}`

### 2. 中文覆盖层（Chinese Overlay）

**设计原则**：泰坦卡使用英文图片 + 中文能力描述覆盖层

**实现位置**：`src/games/smashup/ui/CardMagnifyOverlay.tsx`

**渲染逻辑**：
```typescript
if (target.type === 'titan') {
    // 泰坦卡片：英文图片 + 中文能力覆盖层
    return (
        <div>
            {/* 英文图片 */}
            <CardPreview previewRef={def.previewRef} />
            
            {/* 中文能力覆盖层 */}
            <div className="bg-slate-900/95 backdrop-blur-md">
                <div className="text-amber-400">{resolvedName}</div>
                {def.abilities.map(abilityId => (
                    <div>
                        <span>{t(`cards.${abilityId}.name`)}</span>
                        <span>{t(`cards.${abilityId}.abilityText`)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

## 修改文件

### 1. `src/games/smashup/ui/TitanCard.tsx`

**修改内容**：
- ✅ 移除右键点击实现（`handleClick`、`handleContextMenu`）
- ✅ 添加放大镜按钮（右上角，悬停显示）
- ✅ 简化点击逻辑（左键 = 移动泰坦，放大镜按钮 = 放大查看）

**关键代码**：
```tsx
{/* 放大镜按钮 - hover 时显示 */}
{onMagnify && (
    <button
        onClick={(e) => { e.stopPropagation(); onMagnify(); }}
        className="absolute top-[0.6vw] right-[0.6vw] w-[1.6vw] h-[1.6vw] 
            flex items-center justify-center bg-black/60 hover:bg-amber-500/80 
            text-white rounded-full opacity-0 group-hover/titan:opacity-100 
            transition-[opacity,background-color] duration-200 shadow-lg 
            border border-white/20 z-30 cursor-zoom-in"
    >
        <svg className="w-[0.9vw] h-[0.9vw] fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
    </button>
)}
```

### 2. `src/games/smashup/ui/TitanZone.tsx`

**修改内容**：
- ✅ 移除右键点击实现（`handleClick`、`handleContextMenu`）
- ✅ 添加放大镜按钮（右上角，悬停显示）
- ✅ 简化点击逻辑（左键 = 出场交互，放大镜按钮 = 放大查看）

**关键代码**：
```tsx
{/* 放大镜按钮 - hover 时显示 */}
{onMagnify && def && (
    <button
        onClick={(e) => { e.stopPropagation(); onMagnify(titan.defId); }}
        className="absolute top-1 right-1 w-5 h-5 
            flex items-center justify-center bg-black/60 hover:bg-amber-500/80 
            text-white rounded-full opacity-0 group-hover:opacity-100 
            transition-[opacity,background-color] duration-200 shadow-lg 
            border border-white/20 z-30 cursor-zoom-in"
    >
        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
    </button>
)}
```

### 3. `src/games/smashup/ui/CardMagnifyOverlay.tsx`

**修改内容**：
- ✅ 已实现泰坦卡类型判断（`target.type === 'titan'`）
- ✅ 已实现英文图片 + 中文能力覆盖层渲染
- ✅ 已添加泰坦能力翻译（从 i18n 获取）

**关键代码**：
```tsx
if (target.type === 'titan') {
    // 泰坦卡片：英文图片 + 中文能力覆盖层
    return (
        <div className="relative">
            {/* 英文图片 */}
            <div className="w-full aspect-[0.714] overflow-hidden rounded-xl shadow-2xl">
                <CardPreview previewRef={def.previewRef} className="w-full h-full object-cover" />
            </div>

            {/* 中文能力覆盖层 */}
            <div className="mt-4 bg-slate-900/95 backdrop-blur-md rounded-xl border-2 border-amber-400 p-6 space-y-4">
                {/* 泰坦名称 */}
                <div className="text-amber-400 text-2xl font-black uppercase tracking-tight text-center">
                    {resolvedName}
                </div>

                {/* 能力列表 */}
                <div className="space-y-3">
                    {def.abilities.map((abilityId: string, idx: number) => {
                        const abilityName = t(`cards.${abilityId}.name`, t(`titans.${abilityId}.name`, abilityId));
                        const abilityText = t(
                            `cards.${abilityId}.abilityText`,
                            t(`titans.${abilityId}.abilityText`, t(`cards.${abilityId}.effectText`, '能力描述尚未实现'))
                        );
                        return (
                            <div key={idx} className="text-base text-white/90 leading-relaxed">
                                <span className="text-amber-300 font-bold">{abilityName}:</span>{' '}
                                <span className="text-white/80">{abilityText}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
```

## 用户体验

### 交互流程

1. **悬停泰坦卡** → 右上角出现放大镜按钮
2. **点击放大镜按钮** → 打开放大覆盖层
3. **放大覆盖层显示**：
   - 上方：英文泰坦卡图片（完整尺寸）
   - 下方：中文能力描述覆盖层（深色背景，金色边框）
4. **点击关闭按钮或背景** → 关闭覆盖层

### 与其他卡牌的一致性

| 卡牌类型 | 放大按钮位置 | 悬停显示 | 点击行为 |
|---------|------------|---------|---------|
| 基地卡 | 左上角 | ✅ | 打开放大覆盖层 |
| 随从卡 | 右上角 | ✅ | 打开放大覆盖层 |
| 行动卡 | 右上角 | ✅ | 打开放大覆盖层 |
| **泰坦卡** | **右上角** | **✅** | **打开放大覆盖层** |

## 测试要点

### 功能测试

- [ ] 悬停泰坦卡时，右上角出现放大镜按钮
- [ ] 点击放大镜按钮，打开放大覆盖层
- [ ] 放大覆盖层显示英文图片 + 中文能力描述
- [ ] 中文能力描述正确显示（能力名称 + 能力文本）
- [ ] 点击关闭按钮或背景，关闭覆盖层
- [ ] 左键点击泰坦卡本身，执行移动/出场交互（不打开放大覆盖层）

### 一致性测试

- [ ] 泰坦卡放大按钮与其他卡牌（随从/行动）位置一致（右上角）
- [ ] 泰坦卡放大按钮样式与其他卡牌一致（悬停显示，金色高亮）
- [ ] 泰坦卡放大覆盖层布局与其他卡牌一致（图片 + 描述）

### 边界测试

- [ ] 泰坦卡在 TitanZone（未出场）时，放大按钮正常工作
- [ ] 泰坦卡在基地上（已出场）时，放大按钮正常工作
- [ ] 泰坦卡旋转 180° 时（对手的泰坦），放大按钮位置正确
- [ ] 泰坦卡被选中时（移动模式），放大按钮仍然可用

## 下一步工作

1. **浏览器测试**：在实际游戏中测试放大功能
2. **验证中文覆盖层**：确认中文能力描述正确显示
3. **截图记录**：保存测试截图到证据文档
4. **用户验收**：等待用户确认功能符合预期

## 技术细节

### CSS 类名说明

- `group/titan`：泰坦卡容器的 group 标识符
- `group-hover/titan:opacity-100`：悬停泰坦卡时显示按钮
- `opacity-0`：默认隐藏按钮
- `transition-[opacity,background-color]`：平滑过渡效果
- `cursor-zoom-in`：放大镜光标样式

### 事件处理

- `e.stopPropagation()`：阻止事件冒泡，避免触发卡牌本身的点击事件
- `onClick={(e) => { e.stopPropagation(); onMagnify(); }}`：点击放大镜按钮时，只执行放大操作

### 响应式设计

- 泰坦卡尺寸：`w-[4vw] h-[5.6vw]`（基地上）
- 泰坦卡尺寸：`w-16 h-22`（TitanZone 中）
- 放大镜按钮尺寸：`w-[1.6vw] h-[1.6vw]`（基地上），`w-5 h-5`（TitanZone 中）
- SVG 图标尺寸：`w-[0.9vw] h-[0.9vw]`（基地上），`w-3 h-3`（TitanZone 中）

## 参考文档

- `docs/ai-rules/ui-ux.md`：UI/UX 规范
- `src/games/smashup/ui/BaseZone.tsx`：基地卡放大按钮参考实现
- `src/games/summonerwars/ui/BoardGrid.tsx`：单位卡放大按钮参考实现
- `src/games/summonerwars/ui/HandArea.tsx`：手牌放大按钮参考实现

## 历史记录

- **2025-01-XX**：初始实现（错误：使用右键点击）
- **2025-01-XX**：修正实现（正确：使用右上角放大镜按钮）
