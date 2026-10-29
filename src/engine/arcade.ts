import { soundManager } from '../audio/sound';
import type { InputHandler } from './input';
import type { PlayerData } from '../types';

export const ARCADE_W = 320;
export const ARCADE_H = 240;

export type ArcadeGameId = 'pong' | 'flappy' | 'invaders' | 'pacman' | 'snake' | 'breakout';

export interface ArcadeGameMeta {
  id: ArcadeGameId;
  title: string;
  icon: string;
  color: string;
  hint: string;
}

export const ARCADE_GAMES: ArcadeGameMeta[] = [
  { id: 'pong', title: 'NEON PONG', icon: '🏓', color: '#00e5ff', hint: 'UP/DOWN MOVE · Z SERVE' },
  { id: 'flappy', title: 'FLAPPY PIDGEY', icon: '🐤', color: '#ffd54f', hint: 'Z/UP FLAP · AVOID PIPES' },
  { id: 'invaders', title: 'SPACE INVADERS', icon: '👾', color: '#7c4dff', hint: 'LEFT/RIGHT MOVE · Z FIRE' },
  { id: 'pacman', title: 'PAC-GHOST', icon: '🟡', color: '#ffe082', hint: 'ARROWS MOVE · EAT DOTS' },
  { id: 'snake', title: 'SNAKE ROUTE 1', icon: '🐍', color: '#69f0ae', hint: 'ARROWS TURN · EAT BERRIES' },
  { id: 'breakout', title: 'BRICK BREAKER', icon: '🧱', color: '#ff5252', hint: 'LEFT/RIGHT MOVE · Z LAUNCH' },
];

interface ArcadeGame {
  score: number;
  finished: boolean;
  won: boolean;
  update(input: InputHandler, dt: number): void;
  draw(ctx: CanvasRenderingContext2D, time: number): void;
}

