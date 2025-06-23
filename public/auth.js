/* ─── AUTHENTICATION ───────────────────────────────────────── */
import { createAuth0Client }
  from 'https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.2.0/dist/auth0-spa-js.production.esm.js';
import { CONFIG } from './config.js';

class AuthManager {
  constructor() {
    this.auth0 = null;
  }

  async init() {
    console.log('[Auth] Initializing AuthManager...');
    this.auth0 = await createAuth0Client({
      domain: CONFIG.AUTH0.DOMAIN,
      clientId: CONFIG.AUTH0.CLIENT_ID,
      authorizationParams: {
        redirect_uri: CONFIG.AUTH0.REDIRECT_URI,
        audience: `https://${CONFIG.AUTH0.DOMAIN}/api/v2/`
      }
    });

    // Handle callback if present
    console.log('[Auth] Checking for redirect callback...');
    if (location.search.includes('code=') && location.search.includes('state=')) {
      console.log('[Auth] Found redirect params in URL, handling callback...');
      try {
        await this.auth0.handleRedirectCallback();
        console.log('[Auth] Redirect callback handled successfully.');
      } catch (e) {
        console.error('[Auth] Error handling redirect callback:', e);
        if (e.error !== 'invalid_state') throw e;
      }
      history.replaceState({}, '', '/');
      console.log('[Auth] URL cleaned up.');
    }

    // Set up auth buttons
    this.setupAuthButtons();
    console.log('[Auth] AuthManager initialized.');
  }

  /**
   * Sets up login/logout button event listeners
   */
  setupAuthButtons() {
    const loginBtn = document.querySelector(CONFIG.UI.SELECTORS.LOGIN_BTN);
    const logoutBtn = document.querySelector(CONFIG.UI.SELECTORS.LOGOUT_BTN);

    loginBtn.onclick = () => this.auth0.loginWithRedirect();
    logoutBtn.onclick = () => this.auth0.logout({ 
      logoutParams: { returnTo: CONFIG.AUTH0.REDIRECT_URI } 
    });
  }

  /**
   * Checks if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const isAuth = await this.auth0.isAuthenticated();
    console.log('[Auth] isAuthenticated() check returned:', isAuth);
    return isAuth;
  }

  /**
   * Gets the current user
   * @returns {Promise<Object>}
   */
  async getUser() {
    return await this.auth0.getUser();
  }
}

// Instanciar y exponer la clase para usarla en el archivo
const authManager = new AuthManager();
await authManager.init();

export { authManager };

/* ─── CONFIG ──────────────────────────────────────────────── */
const DOMAIN    = 'dev-zy2v2vb4ic7m785h.us.auth0.com';        // AUTH0_DOMAIN
const CLIENT_ID = 'M7sLZlJKE7UEFsBPmgifptPtdH27RNnV';         // AUTH0_CLIENT_ID

/* ─── UI REFERENCES ────────────────────────────────────────── */
const $login   = document.getElementById('btn-login');
const $logout  = document.getElementById('btn-logout');
const $hello   = document.getElementById('hello');
const $profile = document.getElementById('profile');
const $today   = document.getElementById('today');
const $modal   = document.getElementById('playerModal');
const $frame   = document.getElementById('playerFrame');
const $close   = document.getElementById('closeModal');

/* ─── HELPERS ──────────────────────────────────────────────── */
const fmtTime = iso => {
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return '—';

  const m  = 60 * 1000;
  const h  = 60 * m;
  const d  = 24 * h;
  const w  = 7 * d;
  const mo = 30 * d;
  const y  = 365 * d;

  const r = new Intl.RelativeTimeFormat('en', { numeric: 'always' }); // ← aquí el cambio

  if (diff < h)  return r.format(-Math.round(diff / m),  'minute'); //  "15 minutes ago"
  if (diff < d)  return r.format(-Math.round(diff / h),  'hour');   //  "3 hours ago"
  if (diff < w)  return r.format(-Math.round(diff / d),  'day');    //  "1 day ago"
  if (diff < mo) return r.format(-Math.round(diff / w),  'week');   //  "2 weeks ago"
  if (diff < y)  return r.format(-Math.round(diff / mo), 'month');
  return r.format(-Math.round(diff / y), 'year');
};

/* Modal player */
function openPlayer(idRaw) {
  const id  = idRaw.replace(/^yt:video:/, '');     // limpia prefijo si viene
  const url = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
  if ($modal.showModal) {               // Navegadores con <dialog>
    $frame.src = url;
    $modal.showModal();
  } else {                              // Fallback (Safari, IE)
    window.open(`https://youtu.be/${id}`, '_blank');
  }
}

window.openPlayer = openPlayer;

$close?.addEventListener('click', () => $modal.close());
$modal?.addEventListener('close', () => { $frame.src = ''; });

/* ─── DATA LAYER ───────────────────────────────────────────── */
async function loadToday() {
  let headers = {};
  if (await authManager.isAuthenticated()) {
    const token = await authManager.auth0.getTokenSilently();
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res  = await fetch('/.netlify/functions/today', { headers });
  const list = await res.json();

  $today.innerHTML = list.length
    ? list.map(v => {
        const cleanId = v.id.replace(/^yt:video:/, ''); // Remove yt:video: prefix
        return `
        <li id="v-${cleanId}" class="bg-white shadow p-4 rounded mb-3 ${v.watched ? 'opacity-50' : ''}">
          <img src="https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg"
               alt="${v.title}"
               class="mb-2 w-full rounded">
          <button onclick="openPlayer('${v.id}'); markWatched('${cleanId}');"
                  class="text-left w-full text-blue-600 font-medium hover:underline">
            ${v.title}
          </button>
          <p class="text-sm text-gray-500">
            ${v.source} • ${fmtTime(v.published_at)}
          </p>
        </li>`;
      }).join('')
    : '<li class="text-gray-500">Nothing new today homie! 🙌</li>';
}

/* Marcar visto sin quitar la tarjeta */
window.markWatched = async id => {
  let headers = { 'Content-Type': 'application/json' };
  if (await authManager.isAuthenticated()) {
    const token = await authManager.auth0.getTokenSilently();
    headers['Authorization'] = `Bearer ${token}`;
  }
  await fetch('/.netlify/functions/markWatched', {
    method: 'POST',
    headers,
    body: JSON.stringify({ id })
  });
  document.getElementById(`v-${id}`)?.classList.add('opacity-50');
};

/* ─── RENDER LOOP ──────────────────────────────────────────── */
async function refreshUI() {
  const ok = await authManager.isAuthenticated();

  $login.style.display  = ok ? 'none'          : 'inline-block';
  $logout.style.display = ok ? 'inline-block'  : 'none';

  if (!ok) {
    // Muestra lista de solo lectura aún sin login (opcional)
    loadToday();
    return;
  }

  const user = await authManager.getUser();
  $hello.style.display = 'block';
  $hello.textContent   = `Hi ${user.nickname}!`;
  $profile.textContent = JSON.stringify(user, null, 2);

  loadToday();
}
