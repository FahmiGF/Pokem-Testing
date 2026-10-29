// Mount / Ride Shop: purchase rideable Pokémon and equip them in the overworld.

import { soundManager } from '../audio/sound';
import type { PlayerData } from '../types';
import type { InputHandler } from './input';

export interface MountDef {
  id: string;
  name: string;
  speciesId: number;
  icon: string;
  color: string;
  accent: string;
  speed: number;
  price: number;
  gemCost?: number;
  perk: string;
}

export const MOUNTS: MountDef[] = [
  {
    id: 'mount_rental',
    name: 'Rental Ponyta',
    speciesId: 77,
    icon: '🐴',
    color: '#efc07a',
    accent: '#c96b2c',
    speed: 1.35,
    price: 750,
    perk: 'Starter ride. Cheap, reliable, and available from day one.',
  },
  {
    id: 'mount_bulbasaur',
    name: 'Bulbasaur Rider',
    speciesId: 1,
    icon: '🌱',
    color: '#4caf82',
    accent: '#2e7d5b',
    speed: 1.5,
    price: 2200,
    perk: 'Gentle trot. Slightly faster travel and a leafy trail.',
  },
  {
    id: 'mount_charmander',
    name: 'Charmander Rider',
    speciesId: 4,
    icon: '🔥',
    color: '#ef6c3c',
    accent: '#c33c14',
    speed: 1.65,
    price: 2600,
    perk: 'Warm ember dash. Fast travel with flickering flames.',
  },
  {
    id: 'mount_squirtle',
    name: 'Squirtle Rider',
    speciesId: 7,
    icon: '💧',
    color: '#4fa8e0',
    accent: '#2a6fa8',
    speed: 1.55,
    price: 2400,
    perk: 'Bubbly glide. Water-splash dust on every step.',
  },
  {
    id: 'mount_pikachu',
    name: 'Pikachu Rider',
    speciesId: 25,
    icon: '⚡',
    color: '#f7d23c',
    accent: '#c99a12',
    speed: 1.8,
    price: 3200,
    perk: 'Static sprint. Very fast travel and sparking feet.',
  },
  {
    id: 'mount_ponyta',
    name: 'Ponyta Gallop',
    speciesId: 77,
    icon: '🐎',
    color: '#f2a65a',
    accent: '#d6501e',
    speed: 1.95,
    price: 4800,
    perk: 'Blazing gallop. One of the fastest land mounts.',
  },
  {
    id: 'mount_onix',
    name: 'Onix Burrower',
    speciesId: 95,
    icon: '🪨',
    color: '#8d8d8d',
    accent: '#5a5a5a',
    speed: 2.05,
    price: 6500,
    perk: 'Titanic tunnel. Ignores bumps with sheer size.',
  },
  {
    id: 'mount_lapras',
    name: 'Lapras Tide',
    speciesId: 131,
    icon: '🌊',
    color: '#6fa8dc',
    accent: '#3d6f9e',
    speed: 1.75,
    price: 0,
    gemCost: 20,
    perk: 'Crystal tide. Glides with a shimmering wake.',
  },
  {
    id: 'mount_gyarados',
    name: 'Gyarados Storm',
    speciesId: 130,
    icon: '🌀',
    color: '#3f7fbf',
    accent: '#1f4f8f',
    speed: 2.2,
    price: 0,
    gemCost: 35,
    perk: 'Raging storm. The fastest mount in Kanto.',
  },
];

export function getMount(id: string | null | undefined): MountDef | null {
  if (!id) return null;
  return MOUNTS.find((m) => m.id === id) || null;
}

export class MountShop {
  public player: PlayerData;
  public cursor: number = 0;
  public message: string = 'Choose a companion to ride across Kanto!';
  public messageTimer: number = 0;
  public onClose?: () => void;
  public onMountEquipped?: (name: string) => void;

  constructor(player: PlayerData) {
    this.player = player;
    if (!this.player.ownedMounts) this.player.ownedMounts = [];
  }

