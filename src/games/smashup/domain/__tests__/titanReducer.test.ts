/**
 * 泰坦事件 Reducer 测试
 */

import { describe, it, expect } from 'vitest';
import { reduce } from '../reduce';
import { SU_EVENTS } from '../types';
import type { SmashUpCore } from '../types';

function createTestCore(): SmashUpCore {
    return {
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
        },
        turnOrder: ['0'],
        currentPlayerIndex: 0,
        bases: [{ defId: 'base_test_1', minions: [], ongoingActions: [] }],
        baseDeck: [],
        turnNumber: 1,
        nextUid: 1000,
    } as any;
}

describe('TITAN_PLACED reducer', () => {
    it('应该将泰坦从 titanZone 移动到 activeTitan', () => {
        const core = createTestCore();
        core.players['0'].titanZone = [{ uid: 'titan-1', defId: 'kaiju_rainboroc', type: 'titan', factionId: 'kaiju', abilities: [] }];

        const event = {
            type: SU_EVENTS.TITAN_PLACED,
            payload: { playerId: '0', titanUid: 'titan-1', titanDefId: 'kaiju_rainboroc', baseIndex: 0 },
            timestamp: 1000,
        };

        const newCore = reduce(core, event);
        expect(newCore.players['0'].titanZone).toHaveLength(0);
        expect(newCore.players['0'].activeTitan).toEqual({ titanUid: 'titan-1', baseIndex: 0, powerTokens: 0 });
    });
});

describe('TITAN_MOVED reducer', () => {
    it('应该更新 activeTitan 的 baseIndex', () => {
        const core = createTestCore();
        core.players['0'].activeTitan = { titanUid: 'titan-1', baseIndex: 0, powerTokens: 2 };

        const event = {
            type: SU_EVENTS.TITAN_MOVED,
            payload: { playerId: '0', titanUid: 'titan-1', titanDefId: 'kaiju_rainboroc', fromBaseIndex: 0, toBaseIndex: 1 },
            timestamp: 1000,
        };

        const newCore = reduce(core, event);
        expect(newCore.players['0'].activeTitan?.baseIndex).toBe(1);
        expect(newCore.players['0'].activeTitan?.powerTokens).toBe(2);
    });
});

describe('TITAN_REMOVED reducer', () => {
    it('应该将泰坦从 activeTitan 移回 titanZone', () => {
        const core = createTestCore();
        core.players['0'].activeTitan = { titanUid: 'titan-1', baseIndex: 0, powerTokens: 3 };

        const event = {
            type: SU_EVENTS.TITAN_REMOVED,
            payload: { playerId: '0', titanUid: 'titan-1', titanDefId: 'kaiju_rainboroc', baseIndex: 0, reason: 'clash' },
            timestamp: 1000,
        };

        const newCore = reduce(core, event);
        expect(newCore.players['0'].activeTitan).toBeNull();
        expect(newCore.players['0'].titanZone).toHaveLength(1);
    });
});

describe('TITAN_POWER_TOKEN_ADDED reducer', () => {
    it('应该更新 activeTitan 的 powerTokens', () => {
        const core = createTestCore();
        core.players['0'].activeTitan = { titanUid: 'titan-1', baseIndex: 0, powerTokens: 2 };

        const event = {
            type: SU_EVENTS.TITAN_POWER_TOKEN_ADDED,
            payload: { playerId: '0', titanUid: 'titan-1', amount: 3, newTotal: 5 },
            timestamp: 1000,
        };

        const newCore = reduce(core, event);
        expect(newCore.players['0'].activeTitan?.powerTokens).toBe(5);
    });
});

describe('TITAN_POWER_TOKEN_REMOVED reducer', () => {
    it('应该更新 activeTitan 的 powerTokens', () => {
        const core = createTestCore();
        core.players['0'].activeTitan = { titanUid: 'titan-1', baseIndex: 0, powerTokens: 5 };

        const event = {
            type: SU_EVENTS.TITAN_POWER_TOKEN_REMOVED,
            payload: { playerId: '0', titanUid: 'titan-1', amount: 2, newTotal: 3 },
            timestamp: 1000,
        };

        const newCore = reduce(core, event);
        expect(newCore.players['0'].activeTitan?.powerTokens).toBe(3);
    });
});
