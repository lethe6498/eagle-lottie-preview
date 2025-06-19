const fs = require('fs');
const path = require('path');

/**
 * 检查是否为Lottie文件
 */
async function isLottieFile(filePath) {
    try {
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
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
        frameRate: lottieData.fr || 30
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

    analysis.dominantColors = [...new Set(analysis.dominantColors)].slice(0, 3);
    return analysis;
}

function extractColorsFromLayer(layer, colorArray) {
    if (!layer.shapes) return;

    for (const shape of layer.shapes) {
        if (shape.ty === 'fl' && shape.c && shape.c.k) {
            const color = convertLottieColorToHex(shape.c.k);
            if (color) colorArray.push(color);
        }
        if (shape.ty === 'st' && shape.c && shape.c.k) {
            const color = convertLottieColorToHex(shape.c.k);
            if (color) colorArray.push(color);
        }
        if (shape.ty === 'gr' && shape.it) {
            extractColorsFromShapes(shape.it, colorArray);
        }
    }
}

function extractColorsFromShapes(shapes, colorArray) {
    for (const shape of shapes) {
        if (shape.ty === 'fl' && shape.c && shape.c.k) {
            const color = convertLottieColorToHex(shape.c.k);
            if (color) colorArray.push(color);
        }
        if (shape.ty === 'st' && shape.c && shape.c.k) {
            const color = convertLottieColorToHex(shape.c.k);
            if (color) colorArray.push(color);
        }
        if (shape.ty === 'gr' && shape.it) {
            extractColorsFromShapes(shape.it, colorArray);
        }
    }
}

function convertLottieColorToHex(colorArray) {
    if (!Array.isArray(colorArray) || colorArray.length < 3) return null;

    const r = Math.round(colorArray[0] * 255);
    const g = Math.round(colorArray[1] * 255);
    const b = Math.round(colorArray[2] * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 绘制现代化播放按钮
 */
function drawModernPlayButton(ctx, centerX, centerY, size) {
    const buttonSize = size;
    const iconSize = buttonSize * 0.6;

    // 保存状态
    ctx.save();

    // 外圆背景 - 渐变
    const outerGradient = ctx.createLinearGradient(
        centerX - buttonSize / 2, centerY - buttonSize / 2,
        centerX + buttonSize / 2, centerY + buttonSize / 2
    );
    outerGradient.addColorStop(0, '#008CFF');
    outerGradient.addColorStop(1, '#8AFFA1');

    ctx.beginPath();
    ctx.arc(centerX, centerY, buttonSize / 2, 0, 2 * Math.PI);
    ctx.fillStyle = outerGradient;
    ctx.fill();

    // 内发光效果
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = -3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, buttonSize / 2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 添加模糊的彩色斑点（模拟设计中的模糊效果）
    ctx.globalAlpha = 0.8;
    ctx.filter = 'blur(8px)';

    // 紫色斑点
    const purpleGradient = ctx.createRadialGradient(
        centerX - buttonSize / 4, centerY - buttonSize / 6, 0,
        centerX - buttonSize / 4, centerY - buttonSize / 6, buttonSize / 4
    );
    purpleGradient.addColorStop(0, '#7109E8');
    purpleGradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(centerX - buttonSize / 4, centerY - buttonSize / 6, buttonSize / 4, 0, 2 * Math.PI);
    ctx.fillStyle = purpleGradient;
    ctx.fill();

    // 绿色斑点
    ctx.globalAlpha = 0.6;
    const greenGradient = ctx.createRadialGradient(
        centerX + buttonSize / 6, centerY + buttonSize / 8, 0,
        centerX + buttonSize / 6, centerY + buttonSize / 8, buttonSize / 5
    );
    greenGradient.addColorStop(0, '#7CE970');
    greenGradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(centerX + buttonSize / 6, centerY + buttonSize / 8, buttonSize / 5, 0, 2 * Math.PI);
    ctx.fillStyle = greenGradient;
    ctx.fill();

    // 重置滤镜和透明度
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

    // 播放三角形 - 带渐变和立体效果
    const triangleGradient = ctx.createLinearGradient(
        centerX - iconSize / 3, centerY - iconSize / 2,
        centerX + iconSize / 3, centerY + iconSize / 2
    );
    triangleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    triangleGradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');

    // 三角形阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.moveTo(centerX - iconSize / 3, centerY - iconSize / 2);
    ctx.lineTo(centerX - iconSize / 3, centerY + iconSize / 2);
    ctx.lineTo(centerX + iconSize / 2, centerY);
    ctx.closePath();
    ctx.fillStyle = triangleGradient;
    ctx.fill();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 三角形高光
    ctx.beginPath();
    ctx.moveTo(centerX - iconSize / 3 + 2, centerY - iconSize / 2 + 2);
    ctx.lineTo(centerX - iconSize / 3 + 2, centerY);
    ctx.lineTo(centerX + iconSize / 4, centerY - iconSize / 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    ctx.restore();
}

/**
 * 生成美观的Lottie预览
 */
function generateBeautifulLottiePreview(lottieData, width, height, metadata = {}) {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const analysis = analyzeLottieData(lottieData);
        console.log('Lottie分析结果:', analysis);

        // 创建深色渐变背景（类似设计中的背景）
        const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
        backgroundGradient.addColorStop(0, '#1D003D');
        backgroundGradient.addColorStop(1, '#000000');
        ctx.fillStyle = backgroundGradient;
        ctx.fillRect(0, 0, width, height);

        // 如果有分析出的颜色，在背景上添加微妙的色彩
        if (analysis.dominantColors.length > 0) {
            ctx.globalAlpha = 0.1;
            const colorOverlay = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) / 2
            );
            colorOverlay.addColorStop(0, analysis.dominantColors[0]);
            colorOverlay.addColorStop(1, 'transparent');
            ctx.fillStyle = colorOverlay;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
        }

        // 添加圆角（模拟设计中的圆角）
        const cornerRadius = Math.min(width, height) * 0.15;
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, cornerRadius);
        ctx.clip();

        const centerX = width / 2;
        const centerY = height / 2;

        // 绘制现代化播放按钮
        const buttonSize = Math.min(width, height) * 0.35;
        drawModernPlayButton(ctx, centerX, centerY, buttonSize);

        // 重置裁剪区域
        ctx.restore();
        ctx.save();

        // 绘制Lottie标题
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(16, width / 20)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText('Lottie', centerX, centerY - buttonSize / 2 - 25);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // 绘制动画信息 - 使用更现代的布局
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${Math.max(10, width / 35)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

        const infoY = centerY + buttonSize / 2 + 30;
        const lineHeight = Math.max(12, width / 30);

        // 尺寸信息
        ctx.fillText(`${width} × ${height}`, centerX, infoY);

        // 动画信息
        const duration = analysis.totalFrames / analysis.frameRate;
        ctx.fillText(`${analysis.frameRate}fps • ${duration.toFixed(1)}s • ${analysis.totalFrames} frames`, centerX, infoY + lineHeight);

        // 特性信息
        const features = [];
        if (analysis.layerCount > 0) features.push(`${analysis.layerCount} layers`);
        if (analysis.hasShapes) features.push('Shapes');
        if (analysis.hasImages) features.push('Images');

        if (features.length > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = `${Math.max(9, width / 40)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            ctx.fillText(features.join(' • '), centerX, infoY + lineHeight * 2);
        }

        // 绘制底部颜色条
        if (analysis.dominantColors.length > 0) {
            const barHeight = 3;
            const barWidth = Math.min(width * 0.5, 150);
            const barX = centerX - barWidth / 2;
            const barY = height - 20;

            // 背景条
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(barX - 10, barY - 1, barWidth + 20, barHeight + 2);

            const colorWidth = barWidth / analysis.dominantColors.length;

            for (let i = 0; i < analysis.dominantColors.length; i++) {
                ctx.fillStyle = analysis.dominantColors[i];
                ctx.fillRect(barX + i * colorWidth, barY, colorWidth, barHeight);
            }
        }

        // 文件名
        if (metadata.name) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = `${Math.max(8, width / 45)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            ctx.fillText(metadata.name, centerX, height - 5);
        }

        return canvas.toBuffer('image/png');

    } catch (error) {
        console.log('Canvas渲染失败，使用基础预览:', error.message);
        return generateBasicPreview(width, height, metadata);
    }
}

/**
 * Canvas的roundRect polyfill
 */
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        } else {
            radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
        }

        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();

        return this;
    };
}

