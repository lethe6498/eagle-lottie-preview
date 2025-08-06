const path = require('path');
const fs = require('fs');

/**
 * 检查是否为Lottie文件
 */
async function isLottieFile(filePath) {
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        return data.v && (data.layers || data.assets);
    } catch (error) {
        return false;
    }
}

/**
 * 绘制播放按钮（使用playbtn.png）
 */
async function drawPlayButton(svg, centerX, centerY, size) {
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
        return drawBasicPlayButton(svg, centerX, centerY, size);
    }
}

/**
 * 绘制基础播放按钮（SVG）
 */
function drawBasicPlayButton(svg, centerX, centerY, size) {
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
 * 生成美观的Lottie预览（SVG版本）
 */
async function generateBeautifulLottiePreview(lottieData, width, height, metadata = {}) {
    try {
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
        
        // 绘制播放按钮
        const buttonSize = Math.min(width, height) * 0.35;
        svg = await drawPlayButton(svg, centerX, centerY, buttonSize);
        
        svg += `</g></svg>`;
        
        // 将SVG转换为PNG buffer
        return await svgToPngBuffer(svg, width, height);

    } catch (error) {
        console.log('SVG渲染失败，使用基础预览:', error.message);
        return generateBasicPreview(width, height, metadata);
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
        return generateBasicPreview(width, height, {});
    }
}

/**
 * 基础预览（SVG版本）
 */
function generateBasicPreview(width, height, metadata) {
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
        
        // 标题
        svg += `<text x="${centerX}" y="${centerY - buttonSize - 20}" text-anchor="middle" fill="white" font-family="Arial" font-size="${Math.max(16, width / 20)}" font-weight="bold">Lottie</text>`;
        
        svg += `</svg>`;
        
        // 转换为PNG
        return svgToPngBuffer(svg, width, height);
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

            const originalWidth = lottieData.w || lottieData.width || 512;
            const originalHeight = lottieData.h || lottieData.height || 512;
            const frameRate = lottieData.fr || 30;
            const inPoint = lottieData.ip || 0;
            const outPoint = lottieData.op || 0;
            const duration = (outPoint - inPoint) / frameRate;
            const name = lottieData.nm || path.basename(src, '.json');

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
                name,
                totalFrames: outPoint - inPoint,
                isZip: false,
                thumbnailScale: scaleFactor,
                thumbnailWidth,
                thumbnailHeight
            };

            console.log(`Lottie信息: ${originalWidth}x${originalHeight}, ${duration.toFixed(1)}s, ${frameRate}fps, ${metadata.totalFrames}帧`);
            if (scaleFactor > 1) {
                console.log(`缩略图尺寸: ${thumbnailWidth}x${thumbnailHeight} (${scaleFactor}x 放大)`);
            }

            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const pngBuffer = await generateBeautifulLottiePreview(lottieData, thumbnailWidth, thumbnailHeight, metadata);
            console.log(`PNG数据大小: ${pngBuffer.length} bytes`);

            await fs.promises.writeFile(dest, pngBuffer);
            console.log('✓ PNG文件已创建');

            const stats = fs.statSync(dest);
            if (stats.size === 0) {
                return reject(new Error('缩略图文件大小为0'));
            }

            console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

            item.height = originalHeight;
            item.width = originalWidth;
            item.lottie = {
                ...metadata,
                duration: `${Math.round(duration * 100) / 100}秒`,
                frameRate: `${frameRate}fps`,
                thumbnailType: 'beautiful_svg',
                isZip: false
            };

            return resolve(item);

        } catch (err) {
            console.error('❌ 美观版Lottie处理错误:', err);
            return reject(err);
        }
    });
};