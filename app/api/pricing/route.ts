import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: configs, error } = await supabaseAdmin
      .from('platform_config')
      .select('id, value');
      
    if (error) {
      console.error('Error fetching platform config:', error);
      throw error;
    }
    
    // Parse the config values
    const getConfigValue = (id: string, property: string, defaultVal: any) => {
      const found = configs?.find((c: any) => c.id === id);
      return found?.value?.[property] ?? defaultVal;
    };
    
    return NextResponse.json({
      practice_org_fee: getConfigValue('fees', 'practice_org_fee', 20),
      home_org_fee: getConfigValue('fees', 'home_org_fee', 35),
      commission_rate: getConfigValue('commission', 'default_platform_rate_pct', 17.5),
      vat_rate: getConfigValue('tax', 'vat_rate_pct', 19),
      min_bc_payout: getConfigValue('pricing', 'min_bc_payout', 12.50),
    });
  } catch (error) {
    return NextResponse.json({
      practice_org_fee: 20,
      home_org_fee: 35,
      commission_rate: 17.5,
      vat_rate: 19,
      min_bc_payout: 12.50
    });
  }
}
