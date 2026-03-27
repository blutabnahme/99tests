const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, 'app');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components');
const LIB_DIR = path.join(ROOT_DIR, 'lib');
const MESSAGES_DIR = path.join(ROOT_DIR, 'messages');

const dirsToProcess = [APP_DIR, COMPONENTS_DIR, LIB_DIR, MESSAGES_DIR];

// Terms to replace directly
const exactReplacements = [
  { find: /healthcare_company/g, replace: 'doctor_practice' },
  { find: /healthcareCompany/g, replace: 'doctorPractice' },
  { find: /HealthcareCompany/g, replace: 'DoctorPractice' },
  { find: /99Tests/g, replace: '99Tests' },
  { find: /99tests/g, replace: '99tests' },
  { find: /99Tests/g, replace: '99Tests' },
  { find: /99tests/g, replace: '99tests' },
  { find: /99tests\.com/g, replace: '99tests.de' },
  { find: /Blood collection, matched\./g, replace: 'Präzise Diagnostik, einfach gemacht.' },
  { find: /HCSidebar/g, replace: 'DoctorSidebar' }
];

// Complex term 'case' (Negative lookbehinds to ignore "switch (ext) { case" and "toLowerCase()")
const caseReplacements = [
  { find: /\bcases\b/g, replace: 'recommendations' },
  { find: /\bCases\b/g, replace: 'Recommendations' },
  { find: /\bcase_id\b/g, replace: 'recommendation_id' },
  { find: /\bcaseId\b/g, replace: 'recommendationId' },
  { find: /\bcaseData\b/g, replace: 'recommendationData' },
  { find: /\bCaseData\b/g, replace: 'RecommendationData' },
  { find: /\buseCases\b/g, replace: 'useRecommendations' },
  { find: /\bactiveCase\b/g, replace: 'activeRecommendation' },
  { find: /\bnewCase\b/g, replace: 'newRecommendation' },
  { find: /\bcaseErr\b/g, replace: 'recommendationErr' },
  { find: /\bcaseObj\b/g, replace: 'recommendationObj' },
  { find: /(?<!\.)\bcase\b(?!\s*:)(?!\s*===)(?!.*switch)/g, replace: 'recommendation' }, // extremely strict isolation
  { find: /\bCase\b(?!\s*:)/g, replace: 'Recommendation' }
];

// Terms that need to trigger a line-comment comment-out
const removalKeywords = [
  'blood_collector',
  'bloodCollector',
  'BloodCollector',
  'bc_proposed_slots',
  'bc_availability',
  'case_application',
  'caseApplication',
  'appointment',
  'case-broadcast'
];

function processFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.next')) return;
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.json', '.css'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let modified = false;

  // 1. Line-by-line removal commenting
  if (!filePath.endsWith('.css')) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//')) continue; // Already commented

      const needsRemoval = removalKeywords.some(kw => line.includes(kw)) || /\bBC\b/.test(line);

      // We ONLY comment if 'match' matches exactly as a word without a preceding dot `.match`
      const hasBadMatch = /\bmatch\b/.test(line) && !/\.match\(/.test(line);

      if (needsRemoval || hasBadMatch) {
         if (!line.includes('TODO: 99Tests - removed')) {
            lines[i] = `// TODO: 99Tests - removed 99Tests dependency\n// ` + line;
            modified = true;
         }
      }
    }
    content = lines.join('\n');
  }

  // 2. Replacements
  const allReplacements = [...exactReplacements, ...caseReplacements];
  for (const act of allReplacements) {
    if (content.match(act.find)) {
      content = content.replace(act.find, act.replace);
      modified = true;
    }
  }

  // 3. HC Replacement (more careful, word boundaries)
  if (/\bHC\b/.test(content)) {
    content = content.replace(/\bHC\b/g, 'Doctor');
    modified = true;
  }
  if (/\bhc_/.test(content)) {
    content = content.replace(/\bhc_/g, 'doctor_');
    modified = true;
  }
  if (/\bHC_/.test(content)) {
    content = content.replace(/\bHC_/g, 'DOCTOR_');
    modified = true;
  }
  // Replacing hc as a folder reference in imports e.g. /api/hc/
  if (/\/hc\//.test(content)) {
    content = content.replace(/\/hc\//g, '/doctor/');
    modified = true;
  }

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseAndProcess(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseAndProcess(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

let renamesToProcess = [];

function traverseAndRenameFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseAndRenameFiles(fullPath); // dfs first
    }
    
    // Rename logic
    let newName = file;
    if (newName.includes('Case')) newName = newName.replace(/Case/g, 'Recommendation');
    if (newName.includes('case') && !newName.includes('case-test') && !newName.includes('debug_case')) newName = newName.replace(/case/g, 'recommendation');
    if (newName.includes('HC')) newName = newName.replace(/HC/g, 'Doctor');
    if (newName.includes('Hc')) newName = newName.replace(/Hc/g, 'Doctor');
    
    if (newName !== file) {
       const newFullPath = path.join(dir, newName);
       renamesToProcess.push({ old: fullPath, new: newFullPath, isDir: stat.isDirectory() });
    }
  }
}

console.log("Starting bulk file modification...");
dirsToProcess.forEach(traverseAndProcess);

console.log("Queueing files and folders dynamically...");
dirsToProcess.forEach(traverseAndRenameFiles);

console.log("Executing renaming operations safely...");
// Sort to ensure deepest paths are renamed first
renamesToProcess.sort((a, b) => b.old.length - a.old.length);
for (const req of renamesToProcess) {
   if (fs.existsSync(req.old)) {
       try {
           fs.renameSync(req.old, req.new);
           console.log(`Renamed node: ${req.old} -> ${req.new}`);
       } catch (e) {
           console.error(`Failed renaming ${req.old}:`, e.message);
       }
   }
}

// Specific hardcoded routes that need exact remapping if missed
const explicitDirs = [
  { old: path.join(APP_DIR, 'api', 'hc'), new: path.join(APP_DIR, 'api', 'doctor') },
  { old: path.join(APP_DIR, 'register', 'hc'), new: path.join(APP_DIR, 'register', 'doctor') },
];
explicitDirs.forEach(({ old: oldPath, new: newPath }) => {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed explicit dir: ${oldPath} -> ${newPath}`);
  }
});

console.log("Done!");
