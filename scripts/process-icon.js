const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src-tauri/icons/icon.png');
const outputPath = path.join(__dirname, '../src-tauri/icons/macos-icon-source.png');
const size = 1024; // Standard large icon size
const padding = 125; // Padding to reduce icon logo size (1024 - 2*125 = 774px logo)
// macOS Big Sur+ squircle shape is approx. 22% corner radius of the full size
// but typically for a 1024x1024 canvas, the effective icon area is smaller.
// We will create a transparent canvas, place the resized logo in the center.
// However, the standard macOS icon IS full bleed squircle.
// IF the user wants the LOGO to be smaller inside the squircle, we need a background color.
// IF the current icon IS the shape, and we just need to round it, we just apply a mask.
// BUT usually "icon size equals other apps" means the VISUAL weight matches.
// If the current icon is a square logo filling the whole 512x512, it looks HUGE compared to standard icons.
// Standard macOS icons are effectively 824x824 pixels content area within a 1024x1024 canvas for the main shape (approx).
// Let's assume the user wants their CURRENT image to be the "content" of the icon,
// and it should be contained within the standard macOS squircle shape.

// Strategy:
// 1. Resize input image to approx 85% of target size.
// 2. Composite it over a background if needed? Or just transparent?
// If the user provided a full-square logo, usually they want that square to be "cut" into a squircle.
// Let's try to just resize the image to be slightly smaller (adding transparent padding)
// AND apply a squircle mask if it's not already transparent.
// Actually, tauri's `icon` command generates .icns which supports transparency.
// If we just add transparent padding to the 1024x1024 canvas, the icon will look smaller in the dock.

async function processIcon() {
  console.log('Processing icon...');

  try {
    const original = sharp(inputPath);
    // Standard macOS icons have some padding.
    // A 1024x1024 canvas usually has the main shape around 824x824 to 860x860.
    // Let's go with 85% scale (approx 870px).
    const scaleFactor = 0.85;
    const scaledSize = Math.round(size * scaleFactor);
    const offset = Math.round((size - scaledSize) / 2);

    // Create the rounded rect mask for the SCALED size
    // Radius should be proportional. 225 is for 1024.
    // For 870px, radius ~ 190px.
    const scaledRadius = Math.round(225 * scaleFactor);
    
    const mask = Buffer.from(
      `<svg><rect x="0" y="0" width="${scaledSize}" height="${scaledSize}" rx="${scaledRadius}" ry="${scaledRadius}"/></svg>`
    );

    // 1. Resize original to scaledSize
    // 2. Mask it
    // 3. Composite onto a blank 1024x1024 canvas
    
    // Process the inner icon
    const innerIconBuffer = await original
      .resize(scaledSize, scaledSize, { fit: 'cover' })
      .composite([{
        input: mask,
        blend: 'dest-in'
      }])
      .toBuffer();

    // Composite inner icon onto transparent 1024x1024 canvas
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: innerIconBuffer,
      top: offset,
      left: offset
    }])
    .toFile(outputPath);
      
    console.log(`Created macOS style source icon at ${outputPath}`);
  } catch (error) {
    console.error('Error processing icon:', error);
  }
}

processIcon();
