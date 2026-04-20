import {heicTo} from 'heic-to/csp';

function isHeicLikeFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif')
  );
}

export async function compressImageForUpload(file: File) {
  const isImageLike = file.type.startsWith('image/') || isHeicLikeFile(file);
  if (!isImageLike) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }

  if (isHeicLikeFile(file)) {
    const converted = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.82,
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error ?? 'unknown');
      throw new Error(`HEIC_CONVERSION_FAILED: ${message}`);
    });

    if (!(converted instanceof Blob)) {
      throw new Error('HEIC_CONVERSION_FAILED: unexpected conversion result');
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return new File([converted], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  }

  const imageUrl = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = imageUrl;
  });

  try {
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('CANVAS_UNAVAILABLE');
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (value) resolve(value);
          else reject(new Error('IMAGE_COMPRESS_FAILED'));
        },
        'image/jpeg',
        0.82,
      );
    });

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
