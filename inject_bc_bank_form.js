const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  bankForm: {
    title: "Bank Details",
    currentAccount: "Current account: {masked}",
    addIban: "Add your IBAN to receive payouts",
    saved: "Saved Successfully",
    labels: {
      accountHolder: "Account Holder Name",
      iban: "IBAN"
    },
    placeholders: {
      accountHolder: "Jane Doe",
      iban: "DE12 3456 7890 1234 5678 90"
    },
    buttons: {
      saving: "Encrypting & Saving...",
      update: "Update Bank Details"
    },
    encrypted: "AES-256 Encrypted",
    errors: {
      failed: "Failed to update bank details"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.bankForm = translations.bankForm;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.bankForm');
