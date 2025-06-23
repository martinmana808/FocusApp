import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';

export async function handler(event) {
  // 1. Proteger la ruta: solo GET y usuario autenticado
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const user_id = await getUserIdFromAuthHeader(event.headers);
  if (!user_id) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  try {
    // 2. Obtener los feeds del usuario desde la base de datos
    const { data, error } = await supabase
      .from('user_feeds')
      .select('id, feed_url, feed_title, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 3. Devolver la lista de feeds
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Error fetching user feeds:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch feeds.' }),
    };
  }
} 
