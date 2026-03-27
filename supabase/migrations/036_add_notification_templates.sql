INSERT INTO notification_template (
  slug, category, name, description,
  subject_en, subject_de, subject_es, subject_nl, subject_fr,
  body_en, body_de, body_es, body_nl, body_fr,
  available_variables, send_email, send_sms, send_in_app
) VALUES

-- Case creation alerts
('case_created', 'admin', 'New Case Created', 'Sent when an HC creates a new case',
 'New case created: {{case_id}}', 'Neuer Fall erstellt: {{case_id}}', 'Nuevo caso creado: {{case_id}}', 'Nieuwe zaak aangemaakt: {{case_id}}', 'Nouveau cas créé : {{case_id}}',
 '{{hc_name}} has created case {{case_id}} ({{visit_type}}, {{urgency}}).', '{{hc_name}} hat Fall {{case_id}} erstellt ({{visit_type}}, {{urgency}}).', '{{hc_name}} ha creado el caso {{case_id}} ({{visit_type}}, {{urgency}}).', '{{hc_name}} heeft zaak {{case_id}} aangemaakt ({{visit_type}}, {{urgency}}).', '{{hc_name}} a créé le cas {{case_id}} ({{visit_type}}, {{urgency}}).',
 '["case_id", "hc_name", "visit_type", "urgency"]', false, false, true),

('urgent_case_created', 'admin', 'Urgent/Emergency Case', 'Sent when a case with urgent or emergency urgency is created',
 'Urgent case requires attention: {{case_id}}', 'Dringender Fall erfordert Aufmerksamkeit: {{case_id}}', 'Caso urgente requiere atención: {{case_id}}', 'Dringende zaak vereist aandacht: {{case_id}}', 'Cas urgent nécessite attention : {{case_id}}',
 'An {{urgency}} case ({{case_id}}) has been created by {{hc_name}}. Immediate attention may be required.', 'Ein {{urgency}} Fall ({{case_id}}) wurde von {{hc_name}} erstellt. Sofortige Aufmerksamkeit kann erforderlich sein.', 'Un caso {{urgency}} ({{case_id}}) ha sido creado por {{hc_name}}. Puede requerir atención inmediata.', 'Een {{urgency}} zaak ({{case_id}}) is aangemaakt door {{hc_name}}. Onmiddellijke aandacht kan vereist zijn.', 'Un cas {{urgency}} ({{case_id}}) a été créé par {{hc_name}}. Une attention immédiate peut être requise.',
 '["case_id", "hc_name", "urgency", "visit_type"]', true, false, true),

('material_shipping_needed', 'admin', 'Material Shipping Required', 'Sent when a case includes materials to be supplied via Hematch',
 'Material shipping needed for case {{case_id}}', 'Materialversand erforderlich für Fall {{case_id}}', 'Envío de material necesario para caso {{case_id}}', 'Materiaalverzending nodig voor zaak {{case_id}}', 'Expédition de matériel nécessaire pour le cas {{case_id}}',
 'Case {{case_id}} requires material shipping. Items: {{material_list}}. Please prepare and dispatch within 24 hours.', 'Fall {{case_id}} erfordert Materialversand. Artikel: {{material_list}}. Bitte innerhalb von 24 Stunden vorbereiten und versenden.', 'El caso {{case_id}} requiere envío de material. Artículos: {{material_list}}. Prepare y envíe dentro de 24 horas.', 'Zaak {{case_id}} vereist materiaalverzending. Artikelen: {{material_list}}. Bereid voor en verzend binnen 24 uur.', 'Le cas {{case_id}} nécessite une expédition de matériel. Articles : {{material_list}}. Veuillez préparer et expédier sous 24 heures.',
 '["case_id", "hc_name", "material_list"]', true, false, true),

('material_shipped', 'hc', 'Materials Shipped', 'Sent when admin marks materials as dispatched',
 'Materials shipped for case {{case_id}}', 'Materialien versandt für Fall {{case_id}}', 'Materiales enviados para caso {{case_id}}', 'Materialen verzonden voor zaak {{case_id}}', 'Matériel expédié pour le cas {{case_id}}',
 'The materials for case {{case_id}} have been shipped and should arrive within 1-2 business days.', 'Die Materialien für Fall {{case_id}} wurden versandt und sollten innerhalb von 1-2 Werktagen ankommen.', 'Los materiales para el caso {{case_id}} han sido enviados y deberían llegar en 1-2 días hábiles.', 'De materialen voor zaak {{case_id}} zijn verzonden en zouden binnen 1-2 werkdagen moeten aankomen.', 'Le matériel pour le cas {{case_id}} a été expédié et devrait arriver sous 1 à 2 jours ouvrables.',
 '["case_id", "hc_name"]', true, false, true),

