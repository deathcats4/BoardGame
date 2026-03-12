/**
 * Task 15 单元测试：泰坦能力定义和交互处理器
 * 
 * 测试所有 14 个 POD 泰坦的能力定义和交互处理器是否正确注册和工作
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { registerAbility, resolveAbility, clearRegistry } from '../abilityRegistry';
import { registerInteractionHandler, getInteractionHandler, clearInteractionHandlers } from '../abilityInteractionHandlers';
import { registerTitanAbilities, registerTitanInteractionHandlers } from '../../abilities/titans';
import type { SmashUpCore, SmashUpEvent } from '../types';
import { MADNESS_CARD_DEF_ID } from '../types';
import type { MatchState } from '../../../../engine/types';
import { SU_EVENT_TYPES as SU_EVENTS } from '../events';
import { postProcessSystemEvents } from '../index';

describe('Task 15: 泰坦能力定义和交互处理器', () => {
    beforeEach(() => {
        clearRegistry();
        clearInteractionHandlers();
        registerTitanAbilities();
        registerTitanInteractionHandlers();
    });

    // 辅助函数：创建测试状态
    function createTestState(): MatchState<SmashUpCore> {
        return {
            sys: {} as any,
            core: {
                players: {
                    '0': {
                        hand: [],
                        discard: [],
                        deck: [],
                        titanZone: [
                            {
                                uid: 'titan-1',
                                defId: 'titan_fort_titanosaurus',
                                type: 'titan',
                                factionId: 'dinosaurs',
                                abilities: [],
                            },
                        ],
                        activeTitan: null,
                    },
                    '1': {
                        hand: [],
                        discard: [],
                        deck: [],
                        titanZone: [],
                        activeTitan: null,
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        breakpoint: 10,
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'test_minion',
                                controller: '0',
                                owner: '0',
                                basePower: 3,
                                attachedActions: [],
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                        ],
                        ongoingActions: [],
                    },
                ],
            } as any,
        };
    }

    // ========================================================================
    // 能力定义注册测试
    // ========================================================================

    describe('能力定义注册', () => {
        const titans = [
            { defId: 'titan_fort_titanosaurus', name: 'Fort Titanosaurus' },
            { defId: 'titan_arcane_protector', name: 'Arcane Protector' },
            { defId: 'titan_the_kraken', name: 'The Kraken' },
            { defId: 'titan_invisible_ninja', name: 'Invisible Ninja', noTalent: true }, // 只有 Special 1/2 + Ongoing
            { defId: 'titan_killer_kudzu', name: 'Killer Kudzu' },
            { defId: 'titan_creampuff_man', name: 'Creampuff Man' },
            { defId: 'titan_major_ursa', name: 'Major Ursa' },
            { defId: 'titan_dagon', name: 'Dagon' },
            { defId: 'titan_cthulhu', name: 'Cthulhu' },
            { defId: 'titan_big_funny_giant', name: 'Big Funny Giant', noTalent: true }, // 只有 Special 1/2 + Ongoing
            { defId: 'titan_great_wolf_spirit', name: 'Great Wolf Spirit' },
            { defId: 'titan_the_bride', name: 'The Bride' },
            { defId: 'titan_ancient_lord', name: 'Ancient Lord' },
            { defId: 'titan_death_on_six_legs', name: 'Death on Six Legs' },
        ];

        it.each(titans)('$name 应该注册 special 能力', ({ defId }) => {
            const executor = resolveAbility(defId, 'special');
            expect(executor).toBeDefined();
        });

        it.each(titans)('$name 应该注册 ongoing 能力', ({ defId }) => {
            const executor = resolveAbility(defId, 'ongoing');
            expect(executor).toBeDefined();
        });

        it.each(titans.filter(t => !t.noTalent))('$name 应该注册 talent 能力', ({ defId }) => {
            const executor = resolveAbility(defId, 'talent');
            expect(executor).toBeDefined();
        });

        it('Invisible Ninja 没有 talent 能力（只有 Special 1/2 + Ongoing）', () => {
            const executor = resolveAbility('titan_invisible_ninja', 'talent');
            expect(executor).toBeUndefined();
        });

        it('Big Funny Giant 没有 talent 能力（只有 Special 1/2 + Ongoing）', () => {
            const executor = resolveAbility('titan_big_funny_giant', 'talent');
            expect(executor).toBeUndefined();
        });
    });

    // ========================================================================
    // 交互处理器注册测试
    // ========================================================================

    describe('交互处理器注册', () => {
        const handlers = [
            'titan_fort_titanosaurus_special',
            'titan_arcane_protector_special',
            'titan_the_kraken_special',
            'titan_the_kraken_talent',
            'ninja_invisible_ninja_special1',
            'ninja_invisible_ninja_special2',
            'plant_killer_kudzu_special2',
            'plant_killer_kudzu_talent',
            'ghost_creampuff_man_special',
            'ghost_creampuff_man_talent',
            'bear_cavalry_major_ursa_special',
            'bear_cavalry_major_ursa_ongoing',
            'bear_cavalry_major_ursa_talent',
            'innsmouth_dagon_special',
            'innsmouth_dagon_talent',
            'cthulhu_minions_cthulhu_special',
            'cthulhu_minions_cthulhu_talent',
            'tricksters_pod_big_funny_giant_special_1',
            'werewolves_great_wolf_spirit_special',
            'werewolves_great_wolf_spirit_ongoing',
            'werewolves_great_wolf_spirit_talent',
            'mad_scientists_the_bride_special',
            'vampires_pod_ancient_lord_special',
            'vampires_pod_ancient_lord_talent',
            'giant_ants_death_on_six_legs_special',
            'giant_ants_death_on_six_legs_talent',
        ];

        it.each(handlers)('应该注册交互处理器: %s', (handlerId) => {
            const handler = getInteractionHandler(handlerId);
            expect(handler).toBeDefined();
        });
    });

    // ========================================================================
    // 交互处理器功能测试（示例）
    // ========================================================================

    describe('交互处理器功能测试', () => {
        it('Fort Titanosaurus Special: 消灭随从并打出泰坦', () => {
            const handler = getInteractionHandler('titan_fort_titanosaurus_special');
            expect(handler).toBeDefined();

            const state = createTestState();
            const result = handler!(
                state,
                '0',
                { minionUid: 'minion-1', baseIndex: 0, power: 3 },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(3);
            expect(result.events[0].type).toBe(SU_EVENTS.MINION_DESTROYED);
            expect(result.events[1].type).toBe(SU_EVENTS.TITAN_PLACED);
            expect(result.events[2].type).toBe(SU_EVENTS.TITAN_POWER_TOKEN_ADDED);
        });

        describe('Fort Titanosaurus Special 前置条件', () => {
            function createFortSpecialState(): MatchState<SmashUpCore> {
                return {
                    sys: {
                        phase: 'playCards',
                        interaction: {
                            current: null,
                            queue: [],
                        },
                    } as any,
                    core: {
                        turnOrder: ['0', '1'],
                        currentPlayerIndex: 0,
                        players: {
                            '0': {
                                hand: [],
                                discard: [],
                                deck: [],
                                titanZone: [
                                    {
                                        uid: 'titan-1',
                                        defId: 'titan_fort_titanosaurus',
                                        type: 'titan',
                                        factionId: 'dinosaurs',
                                        abilities: [],
                                    },
                                ],
                                activeTitan: null,
                                mainPhaseMinionsPlayedThisTurn: 0,
                            },
                            '1': {
                                hand: [],
                                discard: [],
                                deck: [],
                                titanZone: [],
                                activeTitan: null,
                            },
                        },
                        bases: [
                            {
                                defId: 'base_test',
                                breakpoint: 10,
                                minions: [
                                    {
                                        uid: 'minion-1',
                                        defId: 'test_minion',
                                        controller: '0',
                                        owner: '0',
                                        basePower: 3,
                                        attachedActions: [],
                                        powerCounters: 0,
                                        powerModifier: 0,
                                        tempPowerModifier: 0,
                                    },
                                ],
                                ongoingActions: [],
                            },
                        ],
                    } as any,
                };
            }

            it('在 Play Cards 阶段且本阶段未打出随从时可以创建交互', () => {
                const executor = resolveAbility('titan_fort_titanosaurus', 'special');
                expect(executor).toBeDefined();

                const state = createFortSpecialState();
                const result = executor!({
                    state: state.core,
                    matchState: state,
                    playerId: '0',
                    random: () => 0.5,
                    now: 1000,
                } as any);

                expect(result.events).toEqual([]);
                expect(result.matchState).toBeDefined();
            });

            it('本回合在 Play Cards 阶段已打出随从时不会再创建交互', () => {
                const executor = resolveAbility('titan_fort_titanosaurus', 'special');
                expect(executor).toBeDefined();

                const state = createFortSpecialState();
                // 模拟本回合已经在 Play Cards 阶段打出过随从
                (state.core.players['0'] as any).mainPhaseMinionsPlayedThisTurn = 1;

                const result = executor!({
                    state: state.core,
                    matchState: state,
                    playerId: '0',
                    random: () => 0.5,
                    now: 1000,
                } as any);

                expect(result.events).toEqual([]);
                expect(result.matchState).toBeUndefined();
            });

            it('已有其它泰坦在场时 Special 不会生效', () => {
                const executor = resolveAbility('titan_fort_titanosaurus', 'special');
                expect(executor).toBeDefined();

                const state = createFortSpecialState();
                // 给玩家放置一个已在场的泰坦（可以是 Fort 或其它泰坦）
                (state.core.players['0'] as any).activeTitan = {
                    titanUid: 'titan-active',
                    baseIndex: 0,
                    powerTokens: 0,
                    defId: 'titan_arcane_protector',
                };

                const result = executor!({
                    state: state.core,
                    matchState: state,
                    playerId: '0',
                    random: () => 0.5,
                    now: 1000,
                } as any);

                expect(result.events).toEqual([]);
                expect(result.matchState).toBeUndefined();
            });
        });

        it('Arcane Protector Special: 打出泰坦', () => {
            const handler = getInteractionHandler('titan_arcane_protector_special');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].titanZone[0].defId = 'titan_arcane_protector';

            const result = handler!(
                state,
                '0',
                { baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe(SU_EVENTS.TITAN_PLACED);
            expect(result.events[0].payload).toMatchObject({
                playerId: '0',
                titanUid: 'titan-1',
                titanDefId: 'titan_arcane_protector',
                baseIndex: 0,
            });
        });

        it('The Kraken Talent: 移动泰坦并给对手随从-1战斗力', () => {
            const handler = getInteractionHandler('titan_the_kraken_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 0,
                defId: 'titan_the_kraken',
            };
            // 在目的基地 1 放置两个随从：一个属于玩家0（不应被减力），一个属于玩家1（应被减力）
            state.core.bases.push({
                defId: 'base_test',
                breakpoint: 10,
                minions: [
                    {
                        uid: 'ally-1',
                        defId: 'test_minion_ally',
                        controller: '0',
                        owner: '0',
                        basePower: 3,
                        attachedActions: [],
                        powerCounters: 0,
                        powerModifier: 0,
                        tempPowerModifier: 0,
                    },
                    {
                        uid: 'enemy-1',
                        defId: 'test_minion_enemy',
                        controller: '1',
                        owner: '1',
                        basePower: 2,
                        attachedActions: [],
                        powerCounters: 0,
                        powerModifier: 0,
                        tempPowerModifier: 0,
                    },
                ],
                ongoingActions: [],
            } as any);

            const result = handler!(
                state,
                '0',
                { baseIndex: 1 },
                {} as any,
                () => 0.5,
                1000
            );

            // 事件应包含一次 TITAN_MOVED 和一次针对敌方随从的 PERMANENT_POWER_ADDED
            expect(result.events.some(e => e.type === SU_EVENTS.TITAN_MOVED)).toBe(true);
            const debuffEvents = result.events.filter(e => e.type === SU_EVENTS.PERMANENT_POWER_ADDED);
            expect(debuffEvents).toHaveLength(1);
            expect(debuffEvents[0].payload).toMatchObject({
                minionUid: 'enemy-1',
                baseIndex: 1,
                amount: -1,
                reason: 'titan_the_kraken_talent',
            });
        });

        describe('Fort Titanosaurus Ongoing and/or 交互', () => {
            it('可以只选择泰坦、只选择随从或同时选择两者', () => {
                const handler = getInteractionHandler('titan_fort_titanosaurus_ongoing');
                expect(handler).toBeDefined();

                const baseState = createTestState();
                // 给玩家放置 Fort Titanosaurus
                (baseState.core.players['0'] as any).activeTitan = {
                    titanUid: 'titan-1',
                    baseIndex: 0,
                    powerTokens: 0,
                    defId: 'titan_fort_titanosaurus',
                };

                // 1) 只放到泰坦
                const onlyTitan = handler!(
                    baseState,
                    '0',
                    { placeOnTitan: true },
                    {} as any,
                    () => 0.5,
                    1000
                );
                expect(onlyTitan.events.some(e => e.type === SU_EVENTS.TITAN_POWER_TOKEN_ADDED)).toBe(true);
                expect(onlyTitan.events.some(e => e.type === SU_EVENTS.POWER_COUNTER_ADDED)).toBe(false);

                // 2) 只放到随从
                const onlyMinion = handler!(
                    baseState,
                    '0',
                    { placeOnTitan: false, minionUid: 'minion-1', baseIndex: 0 },
                    {} as any,
                    () => 0.5,
                    1000
                );
                expect(onlyMinion.events.some(e => e.type === SU_EVENTS.TITAN_POWER_TOKEN_ADDED)).toBe(false);
                expect(onlyMinion.events.some(e => e.type === SU_EVENTS.POWER_COUNTER_ADDED)).toBe(true);

                // 3) 同时放到泰坦和随从
                const both = handler!(
                    baseState,
                    '0',
                    { placeOnTitan: true, minionUid: 'minion-1', baseIndex: 0 },
                    {} as any,
                    () => 0.5,
                    1000
                );
                const titanAdded = both.events.filter(e => e.type === SU_EVENTS.TITAN_POWER_TOKEN_ADDED);
                const minionAdded = both.events.filter(e => e.type === SU_EVENTS.POWER_COUNTER_ADDED);
                expect(titanAdded.length).toBe(1);
                expect(minionAdded.length).toBe(1);
            });
        });

        it('Invisible Ninja Special 1: 弃牌打出泰坦', () => {
            const handler = getInteractionHandler('ninja_invisible_ninja_special1');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].hand = [
                { uid: 'card-1', defId: 'test_card', type: 'action' } as any,
            ];
            state.core.players['0'].titanZone[0].defId = 'titan_invisible_ninja';

            const result = handler!(
                state,
                '0',
                { cardUid: 'card-1', baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            // 应该生成2个事件：1x CARDS_DISCARDED + 1x TITAN_PLACED
            expect(result.events.length).toBeGreaterThanOrEqual(2);
            const discardEvents = result.events.filter(e => e.type === SU_EVENTS.CARDS_DISCARDED);
            const placeEvent = result.events.find(e => e.type === SU_EVENTS.TITAN_PLACED);
            expect(discardEvents).toHaveLength(1);
            expect(placeEvent).toBeDefined();
        });

        it('Major Ursa Talent: 二选一 - 给本基地随从+1指示物 或 移动泰坦', () => {
            const handler = getInteractionHandler('bear_cavalry_major_ursa_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            (state.core.players['0'] as any).activeTitan = {
                titanUid: 'titan-1',
                defId: 'titan_major_ursa',
                baseIndex: 0,
                powerTokens: 2,
            };
            state.core.bases.push({
                defId: 'base_test_2',
                breakpoint: 10,
                minions: [],
                ongoingActions: [],
            } as any);

            // 选项 A: 移动泰坦
            const moveResult = handler!(
                state,
                '0',
                { mode: 'move', toBaseIndex: 1 },
                {} as any,
                () => 0.5,
                1000
            );
            expect(moveResult.events).toHaveLength(1);
            expect(moveResult.events[0].type).toBe(SU_EVENTS.TITAN_MOVED);
            expect(moveResult.events[0].payload).toMatchObject({
                playerId: '0',
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 1,
            });

            // 选项 B: 给本基地随从 +1 指示物
            const counterResult = handler!(
                state,
                '0',
                { mode: 'counter', minionUid: 'minion-1' },
                {} as any,
                () => 0.5,
                1000
            );
            expect(counterResult.events).toHaveLength(1);
            expect(counterResult.events[0].type).toBe(SU_EVENTS.POWER_COUNTER_ADDED);
            expect(counterResult.events[0].payload).toMatchObject({
                minionUid: 'minion-1',
                baseIndex: 0,
                amount: 1,
            });
        });
    });

    // ========================================================================
    // 更多交互处理器功能测试
    // ========================================================================

    describe('更多交互处理器功能测试', () => {
        it('Killer Kudzu Talent: 从弃牌堆打出随从（不消耗正常随从额度，并触发 TITAN_REMOVED）', () => {
            const handler = getInteractionHandler('plant_killer_kudzu_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 3,
            };
            state.core.players['0'].discard = [
                { uid: 'minion-2', defId: 'test_minion_2', type: 'minion', power: 2 } as any,
                { uid: 'minion-3', defId: 'test_minion_3', type: 'minion', power: 3 } as any,
                { uid: 'minion-4', defId: 'test_minion_4', type: 'minion', power: 4 } as any,
            ];

            const result = handler!(
                state,
                '0',
                { cardUid: 'minion-2', baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            // 应该生成2个事件：TITAN_REMOVED + 额外随从打出（不消耗正常随从额度）
            expect(result.events).toHaveLength(2);
            expect(result.events[0].type).toBe(SU_EVENTS.TITAN_REMOVED);
            expect(result.events[1].type).toBe(SU_EVENTS.MINION_PLAYED);
            expect(result.events[1].payload).toMatchObject({
                cardUid: 'minion-2',
                baseIndex: 0,
                fromDiscard: true,
                consumesNormalLimit: false,
            });
        });

        it('Dagon Special: 打出泰坦到有同名随从的基地', () => {
            const handler = getInteractionHandler('innsmouth_dagon_special');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].titanZone[0].defId = 'titan_dagon';
            state.core.bases[0].minions.push({
                uid: 'minion-2',
                defId: 'test_minion',
                controller: '0',
                owner: '0',
                basePower: 3,
                attachedActions: [],
                powerCounters: 0,
                powerModifier: 0,
                tempPowerModifier: 0,
            } as any);

            const result = handler!(
                state,
                '0',
                { baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe(SU_EVENTS.TITAN_PLACED);
            expect(result.events[0].payload).toMatchObject({
                playerId: '0',
                titanDefId: 'titan_dagon',
                baseIndex: 0,
            });
        });

        it('Dagon Talent: 在泰坦所在基地打出额外随从', () => {
            const handler = getInteractionHandler('innsmouth_dagon_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 0,
                defId: 'titan_dagon',
            } as any;
            state.core.players['0'].hand = [
                { uid: 'minion-2', defId: 'test_minion_2', type: 'minion', power: 3 } as any,
            ];

            const result = handler!(
                state,
                '0',
                { cardUid: 'minion-2', baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe(SU_EVENTS.MINION_PLAYED);
            expect(result.events[0].payload).toMatchObject({
                playerId: '0',
                cardUid: 'minion-2',
                defId: 'test_minion_2',
                baseIndex: 0,
                power: 3,
                isExtra: true,
            });
        });

        it('Ancient Lord Special: 打出泰坦', () => {
            const handler = getInteractionHandler('vampires_pod_ancient_lord_special');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].titanZone[0].defId = 'titan_ancient_lord';

            const result = handler!(
                state,
                '0',
                { baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe(SU_EVENTS.TITAN_PLACED);
            expect(result.events[0].payload).toMatchObject({
                playerId: '0',
                titanDefId: 'titan_ancient_lord',
                baseIndex: 0,
            });
        });

        it('Ancient Lord Talent: 在已有指示物的随从上放置指示物', () => {
            const handler = getInteractionHandler('vampires_pod_ancient_lord_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 0,
            };
            state.core.bases[0].minions[0].powerCounters = 1;

            const result = handler!(
                state,
                '0',
                { minionUid: 'minion-1', baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe(SU_EVENTS.POWER_COUNTER_ADDED);
            expect(result.events[0].payload).toMatchObject({
                minionUid: 'minion-1',
                amount: 1,
            });
        });

        it('Death on Six Legs Talent: 打出额外行动', () => {
            const handler = getInteractionHandler('giant_ants_death_on_six_legs_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].hand = [
                { uid: 'action-1', defId: 'test_action', type: 'action' } as any,
            ];

            const result = handler!(
                state,
                '0',
                { cardUid: 'action-1' },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe(SU_EVENTS.ACTION_PLAYED);
            expect(result.events[0].payload).toMatchObject({
                cardUid: 'action-1',
                isExtraAction: true,
            });
        });

        it('Death on Six Legs Ongoing（destroy 路径）：选择“是”时先转移指示物再重放 MINION_DESTROYED', () => {
            const handler = getInteractionHandler('giant_ants_death_on_six_legs_ongoing');
            expect(handler).toBeDefined();

            const core: SmashUpCore = {
                players: {
                    '0': {
                        id: '0',
                        vp: 0,
                        hand: [],
                        deck: [],
                        discard: [],
                        minionsPlayed: 0,
                        minionLimit: 1,
                        actionsPlayed: 0,
                        actionLimit: 1,
                        factions: ['', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-death',
                            defId: 'titan_death_on_six_legs',
                            baseIndex: 0,
                            powerTokens: 0,
                        } as any,
                    } as any,
                },
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                bases: [
                    {
                        defId: 'base_test',
                        breakpoint: 10,
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'test_minion',
                                controller: '0',
                                owner: '0',
                                basePower: 2,
                                attachedActions: [],
                                powerCounters: 2,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            } as any,
                        ],
                        ongoingActions: [],
                    } as any,
                ],
            } as any;

            const matchState: MatchState<SmashUpCore> = {
                core,
                sys: {
                    phase: 'playCards',
                    interaction: { current: undefined, queue: [] },
                } as any,
            };

            const destroyEvt: SmashUpEvent = {
                type: SU_EVENTS.MINION_DESTROYED,
                payload: {
                    minionUid: 'minion-1',
                    minionDefId: 'test_minion',
                    fromBaseIndex: 0,
                    ownerId: '0',
                },
                timestamp: 1000,
            } as any;

            const interactionData = {
                continuationContext: {
                    kind: 'destroy',
                    originalEvent: destroyEvt,
                },
            } as any;

            const result = handler!(
                matchState,
                '0',
                { accept: true },
                interactionData,
                () => 0.5 as any,
                1000
            );

            expect(result).toBeDefined();
            const types = result!.events.map(e => e.type);
            expect(types[0]).toBe(SU_EVENTS.POWER_COUNTER_REMOVED);
            expect(types[1]).toBe(SU_EVENTS.TITAN_POWER_TOKEN_ADDED);
            expect(types[2]).toBe(SU_EVENTS.MINION_DESTROYED);
        });

        it('Great Wolf Spirit Talent: 给随从+1战斗力', () => {
            const handler = getInteractionHandler('werewolves_great_wolf_spirit_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 0,
            };

            const result = handler!(
                state,
                '0',
                { minionUid: 'minion-1' },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe(SU_EVENTS.TEMP_POWER_ADDED);
            expect(result.events[0].payload).toMatchObject({
                minionUid: 'minion-1',
                amount: 1,
            });
        });

        it('Invisible Ninja Special 2: 打出额外随从', () => {
            const handler = getInteractionHandler('ninja_invisible_ninja_special2');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 0,
                titanDefId: 'titan_invisible_ninja',
            };
            state.core.players['0'].hand = [
                { uid: 'minion-2', defId: 'test_minion_2', type: 'minion', power: 2 } as any,
            ];

            const result = handler!(
                state,
                '0',
                { cardUid: 'minion-2', baseIndex: 1 },
                {} as any,
                () => 0.5,
                1000
            );

            // 应该生成2个事件：消灭泰坦 + 打出随从
            expect(result.events).toHaveLength(2);
            expect(result.events[0].type).toBe(SU_EVENTS.MINION_DESTROYED);
            expect(result.events[1].type).toBe(SU_EVENTS.MINION_PLAYED);
            expect(result.events[1].payload).toMatchObject({
                cardUid: 'minion-2',
                baseIndex: 1,
                consumesNormalLimit: false,
            });
        });
    });

    // ========================================================================
    // 占位符实现标记测试
    // ========================================================================

    describe('占位符实现标记', () => {
        it('Death on Six Legs Special 应该有 TODO 注释（需要基地选择交互）', () => {
            const handler = getInteractionHandler('giant_ants_death_on_six_legs_special');
            expect(handler).toBeDefined();
            // 此处仅检查交互处理器已注册；具体逻辑由现代 Special 执行器 + 交互流程覆盖
        });
    });

    // ========================================================================
    // Cthulhu 规则对齐测试
    // ========================================================================

    describe('Cthulhu', () => {
        it('Special: 交互处理器会消耗常规行动、抽2张Madness并出泰坦', () => {
            const handler = getInteractionHandler('cthulhu_minions_cthulhu_special');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.players['0'].titanZone[0].defId = 'titan_cthulhu';
            state.core.madnessDeck = Array.from({ length: 10 }, () => MADNESS_CARD_DEF_ID);
            state.core.nextUid = 100;

            const result = handler!(
                state,
                '0',
                { baseIndex: 0 },
                {} as any,
                () => 0.5,
                1000
            );

            const types = result.events.map(e => e.type);
            expect(types).toContain(SU_EVENTS.LIMIT_MODIFIED);
            expect(types).toContain(SU_EVENTS.MADNESS_DRAWN);
            expect(types).toContain(SU_EVENTS.TITAN_PLACED);

            const limitEvt = result.events.find(e => e.type === SU_EVENTS.LIMIT_MODIFIED)!;
            expect(limitEvt.payload).toMatchObject({ playerId: '0', limitType: 'action', delta: -1 });
        });

        it('Ongoing: 当你抽到Madness且Cthulhu已在场时，追加 TITAN_POWER_TOKEN_ADDED', () => {
            const core = {
                ...createTestState().core,
                madnessDeck: Array.from({ length: 10 }, () => MADNESS_CARD_DEF_ID),
                turnOrder: ['0', '1'],
                currentPlayerIndex: 0,
                players: {
                    ...createTestState().core.players,
                    '0': {
                        ...createTestState().core.players['0'],
                        activeTitan: {
                            titanUid: 'titan-cth',
                            defId: 'titan_cthulhu',
                            baseIndex: 0,
                            powerTokens: 0,
                        },
                    } as any,
                },
            } as any;

            const evt: SmashUpEvent = {
                type: SU_EVENTS.MADNESS_DRAWN,
                payload: { playerId: '0', count: 1, cardUids: ['madness_999'], reason: 'test' },
                timestamp: 1000,
            } as any;

            const processed = postProcessSystemEvents(
                core,
                [evt],
                { random: () => 0.5, d: () => 1, range: (m: number) => m, shuffle: <T>(a: T[]) => a } as any,
                { core, sys: { interaction: { current: undefined, queue: [] } } } as any
            );

            expect(processed.events.some(e => e.type === SU_EVENTS.TITAN_POWER_TOKEN_ADDED)).toBe(true);
        });

        it('Talent: give 会产生 CARD_TRANSFERRED 且不会产生 MADNESS_DRAWN', () => {
            const handler = getInteractionHandler('cthulhu_minions_cthulhu_talent');
            expect(handler).toBeDefined();

            const state = createTestState();
            state.core.turnOrder = ['0', '1'];
            state.core.players['0'].hand = [
                { uid: 'm1', defId: MADNESS_CARD_DEF_ID, type: 'action' } as any,
            ];

            const result = handler!(
                state,
                '0',
                { action: 'give', toPlayerId: '1' },
                {} as any,
                () => 0.5,
                1000
            );

            expect(result.events.some(e => e.type === SU_EVENTS.CARD_TRANSFERRED)).toBe(true);
            expect(result.events.some(e => e.type === SU_EVENTS.MADNESS_DRAWN)).toBe(false);
        });
    });

    // ========================================================================
    // Creampuff Man 规则对齐测试
    // ========================================================================

    describe('Creampuff Man', () => {
        it('Special 仅在自己出牌阶段且手牌为 0 时可用', () => {
            const executor = resolveAbility('titan_creampuff_man', 'special');
            expect(executor).toBeDefined();

            const state = createTestState();
            // 准备 titanZone 与手牌
            (state.core.players['0'] as any).titanZone[0].defId = 'titan_creampuff_man';
            (state.core.players['0'] as any).hand = [];
            (state.core.players['0'] as any).activeTitan = null;
            state.core.turnOrder = ['0', '1'];
            state.core.currentPlayerIndex = 0;
            (state as any).sys = {
                phase: 'playCards',
                interaction: { current: undefined, queue: [] },
            } as any;

            const ctx: any = {
                state: state.core,
                matchState: state,
                playerId: '0',
                cardUid: 'titan-1',
                defId: 'titan_creampuff_man',
                baseIndex: 0,
                random: { random: () => 0.5 } as any,
                now: 1000,
            };

            const result = executor!(ctx);
            expect(result.matchState?.sys?.interaction).toBeDefined();
        });

        it('Talent：弃牌后从弃牌堆打出标准行动并置于牌库底', () => {
            const step1 = getInteractionHandler('ghost_creampuff_man_talent_step1');
            const step2 = getInteractionHandler('ghost_creampuff_man_talent');
            expect(step1).toBeDefined();
            expect(step2).toBeDefined();

            const state = createTestState();
            // 配置手牌与弃牌堆
            state.core.players['0'].hand = [
                { uid: 'h1', defId: 'test_action_hand', type: 'action', abilities: [] } as any,
            ];
            state.core.players['0'].discard = [
                { uid: 'a1', defId: 'test_action_standard', type: 'action', abilities: [] } as any,
            ];
            (state as any).sys = {
                phase: 'playCards',
                interaction: { current: undefined, queue: [] },
            } as any;

            // 第一步：弃置手牌，创建第二步交互
            const step1Result = step1!(
                state,
                '0',
                { cardUid: 'h1' },
                {} as any,
                () => 0.5,
                1000
            );
            expect(step1Result.events.some(e => e.type === SU_EVENTS.CARDS_DISCARDED)).toBe(true);

            // 模拟第二步：从弃牌堆打出标准行动并置于牌库底
            const step2Result = step2!(
                state,
                '0',
                { cardUid: 'a1' },
                {} as any,
                () => 0.5,
                1000
            );
            const types = step2Result.events.map(e => e.type);
            expect(types).toContain(SU_EVENTS.ACTION_PLAYED);
            expect(types).toContain(SU_EVENTS.CARD_TO_DECK_BOTTOM);
        });
    });
});