  public update(input: InputHandler, deltaMs: number) {
    if (this.messageTimer > 0) this.messageTimer -= deltaMs;

    if (input.isJustPressed('up')) {
      this.cursor = (this.cursor - 1 + MOUNTS.length) % MOUNTS.length;
      soundManager.playSelect();
    } else if (input.isJustPressed('down')) {
      this.cursor = (this.cursor + 1) % MOUNTS.length;
      soundManager.playSelect();
    }

    if (input.isJustPressed('a')) {
      const mount = MOUNTS[this.cursor];
      const owned = (this.player.ownedMounts || []).includes(mount.id);

      if (owned) {
        this.player.activeMount = mount.id;
        this.player.mounted = false;
        soundManager.playMountSummon();
        soundManager.playMountRoar();
        this.message = `${mount.name} equipped! Press [R] in the overworld to ride.`;
        this.messageTimer = 3200;
        if (this.onMountEquipped) this.onMountEquipped(mount.name);
        return;
      }

      if (mount.gemCost) {
        const gems = this.player.gems || 0;
        if (gems < mount.gemCost) {
          soundManager.playBump();
          this.message = `Need ${mount.gemCost - gems} more Gems 💎!`;
          this.messageTimer = 2400;
          return;
        }
        this.player.gems = gems - mount.gemCost;
      } else {
        if (this.player.money < mount.price) {
          soundManager.playBump();
          this.message = `Need $${mount.price - this.player.money} more!`;
          this.messageTimer = 2400;
          return;
        }
        this.player.money -= mount.price;
      }

      this.player.ownedMounts = [...(this.player.ownedMounts || []), mount.id];
      this.player.activeMount = mount.id;
      this.player.mounted = false;
      soundManager.playExpShopBuy();
      soundManager.playMountRoar();
      this.message = `${mount.name} joined your ranch! Press [R] to ride.`;
      this.messageTimer = 3200;
      if (this.onMountEquipped) this.onMountEquipped(mount.name);
    }

    if (input.isJustPressed('b') || input.isJustPressed('start')) {
      soundManager.playCancel();
      if (this.onClose) this.onClose();
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    // Warm ranch gradient
    const bg = ctx.createLinearGradient(0, 0, 0, ch);
    bg.addColorStop(0, '#22160c');
    bg.addColorStop(1, '#0d0a07');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    // Fence pattern
    ctx.strokeStyle = 'rgba(180, 130, 70, 0.14)';
    ctx.lineWidth = 1;
    for (let y = 0; y < ch; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // Header
    ctx.fillStyle = '#3a2411';
    ctx.fillRect(6, 6, cw - 12, 28);
    ctx.strokeStyle = '#ffb74d';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, cw - 12, 28);

    ctx.fillStyle = '#ffcc80';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🐎 KANTO MOUNT RANCH', 14, 24);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText(`$${this.player.money} | 💎${this.player.gems || 0}`, cw - 14, 24);

    // List
    const listX = 6;
    const listY = 38;
    const listW = 168;
    const listH = 150;

    ctx.fillStyle = '#1a120a';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = '#5d4326';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(listX, listY, listW, listH);

    const visibleCount = 5;
    const startIndex = Math.max(0, Math.min(MOUNTS.length - visibleCount, this.cursor - 2));

    for (let i = 0; i < visibleCount; i++) {
      const idx = startIndex + i;
      if (idx >= MOUNTS.length) break;
      const mount = MOUNTS[idx];
      const isSelected = idx === this.cursor;
      const owned = (this.player.ownedMounts || []).includes(mount.id);
      const active = this.player.activeMount === mount.id;
      const rowY = listY + 8 + i * 28;

      if (isSelected) {
        ctx.fillStyle = '#3a2a16';
        ctx.fillRect(listX + 3, rowY - 4, listW - 6, 26);
        ctx.strokeStyle = '#ffb74d';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX + 3, rowY - 4, listW - 6, 26);
        ctx.fillStyle = '#ffea00';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('▶', listX + 6, rowY + 12);
      }

      // Portrait
      ctx.fillStyle = mount.color;
      ctx.fillRect(listX + 18, rowY + 1, 16, 16);
      ctx.fillStyle = mount.accent;
      ctx.fillRect(listX + 18, rowY + 9, 16, 8);
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(listX + 22, rowY + 5, 2, 2);
      ctx.fillRect(listX + 28, rowY + 5, 2, 2);

      // Name
      ctx.textAlign = 'left';
      ctx.fillStyle = isSelected ? '#ffffff' : '#d7c3aa';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText(mount.icon + ' ' + mount.name, listX + 38, rowY + 8);

      // Tag
      ctx.font = '7px monospace';
      if (active) {
        ctx.fillStyle = '#69f0ae';
        ctx.fillText('RIDING', listX + 38, rowY + 19);
      } else if (owned) {
        ctx.fillStyle = '#80cbc4';
        ctx.fillText('OWNED - PRESS A', listX + 38, rowY + 19);
      } else if (mount.gemCost) {
        ctx.fillStyle = '#4dd0e1';
        ctx.fillText(`💎 ${mount.gemCost}`, listX + 38, rowY + 19);
      } else {
        ctx.fillStyle = '#ffd54f';
        ctx.fillText(`$${mount.price}`, listX + 38, rowY + 19);
      }
    }

    // Detail panel
    const mount = MOUNTS[this.cursor];
    const detailX = 180;
    const detailY = 38;
    const detailW = cw - detailX - 6;
    const detailH = 150;

    ctx.fillStyle = '#1a120a';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = '#5d4326';
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    this.drawMountPreview(ctx, mount, detailX + detailW / 2, detailY + 46);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe0b2';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(mount.name.toUpperCase(), detailX + detailW / 2, detailY + 86);

    ctx.fillStyle = '#a1887f';
    ctx.font = '7.5px monospace';
    this.wrap(ctx, mount.perk, detailX + detailW / 2, detailY + 100, detailW - 12, 10);

    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`SPEED x${mount.speed.toFixed(2)}`, detailX + detailW / 2, detailY + 130);

