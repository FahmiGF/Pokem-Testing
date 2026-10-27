import { soundManager } from '../audio/sound';
import { createActivePokemon, WILD_ENCOUNTER_POOL } from '../data/pokemon';
import type { ActivePokemon, PlayerData } from '../types';
import type { InputHandler } from './input';
import { TileMap, TileType, type NPC } from './tilemap';

export class Overworld {
  public map: TileMap;
  public player: PlayerData;

  // Grid movement state
  public isMoving: boolean = false;
  private moveProgress: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  public stepCount: number = 0;

  // Visual position in pixels
  public visualX: number = 0;
  public visualY: number = 0;

  // Dialog state
  public currentDialog: {
    speaker: string;
    lines: string[];
    currentLineIndex: number;
    displayedText: string;
    fullText: string;
    charIndex: number;
    isFinished: boolean;
    onComplete?: () => void;
  } | null = null;

  // Callbacks
  public onEncounterTriggered?: (wildPokemon: ActivePokemon) => void;
  public onTrainerBattleTriggered?: (
    npcId: string,
    trainerName: string,
    party: ActivePokemon[],
    rewardMoney: number,
    badge?: string
  ) => void;
  public onOpenMart?: () => void;
  public onOpenMenu?: () => void;

  constructor() {
    this.map = new TileMap();

    // Start player outside Oak's Lab in Pallet Town (x: 16, y: 55)
    this.player = {
      x: 16,
      y: 55,
      direction: 'down',
      party: [],
      inventory: [
        { id: 'pokeball', name: 'Poké Ball', count: 10, price: 200, type: 'pokeball', description: 'Catches wild Pokémon.' },
        { id: 'potion', name: 'Potion', count: 5, price: 300, type: 'potion', description: 'Restores 20 HP to a Pokémon.' },
      ],
      money: 1000,
      badges: 0,
      hasBoulderBadge: false,
      seenPokemon: [],
      caughtPokemon: [],
      defeatedTrainers: [],
    };

    this.visualX = this.player.x * TileMap.TILE_SIZE;
    this.visualY = this.player.y * TileMap.TILE_SIZE;
  }

  public setStarter(starterId: number) {
    const starter = createActivePokemon(starterId, 5);
    this.player.party = [starter];
    if (!this.player.seenPokemon.includes(starterId)) {
      this.player.seenPokemon.push(starterId);
    }
    if (!this.player.caughtPokemon.includes(starterId)) {
      this.player.caughtPokemon.push(starterId);
    }
  }

