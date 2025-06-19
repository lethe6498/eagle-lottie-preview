const fs = require('fs');
const path = require('path');

/**
 * 使用logo.png作为缩略图
 */
function generateLogoThumbnail(width, height, metadata) {
    try {
        // 尝试使用Canvas处理logo
        const { createCanvas, loadImage } = require('canvas');

        // 计算缩略图尺寸
        const aspectRatio = width / height;
        let canvasWidth = 400;
        let canvasHeight = Math.round(canvasWidth / aspectRatio);

        if (canvasHeight > 400) {
            canvasHeight = 400;
            canvasWidth = Math.round(canvasHeight * aspectRatio);
        }

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // 读取logo.png
        const logoPath = path.join(__dirname, '../logo.png');
        if (fs.existsSync(logoPath)) {
            // 异步加载logo并生成缩略图
            return loadImage(logoPath).then(logo => {
                // 清除画布
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                // 创建指定的渐变背景 linear-gradient(179.14deg, #1D003D -21.15%, #000000 106.35%)
                const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
                gradient.addColorStop(0, '#1D003D'); // 深紫色
                gradient.addColorStop(1, '#000000'); // 黑色
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                // 计算logo居中位置和大小
                const maxLogoSize = Math.min(canvasWidth, canvasHeight) * 0.7;
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;

                // 绘制logo (完全居中，保持宽高比)
                const logoAspect = logo.width / logo.height;
                let drawWidth = maxLogoSize;
                let drawHeight = maxLogoSize / logoAspect;

                if (drawHeight > maxLogoSize) {
                    drawHeight = maxLogoSize;
                    drawWidth = maxLogoSize * logoAspect;
                }

                const drawX = centerX - drawWidth / 2;
                const drawY = centerY - drawHeight / 2;

                ctx.drawImage(logo, drawX, drawY, drawWidth, drawHeight);

                // 添加信息文字区域（深色背景适配）
                const infoY = canvasHeight - 40;
                ctx.fillStyle = 'rgba(29, 0, 61, 0.8)'; // 使用深紫色半透明背景
                ctx.fillRect(10, infoY, canvasWidth - 20, 30);

                ctx.fillStyle = 'white'; // 白色文字在深色背景上
                ctx.font = `${Math.max(12, canvasWidth / 30)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(metadata.name || 'Lottie Animation', canvasWidth / 2, infoY + 20);

                return canvas.toBuffer('image/png');
            });
        } else {
            console.log('Logo文件不存在，使用备选方案');
            return Promise.resolve(generateFallbackWithLogo(canvasWidth, canvasHeight, metadata));
        }

    } catch (error) {
        console.log('Canvas不可用，使用简单logo方案:', error.message);
        return Promise.resolve(generateSimpleLogoFallback());
    }
}

/**
 * 使用Canvas但没有logo文件时的备选方案
 */
function generateFallbackWithLogo(canvasWidth, canvasHeight, metadata) {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // 指定的深色渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#1D003D');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 绘制Lottie文字logo
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        // 大字体Lottie (白色文字)
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(40, canvasWidth / 10)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Lottie', centerX, centerY - 10);

        // 小装饰 (紫色点)
        ctx.beginPath();
        ctx.arc(centerX, centerY + 20, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#8B5CF6'; // 紫色装饰
        ctx.fill();

        // 信息文字区域（深色背景适配）
        const infoY = canvasHeight - 40;
        ctx.fillStyle = 'rgba(29, 0, 61, 0.8)';
        ctx.fillRect(10, infoY, canvasWidth - 20, 30);

        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(12, canvasWidth / 30)}px Arial`;
        ctx.fillText(metadata.name || 'Lottie Animation', centerX, infoY + 20);

        return canvas.toBuffer('image/png');

    } catch (error) {
        return generateSimpleLogoFallback();
    }
}

/**
 * 直接读取logo.png文件作为缩略图
 */
function readLogoDirectly() {
    try {
        const logoPath = path.join(__dirname, '../logo.png');
        if (fs.existsSync(logoPath)) {
            console.log('✓ 直接使用logo.png作为缩略图');
            return fs.readFileSync(logoPath);
        }
    } catch (error) {
        console.log('读取logo.png失败:', error.message);
    }
    return null;
}

/**
 * 最简单的备选方案
 */
function generateSimpleLogoFallback() {
    // 一个简单的白色PNG，中间有"Lottie"文字效果
    const pngData = Buffer.from([
        // PNG signature
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,

        // IHDR chunk (400x300, 8-bit RGB)
        0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x01, 0x90, // width = 400
        0x00, 0x00, 0x01, 0x2C, // height = 300
        0x08, 0x02, 0x00, 0x00, 0x00,
        0x25, 0x15, 0x5D, 0x00,

        // IDAT chunk (白色背景)
        0x00, 0x00, 0x00, 0x4F,
        0x49, 0x44, 0x41, 0x54,
        0x78, 0x9C, 0xED, 0xC1, 0x01, 0x01, 0x00, 0x00,
        0x00, 0x80, 0x90, 0xFE, 0xAF, 0x6E, 0x48, 0x40,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x5D, 0x60, 0x08, 0x91,

        // IEND chunk
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
    ]);

    return pngData;
}

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
 * 单个JSON格式Lottie缩略图生成器
 */
module.exports = async ({ src, dest, item }) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('=== Lottie JSON处理器 ===');
            console.log('源文件:', src);
            console.log('目标文件:', dest);

            // 1. 验证文件
            if (!await isLottieFile(src)) {
                return reject(new Error('不是有效的Lottie文件'));
            }
            console.log('✓ Lottie文件验证通过');

            // 2. 读取Lottie数据
            const lottieData = JSON.parse(await fs.promises.readFile(src, 'utf8'));

            // 3. 提取信息
            const width = lottieData.w || lottieData.width || 512;
            const height = lottieData.h || lottieData.height || 512;
            const frameRate = lottieData.fr || 30;
            const inPoint = lottieData.ip || 0;
            const outPoint = lottieData.op || 0;
            const duration = (outPoint - inPoint) / frameRate;
            const name = lottieData.nm || path.basename(src, '.json');

            const metadata = {
                width, height, frameRate, duration, name,
                totalFrames: outPoint - inPoint
            };

            console.log(`Lottie信息: ${width}x${height}, ${duration}s, ${frameRate}fps`);

            // 4. 确保目录存在
            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 5. 尝试直接使用logo.png
            let pngBuffer = readLogoDirectly();

            if (!pngBuffer) {
                // 6. 如果没有logo.png，生成包含logo的缩略图
                console.log('生成Logo缩略图...');
                const result = generateLogoThumbnail(width, height, metadata);

                if (result instanceof Promise) {
                    pngBuffer = await result;
                } else {
                    pngBuffer = result;
                }
            }

            console.log(`PNG数据大小: ${pngBuffer.length} bytes`);

            // 7. 写入文件
            fs.writeFileSync(dest, pngBuffer);
            console.log('✓ PNG文件已创建');

            // 8. 检查结果
            if (!fs.existsSync(dest)) {
                return reject(new Error('缩略图生成失败'));
            }

            const stats = fs.statSync(dest);
            if (stats.size === 0) {
                return reject(new Error('缩略图文件大小为0'));
            }

            console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

            // 9. 更新item信息
            item.height = height;
            item.width = width;
            item.lottie = {
                ...metadata,
                duration: `${Math.round(duration * 100) / 100}秒`,
                frameRate: `${frameRate}fps`,
                thumbnailType: 'logo',
                isZip: false
            };

            return resolve(item);

        } catch (err) {
            console.error('❌ Lottie处理错误:', err);
            return reject(err);
        }
    });
};