/**
 * 大杀四方 - 交互处理函数注册表
 *
 * 当能力需要玩家交互时：
 * 1. 能力执行器直接调用 createSimpleChoice() 创建交互
 * 2. 能力执行器直接调用 queueInteraction() 将交互加入队列
 * 3. 玩家选择后，SYS_INTERACTION_RESOLVED 事件触发
 * 4. SmashUpEventSystem 从 sourceId 查找本注册表的处理函数
 * 5. 处理函数生成后续事件
 */

import type { PlayerId, RandomFn, MatchState } from '../../../engine/types';
import { getBaseDef, getCardDef } from '../data/cards';
import { SU_EVENTS, type SmashUpCore, type SmashUpEvent, type MinionDestroyedEvent } from './types';
import { triggerBaseAbility, getEligibleBaseAbilities } from './baseAbilities';
import { getEligibleTriggers, fireSpecificTrigger } from './ongoingEffects';
import { reduce } from './reducer';
import { queueInteraction } from '../../../engine/index';

// ============================================================================
// 交互处理函数类型
// ============================================================================

/** 交互处理函数 */
export type InteractionHandler = (
    state: MatchState<SmashUpCore>,
    playerId: PlayerId,
    value: unknown,
    interactionData: Record<string, unknown> | undefined,
    random: RandomFn,
    timestamp: number
) => { state: MatchState<SmashUpCore>; events: SmashUpEvent[] } | undefined;

// ============================================================================
// 注册表
// ============================================================================

const interactionHandlers = new Map<string, InteractionHandler>();

/** 注册交互处理函数 */
export function registerInteractionHandler(
    sourceId: string,
    handler: InteractionHandler
): void {
    interactionHandlers.set(sourceId, handler);
}

/** 解析交互处理函数 */
export function getInteractionHandler(
    sourceId: string
): InteractionHandler | undefined {
    return interactionHandlers.get(sourceId);
}

/** 清空注册表（测试用） */
export function clearInteractionHandlers(): void {
    interactionHandlers.clear();
}

/** 获取注册表大小（调试用） */
export function getInteractionHandlersSize(): number {
    return interactionHandlers.size;
}

/** 获取所有已注册的 handler sourceId（用于交互完整性审计） */
export function getRegisteredInteractionHandlerIds(): Set<string> {
    return new Set(interactionHandlers.keys());
}

/**
 * 为所有 POD 版本的卡牌批量注册 InteractionHandler 别名。
 *
 * InteractionHandler sourceId 通常与 defId 相同（如 ninja_master）。
 * 此函数遍历注册表，将每个 sourceId 复制给其对应的 _pod 版本。
 * 必须在所有 InteractionHandler 注册完毕后调用。
 */
export function registerPodInteractionAliases(): void {
    const allEntries = Array.from(interactionHandlers.entries());

    for (const [sourceId, handler] of allEntries) {
        if (sourceId.endsWith('_pod')) continue;

        const podSourceId = `${sourceId}_pod`;
        // 如果已存在则不覆盖
        if (interactionHandlers.has(podSourceId)) continue;

        interactionHandlers.set(podSourceId, handler);
    }
}

/**
 * 注册全局系统交互处理器
 */
