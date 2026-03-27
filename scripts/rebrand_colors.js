const fs = require('fs');
const path = require('path');

const exactReplacements = [
  // Class keywords
  { find: /\b(bg|text|border|ring|shadow|from|to|fill|stroke)-99tests-red\b/g, replace: '$1-primary' },
  { find: /\b(bg|text|border|ring|shadow|from|to|fill|stroke)-99tests-red\b/g, replace: '$1-primary' },
  { find: /\b(bg|text|border|ring|shadow|from|to|fill|stroke)-match-pink\b/g, replace: '$1-primary-light' },
  { find: /\b(bg|text|border|ring|shadow|from|to|fill|stroke)-deep-red\b/g, replace: '$1-primary-dark' },
  { find: /\b(bg|text|border|ring|shadow|from|to|fill|stroke)-signal-teal\b/g, replace: '$1-primary' },

  // Hexes (case-insensitive for a-f)
  { find: /#008085/gi, replace: '#008085' },
  { find: /#80C0C2/gi, replace: '#80C0C2' },
  { find: /#005C5F/gi, replace: '#005C5F' },
  { find: /#008085/gi, replace: '#008085' },

  // RGBAs
  { find: /rgba\(\s*197\s*,\s*31\s*,\s*58\s*/g, replace: 'rgba(0, 128, 133' },
  { find: /rgba\(\s*233\s*,\s*156\s*,\s*168\s*/g, replace: 'rgba(128, 192, 194' },
  { find: /rgba\(\s*111\s*,\s*13\s*,\s*30\s*/g, replace: 'rgba(0, 92, 95' },
  { find: /rgba\(\s*26\s*,\s*138\s*,\s*138\s*/g, replace: 'rgba(0, 128, 133' },
];

function processFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.next')) return;
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const rep of exactReplacements) {
    if (content.match(rep.find)) {
      content = content.replace(rep.find, rep.replace);
    }
  }

  // Also catch generic tailwind arbitrary usages that might not have a dash boundary correctly
  content = content.replace(/bg-\[#008085\]/gi, 'bg-primary');
  content = content.replace(/text-\[#008085\]/gi, 'text-primary');
  content = content.replace(/border-\[#008085\]/gi, 'border-primary');
  content = content.replace(/bg-\[#80C0C2\]/gi, 'bg-primary-light');
  content = content.replace(/text-\[#80C0C2\]/gi, 'text-primary-light');
  content = content.replace(/bg-\[#005C5F\]/gi, 'bg-primary-dark');
  content = content.replace(/text-\[#005C5F\]/gi, 'text-primary-dark');
  content = content.replace(/bg-\[#008085\]/gi, 'bg-primary');
  content = content.replace(/text-\[#008085\]/gi, 'text-primary');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated colors in: ${filePath}`);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

console.log("Replacing 99Tests color systems with 99Tests colors...");
['app', 'components', 'lib', 'scripts'].forEach(d => {
   traverse(path.join(process.cwd(), d));
});
console.log("Done.");
