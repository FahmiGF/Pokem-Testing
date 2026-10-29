// Multi-zone world: house/gym interiors + 3 elemental territories + Sunny Farm.

import { TileMap, TileType, type NPC, type ZoneDef, type ZoneExit } from './tilemap';

export const FARM_PLOT_COORDS = [
  { x: 5, y: 10 },
  { x: 7, y: 10 },
  { x: 9, y: 10 },
  { x: 11, y: 10 },
  { x: 5, y: 13 },
  { x: 7, y: 13 },
  { x: 9, y: 13 },
  { x: 11, y: 13 },
];

interface RoomOptions {
  id: string;
  name: string;
  floor?: TileType;
  exit: ZoneExit;
  npcs: NPC[];
  decorate?: (data: number[][], w: number, h: number) => void;
}

function makeRoom(opts: RoomOptions): ZoneDef {
  const w = 24;
  const h = 18;
  const floor = opts.floor ?? TileType.INDOOR_FLOOR;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      row.push(isBorder ? TileType.INDOOR_WALL : floor);
    }
    data.push(row);
  }

  // Entry / exit mat near the bottom wall.
  data[15][11] = floor;
  data[16][11] = TileType.EXIT_MAT;
  data[16][10] = TileType.EXIT_MAT;

  if (opts.decorate) opts.decorate(data, w, h);

  data[16][11] = TileType.EXIT_MAT;
  data[16][10] = TileType.EXIT_MAT;

  return {
    id: opts.id,
    name: opts.name,
    width: w,
    height: h,
    data,
    npcs: opts.npcs,
    exits: [opts.exit],
    isInterior: true,
  };
}

function counterRow(data: number[][], x1: number, x2: number, y: number) {
  for (let x = x1; x <= x2; x++) data[y][x] = TileType.COUNTER;
}

// =============================================================
// INTERIOR NPVs
// =============================================================

const oakNpc: NPC = {
  id: 'oak',
  name: 'Prof. Oak',
  x: 11,
  y: 5,
  direction: 'down',
  dialog: [
    'Ah, welcome to my Pokémon Research Lab!',
    'Every house and Gym in Kanto now has its own interior zone.',
    'New territories await: Terra Canyon (Earth), Ember Volcano (Fire), and Verdant Grove (Grass).',
    'Visit Sunny Farm west of Pallet Town to plant seeds and earn money!',
  ],
  type: 'professor',
  color: '#d2b48c',
};

const nursePallet: NPC = {
  id: 'nurse_pallet',
  name: 'Nurse Joy',
  x: 11,
  y: 5,
  direction: 'down',
  dialog: [
    'Welcome to Pallet Town Care Station!',
    'Let me heal your Pokémon team back to full health!',
  ],
  type: 'nurse',
  color: '#ff99b3',
};

const nursePewter: NPC = {
  id: 'nurse_pewter',
  name: 'Nurse Joy',
  x: 11,
  y: 5,
  direction: 'down',
  dialog: [
    'Welcome to Pewter City Pokémon Center!',
    'Rest here and let me restore your team!',
  ],
  type: 'nurse',
  color: '#ff99b3',
};

const martClerk: NPC = {
  id: 'clerk_mart',
  name: 'Mart Clerk',
  x: 11,
  y: 5,
  direction: 'down',
  dialog: [
    'Welcome to the Pewter City Pokémon Mart!',
    'We stock Poké Balls, Great Balls, Potions, and Revives!',
  ],
  type: 'clerk',
  shopType: 'poke',
  color: '#44aa44',
};

const brock: NPC = {
  id: 'gym_leader_brock',
  name: 'Gym Leader Brock',
  x: 11,
  y: 6,
  direction: 'down',
  dialog: [
    "I'm Brock, the PEWTER GYM LEADER!",
    'I believe in rock-hard defense and determination!',
    'Do you dare challenge my Geodude and mighty Onix?!',
  ],
  type: 'gym_leader',
  color: '#996633',
  trainerParty: [
    { id: 74, level: 12 },
    { id: 95, level: 14 },
  ],
  rewardMoney: 1500,
  badge: 'BOULDER BADGE',
  afterDefeatDialog: [
    'Your Pokémon broke through my rock defense!',
    'Take the official BOULDER BADGE as proof of your victory!',
    'Now challenge Misty at the Cerulean Water Gym!',
  ],
};

const misty: NPC = {
  id: 'gym_leader_misty',
  name: 'Gym Leader Misty',
  x: 11,
  y: 6,
  direction: 'down',
  dialog: [
    'Hi! I am Misty, the Tomboyish Mermaid!',
    'My policy is an all-out offensive with Water-type Pokémon!',
    'Face the swirling tides of my Staryu and Starmie!',
  ],
  type: 'gym_leader',
  color: '#ee4422',
  trainerParty: [
    { id: 120, level: 15 },
    { id: 121, level: 17 },
  ],
  rewardMoney: 2000,
  badge: 'CASCADE BADGE',
  afterDefeatDialog: [
    'Wow! You really are a prodigy trainer!',
    'You earned the official CASCADE BADGE!',
    'Head to Vermilion Port to face Lt. Surge!',
  ],
};

const surge: NPC = {
  id: 'gym_leader_surge',
  name: 'Lt. Surge',
  x: 11,
  y: 6,
  direction: 'down',
  dialog: [
    'Ten-hut! I am Lieutenant Surge of the Vermilion Electric Gym!',
    'Electric Pokémon saved me during the war!',
    'My Voltorb and Raichu will blast you with high voltage BOOM power!',
  ],
  type: 'gym_leader',
  color: '#556622',
  trainerParty: [
    { id: 100, level: 18 },
    { id: 26, level: 21 },
  ],
  rewardMoney: 2800,
  badge: 'THUNDER BADGE',
  afterDefeatDialog: [
    'That is explosive firepower! You fried my defenses fair and square!',
    'Take the official THUNDER BADGE, soldier!',
  ],
};

const giovanni: NPC = {
  id: 'gym_leader_giovanni',
  name: 'Gym Leader Giovanni',
  x: 11,
  y: 6,
  direction: 'down',
  dialog: [
    'So... you have found my Terra Canyon hideout.',
    'I am Giovanni, master of Ground-type Pokémon.',
    'The earth itself answers my command. Can you withstand my quake?!',
  ],
  type: 'gym_leader',
  color: '#3a3a3a',
  trainerParty: [
    { id: 27, level: 24 },
    { id: 51, level: 26 },
    { id: 34, level: 29 },
  ],
  rewardMoney: 4200,
  badge: 'EARTH BADGE',
  afterDefeatDialog: [
    'Impossible! My earth-shattering power has been crushed!',
    'Take the EARTH BADGE. The ground itself now acknowledges you.',
  ],
};

