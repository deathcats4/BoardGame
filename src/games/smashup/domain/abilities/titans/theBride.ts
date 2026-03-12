/**
 * The Bride (怪人的新娘) - Mad Scientists (疯狂科学家)
 *
 * Special: 在回合开始时，选择两个不同的效果，并以任意顺序对不同的随从执行，以打出本泰坦
 * Ongoing: 每回合一次，在你在你的随从上放置或移除战斗力指示物后，抽一张卡牌
 * Talent: 在此处一个随从上放置+1指示物，或移除2个指示物以打出额外行动
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import type { SmashUpEvent } from '../../types';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

// ============================================================================
// Special: 选择两个效果对不同随从执行，以打出泰坦
// ============================================================================

/**
 * The Bride Special 能力
 *
 * 规则：在你的回合开始时，你可以选择两个效果并以任意顺序对不同的随从执行，以打出本泰坦：
 * - 将你拥有的一个随从从手牌或弃牌堆放入盒子中
 * - 消灭你的一个随从
 * - 从你的一个随从上移除一个+1战斗力指示物
 *
 * 实现要点：
 * - 触发时机：回合开始阶段（Phase 1: startTurn），仅限当前玩家自己的回合
 * - 前置条件：玩家当前没有 activeTitan，titanZone 中存在 The Bride
 * - 前置资源：必须“能够完成”两个不同的效果，否则不创建交互
 * - 交互（多步，由 InteractionHandler 实现）：
 *   1) 选择 2 个效果（从 3 个中选择）
 *   2) 选择执行顺序
 *   3) 为每个效果选择目标随从（必须是不同随从）
 *   4) 选择打出泰坦的基地
 * - 本 executor 只负责创建第一个“选择两个效果”的交互，后续步骤由
 *   mad_scientists_the_bride_special_* 交互处理器处理。
 */
export function theBrideSpecial(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    const player = state.players[playerId];
    if (!player) return { events };

    // 0. 仅在自己回合的 Start Turn 阶段可用
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder?.[state.currentPlayerIndex ?? 0];
    if (phase !== 'startTurn' || currentPlayerId !== playerId) {
        return { events };
    }

    // 1. 不能已有 activeTitan，且 titanZone 中必须有 The Bride
    if (player.activeTitan) {
        return { events };
    }
    const hasBrideInZone = player.titanZone?.some((c: any) => c.defId === 'titan_the_bride');
    if (!hasBrideInZone) {
        return { events };
    }

    // 2. 计算三个效果是否“可完成”
    // 效果1：将拥有的随从从手牌或弃牌堆放入盒子（owner === playerId 的随从）
    const ownedMinionsInHandOrDiscard = [
        ...(player.hand ?? []).filter((c: any) => c.type === 'minion'),
        ...(player.discard ?? []).filter((c: any) => c.type === 'minion'),
    ];
    const canPlaceInBox = ownedMinionsInHandOrDiscard.length > 0;

    // 效果2：消灭己方随从（控制者为你，且不在 stasis 中）
    const controlledMinions: Array<{ uid: string; baseIndex: number }> = [];
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        for (const minion of base.minions) {
            if ((minion as any).controller === playerId && !(minion as any).inStasis) {
                controlledMinions.push({ uid: (minion as any).uid, baseIndex: i });
            }
        }
    }
    const canDestroy = controlledMinions.length > 0;

    // 效果3：从己方随从上移除+1指示物
    const minionsWithCounters = controlledMinions.filter(m => {
        const base = state.bases[m.baseIndex];
        const minion = base.minions.find(mn => mn.uid === m.uid);
        return minion && (minion as any).powerCounters > 0;
    });
    const canRemoveCounter = minionsWithCounters.length > 0;

    const availableEffects = [canPlaceInBox, canDestroy, canRemoveCounter].filter(Boolean).length;
    if (availableEffects < 2) {
        // 无法选择两个不同效果，Special 不可用
        return { events };
    }

    // 3. 创建第一步交互：选择两个不同的效果
    type EffectId = 'placeInBox' | 'destroy' | 'removeCounter';
    const effectOptions: PromptOption<{ effect: EffectId }>[] = [];
    if (canPlaceInBox) {
        effectOptions.push({
            id: 'placeInBox',
            label: '将一个你拥有的随从从手牌或弃牌堆放入盒子',
            value: { effect: 'placeInBox' },
        });
    }
    if (canDestroy) {
        effectOptions.push({
            id: 'destroy',
            label: '消灭你的一个随从',
            value: { effect: 'destroy' },
        });
    }
    if (canRemoveCounter) {
        effectOptions.push({
            id: 'removeCounter',
            label: '从你的一个随从上移除一个+1指示物',
            value: { effect: 'removeCounter' },
        });
    }

    const interaction = createSimpleChoice(
        `the_bride_special_effects_${now}`,
        playerId,
        '选择两个不同的效果来打出怪人的新娘',
        effectOptions,
        {
            sourceId: 'mad_scientists_the_bride_special_step_effects',
            targetType: 'generic',
            multi: { min: 2, max: 2 },
        }
    );

    return {
        events,
        matchState: queueInteraction(matchState, interaction),
    };
}

