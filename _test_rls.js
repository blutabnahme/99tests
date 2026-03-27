const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vrlhrmdlkycvmajgdmdw.supabase.co';
const ANON_KEY = 'sb_publishable_fJSr8gyPUOahWoRqyGsDvQ_HyrFZnLc';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

(async () => {
    // login as BC
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'bc@blutabnahme.de',
      password: 'Test1234!'
    });
    
    if (authErr) {
        console.error("Auth error:", authErr.message);
        process.exit(1);
    }
    
    console.log("Logged in as BC. User ID:", authData.user.id);
    
    // query matches with RLS
    const { data: matches, error: matchesErr } = await supabase
      .from('match')
      .select('id, status, case_id')
      .eq('bc_id', authData.user.id)
      .in('status', ['available', 'invited']);
      
    console.log("Match error:", matchesErr);
    console.log("Matches data:", matches);
})();
