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

// State
let allData      = [];
let filteredData = [];
let selectedIds  = [];
let currentPage  = 1;
const itemsPerPage = 8;
let theme        = localStorage.getItem('theme') || 'system';

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('partials:ready', () => {
  initTheme();
  initModals();
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
    
    // Custom dynamic page init
    if (tab === 'api') initApiDocs();
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

async function handleLogout() {
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

function confirmLogout() {
  showConfirm({
    title: 'Konfirmasi Keluar',
    msg: 'Apakah Anda yakin ingin mengakhiri sesi ini?',
    icon: 'logout',
    btnOk: 'Keluar Sekarang',
    onConfirm: handleLogout
  });
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
    .limit(500);

  if (error) {
    container.innerHTML = `<div class="py-16 text-center font-mono text-danger text-[0.85rem]">⚠ ${error.message}</div>`;
    return;
  }

  allData = data || [];
  const now = new Date();
  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated) {
    lastUpdated.textContent = `// diperbarui ${now.toLocaleTimeString('id-ID')} — ${allData.length} records`;
  }

  applyFilter();
}

function applyFilter() {
  const q = document.getElementById('filter-device')?.value.toLowerCase() || '';
  filteredData = allData.filter(r => !q || r.device_id?.toLowerCase().includes(q));
  currentPage = 1;
  selectedIds = [];
  updateBulkUI();
  renderTable();
}

function renderTable() {
  const c = document.getElementById('table-container');
  if (!c) return;

  if (!filteredData.length) {
    c.innerHTML = `
      <div class="py-20 text-center flex flex-col items-center justify-center anim-fade-up">
        <div class="w-16 h-16 rounded-3xl bg-surface2 flex items-center justify-center text-text-dim/20 mb-4 border border-border-subtle shadow-inner">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div class="font-serif text-[1.4rem] text-text-dim opacity-40">Tidak ada data ditemukan</div>
        <button onclick="document.getElementById('filter-device').value=''; applyFilter();" class="mt-4 text-accent text-[0.7rem] font-mono uppercase tracking-widest hover:underline cursor-pointer">Reset Pencarian</button>
      </div>`;
    updatePaginationUI();
    return;
  }

  // Slice for pagination
  const start = (currentPage - 1) * itemsPerPage;
  const end   = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  const fmt = (v, m = 14) => {
    if (v === null || v === undefined) return `<span class="opacity-20">null</span>`;
    const str = String(v);
    return str.length > m ? `<span title="${str}" class="cursor-help transition-colors hover:text-accent">${str.substring(0, m)}…</span>` : str;
  };

  const fmtD = d => {
    if (!d) return '—';
    const dt = new Date(d);
    return `<span class="whitespace-nowrap tabular-nums opacity-60">${dt.toLocaleDateString('id-ID')} <span class="opacity-30 mx-0.5">•</span> ${dt.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'})}</span>`;
  };

  const badge = s => {
    const sl = (s || '').toLowerCase();
    const map = { 
      ok:    'bg-ok/[0.08] text-ok border-ok/20', 
      error: 'bg-danger/[0.08] text-danger border-danger/20', 
      warn:  'bg-warn/[0.08] text-warn border-warn/20' 
    };
    const cls = map[sl] || 'bg-text-dim/[0.05] text-text-dim border-border-subtle';
    return `<span class="inline-flex items-center px-3 py-1 rounded-full border text-[0.6rem] font-bold font-mono tracking-wider uppercase leading-none shadow-sm ${cls}">${s || 'none'}</span>`;
  };

  let html = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-[0.75rem]">
        <thead class="bg-surface2/30 border-b border-border-subtle">
          <tr>
            <th class="w-14 px-6 py-5 text-center"><input type="checkbox" onchange="toggleSelectAll(this.checked)" ${isAllSelected() ? 'checked' : ''} class="accent-accent scale-125 rounded-md cursor-pointer"></th>
            ${['ID Perangkat','Status Server','Versi','Public Key (Temp)','Action']
              .map(h => `<th class="text-left px-6 py-5 font-mono text-[0.62rem] tracking-[0.15em] uppercase text-text-dim/60 font-bold whitespace-nowrap">${h}</th>`)
              .join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle/40">`;

  pageData.forEach((r) => {
    const isChecked = selectedIds.includes(r.id);
    html += `
      <tr class="group transition-all duration-300 ${isChecked ? 'bg-accent/[0.03]' : 'hover:bg-text-dim/[0.02]'}">
        <td class="px-6 py-5 text-center opacity-40 group-hover:opacity-100 transition-opacity">
          <input type="checkbox" onchange="toggleSelect('${r.id}')" ${isChecked ? 'checked' : ''} class="accent-accent scale-125 rounded-md cursor-pointer">
        </td>
        <td class="px-6 py-5">
          <div class="flex flex-col">
            <span class="font-sans font-bold text-text tracking-tight text-[0.85rem]">${r.device_id || 'UNKNOWN'}</span>
            <span class="text-[0.62rem] font-mono text-text-dim/40 tracking-tighter mt-1 tabular-nums">${fmtD(r.received_at)}</span>
          </div>
        </td>
        <td class="px-6 py-5">${badge(r.status)}</td>
        <td class="px-6 py-5 font-mono text-text-dim/60 tabular-nums">${r.version || 'v1.0.0'}</td>
        <td class="px-6 py-5 font-mono text-text-dim/40 text-[0.7rem]">${fmt(r.ephemeral_pub)}</td>
        <td class="px-6 py-5">
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
            <button onclick="showDetails(${allData.findIndex(x=>x.id===r.id)})" class="w-9 h-9 flex items-center justify-center border border-border-subtle rounded-xl text-text-dim hover:border-accent hover:text-accent hover:bg-accent/5 transition-all cursor-pointer shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
            <button onclick="confirmDelete('${r.id}')" class="w-9 h-9 flex items-center justify-center border border-border-subtle rounded-xl text-text-dim hover:border-danger hover:text-danger hover:bg-danger/5 transition-all cursor-pointer shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>`;
  });

  html += `</tbody></table></div>`;
  c.innerHTML = html;
  updatePaginationUI();
}

// ═══════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════
function showDetails(index) {
  const r = allData[index];
  if (!r) return;

  const elId = id => document.getElementById(id);

  if (elId('modal-device-id')) elId('modal-device-id').textContent = r.device_id || 'UNKNOWN DEVICE';
  if (elId('modal-version'))   elId('modal-version').textContent   = r.version || 'v1.0.0';
  if (elId('modal-timestamp')) elId('modal-timestamp').textContent = r.received_at ? new Date(r.received_at).toLocaleString('id-ID', {dateStyle:'long', timeStyle:'short'}) : '—';
  if (elId('modal-pub-key'))   elId('modal-pub-key').textContent   = r.ephemeral_pub || '—';
  if (elId('modal-enc-key'))   elId('modal-enc-key').textContent   = r.encrypted_key || '—';

  // Restore Reset
  if (typeof resetModalRestore === 'function') resetModalRestore();

  const sl = (r.status || '').toLowerCase();
  const map = { 
    ok:    'bg-ok/[0.1] text-ok border-ok/30', 
    error: 'bg-danger/[0.1] text-danger border-danger/30', 
    warn:  'bg-warn/[0.1] text-warn border-warn/30' 
  };
  const cls = map[sl] || 'bg-text-dim/[0.05] text-text-dim border-border-subtle';
  
  if (elId('modal-status')) {
    elId('modal-status').innerHTML = `<span class="px-3 py-1 rounded-full border text-[0.65rem] font-bold font-mono tracking-wider uppercase leading-none ${cls}">${r.status || 'none'}</span>`;
  }

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
      
      // Timer to hide key
      setTimeout(() => {
        display.innerHTML = `x-api-key: ••••••••••••••••••••••••••••••••`;
        btn.textContent = originalText;
        btn.classList.remove('text-ok');
        btn.disabled = false;
      }, 30000); // 30 seconds
    });

  } catch (err) {
    console.error('Failed to get API Key:', err);
    alert('Gagal mengambil API Key: ' + err.message);
    btn.textContent = originalText;
    btn.disabled    = false;
  }
}

