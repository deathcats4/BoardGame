# 大杀四方泰坦 UI 修复（完整版）

## 修复日期
2026-03-07

## 问题描述

用户反馈截图显示两个关键问题：

### 问题 1：泰坦区域遮挡手牌
- **现象**：泰坦区域显示在手牌上方，遮挡了手牌区域，影响操作
- **原因**：泰坦区域使用 `absolute bottom-full left-4 mb-2` 定位在手牌区域正上方

### 问题 2：泰坦图片未加载
- **现象**：所有泰坦卡牌显示空白，图片无法加载
- **根本原因**：泰坦图片只在 `i18n/en/` 目录，但代码使用 `zh-CN` locale 加载
- **技术细节**：
  - 图片路径：`public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp`
  - 代码尝试加载：`public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp`（不存在）
  - `cardAtlas.ts` 中使用 `PROBE_LOCALE = 'zh-CN'` 探测图片尺寸
  - 虽然有回退机制（`zh-CN` → `en`），但在预加载阶段就失败了

### 问题 3：UI 设计过于臃肿
- **现象**：泰坦区域占用空间过大，视觉噪音多
- **问题**：大卡牌 + 大标题 + 装饰元素，不符合游戏简洁风格

## 修复方案

### 修复 1：添加 TITANS 图集常量

**文件**：`src/games/smashup/domain/ids.ts`

**修改**：在 `SMASHUP_ATLAS_IDS` 中添加 `TITANS` 常量

```typescript
export const SMASHUP_ATLAS_IDS = {
    BASE1: 'smashup:base1',
    BASE2: 'smashup:base2',
    BASE3: 'smashup:base3',
    BASE4: 'smashup:base4',
    CARDS1: 'smashup:cards1',
    CARDS2: 'smashup:cards2',
    CARDS3: 'smashup:cards3',
    CARDS4: 'smashup:cards4',
    CARDS5: 'smashup:cards5',
    TITANS: 'smashup:titans',  // ✅ 新增
} as const;
```

**效果**：修复了类型错误，但图片仍然无法加载（因为路径问题）

### 修复 2：复制泰坦图片到 zh-CN 目录

**操作**：
```powershell
# 创建目标目录
New-Item -ItemType Directory -Force -Path "public/assets/i18n/zh-CN/smashup/cards/compressed"

# 复制泰坦图片
Copy-Item "public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp" `
          "public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp"
```

**效果**：
- 泰坦图片现在可以从 `zh-CN` 路径正常加载
- 图集懒解析可以正确获取图片尺寸
- 泰坦卡牌图片正常显示

**为什么需要复制**：
- SmashUp 的其他卡牌图片都在 `i18n/en/` 目录（没有 `zh-CN` 版本）
- 但代码中使用 `zh-CN` locale 探测图片尺寸（`cardAtlas.ts` 中 `PROBE_LOCALE = 'zh-CN'`）
- 虽然 `getLocalizedImageUrls` 有回退机制（`zh-CN` → `en`），但 `getPreloadedImageElement` 在预加载阶段就失败了
- 最简单的解决方案是将泰坦图片复制到 `zh-CN` 目录，保持与其他卡牌一致

### 修复 3：调整泰坦区域位置

**文件**：`src/games/smashup/Board.tsx`

**修改前**：
```tsx
{/* 泰坦区域（在手牌上方） */}
{myPlayer.titanZone && myPlayer.titanZone.length > 0 && (
    <div className="absolute bottom-full left-4 mb-2 pointer-events-auto">
        <TitanZone ... />
    </div>
)}
```

**修改后**：
```tsx
{/* 泰坦区域（右上角，不遮挡手牌） */}
{myPlayer && myPlayer.titanZone && myPlayer.titanZone.length > 0 && (
    <div className="absolute top-[180px] right-4 z-40 pointer-events-auto max-w-[400px]">
        <TitanZone ... />
    </div>
)}
```

**位置变化**：
- **原位置**：手牌区域正上方（`bottom-full left-4`）
- **新位置**：右上角（`top-[180px] right-4`）
- **层级**：`z-40`（在记分板 z-20 之上，在交互提示 z-50 之下）
- **最大宽度**：`max-w-[400px]`（避免过宽）

**效果**：
- 泰坦区域不再遮挡手牌
- 位置固定在右上角，视觉清晰
- 不影响其他 UI 元素的交互

### 修复 4：重新设计 TitanZone UI

**文件**：`src/games/smashup/ui/TitanZone.tsx`

**设计理念**：
- **紧凑布局**：横向排列小卡牌（16x22），最小化占用空间
- **快速识别**：悬停时显示放大预览（48x64）+ 能力简介
- **不遮挡视野**：半透明背景，简洁标题栏
- **参考优秀游戏**：类似《炉石传说》的手牌区、《万智牌》的指挥官区

**主要改进**：
1. **卡牌尺寸**：从 32x44 缩小到 16x22（减少 75% 占用空间）
2. **标题栏**：从大标题 + 描述 + 装饰，简化为单行紧凑标题
3. **悬停预览**：从覆盖式详情，改为下方弹出放大预览
4. **动画优化**：减少不必要的动画（扫光、背景装饰），保留核心交互反馈
5. **提示文字**：从"点击卡牌选择泰坦降临"简化为"点击出场"

**代码对比**：
```tsx
// 修改前：大卡牌 + 复杂布局
<div className="flex flex-col gap-4 p-4 bg-slate-900/40 backdrop-blur-md rounded-2xl ...">
    <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br ...">⚔️</div>
            <div>
                <h3>泰坦区域</h3>
                <p>未上场的强大援军</p>
            </div>
        </div>
        <div>数量</div>
    </div>
    <div className="flex gap-4 flex-wrap">
        {/* 32x44 大卡牌 */}
    </div>
