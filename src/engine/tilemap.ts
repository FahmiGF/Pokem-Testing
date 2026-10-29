// Overworld Tilemap definition and drawing logic

export enum TileType {
  PATH = 0,
  GRASS = 1,
  TALL_GRASS = 2,
  TREE = 3,
  WATER = 4,
  FENCE = 5,
  ROOF = 6,
  WALL = 7,
  DOOR = 8,
  FLOWER = 9,
  SIGN = 10,
  GYM_ROOF = 11,
  GYM_WALL = 12,
  MART_ROOF = 13,
  ROCK = 14,
  VIP_ROOF = 15,
  VIP_WALL = 16,
  WATER_GYM_ROOF = 17,
  WATER_GYM_WALL = 18,
  ELECTRIC_GYM_ROOF = 19,
  ELECTRIC_GYM_WALL = 20,
  WOOD_DOCK = 21,
  LAVENDER_ROOF = 22,
  LAVENDER_WALL = 23,
  ROBLOX_BLOCK = 24,
  // --- Interior & zone tiles ---
  INDOOR_FLOOR = 25,
  INDOOR_WALL = 26,
  CARPET = 27,
  COUNTER = 28,
  SOIL = 29,
  LAVA = 30,
  CAVE_FLOOR = 31,
  CAVE_WALL = 32,
  SAND = 33,
  MARBLE = 34,
  WOOD_FLOOR = 35,
  EXIT_MAT = 36,
  CAVE_GRASS = 37,
  ASH_GRASS = 38,
  GYM_MAT = 39,
  FARM_FENCE = 40,
  SNOW = 41,
  CLOUD = 42,
  MARSH = 43,
}

export interface ZoneExit {
  x: number;
  y: number;
  targetZone: string;
  targetX: number;
  targetY: number;
  label?: string;
}

export interface ZoneDef {
  id: string;
  name: string;
  width: number;
  height: number;
  data: number[][];
  npcs: NPC[];
  exits: ZoneExit[];
  isInterior?: boolean;
}

export interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: 'down' | 'up' | 'left' | 'right';
  dialog: string[];
  type:
    | 'nurse'
    | 'professor'
    | 'trainer'
    | 'gym_leader'
    | 'clerk'
    | 'citizen'
    | 'special_friend'
    | 'teleporter';
  shopType?: 'poke' | 'seed' | 'level';
  color: string;
  trainerParty?: { id: number; level: number }[];
  rewardMoney?: number;
  badge?: string;
  afterDefeatDialog?: string[];
  giftPokemonId?: number;
  giftPokemonLevel?: number;
  giftItem?: { id: string; name: string; count: number };
}

// NPCs that live inside their own interior zones instead of the overworld.
const INTERIOR_NPC_IDS = new Set([
  'oak',
  'nurse_pallet',
  'nurse_pewter',
  'clerk_mart',
  'gym_leader_brock',
  'gym_leader_misty',
  'gym_leader_surge',
  'channeler_ruth',
  'roblox_noob',
  'roblox_bacon',
  'special_yusti',
  'special_zaky',
  'special_dio',
  'special_zazzie',
]);

// Door / gate coordinates on the overworld and where they lead.
const WORLD_EXITS: ZoneExit[] = [
  { x: 13, y: 58, targetZone: 'lab_oak', targetX: 11, targetY: 15, label: "Oak's Lab" },
  { x: 23, y: 59, targetZone: 'house_pallet', targetX: 11, targetY: 15, label: 'Pallet Rest House' },
  { x: 5, y: 67, targetZone: 'clubhouse', targetX: 11, targetY: 15, label: 'VIP Clubhouse' },
  { x: 6, y: 67, targetZone: 'clubhouse', targetX: 11, targetY: 15, label: 'VIP Clubhouse' },
  { x: 9, y: 28, targetZone: 'center_pewter', targetX: 11, targetY: 15, label: 'Pewter Pokémon Center' },
  { x: 23, y: 28, targetZone: 'mart_pewter', targetX: 11, targetY: 15, label: 'Pewter Pokémon Mart' },
  { x: 17, y: 21, targetZone: 'gym_rock', targetX: 11, targetY: 15, label: 'Pewter Rock Gym' },
  { x: 32, y: 21, targetZone: 'gym_water', targetX: 11, targetY: 15, label: 'Cerulean Water Gym' },
  { x: 37, y: 59, targetZone: 'gym_electric', targetX: 11, targetY: 15, label: 'Vermilion Electric Gym' },
  { x: 8, y: 7, targetZone: 'roblox_shrine', targetX: 11, targetY: 15, label: 'Roblox Shrine' },
  { x: 33, y: 8, targetZone: 'lavender_tower', targetX: 11, targetY: 15, label: 'Pokémon Tower' },
  { x: 10, y: 66, targetZone: 'farm', targetX: 11, targetY: 16, label: 'Sunny Farm' },
  { x: 25, y: 19, targetZone: 'zone_cave', targetX: 14, targetY: 20, label: 'Crystal Cavern' },
  { x: 38, y: 46, targetZone: 'zone_earth', targetX: 12, targetY: 17, label: 'Terra Canyon' },
  { x: 30, y: 60, targetZone: 'zone_fire', targetX: 12, targetY: 17, label: 'Ember Volcano' },
  { x: 3, y: 30, targetZone: 'zone_grass', targetX: 12, targetY: 17, label: 'Verdant Grove' },
  { x: 39, y: 66, targetZone: 'zone_beach', targetX: 12, targetY: 17, label: 'Azure Shore' },
  { x: 3, y: 8, targetZone: 'zone_ruins', targetX: 12, targetY: 17, label: 'Sunken Ruins' },
  { x: 28, y: 64, targetZone: 'zone_ice', targetX: 12, targetY: 17, label: 'Frostpeak Summit' },
  { x: 27, y: 34, targetZone: 'zone_marsh', targetX: 12, targetY: 17, label: 'Toxic Marsh' },
  { x: 36, y: 34, targetZone: 'zone_sky', targetX: 10, targetY: 17, label: 'Sky Pillar' },
];

export class TileMap {
  public static readonly TILE_SIZE = 16;
  public width = 44;
  public height = 74;
  public zoneId: string = 'world';
  public zoneName: string = 'Kanto Overworld';
  public isInterior: boolean = false;
  public exits: ZoneExit[] = [];

  // 44x74 Expanded Kanto Multi-Zone:
  // - Pallet Town (y: 54-72) & Secret VIP Clubhouse (Yusti, Zaky, Dio, Zazzie)
  // - Route 1 & Forest Trails (y: 36-53)
  // - Pewter City & Rock Gym (Brock) (y: 18-35, west)
  // - Cerulean City & Water Gym (Misty) (y: 18-35, east)
  // - Vermilion Port & Electric Gym (Lt. Surge) (y: 56-72, east)
  // - Lavender Ghost Alley & Pokémon Tower (y: 2-17, east)
  // - Secret Roblox Metaverse Hub (y: 2-17, west) (Noob / Bacon Hair)
  public data: number[][];

