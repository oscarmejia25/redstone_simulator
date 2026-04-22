import * as THREE from 'three';

const WORLD_SIZE = 100;
let scene;

export function initWorld(sceneRef) {
    scene = sceneRef;

    // Cargador de texturas
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "Anonymous"; // Por si acaso la URL bloquea cosas locales
    
    // URL de la textura que pasaste
    const grassUrl = 'https://thumbs.dreamstime.com/b/fondo-de-la-textura-hierba-del-verde-retro-cuadrado-patr%C3%B3n-pasto-p%C3%ADxeles-c%C3%A9sped-abstracto-paisaje-bits-juego-pantalla-231999339.jpg?w=768';
    
    const texture = loader.load(grassUrl);
    
    // Configuración vital para que se vea como Minecraft (Pixeles duros)
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Geometría y Material
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    const blockMat = new THREE.MeshLambertMaterial({ map: texture });

    // InstancedMesh (Renderizar 10,000 bloques de una sola vez sin lag)
    const floorMesh = new THREE.InstancedMesh(blockGeo, blockMat, WORLD_SIZE * WORLD_SIZE);
    const dummy = new THREE.Object3D();
    let index = 0;

    for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
            // Y = -0.5 para que la cara superior del cubo quede exactamente en Y = 0
            dummy.position.set(x + 0.5, -0.5, z + 0.5);
            dummy.updateMatrix();
            floorMesh.setMatrixAt(index, dummy.matrix);
            index++;
        }
    }

    floorMesh.instanceMatrix.needsUpdate = true;
    scene.add(floorMesh);
}

// Funciones vacías por ahora, las usaremos cuando añadamos bloques
export function getMeshes() { return []; }
export function getSelectionBox() { return null; }