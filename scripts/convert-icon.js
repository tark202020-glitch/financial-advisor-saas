const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceImage = path.join(__dirname, '..', 'src', 'app', 'apple-icon1.png');
const appDir = path.join(__dirname, '..', 'src', 'app');

async function convertIcons() {
  console.log('🎨 Starting icon conversion...');
  console.log('Source:', sourceImage);

  // Read the source image
  const image = sharp(sourceImage);
  const metadata = await image.metadata();
  console.log(`Original size: ${metadata.width}x${metadata.height}`);

  // Determine crop area (square, centered)
  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);
  const top = Math.floor((metadata.height - size) / 2);

  // Create a base square image with alpha channel (RGBA required by Next.js)
  const squareImage = sharp(sourceImage)
    .extract({ left, top, width: size, height: size })
    .ensureAlpha();

  // 1. Generate icon.png (512x512) - RGBA
  await squareImage.clone()
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(appDir, 'icon.png'));
  console.log('✅ icon.png (512x512) created');

  // 2. Generate apple-icon.png (180x180) - RGBA
  await squareImage.clone()
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('✅ apple-icon.png (180x180) created');

  // 3. Generate favicon.ico with RGBA PNGs
  const favicon32 = await squareImage.clone()
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toBuffer();

  const favicon16 = await squareImage.clone()
    .resize(16, 16, { fit: 'cover' })
    .png()
    .toBuffer();

  // Create proper ICO file with both 16x16 and 32x32
  const icoBuffer = createIco([
    { size: 16, buffer: favicon16 },
    { size: 32, buffer: favicon32 }
  ]);

  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('✅ favicon.ico (16x16 + 32x32) created');

  // Remove the old --favicon.ico if it exists
  const oldFavicon = path.join(appDir, '--favicon.ico');
  if (fs.existsSync(oldFavicon)) {
    fs.unlinkSync(oldFavicon);
    console.log('🗑️ Removed old --favicon.ico');
  }

  console.log('\n🎉 All icons generated successfully!');
}

function createIco(images) {
  // ICO file format:
  // Header: 6 bytes
  // Directory entries: 16 bytes each
  // Image data: PNG buffers

  const headerSize = 6;
  const dirEntrySize = 16;
  const numImages = images.length;
  const dataOffset = headerSize + (dirEntrySize * numImages);

  // Calculate total size
  let totalSize = dataOffset;
  for (const img of images) {
    totalSize += img.buffer.length;
  }

  const buffer = Buffer.alloc(totalSize);
  let offset = 0;

  // ICO Header
  buffer.writeUInt16LE(0, offset); offset += 2;      // Reserved
  buffer.writeUInt16LE(1, offset); offset += 2;      // Type: 1 = ICO
  buffer.writeUInt16LE(numImages, offset); offset += 2; // Number of images

  // Directory entries
  let imageDataOffset = dataOffset;
  for (const img of images) {
    buffer.writeUInt8(img.size === 256 ? 0 : img.size, offset); offset += 1; // Width
    buffer.writeUInt8(img.size === 256 ? 0 : img.size, offset); offset += 1; // Height
    buffer.writeUInt8(0, offset); offset += 1;        // Color palette
    buffer.writeUInt8(0, offset); offset += 1;        // Reserved
    buffer.writeUInt16LE(1, offset); offset += 2;     // Color planes
    buffer.writeUInt16LE(32, offset); offset += 2;    // Bits per pixel
    buffer.writeUInt32LE(img.buffer.length, offset); offset += 4; // Size of image data
    buffer.writeUInt32LE(imageDataOffset, offset); offset += 4;   // Offset to image data
    imageDataOffset += img.buffer.length;
  }

  // Image data
  for (const img of images) {
    img.buffer.copy(buffer, offset);
    offset += img.buffer.length;
  }

  return buffer;
}

convertIcons().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
