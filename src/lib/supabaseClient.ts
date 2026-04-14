import { createClient } from '@supabase/supabase-js';

// Connect to the original external Supabase project (kotobi.com) for database operations
const SUPABASE_URL = "https://kydmyxsgyxeubhmqzrgo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZG15eHNneXhldWJobXF6cmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODQ3NjQsImV4cCI6MjA2MjA2MDc2NH0.b-ckDfOmmf2x__FG5Snm9px8j4pqPke5Ra1RgoGEqP0";

// Lovable Cloud project for edge functions
const LOVABLE_CLOUD_URL = "https://pfxrofycjpqwetfpkvlp.supabase.co";
const LOVABLE_CLOUD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeHJvZnljanBxd2V0ZnBrdmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTQ1MzcsImV4cCI6MjA5MTY5MDUzN30.MwIAJ388Y4S3ajeDYskK-fSJnFOm_KrcVurGYBOHPQw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Client for invoking edge functions deployed on Lovable Cloud
export const supabaseFunctions = createClient(LOVABLE_CLOUD_URL, LOVABLE_CLOUD_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
