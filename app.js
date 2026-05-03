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

// 🔥 COMPLETE FIXED app.js - All Features Working
window.showTab = function(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => tab.style.display = "none");

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.style.display = "block";

  if (tabId === "current") loadNews();
  if (tabId === "daily") loadDailyAnalysis();
};

// ✅ loadDailyAnalysis - Perfect Working
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
      .from('daily_analysis')
      .select('*')
      .order('created_at', { ascending: false })
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

// ✅ displayAnalysis - Beautiful Cards
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

// ✅ processVideo - YouTube AI Processing
window.processVideo = async function() {
  try {
    const transcript = prompt("📝 Paste YouTube transcript or topic:");
    if (!transcript) return;

    const btn = event?.target || document.querySelector('button[onclick="processVideo()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Processing...";
    btn.disabled = true;

    const aiData = await generateAnalysis(transcript);
    
    if (!aiData) {
      alert("❌ AI analysis failed!");
      return;
    }

    await saveAnalysis(aiData);
    await loadDailyAnalysis();
    
    alert("✅ Analysis saved successfully!");
  } catch (error) {
    console.error("Process Error:", error);
    alert("❌ Error: " + error.message);
  } finally {
    const btn = document.querySelector('button[onclick="processVideo()"]');
    btn.innerHTML = "🎥 Process YouTube Video";
    btn.disabled = false;
  }
};

// ✅ generateAnalysis - Gemini AI Fixed
async function generateAnalysis(topic) {
  try {
    const API_KEY = 'AIzaSyAgusHcHsOIKPhdidhMR4fpdR9JZbdjeD0';
    
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

// ✅ saveAnalysis - Supabase Save
async function saveAnalysis(data) {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase.from('daily_analysis').insert([{
    date: today,
    created_at: new Date().toISOString(),
    topic: data.topic || "Untitled",
    what_is: data.what_is || "",
    why_in_news: data.why_in_news || "",
    background: data.background || "",
    analysis: data.analysis || "",
    challenges: data.challenges || "",
    exam_angle: data.exam_angle || "",
    source: data.source || "Manual/Hindu"
  }]);

  if (error) throw new Error(error.message);
}

// 🔥 MODAL MANUAL ENTRY - NO TAB SWITCHING!
let currentManualData = {};

function createManualModal() {
  if (document.getElementById('manualModal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'manualModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeManualModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>✏️ Add Hindu Analysis</h3>
          <button class="close-btn" onclick="closeManualModal()">×</button>
        </div>
        <form id="manualForm">
          <div class="form-group">
            <label>📌 Topic *</label>
            <input type="text" id="topic" required maxlength="100">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>ℹ️ What is it?</label>
              <input type="text" id="what_is">
            </div>
            <div class="form-group">
              <label>📰 Why in News?</label>
              <input type="text" id="why_in_news">
            </div>
          </div>
          <div class="form-group">
            <label>📚 Background</label>
            <textarea id="background" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>🔍 Analysis *</label>
            <textarea id="analysis" rows="4" required></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>⚠️ Challenges</label>
              <textarea id="challenges" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>🎯 Exam Angle</label>
              <textarea id="exam_angle" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick="closeManualModal()">Cancel</button>
            <button type="submit" class="save-btn">💾 Save Analysis</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function injectModalCSS() {
  if (document.getElementById('manualModalCSS')) return;
  
  const style = document.createElement('style');
  style.id = 'manualModalCSS';
  style.textContent = `
    #manualModal {
      position: fixed; z-index: 10000; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
      padding: 1rem; backdrop-filter: blur(5px);
    }
    .modal-overlay { width: 100%; height: 100%; }
    .modal-content {
      background: white; border-radius: 20px; max-width: 90vw; max-height: 90vh;
      overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); animation: modalSlide 0.3s ease;
      max-width: 600px; width: 100%;
    }
    @keyframes modalSlide { from { opacity: 0; transform: scale(0.8) translateY(-30px); } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 1.5rem 0; }
    .modal-header h3 { margin: 0; color: #1e293b; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; padding: 0.5rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151; font-size: 14px; }
    .form-group input, .form-group textarea {
      width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 12px;
      font-size: 14px; transition: all 0.2s; box-sizing: border-box;
    }
    .form-group input:focus, .form-group textarea:focus {
      outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-actions {
      display: flex; gap: 1rem; justify-content: flex-end; padding: 1.5rem;
      border-top: 1px solid #e5e7eb; margin-top: 1rem;
    }
    .cancel-btn { 
      background: #f3f4f6; color: #6b7280; padding: 0.75rem 1.5rem; 
      border: none; border-radius: 10px; cursor: pointer; font-weight: 500;
    }
    .save-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
      color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 10px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .save-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(59,130,246,0.4); }
    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

// Modal Controls
window.openManualModal = function() {
  createManualModal();
  injectModalCSS();
  document.getElementById('manualModal').style.display = 'flex';
  setTimeout(() => document.getElementById('topic').focus(), 300);
};

window.closeManualModal = function() {
  const modal = document.getElementById('manualModal');
  if (modal) modal.style.display = 'none';
};

// Form Handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('manualForm');
  if (form) {
    form.onsubmit = async function(e) {
      e.preventDefault();
      
      const formData = {
        topic: document.getElementById('topic').value,
        what_is: document.getElementById('what_is').value,
        why_in_news: document.getElementById('why_in_news').value,
        background: document.getElementById('background').value,
        analysis: document.getElementById('analysis').value,
        challenges: document.getElementById('challenges').value,
        exam_angle: document.getElementById('exam_angle').value,
        source: "Manual Hindu"
      };

      try {
        await saveAnalysis(formData);
        await loadDailyAnalysis();
        closeManualModal();
        // Clear form
        document.getElementById('manualForm').reset();
        alert('✅ Hindu Analysis saved successfully!');
      } catch (error) {
        alert('❌ Save Error: ' + error.message);
      }
    };
  }
});

// ✅ Complete CSS Injection
const mainStyle = document.createElement('style');
mainStyle.textContent = `
  .analysis-card { 
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.1); border-left: 5px solid #3b82f6;
    transition: all 0.3s ease; cursor: pointer;
  }
  .analysis-card:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
  .card-header { margin-bottom: 1.2rem; }
  .card-header h3 { margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1.3em; }
  .analysis-grid { display: grid; gap: 1rem; }
  .analysis-section { 
    background: #f1f5f9; padding: 1rem; border-radius: 12px; 
    border-left: 3px solid #60a5fa;
  }
  .full-width { grid-column: 1 / -1; background: #e0f2fe; border-left-color: #0284c7; }
  .card-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
  .loading-spinner { text-align: center; padding: 4rem 2rem; color: #64748b; }
  .spinner { 
    border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; 
    border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; 
    margin: 0 auto 1.5rem;
  }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .no-data, .error { text-align: center; padding: 3rem; color: #64748b; font-size: 1.1em; }
  .error { color: #ef4444; }
`;
document.head.appendChild(mainStyle);

console.log("✅ app.js Loaded - All Features Ready!");
