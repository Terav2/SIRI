import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.Sio_KV_REST_API_URL,
  token: process.env.Sio_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await redis.get(`user:${normalizedEmail}`);
    
    let userId;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = crypto.randomUUID();
      const user = {
        id: userId,
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
        plan: 'free',
        dailyUsage: 0,
      };
      await redis.set(`user:${normalizedEmail}`, user);
    }

    const token = jwt.sign(
      { userId, email: normalizedEmail },
      process.env.JWT_SECRET || 'sio-secret',
      { expiresIn: '15m' }
    );

    await redis.set(`magic:${token}`, { userId, email: normalizedEmail }, { ex: 900 });
    const magicLink = `${req.headers.origin}/api/auth/verify?token=${token}`;

    return res.status(200).json({
      success: true,
      message: 'Magic link generated',
      magicLink: magicLink,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
