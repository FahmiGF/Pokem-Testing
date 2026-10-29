// World-layer systems: scattered coins, the teleport network, and the
// recurring World Boss event.

import type { TileMap } from './tilemap';

export interface Coin {
  x: number;
  y: number;
  value: number;
  gem: boolean;
  respawnAt: number;
}

export const TELEPORT_DESTINATIONS: {
  zoneId: string;
  name: string;
  x: number;
  y: number;
  icon: string;
}[] = [
  { zoneId: 'world', name: 'Pallet Town', x: 16, y: 60, icon: '🏠' },
  { zoneId: 'farm', name: 'Sunny Farm', x: 12, y: 16, icon: '🌾' },
  { zoneId: 'zone_cave', name: 'Crystal Cavern', x: 14, y: 20, icon: '💠' },
  { zoneId: 'zone_beach', name: 'Azure Shore', x: 12, y: 17, icon: '🌊' },
  { zoneId: 'zone_ruins', name: 'Sunken Ruins', x: 12, y: 17, icon: '🏛️' },
  { zoneId: 'zone_earth', name: 'Terra Canyon', x: 12, y: 17, icon: '⛰️' },
  { zoneId: 'zone_fire', name: 'Ember Volcano', x: 12, y: 17, icon: '🌋' },
  { zoneId: 'zone_grass', name: 'Verdant Grove', x: 12, y: 17, icon: '🌳' },
  { zoneId: 'zone_ice', name: 'Frostpeak Summit', x: 12, y: 17, icon: '❄️' },
  { zoneId: 'zone_marsh', name: 'Toxic Marsh', x: 12, y: 17, icon: '☠️' },
  { zoneId: 'zone_sky', name: 'Sky Pillar', x: 10, y: 17, icon: '☁️' },
  { zoneId: 'gym_rock', name: 'Pewter Gym', x: 11, y: 15, icon: '🪨' },
  { zoneId: 'gym_water', name: 'Cerulean Gym', x: 11, y: 15, icon: '💧' },
  { zoneId: 'gym_electric', name: 'Vermilion Gym', x: 11, y: 15, icon: '⚡' },
  { zoneId: 'lavender_tower', name: 'Pokémon Tower', x: 11, y: 15, icon: '👻' },
  { zoneId: 'roblox_shrine', name: 'Roblox Shrine', x: 11, y: 15, icon: '🧱' },
  { zoneId: 'lab_oak', name: "Oak's Lab", x: 11, y: 15, icon: '🧪' },
  { zoneId: 'house_pallet', name: 'Pallet Rest House', x: 11, y: 15, icon: '🏠' },
  { zoneId: 'clubhouse', name: 'VIP Clubhouse', x: 11, y: 15, icon: '👑' },
  { zoneId: 'center_pewter', name: 'Pewter Center', x: 11, y: 15, icon: '🏥' },
  { zoneId: 'mart_pewter', name: 'Pewter Mart', x: 11, y: 15, icon: '🛒' },
  { zoneId: 'farmhouse', name: 'Sunny Farmhouse', x: 11, y: 15, icon: '🏡' },
  { zoneId: 'gym_earth', name: 'Terra Gym', x: 11, y: 15, icon: '🏋' },
  { zoneId: 'gym_fire', name: 'Ember Gym', x: 11, y: 15, icon: '🔥' },
  { zoneId: 'gym_grass', name: 'Verdant Gym', x: 11, y: 15, icon: '🌿' },
  { zoneId: 'zone_worldboss', name: 'Distortion Arena', x: 10, y: 13, icon: '🌀' },
];

// Deterministic PRNG so coin layouts stay stable between visits.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashZone(zoneId: string): number {
  let h = 2166136261;
  for (let i = 0; i < zoneId.length; i++) {
    h ^= zoneId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const COIN_COUNTS: Record<string, number> = {
  world: 34,
  farm: 14,
  zone_cave: 16,
  zone_beach: 20,
  zone_ruins: 18,
  zone_earth: 18,
  zone_fire: 18,
  zone_grass: 18,
  zone_ice: 16,
  zone_marsh: 16,
  zone_sky: 16,
  zone_worldboss: 6,
};

export function generateCoins(map: TileMap, zoneId: string): Coin[] {
  if (map.isInterior) return [];
  const count = COIN_COUNTS[zoneId] ?? 12;
  const rand = mulberry32(hashZone(zoneId));
  const coins: Coin[] = [];
  const used = new Set<string>();
  const exits = new Set(map.exits.map((e) => `${e.x},${e.y}`));
  const npcTiles = new Set(map.npcs.map((n) => `${n.x},${n.y}`));

  let attempts = 0;
  while (coins.length < count && attempts < count * 60) {
    attempts++;
    const x = 2 + Math.floor(rand() * Math.max(1, map.width - 4));
    const y = 2 + Math.floor(rand() * Math.max(1, map.height - 4));
    const key = `${x},${y}`;
    if (used.has(key) || exits.has(key) || npcTiles.has(key)) continue;
    if (map.isSolid(x, y)) continue;

    used.add(key);
    const gem = rand() < 0.12;
    coins.push({
      x,
      y,
      gem,
      value: gem ? 0 : 25 + Math.floor(rand() * 6) * 10,
      respawnAt: 0,
    });
  }
  return coins;
}

export const COIN_RESPAWN_MS = 90_000;

// --- World Boss event ---
export const WORLD_BOSS_INTERVAL_MS = 10 * 60 * 1000;
export const WORLD_BOSS_ZONE_ID = 'zone_worldboss';
export const WORLD_BOSS_SPECIES_ID = 487;
export const WORLD_BOSS_NAME = 'Giratina, Lord of the Distortion World';
