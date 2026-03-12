/**
 * Dagon (达贡) - Innsmouth
 *
 * POD 版文本：
 * Special: On your turn, you may play this titan on a base where you have two or more minions with the same name.
 * Ongoing: You have +1 power here for each of your minions here that has the same name as another minion here.
 * Talent: Play an extra minion here.
 */

import type { AbilityContext, AbilityResult } from '../../abilityRegistry';
import { createSimpleChoice, queueInteraction } from '../../../../../engine/systems/InteractionSystem';
import type { PromptOption } from '../../../../../engine/systems/InteractionSystem';

export function dagonSpecial(ctx: AbilityContext): AbilityResult {
    const { state, matchState, playerId, now } = ctx;
    const events: any[] = [];
    const player = state.players[playerId];

    if (!player) return { events: [] };

    // 仅在自己回合的 Play Cards 阶段（“On your turn”）可以使用
    const phase = matchState?.sys?.phase;
    const currentPlayerId = state.turnOrder[state.currentPlayerIndex];
    if (phase !== 'playCards' || currentPlayerId !== playerId) {
        return { events: [] };
    }

    // 已有泰坦在场则不能再打出新的泰坦
    if (player.activeTitan) {
        return { events: [] };
    }

    // titanZone 中需要有 Dagon
    const hasTitan = player.titanZone?.some(t => t.defId === 'titan_dagon');
    if (!hasTitan) {
        return { events: [] };
    }

    // 查找“你控制的”同名随从数量 ≥ 2 的基地
    const candidates: { baseIndex: number; label: string }[] = [];
    for (let i = 0; i < state.bases.length; i++) {
        const base = state.bases[i];
        const myMinions = base.minions.filter(m => m.controller === playerId);
        if (myMinions.length < 2) continue;

        const nameCount = new Map<string, number>();
        for (const m of myMinions) {
            nameCount.set(m.defId, (nameCount.get(m.defId) ?? 0) + 1);
        }
        const hasPair = Array.from(nameCount.values()).some(c => c >= 2);
        if (hasPair) {
            candidates.push({ baseIndex: i, label: `基地 ${i + 1}` });
        }
    }

    if (candidates.length === 0) {
        return { events: [] };
    }

    const options: PromptOption<{ baseIndex: number }>[] = candidates.map((c, idx) => ({
        id: `base-${idx}`,
        label: c.label,
        value: { baseIndex: c.baseIndex },
    }));

    const interaction = createSimpleChoice(
        `dagon_special_${now}`,
        playerId,
        '选择要打出 Dagon 的基地（需要你在此有两个或更多同名随从）',
        options,
        {
            sourceId: 'innsmouth_dagon_special',
            targetType: 'base',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

// Ongoing 通过 TitanSystem.calculatePlayerPower 实现，这里无需发事件
export function dagonOngoing(_ctx: AbilityContext): AbilityResult {
    return { events: [] };
}

export function dagonTalent(ctx: AbilityContext): AbilityResult {
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
    if (!titan || titan.defId !== 'titan_dagon') {
        return { events: [] };
    }

    // 手牌中的随从
    const minionsInHand = player.hand.filter((c: any) => c.type === 'minion');
    if (minionsInHand.length === 0) {
        return { events: [] };
    }

    const options: PromptOption<{ cardUid: string; baseIndex: number }>[] = minionsInHand.map((card: any, idx: number) => ({
        id: `card-${idx}`,
        label: `打出 ${card.defId}`,
        value: { cardUid: card.uid, baseIndex: titan.baseIndex },
    }));

    const interaction = createSimpleChoice(
        `dagon_talent_${now}`,
        playerId,
        '选择要在 Dagon 所在基地打出的额外随从',
        options,
        {
            sourceId: 'innsmouth_dagon_talent',
            targetType: 'card',
        }
    );

    return {
        events,
        matchState: queueInteraction(ctx.matchState, interaction),
    };
}

