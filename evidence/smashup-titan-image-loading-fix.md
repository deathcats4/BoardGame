# 泰坦图片加载失败问题修复

## 🐛 问题描述

泰坦卡牌图片无法显示，浏览器 Network 标签显示所有 `tts_atlas_752d625ca7.webp` 请求都失败 (failed)。

## 🔍 问题排查

### 用户提供的证据

1. **Network 标签截图**：
   - 3个 `tts_atlas_752d625ca7.webp` 请求
   - 状态：**(failed)**
   - 大小：`0.0 kB`
   - 发起者：`AssetLoader.ts:66`, `inspector.js:7`

2. **Console 错误**：
   - `inspector.js` 的 XMLHttpRequest 错误（浏览器开发工具问题，可忽略）

### 排查过程

1. **运行诊断脚本** (`scripts/temp/diagnose-titan-images.mjs`)
   - ✅ 图片文件存在（zh-CN 和 en 目录）
   - ✅ 图集配置正确
   - ✅ 代码逻辑正确

2. **检查 AssetLoader.ts**
   - 发现 `assetsBaseUrl` 默认值：`https://assets.easyboardgame.top/official`
   - 检查 `.env.local` 文件：`VITE_ASSETS_BASE_URL` 被注释掉了

3. **根本原因确认**
   - 代码尝试从 CDN 加载图片：`https://assets.easyboardgame.top/official/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp`
   - 但泰坦图片还没有上传到 CDN
   - 本地文件存在于 `public/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp`

## ✅ 解决方案

### 修复内容

**文件**: `.env.local`

```diff
- # VITE_ASSETS_BASE_URL=/assets
+ VITE_ASSETS_BASE_URL=/assets
```

### 修复原理

1. **取消注释** `VITE_ASSETS_BASE_URL=/assets`
2. 这样 `assetsPath()` 函数会使用本地路径 `/assets/` 而不是 CDN 地址
3. 图片请求路径变为：`/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp`
4. Vite 开发服务器会从 `public/` 目录提供这个文件

### 验证步骤

1. **重启开发服务器**（必须）：
   ```bash
   # Ctrl+C 停止当前服务器
   npm run dev
   ```

2. **硬刷新浏览器**：
   ```
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)
   ```

3. **检查 Network 标签**：
   - 应该看到 `tts_atlas_752d625ca7.webp` 状态码 `200 OK`
   - 大小约 `1.6 MB`

4. **确认图片显示**：
   - TitanZone 中的泰坦卡应该正常显示
   - BaseZone 中的泰坦卡应该正常显示

## 📝 技术细节

### AssetLoader.ts 路径解析逻辑

```typescript
// 默认 CDN 地址
const DEFAULT_ASSETS_BASE_URL = 'https://assets.easyboardgame.top/official';

// 从环境变量读取（如果有）
let assetsBaseUrl = normalizeAssetsBaseUrl(import.meta.env?.VITE_ASSETS_BASE_URL) 
                    ?? DEFAULT_ASSETS_BASE_URL;

// 构建本地化路径
export function getLocalizedAssetPath(path: string, locale?: string): string {
    if (!locale) return assetsPath(path);
    const normalized = assetsPath(path);
    const relative = stripAssetsBasePrefix(normalized);
    const localizedPrefix = `${LOCALIZED_ASSETS_SUBDIR}/${locale}/`; // 'i18n/zh-CN/'
    return assetsPath(`${localizedPrefix}${relative}`);
}

// 添加资源基址
export function assetsPath(path: string): string {
    // ...
    return `${assetsBaseUrl}/${trimmed}`;
}
```

### 完整路径构建流程

1. **输入**：`'smashup/cards/tts_atlas_752d625ca7'`
2. **getLocalizedAssetPath**：添加 `i18n/zh-CN/` 前缀
   - → `'i18n/zh-CN/smashup/cards/tts_atlas_752d625ca7'`
3. **getOptimizedImageUrls**：添加 `compressed/` 和 `.webp` 扩展名
   - → `'i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp'`
4. **assetsPath**：添加资源基址
   - 修复前：`'https://assets.easyboardgame.top/official/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp'` ❌
   - 修复后：`'/assets/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp'` ✅

## 🎯 为什么之前没有这个问题

其他游戏的图片（如 SmashUp 的普通卡牌）已经上传到 CDN，所以即使使用 CDN 地址也能正常加载。

泰坦图片是新添加的，还没有上传到 CDN，所以必须使用本地路径。

## 📚 相关文件

- **修复文件**: `.env.local`
- **路径解析**: `src/core/AssetLoader.ts`
- **图集配置**: `src/games/smashup/domain/atlasCatalog.ts`
- **泰坦定义**: `src/games/smashup/data/titans.ts`
- **诊断脚本**: `scripts/temp/diagnose-titan-images.mjs`

## ⚠️ 注意事项

### 生产环境部署

当泰坦图片上传到 CDN 后，可以重新启用 CDN 地址：

1. 上传图片到 CDN：
   ```bash
   # 上传泰坦图集
   # 目标路径：https://assets.easyboardgame.top/official/i18n/zh-CN/smashup/cards/compressed/tts_atlas_752d625ca7.webp
   # 目标路径：https://assets.easyboardgame.top/official/i18n/en/smashup/cards/compressed/tts_atlas_752d625ca7.webp
   ```

2. 可选：恢复 CDN 配置
   ```bash
   # .env.local
   # VITE_ASSETS_BASE_URL=/assets  # 注释掉，使用默认 CDN
   ```

### 开发环境建议

建议保持 `VITE_ASSETS_BASE_URL=/assets` 启用状态，这样：
- ✅ 新添加的资源立即可用（无需上传 CDN）
- ✅ 开发速度更快（本地加载）
- ✅ 离线开发可用

---

**问题发现时间**: 2026-03-07  
**修复时间**: 2026-03-07  
**修复者**: AI Assistant  
**验证者**: 待用户验证
