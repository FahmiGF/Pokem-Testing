import { soundManager } from '../audio/sound';
import { POKEMON_MAP, POKEMON_SPECIES_LIST } from '../data/pokemon';
import type { ActivePokemon, InventoryItem } from '../types';
import { BattleSystem } from './battle';
import { InputHandler } from './input';
import { Overworld } from './overworld';
import { SpriteLoader } from './spriteLoader';

export type GameMode =
  | 'STARTER_SELECT'
  | 'OVERWORLD'
  | 'BATTLE_TRANSITION'
  | 'BATTLE'
  | 'START_MENU'
  | 'POKEDEX_VIEW'
  | 'TRAINER_CARD'
  | 'MART_SHOP';

export class Game {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public input: InputHandler;
  public overworld: Overworld;
  public battle: BattleSystem | null = null;
  public mode: GameMode = 'STARTER_SELECT';

  // Starter selection state
  public starterCursor: number = 1;
  public readonly starters = [
    { id: 1, name: 'Bulbasaur', type: 'Grass / Poison', desc: 'A strange seed was planted on its back at birth.' },
    { id: 4, name: 'Charmander', type: 'Fire', desc: 'The flame on its tail indicates its life force and mood.' },
    { id: 7, name: 'Squirtle', type: 'Water', desc: 'Shoots water at prey while in the water. Withdraws into shell.' },
  ];

  // Battle transition animation
  private transitionTimer: number = 0;
  private pendingBattle: {
    enemy: ActivePokemon;
    isTrainer?: boolean;
    trainerName?: string;
    npcId?: string;
    enemyParty?: ActivePokemon[];
    rewardMoney?: number;
    badge?: string;
  } | null = null;

  // Start Menu
  public startMenuCursor: number = 0;
  public readonly startMenuItems = ['POKÉDEX', 'POKÉMON', 'BAG', 'TRAINER', 'SAVE', 'EXIT'];

  // Pokédex View state
  public pokedexCursor: number = 0;
  public pokedexScrollOffset: number = 0;

  // Mart Shop state
  public martCursor: number = 0;
  public readonly martStock: InventoryItem[] = [
    { id: 'pokeball', name: 'Poké Ball', count: 1, price: 200, type: 'pokeball', description: 'Catches wild Pokémon.' },
    { id: 'greatball', name: 'Great Ball', count: 1, price: 600, type: 'pokeball', description: 'Higher catch rate than Poké Ball.' },
    { id: 'potion', name: 'Potion', count: 1, price: 300, type: 'potion', description: 'Restores 20 HP to a Pokémon.' },
    { id: 'super_potion', name: 'Super Potion', count: 1, price: 700, type: 'potion', description: 'Restores 50 HP to a Pokémon.' },
    { id: 'revive', name: 'Revive', count: 1, price: 1500, type: 'revive', description: 'Revitalizes a fainted Pokémon to half HP.' },
  ];
  public martMessage: string = '';

  // Notification Banner
  private toastMessage: string | null = null;
  private toastTimer: number = 0;

  // Frame timing
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.input = new InputHandler();
    this.overworld = new Overworld();

    // Hook events
    this.overworld.onEncounterTriggered = (wildPokemon) => {
      this.startWildBattleTransition(wildPokemon);
    };

    this.overworld.onTrainerBattleTriggered = (npcId, trainerName, party, rewardMoney, badge) => {
      this.startTrainerBattleTransition(npcId, trainerName, party, rewardMoney, badge);
    };

    this.overworld.onOpenMart = () => {
      soundManager.playConfirm();
      this.martCursor = 0;
      this.martMessage = 'What would you like to purchase?';
      this.mode = 'MART_SHOP';
    };

    this.overworld.onOpenMenu = () => {
      this.startMenuCursor = 0;
      this.mode = 'START_MENU';
    };

    // Preload starter sprites
    this.starters.forEach((s) => {
      const sp = POKEMON_MAP.get(s.id);
      if (sp) SpriteLoader.loadImage(sp.spriteFront);
    });

