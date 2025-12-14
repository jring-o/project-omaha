/**
 * TOWER DEFENDER 2347 - Game Module
 * Main game loop, state management, and game flow
 */

import { WAVE_CONFIG, END_MESSAGES } from './config.js';
import { initScene, getScene, getCamera, getRenderer, updateStars, render } from './scene.js';
import { initControls, isActionActive, requestPointerLock, updateControlsDisplay, cancelKeyBind, saveControls, resetControls, isPointerLockedState } from './controls.js';
import { initPhysicsWorld, enablePhysics, disablePhysics, updatePhysics, clearDebris, setCollisionDamageCallback } from './physics.js';
import { createPlayer, getPlayer, updatePlayer, resetPlayer, setTurretVisible, toggleCameraView, getCameraViewMode, resetCameraView } from './player.js';
import { createEnemy, getEnemies, updateEnemies, damageEnemy, clearEnemies, getEnemyCount, isBossActive } from './enemies.js';
import { updateProjectiles, clearProjectiles, handleWeaponInput, fireEnemyProjectile } from './projectiles.js';
import { initParticleSystem, createExplosion, updateExplosions, updateParticles, clearEffects } from './particles.js';
import { createTower, getTowerBlocks, getTowerBodies, damageBlock, clearTower, repairTower, calculateTowerHealth, getBlockCount, triggerBlockCollapse } from './tower.js';
import { updateHUD, updateWeaponIndicator, setupMinimap, updateMinimap, updateCockpit, showWaveAnnouncement, flashDamage, showGameUI, updateControlsHint, setCockpitVisible, showEducationalText, updateActivePowerupsDisplay, updateFundingDisplay, initServicesPanel, showServicesPanel, updateServicesDisplay } from './ui.js';
import { initServices, updateServices, resetServices } from './services.js';
import { spawnPowerup, updatePowerups, updateActivePowerups, clearPowerups, isPowerupActive, consumePowerup, getPowerupMultiplier, isTowerShielded, getActivePowerupsDisplay } from './powerups.js';
import { initShop, openShop, closeShop, getScoreMultiplier, getDamageReduction, getTowerHealthMultiplier, getTowerRegenRate, getDroneCount, resetUpgrades } from './shop.js';
import { startCinematic, updateCinematic, isCinematicActive, hasSeenCinematic, skipCinematic, resetCinematicState } from './cinematic.js';

// Game state
const gameState = {
    isPlaying: false,
    isPaused: false,
    inShop: false,
    inCinematic: false,
    score: 0,
    funding: 0,
    combo: 1,
    comboTimer: 0,
    wave: 1,
    towerHealth: 100,
    maxTowerHealth: 100,
    currentWeapon: 0,
    lastFireTime: 0,
    enemiesKilled: 0,
    enemiesAlive: 0,
    isBoosting: false,
    waveInProgress: false,
    lastDestroyedBlock: null
};

// Drones from community upgrades
let drones = [];
let droneFireCooldown = 0;
let droneProjectiles = [];

// Clock for delta time
let clock = null;

// Tower regen timer
let regenTimer = 0;

/**
 * Initialize the game
 */
export function initGame() {
    // Initialize scene
    const { scene, camera, renderer } = initScene();

    // Initialize clock
    clock = new THREE.Clock();

    // Initialize controls
    initControls(renderer);

    // Initialize physics
    initPhysicsWorld();

    // Set up collision damage callback for falling blocks
    setCollisionDamageCallback((block, damage) => {
        handleBlockDamage(scene, block, damage);
    });

    // Create tower
    createTower(scene);

    // Create player
    createPlayer(scene);

    // Initialize particle system
    initParticleSystem(scene);

    // Initialize services
    initServices();
    initServicesPanel();

    // Initialize shop
    initShop();

    // Setup minimap
    setupMinimap();

    // Setup UI event listeners
    setupUIListeners();

    // Hide loading
    document.getElementById('loading').style.display = 'none';

    // Start render loop
    animate();
}

