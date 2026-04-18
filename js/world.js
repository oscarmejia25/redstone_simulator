import * as THREE from 'three';
import { createGrassMaterials } from './textures/pasto.js';
import { createStoneTexture } from './textures/piedra.js';

export const BLOCKS = { AIR: 0, GRASS: 1, STONE: 2 };

const WORLD_SIZE_X = 100;
const WORLD_SIZE_Y = 50; 
const WORLD_SIZE_Z = 100;

const grid = new Array(WORLD_SIZE_Y).fill(null).map(() => 
    new Array(WORLD_SIZE_X).fill(null).map(() => 
        new Array(WORLD_SIZE_Z).fill(BLOCKS.AIR)
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
    buildMeshes();
}

export function getMeshes() { return Object.values(meshes); }
export function getSelectionBox() { return selectionBox; }

function buildMeshes() {
    for (let key in meshes) {
        scene.remove(meshes[key]);
        meshes[key].dispose();
        // ---> LA LÍNEA MÁGICA QUE DESTRUYE EL FANTAMA <---
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
        [BLOCKS.STONE]: new THREE.MeshLambertMaterial({ map: createStoneTexture() })
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
        
        // Etiquetamos la malla para que el ratón sepa qué es
        mesh.userData.blockType = parseInt(type);
        
        scene.add(mesh);
        meshes[type] = mesh;
    }
}