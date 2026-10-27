import type { ActivePokemon, PokemonSpecies } from '../types';
import { MOVES_DATABASE } from './moves';

// Official GitHub PokeAPI sprite repository base URLs
const SPRITE_FRONT_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const SPRITE_BACK_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/';

export const POKEMON_SPECIES_LIST: PokemonSpecies[] = [
  // 1: Bulbasaur
  {
    id: 1,
    name: 'Bulbasaur',
    category: 'Seed Pokémon',
    height: '0.7 m',
    weight: '6.9 kg',
    entryLore: 'A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.',
    types: ['grass', 'poison'],
    baseStats: { hp: 45, attack: 49, defense: 49, speed: 45, special: 65 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 3, moveId: 'growl' },
      { level: 7, moveId: 'vine_whip' },
      { level: 13, moveId: 'razor_leaf' },
    ],
    catchRate: 45,
    baseExp: 64,
    spriteFront: `${SPRITE_FRONT_BASE}1.png`,
    spriteBack: `${SPRITE_BACK_BASE}1.png`,
    color: '#78c850',
    evolution: { level: 16, evolvesToId: 2 },
  },
  // 2: Ivysaur
  {
    id: 2,
    name: 'Ivysaur',
    category: 'Seed Pokémon',
    height: '1.0 m',
    weight: '13.0 kg',
    entryLore: 'When the bud on its back starts swelling, a sweet aroma wafts to indicate its forthcoming bloom.',
    types: ['grass', 'poison'],
    baseStats: { hp: 60, attack: 62, defense: 63, speed: 60, special: 80 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 7, moveId: 'vine_whip' },
      { level: 13, moveId: 'razor_leaf' },
      { level: 20, moveId: 'poison_sting' },
    ],
    catchRate: 45,
    baseExp: 142,
    spriteFront: `${SPRITE_FRONT_BASE}2.png`,
    spriteBack: `${SPRITE_BACK_BASE}2.png`,
    color: '#65ad40',
  },
  // 4: Charmander
  {
    id: 4,
    name: 'Charmander',
    category: 'Lizard Pokémon',
    height: '0.6 m',
    weight: '8.5 kg',
    entryLore: 'The flame on its tail indicates Charmander’s life force. If it is healthy, the flame burns brightly.',
    types: ['fire'],
    baseStats: { hp: 39, attack: 52, defense: 43, speed: 65, special: 60 },
    learnableMoves: [
      { level: 1, moveId: 'scratch' },
      { level: 3, moveId: 'growl' },
      { level: 7, moveId: 'ember' },
      { level: 15, moveId: 'flamethrower' },
    ],
    catchRate: 45,
    baseExp: 62,
    spriteFront: `${SPRITE_FRONT_BASE}4.png`,
    spriteBack: `${SPRITE_BACK_BASE}4.png`,
    color: '#f08030',
    evolution: { level: 16, evolvesToId: 5 },
  },
  // 5: Charmeleon
  {
    id: 5,
    name: 'Charmeleon',
    category: 'Flame Pokémon',
    height: '1.1 m',
    weight: '19.0 kg',
    entryLore: 'When it swings its burning tail, it elevates the temperature around it to unbearably high levels.',
    types: ['fire'],
    baseStats: { hp: 58, attack: 64, defense: 58, speed: 80, special: 80 },
    learnableMoves: [
      { level: 1, moveId: 'scratch' },
      { level: 7, moveId: 'ember' },
      { level: 15, moveId: 'flamethrower' },
      { level: 22, moveId: 'bite' },
    ],
    catchRate: 45,
    baseExp: 142,
    spriteFront: `${SPRITE_FRONT_BASE}5.png`,
    spriteBack: `${SPRITE_BACK_BASE}5.png`,
    color: '#d65f1a',
  },
  // 7: Squirtle
  {
    id: 7,
    name: 'Squirtle',
    category: 'Tiny Turtle Pokémon',
    height: '0.5 m',
    weight: '9.0 kg',
    entryLore: 'After birth, its back swells and hardens into a sturdy shell. It powerfully sprays foam from its mouth.',
    types: ['water'],
    baseStats: { hp: 44, attack: 48, defense: 65, speed: 43, special: 50 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 3, moveId: 'tail_whip' },
      { level: 7, moveId: 'water_gun' },
      { level: 15, moveId: 'hydro_pump' },
    ],
    catchRate: 45,
    baseExp: 63,
    spriteFront: `${SPRITE_FRONT_BASE}7.png`,
    spriteBack: `${SPRITE_BACK_BASE}7.png`,
    color: '#6890f0',
    evolution: { level: 16, evolvesToId: 8 },
  },
  // 8: Wartortle
  {
    id: 8,
    name: 'Wartortle',
    category: 'Turtle Pokémon',
    height: '1.0 m',
    weight: '22.5 kg',
    entryLore: 'It cleverly controls its furry ears and tail to maintain balance while swimming at high speeds.',
    types: ['water'],
    baseStats: { hp: 59, attack: 63, defense: 80, speed: 58, special: 65 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 7, moveId: 'water_gun' },
      { level: 15, moveId: 'bite' },
      { level: 20, moveId: 'hydro_pump' },
    ],
    catchRate: 45,
    baseExp: 142,
    spriteFront: `${SPRITE_FRONT_BASE}8.png`,
    spriteBack: `${SPRITE_BACK_BASE}8.png`,
    color: '#557bcc',
  },
  // 10: Caterpie
  {
    id: 10,
    name: 'Caterpie',
    category: 'Worm Pokémon',
    height: '0.3 m',
    weight: '2.9 kg',
    entryLore: 'For protection, it releases a horrible stench from the antennae on its head to drive away foes.',
    types: ['bug'],
    baseStats: { hp: 45, attack: 30, defense: 35, speed: 45, special: 20 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'bug_bite' },
    ],
    catchRate: 255,
    baseExp: 39,
    spriteFront: `${SPRITE_FRONT_BASE}10.png`,
    spriteBack: `${SPRITE_BACK_BASE}10.png`,
    color: '#a8b820',
    evolution: { level: 7, evolvesToId: 11 },
  },
  // 11: Metapod
  {
    id: 11,
    name: 'Metapod',
    category: 'Cocoon Pokémon',
    height: '0.7 m',
    weight: '9.9 kg',
    entryLore: 'A steel-hard shell protects its tender body. It quietly endures while preparing for evolution.',
    types: ['bug'],
    baseStats: { hp: 50, attack: 25, defense: 55, speed: 30, special: 25 },
    learnableMoves: [
      { level: 1, moveId: 'harden' },
      { level: 7, moveId: 'tackle' },
    ],
    catchRate: 120,
    baseExp: 72,
    spriteFront: `${SPRITE_FRONT_BASE}11.png`,
    spriteBack: `${SPRITE_BACK_BASE}11.png`,
    color: '#a0c020',
    evolution: { level: 10, evolvesToId: 12 },
  },
  // 12: Butterfree
  {
    id: 12,
    name: 'Butterfree',
    category: 'Butterfly Pokémon',
    height: '1.1 m',
    weight: '32.0 kg',
    entryLore: 'In battle, it flaps its wings at great speed to release highly toxic dust into the air.',
    types: ['bug', 'flying'],
    baseStats: { hp: 60, attack: 45, defense: 50, speed: 70, special: 90 },
    learnableMoves: [
      { level: 1, moveId: 'gust' },
      { level: 10, moveId: 'confusion' },
      { level: 14, moveId: 'poison_sting' },
    ],
    catchRate: 45,
    baseExp: 178,
    spriteFront: `${SPRITE_FRONT_BASE}12.png`,
    spriteBack: `${SPRITE_BACK_BASE}12.png`,
    color: '#9078c8',
  },
  // 16: Pidgey
  {
    id: 16,
    name: 'Pidgey',
    category: 'Tiny Bird Pokémon',
    height: '0.3 m',
    weight: '1.8 kg',
    entryLore: 'A common sight in forests and woods. It flaps its wings at ground level to kick up blinding sand.',
    types: ['normal', 'flying'],
    baseStats: { hp: 40, attack: 45, defense: 40, speed: 56, special: 35 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'gust' },
      { level: 9, moveId: 'quick_attack' },
    ],
    catchRate: 255,
    baseExp: 50,
    spriteFront: `${SPRITE_FRONT_BASE}16.png`,
    spriteBack: `${SPRITE_BACK_BASE}16.png`,
    color: '#a890f0',
    evolution: { level: 18, evolvesToId: 17 },
  },
  // 17: Pidgeotto
  {
    id: 17,
    name: 'Pidgeotto',
    category: 'Bird Pokémon',
    height: '1.1 m',
    weight: '30.0 kg',
    entryLore: 'Very protective of its sprawling territorial area, this Pokémon will fiercely peck at any intruder.',
    types: ['normal', 'flying'],
    baseStats: { hp: 63, attack: 60, defense: 55, speed: 71, special: 50 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'gust' },
      { level: 12, moveId: 'quick_attack' },
    ],
    catchRate: 120,
    baseExp: 122,
    spriteFront: `${SPRITE_FRONT_BASE}17.png`,
    spriteBack: `${SPRITE_BACK_BASE}17.png`,
    color: '#9880d8',
  },
  // 19: Rattata
  {
    id: 19,
    name: 'Rattata',
    category: 'Mouse Pokémon',
    height: '0.3 m',
    weight: '3.5 kg',
    entryLore: 'Bites anything when it attacks. Small and very quick, it is a common sight in many places.',
    types: ['normal'],
    baseStats: { hp: 30, attack: 56, defense: 35, speed: 72, special: 25 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 4, moveId: 'quick_attack' },
      { level: 7, moveId: 'tail_whip' },
      { level: 10, moveId: 'bite' },
    ],
    catchRate: 255,
    baseExp: 51,
    spriteFront: `${SPRITE_FRONT_BASE}19.png`,
    spriteBack: `${SPRITE_BACK_BASE}19.png`,
    color: '#a8a878',
  },
  // 25: Pikachu
  {
    id: 25,
    name: 'Pikachu',
    category: 'Mouse Pokémon',
    height: '0.4 m',
    weight: '6.0 kg',
    entryLore: 'When several of these Pokémon gather, their electricity could build and cause lightning storms.',
    types: ['electric'],
    baseStats: { hp: 35, attack: 55, defense: 40, speed: 90, special: 50 },
    learnableMoves: [
      { level: 1, moveId: 'thundershock' },
      { level: 4, moveId: 'tail_whip' },
      { level: 8, moveId: 'quick_attack' },
      { level: 16, moveId: 'thunderbolt' },
    ],
    catchRate: 190,
    baseExp: 112,
    spriteFront: `${SPRITE_FRONT_BASE}25.png`,
    spriteBack: `${SPRITE_BACK_BASE}25.png`,
    color: '#f8d030',
  },
  // 41: Zubat
  {
    id: 41,
    name: 'Zubat',
    category: 'Bat Pokémon',
    height: '0.8 m',
    weight: '7.5 kg',
    entryLore: 'Forms colonies in dark places. It emits ultrasonic cries to check its surroundings and guide flight.',
    types: ['poison', 'flying'],
    baseStats: { hp: 40, attack: 45, defense: 35, speed: 55, special: 40 },
    learnableMoves: [
      { level: 1, moveId: 'bite' },
      { level: 5, moveId: 'gust' },
      { level: 10, moveId: 'poison_sting' },
    ],
    catchRate: 255,
    baseExp: 49,
    spriteFront: `${SPRITE_FRONT_BASE}41.png`,
    spriteBack: `${SPRITE_BACK_BASE}41.png`,
    color: '#705898',
  },
  // 43: Oddish
  {
    id: 43,
    name: 'Oddish',
    category: 'Weed Pokémon',
    height: '0.5 m',
    weight: '5.4 kg',
    entryLore: 'During the day, it keeps its face buried in the ground. At night, it wanders around sowing its seeds.',
    types: ['grass', 'poison'],
    baseStats: { hp: 45, attack: 50, defense: 55, speed: 30, special: 75 },
    learnableMoves: [
      { level: 1, moveId: 'poison_sting' },
      { level: 5, moveId: 'vine_whip' },
      { level: 12, moveId: 'razor_leaf' },
    ],
    catchRate: 255,
    baseExp: 64,
    spriteFront: `${SPRITE_FRONT_BASE}43.png`,
    spriteBack: `${SPRITE_BACK_BASE}43.png`,
    color: '#78c850',
  },
  // 56: Mankey
  {
    id: 56,
    name: 'Mankey',
    category: 'Pig Monkey Pokémon',
    height: '0.5 m',
    weight: '28.0 kg',
    entryLore: 'Extremely quick to anger. It could be docile one moment then thrashing away the next instant.',
    types: ['fighting'],
    baseStats: { hp: 40, attack: 80, defense: 35, speed: 70, special: 35 },
    learnableMoves: [
      { level: 1, moveId: 'scratch' },
      { level: 4, moveId: 'low_kick' },
      { level: 9, moveId: 'karate_chop' },
    ],
    catchRate: 190,
    baseExp: 61,
    spriteFront: `${SPRITE_FRONT_BASE}56.png`,
    spriteBack: `${SPRITE_BACK_BASE}56.png`,
    color: '#c03028',
  },
  // 66: Machop
  {
    id: 66,
    name: 'Machop',
    category: 'Superpower Pokémon',
    height: '0.8 m',
    weight: '19.5 kg',
    entryLore: 'Loves to build its muscles. It trains in all styles of martial arts to become even stronger.',
    types: ['fighting'],
    baseStats: { hp: 70, attack: 80, defense: 50, speed: 35, special: 35 },
    learnableMoves: [
      { level: 1, moveId: 'low_kick' },
      { level: 7, moveId: 'karate_chop' },
      { level: 12, moveId: 'tackle' },
    ],
    catchRate: 180,
    baseExp: 61,
    spriteFront: `${SPRITE_FRONT_BASE}66.png`,
    spriteBack: `${SPRITE_BACK_BASE}66.png`,
    color: '#a03020',
  },
  // 74: Geodude (Brock's Rock Pokémon)
  {
    id: 74,
    name: 'Geodude',
    category: 'Rock Pokémon',
    height: '0.4 m',
    weight: '20.0 kg',
    entryLore: 'Found in fields and mountains. Mistaking them for boulders, people often step or trip on them.',
    types: ['rock', 'ground'],
    baseStats: { hp: 40, attack: 80, defense: 100, speed: 20, special: 30 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 3, moveId: 'harden' },
      { level: 8, moveId: 'rock_throw' },
      { level: 12, moveId: 'mud_slap' },
    ],
    catchRate: 255,
    baseExp: 60,
    spriteFront: `${SPRITE_FRONT_BASE}74.png`,
    spriteBack: `${SPRITE_BACK_BASE}74.png`,
    color: '#b8a038',
    evolution: { level: 25, evolvesToId: 75 },
  },
  // 75: Graveler
  {
    id: 75,
    name: 'Graveler',
    category: 'Rock Pokémon',
    height: '1.0 m',
    weight: '105.0 kg',
    entryLore: 'Rolls down slopes to move. It rolls over any obstacle without slowing or changing its direction.',
    types: ['rock', 'ground'],
    baseStats: { hp: 55, attack: 95, defense: 115, speed: 35, special: 45 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 8, moveId: 'rock_throw' },
      { level: 16, moveId: 'rock_tomb' },
    ],
    catchRate: 120,
    baseExp: 137,
    spriteFront: `${SPRITE_FRONT_BASE}75.png`,
    spriteBack: `${SPRITE_BACK_BASE}75.png`,
    color: '#988028',
  },
  // 92: Gastly
  {
    id: 92,
    name: 'Gastly',
    category: 'Gas Pokémon',
    height: '1.3 m',
    weight: '0.1 kg',
    entryLore: 'Almost invisible, this gaseous Pokémon cloaks the target and puts it to sleep without warning.',
    types: ['ghost', 'poison'],
    baseStats: { hp: 30, attack: 35, defense: 30, speed: 80, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'poison_sting' },
      { level: 8, moveId: 'confusion' },
      { level: 15, moveId: 'shadow_ball' },
    ],
    catchRate: 190,
    baseExp: 62,
    spriteFront: `${SPRITE_FRONT_BASE}92.png`,
    spriteBack: `${SPRITE_BACK_BASE}92.png`,
    color: '#705898',
  },
  // 95: Onix (Brock's Ace Pokémon!)
  {
    id: 95,
    name: 'Onix',
    category: 'Rock Snake Pokémon',
    height: '8.8 m',
    weight: '210.0 kg',
    entryLore: 'As it grows, the stone portions of its body harden to become similar to a diamond, though colored black.',
    types: ['rock', 'ground'],
    baseStats: { hp: 55, attack: 65, defense: 160, speed: 70, special: 30 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'bind' },
      { level: 9, moveId: 'rock_throw' },
      { level: 14, moveId: 'rock_tomb' },
    ],
    catchRate: 45,
    baseExp: 77,
    spriteFront: `${SPRITE_FRONT_BASE}95.png`,
    spriteBack: `${SPRITE_BACK_BASE}95.png`,
    color: '#a89040',
  },
  // 133: Eevee
  {
    id: 133,
    name: 'Eevee',
    category: 'Evolution Pokémon',
    height: '0.3 m',
    weight: '6.5 kg',
    entryLore: 'Its genetic code is irregular. It may mutate if it is exposed to radiation from element stones.',
    types: ['normal'],
    baseStats: { hp: 55, attack: 55, defense: 50, speed: 55, special: 65 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 4, moveId: 'tail_whip' },
      { level: 8, moveId: 'quick_attack' },
      { level: 16, moveId: 'bite' },
    ],
    catchRate: 45,
    baseExp: 65,
    spriteFront: `${SPRITE_FRONT_BASE}133.png`,
    spriteBack: `${SPRITE_BACK_BASE}133.png`,
    color: '#b08050',
  },
  // 143: Snorlax
  {
    id: 143,
    name: 'Snorlax',
    category: 'Sleeping Pokémon',
    height: '2.1 m',
    weight: '460.0 kg',
    entryLore: 'Very lazy. Just eats and sleeps. As its enormous bulk builds, it becomes increasingly reluctant to move.',
    types: ['normal'],
    baseStats: { hp: 160, attack: 110, defense: 65, speed: 30, special: 65 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 8, moveId: 'bite' },
      { level: 15, moveId: 'harden' },
    ],
    catchRate: 25,
    baseExp: 189,
    spriteFront: `${SPRITE_FRONT_BASE}143.png`,
    spriteBack: `${SPRITE_BACK_BASE}143.png`,
    color: '#006666',
  },
];

