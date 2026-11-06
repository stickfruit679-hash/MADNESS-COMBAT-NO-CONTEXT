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
  goreSetting: GoreSetting = 'default'
) {
  const images = spriteManager.images;
  const isAgent = char.enemyType === 'agent';
  const isHurt = char.hurtTimer > 0;

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

    [ { x: lHandX, y: lHandY }, { x: rHandX, y: rHandY } ].forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      if (handImg) {
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
