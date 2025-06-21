
import Parser from 'rss-parser';
import fs from 'fs';
import { join } from 'path';
import db from './db.js';

export const config = {
  schedule: '0 3 * * *'   // todos los días 03:00 UTC
};

const parser = new Parser();
const channels = JSON.parse(
  fs.readFileSync(join(process.cwd(), 'channels.json'), 'utf8')
);

export async function handler() {
  const today = new Date().toISOString().slice(0, 10);
  const insert = db.prepare(
    `INSERT OR IGNORE INTO videos
       (id,title,published_at,source,fetched_on)
     VALUES (?,?,?,?,?)`
  );

  for (const { id, name } of channels) {
    const url  = `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
    const feed = await parser.parseURL(url);

    feed.items.forEach(item => {
      const pub = item.isoDate.slice(0, 10);
      if (pub === today) {
        insert.run(item.id, item.title, item.isoDate, name, today);
      }
    });
  }

  return { statusCode: 200, body: 'ok' };
}

