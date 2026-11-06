import React from 'react';
import { X, Play, Skull, MapPin, Music, Radio, ChevronRight, Shield } from 'lucide-react';
import { STORY_CHAPTERS, StoryChapter } from '../types/game';

interface ChapterSelectModalProps {
  onClose: () => void;
  onSelectChapter: (chapterId: number) => void;
  unlockedChapterMax: number;
}

export const ChapterSelectModal: React.FC<ChapterSelectModalProps> = ({
  onClose,
  onSelectChapter,
  unlockedChapterMax,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#181a22] to-[#0f1117] border-2 border-red-600/80 rounded-md shadow-[0_0_50px_rgba(220,38,38,0.3)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#12141a]">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
                MADNESS COMBAT: STORY CAMPAIGN
              </h2>
              <p className="font-mono-tech text-xs text-slate-400">
                CHRONICLES OF HANK J. WIMBLETON
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-[#1e222d] border border-slate-700 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {STORY_CHAPTERS.map((ch) => {
            const isUnlocked = ch.id <= Math.max(unlockedChapterMax, 4); // Allow player to select any of the 4 iconic chapters
            return (
              <div
                key={ch.id}
                className={`relative rounded-md border p-4 sm:p-5 transition-all ${
                  isUnlocked
                    ? 'bg-[#141720] border-slate-700/80 hover:border-red-500/80 hover:bg-[#1a1e2a]'
                    : 'bg-[#0f1117]/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[11px] font-mono-tech font-bold uppercase">
                        CHAPTER {ch.id}
                      </span>
                      <span className="text-xs font-mono-tech text-slate-400 uppercase">
                        {ch.subtitle}
                      </span>
                    </div>

                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-white uppercase tracking-wide">
                      {ch.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-mono-tech mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{ch.location}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 font-sans mt-2 leading-relaxed">
                      {ch.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono-tech text-slate-400">
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <Skull className="w-3.5 h-3.5" />
                        <span>QUOTA: {ch.totalGrunts} GRUNTS {ch.oneByOne ? '(1-BY-1 ASSAULT)' : ''}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Music className="w-3.5 h-3.5" />
                        <span>AUDIO: {ch.musicType === 'boombox' ? 'UPBEAT BOOMBOX DANCE' : 'INDUSTRIAL COMBAT SYNTH'}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>HANK: {ch.hankOutfit.toUpperCase()}</span>
                      </span>
                      <span>·</span>
                      <span className="text-amber-300">
                        START: {ch.startingWeapon.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectChapter(ch.id)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-heading text-base font-bold uppercase tracking-wider rounded shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>DEPART</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0d0f14] border-t border-slate-800 text-center font-mono-tech text-xs text-slate-400">
          MADNESS COMBAT: CREATED BY KRINKELS · REPRODUCED IN HIGH-OCTANE ENGINE
        </div>

      </div>
    </div>
  );
};
