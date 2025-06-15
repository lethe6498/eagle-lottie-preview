/**
 * Utilities for handling Lottie files
 */
const fs = require('fs');
const path = require('path');

/**
 * Check if a JSON file is a Lottie animation
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<boolean>} - True if the file is a Lottie animation
 */
async function isLottieFile(filePath) {
  try {
    // Read and parse the JSON file
    const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));

    // Check for common Lottie properties
    // Lottie files typically have v, ip, op, fr, w, h properties
    return (
      data.v !== undefined && // version
      data.ip !== undefined && // in point
      data.op !== undefined && // out point
      data.fr !== undefined && // frame rate
      (data.w !== undefined || data.width !== undefined) && // width
      (data.h !== undefined || data.height !== undefined) && // height
      data.layers !== undefined // layers array
    );
  } catch (error) {
    return false;
  }
}

/**
 * Get Lottie animation metadata
 * @param {string} filePath - Path to the Lottie file
 * @returns {Promise<Object>} - Metadata object with width, height, duration, etc.
 */
async function getLottieMetadata(filePath) {
  try {
    const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));

    // Extract basic metadata
    const width = data.w || data.width || 0;
    const height = data.h || data.height || 0;
    const frameRate = data.fr || 30;
    const inPoint = data.ip || 0;
    const outPoint = data.op || 0;
    const duration = (outPoint - inPoint) / frameRate;

    return {
      width,
      height,
      frameRate,
      inPoint,
      outPoint,
      duration,
      totalFrames: outPoint - inPoint,
      version: data.v,
      hasAssets: hasExternalAssets(data)
    };
  } catch (error) {
    throw new Error(`Failed to extract Lottie metadata: ${error.message}`);
  }
}

/**
 * Check if a Lottie file has external assets
 * @param {Object} lottieData - Parsed Lottie JSON data
 * @returns {boolean} - True if the animation has external assets
 */
function hasExternalAssets(lottieData) {
  // Check if there are assets with external paths
  if (lottieData.assets) {
    for (const asset of lottieData.assets) {
      if (asset.p && asset.u) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Process Lottie data to fix asset paths
 * @param {Object} lottieData - Parsed Lottie JSON data
 * @param {string} basePath - Base directory path of the Lottie file
 * @returns {Object} - Updated Lottie data with fixed asset paths
 */
function processLottieAssets(lottieData, basePath) {
  if (!lottieData.assets) {
    return lottieData;
  }

  // Create a deep copy to avoid modifying the original
  const processedData = JSON.parse(JSON.stringify(lottieData));

  // Check for images directory
  const imagesDir = path.join(basePath, 'images');
  const hasImagesDir = fs.existsSync(imagesDir);

  if (hasImagesDir) {
    // Update asset paths to use the images directory
    for (const asset of processedData.assets) {
      if (asset.p && asset.u) {
        // Keep the original filename but set the directory to the images folder
        asset.u = 'images/';

        // Check if the file exists in the images directory
        const imagePath = path.join(imagesDir, asset.p);
        if (!fs.existsSync(imagePath)) {
          console.warn(`Asset file not found: ${imagePath}`);
        }
      }
    }
  }

  return processedData;
}

module.exports = {
  isLottieFile,
  getLottieMetadata,
  hasExternalAssets,
  processLottieAssets
};