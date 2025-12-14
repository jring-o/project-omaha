/**
 * TOWER DEFENDER 2347 - Controls Module
 * Input handling, key bindings, and control schemes
 */

import { DEFAULT_CONTROLS, DEFAULT_MOUSE_SETTINGS, STORAGE_KEYS } from './config.js';

// Current control bindings
let controlBindings = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
let mouseSettings = { ...DEFAULT_MOUSE_SETTINGS };
let controlScheme = 'descent';

// Input state
const keys = {};
const mouseButtons = {};
let mouseX = 0, mouseY = 0;
let rawMouseX = 0, rawMouseY = 0;
let mouseDeltaX = 0, mouseDeltaY = 0;
let isPointerLocked = false;

// Key binding state
let currentBindingButton = null;
let isListeningForKey = false;


/**
 * Initialize the controls system
 */
export function initControls(renderer, callbacks = {}) {
    setupEventListeners(renderer);
    setupPointerLock(renderer);
    loadControls();

    return {
        getControlBindings: () => controlBindings,
        getMouseSettings: () => mouseSettings,
        getControlScheme: () => controlScheme
    };
}

/**
 * Check if an action is currently active
 */
export function isActionActive(action) {
    const binding = controlBindings[action];
    if (!binding) return false;

    if (binding.type === 'key') {
        return keys[binding.key] || keys[binding.key.toUpperCase()] || keys[binding.key.toLowerCase()];
    } else if (binding.type === 'mouse') {
        return mouseButtons[binding.button];
    }
    return false;
}

/**
 * Get mouse position (normalized -1 to 1)
 */
export function getMousePosition() {
    return { x: mouseX, y: mouseY };
}

/**
 * Get mouse delta (for pointer lock mode)
 */
export function getMouseDelta() {
    const delta = { x: mouseDeltaX, y: mouseDeltaY };
    // Reset deltas after reading
    mouseDeltaX = 0;
    mouseDeltaY = 0;
    return delta;
}

/**
 * Get current control scheme
 */
export function getControlScheme() {
    return controlScheme;
}

/**
 * Get mouse settings
 */
export function getMouseSettings() {
    return mouseSettings;
}

/**
 * Check if pointer is locked
 */
export function isPointerLockedState() {
    return isPointerLocked;
}

/**
 * Request pointer lock
 */
export function requestPointerLock(element) {
    if (!isPointerLocked) {
        element.requestPointerLock();
    }
}

/**
 * Get key display name for UI
 */
export function getKeyDisplayName(binding) {
    if (binding.type === 'mouse') {
        const mouseNames = ['MOUSE 1', 'MOUSE 3', 'MOUSE 2', 'MOUSE 4', 'MOUSE 5'];
        return mouseNames[binding.button] || `MOUSE ${binding.button + 1}`;
    } else {
        const key = binding.key;
        const specialKeys = {
            ' ': 'SPACE',
            'arrowup': 'UP',
            'arrowdown': 'DOWN',
            'arrowleft': 'LEFT',
            'arrowright': 'RIGHT',
            'escape': 'ESC',
            'enter': 'ENTER',
            'tab': 'TAB',
            'shift': 'SHIFT',
            'control': 'CTRL',
            'alt': 'ALT',
            'backspace': 'BACKSPACE',
            'delete': 'DELETE'
        };
        return specialKeys[key.toLowerCase()] || key.toUpperCase();
    }
}

/**
 * Update controls display in UI
 */
export function updateControlsDisplay() {
    document.querySelectorAll('.control-key').forEach(btn => {
        const action = btn.dataset.action;
        if (controlBindings[action]) {
            btn.textContent = getKeyDisplayName(controlBindings[action]);
        }
    });

    const toggleInvertX = document.getElementById('toggle-invertX');
    const toggleInvertY = document.getElementById('toggle-invertY');
    const toggleInvertPitch = document.getElementById('toggle-invertPitch');
    const sensitivitySlider = document.getElementById('sensitivity-slider');
    const sensitivityValue = document.getElementById('sensitivity-value');
    const smoothingSlider = document.getElementById('smoothing-slider');
    const smoothingValue = document.getElementById('smoothing-value');

    if (toggleInvertX) toggleInvertX.classList.toggle('active', mouseSettings.invertX);
    if (toggleInvertY) toggleInvertY.classList.toggle('active', mouseSettings.invertY);
    if (toggleInvertPitch) toggleInvertPitch.classList.toggle('active', mouseSettings.invertPitch);
    if (sensitivitySlider) sensitivitySlider.value = mouseSettings.sensitivity;
    if (sensitivityValue) sensitivityValue.textContent = mouseSettings.sensitivity.toFixed(1);
    if (smoothingSlider) smoothingSlider.value = mouseSettings.smoothing;
    if (smoothingValue) smoothingValue.textContent = mouseSettings.smoothing;

    updateStartScreenControls();
}

/**
 * Update start screen control display
 */
export function updateStartScreenControls() {
    const mapping = {
        'disp-forward': 'forward',
        'disp-backward': 'backward',
        'disp-left': 'left',
        'disp-right': 'right',
        'disp-fire': 'fire',
        'disp-altfire': 'altfire',
        'disp-boost': 'boost',
        'disp-up': 'up',
        'disp-down': 'down',
        'disp-weapon1': 'weapon1',
        'disp-weapon2': 'weapon2',
        'disp-weapon3': 'weapon3',
        'disp-repair': 'repair'
    };

    for (const [elemId, action] of Object.entries(mapping)) {
        const elem = document.getElementById(elemId);
        if (elem && controlBindings[action]) {
            elem.textContent = getKeyDisplayName(controlBindings[action]);
        }
    }
}


/**
 * Start key binding process
 */