('bc_application_withdrawn', 'hc', 'BC Withdrew Application', 'Sent when a BC withdraws their application',
 'Application withdrawn for case {{case_id}}', 'Bewerbung zurückgezogen für Fall {{case_id}}', 'Solicitud retirada para caso {{case_id}}', 'Aanmelding ingetrokken voor zaak {{case_id}}', 'Candidature retirée pour le cas {{case_id}}',
 '{{collector_name}} has withdrawn their application for case {{case_id}}.', '{{collector_name}} hat die Bewerbung für Fall {{case_id}} zurückgezogen.', '{{collector_name}} ha retirado su solicitud para el caso {{case_id}}.', '{{collector_name}} heeft de aanmelding voor zaak {{case_id}} ingetrokken.', '{{collector_name}} a retiré sa candidature pour le cas {{case_id}}.',
 '["case_id", "collector_name", "hc_name"]', false, false, true),

('case_cancelled', 'system', 'Case Cancelled', 'Sent when a case is cancelled by HC or admin',
 'Case {{case_id}} has been cancelled', 'Fall {{case_id}} wurde storniert', 'Caso {{case_id}} ha sido cancelado', 'Zaak {{case_id}} is geannuleerd', 'Le cas {{case_id}} a été annulé',
 'Case {{case_id}} has been cancelled. Reason: {{cancel_reason}}.', 'Fall {{case_id}} wurde storniert. Grund: {{cancel_reason}}.', 'El caso {{case_id}} ha sido cancelado. Razón: {{cancel_reason}}.', 'Zaak {{case_id}} is geannuleerd. Reden: {{cancel_reason}}.', 'Le cas {{case_id}} a été annulé. Raison : {{cancel_reason}}.',
 '["case_id", "cancel_reason", "hc_name"]', true, false, true),

('case_completed', 'hc', 'Case Completed', 'Sent when blood collection is confirmed as done',
 'Case {{case_id}} completed successfully', 'Fall {{case_id}} erfolgreich abgeschlossen', 'Caso {{case_id}} completado con éxito', 'Zaak {{case_id}} succesvol afgerond', 'Cas {{case_id}} terminé avec succès',
 'Blood collection for case {{case_id}} has been completed by {{collector_name}}.', 'Die Blutentnahme für Fall {{case_id}} wurde von {{collector_name}} durchgeführt.', 'La extracción de sangre del caso {{case_id}} ha sido realizada por {{collector_name}}.', 'De bloedafname voor zaak {{case_id}} is uitgevoerd door {{collector_name}}.', 'La collecte de sang pour le cas {{case_id}} a été effectuée par {{collector_name}}.',
 '["case_id", "collector_name", "patient_name"]', true, false, true),

('review_request', 'patient', 'Leave a Review', 'Sent 24h after case completion asking patient to review',
 'How was your blood collection experience?', 'Wie war Ihre Blutentnahme-Erfahrung?', '¿Cómo fue su experiencia de extracción de sangre?', 'Hoe was uw bloedafname-ervaring?', 'Comment s''est passée votre prise de sang ?',
 'Hi {{patient_name}}, your blood collection for case {{case_id}} was completed yesterday. We''d love your feedback on {{collector_name}}. Leave a review: {{portal_link}}', 'Hallo {{patient_name}}, Ihre Blutentnahme für Fall {{case_id}} wurde gestern abgeschlossen. Wir freuen uns über Ihr Feedback zu {{collector_name}}. Bewertung abgeben: {{portal_link}}', 'Hola {{patient_name}}, la extracción de sangre del caso {{case_id}} se completó ayer. Nos encantaría su opinión sobre {{collector_name}}. Deje una reseña: {{portal_link}}', 'Hallo {{patient_name}}, uw bloedafname voor zaak {{case_id}} is gisteren afgerond. We horen graag uw feedback over {{collector_name}}. Laat een beoordeling achter: {{portal_link}}', 'Bonjour {{patient_name}}, votre prise de sang pour le cas {{case_id}} a été effectuée hier. Nous aimerions votre avis sur {{collector_name}}. Laissez un avis : {{portal_link}}',
 '["patient_name", "case_id", "collector_name", "portal_link"]', true, false, false),

