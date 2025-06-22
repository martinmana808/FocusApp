import { supabase } from './db.js';

export async function handler() {
  try {
    const { error } = await supabase
      .from('videos')
      .update({ watched: false })
      .eq('watched', true);

    if (error) {
      console.error(error);
      return { statusCode: 500, body: 'db error' };
    }

    return { statusCode: 200, body: 'All videos reset successfully' };
  } catch (error) {
    console.error('Error resetting videos:', error);
    return { statusCode: 500, body: 'server error' };
  }
} 
