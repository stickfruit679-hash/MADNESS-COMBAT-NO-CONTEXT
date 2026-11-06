import React from 'react';
import { Trophy, ArrowRight, RotateCcw, Menu, Skull, Flame, Target, Clock, Zap } from 'lucide-react';
import { GameStats, STORY_CHAPTERS, StoryChapter } from '../types/game';

interface ChapterVictoryModalProps {
  currentChapterId: number;
  stats: GameStats;
  onNextChapter: () => void;
  onReplayChapter: () => void;
  onChapterSelect: () => void;
  onMainMenu: () => void;
}

export const ChapterVictoryModal: React.FC<ChapterVictoryModalProps> = ({
  currentChapterId,
  stats,
  onNextChapter,
  onReplayChapter,
  onChapterSelect,
  onMainMenu,
}) => {
  const currentChapter = STORY_CHAPTERS.find((c) => c.id === currentChapterId) || STORY_CHAPTERS[0];
  const hasNextChapter = currentChapterId < STORY_CHAPTERS.length;
  const nextChapter = hasNextChapter ? STORY_CHAPTERS.find((c) => c.id === currentChapterId + 1) : null;

  const accuracy = stats.shotsFired > 0 
    ? Math.round((stats.shotsHit / stats.shotsFired) * 100) 
    : 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#181a22] to-[#0f1117] border-2 border-red-600/80 rounded-md shadow-[0_0_60px_rgba(220,38,38,0.4)] p-6 sm:p-8 text-center overflow-hidden">
        
        {/* Corner metallic bolt accents */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-slate-600 border border-black" />
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-slate-600 border border-black" />
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-slate-600 border border-black" />
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-slate-600 border border-black" />

        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-32 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Victory Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-500/60 rounded-full text-red-400 font-mono-tech text-xs tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>CHAPTER {currentChapter.id} COMPLETED</span>
        </div>

        {/* Chapter Title & Subtitle */}
        <h1 className="font-heading text-3xl sm:text-5xl font-black text-white uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(220,38,38,0.6)]">
          {currentChapter.title}
        </h1>
        <p className="font-mono-tech text-xs sm:text-sm text-red-400 font-bold uppercase tracking-widest mt-1">
          {currentChapter.subtitle}
        </p>

        <div className="h-0.5 w-2/3 mx-auto my-4 bg-gradient-to-r from-transparent via-red-600 to-transparent" />

        {/* Objective Cleared Banner */}
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded text-emerald-400 font-heading text-sm sm:text-base font-bold uppercase tracking-wider mb-5 flex items-center justify-center gap-2">
          <Skull className="w-4 h-4 text-emerald-400" />
          <span>OBJECTIVE MET: ALL {currentChapter.totalGrunts} GRUNTS SLAIN!</span>
        </div>

        {/* Combat Performance Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <div className="bg-[#12141a] border border-slate-800 p-2.5 rounded text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-mono-tech uppercase mb-1">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span>KILLS</span>
            </div>
            <span className="font-heading text-2xl font-black text-white">{stats.kills}</span>
          </div>

          <div className="bg-[#12141a] border border-slate-800 p-2.5 rounded text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-mono-tech uppercase mb-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>ACCURACY</span>
            </div>
            <span className="font-heading text-2xl font-black text-white">{accuracy}%</span>
          </div>

          <div className="bg-[#12141a] border border-slate-800 p-2.5 rounded text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-mono-tech uppercase mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>MAX COMBO</span>
            </div>
            <span className="font-heading text-2xl font-black text-amber-400">{stats.maxCombo}x</span>
          </div>

          <div className="bg-[#12141a] border border-slate-800 p-2.5 rounded text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-mono-tech uppercase mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>TIME</span>
            </div>
            <span className="font-heading text-2xl font-black text-white">{formatTime(stats.timeAlive)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {hasNextChapter && nextChapter ? (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={onNextChapter}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-heading text-lg sm:text-xl font-bold uppercase tracking-wider rounded shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all cursor-pointer"
              >
                <span>PROCEED TO CHAPTER {nextChapter.id}: {nextChapter.title}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="text-center font-mono-tech text-[11px] text-cyan-400 uppercase tracking-widest">
                🛡️ HANK EVOLUTION UNLOCKED: {nextChapter.hankOutfit}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/60 border border-amber-500/60 rounded text-amber-300 font-heading text-base font-bold uppercase tracking-wider mb-1">
              🎉 ALL STORY CHAPTERS CONQUERED! YOU ARE THE ULTIMATE NEVADA SURVIVOR!
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onReplayChapter}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#1e222d] hover:bg-[#282d3c] text-slate-200 border border-slate-700 rounded font-mono-tech text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>REPLAY</span>
            </button>

            <button
              onClick={onChapterSelect}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#1e222d] hover:bg-[#282d3c] text-slate-200 border border-slate-700 rounded font-mono-tech text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>CHAPTERS</span>
            </button>

            <button
              onClick={onMainMenu}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#1e222d] hover:bg-[#282d3c] text-slate-200 border border-slate-700 rounded font-mono-tech text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5 text-red-400" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
