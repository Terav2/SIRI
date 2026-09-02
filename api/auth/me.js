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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies(req);
    const sessionToken = cookies.sio_session;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify session
    const decoded = jwt.verify(
      sessionToken,
      process.env.JWT_SECRET || 'sio-secret-key-change-in-production'
    );

    // Get user from Redis
    const user = await redis.get(`user:${decoded.email}`);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `usage:${user.id}:${today}`;
    const todayUsage = await redis.get(usageKey);

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      usage: {
        today: todayUsage || 0,
        limit: 20, // Free tier limit
        remaining: 20 - (todayUsage || 0),
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
