import * as THREE from 'three';
import { Player } from './player.js';
import * as World from './world.js';
import { createStoneTexture } from './textures/piedra.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 80, 130);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.touchAction = 'none'; 
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

World.initWorld(scene);
const player = new Player(camera, document.getElementById('instructions'), renderer.domElement);

// Referencia al menú de pausa móvil
const mobilePauseMenu = document.getElementById('mobile-pause-menu');
const btnResumeMobile = document.getElementById('btn-resume-mobile');
const btnPauseMobile = document.getElementById('btn-pause');

// --- LÓGICA DE PAUSA MÓVIL ---
if (btnPauseMobile) {
    btnPauseMobile.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); // Evita que gire la cámara al pausar
        player.isPaused = true;
        mobilePauseMenu.style.display = 'flex';
    });
}

if (btnResumeMobile) {
    btnResumeMobile.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        player.isPaused = false;
        mobilePauseMenu.style.display = 'none';
    });
}

// Icono de la barra
const slots = document.querySelectorAll('.slot[data-block]');
slots.forEach(slot => {
    if(slot.getAttribute('data-block') === "1") {
        slot.querySelector('img').src = createStoneTexture().image.toDataURL();
    }
});

let selectedBlockType = World.BLOCKS.STONE;

const raycaster = new THREE.Raycaster();
raycaster.far = 40;
const center = new THREE.Vector2(0, 0);

document.addEventListener('mousedown', (e) => {
    if (!player.isLocked || player.isPaused) return;

    raycaster.setFromCamera(center, camera);
    const intersects = raycaster.intersectObjects(World.getMeshes());

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const point = intersect.point.clone();
        const normal = intersect.face.normal;

        const blockPos = point.clone().sub(normal.clone().multiplyScalar(0.01));
        const bx = Math.floor(blockPos.x);
        const by = Math.floor(blockPos.y);
        const bz = Math.floor(blockPos.z);

        if (e.button === 0) { 
            const targetBlock = World.getBlock(bx, by, bz);
            if (targetBlock !== World.BLOCKS.AIR && targetBlock !== World.BLOCKS.GRASS) {
                World.setBlock(bx, by, bz, World.BLOCKS.AIR);
            }
        } else if (e.button === 2) { 
            const placePos = point.clone().add(normal.clone().multiplyScalar(0.01));
            const px = Math.floor(placePos.x);
            const py = Math.floor(placePos.y);
            const pz = Math.floor(placePos.z);

            if (World.getBlock(px, py, pz) === World.BLOCKS.AIR) {
                World.setBlock(px, py, pz, selectedBlockType);
            }
        }
    }
});

document.addEventListener('contextmenu', e => e.preventDefault());

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    
    // Actualizar jugador (si no está en pausa, no se moverá gracias a su checks interno)
    player.update(delta);

    // Actualizar caja de selección (Solo si no está en pausa)
    if (!player.isPaused) {
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(World.getMeshes());
        const selBox = World.getSelectionBox();
        
        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            if (hitMesh.userData.blockType === World.BLOCKS.GRASS) {
                selBox.visible = false;
            } else {
                const p = intersects[0].point.clone().sub(intersects[0].face.normal.clone().multiplyScalar(0.01));
                selBox.position.set(Math.floor(p.x) + 0.5, Math.floor(p.y) + 0.5, Math.floor(p.z) + 0.5);
                selBox.visible = true;
            }
        } else {
            selBox.visible = false;
        }
    } else {
        World.getSelectionBox().visible = false;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();