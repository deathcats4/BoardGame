# 泰坦出场验证与显示修复 - 实现任务

## 任务清单

- [ ] 1. 修改数据结构
  - [ ] 1.1 在 `SmashUpCore` 添加 `titanPlacementAllowed` 字段
  - [ ] 1.2 在 `ActiveTitan` 添加 `defId` 字段

- [ ] 2. 修改 Reducer 逻辑
  - [ ] 2.1 修改 `TITAN_PLACED` reducer 复制 `defId`
  - [ ] 2.2 修改 `TITAN_PLACED` reducer 清除 `titanPlacementAllowed`
  - [ ] 2.3 修改 `TURN_ENDED` reducer 清除 `titanPlacementAllowed`

- [ ] 3. 增强命令验证
  - [ ] 3.1 修改 `PLACE_TITAN` 验证检查 `titanPlacementAllowed`

- [ ] 4. 简化 UI 逻辑
  - [ ] 4.1 修改 `TitanCard.tsx` 直接读取 `titan.defId`
  - [ ] 4.2 保留 fallback 逻辑处理旧存档

- [ ] 5. 更新卡牌效果
  - [ ] 5.1 搜索所有允许泰坦出场的卡牌效果
  - [ ] 5.2 修改 Rainboroc 设置 `titanPlacementAllowed = true`
  - [ ] 5.3 修改 Megabot 设置 `titanPlacementAllowed = true`
  - [ ] 5.4 修改其他相关卡牌效果（如有）

- [ ] 6. 更新测试
  - [ ] 6.1 更新 `titanCommands.test.ts` 添加权限验证测试
  - [ ] 6.2 更新 `titanReducer.test.ts` 验证 defId 复制
  - [ ] 6.3 运行所有测试确保通过

- [ ] 7. 代码质量检查
  - [ ] 7.1 运行 ESLint 检查（0 errors）
  - [ ] 7.2 运行 TypeScript 编译检查

- [ ] 8. 手动测试验证
  - [ ] 8.1 验证未设置权限时无法出场泰坦
  - [ ] 8.2 验证使用 Rainboroc 后可以出场泰坦
  - [ ] 8.3 验证泰坦出场后显示正确图片
  - [ ] 8.4 验证泰坦悬停显示中文能力
  - [ ] 8.5 验证放大镜功能正常

## 任务依赖关系

```
1 (数据结构)
├── 2 (Reducer)
│   └── 4 (UI 简化)
├── 3 (验证)
│   └── 5 (卡牌效果)
└── 6 (测试)
    └── 7 (质量检查)
        └── 8 (手动测试)
```

## 实施注意事项

1. **任务 1-4 必须按顺序执行**（有依赖关系）
2. **任务 5 可以与任务 4 并行**（独立修改）
3. **任务 6-8 必须在所有代码修改完成后执行**
4. **每个阶段完成后运行 ESLint 检查**
5. **保留 fallback 逻辑确保向后兼容**

## 预计工作量

- 任务 1-4: 30 分钟（核心逻辑修改）
- 任务 5: 20 分钟（搜索和修改卡牌效果）
- 任务 6: 20 分钟（测试更新）
- 任务 7-8: 15 分钟（质量检查和手动测试）
- **总计**: 约 85 分钟
