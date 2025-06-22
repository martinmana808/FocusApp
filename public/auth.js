/* --- CONFIG --- */
const DOMAIN    = 'dev-zy2v2vb4ic7m785h.us.auth0.com';   // AUTH0_DOMAIN
const CLIENT_ID = 'M7sLZlJKE7UEFsBPmgifptPtdH27RNnV';    // AUTH0_CLIENT_ID

import { createAuth0Client }
  from 'https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.2.0/dist/auth0-spa-js.production.esm.js';

const auth0 = await createAuth0Client({
  domain: DOMAIN,
  clientId: CLIENT_ID,
  authorizationParams: { redirect_uri: window.location.origin }
});

/* --- manejar callback --- */
if (location.search.includes('code=') && location.search.includes('state=')) {
  await auth0.handleRedirectCallback();
  history.replaceState({}, '', '/');
}

/* --- UI elements --- */
const $login   = document.getElementById('btn-login');
const $logout  = document.getElementById('btn-logout');
const $hello   = document.getElementById('hello');
const $profile = document.getElementById('profile');
const $today   = document.getElementById('today');

$login.onclick  = () => auth0.loginWithRedirect();
$logout.onclick = () => auth0.logout({ logoutParams:{ returnTo: window.location.origin }});

/* --- cargar lista de las últimas 24 h --- */
async function loadToday() {
  const res  = await fetch('/.netlify/functions/today');
  const list = await res.json();

  $today.innerHTML = list.length
    ? list.map(v => `
        <li class="bg-white shadow p-4 rounded mb-3">
          <a href="https://youtu.be/${v.id}" target="_blank"
             onclick="markWatched('${v.id}')"
             class="text-blue-600 font-medium hover:underline">
             ${v.title}
          </a>
          <p class="text-sm text-gray-500">
            ${v.source} •
            ${new Date(v.published_at).toLocaleTimeString('en-NZ', {
                hour: '2-digit', minute: '2-digit'
              })}
          </p>
        </li>`).join('')
    : '<li class="text-gray-500">No hay nada nuevo hoy 🙌</li>';
}

/* --- marcar como visto y quitar del DOM --- */
window.markWatched = async id => {
  await fetch('/.netlify/functions/markWatched', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id })
  });
  // elimina el elemento <li> correspondiente
  const li = document.querySelector(`a[onclick*="${id}"]`)?.parentElement;
  if (li) li.remove();
  if (!$today.children.length) {
    $today.innerHTML = '<li class="text-gray-500">No hay nada nuevo hoy 🙌</li>';
  }
};

/* --- refrescar UI según login --- */
async function refreshUI() {
  const ok = await auth0.isAuthenticated();
  $login.style.display  = ok ? 'none':'inline-block';
  $logout.style.display = ok ? 'inline-block':'none';

  if (!ok) return;

  const user = await auth0.getUser();
  $hello.style.display = 'block';
  $hello.textContent   = `Hola, ${user.nickname}!`;
  $profile.textContent = JSON.stringify(user, null, 2);

  loadToday();
}

refreshUI();