export const POKEMON_MAP = new Map<number, PokemonSpecies>(
  POKEMON_SPECIES_LIST.map((p) => [p.id, p])
);

// Wild encounters available in Route 1 & Pewter outskirts
export const WILD_ENCOUNTER_POOL = [
  { id: 16, minLvl: 2, maxLvl: 5, weight: 35 }, // Pidgey 35%
  { id: 19, minLvl: 2, maxLvl: 4, weight: 25 }, // Rattata 25%
  { id: 10, minLvl: 3, maxLvl: 5, weight: 15 }, // Caterpie 15%
  { id: 56, minLvl: 4, maxLvl: 6, weight: 10 }, // Mankey 10%
  { id: 41, minLvl: 3, maxLvl: 5, weight: 8 },  // Zubat 8%
  { id: 25, minLvl: 4, maxLvl: 6, weight: 5 },  // Pikachu 5%
  { id: 74, minLvl: 4, maxLvl: 7, weight: 2 },  // Geodude 2%
];

export function calculateMaxHp(baseHp: number, level: number): number {
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
}

export function calculateStat(baseStat: number, level: number): number {
  return Math.floor(((2 * baseStat + 31) * level) / 100) + 5;
}

export function calculateExpForNextLevel(level: number): number {
  return Math.floor(Math.pow(level, 3) * 0.8) + 15;
}

