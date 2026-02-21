#!/usr/bin/env node
/**
 * Gera um QR code para o AppStaff (merchant-portal em /app/staff/home).
 * No iPhone: abre o URL no Safari → "Adicionar ao Ecrã Inicial" = PWA. É o mesmo AppStaff que se vê em http://localhost:5175/app/staff/home.
 *
 * Uso: node scripts/qr-appstaff-ios.mjs [URL]
 *      APP_STAFF_URL=https://... node scripts/qr-appstaff-ios.mjs
 * Saída: merchant-portal/public/qr-appstaff-ios.png
 */

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const addresses = interfaces[name] || [];
    for (const addr of addresses) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return "localhost";
}

const localIp = getLocalIp();

// Por defeito: dev LAN em HTTPS para iPhone (câmera requer secure context).
// Para produção: APP_STAFF_URL=https://app.chefiapp.com/app/staff/home
// Para override manual: APP_STAFF_URL=https://TEU_IP:5175/app/staff/home
const defaultUrl = `https://${localIp}:5175/app/staff/home`;
const url = process.env.APP_STAFF_URL || process.argv[2] || defaultUrl;

const outDir = path.join(rootDir, "merchant-portal", "public");
const outPath = path.join(outDir, "qr-appstaff-ios.png");

// Tamanho em pixels (maior = mais fácil de ler no telemóvel)
const size = 512;
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
  url,
)}&format=png`;

console.log("URL do AppStaff:", url);
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
console.log(
  "No iOS: Câmara ou Safari → apontar ao QR → «Adicionar ao Ecrã Inicial» para PWA.",
);
if (url.includes("localhost")) {
  console.log("");
  console.log(
    "Nota: localhost só funciona neste PC. Para iPhone/iPad na mesma rede, gera de novo com:",
  );
  console.log(
    "  APP_STAFF_URL=http://TEU_IP:5175/app/staff/home pnpm run qr:appstaff-ios",
  );
  console.log("  (substitui TEU_IP pelo IP do teu Mac, ex.: 192.168.1.10)");
}
if (url.startsWith("http://")) {
  console.log("");
  console.log("⚠️  URL em HTTP pode bloquear câmara no iPhone. Prefere HTTPS.");
}
