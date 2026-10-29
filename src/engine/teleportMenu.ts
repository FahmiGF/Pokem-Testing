// Fast-travel teleport network. Free after the World Boss falls, otherwise a
// paid warp service that reaches every zone in Kanto.

import { soundManager } from '../audio/sound';
import type { InputHandler } from './input';
import { TELEPORT_DESTINATIONS } from './worldSystems';

const VISIBLE_ROWS = 7;

export class TeleportMenu {
  public cursor: number = 0;
  public message: string = 'Select a destination.';
  public messageTimer: number = 0;
  public onSelect?: (zoneId: string, x: number, y: number) => void;
  public onClose?: () => void;
  public onWarpCheck?: () => boolean;
  public isUnlocked: boolean;
  public warpCost: number;

  private scrollRow = 0;

  constructor(isUnlocked: boolean, warpCost: number = 150) {
    this.isUnlocked = isUnlocked;
    this.warpCost = warpCost;
    this.message = isUnlocked
      ? 'Grid online. All warps are FREE!'
      : `PAID WARP: $${warpCost} per jump. Beat the World Boss for free warps.`;
  }

  public update(input: InputHandler, deltaMs: number) {
    if (this.messageTimer > 0) this.messageTimer -= deltaMs;

    if (input.isJustPressed('up')) {
      this.cursor = (this.cursor - 1 + TELEPORT_DESTINATIONS.length) % TELEPORT_DESTINATIONS.length;
      this.ensureVisible();
      soundManager.playSelect();
    } else if (input.isJustPressed('down')) {
      this.cursor = (this.cursor + 1) % TELEPORT_DESTINATIONS.length;
      this.ensureVisible();
      soundManager.playSelect();
    }

    if (input.isJustPressed('a')) {
      if (!this.isUnlocked) {
        if (!this.onWarpCheck || !this.onWarpCheck()) return;
      }
      const dest = TELEPORT_DESTINATIONS[this.cursor];
      soundManager.playTeleport();
      if (this.onSelect) this.onSelect(dest.zoneId, dest.x, dest.y);
    }

    if (input.isJustPressed('b') || input.isJustPressed('start')) {
      soundManager.playCancel();
      if (this.onClose) this.onClose();
    }
  }

  private ensureVisible() {
    const row = Math.floor(this.cursor / 2);
    const maxScroll = Math.max(0, Math.ceil(TELEPORT_DESTINATIONS.length / 2) - VISIBLE_ROWS);
    if (row < this.scrollRow) this.scrollRow = row;
    else if (row >= this.scrollRow + VISIBLE_ROWS) this.scrollRow = row - VISIBLE_ROWS + 1;
    this.scrollRow = Math.max(0, Math.min(this.scrollRow, maxScroll));
  }

  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const bg = ctx.createLinearGradient(0, 0, cw, ch);
    bg.addColorStop(0, '#0b1a2a');
    bg.addColorStop(1, '#04070d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    // Animated grid
    const now = Date.now();
    ctx.strokeStyle = this.isUnlocked ? 'rgba(0, 229, 255, 0.10)' : 'rgba(255, 183, 77, 0.07)';
    ctx.lineWidth = 1;
    const off = (now * 0.02) % 16;
    for (let x = -16 + off; x < cw; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = -16 + off; y < ch; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // Header
    ctx.fillStyle = '#122436';
    ctx.fillRect(6, 6, cw - 12, 28);
    ctx.strokeStyle = this.isUnlocked ? '#00e5ff' : '#ffb74d';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, cw - 12, 28);

    ctx.fillStyle = this.isUnlocked ? '#00e5ff' : '#ffb74d';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🌀 KANTO TELEPORT NETWORK', 14, 24);

    ctx.textAlign = 'right';
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = this.isUnlocked ? '#69f0ae' : '#ffd54f';
    ctx.fillText(this.isUnlocked ? 'ONLINE' : `PAID $${this.warpCost}`, cw - 14, 24);

    // Two-column destination grid with scrolling
    const colW = (cw - 24) / 2;
    const rowH = 20;
    const startY = 48;
    const totalRows = Math.ceil(TELEPORT_DESTINATIONS.length / 2);
    const endRow = Math.min(totalRows, this.scrollRow + VISIBLE_ROWS);

    for (let row = this.scrollRow; row < endRow; row++) {
      for (let col = 0; col < 2; col++) {
        const idx = row * 2 + col;
        if (idx >= TELEPORT_DESTINATIONS.length) continue;
        const dest = TELEPORT_DESTINATIONS[idx];
        const x = 12 + col * colW;
        const y = startY + (row - this.scrollRow) * rowH;
        const selected = idx === this.cursor;

        if (selected) {
          ctx.fillStyle = this.isUnlocked ? '#14304a' : '#33260f';
          ctx.fillRect(x - 4, y - 13, colW - 8, 18);
          ctx.strokeStyle = this.isUnlocked ? '#00e5ff' : '#ffb74d';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 4, y - 13, colW - 8, 18);
        }

        ctx.textAlign = 'left';
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = selected ? '#ffffff' : '#b3e5fc';
        ctx.fillText(`${dest.icon} ${dest.name}`, x, y);

        if (!this.isUnlocked && selected) {
          ctx.textAlign = 'right';
          ctx.font = '7px monospace';
          ctx.fillStyle = '#ffd54f';
          ctx.fillText(`$${this.warpCost}`, x + colW - 14, y);
        }
      }
    }

    // Scroll indicators
    if (this.scrollRow > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#80d8ff';
      ctx.font = '8px monospace';
      ctx.fillText('▲', cw - 12, 44);
    }
    if (this.scrollRow + VISIBLE_ROWS < totalRows) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#80d8ff';
      ctx.font = '8px monospace';
      ctx.fillText('▼', cw - 12, 44 + VISIBLE_ROWS * rowH - 4);
    }

    // Message
    ctx.textAlign = 'center';
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = this.isUnlocked ? '#80d8ff' : '#ffb74d';
    ctx.fillText(this.message, cw / 2, ch - 20);

    ctx.fillStyle = '#607d8b';
    ctx.font = '7px monospace';
    ctx.fillText('[A] WARP   [B] CANCEL', cw / 2, ch - 8);
  }
}
