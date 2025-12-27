/**
 * Generate PNG icons from the mascot image
 * 
 * Creates all the icon sizes needed for the PWA manifest.
 * Uses the single mascot PNG as the base, adding colored backgrounds
 * with rounded corners for regular icons and full-bleed for maskable.
 * 
 * Run with: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

// Brand colors
const YELLOW = '#FFB800';
const CHARCOAL = '#2C2C2C';

/**
 * Create a regular icon with rounded corners and mascot centered
 */
async function createRegularIcon(size) {
  const padding = Math.round(size * 0.1); // 10% padding
  const cornerRadius = Math.round(size * 0.22); // ~22% corner radius
  const mascotSize = size - (padding * 2);
  
  // Create rounded rectangle background
  const background = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${YELLOW}"/>
    </svg>
  `);
  
  // Resize mascot to fit with padding
  const mascot = await sharp(join(publicDir, 'mascot.png'))
    .resize(mascotSize, mascotSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  
  // Composite mascot onto background
  return sharp(background)
    .composite([{
      input: mascot,
      top: padding,
      left: padding,
    }])
    .png()
    .toBuffer();
}

/**
 * Create a maskable icon (full-bleed, content in safe zone)
 * Safe zone is the center 80% circle, so we scale content to ~64% and center it
 */
async function createMaskableIcon(size) {
  const safeZoneScale = 0.64; // Content at 64% to stay within 80% safe zone
  const mascotSize = Math.round(size * safeZoneScale);
  const offset = Math.round((size - mascotSize) / 2);
  
  // Create full background (no rounded corners for maskable)
  const background = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${YELLOW}"/>
    </svg>
  `);
  
  // Resize mascot for safe zone
  const mascot = await sharp(join(publicDir, 'mascot.png'))
    .resize(mascotSize, mascotSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  
  // Composite mascot onto background, centered
  return sharp(background)
    .composite([{
      input: mascot,
      top: offset,
      left: offset,
    }])
    .png()
    .toBuffer();
}

async function generateIcons() {
  console.log('Generating PNG icons from mascot...\n');

  const sizes = [192, 512];

  for (const size of sizes) {
    // Regular icon (with rounded corners)
    const regularIcon = await createRegularIcon(size);
    await sharp(regularIcon).toFile(join(iconsDir, `icon-${size}.png`));
    console.log(`✓ Generated icon-${size}.png`);

    // Maskable icon (full-bleed for adaptive icons)
    const maskableIcon = await createMaskableIcon(size);
    await sharp(maskableIcon).toFile(join(iconsDir, `icon-maskable-${size}.png`));
    console.log(`✓ Generated icon-maskable-${size}.png`);
  }

  console.log('\n✅ All icons generated successfully!');
  console.log('💡 The mascot is now your app icon!');
}

generateIcons().catch(console.error);

