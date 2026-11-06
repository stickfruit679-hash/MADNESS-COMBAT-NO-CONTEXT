/**
 * Environment Renderers for Madness Combat: No Context
 * Renders the iconic Madness Combat backdrops:
 * Chapter 1: The Nevada Grasslands with Lone Oak Tree, Boombox & Dancing Grunt
 * Chapter 2: The Red Sun Outpost & Barbed Wire
 * Chapter 3: A.A.H.W. Underground Bunker Elevator Core
 * Chapter 4: Club M Nightclub with Pulsating Neon Strobes
 * Arena: Tactical Grid Arena
 */

import { GameMode } from '../types/game';

// Draw the lone Krinkels-style oak tree
export const drawLoneTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.save();
  ctx.translate(x, y);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 95, 65, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tree trunk
  ctx.fillStyle = '#3b1c09';
  ctx.strokeStyle = '#1f0d04';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-18, 95);
  ctx.quadraticCurveTo(-14, 25, -12, -25);
  ctx.lineTo(-28, -50);
  ctx.lineTo(-16, -55);
  ctx.lineTo(-6, -28);
  ctx.lineTo(8, -60);
  ctx.lineTo(20, -52);
  ctx.lineTo(8, -25);
  ctx.quadraticCurveTo(14, 25, 22, 95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bark line details
  ctx.strokeStyle = '#271004';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 75);
  ctx.lineTo(-4, 30);
  ctx.moveTo(6, 65);
  ctx.lineTo(4, 15);
  ctx.stroke();

  // Leafy Puffs (Iconic Krinkels green foliage canopy)
  const puffs = [
    { x: -42, y: -75, r: 40, col: '#15803d' },
    { x: 42, y: -70, r: 42, col: '#166534' },
    { x: 0, y: -110, r: 48, col: '#15803d' },
    { x: -24, y: -95, r: 44, col: '#16a34a' },
    { x: 26, y: -90, r: 42, col: '#16a34a' },
    { x: 0, y: -72, r: 36, col: '#22c55e' },
  ];

  puffs.forEach((p) => {
    ctx.fillStyle = p.col;
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
};

// Draw the iconic Boombox with pulsing speakers, LED meters, and drifting music notes
export const drawBoombox = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
  ctx.save();
  ctx.translate(x, y);

  // Soft shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 32, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Carrying Handle
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.lineTo(-18, -25);
  ctx.lineTo(18, -25);
  ctx.lineTo(18, -14);
  ctx.stroke();

  // Main Boombox Body
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-28, -14, 56, 30, 4);
  ctx.fill();
  ctx.stroke();

  // Speaker left
  const beatPulse = Math.abs(Math.sin(time * 9)) * 2;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-16, 1, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(-16, 1, 3.5 + beatPulse, 0, Math.PI * 2);
  ctx.fill();

  // Speaker right
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(16, 1, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(16, 1, 3.5 + beatPulse, 0, Math.PI * 2);
  ctx.fill();

  // Cassette Deck in Center
  ctx.fillStyle = '#334155';
  ctx.fillRect(-6, -6, 12, 14);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(-6, -6, 12, 14);

  // Equalizer LEDs
  const eq1 = Math.abs(Math.sin(time * 14)) * 9;
  const eq2 = Math.abs(Math.cos(time * 11)) * 9;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(-5, -5, 3, eq1);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(2, -5, 3, eq2);

  // Drifting animated musical notes (♪ ♫ ♩)
  const notes = ['♪', '♫', '♩'];
  for (let i = 0; i < 3; i++) {
    const noteLoop = (time * 1.6 + i * 1.1) % 3.2;
    const alpha = Math.max(0, 1 - noteLoop / 2.8);
    const nx = Math.sin(noteLoop * 2.5 + i) * 16 + (i - 1) * 14;
    const ny = -26 - noteLoop * 28;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i === 0 ? '#38bdf8' : i === 1 ? '#f43f5e' : '#fbbf24';
    ctx.font = 'bold 16px monospace';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 5;
    ctx.fillText(notes[i], nx, ny);
    ctx.restore();
  }

  ctx.restore();
};

