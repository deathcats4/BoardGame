/**
 * 大杀四方 - 远古之物派系能力
 *
 * 主题：疯狂卡操控、惩罚持有疯狂卡的对手?
 * 克苏鲁扩展派系，核心机制围绕 Madness 牌库底
 */

import { registerAbility } from '../domain/abilityRegistry';
import type { AbilityContext, AbilityResult } from '../domain/abilityRegistry';
import {
    drawMadnessCards,
    grantExtraAction,
    destroyMinion,
    getMinionPower,
    buildMinionTargetOptions,
    addPowerCounter,
    revealHand,
    buildAbilityFeedback,
    buildValidatedCardToDeckBottomEvents,
} from '../domain/abilityHelpers';
import { SU_COMMANDS, SU_EVENTS, MADNESS_CARD_DEF_ID } from '../domain/types';
import type {
    SmashUpEvent,
    CardsDrawnEvent,
    CardsDiscardedEvent,
    DeckReshuffledEvent,
    MinionCardDef,
    MinionOnBase,
} from '../domain/types';
import { drawCards } from '../domain/utils';
import { getCardDef, getBaseDef, getFactionCards } from '../data/cards';
import { isMinionProtected, registerTrigger, registerProtection } from '../domain/ongoingEffects';
import type { TriggerContext, ProtectionCheckContext } from '../domain/ongoingEffects';
import { getPlayerEffectivePowerOnBase } from '../domain/ongoingModifiers';
import { createSimpleChoice, queueInteraction } from '../../../engine/systems/InteractionSystem';
import { registerInteractionHandler } from '../domain/abilityInteractionHandlers';

/** 注册远古之物派系所有能力*/
export function registerElderThingAbilities(): void {
    // 拜亚基?onPlay：如果其他玩家有随从在本基地，抽一张疯狂卡
    registerAbility('elder_thing_byakhee', 'onPlay', elderThingByakhee);
    // ??onPlay：每个对手可抽疯狂卡，不收回抽的让你抽一张牌（MVP：对手全部抽疯狂卡）
    registerAbility('elder_thing_mi_go', 'onPlay', elderThingMiGo);
    // 精神错乱（行动卡）：每个对手抽两张疯狂卡
    registerAbility('elder_thing_insanity', 'onPlay', elderThingInsanity);
    // 疯狂接触（行动卡）：每个对手抽一张疯狂卡，你抽一张牌并额外打出一张行动
    registerAbility('elder_thing_touch_of_madness', 'onPlay', elderThingTouchOfMadness);
    // 疯狂之力（行动卡）：普通版 onPlay（所有对手展示）
    registerAbility('elder_thing_the_price_of_power', 'onPlay', elderThingPriceOfPowerOnPlay);
    // 疯狂之力（行动卡）：对每个对手分别命名行动 → 展示手牌 → 弃复制品 → 洗弃牌堆回牌库
    registerAbility('elder_thing_power_of_madness', 'onPlay', elderThingPowerOfMadness);
    // 散播恐怖（行动卡）：对手可弃 2 张非疯狂，否则你从弃牌堆在不同基地特招 ≤3 力量随从
    registerAbility('elder_thing_spreading_horror', 'onPlay', elderThingSpreadingHorror);
    // 开始召唤（行动卡）：弃牌堆随从放牌库顶 + 额外行动
    registerAbility('elder_thing_begin_the_summoning', 'onPlay', elderThingBeginTheSummoning);
    // 深不收回可测的目的（行动卡）：对手展示手牌，有疯狂卡的必须消灭一个随从
    registerAbility('elder_thing_unfathomable_goals', 'onPlay', elderThingUnfathomableGoals);

    // 远古之物 onPlay：消灭两个己方随从或放牌库底 + 不收回受对手影响
    registerAbility('elder_thing_elder_thing', 'onPlay', elderThingElderThingOnPlay);
    // 修格斯?onPlay：对手选择抽疯狂卡或被消灭随从
    registerAbility('elder_thing_shoggoth', 'onPlay', elderThingShoggoth);

    // === ongoing 效果注册 ===
    // 邓威奇恐怖：基地计分前，附着随从的控制者必须二选一（抽2疯狂/消灭该随从）
    registerTrigger('elder_thing_dunwich_horror', 'beforeScoring', elderThingDunwichHorrorTrigger);
    // 力量的代价：special 版（只看计分基地）
    registerAbility('elder_thing_the_price_of_power', 'special', elderThingPriceOfPowerSpecial);
    // 远古之物：不收回受对手卡牌影响（保护 destroy + move?
    registerProtection('elder_thing_elder_thing', 'destroy', elderThingProtectionChecker);
    registerProtection('elder_thing_elder_thing', 'move', elderThingProtectionChecker);
}

/** 拜亚基 onPlay：每个在此基地有随从的其他玩家各抽一张疯狂卡 */
function elderThingByakhee(ctx: AbilityContext): AbilityResult {
    const base = ctx.state.bases[ctx.baseIndex];
    if (!base) return { events: [] };

    const events: SmashUpEvent[] = [];
    for (const pid of ctx.state.turnOrder) {
        if (pid === ctx.playerId) continue;
        const hasMinionHere = base.minions.some(m => m.controller === pid);
        if (!hasMinionHere) continue;
        const evt = drawMadnessCards(pid, 1, ctx.state, 'elder_thing_byakhee', ctx.now);
        if (evt) events.push(evt);
    }
    return { events };
}

/**
 * 米-格 onPlay：每个其他玩家可以抽一张疯狂卡。每个不这样做的玩家，都能让你抽一张卡。
 * "可以" → 每个对手需要选择是否抽疯狂卡，链式处理
 */
function elderThingMiGo(ctx: AbilityContext): AbilityResult {
    const opponents = ctx.state.turnOrder.filter(pid => pid !== ctx.playerId);
    if (opponents.length === 0) return { events: [] };

    // 链式处理：第一个对手选择
    const options = [
        { id: 'draw_madness', label: '抽一张疯狂卡', value: { choice: 'draw_madness' }, displayMode: 'button' as const },
        { id: 'decline', label: '拒绝（让对方抽一张牌）', value: { choice: 'decline' }, displayMode: 'button' as const },
    ];
    const interaction = createSimpleChoice(
        `elder_thing_mi_go_${opponents[0]}_${ctx.now}`, opponents[0],
        '米-格：你可以抽一张疯狂卡，否则对方抽一张牌', options as any[],
        { sourceId: 'elder_thing_mi_go', targetType: 'button' },
    );
    (interaction.data as any).continuationContext = {
        casterPlayerId: ctx.playerId,
        opponents,
        opponentIdx: 0,
        drewMadnessCount: 0,
    };
    return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
}

/** 精神错乱 onPlay：每个对手抽两张疯狂卡?*/
function elderThingInsanity(ctx: AbilityContext): AbilityResult {
    const events: SmashUpEvent[] = [];
    for (const pid of ctx.state.turnOrder) {
        if (pid === ctx.playerId) continue;
        const evt = drawMadnessCards(pid, 2, ctx.state, 'elder_thing_insanity', ctx.now);
        if (evt) events.push(evt);
    }
    events.push({
        type: SU_EVENTS.ACTION_BOXED,
        payload: { playerId: ctx.playerId, cardUid: ctx.cardUid, defId: ctx.defId, reason: 'elder_thing_insanity' },
        timestamp: ctx.now,
    });
    return { events };
}

/** 疯狂接触 onPlay：每个对手抽一张疯狂卡，你抽一张牌并额外打出一张行动*/
function elderThingTouchOfMadness(ctx: AbilityContext): AbilityResult {
    const events: SmashUpEvent[] = [];

    // 对手各抽一张疯狂卡
    for (const pid of ctx.state.turnOrder) {
        if (pid === ctx.playerId) continue;
        const evt = drawMadnessCards(pid, 1, ctx.state, 'elder_thing_touch_of_madness', ctx.now);
        if (evt) events.push(evt);
    }

    // 你抽一张牌
    const player = ctx.state.players[ctx.playerId];
    const { drawnUids } = drawCards(player, 1, ctx.random);
    if (drawnUids.length > 0) {
        const drawEvt: CardsDrawnEvent = {
            type: SU_EVENTS.CARDS_DRAWN,
            payload: { playerId: ctx.playerId, count: 1, cardUids: drawnUids },
            timestamp: ctx.now,
        };
        events.push(drawEvt);
    }

    // 额外打出一张行动
    events.push(grantExtraAction(ctx.playerId, 'elder_thing_touch_of_madness', ctx.now));

    return { events };
}

