"use server";

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getAdminClient() {
 return createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!,
 { auth: { persistSession: false } }
 );
}

export async function generateApiKey(hcId: string) {
 const supabase = getAdminClient();
 
 const rawSecret = crypto.randomBytes(32).toString('hex');
 const apiKey = `blt_sk_${rawSecret}`;
 const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
 
 // Expose the first 15 chars (blt_sk_ + 8 hex chars) for the dashboard UI
 const apiPrefix = apiKey.substring(0, 15); 
 
 const { error } = await supabase.from('doctor_practice').update({
 api_key_hash: apiKeyHash,
 api_key_prefix: apiPrefix,
 api_enabled: true
 }).eq('id', hcId);
 
 if (error) throw new Error(error.message);
 
 return apiKey;
}

export async function updateApiConfig(hcId: string, enabled: boolean, rateLimit: number) {
 const supabase = getAdminClient();
 const { error } = await supabase.from('doctor_practice').update({
 api_enabled: enabled,
 api_rate_limit: rateLimit
 }).eq('id', hcId);
 
 if (error) throw new Error(error.message);
 return true;
}

export async function getApiConfig(hcId: string) {
 const supabase = getAdminClient();
 const { data, error } = await supabase.from('doctor_practice').select('api_enabled, api_key_prefix, api_rate_limit, webhook_url, webhook_secret').eq('id', hcId).single();
 if (error) throw new Error(error.message);
 return data;
}

export async function getApiLogs(hcId: string) {
 const supabase = getAdminClient();
 const { data, error } = await supabase
 .from('api_log')
 .select('*')
 .eq('doctor_id', hcId)
 .order('created_at', { ascending: false })
 .limit(20);
 
 if (error) throw new Error(error.message);
 return data || [];
}

export async function generateWebhookSecret(hcId: string) {
 const supabase = getAdminClient();
 const rawSecret = crypto.randomBytes(32).toString('hex');
 const signature = `whsec_${rawSecret}`;
 
 const { error } = await supabase.from('doctor_practice').update({
 webhook_secret: signature
 }).eq('id', hcId);
 
 if (error) throw new Error(error.message);
 return signature;
}

export async function updateWebhookUrl(hcId: string, url: string | null) {
 const supabase = getAdminClient();
 const { error } = await supabase.from('doctor_practice').update({
 webhook_url: url
 }).eq('id', hcId);
 
 if (error) throw new Error(error.message);
 return true;
}

export async function getWebhookLogs(hcId: string) {
 const supabase = getAdminClient();
 const { data, error } = await supabase
 .from('webhook_log')
 .select('*')
 .eq('doctor_id', hcId)
 .order('created_at', { ascending: false })
 .limit(20);
 
 if (error) {
 // Failsafe returned empty if schema doesn't exist yet natively
 console.warn(error);
 return [];
 }
 return data || [];
}
