// UPSC 2026 Expected Dates (Tentative - Will be updated)
const UPSC_PRELIMS_2026 = new Date('2026-05-24T09:30:00+05:30').getTime();  // Expected
const UPSC_MAINS_2026 = new Date('2026-08-21T09:30:00+05:30').getTime();    // Expected
 
// Streak System
let streakCount = 0;
let lastStudyDate = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('UPSC Tracker Loaded! 🚀');
    loadStreakData();
    updateCountdowns();
    
    // Event Listeners
    document.getElementById('markToday').addEventListener('click', markToday);
    document.getElementById('resetStreak').addEventListener('click', resetStreak);
    
    // Update every second
    setInterval(updateCountdowns, 1000);
    
    console.log('Countdown started! ⏰');
});

// Streak Functions
function loadStreakData() {
    const savedStreak = localStorage.getItem('upscStreak');
    const savedDate = localStorage.getItem('lastStudyDate');
    
    if (savedStreak) streakCount = parseInt(savedStreak);
    if (savedDate) lastStudyDate = new Date(savedDate);
    
    checkStreak();
    updateStreakDisplay();
}

function saveStreakData() {
    localStorage.setItem('upscStreak', streakCount);
    localStorage.setItem('lastStudyDate', lastStudyDate.toISOString());
}

function checkStreak() {
    if (!lastStudyDate) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        document.getElementById('markToday').textContent = '✅ Today Done!';
        document.getElementById('markToday').disabled = true;
    } else if (diffDays > 1) {
        streakCount = 1;
    } else {
        streakCount++;
    }
}

function markToday() {
    lastStudyDate = new Date();
    streakCount++;
    document.getElementById('markToday').textContent = '✅ Today Done!';
    document.getElementById('markToday').disabled = true;
    updateStreakDisplay();
    saveStreakData();
    celebrate();
}

function resetStreak() {
    if (confirm('Reset streak? 💔')) {
        streakCount = 0;
        lastStudyDate = null;
        document.getElementById('markToday').textContent = '✅ Mark Today';
        document.getElementById('markToday').disabled = false;
        updateStreakDisplay();
        saveStreakData();
    }
}

function updateStreakDisplay() {
    document.getElementById('streakCount').textContent = streakCount;
    document.getElementById('lastStudyDate').textContent = 
        lastStudyDate ? lastStudyDate.toLocaleDateString('en-IN') : 'Never';
}

// Countdown Function
function updateCountdowns() {
    const now = new Date().getTime();
    
    // Prelims
    updateSingleCountdown('prelims', UPSC_PRELIMS_2026, now, 'PRELIMS 2026');
    
    // Mains
    updateSingleCountdown('mains', UPSC_MAINS_2026, now, 'MAINS 2026');
}

function updateSingleCountdown(prefix, targetTime, now, examName) {
    const distance = targetTime - now;
    
    const container = document.getElementById(prefix + 'Countdown');
    const status = document.getElementById(prefix + 'Status');
    
    if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById(prefix + 'Days').textContent = days.toString().padStart(2, '0');
        document.getElementById(prefix + 'Hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById(prefix + 'Minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById(prefix + 'Seconds').textContent = seconds.toString().padStart(2, '0');
        
        status.textContent = `📚 ${examName}`;
    } else {
        container.innerHTML = `<span style="color: #ff4757; font-size: 1.3em;">🎉 ${examName} DONE!</span>`;
    }
}

// Celebration
function celebrate() {
    const streakEl = document.getElementById('streakCount');
    streakEl.style.transform = 'scale(1.3) rotate(10deg)';
    setTimeout(() => {
        streakEl.style.transform = 'scale(1) rotate(0deg)';
    }, 300);
}