export function registerSystemInteractionHandlers(): void {
    /**
     * 处理回合开始时的能力选择
     */
    registerInteractionHandler('su:match_start_turn_choice', (state, playerId, value, _iData, random, now) => {
        const choice = value as { type: 'base'; baseIndex: number; baseDefId: string } | { type: 'ongoing'; sourceDefId: string };
        const events: SmashUpEvent[] = [];
        let currentMatchState = state;

        // 1. 执行选中的能力
        const abilityId = choice.type === 'base' ? `base_${choice.baseIndex}_${choice.baseDefId}` : choice.sourceDefId;
        if (choice.type === 'base') {
            const result = triggerBaseAbility(choice.baseDefId, 'onTurnStart', {
                state: state.core,
                matchState: currentMatchState,
                baseIndex: choice.baseIndex,
                baseDefId: choice.baseDefId,
                playerId,
                now,
            });
            events.push(...result.events);
            if (result.matchState) currentMatchState = result.matchState;
        } else {
            const result = fireSpecificTrigger(state.core, 'onTurnStart', choice.sourceDefId, {
                state: state.core,
                matchState: currentMatchState,
                playerId,
                random,
                now,
            });
            events.push(...result.events);
            if (result.matchState) currentMatchState = result.matchState;
        }

        // 标记该能力已处理
        const handledEvt: SmashUpEvent = {
            type: SU_EVENTS.ON_TURN_START_ABILITY_HANDLED,
            payload: { playerId, sourceId: abilityId },
            timestamp: now,
        };
        events.push(handledEvt);

        // 2. 将产生的事件同步到状态中，以便下一轮检查能看到变化（如睡莲已标记已使用）
        // 【核心修复】不可变更新 core，确保 getEligibleTriggers 能看到最新的 handledIds
        let updatedCore = currentMatchState.core;
        for (const e of events) {
            updatedCore = reduce(updatedCore, e as SmashUpEvent);
        }
        currentMatchState = {
            ...currentMatchState,
            core: updatedCore,
        };

        // 3. 检查是否还有剩余的候选
        const baseChoices = getEligibleBaseAbilities('onTurnStart', currentMatchState.core, playerId);
        const ongoingChoices = getEligibleTriggers(currentMatchState.core, 'onTurnStart', playerId, currentMatchState.core.players[playerId].onTurnStartAbilitiesHandled ?? []);
        const totalChoices = baseChoices.length + ongoingChoices.length;

        if (totalChoices === 1) {
            // 只剩一个候选：直接自动执行，不弹选择框
            if (baseChoices.length === 1) {
                const b = baseChoices[0];
                const baseResult = triggerBaseAbility(b.baseDefId, 'onTurnStart', {
                    state: currentMatchState.core,
                    matchState: currentMatchState,
                    baseIndex: b.baseIndex,
                    baseDefId: b.baseDefId,
                    playerId,
                    now,
                });
                events.push(...baseResult.events);
                if (baseResult.matchState) currentMatchState = baseResult.matchState;
                const autoHandledEvt: SmashUpEvent = {
                    type: SU_EVENTS.ON_TURN_START_ABILITY_HANDLED,
                    payload: { playerId, sourceId: `base_${b.baseIndex}_${b.baseDefId}` },
                    timestamp: now,
                };
                events.push(autoHandledEvt);
            } else {
                const t = ongoingChoices[0];
                const triggerResult = fireSpecificTrigger(currentMatchState.core, 'onTurnStart', t.sourceDefId, {
                    state: currentMatchState.core,
                    matchState: currentMatchState,
                    playerId,
                    random,
                    now,
                });
                events.push(...triggerResult.events);
                if (triggerResult.matchState) currentMatchState = triggerResult.matchState;
                const autoHandledEvt: SmashUpEvent = {
                    type: SU_EVENTS.ON_TURN_START_ABILITY_HANDLED,
                    payload: { playerId, sourceId: t.sourceDefId },
                    timestamp: now,
                };
                events.push(autoHandledEvt);
            }
        } else if (totalChoices > 1) {
            // 还有多个剩余候选：重新生成选择框
            const options: any[] = [
                ...baseChoices.map((b: any) => {
                    const def = getBaseDef(b.baseDefId);
                    return {
                        id: `base-${b.baseIndex}`,
                        label: `基地：${def?.name ?? b.baseDefId}`,
                        value: { type: 'base', baseIndex: b.baseIndex, baseDefId: b.baseDefId }
                    };
                }),
                ...ongoingChoices.map((t: any) => {
                    const realDefId = t.sourceDefId.endsWith('_pod') ? t.sourceDefId.replace('_pod', '') : t.sourceDefId;
                    const def = getCardDef(realDefId);
                    const suffix = t.sourceDefId.endsWith('_pod') ? ' (POD)' : '';
                    return {
                        id: t.sourceDefId,
                        label: `卡牌：${def?.name ?? t.sourceDefId}${suffix}`,
                        value: { type: 'ongoing', sourceDefId: t.sourceDefId }
                    };
                })
            ];

            const interaction = {
                id: `start_turn_choice_${now}`,
                kind: 'simple-choice' as const,
                playerId,
                data: {
                    title: '请选择要执行的回合开始能力',
                    options,
                    sourceId: 'su:match_start_turn_choice',
                }
            };
            currentMatchState = queueInteraction(currentMatchState, interaction);
        }

        return { state: currentMatchState, events };
    });

    /**
     * Death on Six Legs Ongoing：
     * 在随从即将进入弃牌堆（被摧毁 / 基地清场）前，询问是否转移 1 个 +1 指示物到泰坦上。
     *
     * continuationContext.kind:
     * - 'destroy'      : 带 originalEvent（MINION_DESTROYED），需要在处理完指示物后重新发射该事件
     * - 'base_discard' : 仅在基地清场前转移指示物，无需重放事件（BASE_CLEARED 会正常处理丢弃）
     */
    registerInteractionHandler(
        'giant_ants_death_on_six_legs_ongoing',
        (state, playerId, value, iData, _random, timestamp) => {
            const accept = !!(value as { accept?: boolean } | undefined)?.accept;
            const core = state.core;
            const ctx = (iData as any)?.continuationContext ?? {};
            const kind = ctx.kind as 'destroy' | 'base_discard' | undefined;

            const events: SmashUpEvent[] = [];

            // 解析目标随从与基地索引
            let minionUid: string | undefined = ctx.minionUid;
            let baseIndex: number | undefined = ctx.baseIndex;
            let originalEvent: SmashUpEvent | undefined = ctx.originalEvent as SmashUpEvent | undefined;

            if (kind === 'destroy' && originalEvent?.type === SU_EVENTS.MINION_DESTROYED) {
                const de = originalEvent as MinionDestroyedEvent;
                minionUid = de.payload.minionUid;
                baseIndex = de.payload.fromBaseIndex;
            }

            if (!minionUid || baseIndex === undefined) {
                // 上下文缺失时，仅在有 originalEvent 时重放之
                if (originalEvent) {
                    events.push(originalEvent);
                }
                return { state, events };
            }

            const base = core.bases[baseIndex];
            const minion = base?.minions.find(m => m.uid === minionUid);
            const player = core.players[playerId];
            const titan = player?.activeTitan;

            // 若玩家放弃，或任一关键对象缺失 / 指示物不存在，则仅重放原事件（销毁路径），否则直接返回
            if (
                !accept ||
                !minion ||
                (minion.powerCounters ?? 0) <= 0 ||
                !titan ||
                titan.defId !== 'titan_death_on_six_legs'
            ) {
                if (originalEvent) {
                    events.push(originalEvent);
                }
                return { state, events };
            }

            // 先从随从移除 1 个 +1 指示物
            events.push({
                type: SU_EVENTS.POWER_COUNTER_REMOVED,
                payload: {
                    minionUid,
                    baseIndex,
                    amount: 1,
                    reason: 'titan_death_on_six_legs_ongoing',
                },
                timestamp,
            } as SmashUpEvent);

            // 再给泰坦增加 1 个力量指示物
            events.push({
                type: SU_EVENTS.TITAN_POWER_TOKEN_ADDED,
                payload: {
                    playerId,
                    titanUid: titan.titanUid,
                    amount: 1,
                    newTotal: (titan.powerTokens ?? 0) + 1,
                },
                timestamp,
            } as SmashUpEvent);

            // 销毁路径：在处理完指示物后，再次发射原始 MINION_DESTROYED 事件
            if (originalEvent && kind === 'destroy') {
                events.push(originalEvent);
            }

            return { state, events };
        }
    );
}
