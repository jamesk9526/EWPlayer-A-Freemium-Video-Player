const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function svgToPngBuffers(svgPath, sizes) {
  const svgbuf = fs.readFileSync(svgPath);
  const bufs = [];
  for (const size of sizes) {
    const buf = await sharp(svgbuf)
      .resize(size, size, { fit: 'contain' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    bufs.push(buf);
  }
  return bufs;
}

async function buildIco(svgPath, outIco) {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const { default: pngToIco } = await import('png-to-ico');
  const pngBuffers = await svgToPngBuffers(svgPath, sizes);
  const icoBuf = await pngToIco(pngBuffers);
  fs.writeFileSync(outIco, icoBuf);
  console.log(`ICO written: ${outIco}`);
}

(async () => {
  const assets = path.join(__dirname, 'assets');
  await buildIco(path.join(assets, 'icon.svg'), path.join(assets, 'icon.ico'));
  await buildIco(path.join(assets, 'video-icon.svg'), path.join(assets, 'video-icon.ico'));
})();
