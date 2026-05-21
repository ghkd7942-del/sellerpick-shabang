import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { compressImage } from './imageCompress';

export async function uploadImageFile(file) {
  if (!file) return null;
  const compressed = await compressImage(file, 1000, 0.8);
  const path = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${compressed.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, compressed, { contentType: compressed.type || 'image/jpeg' });
  return await getDownloadURL(ref);
}
