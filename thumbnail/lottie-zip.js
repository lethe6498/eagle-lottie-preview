const path = require("path");
const fs = require("fs");
const zipUtil = require("../js/zip-util");

/**
 * 检查是否为Lottie文件
 */
async function isLottieFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(content);
    return data.v && (data.layers || data.assets);
  } catch (error) {
    return false;
  }
}

/**
 * 分析Lottie数据，提取颜色信息
 */
function analyzeLottieData(lottieData) {
  const colors = new Set();
  
  // 递归提取颜色
  function extractColors(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (Array.isArray(obj)) {
      obj.forEach(extractColors);
      return;
    }
    
    // 检查是否为颜色数组 [r, g, b, a]
    if (Array.isArray(obj) && obj.length >= 3 && obj.length <= 4) {
      const [r, g, b, a = 1] = obj;
      if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number') {
        const hexColor = convertLottieColorToHex([r, g, b, a]);
        if (hexColor) colors.add(hexColor);
      }
      return;
    }
    
    // 检查颜色属性
    if (obj.c && Array.isArray(obj.c)) {
      const hexColor = convertLottieColorToHex(obj.c);
      if (hexColor) colors.add(hexColor);
    }
    
    // 递归处理其他属性
    Object.values(obj).forEach(extractColors);
  }
  
  extractColors(lottieData);
  
  const colorArray = Array.from(colors);
  return {
    dominantColors: colorArray.slice(0, 3),
    totalColors: colorArray.length,
    colorPalette: colorArray
  };
}

/**
 * 从图层中提取颜色
 */
function extractColorsFromLayer(layer, colorArray) {
  if (layer.shapes) {
    extractColorsFromShapes(layer.shapes, colorArray);
  }
  
  if (layer.layers) {
    layer.layers.forEach(subLayer => {
      extractColorsFromLayer(subLayer, colorArray);
    });
  }
}

/**
 * 从形状中提取颜色
 */
function extractColorsFromShapes(shapes, colorArray) {
  shapes.forEach(shape => {
    if (shape.it) {
      shape.it.forEach(item => {
        if (item.c && Array.isArray(item.c)) {
          const hexColor = convertLottieColorToHex(item.c);
          if (hexColor) colorArray.push(hexColor);
        }
      });
    }
  });
}

/**
 * 将Lottie颜色数组转换为十六进制
 */
