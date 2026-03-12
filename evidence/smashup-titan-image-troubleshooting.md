# 泰坦图片不显示问题排查清单

## 🎯 问题描述

泰坦卡牌图片不显示（空白或显示占位符）

## ✅ 已确认正常的部分

根据诊断脚本 `scripts/temp/diagnose-titan-images.mjs` 的检查结果：

- ✅ 图片文件存在（zh-CN 和 en 两个语言目录）
- ✅ `SMASHUP_ATLAS_IDS.TITANS` 常量已定义
- ✅ 图集配置完整（atlasCatalog.ts）
- ✅ 所有泰坦的图集索引都在有效范围内 (0-31)
- ✅ 图集注册逻辑完整（cardAtlas.ts）
- ✅ UI 组件正确使用 CardPreview

## 🔍 需要排查的环节

### 1. 浏览器端检查

#### 步骤 1：打开浏览器开发者工具

1. 按 `F12` 打开开发者工具
2. 切换到 **Console** 标签
3. 查看是否有错误信息（红色文字）

**常见错误**：
- `Failed to load resource: net::ERR_FILE_NOT_FOUND` → 图片文件路径错误
- `Uncaught TypeError: Cannot read property 'config' of undefined` → 图集未注册
- `404 Not Found` → 图片文件不存在

#### 步骤 2：检查 Network 标签

1. 切换到 **Network** 标签
2. 刷新页面（`Ctrl+R`）
3. 在过滤器中输入 `tts_atlas_752d625ca7`
4. 查看图片请求的状态

**预期结果**：
- 状态码：`200 OK`
- 类型：`webp`
- 大小：约 1.6 MB

**如果看到**：
- `404 Not Found` → 图片文件路径错误或文件不存在
- `(pending)` → 请求被阻塞或超时
- `(failed)` → 网络错误或文件损坏

#### 步骤 3：运行浏览器端诊断脚本

1. 打开游戏页面
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签
4. 复制 `scripts/temp/browser-titan-debug.js` 的内容
5. 粘贴到控制台并回车
6. 查看输出结果

### 2. 图片文件完整性检查

#### 检查文件是否损坏

```powershell
# 尝试用图片查看器打开
Start-Process "public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp"
```

**预期结果**：能正常打开并看到 4x8 的泰坦卡牌网格

**如果无法打开**：
- 文件可能损坏
- 需要重新复制图片文件

#### 检查文件大小

```powershell
Get-Item "public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp" | Select-Object Length
```

**预期结果**：约 1,715,632 字节 (1.64 MB)

**如果大小不对**：
- 文件可能不完整
- 需要重新复制图片文件

### 3. 开发服务器检查

#### 重启开发服务器

有时候文件更新后需要重启服务器才能生效：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

#### 清除浏览器缓存

```
1. 按 Ctrl+Shift+Delete
2. 选择"缓存的图片和文件"
3. 点击"清除数据"
```

或者使用硬刷新：
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### 4. 代码层面检查

#### 检查 getTitanDef 函数

在 `TitanCard.tsx` 或 `TitanZone.tsx` 中，确认 `getTitanDef()` 能正确返回泰坦定义：

```typescript
// 在组件中添加调试日志
const def = getTitanDef(titanDefId);
console.log('Titan def:', def);
console.log('Preview ref:', def?.previewRef);
```

**预期输出**：
```javascript
Titan def: {
  defId: 'titan_the_kraken',
  type: 'titan',
  name: '巨妖',
  factionId: 'pirates',
  abilities: [...],
  previewRef: { type: 'atlas', atlasId: 'smashup:titans', index: 2 }
}
Preview ref: { type: 'atlas', atlasId: 'smashup:titans', index: 2 }
```

**如果返回 undefined**：
- `titanDefId` 可能不正确
- 泰坦定义可能未正确导出

#### 检查 CardPreview 组件接收的 props

在 `CardPreview` 组件中添加调试日志：

```typescript
// 在 CardPreview 函数开头添加
console.log('CardPreview props:', { previewRef, locale, className });
```

**预期输出**：
```javascript
CardPreview props: {
  previewRef: { type: 'atlas', atlasId: 'smashup:titans', index: 2 },
  locale: undefined, // 或 'zh-CN'
  className: 'w-full h-full object-cover'
}
```

#### 检查图集注册表

在浏览器控制台运行：

```javascript
import { getCardAtlasSource } from '/src/components/common/media/cardAtlasRegistry.ts';
const source = getCardAtlasSource('smashup:titans', 'zh-CN');
console.log('Atlas source:', source);
```

