class ReportsManager {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('studyData')) || [];
        this.init();
    }

    init() {
        this.renderStats();
        this.setupTabs();
        this.renderAllCharts();
    }

    renderStats() {
        const totalDays = this.data.length;
        const totalHours = this.data.reduce((sum, day) => sum + (day.hours || 0), 0);
        const avgDaily = totalDays ? (totalHours / totalDays).toFixed(1) : 0;
        const streak = this.calculateStreak();

        document.getElementById('totalDays').textContent = totalDays;
        document.getElementById('totalHours').textContent = Math.round(totalHours);
        document.getElementById('avgDaily').textContent = avgDaily;
        document.getElementById('streak').textContent = streak;
    }

    calculateStreak() {
        if (!this.data.length) return 0;
        let streak = 0;
        const sortedData = [...this.data].sort((a, b) => new Date(b.date) - new Date(a.date));
        for (let day of sortedData) {
            if (day.hours > 0) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const charts = document.querySelectorAll('.chart-container');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show target chart
                charts.forEach(chart => chart.classList.remove('active'));
                document.getElementById(`${target}-chart`).classList.add('active');
            });
        });
    }

    prepareDailyData() {
        const last30Days = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = this.data.find(d => d.date === dateStr);
            last30Days.push({
                date: dateStr,
                hours: dayData ? dayData.hours || 0 : 0,
                label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            });
        }
        return last30Days;
    }

    prepareWeeklyData() {
        const weeks = [];
        const today = new Date();
        const startDate = new Date(today.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        
        for (let i = 11; i >= 0; i--) {
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() + i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const weekHours = this.data
                .filter(day => {
                    const dayDate = new Date(day.date);
                    return dayDate >= weekStart && dayDate <= weekEnd;
                })
                .reduce((sum, day) => sum + (day.hours || 0), 0);
                
            weeks.push({
                week: `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
                hours: weekHours
            });
        }
        return weeks;
    }

    prepareMonthlyData() {
        const months = [];
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);
        
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(startDate);
            monthDate.setMonth(startDate.getMonth() + i);
            
            const monthHours = this.data
                .filter(day => {
                    const dayDate = new Date(day.date);
                    return dayDate.getFullYear() === monthDate.getFullYear() &&
                           dayDate.getMonth() === monthDate.getMonth();
                })
                .reduce((sum, day) => sum + (day.hours || 0), 0);
                
            months.push({
                month: monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                hours: monthHours
            });
        }
        return months;
    }

    prepareYearlyData() {
        const years = [];
        const today = new Date();
        const currentYear = today.getFullYear();
        
        for (let i = 3; i >= 0; i--) {
            const year = currentYear - i;
            const yearHours = this.data
                .filter(day => new Date(day.date).getFullYear() === year)
                .reduce((sum, day) => sum + (day.hours || 0), 0);
                
            years.push({
                year: year.toString(),
                hours: yearHours
            });
        }
        return years;
    }

    renderDailyChart() {
        const ctx = document.getElementById('dailyChart').getContext('2d');
        const data = this.prepareDailyData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    label: 'Study Hours',
                    data: data.map(d => d.hours),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Hours' }
                    }
                }
            }
        });
    }

    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        const data = this.prepareWeeklyData();
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.week.slice(0, 12) + '...'),
                datasets: [{
                    label: 'Weekly Hours',
                    data: data.map(d => d.hours),
                    backgroundColor: '#28a745',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const data = this.prepareMonthlyData();
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.month.slice(0, 10) + '...'),
                datasets: [{
                    data: data.map(d => d.hours),
                    backgroundColor: [
                        '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0',
                        '#9966ff', '#ff9f40', '#ff6384', '#c9cbcf',
                        '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    renderYearlyChart() {
        const ctx = document.getElementById('yearlyChart').getContext('2d');
        const data = this.prepareYearlyData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.year),
                datasets: [{
                    label: 'Yearly Hours',
                    data: data.map(d => d.hours),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    renderAllCharts() {
        this.renderDailyChart();
        this.renderWeeklyChart();
        this.renderMonthlyChart();
        this.renderYearlyChart();
    }
}

// Initialize Reports when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReportsManager();
});