  public npcs: NPC[] = [
    // ==========================================
    // --- SPECIAL FRIENDS ROOM (Secret House in Pallet: x: 3-8, y: 64-68) ---
    // ==========================================
    {
      id: 'special_yusti',
      name: 'Yusti (The Tactician)',
      x: 4,
      y: 67,
      direction: 'right',
      dialog: [
        'Yo! Welcome to our Secret Hideout!',
        "I'm Yusti! I study Pokémon battle strategies and team chemistry.",
        'To defeat Gym Leaders, you must always exploit elemental weaknesses!',
        'Here, take this special Dragon-type baby I raised in the hideout!',
      ],
      type: 'special_friend',
      color: '#4477dd',
      giftPokemonId: 147, // Dratini!
      giftPokemonLevel: 10,
      afterDefeatDialog: [
        'Dratini starts gentle, but evolves into the mighty Dragonite!',
        'Raise it with care, and no gym boss can withstand your might!',
      ],
    },
    {
      id: 'special_zaky',
      name: 'Zaky (The Gear Master)',
      x: 7,
      y: 67,
      direction: 'left',
      dialog: [
        'Wazzup! Zaky here! I handle the supply chain for our squad.',
        'You cannot conquer Kanto without top-tier medicine and balls!',
        'Take these 5 Super Potions and 5 Great Balls on the house!',
      ],
      type: 'special_friend',
      color: '#e69900',
      giftItem: { id: 'super_potion', name: 'Super Potion', count: 5 },
      afterDefeatDialog: [
        'Running low on gear? You can always buy more at the Pewter City Mart!',
        'Stay sharp out there, champion!',
      ],
    },
    {
      id: 'special_dio',
      name: 'Dio (The Wild Striker)',
      x: 4,
      y: 65,
      direction: 'down',
      dialog: [
        'KONO DIO DA! Haha, just kidding!',
        "I'm Dio! I love fierce physical attacks and relentless speed!",
        'Think your Pokémon are fast enough to keep up with mine?!',
        'Show me what you got in a legendary friendly spar!',
      ],
      type: 'special_friend',
      color: '#ddbb11',
      trainerParty: [
        { id: 25, level: 12 }, // Pikachu Lv 12
        { id: 133, level: 13 }, // Eevee Lv 13
      ],
      rewardMoney: 800,
      afterDefeatDialog: [
        'WRYYYY! What tremendous power! Your battle instincts are elite!',
        'Remember: speed dictates who strikes first in every turn!',
      ],
    },
    {
      id: 'special_zazzie',
      name: 'Zazzie (The Tech Oracle)',
      x: 7,
      y: 65,
      direction: 'down',
      dialog: [
        'Beep boop! Greetings, player! Zazzie at your service.',
        'I built this whole secret monitoring system with web canvas & chiptune audio!',
        'Did you know holding SHIFT makes you run with lightning speed?',
        'And pressing ENTER opens your Pokédex, full trainer card, and save options!',
      ],
      type: 'special_friend',
      color: '#9933cc',
      giftItem: { id: 'revive', name: 'Revive', count: 3 },
      afterDefeatDialog: [
        'System diagnostic: 100% bug free, HP calculations exact!',
        'Good luck beating Brock, Misty, and Surge!',
      ],
    },

    // ==========================================
    // --- PALLET TOWN (y: 54 - 64) ---
    // ==========================================
    {
      id: 'kart_master',
      name: 'Kart Master',
      x: 14,
      y: 53,
      direction: 'down',
      dialog: [
        'Vroom vroom! Ready to burn rubber on the asphalt?',
        'Welcome to the 3D Mode-7 Kart Racing Championship! Win massive EXP & cash prizes!',
      ],
      type: 'citizen',
      color: '#e53935',
    },
    {
      id: 'exp_sage',
      name: 'EXP Sage Eldrin',
      x: 18,
      y: 53,
      direction: 'down',
      dialog: [
        'Greetings, brave trainer! Welcome to the Mythic EXP Sanctuary.',
        'Spend your hard-won EXP tokens on Rare Candies, Stat Elixirs, and Master Balls!',
      ],
      type: 'citizen',
      color: '#00e5ff',
    },
    {
      id: 'souls_gatekeeper',
      name: 'Ashen Knight',
      x: 20,
      y: 53,
      direction: 'down',
      dialog: [
        'Halt, Ashen One! Beyond this Abyssal Gate lies Giratina, Primordial Lord of Distortion.',
        'Manage your Stamina, time your Dodge Roll I-Frames, and prepare for an epic 3D Souls Boss fight!',
      ],
      type: 'citizen',
      color: '#546e7a',
    },
    {
      id: 'angler_pallet',
      name: 'Fisherman Cole',
      x: 21,
      y: 65,
      direction: 'right',
      dialog: [
        'Ahoy! Nothing beats casting a fishing rod on a sunny afternoon.',
        'Reel in water Pokémon, fresh culinary fish, and sunken Gems 💎!',
      ],
      type: 'citizen',
      color: '#0288d1',
    },
    {
      id: 'chef_pallet',
      name: 'Chef Auguste',
      x: 18,
      y: 65,
      direction: 'down',
      dialog: [
        'Bonjour! I turn simple berries and fresh fish into five-star gourmet feasts!',
        'Cook dishes with me to restore your whole Pokémon team and earn sparkling Gems 💎!',
      ],
      type: 'citizen',
      color: '#ff7043',
    },
    {
      id: 'steed_keeper',
      name: 'Steed Keeper Rhea',
      x: 15,
      y: 59,
      direction: 'down',
      dialog: [
        'Looking to travel faster? Welcome to Kanto Mount Ranch!',
        'I train rideable Charmander, Pikachu, Bulbasaur, Squirtle, and even Onix!',
        'Buy a mount, then press [R] anywhere in the overworld to ride it!',
      ],
      type: 'citizen',
      color: '#ffb74d',
    },
    {
      id: 'arcade_keeper',
      name: 'Pixel the Arcade Keeper',
      x: 18,
      y: 61,
      direction: 'down',
      dialog: [
        'Welcome to the Pixel Arcade, trainer! Six cabinets, zero quarters needed.',
        'Pong, Flappy Pidgey, Space Invaders, Pac-Ghost, Snake and Brick Breaker!',
        'High scores pay out coins and gems. Step inside and smash some records!',
      ],
      type: 'citizen',
      color: '#ff4081',
    },
    {
      id: 'teleport_engineer',
      name: 'Warp Engineer Volt',
      x: 20,
      y: 66,
      direction: 'down',
      dialog: [
        'This is the Kanto Teleport Grid. One tap and you are across the region!',
        'The champion grid is still dormant... but I now offer paid warps for $150 a jump.',
        'Every 10 minutes, a boss portal tears open nearby. Beat the World Boss for free warps!',
      ],
      type: 'citizen',
      color: '#00e5ff',
    },
    {
      id: 'oak',
      name: 'Prof. Oak',
      x: 13,
      y: 58,
      direction: 'down',
      dialog: [
        'Ah, welcome to the expanded world of Pokémon!',
        'Check out our Secret Clubhouse at the southwest corner of Pallet Town!',
        'Your friends Yusti, Zaky, Dio, and Zazzie are waiting inside.',
        'Explore Vermilion Port in the southeast, or march north to Pewter and Cerulean!',
      ],
      type: 'professor',
      color: '#d2b48c',
    },
    {
      id: 'nurse_pallet',
      name: 'Nurse Joy',
      x: 23,
      y: 59,
      direction: 'down',
      dialog: [
        'Welcome to Pallet Town Care Station!',
        'Let me heal your Pokémon team back to tip-top shape!',
        '...Your Pokémon are now fully revitalized! Take care!',
      ],
      type: 'nurse',
      color: '#ff99b3',
    },

    // ==========================================
    // --- ROUTE 1 (y: 36 - 53) ---
    // ==========================================
    {
      id: 'trainer_joey',
      name: 'Youngster Joey',
      x: 19,
      y: 45,
      direction: 'left',
      dialog: [
        'My Rattata is in the top percentage of all Rattata!',
        "Let's see how tough you are in a Pokémon battle!",
      ],
      type: 'trainer',
      color: '#e06622',
      trainerParty: [
        { id: 19, level: 7 }, // Rattata
        { id: 16, level: 8 }, // Pidgey
      ],
      rewardMoney: 250,
      afterDefeatDialog: [
        'Aww man! Your Pokémon are seriously well trained!',
        'Watch out for the rocks further north, Mankey and Geodude roam there!',
      ],
    },
    {
      id: 'trainer_liam',
      name: 'Camper Liam',
      x: 15,
      y: 39,
      direction: 'right',
      dialog: [
        'Halt! Are you heading to Pewter City?',
        "You can't challenge Brock without passing me first!",
      ],
      type: 'trainer',
      color: '#3388cc',
      trainerParty: [
        { id: 56, level: 9 }, // Mankey
        { id: 66, level: 10 }, // Machop
      ],
      rewardMoney: 400,
      afterDefeatDialog: [
        'Impressive battle! Brock specializes in rock-type Pokémon.',
        'Water and Grass moves are super effective against Rock and Ground!',
      ],
    },

    // ==========================================
    // --- PEWTER CITY (Town 2, y: 18 - 35, west) ---
    // ==========================================
    {
      id: 'nurse_pewter',
      name: 'Nurse Joy',
      x: 9,
      y: 28,
      direction: 'down',
      dialog: [
        'Welcome to Pewter City Pokémon Center!',
        'Healing your Pokémon to full health!',
        '...All set! May victory shine on your Gym match!',
      ],
      type: 'nurse',
      color: '#ff99b3',
    },
    {
      id: 'clerk_mart',
      name: 'Mart Clerk',
      x: 23,
      y: 28,
      direction: 'down',
      dialog: [
        'Welcome to the Pewter City Pokémon Mart!',
        'Check out our stock: Poké Balls, Great Balls, Potions & Revives!',
      ],
      type: 'clerk',
      color: '#44aa44',
    },
    {
      id: 'pewter_citizen',
      name: 'Museum Guide',
      x: 13,
      y: 21,
      direction: 'down',
      dialog: [
        'Welcome to PEWTER CITY - A stone gray city!',
        'Brock is in the Rock Gym directly ahead!',
        'To the east lies Cerulean City, and to the south-east lies Vermilion Port!',
      ],
      type: 'citizen',
      color: '#8888aa',
    },
    {
      id: 'gym_leader_brock',
      name: 'Gym Leader Brock',
      x: 17,
      y: 20,
      direction: 'down',
      dialog: [
        "I'm Brock, the PEWTER GYM LEADER!",
        'I believe in rock-hard defense and determination!',
        "My Pokémon are all rock-hard and have true grit!",
        'Do you dare challenge my Geodude and mighty Onix?! Let’s go!',
      ],
      type: 'gym_leader',
      color: '#996633',
      trainerParty: [
        { id: 74, level: 12 }, // Geodude Lv 12
        { id: 95, level: 14 }, // Onix Lv 14 (Boss!)
      ],
      rewardMoney: 1500,
      badge: 'BOULDER BADGE',
      afterDefeatDialog: [
        'I took you for granted! Your Pokémon’s spirit broke through my rock defense!',
        'As proof of your victory, I confer upon you the official BOULDER BADGE!',
        'Now test your skills against Misty and Lt. Surge!',
      ],
    },

    // ==========================================
    // --- CERULEAN WATER GYM (y: 18 - 35, east) ---
    // ==========================================
    {
      id: 'gym_leader_misty',
      name: 'Gym Leader Misty',
      x: 32,
      y: 20,
      direction: 'down',
      dialog: [
        'Hi! I am Misty, the Tomboyish Mermaid!',
        'My policy is an all-out offensive with Water-type Pokémon!',
        'Are you ready to face the swirling tides of my Staryu and Starmie?!',
      ],
      type: 'gym_leader',
      color: '#ee4422',
      trainerParty: [
        { id: 120, level: 15 }, // Staryu Lv 15
        { id: 121, level: 17 }, // Starmie Lv 17 (Ace Water/Psychic Boss!)
      ],
      rewardMoney: 2000,
      badge: 'CASCADE BADGE',
      afterDefeatDialog: [
        'Wow! You really are a prodigy trainer!',
        'You defeated my Starmie and earned the official CASCADE BADGE!',
        'Head down to Vermilion Port to face the Lightning American, Lt. Surge!',
      ],
    },

    // ==========================================
    // --- VERMILION PORT & ELECTRIC GYM (y: 56 - 72, east) ---
    // ==========================================
    {
      id: 'gym_leader_surge',
      name: 'Lt. Surge (The Lightning American)',
      x: 37,
      y: 60,
      direction: 'down',
      dialog: [
        'Ten-hut! I am Lieutenant Surge of the Vermilion Electric Gym!',
        'I tell you, kid, electric Pokémon saved me during the war!',
        'They zapped my enemies into paralysis!',
        'My Voltorb and Raichu will blast you with high voltage BOOM power! Attack!',
      ],
      type: 'gym_leader',
      color: '#556622',
      trainerParty: [
        { id: 100, level: 18 }, // Voltorb Lv 18 (Self-Destruct!)
        { id: 26, level: 21 },  // Raichu Lv 21 (Thunderbolt Ace!)
      ],
      rewardMoney: 2800,
      badge: 'THUNDER BADGE',
      afterDefeatDialog: [
        'Now that is explosive firepower! You fried my defenses fair and square!',
        'Take the official THUNDER BADGE, soldier! You earned every volt of it!',
      ],
    },
    {
      id: 'sailor_bob',
      name: 'Sailor Bob',
      x: 33,
      y: 68,
      direction: 'down',
      dialog: [
        'Ahoy! Welcome to Vermilion Harbor!',
        'The S.S. Anne luxury liner departs from these wooden docks.',
        'Lt. Surge’s Electric Gym is just north along the shoreline!',
      ],
      type: 'citizen',
      color: '#224488',
    },

    // ==========================================
    // --- LAVENDER GHOST ALLEY (y: 2 - 17, east) ---
    // ==========================================
    {
      id: 'channeler_ruth',
      name: 'Channeler Ruth',
      x: 33,
      y: 8,
      direction: 'down',
      dialog: [
        'Kekeke... Be hold the eerie Lavender Tower...',
        'Spirits of Gastly drift through the purple mists.',
        'Do you believe in ghosts, brave traveler?',
      ],
      type: 'citizen',
      color: '#662288',
    },

    // ==========================================
    // --- SECRET ROBLOX METAVERSE HUB (y: 2 - 17, west) ---
    // ==========================================
    {
      id: 'roblox_noob',
      name: 'Classic Noob (Roblox Cameo)',
      x: 10,
      y: 8,
      direction: 'down',
      dialog: [
        'OOF! Where am I?! Did I get teleported into Kanto from Brookhaven?!',
        'Hey there, fellow avatar! Check out my blocky Link Sword!',
        'Care to duel with the power of the Roblox metaverse?!',
      ],
      type: 'trainer',
      color: '#0022cc',
      trainerParty: [
        { id: 999, level: 16 }, // Blocky Noob Lv 16
      ],
      rewardMoney: 1200,
      afterDefeatDialog: [
        'OOF! You defeated my Blocky Avatar! GG, no re!',
        'Here, take this 10,000 Robux... wait, Kanto only uses Pokédollars!',
      ],
    },
    {
      id: 'roblox_bacon',
      name: 'Bacon Hair (Robloxian)',
      x: 6,
      y: 8,
      direction: 'right',
      dialog: [
        'Sup! Just hanging out at the Roblox Portal hub.',
        'If you battle Noob, watch out for his Self-Destruct boom attack!',
        'Have a great game in this awesome 2D Pokémon web edition!',
      ],
      type: 'citizen',
      color: '#aa5533',
    },
  ];

