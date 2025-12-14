import { moveLeft, moveRight, jump, slide } from './player.js';
import { gameState } from './config.js';

const keys = {
  left: false,
  right: false,
  jump: false,
  slide: false,
};

let onStartCallback = null;
let onRestartCallback = null;
let onPauseCallback = null;

// Debounce for lane switching
let lastLaneSwitch = 0;
const laneSwitchCooldown = 150; // ms

export function initInput(onStart, onRestart, onPause) {
  onStartCallback = onStart;
  onRestartCallback = onRestart;
  onPauseCallback = onPause;

  // Keyboard events
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Touch events for mobile
  setupTouchControls();

  // Button click events (restart button only - play button handled in main.js)
  const restartBtn = document.getElementById('restart-btn');

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      if (onRestartCallback) onRestartCallback();
    });
  }
}

function handleKeyDown(event) {
  const now = performance.now();

  switch (event.code) {
    case 'ArrowLeft':
    case 'KeyA':
      if (!keys.left && now - lastLaneSwitch > laneSwitchCooldown) {
        keys.left = true;
        if (gameState.isRunning) {
          moveLeft();
          lastLaneSwitch = now;
        }
      }
      break;

    case 'ArrowRight':
    case 'KeyD':
      if (!keys.right && now - lastLaneSwitch > laneSwitchCooldown) {
        keys.right = true;
        if (gameState.isRunning) {
          moveRight();
          lastLaneSwitch = now;
        }
      }
      break;

    case 'Space':
    case 'ArrowUp':
    case 'KeyW':
      // Skip handling entirely during intro (main.js handles it)
      if (gameState.isInIntro) {
        event.preventDefault();
        break;
      }
      if (!keys.jump) {
        keys.jump = true;
        if (gameState.isRunning) {
          jump();
        } else if (!gameState.isGameOver) {
          // Start game with space
          if (onStartCallback) onStartCallback();
        } else {
          // Restart game with space
          if (onRestartCallback) onRestartCallback();
        }
      }
      event.preventDefault();
      break;

    case 'ArrowDown':
    case 'KeyS':
      if (!keys.slide) {
        keys.slide = true;
        if (gameState.isRunning) {
          slide();
        }
      }
      event.preventDefault();
      break;

    case 'Escape':
      if (onPauseCallback) onPauseCallback();
      break;
  }
}

function handleKeyUp(event) {
  switch (event.code) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = false;
      break;

    case 'ArrowRight':
    case 'KeyD':
      keys.right = false;
      break;

    case 'Space':
    case 'ArrowUp':
    case 'KeyW':
      keys.jump = false;
      break;

    case 'ArrowDown':
    case 'KeyS':
      keys.slide = false;
      break;
  }
}

function setupTouchControls() {
  let touchStartX = 0;
  let touchStartY = 0;
  const swipeThreshold = 50;

  window.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (event) => {
    if (!gameState.isRunning) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > swipeThreshold) {
        moveRight();
      } else if (deltaX < -swipeThreshold) {
        moveLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY < -swipeThreshold) {
        jump();  // Swipe up = jump
      } else if (deltaY > swipeThreshold) {
        slide();  // Swipe down = slide
      }
    }
  }, { passive: true });

  // Tap to jump
  window.addEventListener('touchstart', (event) => {
    if (!gameState.isRunning) return;

    // If it's a tap (not a swipe), jump
    const tapTimeout = setTimeout(() => {
      // This will be cancelled if it's a swipe
    }, 100);

    const checkTap = () => {
      clearTimeout(tapTimeout);
    };

    window.addEventListener('touchmove', checkTap, { once: true });
  }, { passive: true });
}

export function getKeys() {
  return keys;
}

export function resetKeys() {
  keys.left = false;
  keys.right = false;
  keys.jump = false;
  keys.slide = false;
}
