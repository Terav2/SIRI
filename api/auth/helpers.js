import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

const redis = new Redis({
  url: process.env.Sio_KV_REST_API_URL,
  token: process.env.Sio_KV_REST_API_TOKEN,
});

// Parse cookies from request
function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

export async function getUser(req) {
  const cookies = parseCookies(req);
  const sessionToken = cookies.sio_session;

  if (!sessionToken) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      sessionToken,
      process.env.JWT_SECRET || 'sio-secret-key-change-in-production'
    );

    const user = await redis.get(`user:${decoded.email}`);
    return user;
  } catch (error) {
    return null;
  }
}

export async function trackUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  const usageKey = `usage:${userId}:${today}`;
  
  // Increment usage
  const usage = await redis.incr(usageKey);
  
  // Set expiry to 25 hours (to handle timezone edge cases)
  await redis.expire(usageKey, 25 * 60 * 60);
  
  return usage;
}

export async function getUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  const usageKey = `usage:${userId}:${today}`;
  const usage = await redis.get(usageKey);
  return usage || 0;
}