export function createActivePokemon(speciesId: number, level: number): ActivePokemon {
  const species = POKEMON_MAP.get(speciesId);
  if (!species) {
    throw new Error(`Unknown pokemon species id: ${speciesId}`);
  }

  const maxHp = calculateMaxHp(species.baseStats.hp, level);
  const stats = {
    attack: calculateStat(species.baseStats.attack, level),
    defense: calculateStat(species.baseStats.defense, level),
    speed: calculateStat(species.baseStats.speed, level),
    special: calculateStat(species.baseStats.special, level),
  };

  const unlockedMoveIds = species.learnableMoves
    .filter((lm) => lm.level <= level)
    .map((lm) => lm.moveId);

  const activeMoves = unlockedMoveIds.slice(-4).map((mId) => {
    const moveData = MOVES_DATABASE[mId] || MOVES_DATABASE['tackle'];
    return {
      move: moveData,
      currentPp: moveData.pp,
    };
  });

  if (activeMoves.length === 0) {
    activeMoves.push({
      move: MOVES_DATABASE['tackle'],
      currentPp: MOVES_DATABASE['tackle'].pp,
    });
  }

  return {
    species,
    level,
    currentHp: maxHp,
    maxHp,
    stats,
    moves: activeMoves,
    currentExp: 0,
    nextLevelExp: calculateExpForNextLevel(level),
  };
}
