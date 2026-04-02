// db.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = 'https://gpcbkguyrkluazkznybf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2JrZ3V5cmtsdWF6a3pueWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzMwMTIsImV4cCI6MjA5MDY0OTAxMn0.NqG6ggDw2xV2mHv1B0HB78c6Td-xMgOCtGTNnpgMatw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    return null;
  }
}

// Listen for auth changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
// Database functions
export async function getAllData(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

export async function getDataById(tableName, id) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching data by ID:', error);
    return null;
  }
}

export async function insertData(tableName, data) {
  try {
    const { data: newData, error } = await supabase
      .from(tableName)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return newData;
  } catch (error) {
    console.error('Error inserting data:', error);
    return null;
  }
}

export async function updateData(tableName, id, data) {
  try {
    const { data: updatedData, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  } catch (error) {
    console.error('Error updating data:', error);
    return null;
  }
}

export async function deleteData(tableName, id) {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting data:', error);
    return false;
  }
}

// Real-time subscription helper
export function subscribeToTable(tableName, callback) {
  return supabase
    .channel(tableName)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: tableName },
      (payload) => callback(payload)
    )
    .subscribe();
}
