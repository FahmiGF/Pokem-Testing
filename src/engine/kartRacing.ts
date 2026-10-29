// 3D Mode-7 Style Retro Kart Racing Minigame

import { soundManager } from '../audio/sound';
import type { PlayerData } from '../types';
import type { InputHandler } from './input';

export interface Racer {
  id: string;
  name: string;
  color: string;
  kartColor: string;
  x: number; // -1 to 1 across track
  trackPos: number; // distance along track
  speed: number;
  maxSpeed: number;
  accel: number;
  lap: number;
  finished: boolean;
  finishTime?: number;
  isPlayer?: boolean;
}

export class KartRacingGame {
  public player: PlayerData;
  public onClose?: (rewardExp: number, rewardMoney: number) => void;

  // Track settings
  public readonly trackLength = 12000;
  public readonly totalLaps = 3;
  public cameraZ: number = 0;

  // Racers
  public racers: Racer[] = [];
  public playerRacer!: Racer;

  // Player input / state
  public isDrifting: boolean = false;
  public driftDirection: number = 0; // -1 left, 1 right
  public driftCharge: number = 0;
  public turboTimer: number = 0;
  public offroadPenalty: number = 1;

  // Race progress & timing
  public raceState: 'COUNTDOWN' | 'RACING' | 'FINISHED' = 'COUNTDOWN';
  public countdownTimer: number = 3.5;
  public raceTimer: number = 0;
  public resultRank: number = 1;
  public rewardExp: number = 0;
  public rewardMoney: number = 0;

  // Track Curve Definition (segments)
  private trackCurves: { start: number; length: number; curve: number }[] = [
    { start: 1000, length: 1500, curve: 2.2 },
    { start: 3200, length: 1200, curve: -2.8 },
    { start: 5000, length: 1800, curve: 3.5 },
    { start: 7500, length: 1400, curve: -3.0 },
    { start: 9500, length: 1600, curve: 1.5 },
  ];

  // Boost pad locations
  private boostPads = [2200, 4800, 7200, 11000];

  constructor(player: PlayerData) {
    this.player = player;

    const engineBonus = (player.kartStats?.speedUpgrades || 0) * 8;
    const basePlayerSpeed = 165 + engineBonus;

    // Initialize 4 Racers
    this.playerRacer = {
      id: 'player',
      name: 'RED (YOU)',
      color: '#dd2222',
      kartColor: '#e53935',
      x: -0.3,
      trackPos: 0,
      speed: 0,
      maxSpeed: basePlayerSpeed,
      accel: 85,
      lap: 1,
      finished: false,
      isPlayer: true,
    };

    const pikachuRacer: Racer = {
      id: 'pikachu',
      name: 'PIKACHU',
      color: '#fdd835',
      kartColor: '#ffeb3b',
      x: 0.3,
      trackPos: 20,
      speed: 0,
      maxSpeed: 160,
      accel: 90,
      lap: 1,
      finished: false,
    };

    const charizardRacer: Racer = {
      id: 'charizard',
      name: 'CHARIZARD',
      color: '#fb8c00',
      kartColor: '#f4511e',
      x: -0.6,
      trackPos: 40,
      speed: 0,
      maxSpeed: 172,
      accel: 70,
      lap: 1,
      finished: false,
    };

    const gengarRacer: Racer = {
      id: 'gengar',
      name: 'GENGAR',
      color: '#8e24aa',
      kartColor: '#5e35b1',
      x: 0.6,
      trackPos: 10,
      speed: 0,
      maxSpeed: 164,
      accel: 82,
      lap: 1,
      finished: false,
    };

    this.racers = [this.playerRacer, pikachuRacer, charizardRacer, gengarRacer];
    soundManager.playKartRacingBgm();
  }

