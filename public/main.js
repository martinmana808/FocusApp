console.log('[App] main.js loaded');
document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] DOMContentLoaded fired, instantiating App...');
  try {
    new App();
    console.log('[App] App instantiated successfully!');
  } catch (e) {
    console.error('[App] Error instantiating App:', e);
  }
});
/* ─── MAIN APPLICATION ─────────────────────────────────────── */
import { CONFIG } from './config.js';
import { authManager } from './auth.js';
import VideoPlayer from './player.js';
import VideoList from './videoList.js';
import { renderFeedList } from './feeds.js';
import { showSpinner, hideSpinner } from './utils.js';

class App {
  constructor() {
    this.player = null;
    this.videoList = null;
    this.uiElements = {};
    
    console.log('[App] Instantiating App...');
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
      login: document.getElementById('btn-login'),
      logout: document.getElementById('btn-logout'),
      avatar: document.getElementById('avatar'),
      userInfo: document.getElementById('user-info'),
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
    showSpinner();
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
      await this.syncFeedsAndRefreshVideos();
    } catch (error) {
      console.error('Failed to add feed:', error);
      window.showToast(error.message);
    } finally {
      hideSpinner();
    }
  }

  // Add this helper method to sync feeds and refresh videos
  async syncFeedsAndRefreshVideos() {
    showSpinner();
    try {
      const token = await authManager.auth0.getTokenSilently();
      window.showToast('Syncing your feeds...');
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
    } finally {
      hideSpinner();
    }
  }

  async handleSyncFeeds() {
    showSpinner();
    window.showToast('Syncing your feeds...');
    try {
      const token = await authManager.auth0.getTokenSilently();
      const isAuthenticated = await authManager.isAuthenticated();
      console.log('[App] handleSyncFeeds: token:', token ? token.substring(0, 20) + '...' : 'null', 'isAuthenticated:', isAuthenticated);
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
    } finally {
      hideSpinner();
    }
  }

  async handleDeleteFeed(e) {
    if (e.target.dataset.action !== 'delete-feed') return;
    
    const feedId = e.target.dataset.id;
    const feedName = e.target.dataset.name;
    if (!feedId) return;

    if (!confirm(`Are you sure you want to delete the feed: ${feedName}?`)) return;

    showSpinner();
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
      
      // Refresh the feeds and videos without reloading
      this.loadUserFeeds(); // This will refresh the feed list
      await this.videoList.loadToday(); // This will refresh the video list

    } catch (error) {
      console.error('Error deleting feed:', error);
      window.showToast(`Error: ${error.message}`);
    } finally {
      hideSpinner();
    }
  }

  async loadUserFeeds() {
    showSpinner();
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
          <button data-id="${feed.id}" data-name="${feed.feed_title}" data-action="delete-feed" class="text-red-500 hover:text-red-700 text-xs ml-4">Delete</button>
        </li>
      `).join('');

    } catch (error) {
      console.error('Error loading user feeds:', error);
      this.uiElements.myFeedsList.innerHTML = `<li class="text-red-500">${error.message}</li>`;
    } finally {
      hideSpinner();
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

    // Render user info/avatar
    if (isAuthenticated) {
      const user = await authManager.getUser();
      // Avatar
      if (user.picture) {
        this.uiElements.avatar.innerHTML = `<img src="${user.picture}" alt="avatar" class="w-16 h-16 rounded-full object-cover">`;
      } else {
        this.uiElements.avatar.innerHTML = `<div class="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-2xl text-white">${user.given_name ? user.given_name[0] : ''}</div>`;
      }
      // Name, Surname, Logout
      this.uiElements.userInfo.innerHTML = `
        <div class="font-semibold">${user.given_name || ''} ${user.family_name || ''}</div>
        <button id="btn-logout" class="mt-2 bg-red-500 text-white px-3 py-1 rounded">Log out</button>
      `;
      // Attach logout event
      document.getElementById('btn-logout').onclick = () => authManager.logout();
      // --- Ensure feed list is rendered after auth ---
      try {
        // --- Sync all feeds once per session ---
        await syncAllFeedsOncePerSession();
      } catch (err) {
        console.error('[App] Error during feed sync:', err);
      }

      

      // TEST: Force getFeeds after authentication
      try {
        const token = await authManager.auth0.getTokenSilently();
        const res = await fetch('/.netlify/functions/getFeeds', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const feeds = await res.json();
        console.log('[TEST] Forced getFeeds result:', feeds);
        // Optionally, show in UI:
        // window.showToast('Fetched feeds: ' + JSON.stringify(feeds));
      } catch (err) {
        console.error('[TEST] Error forcing getFeeds:', err);
      }
          
      // --- Always render feeds after sync attempt ---
      try {
        await renderFeedList();
        console.log('[App] renderFeedList finished.');
      } catch (err) {
        console.error('[App] Error calling renderFeedList:', err);
      }
      // Optionally update sidebar feed list if needed
      // await this.loadUserFeeds();
    } else {
      this.uiElements.avatar.innerHTML = `<div class="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-2xl text-white">?</div>`;
      this.uiElements.userInfo.innerHTML = `<button id="btn-login" class="mt-2 bg-blue-500 text-white px-3 py-1 rounded">Log in</button>`;
      document.getElementById('btn-login').onclick = () => authManager.login();
    }

    // Load videos (show read-only list even without login)
    console.log('[App] Loading video list...');
    try {
      await this.videoList.loadToday();
      console.log('[App] Video list loaded.');
    } catch (err) {
      console.error('[App] Error loading video list:', err);
    }
  }
}

// Ensure App is instantiated on DOMContentLoaded
console.log('[App] Adding DOMContentLoaded listener for App instantiation...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] DOMContentLoaded fired, instantiating App...');
  new App();
});
