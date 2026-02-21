import sharp from "sharp";

export async function processProductImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(600, 600, { fit: "cover", position: "center" })
    .webp({ quality: 82 })
    .toBuffer();
}
