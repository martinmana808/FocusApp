/* --- CONFIG --- */
const DOMAIN    = 'dev-zy2v2vb4ic7m785h.us.auth0.com';   // AUTH0_DOMAIN
const CLIENT_ID = 'M7sLZlJKE7UEFsBPmgifptPtdH27RNnV';             // AUTH0_CLIENT_ID

import { createAuth0Client }
  from 'https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.2.0/dist/auth0-spa-js.production.esm.js';

const auth0 = await createAuth0Client({
  domain: DOMAIN,
  clientId: CLIENT_ID,
  authorizationParams: { redirect_uri: window.location.origin }
});

/* --- manejar callback de Auth0 --- */
if (location.search.includes('code=') && location.search.includes('state=')) {
  await auth0.handleRedirectCallback();
  history.replaceState({}, '', '/');
}

/* --- UI helpers --- */
const $login   = document.getElementById('btn-login');
const $logout  = document.getElementById('btn-logout');
const $hello   = document.getElementById('hello');
const $profile = document.getElementById('profile');
const $today   = document.getElementById('today');

$login.onclick  = () => auth0.loginWithRedirect();
$logout.onclick = () => auth0.logout({ logoutParams:{ returnTo: window.location.origin }});

async function loadToday() {
  const res  = await fetch('/.netlify/functions/today');
  const list = await res.json();
  $today.innerHTML = list.map(v => `
      <li>
        <a href="https://youtu.be/${v.id}" target="_blank"
           onclick="markWatched('${v.id}')">${v.title}</a>
        <small>(${v.source})</small>
      </li>`).join('') || '<li>No hay nada nuevo hoy 🙌</li>';
}

window.markWatched = async id => {
  await fetch('/.netlify/functions/markWatched', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id })
  });
};

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

