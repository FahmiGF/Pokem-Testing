// Sprite Loader with intelligent caching and procedural pixel-art fallbacks
// Ensures no models or assets are ever missing or invisible, online or offline.

export class SpriteLoader {
  private static imageCache = new Map<string, HTMLImageElement>();
  private static fallbackCache = new Map<string, HTMLImageElement>();
  private static loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  public static getImage(url: string, speciesId?: number, fallbackColor?: string): HTMLImageElement {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    // Trigger async loading in background
    this.loadImage(url);

    // Return instant procedural fallback so canvas never renders blank
    if (this.fallbackCache.has(url)) {
      return this.fallbackCache.get(url)!;
    }

    const fallback = this.createFallbackImage(url, speciesId, fallbackColor);
    this.fallbackCache.set(url, fallback);
    return fallback;
  }

  public static loadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url)!);
    }
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        this.loadingPromises.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        const fallback = this.createFallbackImage(url);
        this.imageCache.set(url, fallback);
        this.loadingPromises.delete(url);
        resolve(fallback);
      };
      img.src = url;
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  private static extractSpeciesId(url: string): number {
    const match = url.match(/\/(\d+)\.png/);
    return match ? parseInt(match[1], 10) : 0;
  }

  public static createFallbackImage(identifier: string, forceId?: number, fallbackColor?: string): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const isBack = identifier.includes('/back/');
    const id = forceId || this.extractSpeciesId(identifier);

    // Render based on species
    this.renderProceduralPokemon(ctx, id, isBack, fallbackColor);

    const fallbackImg = new Image();
    fallbackImg.src = canvas.toDataURL();
    return fallbackImg;
  }

  private static renderProceduralPokemon(
    ctx: CanvasRenderingContext2D,
    id: number,
    isBack: boolean,
    fallbackColor?: string
  ) {
    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(32, 54, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Custom hand-crafted pixel art for key species
    if (id === 999) {
      // Classic Roblox Noob
      ctx.fillStyle = '#00aa00'; // Green legs
      ctx.fillRect(20, 38, 10, 18);
      ctx.fillRect(34, 38, 10, 18);

      ctx.fillStyle = '#0022cc'; // Blue torso
      ctx.fillRect(16, 20, 32, 20);

      ctx.fillStyle = '#f5cd2f'; // Yellow arms
      ctx.fillRect(7, 20, 9, 18);
      ctx.fillRect(48, 20, 9, 18);

      ctx.fillRect(22, 6, 20, 16); // Yellow head
      if (!isBack) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(26, 11, 3, 4);
        ctx.fillRect(35, 11, 3, 4);
        ctx.fillRect(27, 18, 10, 2);
      }
      return;
    }

    if (id === 1 || id === 2 || id === 3) {
      // Bulbasaur / Ivysaur / Venusaur
      const baseCol = id === 3 ? '#3f8865' : id === 2 ? '#48a880' : '#52be90';
      const spotCol = '#2a6652';
      const flowerCol = id === 3 ? '#e04555' : id === 2 ? '#d65b82' : '#85c256';

      // Plant / Bulb on back
      ctx.fillStyle = flowerCol;
      if (id === 3) {
        // Venusaur large palm/flower
        ctx.beginPath();
        ctx.ellipse(32, isBack ? 24 : 18, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e5a522';
        ctx.beginPath();
        ctx.arc(32, isBack ? 24 : 18, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(32, isBack ? 26 : 22, 12, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body
      ctx.fillStyle = baseCol;
      ctx.beginPath();
      ctx.ellipse(32, 38, 18, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark spots
      ctx.fillStyle = spotCol;
      ctx.fillRect(22, 34, 5, 4);
      ctx.fillRect(38, 36, 6, 5);

      // Legs
      ctx.fillStyle = baseCol;
      ctx.fillRect(18, 44, 7, 10);
      ctx.fillRect(39, 44, 7, 10);
      ctx.fillStyle = '#fff';
      ctx.fillRect(18, 52, 2, 2);
      ctx.fillRect(23, 52, 2, 2);
      ctx.fillRect(39, 52, 2, 2);
      ctx.fillRect(44, 52, 2, 2);

      // Head
      ctx.fillStyle = baseCol;
      const headY = isBack ? 30 : 25;
      ctx.beginPath();
      ctx.arc(32, headY, 13, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillRect(20, headY - 14, 5, 6);
      ctx.fillRect(39, headY - 14, 5, 6);

      if (!isBack) {
        // Red eyes
        ctx.fillStyle = '#d22';
        ctx.fillRect(24, headY - 2, 4, 5);
        ctx.fillRect(36, headY - 2, 4, 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(25, headY - 1, 2, 2);
        ctx.fillRect(37, headY - 1, 2, 2);
        // Smile
        ctx.fillStyle = '#2a6652';
        ctx.fillRect(28, headY + 6, 8, 2);
      }
      return;
    }

    if (id === 4 || id === 5 || id === 6) {
      // Charmander / Charmeleon / Charizard
      const orange = id === 6 ? '#d9541e' : id === 5 ? '#c4431e' : '#f08030';
      const belly = '#fbe382';

      // Wings for Charizard
      if (id === 6) {
        ctx.fillStyle = '#1e7b6d';
        ctx.beginPath();
        ctx.moveTo(10, 10);
        ctx.lineTo(26, 28);
        ctx.lineTo(8, 30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(54, 10);
        ctx.lineTo(38, 28);
        ctx.lineTo(56, 30);
        ctx.closePath();
        ctx.fill();
      }

      // Tail with fire
      ctx.fillStyle = orange;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(22, 42);
      ctx.quadraticCurveTo(10, 40, 8, 28);
      ctx.stroke();

      // Flame
      ctx.fillStyle = '#ff3300';
      ctx.beginPath();
      ctx.arc(8, 26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(8, 26, 3, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = orange;
      ctx.beginPath();
      ctx.ellipse(32, 38, 14, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Belly
      if (!isBack) {
        ctx.fillStyle = belly;
        ctx.beginPath();
        ctx.ellipse(33, 40, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Feet
      ctx.fillStyle = orange;
      ctx.fillRect(22, 48, 7, 7);
      ctx.fillRect(35, 48, 7, 7);

      // Head
      ctx.fillStyle = orange;
      ctx.beginPath();
      ctx.arc(32, 20, 11, 0, Math.PI * 2);
      ctx.fill();

      // Horns for Charizard
      if (id === 6) {
        ctx.fillRect(22, 10, 4, 6);
        ctx.fillRect(38, 10, 4, 6);
      }

      if (!isBack) {
        // Blue eyes
        ctx.fillStyle = '#2288dd';
        ctx.fillRect(26, 17, 3, 5);
        ctx.fillRect(35, 17, 3, 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(26, 17, 1, 2);
        ctx.fillRect(35, 17, 1, 2);
      }
      return;
    }

    if (id === 7 || id === 8 || id === 9) {
      // Squirtle / Wartortle / Blastoise
      const blue = id === 9 ? '#3c6cb8' : id === 8 ? '#5282d8' : '#6898f0';
      const shellBrown = '#8b4e28';
      const shellBelly = '#ebd87c';

      // Blastoise Cannons
      if (id === 9) {
        ctx.fillStyle = '#8f9298';
        ctx.fillRect(16, 10, 7, 14);
        ctx.fillRect(41, 10, 7, 14);
        ctx.fillStyle = '#3a3a40';
        ctx.fillRect(17, 8, 5, 3);
        ctx.fillRect(42, 8, 5, 3);
      }

      // Shell
      ctx.fillStyle = isBack ? shellBrown : blue;
      ctx.beginPath();
      ctx.ellipse(32, 38, 16, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!isBack) {
        ctx.fillStyle = shellBelly;
        ctx.beginPath();
        ctx.ellipse(32, 39, 10, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c4aa48';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Head
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.arc(32, 22, 12, 0, Math.PI * 2);
      ctx.fill();

      // Wartortle furry ears
      if (id === 8) {
        ctx.fillStyle = '#d8e5ff';
        ctx.fillRect(16, 14, 5, 8);
        ctx.fillRect(43, 14, 5, 8);
      }

      // Legs
      ctx.fillStyle = blue;
      ctx.fillRect(20, 48, 6, 7);
      ctx.fillRect(38, 48, 6, 7);

      if (!isBack) {
        ctx.fillStyle = '#992222';
        ctx.fillRect(26, 19, 3, 5);
        ctx.fillRect(35, 19, 3, 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(27, 19, 1, 2);
        ctx.fillRect(36, 19, 1, 2);
      }
      return;
    }

    if (id === 25 || id === 26) {
      // Pikachu / Raichu
      const yellow = id === 26 ? '#e88a2a' : '#f8d030';
      ctx.fillStyle = yellow;

      // Ears
      ctx.fillRect(18, 4, 5, 16);
      ctx.fillRect(41, 4, 5, 16);
      ctx.fillStyle = '#111';
      ctx.fillRect(18, 4, 5, 5);
      ctx.fillRect(41, 4, 5, 5);

      // Body & Head
      ctx.fillStyle = yellow;
      ctx.beginPath();
      ctx.ellipse(32, 40, 14, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 24, 12, 0, Math.PI * 2);
      ctx.fill();

      // Tail (Lightning bolt)
      ctx.fillStyle = yellow;
      ctx.fillRect(10, 26, 5, 10);
      ctx.fillRect(14, 22, 6, 6);
      ctx.fillRect(8, 16, 8, 8);

      if (!isBack) {
        // Red cheeks
        ctx.fillStyle = '#ee2222';
        ctx.beginPath();
        ctx.arc(22, 28, 4, 0, Math.PI * 2);
        ctx.arc(42, 28, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#111';
        ctx.fillRect(25, 20, 3, 4);
        ctx.fillRect(36, 20, 3, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(26, 21, 1, 1);
        ctx.fillRect(37, 21, 1, 1);
      } else {
        // Back stripes
        ctx.fillStyle = '#7a3e14';
        ctx.fillRect(24, 34, 16, 2);
        ctx.fillRect(24, 39, 16, 2);
      }
      return;
    }

    if (id === 92 || id === 93 || id === 94) {
      // Gastly / Haunter / Gengar
      ctx.fillStyle = id === 94 ? '#4a2f68' : '#5c3d7e';
      ctx.beginPath();
      ctx.arc(32, 32, 18, 0, Math.PI * 2);
      ctx.fill();

      // Spikes/Horns
      ctx.fillRect(18, 14, 6, 8);
      ctx.fillRect(40, 14, 6, 8);
      ctx.fillRect(26, 12, 12, 6);

      if (!isBack) {
        // Evil red eyes
        ctx.fillStyle = '#e82222';
        ctx.fillRect(22, 26, 6, 5);
        ctx.fillRect(36, 26, 6, 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(24, 27, 2, 2);
        ctx.fillRect(38, 27, 2, 2);

        // Sinister Grin
        ctx.fillStyle = '#fff';
        ctx.fillRect(24, 38, 16, 5);
        ctx.fillStyle = '#222';
        ctx.fillRect(28, 38, 1, 5);
        ctx.fillRect(32, 38, 1, 5);
        ctx.fillRect(36, 38, 1, 5);
      }
      return;
    }

    if (id === 150) {
      // Mewtwo
      ctx.fillStyle = '#6a3698'; // Purple tail
      ctx.beginPath();
      ctx.ellipse(20, 42, 8, 14, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d5c7ea'; // Pale purple body
      ctx.beginPath();
      ctx.ellipse(32, 36, 11, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(32, 18, 9, 0, Math.PI * 2);
      ctx.fill();

      // Horn ears
      ctx.fillRect(26, 8, 3, 6);
      ctx.fillRect(35, 8, 3, 6);

      if (!isBack) {
        ctx.fillStyle = '#6a26a8';
        ctx.fillRect(28, 16, 2, 3);
        ctx.fillRect(34, 16, 2, 3);
      }
      return;
    }

    if (id === 487) {
      // Giratina — Dark Souls Boss
      // Black & red dragon wings
      ctx.fillStyle = '#18181c';
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(26, 24);
      ctx.lineTo(6, 36);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(56, 8);
      ctx.lineTo(38, 24);
      ctx.lineTo(58, 36);
      ctx.closePath();
      ctx.fill();

      // Red spikes on wings
      ctx.fillStyle = '#cc1818';
      ctx.fillRect(6, 12, 4, 3);
      ctx.fillRect(54, 12, 4, 3);

      // Heavy armored body
      ctx.fillStyle = '#424248';
      ctx.beginPath();
      ctx.ellipse(32, 38, 15, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gold collar
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(24, 22, 16, 5);
      ctx.fillRect(22, 12, 4, 8);
      ctx.fillRect(38, 12, 4, 8);

      // Red torso stripes
      ctx.fillStyle = '#cc1818';
      ctx.fillRect(26, 32, 12, 2);
      ctx.fillRect(26, 38, 12, 2);
      ctx.fillRect(26, 44, 12, 2);

      // Head
      ctx.fillStyle = '#2a2a30';
      ctx.beginPath();
      ctx.arc(32, 18, 9, 0, Math.PI * 2);
      ctx.fill();

      // Glowing red eyes
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(28, 16, 3, 2);
      ctx.fillRect(33, 16, 3, 2);
      return;
    }

    // Dynamic Generic High-Quality Monster Sprite for all other species
    const col = fallbackColor || (id % 3 === 0 ? '#48a0f0' : id % 2 === 0 ? '#e05830' : '#58b850');
    ctx.fillStyle = col;

    // Body
    ctx.beginPath();
    ctx.ellipse(32, 38, 15, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(32, 22, 11, 0, Math.PI * 2);
    ctx.fill();

    // Ears / horns
    ctx.fillRect(23, 11, 4, 6);
    ctx.fillRect(37, 11, 4, 6);

    // Legs
    ctx.fillRect(22, 46, 6, 7);
    ctx.fillRect(36, 46, 6, 7);

    // Belly highlight
    if (!isBack) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(32, 40, 8, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Expressive eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(26, 18, 4, 5);
      ctx.fillRect(34, 18, 4, 5);
      ctx.fillStyle = '#111';
      ctx.fillRect(27, 19, 2, 3);
      ctx.fillRect(35, 19, 2, 3);
    }
  }
}
