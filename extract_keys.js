const fs = require('fs');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const file of fs.readdirSync(dir)) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) getFiles(name, files);
    else if (name.endsWith('.tsx') || name.endsWith('.ts')) files.push(name);
  }
  return files;
}

const allFiles = [
  ...getFiles('app/dashboard'),
  ...getFiles('components/dashboard'),
  ...getFiles('app/bc'),
  ...getFiles('components/bc'),
  ...getFiles('components/ui'),
  ...getFiles('components/cookie'),
  ...getFiles('components/notifications')
];

const enData = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

function hasDeep(obj, pathStr) {
  let current = obj;
  for (const part of pathStr.split('.')) {
    if (current === undefined || current === null) return false;
    current = current[part];
  }
  return current !== undefined;
}

const missing = new Set();

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const scopeRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*['"]([^'"]+)['"]\s*\)/g;
  
  const scopes = [];
  let m1;
  while ((m1 = scopeRegex.exec(content)) !== null) {
    scopes.push({ varName: m1[1], prefix: m1[2] });
  }

  if (scopes.length === 0) continue;

  for (const sc of scopes) {
    // Escape varName for regex safety
    const safeVar = sc.varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const callRegex = new RegExp(safeVar + '\\s*\\(\\s*[\'"]([^\'"]+)[\'"]', 'g');
    
    let m2;
    while ((m2 = callRegex.exec(content)) !== null) {
      const fullPath = sc.prefix + '.' + m2[1];
      if (!hasDeep(enData, fullPath)) {
        missing.add(fullPath);
      }
    }
  }
}

const sortedMissing = Array.from(missing).sort();
fs.writeFileSync('missing_keys.json', JSON.stringify(sortedMissing, null, 2));
console.log('Done! Found ' + sortedMissing.length + ' missing keys.');
