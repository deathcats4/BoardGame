# Smash Up 泰坦数据收集

> 本文档用于收集所有泰坦卡牌的数据，包括能力描述、FAQ规则、实现要点等。
> 收集完成后将统一实现（Tasks 14-16）。

## 数据收集状态

- [x] The Kraken (海怪克拉肯) - Pirates POD
- [x] Arcane Protector (奥术守卫) - Wizards
- [x] Invisible Ninja (隐身忍者) - Ninjas
- [x] Fort Titanosaurus (巨龙堡垒) - Dinosaurs
- [x] Killer Kudzu (杀手蔓藤) - Plants
- [x] Creampuff Man (奶油泡芙人) - Ghosts
- [x] Major Ursa (传奇熊骑兵) - Bear Cavalry
- [x] Dagon (达贡) - Innsmouth
- [x] Cthulhu (克苏鲁) - Minions of Cthulhu
- [x] Big Funny Giant (快乐巨人) - Tricksters POD
- [x] Great Wolf Spirit (伟大狼灵) - Werewolves
- [x] The Bride (怪人的新娘) - Mad Scientists
- [x] Ancient Lord (古代领主) - Vampires POD
- [x] Death on Six Legs (六足死神) - Giant Ants
- [ ] 其他泰坦待补充...

---

## 1. The Kraken (海怪克拉肯)

### 基本信息
- **所属种族**: Pirates (海盗) - POD版本
- **中文名称**: 海怪克拉肯
- **英文名称**: The Kraken
- **卡牌类型**: Titan (泰坦)

### 能力描述（已与英文规则和 FAQ 对齐）

#### 特殊能力 1 (Special 1)
**英文原文**:
> After a base scores where you had a minion while this card is not in play, you may say "Release the Kraken!" to play this titan on the base that replaces it.

**中文翻译**:
> 在一个有你随从的基地计分后，如果本泰坦不在场上，那么你可以大喊"海怪出现！"然后将本泰坦打出到新基地上。

**实现要点**:
- 触发时机：`AFTER_SCORING` 阶段
- 前置条件：
  - 计分基地上有该玩家的随从（控制的，不只是拥有的）
  - 泰坦不在场上（`titanZone` 中无此泰坦）
- 需要玩家确认：必须说"Release the Kraken!"（UI交互）
- 效果：将泰坦打出到替换基地上
- 特殊规则：如果该玩家在计分基地上有其他泰坦，该泰坦会在基地替换时被移除，此时可以打出The Kraken

#### 天赋能力 (Talent)
**英文原文**:
> Move this titan to another base. Other players' minions there get -1 power until the start of your next turn.

**中文翻译**:
> 将本泰坦移动到另一个基地。其他玩家在那里的所有随从战斗力-1直到你的下回合开始。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 效果1：移动泰坦到另一个基地
- 效果2：给目标基地上其他玩家的随从施加-1战斗力debuff
- 持续时间：**直到该玩家的下回合开始**（不是回合结束！）
- 特殊规则：
  - 如果移动到有其他泰坦的基地，会触发冲突（clash）
  - 在冲突解决前，先应用-1战斗力效果
  - 即使泰坦后续被移除或移动，-1效果仍然持续到指定时间
  - 如果被其他卡牌效果移动（如"They Say He's Got to Go"），不会触发-1效果

#### 特殊能力 2 (Special 2)
**英文原文**:
> After this base scores, move one of your minions from here to another base.

**中文翻译**:
> 在本泰坦所在的基地计分后，将你在这里的一个随从移动到另一个基地。

**实现要点**:
- 触发时机：`AFTER_SCORING` 阶段
- 前置条件：泰坦在计分基地上
- 效果：选择该基地上己方的一个随从，移动到另一个基地
- 注意：计分后随从会被弃置，所以这个能力必须在弃置前触发

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- 是否可以在回合外使用，取决于具体描述
- Special 1可以在任何玩家回合的计分后使用
- Special 2只能在泰坦所在基地计分后使用（必须在场上）

#### 2. "有随从"的定义
- "where you have a minion" = "你控制至少一个随从的地方"
- 只拥有但不控制的随从不算
- 规则：**"Having" cards at a base means you control them.**

#### 3. 必须说"Release the Kraken!"
- 这是能力的一部分，不说就不会触发
- 规则：**When a card says "Do X to do Y", you need to completely do X before you do Y.**

#### 4. 泰坦移除时机
- 如果计分基地上有该玩家的其他泰坦，该泰坦会在基地替换时被移除
- 此时可以打出The Kraken（因为此时泰坦已不在场上）

#### 5. 天赋能力的-1战斗力效果
- 只有使用天赋能力移动时才会触发-1效果
- 被其他卡牌效果移动不会触发
- 规则：**When one card makes you do X and you have another card that says "Do X to do Y", you cannot have that same X count for that other card.**

#### 6. -1战斗力的持续时间
- **持续到该玩家的下回合开始**（不是回合结束！）
- 即使泰坦被移除或移动，效果仍然持续
- 规则：**An effect "until Y" lasts until Y even if the card that causes it leaves play or moves away.**

#### 7. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 8. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无随从），不能获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 9. 泰坦冲突（Clash）
- 当泰坦被打出或移动到已有泰坦的基地时，触发冲突
- 比较双方在该基地的总战斗力
- 战斗力较低的玩家移除其泰坦
- 已在基地上的泰坦在平局时获胜
- 天赋能力的-1效果在冲突解决前应用
- 规则：**After a titan is played to or moved to a base that already has a titan, they "clash"; the controllers of each titan there compare their total power at that base, a player with a lesser total removes their titan; a titan that was already there wins ties.**

#### 10. Special 1的时机
- 在计分后、基地替换时触发
- 此时原基地上的随从已经被弃置
- 所以Special 2不能移动原基地上的随从（它们已经不在场上了）

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/pirates_pod.ts
{
  defId: 'pirates_pod_the_kraken',
  type: 'titan',
  name: 'The Kraken',
  nameCN: '海怪克拉肯',
  power: 0, // 泰坦基础战斗力为0
  abilities: [
    'pirates_pod_kraken_special1',
    'pirates_pod_kraken_talent',
    'pirates_pod_kraken_special2'
  ],
  atlasId: 'pirates_pod_cards', // 待确认
  atlasIndex: 0, // 待确认
}
```

#### 能力定义 (Task 15)
1. **Special 1**: `pirates_pod_kraken_special1`
   - 类型：`afterScoring` trigger
   - 条件：计分基地有己方随从 && 泰坦不在场上
   - 交互：确认对话框（需要说"Release the Kraken!"）
   - 效果：`TITAN_PLAYED` 事件，目标为替换基地

2. **Talent**: `pirates_pod_kraken_talent`
   - 类型：主动能力（玩家回合）
   - 交互：选择目标基地
   - 效果：
     - `TITAN_MOVED` 事件
     - `STATUS_APPLIED` 事件（给其他玩家随从-1战斗力，持续到下回合开始）
   - 需要实现：回合开始时清理debuff的逻辑

3. **Special 2**: `pirates_pod_kraken_special2`
   - 类型：`afterScoring` trigger
   - 条件：泰坦在计分基地上 && 该基地上有己方随从
   - 交互：选择己方随从 + 选择目标基地
   - 效果：`MINION_MOVED` 事件

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- 能力按钮（使用现有框架）
- 确认对话框（Special 1需要特殊文案）
- 目标选择（基地选择、随从选择）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

---



---

## 2. Arcane Protector (奥术守卫)

### 基本信息
- **所属种族**: Wizards (巫师)
- **中文名称**: 奥术守卫
- **英文名称**: Arcane Protector
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> After you play your fifth or higher card in a turn, you may play this titan.

**中文翻译**:
> 在一个回合中打出第五张或更多卡牌后，你可以打出本泰坦。

**实现要点**:
- 触发时机：打出第5张或更多卡牌后立即触发
- 前置条件：
  - 该回合已打出至少5张卡牌
  - 泰坦不在场上
- 可以在任何玩家的回合触发（只要满足条件）
- 需要玩家确认（可选能力）
- 效果：将泰坦打出到选定的基地上
- 特殊规则：
  - Argonaut（既是随从又是行动）只算1张卡牌
  - 必须是"打出"的卡牌，不包括抽牌、从弃牌堆返回等

#### 持续能力 (Ongoing)
**英文原文**:
> You have +1 power here for every two cards in your hand.

**中文翻译**:
> 你在此处每有两张手牌，就获得+1战斗力。

**实现要点**:
- 持续生效：只要泰坦在场上就生效
- 计算方式：`Math.floor(手牌数量 / 2)`
- 战斗力加成表：
  - 0-1张手牌：+0战斗力
  - 2-3张手牌：+1战斗力
  - 4-5张手牌：+2战斗力
  - 6-7张手牌：+3战斗力
  - 8-9张手牌：+4战斗力
  - 10+张手牌：+5战斗力
- 加成对象：该玩家在泰坦所在基地的总战斗力
- 不增加任何随从的战斗力，只增加总战斗力
- 动态计算：手牌数量变化时，战斗力立即变化

#### 天赋能力 (Talent)
**英文原文**:
> Draw a card.

**中文翻译**:
> 抽一张卡牌。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 效果：从牌库抽一张卡牌
- 特殊规则：
  - 抽牌后可能导致手牌超过10张
  - 不需要立即弃牌，等到下一个己方"抽2张牌"阶段再弃牌至10张
  - 抽牌后会增加Ongoing能力的战斗力加成

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Arcane Protector的条件是"打出第5张或更多卡牌后"
- 可以在任何玩家的回合触发，只要该回合你打出了5张或更多卡牌
- 规则：**A Special ability will describe how it can be used.**

#### 2. Ongoing能力的战斗力计算
- 任何时刻：`战斗力加成 = Math.floor(手牌数量 / 2)`
- 每两张手牌提供1点战斗力
- 动态计算：手牌数量变化时，战斗力立即变化
- 规则：**Do exactly what the card says.**

#### 3. 战斗力加成的对象
- 加成到该玩家在该基地的总战斗力
- 不增加任何随从的战斗力
- 正常计算总战斗力，然后加上Ongoing能力的加成
- 规则：**Do exactly what the card says.**

#### 4. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无随从，手牌为0-1张），不能获得VP
- 如果泰坦有+1战斗力指示物，或Ongoing能力提供战斗力，或在Kaiju Island上，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 5. 只有拥有者可以打出泰坦
- 即使对手打出了5张或更多卡牌，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 6. 天赋能力抽牌后的手牌上限
- 使用天赋能力抽牌后，可能导致手牌超过10张
- 不需要立即弃牌
- 等到下一个**己方**"抽2张牌"阶段，先抽2张，然后弃牌至10张
- 在其他时候，手牌可以超过10张
- 规则：**You wait until your Draw 2 Cards phase to discard down to 10; if your hand is bigger than 10 at other times of the game, that's okay.**

#### 7. Argonaut的计数
- Argonaut既是随从又是行动，但只算1张卡牌
- 不能因为它"既是随从又是行动"就算2张
- 规则：**Do exactly what the card says.**

#### 8. "打出卡牌"的定义
- 只有"打出"（play）的卡牌才计数
- 从手牌打出、从弃牌堆打出、从牌库打出等都算
- 抽牌、从弃牌堆返回手牌等不算"打出"
- 必须是该回合内打出的卡牌

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/wizards.ts
{
  defId: 'wizard_arcane_protector',
  type: 'titan',
  name: 'Arcane Protector',
  nameCN: '奥术守卫',
  power: 0, // 泰坦基础战斗力为0
  abilities: [
    'wizard_arcane_protector_special',
    'wizard_arcane_protector_ongoing',
    'wizard_arcane_protector_talent'
  ],
  atlasId: 'wizard_cards', // 待确认
  atlasIndex: 0, // 待确认
}
```

#### 能力定义 (Task 15)
1. **Special**: `wizard_arcane_protector_special`
   - 类型：触发能力（打出第5张或更多卡牌后）
   - 条件：该回合已打出至少5张卡牌 && 泰坦不在场上
   - 交互：选择目标基地
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：
     - 回合内打出卡牌计数器（`cardsPlayedThisTurn`）
     - 每次打出卡牌时检查是否达到5张
     - 回合结束时重置计数器

2. **Ongoing**: `wizard_arcane_protector_ongoing`
   - 类型：持续能力（战斗力修正）
   - 效果：动态计算战斗力加成
   - 计算公式：`Math.floor(手牌数量 / 2)`
   - 需要实现：
     - 在 `getPowerAtBase` 中添加泰坦战斗力计算
     - 实时读取手牌数量
     - 动态更新战斗力显示

3. **Talent**: `wizard_arcane_protector_talent`
   - 类型：主动能力（玩家回合）
   - 效果：`CARD_DRAWN` 事件
   - 特殊规则：抽牌后不立即弃牌至10张

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- 能力按钮（使用现有框架）
- 战斗力动态显示（需要实时更新）
- 打出卡牌计数器显示（可选，用于调试）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

### 实现难点

#### 1. 打出卡牌计数器
- 需要在 `SmashUpCore` 中添加 `cardsPlayedThisTurn: number` 字段
- 每次执行 `CARD_PLAYED` / `MINION_PLAYED` / `ACTION_PLAYED` 事件时增加计数
- 回合结束时重置计数器
- 需要区分"打出"和"抽牌"/"返回手牌"等操作

#### 2. 动态战斗力计算
- Ongoing能力需要在计算总战斗力时实时读取手牌数量
- 手牌数量变化时，战斗力立即变化
- 需要在 `getPowerAtBase` 或类似函数中添加泰坦战斗力计算逻辑
- 可能需要扩展 `TitanSystem.getTitanPowerAtBase()` 方法

#### 3. 手牌上限处理
- 天赋能力抽牌后，手牌可能超过10张
- 不立即弃牌，等到下一个己方"抽2张牌"阶段
- 需要确认现有的手牌上限检查逻辑是否正确




---

## 3. Invisible Ninja (隐身忍者)

### 基本信息
- **所属种族**: Ninjas (忍者)
- **中文名称**: 隐身忍者
- **英文名称**: Invisible Ninja
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 1 (Special 1)
**英文原文**:
> On your turn, if this titan was not in play at the start of your turn, you may discard a card to play this titan at a base where you have a minion.

**中文翻译**:
> 在你的回合中，如果本泰坦在你的回合开始时不在场上，你可以弃置一张卡牌，将本泰坦打出到一个有你随从的基地上。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：在回合开始时（Phase 1）泰坦不在场上 && 至少有一个基地上有己方随从
- 代价：弃置一张手牌
- 效果：将泰坦打出到选定的基地上（该基地必须有己方随从）
- 特殊规则："On your turn"指的是Phase 2，必须在回合开始时不在场上

#### 持续能力 (Ongoing)
**英文原文**:
> Once per turn, after you destroy another player's card or return one of your minions to your hand, you may look at the top two cards of your deck, draw one, and shuffle the other into your deck.

**中文翻译**:
> 每回合一次，在你消灭另一名玩家的卡牌或将你的一个随从返回手牌后，你可以查看你牌库顶的两张卡牌，抽取其中一张，并将另一张洗回牌库。

**实现要点**:
- 触发时机：消灭对手卡牌后 或 己方随从返回手牌后
- 频率限制：每回合一次
- 效果：查看牌库顶2张  选择1张抽取  另1张洗回牌库
- 可选能力：玩家可以选择不使用
- 特殊规则：抽牌后可能超过10张手牌，等到己方"抽2张牌"阶段再弃牌

#### 特殊能力 2 (Special 2)
**英文原文**:
> At the start of your turn, you may destroy this titan to play an extra minion of power 3 or less.

**中文翻译**:
> 在你的回合开始时，你可以消灭本泰坦，打出一个战斗力为3或更低的额外随从。

