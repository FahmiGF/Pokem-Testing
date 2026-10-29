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

  // SFX: BOOM / Explosion Effect
  public playBoom() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Deep pitch drop rumble
    this.playTone(140, 'sawtooth', 0.45, t, 20);
    this.playTone(90, 'square', 0.5, t, 15);

    // Heavy explosion noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.pow(1 - i / bufferSize, 1.8);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(600, t);
    lowpass.frequency.exponentialRampToValueAtTime(80, t + 0.38);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  // SFX: Classic Roblox "OOF" Sound
  public playRobloxOof() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Classic UHH/OOF sound synthesized: two resonant pitched chirps
    this.playTone(320, 'triangle', 0.12, t, 190);
    this.playTone(280, 'sine', 0.15, t + 0.02, 140);
  }

  // SFX: Cash Register Chime for Shop
  public playCashRegister() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // "Ka-ching!" high bells
    this.playTone(987.77, 'sine', 0.09, t);       // B5
    this.playTone(1318.51, 'sine', 0.22, t + 0.08); // E6
  }

  // SFX: Door / zone warp chime
  public playDoor() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    this.playTone(392.0, 'triangle', 0.09, t);        // G4
    this.playTone(587.33, 'triangle', 0.12, t + 0.07); // D5
    this.playTone(783.99, 'square', 0.10, t + 0.15);   // G5
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

  // --- ADAPTIVE ZONE THEME MUSIC SYSTEM ---
  public playZoneBgm(zoneId: string, zoneName?: string) {
    const zid = (zoneId || '').toLowerCase();
    const zn = (zoneName || '').toLowerCase();

    if (zid.includes('farm')) {
      this.playPastoralFarmBgm();
    } else if (zid.includes('ice') || zid.includes('frost') || zn.includes('snow') || zn.includes('frost')) {
      this.playWaterBgm();
    } else if (zid.includes('marsh') || zid.includes('swamp') || zn.includes('toxic') || zn.includes('marsh')) {
      this.playCavernBgm();
    } else if (zid.includes('water') || zn.includes('water') || zn.includes('cascade')) {
      this.playWaterBgm();
    } else if (zid.includes('fire') || zid.includes('volcano') || zn.includes('ember') || zn.includes('flame')) {
      this.playVolcanoBgm();
    } else if (zid.includes('rock') || zid.includes('earth') || zid.includes('cave') || zn.includes('canyon') || zn.includes('boulder')) {
      this.playCavernBgm();
    } else if (zid.includes('lavender') || zid.includes('tower') || zid.includes('shrine') || zn.includes('ghost')) {
      this.playLavenderMysticBgm();
    } else {
      // Peaceful Grassland (Pallet Town, Route 1, Verdant Grove, interiors)
      this.playPeacefulGrasslandBgm();
    }
  }

  // 1. Peaceful Grassland Theme (Calm, Sweet, Folk Chiptune)
  public playPeacefulGrasslandBgm() {
    if (this.currentBgm === 'peaceful_grassland') return;
    this.stopBgm();
    this.currentBgm = 'peaceful_grassland';
    this.initCtx();

    const melody = [
      523.25, 0, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25,
      440.00, 0, 523.25, 587.33, 659.25, 0, 587.33, 0,
      659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 523.25, 440.00,
      493.88, 523.25, 587.33, 659.25, 523.25, 0, 0, 0
    ];
    const bass = [
      261.63, 261.63, 329.63, 329.63, 392.00, 392.00, 329.63, 329.63,
      220.00, 220.00, 261.63, 261.63, 329.63, 329.63, 293.66, 293.66,
      261.63, 261.63, 329.63, 329.63, 392.00, 392.00, 329.63, 329.63,
      196.00, 196.00, 246.94, 246.94, 261.63, 261.63, 261.63, 0
    ];

    let step = 0;
    const beatMs = 230;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const mNote = melody[step % melody.length];
      const bNote = bass[step % bass.length];

      if (mNote > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle'; // Gentle flutey timbre
        osc.frequency.setValueAtTime(mNote, t);
        g.gain.setValueAtTime(0.13, t);
        g.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.23);
      }

      if (bNote > 0) {
        const oscB = this.ctx.createOscillator();
        const gB = this.ctx.createGain();
        oscB.type = 'sine';
        oscB.frequency.setValueAtTime(bNote * 0.5, t);
        gB.gain.setValueAtTime(0.16, t);
        gB.gain.linearRampToValueAtTime(0.01, t + 0.23);
        oscB.connect(gB);
        gB.connect(this.musicGain);
        oscB.start(t);
        oscB.stop(t + 0.24);
      }
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  // 2. Sunny Pastoral Farm Theme (Bouncy, Happy)
  public playPastoralFarmBgm() {
    if (this.currentBgm === 'farm') return;
    this.stopBgm();
    this.currentBgm = 'farm';
    this.initCtx();

    const melody = [
      659, 784, 880, 784, 659, 587, 523, 587,
      659, 659, 659, 0, 587, 587, 659, 587,
      523, 659, 784, 880, 987, 880, 784, 659,
      587, 659, 784, 659, 523, 0, 523, 0
    ];
    const bass = [
      261, 392, 261, 392, 261, 392, 261, 392,
      293, 440, 293, 440, 293, 440, 293, 440,
      261, 392, 261, 392, 261, 392, 261, 392,
      196, 293, 196, 293, 261, 0, 261, 0
    ];

    let step = 0;
    const beatMs = 195;

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
        g.gain.setValueAtTime(0.11, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.17);
      }
      if (bNote > 0) {
        const oscB = this.ctx.createOscillator();
        const gB = this.ctx.createGain();
        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(bNote * 0.5, t);
        gB.gain.setValueAtTime(0.14, t);
        gB.gain.linearRampToValueAtTime(0.01, t + 0.18);
        oscB.connect(gB);
        gB.connect(this.musicGain);
        oscB.start(t);
        oscB.stop(t + 0.19);
      }
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  // 3. Water / Coastal Breeze Theme
  public playWaterBgm() {
    if (this.currentBgm === 'water') return;
    this.stopBgm();
    this.currentBgm = 'water';
    this.initCtx();

    const melody = [
      440, 523, 659, 880, 784, 659, 523, 440,
      392, 493, 587, 784, 659, 587, 493, 392,
      349, 440, 523, 698, 659, 523, 440, 349,
      392, 493, 587, 784, 880, 0, 784, 0
    ];
    let step = 0;
    const beatMs = 240;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const mNote = melody[step % melody.length];

      if (mNote > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(mNote, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.23);
      }
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  // 4. Cavern / Mountain Stone Theme (Deep & Echoing)
  public playCavernBgm() {
    if (this.currentBgm === 'cavern') return;
    this.stopBgm();
    this.currentBgm = 'cavern';
    this.initCtx();

    const bass = [
      110, 0, 130.81, 0, 146.83, 0, 164.81, 0,
      98.00, 0, 123.47, 0, 146.83, 0, 130.81, 0,
      87.31, 0, 110.00, 0, 130.81, 0, 110.00, 0,
      98.00, 0, 110.00, 0, 123.47, 0, 110.00, 0
    ];
    let step = 0;
    const beatMs = 280;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const bNote = bass[step % bass.length];

      if (bNote > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bNote, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.26);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.27);
      }
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  // 5. Fire Volcano Theme (Intense Rhythmic Fire)
  public playVolcanoBgm() {
    if (this.currentBgm === 'volcano') return;
    this.stopBgm();
    this.currentBgm = 'volcano';
    this.initCtx();

    const lead = [
      220, 220, 330, 220, 440, 220, 330, 220,
      207, 207, 311, 207, 415, 207, 311, 207,
      196, 196, 293, 196, 392, 196, 293, 196,
      207, 220, 246, 261, 293, 330, 392, 440
    ];
    let step = 0;
    const beatMs = 150;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const note = lead[step % lead.length];

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, t);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.13);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.14);
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  // 6. Lavender Mystic / Eerie Ghost Theme
  public playLavenderMysticBgm() {
    if (this.currentBgm === 'mystic') return;
    this.stopBgm();
    this.currentBgm = 'mystic';
    this.initCtx();

    const notes = [
      493.88, 587.33, 554.37, 440.00,
      493.88, 440.00, 392.00, 369.99,
      392.00, 440.00, 493.88, 554.37,
      493.88, 440.00, 369.99, 329.63
    ];
    let step = 0;
    const beatMs = 300;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const note = notes[step % notes.length];

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, t);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.29);
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  // 7. Epic 3D Souls Boss Fight BGM (Gothic, Dark, Pounding Chords)
  public playSoulsBossBgm() {
    if (this.currentBgm === 'souls_boss') return;
    this.stopBgm();
    this.currentBgm = 'souls_boss';
    this.initCtx();

    const chords = [
      [110, 130.81, 164.81],
      [110, 130.81, 164.81],
      [103.83, 130.81, 155.56],
      [103.83, 130.81, 155.56],
      [98.00, 123.47, 146.83],
      [98.00, 123.47, 146.83],
      [92.50, 116.54, 138.59],
      [92.50, 116.54, 138.59]
    ];
    let step = 0;
    const beatMs = 210;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const chord = chords[step % chords.length];

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.19);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.2);
      });
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  // 8. High-Speed 3D Kart Racing BGM (Fast Eurobeat Synthesizer)
  public playKartRacingBgm() {
    if (this.currentBgm === 'kart_racing') return;
    this.stopBgm();
    this.currentBgm = 'kart_racing';
    this.initCtx();

    const bass = [146, 146, 220, 146, 293, 146, 220, 146];
    const synth = [587, 0, 739, 880, 0, 739, 880, 987];
    let step = 0;
    const beatMs = 125;

    const playStep = () => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const bNote = bass[step % bass.length];
      const sNote = synth[step % synth.length];

      const oscB = this.ctx.createOscillator();
      const gB = this.ctx.createGain();
      oscB.type = 'sawtooth';
      oscB.frequency.setValueAtTime(bNote, t);
      gB.gain.setValueAtTime(0.14, t);
      gB.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
      oscB.connect(gB);
      gB.connect(this.musicGain);
      oscB.start(t);
      oscB.stop(t + 0.12);

      if (sNote > 0) {
        const oscS = this.ctx.createOscillator();
        const gS = this.ctx.createGain();
        oscS.type = 'square';
        oscS.frequency.setValueAtTime(sNote, t);
        gS.gain.setValueAtTime(0.12, t);
        gS.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        oscS.connect(gS);
        gS.connect(this.musicGain);
        oscS.start(t);
        oscS.stop(t + 0.11);
      }
      step++;
    };

    this.bgmInterval = window.setInterval(playStep, beatMs);
    playStep();
  }

  public playOverworldBgm() {
    this.playPeacefulGrasslandBgm();
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

  // --- MINIGAME AUDIO: KART RACING ---
  public playKartBoost() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(300, 'sawtooth', 0.35, t, 900);
    this.playTone(450, 'square', 0.25, t + 0.05, 1200);
  }

  public playDrift() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
    g.gain.setValueAtTime(0.08, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.08);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playLapFanfare() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.12, t + idx * 0.07);
    });
  }

  // --- MINIGAME AUDIO: DARK SOULS BOSS FIGHT ---
  public playSwordSlash() {
    this.initCtx();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.15);
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playSwordHit() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(180, 'square', 0.15, t, 50);
    this.playTone(340, 'triangle', 0.1, t);
  }

  public playDodgeRoll() {
    this.initCtx();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    g.gain.setValueAtTime(0.18, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playParry() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Brilliant metallic chime
    this.playTone(1200, 'sine', 0.45, t);
    this.playTone(1800, 'triangle', 0.35, t);
    this.playTone(2400, 'sine', 0.25, t + 0.05);
  }

  public playEstus() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [300, 420, 560, 720].forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.18, t + idx * 0.09);
    });
  }

  public playBossRoar() {
    this.initCtx();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.6);
    g.gain.setValueAtTime(0.35, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.6);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  public playYouDied() {
    this.stopBgm();
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Ominous low bass church bell drone
    this.playTone(65.41, 'sawtooth', 2.5, t, 50); // C2
    this.playTone(77.78, 'sine', 2.0, t + 0.1);    // Eb2
    this.playTone(98.00, 'triangle', 1.8, t + 0.2); // G2
  }

  public playVictorySouls() {
    this.stopBgm();
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.35, t + idx * 0.12);
    });
  }

  public playExpShopBuy() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(600, 'sine', 0.08, t);
    this.playTone(850, 'triangle', 0.12, t + 0.08);
    this.playTone(1100, 'sine', 0.2, t + 0.16);
  }

  // --- EXPANDED WORLD SFX PACK ---
  // Coin pickup: bright two-note sparkle.
  public playCoin() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(988, 'square', 0.06, t);
    this.playTone(1319, 'square', 0.12, t + 0.06);
  }

  // Gem pickup: shimmering arpeggio.
  public playGem() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [1047, 1319, 1568, 2093].forEach((f, i) => this.playTone(f, 'sine', 0.12, t + i * 0.055));
  }

  // Teleport / warp shimmer.
  public playTeleport() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(180, 'sine', 0.35, t, 1400);
    this.playTone(900, 'triangle', 0.3, t + 0.1, 240);
  }

  public playPortalHum() {
    this.initCtx();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.5);
    g.gain.setValueAtTime(0.12, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.5);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // World Boss announcement: alarm + ominous bass.
  public playWorldBossWarning() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(880, 'square', 0.14, t);
    this.playTone(660, 'square', 0.14, t + 0.18);
    this.playTone(880, 'square', 0.14, t + 0.36);
    this.playTone(440, 'sawtooth', 0.6, t + 0.55, 220);
    this.playTone(55, 'sawtooth', 0.9, t + 0.55, 40);
  }

  public playMountSummon() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(300, 'triangle', 0.18, t, 700);
    this.playTone(700, 'sine', 0.22, t + 0.14, 500);
  }

  public playMountRoar() {
    this.initCtx();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.45);
    g.gain.setValueAtTime(0.16, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.45);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playShopOpen() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [392, 523, 659].forEach((f, i) => this.playTone(f, 'triangle', 0.1, t + i * 0.07));
  }

  public playPokedexOpen() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [659, 880, 1175].forEach((f, i) => this.playTone(f, 'square', 0.08, t + i * 0.05));
  }

  public playQuestComplete() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.playTone(f, 'square', 0.14, t + i * 0.1));
  }

  public playZoneUnlock() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [262, 330, 392, 523, 659, 784].forEach((f, i) => this.playTone(f, 'triangle', 0.2, t + i * 0.09));
  }

  // Combo hit & burst feedback for the new attack chain system.
  public playComboHit(step: number) {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const base = 320 + Math.min(6, step) * 90;
    this.playTone(base, 'square', 0.06, t);
    this.playTone(base * 1.5, 'triangle', 0.05, t + 0.05);
  }

  public playComboBurst() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(150, 'sawtooth', 0.3, t, 900);
    [784, 988, 1175, 1568].forEach((f, i) => this.playTone(f, 'square', 0.12, t + 0.05 + i * 0.05));
  }

  public playSplash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.15);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.15);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.15);
  }

  public playCaveDrip() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(1400 + Math.random() * 500, 'sine', 0.1, t, 500);
  }

  public playBossDefeat() {
    this.stopBgm();
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(110, 'sawtooth', 1.2, t, 40);
    [523, 659, 784, 1047].forEach((f, i) => this.playTone(f, 'square', 0.25, t + 0.4 + i * 0.12));
  }

  public playCoinMagnet() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    this.playTone(700, 'sine', 0.1, t, 1600);
  }
}

export const soundManager = new SoundManager();
