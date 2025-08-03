# eagle-lottie-preview
lottie插件-支持 Lottie 动画格式的预览插件，如果有images文件夹的话，将其打成压缩包插件会自动识别！
特别感谢 @Lionel 为本插件提供图标设计和封面UI支持
选择main哦，feature是出问题的时候备份用的

## 项目清理记录

### 已删除的无用文件

1. **`test.icns`** - 404KB 的测试文件，在整个项目中没有被引用
2. **`.DS_Store` 文件** - macOS 系统自动生成的文件，在多个目录中都有
3. **`.vscode/` 目录** - 包含空的 `settings.json` 文件，没有实际用途
4. **ICNS 相关文件**（因为 `manifest.json` 中没有配置 ICNS 支持）：
   - `viewer/icns.html` - ICNS 预览页面
   - `js/icns-util.js` - ICNS 处理工具
   - `thumbnail/icns.js` - ICNS 缩略图生成器

### 保留的文件

- `manifest.json` - 插件配置文件
- `package.json` 和 `package-lock.json` - 依赖管理文件
- `node_modules/` - 包含 `adm-zip` 依赖，被 `js/zip-util.js` 使用
- `js/` 目录中的其他文件 - 都被实际使用
- `viewer/` 目录中的 Lottie 相关文件 - 被 manifest.json 配置使用
- `thumbnail/` 目录中的 Lottie 相关文件 - 被 manifest.json 配置使用
- `images/` 目录 - 包含 UI 图片资源
- `logo.png` - 插件 logo

**总计删除了约 410KB 的无用文件，项目现在更加干净，只保留了实际需要的文件。**

## Canvas 修复记录

### 修复内容

1. **roundRect polyfill 实现** - 为 Canvas 添加了 `roundRect` 方法的 polyfill，解决了在某些 Node.js 版本中不支持该 API 的问题
2. **错误处理优化** - 改进了 Canvas 渲染失败时的错误处理机制
3. **降级方案** - 当 Canvas 渲染失败时，提供基础预览和最小 PNG 作为降级方案

### 技术实现

- 在 `thumbnail/lottie.js` 和 `thumbnail/lottie-zip.js` 中添加了 `addRoundRectPolyfill()` 函数
- 实现了完整的 `roundRect` polyfill，支持单个半径和对象形式的半径配置
- 添加了 `generateBasicPreview()` 和 `generateMinimalPNG()` 作为降级方案

## 支持项

### 系统要求

- **Node.js**: 建议使用 14.x 或更高版本
- **Canvas**: 需要安装 `canvas` 包，建议版本 `^2.11.0` 或更高
- **操作系统**: 支持 macOS、Windows、Linux

### 依赖项

```json
{
  "dependencies": {
    "adm-zip": "^0.5.10",
    "canvas": "^2.11.0"
  }
}
```

### 安装说明

1. 确保已安装 Node.js 14.x 或更高版本
2. 安装依赖：`npm install`
3. 如果遇到 Canvas 安装问题，可能需要安装系统级依赖：
   - **macOS**: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
   - **Ubuntu/Debian**: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
   - **Windows**: 通常会自动处理，如遇问题请确保安装了 Visual Studio Build Tools

### 功能特性

- ✅ Lottie JSON 文件预览
- ✅ Lottie ZIP 包预览（包含外部图片资源）
- ✅ 高质量缩略图生成
- ✅ Canvas 渲染优化
- ✅ 错误处理和降级方案
- ✅ 跨平台支持