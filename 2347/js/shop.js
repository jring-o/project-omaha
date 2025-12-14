/**
 * TOWER DEFENDER 2347 - Shop Module
 * Between-wave skill tree upgrade shop (Diablo 2 style)
 */

import { UPGRADE_PATHS } from './config.js';

// Purchased upgrades (resets each game)
let purchasedUpgrades = {
    financial: [],
    recognition: [],
    wellbeing: [],
    community: []
};

// Calculated bonuses from upgrades
let upgradeBonuses = {
    maxHealthMult: 1,
    regenRate: 0,
    scoreMult: 1,
    damageReduction: 0,
    trollDamageReduction: 0,
    scopeCreepDamageReduction: 0,
    drones: 0,
    droneDamageMult: 1,
    droneFireRateMult: 1
};

// Currently active tab
let activeTab = 'financial';

// Skill icons for each upgrade (using emoji as fallback)
const SKILL_ICONS = {
    // Financial
    smallGrant: '💵',
    majorGrant: '💰',
    companyTime: '🏢',
    kidsFirstSteps: '👶',
    familyVacation: '✈️',
    fullTimeOSS: '💼',
    retirementPlan: '🏖️',
    // Recognition
    thankYou: '📧',
    publicCredit: '📝',
    conferenceInvite: '🎤',
    awardNomination: '🏆',
    familyUnderstands: '👨‍👩‍👧',
    industryRecognition: '⭐',
    legacy: '🏛️',
    // Wellbeing
    healthInsurance: '🏥',
    mentalHealth: '🧠',
    sayNo: '✋',
    boundaries: '🚫',
    didntDelete: '💾',
    sustainablePace: '⏰',
    retirementSavings: '🎯',
    // Community
    secondMaintainer: '👤',
    codeOfConduct: '📜',
    thirdMaintainer: '👥',
    governance: '⚖️',
    foundationStatus: '🏛️',
    corporateSponsor: '🤝',
    institutionalSupport: '🌐'
};

/**
 * Initialize shop state
 */
export function initShop() {
    purchasedUpgrades = {
        financial: [],
        recognition: [],
        wellbeing: [],
        community: []
    };
    recalculateBonuses();
}

/**
 * Open the shop UI
 */
export function openShop(currentFunding, onPurchase, onClose) {
    const shopOverlay = document.getElementById('shop-overlay');
    if (!shopOverlay) return;

    renderShopUI(currentFunding, onPurchase, onClose);
    shopOverlay.style.display = 'flex';
}

/**
 * Close the shop UI
 */
export function closeShop() {
    const shopOverlay = document.getElementById('shop-overlay');
    if (shopOverlay) {
        shopOverlay.style.display = 'none';
    }
}

/**
 * Escape HTML special characters for use in attributes
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Build a flat list of all upgrades with their positions for the tech tree
 */
function buildTechTreeLayout() {
    const allUpgrades = [];
    const upgradePositions = {};

    // Collect all upgrades from all paths
    for (const [pathKey, pathData] of Object.entries(UPGRADE_PATHS)) {
        pathData.upgrades.forEach((upgrade, index) => {
            allUpgrades.push({
                ...upgrade,
                pathKey,
                pathColor: pathData.color,
                pathIcon: pathData.icon
            });
        });
    }

    // Calculate column (x position) based on dependency depth
    function getDepth(upgradeId, visited = new Set()) {
        if (visited.has(upgradeId)) return 0;
        visited.add(upgradeId);

        const upgrade = allUpgrades.find(u => u.id === upgradeId);
        if (!upgrade || !upgrade.requires || upgrade.requires.length === 0) {
            return 0;
        }

        // Get max depth from all required upgrades (any OR group)
        let maxDepth = 0;
        for (const andGroup of upgrade.requires) {
            for (const reqId of andGroup) {
                maxDepth = Math.max(maxDepth, getDepth(reqId, new Set(visited)) + 1);
            }
        }
        return maxDepth;
    }

    // Assign columns based on depth
    allUpgrades.forEach(upgrade => {
        upgrade.column = getDepth(upgrade.id);
    });

    // Group by column
    const columns = {};
    allUpgrades.forEach(upgrade => {
        if (!columns[upgrade.column]) columns[upgrade.column] = [];
        columns[upgrade.column].push(upgrade);
    });

    // Assign row positions within each column
    const maxColumn = Math.max(...Object.keys(columns).map(Number));
    for (let col = 0; col <= maxColumn; col++) {
        if (columns[col]) {
            columns[col].forEach((upgrade, rowIndex) => {
                upgrade.row = rowIndex;
                upgradePositions[upgrade.id] = { col: upgrade.column, row: rowIndex };
            });
        }
    }

    return { allUpgrades, columns, maxColumn, upgradePositions };
}