const blaine: NPC = {
  id: 'gym_leader_blaine',
  name: 'Gym Leader Blaine',
  x: 11,
  y: 6,
  direction: 'down',
  dialog: [
    'Hah! Welcome to the Ember Volcano Gym, hotshot!',
    'I am Blaine, the hot-headed Fire-type master!',
    'My flames burn hotter than the volcano itself!',
  ],
  type: 'gym_leader',
  color: '#cc3300',
  trainerParty: [
    { id: 58, level: 26 },
    { id: 77, level: 28 },
    { id: 59, level: 31 },
  ],
  rewardMoney: 5000,
  badge: 'FLAME BADGE',
  afterDefeatDialog: [
    'Incredible! Your spirit burned brighter than my flames!',
    'You have earned the FLAME BADGE! Wear it with pride!',
  ],
};

const erika: NPC = {
  id: 'gym_leader_erika',
  name: 'Gym Leader Erika',
  x: 11,
  y: 6,
  direction: 'down',
  dialog: [
    'Welcome to the Verdant Grove Gym... please, relax.',
    'I am Erika, and I cultivate Grass-type Pokémon.',
    'Nature\'s elegance will gently put you to sleep!',
  ],
  type: 'gym_leader',
  color: '#3f8a3f',
  trainerParty: [
    { id: 69, level: 25 },
    { id: 44, level: 27 },
    { id: 71, level: 30 },
  ],
  rewardMoney: 4600,
  badge: 'GROVE BADGE',
  afterDefeatDialog: [
    'Oh my... your strength blossoms beautifully.',
    'Please accept the GROVE BADGE, champion of nature.',
  ],
};

const channelerRuth: NPC = {
  id: 'channeler_ruth',
  name: 'Channeler Ruth',
  x: 11,
  y: 6,
  direction: 'down',
  dialog: [
    'Kekeke... Welcome to the Pokémon Tower...',
    'Spirits of Gastly drift through the purple mists.',
    'Do you believe in ghosts, brave traveler?',
  ],
  type: 'citizen',
  color: '#662288',
};

const robloxNoob: NPC = {
  id: 'roblox_noob',
  name: 'Classic Noob',
  x: 8,
  y: 7,
  direction: 'right',
  dialog: [
    'OOF! Where am I?! Did I get teleported into Kanto from Brookhaven?!',
    'Check out my blocky Link Sword! Care to duel?',
  ],
  type: 'trainer',
  color: '#0022cc',
  trainerParty: [{ id: 999, level: 16 }],
  rewardMoney: 1200,
  afterDefeatDialog: ['OOF! You defeated my Blocky Avatar! GG, no re!'],
};

const robloxBacon: NPC = {
  id: 'roblox_bacon',
  name: 'Bacon Hair',
  x: 15,
  y: 7,
  direction: 'left',
  dialog: [
    'Sup! Just hanging out at the Roblox Portal hub.',
    'Battle Noob if you dare, but watch out for his Self-Destruct boom!',
  ],
  type: 'citizen',
  color: '#aa5533',
};

const yusti: NPC = {
  id: 'special_yusti',
  name: 'Yusti (The Tactician)',
  x: 6,
  y: 6,
  direction: 'right',
  dialog: [
    'Yo! Welcome to our Secret Hideout!',
    "I'm Yusti! I study battle strategies and team chemistry.",
    'Always exploit elemental weaknesses!',
    'Here, take this special Dragon-type baby I raised!',
  ],
  type: 'special_friend',
  color: '#4477dd',
  giftPokemonId: 147,
  giftPokemonLevel: 10,
  afterDefeatDialog: [
    'Dratini starts gentle, but evolves into the mighty Dragonite!',
  ],
};

const zaky: NPC = {
  id: 'special_zaky',
  name: 'Zaky (The Gear Master)',
  x: 17,
  y: 6,
  direction: 'left',
  dialog: [
    'Wazzup! Zaky here! I handle the supply chain for our squad.',
    'Take these 5 Super Potions and 5 Great Balls on the house!',
  ],
  type: 'special_friend',
  color: '#e69900',
  giftItem: { id: 'super_potion', name: 'Super Potion', count: 5 },
  afterDefeatDialog: ['Stay sharp out there, champion!'],
};

const dio: NPC = {
  id: 'special_dio',
  name: 'Dio (The Wild Striker)',
  x: 6,
  y: 11,
  direction: 'right',
  dialog: [
    'KONO DIO DA! Haha, just kidding!',
    "I'm Dio! I love fierce physical attacks and speed!",
    'Show me what you got in a legendary friendly spar!',
  ],
  type: 'special_friend',
  color: '#ddbb11',
  trainerParty: [
    { id: 25, level: 12 },
    { id: 133, level: 13 },
  ],
  rewardMoney: 800,
  afterDefeatDialog: ['WRYYYY! What tremendous power! Speed decides everything!'],
};

const zazzie: NPC = {
  id: 'special_zazzie',
  name: 'Zazzie (The Tech Oracle)',
  x: 17,
  y: 11,
  direction: 'left',
  dialog: [
    'Beep boop! Greetings, player! Zazzie at your service.',
    'I built this whole secret monitoring system with canvas & chiptune audio!',
    'Hold SHIFT to run. Press ENTER for Pokédex and save options!',
  ],
  type: 'special_friend',
  color: '#9933cc',
  giftItem: { id: 'revive', name: 'Revive', count: 3 },
  afterDefeatDialog: ['System diagnostic: 100% bug free!'],
};

const farmClerk: NPC = {
  id: 'farm_seed_clerk',
  name: 'Farmer Maple',
  x: 7,
  y: 6,
  direction: 'down',
  dialog: [
    'Howdy! Welcome to Sunny Farm!',
    'Buy seeds here, plant them in the soil plots, and harvest for Pokédollars!',
    'Press A facing a soil plot to plant or harvest.',
  ],
  type: 'clerk',
  shopType: 'seed',
  color: '#7a9a3a',
};

