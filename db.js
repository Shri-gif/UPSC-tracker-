// Supabase config
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-key";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
