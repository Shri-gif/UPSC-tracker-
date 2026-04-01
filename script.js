// Firebase Configuration - Replace with your config
const firebaseConfig = {
apiKey:"AIzaSyBZYzLJ3Ba0UTWWX25ApTFMxdrp7TxNhV4",
authDomain:"upsc-tracker-f4f30.firebaseapp.com",
projectId:"upsc-tracker-f4f30",
storageBucket:"upsc-tracker-f4f30.appspot.com",
messagingSenderId:"984156387207",
appId:"1:984156387207:web:480541277bb02f0fc1c522",
measurementId:"G-V5GZT9P8XT"
};

// Initialize Firebase (sabse pehle)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

auth.getRedirectResult()
.then((result) => {
    if (result.user) {
        console.log("Login success:", result.user.uid);
    }
})
.catch((error) => {
    console.error(error);
});

// UPSC Tracker Class with Firebase Integration
class UPSCTracker {
    constructor() {
        this.dataFile = 'local_data.json'; // Local fallback
        this.userDataPath = null; // Will be set after login
        this.data = {};
        this.currentUser = null;
        this.charts = {};
        this.initFirebaseAuth();
        this.attachEvents();
    }

    // Firebase Authentication Methods
    initFirebaseAuth() {
        // Check auth state
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.userDataPath = `users/${user.uid}/upsc_data`;
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                this.loadUserData();
            } else {
                this.currentUser = null;
                this.userDataPath = null;
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('mainApp').style.display = 'none';
            }
        });
    }

    async googleSignIn() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.setCustomParameters({
                'prompt': 'select_account'
            });
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Google Sign In Error:', error);
            alert('Login failed: ' + error.message);
        }
    }

    async signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Sign Out Error:', error);
        }
    }

    // Data Sync Methods
    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            const snapshot = await db
  .collection("users")
  .doc(this.currentUser.uid)
  .collection("upsc_data")
  .orderBy("date", "desc")
  .limit(365)
  .get(); 
            
            this.data = {};
            snapshot.forEach(doc => {
                this.data[doc.id] = doc.data();
            });
            
            // Merge with local data as fallback
            const localData = this.loadLocalData();
            Object.assign(this.data, localData);
            
            this.initApp();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.initApp(); // Continue with local data
        }
    }

    async saveUserData(dateKey, data) {
        if (!this.currentUser) {
            this.saveLocalData(dateKey, data);
            return;
        }

        try {
            // Save to Firestore
            await db.collection(this.userDataPath.split('/')[0])
                .doc(this.currentUser.uid)
                .collection('upsc_data')
                .doc(dateKey)
                .set({
                    ...data,
                    date: dateKey,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    uid: this.currentUser.uid
                });
            
            // Update local cache
            this.data[dateKey] = data;
            
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            this.saveLocalData(dateKey, data);
        }
    }

    // Local Storage Fallback
    loadLocalData() {
        try {
            return JSON.parse(localStorage.getItem(this.dataFile)) || {};
        } catch {
            return {};
        }
    }

    saveLocalData(dateKey, data) {
        const localData = this.loadLocalData();
        localData[dateKey] = data;
        localStorage.setItem(this.dataFile, JSON.stringify(localData));
        this.data[dateKey] = data;
    }

    // App Initialization
    initApp() {
        this.updateDateDisplay();
        this.loadTodayData();
        this.attachEvents();
        this.renderStats();
        this.renderCharts();
        this.renderCalendar();
        this.updateUserUI();
    }

    updateUserUI() {
        const userSection = document.getElementById('userSection');
        if (this.currentUser) {
            userSection.innerHTML = `
                <div class="user-info">
                    <img src="${this.currentUser.photoURL}" alt="Profile" class="user-avatar">
                    <span>Hi, ${this.currentUser.displayName}</span>
                    <button onclick="tracker.signOut()" class="logout-btn">🚪 Logout</button>
                </div>
            `;
        }
    }

    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    updateDateDisplay() {
        const today = new Date();
        document.getElementById('currentDate').textContent = 
            today.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
    }

    loadTodayData() {
        const todayKey = this.getTodayKey();
        const todayData = this.data[todayKey];
        if (todayData) {
            ['polity', 'geography', 'history', 'economy', 'environment', 'currentAffairs', 'practice', 'revision']
                .forEach(key => {
                    const input = document.getElementById(key);
                    if (input) input.value = todayData[key] || 0;
                });
        }
    }

    attachEvents() {
        const form = document.getElementById('dailyForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTodayData();
            });
        }

        // Google Sign In Button
        const googleBtn = document.getElementById('googleSignIn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.googleSignIn());
        }
    }

    saveTodayData() {
        const todayKey = this.getTodayKey();
        const formData = {
            polity: parseFloat(document.getElementById('polity').value) || 0,
            geography: parseFloat(document.getElementById('geography').value) || 0,
            history: parseFloat(document.getElementById('history').value) || 0,
            economy: parseFloat(document.getElementById('economy').value) || 0,
            environment: parseFloat(document.getElementById('environment').value) || 0,
            currentAffairs: parseFloat(document.getElementById('currentAffairs').value) || 0,
            practice: parseFloat(document.getElementById('practice').value) || 0,
            revision: parseFloat(document.getElementById('revision').value) || 0
        };

        this.saveUserData(todayKey, formData);
        this.renderStats();
        this.renderCharts();
        this.renderCalendar();
        
        // Visual feedback
        const btn = document.querySelector('.save-btn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Saved to Cloud!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }

    getTotalHours(data) {
        return (data.polity || 0) + (data.geography || 0) + (data.history || 0) + 
               (data.economy || 0) + (data.environment || 0) + (data.currentAffairs || 0) + 
               (data.revision || 0);
    }

    calculateStreak() {
        const dates = Object.keys(this.data).sort().reverse();
        let streak = 0;
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];

        for (let i = 0; i < dates.length; i++) {
            const date = new Date(dates[i]);
            const diffTime = today - date;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak && this.getTotalHours(this.data[dates[i]]) > 0) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    renderStats() {
        const todayKey = this.getTodayKey();
        const todayData = this.data[todayKey];
        const totalHours = this.getTotalHours(todayData);
        const maxHours = 50;
        const completionPercent = Math.min((totalHours / maxHours) * 100, 100);
        const streak = this.calculateStreak();

        document.getElementById('totalHours').textContent = totalHours.toFixed(1) + 'h';
        document.getElementById('completionPercent').textContent = completionPercent.toFixed(0) + '%';
        document.getElementById('streak').textContent = streak + ' days';
    }

    getWeeklyData() {
        const today = new Date();
        const weekData = {};
        const subjects = ['polity', 'geography', 'history', 'economy', 'environment', 'currentAffairs'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const data = this.data[dateKey];
            const label = date.toLocaleDateString('en-IN', { weekday: 'short' });
            
            weekData[label] = {
                polity: data?.polity || 0,
                geography: data?.geography || 0,
                history: data?.history || 0,
                economy: data?.economy || 0,
                environment: data?.environment || 0,
                currentAffairs: data?.currentAffairs || 0
            };
        }
        return weekData;
    }

    renderCharts() {
        this.renderWeeklyChart();
        this.renderMonthlyChart();
        this.renderSubjectChart();
    }

    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart')?.getContext('2d');
        if (!ctx) return;
        
        const weekData = this.getWeeklyData();
        const labels = Object.keys(weekData);
        const datasets = [
            { label: 'Polity', data: labels.map(l => weekData[l].polity), borderColor: '#FF6384', fill: false },
            { label: 'Geography', data: labels.map(l => weekData[l].geography), borderColor: '#36A2EB', fill: false },
            { label: 'History', data: labels.map(l => weekData[l].history), borderColor: '#FFCE56', fill: false },
            { label: 'Economy', data: labels.map(l => weekData[l].economy), borderColor: '#4BC0C0', fill: false },
            { label: 'Environment', data: labels.map(l => weekData[l].environment), borderColor: '#9966FF', fill: false },
            { label: 'Current Affairs', data: labels.map(l => weekData[l].currentAffairs), borderColor: '#FF9F40', fill: false }
        ];

        if (this.charts.weekly) this.charts.weekly.destroy();
        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, max: 10 } }
            }
        });
    }

    renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart')?.getContext('2d');
        if (!ctx) return;
        
        const today = new Date();
        const monthData = {};
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const data = this.data[dateKey];
            const total = this.getTotalHours(data);
            monthData[date.toLocaleDateString('en-IN', { day: 'numeric' })] = total;
        }

        const labels = Object.keys(monthData);
        const data = Object.values(monthData);

        if (this.charts.monthly) this.charts.monthly.destroy();
        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Study Hours',
                    data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    renderSubjectChart() {
        const ctx = document.getElementById('subjectChart')?.getContext('2d');
        if (!ctx) return;
        
        const todayKey = this.getTodayKey();
        const todayData = this.data[todayKey];
        
        const labels = ['Polity', 'Geography', 'History', 'Economy', 'Environment', 'Current Affairs'];
        const data = [
            todayData?.polity || 0,
            todayData?.geography || 0,
            todayData?.history || 0,
            todayData?.economy || 0,
            todayData?.environment || 0,
            todayData?.currentAffairs || 0
        ];

        if (this.charts.subject) this.charts.subject.destroy();
        this.charts.subject = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                        '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    renderCalendar() {
        const calendar = document.getElementById('streakCalendar');
        if (!calendar) return;
        
        calendar.innerHTML = '';
        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();
        
        // Get first day of month
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day empty';
            calendar.appendChild(day);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dateData = this.data[dateKey];
            const totalHours = this.getTotalHours(dateData);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = `calendar-day ${totalHours > 0 ? 'studied' : 'empty'}`;
            dayDiv.textContent = day;
            dayDiv.title = totalHours > 0 ? `${totalHours.toFixed(1)}h studied` : 'No study';
            calendar.appendChild(dayDiv);
        }
    }
}

// Global tracker instance
const tracker = new UPSCTracker(); 

window.googleSignIn = function () {
  tracker.googleSignIn();
};