    // Check existing save game in localStorage
    this.loadGame();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private startWildBattleTransition(wildPokemon: ActivePokemon) {
    this.mode = 'BATTLE_TRANSITION';
    this.transitionTimer = 0;
    this.pendingBattle = { enemy: wildPokemon };
    soundManager.stopBgm();
  }

  private startTrainerBattleTransition(
    npcId: string,
    trainerName: string,
    party: ActivePokemon[],
    rewardMoney: number,
    badge?: string
  ) {
    this.mode = 'BATTLE_TRANSITION';
    this.transitionTimer = 0;
    this.pendingBattle = {
      enemy: party[0],
      isTrainer: true,
      trainerName,
      npcId,
      enemyParty: party,
      rewardMoney,
      badge,
    };
    soundManager.stopBgm();
  }

  private loop(currentTime: number) {
    const deltaMs = Math.min(100, currentTime - this.lastTime);
    this.lastTime = currentTime;

    if (this.toastTimer > 0) {
      this.toastTimer -= deltaMs;
      if (this.toastTimer <= 0) this.toastMessage = null;
    }

    this.update(deltaMs);
    this.draw(currentTime);

    this.input.update();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(deltaMs: number) {
    switch (this.mode) {
      case 'STARTER_SELECT':
        this.updateStarterSelect();
        break;

      case 'OVERWORLD':
        this.overworld.update(this.input, deltaMs);
        break;

      case 'BATTLE_TRANSITION':
        this.transitionTimer += deltaMs;
        if (this.transitionTimer >= 1000 && this.pendingBattle) {
          const pb = this.pendingBattle;
          this.battle = new BattleSystem(
            this.overworld.player,
            pb.enemy,
            {
              isTrainer: pb.isTrainer,
              trainerName: pb.trainerName,
              npcId: pb.npcId,
              enemyParty: pb.enemyParty,
              rewardMoney: pb.rewardMoney,
              badge: pb.badge,
            },
            (result) => this.endBattle(result)
          );
          this.pendingBattle = null;
          this.mode = 'BATTLE';
        }
        break;

      case 'BATTLE':
        if (this.battle) {
          this.battle.update(this.input, deltaMs);
        }
        break;

      case 'START_MENU':
        this.updateStartMenu();
        break;

      case 'POKEDEX_VIEW':
        this.updatePokedexView();
        break;

      case 'TRAINER_CARD':
        if (this.input.isJustPressed('b') || this.input.isJustPressed('a')) {
          soundManager.playCancel();
          this.mode = 'START_MENU';
        }
        break;

      case 'MART_SHOP':
        this.updateMartShop();
        break;
    }
  }

  // --- Starter Selection ---
  private updateStarterSelect() {
    if (this.input.isJustPressed('left')) {
      if (this.starterCursor > 0) {
        this.starterCursor--;
        soundManager.playSelect();
      }
    }
    if (this.input.isJustPressed('right')) {
      if (this.starterCursor < this.starters.length - 1) {
        this.starterCursor++;
        soundManager.playSelect();
      }
    }

    if (this.input.isJustPressed('a')) {
      const chosen = this.starters[this.starterCursor];
      soundManager.playConfirm();
      this.overworld.setStarter(chosen.id);

      soundManager.playOverworldBgm();
      this.mode = 'OVERWORLD';

      this.overworld.startDialog('Prof. Oak', [
        `You chose ${chosen.name.toUpperCase()}! What a fantastic companion!`,
        'Here are 10 Poké Balls and 5 Potions for your journey.',
        'Travel north through Route 1 to reach Pewter City and challenge Gym Leader Brock!',
      ]);
    }
  }

  // --- Start Menu ---
  private updateStartMenu() {
    if (this.input.isJustPressed('up')) {
      this.startMenuCursor = (this.startMenuCursor - 1 + this.startMenuItems.length) % this.startMenuItems.length;
      soundManager.playSelect();
    }
    if (this.input.isJustPressed('down')) {
      this.startMenuCursor = (this.startMenuCursor + 1) % this.startMenuItems.length;
      soundManager.playSelect();
    }

    if (this.input.isJustPressed('b')) {
      soundManager.playCancel();
      this.mode = 'OVERWORLD';
      return;
    }

    if (this.input.isJustPressed('a')) {
      soundManager.playConfirm();
      const choice = this.startMenuItems[this.startMenuCursor];

      switch (choice) {
        case 'POKÉDEX':
          this.pokedexCursor = 0;
          this.pokedexScrollOffset = 0;
          this.mode = 'POKEDEX_VIEW';
          break;

        case 'POKÉMON':
          this.showToast(`Party: ${this.overworld.player.party.map((p) => p.species.name).join(', ')}`);
          break;

        case 'BAG':
          const bagSummary = this.overworld.player.inventory.map((i) => `${i.name} x${i.count}`).join(' | ');
          this.showToast(`Money: $${this.overworld.player.money} | ${bagSummary}`);
          break;

        case 'TRAINER':
          this.mode = 'TRAINER_CARD';
          break;

        case 'SAVE':
          this.saveGame();
          soundManager.playLevelUp();
          this.showToast('Game saved successfully to browser storage!');
          this.mode = 'OVERWORLD';
          break;

        case 'EXIT':
          this.mode = 'OVERWORLD';
          break;
      }
    }
  }

  // --- Pokédex View ---
  private updatePokedexView() {
    const listLen = POKEMON_SPECIES_LIST.length;

    if (this.input.isJustPressed('up')) {
      if (this.pokedexCursor > 0) {
        this.pokedexCursor--;
        if (this.pokedexCursor < this.pokedexScrollOffset) {
          this.pokedexScrollOffset--;
        }
        soundManager.playSelect();
      }
    }
    if (this.input.isJustPressed('down')) {
      if (this.pokedexCursor < listLen - 1) {
        this.pokedexCursor++;
        if (this.pokedexCursor >= this.pokedexScrollOffset + 7) {
          this.pokedexScrollOffset++;
        }
        soundManager.playSelect();
      }
    }

    if (this.input.isJustPressed('b') || this.input.isJustPressed('a')) {
      soundManager.playCancel();
      this.mode = 'START_MENU';
    }
  }

  // --- Mart Shop ---
  private updateMartShop() {
    if (this.input.isJustPressed('up')) {
      this.martCursor = (this.martCursor - 1 + this.martStock.length) % this.martStock.length;
      soundManager.playSelect();
    }
    if (this.input.isJustPressed('down')) {
      this.martCursor = (this.martCursor + 1) % this.martStock.length;
      soundManager.playSelect();
    }

    if (this.input.isJustPressed('b')) {
      soundManager.playCancel();
      this.mode = 'OVERWORLD';
      return;
    }

    if (this.input.isJustPressed('a')) {
      const selected = this.martStock[this.martCursor];
      if (this.overworld.player.money >= selected.price) {
        this.overworld.player.money -= selected.price;
        let existing = this.overworld.player.inventory.find((i) => i.id === selected.id);
        if (existing) {
          existing.count++;
        } else {
          this.overworld.player.inventory.push({ ...selected, count: 1 });
        }
        soundManager.playConfirm();
        this.martMessage = `Purchased 1 ${selected.name}! Thank you!`;
      } else {
        soundManager.playBump();
        this.martMessage = "You don't have enough money for that!";
      }
    }
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    this.toastTimer = 2500;
  }

  // --- Save / Load System ---
  public saveGame() {
    try {
      const data = {
        player: this.overworld.player,
        timestamp: Date.now(),
      };
      localStorage.setItem('pokemon_web_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  public loadGame(): boolean {
    try {
      const raw = localStorage.getItem('pokemon_web_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data && data.player && data.player.party && data.player.party.length > 0) {
        this.overworld.player = data.player;
        this.overworld.visualX = this.overworld.player.x * 16;
        this.overworld.visualY = this.overworld.player.y * 16;
        this.mode = 'OVERWORLD';
        soundManager.playOverworldBgm();
        this.showToast('Save data loaded! Welcome back!');
        return true;
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
    return false;
  }

  private endBattle(_result: 'win' | 'loss' | 'catch' | 'run') {
    this.battle = null;
    this.mode = 'OVERWORLD';
    soundManager.playOverworldBgm();
  }

  // --- Main Draw Loop ---
  private draw(animTime: number) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.ctx.clearRect(0, 0, cw, ch);

    switch (this.mode) {
      case 'STARTER_SELECT':
        this.drawStarterSelect(cw, ch);
        break;

      case 'OVERWORLD':
      case 'START_MENU':
        this.overworld.draw(this.ctx, cw, ch, animTime);
        this.drawOverworldHud(cw);
        if (this.mode === 'START_MENU') {
          this.drawStartMenu(cw, ch);
        }
        break;

      case 'BATTLE_TRANSITION':
        this.overworld.draw(this.ctx, cw, ch, animTime);
        const progress = this.transitionTimer / 1000;
        const flashPhase = Math.floor(progress * 8) % 2;
        if (flashPhase === 1) {
          this.ctx.fillStyle = '#000000';
          this.ctx.fillRect(0, 0, cw, ch);
        } else {
          this.ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
          this.ctx.fillRect(0, 0, cw, ch);
        }
        break;

      case 'BATTLE':
        if (this.battle) {
          this.battle.draw(this.ctx, cw, ch);
        }
        break;

      case 'POKEDEX_VIEW':
        this.drawPokedexView(cw, ch);
        break;

      case 'TRAINER_CARD':
        this.drawTrainerCard(cw, ch);
        break;

      case 'MART_SHOP':
        this.drawMartShop(cw, ch);
        break;
    }

    // Draw Toast Notification
    if (this.toastMessage) {
      this.drawToast(cw, ch);
    }
  }

  private drawStarterSelect(cw: number, ch: number) {
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, ch);
    bgGrad.addColorStop(0, '#1a3b5c');
    bgGrad.addColorStop(1, '#0e1d2e');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, cw, ch);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 13px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PROF. OAK: CHOOSE YOUR STARTER POKÉMON', cw / 2, 26);

    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = '#99ccff';
    this.ctx.fillText('Use [Left / Right] and press [A / Z / Enter] to choose', cw / 2, 42);

    const cardW = 90;
    const cardH = 135;
    const spacing = 14;
    const startX = (cw - (cardW * 3 + spacing * 2)) / 2;
    const cardY = 56;

    this.starters.forEach((s, idx) => {
      const cx = startX + idx * (cardW + spacing);
      const isSelected = this.starterCursor === idx;

      this.ctx.fillStyle = isSelected ? '#ffffff' : '#1e3247';
      this.ctx.fillRect(cx, cardY, cardW, cardH);

      this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#446688';
      this.ctx.lineWidth = isSelected ? 3 : 1;
      this.ctx.strokeRect(cx, cardY, cardW, cardH);

      this.ctx.fillStyle = isSelected ? '#eef4ff' : '#152538';
      this.ctx.beginPath();
      this.ctx.ellipse(cx + cardW / 2, cardY + 58, 32, 12, 0, 0, Math.PI * 2);
      this.ctx.fill();

      const sp = POKEMON_MAP.get(s.id);
      if (sp) {
        const img = SpriteLoader.getImage(sp.spriteFront);
        if (img) {
          this.ctx.drawImage(img, cx + 13, cardY + 12, 64, 64);
        }
      }

      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = isSelected ? '#111111' : '#ffffff';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText(s.name.toUpperCase(), cx + cardW / 2, cardY + 86);

      this.ctx.font = '9px monospace';
      this.ctx.fillStyle = isSelected ? '#0066cc' : '#88bbff';
      this.ctx.fillText(s.type, cx + cardW / 2, cardY + 102);

      if (isSelected) {
        this.ctx.fillStyle = '#ff2222';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText('▼ CHOSEN', cx + cardW / 2, cardY + 122);
      }
    });

    const chosen = this.starters[this.starterCursor];
    const descBoxY = cardY + cardH + 12;
    this.ctx.fillStyle = '#0f1a26';
    this.ctx.fillRect(startX, descBoxY, cardW * 3 + spacing * 2, 42);
    this.ctx.strokeStyle = '#446688';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(startX, descBoxY, cardW * 3 + spacing * 2, 42);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(chosen.desc, cw / 2, descBoxY + 24);

    this.ctx.textAlign = 'left';
  }

  private drawOverworldHud(cw: number) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, cw, 22);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 10px monospace';
    const leader = this.overworld.player.party[0];
    if (leader) {
      this.ctx.fillText(`LV${leader.level} ${leader.species.name} (${Math.ceil(leader.currentHp)}/${leader.maxHp} HP)`, 8, 15);
    }

    this.ctx.fillStyle = '#ffcc00';
    this.ctx.fillText(`$${this.overworld.player.money}`, cw - 150, 15);

    if (this.overworld.player.hasBoulderBadge) {
      this.ctx.fillStyle = '#99bbdd';
      this.ctx.fillText(`[★BADGE]`, cw - 95, 15);
    }

    this.ctx.fillStyle = '#66ff66';
    this.ctx.fillText(`[ESC]MENU`, cw - 48, 15);
  }

