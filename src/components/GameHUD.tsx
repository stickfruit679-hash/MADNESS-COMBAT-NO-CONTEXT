import React from 'react';
import { Volume2, VolumeX, Pause, Zap, Crosshair, ShieldAlert, Sparkles, Smartphone, Skull, ShieldCheck, Flame, Droplet, Radio, Lock } from 'lucide-react';
import { Weapon, GameStats, WeaponType, GoreSetting, BloodAmount, GameMode, STORY_CHAPTERS } from '../types/game';

interface GameHUDProps {
  gameMode: GameMode;
  currentChapterId: number;
  health: number;
  maxHealth: number;
  weapon: Weapon;
  stats: GameStats;
  unlockedWeapons: WeaponType[];
  slowMoActive: boolean;
  slowMoAvailable: boolean;
  soundEnabled: boolean;
  showMobileControls: boolean;
  goreSetting: GoreSetting;
  bloodAmount: BloodAmount;
  onToggleSound: () => void;
  onToggleMobileControls: () => void;
  onCycleGore: () => void;
  onCycleBloodAmount: () => void;
  onToggleSlowMo: () => void;
  onSelectWeapon: (type: WeaponType) => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameMode,
  currentChapterId,
  health,
  maxHealth,
  weapon,
  stats,
  unlockedWeapons,
  slowMoActive,
  slowMoAvailable,
  soundEnabled,
  showMobileControls,
  goreSetting,
  bloodAmount,
  onToggleSound,
  onToggleMobileControls,
  onCycleGore,
  onCycleBloodAmount,
  onToggleSlowMo,
  onSelectWeapon,
  onPause,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const isLowHealth = hpPercent < 30;

  const currentChapter = STORY_CHAPTERS.find((c) => c.id === currentChapterId) || STORY_CHAPTERS[0];
  const storyKills = stats.storyProgress?.gruntsKilled || 0;
  const storyTotal = stats.storyProgress?.gruntsTotal || currentChapter.totalGrunts;
  const storyRemaining = Math.max(0, storyTotal - storyKills);
  const storyProgressPercent = Math.min(100, (storyKills / storyTotal) * 100);

