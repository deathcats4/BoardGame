# SmashUp 泰坦能力实现 - Batch 3 完成

## 实现状态

**日期**: 2026-03-07  
**任务**: Task 15 - 实现泰坦能力定义（Batch 3）  
**策略**: 三个三个地实现，完成 Batch 2 后继续 Batch 3

## Batch 3 完成工作 (3 个泰坦)

### 1. Major Ursa (传奇熊骑兵) - Bear Cavalry

**已实现**:
-  Special: 代替常规随从打出，打出泰坦到有己方随从的基地
-  Ongoing: 泰坦移动到基地后，可以移动对手的一个随从（战斗力3）
-  Talent: 在泰坦上放置+1指示物，然后移动泰坦到另一个基地

**实现文件**:
- `src/games/smashup/domain/abilities/titans/majorUrsa.ts`
- 能力 ID: `titan_major_ursa_special`, `titan_major_ursa_ongoing`, `titan_major_ursa_talent`

**交互处理器**:
- `bear_cavalry_major_ursa_special`: 选择基地  打出泰坦
- `bear_cavalry_major_ursa_ongoing`: 选择对手随从  移动到另一个基地（TODO）
- `bear_cavalry_major_ursa_talent`: 选择目标基地  添加+1指示物 + 移动泰坦（TODO）

### 2. Dagon (达贡) - Innsmouth

**已实现**:
-  Special: 打出泰坦到有2个或更多同名随从的基地
-  Ongoing: 每有一个与此处另一个随从同名的己方随从，就获得+1战斗力
-  Talent: 在泰坦所在基地打出一个额外随从

**实现文件**:
- `src/games/smashup/domain/abilities/titans/dagon.ts`
- 能力 ID: `titan_dagon_special`, `titan_dagon_ongoing`, `titan_dagon_talent`

**交互处理器**:
- `innsmouth_dagon_special`: 选择基地  打出泰坦
- `innsmouth_dagon_talent`: 选择随从  打出到泰坦所在基地（TODO）

### 3. Cthulhu (克苏鲁) - Minions of Cthulhu

**已实现**:
-  Special: 代替常规行动打出，抽取两张疯狂牌，打出泰坦到有己方随从的基地
-  Ongoing: 打出或抽取疯狂牌后，在泰坦上放置+1指示物
-  Talent: 抽取一张疯狂牌，或将手牌中的疯狂牌放入对手手牌

**实现文件**:
- `src/games/smashup/domain/abilities/titans/cthulhu.ts`
- 能力 ID: `titan_cthulhu_special`, `titan_cthulhu_ongoing`, `titan_cthulhu_talent`

**交互处理器**:
- `cthulhu_minions_cthulhu_special`: 选择基地  抽取2张疯狂牌 + 打出泰坦（TODO）
- `cthulhu_minions_cthulhu_talent`: 选择"抽取疯狂牌"或"放入对手手牌"（TODO）

## 能力注册系统

### 更新的文件

1. **`src/games/smashup/domain/ids.ts`**:
   -  添加 Batch 3 泰坦能力 ID 常量
   - Major Ursa: 3 个能力 ID
   - Dagon: 3 个能力 ID
   - Cthulhu: 3 个能力 ID

2. **`src/games/smashup/abilities/titans.ts`**:
   -  导入 Batch 3 能力函数
   -  注册 Batch 3 能力到能力注册表
   -  添加 Batch 3 交互处理器（基础结构，部分 TODO）

3. **`src/games/smashup/domain/abilities/titans/index.ts`**:
   -  导出 Batch 3 能力文件

## 编译检查

 TypeScript 编译通过（`npx tsc --noEmit`）

## 进度总结

### 已完成泰坦 (9/14)

1.  Fort Titanosaurus (恐龙) - Batch 1
2.  Arcane Protector (巫师) - Batch 1
3.  The Kraken (海盗) - Batch 1
4.  Invisible Ninja (忍者) - Batch 2
5.  Killer Kudzu (食人花) - Batch 2
6.  Creampuff Man (幽灵) - Batch 2
7.  Major Ursa (传奇熊骑兵) - Batch 3
8.  Dagon (达贡) - Batch 3
9.  Cthulhu (克苏鲁) - Batch 3

### 待实现泰坦 (5/14)

