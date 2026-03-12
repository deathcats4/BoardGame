/**
 * 大杀四方 - 泰坦系统单元测试
 */

import { describe, it, expect } from 'vitest';
import { createTitanSystem } from '../TitanSystem';
import type { SmashUpCore, BaseInPlay, PlayerState } from '../../types';
import { SU_EVENT_TYPES } from '../../events';

// ============================================================================
// 测试辅助函数
// ============================================================================

/** 创建最小化的测试状态 */
function createTestState(): SmashUpCore {
    const player0: PlayerState = {
        id: '0',
        vp: 0,
        hand: [],
        deck: [],
        discard: [],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        factions: ['kaiju', 'robots'],
        titanZone: [
            {
                uid: 'titan-0',
                defId: 'titan_rainboroc',
                type: 'titan',
                factionId: 'kaiju',
                abilities: [],
            },
        ],
        activeTitan: null,
    };

    const player1: PlayerState = {
        id: '1',
        vp: 0,
        hand: [],
        deck: [],
        discard: [],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        factions: ['ninjas', 'pirates'],
        titanZone: [
            {
                uid: 'titan-1',
                defId: 'titan_megabot',
                type: 'titan',
                factionId: 'robots',
                abilities: [],
            },
        ],
        activeTitan: null,
    };

    const base0: BaseInPlay = {
        defId: 'base_test',
        minions: [],
        ongoingActions: [],
    };

    return {
        players: { '0': player0, '1': player1 },
        turnOrder: ['0', '1'],
        currentPlayerIndex: 0,
        bases: [base0],
        baseDeck: [],
        turnNumber: 1,
        nextUid: 1000,
    };
}

// ============================================================================
// 测试套件
// ============================================================================

