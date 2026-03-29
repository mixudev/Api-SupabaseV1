/**
 * app.js
 * Core application: Supabase auth, dashboard data, table rendering, modal.
 * Runs after partials:ready fires from partials.js.
 */

// ─────────────────────────────────────────────
//  CONFIG — replace with your own credentials
// ─────────────────────────────────────────────
const SUPABASE_URL      = 'https://eguakeiaubrirdztacvd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndWFrZWlhdWJyaXJkenRhY3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzk2NjQsImV4cCI6MjA5MDM1NTY2NH0.OrxGBVhabBZr_2KdhPiqdIbwH4c4JL1D0vEHjxtiz8U';
// ─────────────────────────────────────────────

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let allData = [];

// ═══════════════════════════════════════════
//  INIT — wait for partials to be injected
// ═══════════════════════════════════════════
document.addEventListener('partials:ready', () => {
  initApiBox();
  bindPasswordEnter();
  checkSession();
});

// ═══════════════════════════════════════════
//  TAB NAVIGATION
// ═══════════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

  document.getElementById('tab-' + tab).classList.add('active');
  const page = document.getElementById('page-' + tab);
  page.classList.remove('hidden');
  // re-trigger fade animation
  page.classList.remove('anim-fade-up');
  void page.offsetWidth;
  page.querySelector('main, .kv-wrap, [class*="anim-fade-up"]')?.classList.add('anim-fade-up');
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

  const devices  = new Set(allData.map(r => r.device_id)).size;
  const okCount  = allData.filter(r => r.status?.toLowerCase() === 'ok').length;
  const errCount = allData.filter(r => r.status?.toLowerCase() === 'error').length;

  document.getElementById('stat-total').textContent   = allData.length;
  document.getElementById('stat-devices').textContent = devices;
  document.getElementById('stat-ok').textContent      = okCount;
  document.getElementById('stat-err').textContent     = errCount;

  const now = new Date();
  document.getElementById('last-updated').textContent =
    `// diperbarui ${now.toLocaleTimeString('id-ID')} — ${allData.length} log ditemukan`;

  applyFilter();
}

function applyFilter() {
  const q = document.getElementById('filter-device')?.value.toLowerCase() || '';
  const s = document.getElementById('filter-status')?.value.toLowerCase() || '';
  renderTable(allData.filter(r =>
    (!q || r.device_id?.toLowerCase().includes(q)) &&
    (!s || r.status?.toLowerCase() === s)
  ));
}

function renderTable(data) {
  const c = document.getElementById('table-container');
  if (!data.length) {
    c.innerHTML = `<div class="py-16 text-center font-mono text-muted text-[0.85rem]">Tidak ada data yang cocok.</div>`;
    return;
  }

  const badge = s => {
    const sl = (s || '').toLowerCase();
    const styles = {
      ok:    'border-accent text-accent',
      error: 'border-danger text-danger',
      warn:  'border-warn text-warn',
    };
    const cls = styles[sl] || 'border-border text-muted';
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

  data.forEach((r, i) => {
    const realIndex = allData.findIndex(item => item.id === r.id);
    html += `
      <tr class="border-b border-[#1f1f1f] last:border-0 hover:bg-[rgba(200,245,102,0.03)] transition-colors">
        <td class="px-4 py-[0.9rem] font-mono text-[0.75rem] text-muted font-light">${i + 1}</td>
        <td class="px-4 py-[0.9rem]"><strong class="font-medium">${r.device_id || '—'}</strong></td>
        <td class="px-4 py-[0.9rem]">${badge(r.status)}</td>
        <td class="px-4 py-[0.9rem] font-mono text-[0.75rem] text-muted">${r.files_count ?? '—'}</td>
        <td class="px-4 py-[0.9rem] font-mono text-[0.75rem] text-muted">${r.version || '—'}</td>
        <td class="px-4 py-[0.9rem]">${fmt(r.ephemeral_pub, 12)}</td>
        <td class="px-4 py-[0.9rem]">${fmt(r.encrypted_key, 12)}</td>
        <td class="px-4 py-[0.9rem]">${fmtD(r.received_at)}</td>
        <td class="px-4 py-[0.9rem] text-center">
          <button
            title="Lihat Detail"
            onclick="showDetails(${realIndex})"
            class="bg-transparent border border-border text-muted p-[0.4rem] rounded-lg cursor-pointer transition-all hover:border-accent hover:text-accent flex items-center justify-center mx-auto"
            style="background: rgba(200,245,102,0)"
            onmouseover="this.style.background='rgba(200,245,102,0.05)'"
            onmouseout="this.style.background='rgba(200,245,102,0)'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
        </td>
      </tr>`;
  });

  html += `</tbody></table>`;
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
  document.getElementById('md-date').textContent      = r.received_at
    ? new Date(r.received_at).toLocaleString('id-ID') : '—';
  document.getElementById('md-pub-text').textContent  = r.ephemeral_pub || '—';
  document.getElementById('md-key-text').textContent  = r.encrypted_key || '—';

  const sl = (r.status || '').toLowerCase();
  const badgeStyles = {
    ok:    'border-accent text-accent',
    error: 'border-danger text-danger',
    warn:  'border-warn text-warn',
  };
  const cls = badgeStyles[sl] || 'border-border text-muted';
  document.getElementById('md-status').innerHTML =
    `<span class="inline-block px-[0.7rem] py-[0.2rem] text-[0.68rem] font-mono rounded-full border whitespace-nowrap ${cls}">${r.status || '—'}</span>`;

  const overlay = document.getElementById('modal-details');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex', 'active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-details');
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
//  API BOX
// ═══════════════════════════════════════════
function initApiBox() {
  const origin = window.location.origin;
  const urlEl  = document.getElementById('api-endpoint-url');
  const exEl   = document.getElementById('api-example-box');
  if (urlEl) urlEl.textContent = origin;
  if (exEl) exEl.textContent =
`// Contoh request dari device / script kamu:

curl -X POST ${origin}/api/device \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: API_SECRET_KAMU" \\
  -d '{
    "device_id":     "DEV-001",
    "ephemeral_pub": "04abc123...",
    "encrypted_key": "enc_xyz789...",
    "version":       "1.0.0",
    "status":        "ok",
    "files_count":   2
  }'`;
}