const levelClerk: NPC = {
  id: 'farm_level_clerk',
  name: 'Dojo Master Ken',
  x: 15,
  y: 6,
  direction: 'down',
  dialog: [
    'Welcome to the Farm Dojo!',
    'I can train your lead Pokémon to the next level for a fee.',
    'Or fully restore your whole team. Power has a price, kid!',
  ],
  type: 'clerk',
  shopType: 'level',
  color: '#aa4422',
};

const farmNurse: NPC = {
  id: 'farm_nurse',
  name: 'Nurse Joy',
  x: 19,
  y: 6,
  direction: 'down',
  dialog: [
    'Welcome to the Sunny Farm Care Station!',
    'Let me heal your hard-working Pokémon!',
  ],
  type: 'nurse',
  color: '#ff99b3',
};

const farmGrandma: NPC = {
  id: 'farm_grandma',
  name: 'Grandma Rose',
  x: 11,
  y: 5,
  direction: 'down',
  dialog: [
    'Seeds grow a little every few steps you take, dearie.',
    'Golden Seeds take the longest, but they pay the most!',
  ],
  type: 'citizen',
  color: '#aa6688',
};

// =============================================================
// INTERIOR ZONE DEFINITIONS
// =============================================================

const rooms: ZoneDef[] = [
  makeRoom({
    id: 'lab_oak',
    name: "Oak's Lab",
    floor: TileType.MARBLE,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 13, targetY: 59 },
    npcs: [oakNpc],
    decorate: (data) => {
      counterRow(data, 4, 9, 3);
      counterRow(data, 13, 18, 3);
      data[10][4] = TileType.CARPET;
      data[10][5] = TileType.CARPET;
    },
  }),
  makeRoom({
    id: 'house_pallet',
    name: 'Pallet Rest House',
    floor: TileType.WOOD_FLOOR,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 23, targetY: 60 },
    npcs: [nursePallet],
    decorate: (data) => {
      counterRow(data, 7, 15, 4);
      for (let x = 5; x <= 17; x++) data[9][x] = TileType.CARPET;
    },
  }),
  makeRoom({
    id: 'clubhouse',
    name: 'Secret VIP Clubhouse',
    floor: TileType.WOOD_FLOOR,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 5, targetY: 68 },
    npcs: [yusti, zaky, dio, zazzie],
    decorate: (data) => {
      for (let y = 5; y <= 12; y++) {
        for (let x = 5; x <= 18; x++) data[y][x] = TileType.CARPET;
      }
      counterRow(data, 8, 14, 3);
    },
  }),
  makeRoom({
    id: 'center_pewter',
    name: 'Pewter Pokémon Center',
    floor: TileType.MARBLE,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 9, targetY: 29 },
    npcs: [nursePewter],
    decorate: (data) => {
      counterRow(data, 7, 15, 4);
      data[10][11] = TileType.CARPET;
      data[10][10] = TileType.CARPET;
    },
  }),
  makeRoom({
    id: 'mart_pewter',
    name: 'Pewter Pokémon Mart',
    floor: TileType.WOOD_FLOOR,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 23, targetY: 29 },
    npcs: [martClerk],
    decorate: (data) => {
      counterRow(data, 6, 16, 4);
      counterRow(data, 4, 5, 9);
      counterRow(data, 18, 19, 9);
    },
  }),
  makeRoom({
    id: 'gym_rock',
    name: 'Pewter Rock Gym',
    floor: TileType.GYM_MAT,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 17, targetY: 22 },
    npcs: [brock],
    decorate: (data) => {
      for (let x = 7; x <= 15; x++) data[4][x] = TileType.ROCK;
      data[8][5] = TileType.ROCK;
      data[8][17] = TileType.ROCK;
    },
  }),
  makeRoom({
    id: 'gym_water',
    name: 'Cerulean Water Gym',
    floor: TileType.GYM_MAT,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 32, targetY: 22 },
    npcs: [misty],
    decorate: (data) => {
      for (let y = 4; y <= 7; y++) {
        data[y][4] = TileType.WATER;
        data[y][18] = TileType.WATER;
      }
      for (let y = 9; y <= 12; y++) {
        data[y][7] = TileType.WATER;
        data[y][15] = TileType.WATER;
      }
    },
  }),
  makeRoom({
    id: 'gym_electric',
    name: 'Vermilion Electric Gym',
    floor: TileType.GYM_MAT,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 37, targetY: 60 },
    npcs: [surge],
    decorate: (data) => {
      for (let x = 4; x <= 18; x += 2) data[9][x] = TileType.ELECTRIC_GYM_WALL;
      for (let x = 5; x <= 17; x += 2) data[12][x] = TileType.ELECTRIC_GYM_WALL;
    },
  }),
  makeRoom({
    id: 'roblox_shrine',
    name: 'Roblox Portal Shrine',
    floor: TileType.MARBLE,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 8, targetY: 8 },
    npcs: [robloxNoob, robloxBacon],
    decorate: (data) => {
      for (let x = 3; x <= 20; x += 3) {
        data[3][x] = TileType.ROBLOX_BLOCK;
        data[13][x] = TileType.ROBLOX_BLOCK;
      }
    },
  }),
  makeRoom({
    id: 'lavender_tower',
    name: 'Pokémon Tower',
    floor: TileType.CARPET,
    exit: { x: 11, y: 16, targetZone: 'world', targetX: 33, targetY: 9 },
    npcs: [channelerRuth],
    decorate: (data) => {
      for (let x = 4; x <= 18; x++) data[4][x] = TileType.LAVENDER_WALL;
      data[8][4] = TileType.LAVENDER_WALL;
      data[8][18] = TileType.LAVENDER_WALL;
    },
  }),
  makeRoom({
    id: 'farmhouse',
    name: 'Sunny Farm House',
    floor: TileType.WOOD_FLOOR,
    exit: { x: 11, y: 16, targetZone: 'farm', targetX: 12, targetY: 5 },
    npcs: [farmGrandma, levelClerk],
    decorate: (data) => {
      counterRow(data, 6, 16, 4);
      data[9][8] = TileType.CARPET;
      data[9][9] = TileType.CARPET;
    },
  }),
  makeRoom({
    id: 'gym_earth',
    name: 'Terra Earth Gym',
    floor: TileType.CAVE_FLOOR,
    exit: { x: 11, y: 16, targetZone: 'zone_earth', targetX: 12, targetY: 6 },
    npcs: [giovanni],
    decorate: (data) => {
      for (let x = 5; x <= 17; x++) data[4][x] = TileType.CAVE_WALL;
      data[8][4] = TileType.ROCK;
      data[8][18] = TileType.ROCK;
      data[11][4] = TileType.ROCK;
      data[11][18] = TileType.ROCK;
    },
  }),
  makeRoom({
    id: 'gym_fire',
    name: 'Ember Fire Gym',
    floor: TileType.SAND,
    exit: { x: 11, y: 16, targetZone: 'zone_fire', targetX: 12, targetY: 6 },
    npcs: [blaine],
    decorate: (data) => {
      for (let x = 3; x <= 20; x += 2) data[3][x] = TileType.LAVA;
      data[8][4] = TileType.LAVA;
      data[8][18] = TileType.LAVA;
      data[11][6] = TileType.LAVA;
      data[11][16] = TileType.LAVA;
    },
  }),
  makeRoom({
    id: 'gym_grass',
    name: 'Verdant Grass Gym',
    floor: TileType.TALL_GRASS,
    exit: { x: 11, y: 16, targetZone: 'zone_grass', targetX: 12, targetY: 6 },
    npcs: [erika],
    decorate: (data) => {
      for (let y = 4; y <= 8; y++) {
        data[y][4] = TileType.TREE;
        data[y][18] = TileType.TREE;
      }
      for (let x = 7; x <= 15; x++) data[10][x] = TileType.FLOWER;
    },
  }),
];

