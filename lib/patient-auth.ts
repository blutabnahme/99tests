import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a secure random token
function generateToken(length: number = 48): string {
  return crypto.randomBytes(length).toString('base64url').substring(0, length);
}

// Generate a 6-digit verification code
function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Create a magic link token for a patient
 * Returns the token string to be included in the URL
 */
export async function createMagicLinkToken(
  patientId: string,
  channel: 'email' | 'sms' | 'whatsapp' = 'email'
): Promise<{ token: string; expiresAt: Date } | null> {
  const db = supabaseAdmin();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  const { error } = await db
    .from('tt_patient_session_token')
    .insert({
      patient_id: patientId,
      token,
      channel,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('[PatientAuth] Failed to create token:', error);
    return null;
  }

  return { token, expiresAt };
}

/**
 * Verify a magic link token and create a session
 * Returns session token (for cookie) or null if invalid
 */
export async function verifyMagicLinkToken(
  token: string,
  ip?: string,
  userAgent?: string
): Promise<{ sessionToken: string; patientId: string; expiresAt: Date } | null> {
  const db = supabaseAdmin();

  // Find the token
  const { data: tokenRecord, error } = await db
    .from('tt_patient_session_token')
    .select('id, patient_id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (error || !tokenRecord) {
    console.log('[PatientAuth] Token not found');
    return null;
  }

  // Check if already used
  if (tokenRecord.used_at) {
    console.log('[PatientAuth] Token already used');
    return null;
  }

  // Check if expired
  if (new Date(tokenRecord.expires_at) < new Date()) {
    console.log('[PatientAuth] Token expired');
    return null;
  }

  // Mark token as used
  await db
    .from('tt_patient_session_token')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRecord.id);

  // Create session
  const sessionToken = generateToken(64);
  const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const { error: sessionError } = await db
    .from('tt_patient_session')
    .insert({
      patient_id: tokenRecord.patient_id,
      session_token: sessionToken,
      ip_address: ip || null,
      user_agent: userAgent || null,
      expires_at: sessionExpiry.toISOString(),
    });

  if (sessionError) {
    console.error('[PatientAuth] Failed to create session:', sessionError);
    return null;
  }

  return {
    sessionToken,
    patientId: tokenRecord.patient_id,
    expiresAt: sessionExpiry,
  };
}

/**
 * Validate an existing session from cookie
 * Returns patient ID or null
 */
export async function validateSession(sessionToken: string): Promise<string | null> {
  if (!sessionToken) return null;

  const db = supabaseAdmin();

  const { data, error } = await db
    .from('tt_patient_session')
    .select('patient_id, expires_at')
    .eq('session_token', sessionToken)
    .single();

  if (error || !data) return null;

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    // Clean up expired session
    await db.from('tt_patient_session').delete().eq('session_token', sessionToken);
    return null;
  }

  return data.patient_id;
}

/**
 * Create a session directly (used after payment to auto-login)
 */
export async function createDirectSession(
  patientId: string,
  ip?: string,
  userAgent?: string
): Promise<{ sessionToken: string; expiresAt: Date } | null> {
  const db = supabaseAdmin();
  const sessionToken = generateToken(64);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const { error } = await db
    .from('tt_patient_session')
    .insert({
      patient_id: patientId,
      session_token: sessionToken,
      ip_address: ip || null,
      user_agent: userAgent || null,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('[PatientAuth] Failed to create direct session:', error);
    return null;
  }

  return { sessionToken, expiresAt };
}

/**
 * Destroy a session (logout)
 */
export async function destroySession(sessionToken: string): Promise<void> {
  const db = supabaseAdmin();
  await db.from('tt_patient_session').delete().eq('session_token', sessionToken);
}

/**
 * Find patient by email or phone
 */
export async function findPatientByContact(
  contact: string
): Promise<{ id: string; email: string; phone?: string; first_name: string } | null> {
  const db = supabaseAdmin();

  const isEmail = contact.includes('@');

  let query = db.from('tt_patient').select('id, email, phone, first_name');

  if (isEmail) {
    query = query.ilike('email', contact.trim());
  } else {
    // Normalize phone: remove spaces, dashes
    const normalized = contact.replace(/[\s\-\(\)]/g, '');
    query = query.eq('phone', normalized);
  }

  const { data, error } = await query.single();

  if (error || !data) return null;
  return data;
}