describe('TitanSystem', () => {
    describe('getTitansAtBase', () => {
        it('应该返回空数组当基地上没有泰坦时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            const titans = system.getTitansAtBase(state, 0);

            expect(titans).toEqual([]);
        });

        it('应该返回单个泰坦当只有一个玩家有泰坦在基地上时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 出场泰坦到基地 0
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };

            const titans = system.getTitansAtBase(state, 0);

            expect(titans).toHaveLength(1);
            expect(titans[0].playerId).toBe('0');
            expect(titans[0].titan.titanUid).toBe('titan-0');
            expect(titans[0].titan.powerTokens).toBe(2);
        });

        it('应该返回两个泰坦当两个玩家都有泰坦在基地上时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 和玩家 1 都出场泰坦到基地 0
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };
            state.players['1'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 3,
            };

            const titans = system.getTitansAtBase(state, 0);

            expect(titans).toHaveLength(2);
            expect(titans[0].playerId).toBe('0');
            expect(titans[1].playerId).toBe('1');
        });

        it('应该只返回指定基地的泰坦', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 添加第二个基地
            state.bases.push({
                defId: 'base_test_2',
                minions: [],
                ongoingActions: [],
            });

            // 玩家 0 的泰坦在基地 0，玩家 1 的泰坦在基地 1
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };
            state.players['1'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 1,
                powerTokens: 3,
            };

            const titans0 = system.getTitansAtBase(state, 0);
            const titans1 = system.getTitansAtBase(state, 1);

            expect(titans0).toHaveLength(1);
            expect(titans0[0].playerId).toBe('0');
            expect(titans1).toHaveLength(1);
            expect(titans1[0].playerId).toBe('1');
        });
    });

    describe('calculatePlayerPower', () => {
        it('应该返回 0 当玩家在基地上没有随从和泰坦时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            const power = system.calculatePlayerPower(state, '0', 0);

            expect(power).toBe(0);
        });

        it('应该包含泰坦力量指示物', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 出场泰坦到基地 0，有 3 个力量指示物
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 3,
            };

            const power = system.calculatePlayerPower(state, '0', 0);

            expect(power).toBe(3);
        });

        it('应该包含随从力量', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 在基地 0 有一个力量为 5 的随从
            state.bases[0].minions.push({
                uid: 'minion-1',
                defId: 'test_minion',
                controller: '0',
                owner: '0',
                basePower: 5,
                powerCounters: 0,
                powerModifier: 0,
                tempPowerModifier: 0,
                talentUsed: false,
                attachedActions: [],
            });

            const power = system.calculatePlayerPower(state, '0', 0);

            expect(power).toBe(5);
        });

        it('应该同时包含随从力量和泰坦力量指示物', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 在基地 0 有一个力量为 5 的随从
            state.bases[0].minions.push({
                uid: 'minion-1',
                defId: 'test_minion',
                controller: '0',
                owner: '0',
                basePower: 5,
                powerCounters: 0,
                powerModifier: 0,
                tempPowerModifier: 0,
                talentUsed: false,
                attachedActions: [],
            });

            // 玩家 0 出场泰坦到基地 0，有 3 个力量指示物
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 3,
            };

            const power = system.calculatePlayerPower(state, '0', 0);

            expect(power).toBe(8); // 5 (随从) + 3 (泰坦)
        });

        it('应该不包含其他基地的泰坦力量', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 添加第二个基地
            state.bases.push({
                defId: 'base_test_2',
                minions: [],
                ongoingActions: [],
            });

            // 玩家 0 的泰坦在基地 1
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 1,
                powerTokens: 3,
            };

            const power = system.calculatePlayerPower(state, '0', 0);

            expect(power).toBe(0); // 泰坦不在基地 0
        });
    });

    describe('hasScoringEligibility', () => {
        it('应该返回 false 当玩家没有随从且总力量为 0 时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            const eligible = system.hasScoringEligibility(state, '0', 0);

            expect(eligible).toBe(false);
        });

        it('应该返回 true 当玩家有至少一个随从时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 在基地 0 有一个随从
            state.bases[0].minions.push({
                uid: 'minion-1',
                defId: 'test_minion',
                controller: '0',
                owner: '0',
                basePower: 0, // 力量为 0 也算
                powerCounters: 0,
                powerModifier: 0,
                tempPowerModifier: 0,
                talentUsed: false,
                attachedActions: [],
            });

            const eligible = system.hasScoringEligibility(state, '0', 0);

            expect(eligible).toBe(true);
        });

        it('应该返回 true 当玩家只有泰坦且总力量 >= 1 时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 出场泰坦到基地 0，有 1 个力量指示物
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 1,
            };

            const eligible = system.hasScoringEligibility(state, '0', 0);

            expect(eligible).toBe(true);
        });

        it('应该返回 false 当玩家只有泰坦且总力量为 0 时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 出场泰坦到基地 0，但没有力量指示物
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 0,
            };

            const eligible = system.hasScoringEligibility(state, '0', 0);

            expect(eligible).toBe(false);
        });
    });

    describe('removeTitan', () => {
        it('应该返回 null 当玩家没有出场的泰坦时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            const event = system.removeTitan(state, '0', 'clash');

            expect(event).toBeNull();
        });

        it('应该生成移除事件当玩家有出场的泰坦时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 出场泰坦到基地 0
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };

            const event = system.removeTitan(state, '0', 'clash');

            expect(event).not.toBeNull();
            expect(event?.type).toBe(SU_EVENT_TYPES.TITAN_REMOVED);
            expect(event?.payload.playerId).toBe('0');
            expect(event?.payload.titanUid).toBe('titan-0');
            expect(event?.payload.titanDefId).toBe('titan_rainboroc');
            expect(event?.payload.baseIndex).toBe(0);
            expect(event?.payload.reason).toBe('clash');
        });

        it('应该支持不同的移除原因', () => {
            const system = createTitanSystem();
            const state = createTestState();

            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };

            const event1 = system.removeTitan(state, '0', 'base_destroyed');
            expect(event1?.payload.reason).toBe('base_destroyed');

            const event2 = system.removeTitan(state, '0', 'ability');
            expect(event2?.payload.reason).toBe('ability');
        });
    });

    describe('checkClash', () => {
        it('应该返回 null 当基地上没有泰坦时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            const clash = system.checkClash(state, 0);

            expect(clash).toBeNull();
        });

        it('应该返回 null 当基地上只有一个泰坦时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };

            const clash = system.checkClash(state, 0);

            expect(clash).toBeNull();
        });

        it('应该返回 null 当基地是 Kaiju Island 时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 设置基地为 Kaiju Island
            state.bases[0].defId = 'base_kaiju_island';

            // 两个玩家都出场泰坦到基地 0
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };
            state.players['1'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 3,
            };

            const clash = system.checkClash(state, 0);

            expect(clash).toBeNull();
        });

        it('应该生成冲突事件当两个泰坦在同一基地时', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 的泰坦有 2 个力量指示物
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };

            // 玩家 1 的泰坦有 3 个力量指示物
            state.players['1'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 3,
            };

            const clash = system.checkClash(state, 0);

            expect(clash).not.toBeNull();
            expect(clash?.type).toBe(SU_EVENT_TYPES.TITAN_CLASH);
            expect(clash?.payload.baseIndex).toBe(0);
            expect(clash?.payload.loser).toBe('0'); // 玩家 0 力量较低
        });

        it('应该在力量相等时让防守方（先到达）获胜', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 两个玩家的泰坦都有 2 个力量指示物
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };
            state.players['1'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 2,
            };

            const clash = system.checkClash(state, 0);

            expect(clash).not.toBeNull();
            // 玩家 0 是防守方（先到达），玩家 1 是进攻方（后到达）
            // 力量相等时防守方获胜，所以玩家 1 失败
            expect(clash?.payload.loser).toBe('1');
        });

        it('应该包含正确的力量值', () => {
            const system = createTitanSystem();
            const state = createTestState();

            // 玩家 0 有随从 + 泰坦
            state.bases[0].minions.push({
                uid: 'minion-1',
                defId: 'test_minion',
                controller: '0',
                owner: '0',
                basePower: 5,
                powerCounters: 0,
                powerModifier: 0,
                tempPowerModifier: 0,
                talentUsed: false,
                attachedActions: [],
            });
            state.players['0'].activeTitan = {
                titanUid: 'titan-0',
                baseIndex: 0,
                powerTokens: 2,
            };

            // 玩家 1 只有泰坦
            state.players['1'].activeTitan = {
                titanUid: 'titan-1',
                baseIndex: 0,
                powerTokens: 3,
            };

            const clash = system.checkClash(state, 0);

            expect(clash).not.toBeNull();
            expect(clash?.payload.defender.totalPower).toBe(7); // 5 + 2
            expect(clash?.payload.attacker.totalPower).toBe(3);
            expect(clash?.payload.loser).toBe('1'); // 玩家 1 力量较低
        });
    });
});