/**
 * Main animation loop
 */
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1);
    const scene = getScene();
    const camera = getCamera();

    // Handle cinematic
    if (gameState.inCinematic) {
        updateCinematic(deltaTime);
        render();
        return;
    }

    if (gameState.isPlaying && !gameState.isPaused && !gameState.inShop) {
        // Update player
        updatePlayer(deltaTime, camera, gameState, getTowerBlocks(), getTowerBodies());

        // Handle weapon input
        handleWeaponInput(scene, gameState.currentWeapon);

        // Update enemies with boss action handler
        updateEnemies(deltaTime, getTowerBlocks(), getTowerBodies(), getPlayer(),
            (enemy, targetBlock) => {
                fireEnemyProjectile(scene, enemy, targetBlock);
            },
            (action, data) => {
                handleBossAction(scene, action, data);
            }
        );

        // Update projectiles
        updateProjectiles(
            scene,
            deltaTime,
            getTowerBlocks(),
            (block, damage) => handleBlockDamage(scene, block, damage),
            (enemy, damage) => handleEnemyDamage(scene, enemy, damage),
            (pos, size, color) => createExplosion(scene, pos, size, color)
        );

        // Update drones
        updateDrones(scene, deltaTime);
        updateDroneProjectiles(scene, deltaTime);

        // Update powerups
        updatePowerups(scene, deltaTime, getPlayer().position);
        updateActivePowerups(deltaTime);

        // Handle pending powerup effects
        handlePendingPowerups(scene);

        // Update explosions and particles
        updateExplosions(scene, deltaTime);
        updateParticles(deltaTime);

        // Update physics
        updatePhysics(scene, deltaTime, getTowerBlocks(), getTowerBodies(), (mesh, index) => {
            // Track destroyed blocks
            gameState.lastDestroyedBlock = mesh;
        });

        // Tower regeneration from upgrades
        const regenRate = getTowerRegenRate();
        if (regenRate > 0) {
            regenTimer += deltaTime;
            if (regenTimer >= 1) {
                regenTimer = 0;
                const healAmount = regenRate;
                if (gameState.towerHealth < gameState.maxTowerHealth) {
                    gameState.towerHealth = Math.min(gameState.maxTowerHealth, gameState.towerHealth + healAmount);
                    updateHUD(gameState);
                }
            }
        }

        // Combo timer
        if (gameState.comboTimer > 0) {
            gameState.comboTimer -= deltaTime;
            if (gameState.comboTimer <= 0) {
                gameState.combo = 1;
                updateHUD(gameState);
            }
        }

        // Update services based on tower health
        updateServices(gameState.towerHealth);

        // Update displays
        updateMinimap();
        updateCockpit(gameState);
        updateActivePowerupsDisplay(getActivePowerupsDisplay());
    }

    // Update starfield
    updateStars(deltaTime);

    // Render
    render();
}

/**
 * Handle boss special actions
 */
function handleBossAction(scene, action, data) {
    switch (action) {
        case 'drain':
            // Heartbleed drains tower health
            if (!isTowerShielded()) {
                gameState.towerHealth = Math.max(0, gameState.towerHealth - data.amount);
                updateHUD(gameState);
                updateServices(gameState.towerHealth);
                flashDamage();

                if (gameState.towerHealth <= 0) {
                    gameOver();
                }
            }
            break;

        case 'remove':
            // Left-Pad removes a block directly
            if (data.block && !isTowerShielded()) {
                triggerBlockCollapse(scene, data.block);
                gameState.lastDestroyedBlock = data.block;
                createExplosion(scene, data.block.position, 15, 0x000022);
                gameState.towerHealth = calculateTowerHealth();
                updateHUD(gameState);
                updateServices(gameState.towerHealth);
            }
            break;

        case 'spawn':
            // Log4Shell spawns minions
            const minion = createEnemy(scene, data.type);
            if (minion && data.position) {
                minion.position.copy(data.position);
                minion.position.x += (Math.random() - 0.5) * 50;
                minion.position.z += (Math.random() - 0.5) * 50;
            }
            gameState.enemiesAlive++;
            updateHUD(gameState);
            break;

        case 'corrupt':
            // Colors corrupts random blocks (damage without projectile)
            const blocks = getTowerBlocks();
            if (blocks.length > 0 && !isTowerShielded()) {
                const randomBlock = blocks[Math.floor(Math.random() * blocks.length)];
                handleBlockDamage(scene, randomBlock, 15);
            }
            break;
    }
}

