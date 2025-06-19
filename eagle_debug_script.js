const fs = require('fs');
const path = require('path');

// 创建一个简单的调试脚本，用于验证Eagle的插件调用
console.log('=== Eagle插件调试工具 ===');

// 1. 检查插件文件结构
function checkPluginStructure() {
    console.log('\n1. 检查插件文件结构:');
    
    const requiredFiles = [
        'manifest.json',
        'thumbnail/lottie.js',
        'thumbnail/lottie-zip.js'
    ];
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            console.log(`✓ ${file} (${stats.size} bytes)`);
        } else {
            console.log(`✗ ${file} - 文件不存在`);
        }
    });
}

// 2. 检查manifest.json配置
function checkManifest() {
    console.log('\n2. 检查manifest.json配置:');
    
    try {
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        console.log(`✓ 插件名称: ${manifest.name}`);
        console.log(`✓ 版本: ${manifest.version}`);
        
        if (manifest.preview) {
            if (manifest.preview.json) {
                console.log(`✓ JSON预览配置: ${manifest.preview.json.thumbnail.path}`);
            }
            if (manifest.preview.zip) {
                console.log(`✓ ZIP预览配置: ${manifest.preview.zip.thumbnail.path}`);
            }
        }
        
        if (manifest.dependencies) {
            console.log(`✓ 依赖: ${Object.keys(manifest.dependencies).join(', ')}`);
        }
        
    } catch (error) {
        console.log(`✗ manifest.json解析失败: ${error.message}`);
    }
}

// 3. 测试缩略图生成器函数
async function testThumbnailGenerators() {
    console.log('\n3. 测试缩略图生成器:');
    
    try {
        // 测试lottie.js
        console.log('测试 lottie.js...');
        const lottieProcessor = require('./thumbnail/lottie.js');
        console.log('✓ lottie.js 加载成功');
        
        // 测试lottie-zip.js
        console.log('测试 lottie-zip.js...');
        const zipProcessor = require('./thumbnail/lottie-zip.js');
        console.log('✓ lottie-zip.js 加载成功');
        
    } catch (error) {
        console.log(`✗ 加载失败: ${error.message}`);
    }
}

// 4. 创建测试文件供Eagle使用
function createTestFiles() {
    console.log('\n4. 创建Eagle测试文件:');
    
    const testDir = './eagle_test_files';
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }
    
    // 创建测试Lottie JSON
    const testLottie = {
        "v": "5.7.4",
        "fr": 30,
        "ip": 0,
        "op": 90,
        "w": 400,
        "h": 400,
        "nm": "Eagle Test Animation",
        "layers": [
            {
                "ddd": 0,
                "ind": 1,
                "ty": 1,
                "nm": "Background",
                "ks": {
                    "o": {"a": 0, "k": 100},
                    "r": {"a": 0, "k": 0},
                    "p": {"a": 0, "k": [200, 200, 0]},
                    "s": {"a": 0, "k": [100, 100, 100]}
                },
                "sw": 400,
                "sh": 400,
                "sc": "#ff6b6b",
                "ip": 0,
                "op": 90
            }
        ]
    };
    
    const jsonFile = path.join(testDir, 'eagle_test.json');
    fs.writeFileSync(jsonFile, JSON.stringify(testLottie, null, 2));
    console.log(`✓ 创建测试JSON文件: ${jsonFile}`);
    
    // 创建ZIP文件 (如果adm-zip可用)
    try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip();
        zip.addFile("animation.json", Buffer.from(JSON.stringify(testLottie, null, 2)));
        
        const zipFile = path.join(testDir, 'eagle_test.zip');
        zip.writeZip(zipFile);
        console.log(`✓ 创建测试ZIP文件: ${zipFile}`);
    } catch (error) {
        console.log('⚠ 无法创建ZIP文件 (需要adm-zip)');
    }
    
    console.log(`\n📁 测试文件已创建在: ${testDir}`);
    console.log('🦅 你可以将这些文件导入Eagle进行测试！');
}

// 5. 验证生成的PNG文件
function verifyGeneratedPNGs() {
    console.log('\n5. 验证生成的PNG文件:');
    
    const testOutput = './lottie_test_output';
    if (fs.existsSync(testOutput)) {
        const files = fs.readdirSync(testOutput).filter(f => f.endsWith('.png'));
        
        files.forEach(file => {
            const filePath = path.join(testOutput, file);
            const stats = fs.statSync(filePath);
            
            // 读取PNG文件头
            const header = fs.readFileSync(filePath, null, 0, 8);
            const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            const isValidPNG = header.equals(pngSignature);
            
            console.log(`${isValidPNG ? '✓' : '✗'} ${file}: ${stats.size} bytes ${isValidPNG ? '(有效PNG)' : '(无效PNG)'}`);
            
            if (isValidPNG) {
                console.log(`  文件头: ${header.toString('hex')}`);
            }
        });
    } else {
        console.log('✗ 没有找到测试输出目录');
    }
}

// 运行所有检查
async function runAllChecks() {
    checkPluginStructure();
    checkManifest();
    await testThumbnailGenerators();
    createTestFiles();
    verifyGeneratedPNGs();
    
    console.log('\n🎯 调试完成！');
    console.log('📋 如果所有检查都通过，插件应该可以在Eagle中正常工作。');
    console.log('🔄 如果Eagle中还不工作，请重启Eagle并重新加载插件。');
}

runAllChecks().catch(console.error);