// =============================================================
// ELEMENTAL TERRITORY MAPS
// =============================================================

interface TerritoryOptions {
  id: string;
  name: string;
  floor: TileType;
  border: TileType;
  encounterTile: TileType;
  gymInteriorId: string;
  returnWorld: { x: number; y: number };
  accent: TileType;
  npcs: NPC[];
}

function makeTerritory(opts: TerritoryOptions): ZoneDef {
  const w = 26;
  const h = 20;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      row.push(isBorder ? opts.border : opts.floor);
    }
    data.push(row);
  }

  // Main path from entrance to the Gym.
  for (let y = 5; y <= 18; y++) {
    data[y][11] = opts.floor;
    data[y][12] = opts.floor;
  }

  // Wild encounter patches.
  for (let y = 9; y <= 15; y++) {
    for (let x = 4; x <= 9; x++) data[y][x] = opts.encounterTile;
  }
  for (let y = 9; y <= 15; y++) {
    for (let x = 14; x <= 19; x++) data[y][x] = opts.encounterTile;
  }

  // Gym facade at the top.
  for (let y = 2; y <= 5; y++) {
    for (let x = 9; x <= 14; x++) {
      data[y][x] = y <= 3 ? TileType.GYM_ROOF : TileType.GYM_WALL;
    }
  }
  data[5][11] = TileType.DOOR;
  data[5][12] = TileType.DOOR;

  // Decorative accents.
  data[17][6] = opts.accent;
  data[17][18] = opts.accent;
  data[7][4] = opts.accent;
  data[7][20] = opts.accent;

  // Exit back to the overworld.
  data[18][11] = TileType.EXIT_MAT;
  data[18][12] = TileType.EXIT_MAT;
  data[17][11] = opts.floor;
  data[17][12] = opts.floor;

  return {
    id: opts.id,
    name: opts.name,
    width: w,
    height: h,
    data,
    npcs: opts.npcs,
    exits: [
      { x: 11, y: 18, targetZone: 'world', targetX: opts.returnWorld.x, targetY: opts.returnWorld.y },
      { x: 12, y: 18, targetZone: 'world', targetX: opts.returnWorld.x, targetY: opts.returnWorld.y },
      { x: 11, y: 5, targetZone: opts.gymInteriorId, targetX: 11, targetY: 15 },
      { x: 12, y: 5, targetZone: opts.gymInteriorId, targetX: 11, targetY: 15 },
    ],
  };
}

const earthGuide: NPC = {
  id: 'earth_guide',
  name: 'Canyon Guide',
  x: 15,
  y: 16,
  direction: 'left',
  dialog: [
    'Careful, traveler! This is TERRA CANYON.',
    'Diglett and Sandshrew burrow beneath the stone.',
    'Gym Leader Giovanni waits at the summit with Ground-type power!',
  ],
  type: 'citizen',
  color: '#8a6a3a',
};

const fireGuide: NPC = {
  id: 'fire_guide',
  name: 'Volcano Watcher',
  x: 15,
  y: 16,
  direction: 'left',
  dialog: [
    'The EMBER VOLCANO burns day and night.',
    'Fire Pokémon thrive in the ash patches.',
    'Blaine, the hot-headed Gym Leader, guards the summit!',
  ],
  type: 'citizen',
  color: '#cc5522',
};

const grassGuide: NPC = {
  id: 'grass_guide',
  name: 'Grove Ranger',
  x: 15,
  y: 16,
  direction: 'left',
  dialog: [
    'Welcome to VERDANT GROVE, where nature sings.',
    'Bellsprout and Oddish hide in the tall grass.',
    'Erika awaits inside the Gym. She is gentle, but deadly!',
  ],
  type: 'citizen',
  color: '#4a8a3a',
};

const territories: ZoneDef[] = [
  makeTerritory({
    id: 'zone_earth',
    name: 'Terra Canyon',
    floor: TileType.CAVE_FLOOR,
    border: TileType.CAVE_WALL,
    encounterTile: TileType.CAVE_GRASS,
    accent: TileType.ROCK,
    gymInteriorId: 'gym_earth',
    returnWorld: { x: 38, y: 47 },
    npcs: [earthGuide],
  }),
  makeTerritory({
    id: 'zone_fire',
    name: 'Ember Volcano',
    floor: TileType.SAND,
    border: TileType.CAVE_WALL,
    encounterTile: TileType.ASH_GRASS,
    accent: TileType.LAVA,
    gymInteriorId: 'gym_fire',
    returnWorld: { x: 30, y: 61 },
    npcs: [fireGuide],
  }),
  makeTerritory({
    id: 'zone_grass',
    name: 'Verdant Grove',
    floor: TileType.GRASS,
    border: TileType.TREE,
    encounterTile: TileType.TALL_GRASS,
    accent: TileType.FLOWER,
    gymInteriorId: 'gym_grass',
    returnWorld: { x: 3, y: 31 },
    npcs: [grassGuide],
  }),
];

