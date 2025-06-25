import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';
import Parser from 'rss-parser';

const parser = new Parser();

async function getChannelIdFromHandle(handle) {
  // Remove leading @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API key not configured');
  // Use the search endpoint to find the channel by handle or custom name
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch channel info from YouTube API');
  const data = await res.json();
  if (!data.items || !data.items.length) throw new Error('No channel found for this handle');
  // Find the channel whose customUrl or title matches the handle (best effort)
  const match = data.items.find(item =>
    item.snippet.channelTitle.replace(/\s+/g, '').toLowerCase() === cleanHandle.toLowerCase() ||
    (item.snippet.customUrl && item.snippet.customUrl.toLowerCase() === cleanHandle.toLowerCase())
  ) || data.items[0];
  return match.snippet.channelId || match.id.channelId;
}

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
    if (feed_url.includes('youtube.com/channel/')) {
      const channelId = feed_url.split('/channel/')[1].split('/')[0];
      final_feed_url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    } else if (feed_url.includes('youtube.com/@')) {
      // Extract handle from URL
      const handle = feed_url.split('youtube.com/@')[1].split(/[/?#]/)[0];
      try {
        const channelId = await getChannelIdFromHandle(handle);
        final_feed_url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      } catch (err) {
        return { statusCode: 400, body: 'Could not resolve YouTube handle: ' + err.message };
      }
    } else if (feed_url.match(/youtube.com\/(user|c)\//)) {
      // /user/ or /c/ custom URLs
      const customName = feed_url.split(/youtube.com\/(user|c)\//)[1].split(/[/?#]/)[0];
      try {
        const channelId = await getChannelIdFromHandle(customName);
        final_feed_url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      } catch (err) {
        return { statusCode: 400, body: 'Could not resolve YouTube custom URL: ' + err.message };
      }
    } else if (feed_url.match(/youtube.com\/[A-Za-z0-9_-]+$/)) {
      // Root custom URLs like /TodoNoticias
      const customName = feed_url.split('youtube.com/')[1].split(/[/?#]/)[0];
      try {
        const channelId = await getChannelIdFromHandle(customName);
        final_feed_url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      } catch (err) {
        return { statusCode: 400, body: 'Could not resolve YouTube custom URL: ' + err.message };
      }
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
