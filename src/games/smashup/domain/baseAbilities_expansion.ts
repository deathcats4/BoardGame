/**
 * 澶ф潃鍥涙柟 - 鎵╁睍鍖呭熀鍦拌兘鍔涳紙鍏嬭嫃椴?/ AL9000 / Pretty Pretty锛?
 *
 * 浠?baseAbilities.ts 鎷嗗垎锛岄伩鍏嶅崟鏂囦欢瓒呰繃 1000 琛屻€?
 * 鍦?registerBaseAbilities() 鏈熬璋冪敤 registerExpansionBaseAbilities()銆?
 * 鍦?registerBaseInteractionHandlers() 鏈熬璋冪敤 registerExpansionBaseInteractionHandlers()銆?
 */

import type { MatchState } from '../../../engine/types';
import type {
    SmashUpCore,
    SmashUpEvent,
    MinionDestroyedEvent,
    MinionPlayedEvent,
    PendingPostScoringAction,
} from './types';
import { SU_EVENTS, MADNESS_CARD_DEF_ID } from './types';
import { getEffectivePower } from './ongoingModifiers';
import {
    grantContextualExtraMinion,
    returnMadnessCard,
    grantExtraMinion,
    grantExtraAction,
    drawMadnessCards,
    findMinionOnBases,
    recoverCardsFromDiscard,
    buildValidatedMoveEvents,
    buildValidatedDestroyEvents,
    buildValidatedCardToDeckBottomEvents,
    buildStandardDrawEvents,
} from './abilityHelpers';
import { createSimpleChoice, queueInteraction, type PromptOption } from '../../../engine/systems/InteractionSystem';
import { registerInteractionHandler } from './abilityInteractionHandlers';
import { registerBaseAbility, registerExtended as registerExtendedBase } from './baseAbilities';
import { registerProtection, registerTrigger } from './ongoingEffects';
import type { ProtectionCheckContext } from './ongoingEffects';
import { getCardDef, getMinionDef, getBaseDef } from '../data/cards';
import { getPlayerLabel } from './utils';
import {
    appendPendingPostScoringActions,
    getDeferredPostScoringEvents as readDeferredPostScoringEvents,
    getDeferredReplacementBaseDefId,
    mergeDeferredPostScoringCompatibility,
} from './scoringSession';

function getContinuationContext<T>(interactionData: Record<string, unknown> | undefined): T | undefined {
    return interactionData?.continuationContext as T | undefined;
}

function getDeferredPostScoringEvents(
    state: MatchState<SmashUpCore>,
    interactionData: Record<string, unknown> | undefined,
): SmashUpEvent[] | undefined {
    return readDeferredPostScoringEvents(state, interactionData) as SmashUpEvent[] | undefined;
}

// ============================================================================
// 鍏嬭嫃椴佹墿灞曞熀鍦拌兘鍔?
// ============================================================================