const W = ARCADE_W;
const H = ARCADE_H;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  title: string,
  score: number,
  color: string,
  right = ''
) {
  ctx.fillStyle = 'rgba(3,6,12,0.92)';
  ctx.fillRect(0, 0, W, 22);
  ctx.fillStyle = color;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 8, 11);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE ${score}`, 160, 11);
  if (right) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8de9ff';
    ctx.fillText(right, W - 8, 11);
  }
  ctx.textBaseline = 'alphabetic';
}

function drawLives(ctx: CanvasRenderingContext2D, lives: number, x: number, y: number, color: string) {
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = color;
    ctx.fillRect(x + i * 10, y, 6, 6);
  }
}

// =============================================================
// PONG
// =============================================================

class PongGame implements ArcadeGame {
  score = 0;
  finished = false;
  won = false;

  private playerY = H / 2;
  private aiY = H / 2;
  private ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  private playerScore = 0;
  private aiScore = 0;
  private serveTimer = 0.8;
  private rally = 0;

  private readonly top = 26;
  private readonly bottom = H - 14;
  private readonly paddleH = 34;

  update(input: InputHandler, dt: number) {
    const speed = 220;
    if (input.isDown('up')) this.playerY -= speed * dt;
    if (input.isDown('down')) this.playerY += speed * dt;
    this.playerY = clamp(this.playerY, this.top + this.paddleH / 2, this.bottom - this.paddleH / 2);

    const chase = this.ball.vx > 0 ? 150 : 75;
    if (this.aiY < this.ball.y - 3) this.aiY += chase * dt;
    else if (this.aiY > this.ball.y + 3) this.aiY -= chase * dt;
    this.aiY = clamp(this.aiY, this.top + this.paddleH / 2, this.bottom - this.paddleH / 2);

    if (this.serveTimer > 0) {
      this.serveTimer -= dt;
      if (this.serveTimer <= 0) {
        this.ball.vx = Math.random() < 0.5 ? -170 : 170;
        this.ball.vy = rand(-70, 70);
      }
      return;
    }

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.y < this.top + 3) {
      this.ball.y = this.top + 3;
      this.ball.vy = Math.abs(this.ball.vy);
    } else if (this.ball.y > this.bottom - 3) {
      this.ball.y = this.bottom - 3;
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    const leftX = 16;
    const rightX = W - 21;
    if (
      this.ball.vx < 0 &&
      this.ball.x - 3 <= leftX + 5 &&
      this.ball.x + 3 >= leftX &&
      Math.abs(this.ball.y - this.playerY) <= this.paddleH / 2 + 3
    ) {
      this.hitPaddle(this.playerY, 1);
    } else if (
      this.ball.vx > 0 &&
      this.ball.x + 3 >= rightX &&
      this.ball.x - 3 <= rightX + 5 &&
      Math.abs(this.ball.y - this.aiY) <= this.paddleH / 2 + 3
    ) {
      this.hitPaddle(this.aiY, -1);
    }

    if (this.ball.x < -8) this.point(false);
    else if (this.ball.x > W + 8) this.point(true);
  }

  private hitPaddle(center: number, dir: number) {
    this.rally++;
    const speed = Math.min(340, Math.abs(this.ball.vx) * 1.06 + 4);
    this.ball.vx = dir * speed;
    this.ball.vy = clamp(this.ball.vy + (this.ball.y - center) * 5, -170, 170);
    this.score = this.playerScore * 100 + this.rally;
    soundManager.playTone(440 + this.rally * 8, 'square', 0.05);
  }

  private point(playerWon: boolean) {
    if (playerWon) this.playerScore++;
    else this.aiScore++;
    this.rally = 0;
    this.score = this.playerScore * 100;

    if (this.playerScore >= 5 || this.aiScore >= 5) {
      this.finished = true;
      this.won = this.playerScore >= 5;
      if (this.won) this.score += 100;
      return;
    }

    this.ball.x = W / 2;
    this.ball.y = H / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.serveTimer = 0.7;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#1d3b55';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, this.top - 2, W - 16, this.bottom - this.top + 6);

    ctx.strokeStyle = 'rgba(0,229,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(W / 2, this.top);
    ctx.lineTo(W / 2, this.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0,229,255,0.32)';
    ctx.font = 'bold 46px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.playerScore), W / 2 - 62, 120);
    ctx.fillText(String(this.aiScore), W / 2 + 62, 120);
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(16, this.playerY - this.paddleH / 2, 5, this.paddleH);
    ctx.fillStyle = '#ff4081';
    ctx.fillRect(W - 21, this.aiY - this.paddleH / 2, 5, this.paddleH);

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.ball.x - 3, this.ball.y - 3, 6, 6);
    ctx.shadowBlur = 0;

    drawHeader(ctx, 'NEON PONG', this.score, '#00e5ff', `${this.playerScore}-${this.aiScore}`);
  }
}

// =============================================================
// FLAPPY
// =============================================================

interface Pipe {
  x: number;
  gapY: number;
  scored: boolean;
}

class FlappyGame implements ArcadeGame {
  score = 0;
  finished = false;
  won = false;

  private birdY = 120;
  private birdV = 0;
  private pipes: Pipe[] = [];
  private spawnTimer = 0;
  private flaps = 0;
  private started = false;

  private readonly birdX = 78;
  private readonly radius = 7;
  private readonly gap = 64;
  private readonly pipeW = 36;
  private readonly groundY = H - 16;
  private readonly topY = 24;

  constructor() {
    for (let i = 0; i < 3; i++) {
      this.pipes.push({ x: W + 40 + i * 140, gapY: rand(70, 170), scored: false });
    }
  }

  update(input: InputHandler, dt: number) {
    const flap = input.isJustPressed('a') || input.isJustPressed('up');

    if (!this.started) {
      if (flap) {
        this.started = true;
        this.birdV = -260;
        this.flaps++;
        soundManager.playTone(560, 'square', 0.05, undefined, 720);
      }
      return;
    }

    if (flap) {
      this.birdV = -260;
      this.flaps++;
      soundManager.playTone(560, 'square', 0.05, undefined, 720);
    }

    this.birdV += 840 * dt;
    this.birdY += this.birdV * dt;

    const scroll = 100;
    this.spawnTimer += dt;
    for (const p of this.pipes) p.x -= scroll * dt;

    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < W - 60) {
      if (this.spawnTimer > 0.35) {
        this.pipes.push({ x: W + 30, gapY: rand(64, 172), scored: false });
        this.spawnTimer = 0;
      }
    }

    if (this.pipes.length && this.pipes[0].x < -this.pipeW - 10) this.pipes.shift();

    for (const p of this.pipes) {
      if (!p.scored && p.x + this.pipeW < this.birdX - this.radius) {
        p.scored = true;
        this.score += 10;
        soundManager.playTone(880, 'square', 0.05);
      }
    }

    if (this.birdY + this.radius > this.groundY || this.birdY - this.radius < this.topY) {
      this.die();
      return;
    }

    for (const p of this.pipes) {
      const withinX =
        this.birdX + this.radius > p.x && this.birdX - this.radius < p.x + this.pipeW;
      if (!withinX) continue;
      const gapTop = p.gapY;
      const gapBottom = p.gapY + this.gap;
      if (this.birdY - this.radius < gapTop || this.birdY + this.radius > gapBottom) {
        this.die();
        return;
      }
    }
  }

  private die() {
    if (this.finished) return;
    this.finished = true;
    this.won = false;
    soundManager.playBoom();
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    const sky = ctx.createLinearGradient(0, 22, 0, this.groundY);
    sky.addColorStop(0, '#0b1a3a');
    sky.addColorStop(0.6, '#14395e');
    sky.addColorStop(1, '#1e5a6b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 22, W, H - 22);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 71 - time * 14) % (W + 40)) - 20;
      ctx.fillRect(x, 46 + (i % 3) * 26, 18, 5);
    }

    for (const p of this.pipes) {
      const gapTop = p.gapY;
      const gapBottom = p.gapY + this.gap;
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(p.x, 22, this.pipeW, gapTop - 22);
      ctx.fillRect(p.x, gapBottom, this.pipeW, this.groundY - gapBottom);
      ctx.fillStyle = '#66bb6a';
      ctx.fillRect(p.x + 4, 22, 6, gapTop - 22);
      ctx.fillRect(p.x + 4, gapBottom, 6, this.groundY - gapBottom);
      ctx.fillStyle = '#1b5e20';
      ctx.fillRect(p.x - 3, gapTop - 12, this.pipeW + 6, 12);
      ctx.fillRect(p.x - 3, gapBottom, this.pipeW + 6, 12);
    }

    ctx.fillStyle = '#263238';
    ctx.fillRect(0, this.groundY, W, H - this.groundY);
    ctx.fillStyle = '#37474f';
    for (let x = 0; x < W; x += 16) {
      ctx.fillRect(x + ((time * 40) % 16), this.groundY + 3, 8, 2);
    }

    const tilt = clamp(this.birdV / 520, -0.5, 0.9);
    ctx.save();
    ctx.translate(this.birdX, this.birdY);
    ctx.rotate(tilt);
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.arc(-3, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3, -3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(3, -4, 1.5, 2);
    ctx.fillStyle = '#ff6f00';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(12, 2);
    ctx.lineTo(6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (!this.started) {
      ctx.fillStyle = 'rgba(3,6,12,0.72)';
      ctx.fillRect(64, 96, 192, 46);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 1;
      ctx.strokeRect(64.5, 96.5, 191, 45);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('FLAPPY PIDGEY', W / 2, 114);
      ctx.fillStyle = '#e8f6ff';
      ctx.font = '8px monospace';
      ctx.fillText('PRESS Z OR UP TO FLAP', W / 2, 130);
    }

    drawHeader(ctx, 'FLAPPY PIDGEY', this.score, '#ffd54f', `${this.flaps} FLAPS`);
  }
}

// =============================================================
// SPACE INVADERS
// =============================================================

interface Alien {
  x: number;
  y: number;
  alive: boolean;
  row: number;
}

interface Shot {
  x: number;
  y: number;
}

class InvadersGame implements ArcadeGame {
  score = 0;
  finished = false;
  won = false;

  private playerX = W / 2;
  private aliens: Alien[] = [];
  private playerShots: Shot[] = [];
  private alienShots: Shot[] = [];
  private dir = 1;
  private drop = 0;
  private lives = 3;
  private cooldown = 0;
  private alienFire = 1.2;
  private invuln = 0;

  private readonly bottom = H - 30;

  constructor() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        this.aliens.push({ x: 64 + c * 24, y: 44 + r * 16, alive: true, row: r });
      }
    }
  }

  update(input: InputHandler, dt: number) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.drop = Math.max(0, this.drop - 70 * dt);

    if (input.isDown('left')) this.playerX -= 170 * dt;
    if (input.isDown('right')) this.playerX += 170 * dt;
    this.playerX = clamp(this.playerX, 16, W - 16);

    if (input.isDown('a') && this.cooldown <= 0) {
      this.playerShots.push({ x: this.playerX, y: H - 36 });
      this.cooldown = 0.24;
      soundManager.playTone(720, 'square', 0.04, undefined, 980);
    }

    const alive = this.aliens.filter((a) => a.alive);
    if (alive.length === 0) {
      this.finished = true;
      this.won = true;
      return;
    }

    const speed = 22 + (32 - alive.length) * 1.7;
    const step = this.dir * speed * dt;
    let hitEdge = false;
    for (const a of alive) {
      a.x += step;
      if (a.x < 12 || a.x > W - 28) hitEdge = true;
    }
    if (hitEdge) {
      this.dir *= -1;
      for (const a of alive) a.y += 10;
    }

    for (const a of alive) {
      if (a.y + 10 >= this.bottom + 10) {
        this.finished = true;
        this.won = false;
        return;
      }
    }

    this.alienFire -= dt;
    if (this.alienFire <= 0) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      this.alienShots.push({ x: shooter.x + 8, y: shooter.y + 10 });
      this.alienFire = rand(0.55, 1.25) * clamp(1.4 - (32 - alive.length) * 0.02, 0.55, 1.4);
    }

    for (const s of this.playerShots) s.y -= 380 * dt;
    for (const s of this.alienShots) s.y += 170 * dt;
    this.playerShots = this.playerShots.filter((s) => s.y > 22);
    this.alienShots = this.alienShots.filter((s) => s.y < H);

    for (const s of this.playerShots) {
      for (const a of alive) {
        if (a.alive && s.x > a.x && s.x < a.x + 16 && s.y > a.y && s.y < a.y + 10) {
          a.alive = false;
          this.score += 10;
          s.y = -50;
          soundManager.playTone(300, 'square', 0.06, undefined, 120);
          break;
        }
      }
    }

    for (const s of this.alienShots) {
      if (
        s.x > this.playerX - 12 &&
        s.x < this.playerX + 12 &&
        s.y > H - 40 &&
        s.y < H - 26 &&
        this.invuln <= 0
      ) {
        s.y = H + 20;
        this.hitPlayer();
      }
    }

    this.playerShots = this.playerShots.filter((s) => s.y > 0);
  }

  private hitPlayer() {
    this.lives--;
    this.invuln = 1.4;
    soundManager.playHit();
    if (this.lives <= 0) {
      this.finished = true;
      this.won = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    ctx.fillStyle = '#05030f';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 28; i++) {
      const x = (i * 53) % W;
      const y = 28 + ((i * 37 + time * 10) % 170);
      ctx.fillRect(x, y, 1, 1);
    }

    const palette = ['#ff4081', '#7c4dff', '#00e5ff', '#69f0ae'];
    for (const a of this.aliens) {
      if (!a.alive) continue;
      ctx.fillStyle = palette[a.row];
      ctx.fillRect(a.x + 2, a.y, 12, 4);
      ctx.fillRect(a.x, a.y + 4, 16, 4);
      ctx.fillRect(a.x + 1, a.y + 8, 3, 2);
      ctx.fillRect(a.x + 12, a.y + 8, 3, 2);
      ctx.fillStyle = '#05030f';
      ctx.fillRect(a.x + 4, a.y + 4, 2, 2);
      ctx.fillRect(a.x + 10, a.y + 4, 2, 2);
    }

    ctx.fillStyle = '#7cf7ff';
    for (const s of this.playerShots) ctx.fillRect(s.x - 1, s.y - 6, 2, 6);
    ctx.fillStyle = '#ff5252';
    for (const s of this.alienShots) ctx.fillRect(s.x - 1, s.y, 2, 6);

    if (this.invuln <= 0 || Math.floor(time * 12) % 2 === 0) {
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(this.playerX - 12, H - 38, 24, 4);
      ctx.fillRect(this.playerX - 7, H - 34, 14, 4);
      ctx.fillRect(this.playerX - 2, H - 30, 4, 4);
    }

    drawLives(ctx, this.lives, 10, H - 10, '#00e5ff');
    drawHeader(ctx, 'SPACE INVADERS', this.score, '#7c4dff', `WAVE 1 · ${this.aliens.filter((a) => a.alive).length} LEFT`);
  }
}

// =============================================================
// PAC-MAN
// =============================================================

type Dir = 'up' | 'down' | 'left' | 'right';

const DIRS: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const PAC_MAZE = [
  '#####################',
  '#o........#........o#',
  '#.###.###.#.###.###.#',
  '#...................#',
  '#.###.#.#####.#.###.#',
  '#.....#...#...#.....#',
  '#####.###.#.###.#####',
  '#.......#...#.......#',
  '#.#####.#.#.#.#####.#',
  '#.....#.......#.....#',
  '#.###.#.#####.#.###.#',
  '#...................#',
  '#.###.###.#.###.###.#',
  '#o........#........o#',
  '#####################',
];

interface PacEntity {
  tx: number;
  ty: number;
  fx: number;
  fy: number;
  dir: Dir;
  moving: boolean;
  prog: number;
  dur: number;
  hidden: boolean;
  respawn: number;
}

interface Ghost extends PacEntity {
  color: string;
  startX: number;
  startY: number;
}

const PAC_TS = 12;
const PAC_OX = 34;
const PAC_OY = 28;

class PacmanGame implements ArcadeGame {
  score = 0;
  finished = false;
  won = false;

  private grid: string[][] = [];
  private dotsLeft = 0;
  private lives = 3;
  private power = 0;
  private ready = 0.9;
  private pac: PacEntity = this.makeEntity(10, 11, 'left', 0.115);
  private ghosts: Ghost[] = [];
  private invuln = 0;

  constructor() {
    this.resetMaze();
    this.grid[11][10] = ' ';
    this.dotsLeft--;
    this.resetActors();
  }

  private resetMaze() {
    this.grid = PAC_MAZE.map((row) => row.split(''));
    this.dotsLeft = 0;
    for (const row of this.grid) {
      for (const c of row) if (c === '.' || c === 'o') this.dotsLeft++;
    }
  }

  private makeEntity(tx: number, ty: number, dir: Dir, dur: number): PacEntity {
    return { tx, ty, fx: tx, fy: ty, dir, moving: false, prog: 0, dur, hidden: false, respawn: 0 };
  }

  private resetActors() {
    this.pac = this.makeEntity(10, 11, 'left', 0.115);
    this.ghosts = [
      { ...this.makeEntity(9, 7, 'up', 0.21), color: '#ff5252', startX: 9, startY: 7 },
      { ...this.makeEntity(10, 7, 'left', 0.21), color: '#ffb74d', startX: 10, startY: 7 },
      { ...this.makeEntity(11, 7, 'right', 0.21), color: '#4fc3f7', startX: 11, startY: 7 },
    ];
    this.ready = 0.9;
    this.power = 0;
  }

  private canWalk(x: number, y: number): boolean {
    if (x < 0 || y < 0 || y >= this.grid.length || x >= this.grid[0].length) return false;
    return this.grid[y][x] !== '#';
  }

  private step(e: PacEntity, dt: number, choose: () => Dir | null) {
    if (e.moving) {
      e.prog += dt / e.dur;
      if (e.prog >= 1) {
        e.prog = 0;
        e.moving = false;
        e.tx += DIRS[e.dir].x;
        e.ty += DIRS[e.dir].y;
        if (e === this.pac) this.eatAt(e.tx, e.ty);
      }
      return;
    }

    const dir = choose();
    if (!dir) return;
    if (!this.canWalk(e.tx + DIRS[dir].x, e.ty + DIRS[dir].y)) return;

    e.dir = dir;
    e.fx = e.tx;
    e.fy = e.ty;
    e.moving = true;
    e.prog = 0;
  }

  private eatAt(x: number, y: number) {
    const cell = this.grid[y][x];
    if (cell === '.') {
      this.grid[y][x] = ' ';
      this.dotsLeft--;
      this.score += 10;
      if (this.dotsLeft % 8 === 0) soundManager.playTone(620, 'square', 0.03);
    } else if (cell === 'o') {
      this.grid[y][x] = ' ';
      this.dotsLeft--;
      this.score += 50;
      this.power = 6;
      soundManager.playTone(220, 'square', 0.18, undefined, 880);
    }

    if (this.dotsLeft <= 0) {
      this.finished = true;
      this.won = true;
    }
  }

  update(input: InputHandler, dt: number) {
    if (this.ready > 0) {
      this.ready -= dt;
      return;
    }

    this.power = Math.max(0, this.power - dt);
    this.invuln = Math.max(0, this.invuln - dt);

    const want: Dir | null = input.isDown('up')
      ? 'up'
      : input.isDown('down')
        ? 'down'
        : input.isDown('left')
          ? 'left'
          : input.isDown('right')
            ? 'right'
            : null;

    this.step(this.pac, dt, () => {
      if (want && this.canWalk(this.pac.tx + DIRS[want].x, this.pac.ty + DIRS[want].y)) {
        return want;
      }
      if (this.canWalk(this.pac.tx + DIRS[this.pac.dir].x, this.pac.ty + DIRS[this.pac.dir].y)) {
        return this.pac.dir;
      }
      return null;
    });

    for (const g of this.ghosts) {
      if (g.hidden) {
        g.respawn -= dt;
        if (g.respawn <= 0) {
          g.hidden = false;
          g.tx = g.startX;
          g.ty = g.startY;
          g.fx = g.tx;
          g.fy = g.ty;
          g.moving = false;
          g.prog = 0;
          g.dir = 'up';
        }
        continue;
      }

      g.dur = this.power > 0 ? 0.3 : 0.2;
      this.step(g, dt, () => this.chooseGhostDir(g));
    }

    if (this.invuln <= 0) this.checkGhostCollisions();
  }

  private chooseGhostDir(g: Ghost): Dir {
    const options: Dir[] = [];
    for (const d of Object.keys(DIRS) as Dir[]) {
      if (d === OPPOSITE[g.dir]) continue;
      if (!this.canWalk(g.tx + DIRS[d].x, g.ty + DIRS[d].y)) continue;
      options.push(d);
    }
    if (options.length === 0) return OPPOSITE[g.dir];

    if (Math.random() < 0.22) return options[Math.floor(Math.random() * options.length)];

    let best = options[0];
    let bestDist = Infinity;
    for (const d of options) {
      const nx = g.tx + DIRS[d].x;
      const ny = g.ty + DIRS[d].y;
      const dist = Math.abs(nx - this.pac.tx) + Math.abs(ny - this.pac.ty);
      const score = this.power > 0 ? -dist : dist;
      if (score < bestDist) {
        bestDist = score;
        best = d;
      }
    }
    return best;
  }

  private checkGhostCollisions() {
    const px = this.pacVisX();
    const py = this.pacVisY();
    for (const g of this.ghosts) {
      if (g.hidden) continue;
      const gx = this.entVisX(g);
      const gy = this.entVisY(g);
      if (Math.abs(px - gx) + Math.abs(py - gy) > 0.6) continue;

      if (this.power > 0) {
        g.hidden = true;
        g.respawn = 2.4;
        this.score += 200;
        soundManager.playCoin();
      } else {
        this.lives--;
        soundManager.playHit();
        if (this.lives <= 0) {
          this.finished = true;
          this.won = false;
        } else {
          this.invuln = 1.6;
          this.resetActors();
        }
        return;
      }
    }
  }

  private entVisX(e: PacEntity): number {
    return e.moving ? e.fx + DIRS[e.dir].x * e.prog : e.tx;
  }

  private entVisY(e: PacEntity): number {
    return e.moving ? e.fy + DIRS[e.dir].y * e.prog : e.ty;
  }

  private pacVisX(): number {
    return this.entVisX(this.pac);
  }

  private pacVisY(): number {
    return this.entVisY(this.pac);
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    ctx.fillStyle = '#04030a';
    ctx.fillRect(0, 0, W, H);

    const boardW = this.grid[0].length * PAC_TS;
    ctx.fillStyle = '#080820';
    ctx.fillRect(PAC_OX - 3, PAC_OY - 3, boardW + 6, this.grid.length * PAC_TS + 6);

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const cell = this.grid[y][x];
        const px = PAC_OX + x * PAC_TS;
        const py = PAC_OY + y * PAC_TS;

        if (cell === '#') {
          ctx.fillStyle = '#192a72';
          ctx.fillRect(px, py, PAC_TS, PAC_TS);
          ctx.fillStyle = '#2f4bd1';
          ctx.fillRect(px + 1, py + 1, PAC_TS - 2, PAC_TS - 2);
          ctx.fillStyle = '#22378f';
          ctx.fillRect(px + 3, py + 3, PAC_TS - 6, PAC_TS - 6);
        } else if (cell === '.') {
          ctx.fillStyle = '#ffd54f';
          ctx.fillRect(px + PAC_TS / 2 - 1, py + PAC_TS / 2 - 1, 2, 2);
        } else if (cell === 'o') {
          const pulse = 2.5 + Math.sin(time * 6) * 1.2;
          ctx.fillStyle = '#ffe082';
          ctx.beginPath();
          ctx.arc(px + PAC_TS / 2, py + PAC_TS / 2, pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const px = PAC_OX + this.pacVisX() * PAC_TS + PAC_TS / 2;
    const py = PAC_OY + this.pacVisY() * PAC_TS + PAC_TS / 2;
    if (this.invuln <= 0 || Math.floor(time * 14) % 2 === 0) {
      const mouth = 0.18 + Math.abs(Math.sin(time * 12)) * 0.4;
      let base = 0;
      if (this.pac.dir === 'left') base = Math.PI;
      else if (this.pac.dir === 'up') base = -Math.PI / 2;
      else if (this.pac.dir === 'down') base = Math.PI / 2;
      ctx.fillStyle = '#ffe082';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, PAC_TS * 0.42, base + mouth, base - mouth + Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    for (const g of this.ghosts) {
      if (g.hidden) continue;
      const gx = PAC_OX + this.entVisX(g) * PAC_TS + PAC_TS / 2;
      const gy = PAC_OY + this.entVisY(g) * PAC_TS + PAC_TS / 2;
      const frightened = this.power > 0;
      ctx.fillStyle = frightened
        ? Math.floor(time * 8) % 2 === 0
          ? '#304ffe'
          : '#ffffff'
        : g.color;
      ctx.beginPath();
      ctx.arc(gx, gy - 1, PAC_TS * 0.4, Math.PI, 0);
      ctx.lineTo(gx + PAC_TS * 0.4, gy + PAC_TS * 0.36);
      ctx.lineTo(gx + PAC_TS * 0.2, gy + PAC_TS * 0.24);
      ctx.lineTo(gx, gy + PAC_TS * 0.36);
      ctx.lineTo(gx - PAC_TS * 0.2, gy + PAC_TS * 0.24);
      ctx.lineTo(gx - PAC_TS * 0.4, gy + PAC_TS * 0.36);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx - 3, gy - 3, 2, 3);
      ctx.fillRect(gx + 1, gy - 3, 2, 3);
      if (!frightened) {
        ctx.fillStyle = '#1a237e';
        const dx = DIRS[g.dir].x;
        const dy = DIRS[g.dir].y;
        ctx.fillRect(gx - 3 + dx, gy - 3 + dy, 2, 2);
        ctx.fillRect(gx + 1 + dx, gy - 3 + dy, 2, 2);
      }
    }

    if (this.ready > 0) {
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('READY!', W / 2, 152);
    }

    drawLives(ctx, this.lives, 10, H - 10, '#ffe082');
    drawHeader(
      ctx,
      'PAC-GHOST',
      this.score,
      '#ffe082',
      this.power > 0 ? 'POWER!' : `DOTS ${this.dotsLeft}`
    );
  }
}

// =============================================================
// SNAKE
// =============================================================

interface Cell {
  x: number;
  y: number;
}

class SnakeGame implements ArcadeGame {
  score = 0;
  finished = false;
  won = false;

  private cols = 17;
  private rows = 13;
  private snake: Cell[] = [];
  private dir: Dir = 'right';
  private queue: Dir[] = [];
  private food: Cell = { x: 0, y: 0 };
  private tick = 0.14;
  private acc = 0;
  private eaten = 0;

  constructor() {
    const midY = Math.floor(this.rows / 2);
    this.snake = [
      { x: 5, y: midY },
      { x: 4, y: midY },
      { x: 3, y: midY },
    ];
    this.placeFood();
  }

  private placeFood() {
    const free: Cell[] = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    if (free.length === 0) {
      this.finished = true;
      this.won = true;
      return;
    }
    this.food = free[Math.floor(Math.random() * free.length)];
  }

  update(input: InputHandler, dt: number) {
    const push = (d: Dir) => {
      const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
      if (d !== last && d !== OPPOSITE[last] && this.queue.length < 3) this.queue.push(d);
    };
    if (input.isJustPressed('up')) push('up');
    if (input.isJustPressed('down')) push('down');
    if (input.isJustPressed('left')) push('left');
    if (input.isJustPressed('right')) push('right');

    this.acc += dt;
    if (this.acc < this.tick) return;
    this.acc -= this.tick;

    if (this.queue.length) this.dir = this.queue.shift()!;

    const head = this.snake[0];
    const next = { x: head.x + DIRS[this.dir].x, y: head.y + DIRS[this.dir].y };

    if (next.x < 0 || next.y < 0 || next.x >= this.cols || next.y >= this.rows) {
      this.die();
      return;
    }
    if (this.snake.some((s) => s.x === next.x && s.y === next.y)) {
      this.die();
      return;
    }

    this.snake.unshift(next);
    if (next.x === this.food.x && next.y === this.food.y) {
      this.score += 10;
      this.eaten++;
      this.tick = Math.max(0.075, 0.14 - this.eaten * 0.002);
      soundManager.playTone(760, 'square', 0.04);
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }

  private die() {
    this.finished = true;
    this.won = false;
    soundManager.playBoom();
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    ctx.fillStyle = '#04120a';
    ctx.fillRect(0, 0, W, H);

    const ts = 14;
    const ox = 41;
    const oy = 31;

    ctx.fillStyle = '#0a2416';
    ctx.fillRect(ox - 3, oy - 3, this.cols * ts + 6, this.rows * ts + 6);
    ctx.strokeStyle = 'rgba(105,240,174,0.12)';
    for (let x = 0; x <= this.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * ts, oy);
      ctx.lineTo(ox + x * ts, oy + this.rows * ts);
      ctx.stroke();
    }
    for (let y = 0; y <= this.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + y * ts);
      ctx.lineTo(ox + this.cols * ts, oy + y * ts);
      ctx.stroke();
    }

    ctx.fillStyle = '#ff5252';
    const pulse = 5 + Math.sin(time * 8) * 1.2;
    ctx.beginPath();
    ctx.arc(ox + this.food.x * ts + ts / 2, oy + this.food.y * ts + ts / 2, pulse, 0, Math.PI * 2);
    ctx.fill();

    for (let i = this.snake.length - 1; i >= 0; i--) {
      const s = this.snake[i];
      const shade = i === 0 ? '#b9f6ca' : i % 2 === 0 ? '#00c853' : '#00e676';
      ctx.fillStyle = shade;
      ctx.fillRect(ox + s.x * ts + 1, oy + s.y * ts + 1, ts - 2, ts - 2);
      if (i === 0) {
        ctx.fillStyle = '#04120a';
        ctx.fillRect(ox + s.x * ts + 4, oy + s.y * ts + 4, 2, 2);
        ctx.fillRect(ox + s.x * ts + 9, oy + s.y * ts + 4, 2, 2);
      }
    }

    drawHeader(ctx, 'SNAKE ROUTE 1', this.score, '#69f0ae', `${this.snake.length} LONG`);
  }
}

// =============================================================
// BREAKOUT
// =============================================================

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  hp: number;
}

class BreakoutGame implements ArcadeGame {
  score = 0;
  finished = false;
  won = false;

  private paddleX = W / 2;
  private paddleW = 48;
  private ballX = W / 2;
  private ballY = H - 32;
  private vx = 0;
  private vy = 0;
  private attached = true;
  private bricks: Brick[] = [];
  private lives = 3;
  private speed = 175;

  constructor() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        this.bricks.push({
          x: 10 + c * 38,
          y: 42 + r * 13,
          w: 34,
          h: 9,
          alive: true,
          hp: 1,
        });
      }
    }
  }

  private resetBall() {
    this.attached = true;
    this.ballX = this.paddleX;
    this.ballY = H - 34;
    this.vx = 0;
    this.vy = 0;
  }

  update(input: InputHandler, dt: number) {
    if (input.isDown('left')) this.paddleX -= 240 * dt;
    if (input.isDown('right')) this.paddleX += 240 * dt;
    this.paddleX = clamp(this.paddleX, this.paddleW / 2, W - this.paddleW / 2);

    if (this.attached) {
      this.ballX = this.paddleX;
      this.ballY = H - 34;
      if (input.isJustPressed('a')) {
        this.attached = false;
        const angle = rand(-2.4, -0.75);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        soundManager.playTone(660, 'square', 0.05);
      }
      return;
    }

    this.ballX += this.vx * dt;
    this.ballY += this.vy * dt;

    if (this.ballX < 4) {
      this.ballX = 4;
      this.vx = Math.abs(this.vx);
    } else if (this.ballX > W - 4) {
      this.ballX = W - 4;
      this.vx = -Math.abs(this.vx);
    }
    if (this.ballY < 24) {
      this.ballY = 24;
      this.vy = Math.abs(this.vy);
    }

    if (
      this.vy > 0 &&
      this.ballY + 3 >= H - 36 &&
      this.ballY - 3 <= H - 30 &&
      Math.abs(this.ballX - this.paddleX) <= this.paddleW / 2 + 3
    ) {
      const offset = (this.ballX - this.paddleX) / (this.paddleW / 2);
      this.vx = offset * 180;
      this.vy = -Math.abs(this.vy);
      const mag = Math.hypot(this.vx, this.vy);
      this.vx = (this.vx / mag) * this.speed;
      this.vy = (this.vy / mag) * this.speed;
      soundManager.playTone(500, 'square', 0.04);
    }

    for (const b of this.bricks) {
      if (!b.alive) continue;
      if (
        this.ballX + 3 > b.x &&
        this.ballX - 3 < b.x + b.w &&
        this.ballY + 3 > b.y &&
        this.ballY - 3 < b.y + b.h
      ) {
        b.alive = false;
        this.score += 10;
        this.vy = -this.vy;
        this.ballY += this.vy > 0 ? 3 : -3;
        soundManager.playTone(320, 'square', 0.05, undefined, 220);
        if (this.bricks.every((x) => !x.alive)) {
          this.finished = true;
          this.won = true;
        }
        break;
      }
    }

    if (this.ballY > H + 6) {
      this.lives--;
      soundManager.playHit();
      if (this.lives <= 0) {
        this.finished = true;
        this.won = false;
      } else {
        this.resetBall();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0b0410';
    ctx.fillRect(0, 0, W, H);

    const colors = ['#ff5252', '#ff4081', '#7c4dff', '#00e5ff'];
    for (const b of this.bricks) {
      if (!b.alive) continue;
      const row = Math.round((b.y - 42) / 13);
      ctx.fillStyle = colors[clamp(row, 0, 3)];
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 2);
    }

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(this.paddleX - this.paddleW / 2, H - 30, this.paddleW, 7);
    ctx.fillStyle = 'rgba(0,229,255,0.25)';
    ctx.fillRect(this.paddleX - this.paddleW / 2 + 4, H - 23, this.paddleW - 8, 3);

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    drawLives(ctx, this.lives, 10, H - 10, '#ff4081');
    drawHeader(ctx, 'BRICK BREAKER', this.score, '#ff5252', this.attached ? 'PRESS Z TO LAUNCH' : '');
  }
}

// =============================================================
// ARCADE FRONT-END
// =============================================================

type ArcadeEntry = { kind: 'game'; meta: ArcadeGameMeta } | { kind: 'teleport' } | { kind: 'exit' };

const EXTRA_ENTRIES: ArcadeEntry[] = [{ kind: 'teleport' }, { kind: 'exit' }];

function createGame(id: ArcadeGameId): ArcadeGame {
  switch (id) {
    case 'pong':
      return new PongGame();
    case 'flappy':
      return new FlappyGame();
    case 'invaders':
      return new InvadersGame();
    case 'pacman':
      return new PacmanGame();
    case 'snake':
      return new SnakeGame();
    case 'breakout':
      return new BreakoutGame();
  }
}

type ArcadeState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export class ArcadeSystem {
  public onClose?: () => void;
  public onTeleport?: () => void;

  private entries: ArcadeEntry[] = [
    ...ARCADE_GAMES.map((meta): ArcadeEntry => ({ kind: 'game', meta })),
    ...EXTRA_ENTRIES,
  ];
  private cursor = 0;
  private state: ArcadeState = 'MENU';
  private game: ArcadeGame | null = null;
  private gameId: ArcadeGameId | null = null;
  private time = 0;
  private rewarded = false;
  private lastPoints = 0;
  private lastCoins = 0;
  private lastGems = 0;
  private lastBest = false;

  constructor(private player: PlayerData) {}

  public startDirect(id: ArcadeGameId) {
    this.startGame(id);
  }

  private startGame(id: ArcadeGameId) {
    this.gameId = id;
    this.game = createGame(id);
    this.rewarded = false;
    this.lastPoints = 0;
    this.lastCoins = 0;
    this.lastGems = 0;
    this.lastBest = false;
    this.state = 'PLAYING';
    soundManager.playConfirm();
  }

  private finalizeRun() {
    if (!this.game || !this.gameId || this.rewarded) return;
    this.rewarded = true;

    const points = Math.max(0, Math.floor(this.game.score));
    this.lastPoints = points;

    const highs = this.player.arcadeHighScores ?? {};
    const prev = highs[this.gameId] ?? 0;
    if (points > prev) {
      highs[this.gameId] = points;
      this.lastBest = true;
    }
    this.player.arcadeHighScores = highs;

    this.lastCoins = Math.min(250, Math.floor(points / 2));
    this.lastGems =
      points >= 400 ? Math.min(3, 1 + Math.floor((points - 400) / 600)) : 0;

    this.player.money += this.lastCoins;
    if (this.lastGems > 0) this.player.gems = (this.player.gems ?? 0) + this.lastGems;

    this.state = 'GAMEOVER';
    if (this.game.won) soundManager.playLevelUp();
    else soundManager.playBoom();
  }

  update(input: InputHandler, deltaMs: number) {
    const seconds = deltaMs / 1000;
    this.time += seconds;

    switch (this.state) {
      case 'MENU':
        this.updateMenu(input);
        break;
      case 'PLAYING':
        if (input.isJustPressed('start')) {
          this.state = 'PAUSED';
          soundManager.playSelect();
          break;
        }
        if (input.isJustPressed('b')) {
          this.finalizeRun();
          break;
        }
        this.game?.update(input, seconds);
        if (this.game?.finished) this.finalizeRun();
        break;
      case 'PAUSED':
        if (input.isJustPressed('start') || input.isJustPressed('a')) {
          this.state = 'PLAYING';
          soundManager.playSelect();
        } else if (input.isJustPressed('b')) {
          this.finalizeRun();
        }
        break;
      case 'GAMEOVER':
        if (input.isJustPressed('a') && this.gameId) {
          this.startGame(this.gameId);
        } else if (input.isJustPressed('b') || input.isJustPressed('start')) {
          this.state = 'MENU';
          this.game = null;
          this.gameId = null;
          soundManager.playCancel();
        }
        break;
    }
  }

  private updateMenu(input: InputHandler) {
    if (input.isJustPressed('up')) {
      this.cursor = (this.cursor - 1 + this.entries.length) % this.entries.length;
      soundManager.playSelect();
    } else if (input.isJustPressed('down')) {
      this.cursor = (this.cursor + 1) % this.entries.length;
      soundManager.playSelect();
    }

    if (input.isJustPressed('b') || input.isJustPressed('start')) {
      soundManager.playCancel();
      this.onClose?.();
      return;
    }

    if (input.isJustPressed('a')) {
      const entry = this.entries[this.cursor];
      if (entry.kind === 'game') {
        this.startGame(entry.meta.id);
      } else if (entry.kind === 'teleport') {
        soundManager.playConfirm();
        this.onTeleport?.();
      } else {
        soundManager.playCancel();
        this.onClose?.();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.state === 'MENU') {
      this.drawMenu(ctx);
      return;
    }

    this.game?.draw(ctx, this.time);

    if (this.state === 'PLAYING') {
      const meta = ARCADE_GAMES.find((g) => g.id === this.gameId);
      ctx.fillStyle = 'rgba(2,4,10,0.92)';
      ctx.fillRect(0, H - 15, W, 15);
      ctx.fillStyle = '#8de9ff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(meta?.hint ?? '', 6, H - 4);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff8fb3';
      ctx.fillText('START PAUSE · X QUIT', W - 6, H - 4);
    }

    if (this.state === 'PAUSED') {
      this.drawOverlay(ctx, 'PAUSED', '#00e5ff', ['START / Z  RESUME', 'X  END RUN']);
    }

    if (this.state === 'GAMEOVER' && this.game) {
      const won = this.game.won;
      const lines = [
        `SCORE ${this.lastPoints}`,
        `BEST  ${this.player.arcadeHighScores?.[this.gameId ?? 'pong'] ?? 0}`,
        `REWARD +$${this.lastCoins}${this.lastGems > 0 ? `  +${this.lastGems} GEM` : ''}`,
        this.lastBest ? 'NEW HIGH SCORE!' : '',
      ].filter(Boolean);
      this.drawOverlay(ctx, won ? 'YOU WIN!' : 'GAME OVER', won ? '#69f0ae' : '#ff5252', lines, [
        'Z  PLAY AGAIN',
        'X  ARCADE MENU',
      ]);
    }
  }

  private drawOverlay(
    ctx: CanvasRenderingContext2D,
    title: string,
    color: string,
    lines: string[],
    footer: string[] = []
  ) {
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, W, H);

    const boxW = 210;
    const boxH = 118;
    const bx = (W - boxW) / 2;
    const by = (H - boxH) / 2;
    ctx.fillStyle = 'rgba(6,10,22,0.96)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 4.5, by + 4.5, boxW - 9, boxH - 9);

    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(title, W / 2, by + 24);

    ctx.font = '9px monospace';
    let y = by + 44;
    for (const line of lines) {
      const isBest = line.includes('BEST') || line.includes('HIGH');
      ctx.fillStyle = isBest ? '#ffd54f' : '#e8f6ff';
      ctx.fillText(line, W / 2, y);
      y += 15;
    }

    ctx.fillStyle = '#8de9ff';
    ctx.font = '7px monospace';
    let fy = by + boxH - 22;
    for (const line of footer) {
      ctx.fillText(line, W / 2, fy);
      fy += 10;
    }
  }

  private drawMenu(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050817');
    bg.addColorStop(0.55, '#0c0a26');
    bg.addColorStop(1, '#160a20');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(0, y, W, 1);
    }

    for (let i = 0; i < 22; i++) {
      const x = (i * 47 + 13) % W;
      const y = (i * 29 + Math.floor(this.time * 12) % H) % H;
      const twinkle = 0.25 + 0.25 * Math.sin(this.time * 3 + i);
      ctx.fillStyle = `rgba(140,210,255,${twinkle})`;
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4081';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PIXEL ARCADE', W / 2 + 1, 27);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('PIXEL ARCADE', W / 2, 26);
    ctx.fillStyle = 'rgba(232,246,255,0.65)';
    ctx.font = '7px monospace';
    ctx.fillText('KANTO GAME CORNER · INSERT COURAGE', W / 2, 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`$${this.player.money}`, W - 10, 12);
    ctx.fillStyle = '#80deea';
    ctx.fillText(`${this.player.gems ?? 0} GEM`, W - 10, 20);

    const rowH = 20;
    const startY = 46;
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const selected = i === this.cursor;
      const y = startY + i * rowH;
      const color =
        entry.kind === 'game'
          ? entry.meta.color
          : entry.kind === 'teleport'
            ? '#00e5ff'
            : '#ff8fb3';

      if (selected) {
        ctx.fillStyle = color;
        ctx.fillRect(14, y, W - 28, 17);
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(16, y + 2, W - 32, 13);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        ctx.fillRect(14, y, W - 28, 17);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeRect(14.5, y + 0.5, W - 29, 16);
      }

      ctx.textAlign = 'left';
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = selected ? color : 'rgba(232,246,255,0.82)';
      const icon = entry.kind === 'game' ? entry.meta.icon : entry.kind === 'teleport' ? '🌀' : '🚪';
      const label =
        entry.kind === 'game'
          ? entry.meta.title
          : entry.kind === 'teleport'
            ? 'TELEPORTER · KANTO WARP GRID'
            : 'EXIT ARCADE';
      ctx.fillText(icon, 20, y + 12);
      ctx.fillText(label, 36, y + 12);

      if (entry.kind === 'game') {
        const best = this.player.arcadeHighScores?.[entry.meta.id] ?? 0;
        if (best > 0) {
          ctx.textAlign = 'right';
          ctx.font = '7px monospace';
          ctx.fillStyle = selected ? 'rgba(0,0,0,0.7)' : 'rgba(140,210,255,0.7)';
          ctx.fillText(`BEST ${best}`, W - 20, y + 12);
        }
      }
    }

    ctx.fillStyle = 'rgba(2,4,10,0.92)';
    ctx.fillRect(0, H - 22, W, 22);
    ctx.textAlign = 'center';
    ctx.font = '8px monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('UP/DOWN SELECT · Z PLAY · X EXIT', W / 2, H - 12);
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('HIGH SCORES PAY OUT COINS & GEMS', W / 2, H - 4);
  }
}