/**
 * Render the shop UI - Civ5-style tech tree with dependency lines
 */
function renderShopUI(currentFunding, onPurchase, onClose) {
    const shopContent = document.getElementById('shop-content');
    if (!shopContent) return;

    const { allUpgrades, columns, maxColumn, upgradePositions } = buildTechTreeLayout();

    // Node dimensions for positioning
    const NODE_WIDTH = 140;
    const NODE_HEIGHT = 110;
    const COL_GAP = 40;
    const ROW_GAP = 15;
    const PADDING = 30;

    // Calculate total dimensions
    const maxRows = Math.max(...Object.values(columns).map(col => col.length));
    const totalWidth = (maxColumn + 1) * (NODE_WIDTH + COL_GAP) + PADDING * 2;
    const totalHeight = maxRows * (NODE_HEIGHT + ROW_GAP) + PADDING * 2;

    // Build nodes HTML
    let nodesHtml = '';
    allUpgrades.forEach(upgrade => {
        const purchased = isUpgradePurchased(upgrade.id);
        const reqCheck = checkRequirements(upgrade);
        const canPurchase = reqCheck.met && !purchased && currentFunding >= upgrade.cost;
        const isLocked = !reqCheck.met;

        let statusClass = 'locked';
        if (purchased) {
            statusClass = 'purchased';
        } else if (canPurchase) {
            statusClass = 'available';
        } else if (!isLocked && currentFunding < upgrade.cost) {
            statusClass = 'too-expensive';
        }

        const x = PADDING + upgrade.column * (NODE_WIDTH + COL_GAP);
        const y = PADDING + upgrade.row * (NODE_HEIGHT + ROW_GAP);

        const icon = SKILL_ICONS[upgrade.id] || '⬡';
        const effectDesc = getEffectDescription(upgrade.effect);
        const requiresText = formatRequirements(upgrade);
        const missingText = reqCheck.missing.map(id => getUpgradeNameById(id)).join(', ');

        nodesHtml += `
            <div class="tech-node ${statusClass}"
                 style="left: ${x}px; top: ${y}px; --node-color: ${upgrade.pathColor}"
                 data-id="${upgrade.id}"
                 data-path="${upgrade.pathKey}"
                 data-cost="${upgrade.cost}"
                 data-name="${escapeHtml(upgrade.name)}"
                 data-flavor="${escapeHtml(upgrade.flavor)}"
                 data-effect="${escapeHtml(effectDesc)}"
                 data-education="${escapeHtml(upgrade.education)}"
                 data-requires="${escapeHtml(requiresText)}"
                 data-missing="${escapeHtml(missingText)}">
                <div class="tech-node-header">
                    <span class="tech-node-name">${upgrade.name}</span>
                </div>
                <div class="tech-node-icons">
                    <span class="tech-node-icon">${icon}</span>
                </div>
                <div class="tech-node-effect">${effectDesc}</div>
                <div class="tech-node-cost ${statusClass}">${purchased ? 'OWNED' : '$' + upgrade.cost}</div>
                ${purchased ? '<div class="tech-node-check">✓</div>' : ''}
            </div>
        `;
    });

    // Build connector lines SVG
    let linesHtml = '<svg class="tech-tree-lines" width="' + totalWidth + '" height="' + totalHeight + '">';
    allUpgrades.forEach(upgrade => {
        if (!upgrade.requires || upgrade.requires.length === 0) return;

        const toX = PADDING + upgrade.column * (NODE_WIDTH + COL_GAP);
        const toY = PADDING + upgrade.row * (NODE_HEIGHT + ROW_GAP) + NODE_HEIGHT / 2;

        // Draw lines from each required upgrade (first AND group for simplicity)
        const reqGroup = upgrade.requires[0];
        reqGroup.forEach(reqId => {
            const reqUpgrade = allUpgrades.find(u => u.id === reqId);
            if (!reqUpgrade) return;

            const fromX = PADDING + reqUpgrade.column * (NODE_WIDTH + COL_GAP) + NODE_WIDTH;
            const fromY = PADDING + reqUpgrade.row * (NODE_HEIGHT + ROW_GAP) + NODE_HEIGHT / 2;

            const isActive = isUpgradePurchased(reqId);
            const lineClass = isActive ? 'tech-line active' : 'tech-line';

            // Draw curved connector line
            const midX = (fromX + toX) / 2;
            linesHtml += `<path class="${lineClass}" d="M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}" />`;
        });
    });
    linesHtml += '</svg>';

    let html = `
        <div class="skill-tree-header">
            <h2>SUPPORT OPEN SOURCE</h2>
            <div class="skill-tree-funding">
                <span class="funding-label">FUNDING:</span>
                <span class="funding-amount">$${currentFunding}</span>
            </div>
        </div>
        <div class="tech-tree-legend">
            <div class="legend-item"><span class="legend-box locked"></span> Not Yet Available</div>
            <div class="legend-item"><span class="legend-box available"></span> Available</div>
            <div class="legend-item"><span class="legend-box purchased"></span> Purchased</div>
        </div>
        <div class="tech-tree-scroll-container">
            <div class="tech-tree-canvas" style="width: ${totalWidth}px; height: ${totalHeight}px;">
                ${linesHtml}
                ${nodesHtml}
            </div>
        </div>
        <div class="skill-tree-footer">
            <button id="shop-continue-btn" class="skill-tree-btn">CONTINUE TO NEXT WAVE</button>
        </div>
        <div id="skill-tooltip" class="skill-tooltip hidden"></div>
    `;

    shopContent.innerHTML = html;

    // Add continue button listener
    document.getElementById('shop-continue-btn').addEventListener('click', () => {
        closeShop();
        if (onClose) onClose();
    });

    // Add tech node interactions - click to open detail popup
    document.querySelectorAll('.tech-node').forEach(node => {
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            showTechPopup(node, currentFunding, onPurchase, onClose);
        });
    });

    // Click outside popup to close it
    document.querySelector('.tech-tree-scroll-container').addEventListener('click', (e) => {
        if (!e.target.closest('.tech-node') && !e.target.closest('.tech-popup')) {
            closeTechPopup();
        }
    });
}

