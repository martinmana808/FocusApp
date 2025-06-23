import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';

export async function handler(event) {
  const user_id = await getUserIdFromAuthHeader(event.headers);
  if (!user_id) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // últimos 7 días (7 * 24 h)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('videos')
    .select('id,title,source,published_at,watched,saved_for_later')
    .eq('user_id', user_id)
    .gte('published_at', sevenDaysAgo)          // últimos 7 días
    .order('published_at', { ascending: false });

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
