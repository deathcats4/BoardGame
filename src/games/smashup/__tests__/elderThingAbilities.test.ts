/**
 * 大杀四方 - 远古之物派系能力测试
 *
 * 覆盖：
 * - elder_thing_byakhee（拜亚基）：有对手随从时抽疯狂卡
 * - elder_thing_mi_go（米-格）：对手抽疯狂卡或你抽牌
 * - elder_thing_insanity（精神错乱）：对手各抽两张疯狂卡
 * - elder_thing_touch_of_madness（疯狂接触）：对手抽疯狂卡 + 你抽牌 + 额外行动
 * - elder_thing_power_of_madness（疯狂之力）：对每个对手分别命名行动→展示手牌→弃复制品→洗弃牌堆回牌库
 * - elder_thing_spreading_horror（传播恐怖）：对手可弃2张非疯狂，否则你从弃牌堆在不同基地特招≤3随从
 * - elder_thing_begin_the_summoning（开始召唤）：弃牌堆随从放牌库顶 + 额外行动
 * - elder_thing_unfathomable_goals（深不可测的目的）：有疯狂卡的对手消灭随从
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { reduce } from '../domain/reducer';
import { SU_COMMANDS, SU_EVENTS, MADNESS_CARD_DEF_ID } from '../domain/types';
import { SMASHUP_FACTION_IDS } from '../domain/ids';
import type {
    SmashUpCore,
    SmashUpEvent,
    PlayerState,
    MinionOnBase,
    CardInstance,
} from '../domain/types';
import { initAllAbilities, resetAbilityInit } from '../abilities';
import { resolveAbility } from '../domain/abilityRegistry';
import { clearRegistry } from '../domain/abilityRegistry';
import { clearBaseAbilityRegistry } from '../domain/baseAbilities';
import { clearInteractionHandlers, getInteractionHandler } from '../domain/abilityInteractionHandlers';
import { applyEvents, makeMatchState as makeMatchStateFromHelpers } from './helpers';
import { runCommand } from './testRunner';
import type { MatchState, RandomFn } from '../../../engine/types';

beforeAll(() => {
    clearRegistry();
    clearBaseAbilityRegistry();
    clearInteractionHandlers();
    resetAbilityInit();
    initAllAbilities();
});

// ============================================================================
// 辅助函数
// ============================================================================

function makeMinion(uid: string, defId: string, controller: string, power: number, owner?: string): MinionOnBase {
    return {
        uid, defId, controller, owner: owner ?? controller,
        basePower: power, powerCounters: 0, powerModifier: 0, tempPowerModifier: 0, talentUsed: false, attachedActions: [],
    };
}

function makeCard(uid: string, defId: string, type: 'minion' | 'action', owner: string): CardInstance {
    return { uid, defId, type, owner };
}

function makePlayer(id: string, overrides?: Partial<PlayerState>): PlayerState {
    return {
        id, vp: 0, hand: [], deck: [], discard: [],
        minionsPlayed: 0, minionLimit: 1, actionsPlayed: 0, actionLimit: 1,
        factions: [SMASHUP_FACTION_IDS.ELDER_THINGS, 'test_b'] as [string, string],
        ...overrides,
    };
}

function makeState(overrides?: Partial<SmashUpCore>): SmashUpCore {
    return {
        players: { '0': makePlayer('0'), '1': makePlayer('1') },
        turnOrder: ['0', '1'],
        currentPlayerIndex: 0,
        bases: [],
        baseDeck: [],
        turnNumber: 1,
        nextUid: 100,
        madnessDeck: Array.from({ length: 10 }, (_, i) => `madness_base_${i}`),
        ...overrides,
    };
}

function makeMatchState(core: SmashUpCore): MatchState<SmashUpCore> {
    return makeMatchStateFromHelpers(core);
}

const defaultRandom: RandomFn = {
    shuffle: (arr: any[]) => [...arr],
    random: () => 0.5,
    d: (_max: number) => 1,
    range: (_min: number, _max: number) => _min,
};

let lastMatchState: MatchState<SmashUpCore>;

function execPlayMinion(state: SmashUpCore, playerId: string, cardUid: string, baseIndex: number, random?: RandomFn): SmashUpEvent[] {
    const ms = makeMatchState(state);
    const result = runCommand(ms, {
        type: SU_COMMANDS.PLAY_MINION, playerId,
        payload: { cardUid, baseIndex },
    } as any, random ?? defaultRandom);
    lastMatchState = result.finalState;
    return result.events as SmashUpEvent[];
}

function execPlayAction(state: SmashUpCore, playerId: string, cardUid: string, targetBaseIndex?: number, random?: RandomFn): SmashUpEvent[] {
    const ms = makeMatchState(state);
    const result = runCommand(ms, {
        type: SU_COMMANDS.PLAY_ACTION, playerId,
        payload: { cardUid, targetBaseIndex },
    } as any, random ?? defaultRandom);
    lastMatchState = result.finalState;
    return result.events as SmashUpEvent[];
}

function getLastInteractions(): any[] {
    const interaction = (lastMatchState?.sys as any)?.interaction;
    if (!interaction) return [];
    const list: any[] = [];
    if (interaction.current) list.push(interaction.current);
    if (interaction.queue?.length) list.push(...interaction.queue);
    return list;
}

function applyEvents(state: SmashUpCore, events: SmashUpEvent[]): SmashUpCore {
    return events.reduce((s, e) => reduce(s, e), state);
}

// ============================================================================
// 拜亚基
// ============================================================================

describe('远古之物派系能力', () => {
    describe('elder_thing_byakhee（拜亚基：每个在此基地有随从的对手各抽一张疯狂卡）', () => {
        it('基地有对手随从时：该对手抽一张疯狂卡', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('m1', 'elder_thing_byakhee', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                bases: [{
                    defId: 'b1',
                    minions: [makeMinion('opp1', 'test', '1', 3, { powerModifier: 0 })],
                    ongoingActions: [],
                }],
            });

            const events = execPlayMinion(state, '0', 'm1', 0);
            const madnessEvents = events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN);
            expect(madnessEvents.length).toBe(1);
            expect((madnessEvents[0] as any).payload.playerId).toBe('1');
            expect((madnessEvents[0] as any).payload.count).toBe(1);
        });

        it('基地无对手随从时不抽疯狂卡', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('m1', 'elder_thing_byakhee', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                bases: [{ defId: 'b1', minions: [], ongoingActions: [] }],
            });

            const events = execPlayMinion(state, '0', 'm1', 0);
            const madnessEvents = events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN);
            expect(madnessEvents.length).toBe(0);
        });

        it('疯狂牌库为空时不抽', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('m1', 'elder_thing_byakhee', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                bases: [{
                    defId: 'b1',
                    minions: [makeMinion('opp1', 'test', '1', 3, { powerModifier: 0 })],
                    ongoingActions: [],
                }],
                madnessDeck: [],
            });

            const events = execPlayMinion(state, '0', 'm1', 0);
            const madnessEvents = events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN);
            expect(madnessEvents.length).toBe(0);
        });

        it('多个对手在此基地各有随从：每个对手各抽一张疯狂卡', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('m1', 'elder_thing_byakhee', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                    '2': makePlayer('2'),
                },
                turnOrder: ['0', '1', '2'],
                bases: [{
                    defId: 'b1',
                    minions: [
                        makeMinion('p1m', 'test', '1', 3, { powerModifier: 0 }),
                        makeMinion('p2m', 'test', '2', 2, { powerModifier: 0 }),
                    ],
                    ongoingActions: [],
                }],
            });

            const events = execPlayMinion(state, '0', 'm1', 0);
            const madnessEvents = events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN) as any[];
            expect(madnessEvents.length).toBe(2);
            const pids = madnessEvents.map(e => e.payload.playerId).sort();
            expect(pids).toEqual(['1', '2']);
        });
    });

    describe('elder_thing_mi_go（米-格：对手抽疯狂卡或你抽牌）', () => {
        it('创建交互让对手选择是否抽疯狂卡', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('m1', 'elder_thing_mi_go', 'minion', '0')],
                        deck: [makeCard('d1', 'test', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                bases: [{ defId: 'b1', minions: [], ongoingActions: [] }],
            });

            const events = execPlayMinion(state, '0', 'm1', 0);
            // 不再直接产生疯狂卡事件，而是创建交互
            const interactions = getLastInteractions();
            expect(interactions.length).toBeGreaterThanOrEqual(1);
            const miGoInteraction = interactions.find(i => i.data?.sourceId === 'elder_thing_mi_go');
            expect(miGoInteraction).toBeDefined();
            expect(miGoInteraction.playerId).toBe('1'); // 对手选择
            expect(miGoInteraction?.data?.targetType).toBe('button');
        });

        it('对手选择抽疯狂卡时产生疯狂卡事件', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('m1', 'elder_thing_mi_go', 'minion', '0')],
                        deck: [makeCard('d1', 'test', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                bases: [{ defId: 'b1', minions: [], ongoingActions: [] }],
            });
            const ms = makeMatchState(state);
            const handler = getInteractionHandler('elder_thing_mi_go');
            expect(handler).toBeDefined();
            const result = handler!(ms, '1', { choice: 'draw_madness' }, {
                continuationContext: { casterPlayerId: '0', opponents: ['1'], opponentIdx: 0, drewMadnessCount: 0 },
            }, defaultRandom, 0);
            expect(result).toBeDefined();
            const madnessEvents = result!.events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN);
            expect(madnessEvents.length).toBe(1);
            expect((madnessEvents[0] as any).payload.playerId).toBe('1');
        });

        it('对手拒绝时施法者抽一张牌', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        deck: [makeCard('d1', 'test', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                bases: [{ defId: 'b1', minions: [], ongoingActions: [] }],
            });
            const ms = makeMatchState(state);
            const handler = getInteractionHandler('elder_thing_mi_go');
            expect(handler).toBeDefined();
            const result = handler!(ms, '1', { choice: 'decline' }, {
                continuationContext: { casterPlayerId: '0', opponents: ['1'], opponentIdx: 0, drewMadnessCount: 0 },
            }, defaultRandom, 0);
            expect(result).toBeDefined();
            const drawEvents = result!.events.filter(e => e.type === SU_EVENTS.CARDS_DRAWN);
            const selfDraw = drawEvents.filter(e => (e as any).payload.playerId === '0');
            expect(selfDraw.length).toBe(1);
        });

        it('若没有任何对手抽疯狂卡：链结束时应创建“放置指示物/跳过”的交互', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        deck: [makeCard('d1', 'test', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                turnOrder: ['0', '1'],
                bases: [{ defId: 'b1', minions: [makeMinion('t1', 'test', '1', 2, { powerModifier: 0 })], ongoingActions: [] }],
            });
            const ms = makeMatchState(state);
            const handler = getInteractionHandler('elder_thing_mi_go');
            expect(handler).toBeDefined();

            const result = handler!(ms, '1', { choice: 'decline' }, {
                continuationContext: { casterPlayerId: '0', opponents: ['1'], opponentIdx: 0, drewMadnessCount: 0 },
            }, defaultRandom, 0);

            const current = (result!.state?.sys as any)?.interaction?.current;
            expect(current?.data?.sourceId).toBe('elder_thing_mi_go_counter_prompt');
            expect(current?.playerId).toBe('0');
        });

        it('若至少一名对手抽了疯狂卡：链结束不应创建“放置指示物”交互', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        deck: [makeCard('d1', 'test', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
                turnOrder: ['0', '1'],
                bases: [{ defId: 'b1', minions: [], ongoingActions: [] }],
            });
            const ms = makeMatchState(state);
            const handler = getInteractionHandler('elder_thing_mi_go');
            expect(handler).toBeDefined();

            const result = handler!(ms, '1', { choice: 'draw_madness' }, {
                continuationContext: { casterPlayerId: '0', opponents: ['1'], opponentIdx: 0, drewMadnessCount: 0 },
            }, defaultRandom, 0);

            const current = (result!.state?.sys as any)?.interaction?.current;
            expect(current?.data?.sourceId).not.toBe('elder_thing_mi_go_counter_prompt');
        });
    });

    describe('elder_thing_insanity（精神错乱：对手各抽两张疯狂卡）', () => {
        it('每个对手抽两张疯狂卡', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_insanity', 'action', '0')],
                    }),
                    '1': makePlayer('1'),
                },
            });

            const events = execPlayAction(state, '0', 'a1');
            const madnessEvents = events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN);
            expect(madnessEvents.length).toBe(1);
            expect((madnessEvents[0] as any).payload.playerId).toBe('1');
            expect((madnessEvents[0] as any).payload.count).toBe(2);

            // 进盒子：行动卡移出游戏（不进入弃牌堆）
            const boxed = events.filter(e => e.type === SU_EVENTS.ACTION_BOXED);
            expect(boxed.length).toBe(1);
            const after = applyEvents(state, events);
            expect(after.players['0'].discard.some(c => c.uid === 'a1')).toBe(false);
        });

        it('多个对手各抽两张', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_insanity', 'action', '0')],
                    }),
                    '1': makePlayer('1'),
                    '2': makePlayer('2'),
                },
                turnOrder: ['0', '1', '2'],
            });

            const events = execPlayAction(state, '0', 'a1');
            const madnessEvents = events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN);
            expect(madnessEvents.length).toBe(2);
            expect((madnessEvents[0] as any).payload.playerId).toBe('1');
            expect((madnessEvents[1] as any).payload.playerId).toBe('2');
        });
    });

    describe('elder_thing_touch_of_madness（疯狂接触）', () => {
        it('对手抽疯狂卡 + 你抽牌 + 额外行动', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_touch_of_madness', 'action', '0')],
                        deck: [makeCard('d1', 'test', 'minion', '0')],
                    }),
                    '1': makePlayer('1'),
                },
            });

            const events = execPlayAction(state, '0', 'a1');
            const madnessEvents = events.filter(e => e.type === SU_EVENTS.MADNESS_DRAWN);
            const drawEvents = events.filter(e => e.type === SU_EVENTS.CARDS_DRAWN);
            const limitEvents = events.filter(e => e.type === SU_EVENTS.LIMIT_MODIFIED);

            expect(madnessEvents.length).toBe(1);
            expect((madnessEvents[0] as any).payload.playerId).toBe('1');
            expect(drawEvents.length).toBe(1);
            expect((drawEvents[0] as any).payload.playerId).toBe('0');
            expect(limitEvents.length).toBe(1);
            expect((limitEvents[0] as any).payload.limitType).toBe('action');
        });
    });

    describe('elder_thing_power_of_madness（疯狂之力：命名行动→展示→弃复制品→洗弃牌堆回牌库）', () => {
        it('命名一个确实在对手手牌中的行动：展示手牌 + 弃掉复制品 + 洗弃牌堆回牌库', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_power_of_madness', 'action', '0')],
                    }),
                    '1': makePlayer('1', {
                        hand: [
                            makeCard('h1', 'elder_thing_insanity', 'action', '1'),
                            makeCard('h2', 'test_card', 'minion', '1'),
                            makeCard('h3', 'elder_thing_insanity', 'action', '1'),
                        ],
                        discard: [makeCard('d1', 'old_card', 'action', '1')],
                    }),
                },
            });

            execPlayAction(state, '0', 'a1');
            const handler = getInteractionHandler('elder_thing_power_of_madness');
            expect(handler).toBeDefined();
            const r = handler!(lastMatchState, '0', { namedDefId: 'elder_thing_insanity' }, {
                continuationContext: { casterPlayerId: '0', opponents: ['1'], opponentIdx: 0 },
            }, defaultRandom, 1)!;

            const revealEvents = r.events.filter(e => e.type === SU_EVENTS.REVEAL_HAND);
            const discardEvents = r.events.filter(e => e.type === SU_EVENTS.CARDS_DISCARDED);
            const reshuffleEvents = r.events.filter(e => e.type === SU_EVENTS.DECK_RESHUFFLED);

            expect(revealEvents.length).toBe(1);
            expect(discardEvents.length).toBe(1);
            expect((discardEvents[0] as any).payload.playerId).toBe('1');
            expect((discardEvents[0] as any).payload.cardUids.sort()).toEqual(['h1', 'h3']);
            expect(reshuffleEvents.length).toBe(1);
            expect((reshuffleEvents[0] as any).payload.playerId).toBe('1');
        });

        it('澄清：选择“跳过/命名对手没有的行动”且对手弃牌堆非空：不弃牌但仍洗回牌库', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_power_of_madness', 'action', '0')],
                    }),
                    '1': makePlayer('1', {
                        hand: [makeCard('h1', 'test_card', 'minion', '1')],
                        discard: [makeCard('d1', 'old_card', 'action', '1')],
                    }),
                },
            });

            execPlayAction(state, '0', 'a1');
            const handler = getInteractionHandler('elder_thing_power_of_madness');
            expect(handler).toBeDefined();
            const r = handler!(lastMatchState, '0', { skip: true }, {
                continuationContext: { casterPlayerId: '0', opponents: ['1'], opponentIdx: 0 },
            }, defaultRandom, 1)!;

            const discardEvents = r.events.filter(e => e.type === SU_EVENTS.CARDS_DISCARDED);
            const reshuffleEvents = r.events.filter(e => e.type === SU_EVENTS.DECK_RESHUFFLED);
            expect(discardEvents.length).toBe(0);
            expect(reshuffleEvents.length).toBe(1);
        });
    });

    describe('elder_thing_the_price_of_power onPlay（力量的代价：普通版）', () => {
        it('直接调用能力执行器：所有对手展示手牌并根据疯狂总数创建逐个选择+1指示物的交互链', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0'),
                    '1': makePlayer('1', {
                        hand: [
                            makeCard('h1', MADNESS_CARD_DEF_ID, 'action', '1'),
                            makeCard('h2', 'normal', 'action', '1'),
                        ],
                    }),
                    '2': makePlayer('2', {
                        hand: [
                            makeCard('h3', MADNESS_CARD_DEF_ID, 'action', '2'),
                        ],
                    }),
                },
                bases: [
                    {
                        defId: 'b1',
                        minions: [
                            makeMinion('m1', 'test_minion', '0', 3, { powerModifier: 0 }),
                        ],
                        ongoingActions: [],
                    },
                ],
                turnOrder: ['0', '1', '2'],
            });

            const executor = resolveAbility('elder_thing_the_price_of_power', 'onPlay');
            expect(executor).toBeDefined();

            const ms = makeMatchState(state);
            const result = executor!({
                state,
                matchState: ms,
                playerId: '0',
                cardUid: 'a1',
                defId: 'elder_thing_the_price_of_power',
                baseIndex: undefined,
                random: defaultRandom,
                now: 0,
            } as any);

            const revealEvents = result.events.filter(e => e.type === SU_EVENTS.REVEAL_HAND);
            expect(revealEvents.length).toBe(1);

            const interactions = getLastInteractions();
            const popInteraction = interactions.find(i => i.data?.sourceId === 'elder_thing_the_price_of_power_onplay');
            expect(popInteraction).toBeDefined();
        });
    });

    describe('elder_thing_spreading_horror（传播恐怖：对手可弃2张非疯狂，否则你从弃牌堆在不同基地特招≤3随从）', () => {
        it('对手选择弃2张非疯狂：产生一次弃牌事件，不触发特招', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_spreading_horror', 'action', '0')],
                    }),
                    '1': makePlayer('1', {
                        hand: [
                            makeCard('h1', 'card_a', 'action', '1'),
                            makeCard('h2', 'card_b', 'action', '1'),
                            makeCard('h3', MADNESS_CARD_DEF_ID, 'action', '1'),
                        ],
                    }),
                },
            });

            execPlayAction(state, '0', 'a1');
            const handler = getInteractionHandler('elder_thing_spreading_horror');
            expect(handler).toBeDefined();
            const ms = lastMatchState;
            const result = handler!(ms, '1', [{ cardUid: 'h1' }, { cardUid: 'h2' }], {
                continuationContext: {
                    casterPlayerId: '0',
                    opponents: ['1'],
                    opponentIdx: 0,
                    usedBaseIndices: [],
                },
            }, defaultRandom, 0)!;

            const discardEvents = result.events.filter(e => e.type === SU_EVENTS.CARDS_DISCARDED);
            expect(discardEvents.length).toBe(1);
            expect((discardEvents[0] as any).payload.playerId).toBe('1');
            expect((discardEvents[0] as any).payload.cardUids.sort()).toEqual(['h1', 'h2']);
            // 没有特招
            expect(result.events.some(e => e.type === SU_EVENTS.MINION_PLAYED)).toBe(false);
        });

        it('对手不弃/弃不足2张：施放者可从弃牌堆特招≤3随从到不同基地（base 不重复）', () => {
            const state = makeState({
                bases: [
                    { defId: 'b1', minions: [], ongoingActions: [] },
                    { defId: 'b2', minions: [], ongoingActions: [] },
                ],
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_spreading_horror', 'action', '0')],
                        discard: [
                            makeCard('m1', 'minion_3_power', 'minion', '0'),
                            makeCard('m2', 'minion_3_power', 'minion', '0'),
                        ],
                    }),
                    '1': makePlayer('1', {
                        hand: [makeCard('h1', 'card_a', 'action', '1')], // 只有1张非疯狂 → 无法弃满2张
                    }),
                },
            });

            execPlayAction(state, '0', 'a1');
            const discardHandler = getInteractionHandler('elder_thing_spreading_horror');
            expect(discardHandler).toBeDefined();

            // 对手只选择1张（不足2张）
            discardHandler!(lastMatchState, '1', [{ cardUid: 'h1' }], {
                continuationContext: {
                    casterPlayerId: '0',
                    opponents: ['1'],
                    opponentIdx: 0,
                    usedBaseIndices: [],
                },
            }, defaultRandom, 1)!;

            const summonHandler = getInteractionHandler('elder_thing_spreading_horror_summon');
            expect(summonHandler).toBeDefined();

            // 第一次特招：选 m1，基地 0
            summonHandler!(lastMatchState, '0', { cardUid: 'm1' }, {
                continuationContext: {
                    casterPlayerId: '0',
                    opponents: ['1'],
                    opponentIdx: 0,
                    usedBaseIndices: [],
                },
            }, defaultRandom, 2);

            const chooseBaseHandler = getInteractionHandler('elder_thing_spreading_horror_choose_base');
            expect(chooseBaseHandler).toBeDefined();
            const rBase1 = chooseBaseHandler!(lastMatchState, '0', { baseIndex: 0, cardUid: 'm1' }, {
                continuationContext: {
                    casterPlayerId: '0',
                    opponents: ['1'],
                    opponentIdx: 0,
                    usedBaseIndices: [],
                },
            }, defaultRandom, 3)!;

            const played1 = rBase1.events.filter(e => e.type === SU_EVENTS.MINION_PLAYED);
            expect(played1.length).toBe(1);
            expect((played1[0] as any).payload.baseIndex).toBe(0);

            // 更新后的 usedBaseIndices 应包含 0，再次调用 choose_base 时只能选不同基地
            const rBase2 = chooseBaseHandler!(lastMatchState, '0', { baseIndex: 1, cardUid: 'm2' }, {
                continuationContext: {
                    casterPlayerId: '0',
                    opponents: ['1'],
                    opponentIdx: 0,
                    usedBaseIndices: [0],
                },
            }, defaultRandom, 4)!;
            const played2 = rBase2.events.filter(e => e.type === SU_EVENTS.MINION_PLAYED);
            if (played2.length) {
                expect((played2[0] as any).payload.baseIndex).toBe(1);
            }
        });
    });

    describe('elder_thing_begin_the_summoning（开始召唤）', () => {
        it('单个弃牌堆随从时创建 Prompt', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_begin_the_summoning', 'action', '0')],
                        deck: [makeCard('d1', 'test', 'minion', '0')],
                        discard: [
                            makeCard('disc1', 'test_minion', 'minion', '0'),
                            makeCard('disc2', 'test_action', 'action', '0'),
                        ],
                    }),
                    '1': makePlayer('1'),
                },
            });

            const events = execPlayAction(state, '0', 'a1');
            // 单个弃牌堆随从时创建 Interaction
            const interactions = getLastInteractions();
            expect(interactions.length).toBe(1);
        });

        it('弃牌堆无随从时只给额外行动', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_begin_the_summoning', 'action', '0')],
                        discard: [makeCard('disc1', 'test_action', 'action', '0')],
                    }),
                    '1': makePlayer('1'),
                },
            });

            const events = execPlayAction(state, '0', 'a1');
            const reshuffleEvents = events.filter(e => e.type === SU_EVENTS.DECK_RESHUFFLED);
            const limitEvents = events.filter(e => e.type === SU_EVENTS.LIMIT_MODIFIED);

            expect(reshuffleEvents.length).toBe(0);
            expect(limitEvents.length).toBe(1);
        });
    });

    describe('elder_thing_unfathomable_goals（深不可测的目的）', () => {
        it('有疯狂卡的对手多个随从时创建 Prompt，且先展示手牌', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_unfathomable_goals', 'action', '0')],
                    }),
                    '1': makePlayer('1', {
                        hand: [makeCard('h1', MADNESS_CARD_DEF_ID, 'action', '1')],
                    }),
                },
                bases: [{
                    defId: 'b1',
                    minions: [
                        makeMinion('m1', 'test', '1', 2, { powerModifier: 0 }),
                        makeMinion('m2', 'test', '1', 5),
                    ],
                    ongoingActions: [],
                }],
            });

            const events = execPlayAction(state, '0', 'a1');
            // 展示对手手牌给所有人看
            const revealEvents = events.filter(e => e.type === SU_EVENTS.REVEAL_HAND);
            expect(revealEvents.length).toBe(1);
            expect((revealEvents[0] as any).payload.targetPlayerId).toBe('1');
            expect((revealEvents[0] as any).payload.viewerPlayerId).toBe('all');
            // 多个随从 → 创建 Prompt 让对手选择消灭哪个
            const interactions = getLastInteractions();
            expect(interactions.length).toBe(1);
            expect(interactions[0]?.data?.sourceId).toBe('elder_thing_unfathomable_goals');
        });

        it('有疯狂卡的对手只有一个随从时直接消灭，且先展示手牌', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_unfathomable_goals', 'action', '0')],
                    }),
                    '1': makePlayer('1', {
                        hand: [makeCard('h1', MADNESS_CARD_DEF_ID, 'action', '1')],
                    }),
                },
                bases: [{
                    defId: 'b1',
                    minions: [
                        makeMinion('m1', 'test', '1', 2),
                    ],
                    ongoingActions: [],
                }],
            });

            const events = execPlayAction(state, '0', 'a1');
            // 展示对手手牌
            const revealEvents = events.filter(e => e.type === SU_EVENTS.REVEAL_HAND);
            expect(revealEvents.length).toBe(1);
            expect((revealEvents[0] as any).payload.viewerPlayerId).toBe('all');
            const destroyEvents = events.filter(e => e.type === SU_EVENTS.MINION_DESTROYED);
            expect(destroyEvents.length).toBe(1);
            expect((destroyEvents[0] as any).payload.minionUid).toBe('m1');
        });

        it('无疯狂卡的对手不受影响，但仍展示手牌', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_unfathomable_goals', 'action', '0')],
                    }),
                    '1': makePlayer('1', {
                        hand: [makeCard('h1', 'test_card', 'minion', '1')],
                    }),
                },
                bases: [{
                    defId: 'b1',
                    minions: [makeMinion('m1', 'test', '1', 2)],
                    ongoingActions: [],
                }],
            });

            const events = execPlayAction(state, '0', 'a1');
            // 即使无疯狂卡也要展示手牌（规则要求）
            const revealEvents = events.filter(e => e.type === SU_EVENTS.REVEAL_HAND);
            expect(revealEvents.length).toBe(1);
            const destroyEvents = events.filter(e => e.type === SU_EVENTS.MINION_DESTROYED);
            expect(destroyEvents.length).toBe(0);
        });

        it('有疯狂卡但无随从的对手不产生消灭事件，但展示手牌', () => {
            const state = makeState({
                players: {
                    '0': makePlayer('0', {
                        hand: [makeCard('a1', 'elder_thing_unfathomable_goals', 'action', '0')],
                    }),
                    '1': makePlayer('1', {
                        hand: [makeCard('h1', MADNESS_CARD_DEF_ID, 'action', '1')],
                    }),
                },
                bases: [{ defId: 'b1', minions: [], ongoingActions: [] }],
            });

            const events = execPlayAction(state, '0', 'a1');
            // 展示手牌
            const revealEvents = events.filter(e => e.type === SU_EVENTS.REVEAL_HAND);
            expect(revealEvents.length).toBe(1);
            const destroyEvents = events.filter(e => e.type === SU_EVENTS.MINION_DESTROYED);
            expect(destroyEvents.length).toBe(0);
        });
    });
});
