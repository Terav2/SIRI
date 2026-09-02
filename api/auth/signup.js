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

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await redis.get(`user:${normalizedEmail}`);
    
    let userId;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
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

    // Generate magic link token (expires in 15 minutes)
    const token = jwt.sign(
      { userId, email: normalizedEmail },
      process.env.JWT_SECRET || 'sio-secret-key-change-in-production',
      { expiresIn: '15m' }
    );

    // Store token in Redis for verification
    await redis.set(`magic:${token}`, { userId, email: normalizedEmail }, { ex: 900 });

    // In production, send email with magic link
    // For now, return the link directly (for testing)
    const magicLink = `${req.headers.origin}/api/auth/verify?token=${token}`;

    // TODO: Send email using Resend, SendGrid, or similar
    // For development, we'll just return the link
    console.log('Magic link:', magicLink);

    res.status(200).json({
      success: true,
      message: 'Magic link sent to your email',
      // Remove this in production (only for testing)
      magicLink: process.env.NODE_ENV === 'development' ? magicLink : undefined,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