  private getCurveAt(trackPos: number): number {
    const pos = ((trackPos % this.trackLength) + this.trackLength) % this.trackLength;
    for (const c of this.trackCurves) {
      if (pos >= c.start && pos <= c.start + c.length) {
        const progress = (pos - c.start) / c.length;
        return Math.sin(progress * Math.PI) * c.curve;
      }
    }
    return 0;
  }

  public update(input: InputHandler, deltaMs: number) {
    const dt = deltaMs / 1000;

    if (this.raceState === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.raceState = 'RACING';
        soundManager.playKartBoost();
      }
      return;
    }

    if (this.raceState === 'FINISHED') {
      if (input.isJustPressed('a') || input.isJustPressed('b') || input.isJustPressed('start')) {
        soundManager.playConfirm();
        if (this.onClose) {
          this.onClose(this.rewardExp, this.rewardMoney);
        }
      }
      return;
    }

    this.raceTimer += dt;

    // --- PLAYER CONTROLS & PHYSICS ---
    const p = this.playerRacer;
    const isGas = input.isDown('a') || input.isDown('up');
    const isBrake = input.isDown('b') || input.isDown('down');
    const isSteerLeft = input.isDown('left');
    const isSteerRight = input.isDown('right');

    // Turbo boost timer
    if (this.turboTimer > 0) {
      this.turboTimer -= dt;
      p.speed = Math.min(240, p.speed + 140 * dt);
    } else {
      // Normal Acceleration
      const curMax = Math.abs(p.x) > 1.0 ? p.maxSpeed * 0.45 : p.maxSpeed;
      if (isGas) {
        p.speed = Math.min(curMax, p.speed + p.accel * dt);
      } else if (isBrake) {
        p.speed = Math.max(-30, p.speed - 120 * dt);
      } else {
        // Coasting friction
        p.speed = Math.max(0, p.speed - 40 * dt);
      }
    }

    // Steering & Drifting
    const steerSpeed = (p.speed / p.maxSpeed) * 1.8 * dt;
    if (isSteerLeft) {
      p.x -= steerSpeed;
      if (p.speed > 80 && (input.isDown('down') || input.isDown('b'))) {
        this.isDrifting = true;
        this.driftDirection = -1;
        this.driftCharge += dt;
        soundManager.playDrift();
      }
    } else if (isSteerRight) {
      p.x += steerSpeed;
      if (p.speed > 80 && (input.isDown('down') || input.isDown('b'))) {
        this.isDrifting = true;
        this.driftDirection = 1;
        this.driftCharge += dt;
        soundManager.playDrift();
      }
    } else {
      if (this.isDrifting) {
        // Release drift turbo!
        if (this.driftCharge > 1.2) {
          this.turboTimer = 1.8;
          soundManager.playKartBoost();
        }
        this.isDrifting = false;
        this.driftCharge = 0;
      }
    }

    // Centrifugal curve push
    const currentCurve = this.getCurveAt(p.trackPos);
    p.x -= (currentCurve * (p.speed / p.maxSpeed) * 0.95 * dt);

    // Clamp track bounds
    p.x = Math.max(-1.8, Math.min(1.8, p.x));

    // Boost pad detection
    const normalizedPos = p.trackPos % this.trackLength;
    for (const b of this.boostPads) {
      if (Math.abs(normalizedPos - b) < 60 && Math.abs(p.x) < 0.6) {
        if (this.turboTimer <= 0.2) {
          this.turboTimer = 2.2;
          soundManager.playKartBoost();
        }
      }
    }