  public update(input: InputHandler, deltaMs: number) {
    // 1. If dialog is active, handle dialog progression
    if (this.currentDialog) {
      this.updateDialog(input, deltaMs);
      return;
    }

    // 2. Open Start / Pause Menu (Escape, X, or Start)
    if (input.isJustPressed('select') || input.isJustPressed('start')) {
      if (this.onOpenMenu) {
        soundManager.playConfirm();
        this.onOpenMenu();
        return;
      }
    }

    // 3. Movement interpolation (Running Shoes: 2x speed when holding B)
    const isRunning = input.isDown('b');
    const speed = isRunning ? 0.012 : 0.006;

    if (this.isMoving) {
      this.moveProgress += speed * deltaMs;
      if (this.moveProgress >= 1.0) {
        this.player.x = this.targetX;
        this.player.y = this.targetY;
        this.visualX = this.player.x * TileMap.TILE_SIZE;
        this.visualY = this.player.y * TileMap.TILE_SIZE;
        this.isMoving = false;
        this.moveProgress = 0;
        this.stepCount++;

        this.onStepComplete();
      } else {
        const ts = TileMap.TILE_SIZE;
        this.visualX = (this.startX + (this.targetX - this.startX) * this.moveProgress) * ts;
        this.visualY = (this.startY + (this.targetY - this.startY) * this.moveProgress) * ts;
      }
      return;
    }

    // 4. Check interaction (A button)
    if (input.isJustPressed('a')) {
      const facingPos = this.getFacingTile();

      // Check NPC
      const npc = this.map.getNPCAt(facingPos.x, facingPos.y);
      if (npc) {
        this.interactWithNPC(npc);
        return;
      }

      // Check Signboards
      if (
        facingPos.x >= 0 &&
        facingPos.x < this.map.width &&
        facingPos.y >= 0 &&
        facingPos.y < this.map.height &&
        this.map.data[facingPos.y][facingPos.x] === TileType.SIGN
      ) {
        this.readSign(facingPos.x, facingPos.y);
        return;
      }
    }

    // 5. Walking input
    let dx = 0;
    let dy = 0;

    if (input.isDown('up')) {
      this.player.direction = 'up';
      dy = -1;
    } else if (input.isDown('down')) {
      this.player.direction = 'down';
      dy = 1;
    } else if (input.isDown('left')) {
      this.player.direction = 'left';
      dx = -1;
    } else if (input.isDown('right')) {
      this.player.direction = 'right';
      dx = 1;
    }

    if (dx !== 0 || dy !== 0) {
      const nextX = this.player.x + dx;
      const nextY = this.player.y + dy;

      if (!this.map.isSolid(nextX, nextY)) {
        this.isMoving = true;
        this.moveProgress = 0;
        this.startX = this.player.x;
        this.startY = this.player.y;
        this.targetX = nextX;
        this.targetY = nextY;
      } else {
        soundManager.playBump();
      }
    }
  }

  private readSign(x: number, y: number) {
    soundManager.playConfirm();

    if (y >= 45) {
      // Pallet Town Signs
      if (x <= 10) {
        this.startDialog("Oak's Lab", [
          "PROF. OAK'S POKÉMON RESEARCH LAB",
          'Dedicated to uncovering the mysteries of Pokémon biology and habitat!',
        ]);
      } else {
        this.startDialog('Signboard', [
          'PALLET TOWN - Shades of your journey await!',
          'Head north onto Route 1 to begin your Pokémon journey!',
        ]);
      }
    } else if (y >= 22 && y <= 44) {
      // Route 1 Signs
      if (y > 30) {
        this.startDialog('Route 1 Sign', [
          'ROUTE 1 - South to Pallet Town, North to Pewter City.',
          'Wild Pokémon dwell inside the tall grass!',
        ]);
      } else {
        this.startDialog('Route 1 North', [
          'TRAINER NOTICE: Ahead lies Pewter City.',
          'Prepare your Pokémon before challenging Gym Leader Brock!',
        ]);
      }
    } else {
      // Pewter City Signs
      if (x >= 17 && y <= 8) {
        this.startDialog('Pewter Gym', [
          'PEWTER CITY POKÉMON GYM',
          'LEADER: BROCK - The Rock-Solid Pokémon Trainer!',
        ]);
      } else if (x <= 10 && y <= 8) {
        this.startDialog('Pewter Museum', [
          'PEWTER MUSEUM OF SCIENCE',
          'Explore ancient fossils and rare space rocks!',
        ]);
      } else {
        this.startDialog('Pewter City', [
          'PEWTER CITY - A Stone Gray City.',
          'Visit the Pokémon Center and Mart to gear up for battle!',
        ]);
      }
    }
  }

  private getFacingTile(): { x: number; y: number } {
    let fx = this.player.x;
    let fy = this.player.y;
    if (this.player.direction === 'up') fy -= 1;
    if (this.player.direction === 'down') fy += 1;
    if (this.player.direction === 'left') fx -= 1;
    if (this.player.direction === 'right') fx += 1;
    return { x: fx, y: fy };
  }

  private onStepComplete() {
    const tile = this.map.data[this.player.y][this.player.x];

    // Check Tall Grass for wild encounters
    if (tile === TileType.TALL_GRASS) {
      soundManager.playGrassRustle();

      // 17% chance per step
      if (Math.random() < 0.17) {
        this.triggerWildBattle();
      }
    }
  }

