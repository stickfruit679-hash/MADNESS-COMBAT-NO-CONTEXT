/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameView, GameStats, WeaponType, Weapon, GoreSetting, BloodAmount } from './types/game';
import { createWeaponInstance } from './utils/weapons';
import { soundManager } from './audio/soundManager';
import { inputController } from './utils/inputController';
import { IntroScreen } from './components/IntroScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { MobileControls } from './components/MobileControls';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const [view, setView] = useState<GameView>('INTRO_NEURON');
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [slowMoActive, setSlowMoActive] = useState<boolean>(false);

  // Session ID to reset the GameCanvas completely when restarting
  const [gameSessionId, setGameSessionId] = useState<number>(0);

  // Gore setting: 'no_blood' | 'default' | 'extreme_gore'
  const [goreSetting, setGoreSetting] = useState<GoreSetting>(() => {
    try {
      const saved = localStorage.getItem('mc_gore_setting');
      if (saved === 'no_blood' || saved === 'default' || saved === 'extreme_gore') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'default';
  });

  // Blood amount setting: 'very_little' | 'not_much' | 'too_much'
  // Default is 'not_much' (clean, reduced blood to prevent any lag)
  const [bloodAmount, setBloodAmount] = useState<BloodAmount>(() => {
    try {
      const saved = localStorage.getItem('mc_blood_amount');
      if (saved === 'very_little' || saved === 'not_much' || saved === 'too_much') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'not_much';
  });

  // Mobile Controls display state
  const [showMobileControls, setShowMobileControls] = useState<boolean>(true);

  // Weapons & Player State (250 HP gives protagonist enough durability)
  const playerMaxHealth = 250;
  const [playerHealth, setPlayerHealth] = useState<number>(250);
  const [currentWeapon, setCurrentWeapon] = useState<Weapon>(createWeaponInstance('pistol'));

  // Game Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    wave: 1,
    shotsFired: 0,
    shotsHit: 0,
    comboStreak: 0,
    maxCombo: 0,
    timeAlive: 0,
  });

  // Auto detect mobile/touch devices or small screen
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 900;
    setShowMobileControls(isTouch);
  }, []);

  // Update and persist gore setting
  const handleSelectGoreSetting = useCallback((setting: GoreSetting) => {
    setGoreSetting(setting);
    try {
      localStorage.setItem('mc_gore_setting', setting);
    } catch {
      // ignore
    }
  }, []);

  // Update and persist blood amount setting
  const handleSelectBloodAmount = useCallback((amount: BloodAmount) => {
    setBloodAmount(amount);
    try {
      localStorage.setItem('mc_blood_amount', amount);
    } catch {
      // ignore
    }
  }, []);

  // Cycle through gore settings from HUD
  const handleCycleGore = useCallback(() => {
    const order: GoreSetting[] = ['no_blood', 'default', 'extreme_gore'];
    const nextIdx = (order.indexOf(goreSetting) + 1) % order.length;
    handleSelectGoreSetting(order[nextIdx]);
  }, [goreSetting, handleSelectGoreSetting]);

  // Cycle through blood amount settings from HUD
  const handleCycleBloodAmount = useCallback(() => {
    const order: BloodAmount[] = ['very_little', 'not_much', 'too_much'];
    const nextIdx = (order.indexOf(bloodAmount) + 1) % order.length;
    handleSelectBloodAmount(order[nextIdx]);
  }, [bloodAmount, handleSelectBloodAmount]);

  // Reset Game for new session (Full reset!)
  const startNewGame = useCallback(() => {
    inputController.resetAll();
    setGameSessionId((prev) => prev + 1); // Triggers full GameCanvas entity & player wipe
    setPlayerHealth(250);
    setCurrentWeapon(createWeaponInstance('pistol'));
    setStats({
      score: 0,
      kills: 0,
      wave: 1,
      shotsFired: 0,
      shotsHit: 0,
      comboStreak: 0,
      maxCombo: 0,
      timeAlive: 0,
    });
    setSlowMoActive(false);
    setIsPaused(false);
    setView('PLAYING');
  }, []);

  // Handle Player Death
  const handlePlayerDeath = useCallback(() => {
    inputController.resetAll();
    setPlayerHealth(0);
    soundManager.playSlowMo(false);
    setTimeout(() => {
      setView('GAME_OVER');
    }, 1200);
  }, []);

  // Sound Toggle
  const toggleSound = useCallback(() => {
    soundManager.unlock();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.sfxEnabled = next;
    soundManager.musicEnabled = next;
    if (!next) {
      soundManager.stopCombatMusic();
    } else if (view === 'PLAYING') {
      soundManager.startCombatMusic();
    }
  }, [soundEnabled, view]);

  // Slow-Mo Toggle
  const toggleSlowMo = useCallback(() => {
    const next = !slowMoActive;
    setSlowMoActive(next);
    soundManager.playSlowMo(next);
  }, [slowMoActive]);

  // Weapon Hotbar Selector
  const handleSelectWeapon = useCallback((type: WeaponType) => {
    const newWeapon = createWeaponInstance(type);
    setCurrentWeapon(newWeapon);
    soundManager.playPistol();
  }, []);

  // Cycle Weapon on Mobile
  const handleCycleWeapon = useCallback(() => {
    const types: WeaponType[] = ['fists', 'knife', 'pistol', 'shotgun', 'uzi'];
    const currentIndex = types.indexOf(currentWeapon.type);
    const nextType = types[(currentIndex + 1) % types.length];
    handleSelectWeapon(nextType);
  }, [currentWeapon.type, handleSelectWeapon]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0c10] select-none text-slate-100">
      
      {/* 1. INTRO SEQUENCE ("Powered By Neuron" -> "MADNESS COMBAT: NO CONTEXT") */}
      {view === 'INTRO_NEURON' && (
        <IntroScreen
          onStartGame={startNewGame}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          goreSetting={goreSetting}
          onSelectGoreSetting={handleSelectGoreSetting}
          bloodAmount={bloodAmount}
          onSelectBloodAmount={handleSelectBloodAmount}
        />
      )}

      {/* 2. ACTIVE PLAY VIEW */}
      {(view === 'PLAYING' || view === 'PAUSED' || view === 'GAME_OVER') && (
        <div className="relative w-full h-full">
          {/* Main Canvas Engine */}
          <GameCanvas
            gameSessionId={gameSessionId}
            stats={stats}
            onUpdateStats={setStats}
            onPlayerDeath={handlePlayerDeath}
            onPlayerHealthUpdate={(curr) => setPlayerHealth(curr)}
            currentWeaponType={currentWeapon.type}
            onWeaponChange={setCurrentWeapon}
            slowMoActive={slowMoActive}
            onToggleSlowMo={toggleSlowMo}
            isPaused={isPaused || view === 'GAME_OVER'}
            goreSetting={goreSetting}
            bloodAmount={bloodAmount}
          />

          {/* In-Game Heads-Up Display */}
          <GameHUD
            health={playerHealth}
            maxHealth={playerMaxHealth}
            weapon={currentWeapon}
            stats={stats}
            slowMoActive={slowMoActive}
            slowMoAvailable={stats.comboStreak >= 3 || slowMoActive}
            soundEnabled={soundEnabled}
            showMobileControls={showMobileControls}
            goreSetting={goreSetting}
            bloodAmount={bloodAmount}
            onToggleSound={toggleSound}
            onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
            onCycleGore={handleCycleGore}
            onCycleBloodAmount={handleCycleBloodAmount}
            onToggleSlowMo={toggleSlowMo}
            onSelectWeapon={handleSelectWeapon}
            onPause={() => setIsPaused(true)}
          />

          {/* On-Screen Mobile Movement Buttons (D-Pad & Stick) & Action Buttons */}
          {showMobileControls && view === 'PLAYING' && !isPaused && (
            <MobileControls
              currentWeaponType={currentWeapon.type}
              onCycleWeapon={handleCycleWeapon}
              isDodging={false}
            />
          )}

          {/* Scanline CRT overlay */}
          <div className="scanlines absolute inset-0 pointer-events-none z-10 opacity-70" />
        </div>
      )}

      {/* 3. PAUSE MENU */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onRestart={startNewGame}
          onMainMenu={() => {
            setIsPaused(false);
            soundManager.stopCombatMusic();
            setView('INTRO_NEURON');
          }}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          showMobileControls={showMobileControls}
          onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
          goreSetting={goreSetting}
          onSelectGoreSetting={handleSelectGoreSetting}
          bloodAmount={bloodAmount}
          onSelectBloodAmount={handleSelectBloodAmount}
        />
      )}

      {/* 4. GAME OVER SCREEN */}
      {view === 'GAME_OVER' && (
        <GameOverModal
          stats={stats}
          onRestart={startNewGame}
          onMainMenu={() => {
            soundManager.stopCombatMusic();
            setView('INTRO_NEURON');
          }}
        />
      )}

      {/* 5. HOW TO PLAY / CONTROLS MODAL */}
      {showHowToPlay && (
        <HowToPlayModal
          onClose={() => setShowHowToPlay(false)}
          onStartGame={view === 'INTRO_NEURON' ? startNewGame : undefined}
        />
      )}

    </div>
  );
}
