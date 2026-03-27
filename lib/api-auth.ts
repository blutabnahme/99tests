import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { encryptData } from '@/lib/encryption';

// Simple in-memory rate limiter
// For multi-instance production, this should be moved to Redis or Supabase cache.
const RATE_LIMIT_CACHE = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Middleware wrapper for external REST API endpoints.
 * Validates the `blt_sk_...` API key, checks rate limits, and logs the request.
 */
export function withApiAuth(
  handler: (req: NextRequest, hc: any, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Bearer token' }, { status: 401 });
    }

    const rawKey = authHeader.split(' ')[1];
    
    // Quick format check
    if (!rawKey.startsWith('blt_sk_')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid key format' }, { status: 401 });
    }

    const hashedKey = hashApiKey(rawKey);

    // Find the Doctor with this hashed key
    const { data: hc, error } = await supabase
      .from('doctor_practice')
      .select('id, name, api_enabled, api_rate_limit, api_key_hash')
      .eq('api_key_hash', hashedKey)
      .single();

    if (error || !hc || hc.api_key_hash !== hashedKey) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    if (!hc.api_enabled) {
      return NextResponse.json({ error: 'Forbidden: API access is disabled for this account' }, { status: 403 });
    }

    // Rate Limiting
    const now = Date.now();
    const hcId = hc.id;
    let rateData = RATE_LIMIT_CACHE.get(hcId);

    if (!rateData || now - rateData.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateData = { count: 0, windowStart: now };
    }

    rateData.count++;
    RATE_LIMIT_CACHE.set(hcId, rateData);

    const limit = hc.api_rate_limit || 100;
    if (rateData.count > limit) {
      return NextResponse.json({ error: 'Too Many Requests: Rate limit exceeded' }, { status: 429 });
    }

    // Prepare audit logging parameters
    let requestBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        const bodyText = await req.clone().text();
        if (bodyText) {
          requestBody = encryptData(bodyText); // Encrypt payload before saving
        }
      } catch (e) {
        // Safe to ignore if no body
      }
    }

    let response: NextResponse;
    let responseCode = 500;

    try {
      response = await handler(req, hc, context);
      responseCode = response.status;
    } catch (err: any) {
      console.error("API Route Error:", err);
      response = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // Async Audit Logging (fire-and-forget to avoid blocking response)
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const endpoint = new URL(req.url).pathname;

    supabase.from('api_log').insert({
      doctor_id: hcId,
      endpoint,
      method: req.method,
      request_body: requestBody,
      response_code: responseCode,
      ip_address: ipAddress
    }).then(({ error: logErr }) => {
      if (logErr) console.error("Failed to log API request:", logErr);
    });

    return response;
  };
}
