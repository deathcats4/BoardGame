# SmashUp 泰坦 UI 组件实现

## 实现内容

完成了 Tasks 17-18 的 UI 组件实现：

### Task 17: TitanZone 组件

创建了 `src/games/smashup/ui/TitanZone.tsx`，显示玩家的泰坦区域（未出场的泰坦）。

**功能**：
- 显示玩家 `titanZone` 中的所有泰坦卡
- 泰坦卡显示名称、图片
- 当前玩家可点击泰坦卡（用于出场交互，Task 19 实现）
- 响应式布局，支持多张泰坦卡

**集成位置**：
- 在 `Board.tsx` 中，手牌区上方显示
- 只有当玩家有泰坦时才显示

### Task 18: TitanCard 组件

创建了 `src/games/smashup/ui/TitanCard.tsx`，显示场上的泰坦卡。

**功能**：
- 显示泰坦名称、图片
- 显示力量指示物数量（右上角黄色徽章）
- 显示控制权（底部蓝色/红色条）
- 支持点击交互（用于移动交互，Task 20 实现）

**集成位置**：
- 在 `BaseZone.tsx` 中，基地卡片上方显示
- 每个基地可以有多个泰坦（不同玩家的泰坦）

**技术细节**：
- `ActiveTitan` 类型只包含 `titanUid`、`baseIndex`、`powerTokens`
- 需要从 `core.players[ownerId].titanZone` 反查 `titanDefId`
- 使用 `getTitanDef(titanDefId)` 获取泰坦定义

## 验证

### TypeScript 编译检查

```bash
npx tsc --noEmit
```

✅ 编译通过，无类型错误

### 手动测试步骤

1. 启动游戏：`npm run dev`
2. 打开浏览器：`http://localhost:5173`
3. 创建房间，选择 POD 派系（如恐龙、巫师、植物、骗子）
4. 游戏开始后，应该能在手牌区上方看到泰坦区域（显示未出场的泰坦）
5. 使用调试面板手动出场泰坦（`PLACE_TITAN` 命令）
6. 应该能在基地上方看到泰坦卡

### 预期结果

- 泰坦区域显示在手牌上方，左侧位置
- 泰坦卡显示图片、名称
- 场上的泰坦显示在基地上方，ongoing 行动卡下方
- 泰坦卡显示力量指示物数量（如果有）
- 泰坦卡显示控制权（蓝色=己方，红色=对手）

## 已知限制

- 泰坦出场交互 UI 未实现（Task 19）
- 泰坦移动交互 UI 未实现（Task 20）
- 泰坦冲突动画未实现（Task 21）
- 点击泰坦卡会显示"泰坦出场功能尚未实现"的提示

## 下一步

继续实现 Tasks 19-21：
- Task 19: 泰坦出场交互 UI
- Task 20: 泰坦移动交互 UI
- Task 21: 泰坦冲突动画

## 相关文件

- `src/games/smashup/ui/TitanZone.tsx` - 泰坦区域组件
- `src/games/smashup/ui/TitanCard.tsx` - 泰坦卡组件
- `src/games/smashup/Board.tsx` - 集成 TitanZone
- `src/games/smashup/ui/BaseZone.tsx` - 集成 TitanCard
- `src/games/smashup/domain/core-types.ts` - 泰坦类型定义
- `src/games/smashup/data/titans.ts` - 泰坦卡定义