  constructor(def?: ZoneDef) {
    if (def) {
      this.zoneId = def.id;
      this.zoneName = def.name;
      this.width = def.width;
      this.height = def.height;
      this.data = def.data;
      this.npcs = def.npcs;
      this.exits = def.exits;
      this.isInterior = !!def.isInterior;
      return;
    }

    this.data = this.generateMap();
    this.npcs = this.npcs.filter((n) => !INTERIOR_NPC_IDS.has(n.id));
    this.exits = WORLD_EXITS;
  }

  public getExitAt(x: number, y: number): ZoneExit | null {
    for (const exit of this.exits) {
      if (exit.x === x && exit.y === y) return exit;
    }
    return null;
  }

  private generateMap(): number[][] {
    const w = this.width;
    const h = this.height;
    const map: number[][] = [];

    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      for (let x = 0; x < w; x++) {
        row.push(TileType.GRASS);
      }
      map.push(row);
    }

    // Outer tree boundaries
    for (let x = 0; x < w; x++) {
      map[0][x] = TileType.TREE;
      map[1][x] = TileType.TREE;
      map[h - 1][x] = TileType.TREE;
      map[h - 2][x] = TileType.TREE;
    }
    for (let y = 0; y < h; y++) {
      map[y][0] = TileType.TREE;
      map[y][1] = TileType.TREE;
      map[y][w - 1] = TileType.TREE;
      map[y][w - 2] = TileType.TREE;
    }

