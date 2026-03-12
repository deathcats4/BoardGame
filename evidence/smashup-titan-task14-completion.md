# Task 14 完成：定义泰坦卡牌数据

## 任务信息
- **任务**: Task 14 - 定义泰坦卡牌数据
- **日期**: 2024-03-06
- **状态**: ✅ 已完成

## 实现内容

### 1. 添加 TITANS 图集 ID
**文件**: `src/games/smashup/domain/ids.ts`

添加了 `TITANS: 'smashup:titans'` 到 `SMASHUP_ATLAS_IDS` 常量表。

### 2. 创建泰坦卡牌数据文件
**文件**: `src/games/smashup/data/titans.ts`

定义了 14 张泰坦卡牌，每张包含：
- `defId`: 唯一标识符
- `type: 'titan'`: 卡牌类型
- `name`: 中文名称
- `factionId`: 所属派系 ID
- `abilities`: 能力 ID 数组（Special, Ongoing, Talent）
- `previewRef`: 图集引用（atlasId + index）

### 3. 注册泰坦卡牌
**文件**: `src/games/smashup/data/cards.ts`

- 导入 `TITAN_CARDS`, `getTitanByFaction`, `getTitanDef`
- 调用 `registerCards(TITAN_CARDS)` 注册所有泰坦卡牌
- 导出辅助函数

### 4. 辅助函数

#### `getTitanByFaction(factionId: string): TitanCardDef | undefined`
根据派系 ID 获取泰坦卡牌定义。用于游戏初始化时分配泰坦卡牌。

#### `getTitanDef(defId: string): TitanCardDef | undefined`
根据 defId 获取泰坦卡牌定义。用于 UI 渲染和能力执行。

## 验收标准检查

- [x] 定义 14 个 POD 派系的泰坦卡牌 — ✅ 已完成
- [x] 每个泰坦包含 defId、name、factionId、abilities、previewRef — ✅ 已完成
- [x] 注册到卡牌注册表 — ✅ 已完成
- [x] 运行 `npx tsc --noEmit` 确认类型定义无错误 — ✅ 已通过

## 待确认信息

1. **图集索引**: 当前使用占位索引 0-13，需要在泰坦图片资源准备好后确认实际索引
2. **图集定义**: 需要在 `src/games/smashup/domain/atlasCatalog.ts` 中添加 TITANS 图集定义
3. **能力实现**: 泰坦能力定义和执行器将在 Task 15 和 Task 16 中实现

## 下一步

继续执行 **Task 15**：实现泰坦能力定义（`src/games/smashup/domain/abilities/titans.ts`）

## 百游戏自检

✅ **显式 > 隐式**: 所有泰坦卡牌的 factionId 和 abilities 都显式声明  
✅ **单一真实来源**: 泰坦卡牌数据集中在 `titans.ts`  
✅ **类型安全**: 使用 `TitanCardDef` 接口，编译期检查  
✅ **最小化游戏层代码**: 新增泰坦只需添加一个对象（~10 行）  
✅ **框架可进化**: 泰坦卡牌使用与现有卡牌相同的注册机制

**反思是通用处理吗？**  
✅ 是的。泰坦卡牌数据结构和注册机制与现有卡牌系统一致，未来添加新泰坦或新卡牌类型都可以复用相同的模式。
