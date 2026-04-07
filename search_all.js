const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    try {
      let isDirectory = fs.statSync(dirPath).isDirectory();
      isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    } catch(e) {}
  });
}

let longestLength = 0;
let bestContent = "";

walkDir('C:\\Users\\luizf\\.gemini\\antigravity\\brain', (filepath) => {
  if (filepath.endsWith('.txt') || filepath.endsWith('.md') || filepath.endsWith('.json')) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      
      const searchString = "file:///c:/99tests/app/patient/%5Btoken%5D/page.tsx";
      let pos = content.lastIndexOf(searchString);
      if (pos === -1) pos = content.lastIndexOf("app/patient/[token]/page.tsx");
      
      if (pos !== -1) {
         console.log("Found in: " + filepath);
      }
    } catch(e) {}
  }
});
