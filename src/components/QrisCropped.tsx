import React, { useEffect, useRef, useState } from 'react';

interface QrisCroppedProps {
  src: string;
  className?: string;
  alt?: string;
}

// Koordinat crop relatif terhadap dimensi gambar asli (1410 x 2000)
// Area QR box putih: top ~29%, left ~19%, width ~62%, height ~36%
const CROP = {
  xRatio: 0.185,
  yRatio: 0.274,
  wRatio: 0.652,
  hRatio: 0.456
};

export default function QrisCropped({ src, className, alt = 'QRIS Code' }: QrisCroppedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    setReady(false);
    setError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;

      const cropX = Math.round(CROP.xRatio * srcW);
      const cropY = Math.round(CROP.yRatio * srcH);
      const cropW = Math.round(CROP.wRatio * srcW);
      const cropH = Math.round(CROP.hRatio * srcH);

      canvas.width = cropW;
      canvas.height = cropH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      setReady(true);
    };

    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  if (error) {
    // Fallback: tampilkan gambar asli jika crop gagal
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <>
      {!ready && (
        <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />
      )}
      <canvas
        ref={canvasRef}
        aria-label={alt}
        className={`${className} ${ready ? '' : 'hidden'}`}
      />
    </>
  );
}