  private triggerWildBattle() {
    soundManager.playEncounter();

    const totalWeight = WILD_ENCOUNTER_POOL.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = WILD_ENCOUNTER_POOL[0];

    for (const item of WILD_ENCOUNTER_POOL) {
      if (rand < item.weight) {
        chosen = item;
        break;
      }
      rand -= item.weight;
    }

    const lvl = Math.floor(Math.random() * (chosen.maxLvl - chosen.minLvl + 1)) + chosen.minLvl;
    const wildPokemon = createActivePokemon(chosen.id, lvl);

    // Record seen in Pokédex
    if (!this.player.seenPokemon.includes(wildPokemon.species.id)) {
      this.player.seenPokemon.push(wildPokemon.species.id);
    }

    if (this.onEncounterTriggered) {
      this.onEncounterTriggered(wildPokemon);
    }
  }

  private interactWithNPC(npc: NPC) {
    if (this.player.direction === 'up') npc.direction = 'down';
    if (this.player.direction === 'down') npc.direction = 'up';
    if (this.player.direction === 'left') npc.direction = 'right';
    if (this.player.direction === 'right') npc.direction = 'left';

    soundManager.playConfirm();

    // 1. Nurse Joy healing
    if (npc.type === 'nurse') {
      this.startDialog(npc.name, npc.dialog, () => {
        soundManager.playHealChime();
        this.player.party.forEach((p) => {
          p.currentHp = p.maxHp;
          p.moves.forEach((m) => (m.currentPp = m.move.pp));
        });
      });
      return;
    }

    // 2. Mart Clerk shop
    if (npc.type === 'clerk') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenMart) this.onOpenMart();
      });
      return;
    }

    // 3. Trainer / Gym Leader battle check
    const isDefeated = this.player.defeatedTrainers.includes(npc.id);

    if (npc.type === 'trainer' || npc.type === 'gym_leader') {
      if (isDefeated) {
        const lines = npc.afterDefeatDialog || npc.dialog;
        this.startDialog(npc.name, lines);
      } else {
        // Trigger battle!
        this.startDialog(npc.name, npc.dialog, () => {
          const party = (npc.trainerParty || []).map((tp) => createActivePokemon(tp.id, tp.level));
          // Record seen in Pokedex
          party.forEach((p) => {
            if (!this.player.seenPokemon.includes(p.species.id)) {
              this.player.seenPokemon.push(p.species.id);
            }
          });

          if (this.onTrainerBattleTriggered) {
            this.onTrainerBattleTriggered(
              npc.id,
              npc.name,
              party,
              npc.rewardMoney || 300,
              npc.badge
            );
          }
        });
      }
      return;
    }

    // 4. Regular NPC dialogue
    this.startDialog(npc.name, npc.dialog);
  }

  public startDialog(speaker: string, lines: string[], onComplete?: () => void) {
    this.currentDialog = {
      speaker,
      lines,
      currentLineIndex: 0,
      displayedText: '',
      fullText: lines[0] || '',
      charIndex: 0,
      isFinished: false,
      onComplete,
    };
  }

  private updateDialog(input: InputHandler, deltaMs: number) {
    if (!this.currentDialog) return;

    const d = this.currentDialog;

    // Typewriter effect
    if (!d.isFinished) {
      d.charIndex += deltaMs * 0.045;
      if (d.charIndex >= d.fullText.length) {
        d.displayedText = d.fullText;
        d.isFinished = true;
      } else {
        d.displayedText = d.fullText.slice(0, Math.floor(d.charIndex));
      }
    }

    if (input.isJustPressed('a') || input.isJustPressed('b')) {
      if (!d.isFinished) {
        d.displayedText = d.fullText;
        d.isFinished = true;
        soundManager.playSelect();
      } else {
        d.currentLineIndex++;
        if (d.currentLineIndex < d.lines.length) {
          d.fullText = d.lines[d.currentLineIndex];
          d.displayedText = '';
          d.charIndex = 0;
          d.isFinished = false;
          soundManager.playSelect();
        } else {
          const callback = d.onComplete;
          this.currentDialog = null;
          soundManager.playConfirm();
          if (callback) callback();
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, animTime: number) {
    const cameraX = Math.floor(canvasWidth / 2 - this.visualX - TileMap.TILE_SIZE / 2);
    const cameraY = Math.floor(canvasHeight / 2 - this.visualY - TileMap.TILE_SIZE / 2);

    ctx.save();
    ctx.translate(cameraX, cameraY);

    this.map.draw(ctx, animTime);
    this.drawPlayer(ctx);

    ctx.restore();

    if (this.currentDialog) {
      this.drawDialogBox(ctx, canvasWidth, canvasHeight);
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const px = Math.floor(this.visualX);
    const py = Math.floor(this.visualY);

    const walkFrame = this.isMoving ? Math.floor(this.moveProgress * 4) % 4 : 0;
    const legOffset = walkFrame === 1 ? -1 : walkFrame === 3 ? 1 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(px + 8, py + 14, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Pants
    ctx.fillStyle = '#224488';
    ctx.fillRect(px + 4 + legOffset, py + 10, 3, 5);
    ctx.fillRect(px + 9 - legOffset, py + 10, 3, 5);

    // Shoes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 3 + legOffset, py + 14, 4, 2);
    ctx.fillRect(px + 9 - legOffset, py + 14, 4, 2);

    // Body / Red Jacket
    ctx.fillStyle = '#dd2222';
    ctx.fillRect(px + 4, py + 5, 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 6, py + 5, 4, 5);

    // Head / Face
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(px + 5, py + 1, 6, 5);

    // Cap
    ctx.fillStyle = '#dd2222';
    ctx.fillRect(px + 4, py - 2, 8, 4);
    ctx.fillStyle = '#ffffff';
    if (this.player.direction === 'down') {
      ctx.fillRect(px + 6, py - 1, 4, 2);
    } else if (this.player.direction === 'left') {
      ctx.fillRect(px + 3, py - 1, 4, 2);
    } else if (this.player.direction === 'right') {
      ctx.fillRect(px + 9, py - 1, 4, 2);
    }

    // Eyes
    ctx.fillStyle = '#000000';
    if (this.player.direction === 'down') {
      ctx.fillRect(px + 6, py + 3, 1, 2);
      ctx.fillRect(px + 9, py + 3, 1, 2);
    } else if (this.player.direction === 'left') {
      ctx.fillRect(px + 5, py + 3, 1, 2);
    } else if (this.player.direction === 'right') {
      ctx.fillRect(px + 10, py + 3, 1, 2);
    }
  }

  private drawDialogBox(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const boxHeight = 72;
    const boxY = ch - boxHeight - 8;
    const boxX = 8;
    const boxWidth = cw - 16;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = '#b0b0b0';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 3, boxY + 3, boxWidth - 6, boxHeight - 6);

    if (this.currentDialog && this.currentDialog.speaker) {
      ctx.fillStyle = '#3355aa';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(this.currentDialog.speaker.toUpperCase(), boxX + 12, boxY + 16);
    }

    ctx.fillStyle = '#111111';
    ctx.font = '12px monospace';
    ctx.fillText(this.currentDialog?.displayedText || '', boxX + 12, boxY + 36);

    if (this.currentDialog?.isFinished) {
      const arrowY = boxY + boxHeight - 14 + (Math.floor(Date.now() / 250) % 2) * 2;
      ctx.fillStyle = '#d22';
      ctx.beginPath();
      ctx.moveTo(boxX + boxWidth - 20, arrowY);
      ctx.lineTo(boxX + boxWidth - 12, arrowY);
      ctx.lineTo(boxX + boxWidth - 16, arrowY + 6);
      ctx.closePath();
      ctx.fill();
    }
  }
}
