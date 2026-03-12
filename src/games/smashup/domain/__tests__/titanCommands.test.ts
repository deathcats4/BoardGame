/**
 * 泰坦命令验证测试
 *
 * 测试覆盖：
 * - PLACE_TITAN: 出场泰坦验证
 * - MOVE_TITAN: 移动泰坦验证
 * - ADD_TITAN_POWER_TOKEN: 添加力量指示物验证
 * - REMOVE_TITAN_POWER_TOKEN: 移除力量指示物验证
 */

import { describe, it, expect } from 'vitest';
import { validate } from '../commands';
import { SU_COMMANDS } from '../types';
import type { MatchState } from '../../../../engine/types';
import type { SmashUpCore, TitanCard, ActiveTitan } from '../types';

// ============================================================================
// 测试辅助函数
// ============================================================================

/**
 * 创建最小化测试状态
 */
function createTestState(overrides?: Partial<SmashUpCore>): MatchState<SmashUpCore> {
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
                factions: ['kaiju', 'robots'],
                titanZone: [],
                activeTitan: null,
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
                factions: ['wizards', 'ninjas'],
                titanZone: [],
                activeTitan: null,
            },
        },
        turnOrder: ['0', '1'],
        currentPlayerIndex: 0,
        bases: [
            { defId: 'base_test_1', minions: [], ongoingActions: [] },
            { defId: 'base_test_2', minions: [], ongoingActions: [] },
            { defId: 'base_test_3', minions: [], ongoingActions: [] },
        ],
        baseDeck: [],
        turnNumber: 1,
        nextUid: 1000,
        ...overrides,
    };

    return {
        core,
        sys: {
            phase: 'playCards',
            gameover: null,
            interaction: null,
            responseWindow: null,
            eventStream: { entries: [], nextId: 0 },
            log: { entries: [] },
        },
    };
}

/**
 * 创建泰坦卡
 */
function createTitanCard(uid: string, defId: string, factionId: string): TitanCard {
    return {
        uid,
        defId,
        type: 'titan',
        factionId,
        abilities: [],
    };
}

/**
 * 创建出场的泰坦
 */
function createActiveTitan(titanUid: string, baseIndex: number, powerTokens: number = 0): ActiveTitan {
    return {
        titanUid,
        baseIndex,
        powerTokens,
    };
}

// ============================================================================
// PLACE_TITAN 命令验证测试
// ============================================================================

describe('PLACE_TITAN 命令验证', () => {
    it('正常出场泰坦 - 应该通过', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                baseIndex: 0,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(true);
    });

    it('不在出牌阶段 - 应该拒绝', () => {
        const state = createTestState();
        state.sys.phase = 'draw';
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                baseIndex: 0,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('只能在出牌阶段出场泰坦');
    });

    it('不是当前玩家 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['1'].titanZone = [titanCard];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '1', // 不是当前玩家
            payload: {
                titanUid: 'titan-1',
                baseIndex: 0,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('player_mismatch');
    });

    it('已有出场的泰坦 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard1 = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        const titanCard2 = createTitanCard('titan-2', 'kaiju_gigazaur', 'kaiju');
        state.core.players['0'].titanZone = [titanCard1, titanCard2];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-2',
                baseIndex: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('你已经有一个出场的泰坦');
    });

    it('泰坦卡不在 titanZone 中 - 应该拒绝', () => {
        const state = createTestState();
        state.core.players['0'].titanZone = [];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                baseIndex: 0,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('泰坦区域中没有该泰坦卡');
    });

    it('基地索引无效（负数）- 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                baseIndex: -1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('无效的基地索引');
    });

    it('基地索引无效（超出范围）- 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                baseIndex: 10, // 超出范围
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('无效的基地索引');
    });
});

// ============================================================================
// MOVE_TITAN 命令验证测试
// ============================================================================

describe('MOVE_TITAN 命令验证', () => {
    it('正常移动泰坦 - 应该通过', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(true);
    });

    it('不在出牌阶段 - 应该拒绝', () => {
        const state = createTestState();
        state.sys.phase = 'scoreBases';
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('只能在出牌阶段移动泰坦');
    });

    it('不是当前玩家 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['1'].titanZone = [titanCard];
        state.core.players['1'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '1', // 不是当前玩家
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('player_mismatch');
    });

    it('没有出场的泰坦 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = null;

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('你没有出场的泰坦');
    });

    it('泰坦 UID 不匹配 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-2', // 不匹配
                fromBaseIndex: 0,
                toBaseIndex: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('泰坦 UID 不匹配');
    });

    it('当前基地索引不匹配 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 1, // 不匹配（实际在基地 0）
                toBaseIndex: 2,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('泰坦不在指定的基地上');
    });

    it('目标基地索引无效（负数）- 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: -1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('无效的目标基地索引');
    });

    it('目标基地索引无效（超出范围）- 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 10, // 超出范围
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('无效的目标基地索引');
    });

    it('目标基地与当前基地相同 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 0, // 相同
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('不能移动到当前基地');
    });
});

