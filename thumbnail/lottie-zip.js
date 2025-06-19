const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

/**
 * 使用logo.png作为ZIP缩略图（带ZIP标记）
 */
function generateZipLogoThumbnail(width, height, metadata, filename) {
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
                
                创建指定的渐变背景 linear-gradient(179.14deg, #1D003D -21.15%, #000000 106.35%)
                const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
                gradient.addColorStop(0, '#1D003D'); // 深紫色
                gradient.addColorStop(1, '#000000'); // 黑色
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                
                // 计算logo完全居中的位置和大小
                const maxLogoSize = Math.min(canvasWidth, canvasHeight) * 0.7; // 增大logo占比
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
                
                // 添加ZIP标记（更亮的蓝色在深色背景上更显眼）
                const zipX = canvasWidth - 45;
                const zipY = 15;
                const zipWidth = 35;
                const zipHeight = 18;
                
                // ZIP背景（更亮的蓝色）
                ctx.fillStyle = '#3B82F6';
                ctx.fillRect(zipX, zipY, zipWidth, zipHeight);
                
                // ZIP文字
                ctx.fillStyle = 'white';
                ctx.font = `bold ${Math.max(11, canvasWidth / 35)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('ZIP', zipX + zipWidth/2, zipY + zipHeight/2 + 4);
                
                // 添加信息文字区域（深色背景适配）
                const infoY = canvasHeight - 40;
                ctx.fillStyle = 'rgba(29, 0, 61, 0.8)'; // 使用深紫色半透明背景
                ctx.fillRect(10, infoY, canvasWidth - 20, 30);
                
                ctx.fillStyle = 'white'; // 白色文字在深色背景上
                ctx.font = `${Math.max(12, canvasWidth / 30)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(filename || metadata.name || 'Lottie Animation', canvasWidth / 2, infoY + 20);
                
                return canvas.toBuffer('image/png');
            });
        } else {
            console.log('Logo文件不存在，使用ZIP备选方案');
            return Promise.resolve(generateZipFallbackWithLogo(canvasWidth, canvasHeight, metadata, filename));
        }
        
    } catch (error) {
        console.log('Canvas不可用，使用简单ZIP方案:', error.message);
        return Promise.resolve(generateSimpleZipLogoFallback());
    }
}

/**
 * 使用Canvas但没有logo文件时的ZIP备选方案
 */
