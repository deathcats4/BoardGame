# SmashUp 泰坦能力测试计划 - Task 15

## 测试目标

为所有 14 个 POD 泰坦的能力编写单元测试，验证：
1. Special 能力的触发条件和效果
2. Ongoing 能力的持续效果
3. Talent 能力的主动效果
4. 交互处理器的正确性

## 测试文件结构

```
src/games/smashup/domain/abilities/titans/__tests__/
├── fortTitanosaurus.test.ts       ✅ 已创建
├── arcaneProtector.test.ts        ⏳ 待创建
├── theKraken.test.ts              ⏳ 待创建
├── invisibleNinja.test.ts         ⏳ 待创建
├── killerKudzu.test.ts            ⏳ 待创建
├── creampuffMan.test.ts           ⏳ 待创建
├── majorUrsa.test.ts              ⏳ 待创建
├── dagon.test.ts                  ⏳ 待创建
├── cthulhu.test.ts                ⏳ 待创建
├── bigFunnyGiant.test.ts          ⏳ 待创建
├── greatWolfSpirit.test.ts        ⏳ 待创建
├── theBride.test.ts               ⏳ 待创建
├── ancientLord.test.ts            ⏳ 待创建
└── deathOnSixLegs.test.ts         ⏳ 待创建
```

## 当前状态

### 已完成
- ✅ 所有 14 个泰坦的能力定义文件已创建
- ✅ 能力注册系统已建立
- ✅ 部分交互处理器已实现（Fort Titanosaurus, Arcane Protector, The Kraken）
- ✅ 第一个测试文件已创建（fortTitanosaurus.test.ts）

### 待完成
- ⏳ 完善剩余 20 个交互处理器实现
- ⏳ 创建其他 13 个泰坦的测试文件
- ⏳ 运行所有测试并修复问题

## 下一步工作

根据 AGENTS.md 的规范，Task 15 的主要剩余工作是编写单元测试。我已经创建了第一个测试文件（Fort Titanosaurus），接下来需要：

1. 创建其他 13 个泰坦的测试文件
2. 运行测试，发现交互处理器的问题
3. 根据测试结果完善交互处理器实现

## 测试运行命令

```bash
# 运行所有泰坦能力测试
npm test -- src/games/smashup/domain/abilities/titans/__tests__/

# 运行单个泰坦测试
npm test -- src/games/smashup/domain/abilities/titans/__tests__/fortTitanosaurus.test.ts
```
