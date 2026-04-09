import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://gpcbkguyrkluazkznybf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2JrZ3V5cmtsdWF6a3pueWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzMwMTIsImV4cCI6MjA5MDY0OTAxMn0.NqG6ggDw2xV2mHv1B0HB78c6Td-xMgOCtGTNnpgMatw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// AUTH FUNCTIONS
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
