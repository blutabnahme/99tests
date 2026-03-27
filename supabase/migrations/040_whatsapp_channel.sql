-- Enable WhatsApp for appointment reminders and urgent notifications
ALTER TABLE notification_template 
ADD COLUMN IF NOT EXISTS send_whatsapp BOOLEAN NOT NULL DEFAULT false;

UPDATE notification_template SET send_whatsapp = true WHERE slug IN (
  'appointment_reminder_24h',
  'urgent_case_created',
  'payment_confirmed',
  'clinic_approval_ready'
);
