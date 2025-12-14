import * as THREE from 'three';
import { CONFIG } from './config.js';

let scene, camera, renderer;

export function initScene(container) {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.visuals.backgroundColor);
  scene.fog = new THREE.Fog(
    CONFIG.visuals.fogColor,
    CONFIG.visuals.fogNear,
    CONFIG.visuals.fogFar
  );

  // Create camera
  camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  camera.position.set(
    CONFIG.camera.position.x,
    CONFIG.camera.position.y,
    CONFIG.camera.position.z
  );
  camera.lookAt(
    CONFIG.camera.lookAt.x,
    CONFIG.camera.lookAt.y,
    CONFIG.camera.lookAt.z
  );

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Add lighting
  setupLighting();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  return { scene, camera, renderer };
}

function setupLighting() {
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Hemisphere light for sky/ground color blending
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x2d3436, 0.5);
  scene.add(hemiLight);

  // Main directional light (sun)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  scene.add(dirLight);

  // Secondary directional light for fill
  const fillLight = new THREE.DirectionalLight(0x4ecdc4, 0.3);
  fillLight.position.set(-10, 10, -10);
  scene.add(fillLight);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function render() {
  renderer.render(scene, camera);
}

export function updateCamera(targetY, ceilingHeight = Infinity) {
  // Calculate ideal camera Y based on track height
  let targetCameraY = CONFIG.camera.position.y + targetY;
  let targetLookAtY = CONFIG.camera.lookAt.y + targetY;

  // If there's a ceiling, constrain the camera to stay below it
  // Use an offset to keep camera comfortably inside the tunnel
  const ceilingOffset = 1.2; // Distance below ceiling to position camera
  if (ceilingHeight !== Infinity) {
    const maxCameraY = ceilingHeight - ceilingOffset;

    // Compress camera down if it would be above ceiling
    if (targetCameraY > maxCameraY) {
      targetCameraY = maxCameraY;
      // Also adjust lookAt to be lower, creating a more forward-looking angle
      // This enhances the claustrophobic tunnel feel
      targetLookAtY = Math.min(targetLookAtY, ceilingHeight - 2);
    }
  }

  // Smooth lerp for natural camera movement
  // Use slightly faster lerp (0.08) for responsive tunnel entry/exit
  const lerpSpeed = ceilingHeight !== Infinity ? 0.08 : 0.1;
  camera.position.y += (targetCameraY - camera.position.y) * lerpSpeed;

  // Update lookAt point
  camera.lookAt(
    CONFIG.camera.lookAt.x,
    targetLookAtY,
    CONFIG.camera.lookAt.z
  );
}

export function resetCamera() {
  camera.position.set(
    CONFIG.camera.position.x,
    CONFIG.camera.position.y,
    CONFIG.camera.position.z
  );
  camera.lookAt(
    CONFIG.camera.lookAt.x,
    CONFIG.camera.lookAt.y,
    CONFIG.camera.lookAt.z
  );
}

export function getScene() {
  return scene;
}

export function getCamera() {
  return camera;
}

export function getRenderer() {
  return renderer;
}