// Draw the Dancing Grunt in the background grooving to the boombox tunes!
export const drawDancingGrunt = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
  // Sync dance tempo with boombox BPM
  const beat = time * 8.2;
  const swayX = Math.sin(beat) * 6;
  const bobY = Math.abs(Math.sin(beat * 2)) * 7;
  const headBob = Math.sin(beat) * 0.18;

  ctx.save();
  ctx.translate(x + swayX, y - bobY);

  // Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 36 + bobY * 0.75, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet
  const footSway = Math.sin(beat) * 3.5;
  ctx.fillStyle = '#1c1917';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  // Left foot
  ctx.beginPath();
  ctx.roundRect(-15 + footSway, 32, 12, 7, 3);
  ctx.fill();
  ctx.stroke();
  // Right foot
  ctx.beginPath();
  ctx.roundRect(3 - footSway, 32, 12, 7, 3);
  ctx.fill();
  ctx.stroke();

  // Single Torso
  ctx.fillStyle = '#6b7280';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-13, 0, 26, 34, 8);
  ctx.fill();
  ctx.stroke();

  // Head with cross face (nodding to beat)
  ctx.save();
  ctx.translate(0, -18);
  ctx.rotate(headBob);
  ctx.fillStyle = '#9ca3af';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cross Face
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 14);
  ctx.moveTo(-11, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();
  ctx.restore();

  // Floating hands (grooving up and down \o/ and swaying)
  const leftHandY = -6 + Math.sin(beat + 0.8) * 16;
  const rightHandY = -6 + Math.cos(beat + 0.8) * 16;

  ctx.fillStyle = '#9ca3af';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  // Left hand
  ctx.beginPath();
  ctx.ellipse(-24, leftHandY, 6.5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Right hand
  ctx.beginPath();
  ctx.ellipse(24, rightHandY, 6.5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Floating text / status above dancing grunt
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 4;
  ctx.fillText('♪ GROOVIN\' ♪', 0, -46);

  ctx.restore();
};

// Hazard corners for arena & bunker
export const drawHazardCorners = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const cornerSize = 40;
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(cornerSize, 0);
  ctx.lineTo(0, cornerSize);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width - cornerSize, 0);
  ctx.lineTo(width, cornerSize);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(cornerSize, height);
  ctx.lineTo(0, height - cornerSize);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - cornerSize, height);
  ctx.lineTo(width, height - cornerSize);
  ctx.closePath();
  ctx.fill();
};

