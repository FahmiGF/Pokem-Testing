// Interactive Pokémon Fishing Minigame

import { soundManager } from '../audio/sound';
import { createActivePokemon } from '../data/pokemon';
import type { PlayerData } from '../types';
import type { InputHandler } from './input';

export interface CatchResult {
  type: 'pokemon' | 'ingredient' | 'treasure';
  name: string;
  icon: string;
  pokemonId?: number;
  pokemonLevel?: number;
  itemReward?: { id: string; name: string; count: number };
  expReward: number;
  moneyReward: number;
  gemsReward: number;
  lore: string;
}

export class FishingGame {
  public player: PlayerData;
  public onClose?: (rewardExp: number, rewardGems: number) => void;

  // Game state
  public state: 'CAST_POWER' | 'WAITING_BITE' | 'BITE_ALERT' | 'REELING' | 'CAUGHT' | 'LOST' = 'CAST_POWER';

  // Casting power meter (0 to 1)
  public castPower: number = 0;
  public castPowerDir: number = 1;

  // Timers
  public stateTimer: number = 0;
  public biteDelay: number = 0;
  public biteWindow: number = 0.85; // Seconds to press A on bite

  // Reeling Minigame parameters
  public fishProgress: number = 0.35; // 0 to 1 (1 = caught, 0 = lost)
  public lineTension: number = 0.3; // 0 to 1 (too high = snap, too low = fish escapes)
  public fishTargetX: number = 0.5;
  public fishCurrentX: number = 0.5;
  public reelBarX: number = 0.5;
  public reelBarWidth: number = 0.28;
  public fishSpeed: number = 1.2;
  public fishTensionTrend: number = 0;

  // Active catch data
  public activeCatch: CatchResult | null = null;
  public totalRewardExp: number = 0;
  public totalRewardGems: number = 0;

  // Visual effects
  public waterRipples: { x: number; y: number; radius: number; alpha: number }[] = [];
  public bubbles: { x: number; y: number; vy: number; alpha: number }[] = [];

  constructor(player: PlayerData) {
    this.player = player;
    this.resetToCast();
  }

  private resetToCast() {
    this.state = 'CAST_POWER';
    this.castPower = 0;
    this.castPowerDir = 1;
    this.stateTimer = 0;
    this.fishProgress = 0.35;
    this.lineTension = 0.3;
  }

  public update(input: InputHandler, deltaMs: number) {
    const dt = deltaMs / 1000;
    this.stateTimer += dt;

    // Water particles
    if (Math.random() < 0.25) {
      this.waterRipples.push({
        x: 60 + Math.random() * 200,
        y: 110 + Math.random() * 80,
        radius: 2,
        alpha: 0.8,
      });
    }

    for (let i = this.waterRipples.length - 1; i >= 0; i--) {
      const rip = this.waterRipples[i];
      rip.radius += dt * 14;
      rip.alpha -= dt * 0.85;
      if (rip.alpha <= 0) this.waterRipples.splice(i, 1);
    }

    // --- STATE MACHINE ---
    switch (this.state) {
      case 'CAST_POWER':
        // Oscillate cast power bar
        this.castPower += this.castPowerDir * dt * 2.2;
        if (this.castPower >= 1) {
          this.castPower = 1;
          this.castPowerDir = -1;
        } else if (this.castPower <= 0) {
          this.castPower = 0;
          this.castPowerDir = 1;
        }

        if (input.isJustPressed('a') || input.isJustPressed('b')) {
          soundManager.playConfirm();
          this.castLine();
        }
        break;

      case 'WAITING_BITE':
        // Wait for bite timer
        if (this.stateTimer >= this.biteDelay) {
          this.state = 'BITE_ALERT';
          this.stateTimer = 0;
          soundManager.playEncounter();
        }
        break;

      case 'BITE_ALERT':
        // Hook opportunity window!
        if (input.isJustPressed('a') || input.isJustPressed('b')) {
          soundManager.playConfirm();
          this.startReeling();
        } else if (this.stateTimer > this.biteWindow) {
          this.state = 'LOST';
          this.stateTimer = 0;
          soundManager.playBump();
        }
        break;

      case 'REELING':
        this.updateReeling(input, dt);
        break;

      case 'CAUGHT':
      case 'LOST':
        if (input.isJustPressed('a') || input.isJustPressed('b') || input.isJustPressed('start')) {
          soundManager.playConfirm();
          if (this.state === 'CAUGHT') {
            this.claimCatch();
          } else {
            this.resetToCast();
          }
        }
        break;
    }
  }

