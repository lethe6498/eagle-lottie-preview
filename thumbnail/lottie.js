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
 * 绘制播放按钮（基于playbtn.png）
 */
async function drawPlayButton(ctx, centerX, centerY, size) {
    try {
        const { loadImage } = require('canvas');
        const playBtnPath = path.join(__dirname, '../images/playbtn.png');
        
        // 如果PNG文件存在，使用PNG图片
        if (fs.existsSync(playBtnPath)) {
            try {
                const image = await loadImage(playBtnPath);
                const drawSize = size;
                ctx.drawImage(image, 
                    centerX - drawSize / 2, 
                    centerY - drawSize / 2, 
                    drawSize, 
                    drawSize
                );
                return; // 成功加载并绘制了PNG
            } catch (error) {
                console.log('加载PNG图片失败，使用基础播放按钮:', error.message);
            }
        }
        
        // 降级到基础播放按钮
        drawBasicPlayButton(ctx, centerX, centerY, size);
    } catch (error) {
        console.log('绘制PNG播放按钮失败，使用基础播放按钮:', error.message);
        drawBasicPlayButton(ctx, centerX, centerY, size);
    }
}

/**
 * 绘制基础播放按钮（降级方案）
 */
function drawBasicPlayButton(ctx, centerX, centerY, size) {
    const buttonSize = size;
    const iconSize = buttonSize * 0.6;

    ctx.save();

    // 背景圆角矩形 - 深紫到黑渐变
    const backgroundGradient = ctx.createLinearGradient(
        centerX - buttonSize / 2, centerY - buttonSize / 2,
        centerX + buttonSize / 2, centerY + buttonSize / 2
    );
    backgroundGradient.addColorStop(0, '#1D003D');
    backgroundGradient.addColorStop(1, '#000000');
    
    const cornerRadius = buttonSize * 0.25;
    ctx.beginPath();
    ctx.roundRect(centerX - buttonSize / 2, centerY - buttonSize / 2, buttonSize, buttonSize, cornerRadius);
    ctx.fillStyle = backgroundGradient;
    ctx.fill();

    // 中心圆形 - 蓝绿渐变
    const circleGradient = ctx.createLinearGradient(
        centerX - iconSize * 0.37, centerY - iconSize * 0.37,
        centerX + iconSize * 0.37, centerY + iconSize * 0.37
    );
    circleGradient.addColorStop(0, '#008CFF');
    circleGradient.addColorStop(1, '#8AFFA1');
    
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
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.restore();
}


/**
 * 生成美观的Lottie预览
 */
async function generateBeautifulLottiePreview(lottieData, width, height, metadata = {}) {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // 添加roundRect polyfill
        addRoundRectPolyfill();

        // 创建深色渐变背景（与ZIP版本保持一致）
        const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
        backgroundGradient.addColorStop(0, '#1D003D');
        backgroundGradient.addColorStop(1, '#000000');
        ctx.fillStyle = backgroundGradient;
        ctx.fillRect(0, 0, width, height);

        // 添加圆角
        const cornerRadius = Math.min(width, height) * 0.15;
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, cornerRadius);
        ctx.clip();

        const centerX = width / 2;
        const centerY = height / 2;

        // 绘制播放按钮
        const buttonSize = Math.min(width, height) * 0.35;
        await drawPlayButton(ctx, centerX, centerY, buttonSize);

        return canvas.toBuffer('image/png');

    } catch (error) {
        console.log('Canvas渲染失败，使用基础预览:', error.message);
        return generateBasicPreview(width, height, metadata);
    }
}

/**
 * Canvas的roundRect polyfill
 */
function addRoundRectPolyfill() {
    const { CanvasRenderingContext2D } = require('canvas');
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
}

/**
 * 基础预览
 */
function generateBasicPreview(width, height, metadata) {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // 添加roundRect polyfill
        addRoundRectPolyfill();

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

            const pngBuffer = await generateBeautifulLottiePreview(lottieData, width, height, metadata);
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