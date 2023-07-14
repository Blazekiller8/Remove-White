/*
 * To check if an image is blank, if not remove the blank edges from the image using sharp library
 * author: @Blazekiller8
 * modified-on: 2023/06/18
 * NOTE: This doesn't work for images that are enclosed in non-white coloured border
 * reference: https://sharp.pixelplumbing.com/
 */
import sharp from "sharp";
import * as fs from "fs/promises";
import path from "path";

async function isImageBlank(imageBuffer: Buffer): Promise<boolean> {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const AREA_THRESHOLD = 225; // Threshold for non-white area
  const WHITE_COLOR_THRESHOLD = 200; // Threshold for determining white color
  let nonWhitePixelCount = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    // Go through each pixel
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      !(
        r > WHITE_COLOR_THRESHOLD &&
        g > WHITE_COLOR_THRESHOLD &&
        b > WHITE_COLOR_THRESHOLD
      )
    ) {
      // If color of pixel is not white
      nonWhitePixelCount++;
    }

    if (nonWhitePixelCount > AREA_THRESHOLD) {
      return false; // If non-white area is larger than threshold, image is not blank
    }
  }

  return true;
}

async function removeWhitespace(imageBuffer: Buffer): Promise<Buffer> {
  // Fetch image data
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let topMost = info.height;
  let bottomMost = 0;
  let leftMost = info.width;
  let rightMost = 0;

  // Traverse through each pixel to find coordinates of colored pixels
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (info.width * y + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r != 255 || g != 255 || b != 255) {
        // If the pixel is not white
        topMost = Math.min(y, topMost);
        bottomMost = Math.max(y, bottomMost);
        leftMost = Math.min(x, leftMost);
        rightMost = Math.max(x, rightMost);
      }
    }
  }

  // Extract region with colored pixels
  const newImageBuffer = await sharp(imageBuffer)
    .extract({
      left: leftMost,
      top: topMost,
      width: rightMost - leftMost + 1,
      height: bottomMost - topMost + 1,
    })
    .toBuffer();

  return newImageBuffer;
}

async function main(inputImagePath: string, outputImagePath: string) {
  const imageBuffer = await fs.readFile(inputImagePath);

  if (await isImageBlank(imageBuffer)) {
    console.log("Image is blank/white");
  } else {
    console.log("Image is not blank. Removing whitespace...");
    const newImageBuffer = await removeWhitespace(imageBuffer);
    await fs.writeFile(outputImagePath, newImageBuffer);
    console.log(`Whitespace removed and saved to ${outputImagePath}`);
  }
}

const inputImagePath = "assets/samples/no_border_ad_2.png";
// const inputImagePath = "assets/samples/ads/image (2).png";
const inputImageName = path.basename(inputImagePath);
const outputImagePath = path.join("output", inputImageName);
main(inputImagePath, outputImagePath);
