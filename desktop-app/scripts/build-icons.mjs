#!/usr/bin/env node
/**
 * Gera assets para o instalador macOS:
 * - icon.png (512×512) a partir de icon.svg — electron-builder gera .icns no build.
 * - dmg-background.png (540×380) — fundo da janela do DMG (arrastar para Aplicativos).
 * Requer: sharp (disponível no workspace raiz).
 */

import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS = join(ROOT, "assets");
const SVG_PATH = join(ASSETS, "icon.svg");
const PNG_PATH = join(ASSETS, "icon.png");
const DMG_BG_PATH = join(ASSETS, "dmg-background.png");
const DMG_BG_WIDTH = 540;
const DMG_BG_HEIGHT = 380;

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("❌ sharp não encontrado. Na raiz do repo: pnpm install");
    process.exit(1);
  }

  if (!existsSync(SVG_PATH)) {
    console.error("❌ Não encontrado:", SVG_PATH);
    process.exit(1);
  }

  console.log("▶ A gerar ícone a partir de", SVG_PATH);

  await sharp(SVG_PATH)
    .resize(512, 512)
    .png()
    .toFile(PNG_PATH);

  console.log("✓", PNG_PATH, "(512×512) — electron-builder usará para gerar .icns no build macOS");

  // Fundo da janela do DMG: cinza claro (experiência clássica macOS)
  await sharp({
    create: {
      width: DMG_BG_WIDTH,
      height: DMG_BG_HEIGHT,
      channels: 3,
      background: { r: 236, g: 236, b: 236 },
    },
  })
    .png()
    .toFile(DMG_BG_PATH);

  console.log("✓", DMG_BG_PATH, `(${DMG_BG_WIDTH}×${DMG_BG_HEIGHT}) — fundo da janela do DMG`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
