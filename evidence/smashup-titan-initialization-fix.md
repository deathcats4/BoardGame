# SmashUp 泰坦初始化修复

## 问题描述

用户选择了正确的 POD 派系（恐龙、巫师、植物、骗子）后，在游戏中看不到泰坦。

**背景**：Task 8（游戏初始化）在 tasks.md 中标记为已完成，但实际上 `FACTION_TITANS` 映射表是空的，导致泰坦无法初始化。这是一个遗漏的实现细节。

## 根本原因

`src/games/smashup/domain/abilityHelpers.ts` 中的 `FACTION_TITANS` 映射表是空的，导致 `initializeTitanZone` 函数无法为玩家创建泰坦卡实例。

```typescript
// 修复前：空映射表
const FACTION_TITANS: Record<string, string> = {
    // TODO: Task 14 完成后填充泰坦卡定义
    // 'kaiju': 'titan_rainboroc',
    // 'robots': 'titan_megabot',
};
```

## 修复方案

### 1. 填充 FACTION_TITANS 映射表

添加了所有 14 个 POD 派系的泰坦映射：

```typescript
const FACTION_TITANS: Record<string, string> = {
    // POD 派系泰坦（14 个）
    'pirates_pod': 'titan_the_kraken',              // 海盗 (POD版) → 巨妖
    'wizards_pod': 'titan_arcane_protector',        // 巫师 (POD版) → 奥术守护者
    'ninjas_pod': 'titan_invisible_ninja',          // 忍者 (POD版) → 隐形忍者
    'dinosaurs_pod': 'titan_fort_titanosaurus',     // 恐龙 (POD版) → 泰坦堡垒龙
    'killer_plants_pod': 'titan_killer_kudzu',      // 杀手植物 (POD版) → 杀手葛藤
    'tricksters_pod': 'titan_creampuff_man',        // 诡术师 (POD版) → 奶油泡芙人
    'bear_cavalry': 'titan_major_ursa',             // 熊骑兵 → 大熊少校
    'innsmouth': 'titan_dagon',                     // 印斯茅斯 → 达贡
    'minions_of_cthulhu': 'titan_cthulhu',          // 克苏鲁 → 克苏鲁
    'aliens_pod': 'titan_big_funny_giant',          // 外星人 (POD版) → 大搞笑巨人
    'werewolves': 'titan_great_wolf_spirit',        // 狼人 → 伟大狼灵
    'frankenstein': 'titan_the_bride',              // 弗兰肯斯坦 → 新娘
    'vampires': 'titan_ancient_lord',               // 吸血鬼 → 古代领主
    'giant_ants': 'titan_death_on_six_legs',        // 巨蚁 → 六足死神
};
```

### 2. 更新 initializeTitanZone 函数

从泰坦卡定义中获取能力列表：

```typescript
export function initializeTitanZone(factions: [string, string], startUid: number): import('./types').TitanCard[] {
    const titanZone: import('./types').TitanCard[] = [];
    let uidCounter = startUid;

    for (const factionId of factions) {
        const titanDefId = FACTION_TITANS[factionId];
        if (titanDefId) {
            // 从泰坦卡定义中获取能力列表
            const titanDef = getTitanDef(titanDefId);
            const abilities = titanDef?.abilities ?? [];

            // 创建泰坦卡实例
            titanZone.push({
                uid: `titan-${uidCounter++}`,
                defId: titanDefId,
                type: 'titan',
                factionId,
                abilities,
            });
        }
    }

    return titanZone;
}
```

### 3. 添加必要的 import

```typescript
import { getTitanDef } from '../data/titans';
```

## 验证

### TypeScript 编译检查

```bash
npx tsc --noEmit
```

✅ 编译通过，无类型错误

### 手动测试步骤

1. 启动游戏：`npm run dev`
2. 打开浏览器：`http://localhost:5173`
3. 创建房间，选择 POD 派系（如恐龙、巫师、植物、骗子）
4. 打开浏览器控制台（F12）
5. 输入 `allow pasting`（绕过安全警告）
6. 输入 `window.__BG_STATE__?.core.players['0'].titanZone`
7. 应该看到泰坦卡数组（如果选择了 POD 派系）

### 预期结果

- 如果玩家选择了 2 个 POD 派系，`titanZone` 应该包含 2 张泰坦卡
- 如果玩家选择了 1 个 POD 派系 + 1 个非 POD 派系，`titanZone` 应该包含 1 张泰坦卡
- 如果玩家选择了 0 个 POD 派系，`titanZone` 应该是空数组

## 相关文件

- `src/games/smashup/domain/abilityHelpers.ts` - 泰坦初始化逻辑
- `src/games/smashup/data/titans.ts` - 泰坦卡定义
- `src/games/smashup/domain/reduce.ts` - FACTION_SELECTION_COMPLETED 事件处理

## 下一步

用户需要手动测试验证泰坦是否正确初始化到游戏中。
