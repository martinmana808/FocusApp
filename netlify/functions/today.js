import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';

export async function handler(event) {
  const user_id = await getUserIdFromAuthHeader(event.headers);
  if (!user_id) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // Parse range from query string
  const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
  const range = url.searchParams.get('range') || 'week';

  let since;
  const now = new Date();
  if (range === 'today') {
    // Start of today
    since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  } else if (range === 'month') {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  } else { // 'week' or default
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  let query = supabase
    .from('videos')
    .select('id,title,source,published_at,watched,saved_for_later')
    .eq('user_id', user_id)
    .order('published_at', { ascending: false });

  if (range === 'today') {
    query = query.gte('published_at', since);
  } else {
    query = query.gte('published_at', since);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return { statusCode: 500, body: 'db error' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? []),
  };
}
