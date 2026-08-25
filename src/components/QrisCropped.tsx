import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QrisCroppedProps {
  qrString: string;
  className?: string;
  size?: number;
}

export default function QrisCropped({ qrString, className, size = 280 }: QrisCroppedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!qrString) return;
    setReady(false);
    setError(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, qrString, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, [qrString, size]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg text-xs text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      >
        Gagal render QR
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {!ready && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg"
          style={{ width: size, height: size }}
        />
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg ${ready ? '' : 'invisible'} ${className ?? ''}`}
      />
    </div>
  );
}
