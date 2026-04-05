// Direct Supabase client import (path fixed)
import { createClient } from 'https://cdn.skypack.dev/supabase@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase/db.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class ReportsManager {
    constructor() {
        this.currentPeriod = 'daily';
        this.trendChart = null;
        this.subjectChart = null;
        this.init();
    }

    async init() {
        console.log('Reports initializing...');
        this.setupEventListeners();
        await this.loadReports();
    }

    setupEventListeners() {
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
            console.log('Loading reports for period:', this.currentPeriod);
            
            const { data: studyData, error } = await supabase
                .from('study_sessions')
                .select('id, hours, subject, date, created_at')
                .order('date', { ascending: false })
                .limit(1000); // Safety limit

            if (error) {
                console.error('Supabase Error:', error);
                this.showError('Database connection failed. Check console.');
                return;
            }

            console.log('Study data loaded:', studyData?.length || 0, 'records');

            if (!studyData || studyData.length === 0) {
                this.showEmptyState();
                return;
            }

            const processedData = this.processData(studyData);
            this.updateStats(processedData.stats);
            this.updateCharts(processedData.charts);
            
        } catch (error) {
            console.error('Reports Error:', error);
            this.showError('Failed to load reports. Please refresh.');
        }
    }

    processData(studyData) {
        const now = new Date();
        const stats = { totalHours: 0, avgDaily: 0, bestSubject: '', consistency: 0 };
        const trendData = { labels: [], data: [] };
        const subjectData = {};

        // Filter by time period
        const filteredData = studyData.filter(session => {
            const sessionDate = new Date(session.date || session.created_at);
            const diffTime = Math.abs(now - sessionDate);
            
            const dayMs = 24 * 60 * 60 * 1000;
            switch (this.currentPeriod) {
                case 'daily': return diffTime < dayMs;
                case 'weekly': return diffTime < 7 * dayMs;
                case 'monthly': return diffTime < 30 * dayMs;
                case 'yearly': return diffTime < 365 * dayMs;
                default: return true;
            }
        });

        console.log(`Filtered ${filteredData.length} records for ${this.currentPeriod}`);

        filteredData.forEach(session => {
            const hours = parseFloat(session.hours) || 0;
            stats.totalHours += hours;

            // Subject data
            const subject = session.subject || 'Others';
            subjectData[subject] = (subjectData[subject] || 0) + hours;

            // Daily trend
            const dateKey = new Date(session.date || session.created_at).toISOString().split('T')[0];
            const index = trendData.labels.indexOf(dateKey);
            if (index === -1) {
                trendData.labels.push(dateKey);
                trendData.data.push(hours);
            } else {
                trendData.data[index] += hours;
            }
        });

        // Sort trend data by date
        const sortedTrend = trendData.labels
            .map((label, i) => ({ label, value: trendData.data[i] }))
            .sort((a, b) => new Date(a.label) - new Date(b.label));
        
        trendData.labels = sortedTrend.map(d => d.label);
        trendData.data = sortedTrend.map(d => d.value);

        // Calculate stats
        stats.avgDaily = filteredData.length > 0 ? (stats.totalHours / filteredData.length).toFixed(1) : 0;
        stats.bestSubject = Object.entries(subjectData).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0] || '-';
        stats.consistency = Math.min(100, (filteredData.length / 7 * 100)).toFixed(0);

        return { stats, charts: { trend: trendData, subjects: subjectData } };
    }

    updateStats(stats) {
        document.getElementById('totalHours').textContent = stats.totalHours.toFixed(1) + 'h';
        document.getElementById('avgDaily').textContent = stats.avgDaily + 'h';
        document.getElementById('bestSubject').textContent = stats.bestSubject;
        document.getElementById('consistency').textContent = stats.consistency + '%';
    }

    updateCharts(chartData) {
        // Destroy existing charts
        if (this.trendChart) this.trendChart.destroy();
        if (this.subjectChart) this.subjectChart.destroy();

        // Trend Chart
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        this.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: chartData.trend.labels.slice(-10), // Last 10 days
                datasets: [{
                    label: 'Study Hours',
                    data: chartData.trend.data.slice(-10),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { callback: v => v + 'h' }
                    }
                }
            }
        });

        // Subject Chart
        const subjectCtx = document.getElementById('subjectChart').getContext('2d');
        this.subjectChart = new Chart(subjectCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(chartData.subjects),
                datasets: [{
                    data: Object.values(chartData.subjects),
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                        '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(1)}h`
                        }
                    }
                }
            }
        });
    }

    showError(message) {
        const chartsContainer = document.querySelector('.charts-container');
        chartsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ef4444;">
                <h3>⚠️ ${message}</h3>
                <p>Open browser console (F12) for details</p>
            </div>
        `;
    }

    showEmptyState() {
        const chartsContainer = document.querySelector('.charts-container');
        chartsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">
                <h3>📊 No study data found</h3>
                <p>Add some study sessions to see reports!</p>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting reports...');
    new ReportsManager();
}); 
