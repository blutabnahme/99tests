const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, 'messages');
const PAYLOAD_FILE = path.join(__dirname, 'tmp-translations.json');

if (!fs.existsSync(PAYLOAD_FILE)) {
  console.log("No payload found.");
  process.exit(0);
}

const payload = JSON.parse(fs.readFileSync(PAYLOAD_FILE, 'utf8'));
// payload structure:
// {
//   "namespace": {
//     "key": {
//       "en": "...",
//       "de": "...",
//       "es": "...",
//       "nl": "...",
//       "fr": "..."
//     }
//   }
// }

const langs = ['en', 'de', 'es', 'nl', 'fr'];

langs.forEach(lang => {
  const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  for (const [namespace, keys] of Object.entries(payload)) {
    if (!data[namespace]) data[namespace] = {};
    for (const [key, translations] of Object.entries(keys)) {
      if (translations[lang]) {
        data[namespace][key] = translations[lang];
      }
    }
  }
  
  // Format with 2 spaces
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
});

console.log("Translations merged successfully.");
