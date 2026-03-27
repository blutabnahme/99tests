const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  profileModals: {
    errors: {
      updateFailed: "Failed to update profile",
      fillRequired: "Please fill all required fields.",
      negative: "Settings cannot be negative."
    },
    common: {
      cancel: "Cancel",
      saving: "Saving...",
      save: "Save Changes"
    },
    personal: {
      title: "Edit Personal Details",
      firstName: "First Name *",
      lastName: "Last Name *",
      email: "Public Email *",
      phone: "Phone Number",
      bio: "Bio"
    },
    professional: {
      title: "Edit Professional Profile",
      qualification: {
        label: "Qualification",
        select: "Select...",
        mfa: "MFA",
        doctor: "Doctor",
        nurse: "Nurse",
        paramedic: "Paramedic"
      },
      experience: {
        title: "Special Experience",
        minors: "Experience with minors (pediatric)",
        elderly: "Experience with elderly patients",
        veins: "Experience with difficult veins",
        obese: "Experience with obese patients"
      },
      equipment: {
        title: "Equipment",
        centrifuge: "Mobile Centrifuge",
        freezer: "Freezer for Samples"
      }
    },
    service: {
      title: "Edit Service & Pricing",
      address: {
        title: "Base Address",
        street: "Street Address *",
        zip: "Postal Code *",
        city: "City *"
      },
      radius: "Travel Radius",
      pricing: {
        title: "Pricing Base Rates",
        practice: "Practice Visit (€) *",
        home: "Home Visit (€) *"
      }
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.profileModals = translations.profileModals;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.profileModals');
