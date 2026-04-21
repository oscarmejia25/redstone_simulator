import * as THREE from 'three';
import { createGrassMaterials } from './textures/pasto.js';
import { createStoneTexture } from './textures/piedra.js';
import { createRedstoneBlockTexture } from './textures/redstone.js';
import { createDustOffTexture, createDustOnTexture } from './textures/polvo_redstone.js';

export const BLOCKS = { AIR: 0, GRASS: 1, STONE: 2, REDSTONE_BLOCK: 3, REDSTONE_DUST_OFF: 4, REDSTONE_DUST_ON: 5 };

const WORLD_SIZE_X = 100;
const WORLD_SIZE_Y = 50; 
const WORLD_SIZE_Z = 100;

const grid = new Array(WORLD_SIZE_Y).fill(null).map(() => new Array(WORLD_SIZE_X).fill(null).map(() => new Array(WORLD_SIZE_Z).fill(BLOCKS.AIR)));
const powerGrid = new Array(WORLD_SIZE_Y).fill(null).map(() => new Array(WORLD_SIZE_X).fill(null).map(() => new Array(WORLD_SIZE_Z).fill(0)));

const sourceBlocks = new Set();
let poweredDusts = new Set();

let scene;
const meshes = {};
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

const dustGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
dustGeo.translate(0, 0.05, 0);
dustGeo.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5,-0.5,-0.5), new THREE.Vector3(0.5,0.5,0.5));
dustGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0,0,0), Math.sqrt(3)/2);

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

function isSolid(type) {
    return type === BLOCKS.GRASS || type === BLOCKS.STONE || type === BLOCKS.REDSTONE_BLOCK;
}

export function setBlock(x, y, z, type) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return;
    
    const oldType = grid[y][x][z];

    // REGLA: El polvo solo se pone si debajo hay un bloque sólido
    if (type === BLOCKS.REDSTONE_DUST_OFF && !isSolid(getBlock(x, y - 1, z))) return;

    grid[y][x][z] = type;

    const key = `${x},${y},${z}`;
    if (oldType === BLOCKS.REDSTONE_BLOCK) sourceBlocks.delete(key);
    if (type === BLOCKS.REDSTONE_BLOCK) sourceBlocks.add(key);

    if (oldType === BLOCKS.REDSTONE_DUST_ON) poweredDusts.delete(key);

    powerGrid[y][x][z] = 0; 
    
    updateRedstone(); 
}

export function getPower(x, y, z) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return 0;
    return powerGrid[y][x][z];
}

export function getMeshes() { return Object.values(meshes); }
export function getSelectionBox() { return selectionBox; }

// --- ALGORITMO REDSTONE ---
function updateRedstone() {
    // 1. Apagar todo el polvo que estaba encendido
    poweredDusts.forEach(key => {
        const [x, y, z] = key.split(',').map(Number);
        if (grid[y][x][z] === BLOCKS.REDSTONE_DUST_ON) {
            grid[y][x][z] = BLOCKS.REDSTONE_DUST_OFF;
        }
        powerGrid[y][x][z] = 0;
    });
    poweredDusts = new Set();

    // 2. Iniciar BFS desde las fuentes
    const queue = [];
    sourceBlocks.forEach(key => {
        const [x, y, z] = key.split(',').map(Number);
        powerGrid[y][x][z] = 15; 
        // FIX DE ENERGÍA: Se inicia en 16 para que el primer vecino reciba 15
        queue.push({ x, y, z, power: 16 }); 
    });

    // 3. Propagar
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
                let newPower = curr.power - 1; // Aquí baja a 15, 14, 13...
                if (newPower > 0 && newPower > powerGrid[n.y][n.x][n.z]) {
                    powerGrid[n.y][n.x][n.z] = newPower;
                    grid[n.y][n.x][n.z] = BLOCKS.REDSTONE_DUST_ON;
                    poweredDusts.add(`${n.x},${n.y},${n.z}`);
                    queue.push({ x: n.x, y: n.y, z: n.z, power: newPower });
                }
            }
        }
    }

    buildMeshes();
}

// --- RENDERIZADO ---
function buildMeshes() {
    for (let key in meshes) { scene.remove(meshes[key]); meshes[key].dispose(); delete meshes[key]; }

    const counts = {};
    const positions = {};

    for (let y = 0; y < WORLD_SIZE_Y; y++) {
        for (let x = 0; x < WORLD_SIZE_X; x++) {
            for (let z = 0; z < WORLD_SIZE_Z; z++) {
                let type = grid[y][x][z];
                if (type === BLOCKS.AIR) continue;

                let neighbors = [ getBlock(x+1,y,z), getBlock(x-1,y,z), getBlock(x,y+1,z), getBlock(x,y-1,z), getBlock(x,y,z+1), getBlock(x,y,z-1)];
                let isHidden = type !== BLOCKS.REDSTONE_DUST_OFF && type !== BLOCKS.REDSTONE_DUST_ON && neighbors.every(n => n !== BLOCKS.AIR);
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
        [BLOCKS.REDSTONE_BLOCK]: new THREE.MeshBasicMaterial({ map: createRedstoneBlockTexture() }),
        [BLOCKS.REDSTONE_DUST_OFF]: new THREE.MeshLambertMaterial({ map: createDustOffTexture() }),
        [BLOCKS.REDSTONE_DUST_ON]: new THREE.MeshBasicMaterial({ map: createDustOnTexture() }) 
    };

    const geoMap = {
        [BLOCKS.REDSTONE_DUST_OFF]: dustGeo,
        [BLOCKS.REDSTONE_DUST_ON]: dustGeo
    };

    for (let type in counts) {
        let geo = geoMap[type] || blockGeo;
        let mesh = new THREE.InstancedMesh(geo, materials[type], counts[type]);
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