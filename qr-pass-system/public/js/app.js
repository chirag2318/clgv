// =============================================
// BharatPass - Shared Utilities
// =============================================

// ===== GLOBAL THEME (applies on every page) =====
(function () {
  if (localStorage.getItem('bharatpass_theme') === 'light') {
    document.documentElement.classList.add('light-mode');
    document.body && document.body.classList.add('light-mode');
  }
})();

// Called by any page's toggle button
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  document.documentElement.classList.toggle('light-mode', isLight);
  localStorage.setItem('bharatpass_theme', isLight ? 'light' : 'dark');
  // Update all toggle buttons on this page
  document.querySelectorAll('.theme-toggle, #theme-toggle, #dash-theme-toggle')
    .forEach(btn => { btn.textContent = isLight ? '☀️' : '🌙'; });
}

// Restore icon on toggle buttons after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const isLight = localStorage.getItem('bharatpass_theme') === 'light';
  document.querySelectorAll('.theme-toggle, #theme-toggle, #dash-theme-toggle')
    .forEach(btn => { btn.textContent = isLight ? '☀️' : '🌙'; });
});

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : '/api'; // Netlify redirect in production

// =============================================
// DB Functions (Refactored for API)
// =============================================
async function fetchPasses(userId = null) {
  const url = userId ? `${API_URL}/api/passes?userId=${userId}` : `${API_URL}/api/passes`;
  const res = await fetch(url);
  return res.json();
}

async function apiPost(endpoint, data) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}


// =============================================
// Auth Functions
// =============================================
function getSession() {
  const raw = localStorage.getItem('bharatpass_session');
  return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
  localStorage.setItem('bharatpass_session', JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role
  }));
}

function clearSession() {
  localStorage.removeItem('bharatpass_session');
}

function requireAuth(role) {
  const session = getSession();
  if (!session) { window.location.href = '/login.html'; return null; }
  if (role && session.role !== role) {
    const roleMap = { admin: '/admin/dashboard.html', user: '/user/dashboard.html', conductor: '/conductor/scanner.html' };
    window.location.href = roleMap[session.role] || '/login.html';
    return null;
  }
  return session;
}

// =============================================
// Utils
// =============================================
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateToken(passId) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'QRP-';
  for (let i = 0; i < 12; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getPassDuration(type) {
  const map = { monthly: 30, quarterly: 90, yearly: 365 };
  return map[type] || 30;
}

function getPassPrice(type) {
  const map = { monthly: 450, quarterly: 1200, yearly: 4500 };
  return map[type] || 450;
}

function getBadgeHTML(status) {
  const icons = { active: '✅', pending: '⏳', expired: '❌', rejected: '🚫' };
  return `<span class="badge badge-${status}">${icons[status] || ''} ${status}</span>`;
}

function getBadgeTypeHTML(type) {
  return `<span class="badge badge-${type}">${type}</span>`;
}

// =============================================
// Toast
// =============================================
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// =============================================
// Sidebar & Navigation
// =============================================
function initSidebar() {
  const session = getSession();
  if (!session) return;

  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');

  if (nameEl) nameEl.textContent = session.name;
  if (roleEl) roleEl.textContent = session.role.charAt(0).toUpperCase() + session.role.slice(1);
  if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();
}

function logout() {
  clearSession();
  window.location.href = '../login.html';
}

// =============================================
// Tabs
// =============================================
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });
}

// =============================================
// Modal
// =============================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});
