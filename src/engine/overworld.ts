import { soundManager } from '../audio/sound';
import { createActivePokemon, getBalancedLevel, getBalancedLevelRange, getEncounterPool } from '../data/pokemon';
import type { ActivePokemon, PlayerData } from '../types';
import type { InputHandler } from './input';
import { getMount } from './mountShop';
import { TileMap, TileType, type NPC } from './tilemap';
import {
  COIN_RESPAWN_MS,
  TELEPORT_DESTINATIONS,
  generateCoins,
  WORLD_BOSS_ZONE_ID,
  type Coin,
} from './worldSystems';
import { FARM_PLOT_COORDS, ZONE_DEFS, attachZoneFacilities, buildZone } from './zones';

const SEED_DATA: Record<string, { name: string; value: number; steps: number }> = {
  seed_berry: { name: 'Berry', value: 200, steps: 3 },
  seed_tomato: { name: 'Tomato', value: 550, steps: 5 },
  seed_gold: { name: 'Golden Fruit', value: 1400, steps: 8 },
};

const ENCOUNTER_TILES = [TileType.TALL_GRASS, TileType.CAVE_GRASS, TileType.ASH_GRASS];

export class Overworld {
  public map: TileMap;
  public player: PlayerData;
  public currentZoneId: string = 'world';
  private zoneCache: Map<string, TileMap> = new Map();
  private stepsSinceFarmTick: number = 0;

