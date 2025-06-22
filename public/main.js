/* ─── MAIN APPLICATION ─────────────────────────────────────── */
import { CONFIG } from './config.js';
import AuthManager from './auth.js';
import VideoPlayer from './player.js';
import VideoList from './videoList.js';

class App {
  constructor() {
    this.auth = null;
    this.player = null;
    this.videoList = null;
    this.uiElements = {};
    
    this.init();
  }

  async init() {
    // Initialize UI element references
    this.setupUIElements();
    
    // Initialize components
    this.auth = new AuthManager();
    this.player = new VideoPlayer();
    this.videoList = new VideoList();
    
    // Wait for auth to be ready, then start the app
    await this.auth.init();
    this.start();
  }

  /**
   * Sets up references to UI elements
   */
  setupUIElements() {
    this.uiElements = {
      login: document.querySelector(CONFIG.UI.SELECTORS.LOGIN_BTN),
      logout: document.querySelector(CONFIG.UI.SELECTORS.LOGOUT_BTN),
      hello: document.querySelector(CONFIG.UI.SELECTORS.HELLO),
      profile: document.querySelector(CONFIG.UI.SELECTORS.PROFILE)
    };
  }

  /**
   * Starts the application
   */
  async start() {
    await this.refreshUI();
  }

  /**
   * Refreshes the UI based on authentication state
   */
  async refreshUI() {
    const isAuthenticated = await this.auth.isAuthenticated();

    // Update auth button visibility
    this.uiElements.login.style.display = isAuthenticated ? 'none' : 'inline-block';
    this.uiElements.logout.style.display = isAuthenticated ? 'inline-block' : 'none';

    // Load videos (show read-only list even without login)
    await this.videoList.loadToday();

    if (!isAuthenticated) {
      return;
    }

    // Show user info if authenticated
    const user = await this.auth.getUser();
    this.uiElements.hello.style.display = 'block';
    this.uiElements.hello.textContent = `Hi ${user.nickname}!`;
    this.uiElements.profile.textContent = JSON.stringify(user, null, 2);
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
}); 