export function startKeyBind(button) {
    cancelKeyBind();
    currentBindingButton = button;
    isListeningForKey = true;
    button.classList.add('listening');
    button.textContent = 'PRESS KEY...';
}

/**
 * Cancel key binding
 */
export function cancelKeyBind() {
    if (currentBindingButton) {
        currentBindingButton.classList.remove('listening');
        const action = currentBindingButton.dataset.action;
        currentBindingButton.textContent = getKeyDisplayName(controlBindings[action]);
    }
    currentBindingButton = null;
    isListeningForKey = false;
}

/**
 * Toggle mouse setting
 */
export function toggleSetting(setting) {
    mouseSettings[setting] = !mouseSettings[setting];
    const toggle = document.getElementById(`toggle-${setting}`);
    if (toggle) toggle.classList.toggle('active', mouseSettings[setting]);
}

/**
 * Update sensitivity
 */
export function updateSensitivity(value) {
    mouseSettings.sensitivity = parseFloat(value);
    const display = document.getElementById('sensitivity-value');
    if (display) display.textContent = parseFloat(value).toFixed(1);
}

/**
 * Update smoothing
 */
export function updateSmoothing(value) {
    mouseSettings.smoothing = parseInt(value);
    const display = document.getElementById('smoothing-value');
    if (display) display.textContent = value;
}

/**
 * Save controls to localStorage
 */
export function saveControls() {
    localStorage.setItem(STORAGE_KEYS.controls, JSON.stringify(controlBindings));
    localStorage.setItem(STORAGE_KEYS.mouseSettings, JSON.stringify(mouseSettings));
    updateStartScreenControls();
}

/**
 * Load controls from localStorage
 */
export function loadControls() {
    try {
        const savedControls = localStorage.getItem(STORAGE_KEYS.controls);
        const savedMouseSettings = localStorage.getItem(STORAGE_KEYS.mouseSettings);
        const savedScheme = localStorage.getItem(STORAGE_KEYS.controlScheme);

        if (savedControls) {
            controlBindings = JSON.parse(savedControls);
        }
        if (savedMouseSettings) {
            mouseSettings = JSON.parse(savedMouseSettings);
        }
        // Always use descent mode
        controlScheme = 'descent';
    } catch (e) {
        console.warn('Failed to load saved controls, using defaults');
    }
    updateControlsDisplay();
}

/**
 * Reset controls to defaults
 */
export function resetControls() {
    controlBindings = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
    mouseSettings = { ...DEFAULT_MOUSE_SETTINGS };
    updateControlsDisplay();
}

/**
 * Setup pointer lock
 */
function setupPointerLock(renderer) {
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;

        const overlay = document.getElementById('pointer-lock-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    });

    document.addEventListener('pointerlockerror', () => {
        console.warn('Pointer lock error');
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners(renderer) {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
        if (isListeningForKey) {
            handleKeyBinding(e);
            return;
        }

        keys[e.key] = true;
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        keys[e.key.toLowerCase()] = false;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
        rawMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        rawMouseY = (e.clientY / window.innerHeight) * 2 - 1;
        mouseX = rawMouseX;
        mouseY = rawMouseY;

        if (isPointerLocked) {
            mouseDeltaX += e.movementX;
            mouseDeltaY += e.movementY;
        }
    });

    // Mouse buttons
    window.addEventListener('mousedown', (e) => {
        if (isListeningForKey) {
            handleMouseBinding(e);
            return;
        }

        mouseButtons[e.button] = true;
    });

    window.addEventListener('mouseup', (e) => {
        mouseButtons[e.button] = false;
    });

    // Prevent context menu
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent scrolling with space
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            e.preventDefault();
        }
    });

    // Setup control key buttons
    document.querySelectorAll('.control-key').forEach(btn => {
        btn.addEventListener('click', () => startKeyBind(btn));
    });

    // Setup toggle switches
    ['invertX', 'invertY', 'invertPitch'].forEach(setting => {
        const toggle = document.getElementById(`toggle-${setting}`);
        if (toggle) {
            toggle.addEventListener('click', () => toggleSetting(setting));
        }
    });

    // Setup sliders
    const sensitivitySlider = document.getElementById('sensitivity-slider');
    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', (e) => updateSensitivity(e.target.value));
    }

    const smoothingSlider = document.getElementById('smoothing-slider');
    if (smoothingSlider) {
        smoothingSlider.addEventListener('input', (e) => updateSmoothing(e.target.value));
    }

}

/**
 * Handle key binding
 */
function handleKeyBinding(e) {
    if (!isListeningForKey || !currentBindingButton) return;

    e.preventDefault();
    e.stopPropagation();

    const action = currentBindingButton.dataset.action;

    if (e.key.toLowerCase() === 'escape') {
        cancelKeyBind();
        return;
    }

    controlBindings[action] = {
        type: 'key',
        key: e.key.toLowerCase()
    };

    finishKeyBind();
}

/**
 * Handle mouse binding
 */
function handleMouseBinding(e) {
    if (!isListeningForKey || !currentBindingButton) return;

    e.preventDefault();
    e.stopPropagation();

    const action = currentBindingButton.dataset.action;

    controlBindings[action] = {
        type: 'mouse',
        button: e.button
    };

    finishKeyBind();
}

/**
 * Finish key binding
 */
function finishKeyBind() {
    if (currentBindingButton) {
        currentBindingButton.classList.remove('listening');
        const action = currentBindingButton.dataset.action;
        currentBindingButton.textContent = getKeyDisplayName(controlBindings[action]);
    }
    currentBindingButton = null;
    isListeningForKey = false;
}

/**
 * Check if we're listening for a key binding
 */
export function isListeningForBinding() {
    return isListeningForKey;
}

/**
 * Get the keys state object
 */
export function getKeysState() {
    return keys;
}
