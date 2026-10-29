import { soundManager } from '../audio/sound';
import type { PlayerData } from '../types';
import type { InputHandler } from './input';

export interface ExpShopItem {
  id: string;
  name: string;
  cost: number;
  gemCost?: number;
  category: 'LEVEL' | 'STATS' | 'ITEMS' | 'KART' | 'SOULS' | 'GEMS';
  icon: string;
  description: string;
  effect: (player: PlayerData) => string;
}

export class ExpShopSystem {
  public player: PlayerData;
  public cursor: number = 0;
  public message: string = 'Welcome to the EXP Sanctuary. Spend your hard-earned EXP tokens!';
  public messageTimer: number = 0;
  public onClose?: () => void;

  public readonly items: ExpShopItem[] = [
    {
      id: 'rare_candy',
      name: 'Rare Candy',
      cost: 300,
      category: 'LEVEL',
      icon: '🍬',
      description: 'Magical confection. Instantly raises lead Pokémon level by 1.',
      effect: (p) => {
        const lead = p.party[0];
        if (!lead) return 'You have no Pokémon in your party!';
        lead.level++;
        lead.maxHp += 4;
        lead.currentHp = lead.maxHp;
        lead.stats.attack += 2;
        lead.stats.defense += 2;
        lead.stats.speed += 2;
        lead.stats.special += 2;
        return `${lead.species.name} grew to Level ${lead.level}!`;
      },
    },
    {
      id: 'mega_exp_pack',
      name: 'Mega EXP Shard',
      cost: 250,
      category: 'LEVEL',
      icon: '✨',
      description: 'Condensed radiant energy. Grants +800 EXP to all team members.',
      effect: (p) => {
        if (!p.party.length) return 'Party is empty!';
        p.party.forEach((mon) => {
          mon.currentExp += 800;
          if (mon.currentExp >= mon.nextLevelExp) {
            mon.level++;
            mon.currentExp = 0;
            mon.nextLevelExp = Math.floor(mon.nextLevelExp * 1.3);
            mon.maxHp += 3;
            mon.currentHp = mon.maxHp;
          }
        });
        return 'Entire party gained +800 EXP!';
      },
    },
    {
      id: 'protein_atk',
      name: 'Protein (ATK +5)',
      cost: 250,
      category: 'STATS',
      icon: '⚔️',
      description: 'High-purity nutrient. Permanently increases lead Attack by +5.',
      effect: (p) => {
        const lead = p.party[0];
        if (!lead) return 'Party is empty!';
        lead.stats.attack += 5;
        return `${lead.species.name}'s Attack rose by +5! (${lead.stats.attack})`;
      },
    },
    {
      id: 'iron_def',
      name: 'Iron (DEF +5)',
      cost: 250,
      category: 'STATS',
      icon: '🛡️',
      description: 'Strengthens endurance. Permanently increases lead Defense by +5.',
      effect: (p) => {
        const lead = p.party[0];
        if (!lead) return 'Party is empty!';
        lead.stats.defense += 5;
        return `${lead.species.name}'s Defense rose by +5! (${lead.stats.defense})`;
      },
    },
    {
      id: 'carbos_spd',
      name: 'Carbos (SPD +5)',
      cost: 250,
      category: 'STATS',
      icon: '⚡',
      description: 'Quickens reflexes. Permanently increases lead Speed by +5.',
      effect: (p) => {
        const lead = p.party[0];
        if (!lead) return 'Party is empty!';
        lead.stats.speed += 5;
        return `${lead.species.name}'s Speed rose by +5! (${lead.stats.speed})`;
      },
    },
    {
      id: 'calcium_spc',
      name: 'Calcium (SPC +5)',
      cost: 250,
      category: 'STATS',
      icon: '🔮',
      description: 'Empowers psychic & elemental arts. Lead Special stat +5.',
      effect: (p) => {
        const lead = p.party[0];
        if (!lead) return 'Party is empty!';
        lead.stats.special += 5;
        return `${lead.species.name}'s Special rose by +5! (${lead.stats.special})`;
      },
    },
    {
      id: 'master_ball',
      name: 'Master Ball',
      cost: 950,
      category: 'ITEMS',
      icon: '🟣',
      description: 'The ultimate Ball that captures any wild monster without fail.',
      effect: (p) => {
        const item = p.inventory.find((i) => i.id === 'masterball');
        if (item) {
          item.count++;
        } else {
          p.inventory.push({
            id: 'masterball',
            name: 'Master Ball',
            count: 1,
            price: 5000,
            type: 'pokeball',
            description: '100% Guaranteed capture on any Pokémon.',
            icon: 'MB',
            category: 'BALL',
          });
        }
        return 'Acquired 1x Master Ball!';
      },
    },
    {
      id: 'max_revive',
      name: 'Max Revive',
      cost: 200,
      category: 'ITEMS',
      icon: '💎',
      description: 'Fully revives a fainted Pokémon to maximum HP and recovers all PP.',
      effect: (p) => {
        const item = p.inventory.find((i) => i.id === 'max_revive');
        if (item) {
          item.count++;
        } else {
          p.inventory.push({
            id: 'max_revive',
            name: 'Max Revive',
            count: 1,
            price: 2000,
            type: 'revive',
            description: 'Fully restores fainted Pokémon.',
            icon: 'MR',
            category: 'SPECIAL',
          });
        }
        return 'Acquired 1x Max Revive!';
      },
    },
    {
      id: 'souls_estus',
      name: 'Estus Flask (+1)',
      cost: 500,
      category: 'SOULS',
      icon: '🏺',
      description: 'Permanently increases available Estus healing flasks in 3D Souls Boss.',
      effect: (p) => {
        if (!p.soulsStats) {
          p.soulsStats = { estusCharges: 4, estusLevel: 1, bossVictories: 0, swordUpgrade: 0, rollUpgrade: 0 };
        } else {
          p.soulsStats.estusCharges = (p.soulsStats.estusCharges || 3) + 1;
        }
        return `Estus Flasks upgraded! Total: ${p.soulsStats.estusCharges} charges.`;
      },
    },
    {
      id: 'souls_roll',
      name: 'Dark Wood Grain Ring',
      cost: 700,
      category: 'SOULS',
      icon: '💍',
      description: 'Extends Dodge Roll Invincibility (I-Frames) in 3D Souls Boss combat.',
      effect: (p) => {
        if (!p.soulsStats) {
          p.soulsStats = { estusCharges: 3, estusLevel: 1, bossVictories: 0, swordUpgrade: 0, rollUpgrade: 1 };
        } else {
          p.soulsStats.rollUpgrade = (p.soulsStats.rollUpgrade || 0) + 1;
        }
        return `Dodge Roll mastery upgraded! Level ${p.soulsStats.rollUpgrade}.`;
      },
    },
    {
      id: 'souls_sword',
      name: 'Cinder Greatsword Polish',
      cost: 750,
      category: 'SOULS',
      icon: '🗡️',
      description: 'Permanently boosts player attack damage by +35% in 3D Souls Boss combat.',
      effect: (p) => {
        if (!p.soulsStats) {
          p.soulsStats = { estusCharges: 3, estusLevel: 1, bossVictories: 0, swordUpgrade: 1, rollUpgrade: 0 };
        } else {
          p.soulsStats.swordUpgrade = (p.soulsStats.swordUpgrade || 0) + 1;
        }
        return `Greatsword sharpened! Attack Bonus Lv.${p.soulsStats.swordUpgrade}.`;
      },
    },
    {
      id: 'kart_turbo',
      name: 'Kart Nitro Booster',
      cost: 600,
      category: 'KART',
      icon: '🚀',
      description: 'Increases top speed and turbo acceleration in the 3D Kart Racing minigame.',
      effect: (p) => {
        if (!p.kartStats) {
          p.kartStats = { speedUpgrades: 1, nitroCharges: 3, wins: 0 };
        } else {
          p.kartStats.speedUpgrades = (p.kartStats.speedUpgrades || 0) + 1;
        }
        return `Kart Engine tuned! Speed Stage: ${p.kartStats.speedUpgrades}.`;
      },
    },
    {
      id: 'buy_gems',
      name: 'Gem Cluster (+10)',
      cost: 350,
      category: 'GEMS',
      icon: '💎',
      description: 'Exchange 350 EXP tokens for 10 sparkling Prismatic Gems.',
      effect: (p) => {
        p.gems = (p.gems || 0) + 10;
        return 'Received +10 Prismatic Gems! 💎';
      },
    },
    {
      id: 'gem_rod',
      name: 'Prismatic Rod',
      cost: 0,
      gemCost: 15,
      category: 'GEMS',
      icon: '🎣',
      description: 'Enchanted fishing rod. Hooks rarer fish and widens the reel catch bar.',
      effect: (p) => {
        p.fishCaught = (p.fishCaught || 0) + 5;
        return 'Equipped Prismatic Fishing Rod! Hook chance increased.';
      },
    },
    {
      id: 'gem_curry',
      name: 'Golden Chef Apron',
      cost: 0,
      gemCost: 15,
      category: 'GEMS',
      icon: '👨‍🍳',
      description: 'Legendary apron that widens the golden cooking zone in the kitchen.',
      effect: (p) => {
        p.dishesCooked = (p.dishesCooked || 0) + 3;
        return 'Acquired Golden Chef Apron! Cooking mastery raised.';
      },
    },
  ];

