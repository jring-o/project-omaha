import * as THREE from 'three';
import { CONFIG, gameState } from './config.js';
import { spawnObstaclesForSegment } from './obstacles.js';

// Segment pool - each segment can be reconfigured to any type
const segmentPool = [];
let activeSegments = [];
let furthestZ = 0;
let currentHeight = 0;  // Track current Y position for ramps
let lastSegmentType = 'straight';
let segmentsSpawned = 0;
let difficultyBudget = CONFIG.segments.difficultyBudget.initial;

// Materials (shared across segments for performance)
const materials = {
  ground: null,
  wall: null,
  ceiling: null,
  marker: null,
  beam: null,
  gapWarning: null,
};

// Geometry cache for procedural track segments
const geometryCache = {
  floor: {},
  leftWall: {},
  rightWall: {},
  initialized: false,
};

// ============================================
// PROCEDURAL GEOMETRY GENERATION FUNCTIONS
// ============================================

/**
 * Generate floor geometry with variable width along its length
 * @param {number} length - Segment length
 * @param {function} widthFunction - Function(t) returning width at position t (0-1)
 * @param {number} slices - Number of subdivisions along length
 * @returns {THREE.BufferGeometry}
 */
function generateFloorGeometry(length, widthFunction, slices = 12) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  // Generate vertices for top surface
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const z = (t - 0.5) * length; // -length/2 to +length/2
    const width = widthFunction(t);
    const halfWidth = width / 2;

    // Left edge vertex
    positions.push(-halfWidth, 0, z);
    normals.push(0, 1, 0);
    uvs.push(0, t);

    // Right edge vertex
    positions.push(halfWidth, 0, z);
    normals.push(0, 1, 0);
    uvs.push(1, t);
  }

  // Generate indices for top surface (two triangles per quad)
  for (let i = 0; i < slices; i++) {
    const a = i * 2;       // current left
    const b = i * 2 + 1;   // current right
    const c = (i + 1) * 2; // next left
    const d = (i + 1) * 2 + 1; // next right

    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  // Add bottom surface for proper appearance
  const bottomStart = positions.length / 3;
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const z = (t - 0.5) * length;
    const width = widthFunction(t);
    const halfWidth = width / 2;

    positions.push(-halfWidth, -0.5, z);
    normals.push(0, -1, 0);
    uvs.push(0, t);

    positions.push(halfWidth, -0.5, z);
    normals.push(0, -1, 0);
    uvs.push(1, t);
  }

  // Bottom surface indices (reversed winding)
  for (let i = 0; i < slices; i++) {
    const a = bottomStart + i * 2;
    const b = bottomStart + i * 2 + 1;
    const c = bottomStart + (i + 1) * 2;
    const d = bottomStart + (i + 1) * 2 + 1;

    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  // Add side faces (left and right edges)
  const leftSideStart = positions.length / 3;
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const z = (t - 0.5) * length;
    const width = widthFunction(t);
    const halfWidth = width / 2;

    // Left side - top vertex
    positions.push(-halfWidth, 0, z);
    normals.push(-1, 0, 0);
    uvs.push(t, 1);

    // Left side - bottom vertex
    positions.push(-halfWidth, -0.5, z);
    normals.push(-1, 0, 0);
    uvs.push(t, 0);
  }

  for (let i = 0; i < slices; i++) {
    const a = leftSideStart + i * 2;
    const b = leftSideStart + i * 2 + 1;
    const c = leftSideStart + (i + 1) * 2;
    const d = leftSideStart + (i + 1) * 2 + 1;

    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const rightSideStart = positions.length / 3;
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const z = (t - 0.5) * length;
    const width = widthFunction(t);
    const halfWidth = width / 2;

    // Right side - top vertex
    positions.push(halfWidth, 0, z);
    normals.push(1, 0, 0);
    uvs.push(t, 1);

    // Right side - bottom vertex
    positions.push(halfWidth, -0.5, z);
    normals.push(1, 0, 0);
    uvs.push(t, 0);
  }

  for (let i = 0; i < slices; i++) {
    const a = rightSideStart + i * 2;
    const b = rightSideStart + i * 2 + 1;
    const c = rightSideStart + (i + 1) * 2;
    const d = rightSideStart + (i + 1) * 2 + 1;

    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

/**
 * Generate wall geometry that follows a variable width track
 * @param {number} length - Segment length
 * @param {function} widthFunction - Function(t) returning track width at position t (0-1)
 * @param {number} wallHeight - Height of the wall
 * @param {string} side - 'left' or 'right'
 * @param {number} wallThickness - Thickness of the wall
 * @param {number} slices - Number of subdivisions along length
 * @returns {THREE.BufferGeometry}
 */
function generateWallGeometry(length, widthFunction, wallHeight, side, wallThickness = 0.5, slices = 12) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const sideMultiplier = side === 'left' ? -1 : 1;

  // Inner face (facing the track)
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const z = (t - 0.5) * length;
    const width = widthFunction(t);
    const innerX = (width / 2) * sideMultiplier;

    // Bottom vertex
    positions.push(innerX, -0.5, z);
    normals.push(-sideMultiplier, 0, 0);
    uvs.push(t, 0);

    // Top vertex
    positions.push(innerX, wallHeight, z);
    normals.push(-sideMultiplier, 0, 0);
    uvs.push(t, 1);
  }

  // Inner face indices
  for (let i = 0; i < slices; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;

    if (side === 'left') {
      indices.push(a, b, c);
      indices.push(b, d, c);
    } else {
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // Outer face (facing away from track)
  const outerStart = positions.length / 3;
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const z = (t - 0.5) * length;
    const width = widthFunction(t);
    const outerX = (width / 2 + wallThickness) * sideMultiplier;

    positions.push(outerX, -0.5, z);
    normals.push(sideMultiplier, 0, 0);
    uvs.push(t, 0);

    positions.push(outerX, wallHeight, z);
    normals.push(sideMultiplier, 0, 0);
    uvs.push(t, 1);
  }

  // Outer face indices (reversed winding)
  for (let i = 0; i < slices; i++) {
    const a = outerStart + i * 2;
    const b = outerStart + i * 2 + 1;
    const c = outerStart + (i + 1) * 2;
    const d = outerStart + (i + 1) * 2 + 1;

    if (side === 'left') {
      indices.push(a, c, b);
      indices.push(b, c, d);
    } else {
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Top face
  const topStart = positions.length / 3;
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const z = (t - 0.5) * length;
    const width = widthFunction(t);
    const innerX = (width / 2) * sideMultiplier;
    const outerX = (width / 2 + wallThickness) * sideMultiplier;

    positions.push(innerX, wallHeight, z);
    normals.push(0, 1, 0);
    uvs.push(0, t);

    positions.push(outerX, wallHeight, z);
    normals.push(0, 1, 0);
    uvs.push(1, t);
  }

  for (let i = 0; i < slices; i++) {
    const a = topStart + i * 2;
    const b = topStart + i * 2 + 1;
    const c = topStart + (i + 1) * 2;
    const d = topStart + (i + 1) * 2 + 1;

    if (side === 'left') {
      indices.push(a, b, c);
      indices.push(b, d, c);
    } else {
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

/**
 * Initialize the geometry cache with all width profiles
 */
function initGeometryCache() {
  if (geometryCache.initialized) return;

  const { segmentLength, segmentWidth } = CONFIG.track;
  const wallHeight = 1.5;
  const wallThickness = 0.5;
  const slices = 16; // More slices = smoother transitions

  const narrowFactor = CONFIG.segments.types.narrow?.narrowFactor || 0.33;
  const narrowWidth = segmentWidth * narrowFactor;

  const wideFactor = CONFIG.segments.types.wide?.narrowFactor || 1.67;
  const wideWidth = segmentWidth * wideFactor;

  // Define width profiles for all combinations
  const widthProfiles = {
    // Full width throughout (3 lanes)
    full: () => segmentWidth,

    // === NARROW PROFILES ===
    // Standalone narrow: taper in AND out (used when surrounded by non-narrow)
    narrowTaperBoth: (t) => {
      if (t < 0.2) return THREE.MathUtils.lerp(segmentWidth, narrowWidth, t / 0.2);
      if (t > 0.8) return THREE.MathUtils.lerp(narrowWidth, segmentWidth, (t - 0.8) / 0.2);
      return narrowWidth;
    },
    // Start of narrow run: taper in only (non-narrow before, narrow after)
    narrowTaperIn: (t) => {
      if (t < 0.2) return THREE.MathUtils.lerp(segmentWidth, narrowWidth, t / 0.2);
      return narrowWidth;
    },
    // End of narrow run: taper out only (narrow before, non-narrow after)
    narrowTaperOut: (t) => {
      if (t > 0.8) return THREE.MathUtils.lerp(narrowWidth, segmentWidth, (t - 0.8) / 0.2);
      return narrowWidth;
    },
    // Middle of narrow run: constant narrow (narrow before AND after)
    narrowFlat: () => narrowWidth,

    // === WIDE PROFILES ===
    // Standalone wide: taper in AND out
    wideTaperBoth: (t) => {
      if (t < 0.2) return THREE.MathUtils.lerp(segmentWidth, wideWidth, t / 0.2);
      if (t > 0.8) return THREE.MathUtils.lerp(wideWidth, segmentWidth, (t - 0.8) / 0.2);
      return wideWidth;
    },
    // Start of wide run: taper in only
    wideTaperIn: (t) => {
      if (t < 0.2) return THREE.MathUtils.lerp(segmentWidth, wideWidth, t / 0.2);
      return wideWidth;
    },
    // End of wide run: taper out only
    wideTaperOut: (t) => {
      if (t > 0.8) return THREE.MathUtils.lerp(wideWidth, segmentWidth, (t - 0.8) / 0.2);
      return wideWidth;
    },
    // Middle of wide run: constant wide
    wideFlat: () => wideWidth,
  };

  // Generate geometries for each profile
  for (const [profileName, widthFn] of Object.entries(widthProfiles)) {
    geometryCache.floor[profileName] = generateFloorGeometry(
      segmentLength, widthFn, slices
    );
    geometryCache.leftWall[profileName] = generateWallGeometry(
      segmentLength, widthFn, wallHeight, 'left', wallThickness, slices
    );
    geometryCache.rightWall[profileName] = generateWallGeometry(
      segmentLength, widthFn, wallHeight, 'right', wallThickness, slices
    );
  }

  geometryCache.initialized = true;
  console.log('Geometry cache initialized with profiles:', Object.keys(widthProfiles));
}

export function initTrack(scene) {
  // Initialize shared materials
  initMaterials();

  // Initialize procedural geometry cache
  initGeometryCache();

  const { poolSize } = CONFIG.track;

  // Create segment pool - each is a configurable group
  for (let i = 0; i < poolSize; i++) {
    const segment = createBaseSegment();
    segment.visible = false;
    scene.add(segment);
    segmentPool.push(segment);
  }

  // Initialize visible segments
  resetTrack();
}

function initMaterials() {
  materials.ground = new THREE.MeshStandardMaterial({
    color: CONFIG.visuals.groundColor,
    roughness: 0.8,
    metalness: 0.2,
  });

  materials.wall = new THREE.MeshStandardMaterial({
    color: CONFIG.visuals.sideColor,
    roughness: 0.6,
  });

  materials.ceiling = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.9,
    metalness: 0.1,
  });

  materials.marker = new THREE.MeshStandardMaterial({
    color: 0x95a5a6,
    roughness: 0.5,
  });

  materials.beam = new THREE.MeshStandardMaterial({
    color: 0x34495e,
    roughness: 0.7,
  });

  materials.gapWarning = new THREE.MeshStandardMaterial({
    color: 0xf39c12,
    roughness: 0.5,
    emissive: 0xf39c12,
    emissiveIntensity: 0.3,
  });

  // Note: narrowWall material removed - narrow segments now use tapered wall geometry
}

function createBaseSegment() {
  const group = new THREE.Group();
  const { segmentLength, segmentWidth } = CONFIG.track;

  // Ground - uses procedural geometry from cache (swapped based on segment type)
  // Procedural geometry has top at y=0, bottom at y=-0.5 (no position offset needed)
  const ground = new THREE.Mesh(geometryCache.floor.full, materials.ground);
  ground.name = 'ground';
  ground.receiveShadow = true;
  group.add(ground);

  // For gap segments - create separate ground pieces (still use BoxGeometry for gaps)
  const groundBeforeGap = new THREE.Mesh(
    new THREE.BoxGeometry(segmentWidth, 0.5, segmentLength * 0.3),
    materials.ground
  );
  groundBeforeGap.name = 'groundBefore';
  groundBeforeGap.visible = false;
  groundBeforeGap.receiveShadow = true;
  group.add(groundBeforeGap);

  const groundAfterGap = new THREE.Mesh(
    new THREE.BoxGeometry(segmentWidth, 0.5, segmentLength * 0.3),
    materials.ground
  );
  groundAfterGap.name = 'groundAfter';
  groundAfterGap.visible = false;
  groundAfterGap.receiveShadow = true;
  group.add(groundAfterGap);

  // Warning strip before gap
  const warningStrip = new THREE.Mesh(
    new THREE.BoxGeometry(segmentWidth, 0.1, 1),
    materials.gapWarning
  );
  warningStrip.name = 'warningStrip';
  warningStrip.visible = false;
  group.add(warningStrip);

  // Lane markers - standard 3-lane markers (between lanes at -1.5 and 1.5)
  const markerGeometry = new THREE.BoxGeometry(0.1, 0.05, segmentLength);

  const leftMarker = new THREE.Mesh(markerGeometry, materials.marker);
  leftMarker.name = 'leftMarker';
  leftMarker.position.set(-1.5, 0.03, 0);
  group.add(leftMarker);

  const rightMarker = new THREE.Mesh(markerGeometry, materials.marker);
  rightMarker.name = 'rightMarker';
  rightMarker.position.set(1.5, 0.03, 0);
  group.add(rightMarker);

  // Extra lane markers for 5-lane (wide) segments
  // For 5 lanes at [-6, -3, 0, 3, 6], markers go between each pair: -4.5, -1.5, 1.5, 4.5
  const farLeftMarker = new THREE.Mesh(markerGeometry, materials.marker);
  farLeftMarker.name = 'farLeftMarker';
  farLeftMarker.position.set(-4.5, 0.03, 0);
  farLeftMarker.visible = false;  // Only shown on wide segments
  group.add(farLeftMarker);

  const farRightMarker = new THREE.Mesh(markerGeometry, materials.marker);
  farRightMarker.name = 'farRightMarker';
  farRightMarker.position.set(4.5, 0.03, 0);
  farRightMarker.visible = false;  // Only shown on wide segments
  group.add(farRightMarker);

  // Side walls - use procedural geometry from cache (swapped based on segment type)
  // Procedural geometry has bottom at y=-0.5 to match floor (no position offset needed)
  const leftWall = new THREE.Mesh(geometryCache.leftWall.full, materials.wall);
  leftWall.name = 'leftWall';
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(geometryCache.rightWall.full, materials.wall);
  rightWall.name = 'rightWall';
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Ceiling (for tunnels) - still uses BoxGeometry
  const ceilingGeometry = new THREE.BoxGeometry(segmentWidth + 1, 0.5, segmentLength);
  const ceiling = new THREE.Mesh(ceilingGeometry, materials.ceiling);
  ceiling.name = 'ceiling';
  ceiling.position.y = 4;
  ceiling.visible = false;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // Ceiling side panels (for tunnel enclosure)
  const ceilingSideGeometry = new THREE.BoxGeometry(0.5, 3, segmentLength);

  const leftCeilingSide = new THREE.Mesh(ceilingSideGeometry, materials.ceiling);
  leftCeilingSide.name = 'leftCeilingSide';
  leftCeilingSide.position.set(-segmentWidth / 2 - 0.25, 2.5, 0);
  leftCeilingSide.visible = false;
  group.add(leftCeilingSide);

  const rightCeilingSide = new THREE.Mesh(ceilingSideGeometry, materials.ceiling);
  rightCeilingSide.name = 'rightCeilingSide';
  rightCeilingSide.position.set(segmentWidth / 2 + 0.25, 2.5, 0);
  rightCeilingSide.visible = false;
  group.add(rightCeilingSide);

  // NOTE: Removed old narrow wall barriers (red obstacles)
  // Narrow segments now use actual wall geometry that tapers in

  // Store segment metadata
  group.userData = {
    type: 'straight',
    length: segmentLength,
    height: 0,
    rampAngle: 0,
    hasGap: false,
    hasCeiling: false,
    narrowFactor: 1,
    widthProfile: 'full', // Track current geometry profile
  };

  return group;
}

/**
 * Update the previous segment's geometry to remove its taper-out
 * Called when consecutive narrow or wide segments are detected
 */
function updatePreviousSegmentTaper(type) {
  // The previous segment is the last one in activeSegments
  const prevSegment = activeSegments[activeSegments.length - 1];
  if (!prevSegment) return;

  const currentProfile = prevSegment.userData.widthProfile;
  let newProfile = currentProfile;

  if (type === 'narrow') {
    // TaperBoth → TaperIn (remove taper out, keep taper in)
    if (currentProfile === 'narrowTaperBoth') newProfile = 'narrowTaperIn';
    // TaperOut → Flat (remove taper out, was already no taper in)
    if (currentProfile === 'narrowTaperOut') newProfile = 'narrowFlat';
  } else if (type === 'wide') {
    if (currentProfile === 'wideTaperBoth') newProfile = 'wideTaperIn';
    if (currentProfile === 'wideTaperOut') newProfile = 'wideFlat';
  }

  if (newProfile !== currentProfile) {
    const ground = prevSegment.getObjectByName('ground');
    const leftWall = prevSegment.getObjectByName('leftWall');
    const rightWall = prevSegment.getObjectByName('rightWall');

    ground.geometry = geometryCache.floor[newProfile];
    leftWall.geometry = geometryCache.leftWall[newProfile];
    rightWall.geometry = geometryCache.rightWall[newProfile];
    prevSegment.userData.widthProfile = newProfile;
  }
}

function configureSegment(segment, typeName, startHeight) {
  const typeConfig = CONFIG.segments.types[typeName];
  const { segmentLength, segmentWidth } = CONFIG.track;

  // Reset all optional elements to hidden
  segment.getObjectByName('ceiling').visible = false;
  segment.getObjectByName('leftCeilingSide').visible = false;
  segment.getObjectByName('rightCeilingSide').visible = false;
  segment.getObjectByName('groundBefore').visible = false;
  segment.getObjectByName('groundAfter').visible = false;
  segment.getObjectByName('warningStrip').visible = false;

  const ground = segment.getObjectByName('ground');
  const leftWall = segment.getObjectByName('leftWall');
  const rightWall = segment.getObjectByName('rightWall');
  const leftMarker = segment.getObjectByName('leftMarker');
  const rightMarker = segment.getObjectByName('rightMarker');

  // Reset rotation
  segment.rotation.set(0, 0, 0);
  ground.visible = true;
  leftWall.visible = true;
  rightWall.visible = true;

  // Determine width profile based on narrowFactor AND previous segment
  const isNarrow = typeConfig.narrowFactor < 1;
  const isWide = typeConfig.narrowFactor > 1;
  const prevConfig = CONFIG.segments.types[lastSegmentType];
  const prevIsNarrow = prevConfig?.narrowFactor < 1;
  const prevIsWide = prevConfig?.narrowFactor > 1;

  let widthProfile = 'full';

  if (isNarrow) {
    if (prevIsNarrow) {
      // Narrow follows narrow - no taper in, assume taper out (may be updated later)
      widthProfile = 'narrowTaperOut';
      // Update previous segment to remove its taper out
      updatePreviousSegmentTaper('narrow');
    } else {
      // Narrow follows non-narrow - taper in, assume taper out
      widthProfile = 'narrowTaperBoth';
    }
  } else if (isWide) {
    if (prevIsWide) {
      // Wide follows wide - no taper in, assume taper out
      widthProfile = 'wideTaperOut';
      // Update previous segment to remove its taper out
      updatePreviousSegmentTaper('wide');
    } else {
      // Wide follows non-wide - taper in, assume taper out
      widthProfile = 'wideTaperBoth';
    }
  }

  // Swap to appropriate geometry based on width profile
  if (segment.userData.widthProfile !== widthProfile) {
    ground.geometry = geometryCache.floor[widthProfile];
    leftWall.geometry = geometryCache.leftWall[widthProfile];
    rightWall.geometry = geometryCache.rightWall[widthProfile];
    segment.userData.widthProfile = widthProfile;
  }

  // Handle lane markers based on segment type
  const farLeftMarker = segment.getObjectByName('farLeftMarker');
  const farRightMarker = segment.getObjectByName('farRightMarker');

  if (typeConfig.narrowFactor < 1) {
    // Narrow segments - hide all markers
    leftMarker.visible = false;
    rightMarker.visible = false;
    farLeftMarker.visible = false;
    farRightMarker.visible = false;
  } else if (typeConfig.narrowFactor > 1) {
    // Wide segments - show all 4 markers
    leftMarker.visible = true;
    rightMarker.visible = true;
    farLeftMarker.visible = true;
    farRightMarker.visible = true;
  } else {
    // Standard segments - show only inner 2 markers
    leftMarker.visible = true;
    rightMarker.visible = true;
    farLeftMarker.visible = false;
    farRightMarker.visible = false;
  }

  // Calculate end height based on ramp angle
  const rampRadians = THREE.MathUtils.degToRad(typeConfig.rampAngle);
  const heightChange = Math.tan(rampRadians) * segmentLength;
  const endHeight = startHeight + heightChange;
  const midHeight = startHeight + heightChange / 2;

  // Apply ramp rotation
  if (typeConfig.rampAngle !== 0) {
    segment.rotation.x = -rampRadians;
  }

  // Handle gap segments
  if (typeConfig.hasGap) {
    ground.visible = false;
    leftWall.visible = false;
    rightWall.visible = false;
    leftMarker.visible = false;
    rightMarker.visible = false;

    const gapStart = typeConfig.gapStart;
    const gapLength = typeConfig.gapLength;

    // Ground before gap
    const groundBefore = segment.getObjectByName('groundBefore');
    groundBefore.visible = true;
    groundBefore.scale.z = gapStart;
    groundBefore.position.z = -segmentLength / 2 + (segmentLength * gapStart) / 2;
    groundBefore.position.y = -0.25;

    // Ground after gap
    const groundAfter = segment.getObjectByName('groundAfter');
    const afterLength = 1 - gapStart - gapLength;
    groundAfter.visible = true;
    groundAfter.scale.z = afterLength;
    groundAfter.position.z = segmentLength / 2 - (segmentLength * afterLength) / 2;
    groundAfter.position.y = -0.25;

    // Warning strip
    const warningStrip = segment.getObjectByName('warningStrip');
    warningStrip.visible = true;
    warningStrip.position.z = -segmentLength / 2 + segmentLength * gapStart - 0.5;
    warningStrip.position.y = 0.05;
  } else if (!typeConfig.narrowFactor || typeConfig.narrowFactor >= 1) {
    // Only show markers for non-gap, non-narrow segments
    leftMarker.visible = true;
    rightMarker.visible = true;
  }

  // Handle tunnel segments
  if (typeConfig.hasCeiling) {
    const ceiling = segment.getObjectByName('ceiling');
    ceiling.visible = true;
    ceiling.position.y = typeConfig.ceilingHeight;

    const leftCeilingSide = segment.getObjectByName('leftCeilingSide');
    const rightCeilingSide = segment.getObjectByName('rightCeilingSide');
    leftCeilingSide.visible = true;
    rightCeilingSide.visible = true;
    leftCeilingSide.position.y = typeConfig.ceilingHeight / 2 + 1;
    rightCeilingSide.position.y = typeConfig.ceilingHeight / 2 + 1;
  }

  // Update metadata
  segment.userData = {
    type: typeName,
    length: segmentLength,
    startHeight: startHeight,
    endHeight: endHeight,
    midHeight: midHeight,
    rampAngle: typeConfig.rampAngle,
    hasGap: typeConfig.hasGap,
    hasCeiling: typeConfig.hasCeiling,
    narrowFactor: typeConfig.narrowFactor,
    laneCount: typeConfig.laneCount,  // Dynamic lane count for this segment
    gapStart: typeConfig.gapStart,
    gapLength: typeConfig.gapLength,
    widthProfile: widthProfile, // Track geometry profile for efficient swapping
  };

  return endHeight;
}

function selectNextSegmentType() {
  const types = CONFIG.segments.types;
  const allowedTypes = types[lastSegmentType].allowedNext;

  // Force straight segments at start
  if (segmentsSpawned < CONFIG.segments.initialStraightCount) {
    return 'straight';
  }

  // Filter by difficulty budget
  const affordableTypes = allowedTypes.filter(
    (typeName) => types[typeName].difficulty <= difficultyBudget
  );

  if (affordableTypes.length === 0) {
    return 'straight';
  }

  // Weighted random selection - use selfWeight if following same type
  const getWeight = (typeName) => {
    const typeConfig = types[typeName];
    // If this type follows itself and has a selfWeight, use it
    if (typeName === lastSegmentType && typeConfig.selfWeight) {
      return typeConfig.selfWeight;
    }
    return typeConfig.weight;
  };

  const totalWeight = affordableTypes.reduce(
    (sum, typeName) => sum + getWeight(typeName),
    0
  );

  let random = Math.random() * totalWeight;
  for (const typeName of affordableTypes) {
    random -= getWeight(typeName);
    if (random <= 0) {
      // Spend difficulty budget
      difficultyBudget -= types[typeName].difficulty;
      return typeName;
    }
  }

  return 'straight';
}

function getSegmentFromPool() {
  for (const segment of segmentPool) {
    if (!segment.visible) {
      segment.visible = true;
      return segment;
    }
  }
  return null;
}

export function resetTrack() {
  // Return all active segments to pool
  for (const segment of activeSegments) {
    segment.visible = false;
  }
  activeSegments = [];

  // Reset tracking variables
  const { segmentLength, visibleSegments } = CONFIG.track;
  furthestZ = 0;
  currentHeight = 0;
  lastSegmentType = 'straight';
  segmentsSpawned = 0;
  difficultyBudget = CONFIG.segments.difficultyBudget.initial;

  // Place initial segments
  for (let i = 0; i < visibleSegments; i++) {
    const segment = getSegmentFromPool();
    if (segment) {
      const typeName = selectNextSegmentType();
      currentHeight = configureSegment(segment, typeName, currentHeight);

      segment.position.z = furthestZ + segmentLength / 2;
      segment.position.y = segment.userData.midHeight;

      furthestZ += segmentLength;
      lastSegmentType = typeName;
      segmentsSpawned++;
      activeSegments.push(segment);

      // Spawn obstacles for this segment (skip first few for safe start)
      if (i >= 2) {
        spawnObstaclesForSegment(segment);
      }
    }
  }
}

export function updateTrack(delta) {
  if (!gameState.isRunning) return;

  const moveAmount = gameState.speed * delta;
  const { segmentLength } = CONFIG.track;

  // Move all segments toward the camera
  for (const segment of activeSegments) {
    segment.position.z -= moveAmount;
  }

  // Track distance traveled
  gameState.distance += moveAmount;
  furthestZ -= moveAmount;

  // Regenerate difficulty budget over time
  const budgetConfig = CONFIG.segments.difficultyBudget;
  difficultyBudget += budgetConfig.regenRate * delta;
  difficultyBudget += gameState.distance * budgetConfig.distanceScale * delta;
  difficultyBudget = Math.min(difficultyBudget, budgetConfig.max);

  // Recycle segments that have passed behind the camera
  const recycleThreshold = -segmentLength;
  const segmentsToRecycle = [];

  for (const segment of activeSegments) {
    if (segment.position.z < recycleThreshold) {
      segmentsToRecycle.push(segment);
    }
  }

  for (const segment of segmentsToRecycle) {
    // Remove from active list
    const index = activeSegments.indexOf(segment);
    if (index > -1) {
      activeSegments.splice(index, 1);
    }

    // Configure as new segment type
    const typeName = selectNextSegmentType();
    currentHeight = configureSegment(segment, typeName, currentHeight);

    // Position at front
    segment.position.z = furthestZ + segmentLength / 2;
    segment.position.y = segment.userData.midHeight;
    furthestZ += segmentLength;

    lastSegmentType = typeName;
    segmentsSpawned++;
    activeSegments.push(segment);

    // Spawn obstacles for this newly recycled segment
    spawnObstaclesForSegment(segment);
  }
}

export function getFurthestZ() {
  return furthestZ;
}

export function getActiveSegments() {
  return activeSegments;
}

// Get the height of the track at a given Z position
export function getTrackHeightAt(z) {
  for (const segment of activeSegments) {
    const segmentStart = segment.position.z - CONFIG.track.segmentLength / 2;
    const segmentEnd = segment.position.z + CONFIG.track.segmentLength / 2;

    if (z >= segmentStart && z <= segmentEnd) {
      // Interpolate height within segment
      const t = (z - segmentStart) / CONFIG.track.segmentLength;
      return THREE.MathUtils.lerp(
        segment.userData.startHeight,
        segment.userData.endHeight,
        t
      );
    }
  }
  return 0;
}

// Check if player is over a gap at given Z position
export function isOverGap(z) {
  for (const segment of activeSegments) {
    if (!segment.userData.hasGap) continue;

    const segmentStart = segment.position.z - CONFIG.track.segmentLength / 2;
    const segmentLength = CONFIG.track.segmentLength;
    const gapStartZ = segmentStart + segmentLength * segment.userData.gapStart;
    const gapEndZ = gapStartZ + segmentLength * segment.userData.gapLength;

    if (z >= gapStartZ && z <= gapEndZ) {
      return true;
    }
  }
  return false;
}

// Get current segment type at player position
export function getCurrentSegmentType(z) {
  for (const segment of activeSegments) {
    const segmentStart = segment.position.z - CONFIG.track.segmentLength / 2;
    const segmentEnd = segment.position.z + CONFIG.track.segmentLength / 2;

    if (z >= segmentStart && z <= segmentEnd) {
      return segment.userData.type;
    }
  }
  return 'straight';
}

// Get narrow factor at position (for adjusting lane positions)
export function getNarrowFactorAt(z) {
  for (const segment of activeSegments) {
    const segmentStart = segment.position.z - CONFIG.track.segmentLength / 2;
    const segmentEnd = segment.position.z + CONFIG.track.segmentLength / 2;

    if (z >= segmentStart && z <= segmentEnd) {
      return segment.userData.narrowFactor;
    }
  }
  return 1;
}

// Get lane information at position (for dynamic lane system)
export function getLaneInfoAt(z) {
  const { spacing } = CONFIG.lanes;

  // Helper to compute lane positions from count
  const computePositions = (count) => {
    const positions = [];
    const halfCount = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      positions.push((i - halfCount) * spacing);
    }
    return positions;
  };

  // Find the segment containing z, or track furthest segment for extrapolation
  let furthestSegment = null;
  let furthestZ = -Infinity;

  for (const segment of activeSegments) {
    const segmentStart = segment.position.z - CONFIG.track.segmentLength / 2;
    const segmentEnd = segment.position.z + CONFIG.track.segmentLength / 2;

    // Track furthest segment for extrapolation
    if (segmentEnd > furthestZ) {
      furthestZ = segmentEnd;
      furthestSegment = segment;
    }

    if (z >= segmentStart && z <= segmentEnd) {
      let laneCount = segment.userData.laneCount || 3;

      // Check if we're in a taper transition zone based on the geometry profile
      // During taper zones, use standard 3 lanes since the track is transitioning
      const segmentLength = CONFIG.track.segmentLength;
      const t = (z - segmentStart) / segmentLength;  // 0 to 1 within segment
      const profile = segment.userData.widthProfile || 'full';

      // Determine if we're in a taper zone based on profile type
      let inTaperZone = false;
      if (profile === 'narrowTaperBoth' || profile === 'wideTaperBoth') {
        // Both ends taper
        inTaperZone = t < 0.2 || t > 0.8;
      } else if (profile === 'narrowTaperIn' || profile === 'wideTaperIn') {
        // Only start tapers
        inTaperZone = t < 0.2;
      } else if (profile === 'narrowTaperOut' || profile === 'wideTaperOut') {
        // Only end tapers
        inTaperZone = t > 0.8;
      }
      // For 'full', 'narrowFlat', 'wideFlat': no taper zones

      // Use standard 3 lanes during taper zones
      if (inTaperZone && laneCount !== 3) {
        laneCount = 3;
      }

      return {
        laneCount,
        lanePositions: computePositions(laneCount),
        narrowFactor: segment.userData.narrowFactor,
      };
    }
  }

  // Position is beyond all active segments - use furthest segment's lane info
  // This ensures obstacles spawned ahead use the correct lane configuration
  // (e.g., 5 lanes if track is currently wide)
  if (furthestSegment && z > furthestZ) {
    // Use the furthest segment's lane count directly
    // Since obstacles dynamically reposition when they reach actual track,
    // we can be optimistic about lane count - invalid lanes get filtered out
    const laneCount = furthestSegment.userData.laneCount || 3;

    return {
      laneCount,
      lanePositions: computePositions(laneCount),
      narrowFactor: furthestSegment.userData.narrowFactor,
    };
  }

  // Default to 3 lanes (only if no segments exist)
  return {
    laneCount: 3,
    lanePositions: CONFIG.lanes.positions,
    narrowFactor: 1,
  };
}

// Get ceiling height at position (for camera adjustment in tunnels)
// Returns Infinity if no ceiling, otherwise returns the ceiling Y position
export function getCeilingHeightAt(z) {
  for (const segment of activeSegments) {
    const segmentStart = segment.position.z - CONFIG.track.segmentLength / 2;
    const segmentEnd = segment.position.z + CONFIG.track.segmentLength / 2;

    if (z >= segmentStart && z <= segmentEnd) {
      if (segment.userData.hasCeiling) {
        // Return ceiling height relative to track height at this position
        const t = (z - segmentStart) / CONFIG.track.segmentLength;
        const trackHeight = THREE.MathUtils.lerp(
          segment.userData.startHeight,
          segment.userData.endHeight,
          t
        );
        // Ceiling height is relative to the track surface
        return trackHeight + CONFIG.segments.types.tunnel.ceilingHeight;
      }
      return Infinity;
    }
  }
  return Infinity;
}