**预期输出**：
```javascript
Atlas source: {
  image: 'smashup/cards/tts_atlas_752d625ca7',
  config: {
    imageW: 2048,
    imageH: 1024,
    rows: 4,
    cols: 8,
    colStarts: [0, 256, 512, ...],
    colWidths: [256, 256, 256, ...],
    rowStarts: [0, 256, 512, 768],
    rowHeights: [256, 256, 256, 256]
  }
}
```

**如果返回 undefined**：
- 图集未注册
- 检查 `cardAtlas.ts` 中的 `initSmashUpAtlases()` 是否执行

### 5. 特定场景检查

#### 场景 1：TitanZone 中的泰坦不显示

**可能原因**：
1. `titanZone` 数组为空
2. `getTitanDef()` 返回 undefined
3. `previewRef` 为 null

**排查步骤**：
```typescript
// 在 TitanZone.tsx 中添加日志
console.log('titanZone:', titanZone);
titanZone.forEach(titan => {
  const def = getTitanDef(titan.defId);
  console.log(`Titan ${titan.defId}:`, def);
});
```

#### 场景 2：BaseZone 中的泰坦不显示

**可能原因**：
1. `activeTitan` 为 null
2. 无法从 `titanZone` 中找到对应的泰坦卡
3. `titanDefId` 推断错误

**排查步骤**：
```typescript
// 在 TitanCard.tsx 中添加日志
console.log('titan:', titan);
console.log('titanCard:', titanCard);
console.log('titanDefId:', titanDefId);
console.log('def:', def);
```

#### 场景 3：图片显示为灰色占位符（shimmer）

**可能原因**：
1. 图片正在加载中（网络慢）
2. 图片加载失败但未报错
3. `loaded` 状态未正确更新

**排查步骤**：
1. 打开 Network 标签，查看图片请求状态
2. 等待几秒，看是否会加载出来
3. 检查控制台是否有图片加载错误

### 6. 环境相关检查

#### 检查 i18n 语言设置

```javascript
// 在浏览器控制台运行
import { useTranslation } from 'react-i18next';
const { i18n } = useTranslation();
console.log('Current language:', i18n.language);
```

**预期输出**：`zh-CN` 或 `en`

**如果语言不对**：
- 图片可能从错误的语言目录加载
- 检查对应语言目录下是否有图片文件

#### 检查 Vite 配置

确认 `vite.config.ts` 中的静态资源配置正确：

```typescript
// vite.config.ts
export default defineConfig({
  publicDir: 'public', // 静态资源目录
  // ...
});
```

## 🛠️ 常见解决方案

### 解决方案 1：重新复制图片文件

```powershell
# 从英文目录复制到中文目录
Copy-Item "public/assets/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp" `
          "public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp" -Force
```

### 解决方案 2：清除缓存并重启

```bash
# 1. 停止开发服务器 (Ctrl+C)
# 2. 清除 node_modules/.vite 缓存
Remove-Item -Recurse -Force node_modules/.vite
# 3. 重新启动
npm run dev
```

### 解决方案 3：检查 TypeScript 编译

```bash
# 运行 TypeScript 编译检查
npx tsc --noEmit
```

如果有类型错误，修复后重新启动开发服务器。

### 解决方案 4：检查图集注册顺序

确保 `cardAtlas.ts` 在其他组件之前被导入：

```typescript
// 在 Board.tsx 或 game.ts 顶部
import '../ui/cardAtlas'; // 确保图集注册先执行
```

## 📝 报告问题时需要提供的信息

如果以上步骤都无法解决问题，请提供以下信息：

1. **浏览器控制台截图**（Console 标签）
2. **Network 标签截图**（过滤 `tts_atlas`）
3. **诊断脚本输出**（`node scripts/temp/diagnose-titan-images.mjs`）
4. **浏览器端诊断输出**（`scripts/temp/browser-titan-debug.js`）
5. **当前语言设置**（`i18n.language`）
6. **游戏状态**（`window.__BG_STATE__`）

## 🎯 快速诊断命令

```bash
# 1. 运行服务器端诊断
node scripts/temp/diagnose-titan-images.mjs

# 2. 检查图片文件
Get-Item "public/assets/i18n/*/smashup/cards/compressed/tts_atlas_752d625ca7.webp"

# 3. 检查 TypeScript 编译
npx tsc --noEmit

# 4. 重启开发服务器
npm run dev
```

## 📚 相关文档

- `evidence/smashup-titan-image-mapping-complete.md` - 完整的图片映射文档
- `scripts/temp/diagnose-titan-images.mjs` - 服务器端诊断脚本
- `scripts/temp/browser-titan-debug.js` - 浏览器端诊断脚本

---

**最后更新**: 2026-03-07
