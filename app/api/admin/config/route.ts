import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: configs, error: configError } = await supabaseAdmin.from('platform_config').select('*');
    if (configError) throw configError;
    
    const { data: materials, error: matError } = await supabaseAdmin.from('material_catalog').select('*').order('name');
    if (matError) throw matError;

    return NextResponse.json({ configs, materials });
  } catch (error: any) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, value } = await request.json();

    if (!id || !value) {
      return NextResponse.json({ error: 'Missing config payload' }, { status: 400 });
    }

    // We instantiate a bypass client using the SERVICE ROLE key
    // This allows the server to upsert the config irrespective of RLS policies for now
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('platform_config')
      .upsert({ 
        id, 
        value, 
        updated_at: new Date().toISOString() 
      });

    if (error) {
      console.error('Config save error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/admin/config');
    return NextResponse.json({ success: true, id });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
