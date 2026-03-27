const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, 'messages');
const REPORT_FILE = path.join(__dirname, 'i18n-audit-report.md');
const APP_DIR = path.join(__dirname, 'app');
const COMPONENTS_DIR = path.join(__dirname, 'components');

const langs = ['de', 'es', 'nl', 'fr'];

// Flatten nested JSON object into dot notation
function flattenObj(obj, parent = '', res = {}) {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] == 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

const enRaw = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf8'));
const enFlat = flattenObj(enRaw);
const enKeys = Object.keys(enFlat);

const reportData = {
  enCount: enKeys.length,
  langs: {}
};

for (const lang of langs) {
  const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
  let langFlat = {};
  if (fs.existsSync(filePath)) {
    const langRaw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    langFlat = flattenObj(langRaw);
  }

  const langKeys = Object.keys(langFlat);
  const missing = [];
  const untranslated = [];
  const orphaned = [];

  // Check missing & untranslated
  for (const key of enKeys) {
    if (!langFlat.hasOwnProperty(key)) {
      missing.push(key);
    } else if (langFlat[key] === enFlat[key]) {
      untranslated.push({ key, value: enFlat[key] });
    }
  }

  // Check orphaned
  for (const key of langKeys) {
    if (!enFlat.hasOwnProperty(key)) {
      orphaned.push(key);
    }
  }

  reportData.langs[lang] = {
    present: langKeys.length - orphaned.length,
    missing,
    untranslated,
    orphaned
  };
}

// Search for hardcoded strings
const hardcodedStrings = [];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const ignorePaths = ['app\\\\admin', 'app/admin', '\\node_modules\\', '/node_modules/'];

function searchHardcodedStrings(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  for (const ignore of ignorePaths) {
    if (filePath.includes(ignore)) return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regex to find JSX text: text between > and <
  // Must contain some alphabet characters to be considered text (not just spaces/punctuation)
  const jsxTextRegex = />([^<>{]+)</g;
  let match;
  while ((match = jsxTextRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 1 && /[A-Za-z]/.test(text)) {
      // Exclude simple things like just numbers, or just punctuation, or single words common in code if needed
      // Check if file uses t()
      hardcodedStrings.push({ file: filePath.replace(__dirname, ''), text });
    }
  }
}

walkDir(APP_DIR, searchHardcodedStrings);
walkDir(COMPONENTS_DIR, searchHardcodedStrings);

const date = new Date().toISOString().split('T')[0];
let md = `# i18n Audit Report — ${date}\n\n`;

md += `## Summary\n`;
md += `- EN keys: ${reportData.enCount}\n`;
for (const lang of langs) {
  const d = reportData.langs[lang];
  md += `- ${lang.toUpperCase()}: ${d.present} present / ${d.missing.length} missing / ${d.untranslated.length} untranslated (same as EN)\n`;
}

md += `\n## Missing Keys by Language\n\n`;
for (const lang of langs) {
  const d = reportData.langs[lang];
  md += `### ${lang.toUpperCase()} — Missing ${d.missing.length} keys\n`;
  for (const k of d.missing) {
    md += `- ${k}\n`;
  }
  md += `\n`;
}

md += `## Untranslated Keys (value same as EN)\n\n`;
for (const lang of langs) {
  const d = reportData.langs[lang];
  md += `### ${lang.toUpperCase()} — ${d.untranslated.length} untranslated\n`;
  for (const item of d.untranslated) {
    md += `- ${item.key} → "${item.value}"\n`;
  }
  md += `\n`;
}

md += `## Orphaned Keys (exist in target but not in EN)\n\n`;
for (const lang of langs) {
  const d = reportData.langs[lang];
  md += `### ${lang.toUpperCase()} — ${d.orphaned.length} orphaned\n`;
  for (const k of d.orphaned) {
    md += `- ${k}\n`;
  }
  md += `\n`;
}

md += `## Hardcoded Strings\n`;
md += `Found ${hardcodedStrings.length} potential hardcoded strings in .tsx files (excluding admin):\n\n`;
const grouped = {};
for (const item of hardcodedStrings) {
  if (!grouped[item.file]) grouped[item.file] = new Set();
  grouped[item.file].add(item.text);
}

for (const file in grouped) {
  md += `### ${file}\n`;
  for (const text of grouped[file]) {
    md += `- "${text}"\n`;
  }
  md += `\n`;
}

fs.writeFileSync(REPORT_FILE, md);
console.log(md);
