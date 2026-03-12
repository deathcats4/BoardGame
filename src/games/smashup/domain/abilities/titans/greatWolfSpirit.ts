/**
 * Great Wolf Spirit (伟大狼灵) - Werewolves (狼人)
 * 
 * Special: 在你的回合中，如果你在两个或更多基地上拥有最高战斗力，你可以将本泰坦打出到其中一个基地上
 * Ongoing: 在你的回合中，你在此处的卡牌可以再使用一次它们的天赋能力
 * Talent: 你的一个随从获得+1战斗力直到回合结束
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent } from '../../types';
import { SU_EVENT_TYPES as SU_EVENTS } from '../../events';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

// ============================================================================
// Special: 在两个或更多基地上拥有最高战斗力时，打出泰坦
// ============================================================================

/**
 * Great Wolf Spirit Special 能力
 * 
 * 规则：在你的回合中，如果你在两个或更多基地上拥有最高战斗力，你可以将本泰坦打出到其中一个基地上
 * 
 * 实现要点：
 * - 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
 * - 前置条件：在至少2个基地上拥有最高战斗力（平局也算）且每个基地至少有1点战斗力
 * - 交互：选择满足条件的基地之一
 * - 效果：打出泰坦到选定的基地上
 */
export function greatWolfSpiritSpecial(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now, matchState } = ctx;
    const events: SmashUpEvent[] = [];

    // 1. 只能在自己回合的 Play Cards 阶段使用
    const phase = (matchState as any)?.sys?.phase;
    const turnOrder: string[] | undefined = (matchState as any)?.core?.turnOrder;
    const currentPlayerIndex: number | undefined = (matchState as any)?.core?.currentPlayerIndex;
    const currentPlayerId =
        turnOrder && typeof currentPlayerIndex === 'number' ? turnOrder[currentPlayerIndex] : undefined;

    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    // 2. 检查泰坦是否已经在场上，且玩家泰坦区中是否仍有本泰坦
    const player = state.players[playerId];
    if (player.activeTitan) {
        return { events: [] };
    }
    const hasTitanInZone = (player.titanZone ?? []).some(c => c.defId === 'titan_great_wolf_spirit');
    if (!hasTitanInZone) {
        return { events: [] };
    }

    // 3. 检查在多少个基地上拥有最高战斗力
    const eligibleBases: number[] = [];
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        
        // 计算该玩家在此基地的总战斗力
        let myPower = 0;
        for (const minion of base.minions) {
            if (minion.controller === playerId) {
                myPower += minion.basePower + minion.powerCounters + minion.powerModifier + minion.tempPowerModifier;
            }
        }
        
        // 必须至少有1点战斗力
        if (myPower < 1) continue;
        
        // 检查是否是最高战斗力（平局也算）
        let isHighest = true;
        for (const otherPlayerId of Object.keys(state.players)) {
            if (otherPlayerId === playerId) continue;
            
            let otherPower = 0;
            for (const minion of base.minions) {
                if (minion.controller === otherPlayerId) {
                    otherPower += minion.basePower + minion.powerCounters + minion.powerModifier + minion.tempPowerModifier;
                }
            }
            
            if (otherPower > myPower) {
                isHighest = false;
                break;
            }
        }
        
        if (isHighest) {
            eligibleBases.push(i);
        }
    }

    // 4. 检查是否满足条件（至少2个基地）
    if (eligibleBases.length < 2) {
        return { events: [] };
    }

    // 5. 创建交互：选择目标基地
    const options: PromptOption<{ baseIndex: number }>[] = eligibleBases.map((i) => ({
        id: `base-${i}`,
        label: `基地 ${i + 1}`,
        value: { baseIndex: i },
    }));

    const interaction = createSimpleChoice(
        `great_wolf_spirit_special_${now}`,
        playerId,
        '选择要打出泰坦的基地',
        options,
        {
            sourceId: 'titan_great_wolf_spirit_special',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Ongoing: 在此处的卡牌可以再使用一次天赋能力
// ============================================================================

/**
 * Great Wolf Spirit Ongoing 能力
 * 
 * 规则：在你的回合中，你在此处的卡牌可以再使用一次它们的天赋能力
 * 
 * 实现要点：
 * - 持续生效：只要泰坦在场上就生效
 * - 效果：该基地上己方的所有卡牌（随从、行动、泰坦）可以额外使用一次天赋能力
 * - 适用范围：只在己方回合的Phase 2生效
 * 
 * 注意：此能力不需要主动触发，在天赋使用次数检查时自动生效
 */
export function greatWolfSpiritOngoing(_ctx: AbilityContext): AbilityResult {
    // Ongoing 能力在天赋使用次数检查时自动生效
    // 不需要在这里生成事件
    return { events: [] };
}

// ============================================================================
// Talent: 一个随从获得+1战斗力直到回合结束
// ============================================================================

/**
 * Great Wolf Spirit Talent 能力
 * 
 * 规则：你的一个随从获得+1战斗力直到回合结束
 * 
 * 实现要点：
 * - 主动能力：玩家可以在自己回合使用
 * - 交互：选择己方的一个随从（不能选择停滞中的）
 * - 效果：给予+1战斗力buff，持续到回合结束
 */
export function greatWolfSpiritTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now, matchState } = ctx;
    const events: SmashUpEvent[] = [];

    // 0. 只能在自己回合的 Play Cards 阶段，且 Great Wolf Spirit 已在场时使用
    const phase = (matchState as any)?.sys?.phase;
    const turnOrder: string[] | undefined = (matchState as any)?.core?.turnOrder;
    const currentPlayerIndex: number | undefined = (matchState as any)?.core?.currentPlayerIndex;
    const currentPlayerId =
        turnOrder && typeof currentPlayerIndex === 'number' ? turnOrder[currentPlayerIndex] : undefined;

    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    const player = state.players[playerId];
    const activeTitan = player?.activeTitan;
    if (!activeTitan || activeTitan.defId !== 'titan_great_wolf_spirit') {
        return { events: [] };
    }

    // 1. 收集所有己方随从（不包括停滞中的）
    const ownMinions: Array<{ uid: string; defId: string; baseIndex: number }> = [];
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        for (const minion of base.minions) {
            if (minion.controller === playerId && !minion.inStasis) {
                ownMinions.push({
                    uid: minion.uid,
                    defId: minion.defId,
                    baseIndex: i,
                });
            }
        }
    }

    if (ownMinions.length === 0) {
        // 没有己方随从，不能使用此能力
        return { events: [] };
    }

    // 2. 创建交互：选择目标随从
    const options: PromptOption<{ minionUid: string }>[] = ownMinions.map((m, i) => ({
        id: `minion-${i}`,
        label: `${m.defId}（基地 ${m.baseIndex + 1}）`,
        value: { minionUid: m.uid },
    }));

    const interaction = createSimpleChoice(
        `great_wolf_spirit_talent_${now}`,
        playerId,
        '选择要获得+1战斗力的随从',
        options,
        {
            sourceId: 'titan_great_wolf_spirit_talent',
            targetType: 'minion',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}