10.  Big Funny Giant (快乐巨人) - Tricksters POD - Batch 4
11.  Great Wolf Spirit (伟大狼灵) - Werewolves - Batch 4
12.  The Bride (怪人的新娘) - Mad Scientists - Batch 4
13.  Ancient Lord (古代领主) - Vampires POD - Batch 5
14.  Death on Six Legs (六足死神) - Giant Ants - Batch 5

## 下一步工作

### Batch 4 (3 个泰坦)

1. **Big Funny Giant (快乐巨人)**:
   - Special 1: 代替常规随从打出，打出泰坦
   - Ongoing: 其他玩家在此处打出随从后弃牌；其他玩家回合结束时如果没有随从，放置+1指示物
   - Special 2: 基地计分时，如果你是赢家且至少有一名其他玩家没有随从，获得1 VP

2. **Great Wolf Spirit (伟大狼灵)**:
   - Special: 打出第3个随从后打出泰坦
   - Ongoing: 每回合一次，打出随从后移动泰坦到该随从所在基地
   - Talent: 移动泰坦到另一个基地，将一个己方随从移动到该基地

3. **The Bride (怪人的新娘)**:
   - Special: 控制3+随从时打出泰坦
   - Ongoing: 泰坦所在基地上己方随从+1战斗力
   - Talent: 从牌库顶抽取直到抽到随从，打出该随从

## 待完成的 TODO 项

### 交互处理器实现

1. **Major Ursa**:
   - `bear_cavalry_major_ursa_ongoing`: 选择对手随从  移动到另一个基地
   - `bear_cavalry_major_ursa_talent`: 选择目标基地  添加+1指示物 + 移动泰坦

2. **Dagon**:
   - `innsmouth_dagon_talent`: 选择随从  打出到泰坦所在基地

3. **Cthulhu**:
   - `cthulhu_minions_cthulhu_special`: 选择基地  抽取2张疯狂牌 + 打出泰坦
   - `cthulhu_minions_cthulhu_talent`: 选择"抽取疯狂牌"或"放入对手手牌"

### 事件监听系统

需要在 `postProcessSystemEvents` 中添加以下监听逻辑：

1. **Major Ursa Ongoing**: 监听泰坦移动事件，触发移动对手随从交互
2. **Cthulhu Ongoing**: 监听 `MADNESS_CARD_PLAYED` 和 `MADNESS_CARD_DRAWN` 事件

### Ongoing 能力动态计算

需要在计算总战斗力时添加以下逻辑：

1. **Dagon Ongoing**: 遍历己方随从，统计同名随从数量，计算战斗力加成

## 技术挑战

### 1. "instead of your regular minion play"的实现 (Major Ursa)
- 打出泰坦会占用本回合的随从打出次数
- 需要在验证层检查是否已打出随从
- 打出后需要标记"本回合已打出随从"
- 但打出泰坦不是"打出随从"，不受随从打出位置限制

### 2. 同名随从检测 (Dagon)
- 需要检查基地上己方随从的名称
- 统计每个名称的随从数量
- 判断是否有至少2个同名随从
- 需要区分"控制"和"拥有"

### 3. 疯狂牌系统（Madness Deck）(Cthulhu)
- 需要实现独立的疯狂牌库（Madness deck）
- 疯狂牌可以被抽取、打出、返回牌库
- 疯狂牌打出时有两个选项："抽2张牌"或"返回疯狂牌库"
- 需要区分疯狂牌和普通卡牌

### 4. 打出泰坦占用行动打出次数 (Cthulhu)
- Special 能力打出泰坦算作"打出行动"
- 需要检查并占用本回合的行动打出次数
- 打出后，本回合不能再打出其他行动

### 5. 泰坦冲突与Ongoing能力的时序 (Major Ursa)
- 泰坦移动到已有泰坦的基地时，先解决Ongoing能力
- 解决完Ongoing能力后，再比较战斗力并解决冲突
- 移动对手随从会影响战斗力对比
- 需要在冲突解决前完成所有Ongoing能力

## 预估剩余工作量

- Batch 4 (Big Funny Giant, Great Wolf Spirit, The Bride): 3-4 小时
- Batch 5 (Ancient Lord, Death on Six Legs): 2-3 小时
- 完成 TODO 项: 5-6 小时
- 测试: 4-5 小时
- **总计**: 14-18 小时

## 备注

- Batch 3 完成了基础框架，建立了能力定义和注册模式
- 交互处理器有部分 TODO 项，需要后续补充实现
- Ongoing 能力的动态计算需要在计算总战斗力时添加逻辑
- 完成 Batch 4 后，只剩最后 2 个泰坦（Batch 5）
