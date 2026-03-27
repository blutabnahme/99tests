const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  avatar: {
    errors: {
      size: "Image must be under 5MB",
      failedProcess: "Failed to process image",
      failedUpload: "Upload failed: {reason}",
      network: "Network error",
      server: "Server error"
    },
    modal: {
      title: "Adjust Avatar",
      zoom: "Zoom",
      cancel: "Cancel",
      saving: "Saving...",
      save: "Save Photo"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  if (!data.bc.profilePage) data.bc.profilePage = {};
  data.bc.profilePage.avatar = translations.avatar;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.profilePage.avatar');