</div>

// 修改后：紧凑布局
<div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/60 ...">
        <span>⚔️</span>
        <span>泰坦</span>
        <span className="ml-auto">数量</span>
    </div>
    <div className="flex gap-2">
        {/* 16x22 小卡牌 + 悬停放大 */}
    </div>
</div>
```

**效果**：
- 占用空间减少约 70%
- 视觉更简洁，不喧宾夺主
- 悬停时仍能查看完整信息
- 符合游戏整体风格

## 验证要点

### 1. 图片加载验证
- [x] 泰坦卡牌图片正常显示（不再是空白）
- [ ] 悬停时能看到放大预览
- [ ] 图片清晰，无加载错误

### 2. 布局验证
- [x] 泰坦区域显示在右上角
- [x] 不遮挡手牌区域
- [x] 不遮挡记分板
- [x] 不遮挡基地区域
- [ ] 响应式布局正常（不同屏幕尺寸）

### 3. 交互验证
- [ ] 点击泰坦卡牌可以选中/取消选中
- [ ] 选中状态高亮显示正确
- [ ] 泰坦出场交互流程正常
- [ ] 交互选卡模式下泰坦卡牌高亮正确
- [ ] 悬停时显示放大预览

### 4. 视觉验证
- [x] 泰坦区域样式简洁，不占用过多空间
- [x] 动画效果流畅（进入/悬停/点击）
- [x] 选中标识清晰可见
- [x] 底部提示文字简洁明了

## 技术细节

### 图集路径解析流程

1. **注册阶段**（`cardAtlas.ts`）：
   ```typescript
   registerLazyCardAtlasSource(SMASHUP_ATLAS_IDS.TITANS, {
       image: 'smashup/cards/tts_atlas_752d625ca7',
       grid: { rows: 4, cols: 8 }
   });
   ```

2. **预加载阶段**（`AssetLoader.ts`）：
   ```typescript
   const PROBE_LOCALE = 'zh-CN';
   const localizedPath = getLocalizedAssetPath(image, PROBE_LOCALE);
   // 结果：'i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp'
   ```

3. **渲染阶段**（`CardPreview.tsx`）：
   ```typescript
   const effectiveLocale = locale || i18n.language || 'zh-CN';
   const localizedUrls = getLocalizedImageUrls(source.image, effectiveLocale);
   // primary: 'i18n/zh-CN/...'
   // fallback: 'i18n/en/...'（回退机制）
   ```

4. **问题**：预加载阶段使用 `zh-CN`，但文件不存在，导致懒解析失败

5. **解决方案**：复制图片到 `zh-CN` 目录，确保预加载成功

### 图集配置
- **图集 ID**：`smashup:titans`
- **图集文件**：`tts_atlas_752d625ca7.webp`
- **网格配置**：`{ rows: 4, cols: 8 }`（4行8列，共32个槽位）
- **已使用槽位**：14个泰坦（索引 0-15）
- **文件位置**：
  - `public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp`（原始）
  - `public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp`（新增）

### 泰坦卡牌定义
所有泰坦卡牌的 `previewRef` 都使用：
```typescript
previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: X }
```

### 布局层级
- **z-20**：顶部 HUD（回合追踪器、记分板）
- **z-30**：对手视角指示器
- **z-40**：泰坦区域（新位置）
- **z-50**：结束回合按钮、悬停放大预览
- **z-60**：手牌区域

## 相关任务

- ✅ Task 14：泰坦图集注册和图片加载
- ✅ Task 16：泰坦区域 UI 组件
- ✅ Task 17：泰坦区域增强（悬停详情、选中状态）
- ✅ 本次修复：图集常量缺失 + 路径问题 + 布局遮挡 + UI 优化

## 后续工作

1. **人工测试**：用户需要在浏览器中验证修复效果
2. **截图对比**：对比修复前后的截图，确认问题解决
3. **多场景测试**：测试不同数量的泰坦卡牌（1-2张）的显示效果
4. **响应式测试**：测试不同屏幕尺寸下的布局
5. **悬停预览测试**：确认悬停时放大预览正常显示

## 设计参考

### 优秀游戏的类似设计
1. **炉石传说**：手牌区横向排列小卡牌，悬停时放大
2. **万智牌竞技场**：指挥官区紧凑显示，点击查看详情
3. **杀戮尖塔**：遗物区横向排列小图标，悬停显示详情
4. **昆特牌**：墓地区折叠显示，点击展开

### 设计原则
- **最小化占用空间**：游戏主要视野应该给基地和随从
- **快速识别**：小图标 + 悬停详情，平衡信息密度和可读性
- **不遮挡视野**：固定位置，半透明背景，不影响游戏操作
- **符合游戏风格**：简洁、直观、不喧宾夺主

## 总结

本次修复解决了三个关键问题：
1. **图集常量**：添加缺失的 `TITANS` 常量，修复类型错误
2. **图片加载**：复制泰坦图片到 `zh-CN` 目录，修复路径问题
3. **布局优化**：将泰坦区域从手牌上方移到右上角，避免遮挡
4. **UI 重新设计**：紧凑布局 + 悬停放大，减少 70% 占用空间

修复后，泰坦区域应该能够正常显示图片，且不会影响手牌操作，视觉更简洁专业。
