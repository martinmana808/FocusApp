import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';

export async function handler(event) {
  // 1. Proteger la ruta: solo POST y usuario autenticado
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const user_id = await getUserIdFromAuthHeader(event.headers);
  if (!user_id) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  try {
    const { feed_id } = JSON.parse(event.body);
    if (!feed_id) {
      return { statusCode: 400, body: 'Missing feed_id' };
    }

    // Primero, eliminar los videos asociados a este feed y usuario
    const { error: videoDeleteError } = await supabase
      .from('videos')
      .delete()
      .eq('feed_id', feed_id)
      .eq('user_id', user_id);
    if (videoDeleteError) throw videoDeleteError;

    // 2. Eliminar el feed, asegurándose de que coincida tanto el id del feed como el id del usuario
    const { error } = await supabase
      .from('user_feeds')
      .delete()
      .eq('id', feed_id)
      .eq('user_id', user_id); // <-- ¡Medida de seguridad CRÍTICA!

    if (error) throw error;

    // 3. Devolver una respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Feed deleted successfully.' }),
    };

  } catch (error) {
    console.error('Error deleting feed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete feed.' }),
    };
  }
} 
