const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  calendar: {
    loading: "Loading schedule...",
    title: "Schedule",
    subtitle: "Your proposed times and confirmed appointments",
    clearTitle: "Your schedule is clear",
    clearDesc: "Applied cases and confirmed appointments will appear here",
    browseOpportunities: "Browse opportunities",
    days: {
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun"
    },
    today: "Today",
    nothingScheduled: "Nothing scheduled",
    dayFree: "This day is free",
    eventSingle: "{count} event",
    eventPlural: "{count} events",
    eventTypes: {
      appointment: "Appointment",
      proposed: "Proposed Slot",
      proposedShort: "Proposed"
    },
    details: {
      patient: "Patient",
      unknown: "Unknown",
      caseToken: "Case Token",
      homeVisit: "Home Visit",
      practice: "Practice",
      scheduled: "Scheduled",
      waitingForPatient: "Waiting for patient",
      round: "Round {num}",
      moreEvents: "+{count} more"
    },
    proposals: {
      title: "Pending Proposals",
      emptyState: "No active negotiations",
      goToOpp: "Go to Opportunities",
      patientActionNeeded: "Patient suggested new times — respond in Opportunities",
      waitingPatient: "Waiting for patient to choose"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.calendar = translations.calendar;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.calendar');
