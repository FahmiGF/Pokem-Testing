// 3D Dark Souls-Style Real-Time Action Boss Arena

import { soundManager } from '../audio/sound';
import type { PlayerData } from '../types';
import type { InputHandler } from './input';

export interface Vector3 {
  x: number;
  y: number; // height (up is negative in 2D canvas, but positive up in 3D)
  z: number;
}

export interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface BossAttackTelegraph {
  type: 'ARC' | 'CIRCLE' | 'BEAM';
  x: number;
  z: number;
  radius: number;
  angle?: number;
  timer: number;
  duration: number;
  onExecute: () => void;
}

export class SoulsBossGame {
  public player: PlayerData;
  public onClose?: (rewardExp: number, rewardMoney: number) => void;

  // Arena geometry (radius 480)
  public readonly arenaRadius = 450;

  // Player 3D State
  public px: number = 0;
  public py: number = 0;
  public pz: number = 240;
  public playerAngle: number = -Math.PI / 2; // facing north/boss
  public playerHp: number = 100;
  public playerMaxHp: number = 100;
  public stamina: number = 100;
  public maxStamina: number = 100;
  public isStaminaExhausted: boolean = false;

  // Combat Moves & Animation
  public isRolling: boolean = false;
  public rollTimer: number = 0;
  public rollDuration: number = 0.45;
  public iFrameWindow: number = 0.38;
  public rollVx: number = 0;
  public rollVz: number = 0;

  public isAttacking: boolean = false;
  public attackCombo: number = 0;
  public attackTimer: number = 0;
  public attackType: 'LIGHT' | 'HEAVY' | 'RIPOSTE' = 'LIGHT';

  public isDrinkingEstus: boolean = false;
  public estusTimer: number = 0;
  public estusCharges: number = 4;

  public isBlocking: boolean = false;
  public parryTimer: number = 0;

  // Boss 3D State: GIRATINA
  public bx: number = 0;
  public by: number = 0;
  public bz: number = -120;
  public bossHp: number = 2800;
  public bossMaxHp: number = 2800;
  public bossGhostHp: number = 2800;
  public bossPhase: 1 | 2 = 1;
  public bossState: 'IDLE' | 'WINDUP' | 'ATTACKING' | 'RECOVERY' | 'STAGGERED' = 'IDLE';
  public bossStateTimer: number = 0;
  public isBossStaggered: boolean = false;
  public staggerTimer: number = 0;

  // Telegraphs & Projectiles
  public telegraphs: BossAttackTelegraph[] = [];
  public projectiles: { x: number; y: number; z: number; vx: number; vz: number; radius: number; life: number }[] = [];
  public particles: Particle3D[] = [];
  public screenShake: number = 0;

  // Game Progress
  public gameState: 'BATTLE' | 'YOU_DIED' | 'VICTORY' = 'BATTLE';
  public victoryTimer: number = 0;
  public deathTimer: number = 0;
  public rewardExp: number = 0;
  public rewardMoney: number = 0;

  // Camera Settings
  public camX: number = 0;
  public camY: number = -110;
  public camZ: number = 420;
  public fov: number = 280;

  constructor(player: PlayerData) {
    this.player = player;

    // Apply upgrades from EXP Shop
    const estusBonus = player.soulsStats?.estusCharges || 4;
    this.estusCharges = estusBonus;

    const rollBonus = (player.soulsStats?.rollUpgrade || 0) * 0.05;
    this.iFrameWindow = 0.38 + rollBonus;

    soundManager.playBossRoar();
    soundManager.playSoulsBossBgm();
  }

