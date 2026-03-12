# 大杀四方泰坦图片显示完整映射文档

## 📋 概述

本文档详细记录了泰坦卡牌图片显示的完整链路，包括：
- 图片文件位置
- 图集配置
- 卡牌定义中的映射
- UI 组件如何使用

## 🗂️ 图片文件位置

### 实际文件路径
```
public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp
public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp
```

### 文件信息
- **文件名**: `tts_atlas_752d625ca7.webp`
- **大小**: 1,715,632 字节 (1.64 MB)
- **格式**: WebP 压缩格式
- **语言**: 同时存在于 `en` 和 `zh-CN` 两个语言目录

## 🎨 图集配置

### 1. 图集 ID 定义 (`src/games/smashup/domain/ids.ts`)

```typescript
export const SMASHUP_ATLAS_IDS = {
    // ... 其他图集
    TITANS: 'smashup:titans',  // 泰坦图集 ID
} as const;
```

### 2. 图集元数据 (`src/games/smashup/domain/atlasCatalog.ts`)

```typescript
export const SMASHUP_ATLAS_DEFINITIONS: readonly SmashUpAtlasDefinition[] = [
    // ... 其他图集
    { 
        id: SMASHUP_ATLAS_IDS.TITANS, 
        kind: 'card', 
        image: 'smashup/cards/tts_atlas_752d625ca7',  // 图片路径（不含扩展名）
        grid: { rows: 4, cols: 8 }  // 4行8列 = 32个槽位
    },
];
```

### 3. 图集注册 (`src/games/smashup/ui/cardAtlas.ts`)

```typescript
// 模块加载时自动注册所有图集
export function initSmashUpAtlases() {
    for (const atlas of SMASHUP_ATLAS_DEFINITIONS) {
        registerLazyCardAtlasSource(atlas.id, {
            image: atlas.image,  // 'smashup/cards/tts_atlas_752d625ca7'
            grid: atlas.grid,    // { rows: 4, cols: 8 }
        });
    }
}

// 模块加载时自动执行
initSmashUpAtlases();
```

### 图集布局

```
泰坦图集 (4行 × 8列 = 32槽位)
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  第1行
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │  第2行
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │ 23  │  第3行
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 24  │ 25  │ 26  │ 27  │ 28  │ 29  │ 30  │ 31  │  第4行
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

已使用槽位：0-15 (共14个泰坦，索引15是狼人泰坦)
未使用槽位：16-31
```

## 🃏 泰坦卡牌定义与图集索引映射

### 完整映射表 (`src/games/smashup/data/titans.ts`)

| 序号 | 泰坦名称 | defId | 派系 | factionId | 图集索引 |
|------|---------|-------|------|-----------|---------|
| 1 | 泰坦堡垒龙 | `titan_fort_titanosaurus` | 恐龙 | `dinosaurs` | **0** |
| 2 | 隐形忍者 | `titan_invisible_ninja` | 忍者 | `ninjas` | **1** |
| 3 | 巨妖 | `titan_the_kraken` | 海盗 | `pirates` | **2** |
| 4 | 大搞笑巨人 | `titan_big_funny_giant` | 外星人 | `aliens` | **3** |
| 5 | 奥术守护者 | `titan_arcane_protector` | 巫师 | `wizards` | **4** |
| 6 | 大熊少校 | `titan_major_ursa` | 熊骑兵 | `bear_cavalry` | **5** |
| 7 | 奶油泡芙人 | `titan_creampuff_man` | 诡术师 | `tricksters` | **6** |
| 8 | 杀手葛藤 | `titan_killer_kudzu` | 杀手植物 | `killer_plants` | **7** |
| 9 | 达贡 | `titan_dagon` | 印斯茅斯 | `innsmouth` | **8** |
| 10 | 克苏鲁 | `titan_cthulhu` | 克苏鲁 | `minions_of_cthulhu` | **9** |
| 11 | 六足死神 | `titan_death_on_six_legs` | 巨蚁 | `giant_ants` | **12** |
| 12 | 新娘 | `titan_the_bride` | 弗兰肯斯坦 | `frankenstein` | **13** |
| 13 | 古代领主 | `titan_ancient_lord` | 吸血鬼 | `vampires` | **14** |
| 14 | 伟大狼灵 | `titan_great_wolf_spirit` | 狼人 | `werewolves` | **15** |