    // ==========================================
    // 1. PALLET TOWN (y: 54 - 72, west/center)
    // ==========================================
    for (let y = 54; y <= 66; y++) {
      map[y][16] = TileType.PATH;
      map[y][17] = TileType.PATH;
    }
    for (let x = 4; x <= 28; x++) {
      map[62][x] = TileType.PATH;
      map[63][x] = TileType.PATH;
    }

    // Path to Secret VIP Clubhouse (x: 3-8, y: 64-68)
    for (let y = 64; y <= 70; y++) {
      map[y][5] = TileType.PATH;
      map[y][6] = TileType.PATH;
    }

    // Building: Secret VIP Clubhouse (Yusti, Zaky, Dio, Zazzie)
    for (let y = 64; y <= 67; y++) {
      for (let x = 3; x <= 8; x++) {
        map[y][x] = y <= 65 ? TileType.VIP_ROOF : TileType.VIP_WALL;
      }
    }
    map[67][5] = TileType.DOOR;
    map[67][6] = TileType.DOOR;
    map[68][3] = TileType.SIGN; // Secret Club sign

    // Building: Prof. Oak's Lab (x: 10-16, y: 55-58)
    for (let y = 55; y <= 58; y++) {
      for (let x = 10; x <= 16; x++) {
        map[y][x] = y <= 56 ? TileType.ROOF : TileType.WALL;
      }
    }
    map[58][13] = TileType.DOOR;

    // Building: Pallet Rest House (x: 20-26, y: 56-59)
    for (let y = 56; y <= 59; y++) {
      for (let x = 20; x <= 26; x++) {
        map[y][x] = y <= 57 ? TileType.ROOF : TileType.WALL;
      }
    }
    map[59][23] = TileType.DOOR;

    // Pallet Town Pond (x: 22-26, y: 65-68)
    for (let y = 65; y <= 68; y++) {
      for (let x = 22; x <= 26; x++) {
        map[y][x] = TileType.WATER;
      }
    }

    // Fences & Flowers
    for (let x = 8; x <= 15; x++) map[54][x] = TileType.FENCE;
    for (let x = 18; x <= 26; x++) map[54][x] = TileType.FENCE;
    map[58][10] = TileType.SIGN;
    map[62][14] = TileType.SIGN;

    // ==========================================
    // 2. VERMILION PORT & ELECTRIC GYM (y: 54 - 72, east)
    // ==========================================
    // Highway connecting Pallet to Vermilion
    for (let x = 28; x <= 41; x++) {
      map[62][x] = TileType.PATH;
      map[63][x] = TileType.PATH;
    }
    for (let y = 55; y <= 70; y++) {
      map[y][34] = TileType.PATH;
      map[y][35] = TileType.PATH;
    }

    // Vermilion Ocean & Harbor Docks (x: 29-41, y: 67-72)
    for (let y = 67; y <= 72; y++) {
      for (let x = 29; x <= 41; x++) {
        map[y][x] = TileType.WATER;
      }
    }
    // Wooden piers
    for (let y = 66; y <= 70; y++) {
      map[y][32] = TileType.WOOD_DOCK;
      map[y][33] = TileType.WOOD_DOCK;
      map[y][37] = TileType.WOOD_DOCK;
      map[y][38] = TileType.WOOD_DOCK;
    }

    // Building: Vermilion Electric Gym (Lt. Surge) (x: 34-40, y: 56-59)
    for (let y = 56; y <= 59; y++) {
      for (let x = 34; x <= 40; x++) {
        map[y][x] = y <= 57 ? TileType.ELECTRIC_GYM_ROOF : TileType.ELECTRIC_GYM_WALL;
      }
    }
    map[59][37] = TileType.DOOR;
    map[60][39] = TileType.SIGN; // Surge Gym sign

    // ==========================================
    // 3. ROUTE 1 (y: 36 - 53)
    // ==========================================
    for (let y = 36; y <= 53; y++) {
      map[y][16] = TileType.PATH;
      map[y][17] = TileType.PATH;
    }
    for (let y = 43; y <= 47; y++) {
      map[y][18] = TileType.PATH;
    }

    // Tall grass patches
    for (let y = 44; y <= 50; y++) {
      for (let x = 5; x <= 14; x++) map[y][x] = TileType.TALL_GRASS;
    }
    for (let y = 42; y <= 48; y++) {
      for (let x = 20; x <= 30; x++) map[y][x] = TileType.TALL_GRASS;
    }
    for (let y = 37; y <= 41; y++) {
      for (let x = 5; x <= 13; x++) map[y][x] = TileType.TALL_GRASS;
    }
    for (let y = 37; y <= 41; y++) {
      for (let x = 20; x <= 31; x++) map[y][x] = TileType.TALL_GRASS;
    }

