/* ─── MAIN APPLICATION ─────────────────────────────────────── */
import { CONFIG } from './config.js';
import { authManager } from './auth.js';
import VideoPlayer from './player.js';
import VideoList from './videoList.js';

class App {
  constructor() {
    this.player = null;
    this.videoList = null;
    this.uiElements = {};
    
    this.init();
  }

  async init() {
    console.log('[App] Initializing...');
    // Initialize UI element references
    this.setupUIElements();
    this.setupEventListeners();
    
    // Initialize components
    this.player = new VideoPlayer();
    this.videoList = new VideoList();
    
    // Esperar a que authManager esté listo (ya está inicializado en auth.js)
    this.start();
    console.log('[App] Initialization complete.');
  }

  /**
   * Sets up references to UI elements
   */
  setupUIElements() {
    this.uiElements = {
      login: document.querySelector(CONFIG.UI.SELECTORS.LOGIN_BTN),
      logout: document.querySelector(CONFIG.UI.SELECTORS.LOGOUT_BTN),
      hello: document.querySelector(CONFIG.UI.SELECTORS.HELLO),
      profile: document.querySelector(CONFIG.UI.SELECTORS.PROFILE),
      userActions: document.getElementById('user-actions'),
      addFeedForm: document.getElementById('add-feed-form'),
      feedUrlInput: document.getElementById('feed-url-input'),
      syncFeedsBtn: document.getElementById('sync-feeds-btn'),
      myFeedsList: document.getElementById('my-feeds-list'),
    };
  }

  setupEventListeners() {
    this.uiElements.addFeedForm.addEventListener('submit', this.handleAddFeed.bind(this));
    this.uiElements.syncFeedsBtn.addEventListener('click', this.handleSyncFeeds.bind(this));
    this.uiElements.myFeedsList.addEventListener('click', this.handleDeleteFeed.bind(this));
  }

  async handleAddFeed(e) {
    e.preventDefault();
    const url = this.uiElements.feedUrlInput.value.trim();
    if (!url) return;

    window.showToast('Adding feed...');
    try {
      const token = await authManager.auth0.getTokenSilently();
      const res = await fetch('/.netlify/functions/addFeed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feed_url: url }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to add feed`);
      }
      
      this.uiElements.feedUrlInput.value = '';
      window.showToast('Feed added! Syncing...');
      this.loadUserFeeds();
      await this.handleSyncFeeds();
    } catch (error) {
      console.error('Failed to add feed:', error);
      window.showToast(error.message);
    }
  }

  async handleSyncFeeds() {
    window.showToast('Syncing your feeds...');
    try {
      const token = await authManager.auth0.getTokenSilently();
      const res = await fetch('/.netlify/functions/fetchFeeds', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Sync failed');

      window.showToast('Sync complete! Refreshing list...');
      await this.videoList.loadToday();
    } catch (error) {
      console.error('Failed to sync feeds:', error);
      window.showToast(`Sync Error: ${error.message}`);
    }
  }

  async handleDeleteFeed(e) {
    if (e.target.dataset.action !== 'delete-feed') return;
    
    const feedId = e.target.dataset.id;
    if (!feedId) return;

    if (!confirm('Are you sure you want to delete this feed?')) return;

    try {
      window.showToast('Deleting feed...');
      const token = await authManager.auth0.getTokenSilently();
      const res = await fetch('/.netlify/functions/deleteFeed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feed_id: feedId }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to delete feed');
      }

      window.showToast('Feed deleted.');
      this.loadUserFeeds();

    } catch (error) {
      console.error('Error deleting feed:', error);
      window.showToast(`Error: ${error.message}`);
    }
  }

  async loadUserFeeds() {
    try {
      const token = await authManager.auth0.getTokenSilently();
      const res = await fetch('/.netlify/functions/getFeeds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not load feeds');
      const feeds = await res.json();
      
      this.uiElements.myFeedsList.innerHTML = feeds.map(feed => `
        <li class="flex justify-between items-center mb-1">
          <span class="truncate" title="${feed.feed_url}">${feed.feed_title || feed.feed_url}</span>
          <button data-id="${feed.id}" data-action="delete-feed" class="text-red-500 hover:text-red-700 text-xs ml-4">Delete</button>
        </li>
      `).join('');

    } catch (error) {
      console.error('Error loading user feeds:', error);
      this.uiElements.myFeedsList.innerHTML = `<li class="text-red-500">${error.message}</li>`;
    }
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
    console.log('[App] Refreshing UI...');
    const isAuthenticated = await authManager.isAuthenticated();
    console.log('[App] Is user authenticated?', isAuthenticated);

    // Update auth button visibility
    this.uiElements.login.style.display = isAuthenticated ? 'none' : 'inline-block';
    this.uiElements.logout.style.display = isAuthenticated ? 'inline-block' : 'none';
    this.uiElements.userActions.style.display = isAuthenticated ? 'block' : 'none';

    // Load user data and feeds if authenticated
    if (isAuthenticated) {
      this.loadUserFeeds();
      const user = await authManager.getUser();
      this.uiElements.hello.style.display = 'block';
      this.uiElements.hello.textContent = `Hi ${user.nickname}!`;
      this.uiElements.profile.textContent = JSON.stringify(user, null, 2);
    }

    // Load videos (show read-only list even without login)
    console.log('[App] Loading video list...');
    await this.videoList.loadToday();
    console.log('[App] Video list loaded.');

    if (!isAuthenticated) {
      this.uiElements.hello.style.display = 'none';
      this.uiElements.profile.textContent = '';
      console.log('[App] User is not authenticated. UI refresh finished.');
      return;
    }

    // Show user info if authenticated
    console.log('[App] User is authenticated, getting user data...');
    const user = await authManager.getUser();
    console.log('[App] User data:', user);
    this.uiElements.hello.style.display = 'block';
    this.uiElements.hello.textContent = `Hi ${user.nickname}!`;
    this.uiElements.profile.textContent = JSON.stringify(user, null, 2);
    console.log('[App] UI updated for authenticated user.');
  }
}

// --- App Initialization ---
function startApp() {
  console.log('[App] Starting application...');
  new App();
}

// This ensures the app starts correctly whether the script is fast or slow.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
} 
