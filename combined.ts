/*
 * To check if an image is blank, if not remove the blank edges from the image using sharp and canvas library
 * author: @Blazekiller8
 * modified-on: 2023/06/18
 * NOTE: This doesn't work for images that are enclosed in non-white coloured border
 * reference: https://github.com/Automattic/node-canvas
 */

import fs from "fs";
import sharp from "sharp";
import { createCanvas, Image } from "canvas";
import path from "path";

async function getPixelData(inputImagePath: string) {
  const image = await sharp(inputImagePath);
  const metadata = await image.metadata();
  const rawPixelData = await image.raw().toBuffer();
  return { metadata, rawPixelData };
}

async function isImageWhite(inputImagePath: string) {
  const { metadata, rawPixelData } = await getPixelData(inputImagePath);

  let nonWhitePixelCount = 0;
  for (let i = 0; i < rawPixelData.length; i += 3) {
    const r = rawPixelData[i];
    const g = rawPixelData[i + 1];
    const b = rawPixelData[i + 2];

    if (!(r >= 225 && g >= 225 && b >= 225)) {
      nonWhitePixelCount++;
      if (nonWhitePixelCount >= 225) {
        return false;
      }
    }
  }

  return true;
}

async function removeWhiteEdges(
  inputImagePath: string,
  outputImagePath: string
) {
  const img = new Image();
  img.src = fs.readFileSync(inputImagePath);

  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, img.width, img.height);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const pixelPos = (y * img.width + x) * 4; // pos in data array of pixel (r, g, b, a)

      // Any pixel in a 5px border around the image, or any white pixel attached to such a pixel:
      if (
        x < 5 ||
        x > img.width - 5 ||
        y < 5 ||
        y > img.height - 5 ||
        isPixelWhite(data, pixelPos)
      ) {
        data[pixelPos + 0] = 255; // make pixel fully white
        data[pixelPos + 1] = 255;
        data[pixelPos + 2] = 255;
        data[pixelPos + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(outputImagePath, buf);
}

function isPixelWhite(data: Uint8ClampedArray, index: number) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const a = data[index + 3];
  return r > 200 && g > 200 && b > 200;
}

async function processImage(inputImagePath: string, outputImagePath: string) {
  const imageIsWhite = await isImageWhite(inputImagePath);
  if (!imageIsWhite) {
    removeWhiteEdges(inputImagePath, outputImagePath);
  }
}

// const inputImagePath = "assets/samples/no_border_ad_2.png";
const inputImagePath = "assets/samples/ads/image (2).png";
const inputImageName = path.basename(inputImagePath);
const outputImagePath = path.join("output", inputImageName);
processImage(inputImagePath, outputImagePath);
