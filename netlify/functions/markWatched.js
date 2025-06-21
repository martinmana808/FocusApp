import db from './db.js';
export async function handler(event) {
  try {
    const { id } = JSON.parse(event.body || '{}');
    db.prepare('UPDATE videos SET watched = 1 WHERE id = ?').run(id);
    return { statusCode: 204 };
  } catch (err) {
    return { statusCode: 400, body: 'bad request' };
  }
};