// Currently open popup state
let currentPopupData = null;

/**
 * Show the detail popup for a tech node
 */
function showTechPopup(node, currentFunding, onPurchase, onClose) {
    closeTechPopup(); // Close any existing popup

    const upgradeId = node.dataset.id;
    const path = node.dataset.path;
    const name = node.dataset.name;
    const flavor = node.dataset.flavor;
    const effect = node.dataset.effect;
    const education = node.dataset.education;
    const cost = parseInt(node.dataset.cost);
    const requires = node.dataset.requires;
    const missing = node.dataset.missing;
    const purchased = node.classList.contains('purchased');
    const canBuy = node.classList.contains('available');
    const isLocked = node.classList.contains('locked');

    // Store current popup data for purchase action
    currentPopupData = { upgradeId, path, cost, currentFunding, onPurchase, onClose };

    let statusText = '';
    let buttonHtml = '';

    if (purchased) {
        statusText = 'PURCHASED';
        buttonHtml = '<div class="popup-status owned">ALREADY OWNED</div>';
    } else if (canBuy) {
        statusText = 'AVAILABLE';
        buttonHtml = `<button class="popup-purchase-btn" onclick="handlePopupPurchase()">PURCHASE - $${cost}</button>`;
    } else if (isLocked) {
        statusText = 'LOCKED';
        buttonHtml = `<div class="popup-status locked">REQUIRES: ${missing}</div>`;
    } else {
        statusText = 'TOO EXPENSIVE';
        buttonHtml = `<div class="popup-status expensive">NEED $${cost - currentFunding} MORE</div>`;
    }

    let requiresHtml = '';
    if (requires && !purchased) {
        requiresHtml = `
            <div class="popup-requires">
                <span class="popup-requires-label">REQUIRES:</span>
                <span class="popup-requires-text">${requires}</span>
            </div>
        `;
    }

    const popup = document.createElement('div');
    popup.className = 'tech-popup';
    popup.innerHTML = `
        <div class="popup-header">
            <div class="popup-title">${name}</div>
            <button class="popup-close" onclick="closeTechPopup()">&times;</button>
        </div>
        <div class="popup-content">
            <div class="popup-flavor">"${flavor}"</div>
            <div class="popup-cost">Cost: <span>$${cost}</span></div>
            <div class="popup-effect">${effect}</div>
            ${requiresHtml}
            ${education ? `
                <div class="popup-education">
                    <div class="popup-education-label">WHY THIS MATTERS:</div>
                    <div class="popup-education-text">${education}</div>
                </div>
            ` : ''}
        </div>
        <div class="popup-footer">
            ${buttonHtml}
        </div>
    `;

    document.getElementById('shop-content').appendChild(popup);

    // Position popup in center of screen
    requestAnimationFrame(() => {
        popup.classList.add('show');
    });
}

