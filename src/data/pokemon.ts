import type { ActivePokemon, PokemonSpecies, PokemonType } from '../types';
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
    evolution: { level: 32, evolvesToId: 3 },
  },
  // 3: Venusaur
  {
    id: 3,
    name: 'Venusaur',
    category: 'Seed Pokémon',
    height: '2.0 m',
    weight: '100.0 kg',
    entryLore: 'The plant blooms when it absorbs solar energy. It stays on the move to seek sunlight.',
    types: ['grass', 'poison'],
    baseStats: { hp: 80, attack: 82, defense: 83, speed: 80, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 7, moveId: 'vine_whip' },
      { level: 13, moveId: 'razor_leaf' },
      { level: 32, moveId: 'solar_beam' },
    ],
    catchRate: 45,
    baseExp: 236,
    spriteFront: `${SPRITE_FRONT_BASE}3.png`,
    spriteBack: `${SPRITE_BACK_BASE}3.png`,
    color: '#489565',
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
    evolution: { level: 36, evolvesToId: 6 },
  },
  // 6: Charizard
  {
    id: 6,
    name: 'Charizard',
    category: 'Flame Pokémon',
    height: '1.7 m',
    weight: '90.5 kg',
    entryLore: 'It spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.',
    types: ['fire', 'flying'],
    baseStats: { hp: 78, attack: 84, defense: 78, speed: 100, special: 109 },
    learnableMoves: [
      { level: 1, moveId: 'scratch' },
      { level: 7, moveId: 'ember' },
      { level: 15, moveId: 'flamethrower' },
      { level: 36, moveId: 'fire_blast' },
    ],
    catchRate: 45,
    baseExp: 240,
    spriteFront: `${SPRITE_FRONT_BASE}6.png`,
    spriteBack: `${SPRITE_BACK_BASE}6.png`,
    color: '#e85c27',
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
    evolution: { level: 36, evolvesToId: 9 },
  },
  // 9: Blastoise
  {
    id: 9,
    name: 'Blastoise',
    category: 'Shellfish Pokémon',
    height: '1.6 m',
    weight: '85.5 kg',
    entryLore: 'The rocket cannons on its shell fire water jets with enough power to punch holes through thick steel plate.',
    types: ['water'],
    baseStats: { hp: 79, attack: 83, defense: 100, speed: 78, special: 85 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 7, moveId: 'water_gun' },
      { level: 15, moveId: 'bite' },
      { level: 36, moveId: 'hydro_pump' },
    ],
    catchRate: 45,
    baseExp: 239,
    spriteFront: `${SPRITE_FRONT_BASE}9.png`,
    spriteBack: `${SPRITE_BACK_BASE}9.png`,
    color: '#406cb8',
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
    evolution: { level: 25, evolvesToId: 93 },
  },
  // 93: Haunter
  {
    id: 93,
    name: 'Haunter',
    category: 'Gas Pokémon',
    height: '1.6 m',
    weight: '0.1 kg',
    entryLore: 'Because of its ability to slip through block walls, it is said to be from another dimension.',
    types: ['ghost', 'poison'],
    baseStats: { hp: 45, attack: 50, defense: 45, speed: 95, special: 115 },
    learnableMoves: [
      { level: 1, moveId: 'poison_sting' },
      { level: 8, moveId: 'confusion' },
      { level: 15, moveId: 'shadow_ball' },
      { level: 25, moveId: 'psychic' },
    ],
    catchRate: 90,
    baseExp: 142,
    spriteFront: `${SPRITE_FRONT_BASE}93.png`,
    spriteBack: `${SPRITE_BACK_BASE}93.png`,
    color: '#604085',
    evolution: { level: 36, evolvesToId: 94 },
  },
  // 94: Gengar
  {
    id: 94,
    name: 'Gengar',
    category: 'Shadow Pokémon',
    height: '1.5 m',
    weight: '40.5 kg',
    entryLore: 'Under a full moon, this Pokémon likes to mimic the shadows of people and laugh at their fright.',
    types: ['ghost', 'poison'],
    baseStats: { hp: 60, attack: 65, defense: 60, speed: 110, special: 130 },
    learnableMoves: [
      { level: 1, moveId: 'poison_sting' },
      { level: 15, moveId: 'shadow_ball' },
      { level: 25, moveId: 'psychic' },
      { level: 36, moveId: 'hypnosis' },
    ],
    catchRate: 45,
    baseExp: 225,
    spriteFront: `${SPRITE_FRONT_BASE}94.png`,
    spriteBack: `${SPRITE_BACK_BASE}94.png`,
    color: '#4f386b',
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
  // 120: Staryu (Misty's Water Pokémon)
  {
    id: 120,
    name: 'Staryu',
    category: 'Starshape Pokémon',
    height: '0.8 m',
    weight: '34.5 kg',
    entryLore: 'An enigmatic Pokémon that can effortlessly regenerate any appendage it loses in battle.',
    types: ['water'],
    baseStats: { hp: 30, attack: 45, defense: 55, speed: 85, special: 70 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'water_gun' },
      { level: 10, moveId: 'swift' },
      { level: 15, moveId: 'water_pulse' },
    ],
    catchRate: 225,
    baseExp: 68,
    spriteFront: `${SPRITE_FRONT_BASE}120.png`,
    spriteBack: `${SPRITE_BACK_BASE}120.png`,
    color: '#a87840',
  },
  // 121: Starmie (Misty's Ace Water/Psychic Pokémon!)
  {
    id: 121,
    name: 'Starmie',
    category: 'Mysterious Pokémon',
    height: '1.1 m',
    weight: '80.0 kg',
    entryLore: 'Its central core glows with the seven colors of the rainbow. People treat the core as a precious gem.',
    types: ['water', 'psychic'],
    baseStats: { hp: 60, attack: 75, defense: 85, speed: 115, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'water_gun' },
      { level: 10, moveId: 'swift' },
      { level: 15, moveId: 'bubblebeam' },
      { level: 20, moveId: 'confusion' },
    ],
    catchRate: 60,
    baseExp: 182,
    spriteFront: `${SPRITE_FRONT_BASE}121.png`,
    spriteBack: `${SPRITE_BACK_BASE}121.png`,
    color: '#705898',
  },
  // 147: Dratini (Special Gift from Zazzie / Yusti!)
  {
    id: 147,
    name: 'Dratini',
    category: 'Dragon Pokémon',
    height: '1.8 m',
    weight: '3.3 kg',
    entryLore: 'Long considered a mythical Pokémon until recently, when a small colony was found living underwater.',
    types: ['water'],
    baseStats: { hp: 41, attack: 64, defense: 45, speed: 50, special: 50 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'dragon_rage' },
      { level: 10, moveId: 'water_pulse' },
    ],
    catchRate: 45,
    baseExp: 60,
    spriteFront: `${SPRITE_FRONT_BASE}147.png`,
    spriteBack: `${SPRITE_BACK_BASE}147.png`,
    color: '#5577bb',
    evolution: { level: 30, evolvesToId: 148 },
  },
  // 100: Voltorb (Surge's Electric Bomb)
  {
    id: 100,
    name: 'Voltorb',
    category: 'Ball Pokémon',
    height: '0.5 m',
    weight: '10.4 kg',
    entryLore: 'Usually found in power plants. Easily mistaken for a Poké Ball, it has zapped many people.',
    types: ['electric'],
    baseStats: { hp: 40, attack: 30, defense: 50, speed: 100, special: 55 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 6, moveId: 'thundershock' },
      { level: 14, moveId: 'spark' },
      { level: 18, moveId: 'self_destruct' },
    ],
    catchRate: 190,
    baseExp: 66,
    spriteFront: `${SPRITE_FRONT_BASE}100.png`,
    spriteBack: `${SPRITE_BACK_BASE}100.png`,
    color: '#ee4444',
  },
  // 26: Raichu (Surge's Lightning Ace!)
  {
    id: 26,
    name: 'Raichu',
    category: 'Mouse Pokémon',
    height: '0.8 m',
    weight: '30.0 kg',
    entryLore: 'Its long tail serves as a ground to protect itself from its own high-voltage electric power.',
    types: ['electric'],
    baseStats: { hp: 60, attack: 90, defense: 55, speed: 110, special: 90 },
    learnableMoves: [
      { level: 1, moveId: 'thundershock' },
      { level: 8, moveId: 'quick_attack' },
      { level: 14, moveId: 'spark' },
      { level: 20, moveId: 'thunderbolt' },
    ],
    catchRate: 75,
    baseExp: 218,
    spriteFront: `${SPRITE_FRONT_BASE}26.png`,
    spriteBack: `${SPRITE_BACK_BASE}26.png`,
    color: '#e69900',
  },
  // 999: Blocky Noob (Special Roblox Dimension Guest!)
  {
    id: 999,
    name: 'Blocky Noob',
    category: 'Robloxian Pokémon',
    height: '1.2 m',
    weight: '45.0 kg',
    entryLore: 'An interdimensional blocky visitor from the Roblox metaverse! Emits an unmistakable "OOF" sound in battle.',
    types: ['normal', 'fighting'],
    baseStats: { hp: 75, attack: 85, defense: 75, speed: 65, special: 65 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'karate_chop' },
      { level: 10, moveId: 'roblox_sword' },
      { level: 15, moveId: 'self_destruct' },
    ],
    catchRate: 30,
    baseExp: 150,
    spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif', // fallback or procedural
    spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/25.gif',
    color: '#00a2ff',
  },

  // ==========================================
  // --- EARTH CANYON SPECIES (Ground / Rock) ---
  // ==========================================
  {
    id: 27,
    name: 'Sandshrew',
    category: 'Mouse Pokémon',
    height: '0.6 m',
    weight: '12.0 kg',
    entryLore: 'Burrows deep underground in arid locations far from water. Its hide is dry and rock-hard.',
    types: ['ground'],
    baseStats: { hp: 50, attack: 75, defense: 85, speed: 40, special: 40 },
    learnableMoves: [
      { level: 1, moveId: 'scratch' },
      { level: 5, moveId: 'mud_slap' },
      { level: 12, moveId: 'dig' },
      { level: 18, moveId: 'rock_tomb' },
    ],
    catchRate: 255,
    baseExp: 60,
    spriteFront: `${SPRITE_FRONT_BASE}27.png`,
    spriteBack: `${SPRITE_BACK_BASE}27.png`,
    color: '#e0c060',
  },
  {
    id: 50,
    name: 'Diglett',
    category: 'Mole Pokémon',
    height: '0.2 m',
    weight: '0.8 kg',
    entryLore: 'Lives about one meter underground, where it feeds on plant roots. It rarely emerges above ground.',
    types: ['ground'],
    baseStats: { hp: 10, attack: 55, defense: 25, speed: 95, special: 45 },
    learnableMoves: [
      { level: 1, moveId: 'scratch' },
      { level: 4, moveId: 'mud_slap' },
      { level: 10, moveId: 'dig' },
    ],
    catchRate: 255,
    baseExp: 53,
    spriteFront: `${SPRITE_FRONT_BASE}50.png`,
    spriteBack: `${SPRITE_BACK_BASE}50.png`,
    color: '#b08850',
  },
  {
    id: 51,
    name: 'Dugtrio',
    category: 'Mole Pokémon',
    height: '0.7 m',
    weight: '33.3 kg',
    entryLore: 'A team of Diglett triplets. It triggers huge earthquakes by burrowing forty miles underground.',
    types: ['ground'],
    baseStats: { hp: 35, attack: 100, defense: 50, speed: 120, special: 70 },
    learnableMoves: [
      { level: 1, moveId: 'mud_slap' },
      { level: 10, moveId: 'dig' },
      { level: 20, moveId: 'earthquake' },
    ],
    catchRate: 50,
    baseExp: 149,
    spriteFront: `${SPRITE_FRONT_BASE}51.png`,
    spriteBack: `${SPRITE_BACK_BASE}51.png`,
    color: '#a07840',
  },
  {
    id: 34,
    name: 'Nidoking',
    category: 'Drill Pokémon',
    height: '1.4 m',
    weight: '62.0 kg',
    entryLore: 'It uses its powerful tail in battle to smash, constrict, then break the prey\'s bones.',
    types: ['poison', 'ground'],
    baseStats: { hp: 81, attack: 102, defense: 77, speed: 85, special: 75 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 8, moveId: 'poison_sting' },
      { level: 16, moveId: 'mud_slap' },
      { level: 24, moveId: 'earthquake' },
    ],
    catchRate: 45,
    baseExp: 227,
    spriteFront: `${SPRITE_FRONT_BASE}34.png`,
    spriteBack: `${SPRITE_BACK_BASE}34.png`,
    color: '#7058a8',
  },

  // ==========================================
  // --- EMBER VOLCANO SPECIES (Fire) ---
  // ==========================================
  {
    id: 58,
    name: 'Growlithe',
    category: 'Puppy Pokémon',
    height: '0.7 m',
    weight: '19.0 kg',
    entryLore: 'Very protective of its territory. It will bark and bite to repel intruders from its space.',
    types: ['fire'],
    baseStats: { hp: 55, attack: 70, defense: 45, speed: 60, special: 50 },
    learnableMoves: [
      { level: 1, moveId: 'bite' },
      { level: 6, moveId: 'ember' },
      { level: 14, moveId: 'flame_wheel' },
      { level: 22, moveId: 'flamethrower' },
    ],
    catchRate: 190,
    baseExp: 91,
    spriteFront: `${SPRITE_FRONT_BASE}58.png`,
    spriteBack: `${SPRITE_BACK_BASE}58.png`,
    color: '#f08030',
  },
  {
    id: 59,
    name: 'Arcanine',
    category: 'Legendary Pokémon',
    height: '1.9 m',
    weight: '155.0 kg',
    entryLore: 'A Pokémon that has been admired since the past for its beauty. It runs agilely as if on wings.',
    types: ['fire'],
    baseStats: { hp: 90, attack: 110, defense: 80, speed: 95, special: 80 },
    learnableMoves: [
      { level: 1, moveId: 'bite' },
      { level: 10, moveId: 'flame_wheel' },
      { level: 20, moveId: 'flamethrower' },
    ],
    catchRate: 75,
    baseExp: 213,
    spriteFront: `${SPRITE_FRONT_BASE}59.png`,
    spriteBack: `${SPRITE_BACK_BASE}59.png`,
    color: '#e08020',
  },
  {
    id: 77,
    name: 'Ponyta',
    category: 'Fire Horse Pokémon',
    height: '1.0 m',
    weight: '30.0 kg',
    entryLore: 'Its hooves are ten times harder than diamond. It can trample anything completely flat in little time.',
    types: ['fire'],
    baseStats: { hp: 50, attack: 85, defense: 55, speed: 90, special: 65 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'ember' },
      { level: 13, moveId: 'flame_wheel' },
    ],
    catchRate: 190,
    baseExp: 152,
    spriteFront: `${SPRITE_FRONT_BASE}77.png`,
    spriteBack: `${SPRITE_BACK_BASE}77.png`,
    color: '#f0a030',
  },

  // ==========================================
  // --- VERDANT GROVE SPECIES (Grass) ---
  // ==========================================
  {
    id: 44,
    name: 'Gloom',
    category: 'Weed Pokémon',
    height: '0.8 m',
    weight: '8.6 kg',
    entryLore: 'The fluid that oozes from its mouth isn\'t drool. It is a nectar that is used to attract prey.',
    types: ['grass', 'poison'],
    baseStats: { hp: 60, attack: 65, defense: 70, speed: 40, special: 85 },
    learnableMoves: [
      { level: 1, moveId: 'vine_whip' },
      { level: 8, moveId: 'poison_sting' },
      { level: 15, moveId: 'razor_leaf' },
      { level: 24, moveId: 'petal_dance' },
    ],
    catchRate: 120,
    baseExp: 138,
    spriteFront: `${SPRITE_FRONT_BASE}44.png`,
    spriteBack: `${SPRITE_BACK_BASE}44.png`,
    color: '#8878a8',
  },
  {
    id: 45,
    name: 'Vileplume',
    category: 'Flower Pokémon',
    height: '1.2 m',
    weight: '18.6 kg',
    entryLore: 'The larger its petals, the more toxic pollen it contains. Its big head is heavy and hard to hold up.',
    types: ['grass', 'poison'],
    baseStats: { hp: 75, attack: 80, defense: 85, speed: 50, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'razor_leaf' },
      { level: 10, moveId: 'petal_dance' },
      { level: 20, moveId: 'solar_beam' },
    ],
    catchRate: 45,
    baseExp: 221,
    spriteFront: `${SPRITE_FRONT_BASE}45.png`,
    spriteBack: `${SPRITE_BACK_BASE}45.png`,
    color: '#c05080',
  },
  {
    id: 69,
    name: 'Bellsprout',
    category: 'Flower Pokémon',
    height: '0.7 m',
    weight: '4.0 kg',
    entryLore: 'A carnivorous Pokémon that traps and eats bugs. It uses its root feet to soak up needed moisture.',
    types: ['grass', 'poison'],
    baseStats: { hp: 50, attack: 75, defense: 35, speed: 40, special: 70 },
    learnableMoves: [
      { level: 1, moveId: 'vine_whip' },
      { level: 6, moveId: 'poison_sting' },
      { level: 13, moveId: 'razor_leaf' },
    ],
    catchRate: 255,
    baseExp: 60,
    spriteFront: `${SPRITE_FRONT_BASE}69.png`,
    spriteBack: `${SPRITE_BACK_BASE}69.png`,
    color: '#88b040',
  },
  {
    id: 71,
    name: 'Victreebel',
    category: 'Flycatcher Pokémon',
    height: '1.7 m',
    weight: '15.5 kg',
    entryLore: 'Said to live in huge colonies deep in jungles, although no one has ever returned from there.',
    types: ['grass', 'poison'],
    baseStats: { hp: 80, attack: 105, defense: 65, speed: 70, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'razor_leaf' },
      { level: 10, moveId: 'poison_sting' },
      { level: 18, moveId: 'petal_dance' },
      { level: 26, moveId: 'solar_beam' },
    ],
    catchRate: 45,
    baseExp: 221,
    spriteFront: `${SPRITE_FRONT_BASE}71.png`,
    spriteBack: `${SPRITE_BACK_BASE}71.png`,
    color: '#70a030',
  },
  {
    id: 37,
    name: 'Vulpix',
    category: 'Fox Pokémon',
    height: '0.6 m',
    weight: '9.9 kg',
    entryLore: 'At the time of birth, it has just one tail. The tail splits from its tip as it grows older.',
    types: ['fire'],
    baseStats: { hp: 38, attack: 41, defense: 40, speed: 65, special: 50 },
    learnableMoves: [
      { level: 1, moveId: 'scratch' },
      { level: 5, moveId: 'ember' },
      { level: 14, moveId: 'flame_wheel' },
      { level: 22, moveId: 'flamethrower' },
    ],
    catchRate: 190,
    baseExp: 60,
    spriteFront: `${SPRITE_FRONT_BASE}37.png`,
    spriteBack: `${SPRITE_BACK_BASE}37.png`,
    color: '#e0a060',
  },
  {
    id: 114,
    name: 'Tangela',
    category: 'Vine Pokémon',
    height: '1.0 m',
    weight: '35.0 kg',
    entryLore: 'Its whole body is swathed with wide vines that are similar to seaweed. The vines shake as it walks.',
    types: ['grass'],
    baseStats: { hp: 65, attack: 55, defense: 115, speed: 60, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'vine_whip' },
      { level: 8, moveId: 'razor_leaf' },
      { level: 16, moveId: 'petal_dance' },
      { level: 24, moveId: 'solar_beam' },
    ],
    catchRate: 45,
    baseExp: 166,
    spriteFront: `${SPRITE_FRONT_BASE}114.png`,
    spriteBack: `${SPRITE_BACK_BASE}114.png`,
    color: '#50a050',
  },
  // 148: Dragonair
  {
    id: 148,
    name: 'Dragonair',
    category: 'Dragon Pokémon',
    height: '4.0 m',
    weight: '16.5 kg',
    entryLore: 'A mystical Pokémon that exudes a gentle aura. It has the ability to manipulate weather conditions.',
    types: ['dragon', 'flying'],
    baseStats: { hp: 61, attack: 84, defense: 65, speed: 70, special: 70 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 5, moveId: 'dragon_rage' },
      { level: 15, moveId: 'water_pulse' },
      { level: 25, moveId: 'slam' },
    ],
    catchRate: 45,
    baseExp: 147,
    spriteFront: `${SPRITE_FRONT_BASE}148.png`,
    spriteBack: `${SPRITE_BACK_BASE}148.png`,
    color: '#6e8ff0',
    evolution: { level: 55, evolvesToId: 149 },
  },
  // 149: Dragonite
  {
    id: 149,
    name: 'Dragonite',
    category: 'Dragon Pokémon',
    height: '2.2 m',
    weight: '210.0 kg',
    entryLore: 'An extremely rarely seen marine Pokémon. Its intelligence is said to match that of humans.',
    types: ['flying', 'water'],
    baseStats: { hp: 91, attack: 134, defense: 95, speed: 80, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'tackle' },
      { level: 15, moveId: 'dragon_rage' },
      { level: 30, moveId: 'flamethrower' },
      { level: 55, moveId: 'hyper_beam' },
    ],
    catchRate: 45,
    baseExp: 270,
    spriteFront: `${SPRITE_FRONT_BASE}149.png`,
    spriteBack: `${SPRITE_BACK_BASE}149.png`,
    color: '#e09840',
  },
  // 129: Magikarp
  {
    id: 129,
    name: 'Magikarp',
    category: 'Fish Pokémon',
    height: '0.9 m',
    weight: '10.0 kg',
    entryLore: 'In the distant past, it was somewhat stronger than the horribly weak descendants that exist today.',
    types: ['water'],
    baseStats: { hp: 20, attack: 10, defense: 55, speed: 80, special: 20 },
    learnableMoves: [
      { level: 1, moveId: 'splash' },
      { level: 15, moveId: 'tackle' },
    ],
    catchRate: 255,
    baseExp: 40,
    spriteFront: `${SPRITE_FRONT_BASE}129.png`,
    spriteBack: `${SPRITE_BACK_BASE}129.png`,
    color: '#e85838',
    evolution: { level: 20, evolvesToId: 130 },
  },
  // 130: Gyarados
  {
    id: 130,
    name: 'Gyarados',
    category: 'Atrocious Pokémon',
    height: '6.5 m',
    weight: '235.0 kg',
    entryLore: 'Rarely seen in the wild. Huge and vicious, it is capable of destroying entire cities in a rage.',
    types: ['water', 'flying'],
    baseStats: { hp: 95, attack: 125, defense: 79, speed: 81, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'bite' },
      { level: 20, moveId: 'water_gun' },
      { level: 25, moveId: 'dragon_rage' },
      { level: 40, moveId: 'hydro_pump' },
    ],
    catchRate: 45,
    baseExp: 214,
    spriteFront: `${SPRITE_FRONT_BASE}130.png`,
    spriteBack: `${SPRITE_BACK_BASE}130.png`,
    color: '#2868b8',
  },
  // 131: Lapras
  {
    id: 131,
    name: 'Lapras',
    category: 'Transport Pokémon',
    height: '2.5 m',
    weight: '220.0 kg',
    entryLore: 'A gentle Pokémon that loves ferrying people across bodies of water. It understands human speech.',
    types: ['water'],
    baseStats: { hp: 130, attack: 85, defense: 80, speed: 60, special: 95 },
    learnableMoves: [
      { level: 1, moveId: 'water_gun' },
      { level: 10, moveId: 'sing' },
      { level: 20, moveId: 'bubblebeam' },
      { level: 35, moveId: 'hydro_pump' },
    ],
    catchRate: 45,
    baseExp: 219,
    spriteFront: `${SPRITE_FRONT_BASE}131.png`,
    spriteBack: `${SPRITE_BACK_BASE}131.png`,
    color: '#3878c8',
  },
  // 150: Mewtwo
  {
    id: 150,
    name: 'Mewtwo',
    category: 'Genetic Pokémon',
    height: '2.0 m',
    weight: '122.0 kg',
    entryLore: 'It was created by a scientist after years of horrific gene splicing and DNA engineering experiments.',
    types: ['psychic'],
    baseStats: { hp: 106, attack: 110, defense: 90, speed: 130, special: 154 },
    learnableMoves: [
      { level: 1, moveId: 'confusion' },
      { level: 20, moveId: 'swift' },
      { level: 35, moveId: 'psychic' },
      { level: 60, moveId: 'hyper_beam' },
    ],
    catchRate: 3,
    baseExp: 306,
    spriteFront: `${SPRITE_FRONT_BASE}150.png`,
    spriteBack: `${SPRITE_BACK_BASE}150.png`,
    color: '#9068c8',
  },
  // 151: Mew
  {
    id: 151,
    name: 'Mew',
    category: 'New Species',
    height: '0.4 m',
    weight: '4.0 kg',
    entryLore: 'So rare that it is still said to be a mirage by many experts. Only a few people have seen it.',
    types: ['psychic'],
    baseStats: { hp: 100, attack: 100, defense: 100, speed: 100, special: 100 },
    learnableMoves: [
      { level: 1, moveId: 'confusion' },
      { level: 10, moveId: 'psychic' },
      { level: 20, moveId: 'flamethrower' },
      { level: 30, moveId: 'solar_beam' },
    ],
    catchRate: 45,
    baseExp: 270,
    spriteFront: `${SPRITE_FRONT_BASE}151.png`,
    spriteBack: `${SPRITE_BACK_BASE}151.png`,
    color: '#f090b8',
  },
  // 487: Giratina (Lord of Distortion - Dark Souls Boss)
  {
    id: 487,
    name: 'Giratina',
    category: 'Renegade Pokémon',
    height: '4.5 m',
    weight: '750.0 kg',
    entryLore: 'This Pokémon was said to have been banished for its extreme violence. It silently gazed upon the old world from the Distortion World.',
    types: ['ghost', 'dragon'],
    baseStats: { hp: 150, attack: 120, defense: 120, speed: 90, special: 120 },
    learnableMoves: [
      { level: 1, moveId: 'shadow_ball' },
      { level: 20, moveId: 'dragon_rage' },
      { level: 40, moveId: 'earthquake' },
      { level: 60, moveId: 'hyper_beam' },
    ],
    catchRate: 3,
    baseExp: 340,
    spriteFront: `${SPRITE_FRONT_BASE}487.png`,
    spriteBack: `${SPRITE_BACK_BASE}487.png`,
    color: '#34343e',
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

// Per-zone wild encounter tables (zona baru punya Pokémon khas masing-masing)
export const WILD_ENCOUNTER_POOLS: Record<
  string,
  { id: number; minLvl: number; maxLvl: number; weight: number }[]
> = {
  world: WILD_ENCOUNTER_POOL,
  farm: [
    { id: 16, minLvl: 3, maxLvl: 6, weight: 40 }, // Pidgey
    { id: 19, minLvl: 3, maxLvl: 6, weight: 30 }, // Rattata
    { id: 43, minLvl: 4, maxLvl: 7, weight: 20 }, // Oddish
    { id: 10, minLvl: 5, maxLvl: 8, weight: 10 }, // Caterpie
  ],
  zone_earth: [
    { id: 50, minLvl: 14, maxLvl: 18, weight: 35 }, // Diglett
    { id: 27, minLvl: 15, maxLvl: 19, weight: 30 }, // Sandshrew
    { id: 74, minLvl: 15, maxLvl: 20, weight: 20 }, // Geodude
    { id: 51, minLvl: 18, maxLvl: 22, weight: 10 }, // Dugtrio
    { id: 34, minLvl: 20, maxLvl: 24, weight: 5 },  // Nidoking
  ],
  zone_fire: [
    { id: 77, minLvl: 18, maxLvl: 22, weight: 35 }, // Ponyta
    { id: 58, minLvl: 17, maxLvl: 21, weight: 35 }, // Growlithe
    { id: 37, minLvl: 17, maxLvl: 21, weight: 20 }, // Vulpix
    { id: 5, minLvl: 20, maxLvl: 24, weight: 10 },  // Charmeleon
  ],
  zone_grass: [
    { id: 69, minLvl: 16, maxLvl: 20, weight: 35 }, // Bellsprout
    { id: 43, minLvl: 16, maxLvl: 20, weight: 30 }, // Oddish
    { id: 10, minLvl: 14, maxLvl: 18, weight: 20 }, // Caterpie
    { id: 44, minLvl: 20, maxLvl: 24, weight: 10 }, // Gloom
    { id: 114, minLvl: 20, maxLvl: 24, weight: 5 }, // Tangela
  ],
  zone_cave: [
    { id: 41, minLvl: 12, maxLvl: 16, weight: 35 }, // Zubat
    { id: 74, minLvl: 14, maxLvl: 18, weight: 25 }, // Geodude
    { id: 50, minLvl: 13, maxLvl: 17, weight: 15 }, // Diglett
    { id: 92, minLvl: 15, maxLvl: 20, weight: 12 }, // Gastly
    { id: 95, minLvl: 16, maxLvl: 22, weight: 8 },  // Onix
    { id: 75, minLvl: 18, maxLvl: 23, weight: 5 },  // Graveler
  ],
  zone_beach: [
    { id: 120, minLvl: 14, maxLvl: 18, weight: 30 }, // Staryu
    { id: 129, minLvl: 12, maxLvl: 17, weight: 25 }, // Magikarp
    { id: 7, minLvl: 15, maxLvl: 19, weight: 18 },   // Squirtle
    { id: 121, minLvl: 20, maxLvl: 24, weight: 12 }, // Starmie
    { id: 131, minLvl: 22, maxLvl: 26, weight: 8 },  // Lapras
    { id: 130, minLvl: 24, maxLvl: 28, weight: 4 },  // Gyarados
    { id: 150, minLvl: 30, maxLvl: 34, weight: 1 },  // Mewtwo (legendary shore)
  ],
  zone_ruins: [
    { id: 92, minLvl: 18, maxLvl: 23, weight: 28 }, // Gastly
    { id: 93, minLvl: 22, maxLvl: 27, weight: 20 }, // Haunter
    { id: 95, minLvl: 20, maxLvl: 25, weight: 18 }, // Onix
    { id: 74, minLvl: 18, maxLvl: 23, weight: 15 }, // Geodude
    { id: 94, minLvl: 26, maxLvl: 31, weight: 10 }, // Gengar
    { id: 151, minLvl: 30, maxLvl: 35, weight: 4 }, // Mew
    { id: 487, minLvl: 35, maxLvl: 40, weight: 1 }, // Giratina (cursed altar)
  ],
  zone_ice: [
    { id: 120, minLvl: 18, maxLvl: 23, weight: 28 }, // Staryu
    { id: 131, minLvl: 22, maxLvl: 27, weight: 22 }, // Lapras
    { id: 121, minLvl: 24, maxLvl: 29, weight: 18 }, // Starmie
    { id: 133, minLvl: 16, maxLvl: 21, weight: 14 }, // Eevee
    { id: 143, minLvl: 26, maxLvl: 31, weight: 10 }, // Snorlax
    { id: 130, minLvl: 28, maxLvl: 33, weight: 6 },  // Gyarados
    { id: 147, minLvl: 24, maxLvl: 29, weight: 4 },  // Dratini
    { id: 150, minLvl: 34, maxLvl: 40, weight: 1 },  // Mewtwo
  ],
  zone_marsh: [
    { id: 43, minLvl: 16, maxLvl: 21, weight: 28 }, // Oddish
    { id: 69, minLvl: 16, maxLvl: 21, weight: 24 }, // Bellsprout
    { id: 92, minLvl: 18, maxLvl: 23, weight: 18 }, // Gastly
    { id: 44, minLvl: 22, maxLvl: 27, weight: 14 }, // Gloom
    { id: 93, minLvl: 24, maxLvl: 29, weight: 8 },  // Haunter
    { id: 71, minLvl: 26, maxLvl: 31, weight: 5 },  // Victreebel
    { id: 45, minLvl: 28, maxLvl: 33, weight: 2 },  // Vileplume
    { id: 94, minLvl: 30, maxLvl: 35, weight: 1 },  // Gengar
  ],
  zone_sky: [
    { id: 16, minLvl: 14, maxLvl: 19, weight: 24 },  // Pidgey
    { id: 12, minLvl: 16, maxLvl: 21, weight: 18 },  // Butterfree
    { id: 17, minLvl: 20, maxLvl: 25, weight: 20 },  // Pidgeotto
    { id: 147, minLvl: 22, maxLvl: 27, weight: 14 }, // Dratini
    { id: 148, minLvl: 26, maxLvl: 31, weight: 12 }, // Dragonair
    { id: 6, minLvl: 32, maxLvl: 37, weight: 6 },    // Charizard
    { id: 149, minLvl: 34, maxLvl: 40, weight: 4 },  // Dragonite
    { id: 151, minLvl: 36, maxLvl: 42, weight: 2 },  // Mew
  ],
  zone_worldboss: [
    { id: 487, minLvl: 45, maxLvl: 50, weight: 100 }, // Giratina
  ],
};

export function getEncounterPool(zoneId: string) {
  return WILD_ENCOUNTER_POOLS[zoneId] || WILD_ENCOUNTER_POOL;
}

// Every elemental type gets its own signature technique so no two attack
// rotations feel identical. The move unlocks at the listed level.
const SIGNATURE_MOVES: Record<PokemonType, { id: string; level: number }> = {
  normal: { id: 'hyper_fang', level: 14 },
  fire: { id: 'lava_plume', level: 16 },
  water: { id: 'aqua_jet', level: 12 },
  grass: { id: 'mega_drain', level: 13 },
  electric: { id: 'thunder_punch', level: 14 },
  flying: { id: 'wing_attack', level: 12 },
  bug: { id: 'bug_bite', level: 10 },
  poison: { id: 'sludge', level: 15 },
  rock: { id: 'iron_tail', level: 17 },
  ground: { id: 'dig', level: 15 },
  fighting: { id: 'double_kick', level: 12 },
  psychic: { id: 'psybeam', level: 14 },
  ghost: { id: 'shadow_claw', level: 15 },
  dragon: { id: 'dragon_claw', level: 16 },
};

// Secondary techniques to give the AI real variety as levels climb.
const SECONDARY_MOVES: Record<PokemonType, { id: string; level: number }> = {
  normal: { id: 'take_down', level: 22 },
  fire: { id: 'flamethrower', level: 24 },
  water: { id: 'surf', level: 24 },
  grass: { id: 'giga_drain', level: 26 },
  electric: { id: 'thunderbolt', level: 22 },
  flying: { id: 'swift', level: 20 },
  bug: { id: 'swift', level: 20 },
  poison: { id: 'shadow_ball', level: 26 },
  rock: { id: 'earthquake', level: 30 },
  ground: { id: 'earthquake', level: 28 },
  fighting: { id: 'mega_punch', level: 22 },
  psychic: { id: 'shadow_ball', level: 26 },
  ghost: { id: 'shadow_ball', level: 22 },
  dragon: { id: 'dragon_rage', level: 20 },
};

const STATUS_MOVES: Record<PokemonType, { id: string; level: number }> = {
  normal: { id: 'recover', level: 18 },
  fire: { id: 'swords_dance', level: 20 },
  water: { id: 'iron_defense', level: 20 },
  grass: { id: 'swords_dance', level: 20 },
  electric: { id: 'agility', level: 18 },
  flying: { id: 'agility', level: 18 },
  bug: { id: 'iron_defense', level: 18 },
  poison: { id: 'recover', level: 20 },
  rock: { id: 'iron_defense', level: 16 },
  ground: { id: 'iron_defense', level: 18 },
  fighting: { id: 'swords_dance', level: 18 },
  psychic: { id: 'agility', level: 18 },
  ghost: { id: 'recover', level: 20 },
  dragon: { id: 'swords_dance', level: 22 },
};

export function getSignatureMoveIds(species: PokemonSpecies, level: number): string[] {
  const out: string[] = [];
  const primary = species.types[0] || 'normal';
  const sig = SIGNATURE_MOVES[primary];
  const sec = SECONDARY_MOVES[primary];
  const sta = STATUS_MOVES[primary];

  if (sig && level >= sig.level) out.push(sig.id);
  if (sta && level >= sta.level) out.push(sta.id);
  if (sec && level >= sec.level) out.push(sec.id);
  return out;
}

// Dynamic level balancing: wild encounters scale softly with the player's
// strongest Pokémon and badge count so early zones never become trivially
// safe, yet a low-level player is never one-shot by an overleveled spawn.
export function getBalancedLevelRange(
  minLvl: number,
  maxLvl: number,
  party: ActivePokemon[],
  badges: number
): { min: number; max: number } {
  const leadLevel = party.reduce((best, mon) => Math.max(best, mon.level), 1);
  const expected = Math.max(1, leadLevel + badges * 3) - 2;
  const offset = Math.round((expected - (minLvl + maxLvl) / 2) * 0.35);
  const min = Math.max(1, Math.min(80, minLvl + offset));
  const max = Math.max(min, Math.min(85, maxLvl + offset));
  return { min, max };
}

export function getBalancedLevel(baseLevel: number, party: ActivePokemon[], badges: number): number {
  const leadLevel = party.reduce((best, mon) => Math.max(best, mon.level), 1);
  const target = Math.max(1, leadLevel + badges * 2);
  const blended = Math.round(baseLevel * 0.65 + target * 0.35);
  return Math.max(1, Math.min(90, blended));
}

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

  // Append this species' elemental signature rotation so attack sets differ.
  const signatureIds = getSignatureMoveIds(species, level);
  const fullMoveIds = [...unlockedMoveIds];
  signatureIds.forEach((id) => {
    if (!fullMoveIds.includes(id)) fullMoveIds.push(id);
  });

  const activeMoves = fullMoveIds.slice(-4).map((mId) => {
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
