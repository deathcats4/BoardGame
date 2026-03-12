/**
 * 大杀四方 - 泰坦系统
 *
 * 负责泰坦的冲突检测、力量计算、计分资格判定和移除逻辑。
 *
 * 核心规则：
 * - 每个玩家同时只能控制一个泰坦
 * - 两个泰坦在同一基地时触发冲突（Kaiju Island 例外）
 * - 冲突时力量较低的泰坦被移除，力量相等时防守方（先到达）获胜
 * - 泰坦力量指示物计入基地总力量
 * - 计分资格：至少有一个随从 OR 总力量 ≥ 1
 */

import type { PlayerId } from '../../../../engine/types';
import type { SmashUpCore, ActiveTitan, TitanClashEvent, TitanRemovedEvent } from '../types';
import { SU_EVENT_TYPES } from '../events';
import { getPlayerEffectivePowerOnBase } from '../ongoingModifiers';
import { getBaseDef } from '../../data/cards';

// ============================================================================
// 类型定义
// ============================================================================

/** 泰坦系统接口 */
export interface TitanSystem {
    /**
     * 检查并解决泰坦冲突
     * @param state 当前游戏状态
     * @param baseIndex 基地索引
     * @param now 事件时间戳（可选，未提供时使用 Date.now）
     * @returns 冲突事件（如果发生冲突）
     */
    checkClash(state: SmashUpCore, baseIndex: number, now?: number): TitanClashEvent | null;

    /**
     * 计算玩家在指定基地的总力量（包含泰坦力量指示物）
     * @param state 当前游戏状态
     * @param playerId 玩家 ID
     * @param baseIndex 基地索引
     * @returns 总力量值
     */
    calculatePlayerPower(state: SmashUpCore, playerId: PlayerId, baseIndex: number): number;

    /**
     * 检查玩家是否满足计分资格
     * @param state 当前游戏状态
     * @param playerId 玩家 ID
     * @param baseIndex 基地索引
     * @returns 是否满足计分资格
     */
    hasScoringEligibility(state: SmashUpCore, playerId: PlayerId, baseIndex: number): boolean;

    /**
     * 移除泰坦（返回泰坦区域）
     * @param state 当前游戏状态
     * @param playerId 玩家 ID
     * @param reason 移除原因
     * @param now 事件时间戳（可选，未提供时使用 Date.now）
     * @returns 泰坦移除事件
     */
    removeTitan(
        state: SmashUpCore,
        playerId: PlayerId,
        reason: 'clash' | 'base_destroyed' | 'ability',
        now?: number
    ): TitanRemovedEvent | null;

    /**
     * 获取基地上的所有泰坦
     * @param state 当前游戏状态
     * @param baseIndex 基地索引
     * @returns 泰坦列表
     */
    getTitansAtBase(state: SmashUpCore, baseIndex: number): Array<{ playerId: PlayerId; titan: ActiveTitan }>;
}

// ============================================================================
// 实现
// ============================================================================

/**
 * 创建泰坦系统实例
 */