/**
 * Close the tech popup
 */
function closeTechPopup() {
    const popup = document.querySelector('.tech-popup');
    if (popup) {
        popup.remove();
    }
    currentPopupData = null;
}

// Make closeTechPopup available globally for onclick
window.closeTechPopup = closeTechPopup;

/**
 * Handle purchase from popup
 */
function handlePopupPurchase() {
    if (!currentPopupData) return;

    const { upgradeId, path, cost, currentFunding, onPurchase, onClose } = currentPopupData;

    // Find index in path
    const pathData = UPGRADE_PATHS[path];
    const index = pathData.upgrades.findIndex(u => u.id === upgradeId);

    if (index >= 0 && canPurchaseUpgrade(path, index, currentFunding)) {
        if (onPurchase) {
            const success = onPurchase(path, index, cost);
            if (success) {
                purchaseUpgrade(path, index);
                closeTechPopup();
                renderShopUI(currentFunding - cost, onPurchase, onClose);
            }
        }
    }
}

// Make handlePopupPurchase available globally for onclick
window.handlePopupPurchase = handlePopupPurchase;

/**
 * Show tooltip for tech node
 */
function showTechTooltip(node, event) {
    const tooltip = document.getElementById('skill-tooltip');
    if (!tooltip) return;

    const name = node.dataset.name;
    const flavor = node.dataset.flavor;
    const effect = node.dataset.effect;
    const education = node.dataset.education;
    const cost = node.dataset.cost;
    const requires = node.dataset.requires;
    const missing = node.dataset.missing;
    const purchased = node.classList.contains('purchased');
    const canBuy = node.classList.contains('available');
    const isLocked = node.classList.contains('locked');

    let statusHtml = '';
    if (purchased) {
        statusHtml = '<div class="tooltip-status owned">PURCHASED</div>';
    } else if (canBuy) {
        statusHtml = '<div class="tooltip-status available">CLICK TO PURCHASE</div>';
    } else if (isLocked) {
        statusHtml = `<div class="tooltip-status locked">REQUIRES: ${missing}</div>`;
    } else {
        statusHtml = '<div class="tooltip-status expensive">INSUFFICIENT FUNDS</div>';
    }

    let requiresHtml = '';
    if (requires && !purchased) {
        requiresHtml = `
            <div class="tooltip-requires">
                <span class="tooltip-requires-label">REQUIRES:</span>
                <span class="tooltip-requires-text">${requires}</span>
            </div>
        `;
    }

    tooltip.innerHTML = `
        <div class="tooltip-header">
            <div class="tooltip-name">${name}</div>
            ${!purchased ? `<div class="tooltip-cost">$${cost}</div>` : ''}
        </div>
        <div class="tooltip-flavor">"${flavor}"</div>
        <div class="tooltip-effect">${effect}</div>
        ${requiresHtml}
        ${education ? `
            <div class="tooltip-education">
                <div class="tooltip-education-label">WHY THIS MATTERS:</div>
                <div class="tooltip-education-text">${education}</div>
            </div>
        ` : ''}
        ${statusHtml}
    `;

    tooltip.classList.remove('hidden');
    positionTooltip(event);
}

