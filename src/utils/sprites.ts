/**
 * Sprite Loader and Madness Combat Character Renderer
 * Supports persistent blood on clothing and extreme gore wounds
 */

import { Character, RagdollPiece, GoreSetting } from '../types/game';

interface LoadedSprites {
  [key: string]: HTMLImageElement;
}

const SPRITE_URLS: { [key: string]: string } = {
  headFront: '/assets/sprites/head_front.png',
  headLeft: '/assets/sprites/head_left.png',
  headRight: '/assets/sprites/head_right.png',
  headDiagLeft: '/assets/sprites/head_diag_left.png',
  headDiagRight: '/assets/sprites/head_diag_right.png',
  torso: '/assets/sprites/torso_assembled.png',
  torsoLeft: '/assets/sprites/torso_left.png',
  torsoRight: '/assets/sprites/torso_right.png',
  footLeft: '/assets/sprites/foot_left.png',
  footRight: '/assets/sprites/foot_right.png',
  handFist: '/assets/sprites/hand_fist.png',
  handOpen: '/assets/sprites/hand_open.png',
  weaponPistol: '/assets/sprites/weapon_pistol.png',
  weaponShotgun: '/assets/sprites/weapon_shotgun.png',
  weaponKnife: '/assets/sprites/weapon_knife.png',
  weaponUzi: '/assets/sprites/weapon_uzi.png',
  gruntIdle: '/assets/sprites/grunt_idle.png',
  gruntDodge: '/assets/sprites/grunt_dodge.png',
  // Extreme Gore Sprites from User Reference
  goreHead1: '/assets/sprites/gore_head_1.png',
  goreHead2: '/assets/sprites/gore_head_2.png',
  goreHead3: '/assets/sprites/gore_head_3.png',
  goreHead4: '/assets/sprites/gore_head_4.png',
  goreHead5: '/assets/sprites/gore_head_5.png',
  goreWoundRibs: '/assets/sprites/gore_wound_ribs.png',
  goreWoundStab: '/assets/sprites/gore_wound_stab.png',
};

class SpriteManager {
  public images: LoadedSprites = {};
  public isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  public async loadAll(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve) => {
      let loadedCount = 0;
      const keys = Object.keys(SPRITE_URLS);
      const total = keys.length;

      keys.forEach((key) => {
        const img = new Image();
        img.src = SPRITE_URLS[key];
        img.onload = () => {
          this.images[key] = img;
          loadedCount++;
          if (loadedCount >= total) {
            this.isLoaded = true;
            resolve();
          }
        };
        img.onerror = () => {
          console.warn(`Failed to load sprite: ${key}`);
          loadedCount++;
          if (loadedCount >= total) {
            this.isLoaded = true;
            resolve();
          }
        };
      });
    });

    return this.loadPromise;
  }
}

export const spriteManager = new SpriteManager();

/**
 * Draws an animated Madness Combat Grunt with persistent clothing blood and configurable gore
 */
