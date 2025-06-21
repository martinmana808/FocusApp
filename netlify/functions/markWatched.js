import supabase from './db.js';

export async function handler(event) {
  try {
    const { id } = JSON.parse(event.body ?? '{}');
    if (!id) return { statusCode: 400, body: 'missing id' };

    const { error } = await supabase
      .from('videos')
      .update({ watched: true })
      .eq('id', id);

    if (error) {
      console.error(error);
      return { statusCode: 500, body: 'db error' };
    }

    return { statusCode: 204 };            // ← vacío = OK
  } catch {
    return { statusCode: 400, body: 'invalid JSON' };
  }
}
