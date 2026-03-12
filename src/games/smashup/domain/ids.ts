/**
 * 大杀四方 (Smash Up) - ID 常量定义
 */

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
    TITANS: 'smashup:titans',
} as const;

export const SMASHUP_CARD_BACK = {
    type: 'atlas',
    atlasId: SMASHUP_ATLAS_IDS.CARDS2,
    index: 55, // 用户指出 cards2 最后一个索引是卡背 (7x8=56)
} as const;

export const SMASHUP_FACTION_IDS = {
    ALIENS: 'aliens',
    ALIENS_POD: 'aliens_pod',
    DINOSAURS: 'dinosaurs',
    DINOSAURS_POD: 'dinosaurs_pod',
    GHOSTS: 'ghosts',
    GHOSTS_POD: 'ghosts_pod',
    NINJAS: 'ninjas',
    PIRATES: 'pirates',
    PIRATES_POD: 'pirates_pod',
    ROBOTS: 'robots',
    ROBOTS_POD: 'robots_pod',
    TRICKSTERS: 'tricksters',
    TRICKSTERS_POD: 'tricksters_pod',
    WIZARDS: 'wizards',
    WIZARDS_POD: 'wizards_pod',
    ZOMBIES: 'zombies',
    ZOMBIES_POD: 'zombies_pod',
    BEAR_CAVALRY: 'bear_cavalry',
    BEAR_CAVALRY_POD: 'bear_cavalry_pod',
    STEAMPUNKS: 'steampunks',
    STEAMPUNKS_POD: 'steampunks_pod',
    KILLER_PLANTS: 'killer_plants',
    KILLER_PLANTS_POD: 'killer_plants_pod',
    MINIONS_OF_CTHULHU: 'minions_of_cthulhu',
    MINIONS_OF_CTHULHU_POD: 'minions_of_cthulhu_pod',
    ELDER_THINGS: 'elder_things',
    ELDER_THINGS_POD: 'elder_things_pod',
    INNSMOUTH: 'innsmouth',
    INNSMOUTH_POD: 'innsmouth_pod',
    MISKATONIC_UNIVERSITY: 'miskatonic_university',
    MISKATONIC_UNIVERSITY_POD: 'miskatonic_university_pod',
    MADNESS: 'madness',
    FRANKENSTEIN: 'frankenstein',
    FRANKENSTEIN_POD: 'frankenstein_pod',
    WEREWOLVES: 'werewolves',
    WEREWOLVES_POD: 'werewolves_pod',
    VAMPIRES: 'vampires',
    VAMPIRES_POD: 'vampires_pod',
    GIANT_ANTS: 'giant_ants',
    GIANT_ANTS_POD: 'giant_ants_pod',
    NINJAS_POD: 'ninjas_pod',
} as const;

/** 派系中文显示名（domain 层使用，避免依赖 i18n） */
export const FACTION_DISPLAY_NAMES: Record<string, string> = {
    [SMASHUP_FACTION_IDS.PIRATES]: '海盗',
    [SMASHUP_FACTION_IDS.PIRATES_POD]: '海盗 (POD版)',
    [SMASHUP_FACTION_IDS.NINJAS]: '忍者',
    [SMASHUP_FACTION_IDS.DINOSAURS]: '恐龙',
    [SMASHUP_FACTION_IDS.DINOSAURS_POD]: '恐龙 (POD版)',
    [SMASHUP_FACTION_IDS.ALIENS]: '外星人',
    [SMASHUP_FACTION_IDS.ALIENS_POD]: '外星人 (POD版)',
    [SMASHUP_FACTION_IDS.ROBOTS]: '机器人',
    [SMASHUP_FACTION_IDS.ROBOTS_POD]: '机器人 (POD版)',
    [SMASHUP_FACTION_IDS.ZOMBIES]: '丧尸',
    [SMASHUP_FACTION_IDS.ZOMBIES_POD]: '丧尸 (POD版)',
    [SMASHUP_FACTION_IDS.WIZARDS]: '巫师',
    [SMASHUP_FACTION_IDS.WIZARDS_POD]: '巫师 (POD版)',
    [SMASHUP_FACTION_IDS.TRICKSTERS]: '捣蛋鬼',
    [SMASHUP_FACTION_IDS.TRICKSTERS_POD]: '捣蛋鬼 (POD版)',
    [SMASHUP_FACTION_IDS.STEAMPUNKS]: '蒸汽朋克',
    [SMASHUP_FACTION_IDS.STEAMPUNKS_POD]: '蒸汽朋克 (POD版)',
    [SMASHUP_FACTION_IDS.GHOSTS]: '幽灵',
    [SMASHUP_FACTION_IDS.GHOSTS_POD]: '幽灵 (POD版)',
    [SMASHUP_FACTION_IDS.KILLER_PLANTS]: '食人花',
    [SMASHUP_FACTION_IDS.KILLER_PLANTS_POD]: '食人花 (POD版)',
    [SMASHUP_FACTION_IDS.BEAR_CAVALRY]: '熊骑兵',
    [SMASHUP_FACTION_IDS.BEAR_CAVALRY_POD]: '熊骑兵 (POD版)',
    [SMASHUP_FACTION_IDS.MINIONS_OF_CTHULHU]: '克苏鲁仆从',
    [SMASHUP_FACTION_IDS.MINIONS_OF_CTHULHU_POD]: '克苏鲁仆从 (POD版)',
    [SMASHUP_FACTION_IDS.ELDER_THINGS]: '远古物种',
    [SMASHUP_FACTION_IDS.ELDER_THINGS_POD]: '远古物种 (POD版)',
    [SMASHUP_FACTION_IDS.INNSMOUTH]: '印斯茅斯',
    [SMASHUP_FACTION_IDS.INNSMOUTH_POD]: '印斯茅斯 (POD版)',
    [SMASHUP_FACTION_IDS.MISKATONIC_UNIVERSITY]: '米斯卡塔尼克',
    [SMASHUP_FACTION_IDS.MISKATONIC_UNIVERSITY_POD]: '米斯卡塔尼克 (POD版)',
    [SMASHUP_FACTION_IDS.MADNESS]: '疯狂',
    [SMASHUP_FACTION_IDS.FRANKENSTEIN]: '科学怪人',
    [SMASHUP_FACTION_IDS.FRANKENSTEIN_POD]: '科学怪人 (POD版)',
    [SMASHUP_FACTION_IDS.WEREWOLVES]: '狼人',
    [SMASHUP_FACTION_IDS.WEREWOLVES_POD]: '狼人 (POD版)',
    [SMASHUP_FACTION_IDS.VAMPIRES]: '吸血鬼',
    [SMASHUP_FACTION_IDS.VAMPIRES_POD]: '吸血鬼 (POD版)',
    [SMASHUP_FACTION_IDS.GIANT_ANTS]: '巨蚁',
    [SMASHUP_FACTION_IDS.GIANT_ANTS_POD]: '巨蚁 (POD版)',
    [SMASHUP_FACTION_IDS.NINJAS_POD]: '忍者 (POD版)',
};

