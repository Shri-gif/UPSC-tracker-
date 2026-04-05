import { supabase } from '../supabase/db.js';

class ReportsManager {
    constructor() {
        this.currentPeriod = 'daily';
        this.trendChart = null;
        this.subjectChart = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadReports();
    }

    setupEventListeners() {
        // Period selector
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.period-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.loadReports();
            });
        });
    }

    async loadReports() {
        try {
            const { data: studyData, error } = await supabase
                .from('study_sessions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            const processedData = this.processData(studyData);
            this.updateStats(processedData.stats);
            this.updateCharts(processedData.charts);
        } catch (error) {
            console.error('Error loading reports:', error);
            alert('Error loading reports. Please try again.');
        }
    }

    processData(studyData) {
        const now = new Date();
        const stats = { totalHours: 0, avgDaily: 0, bestSubject: '', consistency: 0 };
        const trendData = { labels: [], data: [] };
        const subjectData = {};

        // Filter data based on period
        const filteredData = studyData.filter(session => {
            const sessionDate = new Date(session.date);
            const diffTime = now - sessionDate;
            
            switch (this.currentPeriod) {
                case 'daily': return diffTime < 24 * 60 * 60 * 1000;
                case 'weekly': return diffTime < 7 * 24 * 60 * 60 * 1000;
                case 'monthly': return diffTime < 30 * 24 * 60 * 60 * 1000;
                case 'yearly': return diffTime < 365 * 24 * 60 * 60 * 1000;
                default: return true;
            }
        });

        // Calculate stats
        filteredData.forEach(session => {
            const hours = parseFloat(session.hours);
            stats.totalHours += hours;

            // Subject wise
            subjectData[session.subject] = (subjectData[session.subject] || 0) + hours;

            // Trend data (daily aggregation)
            const dateKey = session.date.split('T')[0];
            if (!trendData.labels.includes(dateKey)) {
                trendData.labels.push(dateKey);
                trendData.data.push(0);
            }
            const index = trendData.labels.indexOf(dateKey);
            trendData.data[index] += hours;
        });

        // Calculate averages and best subject
        stats.avgDaily = filteredData.length > 0 ? (stats.totalHours / filteredData.length).toFixed(1) : 0;
        stats.bestSubject = Object.entries(subjectData).reduce((a, b) => a[1] > b[1] ? a : b)[0] || '-';
        stats.consistency = filteredData.length > 0 ? ((filteredData.length / 7) * 100).toFixed(0) : 0;

        return {
            stats,
            charts: {
                trend: trendData,
                subjects: subjectData
            }
        };
    }

    updateStats(stats) {
        document.getElementById('totalHours').textContent = stats.totalHours.toFixed(1) + 'h';
        document.getElementById('avgDaily').textContent = stats.avgDaily + 'h';
        document.getElementById('bestSubject').textContent = stats.bestSubject;
        document.getElementById('consistency').textContent = stats.consistency + '%';
    }

    updateCharts(chartData) {
        // Trend Chart
        if (this.trendChart) this.trendChart.destroy();
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        this.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: chartData.trend.labels,
                datasets: [{
                    label: 'Study Hours',
                    data: chartData.trend.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Subject Chart
        if (this.subjectChart) this.subjectChart.destroy();
        const subjectCtx = document.getElementById('subjectChart').getContext('2d');
        this.subjectChart = new Chart(subjectCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(chartData.subjects),
                datasets: [{
                    data: Object.values(chartData.subjects),
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                        '#8b5cf6', '#06b6d4', '#f97316'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReportsManager();
}); 
