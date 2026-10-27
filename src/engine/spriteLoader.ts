// Sprite Loader with intelligent caching and procedural pixel-art fallbacks

export class SpriteLoader {
  private static imageCache = new Map<string, HTMLImageElement>();
  private static loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  public static getImage(url: string): HTMLImageElement | null {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }
    this.loadImage(url);
    return null;
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
        // Create an offline fallback image canvas
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

  private static createFallbackImage(identifier: string): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Draw stylized retro monster silhouette
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(32, 40, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = identifier.includes('4') ? '#f08030' : identifier.includes('7') ? '#6890f0' : '#78c850';
    ctx.beginPath();
    ctx.ellipse(32, 38, 18, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(32, 22, 14, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(26, 18, 4, 6);
    ctx.fillRect(34, 18, 4, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(28, 20, 2, 4);
    ctx.fillRect(36, 20, 2, 4);

    const fallbackImg = new Image();
    fallbackImg.src = canvas.toDataURL();
    return fallbackImg;
  }
}
