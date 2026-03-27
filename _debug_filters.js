const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vrlhrmdlkycvmajgdmdw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybGhybWRsa3ljdm1hamdkbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxNjQ1MiwiZXhwIjoyMDg4OTkyNDUyfQ.4ZXgtNLnFCEhEOzAxIBU-chRfBLrKAFWaggW_J5FEJg');
(async () => {
    const uid = 'f105dc5f-7a00-4bc8-9fb8-71ae834bb93c';
    const { data: matches } = await supabase
      .from('match')
      .select('id, status, case_id, case:case_id(*, patient(address), healthcare_company:hc_id(name))')
      .eq('bc_id', uid)
      .in('status', ['available', 'invited']);
    
    console.log("Matches count:", matches.length);
    if(matches.length > 0) {
      const c = Array.isArray(matches[0].case) ? matches[0].case[0] : matches[0].case;
      console.log("First match case:", JSON.stringify(c, null, 2));
      const now = new Date().toISOString();
      console.log("Is status created?", c.status === 'created');
      console.log("Is deadline > now?", c.application_deadline > now);
      console.log("Case status:", c.status);
      console.log("Case deadline:", c.application_deadline);
    }
})();
