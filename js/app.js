/**
 * app.js
 * Core application: Supabase auth, dashboard data, table rendering, modal, mobile nav.
 * Runs after partials:ready fires from partials.js.
 */

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const SUPABASE_URL      = 'https://eguakeiaubrirdztacvd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndWFrZWlhdWJyaXJkenRhY3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzk2NjQsImV4cCI6MjA5MDM1NTY2NH0.OrxGBVhabBZr_2KdhPiqdIbwH4c4JL1D0vEHjxtiz8U';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let allData = [];
let filteredData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('partials:ready', () => {
  bindPasswordEnter();
  checkSession();
});

// ═══════════════════════════════════════════
//  TAB NAVIGATION
// ═══════════════════════════════════════════
function switchTab(tab) {
  // Desktop tabs indicator
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

  document.getElementById('tab-' + tab)?.classList.add('active');
  const page = document.getElementById('page-' + tab);
  if (page) {
    page.classList.remove('hidden');
    page.classList.remove('anim-fade-up');
    void page.offsetWidth;
    (page.querySelector('main') || page.querySelector('[id="kv-wrap"]'))?.classList.add('anim-fade-up');
  }

  // Sync mobile nav highlight
  document.querySelectorAll('.mob-nav-item').forEach(el => {
    el.classList.remove('text-accent');
    el.classList.add('text-muted');
  });
  const mobBtn = document.getElementById('mob-tab-' + tab);
  if (mobBtn) {
    mobBtn.classList.remove('text-muted');
    mobBtn.classList.add('text-accent');
  }
}

// ═══════════════════════════════════════════
//  MOBILE MENU
// ═══════════════════════════════════════════
let _mobileOpen = false;

function toggleMobileMenu() {
  _mobileOpen ? closeMobileMenu() : openMobileMenu();
}

function openMobileMenu() {
  _mobileOpen = true;
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.remove('hidden');

  // Sync email
  const email = document.getElementById('user-email-display')?.textContent || '';
  const mobEmail = document.getElementById('mob-user-email');
  if (mobEmail) mobEmail.textContent = email;

  // Hamburger → X
  const h1 = document.getElementById('ham-1');
  const h2 = document.getElementById('ham-2');
  const h3 = document.getElementById('ham-3');
  if (h1) h1.style.transform = 'translateY(6.5px) rotate(45deg)';
  if (h2) h2.style.opacity   = '0';
  if (h3) h3.style.transform = 'translateY(-6.5px) rotate(-45deg)';
}

function closeMobileMenu() {
  _mobileOpen = false;
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.add('hidden');

  // X → Hamburger
  const h1 = document.getElementById('ham-1');
  const h2 = document.getElementById('ham-2');
  const h3 = document.getElementById('ham-3');
  if (h1) h1.style.transform = '';
  if (h2) h2.style.opacity   = '';
  if (h3) h3.style.transform = '';
}

// ═══════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════
async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-error');

  if (!email || !pass) { showLoginErr('Email dan password wajib diisi.'); return; }

  btn.disabled    = true;
  btn.textContent = 'Memproses...';
  err.classList.add('hidden');

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });

  if (error) {
    showLoginErr(error.message.includes('Invalid') ? 'Email atau password salah.' : error.message);
    btn.disabled    = false;
    btn.textContent = 'Masuk →';
    return;
  }
  showApp(data.user);
}

function bindPasswordEnter() {
  document.getElementById('password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
}

function showLoginErr(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function handleLogout() {
  const overlay = document.getElementById('modal-logout');
  if(overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex', 'active');
    document.body.style.overflow = 'hidden';
  } else {
    confirmLogout();
  }
}

function closeLogoutModal() {
  const overlay = document.getElementById('modal-logout');
  if(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
    }, 300);
    document.body.style.overflow = '';
  }
}

async function confirmLogout() {
  closeLogoutModal();
  await sb.auth.signOut();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('app').style.display = '';
  document.getElementById('login-page').classList.remove('hidden');
}

function showApp(user) {
  document.getElementById('login-page').classList.add('hidden');
  const app = document.getElementById('app');
  app.classList.remove('hidden');
  app.style.display = 'flex';
  app.style.flexDirection = 'column';
  document.getElementById('user-email-display').textContent = user.email;
  switchTab('dashboard');
  loadData();
}

async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showApp(session.user);
}