    // Rocks on Route 1
    const r1Rocks = [[3, 40], [4, 39], [32, 42], [31, 41], [3, 48], [4, 49]];
    r1Rocks.forEach(([rx, ry]) => { map[ry][rx] = TileType.ROCK; });
    map[46][15] = TileType.SIGN;
    map[37][15] = TileType.SIGN;

    // ==========================================
    // 4. PEWTER & CERULEAN CITIES (y: 18 - 35)
    // ==========================================
    for (let y = 18; y <= 35; y++) {
      map[y][16] = TileType.PATH;
      map[y][17] = TileType.PATH;
      map[y][28] = TileType.PATH;
      map[y][29] = TileType.PATH;
    }
    for (let x = 4; x <= 40; x++) {
      map[24][x] = TileType.PATH;
      map[25][x] = TileType.PATH;
      map[32][x] = TileType.PATH;
      map[33][x] = TileType.PATH;
    }

    // Central Fountain Plaza (x: 15-18, y: 23-26)
    for (let y = 23; y <= 26; y++) {
      for (let x = 15; x <= 18; x++) {
        map[y][x] = TileType.WATER;
      }
    }

    // Building: Pewter Rock Gym (Brock) (x: 14-20, y: 18-21)
    for (let y = 18; y <= 21; y++) {
      for (let x = 14; x <= 20; x++) {
        map[y][x] = y <= 19 ? TileType.GYM_ROOF : TileType.GYM_WALL;
      }
    }
    map[21][17] = TileType.DOOR;
    map[22][19] = TileType.SIGN;

    // Building: Cerulean Water Gym (Misty) (x: 29-35, y: 18-21)
    for (let y = 18; y <= 21; y++) {
      for (let x = 29; x <= 35; x++) {
        map[y][x] = y <= 19 ? TileType.WATER_GYM_ROOF : TileType.WATER_GYM_WALL;
      }
    }
    map[21][32] = TileType.DOOR;
    map[22][34] = TileType.SIGN;

    // Mountain Cavern Entrance: Crystal Cavern (x: 23-27, y: 17-20)
    for (let y = 17; y <= 20; y++) {
      for (let x = 23; x <= 27; x++) {
        map[y][x] = TileType.CAVE_WALL;
      }
    }
    map[19][25] = TileType.DOOR;
    map[20][25] = TileType.PATH;
    map[21][25] = TileType.PATH;
    map[20][24] = TileType.SIGN;

    // Building: Pokémon Center (x: 6-12, y: 25-28)
    for (let y = 25; y <= 28; y++) {
      for (let x = 6; x <= 12; x++) {
        map[y][x] = y <= 26 ? TileType.ROOF : TileType.WALL;
      }
    }
    map[28][9] = TileType.DOOR;

    // Building: Pokémon Mart (x: 20-26, y: 25-28)
    for (let y = 25; y <= 28; y++) {
      for (let x = 20; x <= 26; x++) {
        map[y][x] = y <= 26 ? TileType.MART_ROOF : TileType.WALL;
      }
    }
    map[28][23] = TileType.DOOR;

    // ==========================================
    // 5. SECRET ROBLOX HUB (y: 2 - 17, west: x: 2-19)
    // ==========================================
    for (let y = 2; y <= 17; y++) {
      map[y][8] = TileType.PATH;
      map[y][9] = TileType.PATH;
    }
    for (let x = 4; x <= 17; x++) {
      map[10][x] = TileType.PATH;
      map[11][x] = TileType.PATH;
    }

    // Roblox Block Building / Portal Shrine (x: 4-12, y: 4-7)
    for (let y = 4; y <= 7; y++) {
      for (let x = 4; x <= 12; x++) {
        map[y][x] = TileType.ROBLOX_BLOCK;
      }
    }
    map[7][8] = TileType.DOOR;
    map[8][11] = TileType.SIGN; // Roblox portal sign

    // ==========================================
    // 6. LAVENDER GHOST ALLEY & TOWER (y: 2 - 17, east: x: 22-41)
    // ==========================================
    for (let y = 2; y <= 17; y++) {
      map[y][30] = TileType.PATH;
      map[y][31] = TileType.PATH;
    }
    for (let x = 24; x <= 39; x++) {
      map[10][x] = TileType.PATH;
      map[11][x] = TileType.PATH;
    }

    // Lavender Ghost Tower (x: 29-37, y: 4-8)
    for (let y = 4; y <= 8; y++) {
      for (let x = 29; x <= 37; x++) {
        map[y][x] = y <= 5 ? TileType.LAVENDER_ROOF : TileType.LAVENDER_WALL;
      }
    }
    map[8][33] = TileType.DOOR;
    map[9][35] = TileType.SIGN;

    // ==========================================
    // 7. PORTAL GATES TO NEW TERRITORIES
    // ==========================================
    // Sunny Farm gate (west Pallet Town)
    for (let y = 63; y <= 66; y++) {
      map[y][10] = TileType.PATH;
      map[y][11] = TileType.PATH;
    }
    map[66][10] = TileType.DOOR;
    map[66][11] = TileType.FARM_FENCE;
    map[65][9] = TileType.SIGN;
    map[64][8] = TileType.FARM_FENCE;
    map[65][8] = TileType.FARM_FENCE;

    // Terra Canyon cave mouth (east Route 1)
    map[46][38] = TileType.DOOR;
    [[37, 45], [39, 45], [37, 46], [39, 46], [37, 47], [39, 47]].forEach(([rx, ry]) => {
      map[ry][rx] = TileType.ROCK;
    });
    map[47][39] = TileType.SIGN;

    // Ember Volcano gate (Vermilion coast)
    map[60][30] = TileType.DOOR;
    map[59][29] = TileType.LAVA;
    map[59][30] = TileType.LAVA;
    map[59][31] = TileType.LAVA;
    map[60][29] = TileType.LAVA;
    map[60][31] = TileType.LAVA;
    map[61][31] = TileType.SIGN;

    // Verdant Grove gate (west Pewter City)
    map[30][3] = TileType.DOOR;
    map[29][3] = TileType.TREE;
    map[29][4] = TileType.TREE;
    map[31][4] = TileType.SIGN;

    // Azure Shore gate (Vermilion dockside)
    map[66][39] = TileType.DOOR;
    map[66][38] = TileType.WOOD_DOCK;
    map[65][38] = TileType.WOOD_DOCK;
    map[65][39] = TileType.SAND;
    map[65][40] = TileType.SAND;
    map[66][40] = TileType.SAND;
    map[67][39] = TileType.WATER;
    map[64][39] = TileType.SAND;

    // Sunken Ruins gate (northwest wilds)
    map[8][3] = TileType.DOOR;

    // Frostpeak Summit gate (south of Pallet, below the coastal highway)
    map[64][28] = TileType.DOOR;
    map[63][28] = TileType.PATH;
    map[64][29] = TileType.SIGN;

    // Toxic Marsh gate (south of Pewter, below Route 1 highway)
    map[34][27] = TileType.DOOR;
    map[34][26] = TileType.SIGN;

    // Sky Pillar gate (south-east of Pewter, below Route 1 highway)
    map[34][36] = TileType.DOOR;
    map[34][37] = TileType.SIGN;