  private castLine() {
    this.state = 'WAITING_BITE';
    this.stateTimer = 0;
    // Bite delay between 1.5s and 3.5s (faster with high cast power)
    this.biteDelay = 1.6 + (1 - this.castPower) * 2.2;
  }

  private startReeling() {
    this.state = 'REELING';
    this.stateTimer = 0;
    this.fishProgress = 0.4;
    this.lineTension = 0.35;
    this.reelBarX = 0.5;
    this.fishCurrentX = 0.5;
    this.fishTargetX = 0.3 + Math.random() * 0.4;
    this.selectCatch();
  }

  private selectCatch() {
    const roll = Math.random();
    if (roll < 0.28) {
      // Magikarp (Evolution to Gyarados)
      this.activeCatch = {
        type: 'pokemon',
        name: 'Magikarp',
        icon: '🐟',
        pokemonId: 129,
        pokemonLevel: 10 + Math.floor(Math.random() * 8),
        expReward: 120,
        moneyReward: 150,
        gemsReward: 2,
        lore: 'A flopping Magikarp! Raise it to Level 20 to evolve into fierce Gyarados!',
      };
    } else if (roll < 0.48) {
      // Staryu / Water Gem Pokemon
      this.activeCatch = {
        type: 'pokemon',
        name: 'Staryu',
        icon: '⭐',
        pokemonId: 120,
        pokemonLevel: 14 + Math.floor(Math.random() * 6),
        expReward: 180,
        moneyReward: 260,
        gemsReward: 4,
        lore: 'Staryu sparkles like a jewel from the deep blue sea!',
      };
    } else if (roll < 0.62) {
      // Rare Dratini / Dragon
      this.activeCatch = {
        type: 'pokemon',
        name: 'Dratini',
        icon: '🐉',
        pokemonId: 147,
        pokemonLevel: 15 + Math.floor(Math.random() * 5),
        expReward: 300,
        moneyReward: 500,
        gemsReward: 8,
        lore: 'Incredible! A mythical Dratini was pulled from the tranquil waters!',
      };
    } else if (roll < 0.76) {
      // Cooking ingredient: Golden Carp
      this.activeCatch = {
        type: 'ingredient',
        name: 'Fresh Lake Carp',
        icon: '🍣',
        itemReward: { id: 'lake_fish', name: 'Fresh Lake Fish', count: 2 },
        expReward: 100,
        moneyReward: 200,
        gemsReward: 3,
        lore: 'Prime culinary seafood! Perfect for cooking Gourmet Fish Curry.',
      };
    } else if (roll < 0.88) {
      // Rare Sunken Geode (Massive Gems!)
      this.activeCatch = {
        type: 'treasure',
        name: 'Sunken Prismatic Gem',
        icon: '💎',
        itemReward: { id: 'prismatic_gem', name: 'Prismatic Gem', count: 1 },
        expReward: 250,
        moneyReward: 800,
        gemsReward: 15,
        lore: 'A glittering ancient crystal geode! You obtained rare Prismatic Gems!',
      };
    } else {
      // Legendary Lapras / Gyarados
      const isLapras = Math.random() < 0.5;
      this.activeCatch = {
        type: 'pokemon',
        name: isLapras ? 'Lapras' : 'Gyarados',
        icon: isLapras ? '🌊' : '🐉',
        pokemonId: isLapras ? 131 : 130,
        pokemonLevel: 22 + Math.floor(Math.random() * 6),
        expReward: 500,
        moneyReward: 1200,
        gemsReward: 12,
        lore: isLapras
          ? 'Majestic Lapras surfaced to join your party!'
          : 'A giant furious Gyarados was reeled in from the depths!',
      };
    }
  }

