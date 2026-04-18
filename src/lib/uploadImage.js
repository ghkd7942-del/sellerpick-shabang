import { compressImage } from './imageCompress';

const BUCKET = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim();

export async function uploadImageFile(file) {
  if (!file) return null;
  const compressed = await compressImage(file, 1000, 0.8);
  const fileName = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${compressed.name}`;
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?name=${encodeURIComponent(fileName)}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': compressed.type || 'image/jpeg' },
    body: compressed,
  });
  if (!res.ok) throw new Error('업로드 실패: ' + res.status);

  const data = await res.json();
  const objectName = encodeURIComponent(data.name);
  const token = data.downloadTokens;
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${objectName}?alt=media&token=${token}`;
}
