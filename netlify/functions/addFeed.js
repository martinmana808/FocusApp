import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';
import Parser from 'rss-parser';

const parser = new Parser();

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
    const { feed_url } = JSON.parse(event.body);
    if (!feed_url) {
      return { statusCode: 400, body: 'Missing feed_url' };
    }

    let final_feed_url = feed_url;

    // --- YouTube URL Conversion ---
    // Si es una URL de canal de YouTube, la convertimos a una URL de feed RSS.
    if (feed_url.includes('youtube.com/channel/')) {
      const channelId = feed_url.split('/channel/')[1].split('/')[0];
      final_feed_url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    } else if (feed_url.includes('youtube.com/@')) {
      // Por ahora, las URLs con @handle no se pueden convertir directamente sin la API de YouTube.
      // Devolvemos un error claro al usuario.
      return { statusCode: 400, body: 'YouTube @handle URLs are not supported yet. Please find the channel URL with the ID (e.g., /channel/UC...).' };
    }
    
    // (Opcional pero recomendado) Validar que la URL es un feed real
    let feedTitle = 'Untitled Feed';
    try {
      const parsedFeed = await parser.parseURL(final_feed_url);
      feedTitle = parsedFeed.title;
    } catch (e) {
      return { statusCode: 400, body: 'Invalid or unreachable feed URL' };
    }

    // 2. Insertar el nuevo feed en la tabla user_feeds
    const { data, error } = await supabase
      .from('user_feeds')
      .insert({
        user_id: user_id,
        feed_url: final_feed_url,
        feed_title: feedTitle
      })
      .select()
      .single();

    if (error) {
      // Manejar el caso de que el feed ya exista para ese usuario (gracias al UNIQUE constraint)
      if (error.code === '23505') { // Código de violación de unicidad en Postgres
        return { statusCode: 409, body: 'Feed already exists for this user.' };
      }
      throw error;
    }

    // 3. Devolver el feed recién creado
    return {
      statusCode: 201, // 201 Created
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Error adding feed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add feed.' }),
    };
  }
} 
