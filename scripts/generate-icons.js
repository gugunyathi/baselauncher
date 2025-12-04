// Script to generate app icons
// Run with: node scripts/generate-icons.js

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple Base-themed icon as SVG
const createSvgIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0052FF"/>
      <stop offset="100%" style="stop-color:#0040DD"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial Black, Arial, sans-serif" font-size="${size * 0.5}" font-weight="900" fill="white">B</text>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

async function generateIcons() {
  // Generate 512x512 PNG
  const svg512 = Buffer.from(createSvgIcon(512));
  await sharp(svg512)
    .png()
    .toFile(path.join(publicDir, 'logo512.png'));
  console.log('Created logo512.png');

  // Generate 192x192 PNG
  const svg192 = Buffer.from(createSvgIcon(192));
  await sharp(svg192)
    .png()
    .toFile(path.join(publicDir, 'logo192.png'));
  console.log('Created logo192.png');

  // Generate favicon.ico (32x32)
  const svg32 = Buffer.from(createSvgIcon(32));
  await sharp(svg32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
