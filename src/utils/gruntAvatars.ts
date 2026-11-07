/**
 * Grunt Avatar Definitions & Canvas Face Renderer
 * Allows players to choose from various authentic "Grumts" for their multiplayer profile picture.
 */

import { GruntAvatarId, GruntAvatarInfo } from '../types/multiplayer';

export const GRUNT_AVATARS: GruntAvatarInfo[] = [
  {
    id: 'classic_grunt',
    name: 'Classic Grunt',
    tagline: 'The iconic Nevada neutral citizen',
    tier: 'Standard',
    accentColor: '#9ca3af',
  },
  {
    id: 'bandaged_grunt',
    name: 'Bandaged Hank (MC2)',
    tagline: 'Battle-scarred with forehead & temple wraps',
    tier: 'Story Hank',
    accentColor: '#e0e7ff',
  },
  {
    id: 'gauze_grunt',
    name: 'Avenger Hank (MC3)',
    tagline: 'Heavily wrapped jaw & cranium with blood seepage',
    tier: 'Story Hank',
    accentColor: '#fca5a5',
  },
  {
    id: 'ninja_grunt',
    name: 'Ninja Hank (MC4)',
    tagline: 'Black bandana, ruby goggles & tactical ninja mask',
    tier: 'Story Hank',
    accentColor: '#ef4444',
  },
  {
    id: 'agent_grunt',
    name: 'Agency 1337 Agent',
    tagline: 'Black shades, black suit & crimson tie',
    tier: 'A.A.H.W.',
    accentColor: '#dc2626',
  },
  {
    id: 'dancing_grunt',
    name: 'Groovin\' Grunt',
    tagline: 'Boombox dancing enthusiast with red groove band',
    tier: 'Standard',
    accentColor: '#22c55e',
  },
  {
    id: 'elite_grunt',
    name: 'A.A.H.W. Heavy Trooper',
    tagline: 'Tactical yellow visor with reinforced chin guard',
    tier: 'A.A.H.W.',
    accentColor: '#eab308',
  },
  {
    id: 'gore_jaw_grunt',
    name: 'Blown Jaw Grunt',
    tagline: 'Extreme gore: shattered lower mandible & flesh',
    tier: 'Extreme Gore',
    accentColor: '#b91c1c',
  },
  {
    id: 'gore_brain_grunt',
    name: 'Split Cranium Grunt',
    tagline: 'Extreme gore: cleaved head with exposed brain matter',
    tier: 'Extreme Gore',
    accentColor: '#991b1b',
  },
  {
    id: 'gore_split_grunt',
    name: 'Cross Slash Grunt',
    tagline: 'Extreme gore: heavy facial laceration with bloody wound',
    tier: 'Extreme Gore',
    accentColor: '#7f1d1d',
  },
];

/**
 * Draws a high-fidelity Grunt face avatar on any canvas
 */
export function drawGruntAvatarFace(
  ctx: CanvasRenderingContext2D,
  avatarId: GruntAvatarId,
  centerX: number,
  centerY: number,
  size: number
) {
  ctx.save();
  ctx.translate(centerX, centerY);

  const scale = size / 54;
  ctx.scale(scale, scale);

  // 1. Base Grey Head (Classic Krinkels oval)
  ctx.fillStyle = '#9ca3af';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Base Cross Face
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 16);
  ctx.moveTo(-11, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();

  // 3. Avatar Specific Features
  if (avatarId === 'bandaged_grunt') {
    // White gauze forehead strip taped at angle with blood dot
    ctx.save();
    ctx.translate(4, -7);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-12, -4, 24, 7);
    ctx.strokeRect(-12, -4, 24, 7);
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(3, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else if (avatarId === 'gauze_grunt') {
    // Chin & Jaw medical wrap
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 11, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();

    // Gauze lines
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, 15);
    ctx.lineTo(14, 15);
    ctx.moveTo(-12, 19);
    ctx.lineTo(12, 19);
    ctx.stroke();

    // Forehead gauze wrap
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(-16, -14, 32, 8);
    ctx.strokeRect(-16, -14, 32, 8);

    // Blood seepage patches
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(6, -10, 3, 0, Math.PI * 2);
    ctx.arc(0, 16, 3.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (avatarId === 'ninja_grunt') {
    // Black Bandana Cowl
    ctx.fillStyle = '#121316';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -4, 21, Math.PI, 0, false);
    ctx.quadraticCurveTo(0, -1, -21, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fluttering knot tails behind
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(-24, -2);
    ctx.lineTo(-22, 5);
    ctx.lineTo(-14, -3);
    ctx.fill();

    // Black elastic goggle strap
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, 2);
    ctx.lineTo(20, 2);
    ctx.stroke();

    // Red Glowing Goggles
    const goggleR = 7.5;
    [-6, 6].forEach((gx) => {
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, 2, goggleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing lens
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(gx, 2, goggleR - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Gleam dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx - 2, 0.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (avatarId === 'agent_grunt') {
    // Agency Sunglasses
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-14, -5, 12, 8, 2);
    ctx.roundRect(2, -5, 12, 8, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(2, -2);
    ctx.stroke();

  } else if (avatarId === 'dancing_grunt') {
    // Red / Green Groovin Headband
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-19, -12, 38, 6);
    ctx.strokeRect(-19, -12, 38, 6);
    // Green music note on forehead
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('♫', 0, -4);

  } else if (avatarId === 'elite_grunt') {
    // Yellow tactical visor
    ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -6, 32, 9, 3);
    ctx.fill();
    ctx.stroke();

    // Chin plate
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-10, 14, 20, 8);
    ctx.strokeRect(-10, 14, 20, 8);

  } else if (avatarId === 'gore_jaw_grunt') {
    // Severed jaw with gaping red bloody cavity
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 11, 14, 9, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();

    // Blood splatters
    ctx.fillStyle = '#b91c1c';
    for (let i = -10; i <= 10; i += 5) {
      ctx.beginPath();
      ctx.arc(i, 11 + Math.sin(i) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (avatarId === 'gore_brain_grunt') {
    // Cleaved cranium with exposed brain tissue
    ctx.fillStyle = '#881337';
    ctx.strokeStyle = '#4c0519';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -14, 12, Math.PI, 0, false);
    ctx.fill();
    ctx.stroke();

    // Brain convolutions
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-4, -15, 4, 0, Math.PI);
    ctx.arc(4, -15, 4, 0, Math.PI);
    ctx.stroke();

  } else if (avatarId === 'gore_split_grunt') {
    // Deep facial cross wound
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(8, 10);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-1, 1, 4, 0, Math.PI * 2);
    ctx.arc(4, 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
