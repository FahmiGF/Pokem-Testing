// Interactive Pokémon Cooking & Culinary Minigame

import { soundManager } from '../audio/sound';
import type { PlayerData } from '../types';
import type { InputHandler } from './input';

export interface CookingRecipe {
  id: string;
  name: string;
  icon: string;
  desc: string;
  effectDesc: string;
  ingredients: { name: string; count: number; itemId?: string }[];
  rewardExp: number;
  rewardGems: number;
}

export class CookingGame {
  public player: PlayerData;
  public onClose?: (rewardExp: number, rewardGems: number) => void;

  public recipes: CookingRecipe[] = [
    {
      id: 'berry_tart',
      name: 'Sweet Berry Tart',
      icon: '🥧',
      desc: 'Light, fluffy pastry filled with farm-harvested Berries.',
      effectDesc: 'Fully restores lead Pokémon HP and cures status ailments.',
      ingredients: [{ name: 'Sweet Berries', count: 1, itemId: 'seed_berry' }],
      rewardExp: 150,
      rewardGems: 3,
    },
    {
      id: 'fish_ramen',
      name: 'Lake Fish Ramen',
      icon: '🍜',
      desc: 'Steaming broth with savory fresh fish and noodle garnish.',
      effectDesc: 'Heals whole team for 50 HP and permanently boosts lead ATK +2.',
      ingredients: [{ name: 'Lake Fish', count: 1, itemId: 'lake_fish' }],
      rewardExp: 220,
      rewardGems: 5,
    },
    {
      id: 'volcano_curry',
      name: 'Spicy Volcano Curry',
      icon: '🍛',
      desc: 'Fiery and bold curry cooked with red tomatoes and fiery seasoning.',
      effectDesc: 'Grants entire party +400 EXP and boosts Speed by +3.',
      ingredients: [{ name: 'Farm Tomato', count: 1, itemId: 'seed_tomato' }],
      rewardExp: 350,
      rewardGems: 8,
    },
    {
      id: 'prismatic_feast',
      name: 'Prismatic Gourmet Banquet',
      icon: '🍱',
      desc: 'The pinnacle of culinary arts infused with golden fruit & gems.',
      effectDesc: 'Revives all fainted Pokémon to MAX HP and awards +20 Gems!',
      ingredients: [
        { name: 'Golden Fruit', count: 1, itemId: 'seed_gold' },
        { name: 'Prismatic Gem', count: 1, itemId: 'prismatic_gem' },
      ],
      rewardExp: 800,
      rewardGems: 20,
    },
  ];

  public selectedRecipeIndex: number = 0;
  public state: 'SELECT_RECIPE' | 'CHOPPING' | 'HEAT_CONTROL' | 'PLATING' | 'RESULT' = 'SELECT_RECIPE';

  // Minigame Variables
  public stepTimer: number = 0;
  // Step 1: Chopping
  public chopsNeeded: number = 8;
  public chopsDone: number = 0;
  public knifeY: number = 0;

  // Step 2: Heat Control (Flame temperature gauge)
  public heatGauge: number = 0.5; // 0 to 1
  public targetHeatMin: number = 0.45;
  public targetHeatMax: number = 0.75;
  public heatSuccessTimer: number = 0;
  public heatRequiredTime: number = 3.5;

  // Result stars
  public stars: number = 3;
  public totalRewardExp: number = 0;
  public totalRewardGems: number = 0;

  constructor(player: PlayerData) {
    this.player = player;
  }