// Main environment dispatcher
export const drawChapterEnvironment = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  gameMode: GameMode,
  chapterId: number
) => {
  if (gameMode === 'arena') {
    // Tactical Combat Arena Grid
    ctx.fillStyle = '#14161b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#272a34';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    drawHazardCorners(ctx, width, height);
    return;
  }

  // STORY CHAPTER ENVIRONMENTS
  if (chapterId === 1) {
    // ==========================================
    // CHAPTER 1: THE FIELD, TREE & DANCING GRUNT
    // ==========================================
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.44);
    skyGrad.addColorStop(0, '#334155');
    skyGrad.addColorStop(0.7, '#64748b');
    skyGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.44);

    // Distant Rolling Hill
    ctx.fillStyle = '#2d4a22';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.42);
    ctx.quadraticCurveTo(width * 0.35, height * 0.32, width * 0.68, height * 0.4);
    ctx.quadraticCurveTo(width * 0.88, height * 0.34, width, height * 0.38);
    ctx.lineTo(width, height * 0.46);
    ctx.lineTo(0, height * 0.46);
    ctx.closePath();
    ctx.fill();

    // Lush Grassy Hill Gradient
    const grassGrad = ctx.createLinearGradient(0, height * 0.38, 0, height);
    grassGrad.addColorStop(0, '#4d7c0f');
    grassGrad.addColorStop(0.25, '#3f6212');
    grassGrad.addColorStop(1, '#1e3a10');
    ctx.fillStyle = grassGrad;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.42);
    ctx.quadraticCurveTo(width * 0.4, height * 0.37, width, height * 0.4);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Grass Tuft Details across field
    ctx.strokeStyle = '#365314';
    ctx.lineWidth = 1.5;
    const grassSpots = [
      [70, 260], [130, 360], [210, 240], [310, 420], [170, 520],
      [430, 310], [530, 240], [620, 480], [740, 380], [830, 520],
      [360, 180], [490, 430], [250, 470], [670, 260]
    ];
    grassSpots.forEach(([gx, gy]) => {
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx - 3, gy - 8);
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx, gy - 11);
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 3, gy - 8);
      ctx.stroke();
    });

    // 1. Lone Tree on the grassy field
    const treeX = width * 0.82;
    const treeY = height * 0.28;
    drawLoneTree(ctx, treeX, treeY);

    // 2. Boombox playing tunes
    const boomboxX = width * 0.68;
    const boomboxY = height * 0.31;
    drawBoombox(ctx, boomboxX, boomboxY, time);

    // 3. Dancing Grunt grooving to the music in the background!
    const dancerX = width * 0.74;
    const dancerY = height * 0.31;
    drawDancingGrunt(ctx, dancerX, dancerY, time);

    // Split-rail wooden boundary fence separating background sky/hill from playable grass floor
    ctx.strokeStyle = '#271004';
    ctx.lineWidth = 3;
    const fenceY = height * 0.435;
    ctx.beginPath();
    ctx.moveTo(0, fenceY);
    ctx.lineTo(width, fenceY);
    ctx.moveTo(0, fenceY + 7);
    ctx.lineTo(width, fenceY + 7);
    ctx.stroke();

    // Fence posts
    ctx.fillStyle = '#3b1c09';
    for (let fx = 25; fx < width; fx += 55) {
      ctx.fillRect(fx - 3, fenceY - 6, 6, 18);
      ctx.strokeRect(fx - 3, fenceY - 6, 6, 18);
    }

    // Field perimeter wooden barrier
    ctx.strokeStyle = '#271a0c';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);

  } else if (chapterId === 2) {
    // ==========================================
    // CHAPTER 2: MADNESS REDEEMER - RED SUN DESERT
    // ==========================================
    // Crimson Sky
    const redSky = ctx.createLinearGradient(0, 0, 0, height * 0.42);
    redSky.addColorStop(0, '#450a0a');
    redSky.addColorStop(0.5, '#7f1d1d');
    redSky.addColorStop(1, '#991b1b');
    ctx.fillStyle = redSky;
    ctx.fillRect(0, 0, width, height * 0.42);

    // Giant Red Sun
    const sunX = width * 0.5;
    const sunY = height * 0.24;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Desert Dunes Floor
    const sandGrad = ctx.createLinearGradient(0, height * 0.38, 0, height);
    sandGrad.addColorStop(0, '#78350f');
    sandGrad.addColorStop(0.4, '#5c2b09');
    sandGrad.addColorStop(1, '#381a05');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, height * 0.38, width, height * 0.62);

    // Barbed wire boundary line along horizon
    const desertFenceY = height * 0.415;
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, desertFenceY);
    ctx.lineTo(width, desertFenceY);
    ctx.moveTo(0, desertFenceY + 8);
    ctx.lineTo(width, desertFenceY + 8);
    ctx.stroke();

    // Metal fence stakes
    ctx.fillStyle = '#27272a';
    for (let fx = 30; fx < width; fx += 65) {
      ctx.fillRect(fx - 2, desertFenceY - 8, 4, 20);
      ctx.strokeRect(fx - 2, desertFenceY - 8, 4, 20);
    }

    // Barbed wire perimeter
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);

  } else if (chapterId === 3) {
    // ==========================================
    // CHAPTER 3: MADNESS AVENGER - BUNKER CORE
    // ==========================================
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Steel Plate Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Heavy Elevator Shaft Blast Door
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(width * 0.35, 6, width * 0.3, 32);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.35, 6, width * 0.3, 32);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A.A.H.W. ELEVATOR SHAFT 03', width * 0.5, 26);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    drawHazardCorners(ctx, width, height);

  } else if (chapterId === 4) {
    // ==========================================
    // CHAPTER 4: MADNESS DEPREDATION - CLUB M
    // ==========================================
    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, width, height);

    // Moving Disco Lights
    const phase = time * 2.2;
    const colors = [
      'rgba(236, 72, 153, 0.15)', // hot pink
      'rgba(59, 130, 246, 0.15)',  // cyan blue
      'rgba(168, 85, 247, 0.15)', // neon purple
      'rgba(34, 197, 94, 0.15)',  // neon green
    ];
    colors.forEach((col, idx) => {
      const angle = phase + (idx * Math.PI) / 2;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2 + Math.cos(angle) * width * 0.7 - 90, height);
      ctx.lineTo(width / 2 + Math.cos(angle) * width * 0.7 + 90, height);
      ctx.closePath();
      ctx.fill();
    });

    // CLUB M Neon Wall Sign
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ CLUB M ★', width * 0.5, 42);
    ctx.shadowBlur = 0;

    // Disco Floor Tiles
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 55) {
      for (let y = 60; y < height; y += 55) {
        ctx.strokeRect(x, y, 55, 55);
      }
    }

    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);
  }
};
