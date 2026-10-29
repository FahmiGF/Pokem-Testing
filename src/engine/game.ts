import { soundManager } from '../audio/sound';
import { POKEMON_MAP, POKEMON_SPECIES_LIST, createActivePokemon, getBalancedLevel } from '../data/pokemon';
import type { ActivePokemon, InventoryItem, PlayerData } from '../types';
import { ArcadeSystem, type ArcadeGameId } from './arcade';
import { BattleSystem } from './battle';
import { CookingGame } from './cooking';
import { ExpShopSystem } from './expShop';
import { FishingGame } from './fishing';
import { InputHandler } from './input';
import { KartRacingGame } from './kartRacing';
import { MountShop } from './mountShop';
import { Overworld } from './overworld';
import { SoulsBossGame } from './soulsBoss';
import { SpriteLoader } from './spriteLoader';
import { TeleportMenu } from './teleportMenu';
import { WORLD_BOSS_INTERVAL_MS, WORLD_BOSS_NAME, WORLD_BOSS_SPECIES_ID } from './worldSystems';
import { FARM_PLOT_COORDS, FARM_SEED_STOCK, LEVEL_SERVICE_STOCK } from './zones';

export type GameMode =
  | 'STARTER_SELECT'
  | 'OVERWORLD'
  | 'BATTLE_TRANSITION'
  | 'BATTLE'
  | 'START_MENU'
  | 'POKEDEX_VIEW'
  | 'TRAINER_CARD'
  | 'MART_SHOP'
  | 'EXP_SHOP'
  | 'KART_RACING'
  | 'DARK_SOULS_BOSS'
  | 'FISHING'
  | 'COOKING'
  | 'MOUNT_SHOP'
  | 'TELEPORT_MAP'
  | 'ARCADE';

export class Game {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public input: InputHandler;
  public overworld: Overworld;
  public battle: BattleSystem | null = null;
  public expShop: ExpShopSystem | null = null;
  public kartGame: KartRacingGame | null = null;
  public soulsGame: SoulsBossGame | null = null;
  public fishingGame: FishingGame | null = null;
  public cookingGame: CookingGame | null = null;
  public mountShop: MountShop | null = null;
  public teleportMenu: TeleportMenu | null = null;
  public arcade: ArcadeSystem | null = null;
  public worldBossNextAt: number = Date.now() + WORLD_BOSS_INTERVAL_MS;
  public worldBossCountdown: number = WORLD_BOSS_INTERVAL_MS;
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
  public readonly startMenuItems = [
    'POKÉDEX',
    'POKÉMON',
    'MOUNT SHOP',
    'BAG',
    'FISHING',
    'COOKING',
    'ARCADE',
    'EXP SHOP',
    'TELEPORT',
    'KART RACING',
    'SOULS BOSS',
    'TRAINER',
    'SAVE',
    'EXIT',
  ];

  // Quick Inventory Hotbar state (Bottom Center HUD)
  public quickSlotIndex: number = 0;

  // Pokédex View state
  public pokedexCursor: number = 0;
  public pokedexScrollOffset: number = 0;

  // Mart / Shop state
  public martCursor: number = 0;
  public martType: 'poke' | 'seed' | 'level' = 'poke';
  public readonly pokeMartStock: InventoryItem[] = [
    { id: 'pokeball', name: 'Poké Ball', count: 1, price: 200, type: 'pokeball', description: 'Standard ball for catching wild Pokémon.', category: 'BALL', icon: 'PB' },
    { id: 'greatball', name: 'Great Ball', count: 1, price: 600, type: 'pokeball', description: '1.5x higher catch rate than standard Poké Ball.', category: 'BALL', icon: 'GB' },
    { id: 'potion', name: 'Potion', count: 1, price: 300, type: 'potion', description: 'Restores 20 HP to a wounded Pokémon.', category: 'MEDICINE', icon: 'P' },
    { id: 'super_potion', name: 'Super Potion', count: 1, price: 700, type: 'potion', description: 'Restores 50 HP to a wounded Pokémon.', category: 'MEDICINE', icon: 'SP' },
    { id: 'revive', name: 'Revive', count: 1, price: 1500, type: 'revive', description: 'Revitalizes a fainted Pokémon to half max HP.', category: 'SPECIAL', icon: 'RV' },
  ];
  public martStock: InventoryItem[] = this.pokeMartStock;
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

    this.overworld.onOpenMart = (shopType) => {
      soundManager.playConfirm();
      this.martCursor = 0;
      this.martType = shopType;
      this.martStock =
        shopType === 'seed'
          ? FARM_SEED_STOCK
          : shopType === 'level'
            ? LEVEL_SERVICE_STOCK
            : this.pokeMartStock;
      this.martMessage =
        shopType === 'seed'
          ? 'Seeds for sale! Plant them in the soil plots.'
          : shopType === 'level'
            ? 'Training services! Level up or heal your team.'
            : 'What would you like to purchase?';
      this.mode = 'MART_SHOP';
    };

    this.overworld.onOpenExpShop = () => {
      this.openExpShop();
    };

    this.overworld.onOpenKartRacing = () => {
      this.openKartRacing();
    };

    this.overworld.onOpenSoulsBoss = () => {
      this.openSoulsBoss();
    };

    this.overworld.onOpenFishing = () => {
      this.openFishing();
    };

    this.overworld.onOpenCooking = () => {
      this.openCooking();
    };

    this.overworld.onOpenMountShop = () => {
      this.openMountShop();
    };

    this.overworld.onMountMessage = (message) => {
      this.showToast(message);
    };

    this.overworld.onOpenTeleport = () => {
      this.openTeleportMenu();
    };

    this.overworld.onOpenArcade = () => {
      this.openArcade();
    };

    this.overworld.onCoinCollected = (amount, isGem) => {
      if (isGem) this.showToast('💎 Prismatic Gem collected!');
      else this.showToast(`🪙 +$${amount}`);
    };

    this.overworld.onWorldBossPortal = () => {
      this.showToast('👑 You entered the Distortion Arena! Face Giratina!');
      soundManager.playSoulsBossBgm();
    };

    this.overworld.onWorldBossBattle = () => {
      this.startWorldBossBattle();
    };

    this.overworld.onOpenMenu = () => {
      this.startMenuCursor = 0;
      this.mode = 'START_MENU';
    };

    this.overworld.onZoneChanged = (zoneName) => {
      this.showToast(`ZONE: ${zoneName}`);
      soundManager.playZoneBgm(this.overworld.currentZoneId, zoneName);
    };

