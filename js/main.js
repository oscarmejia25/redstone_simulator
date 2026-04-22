import * as THREE from 'three';
import { Player } from './player.js';
import * as World from './world.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 60, 100);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200); // FOV 70 es el de MC
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.touchAction = 'none'; 
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

World.initWorld(scene);
const player = new Player(camera, document.getElementById('instructions'), renderer.domElement);

const mobilePauseMenu = document.getElementById('mobile-pause-menu');
if (document.getElementById('btn-pause')) document.getElementById('btn-pause').addEventListener('pointerdown', (e) => { e.stopPropagation(); player.isPaused = true; mobilePauseMenu.style.display = 'flex'; });
if (document.getElementById('btn-resume-mobile')) document.getElementById('btn-resume-mobile').addEventListener('pointerdown', (e) => { e.stopPropagation(); player.isPaused = false; mobilePauseMenu.style.display = 'none'; });

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    player.update(clock.getDelta());
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
animate();