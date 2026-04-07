import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { data, error } = await supabaseClient.from('tt_laboratory').select('id, name').order('name');
 if (error) throw error;
 
 return NextResponse.json({ data });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