    // Canvas click / tap listener for Bottom-Center Quick Inventory Hotbar
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      if (this.mode === 'OVERWORLD') {
        const totalW = 146;
        const startX = Math.floor((this.canvas.width - totalW) / 2);
        const startY = this.canvas.height - 27;
        if (clickY >= startY && clickY <= startY + 24 && clickX >= startX && clickX <= startX + totalW) {
          const slot = Math.floor((clickX - startX) / 29);
          if (slot >= 0 && slot < 5) {
            this.quickSlotIndex = slot;
            soundManager.playSelect();
            this.useActiveHotbarItem();
          }
        }
      }
    });

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
        this.updateOverworldHotbar();
        this.updateWorldBossEvent();
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

      case 'EXP_SHOP':
        if (this.expShop) {
          this.expShop.update(this.input, deltaMs);
        }
        break;

      case 'KART_RACING':
        if (this.kartGame) {
          this.kartGame.update(this.input, deltaMs);
        }
        break;

      case 'DARK_SOULS_BOSS':
        if (this.soulsGame) {
          this.soulsGame.update(this.input, deltaMs);
        }
        break;

      case 'FISHING':
        if (this.fishingGame) {
          this.fishingGame.update(this.input, deltaMs);
        }
        break;

      case 'COOKING':
        if (this.cookingGame) {
          this.cookingGame.update(this.input, deltaMs);
        }
        break;

      case 'MOUNT_SHOP':
        if (this.mountShop) {
          this.mountShop.update(this.input, deltaMs);
        }
        break;

      case 'TELEPORT_MAP':
        if (this.teleportMenu) {
          this.teleportMenu.update(this.input, deltaMs);
        }
        break;

      case 'ARCADE':
        if (this.arcade) {
          this.arcade.update(this.input, deltaMs);
        }
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

      soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
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

        case 'POKÉMON': {
          this.mode = 'OVERWORLD';
          const party = this.overworld.player.party;
          const lines = party.length > 0
            ? party.map((p, i) => `${i + 1}. ${p.species.name.toUpperCase()} Lv.${p.level} - HP ${p.currentHp}/${p.maxHp}`)
            : ['Your party is empty.'];
          this.overworld.startDialog('POKÉMON', lines);
          break;
        }

        case 'BAG': {
          this.mode = 'OVERWORLD';
          const p = this.overworld.player;
          const items = p.inventory.filter((i) => i.count > 0);
          const lines = [`Money: $${p.money}   Gems: ${p.gems || 0}`];
          if (items.length === 0) lines.push('Your bag is empty.');
          else items.forEach((i) => lines.push(`${i.name} x${i.count}`));
          this.overworld.startDialog('BAG', lines);
          break;
        }

        case 'FISHING':
          this.openFishing();
          break;

        case 'COOKING':
          this.openCooking();
          break;

        case 'ARCADE':
          this.openArcade();
          break;

        case 'EXP SHOP':
          this.openExpShop();
          break;

        case 'MOUNT SHOP':
          this.openMountShop();
          break;

        case 'TELEPORT':
          this.openTeleportMenu();
          break;

        case 'KART RACING':
          this.openKartRacing();
          break;

        case 'SOULS BOSS':
          this.openSoulsBoss();
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

  public openExpShop() {
    soundManager.playConfirm();
    this.expShop = new ExpShopSystem(this.overworld.player);
    this.expShop.onClose = () => {
      this.mode = 'OVERWORLD';
    };
    this.mode = 'EXP_SHOP';
  }

  public openKartRacing() {
    soundManager.stopBgm();
    soundManager.playConfirm();
    this.kartGame = new KartRacingGame(this.overworld.player);
    this.kartGame.onClose = (rewardExp, rewardMoney) => {
      this.mode = 'OVERWORLD';
      soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
      if (rewardExp > 0 || rewardMoney > 0) {
        this.showToast(`KART RACE FINISHED! +${rewardExp} EXP & +$${rewardMoney}!`);
      }
    };
    this.mode = 'KART_RACING';
  }

  public openSoulsBoss() {
    soundManager.stopBgm();
    soundManager.playConfirm();
    this.soulsGame = new SoulsBossGame(this.overworld.player);
    this.soulsGame.onClose = (rewardExp, rewardMoney) => {
      this.mode = 'OVERWORLD';
      soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
      if (rewardExp > 0 || rewardMoney > 0) {
        this.showToast(`SOULS BOSS VANQUISHED! +${rewardExp} EXP & +$${rewardMoney}!`);
      }
    };
    this.mode = 'DARK_SOULS_BOSS';
  }

  public openFishing() {
    soundManager.stopBgm();
    soundManager.playConfirm();
    soundManager.playWaterBgm();
    this.fishingGame = new FishingGame(this.overworld.player);
    this.fishingGame.onClose = (rewardExp, rewardGems) => {
      this.mode = 'OVERWORLD';
      soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
      if (rewardExp > 0 || rewardGems > 0) {
        this.showToast(`FISHING SESSION: +${rewardExp} EXP & +💎 ${rewardGems} GEMS!`);
      }
    };
    this.mode = 'FISHING';
  }

  public openCooking() {
    soundManager.playConfirm();
    this.cookingGame = new CookingGame(this.overworld.player);
    this.cookingGame.onClose = (rewardExp, rewardGems) => {
      this.mode = 'OVERWORLD';
      soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
      if (rewardExp > 0 || rewardGems > 0) {
        this.showToast(`COOKING SESSION: +${rewardExp} EXP & +💎 ${rewardGems} GEMS!`);
      }
    };
    this.mode = 'COOKING';
  }

  public openMountShop() {
    soundManager.stopBgm();
    soundManager.playShopOpen();
    this.mountShop = new MountShop(this.overworld.player);
    this.mountShop.onClose = () => {
      this.mode = 'OVERWORLD';
      soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
    };
    this.mountShop.onMountEquipped = (name) => {
      this.showToast(`🐴 ${name} equipped! Press [R] to ride.`);
    };
    this.mode = 'MOUNT_SHOP';
  }

  public openArcade(gameId?: ArcadeGameId) {
    soundManager.stopBgm();
    soundManager.playPokedexOpen();
    this.arcade = new ArcadeSystem(this.overworld.player);
    this.arcade.onClose = () => {
      this.arcade = null;
      this.mode = 'OVERWORLD';
      soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
      this.saveGame();
    };
    this.arcade.onTeleport = () => this.openTeleportMenu('ARCADE');
    this.mode = 'ARCADE';
    if (gameId) this.arcade.startDirect(gameId);
  }

  public openTeleportMenu(returnMode: 'OVERWORLD' | 'ARCADE' = 'OVERWORLD') {
    soundManager.playConfirm();
    const unlocked = !!this.overworld.player.teleportUnlocked;
    const cost = 150;
    const menu = new TeleportMenu(unlocked, cost);
    this.teleportMenu = menu;

    menu.onWarpCheck = () => {
      const player = this.overworld.player;
      if (player.money < cost) {
        menu.message = `Not enough money! Need $${cost - player.money} more.`;
        menu.messageTimer = 2600;
        soundManager.playBump();
        return false;
      }
      player.money -= cost;
      return true;
    };

    menu.onClose = () => {
      this.mode = returnMode;
    };

    menu.onSelect = (zoneId, x, y) => {
      this.mode = 'OVERWORLD';
      this.arcade = null;
      this.overworld.enterZone(zoneId, x, y, 'down', true);
      soundManager.playZoneUnlock();
      const fee = unlocked ? '' : ` (-$${cost})`;
      this.showToast(`WARPED TO ${this.overworld.zoneName.toUpperCase()}!${fee}`);
    };
    this.mode = 'TELEPORT_MAP';
  }

  private updateWorldBossEvent() {
    const now = Date.now();
    this.worldBossCountdown = Math.max(0, this.worldBossNextAt - now);
    if (now < this.worldBossNextAt) return;

    this.worldBossNextAt = now + WORLD_BOSS_INTERVAL_MS;
    this.worldBossCountdown = WORLD_BOSS_INTERVAL_MS;

    if (this.overworld.map.isInterior || this.overworld.currentZoneId === 'zone_worldboss') {
      // Retry in a minute; rifts only tear open outdoors.
      this.worldBossNextAt = now + 60_000;
      return;
    }

    if (this.overworld.worldBossPortal) return;

    const px = this.overworld.player.x;
    const py = this.overworld.player.y;
    const map = this.overworld.map;

    for (let radius = 2; radius <= 4; radius++) {
      for (let attempt = 0; attempt < 14; attempt++) {
        const dx = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
        const dy = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
        const tx = px + dx;
        const ty = py + dy;
        if (tx < 1 || ty < 1 || tx >= map.width - 1 || ty >= map.height - 1) continue;
        if (map.isSolid(tx, ty)) continue;
        if (map.getExitAt(tx, ty)) continue;

        this.overworld.spawnWorldBossPortal(tx, ty);
        soundManager.playWorldBossWarning();
        this.showToast('⚠ WORLD BOSS RIFT OPENED NEARBY! Step into the rift!');
        return;
      }
    }
  }

  private startWorldBossBattle() {
    const player = this.overworld.player;
    const level = Math.max(50, getBalancedLevel(50, player.party, player.badges));
    const boss = createActivePokemon(WORLD_BOSS_SPECIES_ID, level);
    soundManager.playWorldBossWarning();
    this.startTrainerBattleTransition(
      'world_boss_giratina',
      WORLD_BOSS_NAME,
      [boss],
      6000,
      undefined
    );
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
      if (this.overworld.player.money < selected.price) {
        soundManager.playBump();
        this.martMessage = "You don't have enough money for that!";
        return;
      }

      // Training services are applied immediately instead of stored in the bag.
      if (selected.service) {
        const result = this.applyTrainingService(selected.service);
        if (!result) {
          soundManager.playBump();
          this.martMessage = result === false ? 'Your team cannot benefit from that right now.' : 'Something went wrong.';
          return;
        }
        this.overworld.player.money -= selected.price;
        soundManager.playCashRegister();
        this.martMessage = result;
        return;
      }

      this.overworld.player.money -= selected.price;
      const existing = this.overworld.player.inventory.find((i) => i.id === selected.id);
      if (existing) {
        existing.count++;
      } else {
        this.overworld.player.inventory.push({ ...selected, count: 1 });
      }
      soundManager.playCashRegister();
      this.martMessage = `Purchased 1 ${selected.name}! Thank you!`;
    }
  }

  private applyTrainingService(service: 'levelup' | 'heal' | 'speed'): string | false {
    const player = this.overworld.player;

    if (service === 'heal') {
      player.party.forEach((p) => {
        p.currentHp = p.maxHp;
        p.moves.forEach((m) => (m.currentPp = m.move.pp));
      });
      soundManager.playHealChime();
      return 'Your whole team is fully healed and ready!';
    }

    if (service === 'levelup') {
      const lead = player.party[0];
      if (!lead) return false;

      lead.level++;
      lead.currentExp = 0;
      lead.nextLevelExp = Math.floor(Math.pow(lead.level, 3) * 0.8) + 15;

      const oldMaxHp = lead.maxHp;
      lead.maxHp = Math.floor(((2 * lead.species.baseStats.hp + 31) * lead.level) / 100) + lead.level + 10;
      lead.currentHp += lead.maxHp - oldMaxHp;

      lead.stats.attack = Math.floor(((2 * lead.species.baseStats.attack + 31) * lead.level) / 100) + 5;
      lead.stats.defense = Math.floor(((2 * lead.species.baseStats.defense + 31) * lead.level) / 100) + 5;
      lead.stats.speed = Math.floor(((2 * lead.species.baseStats.speed + 31) * lead.level) / 100) + 5;
      lead.stats.special = Math.floor(((2 * lead.species.baseStats.special + 31) * lead.level) / 100) + 5;

      soundManager.playLevelUp();
      return `${lead.species.name} grew to Level ${lead.level}!`;
    }

    return false;
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    this.toastTimer = 2500;
  }

  // --- Save / Load System ---
  public saveGame() {
    try {
      const data = {
        player: { ...this.overworld.player, mounted: false, zoneId: this.overworld.currentZoneId },
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
        const defaults = this.overworld.player;
        const saved = data.player;

        // Migrate old saves: merge with defaults so new fields exist.
        const player: PlayerData = {
          ...defaults,
          ...saved,
          hasBoulderBadge: !!saved.hasBoulderBadge,
          hasCascadeBadge: !!saved.hasCascadeBadge,
          hasThunderBadge: !!saved.hasThunderBadge,
          hasEarthBadge: !!saved.hasEarthBadge,
          hasFireBadge: !!saved.hasFireBadge,
          hasGrassBadge: !!saved.hasGrassBadge,
          zoneId: saved.zoneId || 'world',
          farmPlots:
            Array.isArray(saved.farmPlots) && saved.farmPlots.length === FARM_PLOT_COORDS.length
              ? saved.farmPlots
              : defaults.farmPlots,
          defeatedTrainers: saved.defeatedTrainers || [],
          seenPokemon: saved.seenPokemon || [],
          caughtPokemon: saved.caughtPokemon || [],
          inventory: saved.inventory || defaults.inventory,
          expTokens: saved.expTokens !== undefined ? saved.expTokens : 600,
          gems: saved.gems !== undefined ? saved.gems : 10,
          fishCaught: saved.fishCaught || 0,
          dishesCooked: saved.dishesCooked || 0,
          coinsCollected: saved.coinsCollected || 0,
          ownedMounts: Array.isArray(saved.ownedMounts) ? saved.ownedMounts : [],
          activeMount: saved.activeMount || null,
          mounted: false,
          teleportUnlocked: !!saved.teleportUnlocked,
          worldBossDefeated: !!saved.worldBossDefeated,
          worldBossWins: saved.worldBossWins || 0,
          kartStats: saved.kartStats || { speedUpgrades: 0, nitroCharges: 3, wins: 0 },
          soulsStats: saved.soulsStats || { estusCharges: 4, estusLevel: 1, bossVictories: 0, swordUpgrade: 0, rollUpgrade: 0 },
        };

        this.overworld.player = player;
        const zoneId = player.zoneId || 'world';
        this.overworld.enterZone(zoneId, player.x, player.y, player.direction, true);
        this.mode = 'OVERWORLD';
        soundManager.playZoneBgm(zoneId, this.overworld.zoneName);
        this.showToast(`Save loaded! Welcome back to ${this.overworld.zoneName}!`);
        return true;
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
    return false;
  }

  private endBattle(result: 'win' | 'loss' | 'catch' | 'run') {
    const npcId = this.battle?.npcId || '';
    this.battle = null;
    this.mode = 'OVERWORLD';

    if (result === 'win' && npcId.startsWith('world_boss')) {
      const player = this.overworld.player;
      player.worldBossDefeated = true;
      player.teleportUnlocked = true;
      player.worldBossWins = (player.worldBossWins || 0) + 1;
      player.gems = (player.gems || 0) + 5;
      player.expTokens = (player.expTokens || 0) + 300;
      player.money += 2500;

      this.overworld.clearWorldBossPortal();
      this.overworld.worldBossActive = false;
      this.worldBossNextAt = Date.now() + WORLD_BOSS_INTERVAL_MS;
      this.worldBossCountdown = WORLD_BOSS_INTERVAL_MS;

      soundManager.playBossDefeat();
      soundManager.playZoneUnlock();
      this.showToast('👑 WORLD BOSS DEFEATED! Teleport Grid ONLINE! +💎5 +$2500 +300 EXP');
    }

    if (result === 'loss') {
      // Whiteout: return to the Pallet Town care station, fully healed.
      this.overworld.player.mounted = false;
      if (this.overworld.currentZoneId !== 'world') {
        this.overworld.enterZone('world', 16, 59, 'down', true);
      } else {
        this.overworld.player.x = 16;
        this.overworld.player.y = 59;
      }
      soundManager.playFaint();
      this.showToast('You blacked out! Rested at Pallet Town Care Station.');
    }

    soundManager.playZoneBgm(this.overworld.currentZoneId, this.overworld.zoneName);
  }

  // --- Main Draw Loop ---
  private draw(animTime: number) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.ctx.clearRect(0, 0, cw, ch);

    switch (this.mode) {
      case 'STARTER_SELECT':
        this.drawStarterSelect(cw, ch, animTime);
        break;

      case 'OVERWORLD':
      case 'START_MENU':
        this.overworld.draw(this.ctx, cw, ch, animTime);
        this.drawOverworldHud(cw);
        this.drawObjectiveTracker(cw);
        if (this.mode === 'OVERWORLD' && !this.overworld.currentDialog) {
          this.drawQuickInventoryHotbar(cw, ch);
        }
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
          this.battle.draw(this.ctx, cw, ch, animTime);
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

      case 'EXP_SHOP':
        if (this.expShop) {
          this.expShop.draw(this.ctx, cw, ch);
        }
        break;

      case 'KART_RACING':
        if (this.kartGame) {
          this.kartGame.draw(this.ctx, cw, ch);
        }
        break;

      case 'DARK_SOULS_BOSS':
        if (this.soulsGame) {
          this.soulsGame.draw(this.ctx, cw, ch);
        }
        break;

      case 'FISHING':
        if (this.fishingGame) {
          this.fishingGame.draw(this.ctx, cw, ch);
        }
        break;

      case 'COOKING':
        if (this.cookingGame) {
          this.cookingGame.draw(this.ctx, cw, ch);
        }
        break;

      case 'MOUNT_SHOP':
        if (this.mountShop) {
          this.mountShop.draw(this.ctx, cw, ch);
        }
        break;

      case 'TELEPORT_MAP':
        if (this.teleportMenu) {
          this.teleportMenu.draw(this.ctx, cw, ch);
        }
        break;

      case 'ARCADE':
        if (this.arcade) {
          this.arcade.draw(this.ctx);
        }
        break;
    }

    // Draw Toast Notification (never over the full-screen start menu).
    if (
      this.toastMessage &&
      this.mode !== 'START_MENU' &&
      this.mode !== 'STARTER_SELECT' &&
      this.mode !== 'ARCADE'
    ) {
      this.drawToast(cw, ch);
    }
  }

  private drawStarterSelect(cw: number, ch: number, animTimeParam?: number) {
    const animTime = animTimeParam ?? Date.now();
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, ch);
    bgGrad.addColorStop(0, '#102236');
    bgGrad.addColorStop(1, '#07101c');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, cw, ch);

    // Motion Background: Drifting ambient star motes
    this.ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
    for (let s = 0; s < 12; s++) {
      const starX = ((animTime * 0.02 + s * 30) % (cw + 20)) - 10;
      const starY = (s * 22 + Math.sin(animTime * 0.003 + s) * 8) % ch;
      this.ctx.fillRect(starX, starY, 2, 2);
    }

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PROF. OAK: CHOOSE YOUR STARTER POKÉMON', cw / 2, 26);

    this.ctx.font = '9px monospace';
    this.ctx.fillStyle = '#00e5ff';
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

      // Motion play: gentle idle bobbing
      const bob = Math.sin(animTime * 0.004 + idx * 1.5) * 3;

      const sp = POKEMON_MAP.get(s.id);
      if (sp) {
        const img = SpriteLoader.getImage(sp.spriteFront, sp.id, sp.color);
        if (img) {
          this.ctx.drawImage(img, cx + 13, cardY + 12 + bob, 64, 64);
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
    // Modern Glassmorphism Top Bar
    this.ctx.fillStyle = 'rgba(10, 16, 28, 0.88)';
    this.ctx.fillRect(4, 4, cw - 8, 25);
    this.ctx.strokeStyle = '#00e5ff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(4, 4, cw - 8, 25);

    // Left: Leader Pokémon Mini-HUD
    const leader = this.overworld.player.party[0];
    if (leader) {
      // Level Badge
      this.ctx.fillStyle = '#ff3d00';
      this.ctx.fillRect(8, 7, 24, 11);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 7px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`L${leader.level}`, 20, 15);

      // Name
      this.ctx.textAlign = 'left';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 8px monospace';
      const shortName = leader.species.name.length > 7 ? leader.species.name.slice(0, 6) + '.' : leader.species.name;
      this.ctx.fillText(shortName, 36, 16);

      // Mini Health Bar
      const hpRatio = Math.max(0, leader.currentHp / leader.maxHp);
      const hpCol = hpRatio > 0.5 ? '#00e676' : hpRatio > 0.2 ? '#ffb300' : '#e53935';
      this.ctx.fillStyle = '#222';
      this.ctx.fillRect(36, 20, 36, 4);
      this.ctx.fillStyle = hpCol;
      this.ctx.fillRect(36, 20, Math.ceil(36 * hpRatio), 4);

      // Party Dots (6 slots)
      for (let i = 0; i < 6; i++) {
        const mon = this.overworld.player.party[i];
        this.ctx.fillStyle = !mon ? '#455a64' : mon.currentHp > 0 ? '#00e676' : '#e53935';
        this.ctx.beginPath();
        this.ctx.arc(78 + i * 5, 22, 1.8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Center: Zone Location Badge
    this.ctx.fillStyle = '#162238';
    this.ctx.fillRect(112, 7, 86, 18);
    this.ctx.strokeStyle = '#29446d';
    this.ctx.strokeRect(112, 7, 86, 18);

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#64b5f6';
    this.ctx.font = 'bold 6.5px monospace';
    const zoneStr = this.overworld.zoneName.toUpperCase();
    const truncatedZone = zoneStr.length > 13 ? zoneStr.slice(0, 12) + '…' : zoneStr;
    this.ctx.fillText(`📍 ${truncatedZone}`, 155, 19);

    // Right: Currency ($ and EXP Tokens and GEMS)
    const tokens = this.overworld.player.expTokens || 0;
    const gems = this.overworld.player.gems || 0;
    const coins = this.overworld.player.coinsCollected || 0;
    this.ctx.textAlign = 'right';

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 7.5px monospace';
    this.ctx.fillText(`$${this.overworld.player.money}`, cw - 50, 13);

    this.ctx.fillStyle = '#00e5ff';
    this.ctx.font = 'bold 6px monospace';
    this.ctx.fillText(`🪙${coins} ✦${tokens} 💎${gems}`, cw - 50, 22);

    // Menu Shortcut Pill
    this.ctx.fillStyle = '#263238';
    this.ctx.fillRect(cw - 46, 7, 40, 18);
    this.ctx.strokeStyle = '#455a64';
    this.ctx.strokeRect(cw - 46, 7, 40, 18);
    this.ctx.fillStyle = '#eceff1';
    this.ctx.font = 'bold 7px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MENU', cw - 26, 19);

    // World Boss countdown (bottom-left, clear of the centered hotbar).
    // Hidden while a dialog box is open so it never overlaps the chat panel.
    if (this.overworld.currentDialog) return;

    const ch = this.canvas.height;
    const remaining = Math.max(0, this.worldBossNextAt - Date.now());
    const elapsed = 1 - remaining / WORLD_BOSS_INTERVAL_MS;
    const mm = Math.floor(remaining / 60000);
    const ss = Math.floor((remaining % 60000) / 1000)
      .toString()
      .padStart(2, '0');

    this.ctx.fillStyle = 'rgba(24, 8, 34, 0.9)';
    this.ctx.fillRect(4, ch - 33, 80, 29);
    this.ctx.strokeStyle = '#ba68c8';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(4, ch - 33, 80, 29);

    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#e040fb';
    this.ctx.font = 'bold 6px monospace';
    this.ctx.fillText('👑 WORLD BOSS', 8, ch - 23);

    this.ctx.fillStyle = '#ce93d8';
    this.ctx.font = 'bold 7px monospace';
    const portalHere =
      !!this.overworld.worldBossPortal &&
      this.overworld.worldBossPortal.zoneId === this.overworld.currentZoneId;
    const portalText = portalHere ? 'RIFT OPEN!' : `${mm}:${ss}`;
    this.ctx.fillText(portalText, 8, ch - 13);

    // Rift charge bar
    this.ctx.fillStyle = '#2a1a33';
    this.ctx.fillRect(8, ch - 10, 72, 3);
    this.ctx.fillStyle = portalHere ? '#e040fb' : '#7b1fa2';
    this.ctx.fillRect(8, ch - 10, Math.floor(72 * Math.min(1, Math.max(0, elapsed))), 3);
  }

  // --- Dynamic Story Objective (Top Left Corner HUD) ---
  public getStoryObjective(): { title: string; desc: string } {
    const p = this.overworld.player;
    if (this.overworld.currentZoneId === 'zone_cave') {
      return { title: 'CRYSTAL CAVERN', desc: 'Mine gems 💎, fish underground, & explore!' };
    }
    if (this.overworld.currentZoneId === 'zone_ice') {
      return { title: 'FROSTPEAK SUMMIT', desc: 'Cross the ice, fish the lake, & find Lapras.' };
    }
    if (this.overworld.currentZoneId === 'zone_marsh') {
      return { title: 'TOXIC MARSH', desc: 'Brave the fog for rare Poison-type Pokémon.' };
    }
    if (this.overworld.currentZoneId === 'zone_sky') {
      return { title: 'SKY PILLAR', desc: 'Climb the clouds and challenge the dragons.' };
    }
    if (p.badges === 0) {
      if (p.defeatedTrainers.includes('gym_leader_brock')) {
        return { title: 'CRYSTAL PASS', desc: 'Visit Mt. Moon Cavern or explore Cerulean.' };
      }
      if (this.overworld.currentZoneId === 'gym_rock' || this.overworld.currentZoneId.includes('pewter')) {
        return { title: 'PEWTER GYM', desc: 'Challenge Brock for your 1st Boulder Badge!' };
      }
      if (p.defeatedTrainers.includes('trainer_joey')) {
        return { title: 'ROUTE 1 TRAIL', desc: 'March North through Route 1 to Pewter City.' };
      }
      return { title: 'BEGIN JOURNEY', desc: 'Explore Pallet Town, fish, & cook dishes!' };
    } else if (p.badges === 1) {
      return { title: 'CASCADE GYM', desc: 'Journey East to Cerulean Gym (Misty).' };
    } else if (p.badges === 2) {
      return { title: 'THUNDER PORT', desc: 'Head South to Vermilion Port & Lt. Surge.' };
    } else {
      return { title: 'CHAMPION TRIAL', desc: 'Master 3D Kart Grand Prix & Slay Giratina!' };
    }
  }

  private drawObjectiveTracker(_cw: number) {
    const obj = this.getStoryObjective();
    const boxX = 6;
    const boxY = 32;
    const boxW = 176;
    const boxH = 26;

    this.ctx.fillStyle = 'rgba(8, 14, 24, 0.88)';
    this.ctx.fillRect(boxX, boxY, boxW, boxH);
    this.ctx.strokeStyle = '#00e5ff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Glowing Objective Header
    this.ctx.fillStyle = '#ffea00';
    this.ctx.font = 'bold 6.5px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`🎯 ${obj.title}`, boxX + 6, boxY + 9);

    // Objective Description
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '6px monospace';
    const descText = obj.desc.length > 44 ? obj.desc.slice(0, 43) + '…' : obj.desc;
    this.ctx.fillText(descText, boxX + 6, boxY + 19);
  }

  // --- Bottom-Center Quick Inventory Hotbar HUD ---
  private updateOverworldHotbar() {
    if (this.input.isJustPressed('slot1')) {
      this.quickSlotIndex = 0;
      soundManager.playSelect();
    } else if (this.input.isJustPressed('slot2')) {
      this.quickSlotIndex = 1;
      soundManager.playSelect();
    } else if (this.input.isJustPressed('slot3')) {
      this.quickSlotIndex = 2;
      soundManager.playSelect();
    } else if (this.input.isJustPressed('slot4')) {
      this.quickSlotIndex = 3;
      soundManager.playSelect();
    } else if (this.input.isJustPressed('slot5')) {
      this.quickSlotIndex = 4;
      soundManager.playSelect();
    }

    if (this.input.isJustPressed('use_item')) {
      this.useActiveHotbarItem();
    }
  }

  private useActiveHotbarItem() {
    const p = this.overworld.player;
    if (this.quickSlotIndex === 0) {
      // Slot 1: Poké Balls
      const pb = p.inventory.find((i) => i.type === 'pokeball');
      const count = pb ? pb.count : 0;
      soundManager.playConfirm();
      this.showToast(`Poké Balls ready: ${count} in bag (Use in wild battles)`);
    } else if (this.quickSlotIndex === 1) {
      // Slot 2: Potion
      const pot = p.inventory.find((i) => i.id === 'potion' || i.id === 'super_potion');
      if (!pot || pot.count <= 0) {
        soundManager.playBump();
        this.showToast('No Potions remaining in bag!');
        return;
      }
      const wounded = p.party.find((m) => m.currentHp > 0 && m.currentHp < m.maxHp);
      if (!wounded) {
        soundManager.playBump();
        this.showToast('All Pokémon in party are at full health!');
        return;
      }
      pot.count--;
      const healAmt = pot.id === 'super_potion' ? 50 : 20;
      wounded.currentHp = Math.min(wounded.maxHp, wounded.currentHp + healAmt);
      soundManager.playHealChime();
      this.showToast(`Used ${pot.name}! ${wounded.species.name} healed +${healAmt} HP!`);
    } else if (this.quickSlotIndex === 2) {
      // Slot 3: Revive
      const rev = p.inventory.find((i) => i.type === 'revive');
      if (!rev || rev.count <= 0) {
        soundManager.playBump();
        this.showToast('No Revives remaining in bag!');
        return;
      }
      const fainted = p.party.find((m) => m.currentHp <= 0);
      if (!fainted) {
        soundManager.playBump();
        this.showToast('No fainted Pokémon in party!');
        return;
      }
      rev.count--;
      fainted.currentHp = Math.floor(fainted.maxHp * 0.5);
      soundManager.playLevelUp();
      this.showToast(`Revived ${fainted.species.name} back to combat!`);
    } else if (this.quickSlotIndex === 3) {
      // Slot 4: Rare Candy
      const candy = p.inventory.find((i) => i.id === 'rare_candy');
      if (candy && candy.count > 0) {
        candy.count--;
        const lead = p.party[0];
        if (lead) {
          lead.level++;
          lead.maxHp += 4;
          lead.currentHp = lead.maxHp;
          soundManager.playLevelUp();
          this.showToast(`${lead.species.name} grew to Level ${lead.level}!`);
        }
      } else {
        soundManager.playConfirm();
        this.showToast('Visit EXP Sanctuary to buy Rare Candies!');
      }
    } else if (this.quickSlotIndex === 4) {
      // Slot 5: Team Estus / Refresh
      soundManager.playEstus();
      p.party.forEach((m) => {
        m.currentHp = m.maxHp;
        m.moves.forEach((mv) => (mv.currentPp = mv.move.pp));
      });
      this.showToast('Restored team vigor with restorative nectar!');
    }
  }

  private drawQuickInventoryHotbar(cw: number, ch: number) {
    const p = this.overworld.player;
    const slotCount = 5;
    const slotW = 27;
    const slotH = 20;
    const gap = 3;
    const totalW = slotCount * slotW + (slotCount - 1) * gap;
    const startX = Math.floor((cw - totalW) / 2);
    const startY = ch - 25;

    // Background pill frame
    this.ctx.fillStyle = 'rgba(10, 16, 28, 0.9)';
    this.ctx.fillRect(startX - 4, startY - 3, totalW + 8, slotH + 5);
    this.ctx.strokeStyle = '#283c5a';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(startX - 4, startY - 3, totalW + 8, slotH + 5);

    const slotData = [
      {
        icon: 'PB',
        name: 'Ball',
        count: p.inventory.find((i) => i.type === 'pokeball')?.count || 0,
        color: '#e53935',
      },
      {
        icon: 'HP',
        name: 'Potion',
        count: p.inventory.find((i) => i.type === 'potion')?.count || 0,
        color: '#00e676',
      },
      {
        icon: 'RV',
        name: 'Revive',
        count: p.inventory.find((i) => i.type === 'revive')?.count || 0,
        color: '#ffd700',
      },
      {
        icon: 'RC',
        name: 'Candy',
        count: p.inventory.find((i) => i.id === 'rare_candy')?.count || 0,
        color: '#ab47bc',
      },
      {
        icon: 'ES',
        name: 'Nectar',
        count: p.soulsStats?.estusCharges || 4,
        color: '#ff9800',
      },
    ];

    slotData.forEach((slot, idx) => {
      const sx = startX + idx * (slotW + gap);
      const isSelected = this.quickSlotIndex === idx;

      this.ctx.fillStyle = isSelected ? '#1b3252' : '#141d2c';
      this.ctx.fillRect(sx, startY, slotW, slotH);

      this.ctx.strokeStyle = isSelected ? '#ffea00' : '#37474f';
      this.ctx.lineWidth = isSelected ? 1.5 : 1;
      this.ctx.strokeRect(sx, startY, slotW, slotH);

      // Key Number in corner
      this.ctx.fillStyle = isSelected ? '#ffea00' : '#78909c';
      this.ctx.font = '6px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${idx + 1}`, sx + 2, startY + 7);

      // Slot Icon Badge
      this.ctx.fillStyle = slot.color;
      this.ctx.font = 'bold 7px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(slot.icon, sx + slotW / 2 + 1, startY + 11);

      // Count
      this.ctx.fillStyle = slot.count > 0 ? '#ffffff' : '#757575';
      this.ctx.font = 'bold 6px monospace';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`x${slot.count}`, sx + slotW - 2, startY + 17);
    });

    // Active Slot Name & Key Hint above hotbar (short so it never meets the boss panel).
    const active = slotData[this.quickSlotIndex];
    if (active) {
      this.ctx.fillStyle = '#ffea00';
      this.ctx.font = 'bold 6px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`[${this.quickSlotIndex + 1}] ${active.name.toUpperCase()} · [C] USE`, cw / 2, startY - 5);
    }
  }

  private drawStartMenu(cw: number, _ch: number) {
    const menuW = 136;
    const menuH = 214;
    const menuX = cw - menuW - 8;
    const menuY = 20;

    // Glowing Neon Glass Container
    this.ctx.fillStyle = 'rgba(10, 16, 28, 0.95)';
    this.ctx.fillRect(menuX, menuY, menuW, menuH);

    this.ctx.strokeStyle = '#00e5ff';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(menuX, menuY, menuW, menuH);

    // Menu Header
    this.ctx.fillStyle = '#142238';
    this.ctx.fillRect(menuX + 2, menuY + 2, menuW - 4, 15);
    this.ctx.fillStyle = '#00e5ff';
    this.ctx.font = 'bold 8px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚡ COMMAND MENU', menuX + menuW / 2, menuY + 12);

    const icons = [
      '📖',
      '⚡',
      '🐴',
      '🎒',
      '🎣',
      '🍳',
      '🕹️',
      '💎',
      '🌀',
      '🏎️',
      '⚔️',
      '🪪',
      '💾',
      '❌',
    ];

    this.startMenuItems.forEach((item, idx) => {
      const itemY = menuY + 26 + idx * 14;
      const isSelected = this.startMenuCursor === idx;

      if (isSelected) {
        this.ctx.fillStyle = '#1c3459';
        this.ctx.fillRect(menuX + 4, itemY - 9, menuW - 8, 14);
        this.ctx.strokeStyle = '#00e5ff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(menuX + 4, itemY - 9, menuW - 8, 14);

        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 8px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('▶', menuX + 6, itemY + 2);
      }

      this.ctx.textAlign = 'left';
      this.ctx.font = '9px monospace';
      this.ctx.fillText(icons[idx] || '•', menuX + 16, itemY + 2);

      this.ctx.fillStyle = isSelected
        ? '#ffffff'
        : item === 'FISHING'
          ? '#29b6f6'
          : item === 'COOKING'
            ? '#ffb74d'
            : item === 'EXP SHOP'
              ? '#00e5ff'
              : item === 'ARCADE'
                ? '#ff4081'
                : item === 'MOUNT SHOP'
                ? '#ffb74d'
                : item === 'TELEPORT'
                  ? '#4dd0e1'
                  : item === 'KART RACING'
                ? '#ff7043'
                : item === 'SOULS BOSS'
                  ? '#ba68c8'
                  : '#b0bec5';
      this.ctx.font = 'bold 7.5px monospace';
      this.ctx.fillText(item, menuX + 32, itemY + 1);
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
      this.ctx.fillStyle = isCaught ? '#cc2222' : isSeen ? '#2255aa' : '#9e9e9e';

      const numStr = String(sp.id).padStart(3, '0');
      const icon = isCaught ? '★' : isSeen ? '○' : '◌';

      // Every species is listed; undiscovered ones are shown dimmed.
      this.ctx.fillText(`${icon}#${numStr} ${sp.name.toUpperCase().slice(0, 9)}`, listX + 6, itemY);
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

      const img = SpriteLoader.getImage(currentSpecies.spriteFront, currentSpecies.id, currentSpecies.color);
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
      // Undiscovered species: silhouette preview, dimmed profile.
      this.ctx.fillStyle = '#dfe6ec';
      this.ctx.fillRect(detailX + 8, detailY + 8, 64, 64);
      this.ctx.strokeStyle = '#aab';
      this.ctx.strokeRect(detailX + 8, detailY + 8, 64, 64);

      const img = SpriteLoader.getImage(currentSpecies.spriteFront, currentSpecies.id, currentSpecies.color);
      if (img) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.28;
        this.ctx.drawImage(img, detailX + 8, detailY + 8, 64, 64);
        this.ctx.restore();
      }

      this.ctx.save();
      this.ctx.globalAlpha = 0.45;
      this.ctx.fillStyle = '#111';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText(`No. ${String(currentSpecies.id).padStart(3, '0')}`, detailX + 80, detailY + 22);
      this.ctx.fillText(currentSpecies.name.toUpperCase(), detailX + 80, detailY + 38);

      this.ctx.font = '9px monospace';
      this.ctx.fillStyle = '#666';
      this.ctx.fillText('??? CATEGORY', detailX + 80, detailY + 52);
      this.ctx.fillText('??? / ???', detailX + 80, detailY + 66);
      this.ctx.restore();

      this.ctx.fillStyle = '#888';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.fillText('UNDISCOVERED SPECIES', detailX + 10, detailY + 100);

      this.ctx.font = '8.5px monospace';
      this.ctx.fillStyle = '#777';
      this.ctx.fillText('Encounter this Pokémon in the', detailX + 10, detailY + 120);
      this.ctx.fillText('wild or with a Trainer to', detailX + 10, detailY + 133);
      this.ctx.fillText('reveal its full Pokédex data.', detailX + 10, detailY + 146);

      this.ctx.fillStyle = '#9e9e9e';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('STATUS: NOT REGISTERED', detailX + 10, detailY + 184);
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
        // Boulder Badge Octagon (Brock)
        this.ctx.fillStyle = '#8a929a';
        this.ctx.beginPath();
        this.ctx.arc(bx + 11, by + 11, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#f0c040';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('B', bx + 7, by + 15);
      } else if (i === 1 && this.overworld.player.hasCascadeBadge) {
        // Cascade Badge Teardrop (Misty)
        this.ctx.fillStyle = '#33aacc';
        this.ctx.beginPath();
        this.ctx.arc(bx + 11, by + 11, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('C', bx + 7, by + 15);
      } else if (i === 2 && this.overworld.player.hasThunderBadge) {
        // Thunder Badge Star (Surge)
        this.ctx.fillStyle = '#e6b800';
        this.ctx.beginPath();
        this.ctx.arc(bx + 11, by + 11, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('T', bx + 7, by + 15);
      } else if (i === 3 && this.overworld.player.hasEarthBadge) {
        this.ctx.fillStyle = '#8b6a3a';
        this.ctx.beginPath();
        this.ctx.arc(bx + 11, by + 11, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('E', bx + 7, by + 15);
      } else if (i === 4 && this.overworld.player.hasFireBadge) {
        this.ctx.fillStyle = '#d94a12';
        this.ctx.beginPath();
        this.ctx.arc(bx + 11, by + 11, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('F', bx + 7, by + 15);
      } else if (i === 5 && this.overworld.player.hasGrassBadge) {
        this.ctx.fillStyle = '#3f8a3f';
        this.ctx.beginPath();
        this.ctx.arc(bx + 11, by + 11, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('G', bx + 7, by + 15);
      } else {
        this.ctx.fillStyle = '#bb9977';
        this.ctx.font = '9px monospace';
        this.ctx.fillText('-', bx + 8, by + 15);
      }
    }

    const earnedBadges: string[] = [];
    if (this.overworld.player.hasBoulderBadge) earnedBadges.push('Boulder');
    if (this.overworld.player.hasCascadeBadge) earnedBadges.push('Cascade');
    if (this.overworld.player.hasThunderBadge) earnedBadges.push('Thunder');
    if (this.overworld.player.hasEarthBadge) earnedBadges.push('Earth');
    if (this.overworld.player.hasFireBadge) earnedBadges.push('Flame');
    if (this.overworld.player.hasGrassBadge) earnedBadges.push('Grove');

    this.ctx.fillStyle = '#5a3a1a';
    this.ctx.font = 'bold 8px monospace';
    if (earnedBadges.length === 0) {
      this.ctx.fillText('No badges yet. Challenge the Gym Leaders!', cardX + 16, cardY + 166);
    } else {
      this.ctx.fillText(`★ ${earnedBadges.slice(0, 3).join(' / ')}`, cardX + 16, cardY + 166);
      if (earnedBadges.length > 3) {
        this.ctx.fillText(`★ ${earnedBadges.slice(3).join(' / ')}`, cardX + 16, cardY + 178);
      }
    }

    this.ctx.fillStyle = '#666';
    this.ctx.font = '9px monospace';
    this.ctx.fillText('[B] Back', cardX + cardW - 60, cardY + cardH - 12);
  }

  // --- Draw Mart Shop ---
  private drawMartShop(cw: number, ch: number) {
    this.ctx.fillStyle = '#225588';
    this.ctx.fillRect(0, 0, cw, ch);

    const shopTitle =
      this.martType === 'seed'
        ? 'SUNNY FARM SEEDS'
        : this.martType === 'level'
          ? 'FARM DOJO'
          : 'POKÉMON MART';

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillText(shopTitle, 16, 22);

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

      // Draw item category badge & icon
      const catColor =
        item.category === 'BALL'
          ? '#ee4444'
          : item.category === 'MEDICINE'
            ? '#3388ee'
            : item.category === 'SEED'
              ? '#44aa44'
              : item.category === 'SERVICE'
                ? '#cc7722'
                : '#9944cc';
      const catLabel =
        item.category === 'BALL'
          ? 'B'
          : item.category === 'MEDICINE'
            ? 'M'
            : item.category === 'SEED'
              ? 'S'
              : item.category === 'SERVICE'
                ? 'L'
                : 'X';

      this.ctx.fillStyle = catColor;
      this.ctx.fillRect(listX + 6, itemY - 10, 14, 14);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 8px monospace';
      this.ctx.fillText(catLabel, listX + 10, itemY + 1);

      this.ctx.fillStyle = isSelected ? '#cc2222' : '#111111';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.fillText(`${isSelected ? '▶ ' : '  '}${item.name.toUpperCase()}`, listX + 24, itemY);

      this.ctx.fillStyle = '#2255aa';
      this.ctx.fillText(`$${item.price}`, listX + 175, itemY);

      if (item.service) {
        this.ctx.fillStyle = '#885522';
        this.ctx.font = '9px monospace';
        this.ctx.fillText('SERVICE', listX + 225, itemY);
      } else {
        const owned = this.overworld.player.inventory.find((i) => i.id === item.id)?.count || 0;
        this.ctx.fillStyle = '#555';
        this.ctx.font = '9px monospace';
        this.ctx.fillText(`Bag: x${owned}`, listX + 225, itemY);
      }
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

    const maxTextWidth = cw - 44;

    // Shrink the font until the message fits instead of clipping it.
    let fontSize = 9;
    this.ctx.font = `bold ${fontSize}px monospace`;
    let width = this.ctx.measureText(this.toastMessage).width;
    while (width > maxTextWidth && fontSize > 5.5) {
      fontSize -= 0.5;
      this.ctx.font = `bold ${fontSize}px monospace`;
      width = this.ctx.measureText(this.toastMessage).width;
    }

    this.ctx.fillStyle = 'rgba(10, 20, 30, 0.92)';
    this.ctx.fillRect(16, 62, cw - 32, 28);
    this.ctx.strokeStyle = '#ffcc00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(16, 62, cw - 32, 28);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.toastMessage, cw / 2, 79 + (9 - fontSize) * 0.5);
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
