// Supabase config
const SUPABASE_URL = "https://gpcbkguyrkluazkznybf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G68X4gRScisCoGJTEKirFA_bXi-NWcL";

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
