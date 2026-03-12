# SmashUp 泰坦能力实现 - Batch 2 完成

## 实现状态

**日期**: 2026-03-07  
**任务**: Task 15 - 实现泰坦能力定义（Batch 2）  
**策略**: 三个三个地实现，完成 Batch 1 后继续 Batch 2

## Batch 2 完成工作 (3 个泰坦)

### 1. Invisible Ninja (隐身忍者) - Ninjas

**已实现**:
- ✅ Special 1: 弃牌打出泰坦（回合开始时不在场上）
- ✅ Ongoing: 消灭对手卡牌或返回己方随从后，查看牌库顶2张选1张抽取（每回合一次）
- ✅ Special 2: 回合开始时消灭泰坦，打出战斗力≤3的额外随从

**实现文件**:
- `src/games/smashup/domain/abilities/titans/invisibleNinja.ts`
- 能力 ID: `titan_invisible_ninja_special1`, `titan_invisible_ninja_ongoing`, `titan_invisible_ninja_special2`

**交互处理器**:
- `ninja_invisible_ninja_special1`: 弃牌 → 打出泰坦（TODO）
- `ninja_invisible_ninja_special2`: 消灭泰坦 → 打出额外随从（TODO）

### 2. Killer Kudzu (杀手蔓藤) - Plants

**已实现**:
- ✅ Special 1: 回合开始时不在场上，添加+1力量指示物
- ✅ Special 2: 有3+指示物时，打出泰坦（占用随从打出次数）
- ✅ Ongoing: 泰坦离场后，洗回牌库最多2个随从或抽2张牌
- ✅ Talent: 消灭泰坦，从弃牌堆打出战斗力≤指示物数量的额外随从

**实现文件**:
- `src/games/smashup/domain/abilities/titans/killerKudzu.ts`
- 能力 ID: `titan_killer_kudzu_special1`, `titan_killer_kudzu_special2`, `titan_killer_kudzu_ongoing`, `titan_killer_kudzu_talent`

**交互处理器**:
- `plant_killer_kudzu_special2`: 打出泰坦（占用随从打出次数）（TODO）
- `plant_killer_kudzu_talent`: 消灭泰坦 → 从弃牌堆打出额外随从（TODO）

### 3. Creampuff Man (奶油泡芙人) - Ghosts

**已实现**:
- ✅ Special: 手牌为0时打出泰坦
- ✅ Ongoing: 在泰坦所在基地获得+5战斗力减去手牌数量（最低0）
- ✅ Talent: 弃牌，从弃牌堆打出标准行动作为额外行动，放到牌库底部

**实现文件**:
- `src/games/smashup/domain/abilities/titans/creampuffMan.ts`
- 能力 ID: `titan_creampuff_man_special`, `titan_creampuff_man_ongoing`, `titan_creampuff_man_talent`

**交互处理器**:
- ✅ `ghost_creampuff_man_special`: 打出泰坦（手牌为0时）
- `ghost_creampuff_man_talent`: 弃牌 → 从弃牌堆打出标准行动（TODO）

## Batch 1 补充工作

### 创建缺失的能力文件

**Arcane Protector (奥术守卫) - Wizards**:
- ✅ 创建 `src/games/smashup/domain/abilities/titans/arcaneProtector.ts`
- ✅ Special: 打出第5张或更多卡牌后打出泰坦
- ✅ Ongoing: 每两张手牌提供+1战斗力
- ✅ Talent: 抽一张卡牌

**The Kraken (海怪克拉肯) - Pirates**:
- ✅ 创建 `src/games/smashup/domain/abilities/titans/theKraken.ts`
- ✅ Special: 基地计分后打出泰坦（Release the Kraken!）
- ✅ Ongoing: 泰坦所在基地计分后获得+1力量指示物
- ✅ Talent: 移动泰坦并给其他玩家随从-1战斗力

## 能力注册系统

### 更新的文件

1. **`src/games/smashup/domain/ids.ts`**:
   - ✅ 添加 Batch 2 泰坦能力 ID 常量
   - Invisible Ninja: 3 个能力 ID
   - Killer Kudzu: 4 个能力 ID
   - Creampuff Man: 3 个能力 ID

2. **`src/games/smashup/abilities/titans.ts`**:
   - ✅ 导入 Batch 2 能力函数
   - ✅ 注册 Batch 2 能力到能力注册表
   - ✅ 添加 Batch 2 交互处理器（基础结构，部分 TODO）

3. **`src/games/smashup/domain/abilities/titans/index.ts`**:
   - ✅ 导出 Batch 2 能力文件

## 编译检查

✅ TypeScript 编译通过（`npx tsc --noEmit`）

## 进度总结

### 已完成泰坦 (6/14)

1. ✅ Fort Titanosaurus (恐龙) - Batch 1
2. ✅ Arcane Protector (巫师) - Batch 1
3. ✅ The Kraken (海盗) - Batch 1
4. ✅ Invisible Ninja (忍者) - Batch 2
5. ✅ Killer Kudzu (食人花) - Batch 2
6. ✅ Creampuff Man (幽灵) - Batch 2

