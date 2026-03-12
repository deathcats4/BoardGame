/**
 * Killer Kudzu (杀手蔓藤) - Plants
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent, CardInstance } from '../../types';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

/**
 * Special 1：回合开始自动累积指示物，已在 reducer 的 TURN_STARTED 分支中实现。
 * 领域层不再额外创建交互。
 */
export function killerKudzuSpecial1(_ctx: AbilityContext): AbilityResult {
    return { events: [] };
}

/**
 * Special 2: On your turn, during Play Cards, if this titan has three or more
 * counters and你仍然保留本回合的常规随从出牌次数，且当前没有泰坦在场，
 * 你可以改为打出 Killer Kudzu。这里只负责前置条件和基地选择。
 */
export function killerKudzuSpecial2(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    // 仅在自己回合的 Play Cards 阶段可用（"On your turn"）
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    // 已经有泰坦在场时，不能再通过 Special 打出 Killer Kudzu
    if (player.activeTitan) {
        return { events: [] };
    }

    // 累积的指示物不足 3 个，不能使用
    const counter = player.killerKudzuCounter ?? 0;
    if (counter < 3) {
        return { events: [] };
    }

    // 必须有正常随从额度（"instead of your regular minion play"）
    if (player.minionsPlayed >= player.minionLimit) {
        return { events: [] };
    }

    // 泰坦必须在 titanZone 中
    const titanCard = player.titanZone.find(c => c.defId === 'titan_killer_kudzu');
    if (!titanCard) {
        return { events: [] };
    }

    // 允许玩家选择要放置泰坦的基地（任意基地）
    const options = state.bases.map((_, i) => ({
        id: 'base-' + i,
        label: '基地 ' + (i + 1),
        value: { baseIndex: i },
    }));

    const interaction = createSimpleChoice(
        'killer_kudzu_special2_' + now,
        playerId,
        '选择要打出 Killer Kudzu 的基地',
        options,
        {
            sourceId: 'plant_killer_kudzu_special2',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

/**
 * Ongoing: After this titan leaves play, shuffle up to two minions from your
 * discard pile into your deck OR draw two cards.
 *
 * 触发时机由 domain/index.ts 的 postProcessSystemEvents 在处理
 * TITAN_REMOVED(titan_killer_kudzu) 时调用。
 */
export function killerKudzuOngoing(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const player = state.players[playerId];
    const events: SmashUpEvent[] = [];

    if (!player) {
        return { events };
    }

    const discardMinions: CardInstance[] = player.discard.filter(c => c.type === 'minion');
    const hasShuffleOption = discardMinions.length > 0;
    const hasDeckCards = player.deck.length > 0 || player.discard.length > 0;

    // 既没有可洗回的随从，也没有可抽的牌时，什么也不做
    if (!hasShuffleOption && !hasDeckCards) {
        return { events };
    }

    const options: PromptOption<{ mode: 'draw' | 'shuffle' }>[] = [];

    if (hasDeckCards) {
        options.push({
            id: 'draw-2',
            label: '抽两张牌',
            value: { mode: 'draw' },
        });
    }

    if (hasShuffleOption) {
        options.push({
            id: 'shuffle-minions',
            label: '将最多两张随从洗回牌库',
            value: { mode: 'shuffle' },
        });
    }

    if (options.length === 0) {
        return { events };
    }

    const interaction = createSimpleChoice(
        'killer_kudzu_ongoing_' + now,
        playerId,
        'Killer Kudzu：选择离场后的效果',
        options,
        {
            sourceId: 'plant_killer_kudzu_ongoing',
            targetType: 'generic',
            // 只有一个可选项时自动执行（例如弃牌堆没有随从时只剩抽牌）
            autoResolveIfSingle: true,
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

export function killerKudzuTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    if (!player.activeTitan || player.activeTitan.defId !== 'titan_killer_kudzu') {
        return { events };
    }

    const titan = player.activeTitan;
    const maxPower = titan.powerTokens || 0;

    const validMinions = player.discard.filter((card: CardInstance) =>
        card.type === 'minion' && (card as any).power <= maxPower
    );

    if (validMinions.length === 0) {
        return { events };
    }

    const options: PromptOption<{ cardUid: string }>[] = validMinions.map((card, i) => ({
        id: 'minion-' + i,
        label: '打出 ' + card.defId + ' (战斗力 ' + (card as any).power + ')',
        value: { cardUid: card.uid },
    }));

    const interaction = createSimpleChoice(
        'killer_kudzu_talent_' + now,
        playerId,
        '选择要从弃牌堆打出的随从',
        options,
        {
            sourceId: 'plant_killer_kudzu_talent',
            targetType: 'card',
            autoRefresh: 'discard',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}
