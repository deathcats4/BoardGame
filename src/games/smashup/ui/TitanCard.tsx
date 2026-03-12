/**
 * TitanCard 组件
 * 
 * 显示场上的泰坦卡（已出场的泰坦在基地上）
 * 
 * 设计理念：
 * - 清晰展示：泰坦卡片大小适中，能清晰看到图片和关键信息
 * - 控制权标识：通过边框颜色和朝向区分己方/对手的泰坦
 * - 力量指示物：右上角显示 +1 力量指示物数量
 * - 悬停详情：悬停时显示完整的能力描述
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ActiveTitan, SmashUpCore } from '../domain/types';
import { CardPreview } from '../../../components/common/media/CardPreview';
import { getTitanDef } from '../data/titans';
import { PLAYER_CONFIG } from './playerConfig';

// 辅助函数：获取能力翻译信息
const getAbilityInfo = (id: string, t: any) => {
    const name = t(`cards.${id}.name`, t(`titans.${id}.name`, id));
    const description = t(`cards.${id}.abilityText`, t(`titans.${id}.abilityText`, t(`cards.${id}.effectText`, '能力描述尚未实现')));
    return { name, description };
};

interface TitanCardProps {
    /** 泰坦状态数据 */
    titan: ActiveTitan;
    /** 泰坦所有者 ID */
    ownerId: string;
    /** 当前玩家 ID */
    currentPlayerId: string;
    /** 游戏核心状态（用于查询泰坦卡牌数据） */
    core: SmashUpCore;
    /** 是否可点击（用于移动泰坦） */
    clickable?: boolean;
    /** 是否被选中（移动模式） */
    isSelected?: boolean;
    /** 点击回调 */
    onClick?: () => void;
    /** 放大查看回调 */
    onMagnify?: () => void;
    /** 卡片宽度（vw），来自 layoutConfig.titanCardWidth，未传则默认 4 */
    widthVw?: number;
}

const DEFAULT_TITAN_WIDTH_VW = 4;

