const API_BASE = window.location.origin.startsWith('http')
    ? window.location.origin + '/api/v1/auth'
    : 'http://localhost:8080/api/v1/auth';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');

function showError(formId, message) {
    const existing = document.getElementById(formId + '-error');
    if (existing) existing.remove();
    const error = document.createElement('p');
    error.id = formId + '-error';
    error.style.cssText = 'color: var(--danger); font-size: 0.85rem; margin-top: 0.5rem; text-align: center;';
    error.textContent = message;
    document.getElementById(formId).appendChild(error);
    setTimeout(() => error.remove(), 5000);
}

function showSuccess(message) {
    const existing = document.getElementById('success-msg');
    if (existing) existing.remove();
    const success = document.createElement('p');
    success.id = 'success-msg';
    success.style.cssText = 'color: var(--accent); font-size: 0.85rem; margin-top: 0.5rem; text-align: center;';
    success.textContent = message;
    document.body.appendChild(success);
    setTimeout(() => success.remove(), 3000);
}

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const res = await fetch(`${API_BASE}/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                fullName: data.fullName,
                email: data.email,
                role: data.role
            }));
            window.location.href = 'dashboard.html';
        } else {
            showError('loginForm', data.message || 'Invalid email or password');
        }
    } catch (err) {
        showError('loginForm', 'Cannot connect to server. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (password.length < 6) {
        showError('signupForm', 'Password must be at least 6 characters');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password, role: 'MEMBER' })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                fullName: data.fullName,
                email: data.email,
                role: data.role
            }));
            window.location.href = 'dashboard.html';
        } else {
            showError('signupForm', data.message || 'Signup failed. Email may already be registered.');
        }
    } catch (err) {
        showError('signupForm', 'Cannot connect to server. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
});
