const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 通用ZIP文件解压工具
 * 不依赖外部命令，使用Node.js内置模块
 */

/**
 * 解压ZIP文件到临时目录
 * @param {string} zipPath - ZIP文件路径
 * @returns {Promise<{tempDir: string, files: string[]}>} - 解压后的临时目录路径和文件列表
 */
async function extractZip(zipPath) {
  console.log('开始解压文件:', zipPath);
  
  // 创建临时目录
  const tempDir = path.join(os.tmpdir(), `lottie_zip_${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  // 文件列表
  const files = [];

  try {
    // 首先尝试检查文件是否是真正的ZIP文件
    const fileBuffer = await fs.promises.readFile(zipPath);

    // 检查ZIP文件头部标记
    // ZIP文件的魔术数字是 'PK\x03\x04'
    const isZip = fileBuffer.length > 4 &&
      fileBuffer[0] === 0x50 && // P
      fileBuffer[1] === 0x4B && // K
      fileBuffer[2] === 0x03 &&
      fileBuffer[3] === 0x04;

    if (!isZip) {
      console.log('不是ZIP文件，尝试作为JSON文件处理');
      // 不是ZIP文件，可能是直接的JSON文件
      const destPath = path.join(tempDir, path.basename(zipPath));
      await fs.promises.copyFile(zipPath, destPath);
      files.push(destPath);
      return { tempDir, files };
    }

    console.log('检测到ZIP文件，开始解压');

    // 是ZIP文件，尝试使用内置方法解压
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      console.log(`找到 ${zipEntries.length} 个文件`);

      // 解压所有文件
      zip.extractAllTo(tempDir, true);

      // 收集文件列表
      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          const filePath = path.join(tempDir, entry.entryName);
          files.push(filePath);
          console.log('解压文件:', filePath);
        }
      }

      return { tempDir, files };
    } catch (err) {
      console.error('adm-zip 解压失败:', err);
      throw new Error(`解压ZIP文件失败: ${err.message}`);
    }
  } catch (error) {
    console.error('解压过程出错:', error);
    throw new Error(`解压ZIP文件失败: ${error.message}`);
  }
}

/**
 * 在目录中查找Lottie JSON文件
 * @param {string} dirPath - 目录路径
 * @param {Array<string>} files - 已知文件列表（可选）
 * @returns {Promise<string>} - Lottie JSON文件路径
 */
async function findLottieJsonFile(dirPath, files) {
  try {
    // 获取文件列表
    let fileList = files || [];
    if (!fileList.length) {
      await scanDirectory(dirPath, fileList);
    }

    // 先尝试查找所有 JSON 文件
    const jsonFiles = fileList.filter(file =>
      file.toLowerCase().endsWith('.json') ||
      path.basename(file).toLowerCase() === 'data' ||
      path.basename(file).toLowerCase() === 'animation'
    );

    // 检查每个可能是 Lottie 的文件
    for (const jsonFile of jsonFiles) {
      try {
        const content = await fs.promises.readFile(jsonFile, 'utf8');
        const data = JSON.parse(content);

        // 放宽 Lottie 检测条件
        if (data.layers !== undefined ||
          (data.v !== undefined && data.assets !== undefined)) {
          return jsonFile;
        }
      } catch (e) {
        // 忽略错误，继续检查下一个文件
      }
    }

    // 如果还是找不到，尝试读取任何文本文件
    for (const file of fileList) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        if (content.includes('"layers"') &&
          (content.includes('"v"') || content.includes('"fr"'))) {
          return file;
        }
      } catch (e) {
        // 忽略二进制文件错误
      }
    }

    throw new Error('未在ZIP文件中找到Lottie JSON文件');
  } catch (error) {
    throw error;
  }
}

/**
 * 递归扫描目录，收集所有文件
 * @param {string} dir - 目录路径
 * @param {Array<string>} results - 结果数组
 */
async function scanDirectory(dir, results) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await scanDirectory(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }
}

/**
 * 寻找所有图片文件
 * @param {string} dirPath - 目录路径
 * @param {Array<string>} files - 已知文件列表（可选）
 * @returns {Promise<Array<string>>} - 图片文件路径数组
 */
async function findAllImages(dirPath, files) {
  const images = [];
  const imgExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

  // 如果已经提供了文件列表，直接使用
  let fileList = files;

  // 否则递归读取目录内容
  if (!fileList) {
    fileList = [];
    await scanDirectory(dirPath, fileList);
  }

  // 筛选图片文件
  for (const file of fileList) {
    const ext = path.extname(file).toLowerCase();
    if (imgExtensions.includes(ext)) {
      images.push(file);
    }
  }

  return images;
}

/**
 * 清理临时目录
 * @param {string} tempDir - 临时目录路径
 */
async function cleanupTempDir(tempDir) {
  try {
    if (tempDir && fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`清理临时目录失败: ${error.message}`);
  }
}

module.exports = {
  extractZip,
  findLottieJsonFile,
  findAllImages,
  cleanupTempDir
};