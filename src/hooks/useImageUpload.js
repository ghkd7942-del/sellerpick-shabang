import { useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { compressImage } from '../lib/imageCompress';

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
      const compressed = await compressImage(file, 1000, 0.8);
      setProgress(40);

      const path = `products/${Date.now()}_${compressed.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, compressed, { contentType: compressed.type || 'image/jpeg' });
      setProgress(80);

      const downloadUrl = await getDownloadURL(ref);
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