function buildPowerOfMadnessNameOptions(state: SmashUpState, opponentId: string): Array<{ id: string; label: string; value: { namedDefId?: string; skip?: true }; displayMode: 'button' }> {
    const opponent = state.players[opponentId];
    if (!opponent) return [];

    const defIds = new Set<string>();
    for (const factionId of opponent.factions ?? []) {
        const cards = getFactionCards(factionId);
        for (const def of cards) {
            if (def.type !== 'action') continue;
            defIds.add(def.id);
        }
    }
    defIds.add(MADNESS_CARD_DEF_ID);

    const sorted = Array.from(defIds.values()).sort((a, b) => a.localeCompare(b));
    const options = sorted.map((defId) => {
        const def = getCardDef(defId) as ActionCardDef | undefined;
        const name = def?.name ?? defId;
        return { id: `name_${defId}`, label: name, value: { namedDefId: defId }, displayMode: 'button' as const };
    });

    options.unshift({ id: 'skip', label: '跳过（命名一张对方没有的行动）', value: { skip: true }, displayMode: 'button' as const });
    return options;
}

/** 疯狂之力 onPlay：对每个对手分别命名一个行动 → 展示手牌 → 弃掉所有复制品 → 洗弃牌堆回牌库 */
function elderThingPowerOfMadness(ctx: AbilityContext): AbilityResult {
    const opponents = ctx.state.turnOrder.filter(pid => pid !== ctx.playerId);
    if (opponents.length === 0) return { events: [] };

    const firstOpponentId = opponents[0];
    const options = buildPowerOfMadnessNameOptions(ctx.state, firstOpponentId);
    if (options.length === 0) return { events: [] };

    const interaction = createSimpleChoice(
        `elder_thing_power_of_madness_name_${firstOpponentId}_${ctx.now}`,
        ctx.playerId,
        '疯狂之力：命名一个行动',
        options as any[],
        { sourceId: 'elder_thing_power_of_madness', targetType: 'generic', autoCancelOption: false },
    );
    (interaction.data as any).continuationContext = { casterPlayerId: ctx.playerId, opponents, opponentIdx: 0 };

    return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
}


function buildPriceOfPowerMinionOptions(state: SmashUpState, playerId: string, restrictBaseIndex?: number): Array<{ id: string; label: string; value: { minionUid: string; baseIndex: number }; displayMode: 'card' }> {
    const options: Array<{ id: string; label: string; value: { minionUid: string; baseIndex: number }; displayMode: 'card' }> = [];
    state.bases.forEach((base, bi) => {
        if (restrictBaseIndex !== undefined && bi !== restrictBaseIndex) return;
        base.minions.forEach(m => {
            if (m.controller !== playerId) return;
            const def = getCardDef(m.defId) as MinionCardDef | undefined;
            const name = def?.name ?? m.defId;
            const baseDef = getBaseDef(base.defId);
            const baseName = baseDef?.name ?? `基地 ${bi + 1}`;
            options.push({
                id: m.uid,
                label: `${name} @ ${baseName}`,
                value: { minionUid: m.uid, baseIndex: bi },
                displayMode: 'card',
            });
        });
    });
    return options;
}

/** 传播恐怖 onPlay：对手可以弃 2 张非疯狂；否则你从弃牌堆在不同基地特招 ≤3 力量随从 */
function elderThingSpreadingHorror(ctx: AbilityContext): AbilityResult {
    const opponents = ctx.state.turnOrder.filter(pid => pid !== ctx.playerId);
    if (opponents.length === 0) return { events: [] };

    const firstOpponentId = opponents[0];
    const opponent = ctx.state.players[firstOpponentId];
    if (!opponent) return { events: [] };

    const nonMadness = opponent.hand.filter(c => c.defId !== MADNESS_CARD_DEF_ID);
    const cardOptions = nonMadness.map(c => {
        const def = getCardDef(c.defId);
        const name = def?.name ?? c.defId;
        return {
            id: c.uid,
            label: name,
            value: { cardUid: c.uid },
            displayMode: 'card' as const,
        };
    });

    const options = [
        ...cardOptions,
        { id: 'skip', label: '跳过（不弃牌）', value: { skip: true }, displayMode: 'button' as const },
    ];

    const interaction = createSimpleChoice(
        `elder_thing_spreading_horror_discard_${firstOpponentId}_${ctx.now}`,
        firstOpponentId,
        '传播恐怖：你可以弃置 2 张非疯狂卡，否则对手可以从弃牌堆特招一个随从到不同的基地',
        options as any[],
        {
            sourceId: 'elder_thing_spreading_horror',
            targetType: 'generic',
            autoCancelOption: false,
            multi: { min: 0, max: 2 },
        },
    );
    (interaction.data as any).continuationContext = {
        casterPlayerId: ctx.playerId,
        opponents,
        opponentIdx: 0,
        usedBaseIndices: [] as number[],
    };

    return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
}

/** 开始召唤 onPlay：从弃牌堆选一个随从放到牌库顶 + 额外行动 */
function elderThingBeginTheSummoning(ctx: AbilityContext): AbilityResult {
    const events: SmashUpEvent[] = [];
    const player = ctx.state.players[ctx.playerId];
    const minionsInDiscard = player.discard.filter(c => c.type === 'minion');

    if (minionsInDiscard.length === 0) {
        // 没有随从可选，仍给额外行动，但提示弃牌堆为空
        events.push(buildAbilityFeedback(ctx.playerId, 'feedback.discard_empty', ctx.now));
        events.push(grantExtraAction(ctx.playerId, 'elder_thing_begin_the_summoning', ctx.now));
        return { events };
    }
    // Prompt 选择
    const options = minionsInDiscard.map((c, i) => {
        const def = getCardDef(c.defId);
        const name = def?.name ?? c.defId;
        return { id: `card-${i}`, label: name, value: { cardUid: c.uid, defId: c.defId } , _source: 'discard' as const, displayMode: 'card' as const };
    });
    const interaction = createSimpleChoice(
        `elder_thing_begin_the_summoning_${ctx.now}`, ctx.playerId,
        '选择要放到牌库顶的随从', options as any[],
        { sourceId: 'elder_thing_begin_the_summoning', targetType: 'generic' },
    );
    return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
}

/** 深不可测的目的 onPlay：对手展示手牌，有疯狂卡的必须消灭一个自己的随从 */
function elderThingUnfathomableGoals(ctx: AbilityContext): AbilityResult {
    const events: SmashUpEvent[] = [];

    // 先收集所有对手手牌，合并成一个展示事件（避免多人覆盖）
    const allRevealCards: { uid: string; defId: string }[] = [];
    const revealTargetIds: string[] = [];
    for (const pid of ctx.state.turnOrder) {
        if (pid === ctx.playerId) continue;
        const opponent = ctx.state.players[pid];
        if (opponent.hand.length > 0) {
            revealTargetIds.push(pid);
            for (const c of opponent.hand) {
                allRevealCards.push({ uid: c.uid, defId: c.defId });
            }
        }
    }
    if (allRevealCards.length > 0) {
        const targetIds = revealTargetIds.length === 1 ? revealTargetIds[0] : revealTargetIds;
        events.push(revealHand(targetIds, 'all', allRevealCards, 'elder_thing_unfathomable_goals', ctx.now, ctx.playerId));
    }

    // 收集所有有疯狂卡的对手，按顺序处理
    const opponentsWithMadness: string[] = [];
    for (const pid of ctx.state.turnOrder) {
        if (pid === ctx.playerId) continue;
        const opponent = ctx.state.players[pid];
        if (opponent.hand.some(c => c.defId === MADNESS_CARD_DEF_ID)) {
            opponentsWithMadness.push(pid);
        }
    }

    // 链式处理：处理第一个对手，剩余的通过 continuationContext 传递
    return unfathomableGoalsProcessNext(ctx, events, opponentsWithMadness, 0);
}

