import React, { useRef, useState, useEffect } from 'react';

export const CreativeAssetStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas context not available');
      return;
    }

    // Set canvas size
    canvas.width = 1080;
    canvas.height = 1080;

    // Draw a test pattern
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a red rectangle
    ctx.fillStyle = '#ff1e1e';
    ctx.fillRect(50, 50, 200, 100);

    // Draw some text
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Creative Asset Studio', 50, 50);
  }, []);

  return (
    <div className="p-6 bg-[#0c0c0c] rounded-lg">
      <h3 className="font-bold text-white mb-2">Creative Asset Studio</h3>
      <canvas ref={canvasRef} width={1080} height={1080} className="border-2 border-[#333] cursor-crosshair" />
      {error && <p className="mt-2 text-red-300 text-sm">{error}</p>}
    </div>
  );
};