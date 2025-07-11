import { supabase } from './db.js';

export async function handler(event) {
  try {
    const { id } = JSON.parse(event.body ?? '{}');
    console.log('[markWatched] Received id:', id);
    if (!id) return { statusCode: 400, body: 'missing id' };

    // First get the current watched status
    const { data: currentVideo, error: fetchError } = await supabase
      .from('videos')
      .select('watched')
      .eq('id', id)
      .single();

    console.log('[markWatched] Fetch result:', currentVideo, fetchError);

    if (fetchError) {
      console.error('[markWatched] DB fetch error:', fetchError);
      return { statusCode: 500, body: 'db error (fetch)' };
    }
    if (!currentVideo) {
      console.error('[markWatched] No video found for id:', id);
      return { statusCode: 404, body: 'video not found' };
    }

    // Toggle the watched status
    const newWatchedStatus = !currentVideo.watched;

    const { error } = await supabase
      .from('videos')
      .update({ watched: newWatchedStatus })
      .eq('id', id);

    if (error) {
      console.error('[markWatched] DB update error:', error);
      return { statusCode: 500, body: 'db error (update)' };
    }

    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watched: newWatchedStatus })
    };
  } catch (err) {
    console.error('[markWatched] Exception:', err);
    return { statusCode: 400, body: 'invalid JSON' };
  }
}
