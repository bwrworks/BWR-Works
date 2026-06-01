import fs from 'fs';
import path from 'path';

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
  '🚀': 'Rocket',
  '🔬': 'Microscope',
  '🚚': 'Truck',
  '⏳': 'Hourglass',
  '✅': 'CheckCircle',
  '📝': 'ClipboardList',
  '🎉': 'PartyPopper',
  '👤': 'User',
  '💰': 'Banknote',
  '📍': 'MapPin',
  '💬': 'MessageCircle',
  '📱': 'Smartphone',
  '📋': 'Clipboard'
};

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
  let hasEmojis = false;
  let importsNeeded = new Set();

  for (const [emoji, icon] of Object.entries(emojiMap)) {
    if (content.includes(emoji)) {
      hasEmojis = true;
      importsNeeded.add(icon);

      // We will ONLY do specific, safe replacements.
      // 1. In string literals that are assigned to variables like `icon: '📦'` -> we must change the type!
      // This is risky if the type is `Record<string, {icon: string}>`.
      // Actually, React allows `<Package size={16} />` but ONLY if the type is React.ReactNode.
      // So let's NOT blindly replace `'📦'`.
      
      // Let's replace ONLY JSX occurrences:
      // `>📦<` -> `><Package size={20} /><`
      content = content.replace(new RegExp(`>${emoji}<`, 'g'), `><${icon} size={20} /><`);
      
      // `>📦 ` -> `><${icon} size={18} style={{marginRight:6, verticalAlign:'text-bottom'}}/> `
      content = content.replace(new RegExp(`>${emoji} `, 'g'), `><${icon} size={18} style={{marginRight:6, verticalAlign:'text-bottom'}} /> `);
      
      // ` 📦<` -> ` <${icon} size={18} style={{marginLeft:6, verticalAlign:'text-bottom'}} /><`
      content = content.replace(new RegExp(` ${emoji}<`, 'g'), ` <${icon} size={18} style={{marginLeft:6, verticalAlign:'text-bottom'}} /><`);
      
      // `>🔥 `
      content = content.replace(new RegExp(`>\\s*${emoji}\\s*`, 'g'), `><${icon} size={20} style={{marginRight:8, verticalAlign:'text-bottom'}} /> `);

      // `{tab === 'orders' && '📦 My Orders'}` -> `<Package /> My Orders`
      // We'll leave the ones inside single quotes alone for now.
    }
  }

  if (hasEmojis) {
    console.log(`Needs manual fixing: ${file}`);
  }
});
