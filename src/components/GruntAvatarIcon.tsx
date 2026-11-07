/**
 * Grunt Avatar Icon Component
 * Renders an authentic Madness Combat Grumt face on a high-DPI HTML canvas
 */

import React, { useRef, useEffect } from 'react';
import { GruntAvatarId } from '../types/multiplayer';
import { drawGruntAvatarFace } from '../utils/gruntAvatars';

interface GruntAvatarIconProps {
  avatarId: GruntAvatarId;
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export const GruntAvatarIcon: React.FC<GruntAvatarIconProps> = ({
  avatarId,
  size = 48,
  className = '',
  showBorder = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina DPI scale
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    // Subtle dark circular background
    ctx.fillStyle = '#181b22';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    // Draw the Grumt face
    drawGruntAvatarFace(ctx, avatarId, size / 2, size / 2 + 1, size * 0.85);

    if (showBorder) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [avatarId, size, showBorder]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-full shrink-0 shadow-md ${className}`}
    />
  );
};