export function createTitanSystem(): TitanSystem {
    return {
        checkClash(state: SmashUpCore, baseIndex: number, now?: number): TitanClashEvent | null {
            // 获取基地上的所有泰坦
            const titans = this.getTitansAtBase(state, baseIndex);

            // 少于 2 个泰坦，无冲突
            if (titans.length < 2) {
                return null;
            }

            // Kaiju Island 基地不触发冲突
            const base = state.bases[baseIndex];
            if (base.defId === 'base_kaiju_island') {
                return null;
            }

            // 只有两个不同玩家的泰坦才会冲突
            if (titans.length !== 2 || titans[0].playerId === titans[1].playerId) {
                return null;
            }

            // 计算双方总力量
            const [first, second] = titans;
            const firstPower = this.calculatePlayerPower(state, first.playerId, baseIndex);
            const secondPower = this.calculatePlayerPower(state, second.playerId, baseIndex);

            // 确定防守方（先到达的泰坦）和进攻方（后到达的泰坦）
            // 假设 titans 数组中第一个是防守方（先到达）
            const defender = first;
            const attacker = second;
            const defenderPower = firstPower;
            const attackerPower = secondPower;

            // 力量比较：力量相等时防守方获胜
            let loser: { playerId: PlayerId; titan: ActiveTitan };
            let winner: { playerId: PlayerId; titan: ActiveTitan };
            let loserPower: number;
            let winnerPower: number;

            if (attackerPower > defenderPower) {
                // 进攻方力量更高，防守方失败
                loser = defender;
                winner = attacker;
                loserPower = defenderPower;
                winnerPower = attackerPower;
            } else {
                // 防守方力量 >= 进攻方力量，进攻方失败
                loser = attacker;
                winner = defender;
                loserPower = attackerPower;
                winnerPower = defenderPower;
            }

            // 时间戳：优先使用外部传入的 now，未提供时退回 Date.now
            const timestamp = typeof now === 'number' ? now : Date.now();

            // 生成冲突事件
            return {
                type: SU_EVENT_TYPES.TITAN_CLASH,
                payload: {
                    baseIndex,
                    attacker: {
                        playerId: attacker.playerId,
                        titanUid: attacker.titan.titanUid,
                        titanDefId: attacker.titan.defId,
                        totalPower: attackerPower,
                    },
                    defender: {
                        playerId: defender.playerId,
                        titanUid: defender.titan.titanUid,
                        titanDefId: defender.titan.defId,
                        totalPower: defenderPower,
                    },
                    loser: loser.playerId,
                    timestamp,
                },
            };
        },

        calculatePlayerPower(state: SmashUpCore, playerId: PlayerId, baseIndex: number): number {
            const base = state.bases[baseIndex];
            const player = state.players[playerId];

            // 随从 + 持续行动 + 基地修正 + 泰坦力量指示物（均由 getPlayerEffectivePowerOnBase 统一计算）
            const basePower = getPlayerEffectivePowerOnBase(state, base, baseIndex, playerId);

            // 某些泰坦的 Ongoing 额外力量修正（如 Arcane Protector、Creampuff Man、Dagon）
            let titanOngoingBonus = 0;
            const activeTitan = player.activeTitan as any;
            if (activeTitan && activeTitan.baseIndex === baseIndex) {
                // Arcane Protector Ongoing：你在此处每有两张手牌，就获得 +1 总力量
                if (activeTitan.defId === 'titan_arcane_protector') {
                    const handSize = player.hand.length;
                    titanOngoingBonus = Math.floor(handSize / 2);
                }

                // Creampuff Man Ongoing：你在此处的总力量为 +max(0, 5 - 手牌数量)
                if (activeTitan.defId === 'titan_creampuff_man') {
                    const handSize = player.hand.length;
                    const bonus = 5 - handSize;
                    titanOngoingBonus += bonus > 0 ? bonus : 0;
                }

                // Dagon Ongoing：你在此处的每一个“与你在此处的另一随从同名的己方随从”提供 +1 总力量
                if (activeTitan.defId === 'titan_dagon') {
                    const baseMinions = base.minions;
                    if (baseMinions.length > 0) {
                        const allNameCount = new Map<string, number>();
                        for (const m of baseMinions) {
                            allNameCount.set(m.defId, (allNameCount.get(m.defId) ?? 0) + 1);
                        }
                        for (const m of baseMinions) {
                            if (m.controller !== playerId) continue;
                            const count = allNameCount.get(m.defId) ?? 0;
                            if (count >= 2) {
                                titanOngoingBonus += 1;
                            }
                        }
                    }
                }
            }

            return basePower + titanOngoingBonus;
        },

        hasScoringEligibility(state: SmashUpCore, playerId: PlayerId, baseIndex: number): boolean {
            const base = state.bases[baseIndex];
            const player = state.players[playerId];

            // 规则 1：至少有一个随从
            const hasMinion = base.minions.some(m => m.controller === playerId);
            if (hasMinion) {
                return true;
            }

            // 规则 2：总力量 ≥ 1
            const totalPower = this.calculatePlayerPower(state, playerId, baseIndex);
            return totalPower >= 1;
        },

        removeTitan(
            state: SmashUpCore,
            playerId: PlayerId,
            reason: 'clash' | 'base_destroyed' | 'ability',
            now?: number
        ): TitanRemovedEvent | null {
            const player = state.players[playerId];

            // 玩家没有出场的泰坦
            if (!player.activeTitan) {
                return null;
            }

            const titan = player.activeTitan;

            const timestamp = typeof now === 'number' ? now : Date.now();

            // 生成移除事件
            return {
                type: SU_EVENT_TYPES.TITAN_REMOVED,
                payload: {
                    playerId,
                    titanUid: titan.titanUid,
                    titanDefId: titan.defId,
                    baseIndex: titan.baseIndex,
                    reason,
                    timestamp,
                },
            };
        },

        getTitansAtBase(state: SmashUpCore, baseIndex: number): Array<{ playerId: PlayerId; titan: ActiveTitan }> {
            const titans: Array<{ playerId: PlayerId; titan: ActiveTitan }> = [];

            // 遍历所有玩家，查找在该基地的泰坦
            for (const playerId of state.turnOrder) {
                const player = state.players[playerId];
                if (player.activeTitan && player.activeTitan.baseIndex === baseIndex) {
                    titans.push({
                        playerId,
                        titan: player.activeTitan,
                    });
                }
            }

            return titans;
        },
    };
}