/**
 * Handle pending powerup effects
 */
function handlePendingPowerups(scene) {
    // Check for heal tower powerup
    const healData = consumePowerup('backupRestore');
    if (healData) {
        const healPercent = healData.amount || 20;
        gameState.towerHealth = Math.min(gameState.maxTowerHealth, gameState.towerHealth + healPercent);
        updateHUD(gameState);
    }

    // Check for money powerup
    const moneyData = consumePowerup('sponsorCheck');
    if (moneyData) {
        gameState.funding += moneyData.amount || 500;
        updateFundingDisplay(gameState.funding);
    }

    // Check for restore block powerup
    const restoreData = consumePowerup('gitRevert');
    if (restoreData && gameState.lastDestroyedBlock) {
        // In a full implementation, we'd restore the block
        // For now, just heal the tower a bit
        gameState.towerHealth = Math.min(gameState.maxTowerHealth, gameState.towerHealth + 10);
        updateHUD(gameState);
    }
}

/**
 * Update community drones
 */
function updateDrones(scene, deltaTime) {
    const droneCount = getDroneCount();
    const player = getPlayer();
    const enemies = getEnemies();

    // Spawn/despawn drones as needed
    while (drones.length < droneCount) {
        const drone = createDrone(scene);
        drones.push(drone);
    }
    while (drones.length > droneCount) {
        const drone = drones.pop();
        scene.remove(drone);
    }

    // Update drone positions and firing
    droneFireCooldown -= deltaTime;

    drones.forEach((drone, index) => {
        // Orbit around player
        const angle = (Date.now() / 1000 + index * (Math.PI * 2 / drones.length)) % (Math.PI * 2);
        const orbitRadius = 20;
        drone.position.set(
            player.position.x + Math.cos(angle) * orbitRadius,
            player.position.y + 5 + Math.sin(angle * 2) * 2,
            player.position.z + Math.sin(angle) * orbitRadius
        );

        // Face nearest enemy
        if (enemies.length > 0) {
            let nearest = enemies[0];
            let nearestDist = drone.position.distanceTo(nearest.position);
            enemies.forEach(enemy => {
                const dist = drone.position.distanceTo(enemy.position);
                if (dist < nearestDist) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            });
            drone.lookAt(nearest.position);

            // Fire at enemies
            if (droneFireCooldown <= 0 && nearestDist < 200) {
                fireDroneProjectile(scene, drone, nearest);
                droneFireCooldown = 0.5; // Fire rate
            }
        }

        // Rotate
        drone.children[0].rotation.y += deltaTime * 3;
    });
}

/**
 * Create a drone mesh
 */
