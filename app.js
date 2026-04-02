// Global variables
let records = [];
let weeklyChart, monthlyChart, yearlyChart;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadRecords();
    setTodayDate();
    updateDashboard();
    updateCharts();
});

// Set today's date by default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Add new record
function addRecord() {
    const date = document.getElementById('date').value;
    const hours = parseFloat(document.getElementById('hours').value);
    const subject = document.getElementById('subject').value;

    if (!date || !hours || !subject || hours < 0) {
        alert('Please fill all fields correctly!');
        return;
    }

    const record = {
        id: Date.now(),
        date: date,
        hours: hours,
        subject: subject
    };

    records.unshift(record);
    saveRecords();
    clearForm();
    updateDashboard();
    updateCharts();
    renderRecords();
}

// Clear form
function clearForm() {
    document.getElementById('hours').value = '';
    document.getElementById('subject').value = '';
    setTodayDate();
}

// Delete record
function deleteRecord(id) {
    records = records.filter(record => record.id !== id);
    saveRecords();
    updateDashboard();
    updateCharts();
    renderRecords();
}

// Update dashboard stats
function updateDashboard() {
    const totalHours = records.reduce((sum, record) => sum + record.hours, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayHours = records
        .filter(record => record.date === today)
        .reduce((sum, record) => sum + record.hours, 0);
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekHours = records
        .filter(record => record.date >= weekStartStr)
        .reduce((sum, record) => sum + record.hours, 0);
    
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthHours = records
        .filter(record => record.date >= monthStartStr)
        .reduce((sum, record) => sum + record.hours, 0);

    document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    document.getElementById('todayHours').textContent = todayHours.toFixed(1);
    document.getElementById('weekHours').textContent = weekHours.toFixed(1);
    document.getElementById('monthHours').textContent = monthHours.toFixed(1);
}

// Update all charts
function updateCharts() {
    updateWeeklyChart();
    updateMonthlyChart();
    updateYearlyChart();
}

// Weekly Chart (Last 7 days)
function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const today = new Date();
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
        
        const dateStr = date.toISOString().split('T')[0];
        const hours = records
            .filter(record => record.date === dateStr)
            .reduce((sum, record) => sum + record.hours, 0);
        data.push(hours);
    }

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours',
                data: data,
                backgroundColor: 'rgba(79, 172, 254, 0.8)',
                borderColor: 'rgba(79, 172, 254, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Monthly Chart (Last 30 days)
function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const today = new Date();
    const labels = [];
    const data = [];

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.getDate().toString());
        
        const dateStr = date.toISOString().split('T')[0];
        const hours = records
            .filter(record => record.date === dateStr)
            .reduce((sum, record) => sum + record.hours, 0);
        data.push(hours);
    }

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours',
                data: data,
                borderColor: 'rgba(255, 107, 107, 1)',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Yearly Chart (By months)
function updateYearlyChart() {
    const ctx = document.getElementById('yearlyChart').getContext('2d');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((_, index) => {
        const monthStart = new Date(new Date().getFullYear(), index, 1);
        const monthEnd = new Date(new Date().getFullYear(), index + 1, 0);
        const startStr = monthStart.toISOString().split('T')[0];
        const endStr = monthEnd.toISOString().split('T')[0];
        
        return records
            .filter(record => record.date >= startStr && record.date <= endStr)
            .reduce((sum, record) => sum + record.hours, 0);
    });

    if (yearlyChart) {
        yearlyChart.destroy();
    }

    yearlyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: months,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                    '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Render records list
function renderRecords() {
    const container = document.getElementById('recordsList');
    if (records.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No records yet. Add your first study session! 🎯</p>';
        return;
    }

    container.innerHTML = records.slice(0, 10).map(record => `
        <div class="record-item">
            <div>
                <strong>${new Date(record.date).toLocaleDateString('en-IN')} - ${record.subject}</strong><br>
                <span style="color: #666;">${record.hours} hours</span>
            </div>
            <button class="delete-btn" onclick="deleteRecord(${record.id})">Delete</button>
        </div>
    `).join('');
}

// Local Storage functions
function saveRecords() {
    localStorage.setItem('prepRecords', JSON.stringify(records));
}

function loadRecords() {
    const saved = localStorage.getItem('prepRecords');
    if (saved) {
        records = JSON.parse(saved);
    }
}
