import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export default function useImageUpload() {
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadImage = (file) => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    const fileName = `products/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      },
      (err) => {
        console.error('Upload error:', err);
        setError(err.message);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setImageUrl(url);
        setUploading(false);
        setProgress(100);
      }
    );
  };

  const resetImage = () => {
    setImageUrl('');
    setProgress(0);
    setError(null);
  };

  return { imageUrl, uploading, progress, error, uploadImage, resetImage };
}
