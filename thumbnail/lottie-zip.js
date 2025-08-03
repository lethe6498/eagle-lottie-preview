const fs = require("fs");
const path = require("path");
const os = require("os");
const zipUtil = require("../js/zip-util");

/**
 * 检查是否为Lottie文件
 */
async function isLottieFile(filePath) {
  try {
    const data = JSON.parse(await fs.promises.readFile(filePath, "utf8"));
    return (
      data.v !== undefined &&
      data.ip !== undefined &&
      data.op !== undefined &&
      data.fr !== undefined &&
      (data.w !== undefined || data.width !== undefined) &&
      (data.h !== undefined || data.height !== undefined) &&
      data.layers !== undefined
    );
  } catch (error) {
    return false;
  }
}

/**
 * 分析Lottie数据
 */
function analyzeLottieData(lottieData) {
  const analysis = {
    dominantColors: [],
    hasShapes: false,
    hasImages: false,
    layerCount: 0,
    backgroundColor: null,
    totalFrames: (lottieData.op || 60) - (lottieData.ip || 0),
    frameRate: lottieData.fr || 30,
  };

  if (lottieData.bg) {
    analysis.backgroundColor = lottieData.bg;
  }

  if (lottieData.layers && Array.isArray(lottieData.layers)) {
    analysis.layerCount = lottieData.layers.length;

    for (const layer of lottieData.layers) {
      if (layer.ty === 4 && layer.shapes) {
        analysis.hasShapes = true;
        extractColorsFromLayer(layer, analysis.dominantColors);
      }
      if (layer.ty === 2) {
        analysis.hasImages = true;
      }
      if (layer.ty === 1 && layer.sc) {
        analysis.dominantColors.push(layer.sc);
      }
    }
  }

  if (lottieData.assets && Array.isArray(lottieData.assets)) {
    for (const asset of lottieData.assets) {
      if (asset.p && !asset.e) {
        analysis.hasImages = true;
      }
    }
  }

  analysis.dominantColors = [...new Set(analysis.dominantColors)].slice(0, 3);
  return analysis;
}

function extractColorsFromLayer(layer, colorArray) {
  if (!layer.shapes) return;

  for (const shape of layer.shapes) {
    if (shape.ty === "fl" && shape.c && shape.c.k) {
      const color = convertLottieColorToHex(shape.c.k);
      if (color) colorArray.push(color);
    }
    if (shape.ty === "st" && shape.c && shape.c.k) {
      const color = convertLottieColorToHex(shape.c.k);
      if (color) colorArray.push(color);
    }
    if (shape.ty === "gr" && shape.it) {
      extractColorsFromShapes(shape.it, colorArray);
    }
  }
}

function extractColorsFromShapes(shapes, colorArray) {
  for (const shape of shapes) {
    if (shape.ty === "fl" && shape.c && shape.c.k) {
      const color = convertLottieColorToHex(shape.c.k);
      if (color) colorArray.push(color);
    }
    if (shape.ty === "st" && shape.c && shape.c.k) {
      const color = convertLottieColorToHex(shape.c.k);
      if (color) colorArray.push(color);
    }
    if (shape.ty === "gr" && shape.it) {
      extractColorsFromShapes(shape.it, colorArray);
    }
  }
}

