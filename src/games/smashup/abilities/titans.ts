/**
 * 泰坦能力注册
 * 
 * 注册所有泰坦的 Special、Ongoing、Talent 能力到能力注册表
 */

import { registerAbility } from '../domain/abilityRegistry';
import { getEffectivePower } from '../domain/ongoingModifiers';
import {
    fortTitanosaurusSpecial,
    fortTitanosaurusOngoing,
    fortTitanosaurusTalent,
    arcaneProtectorSpecial,
    arcaneProtectorOngoing,
    arcaneProtectorTalent,
    theKrakenSpecial,
    theKrakenOngoing,
    theKrakenTalent,
    invisibleNinjaSpecial1,
    invisibleNinjaOngoing,
    invisibleNinjaSpecial2,
    killerKudzuSpecial1,
    killerKudzuSpecial2,
    killerKudzuOngoing,
    killerKudzuTalent,
    creampuffManSpecial,
    creampuffManOngoing,
    creampuffManTalent,
    majorUrsaSpecial,
    majorUrsaOngoing,
    majorUrsaTalent,
    dagonSpecial,
    dagonOngoing,
    dagonTalent,
    cthulhuSpecial,
    cthulhuOngoing,
    cthulhuTalent,
    bigFunnyGiantSpecial1,
    bigFunnyGiantOngoing,
    bigFunnyGiantSpecial2,
    greatWolfSpiritSpecial,
    greatWolfSpiritOngoing,
    greatWolfSpiritTalent,
    theBrideSpecial,
    theBrideOngoing,
    theBrideTalent,
    ancientLordSpecial,
    ancientLordOngoing,
    ancientLordTalent,
    deathOnSixLegsSpecial,
    deathOnSixLegsOngoing,
    deathOnSixLegsTalent,
} from '../domain/abilities/titans';

/**
 * 注册所有泰坦能力
 * 
 * 必须在游戏初始化时调用
 */
export function registerTitanAbilities(): void {
    // Fort Titanosaurus (恐龙)
    registerAbility('titan_fort_titanosaurus', 'special', fortTitanosaurusSpecial);
    registerAbility('titan_fort_titanosaurus', 'ongoing', fortTitanosaurusOngoing);
    registerAbility('titan_fort_titanosaurus', 'talent', fortTitanosaurusTalent);

    // Arcane Protector (巫师)
    registerAbility('titan_arcane_protector', 'special', arcaneProtectorSpecial);
    registerAbility('titan_arcane_protector', 'ongoing', arcaneProtectorOngoing);
    registerAbility('titan_arcane_protector', 'talent', arcaneProtectorTalent);

    // The Kraken (海盗)
    registerAbility('titan_the_kraken', 'special', theKrakenSpecial);
    registerAbility('titan_the_kraken', 'ongoing', theKrakenOngoing);
    registerAbility('titan_the_kraken', 'talent', theKrakenTalent);

    // Invisible Ninja (忍者)
    registerAbility('titan_invisible_ninja', 'special', invisibleNinjaSpecial1);
    registerAbility('titan_invisible_ninja', 'ongoing', invisibleNinjaOngoing);
    registerAbility('titan_invisible_ninja', 'special', invisibleNinjaSpecial2);

    // Killer Kudzu (食人花)
    registerAbility('titan_killer_kudzu', 'special', killerKudzuSpecial1);
    registerAbility('titan_killer_kudzu', 'special', killerKudzuSpecial2);
    registerAbility('titan_killer_kudzu', 'ongoing', killerKudzuOngoing);
    registerAbility('titan_killer_kudzu', 'talent', killerKudzuTalent);

    // Creampuff Man (幽灵)
    registerAbility('titan_creampuff_man', 'special', creampuffManSpecial);
    registerAbility('titan_creampuff_man', 'ongoing', creampuffManOngoing);
    registerAbility('titan_creampuff_man', 'talent', creampuffManTalent);

    // Major Ursa (传奇熊骑兵)
    registerAbility('titan_major_ursa', 'special', majorUrsaSpecial);
    registerAbility('titan_major_ursa', 'ongoing', majorUrsaOngoing);
    registerAbility('titan_major_ursa', 'talent', majorUrsaTalent);

    // Dagon (达贡)
    registerAbility('titan_dagon', 'special', dagonSpecial);
    registerAbility('titan_dagon', 'ongoing', dagonOngoing);
    registerAbility('titan_dagon', 'talent', dagonTalent);

    // Cthulhu (克苏鲁)
    registerAbility('titan_cthulhu', 'special', cthulhuSpecial);
    registerAbility('titan_cthulhu', 'ongoing', cthulhuOngoing);
    registerAbility('titan_cthulhu', 'talent', cthulhuTalent);

    // Big Funny Giant (快乐巨人)
    registerAbility('titan_big_funny_giant', 'special', bigFunnyGiantSpecial1);
    registerAbility('titan_big_funny_giant', 'ongoing', bigFunnyGiantOngoing);
    registerAbility('titan_big_funny_giant', 'special', bigFunnyGiantSpecial2);

    // Great Wolf Spirit (伟大狼灵)
    registerAbility('titan_great_wolf_spirit', 'special', greatWolfSpiritSpecial);
    registerAbility('titan_great_wolf_spirit', 'ongoing', greatWolfSpiritOngoing);
    registerAbility('titan_great_wolf_spirit', 'talent', greatWolfSpiritTalent);

    // The Bride (怪人的新娘)
    registerAbility('titan_the_bride', 'special', theBrideSpecial);
    registerAbility('titan_the_bride', 'ongoing', theBrideOngoing);
    registerAbility('titan_the_bride', 'talent', theBrideTalent);

    // Ancient Lord (古代领主)
    registerAbility('titan_ancient_lord', 'special', ancientLordSpecial);
    registerAbility('titan_ancient_lord', 'ongoing', ancientLordOngoing);
    registerAbility('titan_ancient_lord', 'talent', ancientLordTalent);

    // Death on Six Legs (六足死神)
    registerAbility('titan_death_on_six_legs', 'special', deathOnSixLegsSpecial);
    registerAbility('titan_death_on_six_legs', 'ongoing', deathOnSixLegsOngoing);
    registerAbility('titan_death_on_six_legs', 'talent', deathOnSixLegsTalent);
}


// ============================================================================
// 交互处理器
// ============================================================================

