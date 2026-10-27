// Retro 8-bit Chiptune Sound Synthesizer via Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentBgm: string | null = null;
  private bgmInterval: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser policy
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.gain.value = 0.25;
      this.sfxGain.gain.value = 0.35;

      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public unlock() {
    this.initCtx();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicGain && this.sfxGain) {
      const val = this.isMuted ? 0 : 1;
      this.musicGain.gain.value = val * 0.25;
      this.sfxGain.gain.value = val * 0.35;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play a single retro tone
  public playTone(freq: number, type: OscillatorType, duration: number, startTime?: number, endFreq?: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = startTime ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), t + duration);
    }

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // SFX: Button Select / Cursor Move
  public playSelect() {
    this.playTone(600, 'square', 0.05);
  }

  // SFX: Confirm / A button
  public playConfirm() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.playTone(523.25, 'square', 0.06, t);       // C5
    this.playTone(659.25, 'square', 0.08, t + 0.06); // E5
  }

  // SFX: Cancel / B button
  public playCancel() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.playTone(400, 'square', 0.05, t);
    this.playTone(280, 'square', 0.08, t + 0.05);
  }

  // SFX: Bump into wall
  public playBump() {
    this.playTone(100, 'triangle', 0.08, undefined, 40);
  }

  // SFX: Walking in grass rustle
  public playGrassRustle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // Filtered noise for grass rustling
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // SFX: Wild encounter alert
  public playEncounter() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Rapid ascending arpeggio
    const notes = [440, 554, 659, 880, 1108, 1318, 1760];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.05, t + idx * 0.035);
    });
  }

  // SFX: Hit / Tackle attack
  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    this.playTone(180, 'square', 0.12, t, 40);

    // Add noise thump
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;
    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  // SFX: Special attack (Fire, Water, Lightning)
  public playSpecial(type: 'fire' | 'water' | 'electric' | 'grass') {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (type === 'fire') {
      this.playTone(200, 'sawtooth', 0.25, t, 600);
      this.playTone(300, 'square', 0.25, t + 0.05, 100);
    } else if (type === 'water') {
      this.playTone(500, 'sine', 0.2, t, 1200);
      this.playTone(800, 'sine', 0.2, t + 0.1, 400);
    } else if (type === 'electric') {
      for (let i = 0; i < 4; i++) {
        this.playTone(600 + Math.random() * 400, 'sawtooth', 0.06, t + i * 0.05);
      }
    } else {
      // Grass / Razor Leaf
      this.playTone(400, 'triangle', 0.15, t, 900);
      this.playTone(900, 'triangle', 0.15, t + 0.08, 300);
    }
  }

  // SFX: Pokéball throw & wobble
  public playBallThrow() {
    this.playTone(300, 'sine', 0.2, undefined, 800);
  }

  public playBallWobble() {
    this.playTone(500, 'triangle', 0.1, undefined, 350);
  }

  // SFX: Catch success
  public playCatchSuccess() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const melody = [523, 659, 784, 1046]; // C E G C
    melody.forEach((freq, idx) => {
      this.playTone(freq, 'square', 0.12, t + idx * 0.1);
    });
  }

  // SFX: Level Up Fanfare
  public playLevelUp() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [
      { f: 523, d: 0.1 },
      { f: 659, d: 0.1 },
      { f: 784, d: 0.1 },
      { f: 1046, d: 0.25 },
      { f: 880, d: 0.1 },
      { f: 1046, d: 0.4 },
    ];
    let cur = t;
    notes.forEach((n) => {
      this.playTone(n.f, 'square', n.d, cur);
      cur += n.d + 0.02;
    });
  }

  // SFX: Pokémon Center Healing Chime
  public playHealChime() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [659, 587, 523, 659, 784, 1046];
    notes.forEach((f, idx) => {
      this.playTone(f, 'sine', 0.18, t + idx * 0.14);
    });
  }

  // SFX: Pokémon Fainted
  public playFaint() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.playTone(350, 'sawtooth', 0.35, t, 90);
  }

  // Background Music loops
  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBgm = null;
  }

  public playOverworldBgm() {
    if (this.currentBgm === 'overworld') return;
    this.stopBgm();
    this.currentBgm = 'overworld';
    this.initCtx();

    // Pallet Town / Route 1 inspired retro looping chiptune
    // Melody notes in C major / G major
    const melody = [
      392, 440, 523, 587, 659, 523, 392, 0,
      440, 523, 587, 659, 784, 659, 587, 0,
      659, 587, 523, 440, 392, 440, 523, 0,
      587, 659, 523, 440, 392, 0, 392, 0
    ];
    const bass = [
      261, 261, 329, 329, 392, 392, 329, 329,
      220, 220, 293, 293, 349, 349, 293, 293,
      261, 261, 329, 329, 392, 392, 329, 329,
      196, 196, 261, 261, 261, 261, 261, 0
    ];

    let step = 0;
    const beatMs = 240;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const mNote = melody[step % melody.length];
      const bNote = bass[step % bass.length];

      if (mNote > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(mNote, t);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.21);
      }

      if (bNote > 0) {
        const oscB = this.ctx.createOscillator();
        const gB = this.ctx.createGain();
        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(bNote * 0.5, t);
        gB.gain.setValueAtTime(0.18, t);
        gB.gain.linearRampToValueAtTime(0.01, t + 0.22);
        oscB.connect(gB);
        gB.connect(this.musicGain);
        oscB.start(t);
        oscB.stop(t + 0.23);
      }

      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  public playBattleBgm() {
    if (this.currentBgm === 'battle') return;
    this.stopBgm();
    this.currentBgm = 'battle';
    this.initCtx();

    // Fast, tense Pokémon battle bassline
    const bassline = [
      146, 146, 164, 146, 174, 146, 164, 146,
      130, 130, 146, 130, 164, 130, 146, 130,
      123, 123, 130, 123, 146, 123, 130, 123,
      146, 164, 174, 196, 220, 246, 261, 293
    ];
    const lead = [
      0, 587, 0, 587, 659, 587, 698, 784,
      0, 523, 0, 523, 587, 523, 659, 698,
      0, 493, 0, 493, 523, 493, 587, 659,
      587, 659, 698, 784, 880, 987, 1046, 1174
    ];

    let step = 0;
    const beatMs = 135; // fast tempo

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const bNote = bassline[step % bassline.length];
      const lNote = lead[step % lead.length];

      if (bNote > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bNote, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.12);
      }

      if (lNote > 0 && Math.random() > 0.2) {
        const oscL = this.ctx.createOscillator();
        const gL = this.ctx.createGain();
        oscL.type = 'square';
        oscL.frequency.setValueAtTime(lNote, t);
        gL.gain.setValueAtTime(0.14, t);
        gL.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        oscL.connect(gL);
        gL.connect(this.musicGain);
        oscL.start(t);
        oscL.stop(t + 0.11);
      }

      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }
}

export const soundManager = new SoundManager();