('payout_processed', 'bc', 'Payout Processed', 'Sent when BC payout batch is completed',
 'Your payout has been processed', 'Ihre Auszahlung wurde bearbeitet', 'Su pago ha sido procesado', 'Uw uitbetaling is verwerkt', 'Votre paiement a été traité',
 'Your payout of {{payout_amount}} for {{case_count}} completed cases has been processed.', 'Ihre Auszahlung von {{payout_amount}} für {{case_count}} abgeschlossene Fälle wurde bearbeitet.', 'Su pago de {{payout_amount}} por {{case_count}} casos completados ha sido procesado.', 'Uw uitbetaling van {{payout_amount}} voor {{case_count}} afgeronde zaken is verwerkt.', 'Votre paiement de {{payout_amount}} pour {{case_count}} cas terminés a été traité.',
 '["payout_amount", "case_count"]', true, false, true),

-- Time-based alert templates (triggered by cron)
('no_applications_48h', 'hc', 'No Applications Yet', 'Sent when a case has 0 applications after 48 hours',
 'No applications yet for case {{case_id}}', 'Noch keine Bewerbungen für Fall {{case_id}}', 'Aún no hay solicitudes para el caso {{case_id}}', 'Nog geen aanmeldingen voor zaak {{case_id}}', 'Pas encore de candidatures pour le cas {{case_id}}',
 'Your case {{case_id}} has been open for 48 hours with no applications from blood collectors. Consider adjusting the urgency or visit type.', 'Ihr Fall {{case_id}} ist seit 48 Stunden offen ohne Bewerbungen. Erwägen Sie die Dringlichkeit oder den Besuchstyp anzupassen.', 'Su caso {{case_id}} lleva 48 horas abierto sin solicitudes. Considere ajustar la urgencia o tipo de visita.', 'Uw zaak {{case_id}} staat al 48 uur open zonder aanmeldingen. Overweeg de urgentie of bezoektype aan te passen.', 'Votre cas {{case_id}} est ouvert depuis 48 heures sans candidature. Envisagez d''ajuster l''urgence ou le type de visite.',
 '["case_id", "hc_name"]', true, false, true),

('no_applications_72h', 'admin', 'Case Escalation: No Applications', 'Escalation when case has 0 applications after 72 hours',
 'Escalation: Case {{case_id}} has no applications after 72h', 'Eskalation: Fall {{case_id}} hat keine Bewerbungen nach 72h', 'Escalación: Caso {{case_id}} sin solicitudes después de 72h', 'Escalatie: Zaak {{case_id}} heeft geen aanmeldingen na 72u', 'Escalade : Cas {{case_id}} sans candidature après 72h',
 'Case {{case_id}} from {{hc_name}} has been open for 72+ hours with no applications. Manual intervention may be needed.', 'Fall {{case_id}} von {{hc_name}} ist seit 72+ Stunden offen ohne Bewerbungen. Manuelle Intervention kann erforderlich sein.', 'El caso {{case_id}} de {{hc_name}} lleva 72+ horas abierto sin solicitudes. Puede requerir intervención manual.', 'Zaak {{case_id}} van {{hc_name}} staat al 72+ uur open zonder aanmeldingen. Handmatige interventie kan nodig zijn.', 'Le cas {{case_id}} de {{hc_name}} est ouvert depuis 72+ heures sans candidature. Une intervention manuelle peut être nécessaire.',
 '["case_id", "hc_name"]', true, false, true),

('appointment_reminder_24h', 'system', 'Appointment Reminder', 'Sent 24h before a scheduled appointment',
 'Appointment reminder for tomorrow', 'Terminerinnerung für morgen', 'Recordatorio de cita para mañana', 'Afspraakherinnering voor morgen', 'Rappel de rendez-vous pour demain',
 'Reminder: You have a blood collection appointment tomorrow ({{appointment_date}}) for case {{case_id}}. {{collector_name}} will be performing the collection.', 'Erinnerung: Sie haben morgen ({{appointment_date}}) einen Blutentnahme-Termin für Fall {{case_id}}. {{collector_name}} wird die Entnahme durchführen.', 'Recordatorio: Tiene una cita de extracción de sangre mañana ({{appointment_date}}) para el caso {{case_id}}. {{collector_name}} realizará la extracción.', 'Herinnering: U heeft morgen ({{appointment_date}}) een bloedafname-afspraak voor zaak {{case_id}}. {{collector_name}} voert de afname uit.', 'Rappel : Vous avez un rendez-vous de prise de sang demain ({{appointment_date}}) pour le cas {{case_id}}. {{collector_name}} effectuera la collecte.',
 '["case_id", "appointment_date", "collector_name", "patient_name"]', true, true, true),

