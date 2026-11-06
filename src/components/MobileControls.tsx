import React, { useRef, useState, useEffect } from 'react';
import { Crosshair, Shield, RefreshCw, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { WeaponType } from '../types/game';
import { inputController } from '../utils/inputController';

interface MobileControlsProps {
  currentWeaponType: WeaponType;
  onCycleWeapon: () => void;
  isDodging: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  currentWeaponType,
  onCycleWeapon,
  isDodging,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Active D-Pad visual states
  const [activeDpad, setActiveDpad] = useState<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Reset Joystick
  const resetJoystick = () => {
    setIsDragging(false);
    activePointerIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    inputController.setJoystick(0, 0);
  };

  const handleJoystickPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);
    handleJoystickMove(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    handleJoystickMove(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current === e.pointerId) {
      e.preventDefault();
      resetJoystick();
    }
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2 - 12;

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });

    // Send normalized vector (-1 to 1) directly to controller
    const normX = dx / maxRadius;
    const normY = dy / maxRadius;
    inputController.setJoystick(normX, normY);
  };

  // D-Pad Button Handlers
  const handleDPad = (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    inputController.setDPad(dir, pressed);
    setActiveDpad((prev) => ({ ...prev, [dir]: pressed }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex justify-between items-end p-3 sm:p-6 pb-6 touch-none">
      
      {/* LEFT: On-Screen Movement Controls (D-Pad Buttons + Virtual Stick) */}
      <div className="relative pointer-events-auto flex flex-col items-center">
        
        {/* Unified Movement Pad: Directional Buttons surrounding the Analog Stick */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          
          {/* UP Button */}
          <button
            onPointerDown={(e) => { e.preventDefault(); handleDPad('up', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleDPad('up', false); }}
            onPointerLeave={() => handleDPad('up', false)}
            className={`absolute top-0 w-12 h-11 rounded-t-lg border-2 border-red-900/80 flex items-center justify-center transition-all ${
              activeDpad.up ? 'bg-red-600 text-white scale-95 shadow-[0_0_12px_rgba(220,38,38,0.8)]' : 'bg-slate-900/90 text-slate-300'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* DOWN Button */}
          <button
            onPointerDown={(e) => { e.preventDefault(); handleDPad('down', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleDPad('down', false); }}
            onPointerLeave={() => handleDPad('down', false)}
            className={`absolute bottom-0 w-12 h-11 rounded-b-lg border-2 border-red-900/80 flex items-center justify-center transition-all ${
              activeDpad.down ? 'bg-red-600 text-white scale-95 shadow-[0_0_12px_rgba(220,38,38,0.8)]' : 'bg-slate-900/90 text-slate-300'
            }`}
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          {/* LEFT Button */}
          <button
            onPointerDown={(e) => { e.preventDefault(); handleDPad('left', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleDPad('left', false); }}
            onPointerLeave={() => handleDPad('left', false)}
            className={`absolute left-0 w-11 h-12 rounded-l-lg border-2 border-red-900/80 flex items-center justify-center transition-all ${
              activeDpad.left ? 'bg-red-600 text-white scale-95 shadow-[0_0_12px_rgba(220,38,38,0.8)]' : 'bg-slate-900/90 text-slate-300'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* RIGHT Button */}
          <button
            onPointerDown={(e) => { e.preventDefault(); handleDPad('right', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleDPad('right', false); }}
            onPointerLeave={() => handleDPad('right', false)}
            className={`absolute right-0 w-11 h-12 rounded-r-lg border-2 border-red-900/80 flex items-center justify-center transition-all ${
              activeDpad.right ? 'bg-red-600 text-white scale-95 shadow-[0_0_12px_rgba(220,38,38,0.8)]' : 'bg-slate-900/90 text-slate-300'
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Center Analog Stick */}
          <div
            ref={joystickRef}
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={resetJoystick}
            className="w-24 h-24 rounded-full bg-black/80 border-2 border-red-600/40 shadow-inner flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
          >
            <div
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-b from-red-600 to-red-950 border border-red-400 shadow-[0_0_12px_rgba(220,38,38,0.6)] flex items-center justify-center pointer-events-none"
            >
              <div className="w-4 h-4 rounded-full bg-red-400/50" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5 font-mono-tech text-[10px] text-slate-400 tracking-wider uppercase bg-black/70 px-2 py-0.5 rounded border border-slate-800">
          <span>D-PAD / STICK MOVEMENT</span>
        </div>
      </div>

      {/* RIGHT: Action Buttons Cluster */}
      <div className="relative pointer-events-auto flex flex-col items-end gap-3 touch-none">
        
        {/* Top Action Row: Dodge + Weapon Swap */}
        <div className="flex items-center gap-3">
          {/* Dodge Roll Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputController.triggerDodge();
            }}
            disabled={isDodging}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border font-heading font-bold text-xs uppercase shadow-lg transition-all active:scale-90 ${
              isDodging 
                ? 'bg-slate-800 text-slate-500 border-slate-700' 
                : 'bg-blue-950 text-blue-300 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)] active:bg-blue-700 active:text-white'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px]">DODGE</span>
          </button>

          {/* Cycle Weapon Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onCycleWeapon();
            }}
            className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 flex flex-col items-center justify-center font-heading font-bold text-xs uppercase shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-90 active:bg-emerald-700 active:text-white transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[9px] uppercase">{currentWeaponType}</span>
          </button>
        </div>

        {/* Bottom Action Row: Melee + Primary Fire */}
        <div className="flex items-center gap-3">
          {/* Quick Melee Punch Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputController.triggerMelee();
            }}
            className="w-16 h-16 rounded-full bg-amber-950 text-amber-300 border-2 border-amber-500 flex flex-col items-center justify-center font-heading font-bold text-xs uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-90 active:bg-amber-600 active:text-white transition-all"
          >
            <Zap className="w-6 h-6" />
            <span className="text-[10px]">PUNCH</span>
          </button>

          {/* Big Red Fire / Attack Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputController.setAttack(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              inputController.setAttack(false);
            }}
            onPointerLeave={() => {
              inputController.setAttack(false);
            }}
            className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-red-600 to-red-950 text-white border-2 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.8)] flex flex-col items-center justify-center font-heading font-bold text-sm sm:text-base uppercase tracking-wider active:scale-90 active:from-red-500 active:to-red-800 transition-all cursor-pointer"
          >
            <Crosshair className="w-9 h-9 sm:w-10 sm:h-10 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black">ATTACK</span>
          </button>
        </div>

      </div>

    </div>
  );
};
