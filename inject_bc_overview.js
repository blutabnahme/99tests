const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  en: {
    bcOverview: {
      overview: "Overview",
      welcomeBack: "Welcome back",
      upcomingAppointments: "Upcoming Appointments",
      activeApplications: "Active Applications",
      recentEarnings: "Recent Earnings",
      totalCollections: "Total: {count}",
      rating: "Rating",
      todaysAppointments: "Today's Appointments",
      viewAll: "View all",
      status: "Status",
      inProgress: "In Progress",
      confirmed: "Confirmed",
      open: "Open",
      noAppointmentsToday: "No appointments scheduled for today.",
      upcomingNext7: "Upcoming (Next 7 Days)",
      view: "View",
      noUpcoming: "No other upcoming appointments this week.",
      recentPast: "Recent Past",
      awaitingRating: "Awaiting rating",
      noPastApts: "No past appointments yet.",
      earningsSnapshot: "Earnings Snapshot",
      viewFullReport: "View full report",
      noEarningsData: "No earnings data yet",
      completeFirstApt: "Complete your first appointment to see your monthly chart.",
      nextPayout: "Next Payout",
      scheduled: "Scheduled",
      expectedApprox: "Expected approx. 1st of next month",
      lastPayout: "Last Payout"
    },
    nav: {
      bloodCollector: "Blood Collector",
      loading: "Loading...",
      signingOut: "Signing out..."
    }
  },
  de: {
    bcOverview: {
      overview: "Übersicht",
      welcomeBack: "Willkommen zurück",
      upcomingAppointments: "Bevorstehende Termine",
      activeApplications: "Aktive Bewerbungen",
      recentEarnings: "Aktuelle Einnahmen",
      totalCollections: "Gesamt: {count}",
      rating: "Bewertung",
      todaysAppointments: "Heutige Termine",
      viewAll: "Alle ansehen",
      status: "Status",
      inProgress: "In Bearbeitung",
      confirmed: "Bestätigt",
      open: "Öffnen",
      noAppointmentsToday: "Heute keine Termine geplant.",
      upcomingNext7: "Bevorstehend (Nächste 7 Tage)",
      view: "Ansehen",
      noUpcoming: "Keine weiteren bevorstehenden Termine diese Woche.",
      recentPast: "Kürzliche Vergangenheit",
      awaitingRating: "Wartet auf Bewertung",
      noPastApts: "Noch keine vergangenen Termine.",
      earningsSnapshot: "Einnahmen-Übersicht",
      viewFullReport: "Vollständigen Bericht ansehen",
      noEarningsData: "Noch keine Einnahmendaten",
      completeFirstApt: "Schließen Sie Ihren ersten Termin ab, um Ihr monatliches Diagramm zu sehen.",
      nextPayout: "Nächste Auszahlung",
      scheduled: "Geplant",
      expectedApprox: "Voraussichtlich ca. 1. des nächsten Monats",
      lastPayout: "Letzte Auszahlung"
    },
    nav: {
      bloodCollector: "Blutabnehmer",
      loading: "Wird geladen...",
      signingOut: "Abmelden..."
    }
  },
  es: {
    bcOverview: {
      overview: "Visión general",
      welcomeBack: "Bienvenido de nuevo",
      upcomingAppointments: "Próximas citas",
      activeApplications: "Solicitudes activas",
      recentEarnings: "Ingresos recientes",
      totalCollections: "Total: {count}",
      rating: "Puntuación",
      todaysAppointments: "Citas de hoy",
      viewAll: "Ver todo",
      status: "Estado",
      inProgress: "En curso",
      confirmed: "Confirmado",
      open: "Abrir",
      noAppointmentsToday: "No hay citas programadas para hoy.",
      upcomingNext7: "Próximos (Próximos 7 días)",
      view: "Ver",
      noUpcoming: "No hay otras citas próximas esta semana.",
      recentPast: "Pasado reciente",
      awaitingRating: "Esperando valoración",
      noPastApts: "Aún no hay citas pasadas.",
      earningsSnapshot: "Resumen de ingresos",
      viewFullReport: "Ver informe completo",
      noEarningsData: "Aún no hay datos de ingresos",
      completeFirstApt: "Complete su primera cita para ver su gráfico mensual.",
      nextPayout: "Próximo pago",
      scheduled: "Programado",
      expectedApprox: "Estimado aprox. el 1 del mes siguiente",
      lastPayout: "Último pago"
    },
    nav: {
      bloodCollector: "Recolector de Sangre",
      loading: "Cargando...",
      signingOut: "Cerrando sesión..."
    }
  },
  nl: {
    bcOverview: {
      overview: "Overzicht",
      welcomeBack: "Welkom terug",
      upcomingAppointments: "Aankomende afspraken",
      activeApplications: "Actieve aanmeldingen",
      recentEarnings: "Recente inkomsten",
      totalCollections: "Totaal: {count}",
      rating: "Beoordeling",
      todaysAppointments: "Afspraken van vandaag",
      viewAll: "Bekijk alles",
      status: "Status",
      inProgress: "In uitvoering",
      confirmed: "Bevestigd",
      open: "Open",
      noAppointmentsToday: "Geen afspraken gepland voor vandaag.",
      upcomingNext7: "Aankomend (Volgende 7 dagen)",
      view: "Bekijk",
      noUpcoming: "Geen andere aankomende afspraken deze week.",
      recentPast: "Recent verleden",
      awaitingRating: "Wachten op beoordeling",
      noPastApts: "Nog geen afgelopen afspraken.",
      earningsSnapshot: "Inkomstenoverzicht",
      viewFullReport: "Bekijk volledig rapport",
      noEarningsData: "Nog geen inkomstengegevens",
      completeFirstApt: "Voltooi je eerste afspraak om je maandelijkse grafiek te zien.",
      nextPayout: "Volgende uitbetaling",
      scheduled: "Gepland",
      expectedApprox: "Verwacht ca. 1e van volgende maand",
      lastPayout: "Laatste uitbetaling"
    },
    nav: {
      bloodCollector: "Bloedafnemer",
      loading: "Laden...",
      signingOut: "Uitloggen..."
    }
  },
  fr: {
    bcOverview: {
      overview: "Aperçu",
      welcomeBack: "Bon retour",
      upcomingAppointments: "Rendez-vous à venir",
      activeApplications: "Candidatures actives",
      recentEarnings: "Revenus récents",
      totalCollections: "Total : {count}",
      rating: "Évaluation",
      todaysAppointments: "Rendez-vous d'aujourd'hui",
      viewAll: "Voir tout",
      status: "Statut",
      inProgress: "En cours",
      confirmed: "Confirmé",
      open: "Ouvrir",
      noAppointmentsToday: "Aucun rendez-vous prévu aujourd'hui.",
      upcomingNext7: "À venir (7 prochains jours)",
      view: "Voir",
      noUpcoming: "Aucun autre rendez-vous prévu cette semaine.",
      recentPast: "Passé récent",
      awaitingRating: "En attente d'évaluation",
      noPastApts: "Pas encore de rendez-vous passés.",
      earningsSnapshot: "Aperçu des revenus",
      viewFullReport: "Voir le rapport complet",
      noEarningsData: "Pas encore de données de revenus",
      completeFirstApt: "Terminez votre premier rendez-vous pour voir votre graphique mensuel.",
      nextPayout: "Prochain paiement",
      scheduled: "Programmé",
      expectedApprox: "Prévu env. le 1er du mois prochain",
      lastPayout: "Dernier paiement"
    },
    nav: {
      bloodCollector: "Préleveur de sang",
      loading: "Chargement...",
      signingOut: "Déconnexion..."
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\\n')) raw = raw.slice(0, -2);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.overview = translations[loc].bcOverview;
  
  // Mix into nav
  data.nav.bloodCollector = translations[loc].nav.bloodCollector;
  data.nav.loading = translations[loc].nav.loading;
  data.nav.signingOut = translations[loc].nav.signingOut;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully added bcOverview and nav strings to all locales.');
