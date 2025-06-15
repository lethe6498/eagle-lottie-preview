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
 * 从Lottie文件中提取第一帧作为预览图
 * 使用JSON数据内容创建预览图
 */
function createLottiePreviewFromJSON(lottieData, metadata, filename) {
    const { width, height, duration, frameRate, totalFrames } = metadata;

    // 计算长宽比，确保SVG尺寸合适
    const aspectRatio = width / height;
    let svgWidth = 400;
    let svgHeight = Math.round(svgWidth / aspectRatio);

    // 如果高度太大，则按高度调整
    if (svgHeight > 400) {
        svgHeight = 400;
        svgWidth = Math.round(svgHeight * aspectRatio);
    }

    // 从Lottie数据创建JSON预览
    // 提取最多500个字符的JSON内容作为背景
    const jsonPreview = JSON.stringify(lottieData, null, 2).slice(0, 500);
    const jsonLines = jsonPreview.split('\n');

    // 创建带有JSON内容的SVG
    const svgContent = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e293b" />
                <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
            <style>
                .code-text {
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    fill: #94a3b8;
                }
                .highlight {
                    fill: #38bdf8;
                }
                .string {
                    fill: #a5f3fc;
                }
                .number {
                    fill: #fb7185;
                }
                .boolean {
                    fill: #fb923c;
                }
                .key {
                    fill: #a5b4fc;
                }
                .punctuation {
                    fill: #e2e8f0;
                }
                .info-text {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    fill: #94a3b8;
                }
                .title-text {
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    font-weight: bold;
                    fill: #f1f5f9;
                }
                .container {
                    opacity: 0.9;
                }
                @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.4; }
                }
                .animated-layer {
                    animation: pulse 2s infinite ease-in-out;
                }
                .zip-badge {
                    font-family: Arial, sans-serif;
                    font-size: 10px;
                    font-weight: bold;
                    fill: white;
                }
                .zip-badge-bg {
                    fill: #2563eb;
                }
            </style>
        </defs>
        
        <!-- 背景 -->
        <rect width="100%" height="100%" rx="8" fill="url(#bg-gradient)"/>
        
        <!-- JSON预览文本 - 主要内容 -->
        <g class="container" transform="translate(10, 30)">
            ${jsonLines.map((line, i) => {
        // 为不同类型的内容添加颜色高亮
        const highlightedLine = line
            .replace(/("[^"]*")/g, '<tspan class="string">$1</tspan>')
            .replace(/\b(\d+)\b/g, '<tspan class="number">$1</tspan>')
            .replace(/\b(true|false)\b/g, '<tspan class="boolean">$1</tspan>')
            .replace(/(".*?"):/g, '<tspan class="key">$1</tspan>:')
            .replace(/([{}[\],])/g, '<tspan class="punctuation">$1</tspan>');

        return `<text x="0" y="${i * 12}" class="code-text animated-layer">${highlightedLine}</text>`;
    }).join('')}
        </g>
        
        <!-- 动画信息覆盖层 -->
        <rect x="10" y="${svgHeight - 60}" width="${svgWidth - 20}" height="45" rx="5" fill="rgba(15, 23, 42, 0.8)" />
        
        <!-- 标题 -->
        <g transform="translate(${svgWidth / 2}, ${svgHeight - 45})">
            <text class="title-text" text-anchor="middle">
                ${filename || 'Lottie Animation'}
            </text>
        </g>
        
        <!-- 底部的信息展示 -->
        <g transform="translate(${svgWidth / 2}, ${svgHeight - 25})">
            <text class="info-text" text-anchor="middle">
                ${width}×${height} • ${Math.round(duration * 10) / 10}s • ${Math.round(frameRate)}fps • ${totalFrames}帧
            </text>
        </g>
        
        <!-- ZIP 标记 -->
        <g transform="translate(${svgWidth - 50}, 22)">
            <rect class="zip-badge-bg" x="0" y="-15" width="40" height="18" rx="9" />
            <text x="20" y="0" class="zip-badge" text-anchor="middle">ZIP</text>
        </g>
    </svg>`;

    return svgContent;
}

/**
 * ZIP格式Lottie缩略图生成器
 */
module.exports = async ({ src, dest, item }) => {
    let tempDir = null;
    let extractedFiles = [];

    try {
        // 1. 解压ZIP文件
        const { tempDir: extractedDir, files } = await zipUtil.extractZip(src);
        tempDir = extractedDir;
        extractedFiles = files;

        // 2. 在解压后的目录中查找Lottie JSON文件
        const lottieJsonPath = await zipUtil.findLottieJsonFile(tempDir, extractedFiles);

        // 3. 读取Lottie数据
        const lottieData = JSON.parse(await fs.promises.readFile(lottieJsonPath, 'utf8'));

        // 4. 提取Lottie元数据
        const metadata = await getLottieMetadata(lottieJsonPath);

        // 5. 获取文件名（使用ZIP文件名）
        const filename = path.basename(src, '.zip');

        // 6. 创建基于JSON内容的SVG缩略图，标记为ZIP
        const svgContent = createLottiePreviewFromJSON(lottieData, metadata, filename);

        // 7. 将SVG保存为缩略图
        await fs.promises.writeFile(dest, Buffer.from(svgContent));

        // 8. 更新项目尺寸和其他信息
        item.height = metadata.height;
        item.width = metadata.width;
        item.lottie = {
            ...metadata,
            duration: `${Math.round(metadata.duration * 100) / 100}秒`,
            frameRate: `${metadata.frameRate}fps`,
            totalFrames: metadata.totalFrames,
            isZip: true,
            extractedJsonPath: lottieJsonPath,
            extractDir: tempDir
        };

        // 9. 存储解压路径到item（这样viewer可以使用）
        item.zipExtract = {
            tempDir,
            lottieJsonPath,
            files: extractedFiles
        };

        // 10. 返回更新后的项目
        return item;
    } catch (error) {
        // 出错时清理临时目录
        await zipUtil.cleanupTempDir(tempDir);
        throw error;
    }
};