// =============================================================
// SUNNY FARM (planting & earning money)
// =============================================================

function makeFarm(): ZoneDef {
  const w = 26;
  const h = 22;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      row.push(isBorder ? TileType.TREE : TileType.GRASS);
    }
    data.push(row);
  }

  // Farm house at the top.
  for (let y = 2; y <= 5; y++) {
    for (let x = 8; x <= 15; x++) {
      data[y][x] = y <= 3 ? TileType.ROOF : TileType.WALL;
    }
  }
  data[5][11] = TileType.DOOR;
  data[5][12] = TileType.DOOR;

  // Fenced plots area.
  for (let x = 4; x <= 13; x++) {
    data[8][x] = TileType.FARM_FENCE;
    data[15][x] = TileType.FARM_FENCE;
  }
  for (let y = 9; y <= 14; y++) {
    data[y][4] = TileType.FARM_FENCE;
    data[y][13] = TileType.FARM_FENCE;
  }
  // Gate opening into the fenced field.
  data[15][9] = TileType.GRASS;

  // Walkable soil plots.
  for (const plot of FARM_PLOT_COORDS) {
    data[plot.y][plot.x] = TileType.SOIL;
    data[plot.y][plot.x + 1] = TileType.GRASS;
  }

  // Path from the entrance to the farmhouse.
  for (let y = 5; y <= 20; y++) {
    data[y][16] = TileType.PATH;
    data[y][17] = TileType.PATH;
  }
  for (let x = 11; x <= 17; x++) {
    data[7][x] = TileType.PATH;
    data[8][x] = TileType.PATH;
  }

  // Exit back to Pallet Town.
  data[20][16] = TileType.EXIT_MAT;
  data[20][17] = TileType.EXIT_MAT;

  return {
    id: 'farm',
    name: 'Sunny Farm',
    width: w,
    height: h,
    data,
    npcs: [farmClerk, farmNurse],
    exits: [
      { x: 16, y: 20, targetZone: 'world', targetX: 10, targetY: 67 },
      { x: 17, y: 20, targetZone: 'world', targetX: 10, targetY: 67 },
      { x: 11, y: 5, targetZone: 'farmhouse', targetX: 11, targetY: 15 },
      { x: 12, y: 5, targetZone: 'farmhouse', targetX: 11, targetY: 15 },
    ],
  };
}

// =============================================================
// MT. MOON CRYSTAL CAVERN (Cave Zone with Lake & Crystal Mine)
// =============================================================

const caveMiner: NPC = {
  id: 'cave_miner',
  name: 'Prospector Jasper',
  x: 7,
  y: 6,
  direction: 'down',
  dialog: [
    'Clang clang! Welcome to Mt. Moon Crystal Cavern!',
    'The subterranean rock faces are rich with sparkling Prismatic Gems 💎!',
    'Here, take this starter cache of 15 Gems! Use them in the EXP Sanctuary or cook with them!',
  ],
  type: 'citizen',
  color: '#ffd54f',
};

const caveAngler: NPC = {
  id: 'cave_angler',
  name: 'Underground Angler Finn',
  x: 14,
  y: 11,
  direction: 'right',
  dialog: [
    'Shh! The crystal lake here is undisturbed by wind and tides.',
    'Rare species like Staryu, Dratini, and ancient Magikarp thrive down here.',
    'Cast your fishing rod and see what wonders you can reel in!',
  ],
  type: 'citizen',
  color: '#4fc3f7',
};

const caveChef: NPC = {
  id: 'cave_chef',
  name: 'Campfire Chef Gordon',
  x: 9,
  y: 16,
  direction: 'right',
  dialog: [
    'A hot gourmet dish can restore even the most exhausted Pokémon team!',
    'Catch fresh fish from the lake or harvest farm crops to cook legendary dishes!',
  ],
  type: 'citizen',
  color: '#ff8a65',
};

function makeCaveZone(): ZoneDef {
  const w = 28;
  const h = 24;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      row.push(isBorder ? TileType.CAVE_WALL : TileType.CAVE_FLOOR);
    }
    data.push(row);
  }

  // Cave Pillars & Stalagmites
  const pillars = [
    { x: 5, y: 9 },
    { x: 6, y: 9 },
    { x: 5, y: 10 },
    { x: 6, y: 10 },
    { x: 10, y: 4 },
    { x: 11, y: 4 },
    { x: 10, y: 12 },
    { x: 11, y: 12 },
    { x: 4, y: 17 },
    { x: 5, y: 17 },
  ];
  pillars.forEach((p) => {
    data[p.y][p.x] = TileType.ROCK;
  });

  // Underground Crystal Lake (x: 16 to 24, y: 6 to 16)
  for (let y = 6; y <= 16; y++) {
    for (let x = 16; x <= 24; x++) {
      data[y][x] = TileType.WATER;
    }
  }

  // Wooden Pier / Fishing Docks
  data[10][14] = TileType.WOOD_DOCK;
  data[10][15] = TileType.WOOD_DOCK;
  data[11][14] = TileType.WOOD_DOCK;
  data[11][15] = TileType.WOOD_DOCK;
  data[12][14] = TileType.WOOD_DOCK;
  data[12][15] = TileType.WOOD_DOCK;

  // Wild Encounter Patches (Cave Grass / Moss)
  for (let y = 4; y <= 8; y++) {
    for (let x = 12; x <= 14; x++) data[y][x] = TileType.CAVE_GRASS;
  }
  for (let y = 14; y <= 19; y++) {
    for (let x = 12; x <= 16; x++) data[y][x] = TileType.CAVE_GRASS;
  }

  // Crystal Geode Shrine (Top Left)
  data[4][5] = TileType.ROCK;
  data[4][6] = TileType.CARPET;
  data[4][7] = TileType.ROCK;
  data[5][6] = TileType.SIGN;

  // Campfire area for Chef
  data[16][10] = TileType.ROCK;

  // Central Path to exit
  for (let y = 18; y <= 21; y++) {
    data[y][13] = TileType.PATH;
    data[y][14] = TileType.PATH;
  }

  // Exit back to Overworld
  data[21][13] = TileType.EXIT_MAT;
  data[21][14] = TileType.EXIT_MAT;

  return {
    id: 'zone_cave',
    name: 'Mt. Moon Crystal Cavern',
    width: w,
    height: h,
    data,
    npcs: [caveMiner, caveAngler, caveChef],
    exits: [
      { x: 13, y: 21, targetZone: 'world', targetX: 25, targetY: 20, label: 'Kanto Overworld' },
      { x: 14, y: 21, targetZone: 'world', targetX: 25, targetY: 20, label: 'Kanto Overworld' },
    ],
  };
}

