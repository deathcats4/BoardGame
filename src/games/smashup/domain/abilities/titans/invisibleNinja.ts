/**
 * Invisible Ninja (隐身忍者) - Ninjas
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent, CardInstance, ActiveTitan } from '../../types';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

export function invisibleNinjaSpecial1(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    // 0. 规则约束："On your turn" = 自己回合的 Play Cards 阶段（phase 2）
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    // 0.1 本回合开始时若 Invisible Ninja 已在场，则本回合不能再用 Special 1
    if (player.invisibleNinjaInPlayAtTurnStart) {
        return { events: [] };
    }

    // 0.2 已经有任意泰坦在场时，不能再通过 Special 1 打出 Invisible Ninja
    if (player.activeTitan) {
        return { events: [] };
    }

    if (player.hand.length === 0) {
        return { events: [] };
    }

    const validBases = [];
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        if (base.minions.some(m => m.controller === playerId)) {
            validBases.push(i);
        }
    }

    if (validBases.length === 0) {
        return { events: [] };
    }

    // 组合手牌 + 目标基地：一次选择同时确定要弃置的牌和泰坦要去的基地
    const options: PromptOption<{ cardUid: string; baseIndex: number }>[] = [];
    for (const card of player.hand) {
        for (const baseIndex of validBases) {
            options.push({
                id: `card-${card.uid}-base-${baseIndex}`,
                label: `弃置 ${card.defId}，将泰坦打到基地 ${baseIndex + 1}`,
                value: { cardUid: card.uid, baseIndex },
            });
        }
    }
    if (options.length === 0) {
        return { events: [] };
    }

    const interaction = createSimpleChoice(
        'invisible_ninja_special1_' + now,
        playerId,
        '选择要弃置的手牌和泰坦的目标基地',
        options,
        {
            sourceId: 'ninja_invisible_ninja_special1',
            targetType: 'card',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

export function invisibleNinjaOngoing(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    const deck = player.deck;
    if (!deck || deck.length === 0) {
        // 没有牌可看/抽
        return { events: [] };
    }

    // 1 张牌：直接抽 1 张，不创建交互
    if (deck.length === 1) {
        const top = deck[0];
        events.push({
            type: SU_EVENTS.CARDS_DRAWN,
            payload: {
                playerId,
                count: 1,
                cardUids: [top.uid],
                reason: 'titan_invisible_ninja_ongoing',
            },
            timestamp: now,
        });

        // 标记本回合已触发 Ongoing（通过 matchState.core 写回）
        const ms = matchState ?? ({ core: state, sys: { interaction: { current: null, queue: [] } } } as any);
        const core = ms.core as typeof state;
        const updatedCore = {
            ...core,
            players: {
                ...core.players,
                [playerId]: {
                    ...core.players[playerId],
                    invisibleNinjaOngoingUsedThisTurn: true,
                },
            },
        };

        return {
            events,
            matchState: { ...ms, core: updatedCore },
        };
    }

    // 2+ 张牌：查看顶两张，创建交互让玩家选择其一
    const topTwo = deck.slice(0, 2);
    const options: PromptOption<{ drawUid: string; shuffleBackUid: string }>[] = topTwo.map((card, index) => {
        const other = topTwo[1 - index];
        return {
            id: `choice-${index}`,
            label: `抽取 ${card.defId}（另一张洗回牌库）`,
            value: {
                drawUid: card.uid,
                shuffleBackUid: other.uid,
            },
        };
    });

    const interaction = createSimpleChoice(
        'invisible_ninja_ongoing_' + now,
        playerId,
        '选择要抽取的牌（另一张洗回牌库）',
        options,
        {
            sourceId: 'ninja_invisible_ninja_ongoing',
            targetType: 'card',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

export function invisibleNinjaSpecial2(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    const titan = player.activeTitan as (ActiveTitan | null);
    if (!titan || titan.defId !== 'titan_invisible_ninja') {
        return { events: [] };
    }

    // 0. 规则约束："At the start of your turn" = Start Turn（phase 1）
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'startTurn' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    const validMinions = player.hand.filter((card: CardInstance) =>
        card.type === 'minion'
    );

    if (validMinions.length === 0) {
        return { events: [] };
    }

    // 允许打到任意基地：组合手牌 + 目标基地
    const options: PromptOption<{ cardUid: string; baseIndex: number }>[] = [];
    for (const card of validMinions) {
        for (let baseIndex = 0; baseIndex < state.bases.length; baseIndex++) {
            options.push({
                id: `minion-${card.uid}-base-${baseIndex}`,
                label: `打出 ${card.defId} 到基地 ${baseIndex + 1}（战斗力≤3）`,
                value: { cardUid: card.uid, baseIndex },
            });
        }
    }

    const interaction = createSimpleChoice(
        'invisible_ninja_special2_' + now,
        playerId,
        '选择要打出的随从（战斗力≤3）及目标基地',
        options,
        {
            sourceId: 'ninja_invisible_ninja_special2',
            targetType: 'card',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}
