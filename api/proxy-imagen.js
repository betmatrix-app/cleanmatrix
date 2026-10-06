export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.includes('cloudinary.com')) {
    return res.status(400).json({ error: 'URL no valida' });
  }
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}