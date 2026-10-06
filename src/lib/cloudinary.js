import imageCompression from 'browser-image-compression';

const CLOUD_NAME    = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

export async function subirFoto(file) {
  const comprimida = await imageCompression(file, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  const formData = new FormData();
  formData.append('file', comprimida);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'flomatrix');

  const esLocal = window.location.hostname === 'localhost';
  const endpoint = esLocal
    ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    : '/api/proxy-upload';

  const res = await fetch(endpoint, { method: 'POST', body: formData });

  if (!res.ok) throw new Error('Error al subir la foto');

  const data = await res.json();
  return {
    url:      data.secure_url,
    publicId: data.public_id,
    width:    data.width,
    height:   data.height,
  };
}

export function proxiarFoto(url) {
  if (!url) return '';
  if (window.location.hostname === 'localhost') return url;
  return `/api/proxy-imagen?url=${encodeURIComponent(url)}`;
}