/**
 * 泰坦区域组件
 * 
 * 显示玩家的泰坦卡（未出场的泰坦在 titanZone 中，已出场的泰坦在基地上）
 * 
 * 设计理念：
 * - 紧凑布局：横向排列，最小化占用空间
 * - 快速识别：小卡牌 + 悬停放大
 * - 不遮挡视野：固定在右上角，半透明背景
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TitanCard } from '../domain/types';
import { CardPreview } from '../../../components/common/media/CardPreview';
import { getTitanDef } from '../data/titans';
import { useTranslation } from 'react-i18next';

// 辅助函数：获取能力翻译信息
const getAbilityInfo = (id: string, t: any) => {
    const name = t(`cards.${id}.name`, t(`titans.${id}.name`, id));
    const description = t(`cards.${id}.abilityText`, t(`titans.${id}.abilityText`, t(`cards.${id}.effectText`, '能力描述尚未实现')));
    return { name, description };
};

interface TitanZoneProps {
    /** 泰坦卡列表（未出场的泰坦） */
    titanZone: TitanCard[];
    /** 是否是当前玩家 */
    isCurrentPlayer: boolean;
    /** 点击泰坦卡的回调（用于出场交互） */
    onTitanClick?: (titanUid: string) => void;
    /** 当前选中的泰坦 UID（用于高亮显示） */
    selectedTitanUid?: string | null;
    /** 交互驱动的卡牌选择高亮判定 */
    isSelectHighlighted?: (titanUid: string) => boolean;
    /** 放大查看回调 */
    onMagnify?: (defId: string) => void;
}

export const TitanZone: React.FC<TitanZoneProps> = ({
    titanZone,
    isCurrentPlayer,
    onTitanClick,
    selectedTitanUid,
    isSelectHighlighted,
    onMagnify,
}) => {
    const { t } = useTranslation('game-smashup');
    const [hoveredTitanUid, setHoveredTitanUid] = useState<string | null>(null);

    if (titanZone.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-2"
        >
            {/* 标题栏 */}
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/60 backdrop-blur-sm rounded-lg border border-amber-500/30">
                <span className="text-amber-400 text-xs font-bold">⚔️</span>
                <span className="text-amber-200 text-xs font-bold uppercase tracking-wider">
                    {t('ui.titanZone', '泰坦')}
                </span>
                <span className="ml-auto text-amber-400 text-xs font-mono font-bold">
                    {titanZone.length}
                </span>
            </div>

            {/* 泰坦卡列表 - 紧凑横向排列 */}
            <div className="flex gap-2">
                {titanZone.map((titan, index) => {
                    const def = getTitanDef(titan.defId);
                    const canClick = isCurrentPlayer && onTitanClick;
                    const isSelected = selectedTitanUid === titan.uid;
                    const isHighlighted = isSelected || (isSelectHighlighted && isSelectHighlighted(titan.uid));
                    const isHovered = hoveredTitanUid === titan.uid;

                    return (
                        <motion.div
                            key={titan.uid}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative group"
                        >
                            {/* 小卡牌 */}
                            <motion.div
                                className={`
                                    relative w-16 h-22 rounded-lg overflow-hidden
                                    border-2 transition-all duration-200
                                    ${isHighlighted
                                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/50'
                                        : 'border-white/20 hover:border-amber-500/50'
                                    }
                                    ${canClick ? 'cursor-pointer' : 'cursor-default'}
                                `}
                                onClick={canClick ? () => onTitanClick(titan.uid) : undefined}
                                onMouseEnter={() => setHoveredTitanUid(titan.uid)}
                                onMouseLeave={() => setHoveredTitanUid(null)}
                                whileHover={canClick ? { scale: 1.05, y: -2 } : {}}
                                whileTap={canClick ? { scale: 0.95 } : {}}
                            >
                                <CardPreview
                                    previewRef={def?.previewRef}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* 放大镜按钮 - hover 时显示 */}
                                {onMagnify && def && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onMagnify(titan.defId); }}
                                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 hover:bg-amber-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-[opacity,background-color] duration-200 shadow-lg border border-white/20 z-30 cursor-zoom-in"
                                    >
                                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                                
                                {/* 选中标识 */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border border-white"
                                        >
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* 悬停放大预览 */}
                            <AnimatePresence>
                                {isHovered && def && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-0 top-full mt-2 z-50 pointer-events-none"
                                    >
                                        {/* 放大的卡牌 */}
                                        <div className="relative w-48 h-64 rounded-xl overflow-hidden border-2 border-amber-400 shadow-2xl">
                                            <CardPreview
                                                previewRef={def.previewRef}
                                                className="w-full h-full object-cover"
                                            />
                                            
                                            {/* 底部信息栏 */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent p-3 pt-8">
                                                <div className="text-amber-400 text-sm font-black uppercase tracking-tight mb-1">
                                                    {def.name}
                                                </div>
                                                <div className="space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
                                                    {def.abilities.slice(0, 2).map((abilityId, idx) => {
                                                        const abilityDef = getAbilityInfo(abilityId, t);
                                                        return (
                                                            <div key={idx} className="text-[9px] text-white/80 leading-tight">
                                                                <span className="text-amber-300 font-bold">{abilityDef.name}:</span>{' '}
                                                                {abilityDef.description.slice(0, 60)}...
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* 底部提示（仅在可交互时显示） */}
            {isCurrentPlayer && onTitanClick && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded border border-amber-500/20"
                >
                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] text-amber-200/80 font-medium uppercase tracking-wide">
                        {t('ui.titanZoneHint', '点击出场')}
                    </span>
                </motion.div>
            )}
        </motion.div>
    );
};
