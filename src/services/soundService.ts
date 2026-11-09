/**
 * PWA Digital Loy Krathong 2026 - Audio & Sound Engine
 * Provides authentic, relaxing Thai Loy Krathong background music (BGM)
 * and interactive sound effects (SFX) using Web Audio API.
 * 100% client-side, zero latency, no external audio file dependencies.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isBgmPlaying: boolean = false;
  private userExplicitlyMuted: boolean = false;
  private isWaitingForGesture: boolean = false;
  private bgmGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private bgmTimeoutId: any = null;
  private waterNoiseNode: AudioNode | null = null;
  private waterNoiseGain: GainNode | null = null;
  private activeBgmOscillators: OscillatorNode[] = [];
  private listeners: Array<(playing: boolean, waiting: boolean) => void> = [];

  constructor() {
    // Lazy initialized on user gesture or immediate page load
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master BGM Gain (soft background level)
      this.bgmGainNode = this.ctx.createGain();
      this.bgmGainNode.gain.setValueAtTime(0.20, this.ctx.currentTime);
      this.bgmGainNode.connect(this.ctx.destination);

      // Master SFX Gain (clear, pleasant, crisp level)
      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.sfxGainNode.connect(this.ctx.destination);

      // Listen for state change
      this.ctx.onstatechange = () => {
        if (this.ctx && this.ctx.state === 'running' && !this.userExplicitlyMuted && !this.isBgmPlaying) {
          this.executeStartLoop();
        }
      };
    }
  }

  public subscribe(listener: (playing: boolean, waiting: boolean) => void) {
    this.listeners.push(listener);
    listener(this.isBgmPlaying, this.isWaitingForGesture);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isBgmPlaying, this.isWaitingForGesture));
  }

  public isPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public isWaiting(): boolean {
    return this.isWaitingForGesture;
  }

  public toggleBgm(): boolean {
    if (this.isBgmPlaying || this.isWaitingForGesture) {
      this.userExplicitlyMuted = true;
      this.isWaitingForGesture = false;
      this.stopBgm();
      return false;
    } else {
      this.userExplicitlyMuted = false;
      this.startBgm();
      return true;
    }
  }

  // Auto-start music when web page opens, handling browser autoplay policy smoothly
  public autoStartOnLoad() {
    this.userExplicitlyMuted = false;
    this.initContext();

    // Try starting immediately
    this.startBgm();

    // Prepare global gesture unlocker (catches any click, tap, key, or pointer on the window)
    const unlockEvents = ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown'];
    const handleGesture = () => {
      if (this.userExplicitlyMuted) return;

      this.initContext();
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            if (!this.userExplicitlyMuted) {
              this.executeStartLoop();
            }
          }).catch(() => {});
        } else if (!this.isBgmPlaying && !this.userExplicitlyMuted) {
          this.executeStartLoop();
        }
      }

      unlockEvents.forEach((evt) => window.removeEventListener(evt, handleGesture, true));
    };

    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, handleGesture, { passive: true, capture: true });
    });
  }

  // Start the soft Loy Krathong Thai instrumental melody loop
  public startBgm() {
    this.userExplicitlyMuted = false;
    this.initContext();
    if (!this.ctx || !this.bgmGainNode) return;

    if (this.ctx.state === 'suspended') {
      this.isWaitingForGesture = true;
      this.notify();
      this.ctx.resume().then(() => {
        if (this.ctx && this.ctx.state === 'running' && !this.userExplicitlyMuted) {
          this.executeStartLoop();
        }
      }).catch(() => {});
      return;
    }

    this.executeStartLoop();
  }

  private executeStartLoop() {
    if (!this.ctx || !this.bgmGainNode || this.userExplicitlyMuted) return;
    if (this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    this.isWaitingForGesture = false;

    // Reset gain to active BGM level smoothly
    const now = this.ctx.currentTime;
    this.bgmGainNode.gain.cancelScheduledValues(now);
    this.bgmGainNode.gain.setValueAtTime(0.20, now);

    this.notify();

    // Start gentle Tapi River ambient water ripples
    this.startWaterAmbient();

    // Start loop of Loy Krathong song
    this.playLoyKrathongSongLoop();
  }

  // Stop BGM immediately - cancels all scheduled future notes instantly
  public stopBgm() {
    this.isBgmPlaying = false;
    this.isWaitingForGesture = false;

    // 1. Clear upcoming loop timer
    if (this.bgmTimeoutId) {
      clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }

    // 2. Immediately mute master BGM gain node so NO scheduled sound leaks through
    if (this.ctx && this.bgmGainNode) {
      const now = this.ctx.currentTime;
      this.bgmGainNode.gain.cancelScheduledValues(now);
      this.bgmGainNode.gain.setValueAtTime(0, now);
    }

    // 3. Stop and disconnect all actively scheduled/playing oscillator nodes immediately
    for (const osc of this.activeBgmOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Node might have already finished
      }
    }
    this.activeBgmOscillators = [];

    // 4. Stop water ambiance
    this.stopWaterAmbient();

    this.notify();
  }

  // Gentle river water wave ambiance using filtered noise
  private startWaterAmbient() {
    if (!this.ctx || !this.bgmGainNode || this.waterNoiseNode) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 1.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      noise.start();
      this.waterNoiseNode = noise;
      this.waterNoiseGain = gain;
    } catch {
      // Audio fallback
    }
  }

  private stopWaterAmbient() {
    if (this.waterNoiseNode) {
      try {
        (this.waterNoiseNode as any).stop();
        (this.waterNoiseNode as any).disconnect();
      } catch {}
      this.waterNoiseNode = null;
    }
    if (this.waterNoiseGain) {
      try {
        this.waterNoiseGain.disconnect();
      } catch {}
      this.waterNoiseGain = null;
    }
  }

  /**
   * Play Thai Ranat/Xylophone note with wooden percussive timbre
   */
  private playRanatNote(freq: number, startTime: number, duration: number, vol = 0.3) {
    if (!this.ctx || !this.bgmGainNode || !this.isBgmPlaying) return;

    // Fundamental Sine wave
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Warm wooden overtone
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.01, startTime);

    // Soft resonant bell overtone
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3.02, startTime);

    const noteGain = this.ctx.createGain();
    // Percussive strike envelope
    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(vol * 0.4, startTime + 0.12);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(duration, 0.7));

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    osc3.connect(noteGain);
    noteGain.connect(this.bgmGainNode);

    // Keep track of oscillators so we can stop them immediately if user clicks mute
    this.activeBgmOscillators.push(osc1, osc2, osc3);

    const cleanup = () => {
      this.activeBgmOscillators = this.activeBgmOscillators.filter(
        (o) => o !== osc1 && o !== osc2 && o !== osc3
      );
    };
    osc1.onended = cleanup;

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);

    osc1.stop(startTime + duration + 0.1);
    osc2.stop(startTime + duration + 0.1);
    osc3.stop(startTime + duration + 0.1);
  }

  /**
   * Traditional Thai Ching (ฉิ่ง / ฉับ) percussive rhythm
   */
  private playChing(isChing: boolean, startTime: number) {
    if (!this.ctx || !this.bgmGainNode || !this.isBgmPlaying) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isChing) {
      // ฉิ่ง: Open ringing brass chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2640, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.09, startTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      this.activeBgmOscillators.push(osc);
      osc.onended = () => {
        this.activeBgmOscillators = this.activeBgmOscillators.filter((o) => o !== osc);
      };

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    } else {
      // ฉับ: Muted damped brass tap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.06);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      this.activeBgmOscillators.push(osc);
      osc.onended = () => {
        this.activeBgmOscillators = this.activeBgmOscillators.filter((o) => o !== osc);
      };

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    }
  }

  /**
   * Complete melody of "วันเพ็ญเดือนสิบสอง" (Loy Krathong Song)
   */
  private playLoyKrathongSongLoop() {
    if (!this.isBgmPlaying || !this.ctx) return;

    const tempo = 92; // Traditional graceful Thai tempo
    const beat = 60 / tempo; // ~0.65s per beat
    const now = this.ctx.currentTime + 0.1;

    // Pitch definitions (Key of C / Thai Pentatonic Scale)
    const C4 = 261.63;
    const D4 = 293.66;
    const E4 = 329.63;
    const G4 = 392.00;
    const A4 = 440.00;
    const C5 = 523.25;
    const D5 = 587.33;
    const E5 = 659.25;
    const G5 = 783.99;

    // [note, durationInBeats, volumeMultiplier]
    const melody: Array<[number, number, number]> = [
      // ท่อน 1: วันเพ็ญเดือนสิบสอง น้ำนองเต็มตลิ่ง
      [G4, 0.5, 0.28], [G4, 0.5, 0.28], [A4, 0.5, 0.30], [C5, 1.0, 0.35], [A4, 0.5, 0.28],
      [G4, 1.0, 0.30], [E4, 0.5, 0.26], [D4, 0.5, 0.25], [C4, 1.0, 0.30],

      // ท่อน 2: เราทั้งหลายชายหญิง สนุกกันจริงวันลอยกระทง
      [G4, 0.5, 0.28], [G4, 0.5, 0.28], [A4, 0.5, 0.30], [C5, 1.0, 0.35], [A4, 0.5, 0.28],
      [C5, 0.5, 0.32], [A4, 0.5, 0.28], [G4, 0.5, 0.28], [E4, 0.5, 0.25], [D4, 0.5, 0.24], [C4, 1.5, 0.30],

      // ท่อน 3: ลอย ลอยกระทง, ลอย ลอยกระทง
      [C5, 0.5, 0.35], [C5, 0.5, 0.35], [A4, 0.5, 0.28], [C5, 1.0, 0.35],
      [C5, 0.5, 0.35], [C5, 0.5, 0.35], [A4, 0.5, 0.28], [C5, 1.0, 0.35],

      // ท่อน 4: ลอยกระทงกันแล้ว ขอเชิญน้องแก้วออกมารำวง
      [A4, 0.5, 0.28], [C5, 0.5, 0.32], [D5, 0.5, 0.35], [C5, 0.5, 0.32], [A4, 0.5, 0.28],
      [G4, 0.5, 0.28], [A4, 0.5, 0.28], [C5, 0.5, 0.32], [A4, 0.5, 0.28], [G4, 0.5, 0.26], [E4, 0.5, 0.24], [D4, 1.0, 0.25],

      // ท่อน 5: รำวงวันลอยกระทง, รำวงวันลอยกระทง
      [E4, 0.5, 0.25], [G4, 0.5, 0.28], [A4, 0.5, 0.30], [C5, 0.5, 0.35], [A4, 0.5, 0.30], [G4, 1.0, 0.30],
      [E4, 0.5, 0.25], [G4, 0.5, 0.28], [A4, 0.5, 0.30], [C5, 0.5, 0.35], [A4, 0.5, 0.30], [G4, 1.0, 0.30],

      // ท่อน 6: บุญจะส่งให้เราสุขใจ, บุญจะส่งให้เราสุขใจ
      [G4, 0.5, 0.28], [E4, 0.5, 0.25], [D4, 0.5, 0.24], [C4, 0.5, 0.28], [D4, 0.5, 0.26], [E4, 0.5, 0.26], [G4, 1.0, 0.30],
      [G4, 0.5, 0.28], [E4, 0.5, 0.25], [D4, 0.5, 0.24], [C4, 0.5, 0.28], [D4, 0.5, 0.26], [C4, 2.0, 0.32],
    ];

    let t = now;

    // Schedule melody notes
    melody.forEach(([freq, durBeats, vol]) => {
      const durSec = durBeats * beat;
      this.playRanatNote(freq, t, durSec * 0.95, vol);
      t += durSec;
    });

    // Schedule Thai Ching (ฉิ่ง-ฉับ) rhythmic accompaniment
    const totalDuration = t - now;
    let chingTime = now;
    let isChing = true;
    while (chingTime < t - 0.2) {
      this.playChing(isChing, chingTime);
      isChing = !isChing;
      chingTime += beat;
    }

    // Loop after completion with brief gentle breath
    const loopIntervalMs = (totalDuration + 0.8) * 1000;
    this.bgmTimeoutId = setTimeout(() => {
      if (this.isBgmPlaying) {
        this.playLoyKrathongSongLoop();
      }
    }, loopIntervalMs);
  }

  // ==========================================
  // SOUND EFFECTS (SFX) FOR USER INTERACTIONS
  // ==========================================

  /**
   * 1. Water Drop ("ติ๋ง") - for button clicks, wish selection, tabs
   */
  public playWaterDrop() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency drops slightly like a real water droplet
    osc.frequency.setValueAtTime(1450, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.12);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * 2. Krathong Selection ("เสียงกระดิ่งแก้วประกายดาว สดใส")
   * เมื่อคลิกเลือกประเภทกระทงดิจิทัล 5 สไตล์
   * เสียงคริสตัลใส กังวาน สดชื่น ระยิบระยับ (Bright Celestial Crystal Chime)
   */
  public playKrathongSelect() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;

    // Ascending bright crystal glockenspiel arpeggio
    // G5, C6, E6, G6, C7 (High, crystalline, joyful)
    const notes = [783.99, 1046.50, 1318.51, 1567.98, 2093.00];

    notes.forEach((freq, idx) => {
      const noteStart = t + idx * 0.045;
      
      // Fundamental crystal tone
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      // Shimmer overtone (adds silvery crystal clarity)
      const shimmer = this.ctx!.createOscillator();
      const shimmerGain = this.ctx!.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(freq * 2.01, noteStart);

      // Envelope: Fast crisp attack, bright sparkling sustain, clean decay
      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.30, noteStart + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.38);

      shimmerGain.gain.setValueAtTime(0.001, noteStart);
      shimmerGain.gain.linearRampToValueAtTime(0.12, noteStart + 0.004);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.sfxGainNode!);

      osc.start(noteStart);
      osc.stop(noteStart + 0.4);
      shimmer.start(noteStart);
      shimmer.stop(noteStart + 0.25);
    });

    // Magical high fairy dust sparkle at the peak (2600Hz -> 3300Hz)
    const sparkleStart = t + 0.18;
    const sparkleOsc = this.ctx.createOscillator();
    const sparkleGain = this.ctx.createGain();
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(2637.02, sparkleStart); // E7
    sparkleOsc.frequency.exponentialRampToValueAtTime(3135.96, sparkleStart + 0.12); // G7

    sparkleGain.gain.setValueAtTime(0.001, sparkleStart);
    sparkleGain.gain.linearRampToValueAtTime(0.18, sparkleStart + 0.01);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, sparkleStart + 0.30);

    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(this.sfxGainNode);
    sparkleOsc.start(sparkleStart);
    sparkleOsc.stop(sparkleStart + 0.32);

    // Light, gentle water ripple
    this.playWaterDrop();
  }

  /**
   * 3. Wish Release ("เสียงสายน้ำมงคลพร่างพราย สดใส")
   * เมื่อกดปล่อยกระทงลอยลงสู่สายน้ำตาปี
   * เปลี่ยนจากเสียงฆ้องทึบๆ เป็นเสียงพิณสายน้ำและระฆังมงคลพร่างพราย สดใส ร่าเริง ชื่นบาน (Radiant Celestial Harp & Water Sparkle)
   */
  public playWishRelease() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;

    // Fast radiant glissando of bright celebratory tones
    // C5, E5, G5, B5, C6, E6, G6, C7
    const glissNotes = [
      523.25, 659.25, 783.99, 987.77,
      1046.50, 1318.51, 1567.98, 2093.00,
    ];

    glissNotes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.035;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });

    // Sustained golden celestial chime chord at the climax
    // C6 + E6 + G6 + C7 resonating softly like radiant sunlight on the river
    const chordTime = t + 0.28;
    const chordFreqs = [1046.50, 1318.51, 1567.98, 2093.00];

    chordFreqs.forEach((freq, idx) => {
      const chordOsc = this.ctx!.createOscillator();
      const chordGain = this.ctx!.createGain();

      chordOsc.type = 'sine';
      chordOsc.frequency.setValueAtTime(freq, chordTime);

      chordGain.gain.setValueAtTime(0.001, chordTime);
      chordGain.gain.linearRampToValueAtTime(0.22 / (idx * 0.3 + 1), chordTime + 0.02);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, chordTime + 1.6);

      chordOsc.connect(chordGain);
      chordGain.connect(this.sfxGainNode!);

      chordOsc.start(chordTime);
      chordOsc.stop(chordTime + 1.7);
    });

    // Gentle upward water ripple splash ("จ๋อม...ติ๋ง")
    const splashTime = t + 0.05;
    const splashOsc = this.ctx.createOscillator();
    const splashGain = this.ctx.createGain();
    splashOsc.type = 'triangle';
    splashOsc.frequency.setValueAtTime(600, splashTime);
    splashOsc.frequency.exponentialRampToValueAtTime(1200, splashTime + 0.08);

    splashGain.gain.setValueAtTime(0.001, splashTime);
    splashGain.gain.linearRampToValueAtTime(0.18, splashTime + 0.01);
    splashGain.gain.exponentialRampToValueAtTime(0.0001, splashTime + 0.18);

    splashOsc.connect(splashGain);
    splashGain.connect(this.sfxGainNode);
    splashOsc.start(splashTime);
    splashOsc.stop(splashTime + 0.2);
  }

  /**
   * 4. Festive Celebration Arpeggio - on float completion & finish activity
   */
  public playCelebration() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    // Ascending Thai celebratory motif
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      const noteTime = t + idx * 0.065;
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.7);
    });
  }

  /**
   * 5. Capture Shutter & Sparkle Chime - when downloading the certificate card
   */
  public playCapture() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;

    // Quick camera shutter click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.08);

    // Followed by magical star chime
    setTimeout(() => {
      if (this.ctx && this.sfxGainNode) {
        const t2 = this.ctx.currentTime;
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(1760, t2);
        chime.frequency.exponentialRampToValueAtTime(2640, t2 + 0.2);

        chimeGain.gain.setValueAtTime(0.2, t2);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.35);

        chime.connect(chimeGain);
        chimeGain.connect(this.sfxGainNode);
        chime.start(t2);
        chime.stop(t2 + 0.4);
      }
    }, 90);
  }
}

export const soundService = new SoundService();
