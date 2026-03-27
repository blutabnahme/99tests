const fs = require('fs');
const path = require('path');

const replacers = [
  { find: /99Tests/g, replace: '99Tests' },
  { find: /99tests/g, replace: '99tests' },
  { find: /\bcase\b/gi, replace: 'recommendation' },
  { find: /\bcases\b/gi, replace: 'recommendations' },
  { find: /\bblood collector\b/gi, replace: '[TODO] lab' },
  { find: /\bblood collectors\b/gi, replace: '[TODO] labs' },
  { find: /\bphlebotomist\b/gi, replace: '[TODO] lab' },
  { find: /\bhealthcare company\b/gi, replace: 'doctor practice' },
  { find: /\bhealthcare companies\b/gi, replace: 'doctor practices' },
  { find: /\bBlutabnehmer\b/gi, replace: '[TODO] Labor' },
  { find: /\bFall\b/gi, replace: 'Empfehlung' },
  { find: /\bFälle\b/gi, replace: 'Empfehlungen' },
];

const msgsDir = path.join(process.cwd(), 'messages');
if (fs.existsSync(msgsDir)) {
  const files = fs.readdirSync(msgsDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(msgsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      replacers.forEach(r => {
        content = content.replace(r.find, r.replace);
      });
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Bruted text swap in: ${file}`);
    }
  }
}
