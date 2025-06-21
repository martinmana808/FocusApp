import supabase from './db.js';

export async function handler() {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('videos')
    .select('id,title,source')
    .eq('fetched_on', today)
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
