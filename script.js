supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;
    showDashboard();
    loadData();
  }
});


// 🔑 Supabase Config (YAHAN APNI KEY DAAL)
const SUPABASE_URL = "https://gpcbkguyrkluazkznybf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2JrZ3V5cmtsdWF6a3pueWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzMwMTIsImV4cCI6MjA5MDY0OTAxMn0.NqG6ggDw2xV2mHv1B0HB78c6Td-xMgOCtGTNnpgMatw;

// Init
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const dashboard = document.getElementById("dashboard");
const loginModal = document.getElementById("loginModal");
const entryModal = document.getElementById("entryModal");
const entryForm = document.getElementById("entryForm");
const authForm = document.getElementById("authForm");

let currentUser = null;

// ================= AUTH =================

// check user
async function checkUser() {
  const { data } = await supabaseClient.auth.getUser();
  if (data.user) {
    currentUser = data.user;
    showDashboard();
    loadData();
  } else {
    showLogin();
  }
}

setTimeout(checkUser, 1000);

// login/signup
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  

  const { data, error } = await supabaseClient.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  // try signup
  const { error: signupError } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (signupError) alert(signupError.message);
  else alert("Account created! Login again");
} else {
  // ✅ LOGIN SUCCESS FIX
  currentUser = data.user;
  showDashboard();
  loadData();
}

// logout
logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

// ================= UI =================

function showDashboard() {
  loginBtn.style.display = "none";
  logoutBtn.style.display = "block";
  dashboard.style.display = "block";
  userEmail.style.display = "block";
  userEmail.innerText = currentUser.email;
  loginModal.style.display = "none";
}

function showLogin() {
  loginBtn.style.display = "block";
  logoutBtn.style.display = "none";
  dashboard.style.display = "none";
}

loginBtn.onclick = () => {
  loginModal.style.display = "flex";
};

document.querySelectorAll(".close").forEach(btn => {
  btn.onclick = () => {
    loginModal.style.display = "none";
    entryModal.style.display = "none";
  };
});

// ================= ENTRY =================

document.getElementById("addEntryBtn").onclick = () => {
  entryModal.style.display = "flex";
};

// save entry
entryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const entry = {
  user_id: currentUser.id,
  date: document.getElementById("entryDate").value,
  gsHours: parseFloat(document.getElementById("gsHours").value) || 0,
  csatHours: parseFloat(document.getElementById("csatHours").value) || 0,
  optionalHours: parseFloat(document.getElementById("optionalHours").value) || 0,
  currentAffairs: parseFloat(document.getElementById("caHours").value) || 0,
  revisionHours: 0,
  mockHours: 0
};

  const { error } = await supabaseClient.from("entries").insert([entry]);

  if (error) {
    alert("Save failed ❌");
    console.log(error);
  } else {
    alert("Saved ✅");
    entryModal.style.display = "none";
    loadData();
  }
});

// ================= LOAD DATA =================

async function loadData() {
  const { data, error } = await supabaseClient
    .from("entries")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("date", { ascending: false });

  if (error) return console.log(error);

  renderEntries(data);
  renderStats(data);
  renderCharts(data);
}

// ================= RENDER =================

function renderEntries(data) {
  const list = document.getElementById("entriesList");
  list.innerHTML = "";

  data.forEach(e => {
    list.innerHTML += `
      <div class="entry-item">
        <div class="entry-header">
          <span class="entry-date">${e.date}</span>
          <span class="total-hours">${e.total_hours}h</span>
        </div>
        <p>GS: ${e.gs_hours} | CSAT: ${e.csat_hours}</p>
        <p class="notes">${e.notes || ""}</p>
      </div>
    `;
  });
}

function renderStats(data) {
  const totalDays = data.length;

  const totalHours = data.reduce((sum, e) => sum + e.total_hours, 0);
  const avg = totalDays ? (totalHours / totalDays).toFixed(1) : 0;

  document.getElementById("totalDays").innerText = totalDays;
  document.getElementById("avgStudyHours").innerText = avg + "h";
  document.getElementById("consistency").innerText = (totalDays * 3) + "%";
  document.getElementById("streak").innerText = totalDays;
}

// ================= CHART =================

function renderCharts(data) {
  const ctx = document.getElementById("weeklyChart");

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(e => e.date),
      datasets: [{
        label: "Hours",
        data: data.map(e => e.total_hours)
      }]
    }
  });
}
