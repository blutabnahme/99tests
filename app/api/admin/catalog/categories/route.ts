export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data, error } = await supabaseAdmin
 .from('tt_test_catalog')
 .select('category');

 if (error) throw error;

 const categories = Array.from(new Set(data.filter(d => d.category).map(d => d.category as string)));
 categories.sort((a, b) => a.localeCompare(b));

 return NextResponse.json(categories);
 } catch (error: any) {
 console.error("GET admin catalog categories error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
