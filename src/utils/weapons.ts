import { Weapon, WeaponType } from '../types/game';

export const WEAPON_DEFINITIONS: Record<WeaponType, Omit<Weapon, 'currentAmmo' | 'reserveAmmo'>> = {
  fists: {
    type: 'fists',
    name: 'BARE FISTS',
    damage: 28,
    fireRate: 220,
    maxAmmo: 0,
    reloadTime: 0,
    spread: 0,
    bulletsPerShot: 1,
    bulletSpeed: 0,
    recoil: 6,
    range: 65,
    sprite: 'handFist',
  },
  knife: {
    type: 'knife',
    name: 'BOWIE KNIFE',
    damage: 60,
    fireRate: 280,
    maxAmmo: 0,
    reloadTime: 0,
    spread: 0,
    bulletsPerShot: 1,
    bulletSpeed: 0,
    recoil: 4,
    range: 75,
    sprite: 'weaponKnife',
  },
  pistol: {
    type: 'pistol',
    name: 'TACTICAL 9MM',
    damage: 42,
    fireRate: 240,
    maxAmmo: 12,
    reloadTime: 1100,
    spread: 0.04,
    bulletsPerShot: 1,
    bulletSpeed: 20,
    recoil: 10,
    range: 700,
    sprite: 'weaponPistol',
  },
  shotgun: {
    type: 'shotgun',
    name: 'PUMP 12-GAUGE',
    damage: 24, // 6 pellets * 24 = 144 max
    fireRate: 750,
    maxAmmo: 6,
    reloadTime: 1800,
    spread: 0.22,
    bulletsPerShot: 6,
    bulletSpeed: 17,
    recoil: 22,
    range: 520,
    sprite: 'weaponShotgun',
  },
  uzi: {
    type: 'uzi',
    name: 'MICRO-SMG',
    damage: 22,
    fireRate: 95,
    maxAmmo: 30,
    reloadTime: 1300,
    spread: 0.12,
    bulletsPerShot: 1,
    bulletSpeed: 19,
    recoil: 7,
    range: 620,
    sprite: 'weaponUzi',
  },
};

export function createWeaponInstance(type: WeaponType, fullAmmo: boolean = true): Weapon {
  const def = WEAPON_DEFINITIONS[type];
  return {
    ...def,
    currentAmmo: fullAmmo ? def.maxAmmo : Math.floor(def.maxAmmo / 2),
    reserveAmmo: fullAmmo ? def.maxAmmo * 3 : def.maxAmmo,
  };
}