  public update(input: InputHandler, deltaMs: number) {
    const dt = deltaMs / 1000;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Floating Ember Particles in the air
    if (Math.random() < 0.4) {
      this.particles.push({
        x: (Math.random() - 0.5) * 800,
        y: -Math.random() * 200,
        z: (Math.random() - 0.5) * 800,
        vx: (Math.random() - 0.5) * 20,
        vy: -25 - Math.random() * 20,
        vz: (Math.random() - 0.5) * 20,
        color: this.bossPhase === 2 ? '#ff5722' : '#9c27b0',
        size: 2 + Math.random() * 2.5,
        life: 0,
        maxLife: 3 + Math.random() * 2,
      });
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Delayed Ghost HP catch-up (Dark Souls mechanic)
    if (this.bossGhostHp > this.bossHp) {
      this.bossGhostHp -= (this.bossGhostHp - this.bossHp) * 3.5 * dt;
      if (this.bossGhostHp - this.bossHp < 1) this.bossGhostHp = this.bossHp;
    }

    if (this.gameState === 'YOU_DIED') {
      this.deathTimer += dt;
      if (this.deathTimer > 1.8 && (input.isJustPressed('a') || input.isJustPressed('b'))) {
        soundManager.playConfirm();
        if (this.onClose) this.onClose(0, 0);
      }
      return;
    }

    if (this.gameState === 'VICTORY') {
      this.victoryTimer += dt;
      if (this.victoryTimer > 2.0 && (input.isJustPressed('a') || input.isJustPressed('b'))) {
        soundManager.playConfirm();
        if (this.onClose) this.onClose(this.rewardExp, this.rewardMoney);
      }
      return;
    }

    // --- PLAYER ACTION UPDATES ---
    this.updatePlayer(input, dt);

    // --- BOSS AI & COMBAT LOGIC ---
    this.updateBoss(dt);

    // --- PROJECTILES & TELEGRAPHS ---
    this.updateProjectilesAndTelegraphs(dt);

    // Check Victory / Defeat
    if (this.playerHp <= 0 && this.gameState === 'BATTLE') {
      this.gameState = 'YOU_DIED';
      this.deathTimer = 0;
      soundManager.playYouDied();
    } else if (this.bossHp <= 0 && this.gameState === 'BATTLE') {
      this.gameState = 'VICTORY';
      this.victoryTimer = 0;
      this.rewardExp = 2500;
      this.rewardMoney = 5000;
      this.player.expTokens = (this.player.expTokens || 0) + this.rewardExp;
      this.player.money += this.rewardMoney;
      if (!this.player.soulsStats) {
        this.player.soulsStats = { estusCharges: 4, estusLevel: 1, bossVictories: 1, swordUpgrade: 0, rollUpgrade: 0 };
      } else {
        this.player.soulsStats.bossVictories = (this.player.soulsStats.bossVictories || 0) + 1;
      }
      soundManager.playVictorySouls();
    }

    // Smooth Camera Follow
    const targetCamX = this.px * 0.4;
    const targetCamZ = this.pz + 180;
    this.camX += (targetCamX - this.camX) * 4 * dt;
    this.camZ += (targetCamZ - this.camZ) * 4 * dt;
  }

  private updatePlayer(input: InputHandler, dt: number) {
    // Stamina Regeneration
    if (!this.isRolling && !this.isAttacking && !this.isBlocking) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 34 * dt);
      if (this.stamina >= 25) this.isStaminaExhausted = false;
    }

    // Estus Drinking lock
    if (this.isDrinkingEstus) {
      this.estusTimer -= dt;
      if (this.estusTimer <= 0) {
        this.isDrinkingEstus = false;
      }
      return;
    }

    // Dodge Roll Movement
    if (this.isRolling) {
      this.rollTimer += dt;
      this.px += this.rollVx * dt;
      this.pz += this.rollVz * dt;

      // Arena boundary clamp
      const dist = Math.hypot(this.px, this.pz);
      if (dist > this.arenaRadius) {
        this.px = (this.px / dist) * this.arenaRadius;
        this.pz = (this.pz / dist) * this.arenaRadius;
      }

      if (this.rollTimer >= this.rollDuration) {
        this.isRolling = false;
      }
      return;
    }

    // Attack Animation
    if (this.isAttacking) {
      this.attackTimer += dt;
      if (this.attackTimer >= 0.35) {
        this.isAttacking = false;
      }
    }

    // Movement Direction
    let dx = 0;
    let dz = 0;
    if (input.isDown('left')) dx -= 1;
    if (input.isDown('right')) dx += 1;
    if (input.isDown('up')) dz -= 1;
    if (input.isDown('down')) dz += 1;

    const moveLen = Math.hypot(dx, dz);
    if (moveLen > 0) {
      dx /= moveLen;
      dz /= moveLen;
      const speed = 145;
      this.px += dx * speed * dt;
      this.pz += dz * speed * dt;
      this.playerAngle = Math.atan2(this.bz - this.pz, this.bx - this.px);
    } else {
      // Face towards boss
      this.playerAngle = Math.atan2(this.bz - this.pz, this.bx - this.px);
    }

