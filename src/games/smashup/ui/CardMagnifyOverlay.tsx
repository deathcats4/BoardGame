/**
 * 大杀四方 - 卡牌放大预览覆盖层
 *
 * 通用组件，供 Board / FactionSelection / PromptOverlay 等复用。
 * 基于 MagnifyOverlay 通用壳 + SmashUp 卡牌数据。
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyOverlay } from '../../../components/common/overlays/MagnifyOverlay';
import { CardPreview } from '../../../components/common/media/CardPreview';
import { getCardDef, getBaseDef, resolveCardName, resolveCardText } from '../data/cards';
import { getTitanDef } from '../data/titans';

export interface CardMagnifyTarget {
    defId: string;
    type: 'minion' | 'base' | 'action' | 'titan';
}

interface Props {
    target: CardMagnifyTarget | null;
    onClose: () => void;
}

export const CardMagnifyOverlay: React.FC<Props> = ({ target, onClose }) => {
    const { t } = useTranslation('game-smashup');
    if (!target) return null;

    // 根据类型获取卡牌定义
    let def: any;
    let resolvedName: string;
    let resolvedText: string;
    let isBase = false;
    let isTitan = false;

    if (target.type === 'titan') {
        // 泰坦卡
        def = getTitanDef(target.defId);
        isTitan = true;
        resolvedName = def?.name || target.defId;
        // 泰坦的能力描述从 i18n 获取
        resolvedText = '';
    } else if (target.type === 'base') {
        // 基地卡
        def = getBaseDef(target.defId);
        isBase = true;
        resolvedName = resolveCardName(def, t) || target.defId;
        resolvedText = resolveCardText(def, t);
    } else {
        // 普通卡牌（随从/行动）
        def = getCardDef(target.defId);
        resolvedName = resolveCardName(def, t) || target.defId;
        resolvedText = resolveCardText(def, t);
    }

    if (!def) return null;

    return (
        <MagnifyOverlay isOpen onClose={onClose}>
            <div
                className={`relative bg-transparent ${
                    isBase 
                        ? 'w-[40vw] max-w-[600px] aspect-[1.43]' 
                        : isTitan
                        ? 'w-[30vw] max-w-[500px]'
                        : 'w-[25vw] max-w-[400px] aspect-[0.714]'
                }`}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 bg-white text-black rounded-full w-8 h-8 font-black border-2 border-black z-50 hover:scale-110 transition-transform"
                >
                    X
                </button>

                {isTitan ? (
                    // 泰坦卡片：英文图片 + 中文能力覆盖层
                    <div className="relative">
                        {/* 英文图片 */}
                        <div className="w-full aspect-[0.714] overflow-hidden rounded-xl shadow-2xl">
                            <CardPreview
                                previewRef={def.previewRef}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* 中文能力覆盖层 */}
                        <div className="mt-4 bg-slate-900/95 backdrop-blur-md rounded-xl border-2 border-amber-400 p-6 space-y-4">
                            {/* 泰坦名称 */}
                            <div className="text-amber-400 text-2xl font-black uppercase tracking-tight text-center">
                                {resolvedName}
                            </div>

                            {/* 能力列表 */}
                            <div className="space-y-3">
                                {def.abilities.map((abilityId: string, idx: number) => {
                                    const abilityName = t(`cards.${abilityId}.name`, t(`titans.${abilityId}.name`, abilityId));
                                    const abilityText = t(
                                        `cards.${abilityId}.abilityText`,
                                        t(`titans.${abilityId}.abilityText`, t(`cards.${abilityId}.effectText`, '能力描述尚未实现'))
                                    );
                                    return (
                                        <div key={idx} className="text-base text-white/90 leading-relaxed">
                                            <span className="text-amber-300 font-bold">{abilityName}:</span>{' '}
                                            <span className="text-white/80">{abilityText}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    // 普通卡牌和基地
                    <>
                        <CardPreview
                            previewRef={def.previewRef
                                ? { type: 'renderer', rendererId: 'smashup-card-renderer', payload: { defId: target.defId } }
                                : undefined}
                            className="w-full h-full rounded-xl shadow-2xl"
                            title={resolvedName}
                        />
                        {!def.previewRef && (
                            <div className="absolute inset-0 bg-white rounded-xl p-6 border-4 border-slate-800 flex flex-col items-center justify-center text-center">
                                <h2 className="text-3xl font-black uppercase mb-4">{resolvedName}</h2>
                                <p className="font-mono text-lg">{resolvedText}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </MagnifyOverlay>
    );
};