// ============================================================================
// Ongoing: 每回合一次，在放置或移除指示物后抽牌
// ============================================================================

/**
 * The Bride Ongoing 能力
 * 
 * 规则：每回合一次，在你在你的随从上放置或移除战斗力指示物后，抽一张卡牌
 * 
 * 实现要点：
 * - 触发时机：在己方随从上放置或移除+1战斗力指示物后
 * - 频率限制：每回合一次
 * - 效果：抽一张卡牌
 * 
 * TODO: 需要在 postProcessSystemEvents 中监听 POWER_COUNTER_ADDED 和 POWER_COUNTER_REMOVED 事件
 */
export function theBrideOngoing(_ctx: AbilityContext): AbilityResult {
    // Ongoing 能力在 postProcessSystemEvents 中监听事件触发
    // 不需要在这里生成事件
    return { events: [] };
}

// ============================================================================
// Talent: 放置+1指示物，或移除2个指示物以打出额外行动
// ============================================================================

/**
 * The Bride Talent 能力
 * 
 * 规则：在此处你的一个随从上放置一个+1战斗力指示物，或者从你的随从上总共移除两个+1战斗力指示物以打出一个额外行动
 * 
 * 实现要点：
 * - 主动能力：玩家可以在自己回合使用
 * - 效果：二选一
 *   - 选项1：在泰坦所在基地的己方随从上放置一个+1指示物
 *   - 选项2：从己方随从上总共移除2个+1指示物，打出一个额外行动
 */
export function theBrideTalent(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: SmashUpEvent[] = [];

    const player = state.players[playerId];
    if (!player) return { events };

    // 仅在自己回合 Play Cards 阶段使用天赋
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder?.[state.currentPlayerIndex ?? 0];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events };
    }

    const titan = player.activeTitan;
    if (!titan || titan.defId !== 'titan_the_bride') {
        return { events };
    }

    // 选项 1：泰坦所在基地上的己方随从
    const minionsAtTitanBase: Array<{ uid: string; defId: string }> = [];
    const titanBase = state.bases[titan.baseIndex];
    for (const minion of titanBase.minions) {
        if ((minion as any).controller === playerId && !(minion as any).inStasis) {
            minionsAtTitanBase.push({
                uid: (minion as any).uid,
                defId: (minion as any).defId,
            });
        }
    }

    // 选项 2：全场有 +1 指示物的己方随从（总数至少 2）
    let totalCounters = 0;
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        for (const minion of base.minions) {
            if ((minion as any).controller === playerId && !(minion as any).inStasis && (minion as any).powerCounters > 0) {
                totalCounters += (minion as any).powerCounters;
            }
        }
    }

    const canPlaceCounter = minionsAtTitanBase.length > 0;
    const canRemoveCounters = totalCounters >= 2 && (player.hand ?? []).some((c: any) => c.type === 'action');

    if (!canPlaceCounter && !canRemoveCounters) {
        return { events };
    }

    type TalentMode = 'placeCounter' | 'removeForAction';
    const options: PromptOption<{ mode: TalentMode }>[] = [];
    if (canPlaceCounter) {
        options.push({
            id: 'placeCounter',
            label: '在此基地你的一个随从上放置一个+1指示物',
            value: { mode: 'placeCounter' },
        });
    }
    if (canRemoveCounters) {
        options.push({
            id: 'removeForAction',
            label: '从你的随从上总共移除2个+1指示物以打出一个额外行动',
            value: { mode: 'removeForAction' },
        });
    }

    const interaction = createSimpleChoice(
        `the_bride_talent_mode_${now}`,
        playerId,
        '选择怪人的新娘天赋效果',
        options,
        {
            sourceId: 'mad_scientists_the_bride_talent_mode',
            targetType: 'generic',
        }
    );

    return {
        events,
        matchState: queueInteraction(matchState, interaction),
    };
}
