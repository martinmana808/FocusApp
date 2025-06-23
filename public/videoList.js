/* ─── VIDEO LIST COMPONENT ────────────────────────────────── */
import { CONFIG } from './config.js';
import { fmtTime, cleanVideoId } from './utils.js';
import { authManager } from './auth.js'; // Import authManager to get tokens

class VideoList {
  constructor() {
    this.containerNew = document.getElementById('new');
    this.containerSaved = document.getElementById('saved');
    this.videos = [];
    this.init();
  }

  init() {
    // Make markWatched available globally
    window.markWatched = (id) => this.markWatched(id);
    // Make resetWatched available globally
    window.resetWatched = () => this.resetWatched();
    window.toggleSavedForLater = (id) => this.toggleSavedForLater(id);
  }

  /**
   * Loads and displays today's videos
   */
  async loadToday() {
    try {
      const headers = {};
      const token = await authManager.auth0.getTokenSilently();
      headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.TODAY}`, { headers });
      
      if (!res.ok) {
        // If the server returns an error, don't try to parse JSON
        throw new Error(`Failed to load videos: ${res.status} ${res.statusText}`);
      }
      
      const list = await res.json();
      this.videos = list;
      this.render(list);
    } catch (error) {
      console.error('Error loading videos:', error);
      this.containerNew.innerHTML = `<li class="text-red-500">Could not load videos. Are you logged in?</li>`;
      this.containerSaved.innerHTML = '';
      this.updateBadges(0, 0);
    }
  }

  /**
   * Renders the video list
   * @param {Array} videos - Array of video objects
   */
  render(videos) {
    if (!videos.length) {
      this.containerNew.innerHTML = '<li class="text-gray-500">No new videos 🙌</li>';
      this.containerSaved.innerHTML = '';
      this.updateBadges(0, 0);
      return;
    }

    // Sort videos by published date (newest first)
    videos.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    // Split videos into two columns
    const newVideos = videos.filter(v => !v.saved_for_later);
    const savedVideos = videos.filter(v => v.saved_for_later);
    this.containerNew.innerHTML = newVideos.map(video => this.renderVideoCard(video, false)).join('');
    this.containerSaved.innerHTML = savedVideos.map(video => this.renderVideoCard(video, true)).join('');
    this.updateBadges(newVideos.length, savedVideos.length);
  }

  updateBadges(newCount, savedCount) {
    const badgeNew = document.getElementById('badge-new');
    const badgeSaved = document.getElementById('badge-saved');
    const badgeNewMobile = document.getElementById('badge-new-mobile');
    const badgeSavedMobile = document.getElementById('badge-saved-mobile');
    if (badgeNew) badgeNew.textContent = newCount;
    if (badgeSaved) badgeSaved.textContent = savedCount;
    if (badgeNewMobile) badgeNewMobile.textContent = newCount;
    if (badgeSavedMobile) badgeSavedMobile.textContent = savedCount;
  }

  /**
   * Renders a single video card
   * @param {Object} video - Video object
   * @param {boolean} isSaved - Whether the video is saved for later
   * @returns {string} HTML string for the video card
   */
  renderVideoCard(video, isSaved) {
    const cleanId = cleanVideoId(video.id);
    const watchedClass = video.watched ? 'bg-green-500 text-white' : 'bg-gray-200';
    const buttonText = video.watched ? 'Watched' : 'Mark as viewed';
    const savedBtnText = isSaved ? 'Remove' : 'Watch later';
    
    return `
      <li id="v-${cleanId}" class="bg-white shadow p-4 rounded mb-3">
        <img src="https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg"
             alt="${video.title}"
             class="mb-2 w-full rounded">
        <button onclick="openPlayer('${video.id}');"
                class="text-left w-full text-blue-600 font-medium hover:underline">
          ${video.title}
        </button>
        <p class="text-sm text-gray-500">
          ${video.source} • ${fmtTime(video.published_at)}
        </p>
        <div class="mt-2">
          <button onclick="markWatched('${video.id}')" class="text-xs px-2 py-1 rounded ${watchedClass}">${buttonText}</button>
          <button onclick="toggleSavedForLater('${video.id}')" class="text-xs bg-gray-200 px-2 py-1 rounded ml-2">${savedBtnText}</button>
        </div>
      </li>`;
  }

  /**
   * Marks a video as watched/unwatched (toggles status)
   * @param {string} id - Video ID
   */
  async markWatched(id) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = await authManager.auth0.getTokenSilently();
      headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.MARK_WATCHED}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        const { watched } = await response.json();
        // Update the video in memory
        const idx = this.videos.findIndex(v => v.id === id);
        if (idx !== -1) {
          this.videos[idx].watched = watched;
          // Re-render only this card
          const cleanId = cleanVideoId(id);
          const videoElement = document.getElementById(`v-${cleanId}`);
          if (videoElement) {
            videoElement.outerHTML = this.renderVideoCard(this.videos[idx], this.videos[idx].saved_for_later);
          }
        }
      }
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  }

  /**
   * Resets all watched videos to unwatched
   */
  async resetWatched() {
    try {
      const headers = {};
      const token = await authManager.auth0.getTokenSilently();
      headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${CONFIG.API.BASE_URL}/resetWatched`, {
        method: 'POST',
        headers: headers
      });
      
      if (response.ok) {
        // Reload the video list to reflect the changes
        await this.loadToday();
        console.log('All videos reset successfully');
      } else {
        console.error('Failed to reset videos');
      }
    } catch (error) {
      console.error('Error resetting videos:', error);
    }
  }

  async toggleSavedForLater(id) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = await authManager.auth0.getTokenSilently();
      headers['Authorization'] = `Bearer ${token}`;

      const idx = this.videos.findIndex(v => v.id === id);
      if (idx === -1) return;
      const video = this.videos[idx];
      const wasSaved = video.saved_for_later;
      const response = await fetch('/.netlify/functions/toggleSavedForLater', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        const { saved_for_later } = await response.json();
        this.videos[idx].saved_for_later = saved_for_later;
        this.render(this.videos);
        if (saved_for_later && !wasSaved) {
          window.showToast && window.showToast('Video saved for later');
        } else if (!saved_for_later && wasSaved) {
          window.showToast && window.showToast('Video moved back to New');
        }
      }
    } catch (error) {
      console.error('Error toggling saved for later:', error);
    }
  }
}

export default VideoList; 
