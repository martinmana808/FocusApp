/* ─── VIDEO PLAYER MODAL ──────────────────────────────────── */
import { CONFIG } from './config.js';

class VideoPlayer {
  constructor() {
    this.modal = document.querySelector(CONFIG.UI.SELECTORS.MODAL);
    this.frame = document.querySelector(CONFIG.UI.SELECTORS.FRAME);
    this.closeBtn = document.querySelector(CONFIG.UI.SELECTORS.CLOSE_MODAL);
    
    this.init();
  }

  init() {
    // Set up event listeners
    this.closeBtn?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('close', () => this.resetFrame());
    
    // Make openPlayer available globally
    window.openPlayer = (idRaw) => this.open(idRaw);
  }

  /**
   * Opens a video in the modal player
   * @param {string} idRaw - Raw video ID (may include yt:video: prefix)
   */
  open(idRaw) {
    const id = idRaw.replace(/^yt:video:/, ''); // Clean prefix if present
    const url = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
    
    if (this.modal.showModal) {
      // Modern browsers with <dialog> support
      this.frame.src = url;
      this.modal.showModal();
    } else {
      // Fallback for Safari, IE
      window.open(`https://youtu.be/${id}`, '_blank');
    }
  }

  /**
   * Closes the modal
   */
  close() {
    this.modal?.close();
  }

  /**
   * Resets the iframe source when modal closes
   */
  resetFrame() {
    this.frame.src = '';
  }
}

export default VideoPlayer; 