// ============================================================================
// ADD_TITAN_POWER_TOKEN 命令验证测试
// ============================================================================

describe('ADD_TITAN_POWER_TOKEN 命令验证', () => {
    it('正常添加力量指示物 - 应该通过', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 2);

        const command = {
            type: SU_COMMANDS.ADD_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 3,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(true);
    });

    it('不是当前玩家 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['1'].titanZone = [titanCard];
        state.core.players['1'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.ADD_TITAN_POWER_TOKEN,
            playerId: '1', // 不是当前玩家
            payload: {
                titanUid: 'titan-1',
                amount: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('player_mismatch');
    });

    it('没有出场的泰坦 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = null;

        const command = {
            type: SU_COMMANDS.ADD_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('你没有出场的泰坦');
    });

    it('泰坦 UID 不匹配 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.ADD_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-2', // 不匹配
                amount: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('泰坦 UID 不匹配');
    });

    it('数量为 0 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.ADD_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 0,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('力量指示物数量必须大于 0');
    });

    it('数量为负数 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0);

        const command = {
            type: SU_COMMANDS.ADD_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: -1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('力量指示物数量必须大于 0');
    });
});

// ============================================================================
// REMOVE_TITAN_POWER_TOKEN 命令验证测试
// ============================================================================

describe('REMOVE_TITAN_POWER_TOKEN 命令验证', () => {
    it('正常移除力量指示物 - 应该通过', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 5);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 3,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(true);
    });

    it('移除全部力量指示物 - 应该通过', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 3);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 3,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(true);
    });

    it('不是当前玩家 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['1'].titanZone = [titanCard];
        state.core.players['1'].activeTitan = createActiveTitan('titan-1', 0, 2);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '1', // 不是当前玩家
            payload: {
                titanUid: 'titan-1',
                amount: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('player_mismatch');
    });

    it('没有出场的泰坦 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = null;

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('你没有出场的泰坦');
    });

    it('泰坦 UID 不匹配 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 2);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-2', // 不匹配
                amount: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('泰坦 UID 不匹配');
    });

    it('数量为 0 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 2);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 0,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('力量指示物数量必须大于 0');
    });

    it('数量为负数 - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 2);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: -1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('力量指示物数量必须大于 0');
    });

    it('数量超过当前 powerTokens - 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 2);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 5, // 超过当前的 2
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('力量指示物不足（当前：2）');
    });

    it('边界条件：移除 1 个指示物（当前有 1 个）- 应该通过', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 1);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 1,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(true);
    });

    it('边界条件：移除 2 个指示物（当前有 1 个）- 应该拒绝', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 1);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 2,
            },
        };

        const result = validate(state, command);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('力量指示物不足（当前：1）');
    });
});

// ============================================================================
// 泰坦命令执行逻辑测试
// ============================================================================

import { execute } from '../reducer';
import type { RandomFn } from '../../../../engine/types';

/**
 * 创建测试用的随机函数（确定性）
 */
function createTestRandom(): RandomFn {
    return {
        int: (min: number, max: number) => min,
        shuffle: <T>(arr: T[]) => [...arr],
        pick: <T>(arr: T[]) => arr[0],
    };
}

describe('PLACE_TITAN 命令执行', () => {
    it('正常出场泰坦 - 应该生成 TITAN_PLACED 事件', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                baseIndex: 0,
            },
            timestamp: 1000,
        };

        const events = execute(state, command, createTestRandom());

        expect(events.length).toBeGreaterThan(0);
        const placedEvent = events.find(e => e.type === 'su:titan_placed');
        expect(placedEvent).toBeDefined();
        expect(placedEvent?.payload).toMatchObject({
            playerId: '0',
            titanUid: 'titan-1',
            titanDefId: 'kaiju_rainboroc',
            baseIndex: 0,
        });
    });

    it('出场泰坦触发冲突 - 应该生成 TITAN_CLASH 和 TITAN_REMOVED 事件', () => {
        const state = createTestState();
        const titanCard1 = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        const titanCard2 = createTitanCard('titan-2', 'robot_megabot', 'robots');

        // 玩家 1 已经有泰坦在基地 0
        state.core.players['1'].titanZone = [titanCard2];
        state.core.players['1'].activeTitan = createActiveTitan('titan-2', 0, 0);

        // 玩家 0 出场泰坦到基地 0（触发冲突）
        state.core.players['0'].titanZone = [titanCard1];

        const command = {
            type: SU_COMMANDS.PLACE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                baseIndex: 0,
            },
            timestamp: 1000,
        };

        const events = execute(state, command, createTestRandom());

        // 应该有 TITAN_PLACED、TITAN_CLASH、TITAN_REMOVED 事件
        const placedEvent = events.find(e => e.type === 'su:titan_placed');
        const clashEvent = events.find(e => e.type === 'su:titan_clash');
        const removedEvent = events.find(e => e.type === 'su:titan_removed');

        expect(placedEvent).toBeDefined();
        expect(clashEvent).toBeDefined();
        expect(removedEvent).toBeDefined();
    });
});

