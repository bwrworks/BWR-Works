const fs = require('fs');
const path = require('path');

const emojiMap = {
  '🎨': 'Palette',
  '📦': 'Package',
  '🛡️': 'ShieldCheck',
  '✉️': 'Mail',
  '🖨️': 'Printer',
  '⚙️': 'Settings',
  '🔥': 'Flame',
  '⚠️': 'AlertTriangle',
  '🏷️': 'Tag',
  '✏️': 'PenTool',
  '✍️': 'PenLine',
  '🚀': 'Rocket'
};

const emojiRegex = new RegExp(`[${Object.keys(emojiMap).join('')}]`, 'g');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find all emojis in the file
  let match;
  const foundIcons = new Set();
  
  // We need to replace the emojis with the React component strings.
  // Wait, if it's inside a string literal, we should not replace it with a React component unless we change the structure!
  // Let's print out where they are found so we can manually replace them or handle them smartly.
  let hasEmojis = false;
  for (const emoji of Object.keys(emojiMap)) {
    if (content.includes(emoji)) {
      hasEmojis = true;
      foundIcons.add(emojiMap[emoji]);
    }
  }

  if (hasEmojis) {
    console.log(`Found emojis in ${file}. Icons needed: ${[...foundIcons].join(', ')}`);
  }
});
