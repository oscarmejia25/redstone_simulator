import * as THREE from 'three';
import { Player } from './player.js';
import * as World from './world.js';
import { createStoneTexture } from './textures/piedra.js';
import { createRedstoneBlockTexture } from './textures/redstone.js';
import { createDustOffTexture } from './textures/polvo_redstone.js';

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

const mobilePauseMenu = document.getElementById('mobile-pause-menu');
if (document.getElementById('btn-pause')) document.getElementById('btn-pause').addEventListener('pointerdown', (e) => { e.stopPropagation(); player.isPaused = true; mobilePauseMenu.style.display = 'flex'; });
if (document.getElementById('btn-resume-mobile')) document.getElementById('btn-resume-mobile').addEventListener('pointerdown', (e) => { e.stopPropagation(); player.isPaused = false; mobilePauseMenu.style.display = 'none'; });

const slots = document.querySelectorAll('.slot[data-block]');
slots.forEach(slot => {
    const id = slot.getAttribute('data-block');
    if (id === "1") slot.querySelector('img').src = createStoneTexture().image.toDataURL();
    if (id === "2") slot.querySelector('img').src = createRedstoneBlockTexture().image.toDataURL();
    if (id === "3") slot.querySelector('img').src = createDustOffTexture().image.toDataURL();
});

let selectedBlockType = World.BLOCKS.STONE;

function updateHotbar(index) {
    slots.forEach(s => s.classList.remove('active'));
    if (slots[index]) slots[index].classList.add('active');
    const types = [World.BLOCKS.STONE, World.BLOCKS.REDSTONE_BLOCK, World.BLOCKS.REDSTONE_DUST_OFF];
    if (types[index] !== undefined) selectedBlockType = types[index];
}

window.addEventListener('keydown', (e) => {
    if(e.key === '1') updateHotbar(0);
    if(e.key === '2') updateHotbar(1);
    if(e.key === '3') updateHotbar(2);
});

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

        let bx, by, bz;
        if (intersect.object.isSprite) {
            // LEER LAS COORDENADAS REALES GUARDADAS EN EL SPRITE
            bx = intersect.object.userData.gridPos.x;
            by = intersect.object.userData.gridPos.y;
            bz = intersect.object.userData.gridPos.z;
        } else {
            const blockPos = point.clone().sub(normal.clone().multiplyScalar(0.01));
            bx = Math.floor(blockPos.x);
            by = Math.floor(blockPos.y);
            bz = Math.floor(blockPos.z);
        }

        if (e.button === 0) { 
            const targetBlock = World.getBlock(bx, by, bz);
            if (targetBlock !== World.BLOCKS.AIR && targetBlock !== World.BLOCKS.GRASS) {
                World.setBlock(bx, by, bz, World.BLOCKS.AIR);
            }
        } else if (e.button === 2) { 
            const placePos = point.clone().add(normal.clone().multiplyScalar(0.5));
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
    player.update(delta);

    if (!player.isPaused) {
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(World.getMeshes());
        const selBox = World.getSelectionBox();
        
        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            if (hitMesh.userData.blockType === World.BLOCKS.GRASS) {
                selBox.visible = false;
            } else {
                let px, py, pz;
                if (hitMesh.isSprite) {
                    // Poner la caja en el centro del BLOQUE (no donde flota el sprite)
                    px = hitMesh.userData.gridPos.x + 0.5;
                    py = hitMesh.userData.gridPos.y + 0.5;
                    pz = hitMesh.userData.gridPos.z + 0.5;
                } else {
                    const p = intersects[0].point.clone().sub(intersects[0].face.normal.clone().multiplyScalar(0.01));
                    px = Math.floor(p.x) + 0.5; 
                    py = Math.floor(p.y) + 0.5; 
                    pz = Math.floor(p.z) + 0.5;
                }
                selBox.position.set(px, py, pz);
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