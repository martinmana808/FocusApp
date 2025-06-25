console.log('[Feeds] feeds.js loaded');
import { authManager } from './auth.js';
import { showSpinner, hideSpinner } from './utils.js';

// Utility to get DOM elements
function $(selector) {
  return document.querySelector(selector);
}

const addFeedForm = document.getElementById('add-feed-form');
console.log('[Feeds] addFeedForm:', addFeedForm);

async function fetchFeeds() {
  console.log('[Feeds] Fetching feeds...');
  const isAuthenticated = await authManager.isAuthenticated();
  if (!isAuthenticated) {
    console.log('[Feeds] Not authenticated, returning empty feed list.');
    return [];
  }
  const token = await authManager.auth0.getTokenSilently();
  const res = await fetch('/.netlify/functions/getFeeds', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    console.warn('[Feeds] Failed to fetch feeds:', res.status);
    return [];
  }
  const data = await res.json();
  console.log('[Feeds] Fetched feeds:', data);
  return data;
}

async function addFeed(feedUrl) {
  showSpinner();
  try {
    console.log('[Feeds] Adding feed:', feedUrl);
    const token = await authManager.auth0.getTokenSilently();
    const res = await fetch('/.netlify/functions/addFeed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feed_url: feedUrl }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Feeds] Error adding feed:', errText);
      throw new Error(errText);
    }
    const data = await res.json();
    console.log('[Feeds] Feed added:', data);
    await syncSingleFeedAndRenderVideos(data.id);
    return data;
  } finally {
    hideSpinner();
  }
}

// Helper to sync a single feed and render its videos
async function syncSingleFeedAndRenderVideos(feedId) {
  showSpinner();
  try {
    const token = await authManager.auth0.getTokenSilently();
    window.showToast('Syncing new feed...');
    const res = await fetch('/.netlify/functions/syncFeed', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ feed_id: feedId })
    });
    if (!res.ok) throw new Error('Sync failed');
    const videos = await res.json();
    window.showToast('Feed synced!');
    renderNewFeedVideos(videos);
  } catch (error) {
    console.error('[Feeds] Failed to sync new feed:', error);
    window.showToast(`Sync Error: ${error.message}`);
  } finally {
    hideSpinner();
  }
}

// Helper to render just the new feed's videos (append to video list)
function renderNewFeedVideos(videos) {
  if (!Array.isArray(videos) || !videos.length) return;
  // You may need to adapt this to your video list rendering logic
  if (window.app && window.app.videoList && window.app.videoList.appendVideos) {
    window.app.videoList.appendVideos(videos);
  } else if (typeof renderVideoList === 'function') {
    renderVideoList(videos, { append: true });
  } else {
    // fallback: log
    console.log('[Feeds] New feed videos:', videos);
  }
}

// Exported function to do a full sync on first page load (per session)
export async function syncAllFeedsOncePerSession() {
  if (sessionStorage.getItem('feedsSynced')) return;
  showSpinner();
  try {
    const token = await authManager.auth0.getTokenSilently();
    window.showToast('Syncing all feeds (first load)...');
    const res = await fetch('/.netlify/functions/fetchFeeds', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Full sync failed');
    sessionStorage.setItem('feedsSynced', '1');
    window.showToast('All feeds synced!');
  } catch (error) {
    console.error('[Feeds] Failed to sync all feeds:', error);
    window.showToast(`Sync Error: ${error.message}`);
  } finally {
    hideSpinner();
  }
}

async function deleteFeed(feedId) {
  console.log('[Feeds] Deleting feed:', feedId);
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
    const errText = await res.text();
    console.error('[Feeds] Error deleting feed:', errText);
    throw new Error(errText);
  }
  console.log('[Feeds] Feed deleted:', feedId);
}

export async function renderFeedList() {
  console.log('[Feeds] Rendering feed list...');
  const feedList = $('.feed-list');
  if (!feedList) {
    console.warn('[Feeds] .feed-list not found in DOM');
    return;
  }
  feedList.innerHTML = '<div class="text-gray-400 text-sm">Loading...</div>';
  const feeds = await fetchFeeds();
  console.log('[Feeds] Feeds loaded:', feeds);
  if (!feeds.length) {
    feedList.innerHTML = '<div class="text-gray-400 text-sm">No feeds yet.</div>';
    return;
  }
  feedList.innerHTML = feeds.map(feed => `
    <div class="feed-item flex items-center justify-between p-2 rounded" data-id="${feed.id}" data-title="${feed.feed_title}">
      <div class="flex items-center">
        <div class="w-8 h-8 flex items-center justify-center text-blue-500 mr-2">
          <i class="ri-rss-line"></i>
        </div>
        <span>${feed.feed_title || feed.feed_url}</span>
      </div>
      <button class="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center delete-feed-btn">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `).join('');
  // Attach delete handlers
  feedList.querySelectorAll('.delete-feed-btn').forEach(btn => {
    btn.onclick = async function() {
      const feedItem = this.closest('.feed-item');
      const feedId = feedItem.getAttribute('data-id');
      const feedTitle = feedItem.getAttribute('data-title');
      if (confirm(`Are you sure you want to delete the feed: ${feedTitle}?`)) {
        try {
          await deleteFeed(feedId);
          renderFeedList();
          window.showToast('Feed deleted');
        } catch (err) {
          window.showToast('Error: ' + err.message);
        }
      }
    };
  });
}

function setupAddFeed() {
  const addFeedForm = document.getElementById('add-feed-form');
  const feedInput = document.getElementById('feed-url-input');
  console.log('[Feeds] setupAddFeed called. addFeedForm:', addFeedForm, 'feedInput:', feedInput);
  if (!addFeedForm) {
    console.warn('[Feeds] add-feed-form not found in DOM');
    return;
  }
  if (!feedInput) {
    console.warn('[Feeds] feed-url-input not found in DOM');
    return;
  }
  console.log('[Feeds] Add feed form and input found.');
  console.log('[Feeds] About to attach submit handler:', addFeedForm);
  addFeedForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[Feeds] Add feed form submitted. Value:', feedInput.value);
    const url = feedInput.value.trim();
    console.log('[Feeds] Add feed form submitted. Value:', url);
    if (!url) return window.showToast('Please enter a feed URL');
    try {
      await addFeed(url);
      feedInput.value = '';
      window.showToast('Feed added!');
      renderFeedList();
    } catch (err) {
      window.showToast('Error: ' + err.message);
    }
  });
  console.log('[Feeds] Submit handler attached:', addFeedForm);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Feeds] DOMContentLoaded fired');
  setupAddFeed();
  // renderFeedList(); // Removed: now called after authentication in main.js
});

setTimeout(setupAddFeed, 1000); 
