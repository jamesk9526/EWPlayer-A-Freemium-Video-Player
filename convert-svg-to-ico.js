const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createICO(inputSvg, outputIco, sizes = [256, 128, 64, 32, 16]) {
  const buffers = [];

  for (const size of sizes) {
    const buffer = await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toBuffer();
    buffers.push(buffer);
  }

  // Create ICO file structure
  const icoBuffers = [];
  let offset = 6 + sizes.length * 16; // Header + directory entries

  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(sizes.length, 4); // Number of images
  icoBuffers.push(header);

  // Directory entries
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const dirEntry = Buffer.alloc(16);
    dirEntry.writeUInt8(size === 256 ? 0 : size, 0); // Width (0 = 256)
    dirEntry.writeUInt8(size === 256 ? 0 : size, 1); // Height (0 = 256)
    dirEntry.writeUInt8(0, 2); // Color count
    dirEntry.writeUInt8(0, 3); // Reserved
    dirEntry.writeUInt16LE(1, 4); // Color planes
    dirEntry.writeUInt16LE(32, 6); // Bits per pixel
    dirEntry.writeUInt32LE(buffers[i].length, 8); // Image size
    dirEntry.writeUInt32LE(offset, 12); // Image offset
    icoBuffers.push(dirEntry);
    offset += buffers[i].length;
  }

  // Image data
  icoBuffers.push(...buffers);

  // Write ICO file
  const icoBuffer = Buffer.concat(icoBuffers);
  fs.writeFileSync(outputIco, icoBuffer);
  console.log(`Created ${outputIco}`);
}

async function main() {
  const assetsDir = path.join(__dirname, 'assets');

  // Convert main icon
  await createICO(
    path.join(assetsDir, 'icon.svg'),
    path.join(assetsDir, 'icon.ico')
  );

  // Convert video icon
  await createICO(
    path.join(assetsDir, 'video-icon.svg'),
    path.join(assetsDir, 'video-icon.ico')
  );

  console.log('ICO files created successfully!');
}

main().catch(console.error);
