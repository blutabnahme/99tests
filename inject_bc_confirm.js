const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  confirmModal: {
    title: "Confirm Blood Collection",
    caseId: "Case: {id}",
    patientUnknown: "Unknown Patient",
    scheduled: "Scheduled: {date}",
    errors: {
      missingId: "Missing Case ID",
      failed: "Failed to confirm collection",
      generic: "An error occurred"
    },
    success: {
      title: "Collection Confirmed",
      desc: "The case has been marked as completed successfully."
    },
    form: {
      successPrompt: "Collection completed successfully?",
      yes: "Yes",
      no: "No (Patient issue or access blocked)",
      tubes: "Number of tubes collected",
      tubesPh: "e.g. 4",
      notes: "Notes (optional)",
      notesPh: "Any observations regarding the patient or procedure...",
      issuesPrompt: "Any issues during collection?",
      issuesPh: "Please describe what happened (difficult veins, faint, etc)..."
    },
    buttons: {
      cancel: "Cancel",
      confirm: "Confirm Completion"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.confirmModal = translations.confirmModal;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.confirmModal');
