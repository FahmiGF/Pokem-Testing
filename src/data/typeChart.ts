import type { PokemonType } from '../types';

// Multiplier: defending type vs attacking type
export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: {
    rock: 0.5,
    ghost: 0.0,
  },
  fire: {
    grass: 2.0,
    bug: 2.0,
    water: 0.5,
    fire: 0.5,
    rock: 0.5,
  },
  water: {
    fire: 2.0,
    ground: 2.0,
    rock: 2.0,
    water: 0.5,
    grass: 0.5,
  },
  grass: {
    water: 2.0,
    ground: 2.0,
    rock: 2.0,
    fire: 0.5,
    grass: 0.5,
    flying: 0.5,
    bug: 0.5,
    poison: 0.5,
  },
  electric: {
    water: 2.0,
    flying: 2.0,
    electric: 0.5,
    grass: 0.5,
    ground: 0.0,
  },
  flying: {
    grass: 2.0,
    bug: 2.0,
    fighting: 2.0,
    electric: 0.5,
    rock: 0.5,
  },
  bug: {
    grass: 2.0,
    psychic: 2.0,
    fire: 0.5,
    flying: 0.5,
    fighting: 0.5,
    ghost: 0.5,
  },
  poison: {
    grass: 2.0,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
  },
  rock: {
    fire: 2.0,
    flying: 2.0,
    bug: 2.0,
    fighting: 0.5,
    ground: 0.5,
  },
  ground: {
    fire: 2.0,
    electric: 2.0,
    poison: 2.0,
    rock: 2.0,
    grass: 0.5,
    bug: 0.5,
    flying: 0.0,
  },
  fighting: {
    normal: 2.0,
    rock: 2.0,
    flying: 0.5,
    poison: 0.5,
    psychic: 0.5,
    bug: 0.5,
    ghost: 0.0,
  },
  psychic: {
    fighting: 2.0,
    poison: 2.0,
    psychic: 0.5,
  },
  ghost: {
    psychic: 2.0,
    ghost: 2.0,
    normal: 0.0,
  },
  dragon: {
    dragon: 2.0,
  },
};

export function getTypeEffectiveness(attackType: PokemonType, defenderTypes: PokemonType[]): number {
  let multiplier = 1.0;
  for (const defType of defenderTypes) {
    const chart = TYPE_CHART[attackType];
    if (chart && chart[defType] !== undefined) {
      multiplier *= chart[defType]!;
    }
  }
  return multiplier;
}
