// Supabase config
const SUPABASE_URL = "https://gpcbkguyrkluazkznybf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2JrZ3V5cmtsdWF6a3pueWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzMwMTIsImV4cCI6MjA5MDY0OTAxMn0.NqG6ggDw2xV2mHv1B0HB78c6Td-xMgOCtGTNnpgMatw";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

// Login function
async function loginUser(email, password) {
  return await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
}

// Signup function
async function signupUser(email, password) {
  return await supabaseClient.auth.signUp({
    email,
    password
  });
}