    // Message
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc80';
    ctx.font = 'bold 7.5px monospace';
    ctx.fillText(this.message.slice(0, 60), cw / 2, ch - 18);

    ctx.fillStyle = '#8d6e63';
    ctx.font = '7px monospace';
    ctx.fillText('[A] BUY / RIDE    [B] LEAVE RANCH', cw / 2, ch - 7);
  }

  private drawMountPreview(ctx: CanvasRenderingContext2D, mount: MountDef, cx: number, cy: number) {
    const bob = Math.sin(Date.now() * 0.004) * 2;
    const y = cy + bob;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, y + 22, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = mount.accent;
    ctx.fillRect(cx - 14, y + 6, 5, 16);
    ctx.fillRect(cx + 9, y + 6, 5, 16);

    // Body
    ctx.fillStyle = mount.color;
    ctx.beginPath();
    ctx.ellipse(cx, y, 22, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = mount.accent;
    ctx.beginPath();
    ctx.ellipse(cx, y + 5, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = mount.color;
    ctx.beginPath();
    ctx.arc(cx + 18, y - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = mount.accent;
    ctx.beginPath();
    ctx.moveTo(cx + 12, y - 19);
    ctx.lineTo(cx + 9, y - 31);
    ctx.lineTo(cx + 17, y - 22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 22, y - 20);
    ctx.lineTo(cx + 26, y - 32);
    ctx.lineTo(cx + 28, y - 20);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.arc(cx + 22, y - 13, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.strokeStyle = mount.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 21, y - 2);
    ctx.quadraticCurveTo(cx - 32, y - 10, cx - 30, y - 20);
    ctx.stroke();
  }

  private wrap(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    ctx.textAlign = 'center';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, centerX, curY);
        line = words[i];
        curY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, centerX, curY);
  }
}
