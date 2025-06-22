import Parser from 'rss-parser';
import fs from 'fs';
import { join } from 'path';
import { supabase } from './db.js';

/**
 * ⏰  Se ejecuta a las 03:00 UTC todos los días
 *     (puedes mover el cron cambiando el string).
 */
export const config = { schedule: '0 3 * * *' };

const parser   = new Parser();
// leemos channels.json desde la raíz del proyecto
const channels = JSON.parse(
  fs.readFileSync(join(process.cwd(), 'channels.json'), 'utf8'),
);

export async function handler() {
  const today = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD

  for (const { id: channelId, name } of channels) {
    const url  = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    try {
      const feed = await parser.parseURL(url);
 
      // insertamos/actualizamos cada video del día
      for (const item of feed.items ?? []) {
        if (item.isoDate?.startsWith(today)) {
          const videoId = item.id.replace('yt:video:', ''); // <-- NUEVO
          await supabase.from('videos').upsert(
            {
              id:           videoId,
              title:        item.title,
              published_at: item.isoDate,
              source:       name,
              fetched_on:   today,
            },
            { onConflict: 'id' },        // evita duplicados
          );
        }
      }
    } catch (err) {
      console.error('RSS error', channelId, err.message);
    }
  }

  return { statusCode: 200, body: 'ok' };
}
