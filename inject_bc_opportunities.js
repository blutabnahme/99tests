const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  opportunities: {
    title: "Opportunities",
    subtitle: "Find active cases in your area and manage your applications.",
    tabs: {
      available: "Available Cases",
      applications: "My Applications"
    },
    filters: {
      filters: "Filters:",
      allUrgencies: "All Urgencies",
      normal: "Normal",
      urgent: "Urgent",
      emergency: "Emergency",
      allVisitTypes: "All Visit Types",
      practiceVisit: "Practice Visit",
      homeVisit: "Home Visit"
    },
    sort: {
      sortBy: "Sort by:",
      deadline: "Deadline Soonest",
      closest: "Closest Match",
      highestFee: "Highest Fee",
      newest: "Newest Listed",
      mobileDeadline: "Sort: Deadline Soonest",
      mobileClosest: "Sort: Closest Match",
      mobileHighestFee: "Sort: Highest Fee",
      mobileNewest: "Sort: Newest Listed"
    },
    states: {
      loading: "Loading opportunities...",
      noCases: "No active cases found in your area.",
      noApplications: "You haven't applied to any cases yet."
    },
    modal: {
      withdrawTitle: "Withdraw Application?",
      withdrawDesc: "This action cannot be undone.",
      cancel: "Cancel",
      withdrawBtn: "Withdraw",
      invitedByHc: "Invited by HC",
      estFee: "Est. Fee",
      appWindow: "Application Window",
      details: "Details",
      location: "Location",
      visitType: "Visit Type",
      practice: "Practice",
      homeVisit: "Home Visit",
      urgency: "Urgency",
      reqDates: "Requested Dates",
      appLog: "Your Application Log",
      status: "Status: ",
      applied: "Applied",
      recent: "recent",
      on: "On ",
      noMessage: "No message provided.",
      patientSuggested: "Patient Suggested New Times",
      patientText: "The patient could not make your proposed times and has suggested these instead:",
      oneHour: "1 hour",
      acceptTime: "Accept This Time",
      suggestDiff: "Suggest Different Times",
      selectTime: "Select time",
      sendProposals: "Send New Proposals",
      msgToClinic: "Message to Clinic (Optional)",
      msgPlaceholder: "e.g. I have extensive experience with elderly patients...",
      proposeAvail: "Propose Your Availability",
      emergencyWarning: "Emergency: slots must be within 12 hours",
      urgentWarning: "Urgent: slots must be within 48 hours",
      addTime: "+ Add another time",
      flexibleCheckbox: "I'm flexible — the patient can suggest other times",
      submitCmd: "Submit Application",
      applyingCmd: "Applying...",
      close: "Close"
    },
    card: {
      actionNeeded: "ACTION NEEDED",
      slotsProposed: "Slots Proposed",
      patientChoosing: "Patient Choosing",
      newSlotsSent: "New Slots Sent",
      scheduled: "Scheduled",
      failed: "Scheduling Failed",
      hcInvited: "HC Invited",
      appliedOn: "Applied On",
      viewCase: "View Case",
      viewApply: "View & Apply"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.opportunities = translations.opportunities;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.opportunities');
