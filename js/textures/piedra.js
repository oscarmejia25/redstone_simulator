import * as THREE from 'three';

const drawPixels = (ctx, color, coords) => {
    ctx.fillStyle = color;
    coords.forEach(p => ctx.fillRect(p[0], p[1], 1, 1));
};

export function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0,0,16,16);
    drawPixels(ctx, '#707070', [
        [7,0],[3,1],[4,1],[12,1],[3,2],[4,2],[8,2],[12,2],
        [4,3],[8,3],[11,3],[12,3],[12,4],[13,4],[1,5],[7,5],
        [1,6],[2,6],[7,6],[8,6],[8,7],[9,7],[10,7],
        [3,9],[8,9],[9,9],[10,9],[4,10],[5,10],[12,10],
        [5,11],[6,11],[12,11],[7,12],[8,12],[1,13],[2,13],
        [9,13],[2,14],[3,14],[9,14],[10,14],[11,14],[12,15],[13,15]
    ]);
    drawPixels(ctx, '#9a9a9a', [
        [8,2],[8,3],[13,7],[13,8],[4,10],[4,11],[13,12]
    ]);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}