const fs = require('fs');
const path = require('path');

const replacers = [
  { find: /Hematch/g, replace: '99Tests' },
  { find: /hematch/g, replace: '99tests' },
  { find: /\bcase\b/gi, replace: 'recommendation' },
  { find: /\bcases\b/gi, replace: 'recommendations' },
  { find: /\bblood collector\b/gi, replace: '[TODO] lab' },
  { find: /\bblood collectors\b/gi, replace: '[TODO] labs' },
  { find: /\bphlebotomist\b/gi, replace: '[TODO] lab' },
  { find: /\bhealthcare company\b/gi, replace: 'doctor practice' },
  { find: /\bhealthcare companies\b/gi, replace: 'doctor practices' },
  { find: /\bBlutabnehmer\b/gi, replace: '[TODO] Labor' },
  { find: /\bFall\b/gi, replace: 'Empfehlung' },
  { find: /\bFälle\b/gi, replace: 'Empfehlungen' }
];

function traverseObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      traverseObject(obj[key]);
    } else if (typeof obj[key] === 'string') {
      let str = obj[key];
      replacers.forEach(r => {
        str = str.replace(r.find, r.replace);
      });
      obj[key] = str;
    }
  }
}

const msgsDir = path.join(process.cwd(), 'messages');
if (fs.existsSync(msgsDir)) {
  const files = fs.readdirSync(msgsDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(msgsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        let parsed = JSON.parse(content);
        traverseObject(parsed);
        // We delete the specific feature segments that we originally gutted earlier!
        delete parsed.bc;
        delete parsed.appointments;
        delete parsed.calendar;

        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf8');
        console.log(`Cleanly rebuilt translations + purged nodes in ${file}`);
      } catch(e) {
          console.error(`Failed ${file}`, e.message)
      }
    }
  }
}