  private updateReeling(input: InputHandler, dt: number) {
    // Fish swimming AI
    if (Math.random() < dt * 1.5) {
      this.fishTargetX = 0.15 + Math.random() * 0.7;
      this.fishSpeed = 1.0 + Math.random() * 1.4;
    }

    this.fishCurrentX += (this.fishTargetX - this.fishCurrentX) * this.fishSpeed * dt;

    // Player Reeling: Controls the Reel Bar
    const isReeling = input.isDown('a') || input.isDown('up') || input.isDown('right');
    const isLeft = input.isDown('left');

    if (isReeling) {
      this.reelBarX = Math.min(0.85, this.reelBarX + dt * 0.75);
      this.lineTension = Math.min(1.0, this.lineTension + dt * 0.8);
      soundManager.playDrift();
    } else if (isLeft) {
      this.reelBarX = Math.max(0.15, this.reelBarX - dt * 0.75);
      this.lineTension = Math.max(0.0, this.lineTension - dt * 0.4);
    } else {
      // Tension releases gradually
      this.lineTension = Math.max(0.05, this.lineTension - dt * 0.35);
    }

    // Check if fish is inside reel bar window
    const fishDist = Math.abs(this.fishCurrentX - this.reelBarX);
    const insideBar = fishDist <= this.reelBarWidth / 2;

    if (insideBar) {
      // Progress rises
      this.fishProgress += dt * 0.38;
    } else {
      // Fish pulls away
      this.fishProgress -= dt * 0.22;
    }

    // Tension extremes
    if (this.lineTension >= 0.98) {
      // Line snapped!
      this.state = 'LOST';
      soundManager.playBump();
      return;
    }

    // Win check
    if (this.fishProgress >= 1.0) {
      this.state = 'CAUGHT';
      soundManager.playLapFanfare();
    } else if (this.fishProgress <= 0.0) {
      this.state = 'LOST';
      soundManager.playBump();
    }
  }

  private claimCatch() {
    if (!this.activeCatch) {
      this.resetToCast();
      return;
    }

    const c = this.activeCatch;
    this.totalRewardExp += c.expReward;
    this.totalRewardGems += c.gemsReward;

    this.player.expTokens = (this.player.expTokens || 0) + c.expReward;
    this.player.gems = (this.player.gems || 0) + c.gemsReward;
    this.player.money += c.moneyReward;
    this.player.fishCaught = (this.player.fishCaught || 0) + 1;

    // If item reward
    if (c.itemReward) {
      const existing = this.player.inventory.find((i) => i.id === c.itemReward!.id);
      if (existing) {
        existing.count += c.itemReward.count;
      } else {
        this.player.inventory.push({
          id: c.itemReward.id,
          name: c.itemReward.name,
          count: c.itemReward.count,
          price: 250,
          type: c.type === 'ingredient' ? 'ingredient' : 'gem',
          description: c.lore,
          icon: c.icon,
          category: c.type === 'ingredient' ? 'INGREDIENT' : 'GEM',
        });
      }
    }

    // If Pokémon catch
    if (c.pokemonId && this.player.party.length < 6) {
      const mon = createActivePokemon(c.pokemonId, c.pokemonLevel || 12);
      this.player.party.push(mon);
      if (!this.player.caughtPokemon.includes(mon.species.id)) {
        this.player.caughtPokemon.push(mon.species.id);
      }
      if (!this.player.seenPokemon.includes(mon.species.id)) {
        this.player.seenPokemon.push(mon.species.id);
      }
    }

    this.resetToCast();
  }

  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    // 1. Water Lake Horizon Background
    const skyH = Math.floor(ch * 0.45);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
    skyGrad.addColorStop(0, '#102a45');
    skyGrad.addColorStop(0.7, '#245a80');
    skyGrad.addColorStop(1, '#68b5d0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, skyH);

    // Distant Reed / Mountain Banks
    ctx.fillStyle = '#1c3e2e';
    ctx.beginPath();
    ctx.moveTo(0, skyH);
    for (let x = 0; x <= cw; x += 25) {
      ctx.lineTo(x, skyH - 12 - Math.sin(x * 0.08) * 8);
    }
    ctx.lineTo(cw, skyH);
    ctx.fill();

    // Deep Aquatic Water Gradient
    const waterGrad = ctx.createLinearGradient(0, skyH, 0, ch);
    waterGrad.addColorStop(0, '#1d6f8a');
    waterGrad.addColorStop(0.4, '#124d68');
    waterGrad.addColorStop(1, '#072438');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, skyH, cw, ch - skyH);

