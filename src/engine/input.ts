import { soundManager } from '../audio/sound';

export type InputKey = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select';

export class InputHandler {
  private keysDown = new Set<string>();
  private justPressed = new Set<InputKey>();

  constructor() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(e: KeyboardEvent) {
    soundManager.unlock();

    // Prevent default scrolling for game controls
    const blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }

    if (!this.keysDown.has(e.code)) {
      this.keysDown.add(e.code);

      const mapped = this.mapKey(e.code);
      if (mapped) {
        this.justPressed.add(mapped);
      }
    }

    // Toggle mute with M
    if (e.key === 'm' || e.key === 'M') {
      soundManager.toggleMute();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keysDown.delete(e.code);
  }

  private mapKey(code: string): InputKey | null {
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        return 'up';
      case 'ArrowDown':
      case 'KeyS':
        return 'down';
      case 'ArrowLeft':
      case 'KeyA':
        return 'left';
      case 'ArrowRight':
      case 'KeyD':
        return 'right';
      case 'KeyZ':
      case 'Space':
        return 'a';
      case 'KeyX':
      case 'Backspace':
      case 'ShiftLeft':
      case 'ShiftRight':
        return 'b';
      case 'Enter':
      case 'Escape':
      case 'KeyE':
      case 'KeyI':
      case 'Tab':
        return 'start';
      default:
        return null;
    }
  }

  public isDown(action: InputKey): boolean {
    switch (action) {
      case 'up':
        return this.keysDown.has('ArrowUp') || this.keysDown.has('KeyW');
      case 'down':
        return this.keysDown.has('ArrowDown') || this.keysDown.has('KeyS');
      case 'left':
        return this.keysDown.has('ArrowLeft') || this.keysDown.has('KeyA');
      case 'right':
        return this.keysDown.has('ArrowRight') || this.keysDown.has('KeyD');
      case 'a':
        return this.keysDown.has('KeyZ') || this.keysDown.has('Space');
      case 'b':
        return this.keysDown.has('KeyX') || this.keysDown.has('Backspace') || this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
      case 'start':
        return this.keysDown.has('Enter') || this.keysDown.has('Escape') || this.keysDown.has('KeyE') || this.keysDown.has('Tab');
      default:
        return false;
    }
  }

  public isJustPressed(action: InputKey): boolean {
    return this.justPressed.has(action);
  }

  // Virtual buttons for mobile/touch
  public triggerVirtualPress(action: InputKey) {
    soundManager.unlock();
    this.justPressed.add(action);
  }

  public setVirtualDown(action: InputKey, isDown: boolean) {
    soundManager.unlock();
    const mockCode = `Virtual_${action}`;
    if (isDown) {
      if (!this.keysDown.has(mockCode)) {
        this.keysDown.add(mockCode);
        this.justPressed.add(action);
      }
    } else {
      this.keysDown.delete(mockCode);
    }
  }

  // Clear single-frame presses at the end of every update frame
  public update() {
    this.justPressed.clear();
  }
}
