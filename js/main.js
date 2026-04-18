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
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

World.initWorld(scene);
const player = new Player(camera, document.getElementById('instructions'), renderer.domElement, World.getBlock);

// Icono de la barra
const slots = document.querySelectorAll('.slot[data-block]');
slots.forEach(slot => {
    if(slot.getAttribute('data-block') === "1") {
        slot.querySelector('img').src = createStoneTexture().image.toDataURL();
    }
});

let selectedBlockType = World.BLOCKS.STONE;

const raycaster = new THREE.Raycaster();
raycaster.far = 8;
const center = new THREE.Vector2(0, 0);

document.addEventListener('mousedown', (e) => {
    if (!player.isLocked) return;

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
            
            // Romper si no es pasto
            if (targetBlock !== World.BLOCKS.AIR && targetBlock !== World.BLOCKS.GRASS) {
                World.setBlock(bx, by, bz, World.BLOCKS.AIR);
            }
        } else if (e.button === 2) { 
            const placePos = point.clone().add(normal.clone().multiplyScalar(0.01));
            const px = Math.floor(placePos.x);
            const py = Math.floor(placePos.y);
            const pz = Math.floor(placePos.z);

            if (World.getBlock(px, py, pz) === World.BLOCKS.AIR) {
                const pMinX = camera.position.x - 0.3, pMaxX = camera.position.x + 0.3;
                const pMinY = camera.position.y - 1.6, pMaxY = camera.position.y + 0.2;
                const pMinZ = camera.position.z - 0.3, pMaxZ = camera.position.z + 0.3;

                if (!(px + 1 > pMinX && px < pMaxX && py + 1 > pMinY && py < pMaxY && pz + 1 > pMinZ && pz < pMaxZ)) {
                    World.setBlock(px, py, pz, selectedBlockType);
                }
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

    if (player.isLocked) {
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(World.getMeshes());
        
        const selBox = World.getSelectionBox();
        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            
            // Si apuntas al pasto, ocultar la caja. Si apuntas a piedra, mostrarla.
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