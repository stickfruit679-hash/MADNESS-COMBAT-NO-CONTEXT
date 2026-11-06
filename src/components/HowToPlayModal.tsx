import React from 'react';
import { X, Crosshair, Move, Shield, Zap, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
  onStartGame?: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, onStartGame }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-2xl bg-[#12151b] border-2 border-red-700/60 rounded-md shadow-[0_0_40px_rgba(220,38,38,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181c24] border-b border-red-900/50">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-red-500" />
            <h2 className="font-heading text-2xl font-bold text-white tracking-wide uppercase">
              FIELD COMBAT MANUAL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-red-950/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 font-sans">
          
          {/* PC Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-red-400 font-heading text-lg font-bold uppercase tracking-wider">
              <Move className="w-5 h-5" />
              <span>PC CONTROLS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono-tech text-xs">
              <div className="p-3 bg-[#171a22] border border-slate-800 rounded">
                <span className="text-amber-400 font-bold block mb-1">MOVEMENT:</span>
                <p className="text-slate-200">WASD or Arrow Keys</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Fluid stepping & body tilt</p>
              </div>

              <div className="p-3 bg-[#171a22] border border-slate-800 rounded">
                <span className="text-red-400 font-bold block mb-1">AIM & ATTACK:</span>
                <p className="text-slate-200">Mouse Aim + Left Click</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Punch, slash, or shoot</p>
              </div>

              <div className="p-3 bg-[#171a22] border border-slate-800 rounded">
                <span className="text-blue-400 font-bold block mb-1">DODGE ROLL:</span>
                <p className="text-slate-200">Spacebar or Left Shift</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Invulnerable bullet dodge</p>
              </div>

              <div className="p-3 bg-[#171a22] border border-slate-800 rounded">
                <span className="text-emerald-400 font-bold block mb-1">WEAPON SWITCH:</span>
                <p className="text-slate-200">Keys 1 - 5 or Q Key</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Fists, Knife, Pistol, Shotgun, Uzi</p>
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-red-400 font-heading text-lg font-bold uppercase tracking-wider">
              <Zap className="w-5 h-5" />
              <span>MOBILE / TOUCH CONTROLS</span>
            </div>
            <div className="p-4 bg-[#171a22] border border-slate-800 rounded space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-red-950/80 text-red-400 font-mono-tech rounded text-[11px] font-bold">LEFT THUMB:</span>
                <span>Virtual Analog Joystick / Directional D-Pad for 360° running.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-red-950/80 text-red-400 font-mono-tech rounded text-[11px] font-bold">RIGHT THUMB:</span>
                <span>On-screen Tactical Action buttons: Attack / Fire, Melee Punch, Dodge Roll, and Weapon Swap.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-red-950/80 text-red-400 font-mono-tech rounded text-[11px] font-bold">AUTO-TARGET:</span>
                <span>Mobile attacks automatically snap aim to nearest hostile grunt!</span>
              </div>
            </div>
          </div>

          {/* Authentic Madness Combat Mechanics */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-400 font-heading text-lg font-bold uppercase tracking-wider">
              <Shield className="w-5 h-5" />
              <span>ANIMATION & COMBAT FEATURES</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li><strong>Floating Body Parts:</strong> Independent head, torso, hands, and feet animate dynamically with breathing, walking cycles, punch thrusts, and gun recoil.</li>
              <li><strong>Weapon Progression:</strong> In Story Mode, weapons start locked (starting with bare fists) and unlock into your permanent arsenal as you pick them up from fallen foes. In Normal Mode, all weapons are unlocked immediately and enemies do not drop weapons.</li>
              <li><strong>Bullet Time / Slow-Mo:</strong> String together 3+ combo kills to activate adrenaline bullet-time slow-motion!</li>
              <li><strong>Dismemberment Gore:</strong> Vanquished foes burst into floating body parts with bloody decals that stain the Nevada concrete floor.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#181c24] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono-tech text-slate-400 hover:text-white uppercase transition-colors cursor-pointer"
          >
            CLOSE
          </button>

          {onStartGame && (
            <button
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-base uppercase tracking-wider rounded transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] cursor-pointer"
            >
              DEPLOY TO ARENA
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