  constructor(player: PlayerData) {
    this.player = player;
    if (this.player.expTokens === undefined) {
      this.player.expTokens = 600; // Starter allowance
    }
  }

  public update(input: InputHandler, deltaMs: number) {
    if (this.messageTimer > 0) {
      this.messageTimer -= deltaMs;
    }

    if (input.isJustPressed('up')) {
      soundManager.playSelect();
      this.cursor = (this.cursor - 1 + this.items.length) % this.items.length;
    } else if (input.isJustPressed('down')) {
      soundManager.playSelect();
      this.cursor = (this.cursor + 1) % this.items.length;
    }

    if (input.isJustPressed('a')) {
      const item = this.items[this.cursor];
      const tokens = this.player.expTokens || 0;
      const gems = this.player.gems || 0;

      if (item.gemCost && item.gemCost > 0) {
        if (gems >= item.gemCost) {
          this.player.gems = gems - item.gemCost;
          soundManager.playExpShopBuy();
          const res = item.effect(this.player);
          this.message = res;
          this.messageTimer = 3500;
        } else {
          soundManager.playBump();
          this.message = `Need ${item.gemCost - gems} more Gems 💎!`;
          this.messageTimer = 2500;
        }
      } else {
        if (tokens >= item.cost) {
          this.player.expTokens = tokens - item.cost;
          soundManager.playExpShopBuy();
          const res = item.effect(this.player);
          this.message = res;
          this.messageTimer = 3500;
        } else {
          soundManager.playBump();
          this.message = `Need ${item.cost - tokens} more EXP tokens!`;
          this.messageTimer = 2500;
        }
      }
    }

    if (input.isJustPressed('b') || input.isJustPressed('start')) {
      soundManager.playCancel();
      if (this.onClose) this.onClose();
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    // Cyber-Mythic Sanctuary Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, cw, ch);

    // Glowing subtle neon grid lines
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y < ch; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = '#162238';
    ctx.fillRect(6, 6, cw - 12, 28);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, cw - 12, 28);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ MYTHIC EXP SANCTUARY', 14, 24);

    // Player EXP Currency & Gems Badge
    const tokens = this.player.expTokens || 0;
    const gems = this.player.gems || 0;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText(`✦${tokens} EXP | 💎${gems} GEMS`, cw - 14, 24);

    // Left Column: Item List (Scrollable window of 5 items)
    const listX = 6;
    const listY = 38;
    const listW = 168;
    const listH = 144;

    ctx.fillStyle = '#101726';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = '#283c5a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(listX, listY, listW, listH);

    const visibleCount = 5;
    const startIndex = Math.max(0, Math.min(this.items.length - visibleCount, this.cursor - 2));

    for (let i = 0; i < visibleCount; i++) {
      const idx = startIndex + i;
      if (idx >= this.items.length) break;
      const item = this.items[idx];
      const isSelected = idx === this.cursor;
      const rowY = listY + 6 + i * 26;

      if (isSelected) {
        ctx.fillStyle = '#1e3860';
        ctx.fillRect(listX + 3, rowY - 2, listW - 6, 24);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX + 3, rowY - 2, listW - 6, 24);

        // Arrow
        ctx.fillStyle = '#ffea00';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('▶', listX + 6, rowY + 14);
      }

      // Category Tag Pill
      ctx.fillStyle =
        item.category === 'SOULS'
          ? '#9c27b0'
          : item.category === 'KART'
            ? '#e91e63'
            : item.category === 'LEVEL'
              ? '#4caf50'
              : item.category === 'GEMS'
                ? '#00e5ff'
                : '#00bcd4';
      ctx.fillRect(listX + 18, rowY + 3, 20, 10);
      ctx.fillStyle = item.category === 'GEMS' ? '#000' : '#fff';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.category.slice(0, 3), listX + 28, rowY + 11);

