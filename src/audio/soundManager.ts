/**
 * Web Audio API Sound System for Madness Combat: No Context
 * Generates crunching punch impacts, gunshots, shell pings, and industrial synth bass
 * completely in-browser without external asset dependencies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = true;
  private musicInterval: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Ensure context is unlocked on click
  public unlock() {
    this.initContext();
  }

  // 1. Cinematic Industrial Intro Impact
  public playIntroHit() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Sub bass drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.9);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.2);

    // Metal strike noise
    this.playNoise(0.2, 0.4, 2500, 'bandpass');
  }

  // 2. Punch Impact
  public playPunch() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);

    // Punch thud noise
    this.playNoise(0.07, 0.35, 1200, 'lowpass');
  }

  // 3. Knife Slash Swoosh
  public playSlash() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // 4. Pistol Gunshot (Crisp, snappy)
  public playPistol() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Low pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);

    // Crack noise
    this.playNoise(0.14, 0.45, 3000, 'lowpass');
  }

  // 5. Shotgun Blast (Heavy rumble + wide punch)
  public playShotgun() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Sub bass kick
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.35);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);

    // Loud noise explosion
    this.playNoise(0.28, 0.6, 2200, 'lowpass');

    // Pump sound after short delay
    setTimeout(() => {
      this.playPump();
    }, 280);
  }

  // Shotgun pump action sound
  private playPump() {
    if (!this.sfxEnabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // 6. Uzi Rapid Gunshot
  public playUzi() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);

    this.playNoise(0.06, 0.3, 4000, 'bandpass');
  }

  // 7. Bullet Casing Ping
  public playCasingPing() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const freqs = [1800, 2200, 2600, 3100];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Dry fire / mechanical locked weapon click
  public playDryFire() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.04);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  // 8. Blood Squish / Gore Splat
  public playBloodSplat() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);

    this.playNoise(0.12, 0.28, 1500, 'lowpass');
  }

  // 9. Slow-mo whoosh
  public playSlowMo(enter: boolean) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    if (enter) {
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    } else {
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.2);
    }

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Helper: White noise burst generator
  private playNoise(duration: number, volume: number, filterFreq: number, filterType: BiquadFilterType = 'lowpass') {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  private currentTrack: 'combat' | 'boombox' | null = null;

  // 10. Background Industrial Techno Combat Beat (Cheshyre / Madness Combat style!)
  public startCombatMusic() {
    if (this.isMusicPlaying && this.currentTrack === 'combat') return;
    this.stopMusic();
    this.isMusicPlaying = true;
    this.currentTrack = 'combat';
    this.initContext();

    const bpm = 135;
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th notes

    // Bassline note pitches (D minor industrial pattern: D, D, F, G, D, D, C, D)
    const bassNotes = [
      73.42, 73.42, 0, 73.42,
      87.31, 0, 98.00, 73.42,
      73.42, 73.42, 0, 65.41,
      73.42, 0, 87.31, 0
    ];

    this.musicStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') {
        return;
      }

      const t = this.ctx.currentTime;
      const step = this.musicStep % 16;
      this.musicStep++;

      // Kick on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(t);
        kickOsc.stop(t + 0.15);
      }

      // Snare / Clap on beats 4 and 12
      if (step === 4 || step === 12) {
        this.playNoise(0.12, 0.22, 1800, 'bandpass');
      }

      // Hi-hat on offbeats
      if (step % 2 === 1) {
        this.playNoise(0.04, 0.08, 7000, 'highpass');
      }

      // Industrial Sawtooth Bass Note
      const noteFreq = bassNotes[step];
      if (noteFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilter = this.ctx.createBiquadFilter();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(noteFreq, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, t);
        bassFilter.frequency.exponentialRampToValueAtTime(180, t + 0.12);
        bassFilter.Q.value = 4;

        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(t);
        bassOsc.stop(t + 0.15);
      }
    }, stepDurationMs);
  }

  // 11. Upbeat Retro Boombox Dance Melody (For Chapter 1: Where It All Started)
  public startBoomboxMusic() {
    if (this.isMusicPlaying && this.currentTrack === 'boombox') return;
    this.stopMusic();
    this.isMusicPlaying = true;
    this.currentTrack = 'boombox';
    this.initContext();

    const bpm = 126;
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th notes

    // Funky bouncy bassline (A minor / C major dance groove)
    const boomboxBass = [
      110.00, 0, 110.00, 130.81, 
      0, 146.83, 0, 164.81, 
      110.00, 0, 110.00, 98.00, 
      0, 110.00, 130.81, 0
    ];

    // Cheerful arpeggiated dance lead melody
    const boomboxLead = [
      440.00, 0, 523.25, 0, 
      659.25, 587.33, 523.25, 0, 
      440.00, 523.25, 659.25, 0, 
      587.33, 0, 523.25, 392.00
    ];

    this.musicStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') {
        return;
      }

      const t = this.ctx.currentTime;
      const step = this.musicStep % 16;
      this.musicStep++;

      // Punchy Disco Kick
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, t);
        kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.1);
        kickGain.gain.setValueAtTime(0.32, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(t);
        kickOsc.stop(t + 0.13);
      }

      // Crisp Disco Snare
      if (step === 4 || step === 12) {
        this.playNoise(0.09, 0.18, 2400, 'bandpass');
      }

      // Funky hi-hat groove
      if (step % 2 === 1 || step % 4 === 2) {
        this.playNoise(0.03, 0.07, 8500, 'highpass');
      }

      // Bouncy bass note
      const bassFreq = boomboxBass[step];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      }

      // Cheerful synth lead (Every 2 steps or syncopated)
      const leadFreq = boomboxLead[step];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        const leadFilter = this.ctx.createBiquadFilter();

        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadFilter.type = 'lowpass';
        leadFilter.frequency.setValueAtTime(1600, t);
        leadFilter.Q.value = 2;

        leadGain.gain.setValueAtTime(0.12, t);
        leadGain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);

        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(this.ctx.destination);

        leadOsc.start(t);
        leadOsc.stop(t + 0.15);
      }
    }, stepDurationMs);
  }

  public stopCombatMusic() {
    this.stopMusic();
  }

  public stopBoomboxMusic() {
    this.stopMusic();
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
    this.currentTrack = null;
  }
}

export const soundManager = new SoundManager();
