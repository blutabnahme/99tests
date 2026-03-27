CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  template_slug VARCHAR(100),
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'whatsapp', 'in_app'
  recipient VARCHAR(200), -- email address or phone number
  status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'bounced'
  provider_message_id VARCHAR(200), -- Postmark MessageID or Twilio SID
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_template ON notification_log(template_slug);
CREATE INDEX IF NOT EXISTS idx_notification_log_channel ON notification_log(channel);