/** 深不可测的目的：链式处理对手消灭随从 */
function unfathomableGoalsProcessNext(
    ctx: AbilityContext,
    events: SmashUpEvent[],
    opponents: string[],
    idx: number,
): AbilityResult {
    while (idx < opponents.length) {
        const pid = opponents[idx];
        const opMinions: { uid: string; defId: string; baseIndex: number; owner: string; power: number }[] = [];
        for (let i = 0; i < ctx.state.bases.length; i++) {
            for (const m of ctx.state.bases[i].minions) {
                if (m.controller !== pid) continue;
                opMinions.push({ uid: m.uid, defId: m.defId, baseIndex: i, owner: m.owner, power: getMinionPower(ctx.state, m, i) });
            }
        }
        if (opMinions.length === 0) {
            idx++;
            continue;
        }
        if (opMinions.length === 1) {
            // 只有一个随从，直接消灭，继续下一个对手
            events.push(destroyMinion(opMinions[0].uid, opMinions[0].defId, opMinions[0].baseIndex, opMinions[0].owner, undefined, 'elder_thing_unfathomable_goals', ctx.now));
            idx++;
            continue;
        }
        // 多个随从：让对手选择消灭哪个，剩余对手通过 continuationContext 链式处理
        const options = opMinions.map(m => {
            const def = getCardDef(m.defId) as MinionCardDef | undefined;
            const name = def?.name ?? m.defId;
            const baseDef = getBaseDef(ctx.state.bases[m.baseIndex].defId);
            const baseName = baseDef?.name ?? `基地 ${m.baseIndex + 1}`;
            return { uid: m.uid, defId: m.defId, baseIndex: m.baseIndex, label: `${name} (力量 ${m.power}) @ ${baseName}` };
        });
        const interaction = createSimpleChoice(
            `elder_thing_unfathomable_goals_${pid}_${ctx.now}`, pid,
            '你手中有疯狂卡，必须消灭一个自己的随从',
            buildMinionTargetOptions(options, { state: ctx.state, sourcePlayerId: ctx.playerId }),
            { sourceId: 'elder_thing_unfathomable_goals', targetType: 'minion' },
        );
        (interaction.data as any).continuationContext = {
            opponents,
            opponentIdx: idx,
        };
        return { events, matchState: queueInteraction(ctx.matchState, interaction) };
    }

    return { events };
}


// ============================================================================
// 远古之物 (Elder Thing) - onPlay + 保护
// ============================================================================

/** 远古之物保护检查：不收回受对手卡牌影响 */
function elderThingProtectionChecker(ctx: ProtectionCheckContext): boolean {
    // 只保护?elder_thing_elder_thing 自身，且只拦截对手发起的效果
    if (!matchesDefId(ctx.targetMinion.defId, 'elder_thing_elder_thing')) return false;
    return ctx.sourcePlayerId !== ctx.targetMinion.controller;
}

/** 远古之物 onPlay：消灭两个己方其他随从或将本随从放到牌库底 */
function elderThingElderThingOnPlay(ctx: AbilityContext): AbilityResult {
    // 收集己方其他随从
    const otherMinions: { uid: string; defId: string; baseIndex: number; owner: string; label: string }[] = [];
    for (let i = 0; i < ctx.state.bases.length; i++) {
        for (const m of ctx.state.bases[i].minions) {
            if (m.controller === ctx.playerId && m.uid !== ctx.cardUid) {
                const def = getCardDef(m.defId) as MinionCardDef | undefined;
                const name = def?.name ?? m.defId;
                const baseDef = getBaseDef(ctx.state.bases[i].defId);
                const baseName = baseDef?.name ?? `基地 ${i + 1}`;
                otherMinions.push({ uid: m.uid, defId: m.defId, baseIndex: i, owner: m.owner, label: `${name} @ ${baseName}` });
            }
        }
    }

    // 始终显示选择界面：只有“能成功消灭 ≥2 个随从”才允许选择 destroy
    // 澄清：若无法成功消灭两名随从，则必须把远古之物放到牌库底
    const destroyableOtherMinions = otherMinions.filter(({ uid, baseIndex }) => {
        const base = ctx.state.bases[baseIndex];
        const minion = base?.minions.find(m => m.uid === uid);
        if (!minion) return false;
        return !isMinionProtected(ctx.state, minion, baseIndex, ctx.playerId, 'destroy');
    });
    const canDestroy = destroyableOtherMinions.length >= 2;
    const options = [
        {
            id: 'destroy',
            label: canDestroy ? '消灭两个己方其他随从' : '消灭两个己方其他随从（随从不足）',
            value: { choice: 'destroy' },
            displayMode: 'button' as const,
            disabled: !canDestroy,
        },
        { 
            id: 'deckbottom', 
            label: '将本随从放到牌库底', 
            value: { choice: 'deckbottom' },
            displayMode: 'button' as const,
        },
    ];
    const interaction = createSimpleChoice(
        `elder_thing_elder_thing_choice_${ctx.now}`, ctx.playerId,
        '选择远古之物的效果', options as any[],
        { sourceId: 'elder_thing_elder_thing_choice', targetType: 'button' },
    );
    (interaction.data as any).continuationContext = { cardUid: ctx.cardUid, defId: ctx.defId, baseIndex: ctx.baseIndex };
    return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
}

// ============================================================================
// 修格斯?(Shoggoth) - onPlay
// ============================================================================

/** 修格斯 onPlay：每个对手可抽疯狂卡，不收回抽则消灭该对手在此基地的一个随从*/
function elderThingShoggoth(ctx: AbilityContext): AbilityResult {
    // 前置条件：你只能将这张卡打到你至少拥有6点力量的基地
    const base = ctx.state.bases[ctx.baseIndex];
    if (base) {
        const playerPower = getPlayerEffectivePowerOnBase(ctx.state, base, ctx.baseIndex, ctx.playerId);
        if (playerPower < 6) return { events: [] };
    }

    const opponents = ctx.state.turnOrder.filter(pid => pid !== ctx.playerId);
    if (opponents.length === 0) return { events: [] };

    const options = [
        { id: 'draw_madness', label: '抽一张疯狂卡', value: { choice: 'draw_madness' }, displayMode: 'button' as const },
        { id: 'decline', label: '拒绝（被消灭一个随从）', value: { choice: 'decline' }, displayMode: 'button' as const },
    ];
    const interaction = createSimpleChoice(
        `elder_thing_shoggoth_opponent_${ctx.now}`, opponents[0],
        '修格斯：你可以抽一张疯狂卡，否则你在此基地的一个随从将被消灭', options as any[],
        { sourceId: 'elder_thing_shoggoth_opponent', targetType: 'button' },
    );
    (interaction.data as any).continuationContext = {
        casterPlayerId: ctx.playerId,
        targetPlayerId: opponents[0],
        baseIndex: ctx.baseIndex,
        opponents,
        opponentIdx: 0,
    };
    return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
}

// ============================================================================
// 交互解决处理函数
// ============================================================================

/** 修格斯链式处理：继续询问下一个对手 */
function shoggothContinueChain(
    state: any, events: SmashUpEvent[],
    ctx: { casterPlayerId: string; baseIndex: number; opponents: string[]; opponentIdx: number },
    timestamp: number,
): { state: any; events: SmashUpEvent[] } {
    const nextIdx = ctx.opponentIdx + 1;
    if (nextIdx < ctx.opponents.length) {
        const nextPid = ctx.opponents[nextIdx];
        const options = [
            { id: 'draw_madness', label: '抽一张疯狂卡', value: { choice: 'draw_madness' }, displayMode: 'button' as const },
            { id: 'decline', label: '拒绝（被消灭一个随从）', value: { choice: 'decline' }, displayMode: 'button' as const },
        ];
        const interaction = createSimpleChoice(
            `elder_thing_shoggoth_opponent_${nextIdx}_${timestamp}`, nextPid,
            '修格斯：你可以抽一张疯狂卡，否则你在此基地的一个随从将被消灭', options as any[],
            { sourceId: 'elder_thing_shoggoth_opponent', targetType: 'button' },
        );
        (interaction.data as any).continuationContext = {
            casterPlayerId: ctx.casterPlayerId,
            targetPlayerId: nextPid,
            baseIndex: ctx.baseIndex,
            opponents: ctx.opponents,
            opponentIdx: nextIdx,
        };
        return { state: queueInteraction(state, interaction), events };
    }
    // 链结束：检查总力量是否 < 12（包含修格斯自身力量），若是则抽两张疯狂卡
    const base = state.core.bases[ctx.baseIndex];
    if (base) {
        const power = getPlayerEffectivePowerOnBase(state.core, base, ctx.baseIndex, ctx.casterPlayerId);
        if (power < 12) {
            const evt = drawMadnessCards(ctx.casterPlayerId, 2, state.core, 'elder_thing_shoggoth', timestamp);
            if (evt) events.push(evt);
        }
    }
    return { state, events };
}