/**
 * Format requirements for display
 */
function formatRequirements(upgrade) {
    if (!upgrade.requires || upgrade.requires.length === 0) {
        return '';
    }

    // Format as "A + B" for AND, "A or B" for OR groups
    const groups = upgrade.requires.map(andGroup => {
        return andGroup.map(id => getUpgradeNameById(id)).join(' + ');
    });

    if (groups.length === 1) {
        return groups[0];
    }
    return groups.join(' OR ');
}

/**
 * Render the skill tree grid
 */
function renderSkillTree(pathKey, pathData, currentFunding) {
    let html = '';

    pathData.upgrades.forEach((upgrade, index) => {
        const purchased = purchasedUpgrades[pathKey].includes(upgrade.id);
        const reqCheck = checkRequirements(upgrade);
        const canPurchase = canPurchaseUpgrade(pathKey, index, currentFunding);
        const isLocked = !reqCheck.met;

        let statusClass = 'locked';
        if (purchased) {
            statusClass = 'purchased';
        } else if (canPurchase) {
            statusClass = 'available';
        } else if (!isLocked && currentFunding < upgrade.cost) {
            statusClass = 'too-expensive';
        }

        const icon = SKILL_ICONS[upgrade.id] || '⬡';
        const effectDesc = getEffectDescription(upgrade.effect);
        const requiresText = formatRequirements(upgrade);
        const missingText = reqCheck.missing.map(id => getUpgradeNameById(id)).join(', ');

        // Connection line to next skill (except for last)
        const connector = index < pathData.upgrades.length - 1
            ? `<div class="skill-connector ${purchased ? 'active' : ''}"></div>`
            : '';

        html += `
            <div class="skill-node-wrapper">
                <div class="skill-node ${statusClass}"
                     data-path="${pathKey}"
                     data-index="${index}"
                     data-cost="${upgrade.cost}"
                     data-name="${upgrade.name}"
                     data-flavor="${upgrade.flavor}"
                     data-effect="${effectDesc}"
                     data-education="${upgrade.education || ''}"
                     data-requires="${requiresText}"
                     data-missing="${missingText}">
                    <div class="skill-icon">${icon}</div>
                    <div class="skill-level">${purchased ? '✓' : ''}</div>
                </div>
                <div class="skill-label">${upgrade.name}</div>
                <div class="skill-cost ${statusClass}">${purchased ? 'OWNED' : '$' + upgrade.cost}</div>
                ${connector}
            </div>
        `;
    });

    return html;
}