('bc_no_completion_48h', 'admin', 'Collection Not Confirmed', 'Sent when BC hasn''t confirmed completion 48h after appointment',
 'Collection not confirmed: case {{case_id}}', 'Entnahme nicht bestätigt: Fall {{case_id}}', 'Extracción no confirmada: caso {{case_id}}', 'Afname niet bevestigd: zaak {{case_id}}', 'Collecte non confirmée : cas {{case_id}}',
 'The appointment for case {{case_id}} was scheduled {{appointment_date}} but {{collector_name}} has not confirmed completion. Please follow up.', 'Der Termin für Fall {{case_id}} war für {{appointment_date}} geplant, aber {{collector_name}} hat die Fertigstellung nicht bestätigt. Bitte nachfassen.', 'La cita para el caso {{case_id}} estaba programada para {{appointment_date}} pero {{collector_name}} no ha confirmado la finalización. Por favor haga seguimiento.', 'De afspraak voor zaak {{case_id}} was gepland op {{appointment_date}} maar {{collector_name}} heeft de voltooiing niet bevestigd. Gelieve op te volgen.', 'Le rendez-vous pour le cas {{case_id}} était prévu le {{appointment_date}} mais {{collector_name}} n''a pas confirmé la réalisation. Veuillez faire un suivi.',
 '["case_id", "appointment_date", "collector_name"]', true, false, true),

('payment_pending_7d', 'admin', 'Payment Overdue', 'Sent when payment hasn''t been received 7 days after booking',
 'Payment overdue for case {{case_id}}', 'Zahlung überfällig für Fall {{case_id}}', 'Pago vencido para caso {{case_id}}', 'Betaling achterstallig voor zaak {{case_id}}', 'Paiement en retard pour le cas {{case_id}}',
 'Case {{case_id}} has been in pending_payment status for 7+ days. Patient has not completed payment.', 'Fall {{case_id}} ist seit 7+ Tagen im Status ausstehende Zahlung. Der Patient hat die Zahlung nicht abgeschlossen.', 'El caso {{case_id}} ha estado en estado de pago pendiente durante 7+ días. El paciente no ha completado el pago.', 'Zaak {{case_id}} staat al 7+ dagen in afwachtende betaling. De patiënt heeft de betaling niet voltooid.', 'Le cas {{case_id}} est en attente de paiement depuis 7+ jours. Le patient n''a pas effectué le paiement.',
 '["case_id", "patient_name", "hc_name"]', true, false, true),

('material_not_dispatched_24h', 'admin', 'Material Not Dispatched', 'Sent when materials haven''t been shipped 24h after case creation',
 'Materials not dispatched for case {{case_id}}', 'Materialien nicht versandt für Fall {{case_id}}', 'Materiales no despachados para caso {{case_id}}', 'Materialen niet verzonden voor zaak {{case_id}}', 'Matériel non expédié pour le cas {{case_id}}',
 'Case {{case_id}} requires material shipping but nothing has been dispatched 24+ hours after creation. Please prepare and ship immediately.', 'Fall {{case_id}} erfordert Materialversand, aber nichts wurde 24+ Stunden nach Erstellung versandt. Bitte sofort vorbereiten und versenden.', 'El caso {{case_id}} requiere envío de material pero no se ha despachado 24+ horas después de la creación. Prepare y envíe inmediatamente.', 'Zaak {{case_id}} vereist materiaalverzending maar er is niets verzonden 24+ uur na aanmaak. Bereid voor en verzend onmiddellijk.', 'Le cas {{case_id}} nécessite une expédition de matériel mais rien n''a été expédié 24+ heures après la création. Veuillez préparer et expédier immédiatement.',
 '["case_id", "material_list"]', true, false, true)

ON CONFLICT (slug) DO NOTHING;
