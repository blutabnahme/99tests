const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

for (const loc of locales) {
  const file = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.endsWith('\\n')) raw = raw.slice(0, -2);
  const data = JSON.parse(raw);
  
  if (data.settings) {
    if (!data.hc) data.hc = {};
    data.hc.settings = data.settings;
    delete data.settings;
    
    if (loc === 'en') {
       data.hc.settings.languageDisclaimer = "Translations are being progressively added. Some pages may appear in English.";
       data.hc.settings.passwordAlert = "Password change will be available once email verification is configured.";
       data.hc.settings.mfaAlert = "MFA setup coming soon.";
       data.hc.settings.invoiceMonthly = "Invoice (monthly)";
       data.hc.settings.monthlyNet30 = "Monthly, net 30 days";
       data.hc.settings.revokeConfirm = "Are you sure you want to revoke this API key? This cannot be undone.";
       data.hc.settings.keyPlaceholder = "e.g. EHR Integration, Lab Sync";
       data.hc.settings.generating = "Generating...";
       data.hc.settings.generateKeyBtn = "Generate Key";
       data.hc.settings.toastProfileUpdated = "Company Profile updated successfully!";
       data.hc.settings.revokeFailed = "Failed to revoke key";
       data.hc.settings.generateFailed = "Failed to generate key";
       data.hc.settings.errorOccurred = "An error occurred";
       data.hc.settings.notificationsTab = "Notifications";
    } else if (loc === 'de') {
       data.hc.settings.languageDisclaimer = "Übersetzungen werden schrittweise hinzugefügt. Einige Seiten können auf Englisch erscheinen.";
       data.hc.settings.passwordAlert = "Passwortänderung wird verfügbar sein, sobald die E-Mail-Verifizierung konfiguriert ist.";
       data.hc.settings.mfaAlert = "MFA-Einrichtung in Kürze verfügbar.";
       data.hc.settings.invoiceMonthly = "Rechnung (monatlich)";
       data.hc.settings.monthlyNet30 = "Monatlich, netto 30 Tage";
       data.hc.settings.revokeConfirm = "Sind Sie sicher, dass Sie diesen API-Schlüssel widerrufen möchten? Dies kann nicht rückgängig gemacht werden.";
       data.hc.settings.keyPlaceholder = "z.B. EHR-Integration, Labor-Sync";
       data.hc.settings.generating = "Wird generiert...";
       data.hc.settings.generateKeyBtn = "Schlüssel generieren";
       data.hc.settings.toastProfileUpdated = "Firmenprofil erfolgreich aktualisiert!";
       data.hc.settings.revokeFailed = "Schlüsselwiderruf fehlgeschlagen";
       data.hc.settings.generateFailed = "Schlüsselerstellung fehlgeschlagen";
       data.hc.settings.errorOccurred = "Ein Fehler ist aufgetreten";
       data.hc.settings.notificationsTab = "Benachrichtigungen";
    } else if (loc === 'es') {
       data.hc.settings.languageDisclaimer = "Las traducciones se están añadiendo progresivamente. Algunas páginas pueden aparecer en inglés.";
       data.hc.settings.passwordAlert = "El cambio de contraseña estará disponible una vez que se configure la verificación de correo electrónico.";
       data.hc.settings.mfaAlert = "Configuración MFA próximamente.";
       data.hc.settings.invoiceMonthly = "Factura (mensual)";
       data.hc.settings.monthlyNet30 = "Mensual, neto 30 días";
       data.hc.settings.revokeConfirm = "¿Estás seguro de que deseas revocar esta clave de API? Esto no se puede deshacer.";
       data.hc.settings.keyPlaceholder = "ej. Integración EHR, Sincronización lab";
       data.hc.settings.generating = "Generando...";
       data.hc.settings.generateKeyBtn = "Generar clave";
       data.hc.settings.toastProfileUpdated = "¡Perfil de empresa actualizado correctamente!";
       data.hc.settings.revokeFailed = "Fallo al revocar clave";
       data.hc.settings.generateFailed = "Fallo al generar clave";
       data.hc.settings.errorOccurred = "Ocurrió un error";
       data.hc.settings.notificationsTab = "Notificaciones";
    } else if (loc === 'nl') {
       data.hc.settings.languageDisclaimer = "Vertalingen worden stapsgewijs toegevoegd. Sommige pagina's kunnen in het Engels verschijnen.";
       data.hc.settings.passwordAlert = "Wachtwoord wijzigen is beschikbaar zodra e-mailverificatie is geconfigureerd.";
       data.hc.settings.mfaAlert = "MFA-configuratie binnenkort beschikbaar.";
       data.hc.settings.invoiceMonthly = "Factuur (maandelijks)";
       data.hc.settings.monthlyNet30 = "Maandelijks, netto 30 dagen";
       data.hc.settings.revokeConfirm = "Weet je zeker dat je deze API-sleutel wilt intrekken? Dit kan niet ongedaan worden gemaakt.";
       data.hc.settings.keyPlaceholder = "bijv. EPD Integratie, Lab Sync";
       data.hc.settings.generating = "Aan het genereren...";
       data.hc.settings.generateKeyBtn = "Sleutel genereren";
       data.hc.settings.toastProfileUpdated = "Bedrijfsprofiel succesvol bijgewerkt!";
       data.hc.settings.revokeFailed = "Sleutel intrekken mislukt";
       data.hc.settings.generateFailed = "Sleutel genereren mislukt";
       data.hc.settings.errorOccurred = "Er is een fout opgetreden";
       data.hc.settings.notificationsTab = "Meldingen";
    } else if (loc === 'fr') {
       data.hc.settings.languageDisclaimer = "Les traductions sont ajoutées progressivement. Certaines pages peuvent apparaître en anglais.";
       data.hc.settings.passwordAlert = "Le changement de mot de passe sera disponible une fois la vérification de l'e-mail configurée.";
       data.hc.settings.mfaAlert = "Configuration de la MFA bientôt disponible.";
       data.hc.settings.invoiceMonthly = "Facture (mensuelle)";
       data.hc.settings.monthlyNet30 = "Mensuel, net 30 jours";
       data.hc.settings.revokeConfirm = "Êtes-vous sûr de vouloir révoquer cette clé API ? Cette action est irréversible.";
       data.hc.settings.keyPlaceholder = "ex. Intégration DPI, Sync Labo";
       data.hc.settings.generating = "Génération...";
       data.hc.settings.generateKeyBtn = "Générer la clé";
       data.hc.settings.toastProfileUpdated = "Profil de l'entreprise mis à jour avec succès !";
       data.hc.settings.revokeFailed = "Échec de la révocation de la clé";
       data.hc.settings.generateFailed = "Échec de la génération de la clé";
       data.hc.settings.errorOccurred = "Une erreur s'est produite";
       data.hc.settings.notificationsTab = "Notifications";
    }
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }
}
console.log('Settings migrated correctly.')
