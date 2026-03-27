const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  en: {
    patients: {
      "listTitle": "Patient Directory",
      "searchPlaceholder": "Search by name or email...",
      "table": {
        "columns": {
          "patient": "Patient",
          "contact": "Contact",
          "lastVisit": "Last Visit",
          "totalCases": "Total Cases",
          "status": "Status",
          "action": "Action"
        },
        "emptyTitle": "No patients found",
        "emptyDesc": "Try adjusting your search filters",
        "cases": "{count} cases"
      },
      "buttons": {
        "viewDetails": "View Details",
        "viewCase": "View Case"
      },
      "detail": {
        "breadcrumb": "Patients",
        "editPatient": "Edit Patient",
        "profileInfo": "Profile Information",
        "dateOfBirth": "Date of Birth",
        "gender": "Gender",
        "contactInfo": "Contact Information",
        "email": "Email",
        "phone": "Phone",
        "address": "Address",
        "caseHistory": "Case History",
        "caseHistoryDesc": "All cases associated with this patient.",
        "historyTable": {
          "columns": {
            "case": "Case",
            "date": "Date",
            "visitType": "Visit Type",
            "collector": "Collector",
            "status": "Status",
            "action": "Action"
          },
          "emptyTitle": "No case history",
          "emptyDesc": "This patient has no recorded cases yet."
        }
      }
    },
    billing: {
      "overviewTitle": "Billing Overview",
      "currentPeriod": "Current Period",
      "paymentMethod": {
        "title": "Payment Method",
        "sepa": "SEPA Direct Debit",
        "mastercard": "Mastercard ending in 4242"
      },
      "metrics": {
        "orgFees": "Organization Fees",
        "vat": "VAT (19%)",
        "totalDue": "Total Due"
      },
      "tally": {
        "title": "Period Tally",
        "practiceLabel": "Practice Visits",
        "homeLabel": "Home Visits"
      },
      "invoice": {
        "historyBtn": "Invoice History"
      },
      "historyTable": {
        "title": "Invoice History",
        "columns": {
          "invoice": "Invoice",
          "period": "Period",
          "cases": "Cases",
          "orgFees": "Org Fees",
          "matLogFees": "Mat/Log Fees",
          "subtotal": "Subtotal",
          "vat": "VAT",
          "total": "Total",
          "status": "Status",
          "action": "Action"
        },
        "buttons": {
          "pdf": "PDF",
          "downloadPdf": "Download PDF"
        },
        "includedCases": {
          "title": "Included Cases",
          "columns": {
            "date": "Date",
            "patient": "Patient",
            "visit": "Visit",
            "tests": "Tests",
            "fee": "Fee (Excl. VAT)"
          },
          "visitType": {
            "home": "Home Visit",
            "practice": "Practice"
          },
          "empty": "No isolated case data available for this legacy invoice."
        },
        "empty": "No historical invoices available.",
        "caseCount": "{count} Cases"
      }
    },
    team: {
      "title": "Team",
      "subtitle": "Manage who has access to your organization.",
      "inviteMember": "Invite Member",
      "members": "Members",
      "noMembers": "No team members yet",
      "inviteSubtitle": "Invite colleagues to collaborate on cases.",
      "roleAdmin": "Admin",
      "roleCaseManager": "Case Manager",
      "roleViewer": "Viewer",
      "activity": "Activity",
      "noActivity": "No activity yet.",
      "inviteModalTitle": "Invite team member",
      "inviteModalSubtitle": "They'll receive an invitation to join your organization.",
      "roleAdminDesc": "Full access to all features and settings.",
      "roleCaseManagerDesc": "Can create and manage cases, view patients.",
      "roleViewerDesc": "Read-only access to cases and dashboard.",
      "removeMember": "Remove member",
      "invite": {
        "failed": "Failed to invite member.",
        "unexpectedError": "An unexpected error occurred."
      },
      "activityLogs": {
        "invited": "Invited <email>{email}</email> as <role>{role}</role>",
        "roleChanged": "Changed role to <newRole>{newRole}</newRole>",
        "removed": "Removed a team member",
        "reactivated": "Reactivated a team member"
      },
      "badges": {
        "pending": "PENDING"
      },
      "invitedAgo": "Invited {time} ago",
      "actions": {
        "changeTo": "Change to {role}"
      },
      "inviteModalPlaceholder": "colleague@company.de",
      "inviteModalInviting": "Inviting...",
      "inviteModalInviteBtn": "Invite"
    }
  },
  de: {
    patients: {
      "listTitle": "Patientenverzeichnis",
      "searchPlaceholder": "Nach Name oder E-Mail suchen...",
      "table": {
        "columns": {
          "patient": "Patient",
          "contact": "Kontakt",
          "lastVisit": "Letzter Besuch",
          "totalCases": "Gesamte Fälle",
          "status": "Status",
          "action": "Aktion"
        },
        "emptyTitle": "Keine Patienten gefunden",
        "emptyDesc": "Bitte passen Sie Ihre Suchfilter an",
        "cases": "{count} Fälle"
      },
      "buttons": {
        "viewDetails": "Details ansehen",
        "viewCase": "Fall ansehen"
      },
      "detail": {
        "breadcrumb": "Patienten",
        "editPatient": "Patient bearbeiten",
        "profileInfo": "Profilinformationen",
        "dateOfBirth": "Geburtsdatum",
        "gender": "Geschlecht",
        "contactInfo": "Kontaktinformationen",
        "email": "E-Mail",
        "phone": "Telefon",
        "address": "Adresse",
        "caseHistory": "Fallhistorie",
        "caseHistoryDesc": "Alle Fälle dieses Patienten.",
        "historyTable": {
          "columns": {
            "case": "Fall",
            "date": "Datum",
            "visitType": "Besuchsart",
            "collector": "Entnehmer",
            "status": "Status",
            "action": "Aktion"
          },
          "emptyTitle": "Keine Fallhistorie",
          "emptyDesc": "Dieser Patient hat noch keine registrierten Fälle."
        }
      }
    },
    billing: {
      "overviewTitle": "Abrechnungsübersicht",
      "currentPeriod": "Aktueller Zeitraum",
      "paymentMethod": {
        "title": "Zahlungsmethode",
        "sepa": "SEPA-Lastschrift",
        "mastercard": "Mastercard endet auf 4242"
      },
      "metrics": {
        "orgFees": "Organisationsgebühren",
        "vat": "MwSt. (19%)",
        "totalDue": "Fälliger Gesamtbetrag"
      },
      "tally": {
        "title": "Zeitraum-Abrechnung",
        "practiceLabel": "Praxisbesuche",
        "homeLabel": "Hausbesuche"
      },
      "invoice": {
        "historyBtn": "Rechnungshistorie"
      },
      "historyTable": {
        "title": "Rechnungshistorie",
        "columns": {
          "invoice": "Rechnung",
          "period": "Zeitraum",
          "cases": "Fälle",
          "orgFees": "Org-Gebühren",
          "matLogFees": "Mat/Log-Gebühren",
          "subtotal": "Zwischensumme",
          "vat": "MwSt.",
          "total": "Gesamt",
          "status": "Status",
          "action": "Aktion"
        },
        "buttons": {
          "pdf": "PDF",
          "downloadPdf": "PDF Herunterladen"
        },
        "includedCases": {
          "title": "Enthaltene Fälle",
          "columns": {
            "date": "Datum",
            "patient": "Patient",
            "visit": "Besuch",
            "tests": "Tests",
            "fee": "Gebühr (ohne MwSt.)"
          },
          "visitType": {
            "home": "Hausbesuch",
            "practice": "Praxis"
          },
          "empty": "Keine isolierten Falldaten für diese ältere Rechnung verfügbar."
        },
        "empty": "Keine historischen Rechnungen verfügbar.",
        "caseCount": "{count} Fälle"
      }
    },
    team: {
      "title": "Team",
      "subtitle": "Verwalten Sie, wer Zugang zu Ihrer Organisation hat.",
      "inviteMember": "Mitglied einladen",
      "members": "Mitglieder",
      "noMembers": "Noch keine Teammitglieder",
      "inviteSubtitle": "Laden Sie Kollegen ein, um an Fällen zusammenzuarbeiten.",
      "roleAdmin": "Administrator",
      "roleCaseManager": "Fallmanager",
      "roleViewer": "Betrachter",
      "activity": "Aktivität",
      "noActivity": "Noch keine Aktivität.",
      "inviteModalTitle": "Teammitglied einladen",
      "inviteModalSubtitle": "Die Person erhält eine Einladung, Ihrer Organisation beizutreten.",
      "roleAdminDesc": "Vollzugriff auf alle Funktionen und Einstellungen.",
      "roleCaseManagerDesc": "Kann Fälle erstellen und verwalten, Patienten einsehen.",
      "roleViewerDesc": "Nur-Lese-Zugriff auf Fälle und Dashboard.",
      "removeMember": "Mitglied entfernen",
      "invite": {
        "failed": "Einladung fehlgeschlagen.",
        "unexpectedError": "Ein unerwarteter Fehler ist aufgetreten."
      },
      "activityLogs": {
        "invited": "<email>{email}</email> als <role>{role}</role> eingeladen",
        "roleChanged": "Rolle in <newRole>{newRole}</newRole> geändert",
        "removed": "Ein Teammitglied wurde entfernt",
        "reactivated": "Ein Teammitglied wurde reaktiviert"
      },
      "badges": {
        "pending": "AUSSTEHEND"
      },
      "invitedAgo": "Vor {time} eingeladen",
      "actions": {
        "changeTo": "Ändern zu {role}"
      },
      "inviteModalPlaceholder": "kollege@unternehmen.de",
      "inviteModalInviting": "Wird eingeladen...",
      "inviteModalInviteBtn": "Einladen"
    }
  },
  es: {
    patients: {
      "listTitle": "Directorio de pacientes",
      "searchPlaceholder": "Buscar por nombre o correo...",
      "table": {
        "columns": {
          "patient": "Paciente",
          "contact": "Contacto",
          "lastVisit": "Última visita",
          "totalCases": "Casos totales",
          "status": "Estado",
          "action": "Acción"
        },
        "emptyTitle": "No se encontraron pacientes",
        "emptyDesc": "Intenta ajustar tus filtros de búsqueda",
        "cases": "{count} casos"
      },
      "buttons": {
        "viewDetails": "Ver detalles",
        "viewCase": "Ver caso"
      },
      "detail": {
        "breadcrumb": "Pacientes",
        "editPatient": "Editar paciente",
        "profileInfo": "Información del perfil",
        "dateOfBirth": "Fecha de nacimiento",
        "gender": "Género",
        "contactInfo": "Información de contacto",
        "email": "Correo",
        "phone": "Teléfono",
        "address": "Dirección",
        "caseHistory": "Historial de casos",
        "caseHistoryDesc": "Todos los casos asociados a este paciente.",
        "historyTable": {
          "columns": {
            "case": "Caso",
            "date": "Fecha",
            "visitType": "Tipo de visita",
            "collector": "Recolector",
            "status": "Estado",
            "action": "Acción"
          },
          "emptyTitle": "Sin historial",
          "emptyDesc": "Este paciente aún no tiene casos registrados."
        }
      }
    },
    billing: {
      "overviewTitle": "Resumen de facturación",
      "currentPeriod": "Período actual",
      "paymentMethod": {
        "title": "Método de pago",
        "sepa": "Domiciliación SEPA",
        "mastercard": "Mastercard terminada en 4242"
      },
      "metrics": {
        "orgFees": "Cuotas de organización",
        "vat": "IVA (19%)",
        "totalDue": "Total adeudado"
      },
      "tally": {
        "title": "Recuento del período",
        "practiceLabel": "Visitas a consulta",
        "homeLabel": "Visitas a domicilio"
      },
      "invoice": {
        "historyBtn": "Historial de facturas"
      },
      "historyTable": {
        "title": "Historial de facturas",
        "columns": {
          "invoice": "Factura",
          "period": "Período",
          "cases": "Casos",
          "orgFees": "Cuotas org",
          "matLogFees": "Cuotas mat/log",
          "subtotal": "Subtotal",
          "vat": "IVA",
          "total": "Total",
          "status": "Estado",
          "action": "Acción"
        },
        "buttons": {
          "pdf": "PDF",
          "downloadPdf": "Descargar PDF"
        },
        "includedCases": {
          "title": "Casos incluidos",
          "columns": {
            "date": "Fecha",
            "patient": "Paciente",
            "visit": "Visita",
            "tests": "Pruebas",
            "fee": "Tarifa (sin IVA)"
          },
          "visitType": {
            "home": "Visita a domicilio",
            "practice": "Consulta"
          },
          "empty": "No hay datos de casos aislados disponibles para esta factura antigua."
        },
        "empty": "No hay facturas históricas disponibles.",
        "caseCount": "{count} Casos"
      }
    },
    team: {
      "title": "Equipo",
      "subtitle": "Gestiona quién tiene acceso a tu organización.",
      "inviteMember": "Invitar miembro",
      "members": "Miembros",
      "noMembers": "Aún no hay miembros en el equipo",
      "inviteSubtitle": "Invita a colegas a colaborar en los casos.",
      "roleAdmin": "Administrador",
      "roleCaseManager": "Gestor de casos",
      "roleViewer": "Lector",
      "activity": "Actividad",
      "noActivity": "Aún no hay actividad.",
      "inviteModalTitle": "Invitar miembro del equipo",
      "inviteModalSubtitle": "Recibirán una invitación para unirse a tu organización.",
      "roleAdminDesc": "Acceso completo a todas las funciones.",
      "roleCaseManagerDesc": "Puede crear y gestionar casos, ver pacientes.",
      "roleViewerDesc": "Acceso de solo lectura a casos y panel.",
      "removeMember": "Eliminar miembro",
      "invite": {
        "failed": "Fallo al invitar al miembro.",
        "unexpectedError": "Ocurrió un error inesperado."
      },
      "activityLogs": {
        "invited": "Invitó a <email>{email}</email> como <role>{role}</role>",
        "roleChanged": "Cambió el rol a <newRole>{newRole}</newRole>",
        "removed": "Eliminó a un miembro del equipo",
        "reactivated": "Reactivó a un miembro del equipo"
      },
      "badges": {
        "pending": "PENDIENTE"
      },
      "invitedAgo": "Invitado hace {time}",
      "actions": {
        "changeTo": "Cambiar a {role}"
      },
      "inviteModalPlaceholder": "colega@empresa.es",
      "inviteModalInviting": "Invitando...",
      "inviteModalInviteBtn": "Invitar"
    }
  },
  nl: {
    patients: {
      "listTitle": "Patiëntenlijst",
      "searchPlaceholder": "Zoek op naam of e-mail...",
      "table": {
        "columns": {
          "patient": "Patiënt",
          "contact": "Contact",
          "lastVisit": "Laatste bezoek",
          "totalCases": "Totaal cases",
          "status": "Status",
          "action": "Actie"
        },
        "emptyTitle": "Geen patiënten gevonden",
        "emptyDesc": "Probeer je zoekfilters aan te passen",
        "cases": "{count} cases"
      },
      "buttons": {
        "viewDetails": "Details bekijken",
        "viewCase": "Case bekijken"
      },
      "detail": {
        "breadcrumb": "Patiënten",
        "editPatient": "Patiënt bewerken",
        "profileInfo": "Profielinformatie",
        "dateOfBirth": "Geboortedatum",
        "gender": "Geslacht",
        "contactInfo": "Contactinformatie",
        "email": "E-mail",
        "phone": "Telefoon",
        "address": "Adres",
        "caseHistory": "Geschiedenis cases",
        "caseHistoryDesc": "Alle cases gekoppeld aan deze patiënt.",
        "historyTable": {
          "columns": {
            "case": "Case",
            "date": "Datum",
            "visitType": "Bezoektype",
            "collector": "Afnemer",
            "status": "Status",
            "action": "Actie"
          },
          "emptyTitle": "Geen geschiedenis",
          "emptyDesc": "Deze patiënt heeft nog geen geregistreerde cases."
        }
      }
    },
    billing: {
      "overviewTitle": "Facturatieoverzicht",
      "currentPeriod": "Huidige periode",
      "paymentMethod": {
        "title": "Betaalmethode",
        "sepa": "SEPA Automatische Incasso",
        "mastercard": "Mastercard eindigend op 4242"
      },
      "metrics": {
        "orgFees": "Organisatiekosten",
        "vat": "Btw (19%)",
        "totalDue": "Totaal verschuldigd"
      },
      "tally": {
        "title": "Periodetelling",
        "practiceLabel": "Praktijkbezoeken",
        "homeLabel": "Huisbezoeken"
      },
      "invoice": {
        "historyBtn": "Factuurgeschiedenis"
      },
      "historyTable": {
        "title": "Factuurgeschiedenis",
        "columns": {
          "invoice": "Factuur",
          "period": "Periode",
          "cases": "Cases",
          "orgFees": "Org kosten",
          "matLogFees": "Mat/log kosten",
          "subtotal": "Subtotaal",
          "vat": "Btw",
          "total": "Totaal",
          "status": "Status",
          "action": "Actie"
        },
        "buttons": {
          "pdf": "PDF",
          "downloadPdf": "PDF downloaden"
        },
        "includedCases": {
          "title": "Inbegrepen cases",
          "columns": {
            "date": "Datum",
            "patient": "Patiënt",
            "visit": "Bezoek",
            "tests": "Tests",
            "fee": "Kosten (excl. btw)"
          },
          "visitType": {
            "home": "Huisbezoek",
            "practice": "Praktijk"
          },
          "empty": "Geen geïsoleerde casedata beschikbaar voor deze oude factuur."
        },
        "empty": "Geen historische facturen beschikbaar.",
        "caseCount": "{count} Cases"
      }
    },
    team: {
      "title": "Team",
      "subtitle": "Beheer wie toegang heeft tot je organisatie.",
      "inviteMember": "Lid uitnodigen",
      "members": "Leden",
      "noMembers": "Nog geen teamleden",
      "inviteSubtitle": "Nodig collega's uit om samen te werken aan cases.",
      "roleAdmin": "Beheerder",
      "roleCaseManager": "Case manager",
      "roleViewer": "Kijker",
      "activity": "Activiteit",
      "noActivity": "Nog geen activiteit.",
      "inviteModalTitle": "Teamlid uitnodigen",
      "inviteModalSubtitle": "Ze ontvangen een uitnodiging om lid te worden van je organisatie.",
      "roleAdminDesc": "Volledige toegang tot alle functies.",
      "roleCaseManagerDesc": "Kan cases aanmaken en beheren, patiënten bekijken.",
      "roleViewerDesc": "Alleen-lezen toegang tot cases en dashboard.",
      "removeMember": "Lid verwijderen",
      "invite": {
        "failed": "Uitnodigen mislukt.",
        "unexpectedError": "Er is een onverwachte fout opgetreden."
      },
      "activityLogs": {
        "invited": "<email>{email}</email> als <role>{role}</role> uitgenodigd",
        "roleChanged": "Rol gewijzigd naar <newRole>{newRole}</newRole>",
        "removed": "Een teamlid verwijderd",
        "reactivated": "Een teamlid heractiveerd"
      },
      "badges": {
        "pending": "IN AFWACHTING"
      },
      "invitedAgo": "{time} geleden uitgenodigd",
      "actions": {
        "changeTo": "Wijzig in {role}"
      },
      "inviteModalPlaceholder": "collega@bedrijf.nl",
      "inviteModalInviting": "Uitnodigen...",
      "inviteModalInviteBtn": "Uitnodigen"
    }
  },
  fr: {
    patients: {
      "listTitle": "Annuaire des patients",
      "searchPlaceholder": "Rechercher par nom ou email...",
      "table": {
        "columns": {
          "patient": "Patient",
          "contact": "Contact",
          "lastVisit": "Dernière visite",
          "totalCases": "Cas totaux",
          "status": "Statut",
          "action": "Action"
        },
        "emptyTitle": "Aucun patient trouvé",
        "emptyDesc": "Essayez de modifier vos filtres de recherche",
        "cases": "{count} cas"
      },
      "buttons": {
        "viewDetails": "Voir les détails",
        "viewCase": "Voir le cas"
      },
      "detail": {
        "breadcrumb": "Patients",
        "editPatient": "Modifier le patient",
        "profileInfo": "Informations du profil",
        "dateOfBirth": "Date de naissance",
        "gender": "Genre",
        "contactInfo": "Coordonnées",
        "email": "Email",
        "phone": "Téléphone",
        "address": "Adresse",
        "caseHistory": "Historique des cas",
        "caseHistoryDesc": "Tous les cas associés à ce patient.",
        "historyTable": {
          "columns": {
            "case": "Cas",
            "date": "Date",
            "visitType": "Type de visite",
            "collector": "Préleveur",
            "status": "Statut",
            "action": "Action"
          },
          "emptyTitle": "Aucun historique",
          "emptyDesc": "Ce patient n'a pas encore de cas enregistré."
        }
      }
    },
    billing: {
      "overviewTitle": "Aperçu de la facturation",
      "currentPeriod": "Période actuelle",
      "paymentMethod": {
        "title": "Mode de paiement",
        "sepa": "Prélèvement SEPA",
        "mastercard": "Mastercard se terminant par 4242"
      },
      "metrics": {
        "orgFees": "Frais d'organisation",
        "vat": "TVA (19%)",
        "totalDue": "Total dû"
      },
      "tally": {
        "title": "Bilan de la période",
        "practiceLabel": "Visites au cabinet",
        "homeLabel": "Visites à domicile"
      },
      "invoice": {
        "historyBtn": "Historique des factures"
      },
      "historyTable": {
        "title": "Historique des factures",
        "columns": {
          "invoice": "Facture",
          "period": "Période",
          "cases": "Cas",
          "orgFees": "Frais orga",
          "matLogFees": "Frais mat/log",
          "subtotal": "Sous-total",
          "vat": "TVA",
          "total": "Total",
          "status": "Statut",
          "action": "Action"
        },
        "buttons": {
          "pdf": "PDF",
          "downloadPdf": "Télécharger le PDF"
        },
        "includedCases": {
          "title": "Cas inclus",
          "columns": {
            "date": "Date",
            "patient": "Patient",
            "visit": "Visite",
            "tests": "Tests",
            "fee": "Frais (HT)"
          },
          "visitType": {
            "home": "Visite à domicile",
            "practice": "Cabinet"
          },
          "empty": "Aucune donnée de cas isolée disponible pour cette ancienne facture."
        },
        "empty": "Aucune facture historique disponible.",
        "caseCount": "{count} Cas"
      }
    },
    team: {
      "title": "Équipe",
      "subtitle": "Gérez qui a accès à votre organisation.",
      "inviteMember": "Inviter un membre",
      "members": "Membres",
      "noMembers": "Aucun membre dans l'équipe",
      "inviteSubtitle": "Invitez des collègues à collaborer sur des cas.",
      "roleAdmin": "Administrateur",
      "roleCaseManager": "Gestionnaire de cas",
      "roleViewer": "Lecteur",
      "activity": "Activité",
      "noActivity": "Aucune activité pour le moment.",
      "inviteModalTitle": "Inviter un membre",
      "inviteModalSubtitle": "Il recevra une invitation à rejoindre votre organisation.",
      "roleAdminDesc": "Accès complet à toutes les fonctions.",
      "roleCaseManagerDesc": "Peut gérer les cas et voir les patients.",
      "roleViewerDesc": "Accès en lecture seule.",
      "removeMember": "Supprimer le membre",
      "invite": {
        "failed": "Échec de l'invitation.",
        "unexpectedError": "Une erreur inattendue est survenue."
      },
      "activityLogs": {
        "invited": "A invité <email>{email}</email> en tant que <role>{role}</role>",
        "roleChanged": "A changé le rôle en <newRole>{newRole}</newRole>",
        "removed": "A supprimé un membre de l'équipe",
        "reactivated": "A réactivé un membre de l'équipe"
      },
      "badges": {
        "pending": "EN ATTENTE"
      },
      "invitedAgo": "Invité il y a {time}",
      "actions": {
        "changeTo": "Passer à {role}"
      },
      "inviteModalPlaceholder": "collegue@entreprise.fr",
      "inviteModalInviting": "Invitation en cours...",
      "inviteModalInviteBtn": "Inviter"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.hc) {
    data.hc = {};
  }
  
  data.hc.patients = translations[loc].patients;
  data.hc.billing = translations[loc].billing;
  data.hc.team = translations[loc].team;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\\n');
}

console.log('Successfully added hc.patients, hc.billing, and hc.team to all locales.');
