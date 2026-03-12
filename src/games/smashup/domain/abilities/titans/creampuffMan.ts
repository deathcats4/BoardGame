/**
 * Creampuff Man (奶油泡芙人) - Ghosts
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';

export function creampuffManSpecial(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 规则约束："On your turn" 且仅限 Play Cards 阶段
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    // 已有泰坦在场时不能再打出新的泰坦
    if (player.activeTitan) {
        return { events: [] };
    }

    // 手牌必须为 0 张
    if (player.hand.length !== 0) {
        return { events: [] };
    }

    // titanZone 中需要有 Creampuff Man
    const hasTitan = player.titanZone?.some(t => t.defId === 'titan_creampuff_man');
    if (!hasTitan) {
        return { events: [] };
    }

    const options = state.bases.map((_, i) => ({
        id: 'base-' + i,
        label: '基地 ' + (i + 1),
        value: { baseIndex: i },
    }));

    if (options.length === 0) {
        return { events: [] };
    }

    const interaction = createSimpleChoice(
        'creampuff_man_special_' + now,
        playerId,
        '选择要打出泰坦的基地',
        options,
        {
            sourceId: 'ghost_creampuff_man_special',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

export function creampuffManOngoing(ctx: AbilityContext): AbilityResult {
    // Ongoing 效果通过 TitanSystem.calculatePlayerPower 实现，这里无需直接发事件
    return { events: [] };
}

export function creampuffManTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 预先过滤弃牌堆中的标准行动牌（不在场上、不埋藏的普通行动）
    const standardActions = player.discard.filter(card =>
        card.type === 'action' && !card.abilities?.some((a: string) => a.includes('ongoing'))
    );

    // 没有可选的标准行动牌时，天赋不产生任何效果
    if (standardActions.length === 0) {
        return { events: [] };
    }

    // 手牌为空时，根据规则可以声明使用天赋但无法完成“弃一张牌”前提，因此不会继续产生交互
    if (player.hand.length === 0) {
        return { events: [] };
    }

    // 第一步：选择要弃置的手牌
    const handOptions = player.hand.map((card, i) => ({
        id: 'card-' + i,
        label: '弃置 ' + card.defId,
        value: { cardUid: card.uid },
    }));

    const interaction = createSimpleChoice(
        'creampuff_man_talent_' + now,
        playerId,
        '选择要弃置的手牌',
        handOptions,
        {
            sourceId: 'ghost_creampuff_man_talent_step1',
            targetType: 'card',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