  public update(input: InputHandler, deltaMs: number) {
    const dt = deltaMs / 1000;
    this.stepTimer += dt;

    switch (this.state) {
      case 'SELECT_RECIPE':
        if (input.isJustPressed('up')) {
          soundManager.playSelect();
          this.selectedRecipeIndex = (this.selectedRecipeIndex - 1 + this.recipes.length) % this.recipes.length;
        } else if (input.isJustPressed('down')) {
          soundManager.playSelect();
          this.selectedRecipeIndex = (this.selectedRecipeIndex + 1) % this.recipes.length;
        }

        if (input.isJustPressed('a')) {
          soundManager.playConfirm();
          this.startCooking();
        }

        if (input.isJustPressed('b') || input.isJustPressed('start')) {
          soundManager.playCancel();
          if (this.onClose) this.onClose(0, 0);
        }
        break;

      case 'CHOPPING':
        // Tap A or Down to chop
        if (input.isJustPressed('a') || input.isJustPressed('down') || input.isJustPressed('b')) {
          this.chopsDone++;
          this.knifeY = 8;
          soundManager.playSwordHit();
          if (this.chopsDone >= this.chopsNeeded) {
            this.state = 'HEAT_CONTROL';
            this.stepTimer = 0;
            this.heatGauge = 0.5;
            this.heatSuccessTimer = 0;
            soundManager.playConfirm();
          }
        }
        if (this.knifeY > 0) {
          this.knifeY = Math.max(0, this.knifeY - dt * 40);
        }
        break;

      case 'HEAT_CONTROL':
        // Flame cools down naturally
        this.heatGauge -= dt * 0.28;

        // Press A / Up to fuel the fire
        if (input.isDown('a') || input.isDown('up')) {
          this.heatGauge += dt * 0.65;
        }

        this.heatGauge = Math.max(0, Math.min(1, this.heatGauge));

        // Check inside ideal cooking temperature
        if (this.heatGauge >= this.targetHeatMin && this.heatGauge <= this.targetHeatMax) {
          this.heatSuccessTimer += dt;
        }

        if (this.stepTimer >= 6.0) {
          // Finish heating stage
          const ratio = this.heatSuccessTimer / this.heatRequiredTime;
          this.stars = ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : 1;
          this.state = 'RESULT';
          soundManager.playVictorySouls();
          this.applyRecipeOutcome();
        }
        break;

      case 'RESULT':
        if (input.isJustPressed('a') || input.isJustPressed('b') || input.isJustPressed('start')) {
          soundManager.playConfirm();
          this.state = 'SELECT_RECIPE';
        }
        break;
    }
  }

  private startCooking() {
    this.state = 'CHOPPING';
    this.stepTimer = 0;
    this.chopsDone = 0;
    this.knifeY = 0;
  }

  private applyRecipeOutcome() {
    const rec = this.recipes[this.selectedRecipeIndex];
    const multiplier = this.stars === 3 ? 1.5 : this.stars === 2 ? 1.0 : 0.6;
    const exp = Math.floor(rec.rewardExp * multiplier);
    const gems = Math.floor(rec.rewardGems * multiplier);

    this.totalRewardExp += exp;
    this.totalRewardGems += gems;
    this.player.expTokens = (this.player.expTokens || 0) + exp;
    this.player.gems = (this.player.gems || 0) + gems;
    this.player.dishesCooked = (this.player.dishesCooked || 0) + 1;

    // Apply Food Buff to Pokémon
    if (this.player.party.length > 0) {
      const lead = this.player.party[0];
      if (rec.id === 'berry_tart') {
        lead.currentHp = lead.maxHp;
      } else if (rec.id === 'fish_ramen') {
        this.player.party.forEach((p) => (p.currentHp = Math.min(p.maxHp, p.currentHp + 50)));
        lead.stats.attack += 2;
      } else if (rec.id === 'volcano_curry') {
        this.player.party.forEach((p) => {
          p.currentExp += 400;
          if (p.currentExp >= p.nextLevelExp) {
            p.level++;
            p.currentExp = 0;
            p.nextLevelExp = Math.floor(p.nextLevelExp * 1.3);
          }
        });
        lead.stats.speed += 3;
      } else if (rec.id === 'prismatic_feast') {
        this.player.party.forEach((p) => {
          p.currentHp = p.maxHp;
          p.moves.forEach((m) => (m.currentPp = m.move.pp));
        });
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    // Kitchen Wood & Hearth Background
    const wallH = Math.floor(ch * 0.42);
    ctx.fillStyle = '#261c14';
    ctx.fillRect(0, 0, cw, wallH);

    // Kitchen Countertop
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, wallH, cw, ch - wallH);

    // Marble Cutting Board in center
    const boardW = 200;
    const boardH = 110;
    const boardX = (cw - boardW) / 2;
    const boardY = wallH + 12;

    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, 6);
    ctx.fill();
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#162238';
    ctx.fillRect(6, 6, cw - 12, 24);
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, cw - 12, 24);

