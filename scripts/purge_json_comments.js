const fs = require('fs');
const path = require('path');

function purgeJSONComments(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove single line comments which are purely // at the start of the line or leading spaces
    content = content.replace(/^\s*\/\/.*$/gm, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Purged // comments from: ${filePath}`);
    }
  } catch (e) {
    console.error(`Error purging ${filePath}: ${e.message}`);
  }
}

const msgsDir = path.join(process.cwd(), 'messages');
if (fs.existsSync(msgsDir)) {
  const files = fs.readdirSync(msgsDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      purgeJSONComments(path.join(msgsDir, file));
    }
  }
}
console.log("JSON comment purge complete.");
