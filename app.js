import { supabase, signUp, signIn, signOut, getCurrentUser, onAuthStateChange } from './db.js';

let currentUser = null;
let weeklyChart = null;

const elements = {
  authSection: document.getElementById('authSection'),
  dashboardSection: document.getElementById('dashboardSection'),
  dataList: document.getElementById('dataList'),
  userEmail: document.getElementById('userEmail'),
  loginForm: document.getElementById('loginForm'),
  signupForm: document.getElementById('signupForm'),
  addForm: document.getElementById('addForm')
};

async function init() {
  currentUser = await getCurrentUser();
  updateUI();
  setupEventListeners();
  
  onAuthStateChange((_, session) => {
    currentUser = session?.user || null;
    updateUI();
  });
}

function updateUI() {
  if (currentUser) {
    elements.authSection?.classList.add('hidden');
    elements.dashboardSection?.classList.remove('hidden');
    elements.userEmail.textContent = currentUser.email;
    loadUserEntries();
  } else {
    elements.authSection?.classList.remove('hidden');
    elements.dashboardSection?.classList.add('hidden');
  }
}

async function loadUserEntries() {
  if (!currentUser) return;
  
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false });
    
  displayData(entries || []);
  localStorage.setItem('studyData', JSON.stringify(entries || []));
}

function displayData(entries) {
  elements.dataList.innerHTML = entries.length ? 
    entries.map(entry => createEntryCard(entry)).join('') : 
    '<div class="no-entries">No study sessions yet! Add your first one! 🎯</div>';
     generateAnalytics(entries);
}

function createEntryCard(entry) {
  return `
    <div class="entry-card">
      <div class="entry-date">${new Date(entry.date).toLocaleDateString('en-IN')}</div>
      <div class="entry-stats">
        <div class="stat">📖 GS<br>${entry.gsHours}h</div>
        <div class="stat">🎯 CSAT<br>${entry.csatHours}h</div>
        <div class="stat">📚 Opt<br>${entry.optionalHours}h</div>
        <div class="stat">📰 CA<br>${entry.currentAffairs}h</div>
        <div class="stat">🔄 Rev<br>${entry.revisionHours}h</div>
        <div class="stat">📝 Mock<br>${entry.mockHours}h</div>
      </div>
    </div>
  `;
}

function generateAnalytics(entries) {
  if (!entries || entries.length === 0) return;

  const last7 = entries.slice(0, 7).reverse();

  const labels = last7.map(e => new Date(e.date).toLocaleDateString());
  const data = last7.map(e =>
    e.gsHours + e.csatHours + e.optionalHours +
    e.currentAffairs + e.revisionHours + e.mockHours
  );

  const ctx = document.getElementById('trendChart');
  if (!ctx) return; // 💥 crash protection

  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(ctx, {
type: 'line',
data: {
labels,
datasets: [{
label: 'Study Hours',
data,
borderWidth: 2
}]
},
options: {
responsive: true,
maintainAspectRatio: false
}
});
}
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const { error } = await signIn(email, password);
  if (error) alert('Login failed: ' + error.message);
}

async function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  
  const { error } = await signUp(email, password);
  if (error) alert('Signup failed: ' + error.message);
  else alert('✅ Check your email to confirm!');
}

async function addEntry(e) {
  e.preventDefault();
  if (!currentUser) return alert('Please login!');

  const entry = {
    user_id: currentUser.id,
    date: document.getElementById('entryDate').value,
    gsHours: parseFloat(document.getElementById('gsHours').value) || 0,
    csatHours: parseFloat(document.getElementById('csatHours').value) || 0,
    optionalHours: parseFloat(document.getElementById('optionalHours').value) || 0,
    currentAffairs: parseFloat(document.getElementById('currentAffairs').value) || 0,
    revisionHours: parseFloat(document.getElementById('revisionHours').value) || 0,
    mockHours: parseFloat(document.getElementById('mockHours').value) || 0,
  };

  const { error } = await supabase.from('entries').insert([entry]).select().single();
  if (!error) {
    resetForm();
    loadUserEntries();
    alert('✅ Study session added!');
  }
}

function resetForm() {
  document.querySelectorAll('#addForm input').forEach(input => input.value = '');
}

function setupEventListeners() {
  elements.loginForm?.addEventListener('submit', handleLogin);
  elements.signupForm?.addEventListener('submit', handleSignup);
  elements.addForm?.addEventListener('submit', addEntry);
}

window.logout = signOut;
window.resetForm = resetForm;

document.addEventListener('DOMContentLoaded', init);
