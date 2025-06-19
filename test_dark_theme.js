const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

// 创建深色主题预览
function createDarkThemePreview() {
    console.log(colors.cyan('\n=== 创建深色主题预览 ==='));
    
    try {
        const { createCanvas } = require('canvas');
        
        // 创建预览画布
        const canvas = createCanvas(400, 300);
        const ctx = canvas.getContext('2d');
        
        // 绘制指定的深色渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#1D003D'); // 深紫色
        gradient.addColorStop(1, '#000000'); // 黑色
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // 模拟logo区域（白色虚线框）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        const logoSize = 200;
        const logoX = (400 - logoSize) / 2;
        const logoY = (300 - logoSize) / 2 - 20;
        ctx.strokeRect(logoX, logoY, logoSize, logoSize);
        
        // 添加"Your Logo Here"文字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.setLineDash([]); // 取消虚线
        ctx.fillText('Your Logo Here', 200, 150);
        
        // 模拟信息区域
        const infoY = 250;
        ctx.fillStyle = 'rgba(29, 0, 61, 0.8)';
        ctx.fillRect(10, infoY, 380, 30);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('Lottie Animation • 512×512 • 2.0s • 30fps', 200, infoY + 20);
        
        // 保存预览
        const previewBuffer = canvas.toBuffer('image/png');
        const previewPath = './dark_theme_preview.png';
        fs.writeFileSync(previewPath, previewBuffer);
        
        console.log(colors.green(`✓ 深色主题预览已创建: ${previewPath}`));
        console.log(colors.blue(`📄 文件大小: ${previewBuffer.length} bytes`));
        
        return previewPath;
        
    } catch (error) {
        console.log(colors.red(`✗ 无法创建预览: ${error.message}`));
        return null;
    }
}

// 创建带ZIP标记的预览
function createZipThemePreview() {
    console.log(colors.cyan('\n=== 创建ZIP深色主题预览 ==='));
    
    try {
        const { createCanvas } = require('canvas');
        
        // 创建预览画布
        const canvas = createCanvas(400, 300);
        const ctx = canvas.getContext('2d');
        
        // 绘制指定的深色渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#1D003D'); // 深紫色
        gradient.addColorStop(1, '#000000'); // 黑色
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // 模拟logo区域（白色虚线框）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        const logoSize = 200;
        const logoX = (400 - logoSize) / 2;
        const logoY = (300 - logoSize) / 2 - 20;
        ctx.strokeRect(logoX, logoY, logoSize, logoSize);
        
        // 添加"Your Logo Here"文字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.setLineDash([]); // 取消虚线
        ctx.fillText('Your Logo Here', 200, 150);
        
        // 添加ZIP标记
        const zipX = 350;
        const zipY = 15;
        const zipWidth = 35;
        const zipHeight = 18;
        
        ctx.fillStyle = '#3B82F6'; // 亮蓝色
        ctx.fillRect(zipX, zipY, zipWidth, zipHeight);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('ZIP', zipX + zipWidth/2, zipY + zipHeight/2 + 4);
        
        // 模拟信息区域
        const infoY = 250;
        ctx.fillStyle = 'rgba(29, 0, 61, 0.8)';
        ctx.fillRect(10, infoY, 380, 30);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Lottie Animation.zip • 800×600 • 2.0s • 24fps', 200, infoY + 20);
        
        // 保存预览
        const previewBuffer = canvas.toBuffer('image/png');
        const previewPath = './dark_theme_zip_preview.png';
        fs.writeFileSync(previewPath, previewBuffer);
        
        console.log(colors.green(`✓ ZIP深色主题预览已创建: ${previewPath}`));
        console.log(colors.blue(`📄 文件大小: ${previewBuffer.length} bytes`));
        
        return previewPath;
        
    } catch (error) {
        console.log(colors.red(`✗ 无法创建ZIP预览: ${error.message}`));
        return null;
    }
}

