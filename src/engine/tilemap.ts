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
}

export interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: 'down' | 'up' | 'left' | 'right';
  dialog: string[];
  type: 'nurse' | 'professor' | 'trainer' | 'gym_leader' | 'clerk' | 'citizen';
  color: string;
  trainerParty?: { id: number; level: number }[];
  rewardMoney?: number;
  badge?: string;
  afterDefeatDialog?: string[];
}

export class TileMap {
  public static readonly TILE_SIZE = 16;
  public readonly width = 32;
  public readonly height = 62;

  // 32x62 grid:
  // y 0-21: Pewter City (Town 2 with Pewter Rock Gym, Mart, Center, Fountain)
  // y 22-42: Route 1 (Scenic winding trail, tall grass patches, trainers)
  // y 43-61: Pallet Town (Oak Lab, Houses, Nurse, Lake)
  public data: number[][];

  public npcs: NPC[] = [
    // --- PALLET TOWN (y: 44 - 60) ---
    {
      id: 'oak',
      name: 'Prof. Oak',
      x: 8,
      y: 50,
      direction: 'down',
      dialog: [
        'Ah, welcome to the world of Pokémon!',
        'Travel north through Route 1 to reach PEWTER CITY.',
        'Defeat Gym Leader Brock there to earn your first BOULDER BADGE!',
        'Make sure to catch new Pokémon along the way!',
      ],
      type: 'professor',
      color: '#d2b48c',
    },
    {
      id: 'nurse_pallet',
      name: 'Nurse Joy',
      x: 21,
      y: 53,
      direction: 'down',
      dialog: [
        'Welcome to Pallet Town Care Station!',
        'Let me heal your Pokémon team back to tip-top shape!',
        '...Your Pokémon are now fully revitalized! Take care!',
      ],
      type: 'nurse',
      color: '#ff99b3',
    },

    // --- ROUTE 1 (y: 22 - 42) ---
    {
      id: 'trainer_joey',
      name: 'Youngster Joey',
      x: 17,
      y: 35,
      direction: 'left',
      dialog: [
        'My Rattata is in the top percentage of all Rattata!',
        "Let's see how tough you are in a Pokémon battle!",
      ],
      type: 'trainer',
      color: '#e06622',
      trainerParty: [
        { id: 19, level: 6 }, // Rattata
        { id: 16, level: 7 }, // Pidgey
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
      x: 13,
      y: 25,
      direction: 'right',
      dialog: [
        'Halt! Are you heading to Pewter City?',
        "You can't challenge Brock without passing me first!",
      ],
      type: 'trainer',
      color: '#3388cc',
      trainerParty: [
        { id: 56, level: 8 }, // Mankey
        { id: 66, level: 9 }, // Machop
      ],
      rewardMoney: 400,
      afterDefeatDialog: [
        'Impressive battle! Brock specializes in rock-type Pokémon.',
        'Water and Grass moves are super effective against Rock and Ground!',
      ],
    },

    // --- PEWTER CITY (Town 2, y: 0 - 21) ---
    {
      id: 'nurse_pewter',
      name: 'Nurse Joy',
      x: 8,
      y: 16,
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
      y: 16,
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
      x: 12,
      y: 6,
      direction: 'down',
      dialog: [
        'Welcome to PEWTER CITY - A stone gray city!',
        'The Pewter Museum exhibits ancient fossils of prehistoric Pokémon.',
        'The Gym is right beside us! Brock is known as the rock-solid Pokémon Trainer!',
      ],
      type: 'citizen',
      color: '#8888aa',
    },
    {
      id: 'gym_leader_brock',
      name: 'Gym Leader Brock',
      x: 20,
      y: 4,
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
        'You have earned my utmost respect, Champion in the making!',
      ],
    },
  ];

  constructor() {
    this.data = this.generateMap();
  }

  private generateMap(): number[][] {
    const w = this.width;
    const h = this.height;
    const map: number[][] = [];

    // Initialize entire map with grass
    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      for (let x = 0; x < w; x++) {
        row.push(TileType.GRASS);
      }
      map.push(row);
    }

    // Outer tree borders
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
    // 1. PALLET TOWN (Y: 44 to 59)
    // ==========================================
    // Town path network
    for (let y = 44; y <= 58; y++) {
      map[y][15] = TileType.PATH;
      map[y][16] = TileType.PATH;
    }
    for (let x = 6; x <= 26; x++) {
      map[54][x] = TileType.PATH;
      map[55][x] = TileType.PATH;
    }

