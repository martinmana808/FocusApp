import Parser from 'rss-parser';
import { supabase } from './db.js';
import { getUserIdFromAuthHeader } from './auth.js';

const parser = new Parser();

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const user_id = await getUserIdFromAuthHeader(event.headers);
  if (!user_id) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  let feed_id;
  try {
    const body = JSON.parse(event.body);
    feed_id = body.feed_id;
    if (!feed_id) {
      return { statusCode: 400, body: 'Missing feed_id' };
    }
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Get the feed URL for this feed_id and user
  const { data: feed, error: feedError } = await supabase
    .from('user_feeds')
    .select('id, feed_url')
    .eq('id', feed_id)
    .eq('user_id', user_id)
    .single();
  if (feedError || !feed) {
    return { statusCode: 404, body: 'Feed not found' };
  }

  try {
    const parsedFeed = await parser.parseURL(feed.feed_url);
    if (!parsedFeed?.items) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }
    const videosToInsert = parsedFeed.items.map(item => ({
      id: item.guid || item.id,
      user_id: user_id,
      feed_id: feed.id,
      title: item.title,
      source: parsedFeed.title,
      published_at: item.isoDate,
    }));
    let insertedVideos = [];
    if (videosToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('videos')
        .insert(videosToInsert, { onConflict: 'id,user_id' })
        .select();
      if (insertError) {
        return { statusCode: 500, body: 'Failed to insert videos' };
      }
      insertedVideos = inserted;
    }
    return {
      statusCode: 200,
      body: JSON.stringify(insertedVideos),
    };
  } catch (error) {
    return { statusCode: 500, body: 'Failed to fetch or insert videos' };
  }
} 
