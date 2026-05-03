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

// 🔥 FIXED - All errors resolved
window.showTab = function(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => tab.style.display = "none");

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.style.display = "block";

  if (tabId === "current") loadNews();
  if (tabId === "daily") loadDailyAnalysis();
};

// ✅ FIXED: loadDailyAnalysis
async function loadDailyAnalysis() {
  const container = document.getElementById("analysis-container");
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading Daily Analysis...</p>
    </div>
  `;

  try {
    const { data, error } = await supabase
      .from('daily_analysis')  // Ya 'hindu_analysis' jo bhi table hai
      .select('*')
      .order('created_at', { ascending: false })  // 'date' ki jagah 'created_at'
      .limit(10);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      container.innerHTML = '<p class="no-data">No analysis available yet 😔</p>';
      return;
    }

    displayAnalysis(data);
  } catch (error) {
    console.error('Load Error:', error);
    container.innerHTML = `<p class="error">Error loading analysis: ${error.message}</p>`;
  }
}

// ✅ FIXED: displayAnalysis
function displayAnalysis(data) {
  const container = document.getElementById("analysis-container");
  
  container.innerHTML = data.map(item => `
    <div class="news-card analysis-card">
      <div class="card-header">
        <h3>📌 ${item.topic || 'N/A'}</h3>
        <small>${item.created_at ? new Date(item.created_at).toLocaleDateString('hi-IN') : 'N/A'}</small>
      </div>
      
      <div class="analysis-grid">
        <div class="analysis-section">
          <b>ℹ️ What:</b> ${item.what_is || 'N/A'}
        </div>
        <div class="analysis-section">
          <b>📰 Why:</b> ${item.why_in_news || 'N/A'}
        </div>
        <div class="analysis-section">
          <b>📚 Background:</b> ${item.background || 'N/A'}
        </div>
        <div class="analysis-section full-width">
          <b>🔍 Analysis:</b> ${item.analysis || 'N/A'}
        </div>
        <div class="analysis-section">
          <b>⚠️ Challenges:</b> ${item.challenges || 'N/A'}
        </div>
        <div class="analysis-section">
          <b>🎯 Exam Angle:</b> ${item.exam_angle || 'N/A'}
        </div>
      </div>
      
      <div class="card-footer">
        <small>Source: ${item.source || 'Hindu Newspaper'}</small>
      </div>
    </div>
  `).join('');
}

// ✅ FIXED: processVideo function
window.processVideo = async function() {
  try {
    const transcript = prompt("📝 Paste YouTube transcript or topic:");
    if (!transcript) return;

    // Show loading
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Processing...";
    btn.disabled = true;

    const aiData = await generateAnalysis(transcript);
    
    if (!aiData) {
      alert("❌ AI analysis failed!");
      return;
    }

    await saveAnalysis(aiData);
    await loadDailyAnalysis(); // Refresh UI
    
    alert("✅ Analysis saved successfully!");
  } catch (error) {
    console.error("Process Error:", error);
    alert("❌ Error: " + error.message);
  } finally {
    // Reset button
    const btn = document.querySelector('button[onclick="processVideo()"]');
    btn.innerHTML = "🎥 Process YouTube Video";
    btn.disabled = false;
  }
};

// ✅ FIXED: generateAnalysis (API Key fix)
async function generateAnalysis(topic) {
  try {
    const API_KEY = 'AIzaSyAgusHcHsOIKPhdidhMR4fpdR9JZbdjeD0'; // Direct key (secure nahi, production mein env use karo)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `UPSC format mein JSON return karo ONLY:

{
  "topic": "${topic.substring(0, 100)}",
  "what_is": "",
  "why_in_news": "",
  "background": "",
  "analysis": "",
  "challenges": "",
  "exam_angle": ""
}`
            }]
          }]
        })
      }
    );

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error('AI Error:', error);
    return null;
  }
}

// ✅ FIXED: saveAnalysis
async function saveAnalysis(aiData) {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase.from('daily_analysis').insert([{
    date: today,
    created_at: new Date().toISOString(),
    topic: aiData.topic || "Untitled",
    what_is: aiData.what_is || "",
    why_in_news: aiData.why_in_news || "",
    background: aiData.background || "",
    analysis: aiData.analysis || "",
    challenges: aiData.challenges || "",
    exam_angle: aiData.exam_angle || "",
    source: "YouTube/AI"
  }]);

  if (error) throw new Error(error.message);
}

// 🔥 Manual Hindu Analysis Add Function (Tumhare liye)
/*window.addManualAnalysis = async function() {

  const topic = prompt("Topic enter karo:");
  if (!topic || topic.trim() === "") {
    alert("❌ Topic required!");
    return;
  }

  const what = prompt("What is it?");
  const why = prompt("Why in news?");

  // 🚫 stop if user cancels midway
  if (what === null || why === null) {
    alert("❌ Entry cancelled");
    return;
  }

  const data = {
    topic: topic.trim(),
    what_is: what.trim(),
    why_in_news: why.trim(),
    background: (prompt("Background:") || "").trim(),
    analysis: (prompt("Analysis:") || "").trim(),
    challenges: (prompt("Challenges:") || "").trim(),
    exam_angle: (prompt("Exam angle:") || "").trim()
  };

  // 🛑 FINAL VALIDATION
  if (!data.topic || !data.what_is || !data.why_in_news) {
    alert("❌ Important fields missing!");
    return;
  }

  await saveAnalysis(data);
  await loadDailyAnalysis();

  alert("✅ Manual analysis saved!");
};*/

// CSS for better UI
const style = document.createElement('style');
style.textContent = `
  .analysis-card { 
    background: white; border-radius: 16px; padding: 1.5rem; 
    margin-bottom: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    border-left: 5px solid #3b82f6;
  }
  .card-header { margin-bottom: 1rem; }
  .card-header h3 { margin: 0 0 0.5rem 0; color: #1e293b; }
  .analysis-grid { display: grid; gap: 1rem; }
  .analysis-section { background: #f8fafc; padding: 1rem; border-radius: 8px; }
  .full-width { grid-column: 1 / -1; }
  .loading-spinner { text-align: center; padding: 3rem; }
  .spinner { border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {

const btn = document.getElementById("saveAnalysisBtn");

if(!btn) return;

btn.addEventListener("click", async () => {

const data = {
  topic: document.getElementById("topic").value.trim(),
  what_is: document.getElementById("what").value.trim(),
  why_in_news: document.getElementById("why").value.trim(),
  analysis: document.getElementById("analysis").value.trim(),
  background: "",
  challenges: "",
  exam_angle: ""
};

if(!data.topic || !data.what_is || !data.why_in_news){
  alert("❌ Fill required fields");
  return;
}

await saveAnalysis(data);
await loadDailyAnalysis();

alert("✅ Saved");

// reset
document.querySelectorAll("#manualForm input, #manualForm textarea")
.forEach(el => el.value="");

});

});