    // Connect to buildings
    for (let y = 50; y <= 54; y++) {
      map[y][8] = TileType.PATH;
      map[y][21] = TileType.PATH;
    }

    // Building: Prof. Oak's Lab (x: 5-11, y: 46-49)
    for (let y = 46; y <= 49; y++) {
      for (let x = 5; x <= 11; x++) {
        map[y][x] = y <= 47 ? TileType.ROOF : TileType.WALL;
      }
    }
    map[49][8] = TileType.DOOR;

    // Building: Pallet Rest House / Center (x: 18-24, y: 49-52)
    for (let y = 49; y <= 52; y++) {
      for (let x = 18; x <= 24; x++) {
        map[y][x] = y <= 50 ? TileType.ROOF : TileType.WALL;
      }
    }
    map[52][21] = TileType.DOOR;

    // Pallet Town Pond (x: 23-28, y: 55-58)
    for (let y = 55; y <= 58; y++) {
      for (let x = 23; x <= 28; x++) {
        map[y][x] = TileType.WATER;
      }
    }

    // Fences in Pallet
    for (let x = 4; x <= 12; x++) map[44][x] = TileType.FENCE;
    for (let x = 19; x <= 27; x++) map[44][x] = TileType.FENCE;

    // Decorative flowers
    const palletFlowers = [
      [6, 51], [7, 51], [19, 53], [20, 53],
      [14, 56], [14, 57], [17, 56], [17, 57],
    ];
    palletFlowers.forEach(([fx, fy]) => { map[fy][fx] = TileType.FLOWER; });

    // Signs
    map[50][6] = TileType.SIGN;  // Oak Lab
    map[54][13] = TileType.SIGN; // Pallet Town Sign

    // ==========================================
    // 2. ROUTE 1 (Y: 22 to 43)
    // ==========================================
    // Winding path north
    for (let y = 35; y <= 43; y++) {
      map[y][15] = TileType.PATH;
      map[y][16] = TileType.PATH;
    }
    for (let y = 28; y <= 34; y++) {
      map[y][14] = TileType.PATH;
      map[y][15] = TileType.PATH;
    }
    for (let y = 22; y <= 27; y++) {
      map[y][15] = TileType.PATH;
      map[y][16] = TileType.PATH;
    }

    // Tall grass patches on Route 1
    // Patch A (lower left)
    for (let y = 36; y <= 41; y++) {
      for (let x = 5; x <= 13; x++) map[y][x] = TileType.TALL_GRASS;
    }
    // Patch B (lower right)
    for (let y = 34; y <= 40; y++) {
      for (let x = 18; x <= 26; x++) map[y][x] = TileType.TALL_GRASS;
    }
    // Patch C (mid left)
    for (let y = 27; y <= 32; y++) {
      for (let x = 4; x <= 12; x++) map[y][x] = TileType.TALL_GRASS;
    }
    // Patch D (upper right, near mountain rocks)
    for (let y = 24; y <= 29; y++) {
      for (let x = 18; x <= 27; x++) map[y][x] = TileType.TALL_GRASS;
    }

    // Mountain rock boulders on Route 1
    const rocks = [
      [3, 26], [4, 25], [28, 28], [27, 27], [28, 32], [27, 33], [3, 38], [4, 39]
    ];
    rocks.forEach(([rx, ry]) => { map[ry][rx] = TileType.ROCK; });

    map[38][14] = TileType.SIGN; // Route 1 south sign
    map[23][14] = TileType.SIGN; // Route 1 north sign

    // ==========================================
    // 3. PEWTER CITY - TOWN 2 (Y: 2 to 21)
    // ==========================================
    // Pewter main roads
    for (let y = 2; y <= 21; y++) {
      map[y][15] = TileType.PATH;
      map[y][16] = TileType.PATH;
    }
    for (let x = 4; x <= 27; x++) {
      map[10][x] = TileType.PATH;
      map[11][x] = TileType.PATH;
      map[18][x] = TileType.PATH;
      map[19][x] = TileType.PATH;
    }

    // Connect to buildings
    for (let y = 14; y <= 18; y++) {
      map[y][8] = TileType.PATH;
      map[y][23] = TileType.PATH;
    }
    for (let y = 5; y <= 10; y++) {
      map[y][20] = TileType.PATH;
    }

    // Central Fountain Plaza (x: 14-17, y: 9-12)
    for (let y = 9; y <= 12; y++) {
      for (let x = 14; x <= 17; x++) {
        map[y][x] = TileType.WATER;
      }
    }

