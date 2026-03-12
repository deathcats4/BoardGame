/**
 * 泰坦计分系统集成测试
 *
 * 验证 TitanSystem 正确集成到计分系统中。
 */

import { describe, it, expect } from 'vitest';
import { createTitanSystem } from '../systems/TitanSystem';
import type { SmashUpCore } from '../types';

describe('Titan Scoring Integration', () => {
    const titanSystem = createTitanSystem();

    describe('calculatePlayerPower', () => {
        it('should include titan power tokens in total power', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 3,
                        },
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'robot_microbot_alpha',
                                controller: '0',
                                basePower: 2,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                        ],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const totalPower = titanSystem.calculatePlayerPower(state, '0', 0);
            
            // 随从力量 2 + 泰坦力量指示物 3 = 5
            expect(totalPower).toBe(5);
        });

        it('should work without titans (backward compatibility)', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: null,
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'robot_microbot_alpha',
                                controller: '0',
                                basePower: 3,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                        ],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const totalPower = titanSystem.calculatePlayerPower(state, '0', 0);
            
            // 只有随从力量 3
            expect(totalPower).toBe(3);
        });

        it('Arcane Protector Ongoing: adds +1 power here per two cards in hand', () => {
            const state: SmashUpCore = {
                players: {
                    '0': {
                        id: '0',
                        vp: 0,
                        hand: [
                            { uid: 'c1', defId: 'wizards_spell_1', type: 'action', owner: '0' } as any,
                            { uid: 'c2', defId: 'wizards_spell_2', type: 'action', owner: '0' } as any,
                            { uid: 'c3', defId: 'wizards_spell_3', type: 'action', owner: '0' } as any,
                            { uid: 'c4', defId: 'wizards_spell_4', type: 'action', owner: '0' } as any,
                        ],
                        deck: [],
                        discard: [],
                        minionsPlayed: 0,
                        minionLimit: 1,
                        actionsPlayed: 0,
                        actionLimit: 1,
                        factions: ['wizards', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 0,
                            defId: 'titan_arcane_protector',
                        } as any,
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'wizard_minion',
                                controller: '0',
                                basePower: 2,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            } as any,
                        ],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const totalPower = titanSystem.calculatePlayerPower(state, '0', 0);

            // 随从力量 2 + Arcane Protector Ongoing (floor(4/2)=2) = 4
            expect(totalPower).toBe(4);
        });
    });

    describe('hasScoringEligibility', () => {
        it('should allow player with only titan power to score', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 2,
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
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const eligible = titanSystem.hasScoringEligibility(state, '0', 0);
            
            // 没有随从，但有泰坦力量指示物，应该有资格
            expect(eligible).toBe(true);
        });

        it('should not allow player with no minions and no titan power', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 0,
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
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const eligible = titanSystem.hasScoringEligibility(state, '0', 0);
            
            // 没有随从，泰坦力量为 0，不应该有资格
            expect(eligible).toBe(false);
        });

        it('should allow player with minion even if power is zero', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: null,
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'robot_microbot_alpha',
                                controller: '0',
                                basePower: 2,
                                powerCounters: 0,
                                powerModifier: -2, // 力量被 debuff 到 0
                                tempPowerModifier: 0,
                            },
                        ],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            const eligible = titanSystem.hasScoringEligibility(state, '0', 0);
            
            // 有随从，即使力量为 0，也应该有资格
            expect(eligible).toBe(true);
        });
    });

    describe('Scoring Integration with Titans', () => {
        it('should correctly rank players with titans in scoring', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 5, // 泰坦力量 5
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
                        factions: ['ninjas', ''],
                        titanZone: [],
                        activeTitan: null,
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'robot_microbot_alpha',
                                controller: '0',
                                basePower: 2,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                            {
                                uid: 'minion-2',
                                defId: 'ninja_shinobi',
                                controller: '1',
                                basePower: 3,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                        ],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0', '1'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            // 玩家 0: 随从力量 2 + 泰坦力量 5 = 7
            const power0 = titanSystem.calculatePlayerPower(state, '0', 0);
            expect(power0).toBe(7);

            // 玩家 1: 随从力量 3
            const power1 = titanSystem.calculatePlayerPower(state, '1', 0);
            expect(power1).toBe(3);

            // 玩家 0 应该排名第一
            expect(power0).toBeGreaterThan(power1);
        });

        it('should exclude players without eligibility from scoring', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 3,
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
                        factions: ['ninjas', ''],
                        titanZone: [],
                        activeTitan: null, // 没有泰坦
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'robot_microbot_alpha',
                                controller: '0',
                                basePower: 2,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                            // 玩家 1 没有随从
                        ],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0', '1'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            // 玩家 0 有资格（有随从 + 泰坦力量）
            expect(titanSystem.hasScoringEligibility(state, '0', 0)).toBe(true);

            // 玩家 1 没有资格（没有随从，没有泰坦力量）
            expect(titanSystem.hasScoringEligibility(state, '1', 0)).toBe(false);
        });

        it('should handle multiple players with titans', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 4,
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
                        factions: ['kaiju', ''],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-2',
                            baseIndex: 0,
                            powerTokens: 6,
                        },
                    },
                },
                bases: [
                    {
                        defId: 'base_test',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'robot_microbot_alpha',
                                controller: '0',
                                basePower: 2,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                            {
                                uid: 'minion-2',
                                defId: 'kaiju_baby_godzilla',
                                controller: '1',
                                basePower: 3,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                        ],
                        ongoingActions: [],
                    },
                ],
                baseDeck: [],
                turnOrder: ['0', '1'],
                currentPlayerIndex: 0,
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            // 玩家 0: 随从力量 2 + 泰坦力量 4 = 6
            const power0 = titanSystem.calculatePlayerPower(state, '0', 0);
            expect(power0).toBe(6);

            // 玩家 1: 随从力量 3 + 泰坦力量 6 = 9
            const power1 = titanSystem.calculatePlayerPower(state, '1', 0);
            expect(power1).toBe(9);

            // 玩家 1 应该排名第一
            expect(power1).toBeGreaterThan(power0);
        });

        it('should handle titans at different bases', () => {
            const state: SmashUpCore = {
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
                        factions: ['robots', ''],
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
                        defId: 'base_test_1',
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'robot_microbot_alpha',
                                controller: '0',
                                basePower: 2,
                                powerCounters: 0,
                                powerModifier: 0,
                                tempPowerModifier: 0,
                            },
                        ],
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
                phase: 'playCards',
                nextUid: 100,
                turnNumber: 1,
            } as SmashUpCore;

            // 基地 0: 只有随从力量 2（泰坦在基地 1）
            const power0 = titanSystem.calculatePlayerPower(state, '0', 0);
            expect(power0).toBe(2);

            // 基地 1: 只有泰坦力量 5（没有随从）
            const power1 = titanSystem.calculatePlayerPower(state, '0', 1);
            expect(power1).toBe(5);
        });
    });
});
