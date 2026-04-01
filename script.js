// Firebase v9+ Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, orderBy, query, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBZYzLJ3Ba0UTWWX25ApTFMxdrp7TxNhV4",
    authDomain: "upsc-tracker-f4f30.firebaseapp.com",
    projectId: "upsc-tracker-f4f30",
    storageBucket: "upsc-tracker-f4f30.firebasestorage.app",
    messagingSenderId: "984156387207",
    appId: "1:984156387207:web:480541277bb02f0fc1c522",
    measurementId: "G-V5GZT9P8XT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UPSC Tracker Class with Firebase v9+ Integration
class UPSCTracker {
    constructor() {
        this.dataFile = 'local_data.json';
        this.userDataPath = null;
        this.data = {};
        this.currentUser = null;
        this.charts = {};
        this.initFirebaseAuth();
    }

    // Firebase Authentication (v9+)
    initFirebaseAuth() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                this.userDataPath = `users/${user.uid}`;
                await this.loadUserData();
                this.showMainApp();
            } else {
                this.currentUser = null;
                this.userDataPath = null;
                this.showLogin();
            }
        });
    }

    async googleSignIn() {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.setCustomParameters({ 'prompt': 'select_account' });
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Google Sign In Error:', error);
            alert('Login failed: ' + error.message);
        }
    }

    async signOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign Out Error:', error);
        }
    }

    // Firestore Data Methods (v9+)
    async loadUserData() {
        if (!this.currentUser) return;

        try {
            const q = query(
                collection(db, `${this.userDataPath}/upsc_data`),
                orderBy('date', 'desc'),
                limit(365)
            );
            
            const snapshot = await getDocs(q);
            this.data = {};
            
            snapshot.forEach((docSnap) => {
                this.data[docSnap.id] = docSnap.data();
            });
            
            // Merge with local fallback
            const localData = this.loadLocalData();
            Object.assign(this.data, localData);
            
            this.initApp();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.initApp();
        }
    }

    async saveUserData(dateKey, data) {
        if (!this.currentUser) {
            this.saveLocalData(dateKey, data);
            return;
        }

        try {
            await setDoc(doc(db, `${this.userDataPath}/upsc_data`, dateKey), {
                ...data,
                date: dateKey,
                updatedAt: serverTimestamp(),
                uid: this.currentUser.uid
            });
            
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

    // UI Methods
    showLogin() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this.updateUserUI();
    }

    updateUserUI() {
        const userSection = document.getElementById('userSection');
        if (this.currentUser && userSection) {
            userSection.innerHTML = `
                <div class="user-info">
                    <img src="${this.currentUser.photoURL}" alt="Profile" class="user-avatar">
                    <span>Hi, ${this.currentUser.displayName}</span>
                    <button class="logout-btn" onclick="tracker.signOut()">🚪 Logout</button>
                </div>
            `;
        }
    }

    // Core App Methods
    initApp() {
        this.updateDateDisplay();
        this.loadTodayData();
        this.attachEvents();
        this.renderStats();
        this.renderCharts();
        this.renderCalendar();
    }

    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    updateDateDisplay() {
        const today = new Date();
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = today.toLocaleDateString('en-IN', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
        }
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

        const googleBtn = document.getElementById('googleSignIn');
        if (googleBtn) {
            googleBtn.onclick = () => this.googleSignIn();
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
        
        // Success feedback
        const btn = document.querySelector('.save-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = this.currentUser ? '✅ Saved to Cloud!' : '✅ Saved Locally!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }
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

        const totalEl = document.getElementById('totalHours');
        const percentEl = document.getElementById('completionPercent');
        const streakEl = document.getElementById('streak');
        
        if (totalEl) totalEl.textContent = totalHours.toFixed(1) + 'h';
        if (percentEl) percentEl.textContent = completionPercent.toFixed(0) + '%';
        if (streakEl) streakEl.textContent = streak + ' days';
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
            
            weekData[label] = subjects.reduce((acc, subject) => {
                acc[subject] = data?.[subject] || 0;
                return acc;
            }, {});
        }
        return weekData;
    }

    renderCharts() {
        this.renderWeeklyChart();
        this.renderMonthlyChart();
        this.renderSubjectChart();
    }

    renderWeeklyChart() {
        const canvas = document.getElementById('weeklyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
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
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 10 } } }
        });
    }

    renderMonthlyChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const today = new Date();
        const monthData = {};
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const data = this.data[dateKey];
            monthData[date.toLocaleDateString('en-IN', { day: 'numeric' })] = this.getTotalHours(data);
        }

        if (this.charts.monthly) this.charts.monthly.destroy();
        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(monthData),
                datasets: [{
                    label: 'Study Hours',
                    data: Object.values(monthData),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    renderSubjectChart() {
        const canvas = document.getElementById('subjectChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const todayKey = this.getTodayKey();
        const todayData = this.data[todayKey];
        
        const labels = ['Polity', 'Geography', 'History', 'Economy', 'Environment', 'Current Affairs'];
        const data = [
            todayData?.polity || 0, todayData?.geography || 0, todayData?.history || 0,
            todayData?.economy || 0, todayData?.environment || 0, todayData?.currentAffairs || 0
        ];

        if (this.charts.subject) this.charts.subject.destroy();
        this.charts.subject = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                }]
            },
            options: { responsive: true }
        });
    }

    renderCalendar() {
        const calendar = document.getElementById('streakCalendar');
        if (!calendar) return;
        
        calendar.innerHTML = '';
        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Previous month empty cells
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

// Initialize tracker globally
const tracker = new UPSCTracker();

// Expose tracker globally for HTML onclick events
window.tracker = tracker;