// =============================================================
// AZURE SHORE (beach / water zone)
// =============================================================

const beachGuide: NPC = {
  id: 'beach_guide',
  name: 'Shore Ranger Coral',
  x: 15,
  y: 15,
  direction: 'left',
  dialog: [
    'Welcome to AZURE SHORE, where the tide never rests!',
    'Staryu, Magikarp and even Lapras wash up on these sands.',
    'A legendary shadow has been spotted far out at sea...',
    'Grab the scattered coins before the waves reclaim them!',
  ],
  type: 'citizen',
  color: '#26c6da',
};

function makeBeachZone(): ZoneDef {
  const w = 26;
  const h = 20;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      row.push(TileType.SAND);
    }
    data.push(row);
  }

  // Ocean on the east side.
  for (let y = 2; y <= 17; y++) {
    for (let x = 14; x <= 23; x++) data[y][x] = TileType.WATER;
  }

  // Sandy encounter dunes (beach grass).
  for (let y = 9; y <= 15; y++) {
    for (let x = 3; x <= 8; x++) data[y][x] = TileType.TALL_GRASS;
  }
  for (let y = 4; y <= 8; y++) {
    for (let x = 4; x <= 9; x++) data[y][x] = TileType.TALL_GRASS;
  }

  // Wooden piers reaching into the sea.
  for (let x = 10; x <= 16; x++) {
    data[9][x] = TileType.WOOD_DOCK;
    data[10][x] = TileType.WOOD_DOCK;
  }
  for (let y = 4; y <= 9; y++) data[y][16] = TileType.WOOD_DOCK;

  // Rocks and umbrellas (signs).
  data[5][12] = TileType.ROCK;
  data[6][12] = TileType.ROCK;
  data[12][11] = TileType.SIGN;
  data[16][4] = TileType.ROCK;
  data[16][5] = TileType.ROCK;

  // Exit back to Vermilion coast.
  data[18][12] = TileType.EXIT_MAT;
  data[18][13] = TileType.EXIT_MAT;

  return {
    id: 'zone_beach',
    name: 'Azure Shore',
    width: w,
    height: h,
    data,
    npcs: [beachGuide],
    exits: [
      { x: 12, y: 18, targetZone: 'world', targetX: 39, targetY: 66, label: 'Vermilion Coast' },
      { x: 13, y: 18, targetZone: 'world', targetX: 39, targetY: 66, label: 'Vermilion Coast' },
    ],
  };
}

// =============================================================
// SUNKEN RUINS (ghost / ancient zone)
// =============================================================

const ruinsGuide: NPC = {
  id: 'ruins_guide',
  name: 'Relic Keeper Morrow',
  x: 15,
  y: 15,
  direction: 'left',
  dialog: [
    'These are the SUNKEN RUINS, older than Kanto itself.',
    'Ghost Pokémon guard the altars, and a cursed Giratina altar lies deep within.',
    'Every 10 minutes, the World Boss tears open a portal somewhere in Kanto.',
    'Defeat it, and the teleport network will finally awaken!',
  ],
  type: 'citizen',
  color: '#9575cd',
};

function makeRuinsZone(): ZoneDef {
  const w = 26;
  const h = 20;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      row.push(isBorder ? TileType.CAVE_WALL : TileType.CAVE_FLOOR);
    }
    data.push(row);
  }

  // Broken pillars.
  const pillars = [
    [4, 5], [5, 5], [4, 6], [9, 4], [10, 4], [4, 13], [5, 13],
    [20, 5], [21, 5], [20, 12], [14, 8], [14, 9],
  ];
  pillars.forEach(([x, y]) => {
    data[y][x] = TileType.ROCK;
  });

  // Mossy encounter patches.
  for (let y = 10; y <= 15; y++) {
    for (let x = 3; x <= 7; x++) data[y][x] = TileType.CAVE_GRASS;
  }
  for (let y = 4; y <= 8; y++) {
    for (let x = 18; x <= 22; x++) data[y][x] = TileType.CAVE_GRASS;
  }

  // Ancient altar (top center).
  for (let x = 10; x <= 14; x++) data[3][x] = TileType.CARPET;
  data[3][12] = TileType.SIGN;

  // Winding path to the exit.
  for (let y = 6; y <= 17; y++) {
    data[y][12] = TileType.PATH;
    data[y][13] = TileType.PATH;
  }

  data[18][12] = TileType.EXIT_MAT;
  data[18][13] = TileType.EXIT_MAT;

  return {
    id: 'zone_ruins',
    name: 'Sunken Ruins',
    width: w,
    height: h,
    data,
    npcs: [ruinsGuide],
    exits: [
      { x: 12, y: 18, targetZone: 'world', targetX: 3, targetY: 8, label: 'Roblox Wilds' },
      { x: 13, y: 18, targetZone: 'world', targetX: 3, targetY: 8, label: 'Roblox Wilds' },
    ],
  };
}

// =============================================================
// WORLD BOSS ARENA (exclusive event zone)
// =============================================================

export const worldBossNpc: NPC = {
  id: 'world_boss_giratina',
  name: 'Giratina',
  x: 10,
  y: 5,
  direction: 'down',
  dialog: [
    'A rift in reality splits open above the arena...',
    'GIRATINA, RENEGADE POKÉMON OF THE DISTORTION WORLD, DESCENDS!',
    'You feel your very soul being weighed. There is no escape but victory!',
  ],
  type: 'special_friend',
  color: '#5e35b1',
  trainerParty: [{ id: 487, level: 50 }],
  rewardMoney: 6000,
  afterDefeatDialog: [
    'The distortion rift seals shut. The teleport network hums to life!',
  ],
};

