export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if environment variables are set (don't show full values for security)
  const kvUrl = process.env.Sio_KV_REST_API_URL;
  const kvToken = process.env.Sio_KV_REST_API_TOKEN;

  res.status(200).json({
    Sio_KV_REST_API_URL: kvUrl ? `${kvUrl.substring(0, 30)}...` : '❌ NOT SET',
    Sio_KV_REST_API_TOKEN: kvToken ? `${kvToken.substring(0, 20)}...` : '❌ NOT SET',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '✅ SET' : '❌ NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET',
  });
}