  private drawStartMenu(cw: number, _ch: number) {
    const menuW = 105;
    const menuH = 135;
    const menuX = cw - menuW - 10;
    const menuY = 28;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(menuX, menuY, menuW, menuH);

    this.ctx.strokeStyle = '#222222';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(menuX, menuY, menuW, menuH);

    this.startMenuItems.forEach((item, idx) => {
      const itemY = menuY + 20 + idx * 19;
      this.ctx.fillStyle = this.startMenuCursor === idx ? '#cc2222' : '#111111';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.fillText(item, menuX + 22, itemY);

      if (this.startMenuCursor === idx) {
        this.ctx.fillText('▶', menuX + 8, itemY);
      }
    });
  }

  // --- Draw Pokédex Screen ---
  private drawPokedexView(cw: number, ch: number) {
    // Red Pokédex frame
    this.ctx.fillStyle = '#c72b2b';
    this.ctx.fillRect(0, 0, cw, ch);

    // Header
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillText('POKÉDEX LORE ARCHIVE', 16, 20);

    const caughtCount = this.overworld.player.caughtPokemon.length;
    const seenCount = this.overworld.player.seenPokemon.length;
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = '#ffdd44';
    this.ctx.fillText(`SEEN: ${seenCount}   CAUGHT: ${caughtCount}`, cw - 155, 20);

    // Left List Box
    const listX = 10;
    const listY = 28;
    const listW = 125;
    const listH = 195;

    this.ctx.fillStyle = '#f8f8f8';
    this.ctx.fillRect(listX, listY, listW, listH);
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(listX, listY, listW, listH);

    const visibleItems = POKEMON_SPECIES_LIST.slice(this.pokedexScrollOffset, this.pokedexScrollOffset + 8);
    visibleItems.forEach((sp, idx) => {
      const itemIdx = this.pokedexScrollOffset + idx;
      const isSelected = this.pokedexCursor === itemIdx;
      const itemY = listY + 20 + idx * 22;

      const isCaught = this.overworld.player.caughtPokemon.includes(sp.id);
      const isSeen = isCaught || this.overworld.player.seenPokemon.includes(sp.id);

      if (isSelected) {
        this.ctx.fillStyle = '#ffe0b2';
        this.ctx.fillRect(listX + 2, itemY - 14, listW - 4, 20);
      }

      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillStyle = isCaught ? '#cc2222' : isSeen ? '#2255aa' : '#888888';

      const numStr = String(sp.id).padStart(3, '0');
      const icon = isCaught ? '★' : isSeen ? '○' : '-';
      const nameStr = isSeen ? sp.name.toUpperCase() : '---------';

      this.ctx.fillText(`${icon}#${numStr} ${nameStr.slice(0, 9)}`, listX + 6, itemY);
    });

    // Right Details Box
    const detailX = 145;
    const detailY = 28;
    const detailW = cw - detailX - 10;
    const detailH = 195;

    this.ctx.fillStyle = '#f0f5fa';
    this.ctx.fillRect(detailX, detailY, detailW, detailH);
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(detailX, detailY, detailW, detailH);

    const currentSpecies = POKEMON_SPECIES_LIST[this.pokedexCursor];
    const isSeen = this.overworld.player.seenPokemon.includes(currentSpecies.id) || this.overworld.player.caughtPokemon.includes(currentSpecies.id);
    const isCaught = this.overworld.player.caughtPokemon.includes(currentSpecies.id);

    if (isSeen) {
      // Sprite Screen
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(detailX + 8, detailY + 8, 64, 64);
      this.ctx.strokeStyle = '#888';
      this.ctx.strokeRect(detailX + 8, detailY + 8, 64, 64);

      const img = SpriteLoader.getImage(currentSpecies.spriteFront);
      if (img) {
        this.ctx.drawImage(img, detailX + 8, detailY + 8, 64, 64);
      }

      // Name & Number
      this.ctx.fillStyle = '#111';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText(`No. ${String(currentSpecies.id).padStart(3, '0')}`, detailX + 80, detailY + 22);
      this.ctx.fillText(currentSpecies.name.toUpperCase(), detailX + 80, detailY + 38);

      this.ctx.font = '9px monospace';
      this.ctx.fillStyle = '#666';
      this.ctx.fillText(currentSpecies.category, detailX + 80, detailY + 52);
      this.ctx.fillStyle = '#0055bb';
      this.ctx.fillText(currentSpecies.types.map((t) => t.toUpperCase()).join('/'), detailX + 80, detailY + 66);

      // Height / Weight
      this.ctx.fillStyle = '#222';
      this.ctx.font = '9px monospace';
      this.ctx.fillText(`HT: ${currentSpecies.height}  WT: ${currentSpecies.weight}`, detailX + 8, detailY + 88);

      // Lore Description Box
      this.ctx.fillStyle = '#e8eff5';
      this.ctx.fillRect(detailX + 6, detailY + 98, detailW - 12, 70);
      this.ctx.strokeStyle = '#aac';
      this.ctx.strokeRect(detailX + 6, detailY + 98, detailW - 12, 70);

      this.ctx.fillStyle = '#222';
      this.ctx.font = '8px monospace';
      this.wrapText(this.ctx, currentSpecies.entryLore, detailX + 10, detailY + 112, detailW - 20, 11);

      // Status Tag
      this.ctx.fillStyle = isCaught ? '#20aa40' : '#888';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText(isCaught ? 'STATUS: CAUGHT' : 'STATUS: SEEN ONLY', detailX + 10, detailY + 184);
    } else {
      // Unseen Mystery
      this.ctx.fillStyle = '#666';
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillText('??? UNKNOWN', detailX + 24, detailY + 90);
      this.ctx.font = '9px monospace';
      this.ctx.fillText('Encounter this Pokémon in the', detailX + 10, detailY + 115);
      this.ctx.fillText('wild or with a Trainer to', detailX + 10, detailY + 128);
      this.ctx.fillText('unlock its Pokédex profile.', detailX + 10, detailY + 141);
    }

    // Exit prompt
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '9px monospace';
    this.ctx.fillText('[B / A] RETURN TO MENU', 16, ch - 8);
  }