function makeWorldBossZone(): ZoneDef {
  const w = 21;
  const h = 16;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 1 || y < 1 || x >= w - 1 || y >= h - 1;
      row.push(isBorder ? TileType.LAVA : TileType.CAVE_FLOOR);
    }
    data.push(row);
  }

  // Marble arena platform.
  for (let y = 3; y <= 12; y++) {
    for (let x = 3; x <= 17; x++) data[y][x] = TileType.MARBLE;
  }

  // Rune pillars around the platform.
  const runes = [[3, 3], [17, 3], [3, 12], [17, 12], [10, 2], [10, 13]];
  runes.forEach(([x, y]) => {
    data[y][x] = TileType.ROCK;
  });

  // Escape portal (bottom center).
  data[14][10] = TileType.EXIT_MAT;
  data[13][10] = TileType.MARBLE;

  return {
    id: 'zone_worldboss',
    name: 'Distortion Arena',
    width: w,
    height: h,
    data,
    npcs: [worldBossNpc],
    exits: [
      { x: 10, y: 14, targetZone: 'world', targetX: 16, targetY: 60, label: 'Pallet Town' },
    ],
  };
}

// =============================================================
// FROSTPEAK SUMMIT (ice / water zone)
// =============================================================

const frostGuide: NPC = {
  id: 'frost_guide',
  name: 'Summit Scout Elsa',
  x: 10,
  y: 15,
  direction: 'right',
  dialog: [
    'Welcome to FROSTPEAK SUMMIT, where the air bites and the ice sings.',
    'Lapras, Staryu and even Mewtwo have been seen near the frozen lake.',
    'Buy a mount from Rhea in Pallet Town to cross the snow much faster!',
  ],
  type: 'citizen',
  color: '#81d4fa',
};

function makeFrostZone(): ZoneDef {
  const w = 26;
  const h = 20;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      row.push(isBorder ? TileType.ROCK : TileType.SNOW);
    }
    data.push(row);
  }

  // Frozen lake with a fishing pier.
  for (let y = 4; y <= 12; y++) {
    for (let x = 15; x <= 23; x++) data[y][x] = TileType.WATER;
  }
  for (let y = 6; y <= 10; y++) data[y][14] = TileType.WOOD_DOCK;

  // Snowy encounter thickets.
  for (let y = 5; y <= 10; y++) {
    for (let x = 4; x <= 9; x++) data[y][x] = TileType.TALL_GRASS;
  }
  for (let y = 14; y <= 16; y++) {
    for (let x = 4; x <= 9; x++) data[y][x] = TileType.TALL_GRASS;
  }
  for (let y = 15; y <= 17; y++) {
    for (let x = 18; x <= 22; x++) data[y][x] = TileType.TALL_GRASS;
  }

  // Ice pillars.
  [[11, 7], [11, 8], [17, 5], [12, 13], [20, 13]].forEach(([x, y]) => {
    data[y][x] = TileType.ROCK;
  });

  // Path down to the exit.
  for (let y = 13; y <= 18; y++) {
    data[y][12] = TileType.PATH;
    data[y][13] = TileType.PATH;
  }
  data[18][12] = TileType.EXIT_MAT;
  data[18][13] = TileType.EXIT_MAT;

  return {
    id: 'zone_ice',
    name: 'Frostpeak Summit',
    width: w,
    height: h,
    data,
    npcs: [frostGuide],
    exits: [
      { x: 12, y: 18, targetZone: 'world', targetX: 28, targetY: 64, label: 'Pallet South Road' },
      { x: 13, y: 18, targetZone: 'world', targetX: 28, targetY: 64, label: 'Pallet South Road' },
    ],
  };
}

// =============================================================
// TOXIC MARSH (poison / grass zone)
// =============================================================

const marshGuide: NPC = {
  id: 'marsh_guide',
  name: 'Marsh Warden Fern',
  x: 10,
  y: 15,
  direction: 'right',
  dialog: [
    'Careful! TOXIC MARSH is beautiful, but the fog bites back.',
    'Oddish, Gloom and Gastly thrive in this swamp.',
    'Coins sink into the mud here — grab them before they vanish!',
  ],
  type: 'citizen',
  color: '#9ccc65',
};

function makeMarshZone(): ZoneDef {
  const w = 26;
  const h = 20;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      row.push(isBorder ? TileType.TREE : TileType.MARSH);
    }
    data.push(row);
  }

  // Toxic pools.
  for (let y = 4; y <= 9; y++) {
    for (let x = 15; x <= 22; x++) data[y][x] = TileType.WATER;
  }
  for (let y = 13; y <= 17; y++) {
    for (let x = 16; x <= 22; x++) data[y][x] = TileType.WATER;
  }

  // Tangled thickets.
  for (let y = 5; y <= 10; y++) {
    for (let x = 4; x <= 9; x++) data[y][x] = TileType.TALL_GRASS;
  }
  for (let y = 13; y <= 16; y++) {
    for (let x = 11; x <= 14; x++) data[y][x] = TileType.TALL_GRASS;
  }
  for (let y = 5; y <= 8; y++) {
    for (let x = 11; x <= 13; x++) data[y][x] = TileType.TALL_GRASS;
  }

  // Dead trees.
  [[4, 12], [5, 12], [18, 11], [23, 12], [9, 4]].forEach(([x, y]) => {
    data[y][x] = TileType.TREE;
  });

  // Wooden boardwalk across the marsh.
  for (let y = 10; y <= 18; y++) {
    data[y][12] = TileType.PATH;
    data[y][13] = TileType.PATH;
  }
  data[12][14] = TileType.WOOD_DOCK;
  data[12][15] = TileType.WOOD_DOCK;
  data[18][12] = TileType.EXIT_MAT;
  data[18][13] = TileType.EXIT_MAT;

  return {
    id: 'zone_marsh',
    name: 'Toxic Marsh',
    width: w,
    height: h,
    data,
    npcs: [marshGuide],
    exits: [
      { x: 12, y: 18, targetZone: 'world', targetX: 27, targetY: 34, label: 'Pewter South Road' },
      { x: 13, y: 18, targetZone: 'world', targetX: 27, targetY: 34, label: 'Pewter South Road' },
    ],
  };
}

// =============================================================
// SKY PILLAR (flying / dragon zone)
// =============================================================

const skyGuide: NPC = {
  id: 'sky_guide',
  name: 'Sky Keeper Aero',
  x: 8,
  y: 15,
  direction: 'right',
  dialog: [
    'This is SKY PILLAR, a staircase of clouds above Kanto.',
    'Pidgeotto, Dragonair and Dragonite circle the summit.',
    'Only trainers with a fast mount can outrun the winds here!',
  ],
  type: 'citizen',
  color: '#90caf9',
};

