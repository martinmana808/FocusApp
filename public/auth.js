/* --- CONFIG --- */
const DOMAIN    = 'dev-zy2v2vb4ic7m785h.us.auth0.com';
const CLIENT_ID = 'M7sLZlJKE7UEFsBPmgifptPtdH27RNnV';

import { createAuth0Client }
  from 'https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.2.0/dist/auth0-spa-js.production.esm.js';

const auth0 = await createAuth0Client({
  domain: DOMAIN,
  clientId: CLIENT_ID,
  authorizationParams: { redirect_uri: window.location.origin }
});

/* --- callback --- */
if (location.search.includes('code=') && location.search.includes('state=')) {
  await auth0.handleRedirectCallback();
  history.replaceState({}, '', '/');
}

/* --- UI refs --- */
const $login  = document.getElementById('btn-login');
const $logout = document.getElementById('btn-logout');
const $hello  = document.getElementById('hello');
const $profile= document.getElementById('profile');
const $today  = document.getElementById('today');
const $modal  = document.getElementById('playerModal');
const $frame  = document.getElementById('playerFrame');

$login.onclick  = () => auth0.loginWithRedirect();
$logout.onclick = () => auth0.logout({ logoutParams:{ returnTo: window.location.origin }});

/* --- helpers --- */
const fmtTime = iso =>
  iso ? new Date(iso).toLocaleString('en-NZ',{ hour:'2-digit', minute:'2-digit'}) : '';

function openPlayer(id){
  $frame.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
  $modal.showModal();
}
$modal.addEventListener('close', ()=> $frame.src='');

/* --- cargar últimas 24 h --- */
async function loadToday(){
  const res  = await fetch('/.netlify/functions/today');
  const list = await res.json();

  $today.innerHTML = list.length
    ? list.map(v => `
        <li id="v-${v.id}" class="bg-white shadow p-4 rounded mb-3 ${v.watched?'opacity-50':''}">
          <button onclick="openPlayer('${v.id}'); markWatched('${v.id}');"
                  class="text-blue-600 font-medium hover:underline">
            ${v.title}
          </button>
          <p class="text-sm text-gray-500">
            ${v.source} • ${fmtTime(v.published_at) || ''}
          </p>
        </li>`).join('')
    : '<li class="text-gray-500">No hay nada nuevo hoy 🙌</li>';
}

/* --- marcar visto sin eliminar --- */
window.markWatched = async id => {
  await fetch('/.netlify/functions/markWatched', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id })
  });
  document.getElementById(`v-${id}`)?.classList.add('opacity-50');
};

/* --- session --- */
async function refreshUI(){
  const ok = await auth0.isAuthenticated();
  $login.style.display  = ok ? 'none':'inline-block';
  $logout.style.display = ok ? 'inline-block':'none';

  if(!ok) return;

  const user = await auth0.getUser();
  $hello.style.display = 'block';
  $hello.textContent   = `Hola, ${user.nickname}!`;
  $profile.textContent = JSON.stringify(user,null,2);

  loadToday();
}
refreshUI();
