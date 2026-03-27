import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Core engine for securely delivering Webhook payloads to external Healthcare IT systems.
 * Includes HMAC-SHA256 signing and recursive exponential backoff.
 */
export async function deliverWebhook(
  hcId: string, 
  eventType: string, 
  payload: any, 
  attempt = 1
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const maxAttempts = 3;
  const backoffDelays = [1000, 5000, 30000]; // 1s, 5s, 30s

  try {
    // 1. Fetch Doctor Webhook Configuration
    const { data: hc, error: hcError } = await supabase
      .from('doctor_practice')
      .select('webhook_url, webhook_secret')
      .eq('id', hcId)
      .single();

    if (hcError || !hc || !hc.webhook_url) {
      // If no URL is configured, exit silently (not an error, just opting out of webhooks)
      return false; 
    }

    const payloadString = JSON.stringify(payload);
    
    // 2. Compute HMAC-SHA256 Signature
    // If they have a secret, sign the stringified payload
    let signature = '';
    if (hc.webhook_secret) {
        const hmac = crypto.createHmac('sha256', hc.webhook_secret);
        hmac.update(payloadString);
        signature = hmac.digest('hex');
    }

    // 3. Execute HTTP POST
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (signature) {
       headers['X-99Tests-Signature'] = signature;
    }

    const response = await fetch(hc.webhook_url, {
      method: 'POST',
      headers,
      body: payloadString,
      // Implement a timeout to prevent hanging the NextJS thread forever
      signal: AbortSignal.timeout(10000) 
    });

    const isSuccess = response.ok;
    const responseCode = response.status;

    // 4. Log the Delivery Attempt
    await supabase.from('webhook_log').insert({
       doctor_id: hcId,
       event_type: eventType,
       payload_summary: JSON.stringify({ event: eventType, recommendationId: payload.recommendationId || payload.id || 'N/A' }),
       response_code: responseCode,
       attempts: attempt,
       delivered_at: isSuccess ? new Date().toISOString() : null,
       failed_at: !isSuccess && attempt === maxAttempts ? new Date().toISOString() : null
    });

    // 5. Exponential Backoff Retry Protocol
    if (!isSuccess && attempt < maxAttempts) {
       const delayMs = backoffDelays[attempt - 1];
       console.warn(`WEBHOOK FAILED (${responseCode}): Retrying ${hc.webhook_url} in ${delayMs}ms (Attempt ${attempt + 1}/${maxAttempts})`);
       
       // Note: In a true prod system, we'd use a message queue (e.g., Inngest). 
       // For this MVP, we use Server-Side setTimeout inside an orphaned Promise.
       setTimeout(() => {
          deliverWebhook(hcId, eventType, payload, attempt + 1).catch(e => console.error("Async Retry Failed:", e));
       }, delayMs);
       
       return false;
    }

    return isSuccess;

  } catch (error: any) {
    console.error(`WEBHOOK EXCEPTION [${eventType}]:`, error);
    
    // Log complete failure node side
    await supabase.from('webhook_log').insert({
       doctor_id: hcId,
       event_type: eventType,
       payload_summary: JSON.stringify({ error: error.message }),
       response_code: 0,
       attempts: attempt,
       failed_at: attempt === maxAttempts ? new Date().toISOString() : null
    });

    // Retry execution context
    if (attempt < maxAttempts) {
       const delayMs = backoffDelays[attempt - 1];
       setTimeout(() => {
          deliverWebhook(hcId, eventType, payload, attempt + 1).catch(e => console.error("Async Retry Failed:", e));
       }, delayMs);
    }
    return false;
  }
}
