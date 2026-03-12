/**
 * Ancient Lord (古代领主) - Vampires POD
 * 
 * Special: 给随从放置+1指示物后，可以将其中一个改为放置在泰坦上；泰坦上有3+指示物时可以打出
 * Ongoing: 在此处打出没有+1指示物的卡牌后，在其上放置+1指示物
 * Talent: 在此处一个已有+1指示物的己方随从上放置+1指示物
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';

/**
 * Special: 给随从放置+1指示物后，可以将其中一个改为放置在泰坦上；泰坦上有3+指示物时可以打出
 * 
 * 触发时机：给己方随从放置+1指示物后
 * 
 * 效果1：可以将其中一个指示物改为放置在泰坦上（泰坦区域）
 * 效果2：如果泰坦上有至少3个指示物，可以打出泰坦
 * 
 * 特殊规则：
 * - 必须是"放置"指示物，不包括其他方式获得指示物
 * - 可以在任何玩家的回合触发（只要你放置了指示物）
 * - 打出泰坦时保留所有指示物
 * - 不在场上时也可以累积指示物
 */
export function ancientLordSpecial(ctx: AbilityContext): AbilityResult {
    const { state, playerId } = ctx;
    
    return {
        canActivate: true,
        requiresInteraction: true,
        interactionType: 'choice',
        interactionData: {
            title: '打出 Ancient Lord',
            description: '选择一个基地',
            options: state.core.bases.map((base, index) => ({
                id: `base-${index}`,
                label: `基地 ${index + 1}`,
                value: { baseIndex: index },
            })),
        },
    };
}

/**
 * Ongoing: 在此处打出没有+1指示物的卡牌后，在其上放置+1指示物
 * 
 * 触发时机：在泰坦所在基地打出卡牌后
 * 
 * 条件：打出的卡牌上没有+1战斗力指示物
 * 
 * 效果：在该卡牌上放置一个+1战斗力指示物
 * 
 * 特殊规则：
 * - 只检查打出时是否有指示物，不检查打出前
 * - 如果卡牌打出时已经有指示物（如从弃牌堆打出），不触发
 * - 泰坦本身打出时也会触发（如果没有指示物）
 */
export function ancientLordOngoing(ctx: AbilityContext): AbilityResult {
    const { state, playerId } = ctx;
    const player = state.core.players[playerId];
    const titan = player.activeTitan;
    
    if (!titan) {
        return {
            canActivate: false,
            reason: '泰坦不在场上',
        };
    }
    
    return {
        canActivate: true,
        requiresInteraction: false,
    };
}

/**
 * Talent: 在此处一个已有+1指示物的己方随从上放置+1指示物
 * 
 * 主动能力：玩家可以在自己回合使用
 * 
 * 前置条件：泰坦所在基地上至少有一个己方随从已经有+1指示物
 * 
 * 效果：在目标随从上放置一个+1战斗力指示物
 * 
 * 特殊规则：
 * - 只能选择已经有指示物的随从
 * - 只能选择泰坦所在基地的随从
 */
export function ancientLordTalent(ctx: AbilityContext): AbilityResult {
    const { state, playerId } = ctx;
    const player = state.core.players[playerId];
    const titan = player.activeTitan;
    
    if (!titan) {
        return {
            canActivate: false,
            reason: '泰坦不在场上',
        };
    }
    
    const titanBaseIndex = titan.baseIndex;
    const base = state.core.bases[titanBaseIndex];
    
    // 找到泰坦所在基地上已经有+1指示物的己方随从
    const eligibleMinions = base.minions
        .filter(m => m.ownerId === playerId)
        .filter(m => (m.powerCounters || 0) > 0);
    
    if (eligibleMinions.length === 0) {
        return {
            canActivate: false,
            reason: '泰坦所在基地上没有已有+1指示物的己方随从',
        };
    }
    
    return {
        canActivate: true,
        requiresInteraction: true,
        interactionType: 'choice',
        interactionData: {
            title: 'Ancient Lord - 放置+1指示物',
            description: '选择一个已有+1指示物的己方随从',
            options: eligibleMinions.map(m => ({
                id: `minion-${m.uid}`,
                label: `${m.defId} (当前有 ${m.powerCounters || 0} 个指示物)`,
                value: { minionUid: m.uid, baseIndex: titanBaseIndex },
            })),
        },
    };
}
