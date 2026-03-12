/**
 * 大杀四方 - 专用事件处理系统
 * 
 * 处理领域事件到系统状态的映射：
 * - 监听 SYS_INTERACTION_RESOLVED 事件 → 从 sourceId 查找处理函数 → 生成后续领域事件
 * - 对交互解决产生的事件应用保护过滤和触发链（与 execute() 后处理对齐）
 */

import type { GameEvent } from '../../../engine/types';
import type { EngineSystem, HookResult } from '../../../engine/systems/types';
import { INTERACTION_EVENTS, resolveInteraction } from '../../../engine/systems/InteractionSystem';
import type { SmashUpCore, SmashUpEvent, MinionPlayedEvent, PendingPostScoringAction } from './types';
import { buildValidatedMoveEvents } from './abilityHelpers';
import { interceptEvent } from './ongoingEffects';
import { SU_EVENT_TYPES } from './events';
import { getInteractionHandler, getRegisteredInteractionHandlerIds } from './abilityInteractionHandlers';

// ============================================================================
// SmashUp 事件处理系统
// ============================================================================

function buildPendingPostScoringActionEvents(
    state: { core: SmashUpCore },
    actions: PendingPostScoringAction[],
    timestamp: number,
): SmashUpEvent[] {
    const events: SmashUpEvent[] = [];
    for (const action of actions) {
        if (action.kind === 'playMinionOnReplacementBase') {
            const player = state.core.players[action.playerId];
            const cardStillInDeck = player?.deck.some(card =>
                card.uid === action.cardUid
                && card.defId === action.defId
                && card.type === 'minion',
            );
            if (!player || !cardStillInDeck) {
                continue;
            }
            events.push({
                type: SU_EVENT_TYPES.MINION_PLAYED,
                payload: {
                    playerId: action.playerId,
                    cardUid: action.cardUid,
                    defId: action.defId,
                    baseIndex: action.baseIndex,
                    baseDefId: action.targetBaseDefId,
                    power: action.power,
                    fromDeck: true,
                    consumesNormalLimit: false,
                },
                timestamp,
            } as MinionPlayedEvent);
            continue;
        }

        events.push(...buildValidatedMoveEvents(state as any, {
            minionUid: action.minionUid,
            minionDefId: action.minionDefId,
            fromBaseIndex: action.fromBaseIndex,
            toBaseIndex: action.toBaseIndex,
            reason: action.reason,
            now: timestamp,
        }));
    }
    return events;
}

function isSameDeferredEvent(
    emittedEvent: SmashUpEvent,
    deferredEvent: { type: string; payload: unknown; timestamp: number },
): boolean {
    if (emittedEvent.type !== deferredEvent.type) return false;
    const emittedPayload = (emittedEvent as GameEvent).payload;
    return JSON.stringify(emittedPayload) === JSON.stringify(deferredEvent.payload)
        && (typeof emittedEvent.timestamp === 'number' ? emittedEvent.timestamp : 0) === deferredEvent.timestamp;
}

/**
 * 创建 SmashUp 事件处理系统
 * 
 * 职责：
 * - 监听 SYS_INTERACTION_RESOLVED 事件 → 从 sourceId 查找处理函数 → 生成后续事件
 */
