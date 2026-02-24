// =============================================
// QR Pass System - Shared Utilities
// =============================================

const DB_KEY = 'qrpass_db';

const DEFAULT_DB = {
  users: [
    { id: 'u1', name: 'Admin User', email: 'admin@pass.com', password: 'demo123', role: 'admin', createdAt: '2025-01-01' },
    { id: 'u2', name: 'Rahul Sharma', email: 'user@pass.com', password: 'demo123', role: 'user', createdAt: '2025-01-05' },
    { id: 'u3', name: 'Conductor Ravi', email: 'conductor@pass.com', password: 'demo123', role: 'conductor', createdAt: '2025-01-05' },
    { id: 'u4', name: 'Priya Mehta', email: 'priya@pass.com', password: 'demo123', role: 'user', createdAt: '2025-01-10' },
  ],
  passes: [
    {
      id: 'p1', userId: 'u2', route: 'Andheri ↔ Dadar', passType: 'monthly',
      status: 'active', validFrom: '2026-02-01', validUntil: '2026-03-15',
      qrToken: 'QR-DEMO-ACTIVE-001', price: 450, createdAt: '2026-02-01'
    },
    {
      id: 'p2', userId: 'u4', route: 'Bandra ↔ CST', passType: 'quarterly',
      status: 'active', validFrom: '2026-01-01', validUntil: '2026-04-01',
      qrToken: 'QR-DEMO-ACTIVE-002', price: 1200, createdAt: '2026-01-01'
    },
    {
      id: 'p3', userId: 'u2', route: 'Borivali ↔ Churchgate', passType: 'yearly',
      status: 'pending', validFrom: null, validUntil: null,
      qrToken: null, price: 4500, createdAt: '2026-02-20'
    },
    {
      id: 'p4', userId: 'u4', route: 'Thane ↔ VT', passType: 'monthly',
      status: 'expired', validFrom: '2025-12-01', validUntil: '2026-01-01',
      qrToken: 'QR-DEMO-EXPIRED-001', price: 450, createdAt: '2025-12-01'
    },
  ],
  payments: [
    { id: 'pay1', passId: 'p1', userId: 'u2', amount: 450, status: 'completed', paidAt: '2026-02-01' },
    { id: 'pay2', passId: 'p2', userId: 'u4', amount: 1200, status: 'completed', paidAt: '2026-01-01' },
    { id: 'pay4', passId: 'p4', userId: 'u4', amount: 450, status: 'completed', paidAt: '2025-12-01' },
  ],
  scanLogs: [
    { id: 's1', passId: 'p1', conductorId: 'u3', scannedAt: '2026-02-24T08:30:00', result: 'valid', passengerName: 'Rahul Sharma', route: 'Andheri ↔ Dadar' },
    { id: 's2', passId: 'p4', conductorId: 'u3', scannedAt: '2026-02-24T09:15:00', result: 'expired', passengerName: 'Priya Mehta', route: 'Thane ↔ VT' },
    { id: 's3', passId: 'p2', conductorId: 'u3', scannedAt: '2026-02-24T10:00:00', result: 'valid', passengerName: 'Priya Mehta', route: 'Bandra ↔ CST' },
  ]
};

// =============================================
// DB Functions
// =============================================
function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    return DEFAULT_DB;
  }
  return JSON.parse(raw);
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
}

// =============================================
// Auth Functions
// =============================================
function getSession() {
  const raw = localStorage.getItem('qrpass_session');
  return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
  localStorage.setItem('qrpass_session', JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role
  }));
}

function clearSession() {
  localStorage.removeItem('qrpass_session');
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