// ═══════════════════════════════════════════
//  THEME LOGIC
// ═══════════════════════════════════════════
function initTheme() {
  applyTheme(theme);
}

function applyTheme(t) {
  const root = document.documentElement;
  if (t === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', t);
  }
  
  // Update icons
  document.getElementById('theme-icon-dark')?.classList.add('hidden');
  document.getElementById('theme-icon-light')?.classList.add('hidden');
  document.getElementById('theme-icon-system')?.classList.add('hidden');
  document.getElementById(`theme-icon-${t}`)?.classList.remove('hidden');
}

function cycleTheme() {
  const modes = ['light', 'dark', 'system'];
  theme = modes[(modes.indexOf(theme) + 1) % modes.length];
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

// ═══════════════════════════════════════════
//  PAGINATION & SELECTION
// ═══════════════════════════════════════════
function updatePaginationUI() {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  
  if (filteredData.length <= itemsPerPage) {
    pag.classList.add('hidden');
    return;
  }
  pag.classList.remove('hidden');

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, filteredData.length);

  document.getElementById('pag-start').textContent = start;
  document.getElementById('pag-end').textContent   = end;
  document.getElementById('pag-total').textContent = filteredData.length;

  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage === totalPages;

  let numbersHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 5 && i > 1 && i < totalPages && Math.abs(i - currentPage) > 1) {
       if (i === 2 || i === totalPages - 1) numbersHtml += `<span class="px-2 text-muted opacity-30">...</span>`;
       continue;
    }
    numbersHtml += `
      <button onclick="gotoPage(${i})" class="w-8 h-8 rounded-lg border ${i===currentPage ? 'bg-accent text-bg border-accent font-bold' : 'border-border text-muted hover:border-accent hover:text-accent'} transition-all cursor-pointer">${i}</button>
    `;
  }
  document.getElementById('pag-numbers').innerHTML = numbersHtml;
}

