# 侏儒 POD 计分前触发缺失修复总结

## 问题现象

- 在基地进入计分流程时，场上存在 `trickster_gnome_pod`
- 玩家点击回合结束后，没有弹出“选择一个可消灭的随从”的交互
- 按卡牌文本，侏儒 POD 应在“此基地计分前”允许消灭一个力量低于该基地随从与泰坦总数的随从

## 根因

### 1. 触发时机接错

- `trickster_gnome_pod` 在数据层被标成了 `onPlay`
- 能力层没有为它注册 `beforeScoring` trigger
- 结果是 POD 自动别名系统把它错误地继承成了基础版 `trickster_gnome` 的入场效果

### 2. 计分前链路没有专用交互

- 这张 POD 版卡的真实语义不是“打出时选择目标”
- 它需要在 `beforeScoring` 阶段，根据当前基地上的随从与泰坦数量动态生成候选目标
- 原实现没有走这条链路，所以计分时被直接跳过

## 修复内容

### 能力层

文件：`src/games/smashup/abilities/tricksters.ts`

- 新增 `trickster_gnome_pod` 的 `beforeScoring` 触发器
- 计分前会扫描当前计分基地上的所有 `trickster_gnome_pod`
- 为每个侏儒创建“可跳过”的选择交互
- 合法目标按“力量 < 此基地随从数 + 泰坦数”动态计算
- 交互处理后会正确发出 `MINION_DESTROYED`

### 防止错误继承

文件：`src/games/smashup/abilities/tricksters.ts`

- 显式注册空的 `trickster_gnome_pod onPlay`
- 作用是拦住 POD 自动别名系统把基础版 `trickster_gnome` 的 `onPlay` 错误复制过来

### 数据层

文件：`src/games/smashup/data/factions/tricksters_pod.ts`

- 移除 `trickster_gnome_pod` 的 `abilityTags: ['onPlay']`
- 改为注释说明：该卡是 `beforeScoring trigger`

### 测试

文件：`src/games/smashup/__tests__/newOngoingAbilities.test.ts`

- 新增“计分前会创建交互”回归测试
- 新增“响应后会正确消灭目标”回归测试

## 验证结果

执行命令：

```bash
npx vitest run src/games/smashup/__tests__/newOngoingAbilities.test.ts
```

结果：

- `1` 个测试文件通过
- `118` 条测试全部通过

## 结果

- 侏儒 POD 现在会在基地计分前正确弹出选择
- 不会再被当成基础版侏儒的入场效果
- 可以按当前基地上的随从/泰坦总数，正确选择并消灭符合条件的随从
