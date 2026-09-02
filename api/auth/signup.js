import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';

const redis = new Redis({
  url: process.env.Sio_KV_REST_API_URL,
  token: process.env.Sio_KV_REST_API_TOKEN,
});

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Create magic link
    const magicLink = `${req.headers.origin}/api/auth/verify?token=${token}`;

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Sio <onboarding@resend.dev>', // Use test domain for now
          to: normalizedEmail,
          subject: 'Your Sio Magic Link',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0;">Sio</h1>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 32px; text-align: center;">
                <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Sign in to Sio</h2>
                <p style="font-size: 16px; color: #6b7280; margin: 0 0 32px 0;">Click the button below to sign in to your account. This link expires in 15 minutes.</p>
                
                <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Sign In to Sio</a>
                
                <p style="font-size: 14px; color: #9ca3af; margin: 32px 0 0 0;">If you didn't request this email, you can safely ignore it.</p>
              </div>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 40px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">This email was sent by Sio. If you have questions, contact support.</p>
              </div>
            </div>
          `,
        });

        return res.status(200).json({
          success: true,
          message: 'Magic link sent to your email! Check your inbox.',
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Fallback: return link in response if email fails
        return res.status(200).json({
          success: true,
          message: 'Email sending failed, but here is your magic link:',
          magicLink: magicLink,
        });
      }
    } else {
      // Fallback: return link in response (for testing without Resend)
      return res.status(200).json({
        success: true,
        message: 'Magic link generated (Resend not configured)',
        magicLink: magicLink,
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

Could not connect to the reCAPTCHA service. Please check your internet connection and reload to get a reCAPTCHA challenge.
