const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色输出函数
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 创建测试用的Lottie JSON文件
function createTestLottieFile(outputPath) {
    const testLottie = {
        "v": "5.7.4",
        "fr": 30,
        "ip": 0,
        "op": 60,
        "w": 512,
        "h": 512,
        "nm": "Test Animation",
        "ddd": 0,
        "assets": [],
        "layers": [
            {
                "ddd": 0,
                "ind": 1,
                "ty": 1,
                "nm": "Test Layer",
                "sr": 1,
                "ks": {
                    "o": {"a": 0, "k": 100},
                    "r": {"a": 0, "k": 0},
                    "p": {"a": 0, "k": [256, 256, 0]},
                    "a": {"a": 0, "k": [0, 0, 0]},
                    "s": {"a": 0, "k": [100, 100, 100]}
                },
                "ao": 0,
                "sw": 512,
                "sh": 512,
                "sc": "#ff0000",
                "ip": 0,
                "op": 60,
                "st": 0,
                "bm": 0
            }
        ],
        "markers": []
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(testLottie, null, 2));
    console.log(colors.green(`✓ 测试Lottie文件已创建: ${outputPath}`));
}

// 创建测试用的ZIP文件 (需要安装 adm-zip: npm install adm-zip)
function createTestZipFile(outputPath) {
    try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip();
        
        // 创建临时的Lottie JSON
        const tempLottieContent = JSON.stringify({
            "v": "5.7.4",
            "fr": 24,
            "ip": 0,
            "op": 48,
            "w": 800,
            "h": 600,
            "nm": "ZIP Test Animation",
            "layers": [
                {
                    "ddd": 0,
                    "ind": 1,
                    "ty": 1,
                    "nm": "ZIP Test Layer",
                    "ks": {
                        "o": {"a": 0, "k": 100},
                        "r": {"a": 0, "k": 0},
                        "p": {"a": 0, "k": [400, 300, 0]},
                        "s": {"a": 0, "k": [100, 100, 100]}
                    },
                    "sw": 800,
                    "sh": 600,
                    "sc": "#0000ff",
                    "ip": 0,
                    "op": 48
                }
            ]
        }, null, 2);
        
        // 添加到ZIP
        zip.addFile("animation.json", Buffer.from(tempLottieContent));
        zip.addFile("images/dummy.png", Buffer.from("dummy"));
        
        // 写入ZIP文件
        zip.writeZip(outputPath);
        console.log(colors.green(`✓ 测试ZIP文件已创建: ${outputPath}`));
    } catch (error) {
        console.log(colors.yellow(`⚠ 无法创建ZIP文件 (需要 adm-zip): ${error.message}`));
        return false;
    }
    return true;
}

// 生成简单的PNG缩略图
function generateTestPNG() {
    // 创建一个简单的红色100x100 PNG
    const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk header
        0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, // 100x100 pixels
        0x08, 0x02, 0x00, 0x00, 0x00, 0xFF, 0x80, 0x02, // 8-bit RGB
        0x03, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk header
        0x54, 0x78, 0x9C, 0x63, 0xF8, 0x0F, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND
        0x42, 0x60, 0x82
    ]);
    return pngData;
}

// 更高质量的PNG生成 (如果canvas可用)
function generateCanvasPNG(width, height, label) {
    try {
        const { createCanvas } = require('canvas');
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(1, '#357abd');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 播放按钮
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.15;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // 三角形
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.3, centerY - radius * 0.4);
        ctx.lineTo(centerX - radius * 0.3, centerY + radius * 0.4);
        ctx.lineTo(centerX + radius * 0.5, centerY);
        ctx.closePath();
        ctx.fillStyle = '#4a90e2';
        ctx.fill();
        
        // 文字
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(16, width / 20)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(label, centerX, height - 30);
        
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.log(colors.yellow(`⚠ Canvas不可用，使用基础PNG: ${error.message}`));
        return generateTestPNG();
    }
}

// 测试Lottie JSON处理器
async function testLottieProcessor(thumbnailScript) {
    console.log(colors.cyan('\n=== 测试 lottie.js 处理器 ==='));
    
    try {
        // 加载处理器
        if (!fs.existsSync(thumbnailScript)) {
            throw new Error(`缩略图脚本不存在: ${thumbnailScript}`);
        }
        
        const processor = require(path.resolve(thumbnailScript));
        console.log(colors.green('✓ 处理器加载成功'));
        
        // 创建测试文件
        const testDir = './lottie_test_output';
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        const testJsonFile = path.join(testDir, 'test_animation.json');
        const thumbnailFile = path.join(testDir, 'test_animation_thumbnail.png');
        
        createTestLottieFile(testJsonFile);
        
        // 模拟Eagle的调用参数
        const mockParams = {
            src: testJsonFile,
            dest: thumbnailFile,
            item: {
                name: 'test_animation.json',
                path: testJsonFile
            }
        };
        
        console.log(colors.blue(`源文件: ${mockParams.src}`));
        console.log(colors.blue(`目标文件: ${mockParams.dest}`));
        
        // 调用处理器
        const result = await processor(mockParams);
        
        // 检查结果
        if (fs.existsSync(thumbnailFile)) {
            const stats = fs.statSync(thumbnailFile);
            console.log(colors.green(`✓ 缩略图生成成功!`));
            console.log(colors.green(`  文件大小: ${stats.size} bytes`));
            console.log(colors.green(`  文件路径: ${thumbnailFile}`));
            
            // 验证PNG格式
            const fileHeader = fs.readFileSync(thumbnailFile, null, 0, 8);
            const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            if (fileHeader.equals(pngSignature)) {
                console.log(colors.green(`✓ PNG格式验证通过`));
            } else {
                console.log(colors.red(`✗ PNG格式验证失败`));
            }
        } else {
            console.log(colors.red(`✗ 缩略图文件未生成`));
        }
        
        console.log(colors.blue(`返回的item信息:`));
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.log(colors.red(`✗ 测试失败: ${error.message}`));
        console.log(colors.red(`错误详情: ${error.stack}`));
    }
}