### 代码示例

```typescript
// 示例：巨妖（海盗泰坦）
{
    defId: 'titan_the_kraken',
    type: 'titan',
    name: '巨妖',
    factionId: SMASHUP_FACTION_IDS.PIRATES,  // 'pirates'
    abilities: [
        'titan_the_kraken_special',
        'titan_the_kraken_ongoing',
        'titan_the_kraken_talent',
    ],
    previewRef: { 
        type: 'atlas', 
        atlasId: SMASHUP_ATLAS_IDS.TITANS,  // 'smashup:titans'
        index: 2  // 图集中的索引位置
    },
}
```

## 🖼️ UI 组件如何使用图片

### 1. TitanZone 组件 (`src/games/smashup/ui/TitanZone.tsx`)

显示未出场的泰坦（在 titanZone 中）

```typescript
// 获取泰坦定义
const def = getTitanDef(titan.defId);

// 使用 CardPreview 组件显示图片
<CardPreview
    previewRef={def?.previewRef}  // { type: 'atlas', atlasId: 'smashup:titans', index: 2 }
    className="w-full h-full object-cover"
/>
```

### 2. TitanCard 组件 (`src/games/smashup/ui/TitanCard.tsx`)

显示已出场的泰坦（在基地上）

```typescript
// 从游戏状态中查找泰坦卡牌
const titanCard = player?.titanZone?.find(c => c.uid === titan.titanUid);
const def = titanDefId ? getTitanDef(titanDefId) : null;

// 使用 CardPreview 组件显示图片
<CardPreview
    previewRef={def.previewRef}  // { type: 'atlas', atlasId: 'smashup:titans', index: X }
    className="w-full h-full object-cover"
/>
```

### 3. CardPreview 组件工作原理

`CardPreview` 组件会：
1. 接收 `previewRef` 对象：`{ type: 'atlas', atlasId: 'smashup:titans', index: 2 }`
2. 从 `cardAtlasRegistry` 获取图集配置
3. 使用 `getLocalizedAssetPath()` 获取本地化路径
4. 根据当前语言（`i18n.language`）自动选择：
   - 中文：`i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp`
   - 英文：`i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp`
5. 使用 CSS `background-position` 显示图集中的指定索引

## 🔄 完整数据流

```
1. 游戏初始化
   └─> game.ts 检查派系是否有泰坦
       └─> 从 TITAN_CARDS 数组找到对应泰坦
           └─> 放入 player.titanZone

2. UI 渲染
   └─> TitanZone.tsx 渲染 titanZone 中的泰坦
       └─> getTitanDef(titan.defId) 获取泰坦定义
           └─> 读取 previewRef: { type: 'atlas', atlasId: 'smashup:titans', index: 2 }
               └─> CardPreview 组件
                   └─> cardAtlasRegistry.get('smashup:titans')
                       └─> 获取图集配置: { image: 'smashup/cards/tts_atlas_752d625ca7', grid: { rows: 4, cols: 8 } }
                           └─> getLocalizedAssetPath('smashup/cards/compressed/tts_atlas_752d625ca7.webp', 'zh-CN')
                               └─> 返回: '/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp'
                                   └─> 使用 CSS background-position 显示索引 2 的图片

3. 泰坦出场
   └─> 从 titanZone 移动到 activeTitan
       └─> BaseZone.tsx 渲染基地上的泰坦
           └─> TitanCard.tsx 显示泰坦卡
               └─> 同样使用 CardPreview + previewRef
```