// ═══════════════════════════════════════════
//  DASHBOARD DATA
// ═══════════════════════════════════════════
async function loadData() {
  const container = document.getElementById('table-container');
  if (!container) return;

  container.innerHTML = `
    <div class="py-16 text-center font-mono text-muted text-[0.85rem]">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <div class="mt-4">Mengambil data...</div>
    </div>`;

  const { data, error } = await sb
    .from('device_logs')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(200);

  if (error) {
    container.innerHTML = `<div class="py-16 text-center font-mono text-danger text-[0.85rem]">⚠ ${error.message}</div>`;
    return;
  }

  allData = data || [];

  const now = new Date();
  document.getElementById('last-updated').textContent =
    `// diperbarui ${now.toLocaleTimeString('id-ID')} — ${allData.length} log ditemukan`;

  applyFilter();
}

function applyFilter() {
  const q = document.getElementById('filter-device')?.value.toLowerCase() || '';
  const d = document.getElementById('filter-date')?.value || '';
  
  filteredData = allData.filter(r => {
    const matchQ = !q || r.device_id?.toLowerCase().includes(q);
    let matchD = true;
    if (d && r.received_at) matchD = r.received_at.startsWith(d);
    return matchQ && matchD;
  });
  
  currentPage = 1;
  renderTable();
}

function changePage(page) {
    currentPage = page;
    renderTable();
}

function renderTable() {
  const c = document.getElementById('table-container');
  if (!filteredData.length) {
    c.innerHTML = `<div class="py-16 text-center font-mono text-muted text-[0.85rem]">Tidak ada data yang cocok.</div>`;
    return;
  }

  const badge = s => {
    const sl  = (s || '').toLowerCase();
    const map = { ok: 'border-accent text-accent', error: 'border-danger text-danger', warn: 'border-warn text-warn' };
    const cls = map[sl] || 'border-border text-muted';
    return `<span class="inline-block px-[0.7rem] py-[0.2rem] text-[0.68rem] font-mono rounded-full border whitespace-nowrap ${cls}">${s || '—'}</span>`;
  };

  const fmt = (v, m = 20) => {
    if (v === null || v === undefined) return `<span class="font-mono text-[0.75rem] text-muted">null</span>`;
    const str = String(v);
    return str.length > m
      ? `<span class="block max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[0.75rem] text-muted" title="${str}">${str.substring(0, m)}…</span>`
      : `<span class="font-mono text-[0.75rem] text-muted">${str}</span>`;
  };

  const fmtD = d => {
    if (!d) return '—';
    const dt = new Date(d);
    return `<span class="font-mono text-[0.75rem] text-muted">${dt.toLocaleDateString('id-ID')} ${dt.toLocaleTimeString('id-ID')}</span>`;
  };

  let html = `
    <table class="w-full border-collapse text-[0.85rem]">
      <thead class="bg-surface border-b border-border">
        <tr>
          ${['#','Device ID','Status','Files','Version','Ephemeral Pub','Encrypted Key','Diterima','Action']
            .map(h => `<th class="text-left px-4 py-[0.9rem] font-mono text-[0.68rem] tracking-[0.1em] uppercase text-muted font-normal whitespace-nowrap">${h}</th>`)
            .join('')}
        </tr>
      </thead>
      <tbody>`;

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  paginatedData.forEach((r, i) => {
    const realIdx = startIdx + i + 1;
    const allDataIndex = allData.findIndex(item => item.id === r.id);
    html += `
      <tr class="border-b border-[#1f1f1f] last:border-0 hover:bg-[rgba(200,245,102,0.03)] transition-colors">
        <td class="px-4 py-[0.9rem] font-mono text-[0.75rem] text-muted font-light">${realIdx}</td>
        <td class="px-4 py-[0.9rem]"><strong class="font-medium">${r.device_id || '—'}</strong></td>
        <td class="px-4 py-[0.9rem]">${badge(r.status)}</td>
        <td class="px-4 py-[0.9rem] font-mono text-[0.75rem] text-muted">${r.files_count ?? '—'}</td>
        <td class="px-4 py-[0.9rem] font-mono text-[0.75rem] text-muted">${r.version || '—'}</td>
        <td class="px-4 py-[0.9rem]">${fmt(r.ephemeral_pub, 12)}</td>
        <td class="px-4 py-[0.9rem]">${fmt(r.encrypted_key, 12)}</td>
        <td class="px-4 py-[0.9rem]">${fmtD(r.received_at)}</td>
        <td class="px-4 py-[0.9rem] text-center">
          <button title="Lihat Detail" onclick="showDetails(${allDataIndex})"
            class="bg-transparent border border-border text-muted p-[0.4rem] rounded-lg cursor-pointer transition-all hover:border-accent hover:text-accent flex items-center justify-center mx-auto"
            onmouseover="this.style.background='rgba(200,245,102,0.05)'"
            onmouseout="this.style.background='transparent'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
        </td>
      </tr>`;
  });

  html += `</tbody></table>`;
  
  if (totalPages > 1) {
    html += `
      <div class="px-6 py-4 border-t border-border bg-surface flex items-center justify-between">
        <span class="font-mono text-[0.7rem] text-muted">Menampilkan ${startIdx + 1} - ${Math.min(startIdx + ITEMS_PER_PAGE, filteredData.length)} dari ${filteredData.length}</span>
        <div class="flex items-center gap-2">
          <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled class="px-3 py-1 font-mono text-[0.7rem] border border-border text-muted/30 cursor-not-allowed"' : 'class="px-3 py-1 font-mono text-[0.7rem] border border-border text-muted hover:text-[#f0ede6] hover:border-accent transition-all"'}>Prev</button>
          <span class="font-mono text-[0.7rem] text-[#f0ede6] px-2">${currentPage} / ${totalPages}</span>
          <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled class="px-3 py-1 font-mono text-[0.7rem] border border-border text-muted/30 cursor-not-allowed"' : 'class="px-3 py-1 font-mono text-[0.7rem] border border-border text-muted hover:text-[#f0ede6] hover:border-accent transition-all"'}>Next</button>
        </div>
      </div>
    `;
  }

  c.innerHTML = html;
}

