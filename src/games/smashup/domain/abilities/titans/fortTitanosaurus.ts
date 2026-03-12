/**
 * Fort Titanosaurus (泰坦堡垒龙) - Dinosaurs (恐龙)
 * 
 * Special: 消灭一个己方随从来打出本泰坦，并获得等于该随从战斗力的力量指示物
 * Ongoing: 在打出影响随从的行动卡后，放置一个+1力量指示物到本泰坦上（每回合一次）
 * Talent: 如果本泰坦有4个或更多力量指示物，抽一张卡牌
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent } from '../../types';
import { SU_EVENT_TYPES as SU_EVENTS } from '../../events';
import { getEffectivePower } from '../../ongoingModifiers';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

// ============================================================================
// Special: 消灭己方随从来打出泰坦
// ============================================================================

/**
 * Fort Titanosaurus Special 能力
 * 
 * 规则：消灭一个己方随从来打出本泰坦，并获得等于该随从战斗力的力量指示物
 * 
 * 实现要点：
 * - 触发时机：玩家回合的打出卡牌阶段（Phase 2）
 * - 前置条件：本回合未打出随从 && 场上有己方随从 && 泰坦不在场上
 * - 交互：选择要消灭的己方随从
 * - 效果：消灭随从 → 设置 titanPlacementAllowed → 玩家点击泰坦 → 打出泰坦到被消灭随从的基地 → 添加力量指示物
 */
