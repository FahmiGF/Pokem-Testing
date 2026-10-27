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
  | 'ghost';

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
  statChange?: {
    stat: 'attack' | 'defense' | 'speed';
    stages: number; // positive or negative
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

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  price: number;
  type: 'pokeball' | 'potion' | 'revive';
  description: string;
}

export interface PlayerData {
  x: number;
  y: number;
  direction: 'down' | 'up' | 'left' | 'right';
  party: ActivePokemon[];
  inventory: InventoryItem[];
  money: number;
  badges: number;
  hasBoulderBadge: boolean;
  seenPokemon: number[];
  caughtPokemon: number[];
  defeatedTrainers: string[];
}