export function createSmashUpEventSystem(): EngineSystem<SmashUpCore> {
    return {
        id: 'smashup-event-system',
        name: '大杀四方事件处理',
        priority: 24, // 必须在 FlowSystem(25) 之前执行，确保交互处理器先于 onAutoContinueCheck 运行

        afterEvents: (ctx: any): HookResult<SmashUpCore> | void => {
            const { state, events, random } = ctx;
            console.log('[SmashUpEventSystem][afterEvents] START. Event count:', events.length);
            const matchState = state; // Aliasing context state to matchState
            let newState = state;
            const nextEvents: GameEvent[] = [];
            const pendingReduceFlag = '_waitForPostScoringReduce';

            // 同一轮 afterEvents 中，后续系统看不到本轮新发出事件的 reduce 结果。
            // 上一轮如果刚补发了 BASE_CLEARED / BASE_REPLACED，需要先等 pipeline 在轮末完成 reduce，
            // 本轮开始时再清掉阻塞标记，允许 FlowSystem 继续自动推进。
            if ((newState.sys as any)[pendingReduceFlag]) {
                newState = {
                    ...newState,
                    sys: {
                        ...newState.sys,
                        [pendingReduceFlag]: undefined,
                    } as typeof newState.sys,
                };
            }

            for (const event of events) {
                // Major Ursa Ongoing 已移至 postProcessSystemEvents 中 MINION_MOVED 处理
                
                // 监听 RESPONSE_WINDOW_CLOSED → 补发 afterScoring 延迟事件
                if (event.type === RESPONSE_WINDOW_EVENTS.CLOSED) {
                    // ... (省略部分逻辑以保持 replace_file_content 稳定，实际会替换整个循环体内容)
                    if (newState.sys.afterScoringInitialPowers) {
                        const { baseIndex: scoredBaseIndex } = newState.sys.afterScoringInitialPowers as any;
                        const currentBase = newState.core.bases[scoredBaseIndex];

                        if (currentBase) {
                            // 发出 BASE_CLEARED 事件
                            const clearEvt: BaseClearedEvent = {
                                type: SU_EVENT_TYPES.BASE_CLEARED,
                                payload: { baseIndex: scoredBaseIndex, baseDefId: currentBase.defId },
                                timestamp: (event as any).timestamp || 0,
                            };
                            nextEvents.push(clearEvt);

                            // 替换基地
                            if (newState.core.baseDeck.length > 0) {
                                const newBaseDefId = newState.core.baseDeck[0];
                                const replaceEvt: BaseReplacedEvent = {
                                    type: SU_EVENT_TYPES.BASE_REPLACED,
                                    payload: {
                                        baseIndex: scoredBaseIndex,
                                        oldBaseDefId: currentBase.defId,
                                        newBaseDefId,
                                    },
                                    timestamp: (event as any).timestamp || 0,
                                };
                                nextEvents.push(replaceEvt);

                                // 触发新基地的 onBaseRevealed 扩展时机
                                const revealCtx = {
                                    state: newState.core,
                                    matchState: newState,
                                    baseIndex: scoredBaseIndex,
                                    baseDefId: newBaseDefId,
                                    playerId: newState.core.turnOrder[newState.core.currentPlayerIndex],
                                    now: (event as any).timestamp || 0,
                                };
                                const revealResult = triggerExtendedBaseAbility(newBaseDefId, 'onBaseRevealed', revealCtx);
                                nextEvents.push(...revealResult.events);
                                if (revealResult.matchState) newState = revealResult.matchState;
                            }
                        }
                    }
                }

                // 监听 SYS_INTERACTION_RESOLVED → 从 sourceId 查找处理函数 → 生成后续事件
                if (event.type === INTERACTION_EVENTS.RESOLVED) {
                    console.log('[SmashUpEventSystem][afterEvents] INTERACTION_RESOLVED detected:', event.payload);
                    const payload = event.payload as {
                        interactionId: string;
                        playerId: string;
                        optionId: string | null;
                        value: unknown;
                        sourceId?: string;
                        interactionData?: Record<string, unknown>;
                    };
                    const eventTimestamp = typeof event.timestamp === 'number' ? event.timestamp : 0;


                    if (payload.sourceId) {
                        const interactionId = payload.interactionId;
                        const sourceId = payload.sourceId;

                        // 检查该交互是否已经被处理过
                        // 使用一个临时的 Set 来跟踪本次 afterEvents 调用中已处理的交互
                        if (!(newState.sys as any)._processedInteractions) {
                            (newState.sys as any)._processedInteractions = new Set<string>();
                        }
                        const processedSet = (newState.sys as any)._processedInteractions as Set<string>;
                        
                        if (processedSet.has(interactionId)) {
                            console.log(`[SmashUpEventSystem][afterEvents] Skipping already processed interaction: ${interactionId}`);
                            continue;
                        }
                        
                        // 标记为已处理
                        processedSet.add(interactionId);

                        const registeredIds = getRegisteredInteractionHandlerIds();
                        const handler = sourceId ? getInteractionHandler(sourceId) : undefined;
                        console.log(`[SmashUpEventSystem][afterEvents] Handler lookup for: ${sourceId} Found: ${!!handler} Registered IDs: ${registeredIds.size}`);

                        if (handler) {
                            const result = handler(
                                newState,
                                payload.playerId,
                                payload.value,
                                payload.interactionData,
                                random,
                                eventTimestamp
                            );

                            if (result) {
                                // 1. 将产生的事件合并到结果中
                                const rawEvents = result.events as SmashUpEvent[];
                                console.log(`[SmashUpEventSystem][afterEvents] 🐻 Handler ${sourceId} rawEvents:`, rawEvents);

                                // 2. 调用 postProcessSystemEvents 处理触发器、保护、去重等
                                // 这会产生衍生的 trigger 事件，并进一步更新状态（如 Interaction 队列）
                                const processResult = postProcessSystemEvents(
                                    result.state.core,
                                    rawEvents,
                                    random,
                                    result.state
                                );

                                console.log(`[SmashUpEventSystem][afterEvents] 🐻 processResult.events:`, processResult.events);
                                console.log(`[SmashUpEventSystem][afterEvents] 🐻 processResult.events has undefined?`, processResult.events.some(e => e === undefined));

                                newState = processResult.matchState ?? result.state;

                                // 3. 将最终产生的事件（含原始事件 + 衍生事件）加入 nextEvents
                                // 过滤掉 undefined 事件
                                const validEvents = processResult.events.filter(e => e !== undefined);
                                nextEvents.push(...validEvents);
                                console.log(`[SmashUpEventSystem][afterEvents] Handler ${sourceId} produced ${validEvents.length} events:`, validEvents.map(e => e.type));

                                // 补发延迟的 BASE_CLEARED/BASE_REPLACED 事件
                                const iData = payload.interactionData as any;
                                const deferred = iData?.continuationContext?._deferredPostScoringEvents as any[];
                                if (deferred && deferred.length > 0) {
                                    newState.sys.flowHalted = true;

                                    if (!newState.sys.interaction?.current && (!newState.sys.interaction?.queue || newState.sys.interaction.queue.length === 0)) {
                                        const handlerAlreadyEmittedDeferred = deferred.every(d =>
                                            nextEvents.some(event => isSameDeferredEvent(event, d))
                                        );
                                        if (!handlerAlreadyEmittedDeferred) {
                                            for (const d of deferred) {
                                                nextEvents.push({ type: d.type, payload: d.payload, timestamp: d.timestamp } as GameEvent);
                                            }
                                        }
                                        const pendingActions = newState.core.pendingPostScoringActions ?? [];
                                        if (pendingActions.length > 0) {
                                            nextEvents.push(...buildPendingPostScoringActionEvents(newState, pendingActions, eventTimestamp));
                                            newState = {
                                                ...newState,
                                                core: {
                                                    ...newState.core,
                                                    pendingPostScoringActions: undefined,
                                                },
                                            };
                                        }
                                        newState = {
                                            ...newState,
                                            sys: {
                                                ...newState.sys,
                                                [pendingReduceFlag]: true,
                                            } as typeof newState.sys,
                                        };
                                    } else {
                                        const nextInteraction = newState.sys.interaction.current ?? newState.sys.interaction.queue?.[0];
                                        if (nextInteraction?.data) {
                                            const nextData = nextInteraction.data as Record<string, unknown>;
                                            const nextCtx = (nextData.continuationContext ?? {}) as Record<string, unknown>;
                                            nextCtx._deferredPostScoringEvents = deferred;
                                            nextData.continuationContext = nextCtx;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (newState !== state || nextEvents.length > 0) {
                return {
                    state: newState,
                    events: nextEvents.length > 0 ? nextEvents : undefined,
                };
            }
        },
    };
}
