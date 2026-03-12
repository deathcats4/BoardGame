/**
 * 泰坦卡牌数据
 * 
 * 泰坦是 POD 扩展引入的特殊卡牌类型，每个派系有一张泰坦卡。
 * 泰坦不是随从，不会触发随从相关的效果，但会占据基地上的位置。
 * 
 * 数据来源：docs/smashup-titans-data.md
 */

import type { TitanCardDef } from '../domain/types';
import { SMASHUP_ATLAS_IDS, SMASHUP_FACTION_IDS } from '../domain/ids';

// ============================================================================
// 泰坦卡牌定义
// ============================================================================

export const TITAN_CARDS: TitanCardDef[] = [
    // ========================================================================
    // 1. The Kraken (巨妖) - Pirates (海盗)
    // ========================================================================
    {
        defId: 'titan_the_kraken',
        type: 'titan',
        name: '巨妖',
        factionId: SMASHUP_FACTION_IDS.PIRATES,
        abilities: [
            'titan_the_kraken_special',
            'titan_the_kraken_ongoing',
            'titan_the_kraken_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 2 },
    },

    // ========================================================================
    // 2. Arcane Protector (奥术守护者) - Wizards (巫师)
    // ========================================================================
    {
        defId: 'titan_arcane_protector',
        type: 'titan',
        name: '奥术守护者',
        factionId: SMASHUP_FACTION_IDS.WIZARDS,
        abilities: [
            'titan_arcane_protector_special',
            'titan_arcane_protector_ongoing',
            'titan_arcane_protector_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 4 },
    },

    // ========================================================================
    // 3. Invisible Ninja (隐形忍者) - Ninjas (忍者)
    // ========================================================================
    {
        defId: 'titan_invisible_ninja',
        type: 'titan',
        name: '隐形忍者',
        factionId: SMASHUP_FACTION_IDS.NINJAS,
        abilities: [
            'titan_invisible_ninja_special',
            'titan_invisible_ninja_ongoing',
            'titan_invisible_ninja_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 1 },
    },

    // ========================================================================
    // 4. Fort Titanosaurus (泰坦堡垒龙) - Dinosaurs (恐龙)
    // ========================================================================
    {
        defId: 'titan_fort_titanosaurus',
        type: 'titan',
        name: '泰坦堡垒龙',
        factionId: SMASHUP_FACTION_IDS.DINOSAURS,
        abilities: [
            'titan_fort_titanosaurus_special',
            'titan_fort_titanosaurus_ongoing',
            'titan_fort_titanosaurus_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 0 },
    },

    // ========================================================================
    // 5. Killer Kudzu (杀手葛藤) - Killer Plants (杀手植物)
    // ========================================================================
    {
        defId: 'titan_killer_kudzu',
        type: 'titan',
        name: '杀手葛藤',
        factionId: SMASHUP_FACTION_IDS.KILLER_PLANTS,
        abilities: [
            'titan_killer_kudzu_special',
            'titan_killer_kudzu_ongoing',
            'titan_killer_kudzu_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 7 },
    },

    // ========================================================================
    // 6. Creampuff Man (奶油泡芙人) - Tricksters (诡术师)
    // ========================================================================
    {
        defId: 'titan_creampuff_man',
        type: 'titan',
        name: '奶油泡芙人',
        factionId: SMASHUP_FACTION_IDS.TRICKSTERS,
        abilities: [
            'titan_creampuff_man_special',
            'titan_creampuff_man_ongoing',
            'titan_creampuff_man_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 6 },
    },

    // ========================================================================
    // 7. Major Ursa (大熊少校) - Bear Cavalry (熊骑兵)
    // ========================================================================
    {
        defId: 'titan_major_ursa',
        type: 'titan',
        name: '大熊少校',
        factionId: SMASHUP_FACTION_IDS.BEAR_CAVALRY,
        abilities: [
            'titan_major_ursa_special',
            'titan_major_ursa_ongoing',
            'titan_major_ursa_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 5 },
    },

    // ========================================================================
    // 8. Dagon (达贡) - Innsmouth (印斯茅斯)
    // ========================================================================
    {
        defId: 'titan_dagon',
        type: 'titan',
        name: '达贡',
        factionId: SMASHUP_FACTION_IDS.INNSMOUTH,
        abilities: [
            'titan_dagon_special',
            'titan_dagon_ongoing',
            'titan_dagon_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 8 },
    },

    // ========================================================================
    // 9. Cthulhu (克苏鲁) - Cthulhu (克苏鲁)
    // ========================================================================
    {
        defId: 'titan_cthulhu',
        type: 'titan',
        name: '克苏鲁',
        factionId: SMASHUP_FACTION_IDS.MINIONS_OF_CTHULHU,
        abilities: [
            'titan_cthulhu_special',
            'titan_cthulhu_ongoing',
            'titan_cthulhu_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 9 },
    },

    // ========================================================================
    // 10. Big Funny Giant (大搞笑巨人) - Aliens (外星人)
    // ========================================================================
    {
        defId: 'titan_big_funny_giant',
        type: 'titan',
        name: '大搞笑巨人',
        factionId: SMASHUP_FACTION_IDS.ALIENS,
        abilities: [
            'titan_big_funny_giant_special',
            'titan_big_funny_giant_ongoing',
            'titan_big_funny_giant_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 3 },
    },

    // ========================================================================
    // 11. Great Wolf Spirit (伟大狼灵) - Werewolves (狼人)
    // ========================================================================
    {
        defId: 'titan_great_wolf_spirit',
        type: 'titan',
        name: '伟大狼灵',
        factionId: SMASHUP_FACTION_IDS.WEREWOLVES,
        abilities: [
            'titan_great_wolf_spirit_special',
            'titan_great_wolf_spirit_ongoing',
            'titan_great_wolf_spirit_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 15 },
    },

    // ========================================================================
    // 12. The Bride (新娘) - Frankenstein (弗兰肯斯坦)
    // ========================================================================
    {
        defId: 'titan_the_bride',
        type: 'titan',
        name: '新娘',
        factionId: SMASHUP_FACTION_IDS.FRANKENSTEIN,
        abilities: [
            'titan_the_bride_special',
            'titan_the_bride_ongoing',
            'titan_the_bride_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 13 },
    },

    // ========================================================================
    // 13. Ancient Lord (古代领主) - Vampires (吸血鬼)
    // ========================================================================
    {
        defId: 'titan_ancient_lord',
        type: 'titan',
        name: '古代领主',
        factionId: SMASHUP_FACTION_IDS.VAMPIRES,
        abilities: [
            'titan_ancient_lord_special',
            'titan_ancient_lord_ongoing',
            'titan_ancient_lord_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 14 },
    },

    // ========================================================================
    // 14. Death on Six Legs (六足死神) - Giant Ants (巨蚁)
    // ========================================================================
    {
        defId: 'titan_death_on_six_legs',
        type: 'titan',
        name: '六足死神',
        factionId: SMASHUP_FACTION_IDS.GIANT_ANTS,
        abilities: [
            'titan_death_on_six_legs_special',
            'titan_death_on_six_legs_ongoing',
            'titan_death_on_six_legs_talent',
        ],
        previewRef: { type: 'atlas', atlasId: SMASHUP_ATLAS_IDS.TITANS, index: 12 },
    },
];

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 根据派系 ID 获取泰坦卡牌定义
 */
export function getTitanByFaction(factionId: string): TitanCardDef | undefined {
    return TITAN_CARDS.find(titan => titan.factionId === factionId);
}

/**
 * 根据 defId 获取泰坦卡牌定义
 */
export function getTitanDef(defId: string): TitanCardDef | undefined {
    return TITAN_CARDS.find(titan => titan.defId === defId);
}
