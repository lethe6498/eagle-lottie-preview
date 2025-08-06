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

## 更新记录

### 最新更新 (2024年12月)

#### 缩略图质量优化 - 小尺寸文件2x放大
- **问题描述**: 当Lottie文件的宽高都小于250像素时，生成的缩略图会显得模糊不清
- **解决方案**: 为小尺寸文件实现智能缩放机制
  - 检测条件：`width < 250 && height < 250`
  - 自动将缩略图渲染尺寸放大为原尺寸的2倍
  - 保持原始尺寸信息在元数据中，仅缩略图显示尺寸放大
- **影响文件**: `thumbnail/lottie.js`, `thumbnail/lottie-zip.js`
- **技术实现**: 
  ```javascript
  // 判断是否需要放大缩略图尺寸
  let thumbnailWidth = originalWidth;
  let thumbnailHeight = originalHeight;
  let scaleFactor = 1;
  
  if (originalWidth < 250 && originalHeight < 250) {
      scaleFactor = 2;
      thumbnailWidth = originalWidth * scaleFactor;
      thumbnailHeight = originalHeight * scaleFactor;
  }
  ```

#### 进度条同步修复
- **问题描述**: Lottie动画播放器的进度条与动画帧率不同步，存在延迟
- **根本原因**: 进度条更新逻辑中使用了不必要的平滑过渡和最小更新间隔，导致与动画帧率脱节
- **解决方案**: 简化进度条更新逻辑
  - 移除平滑过渡变量：`lastProgress`, `lastUpdateTime`, `MIN_UPDATE_INTERVAL`
  - 移除嵌套的`requestAnimationFrame`调用
  - 直接更新进度条宽度，确保与动画帧率同步
- **影响文件**: `viewer/lottie.html`, `viewer/lottie-zip.html`
- **技术实现**:
  ```javascript
  function updateProgress(currentFrame, totalFrames) {
    const currentProgress = (currentFrame / (totalFrames - 1)) * 100;
    progressBar.style.width = `${currentProgress}%`;
  }
  ```

### 历史更新 (SVG 渲染优化)

1. **Canvas 到 SVG 迁移** - 将缩略图生成从 Canvas 渲染迁移到 SVG 渲染，提供更好的透明背景支持
2. **透明背景支持** - 设置透明背景，更好地适应不同的 Eagle 主题
3. **保留 playbtn.png** - 继续使用 playbtn.png 作为播放按钮图标
4. **错误处理优化** - 改进了 SVG 渲染失败时的错误处理机制
5. **降级方案** - 当 SVG 渲染失败时，提供基础预览和最小 PNG 作为降级方案

### 技术实现

- 在 `thumbnail/lottie.js` 和 `thumbnail/lottie-zip.js` 中将 Canvas 渲染替换为 SVG 渲染
- 使用 SVG 的 `<image>` 元素嵌入 playbtn.png 作为 base64 数据
- 实现了 `svgToPngBuffer()` 函数将 SVG 转换为 PNG buffer（仍需要Canvas依赖）
- 添加了 `generateBasicPreview()` 和 `generateMinimalPNG()` 作为降级方案

### 关于Canvas依赖的说明

虽然主要渲染逻辑已迁移到SVG，但`canvas`依赖仍然需要保留，原因如下：

1. **SVG转PNG转换**：Eagle插件需要PNG格式的缩略图，所以需要Canvas将SVG转换为PNG
2. **打包兼容性**：Canvas依赖会被一起打包到插件中，确保在不同平台上都能正常工作
3. **降级方案**：当SVG渲染失败时，Canvas用于生成基础预览和最小PNG
4. **跨平台支持**：Canvas包本身支持Windows、macOS和Linux，确保插件在各平台都能正常运行

**注意**：Canvas依赖在打包时会被包含在插件中，不会影响插件的正常使用。

### 历史更新

#### Canvas 修复记录
- **roundRect polyfill 实现** - 为 Canvas 添加了 `roundRect` 方法的 polyfill，解决了在某些 Node.js 版本中不支持该 API 的问题
- **错误处理优化** - 改进了 Canvas 渲染失败时的错误处理机制
- **降级方案** - 当 Canvas 渲染失败时，提供基础预览和最小 PNG 作为降级方案

#### 项目清理记录
- 删除了约 410KB 的无用文件，包括测试文件、系统文件和未使用的 ICNS 相关文件
- 项目现在更加干净，只保留了实际需要的文件

## 支持项

### 系统要求

- **Node.js**: 建议使用 14.x 或更高版本
- **Canvas**: 需要安装 `canvas` 包（用于SVG转PNG），建议版本 `^2.11.0` 或更高
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
- ✅ 智能缩略图缩放（小尺寸文件自动2x放大）
- ✅ SVG 渲染优化（透明背景）
- ✅ 同步进度条显示（与动画帧率完全同步）
- ✅ 错误处理和降级方案
- ✅ 跨平台支持