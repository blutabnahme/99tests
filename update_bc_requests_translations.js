const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  en: {
    bcRequests: {
      "title": "Custom Time Requests",
      "subtitle": "Review and respond to patients who proposed custom booking times.",
      "noRequestsTitle": "No pending requests",
      "noRequestsDesc": "You don't have any custom time requests at the moment."
    },
    requestCard: {
      "pending": "Request pending",
      "accepted": "Request accepted",
      "declined": "Request declined",
      "counter_proposed": "Counter proposed",
      "urgent": "Urgent",
      "routine": "Routine",
      "homeVisit": "Home Visit",
      "inPractice": "In Practice",
      "proposedTime": "Proposed Time",
      "at": "at",
      "patientDetails": "Patient Details",
      "testReqs": "Test Requirements",
      "standardDraw": "Standard venipuncture",
      "requestedBy": "Requested by {name}",
      "noteFromPatient": "Note from patient:",
      "proposeAltTime": "Propose Alternative Time",
      "cancel": "Cancel",
      "sending": "Sending...",
      "sendProposal": "Send Proposal",
      "decline": "Decline",
      "proposeNewTime": "Propose new time",
      "accepting": "Accepting...",
      "acceptRequest": "Accept request"
    }
  },
  de: {
    bcRequests: {
      "title": "Individuelle Zeitangebote",
      "subtitle": "Überprüfen und beantworten Sie Patienten, die individuelle Buchungszeiten vorgeschlagen haben.",
      "noRequestsTitle": "Keine ausstehenden Anfragen",
      "noRequestsDesc": "Sie haben derzeit keine individuellen Zeitangebote."
    },
    requestCard: {
      "pending": "Anfrage ausstehend",
      "accepted": "Anfrage akzeptiert",
      "declined": "Anfrage abgelehnt",
      "counter_proposed": "Gegenvorschlag gesendet",
      "urgent": "Dringend",
      "routine": "Routine",
      "homeVisit": "Hausbesuch",
      "inPractice": "Praxisbesuch",
      "proposedTime": "Vorgeschlagene Zeit",
      "at": "um",
      "patientDetails": "Patientendetails",
      "testReqs": "Testanforderungen",
      "standardDraw": "Standard-Blutentnahme",
      "requestedBy": "Angefordert von {name}",
      "noteFromPatient": "Notiz des Patienten:",
      "proposeAltTime": "Alternative Zeit vorschlagen",
      "cancel": "Abbrechen",
      "sending": "Wird gesendet...",
      "sendProposal": "Vorschlag senden",
      "decline": "Ablehnen",
      "proposeNewTime": "Neue Zeit vorschlagen",
      "accepting": "Wird akzeptiert...",
      "acceptRequest": "Anfrage akzeptieren"
    }
  },
  es: {
    bcRequests: {
      "title": "Solicitudes de tiempo personalizadas",
      "subtitle": "Revisa y responde a los pacientes que propusieron tiempos de reserva personalizados.",
      "noRequestsTitle": "Sin solicitudes pendientes",
      "noRequestsDesc": "No tienes solicitudes de tiempo personalizadas en este momento."
    },
    requestCard: {
      "pending": "Solicitud pendiente",
      "accepted": "Solicitud aceptada",
      "declined": "Solicitud rechazada",
      "counter_proposed": "Contrapropuesta enviada",
      "urgent": "Urgente",
      "routine": "Rutina",
      "homeVisit": "Visita a domicilio",
      "inPractice": "En consulta",
      "proposedTime": "Hora propuesta",
      "at": "a las",
      "patientDetails": "Detalles del paciente",
      "testReqs": "Requisitos de la prueba",
      "standardDraw": "Extracción de sangre estándar",
      "requestedBy": "Solicitado por {name}",
      "noteFromPatient": "Nota del paciente:",
      "proposeAltTime": "Proponer hora alternativa",
      "cancel": "Cancelar",
      "sending": "Enviando...",
      "sendProposal": "Enviar propuesta",
      "decline": "Rechazar",
      "proposeNewTime": "Proponer nueva hora",
      "accepting": "Aceptando...",
      "acceptRequest": "Aceptar solicitud"
    }
  },
  nl: {
    bcRequests: {
      "title": "Aangepaste tijdsverzoeken",
      "subtitle": "Bekijk en reageer op patiënten die aangepaste boekingstijden hebben voorgesteld.",
      "noRequestsTitle": "Geen openstaande verzoeken",
      "noRequestsDesc": "Je hebt momenteel geen aangepaste tijdsverzoeken."
    },
    requestCard: {
      "pending": "Verzoek in behandeling",
      "accepted": "Verzoek geaccepteerd",
      "declined": "Verzoek afgewezen",
      "counter_proposed": "Tegenvoorstel gedaan",
      "urgent": "Dringend",
      "routine": "Routine",
      "homeVisit": "Huisbezoek",
      "inPractice": "In praktijk",
      "proposedTime": "Voorgestelde tijd",
      "at": "om",
      "patientDetails": "Patiëntgegevens",
      "testReqs": "Testvereisten",
      "standardDraw": "Standaard bloedafname",
      "requestedBy": "Aangevraagd door {name}",
      "noteFromPatient": "Notitie van patiënt:",
      "proposeAltTime": "Alternatieve tijd voorstellen",
      "cancel": "Annuleren",
      "sending": "Verzenden...",
      "sendProposal": "Voorstel verzenden",
      "decline": "Afwijzen",
      "proposeNewTime": "Nieuwe tijd voorstellen",
      "accepting": "Accepteren...",
      "acceptRequest": "Verzoek accepteren"
    }
  },
  fr: {
    bcRequests: {
      "title": "Demandes de temps personnalisées",
      "subtitle": "Examinez et répondez aux patients qui ont proposé des heures de réservation personnalisées.",
      "noRequestsTitle": "Aucune demande en attente",
      "noRequestsDesc": "Vous n'avez aucune demande de temps personnalisée pour le moment."
    },
    requestCard: {
      "pending": "Demande en attente",
      "accepted": "Demande acceptée",
      "declined": "Demande refusée",
      "counter_proposed": "Contre-proposition envoyée",
      "urgent": "Urgent",
      "routine": "Routine",
      "homeVisit": "Visite à domicile",
      "inPractice": "Au cabinet",
      "proposedTime": "Heure proposée",
      "at": "à",
      "patientDetails": "Détails du patient",
      "testReqs": "Exigences du test",
      "standardDraw": "Prélèvement sanguin standard",
      "requestedBy": "Demandé par {name}",
      "noteFromPatient": "Note du patient:",
      "proposeAltTime": "Proposer une autre heure",
      "cancel": "Annuler",
      "sending": "Envoi...",
      "sendProposal": "Envoyer la proposition",
      "decline": "Refuser",
      "proposeNewTime": "Proposer une nouvelle heure",
      "accepting": "Acceptation...",
      "acceptRequest": "Accepter la demande"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\\n')) raw = raw.slice(0, -2);
  const data = JSON.parse(raw);
  
  if (!data.hc) {
    data.hc = {};
  }
  
  data.hc.bcRequests = translations[loc].bcRequests;
  data.hc.requestCard = translations[loc].requestCard;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully added bcRequests and requestCard to all locales.');
