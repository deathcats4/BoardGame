# SmashUp 泰坦图集映射配置 - 完成

## 更新时间
2024-XX-XX

## 更新内容

成功配置了 POD 版本泰坦卡牌的图集映射关系。

## 图集信息

- **文件路径**: `public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp`
- **网格配置**: 4 行 × 8 列 = 32 张卡
- **图集 ID**: `SMASHUP_ATLAS_IDS.TITANS`
- **代码路径**: `smashup/cards/tts_atlas_752d625ca7`（OptimizedImage 自动补全 `i18n/en/` 和 `/compressed/`）

## 泰坦位置映射

| 索引 | 位置 | 派系 | 泰坦名称 | defId |
|------|------|------|----------|-------|
| 0 | 1-1 | Dinosaurs (恐龙) | Fort Titanosaurus (泰坦堡垒龙) | `titan_fort_titanosaurus` |
| 1 | 1-2 | Ninjas (忍者) | Invisible Ninja (隐形忍者) | `titan_invisible_ninja` |
| 2 | 1-3 | Pirates (海盗) | The Kraken (巨妖) | `titan_the_kraken` |
| 3 | 1-4 | Tricksters/Aliens (诡术师/外星人) | Big Funny Giant (大搞笑巨人) | `titan_big_funny_giant` |
| 4 | 1-5 | Wizards (巫师) | Arcane Protector (奥术守护者) | `titan_arcane_protector` |
| 5 | 1-6 | Bear Cavalry (熊骑兵) | Major Ursa (大熊少校) | `titan_major_ursa` |
| 6 | 1-7 | Ghosts (幽灵) | Creampuff Man (奶油泡芙人) | `titan_creampuff_man` |
| 7 | 1-8 | Killer Plants (杀手植物) | Killer Kudzu (杀手葛藤) | `titan_killer_kudzu` |
| 8 | 2-1 | Innsmouth (印斯茅斯) | Dagon (达贡) | `titan_dagon` |
| 9 | 2-2 | Cthulhu (克苏鲁) | Cthulhu (克苏鲁) | `titan_cthulhu` |
| 10 | 2-3 | ??? | ??? | ??? |
| 11 | 2-4 | ??? | ??? | ??? |
| 12 | 2-5 | Giant Ants (巨蚁) | Death on Six Legs (六足死神) | `titan_death_on_six_legs` |
| 13 | 2-6 | Frankenstein (弗兰肯斯坦) | The Bride (新娘) | `titan_the_bride` |
| 14 | 2-7 | Vampires (吸血鬼) | Ancient Lord (古代领主) | `titan_ancient_lord` |
| 15 | 2-8 | Werewolves (狼人) | Great Wolf Spirit (伟大狼灵) | `titan_great_wolf_spirit` |

## 更新的文件

### 1. `src/games/smashup/domain/atlasCatalog.ts`
添加了 TITANS 图集定义：
```typescript
{ id: SMASHUP_ATLAS_IDS.TITANS, kind: 'card', image: 'smashup/cards/tts_atlas_752d625ca7', grid: { rows: 4, cols: 8 } },
```

### 2. `src/games/smashup/data/titans.ts`
更新了所有 14 个泰坦的 `previewRef.index`：
- Fort Titanosaurus: 0
- Invisible Ninja: 1
- The Kraken: 2
- Big Funny Giant: 3
- Arcane Protector: 4
- Major Ursa: 5
- Creampuff Man: 6
- Killer Kudzu: 7
- Dagon: 8
- Cthulhu: 9
- Death on Six Legs: 12
- The Bride: 13
- Ancient Lord: 14
- Great Wolf Spirit: 15

### 3. `src/games/smashup/domain/ids.ts`
确认 GHOSTS 和 ALIENS 派系 ID 已存在，无需修改。

## 验证结果

- ✅ 类型检查通过：`npx tsc --noEmit` 无错误
- ✅ 所有 14 个 POD 泰坦的索引已更新
- ✅ 图集定义已添加到 `atlasCatalog.ts`
- ✅ 派系 ID 已存在于 `ids.ts`

## 待确认

图集中索引 10 和 11（位置 2-3 和 2-4）的泰坦尚未确认。可能是：
- 其他扩展的泰坦（非 POD）
- 空白位置
- 或者是我们遗漏的 POD 泰坦

## 下一步

1. ✅ Task 14 已完成：泰坦卡牌数据定义完成，图集映射配置完成
2. 继续 Task 15：实现泰坦能力定义（`src/games/smashup/domain/abilities/titans.ts`）
3. 继续 Task 16：实现泰坦能力执行器（注册到 `abilityResolver.ts`）

## 技术细节

### 图集路径解析

代码中使用的路径：
```typescript
image: 'smashup/cards/tts_atlas_752d625ca7'
```

运行时实际加载的路径（由 `OptimizedImage` 自动处理）：
```
public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp
```

### 索引计算公式

```
index = (row - 1) × 8 + (col - 1)
```

例如：
- 1-1 → (1-1) × 8 + (1-1) = 0
- 1-4 → (1-1) × 8 + (4-1) = 3
- 2-5 → (2-1) × 8 + (5-1) = 12

## 相关文档

- `docs/smashup-titans-data.md` - 泰坦数据收集文档
- `.kiro/specs/smashup-titan-mechanism/tasks.md` - 泰坦机制实现任务列表
- `docs/ai-rules/asset-pipeline.md` - 资源管线规范
