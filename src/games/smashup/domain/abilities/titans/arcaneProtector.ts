/**
 * Arcane Protector (奥术守卫) - Wizards (巫师)
 * 
 * Special: 在一个回合中打出第五张或更多卡牌后，你可以打出本泰坦
 * Ongoing: 你在此处每有两张手牌，就获得+1战斗力（最低为0）
 * Talent: 抽一张卡牌
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent, CardsDrawnEvent, DeckReshuffledEvent } from '../../types';
import { SU_EVENT_TYPES as SU_EVENTS } from '../../events';
import { drawCards } from '../../utils';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

// ============================================================================
// Special: 打出第5张或更多卡牌后，可以打出泰坦
// ============================================================================

/**
 * Arcane Protector Special 能力
 * 
 * 规则：在一个回合中打出第五张或更多卡牌后，你可以打出本泰坦
 * 
 * 实现要点：
 * - 触发时机：打出第5张或更多卡牌后立即触发
 * - 前置条件：该回合已打出至少5张卡牌 && 泰坦不在场上
 * - 交互：选择目标基地
 * - 效果：打出泰坦到选定的基地
 */
export function arcaneProtectorSpecial(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    // 1. 检查是否打出了至少5张卡牌（按玩家维度统计）
    const player = state.players[playerId];
    const cardsPlayedThisTurn = player?.cardsPlayedThisTurn ?? 0;
    if (cardsPlayedThisTurn < 5) {
        return { events: [] };
    }

    // 2. 检查泰坦是否在场上
    if (player.activeTitan) {
        return { events: [] };
    }

    // 3. 创建交互：选择目标基地
    const options: PromptOption<{ baseIndex: number }>[] = state.bases.map((_, i) => ({
        id: `base-${i}`,
        label: `基地 ${i + 1}`,
        value: { baseIndex: i },
    }));

    const interaction = createSimpleChoice(
        `arcane_protector_special_${now}`,
        playerId,
        '选择要打出泰坦的基地',
        options,
        {
            sourceId: 'titan_arcane_protector_special',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Ongoing: 每两张手牌提供+1战斗力
// ============================================================================

/**
 * Arcane Protector Ongoing 能力
 * 
 * 规则：你在此处每有两张手牌，就获得+1战斗力（最低为0）
 * 
 * 实现要点：
 * - 持续生效：只要泰坦在场上就生效
 * - 计算方式：Math.floor(手牌数量 / 2)
 * - 动态计算：手牌数量变化时，战斗力立即变化
 * - 加成对象：该玩家在泰坦所在基地的总战斗力
 * 
 * 注意：此能力不需要主动触发，在计算总战斗力时自动生效
 */
export function arcaneProtectorOngoing(_ctx: AbilityContext): AbilityResult {
    // Ongoing 能力在计算总战斗力时自动生效
    // 不需要在这里生成事件
    return { events: [] };
}

// ============================================================================
// Talent: 抽一张卡牌
// ============================================================================

/**
 * Arcane Protector Talent 能力
 * 
 * 规则：抽一张卡牌
 * 
 * 实现要点：
 * - 主动能力：玩家在自己回合使用
 * - 效果：从牌库抽一张卡牌
 */
export function arcaneProtectorTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    const player = state.players[playerId];
    if (!player) {
        return { events: [] };
    }

    // 使用通用 drawCards 工具处理抽牌与洗牌逻辑
    const drawResult = drawCards(player, 1, ctx.random);

    // 如果发生洗牌，发出 DECK_RESHUFFLED 事件
    if (drawResult.reshuffledDeckUids && drawResult.reshuffledDeckUids.length > 0) {
        const reshuffledEvt: DeckReshuffledEvent = {
            type: SU_EVENTS.DECK_RESHUFFLED,
            payload: {
                playerId,
                newDeckUids: drawResult.reshuffledDeckUids,
            },
            timestamp: now,
        };
        events.push(reshuffledEvt);
    }

    // 发出 CARDS_DRAWN 事件（如果确实抽到了牌）
    if (drawResult.drawnUids.length > 0) {
        const drawnEvt: CardsDrawnEvent = {
            type: SU_EVENTS.CARDS_DRAWN,
            payload: {
                playerId,
                count: drawResult.drawnUids.length,
                cardUids: drawResult.drawnUids,
                reason: 'titan_arcane_protector_talent',
            },
            timestamp: now,
        };
        events.push(drawnEvt);
    }

    return { events };
}
