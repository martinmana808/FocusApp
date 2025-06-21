/* Opción 1 – jsDelivr */
import { createAuth0Client } from
  'https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.2.0/dist/auth0-spa-js.production.esm.js';



/* --- CONFIG --- */
const DOMAIN    = 'dev-zy2v2vb4ic7m785h.us.auth0.com';   // AUTH0_DOMAIN
const CLIENT_ID = 'M7sLZlJKE7UEFsBPmgifptPtdH27RNnV';             // AUTH0_CLIENT_ID

const auth0 = await createAuth0Client({
  domain: DOMAIN,
  clientId: CLIENT_ID,
  authorizationParams: { redirect_uri: window.location.origin }
});

/* --- redirección de vuelta --- */
if (window.location.search.includes('code=')
    && window.location.search.includes('state=')) {
  await auth0.handleRedirectCallback();
  window.history.replaceState({}, '', '/');   // limpia querystring
}

/* --- helpers UI --- */
const $login   = document.getElementById('btn-login');
const $logout  = document.getElementById('btn-logout');
const $hello   = document.getElementById('hello');
const $profile = document.getElementById('profile');

$login.onclick  = () => auth0.loginWithRedirect();
$logout.onclick = () => auth0.logout({ logoutParams:{ returnTo: window.location.origin }});

async function refreshUI () {
  if (await auth0.isAuthenticated()) {
    const user = await auth0.getUser();
    $login.style.display  = 'none';
    $logout.style.display = 'inline-block';
    $hello.style.display  = 'block';
    $hello.textContent    = `Hola, ${user.nickname}!`;
    $profile.textContent  = JSON.stringify(user, null, 2);
  } else {
    $login.style.display  = 'inline-block';
    $logout.style.display = 'none';
    $hello.style.display  = 'none';
    $profile.textContent  = '';
  }
}
refreshUI();