/** 注册远古之物派系的交互解决处理函数 */
export function registerElderThingInteractionHandlers(): void {
    // 传播恐怖：对手选择是否弃 2 张非疯狂；否则施放者从弃牌堆在不同基地特招 ≤3 力量随从
    registerInteractionHandler('elder_thing_spreading_horror', (state, playerId, value, iData, random, timestamp) => {
        const v = value as { skip?: boolean; cardUid?: string } | { cardUid?: string }[] | undefined;
        const ctx = (iData as any)?.continuationContext as {
            casterPlayerId: string;
            opponents: string[];
            opponentIdx: number;
            usedBaseIndices: number[];
        } | undefined;
        if (!ctx) return { state, events: [] };

        const events: SmashUpEvent[] = [];
        const currentOpponentId = ctx.opponents[ctx.opponentIdx];

        const selections = Array.isArray(v) ? v : (v && !v.skip && v.cardUid ? [v] : []);
        const selectedCardUids = selections
            .map(s => (s as any).cardUid)
            .filter((uid): uid is string => typeof uid === 'string');

        const didDiscardTwo = selectedCardUids.length === 2;

        if (didDiscardTwo) {
            events.push({
                type: SU_EVENTS.CARDS_DISCARDED,
                payload: { playerId: currentOpponentId, cardUids: selectedCardUids },
                timestamp,
            } as CardsDiscardedEvent);
        } else {
            // 对手未成功弃 2 张非疯狂 → 施放者可以从弃牌堆特招 ≤3 力量随从到尚未使用过的基地（可选择跳过）
            const caster = state.core.players[ctx.casterPlayerId];
            const summonCandidates = caster.discard.filter(c => {
                if (c.type !== 'minion') return false;
                const def = getCardDef(c.defId) as MinionCardDef | undefined;
                return !!def && def.power <= 3;
            });

            // 有可用随从且有可用基地时才创建特招交互
            const availableBases = state.core.bases
                .map((_, idx) => idx)
                .filter(idx => !ctx.usedBaseIndices.includes(idx));

            if (summonCandidates.length > 0 && availableBases.length > 0) {
                const cardOptions = summonCandidates.map(c => {
                    const def = getCardDef(c.defId) as MinionCardDef | undefined;
                    const name = def?.name ?? c.defId;
                    return {
                        id: c.uid,
                        label: name,
                        value: { cardUid: c.uid },
                        displayMode: 'card' as const,
                    };
                });

                const interaction = createSimpleChoice(
                    `elder_thing_spreading_horror_summon_${ctx.opponentIdx}_${timestamp}`,
                    ctx.casterPlayerId,
                    '传播恐怖：你可以从弃牌堆特招一个力量≤3的随从',
                    [
                        ...cardOptions,
                        { id: 'skip', label: '跳过（不特招）', value: { skip: true }, displayMode: 'button' as const },
                    ] as any[],
                    {
                        sourceId: 'elder_thing_spreading_horror_summon',
                        targetType: 'generic',
                        autoCancelOption: true,
                    },
                );
                (interaction.data as any).continuationContext = ctx;
                return { state: queueInteraction(state, interaction), events };
            }
        }

        // 处理下一个对手
        const nextIdx = ctx.opponentIdx + 1;
        if (nextIdx < ctx.opponents.length) {
            const nextOpponentId = ctx.opponents[nextIdx];
            const opponent = state.core.players[nextOpponentId];
            if (!opponent) return { state, events };

            const nonMadness = opponent.hand.filter(c => c.defId !== MADNESS_CARD_DEF_ID);
            const cardOptions = nonMadness.map(c => {
                const def = getCardDef(c.defId);
                const name = def?.name ?? c.defId;
                return {
                    id: c.uid,
                    label: name,
                    value: { cardUid: c.uid },
                    displayMode: 'card' as const,
                };
            });

            const options = [
                ...cardOptions,
                { id: 'skip', label: '跳过（不弃牌）', value: { skip: true }, displayMode: 'button' as const },
            ];

            const interaction = createSimpleChoice(
                `elder_thing_spreading_horror_discard_${nextOpponentId}_${timestamp}`,
                nextOpponentId,
                '传播恐怖：你可以弃置 2 张非疯狂卡，否则对手可以从弃牌堆特招一个随从到不同的基地',
                options as any[],
                {
                    sourceId: 'elder_thing_spreading_horror',
                    targetType: 'generic',
                    autoCancelOption: false,
                    multi: { min: 0, max: 2 },
                },
            );
            (interaction.data as any).continuationContext = {
                ...ctx,
                opponentIdx: nextIdx,
            };
            return { state: queueInteraction(state, interaction), events };
        }

        return { state, events };
    });

    // 传播恐怖：施放者选择特招随从与基地
    registerInteractionHandler('elder_thing_spreading_horror_summon', (state, playerId, value, iData, random, timestamp) => {
        const v = value as { skip?: boolean; cardUid?: string } | undefined;
        const ctx = (iData as any)?.continuationContext as {
            casterPlayerId: string;
            opponents: string[];
            opponentIdx: number;
            usedBaseIndices: number[];
        } | undefined;
        if (!ctx) return { state, events: [] };
        if (playerId !== ctx.casterPlayerId) return { state, events: [] };

        const events: SmashUpEvent[] = [];

        if (!v || v.skip || !v.cardUid) {
            // 跳过特招 → 直接推进到下一个对手
            const nextIdx = ctx.opponentIdx + 1;
            if (nextIdx < ctx.opponents.length) {
                const nextOpponentId = ctx.opponents[nextIdx];
                const opponent = state.core.players[nextOpponentId];
                if (!opponent) return { state, events };

                const nonMadness = opponent.hand.filter(c => c.defId !== MADNESS_CARD_DEF_ID);
                const cardOptions = nonMadness.map(c => {
                    const def = getCardDef(c.defId);
                    const name = def?.name ?? c.defId;
                    return {
                        id: c.uid,
                        label: name,
                        value: { cardUid: c.uid },
                        displayMode: 'card' as const,
                    };
                });

                const options = [
                    ...cardOptions,
                    { id: 'skip', label: '跳过（不弃牌）', value: { skip: true }, displayMode: 'button' as const },
                ];

                const interaction = createSimpleChoice(
                    `elder_thing_spreading_horror_discard_${nextOpponentId}_${timestamp}`,
                    nextOpponentId,
                    '传播恐怖：你可以弃置 2 张非疯狂卡，否则对手可以从弃牌堆特招一个随从到不同的基地',
                    options as any[],
                    {
                        sourceId: 'elder_thing_spreading_horror',
                        targetType: 'generic',
                        autoCancelOption: false,
                        multi: { min: 0, max: 2 },
                    },
                );
                (interaction.data as any).continuationContext = {
                    ...ctx,
                    opponentIdx: nextIdx,
                };
                return { state: queueInteraction(state, interaction), events };
            }

            return { state, events };
        }

        // 选择了要特招的随从 → 选择一个尚未使用过的基地
        const caster = state.core.players[ctx.casterPlayerId];
        const summonCard = caster.discard.find(c => c.uid === v.cardUid);
        if (!summonCard) return { state, events: [] };

        const availableBases = state.core.bases
            .map((_, idx) => idx)
            .filter(idx => !ctx.usedBaseIndices.includes(idx));

        if (availableBases.length === 0) {
            return { state, events };
        }

        const baseOptions = availableBases.map(idx => {
            const baseDef = getBaseDef(state.core.bases[idx].defId);
            const baseName = baseDef?.name ?? `基地 ${idx + 1}`;
            return {
                id: `base-${idx}`,
                label: baseName,
                value: { baseIndex: idx, cardUid: summonCard.uid },
            };
        });

        const interaction = createSimpleChoice(
            `elder_thing_spreading_horror_choose_base_${timestamp}`,
            ctx.casterPlayerId,
            '传播恐怖：选择一个不同的基地来特招该随从',
            baseOptions as any[],
            {
                sourceId: 'elder_thing_spreading_horror_choose_base',
                targetType: 'base',
                autoCancelOption: false,
            },
        );
        (interaction.data as any).continuationContext = ctx;
        return { state: queueInteraction(state, interaction), events };
    });

    // 传播恐怖：选择基地后真正从弃牌堆特招随从（不消耗正常出牌额度）
    registerInteractionHandler('elder_thing_spreading_horror_choose_base', (state, playerId, value, iData, random, timestamp) => {
        const v = value as { baseIndex: number; cardUid: string } | undefined;
        const ctx = (iData as any)?.continuationContext as {
            casterPlayerId: string;
            opponents: string[];
            opponentIdx: number;
            usedBaseIndices: number[];
        } | undefined;
        if (!ctx) return { state, events: [] };
        if (!v || typeof v.baseIndex !== 'number' || !v.cardUid) return { state, events: [] };

        const events: SmashUpEvent[] = [];

        const nextUsed = [...ctx.usedBaseIndices, v.baseIndex];

        // 通过 MINION_PLAYED fromDiscard 模式从弃牌堆打出随从，标记不消耗正常额度
        const caster = state.core.players[ctx.casterPlayerId];
        const card = caster.discard.find(c => c.uid === v.cardUid);
        if (card) {
            events.push({
                type: SU_EVENTS.MINION_PLAYED,
                payload: {
                    playerId: ctx.casterPlayerId,
                    cardUid: card.uid,
                    defId: card.defId,
                    baseIndex: v.baseIndex,
                    power: 0,
                    fromDiscard: true,
                    fromDeck: false,
                    discardPlaySourceId: 'elder_thing_spreading_horror',
                    consumesNormalLimit: false,
                },
                timestamp,
            } as any);
        }

        // 更新 usedBaseIndices 供后续对手使用
        const updatedCtx = { ...ctx, usedBaseIndices: nextUsed };

        // 进入下一个对手
        const nextIdx = ctx.opponentIdx + 1;
        if (nextIdx < ctx.opponents.length) {
            const nextOpponentId = ctx.opponents[nextIdx];
            const opponent = state.core.players[nextOpponentId];
            if (!opponent) return { state, events };

            const nonMadness = opponent.hand.filter(c => c.defId !== MADNESS_CARD_DEF_ID);
            const cardOptions = nonMadness.map(c => {
                const def = getCardDef(c.defId);
                const name = def?.name ?? c.defId;
                return {
                    id: c.uid,
                    label: name,
                    value: { cardUid: c.uid },
                    displayMode: 'card' as const,
                };
            });

            const options = [
                ...cardOptions,
                { id: 'skip', label: '跳过（不弃牌）', value: { skip: true }, displayMode: 'button' as const },
            ];

            const interaction = createSimpleChoice(
                `elder_thing_spreading_horror_discard_${nextOpponentId}_${timestamp}`,
                nextOpponentId,
                '传播恐怖：你可以弃置 2 张非疯狂卡，否则对手可以从弃牌堆特招一个随从到不同的基地',
                options as any[],
                {
                    sourceId: 'elder_thing_spreading_horror',
                    targetType: 'generic',
                    autoCancelOption: false,
                    multi: { min: 0, max: 2 },
                },
            );
            (interaction.data as any).continuationContext = {
                ...updatedCtx,
                opponentIdx: nextIdx,
            };
            return { state: queueInteraction(state, interaction), events };
        }

        return { state, events };
    });

    // 米-格：对手选择是否抽疯狂卡（链式处理）
    registerInteractionHandler('elder_thing_mi_go', (state, _playerId, value, iData, _random, timestamp) => {
        const { choice } = value as { choice: string };
        const ctx = (iData as any)?.continuationContext as { casterPlayerId: string; opponents: string[]; opponentIdx: number; drewMadnessCount?: number };
        if (!ctx) return { state, events: [] };
        const events: SmashUpEvent[] = [];
        const currentOpponent = ctx.opponents[ctx.opponentIdx];

        if (choice === 'draw_madness') {
            const evt = drawMadnessCards(currentOpponent, 1, state.core, 'elder_thing_mi_go', timestamp);
            if (evt) events.push(evt);
            ctx.drewMadnessCount = (ctx.drewMadnessCount ?? 0) + 1;
        } else {
            // 对手拒绝 → 施法者抽一张牌
            const caster = state.core.players[ctx.casterPlayerId];
            if (caster && caster.deck.length > 0) {
                const drawnUid = caster.deck[0].uid;
                events.push({
                    type: SU_EVENTS.CARDS_DRAWN,
                    payload: { playerId: ctx.casterPlayerId, count: 1, cardUids: [drawnUid] },
                    timestamp,
                } as CardsDrawnEvent);
            }
        }

        // 链式处理下一个对手
        const nextIdx = ctx.opponentIdx + 1;
        if (nextIdx < ctx.opponents.length) {
            const nextPid = ctx.opponents[nextIdx];
            const options = [
                { id: 'draw_madness', label: '抽一张疯狂卡', value: { choice: 'draw_madness' }, displayMode: 'button' as const },
                { id: 'decline', label: '拒绝（让对方抽一张牌）', value: { choice: 'decline' }, displayMode: 'button' as const },
            ];
            const interaction = createSimpleChoice(
                `elder_thing_mi_go_${nextPid}_${timestamp}`, nextPid,
                '米-格：你可以抽一张疯狂卡，否则对方抽一张牌', options as any[],
                { sourceId: 'elder_thing_mi_go', targetType: 'button' },
            );
            (interaction.data as any).continuationContext = {
                casterPlayerId: ctx.casterPlayerId,
                opponents: ctx.opponents,
                opponentIdx: nextIdx,
                drewMadnessCount: ctx.drewMadnessCount ?? 0,
            };
            return { state: queueInteraction(state, interaction), events };
        }

        // 链结束：若没有任何其他玩家抽了疯狂卡，则施放者可选择放置 +1 力量指示物（可跳过）
        if ((ctx.drewMadnessCount ?? 0) === 0) {
            const interaction = createSimpleChoice(
                `elder_thing_mi_go_counter_prompt_${timestamp}`,
                ctx.casterPlayerId,
                '米-格：没有对手抽疯狂卡，你可以放置 +1 力量指示物',
                [
                    { id: 'place', label: '放置 +1 力量指示物', value: { choice: 'place' }, displayMode: 'button' as const },
                    { id: 'skip', label: '跳过', value: { choice: 'skip' }, displayMode: 'button' as const },
                ] as any[],
                { sourceId: 'elder_thing_mi_go_counter_prompt', targetType: 'generic', autoCancelOption: true },
            );
            (interaction.data as any).continuationContext = { casterPlayerId: ctx.casterPlayerId };
            return { state: queueInteraction(state, interaction), events };
        }

        return { state, events };
    });

    // 米-格：链结束后的“放置 +1 指示物”确认
    registerInteractionHandler('elder_thing_mi_go_counter_prompt', (state, playerId, value, iData, _random, timestamp) => {
        const v = value as { choice?: 'place' | 'skip' } | undefined;
        const ctx = (iData as any)?.continuationContext as { casterPlayerId: string } | undefined;
        if (!ctx) return { state, events: [] };
        if (!v || v.choice !== 'place') return { state, events: [] };

        // 目标：任意基地上的任意随从（含对手）
        const candidates: { uid: string; defId: string; baseIndex: number; label: string }[] = [];
        for (let bi = 0; bi < state.core.bases.length; bi++) {
            const base = state.core.bases[bi];
            for (const m of base.minions) {
                const def = getCardDef(m.defId) as MinionCardDef | undefined;
                candidates.push({ uid: m.uid, defId: m.defId, baseIndex: bi, label: def?.name ?? m.defId });
            }
        }
        if (candidates.length === 0) return { state, events: [] };

        const interaction = createSimpleChoice(
            `elder_thing_mi_go_counter_choose_${timestamp}`,
            ctx.casterPlayerId,
            '米-格：选择一个随从放置 +1 力量指示物',
            buildMinionTargetOptions(candidates, { state: state.core, sourcePlayerId: ctx.casterPlayerId }) as any[],
            { sourceId: 'elder_thing_mi_go_counter_choose', targetType: 'minion', autoCancelOption: true },
        );
        return { state: queueInteraction(state, interaction), events: [] };
    });

    // 米-格：选择目标随从后放置 +1 指示物
    registerInteractionHandler('elder_thing_mi_go_counter_choose', (state, playerId, value, _iData, _random, timestamp) => {
        const v = value as { minionUid?: string; baseIndex?: number } | undefined;
        if (!v || typeof v.minionUid !== 'string' || typeof v.baseIndex !== 'number') return { state, events: [] };
        return { state, events: [addPowerCounter(v.minionUid, v.baseIndex, 1, 'elder_thing_mi_go', timestamp)] };
    });

    registerInteractionHandler('elder_thing_begin_the_summoning', (state, playerId, value, _iData, _random, timestamp) => {
        const { cardUid } = value as { cardUid: string };
        const player = state.core.players[playerId];
        // DECK_REORDERED：将弃牌堆中的随从放到牌库顶，reducer 会自动从弃牌堆移除
        const newDeckUids = [cardUid, ...player.deck.map(c => c.uid)];
        return { state, events: [
            { type: SU_EVENTS.DECK_REORDERED, payload: { playerId, deckUids: newDeckUids }, timestamp },
            grantExtraAction(playerId, 'elder_thing_begin_the_summoning', timestamp),
        ] };
    });

    // 疯狂之力：施法者命名对手行动（逐个对手链式处理）
    registerInteractionHandler('elder_thing_power_of_madness', (state, playerId, value, iData, random, timestamp) => {
        const v = value as { namedDefId?: string; skip?: true } | undefined;
        const ctx = (iData as any)?.continuationContext as { casterPlayerId: string; opponents: string[]; opponentIdx: number } | undefined;
        if (!ctx) return { state, events: [] };
        if (playerId !== ctx.casterPlayerId) return { state, events: [] };

        const opponentId = ctx.opponents[ctx.opponentIdx];
        const opponent = state.core.players[opponentId];
        if (!opponent) return { state, events: [] };

        const events: SmashUpEvent[] = [];

        // 展示对手手牌（即使为空也展示为合理无效果，这里保持为空则不发事件）
        if (opponent.hand.length > 0) {
            events.push(revealHand(opponentId, 'all', opponent.hand.map(c => ({ uid: c.uid, defId: c.defId })), 'elder_thing_power_of_madness', timestamp, ctx.casterPlayerId));
        }

        const namedDefId = (v && typeof v.namedDefId === 'string') ? v.namedDefId : undefined;
        const toDiscard = namedDefId ? opponent.hand.filter(c => c.defId === namedDefId) : [];
        if (toDiscard.length > 0) {
            events.push({
                type: SU_EVENTS.CARDS_DISCARDED,
                payload: { playerId: opponentId, cardUids: toDiscard.map(c => c.uid) },
                timestamp,
            } as CardsDiscardedEvent);
        }

        // 澄清：即使命名导致弃牌数为 0，只要对手弃牌堆非空，也必须洗回牌库
        const shouldReshuffle = opponent.discard.length > 0 || toDiscard.length > 0;
        if (shouldReshuffle) {
            const newDeck = random.shuffle([...opponent.deck, ...opponent.discard, ...toDiscard]);
            events.push({
                type: SU_EVENTS.DECK_RESHUFFLED,
                payload: { playerId: opponentId, deckUids: newDeck.map(c => c.uid) },
                timestamp,
            } as DeckReshuffledEvent);
        }

        // 链式处理下一个对手
        const nextIdx = ctx.opponentIdx + 1;
        if (nextIdx < ctx.opponents.length) {
            const nextOpponentId = ctx.opponents[nextIdx];
            const options = buildPowerOfMadnessNameOptions(state.core, nextOpponentId);
            const interaction = createSimpleChoice(
                `elder_thing_power_of_madness_name_${nextOpponentId}_${timestamp}`,
                ctx.casterPlayerId,
                '疯狂之力：命名一个行动',
                options as any[],
                { sourceId: 'elder_thing_power_of_madness', targetType: 'generic', autoCancelOption: false },
            );
            (interaction.data as any).continuationContext = { ...ctx, opponentIdx: nextIdx };
            return { state: queueInteraction(state, interaction), events };
        }

        return { state, events };
    });

    // 邓威奇恐怖：计分前选择（抽2疯狂 / 消灭该随从）
    registerInteractionHandler('elder_thing_dunwich_horror_before_scoring', (state, _playerId, value, iData, _random, timestamp) => {
        const { choice } = value as { choice: 'draw' | 'destroy' };
        const ctx = (iData as any)?.continuationContext as {
            targets: { minionUid: string; minionDefId: string; ownerId: string; controllerId: string }[];
            idx: number;
            baseIndex: number;
        } | undefined;
        if (!ctx) return { state, events: [] };

        const current = ctx.targets[ctx.idx];
        if (!current) return { state, events: [] };

        const events: SmashUpEvent[] = [];
        if (choice === 'draw') {
            const evt = drawMadnessCards(current.controllerId, 2, state.core, 'elder_thing_dunwich_horror', timestamp);
            if (evt) events.push(evt);
        } else {
            events.push(destroyMinion(current.minionUid, current.minionDefId, ctx.baseIndex, current.ownerId, undefined, 'elder_thing_dunwich_horror', timestamp));
        }

        const nextIdx = ctx.idx + 1;
        if (nextIdx < ctx.targets.length) {
            const next = ctx.targets[nextIdx];
            const interaction = createSimpleChoice(
                `elder_thing_dunwich_horror_before_scoring_${nextIdx}_${timestamp}`,
                next.controllerId,
                '敦威治恐怖：计分前你必须二选一',
                [
                    { id: 'draw', label: '抽两张疯狂卡', value: { choice: 'draw' }, displayMode: 'button' as const },
                    { id: 'destroy', label: '消灭该随从', value: { choice: 'destroy' }, displayMode: 'button' as const },
                ] as any[],
                { sourceId: 'elder_thing_dunwich_horror_before_scoring', targetType: 'generic', autoCancelOption: false },
            );
            (interaction.data as any).continuationContext = { ...ctx, idx: nextIdx };
            return { state: queueInteraction(state, interaction), events };
        }

        return { state, events };
    });

    registerInteractionHandler('elder_thing_elder_thing_choice', (state, playerId, value, iData, _random, timestamp) => {
        const { choice } = value as { choice: string };
        const ctx = (iData as any)?.continuationContext as { cardUid: string; defId: string; baseIndex: number };
        if (!ctx) return { state, events: [] };

        if (choice === 'deckbottom') {
            return {
                state,
                events: buildValidatedCardToDeckBottomEvents(state, {
                    cardUid: ctx.cardUid,
                    defId: ctx.defId,
                    ownerId: playerId,
                    reason: 'elder_thing_elder_thing',
                    now: timestamp,
                    expectedLocation: 'bases',
                }),
            };
        }

        // choice === 'destroy' → 收集己方其他随从，让玩家点击消灭第一个
        const myMinions: { minion: MinionOnBase; baseIndex: number }[] = [];
        for (let i = 0; i < state.core.bases.length; i++) {
            for (const m of state.core.bases[i].minions) {
                if (m.controller === playerId && m.uid !== ctx.cardUid) {
                    // 只允许“能成功消灭”的目标；否则视为无法成功消灭两名随从
                    if (!isMinionProtected(state.core, m, i, playerId, 'destroy')) {
                        myMinions.push({ minion: m, baseIndex: i });
                    }
                }
            }
        }

        // 若无法成功消灭两名随从，则必须把远古之物放到牌库底（澄清）
        if (myMinions.length < 2) {
            return {
                state,
                events: [{
                    type: SU_EVENTS.CARD_TO_DECK_BOTTOM,
                    payload: { cardUid: ctx.cardUid, defId: ctx.defId, ownerId: playerId, reason: 'elder_thing_elder_thing' },
                    timestamp,
                } satisfies CardToDeckBottomEvent],
            };
        }
        
        // 恰好 2 个或更少随从时直接全部消灭（无需选择）
        if (myMinions.length <= 2) {
            const events: SmashUpEvent[] = [];
            for (const t of myMinions) {
                events.push(destroyMinion(t.minion.uid, t.minion.defId, t.baseIndex, t.minion.owner, playerId, 'elder_thing_elder_thing', timestamp));
            }
            return { state, events };
        }
        
        // >2 个随从时：让玩家点击第一个要消灭的随从
        const options = myMinions.map(({ minion: m, baseIndex: bi }) => {
            const def = getCardDef(m.defId) as MinionCardDef | undefined;
            const name = def?.name ?? m.defId;
            const baseDef = getBaseDef(state.core.bases[bi].defId);
            const baseName = baseDef?.name ?? `基地 ${bi + 1}`;
            const power = getMinionPower(state.core, m, bi);
            return { uid: m.uid, defId: m.defId, baseIndex: bi, label: `${name} (力量 ${power}) @ ${baseName}` };
        });
        const interaction = createSimpleChoice(
            `elder_thing_elder_thing_destroy_first_${timestamp}`, playerId,
            '远古之物：点击第一个要消灭的随从', buildMinionTargetOptions(options, { state: state.core, sourcePlayerId: playerId }),
            { sourceId: 'elder_thing_elder_thing_destroy_first', targetType: 'minion' }
        );
        return { state: queueInteraction(state, interaction), events: [] };
    });

    // 远古之物：玩家点击第一个要消灭的随从
    registerInteractionHandler('elder_thing_elder_thing_destroy_first', (state, playerId, value, _iData, _random, timestamp) => {
        const { minionUid, baseIndex, defId } = value as { minionUid: string; baseIndex: number; defId: string };
        const base = state.core.bases[baseIndex];
        const target = base?.minions.find(m => m.uid === minionUid);
        if (!target) return { state, events: [] };
        if (isMinionProtected(state.core, target, baseIndex, playerId, 'destroy')) return { state, events: [] };
        
        // 消灭第一个随从
        const events: SmashUpEvent[] = [
            destroyMinion(target.uid, target.defId, baseIndex, target.owner, playerId, 'elder_thing_elder_thing', timestamp)
        ];
        
        // 收集剩余的己方随从（排除刚消灭的和远古之物自己）
        const remainingMinions: { minion: MinionOnBase; baseIndex: number }[] = [];
        for (let i = 0; i < state.core.bases.length; i++) {
            for (const m of state.core.bases[i].minions) {
                if (m.controller === playerId && m.uid !== minionUid) {
                    if (!isMinionProtected(state.core, m, i, playerId, 'destroy')) {
                        remainingMinions.push({ minion: m, baseIndex: i });
                    }
                }
        }
        }
        
        // 如果只剩 1 个随从（远古之物自己），直接结束
        if (remainingMinions.length === 1) {
            return { state, events };
        }
        
        // 让玩家点击第二个要消灭的随从
        const options = remainingMinions
            .filter(({ minion: m }) => !matchesDefId(m.defId, 'elder_thing_elder_thing')) // 排除远古之物自己
            .map(({ minion: m, baseIndex: bi }) => {
                const def = getCardDef(m.defId) as MinionCardDef | undefined;
                const name = def?.name ?? m.defId;
                const baseDef = getBaseDef(state.core.bases[bi].defId);
                const baseName = baseDef?.name ?? `基地 ${bi + 1}`;
                const power = getMinionPower(state.core, m, bi);
                return { uid: m.uid, defId: m.defId, baseIndex: bi, label: `${name} (力量 ${power}) @ ${baseName}` };
            });
        
        const interaction = createSimpleChoice(
            `elder_thing_elder_thing_destroy_second_${timestamp}`, playerId,
            '远古之物：点击第二个要消灭的随从', buildMinionTargetOptions(options, { state: state.core, sourcePlayerId: playerId }),
            { sourceId: 'elder_thing_elder_thing_destroy_second', targetType: 'minion' }
        );
        return { state: queueInteraction(state, interaction), events };
    });
    
    // 远古之物：玩家点击第二个要消灭的随从
    registerInteractionHandler('elder_thing_elder_thing_destroy_second', (state, playerId, value, _iData, _random, timestamp) => {
        const { minionUid, baseIndex, defId } = value as { minionUid: string; baseIndex: number; defId: string };
        const base = state.core.bases[baseIndex];
        const target = base?.minions.find(m => m.uid === minionUid);
        if (!target) return { state, events: [] };
        if (isMinionProtected(state.core, target, baseIndex, playerId, 'destroy')) return { state, events: [] };
        
        // 消灭第二个随从
        const events: SmashUpEvent[] = [
            destroyMinion(target.uid, target.defId, baseIndex, target.owner, playerId, 'elder_thing_elder_thing', timestamp)
        ];
        
        return { state, events };
    });

    registerInteractionHandler('elder_thing_shoggoth_opponent', (state, _playerId, value, iData, _random, timestamp) => {
        const { choice } = value as { choice: string };
        const ctx = (iData as any)?.continuationContext as { baseIndex: number; opponents: string[]; opponentIdx: number; targetPlayerId: string; casterPlayerId: string };
        if (!ctx) return { state, events: [] };
        const events: SmashUpEvent[] = [];

        if (choice === 'draw_madness') {
            const evt = drawMadnessCards(ctx.targetPlayerId, 1, state.core, 'elder_thing_shoggoth', timestamp);
            if (evt) events.push(evt);
        } else {
            // 对手拒绝抽疯狂卡 → 由修格斯控制者【可以】选择消灭该对手在此基地的一个随从（可跳过）
            const base = state.core.bases[ctx.baseIndex];
            if (base) {
                const opMinions = base.minions.filter((m: any) => m.controller === ctx.targetPlayerId);
                if (opMinions.length > 0) {
                    const minionOptions = opMinions.map(m => {
                        const def = getCardDef(m.defId) as MinionCardDef | undefined;
                        return { uid: m.uid, defId: m.defId, baseIndex: ctx.baseIndex, label: def?.name ?? m.defId };
                    });

                    const options = [
                        ...buildMinionTargetOptions(minionOptions, { state: state.core, sourcePlayerId: ctx.casterPlayerId, effectType: 'destroy' }),
                        { id: 'skip', label: '跳过（不消灭）', value: { skip: true }, displayMode: 'button' as const },
                    ];

                    const interaction = createSimpleChoice(
                        `elder_thing_shoggoth_destroy_${ctx.opponentIdx}_${timestamp}`,
                        ctx.casterPlayerId,
                        `修格斯：你可以消灭对手在此基地的一个随从`,
                        options as any[],
                        { sourceId: 'elder_thing_shoggoth_destroy', targetType: 'generic', autoCancelOption: true },
                    );
                    (interaction.data as any).continuationContext = {
                        casterPlayerId: ctx.casterPlayerId,
                        baseIndex: ctx.baseIndex,
                        opponents: ctx.opponents,
                        opponentIdx: ctx.opponentIdx,
                    };
                    return { state: queueInteraction(state, interaction), events };
                }
            }
        }

        // 链式垂询下一个对手
        return shoggothContinueChain(state, events, ctx, timestamp);
    });

    // 修格斯：控制者选择消灭对手随从后的处理
    registerInteractionHandler('elder_thing_shoggoth_destroy', (state, playerId, value, iData, _random, timestamp) => {
        const v = value as { minionUid?: string; baseIndex?: number; defId?: string; skip?: boolean } | undefined;
        const ctx = (iData as any)?.continuationContext as { casterPlayerId: string; baseIndex: number; opponents: string[]; opponentIdx: number };
        if (!ctx) return { state, events: [] };

        const events: SmashUpEvent[] = [];

        if (!v || v.skip) {
            // 跳过不消灭
            return shoggothContinueChain(state, events, ctx, timestamp);
        }

        const baseIndex = v.baseIndex ?? ctx.baseIndex;
        const minionUid = v.minionUid;
        if (typeof minionUid === 'string') {
            const base = state.core.bases[baseIndex];
            const target = base?.minions.find(m => m.uid === minionUid);
            if (target) {
                events.push(destroyMinion(target.uid, target.defId, baseIndex, target.owner, playerId, 'elder_thing_shoggoth', timestamp));
            }
        }

        // 继续链式处理下一个对手
        return shoggothContinueChain(state, events, ctx, timestamp);
    });

    // 深不可测的目的：对手选择消灭自己的随从（链式处理多个对手）
    registerInteractionHandler('elder_thing_unfathomable_goals', (state, playerId, value, iData, _random, timestamp) => {
        const { minionUid, baseIndex } = value as { minionUid: string; baseIndex: number };
        const base = state.core.bases[baseIndex];
        if (!base) return { state, events: [] };
        const target = base.minions.find(m => m.uid === minionUid);
        if (!target) return { state, events: [] };
        const events: SmashUpEvent[] = [destroyMinion(target.uid, target.defId, baseIndex, target.owner, playerId, 'elder_thing_unfathomable_goals', timestamp)];

        // 链式处理下一个对手
        const ctx = (iData as any)?.continuationContext as { opponents: string[]; opponentIdx: number } | undefined;
        if (!ctx) return { state, events };
        const nextIdx = ctx.opponentIdx + 1;
        if (nextIdx >= ctx.opponents.length) return { state, events };

        // 查找下一个需要选择的对手
        for (let i = nextIdx; i < ctx.opponents.length; i++) {
            const pid = ctx.opponents[i];
            const opMinions: { uid: string; defId: string; baseIndex: number; owner: string }[] = [];
            for (let bi = 0; bi < state.core.bases.length; bi++) {
                for (const m of state.core.bases[bi].minions) {
                    if (m.controller !== pid) continue;
                    opMinions.push({ uid: m.uid, defId: m.defId, baseIndex: bi, owner: m.owner });
                }
            }
            if (opMinions.length === 0) continue;
            if (opMinions.length === 1) {
                events.push(destroyMinion(opMinions[0].uid, opMinions[0].defId, opMinions[0].baseIndex, opMinions[0].owner, pid, 'elder_thing_unfathomable_goals', timestamp));
                continue;
            }
            // 多个随从：创建交互
            const options = opMinions.map(m => {
                const def = getCardDef(m.defId) as MinionCardDef | undefined;
                const name = def?.name ?? m.defId;
                const baseDef = getBaseDef(state.core.bases[m.baseIndex].defId);
                const baseName = baseDef?.name ?? `基地 ${m.baseIndex + 1}`;
                return { uid: m.uid, defId: m.defId, baseIndex: m.baseIndex, label: `${name} @ ${baseName}` };
            });
            const interaction = createSimpleChoice(
                `elder_thing_unfathomable_goals_${pid}_${timestamp}`, pid, '你手中有疯狂卡，必须消灭一个自己的随从', buildMinionTargetOptions(options, { state: state.core, sourcePlayerId: pid }), { sourceId: 'elder_thing_unfathomable_goals', targetType: 'minion' }
                );
            (interaction.data as any).continuationContext = {
                opponents: ctx.opponents,
                opponentIdx: i,
            };
            return { state: queueInteraction(state, interaction), events };
        }

        return { state, events };
    });
}

