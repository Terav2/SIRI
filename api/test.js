export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello from Sio!',
    timestamp: new Date().toISOString(),
    env: {
      hasRedis: !!process.env.Sio_KV_REST_API_URL,
      hasJWT: !!process.env.JWT_SECRET,
    }
  });
}
