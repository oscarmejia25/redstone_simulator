import * as THREE from 'three';

const WORLD_SIZE = 100;
let scene;

export function initWorld(sceneRef) {
    scene = sceneRef;

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "Anonymous";

    // URLs de texturas Vanilla de Minecraft (Alta calidad)
    const grassTopUrl = 'https://raw.githubusercontent.com/Southender/Minecraft-Textures/main/minecraft/textures/block/grass_block_top.png';
    const grassSideUrl = 'https://raw.githubusercontent.com/Southender/Minecraft-Textures/main/minecraft/textures/block/grass_block_side.png';
    const dirtUrl = 'https://raw.githubusercontent.com/Southender/Minecraft-Textures/main/minecraft/textures/block/dirt.png';

    // Cargar las 3 texturas
    const topTex = loader.load(grassTopUrl);
    const sideTex = loader.load(grassSideUrl);
    const dirtTex = loader.load(dirtUrl);

    // Configurar para que se vean pixeladas (Estilo MC)
    [topTex, sideTex, dirtTex].forEach(tex => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
    });

    // Crear materiales para las 6 caras del bloque
    // Orden en Three.js: [+X, -X, +Y (Arriba), -Y (Abajo), +Z, -Z]
    const blockMaterials = [
        new THREE.MeshLambertMaterial({ map: sideTex }), // Derecha
        new THREE.MeshLambertMaterial({ map: sideTex }), // Izquierda
        new THREE.MeshLambertMaterial({ map: topTex }),  // Arriba (Verde)
        new THREE.MeshLambertMaterial({ map: dirtTex }), // Abajo (Tierra)
        new THREE.MeshLambertMaterial({ map: sideTex }), // Frente
        new THREE.MeshLambertMaterial({ map: sideTex })  // Atrás
    ];

    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    const floorMesh = new THREE.InstancedMesh(blockGeo, blockMaterials, WORLD_SIZE * WORLD_SIZE);
    
    const dummy = new THREE.Object3D();
    let index = 0;

    for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
            dummy.position.set(x + 0.5, -0.5, z + 0.5);
            dummy.updateMatrix();
            floorMesh.setMatrixAt(index, dummy.matrix);
            index++;
        }
    }

    floorMesh.instanceMatrix.needsUpdate = true;
    scene.add(floorMesh);
}

export function getMeshes() { return []; }
export function getSelectionBox() { return null; }