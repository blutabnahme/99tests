export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 // Get all active tests and their categories to extract distinct values
 const { data, error } = await supabaseAdmin
 .from('tt_test_catalog')
 .select('category')
 .eq('is_active', true)
 .not('category', 'is', null)
 .not('category', 'eq', '');

 if (error) throw error;

 // Extract unique categories
 const categories = Array.from(new Set(data.map(item => item.category))).sort();

 return NextResponse.json(categories);
 } catch (error: any) {
 console.error("GET doctor catalog categories error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
