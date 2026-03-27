const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  appointments: {
    navDashboard: "Dashboard",
    navAppointments: "Appointments",
    title: "Appointments",
    subtitle: "Manage your schedule and past visits.",
    tabs: {
      today: "Today",
      upcoming: "Upcoming",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    card: {
      practice: "Practice",
      reason: "Reason: ",
      na: "N/A",
      viewDetails: "View Details"
    },
    emptyState: {
      title: "No appointments found",
      desc: "You don't have any {tab} appointments."
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.appointments = translations.appointments;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.appointments');
