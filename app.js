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
    labels: labels,
    datasets: [
      {
    label: 'Total',
    data: data,
    borderWidth: 4
  },
      {
        label: 'GS',
        data: last7.map(e => e.gsHours),
        borderWidth: 2
      },
      {
        label: 'CSAT',
        data: last7.map(e => e.csatHours),
        borderWidth: 2
      },
      {
        label: 'Optional',
        data: last7.map(e => e.optionalHours),
        borderWidth: 2
      },
      {
        label: 'Current Affairs',
        data: last7.map(e => e.currentAffairs),
        borderWidth: 2
      },
      {
        label: 'Revision',
        data: last7.map(e => e.revisionHours),
        borderWidth: 2
      },
      {
        label: 'Mock',
        data: last7.map(e => e.mockHours),
        borderWidth: 2
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true, 
      },
   }
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

async function loadNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  container.innerHTML = "Loading news... ⏳";

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log("NEWS ERROR:", error);
    container.innerHTML = "Failed to load news ❌";
    return;
  }

  displayNews(data || []);
}

function displayNews(news) {
  const container = document.getElementById("news-container");

  if (!news.length) {
    container.innerHTML = "No news available 📰";
    return;
  }

  container.innerHTML = news.map(item => `
    <div class="news-card">
      <h3>${item.title}</h3>
      <p>${item.summary || item.content || "No summary available"}</p>
      
      <a href="${item.link}" target="_blank" 
         style="color:blue; font-weight:bold; text-decoration:none;">
         🔗 Read more
      </a>
      
      <br><small>${new Date(item.created_at).toLocaleDateString()}</small>
    </div>
  `).join('');
}
window.showTab = function(tabId) {
  const tabs = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => tab.style.display = "none");

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.style.display = "block";

  // 🔥 LOAD NEWS HERE
  if (tabId === "current") {
    loadNews();
  }
  if (tabId === "daily") {
  loadDailyAnalysis();
  }
};

async function loadDailyAnalysis() {
  const container = document.getElementById("analysis-container");
  if (!container) return;

  container.innerHTML = "Loading analysis...";

  const { data, error } = await supabase
    .from('daily_analysis')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.log(error);
    container.innerHTML = "Error loading analysis ❌";
    return;
  }

  displayAnalysis(data);
}
function displayAnalysis(data) {
  const container = document.getElementById("analysis-container");

  container.innerHTML = data.map(item => `
    <div class="news-card">

      <h3>📌 ${item.topic}</h3>
      <small>${item.date}</small>

      <p><b>🧾 What:</b> ${item.what_is}</p>
      <p><b>📰 Why:</b> ${item.why_in_news}</p>
      <p><b>📚 Background:</b> ${item.background}</p>
      <p><b>📊 Analysis:</b> ${item.analysis}</p>
      <p><b>⚠️ Challenges:</b> ${item.challenges}</p>
      <p><b>🎯 Exam:</b> ${item.exam_angle}</p>

      <p style="font-size:12px;">Source: ${item.source}</p>

    </div>
  `).join('');
}


async function processVideo() {

  // 🔥 Step 1: YouTube link le
  const link = prompt("Paste YouTube video link:");
  if (!link) return;

  // 🔥 Step 2: Transcript le (auto paste)
  const transcript = prompt("Paste transcript here:");
  if (!transcript) return;

  // 🔥 Step 3: AI se analysis
  const aiData = await generateAnalysis(transcript);

  // 🔥 Step 4: Supabase me save
  await saveAnalysis(aiData);

  // 🔥 Step 5: UI refresh
  loadDailyAnalysis();

  alert("✅ Done! Analysis added");
}

// 🔥 YAHAN ADD KAR (NEW FUNCTIONS)

async function generateAnalysis(text) {
  const res = await fetch("https://eor45gntg2p0jm0.m.pipedream.net", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: text
    })
  });

  return await res.json();
}

async function saveAnalysis(aiData) {
  const { error } = await supabase.from("daily_analysis").insert([{
    date: new Date().toISOString().split("T")[0],
    topic: aiData.topic,
    what_is: aiData.what_is,
    why_in_news: aiData.why_in_news,
    background: aiData.background,
    analysis: aiData.analysis,
    challenges: aiData.challenges,
    exam_angle: aiData.exam_angle,
    source: "YouTube"
  }]);

  if (error) {
    alert("❌ Error saving");
    console.log(error);
  }
}
window.processVideo = processVideo;
