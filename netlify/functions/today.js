import db from './db.js';
export async function handler() {
  const today = new Date().toISOString().slice(0, 10);
  const rows  = db.prepare(
    `SELECT id,title,source
       FROM videos
      WHERE fetched_on = ? AND watched = 0
      ORDER BY published_at DESC`
  ).all(today);

  return {
    statusCode: 200,
    headers:    { 'Content-Type': 'application/json' },
    body:       JSON.stringify(rows)
  };
};

