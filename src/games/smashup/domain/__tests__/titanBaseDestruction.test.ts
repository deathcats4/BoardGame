/**
 * 泰坦基地摧毁集成测试
 *
 * 验证基地摧毁和替换时泰坦正确移除。
 */

import { describe, it, expect } from 'vitest';
import { createTitanSystem } from '../systems/TitanSystem';
import type { SmashUpCore, BaseClearedEvent, BaseReplacedEvent } from '../types';
import { SU_EVENT_TYPES } from '../events';
import { reduce } from '../reduce';

describe('Titan Base Destruction Integration', () => {
    const titanSystem = createTitanSystem();

    describe('BASE_CLEARED event', () => {
        it('should remove titan when base is cleared', () => {
            const initialState: SmashUpCore = {
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
                        factions: ['kaiju', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 5,
                        },
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [],
                        ongoingActions: [],
                    },
                    {
                        defId: 'base_test_2',
                        minions: [],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'scoreBases',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const event: BaseClearedEvent = {
                type: SU_EVENT_TYPES.BASE_CLEARED,
                payload: {
                    baseIndex: 0,
                    baseDefId: 'base_test',
                },
                timestamp: Date.now(),
            };

            const newState = reduce(initialState, event);

            // 验证泰坦被移除
            expect(newState.players['0'].activeTitan).toBeNull();
            expect(newState.players['0'].titanZone).toHaveLength(1);
            expect(newState.players['0'].titanZone[0].uid).toBe('titan-1');
            
            // 验证基地被移除
            expect(newState.bases).toHaveLength(1);
            expect(newState.bases[0].defId).toBe('base_test_2');
        });

        it('should not affect titans at other bases', () => {
            const initialState: SmashUpCore = {
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
                        factions: ['kaiju', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 1, // 泰坦在基地 1
                            powerTokens: 5,
                        },
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [],
                        ongoingActions: [],
                    },
                    {
                        defId: 'base_test_2',
                        minions: [],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'scoreBases',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const event: BaseClearedEvent = {
                type: SU_EVENT_TYPES.BASE_CLEARED,
                payload: {
                    baseIndex: 0, // 清除基地 0
                    baseDefId: 'base_test',
                },
                timestamp: Date.now(),
            };

            const newState = reduce(initialState, event);

            // 验证泰坦仍然存在，但 baseIndex 调整为 0（因为基地 0 被移除）
            expect(newState.players['0'].activeTitan).not.toBeNull();
            expect(newState.players['0'].activeTitan!.baseIndex).toBe(0); // 1 - 1 = 0
            expect(newState.players['0'].activeTitan!.powerTokens).toBe(5);
            expect(newState.players['0'].titanZone).toHaveLength(0);
        });

        it('should handle multiple players with titans', () => {
            const initialState: SmashUpCore = {
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
                        factions: ['kaiju', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 5,
                        },
                    },
                    '1': {
                        id: '1',
                        vp: 0,
                        hand: [],
                        deck: [],
                        discard: [],
                        minionsPlayed: 0,
                        minionLimit: 1,
                        actionsPlayed: 0,
                        actionLimit: 1,
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-2',
                            baseIndex: 0,
                            powerTokens: 3,
                        },
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0', '1'],
                currentPlayerIndex: 0,
                phase: 'scoreBases',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const event: BaseClearedEvent = {
                type: SU_EVENT_TYPES.BASE_CLEARED,
                payload: {
                    baseIndex: 0,
                    baseDefId: 'base_test',
                },
                timestamp: Date.now(),
            };

            const newState = reduce(initialState, event);

            // 验证两个玩家的泰坦都被移除
            expect(newState.players['0'].activeTitan).toBeNull();
            expect(newState.players['0'].titanZone).toHaveLength(1);
            expect(newState.players['1'].activeTitan).toBeNull();
            expect(newState.players['1'].titanZone).toHaveLength(1);
        });
    });

    describe('BASE_REPLACED event', () => {
        it('should remove titan when base is replaced', () => {
            const initialState: SmashUpCore = {
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
                        factions: ['kaiju', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 5,
                        },
                    },
                },
                bases: [
                    {
                        defId: 'base_old',
                        minions: [],
                        ongoingActions: [],
                    },
                ],
                baseDeck: ['base_new'],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const event: BaseReplacedEvent = {
                type: SU_EVENT_TYPES.BASE_REPLACED,
                payload: {
                    baseIndex: 0,
                    oldBaseDefId: 'base_old',
                    newBaseDefId: 'base_new',
                },
                timestamp: Date.now(),
            };

            const newState = reduce(initialState, event);

            // 验证泰坦被移除
            expect(newState.players['0'].activeTitan).toBeNull();
            expect(newState.players['0'].titanZone).toHaveLength(1);
            expect(newState.players['0'].titanZone[0].uid).toBe('titan-1');
            
            // 验证基地被替换
            expect(newState.bases[0].defId).toBe('base_new');
        });

        it('should not remove titan when keepCards is true', () => {
            const initialState: SmashUpCore = {
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
                        factions: ['kaiju', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 5,
                        },
                    },
                },
                bases: [
                    {
                        defId: 'base_old',
                        minions: [],
                        ongoingActions: [],
                    },
                ],
                baseDeck: ['base_new'],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const event: BaseReplacedEvent = {
                type: SU_EVENT_TYPES.BASE_REPLACED,
                payload: {
                    baseIndex: 0,
                    oldBaseDefId: 'base_old',
                    newBaseDefId: 'base_new',
                    keepCards: true, // 保留卡牌（如 terraform）
                },
                timestamp: Date.now(),
            };

            const newState = reduce(initialState, event);

            // 验证泰坦仍然存在
            expect(newState.players['0'].activeTitan).not.toBeNull();
            expect(newState.players['0'].activeTitan!.titanUid).toBe('titan-1');
            expect(newState.players['0'].activeTitan!.powerTokens).toBe(5);
            expect(newState.players['0'].titanZone).toHaveLength(0);
            
            // 验证基地被替换
            expect(newState.bases[0].defId).toBe('base_new');
        });
    });
});