export function drawGrunt(
  ctx: CanvasRenderingContext2D, 
  char: Character, 
  time: number, 
  goreSetting: GoreSetting = 'default',
  storyChapter: number = 0
) {
  const images = spriteManager.images;
  const isAgent = char.enemyType === 'agent';
  const isHurt = char.hurtTimer > 0;
  const isPlayerHank = !!char.isPlayer;

  ctx.save();
  ctx.translate(char.x, char.y);

  // 1. Shadow underneath
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 36, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Direction facing: determine by aim angle
  const aimAngle = char.angle;
  const cos = Math.cos(aimAngle);
  const isFacingRight = cos >= 0;
  const facingSign = isFacingRight ? 1 : -1;

  // Hurt flash effect (red + bright flash)
  if (isHurt) {
    ctx.filter = 'brightness(1.6) drop-shadow(0 0 8px rgba(220, 38, 38, 0.9))';
  }

  // Walking cycle calculations
  const isWalking = char.isMoving;
  const walkSpeed = 9;
  const walkOffset = isWalking ? Math.sin(time * walkSpeed) : 0;
  const walkCos = isWalking ? Math.cos(time * walkSpeed) : 0;

  // Dodge roll tilt
  if (char.isDodging) {
    const rollAngle = (1 - char.dodgeTimer / 0.35) * Math.PI * 2 * facingSign;
    ctx.rotate(rollAngle * 0.4);
    ctx.translate(0, -10);
  }

  // 2. FEET (Floating shoes that step back and forth)
  const footImgL = images.footLeft;
  const footImgR = images.footRight;
  const footWidth = 24;
  const footHeight = 13;
  const footYBase = 32;

  const leftFootX = -12 + (isWalking ? walkOffset * 10 : 0);
  const leftFootY = footYBase - (isWalking ? Math.max(0, -walkCos) * 7 : 0);

  const rightFootX = 12 - (isWalking ? walkOffset * 10 : 0);
  const rightFootY = footYBase - (isWalking ? Math.max(0, walkCos) * 7 : 0);

  // Final Level: Black Ninja Boots for Hank
  if (isPlayerHank && storyChapter >= 4) {
    ctx.save();
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    // Left ninja boot
    ctx.beginPath();
    ctx.roundRect(leftFootX - 10, leftFootY - 5, 20, 10, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#18181b';
    ctx.fillRect(leftFootX - 7, leftFootY - 9, 14, 5);
    ctx.strokeRect(leftFootX - 7, leftFootY - 9, 14, 5);

    // Right ninja boot
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(rightFootX - 10, rightFootY - 5, 20, 10, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#18181b';
    ctx.fillRect(rightFootX - 7, rightFootY - 9, 14, 5);
    ctx.strokeRect(rightFootX - 7, rightFootY - 9, 14, 5);
    ctx.restore();
  } else {
    if (footImgL) {
      ctx.drawImage(footImgL, leftFootX - footWidth / 2, leftFootY - footHeight / 2, footWidth, footHeight);
    } else {
      ctx.fillStyle = '#2b2e33';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(leftFootX - 10, leftFootY - 5, 20, 10, 5);
      ctx.fill();
      ctx.stroke();
    }

    if (footImgR) {
      ctx.drawImage(footImgR, rightFootX - footWidth / 2, rightFootY - footHeight / 2, footWidth, footHeight);
    } else {
      ctx.fillStyle = '#2b2e33';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(rightFootX - 10, rightFootY - 5, 20, 10, 5);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 3. TORSO (Gray coat with persistent blood stains and extreme gore wounds)
  const torsoWidth = 44;
  const torsoHeight = 54;
  const breathingOffset = Math.sin(time * 3) * 1.5;
  const torsoY = 4 + breathingOffset + (isWalking ? Math.abs(walkOffset) * 2 : 0);
  const torsoLean = isWalking ? (isFacingRight ? 0.08 : -0.08) : 0;

  ctx.save();
  ctx.translate(0, torsoY);
  ctx.rotate(torsoLean);

  if (isAgent) {
    ctx.filter = 'brightness(0.35)';
  }

  // Draw Single Base Torso (Never draw two torsos side by side!)
  const singleTorsoW = 36;
  const singleTorsoH = 54;
  const torsoImg = isFacingRight 
    ? (images.torsoRight || images.torsoLeft) 
    : (images.torsoLeft || images.torsoRight);

  if (isPlayerHank && storyChapter >= 4) {
    // FINAL LEVEL: Tactical Black Ninja Outfit
    ctx.fillStyle = '#121316';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-singleTorsoW / 2, -singleTorsoH / 2, singleTorsoW, singleTorsoH, [10, 10, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Cross harness tactical straps
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-singleTorsoW * 0.4, -singleTorsoH * 0.42);
    ctx.lineTo(singleTorsoW * 0.35, singleTorsoH * 0.35);
    ctx.moveTo(singleTorsoW * 0.4, -singleTorsoH * 0.42);
    ctx.lineTo(-singleTorsoW * 0.35, singleTorsoH * 0.35);
    ctx.stroke();

    // Central tactical chest buckle
    ctx.fillStyle = '#52525b';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -singleTorsoH * 0.05, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Utility belt
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-singleTorsoW / 2 - 1, singleTorsoH * 0.28, singleTorsoW + 2, 8, 2);
    ctx.fill();
    ctx.stroke();
    // Belt buckle
    ctx.fillStyle = '#71717a';
    ctx.fillRect(-4, singleTorsoH * 0.28 + 1, 8, 6);

    // Stained with a bit of blood (as requested for the ninja outfit!)
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.arc(-singleTorsoW * 0.22, -singleTorsoH * 0.15, 3.8, 0, Math.PI * 2);
    ctx.arc(-singleTorsoW * 0.14, -singleTorsoH * 0.04, 2.5, 0, Math.PI * 2);
    ctx.arc(singleTorsoW * 0.25, singleTorsoH * 0.12, 3.2, 0, Math.PI * 2);
    ctx.arc(singleTorsoW * 0.3, singleTorsoH * 0.22, 2, 0, Math.PI * 2);
    ctx.fill();

  } else {
    if (torsoImg) {
      ctx.drawImage(torsoImg, -singleTorsoW / 2, -singleTorsoH / 2, singleTorsoW, singleTorsoH);
    } else {
      ctx.fillStyle = isAgent ? '#18181b' : '#71717a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-singleTorsoW / 2, -singleTorsoH / 2, singleTorsoW, singleTorsoH, [12, 12, 5, 5]);
      ctx.fill();
      ctx.stroke();
    }
  }

  // ACCUMULATE STORY BANDAGES ON TORSO
  if (isPlayerHank && storyChapter === 2) {
    // Chapter 2: First torso bandage wrap
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-singleTorsoW * 0.46, singleTorsoH * 0.12, singleTorsoW * 0.92, 8);
    ctx.strokeRect(-singleTorsoW * 0.46, singleTorsoH * 0.12, singleTorsoW * 0.92, 8);
    // Subtle blood seep spot
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(singleTorsoW * 0.1, singleTorsoH * 0.16, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (isPlayerHank && storyChapter === 3) {
    // Chapter 3: Criss-crossed heavy medical gauze bandages with blood seeping through
    ctx.strokeStyle = '#f4f4f5';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-singleTorsoW * 0.45, -singleTorsoH * 0.22);
    ctx.lineTo(singleTorsoW * 0.45, singleTorsoH * 0.14);
    ctx.moveTo(-singleTorsoW * 0.45, singleTorsoH * 0.1);
    ctx.lineTo(singleTorsoW * 0.45, -singleTorsoH * 0.26);
    ctx.stroke();

    // Gauze texture border lines
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-singleTorsoW * 0.45, -singleTorsoH * 0.22 - 3);
    ctx.lineTo(singleTorsoW * 0.45, singleTorsoH * 0.14 - 3);
    ctx.moveTo(-singleTorsoW * 0.45, -singleTorsoH * 0.22 + 3);
    ctx.lineTo(singleTorsoW * 0.45, singleTorsoH * 0.14 + 3);
    ctx.stroke();

    // Belly gauze wrap
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-singleTorsoW * 0.48, singleTorsoH * 0.18, singleTorsoW * 0.96, 9);
    ctx.strokeRect(-singleTorsoW * 0.48, singleTorsoH * 0.18, singleTorsoW * 0.96, 9);

    // Seeping dark red blood spots
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(-singleTorsoW * 0.1, -singleTorsoH * 0.05, 3.5, 0, Math.PI * 2);
    ctx.arc(singleTorsoW * 0.15, singleTorsoH * 0.22, 4, 0, Math.PI * 2);
    ctx.arc(singleTorsoW * 0.22, singleTorsoH * 0.24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // PERSISTENT BLOOD ON CLOTHING (Torso Stains)
  if (goreSetting !== 'no_blood' && char.bloodStains && char.bloodStains.length > 0) {
    ctx.save();
    char.bloodStains.forEach((stain) => {
      if (stain.part === 'torso') {
        ctx.fillStyle = stain.color;
        ctx.beginPath();
        ctx.arc(stain.dx, stain.dy, stain.radius, 0, Math.PI * 2);
        ctx.fill();
        // Drip line down clothing
        ctx.fillRect(stain.dx - stain.radius * 0.3, stain.dy, stain.radius * 0.6, stain.radius * 2.2);
      }
    });
    ctx.restore();
  }

  // EXTREME GORE: Exposed rib cage cavity or deep knife stab wound on clothing
  if (goreSetting === 'extreme_gore') {
    if (char.hasRibWound && images.goreWoundRibs) {
      ctx.save();
      ctx.drawImage(images.goreWoundRibs, -14, -10, 28, 34);
      ctx.restore();
    }
    if (char.hasStabWound && images.goreWoundStab) {
      ctx.save();
      ctx.drawImage(images.goreWoundStab, 2, -4, 14, 26);
      ctx.restore();
    }
  }

  // Agent Red Tie
  if (isAgent) {
    ctx.filter = 'none';
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-3, -16);
    ctx.lineTo(3, -16);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 12);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. HEAD (Selects complete heads, with Extreme Gore damaged heads if applied)
  const headWidth = 46;
  const headHeight = 54;
  const headY = -24 + breathingOffset * 1.2;
  const hurtHeadTilt = isHurt ? (facingSign * -0.2) : 0;

  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(hurtHeadTilt);

  // Check if character has an Extreme Gore Head (from user-provided image)
  let headImg: HTMLImageElement | undefined = undefined;
  if (goreSetting === 'extreme_gore' && char.goreHeadSprite && images[char.goreHeadSprite]) {
    headImg = images[char.goreHeadSprite];
  } else {
    // Normal complete uncut head angle
    if (cos > 0.7) {
      headImg = images.headRight;
    } else if (cos > 0.22) {
      headImg = images.headDiagRight || images.headRight;
    } else if (cos < -0.7) {
      headImg = images.headLeft;
    } else if (cos < -0.22) {
      headImg = images.headDiagLeft || images.headLeft;
    } else {
      headImg = images.headFront;
    }
  }

  if (headImg) {
    if (char.goreHeadSprite) {
      // Source gore head sprites from user photo face left
      ctx.save();
      if (isFacingRight) {
        ctx.scale(-1, 1);
      }
      const goreW = 48;
      const goreH = 52;
      ctx.drawImage(headImg, -goreW / 2, -goreH / 2, goreW, goreH);
      ctx.restore();
    } else {
      ctx.drawImage(headImg, -headWidth / 2, -headHeight / 2, headWidth, headHeight);
    }
  } else {
    ctx.fillStyle = '#9ca3af';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 18);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // ACCUMULATE STORY BANDAGES ON HEAD
  if (isPlayerHank && storyChapter === 2) {
    // Chapter 2: Bandage strip on head/temple
    ctx.save();
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.5;
    ctx.translate(isFacingRight ? 5 : -5, -8);
    ctx.rotate(isFacingRight ? -0.15 : 0.15);
    ctx.fillRect(-14, -4, 28, 8);
    ctx.strokeRect(-14, -4, 28, 8);
    // Blood spot on forehead bandage
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(isFacingRight ? 3 : -3, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isPlayerHank && storyChapter === 3) {
    // Chapter 3: Heavy gauze wrapping around chin/jaw, and across forehead
    ctx.save();
    // 1. Chin & Jaw wrap
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 13, 17, 12, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();

    // Jaw gauze line texture
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-15, 16);
    ctx.lineTo(15, 16);
    ctx.moveTo(-13, 21);
    ctx.lineTo(13, 21);
    ctx.stroke();

    // 2. Forehead wrap
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(-18, -14, 36, 10);
    ctx.fill();
    ctx.stroke();

    // 3. Bloody seep patches through head gauze
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(isFacingRight ? 7 : -7, -9, 3.5, 0, Math.PI * 2);
    ctx.arc(0, 17, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isPlayerHank && storyChapter >= 4) {
    // FINAL LEVEL: ICONIC BLACK BANDANA & RED GOGGLES & BLOOD STAINS
    ctx.save();

    // 1. Fluttering Bandana knot tails trailing behind
    const knotX = isFacingRight ? -16 : 16;
    const knotY = -8;
    const wave1 = Math.sin(time * 9) * 4;
    const wave2 = Math.cos(time * 8.5) * 4;

    ctx.fillStyle = '#121316';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    // Knot base
    ctx.beginPath();
    ctx.arc(knotX, knotY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ribbon Tail 1
    ctx.beginPath();
    ctx.moveTo(knotX, knotY);
    ctx.quadraticCurveTo(
      knotX + (isFacingRight ? -14 : 14), 
      knotY - 2 + wave1, 
      knotX + (isFacingRight ? -25 : 25), 
      knotY + 4 + wave1
    );
    ctx.lineTo(knotX + (isFacingRight ? -23 : 23), knotY + 9 + wave1);
    ctx.quadraticCurveTo(
      knotX + (isFacingRight ? -12 : 12), 
      knotY + 4 + wave1, 
      knotX, 
      knotY + 3
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ribbon Tail 2
    ctx.beginPath();
    ctx.moveTo(knotX, knotY);
    ctx.quadraticCurveTo(
      knotX + (isFacingRight ? -16 : 16), 
      knotY + 6 + wave2, 
      knotX + (isFacingRight ? -30 : 30), 
      knotY + 16 + wave2
    );
    ctx.lineTo(knotX + (isFacingRight ? -27 : 27), knotY + 21 + wave2);
    ctx.quadraticCurveTo(
      knotX + (isFacingRight ? -13 : 13), 
      knotY + 10 + wave2, 
      knotX, 
      knotY + 4
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Black Bandana Cowl over crown and top of the head
    ctx.fillStyle = '#121316';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -5, 23, Math.PI, 0, false);
    ctx.quadraticCurveTo(0, -2, -23, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bandana fold highlight
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -5, 20, Math.PI + 0.3, -0.3, false);
    ctx.stroke();

    // 3. Elastic Goggle Strap running horizontally around the head
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-22, 2);
    ctx.lineTo(22, 2);
    ctx.stroke();

    // 4. Glowing Red Circular Goggles (Iconic MC Hank Goggles!)
    const goggleOffset = isFacingRight ? 5 : -5;
    const goggleRadius = 9;

    const g1x = goggleOffset - (isFacingRight ? 7 : 4);
    const g1y = 2;
    const g2x = goggleOffset + (isFacingRight ? 4 : -7);
    const g2y = 2;

    // Goggle bridge connector
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(g1x, g1y);
    ctx.lineTo(g2x, g2y);
    ctx.stroke();

    [ { x: g1x, y: g1y }, { x: g2x, y: g2y } ].forEach((g) => {
      // Black outer rim
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, goggleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing Red Lens
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 9;

      const lensGrad = ctx.createRadialGradient(g.x - 2, g.y - 2, 1, g.x, g.y, goggleRadius - 2.5);
      lensGrad.addColorStop(0, '#f87171');
      lensGrad.addColorStop(0.4, '#ef4444');
      lensGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, goggleRadius - 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Specular highlight gleam on lens
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(g.x - 2.5, g.y - 2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Stained with a bit of blood on the bandana / cheek!
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.arc(isFacingRight ? -6 : 6, -12, 3, 0, Math.PI * 2);
    ctx.arc(isFacingRight ? -10 : 10, -14, 2, 0, Math.PI * 2);
    ctx.arc(isFacingRight ? 12 : -12, 13, 2.5, 0, Math.PI * 2);
    ctx.arc(isFacingRight ? 14 : -14, 16, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // PERSISTENT BLOOD ON HEAD / FACE
  if (goreSetting !== 'no_blood' && char.bloodStains && char.bloodStains.length > 0) {
    ctx.save();
    char.bloodStains.forEach((stain) => {
      if (stain.part === 'head') {
        ctx.fillStyle = stain.color;
        ctx.beginPath();
        ctx.arc(stain.dx, stain.dy, stain.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // Agent Sunglasses
  if (isAgent) {
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-16, -5, 14, 9, 2);
    ctx.roundRect(2, -5, 14, 9, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(2, -2);
    ctx.stroke();
  }
  ctx.restore();

  // 5. HANDS & WEAPONS (Forward aiming)
  const weaponType = char.weapon.type;
  const isPunching = char.isAttacking && weaponType === 'fists';
  const isSlashing = char.isAttacking && weaponType === 'knife';
  const attackProgress = char.attackProgress || 0;
  const recoilDist = char.recoilOffset || 0;

  if (weaponType === 'fists') {
    const handImg = images.handFist || images.handOpen;
    const handSize = 18;

    let rFistDist = 20;
    if (isPunching && char.attackHand === 'right') {
      rFistDist += Math.sin(attackProgress * Math.PI) * 36;
    }
    const rHandX = Math.cos(aimAngle) * rFistDist;
    const rHandY = Math.sin(aimAngle) * rFistDist + 2;

    let lFistDist = 16;
    if (isPunching && char.attackHand === 'left') {
      lFistDist += Math.sin(attackProgress * Math.PI) * 36;
    }
    const lHandAngle = aimAngle + (isFacingRight ? -0.4 : 0.4);
    const lHandX = Math.cos(lHandAngle) * lFistDist;
    const lHandY = Math.sin(lHandAngle) * lFistDist + 6;

    if (isPunching && attackProgress > 0.1 && attackProgress < 0.9) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const trailStartDist = rFistDist - 25;
      ctx.moveTo(Math.cos(aimAngle) * trailStartDist, Math.sin(aimAngle) * trailStartDist);
      ctx.lineTo(rHandX, rHandY);
      ctx.stroke();
      ctx.restore();
    }

    [ { x: lHandX, y: lHandY, isLeft: true }, { x: rHandX, y: rHandY, isLeft: false } ].forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      if (isPlayerHank && storyChapter >= 4) {
        // Black tactical ninja gloves!
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (isPlayerHank && storyChapter === 3 && h.isLeft) {
        // Left hand white medical gauze wrap
        ctx.fillStyle = '#f4f4f5';
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (handImg) {
        ctx.drawImage(handImg, -handSize / 2, -handSize / 2, handSize, handSize);
      } else {
        ctx.fillStyle = '#a1a1aa';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

  } else if (weaponType === 'knife') {
    const knifeImg = images.weaponKnife;
    const slashAngle = isSlashing ? (attackProgress - 0.5) * 1.6 : 0;
    const knifeDist = 22 + (isSlashing ? Math.sin(attackProgress * Math.PI) * 18 : 0);

    ctx.save();
    ctx.translate(Math.cos(aimAngle) * knifeDist, Math.sin(aimAngle) * knifeDist);
    ctx.rotate(aimAngle + (isFacingRight ? slashAngle : -slashAngle));
    if (!isFacingRight) {
      ctx.scale(1, -1);
    }

    if (isSlashing && attackProgress > 0.1 && attackProgress < 0.85) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32, -0.8, 0.8);
      ctx.stroke();
      ctx.restore();
    }

    if (knifeImg) {
      ctx.drawImage(knifeImg, -8, -8, 44, 20);
    } else {
      ctx.fillStyle = '#d4d4d8';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(26, 0);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

  } else if (weaponType === 'pistol') {
    const pistolImg = images.weaponPistol;
    const gunDist = 20 - recoilDist;

    ctx.save();
    ctx.translate(Math.cos(aimAngle) * gunDist, Math.sin(aimAngle) * gunDist);
    ctx.rotate(aimAngle);
    if (!isFacingRight) {
      ctx.scale(1, -1);
    }

    if (pistolImg) {
      ctx.drawImage(pistolImg, -6, -10, 44, 27);
    } else {
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(0, -6, 24, 12);
      ctx.strokeRect(0, -6, 24, 12);
    }

    if (char.muzzleFlashTimer > 0) {
      drawMuzzleFlash(ctx, 38, -2, 16);
    }
    ctx.restore();

  } else if (weaponType === 'shotgun') {
    const shotgunImg = images.weaponShotgun;
    const gunDist = 22 - recoilDist * 1.5;

    ctx.save();
    ctx.translate(Math.cos(aimAngle) * gunDist, Math.sin(aimAngle) * gunDist);
    ctx.rotate(aimAngle);
    if (!isFacingRight) {
      ctx.scale(1, -1);
    }

    if (shotgunImg) {
      ctx.drawImage(shotgunImg, -14, -8, 74, 25);
    } else {
      ctx.fillStyle = '#292524';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-10, -5, 55, 10);
      ctx.strokeRect(-10, -5, 55, 10);
    }

    if (char.muzzleFlashTimer > 0) {
      drawMuzzleFlash(ctx, 60, 0, 24);
    }
    ctx.restore();

  } else if (weaponType === 'uzi') {
    const uziImg = images.weaponUzi;
    const gunDist = 20 - recoilDist;

    ctx.save();
    ctx.translate(Math.cos(aimAngle) * gunDist, Math.sin(aimAngle) * gunDist);
    ctx.rotate(aimAngle);
    if (!isFacingRight) {
      ctx.scale(1, -1);
    }

    if (uziImg) {
      ctx.drawImage(uziImg, -10, -10, 44, 29);
    } else {
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(-4, -8, 22, 28);
      ctx.strokeRect(-4, -8, 22, 28);
    }

    if (char.muzzleFlashTimer > 0) {
      drawMuzzleFlash(ctx, 34, -3, 15);
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws sharp classic Flash-style star muzzle flash
 */
function drawMuzzleFlash(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  const spikes = 6;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.4;
    const angle = (i * Math.PI) / spikes;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius * 0.6 : radius * 0.2;
    const angle = (i * Math.PI) / spikes + 0.2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Renders flying dismembered body pieces on death, including extreme gore assets
 */
export function drawRagdollPiece(
  ctx: CanvasRenderingContext2D, 
  piece: RagdollPiece,
  goreSetting: GoreSetting = 'default'
) {
  const images = spriteManager.images;
  const img = images[piece.spriteKey];

  ctx.save();
  ctx.globalAlpha = piece.alpha;
  ctx.translate(piece.x, piece.y);
  ctx.rotate(piece.angle);

  if (img) {
    ctx.drawImage(img, -piece.width / 2, -piece.height / 2, piece.width, piece.height);
  } else {
    ctx.fillStyle = '#71717a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, piece.width / 2, piece.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Blood trail from flying limb (disabled in no_blood)
  if (goreSetting !== 'no_blood') {
    ctx.fillStyle = goreSetting === 'extreme_gore' ? '#b91c1c' : '#991b1b';
    ctx.beginPath();
    ctx.arc(-piece.width * 0.3, 0, goreSetting === 'extreme_gore' ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
