// app.js - COMPLETE VERSION WITH AUTH
import { 
  supabase, 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser, 
  onAuthStateChange,
  getAllData 
} from './db.js';

const TABLE_NAME = 'entries';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const addForm = document.getElementById('addForm');
const dataList = document.getElementById('dataList');
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const userEmail = document.getElementById('userEmail');

// Auth state
let currentUser = null;

// Initialize app
async function init() {
  currentUser = await getCurrentUser();
  updateUI();
  setupEventListeners();
  
  // Listen for auth changes
  onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    updateUI();
  });
}

// Update UI based on auth state
function updateUI() {
  if (currentUser) {
    if (authSection) authSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    if (userEmail) userEmail.textContent = currentUser.email;
    loadUserEntries();
  } else {
    if (authSection) authSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
  }
}

// Load user's entries only
async function loadUserEntries() {
  if (!currentUser) return;
  
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false });
    
  if (entries) {
    displayData(entries);
  }
}

// Display entries (same as before)
function displayData(entries) {
  if (dataList) {
    dataList.innerHTML = entries.length ? 
      entries.map(entry => `
        <div class="entry-item" data-id="${entry.id}">
          <h3>📅 ${new Date(entry.date).toLocaleDateString()}</h3>
          <div class="entry-details">
            <p>📖 GS: ${entry.gsHours}h | CSAT: ${entry.csatHours}h</p>
            <p>📚 Optional: ${entry.optionalHours}h | CA: ${entry.currentAffairs}h</p>
            <p>🔄 Revision: ${entry.revisionHours}h | Mock: ${entry.mockHours}h</p>
          </div>
          <div class="entry-actions">
            <button onclick="editEntry('${entry.id}')" class="edit-btn">✏️ Edit</button>
            <button onclick="deleteEntry('${entry.id}')" class="delete-btn">🗑️ Delete</button>
          </div>
        </div>
      `).join('') : 
      '<p>No entries yet. Add your first study session! 🎯</p>';
  }
}

// 🔥 LOGIN FUNCTION
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const { data, error } = await signIn(email, password);
  
  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    console.log('Logged in:', data.user.email);
  }
}

// 🔥 SIGNUP FUNCTION
async function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  
  const { data, error } = await signUp(email, password);
  
  if (error) {
    alert('Signup failed: ' + error.message);
  } else {
    alert('Check your email to confirm signup!');
  }
}

// 🔥 Add Entry (Updated with currentUser check)
async function addEntry(e) {
  e.preventDefault();
  
  if (!currentUser) {
    alert('Please login first!');
    return;
  }

  const newEntry = {
    user_id: currentUser.id,
    date: document.getElementById("entryDate").value,
    gsHours: parseFloat(document.getElementById("gsHours").value) || 0,
    csatHours: parseFloat(document.getElementById("csatHours").value) || 0,
    optionalHours: parseFloat(document.getElementById("optionalHours").value) || 0,
    currentAffairs: parseFloat(document.getElementById("currentAffairs").value) || 0,
    revisionHours: parseFloat(document.getElementById("revisionHours").value) || 0,
    mockHours: parseFloat(document.getElementById("mockHours").value) || 0,
  };

  const { data, error } = await supabase
    .from('entries')
    .insert([newEntry])
    .select()
    .single();

  if (data) {
    resetForm();
    loadUserEntries();
    alert('✅ Entry added successfully!');
  } else {
    alert('❌ Error: ' + error.message);
  }
}

// Logout
window.logout = async function() {
  await signOut();
};

// Other functions (editEntry, deleteEntry, resetForm) - same as before
window.resetForm = function() {
  document.getElementById("entryDate").value = '';
  document.getElementById("gsHours").value = '';
  // ... reset all fields
};

// Setup event listeners
function setupEventListeners() {
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (signupForm) signupForm.addEventListener('submit', handleSignup);
  if (addForm) addForm.addEventListener('submit', addEntry);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
