import * as THREE from 'three';
import { createGrassMaterials } from './textures/pasto.js';
import { createStoneTexture } from './textures/piedra.js';
import { createRedstoneBlockTexture } from './textures/redstone.js';

export const BLOCKS = { AIR: 0, GRASS: 1, STONE: 2, REDSTONE_BLOCK: 3, REDSTONE_DUST_OFF: 4, REDSTONE_DUST_ON: 5 };

const WORLD_SIZE_X = 100;
const WORLD_SIZE_Y = 50; 
const WORLD_SIZE_Z = 100;

const grid = new Array(WORLD_SIZE_Y).fill(null).map(() => new Array(WORLD_SIZE_X).fill(null).map(() => new Array(WORLD_SIZE_Z).fill(BLOCKS.AIR)));
const powerGrid = new Array(WORLD_SIZE_Y).fill(null).map(() => new Array(WORLD_SIZE_X).fill(null).map(() => new Array(WORLD_SIZE_Z).fill(0)));

const sourceBlocks = new Set();
let poweredDusts = new Set();

// MAPA DE SPRITES
const dustSprites = new Map();

let scene;
const meshes = {};
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
let selectionBox;

export function initWorld(sceneRef) {
    scene = sceneRef;
    for (let x = 0; x < WORLD_SIZE_X; x++) for (let z = 0; z < WORLD_SIZE_Z; z++) grid[0][x][z] = BLOCKS.GRASS;

    const selGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    selectionBox = new THREE.LineSegments(new THREE.EdgesGeometry(selGeo), new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
    selectionBox.visible = false;
    scene.add(selectionBox);

    buildMeshes();
}

export function getBlock(x, y, z) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return BLOCKS.AIR;
    return grid[y][x][z];
}

function isSolid(type) { return type === BLOCKS.GRASS || type === BLOCKS.STONE || type === BLOCKS.REDSTONE_BLOCK; }
function isDust(x, y, z) { const t = getBlock(x, y, z); return t === BLOCKS.REDSTONE_DUST_OFF || t === BLOCKS.REDSTONE_DUST_ON; }

export function setBlock(x, y, z, type) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return;
    
    const oldType = grid[y][x][z];
    if (type === BLOCKS.REDSTONE_DUST_OFF && !isSolid(getBlock(x, y - 1, z))) return;

    // Si quitamos polvo, destruimos su Sprite
    if (oldType === BLOCKS.REDSTONE_DUST_OFF || oldType === BLOCKS.REDSTONE_DUST_ON) removeDustSprite(x, y, z);

    grid[y][x][z] = type;

    const key = `${x},${y},${z}`;
    if (oldType === BLOCKS.REDSTONE_BLOCK) sourceBlocks.delete(key);
    if (type === BLOCKS.REDSTONE_BLOCK) sourceBlocks.add(key);
    if (oldType === BLOCKS.REDSTONE_DUST_ON) poweredDusts.delete(key);

    powerGrid[y][x][z] = 0; 
    
    // Si ponemos polvo, creamos su Sprite
    if (type === BLOCKS.REDSTONE_DUST_OFF) createDustSprite(x, y, z);
    
    updateRedstone(); 
}

// --- GESTIÓN DE SPRITES ---
function createDustSprite(x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    
    // Posición flotando sobre la cara superior del bloque
    sprite.position.set(x + 0.5, y + 0.11, z + 0.5);
    sprite.scale.set(0.99, 0.99, 0.99);
    sprite.userData.blockType = BLOCKS.REDSTONE_DUST_OFF;
    
    // GUARDAR COORDENADAS REALES DE LA CUADRÍCULA (Para el Raycast)
    sprite.userData.gridPos = { x, y, z };
    
    scene.add(sprite);
    dustSprites.set(`${x},${y},${z}`, { sprite, canvas, texture });
    
    updateDustVisuals(x, y, z);
}

function removeDustSprite(x, y, z) {
    const key = `${x},${y},${z}`;
    const dust = dustSprites.get(key);
    if (dust) {
        scene.remove(dust.sprite);
        dust.sprite.material.dispose();
        dust.texture.dispose();
        dustSprites.delete(key);
    }
}

// --- DIBUJO DEL POLVO ESTILO MINECRAFT ---
function updateDustVisuals(x, y, z) {
    const key = `${x},${y},${z}`;
    const dust = dustSprites.get(key);
    if (!dust) return;

    const power = powerGrid[y][x][z];
    
    // Colores exactos de MC
    const color = power > 0 ? '#ff0000' : '#4a0000';
    const ctx = dust.canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 16); 

    ctx.fillStyle = color;

    // 1. CENTRO CUADRADO DE 4x4 (Coordenadas 6,6 a 9,9)
    ctx.fillRect(6, 6, 4, 4);

    // 2. BRAZOS CONECTORES (Se extienden hasta el borde del canvas 16x16)
    // Si hay vecino, dibujamos una línea de 2 píxeles de ancho/largo desde el centro hasta el borde
    if (isDust(x, y, z + 1)) ctx.fillRect(7, 0, 2, 6);   // Arriba (Z+)
    if (isDust(x, y, z - 1)) ctx.fillRect(7, 10, 2, 6);  // Abajo (Z-)
    if (isDust(x + 1, y, z)) ctx.fillRect(10, 7, 6, 2);  // Derecha (X+)
    if (isDust(x - 1, y, z)) ctx.fillRect(0, 7, 6, 2);   // Izquierda (X-)

    // 3. NÚMERO DE ENERGÍA (Si está encendido)
    if (power > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(power.toString(), 8, 8);
        dust.sprite.userData.blockType = BLOCKS.REDSTONE_DUST_ON;
    } else {
        dust.sprite.userData.blockType = BLOCKS.REDSTONE_DUST_OFF;
    }

    dust.texture.needsUpdate = true; 
}

