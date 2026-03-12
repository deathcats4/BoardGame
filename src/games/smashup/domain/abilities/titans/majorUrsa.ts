/**
 * Major Ursa (传奇熊骑兵) - Bear Cavalry
 *
 * Special: Instead of your regular minion play, you may play this titan.
 * Ongoing: After another player's minion moves to or from this base, you may place a +1 power counter on this titan.
 * Talent: Place a +1 power counter on a minion here OR move this titan.
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent } from '../../types';
import { SU_EVENT_TYPES as SU_EVENTS } from '../../events';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

// ============================================================================
// Special: 替代常规随从出牌打出泰坦
// ============================================================================

/**
 * Major Ursa Special 能力
 *
 * 规则：Instead of your regular minion play, you may play this titan.
 * - 只能在自己回合、Play Cards 阶段
 * - 本阶段尚未使用常规随从出牌额度
 * - 出泰坦消耗本回合的常规随从出牌
 * - 可打到任意基地
 */
export function majorUrsaSpecial(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 规则约束：仅限 Play Cards 阶段且当前玩家
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder?.[state.currentPlayerIndex ?? 0];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    // 已有泰坦在场时不能再打
    if (player.activeTitan) {
        return { events: [] };
    }

    // 本阶段尚未打出常规随从（instead of = 占用额度）
    const mainPhaseMinions = player.mainPhaseMinionsPlayedThisTurn ?? 0;
    if (mainPhaseMinions > 0) {
        return { events: [] };
    }

    // 需要还有随从额度
    if (player.minionsPlayed >= player.minionLimit) {
        return { events: [] };
    }

    // titanZone 中需要有 Major Ursa
    const hasTitan = player.titanZone?.some((c: any) => c.defId === 'titan_major_ursa');
    if (!hasTitan) return { events: [] };

    // 创建交互：选择基地（任意基地）
    const options: PromptOption<{ baseIndex: number }>[] = state.bases.map((_, i) => ({
        id: `base-${i}`,
        label: `基地 ${i + 1}`,
        value: { baseIndex: i },
    }));

    if (options.length === 0) return { events: [] };

    const interaction = createSimpleChoice(
        `major_ursa_special_${now}`,
        playerId,
        '选择要打出 Major Ursa 的基地（替代本回合常规随从出牌）',
        options,
        {
            sourceId: 'bear_cavalry_major_ursa_special',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Ongoing: 其他玩家随从进出本基地时，可择机给泰坦+1指示物
// ============================================================================

/**
 * Major Ursa Ongoing 能力
 *
 * 规则：After another player's minion moves to or from this base, you may place a +1 power counter on this titan.
 * - 触发时机：其他玩家的随从从/到本基地移动时
 * - 每次触发为可选（may），需给玩家选择权
 */
export function majorUrsaOngoing(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];
    const titan = player?.activeTitan as any;

    if (!player || !titan || titan.defId !== 'titan_major_ursa') {
        return { events: [] };
    }

    const options: PromptOption<{ placeCounter: boolean }>[] = [
        { id: 'yes', label: '给 Major Ursa 放置 +1 力量指示物', value: { placeCounter: true } },
        { id: 'no', label: '跳过', value: { placeCounter: false } },
    ];

    const interaction = createSimpleChoice(
        `major_ursa_ongoing_${now}`,
        playerId,
        '另一位玩家的随从进出本基地，你可以给 Major Ursa 放置一个 +1 力量指示物',
        options,
        {
            sourceId: 'bear_cavalry_major_ursa_ongoing',
            targetType: 'titan',
            autoResolveIfSingle: false,
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Talent: 本基地随从+1指示物 或 移动泰坦
// ============================================================================

/**
 * Major Ursa Talent 能力
 *
 * 规则：Place a +1 power counter on a minion here OR move this titan.
 * - 二选一：给本基地某随从+1指示物，或移动泰坦到另一基地
 */
export function majorUrsaTalent(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];
    const titan = player?.activeTitan as any;

    if (!player || !titan || titan.defId !== 'titan_major_ursa') {
        return { events: [] };
    }

    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder?.[state.currentPlayerIndex ?? 0];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    const baseIndex = titan.baseIndex;
    const base = state.bases[baseIndex];
    if (!base) return { events: [] };

    const options: PromptOption<{ mode: 'counter'; minionUid: string } | { mode: 'move'; toBaseIndex: number }>[] = [];

    // 选项 A：给本基地随从 +1 指示物
    for (const m of base.minions) {
        options.push({
            id: `counter-${m.uid}`,
            label: `给随从 ${m.defId} 放置 +1 指示物`,
            value: { mode: 'counter' as const, minionUid: m.uid },
        });
    }

    // 选项 B：移动泰坦
    for (let i = 0; i < state.bases.length; i++) {
        if (i === baseIndex) continue;
        options.push({
            id: `move-${i}`,
            label: `移动泰坦到基地 ${i + 1}`,
            value: { mode: 'move' as const, toBaseIndex: i },
        });
    }

    if (options.length === 0) return { events: [] };

    const interaction = createSimpleChoice(
        `major_ursa_talent_${now}`,
        playerId,
        'Major Ursa Talent：给本基地随从 +1 指示物 或 移动泰坦',
        options,
        {
            sourceId: 'bear_cavalry_major_ursa_talent',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}