function makeSkyZone(): ZoneDef {
  const w = 22;
  const h = 20;
  const data: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const isBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      row.push(isBorder ? TileType.WATER : TileType.CLOUD);
    }
    data.push(row);
  }

  // Floating grass islands.
  for (let y = 5; y <= 9; y++) {
    for (let x = 4; x <= 8; x++) data[y][x] = TileType.TALL_GRASS;
  }
  for (let y = 5; y <= 8; y++) {
    for (let x = 14; x <= 18; x++) data[y][x] = TileType.TALL_GRASS;
  }
  for (let y = 12; y <= 15; y++) {
    for (let x = 13; x <= 17; x++) data[y][x] = TileType.TALL_GRASS;
  }

  // Cloud stairs.
  for (let y = 10; y <= 18; y++) {
    data[y][10] = TileType.MARBLE;
    data[y][11] = TileType.MARBLE;
  }
  [[6, 11], [15, 10], [8, 17], [13, 18]].forEach(([x, y]) => {
    if (data[y] && data[y][x] !== undefined) data[y][x] = TileType.ROCK;
  });

  data[18][10] = TileType.EXIT_MAT;
  data[18][11] = TileType.EXIT_MAT;

  return {
    id: 'zone_sky',
    name: 'Sky Pillar',
    width: w,
    height: h,
    data,
    npcs: [skyGuide],
    exits: [
      { x: 10, y: 18, targetZone: 'world', targetX: 36, targetY: 34, label: 'Pewter South Road' },
      { x: 11, y: 18, targetZone: 'world', targetX: 36, targetY: 34, label: 'Pewter South Road' },
    ],
  };
}

// =============================================================
// REGISTRY
// =============================================================

export const ZONE_DEFS: Record<string, ZoneDef> = {};
[
  ...rooms,
  ...territories,
  makeFarm(),
  makeCaveZone(),
  makeBeachZone(),
  makeRuinsZone(),
  makeWorldBossZone(),
  makeFrostZone(),
  makeMarshZone(),
  makeSkyZone(),
].forEach((def) => {
  ZONE_DEFS[def.id] = def;
});

export function buildZone(zoneId: string): TileMap | null {
  const def = ZONE_DEFS[zoneId];
  return def ? new TileMap(def) : null;
}

/**
 * Adds a walk-up Kanto Warp Terminal to every zone. The pad is placed on a
 * free, reachable-looking floor tile near the zone spawn without touching the
 * original ZONE_DEFS npc array (cloned when inserted).
 */
export function attachZoneFacilities(
  map: TileMap,
  zoneId: string,
  spawn: { x: number; y: number }
): TileMap {
  if (map.npcs.some((n) => n.type === 'teleporter')) return map;

  const usable = (x: number, y: number): boolean => {
    if (x < 2 || y < 2 || x >= map.width - 2 || y >= map.height - 2) return false;
    if (map.isSolid(x, y)) return false;
    if (map.data[y]?.[x] === TileType.EXIT_MAT || map.data[y]?.[x] === TileType.DOOR) return false;
    if (map.exits.some((e) => e.x === x && e.y === y)) return false;
    if (Math.abs(x - spawn.x) + Math.abs(y - spawn.y) < 2) return false;
    return true;
  };

  const ring: Array<[number, number]> = [
    [2, 0],
    [-2, 0],
    [3, 0],
    [-3, 0],
    [0, 2],
    [0, -2],
    [2, 2],
    [-2, 2],
    [2, -2],
    [-2, -2],
    [4, 0],
    [-4, 0],
    [0, 3],
    [0, -3],
    [3, 2],
    [-3, 2],
    [3, -2],
    [-3, -2],
  ];

  let spot: { x: number; y: number } | null = null;
  for (const [dx, dy] of ring) {
    const x = spawn.x + dx;
    const y = spawn.y + dy;
    if (usable(x, y)) {
      spot = { x, y };
      break;
    }
  }

  if (!spot) {
    let bestDist = Infinity;
    let fallback: { x: number; y: number } | null = null;
    for (let y = 2; y < map.height - 2; y++) {
      for (let x = 2; x < map.width - 2; x++) {
        if (!usable(x, y)) continue;
        const d = Math.abs(x - spawn.x) + Math.abs(y - spawn.y);
        if (d < bestDist) {
          bestDist = d;
          fallback = { x, y };
        }
      }
    }
    spot = fallback;
  }

  if (!spot) return map;

  map.npcs = [
    ...map.npcs,
    {
      id: `teleport_pad_${zoneId}`,
      name: 'Kanto Warp Terminal',
      x: spot.x,
      y: spot.y,
      direction: 'down',
      dialog: ['Kanto Warp Terminal online. Choose a destination!'],
      type: 'teleporter',
      color: '#00e5ff',
    },
  ];

  return map;
}

export const FARM_SEED_STOCK = [
  {
    id: 'seed_berry',
    name: 'Berry Seed',
    count: 1,
    price: 100,
    type: 'seed' as const,
    description: 'Grows in a few steps. Harvests for $200.',
    category: 'SEED' as const,
    icon: 'BR',
  },
  {
    id: 'seed_tomato',
    name: 'Tomato Seed',
    count: 1,
    price: 250,
    type: 'seed' as const,
    description: 'Takes longer to grow. Harvests for $550.',
    category: 'SEED' as const,
    icon: 'TM',
  },
  {
    id: 'seed_gold',
    name: 'Golden Seed',
    count: 1,
    price: 600,
    type: 'seed' as const,
    description: 'Rare and slow. Harvests for a whopping $1400.',
    category: 'SEED' as const,
    icon: 'GD',
  },
];

export const LEVEL_SERVICE_STOCK = [
  {
    id: 'service_levelup',
    name: 'Level Up +1',
    count: 1,
    price: 900,
    type: 'service' as const,
    description: 'Instantly raises your lead Pokémon by one level.',
    category: 'SERVICE' as const,
    icon: 'UP',
    service: 'levelup' as const,
  },
  {
    id: 'service_heal',
    name: 'Team Full Heal',
    count: 1,
    price: 300,
    type: 'service' as const,
    description: 'Fully restores HP and PP for your whole party.',
    category: 'SERVICE' as const,
    icon: 'HP',
    service: 'heal' as const,
  },
];