/** 娉ㄥ唽鎵╁睍鍖呭熀鍦拌兘鍔?/
export function registerExpansionBaseAbilities(): void {

    // 鈹€鈹€ 鐤汉闄紙The Asylum锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄤ竴涓帺瀹舵墦鍑轰竴涓殢浠庡埌杩欏悗锛岃鐜╁鍙互灏嗕竴寮犳墜鐗岀Щ鍑烘父鎴忥紙鏀惧叆鐩掑瓙锛夛紝鍦ㄤ綘鐨勪竴涓殢浠庝笂鏀剧疆涓€涓?1鍔涢噺鎸囩ず鐗?
    registerBaseAbility('base_the_asylum', 'onMinionPlayed', (ctx) => {
        const player = ctx.state.players[ctx.playerId];
        if (!player || player.hand.length === 0 || !ctx.matchState) return { events: [] };

        const handOptions = player.hand.map((card, index) => {
            const def = getCardDef(card.defId);
            return {
                id: `card-${index}`,
                label: def?.name ?? card.defId,
                value: { cardUid: card.uid, defId: card.defId },
                _source: 'hand' as const,
                displayMode: 'card' as const,
            };
        });

        const options: PromptOption<Record<string, unknown>>[] = [
            { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
            ...handOptions,
        ];

        const interaction = createSimpleChoice(
            `base_the_asylum_${ctx.now}`, ctx.playerId,
            '鐤汉闄細閫夋嫨涓€寮犳墜鐗屾斁鍏ョ洅瀛?,
            options,
            { sourceId: 'base_the_asylum', targetType: 'hand' },
        );
        return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
    });

    // 鈹€鈹€ 鍗版柉鑼呮柉鍩哄湴锛圛nnsmouth Base锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄤ竴涓殢浠庤鎵撳嚭鍒拌繖鍚庯紝瀹冪殑鎷ユ湁鑰呭彲浠ュ皢浠绘剰鐜╁寮冪墝鍫嗕腑鐨勪竴寮犲崱鏀惧埌璇ュ崱鎷ユ湁鑰呯殑鐗屽簱搴?
    // 绗竴姝ワ細閫夋嫨浠庡摢涓帺瀹剁殑寮冪墝鍫嗛€夊崱
    registerBaseAbility('base_innsmouth_base', 'onMinionPlayed', (ctx) => {
        const base = ctx.state.bases[ctx.baseIndex];
        const playedMinion = ctx.minionUid ? base?.minions.find(m => m.uid === ctx.minionUid) : undefined;
        const ownerId = playedMinion?.owner ?? ctx.playerId;

        // Infiltrate锛氬彧璁╂嫢鏈夎€呰嚜宸卞拷鐣ワ紙涓嶅奖鍝嶅叾浠栫帺瀹讹級
        const ignoredByOwner = base?.ongoingActions?.some(o =>
            o.ownerId === ownerId && o.defId.startsWith('ninja_infiltrate'),
        ) ?? false;
        if (ignoredByOwner) return { events: [] };

        // 鏀堕泦鏈夊純鐗屽爢鍗＄墝鐨勭帺瀹?
        const playersWithDiscard: string[] = [];
        for (const [pid, player] of Object.entries(ctx.state.players)) {
            if (player.discard.length > 0) {
                playersWithDiscard.push(pid);
            }
        }

        if (playersWithDiscard.length === 0) return { events: [] };

        const options = [
            { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
            ...playersWithDiscard.map((pid, i) => ({
                id: `player-${i}`,
                label: pid === ownerId ? '浣犺嚜宸辩殑寮冪墝鍫? : `${getPlayerLabel(pid)}鐨勫純鐗屽爢`,
                value: { targetPlayerId: pid },
            })),
        ];

        if (!ctx.matchState) return { events: [] };
        const interaction = createSimpleChoice(
            `base_innsmouth_base_choose_player_${ctx.now}`, ownerId,
            '鍗版柉鑼呮柉鍩哄湴锛氶€夋嫨浠庡摢涓帺瀹剁殑寮冪墝鍫嗛€夊崱', options,
            { sourceId: 'base_innsmouth_base_choose_player', targetType: 'player', autoCancelOption: true },
        );
        return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
    }, { mandatory: false });

    // 鈹€鈹€ 瀵嗘柉鍗℃墭灏煎厠澶у鍩哄湴锛圡iskatonic University Base锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "姣忓洖鍚堜竴娆★紝鍦ㄤ綘鎵撳嚭涓€涓殢浠庡埌杩欓噷鍚庯紝浣犲彲浠ユ姄涓ゅ紶鐤媯鍗★紝鎴栬€呬粠鎵嬬墝寮冪疆涓€寮犵柉鐙傚崱鏉ラ澶栨墦鍑轰竴寮犺鍔ㄣ€?
    registerBaseAbility('base_miskatonic_university_base', 'onMinionPlayed', (ctx) => {
        const player = ctx.state.players[ctx.playerId];
        if (!player || !ctx.matchState) return { events: [] };

        const playedAtBase = player.minionsPlayedPerBase?.[ctx.baseIndex] ?? 0;
        if (playedAtBase !== 1) return { events: [] };

        const canDrawMadness = (ctx.state.madnessDeck?.length ?? 0) > 0;
        const canDiscardMadness = player.hand.some(card => card.defId === MADNESS_CARD_DEF_ID);
        if (!canDrawMadness && !canDiscardMadness) return { events: [] };

        const options: PromptOption<Record<string, unknown>>[] = [];
        if (canDrawMadness) {
            options.push({
                id: 'draw',
                label: '鎶撲袱寮犵柉鐙傚崱',
                value: { choice: 'draw' },
                displayMode: 'button' as const,
            });
        }
        if (canDiscardMadness) {
            options.push({
                id: 'discard',
                label: '寮冧竴寮犵柉鐙傚崱骞堕澶栨墦鍑鸿鍔?,
                value: { choice: 'discard_for_action' },
                displayMode: 'button' as const,
            });
        }
        options.push({
            id: 'skip',
            label: '璺宠繃',
            value: { skip: true },
            displayMode: 'button' as const,
        });

        const interaction = createSimpleChoice(
            `base_miskatonic_university_base_${ctx.playerId}_${ctx.now}`, ctx.playerId,
            '闃垮崱濮嗗ぇ瀛︼細閫夋嫨瑕佹墽琛岀殑鏁堟灉',
            options,
            { sourceId: 'base_miskatonic_university_base', targetType: 'button' },
        );
        return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
    });

    // 鈹€鈹€ 鍐峰師楂樺湴锛圥lateau of Leng锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "姣忓洖鍚堢帺瀹剁涓€娆℃墦鍑轰竴涓殢浠庡埌杩欓噷鍚庯紝鍙互棰濆鎵撳嚭涓€寮犱笌鍏跺悓鍚嶇殑闅忎粠鍒拌繖閲?
    // 瀹炵幇锛氱洿鎺ユ巿浜堝悓鍚嶉殢浠庨搴︼紝鐜╁鍙互閫夋嫨浣曟椂浣跨敤
    registerBaseAbility('base_plateau_of_leng', 'onMinionPlayed', (ctx) => {
        if (!ctx.minionDefId) return { events: [] };
        
        const player = ctx.state.players[ctx.playerId];
        if (!player) return { events: [] };

        // 姣忓洖鍚堝彧鏈夌涓€娆℃墦鍑洪殢浠庡埌姝ゅ熀鍦版墠瑙﹀彂
        // reduce 宸叉墽琛岋紝minionsPlayedPerBase 鍖呭惈鍒氭墦鍑虹殑闅忎粠锛岄娆℃墦鍑烘椂鍊间负 1
        const playedAtBase = player.minionsPlayedPerBase?.[ctx.baseIndex] ?? 0;
        if (playedAtBase !== 1) return { events: [] };

        // 鐩存帴鎺堜簣1涓悓鍚嶉殢浠庨搴︼紝闄愬畾鍒版鍩哄湴
        return {
            events: [
                grantContextualExtraMinion(
                    ctx,
                    'base_plateau_of_leng',
                    ctx.baseIndex,
                    { sameNameOnly: true, sameNameDefId: ctx.minionDefId },
                ),
            ],
        };
    });

    // ============================================================================
    // AL9000 鎵╁睍鍩哄湴鑳藉姏
    // ============================================================================

    // 鈹€鈹€ 娓╁锛圙reenhouse锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄨ繖涓熀鍦拌鍒嗗悗锛屽啝鍐涘彲浠ヤ粠浠栫殑鐗屽簱涓悳瀵讳竴寮犻殢浠庡苟灏嗗畠鎵撳嚭鍒板皢鏇挎崲鏈熀鍦扮殑鍩哄湴涓婏級?
    registerBaseAbility('base_greenhouse', 'afterScoring', (ctx) => {
        if (!ctx.rankings || ctx.rankings.length === 0) return { events: [] };
        const winnerId = ctx.rankings[0].playerId;
        const winner = ctx.state.players[winnerId];
        if (!winner) return { events: [] };

        // 鎼滅储鍐犲啗鐗屽簱涓殑闅忎粠?
        const minionsInDeck = winner.deck.filter(c => c.type === 'minion');
        if (minionsInDeck.length === 0) return { events: [] };

        const options: PromptOption<Record<string, unknown>>[] = [
            { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
            ...minionsInDeck.map((c, i) => {
                const def = getMinionDef(c.defId);
                return {
                    id: `minion-${i}`,
                    label: `${def?.name ?? c.defId} (鍔涢噺${def?.power ?? '?'})`,
                    value: { cardUid: c.uid, defId: c.defId, power: def?.power ?? 0 },
                    _source: 'static' as const,
                    displayMode: 'card' as const,
                };
            }),
        ];

        if (!ctx.matchState) return { events: [] };
        const interaction = createSimpleChoice(
            `base_greenhouse_${ctx.now}`, winnerId,
            '娓╁锛氫粠鐗屽簱涓€夋嫨涓€涓殢浠庢墦鍑哄埌鏂板熀鍦?, options,
            { sourceId: 'base_greenhouse', targetType: 'generic' },
        );
        return {
            events: [],
            matchState: queueInteraction(ctx.matchState, {
                ...interaction,
                data: { ...interaction.data, continuationContext: { baseIndex: ctx.baseIndex } },
            }),
        };
    }, { mandatory: false });

    // 鈹€鈹€ 绁炵鑺卞洯锛圫ecret Garden锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄤ綘鐨勫洖鍚堬紝浣犲彲浠ラ澶栨墦鍑轰竴涓姏閲忎负2鎴栦互涓嬬殑闅忎粠鍒拌繖閲岋級?
    // 鍔涢噺鐨?闄愬埗閫氳繃 BaseCardDef.restrictions ?extraPlayMinionPowerMax 鏁版嵁椹卞姩瀹炵幇锛堝悓姣嶆槦妯″紡锛?
    registerBaseAbility('base_secret_garden', 'onTurnStart', (ctx) => {
        return {
            events: [grantContextualExtraMinion(ctx, '绁炵鑺卞洯锛氶澶栨墦鍑哄姏閲忊墹2鐨勯殢浠?, ctx.baseIndex)],
        };
    });

    // 鈹€鈹€ 鍙戞槑瀹舵矙榫欙紙Inventor's Salon锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄨ繖涓熀鍦拌鍒嗗悗锛屽啝鍐涘彲浠ヤ粠浠栫殑寮冪墝鍫嗕腑閫夊彇涓€寮犳垬鏈崱灏嗗叾缃叆浠栫殑鎵嬬墝鍫?
    registerBaseAbility('base_inventors_salon', 'afterScoring', (ctx) => {
        if (!ctx.rankings || ctx.rankings.length === 0) return { events: [] };
        const winnerId = ctx.rankings[0].playerId;
        const winner = ctx.state.players[winnerId];
        if (!winner) return { events: [] };

        // 鎼滅储鍐犲啗寮冪墝鍫嗕腑鐨勮鍔ㄥ崱
        const actionsInDiscard = winner.discard.filter(c => c.type === 'action');
        if (actionsInDiscard.length === 0) return { events: [] };

        const options: PromptOption<Record<string, unknown>>[] = [
            { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
            ...actionsInDiscard.map((c, i) => {
                const def = getCardDef(c.defId);
                return {
                    id: `action-${i}`,
                    label: def?.name ?? c.defId,
                    value: { cardUid: c.uid, defId: c.defId },
                    _source: 'discard' as const,
                    displayMode: 'card' as const,
                };
            }),
        ];

        if (!ctx.matchState) return { events: [] };
        const interaction = createSimpleChoice(
            `base_inventors_salon_${ctx.now}`, winnerId,
            '鍙戞槑瀹舵矙榫欙細浠庡純鐗屽爢閫夋嫨涓€寮犺鍔ㄥ崱鏀惧叆鎵嬬墝', options,
            { sourceId: 'base_inventors_salon', targetType: 'generic' },
        );
        return { events: [], matchState: queueInteraction(ctx.matchState, interaction) };
    });

    // ============================================================================
    // Pretty Pretty 鎵╁睍鍩哄湴鑳藉姏
    // ============================================================================

    // 鈹€鈹€ 璇＄尗宸凤紙Cat Fanciers' Alley锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "浣犵殑鍥炲悎涓竴娆★紝浣犲彲浠ユ秷鐏繖閲屼綘鐨勪竴涓殢浠庢潵鎶戒竴寮犲崱鐗?
    // talent 鑳藉姏锛歰nTurnStart 鐢熸垚 Prompt锛屾瘡鍥炲悎涓€娆★紙Prompt 娑堣垂鍗冲畬鎴愶級
    registerBaseAbility('base_cat_fanciers_alley', 'onTurnStart', (ctx) => {
        const base = ctx.state.bases[ctx.baseIndex];
        if (!base) return { events: [] };

        // 鏀堕泦褰撳墠鐜╁鍦ㄦ鍩哄湴鐨勯殢浠?
        const myMinions = base.minions.filter(m => m.controller === ctx.playerId);
        if (myMinions.length === 0) return { events: [] };

        const minionOptions = myMinions.map((m, i) => {
            const def = getCardDef(m.defId);
            return {
                id: `minion-${i}`,
                label: `${def?.name ?? m.defId} (鍔涢噺${getEffectivePower(ctx.state, m, ctx.baseIndex)})`,
                value: { minionUid: m.uid, minionDefId: m.defId, owner: m.owner },
                _source: 'field' as const,
                displayMode: 'card' as const,
            };
        });
        const options: PromptOption<Record<string, unknown>>[] = [
            { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
            ...minionOptions,
        ];

        if (!ctx.matchState) return { events: [] };
        const interaction = createSimpleChoice(
            `base_cat_fanciers_alley_${ctx.now}`, ctx.playerId,
            '璇＄尗宸凤細娑堢伃涓€涓繁鏂归殢浠庢潵鎶戒竴寮犲崱鐗?, options,
            { sourceId: 'base_cat_fanciers_alley', targetType: 'minion' },
        );
        return {
            events: [],
            matchState: queueInteraction(ctx.matchState, {
                ...interaction,
                data: { ...interaction.data, continuationContext: { baseIndex: ctx.baseIndex } },
            }),
        };
    });

    // 鈹€鈹€ 榄旀硶鏋楀湴锛圗nchanted Glade锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄤ竴涓帺瀹舵墦鍑轰竴寮犻檮鐫€琛屽姩鍗″埌杩欓噷鐨勪竴涓殢浠庝笂鍚庯紝璇ョ帺瀹舵娊涓€寮犲崱鐗?
    registerBaseAbility('base_enchanted_glade', 'onActionPlayed', (ctx) => {
        // 鍙湁闄勭潃鍒伴殢浠庣殑琛屽姩鍗℃墠瑙﹀彂锛坅ctionTargetMinionUid 鏈夊€硷級
        const actionTargetType = ctx.actionTargetType ?? (ctx.actionTargetMinionUid ? 'minion' : 'base');
        if (actionTargetType !== 'minion') return { events: [] };

        return { events: buildStandardDrawEvents(ctx.state, ctx.playerId, 1, ctx.random, ctx.now) };
    });

    // 鈹€鈹€ 浠欑伒涔嬬幆锛團airy Ring锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄤ竴涓帺瀹堕娆℃墦鍑轰竴涓殢浠庡埌杩欏悗锛岃鐜╁鍙互棰濆鎵撳嚭涓€涓殢浠庡拰涓€寮犺鍔ㄥ崱鐗?
    // 閫氳繃 minionsPlayedPerBase 杩借釜姣忓洖鍚堟瘡鍩哄湴鎵撳嚭娆℃暟锛宺educe 宸叉墽琛岋紝棣栨鎵撳嚭鏃跺€间负 1
    registerBaseAbility('base_fairy_ring', 'onMinionPlayed', (ctx) => {
        const player = ctx.state.players[ctx.playerId];
        if (!player) return { events: [] };

        // 姣忓洖鍚堝彧鏈夌涓€娆℃墦鍑洪殢浠庡埌姝ゅ熀鍦版墠瑙﹀彂
        // reduce 宸叉墽琛岋紝minionsPlayedPerBase 鍖呭惈鍒氭墦鍑虹殑闅忎粠锛岄娆℃墦鍑烘椂鍊间负 1
        const playedAtBase = player.minionsPlayedPerBase?.[ctx.baseIndex] ?? 0;
        if (playedAtBase !== 1) return { events: [] };

        return {
            events: [
                grantExtraMinion(ctx.playerId, '浠欑伒涔嬬幆锛氶娆℃墦鍑洪殢浠庡悗棰濆闅忎粠鏈轰細', ctx.now, ctx.baseIndex),
                grantExtraAction(ctx.playerId, '浠欑伒涔嬬幆锛氶娆℃墦鍑洪殢浠庡悗棰濆琛屽姩鏈轰細', ctx.now),
            ],
        };
    });

    // 鈹€鈹€ 骞宠　涔嬪湴锛圠and of Balance锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "鍦ㄤ竴涓帺瀹舵墦鍑轰竴涓殢浠庡埌杩欏悗锛岃鐜╁鍙互灏嗕粬鍦ㄥ叾浠栧熀鍦扮殑涓€涓殢浠庣Щ鍔ㄥ埌杩欓噷锛?
    registerBaseAbility('base_land_of_balance', 'onMinionPlayed', (ctx) => {
        const balanceBaseIndex = ctx.baseIndex;

        // 鏀堕泦璇ョ帺瀹跺湪鍏朵粬鍩哄湴鐨勯殢浠?
        const otherBaseMinions: { uid: string; defId: string; baseIndex: number; label: string }[] = [];
        for (let i = 0; i < ctx.state.bases.length; i++) {
            if (i === balanceBaseIndex) continue;
            const base = ctx.state.bases[i];
            const bDef = getBaseDef(base.defId);
            for (const m of base.minions) {
                if (m.controller !== ctx.playerId) continue;
                const def = getCardDef(m.defId);
                otherBaseMinions.push({
                    uid: m.uid,
                    defId: m.defId,
                    baseIndex: i,
                    label: `${def?.name ?? m.defId} (${bDef?.name ?? '鍩哄湴'}, 鍔涢噺${getEffectivePower(ctx.state, m, i)})`,
                });
            }
        }

        // 鏃犲叾浠栧熀鍦伴殢浠?涓嶇敓鎴?Prompt
        if (otherBaseMinions.length === 0) return { events: [] };

        const minionOptions = otherBaseMinions.map((m, i) => ({
            id: `minion-${i}`,
            label: m.label,
            value: { minionUid: m.uid, minionDefId: m.defId, fromBaseIndex: m.baseIndex },
            _source: 'field' as const,
            displayMode: 'card' as const,
        }));
        const options: PromptOption<Record<string, unknown>>[] = [
            { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
            ...minionOptions,
        ];

        if (!ctx.matchState) return { events: [] };
        const interaction = createSimpleChoice(
            `base_land_of_balance_${ctx.now}`, ctx.playerId,
            '骞宠　涔嬪湴锛氶€夋嫨涓€涓繁鏂归殢浠庣Щ鍔ㄥ埌杩欓噷', options,
            { sourceId: 'base_land_of_balance', targetType: 'minion' },
        );
        return {
            events: [],
            matchState: queueInteraction(ctx.matchState, {
                ...interaction,
                data: { ...interaction.data, continuationContext: { balanceBaseIndex } },
            }),
        };
    });

    // 鈹€鈹€ 涔濆懡涔嬪眿锛圚ouse of Nine Lives锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "褰撲綘鐨勪竴涓殢浠庡湪鍏朵粬鍩哄湴琚秷鐏椂锛屼綘鍙互灏嗗畠绉诲姩鍒拌繖閲?
    // 閫氳繃 registerTrigger(onMinionDestroyed) 娉ㄥ唽锛屽垱寤虹帺瀹堕€夋嫨浜や簰
    // processDestroyTriggers 鐨?pendingSaveMinionUids 鏈哄埗浼氭殏缂撴秷鐏簨浠?
    registerTrigger('base_house_of_nine_lives', 'onMinionDestroyed', (trigCtx) => {
        const { state, triggerMinionUid, triggerMinionDefId } = trigCtx;
        const baseIndex = trigCtx.baseIndex;
        if (trigCtx.reason === '涔濆懡涔嬪眿锛氱帺瀹堕€夋嫨涓嶆嫰鏁?) return [];
        if (!triggerMinionUid || !triggerMinionDefId || baseIndex === undefined) return [];

        // 鎵惧埌涔濆懡涔嬪眿鐨勫熀鍦扮储寮?
        let houseBaseIndex = -1;
        for (let i = 0; i < state.bases.length; i++) {
            if (state.bases[i].defId === 'base_house_of_nine_lives') {
                houseBaseIndex = i;
                break;
            }
        }
        // 涔濆懡涔嬪眿涓嶅湪鍦衡啋涓嶈Е鍙?
        if (houseBaseIndex === -1) return [];

        // 闅忎粠鍦ㄤ節鍛戒箣灞嬫湰韬娑堢伃鈫掍笉瑙﹀彂锛堝彧鎷︽埅鍏朵粬鍩哄湴锛?
        if (baseIndex === houseBaseIndex) return [];

        // 鏌ユ壘琚秷鐏殢浠庣殑鎷ユ湁鑰?
        const minion = state.bases[baseIndex]?.minions.find(m => m.uid === triggerMinionUid);
        const ownerId = minion?.owner ?? trigCtx.playerId;

        // 鍒涘缓鐜╁閫夋嫨浜や簰锛氱Щ鍔ㄥ埌涔濆懡涔嬪眿 or 姝ｅ父娑堢伃
        if (!trigCtx.matchState) return [];
        const interaction = createSimpleChoice(
            `nine_lives_${triggerMinionUid}_${trigCtx.now}`,
            ownerId,
            '涔濆懡涔嬪眿锛氭槸鍚﹀皢闅忎粠绉诲姩鍒颁節鍛戒箣灞嬶紵',
            [
                {
                    id: 'move',
                    label: '绉诲姩鍒颁節鍛戒箣灞?,
                    value: { move: true, minionUid: triggerMinionUid, minionDefId: triggerMinionDefId },
                    displayMode: 'button' as const,
                },
                { id: 'skip', label: '涓嶇Щ鍔紙姝ｅ父娑堢伃锛?, value: { move: false }, displayMode: 'button' as const },
            ],
            { sourceId: 'base_nine_lives_intercept', targetType: 'minion' },
        );
        const updatedMS = queueInteraction(trigCtx.matchState, {
            ...interaction,
            data: {
                ...interaction.data,
                continuationContext: {
                    minionUid: triggerMinionUid,
                    minionDefId: triggerMinionDefId,
                    fromBaseIndex: baseIndex,
                    houseBaseIndex,
                    ownerId,
                    destroyerId: trigCtx.destroyerId,
                },
            },
        });
        // 杩斿洖绌轰簨浠?+ 鏇存柊鍚庣殑 matchState锛坧rocessDestroyTriggers 妫€娴嬪埌 matchState 鍙樺寲 鈫?pendingSaveMinionUids锛?
        return { events: [], matchState: updatedMS };
    }, { phase: 'replacement' });

    // 鈹€鈹€ 琚姩淇濇姢绫诲熀鍦扳攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

    // 缇庝附鍩庡牎锛圔eautiful Castle锛夛細鍔涢噺鐨?鐨勯殢浠庡厤鐤秷鐏€佺Щ鍔ㄥ拰褰卞搷
    // 淇濇姢妫€鏌ユ椂鍔ㄦ€佹煡鎵剧編涓藉煄鍫＄殑鍩哄湴绱㈠紩锛岀‘淇濆彧淇濇姢璇ュ熀鍦颁笂鐨勯殢浠?
    const beautifulCastleChecker = (ctx: ProtectionCheckContext): boolean => {
        // 鍔ㄦ€佹煡鎵剧編涓藉煄鍫℃墍鍦ㄥ熀鍦扮储寮?
        const castleIndex = ctx.state.bases.findIndex(b => b.defId === 'base_beautiful_castle');
        if (castleIndex === -1) return false;
        // 鍙繚鎶ょ編涓藉煄鍫′笂鐨勯殢浠?
        if (ctx.targetBaseIndex !== castleIndex) return false;
        // 鍔涢噺鐨?鎵嶅彈淇濇姢
        const power = getEffectivePower(ctx.state, ctx.targetMinion, ctx.targetBaseIndex);
        return power >= 5;
    };
    registerProtection('base_beautiful_castle', 'destroy', beautifulCastleChecker);
    registerProtection('base_beautiful_castle', 'move', beautifulCastleChecker);
    registerProtection('base_beautiful_castle', 'affect', beautifulCastleChecker);

    // 鍗靛锛圗gg Chamber锛夛細杩欓噷鏈?+1 鍔涢噺鎸囩ず鐗╃殑闅忎粠涓嶈兘琚秷鐏?
    registerProtection('base_egg_chamber', 'destroy', (ctx: ProtectionCheckContext): boolean => {
        const eggIndex = ctx.state.bases.findIndex(b => b.defId === 'base_egg_chamber');
        if (eggIndex === -1) return false;
        if (ctx.targetBaseIndex !== eggIndex) return false;
        const eggBase = ctx.state.bases[eggIndex];
        // Infiltrate锛氳闅忎粠鎺у埗鑰呰嫢閫夋嫨蹇界暐锛屽垯鍏堕殢浠庝笉鍐嶅彈淇濇姢
        const ignored = eggBase.ongoingActions?.some(o =>
            o.ownerId === ctx.targetMinion.controller && o.defId.startsWith('ninja_infiltrate'),
        ) ?? false;
        if (ignored) return false;
        // 浠呪€?1 power counters鈥濓紙鍔涢噺鎸囩ず鐗╋級鎻愪緵淇濇姢
        return (ctx.targetMinion.powerCounters ?? 0) > 0;
    });

    // 灏忛┈涔愬洯锛圥ony Paradise锛夛細鎷ユ湁 2+ 闅忎粠鐨勭帺瀹讹紝鍏堕殢浠庡厤鐤秷鐏?
    // 淇濇姢妫€鏌ユ椂鍔ㄦ€佹煡鎵惧皬椹箰鍥殑鍩哄湴绱㈠紩锛屽苟缁熻璇ョ帺瀹跺湪姝ゅ熀鍦扮殑闅忎粠鏁伴噺
    registerProtection('base_pony_paradise', 'destroy', (ctx: ProtectionCheckContext): boolean => {
        // 鍔ㄦ€佹煡鎵惧皬椹箰鍥墍鍦ㄥ熀鍦扮储寮?
        const ponyIndex = ctx.state.bases.findIndex(b => b.defId === 'base_pony_paradise');
        if (ponyIndex === -1) return false;
        // 鍙繚鎶ゅ皬椹箰鍥笂鐨勯殢浠?
        if (ctx.targetBaseIndex !== ponyIndex) return false;
        // 缁熻璇ラ殢浠庢帶鍒惰€呭湪姝ゅ熀鍦扮殑闅忎粠鏁伴噺
        const base = ctx.state.bases[ponyIndex];
        const ownerMinionCount = base.minions.filter(m => m.controller === ctx.targetMinion.controller).length;
        return ownerMinionCount >= 2;
    });


    // ============================================================================
    // 缁电緤/鐗у満鎵╁睍鍩哄湴鑳藉姏
    // ============================================================================

    // 鈹€鈹€ 缁电緤绁炵ぞ锛圫heep Shrine锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "杩欏紶鍩哄湴鍏ュ満鍚庯紝姣忎綅鐜╁鍙互绉诲姩涓€涓粬浠殑闅忎粠鍒拌繖銆?
    // 閫氳繃 onBaseRevealed 鎵╁睍鏃舵満瑙﹀彂锛屽湪 scoreOneBase 涓?BASE_REPLACED 鍚庤皟鐢?
    registerExtendedBase('base_sheep_shrine', 'onBaseRevealed', (ctx) => {
        if (!ctx.matchState) return { events: [] };
        let ms = ctx.matchState;
        const turnOrder = ctx.state.turnOrder;

        for (const pid of turnOrder) {
            // 鏀堕泦璇ョ帺瀹跺湪鍏朵粬鍩哄湴鐨勯殢浠?
            const otherMinions: { uid: string; defId: string; baseIndex: number; label: string }[] = [];
            for (let i = 0; i < ctx.state.bases.length; i++) {
                if (i === ctx.baseIndex) continue;
                const base = ctx.state.bases[i];
                const bDef = getBaseDef(base.defId);
                for (const m of base.minions) {
                    if (m.controller !== pid) continue;
                    const def = getCardDef(m.defId);
                    otherMinions.push({
                        uid: m.uid,
                        defId: m.defId,
                        baseIndex: i,
                        label: `${def?.name ?? m.defId} (${bDef?.name ?? '鍩哄湴'}, 鍔涢噺${getEffectivePower(ctx.state, m, i)})`,
                    });
                }
            }
            if (otherMinions.length === 0) continue;

            const minionOptions = otherMinions.map((m, i) => ({
                id: `minion-${i}`,
                label: m.label,
                value: { minionUid: m.uid, minionDefId: m.defId, fromBaseIndex: m.baseIndex },
                _source: 'field' as const,
                displayMode: 'card' as const,
            }));
            const options: PromptOption<Record<string, unknown>>[] = [
                { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
                ...minionOptions,
            ];

            const interaction = createSimpleChoice(
                `base_sheep_shrine_${pid}_${ctx.now}`, pid,
                '缁电緤绁炵ぞ锛氶€夋嫨绉诲姩涓€涓繁鏂归殢浠庡埌姝ゅ熀鍦?, options,
                { sourceId: 'base_sheep_shrine', targetType: 'minion' },
            );
            ms = queueInteraction(ms, {
                ...interaction,
                data: { ...interaction.data, continuationContext: { targetBaseIndex: ctx.baseIndex } },
            });
        }

        return { events: [], matchState: ms };
    }, { mandatory: false });

    // 鈹€鈹€ 鐗у満锛圱he Pasture锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // "姣忓洖鍚堢帺瀹剁涓€娆＄Щ鍔ㄤ竴涓殢浠庡埌杩欓噷鍚庯紝绉诲姩鍙︿竴鍩哄湴鐨勪竴涓殢浠庡埌杩欍€?
    // 閫氳繃 onMinionMoved 鎵╁睍鏃舵満瑙﹀彂锛屽湪 processMoveTriggers 涓皟鐢?
    registerExtendedBase('base_the_pasture', 'onMinionMoved', (ctx) => {
        // 妫€鏌ユ槸鍚︿负鏈洖鍚堣鐜╁棣栨绉诲姩鍒版鍩哄湴
        // processMoveTriggers 鍦?execute 杩斿洖鍓嶈皟鐢紝reducer 灏氭湭澶勭悊 MINION_MOVED 浜嬩欢
        // 鎵€浠?moveCount === 0 琛ㄧず杩欐槸棣栨绉诲姩
        const moveCount = ctx.state.minionsMovedToBaseThisTurn?.[ctx.playerId]?.[ctx.baseIndex] ?? 0;
        if (moveCount > 0) return { events: [] };

        if (!ctx.matchState) return { events: [] };

        // 鏀堕泦鍏朵粬鍩哄湴涓婄殑鎵€鏈夐殢浠?
        const otherMinions: { uid: string; defId: string; baseIndex: number; label: string }[] = [];
        for (let i = 0; i < ctx.state.bases.length; i++) {
            if (i === ctx.baseIndex) continue;
            const base = ctx.state.bases[i];
            const bDef = getBaseDef(base.defId);
            for (const m of base.minions) {
                // 鎺掗櫎鍒氱Щ鍔ㄨ繃鏉ョ殑闅忎粠
                if (m.uid === ctx.minionUid) continue;
                const def = getCardDef(m.defId);
                otherMinions.push({
                    uid: m.uid,
                    defId: m.defId,
                    baseIndex: i,
                    label: `${def?.name ?? m.defId} (${bDef?.name ?? '鍩哄湴'}, 鍔涢噺${getEffectivePower(ctx.state, m, i)})`,
                });
            }
        }

        if (otherMinions.length === 0) return { events: [] };

        const minionOptions = otherMinions.map((m, i) => ({
            id: `minion-${i}`,
            label: m.label,
            value: { minionUid: m.uid, minionDefId: m.defId, fromBaseIndex: m.baseIndex },
            _source: 'field' as const,
            displayMode: 'card' as const,
        }));

        const interaction = createSimpleChoice(
            `base_the_pasture_${ctx.now}`, ctx.playerId,
            '鐗у満锛氶€夋嫨鍙︿竴鍩哄湴鐨勪竴涓殢浠庣Щ鍔ㄥ埌杩欓噷',
            minionOptions,
            { sourceId: 'base_the_pasture', targetType: 'minion' },
        );
        return {
            events: [],
            matchState: queueInteraction(ctx.matchState, {
                ...interaction,
                data: { ...interaction.data, continuationContext: { targetBaseIndex: ctx.baseIndex } },
            }),
        };
    });
}

// ============================================================================
// 鎵╁睍鍖呭熀鍦颁氦浜掕В鍐冲鐞嗗嚱鏁?
// ============================================================================

/** 娉ㄥ唽鎵╁睍鍖呭熀鍦拌兘鍔涚殑浜や簰瑙ｅ喅澶勭悊鍑芥暟 */
export function registerExpansionBaseInteractionHandlers(): void {

    // 鐤汉闄細鍏堥€夋墜鐗岋紝鍐嶉€夋嫨涓€涓嚜宸辩殑闅忎粠鏀剧疆 +1 鍔涢噺鎸囩ず鐗?
    registerInteractionHandler('base_the_asylum', (state, playerId, value, _iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; cardUid?: string; defId?: string };
        if (selected.skip) return { state, events: [] };

        const player = state.core.players[playerId];
        if (!player || !selected.cardUid || !selected.defId) return { state, events: [] };

        const boxedCard = player.hand.find(card => card.uid === selected.cardUid && card.defId === selected.defId);
        if (!boxedCard) return { state, events: [] };

        const minionOptions: PromptOption<Record<string, unknown>>[] = [];
        state.core.bases.forEach((base, baseIndex) => {
            const baseDef = getBaseDef(base.defId);
            base.minions
                .filter(minion => minion.controller === playerId)
                .forEach((minion, index) => {
                    const minionDef = getCardDef(minion.defId);
                    minionOptions.push({
                        id: `minion-${baseIndex}-${index}`,
                        label: `${minionDef?.name ?? minion.defId} (${baseDef?.name ?? '鍩哄湴'})`,
                        value: { minionUid: minion.uid, baseIndex },
                        _source: 'field' as const,
                        displayMode: 'card' as const,
                    });
                });
        });

        if (minionOptions.length === 0) return { state, events: [] };

        const interaction = createSimpleChoice(
            `base_the_asylum_choose_minion_${timestamp}`, playerId,
            '鐤汉闄細閫夋嫨浣犵殑涓€涓殢浠庢斁缃?+1 鍔涢噺鎸囩ず鐗?,
            minionOptions,
            { sourceId: 'base_the_asylum_choose_minion', targetType: 'minion' },
        );

        return {
            state: queueInteraction(state, {
                ...interaction,
                data: {
                    ...interaction.data,
                    continuationContext: {
                        cardUid: boxedCard.uid,
                        defId: boxedCard.defId,
                    },
                },
            }, { urgent: true }),
            events: [],
        };
    });

    registerInteractionHandler('base_the_asylum_choose_minion', (state, playerId, value, iData, _random, timestamp) => {
        const selected = value as { minionUid?: string; baseIndex?: number };
        const ctx = getContinuationContext<{ cardUid: string; defId: string }>(iData);
        if (!ctx || !ctx.cardUid || !ctx.defId || !selected.minionUid || selected.baseIndex === undefined) {
            return { state, events: [] };
        }

        const player = state.core.players[playerId];
        const boxedCard = player?.hand.find(card => card.uid === ctx.cardUid && card.defId === ctx.defId);
        if (!boxedCard) return { state, events: [] };

        const target = findMinionOnBases(state.core, selected.minionUid);
        if (!target || target.baseIndex !== selected.baseIndex || target.minion.controller !== playerId) {
            return { state, events: [] };
        }

        return {
            state,
            events: [
                {
                    type: SU_EVENTS.CARD_BOXED,
                    payload: {
                        playerId,
                        cardUid: boxedCard.uid,
                        defId: boxedCard.defId,
                        from: 'hand',
                        reason: 'base_the_asylum',
                    },
                    timestamp,
                } as SmashUpEvent,
                {
                    type: SU_EVENTS.POWER_COUNTER_ADDED,
                    payload: {
                        minionUid: target.minion.uid,
                        baseIndex: target.baseIndex,
                        amount: 1,
                        reason: 'base_the_asylum',
                    },
                    timestamp,
                } as SmashUpEvent,
            ],
        };
    });

    // 鍗版柉鑼呮柉鍩哄湴绗竴姝ワ細閫夋嫨鐜╁鍚庯紝鍒涘缓绗簩姝ヤ氦浜掞紙閫夋嫨鍗＄墝锛?
    registerInteractionHandler('base_innsmouth_base_choose_player', (state, playerId, value, _iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; targetPlayerId?: string };
        if (selected.skip) return { state, events: [] };

        const targetPlayerId = selected.targetPlayerId!;
        const targetPlayer = state.core.players[targetPlayerId];
        if (!targetPlayer || targetPlayer.discard.length === 0) {
            return { state, events: [] };
        }

        // 鍒涘缓绗簩姝ヤ氦浜掞細浠庤鐜╁鐨勫純鐗屽爢閫夋嫨鍗＄墝
        const discardCards = targetPlayer.discard.map((c, i) => {
            const def = getCardDef(c.defId);
            return {
                id: `card-${i}`,
                label: def?.name ?? c.defId,
                value: { cardUid: c.uid, defId: c.defId, ownerId: targetPlayerId },
                _source: 'discard' as const,
                displayMode: 'card' as const,
            };
        });

        const options = [
            { id: 'skip', label: '璺宠繃', value: { skip: true }, displayMode: 'button' as const },
            ...discardCards,
        ];

        const interaction = createSimpleChoice(
            `base_innsmouth_base_choose_card_${timestamp}`, playerId,
            `鍗版柉鑼呮柉鍩哄湴锛氫粠${targetPlayerId === playerId ? '浣犵殑' : getPlayerLabel(targetPlayerId) + '鐨?}寮冪墝鍫嗛€夋嫨涓€寮犲崱`,
            options,
            { sourceId: 'base_innsmouth_base_choose_card', targetType: 'generic', autoCancelOption: true },
        );

        return { state: queueInteraction(state, interaction), events: [] };
    });

    // 鍗版柉鑼呮柉鍩哄湴绗簩姝ワ細閫夋嫨鍗＄墝鍚庯紝鏀惧叆鐗屽簱搴?
    registerInteractionHandler('base_innsmouth_base_choose_card', (state, _playerId, value, _iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; cardUid?: string; defId?: string; ownerId?: string };
        if (selected.skip) return { state, events: [] };
        return {
            state,
            events: buildValidatedCardToDeckBottomEvents(state, {
                cardUid: selected.cardUid!,
                defId: selected.defId!,
                ownerId: selected.ownerId!,
                reason: '鍗版柉鑼呮柉鍩哄湴锛氬純鐗屽爢鍗℃斁鍏ョ墝搴撳簳',
                now: timestamp,
                expectedLocation: 'discard',
            }),
        };
    });

    // 瀵嗗ぇ鍩哄湴锛氭墦鍑洪殢浠庡悗锛岄€夋嫨鎶撶柉鐙傛垨寮冪柉鐙傛崲棰濆琛屽姩
    registerInteractionHandler('base_miskatonic_university_base', (state, playerId, value, _iData, _random, timestamp) => {
        const selected = value as {
            skip?: boolean;
            choice?: 'draw' | 'discard_for_action';
        };
        if (selected.skip) return { state, events: [] };

        if (selected.choice === 'draw') {
            const drawEvent = drawMadnessCards(playerId, 2, state.core, 'base_miskatonic_university_base', timestamp);
            return { state, events: drawEvent ? [drawEvent] : [] };
        }

        if (selected.choice === 'discard_for_action') {
            const player = state.core.players[playerId];
            const madnessCard = player?.hand.find(card => card.defId === MADNESS_CARD_DEF_ID);
            if (!player || !madnessCard) return { state, events: [] };
            return {
                state,
                events: [
                    {
                        type: SU_EVENTS.CARDS_DISCARDED,
                        payload: { playerId, cardUids: [madnessCard.uid] },
                        timestamp,
                    } as SmashUpEvent,
                    grantExtraAction(playerId, 'base_miskatonic_university_base', timestamp),
                ],
            };
        }

        return { state, events: [] };
    });

    registerInteractionHandler('base_greenhouse', (state, playerId, value, iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; cardUid?: string; defId?: string; power?: number };
        if (selected.skip) return { state, events: [] };
        const ctx = getContinuationContext<{ baseIndex: number }>(iData);
        if (!ctx) return { state, events: [] };
        const player = state.core.players[playerId];
        if (!player || !selected.cardUid || !selected.defId) return { state, events: [] };
        const cardInDeck = player.deck.some(card =>
            card.uid === selected.cardUid
            && card.defId === selected.defId
            && card.type === 'minion',
        );
        if (!cardInDeck) return { state, events: [] };
        const power = selected.power ?? (getMinionDef(selected.defId!)?.power ?? 0);
        const deferredEvents = (getDeferredPostScoringEvents(state, iData) ?? []) as Array<{
            type: string;
            payload?: { newBaseDefId?: string };
            timestamp: number;
        }>;
        const replacementBaseDefId = getDeferredReplacementBaseDefId(state, iData)
            ?? state.core.bases[ctx.baseIndex]?.defId;
        if (!replacementBaseDefId) return { state, events: [] };
        if (deferredEvents.length > 0) {
            const pendingAction: PendingPostScoringAction = {
                kind: 'playMinionOnReplacementBase',
                playerId,
                cardUid: selected.cardUid,
                defId: selected.defId,
                baseIndex: ctx.baseIndex,
                targetBaseDefId: replacementBaseDefId,
                power,
            };
            const compatibility = mergeDeferredPostScoringCompatibility(state, iData, timestamp, {
                primaryOrder: 'before',
                extraPendingActions: [pendingAction],
            });
            if (compatibility) {
                return compatibility;
            }
            return {
                state: appendPendingPostScoringActions(state, [pendingAction]),
                events: [],
            };
        }
        const playedEvt: MinionPlayedEvent = {
            type: SU_EVENTS.MINION_PLAYED,
            payload: {
                playerId,
                cardUid: selected.cardUid,
                defId: selected.defId,
                baseIndex: ctx.baseIndex,
                baseDefId: replacementBaseDefId,
                power,
                fromDeck: true,
                consumesNormalLimit: false,
            },
            timestamp,
        };
        return { state, events: [playedEvt] };
    });

    registerInteractionHandler('base_inventors_salon', (state, playerId, value, _iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; cardUid?: string };
        if (selected.skip) return { state, events: [] };
        const player = state.core.players[playerId];
        if (!player || !selected.cardUid) return { state, events: [] };
        const cardInDiscard = player.discard.some(card =>
            card.uid === selected.cardUid
            && card.type === 'action',
        );
        if (!cardInDiscard) return { state, events: [] };
        return { state, events: [recoverCardsFromDiscard(playerId, [selected.cardUid!], '鍙戞槑瀹舵矙榫欙細浠庡純鐗屽爢鍙栧洖琛屽姩鍗?, timestamp)] };
    });

    registerInteractionHandler('base_cat_fanciers_alley', (state, playerId, value, iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; minionUid?: string; minionDefId?: string; owner?: string };
        if (selected.skip) return { state, events: [] };
        const ctx = getContinuationContext<{ baseIndex: number }>(iData);
        if (!ctx) return { state, events: [] };
        const events: SmashUpEvent[] = buildValidatedDestroyEvents(state, {
            minionUid: selected.minionUid!,
            minionDefId: selected.minionDefId!,
            fromBaseIndex: ctx.baseIndex,
            reason: '璇＄尗宸凤細娑堢伃宸辨柟闅忎粠',
            now: timestamp,
        });
        if (events.length === 0) return { state, events };
        events.push(...buildStandardDrawEvents(state.core, playerId, 1, _random, timestamp));
        return { state, events };
    });

    registerInteractionHandler('base_land_of_balance', (state, _playerId, value, iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; minionUid?: string; minionDefId?: string; fromBaseIndex?: number };
        if (selected.skip) return { state, events: [] };
        const ctx = getContinuationContext<{ balanceBaseIndex: number }>(iData);
        if (!ctx) return { state, events: [] };
        return {
            state,
            events: buildValidatedMoveEvents(state, {
                minionUid: selected.minionUid!,
                minionDefId: selected.minionDefId!,
                fromBaseIndex: selected.fromBaseIndex!,
                toBaseIndex: ctx.balanceBaseIndex,
                reason: '骞宠　涔嬪湴锛氱Щ鍔ㄥ繁鏂归殢浠庡埌姝?,
                now: timestamp,
            }),
        };
    });

    // 缁电緤绁炵ぞ锛氱Щ鍔ㄥ繁鏂归殢浠庡埌姝ゅ熀鍦?
    registerInteractionHandler('base_sheep_shrine', (state, _playerId, value, iData, _random, timestamp) => {
        const selected = value as { skip?: boolean; minionUid?: string; minionDefId?: string; fromBaseIndex?: number };
        if (selected.skip) return { state, events: [] };
        const ctx = getContinuationContext<{ targetBaseIndex: number }>(iData);
        if (!ctx) return { state, events: [] };
        return {
            state,
            events: buildValidatedMoveEvents(state, {
                minionUid: selected.minionUid!,
                minionDefId: selected.minionDefId!,
                fromBaseIndex: selected.fromBaseIndex!,
                toBaseIndex: ctx.targetBaseIndex,
                reason: '缁电緤绁炵ぞ锛氱Щ鍔ㄩ殢浠庡埌鏂板熀鍦?,
                now: timestamp,
            }),
        };
    });

    // 鐗у満锛氱Щ鍔ㄥ彟涓€鍩哄湴鐨勯殢浠庡埌杩欓噷
    registerInteractionHandler('base_the_pasture', (state, _playerId, value, iData, _random, timestamp) => {
        const selected = value as { minionUid?: string; minionDefId?: string; fromBaseIndex?: number };
        const ctx = getContinuationContext<{ targetBaseIndex: number }>(iData);
        if (!ctx) return { state, events: [] };
        return {
            state,
            events: buildValidatedMoveEvents(state, {
                minionUid: selected.minionUid!,
                minionDefId: selected.minionDefId!,
                fromBaseIndex: selected.fromBaseIndex!,
                toBaseIndex: ctx.targetBaseIndex,
                reason: '鐗у満锛氱Щ鍔ㄩ殢浠庡埌鐗у満',
                now: timestamp,
            }),
        };
    });

    // 涔濆懡涔嬪眿锛氱帺瀹堕€夋嫨鏄惁灏嗛殢浠庣Щ鍔ㄥ埌涔濆懡涔嬪眿
    registerInteractionHandler('base_nine_lives_intercept', (state, playerId, value, iData, _random, timestamp) => {
        const selected = value as {
            move: boolean;
            minionUid?: string;
            minionDefId?: string;
            fromBaseIndex?: number;
            houseBaseIndex?: number;
            ownerId?: string;
            destroyerId?: string;
        };
        const ctx = getContinuationContext<{
            minionUid?: string;
            minionDefId?: string;
            fromBaseIndex?: number;
            houseBaseIndex?: number;
            ownerId?: string;
            destroyerId?: string;
        }>(iData);
        const minionUid = selected.minionUid ?? ctx?.minionUid;
        const minionDefId = selected.minionDefId ?? ctx?.minionDefId;
        const fromBaseIndex = selected.fromBaseIndex ?? ctx?.fromBaseIndex;
        const houseBaseIndex = selected.houseBaseIndex ?? ctx?.houseBaseIndex;
        const ownerId = selected.ownerId ?? ctx?.ownerId ?? playerId;
        const destroyerId = selected.destroyerId ?? ctx?.destroyerId;

        if (!minionUid || !minionDefId || fromBaseIndex === undefined) return { state, events: [] };

        if (selected.move && houseBaseIndex !== undefined) {
            // 鐜╁閫夋嫨绉诲姩鍒颁節鍛戒箣灞?
            return {
                state,
                events: buildValidatedMoveEvents(state, {
                    minionUid,
                    minionDefId,
                    fromBaseIndex,
                    toBaseIndex: houseBaseIndex,
                    reason: '涔濆懡涔嬪眿锛氶殢浠庣Щ鍔ㄥ埌涔濆懡涔嬪眿鑰岄潪琚秷鐏?,
                    now: timestamp,
                }),
            };
        } else {
            // 鐜╁閫夋嫨涓嶇Щ鍔ㄢ啋鎭㈠娑堢伃浜嬩欢
            return { state, events: [{
                type: SU_EVENTS.MINION_DESTROYED,
                payload: {
                    minionUid,
                    minionDefId,
                    fromBaseIndex,
                    ownerId,
                    destroyerId,
                    reason: '涔濆懡涔嬪眿锛氱帺瀹堕€夋嫨涓嶆嫰鏁?,
                },
                timestamp,
            } as MinionDestroyedEvent] };
        }
    });
}
