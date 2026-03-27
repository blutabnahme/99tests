CREATE TABLE IF NOT EXISTS notification_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  slug VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'patient_decides_ready', 'bc_application_received', 'payment_confirmed'
  category VARCHAR(50) NOT NULL, -- e.g. 'patient', 'hc', 'bc', 'admin', 'system'
  
  -- Display info
  name VARCHAR(200) NOT NULL, -- human-readable name, e.g. "Patient: Collectors Available"
  description TEXT, -- explains when this notification fires
  
  -- Multilingual subjects
  subject_en TEXT NOT NULL DEFAULT '',
  subject_de TEXT NOT NULL DEFAULT '',
  subject_es TEXT NOT NULL DEFAULT '',
  subject_nl TEXT NOT NULL DEFAULT '',
  subject_fr TEXT NOT NULL DEFAULT '',
  
  -- Multilingual body templates
  body_en TEXT NOT NULL DEFAULT '',
  body_de TEXT NOT NULL DEFAULT '',
  body_es TEXT NOT NULL DEFAULT '',
  body_nl TEXT NOT NULL DEFAULT '',
  body_fr TEXT NOT NULL DEFAULT '',
  
  -- Template variables available (stored as JSON array of strings)
  available_variables TEXT DEFAULT '[]', -- e.g. '["patient_name", "case_id", "collector_name", "portal_link"]'
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Channel flags
  send_email BOOLEAN NOT NULL DEFAULT true,
  send_sms BOOLEAN NOT NULL DEFAULT false,
  send_in_app BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed defaults
INSERT INTO notification_template (
    slug, category, name, description, 
    subject_en, subject_de, subject_es, subject_nl, subject_fr,
    body_en, body_de, body_es, body_nl, body_fr,
    available_variables, send_email, send_sms, send_in_app
) VALUES

-- Patient notifications
('patient_decides_ready', 'patient', 'Collectors Available', 'Sent when the first BC applies to a patient_decides case', 
 'Blood collectors available for your case', 'Blutentnehmer für Ihren Fall verfügbar', 'Extractores de sangre disponibles para su caso', 'Bloedafnemers beschikbaar voor uw zaak', 'Collecteurs de sang disponibles pour votre cas',
 'Hi {{patient_name}}, qualified blood collectors have applied for your case {{case_id}}. Review their profiles and choose your preferred collector: {{portal_link}}', 
 'Hallo {{patient_name}}, qualifizierte Blutentnehmer haben sich für Ihren Fall {{case_id}} beworben. Sehen Sie sich ihre Profile an und wählen Sie Ihren bevorzugten Entnehmer: {{portal_link}}',
 'Hola {{patient_name}}, extractores de sangre cualificados han solicitado su caso {{case_id}}. Revise sus perfiles y elija su extractor preferido: {{portal_link}}',
 'Hallo {{patient_name}}, gekwalificeerde bloedafnemers hebben zich aangemeld voor uw zaak {{case_id}}. Bekijk hun profielen en kies uw favoriete afnemer: {{portal_link}}',
 'Bonjour {{patient_name}}, des collecteurs de sang qualifiés ont postulé pour votre cas {{case_id}}. Examinez leurs profils et choisissez votre collecteur préféré : {{portal_link}}',
 '["patient_name", "case_id", "portal_link"]', true, false, true),

