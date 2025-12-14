/**
 * TOWER DEFENDER 2347 - Services Module
 * Manages the services panel that shows what depends on the tower
 */

import { SERVICES } from './config.js';

// Service state
const serviceStates = {};
let fallingServices = [];
let lastTowerHealth = 100;

/**
 * Initialize services
 */
export function initServices() {
    SERVICES.forEach(service => {
        serviceStates[service.id] = {
            status: 'online', // online, degraded, failed
            health: 100
        };
    });
    lastTowerHealth = 100;
    fallingServices = [];
    updateServicesDisplay();
}

/**
 * Update services based on tower health
 */
export function updateServices(towerHealth) {
    // Calculate how many services should be affected
    const healthDrop = lastTowerHealth - towerHealth;

    if (healthDrop > 0) {
        // Degrade random services based on tower damage
        degradeRandomServices(towerHealth);
    }

    lastTowerHealth = towerHealth;
    updateServicesDisplay();
}

/**
 * Degrade random services based on tower health
 */
function degradeRandomServices(towerHealth) {
    const onlineServices = SERVICES.filter(s => serviceStates[s.id].status === 'online');
    const degradedServices = SERVICES.filter(s => serviceStates[s.id].status === 'degraded');

    // Calculate target number of failed/degraded services based on health
    const targetFailed = Math.floor((100 - towerHealth) / 10); // 1 failed per 10% damage
    const targetDegraded = Math.floor((100 - towerHealth) / 5); // 1 degraded per 5% damage

    const currentFailed = SERVICES.filter(s => serviceStates[s.id].status === 'failed').length;
    const currentDegraded = degradedServices.length;

    // Fail degraded services first
    if (currentFailed < targetFailed && degradedServices.length > 0) {
        const toFail = degradedServices[Math.floor(Math.random() * degradedServices.length)];
        failService(toFail.id);
    }

    // Degrade online services
    if (currentDegraded < targetDegraded && onlineServices.length > 0) {
        const toDegrade = onlineServices[Math.floor(Math.random() * onlineServices.length)];
        degradeService(toDegrade.id);
    }
}

/**
 * Degrade a service
 */
function degradeService(serviceId) {
    if (serviceStates[serviceId].status === 'online') {
        serviceStates[serviceId].status = 'degraded';
        showServiceWarning(serviceId, 'degraded');
    }
}

/**
 * Fail a service
 */
function failService(serviceId) {
    if (serviceStates[serviceId].status !== 'failed') {
        serviceStates[serviceId].status = 'failed';
        showServiceWarning(serviceId, 'failed');
        triggerServiceFall(serviceId);
    }
}

/**
 * Show service warning notification
 */
function showServiceWarning(serviceId, status) {
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    const notification = document.createElement('div');
    notification.className = `service-notification ${status}`;
    notification.innerHTML = `
        <span class="service-icon">${service.icon}</span>
        <span class="service-message">${status === 'failed' ? service.failMessage : service.name + ' UNSTABLE'}</span>
    `;

    const container = document.getElementById('service-notifications');
    if (container) {
        container.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }
}

/**
 * Trigger falling animation for a failed service
 */
function triggerServiceFall(serviceId) {
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    // Create falling element
    const fallingEl = document.createElement('div');
    fallingEl.className = 'falling-service';
    fallingEl.innerHTML = `<span class="falling-icon">${service.icon}</span>`;
    fallingEl.style.left = `${Math.random() * 60 + 20}%`;
    fallingEl.style.top = '0';

    const container = document.getElementById('falling-services-container');
    if (container) {
        container.appendChild(fallingEl);

        // Animate falling
        requestAnimationFrame(() => {
            fallingEl.classList.add('falling');
        });

        // Remove after animation
        setTimeout(() => fallingEl.remove(), 3000);
    }
}

/**
 * Update the services display (compact cockpit grid)
 */
function updateServicesDisplay() {
    const compactGrid = document.getElementById('services-grid-compact');
    if (compactGrid) {
        let html = '';
        SERVICES.forEach(service => {
            const state = serviceStates[service.id];
            html += `<div class="svc-icon ${state.status}" title="${service.name}">${service.icon}</div>`;
        });
        compactGrid.innerHTML = html;
    }
}

/**
 * Reset all services to online
 */
export function resetServices() {
    SERVICES.forEach(service => {
        serviceStates[service.id] = {
            status: 'online',
            health: 100
        };
    });
    lastTowerHealth = 100;
    fallingServices = [];
    updateServicesDisplay();
}

/**
 * Get service states
 */
export function getServiceStates() {
    return serviceStates;
}

/**
 * Get count of services by status
 */
export function getServiceCounts() {
    let online = 0, degraded = 0, failed = 0;

    Object.values(serviceStates).forEach(state => {
        if (state.status === 'online') online++;
        else if (state.status === 'degraded') degraded++;
        else failed++;
    });

    return { online, degraded, failed, total: SERVICES.length };
}

/**
 * Force fail a specific number of services (for boss attacks)
 */
export function forceFailServices(count) {
    const available = SERVICES.filter(s => serviceStates[s.id].status !== 'failed');
    const toFail = available.slice(0, count);

    toFail.forEach(service => {
        failService(service.id);
    });
}

/**
 * Restore a random failed service
 */
export function restoreRandomService() {
    const failed = SERVICES.filter(s => serviceStates[s.id].status === 'failed');
    if (failed.length > 0) {
        const toRestore = failed[Math.floor(Math.random() * failed.length)];
        serviceStates[toRestore.id].status = 'degraded';
        updateServicesDisplay();

        // Show restoration notification
        const notification = document.createElement('div');
        notification.className = 'service-notification restored';
        notification.innerHTML = `
            <span class="service-icon">${toRestore.icon}</span>
            <span class="service-message">${toRestore.name} RESTORED</span>
        `;

        const container = document.getElementById('service-notifications');
        if (container) {
            container.appendChild(notification);
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }, 2000);
        }
    }
}
