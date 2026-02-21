/**
 * Process ChefIApp logo: remove dark background, keep golden lines transparent.
 * Source: "Logo chefiapp os.png" (golden geometric chef hat on dark bg)
 * Output: "logo-chefiapp-clean.png" (golden lines on transparent bg)
 *
 * Run: node scripts/fix-logo-bg.cjs
 */
const sharp = require("sharp");
const path = require("path");

const src = path.join(
  __dirname,
  "../merchant-portal/public/Logo chefiapp os.png",
);
const dst = path.join(
  __dirname,
  "../merchant-portal/public/logo-chefiapp-clean.png",
);

async function main() {
  const img = sharp(src);
  const meta = await img.metadata();
  const width = meta.width;
  const height = meta.height;
  console.log("Input: " + width + "x" + height);

  const raw = await img.ensureAlpha().raw().toBuffer();

  let kept = 0;
  let removed = 0;

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];

    // Luminance of pixel
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Gold detection: R high, G medium, B low → warm amber/gold tones
    const isGold = r > 100 && g > 60 && r > b * 1.4 && r + g > b * 3;

    // Bright enough and has gold-ish tint → keep
    if (lum > 60 && isGold) {
      // Keep pixel, boost alpha to fully opaque
      raw[i + 3] = 255;
      kept++;
    } else if (lum > 40 && isGold) {
      // Partial transparency for anti-aliased edges
      const alpha = Math.round(((lum - 40) / 20) * 255);
      raw[i + 3] = Math.min(255, alpha);
      kept++;
    } else {
      // Dark background → transparent
      raw[i + 3] = 0;
      removed++;
    }
  }

  console.log("Kept: " + kept + " pixels, Removed: " + removed + " pixels");

  await sharp(raw, { raw: { width: width, height: height, channels: 4 } })
    .png()
    .toFile(dst);

  console.log("DONE: " + dst);
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