function convertLottieColorToHex(colorArray) {
  if (!Array.isArray(colorArray) || colorArray.length < 3) return null;

  const r = Math.round(colorArray[0] * 255);
  const g = Math.round(colorArray[1] * 255);
  const b = Math.round(colorArray[2] * 255);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * 绘制ZIP播放按钮（基于playbtn.png）
 */
async function drawZipPlayButton(ctx, centerX, centerY, size) {
  try {
    const { loadImage } = require("canvas");
    const playBtnPath = path.join(__dirname, "../images/playbtn.png");

    // 如果PNG文件存在，使用PNG图片
    if (fs.existsSync(playBtnPath)) {
      try {
        const image = await loadImage(playBtnPath);
        const drawSize = size;
        ctx.drawImage(
          image,
          centerX - drawSize / 2,
          centerY - drawSize / 2,
          drawSize,
          drawSize
        );
        return; // 成功加载并绘制了PNG
      } catch (error) {
        console.log("加载PNG图片失败，使用基础播放按钮:", error.message);
      }
    }

    // 降级到基础播放按钮
    drawBasicZipPlayButton(ctx, centerX, centerY, size);
  } catch (error) {
    console.log("绘制PNG播放按钮失败，使用基础播放按钮:", error.message);
    drawBasicZipPlayButton(ctx, centerX, centerY, size);
  }
}

/**
 * 绘制基础ZIP播放按钮（降级方案）
 */
function drawBasicZipPlayButton(ctx, centerX, centerY, size) {
  const buttonSize = size;
  const iconSize = buttonSize * 0.6;

  ctx.save();

  // 背景圆角矩形 - 深紫到黑渐变
  const backgroundGradient = ctx.createLinearGradient(
    centerX - buttonSize / 2,
    centerY - buttonSize / 2,
    centerX + buttonSize / 2,
    centerY + buttonSize / 2
  );
  backgroundGradient.addColorStop(0, "#1D003D");
  backgroundGradient.addColorStop(1, "#000000");

  const cornerRadius = buttonSize * 0.25;
  ctx.beginPath();
  ctx.roundRect(
    centerX - buttonSize / 2,
    centerY - buttonSize / 2,
    buttonSize,
    buttonSize,
    cornerRadius
  );
  ctx.fillStyle = backgroundGradient;
  ctx.fill();

  // 中心圆形 - 蓝绿渐变
  const circleGradient = ctx.createLinearGradient(
    centerX - iconSize * 0.37,
    centerY - iconSize * 0.37,
    centerX + iconSize * 0.37,
    centerY + iconSize * 0.37
  );
  circleGradient.addColorStop(0, "#008CFF");
  circleGradient.addColorStop(1, "#8AFFA1");

  ctx.beginPath();
  ctx.arc(centerX, centerY, iconSize * 0.37, 0, 2 * Math.PI);
  ctx.fillStyle = circleGradient;
  ctx.fill();

  // 播放三角形
  ctx.beginPath();
  ctx.moveTo(centerX - iconSize / 4, centerY - iconSize / 3);
  ctx.lineTo(centerX - iconSize / 4, centerY + iconSize / 3);
  ctx.lineTo(centerX + iconSize / 3, centerY);
  ctx.closePath();
  ctx.fillStyle = "white";
  ctx.fill();

  ctx.restore();
}

/**
 * 绘制ZIP标记
 */
function drawZipBadge(ctx, x, y, width, height) {
  ctx.save();

  // ZIP标记背景 - 现代化设计
  const badgeGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  badgeGradient.addColorStop(0, "#2563eb");
  badgeGradient.addColorStop(1, "#1d4ed8");

  ctx.fillStyle = badgeGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();

  // 添加边框高光
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, 7);
  ctx.stroke();

  // ZIP文字
  ctx.fillStyle = "white";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ZIP", x + width / 2, y + height / 2);

  ctx.restore();
}

/**
 * 处理外部资源
 */
async function processLottieWithAssets(lottieData, extractedFiles) {
  try {
    if (!lottieData.assets || !Array.isArray(lottieData.assets)) {
      return lottieData;
    }

    console.log("开始处理ZIP中的资源，assets 数量:", lottieData.assets.length);

    const imageFiles = Object.keys(extractedFiles).filter((filename) => {
      const ext = filename.split(".").pop().toLowerCase();
      return ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext);
    });

    console.log("找到图片文件:", imageFiles);

    for (let i = 0; i < lottieData.assets.length; i++) {
      const asset = lottieData.assets[i];

      if (asset.e === 1 || !asset.p) continue;

      let matchedFile = null;
      const assetPath = asset.p;

      const possiblePaths = [
        assetPath,
        asset.u ? asset.u + assetPath : null,
        asset.u ? asset.u.replace(/\/$/, "") + "/" + assetPath : null,
        "images/" + assetPath,
        "./images/" + assetPath,
        assetPath.split("/").pop(),
      ].filter(Boolean);

      for (const possiblePath of possiblePaths) {
        matchedFile = imageFiles.find((filename) => {
          return (
            filename === possiblePath ||
            filename.endsWith("/" + possiblePath) ||
            filename.split("/").pop() === possiblePath
          );
        });
        if (matchedFile) {
          console.log("找到匹配文件:", possiblePath, "->", matchedFile);
          break;
        }
      }

      if (matchedFile && extractedFiles[matchedFile]) {
        try {
          const mimeType = getMimeType(matchedFile);
          const base64 = await fileToBase64(
            extractedFiles[matchedFile],
            mimeType
          );

          asset.e = 1;
          asset.p = base64;
          if (asset.u) asset.u = "";

          console.log(`✅ 成功处理资源: ${assetPath} -> ${matchedFile}`);
        } catch (error) {
          console.error(`❌ 处理资源时出错: ${assetPath}`, error);
        }
      } else {
        console.warn(`⚠️ 未找到匹配的图片资源: ${assetPath}`);
      }
    }

    return lottieData;
  } catch (error) {
    console.error("处理外部资源时出错:", error);
    return lottieData;
  }
}

function getMimeType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
  };
  return mimeTypes[ext] || "image/png";
}

