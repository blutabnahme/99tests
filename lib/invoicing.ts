import { createServerSupabaseClient } from './supabase-server';

/**
 * Automates the creation of a sequential invoice number for a given Healthcare Company.
 * Format: INV-YYYY-NNN (e.g., INV-2026-001)
 * 
 * In a high-concurrency production environment, this should ideally be handled via a Postgres 
 * sequence or a transaction with row locking, but for this scale, querying the highest number
 * for the current year suffices.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const supabase = createServerSupabaseClient();
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Query the database for the newest invoice matching this year's prefix
  const { data, error } = await supabase
    .from('doctor_invoice')
    .select('invoice_number')
    .ilike('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means zero rows found, which is fine (first invoice)
    throw new Error(`Failed to query latest invoice number: ${error.message}`);
  }

  let nextSequenceNumber = 1;

  if (data?.invoice_number) {
    // Extract the NNN part. e.g. from "INV-2026-004" -> "004"
    const parts = data.invoice_number.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequenceNumber = currentSeq + 1;
      }
    }
  }

  // Pad to 3 digits minimum
  const sequenceStr = nextSequenceNumber.toString().padStart(3, '0');
  
  return `${prefix}${sequenceStr}`;
}