export function fortTitanosaurusSpecial(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    // 0. 规则约束："On your turn" 且仅限 Play Cards 阶段
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    // 0.1 已经有泰坦在场时，不能再 play 另一个泰坦
    if (player.activeTitan) {
        return { events: [] };
    }

    // 1. 检查前置条件：本回合未打出随从
    const mainPhaseMinions = player.mainPhaseMinionsPlayedThisTurn ?? 0;
    if (mainPhaseMinions > 0) {
        // 本回合在出牌阶段已打出随从，不能使用此能力
        return { events: [] };
    }

    // 2. 收集所有己方随从（战力含持续修正，与规则“当前战力（含所有修正与指示物）”一致）
    const ownMinions: Array<{ uid: string; defId: string; baseIndex: number; power: number }> = [];
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        for (const minion of base.minions) {
            if (minion.controller === playerId) {
                const power = getEffectivePower(state, minion, i);
                ownMinions.push({
                    uid: minion.uid,
                    defId: minion.defId,
                    baseIndex: i,
                    power,
                });
            }
        }
    }

    if (ownMinions.length === 0) {
        // 没有己方随从，不能使用此能力
        return { events: [] };
    }

    // 3. 创建交互：选择要消灭的随从
    const options: PromptOption<{ minionUid: string; baseIndex: number; power: number }>[] = ownMinions.map((m, i) => ({
        id: `minion-${i}`,
        label: `消灭 ${m.defId}（战斗力 ${m.power}）`,
        value: { minionUid: m.uid, baseIndex: m.baseIndex, power: m.power },
    }));

    const interaction = createSimpleChoice(
        `fort_titanosaurus_special_${now}`,
        playerId,
        '选择要消灭的随从来打出泰坦',
        options,
        {
            sourceId: 'titan_fort_titanosaurus_special',
            targetType: 'minion',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Ongoing: 打出影响随从的行动卡后，放置+1力量指示物（每回合一次）
// ============================================================================

/**
 * Fort Titanosaurus Ongoing 能力
 * 
 * 规则：在打出影响随从的行动卡后，放置一个+1力量指示物到本泰坦上（每回合一次）
 * 
 * 实现要点：
 * - 触发时机：ACTION_PLAYED 事件后
 * - 前置条件：泰坦在场上 && 本回合尚未触发
 * - 判断"影响随从"：行动卡的目标是随从（targetMinionUid 存在）
 * - 效果：添加1个力量指示物到泰坦上
 * - 频率限制：每回合一次
 * 
 * TODO: 需要在 SmashUpCore 中添加 fortTitanosaurusOngoingUsedThisTurn 字段
 */
export function fortTitanosaurusOngoing(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now, targetMinionUid } = ctx;
    const events: SmashUpEvent[] = [];
    const player = state.players[playerId];

    // 1. 检查前置条件：泰坦在场上 && 本回合尚未触发
    const titan = player?.activeTitan;
    if (!titan || titan.defId !== 'titan_fort_titanosaurus') {
        return { events: [] };
    }

    if (player.fortTitanosaurusOngoingUsedThisTurn) {
        return { events: [] }; // 本回合已触发
    }

    // 2. 检查是否"影响随从"
    if (!targetMinionUid) {
        return { events: [] }; // 没有目标随从
    }

    // 3. 收集受影响的随从（如果还在场上）
    let affectedMinionInfo: { uid: string; baseIndex: number; power: number; defId: string } | undefined;

    // 我们需要在全场搜索这个随从
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        const minion = base.minions.find(m => m.uid === targetMinionUid);
        if (minion) {
            const power = minion.basePower + minion.powerCounters + minion.powerModifier + minion.tempPowerModifier;
            affectedMinionInfo = {
                uid: minion.uid,
                baseIndex: i,
                power,
                defId: minion.defId
            };
            break;
        }
    }

    // 4. 创建交互选项（支持 and/or）：
    // - 只放到泰坦
    // - 只放到受影响随从
    // - 同时放到泰坦和该随从
    const options: PromptOption<{ placeOnTitan: boolean; minionUid?: string; baseIndex?: number }>[] = [];

    // 选项 1: 只放到泰坦上
    options.push({
        id: `place-on-titan`,
        label: `只放到泰坦上（当前 ${titan.powerTokens} 个力量指示物）`,
        value: { placeOnTitan: true }
    });

    // 选项 2/3: 涉及受影响随从的选择
    if (affectedMinionInfo) {
        options.push({
            id: `place-on-minion-${affectedMinionInfo.uid}`,
            label: `只放到 ${affectedMinionInfo.defId} 上（当前力量 ${affectedMinionInfo.power}）`,
            value: { placeOnTitan: false, minionUid: affectedMinionInfo.uid, baseIndex: affectedMinionInfo.baseIndex }
        });
        options.push({
            id: `place-on-both-${affectedMinionInfo.uid}`,
            label: `同时放到泰坦和 ${affectedMinionInfo.defId} 上`,
            value: { placeOnTitan: true, minionUid: affectedMinionInfo.uid, baseIndex: affectedMinionInfo.baseIndex }
        });
    }

    // 5. 创建交互
    const interaction = createSimpleChoice(
        `fort_titanosaurus_ongoing_${now}`,
        playerId,
        'Fort Titanosaurus Ongoing 能力触发',
        options,
        {
            sourceId: 'titan_fort_titanosaurus_ongoing',
            targetType: 'generic',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Talent: 如果泰坦有4+力量指示物，抽一张卡牌
// ============================================================================

/**
 * Fort Titanosaurus Talent 能力
 * 
 * 规则：如果本泰坦有4个或更多力量指示物，抽一张卡牌
 * 
 * 实现要点：
 * - 主动能力：玩家在自己回合使用
 * - 前置条件：泰坦有4+力量指示物
 * - 效果：抽一张卡牌
 */
export function fortTitanosaurusTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    // 1. 检查泰坦是否有4+力量指示物
    const player = state.players[playerId];
    const titan = player?.activeTitan;

    if (!titan || titan.powerTokens < 4) {
        // 不满足条件，不能使用
        return { events: [] };
    }

    // 2. 抽一张卡牌
    const deck = player.deck;
    if (deck.length === 0) {
        // 牌库为空，不能抽牌
        return { events: [] };
    }

    const drawnCard = deck[0];
    events.push({
        type: SU_EVENTS.CARDS_DRAWN,
        payload: {
            playerId,
            count: 1,
            cardUids: [drawnCard.uid],
            reason: 'titan_fort_titanosaurus_talent',
        },
        timestamp: now,
    });

    return { events };
}
