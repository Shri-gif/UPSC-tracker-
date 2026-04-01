// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZYzLJ3Ba0UTWWX25ApTFMxdrp7TxNhV4",
    authDomain: "upsc-tracker-f4f30.firebaseapp.com",
    projectId: "upsc-tracker-f4f30",
    storageBucket: "upsc-tracker-f4f30.firebasestorage.app",
    messagingSenderId: "984156387207",
    appId: "1:984156387207:web:480541277bb02f0fc1c522",
    measurementId: "G-V5GZT9P8XT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Initialize variables
let currentUser = null;
let weeklyChart, subjectChart;

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const loginModal = document.getElementById('loginModal');
const addEntryModal = document.getElementById('addEntryModal');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const entryForm = document.getElementById('entryForm');
const addEntryBtn = document.getElementById('addEntryBtn');
const createAccountLink = document.getElementById('createAccountLink');

// Auth State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
});

// Show Dashboard
function showDashboard() {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    userEmail.textContent = currentUser.email;
    userEmail.style.display = 'block';
    dashboard.style.display = 'block';
    loginModal.style.display = 'none';
}

// Show Login
function showLogin() {
    loginBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    userEmail.style.display = 'none';
    dashboard.style.display = 'none';
}

// Event Listeners
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

addEntryBtn.addEventListener('click', () => {
    document.getElementById('entryDate').valueAsDate = new Date();
    addEntryModal.style.display = 'block';
});

// Close modals
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Login Form
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        loginModal.style.display = 'none';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// Create Account Toggle
createAccountLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginForm.dataset.mode === 'signup') {
        loginForm.dataset.mode = 'login';
        loginForm.querySelector('button[type="submit"]').textContent = 'Login';
        createAccountLink.textContent = 'Create one';
    } else {
        loginForm.dataset.mode = 'signup';
        loginForm.querySelector('button[type="submit"]').textContent = 'Create Account';
        createAccountLink.textContent = 'Already have account? Login';
    }
});

// Entry Form
entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const entry = {
        date: document.getElementById('entryDate').value,
        gsHours: parseFloat(document.getElementById('gsHours').value) || 0,
        csatHours: parseFloat(document.getElementById('csatHours').value) || 0,
        optionalHours: parseFloat(document.getElementById('optionalHours').value) || 0,
        currentAffairs: parseFloat(document.getElementById('currentAffairs').value) || 0,
        revisionHours: parseFloat(document.getElementById('revisionHours').value) || 0,
        mockHours: parseFloat(document.getElementById('mockHours').value) || 0,
