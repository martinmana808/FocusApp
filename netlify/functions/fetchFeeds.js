import Parser from 'rss-parser';
import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';

/**
 * ⏰  Se ejecuta a las 03:00 UTC todos los días
 *     (puedes mover el cron cambiando el string).
 */
export const config = { schedule: '0 3 * * *' };

const parser = new Parser();

export async function handler(event) {
  console.log('[fetchFeeds] Starting...');
  // 1. Identificar al usuario
  const user_id = await getUserIdFromAuthHeader(event.headers);
  if (!user_id) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  console.log('[fetchFeeds] User ID:', user_id);

  try {
    // 2. Obtener los feeds del usuario desde la base de datos
    const { data: userFeeds, error: feedsError } = await supabase
      .from('user_feeds')
      .select('id, feed_url')
      .eq('user_id', user_id);

    if (feedsError) throw feedsError;
    console.log('[fetchFeeds] User feeds:', userFeeds);

    let newVideosCount = 0;

    // 3. Iterar sobre cada feed del usuario
    for (const feed of userFeeds) {
      console.log('[fetchFeeds] Processing feed:', feed);
      const parsedFeed = await parser.parseURL(feed.feed_url);

      if (!parsedFeed?.items) {
        console.log('[fetchFeeds] No items in feed:', feed.feed_url);
        continue;
      }

      // 4. Preparar los videos para guardarlos en la base de datos
      const videosToInsert = parsedFeed.items.map(item => ({
        id: item.guid || item.id,
        user_id: user_id,
        feed_id: feed.id, // Nuevo: asociar el video al feed
        title: item.title,
        source: parsedFeed.title,
        published_at: item.isoDate,
      }));

      console.log('[fetchFeeds] First video to insert:', videosToInsert[0]);

      if (videosToInsert.length > 0) {
        // 5. Insertar los videos en la tabla, ignorando duplicados para ese usuario
        //    gracias a la clave primaria (id, user_id)
        const { error: insertError } = await supabase
          .from('videos')
          .insert(videosToInsert, { onConflict: 'id,user_id' });
        
        if (insertError) {
          console.warn(`Could not insert videos for feed ${feed.feed_url}:`, insertError.message);
        } else {
          newVideosCount += videosToInsert.length;
          console.log('[fetchFeeds] Inserted videos count:', newVideosCount);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Sync complete. Found ${newVideosCount} new videos.` }),
    };

  } catch (error) {
    console.error('Error fetching or processing feeds:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process feeds.' }),
    };
  }
}