/**
 * Show skill tooltip on hover
 */
function showSkillTooltip(node, event) {
    const tooltip = document.getElementById('skill-tooltip');
    if (!tooltip) return;

    const name = node.dataset.name;
    const flavor = node.dataset.flavor;
    const effect = node.dataset.effect;
    const education = node.dataset.education;
    const cost = node.dataset.cost;
    const requires = node.dataset.requires;
    const missing = node.dataset.missing;
    const purchased = node.classList.contains('purchased');
    const canBuy = node.classList.contains('available');
    const isLocked = node.classList.contains('locked');

    let statusHtml = '';
    if (purchased) {
        statusHtml = '<div class="tooltip-status owned">OWNED</div>';
    } else if (canBuy) {
        statusHtml = '<div class="tooltip-status available">CLICK TO PURCHASE</div>';
    } else if (isLocked) {
        statusHtml = `<div class="tooltip-status locked">LOCKED - REQUIRES: ${missing}</div>`;
    } else {
        statusHtml = '<div class="tooltip-status expensive">INSUFFICIENT FUNDS</div>';
    }

    // Show requirements section if there are any
    let requiresHtml = '';
    if (requires && !purchased) {
        requiresHtml = `
            <div class="tooltip-requires">
                <span class="tooltip-requires-label">REQUIRES:</span>
                <span class="tooltip-requires-text">${requires}</span>
            </div>
        `;
    }

    tooltip.innerHTML = `
        <div class="tooltip-header">
            <div class="tooltip-name">${name}</div>
            ${!purchased ? `<div class="tooltip-cost">$${cost}</div>` : ''}
        </div>
        <div class="tooltip-flavor">"${flavor}"</div>
        <div class="tooltip-effect">${effect}</div>
        ${requiresHtml}
        ${education ? `
            <div class="tooltip-education">
                <div class="tooltip-education-label">WHY THIS MATTERS:</div>
                <div class="tooltip-education-text">${education}</div>
            </div>
        ` : ''}
        ${statusHtml}
    `;

    tooltip.classList.remove('hidden');
    positionTooltip(event);
}

/**
 * Position tooltip near cursor
 */