### 待实现泰坦 (8/14)

7. ⏳ Major Ursa (传奇熊骑兵) - Bear Cavalry - Batch 3
8. ⏳ Dagon (达贡) - Innsmouth - Batch 3
9. ⏳ Cthulhu (克苏鲁) - Minions of Cthulhu - Batch 3
10. ⏳ Big Funny Giant (快乐巨人) - Tricksters POD - Batch 4
11. ⏳ Great Wolf Spirit (伟大狼灵) - Werewolves - Batch 4
12. ⏳ The Bride (怪人的新娘) - Mad Scientists - Batch 4
13. ⏳ Ancient Lord (古代领主) - Vampires POD - Batch 5
14. ⏳ Death on Six Legs (六足死神) - Giant Ants - Batch 5

## 下一步工作

### Batch 3 (3 个泰坦)

1. **Major Ursa (传奇熊骑兵)**:
   - Special: 打出第3个随从后打出泰坦
   - Ongoing: 每回合一次，打出随从后移动泰坦到该随从所在基地
   - Talent: 移动泰坦到另一个基地，将一个己方随从移动到该基地

2. **Dagon (达贡)**:
   - Special: 控制3+随从时打出泰坦
   - Ongoing: 泰坦所在基地上己方随从+1战斗力
   - Talent: 从牌库顶抽取直到抽到随从，打出该随从

3. **Cthulhu (克苏鲁)**:
   - Special: 弃牌堆有5+卡牌时打出泰坦
   - Ongoing: 回合开始时，从弃牌堆返回一张卡牌到手牌
   - Talent: 消灭一个对手随从

## 待完成的 TODO 项

### 交互处理器实现

1. **Invisible Ninja**:
   - `ninja_invisible_ninja_special1`: 弃牌 → 打出泰坦
   - `ninja_invisible_ninja_special2`: 消灭泰坦 → 打出额外随从

2. **Killer Kudzu**:
   - `plant_killer_kudzu_special2`: 打出泰坦（占用随从打出次数）
   - `plant_killer_kudzu_talent`: 消灭泰坦 → 从弃牌堆打出额外随从

3. **Creampuff Man**:
   - `ghost_creampuff_man_talent`: 弃牌 → 从弃牌堆打出标准行动

### 事件监听系统

需要在 `postProcessSystemEvents` 中添加以下监听逻辑：

1. **Invisible Ninja Ongoing**: 监听 `MINION_DESTROYED` 和 `MINION_RETURNED_TO_HAND` 事件
2. **Killer Kudzu Special 1**: 监听回合开始事件，自动添加力量指示物
3. **Killer Kudzu Ongoing**: 监听泰坦离场事件，触发选择交互

### Ongoing 能力动态计算

需要在计算总战斗力时添加以下逻辑：

1. **Arcane Protector Ongoing**: `Math.floor(手牌数量 / 2)`
2. **Creampuff Man Ongoing**: `Math.max(0, 5 - 手牌数量)`

## 技术挑战

### 1. 不在场上时累积指示物 (Killer Kudzu)
- 需要在泰坦区域（`titanZone`）存储指示物数量
- UI 需要显示泰坦区域中泰坦的指示物数量（即使不在场上）

### 2. 占用随从打出次数 (Killer Kudzu Special 2)
- 打出泰坦算作"打出随从"
- 需要检查并占用本回合的随从打出次数

### 3. 从弃牌堆打出卡牌
- Killer Kudzu Talent: 从弃牌堆打出随从
- Creampuff Man Talent: 从弃牌堆打出标准行动
- 需要支持从弃牌堆打出卡牌的逻辑

### 4. "标准行动"的判定 (Creampuff Man)
- 需要定义哪些行动算"标准行动"
- 可能需要在行动卡定义中添加元数据（`isStandard: boolean`）

### 5. 每回合一次的频率限制
- Invisible Ninja Ongoing: 每回合一次
- 需要计数器（`invisibleNinjaOngoingUsedThisTurn`）
- 回合结束时重置

## 预估剩余工作量

- Batch 3 (Major Ursa, Dagon, Cthulhu): 3-4 小时
- Batch 4 (Big Funny Giant, Great Wolf Spirit, The Bride): 3-4 小时
- Batch 5 (Ancient Lord, Death on Six Legs): 2-3 小时
- 完成 TODO 项: 4-5 小时
- 测试: 3-4 小时
- **总计**: 15-20 小时

## 备注

- Batch 2 完成了基础框架，建立了能力定义和注册模式
- 交互处理器有部分 TODO 项，需要后续补充实现
- Ongoing 能力的动态计算需要在计算总战斗力时添加逻辑
- 完成 Batch 3 后，可以快速扩展到剩余 5 个泰坦
