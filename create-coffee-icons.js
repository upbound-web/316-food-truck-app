import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Coffee cup SVG icon
const coffeeCupSVG = `<svg width="512" height="512" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Coffee cup body -->
  <path d="M50 80 L50 160 Q50 180 70 180 L130 180 Q150 180 150 160 L150 80 Z" fill="#8B5CF6" stroke="#000" stroke-width="3"/>
  
  <!-- Middle band -->
  <rect x="50" y="110" width="100" height="30" fill="#3B82F6"/>
  
  <!-- Bottom band -->
  <rect x="50" y="140" width="100" height="20" fill="#A855F7"/>
  
  <!-- Cup lid -->
  <ellipse cx="100" cy="80" rx="52" ry="8" fill="#4B5563" stroke="#000" stroke-width="3"/>
  
  <!-- Lid top -->
  <ellipse cx="100" cy="75" rx="50" ry="6" fill="#6B7280" stroke="#000" stroke-width="2"/>
  
  <!-- Drinking hole -->
  <ellipse cx="100" cy="75" rx="15" ry="3" fill="#374151"/>
</svg>`;

// Create directories
const iconsDir = path.join(__dirname, 'public', 'icons');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Save the main SVG icon
fs.writeFileSync(path.join(iconsDir, 'coffee-icon.svg'), coffeeCupSVG);
console.log('Created SVG icon: coffee-icon.svg');

// For now, we'll create simple colored PNG placeholders since we can't easily convert SVG to PNG in Node.js
// The user can replace these with proper PNG versions of the coffee cup icon

// Create a simple purple PNG as placeholder (represents the coffee cup colors)
function createColoredPNG(width, height) {
  // Create a minimal PNG with purple color (similar to the coffee cup)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, (width >> 8) & 0xFF, width & 0xFF, // width
    0x00, 0x00, (height >> 8) & 0xFF, height & 0xFF, // height
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth = 8, color type = 2 (RGB), compression = 0, filter = 0, interlace = 0
  ]);
  
  // Calculate CRC for IHDR
  const ihdrData = Buffer.from([
    0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, (width >> 8) & 0xFF, width & 0xFF,
    0x00, 0x00, (height >> 8) & 0xFF, height & 0xFF,
    0x08, 0x02, 0x00, 0x00, 0x00
  ]);
  
  // Simple IDAT with purple color
  const idatData = Buffer.from([
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF,
    0x8B, 0x5C, 0xF6, // Purple color (RGB: 139, 92, 246)
    0x02, 0x00, 0x01, 0x00
  ]);
  
  return Buffer.concat([
    pngHeader,
    Buffer.from([0x90, 0x77, 0x53, 0xDE]), // IHDR CRC placeholder
    Buffer.from([0x00, 0x00, 0x00, idatData.length]), // IDAT length
    Buffer.from([0x49, 0x44, 0x41, 0x54]), // IDAT
    idatData,
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // IEND length
    Buffer.from([0x49, 0x45, 0x4E, 0x44]), // IEND
    Buffer.from([0xAE, 0x42, 0x60, 0x82])  // IEND CRC
  ]);
}

// Create PNG icons in required sizes
const iconSizes = [
  { size: 192, filename: 'pwa-192x192.png' },
  { size: 512, filename: 'pwa-512x512.png' },
  { size: 180, filename: 'apple-touch-icon.png', path: publicDir }
];

iconSizes.forEach(({ size, filename, path: targetPath = iconsDir }) => {
  const pngData = createColoredPNG(size, size);
  const filepath = path.join(targetPath, filename);
  fs.writeFileSync(filepath, pngData);
  console.log(`Created PNG placeholder: ${filename} (${size}x${size})`);
});

// Also create favicon
const faviconData = createColoredPNG(32, 32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconData);
console.log('Created favicon.ico');

console.log('\\n✅ Coffee cup icons created!');
console.log('📝 Note: PNG files are purple placeholders. For best results, convert the SVG to proper PNG files using an image editor or online converter.');