// ============================================================================
// 泰坦能力 ID 常量
// ============================================================================

/** 泰坦能力 ID（用于能力注册表） */
export const TITAN_ABILITY_IDS = {
    // Fort Titanosaurus (恐龙)
    FORT_TITANOSAURUS_SPECIAL: 'titan_fort_titanosaurus_special',
    FORT_TITANOSAURUS_ONGOING: 'titan_fort_titanosaurus_ongoing',
    FORT_TITANOSAURUS_TALENT: 'titan_fort_titanosaurus_talent',
    
    // Arcane Protector (巫师)
    ARCANE_PROTECTOR_SPECIAL: 'titan_arcane_protector_special',
    ARCANE_PROTECTOR_ONGOING: 'titan_arcane_protector_ongoing',
    ARCANE_PROTECTOR_TALENT: 'titan_arcane_protector_talent',
    
    // The Kraken (海盗)
    THE_KRAKEN_SPECIAL: 'titan_the_kraken_special',
    THE_KRAKEN_ONGOING: 'titan_the_kraken_ongoing',
    THE_KRAKEN_TALENT: 'titan_the_kraken_talent',
    
    // Invisible Ninja (忍者)
    INVISIBLE_NINJA_SPECIAL1: 'titan_invisible_ninja_special1',
    INVISIBLE_NINJA_ONGOING: 'titan_invisible_ninja_ongoing',
    INVISIBLE_NINJA_SPECIAL2: 'titan_invisible_ninja_special2',
    
    // Killer Kudzu (食人花)
    KILLER_KUDZU_SPECIAL1: 'titan_killer_kudzu_special1',
    KILLER_KUDZU_SPECIAL2: 'titan_killer_kudzu_special2',
    KILLER_KUDZU_ONGOING: 'titan_killer_kudzu_ongoing',
    KILLER_KUDZU_TALENT: 'titan_killer_kudzu_talent',
    
    // Creampuff Man (幽灵)
    CREAMPUFF_MAN_SPECIAL: 'titan_creampuff_man_special',
    CREAMPUFF_MAN_ONGOING: 'titan_creampuff_man_ongoing',
    CREAMPUFF_MAN_TALENT: 'titan_creampuff_man_talent',
    
    // Major Ursa (传奇熊骑兵)
    MAJOR_URSA_SPECIAL: 'titan_major_ursa_special',
    MAJOR_URSA_ONGOING: 'titan_major_ursa_ongoing',
    MAJOR_URSA_TALENT: 'titan_major_ursa_talent',
    
    // Dagon (达贡)
    DAGON_SPECIAL: 'titan_dagon_special',
    DAGON_ONGOING: 'titan_dagon_ongoing',
    DAGON_TALENT: 'titan_dagon_talent',
    
    // Cthulhu (克苏鲁)
    CTHULHU_SPECIAL: 'titan_cthulhu_special',
    CTHULHU_ONGOING: 'titan_cthulhu_ongoing',
    CTHULHU_TALENT: 'titan_cthulhu_talent',
    
    // Ancient Lord (古代领主)
    ANCIENT_LORD_SPECIAL: 'titan_ancient_lord_special',
    ANCIENT_LORD_ONGOING: 'titan_ancient_lord_ongoing',
    ANCIENT_LORD_TALENT: 'titan_ancient_lord_talent',
    
    // Death on Six Legs (六足死神)
    DEATH_ON_SIX_LEGS_SPECIAL: 'titan_death_on_six_legs_special',
    DEATH_ON_SIX_LEGS_ONGOING: 'titan_death_on_six_legs_ongoing',
    DEATH_ON_SIX_LEGS_TALENT: 'titan_death_on_six_legs_talent',
} as const;