function generateZipFallbackWithLogo(canvasWidth, canvasHeight, metadata, filename) {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // 指定的深色渐变背景
        ctx.fillStyle = '#1D003D';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 添加渐变效果
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
        ctx.font = `bold ${Math.max(35, canvasWidth / 12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Lottie', centerX, centerY - 10);
        
        // ZIP装饰 (亮蓝色点)
        ctx.beginPath();
        ctx.arc(centerX - 20, centerY + 20, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#3B82F6';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + 20, centerY + 20, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // ZIP标记（更亮的蓝色）
        const zipX = canvasWidth - 45;
        const zipY = 15;
        const zipWidth = 35;
        const zipHeight = 18;
        
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(zipX, zipY, zipWidth, zipHeight);
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(11, canvasWidth / 35)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('ZIP', zipX + zipWidth/2, zipY + zipHeight/2 + 4);
        
        // 信息文字区域（深色背景适配）
        const infoY = canvasHeight - 40;
        ctx.fillStyle = 'rgba(29, 0, 61, 0.8)';
        ctx.fillRect(10, infoY, canvasWidth - 20, 30);
        
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(12, canvasWidth / 30)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(filename || metadata.name || 'Lottie Animation', centerX, infoY + 20);
        
        return canvas.toBuffer('image/png');
        
    } catch (error) {
        return generateSimpleZipLogoFallback();
    }
}

/**
 * 直接读取logo.png并添加ZIP标记
 */
async function readLogoAndAddZipMark() {
    try {
        const { createCanvas, loadImage } = require('canvas');
        const logoPath = path.join(__dirname, '../logo.png');
        
        if (fs.existsSync(logoPath)) {
            console.log('✓ 读取logo.png并添加深色背景和ZIP标记');
            
            const logo = await loadImage(logoPath);
            const canvas = createCanvas(400, 400);
            const ctx = canvas.getContext('2d');
            
            // 创建指定的深色渐变背景
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, '#1D003D');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 400);
            
            // 计算logo居中位置
            const maxLogoSize = 400 * 0.7;
            const logoAspect = logo.width / logo.height;
            let drawWidth = maxLogoSize;
            let drawHeight = maxLogoSize / logoAspect;
            
            if (drawHeight > maxLogoSize) {
                drawHeight = maxLogoSize;
                drawWidth = maxLogoSize * logoAspect;
            }
            
            const drawX = (400 - drawWidth) / 2;
            const drawY = (400 - drawHeight) / 2;
            
            // 绘制logo居中
            ctx.drawImage(logo, drawX, drawY, drawWidth, drawHeight);
            
            // 添加ZIP标记
            const zipX = 350;
            const zipY = 15;
            const zipWidth = 35;
            const zipHeight = 18;
            
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(zipX, zipY, zipWidth, zipHeight);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ZIP', zipX + zipWidth/2, zipY + zipHeight/2 + 4);
            
            return canvas.toBuffer('image/png');
        }
    } catch (error) {
        console.log('处理logo.png失败:', error.message);
    }
    return null;
}

/**
 * 最简单的ZIP备选方案
 */
function generateSimpleZipLogoFallback() {
    // 一个简单的蓝色PNG，带ZIP标记
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
        
        // IDAT chunk (蓝色背景)
        0x00, 0x00, 0x00, 0x52, 
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
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x21, 0x5D, 0x60, 0x08, 0x91, 
        
        // IEND chunk
        0x00, 0x00, 0x00, 0x00, 
        0x49, 0x45, 0x4E, 0x44, 
        0xAE, 0x42, 0x60, 0x82  
    ]);
    
    return pngData;
}

/**
 * 解压ZIP并找到Lottie JSON文件
 */
async function extractAndFindLottieJson(zipPath) {
    const tempDir = path.join(os.tmpdir(), `lottie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    try {
        console.log(`创建临时目录: ${tempDir}`);
        await fs.promises.mkdir(tempDir, { recursive: true });
        
        console.log(`解压ZIP文件: ${zipPath}`);
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(tempDir, true);
        
        // 递归查找JSON文件
        const findJsonFiles = async (dir) => {
            const files = [];
            const items = await fs.promises.readdir(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = await fs.promises.stat(fullPath);
                
                if (stat.isDirectory()) {
                    files.push(...await findJsonFiles(fullPath));
                } else if (path.extname(item).toLowerCase() === '.json') {
                    files.push(fullPath);
                }
            }
            return files;
        };
        
        const jsonFiles = await findJsonFiles(tempDir);
        console.log(`找到 ${jsonFiles.length} 个JSON文件`);
        
        // 查找有效的Lottie文件
        for (const jsonFile of jsonFiles) {
            if (await isLottieFile(jsonFile)) {
                console.log(`✓ 找到有效的Lottie文件: ${jsonFile}`);
                return { tempDir, lottieJsonPath: jsonFile };
            }
        }
        
        throw new Error('ZIP文件中未找到有效的Lottie JSON文件');
        
    } catch (error) {
        await cleanupTempDir(tempDir);
        throw error;
    }
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
 * 清理临时目录
 */
async function cleanupTempDir(tempDir) {
    if (tempDir && fs.existsSync(tempDir)) {
        try {
            console.log(`清理临时目录: ${tempDir}`);
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.warn(`清理临时目录失败: ${error.message}`);
        }
    }
}

/**
 * 主函数
 */
module.exports = async ({ src, dest, item }) => {
    return new Promise(async (resolve, reject) => {
        let tempDir = null;
        
        try {
            console.log('=== Logo版ZIP Lottie处理器 ===');
            console.log('源文件:', src);
            console.log('目标文件:', dest);
            
            // 1. 解压并找到Lottie文件
            const { tempDir: extractedDir, lottieJsonPath } = await extractAndFindLottieJson(src);
            tempDir = extractedDir;
            
            // 2. 读取Lottie数据
            console.log(`读取Lottie数据: ${lottieJsonPath}`);
            const lottieData = JSON.parse(await fs.promises.readFile(lottieJsonPath, 'utf8'));
            
            // 3. 提取信息
            const width = lottieData.w || lottieData.width || 512;
            const height = lottieData.h || lottieData.height || 512;
            const frameRate = lottieData.fr || 30;
            const inPoint = lottieData.ip || 0;
            const outPoint = lottieData.op || 0;
            const duration = (outPoint - inPoint) / frameRate;
            const filename = path.basename(src, '.zip');
            
            const metadata = {
                width, height, frameRate, duration,
                name: lottieData.nm || filename,
                totalFrames: outPoint - inPoint
            };
            
            console.log(`ZIP Lottie信息: ${width}x${height}, ${duration}s, ${frameRate}fps`);
            
            // 4. 确保目录存在
            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // 5. 尝试使用logo.png并添加ZIP标记
            let pngBuffer = await readLogoAndAddZipMark();
            
            if (!pngBuffer) {
                // 6. 如果处理logo失败，生成包含logo的ZIP缩略图
                console.log('生成ZIP Logo缩略图...');
                const result = generateZipLogoThumbnail(width, height, metadata, filename);
                
                if (result instanceof Promise) {
                    pngBuffer = await result;
                } else {
                    pngBuffer = result;
                }
            }
            
            console.log(`ZIP PNG数据大小: ${pngBuffer.length} bytes`);
            
            // 7. 写入文件
            fs.writeFileSync(dest, pngBuffer);
            console.log('✓ ZIP Logo PNG文件已创建');
            
            // 8. 检查结果
            if (!fs.existsSync(dest)) {
                await cleanupTempDir(tempDir);
                return reject(new Error('zip logo thumbnail generate fail.'));
            }
            
            const stats = fs.statSync(dest);
            if (stats.size === 0) {
                await cleanupTempDir(tempDir);
                return reject(new Error('zip logo thumbnail generate fail.'));
            }
            
            console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);
            
            // 9. 清理临时目录
            await cleanupTempDir(tempDir);
            tempDir = null;
            
            // 10. 更新item信息
            item.height = height;
            item.width = width;
            item.lottie = {
                ...metadata,
                duration: `${Math.round(duration * 100) / 100}秒`,
                frameRate: `${frameRate}fps`,
                isZip: true,
                thumbnailType: 'logo_zip'
            };
            
            return resolve(item);
            
        } catch (err) {
            console.error('❌ ZIP Logo处理错误:', err);
            await cleanupTempDir(tempDir);
            return reject(err);
        }
    });
};