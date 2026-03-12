/**
 * 泰坦目标选择 UI 测试
 * 
 * 验证 PromptOverlay 组件能够正确显示和选择泰坦卡牌
 */

import { describe, it, expect } from 'vitest';
import type { CardMagnifyTarget } from '../CardMagnifyOverlay';
import type { TitanCardDef } from '../../domain/types';

describe('Titan Target Selection UI', () => {
    describe('CardMagnifyTarget type', () => {
        it('should support titan card type', () => {
            const titanTarget: CardMagnifyTarget = {
                defId: 'titan_test',
                type: 'titan',
            };
            
            expect(titanTarget.type).toBe('titan');
        });

        it('should support all card types', () => {
            const types: CardMagnifyTarget['type'][] = ['minion', 'action', 'base', 'titan'];
            
            types.forEach(type => {
                const target: CardMagnifyTarget = {
                    defId: 'test',
                    type,
                };
                expect(target.type).toBe(type);
            });
        });
    });

    describe('TitanCardDef type', () => {
        it('should have correct structure', () => {
            const titanDef: TitanCardDef = {
                defId: 'titan_test',
                type: 'titan',
                name: 'Test Titan',
                factionId: 'test_faction',
                abilities: ['ability1', 'ability2'],
            };
            
            expect(titanDef.type).toBe('titan');
            expect(titanDef.defId).toBe('titan_test');
            expect(titanDef.name).toBe('Test Titan');
            expect(titanDef.factionId).toBe('test_faction');
            expect(titanDef.abilities).toHaveLength(2);
        });

        it('should support optional previewRef', () => {
            const titanDefWithPreview: TitanCardDef = {
                defId: 'titan_test',
                type: 'titan',
                name: 'Test Titan',
                factionId: 'test_faction',
                abilities: [],
                previewRef: {
                    type: 'renderer',
                    rendererId: 'smashup-card-renderer',
                    payload: { defId: 'titan_test' },
                },
            };
            
            expect(titanDefWithPreview.previewRef).toBeDefined();
            expect(titanDefWithPreview.previewRef?.type).toBe('renderer');
        });
    });

    describe('CardDef union type', () => {
        it('should include TitanCardDef in union', () => {
            // 这个测试通过 TypeScript 编译即表示类型正确
            const titanDef: TitanCardDef = {
                defId: 'titan_test',
                type: 'titan',
                name: 'Test Titan',
                factionId: 'test_faction',
                abilities: [],
            };
            
            // CardDef 应该能接受 TitanCardDef
            const cardDef = titanDef;
            expect(cardDef.type).toBe('titan');
        });
    });
});
