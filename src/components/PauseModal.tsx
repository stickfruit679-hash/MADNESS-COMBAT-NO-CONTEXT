import React from 'react';
import { Play, RotateCcw, Home, HelpCircle, Volume2, VolumeX, Smartphone, Skull, ShieldCheck, Flame, Droplet, AlertTriangle } from 'lucide-react';
import { GoreSetting, BloodAmount } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenHowToPlay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showMobileControls: boolean;
  onToggleMobileControls: () => void;
  goreSetting: GoreSetting;
  onSelectGoreSetting: (setting: GoreSetting) => void;
  bloodAmount: BloodAmount;
  onSelectBloodAmount: (amount: BloodAmount) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  onOpenHowToPlay,
  soundEnabled,
  onToggleSound,
  showMobileControls,
  onToggleMobileControls,
  goreSetting,
  onSelectGoreSetting,
  bloodAmount,
  onSelectBloodAmount,
}) => {
  const GORE_OPTIONS: { id: GoreSetting; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'no_blood',
      label: 'no blood',
      desc: 'Clean combat · zero blood stains',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
    },
    {
      id: 'default',
      label: 'default',
      desc: 'Classic splatters & clothing stains',
      icon: <Flame className="w-3.5 h-3.5 text-amber-500" />
    },
    {
      id: 'extreme_gore',
      label: 'extreme gore',
      desc: 'Exposed brains, blown jaws, ribbed cavities',
      icon: <Skull className="w-3.5 h-3.5 text-red-500" />
    },
  ];

  const BLOOD_OPTIONS: { id: BloodAmount; label: string; desc: string }[] = [
    { id: 'very_little', label: 'very little', desc: 'Just a few drops (fastest)' },
    { id: 'not_much', label: 'not much', desc: 'Reduced splatter (smooth 60fps)' },
    { id: 'too_much', label: 'too much', desc: 'Heavy carnage (high FX)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#13161c] border-2 border-red-800 rounded-md shadow-[0_0_50px_rgba(220,38,38,0.4)] p-5 text-center max-h-[95vh] overflow-y-auto">
        
        {/* Title */}
        <h2 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-wider uppercase mb-0.5">
          COMBAT SUSPENDED
        </h2>
        <p className="font-mono-tech text-xs text-slate-400 mb-4 uppercase tracking-widest">
          TACTICAL SETTINGS & PERFORMANCE
        </p>

        {/* Buttons List */}
        <div className="flex flex-col gap-2 font-heading font-bold text-sm tracking-wider uppercase mb-4">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-[#1e222a] hover:bg-[#282d38] text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART ARENA</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-[#1e222a] hover:bg-[#282d38] text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>CONTROLS & INTEL</span>
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-[#1e222a] hover:bg-[#282d38] text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>ABORT TO MENU</span>
          </button>
        </div>

        {/* BLOOD AMOUNT SETTINGS */}
        <div className="bg-[#0e1014] border border-slate-800 rounded p-2.5 text-left mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-heading text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-red-500" />
              <span>BLOOD AMOUNT</span>
            </span>
            <span className="font-mono-tech text-[10px] text-slate-400 uppercase">
              {bloodAmount === 'very_little' ? 'FEW DROPS' : bloodAmount === 'not_much' ? 'REDUCED' : 'INTENSE'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {BLOOD_OPTIONS.map((opt) => {
              const active = bloodAmount === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectBloodAmount(opt.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded border text-center transition-all cursor-pointer ${
                    active
                      ? 'bg-red-950/90 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                      : 'bg-[#181a20] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-heading text-xs font-bold uppercase tracking-wider mb-0.5">
                    {opt.label}
                  </span>
                  <span className="font-mono-tech text-[9px] text-slate-400 leading-tight">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* WARNING FOR TOO MUCH BLOOD */}
          {bloodAmount === 'too_much' && (
            <div className="mt-2 p-1.5 bg-amber-950/70 border border-amber-600/70 rounded flex items-center gap-1.5 text-amber-300 text-[10px] font-mono-tech animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>WARNING: Using this mode is not recommended for low-end PCs.</span>
            </div>
          )}
        </div>

        {/* GORE LEVEL SETTINGS */}
        <div className="bg-[#0e1014] border border-slate-800 rounded p-2.5 text-left mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-heading text-xs font-bold text-red-500 uppercase tracking-wider">
              GORE SETTING
            </span>
            <span className="font-mono-tech text-[10px] text-slate-400 uppercase">
              CARNAGE ASSETS
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {GORE_OPTIONS.map((opt) => {
              const active = goreSetting === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectGoreSetting(opt.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded border text-center transition-all cursor-pointer ${
                    active
                      ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                      : 'bg-[#181a20] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    {opt.icon}
                    <span className="font-heading text-xs font-bold uppercase tracking-wider">
                      {opt.label}
                    </span>
                  </div>
                  <span className="font-mono-tech text-[9px] text-slate-400 line-clamp-1">
                    {opt.id === 'extreme_gore' ? 'Full Gore' : opt.id === 'default' ? 'Classic' : 'None'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio & Touch Toggles */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-800/80 text-xs font-mono-tech text-slate-400">
          <button 
            onClick={onToggleSound} 
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            <span>AUDIO: {soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <span>·</span>

          <button 
            onClick={onToggleMobileControls} 
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>TOUCH: {showMobileControls ? 'ON' : 'OFF'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