export const TitanCard: React.FC<TitanCardProps> = ({
    titan,
    ownerId,
    currentPlayerId,
    core,
    clickable = false,
    isSelected = false,
    onClick,
    onMagnify,
    widthVw = DEFAULT_TITAN_WIDTH_VW,
}) => {
    const { t } = useTranslation('game-smashup');
    const [isHovered, setIsHovered] = useState(false);

    // 直接从 titan.defId 获取泰坦定义 ID
    let titanDefId = titan.defId;
    let def = titanDefId ? getTitanDef(titanDefId) : null;

    // 向后兼容：如果 defId 缺失（旧存档），尝试从玩家派系推断
    if (!def) {
        const player = core.players[ownerId];
        const factionId = player?.factions?.[0] || player?.factions?.[1];
        const fallbackDefId = factionId ? `titan_${factionId}` : null;
        if (fallbackDefId) {
            titanDefId = fallbackDefId;
            def = getTitanDef(fallbackDefId);
        }
    }

    const isMyTitan = ownerId === currentPlayerId;
    const pConf = PLAYER_CONFIG[parseInt(ownerId) % PLAYER_CONFIG.length];

    const heightVw = widthVw / 0.714;

    if (!def) {
        // 完全无法获取定义，显示占位符
        return (
            <div
                className="bg-slate-700 rounded-lg border-2 border-slate-500 flex items-center justify-center"
                style={{ width: `${widthVw}vw`, height: `${heightVw}vw` }}
            >
                <span className="text-white text-[0.6vw]">?</span>
            </div>
        );
    }

    return (
        <motion.div
            className="relative group/titan"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {/* 泰坦卡片 */}
            <motion.div
                className={`
                    relative rounded-lg overflow-hidden
                    border-[0.15vw] transition-all duration-200
                    ${isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/50 scale-110'
                        : `${pConf.border} ${pConf.shadow}`
                    }
                    ${clickable ? 'cursor-pointer hover:scale-110 hover:-translate-y-[0.3vw]' : 'cursor-default'}
                    ${!isMyTitan ? 'transform rotate-180' : ''}
                `}
                style={{ width: `${widthVw}vw`, height: `${heightVw}vw` }}
                onClick={clickable ? onClick : undefined}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={clickable ? { scale: 1.15, y: -4 } : {}}
                whileTap={clickable ? { scale: 1.05 } : {}}
            >
                <CardPreview
                    previewRef={def.previewRef}
                    className="w-full h-full object-cover"
                />

                {/* 放大镜按钮 - hover 时显示 */}
                {onMagnify && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMagnify(); }}
                        className="absolute top-[0.6vw] right-[0.6vw] w-[1.6vw] h-[1.6vw] flex items-center justify-center bg-black/60 hover:bg-amber-500/80 text-white rounded-full opacity-0 group-hover/titan:opacity-100 transition-[opacity,background-color] duration-200 shadow-lg border border-white/20 z-30 cursor-zoom-in"
                    >
                        <svg className="w-[0.9vw] h-[0.9vw] fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}

                {/* 力量指示物 */}
                {titan.powerTokens > 0 && (
                    <motion.div
                        className="absolute -top-[0.4vw] -right-[0.4vw] min-w-[1.2vw] h-[1.2vw] rounded-full
                            bg-gradient-to-br from-amber-300 to-amber-500 
                            border-[0.12vw] border-white shadow-lg
                            flex items-center justify-center z-30 px-[0.1vw]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        <span className="text-[0.6vw] font-black text-amber-900">
                            +{titan.powerTokens}
                        </span>
                    </motion.div>
                )}

                {/* 选中标识 */}
                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute top-[0.3vw] left-[0.3vw] w-[0.8vw] h-[0.8vw] 
                                bg-amber-500 rounded-full flex items-center justify-center 
                                shadow-lg border-[0.08vw] border-white z-30"
                        >
                            <svg className="w-[0.5vw] h-[0.5vw] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 可点击提示（悬停时显示） */}
                {clickable && isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] 
                            flex items-center justify-center z-20 pointer-events-none"
                    >
                        <span className="text-white text-[0.5vw] font-bold uppercase tracking-wide">
                            {t('ui.click_to_interact', '点击交互')}
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* 悬停详情面板 */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${isMyTitan ? 'left-0 top-full mt-2' : 'left-0 bottom-full mb-2'} z-50 pointer-events-none`}
                    >
                        {/* 放大的卡牌 + 能力描述 */}
                        <div className="relative w-[12vw] bg-slate-900/95 backdrop-blur-md rounded-xl 
                            border-2 border-amber-400 shadow-2xl overflow-hidden">
                            {/* 卡牌图片 */}
                            <div className="w-full aspect-[0.714] overflow-hidden">
                                <CardPreview
                                    previewRef={def.previewRef}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* 信息栏 */}
                            <div className="p-[0.6vw] space-y-[0.4vw]">
                                {/* 泰坦名称 */}
                                <div className="text-amber-400 text-[0.8vw] font-black uppercase tracking-tight">
                                    {def.name}
                                </div>

                                {/* 力量指示物信息 */}
                                {titan.powerTokens > 0 && (
                                    <div className="flex items-center gap-[0.3vw] text-[0.6vw] text-amber-300">
                                        <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-gradient-to-br from-amber-300 to-amber-500 
                                            flex items-center justify-center border border-white">
                                            <span className="text-[0.4vw] font-black text-amber-900">+{titan.powerTokens}</span>
                                        </div>
                                        <span className="font-bold">
                                            {t('ui.power_tokens', { count: titan.powerTokens, defaultValue: '{{count}} 个力量指示物' })}
                                        </span>
                                    </div>
                                )}

                                {/* 能力列表 */}
                                <div className="space-y-[0.3vw] max-h-[8vw] overflow-y-auto custom-scrollbar">
                                    {def.abilities.map((abilityId, idx) => {
                                        const abilityDef = getAbilityInfo(abilityId, t);
                                        return (
                                            <div key={idx} className="text-[0.55vw] text-white/90 leading-tight">
                                                <span className="text-amber-300 font-bold">{abilityDef.name}:</span>{' '}
                                                <span className="text-white/80">{abilityDef.description}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 控制权标识 */}
                                <div className={`text-[0.5vw] font-bold uppercase tracking-wide ${isMyTitan ? 'text-green-400' : 'text-red-400'}`}>
                                    {isMyTitan ? t('ui.your_titan', '你的泰坦') : t('ui.opponent_titan', '对手的泰坦')}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
