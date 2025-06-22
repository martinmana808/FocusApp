/* ─── UTILITY FUNCTIONS ────────────────────────────────────── */

/**
 * Formats a timestamp into a human-readable relative time
 * @param {string} iso - ISO timestamp string
 * @returns {string} Formatted relative time
 */
export const fmtTime = iso => {
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return '—';

  const m  = 60 * 1000;
  const h  = 60 * m;
  const d  = 24 * h;
  const w  = 7 * d;
  const mo = 30 * d;
  const y  = 365 * d;

  const r = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

  if (diff < h)  return r.format(-Math.round(diff / m),  'minute');
  if (diff < d)  return r.format(-Math.round(diff / h),  'hour');
  if (diff < w)  return r.format(-Math.round(diff / d),  'day');
  if (diff < mo) return r.format(-Math.round(diff / w),  'week');
  if (diff < y)  return r.format(-Math.round(diff / mo), 'month');
  return r.format(-Math.round(diff / y), 'year');
};

/**
 * Cleans a video ID by removing the "yt:video:" prefix
 * @param {string} id - Raw video ID
 * @returns {string} Cleaned video ID
 */
export const cleanVideoId = id => id.replace(/^yt:video:/, ''); 