function convertLottieColorToHex(colorArray) {
  if (!Array.isArray(colorArray) || colorArray.length < 3) return null;
  
  const [r, g, b, a = 1] = colorArray;
  const red = Math.round(r * 255);
  const green = Math.round(g * 255);
  const blue = Math.round(b * 255);
  
  return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

/**
 * 绘制ZIP播放按钮（使用playbtn.png）
 */
async function drawZipPlayButton(svg, centerX, centerY, size) {
  try {
    const playbtnPath = path.join(__dirname, '..', 'images', 'playbtn.png');
    const playbtnBuffer = await fs.promises.readFile(playbtnPath);
    const base64Data = playbtnBuffer.toString('base64');
    
    const buttonSize = size * 0.8;
    const x = centerX - buttonSize / 2;
    const y = centerY - buttonSize / 2;
    
    svg += `<image href="data:image/png;base64,${base64Data}" x="${x}" y="${y}" width="${buttonSize}" height="${buttonSize}" />`;
    
    return svg;
  } catch (error) {
    console.log('无法加载playbtn.png，使用SVG绘制播放按钮');
    return drawBasicZipPlayButton(svg, centerX, centerY, size);
  }
}

/**
 * 绘制基础ZIP播放按钮（SVG）
 */
function drawBasicZipPlayButton(svg, centerX, centerY, size) {
  const buttonSize = size * 0.6;
  const triangleSize = buttonSize * 0.4;
  
  // 外圆
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${buttonSize}" fill="rgba(255, 255, 255, 0.2)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="2" />`;
  
  // 播放三角形
  const points = [
    centerX - triangleSize / 2,
    centerY - triangleSize / 2,
    centerX - triangleSize / 2,
    centerY + triangleSize / 2,
    centerX + triangleSize / 2,
    centerY
  ].join(' ');
  
  svg += `<polygon points="${points}" fill="white" />`;
  
  return svg;
}

/**
 * 绘制ZIP标记（SVG版本）
 */
function drawZipBadge(svg, x, y, width, height) {
/*   const cornerRadius = 4;
  
  // ZIP背景
  svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#FF6B35" stroke="#FF4500" stroke-width="1" />`;
  
  // ZIP文字
  const textX = x + width / 2;
  const textY = y + height / 2 + 4;
  svg += `<text x="${textX}" y="${textY}" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">ZIP</text>`;
   */
  return svg;
}

/**
 * 处理包含资源的Lottie文件
 */
async function processLottieWithAssets(lottieData, extractedFiles) {
  const processedData = { ...lottieData };
  
  // 处理资源
  if (processedData.assets) {
    for (let i = 0; i < processedData.assets.length; i++) {
      const asset = processedData.assets[i];
      
      if (asset.p && typeof asset.p === 'string') {
        // 查找对应的文件
        const fileName = asset.p;
        const fileData = extractedFiles[fileName];
        
        if (fileData) {
          const mimeType = getMimeType(fileName);
          const base64Data = await fileToBase64(fileData, mimeType);
          asset.p = `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
  }
  
  return processedData;
}

/**
 * 获取MIME类型
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 将文件转换为Base64
 */
async function fileToBase64(uint8Array, mimeType) {
  return Buffer.from(uint8Array).toString('base64');
}

/**
 * 生成美观的ZIP Lottie预览（SVG版本）
 */
async function generateBeautifulZipLottiePreview(
  lottieData,
  width,
  height,
  metadata = {}
) {
  try {
    const analysis = analyzeLottieData(lottieData);
    console.log("ZIP Lottie分析结果:", analysis);

    const cornerRadius = Math.min(width, height) * 0.15;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 创建SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // 定义圆角矩形
    svg += `<defs><clipPath id="roundedCorners"><rect width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" /></clipPath></defs>`;
    
    // 应用圆角裁剪
    svg += `<g clip-path="url(#roundedCorners)">`;
    
    // 透明背景（不绘制任何背景）
    
    // 如果有分析出的颜色，添加色彩覆盖层
    if (analysis.dominantColors.length > 0) {
      const color = analysis.dominantColors[0];
      svg += `<circle cx="${centerX}" cy="${centerY}" r="${Math.max(width, height) / 2}" fill="${color}" opacity="0.1" />`;
    }
    
    // 绘制ZIP播放按钮
    const buttonSize = Math.min(width, height) * 0.35;
    svg = await drawZipPlayButton(svg, centerX, centerY, buttonSize);
    
/*     // 绘制ZIP标记（右上角）
    svg = drawZipBadge(svg, width - 57, 12, 45, 22); */
    
    svg += `</g></svg>`;
    
    // 将SVG转换为PNG buffer
    return await svgToPngBuffer(svg, width, height);
  } catch (error) {
    console.log("SVG渲染失败，使用基础预览:", error.message);
    return generateBasicZipPreview(width, height, metadata);
  }
}

/**
 * 将SVG转换为PNG buffer
 */
async function svgToPngBuffer(svg, width, height) {
  try {
    // 使用canvas将SVG转换为PNG
    const { createCanvas, loadImage } = require('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 创建透明背景
    ctx.clearRect(0, 0, width, height);
    
    // 将SVG转换为data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    
    // 加载SVG图像
    const img = await loadImage(svgDataUrl);
    ctx.drawImage(img, 0, 0);
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.log('SVG转PNG失败，使用基础预览:', error.message);
    return generateBasicZipPreview(width, height, {});
  }
}

/**
 * 基础ZIP预览（SVG版本）
 */
function generateBasicZipPreview(width, height, metadata) {
  try {
    const centerX = width / 2;
    const centerY = height / 2;
    const buttonSize = Math.min(width, height) * 0.25;
    
    // 创建SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // 透明背景
    
    // 简单播放按钮
    svg += `<circle cx="${centerX}" cy="${centerY}" r="${buttonSize}" fill="rgba(255, 255, 255, 0.2)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="2" />`;
    
    // 播放三角形
    const triangleSize = buttonSize * 0.6;
    const points = [
      centerX - triangleSize / 2,
      centerY - triangleSize / 2,
      centerX - triangleSize / 2,
      centerY + triangleSize / 2,
      centerX + triangleSize / 2,
      centerY
    ].join(' ');
    
    svg += `<polygon points="${points}" fill="white" />`;
    
/*     // ZIP标记
    svg = drawZipBadge(svg, width - 57, 12, 45, 22); */
    
    // 标题
    svg += `<text x="${centerX}" y="${centerY - buttonSize - 20}" text-anchor="middle" fill="white" font-family="Arial" font-size="${Math.max(16, width / 20)}" font-weight="bold">ZIP Lottie</text>`;
    
    svg += `</svg>`;
    
    // 转换为PNG
    return svgToPngBuffer(svg, width, height);
  } catch (error) {
    console.error('基础ZIP预览失败:', error.message);
    return generateMinimalPNG();
  }
}

function generateMinimalPNG() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x00, 0x02, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

/**
 * 主处理函数
 */
module.exports = async ({ src, dest, item }) => {
  let tempDir = null;
  let extractedFiles = [];

  try {
    console.log("=== 美观版ZIP Lottie处理器 ===");
    console.log("源文件:", src);
    console.log("目标文件:", dest);

    const { tempDir: extractedDir, files } = await zipUtil.extractZip(src);
    tempDir = extractedDir;
    extractedFiles = files;
    console.log("✓ ZIP文件解压完成，文件数量:", Object.keys(files).length);

    const lottieJsonPath = await zipUtil.findLottieJsonFile(
      tempDir,
      extractedFiles
    );
    console.log("✓ 找到Lottie JSON文件:", lottieJsonPath);

    if (!(await isLottieFile(lottieJsonPath))) {
      throw new Error("ZIP中的JSON文件不是有效的Lottie文件");
    }

    const lottieData = JSON.parse(
      await fs.promises.readFile(lottieJsonPath, "utf8")
    );

    const originalWidth = lottieData.w || lottieData.width || 512;
    const originalHeight = lottieData.h || lottieData.height || 512;
    const frameRate = lottieData.fr || 30;
    const inPoint = lottieData.ip || 0;
    const outPoint = lottieData.op || 0;
    const duration = (outPoint - inPoint) / frameRate;
    const filename = path.basename(src, ".zip");

    // 判断是否需要放大缩略图尺寸
    let thumbnailWidth = originalWidth;
    let thumbnailHeight = originalHeight;
    let scaleFactor = 1;
    
    if (originalWidth < 250 && originalHeight < 250) {
        scaleFactor = 2;
        thumbnailWidth = originalWidth * scaleFactor;
        thumbnailHeight = originalHeight * scaleFactor;
        console.log(`小尺寸文件检测: ${originalWidth}x${originalHeight} -> 缩略图尺寸放大为 ${thumbnailWidth}x${thumbnailHeight} (${scaleFactor}x)`);
    }

    const metadata = {
      width: originalWidth,
      height: originalHeight,
      frameRate,
      duration,
      name: filename,
      totalFrames: outPoint - inPoint,
      isZip: true,
      thumbnailScale: scaleFactor,
      thumbnailWidth,
      thumbnailHeight
    };

    console.log(
      `ZIP Lottie信息: ${originalWidth}x${originalHeight}, ${duration.toFixed(
        1
      )}s, ${frameRate}fps, ${metadata.totalFrames}帧`
    );
    if (scaleFactor > 1) {
        console.log(`缩略图尺寸: ${thumbnailWidth}x${thumbnailHeight} (${scaleFactor}x 放大)`);
    }

    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log("开始处理外部资源...");
    const processedLottieData = await processLottieWithAssets(
      lottieData,
      files
    );

    const pngBuffer = await generateBeautifulZipLottiePreview(
      processedLottieData,
      thumbnailWidth,
      thumbnailHeight,
      metadata
    );
    console.log(`PNG数据大小: ${pngBuffer.length} bytes`);

    await fs.promises.writeFile(dest, pngBuffer);
    console.log("✓ PNG缩略图已创建");

    const stats = fs.statSync(dest);
    if (stats.size === 0) {
      throw new Error("缩略图文件大小为0");
    }

    console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

    item.height = originalHeight;
    item.width = originalWidth;
    item.lottie = {
      ...metadata,
      duration: `${Math.round(metadata.duration * 100) / 100}秒`,
      frameRate: `${metadata.frameRate}fps`,
      totalFrames: metadata.totalFrames,
      isZip: true,
      extractedJsonPath: lottieJsonPath,
      extractDir: tempDir,
      thumbnailType: "beautiful_svg_zip",
    };

    item.zipExtract = {
      tempDir,
      lottieJsonPath,
      files: extractedFiles,
    };

    console.log("✓ 美观版ZIP Lottie处理完成");
    return item;
  } catch (error) {
    console.error("❌ 美观版ZIP Lottie处理错误:", error);

    if (tempDir) {
      try {
        await zipUtil.cleanupTempDir(tempDir);
      } catch (cleanupError) {
        console.error("清理临时目录失败:", cleanupError.message);
      }
    }

    throw error;
  }
};