import { registerInteractionHandler } from '../domain/abilityInteractionHandlers';
import { SU_EVENT_TYPES as SU_EVENTS } from '../domain/events';
import type { SmashUpCore } from '../domain/types';
import type { SmashUpEvent, DeckReshuffledEvent, CardsDrawnEvent } from '../domain/types';
import { MADNESS_CARD_DEF_ID } from '../domain/types';
import { createSimpleChoice, queueInteraction } from '../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../engine/systems/InteractionSystem';
import { getCardDef } from '../data/cards';
import { drawCards } from '../domain/utils';
import { drawMadnessCards } from '../domain/abilityHelpers';

/**
 * 注册所有泰坦能力的交互处理器
 * 
 * 必须在游戏初始化时调用
 */
export function registerTitanInteractionHandlers(): void {
    // Fort Titanosaurus Special
    registerInteractionHandler(
        'titan_fort_titanosaurus_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { minionUid, baseIndex } = value as {
                minionUid: string;
                baseIndex: number;
                power: number;
            };

            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 防御性检查：已经有泰坦在场时不能再打出 Fort Titanosaurus
            if (player.activeTitan) {
                return { state, events };
            }

            // 找到被消灭的随从
            const minion = state.core.bases[baseIndex].minions.find((m: any) => m.uid === minionUid);
            if (!minion) return { state, events };

            // 用 state 重算被消灭随从的有效战力（含持续修正），与规则一致
            const effectivePower = getEffectivePower(state.core, minion, baseIndex);

            events.push({
                type: SU_EVENTS.MINION_DESTROYED,
                payload: {
                    minionUid,
                    minionDefId: minion.defId,
                    fromBaseIndex: baseIndex,
                    ownerId: playerId,
                    reason: 'titan_fort_titanosaurus_special'
                },
                timestamp,
            });

            const titanCard = player.titanZone.find(c => c.defId === 'titan_fort_titanosaurus');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            events.push({
                type: SU_EVENTS.TITAN_POWER_TOKEN_ADDED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    amount: effectivePower,
                    newTotal: effectivePower
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // The Bride Talent: 在本基地随从上放置 +1 指示物，或移除总计 2 个 +1 指示物打出额外行动
    registerInteractionHandler(
        'mad_scientists_the_bride_talent_mode',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { mode } = value as { mode: 'placeCounter' | 'removeForAction' };
            const core = state.core;
            const player = core.players[playerId];
            if (!player) return { state, events: [] };
            const titan = player.activeTitan;
            if (!titan || titan.defId !== 'titan_the_bride') return { state, events: [] };

            if (mode === 'placeCounter') {
                // 选择泰坦所在基地上的一个己方随从
                const base = core.bases[titan.baseIndex];
                const options: PromptOption<{ minionUid: string }>[] = [];
                base.minions.forEach((m: any) => {
                    if (m.controller !== playerId || m.inStasis) return;
                    options.push({
                        id: m.uid,
                        label: m.defId,
                        value: { minionUid: m.uid },
                    });
                });
                if (options.length === 0) return { state, events: [] };

                const interaction = createSimpleChoice(
                    `the_bride_talent_place_${timestamp}`,
                    playerId,
                    '选择要放置+1指示物的随从',
                    options,
                    {
                        sourceId: 'mad_scientists_the_bride_talent_place',
                        targetType: 'minion',
                    }
                );
                return { state: queueInteraction(state, interaction), events: [] };
            }

            // removeForAction：第一步选择要移除指示物的随从（最多可选两个随从）
            const options: PromptOption<{ minionUid: string; baseIndex: number }>[] = [];
            core.bases.forEach((base, bi) => {
                base.minions.forEach((m: any) => {
                    if (m.controller !== playerId || m.inStasis) return;
                    if (!m.powerCounters || m.powerCounters <= 0) return;
                    options.push({
                        id: m.uid,
                        label: `${m.defId} @ 基地 ${bi + 1}`,
                        value: { minionUid: m.uid, baseIndex: bi },
                    });
                });
            });
            if (options.length === 0) return { state, events: [] };

            const interaction = createSimpleChoice(
                `the_bride_talent_remove_${timestamp}`,
                playerId,
                '选择要移除+1指示物的随从（总计 2 个指示物）',
                options,
                {
                    sourceId: 'mad_scientists_the_bride_talent_remove',
                    targetType: 'minion',
                    multi: { min: 1, max: 2 },
                }
            );
            return { state: queueInteraction(state, interaction), events: [] };
        }
    );

    // Talent 分支 1：放置 +1 指示物
    registerInteractionHandler(
        'mad_scientists_the_bride_talent_place',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { minionUid } = value as { minionUid: string };
            const core = state.core;
            const optionsBaseIndex = core.bases.findIndex(b => b.minions.some((m: any) => m.uid === minionUid));
            if (optionsBaseIndex < 0) return { state, events: [] };

            const events: SmashUpEvent[] = [{
                type: SU_EVENTS.POWER_COUNTER_ADDED,
                payload: {
                    minionUid,
                    baseIndex: optionsBaseIndex,
                    amount: 1,
                    reason: 'titan_the_bride_talent',
                },
                timestamp,
            } as any];

            return { state, events };
        }
    );

    // Talent 分支 2：移除 2 个指示物后打出额外行动
    registerInteractionHandler(
        'mad_scientists_the_bride_talent_remove',
        (state, playerId, value, _iData, _random, timestamp) => {
            const selections = (Array.isArray(value) ? value : [value]) as { minionUid: string; baseIndex: number }[];
            const core = state.core;
            const player = core.players[playerId];
            if (!player) return { state, events: [] };

            const events: SmashUpEvent[] = [];
            let remaining = 2;

            for (const sel of selections) {
                if (remaining <= 0) break;
                const { minionUid, baseIndex } = sel;
                const base = core.bases[baseIndex];
                const minion = base?.minions.find((m: any) => m.uid === minionUid);
                if (!minion || !minion.powerCounters || minion.powerCounters <= 0) continue;

                const removeAmount = Math.min(minion.powerCounters, remaining);
                events.push({
                    type: SU_EVENTS.POWER_COUNTER_REMOVED,
                    payload: {
                        minionUid,
                        baseIndex,
                        amount: removeAmount,
                        reason: 'titan_the_bride_talent_remove_for_action',
                    },
                    timestamp,
                } as any);
                remaining -= removeAmount;
                if (remaining <= 0) break;
            }

            if (remaining > 0) {
                // 未能成功移除 2 个指示物，效果失败
                return { state, events: [] };
            }

            // 现在选择要打出的行动牌
            const actionCards = (player.hand ?? []).filter((c: any) => c.type === 'action');
            if (actionCards.length === 0) {
                // 没有可打出的行动牌，整体效果视为失败（指示物也已被移除）
                return { state, events };
            }

            const options: PromptOption<{ cardUid: string }>[] = actionCards.map((c: any) => ({
                id: c.uid,
                label: c.defId,
                value: { cardUid: c.uid },
            }));

            const interaction = createSimpleChoice(
                `the_bride_talent_action_${timestamp}`,
                playerId,
                '选择要作为额外行动打出的行动牌',
                options,
                {
                    sourceId: 'mad_scientists_the_bride_talent_action',
                    targetType: 'card',
                }
            );

            return {
                state: queueInteraction(state, interaction),
                events,
            };
        }
    );

    // Talent 分支 2 最终步：打出额外行动
    registerInteractionHandler(
        'mad_scientists_the_bride_talent_action',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid } = value as { cardUid: string };
            const core = state.core;
            const player = core.players[playerId];
            if (!player) return { state, events: [] };

            const card = player.hand.find((c: any) => c.uid === cardUid);
            if (!card || card.type !== 'action') return { state, events: [] };

            const events: SmashUpEvent[] = [{
                type: SU_EVENTS.ACTION_PLAYED,
                payload: {
                    playerId,
                    cardUid,
                    defId: card.defId,
                    isExtraAction: true,
                },
                timestamp,
            } as any];

            return { state, events };
        }
    );
    // Fort Titanosaurus Ongoing
    registerInteractionHandler(
        'titan_fort_titanosaurus_ongoing',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { placeOnTitan, minionUid, baseIndex } = value as {
                placeOnTitan: boolean;
                minionUid?: string;
                baseIndex?: number;
            };

            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 1) 处理泰坦自身的指示物
            if (placeOnTitan) {
                const titan = player.activeTitan;
                if (titan && titan.defId === 'titan_fort_titanosaurus') {
                    events.push({
                        type: SU_EVENTS.TITAN_POWER_TOKEN_ADDED,
                        payload: {
                            playerId,
                            titanUid: titan.titanUid,
                            amount: 1,
                            newTotal: titan.powerTokens + 1,
                        },
                        timestamp,
                    });
                }
            }

            // 2) 处理受影响随从上的指示物
            if (minionUid && baseIndex !== undefined) {
                const base = state.core.bases[baseIndex];
                if (base) {
                    const minion = base.minions.find((m: any) => m.uid === minionUid);
                    if (minion) {
                        events.push({
                            type: SU_EVENTS.POWER_COUNTER_ADDED,
                            payload: {
                                minionUid,
                                baseIndex,
                                amount: 1,
                                reason: 'titan_fort_titanosaurus_ongoing',
                            },
                            timestamp,
                        });
                    }
                }
            }

            // 标记本回合已使用
            const updatedState = {
                ...state,
                core: {
                    ...state.core,
                    players: {
                        ...state.core.players,
                        [playerId]: {
                            ...state.core.players[playerId],
                            fortTitanosaurusOngoingUsedThisTurn: true,
                        },
                    },
                },
            };

            return { state: updatedState, events };
        }
    );

    // Arcane Protector Special
    registerInteractionHandler(
        'titan_arcane_protector_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find(c => c.defId === 'titan_arcane_protector');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // The Kraken Special
    registerInteractionHandler(
        'titan_the_kraken_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find(c => c.defId === 'titan_the_kraken');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // The Kraken Ongoing / Special 2: 计分后移动一个你的随从到另一个基地
    registerInteractionHandler(
        'titan_the_kraken_ongoing',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { minionUid, fromBaseIndex, toBaseIndex } = value as {
                minionUid: string;
                fromBaseIndex: number;
                toBaseIndex: number;
            };

            const events: SmashUpEvent[] = [];

            if (fromBaseIndex === undefined || toBaseIndex === undefined || !minionUid) {
                return { state, events };
            }

            const fromBase = state.core.bases[fromBaseIndex];
            if (!fromBase) return { state, events };

            const minion = fromBase.minions.find((m: any) => m.uid === minionUid);
            if (!minion) return { state, events };

            events.push({
                type: SU_EVENTS.MINION_MOVED,
                payload: {
                    minionUid,
                    minionDefId: minion.defId,
                    fromBaseIndex,
                    toBaseIndex,
                    reason: 'titan_the_kraken_ongoing',
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // The Kraken Talent
    registerInteractionHandler(
        'titan_the_kraken_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex: toBaseIndex } = value as { baseIndex: number };

            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];
            const titan = player.activeTitan;

            if (!titan || titan.defId !== 'titan_the_kraken') return { state, events };
            if (toBaseIndex === undefined || toBaseIndex === titan.baseIndex) return { state, events };

            const arrivalBase = state.core.bases[toBaseIndex];
            if (!arrivalBase) return { state, events };

            // 1) 移动泰坦
            events.push({
                type: SU_EVENTS.TITAN_MOVED,
                payload: {
                    playerId,
                    titanUid: titan.titanUid,
                    titanDefId: titan.defId,
                    fromBaseIndex: titan.baseIndex,
                    toBaseIndex,
                },
                timestamp,
            });

            // 2) 对目的基地上其他玩家的随从施加 -1 永久力量修正，持续到本玩家下个回合开始
            for (const m of arrivalBase.minions) {
                if (m.controller === playerId) continue;

                // 避免对同一随从重复叠加同一玩家的 debuff
                const meta: any = m.metadata ?? {};
                if (meta.krakenDebuffOwnerId === playerId) continue;

                events.push({
                    type: SU_EVENTS.PERMANENT_POWER_ADDED,
                    payload: {
                        minionUid: m.uid,
                        baseIndex: toBaseIndex,
                        amount: -1,
                        reason: 'titan_the_kraken_talent',
                    },
                    timestamp,
                });

                events.push({
                    type: SU_EVENTS.ABILITY_TRIGGERED as any,
                    payload: {
                        cardUid: m.uid,
                        metadataUpdate: {
                            krakenDebuffOwnerId: playerId,
                        },
                    },
                    timestamp,
                } as any);
            }

            return { state, events };
        }
    );

    // ========================================================================
    // Batch 1: Invisible Ninja & Killer Kudzu
    // ========================================================================

    // Invisible Ninja Special 1: 弃牌打出泰坦
    registerInteractionHandler(
        'ninja_invisible_ninja_special1',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid, baseIndex } = value as {
                cardUid: string;
                baseIndex: number;
            };

            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 弃掉选中的卡牌（必须正好一张）
            const card = player.hand.find((c: any) => c.uid === cardUid);
            if (!card) {
                return { state, events };
            }

            events.push({
                type: SU_EVENTS.CARDS_DISCARDED,
                payload: {
                    playerId,
                    cardUids: [cardUid],
                },
                timestamp,
            });

            // 打出泰坦到选定基地
            const titanCard = player.titanZone.find(c => c.defId === 'titan_invisible_ninja');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Invisible Ninja Ongoing: Once per turn 看顶两张抽一张、洗回一张
    registerInteractionHandler(
        'ninja_invisible_ninja_ongoing',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { drawUid, shuffleBackUid } = value as {
                drawUid: string;
                shuffleBackUid: string;
            };

            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const deck = player.deck;
            if (!deck || deck.length === 0) {
                return { state, events };
            }

            // 抽取选中的那张牌（若仍在牌库中）
            const drawCard = deck.find((c: any) => c.uid === drawUid);
            if (drawCard) {
                events.push({
                    type: SU_EVENTS.CARDS_DRAWN,
                    payload: {
                        playerId,
                        count: 1,
                        cardUids: [drawUid],
                        reason: 'titan_invisible_ninja_ongoing',
                    },
                    timestamp,
                });
            }

            // 将另一张洗回牌库：简单实现为保持在牌库中，由 reduce 中的 CARDS_DRAWN 逻辑维持剩余顺序
            // （如需更复杂“洗牌”规则，可在后续按 Wiki 细化）

            // 标记本回合已触发 Ongoing
            const updatedState = {
                ...state,
                core: {
                    ...state.core,
                    players: {
                        ...state.core.players,
                        [playerId]: {
                            ...state.core.players[playerId],
                            invisibleNinjaOngoingUsedThisTurn: true,
                        },
                    },
                },
            };

            return { state: updatedState, events };
        }
    );

    // Invisible Ninja Special 2: 消灭泰坦打出额外随从
    registerInteractionHandler(
        'ninja_invisible_ninja_special2',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid, baseIndex } = value as { cardUid: string; baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 找到要打出的随从卡
            const card = player.hand.find((c: any) => c.uid === cardUid);
            if (!card || card.type !== 'minion') return { state, events };

            const titan = player.activeTitan;
            if (!titan) return { state, events };

            // 消灭泰坦
            events.push({
                type: SU_EVENTS.MINION_DESTROYED,
                payload: {
                    minionUid: titan.titanUid,
                    minionDefId: titan.titanDefId,
                    fromBaseIndex: titan.baseIndex,
                    ownerId: playerId,
                    destroyerId: playerId,
                    reason: 'titan_invisible_ninja_special2'
                },
                timestamp,
            });

            // 打出随从到选择的基地，作为“额外随从”（不消耗正常额度）
            const cardDef = getCardDef(card.defId);
            events.push({
                type: SU_EVENTS.MINION_PLAYED,
                payload: {
                    playerId,
                    cardUid,
                    defId: card.defId,
                    baseIndex,
                    power: cardDef?.power || 0,
                    consumesNormalLimit: false,
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Killer Kudzu Special 2: 打出泰坦代替随从
    registerInteractionHandler(
        'plant_killer_kudzu_special2',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find(c => c.defId === 'titan_killer_kudzu');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Killer Kudzu Ongoing: 离场后二选一（洗回随从 / 抽两张）
    registerInteractionHandler(
        'plant_killer_kudzu_ongoing',
        (state, playerId, value, _iData, random, timestamp) => {
            const { mode } = value as { mode: 'draw' | 'shuffle' };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            if (!player) {
                return { state, events };
            }

            if (mode === 'draw') {
                const drawResult = drawCards(player, 2, random);
                if (drawResult.reshuffledDeckUids && drawResult.reshuffledDeckUids.length > 0) {
                    events.push({
                        type: SU_EVENTS.DECK_RESHUFFLED,
                        payload: {
                            playerId,
                            deckUids: drawResult.reshuffledDeckUids,
                        },
                        timestamp,
                    } as DeckReshuffledEvent);
                }

                if (drawResult.drawnUids.length > 0) {
                    events.push({
                        type: SU_EVENTS.CARDS_DRAWN,
                        payload: {
                            playerId,
                            count: drawResult.drawnUids.length,
                            cardUids: drawResult.drawnUids,
                            reason: 'titan_killer_kudzu_ongoing',
                        },
                        timestamp,
                    } as CardsDrawnEvent);
                }

                return { state, events };
            }

            // 洗回最多两张随从：进入二级多选交互
            const discardMinions = player.discard.filter(c => c.type === 'minion');
            if (discardMinions.length === 0) {
                return { state, events };
            }

            const options: PromptOption<{ cardUid: string }>[] = discardMinions.map(card => ({
                id: card.uid,
                label: card.defId,
                value: { cardUid: card.uid },
            }));

            const interaction = createSimpleChoice(
                'killer_kudzu_ongoing_shuffle_' + timestamp,
                playerId,
                '选择要洗回牌库的随从（最多两张）',
                options,
                {
                    sourceId: 'plant_killer_kudzu_ongoing_shuffle',
                    targetType: 'card',
                    multi: { min: 0, max: 2 },
                    autoRefresh: 'discard',
                }
            );

            return {
                state: queueInteraction(state, interaction),
                events,
            };
        }
    );

    // Killer Kudzu Ongoing（二级）：根据选择的随从洗回牌库并洗牌
    registerInteractionHandler(
        'plant_killer_kudzu_ongoing_shuffle',
        (state, playerId, value, _iData, random, timestamp) => {
            const selections = (Array.isArray(value) ? value : [value]) as { cardUid: string }[];
            const selectedUids = new Set(selections.map(s => s.cardUid).filter(Boolean));
            if (selectedUids.size === 0) return { state, events: [] };

            const player = state.core.players[playerId];
            const selectedCards = player.discard.filter(c => selectedUids.has(c.uid));
            if (selectedCards.length === 0) return { state, events: [] };

            const combined = [...player.deck, ...selectedCards];
            const shuffled = random.shuffle([...combined]);

            const events: SmashUpEvent[] = [{
                type: SU_EVENTS.DECK_REORDERED,
                payload: { playerId, deckUids: shuffled.map(c => c.uid) },
                timestamp,
            }];

            return { state, events };
        }
    );

    // Killer Kudzu Talent: 消灭泰坦从弃牌堆打出额外随从（不消耗正常随从额度）
    registerInteractionHandler(
        'plant_killer_kudzu_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid, baseIndex } = value as {
                cardUid: string;
                baseIndex: number;
            };

            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 找到弃牌堆中的随从卡
            const card = player.discard.find((c: any) => c.uid === cardUid);
            if (!card || card.type !== 'minion') return { state, events };

            const titan = player.activeTitan;
            if (!titan) return { state, events };

            // 使用泰坦事件：从场上移除 Killer Kudzu，触发 TITAN_REMOVED
            events.push({
                type: SU_EVENTS.TITAN_REMOVED,
                payload: {
                    playerId,
                    titanUid: titan.titanUid,
                    titanDefId: titan.defId,
                    baseIndex: titan.baseIndex,
                    reason: 'ability',
                },
                timestamp,
            });

            // 从弃牌堆打出随从作为额外随从（不消耗正常随从额度）
            const cardDef = getCardDef(card.defId);
            events.push({
                type: SU_EVENTS.MINION_PLAYED,
                payload: {
                    playerId,
                    cardUid,
                    defId: card.defId,
                    baseIndex,
                    power: cardDef?.power || 0,
                    fromDiscard: true,
                    consumesNormalLimit: false,
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // ========================================================================
    // Batch 2: Creampuff Man & Major Ursa
    // ========================================================================

    // Creampuff Man Special: 手牌为空时打出泰坦
    registerInteractionHandler(
        'ghost_creampuff_man_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find((c: any) => c.defId === 'titan_creampuff_man');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Creampuff Man Talent Step 1: 弃牌
    registerInteractionHandler(
        'ghost_creampuff_man_talent_step1',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid } = value as { cardUid: string };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 找到要弃置的手牌
            const handCard = player.hand.find((c: any) => c.uid === cardUid);
            if (!handCard) return { state, events };

            // 弃置手牌
            events.push({
                type: SU_EVENTS.CARDS_DISCARDED,
                payload: {
                    playerId,
                    cardUids: [handCard.uid]
                },
                timestamp,
            });

            // 从弃牌堆找标准行动牌
            const standardActions = player.discard.filter((card: any) =>
                card.type === 'action' && !card.abilities.some((a: string) => a.includes('ongoing'))
            );

            if (standardActions.length === 0) return { state, events };

            // 创建第二步交互：选择要打出的标准行动牌
            const actionOptions = standardActions.map((card: any) => ({
                id: `action-${card.uid}`,
                label: `打出 ${card.defId}`,
                value: { cardUid: card.uid },
            }));

            const interaction = createSimpleChoice(
                `creampuff_man_talent_step2_${timestamp}`,
                playerId,
                '选择要打出的标准行动牌',
                actionOptions,
                {
                    sourceId: 'ghost_creampuff_man_talent',
                    targetType: 'card',
                }
            );

            return {
                state: queueInteraction({ sys: state.sys, core: state.core }, interaction).core,
                events
            };
        }
    );

    // Creampuff Man Talent Step 2: 从弃牌堆打出标准行动牌
    registerInteractionHandler(
        'ghost_creampuff_man_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid } = value as { cardUid: string };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 找到弃牌堆中的行动卡
            const card = player.discard.find((c: any) => c.uid === cardUid);
            if (!card || card.type !== 'action') return { state, events };

            // 打出行动卡（作为额外行动）
            events.push({
                type: SU_EVENTS.ACTION_PLAYED,
                payload: {
                    playerId,
                    cardUid,
                    defId: card.defId,
                    fromDiscard: true,
                    isExtraAction: true,
                },
                timestamp,
            });

            // 解析完成后将该行动牌置于牌库底（替代进入弃牌堆）
            events.push({
                type: SU_EVENTS.CARD_TO_DECK_BOTTOM,
                payload: {
                    cardUid,
                    defId: card.defId,
                    ownerId: playerId,
                },
                timestamp,
            } as any);

            return { state, events };
        }
    );

    // Major Ursa Special: 代替随从打出泰坦
    registerInteractionHandler(
        'bear_cavalry_major_ursa_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find((c: any) => c.defId === 'titan_major_ursa');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Major Ursa Ongoing: 其他玩家随从进出本基地时，可选给泰坦+1指示物
    registerInteractionHandler(
        'bear_cavalry_major_ursa_ongoing',
        (state, playerId, value, _iData, _random, timestamp) => {
            const events: SmashUpEvent[] = [];
            const { placeCounter } = value as { placeCounter: boolean };

            if (!placeCounter) return { state, events };

            const player = state.core.players[playerId];
            const titan = player?.activeTitan;
            if (!titan || titan.defId !== 'titan_major_ursa') return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_POWER_TOKEN_ADDED,
                payload: {
                    playerId,
                    titanUid: titan.titanUid,
                    amount: 1,
                    newTotal: (titan.powerTokens || 0) + 1
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Major Ursa Talent: 给本基地随从+1指示物 OR 移动泰坦（二选一）
    registerInteractionHandler(
        'bear_cavalry_major_ursa_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];
            const titan = player?.activeTitan;
            if (!titan || titan.defId !== 'titan_major_ursa') return { state, events };

            const val = value as { mode: 'counter'; minionUid: string } | { mode: 'move'; toBaseIndex: number };
            if (val.mode === 'counter') {
                const { minionUid } = val;
                const base = state.core.bases[titan.baseIndex];
                const minion = base?.minions.find((m: any) => m.uid === minionUid);
                if (!minion) return { state, events };
                events.push({
                    type: SU_EVENTS.POWER_COUNTER_ADDED,
                    payload: {
                        minionUid,
                        baseIndex: titan.baseIndex,
                        amount: 1,
                        reason: 'titan_major_ursa_talent'
                    },
                    timestamp,
                });
            } else if (val.mode === 'move') {
                const { toBaseIndex } = val;
                events.push({
                    type: SU_EVENTS.TITAN_MOVED,
                    payload: {
                        playerId,
                        titanUid: titan.titanUid,
                        titanDefId: titan.defId,
                        fromBaseIndex: titan.baseIndex,
                        toBaseIndex
                    },
                    timestamp,
                });
            }

            return { state, events };
        }
    );

    // ========================================================================
    // Batch 3: Dagon & Cthulhu
    // ========================================================================

    // Dagon Special: 打出泰坦到有2个或更多同名随从的基地
    registerInteractionHandler(
        'innsmouth_dagon_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find(c => c.defId === 'titan_dagon');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Dagon Talent: 在泰坦所在基地打出额外随从
    registerInteractionHandler(
        'innsmouth_dagon_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid, baseIndex } = value as {
                cardUid: string;
                baseIndex: number;
            };

            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const card = player.hand.find((c: any) => c.uid === cardUid);
            if (!card || card.type !== 'minion') return { state, events };

            const cardDef = getCardDef(card.defId);
            events.push({
                type: SU_EVENTS.MINION_PLAYED,
                payload: {
                    playerId,
                    cardUid,
                    defId: card.defId,
                    baseIndex,
                    power: cardDef?.power ?? card.power ?? 0,
                    isExtra: true
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Cthulhu Special: 抽2张疯狂牌，打出泰坦到有己方随从的基地
    registerInteractionHandler(
        'cthulhu_minions_cthulhu_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 代替本回合“常规行动”出牌额度（消耗一次 actionLimit）
            events.push({
                type: SU_EVENTS.LIMIT_MODIFIED,
                payload: {
                    playerId,
                    limitType: 'action',
                    delta: -1,
                    reason: 'titan_cthulhu_special',
                },
                timestamp,
            } as any);

            // 抽 2 张疯狂牌（抽牌发生在泰坦进场之前，不触发其 Ongoing）
            const drawEvt = drawMadnessCards(playerId, 2, state.core, 'titan_cthulhu_special', timestamp);
            if (drawEvt) {
                events.push(drawEvt as any);
            }

            // 打出泰坦
            const titanCard = player.titanZone.find(c => c.defId === 'titan_cthulhu');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Cthulhu Talent: 抽疯狂牌或给对手疯狂牌
    registerInteractionHandler(
        'cthulhu_minions_cthulhu_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { action, toPlayerId } = value as { action: 'draw' | 'give'; toPlayerId?: string };
            const events: SmashUpEvent[] = [];

            if (action === 'draw') {
                // 抽取一张疯狂牌
                const drawEvt = drawMadnessCards(playerId, 1, state.core, 'titan_cthulhu_talent_draw', timestamp);
                if (drawEvt) {
                    events.push(drawEvt as any);
                }
            } else if (action === 'give') {
                // 将疯狂牌放入对手手牌
                const player = state.core.players[playerId];
                const madnessCard = player.hand.find((c: any) => c.defId === MADNESS_CARD_DEF_ID);

                if (madnessCard) {
                    // 选择目标玩家（默认第一个对手，或由交互传入）
                    const opponentId = toPlayerId ?? state.core.turnOrder.find(pid => pid !== playerId);
                    if (opponentId) {
                        events.push({
                            type: SU_EVENTS.CARD_TRANSFERRED,
                            payload: {
                                cardUid: madnessCard.uid,
                                defId: madnessCard.defId,
                                fromPlayerId: playerId,
                                toPlayerId: opponentId,
                                reason: 'titan_cthulhu_talent_give'
                            },
                            timestamp,
                        });
                    }
                }
            }

            return { state, events };
        }
    );

    // ========================================================================
    // Batch 4: Big Funny Giant, Great Wolf Spirit, The Bride, Ancient Lord, Death on Six Legs
    // ========================================================================

    // Big Funny Giant Special 1: 代替随从打出泰坦
    registerInteractionHandler(
        'tricksters_pod_big_funny_giant_special_1',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find(c => c.defId === 'titan_big_funny_giant');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Great Wolf Spirit Special: 在两个或更多基地上拥有最高战斗力时打出泰坦
    registerInteractionHandler(
        'werewolves_great_wolf_spirit_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find(c => c.defId === 'titan_great_wolf_spirit');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Great Wolf Spirit Ongoing: 在此处的卡牌可以再使用一次天赋能力
    // (Ongoing 能力在天赋使用次数检查时自动生效，不需要交互处理器)
    registerInteractionHandler(
        'werewolves_great_wolf_spirit_ongoing',
        (state) => ({ state, events: [] })
    );

    // Great Wolf Spirit Talent: 一个随从获得+1战斗力直到回合结束
    registerInteractionHandler(
        'werewolves_great_wolf_spirit_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { minionUid } = value as { minionUid: string };
            const events: SmashUpEvent[] = [];

            // 找到目标随从
            let targetBaseIndex = -1;
            let targetMinion: any = null;
            for (let i = 0; i < state.core.bases.length; i++) {
                const minion = state.core.bases[i].minions.find((m: any) => m.uid === minionUid);
                if (minion) {
                    targetBaseIndex = i;
                    targetMinion = minion;
                    break;
                }
            }

            if (!targetMinion) return { state, events };

            events.push({
                type: SU_EVENTS.TEMP_POWER_ADDED,
                payload: {
                    playerId,
                    minionUid,
                    baseIndex: targetBaseIndex,
                    amount: 1
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // The Bride Special: 多步骤交互
    //
    // Step 1: 选择两个不同效果（从 3 个中选 2 个）
    registerInteractionHandler(
        'mad_scientists_the_bride_special_step_effects',
        (state, playerId, value, _iData, _random, timestamp) => {
            const selections = (Array.isArray(value) ? value : [value]) as { effect: 'placeInBox' | 'destroy' | 'removeCounter' }[];
            const unique: ('placeInBox' | 'destroy' | 'removeCounter')[] = [];
            for (const s of selections) {
                if (!s || !s.effect) continue;
                if (!unique.includes(s.effect)) {
                    unique.push(s.effect);
                }
                if (unique.length >= 2) break;
            }
            if (unique.length < 2) {
                return { state, events: [] };
            }

            // Step 2: 选择执行顺序
            const [a, b] = unique;
            const labelFor = (e: string) => {
                switch (e) {
                    case 'placeInBox':
                        return '将随从放入盒子';
                    case 'destroy':
                        return '消灭你的一个随从';
                    case 'removeCounter':
                        return '移除一个+1指示物';
                    default:
                        return e;
                }
            };

            const options: PromptOption<{ order: ('placeInBox' | 'destroy' | 'removeCounter')[] }>[] = [
                {
                    id: 'order_ab',
                    label: `先 ${labelFor(a)}，再 ${labelFor(b)}`,
                    value: { order: [a, b] },
                },
                {
                    id: 'order_ba',
                    label: `先 ${labelFor(b)}，再 ${labelFor(a)}`,
                    value: { order: [b, a] },
                },
            ];

            const interaction = createSimpleChoice(
                `the_bride_special_order_${timestamp}`,
                playerId,
                '选择执行顺序',
                options,
                {
                    sourceId: 'mad_scientists_the_bride_special_step_order',
                    targetType: 'generic',
                }
            );
            // 将已选择的效果写入 continuationContext
            (interaction.data as any).continuationContext = {
                effects: unique,
            };

            return {
                state: queueInteraction(state, interaction),
                events: [],
            };
        }
    );

    // Step 2: 选择顺序后，开始为第一个效果选择目标
    registerInteractionHandler(
        'mad_scientists_the_bride_special_step_order',
        (state, playerId, value, iData, _random, timestamp) => {
            const { order } = value as { order: ('placeInBox' | 'destroy' | 'removeCounter')[] };
            const ctx = (iData as any)?.continuationContext ?? {};
            const effects: ('placeInBox' | 'destroy' | 'removeCounter')[] = ctx.effects ?? order;

            const continuationContext = {
                effectsOrder: order,
                currentIndex: 0,
                targets: [],
            };

            const interaction = createBrideTargetInteraction(state.core, playerId, continuationContext, timestamp);
            if (!interaction) {
                return { state, events: [] };
            }
            (interaction.data as any).continuationContext = continuationContext;

            return {
                state: queueInteraction(state, interaction),
                events: [],
            };
        }
    );

    // Step 3: 为每个效果选择目标（同一个 handler 处理两个步骤）
    registerInteractionHandler(
        'mad_scientists_the_bride_special_step_target',
        (state, playerId, value, iData, _random, timestamp) => {
            const ctx = (iData as any)?.continuationContext ?? {};
            const effectsOrder = ctx.effectsOrder as ('placeInBox' | 'destroy' | 'removeCounter')[] | undefined;
            let currentIndex = (ctx.currentIndex as number | undefined) ?? 0;
            const targets: any[] = Array.isArray(ctx.targets) ? [...ctx.targets] : [];

            if (!effectsOrder || effectsOrder.length !== 2) {
                return { state, events: [] };
            }

            // 记录当前步骤的目标
            targets[currentIndex] = value;
            currentIndex += 1;

            // 如果还有下一个效果需要选择目标，则创建下一步交互
            if (currentIndex < effectsOrder.length) {
                const continuationContext = {
                    effectsOrder,
                    currentIndex,
                    targets,
                };
                const interaction = createBrideTargetInteraction(state.core, playerId, continuationContext, timestamp);
                if (!interaction) {
                    return { state, events: [] };
                }
                (interaction.data as any).continuationContext = continuationContext;
                return {
                    state: queueInteraction(state, interaction),
                    events: [],
                };
            }

            // 两个效果的目标都已选择 → 进入选择基地步骤
            const continuationContext = {
                effectsOrder,
                targets,
            };

            const baseOptions: PromptOption<{ baseIndex: number }>[] = state.core.bases.map((_, i) => ({
                id: `base-${i}`,
                label: `基地 ${i + 1}`,
                value: { baseIndex: i },
            }));

            const interaction = createSimpleChoice(
                `the_bride_special_base_${timestamp}`,
                playerId,
                '选择要打出怪人的新娘的基地',
                baseOptions,
                {
                    sourceId: 'mad_scientists_the_bride_special',
                    targetType: 'base',
                }
            );
            (interaction.data as any).continuationContext = continuationContext;

            return {
                state: queueInteraction(state, interaction),
                events: [],
            };
        }
    );

    // Step 4: 执行两个效果并打出泰坦
    registerInteractionHandler(
        'mad_scientists_the_bride_special',
        (state, playerId, value, iData, _random, timestamp) => {
            const events: SmashUpEvent[] = [];
            const core = state.core;
            const player = core.players[playerId];
            if (!player) return { state, events };

            const { baseIndex } = value as { baseIndex: number };
            if (baseIndex < 0 || baseIndex >= core.bases.length) {
                return { state, events };
            }

            const ctx = (iData as any)?.continuationContext ?? {};
            const effectsOrder = ctx.effectsOrder as ('placeInBox' | 'destroy' | 'removeCounter')[] | undefined;
            const targets = Array.isArray(ctx.targets) ? ctx.targets : [];
            if (!effectsOrder || effectsOrder.length !== 2 || targets.length !== 2) {
                return { state, events };
            }

            // 帮助函数：避免复用同一随从作为两个目标
            const usedMinionUids = new Set<string>();

            for (let i = 0; i < effectsOrder.length; i++) {
                const effect = effectsOrder[i];
                const target = targets[i] ?? {};

                if (effect === 'placeInBox') {
                    const { cardUid } = target as { cardUid: string; from?: 'hand' | 'discard' };
                    if (!cardUid) continue;
                    // ACTION_BOXED 事件会将该卡牌从手牌/牌库/弃牌堆中移除，视为“放入盒子”
                    events.push({
                        type: SU_EVENTS.ACTION_BOXED,
                        payload: {
                            playerId,
                            cardUid,
                            defId: (core.players[playerId].hand.concat(core.players[playerId].discard) as any[])
                                .find((c: any) => c.uid === cardUid)?.defId,
                            reason: 'titan_the_bride_special_place_in_box',
                        },
                        timestamp,
                    } as any);
                } else if (effect === 'destroy') {
                    const { minionUid, baseIndex: fromBaseIndex } = target as { minionUid: string; baseIndex: number };
                    if (!minionUid || fromBaseIndex === undefined) continue;
                    const base = core.bases[fromBaseIndex];
                    const minion = base?.minions.find((m: any) => m.uid === minionUid);
                    if (!minion) continue;
                    if (usedMinionUids.has(minionUid)) continue;
                    usedMinionUids.add(minionUid);

                    events.push({
                        type: SU_EVENTS.MINION_DESTROYED,
                        payload: {
                            minionUid,
                            minionDefId: minion.defId,
                            fromBaseIndex,
                            ownerId: minion.owner,
                            destroyerId: playerId,
                            reason: 'titan_the_bride_special_destroy',
                        },
                        timestamp,
                    } as any);
                } else if (effect === 'removeCounter') {
                    const { minionUid, baseIndex: counterBaseIndex } = target as { minionUid: string; baseIndex: number };
                    if (!minionUid || counterBaseIndex === undefined) continue;
                    const base = core.bases[counterBaseIndex];
                    const minion = base?.minions.find((m: any) => m.uid === minionUid);
                    if (!minion || (minion as any).powerCounters <= 0) continue;
                    if (usedMinionUids.has(minionUid)) continue;
                    usedMinionUids.add(minionUid);

                    events.push({
                        type: SU_EVENTS.POWER_COUNTER_REMOVED,
                        payload: {
                            minionUid,
                            baseIndex: counterBaseIndex,
                            amount: 1,
                            reason: 'titan_the_bride_special_remove_counter',
                        },
                        timestamp,
                    } as any);
                }
            }

            // 最后：打出 The Bride 泰坦
            const titanCard = player.titanZone.find(c => c.defId === 'titan_the_bride');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex,
                },
                timestamp,
            });

            return { state, events };
        }
    );

    /**
     * 内部辅助：根据当前步骤为 The Bride Special 创建目标选择交互。
     */
    function createBrideTargetInteraction(
        core: SmashUpCore,
        playerId: string,
        ctx: { effectsOrder: ('placeInBox' | 'destroy' | 'removeCounter')[]; currentIndex: number; targets?: any[] },
        timestamp: number
    ) {
        const effect = ctx.effectsOrder[ctx.currentIndex];
        const usedMinionUid: string | undefined = ctx.targets?.[0]?.minionUid;

        if (effect === 'placeInBox') {
            const player = core.players[playerId];
            if (!player) return null;
            const candidates = [
                ...(player.hand ?? []).filter((c: any) => c.type === 'minion'),
                ...(player.discard ?? []).filter((c: any) => c.type === 'minion'),
            ];
            if (candidates.length === 0) return null;

            const options: PromptOption<{ cardUid: string }> [] = candidates.map((c: any) => ({
                id: c.uid,
                label: c.defId,
                value: { cardUid: c.uid },
            }));

            return createSimpleChoice(
                `the_bride_special_target_box_${timestamp}_${ctx.currentIndex}`,
                playerId,
                '选择要放入盒子的随从（手牌或弃牌堆）',
                options,
                {
                    sourceId: 'mad_scientists_the_bride_special_step_target',
                    targetType: 'card',
                }
            );
        }

        if (effect === 'destroy' || effect === 'removeCounter') {
            const options: PromptOption<{ minionUid: string; baseIndex: number }>[] = [];
            core.bases.forEach((base, bi) => {
                base.minions.forEach((m: any) => {
                    if (m.controller !== playerId) return;
                    if (m.inStasis) return;
                    if (usedMinionUid && m.uid === usedMinionUid) return;
                    if (effect === 'removeCounter' && (!m.powerCounters || m.powerCounters <= 0)) return;

                    options.push({
                        id: m.uid,
                        label: `${m.defId} @ 基地 ${bi + 1}`,
                        value: { minionUid: m.uid, baseIndex: bi },
                    });
                });
            });
            if (options.length === 0) return null;

            return createSimpleChoice(
                `the_bride_special_target_${effect}_${timestamp}_${ctx.currentIndex}`,
                playerId,
                effect === 'destroy'
                    ? '选择要消灭的随从'
                    : '选择要移除+1指示物的随从',
                options,
                {
                    sourceId: 'mad_scientists_the_bride_special_step_target',
                    targetType: 'minion',
                }
            );
        }

        return null;
    }

    // Ancient Lord Special: 打出泰坦
    registerInteractionHandler(
        'vampires_pod_ancient_lord_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const titanCard = player.titanZone.find(c => c.defId === 'titan_ancient_lord');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Ancient Lord Talent: 在已有+1指示物的随从上放置+1指示物
    registerInteractionHandler(
        'vampires_pod_ancient_lord_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { minionUid, baseIndex } = value as {
                minionUid: string;
                baseIndex: number;
            };

            const events: SmashUpEvent[] = [];

            events.push({
                type: SU_EVENTS.POWER_COUNTER_ADDED,
                payload: {
                    playerId,
                    minionUid,
                    baseIndex,
                    amount: 1
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Death on Six Legs Special Step 1: 选择要弃置的手牌
    registerInteractionHandler(
        'giant_ants_death_on_six_legs_special_step1',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid } = value as { cardUid: string };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 弃置手牌
            events.push({
                type: SU_EVENTS.CARDS_DISCARDED,
                payload: {
                    playerId,
                    cardUids: [cardUid]
                },
                timestamp,
            });

            // 创建第二步交互：选择打出泰坦的基地
            const baseOptions = state.core.bases.map((_, i) => ({
                id: `base-${i}`,
                label: `基地 ${i + 1}`,
                value: { baseIndex: i },
            }));

            const interaction = createSimpleChoice(
                `death_on_six_legs_special_step2_${timestamp}`,
                playerId,
                '选择打出泰坦的基地',
                baseOptions,
                {
                    sourceId: 'giant_ants_death_on_six_legs_special',
                    targetType: 'base',
                }
            );

            return {
                state: queueInteraction({ sys: state.sys, core: state.core }, interaction).core,
                events
            };
        }
    );

    // Death on Six Legs Special Step 2: 选择打出泰坦的基地
    registerInteractionHandler(
        'giant_ants_death_on_six_legs_special',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { baseIndex } = value as { baseIndex: number };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            // 打出泰坦到选择的基地
            const titanCard = player.titanZone.find(c => c.defId === 'titan_death_on_six_legs');
            if (!titanCard) return { state, events };

            events.push({
                type: SU_EVENTS.TITAN_PLACED,
                payload: {
                    playerId,
                    titanUid: titanCard.uid,
                    titanDefId: titanCard.defId,
                    baseIndex
                },
                timestamp,
            });

            return { state, events };
        }
    );

    // Death on Six Legs Talent: 打出额外行动
    registerInteractionHandler(
        'giant_ants_death_on_six_legs_talent',
        (state, playerId, value, _iData, _random, timestamp) => {
            const { cardUid } = value as { cardUid: string };
            const events: SmashUpEvent[] = [];
            const player = state.core.players[playerId];

            const card = player.hand.find((c: any) => c.uid === cardUid);
            if (!card || card.type !== 'action') return { state, events };

            events.push({
                type: SU_EVENTS.ACTION_PLAYED,
                payload: {
                    playerId,
                    cardUid,
                    defId: card.defId,
                    isExtraAction: true,
                },
                timestamp,
            });

            return { state, events };
        }
    );
}