// ============================================================================
// ongoing 效果触发器
// ============================================================================

/** 力量的代价 onPlay：所有其他玩家展示手牌，每张疯狂卡给你一个 +1 指示物机会（逐个选择目标随从） */
function elderThingPriceOfPowerOnPlay(ctx: AbilityContext): AbilityResult {
    const events: SmashUpEvent[] = [];

    const allRevealCards: { uid: string; defId: string }[] = [];
    const revealTargetIds: string[] = [];
    let totalMadness = 0;

    for (const pid of ctx.state.turnOrder) {
        if (pid === ctx.playerId) continue;
        const opponent = ctx.state.players[pid];
        if (opponent.hand.length > 0) {
            revealTargetIds.push(pid);
            for (const c of opponent.hand) {
                allRevealCards.push({ uid: c.uid, defId: c.defId });
            }
        }
        totalMadness += opponent.hand.filter(c => c.defId === MADNESS_CARD_DEF_ID).length;
    }

    if (allRevealCards.length > 0) {
        const targetIds = revealTargetIds.length === 1 ? revealTargetIds[0] : revealTargetIds;
        events.push(revealHand(targetIds, 'all', allRevealCards, 'elder_thing_the_price_of_power', ctx.now, ctx.playerId));
    }

    if (totalMadness === 0) return { events };

    // 若有疯狂卡，则进入“逐个选择目标随从放 +1 指示物”的交互链
    const player = ctx.state.players[ctx.playerId];
    const hasAnyMinion = ctx.state.bases.some(base => base.minions.some(m => m.controller === ctx.playerId));
    if (!hasAnyMinion) return { events };

    const options = buildPriceOfPowerMinionOptions(ctx.state, ctx.playerId);
    if (options.length === 0) return { events };

    const interaction = createSimpleChoice(
        `elder_thing_the_price_of_power_onplay_0_${ctx.now}`,
        ctx.playerId,
        '力量的代价：选择一个随从放置 +1 力量指示物',
        options as any[],
        { sourceId: 'elder_thing_the_price_of_power_onplay', targetType: 'minion', autoCancelOption: false },
    );
    (interaction.data as any).continuationContext = {
        remaining: totalMadness,
        playerId: ctx.playerId,
    };

    return { events, matchState: queueInteraction(ctx.matchState, interaction) };
}

