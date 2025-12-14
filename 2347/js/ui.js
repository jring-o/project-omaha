/**
 * TOWER DEFENDER 2347 - UI Module
 * HUD, minimap, and cockpit displays
 */

import { isActionActive } from './controls.js';
import { getPlayer, getPlayerVelocity, getCameraViewMode, getDescentPitch } from './player.js';
import { getEnemies } from './enemies.js';
import { SERVICES } from './config.js';

let educationalCallback = null;

/**
 * Update HUD display
 */
export function updateHUD(gameState) {
    const scoreElem = document.getElementById('score');
    const comboElem = document.getElementById('combo');
    const waveElem = document.getElementById('wave');
    const enemiesElem = document.getElementById('enemies');
    const healthBar = document.getElementById('tower-health');
    const healthText = document.getElementById('tower-health-text');

    if (scoreElem) scoreElem.textContent = gameState.score.toLocaleString();
    if (comboElem) comboElem.textContent = `x${gameState.combo}`;
    if (waveElem) waveElem.textContent = gameState.wave;
    if (enemiesElem) enemiesElem.textContent = gameState.enemiesAlive;

    if (healthBar) {
        healthBar.style.width = `${gameState.towerHealth}%`;
        healthBar.classList.remove('warning', 'danger');
        if (gameState.towerHealth < 25) {
            healthBar.classList.add('danger');
        } else if (gameState.towerHealth < 50) {
            healthBar.classList.add('warning');
        }
    }

    if (healthText) {
        healthText.textContent = `${Math.round(gameState.towerHealth)}%`;
        healthText.classList.remove('warning', 'danger');
        if (gameState.towerHealth < 25) {
            healthText.classList.add('danger');
        } else if (gameState.towerHealth < 50) {
            healthText.classList.add('warning');
        }
    }
}

/**
 * Update weapon indicator
 */
export function updateWeaponIndicator(currentWeapon) {
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`weapon-${i + 1}`);
        if (slot) {
            slot.classList.toggle('active', i === currentWeapon);
        }
    }
}

/**
 * Setup minimap
 */
export function setupMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (canvas) {
        canvas.width = 200;
        canvas.height = 200;
    }
}

/**
 * Update minimap
 */