  const WEAPONS_LIST: { type: WeaponType; label: string; key: string }[] = [
    { type: 'fists', label: 'FISTS', key: '1' },
    { type: 'knife', label: 'KNIFE', key: '2' },
    { type: 'pistol', label: '9MM', key: '3' },
    { type: 'shotgun', label: 'SHOTGUN', key: '4' },
    { type: 'uzi', label: 'UZI', key: '5' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-3 sm:p-5">
      
      {/* Top Bar: Stats, Health, and Controls */}
      <div className="flex items-start justify-between gap-4 w-full">
        
        {/* Left: Health Bar & Player State */}
        <div className="flex flex-col gap-1.5 pointer-events-auto bg-black/75 border border-red-950/80 p-3 rounded-sm shadow-xl backdrop-blur-xs min-w-[200px] sm:min-w-[260px]">
          <div className="flex items-center justify-between text-xs font-mono-tech">
            <span className="text-red-500 font-bold tracking-wider">HANK WIMBLETON</span>
            <span className={isLowHealth ? 'text-red-500 font-bold animate-pulse' : 'text-slate-300'}>
              {Math.ceil(health)} / {maxHealth} HP
            </span>
          </div>

          {/* Health Bar Container */}
          <div className="relative w-full h-4 sm:h-5 bg-slate-900 border border-slate-700 overflow-hidden rounded-xs">
            <div
              className={`h-full transition-all duration-150 ${
                isLowHealth 
                  ? 'bg-gradient-to-r from-red-700 to-red-500 animate-pulse' 
                  : 'bg-gradient-to-r from-red-700 via-red-600 to-amber-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
            {/* Tick marks */}
            <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-40">
              <div className="w-0.5 h-full bg-black" />
              <div className="w-0.5 h-full bg-black" />
              <div className="w-0.5 h-full bg-black" />
            </div>
          </div>

          {/* Mode Indicator: Story Objectives vs Arena Waves */}
          {gameMode === 'story' ? (
            <div className="pt-1 flex flex-col gap-1 text-[11px] font-mono-tech">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-red-400 font-bold uppercase truncate max-w-[150px]">
                  CH.{currentChapter.id}: {currentChapter.title}
                </span>
                <span className="text-amber-400 font-bold">
                  {storyRemaining === 0 ? 'CLEARED!' : `${storyRemaining} REMAINING`}
                </span>
              </div>
              {/* Story Quota Bar */}
              <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${storyProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>PROGRESS: {storyKills} / {storyTotal}</span>
                <span>SCORE: <strong className="text-red-400">{stats.score}</strong></span>
              </div>
            </div>
          ) : (
            /* Arena Wave & Kills Indicator */
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-slate-400 pt-0.5">
              <span className="text-amber-400 font-bold">WAVE {stats.wave}</span>
              <span>KILLS: <strong className="text-white">{stats.kills}</strong></span>
              <span>SCORE: <strong className="text-red-400">{stats.score}</strong></span>
            </div>
          )}
        </div>

        {/* Center: Combo Streak & Slow-Mo Alert */}
        <div className="flex flex-col items-center pointer-events-none">
          {stats.comboStreak >= 2 && (
            <div className="animate-bounce">
              <span className="font-heading text-xl sm:text-3xl font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)] uppercase tracking-wider">
                {stats.comboStreak}x {stats.comboStreak >= 5 ? 'MASSACRE!' : 'STREAK!'}
              </span>
            </div>
          )}

          {/* Slow-mo prompt / button */}
          {slowMoAvailable && (
            <button
              onClick={onToggleSlowMo}
              className={`pointer-events-auto mt-1 flex items-center gap-1.5 px-3 py-1 rounded border font-mono-tech text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer ${
                slowMoActive
                  ? 'bg-blue-600 text-white border-blue-400 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]'
                  : 'bg-blue-950/80 text-blue-300 border-blue-500/60 hover:bg-blue-900 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>{slowMoActive ? 'BULLET TIME ACTIVE' : 'PRESS [SHIFT] FOR BULLET TIME'}</span>
            </button>
          )}
        </div>

        {/* Right: Sound, Gore Setting, Mobile Toggle & Pause Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Gore Level Cycle Button */}
          <button
            onClick={onCycleGore}
            title={`Gore Setting: ${goreSetting} (Click to cycle)`}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
              goreSetting === 'extreme_gore'
                ? 'bg-red-950/90 text-red-300 border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                : goreSetting === 'default'
                ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                : 'bg-blue-950/80 text-blue-300 border-blue-700'
            }`}
          >
            {goreSetting === 'extreme_gore' && <Skull className="w-3.5 h-3.5 text-red-500" />}
            {goreSetting === 'default' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
            {goreSetting === 'no_blood' && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden sm:inline">
              {goreSetting === 'extreme_gore' ? 'EXTREME GORE' : goreSetting === 'default' ? 'DEFAULT' : 'NO BLOOD'}
            </span>
          </button>

          {/* Blood Amount Cycle Button (Visible when blood is enabled) */}
          {goreSetting !== 'no_blood' && (
            <button
              onClick={onCycleBloodAmount}
              title={`Blood Amount: ${bloodAmount} (Click to cycle). ${bloodAmount === 'too_much' ? 'WARNING: Not recommended for low-end PCs' : ''}`}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                bloodAmount === 'too_much'
                  ? 'bg-red-950/90 text-red-300 border-red-700 animate-pulse'
                  : bloodAmount === 'not_much'
                  ? 'bg-slate-900/90 text-slate-300 border-slate-700'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
              }`}
            >
              <Droplet className={`w-3.5 h-3.5 ${bloodAmount === 'too_much' ? 'text-red-500' : bloodAmount === 'not_much' ? 'text-amber-400' : 'text-blue-400'}`} />
              <span className="hidden sm:inline">
                {bloodAmount === 'very_little' ? 'FEW DROPS' : bloodAmount === 'not_much' ? 'REDUCED' : 'TOO MUCH ⚠️'}
              </span>
            </button>
          )}

          {/* Mobile controls toggle */}
          <button
            onClick={onToggleMobileControls}
            title="Toggle On-Screen Touch Controls"
            className={`p-2 rounded border transition-colors cursor-pointer ${
              showMobileControls 
                ? 'bg-red-950 text-red-300 border-red-700' 
                : 'bg-black/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-2 bg-black/60 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 rounded transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            title="Pause Game"
            className="p-2 bg-black/60 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 rounded transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Low Health Screen Vignette */}
      {isLowHealth && (
        <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(220,38,38,0.45)] animate-pulse" />
      )}

      {/* Bottom Bar: Weapon Arsenal Selector & Current Ammo */}
      <div className="flex items-end justify-between gap-4 w-full">
        
        {/* Left: Weapon Hotbar (1-5 keys) */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 bg-black/80 border border-slate-800 p-1.5 rounded-sm backdrop-blur-xs">
          {WEAPONS_LIST.map((w) => {
            const isCurrent = weapon.type === w.type;
            const isUnlocked = gameMode !== 'story' || unlockedWeapons.includes(w.type);
            return (
              <button
                key={w.type}
                onClick={() => isUnlocked && onSelectWeapon(w.type)}
                disabled={!isUnlocked}
                title={isUnlocked ? `${w.label} (Press [${w.key}])` : `${w.label} - Locked! Pick up from enemies in Story Mode`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono-tech transition-all ${
                  isCurrent 
                    ? 'bg-red-900/80 text-white border border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] font-bold cursor-pointer' 
                    : isUnlocked
                    ? 'bg-slate-900/60 text-slate-400 border border-transparent hover:text-slate-200 cursor-pointer'
                    : 'bg-black/50 text-slate-600 border border-slate-900/60 cursor-not-allowed opacity-50'
                }`}
              >
                {isUnlocked ? (
                  <span className="text-amber-500 text-[10px]">[{w.key}]</span>
                ) : (
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                )}
                <span>{isUnlocked ? w.label : 'LOCKED'}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Ammo Display */}
        <div className="pointer-events-auto ml-auto bg-black/80 border border-red-950/80 p-3 rounded-sm shadow-xl backdrop-blur-xs flex flex-col items-end min-w-[140px]">
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold text-red-500 tracking-wider uppercase">
              {weapon.name}
            </span>
          </div>

          <div className="flex items-baseline gap-1 mt-0.5 font-mono-tech">
            {weapon.maxAmmo > 0 ? (
              <>
                <span className="text-3xl font-black text-white">{weapon.currentAmmo}</span>
                <span className="text-sm text-slate-400">/ {weapon.reserveAmmo}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-emerald-400">MELEE ∞</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
