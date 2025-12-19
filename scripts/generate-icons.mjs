/**
 * Generate PNG icons from SVG sources
 * 
 * Creates all the icon sizes needed for the PWA manifest.
 * Run with: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

async function generateIcons() {
  console.log('Generating PNG icons from SVG sources...\n');

  // Regular icon (with rounded corners in the SVG)
  const iconSvg = readFileSync(join(iconsDir, 'icon-512.svg'));
  
  // Maskable icon (content scaled for safe zone)
  const maskableSvg = readFileSync(join(iconsDir, 'icon-maskable.svg'));

  const sizes = [192, 512];

  for (const size of sizes) {
    // Regular icon
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));
    console.log(`✓ Generated icon-${size}.png`);

    // Maskable icon
    await sharp(maskableSvg)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-maskable-${size}.png`));
    console.log(`✓ Generated icon-maskable-${size}.png`);
  }

  // Also generate a 192 version of the regular SVG
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(join(iconsDir, 'icon-192.png'));

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);

