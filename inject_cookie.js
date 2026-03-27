const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const cookieStrings = {
  title: "Cookie Preferences",
  description: "We use cookies to improve your experience. Choose what you allow.",
  essential: "Essential",
  essentialDesc: "Required for the website to function properly. Cannot be disabled.",
  analytics: "Analytics",
  analyticsDesc: "Helps us understand how visitors interact with the website.",
  marketing: "Marketing",
  marketingDesc: "Used to deliver personalized content and advertisements.",
  savePreferences: "Save Preferences",
  bannerText: "We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies. ",
  privacyPolicy: "Privacy Policy",
  managePreferences: "Manage Preferences",
  rejectAll: "Reject All",
  acceptAll: "Accept All"
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  data.cookie = { ...cookieStrings };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected Cookie strings');
