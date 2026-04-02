class UPSCTracker {
    constructor() {
        this.dataFile = 'data.json';
        this.data = this.loadData();
        this.charts = {};
        this.init();
    }

    init() {
        this.updateDateDisplay();
        this.loadTodayData();
        this.attachEvents();
        this.renderStats();
        this.renderCharts();
        this.renderCalendar();
    }

    loadData() {
        try {
            return JSON.parse(localStorage.getItem(this.dataFile)) || {};
        } catch {
            return {};
        }
    }

    saveData() {
        localStorage.setItem(this.dataFile, JSON.stringify(this.data));
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
            Object.keys(todayData).forEach(key => {
                const input = document.getElementById(key);
                if (input) input.value = todayData[key];
            });
        }
    }

    attachEvents() {
        document.getElementById('dailyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTodayData();
        });
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

        this.data[todayKey] = formData;
        this.saveData();
        
        this.renderStats();
        this.renderCharts();
        this.renderCalendar();
        
        // Visual feedback
        const btn = document.querySelector('.save-btn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Saved!';
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
        const maxHours = 50; // Target 10 hours per subject max
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
        const ctx = document.getElementById('weeklyChart').getContext('2d');
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
        const ctx = document.getElementById('monthlyChart').getContext('2d');
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
        const ctx = document.getElementById('subjectChart').getContext('2d');
        const todayKey = this.getTodayKey();
        const todayData = this.data[today] 
    } 
    console.log('App connected to Supabase!'); 