/**
 * 力量的代价 special 能力：基地计分前打出
 *
 * 效果：在计分基地上，每个相关对手手牌中的疯狂卡给己方随从 +1 指示物（逐个选择目标）
 * ctx.baseIndex 为计分基地索引（由 Me First! 窗口传入）
 */
function elderThingPriceOfPowerSpecial(ctx: AbilityContext): AbilityResult {
    const events: SmashUpEvent[] = [];
    const scoringBaseIndex = ctx.baseIndex;
    const base = ctx.state.bases[scoringBaseIndex];
    if (!base) return { events };

    // 收集所有相关对手手牌用于合并展示（规则："所有有随从在这里的其他玩家展示他们的手牌"）
    const allRevealCards: { uid: string; defId: string }[] = [];
    const revealTargetIds: string[] = [];
    let totalMadness = 0;
    for (const pid of ctx.state.turnOrder) {
        if (pid === ctx.playerId) continue;
        if (!base.minions.some(m => m.controller === pid)) continue;
        const opponent = ctx.state.players[pid];
        if (opponent.hand.length > 0) {
            revealTargetIds.push(pid);
            for (const c of opponent.hand) {
                allRevealCards.push({ uid: c.uid, defId: c.defId });
            }
        }
        totalMadness += opponent.hand.filter(c => c.defId === MADNESS_CARD_DEF_ID).length;
    }

    // 合并展示所有相关对手手牌（一个事件，避免多人覆盖）
    if (allRevealCards.length > 0) {
        const targetIds = revealTargetIds.length === 1 ? revealTargetIds[0] : revealTargetIds;
        events.push(revealHand(targetIds, 'all', allRevealCards, 'elder_thing_the_price_of_power', ctx.now, ctx.playerId));
    }

    if (totalMadness === 0) return { events };

    // 有疯狂卡 → 逐个选择计分基地上的己方随从放 +1 指示物
    const myMinions = base.minions.filter(m => m.controller === ctx.playerId);
    if (myMinions.length === 0) return { events };

    const options = buildPriceOfPowerMinionOptions(ctx.state, ctx.playerId, scoringBaseIndex);
    if (options.length === 0) return { events };

    const interaction = createSimpleChoice(
        `elder_thing_the_price_of_power_special_0_${ctx.now}`,
        ctx.playerId,
        '力量的代价：选择一个随从放置 +1 力量指示物',
        options as any[],
        { sourceId: 'elder_thing_the_price_of_power_special', targetType: 'minion', autoCancelOption: false },
    );
    (interaction.data as any).continuationContext = {
        remaining: totalMadness,
        playerId: ctx.playerId,
        baseIndex: scoringBaseIndex,
    };
    return { events, matchState: queueInteraction(ctx.matchState, interaction) };
}


