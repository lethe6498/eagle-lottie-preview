const fs = require('fs');
const path = require('path');
const os = require('os');
const zipUtil = require('../js/zip-util');

/**
 * 检查一个JSON文件是否是Lottie动画文件
 * @param {string} filePath - JSON文件路径
 * @returns {Promise<boolean>} - 是否为Lottie文件
 */
async function isLottieFile(filePath) {
    try {
        // 读取并解析JSON文件
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));

        // 检查Lottie文件的特征属性
        return (
            data.v !== undefined && // 版本
            data.ip !== undefined && // 入点
            data.op !== undefined && // 出点
            data.fr !== undefined && // 帧率
            (data.w !== undefined || data.width !== undefined) && // 宽度
            (data.h !== undefined || data.height !== undefined) && // 高度
            data.layers !== undefined // 图层数组
        );
    } catch (error) {
        return false;
    }
}

/**
 * 从Lottie文件中提取元数据
 * @param {string} filePath - Lottie文件路径
 * @returns {Promise<Object>} - 元数据对象
 */
async function getLottieMetadata(filePath) {
    try {
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));

        // 提取基本元数据
        const width = data.w || data.width || 512;
        const height = data.h || data.height || 512;
        const frameRate = data.fr || 30;
        const inPoint = data.ip || 0;
        const outPoint = data.op || 0;
        const duration = (outPoint - inPoint) / frameRate;
        const hasAssets = data.assets && data.assets.some(a => a.p && (a.u || a.p.includes('.')));

        // 提取名称信息
        let name = path.basename(filePath, '.json');
        if (data.nm) {
            name = data.nm;
        }

        // 判断是否有外部图片
        const jsonDir = path.dirname(filePath);
        const imagesDir = path.join(jsonDir, 'images');
        const hasImagesFolder = fs.existsSync(imagesDir);

        return {
            width,
            height,
            frameRate,
            inPoint,
            outPoint,
            duration,
            totalFrames: outPoint - inPoint,
            version: data.v,
            name,
            hasAssets,
            hasImagesFolder,
            isZip: true
        };
    } catch (error) {
        throw new Error(`提取Lottie元数据失败: ${error.message}`);
    }
}

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

                // 添加ZIP标记
                ctx.fillStyle = '#2563eb';
                ctx.fillRect(canvasWidth - 50, 10, 40, 18);
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.fillText('ZIP', canvasWidth - 30, 22);

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

        // 添加ZIP标记
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(canvasWidth - 50, 10, 40, 18);
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText('ZIP', canvasWidth - 30, 22);

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
 * ZIP格式Lottie缩略图生成器
 */
module.exports = async ({ src, dest, item }) => {
    let tempDir = null;
    let extractedFiles = [];

    try {
        console.log('=== ZIP Lottie处理器（使用zipUtil） ===');
        console.log('源文件:', src);
        console.log('目标文件:', dest);

        // 1. 解压ZIP文件
        const { tempDir: extractedDir, files } = await zipUtil.extractZip(src);
        tempDir = extractedDir;
        extractedFiles = files;
        console.log('✓ ZIP文件解压完成');

        // 2. 在解压后的目录中查找Lottie JSON文件
        const lottieJsonPath = await zipUtil.findLottieJsonFile(tempDir, extractedFiles);
        console.log('✓ 找到Lottie JSON文件:', lottieJsonPath);

        // 3. 读取Lottie数据
        const lottieData = JSON.parse(await fs.promises.readFile(lottieJsonPath, 'utf8'));

        // 4. 提取Lottie元数据
        const metadata = await getLottieMetadata(lottieJsonPath);
        console.log(`Lottie信息: ${metadata.width}x${metadata.height}, ${metadata.duration}s, ${metadata.frameRate}fps`);

        // 5. 获取文件名（使用ZIP文件名）
        const filename = path.basename(src, '.zip');
        metadata.name = filename;

        // 6. 确保目录存在
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 7. 尝试直接使用logo.png
        let pngBuffer = readLogoDirectly();

        if (!pngBuffer) {
            // 8. 如果没有logo.png，生成包含logo的缩略图
            console.log('生成Logo缩略图...');
            const result = generateLogoThumbnail(metadata.width, metadata.height, metadata);

            if (result instanceof Promise) {
                pngBuffer = await result;
            } else {
                pngBuffer = result;
            }
        }

        console.log(`PNG数据大小: ${pngBuffer.length} bytes`);

        // 9. 写入PNG文件
        await fs.promises.writeFile(dest, pngBuffer);
        console.log('✓ PNG缩略图已创建');

        // 10. 检查结果
        if (!fs.existsSync(dest)) {
            throw new Error('缩略图生成失败');
        }

        const stats = fs.statSync(dest);
        if (stats.size === 0) {
            throw new Error('缩略图文件大小为0');
        }

        console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

        // 11. 更新项目尺寸和其他信息
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
            thumbnailType: 'logo'
        };

        // 12. 存储解压路径到item（这样viewer可以使用）
        item.zipExtract = {
            tempDir,
            lottieJsonPath,
            files: extractedFiles
        };

        // 13. 返回更新后的项目
        return item;
    } catch (error) {
        console.error('❌ ZIP Lottie处理错误:', error);
        // 出错时清理临时目录
        await zipUtil.cleanupTempDir(tempDir);
        throw error;
    }
};