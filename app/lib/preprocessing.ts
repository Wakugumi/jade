import { Tensor } from "onnxruntime-web"

import * as Jimp from "jimp"

/**
 * Receive JimpInstance of the image data
  * resize 224 x 224
  * normalize to standard ImageNet's channel-wise mean and std (ResNet50 default weights)
  */
export function preprocess(image: Jimp.JimpInstance): Tensor {

  image.resize({ w: 224, h: 224 });
  const imageBufferData = image.bitmap.data;

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  const [r, g, b] = [[], [], []] as number[][];

  for (let i = 0; i < imageBufferData.length; i += 4) {
    r.push(imageBufferData[i] / 255.0);
    g.push(imageBufferData[i + 1] / 255.0);
    b.push(imageBufferData[i + 2] / 255.0);
  }

  // Normalize per channel
  const normalized = r.map((v, i) => (v - mean[0]) / std[0])
    .concat(g.map((v) => (v - mean[1]) / std[1]))
    .concat(b.map((v) => (v - mean[2]) / std[2]));

  const float32Data = new Float32Array(normalized);
  return new Tensor("float32", float32Data, [1, 3, 224, 224]);
}


