import { soundManager } from './audio/sound';
import { Game } from './engine/game';
import type { InputKey } from './engine/input';

function initGame() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Initialize the game engine
  const game = new Game(canvas);

  // Sound toggle button in header
  const btnSound = document.getElementById('btn-sound') as HTMLButtonElement;
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      btnSound.textContent = isMuted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
      btnSound.style.color = isMuted ? '#ff7777' : '#77ff77';
    });
  }

  // Fullscreen button
  const btnFullscreen = document.getElementById('btn-fullscreen') as HTMLButtonElement;
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      const screenFrame = document.querySelector('.screen-frame') as HTMLElement;
      if (!document.fullscreenElement) {
        if (screenFrame && screenFrame.requestFullscreen) {
          screenFrame.requestFullscreen().catch((err) => {
            console.warn('Fullscreen request failed:', err);
          });
        }
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Bind Virtual Touch & Mouse Controls (D-Pad and A/B Buttons)
  const bindControl = (btn: HTMLElement, key: InputKey) => {
    const handleStart = (e: Event) => {
      e.preventDefault();
      btn.classList.add('pressed');
      game.input.setVirtualDown(key, true);
    };

    const handleEnd = (e: Event) => {
      e.preventDefault();
      btn.classList.remove('pressed');
      game.input.setVirtualDown(key, false);
    };

    btn.addEventListener('mousedown', handleStart);
    btn.addEventListener('mouseup', handleEnd);
    btn.addEventListener('mouseleave', handleEnd);

    btn.addEventListener('touchstart', handleStart, { passive: false });
    btn.addEventListener('touchend', handleEnd, { passive: false });
    btn.addEventListener('touchcancel', handleEnd, { passive: false });
  };

  // Bind D-pad buttons
  document.querySelectorAll<HTMLElement>('.dpad-btn').forEach((btn) => {
    const key = btn.dataset.key as InputKey;
    if (key) {
      bindControl(btn, key);
    }
  });

  // Bind Action buttons (A and B)
  document.querySelectorAll<HTMLElement>('.round-btn').forEach((btn) => {
    const key = btn.dataset.key as InputKey;
    if (key) {
      bindControl(btn, key);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
