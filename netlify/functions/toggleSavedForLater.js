import { supabase } from './db.js';

export async function handler(event) {
  try {
    const { id } = JSON.parse(event.body ?? '{}');
    if (!id) return { statusCode: 400, body: 'missing id' };

    // Get current saved_for_later value
    const { data: currentVideo, error: fetchError } = await supabase
      .from('videos')
      .select('saved_for_later')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('[toggleSavedForLater] DB fetch error:', fetchError);
      return { statusCode: 500, body: 'db error (fetch)' };
    }
    if (!currentVideo) {
      console.error('[toggleSavedForLater] No video found for id:', id);
      return { statusCode: 404, body: 'video not found' };
    }

    // Toggle the saved_for_later status
    const newSavedStatus = !currentVideo.saved_for_later;

    const { error } = await supabase
      .from('videos')
      .update({ saved_for_later: newSavedStatus })
      .eq('id', id);

    if (error) {
      console.error('[toggleSavedForLater] DB update error:', error);
      return { statusCode: 500, body: 'db error (update)' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved_for_later: newSavedStatus })
    };
  } catch (err) {
    console.error('[toggleSavedForLater] Exception:', err);
    return { statusCode: 400, body: 'invalid JSON' };
  }
} 