async function fileToBase64(uint8Array, mimeType) {
  const base64String = Buffer.from(uint8Array).toString("base64");
  return `data:${mimeType};base64,${base64String}`;
}

/**
 * 生成美观的ZIP Lottie预览
 */
async function generateBeautifulZipLottiePreview(
  lottieData,
  width,
  height,
  metadata = {}
) {
  try {
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // 添加roundRect polyfill
    addRoundRectPolyfill();

    const analysis = analyzeLottieData(lottieData);
    console.log("ZIP Lottie分析结果:", analysis);

    // 创建深色渐变背景（与普通版本保持一致）
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
    backgroundGradient.addColorStop(0, "#1D003D"); // 深紫色
    backgroundGradient.addColorStop(1, "#000000");
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, width, height);

    // 如果有分析出的颜色，添加色彩覆盖层
    if (analysis.dominantColors.length > 0) {
      ctx.globalAlpha = 0.1;
      const colorOverlay = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 2
      );
      colorOverlay.addColorStop(0, analysis.dominantColors[0]);
      colorOverlay.addColorStop(1, "transparent");
      ctx.fillStyle = colorOverlay;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    // 添加圆角
    const cornerRadius = Math.min(width, height) * 0.15;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, cornerRadius);
    ctx.clip();

    const centerX = width / 2;
    const centerY = height / 2;

    /*     // 绘制ZIP标记（右上角）
    drawZipBadge(ctx, width - 57, 12, 45, 22); */

    // 绘制ZIP播放按钮
    const buttonSize = Math.min(width, height) * 0.35;
    await drawZipPlayButton(ctx, centerX, centerY, buttonSize);
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.log("Canvas渲染失败，使用基础预览:", error.message);
    return generateBasicZipPreview(width, height, metadata);
  }
}

/**
 * Canvas的roundRect polyfill
 */
function addRoundRectPolyfill() {
  const { CanvasRenderingContext2D } = require("canvas");
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
      x,
      y,
      width,
      height,
      radius
    ) {
      if (typeof radius === "number") {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
      } else {
        radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
      }

      this.beginPath();
      this.moveTo(x + radius.tl, y);
      this.lineTo(x + width - radius.tr, y);
      this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
      this.lineTo(x + width, y + height - radius.br);
      this.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius.br,
        y + height
      );
      this.lineTo(x + radius.bl, y + height);
      this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
      this.lineTo(x, y + radius.tl);
      this.quadraticCurveTo(x, y, x + radius.tl, y);
      this.closePath();

      return this;
    };
  }
}

function generateBasicZipPreview(width, height, metadata) {
  try {
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // 添加roundRect polyfill
    addRoundRectPolyfill();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1D003D");
    gradient.addColorStop(1, "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // ZIP标记
    drawZipBadge(ctx, 10, 10, 40, 20);

    const centerX = width / 2;
    const centerY = height / 2;
    const buttonSize = Math.min(width, height) * 0.25;

    ctx.beginPath();
    ctx.arc(centerX, centerY, buttonSize, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX - buttonSize / 2, centerY - buttonSize / 2);
    ctx.lineTo(centerX - buttonSize / 2, centerY + buttonSize / 2);
    ctx.lineTo(centerX + buttonSize / 2, centerY);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = `bold ${Math.max(16, width / 20)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("Lottie", centerX, centerY - buttonSize - 30);

    ctx.font = `${Math.max(12, width / 25)}px Arial`;
    ctx.fillText("Archive", centerX, centerY - buttonSize - 10);

    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("基础ZIP预览失败:", error.message);
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

    const width = lottieData.w || lottieData.width || 512;
    const height = lottieData.h || lottieData.height || 512;
    const frameRate = lottieData.fr || 30;
    const inPoint = lottieData.ip || 0;
    const outPoint = lottieData.op || 0;
    const duration = (outPoint - inPoint) / frameRate;
    const filename = path.basename(src, ".zip");

    const metadata = {
      width,
      height,
      frameRate,
      duration,
      name: filename,
      totalFrames: outPoint - inPoint,
      isZip: true,
    };

    console.log(
      `ZIP Lottie信息: ${width}x${height}, ${duration.toFixed(
        1
      )}s, ${frameRate}fps, ${metadata.totalFrames}帧`
    );

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
      width,
      height,
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

    item.height = metadata.height;
    item.width = metadata.width;
    item.lottie = {
      ...metadata,
      duration: `${Math.round(metadata.duration * 100) / 100}秒`,
      frameRate: `${metadata.frameRate}fps`,
      totalFrames: metadata.totalFrames,
      isZip: true,
      extractedJsonPath: lottieJsonPath,
      extractDir: tempDir,
      thumbnailType: "beautiful_canvas_zip",
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