    // Arena boundary clamp
    const dist = Math.hypot(this.px, this.pz);
    if (dist > this.arenaRadius) {
      this.px = (this.px / dist) * this.arenaRadius;
      this.pz = (this.pz / dist) * this.arenaRadius;
    }

    // --- ACTIONS ---

    // 1. Dodge Roll (Space / Down+B / B button)
    if (input.isJustPressed('b') && !this.isRolling && this.stamina >= 20) {
      this.stamina -= 22;
      this.isRolling = true;
      this.rollTimer = 0;
      soundManager.playDodgeRoll();

      const rollDirX = moveLen > 0 ? dx : Math.cos(this.playerAngle);
      const rollDirZ = moveLen > 0 ? dz : Math.sin(this.playerAngle);
      this.rollVx = rollDirX * 320;
      this.rollVz = rollDirZ * 320;
      return;
    }

    // 2. Light Attack (Z / A button)
    if (input.isJustPressed('a') && !this.isAttacking && this.stamina >= 16) {
      this.stamina -= 18;
      this.isAttacking = true;
      this.attackTimer = 0;
      this.attackCombo = (this.attackCombo + 1) % 3;
      this.attackType = 'LIGHT';
      soundManager.playSwordSlash();

      // Check hit on boss
      const distToBoss = Math.hypot(this.bx - this.px, this.bz - this.pz);
      if (distToBoss < 95) {
        const swordDmgBonus = 1 + (this.player.soulsStats?.swordUpgrade || 0) * 0.35;
        const dmg = Math.floor((45 + this.attackCombo * 15) * swordDmgBonus);
        this.bossHp = Math.max(0, this.bossHp - dmg);
        this.screenShake = 4;
        soundManager.playSwordHit();
        this.spawnBloodSparks(this.bx, this.by - 30, this.bz, '#e53935');

        // Check stagger riposte opportunity
        if (this.isBossStaggered) {
          const critDmg = Math.floor(350 * swordDmgBonus);
          this.bossHp = Math.max(0, this.bossHp - critDmg);
          this.isBossStaggered = false;
          soundManager.playParry();
          this.screenShake = 12;
        }
      }
    }

