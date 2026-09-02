import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify token exists in Redis
    const magicData = await redis.get(`magic:${token}`);
    if (!magicData) {
      return res.status(400).json({ error: 'Invalid or expired magic link' });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'sio-secret-key-change-in-production'
    );

    // Create session (7 days)
    const sessionToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET || 'sio-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Delete magic link token (one-time use)
    await redis.del(`magic:${token}`);

    // Set session cookie
    res.setHeader(
      'Set-Cookie',
      `sio_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    // Redirect to home page
    res.redirect('/');
  } catch (error) {
    console.error('Verify error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Magic link expired' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

