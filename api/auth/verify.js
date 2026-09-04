import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

const redis = new Redis({
  url: process.env.Sio_KV_REST_API_URL,
  token: process.env.Sio_KV_REST_API_TOKEN,
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

    const magicData = await redis.get(`magic:${token}`);
    if (!magicData) {
      return res.status(400).json({ error: 'Invalid or expired magic link' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sio-secret');
    const sessionToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET || 'sio-secret',
      { expiresIn: '7d' }
    );

    await redis.del(`magic:${token}`);

    res.setHeader(
      'Set-Cookie',
      `sio_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );

    res.redirect('/');
  } catch (error) {
    console.error('Verify error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Magic link expired' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
