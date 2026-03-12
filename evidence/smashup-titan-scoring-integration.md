# Smash Up 泰坦计分系统集成 - Task 9 完成

## 任务概述

**任务**: Task 9 - 集成 TitanSystem 到计分系统  
**日期**: 2026-03-06  
**状态**: ✅ 完成

## 实现内容

### 1. 修改计分逻辑

在 `src/games/smashup/domain/index.ts` 中集成 TitanSystem：

1. **主计分函数 `scoreOneBase`**（lines 167-183）
   - 使用 `titanSystem.calculatePlayerPower()` 计算玩家力量
   - 使用 `titanSystem.hasScoringEligibility()` 判定计分资格

2. **afterScoring 窗口初始力量计算**（line ~386）
   - 使用 `titanSystem.calculatePlayerPower()` 计算初始力量

3. **afterScoring 窗口当前力量计算**（line ~807）
   - 使用 `titanSystem.calculatePlayerPower()` 计算当前力量

4. **重新计分逻辑**（line ~844）
   - 使用 `titanSystem.calculatePlayerPower()` 计算重新计分力量

### 2. 测试覆盖

创建 `src/games/smashup/domain/__tests__/titanScoring.test.ts`，包含 9 个测试用例：

#### calculatePlayerPower 测试（2 个）
- ✅ 泰坦力量指示物正确计入总力量
- ✅ 向后兼容（没有泰坦时正常工作）

#### hasScoringEligibility 测试（3 个）
- ✅ 只有泰坦力量的玩家有资格计分
- ✅ 没有随从且泰坦力量为 0 的玩家无资格
- ✅ 有随从但力量为 0 的玩家有资格

#### 计分集成测试（4 个）
- ✅ 泰坦力量正确影响排名
- ✅ 无资格玩家被排除
- ✅ 多个玩家都有泰坦时正确排名
- ✅ 泰坦在不同基地时正确计算

### 3. 测试结果

```bash
npm test -- src/games/smashup/domain/__tests__/titanScoring.test.ts

✓ src/games/smashup/domain/__tests__/titanScoring.test.ts (9 tests) 4ms
  ✓ Titan Scoring Integration (9)
    ✓ calculatePlayerPower (2)
      ✓ should include titan power tokens in total power 1ms
      ✓ should work without titans (backward compatibility) 0ms
    ✓ hasScoringEligibility (3)
      ✓ should allow player with only titan power to score 0ms
      ✓ should not allow player with no minions and no titan power 0ms
      ✓ should allow player with minion even if power is zero 0ms
    ✓ Scoring Integration with Titans (4)
      ✓ should correctly rank players with titans in scoring 0ms
      ✓ should exclude players without eligibility from scoring 0ms
      ✓ should handle multiple players with titans 0ms
      ✓ should handle titans at different bases 0ms

Test Files  1 passed (1)
     Tests  9 passed (9)
```

### 4. TypeScript 编译检查

```bash
npx tsc --noEmit
# Exit Code: 0 ✅
```

## 修复的问题

### 测试状态结构错误

原始测试文件存在以下问题：

1. **随从对象使用 `power` 而非 `basePower`**
   - 修复：将所有 `power:` 字段改为 `basePower:`

2. **部分玩家的 `factions` 是单元素数组**
   - 错误：`factions: ['ninjas']`
   - 修复：`factions: ['ninjas', '']`

3. **基地结构包含不存在的 `ongoingCards` 字段**
   - 修复：移除所有 `ongoingCards: []` 字段

使用脚本 `scripts/temp/fix-titan-scoring-test-structure.mjs` 自动修复所有问题。

## 验收标准完成情况

- [x] 使用 `TitanSystem.calculatePlayerPower()` 计算基地总力量
- [x] 使用 `TitanSystem.hasScoringEligibility()` 判定计分资格
- [x] 单元测试验证泰坦计分逻辑（9/9 tests passing）
- [ ] E2E 测试验证完整计分流程（待 Task 27）

## 下一步

Task 10: 集成泰坦移除到基地摧毁逻辑

## 相关文件

- `src/games/smashup/domain/index.ts` - 计分逻辑（已修改）
- `src/games/smashup/domain/systems/TitanSystem.ts` - 泰坦系统
- `src/games/smashup/domain/__tests__/titanScoring.test.ts` - 单元测试
- `scripts/temp/fix-titan-scoring-test-structure.mjs` - 测试修复脚本
- `.kiro/specs/smashup-titan-mechanism/tasks.md` - 任务清单（已更新）