('shortlist_ready', 'patient', 'Shortlist Ready', 'Sent when HC approves first BC to shortlist', 
 'Your healthcare provider has selected collectors', 'Ihr Arzt hat Entnehmer ausgewählt', 'Su proveedor de atención médica ha seleccionado extractores', 'Uw zorgverlener heeft afnemers geselecteerd', 'Votre prestataire de soins a sélectionné des collecteurs',
 'Hi {{patient_name}}, your healthcare provider has shortlisted collectors for case {{case_id}}. Review and select: {{portal_link}}', 
 'Hallo {{patient_name}}, Ihr Arzt hat Entnehmer für den Fall {{case_id}} in die engere Auswahl genommen. Prüfen und auswählen: {{portal_link}}',
 'Hola {{patient_name}}, su proveedor de atención médica ha preseleccionado extractores para el caso {{case_id}}. Revise y seleccione: {{portal_link}}',
 'Hallo {{patient_name}}, uw zorgverlener heeft afnemers op de shortlist geselecteerd voor zaak {{case_id}}. Bekijk en selecteer: {{portal_link}}',
 'Bonjour {{patient_name}}, votre prestataire de soins a présélectionné des collecteurs pour le cas {{case_id}}. Examinez et sélectionnez : {{portal_link}}',
 '["patient_name", "case_id", "portal_link", "hc_name"]', true, false, true),

('clinic_approval_ready', 'patient', 'Appointment Ready', 'Sent when HC selects final BC in clinic_approval mode', 
 'Your blood collection appointment is ready', 'Ihr Termin zur Blutentnahme ist bereit', 'Su cita de extracción de sangre está lista', 'Uw bloedafname afspraak is klaar', 'Votre rendez-vous pour la prise de sang est prêt',
 'Hi {{patient_name}}, a collector has been assigned to case {{case_id}}. Confirm your appointment: {{portal_link}}', 
 'Hallo {{patient_name}}, ein Entnehmer wurde dem Fall {{case_id}} zugewiesen. Bestätigen Sie Ihren Termin: {{portal_link}}',
 'Hola {{patient_name}}, se ha asignado un extractor al caso {{case_id}}. Confirme su cita: {{portal_link}}',
 'Hallo {{patient_name}}, er is een afnemer toegewezen aan zaak {{case_id}}. Bevestig uw afspraak: {{portal_link}}',
 'Bonjour {{patient_name}}, un collecteur a été assigné au cas {{case_id}}. Confirmez votre rendez-vous : {{portal_link}}',
 '["patient_name", "case_id", "portal_link", "collector_name"]', true, false, true),

('payment_confirmed', 'patient', 'Payment Confirmed', 'Sent after successful patient payment', 
 'Payment confirmed for your blood collection', 'Zahlung für Ihre Blutentnahme bestätigt', 'Pago confirmado para su extracción de sangre', 'Betaling bevestigd voor uw bloedafname', 'Paiement confirmé pour votre prise de sang',
 'Hi {{patient_name}}, your payment for case {{case_id}} has been confirmed. Your appointment is scheduled for {{appointment_date}}.', 
 'Hallo {{patient_name}}, Ihre Zahlung für den Fall {{case_id}} wurde bestätigt. Ihr Termin ist für {{appointment_date}} geplant.',
 'Hola {{patient_name}}, se ha confirmado su pago para el caso {{case_id}}. Su cita está programada para {{appointment_date}}.',
 'Hallo {{patient_name}}, uw betaling voor zaak {{case_id}} is bevestigd. Uw afspraak staat gepland op {{appointment_date}}.',
 'Bonjour {{patient_name}}, votre paiement pour le cas {{case_id}} a été confirmé. Votre rendez-vous est prévu le {{appointment_date}}.',
 '["patient_name", "case_id", "appointment_date", "collector_name"]', true, false, true),

-- HC notifications
('bc_application_received', 'hc', 'New BC Application', 'Sent when a BC applies to an HC case', 
 'New application for case {{case_id}}', 'Neue Bewerbung für Fall {{case_id}}', 'Nueva aplicación para el caso {{case_id}}', 'Nieuwe aanmelding voor zaak {{case_id}}', 'Nouvelle candidature pour le cas {{case_id}}',
 '{{collector_name}} has applied for case {{case_id}}. Review their profile and proposed time slots.', 
 '{{collector_name}} hat sich für den Fall {{case_id}} beworben. Überprüfen Sie ihr Profil und die vorgeschlagenen Zeitfenster.',
 '{{collector_name}} ha solicitado el caso {{case_id}}. Revise su perfil y franjas horarias propuestas.',
 '{{collector_name}} heeft zich aangemeld voor zaak {{case_id}}. Bekijk het profiel en voorgestelde tijden.',
 '{{collector_name}} a postulé pour le cas {{case_id}}. Examinez son profil et les plages horaires proposées.',
 '["case_id", "collector_name", "hc_name"]', true, false, true),