function gotoPage(n) { currentPage = n; renderTable(); window.scrollTo({top:0, behavior:'smooth'}); }
function prevPage() { if (currentPage > 1) gotoPage(currentPage - 1); }
function nextPage() { if (currentPage * itemsPerPage < filteredData.length) gotoPage(currentPage + 1); }

function toggleSelect(id) {
  if (selectedIds.includes(id)) selectedIds = selectedIds.filter(x => x !== id);
  else selectedIds.push(id);
  updateBulkUI();
  renderTable();
}

function toggleSelectAll(checked) {
  const start = (currentPage - 1) * itemsPerPage;
  const pageIds = filteredData.slice(start, start + itemsPerPage).map(r => r.id);
  if (checked) {
    pageIds.forEach(id => { if(!selectedIds.includes(id)) selectedIds.push(id); });
  } else {
    selectedIds = selectedIds.filter(id => !pageIds.includes(id));
  }
  updateBulkUI();
  renderTable();
}

function isAllSelected() {
  const start = (currentPage - 1) * itemsPerPage;
  const pageIds = filteredData.slice(start, start + itemsPerPage).map(r => r.id);
  return pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
}

function updateBulkUI() {
  const bar = document.getElementById('bulk-actions');
  const count = document.getElementById('selected-count');
  if (!bar || !count) return;
  
  if (selectedIds.length > 0) {
    bar.classList.remove('hidden');
    count.textContent = selectedIds.length;
  } else {
    bar.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════
//  DELETE ACTIONS
// ═══════════════════════════════════════════
function confirmDelete(id) {
  showConfirm({
    title: 'Hapus Log',
    msg: 'Apakah Anda yakin ingin menghapus log ini secara permanen?',
    onConfirm: async () => {
      const { error } = await sb.from('device_logs').delete().eq('id', id);
      if (error) alert('Error: ' + error.message);
      else loadData();
    }
  });
}

function confirmBulkDelete() {
  showConfirm({
    title: 'Hapus Masal',
    msg: `Apakah Anda yakin ingin menghapus ${selectedIds.length} log terpilih secara permanen?`,
    onConfirm: async () => {
      const { error } = await sb.from('device_logs').delete().in('id', selectedIds);
      if (error) alert('Error: ' + error.message);
      else {
        selectedIds = [];
        loadData();
      }
    }
  });
}

// ═══════════════════════════════════════════
//  CONFIRM MODAL HANDLER
// ═══════════════════════════════════════════
let _onConfirm = null;

function showConfirm({ title, msg, icon, btnOk, onConfirm }) {
  const modal = document.getElementById('modal-confirm');
  if (!modal) return;
  
  document.getElementById('confirm-title').textContent = title || 'Konfirmasi';
  document.getElementById('confirm-msg').textContent   = msg || '';
  document.getElementById('confirm-btn-ok').textContent = btnOk || 'Ya, Lanjutkan';
  _onConfirm = onConfirm;
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeConfirm() {
  const modal = document.getElementById('modal-confirm');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  _onConfirm = null;
}

function initModals() {
  document.getElementById('confirm-btn-ok')?.addEventListener('click', () => {
    if (_onConfirm) _onConfirm();
    closeConfirm();
  });
}

// ═══════════════════════════════════════════
//  API DOCS INIT
// ═══════════════════════════════════════════
function initApiDocs() {
  const host = window.location.host;
  const curl = document.getElementById('code-curl');
  const js   = document.getElementById('code-js');
  const py   = document.getElementById('code-py');
  
  if (curl) curl.textContent = curl.textContent.replace('[HOST]', host).replace('${window.location.host}', host);
  if (js)   js.textContent   = js.textContent.replace('[HOST]', host);
  if (py)   py.textContent   = py.textContent.replace('[HOST]', host);
}