export function updateMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const player = getPlayer();
    const enemies = getEnemies();

    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(0, 0, 200, 200);

    const scale = 0.15;
    const centerX = 100;
    const centerY = 100;

    // Tower
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Player
    if (player) {
        const playerX = centerX + player.position.x * scale;
        const playerZ = centerY + player.position.z * scale;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(playerX, playerZ, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        const ex = centerX + enemy.position.x * scale;
        const ez = centerY + enemy.position.z * scale;
        ctx.beginPath();
        ctx.arc(ex, ez, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Update cockpit display
 */
export function updateCockpit(gameState) {
    const viewMode = getCameraViewMode();

    if (viewMode !== 'first') return;

    const player = getPlayer();
    const velocity = getPlayerVelocity();
    const enemies = getEnemies();

    // Speed
    const speed = Math.round(velocity.length());
    const speedElem = document.getElementById('cockpit-speed');
    if (speedElem) speedElem.textContent = speed;

    // Altitude
    const altitude = Math.round(player.position.y);
    const altitudeElem = document.getElementById('cockpit-altitude');
    if (altitudeElem) altitudeElem.textContent = altitude;

    // Throttle
    const maxSpeed = gameState.isBoosting ? 120 : 60;
    const throttlePercent = Math.min(100, Math.round((speed / maxSpeed) * 100));
    const throttleValue = document.getElementById('throttle-value');
    const throttleBar = document.getElementById('throttle-bar');
    const throttleHandle = document.getElementById('throttle-handle');

    if (throttleValue) throttleValue.textContent = throttlePercent + '%';
    if (throttleBar) throttleBar.style.width = throttlePercent + '%';
    if (throttleHandle) {
        const handlePos = 80 - (throttlePercent * 0.7);
        throttleHandle.style.bottom = handlePos + '%';
    }

    // Shield
    const shieldPercent = gameState.towerHealth;
    const shieldValue = document.getElementById('shield-value');
    const shieldBar = document.getElementById('shield-bar');
    if (shieldValue) shieldValue.textContent = shieldPercent + '%';
    if (shieldBar) {
        shieldBar.style.width = shieldPercent + '%';
        shieldBar.className = 'gauge-bar-fill' +
            (shieldPercent < 25 ? ' danger' : shieldPercent < 50 ? ' warning' : '');
    }

    // Tower health
    const towerValue = document.getElementById('tower-value');
    const towerBar = document.getElementById('tower-bar');
    if (towerValue) towerValue.textContent = gameState.towerHealth + '%';
    if (towerBar) {
        towerBar.style.width = gameState.towerHealth + '%';
        towerBar.className = 'gauge-bar-fill' +
            (gameState.towerHealth < 25 ? ' danger' : gameState.towerHealth < 50 ? ' warning' : '');
    }

    // Energy
    const energyValue = document.getElementById('energy-value');
    const energyBar = document.getElementById('energy-bar');
    if (energyValue) energyValue.textContent = '100%';
    if (energyBar) energyBar.style.width = '100%';

    // Weapon
    const weaponNames = ['LASER', 'SPREAD', 'MISSILE'];
    const weaponElem = document.getElementById('cockpit-weapon');
    if (weaponElem) weaponElem.textContent = weaponNames[gameState.currentWeapon] || 'LASER';

    // Attitude indicator
    const pitchDeg = THREE.MathUtils.radToDeg(getDescentPitch());
    const attitudeBall = document.getElementById('attitude-ball');
    if (attitudeBall) {
        attitudeBall.style.transform = `translate(-50%, calc(-50% + ${pitchDeg}px))`;
    }

    // Trigger flash
    const trigger = document.getElementById('joystick-trigger');
    if (trigger) {
        trigger.style.background = isActionActive('fire') ? '#ff8888' : '#ff4444';
        trigger.style.boxShadow = isActionActive('fire') ? '0 0 15px #ff4444' : '0 0 5px #ff4444';
    }

    // Warning lights
    const warnHull = document.getElementById('warn-hull');
    if (warnHull) {
        warnHull.classList.toggle('active', gameState.towerHealth < 30);
    }

    const warnEngine = document.getElementById('warn-engine');
    if (warnEngine) {
        warnEngine.classList.toggle('active', gameState.isBoosting);
    }

    // Radar
    updateCockpitRadar(player, enemies);
}

/**
 * Update cockpit radar
 */
function updateCockpitRadar(player, enemies) {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radarRange = 700;

    ctx.clearRect(0, 0, size, size);

    // Player direction
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(center, center, 3, 0, Math.PI * 2);
    ctx.fill();

    const dirLength = 10;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + forward.x * dirLength, center + forward.z * dirLength);
    ctx.stroke();

    // Tower
    const towerRelX = (0 - player.position.x) / radarRange * (size / 2);
    const towerRelZ = (0 - player.position.z) / radarRange * (size / 2);
    const towerRadarX = center + towerRelX;
    const towerRadarZ = center + towerRelZ;

    if (towerRadarX > 0 && towerRadarX < size && towerRadarZ > 0 && towerRadarZ < size) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(towerRadarX, towerRadarZ, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 4;

    enemies.forEach(enemy => {
        const relX = (enemy.position.x - player.position.x) / radarRange * (size / 2);
        const relZ = (enemy.position.z - player.position.z) / radarRange * (size / 2);
        const enemyRadarX = center + relX;
        const enemyRadarZ = center + relZ;

        if (enemyRadarX > 0 && enemyRadarX < size &&
            enemyRadarZ > 0 && enemyRadarZ < size) {
            ctx.beginPath();
            ctx.arc(enemyRadarX, enemyRadarZ, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.shadowBlur = 0;
}

/**
 * Show wave announcement
 */
export function showWaveAnnouncement(wave) {
    const announcement = document.getElementById('wave-announcement');
    if (announcement) {
        announcement.textContent = `WAVE ${wave}`;
        announcement.style.display = 'block';
        setTimeout(() => {
            announcement.style.display = 'none';
        }, 2000);
    }
}

/**
 * Flash damage indicator
 */
export function flashDamage() {
    const flash = document.getElementById('damage-flash');
    if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => {
            flash.style.opacity = '0';
        }, 100);
    }
}

/**
 * Show/hide UI elements
 */
export function showGameUI(show) {
    const elements = ['hud', 'crosshair', 'weapon-indicator', 'minimap'];
    elements.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'hud') {
                elem.style.display = show ? 'flex' : 'none';
            } else {
                elem.style.display = show ? 'block' : 'none';
            }
        }
    });
}

/**
 * Update controls hint
 */
export function updateControlsHint(scheme, viewMode) {
    const hint = document.getElementById('controls-hint');
    if (!hint) return;

    const viewName = viewMode === 'first' ? '1ST PERSON' : '3RD PERSON';
    hint.textContent = `[ESC] Pause | [V] View: ${viewName} | Mouse=Aim, WASD=Strafe, Space=Boost`;
}

/**
 * Toggle cockpit overlay
 */
export function setCockpitVisible(visible) {
    const cockpit = document.getElementById('cockpit-overlay');
    const crosshair = document.getElementById('crosshair');
    const hud = document.getElementById('hud');
    const minimap = document.getElementById('minimap');
    const weaponIndicator = document.getElementById('weapon-indicator');

    if (visible) {
        if (cockpit) cockpit.style.display = 'block';
        if (crosshair) crosshair.style.display = 'none';
        if (hud) hud.style.display = 'none';
        if (minimap) minimap.style.display = 'none';
        if (weaponIndicator) weaponIndicator.style.display = 'none';
    } else {
        if (cockpit) cockpit.style.display = 'none';
        if (crosshair) crosshair.style.display = 'block';
        if (hud) hud.style.display = 'flex';
        if (minimap) minimap.style.display = 'block';
        if (weaponIndicator) weaponIndicator.style.display = 'block';
    }
}

/**
 * Update funding display
 */
export function updateFundingDisplay(funding) {
    const fundingElem = document.getElementById('funding');
    if (fundingElem) {
        fundingElem.textContent = `$${funding}`;
    }
}

/**
 * Initialize services panel
 */
export function initServicesPanel() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    grid.innerHTML = '';
    SERVICES.forEach(service => {
        const item = document.createElement('div');
        item.className = 'service-item active';
        item.id = `service-${service.id}`;
        item.innerHTML = `
            <div class="service-icon">${service.icon}</div>
            <div class="service-name">${service.name}</div>
        `;
        grid.appendChild(item);
    });
}