**实现要点**:
- 触发时机：回合开始阶段（Phase 1）
- 代价：消灭泰坦
- 效果：打出一个战斗力3的随从（不占用本回合打出次数）
- 目标基地：可以打出到任何基地
- 可选能力：玩家可以选择不使用

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Invisible Ninja的第一个Special条件是"On your turn"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**

#### 2. "On your turn"的定义
- "On your turn"指的是Phase 2（打出卡牌阶段）
- 不是Phase 1（回合开始阶段），也不是其他阶段
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 3. "At the start of your turn"的定义
- "At the start of your turn"指的是Phase 1（回合开始阶段）
- 不是Phase 2（打出卡牌阶段）
- 规则：**"At the start of your turn" means "during the Start Turn (phase 1) of each of your turns".**

#### 4. 不能在同一回合使用两个Special能力
- 如果在Phase 2使用Special 1打出泰坦，此时已经不是Phase 1，不能使用Special 2
- 必须等到下一个回合的Phase 1才能使用Special 2
- 规则：**Phase 1和Phase 2是不同的阶段，不能在同一回合内跨阶段使用能力。**

#### 5. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无随从），不能获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 6. Ongoing能力抽牌后的手牌上限
- 使用Ongoing能力抽牌后，可能导致手牌超过10张
- 不需要立即弃牌
- 等到下一个**己方**"抽2张牌"阶段，先抽2张，然后弃牌至10张
- 规则：**You wait until your Draw 2 Cards phase to discard down to 10; if your hand is bigger than 10 at other times of the game, that's okay.**

#### 7. Special 2的额外随从可以打出到任何基地
- 消灭泰坦后打出的额外随从，可以打出到任何基地
- 不限于泰坦所在的基地
- 规则：**If there are no limits, there are no limits.**

