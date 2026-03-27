const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  settings: {
    title: "Settings",
    subtitle: "Manage your notifications, language, and account security.",
    service: {
      title: "Service Preferences",
      desc: "Choose the types of collections you want to offer to patients.",
      practice: "I offer Practice Visits",
      practiceDesc: "Patients can come to my physical location.",
      home: "I offer Home Visits",
      homeDesc: "I travel to the patient's location.",
      errors: {
        minOne: "You must offer at least one type of visit.",
        failed: "Failed to save service preferences",
        success: "Service preferences saved successfully."
      },
      btnSave: "Save Preferences",
      btnSaving: "Saving..."
    },
    notifications: {
      title: "Notification Preferences",
      desc: "Choose how you want to be alerted about account activity.",
      headers: {
        event: "Event",
        email: "Email",
        sms: "SMS"
      },
      events: {
        new_requests: {
          label: "New Match Requests",
          desc: "When a new case matching your profile is available."
        },
        confirmations: {
          label: "Appointment Confirmations",
          desc: "When an appointment is officially booked."
        },
        reminders: {
          label: "Appointment Reminders",
          desc: "24 hours before a scheduled home or practice visit."
        },
        payments: {
          label: "Payment Received",
          desc: "When your commission has been processed."
        },
        updates: {
          label: "Profile & System Updates",
          desc: "Verification status changes and important news."
        }
      },
      errors: {
        failed: "Failed to save notification preferences",
        success: "Notification preferences saved successfully."
      },
      btnSave: "Save Preferences",
      btnSaving: "Saving..."
    },
    language: {
      title: "Language",
      desc: "Interface language.",
      note: "Translations are being progressively added. Some pages may appear in English."
    },
    security: {
      title: "Account & Security",
      desc: "Manage your password and account status.",
      password: "Password",
      passwordDesc: "Receive a link to reset your password.",
      btnChange: "Change Password",
      btnSending: "Sending...",
      success: "Password reset link sent to your email."
    },
    dangerZone: {
      title: "Danger Zone",
      desc: "Deactivating your account will hide your profile from all matching algorithms and cancel all pending requests. Historical completed appointment data will be retained for tax purposes.",
      btnDeactivate: "Deactivate my account",
      tooltip: "Coming soon — GDPR compliance"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.settingsPage = translations.settings;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.settingsPage');