// 测试ZIP处理器
async function testZipProcessor(thumbnailScript) {
    console.log(colors.cyan('\n=== 测试 lottie-zip.js 处理器 ==='));
    
    try {
        // 加载处理器
        if (!fs.existsSync(thumbnailScript)) {
            throw new Error(`ZIP缩略图脚本不存在: ${thumbnailScript}`);
        }
        
        const processor = require(path.resolve(thumbnailScript));
        console.log(colors.green('✓ ZIP处理器加载成功'));
        
        // 创建测试文件
        const testDir = './lottie_test_output';
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        const testZipFile = path.join(testDir, 'test_animation.zip');
        const thumbnailFile = path.join(testDir, 'test_animation_thumbnail.png');
        
        const zipCreated = createTestZipFile(testZipFile);
        if (!zipCreated) {
            console.log(colors.yellow('⚠ 跳过ZIP测试 (需要 adm-zip 包)'));
            return;
        }
        
        // 模拟Eagle的调用参数
        const mockParams = {
            src: testZipFile,
            dest: thumbnailFile,
            item: {
                name: 'test_animation.zip',
                path: testZipFile
            }
        };
        
        console.log(colors.blue(`源文件: ${mockParams.src}`));
        console.log(colors.blue(`目标文件: ${mockParams.dest}`));
        
        // 调用处理器
        const result = await processor(mockParams);
        
        // 检查结果
        if (fs.existsSync(thumbnailFile)) {
            const stats = fs.statSync(thumbnailFile);
            console.log(colors.green(`✓ ZIP缩略图生成成功!`));
            console.log(colors.green(`  文件大小: ${stats.size} bytes`));
            console.log(colors.green(`  文件路径: ${thumbnailFile}`));
        } else {
            console.log(colors.red(`✗ ZIP缩略图文件未生成`));
        }
        
        console.log(colors.blue(`返回的item信息:`));
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.log(colors.red(`✗ ZIP测试失败: ${error.message}`));
        console.log(colors.red(`错误详情: ${error.stack}`));
    }
}

// 基础PNG生成测试
function testBasicPNGGeneration() {
    console.log(colors.cyan('\n=== 测试基础PNG生成功能 ==='));
    
    try {
        const testDir = './lottie_test_output';
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        // 测试基础PNG
        console.log('测试基础PNG生成...');
        const basicPNG = generateTestPNG();
        const basicFile = path.join(testDir, 'basic_test.png');
        fs.writeFileSync(basicFile, basicPNG);
        console.log(colors.green(`✓ 基础PNG生成成功: ${basicFile} (${basicPNG.length} bytes)`));
        
        // 测试Canvas PNG (如果可用)
        console.log('测试Canvas PNG生成...');
        const canvasPNG = generateCanvasPNG(400, 300, 'Lottie Test');
        const canvasFile = path.join(testDir, 'canvas_test.png');
        fs.writeFileSync(canvasFile, canvasPNG);
        console.log(colors.green(`✓ Canvas PNG生成成功: ${canvasFile} (${canvasPNG.length} bytes)`));
        
    } catch (error) {
        console.log(colors.red(`✗ PNG生成测试失败: ${error.message}`));
    }
}

// 主测试函数
async function runAllTests() {
    console.log(colors.cyan('🧪 Lottie插件独立测试开始\n'));
    
    // 1. 基础功能测试
    testBasicPNGGeneration();
    
    // 2. 测试JSON处理器
    const lottieScript = './thumbnail/lottie.js';
    if (fs.existsSync(lottieScript)) {
        await testLottieProcessor(lottieScript);
    } else {
        console.log(colors.yellow(`⚠ 找不到 ${lottieScript}`));
    }
    
    // 3. 测试ZIP处理器
    const zipScript = './thumbnail/lottie-zip.js';
    if (fs.existsSync(zipScript)) {
        await testZipProcessor(zipScript);
    } else {
        console.log(colors.yellow(`⚠ 找不到 ${zipScript}`));
    }
    
    console.log(colors.cyan('\n🎉 测试完成!'));
    console.log(colors.blue('检查 ./lottie_test_output/ 目录中的输出文件'));
    console.log(colors.blue('如果看到PNG文件，说明代码功能正常'));
}

// 错误处理
process.on('uncaughtException', (error) => {
    console.log(colors.red(`\n💥 未捕获的错误: ${error.message}`));
    console.log(colors.red(error.stack));
    process.exit(1);
});

// 运行测试
if (require.main === module) {
    runAllTests().catch(error => {
        console.log(colors.red(`\n💥 测试失败: ${error.message}`));
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testLottieProcessor,
    testZipProcessor,
    testBasicPNGGeneration
};