#### 8. Special 1的前置条件
- 必须在回合开始时（Phase 1）泰坦不在场上
- 如果回合开始时泰坦已经在场上，则不能使用Special 1
- 这是为了防止在同一回合内反复打出和消灭泰坦

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/ninjas.ts
{
  defId: 'ninja_invisible_ninja',
  type: 'titan',
  name: 'Invisible Ninja',
  nameCN: '隐身忍者',
  power: 0,
  abilities: [
    'ninja_invisible_ninja_special1',
    'ninja_invisible_ninja_ongoing',
    'ninja_invisible_ninja_special2'
  ],
  atlasId: 'ninja_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special 1**: `ninja_invisible_ninja_special1`
   - 类型：主动能力（Phase 2）
   - 条件：回合开始时泰坦不在场上 && 至少有一个基地有己方随从
   - 代价：弃置一张手牌
   - 交互：选择要弃置的手牌 + 选择目标基地
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：回合开始时记录泰坦状态（`titanWasInPlayAtTurnStart`）

2. **Ongoing**: `ninja_invisible_ninja_ongoing`
   - 类型：触发能力（消灭对手卡牌后 或 己方随从返回手牌后）
   - 频率：每回合一次
   - 交互：选择抽取哪张卡牌（从牌库顶2张中选1张）
   - 效果：`CARD_DRAWN` + `CARD_SHUFFLED` 事件
   - 需要实现：回合内使用次数计数器

3. **Special 2**: `ninja_invisible_ninja_special2`
   - 类型：主动能力（Phase 1）
   - 代价：消灭泰坦
   - 交互：选择要打出的随从（战斗力3）+ 选择目标基地
   - 效果：`TITAN_DESTROYED` + `MINION_PLAYED` 事件（额外打出）

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- 能力按钮（使用现有框架）
- 弃牌选择UI（Special 1）
- 查看牌库顶2张卡牌UI（Ongoing）
- 选择随从UI（Special 2，过滤战斗力3）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

### 实现难点

#### 1. 回合开始时泰坦状态记录
- 需要在Phase 1开始时记录泰坦是否在场上
- 在Phase 2检查此标志，决定是否允许使用Special 1
- 回合结束时清除标志

#### 2. 每回合一次的频率限制
- Ongoing能力每回合只能使用一次
- 需要计数器（`invisibleNinjaOngoingUsedThisTurn`）
- 回合结束时重置

#### 3. 查看牌库顶2张卡牌
- 需要实现"查看但不抽取"的UI
- 玩家选择其中1张抽取，另1张洗回牌库
- 洗牌逻辑需要确保随机性

#### 4. Phase 1 vs Phase 2的区分
- Special 1只能在Phase 2使用
- Special 2只能在Phase 1使用
- 需要在命令验证层检查当前阶段

#### 5. 额外打出随从
- Special 2打出的随从不占用本回合的打出次数
- 需要区分"正常打出"和"额外打出"
- 可能需要扩展`MINION_PLAYED`事件，添加`isExtra`标志


## 实现优先级

1. **Phase 1**: 完成The Kraken数据收集（本文档）✅
2. **Phase 2**: 收集其他已实装种族的泰坦数据
3. **Phase 3**: 统一实现所有泰坦（Tasks 14-16）
4. **Phase 4**: E2E测试和验证

## 注意事项

1. **持续时间表达**：中文描述中"直到回合结束"应改为"直到你的下回合开始"
2. **控制vs拥有**：所有"你的随从"都指"你控制的随从"
3. **Special时机**：需要区分"任何时候"vs"在场上时"
4. **泰坦冲突**：需要在移动/打出时检查并解决冲突
5. **VP资格**：泰坦不提供VP资格，需要有随从或战斗力



---

## 4. Fort Titanosaurus (巨龙堡垒)

### 基本信息
- **所属种族**: Dinosaurs (恐龙)
- **中文名称**: 巨龙堡垒
- **英文名称**: Fort Titanosaurus
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> On your turn, if you have not played a minion, you may destroy one of your minions to play this titan on its base. Place +1 power counters on it equal to the power of the destroyed minion.

**中文翻译**:
> 在你的回合中，如果你还没有打出随从，你可以消灭你的一个随从，将本泰坦打出到该随从所在的基地上。在本泰坦上放置等同于被消灭随从战斗力的+1战斗力指示物。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：本回合还未打出随从 && 场上至少有一个己方随从
- 代价：消灭一个己方随从
- 效果：
  - 将泰坦打出到被消灭随从所在的基地
  - 在泰坦上放置+1战斗力指示物（数量 = 被消灭随从的战斗力）
- 特殊规则：
  - "本回合还未打出随从"只计算Phase 2打出的随从，Phase 1打出的不算
  - 被消灭随从的战斗力包括所有修正（buff/debuff/+1指示物等）

#### 持续能力 (Ongoing)
**英文原文**:
> Once per turn, after you play an action that directly affects one or more minions, you may place a +1 power counter on one of those minions and/or on this titan.

**中文翻译**:
> 每回合一次，在你打出一个直接影响一个或多个随从的行动后，你可以在其中一个随从和/或本泰坦上放置一个+1战斗力指示物。

**实现要点**:
- 触发时机：打出行动卡后，该行动直接影响了至少一个随从
- 频率限制：每回合一次
- 效果：选择以下之一或两者：
  - 在受影响的随从之一上放置+1战斗力指示物
  - 在泰坦上放置+1战斗力指示物
- "直接影响"的定义：
  - 行动的目标是随从（如增强、移动、消灭等）
  - 不包括间接影响（如"所有随从+1战斗力"）
- 可选能力：玩家可以选择不使用

#### 天赋能力 (Talent)
**英文原文**:
> If this titan has four or more +1 power counters on it, draw a card.

**中文翻译**:
> 如果本泰坦上有4个或更多+1战斗力指示物，抽一张卡牌。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 前置条件：泰坦上有至少4个+1战斗力指示物
- 效果：从牌库抽一张卡牌
- 特殊规则：抽牌后可能超过10张手牌，等到己方"抽2张牌"阶段再弃牌

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Fort Titanosaurus的条件是"On your turn"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 2. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 3. 被消灭随从的战斗力计算
- "被消灭随从的战斗力"指的是它在场上时的战斗力
- 包括所有修正（buff/debuff/+1指示物等）
- 例如：消灭一个基础战斗力3、有2个+1指示物、被Augmentation增强+4的随从，泰坦获得9个+1指示物
- 规则：**In play, a minion's power includes all modifications.**

#### 4. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 5. 天赋能力抽牌后的手牌上限
- 使用天赋能力抽牌后，可能导致手牌超过10张
- 不需要立即弃牌
- 等到下一个**己方**"抽2张牌"阶段，先抽2张，然后弃牌至10张
- 规则：**You wait until your Draw 2 Cards phase to discard down to 10; if your hand is bigger than 10 at other times of the game, that's okay.**

#### 6. Phase 1 vs Phase 2的随从计数
- "本回合还未打出随从"只计算Phase 2（打出卡牌阶段）打出的随从
- Phase 1（回合开始阶段）打出的随从不计入
- 例如：Sprout让你在回合开始时打出额外随从，这不影响Special能力的使用
- 规则：**Check Ninja Acolyte''s clarification.**

#### 7. Ongoing能力的"直接影响"定义
- "直接影响随从"指的是行动的目标是特定的随从
- 包括：增强、移动、消灭、返回手牌等针对特定随从的行动
- 不包括：全局效果（如"所有随从+1战斗力"）、基地效果等
- 需要明确的规则定义（待确认）

#### 8. Ongoing能力的选择
- 可以选择在受影响的随从之一上放置+1指示物
- 可以选择在泰坦上放置+1指示物
- 可以同时选择两者（各放置1个）
- "and/or"表示可以选择一个或两个

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/dinosaurs.ts
{
  defId: 'dinosaur_fort_titanosaurus',
  type: 'titan',
  name: 'Fort Titanosaurus',
  nameCN: '巨龙堡垒',
  power: 0,
  abilities: [
    'dinosaur_fort_titanosaurus_special',
    'dinosaur_fort_titanosaurus_ongoing',
    'dinosaur_fort_titanosaurus_talent'
  ],
  atlasId: 'dinosaur_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `dinosaur_fort_titanosaurus_special`
   - 类型：主动能力（Phase 2）
   - 条件：本回合Phase 2还未打出随从 && 场上至少有一个己方随从
   - 代价：消灭一个己方随从
   - 交互：选择要消灭的随从
   - 效果：
     - `TITAN_PLAYED` 事件（目标为被消灭随从所在的基地）
     - `POWER_COUNTER_ADDED` 事件（数量 = 被消灭随从的战斗力）
   - 需要实现：
     - Phase 2打出随从计数器（`minionsPlayedInPhase2ThisTurn`）
     - 读取随从在场上的实际战斗力（包括所有修正）

2. **Ongoing**: `dinosaur_fort_titanosaurus_ongoing`
   - 类型：触发能力（打出行动卡后）
   - 条件：行动直接影响了至少一个随从
   - 频率：每回合一次
   - 交互：选择在哪个随从/泰坦上放置+1指示物（可以选择多个）
   - 效果：`POWER_COUNTER_ADDED` 事件
   - 需要实现：
     - 检测行动是否"直接影响"随从（需要定义规则）
     - 回合内使用次数计数器
     - 支持同时在多个目标上放置指示物

3. **Talent**: `dinosaur_fort_titanosaurus_talent`
   - 类型：主动能力（玩家回合）
   - 条件：泰坦上有至少4个+1战斗力指示物
   - 效果：`CARD_DRAWN` 事件

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量）
- 能力按钮（使用现有框架）
- 选择随从UI（Special能力）
- 选择放置指示物目标UI（Ongoing能力，支持多选）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径
- [ ] "直接影响随从"的精确定义（需要查阅官方规则或Wiki）

### 实现难点

#### 1. Phase 2随从计数
- 需要区分Phase 1和Phase 2打出的随从
- 只有Phase 2打出的随从才计入"本回合已打出随从"
- 回合结束时重置计数器

#### 2. 读取随从实际战斗力
- 被消灭随从的战斗力包括所有修正
- 需要在消灭前读取随从的实际战斗力（`getUnitPower(minion, state)`）
- 不能只读取基础战斗力

#### 3. +1战斗力指示物系统
- 需要在泰坦和随从上存储+1指示物数量
- 计算总战斗力时需要加上指示物数量
- UI需要显示指示物数量

#### 4. "直接影响随从"的判定
- 需要定义哪些行动算"直接影响"随从
- 可能需要在行动卡定义中添加元数据（`affectsMinions: true`）
- 或者在执行行动时记录受影响的随从列表

#### 5. Ongoing能力的多目标选择
- 玩家可以选择在受影响的随从之一上放置指示物
- 也可以选择在泰坦上放置指示物
- 也可以同时选择两者
- UI需要支持"选择0-2个目标"的交互



---

## 5. Killer Kudzu (杀手蔓藤)

### 基本信息
- **所属种族**: Plants (杀人植物)
- **中文名称**: 杀手蔓藤
- **英文名称**: Killer Kudzu
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 1 (Special 1)
**英文原文**:
> At the start of your turn, if this titan is not in play, place a +1 power counter on it.

**中文翻译**:
> 在你的回合开始时，如果本泰坦不在场上，在其上放置一个+1战斗力指示物。

**实现要点**:
- 触发时机：回合开始阶段（Phase 1）
- 前置条件：泰坦不在场上
- 效果：在泰坦上放置一个+1战斗力指示物（即使不在场上）
- 特殊规则：指示物累积在泰坦卡牌上，即使它不在场上

#### 特殊能力 2 (Special 2)
**英文原文**:
> On your turn, if this titan has three or more counters on it, you may play it instead of your regular minion play, keeping up to six counters on it.

**中文翻译**:
> 在你的回合中，如果本泰坦上有3个或更多指示物，你可以打出本泰坦来代替你的常规随从打出，保留最多6个指示物。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：泰坦上有至少3个+1战斗力指示物
- 代价：占用本回合的随从打出次数
- 效果：
  - 将泰坦打出到选定的基地
  - 如果指示物超过6个，移除多余的指示物，只保留6个
- 特殊规则：
  - 打出泰坦算作"打出随从"，占用本回合的随从打出次数
  - "instead of your regular minion play"表示这是你本回合的随从打出

#### 持续能力 (Ongoing)
**英文原文**:
> After this titan leaves play, shuffle up to two minions from your discard pile into your deck OR draw two cards.

**中文翻译**:
> 在本泰坦离场后，将你弃牌堆中最多两个随从洗回你的牌库，或者抽两张卡牌。

**实现要点**:
- 触发时机：泰坦离场后（被消灭、被移除、基地计分等）
- 效果：二选一
  - 选项1：从弃牌堆选择最多2个随从，洗回牌库
  - 选项2：抽2张卡牌
- 特殊规则：
  - 基地计分时，所有卡牌同时离场，泰坦的Ongoing能力在所有卡牌进入弃牌堆后触发
  - 可以选择刚刚和泰坦一起离场的随从（它们已经在弃牌堆中）
  - "最多两个"表示可以选择0、1或2个随从

#### 天赋能力 (Talent)
**英文原文**:
> Destroy this titan to play an extra minion from your discard pile with power equal to or less than the number of +1 power counters on this titan.

**中文翻译**:
> 消灭本泰坦，从你的弃牌堆打出一个战斗力等于或小于本泰坦上+1战斗力指示物数量的额外随从。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 代价：消灭泰坦
- 效果：从弃牌堆打出一个随从（战斗力  泰坦上的指示物数量）
- 特殊规则：
  - 这是"额外"打出，不占用本回合的随从打出次数
  - 可以打出到任何基地
  - 必须从弃牌堆打出，不能从手牌打出

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Killer Kudzu有两个Special能力：
  - Special 1在Phase 1（回合开始）触发，不允许打出泰坦
  - Special 2在Phase 2（打出卡牌）触发，允许打出泰坦
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 2. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 3. 打出时指示物超过6个的处理
- 如果泰坦上有超过6个+1指示物，打出时移除多余的指示物
- 只保留6个指示物
- 规则：**You remove the counters until you only have six of them.**

#### 4. Ongoing能力的触发时机
- Ongoing能力在泰坦离场后触发
- 基地计分时，所有卡牌同时离场
- 泰坦的Ongoing能力在所有卡牌进入弃牌堆后才触发
- 因此可以选择刚刚和泰坦一起离场的随从
- 规则：**When a card says "After X, do Y", you need "X" to happen and be resolved completely before you do the effect stated as "Y".**
- 规则：**During the Score Bases step where the cards are discarded, all the cards on the scored base are discarded simultaneously.**

#### 5. Special 2占用随从打出次数
- 打出泰坦算作"打出随从"
- 占用本回合的随从打出次数
- "instead of your regular minion play"表示这是你本回合的随从打出
- 打出泰坦后，本回合不能再打出其他随从（除非有额外打出能力）

#### 6. 不在场上时累积指示物
- Special 1在泰坦不在场上时触发
- 指示物累积在泰坦卡牌上（在泰坦区域）
- 即使泰坦不在场上，指示物也会累积
- 这是Killer Kudzu的独特机制

#### 7. Ongoing能力的选择
- 可以选择"洗回牌库"或"抽牌"
- 洗回牌库时，可以选择0、1或2个随从
- 抽牌时，固定抽2张
- 二选一，不能同时执行

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/plants.ts
{
  defId: 'plant_killer_kudzu',
  type: 'titan',
  name: 'Killer Kudzu',
  nameCN: '杀手蔓藤',
  power: 0,
  abilities: [
    'plant_killer_kudzu_special1',
    'plant_killer_kudzu_special2',
    'plant_killer_kudzu_ongoing',
    'plant_killer_kudzu_talent'
  ],
  atlasId: 'plant_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special 1**: `plant_killer_kudzu_special1`
   - 类型：自动触发（Phase 1）
   - 条件：泰坦不在场上
   - 效果：`POWER_COUNTER_ADDED` 事件（在泰坦区域的泰坦卡牌上）
   - 需要实现：
     - 在泰坦区域存储指示物数量（即使泰坦不在场上）
     - Phase 1自动触发检查

2. **Special 2**: `plant_killer_kudzu_special2`
   - 类型：主动能力（Phase 2）
   - 条件：泰坦上有至少3个+1指示物
   - 代价：占用本回合的随从打出次数
   - 交互：选择目标基地
   - 效果：
     - `TITAN_PLAYED` 事件
     - 如果指示物>6，移除多余指示物（`POWER_COUNTER_REMOVED` 事件）
   - 需要实现：
     - 检查并占用随从打出次数
     - 指示物上限检查（最多6个）

3. **Ongoing**: `plant_killer_kudzu_ongoing`
   - 类型：触发能力（泰坦离场后）
   - 交互：选择"洗回牌库"或"抽牌"
     - 如果选择洗回牌库：选择最多2个随从
   - 效果：
     - 选项1：`CARD_SHUFFLED` 事件（最多2个随从）
     - 选项2：`CARD_DRAWN` 事件（2张）
   - 需要实现：
     - 泰坦离场时触发（BASE_CLEARED、TITAN_DESTROYED等）
     - 基地计分时，在所有卡牌进入弃牌堆后触发

4. **Talent**: `plant_killer_kudzu_talent`
   - 类型：主动能力（玩家回合）
   - 代价：消灭泰坦
   - 交互：选择弃牌堆中的随从（战斗力  指示物数量）
   - 效果：
     - `TITAN_DESTROYED` 事件
     - `MINION_PLAYED` 事件（从弃牌堆，额外打出）

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量，即使不在场上）
- 能力按钮（使用现有框架）
- 选择随从UI（Ongoing能力，从弃牌堆选择）
- 选择"洗回牌库"或"抽牌"UI（Ongoing能力）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

### 实现难点

#### 1. 不在场上时累积指示物
- 泰坦不在场上时，指示物仍然累积在泰坦卡牌上
- 需要在泰坦区域（`titanZone`）存储指示物数量
- UI需要显示泰坦区域中泰坦的指示物数量（即使不在场上）

#### 2. 打出时占用随从打出次数
- Special 2打出泰坦算作"打出随从"
- 需要检查并占用本回合的随从打出次数
- 打出后，本回合不能再打出其他随从

#### 3. 指示物上限检查
- 打出时，如果指示物>6，移除多余指示物
- 需要在打出时检查并调整指示物数量

#### 4. Ongoing能力的触发时机
- 泰坦离场后触发
- 基地计分时，在所有卡牌进入弃牌堆后触发
- 可以选择刚刚和泰坦一起离场的随从

#### 5. 从弃牌堆打出随从
- Talent能力从弃牌堆打出随从
- 需要过滤弃牌堆中战斗力符合条件的随从
- 额外打出，不占用本回合的随从打出次数

#### 6. Ongoing能力的二选一交互
- 玩家选择"洗回牌库"或"抽牌"
- 如果选择洗回牌库，再选择最多2个随从
- UI需要支持两层交互



---

## 6. Creampuff Man (奶油泡芙人)

### 基本信息
- **所属种族**: Ghosts (幽灵)
- **中文名称**: 奶油泡芙人
- **英文名称**: Creampuff Man
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> On your turn, you may play this titan if you have no cards in your hand.

**中文翻译**:
> 在你的回合中，如果你手上没有卡牌，你可以打出本泰坦。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：手牌数量为0
- 效果：将泰坦打出到选定的基地上
- 特殊规则：
  - 必须在Phase 2使用
  - 不能在解决其他效果的过程中打断使用（如Séance抽牌前）

#### 持续能力 (Ongoing)
**英文原文**:
> You have +5 power here minus the number of cards in your hand (minimum 0).

**中文翻译**:
> 你在此处获得+5战斗力减去你的手牌数量（最低为0）。

**实现要点**:
- 持续生效：只要泰坦在场上就生效
- 计算方式：`Math.max(0, 5 - 手牌数量)`
- 战斗力加成表：
  - 0张手牌：+5战斗力
  - 1张手牌：+4战斗力
  - 2张手牌：+3战斗力
  - 3张手牌：+2战斗力
  - 4张手牌：+1战斗力
  - 5张或更多手牌：+0战斗力
- 加成对象：该玩家在泰坦所在基地的总战斗力
- 不增加任何随从的战斗力，只增加总战斗力
- 动态计算：手牌数量变化时，战斗力立即变化

#### 天赋能力 (Talent)
**英文原文**:
> Choose a standard action in your discard pile. Discard a card to play the chosen action as an extra action. Place it on the bottom of your deck instead of the discard pile.

**中文翻译**:
> 选择你弃牌堆中的一个标准行动。弃置一张卡牌，将选择的行动作为额外行动打出。将它放到你牌库底部而不是弃牌堆。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 前置条件：弃牌堆中至少有一个标准行动 && 手牌至少有一张
- 代价：弃置一张手牌
- 效果：
  1. 选择弃牌堆中的一个标准行动
  2. 弃置一张手牌
  3. 从弃牌堆打出选择的行动（作为额外行动）
  4. 行动结算后，放到牌库底部而不是弃牌堆
- 特殊规则：
  - 可以弃置一张标准行动，然后立即从弃牌堆打出它
  - 如果行动有"放到牌库顶"或"返回手牌"等替代弃置的效果，由当前玩家选择
  - 如果没有手牌，技术上可以使用天赋，但无法弃牌，因此无法打出行动

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Creampuff Man的条件是"On your turn"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 2. 不能在解决效果时打断
- 例如：Séance是最后一张手牌，打出后手牌为0，但不能在抽5张牌前打出Creampuff Man
- 必须等效果完全解决后才能使用
- 规则：**Effects are resolved entirely.**

#### 3. "标准行动"的定义
- 标准行动 = 打出后不留在场上的行动
- 包括：
  - 纯on-play行动（没有Ongoing/Talent/Special标签）
  - 纯Special行动（立即以"Special:..."开头）
  - 不埋藏自己的混合行动（如Full Sail、Dogpile）
- 不包括：
  - 打出到基地上的行动
  - 打出到随从上的行动
  - 埋藏到基地下的行动（如Tomb Trap、Blessing of Anubis）
- 规则：**Definition of "standard".**

#### 4. 没有手牌时使用天赋
- 技术上可以使用天赋，但无法弃牌
- 由于无法弃牌，无法打出行动
- 行动的后续效果也不会发生
- 规则：**When a card says "Do X to do Y" or "You may do X to do Y", you need to completely do the effect stated as "X" before you do the effect stated as "Y".**

#### 5. 打出条件不满足的Special行动
- 可以选择条件不满足的Special行动（如"Before a base scores"）
- 打出后由于条件不满足，行动会被弃置
- 但Creampuff Man的天赋仍然生效，行动会被放到牌库底部而不是弃牌堆
- 规则：**If a Special must be played when its conditions don't allow it, it is discarded instead.**

#### 6. 弃置标准行动后立即打出
- 可以弃置一张标准行动，然后立即从弃牌堆打出它
- 效果按顺序解决：先弃置，然后从弃牌堆选择并打出
- 规则：**Effects are resolved entirely.**
- 规则：**If there are no limits, there are no limits.**

#### 7. 行动的替代弃置效果
- 如果行动有"放到牌库顶"（如Favor of Dionysus）或"返回手牌"（如Friendship Power）等效果
- 这些效果与Creampuff Man的"放到牌库底部"冲突
- 由当前玩家选择使用哪个效果
- 规则：**The current player decides the order of events that are supposed to happen simultaneously.**

#### 8. Ongoing能力的战斗力计算
- 任何时刻：`战斗力加成 = Math.max(0, 5 - 手牌数量)`
- 动态计算：手牌数量变化时，战斗力立即变化
- 规则：**Do exactly what the card says.**

#### 9. 战斗力加成的对象
- 加成到该玩家在该基地的总战斗力
- 不增加任何随从的战斗力
- 正常计算总战斗力，然后加上Ongoing能力的加成
- 规则：**Do exactly what the card says.**

#### 10. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（手牌5张或更多，战斗力为0），不能获得VP
- 如果泰坦有+1战斗力指示物，或Ongoing能力提供战斗力，或在Kaiju Island上，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 11. 只有拥有者可以打出泰坦
- 即使对手手牌为0，也不能打出对手的Creampuff Man
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/ghosts.ts
{
  defId: 'ghost_creampuff_man',
  type: 'titan',
  name: 'Creampuff Man',
  nameCN: '奶油泡芙人',
  power: 0,
  abilities: [
    'ghost_creampuff_man_special',
    'ghost_creampuff_man_ongoing',
    'ghost_creampuff_man_talent'
  ],
  atlasId: 'ghost_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `ghost_creampuff_man_special`
   - 类型：主动能力（Phase 2）
   - 条件：手牌数量为0
   - 交互：选择目标基地
   - 效果：`TITAN_PLAYED` 事件

2. **Ongoing**: `ghost_creampuff_man_ongoing`
   - 类型：持续能力（战斗力修正）
   - 效果：动态计算战斗力加成
   - 计算公式：`Math.max(0, 5 - 手牌数量)`
   - 需要实现：
     - 在 `getPowerAtBase` 中添加泰坦战斗力计算
     - 实时读取手牌数量
     - 动态更新战斗力显示

3. **Talent**: `ghost_creampuff_man_talent`
   - 类型：主动能力（玩家回合）
   - 条件：弃牌堆中至少有一个标准行动 && 手牌至少有一张
   - 代价：弃置一张手牌
   - 交互：
     - 选择要弃置的手牌
     - 选择弃牌堆中的标准行动
   - 效果：
     - `CARD_DISCARDED` 事件
     - `ACTION_PLAYED` 事件（从弃牌堆打出，作为额外行动）
     - 行动结算后，`CARD_MOVED` 事件（移动到牌库底部）
   - 需要实现：
     - "标准行动"的判定逻辑
     - 从弃牌堆打出行动
     - 行动结算后放到牌库底部（而不是弃牌堆）
     - 处理行动的替代弃置效果冲突

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- 能力按钮（使用现有框架）
- 战斗力动态显示（需要实时更新）
- 选择弃牌堆中的标准行动UI（需要过滤非标准行动）
- 选择要弃置的手牌UI

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径
- [ ] "标准行动"的精确判定逻辑（需要查阅官方规则或Wiki）

### 实现难点

#### 1. "标准行动"的判定
- 需要定义哪些行动算"标准行动"
- 可能需要在行动卡定义中添加元数据（`isStandard: boolean`）
- 或者根据行动的属性动态判定（没有Ongoing/Talent/不埋藏等）

#### 2. 从弃牌堆打出行动
- 需要支持从弃牌堆打出行动（而不是从手牌）
- 行动结算后需要放到牌库底部（而不是弃牌堆）
- 需要修改行动打出逻辑，支持自定义弃置目标

#### 3. 替代弃置效果冲突
- 行动可能有"放到牌库顶"或"返回手牌"等效果
- 这些效果与Creampuff Man的"放到牌库底部"冲突
- 需要实现冲突解决机制（由当前玩家选择）

#### 4. 动态战斗力计算
- Ongoing能力需要在计算总战斗力时实时读取手牌数量
- 手牌数量变化时，战斗力立即变化
- 需要在 `getPowerAtBase` 或类似函数中添加泰坦战斗力计算逻辑

#### 5. 不能在解决效果时打断
- 需要确保Special能力只能在"自由行动"时使用
- 不能在解决其他效果（如Séance抽牌）时打断
- 可能需要添加"正在解决效果"的状态标志


---

## 7. Major Ursa (传奇熊骑兵)

### 基本信息
- **所属种族**: Bear Cavalry (熊骑兵)
- **中文名称**: 传奇熊骑兵
- **英文名称**: Major Ursa
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> Instead of your regular minion play, you may play this titan on a base where you have a minion.

**中文翻译**:
> 代替你的常规随从打出，你可以将本泰坦打出到一个有你随从的基地上。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：至少有一个基地上有己方随从
- 代价：代替本回合的常规随从打出（占用随从打出次数）
- 效果：将泰坦打出到选定的基地（该基地必须有己方随从）
- 特殊规则：
  - 打出泰坦不是"打出随从"，因此不受随从打出位置限制（如 Ice Castle、Overrun）
  - "instead of your regular minion play"只在 Phase 2 可用

#### 持续能力 (Ongoing)
**英文原文**:
> After this titan is moved to a base, you may move another player's minion of power 3 or less from there to another base.

**中文翻译**:
> 在本泰坦移动到一个基地后，你可以将另一名玩家在那里的一个战斗力为3或更低的随从移动到另一个基地。

**实现要点**:
- 触发时机：泰坦移动到基地后（无论如何移动）
- 效果：选择目标基地上对手的一个随从（战斗力3），移动到另一个基地
- 可选能力：玩家可以选择不使用
- 特殊规则：
  - 无论谁移动了泰坦（己方或对手），都由泰坦控制者选择移动对手的随从
  - 泰坦冲突前会先触发此能力，可以通过移动对手随从来改变战斗力对比

#### 天赋能力 (Talent)
**英文原文**:
> Place a +1 power counter on this titan, and then move it to another base.

**中文翻译**:
> 在本泰坦上放置一个+1战斗力指示物，然后将其移动到另一个基地。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 效果：
  1. 在泰坦上放置一个+1战斗力指示物
  2. 将泰坦移动到另一个基地
- 特殊规则：
  - 移动后会触发 Ongoing 能力
  - 如果移动到有其他泰坦的基地，会触发冲突

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Major Ursa的条件是"instead of your regular minion play"
- 只能在 Phase 2（打出卡牌阶段）使用，因为只有此时才有"常规随从打出"可以放弃
- 规则：**A Special ability will describe how it can be used.**

#### 2. "instead of your regular minion play"的含义
- 代替 Phase 2 的常规随从打出
- 如果用于打出非随从卡牌（如泰坦），则不受随从打出限制
- 例如：Ice Castle 限制"只能在此基地打出随从"，但不限制泰坦打出
- 规则：**"Instead of your regular minion play" means instead of the normal minion play allowed during your Play Cards phase; if used to play a non-minion card, no restriction on minion plays apply to that card play.**

#### 3. "有随从"的定义
- "where you have a minion" = "你控制至少一个随从的地方"
- 只拥有但不控制的随从不算
- 规则：**"Having" cards at a base means you control them.**

#### 4. 基地计分时泰坦的处理
- 泰坦留在基地上直到弃牌步骤
- 所有卡牌同时被弃置时，泰坦被移除（set aside）
- 泰坦上的所有+1战斗力指示物被移除
- 规则：**During the Score Bases step where the cards are discarded, all the cards on the scored base are discarded simultaneously.**
- 规则：**If, for whatever reasons, a titan must leave play, it's actually set aside near its owner's deck and any +1 power counters on it are removed.**

#### 5. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，或在 Kaiju Island 上，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 6. 只有拥有者可以打出泰坦
- 即使对手有常规随从打出机会，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 7. +1战斗力指示物不受能力取消影响
- 放置+1战斗力指示物是确定性效果
- 即使泰坦能力被取消，指示物仍然保留
- 类似于抽牌效果，不会因为能力取消而撤销
- 规则：**Cancelling (or losing) an effect does not necessarily undo what it did.**

#### 8. 被其他卡牌移动也会触发 Ongoing 能力
- Ongoing 能力的触发条件是"泰坦被移动到基地"
- 无论谁移动了泰坦（己方或对手），都会触发
- 触发后，由泰坦控制者选择移动对手的随从
- 规则：**If there are no limits, there are no limits.**
- 规则：**"You" on a minion, action or titan means the controller of the card.**

#### 9. 泰坦冲突与 Ongoing 能力的时序
- 泰坦移动到已有泰坦的基地时，会触发冲突
- 冲突前，先解决所有 Ongoing 能力（包括 Major Ursa 的移动随从能力）
- 解决完 Ongoing 能力后，比较双方"最终"总战斗力
- 移动对手随从会影响战斗力对比，可能改变冲突结果
- 规则：**After a titan is played or moved to a base that already has a titan, resolve relevant Ongoing abilities first, then resolve the "clash".**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/bear_cavalry.ts
{
  defId: 'bear_cavalry_major_ursa',
  type: 'titan',
  name: 'Major Ursa',
  nameCN: '传奇熊骑兵',
  power: 0,
  abilities: [
    'bear_cavalry_major_ursa_special',
    'bear_cavalry_major_ursa_ongoing',
    'bear_cavalry_major_ursa_talent'
  ],
  atlasId: 'bear_cavalry_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `bear_cavalry_major_ursa_special`
   - 类型：主动能力（Phase 2）
   - 条件：至少有一个基地有己方随从 && 本回合还未打出随从
   - 代价：占用本回合的随从打出次数
   - 交互：选择目标基地（必须有己方随从）
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：
     - 验证层检查是否已打出随从
     - 打出后标记"本回合已打出随从"
     - 不受随从打出位置限制（如 Ice Castle）

2. **Ongoing**: `bear_cavalry_major_ursa_ongoing`
   - 类型：触发能力（泰坦移动到基地后）
   - 条件：目标基地上有对手的随从（战斗力3）
   - 交互：选择对手的随从（战斗力3）+ 选择目标基地
   - 效果：`MINION_MOVED` 事件
   - 需要实现：
     - 无论谁移动了泰坦都会触发
     - 泰坦冲突前触发（在 Ongoing 能力解决阶段）
     - 可选能力（玩家可以选择不使用）

3. **Talent**: `bear_cavalry_major_ursa_talent`
   - 类型：主动能力（玩家回合）
   - 交互：选择目标基地
   - 效果：
     - `POWER_COUNTER_ADDED` 事件（在泰坦上+1指示物）
     - `TITAN_MOVED` 事件（移动到目标基地）
   - 需要实现：
     - 移动后触发 Ongoing 能力
     - 如果移动到有其他泰坦的基地，触发冲突

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量）
- 能力按钮（使用现有框架）
- 选择基地UI（Special能力，过滤有己方随从的基地）
- 选择对手随从UI（Ongoing能力，过滤战斗力3）
- 选择目标基地UI（Ongoing能力和Talent能力）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

### 实现难点

#### 1. "instead of your regular minion play"的实现
- 打出泰坦会占用本回合的随从打出次数
- 需要在验证层检查是否已打出随从
- 打出后需要标记"本回合已打出随从"
- 但打出泰坦不是"打出随从"，不受随从打出位置限制

#### 2. Ongoing能力的触发时机
- 无论谁移动了泰坦都会触发
- 需要在所有移动场景（天赋能力、对手卡牌效果等）触发
- 泰坦冲突前必须先触发此能力

#### 3. 泰坦冲突与Ongoing能力的时序
- 泰坦移动到已有泰坦的基地时，先解决Ongoing能力
- 解决完Ongoing能力后，再比较战斗力并解决冲突
- 移动对手随从会影响战斗力对比
- 需要在冲突解决前完成所有Ongoing能力

#### 4. +1战斗力指示物系统
- 需要在泰坦上存储+1指示物数量
- 计算总战斗力时需要加上指示物数量
- UI需要显示指示物数量
- 指示物不受能力取消影响

#### 5. 随从打出位置限制的豁免
- Ice Castle、Overrun等限制"只能在特定基地打出随从"
- 这些限制不适用于泰坦打出
- 需要在验证层区分"打出随从"和"打出泰坦"





---

## 8. Dagon (达贡)

### 基本信息
- **所属种族**: Innsmouth (印斯茅斯/本地人)
- **中文名称**: 达贡
- **英文名称**: Dagon
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> On your turn, you may play this titan on a base where you have two or more minions with the same name.

**中文翻译**:
> 在你的回合中，你可以将本泰坦打出到一个有你两个或更多同名随从的基地上。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：至少有一个基地上有己方的2个或更多同名随从
- 效果：将泰坦打出到选定的基地
- 特殊规则：
  - "On your turn"限制在 Phase 2 使用
  - 必须是己方控制的同名随从（不只是拥有）
  - 同名判定：卡牌名称完全相同（如两个"The Locals"）

#### 持续能力 (Ongoing)
**英文原文**:
> You have +1 power here for each of your minions here that has the same name as another minion here.

**中文翻译**:
> 你在此处每有一个与此处另一个随从同名的己方随从，就获得+1战斗力。

**实现要点**:
- 持续生效：只要泰坦在场上就生效
- 计算方式：遍历己方在该基地的每个随从，如果该基地上有另一个同名随从（无论谁控制），则+1战斗力
- 战斗力加成示例：
  - 己方有2个"The Locals"：每个+1，总共+2战斗力
  - 己方有1个"The Locals"，对手有1个"The Locals"：己方+1战斗力
  - 己方有1个"The Locals"，但基地上没有其他"The Locals"：+0战斗力
  - 己方有3个"The Locals"：每个+1，总共+3战斗力
- 加成对象：该玩家在泰坦所在基地的总战斗力
- 不增加任何随从的战斗力，只增加总战斗力
- 动态计算：随从数量变化时，战斗力立即变化

#### 天赋能力 (Talent)
**英文原文**:
> Play an extra minion here.

**中文翻译**:
> 在此处打出一个额外随从。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 效果：在泰坦所在的基地打出一个额外随从（不占用本回合打出次数）
- 特殊规则：
  - 必须在泰坦所在的基地打出
  - 额外打出，不占用本回合的随从打出次数
  - 打出后会增加 Ongoing 能力的战斗力加成（如果是同名随从）

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Dagon的条件是"On your turn"
- 只能在 Phase 2（打出卡牌阶段）使用，不能在其他阶段使用
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 2. "有随从"的定义
- "where you have two or more minions" = "你控制至少两个随从的地方"
- 只拥有但不控制的随从不算
- 规则：**"Having" cards at a base means you control them.**

#### 3. Ongoing能力的战斗力计算
- 遍历己方在该基地的每个随从
- 如果该基地上有另一个同名随从（无论谁控制），则该随从贡献+1战斗力
- 示例：
  - 己方2个"The Locals"：每个+1，总共+2
  - 己方1个"The Locals"，对手1个"The Locals"：己方+1
  - 己方1个"The Locals"，基地上无其他"The Locals"：+0
  - 己方1个"The Locals"在泰坦基地，另1个在其他基地：+0（不在同一基地）
- 规则：**Do exactly what the card says.**

#### 4. 战斗力加成的对象
- 加成到该玩家在该基地的总战斗力
- 不增加任何随从的战斗力
- 正常计算总战斗力，然后加上 Ongoing 能力的加成
- 规则：**Do exactly what the card says.**

#### 5. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 6. 天赋能力的打出位置
- 天赋能力说"play an extra minion here"
- "here"指泰坦所在的基地
- 必须在泰坦所在的基地打出额外随从
- 规则：**If there are no limits, there are no limits.**（但这里有"here"限制）

#### 7. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无随从或 Ongoing 不提供战斗力），不能获得VP
- 如果泰坦有+1战斗力指示物，或 Ongoing 能力提供战斗力，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 8. 只有拥有者可以打出泰坦
- 即使对手有两个或更多同名随从，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/innsmouth.ts
{
  defId: 'innsmouth_dagon',
  type: 'titan',
  name: 'Dagon',
  nameCN: '达贡',
  power: 0,
  abilities: [
    'innsmouth_dagon_special',
    'innsmouth_dagon_ongoing',
    'innsmouth_dagon_talent'
  ],
  atlasId: 'innsmouth_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `innsmouth_dagon_special`
   - 类型：主动能力（Phase 2）
   - 条件：至少有一个基地上有己方的2个或更多同名随从
   - 交互：选择目标基地（必须有己方的2个或更多同名随从）
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：
     - 检查基地上己方随从的名称
     - 统计同名随从数量
     - 过滤出符合条件的基地（至少2个同名随从）

2. **Ongoing**: `innsmouth_dagon_ongoing`
   - 类型：持续能力（战斗力修正）
   - 效果：动态计算战斗力加成
   - 计算逻辑：
     ```typescript
     let bonus = 0;
     const myMinions = getMyMinionsAtBase(base);
     const allMinions = getAllMinionsAtBase(base);
     
     for (const myMinion of myMinions) {
       const sameNameCount = allMinions.filter(m => m.name === myMinion.name).length;
       if (sameNameCount >= 2) {
         bonus += 1;
       }
     }
     return bonus;
     ```
   - 需要实现：
     - 在 `getPowerAtBase` 中添加泰坦战斗力计算
     - 实时读取基地上的随从列表
     - 动态更新战斗力显示

3. **Talent**: `innsmouth_dagon_talent`
   - 类型：主动能力（玩家回合）
   - 前置条件：手牌中至少有一个随从
   - 交互：选择要打出的随从（从手牌）
   - 效果：`MINION_PLAYED` 事件（额外打出，目标为泰坦所在的基地）
   - 需要实现：
     - 额外打出，不占用本回合的随从打出次数
     - 必须打出到泰坦所在的基地

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- 能力按钮（使用现有框架）
- 战斗力动态显示（需要实时更新）
- 选择基地UI（Special能力，过滤有2个或更多同名随从的基地）
- 选择随从UI（Talent能力，从手牌选择）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

### 实现难点

#### 1. 同名随从检测
- 需要检查基地上己方随从的名称
- 统计每个名称的随从数量
- 判断是否有至少2个同名随从
- 需要区分"控制"和"拥有"

#### 2. 动态战斗力计算
- Ongoing能力需要在计算总战斗力时实时读取基地上的随从列表
- 遍历己方每个随从，检查是否有同名随从（包括对手的）
- 随从数量变化时，战斗力立即变化
- 需要在 `getPowerAtBase` 或类似函数中添加泰坦战斗力计算逻辑

#### 3. 同名判定逻辑
- 需要比较随从的名称（`minion.name` 或 `minion.defId`）
- 可能需要处理不同语言的名称（中文/英文）
- 建议使用 `defId` 进行比较（更可靠）

#### 4. 天赋能力的位置限制
- 天赋能力必须在泰坦所在的基地打出随从
- 需要在验证层检查目标基地是否为泰坦所在的基地
- 额外打出，不占用本回合的随从打出次数

#### 5. 战斗力加成的实时更新
- 随从进入/离开基地时，战斗力加成会变化
- 需要在 UI 中实时显示战斗力加成
- 可能需要在 ActionLog 中显示战斗力加成的来源





---

## 9. Cthulhu (克苏鲁)

### 基本信息
- **所属种族**: Minions of Cthulhu (克苏鲁的仆从)
- **中文名称**: 克苏鲁
- **英文名称**: Cthulhu
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> Instead of your regular action play, draw two Madness cards to play this titan on a base with one of your minions.

**中文翻译**:
> 代替你的常规行动打出，抽取两张疯狂牌，将本泰坦打出到一个有你随从的基地上。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 代价：占用本回合的行动打出次数 + 抽取两张疯狂牌
- 前置条件：至少有一个基地上有己方随从
- 效果：将泰坦打出到选定的基地（该基地必须有己方随从）
- 特殊规则：
  - 抽取的两张疯狂牌不会触发 Ongoing 能力（泰坦还未入场）
  - 打出泰坦不受行动打出位置限制（如 The Dread Gazebo、Magic Ward）
  - Mark of Sleep 会阻止打出（因为无法使用行动打出次数）

#### 持续能力 (Ongoing)
**英文原文**:
> After you play or draw a Madness card place a +1 power counter on this titan.

**中文翻译**:
> 在你打出或抽取一张疯狂牌后，在本泰坦上放置一个+1战斗力指示物。

**实现要点**:
- 触发时机：打出疯狂牌后 或 抽取疯狂牌后
- 效果：在泰坦上放置一个+1战斗力指示物
- 特殊规则：
  - 打出疯狂牌选择"返回疯狂牌库"也算打出，会触发此能力
  - 将疯狂牌放入其他玩家手牌不算"打出"或"抽取"，不触发
  - 其他卡牌让你返回疯狂牌到牌库不算"打出"，不触发
  - 指示物不受能力取消影响（永久效果）

#### 天赋能力 (Talent)
**英文原文**:
> Draw a Madness card, OR place a Madness card from your hand into another player's hand.

**中文翻译**:
> 抽取一张疯狂牌，或者将你手牌中的一张疯狂牌放入另一名玩家的手牌中。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 效果：二选一
  - 选项1：抽取一张疯狂牌（会触发 Ongoing 能力）
  - 选项2：将手牌中的一张疯狂牌放入对手手牌（不触发 Ongoing 能力）
- 特殊规则：
  - 抽取疯狂牌后可能超过10张手牌，等到己方"抽2张牌"阶段再弃牌

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Cthulhu的条件是"instead of your regular action play"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"Instead of your regular action play" means instead of the normal action play allowed during your Play Cards phase; if used to play a non-action card, no restriction on action plays apply to that card play.**

#### 2. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 3. 抽取的疯狂牌不触发 Ongoing
- 打出泰坦前抽取的两张疯狂牌不会触发 Ongoing 能力
- 因为泰坦还未入场，无法"见证"抽牌事件
- 规则：**For an ability to respond to a trigger, its card needs to be in play when the triggering event happens.**

#### 4. 打出泰坦不受行动位置限制
- The Dread Gazebo、Magic Ward 等限制"只能在特定基地打出行动"
- 这些限制不适用于泰坦打出（打出的是泰坦，不是行动）
- 规则：**"Instead of your regular action play" means instead of the normal action play allowed during your Play Cards phase; if used to play a non-action card, no restriction on action plays apply to that card play.**

#### 5. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 6. 只有拥有者可以打出泰坦
- 即使对手有随从且未打出行动，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 7. 打出疯狂牌选择返回牌库也触发
- 打出疯狂牌时，可以选择"抽2张牌"或"返回疯狂牌库"
- 选择"返回疯狂牌库"也算打出疯狂牌，会触发 Ongoing 能力
- 规则：**Do exactly what the card says.**

#### 8. 天赋能力抽牌后的手牌上限
- 使用天赋能力抽牌后，可能导致手牌超过10张
- 不需要立即弃牌
- 等到下一个**己方**"抽2张牌"阶段，先抽2张，然后弃牌至10张
- 规则：**You wait until your Draw 2 Cards phase to discard down to 10; if your hand is bigger than 10 at other times of the game, that's okay.**

#### 9. 放入对手手牌不触发 Ongoing
- 将疯狂牌放入对手手牌不算"打出"或"抽取"
- 不会触发 Ongoing 能力
- 规则：**Specific words are not synonymous no matter how similar they seem.**

#### 10. 其他卡牌让你返回疯狂牌不触发
- 如果其他卡牌（如 Psychologist）让你返回疯狂牌到牌库
- 这不算"打出"疯狂牌，不会触发 Ongoing 能力
- 但如果是疯狂牌自己的效果让你返回，则算"打出"，会触发
- 规则：**Do exactly what the card says.**
- 规则：**Specific words are not synonymous no matter how similar they seem.**

#### 11. 能力取消不移除指示物
- 如果 Cthulhu 的能力被取消，已放置的+1指示物不会被移除
- 放置指示物是确定性效果，不会因能力取消而撤销
- 规则：**Cancelling (or losing) an effect does not necessarily undo what it did.**

#### 12. Mark of Sleep 阻止打出
- Mark of Sleep 让玩家无法打出行动
- 因此无法使用"行动打出次数"来打出 Cthulhu
- 规则：**Do exactly what the card says.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/minions_of_cthulhu.ts
{
  defId: 'cthulhu_minions_cthulhu',
  type: 'titan',
  name: 'Cthulhu',
  nameCN: '克苏鲁',
  power: 0,
  abilities: [
    'cthulhu_minions_cthulhu_special',
    'cthulhu_minions_cthulhu_ongoing',
    'cthulhu_minions_cthulhu_talent'
  ],
  atlasId: 'cthulhu_minions_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `cthulhu_minions_cthulhu_special`
   - 类型：主动能力（Phase 2）
   - 代价：占用本回合的行动打出次数 + 抽取两张疯狂牌
   - 条件：至少有一个基地上有己方随从
   - 交互：选择目标基地（必须有己方随从）
   - 效果：
     - `MADNESS_CARD_DRAWN` 事件（2张）
     - `TITAN_PLAYED` 事件
   - 需要实现：
     - 检查并占用行动打出次数
     - 疯狂牌系统（Madness deck）
     - 抽取的疯狂牌不触发 Ongoing（泰坦还未入场）

2. **Ongoing**: `cthulhu_minions_cthulhu_ongoing`
   - 类型：触发能力（打出或抽取疯狂牌后）
   - 效果：`POWER_COUNTER_ADDED` 事件（在泰坦上）
   - 需要实现：
     - 监听 `MADNESS_CARD_PLAYED` 和 `MADNESS_CARD_DRAWN` 事件
     - 区分"打出"和"放入对手手牌"
     - 区分"自己打出返回"和"其他卡牌让你返回"

3. **Talent**: `cthulhu_minions_cthulhu_talent`
   - 类型：主动能力（玩家回合）
   - 交互：选择"抽取疯狂牌"或"放入对手手牌"
     - 如果选择放入对手手牌：选择手牌中的疯狂牌 + 选择对手
   - 效果：
     - 选项1：`MADNESS_CARD_DRAWN` 事件（会触发 Ongoing）
     - 选项2：`CARD_MOVED` 事件（不触发 Ongoing）

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量）
- 能力按钮（使用现有框架）
- 疯狂牌系统UI（疯狂牌库、抽取、打出）
- 选择对手UI（Talent能力）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径
- [ ] 疯狂牌系统的实现细节（Madness deck 是否已实现）

### 实现难点

#### 1. 疯狂牌系统（Madness Deck）
- 需要实现独立的疯狂牌库（Madness deck）
- 疯狂牌可以被抽取、打出、返回牌库
- 疯狂牌打出时有两个选项："抽2张牌"或"返回疯狂牌库"
- 需要区分疯狂牌和普通卡牌

#### 2. 打出泰坦占用行动打出次数
- Special 能力打出泰坦算作"打出行动"
- 需要检查并占用本回合的行动打出次数
- 打出后，本回合不能再打出其他行动

#### 3. 抽取疯狂牌的时机
- 打出泰坦前抽取的两张疯狂牌不会触发 Ongoing
- 需要在泰坦入场后才开始监听疯狂牌事件

#### 4. 区分"打出"和"放入对手手牌"
- Ongoing 能力只对"打出"或"抽取"疯狂牌触发
- 将疯狂牌放入对手手牌不触发
- 需要在事件中区分这两种操作

#### 5. 区分"自己打出返回"和"其他卡牌让你返回"
- 疯狂牌自己的效果让你返回  算"打出"，触发 Ongoing
- 其他卡牌让你返回  不算"打出"，不触发 Ongoing
- 需要在事件中记录返回的原因

#### 6. +1战斗力指示物系统
- 需要在泰坦上存储+1指示物数量
- 计算总战斗力时需要加上指示物数量
- UI需要显示指示物数量
- 指示物不受能力取消影响


---

## 10. Big Funny Giant (快乐巨人)

### 基本信息
- **所属种族**: Tricksters (小精怪) - POD版本
- **中文名称**: 快乐巨人
- **英文名称**: Big Funny Giant
- **卡牌类型**: Titan (泰坦)
- **注意**: POD版泰坦FAQ尚未发布，以下FAQ参考自Boss Monster版本

### 能力描述

#### 特殊能力 1 (Special 1)
**英文原文**:
> Instead of your regular minion play, you may play this titan.

**中文翻译**:
> 代替你的常规随从打出，你可以打出本泰坦。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 代价：占用本回合的随从打出次数
- 效果：将泰坦打出到选定的基地上
- 特殊规则：
  - 打出泰坦不受随从打出位置限制（如 Ice Castle、Overrun）
  - 可以打出到任何基地（包括只有怪物的基地）

#### 持续能力 (Ongoing)
**英文原文**:
> After another player plays a minion here, they must discard a card. At the end of each other player's turn, if they do not have a minion here, you may place a +1 power counter on this titan.

**中文翻译**:
> 在另一名玩家在此处打出随从后，他们必须弃置一张卡牌。在每个其他玩家的回合结束时，如果他们在此处没有随从，你可以在本泰坦上放置一个+1战斗力指示物。

**实现要点**:
- 效果1：其他玩家在泰坦所在基地打出随从后，必须弃置一张手牌
  - 触发时机：其他玩家打出随从后
  - 强制效果：必须弃置（不是可选）
  - 特殊规则：
    - 打出 Argonaut（无论作为随从还是行动）都会触发
    - 如果手牌为空，无法弃置，但不影响随从打出
- 效果2：其他玩家回合结束时，如果他们在泰坦所在基地没有随从，可以放置+1指示物
  - 触发时机：其他玩家回合结束时（Phase 5）
  - 条件：该玩家在泰坦所在基地没有随从
  - 可选效果：可以选择不放置
  - 特殊规则：
    - 只检查该玩家是否有随从，不检查其他玩家
    - 未控制的怪物不算"其他玩家的随从"

#### 特殊能力 2 (Special 2)
**英文原文**:
> When this base scores, if you are the winner and at least one other player does not have a minion here, gain 1 VP.

**中文翻译**:
> 当本泰坦所在的基地计分时，如果你是赢家且至少有一名其他玩家在此处没有随从，获得1 VP。

**实现要点**:
- 触发时机：基地计分时
- 条件：
  - 你是该基地的赢家（获得第一名的VP）
  - 至少有一名其他玩家在该基地没有随从
- 效果：额外获得1 VP
- 特殊规则：
  - 只检查是否有随从，不检查战斗力
  - 未控制的怪物不算"其他玩家的随从"

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Big Funny Giant的第一个Special条件是"instead of your regular minion play"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"Instead of your regular minion play" means instead of the normal minion play allowed during your Play Cards phase; if used to play a non-minion card, no restriction on minion plays apply to that card play.**

#### 2. 打出泰坦不受随从位置限制
- Ice Castle、Overrun 等限制"只能在特定基地打出随从"
- 这些限制不适用于泰坦打出（打出的是泰坦，不是随从）
- 规则：**"Instead of your regular minion play" means instead of the normal minion play allowed during your Play Cards phase; if used to play a non-minion card, no restriction on minion plays apply to that card play.**

#### 3. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 4. 只有拥有者可以打出泰坦
- 即使对手未打出随从，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 5. 能力取消不移除指示物
- 如果 Big Funny Giant 的能力被取消，已放置的+1指示物不会被移除
- 放置指示物是确定性效果，不会因能力取消而撤销
- 规则：**Cancelling (or losing) an effect does not necessarily undo what it did.**

#### 6. 可以打出到只有怪物的基地
- 如果基地上所有怪物都是未控制的，可以打出泰坦（没有玩家的随从）
- 如果至少有一个怪物被控制，则不能打出（有玩家的随从）
- 规则：**"Your minion" means "a minion that you control".**
- 规则：**Uncontrolled monsters are not "other players' minions" for any players, but each player is "another player" to uncontrolled monsters.**

#### 7. 未控制的怪物与+1指示物
- 回合结束时，如果基地上只有未控制的怪物，可以放置+1指示物
- 如果至少有一个怪物被其他玩家控制，则不能放置
- 规则：**"Your minion" means "a minion that you control".**
- 规则：**Uncontrolled monsters are not "other players' minions" for any players, but each player is "another player" to uncontrolled monsters.**

#### 8. Argonaut 触发弃牌效果
- 打出 Argonaut（无论作为随从还是行动）都会触发弃牌效果
- Argonaut 是随从，打出它就是"打出随从"
- 规则：**Do exactly what the card says.**

#### 9. Special 2 的触发条件
- 必须是该基地的赢家（获得第一名的VP）
- 至少有一名其他玩家在该基地没有随从
- 两个条件都满足才能获得额外1 VP

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/tricksters_pod.ts
{
  defId: 'tricksters_pod_big_funny_giant',
  type: 'titan',
  name: 'Big Funny Giant',
  nameCN: '快乐巨人',
  power: 0,
  abilities: [
    'tricksters_pod_big_funny_giant_special1',
    'tricksters_pod_big_funny_giant_ongoing',
    'tricksters_pod_big_funny_giant_special2'
  ],
  atlasId: 'tricksters_pod_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special 1**: `tricksters_pod_big_funny_giant_special1`
   - 类型：主动能力（Phase 2）
   - 代价：占用本回合的随从打出次数
   - 交互：选择目标基地
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：
     - 检查并占用随从打出次数
     - 不受随从打出位置限制

2. **Ongoing**: `tricksters_pod_big_funny_giant_ongoing`
   - 类型：触发能力（两个触发条件）
   - 效果1：其他玩家在此处打出随从后，强制弃牌
     - 触发时机：`MINION_PLAYED` 事件后
     - 条件：随从打出在泰坦所在基地 && 打出者不是泰坦拥有者
     - 交互：选择要弃置的手牌
     - 效果：`CARD_DISCARDED` 事件
   - 效果2：其他玩家回合结束时，如果他们在此处没有随从，可以放置+1指示物
     - 触发时机：Phase 5（回合结束）
     - 条件：该玩家在泰坦所在基地没有随从
     - 交互：确认是否放置
     - 效果：`POWER_COUNTER_ADDED` 事件
   - 需要实现：
     - 监听 `MINION_PLAYED` 事件
     - 回合结束时检查每个其他玩家
     - 区分"控制的随从"和"未控制的怪物"

3. **Special 2**: `tricksters_pod_big_funny_giant_special2`
   - 类型：触发能力（基地计分时）
   - 条件：你是赢家 && 至少有一名其他玩家在此处没有随从
   - 效果：`VP_GAINED` 事件（+1 VP）
   - 需要实现：
     - 在计分时检查赢家
     - 检查每个其他玩家是否有随从
     - 额外VP不影响基地VP分配

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量）
- 能力按钮（使用现有框架）
- 弃牌选择UI（Ongoing效果1）
- 确认放置指示物UI（Ongoing效果2）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径
- [ ] POD版与Boss Monster版的能力差异（如有）

### 实现难点

#### 1. 打出泰坦占用随从打出次数
- Special 1 打出泰坦算作"打出随从"
- 需要检查并占用本回合的随从打出次数
- 打出后，本回合不能再打出其他随从

#### 2. 强制弃牌效果
- Ongoing 效果1是强制的，不是可选的
- 如果手牌为空，无法弃置，但不影响随从打出
- 需要在其他玩家打出随从后立即触发

#### 3. 回合结束时检查所有其他玩家
- Ongoing 效果2需要在每个其他玩家回合结束时触发
- 需要检查该玩家在泰坦所在基地是否有随从
- 可能同时触发多次（如果多个玩家都没有随从）

#### 4. 区分"控制的随从"和"未控制的怪物"
- 只有被玩家控制的随从才算"玩家的随从"
- 未控制的怪物不算任何玩家的随从
- 需要在检查时区分这两种情况

#### 5. Special 2 的额外VP
- 基地计分时，如果满足条件，额外获得1 VP
- 这个VP不影响基地VP分配（仍然按第一/二/三名分配）
- 需要在计分后添加额外VP

#### 6. 检查"至少一名其他玩家没有随从"
- 需要遍历所有其他玩家
- 检查每个玩家在该基地是否有随从
- 只要有一个玩家没有随从，就满足条件

#### 7. +1战斗力指示物系统
- 需要在泰坦上存储+1指示物数量
- 计算总战斗力时需要加上指示物数量
- UI需要显示指示物数量
- 指示物不受能力取消影响

### 潜在问题（POD版可能需要FAQ澄清）

#### 1. Ongoing 效果1的触发范围
- **问题**：如果其他玩家通过卡牌效果（如 Sprout）在泰坦基地打出随从，是否触发弃牌？
- **推测**：应该触发（"打出随从"不限制方式）
- **需要确认**：官方FAQ

#### 2. Ongoing 效果2的"回合结束"定义
- **问题**："回合结束"是指Phase 5还是Phase 4结束后？
- **推测**：应该是Phase 5（回合结束阶段）
- **需要确认**：官方FAQ

#### 3. Special 2 的"赢家"定义
- **问题**：如果多个玩家并列第一，都算赢家吗？
- **推测**：应该只有获得第一名VP的玩家算赢家
- **需要确认**：官方FAQ

#### 4. 未控制的怪物与Special 2
- **问题**：如果基地上只有未控制的怪物，算"其他玩家没有随从"吗？
- **推测**：应该算（未控制的怪物不是"其他玩家的随从"）
- **需要确认**：官方FAQ

#### 5. Ongoing 效果1与手牌为空
- **问题**：如果打出随从的玩家手牌为空，是否仍然可以打出随从？
- **推测**：应该可以（弃牌是后续效果，不是代价）
- **需要确认**：官方FAQ


## 11. Great Wolf Spirit (伟大狼灵)

### 基本信息
- **所属种族**: Werewolves (狼人)
- **中文名称**: 伟大狼灵
- **英文名称**: Great Wolf Spirit
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> On your turn, if you have the most power on two or more bases, you may play this titan on one of them.

**中文翻译**:
> 在你的回合中，如果你在两个或更多基地上拥有最高战斗力，你可以将本泰坦打出到其中一个基地上。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：在至少2个基地上拥有最高战斗力（平局也算）且每个基地至少有1点战斗力
- 效果：将泰坦打出到满足条件的基地之一
- 特殊规则：
  - 平局也算"拥有最高战斗力"
  - 必须在每个基地上至少有1点总战斗力（0战斗力不算）
  - 只能打出到满足条件的基地之一

#### 持续能力 (Ongoing)
**英文原文**:
> Your cards here may use their talents a second time on your turn.

**中文翻译**:
> 在你的回合中，你在此处的卡牌可以再使用一次它们的天赋能力。

**实现要点**:
- 持续生效：只要泰坦在场上就生效
- 效果：该基地上己方的所有卡牌（随从、行动、泰坦）可以额外使用一次天赋能力
- 适用范围：
  - 己方控制的所有卡牌（包括泰坦自己）
  - 只在己方回合的Phase 2生效
  - 如果卡牌有多个天赋，每个天赋都可以额外使用一次
- 特殊规则：
  - "During your turn"等同于"On your turn"，限制在Phase 2
  - 泰坦本身也是卡牌，可以使用自己的天赋两次
  - 与Standing Stones的交互：Standing Stones只允许"第二次"使用，不是"额外"使用

#### 回合开始能力 (At the start of your turn)
**英文原文**:
> At the start of your turn, you may move this titan to a base where you have more power than any other player.

**中文翻译**:
> 在你的回合开始时，你可以将本泰坦移动到一个你拥有比任何其他玩家更多战斗力的基地。

**实现要点**:
- 触发时机：回合开始阶段（Phase 1）
- 条件：存在至少一个基地，你的战斗力严格大于所有其他玩家
- 效果：移动泰坦到目标基地
- 可选能力：玩家可以选择不移动
- 特殊规则：
  - 必须是"严格大于"，平局不算
  - 如果移动到有其他泰坦的基地，会触发冲突（clash）

#### 天赋能力 (Talent)
**英文原文**:
> One of your minions gains +1 power until the end of the turn.

**中文翻译**:
> 你的一个随从获得+1战斗力直到回合结束。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 效果：选择己方的一个随从，给予+1战斗力buff
- 持续时间：直到回合结束
- 特殊规则：
  - 可以选择任何基地上的己方随从（不限于泰坦所在基地）
  - 由于Ongoing能力，可以使用两次，可以选择同一个随从或不同随从
  - 不能选择停滞（stasis）中的随从

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Great Wolf Spirit的条件是"On your turn"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 2. 平局也算"拥有最高战斗力"
- 如果你和其他玩家在某个基地上战斗力相同，且这是该基地的最高战斗力，你也算"拥有最高战斗力"
- 规则：**If a card refers to a superlative, e.g. "the highest power here", then ties for that superlative all count.**

#### 3. 必须至少有1点战斗力
- 即使你在某个基地上有0战斗力且是最高（其他玩家也是0），也不算"拥有最高战斗力"
- 必须至少有1点总战斗力才能满足条件
- 规则：**Do exactly what the card official answer says.**

#### 4. 泰坦也是卡牌
- 泰坦是一种卡牌类型（区别于随从、行动、基地）
- Great Wolf Spirit的Ongoing能力适用于"你的卡牌"，包括泰坦自己
- 因此泰坦可以使用自己的天赋两次
- 规则：**Titans are an additional type of card, distinct from minions, actions and bases.**

#### 5. 不能同时控制两个泰坦
- 如果你已经控制一个泰坦在场上，不能打出另一个泰坦
- 因此Great Wolf Spirit在场时，不能有其他泰坦在场
- 规则：**If you already control a titan in play, you can't play another one.**

#### 6. 天赋能力的多次使用
- 由于Ongoing能力，可以使用天赋两次
- 每次可以选择不同的随从，也可以选择同一个随从
- 规则：**If there are no limits, there are no limits.**

#### 7. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 8. "During your turn"等同于"On your turn"
- Ongoing能力中的"During your turn"限制在Phase 2
- 不是所有回合阶段都可以使用
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 9. 与Standing Stones的交互
- Standing Stones允许"使用天赋两次"（第二次）
- Great Wolf Spirit允许"额外使用一次"
- 正确顺序：先正常使用通过Standing Stones使用第二次通过Great Wolf Spirit额外使用第三次
- 错误顺序：先正常使用通过Great Wolf Spirit额外使用第二次无法通过Standing Stones使用（因为已经用了两次）
- 规则：**Do exactly what the card says.**

#### 10. 多个天赋的卡牌
- 如果卡牌有多个天赋（如Potion of Redundancy Potion），每个天赋都可以额外使用一次
- 规则：**Do exactly what the card says.**

#### 11. "你的卡牌"的定义
- "Your cards" = 你控制的卡牌（无论是否拥有）
- 只拥有但不控制的卡牌不是"你的"
- 天赋只能由控制者使用，且只能在Phase 2使用
- 规则：**"Your card" means "a card that you control".**
- 规则：**A card's talent can only be used by that card's controller.**

#### 12. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无随从），不能获得VP
- 如果泰坦有+1战斗力指示物，或在Kaiju Island上，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 13. 只有拥有者可以打出泰坦
- 即使对手在两个或更多基地上拥有最高战斗力，也不能打出对手的Great Wolf Spirit
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 14. 不能给停滞中的随从+1战斗力
- 停滞（stasis）中的卡牌不能被不明确提及停滞的能力影响
- 天赋能力不能选择停滞中的随从作为目标
- 规则：**Cards in stasis may not be affected by, or chosen as the target of, any ability that does not refer to stasis.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/werewolves.ts
{
  defId: 'werewolf_great_wolf_spirit',
  type: 'titan',
  name: 'Great Wolf Spirit',
  nameCN: '伟大狼灵',
  power: 0,
  abilities: [
    'werewolf_great_wolf_spirit_special',
    'werewolf_great_wolf_spirit_ongoing',
    'werewolf_great_wolf_spirit_turn_start',
    'werewolf_great_wolf_spirit_talent'
  ],
  atlasId: 'werewolf_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `werewolf_great_wolf_spirit_special`
   - 类型：主动能力（Phase 2）
   - 条件：在至少2个基地上拥有最高战斗力（平局也算）且每个基地至少有1点战斗力
   - 交互：选择满足条件的基地之一
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：
     - 检查所有基地的战斗力排名
     - 过滤出满足条件的基地（最高战斗力且1）
     - 计数满足条件的基地数量

2. **Ongoing**: `werewolf_great_wolf_spirit_ongoing`
   - 类型：持续能力（天赋使用次数修正）
   - 效果：该基地上己方卡牌的天赋可以额外使用一次
   - 需要实现：
     - 在天赋使用次数检查中添加泰坦加成
     - 只在己方Phase 2生效
     - 适用于所有类型的卡牌（随从、行动、泰坦）

3. **Turn Start**: `werewolf_great_wolf_spirit_turn_start`
   - 类型：自动触发（Phase 1）
   - 条件：存在至少一个基地，己方战斗力严格大于所有其他玩家
   - 交互：选择目标基地（可选）
   - 效果：`TITAN_MOVED` 事件
   - 需要实现：
     - Phase 1自动触发检查
     - 过滤出满足条件的基地（严格大于，不包括平局）
     - 可选能力（玩家可以选择不移动）

4. **Talent**: `werewolf_great_wolf_spirit_talent`
   - 类型：主动能力（玩家回合）
   - 交互：选择己方的一个随从（不能选择停滞中的）
   - 效果：`STATUS_APPLIED` 事件（+1战斗力，持续到回合结束）
   - 需要实现：
     - 回合结束时清理buff
     - 过滤掉停滞中的随从

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- 能力按钮（使用现有框架）
- 选择基地UI（Special和Turn Start能力）
- 选择随从UI（Talent能力，过滤停滞中的随从）
- 天赋使用次数显示（可选，用于调试）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

### 实现难点

#### 1. 检查"拥有最高战斗力"
- 需要遍历所有基地，检查每个基地的战斗力排名
- 平局也算"拥有最高战斗力"
- 必须至少有1点战斗力（0战斗力不算）
- 需要计数满足条件的基地数量（至少2个）

#### 2. 天赋使用次数修正
- Ongoing能力需要修改天赋使用次数限制
- 正常情况下每个天赋每回合只能使用1次
- 有Great Wolf Spirit时，该基地上的卡牌可以使用2次
- 需要在天赋使用次数检查中添加泰坦加成逻辑

#### 3. 与Standing Stones的交互
- Standing Stones允许"使用天赋两次"（第二次）
- Great Wolf Spirit允许"额外使用一次"
- 需要区分"第N次使用"和"额外使用"
- 可能需要在天赋使用计数中添加"使用类型"标记

#### 4. Phase 1自动触发
- Turn Start能力在Phase 1自动触发
- 需要检查是否有满足条件的基地
- 可选能力：玩家可以选择不移动
- 需要在Phase 1添加自动触发检查逻辑

#### 5. 严格大于vs平局
- Special能力：平局也算"拥有最高战斗力"
- Turn Start能力：必须严格大于（平局不算）
- 需要在战斗力比较中区分这两种情况

#### 6. 多个天赋的卡牌
- 如果卡牌有多个天赋，每个天赋都可以额外使用一次
- 需要分别跟踪每个天赋的使用次数
- 可能需要扩展天赋使用计数器结构

#### 7. 停滞中的随从过滤
- Talent能力不能选择停滞中的随从
- 需要在目标选择时过滤掉停滞中的随从
- 需要检查随从的停滞状态


## 12. The Bride (怪人的新娘)

### 基本信息
- **所属种族**: Mad Scientists (疯狂科学家)
- **中文名称**: 怪人的新娘
- **英文名称**: The Bride
- **卡牌类型**: Titan (泰坦)

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> At the start of your turn, you may choose two effects and do them in any order to different minions to play this titan:
>  Place a minion you own from your hand or discard pile into the box.
>  Destroy one of your minions.
>  Remove a +1 power counter from one of your minions.

**中文翻译**:
> 在你的回合开始时，你可以选择两个效果并以任意顺序对不同的随从执行，以打出本泰坦：
>  将你拥有的一个随从从手牌或弃牌堆放入盒子中。
>  消灭你的一个随从。
>  从你的一个随从上移除一个+1战斗力指示物。

**实现要点**:
- 触发时机：回合开始阶段（Phase 1）
- 前置条件：必须能够完成两个不同的效果
- 效果选择：从3个效果中选择2个，按任意顺序执行
- 目标限制：两个效果必须作用于不同的随从
- 效果：`TITAN_PLAYED` 事件
- 特殊规则：
  - 必须选择两个不同的效果（不能选择同一个效果两次）
  - 两个效果必须作用于不同的随从（物理上不同的卡牌）
  - 如果任一效果无法完成，则不能打出泰坦
  - 不能选择停滞中的随从作为目标
  - "你拥有的随从"指的是你拥有的卡牌（无论是否控制）
  - "你的随从"指的是你控制的随从（无论是否拥有）

#### 持续能力 (Ongoing)
**英文原文**:
> Once per turn, after you place or remove a power counter on your minions, draw a card.

**中文翻译**:
> 每回合一次，在你在你的随从上放置或移除战斗力指示物后，抽一张卡牌。

**实现要点**:
- 触发时机：在己方随从上放置或移除+1战斗力指示物后
- 频率限制：每回合一次
- 效果：抽一张卡牌
- 特殊规则：
  - 只有己方随从上的指示物变化才会触发
  - 放置和移除都会触发（任一种）
  - 抽牌后可能超过10张手牌，等到己方"抽2张牌"阶段再弃牌

#### 天赋能力 (Talent)
**英文原文**:
> Place a +1 power counter on one of your minions here OR remove two +1 power counters total from your minions to play an extra action.

**中文翻译**:
> 在此处你的一个随从上放置一个+1战斗力指示物，或者从你的随从上总共移除两个+1战斗力指示物以打出一个额外行动。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 效果：二选一
  - 选项1：在泰坦所在基地的己方随从上放置一个+1指示物
  - 选项2：从己方随从上总共移除2个+1指示物，打出一个额外行动
- 特殊规则：
  - 选项1限制在泰坦所在基地
  - 选项2可以从任何基地的己方随从上移除指示物（可以从同一个随从移除2个，或从不同随从各移除1个）
  - 额外行动不占用本回合的行动打出次数

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- The Bride的条件是"At the start of your turn"，限制在Phase 1
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"At the start of your turn" means "during the Start Turn (phase 1) of each of your turns".**

#### 2. "你的随从"vs"你拥有的随从"
- "Your minions" = 你控制的随从（无论是否拥有）
- "A minion you own" = 你拥有的随从（无论是否控制）
- Special能力中"放入盒子"使用"你拥有的随从"，其他效果使用"你的随从"
- 规则：**"Your minion" means "a minion that you control".**

#### 3. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无随从），不能获得VP
- 如果泰坦有+1战斗力指示物，或在Kaiju Island上，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 4. Ongoing能力抽牌后的手牌上限
- 使用Ongoing能力抽牌后，可能导致手牌超过10张
- 不需要立即弃牌
- 等到下一个**己方**"抽2张牌"阶段，先抽2张，然后弃牌至10张
- 规则：**You wait until your Draw 2 Cards phase to discard down to 10; if your hand is bigger than 10 at other times of the game, that's okay.**

#### 5. 必须选择两个不同的效果
- 不能选择同一个效果两次
- 必须从3个效果中选择2个不同的效果
- 规则：**Do exactly what the card says.**

#### 6. 两个效果必须作用于不同的随从
- 消灭的随从和放入盒子的随从必须是不同的卡牌
- 消灭的随从和移除指示物的随从必须是不同的卡牌
- 放入盒子的随从和移除指示物的随从必须是不同的卡牌
- 规则：**Do exactly what the card says.**

#### 7. 效果无法完成则不能打出泰坦
- 如果选择的任一效果无法完成，则不能打出泰坦
- 例如：选择"消灭随从"但目标随从不能被消灭，则不能打出泰坦
- 不能"尝试失败"然后执行另一个效果
- 规则：**When a card says "Do X to do Y" or "You may do X to do Y", if effect "X" cannot be done completely for any reason, you can't do either "X" or "Y".**

#### 8. 与Igor的交互
- 不能消灭Igor，然后在解决The Bride能力的过程中放置Igor的指示物并移除它
- Igor的能力在The Bride的Special能力完全解决后才触发
- 规则：**When a card says "After X, do Y", you need "X" to happen and be resolved completely before you do the effect stated as "Y".**
- 规则：**Check the Card Resolution Order.**

#### 9. 不能消灭停滞中的随从
- 停滞（stasis）中的卡牌不能被不明确提及停滞的能力影响
- Special能力不能选择停滞中的随从作为目标
- 规则：**Cards in stasis may not be affected by, or chosen as the target of, any ability that does not refer to stasis.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/mad_scientists.ts
{
  defId: 'mad_scientist_the_bride',
  type: 'titan',
  name: 'The Bride',
  nameCN: '怪人的新娘',
  power: 0,
  abilities: [
    'mad_scientist_the_bride_special',
    'mad_scientist_the_bride_ongoing',
    'mad_scientist_the_bride_talent'
  ],
  atlasId: 'mad_scientist_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `mad_scientist_the_bride_special`
   - 类型：主动能力（Phase 1）
   - 条件：能够完成两个不同的效果
   - 交互：
     - 选择2个效果（从3个中选择）
     - 选择执行顺序
     - 为每个效果选择目标随从（必须不同）
   - 效果：
     - 效果1：`MINION_PLACED_IN_BOX` 事件（从手牌或弃牌堆）
     - 效果2：`MINION_DESTROYED` 事件
     - 效果3：`POWER_COUNTER_REMOVED` 事件
     - 最终：`TITAN_PLAYED` 事件
   - 需要实现：
     - 效果选择UI（3选2）
     - 顺序选择UI
     - 目标随从选择UI（每个效果独立选择）
     - 验证两个目标随从不同
     - 验证每个效果都能完成

2. **Ongoing**: `mad_scientist_the_bride_ongoing`
   - 类型：触发能力（指示物变化后）
   - 条件：己方随从上放置或移除+1指示物
   - 频率：每回合一次
   - 效果：`CARD_DRAWN` 事件
   - 需要实现：
     - 监听 `POWER_COUNTER_ADDED` 和 `POWER_COUNTER_REMOVED` 事件
     - 检查目标是否为己方随从
     - 回合内使用次数计数器

3. **Talent**: `mad_scientist_the_bride_talent`
   - 类型：主动能力（玩家回合）
   - 交互：选择选项1或选项2
     - 选项1：选择泰坦所在基地的己方随从
     - 选项2：选择要移除指示物的随从（总共2个指示物）
   - 效果：
     - 选项1：`POWER_COUNTER_ADDED` 事件
     - 选项2：`POWER_COUNTER_REMOVED` 事件（可能多次）+ `ACTION_PLAYED` 事件（额外行动）
   - 需要实现：
     - 选项选择UI
     - 选项1：过滤泰坦所在基地的己方随从
     - 选项2：选择要移除指示物的随从（可以从同一个随从移除2个，或从不同随从各移除1个）

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- 能力按钮（使用现有框架）
- Special能力UI：
  - 效果选择（3选2）
  - 顺序选择
  - 目标随从选择（每个效果独立）
- Talent能力UI：
  - 选项选择（放置指示物 vs 移除指示物+打出行动）
  - 随从选择
  - 行动选择（选项2）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径

### 实现难点

#### 1. Special能力的复杂交互
- 需要选择2个效果（从3个中选择）
- 需要选择执行顺序
- 需要为每个效果选择目标随从（必须不同）
- 需要验证每个效果都能完成
- UI需要支持多步骤交互

#### 2. 效果完成性验证
- 在选择效果前，需要验证每个效果是否能完成
- 例如：如果没有随从有+1指示物，则不能选择"移除指示物"效果
- 如果没有随从可以被消灭，则不能选择"消灭随从"效果
- 需要在UI中禁用无法完成的效果

#### 3. "你拥有的随从"vs"你的随从"
- "放入盒子"效果使用"你拥有的随从"（可以是不控制的）
- 其他效果使用"你的随从"（必须控制）
- 需要在目标选择时区分这两种情况

#### 4. Ongoing能力的触发条件
- 需要监听指示物变化事件
- 需要检查目标是否为己方随从
- 需要区分"放置"和"移除"（都会触发）
- 每回合只能触发一次

#### 5. Talent能力的选项2
- 需要从己方随从上总共移除2个+1指示物
- 可以从同一个随从移除2个，或从不同随从各移除1个
- 需要UI支持"选择N个指示物"的交互
- 移除指示物后，打出一个额外行动

#### 6. Phase 1触发
- Special能力在Phase 1触发
- 需要在Phase 1添加自动触发检查逻辑
- 可选能力：玩家可以选择不使用

#### 7. 与Igor等"after destroy"能力的交互
- Igor的能力在The Bride的Special能力完全解决后才触发
- 不能在解决The Bride能力的过程中使用Igor的指示物
- 需要确保事件解决顺序正确


---

## 13. Ancient Lord (古代领主)

### 基本信息
- **所属种族**: Vampires (吸血鬼) - POD版本
- **中文名称**: 古代领主
- **英文名称**: Ancient Lord
- **卡牌类型**: Titan (泰坦)
- **注意**: POD版泰坦FAQ尚未发布，以下FAQ参考自Boss Monster版本

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> After you place +1 power counters on your minions, you may place one of those counters on this titan instead. If this titan has three or more counters on it, you may play it.

**中文翻译**:
> 在你给你的随从放置+1战斗力指示物后，你可以将其中一个指示物改为放置在本泰坦上。如果本泰坦上有3个或更多指示物，你可以打出本泰坦。

**实现要点**:
- 触发时机：给己方随从放置+1战斗力指示物后
- 效果1：可以将其中一个指示物改为放置在泰坦上（泰坦区域）
- 效果2：如果泰坦上有至少3个指示物，可以打出泰坦
- 特殊规则：
  - 必须是"放置"指示物，不包括其他方式获得指示物
  - 可以在任何玩家的回合触发（只要你放置了指示物）
  - 打出泰坦时保留所有指示物

#### 持续能力 (Ongoing)
**英文原文**:
> After you play a card here that did not have a +1 power counter on it, place a +1 power counter on it.

**中文翻译**:
> 在你在此处打出一张没有+1战斗力指示物的卡牌后，在其上放置一个+1战斗力指示物。

**实现要点**:
- 触发时机：在泰坦所在基地打出卡牌后
- 条件：打出的卡牌上没有+1战斗力指示物
- 效果：在该卡牌上放置一个+1战斗力指示物
- 适用范围：所有类型的卡牌（随从、行动、泰坦）
- 特殊规则：
  - 只检查打出时是否有指示物，不检查打出前
  - 如果卡牌打出时已经有指示物（如从弃牌堆打出），不触发
  - 泰坦本身打出时也会触发（如果没有指示物）

#### 天赋能力 (Talent)
**英文原文**:
> Place a +1 power counter on one of your minions here that already has one.

**中文翻译**:
> 在此处一个已经有+1战斗力指示物的己方随从上放置一个+1战斗力指示物。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 前置条件：泰坦所在基地上至少有一个己方随从已经有+1指示物
- 效果：在目标随从上放置一个+1战斗力指示物
- 特殊规则：
  - 只能选择已经有指示物的随从
  - 只能选择泰坦所在基地的随从

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Ancient Lord的条件是"after you place +1 power counters"
- 可以在任何玩家的回合触发，只要你放置了指示物
- 规则：**A Special ability will describe how it can be used.**

#### 2. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 3. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 4. 只有拥有者可以打出泰坦
- 即使对手放置了指示物，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 5. 能力取消不移除指示物
- 如果 Ancient Lord 的能力被取消，已放置的+1指示物不会被移除
- 放置指示物是确定性效果，不会因能力取消而撤销
- 规则：**Cancelling (or losing) an effect does not necessarily undo what it did.**

#### 6. 打出泰坦时保留指示物
- 打出泰坦时，泰坦上的所有+1指示物都保留
- 不会因为打出而移除指示物
- 规则：**Do exactly what the card says.**

#### 7. Ongoing能力的触发条件
- 只有在泰坦所在基地打出卡牌才会触发
- 只有打出时没有+1指示物的卡牌才会触发
- 如果卡牌打出时已经有指示物（如从弃牌堆打出），不触发
- 规则：**Do exactly what the card says.**

#### 8. 天赋能力的目标限制
- 只能选择泰坦所在基地的随从
- 只能选择已经有+1指示物的随从
- 规则：**Do exactly what the card says.**

#### 9. Special能力的"改为放置"
- 当你给随从放置指示物时，可以选择将其中一个改为放置在泰坦上
- 这不是"额外"放置，而是"改为"放置
- 例如：你给随从放置2个指示物，可以选择1个放在泰坦上，1个放在随从上
- 规则：**Do exactly what the card says.**

#### 10. 不在场上时累积指示物
- Special能力在泰坦不在场上时也会触发
- 指示物累积在泰坦卡牌上（在泰坦区域）
- 即使泰坦不在场上，指示物也会累积
- 这是Ancient Lord的独特机制

#### 11. 打出泰坦的时机
- 当泰坦上有至少3个指示物时，可以打出泰坦
- 可以在任何玩家的回合打出（只要满足条件）
- 打出泰坦不占用随从或行动打出次数
- 规则：**If there are no limits, there are no limits.**

#### 12. Ongoing能力与泰坦本身
- 泰坦本身也是卡牌
- 如果泰坦打出时没有指示物，会触发Ongoing能力
- 但通常泰坦打出时已经有至少3个指示物，所以不会触发
- 规则：**Titans are an additional type of card, distinct from minions, actions and bases.**

#### 13. 天赋能力触发Special能力
- 使用天赋能力放置指示物后，会触发Special能力
- 可以将天赋放置的指示物改为放置在泰坦上
- 这可能导致泰坦上的指示物数量增加，但不会立即打出泰坦（需要再次满足条件）
- 规则：**Do exactly what the card says.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/vampires_pod.ts
{
  defId: 'vampires_pod_ancient_lord',
  type: 'titan',
  name: 'Ancient Lord',
  nameCN: '古代领主',
  power: 0,
  abilities: [
    'vampires_pod_ancient_lord_special',
    'vampires_pod_ancient_lord_ongoing',
    'vampires_pod_ancient_lord_talent'
  ],
  atlasId: 'vampires_pod_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `vampires_pod_ancient_lord_special`
   - 类型：触发能力（放置指示物后）
   - 触发时机：给己方随从放置+1指示物后
   - 交互：选择是否将其中一个指示物改为放置在泰坦上
   - 效果：
     - `POWER_COUNTER_MOVED` 事件（从随从移动到泰坦）
     - 如果泰坦上有至少3个指示物，可以打出泰坦（`TITAN_PLAYED` 事件）
   - 需要实现：
     - 监听所有放置指示物的事件
     - 在泰坦区域存储指示物数量（即使泰坦不在场上）
     - 打出泰坦时保留所有指示物

2. **Ongoing**: `vampires_pod_ancient_lord_ongoing`
   - 类型：触发能力（打出卡牌后）
   - 条件：在泰坦所在基地打出卡牌 && 该卡牌上没有+1指示物
   - 效果：`POWER_COUNTER_ADDED` 事件（在打出的卡牌上）
   - 需要实现：
     - 监听 `CARD_PLAYED` / `MINION_PLAYED` / `ACTION_PLAYED` 事件
     - 检查打出的卡牌是否在泰坦所在基地
     - 检查打出的卡牌是否有指示物

3. **Talent**: `vampires_pod_ancient_lord_talent`
   - 类型：主动能力（玩家回合）
   - 前置条件：泰坦所在基地上至少有一个己方随从已经有+1指示物
   - 交互：选择目标随从（必须已经有指示物）
   - 效果：`POWER_COUNTER_ADDED` 事件（在目标随从上）

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量，即使不在场上）
- 能力按钮（使用现有框架）
- 选择是否改为放置在泰坦上UI（Special能力）
- 选择随从UI（Talent能力，过滤没有指示物的随从）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径
- [ ] POD版与Boss Monster版的能力差异（如有）

### 实现难点

#### 1. 不在场上时累积指示物
- 泰坦不在场上时，指示物仍然累积在泰坦卡牌上
- 需要在泰坦区域（`titanZone`）存储指示物数量
- UI需要显示泰坦区域中泰坦的指示物数量（即使不在场上）

#### 2. 监听所有放置指示物的事件
- Special能力需要监听所有给己方随从放置指示物的事件
- 可能来自多种来源：天赋能力、行动卡、其他随从能力等
- 需要在所有放置指示物的地方触发检查

#### 3. "改为放置"的实现
- 当给随从放置指示物时，可以选择将其中一个改为放置在泰坦上
- 这不是"额外"放置，而是"改为"放置
- 需要在放置指示物后立即触发交互，让玩家选择

#### 4. 打出泰坦的时机
- 当泰坦上有至少3个指示物时，可以打出泰坦
- 可以在任何玩家的回合打出（只要满足条件）
- 打出泰坦不占用随从或行动打出次数
- 需要在指示物数量达到3时立即提示玩家

#### 5. Ongoing能力的触发条件
- 只有在泰坦所在基地打出卡牌才会触发
- 只有打出时没有+1指示物的卡牌才会触发
- 需要检查卡牌打出时的指示物状态（不是打出前）

#### 6. 天赋能力的目标过滤
- 只能选择泰坦所在基地的随从
- 只能选择已经有+1指示物的随从
- 需要在目标选择时过滤

#### 7. +1战斗力指示物系统
- 需要在泰坦和随从上存储+1指示物数量
- 计算总战斗力时需要加上指示物数量
- UI需要显示指示物数量
- 指示物不受能力取消影响

### 潜在问题（POD版可能需要FAQ澄清）

#### 1. Special能力的"改为放置"范围
- **问题**：如果一次性给多个随从放置指示物（如Augmentation），可以将多个指示物改为放置在泰坦上吗？
- **推测**：应该只能改为放置一个（"one of those counters"）
- **需要确认**：官方FAQ

#### 2. Ongoing能力的"没有指示物"定义
- **问题**："没有指示物"是指打出时没有，还是打出前没有？
- **推测**：应该是打出时没有（检查打出后的状态）
- **需要确认**：官方FAQ

#### 3. 打出泰坦的时机限制
- **问题**：可以在任何玩家的回合打出泰坦吗？还是只能在己方回合？
- **推测**：应该可以在任何玩家的回合打出（"you may play it"没有时机限制）
- **需要确认**：官方FAQ

#### 4. 天赋能力触发Special能力的循环
- **问题**：使用天赋能力放置指示物后，触发Special能力，可以将天赋放置的指示物改为放置在泰坦上吗？
- **推测**：应该可以（"after you place +1 power counters"包括天赋能力）
- **需要确认**：官方FAQ


---

## 14. Death on Six Legs (六足死神)

### 基本信息
- **所属种族**: Giant Ants (巨蚁)
- **中文名称**: 六足死神
- **英文名称**: Death on Six Legs
- **卡牌类型**: Titan (泰坦)
- **注意**: 以下FAQ参考自老版本，新版可能有差异

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> On your turn, if there are six or more +1 power counters on your minions, you may discard a card to play this titan.

**中文翻译**:
> 在你的回合中，如果你的随从上有6个或更多+1战斗力指示物，你可以弃置一张卡牌，打出本泰坦。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：己方所有随从上的+1指示物总数 ≥ 6
- 代价：弃置一张手牌
- 效果：将泰坦打出到选定的基地上
- 特殊规则：
  - 只计算随从上的指示物，不计算行动卡或其他卡牌上的指示物
  - 必须在Phase 2使用

#### 持续能力 (Ongoing)
**英文原文**:
> Before a minion goes to the discard pile, you may transfer one of its +1 power counters to this titan.

**中文翻译**:
> 在一个随从进入弃牌堆前，你可以将其上的一个+1战斗力指示物转移到本泰坦上。

**实现要点**:
- 触发时机：任何随从进入弃牌堆前（包括己方和对手的）
- 条件：该随从上有至少一个+1战斗力指示物
- 效果：将该随从上的一个+1指示物转移到泰坦上
- 可选能力：玩家可以选择不转移
- 特殊规则：
  - 可以从对手的随从上"偷取"指示物
  - 如果随从有多个指示物，只能转移一个
  - 每个随从离场只触发一次（不是每个指示物触发一次）

#### 天赋能力 (Talent)
**英文原文**:
> Play an extra action.

**中文翻译**:
> 打出一个额外行动。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 前置条件：手牌中至少有一个行动卡
- 效果：打出一个额外行动（不占用本回合的行动打出次数）
- 特殊规则：
  - 额外打出，不占用本回合的行动打出次数
  - 可以打出到任何基地（如果行动需要选择基地）

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Death on Six Legs的条件是"On your turn"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 2. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 3. 只计算随从上的指示物
- Special能力只计算随从上的+1指示物
- 行动卡（如Summon Wolves）上的指示物不计入
- 规则：**Specific words are not synonymous no matter how similar they seem.**

#### 4. 可以从对手随从上"偷取"指示物
- Ongoing能力适用于所有随从（包括对手的）
- 当对手的随从进入弃牌堆时，可以转移其上的指示物到泰坦上
- 这不是错误，是设计意图
- 规则：**If there are no limits, there are no limits.**

#### 5. 每个随从只转移一个指示物
- 如果随从有多个+1指示物，只能转移一个
- 不是"转移所有指示物"
- 规则：**When an ability is triggered, it's resolved once per trigger.**

#### 6. 基地计分时泰坦的处理
- 泰坦留在基地上直到弃牌步骤
- 所有卡牌同时被弃置时，泰坦被移除（set aside）
- 泰坦上的所有+1战斗力指示物被移除
- 规则：**During the Score Bases step where the cards are discarded, all the cards on the scored base are discarded simultaneously.**
- 规则：**If, for whatever reasons, a titan must leave play, it's actually set aside near its owner's deck and any +1 power counters on it are removed.**

#### 7. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 8. 只有拥有者可以打出泰坦
- 即使对手的随从上有6个或更多指示物，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 9. 能力取消不移除指示物
- 如果Death on Six Legs的能力被取消，已转移的+1指示物不会被移除
- 转移指示物是确定性效果，不会因能力取消而撤销
- 规则：**Cancelling (or losing) an effect does not necessarily undo what it did.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/giant_ants.ts
{
  defId: 'giant_ants_death_on_six_legs',
  type: 'titan',
  name: 'Death on Six Legs',
  nameCN: '六足死神',
  power: 0,
  abilities: [
    'giant_ants_death_on_six_legs_special',
    'giant_ants_death_on_six_legs_ongoing',
    'giant_ants_death_on_six_legs_talent'
  ],
  atlasId: 'giant_ants_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `giant_ants_death_on_six_legs_special`
   - 类型：主动能力（Phase 2）
   - 条件：己方所有随从上的+1指示物总数 ≥ 6
   - 代价：弃置一张手牌
   - 交互：选择要弃置的手牌 + 选择目标基地
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：
     - 统计所有己方随从上的+1指示物总数
     - 只计算随从，不计算行动卡
     - 弃牌后打出泰坦

2. **Ongoing**: `giant_ants_death_on_six_legs_ongoing`
   - 类型：触发能力（随从进入弃牌堆前）
   - 条件：随从上有至少一个+1战斗力指示物
   - 交互：选择是否转移指示物
   - 效果：`POWER_COUNTER_TRANSFERRED` 事件（从随从转移到泰坦）
   - 需要实现：
     - 监听所有随从进入弃牌堆的事件
     - 在弃牌前触发（before事件）
     - 适用于所有玩家的随从（包括对手）
     - 每个随从只转移一个指示物

3. **Talent**: `giant_ants_death_on_six_legs_talent`
   - 类型：主动能力（玩家回合）
   - 前置条件：手牌中至少有一个行动卡
   - 交互：选择要打出的行动卡
   - 效果：`ACTION_PLAYED` 事件（额外打出）
   - 需要实现：
     - 额外打出，不占用本回合的行动打出次数
     - 可以打出到任何基地

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量）
- 能力按钮（使用现有框架）
- 弃牌选择UI（Special能力）
- 确认转移指示物UI（Ongoing能力）
- 选择行动卡UI（Talent能力）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径
- [ ] 新版与老版的能力差异（如有）

### 实现难点

#### 1. 统计所有随从上的指示物总数
- Special能力需要统计所有己方随从上的+1指示物总数
- 需要遍历所有基地上的己方随从
- 只计算随从，不计算行动卡或其他卡牌
- 需要实时更新（随从进入/离开、指示物增加/减少时）

#### 2. 随从进入弃牌堆前触发
- Ongoing能力需要在随从进入弃牌堆前触发
- 这是一个"before"事件，需要在弃牌前拦截
- 需要在所有弃牌场景触发（基地计分、消灭、返回手牌等）
- 需要确保指示物转移后，随从才进入弃牌堆

#### 3. 从对手随从上"偷取"指示物
- Ongoing能力适用于所有玩家的随从
- 当对手的随从进入弃牌堆时，也可以转移指示物
- 需要在UI中明确显示"偷取"操作
- 可能需要特殊的动画效果

#### 4. 每个随从只转移一个指示物
- 如果随从有多个指示物，只能转移一个
- 需要在触发时限制转移数量
- 不能因为有多个指示物就触发多次

#### 5. 基地计分时的时序
- 基地计分时，所有卡牌同时进入弃牌堆
- 需要在弃牌前依次触发每个随从的Ongoing能力
- 需要确保泰坦的Ongoing能力在泰坦本身被弃置前触发

#### 6. 额外打出行动
- Talent能力打出的行动不占用本回合的行动打出次数
- 需要区分"正常打出"和"额外打出"
- 可能需要扩展`ACTION_PLAYED`事件，添加`isExtra`标志

#### 7. +1战斗力指示物系统
- 需要在泰坦和随从上存储+1指示物数量
- 计算总战斗力时需要加上指示物数量
- UI需要显示指示物数量
- 指示物不受能力取消影响

### 潜在问题（新版可能需要FAQ澄清）

#### 1. Ongoing能力的触发范围
- **问题**：如果多个随从同时进入弃牌堆（如基地计分），可以从每个随从上转移一个指示物吗？
- **推测**：应该可以（每个随从触发一次）
- **需要确认**：官方FAQ

#### 2. 随从被消灭vs返回手牌
- **问题**：随从返回手牌时，算"进入弃牌堆"吗？
- **推测**：不算（返回手牌不是进入弃牌堆）
- **需要确认**：官方FAQ

#### 3. 随从被埋藏到基地下
- **问题**：随从被埋藏到基地下时，算"进入弃牌堆"吗？
- **推测**：不算（埋藏不是进入弃牌堆）
- **需要确认**：官方FAQ

#### 4. 泰坦本身被弃置时
- **问题**：泰坦本身被弃置时，可以从其他随从上转移指示物到泰坦上吗？
- **推测**：应该不可以（泰坦已经离场，能力失效）
- **需要确认**：官方FAQ


---

## 14. Death on Six Legs (六足死神)

### 基本信息
- **所属种族**: Giant Ants (巨蚁)
- **中文名称**: 六足死神
- **英文名称**: Death on Six Legs
- **卡牌类型**: Titan (泰坦)
- **注意**: 以下FAQ参考自老版本，新版可能有差异

### 能力描述

#### 特殊能力 (Special)
**英文原文**:
> On your turn, if there are six or more +1 power counters on your minions, you may discard a card to play this titan.

**中文翻译**:
> 在你的回合中，如果你的随从上有6个或更多+1战斗力指示物，你可以弃置一张卡牌，打出本泰坦。

**实现要点**:
- 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
- 前置条件：己方所有随从上的+1指示物总数 ≥ 6
- 代价：弃置一张手牌
- 效果：将泰坦打出到选定的基地上
- 特殊规则：
  - 只计算随从上的指示物，不计算行动卡或其他卡牌上的指示物
  - 必须在Phase 2使用

#### 持续能力 (Ongoing)
**英文原文**:
> Before a minion goes to the discard pile, you may transfer one of its +1 power counters to this titan.

**中文翻译**:
> 在一个随从进入弃牌堆前，你可以将其上的一个+1战斗力指示物转移到本泰坦上。

**实现要点**:
- 触发时机：任何随从进入弃牌堆前（包括己方和对手的）
- 条件：该随从上有至少一个+1战斗力指示物
- 效果：将该随从上的一个+1指示物转移到泰坦上
- 可选能力：玩家可以选择不转移
- 特殊规则：
  - 可以从对手的随从上"偷取"指示物
  - 如果随从有多个指示物，只能转移一个
  - 每个随从离场只触发一次（不是每个指示物触发一次）

#### 天赋能力 (Talent)
**英文原文**:
> Play an extra action.

**中文翻译**:
> 打出一个额外行动。

**实现要点**:
- 主动能力：玩家可以在自己回合使用
- 前置条件：手牌中至少有一个行动卡
- 效果：打出一个额外行动（不占用本回合的行动打出次数）
- 特殊规则：
  - 额外打出，不占用本回合的行动打出次数
  - 可以打出到任何基地（如果行动需要选择基地）

### FAQ 规则要点

#### 1. "Special"不代表可以在任何时候使用
- Special只是表示"当条件满足时可以使用的能力"
- Death on Six Legs的条件是"On your turn"，限制在Phase 2
- 规则：**A Special ability will describe how it can be used.**
- 规则：**"On your turn" means "during the Play Cards (phase 2) of each of your turns".**

#### 2. "你的随从"的定义
- "Your minions" = 你控制的随从（无论是否拥有）
- 只拥有但不控制的随从不是"你的"
- 规则：**"Your minion" means "a minion that you control".**

#### 3. 只计算随从上的指示物
- Special能力只计算随从上的+1指示物
- 行动卡（如Summon Wolves）上的指示物不计入
- 规则：**Specific words are not synonymous no matter how similar they seem.**

#### 4. 可以从对手随从上"偷取"指示物
- Ongoing能力适用于所有随从（包括对手的）
- 当对手的随从进入弃牌堆时，可以转移其上的指示物到泰坦上
- 这不是错误，是设计意图
- 规则：**If there are no limits, there are no limits.**

#### 5. 每个随从只转移一个指示物
- 如果随从有多个+1指示物，只能转移一个
- 不是"转移所有指示物"
- 规则：**When an ability is triggered, it's resolved once per trigger.**

#### 6. 基地计分时泰坦的处理
- 泰坦留在基地上直到弃牌步骤
- 所有卡牌同时被弃置时，泰坦被移除（set aside）
- 泰坦上的所有+1战斗力指示物被移除
- 规则：**During the Score Bases step where the cards are discarded, all the cards on the scored base are discarded simultaneously.**
- 规则：**If, for whatever reasons, a titan must leave play, it's actually set aside near its owner's deck and any +1 power counters on it are removed.**

#### 7. 泰坦与VP资格
- 泰坦不是随从
- 要获得VP，必须有至少一个随从或至少1点总战斗力
- 如果只有泰坦（0战斗力，无+1指示物），不能获得VP
- 如果泰坦有+1战斗力指示物，则有总战斗力，可以获得VP
- 规则：**A player must have at least one minion or 1 total power on a base to be eligible to receive its VP reward.**

#### 8. 只有拥有者可以打出泰坦
- 即使对手的随从上有6个或更多指示物，也不能打出对手的泰坦
- 只有泰坦的拥有者可以打出它
- 规则：**Playable Special cards can only be played by their current possessor.**

#### 9. 能力取消不移除指示物
- 如果Death on Six Legs的能力被取消，已转移的+1指示物不会被移除
- 转移指示物是确定性效果，不会因能力取消而撤销
- 规则：**Cancelling (or losing) an effect does not necessarily undo what it did.**

### 实现计划

#### 数据定义 (Task 14)
```typescript
// src/games/smashup/data/factions/giant_ants.ts
{
  defId: 'giant_ants_death_on_six_legs',
  type: 'titan',
  name: 'Death on Six Legs',
  nameCN: '六足死神',
  power: 0,
  abilities: [
    'giant_ants_death_on_six_legs_special',
    'giant_ants_death_on_six_legs_ongoing',
    'giant_ants_death_on_six_legs_talent'
  ],
  atlasId: 'giant_ants_cards',
  atlasIndex: 0,
}
```

#### 能力定义 (Task 15)
1. **Special**: `giant_ants_death_on_six_legs_special`
   - 类型：主动能力（Phase 2）
   - 条件：己方所有随从上的+1指示物总数 ≥ 6
   - 代价：弃置一张手牌
   - 交互：选择要弃置的手牌 + 选择目标基地
   - 效果：`TITAN_PLAYED` 事件
   - 需要实现：
     - 统计所有己方随从上的+1指示物总数
     - 只计算随从，不计算行动卡
     - 弃牌后打出泰坦

2. **Ongoing**: `giant_ants_death_on_six_legs_ongoing`
   - 类型：触发能力（随从进入弃牌堆前）
   - 条件：随从上有至少一个+1战斗力指示物
   - 交互：选择是否转移指示物
   - 效果：`POWER_COUNTER_TRANSFERRED` 事件（从随从转移到泰坦）
   - 需要实现：
     - 监听所有随从进入弃牌堆的事件
     - 在弃牌前触发（before事件）
     - 适用于所有玩家的随从（包括对手）
     - 每个随从只转移一个指示物

3. **Talent**: `giant_ants_death_on_six_legs_talent`
   - 类型：主动能力（玩家回合）
   - 前置条件：手牌中至少有一个行动卡
   - 交互：选择要打出的行动卡
   - 效果：`ACTION_PLAYED` 事件（额外打出）
   - 需要实现：
     - 额外打出，不占用本回合的行动打出次数
     - 可以打出到任何基地

#### UI实现 (Task 16)
- 泰坦区域显示（已有TitanSystem支持）
- +1战斗力指示物显示（需要在泰坦卡牌上显示数量）
- 能力按钮（使用现有框架）
- 弃牌选择UI（Special能力）
- 确认转移指示物UI（Ongoing能力）
- 选择行动卡UI（Talent能力）

### 待确认信息
- [ ] 图集ID (`atlasId`)
- [ ] 图集索引 (`atlasIndex`)
- [ ] 卡牌图片资源路径
- [ ] 新版与老版的能力差异（如有）

### 实现难点

#### 1. 统计所有随从上的指示物总数
- Special能力需要统计所有己方随从上的+1指示物总数
- 需要遍历所有基地上的己方随从
- 只计算随从，不计算行动卡或其他卡牌
- 需要实时更新（随从进入/离开、指示物增加/减少时）

#### 2. 随从进入弃牌堆前触发
- Ongoing能力需要在随从进入弃牌堆前触发
- 这是一个"before"事件，需要在弃牌前拦截
- 需要在所有弃牌场景触发（基地计分、消灭、返回手牌等）
- 需要确保指示物转移后，随从才进入弃牌堆

#### 3. 从对手随从上"偷取"指示物
- Ongoing能力适用于所有玩家的随从
- 当对手的随从进入弃牌堆时，也可以转移指示物
- 需要在UI中明确显示"偷取"操作
- 可能需要特殊的动画效果

#### 4. 每个随从只转移一个指示物
- 如果随从有多个指示物，只能转移一个
- 需要在触发时限制转移数量
- 不能因为有多个指示物就触发多次

#### 5. 基地计分时的时序
- 基地计分时，所有卡牌同时进入弃牌堆
- 需要在弃牌前依次触发每个随从的Ongoing能力
- 需要确保泰坦的Ongoing能力在泰坦本身被弃置前触发

#### 6. 额外打出行动
- Talent能力打出的行动不占用本回合的行动打出次数
- 需要区分"正常打出"和"额外打出"
- 可能需要扩展`ACTION_PLAYED`事件，添加`isExtra`标志

#### 7. +1战斗力指示物系统
- 需要在泰坦和随从上存储+1指示物数量
- 计算总战斗力时需要加上指示物数量
- UI需要显示指示物数量
- 指示物不受能力取消影响

### 潜在问题（新版可能需要FAQ澄清）

#### 1. Ongoing能力的触发范围
- **问题**：如果多个随从同时进入弃牌堆（如基地计分），可以从每个随从上转移一个指示物吗？
- **推测**：应该可以（每个随从触发一次）
- **需要确认**：官方FAQ

#### 2. 随从被消灭vs返回手牌
- **问题**：随从返回手牌时，算"进入弃牌堆"吗？
- **推测**：不算（返回手牌不是进入弃牌堆）
- **需要确认**：官方FAQ

#### 3. 随从被埋藏到基地下
- **问题**：随从被埋藏到基地下时，算"进入弃牌堆"吗？
- **推测**：不算（埋藏不是进入弃牌堆）
- **需要确认**：官方FAQ

#### 4. 泰坦本身被弃置时
- **问题**：泰坦本身被弃置时，可以从其他随从上转移指示物到泰坦上吗？
- **推测**：应该不可以（泰坦已经离场，能力失效）
- **需要确认**：官方FAQ