describe('MOVE_TITAN 命令执行', () => {
    it('正常移动泰坦 - 应该生成 TITAN_MOVED 事件', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 0);

        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 1,
            },
            timestamp: 1000,
        };

        const events = execute(state, command, createTestRandom());

        expect(events.length).toBeGreaterThan(0);
        const movedEvent = events.find(e => e.type === 'su:titan_moved');
        expect(movedEvent).toBeDefined();
        expect(movedEvent?.payload).toMatchObject({
            playerId: '0',
            titanUid: 'titan-1',
            titanDefId: 'kaiju_rainboroc',
            fromBaseIndex: 0,
            toBaseIndex: 1,
        });
    });

    it('移动泰坦触发冲突 - 应该生成 TITAN_CLASH 和 TITAN_REMOVED 事件', () => {
        const state = createTestState();
        const titanCard1 = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        const titanCard2 = createTitanCard('titan-2', 'robot_megabot', 'robots');

        // 玩家 0 的泰坦在基地 0
        state.core.players['0'].titanZone = [titanCard1];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 0);

        // 玩家 1 的泰坦在基地 1
        state.core.players['1'].titanZone = [titanCard2];
        state.core.players['1'].activeTitan = createActiveTitan('titan-2', 1, 0);

        // 玩家 0 移动泰坦到基地 1（触发冲突）
        const command = {
            type: SU_COMMANDS.MOVE_TITAN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                fromBaseIndex: 0,
                toBaseIndex: 1,
            },
            timestamp: 1000,
        };

        const events = execute(state, command, createTestRandom());

        // 应该有 TITAN_MOVED、TITAN_CLASH、TITAN_REMOVED 事件
        const movedEvent = events.find(e => e.type === 'su:titan_moved');
        const clashEvent = events.find(e => e.type === 'su:titan_clash');
        const removedEvent = events.find(e => e.type === 'su:titan_removed');

        expect(movedEvent).toBeDefined();
        expect(clashEvent).toBeDefined();
        expect(removedEvent).toBeDefined();
    });
});

describe('ADD_TITAN_POWER_TOKEN 命令执行', () => {
    it('正常添加力量指示物 - 应该生成 TITAN_POWER_TOKEN_ADDED 事件', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 2);

        const command = {
            type: SU_COMMANDS.ADD_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 3,
            },
            timestamp: 1000,
        };

        const events = execute(state, command, createTestRandom());

        expect(events.length).toBe(1);
        expect(events[0].type).toBe('su:titan_power_token_added');
        expect(events[0].payload).toMatchObject({
            playerId: '0',
            titanUid: 'titan-1',
            amount: 3,
            newTotal: 5, // 2 + 3
        });
    });
});

describe('REMOVE_TITAN_POWER_TOKEN 命令执行', () => {
    it('正常移除力量指示物 - 应该生成 TITAN_POWER_TOKEN_REMOVED 事件', () => {
        const state = createTestState();
        const titanCard = createTitanCard('titan-1', 'kaiju_rainboroc', 'kaiju');
        state.core.players['0'].titanZone = [titanCard];
        state.core.players['0'].activeTitan = createActiveTitan('titan-1', 0, 5);

        const command = {
            type: SU_COMMANDS.REMOVE_TITAN_POWER_TOKEN,
            playerId: '0',
            payload: {
                titanUid: 'titan-1',
                amount: 2,
            },
            timestamp: 1000,
        };

        const events = execute(state, command, createTestRandom());

        expect(events.length).toBe(1);
        expect(events[0].type).toBe('su:titan_power_token_removed');
        expect(events[0].payload).toMatchObject({
            playerId: '0',
            titanUid: 'titan-1',
            amount: 2,
            newTotal: 3, // 5 - 2
        });
    });
});
