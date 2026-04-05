import { createClient } from 'https://cdn.skypack.dev/supabase@2';

// 🔥 APNA SUPABASE CONFIG YAHAN DALO 🔥
const SUPABASE_URL = 'https://gpcbkguyrkluazkznybf.supabase.co'; // db.js se copy
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2JrZ3V5cmtsdWF6a3pueWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzMwMTIsImV4cCI6MjA5MDY0OTAxMn0.NqG6ggDw2xV2mHv1B0HB78c6Td-xMgOCtGTNnpgMatw'; // db.js se copy

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class ReportsApp {
    constructor() {
        this.currentPeriod = 'daily';
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelector('.tab.active').classList.remove('active');
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.loadData();
            });
        });
    }

    async loadData() {
        try {
            document.getElementById('loading').textContent = '📊 Fetching your study data...';

            const { data, error } = await supabase
                .from('entries')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw new Error(`Database error: ${error.message}`);

            if (!data || data.length === 0) {
                this.showNoData();
                return;
            }

            const processed = this.processData(data);
            this.updateStats(processed.stats);
            this.updateCharts(processed.charts);

        } catch (error) {
            console.error('Error:', error);
            document.getElementById('loading').innerHTML = `
                <div style="color: #ef4444;">
                    ❌ Failed to load data<br>
                    <small>Open F12 Console for details</small>
                </div>
            `;
        }
    }

    processData(rawData) {
        const now = new Date();
        const stats = { totalHours: 0, avgDaily: 0, bestSubject: '', consistency: 0 };
        const trendData = { labels: [], data: [] };
        const subjectData = {};

        // Filter by period
        const filtered = rawData.filter(session => {
            const sessionDate = new Date(session.date);
            const diffDays = (now - sessionDate) / (1000 * 60 * 60 * 24);
            
            const limits = {
                daily: 1,
                weekly: 7,
                monthly: 30,
                yearly: 365
            };
            
            return diffDays <= limits[this.currentPeriod];
        });

        filtered.forEach(session => {
            const hours = parseFloat(session.hours) || 0;
            stats.totalHours += hours;

            // Subject breakdown
            const subject = session.subject || 'Other';
            subjectData[subject] = (subjectData[subject] || 0) + hours;

            // Trend data
            const dateStr = session.date.split('T')[0];
            const index = trendData.labels.indexOf(dateStr);
            if (index === -1) {
                trendData.labels.push(dateStr);
                trendData.data.push(hours);
            } else {
                trendData.data[index] += hours;
            }
        });

        // Sort trend data
        const sortedTrend = trendData.labels
            .map((label, idx) => ({ label, hours: trendData.data[idx] }))
            .sort((a, b) => new Date(a.label) - new Date(b.label))
            .slice(-10); // Last 10 days

        trendData.labels = sortedTrend.map(d => d.label);
        trendData.data = sortedTrend.map(d => d.hours);

        // Calculate stats
        stats.avgDaily = filtered.length ? (stats.totalHours / filtered.length).toFixed(1) : 0;
        stats.bestSubject = Object.entries(subjectData)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';
        stats.consistency = Math.min(100, (filtered.length / 7) * 100).toFixed(0);

        return {
            stats,
            charts: {
                trend: trendData,
                subjects: subjectData
            }
        };
    }

    updateStats(stats) {
        document.getElementById('total-hours').textContent = stats.totalHours.toFixed(1) + 'h';
        document.getElementById('avg-hours').textContent = stats.avgDaily + 'h';
        document.getElementById('best-subject').textContent = stats.bestSubject;
        document.getElementById('consistency').textContent = stats.consistency + '%';

        document.getElementById('stats').style.display = 'grid';
        document.getElementById('charts').style.display = 'grid';
        document.getElementById('loading').style.display = 'none';
    }

    updateCharts(chartsData) {
        // Destroy old charts
        Object.values(this.charts).forEach(chart => chart.destroy());

        // Trend Chart
        this.charts.trend = new Chart(
            document.getElementById('trend-chart'),
            {
                type: 'line',
                data: {
                    labels: chartsData.trend.labels,
                    datasets: [{
                        label: 'Hours',
                        data: chartsData.trend.data,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            }
        );

        // Subject Chart
        this.charts.subject = new Chart(
            document.getElementById('subject-chart'),
            {
                type: 'doughnut',
                data: {
                    labels: Object.keys(chartsData.subjects),
                    datasets: [{
                        data: Object.values(chartsData.subjects),
                        backgroundColor: [
                            '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                            '#8b5cf6', '#06b6d4', '#f97316'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            }
        );
    }

    showNoData() {
        document.getElementById('loading').innerHTML = `
            <div style="color: #64748b; font-size: 1.5rem;">
                📊 No study data found
                <br><br>
                <small>Add study sessions from Dashboard first!</small>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ReportsApp();
}); 
