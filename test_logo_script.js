const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 检查logo.png文件
function checkLogoFile() {
    console.log(colors.cyan('\n=== 检查logo.png文件 ==='));
    
    const logoPath = './logo.png';
    if (fs.existsSync(logoPath)) {
        const stats = fs.statSync(logoPath);
        console.log(colors.green(`✓ logo.png 文件存在`));
        console.log(colors.green(`  文件大小: ${stats.size} bytes`));
        
        // 检查PNG文件头
        const header = fs.readFileSync(logoPath, null, 0, 8);
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        const isValidPNG = header.equals(pngSignature);
        
        if (isValidPNG) {
            console.log(colors.green(`✓ logo.png 是有效的PNG文件`));
        } else {
            console.log(colors.red(`✗ logo.png 不是有效的PNG文件`));
        }
        
        return true;
    } else {
        console.log(colors.yellow(`⚠ logo.png 文件不存在`));
        console.log(colors.yellow(`  将使用备选方案生成缩略图`));
        return false;
    }
}

// 创建示例logo.png文件（如果不存在）
function createSampleLogo() {
    console.log(colors.cyan('\n=== 创建示例logo.png ==='));
    
    try {
        const { createCanvas } = require('canvas');
        
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        
        // 创建深色主题的示例logo
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#8B5CF6'); // 紫色
        gradient.addColorStop(1, '#3B82F6'); // 蓝色
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);
        
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(100, 100, 80, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        
        // 绘制Lottie文字
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Lottie', 100, 110);
        
        // 保存logo
        const logoBuffer = canvas.toBuffer('image/png');
        fs.writeFileSync('./logo.png', logoBuffer);
        
        console.log(colors.green(`✓ 示例logo.png已创建 (${logoBuffer.length} bytes)`));
        return true;
        
    } catch (error) {
        console.log(colors.red(`✗ 无法创建示例logo: ${error.message}`));
        return false;
    }
}

// 测试Logo版本的处理器
async function testLogoProcessors() {
    console.log(colors.cyan('\n=== 测试Logo版本处理器 ==='));
    
    try {
        // 测试JSON版本
        if (fs.existsSync('./thumbnail/lottie.js')) {
            console.log(colors.blue('测试Logo版lottie.js...'));
            const lottieProcessor = require('./thumbnail/lottie.js');
            
            const testParams = {
                src: './lottie_test_output/test_animation.json',
                dest: './lottie_test_output/logo_test_thumbnail.png',
                item: { name: 'logo_test.json' }
            };
            
            if (fs.existsSync(testParams.src)) {
                const result = await lottieProcessor(testParams);
                
                if (fs.existsSync(testParams.dest)) {
                    const stats = fs.statSync(testParams.dest);
                    console.log(colors.green(`✓ Logo缩略图生成成功: ${stats.size} bytes`));
                } else {
                    console.log(colors.red(`✗ Logo缩略图文件未生成`));
                }
            } else {
                console.log(colors.yellow(`⚠ 测试文件不存在，请先运行: node test_lottie_plugin.js`));
            }
        }
        
        // 测试ZIP版本
        if (fs.existsSync('./thumbnail/lottie-zip.js')) {
            console.log(colors.blue('测试Logo版lottie-zip.js...'));
            const zipProcessor = require('./thumbnail/lottie-zip.js');
            
            const testParams = {
                src: './lottie_test_output/test_animation.zip',
                dest: './lottie_test_output/logo_zip_test_thumbnail.png',
                item: { name: 'logo_test.zip' }
            };
            
            if (fs.existsSync(testParams.src)) {
                const result = await zipProcessor(testParams);
                
                if (fs.existsSync(testParams.dest)) {
                    const stats = fs.statSync(testParams.dest);
                    console.log(colors.green(`✓ Logo ZIP缩略图生成成功: ${stats.size} bytes`));
                } else {
                    console.log(colors.red(`✗ Logo ZIP缩略图文件未生成`));
                }
            } else {
                console.log(colors.yellow(`⚠ ZIP测试文件不存在，请先运行: node test_lottie_plugin.js`));
            }
        }
        
    } catch (error) {
        console.log(colors.red(`✗ 测试失败: ${error.message}`));
    }
}

// 展示结果
function showResults() {
    console.log(colors.cyan('\n=== 生成的缩略图文件 ==='));
    
    const outputDir = './lottie_test_output';
    if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir).filter(f => f.includes('logo') && f.endsWith('.png'));
        
        if (files.length > 0) {
            files.forEach(file => {
                const filePath = path.join(outputDir, file);
                const stats = fs.statSync(filePath);
                console.log(colors.green(`📁 ${file}: ${stats.size} bytes`));
            });
            
            console.log(colors.blue('\n🖼️  你可以用图片查看器打开这些文件查看效果：'));
            files.forEach(file => {
                console.log(colors.blue(`   open ${outputDir}/${file}`));
            });
        } else {
            console.log(colors.yellow('⚠ 没有找到logo缩略图文件'));
        }
    }
}

// 使用说明
function showInstructions() {
    console.log(colors.cyan('\n=== 使用说明 ==='));
    console.log(colors.blue('1. 确保你的插件根目录有 logo.png 文件'));
    console.log(colors.blue('2. 用新的代码替换 thumbnail/lottie.js 和 thumbnail/lottie-zip.js'));
    console.log(colors.blue('3. 在Eagle中删除现有的Lottie文件，重新导入'));
    console.log(colors.blue('4. 新的缩略图将使用你的logo.png文件，居中显示在深色渐变背景上'));
    
    console.log(colors.yellow('\n💡 设计特点：'));
    console.log(colors.yellow('- 背景：深紫到黑色渐变 (linear-gradient(179.14deg, #1D003D -21.15%, #000000 106.35%))'));
    console.log(colors.yellow('- Logo：完全居中显示，保持原始宽高比'));
    console.log(colors.yellow('- ZIP文件：添加亮蓝色ZIP标记'));
    console.log(colors.yellow('- 信息区域：半透明深紫色背景，白色文字'));
    console.log(colors.yellow('- 推荐logo.png：透明背景或白色图标，200x200像素或更大'));
}

// 主函数
async function runLogoTest() {
    console.log(colors.cyan('🎨 Lottie Logo缩略图测试\n'));
    
    // 1. 检查现有logo
    const hasLogo = checkLogoFile();
    
    // 2. 如果没有logo，创建示例
    if (!hasLogo) {
        createSampleLogo();
    }
    
    // 3. 测试新的处理器
    await testLogoProcessors();
    
    // 4. 展示结果
    showResults();
    
    // 5. 使用说明
    showInstructions();
    
    console.log(colors.cyan('\n🎉 Logo测试完成!'));
}

// 运行测试
if (require.main === module) {
    runLogoTest().catch(error => {
        console.log(colors.red(`\n💥 测试失败: ${error.message}`));
        process.exit(1);
    });
}

module.exports = { runLogoTest };
