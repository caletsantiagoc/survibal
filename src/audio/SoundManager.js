/**
 * SoundManager - Procedural Web Audio API sound effects and ambient music.
 * Generates all audio dynamically with no external files or network requests required.
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientPlaying = false;
    this.ambientInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // --- Core Tone Generator ---
  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.2, pitchSlide = null) {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchSlide !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, pitchSlide), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // --- Sound Effects ---
  playAttack() {
    // Sword slash whoosh: white noise + quick pitch drop
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {}
  }

  playHit() {
    // Punch / weapon hit impact
    this.playTone(180, 'square', 0.12, 0.25, 40);
  }

  playChop() {
    // Wood chop
    this.playTone(280, 'triangle', 0.08, 0.2, 80);
  }

  playMine() {
    // Pickaxe on rock
    this.playTone(880, 'triangle', 0.1, 0.25, 300);
  }

  playCollect() {
    // Item pickup chime
    if (this.muted) return;
    this.init();
    const now = this.ctx ? this.ctx.currentTime : 0;
    setTimeout(() => this.playTone(523.25, 'sine', 0.08, 0.15), 0);
    setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.2), 60);
  }

  playCraft() {
    // Anvil strike
    this.playTone(600, 'triangle', 0.15, 0.3, 1200);
    setTimeout(() => this.playTone(900, 'sine', 0.25, 0.25, 400), 100);
  }

  playEat() {
    this.playTone(200, 'sawtooth', 0.08, 0.15, 100);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.08, 0.15, 90), 80);
  }

  playDrink() {
    this.playTone(400, 'sine', 0.1, 0.2, 600);
    setTimeout(() => this.playTone(450, 'sine', 0.12, 0.2, 700), 100);
  }

  playLevelUp() {
    // Fanfare: C5, E5, G5, C6 triumphant chords
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.28, 0.25);
      }, idx * 90);
    });
  }

  playQuestComplete() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.2);
      }, idx * 75);
    });
  }

  playEnemyRoar() {
    this.playTone(110, 'sawtooth', 0.25, 0.2, 60);
  }

  playBossRoar() {
    this.playTone(70, 'sawtooth', 0.6, 0.35, 30);
  }

  startAmbientMusic() {
    if (this.ambientPlaying) return;
    this.ambientPlaying = true;
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];
    let chordIdx = 0;

    this.ambientInterval = setInterval(() => {
      if (this.muted) return;
      this.init();
      const chord = chords[chordIdx];
      chord.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 1.8, 0.035);
        }, i * 200);
      });
      chordIdx = (chordIdx + 1) % chords.length;
    }, 4000);
  }
}
