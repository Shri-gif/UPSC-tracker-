import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://gpcbkguyrkluazkznybf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2JrZ3V5cmtsdWF6a3pueWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzMwMTIsImV4cCI6MjA5MDY0OTAxMn0.NqG6ggDw2xV2mHv1B0HB78c6Td-xMgOCtGTNnpgMatw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// AUTH FUNCTIONS
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// Reset Password functionality
document.addEventListener('DOMContentLoaded', function() {
    const showResetPassword = document.getElementById('showResetPassword');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const closeResetModal = document.getElementById('closeResetModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetEmail = document.getElementById('resetEmail');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const resetMessage = document.getElementById('resetMessage');
    const backToLogin = document.getElementById('backToLogin');

    // Show Reset Password Modal
    if (showResetPassword) {
        showResetPassword.addEventListener('click', function(e) {
            e.preventDefault();
            resetPasswordModal.style.display = 'flex';
        });
    }

    // Close Modal
    if (closeResetModal) {
        closeResetModal.addEventListener('click', function() {
            resetPasswordModal.style.display = 'none';
            resetForm();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === resetPasswordModal) {
            resetPasswordModal.style.display = 'none';
            resetForm();
        }
    });

    // Back to Login
    if (backToLogin) {
        backToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            resetPasswordModal.style.display = 'none';
            resetForm();
        });
    }

    // Reset Password Form Submit
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = resetEmail.value.trim();
            
            if (!email) {
                showMessage('Email address enter karein!', 'error');
                return;
            }

            // Disable button
            resetPasswordBtn.disabled = true;
            resetPasswordBtn.textContent = 'Bhej raha hun...';

            try {
                // Supabase se reset password request
                const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/update-password.html` // Ye page banayenge
                });

                if (error) {
                    console.error('Reset password error:', error);
                    showMessage(error.message || 'Kuch galat ho gaya! Email check karein.', 'error');
                } else {
                    showMessage('Password reset link aapke email pe bhej diya gaya! Check karein inbox ya spam folder.', 'success');
                    resetForm();
                }
            } catch (err) {
                console.error('Reset password error:', err);
                showMessage('Network error! Internet connection check karein.', 'error');
            } finally {
                // Re-enable button
                resetPasswordBtn.disabled = false;
                resetPasswordBtn.textContent = 'Reset Password Link Bhejo';
            }
        });
    }

    // Helper functions
    function showMessage(message, type) {
        resetMessage.textContent = message;
        resetMessage.className = `message ${type}`;
    }

    function resetForm() {
        resetPasswordForm.reset();
        resetMessage.textContent = '';
        resetMessage.className = 'message';
    }
});
