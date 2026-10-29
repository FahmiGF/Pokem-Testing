export type PokemonType = 
  | 'normal'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'flying'
  | 'bug'
  | 'poison'
  | 'rock'
  | 'ground'
  | 'fighting'
  | 'psychic'
  | 'ghost'
  | 'dragon';

export type MoveEffect =
  | 'multi_hit'
  | 'drain'
  | 'recoil'
  | 'heal'
  | 'priority'
  | 'high_crit'
  | 'fixed'
  | 'flinch';

export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  category: 'physical' | 'special' | 'status';
  description: string;
  effect?: MoveEffect;
  statChange?: {
    stat: 'attack' | 'defense' | 'speed';
    stages: number; // positive or negative
  };
  selfStatChange?: {
    stat: 'attack' | 'defense' | 'speed';
    stages: number;
  };
}

export interface PokemonSpecies {
  id: number;
  name: string;
  category: string;
  height: string;
  weight: string;
  entryLore: string;
  types: PokemonType[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    special: number;
  };
  learnableMoves: { level: number; moveId: string }[];
  catchRate: number; // out of 255
  baseExp: number;
  spriteFront: string;
  spriteBack: string;
  color: string;
  evolution?: {
    level: number;
    evolvesToId: number;
  };
}

export interface ActivePokemonMove {
  move: Move;
  currentPp: number;
}

export interface ActivePokemon {
  species: PokemonSpecies;
  nickname?: string;
  level: number;
  currentHp: number;
  maxHp: number;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    special: number;
  };
  moves: ActivePokemonMove[];
  currentExp: number;
  nextLevelExp: number;
  statusEffect?: 'burn' | 'paralysis' | 'poison';
}

export type InventoryItemType =
  | 'pokeball'
  | 'potion'
  | 'revive'
  | 'seed'
  | 'crop'
  | 'candy'
  | 'service'
  | 'stone'
  | 'booster'
  | 'souls_gear'
  | 'kart_gear'
  | 'ingredient'
  | 'dish'
  | 'gem';

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  price: number;
  type: InventoryItemType;
  description: string;
  icon?: string;
  category?: 'BALL' | 'MEDICINE' | 'SPECIAL' | 'SEED' | 'SERVICE' | 'EXP_SHOP' | 'INGREDIENT' | 'DISH' | 'GEM';
  service?: 'levelup' | 'heal' | 'speed';
}

export interface FarmPlot {
  seedId: string | null;
  growth: number;
}

export interface PlayerData {
  x: number;
  y: number;
  direction: 'down' | 'up' | 'left' | 'right';
  party: ActivePokemon[];
  inventory: InventoryItem[];
  money: number;
  expTokens?: number;
  gems?: number;
  fishCaught?: number;
  dishesCooked?: number;
  coinsCollected?: number;
  ownedMounts?: string[];
  activeMount?: string | null;
  mounted?: boolean;
  teleportUnlocked?: boolean;
  worldBossDefeated?: boolean;
  worldBossWins?: number;
  kartStats?: {
    speedUpgrades: number;
    nitroCharges: number;
    wins: number;
  };
  soulsStats?: {
    estusCharges: number;
    estusLevel: number;
    bossVictories: number;
    swordUpgrade: number;
    rollUpgrade: number;
  };
  badges: number;
  hasBoulderBadge: boolean;
  hasCascadeBadge: boolean;
  hasThunderBadge: boolean;
  hasEarthBadge: boolean;
  hasFireBadge: boolean;
  hasGrassBadge: boolean;
  zoneId?: string;
  farmPlots: FarmPlot[];
  metSpecialYusti?: boolean;
  metSpecialZaky?: boolean;
  metSpecialDio?: boolean;
  metSpecialZazzie?: boolean;
  seenPokemon: number[];
  caughtPokemon: number[];
  defeatedTrainers: string[];
  arcadeHighScores?: Record<string, number>;
}