  public get zoneName(): string {
    return this.map.zoneName;
  }

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
    pages: string[][];
    pageIndex: number;
    revealed: number;
    pageLength: number;
    isFinished: boolean;
    onComplete?: () => void;
  } | null = null;

  // Conservative characters that fit one 10px monospace dialog line.
  private static readonly DIALOG_CHARS_PER_LINE = 42;
  private static readonly DIALOG_LINES_PER_PAGE = 4;

  // Callbacks
  public onEncounterTriggered?: (wildPokemon: ActivePokemon) => void;
  public onTrainerBattleTriggered?: (
    npcId: string,
    trainerName: string,
    party: ActivePokemon[],
    rewardMoney: number,
    badge?: string
  ) => void;
  public onOpenMart?: (shopType: 'poke' | 'seed' | 'level') => void;
  public onOpenExpShop?: () => void;
  public onOpenKartRacing?: () => void;
  public onOpenSoulsBoss?: () => void;
  public onOpenFishing?: () => void;
  public onOpenCooking?: () => void;
  public onOpenMountShop?: () => void;
  public onOpenTeleport?: () => void;
  public onOpenArcade?: () => void;
  public onOpenMenu?: () => void;
  public onMountMessage?: (message: string) => void;
  public onZoneChanged?: (zoneName: string) => void;
  public onCoinCollected?: (amount: number, isGem: boolean) => void;
  public onWorldBossPortal?: () => void;
  public onWorldBossBattle?: () => void;

  // Scattered coins per zone (deterministic layout, timed respawn).
  private coinsByZone: Map<string, Coin[]> = new Map();
  public worldBossPortal: { x: number; y: number; zoneId: string } | null = null;
  public worldBossActive: boolean = false;

  constructor() {
    this.map = new TileMap();
    attachZoneFacilities(this.map, 'world', { x: 16, y: 59 });
    this.zoneCache.set('world', this.map);

    // Start player on the path just outside Oak's Lab in Pallet Town.
    this.player = {
      x: 16,
      y: 59,
      direction: 'down',
      party: [],
      inventory: [
        { id: 'pokeball', name: 'Poké Ball', count: 10, price: 200, type: 'pokeball', description: 'Catches wild Pokémon.' },
        { id: 'potion', name: 'Potion', count: 5, price: 300, type: 'potion', description: 'Restores 20 HP to a Pokémon.' },
      ],
      money: 1000,
      expTokens: 600,
      gems: 10,
      fishCaught: 0,
      dishesCooked: 0,
      coinsCollected: 0,
      ownedMounts: [],
      activeMount: null,
      teleportUnlocked: false,
      worldBossDefeated: false,
      worldBossWins: 0,
      badges: 0,
      hasBoulderBadge: false,
      hasCascadeBadge: false,
      hasThunderBadge: false,
      hasEarthBadge: false,
      hasFireBadge: false,
      hasGrassBadge: false,
      zoneId: 'world',
      farmPlots: FARM_PLOT_COORDS.map(() => ({ seedId: null, growth: 0 })),
      metSpecialYusti: false,
      metSpecialZaky: false,
      metSpecialDio: false,
      metSpecialZazzie: false,
      seenPokemon: [],
      caughtPokemon: [],
      defeatedTrainers: [],
      arcadeHighScores: {},
    };

    this.visualX = this.player.x * TileMap.TILE_SIZE;
    this.visualY = this.player.y * TileMap.TILE_SIZE;
  }

  public getZone(zoneId: string): TileMap | null {
    if (zoneId === 'world') return this.zoneCache.get('world') || null;
    if (this.zoneCache.has(zoneId)) return this.zoneCache.get(zoneId)!;
    if (!ZONE_DEFS[zoneId]) return null;

    const zone = buildZone(zoneId);
    if (zone) {
      const dest = TELEPORT_DESTINATIONS.find((d) => d.zoneId === zoneId);
      attachZoneFacilities(zone, zoneId, dest ? { x: dest.x, y: dest.y } : { x: 11, y: 15 });
      this.zoneCache.set(zoneId, zone);
    }
    return zone;
  }

  public enterZone(zoneId: string, x: number, y: number, direction: PlayerData['direction'] = 'down', silent = false) {
    const zone = this.getZone(zoneId);
    if (!zone) return;

    this.map = zone;
    this.currentZoneId = zoneId;
    this.player.zoneId = zoneId;
    this.player.x = x;
    this.player.y = y;
    this.player.direction = direction;
    this.visualX = x * TileMap.TILE_SIZE;
    this.visualY = y * TileMap.TILE_SIZE;
    this.isMoving = false;
    this.moveProgress = 0;

    if (!this.coinsByZone.has(zoneId)) {
      this.coinsByZone.set(zoneId, generateCoins(zone, zoneId));
    }

    // Keep the rift alive while inside the arena; drop it when travelling away.
    if (
      this.worldBossPortal &&
      this.worldBossPortal.zoneId !== zoneId &&
      zoneId !== WORLD_BOSS_ZONE_ID
    ) {
      this.worldBossPortal = null;
    }

    soundManager.playDoor();
    if (this.onZoneChanged) this.onZoneChanged(zone.zoneName);
    if (!silent) {
      this.startDialog(zone.zoneName, [`Entered ${zone.zoneName}.`]);
    }
  }

  public spawnWorldBossPortal(x: number, y: number): void {
    this.worldBossPortal = { x, y, zoneId: this.currentZoneId };
    this.worldBossActive = true;
    soundManager.playPortalHum();
  }

  public clearWorldBossPortal(): void {
    this.worldBossPortal = null;
  }

  public toggleMount(): void {
    const owned = this.player.ownedMounts || [];
    if (owned.length === 0) {
      soundManager.playBump();
      this.startDialog('Mount Ranch', [
        'You do not own any rideable Pokémon yet.',
        'Visit Steed Keeper Rhea in Pallet Town to buy a mount!',
      ]);
      return;
    }

    // activeMount = equipped mount, mounted = currently riding it.
    if (!this.player.activeMount || !owned.includes(this.player.activeMount)) {
      this.player.activeMount = owned[0];
    }

    const mount = getMount(this.player.activeMount);
    const mountName = mount ? mount.name : 'Mount';

    if (this.player.mounted) {
      this.player.mounted = false;
      this.isMoving = false;
      this.moveProgress = 0;
      soundManager.playCancel();
      if (this.onMountMessage) this.onMountMessage(`${mountName} returned to the ranch.`);
    } else {
      this.player.mounted = true;
      soundManager.playMountSummon();
      if (this.onMountMessage) this.onMountMessage(`Riding ${mountName}! Press [R] to dismount.`);
    }
  }

  public getCoins(): Coin[] {
    return this.coinsByZone.get(this.currentZoneId) || [];
  }

  public getFarmPlotIndex(x: number, y: number): number {
    return FARM_PLOT_COORDS.findIndex((p) => p.x === x && p.y === y);
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

    // 2b. Mount / dismount toggle
    if (input.isJustPressed('mount')) {
      this.toggleMount();
      return;
    }

    // 2c. Quick teleport network
    if (input.isJustPressed('teleport')) {
      if (this.onOpenTeleport) {
        soundManager.playConfirm();
        this.onOpenTeleport();
      }
      return;
    }

    // 3. Movement interpolation (Running Shoes: 2x speed when holding Shift)
    const isRunning = input.isDown('run');
    const mount = this.player.mounted ? getMount(this.player.activeMount) : null;
    const mountMult = mount ? mount.speed : 1;
    const speed = (isRunning ? 0.012 : 0.006) * mountMult;

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

      // Farm soil plots
      if (
        facingPos.x >= 0 &&
        facingPos.x < this.map.width &&
        facingPos.y >= 0 &&
        facingPos.y < this.map.height &&
        this.map.data[facingPos.y][facingPos.x] === TileType.SOIL
      ) {
        this.interactWithFarmPlot(facingPos.x, facingPos.y);
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

    // Signs inside interior / elemental zones
    if (this.currentZoneId !== 'world') {
      const zoneSigns: Record<string, string[]> = {
        farm: [
          'SUNNY FARM - Plant seeds, harvest crops, and earn Pokédollars!',
          'Press [A] facing a soil plot. Farmer Maple sells seeds in the fenced field.',
        ],
        zone_earth: [
          'TERRA CANYON - Home of Ground-type Pokémon.',
          'Gym Leader GIOVANNI awaits at the summit!',
        ],
        zone_fire: [
          'EMBER VOLCANO - Home of Fire-type Pokémon.',
          'The lava is dangerous! Gym Leader BLAINE guards the summit.',
        ],
        zone_grass: [
          'VERDANT GROVE - Home of Grass-type Pokémon.',
          'Gym Leader ERIKA tends the garden at the summit.',
        ],
      };
      this.startDialog(`${this.zoneName} Sign`, zoneSigns[this.currentZoneId] || [
        `${this.zoneName} - A cozy little place.`,
        'Press [B] or [A] to continue.',
      ]);
      return;
    }

    if (x === 9 && y === 65) {
      this.startDialog('Sunny Farm Sign', [
        'SUNNY FARM - Just west of Pallet Town.',
        'Buy seeds, plant them in soil, and sell the harvest for money!',
      ]);
      return;
    }
    if (x === 39 && y === 47) {
      this.startDialog('Terra Canyon Sign', [
        'TERRA CANYON - Earth-type territory.',
        'Wild Diglett and Sandshrew roam the cave moss.',
      ]);
      return;
    }
    if (x === 31 && y === 61) {
      this.startDialog('Ember Volcano Sign', [
        'EMBER VOLCANO - Fire-type territory.',
        'Do not step into the lava! Wild Fire Pokémon live in the ash.',
      ]);
      return;
    }
    if (x === 4 && y === 31) {
      this.startDialog('Verdant Grove Sign', [
        'VERDANT GROVE - Grass-type territory.',
        'Nature\'s guardians watch over the tall grass.',
      ]);
      return;
    }

    if (y >= 64 && x <= 7) {
      this.startDialog('Secret Club Notice', [
        'SECRET VIP CLUBHOUSE - MEMBERS ONLY',
        'Headquarters of Yusti, Zaky, Dio, and Zazzie!',
        'Step inside to receive rare Pokémon, gear, and wisdom!',
      ]);
    } else if (y >= 54) {
      if (x >= 32) {
        this.startDialog('Vermilion Port Sign', [
          'VERMILION CITY - The Port of Exquisite Sunsets.',
          'Challenge Lt. Surge at the Electric Gym to the north!',
        ]);
      } else if (x <= 14) {
        this.startDialog("Oak's Lab", [
          "PROF. OAK'S POKÉMON RESEARCH LAB",
          'Dedicated to uncovering the mysteries of Pokémon biology and habitat!',
        ]);
      } else {
        this.startDialog('Signboard', [
          'PALLET TOWN - Shades of your journey await!',
          'Head north onto Route 1, or east to Vermilion Port!',
        ]);
      }
    } else if (y >= 36 && y <= 53) {
      // Route 1 Signs
      if (y > 44) {
        this.startDialog('Route 1 Sign', [
          'ROUTE 1 - South to Pallet Town, North to Pewter City.',
          'Wild Pokémon dwell inside the tall grass!',
        ]);
      } else {
        this.startDialog('Route 1 North', [
          'TRAINER NOTICE: Ahead lies Pewter City.',
          'Prepare your Pokémon before challenging the Gym Leaders!',
        ]);
      }
    } else if (y >= 18 && y <= 35) {
      // Pewter & Cerulean City Signs
      if (x >= 28) {
        this.startDialog('Cerulean Water Gym', [
          'CERULEAN CITY WATER GYM',
          'LEADER: MISTY - The Tomboyish Mermaid!',
          'Cascade Badge awarded to victorious challengers!',
        ]);
      } else if (x >= 14) {
        this.startDialog('Pewter Gym', [
          'PEWTER CITY POKÉMON GYM',
          'LEADER: BROCK - The Rock-Solid Pokémon Trainer!',
          'Boulder Badge awarded to victorious challengers!',
        ]);
      } else {
        this.startDialog('Pewter City', [
          'PEWTER CITY - A Stone Gray City.',
          'Visit the Pokémon Center and Mart to gear up for battle!',
        ]);
      }
    } else {
      // Northern Zones: Roblox Hub & Lavender Ghost Alley
      if (x <= 18) {
        this.startDialog('Roblox Portal Shrine', [
          'ROBLOX METAVERSE INTERDIMENSIONAL PORTAL',
          'Caution: Strange blocky avatars and link swords detected!',
          'Home of Classic Noob and Bacon Hair!',
        ]);
      } else {
        this.startDialog('Lavender Ghost Alley', [
          'LAVENDER TOWN - The Noble Purple Town.',
          'Resting place of departed Pokémon spirits in the Pokémon Tower.',
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
    this.tickFarmGrowth();

    // Doors and portal gates warp the player to another zone.
    const exit = this.map.getExitAt(this.player.x, this.player.y);
    if (exit) {
      this.enterZone(exit.targetZone, exit.targetX, exit.targetY, this.player.direction, true);
      return;
    }

    // World Boss portal: the rift warps you into the Distortion Arena.
    if (
      this.worldBossPortal &&
      this.worldBossPortal.zoneId === this.currentZoneId &&
      this.worldBossPortal.x === this.player.x &&
      this.worldBossPortal.y === this.player.y
    ) {
      soundManager.playPortalHum();
      soundManager.playWorldBossWarning();
      this.enterZone(WORLD_BOSS_ZONE_ID, 10, 12, 'up', true);
      if (this.onWorldBossPortal) this.onWorldBossPortal();
      return;
    }

    // Scattered coins on this tile
    this.collectCoinAt(this.player.x, this.player.y);

    const tile = this.map.data[this.player.y][this.player.x];

    // Ambient cave drip effects
    if (
      (tile === TileType.CAVE_FLOOR || tile === TileType.CAVE_GRASS) &&
      Math.random() < 0.12
    ) {
      soundManager.playCaveDrip();
    }

    // Encounter tiles differ per zone (route grass, cave moss, volcanic ash).
    // Indoor rooms never trigger wild encounters, even if they use grass flooring.
    if (!this.map.isInterior && ENCOUNTER_TILES.includes(tile)) {
      soundManager.playGrassRustle();

      // 17% chance per step
      if (Math.random() < 0.17) {
        this.triggerWildBattle();
      }
    }
  }

  private collectCoinAt(x: number, y: number) {
    const coins = this.coinsByZone.get(this.currentZoneId);
    if (!coins) return;
    const now = Date.now();
    const coin = coins.find((c) => c.x === x && c.y === y && c.respawnAt <= now);
    if (!coin) return;

    coin.respawnAt = now + COIN_RESPAWN_MS;
    if (coin.gem) {
      this.player.gems = (this.player.gems || 0) + 1;
      this.player.coinsCollected = (this.player.coinsCollected || 0) + 1;
      soundManager.playGem();
      if (this.onCoinCollected) this.onCoinCollected(0, true);
    } else {
      this.player.money += coin.value;
      this.player.coinsCollected = (this.player.coinsCollected || 0) + 1;
      soundManager.playCoin();
      if (this.onCoinCollected) this.onCoinCollected(coin.value, false);
    }
  }

  private ensureFarmPlots() {
    if (!this.player.farmPlots || this.player.farmPlots.length !== FARM_PLOT_COORDS.length) {
      this.player.farmPlots = FARM_PLOT_COORDS.map(() => ({ seedId: null, growth: 0 }));
    }
    return this.player.farmPlots;
  }

  private tickFarmGrowth() {
    const plots = this.ensureFarmPlots();
    this.stepsSinceFarmTick++;
    if (this.stepsSinceFarmTick < 3) return;
    this.stepsSinceFarmTick = 0;

    plots.forEach((plot) => {
      if (!plot.seedId) return;
      const data = SEED_DATA[plot.seedId];
      if (data && plot.growth < data.steps) plot.growth++;
    });
  }

  private interactWithFarmPlot(x: number, y: number) {
    const index = this.getFarmPlotIndex(x, y);
    if (index < 0) return;

    const plots = this.ensureFarmPlots();
    const plot = plots[index];

    if (!plot.seedId) {
      const seed = this.player.inventory.find((item) => item.type === 'seed' && item.count > 0);
      if (!seed) {
        soundManager.playBump();
        this.startDialog('Soil Plot', [
          'This soil is empty, but you have no seeds.',
          'Buy Berry, Tomato, or Golden Seeds from Farmer Maple!',
        ]);
        return;
      }

      seed.count--;
      plot.seedId = seed.id;
      plot.growth = 0;
      soundManager.playConfirm();
      this.startDialog('Planting', [
        `You planted a ${seed.name.replace(' Seed', '')} seed!`,
        'It will grow a little every few steps you take. Come back later to harvest.',
      ]);
      return;
    }

    const data = SEED_DATA[plot.seedId];
    if (!data) {
      plot.seedId = null;
      plot.growth = 0;
      return;
    }

    if (plot.growth >= data.steps) {
      this.player.money += data.value;
      plot.seedId = null;
      plot.growth = 0;
      soundManager.playCashRegister();
      this.startDialog('Harvest!', [
        `You harvested a ripe ${data.name}!`,
        `Sold it at the market for $${data.value}.`,
      ]);
    } else {
      soundManager.playSelect();
      this.startDialog('Growing...', [
        `This ${data.name} plant is still growing (${plot.growth}/${data.steps} stages).`,
        'Walk around a little more, then come back to harvest!',
      ]);
    }
  }

  private triggerWildBattle() {
    soundManager.playEncounter();

    const pool = getEncounterPool(this.currentZoneId);
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = pool[0];

    for (const item of pool) {
      if (rand < item.weight) {
        chosen = item;
        break;
      }
      rand -= item.weight;
    }

    const balanced = getBalancedLevelRange(chosen.minLvl, chosen.maxLvl, this.player.party, this.player.badges);
    const lvl =
      Math.floor(Math.random() * (balanced.max - balanced.min + 1)) + balanced.min;
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

    // 2. Shop clerks (Poké Mart, Seed Shop, Level Dojo)
    if (npc.type === 'clerk') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenMart) this.onOpenMart(npc.shopType || 'poke');
      });
      return;
    }

    // 2.5 Special Minigame & EXP Shop NPCs
    if (npc.id === 'exp_sage') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenExpShop) this.onOpenExpShop();
      });
      return;
    }

    if (npc.id === 'kart_master') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenKartRacing) this.onOpenKartRacing();
      });
      return;
    }

    if (npc.id === 'souls_gatekeeper') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenSoulsBoss) this.onOpenSoulsBoss();
      });
      return;
    }

    if (npc.id === 'angler_pallet' || npc.id === 'cave_angler') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenFishing) this.onOpenFishing();
      });
      return;
    }

    if (npc.id === 'chef_pallet' || npc.id === 'cave_chef') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenCooking) this.onOpenCooking();
      });
      return;
    }

    if (npc.id === 'cave_miner') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (!this.player.defeatedTrainers.includes('cave_miner_reward')) {
          this.player.defeatedTrainers.push('cave_miner_reward');
          this.player.gems = (this.player.gems || 0) + 15;
          soundManager.playVictorySouls();
        }
      });
      return;
    }

    if (npc.id === 'steed_keeper') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenMountShop) this.onOpenMountShop();
      });
      return;
    }

    if (npc.id === 'arcade_keeper') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenArcade) this.onOpenArcade();
      });
      return;
    }

    if (npc.id === 'teleport_engineer' || npc.type === 'teleporter') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onOpenTeleport) this.onOpenTeleport();
      });
      return;
    }

    if (npc.id === 'world_boss_giratina') {
      this.startDialog(npc.name, npc.dialog, () => {
        if (this.onWorldBossBattle) this.onWorldBossBattle();
      });
      return;
    }

    // 3. Trainer / Gym Leader / Special Friend battle check
    const isDefeated = this.player.defeatedTrainers.includes(npc.id);

    if (npc.type === 'special_friend') {
      if (npc.id === 'special_yusti') {
        if (!this.player.metSpecialYusti && npc.giftPokemonId) {
          this.startDialog(npc.name, npc.dialog, () => {
            const giftPoke = createActivePokemon(npc.giftPokemonId!, npc.giftPokemonLevel || 10);
            if (this.player.party.length < 6) {
              this.player.party.push(giftPoke);
            }
            if (!this.player.seenPokemon.includes(giftPoke.species.id)) {
              this.player.seenPokemon.push(giftPoke.species.id);
            }
            if (!this.player.caughtPokemon.includes(giftPoke.species.id)) {
              this.player.caughtPokemon.push(giftPoke.species.id);
            }
            this.player.metSpecialYusti = true;
            soundManager.playLevelUp();
            this.startDialog('Special Gift', [
              `Player received rare DRATINI (Lv${npc.giftPokemonLevel || 10}) from Yusti!`,
              'Dratini was safely added to your party!',
            ]);
          });
          return;
        }
      } else if (npc.id === 'special_zaky') {
        if (!this.player.metSpecialZaky && npc.giftItem) {
          this.startDialog(npc.name, npc.dialog, () => {
            let pot = this.player.inventory.find((i) => i.id === 'super_potion');
            if (pot) pot.count += 5;
            else this.player.inventory.push({ id: 'super_potion', name: 'Super Potion', count: 5, price: 700, type: 'potion', description: 'Restores 50 HP.' });

            let gb = this.player.inventory.find((i) => i.id === 'greatball');
            if (gb) gb.count += 5;
            else this.player.inventory.push({ id: 'greatball', name: 'Great Ball', count: 5, price: 600, type: 'pokeball', description: 'Higher catch rate.' });

            this.player.metSpecialZaky = true;
            soundManager.playLevelUp();
            this.startDialog('Special Gift', [
              'Player received 5 Super Potions and 5 Great Balls from Zaky!',
            ]);
          });
          return;
        }
      } else if (npc.id === 'special_zazzie') {
        if (!this.player.metSpecialZazzie && npc.giftItem) {
          this.startDialog(npc.name, npc.dialog, () => {
            let rev = this.player.inventory.find((i) => i.id === 'revive');
            if (rev) rev.count += 3;
            else this.player.inventory.push({ id: 'revive', name: 'Revive', count: 3, price: 1500, type: 'revive', description: 'Revitalizes fainted Pokémon.' });

            this.player.metSpecialZazzie = true;
            soundManager.playLevelUp();
            this.startDialog('Special Gift', [
              'Player received 3 Revives from Zazzie!',
              'You can use them in battle to revive fainted Pokémon!',
            ]);
          });
          return;
        }
      }

      if (npc.trainerParty) {
        if (isDefeated) {
          this.startDialog(npc.name, npc.afterDefeatDialog || npc.dialog);
        } else {
          this.startDialog(npc.name, npc.dialog, () => {
            const party = (npc.trainerParty || []).map((tp) =>
              createActivePokemon(tp.id, getBalancedLevel(tp.level, this.player.party, this.player.badges))
            );
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
                npc.rewardMoney || 500,
                npc.badge
              );
            }
          });
        }
        return;
      }

      // Default special friend talk
      this.startDialog(npc.name, npc.afterDefeatDialog || npc.dialog);
      return;
    }

    if (npc.type === 'trainer' || npc.type === 'gym_leader') {
      if (isDefeated) {
        const lines = npc.afterDefeatDialog || npc.dialog;
        this.startDialog(npc.name, lines);
      } else {
        // Trigger battle!
        this.startDialog(npc.name, npc.dialog, () => {
          const party = (npc.trainerParty || []).map((tp) =>
            createActivePokemon(tp.id, getBalancedLevel(tp.level, this.player.party, this.player.badges))
          );
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
    // Pre-wrap + paginate once so the render loop never measures text again.
    const visualLines: string[] = [];
    for (const raw of lines) {
      const wrapped = this.wrapDialogText(raw, Overworld.DIALOG_CHARS_PER_LINE);
      if (wrapped.length === 0) visualLines.push('');
      else visualLines.push(...wrapped);
    }
    if (visualLines.length === 0) visualLines.push('');

    const perPage = Overworld.DIALOG_LINES_PER_PAGE;
    const pages: string[][] = [];
    for (let i = 0; i < visualLines.length; i += perPage) {
      pages.push(visualLines.slice(i, i + perPage));
    }

    this.currentDialog = {
      speaker,
      pages,
      pageIndex: 0,
      revealed: 0,
      pageLength: pages[0].join('').length,
      isFinished: pages[0].join('').length === 0,
      onComplete,
    };
  }

  private wrapDialogText(text: string, maxChars: number): string[] {
    if (!text) return [];
    const lines: string[] = [];
    let line = '';

    const pushWord = (word: string) => {
      // Break words that are longer than a full line.
      let rest = word;
      while (rest.length > maxChars) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      if (!rest) return;
      const candidate = line ? `${line} ${rest}` : rest;
      if (candidate.length <= maxChars) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = rest;
      }
    };

    for (const word of text.split(/\s+/)) {
      if (word) pushWord(word);
    }

    if (line) lines.push(line);
    return lines;
  }

  private updateDialog(input: InputHandler, deltaMs: number) {
    if (!this.currentDialog) return;

    const d = this.currentDialog;

    // Typewriter effect across the current page.
    if (!d.isFinished) {
      d.revealed += deltaMs * 0.07;
      if (d.revealed >= d.pageLength) {
        d.revealed = d.pageLength;
        d.isFinished = true;
      }
    }

    if (input.isJustPressed('a') || input.isJustPressed('b')) {
      if (!d.isFinished) {
        d.revealed = d.pageLength;
        d.isFinished = true;
        soundManager.playSelect();
        return;
      }

      if (d.pageIndex < d.pages.length - 1) {
        d.pageIndex++;
        d.revealed = 0;
        d.pageLength = d.pages[d.pageIndex].join('').length;
        d.isFinished = d.pageLength === 0;
        soundManager.playSelect();
      } else {
        const callback = d.onComplete;
        this.currentDialog = null;
        soundManager.playConfirm();
        if (callback) callback();
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, animTime: number) {
    ctx.fillStyle = this.map.isInterior ? '#140f0b' : '#20361f';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const ts = TileMap.TILE_SIZE;
    const mapPixelW = this.map.width * ts;
    const mapPixelH = this.map.height * ts;

    let cameraX = Math.floor(canvasWidth / 2 - this.visualX - ts / 2);
    let cameraY = Math.floor(canvasHeight / 2 - this.visualY - ts / 2);

    // Keep the map filling the screen where possible (important for small interiors).
    cameraX = mapPixelW >= canvasWidth
      ? Math.min(0, Math.max(canvasWidth - mapPixelW, cameraX))
      : Math.floor((canvasWidth - mapPixelW) / 2);
    cameraY = mapPixelH >= canvasHeight
      ? Math.min(0, Math.max(canvasHeight - mapPixelH, cameraY))
      : Math.floor((canvasHeight - mapPixelH) / 2);

    ctx.save();
    ctx.translate(cameraX, cameraY);

    this.map.draw(ctx, animTime, {
      x: -cameraX,
      y: -cameraY,
      w: canvasWidth,
      h: canvasHeight,
    });
    if (this.currentZoneId === 'farm') this.drawFarmCrops(ctx);
    this.drawCoins(ctx, animTime);
    this.drawWorldBossPortal(ctx, animTime);
    this.drawPlayer(ctx);

    ctx.restore();

    // Motion Play: Ambient moving Pokémon & nature effects
    if (!this.map.isInterior) {
      this.drawAmbientMotion(ctx, canvasWidth, canvasHeight, animTime);
    }

    if (this.currentDialog) {
      this.drawDialogBox(ctx, canvasWidth, canvasHeight, animTime);
    }
  }

  private drawAmbientMotion(ctx: CanvasRenderingContext2D, cw: number, ch: number, animTime: number) {
    // 1. Drifting Leaves & Blossom Petals
    for (let i = 0; i < 8; i++) {
      const speedX = 0.025 + (i % 3) * 0.015;
      const speedY = 0.018 + (i % 2) * 0.01;
      const lx = ((animTime * speedX + i * 45) % (cw + 40)) - 20 + Math.sin(animTime * 0.003 + i) * 8;
      const ly = ((animTime * speedY + i * 35) % (ch + 40)) - 20;

      ctx.fillStyle = i % 2 === 0 ? 'rgba(120, 210, 85, 0.65)' : 'rgba(255, 182, 193, 0.6)';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 3.5, 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Flying Pokémon Silhouette across the sky (every 16 seconds)
    const flyCycle = 16000;
    const flyProgress = (animTime % flyCycle) / 6000; // flies across in 6 seconds

    if (flyProgress < 1.0) {
      const flyX = -40 + flyProgress * (cw + 80);
      const flyY = 22 + Math.sin(animTime * 0.002) * 8;
      const wingFlap = Math.sin(animTime * 0.018);

      ctx.save();
      ctx.translate(flyX, flyY);

      // Flying silhouette color (deep translucent navy shadow)
      ctx.fillStyle = 'rgba(20, 30, 50, 0.45)';

      // Dragon / Large Bird Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flapping Wings
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(2, wingFlap * 11);
      ctx.lineTo(6, 0);
      ctx.closePath();
      ctx.fill();

      // Tail
      ctx.fillRect(-12, -1, 5, 2);

      ctx.restore();
    }
  }

  private drawFarmCrops(ctx: CanvasRenderingContext2D) {
    const plots = this.ensureFarmPlots();
    const ts = TileMap.TILE_SIZE;

    FARM_PLOT_COORDS.forEach((pos, index) => {
      const plot = plots[index];
      if (!plot || !plot.seedId) return;
      const meta = SEED_DATA[plot.seedId];
      const ratio = Math.min(1, plot.growth / (meta ? meta.steps : 3));

      const px = pos.x * ts;
      const py = pos.y * ts;

      ctx.fillStyle = '#2f7a2f';
      const stemHeight = 3 + Math.floor(ratio * 8);
      ctx.fillRect(px + 7, py + 14 - stemHeight, 2, stemHeight);

      if (ratio > 0.3) {
        ctx.fillStyle = '#4fae4f';
        ctx.fillRect(px + 4, py + 11, 3, 2);
        ctx.fillRect(px + 9, py + 12, 3, 2);
      }

      if (ratio >= 1) {
        ctx.fillStyle =
          plot.seedId === 'seed_gold' ? '#ffd700' : plot.seedId === 'seed_tomato' ? '#e04030' : '#d04080';
        ctx.beginPath();
        ctx.arc(px + 8, py + 5, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  private drawCoins(ctx: CanvasRenderingContext2D, animTime: number) {
    const ts = TileMap.TILE_SIZE;
    const coins = this.getCoins();
    const now = Date.now();

    coins.forEach((coin) => {
      if (coin.respawnAt > now) return;
      const bob = Math.sin(animTime * 0.005 + coin.x * 1.3 + coin.y) * 1.6;
      const cx = coin.x * ts + ts / 2;
      const cy = coin.y * ts + ts / 2 + bob;

      if (coin.gem) {
        // Diamond gem
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5);
        ctx.lineTo(cx + 4, cy);
        ctx.lineTo(cx, cy + 5);
        ctx.lineTo(cx - 4, cy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e0f7fa';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, 7 + Math.sin(animTime * 0.006) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Gold coin
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 4.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#fff8dc';
        ctx.fillRect(cx - 1, cy - 3, 1.5, 5);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.22)';
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  private drawWorldBossPortal(ctx: CanvasRenderingContext2D, animTime: number) {
    if (
      !this.worldBossPortal ||
      this.worldBossPortal.zoneId !== this.currentZoneId
    ) {
      return;
    }
    const ts = TileMap.TILE_SIZE;
    const px = this.worldBossPortal.x * ts;
    const py = this.worldBossPortal.y * ts;
    const cx = px + ts / 2;
    const cy = py + ts / 2;
    const pulse = 0.6 + Math.sin(animTime * 0.006) * 0.4;

    ctx.save();
    // Outer rift glow
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
    grad.addColorStop(0, `rgba(186, 104, 200, ${0.8 * pulse})`);
    grad.addColorStop(0.5, `rgba(94, 53, 177, ${0.5 * pulse})`);
    grad.addColorStop(1, 'rgba(20, 0, 40, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    // Spinning rift ring
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 7 + Math.sin(animTime * 0.004) * 1.5, animTime * 0.004, animTime * 0.004 + Math.PI * 1.4);
    ctx.stroke();

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, -animTime * 0.006, -animTime * 0.006 + Math.PI * 1.2);
    ctx.stroke();

    // Core
    ctx.fillStyle = '#12001f';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(224, 64, 251, ${pulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const mount = this.player.mounted ? getMount(this.player.activeMount) : null;
    const px = Math.floor(this.visualX);
    const py = Math.floor(this.visualY);

    if (mount) {
      const mountY = py + 4;
      const bob = this.isMoving ? Math.sin(this.moveProgress * Math.PI * 2) * 2 : Math.sin(Date.now() * 0.003) * 0.8;

      // Mount shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(px + 8, mountY + 14, 8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.fillStyle = mount.accent;
      const legSwing = this.isMoving && Math.floor(this.moveProgress * 2) % 2 === 0 ? 2 : -2;
      ctx.fillRect(px + 2, mountY + 8 + legSwing, 3, 6);
      ctx.fillRect(px + 11, mountY + 8 - legSwing, 3, 6);

      // Body
      ctx.fillStyle = mount.color;
      ctx.beginPath();
      ctx.ellipse(px + 8, mountY + 6 + bob, 9, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = mount.color;
      ctx.beginPath();
      ctx.arc(px + (this.player.direction === 'left' ? 1 : 15), mountY + 1 + bob, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = mount.accent;
      ctx.fillRect(px + (this.player.direction === 'left' ? -1 : 15), mountY - 5 + bob, 2, 4);
      ctx.fillRect(px + (this.player.direction === 'left' ? 2 : 18), mountY - 5 + bob, 2, 4);

      // Eye
      ctx.fillStyle = '#111';
      ctx.fillRect(px + (this.player.direction === 'left' ? 1 : 17), mountY + bob, 1.5, 1.5);

      // Tail
      ctx.strokeStyle = mount.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + (this.player.direction === 'left' ? 16 : 0), mountY + 4 + bob);
      ctx.lineTo(px + (this.player.direction === 'left' ? 21 : -5), mountY - 1 + bob);
      ctx.stroke();
    }

    const riderOffset = mount ? -4 : 0;
    const walkFrame = this.isMoving ? Math.floor(this.moveProgress * 4) % 4 : 0;
    const legOffset = walkFrame === 1 ? -1 : walkFrame === 3 ? 1 : 0;

    // Shadow
    if (!mount) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(px + 8, py + 14, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs / Pants
    ctx.fillStyle = '#224488';
    ctx.fillRect(px + 4 + legOffset, py + 10 + riderOffset, 3, 5);
    ctx.fillRect(px + 9 - legOffset, py + 10 + riderOffset, 3, 5);

    // Shoes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 3 + legOffset, py + 14 + riderOffset, 4, 2);
    ctx.fillRect(px + 9 - legOffset, py + 14 + riderOffset, 4, 2);

    // Body / Red Jacket
    ctx.fillStyle = '#dd2222';
    ctx.fillRect(px + 4, py + 5 + riderOffset, 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 6, py + 5 + riderOffset, 4, 5);

    // Head / Face
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(px + 5, py + 1 + riderOffset, 6, 5);

    // Cap
    ctx.fillStyle = '#dd2222';
    ctx.fillRect(px + 4, py - 2 + riderOffset, 8, 4);
    ctx.fillStyle = '#ffffff';
    if (this.player.direction === 'down') {
      ctx.fillRect(px + 6, py - 1 + riderOffset, 4, 2);
    } else if (this.player.direction === 'left') {
      ctx.fillRect(px + 3, py - 1 + riderOffset, 4, 2);
    } else if (this.player.direction === 'right') {
      ctx.fillRect(px + 9, py - 1 + riderOffset, 4, 2);
    }

    // Eyes
    ctx.fillStyle = '#000000';
    if (this.player.direction === 'down') {
      ctx.fillRect(px + 6, py + 3 + riderOffset, 1, 2);
      ctx.fillRect(px + 9, py + 3 + riderOffset, 1, 2);
    } else if (this.player.direction === 'left') {
      ctx.fillRect(px + 5, py + 3 + riderOffset, 1, 2);
    } else if (this.player.direction === 'right') {
      ctx.fillRect(px + 10, py + 3 + riderOffset, 1, 2);
    }
  }

  private drawDialogBox(ctx: CanvasRenderingContext2D, cw: number, ch: number, animTime: number) {
    const boxHeight = 84;
    const boxX = 6;
    const boxWidth = cw - 12;
    const boxY = ch - boxHeight - 6;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Drop shadow + panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(boxX + 3, boxY + 3, boxWidth, boxHeight);
    ctx.fillStyle = '#fdfdf7';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = '#1d1d1d';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxWidth - 1, boxHeight - 1);
    ctx.strokeStyle = '#b8c4d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 3.5, boxY + 3.5, boxWidth - 7, boxHeight - 7);

    // Speaker name plate (fully inside the panel)
    const speaker = this.currentDialog?.speaker?.toUpperCase() || '';
    if (speaker) {
      ctx.font = 'bold 9px monospace';
      const plateW = Math.min(boxWidth - 16, Math.ceil(ctx.measureText(speaker).width) + 14);
      ctx.fillStyle = '#2f4e8f';
      ctx.fillRect(boxX + 8, boxY + 6, plateW, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(speaker, boxX + 15, boxY + 16);
    }

    // Body text: pages were wrapped once in startDialog, so just reveal characters.
    const textX = boxX + 12;
    const textY = boxY + 32;
    const lineHeight = 12;

    ctx.font = '10px monospace';
    ctx.fillStyle = '#111111';

    const page = this.currentDialog?.pages[this.currentDialog.pageIndex] || [];
    let remaining = this.currentDialog ? Math.floor(this.currentDialog.revealed) : 0;

    page.forEach((line, idx) => {
      if (remaining <= 0) return;
      const shown = remaining >= line.length ? line : line.slice(0, remaining);
      ctx.fillText(shown, textX, textY + idx * lineHeight);
      remaining -= line.length;
    });

    // Page indicator when the dialog spans multiple pages.
    const totalPages = this.currentDialog?.pages.length || 0;
    const pageIndex = this.currentDialog?.pageIndex || 0;
    if (totalPages > 1) {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#7a8698';
      ctx.fillText(`${pageIndex + 1}/${totalPages}`, boxX + 10, boxY + boxHeight - 8);
    }

    // Blinking continue arrow, bottom-right and clear of the text lines.
    if (this.currentDialog?.isFinished) {
      const arrowX = boxX + boxWidth - 16;
      const blink = Math.floor(animTime / 260) % 2;
      const arrowY = boxY + boxHeight - 16 + blink * 2;
      ctx.fillStyle = blink === 0 ? '#d22' : '#e88';
      ctx.beginPath();
      ctx.moveTo(arrowX - 5, arrowY);
      ctx.lineTo(arrowX + 5, arrowY);
      ctx.lineTo(arrowX, arrowY + 5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
