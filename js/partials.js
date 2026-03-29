/**
 * partials.js
 * Loads all HTML partial files and injects them into their target elements.
 * Called before app.js so the DOM is ready when app.js runs.
 */

const PARTIALS = [
  { url: 'partials/login.html',   target: 'login-page' },
  { url: 'partials/header.html',  target: 'header-partial' },
  { url: 'partials/modal.html',   target: 'modal-details-partial' },
  { url: 'pages/dashboard.html',  target: 'page-dashboard' },
  { url: 'pages/keyvault.html',   target: 'page-keyvault' },
];

async function loadPartials() {
  await Promise.all(
    PARTIALS.map(async ({ url, target }) => {
      try {
        const res  = await fetch(url);
        const html = await res.text();
        const el   = document.getElementById(target);
        if (el) el.innerHTML = html;
      } catch (e) {
        console.error(`Failed to load partial: ${url}`, e);
      }
    })
  );
  // Signal that partials are ready — app.js listens for this
  document.dispatchEvent(new Event('partials:ready'));
}

loadPartials();
