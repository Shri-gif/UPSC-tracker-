class PreparationTracker {
    constructor() {
        this.db = new Database();
        this.currentTab = 'add';
        this.currentPeriod = 'week';
        this.chart = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRecords();
        this.updateStats();
        this.renderChart();
    }

    bindEvents() {
        // Form submission
        document.getElementById('prepForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.switchTab(targetTab);
            });
        });

        // Period selector
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setPeriod(e.target.dataset.period);
            });
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

        this.currentTab = tabName;

        if (tabName === 'view') {
            this.loadRecords();
            this.updateStats();
        } else if (tabName === 'stats') {
            this.updatePeriodStats();
            this.renderChart();
        }
    }

    async addRecord() {
        const record = {
            id: Date.now().toString(),
            subject: document.getElementById('subject').value,
            hours: parseFloat(document.getElementById('hours').value),
            description: document.getElementById('description').value,
            difficulty: document.getElementById('difficulty').value,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        await this.db.addRecord(record);
        this.resetForm();
        this.showNotification('✅ Record added successfully!');
        
        if (this.currentTab === 'view') {
            this.loadRecords();
            this.updateStats();
        }
    }

    resetForm() {
        document.getElementById('prepForm').reset();
    }

    async loadRecords() {
        const records = await this.db.getRecords();
        this.renderRecords(records);
        this.updateStats(records);
    }

    renderRecords(records) {
        const container = document.getElementById('recordsList');
        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">No records yet. Add your first study session! 📚</p>';
            return;
        }

        container.innerHTML = records.map(record => `
            <div class="record-item">
                <div class="record-date">${this.formatDate(record.date)}</div>
                <div class="record-title">${record.subject}</div>
                <div class="record-desc">
                    ⏱️ ${record.hours} hrs | 
                    ${this.getDifficultyEmoji(record.difficulty)} 
                    ${record.description || 'No description'}
                </div>
            </div>
        `).join('');
    }

    updateStats(records = null) {
        if (!records) records = this.db.getRecordsSync();
        
        document.getElementById('totalRecords').textContent = records.length;
        document.getElementById('totalHours').textContent = records.reduce((sum, r) => sum + r.hours, 0).toFixed(1);
        
        const days = (Date.now() - records[0]?.timestamp) / (1000 * 60 * 60 * 24) || 1;
        document.getElementById('avgHours').textContent = (records.reduce((sum, r) => sum + r.hours, 0) / days).toFixed(1);
    }

    setPeriod(period) {
        this.currentPeriod = period;
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.updatePeriodStats();
        this.renderChart();
    }

    async updatePeriodStats() {
        const records = await this.db.getRecords();
        const filteredRecords = this.filterRecordsByPeriod(records, this.currentPeriod);
        
        const totalHours = filteredRecords.reduce((sum, r) => sum + r.hours, 0);
        const days = this.getPeriodDays(this.currentPeriod);
        const avgHours = totalHours / days;

        document.getElementById('periodTotalHours').textContent = totalHours.toFixed(1);
        document.getElementById('periodRecords').textContent = filteredRecords.length;
        document.getElementById('periodAvgHours').textContent = avgHours.toFixed(1);
        
        const labels = ['Total Hours', 'Avg Daily', 'Records'];
        document.getElementById('periodLabel').textContent = 
            this.currentPeriod === 'week' ? 'This Week' :
            this.currentPeriod === 'month' ? 'This Month' :
            this.currentPeriod === 'year' ? 'This Year' : 'All Time';
    }

    filterRecordsByPeriod(records, period) {
        const now = new Date();
        const cutoff = this.getPeriodCutoff(now, period);
        
        return records.filter(record => new Date(record.date) >= cutoff);
    }

    getPeriodCutoff(now, period) {
        const cutoff = new Date(now);
        switch(period) {
            case 'week':
                cutoff.setDate(now.getDate() - now.getDay() - 7);
                break;
            case 'month':
                cutoff.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                cutoff.setFullYear(now.getFullYear() - 1);
                break;
            case 'all':
            default:
                return new Date(0);
        }
        return cutoff;
    }

    getPeriodDays(period) {
        const now = new Date();
        const cutoff = this.getPeriodCutoff(now, period);
        return (now - cutoff) / (1000 * 60 * 60 * 24);
    }

    renderChart() {
        const ctx = document.getElementById('prepChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const records = this.db.getRecordsSync();
        const dataByDay = this.aggregateDataByDay(records, this.currentPeriod);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(dataByDay),
                datasets: [{
                    label: 'Study Hours',
                    data: Object.values(dataByDay),
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#4facfe',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'h';
                            }
                        }
                    }
                }
            }
        });
    }

    aggregateDataByDay(records, period) {
        const data = {};
        const cutoff = this.getPeriodCutoff(new Date(), period);
        
        records
            .filter(r => new Date(r.date) >= cutoff)
            .forEach(record => {
                const date = this.formatDateShort(record.date);
                data[date] = (data[date] || 0) + record.hours;
            });

        return data;
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateShort(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
        });