/** 邓威奇恐怖触发：基地计分前强制二选一（抽2疯狂/消灭该随从） */
function elderThingDunwichHorrorTrigger(ctx: TriggerContext): SmashUpEvent[] | { events: SmashUpEvent[]; matchState?: any } {
    if (ctx.baseIndex === undefined) return [];
    if (!ctx.matchState) return [];

    const base = ctx.state.bases[ctx.baseIndex];
    if (!base) return [];

    const targets = base.minions
        .filter(m => m.attachedActions.some(a => a.defId === 'elder_thing_dunwich_horror'))
        .map(m => ({
            minionUid: m.uid,
            minionDefId: m.defId,
            ownerId: m.owner,
            controllerId: m.controller,
        }));

    if (targets.length === 0) return [];

    const first = targets[0];
    const interaction = createSimpleChoice(
        `elder_thing_dunwich_horror_before_scoring_0_${ctx.now}`,
        first.controllerId,
        '敦威治恐怖：计分前你必须二选一',
        [
            { id: 'draw', label: '抽两张疯狂卡', value: { choice: 'draw' }, displayMode: 'button' as const },
            { id: 'destroy', label: '消灭该随从', value: { choice: 'destroy' }, displayMode: 'button' as const },
        ] as any[],
        { sourceId: 'elder_thing_dunwich_horror_before_scoring', targetType: 'generic', autoCancelOption: false },
    );
    (interaction.data as any).continuationContext = { targets, idx: 0, baseIndex: ctx.baseIndex };
    return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
}