  // --- Draw Trainer Card ---
  private drawTrainerCard(cw: number, ch: number) {
    const cardX = 20;
    const cardY = 25;
    const cardW = cw - 40;
    const cardH = ch - 50;

    this.ctx.fillStyle = '#f5e4c8';
    this.ctx.fillRect(cardX, cardY, cardW, cardH);
    this.ctx.strokeStyle = '#8b5a2b';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(cardX, cardY, cardW, cardH);

    this.ctx.fillStyle = '#8b5a2b';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillText('OFFICIAL TRAINER CARD', cardX + 16, cardY + 22);

    this.ctx.fillStyle = '#111';
    this.ctx.font = '10px monospace';
    this.ctx.fillText('NAME: RED', cardX + 16, cardY + 50);
    this.ctx.fillText(`MONEY: $${this.overworld.player.money}`, cardX + 16, cardY + 70);
    this.ctx.fillText(`POKÉDEX: ${this.overworld.player.caughtPokemon.length} Caught / ${this.overworld.player.seenPokemon.length} Seen`, cardX + 16, cardY + 90);

    // Badges Shelf
    this.ctx.fillStyle = '#443322';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillText('GYM BADGES:', cardX + 16, cardY + 120);

    // 8 Badge Slots
    for (let i = 0; i < 8; i++) {
      const bx = cardX + 20 + i * 30;
      const by = cardY + 132;

      this.ctx.fillStyle = '#d2b48c';
      this.ctx.fillRect(bx, by, 22, 22);
      this.ctx.strokeStyle = '#8b5a2b';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(bx, by, 22, 22);

      if (i === 0 && this.overworld.player.hasBoulderBadge) {
        // Boulder Badge Octagon
        this.ctx.fillStyle = '#8a929a';
        this.ctx.beginPath();
        this.ctx.arc(bx + 11, by + 11, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f0c040';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('B', bx + 7, by + 15);
      } else {
        this.ctx.fillStyle = '#bb9977';
        this.ctx.font = '9px monospace';
        this.ctx.fillText('-', bx + 8, by + 15);
      }
    }

    if (this.overworld.player.hasBoulderBadge) {
      this.ctx.fillStyle = '#0066cc';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('★ BOULDER BADGE (Leader Brock - Pewter City)', cardX + 16, cardY + 172);
    }

    this.ctx.fillStyle = '#666';
    this.ctx.font = '9px monospace';
    this.ctx.fillText('[B] Back', cardX + cardW - 60, cardY + cardH - 12);
  }

  // --- Draw Mart Shop ---
  private drawMartShop(cw: number, ch: number) {
    this.ctx.fillStyle = '#225588';
    this.ctx.fillRect(0, 0, cw, ch);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillText('POKÉMON MART - PEWTER CITY', 16, 22);

    this.ctx.fillStyle = '#ffdd44';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillText(`YOUR CASH: $${this.overworld.player.money}`, cw - 165, 22);

    // Items list
    const listX = 14;
    const listY = 32;
    const listW = cw - 28;
    const listH = 135;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(listX, listY, listW, listH);
    this.ctx.strokeStyle = '#102844';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(listX, listY, listW, listH);

    this.martStock.forEach((item, idx) => {
      const itemY = listY + 22 + idx * 24;
      const isSelected = this.martCursor === idx;

      if (isSelected) {
        this.ctx.fillStyle = '#e0efff';
        this.ctx.fillRect(listX + 2, itemY - 15, listW - 4, 22);
      }

      this.ctx.fillStyle = isSelected ? '#cc2222' : '#111111';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.fillText(`${isSelected ? '▶ ' : '  '}${item.name.toUpperCase()}`, listX + 10, itemY);

      this.ctx.fillStyle = '#2255aa';
      this.ctx.fillText(`$${item.price}`, listX + 175, itemY);

      const owned = this.overworld.player.inventory.find((i) => i.id === item.id)?.count || 0;
      this.ctx.fillStyle = '#666';
      this.ctx.fillText(`Bag: x${owned}`, listX + 230, itemY);
    });

    // Message box at bottom
    const msgY = ch - 62;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(listX, msgY, listW, 52);
    this.ctx.strokeStyle = '#102844';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(listX, msgY, listW, 52);

    this.ctx.fillStyle = '#111111';
    this.ctx.font = '10px monospace';
    this.ctx.fillText(this.martMessage, listX + 12, msgY + 22);

    const activeItem = this.martStock[this.martCursor];
    if (activeItem) {
      this.ctx.fillStyle = '#555555';
      this.ctx.font = '9px monospace';
      this.ctx.fillText(activeItem.description, listX + 12, msgY + 38);
    }
  }

  // --- Toast Notification Box ---
  private drawToast(cw: number, _ch: number) {
    if (!this.toastMessage) return;

    this.ctx.fillStyle = 'rgba(10, 20, 30, 0.92)';
    this.ctx.fillRect(16, 26, cw - 32, 28);
    this.ctx.strokeStyle = '#ffcc00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(16, 26, cw - 32, 28);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 9px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.toastMessage, cw / 2, 43);
    this.ctx.textAlign = 'left';
  }

  // Helper: word wrap text for Pokédex entry lore
  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  }
}
