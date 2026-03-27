const fs = require('fs');
const path = require('path');

const replacers = [
  { find: /99Tests/g, replace: '99Tests' },
  { find: /99tests/g, replace: '99tests' },
  { find: /99Tests/g, replace: '99Tests' },
  { find: /99tests/g, replace: '99tests' },
];

function processFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.next') || filePath.includes('.git')) return;
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.md'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacers.forEach(r => {
    content = content.replace(r.find, r.replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Rewrote string sweeps in: ${filePath}`);
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

['app', 'components', 'lib', 'scripts', 'messages', 'middleware.ts', 'package.json'].forEach(d => {
   const resolved = path.join(process.cwd(), d);
   if (fs.existsSync(resolved)) {
       if (fs.statSync(resolved).isDirectory()) traverse(resolved);
       else processFile(resolved);
   }
});
console.log("Deep text sweep done.");