    return map;
  }

  public isSolid(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return true;
    }

    const tile = this.data[y][x];
    if (
      tile === TileType.TREE ||
      tile === TileType.WATER ||
      tile === TileType.FENCE ||
      tile === TileType.ROOF ||
      tile === TileType.WALL ||
      tile === TileType.GYM_ROOF ||
      tile === TileType.GYM_WALL ||
      tile === TileType.MART_ROOF ||
      tile === TileType.VIP_ROOF ||
      tile === TileType.VIP_WALL ||
      tile === TileType.WATER_GYM_ROOF ||
      tile === TileType.WATER_GYM_WALL ||
      tile === TileType.ELECTRIC_GYM_ROOF ||
      tile === TileType.ELECTRIC_GYM_WALL ||
      tile === TileType.LAVENDER_ROOF ||
      tile === TileType.LAVENDER_WALL ||
      tile === TileType.ROBLOX_BLOCK ||
      tile === TileType.ROCK ||
      tile === TileType.SIGN ||
      tile === TileType.INDOOR_WALL ||
      tile === TileType.COUNTER ||
      tile === TileType.LAVA ||
      tile === TileType.CAVE_WALL ||
      tile === TileType.FARM_FENCE
    ) {
      return true;
    }

    for (const npc of this.npcs) {
      if (npc.x === x && npc.y === y) {
        return true;
      }
    }

    return false;
  }

  public getNPCAt(x: number, y: number): NPC | null {
    for (const npc of this.npcs) {
      if (npc.x === x && npc.y === y) {
        return npc;
      }
    }
    return null;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    animTime: number,
    view?: { x: number; y: number; w: number; h: number }
  ) {
    const ts = TileMap.TILE_SIZE;

    // Only draw tiles that intersect the visible viewport (huge perf win).
    let startX = 0;
    let startY = 0;
    let endX = this.width - 1;
    let endY = this.height - 1;
    if (view) {
      startX = Math.max(0, Math.floor(view.x / ts) - 1);
      startY = Math.max(0, Math.floor(view.y / ts) - 1);
      endX = Math.min(this.width - 1, Math.floor((view.x + view.w) / ts) + 1);
      endY = Math.min(this.height - 1, Math.floor((view.y + view.h) / ts) + 1);
    }

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = this.data[y][x];
        const px = x * ts;
        const py = y * ts;

        switch (tile) {
          case TileType.PATH:
            ctx.fillStyle = '#edd298';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#dab574';
            if ((x + y) % 3 === 0) ctx.fillRect(px + 3, py + 4, 2, 2);
            if ((x * 2 + y) % 5 === 0) ctx.fillRect(px + 10, py + 11, 2, 2);
            break;

          case TileType.WOOD_DOCK:
            ctx.fillStyle = '#b07946';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#784c28';
            ctx.fillRect(px, py + 3, ts, 1);
            ctx.fillRect(px, py + 8, ts, 1);
            ctx.fillRect(px, py + 13, ts, 1);
            break;

          case TileType.GRASS:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#4f943a';
            if ((x + y) % 4 === 0) ctx.fillRect(px + 4, py + 4, 3, 2);
            break;

          case TileType.TALL_GRASS:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#2f741c';
            ctx.fillRect(px + 2, py + 2, 3, 12);
            ctx.fillRect(px + 7, py + 4, 3, 10);
            ctx.fillRect(px + 11, py + 2, 3, 12);
            ctx.fillStyle = '#7ac95c';
            ctx.fillRect(px + 3, py + 1, 2, 3);
            ctx.fillRect(px + 8, py + 3, 2, 3);
            ctx.fillRect(px + 12, py + 1, 2, 3);
            break;

          case TileType.TREE:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#22551a';
            ctx.beginPath();
            ctx.arc(px + 8, py + 7, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#39832d';
            ctx.beginPath();
            ctx.arc(px + 7, py + 6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#653a1a';
            ctx.fillRect(px + 6, py + 11, 4, 5);
            break;

          case TileType.WATER:
            ctx.fillStyle = '#3b86e8';
            ctx.fillRect(px, py, ts, ts);
            const waveOffset = Math.sin(animTime * 0.005 + x + y) * 2;
            ctx.fillStyle = '#7db6ff';
            ctx.fillRect(px + 2 + waveOffset, py + 6, 6, 2);
            ctx.fillRect(px + 8 - waveOffset, py + 11, 5, 2);
            break;

          case TileType.FENCE:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#9e6229';
            ctx.fillRect(px + 2, py + 3, 12, 3);
            ctx.fillRect(px + 2, py + 9, 12, 3);
            ctx.fillRect(px + 4, py + 1, 3, 15);
            ctx.fillRect(px + 10, py + 1, 3, 15);
            break;

          case TileType.ROOF:
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#991111';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#ee5555';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.WALL:
            ctx.fillStyle = '#f3ebe1';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#d6c8b4';
            ctx.fillRect(px, py + 7, ts, 1);
            if (x % 2 === 0) {
              ctx.fillStyle = '#4da6ff';
              ctx.fillRect(px + 4, py + 3, 8, 8);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(px + 5, py + 4, 3, 3);
            }
            break;

          case TileType.GYM_ROOF:
            ctx.fillStyle = '#556677';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#334455';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#778899';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.GYM_WALL:
            ctx.fillStyle = '#8a929a';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#5e656d';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillStyle = '#222';
            ctx.fillRect(px + 4, py + 4, 8, 8);
            ctx.fillStyle = '#f0c040';
            ctx.fillRect(px + 7, py + 7, 2, 2);
            break;

          case TileType.WATER_GYM_ROOF:
            ctx.fillStyle = '#1188bb';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#0a5577';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#33ccee';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.WATER_GYM_WALL:
            ctx.fillStyle = '#66ccdd';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#3399aa';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillStyle = '#115577';
            ctx.fillRect(px + 4, py + 4, 8, 8);
            ctx.fillStyle = '#88eeff';
            ctx.fillRect(px + 6, py + 6, 4, 4);
            break;

          case TileType.ELECTRIC_GYM_ROOF:
            ctx.fillStyle = '#e6b800';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#997a00';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#ffee44';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.ELECTRIC_GYM_WALL:
            ctx.fillStyle = '#445522';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#283314';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillStyle = '#ffee00';
            ctx.fillRect(px + 5, py + 4, 6, 6); // Lightning bolt insignia
            break;

          case TileType.MART_ROOF:
            ctx.fillStyle = '#2070d8';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#104899';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#5098ff';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.VIP_ROOF:
            ctx.fillStyle = '#6a2c91';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#441660';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#f5c542';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.VIP_WALL:
            ctx.fillStyle = '#3a2030';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#25121e';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillStyle = '#f5c542';
            ctx.fillRect(px + 6, py + 4, 4, 4);
            break;

          case TileType.LAVENDER_ROOF:
            ctx.fillStyle = '#5e3a8c';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#3a1f59';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#8c5cd9';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.LAVENDER_WALL:
            ctx.fillStyle = '#443355';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#281e33';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillStyle = '#aa88ff';
            ctx.fillRect(px + 6, py + 4, 4, 6); // Ghost candle window
            break;

          case TileType.ROBLOX_BLOCK:
            // Classic yellow & grey studded block
            ctx.fillStyle = '#00a2ff';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#e69900';
            ctx.fillRect(px + 2, py + 2, 12, 12);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + 4, py + 4, 3, 3); // Top stud highlight
            break;

          case TileType.ROCK:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#6e747c';
            ctx.beginPath();
            ctx.arc(px + 8, py + 8, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9aa0a8';
            ctx.beginPath();
            ctx.arc(px + 6, py + 6, 3, 0, Math.PI * 2);
            ctx.fill();
            break;

          case TileType.DOOR:
            ctx.fillStyle = '#f3ebe1';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#7a3b1a';
            ctx.fillRect(px + 2, py + 2, 12, 14);
            ctx.fillStyle = '#f5c542';
            ctx.fillRect(px + 11, py + 9, 2, 2);
            break;

          case TileType.FLOWER:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#e83b70';
            ctx.fillRect(px + 4, py + 4, 3, 3);
            ctx.fillRect(px + 10, py + 8, 3, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 5, py + 5, 1, 1);
            ctx.fillRect(px + 11, py + 9, 1, 1);
            break;

          case TileType.SIGN:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(px + 2, py + 3, 12, 8);
            ctx.fillRect(px + 7, py + 11, 2, 5);
            ctx.fillStyle = '#dab574';
            ctx.fillRect(px + 4, py + 5, 8, 4);
            break;

          case TileType.INDOOR_FLOOR:
            ctx.fillStyle = '#d9c7a8';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#c4ad8a';
            ctx.fillRect(px, py + 7, ts, 1);
            if ((x + y) % 3 === 0) ctx.fillRect(px + 3, py + 12, 2, 2);
            break;

          case TileType.INDOOR_WALL:
            ctx.fillStyle = '#8a6a4a';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#6b4f34';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillStyle = '#a9855f';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.CARPET:
            ctx.fillStyle = '#c0504d';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#e8b04d';
            ctx.strokeStyle = '#e8b04d';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2.5, py + 2.5, ts - 5, ts - 5);
            break;

          case TileType.COUNTER:
            ctx.fillStyle = '#b07946';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#7a4a22';
            ctx.fillRect(px, py + 6, ts, 9);
            ctx.fillStyle = '#d9a76a';
            ctx.fillRect(px, py, ts, 3);
            break;

          case TileType.GYM_MAT:
            ctx.fillStyle = '#cdb98f';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#b09a6c';
            ctx.strokeStyle = '#b09a6c';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 3.5, py + 3.5, ts - 7, ts - 7);
            break;

          case TileType.SOIL:
            ctx.fillStyle = '#6b4a2a';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#5a3c20';
            ctx.fillRect(px + 2, py + 2, 12, 3);
            ctx.fillRect(px + 2, py + 8, 12, 3);
            ctx.fillRect(px + 2, py + 13, 12, 2);
            break;

          case TileType.LAVA:
            ctx.fillStyle = '#c22a00';
            ctx.fillRect(px, py, ts, ts);
            const lavaGlow = Math.sin(animTime * 0.006 + x * 2 + y) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 180, 30, ${0.45 + lavaGlow * 0.45})`;
            ctx.fillRect(px + 2, py + 4, 12, 3);
            ctx.fillRect(px + 5, py + 10, 8, 3);
            break;

          case TileType.CAVE_FLOOR:
            ctx.fillStyle = '#6b6257';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#5a5147';
            ctx.fillRect(px + 3, py + 5, 4, 3);
            ctx.fillRect(px + 10, py + 11, 3, 2);
            break;

          case TileType.CAVE_WALL:
            ctx.fillStyle = '#3a342e';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#4d463e';
            ctx.fillRect(px + 2, py + 2, 5, 4);
            ctx.fillRect(px + 9, py + 8, 5, 5);
            break;

          case TileType.SAND:
            ctx.fillStyle = '#d9b36b';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#c49a52';
            if ((x + y) % 3 === 0) ctx.fillRect(px + 4, py + 6, 3, 2);
            break;

          case TileType.MARBLE:
            ctx.fillStyle = '#e8e2d6';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#c9c0b0';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillRect(px + 7, py, 1, ts);
            break;

          case TileType.WOOD_FLOOR:
            ctx.fillStyle = '#a9784a';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#8c5f35';
            ctx.fillRect(px, py + 4, ts, 1);
            ctx.fillRect(px, py + 10, ts, 1);
            break;

          case TileType.EXIT_MAT:
            ctx.fillStyle = '#d9c7a8';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#4a8ad9';
            ctx.fillRect(px + 3, py + 3, 10, 10);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(px + 5, py + 6);
            ctx.lineTo(px + 11, py + 6);
            ctx.lineTo(px + 8, py + 11);
            ctx.closePath();
            ctx.fill();
            break;

          case TileType.CAVE_GRASS:
            ctx.fillStyle = '#4d5a3c';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#6f8a4a';
            ctx.fillRect(px + 2, py + 4, 3, 10);
            ctx.fillRect(px + 7, py + 2, 3, 12);
            ctx.fillRect(px + 12, py + 5, 2, 9);
            break;

          case TileType.ASH_GRASS:
            ctx.fillStyle = '#5a4a44';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#8a4a38';
            ctx.fillRect(px + 2, py + 5, 3, 9);
            ctx.fillRect(px + 7, py + 3, 3, 11);
            ctx.fillRect(px + 12, py + 6, 2, 8);
            break;

          case TileType.FARM_FENCE:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#9e6229';
            ctx.fillRect(px + 1, py + 4, 14, 2);
            ctx.fillRect(px + 1, py + 10, 14, 2);
            ctx.fillRect(px + 4, py + 1, 2, 14);
            ctx.fillRect(px + 10, py + 1, 2, 14);
            break;

          case TileType.SNOW:
            ctx.fillStyle = '#e6f3fb';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#c9e2f2';
            ctx.fillRect(px + 2, py + 5, 6, 2);
            ctx.fillRect(px + 9, py + 11, 5, 2);
            ctx.fillStyle = '#ffffff';
            if ((x + y) % 4 === 0) ctx.fillRect(px + 11, py + 3, 2, 2);
            break;

          case TileType.CLOUD:
            ctx.fillStyle = '#cfe6ff';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#eaf5ff';
            ctx.beginPath();
            ctx.arc(px + 5, py + 6 + (y % 2), 4.5, 0, Math.PI * 2);
            ctx.arc(px + 11, py + 5, 5, 0, Math.PI * 2);
            ctx.arc(px + 8, py + 11, 4, 0, Math.PI * 2);
            ctx.fill();
            break;

          case TileType.MARSH:
            ctx.fillStyle = '#46543a';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#5d6f4a';
            ctx.fillRect(px + 1, py + 2, 13, 2);
            ctx.fillRect(px + 2, py + 9, 10, 2);
            ctx.fillStyle = '#6f7f5a';
            if ((x + y) % 3 === 0) ctx.fillRect(px + 5, py + 6, 3, 2);
            break;

        }
      }
    }

    // Draw NPCs
    this.npcs.forEach((npc) => {
      this.drawNPC(ctx, npc);
    });
  }

  private drawNPC(ctx: CanvasRenderingContext2D, npc: NPC) {
    const ts = TileMap.TILE_SIZE;
    const px = npc.x * ts;
    const py = npc.y * ts;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(px + 8, py + 14, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (npc.type === 'teleporter') {
      const pulse = 0.45 + Math.sin(Date.now() / 260) * 0.2;
      ctx.fillStyle = '#06121f';
      ctx.fillRect(px + 1, py + 5, 14, 9);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1.5, py + 5.5, 13, 8);
      ctx.fillStyle = `rgba(0,229,255,${pulse})`;
      ctx.fillRect(px + 3, py + 7, 10, 5);
      ctx.fillStyle = '#b2ebf2';
      ctx.fillRect(px + 5, py + 9, 6, 1);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(px + 7, py + 2, 2, 3);
      return;
    }

    // Special Check: Classic Roblox Noob character
    if (npc.id === 'roblox_noob') {
      // Classic blocky yellow arms/head, blue torso, green legs
      ctx.fillStyle = '#00aa00'; // legs
      ctx.fillRect(px + 4, py + 10, 3, 5);
      ctx.fillRect(px + 9, py + 10, 3, 5);
      ctx.fillStyle = '#0022cc'; // blue torso
      ctx.fillRect(px + 4, py + 5, 8, 6);
      ctx.fillStyle = '#f5cd2f'; // yellow arms
      ctx.fillRect(px + 2, py + 5, 2, 5);
      ctx.fillRect(px + 12, py + 5, 2, 5);
      // Yellow block head
      ctx.fillRect(px + 5, py + 1, 6, 5);
      // Smiling face
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 6, py + 2, 1, 1);
      ctx.fillRect(px + 9, py + 2, 1, 1);
      ctx.fillRect(px + 6, py + 4, 4, 1);
      return;
    }

    // Special Check: Bacon Hair avatar
    if (npc.id === 'roblox_bacon') {
      ctx.fillStyle = '#222';
      ctx.fillRect(px + 4, py + 10, 3, 5);
      ctx.fillRect(px + 9, py + 10, 3, 5);
      ctx.fillStyle = '#cc2222'; // Red Roblox jacket
      ctx.fillRect(px + 4, py + 5, 8, 6);
      ctx.fillStyle = '#ffe0b2'; // Head
      ctx.fillRect(px + 5, py + 2, 6, 5);
      // Bacon hair strands
      ctx.fillStyle = '#7a4218';
      ctx.fillRect(px + 4, py, 8, 2);
      ctx.fillRect(px + 4, py + 1, 2, 3);
      ctx.fillRect(px + 10, py + 1, 2, 3);
      ctx.fillStyle = '#000';
      ctx.fillRect(px + 6, py + 3, 1, 1);
      ctx.fillRect(px + 9, py + 3, 1, 1);
      return;
    }

    // Default NPC body
    ctx.fillStyle = npc.color;
    ctx.fillRect(px + 4, py + 6, 8, 8);

    // Head
    ctx.fillStyle = '#ffdfba';
    ctx.fillRect(px + 5, py + 2, 6, 6);

    // Hairstyles & accessories
    if (npc.id === 'special_yusti') {
      ctx.fillStyle = '#1144aa';
      ctx.fillRect(px + 4, py, 8, 3);
      ctx.fillRect(px + 3, py + 1, 2, 3);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(px + 5, py + 4, 6, 1);
    } else if (npc.id === 'special_zaky') {
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(px + 3, py, 9, 3);
      ctx.fillRect(px + 10, py + 1, 3, 2);
    } else if (npc.id === 'special_dio') {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(px + 3, py - 1, 10, 4);
      ctx.fillRect(px + 4, py - 3, 3, 2);
      ctx.fillRect(px + 8, py - 3, 3, 2);
    } else if (npc.id === 'special_zazzie') {
      ctx.fillStyle = '#aa22ee';
      ctx.fillRect(px + 4, py, 8, 3);
      ctx.fillRect(px + 10, py - 2, 3, 4);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(px + 4, py + 3, 2, 3);
    } else if (npc.id === 'gym_leader_surge') {
      // Lt. Surge: Military blonde flattop & dogtags
      ctx.fillStyle = '#e6c840';
      ctx.fillRect(px + 4, py - 1, 8, 3);
      ctx.fillStyle = '#999999';
      ctx.fillRect(px + 7, py + 7, 2, 2); // Dogtags
    } else if (npc.id === 'gym_leader_misty') {
      ctx.fillStyle = '#e65c00';
      ctx.fillRect(px + 4, py, 8, 3);
      ctx.fillRect(px + 2, py - 2, 3, 4);
      ctx.fillStyle = '#ffff33';
      ctx.fillRect(px + 5, py + 6, 6, 4);
    } else if (npc.id === 'gym_leader_giovanni') {
      // Giovanni: slicked black hair and dark suit
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(px + 3, py - 1, 10, 4);
      ctx.fillStyle = '#222222';
      ctx.fillRect(px + 4, py + 6, 8, 8);
      ctx.fillStyle = '#cc3300';
      ctx.fillRect(px + 7, py + 7, 2, 5);
    } else if (npc.id === 'gym_leader_blaine') {
      // Blaine: bald head with fiery mustache
      ctx.fillStyle = '#ffdfba';
      ctx.fillRect(px + 5, py + 1, 6, 4);
      ctx.fillStyle = '#cc3300';
      ctx.fillRect(px + 5, py + 5, 6, 2);
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(px + 3, py + 7, 10, 7);
    } else if (npc.id === 'gym_leader_erika') {
      // Erika: long green hair and flower kimono
      ctx.fillStyle = '#2f6b2f';
      ctx.fillRect(px + 3, py - 1, 10, 5);
      ctx.fillRect(px + 3, py + 3, 2, 6);
      ctx.fillRect(px + 11, py + 3, 2, 6);
      ctx.fillStyle = '#e8a0c0';
      ctx.fillRect(px + 6, py + 1, 4, 2);
    } else if (npc.type === 'nurse') {
      ctx.fillStyle = '#ff66aa';
      ctx.fillRect(px + 4, py + 1, 8, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(px + 6, py, 4, 3);
      ctx.fillStyle = '#f00';
      ctx.fillRect(px + 7, py + 1, 2, 1);
    } else if (npc.type === 'professor') {
      ctx.fillStyle = '#999';
      ctx.fillRect(px + 4, py + 1, 8, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(px + 4, py + 8, 8, 6);
    } else if (npc.type === 'gym_leader') {
      // Brock
      ctx.fillStyle = '#553311';
      ctx.fillRect(px + 3, py, 10, 3);
      ctx.fillRect(px + 4, py - 2, 3, 2);
      ctx.fillRect(px + 9, py - 2, 3, 2);
      ctx.fillStyle = '#e67300';
      ctx.fillRect(px + 5, py + 7, 6, 6);
    } else if (npc.type === 'clerk') {
      ctx.fillStyle = '#2255aa';
      ctx.fillRect(px + 4, py, 8, 3);
      ctx.fillRect(px + 4, py + 7, 8, 7);
    } else {
      ctx.fillStyle = '#663300';
      ctx.fillRect(px + 4, py + 1, 8, 3);
    }

    // Eyes
    ctx.fillStyle = '#000';
    if (npc.id === 'gym_leader_brock') {
      ctx.fillRect(px + 6, py + 5, 2, 1);
      ctx.fillRect(px + 9, py + 5, 2, 1);
    } else {
      if (npc.direction === 'down') {
        ctx.fillRect(px + 6, py + 4, 1, 2);
        ctx.fillRect(px + 9, py + 4, 1, 2);
      } else if (npc.direction === 'left') {
        ctx.fillRect(px + 5, py + 4, 1, 2);
      } else if (npc.direction === 'right') {
        ctx.fillRect(px + 10, py + 4, 1, 2);
      }
    }
  }
}
