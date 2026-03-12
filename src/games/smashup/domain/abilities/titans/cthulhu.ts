/**
 * Cthulhu (克苏鲁) - Minions of Cthulhu
 * 
 * Special: 代替常规行动打出，抽取两张疯狂牌，打出泰坦到有己方随从的基地
 * Ongoing: 打出或抽取疯狂牌后，在泰坦上放置+1指示物
 * Talent: 抽取一张疯狂牌，或将手牌中的疯狂牌放入对手手牌
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';
import { MADNESS_CARD_DEF_ID } from '../../types';

/**
 * Special: 代替常规行动打出，抽取两张疯狂牌，打出泰坦到有己方随从的基地
 * 
 * 触发时机：玩家回合的"打出卡牌"阶段（Phase 2）
 * 
 * 代价：占用本回合的行动打出次数 + 抽取两张疯狂牌
 * 
 * 前置条件：至少有一个基地上有己方随从
 * 
 * 效果：将泰坦打出到选定的基地（该基地必须有己方随从）
 * 
 * 特殊规则：
 * - 抽取的两张疯狂牌不会触发 Ongoing 能力（泰坦还未入场）
 * - 打出泰坦不受行动打出位置限制（如 The Dread Gazebo、Magic Ward）
 * - Mark of Sleep 会阻止打出（因为无法使用行动打出次数）
 */
export function cthulhuSpecial(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: any[] = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 规则约束：只能在自己回合的 Play Cards 阶段，且必须有“常规行动”可用
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }
    if (player.actionsPlayed >= player.actionLimit) {
        return { events: [] };
    }

    // 已有泰坦在场时不能再打出新的泰坦
    if (player.activeTitan) {
        return { events: [] };
    }

    // 疯狂牌库必须存在且至少有 1 张
    if (!state.madnessDeck || state.madnessDeck.length === 0) {
        return { events: [] };
    }

    // 必须选择一个“你控制的随从”所在基地
    const basesWithMyMinions = state.bases
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => b.minions.some(m => m.controller === playerId));

    if (basesWithMyMinions.length === 0) {
        return { events: [] };
    }

    // titanZone 中需要有 Cthulhu
    const hasTitan = player.titanZone?.some(t => t.defId === 'titan_cthulhu');
    if (!hasTitan) return { events: [] };

    const options: PromptOption<{ baseIndex: number }>[] = basesWithMyMinions.map(({ i }, idx) => ({
        id: `base-${idx}`,
        label: `基地 ${i + 1}`,
        value: { baseIndex: i },
    }));

    const interaction = createSimpleChoice(
        `cthulhu_special_${now}`,
        playerId,
        `抽 2 张疯狂牌（替代本回合常规行动）并选择一个有你随从的基地打出 Cthulhu`,
        options,
        {
            sourceId: 'cthulhu_minions_cthulhu_special',
            targetType: 'base',
        }
    );

    return { events, matchState: queueInteraction(ctx.matchState, interaction) };
}

/**
 * Ongoing: 打出或抽取疯狂牌后，在泰坦上放置+1指示物
 * 
 * 触发时机：打出疯狂牌后 或 抽取疯狂牌后
 * 
 * 效果：在泰坦上放置一个+1战斗力指示物
 * 
 * 特殊规则：
 * - 打出疯狂牌选择"返回疯狂牌库"也算打出，会触发此能力
 * - 将疯狂牌放入其他玩家手牌不算"打出"或"抽取"，不触发
 * - 其他卡牌让你返回疯狂牌到牌库不算"打出"，不触发
 * - 指示物不受能力取消影响（永久效果）
 */
export function cthulhuOngoing(ctx: AbilityContext): AbilityResult {
    // Ongoing 触发由 postProcessSystemEvents 监听 MADNESS_DRAWN / ACTION_PLAYED(madness) 实现
    return { events: [] };
}

/**
 * Talent: 抽取一张疯狂牌，或将手牌中的疯狂牌放入对手手牌
 * 
 * 效果：二选一
 * - 选项1：抽取一张疯狂牌（会触发 Ongoing 能力）
 * - 选项2：将手牌中的一张疯狂牌放入对手手牌（不触发 Ongoing 能力）
 * 
 * 特殊规则：
 * - 抽取疯狂牌后可能超过10张手牌，等到己方"抽2张牌"阶段再弃牌
 */
export function cthulhuTalent(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: any[] = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 仅在自己回合的 Play Cards 阶段可以使用 Talent
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    const titan = player.activeTitan as any;
    if (!titan || titan.defId !== 'titan_cthulhu') {
        return { events: [] };
    }

    const canDrawMadness = !!(state.madnessDeck && state.madnessDeck.length > 0);
    const madnessInHand = player.hand.filter((c: any) => c.defId === MADNESS_CARD_DEF_ID);
    const canGiveMadness = madnessInHand.length > 0 && state.turnOrder.some(pid => pid !== playerId);

    if (!canDrawMadness && !canGiveMadness) {
        return { events: [] };
    }

    const options: PromptOption<
        | { action: 'draw' }
        | { action: 'give'; toPlayerId: string }
    >[] = [];

    if (canDrawMadness) {
        options.push({
            id: 'draw',
            label: '抽 1 张疯狂牌',
            value: { action: 'draw' },
        });
    }

    if (canGiveMadness) {
        for (const pid of state.turnOrder) {
            if (pid === playerId) continue;
            options.push({
                id: `give-${pid}`,
                label: `将 1 张疯狂牌放入玩家 ${pid} 的手牌`,
                value: { action: 'give', toPlayerId: pid },
            });
        }
    }

    const interaction = createSimpleChoice(
        `cthulhu_talent_${now}`,
        playerId,
        'Cthulhu Talent：抽 1 张疯狂牌，或把 1 张疯狂牌交给另一位玩家',
        options,
        {
            sourceId: 'cthulhu_minions_cthulhu_talent',
            targetType: 'generic',
        }
    );

    return { events, matchState: queueInteraction(ctx.matchState, interaction) };
}
