import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('src/assets/bwr-brand.svg');
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Read the original black/multicolor brand SVG
let svgContent = fs.readFileSync(svgPath, 'utf8');

// Replace fills to make it white-and-orange for dark backgrounds (emails use #111)
svgContent = svgContent.replace(/fill="currentColor"/g, 'fill="#ffffff"');
svgContent = svgContent.replace(/fill="black"/g, 'fill="#ffffff"');

// Save the white-and-orange SVG
const outputSvgPath = path.join(publicDir, 'logo.svg');
fs.writeFileSync(outputSvgPath, svgContent);
console.log('Generated public/logo.svg');

// Render to a high-res PNG (height of 128px, width scales proportionally)
sharp(outputSvgPath)
  .resize({ height: 128 })
  .png()
  .toFile(path.join(publicDir, 'logo.png'))
  .then(() => {
    console.log('Generated public/logo.png');
  })
  .catch(err => {
    console.error('Error generating logo.png:', err);
  });