export function getPower(x, y, z) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return 0;
    return powerGrid[y][x][z];
}

export function getMeshes() { 
    return [...Object.values(meshes), ...Array.from(dustSprites.values()).map(d => d.sprite)]; 
}
export function getSelectionBox() { return selectionBox; }

// --- ALGORITMO REDSTONE ---
function updateRedstone() {
    poweredDusts.forEach(key => {
        const [x, y, z] = key.split(',').map(Number);
        if (grid[y][x][z] === BLOCKS.REDSTONE_DUST_ON) grid[y][x][z] = BLOCKS.REDSTONE_DUST_OFF;
        powerGrid[y][x][z] = 0;
    });
    poweredDusts = new Set();

    const queue = [];
    sourceBlocks.forEach(key => {
        const [x, y, z] = key.split(',').map(Number);
        powerGrid[y][x][z] = 15; 
        queue.push({ x, y, z, power: 16 }); 
    });

    while (queue.length > 0) {
        const curr = queue.shift();
        const neighbors = [
            {x: curr.x+1, y: curr.y, z: curr.z}, {x: curr.x-1, y: curr.y, z: curr.z},
            {x: curr.x, y: curr.y+1, z: curr.z}, {x: curr.x, y: curr.y-1, z: curr.z},
            {x: curr.x, y: curr.y, z: curr.z+1}, {x: curr.x, y: curr.y, z: curr.z-1}
        ];

        for (let n of neighbors) {
            let type = getBlock(n.x, n.y, n.z);
            if (type === BLOCKS.REDSTONE_DUST_OFF || type === BLOCKS.REDSTONE_DUST_ON) {
                let newPower = curr.power - 1; 
                if (newPower > 0 && newPower > powerGrid[n.y][n.x][n.z]) {
                    powerGrid[n.y][n.x][n.z] = newPower;
                    grid[n.y][n.x][n.z] = BLOCKS.REDSTONE_DUST_ON;
                    poweredDusts.add(`${n.x},${n.y},${n.z}`);
                    queue.push({ x: n.x, y: n.y, z: n.z, power: newPower });
                }
            }
        }
    }

    // ACTUALIZAR DIBUJO DE TODOS LOS SPRITES
    dustSprites.forEach((dust, key) => {
        const [x, y, z] = key.split(',').map(Number);
        updateDustVisuals(x, y, z);
    });

    buildMeshes();
}

// --- RENDERIZADO DE BLOQUES SÓLIDOS ---
function buildMeshes() {
    for (let key in meshes) { scene.remove(meshes[key]); meshes[key].dispose(); delete meshes[key]; }

    const counts = {};
    const positions = {};

    for (let y = 0; y < WORLD_SIZE_Y; y++) {
        for (let x = 0; x < WORLD_SIZE_X; x++) {
            for (let z = 0; z < WORLD_SIZE_Z; z++) {
                let type = grid[y][x][z];
                if (type === BLOCKS.AIR || type === BLOCKS.REDSTONE_DUST_OFF || type === BLOCKS.REDSTONE_DUST_ON) continue;

                let neighbors = [ getBlock(x+1,y,z), getBlock(x-1,y,z), getBlock(x,y+1,z), getBlock(x,y-1,z), getBlock(x,y,z+1), getBlock(x,y,z-1)];
                let isHidden = neighbors.every(n => n !== BLOCKS.AIR && n !== BLOCKS.REDSTONE_DUST_OFF && n !== BLOCKS.REDSTONE_DUST_ON);
                if (isHidden) continue;

                if (!counts[type]) { counts[type] = 0; positions[type] = []; }
                counts[type]++;
                positions[type].push(x, y, z);
            }
        }
    }

    const dummy = new THREE.Object3D();
    const materials = {
        [BLOCKS.GRASS]: createGrassMaterials(),
        [BLOCKS.STONE]: new THREE.MeshLambertMaterial({ map: createStoneTexture() }),
        [BLOCKS.REDSTONE_BLOCK]: new THREE.MeshBasicMaterial({ map: createRedstoneBlockTexture() })
    };

    for (let type in counts) {
        let mesh = new THREE.InstancedMesh(blockGeo, materials[type], counts[type]);
        let pos = positions[type];
        for (let i = 0; i < counts[type]; i++) {
            dummy.position.set(pos[i*3] + 0.5, pos[i*3+1] + 0.5, pos[i*3+2] + 0.5);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.userData.blockType = parseInt(type);
        scene.add(mesh);
        meshes[type] = mesh;
    }
}