    // 3. Estus Flask (Start / Down key / Q)
    if (input.isJustPressed('start') && !this.isDrinkingEstus && this.estusCharges > 0) {
      if (this.playerHp < this.playerMaxHp) {
        this.estusCharges--;
        this.isDrinkingEstus = true;
        this.estusTimer = 1.1;
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 65);
        soundManager.playEstus();
        this.spawnBloodSparks(this.px, this.py - 20, this.pz, '#ffd700');
      }
    }
  }

  private updateBoss(dt: number) {
    // Check Phase Transition at 50% HP
    if (this.bossPhase === 1 && this.bossHp <= this.bossMaxHp * 0.5) {
      this.bossPhase = 2;
      this.screenShake = 14;
      soundManager.playBossRoar();
      this.spawnBloodSparks(this.bx, this.by - 40, this.bz, '#ff3d00');
    }

    if (this.isBossStaggered) {
      this.staggerTimer -= dt;
      if (this.staggerTimer <= 0) {
        this.isBossStaggered = false;
        this.bossState = 'IDLE';
      }
      return;
    }

    this.bossStateTimer -= dt;

    if (this.bossState === 'IDLE') {
      // Turn and glide toward player
      const dx = this.px - this.bx;
      const dz = this.pz - this.bz;
      const dist = Math.hypot(dx, dz);

      if (dist > 75) {
        const speed = this.bossPhase === 2 ? 100 : 70;
        this.bx += (dx / dist) * speed * dt;
        this.bz += (dz / dist) * speed * dt;
      }

      if (this.bossStateTimer <= 0) {
        // Choose next attack
        const attackRoll = Math.random();
        if (attackRoll < 0.45) {
          this.startAbyssalSweep();
        } else if (attackRoll < 0.8) {
          this.startVoidSlam();
        } else {
          this.startDarkOrbs();
        }
      }
    } else if (this.bossState === 'WINDUP') {
      if (this.bossStateTimer <= 0) {
        this.bossState = 'RECOVERY';
        this.bossStateTimer = this.bossPhase === 2 ? 0.7 : 1.1;
      }
    } else if (this.bossState === 'RECOVERY') {
      if (this.bossStateTimer <= 0) {
        this.bossState = 'IDLE';
        this.bossStateTimer = this.bossPhase === 2 ? 0.8 : 1.4;
      }
    }
  }

  private startAbyssalSweep() {
    this.bossState = 'WINDUP';
    this.bossStateTimer = 0.95;

    // Telegraph: Red sweeping arc in front of boss
    const angle = Math.atan2(this.pz - this.bz, this.px - this.bx);
    this.telegraphs.push({
      type: 'ARC',
      x: this.bx,
      z: this.bz,
      radius: 130,
      angle,
      timer: 0,
      duration: 0.95,
      onExecute: () => {
        soundManager.playSwordSlash();
        this.screenShake = 6;
        // Hit detection on player
        const dist = Math.hypot(this.px - this.bx, this.pz - this.bz);
        const playerAngle = Math.atan2(this.pz - this.bz, this.px - this.bx);
        const angleDiff = Math.abs(playerAngle - angle);
        if (dist <= 135 && angleDiff < 1.2) {
          this.damagePlayer(this.bossPhase === 2 ? 45 : 32);
        }
      },
    });
  }

  private startVoidSlam() {
    this.bossState = 'WINDUP';
    this.bossStateTimer = 1.2;

    // Telegraph: Circle target at player's current position
    const targetX = this.px;
    const targetZ = this.pz;

    this.telegraphs.push({
      type: 'CIRCLE',
      x: targetX,
      z: targetZ,
      radius: 80,
      timer: 0,
      duration: 1.2,
      onExecute: () => {
        soundManager.playHit();
        this.screenShake = 10;
        this.spawnBloodSparks(targetX, 0, targetZ, '#9c27b0');
        const dist = Math.hypot(this.px - targetX, this.pz - targetZ);
        if (dist <= 85) {
          this.damagePlayer(this.bossPhase === 2 ? 55 : 40);
        }
      },
    });
  }

  private startDarkOrbs() {
    this.bossState = 'WINDUP';
    this.bossStateTimer = 0.8;
    soundManager.playBossRoar();

    // Spawn 3 tracking orbs
    const angles = [-0.4, 0, 0.4];
    angles.forEach((offset) => {
      const baseAngle = Math.atan2(this.pz - this.bz, this.px - this.bx) + offset;
      this.projectiles.push({
        x: this.bx,
        y: -35,
        z: this.bz,
        vx: Math.cos(baseAngle) * 115,
        vz: Math.sin(baseAngle) * 115,
        radius: 12,
        life: 0,
      });
    });
  }

  private damagePlayer(amount: number) {
    // If player is in I-Frames (Dodge Roll), damage is completely avoided!
    if (this.isRolling && this.rollTimer <= this.iFrameWindow) {
      // Successful dodge!
      this.spawnBloodSparks(this.px, this.py - 15, this.pz, '#00e5ff');
      return;
    }

    this.playerHp = Math.max(0, this.playerHp - amount);
    this.screenShake = 8;
    soundManager.playHit();
    this.spawnBloodSparks(this.px, this.py - 20, this.pz, '#d32f2f');
  }

  private updateProjectilesAndTelegraphs(dt: number) {
    // Telegraphs
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tg = this.telegraphs[i];
      tg.timer += dt;
      if (tg.timer >= tg.duration) {
        tg.onExecute();
        this.telegraphs.splice(i, 1);
      }
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life += dt;
      pr.x += pr.vx * dt;
      pr.z += pr.vz * dt;

      // Hit player check
      const dist = Math.hypot(this.px - pr.x, this.pz - pr.z);
      if (dist < pr.radius + 15) {
        this.damagePlayer(25);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.life > 4.5 || Math.hypot(pr.x, pr.z) > this.arenaRadius) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private spawnBloodSparks(x: number, y: number, z: number, color: string) {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 160,
        vy: -50 - Math.random() * 80,
        vz: (Math.random() - 0.5) * 160,
        color,
        size: 3 + Math.random() * 3,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  // --- 3D PERSPECTIVE RENDERING ---

  private project(x: number, y: number, z: number, cw: number, ch: number) {
    const rx = x - this.camX;
    const ry = y - this.camY;
    const rz = z - this.camZ;

    // Behind camera check
    if (rz >= -20) return null;

    const scale = this.fov / -rz;
    const sx = cw / 2 + rx * scale;
    const sy = ch / 2 + ry * scale;
    return { x: sx, y: sy, scale };
  }

  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    ctx.save();

    // Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Dark Colosseum Background & Fog
    const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);
    bgGrad.addColorStop(0, '#040407');
    bgGrad.addColorStop(0.5, '#0c0d16');
    bgGrad.addColorStop(1, '#1b1424');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    // 2. 3D Floor Grid & Arena Boundary
    this.drawArenaFloor(ctx, cw, ch);

    // 3. Attack Telegraphs (Ground warnings)
    this.drawTelegraphs(ctx, cw, ch);

    // 4. Draw Boss 3D Entity (Giratina)
    this.drawBoss3D(ctx, cw, ch);

    // 5. Draw Projectiles
    this.drawProjectiles(ctx, cw, ch);

    // 6. Draw Player Knight 3D Entity
    this.drawPlayer3D(ctx, cw, ch);

    // 7. Draw 3D Particles & Embers
    this.drawParticles(ctx, cw, ch);

    ctx.restore();

    // 8. Authentic Dark Souls HUD Overlay
    this.drawSoulsHUD(ctx, cw, ch);
  }

  private drawArenaFloor(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    // 3D Stone Tiles
    ctx.strokeStyle = 'rgba(70, 60, 90, 0.25)';
    ctx.lineWidth = 1;

    for (let x = -this.arenaRadius; x <= this.arenaRadius; x += 60) {
      const p1 = this.project(x, 0, -this.arenaRadius, cw, ch);
      const p2 = this.project(x, 0, this.arenaRadius, cw, ch);
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    for (let z = -this.arenaRadius; z <= this.arenaRadius; z += 60) {
      const p1 = this.project(-this.arenaRadius, 0, z, cw, ch);
      const p2 = this.project(this.arenaRadius, 0, z, cw, ch);
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Outer Fog Ring Wall
    ctx.strokeStyle = this.bossPhase === 2 ? '#ff3d00' : '#7b1fa2';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 16) {
      const ax = Math.cos(a) * this.arenaRadius;
      const az = Math.sin(a) * this.arenaRadius;
      const p = this.project(ax, 0, az, cw, ch);
      if (p) {
        if (a === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }

  private drawTelegraphs(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    this.telegraphs.forEach((tg) => {
      const alpha = 0.35 + (tg.timer / tg.duration) * 0.45;
      ctx.fillStyle = `rgba(220, 30, 40, ${alpha})`;
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2;

      if (tg.type === 'CIRCLE') {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += Math.PI / 8) {
          const tx = tg.x + Math.cos(a) * tg.radius;
          const tz = tg.z + Math.sin(a) * tg.radius;
          const pt = this.project(tx, 0, tz, cw, ch);
          if (pt) {
            if (a === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (tg.type === 'ARC') {
        const center = this.project(tg.x, 0, tg.z, cw, ch);
        if (!center) return;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        const baseAngle = tg.angle || 0;
        for (let a = baseAngle - 1.2; a <= baseAngle + 1.2; a += 0.2) {
          const tx = tg.x + Math.cos(a) * tg.radius;
          const tz = tg.z + Math.sin(a) * tg.radius;
          const pt = this.project(tx, 0, tz, cw, ch);
          if (pt) ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  private drawBoss3D(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const p = this.project(this.bx, this.by, this.bz, cw, ch);
    if (!p) return;

    const s = p.scale;
    const bossW = 140 * s;
    const bossH = 120 * s;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Dark Void Aura
    const auraColor = this.bossPhase === 2 ? 'rgba(255, 60, 0, 0.35)' : 'rgba(120, 20, 180, 0.35)';
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.ellipse(0, -bossH * 0.4, bossW * 0.65, bossH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6 Scythe Wings (Giratina)
    const wingTime = Date.now() * 0.003;
    const wingAngle = Math.sin(wingTime) * 0.15;

    ctx.fillStyle = this.bossPhase === 2 ? '#1a0d0d' : '#141419';
    for (let side = -1; side <= 1; side += 2) {
      for (let w = 0; w < 3; w++) {
        ctx.save();
        ctx.translate(side * (bossW * 0.22), -bossH * (0.35 + w * 0.18));
        ctx.rotate(side * (0.4 + w * 0.3 + wingAngle));

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(side * (bossW * 0.4), -bossH * 0.2, side * (bossW * 0.6), 0);
        ctx.quadraticCurveTo(side * (bossW * 0.35), bossH * 0.2, 0, 0);
        ctx.fill();

        // Crimson Claws on wing tips
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(side * (bossW * 0.55), -4, 8 * s, 6 * s);
        ctx.restore();
      }
    }

    // Heavy Armored Dragon Torso
    ctx.fillStyle = '#3a3a44';
    ctx.beginPath();
    ctx.ellipse(0, -bossH * 0.35, bossW * 0.28, bossH * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Neck Collar & Crown Spikes
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-bossW * 0.18, -bossH * 0.62, bossW * 0.36, bossH * 0.12);
    ctx.fillRect(-bossW * 0.25, -bossH * 0.72, bossW * 0.12, bossH * 0.25);
    ctx.fillRect(bossW * 0.13, -bossH * 0.72, bossW * 0.12, bossH * 0.25);

    // Ribcage Red Stripes
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(-bossW * 0.16, -bossH * 0.45, bossW * 0.32, 4 * s);
    ctx.fillRect(-bossW * 0.16, -bossH * 0.35, bossW * 0.32, 4 * s);
    ctx.fillRect(-bossW * 0.16, -bossH * 0.25, bossW * 0.32, 4 * s);

    // Dragon Head
    ctx.fillStyle = '#22222a';
    ctx.beginPath();
    ctx.arc(0, -bossH * 0.68, bossW * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Crimson Eyes
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(-bossW * 0.08, -bossH * 0.7, 5 * s, 4 * s);
    ctx.fillRect(bossW * 0.03, -bossH * 0.7, 5 * s, 4 * s);

    // Stagger / Riposte Indicator
    if (this.isBossStaggered) {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRITICAL RIPOSTE!', 0, -bossH * 0.85);
    }

    ctx.restore();
  }

  private drawPlayer3D(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const p = this.project(this.px, this.py, this.pz, cw, ch);
    if (!p) return;

    const s = p.scale;
    const playerW = 38 * s;
    const playerH = 50 * s;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, playerW * 0.5, playerH * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.isRolling) {
      // Roll Sphere Animation
      ctx.fillStyle = '#78909c';
      ctx.beginPath();
      ctx.arc(0, -playerH * 0.35, playerW * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00e5ff'; // I-Frame glow
      ctx.lineWidth = 2 * s;
      ctx.stroke();
    } else {
      // Knight Armor (Body)
      ctx.fillStyle = '#455a64';
      ctx.fillRect(-playerW * 0.28, -playerH * 0.65, playerW * 0.56, playerH * 0.45);

      // Iron Great Helm
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath();
      ctx.arc(0, -playerH * 0.75, playerW * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Visor slit
      ctx.fillStyle = '#111';
      ctx.fillRect(-playerW * 0.14, -playerH * 0.77, playerW * 0.28, 3 * s);

      // Heater Shield
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(-playerW * 0.42, -playerH * 0.55, playerW * 0.22, playerH * 0.35);

      // Gleaming Greatsword
      ctx.fillStyle = '#eceff1';
      const swordSwingAngle = this.isAttacking ? (this.attackTimer / 0.35) * Math.PI : -0.3;
      ctx.save();
      ctx.translate(playerW * 0.25, -playerH * 0.4);
      ctx.rotate(swordSwingAngle);
      ctx.fillRect(-2 * s, -playerH * 0.6, 4 * s, playerH * 0.6);
      // Crossguard & Hilt
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(-6 * s, -4 * s, 12 * s, 3 * s);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    this.projectiles.forEach((pr) => {
      const p = this.project(pr.x, pr.y, pr.z, cw, ch);
      if (!p) return;

      const r = Math.max(3, pr.radius * p.scale);
      ctx.fillStyle = '#9c27b0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff80ab';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    this.particles.forEach((pt) => {
      const p = this.project(pt.x, pt.y, pt.z, cw, ch);
      if (!p) return;

      const r = Math.max(1, pt.size * p.scale);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawSoulsHUD(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    // 1. Player HP & Stamina Bars (Top Left)
    const hudX = 10;
    const hudY = 10;
    const barW = 105;
    const barH = 7;

    // HP Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(hudX, hudY, barW + 4, barH + 4);
    ctx.fillStyle = '#c62828';
    const hpRatio = Math.max(0, this.playerHp / this.playerMaxHp);
    ctx.fillRect(hudX + 2, hudY + 2, barW * hpRatio, barH);
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX, hudY, barW + 4, barH + 4);

    // Stamina Bar
    const stamY = hudY + 12;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(hudX, stamY, barW + 4, barH + 4);
    ctx.fillStyle = this.isStaminaExhausted ? '#ef5350' : '#2e7d32';
    const stamRatio = Math.max(0, this.stamina / this.maxStamina);
    ctx.fillRect(hudX + 2, stamY + 2, barW * stamRatio, barH);
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX, stamY, barW + 4, barH + 4);

    // Estus Flask Counter
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`🏺 ESTUS: ${this.estusCharges} [START]`, hudX, stamY + 18);

    // Objective in Top-Left Corner
    const objY = stamY + 28;
    ctx.fillStyle = 'rgba(15, 12, 24, 0.88)';
    ctx.fillRect(hudX, objY, 150, 20);
    ctx.strokeStyle = this.bossPhase === 2 ? '#ff3d00' : '#ab47bc';
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX, objY, 150, 20);

    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('⚔️ SPECIAL AREA OBJECTIVE', hudX + 6, objY + 9);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    const objText = this.bossPhase === 2 ? 'SURVIVE UNLEASHED ABYSS!' : 'VANQUISH GIRATINA 3D';
    ctx.fillText(objText, hudX + 6, objY + 17);

    // 2. Boss Health Bar (Bottom Screen - Classic Dark Souls Frame)
    const bossBarW = cw - 36;
    const bossBarH = 8;
    const bossBarX = 18;
    const bossBarY = ch - 22;

    // Boss Name & Title
    ctx.fillStyle = '#b0bec5';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    const phaseTitle = this.bossPhase === 2 ? 'GIRATINA, UNLEASHED ABYSS' : 'GIRATINA, LORD OF DISTORTION';
    ctx.fillText(phaseTitle, bossBarX, bossBarY - 4);

    // Bar background
    ctx.fillStyle = '#101014';
    ctx.fillRect(bossBarX, bossBarY, bossBarW, bossBarH);

    // Yellow Ghost Bar (Damage delay)
    ctx.fillStyle = '#fbc02d';
    const ghostRatio = Math.max(0, this.bossGhostHp / this.bossMaxHp);
    ctx.fillRect(bossBarX, bossBarY, bossBarW * ghostRatio, bossBarH);

    // Red Actual HP Bar
    ctx.fillStyle = '#b71c1c';
    const bossHpRatio = Math.max(0, this.bossHp / this.bossMaxHp);
    ctx.fillRect(bossBarX, bossBarY, bossBarW * bossHpRatio, bossBarH);

    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 1;
    ctx.strokeRect(bossBarX, bossBarY, bossBarW, bossBarH);

    // Controls Legend (Top Right)
    ctx.fillStyle = '#90a4ae';
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[Z] Slash  [B] Roll  [START] Estus', cw - 10, 16);

    // 3. YOU DIED Screen
    if (this.gameState === 'YOU_DIED') {
      const alpha = Math.min(0.92, this.deathTimer * 0.7);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, cw, ch);

      ctx.fillStyle = '#b71c1c';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Y O U   D I E D', cw / 2, ch / 2 - 6);

      if (this.deathTimer > 1.2) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('▶ PRESS [A] TO RETIRE ◀', cw / 2, ch / 2 + 25);
      }
    }

    // 4. GREAT FOE VANQUISHED Screen
    if (this.gameState === 'VICTORY') {
      const alpha = Math.min(0.88, this.victoryTimer * 0.6);
      ctx.fillStyle = `rgba(5, 5, 12, ${alpha})`;
      ctx.fillRect(0, 0, cw, ch);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GREAT FOE VANQUISHED', cw / 2, ch / 2 - 16);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`+${this.rewardExp} EXP TOKENS`, cw / 2, ch / 2 + 8);
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`+$${this.rewardMoney} BOUNTY`, cw / 2, ch / 2 + 24);

      if (this.victoryTimer > 1.5) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('▶ PRESS [A] TO CLAIM ◀', cw / 2, ch / 2 + 45);
      }
    }
  }
}
