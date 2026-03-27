export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app';

export interface NotificationPayload {
  recipient_email?: string;
  recipient_phone?: string;  // E.164 format: +49123456789
  subject?: string;          // Email only
  body: string;              // Plain text body
  html_body?: string;        // Email HTML body (optional)
  template_slug?: string;    // For tracking which template was used
}

export interface ChannelResult {
  channel: NotificationChannel;
  success: boolean;
  provider_message_id?: string;
  error?: string;
}

// ── Email via Postmark ──
async function sendEmail(payload: NotificationPayload): Promise<ChannelResult> {
  const apiKey = process.env.POSTMARK_API_KEY;
  
  if (!apiKey) {
    console.log('[Email] MOCK — No POSTMARK_API_KEY configured');
    console.log(`  To: ${payload.recipient_email}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Body: ${payload.body?.substring(0, 100)}...`);
    return { channel: 'email', success: true, provider_message_id: 'mock_' + Date.now() };
  }
  
  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': apiKey,
      },
      body: JSON.stringify({
        From: process.env.POSTMARK_FROM_EMAIL || 'noreply@99tests.com',
        To: payload.recipient_email,
        Subject: payload.subject,
        TextBody: payload.body,
        HtmlBody: payload.html_body || undefined,
        MessageStream: 'outbound',
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      return { channel: 'email', success: true, provider_message_id: data.MessageID };
    } else {
      console.error('[Email] Postmark error:', data);
      return { channel: 'email', success: false, error: data.Message };
    }
  } catch (err: any) {
    console.error('[Email] Failed:', err);
    return { channel: 'email', success: false, error: err.message };
  }
}

// ── SMS via Twilio ──
async function sendSMS(payload: NotificationPayload): Promise<ChannelResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !fromNumber) {
    console.log('[SMS] MOCK — No Twilio credentials configured');
    console.log(`  To: ${payload.recipient_phone}`);
    console.log(`  Body: ${payload.body?.substring(0, 100)}...`);
    return { channel: 'sms', success: true, provider_message_id: 'mock_' + Date.now() };
  }
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: payload.recipient_phone!,
        From: fromNumber,
        Body: payload.body,
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      return { channel: 'sms', success: true, provider_message_id: data.sid };
    } else {
      console.error('[SMS] Twilio error:', data);
      return { channel: 'sms', success: false, error: data.message };
    }
  } catch (err: any) {
    console.error('[SMS] Failed:', err);
    return { channel: 'sms', success: false, error: err.message };
  }
}

// ── WhatsApp via Twilio ──
async function sendWhatsApp(payload: NotificationPayload): Promise<ChannelResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox default
  
  if (!accountSid || !authToken) {
    console.log('[WhatsApp] MOCK — No Twilio credentials configured');
    console.log(`  To: whatsapp:${payload.recipient_phone}`);
    console.log(`  Body: ${payload.body?.substring(0, 100)}...`);
    return { channel: 'whatsapp', success: true, provider_message_id: 'mock_' + Date.now() };
  }
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${payload.recipient_phone}`,
        From: fromWhatsApp,
        Body: payload.body,
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      return { channel: 'whatsapp', success: true, provider_message_id: data.sid };
    } else {
      console.error('[WhatsApp] Twilio error:', data);
      return { channel: 'whatsapp', success: false, error: data.message };
    }
  } catch (err: any) {
    console.error('[WhatsApp] Failed:', err);
    return { channel: 'whatsapp', success: false, error: err.message };
  }
}

// ── Unified dispatcher ──
export async function dispatchNotification(
  channels: NotificationChannel[],
  payload: NotificationPayload
): Promise<ChannelResult[]> {
  const results: ChannelResult[] = [];
  
  for (const channel of channels) {
    switch (channel) {
      case 'email':
        if (payload.recipient_email) {
          results.push(await sendEmail(payload));
        }
        break;
      case 'sms':
        if (payload.recipient_phone) {
          results.push(await sendSMS(payload));
        }
        break;
      case 'whatsapp':
        if (payload.recipient_phone) {
          results.push(await sendWhatsApp(payload));
        }
        break;
      case 'in_app':
        // In-app is handled separately
        results.push({ channel: 'in_app', success: true });
        break;
    }
  }
  
  return results;
}
