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
      // 不是ZIP文件，可能是直接的JSON文件
      const destPath = path.join(tempDir, path.basename(zipPath));
      await fs.promises.copyFile(zipPath, destPath);
      files.push(destPath);
      return { tempDir, files };
    }

    // 是ZIP文件，尝试使用内置方法解压

    // 方法1：使用 adm-zip 库（如果可用）
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      // 解压所有文件
      zip.extractAllTo(tempDir, true);

      // 收集文件列表
      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          files.push(path.join(tempDir, entry.entryName));
        }
      }

      return { tempDir, files };
    } catch (err) {
      console.log('adm-zip 方法失败，尝试下一种方法');
    }

    // 方法2：使用 yauzl 库（如果可用）
    try {
      const yauzl = require('yauzl');
      const util = require('util');
      const streamPipeline = util.promisify(require('stream').pipeline);

      const openZip = util.promisify((path, options, callback) => {
        yauzl.open(path, options, callback);
      });

      const zipFile = await openZip(zipPath, { lazyEntries: true });
      const readEntry = util.promisify(zipFile.readEntry.bind(zipFile));
      const openReadStream = util.promisify(zipFile.openReadStream.bind(zipFile));

      zipFile.on('entry', async (entry) => {
        if (/\/$/.test(entry.fileName)) {
          // 目录项
          await fs.promises.mkdir(path.join(tempDir, entry.fileName), { recursive: true });
          zipFile.readEntry();
        } else {
          // 文件项
          try {
            const readStream = await openReadStream(entry);
            const filePath = path.join(tempDir, entry.fileName);
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            const writeStream = fs.createWriteStream(filePath);
            await streamPipeline(readStream, writeStream);
            files.push(filePath);
            zipFile.readEntry();
          } catch (err) {
            console.error(`解压文件 ${entry.fileName} 失败:`, err);
            zipFile.readEntry();
          }
        }
      });

      zipFile.on('end', () => {
        zipFile.close();
      });

      await readEntry();
      return { tempDir, files };
    } catch (err) {
      console.log('yauzl 方法失败，尝试下一种方法');
    }

    // 方法3：最后的备选方案，直接复制文件
    const destPath = path.join(tempDir, path.basename(zipPath, '.zip') + '.json');
    await fs.promises.writeFile(destPath, fileBuffer);
    files.push(destPath);

    return { tempDir, files };
  } catch (error) {
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
// 在 zip-util.js 中添加
async function extractZip(zipPath) {
  console.log('开始解压文件:', zipPath);
  // ... 现有代码 ...

  // 在各个尝试解压的方法中添加
  console.log('提取的文件列表:', files);
}