    // Advance Racers
    this.racers.forEach((r) => {
      if (r.finished) return;

      if (!r.isPlayer) {
        // AI Racers logic
        const targetSpeed = r.maxSpeed * (0.92 + Math.sin(this.raceTimer + r.trackPos * 0.001) * 0.08);
        r.speed += (targetSpeed - r.speed) * 1.5 * dt;

        // Follow racing line curve
        const curve = this.getCurveAt(r.trackPos);
        const desiredX = -curve * 0.3 + (r.id === 'pikachu' ? 0.2 : r.id === 'charizard' ? -0.2 : 0);
        r.x += (desiredX - r.x) * 1.2 * dt;
      }

      // Move forward along track
      const prevPos = r.trackPos;
      r.trackPos += r.speed * dt * 8;

      // Lap check
      if (Math.floor(r.trackPos / this.trackLength) > Math.floor(prevPos / this.trackLength)) {
        r.lap++;
        if (r.isPlayer) {
          soundManager.playLapFanfare();
        }
        if (r.lap > this.totalLaps) {
          r.finished = true;
          r.finishTime = this.raceTimer;

          if (r.isPlayer) {
            this.finishRace();
          }
        }
      }
    });

    // Update Rankings
    this.updateRankings();
  }

  private updateRankings() {
    const sorted = [...this.racers].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      return b.trackPos - a.trackPos;
    });

    const rank = sorted.findIndex((r) => r.isPlayer) + 1;
    this.resultRank = rank;
  }

  private finishRace() {
    this.raceState = 'FINISHED';
    soundManager.playVictorySouls();

    if (this.resultRank === 1) {
      this.rewardExp = 800;
      this.rewardMoney = 1500;
      if (this.player.kartStats) this.player.kartStats.wins = (this.player.kartStats.wins || 0) + 1;
    } else if (this.resultRank === 2) {
      this.rewardExp = 500;
      this.rewardMoney = 800;
    } else if (this.resultRank === 3) {
      this.rewardExp = 300;
      this.rewardMoney = 400;
    } else {
      this.rewardExp = 150;
      this.rewardMoney = 200;
    }

    this.player.expTokens = (this.player.expTokens || 0) + this.rewardExp;
    this.player.money += this.rewardMoney;
  }

  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const horizonY = Math.floor(ch * 0.44);

    // Sky & Horizon Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#0a1024');
    skyGrad.addColorStop(0.7, '#1b2d52');
    skyGrad.addColorStop(1, '#ff6e40');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, horizonY);

    // Distant Mountain Silhouette
    ctx.fillStyle = '#141829';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= cw; x += 30) {
      const my = horizonY - 14 - Math.sin(x * 0.05 + this.playerRacer.trackPos * 0.0002) * 10;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(cw, horizonY);
    ctx.closePath();
    ctx.fill();

    // Mode-7 Scanline Road Rendering
    const p = this.playerRacer;
    const curve = this.getCurveAt(p.trackPos);

    for (let y = horizonY; y < ch; y++) {
      const depth = (y - horizonY) / (ch - horizonY); // 0 at horizon, 1 at bottom
      const roadW = (cw * 0.75) * depth;
      const roadCenter = cw / 2 - (p.x * roadW * 0.5) + (curve * Math.pow(1 - depth, 2) * 80);

      // Alternating strip grass & road color
      const segment = Math.floor((p.trackPos * 0.15 + (1 / (depth + 0.001)) * 12) % 2);
      const isAlt = segment === 1;

      // Grass
      ctx.fillStyle = isAlt ? '#2d682a' : '#255823';
      ctx.fillRect(0, y, cw, 1);

      // Road
      const roadLeft = roadCenter - roadW / 2;
      ctx.fillStyle = isAlt ? '#3a3a42' : '#32323a';
      ctx.fillRect(roadLeft, y, roadW, 1);

      // Kerb / Rumble Strips
      const kerbW = roadW * 0.08;
      ctx.fillStyle = isAlt ? '#d32f2f' : '#ffffff';
      ctx.fillRect(roadLeft - kerbW, y, kerbW, 1);
      ctx.fillRect(roadLeft + roadW, y, kerbW, 1);

      // Center Dash Line
      if (isAlt && depth > 0.1) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(roadCenter - 1, y, 2, 1);
      }
    }

    // Boost Pads Visual (if close enough in front of player)
    const normTrack = p.trackPos % this.trackLength;
    this.boostPads.forEach((bp) => {
      const dist = bp - normTrack;
      if (dist > 50 && dist < 1200) {
        const depth = 1 - (dist / 1200);
        const y = horizonY + (ch - horizonY) * Math.pow(depth, 1.8);
        const roadW = (cw * 0.75) * Math.pow(depth, 1.8);
        const roadCenter = cw / 2 - (p.x * roadW * 0.5);
        const padW = roadW * 0.35;

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(roadCenter - padW / 2, y);
        ctx.lineTo(roadCenter, y - 6 * depth);
        ctx.lineTo(roadCenter + padW / 2, y);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw Other Racers (Sorted by distance from player)
    const opponents = this.racers.filter((r) => !r.isPlayer);
    opponents.forEach((op) => {
      const relDist = op.trackPos - p.trackPos;
      if (relDist > -200 && relDist < 2500) {
        const depth = Math.max(0.05, 1 - (relDist / 2500));
        const y = horizonY + (ch - horizonY) * Math.pow(depth, 1.6);
        const roadW = (cw * 0.75) * Math.pow(depth, 1.6);
        const roadCenter = cw / 2 - (p.x * roadW * 0.5);
        const racerX = roadCenter + (op.x * roadW * 0.5);

        const kartW = Math.max(12, 40 * depth);
        const kartH = Math.max(8, 26 * depth);

        this.drawKartSprite(ctx, racerX, y, kartW, kartH, op.kartColor, op.name, false);
      }
    });

    // Draw Player Kart in Foreground
    const playerKartY = ch - 42;
    const playerKartX = cw / 2;
    const playerKartW = 46;
    const playerKartH = 30;

    // Turbo flames
    if (this.turboTimer > 0) {
      ctx.fillStyle = '#ff3d00';
      ctx.beginPath();
      ctx.arc(playerKartX - 12, playerKartY + 22, 7 + Math.random() * 4, 0, Math.PI * 2);
      ctx.arc(playerKartX + 12, playerKartY + 22, 7 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(playerKartX - 12, playerKartY + 22, 4, 0, Math.PI * 2);
      ctx.arc(playerKartX + 12, playerKartY + 22, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drift Sparks
    if (this.isDrifting) {
      const sparkCol = this.driftCharge > 1.2 ? '#ff9100' : '#00e5ff';
      ctx.fillStyle = sparkCol;
      for (let s = 0; s < 4; s++) {
        ctx.fillRect(
          playerKartX + (this.driftDirection > 0 ? 18 : -22) + (Math.random() * 8 - 4),
          playerKartY + 16 + (Math.random() * 6 - 3),
          3,
          3
        );
      }
    }

    this.drawKartSprite(ctx, playerKartX, playerKartY, playerKartW, playerKartH, p.kartColor, 'YOU', true);

    // --- HUD OVERLAY ---
    this.drawHUD(ctx, cw, ch);
  }

  private drawKartSprite(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    color: string,
    label: string,
    isSelf: boolean
  ) {
    ctx.save();
    ctx.translate(cx, cy);

    // Kart Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.45, w * 0.55, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tires
    ctx.fillStyle = '#1a1a1a';
    const tireW = w * 0.22;
    const tireH = h * 0.45;
    ctx.fillRect(-w * 0.55, -tireH * 0.1, tireW, tireH);
    ctx.fillRect(w * 0.55 - tireW, -tireH * 0.1, tireW, tireH);

    // Chassis / Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-w * 0.45, -h * 0.4, w * 0.9, h * 0.75, 4);
    ctx.fill();

    // Rear Spoiler
    ctx.fillStyle = '#222';
    ctx.fillRect(-w * 0.4, -h * 0.5, w * 0.8, h * 0.16);

    // Driver Helmet
    ctx.fillStyle = isSelf ? '#ffffff' : color;
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, w * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(-w * 0.12, -h * 0.22, w * 0.24, h * 0.1);

    ctx.restore();

    // Label tag
    if (!isSelf && w > 18) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(cx - 24, cy - h * 0.75, 48, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy - h * 0.75 + 8);
    }
  }

  private drawHUD(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    // 1. Position Rank Badge (Top Left)
    ctx.fillStyle = '#141e30';
    ctx.fillRect(8, 8, 64, 30);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, 64, 30);

    const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#999999'];
    ctx.fillStyle = rankColors[this.resultRank - 1] || '#fff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    const suffixes = ['ST', 'ND', 'RD', 'TH'];
    ctx.fillText(`${this.resultRank}${suffixes[this.resultRank - 1]}`, 40, 29);

    // 2. Lap Tracker (Top Center)
    ctx.fillStyle = '#141e30';
    ctx.fillRect(cw / 2 - 45, 8, 90, 24);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cw / 2 - 45, 8, 90, 24);

    ctx.fillStyle = this.playerRacer.lap === 3 ? '#ff3d00' : '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    const lapText = this.playerRacer.lap > 3 ? 'FINISHED' : `LAP ${this.playerRacer.lap}/${this.totalLaps}`;
    ctx.fillText(lapText, cw / 2, 24);

    // 3. Speedometer & Timer (Top Right)
    ctx.fillStyle = '#141e30';
    ctx.fillRect(cw - 76, 8, 68, 30);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cw - 76, 8, 68, 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${Math.floor(this.playerRacer.speed)} KM/H`, cw - 12, 23);

    ctx.fillStyle = '#aaa';
    ctx.font = '7px monospace';
    const mins = Math.floor(this.raceTimer / 60);
    const secs = (this.raceTimer % 60).toFixed(1).padStart(4, '0');
    ctx.fillText(`TIME ${mins}:${secs}`, cw - 12, 33);

    // 4. Mini-Map (Bottom Right)
    const mapX = cw - 62;
    const mapY = ch - 62;
    const mapW = 54;
    const mapH = 54;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.75)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Circuit track oval
    ctx.strokeStyle = '#607d8b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(mapX + mapW / 2, mapY + mapH / 2, 20, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Racer dots on minimap
    this.racers.forEach((r) => {
      const prog = (r.trackPos % this.trackLength) / this.trackLength;
      const angle = prog * Math.PI * 2 - Math.PI / 2;
      const dotX = mapX + mapW / 2 + Math.cos(angle) * 20;
      const dotY = mapY + mapH / 2 + Math.sin(angle) * 18;

      ctx.fillStyle = r.isPlayer ? '#00e5ff' : r.kartColor;
      ctx.beginPath();
      ctx.arc(dotX, dotY, r.isPlayer ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Countdown Banner
    if (this.raceState === 'COUNTDOWN') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, ch / 2 - 28, cw, 56);

      const countNum = Math.ceil(this.countdownTimer);
      const text = countNum > 0 ? `${countNum}` : 'GO!';
      ctx.fillStyle = countNum > 0 ? '#ffeb3b' : '#00e676';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, cw / 2, ch / 2 + 12);
    }

    // 6. Finished Screen
    if (this.raceState === 'FINISHED') {
      ctx.fillStyle = 'rgba(5, 10, 20, 0.88)';
      ctx.fillRect(20, 35, cw - 40, ch - 70);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 35, cw - 40, ch - 70);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('🏁 RACE FINISHED! 🏁', cw / 2, 60);

      ctx.fillStyle = rankColors[this.resultRank - 1] || '#fff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${this.resultRank}${suffixes[this.resultRank - 1]} PLACE`, cw / 2, 92);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '10px monospace';
      ctx.fillText(`+${this.rewardExp} EXP TOKENS`, cw / 2, 120);
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`+$${this.rewardMoney} PRIZE MONEY`, cw / 2, 138);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('▶ PRESS [A] TO RETURN ◀', cw / 2, 175);
    }
  }
}
