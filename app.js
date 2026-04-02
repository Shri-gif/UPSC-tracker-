import { supabase, signUp, signIn, signOut, getCurrentUser, onAuthStateChange } from './db.js';

let currentUser = null;
let weeklyChart, monthlyChart, yearlyChart;

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
}

function displayData(entries) {
  elements.dataList.innerHTML = entries.length ? 
    entries.map(entry => createEntryCard(entry)).join('') : 
    '<div class="no-entries">No study sessions yet! Add your first one! 🎯</div>';
}

// 🔥 Add this function after displayData()
async function loadAnalytics() {
  if (!currentUser) return;
  
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', currentUser.id)
    .gte('date', getWeekStart().toISOString().split('T')[0])
    .order('date');
    
  if (entries?.length) {
    renderWeeklyChart(entries);
    updateWeeklyTotal(entries);
  }
  
  // Monthly
  const monthlyEntries = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', currentUser.id)
    .gte('date', getMonthStart().toISOString().split('T')[0]);
    
  if (monthlyEntries.data?.length) {
    renderMonthlyChart(monthlyEntries.data);
    updateMonthlyTotal(monthlyEntries.data);
  }
}

// 🔥 Helper functions
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 0);
  return new Date(now.setDate(diff));
}

function getMonthStart() {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

function renderWeeklyChart(entries) {
  const ctx = document.getElementById('weeklyChart')?.getContext('2d');
  if (ctx && weeklyChart) weeklyChart.destroy();
  
  const labels = [...new Set(entries.map(e => new Date(e.date).toLocaleDateString('en-IN')))];
  const data = {
    gsHours: entries.reduce((sum, e) => sum + (e.gsHours || 0), 0),
    csatHours: entries.reduce((sum, e) => sum + (e.csatHours || 0), 0),
    optionalHours: entries.reduce((sum, e) => sum + (e.optionalHours || 0), 0),
    currentAffairs: entries.reduce((sum, e) => sum + (e.currentAffairs || 0), 0),
    revisionHours: entries.reduce((sum, e) => sum + (e.revisionHours || 0), 0),
    mockHours: entries.reduce((sum, e) => sum + (e.mockHours || 0), 0),
  };
  
  weeklyChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['GS', 'CSAT', 'Optional', 'CA', 'Revision', 'Mock'],
      datasets: [{
        data: Object.values(data),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function updateWeeklyTotal(entries) {
  const total = entries.reduce((sum, e) => 
    sum + (e.gsHours || 0) + (e.csatHours || 0) + (e.optionalHours || 0) + 
    (e.currentAffairs || 0) + (e.revisionHours || 0) + (e.mockHours || 0), 0);
  document.getElementById('weeklyTotal').textContent = `${total.toFixed(1)} Total Hours`;
}

// Similar for monthly...
function renderMonthlyChart(entries) {
  const ctx = document.getElementById('monthlyChart')?.getContext('2d');
  if (ctx && monthlyChart) monthlyChart.destroy();
  
  const dataByWeek = {};
  entries.forEach(e => {
    const week = getWeekNumber(new Date(e.date));
    dataByWeek[week] = (dataByWeek[week] || 0) + Object.values(e).slice(2).reduce((a,b) => a + (b||0), 0);
  });
  
  monthlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(dataByWeek),
      datasets: [{
        label: 'Hours',
        data: Object.values(dataByWeek),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        tension: 0.4
      }]
    },
    options: { responsive: true }
  });
}

function updateMonthlyTotal(entries) {
  const total = entries.reduce((sum, e) => 
    sum + Object.values(e).slice(2).reduce((a,b) => a + (b||0), 0), 0);
  document.getElementById('monthlyTotal').textContent = `${total.toFixed(1)} Total Hours`;
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// 🔥 Update loadUserEntries()
async function loadUserEntries() {
  // Existing code...
  await loadAnalytics(); // 🔥 ADD THIS LINE
}

// 🔥 Call analytics after adding entry
async function addEntry(e) {
  // Existing code...
  if (!error) {
    resetForm();
    loadUserEntries(); // This now includes charts!
  }
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
