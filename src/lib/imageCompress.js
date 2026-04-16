// 이미지를 업로드 전 압축/리사이즈 (createImageBitmap 사용 — 빠르고 안정적)
export async function compressImage(file, maxWidth = 1000, quality = 0.8) {
  try {
    if (!file.type.startsWith('image/')) return file;

    // 원본이 이미 작으면 그대로 (500KB 이하)
    if (file.size < 500 * 1024) return file;

    const bitmap = await createImageBitmap(file);

    // 이미 작으면 그대로
    if (bitmap.width <= maxWidth) {
      bitmap.close?.();
      return file;
    }

    const scale = maxWidth / bitmap.width;
    const w = maxWidth;
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );

    if (!blob || blob.size > file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.error('Compress failed, using original:', err);
    return file;
  }
}
