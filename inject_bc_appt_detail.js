const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  appointmentDetail: {
    back: "Back to Appointments",
    cancelBtn: "Cancel Appointment",
    homeVisit: "Home Visit",
    scheduledFor: "Scheduled For",
    callPatient: "Call Patient",
    navigate: "Navigate",
    flags: {
      title: "Special Case Flags",
      minor: "Minor Patient",
      minorDesc: "A legal guardian must be present to confirm consent before the draw.",
      difficultVeins: "Difficult Veins",
      difficultVeinsDesc: "Use a butterfly needle if necessary. Ensure the patient is kept warm and hydrated."
    },
    tests: {
      title: "Required Tests & Labs",
      preferredLab: "Preferred Laboratory",
      anyLab: "Any available lab"
    },
    status: {
      collectionStatus: "Collection Status",
      collectionDesc: "The appointment date has arrived. Please confirm if the blood collection was completed successfully.",
      confirmBtn: "Confirm Collection",
      complete: "Collection Complete",
      payoutConfirmed: "Payout confirmed — will be processed in next batch",
      payoutPending: "Pending final HC confirmation before payout."
    },
    checklist: {
      allSet: "You're All Set",
      allSetDesc: "Your preparation checklist is complete. Proceed to the appointment when ready.",
      title: "Pre-Appointment Checklist",
      desc: "Confirm you have all necessary items before departing.",
      equipment: "Equipment Ready",
      equipmentDesc: "Needles, vacutainers, tourniquet, bandages.",
      materials: "Materials Verified",
      materialsDesc: "Checked labels match the requested tests.",
      transport: "Transport Prep",
      transportDesc: "Cooling containers and logistics labels printed.",
      saving: "Saving...",
      readyBtn: "Ready for Appointment"
    },
    waitingPatient: {
      title: "Waiting for Patient",
      desc: "Patient has not confirmed their preparation."
    },
    map: "Display Address Map",
    completion: {
      title: "Complete Appointment",
      desc: "Record details before leaving.",
      tubes: "Tubes collected",
      issuesLabel: "Issues Encountered",
      issues: {
        none: "None - Smooth collection",
        difficult: "Difficult vein",
        fainted: "Patient fainted/dizzy",
        insufficient: "Insufficient sample volume",
        other: "Other"
      },
      notesLabel: "Notes on issues",
      notesPlaceholder: "Please detail the issue...",
      sampleSecure: "Sample is secure",
      sampleDesc: "I confirm that all tubes are labeled and placed in the secure transport container.",
      markComplete: "Mark as Completed"
    },
    cancelModal: {
      title: "Cancel Appointment?",
      desc: "This action cannot be undone. Please provide a reason for the cancellation.",
      placeholder: "E.g., Unexpected illness, car broke down...",
      keepBtn: "Keep it",
      confirmBtn: "Confirm Cancel",
      cancelling: "Cancelling..."
    },
    loading: "Loading appointment details...",
    error: "Error: "
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.appointmentDetail = translations.appointmentDetail;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.appointmentDetail');
