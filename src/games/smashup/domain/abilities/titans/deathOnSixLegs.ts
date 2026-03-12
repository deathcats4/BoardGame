/**
 * Death on Six Legs (六足死神) - Giant Ants
 *
 * Special: On your turn, during Play Cards, if your controlled minions
 * have 6+ total +1 counters, you may discard a card to play this titan.
 * Ongoing: Before one of your controlled minions would go to the discard pile,
 *          you may move one of its +1 counters onto this titan. (由引擎事件钩子实现)
 * Talent: Play an extra action.
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent } from '../../types';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

/**
 * Special（现代执行器）：
 * - 仅在自己回合、Play Cards 阶段
 * - 自身当前没有激活的泰坦
 * - titanZone 中存在 Death on Six Legs
 * - 由你控制的随从上的 +1 指示物总和 ≥ 6
 * - 手牌至少 1 张
 * 满足时创建步骤 1 交互：选择要弃置的手牌（后续由
 * `giant_ants_death_on_six_legs_special_step1` 交互处理器完成弃牌并触发步骤 2）。
 */
export function deathOnSixLegsSpecial(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 仅限自己回合 Play Cards 阶段
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder?.[state.currentPlayerIndex ?? 0];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events };
    }

    // 已有激活泰坦则不能再打
    if (player.activeTitan) {
        return { events };
    }

    // titanZone 中必须有 Death on Six Legs
    const hasTitanInZone = player.titanZone?.some((c: any) => c.defId === 'titan_death_on_six_legs');
    if (!hasTitanInZone) {
        return { events };
    }

    // 统计由该玩家“控制”的随从上的 +1 指示物（controller 语义）
    let totalCounters = 0;
    for (const base of state.bases) {
        for (const minion of base.minions) {
            if (minion.controller === playerId) {
                totalCounters += minion.powerCounters ?? 0;
            }
        }
    }

    if (totalCounters < 6) {
        return { events };
    }

    if (!player.hand || player.hand.length === 0) {
        return { events };
    }

    // 创建步骤 1：选择要弃置的手牌
    const handOptions: PromptOption<{ cardUid: string }>[] = player.hand.map((card: any) => ({
        id: `card-${card.uid}`,
        label: `弃置 ${card.defId}`,
        value: { cardUid: card.uid },
    }));

    const interaction = createSimpleChoice(
        `death_on_six_legs_special_${now}`,
        playerId,
        '选择要弃置的手牌',
        handOptions,
        {
            sourceId: 'giant_ants_death_on_six_legs_special_step1',
            targetType: 'card',
        }
    );

    return {
        events,
        matchState: queueInteraction(matchState, interaction),
    };
}

/**
 * Ongoing：真正的“丢弃前转移指示物”由 destroy / discard 管线钩子实现，
 * 这里保留占位导出，供注册表使用。
 */
export function deathOnSixLegsOngoing(_ctx: AbilityContext): AbilityResult {
    return { events: [] };
}

/**
 * Talent（现代执行器）：
 * - 仅在自己回合 Play Cards 阶段
 * - 需要当前已在场的 Death on Six Legs 泰坦
 * - 手牌中存在行动牌
 * 满足时创建交互：选择要作为“额外行动”打出的行动牌。
 * 实际 ACTION_PLAYED 由 `giant_ants_death_on_six_legs_talent` 交互处理器完成。
 */
export function deathOnSixLegsTalent(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 仅限自己回合 Play Cards 阶段
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder?.[state.currentPlayerIndex ?? 0];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events };
    }

    const titan = player.activeTitan;
    if (!titan || titan.defId !== 'titan_death_on_six_legs') {
        return { events };
    }

    const actionCards = (player.hand ?? []).filter((card: any) => card.type === 'action');
    if (actionCards.length === 0) {
        return { events };
    }

    const options: PromptOption<{ cardUid: string }>[] = actionCards.map((card: any) => ({
        id: `action-${card.uid}`,
        label: card.defId,
        value: { cardUid: card.uid },
    }));

    const interaction = createSimpleChoice(
        `death_on_six_legs_talent_${now}`,
        playerId,
        'Death on Six Legs - 选择要作为额外行动打出的行动牌',
        options,
        {
            sourceId: 'giant_ants_death_on_six_legs_talent',
            targetType: 'card',
        }
    );

    return {
        events,
        matchState: queueInteraction(matchState, interaction),
    };
}
