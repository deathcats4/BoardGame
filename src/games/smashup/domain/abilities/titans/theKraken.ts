/**
 * The Kraken (海怪克拉肯) - Pirates (海盗)
 * 
 * Special: 在一个有你随从的基地计分后，如果本泰坦不在场上，你可以打出本泰坦到新基地上
 * Ongoing: 在本泰坦所在的基地计分后，获得+1力量指示物
 * Talent: 将本泰坦移动到另一个基地，其他玩家在那里的所有随从战斗力-1直到你的下回合开始
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent } from '../../types';
import { SU_EVENT_TYPES as SU_EVENTS } from '../../events';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

// ============================================================================
// Special: 基地计分后打出泰坦
// ============================================================================

/**
 * The Kraken Special 能力
 * 
 * 规则：在一个有你随从的基地计分后，如果本泰坦不在场上，你可以打出本泰坦到新基地上
 * 
 * 实现要点：
 * - 触发时机：AFTER_SCORING 阶段
 * - 前置条件：计分基地上有该玩家的随从 && 泰坦不在场上
 * - 交互：选择目标基地（替换基地）
 * - 效果：打出泰坦到选定的基地
 * 
 * 注意：此能力在 postProcessSystemEvents 中监听 BASE_SCORED 事件触发
 */
export function theKrakenSpecial(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now, baseIndex } = ctx;
    const events: SmashUpEvent[] = [];

    // 1. 仅当本玩家当前没有在场泰坦时才能触发
    const player = state.players[playerId];
    if (!player || player.activeTitan) {
        return { events: [] };
    }

    // 2. 需要有合法的目标基地索引（由计分流程传入，为替换后的新基地所在位置）
    if (baseIndex === undefined || baseIndex < 0 || baseIndex >= state.bases.length) {
        return { events: [] };
    }

    // 3. 创建交互：在替换后的该基地上“释放巨妖”
    //    这里只允许单一选项，相当于一个“是否要打出？”的确认交互
    const options: PromptOption<{ baseIndex: number }>[] = [
        {
            id: `base-${baseIndex}`,
            label: `在新基地 ${baseIndex + 1} 打出 The Kraken`,
            value: { baseIndex },
        },
    ];

    const interaction = createSimpleChoice(
        `the_kraken_special_${now}`,
        playerId,
        '是否要在替换后的新基地上打出 The Kraken（Release the Kraken!）？',
        options,
        {
            sourceId: 'titan_the_kraken_special',
            targetType: 'base',
            autoResolveIfSingle: true,
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Ongoing: 基地计分后获得+1力量指示物
// ============================================================================

/**
 * The Kraken Ongoing / Special 2 能力
 * 
 * 规则：在本泰坦所在的基地计分后，移动一个你的随从到另一个基地
 * 
 * 实现要点：
 * - 触发时机：BASE_SCORED 事件后（在该基地被清空前）
 * - 前置条件：泰坦在计分基地上，且该基地上有你控制的随从
 * - 交互：选择要移动的随从和目的基地
 * - 效果：生成交互，由交互处理器完成 MINION_MOVED
 * 
 * 注意：此能力在计分流程 scoreOneBase 中触发，而非在 postProcessSystemEvents 中直接发事件。
 */
export function theKrakenOngoing(ctx: AbilityContext): AbilityResult {
    const { state, playerId, baseIndex, now } = ctx;
    const events: SmashUpEvent[] = [];

    if (baseIndex === undefined || baseIndex < 0 || baseIndex >= state.bases.length) {
        return { events: [] };
    }

    const base = state.bases[baseIndex];
    const player = state.players[playerId];
    if (!base || !player) {
        return { events: [] };
    }

    // 1. 找出该基地上由本玩家控制的随从
    const ownMinions = base.minions.filter(m => m.controller === playerId);
    if (ownMinions.length === 0) {
        return { events: [] };
    }

    // 2. 找出可供移动到的其他基地
    const candidateBases = state.bases
        .map((_, i) => i)
        .filter(i => i !== baseIndex);
    if (candidateBases.length === 0) {
        return { events: [] };
    }

    // 3. 构建“随从 + 目的基地”组合选项
    const options: PromptOption<{ minionUid: string; fromBaseIndex: number; toBaseIndex: number }>[] = [];
    for (const m of ownMinions) {
        for (const toBaseIndex of candidateBases) {
            options.push({
                id: `kraken-ongoing-${m.uid}-to-${toBaseIndex}`,
                label: `将随从(${m.defId})从基地 ${baseIndex + 1} 移动到基地 ${toBaseIndex + 1}`,
                value: {
                    minionUid: m.uid,
                    fromBaseIndex: baseIndex,
                    toBaseIndex,
                },
            });
        }
    }

    if (options.length === 0) {
        return { events: [] };
    }

    const interaction = createSimpleChoice(
        `the_kraken_ongoing_${now}`,
        playerId,
        '选择要移动的随从以及目标基地',
        options,
        {
            sourceId: 'titan_the_kraken_ongoing',
            targetType: 'minion',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// ============================================================================
// Talent: 移动泰坦并给其他玩家随从-1战斗力
// ============================================================================

/**
 * The Kraken Talent 能力
 * 
 * 规则：将本泰坦移动到另一个基地，其他玩家在那里的所有随从战斗力-1直到你的下回合开始
 * 
 * 实现要点：
 * - 主动能力：玩家在自己回合使用
 * - 效果1：移动泰坦到另一个基地
 * - 效果2：给目标基地上其他玩家的随从施加-1战斗力debuff
 * - 持续时间：直到该玩家的下回合开始
 */
export function theKrakenTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    // 1. 检查泰坦是否在场上
    const player = state.players[playerId];
    const titan = player.activeTitan;
    if (!titan) {
        return { events: [] };
    }

    // 2. 创建交互：选择目标基地
    const currentBaseIndex = titan.baseIndex;
    const options: PromptOption<{ baseIndex: number }>[] = state.bases
        .map((_, i) => i)
        .filter(i => i !== currentBaseIndex)
        .map(i => ({
            id: `base-${i}`,
            label: `基地 ${i + 1}`,
            value: { baseIndex: i },
        }));

    if (options.length === 0) {
        return { events: [] };
    }

    const interaction = createSimpleChoice(
        `the_kraken_talent_${now}`,
        playerId,
        '选择要移动泰坦到的基地',
        options,
        {
            sourceId: 'titan_the_kraken_talent',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}
