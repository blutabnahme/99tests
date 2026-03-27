import crypto from 'crypto';

// Use a 32-byte key for AES-256. In production, this must be set in .env
// For local dev, we provide a fallback if the env var is missing.
const RAW_KEY = process.env.BANK_ENCRYPTION_KEY || 'default-secret-key-must-be-32bytes';

// Ensure the key is exactly 32 bytes
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(RAW_KEY)).digest();
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypts a string into a base64 format containing the salt, iv, tag, and ciphertext.
 */
export function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // We can derive a key using the salt if we wanted PBKDF2, but for pure fast AES with a secret:
  // we will just use the hash key directly. Salt is included just as an extra randomness layer
  // if we ever decide to upgrade to PBKDF2 later. For now we use the direct key.
  
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();

  // Format: iv:salt:tag:ciphertext
  return Buffer.from(
    `${iv.toString('hex')}:${salt.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  ).toString('base64');
}

/**
 * Decrypts the previously encrypted base64 string back to plaintext.
 */
export function decryptData(encryptedBase64: string): string | null {
  try {
    const decodedStr = Buffer.from(encryptedBase64, 'base64').toString('utf8');
    const parts = decodedStr.split(':');
    
    if (parts.length !== 4) return null;
    
    const [ivHex, saltHex, tagHex, ciphertextHex] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

/**
 * Parses and decrypts the bank details JSON payload.
 */
export function getDecryptedBankDetails(encryptedStr: string | null): { account_holder: string, iban: string } | null {
  if (!encryptedStr) return null;
  const raw = decryptData(encryptedStr);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Helper to mask an IBAN, exposing only the last 4 characters.
 */
export function maskIban(iban: string): string {
  if (!iban) return '';
  const clean = iban.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  return `**** **** **** ${clean.slice(-4)}`;
}
