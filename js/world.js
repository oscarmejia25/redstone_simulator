import * as THREE from 'three';
import { createGrassMaterials } from './textures/pasto.js';
import { createStoneTexture } from './textures/piedra.js';
import { createRedstoneBlockTexture } from './textures/redstone.js';

export const BLOCKS = { AIR: 0, GRASS: 1, STONE: 2, REDSTONE_BLOCK: 3 };

const WORLD_SIZE_X = 100;
const WORLD_SIZE_Y = 50; 
const WORLD_SIZE_Z = 100;

// Matriz de bloques físicos
const grid = new Array(WORLD_SIZE_Y).fill(null).map(() => 
    new Array(WORLD_SIZE_X).fill(null).map(() => 
        new Array(WORLD_SIZE_Z).fill(BLOCKS.AIR)
    )
);

// MATRIZ DE ENERGÍA (Guarda un número del 0 al 15)
export const powerGrid = new Array(WORLD_SIZE_Y).fill(null).map(() => 
    new Array(WORLD_SIZE_X).fill(null).map(() => 
        new Array(WORLD_SIZE_Z).fill(0)
    )
);

let scene;
const meshes = {};
let blockGeo = new THREE.BoxGeometry(1, 1, 1);
let selectionBox;

export function initWorld(sceneRef) {
    scene = sceneRef;

    for (let x = 0; x < WORLD_SIZE_X; x++) {
        for (let z = 0; z < WORLD_SIZE_Z; z++) {
            grid[0][x][z] = BLOCKS.GRASS;
        }
    }

    const selGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const selEdges = new THREE.EdgesGeometry(selGeo);
    selectionBox = new THREE.LineSegments(selEdges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
    selectionBox.visible = false;
    scene.add(selectionBox);

    buildMeshes();
}

export function getBlock(x, y, z) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return BLOCKS.AIR;
    return grid[y][x][z];
}

export function setBlock(x, y, z, type) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return;
    grid[y][x][z] = type;
    
    // LÓGICA DE ENERGÍA
    if (type === BLOCKS.REDSTONE_BLOCK) {
        powerGrid[y][x][z] = 15; // El bloque sólido SIEMPRE es fuente de 15
    } else {
        powerGrid[y][x][z] = 0;  // Si quitas el bloque o pones otra cosa, la energía desaparece
    }
    
    buildMeshes();
}

export function getPower(x, y, z) {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) return 0;
    return powerGrid[y][x][z];
}

export function getMeshes() { return Object.values(meshes); }
export function getSelectionBox() { return selectionBox; }

function buildMeshes() {
    for (let key in meshes) {
        scene.remove(meshes[key]);
        meshes[key].dispose();
        delete meshes[key]; 
    }

    const counts = {};
    const positions = {};

    for (let y = 0; y < WORLD_SIZE_Y; y++) {
        for (let x = 0; x < WORLD_SIZE_X; x++) {
            for (let z = 0; z < WORLD_SIZE_Z; z++) {
                let type = grid[y][x][z];
                if (type === BLOCKS.AIR) continue;

                let neighbors = [
                    getBlock(x+1,y,z), getBlock(x-1,y,z),
                    getBlock(x,y+1,z), getBlock(x,y-1,z),
                    getBlock(x,y,z+1), getBlock(x,y,z-1)
                ];
                let isHidden = neighbors.every(n => n !== BLOCKS.AIR);
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
        // MeshBasicMaterial hace que brille por sí mismo sin necesidad de luz (ideal para la fuente de energía)
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