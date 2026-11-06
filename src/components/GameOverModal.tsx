import React from 'react';
import { RotateCcw, Home, Skull, Trophy, Target, Award } from 'lucide-react';
import { GameStats } from '../types/game';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onMainMenu }) => {
  const accuracy = stats.shotsFired > 0 
    ? Math.round((stats.shotsHit / stats.shotsFired) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#111318] border-2 border-red-700 rounded-md shadow-[0_0_60px_rgba(220,38,38,0.5)] p-6 sm:p-8 text-center overflow-hidden">
        
        {/* Background hazard blood glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-red-700/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-red-700/20 rounded-full blur-2xl pointer-events-none" />

        {/* Skull Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-950/80 border border-red-600/60 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
          <Skull className="w-9 h-9 text-red-500" />
        </div>

        {/* Death Message */}
        <h2 className="font-heading text-4xl sm:text-5xl font-black text-white tracking-wider uppercase mb-1 drop-shadow-[0_4px_12px_rgba(220,38,38,0.6)]">
          YOU HAVE BEEN
        </h2>
        <h3 className="font-heading text-3xl sm:text-4xl font-black text-red-600 tracking-wider uppercase mb-6">
          TERMINATED
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono-tech text-xs sm:text-sm">
          <div className="bg-[#181a20] border border-slate-800 p-3 rounded text-left">
            <span className="text-slate-400 block text-xs">FINAL SCORE</span>
            <span className="text-xl font-bold text-red-400">{stats.score}</span>
          </div>

          <div className="bg-[#181a20] border border-slate-800 p-3 rounded text-left">
            <span className="text-slate-400 block text-xs">GRUNTS SLAIN</span>
            <span className="text-xl font-bold text-white">{stats.kills}</span>
          </div>

          <div className="bg-[#181a20] border border-slate-800 p-3 rounded text-left">
            <span className="text-slate-400 block text-xs">WAVES REACHED</span>
            <span className="text-xl font-bold text-amber-400">WAVE {stats.wave}</span>
          </div>

          <div className="bg-[#181a20] border border-slate-800 p-3 rounded text-left">
            <span className="text-slate-400 block text-xs">MAX KILL COMBO</span>
            <span className="text-xl font-bold text-blue-400">{stats.maxCombo}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRestart}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3.5 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-heading text-lg font-bold uppercase tracking-wider rounded shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3.5 px-6 bg-[#1f232c] hover:bg-[#2b313d] text-slate-300 font-heading text-lg font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>MAIN MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