/**
 * 基础预览
 */
function generateBasicPreview(width, height, metadata) {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 深色渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1D003D');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 简单播放按钮
        const centerX = width / 2;
        const centerY = height / 2;
        const buttonSize = Math.min(width, height) * 0.25;

        ctx.beginPath();
        ctx.arc(centerX, centerY, buttonSize, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();

        // 播放三角形
        ctx.beginPath();
        ctx.moveTo(centerX - buttonSize / 2, centerY - buttonSize / 2);
        ctx.lineTo(centerX - buttonSize / 2, centerY + buttonSize / 2);
        ctx.lineTo(centerX + buttonSize / 2, centerY);
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();

        // 标题
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(16, width / 20)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Lottie', centerX, centerY - buttonSize - 20);

        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('基础预览失败:', error.message);
        return generateMinimalPNG();
    }
}

function generateMinimalPNG() {
    return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
        0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F, 0x00,
        0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59, 0xE7,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
    ]);
}

/**
 * 主处理函数
 */
module.exports = async ({ src, dest, item }) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('=== 美观版Lottie处理器 ===');
            console.log('源文件:', src);
            console.log('目标文件:', dest);

            if (!await isLottieFile(src)) {
                return reject(new Error('不是有效的Lottie文件'));
            }
            console.log('✓ Lottie文件验证通过');

            const lottieData = JSON.parse(await fs.promises.readFile(src, 'utf8'));

            const width = lottieData.w || lottieData.width || 512;
            const height = lottieData.h || lottieData.height || 512;
            const frameRate = lottieData.fr || 30;
            const inPoint = lottieData.ip || 0;
            const outPoint = lottieData.op || 0;
            const duration = (outPoint - inPoint) / frameRate;
            const name = lottieData.nm || path.basename(src, '.json');

            const metadata = {
                width, height, frameRate, duration, name,
                totalFrames: outPoint - inPoint,
                isZip: false
            };

            console.log(`Lottie信息: ${width}x${height}, ${duration.toFixed(1)}s, ${frameRate}fps, ${metadata.totalFrames}帧`);

            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const pngBuffer = generateBeautifulLottiePreview(lottieData, width, height, metadata);
            console.log(`PNG数据大小: ${pngBuffer.length} bytes`);

            await fs.promises.writeFile(dest, pngBuffer);
            console.log('✓ PNG文件已创建');

            const stats = fs.statSync(dest);
            if (stats.size === 0) {
                return reject(new Error('缩略图文件大小为0'));
            }

            console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

            item.height = height;
            item.width = width;
            item.lottie = {
                ...metadata,
                duration: `${Math.round(duration * 100) / 100}秒`,
                frameRate: `${frameRate}fps`,
                thumbnailType: 'beautiful_canvas',
                isZip: false
            };

            return resolve(item);

        } catch (err) {
            console.error('❌ 美观版Lottie处理错误:', err);
            return reject(err);
        }
    });
};