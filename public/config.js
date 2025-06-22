/* ─── CONFIGURATION ────────────────────────────────────────── */
export const CONFIG = {
  AUTH0: {
    DOMAIN: 'dev-zy2v2vb4ic7m785h.us.auth0.com',
    CLIENT_ID: 'M7sLZlJKE7UEFsBPmgifptPtdH27RNnV',
    REDIRECT_URI: window.location.origin
  },
  API: {
    BASE_URL: '/.netlify/functions',
    ENDPOINTS: {
      TODAY: '/today',
      MARK_WATCHED: '/markWatched'
    }
  },
  UI: {
    SELECTORS: {
      LOGIN_BTN: '#btn-login',
      LOGOUT_BTN: '#btn-logout',
      HELLO: '#hello',
      PROFILE: '#profile',
      TODAY: '#today',
      MODAL: '#playerModal',
      FRAME: '#playerFrame',
      CLOSE_MODAL: '#closeModal'
    }
  }
}; 