function positionTooltip(event) {
    const tooltip = document.getElementById('skill-tooltip');
    if (!tooltip) return;

    const padding = 15;
    const tooltipRect = tooltip.getBoundingClientRect();

    let x = event.clientX + padding;
    let y = event.clientY + padding;

    // Keep tooltip on screen
    if (x + tooltipRect.width > window.innerWidth) {
        x = event.clientX - tooltipRect.width - padding;
    }
    if (y + tooltipRect.height > window.innerHeight) {
        y = event.clientY - tooltipRect.height - padding;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

/**
 * Hide skill tooltip
 */
function hideSkillTooltip() {
    const tooltip = document.getElementById('skill-tooltip');
    if (tooltip) {
        tooltip.classList.add('hidden');
    }
}

/**
 * Generate human-readable effect description
 */
function getEffectDescription(effect) {
    const parts = [];

    if (effect.maxHealthMult) {
        const bonus = Math.round((effect.maxHealthMult - 1) * 100);
        parts.push(`+${bonus}% Max Health`);
    }
    if (effect.regenRate) {
        parts.push(`+${effect.regenRate * 100}% Regen/sec`);
    }
    if (effect.scoreMult) {
        const bonus = Math.round((effect.scoreMult - 1) * 100);
        parts.push(`+${bonus}% Score`);
    }
    if (effect.damageReduction) {
        parts.push(`-${Math.round(effect.damageReduction * 100)}% Damage`);
    }
    if (effect.trollDamageReduction) {
        parts.push(`-${Math.round(effect.trollDamageReduction * 100)}% Troll Dmg`);
    }
    if (effect.scopeCreepDamageReduction) {
        parts.push(`-${Math.round(effect.scopeCreepDamageReduction * 100)}% Scope Creep Dmg`);
    }
    if (effect.drones) {
        parts.push(`+${effect.drones} Drone${effect.drones > 1 ? 's' : ''}`);
    }
    if (effect.droneDamageMult) {
        const bonus = Math.round((effect.droneDamageMult - 1) * 100);
        if (bonus > 0) parts.push(`+${bonus}% Drone Dmg`);
    }
    if (effect.droneFireRateMult) {
        const bonus = Math.round((effect.droneFireRateMult - 1) * 100);
        if (bonus > 0) parts.push(`+${bonus}% Drone Fire Rate`);
    }

    return parts.join(' • ') || 'No effect';
}

/**
 * Check if a specific upgrade ID is purchased (across all paths)
 */
function isUpgradePurchased(upgradeId) {
    for (const [pathKey, upgrades] of Object.entries(purchasedUpgrades)) {
        if (upgrades.includes(upgradeId)) return true;
    }
    return false;
}

/**
 * Check if requirements are met for an upgrade
 * requires format: [] = no deps, [['a','b']] = a AND b, [['a'],['b']] = a OR b
 * Returns { met: boolean, missing: string[] }
 */
function checkRequirements(upgrade) {
    if (!upgrade.requires || upgrade.requires.length === 0) {
        return { met: true, missing: [] };
    }

    // Each inner array is an AND group, outer array is OR between groups
    // e.g., [['a', 'b'], ['c']] means (a AND b) OR c
    for (const andGroup of upgrade.requires) {
        const allMet = andGroup.every(reqId => isUpgradePurchased(reqId));
        if (allMet) {
            return { met: true, missing: [] };
        }
    }

    // None of the OR groups were satisfied, find the missing ones from the first (preferred) group
    const missing = upgrade.requires[0].filter(reqId => !isUpgradePurchased(reqId));
    return { met: false, missing };
}

/**
 * Get upgrade name by ID (search all paths)
 */
function getUpgradeNameById(upgradeId) {
    for (const pathData of Object.values(UPGRADE_PATHS)) {
        const upgrade = pathData.upgrades.find(u => u.id === upgradeId);
        if (upgrade) return upgrade.name;
    }
    return upgradeId;
}

/**
 * Check if an upgrade can be purchased
 */
function canPurchaseUpgrade(pathKey, index, currentFunding) {
    const pathData = UPGRADE_PATHS[pathKey];
    if (!pathData) return false;

    const upgrade = pathData.upgrades[index];
    if (!upgrade) return false;

    // Already purchased?
    if (purchasedUpgrades[pathKey].includes(upgrade.id)) return false;

    // Can afford?
    if (currentFunding < upgrade.cost) return false;

    // Check cross-path requirements
    const reqCheck = checkRequirements(upgrade);
    if (!reqCheck.met) return false;

    return true;
}

/**
 * Purchase an upgrade
 */
function purchaseUpgrade(pathKey, index) {
    const pathData = UPGRADE_PATHS[pathKey];
    if (!pathData) return;

    const upgrade = pathData.upgrades[index];
    if (!upgrade) return;

    purchasedUpgrades[pathKey].push(upgrade.id);
    recalculateBonuses();

    // Show purchase notification
    showUpgradeNotification(upgrade, pathData);
}

/**
 * Show upgrade purchase notification
 */
function showUpgradeNotification(upgrade, pathData) {
    const notification = document.createElement('div');
    notification.className = 'upgrade-notification';
    notification.innerHTML = `
        <span class="upgrade-icon">${pathData.icon}</span>
        <span class="upgrade-name">${upgrade.name}</span>
        <span class="upgrade-flavor">"${upgrade.flavor}"</span>
    `;

    const container = document.getElementById('upgrade-notifications');
    if (container) {
        container.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

/**
 * Recalculate all bonuses from purchased upgrades
 */
function recalculateBonuses() {
    // Reset bonuses
    upgradeBonuses = {
        maxHealthMult: 1,
        regenRate: 0,
        scoreMult: 1,
        damageReduction: 0,
        trollDamageReduction: 0,
        scopeCreepDamageReduction: 0,
        drones: 0,
        droneDamageMult: 1,
        droneFireRateMult: 1
    };

    // Apply all purchased upgrades
    for (const [pathKey, upgrades] of Object.entries(purchasedUpgrades)) {
        const pathData = UPGRADE_PATHS[pathKey];
        if (!pathData) continue;

        for (const upgradeId of upgrades) {
            const upgrade = pathData.upgrades.find(u => u.id === upgradeId);
            if (!upgrade) continue;

            const effect = upgrade.effect;

            // Apply effects
            if (effect.maxHealthMult) upgradeBonuses.maxHealthMult *= effect.maxHealthMult;
            if (effect.regenRate) upgradeBonuses.regenRate += effect.regenRate;
            if (effect.scoreMult) upgradeBonuses.scoreMult *= effect.scoreMult;
            if (effect.damageReduction) upgradeBonuses.damageReduction += effect.damageReduction;
            if (effect.trollDamageReduction) upgradeBonuses.trollDamageReduction += effect.trollDamageReduction;
            if (effect.scopeCreepDamageReduction) upgradeBonuses.scopeCreepDamageReduction += effect.scopeCreepDamageReduction;
            if (effect.drones) upgradeBonuses.drones = effect.drones; // Set to latest value
            if (effect.droneDamageMult) upgradeBonuses.droneDamageMult *= effect.droneDamageMult;
            if (effect.droneFireRateMult) upgradeBonuses.droneFireRateMult *= effect.droneFireRateMult;
        }
    }
}

/**
 * Get current upgrade bonuses
 */
export function getUpgradeBonuses() {
    return { ...upgradeBonuses };
}

/**
 * Get number of drones from upgrades
 */
export function getDroneCount() {
    return upgradeBonuses.drones;
}

/**
 * Get score multiplier from upgrades
 */
export function getScoreMultiplier() {
    return upgradeBonuses.scoreMult;
}

/**
 * Get damage reduction (0-1)
 */
export function getDamageReduction(enemyType = null) {
    let reduction = upgradeBonuses.damageReduction;

    // Extra reduction for specific enemy types
    if (enemyType === 'troll') {
        reduction += upgradeBonuses.trollDamageReduction;
    } else if (enemyType === 'scopeCreep') {
        reduction += upgradeBonuses.scopeCreepDamageReduction;
    }

    return Math.min(0.75, reduction); // Cap at 75% reduction
}

/**
 * Get tower max health multiplier
 */
export function getTowerHealthMultiplier() {
    return upgradeBonuses.maxHealthMult;
}

/**
 * Get tower regen rate (% per second)
 */
export function getTowerRegenRate() {
    return upgradeBonuses.regenRate;
}

/**
 * Get drone damage multiplier
 */
export function getDroneDamageMultiplier() {
    return upgradeBonuses.droneDamageMult;
}

/**
 * Get drone fire rate multiplier
 */
export function getDroneFireRateMultiplier() {
    return upgradeBonuses.droneFireRateMult;
}

/**
 * Get purchased upgrades for display
 */
export function getPurchasedUpgrades() {
    return { ...purchasedUpgrades };
}

/**
 * Get total upgrades purchased
 */
export function getTotalUpgradesPurchased() {
    let total = 0;
    for (const upgrades of Object.values(purchasedUpgrades)) {
        total += upgrades.length;
    }
    return total;
}

/**
 * Check if a specific upgrade is purchased
 */
export function hasUpgrade(pathKey, upgradeId) {
    return purchasedUpgrades[pathKey] && purchasedUpgrades[pathKey].includes(upgradeId);
}

/**
 * Reset all upgrades (for new game)
 */
export function resetUpgrades() {
    initShop();
}
