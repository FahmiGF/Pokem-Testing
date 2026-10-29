import { soundManager } from '../audio/sound';

export type InputKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'start'
  | 'select'
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'slot4'
  | 'slot5'
  | 'use_item'
  | 'mount'
  | 'run'
  | 'teleport';

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

      // Toggle mute only once per physical press (not on key repeat).
      if (e.code === 'KeyM') {
        soundManager.toggleMute();
      }
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
        return 'b';
      case 'ShiftLeft':
      case 'ShiftRight':
        return 'run';
      case 'Enter':
      case 'Escape':
      case 'KeyI':
        return 'start';
      case 'Digit1':
        return 'slot1';
      case 'Digit2':
        return 'slot2';
      case 'Digit3':
        return 'slot3';
      case 'Digit4':
        return 'slot4';
      case 'Digit5':
        return 'slot5';
      case 'KeyC':
      case 'KeyU':
      case 'KeyQ':
        return 'use_item';
      case 'KeyR':
        return 'mount';
      case 'KeyT':
        return 'teleport';
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
        return this.keysDown.has('KeyX') || this.keysDown.has('Backspace');
      case 'start':
        return this.keysDown.has('Enter') || this.keysDown.has('Escape') || this.keysDown.has('KeyI');
      case 'slot1':
        return this.keysDown.has('Digit1');
      case 'slot2':
        return this.keysDown.has('Digit2');
      case 'slot3':
        return this.keysDown.has('Digit3');
      case 'slot4':
        return this.keysDown.has('Digit4');
      case 'slot5':
        return this.keysDown.has('Digit5');
      case 'use_item':
        return this.keysDown.has('KeyC') || this.keysDown.has('KeyU') || this.keysDown.has('KeyQ');
      case 'mount':
        return this.keysDown.has('KeyR');
      case 'run':
        return this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
      case 'teleport':
        return this.keysDown.has('KeyT');
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
