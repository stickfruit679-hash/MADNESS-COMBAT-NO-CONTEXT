import React, { useState, useEffect } from 'react';
import { Play, HelpCircle, Volume2, VolumeX, ShieldAlert, Crosshair, Skull, ShieldCheck, Flame, Droplet, AlertTriangle, Radio, Users } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { GoreSetting, BloodAmount } from '../types/game';

interface IntroScreenProps {
  onStartStory: (chapterId?: number) => void;
  onStartArena: () => void;
  onOpenChapterSelect: () => void;
  onOpenHowToPlay: () => void;
  onOpenMultiplayer: () => void;
  goreSetting: GoreSetting;
  onSelectGoreSetting: (setting: GoreSetting) => void;
  bloodAmount: BloodAmount;
  onSelectBloodAmount: (amount: BloodAmount) => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ 
  onStartStory,
  onStartArena,
  onOpenChapterSelect,
  onOpenHowToPlay,
  onOpenMultiplayer,
  goreSetting,
  onSelectGoreSetting,
  bloodAmount,
  onSelectBloodAmount,
}) => {
  // Sequence phase: 'NEURON_SIGN' -> 'TITLE'
  const [phase, setPhase] = useState<'NEURON_SIGN' | 'TITLE'>('NEURON_SIGN');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initial trigger for Neuron sign sound
  useEffect(() => {
    // Play intro impact after short delay
    const timer = setTimeout(() => {
      soundManager.playIntroHit();
    }, 300);

    // Auto transition to title screen after 3.2 seconds
    const advanceTimer = setTimeout(() => {
      setPhase('TITLE');
      soundManager.playIntroHit();
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearTimeout(advanceTimer);
    };
  }, []);

  const handleSkipNeuronSign = () => {
    soundManager.unlock();
    soundManager.playIntroHit();
    setPhase('TITLE');
  };

  const handleStartStoryDefault = () => {
    soundManager.unlock();
    soundManager.playPistol();
    soundManager.startBoomboxMusic();
    onStartStory(1);
  };

  const toggleSound = () => {
    soundManager.unlock();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.sfxEnabled = next;
    soundManager.musicEnabled = next;
    if (!next) {
      soundManager.stopCombatMusic();
    }
  };

  const GORE_OPTIONS: { id: GoreSetting; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'no_blood',
      label: 'no blood',
      desc: 'Clean combat',
      icon: <ShieldCheck className="w-4 h-4 text-blue-400" />
    },
    {
      id: 'default',
      label: 'default',
      desc: 'Classic splatters',
      icon: <Flame className="w-4 h-4 text-amber-500" />
    },
    {
      id: 'extreme_gore',
      label: 'extreme gore',
      desc: 'Exposed brains & blown jaws',
      icon: <Skull className="w-4 h-4 text-red-500" />
    },
  ];

  const BLOOD_OPTIONS: { id: BloodAmount; label: string; desc: string }[] = [
    { id: 'very_little', label: 'very little', desc: 'Just a few drops' },
    { id: 'not_much', label: 'not much', desc: 'Reduced splatter' },
    { id: 'too_much', label: 'too much', desc: 'Heavy carnage' },
  ];

  return (
    <div className="relative w-full h-full min-h-screen bg-[#090b0e] flex items-center justify-center overflow-hidden select-none">
      {/* Background Gritty Nevada Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1c1f26] via-[#0b0d11] to-[#050608]" />
      
      {/* Ambient Red glow at bottom */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-red-950/40 rounded-full blur-3xl pointer-events-none" />

      {/* Retro Scanline Overlay */}
      <div className="scanlines absolute inset-0 z-20 pointer-events-none" />

      {/* PHASE 1: "POWERED BY NEURON" INDUSTRIAL SIGN */}
      {phase === 'NEURON_SIGN' && (
        <div 
          onClick={handleSkipNeuronSign}
          className="relative z-10 flex flex-col items-center justify-center p-6 cursor-pointer animate-in fade-in zoom-in-95 duration-500"
        >
          {/* Bolted Metal Caution Sign Box */}
          <div className="relative w-[92vw] max-w-xl bg-gradient-to-b from-[#181a20] to-[#101216] border-4 border-[#3a3f4b] shadow-[0_0_50px_rgba(0,0,0,0.9)] p-8 sm:p-12 text-center rounded-sm">
            {/* Corner bolts */}
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#52525b] border border-black shadow-inner" />
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#52525b] border border-black shadow-inner" />
            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#52525b] border border-black shadow-inner" />
            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#52525b] border border-black shadow-inner" />

            {/* Industrial Hazard Warning Strip */}
            <div className="w-full h-4 mb-6 rounded-xs opacity-80" 
              style={{
                background: 'repeating-linear-gradient(45deg, #d97706, #d97706 12px, #18181b 12px, #18181b 24px)'
              }}
            />

            <div className="flex items-center justify-center gap-2 mb-2 text-amber-500/80 font-mono-tech text-xs tracking-widest uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>A.A.H.W. FACILITY WARNING · SEC-09</span>
            </div>

            {/* EXACT REQUIRED TEXT */}
            <div className="my-6">
              <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-wider text-slate-100 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                POWERED BY NEURON
              </h1>
              <div className="h-0.5 w-3/4 mx-auto my-3 bg-red-600/60" />
              <p className="font-mono-tech text-xs sm:text-sm text-slate-400 tracking-widest uppercase">
                NEURAL COMBAT PROTOCOLS ENGAGED
              </p>
            </div>

            {/* Bottom Hazard Strip */}
            <div className="w-full h-4 mt-6 rounded-xs opacity-80" 
              style={{
                background: 'repeating-linear-gradient(45deg, #d97706, #d97706 12px, #18181b 12px, #18181b 24px)'
              }}
            />

            <div className="mt-6 font-mono-tech text-xs text-slate-500 animate-pulse">
              [ CLICK OR PRESS ANYWHERE TO SKIP ]
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: "MADNESS COMBAT: NO CONTEXT" TITLE SCREEN */}
      {phase === 'TITLE' && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4 py-6 text-center animate-in fade-in duration-700">
          
          {/* Top Location Kicker */}
          <div className="flex items-center gap-2 text-red-500/90 font-mono-tech text-xs sm:text-sm tracking-widest uppercase mb-1">
            <span>SOMEWHERE IN NEVADA...</span>
          </div>

          {/* EXACT REQUIRED GAME TITLE */}
          <div className="relative mb-3">
            <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tight uppercase drop-shadow-[0_8px_20px_rgba(220,38,38,0.4)]">
              MADNESS COMBAT:
            </h1>
            <div className="font-heading text-4xl sm:text-6xl md:text-7xl font-black text-red-600 tracking-wider uppercase mt-[-6px] sm:mt-[-12px] drop-shadow-[0_4px_16px_rgba(220,38,38,0.6)]">
              NO CONTEXT
            </div>
            {/* Blood drip accents */}
            <div className="flex justify-center items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span className="font-mono-tech text-xs text-slate-400 tracking-wider uppercase">
                REVAMPED GRUNT EDITION
              </span>
            </div>
          </div>

          {/* Grunt Silhouette / Feature Banner */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-red-900/20 to-transparent border border-red-500/20 flex items-center justify-center p-3">
              <img 
                src="/assets/sprites/grunt_idle.png" 
                alt="Madness Combat Grunt" 
                className="h-32 sm:h-40 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-pulse-red"
              />
            </div>
          </div>

          {/* Action Menu Buttons */}
          <div className="flex flex-col gap-2.5 w-full max-w-md mt-2">
            {/* 1. TOP PRIMARY MENU OPTION: MULTIPLAYER */}
            <button
              onClick={() => {
                soundManager.unlock();
                soundManager.playIntroHit();
                onOpenMultiplayer();
              }}
              className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 active:scale-[0.98] text-white font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider rounded-md shadow-[0_0_30px_rgba(220,38,38,0.7)] transition-all transform hover:scale-[1.02] cursor-pointer border border-amber-400/50"
            >
              <Users className="w-7 h-7 text-amber-300 drop-shadow" />
              <span>MULTIPLAYER</span>
            </button>

            {/* 2. STORY MODE (Where It All Started) */}
            <button
              onClick={() => {
                soundManager.unlock();
                soundManager.playPistol();
                soundManager.startBoomboxMusic();
                onStartStory(1);
              }}
              className="w-full flex items-center justify-center gap-3 px-8 py-3 bg-[#1e232d] hover:bg-[#282f3d] active:bg-[#161a22] text-slate-100 border border-slate-700 hover:border-slate-500 font-heading text-lg sm:text-xl font-bold uppercase tracking-wider rounded-md transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current text-red-500" />
              <span>STORY MODE: CHAPTER 1</span>
            </button>

            {/* Secondary Modes */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  soundManager.unlock();
                  soundManager.playPunch();
                  onOpenChapterSelect();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#181a22] hover:bg-[#202430] text-amber-400 border border-amber-600/60 font-heading text-sm sm:text-base font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
              >
                <Radio className="w-4 h-4 text-amber-400" />
                <span>SELECT CHAPTER</span>
              </button>

              <button
                onClick={() => {
                  soundManager.unlock();
                  soundManager.playPistol();
                  soundManager.startCombatMusic();
                  onStartArena();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#181a22] hover:bg-[#202430] text-slate-200 border border-slate-700 font-heading text-sm sm:text-base font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
              >
                <Flame className="w-4 h-4 text-red-500" />
                <span>SURVIVAL ARENA</span>
              </button>
            </div>

            {/* How to Play Guide */}
            <button
              onClick={onOpenHowToPlay}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#12141a] hover:bg-[#1a1c24] text-slate-400 hover:text-slate-200 border border-slate-800 font-mono-tech text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>CONTROLS & HOW TO PLAY</span>
            </button>
          </div>

          {/* BLOOD AMOUNT SETTINGS (Performance & Quantity Choice) */}
          <div className="w-full max-w-md mt-4 bg-[#13161c]/90 border border-slate-800 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-red-500" />
                <span>BLOOD AMOUNT</span>
              </span>
              <span className="font-mono-tech text-[10px] text-slate-400 uppercase">
                {bloodAmount === 'very_little' ? 'FEW DROPS (OPTIMAL)' : bloodAmount === 'not_much' ? 'REDUCED SPLATTER' : 'MAX CARNAGE'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {BLOOD_OPTIONS.map((opt) => {
                const active = bloodAmount === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      soundManager.playPistol();
                      onSelectBloodAmount(opt.id);
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded border text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-red-950 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)] scale-[1.02]'
                        : 'bg-[#181a20] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-heading text-xs font-bold uppercase tracking-wider mb-0.5">
                      {opt.label}
                    </span>
                    <span className="font-mono-tech text-[9px] text-slate-400">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Warning for low-end PCs */}
            {bloodAmount === 'too_much' && (
              <div className="mt-2.5 p-2 bg-amber-950/70 border border-amber-600/70 rounded flex items-center gap-2 text-amber-300 text-[11px] font-mono-tech animate-pulse text-left">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>WARNING: Using this mode is not recommended for low-end PCs.</span>
              </div>
            )}
          </div>

          {/* GORE SETTINGS SECTION (Settings requirement) */}
          <div className="w-full max-w-md mt-2 bg-[#13161c]/90 border border-slate-800 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5" />
                <span>SETTINGS: GORE LEVEL</span>
              </span>
              <span className="font-mono-tech text-[10px] text-slate-400 uppercase">
                {goreSetting === 'extreme_gore' ? '🔥 EXTREME CARNAGE' : goreSetting === 'default' ? 'STANDARD' : 'CLEAN'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {GORE_OPTIONS.map((opt) => {
                const active = goreSetting === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      soundManager.playPistol();
                      onSelectGoreSetting(opt.id);
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded border text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-red-950 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)] scale-[1.02]'
                        : 'bg-[#181a20] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {opt.icon}
                      <span className="font-heading text-xs font-bold uppercase tracking-wider">
                        {opt.label}
                      </span>
                    </div>
                    <span className="font-mono-tech text-[9px] text-slate-400">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Controls Bar */}
          <div className="flex items-center justify-center gap-6 mt-5 text-xs text-slate-400 font-mono-tech">
            <button 
              onClick={toggleSound}
              className="flex items-center gap-2 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
              <span>AUDIO: {soundEnabled ? 'ON' : 'MUTED'}</span>
            </button>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-red-500" />
              <span>PC: WASD / ARROWS · MOBILE: TOUCH BUTTONS</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

