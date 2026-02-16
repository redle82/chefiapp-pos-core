#!/usr/bin/env node
/**
 * Gera um QR code para abrir o app Expo (AppStaff) no Expo Go (iOS/Android).
 * O QR aponta para exp://TEU_IP:8081 — o telemóvel e o Mac devem estar na mesma rede Wi‑Fi.
 *
 * Uso:
 *   1. Num terminal: pnpm run expo:go (deixa o Metro a correr).
 *   2. Noutro: pnpm run qr:expo-go (gera o PNG).
 *   3. No iPhone: abre a app Câmara ou Expo Go e aponta ao QR.
 *
 * Variáveis opcionais:
 *   EXPO_GO_PORT=8081   (porta do Metro; default 8081)
 *   EXPO_GO_HOST=192.168.1.10  (força o IP em vez de auto-detetar)
 */

import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const qrcodeTerminal = require("qrcode-terminal");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const port = process.env.EXPO_GO_PORT || "8081";
let host = process.env.EXPO_GO_HOST;

if (!host) {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        host = iface.address;
        break;
      }
    }
    if (host) break;
  }
}

if (!host) {
  console.error("Não foi possível obter o IP local. Define EXPO_GO_HOST=TEU_IP");
  process.exit(1);
}

const expUrl = `exp://${host}:${port}`;
const outDir = path.join(rootDir, "mobile-app", "public");
const outPath = path.join(outDir, "qr-expo-go.png");

const size = 512;
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(expUrl)}&format=png`;

console.log("URL Expo Go:", expUrl);
console.log("A gerar QR code...");

const res = await fetch(qrApiUrl);
if (!res.ok) {
  console.error("Erro ao obter QR:", res.status, res.statusText);
  process.exit(1);
}

const buffer = Buffer.from(await res.arrayBuffer());
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, buffer);

console.log("QR guardado em:", outPath);
console.log("");
console.log("--- QR no terminal (escanear com o telemóvel) ---");
qrcodeTerminal.generate(expUrl, { small: true });
console.log("---");
console.log("No iPhone: Câmara ou Expo Go → aponta ao QR. Metro a correr: pnpm run expo:go");