      // Item Name
      ctx.textAlign = 'left';
      ctx.fillStyle = isSelected ? '#ffffff' : '#b8cde8';
      ctx.font = 'bold 9px monospace';
      const shortName = item.name.length > 13 ? item.name.slice(0, 12) + '…' : item.name;
      ctx.fillText(shortName, listX + 42, rowY + 11);

      // Cost
      ctx.textAlign = 'right';
      if (item.gemCost) {
        ctx.fillStyle = gems >= item.gemCost ? '#00e5ff' : '#888';
        ctx.font = '8px monospace';
        ctx.fillText(`💎${item.gemCost}`, listX + listW - 8, rowY + 20);
      } else {
        ctx.fillStyle = tokens >= item.cost ? '#ffea00' : '#888';
        ctx.font = '8px monospace';
        ctx.fillText(`${item.cost}`, listX + listW - 8, rowY + 20);
      }
    }

    // Right Column: Details Panel
    const detailX = 180;
    const detailY = 38;
    const detailW = cw - detailX - 6;
    const detailH = listH;

    ctx.fillStyle = '#101726';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = '#283c5a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    const active = this.items[this.cursor];
    if (active) {
      // Big Icon + Name
      ctx.textAlign = 'left';
      ctx.font = '20px monospace';
      ctx.fillText(active.icon, detailX + 10, detailY + 26);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(active.name, detailX + 38, detailY + 18);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '8px monospace';
      if (active.gemCost) {
        ctx.fillText(`COST: 💎 ${active.gemCost} GEMS`, detailX + 38, detailY + 30);
      } else {
        ctx.fillText(`COST: ${active.cost} EXP`, detailX + 38, detailY + 30);
      }

      // Divider
      ctx.strokeStyle = '#283c5a';
      ctx.beginPath();
      ctx.moveTo(detailX + 8, detailY + 38);
      ctx.lineTo(detailX + detailW - 8, detailY + 38);
      ctx.stroke();

      // Description
      ctx.fillStyle = '#b0c4de';
      ctx.font = '9px monospace';
      this.drawWrappedText(ctx, active.description, detailX + 10, detailY + 54, detailW - 20, 13);

      // Current Upgrades / Inventory count
      ctx.fillStyle = '#7cd468';
      ctx.font = '8px monospace';
      if (active.id === 'souls_estus' && this.player.soulsStats) {
        ctx.fillText(`Current: ${this.player.soulsStats.estusCharges} Flasks`, detailX + 10, detailY + 120);
      } else if (active.id === 'souls_roll' && this.player.soulsStats) {
        ctx.fillText(`Roll Buff: Lv.${this.player.soulsStats.rollUpgrade || 0}`, detailX + 10, detailY + 120);
      } else if (active.id === 'souls_sword' && this.player.soulsStats) {
        ctx.fillText(`Sword Atk: Lv.${this.player.soulsStats.swordUpgrade || 0}`, detailX + 10, detailY + 120);
      } else if (active.id === 'kart_turbo' && this.player.kartStats) {
        ctx.fillText(`Turbo Boost: Lv.${this.player.kartStats.speedUpgrades || 0}`, detailX + 10, detailY + 120);
      } else {
        const lead = this.player.party[0];
        if (lead) {
          ctx.fillText(`Lead: ${lead.species.name} (Lv.${lead.level})`, detailX + 10, detailY + 120);
        }
      }

      const canAfford = active.gemCost ? (this.player.gems || 0) >= active.gemCost : tokens >= active.cost;
      ctx.fillStyle = canAfford ? '#00e5ff' : '#e53935';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(canAfford ? '▶ [A] PURCHASE' : '✖ INSUFFICIENT FUNDS', detailX + 10, detailY + 135);
    }

    // Bottom Message / Dialog Box
    const msgY = 188;
    const msgH = 46;
    ctx.fillStyle = '#080d15';
    ctx.fillRect(6, msgY, cw - 12, msgH);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, msgY, cw - 12, msgH);

    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    this.drawWrappedText(ctx, this.message, 14, msgY + 16, cw - 28, 13);

    // Footer Help Bar
    ctx.fillStyle = '#8aa0bf';
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('▲▼ SELECT | [Z] BUY | [X] RETURN', cw - 14, msgY + msgH - 6);
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        ctx.fillText(line, x, curY);
        line = words[i] + ' ';
        curY += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, curY);
  }
}