    // Water Ripple rings
    this.waterRipples.forEach((rip) => {
      ctx.strokeStyle = `rgba(180, 240, 255, ${rip.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius * 2, rip.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Fishing Dock & Pier on Left
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, skyH - 6, 75, ch - skyH + 6);
    ctx.fillStyle = '#8d6e63';
    for (let y = skyH - 6; y < ch; y += 12) {
      ctx.fillRect(0, y, 73, 10);
    }

    // Fisherman Player on Dock
    this.drawFisherman(ctx, 45, skyH + 35);

    // Fishing Line & Float Bobber
    const bobberX = 160 + (this.castPower * 70);
    const bobberY = skyH + 45;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, skyH + 18);
    ctx.quadraticCurveTo(90, skyH + 2, bobberX, bobberY);
    ctx.stroke();

    // Bobber Ball
    const bobDip = this.state === 'BITE_ALERT' ? Math.sin(Date.now() * 0.03) * 6 : Math.sin(Date.now() * 0.005) * 2;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(bobberX, bobberY + bobDip, 5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bobberX, bobberY + bobDip, 5, 0, Math.PI);
    ctx.fill();

    // Bite Exclamation Mark `!`
    if (this.state === 'BITE_ALERT') {
      ctx.fillStyle = '#ffea00';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', bobberX, bobberY - 14);
    }

    // --- REELING MINIGAME HUD OVERLAY ---
    if (this.state === 'REELING') {
      this.drawReelingHUD(ctx, cw, ch);
    }

    // --- CAST POWER GAUGE ---
    if (this.state === 'CAST_POWER') {
      this.drawCastPowerGauge(ctx, cw, ch);
    }

    // --- TOP BAR HUD (Fish Caught, Currency & Gems) ---
    this.drawTopHUD(ctx, cw);

    // --- DIALOG MODALS FOR CAUGHT / LOST ---
    if (this.state === 'CAUGHT' && this.activeCatch) {
      this.drawCaughtCard(ctx, cw, ch);
    } else if (this.state === 'LOST') {
      this.drawLostCard(ctx, cw, ch);
    }
  }

  private drawFisherman(ctx: CanvasRenderingContext2D, px: number, py: number) {
    ctx.save();
    ctx.translate(px, py);

    // Body
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-6, -18, 12, 14);

    // Head & Straw Fisherman Hat
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(-4, -28, 8, 8);
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(-10, -32, 20, 4);
    ctx.fillRect(-6, -36, 12, 4);

    // Fishing Rod
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(2, -14);
    ctx.lineTo(24, -38);
    ctx.stroke();

    ctx.restore();
  }

  private drawCastPowerGauge(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const barW = 140;
    const barH = 14;
    const barX = (cw - barW) / 2;
    const barY = ch - 38;

    ctx.fillStyle = 'rgba(10, 16, 28, 0.9)';
    ctx.fillRect(barX - 4, barY - 16, barW + 8, barH + 22);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 4, barY - 16, barW + 8, barH + 22);

    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎣 CAST POWER: PRESS [A/Z]', cw / 2, barY - 5);

    // Power fill
    const fillW = barW * this.castPower;
    const pGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    pGrad.addColorStop(0, '#00e676');
    pGrad.addColorStop(0.65, '#ffeb3b');
    pGrad.addColorStop(1, '#ff3d00');
    ctx.fillStyle = pGrad;
    ctx.fillRect(barX, barY, fillW, barH);
  }

  private drawReelingHUD(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const trackW = 180;
    const trackH = 22;
    const trackX = (cw - trackW) / 2;
    const trackY = ch - 54;

    // Main Reel Bar Container
    ctx.fillStyle = 'rgba(10, 16, 28, 0.92)';
    ctx.fillRect(trackX - 6, trackY - 20, trackW + 12, trackH + 34);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(trackX - 6, trackY - 20, trackW + 12, trackH + 34);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('KEEP GREEN REEL BAR ON FISH! [HOLD A]', cw / 2, trackY - 8);

    // Water Track
    ctx.fillStyle = '#092138';
    ctx.fillRect(trackX, trackY, trackW, trackH);

    // Green Catcher Bar
    const catcherW = trackW * this.reelBarWidth;
    const catcherX = trackX + (this.reelBarX * trackW) - catcherW / 2;
    ctx.fillStyle = 'rgba(76, 175, 80, 0.65)';
    ctx.fillRect(catcherX, trackY, catcherW, trackH);
    ctx.strokeStyle = '#76ff03';
    ctx.lineWidth = 2;
    ctx.strokeRect(catcherX, trackY, catcherW, trackH);

    // Fish Icon
    const fishX = trackX + (this.fishCurrentX * trackW);
    ctx.fillStyle = '#ff9100';
    ctx.beginPath();
    ctx.arc(fishX, trackY + trackH / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Catch Progress Bar (Bottom)
    const progW = trackW * this.fishProgress;
    ctx.fillStyle = '#2979ff';
    ctx.fillRect(trackX, trackY + trackH + 4, progW, 5);

    // Line Tension Meter (Right Column)
    const tenH = 65;
    const tenX = cw - 30;
    const tenY = trackY - 35;
    ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
    ctx.fillRect(tenX - 2, tenY - 12, 16, tenH + 16);

    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LINE', tenX + 6, tenY - 4);

    const fillH = tenH * this.lineTension;
    ctx.fillStyle = this.lineTension > 0.8 ? '#ff1744' : '#ffea00';
    ctx.fillRect(tenX + 2, tenY + tenH - fillH, 8, fillH);
  }

  private drawTopHUD(ctx: CanvasRenderingContext2D, cw: number) {
    ctx.fillStyle = 'rgba(8, 14, 24, 0.88)';
    ctx.fillRect(6, 6, cw - 12, 24);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, cw - 12, 24);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🎣 LAKE CELESTIA FISHING', 12, 21);

    ctx.textAlign = 'right';
    const gems = this.player.gems || 0;
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`💎 ${gems} GEMS | $${this.player.money}`, cw - 12, 21);
  }

  private drawCaughtCard(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const c = this.activeCatch!;
    const cardW = 210;
    const cardH = 140;
    const cardX = (cw - cardW) / 2;
    const cardY = (ch - cardH) / 2;

    ctx.fillStyle = 'rgba(10, 18, 30, 0.96)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('✨ YOU HOOKED SOMETHING! ✨', cw / 2, cardY + 22);

    // Big Icon
    ctx.font = '26px monospace';
    ctx.fillText(c.icon, cw / 2, cardY + 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(c.name.toUpperCase(), cw / 2, cardY + 72);

    // Rewards Pill
    ctx.fillStyle = '#00e5ff';
    ctx.font = '8px monospace';
    ctx.fillText(`+${c.expReward} EXP  •  +$${c.moneyReward}  •  +💎 ${c.gemsReward} GEMS`, cw / 2, cardY + 92);

    ctx.fillStyle = '#b0bec5';
    ctx.font = '7px monospace';
    ctx.fillText(c.lore.slice(0, 36), cw / 2, cardY + 110);

    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('▶ PRESS [A] TO CLAIM ◀', cw / 2, cardY + 128);
  }

  private drawLostCard(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const cardW = 190;
    const cardH = 80;
    const cardX = (cw - cardW) / 2;
    const cardY = (ch - cardH) / 2;

    ctx.fillStyle = 'rgba(25, 12, 16, 0.95)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e53935';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('IT GOT AWAY...', cw / 2, cardY + 28);

    ctx.fillStyle = '#b0bec5';
    ctx.font = '8px monospace';
    ctx.fillText('The line went slack or snapped!', cw / 2, cardY + 46);

    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('▶ PRESS [A] TO TRY AGAIN ◀', cw / 2, cardY + 66);
  }
}