// ═══════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════
function showDetails(index) {
  const r = allData[index];
  if (!r) return;

  document.getElementById('md-device-id').textContent = r.device_id || '—';
  document.getElementById('md-version').textContent   = r.version || '—';
  document.getElementById('md-files').textContent     = r.files_count ?? '—';
  document.getElementById('md-date').textContent      = r.received_at ? new Date(r.received_at).toLocaleString('id-ID') : '—';
  document.getElementById('md-pub-text').textContent  = r.ephemeral_pub || '—';
  document.getElementById('md-key-text').textContent  = r.encrypted_key || '—';

  // Restore Reset
  if (typeof resetModalRestore === 'function') resetModalRestore();

  const sl  = (r.status || '').toLowerCase();
  const map = { ok: 'border-accent text-accent', error: 'border-danger text-danger', warn: 'border-warn text-warn' };
  const cls = map[sl] || 'border-border text-muted';
  document.getElementById('md-status').innerHTML =
    `<span class="inline-block px-[0.7rem] py-[0.2rem] text-[0.68rem] font-mono rounded-full border whitespace-nowrap ${cls}">${r.status || '—'}</span>`;

  const overlay = document.getElementById('modal-details');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex', 'active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-details');
  if (typeof resetModalRestore === 'function') resetModalRestore();
  
  overlay.classList.remove('active');
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }, 300);
  document.body.style.overflow = '';
}

function copyToClipboard(text, btn) {
  if (!text || text === '—') return;
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('border-ok', 'text-ok');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('border-ok', 'text-ok');
    }, 2000);
  });
}

// ═══════════════════════════════════════════
//  SECURE API KEY
// ═══════════════════════════════════════════
async function handleRevealKey(btn) {
  const display = document.getElementById('api-key-display');
  if (!display) return;

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    alert('Sesi habis, silakan login kembali.');
    return;
  }

  const originalText = btn.textContent;
  btn.textContent = 'Fetching...';
  btn.disabled    = true;

  try {
    const res = await fetch('/api/get-key', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);

    const key = data.key;
    display.innerHTML = `x-api-key: <code class="text-accent2 selection:bg-accent2/20 font-mono text-[0.8rem]">${key}</code>`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(key).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('text-ok');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('text-ok');
        btn.disabled = false;
      }, 2000);
    });

  } catch (err) {
    console.error('Failed to get API Key:', err);
    alert('Gagal mengambil API Key: ' + err.message);
    btn.textContent = originalText;
    btn.disabled    = false;
  }
}

// ═══════════════════════════════════════════
//  DOCS PAGE API TABS
// ═══════════════════════════════════════════
window.switchCodeTab = function(tab) {
  document.querySelectorAll('.code-req-tab').forEach(t => {
    t.classList.remove('active', 'text-[#f0ede6]', 'bg-[#1e2a4a]/40');
    t.classList.add('text-muted');
  });
  const t = document.getElementById('tab-code-' + tab);
  if (t) {
    t.classList.remove('text-muted');
    t.classList.add('active', 'text-[#f0ede6]', 'bg-[#1e2a4a]/40');
  }

  document.querySelectorAll('.code-content').forEach(c => c.classList.add('hidden'));
  const target = document.getElementById('code-block-' + tab);
  if (target) target.classList.remove('hidden');
};

