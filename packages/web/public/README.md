# PWA 图标资源

此目录包含以下图标资源：

- `favicon.svg` - SVG 矢量图标（主图标，所有尺寸自适应）
- `favicon.ico` - ICO 回退图标
- `favicon-32x32.png` - 32x32 像素 PNG 图标
- `favicon-16x16.png` - 16x16 像素 PNG 图标
- `apple-touch-icon.png` - 180x180 Apple Touch 图标
- `icon-192.png` - 192x192 像素 PWA 图标
- `icon-512.png` - 512x512 像素 PWA 图标

## 品牌规格

- 设计：树形结构 + 变量填充 `{{ }}` 元素
- 渐变：`#007AFF` → `#5856D6`（Apple Blue → Indigo）
- 圆角矩形背景（iOS App Icon 风格）

## 生成 PNG 图标

基于 `favicon.svg` 使用以下工具生成各尺寸 PNG：

1. [Real Favicon Generator](https://realfavicongenerator.net/)
2. [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
