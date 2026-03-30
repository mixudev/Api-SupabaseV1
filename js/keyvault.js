/**
 * keyvault.js
 * X25519 ECDH key decryption logic.
 * Runs entirely client-side via the Web Crypto API (SubtleCrypto).
 * No data is ever transmitted outside the browser.
 */

// ─── Helpers ────────────────────────────────
function b64ToAB(b64) {
  try {
    const bin = atob(b64.trim());
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  } catch {
    throw new Error('Invalid Base64 sequence.');
  }
}

const toHex     = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
const stripPem  = pem => pem.replace(/(-----(BEGIN|END).*-----|\s|\n|\r)/g, '');
const escHtml   = s   => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ─── UI helpers ─────────────────────────────
function kvSetLoading(on) {
  const btn     = document.getElementById('kv-unlockBtn');
  const label   = document.getElementById('kv-btnLabel');
  const spinner = document.getElementById('kv-spinner');
  btn.disabled          = on;
  label.textContent     = on ? 'Processing…' : 'Recover AES Key';
  spinner.classList.toggle('hidden', !on);
}

function kvShowResult(ok, hex, msg) {
  const out   = document.getElementById('kv-output');
  const box   = document.getElementById('kv-rBox');
  const head  = document.getElementById('kv-rHead');
  const icon  = document.getElementById('kv-rIcon');
  const title = document.getElementById('kv-rTitle');
  const body  = document.getElementById('kv-rBody');

  if (ok) {
    // Success styles (Tailwind classes applied inline via className)
    box.style.borderColor  = '#166534';
    head.style.background  = 'rgba(74,222,128,0.08)';
    head.style.color       = '#4ade80';
    icon.innerHTML         = `<polyline points="20 6 9 17 4 12"/>`;
    title.textContent      = 'Key Successfully Recovered';

    body.innerHTML = `
      <div class="font-mono text-[0.65rem] font-medium text-muted uppercase tracking-[0.1em] mb-2">
        Recovered AES Key · Hexadecimal
      </div>
      <div id="hexDisp"
        class="font-mono text-[0.77rem] text-ok break-all leading-[1.9] px-4 py-[0.8rem] bg-surface rounded-lg min-h-[46px]"
        style="border: 1.5px solid #166534"
      ></div>
      <div class="flex justify-end mt-[0.65rem]">
        <button onclick="copyHex()"
          class="inline-flex items-center gap-[5px] font-geist text-[0.74rem] font-medium text-muted bg-surface border border-border px-3 py-[5px] rounded-lg cursor-pointer transition-all hover:border-muted hover:text-[#f0ede6]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span id="copyLbl">Copy to clipboard</span>
        </button>
      </div>`;

    out.classList.remove('hidden');
    window._hex = hex;

    // Typewriter animation
    const el = document.getElementById('hexDisp');
    let i = 0;
    const t = setInterval(() => {
      if (i < hex.length) { el.textContent += hex[i++]; }
      else clearInterval(t);
    }, 7);

  } else {
    box.style.borderColor  = '#7f1d1d';
    head.style.background  = 'rgba(255,107,107,0.08)';
    head.style.color       = '#ff6b6b';
    icon.innerHTML         = `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`;
    title.textContent      = 'Decryption Failed';
    body.innerHTML         = `<div class="font-mono text-[0.77rem] text-danger leading-[1.65]">${escHtml(msg)}</div>`;
    out.classList.remove('hidden');
  }
}

// ─── Copy recovered hex ──────────────────────
function copyHex() {
  if (!window._hex) return;
  navigator.clipboard.writeText(window._hex)
    .then(() => {
      const lbl = document.getElementById('copyLbl');
      if (lbl) {
        lbl.textContent = 'Copied!';
        setTimeout(() => lbl.textContent = 'Copy to clipboard', 2000);
      }
    })
    .catch(() => alert('Copy failed — please select and copy manually.'));
}

// ─── Main decryption routine (Server-side) ──
async function runDecryption() {
  document.getElementById('kv-output').classList.add('hidden');
  kvSetLoading(true);

  try {
    const ephB64  = document.getElementById('kv-ephemeralPub').value.trim();
    const encB64  = document.getElementById('kv-encryptedKey').value.trim();

    if (!ephB64 || !encB64)
      throw new Error('Ephemeral Public Key and Encrypted Key are required.');

    // Get current session for authentication
    const { data: { session } } = await sb.auth.getSession();
    const headers = { 'Content-Type': 'application/json' };
    
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    const response = await fetch('/api/decrypt', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ 
        ephemeral_pub: ephB64, 
        encrypted_key: encB64 
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.detail || 'Recovery failed.');
    }

    // Clear inputs
    document.getElementById('kv-ephemeralPub').value = '';
    document.getElementById('kv-encryptedKey').value = '';

    kvShowResult(true, result.recovered_hex);

  } catch (e) {
    kvShowResult(false, null, e.message);
  } finally {
    kvSetLoading(false);
  }
}

// ─── Modal Restore Feature ──────────────────
let _modalTimer = null;

async function restoreKeyInModal() {
  const btn    = document.getElementById('btn-restore-key');
  const loader = document.getElementById('restore-loader');
  const result = document.getElementById('restore-key-container');
  const text   = document.getElementById('restored-key-text');
  const timerT = document.getElementById('restore-timer-text');
  const bar    = document.getElementById('restore-timer-bar');

  const ephB64 = document.getElementById('md-pub-text').textContent.trim();
  const encB64 = document.getElementById('md-key-text').textContent.trim();

  if (!ephB64 || !encB64 || ephB64 === '—' || encB64 === '—') return;

  // UI: Loading
  loader.classList.remove('hidden');
  loader.classList.add('flex');
  btn.disabled = true;

  try {
    const { data: { session } } = await sb.auth.getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const response = await fetch('/api/decrypt', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ ephemeral_pub: ephB64, encrypted_key: encB64 })
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) throw new Error(resData.error || 'Failed');

    // UI: Show result
    text.textContent = resData.recovered_hex;
    result.classList.remove('hidden');
    
    // Timer logic (30s)
    if (_modalTimer) clearInterval(_modalTimer);
    let seconds = 30;
    timerT.textContent = `${seconds}s remaining`;
    bar.style.width = '100%';
    bar.style.transition = 'none';
    void bar.offsetWidth; // trigger reflow
    bar.style.transition = 'width 30s linear';
    bar.style.width = '0%';

    _modalTimer = setInterval(() => {
      seconds--;
      timerT.textContent = `${seconds}s remaining`;
      if (seconds <= 0) {
        clearInterval(_modalTimer);
        result.classList.add('hidden');
        btn.disabled = false;
      }
    }, 1000);

  } catch (e) {
    alert('Decryption Error: ' + e.message);
    btn.disabled = false;
  } finally {
    loader.classList.add('hidden');
    loader.classList.remove('flex');
  }
}

function resetModalRestore() {
  if (_modalTimer) clearInterval(_modalTimer);
  _modalTimer = null;
  
  const result = document.getElementById('restore-key-container');
  const btn    = document.getElementById('btn-restore-key');
  if (result) result.classList.add('hidden');
  if (btn) btn.disabled = false;
}
