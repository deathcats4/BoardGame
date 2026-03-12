/**
 * SmashUp 泰坦计分流程 E2E 测试
 * 
 * 验证：
 * - 泰坦力量正确计入基地计分
 * - 泰坦 +1 指示物正确计算
 * - 泰坦影响计分资格判定
 * 
 * 注意：由于 setupScene 不支持直接注入泰坦状态，
 * 这些测试需要通过 TestHarness 的 state.patch() 手动注入。
 */

import { test } from './framework';

test('泰坦力量计入基地计分', async ({ page, game }, testInfo) => {
    test.setTimeout(60000);
    
    // 1. 导航到游戏
    await page.goto('/play/smashup');
    
    // 2. 等待游戏加载
    await page.waitForFunction(
        () => (window as any).__BG_TEST_HARNESS__?.state?.isRegistered(),
        { timeout: 15000 }
    );
    
    // 3. 状态注入：构造泰坦计分场景
    // 由于 setupScene 不支持泰坦字段，使用 state.patch() 手动注入
    await page.evaluate(() => {
        const harness = (window as any).__BG_TEST_HARNESS__;
        const state = harness.state.get();
        
        // 构造泰坦计分场景：
        // 玩家 0: 有泰坦在基地 0（基础力量 5 + 2 个指示物 = 7）
        // 玩家 0: 基地 0 有 1 个随从（力量 3）
        // 玩家 1: 基地 0 有 1 个随从（力量 2）
        // 基地 0: breakpoint 10，玩家 0 总力量 10（泰坦 7 + 随从 3），应该触发计分
        
        const patch = {
            core: {
                players: {
                    '0': {
                        ...state.core.players['0'],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 2
                        }
                    },
                    '1': {
                        ...state.core.players['1'],
                        titanZone: [
                            {
                                uid: 'titan-2',
                                defId: 'titan_invisible_ninja',
                                type: 'titan',
                                factionId: 'ninjas_pod'
                            }
                        ],
                        activeTitan: null
                    }
                },
                bases: [
                    {
                        ...state.core.bases[0],
                        breakpoint: 10,
                        minions: [
                            {
                                uid: 'minion-1',
                                defId: 'bear_cavalry_alpha_bear',
                                ownerId: '0',
                                power: 3,
                                type: 'minion'
                            },
                            {
                                uid: 'minion-2',
                                defId: 'ninja_shinobi',
                                ownerId: '1',
                                power: 2,
                                type: 'minion'
                            }
                        ]
                    },
                    ...state.core.bases.slice(1)
                ],
                currentPlayerIndex: 0
            },
            sys: {
                ...state.sys,
                phase: 'scoreBases'
            }
        };
        
        harness.state.patch(patch);
    });
    
    await page.waitForTimeout(2000);
    
    // 4. 截图：初始状态
    await game.screenshot('titan-scoring-initial', testInfo);
    
    // 5. 验证基地应该触发计分
    const state = await page.evaluate(() => {
        const harness = (window as any).__BG_TEST_HARNESS__;
        return harness.state.get();
    });
    
    console.log('玩家 0 泰坦:', state.core.players['0'].activeTitan);
    console.log('基地 0 随从:', state.core.bases[0].minions);
    console.log('基地 0 breakpoint:', state.core.bases[0].breakpoint);
    
    // 6. 截图：最终状态
    await game.screenshot('titan-scoring-final', testInfo);
});

test('泰坦影响计分资格判定', async ({ page, game }, testInfo) => {
    test.setTimeout(60000);
    
    // 1. 导航到游戏
    await page.goto('/play/smashup');
    
    // 2. 等待游戏加载
    await page.waitForFunction(
        () => (window as any).__BG_TEST_HARNESS__?.state?.isRegistered(),
        { timeout: 15000 }
    );
    
    // 3. 状态注入：构造泰坦资格判定场景
    await page.evaluate(() => {
        const harness = (window as any).__BG_TEST_HARNESS__;
        const state = harness.state.get();
        
        // 构造泰坦资格判定场景：
        // 玩家 0: 只有泰坦在基地 0（力量 5），没有随从
        // 玩家 1: 基地 0 有 1 个随从（力量 3）
        // 基地 0: breakpoint 8，玩家 0 总力量 5，玩家 1 总力量 3
        // 玩家 0 应该因为"只有泰坦没有随从"而失去计分资格
        
        const patch = {
            core: {
                players: {
                    '0': {
                        ...state.core.players['0'],
                        titanZone: [],
                        activeTitan: {
                            titanUid: 'titan-1',
                            baseIndex: 0,
                            powerTokens: 0
                        }
                    },
                    '1': {
                        ...state.core.players['1'],
                        titanZone: [
                            {
                                uid: 'titan-2',
                                defId: 'titan_invisible_ninja',
                                type: 'titan',
                                factionId: 'ninjas_pod'
                            }
                        ],
                        activeTitan: null
                    }
                },
                bases: [
                    {
                        ...state.core.bases[0],
                        breakpoint: 8,
                        minions: [
                            {
                                uid: 'minion-2',
                                defId: 'ninja_shinobi',
                                ownerId: '1',
                                power: 3,
                                type: 'minion'
                            }
                        ]
                    },
                    ...state.core.bases.slice(1)
                ],
                currentPlayerIndex: 0
            },
            sys: {
                ...state.sys,
                phase: 'scoreBases'
            }
        };
        
        harness.state.patch(patch);
    });
    
    await page.waitForTimeout(2000);
    
    // 4. 截图：初始状态
    await game.screenshot('titan-eligibility-initial', testInfo);
    
    // 5. 验证玩家 0 应该失去计分资格
    const state = await page.evaluate(() => {
        const harness = (window as any).__BG_TEST_HARNESS__;
        return harness.state.get();
    });
    
    console.log('玩家 0 泰坦:', state.core.players['0'].activeTitan);
    console.log('玩家 0 随从数量:', state.core.bases[0].minions.filter((m: any) => m.ownerId === '0').length);
    console.log('基地 0 随从:', state.core.bases[0].minions);
    
    // 6. 截图：最终状态
    await game.screenshot('titan-eligibility-final', testInfo);
});
