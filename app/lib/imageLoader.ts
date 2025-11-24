import * as Jimp from "jimp"

/**
 * Given canvas reference to extract image data into Jimp compatible
  */
export async function transformCanvas(canvas: HTMLCanvasElement): Promise<Jimp.JimpInstance> {
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error("Canvas has no 2D context")

  const image = await Jimp.Jimp.fromBitmap(ctx.getImageData(0, 0, canvas.width, canvas.height))

  return image;
}