('patient_notified', 'hc', 'Patient Notified', 'Sent when patient link is triggered', 
 'Patient has been notified for case {{case_id}}', 'Patient wurde für Fall {{case_id}} benachrichtigt', 'El paciente ha sido notificado para el caso {{case_id}}', 'Patiënt is geïnformeerd voor zaak {{case_id}}', 'Le patient a été notifié pour le cas {{case_id}}',
 'The patient for case {{case_id}} has been sent their selection link.', 
 'Dem Patienten für den Fall {{case_id}} wurde ein Auswahl-Link gesendet.',
 'Al paciente para el caso {{case_id}} se le ha enviado su enlace de selección.',
 'De patiënt voor zaak {{case_id}} heeft de selectielink ontvangen.',
 'Le lien de sélection a été envoyé au patient pour le cas {{case_id}}.',
 '["case_id", "patient_name"]', false, false, true),

('case_booked', 'hc', 'Case Booked', 'Sent when patient completes payment', 
 'Case {{case_id}} has been booked', 'Fall {{case_id}} wurde gebucht', 'Caso {{case_id}} ha sido reservado', 'Zaak {{case_id}} is geboekt', 'Le cas {{case_id}} a été réservé',
 'Patient has completed payment for case {{case_id}}. Appointment confirmed for {{appointment_date}}.', 
 'Der Patient hat die Zahlung für den Fall {{case_id}} abgeschlossen. Termin bestätigt für {{appointment_date}}.',
 'El paciente ha completado el pago del caso {{case_id}}. Cita confirmada para {{appointment_date}}.',
 'Patiënt heeft de betaling voltooid voor zaak {{case_id}}. Afspraak bevestigd voor {{appointment_date}}.',
 'Le patient a effectué le paiement pour le cas {{case_id}}. Rendez-vous confirmé pour le {{appointment_date}}.',
 '["case_id", "patient_name", "collector_name", "appointment_date"]', true, false, true),

-- BC notifications
('new_case_available', 'bc', 'New Case Available', 'Sent when a new case matches BC criteria', 
 'New blood collection opportunity', 'Neue Blutentnahme Gelegenheit', 'Nueva oportunidad de extracción de sangre', 'Nieuwe bloedafname kans', 'Nouvelle opportunité de collecte de sang',
 'A new case ({{case_id}}) is available in your area. View details and apply.', 
 'Ein neuer Fall ({{case_id}}) ist in Ihrer Nähe verfügbar. Details ansehen und bewerben.',
 'Un nuevo caso ({{case_id}}) está disponible en su área. Ver detalles y aplicar.',
 'Een nieuwe zaak ({{case_id}}) is beschikbaar in uw buurt. Bekijk details en solliciteer.',
 'Un nouveau cas ({{case_id}}) est disponible dans votre région. Voir les détails et postuler.',
 '["case_id", "visit_type", "urgency"]', true, false, true),

('application_accepted', 'bc', 'Application Accepted', 'Sent when HC shortlists the BC', 
 'Your application has been shortlisted', 'Ihre Bewerbung wurde in die engere Wahl gezogen', 'Su solicitud ha sido preseleccionada', 'Uw aanmelding staat op de shortlist', 'Votre candidature a été présélectionnée',
 'Your application for case {{case_id}} has been shortlisted by the healthcare company.', 
 'Ihre Bewerbung für den Fall {{case_id}} wurde von der Gesundheitseinrichtung in die engere Wahl gezogen.',
 'Su solicitud para el caso {{case_id}} ha sido preseleccionada por la empresa de salud.',
 'Uw aanmelding voor zaak {{case_id}} is door de zorgonderneming op de shortlist gezet.',
 'Votre candidature pour le cas {{case_id}} a été présélectionnée par l''établissement de santé.',
 '["case_id", "hc_name"]', true, false, true),

