// UPSC Prelims 2025 Date
const UPSC_PRELIMS_2025 = new Date('2025-05-25T09:30:00').getTime();

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

// Check if streak continues (same day or yesterday)
function checkStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!lastStudyDate) return;
    
    const lastDate = new Date(lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - lastDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        // Same day - already marked
        document.getElementById('markToday').textContent = '✅ Marked Today!';
        document.getElementById('markToday').disabled = true;
    } else if (diffDays === 1) {
        // Yesterday - continue streak
        streakCount++;
    } else {
        // More than 1 day gap - reset streak
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
    
    // Celebration animation
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

// Update display
function updateStreakDisplay() {
    document.getElementById('streakCount').textContent = streakCount;
    const lastDate = lastStudyDate ? lastStudyDate.toLocaleDateString('en-IN') : '-';
    document.getElementById('lastStudyDate').textContent = `Last: ${lastDate}`;
}

// Celebration animation
function celebrate() {
    const streakNum = document.getElementById('streakCount');
    streakNum.style.transform = 'scale(1.2)';
    streakNum.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        streakNum.style.transform = 'scale(1)';
    }, 300);
    
    // Confetti effect (simple)
    createConfetti();
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '1000';
        confetti.style.animation = 'fall 3s linear forwards';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Countdown Timer
function updateCountdown() {
    const now = new Date().getTime();
    const distance = UPSC_PRELIMS_2025 - now;
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    
    if (distance < 0) {
        document.getElementById('countdown').innerHTML = '<span style="color: #ff6b6b; font-size: 1.5em;">🎉 EXAM DAY! 🎉</span>';
    }
}

// Add CSS animation for confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadStreakData();
    updateCountdown();
    
    document.getElementById('markToday').addEventListener('click', markToday);
    document.getElementById('resetStreak').addEventListener('click', resetStreak);
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
});
