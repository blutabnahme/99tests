const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  profilePage: {
    notFound: {
      title: "Profile Not Found",
      desc: "It looks like your Blood Collector profile hasn't been completely set up yet. Please complete the registration process to access your dashboard.",
      btn: "Sign Out & Complete Profile"
    },
    incomplete: {
      title: "Your profile is incomplete",
      desc: "Complete all sections to start receiving matched opportunities."
    },
    header: {
      subtitle: "Manage your professional profile and service details."
    },
    hero: {
      active: "Active",
      independent: "Independent",
      memberSince: "Member since {date}",
      collections: "Collections",
      avgRating: "Average Rating"
    },
    personal: {
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      bio: "Bio",
      noBio: "No bio yet."
    },
    professional: {
      qualification: "Qualification",
      specialExp: "Special Experience",
      expLabels: {
        minors: "Minors",
        elderly: "Elderly",
        difficultVeins: "Difficult Veins",
        obese: "Obese"
      },
      noExp: "No special experience stated.",
      equipment: "Equipment",
      noEquipment: "No equipment stated."
    },
    service: {
      baseAddress: "Base Address",
      travelRadius: "Travel Radius",
      baseFees: "Base Fees",
      practiceVisit: "Practice Visit",
      homeVisit: "Home Visit",
      noVisits: "No visits offered yet."
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.profilePage = translations.profilePage;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.profilePage');
