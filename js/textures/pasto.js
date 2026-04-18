import * as THREE from 'three';

const drawPixels = (ctx, color, coords) => {
    ctx.fillStyle = color;
    coords.forEach(p => ctx.fillRect(p[0], p[1], 1, 1));
};

function makeCanvas(drawFunc) {
    const c = document.createElement('canvas'); 
    c.width = 16; 
    c.height = 16;
    drawFunc(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; 
    t.minFilter = THREE.NearestFilter;
    return t;
}

export function createGrassMaterials() {
    const top = makeCanvas(ctx => {
        ctx.fillStyle = '#5da83a'; ctx.fillRect(0,0,16,16);
        drawPixels(ctx, '#4d8a30', [[2,1],[5,3],[8,2],[11,4],[14,1],[1,6],[4,8],[7,7],[10,9],[13,6],[2,11],[5,13],[8,12],[11,14],[14,11],[3,15],[9,15]]);
        drawPixels(ctx, '#6db84a', [[1,2],[6,1],[12,3],[0,8],[6,10],[13,12],[2,14],[8,9]]);
    });

    const side = makeCanvas(ctx => {
        ctx.fillStyle = '#866043'; ctx.fillRect(0,0,16,16);
        drawPixels(ctx, '#7a5638', [[2,4],[5,6],[8,5],[12,7],[14,9],[1,10],[6,12],[10,11],[13,14],[3,15]]);
        ctx.fillStyle = '#5da83a'; ctx.fillRect(0,0,16,3);
        ctx.fillStyle = '#4d8a30'; ctx.fillRect(0,3,16,1);
        ctx.fillStyle = '#5da83a'; ctx.fillRect(1,3,1,1); ctx.fillRect(4,3,1,2); ctx.fillRect(8,3,1,1); ctx.fillRect(11,3,1,2); ctx.fillRect(14,3,1,1);
    });

    const bottom = makeCanvas(ctx => {
        ctx.fillStyle = '#866043'; ctx.fillRect(0,0,16,16);
        drawPixels(ctx, '#7a5638', [[1,1],[4,3],[7,2],[10,4],[13,1],[0,6],[3,8],[6,7],[9,9],[12,6],[1,11],[4,13],[7,12],[10,14],[13,11]]);
        drawPixels(ctx, '#926d50', [[2,0],[5,2],[8,1],[11,3],[14,0],[1,5],[4,7],[7,6],[10,8]]);
    });

    return [
        new THREE.MeshLambertMaterial({ map: side }),
        new THREE.MeshLambertMaterial({ map: side }),
        new THREE.MeshLambertMaterial({ map: top }),
        new THREE.MeshLambertMaterial({ map: bottom }),
        new THREE.MeshLambertMaterial({ map: side }),
        new THREE.MeshLambertMaterial({ map: side })
    ];
}