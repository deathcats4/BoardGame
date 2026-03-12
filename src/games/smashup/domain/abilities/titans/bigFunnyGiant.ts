/**
 * Big Funny Giant (快乐巨人) - Tricksters POD (小精怪)
 * 
 * Special 1: 代替常规随从打出，打出本泰坦
 * Ongoing: 其他玩家在此处打出随从后弃牌；其他玩家回合结束时如果没有随从，放置+1指示物
 * Special 2: 基地计分时，如果你是赢家且至少有一名其他玩家没有随从，获得1 VP
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent } from '../../types';
import { SU_EVENT_TYPES as SU_EVENTS } from '../../events';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

// ============================================================================
// Special 1: 代替常规随从打出，打出泰坦
// ============================================================================

/**
 * Big Funny Giant Special 1 能力
 * 
 * 规则：代替你的常规随从打出，你可以打出本泰坦
 * 
 * 实现要点：
 * - 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
 * - 代价：占用本回合的随从打出次数
 * - 交互：选择目标基地
 * - 效果：打出泰坦到选定的基地上
 * - 特殊规则：打出泰坦不受随从打出位置限制
 */
export function bigFunnyGiantSpecial1(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    // 1. 检查是否已经打出过随从
    const player = state.players[playerId];
    if (player.minionsPlayedThisTurn && player.minionsPlayedThisTurn >= 1) {
        // 已经打出过随从，不能使用此能力
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
        `big_funny_giant_special1_${now}`,
        playerId,
        '选择要打出泰坦的基地',
        options,
        {
            sourceId: 'titan_big_funny_giant_special1',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Ongoing: 其他玩家在此处打出随从后弃牌；其他玩家回合结束时如果没有随从，放置+1指示物
// ============================================================================

/**
 * Big Funny Giant Ongoing 能力
 * 
 * 规则：
 * - 效果1：在另一名玩家在此处打出随从后，他们必须弃置一张卡牌
 * - 效果2：在每个其他玩家的回合结束时，如果他们在此处没有随从，你可以在本泰坦上放置一个+1战斗力指示物
 * 
 * 实现要点：
 * - 效果1：监听 MINION_PLAYED 事件，检查是否在泰坦所在基地
 * - 效果2：回合结束时检查每个其他玩家是否在泰坦所在基地有随从
 * 
 * TODO: 需要在 postProcessSystemEvents 中监听 MINION_PLAYED 和 TURN_ENDED 事件
 */
export function bigFunnyGiantOngoing(_ctx: AbilityContext): AbilityResult {
    // Ongoing 能力在 postProcessSystemEvents 中监听事件触发
    // 不需要在这里生成事件
    return { events: [] };
}

// ============================================================================
// Special 2: 基地计分时，如果你是赢家且至少有一名其他玩家没有随从，获得1 VP
// ============================================================================

/**
 * Big Funny Giant Special 2 能力
 * 
 * 规则：当本泰坦所在的基地计分时，如果你是赢家且至少有一名其他玩家在此处没有随从，获得1 VP
 * 
 * 实现要点：
 * - 触发时机：基地计分时
 * - 条件：你是该基地的赢家 && 至少有一名其他玩家在该基地没有随从
 * - 效果：额外获得1 VP
 * 
 * TODO: 需要在计分逻辑中检查此能力
 */
export function bigFunnyGiantSpecial2(_ctx: AbilityContext): AbilityResult {
    // Special 2 能力在计分时自动检查
    // 不需要在这里生成事件
    return { events: [] };
}
