import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconsDir = path.join(root, "public", "icons");
const appDir = path.join(root, "app");
const visualsDir = path.join(root, "public", "visuals");

await mkdir(iconsDir, { recursive: true });

const mark = `
  <circle cx="166" cy="346" r="58" fill="#C65C3C"/>
  <circle cx="346" cy="160" r="58" fill="#28685B"/>
  <path d="M207 319C256 285 247 204 310 181" fill="none" stroke="#14323B"
    stroke-width="24" stroke-linecap="round" stroke-dasharray="10 34"/>
  <path d="M294 130L350 158L322 218" fill="none" stroke="#14323B"
    stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
`;

function iconSvg({ size, safe = false }) {
  const inset = safe ? 76 : 36;
  const scale = (size - inset * 2) / 512;
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${safe ? 0 : Math.round(size * 0.22)}" fill="#F2EBDD"/>
      <g transform="translate(${inset} ${inset}) scale(${scale})">${mark}</g>
    </svg>
  `);
}

async function renderPng(filename, size, safe = false) {
  await sharp(iconSvg({ size, safe }))
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(iconsDir, filename));
}

await Promise.all([
  renderPng("favicon-16.png", 16),
  renderPng("favicon-32.png", 32),
  renderPng("favicon-48.png", 48),
  renderPng("apple-touch-icon.png", 180),
  renderPng("android-chrome-192.png", 192),
  renderPng("android-chrome-512.png", 512),
  renderPng("maskable-icon-512.png", 512, true),
]);

const faviconPngs = await Promise.all(
  ["favicon-16.png", "favicon-32.png", "favicon-48.png"].map((file) =>
    readFile(path.join(iconsDir, file)),
  ),
);
const headerSize = 6 + faviconPngs.length * 16;
let offset = headerSize;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(faviconPngs.length, 4);
faviconPngs.forEach((png, index) => {
  const size = [16, 32, 48][index];
  const entry = 6 + index * 16;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(path.join(appDir, "favicon.ico"), Buffer.concat([header, ...faviconPngs]));

await sharp(path.join(iconsDir, "android-chrome-512.png"))
  .png({ compressionLevel: 9 })
  .toFile(path.join(appDir, "icon.png"));
await sharp(path.join(iconsDir, "apple-touch-icon.png"))
  .png({ compressionLevel: 9 })
  .toFile(path.join(appDir, "apple-icon.png"));

const ogSource = path.join(visualsDir, "og-rumbo-au.webp");
const wordmark = (await readFile(path.join(visualsDir, "wordmark.svg"), "utf8"))
  .replaceAll("var(--ink)", "#14323B")
  .replaceAll("var(--eucalyptus)", "#28685B")
  .replaceAll("var(--terracotta)", "#C65C3C")
  .replace("<svg ", '<svg width="360" height="71" ');
const socialCopy = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="430" height="220">
    <text x="0" y="42" fill="#14323B" font-family="Arial, sans-serif"
      font-size="36" font-weight="700">La espera,</text>
    <text x="0" y="84" fill="#14323B" font-family="Arial, sans-serif"
      font-size="36" font-weight="700">puesta en orden.</text>
    <text x="0" y="145" fill="#28685B" font-family="Arial, sans-serif"
      font-size="22">Postulaciones WH Australia</text>
    <text x="0" y="180" fill="#28685B" font-family="Arial, sans-serif"
      font-size="22">compartidas por la comunidad.</text>
  </svg>
`);
const socialImage = await sharp(ogSource)
  .resize(1200, 630, { fit: "cover" })
  .composite([
    { input: Buffer.from(wordmark), left: 78, top: 64 },
    { input: socialCopy, left: 82, top: 180 },
  ])
  .png({
    compressionLevel: 9,
    palette: true,
    colours: 256,
    quality: 90,
    dither: 0.8,
  })
  .toBuffer();
await writeFile(path.join(appDir, "opengraph-image.png"), socialImage);
await writeFile(path.join(appDir, "twitter-image.png"), socialImage);

console.log("Brand assets generated.");
