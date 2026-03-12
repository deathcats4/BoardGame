# SmashUp 泰坦能力实现计划

## 当前状态

✅ **已完成**：
- Task 14: 泰坦卡牌数据定义（14 个 POD 泰坦）
- 图集映射配置
- 泰坦核心系统（TitanSystem）
- 泰坦命令和事件
- 泰坦初始化和计分集成

⏳ **待实现**：
- Task 15: 泰坦能力定义（42 个能力）
- Task 16: 泰坦能力执行器

## 实现策略

### 阶段 1：基础框架

创建能力定义文件结构和类型定义。

### 阶段 2：实现 3 个代表性泰坦

1. **Fort Titanosaurus (恐龙)** - 简单
2. **Arcane Protector (巫师)** - 中等
3. **The Kraken (海盗)** - 复杂

### 阶段 3：能力执行器系统

创建执行器注册表和执行器函数。

### 阶段 4：UI 集成

泰坦能力按钮和交互 UI。

### 阶段 5：测试

单元测试和 E2E 测试。

### 阶段 6：扩展到所有泰坦

完成其余 11 个泰坦的能力。

## 预估工作量

**总计**：21-31 小时

## 下一步行动

1. 创建能力定义目录
2. 定义类型
3. 实现 Fort Titanosaurus 的 Special 能力
4. 编写测试
5. 逐步扩展

## 参考资料

- `docs/smashup-titans-data.md`
- `src/games/smashup/domain/abilityHelpers.ts`
- `src/games/smashup/domain/systems/TitanSystem.ts`