function createDrone(scene) {
    const drone = new THREE.Group();

    const bodyGeometry = new THREE.OctahedronGeometry(2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    drone.add(body);

    const light = new THREE.PointLight(0xffaa00, 1, 15);
    drone.add(light);

    scene.add(drone);
    return drone;
}

/**
 * Fire drone projectile
 */
function fireDroneProjectile(scene, drone, target) {
    // Create a simple projectile
    const geometry = new THREE.SphereGeometry(0.5, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(drone.position);

    const direction = target.position.clone().sub(drone.position).normalize();
    projectile.userData = {
        direction: direction,
        speed: 200,
        damage: 15,
        lifetime: 3,
        target: target
    };

    scene.add(projectile);
    droneProjectiles.push(projectile);
}

/**
 * Update drone projectiles
 */
function updateDroneProjectiles(scene, deltaTime) {
    for (let i = droneProjectiles.length - 1; i >= 0; i--) {
        const projectile = droneProjectiles[i];
        const data = projectile.userData;

        // Move projectile
        const movement = data.direction.clone().multiplyScalar(data.speed * deltaTime);
        projectile.position.add(movement);

        // Update lifetime
        data.lifetime -= deltaTime;
        if (data.lifetime <= 0) {
            scene.remove(projectile);
            droneProjectiles.splice(i, 1);
            continue;
        }

        // Check collision with enemies
        const enemies = getEnemies();
        for (const enemy of enemies) {
            const distance = projectile.position.distanceTo(enemy.position);
            if (distance < 5) {
                // Hit enemy
                handleEnemyDamage(scene, enemy, data.damage);
                scene.remove(projectile);
                droneProjectiles.splice(i, 1);
                break;
            }
        }
    }
}

/**
 * Handle block damage
 */
function handleBlockDamage(scene, block, damage) {
    // Apply damage reduction from upgrades
    const enemyType = null; // Could pass enemy type for specific reductions
    const reduction = getDamageReduction(enemyType);
    const actualDamage = damage * (1 - reduction);

    // Check if tower is shielded
    if (isTowerShielded()) {
        return gameState.towerHealth;
    }

    const health = damageBlock(scene, block, actualDamage,
        (towerHealth) => {
            gameState.towerHealth = towerHealth;
            updateHUD(gameState);
            updateServices(towerHealth);
        },
        (destroyedBlock) => {
            createExplosion(scene, destroyedBlock.position, 12, 0xff6600);
            gameState.lastDestroyedBlock = destroyedBlock;
        }
    );

    flashDamage();

    if (health <= 0 || getBlockCount() === 0) {
        gameOver();
    }

    return health;
}

/**
 * Handle enemy damage
 */
function handleEnemyDamage(scene, enemy, damage) {
    const destroyed = damageEnemy(scene, enemy, damage, (position, color, points, isBoss, enemyType) => {
        createExplosion(scene, position, isBoss ? 20 : 6, color);

        // Apply score multiplier from upgrades and powerups
        const upgradeMultiplier = getScoreMultiplier();
        const powerupMultiplier = getPowerupMultiplier('scoreMultiplier');
        const finalPoints = Math.floor(points * gameState.combo * upgradeMultiplier * powerupMultiplier);

        gameState.score += finalPoints;
        gameState.funding += Math.floor(finalPoints * 0.1); // 10% of score becomes funding
        gameState.combo = Math.min(10, gameState.combo + 1);
        gameState.comboTimer = 3;
        gameState.enemiesKilled++;
        gameState.enemiesAlive--;

        updateHUD(gameState);
        updateFundingDisplay(gameState.funding);

        // Chance to drop powerup
        const dropChance = 1.0; // 100% drop rate for testing
        if (Math.random() < dropChance) {
            spawnPowerup(scene, position);
        }

        // Check wave completion
        if (getEnemyCount() === 0 && gameState.waveInProgress) {
            gameState.waveInProgress = false;
            waveComplete();
        }
    });
}

/**
 * Wave complete - show educational text and open shop
 */
function waveComplete() {
    const waveConfig = WAVE_CONFIG.getWaveConfig(gameState.wave);

    // Show educational text
    if (waveConfig && waveConfig.educational) {
        const fullText = waveConfig.educational.text +
            (waveConfig.educational.source ? `\n\n— ${waveConfig.educational.source}` : '');
        showEducationalText(fullText, () => {
            // Open shop after educational text
            openShopScreen();
        });
    } else {
        openShopScreen();
    }
}

/**
 * Open shop screen
 */
function openShopScreen() {
    gameState.inShop = true;

    // Release pointer lock so user can interact with shop
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    openShop(gameState.funding,
        (path, index, cost) => {
            // Purchase callback
            if (gameState.funding >= cost) {
                gameState.funding -= cost;
                updateFundingDisplay(gameState.funding);
                return true;
            }
            return false;
        },
        () => {
            // Close callback
            gameState.inShop = false;
            nextWave();
        }
    );
}

/**
 * Start the game
 */
export function startGame() {
    const scene = getScene();
    const camera = getCamera();

    // Always show cinematic when starting game
    gameState.inCinematic = true;
    document.getElementById('start-screen').style.display = 'none';

    startCinematic(scene, camera, () => {
        gameState.inCinematic = false;
        beginGame();
    });
}

/**
 * Begin actual gameplay
 */
function beginGame() {
    document.getElementById('start-screen').style.display = 'none';
    showGameUI(true);

    updateControlsHint('descent', 'first');

    // Calculate max health from upgrades
    gameState.maxTowerHealth = 100 * getTowerHealthMultiplier();

    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.inShop = false;
    gameState.score = 0;
    gameState.funding = 100; // Starting funding
    gameState.combo = 1;
    gameState.wave = 1;
    gameState.towerHealth = gameState.maxTowerHealth;
    gameState.enemiesKilled = 0;
    gameState.enemiesAlive = 0;
    gameState.currentWeapon = 0;
    gameState.waveInProgress = false;

    resetPlayer();
    resetCameraView();
    setTurretVisible(false);
    resetServices();

    updateHUD(gameState);
    updateWeaponIndicator(gameState.currentWeapon);
    updateFundingDisplay(gameState.funding);
    showServicesPanel(true);
    updateServicesDisplay(gameState.towerHealth);

    setCockpitVisible(true); // Start in first person with cockpit
    enablePhysics();

    setTimeout(() => {
        spawnWave();
    }, 2000);
}

/**
 * Spawn a wave of enemies
 */
function spawnWave() {
    const scene = getScene();
    const waveConfig = WAVE_CONFIG.getWaveConfig(gameState.wave);

    if (!waveConfig) {
        victory();
        return;
    }

    gameState.waveInProgress = true;

    // Show wave announcement
    showWaveAnnouncement(gameState.wave);

    // Spawn regular enemies
    let delay = 500;
    const enemies = waveConfig.enemies;

    Object.keys(enemies).forEach(type => {
        for (let i = 0; i < enemies[type]; i++) {
            setTimeout(() => {
                if (gameState.isPlaying && gameState.waveInProgress) {
                    createEnemy(scene, type);
                    gameState.enemiesAlive++;
                    updateHUD(gameState);
                }
            }, delay);
            delay += 200 + Math.random() * 300;
        }
    });

    // Spawn boss if this wave has one
    if (waveConfig.boss) {
        setTimeout(() => {
            if (gameState.isPlaying && gameState.waveInProgress) {
                createEnemy(scene, waveConfig.boss);
                gameState.enemiesAlive++;
                updateHUD(gameState);
            }
        }, delay + 2000); // Boss comes after regular enemies
    }
}

/**
 * Move to next wave
 */
function nextWave() {
    gameState.wave++;

    if (gameState.wave > WAVE_CONFIG.maxWaves) {
        victory();
        return;
    }

    setTimeout(() => {
        spawnWave();
    }, 1500);
}

/**
 * Pause the game
 */
export function pauseGame() {
    if (!gameState.isPlaying || gameState.inShop) return;
    if (document.getElementById('controls-modal').style.display === 'flex') return;

    gameState.isPaused = true;
    document.getElementById('pause-menu').style.display = 'flex';
}

/**
 * Resume the game
 */
export function resumeGame() {
    gameState.isPaused = false;
    document.getElementById('pause-menu').style.display = 'none';
}

/**
 * Quit to menu
 */
export function quitToMenu() {
    const scene = getScene();

    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.inShop = false;

    document.getElementById('pause-menu').style.display = 'none';
    closeShop();
    showGameUI(false);
    showServicesPanel(false);
    document.getElementById('controls-hint').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';

    if (isPointerLockedState()) document.exitPointerLock();
    setCockpitVisible(false);

    clearEnemies(scene);
    clearProjectiles(scene);
    clearEffects(scene);
    clearDebris(scene);
    clearPowerups(scene);
    clearDrones(scene);
}

/**
 * Clear drones
 */
function clearDrones(scene) {
    drones.forEach(drone => scene.remove(drone));
    drones = [];
    droneProjectiles.forEach(p => scene.remove(p));
    droneProjectiles = [];
}

/**
 * Game over
 */
function gameOver() {
    gameState.isPlaying = false;
    gameState.waveInProgress = false;

    if (isPointerLockedState()) document.exitPointerLock();
    setCockpitVisible(false);

    const messages = END_MESSAGES.gameOver;

    document.getElementById('gameover-title').textContent = messages.title;
    document.getElementById('gameover-subtitle').textContent = messages.subtitle;
    document.getElementById('gameover-message').textContent = messages.message;
    document.getElementById('gameover-cta').textContent = messages.cta;
    document.getElementById('final-score').textContent = gameState.score.toLocaleString();
    document.getElementById('final-waves').textContent = gameState.wave;
    document.getElementById('game-over').style.display = 'flex';
}

/**
 * Victory
 */
function victory() {
    gameState.isPlaying = false;
    gameState.waveInProgress = false;

    if (isPointerLockedState()) document.exitPointerLock();
    setCockpitVisible(false);

    const messages = END_MESSAGES.victory;

    document.getElementById('victory-title').textContent = messages.title;
    document.getElementById('victory-subtitle').textContent = messages.subtitle;
    document.getElementById('victory-message').textContent = messages.message;
    document.getElementById('victory-cta').textContent = messages.cta;
    document.getElementById('victory-score').textContent = gameState.score.toLocaleString();
    document.getElementById('victory-screen').style.display = 'flex';
}

/**
 * Restart game
 */
export function restartGame() {
    const scene = getScene();

    document.getElementById('game-over').style.display = 'none';
    document.getElementById('victory-screen').style.display = 'none';

    clearEnemies(scene);
    clearProjectiles(scene);
    clearEffects(scene);
    clearPowerups(scene);
    clearDrones(scene);

    disablePhysics();
    clearTower(scene);
    clearDebris(scene);
    createTower(scene);

    resetPlayer();
    resetServices();
    resetUpgrades();
    gameState.enemiesAlive = 0;

    beginGame();
}

/**
 * Setup UI event listeners
 */
function setupUIListeners() {
    const renderer = getRenderer();

    // Start button
    document.getElementById('btn-start').addEventListener('click', startGame);

    // Controls button (start screen)
    document.getElementById('btn-controls').addEventListener('click', openControlsMenu);

    // Restart buttons
    document.getElementById('btn-restart').addEventListener('click', restartGame);
    document.getElementById('btn-play-again').addEventListener('click', restartGame);

    // Pause menu
    document.getElementById('btn-resume').addEventListener('click', resumeGame);
    document.getElementById('btn-pause-controls').addEventListener('click', openControlsMenu);
    document.getElementById('btn-quit').addEventListener('click', quitToMenu);

    // Controls modal
    document.getElementById('btn-save-controls').addEventListener('click', () => {
        saveControls();
        closeControlsMenu();
    });
    document.getElementById('btn-reset-controls').addEventListener('click', resetControls);
    document.getElementById('btn-close-controls').addEventListener('click', closeControlsMenu);

    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);

    // Mouse click for pointer lock
    window.addEventListener('mousedown', () => {
        if (gameState.isPlaying && !gameState.isPaused && !gameState.inShop) {
            requestPointerLock(renderer.domElement);
        }
    });
}

/**
 * Handle key down
 */
function handleKeyDown(e) {
    // Skip cinematic
    if (gameState.inCinematic) {
        if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
            skipCinematic();
        }
        return;
    }

    // Escape for pause/menu
    if (e.key === 'Escape') {
        if (gameState.inShop) {
            closeShop();
            gameState.inShop = false;
            nextWave();
            return;
        }
        if (document.getElementById('controls-modal').style.display === 'flex') {
            closeControlsMenu();
        } else if (gameState.isPaused) {
            resumeGame();
        } else if (gameState.isPlaying) {
            pauseGame();
        }
        return;
    }

    if (gameState.isPaused || !gameState.isPlaying || gameState.inShop) return;

    // Weapon switching
    if (isActionActive('weapon1')) {
        gameState.currentWeapon = 0;
        updateWeaponIndicator(gameState.currentWeapon);
    }
    if (isActionActive('weapon2')) {
        gameState.currentWeapon = 1;
        updateWeaponIndicator(gameState.currentWeapon);
    }
    if (isActionActive('weapon3')) {
        gameState.currentWeapon = 2;
        updateWeaponIndicator(gameState.currentWeapon);
    }

    // View toggle (V key)
    if (e.key === 'v' || e.key === 'V') {
        const viewMode = toggleCameraView();
        updateControlsHint('descent', viewMode);
        setCockpitVisible(viewMode === 'first');
    }
}

/**
 * Open controls menu
 */
function openControlsMenu() {
    cancelKeyBind();
    updateControlsDisplay();
    document.getElementById('controls-modal').style.display = 'flex';
}

/**
 * Close controls menu
 */
function closeControlsMenu() {
    cancelKeyBind();
    document.getElementById('controls-modal').style.display = 'none';
}

/**
 * Get game state
 */
export function getGameState() {
    return gameState;
}