/**
 * Show services panel (now integrated into cockpit HUD - this is a no-op)
 */
export function showServicesPanel(show) {
    // Services are now displayed in the cockpit HUD, always visible during gameplay
}

/**
 * Update services display based on tower health
 */
export function updateServicesDisplay(towerHealth) {
    SERVICES.forEach(service => {
        const item = document.getElementById(`service-${service.id}`);
        if (!item) return;

        item.classList.remove('active', 'warning', 'failing', 'dead');

        if (towerHealth >= service.healthThreshold) {
            item.classList.add('active');
        } else if (towerHealth >= service.healthThreshold - 10) {
            item.classList.add('warning');
        } else if (towerHealth >= service.healthThreshold - 20) {
            item.classList.add('failing');
        } else {
            item.classList.add('dead');
        }
    });
}

/**
 * Update active powerups display
 */
export function updateActivePowerupsDisplay(powerups) {
    const container = document.getElementById('active-powerups');
    if (!container) return;

    if (powerups.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';

    powerups.forEach(powerup => {
        const item = document.createElement('div');
        item.className = 'active-powerup';
        item.innerHTML = `
            <span class="active-powerup-icon">${powerup.icon}</span>
            <span class="active-powerup-name">${powerup.name}</span>
            <span class="active-powerup-time">${powerup.timeRemaining}s</span>
        `;
        container.appendChild(item);
    });
}

/**
 * Show educational text overlay
 */
export function showEducationalText(text, onContinue) {
    const overlay = document.getElementById('educational-overlay');
    const textElem = document.getElementById('educational-text');

    if (overlay && textElem) {
        textElem.textContent = text;
        overlay.style.display = 'flex';
        educationalCallback = onContinue;

        // Listen for space key
        const handleKey = (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                hideEducationalText();
                window.removeEventListener('keydown', handleKey);
                if (educationalCallback) {
                    educationalCallback();
                    educationalCallback = null;
                }
            }
        };
        window.addEventListener('keydown', handleKey);
    }
}

/**
 * Hide educational text overlay
 */
export function hideEducationalText() {
    const overlay = document.getElementById('educational-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Show boss announcement
 */
export function showBossAnnouncement(bossName, subtitle) {
    const announcement = document.getElementById('boss-announcement');
    if (announcement) {
        announcement.innerHTML = `
            ${bossName}
            <div class="boss-subtitle">${subtitle || ''}</div>
        `;
        announcement.style.display = 'block';
        announcement.style.animation = 'none';
        announcement.offsetHeight; // Trigger reflow
        announcement.style.animation = 'bossIn 3s ease-out';

        setTimeout(() => {
            announcement.style.display = 'none';
        }, 3000);
    }
}

/**
 * Show game over screen with message
 */
export function showGameOverScreen(score, waves, funding, message) {
    const gameOver = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    const finalWaves = document.getElementById('final-waves');
    const finalFunding = document.getElementById('final-funding');
    const messageElem = document.getElementById('game-over-message');

    if (gameOver) {
        gameOver.style.display = 'flex';
        if (finalScore) finalScore.textContent = score.toLocaleString();
        if (finalWaves) finalWaves.textContent = waves;
        if (finalFunding) finalFunding.textContent = funding;
        if (messageElem) messageElem.textContent = message || '';
    }
}

/**
 * Show victory screen with message
 */
export function showVictoryScreen(score, funding, message) {
    const victory = document.getElementById('victory-screen');
    const victoryScore = document.getElementById('victory-score');
    const victoryFunding = document.getElementById('victory-funding');
    const messageElem = document.getElementById('victory-message');

    if (victory) {
        victory.style.display = 'flex';
        if (victoryScore) victoryScore.textContent = score.toLocaleString();
        if (victoryFunding) victoryFunding.textContent = funding;
        if (messageElem) messageElem.textContent = message || '';
    }
}