    // Building: Pewter Gym (Boss Gym - Brock) (x: 17-23, y: 2-5)
    for (let y = 2; y <= 5; y++) {
      for (let x = 17; x <= 23; x++) {
        map[y][x] = y <= 3 ? TileType.GYM_ROOF : TileType.GYM_WALL;
      }
    }
    map[5][20] = TileType.DOOR;
    map[6][18] = TileType.SIGN; // Gym Signboard

    // Building: Pokémon Center (x: 5-11, y: 13-16)
    for (let y = 13; y <= 16; y++) {
      for (let x = 5; x <= 11; x++) {
        map[y][x] = y <= 14 ? TileType.ROOF : TileType.WALL;
      }
    }
    map[16][8] = TileType.DOOR;

    // Building: Pokémon Mart (x: 20-26, y: 13-16)
    for (let y = 13; y <= 16; y++) {
      for (let x = 20; x <= 26; x++) {
        map[y][x] = y <= 14 ? TileType.MART_ROOF : TileType.WALL;
      }
    }
    map[16][23] = TileType.DOOR;

    // Building: Pewter Museum (x: 5-13, y: 3-6)
    for (let y = 3; y <= 6; y++) {
      for (let x = 5; x <= 13; x++) {
        map[y][x] = y <= 4 ? TileType.GYM_ROOF : TileType.WALL;
      }
    }
    map[6][9] = TileType.DOOR;
    map[7][7] = TileType.SIGN; // Museum Sign

    // Pewter Town Sign
    map[12][13] = TileType.SIGN;

    // Pewter Rock Statues & Boulders
    const pewterRocks = [
      [13, 8], [18, 8], [13, 13], [18, 13],
      [4, 8], [4, 11], [27, 8], [27, 11],
      [16, 2], [24, 2]
    ];
    pewterRocks.forEach(([rx, ry]) => { map[ry][rx] = TileType.ROCK; });

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
      tile === TileType.ROCK ||
      tile === TileType.SIGN
    ) {
      return true;
    }

    // Check NPC collision
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

  public draw(ctx: CanvasRenderingContext2D, animTime: number) {
    const ts = TileMap.TILE_SIZE;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
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
            // Slate gray rock roof
            ctx.fillStyle = '#556677';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#334455';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#778899';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.GYM_WALL:
            // Granite stone brick
            ctx.fillStyle = '#8a929a';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#5e656d';
            ctx.fillRect(px, py + 7, ts, 1);
            ctx.fillStyle = '#222';
            ctx.fillRect(px + 4, py + 4, 8, 8);
            ctx.fillStyle = '#f0c040';
            ctx.fillRect(px + 7, py + 7, 2, 2); // torch glow
            break;

          case TileType.MART_ROOF:
            // Bright Blue PokeMart Roof
            ctx.fillStyle = '#2070d8';
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = '#104899';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = '#5098ff';
            ctx.fillRect(px, py, ts, 2);
            break;

          case TileType.ROCK:
            ctx.fillStyle = '#5ca944';
            ctx.fillRect(px, py, ts, ts);
            // Boulder
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

    // Body / Outfit
    ctx.fillStyle = npc.color;
    ctx.fillRect(px + 4, py + 6, 8, 8);

    // Head / Face
    ctx.fillStyle = '#ffdfba';
    ctx.fillRect(px + 5, py + 2, 6, 6);

    // Characteristic hair / hat
    if (npc.type === 'nurse') {
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
      // Brock: Spiky brown hair & vest
      ctx.fillStyle = '#553311';
      ctx.fillRect(px + 3, py, 10, 3);
      ctx.fillRect(px + 4, py - 2, 3, 2);
      ctx.fillRect(px + 9, py - 2, 3, 2);
      ctx.fillStyle = '#e67300';
      ctx.fillRect(px + 5, py + 7, 6, 6);
    } else if (npc.type === 'clerk') {
      // Blue Mart uniform & cap
      ctx.fillStyle = '#2255aa';
      ctx.fillRect(px + 4, py, 8, 3);
      ctx.fillRect(px + 4, py + 7, 8, 7);
    } else {
      ctx.fillStyle = '#663300';
      ctx.fillRect(px + 4, py + 1, 8, 3);
    }

    // Eyes
    ctx.fillStyle = '#000';
    if (npc.type === 'gym_leader') {
      // Brock's squint eyes
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
