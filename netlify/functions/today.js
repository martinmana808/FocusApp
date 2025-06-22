import { supabase } from './db.js';

export async function handler() {
  const now       = Date.now();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();


  const { data, error } = await supabase
    .from('videos')
    .select('id,title,source')
    .gte('published_at', yesterday)   // ≥ hace 24 h
    .eq('watched', false)
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
