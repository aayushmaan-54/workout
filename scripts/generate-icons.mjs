// Generates the PNG app icons in /public from an inline SVG. Run: node scripts/generate-icons.mjs
import sharp from "sharp";

const svg = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#10b981"/>
  <g transform="translate(256 256) scale(${1 - pad}) translate(-256 -256)" fill="#ffffff">
    <rect x="96" y="176" width="56" height="160" rx="18"/>
    <rect x="360" y="176" width="56" height="160" rx="18"/>
    <rect x="56" y="210" width="44" height="92" rx="14"/>
    <rect x="412" y="210" width="44" height="92" rx="14"/>
    <rect x="148" y="236" width="216" height="40" rx="12"/>
  </g>
</svg>`;

const out = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/icon-maskable-512.png", 512, 0.2],
  ["public/apple-touch-icon.png", 180, 0.08],
  ["public/favicon.png", 48, 0],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
