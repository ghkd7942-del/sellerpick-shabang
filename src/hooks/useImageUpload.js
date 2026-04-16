import { useState } from 'react';

const BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

export default function useImageUpload() {
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadImage = async (file) => {
    if (!file) return null;

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const fileName = `products/${Date.now()}_${file.name}`;
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?name=${encodeURIComponent(fileName)}`;

      setProgress(30);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
      });

      if (!res.ok) {
        throw new Error('업로드 실패: ' + res.status);
      }

      setProgress(80);

      const data = await res.json();
      const objectName = encodeURIComponent(data.name);
      const token = data.downloadTokens;
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${objectName}?alt=media&token=${token}`;

      setImageUrl(downloadUrl);
      setProgress(100);
      setUploading(false);
      return downloadUrl;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploading(false);
      return null;
    }
  };

  const resetImage = () => {
    setImageUrl('');
    setProgress(0);
    setError(null);
  };

  return { imageUrl, uploading, progress, error, uploadImage, resetImage };
}
