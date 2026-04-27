// UPSC Exam Dates
const UPSC_PRELIMS_2026 = new Date('2026-05-25T09:30:00').getTime();  // Prelims
const UPSC_MAINS_2026 = new Date('2026-08-22T09:30:00').getTime();    // Mains (Tentative)

// Streak System
let streakCount = 0;
let lastStudyDate = null;

// Load data from localStorage
function loadStreakData() {
    const savedStreak = localStorage.getItem('upscStreak');
    const savedDate = localStorage.getItem('lastStudyDate');
    
    if (savedStreak && savedDate) {
        streakCount = parseInt(savedStreak);
        lastStudyDate = new Date(savedDate);
        updateStreakDisplay();
        checkStreak();
    }
}

// Save streak data
function saveStreakData() {
    localStorage.setItem('upscStreak', streakCount.toString());
    localStorage.setItem('lastStudyDate', lastStudyDate.toISOString());
}

// Check if streak continues
function checkStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!lastStudyDate) return;
    
    const lastDate = new Date(lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - lastDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        document.getElementById('markToday').textContent = '✅ Marked Today!';
        document.getElementById('markToday').disabled = true;
    } else if (diffDays === 1) {
        streakCount++;
    } else {
        streakCount = 1;
    }
    
    updateStreakDisplay();
    saveStreakData();
}

// Mark today as studied
function markToday() {
    const today = new Date();
    lastStudyDate = today;
    streakCount++;
    
    document.getElementById('markToday').textContent = '✅ Marked Today!';
    document.getElementById('markToday').disabled = true;
    
    updateStreakDisplay();
    saveStreakData();
    celebrate();
}

// Reset streak
function resetStreak() {
    if (confirm('Reset your streak? 😢')) {
        streakCount = 0;
        lastStudyDate = null;
        document.getElementById('markToday').textContent = '✅ Mark Today';
        document.getElementById('markToday').disabled = false;
        updateStreakDisplay();
        saveStreakData();
    }
}

// Update streak display
function updateStreakDisplay() {
    document.getElementById('streakCount').textContent = streakCount;
    const lastDate = lastStudyDate ? lastStudyDate.toLocaleDateString('en-IN') : '-';
    document.getElementById('lastStudyDate').textContent = `Last: ${lastDate}`;
}

// Dual Countdown Function
function updateCountdowns() {
    const now = new Date().getTime();
    
    // Prelims Countdown
    const prelimsDistance = UPSC_PRELIMS_2025 - now;
    const prelimsDays = Math.floor(prelimsDistance / (1000 * 60 * 60 * 24));
    const prelimsHours = Math.floor((prelimsDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const prelimsMinutes = Math.floor((prelimsDistance % (1000 * 60 * 60)) / (1000 * 60));
    const prelimsSeconds = Math.floor((prelimsDistance % (1000 * 60)) / 1000);
    
    // Mains Countdown
    const mainsDistance = UPSC_MAINS_2025 - now;
    const mainsDays = Math.floor(mainsDistance / (1000 * 60 * 60 * 24));
    const mainsHours = Math.floor((mainsDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mainsMinutes = Math.floor((mainsDistance % (1000 * 60 * 60)) / (1000 * 60));
    const mainsSeconds = Math.floor((mainsDistance % (1000 * 60)) / 1000);
    
    // Update Prelims Display
    if (prelimsDistance > 0) {
        document.getElementById('prelimsDays').textContent = prelimsDays.toString().padStart(2, '0');
        document.getElementById('prelimsHours').textContent = prelimsHours.toString().padStart(2, '0');
        document.getElementById('prelimsMinutes').textContent = prelimsMinutes.toString().padStart(2, '0');
        document.getElementById('prelimsSeconds').textContent = prelimsSeconds.toString().padStart(2, '0');
        document.getElementById('prelimsStatus').textContent = '📚 PRELIMS';
    } else {
        document.getElementById('prelimsCountdown').innerHTML = '<span style="color: #ff6b6b; font-size: 1.2em;">🎉 PRELIMS DONE!</span>';
    }
    
    // Update Mains Display
    if (mainsDistance > 0) {
        document.getElementById('mainsDays').textContent = mainsDays.toString().padStart(2, '0');
        document.getElementById('mainsHours').textContent = mainsHours.toString().padStart(2, '0');
        document.getElementById('mainsMinutes').textContent = mainsMinutes.toString().padStart(2, '0');
        document.getElementById('mainsSeconds').textContent = mainsSeconds.toString().padStart(2, '0');
        document.getElementById('mainsStatus').textContent = '📖 MAINS';
    } else {
        document.getElementById('mainsCountdown').innerHTML = '<span style="color: #ff6b6b; font-size: 1.2em;">🎉 MAINS DONE!</span>';
    }
}

// Celebration animation
function celebrate() {
    const streakNum = document.getElementById('streakCount');
    streakNum.style.transform = 'scale(1.2)';
    streakNum.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        streakNum.style.transform = 'scale(1)';
    }, 300);
    
    createConfetti();
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            left: ${Math.random() * 100}vw;
            top: -10px;
            width: 10px;
            height: 10px;
            background: hsl(${Math.random() * 360}, 70%, 60%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: fall 3s linear forwards;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    loadStreakData();
    updateCountdowns();
    
    // Event listeners
    document.getElementById('markToday').addEventListener('click', markToday);
    document.getElementById('resetStreak').addEventListener('click', resetStreak);
    
    // Update countdown every second
    setInterval(updateCountdowns, 1000);
});
