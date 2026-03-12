/**
 * 目标类型扩展测试
 *
 * 验证 TargetType 和 CardTarget 类型定义的正确性。
 */

import { describe, it, expect } from 'vitest';
import type { TargetType, CardTarget } from '../target';

describe('Target Type Extension', () => {
    describe('TargetType', () => {
        it('should include all valid target types', () => {
            const validTypes: TargetType[] = ['minion', 'action', 'card', 'base', 'player'];
            
            // 类型检查：确保所有类型都是有效的 TargetType
            validTypes.forEach(type => {
                expect(['minion', 'action', 'card', 'base', 'player']).toContain(type);
            });
        });

        it('should support card target type', () => {
            const cardType: TargetType = 'card';
            expect(cardType).toBe('card');
        });
    });

    describe('CardTarget', () => {
        it('should create valid minion card target', () => {
            const target: CardTarget = {
                type: 'card',
                cardUid: 'minion-1',
                cardType: 'minion',
                playerId: '0',
                location: 'field',
            };

            expect(target.type).toBe('card');
            expect(target.cardType).toBe('minion');
            expect(target.location).toBe('field');
        });

        it('should create valid action card target', () => {
            const target: CardTarget = {
                type: 'card',
                cardUid: 'action-1',
                cardType: 'action',
                playerId: '0',
                location: 'hand',
            };

            expect(target.type).toBe('card');
            expect(target.cardType).toBe('action');
            expect(target.location).toBe('hand');
        });

        it('should create valid titan card target', () => {
            const target: CardTarget = {
                type: 'card',
                cardUid: 'titan-1',
                cardType: 'titan',
                playerId: '0',
                location: 'titan',
            };

            expect(target.type).toBe('card');
            expect(target.cardType).toBe('titan');
            expect(target.location).toBe('titan');
        });

        it('should support all card types', () => {
            const cardTypes: Array<CardTarget['cardType']> = ['minion', 'action', 'titan'];
            
            cardTypes.forEach(cardType => {
                const target: CardTarget = {
                    type: 'card',
                    cardUid: `${cardType}-1`,
                    cardType,
                    playerId: '0',
                    location: 'field',
                };
                
                expect(target.cardType).toBe(cardType);
            });
        });

        it('should support all locations', () => {
            const locations: Array<CardTarget['location']> = ['field', 'hand', 'discard', 'ongoing', 'titan'];
            
            locations.forEach(location => {
                const target: CardTarget = {
                    type: 'card',
                    cardUid: 'card-1',
                    cardType: 'minion',
                    playerId: '0',
                    location,
                };
                
                expect(target.location).toBe(location);
            });
        });
    });
});
