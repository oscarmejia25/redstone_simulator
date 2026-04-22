import * as THREE from 'three';
import { Player } from './player.js';
import * as World from './world.js';

// 1. ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Cielo azul
// Niebla para ocultar el borde del mundo de 100x100
scene.fog = new THREE.Fog(0x87CEEB, 60, 100);

// 2. CÁMARA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

// 3. RENDERIZADOR
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.touchAction = 'none'; 
document.body.appendChild(renderer.domElement);

// 4. ILUMINACIÓN
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Luz suave general
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

// 5. INICIALIZAR MUNDO Y JUGADOR
World.initWorld(scene);
const player = new Player(camera, document.getElementById('instructions'), renderer.domElement);

// Lógica de pausa móvil
const mobilePauseMenu = document.getElementById('mobile-pause-menu');
if (document.getElementById('btn-pause')) {
    document.getElementById('btn-pause').addEventListener('pointerdown', (e) => {
        e.stopPropagation(); 
        player.isPaused = true; 
        mobilePauseMenu.style.display = 'flex';
    });
}
if (document.getElementById('btn-resume-mobile')) {
    document.getElementById('btn-resume-mobile').addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        player.isPaused = false; 
        mobilePauseMenu.style.display = 'none';
    });
}

// 6. BUCLE DE ANIMACIÓN
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    
    player.update(delta);
    renderer.render(scene, camera);
}

// Adaptar al tamaño de la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Arrancar el juego
animate();