('application_rejected', 'bc', 'Application Rejected', 'Sent when HC rejects the BC', 
 'Application update for case {{case_id}}', 'Bewerbungsupdate für Fall {{case_id}}', 'Actualización de solicitud para caso {{case_id}}', 'Aanmelding update voor zaak {{case_id}}', 'Mise à jour de la candidature pour le cas {{case_id}}',
 'Your application for case {{case_id}} was not selected this time.', 
 'Ihre Bewerbung für den Fall {{case_id}} wurde dieses Mal nicht berücksichtigt.',
 'Su solicitud para el caso {{case_id}} no fue seleccionada esta vez.',
 'Uw aanmelding voor zaak {{case_id}} is dit keer niet geselecteerd.',
 'Votre candidature pour le cas {{case_id}} n''a pas été retenue cette fois-ci.',
 '["case_id", "hc_name"]', true, false, true),

('payout_locked', 'bc', 'Payout Locked In', 'Sent when patient pays and BC payout is confirmed', 
 'Payout confirmed for case {{case_id}}', 'Auszahlung bestätigt für Fall {{case_id}}', 'Pago confirmado para el caso {{case_id}}', 'Uitbetaling bevestigd voor zaak {{case_id}}', 'Paiement confirmé pour le cas {{case_id}}',
 'A patient has paid for case {{case_id}}. Your payout of {{payout_amount}} has been locked in.', 
 'Ein Patient hat für den Fall {{case_id}} bezahlt. Ihre Auszahlung in Höhe von {{payout_amount}} ist gesichert.',
 'Un paciente ha pagado por el caso {{case_id}}. Su pago de {{payout_amount}} ha sido asegurado.',
 'Een patiënt heeft betaald voor zaak {{case_id}}. Uw uitbetaling van {{payout_amount}} is vastgelegd.',
 'Un patient a payé pour le cas {{case_id}}. Votre paiement de {{payout_amount}} a été mis en sécurité.',
 '["case_id", "payout_amount", "patient_name"]', true, false, true),

-- Admin notifications
('new_hc_registration', 'admin', 'New HC Registration', 'Sent when a new HC registers', 
 'New healthcare company registered', 'Neues Gesundheitsunternehmen registriert', 'Nueva empresa de salud registrada', 'Nieuw zorgbedrijf geregistreerd', 'Nouvelle entreprise de santé enregistrée',
 '{{company_name}} has registered and is pending verification.', 
 '{{company_name}} hat sich registriert und wartet auf Überprüfung.',
 '{{company_name}} se ha registrado y está pendiente de verificación.',
 '{{company_name}} is geregistreerd en wacht op verificatie.',
 '{{company_name}} s''est inscrit et est en attente de vérification.',
 '["company_name", "contact_email"]', false, false, true),

('new_bc_registration', 'admin', 'New BC Registration', 'Sent when a new BC registers', 
 'New blood collector registered', 'Neuer Blutentnehmer registriert', 'Nuevo extractor de sangre registrado', 'Nieuwe bloedafnemer geregistreerd', 'Nouveau collecteur de sang enregistré',
 '{{collector_name}} has registered and is pending verification.', 
 '{{collector_name}} hat sich registriert und wartet auf Überprüfung.',
 '{{collector_name}} se ha registrado y está pendiente de verificación.',
 '{{collector_name}} is geregistreerd en wacht op verificatie.',
 '{{collector_name}} s''est inscrit et est en attente de vérification.',
 '["collector_name", "contact_email"]', false, false, true)

ON CONFLICT (slug) DO UPDATE SET 
    subject_en = EXCLUDED.subject_en,
    body_en = EXCLUDED.body_en,
    available_variables = EXCLUDED.available_variables;
