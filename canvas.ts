/*
 * To check if an image is blank, if not remove the blank edges from the image using canvas library
 * author: @Blazekiller8
 * modified-on: 2023/06/18
 * NOTE: This doesn't work for images that are enclosed in non-white coloured border
 * reference: https://github.com/Automattic/node-canvas
 */

import { createCanvas, Image, ImageData } from "canvas";
import * as fs from "fs";
import path from "path";

function isWhitePixel(imageData: ImageData, x: number, y: number): boolean {
  const index = (y * imageData.width + x) * 4;
  const r = imageData.data[index];
  const g = imageData.data[index + 1];
  const b = imageData.data[index + 2];
  return r === 255 && g === 255 && b === 255;
}

async function processImage(inputPath: string, outputPath: string) {
  // Step 1: Load the image and prepare it for processing.
  const image = new Image();
  image.src = fs.readFileSync(inputPath);
  const { width, height } = image;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);

  // Step 2: Scan through the image's pixel data from outer pixels inward.
  const dx = [1, 0, -1, 0];
  const dy = [0, 1, 0, -1];
  const queue = [
    [0, 0],
    [0, height - 1],
    [width - 1, 0],
    [width - 1, height - 1],
  ]; // Four corners
  const visited = new Set();

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;

    // Check if the pixel has been visited or is out of bounds.
    if (
      x < 0 ||
      x >= width ||
      y < 0 ||
      y >= height ||
      visited.has(y * width + x)
    )
      continue;

    // Step 3: Mark the pixels that belong to the white regions we need to crop off.
    visited.add(y * width + x);
    if (isWhitePixel(imageData, x, y)) {
      for (let direction = 0; direction < 4; direction++) {
        queue.push([x + dx[direction], y + dy[direction]]);
      }
    }
  }

  // Step 4: Find the crop area that excludes the white regions.
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited.has(y * width + x)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  // Step 5: Crop the image.
  const cropCanvas = createCanvas(cropWidth, cropHeight);
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(
    canvas,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  // Step 6: Save the new, cropped image to the output file.
  const outStream = fs.createWriteStream(outputPath);
  const pngStream = cropCanvas.createPNGStream();
  pngStream.pipe(outStream);
  outStream.on("finish", () => console.log("The PNG file was created."));
}

// Run the function with the input and output paths.
// const inputImagePath = "assets/samples/no_border_ad_2.png";
const inputImagePath = "assets/samples/ads/image (2).png";
const inputImageName = path.basename(inputImagePath);
const outputImagePath = path.join("output", inputImageName);
processImage(inputImagePath, outputImagePath).catch(console.error);