## ⚠️ 常见问题

### 问题1：泰坦图片不显示（空白）

**可能原因**：
1. ❌ 图片文件不存在于当前语言目录
2. ❌ 图集索引错误
3. ❌ 图集 ID 未在 `ids.ts` 中定义
4. ❌ 图集未在 `atlasCatalog.ts` 中注册

**解决方案**：
1. ✅ 确认图片文件存在于 `public/assets/i18n/{locale}/smashup/cards/compressed/`
2. ✅ 检查 `SMASHUP_ATLAS_IDS.TITANS` 是否定义
3. ✅ 检查 `SMASHUP_ATLAS_DEFINITIONS` 是否包含泰坦图集
4. ✅ 检查 `previewRef.index` 是否在 0-31 范围内

### 问题2：图片显示错误的泰坦

**可能原因**：
- ❌ `previewRef.index` 与实际图集布局不匹配

**解决方案**：
- ✅ 对照上面的"图集布局"表格，确认索引正确
- ✅ 使用图片查看器打开 `tts_atlas_752d625ca7.webp`，手动数格子确认位置

### 问题3：中文环境下图片不显示，英文环境正常

**可能原因**：
- ❌ 图片文件只存在于 `i18n/en/` 目录，不存在于 `i18n/zh-CN/` 目录

**解决方案**：
- ✅ 复制图片文件到两个语言目录：
  ```bash
  Copy-Item "public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp" `
            "public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp"
  ```

## 📝 修改指南

### 如何添加新泰坦

1. **准备图片**：将新泰坦图片添加到图集中（或创建新图集）
2. **更新图集配置**（如果创建新图集）：
   ```typescript
   // src/games/smashup/domain/atlasCatalog.ts
   { id: 'smashup:titans2', kind: 'card', image: 'smashup/cards/new_atlas', grid: { rows: 4, cols: 8 } }
   ```
3. **添加泰坦定义**：
   ```typescript
   // src/games/smashup/data/titans.ts
   {
       defId: 'titan_new_titan',
       type: 'titan',
       name: '新泰坦',
       factionId: 'new_faction',
       abilities: ['titan_new_titan_special'],
       previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 16 },
   }
   ```
4. **复制图片到两个语言目录**

### 如何修改泰坦图片索引

1. 打开 `src/games/smashup/data/titans.ts`
2. 找到对应泰坦的定义
3. 修改 `previewRef.index` 值
4. 运行 `npx tsc --noEmit` 确认无类型错误

## ✅ 验证清单

- [ ] 图片文件存在于 `public/assets/i18n/en/smashup/cards/compressed/`
- [ ] 图片文件存在于 `public/assets/i18n/zh-CN/smashup/cards/compressed/`
- [ ] `SMASHUP_ATLAS_IDS.TITANS` 已定义
- [ ] `SMASHUP_ATLAS_DEFINITIONS` 包含泰坦图集配置
- [ ] 所有泰坦的 `previewRef.atlasId` 都是 `SMASHUP_ATLAS_IDS.TITANS`
- [ ] 所有泰坦的 `previewRef.index` 都在 0-31 范围内
- [ ] 图集索引与实际图片位置匹配
- [ ] `initSmashUpAtlases()` 在模块加载时自动执行

## 📚 相关文件

- **卡牌定义**: `src/games/smashup/data/titans.ts`
- **图集配置**: `src/games/smashup/domain/atlasCatalog.ts`
- **ID 常量**: `src/games/smashup/domain/ids.ts`
- **图集注册**: `src/games/smashup/ui/cardAtlas.ts`
- **UI 组件**: 
  - `src/games/smashup/ui/TitanZone.tsx`
  - `src/games/smashup/ui/TitanCard.tsx`
- **图片文件**: 
  - `public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp`
  - `public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp`

---

**文档创建时间**: 2026-03-07  
**最后更新**: 2026-03-07  
**维护者**: AI Assistant
