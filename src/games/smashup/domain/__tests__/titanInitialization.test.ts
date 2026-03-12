/**
 * 泰坦初始化测试
 * 
 * 测试游戏初始化时泰坦区域的正确创建
 */

import { describe, it, expect } from 'vitest';
import { reduce } from '../reduce';
import type { SmashUpCore, SmashUpEvent } from '../types';
import { SU_EVENTS } from '../types';

describe('Titan Initialization', () => {
    // 创建初始状态
    function createInitialState(): SmashUpCore {
        return {
            turnNumber: 0,
            currentPlayerIndex: 0,
            turnOrder: ['0', '1'],
            bases: [],
            baseDeck: [],
            nextUid: 1000,
            players: {
                '0': {
                    factions: ['ninja', 'wizard'],
                    deck: [],
                    hand: [],
                    discard: [],
                    vp: 0,
                    minionsPlayed: 0,
                    minionLimit: 1,
                    actionsPlayed: 0,
                    actionLimit: 1,
                    titanZone: [],
                    activeTitan: null,
                },
                '1': {
                    factions: ['robot', 'pirate'],
                    deck: [],
                    hand: [],
                    discard: [],
                    vp: 0,
                    minionsPlayed: 0,
                    minionLimit: 1,
                    actionsPlayed: 0,
                    actionLimit: 1,
                    titanZone: [],
                    activeTitan: null,
                },
            },
            factionSelection: {
                takenFactions: ['ninja', 'wizard', 'robot', 'pirate'],
                playerSelections: {
                    '0': ['ninja', 'wizard'],
                    '1': ['robot', 'pirate'],
                },
            },
            turnDestroyedMinions: [],
        };
    }

    it('should initialize titanZone as empty array when no factions have titans', () => {
        const state = createInitialState();
        const event: SmashUpEvent = {
            type: SU_EVENTS.ALL_FACTIONS_SELECTED,
            payload: {
                readiedPlayers: {
                    '0': {
                        deck: [{ uid: 'card-1', defId: 'ninja_shinobi', type: 'minion', owner: '0' }],
                        hand: [{ uid: 'card-2', defId: 'wizard_neophyte', type: 'minion', owner: '0' }],
                    },
                    '1': {
                        deck: [{ uid: 'card-3', defId: 'robot_microbot_alpha', type: 'minion', owner: '1' }],
                        hand: [{ uid: 'card-4', defId: 'pirate_buccaneer', type: 'minion', owner: '1' }],
                    },
                },
                nextUid: 1000,
            },
            timestamp: Date.now(),
        };

        const newState = reduce(state, event);

        // 验证所有玩家的 titanZone 都是空数组（因为当前 FACTION_TITANS 映射为空）
        expect(newState.players['0'].titanZone).toEqual([]);
        expect(newState.players['1'].titanZone).toEqual([]);
    });

    it('should initialize activeTitan as null for all players', () => {
        const state = createInitialState();
        const event: SmashUpEvent = {
            type: SU_EVENTS.ALL_FACTIONS_SELECTED,
            payload: {
                readiedPlayers: {
                    '0': {
                        deck: [{ uid: 'card-1', defId: 'ninja_shinobi', type: 'minion', owner: '0' }],
                        hand: [{ uid: 'card-2', defId: 'wizard_neophyte', type: 'minion', owner: '0' }],
                    },
                    '1': {
                        deck: [{ uid: 'card-3', defId: 'robot_microbot_alpha', type: 'minion', owner: '1' }],
                        hand: [{ uid: 'card-4', defId: 'pirate_buccaneer', type: 'minion', owner: '1' }],
                    },
                },
                nextUid: 1000,
            },
            timestamp: Date.now(),
        };

        const newState = reduce(state, event);

        // 验证所有玩家的 activeTitan 都是 null
        expect(newState.players['0'].activeTitan).toBeNull();
        expect(newState.players['1'].activeTitan).toBeNull();
    });

    it('should preserve nextUid when no titans are created', () => {
        const state = createInitialState();
        const event: SmashUpEvent = {
            type: SU_EVENTS.ALL_FACTIONS_SELECTED,
            payload: {
                readiedPlayers: {
                    '0': {
                        deck: [{ uid: 'card-1', defId: 'ninja_shinobi', type: 'minion', owner: '0' }],
                        hand: [{ uid: 'card-2', defId: 'wizard_neophyte', type: 'minion', owner: '0' }],
                    },
                    '1': {
                        deck: [{ uid: 'card-3', defId: 'robot_microbot_alpha', type: 'minion', owner: '1' }],
                        hand: [{ uid: 'card-4', defId: 'pirate_buccaneer', type: 'minion', owner: '1' }],
                    },
                },
                nextUid: 1000,
            },
            timestamp: Date.now(),
        };

        const newState = reduce(state, event);

        // 验证 nextUid 保持不变（因为没有创建泰坦卡）
        expect(newState.nextUid).toBe(1000);
    });

    it('should preserve other player state fields', () => {
        const state = createInitialState();
        const event: SmashUpEvent = {
            type: SU_EVENTS.ALL_FACTIONS_SELECTED,
            payload: {
                readiedPlayers: {
                    '0': {
                        deck: [{ uid: 'card-1', defId: 'ninja_shinobi', type: 'minion', owner: '0' }],
                        hand: [{ uid: 'card-2', defId: 'wizard_neophyte', type: 'minion', owner: '0' }],
                    },
                    '1': {
                        deck: [{ uid: 'card-3', defId: 'robot_microbot_alpha', type: 'minion', owner: '1' }],
                        hand: [{ uid: 'card-4', defId: 'pirate_buccaneer', type: 'minion', owner: '1' }],
                    },
                },
                nextUid: 1000,
            },
            timestamp: Date.now(),
        };

        const newState = reduce(state, event);

        // 验证其他玩家状态字段保持不变
        expect(newState.players['0'].vp).toBe(0);
        expect(newState.players['0'].minionsPlayed).toBe(0);
        expect(newState.players['0'].minionLimit).toBe(1);
        expect(newState.players['0'].actionsPlayed).toBe(0);
        expect(newState.players['0'].actionLimit).toBe(1);
        expect(newState.players['0'].factions).toEqual(['ninja', 'wizard']);
    });

    it('should correctly update deck and hand from event payload', () => {
        const state = createInitialState();
        const event: SmashUpEvent = {
            type: SU_EVENTS.ALL_FACTIONS_SELECTED,
            payload: {
                readiedPlayers: {
                    '0': {
                        deck: [
                            { uid: 'card-1', defId: 'ninja_shinobi', type: 'minion', owner: '0' },
                            { uid: 'card-2', defId: 'ninja_infiltrate', type: 'action', owner: '0' },
                        ],
                        hand: [
                            { uid: 'card-3', defId: 'wizard_neophyte', type: 'minion', owner: '0' },
                            { uid: 'card-4', defId: 'wizard_portal', type: 'action', owner: '0' },
                        ],
                    },
                    '1': {
                        deck: [{ uid: 'card-5', defId: 'robot_microbot_alpha', type: 'minion', owner: '1' }],
                        hand: [{ uid: 'card-6', defId: 'pirate_buccaneer', type: 'minion', owner: '1' }],
                    },
                },
                nextUid: 1000,
            },
            timestamp: Date.now(),
        };

        const newState = reduce(state, event);

        // 验证牌库和手牌正确更新
        expect(newState.players['0'].deck).toHaveLength(2);
        expect(newState.players['0'].hand).toHaveLength(2);
        expect(newState.players['0'].deck[0].defId).toBe('ninja_shinobi');
        expect(newState.players['0'].hand[0].defId).toBe('wizard_neophyte');
    });

    // 注意：以下测试在 Task 14 完成后（FACTION_TITANS 映射填充后）会自动通过
    it.skip('should create titan cards for factions with titans (will pass after Task 14)', () => {
        // 这个测试在 Task 14 完成后会自动通过
        // 当 FACTION_TITANS 映射填充后（如 'kaiju': 'titan_rainboroc'），
        // 选择 kaiju 派系的玩家会在 titanZone 中获得泰坦卡
        const state = createInitialState();
        state.factionSelection!.playerSelections['0'] = ['kaiju', 'wizard'];
        state.factionSelection!.takenFactions = ['kaiju', 'wizard', 'robot', 'pirate'];

        const event: SmashUpEvent = {
            type: SU_EVENTS.ALL_FACTIONS_SELECTED,
            payload: {
                readiedPlayers: {
                    '0': {
                        deck: [{ uid: 'card-1', defId: 'kaiju_giga_zaur', type: 'minion', owner: '0' }],
                        hand: [{ uid: 'card-2', defId: 'wizard_neophyte', type: 'minion', owner: '0' }],
                    },
                    '1': {
                        deck: [{ uid: 'card-3', defId: 'robot_microbot_alpha', type: 'minion', owner: '1' }],
                        hand: [{ uid: 'card-4', defId: 'pirate_buccaneer', type: 'minion', owner: '1' }],
                    },
                },
                nextUid: 1000,
            },
            timestamp: Date.now(),
        };

        const newState = reduce(state, event);

        // 验证玩家 0 有泰坦卡（kaiju 派系）
        expect(newState.players['0'].titanZone).toHaveLength(1);
        expect(newState.players['0'].titanZone[0].type).toBe('titan');
        expect(newState.players['0'].titanZone[0].factionId).toBe('kaiju');
        expect(newState.players['0'].titanZone[0].defId).toBe('titan_rainboroc');
        expect(newState.players['0'].titanZone[0].uid).toBe('titan-1000');

        // 验证玩家 1 没有泰坦卡（robot 和 pirate 派系没有泰坦）
        expect(newState.players['1'].titanZone).toEqual([]);

        // 验证 nextUid 正确递增
        expect(newState.nextUid).toBe(1001);
    });

    it.skip('should increment nextUid correctly when multiple players have titans (will pass after Task 14)', () => {
        // 这个测试在 Task 14 完成后会自动通过
        const state = createInitialState();
        state.factionSelection!.playerSelections['0'] = ['kaiju', 'robots'];
        state.factionSelection!.playerSelections['1'] = ['kaiju', 'robots'];
        state.factionSelection!.takenFactions = ['kaiju', 'robots'];

        const event: SmashUpEvent = {
            type: SU_EVENTS.ALL_FACTIONS_SELECTED,
            payload: {
                readiedPlayers: {
                    '0': {
                        deck: [{ uid: 'card-1', defId: 'kaiju_giga_zaur', type: 'minion', owner: '0' }],
                        hand: [{ uid: 'card-2', defId: 'robot_microbot_alpha', type: 'minion', owner: '0' }],
                    },
                    '1': {
                        deck: [{ uid: 'card-3', defId: 'kaiju_giga_zaur', type: 'minion', owner: '1' }],
                        hand: [{ uid: 'card-4', defId: 'robot_microbot_alpha', type: 'minion', owner: '1' }],
                    },
                },
                nextUid: 1000,
            },
            timestamp: Date.now(),
        };

        const newState = reduce(state, event);

        // 验证两个玩家都有 2 张泰坦卡（kaiju + robots）
        expect(newState.players['0'].titanZone).toHaveLength(2);
        expect(newState.players['1'].titanZone).toHaveLength(2);

        // 验证 UID 正确递增（4 张泰坦卡）
        expect(newState.nextUid).toBe(1004);
        expect(newState.players['0'].titanZone[0].uid).toBe('titan-1000');
        expect(newState.players['0'].titanZone[1].uid).toBe('titan-1001');
        expect(newState.players['1'].titanZone[0].uid).toBe('titan-1002');
        expect(newState.players['1'].titanZone[1].uid).toBe('titan-1003');
    });
});