    ctx.fillStyle = '#ff9800';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🍳 POKÉMON GOURMET KITCHEN', 14, 21);

    ctx.textAlign = 'right';
    const gems = this.player.gems || 0;
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`💎 ${gems} GEMS | ✦ ${this.player.expTokens || 0} EXP`, cw - 14, 21);

    // --- STAGE DRAWING ---
    switch (this.state) {
      case 'SELECT_RECIPE':
        this.drawRecipeMenu(ctx, cw, ch);
        break;

      case 'CHOPPING':
        this.drawChoppingStage(ctx, cw, ch, boardX, boardY, boardW, boardH);
        break;

      case 'HEAT_CONTROL':
        this.drawHeatStage(ctx, cw, ch);
        break;

      case 'RESULT':
        this.drawResultCard(ctx, cw, ch);
        break;
    }
  }

  private drawRecipeMenu(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const listX = 12;
    const listY = 36;
    const listW = 155;
    const listH = ch - 48;

    ctx.fillStyle = '#101726';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = '#283c5a';
    ctx.lineWidth = 1;
    ctx.strokeRect(listX, listY, listW, listH);

    this.recipes.forEach((rec, idx) => {
      const isSel = idx === this.selectedRecipeIndex;
      const rowY = listY + 6 + idx * 36;

      if (isSel) {
        ctx.fillStyle = '#1e3860';
        ctx.fillRect(listX + 2, rowY - 2, listW - 4, 32);
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX + 2, rowY - 2, listW - 4, 32);

        ctx.fillStyle = '#ffea00';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('▶', listX + 4, rowY + 16);
      }

      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(rec.icon, listX + 16, rowY + 18);

      ctx.fillStyle = isSel ? '#ffffff' : '#b0bec5';
      ctx.font = 'bold 8px monospace';
      const sName = rec.name.length > 13 ? rec.name.slice(0, 12) + '…' : rec.name;
      ctx.fillText(sName, listX + 38, rowY + 12);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '7px monospace';
      ctx.fillText(`+💎${rec.rewardGems} GEMS`, listX + 38, rowY + 24);
    });

    // Right Details Box
    const dX = listX + listW + 8;
    const dY = listY;
    const dW = cw - dX - 12;
    const dH = listH;

    const sel = this.recipes[this.selectedRecipeIndex];
    ctx.fillStyle = '#101726';
    ctx.fillRect(dX, dY, dW, dH);
    ctx.strokeStyle = '#283c5a';
    ctx.lineWidth = 1;
    ctx.strokeRect(dX, dY, dW, dH);

    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sel.icon, dX + dW / 2, dY + 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(sel.name.toUpperCase(), dX + dW / 2, dY + 48);

    ctx.fillStyle = '#b0bec5';
    ctx.font = '7px monospace';
    this.drawWrapped(ctx, sel.desc, dX + 8, dY + 64, dW - 16, 11);

    ctx.fillStyle = '#76ff03';
    ctx.font = 'bold 7px monospace';
    this.drawWrapped(ctx, `Effect: ${sel.effectDesc}`, dX + 8, dY + 98, dW - 16, 11);

    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText('▶ [A] COOK DISH ◀', dX + dW / 2, dY + dH - 12);
  }

  private drawChoppingStage(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const rec = this.recipes[this.selectedRecipeIndex];

    ctx.fillStyle = '#111';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`🔪 CHOPPING: TAP [A] RAPIDLY! (${this.chopsDone}/${this.chopsNeeded})`, cw / 2, by - 8);

    // Ingredient Slices on board
    const ingX = bx + bw / 2;
    const ingY = by + bh / 2;

    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(rec.icon, ingX - 10, ingY + 12);

    // Knife Blade
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(ingX + 20, ingY - 25 + this.knifeY, 8, 38);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(ingX + 22, ingY - 45 + this.knifeY, 4, 20);

    // Progress Bar
    const progW = 160;
    const fill = (this.chopsDone / this.chopsNeeded) * progW;
    ctx.fillStyle = '#263238';
    ctx.fillRect((cw - progW) / 2, ch - 26, progW, 10);
    ctx.fillStyle = '#00e676';
    ctx.fillRect((cw - progW) / 2, ch - 26, fill, 10);
  }

  private drawHeatStage(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 STIR & HEAT: HOLD [A] TO HEAT, RELEASE TO COOL!', cw / 2, 45);

    // Wok / Frying Pan in center
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(cw / 2, ch / 2 - 8, 70, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Sizzling Food in Pan
    const rec = this.recipes[this.selectedRecipeIndex];
    ctx.font = '28px monospace';
    ctx.fillText(rec.icon, cw / 2 - 12, ch / 2 - 2);

    // Flame underneath pan
    if (this.heatGauge > 0.1) {
      const flameH = 15 + this.heatGauge * 25;
      ctx.fillStyle = this.heatGauge > 0.8 ? '#ff1744' : '#ff9100';
      ctx.beginPath();
      ctx.ellipse(cw / 2, ch / 2 + 34, 45 * this.heatGauge, flameH * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heat Gauge Bar (Bottom)
    const barW = 180;
    const barH = 16;
    const barX = (cw - barW) / 2;
    const barY = ch - 36;

    ctx.fillStyle = '#101726';
    ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 4, barY - 4, barW + 8, barH + 8);

    // Ideal Zone (Green)
    const minX = barX + barW * this.targetHeatMin;
    const zoneW = barW * (this.targetHeatMax - this.targetHeatMin);
    ctx.fillStyle = 'rgba(76, 175, 80, 0.45)';
    ctx.fillRect(minX, barY, zoneW, barH);
    ctx.strokeStyle = '#76ff03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(minX, barY, zoneW, barH);

    // Current Heat Needle
    const needleX = barX + barW * this.heatGauge;
    ctx.fillStyle = this.heatGauge >= this.targetHeatMin && this.heatGauge <= this.targetHeatMax ? '#00e676' : '#ff3d00';
    ctx.fillRect(needleX - 3, barY - 4, 6, barH + 8);
  }

  private drawResultCard(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const rec = this.recipes[this.selectedRecipeIndex];
    const cardW = 210;
    const cardH = 145;
    const cardX = (cw - cardW) / 2;
    const cardY = (ch - cardH) / 2;

    ctx.fillStyle = 'rgba(12, 18, 30, 0.96)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('🍽️ DISH COMPLETED! 🍽️', cw / 2, cardY + 22);

    // Star Rating
    const starStr = '⭐'.repeat(this.stars);
    ctx.font = '14px monospace';
    ctx.fillText(starStr, cw / 2, cardY + 42);

    ctx.font = '24px monospace';
    ctx.fillText(rec.icon, cw / 2, cardY + 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(rec.name.toUpperCase(), cw / 2, cardY + 86);

    const mult = this.stars === 3 ? 1.5 : this.stars === 2 ? 1.0 : 0.6;
    const exp = Math.floor(rec.rewardExp * mult);
    const gems = Math.floor(rec.rewardGems * mult);

    ctx.fillStyle = '#00e5ff';
    ctx.font = '8px monospace';
    ctx.fillText(`+${exp} EXP TOKENS  •  +💎 ${gems} GEMS`, cw / 2, cardY + 106);

    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('▶ PRESS [A] TO CONTINUE ◀', cw / 2, cardY + 130);
  }

  private drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxW && i > 0) {
        ctx.fillText(line, x, curY);
        line = words[i] + ' ';
        curY += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, curY);
  }
}