// 显示颜色规格
function showColorSpecs() {
    console.log(colors.cyan('\n=== 深色主题颜色规格 ==='));
    console.log(colors.magenta('🎨 背景渐变：'));
    console.log(colors.blue('   CSS: linear-gradient(179.14deg, #1D003D -21.15%, #000000 106.35%)'));
    console.log(colors.blue('   起始色: #1D003D (深紫色)'));
    console.log(colors.blue('   结束色: #000000 (黑色)'));
    console.log(colors.blue('   方向: 179.14° (几乎垂直向下)'));
    
    console.log(colors.magenta('\n🏷️ ZIP标记：'));
    console.log(colors.blue('   背景色: #3B82F6 (亮蓝色)'));
    console.log(colors.blue('   文字色: #FFFFFF (白色)'));
    console.log(colors.blue('   位置: 右上角'));
    
    console.log(colors.magenta('\n📝 信息区域：'));
    console.log(colors.blue('   背景色: rgba(29, 0, 61, 0.8) (半透明深紫色)'));
    console.log(colors.blue('   文字色: #FFFFFF (白色)'));
    console.log(colors.blue('   位置: 底部居中'));
    
    console.log(colors.magenta('\n🖼️ Logo区域：'));
    console.log(colors.blue('   位置: 完全居中'));
    console.log(colors.blue('   大小: 70% 画布尺寸'));
    console.log(colors.blue('   比例: 保持原始宽高比'));
}

// 提供部署建议
function showDeploymentTips() {
    console.log(colors.cyan('\n=== 部署建议 ==='));
    
    console.log(colors.yellow('📋 Logo文件要求：'));
    console.log(colors.blue('   • 格式：PNG (推荐)'));
    console.log(colors.blue('   • 尺寸：200×200 像素或更大'));
    console.log(colors.blue('   • 背景：透明或白色 (在深色背景上效果最佳)'));
    console.log(colors.blue('   • 内容：简洁图标或文字，避免过于复杂的细节'));
    
    console.log(colors.yellow('\n🔄 更新步骤：'));
    console.log(colors.blue('   1. 备份现有插件文件'));
    console.log(colors.blue('   2. 替换 thumbnail/lottie.js 和 thumbnail/lottie-zip.js'));
    console.log(colors.blue('   3. 更新 manifest.json (版本号到 1.1.0)'));
    console.log(colors.blue('   4. 重启 Eagle'));
    console.log(colors.blue('   5. 删除并重新导入 Lottie 文件'));
    
    console.log(colors.yellow('\n⚡ 性能优化：'));
    console.log(colors.blue('   • 如果logo.png很大，建议优化到 200-400KB'));
    console.log(colors.blue('   • 使用 Canvas 渲染比直接缩放效果更好'));
    console.log(colors.blue('   • 备选方案确保在任何环境下都能工作'));
}

// 主函数
async function runDarkThemeTest() {
    console.log(colors.cyan('🌙 深色主题缩略图预览测试\n'));
    
    // 1. 创建预览图
    const normalPreview = createDarkThemePreview();
    const zipPreview = createZipThemePreview();
    
    // 2. 显示颜色规格
    showColorSpecs();
    
    // 3. 部署建议
    showDeploymentTips();
    
    // 4. 显示结果
    console.log(colors.cyan('\n=== 预览文件 ==='));
    if (normalPreview) {
        console.log(colors.green(`🖼️  JSON文件预览: ${normalPreview}`));
        console.log(colors.blue(`   打开命令: open ${normalPreview}`));
    }
    if (zipPreview) {
        console.log(colors.green(`🗜️  ZIP文件预览: ${zipPreview}`));
        console.log(colors.blue(`   打开命令: open ${zipPreview}`));
    }
    
    console.log(colors.cyan('\n🎉 深色主题预览完成!'));
    console.log(colors.yellow('💡 这些预览图展示了你的logo在实际缩略图中的效果'));
}

// 运行测试
if (require.main === module) {
    runDarkThemeTest().catch(error => {
        console.log(colors.red(`\n💥 预览失败: ${error.message}`));
        process.exit(1);
    });
}

module.exports = { runDarkThemeTest };