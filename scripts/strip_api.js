const fs = require('fs');
const path = require('path');

const patterns = [
  /import.*(?:recommendation-broadcast|scheduling).*;\n?/g,
  /.*releaseSlots.*\n?/g,
  /.*broadcastCase.*\n?/g,
  /.*processExpiredCases.*\n?/g
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  patterns.forEach(p => {
    content = content.replace(p, '');
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Stripped legacy library invocations from: ${filePath}`);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

traverse(path.join(process.cwd(), 'app/api'));
