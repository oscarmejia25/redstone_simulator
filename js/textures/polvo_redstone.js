import * as THREE from 'three';

const drawPixels = (ctx, color, coords) => {
    ctx.fillStyle = color;
    coords.forEach(p => ctx.fillRect(p[0], p[1], 1, 1));
};

function makeCanvas(drawFunc) {
    const c = document.createElement('canvas'); c.width = 16; c.height = 16;
    drawFunc(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return t;
}

// Textura base apagada
export function createDustOffTexture() {
    return makeCanvas(ctx => {
        ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0,0,16,16);
        drawPixels(ctx, '#707070', [[3,2],[8,3],[12,4],[7,5],[1,6],[8,7],[4,10],[12,10],[7,12]]);
        ctx.fillStyle = '#4a0000';
        for(let x=6; x<=9; x++) { ctx.fillRect(x, 6, 1, 1); ctx.fillRect(x, 9, 1, 1); }
        for(let y=6; y<=9; y++) { ctx.fillRect(6, y, 1, 1); ctx.fillRect(9, y, 1, 1); }
        ctx.fillStyle = '#200000'; ctx.fillRect(7,7,2,2);
    });
}

// Textura encendida
export function createDustOnTexture() {
    return makeCanvas(ctx => {
        ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0,0,16,16);
        drawPixels(ctx, '#707070', [[3,2],[8,3],[12,4],[7,5],[1,6],[8,7],[4,10],[12,10],[7,12]]);
        ctx.fillStyle = '#ff0000';
        for(let x=6; x<=9; x++) { ctx.fillRect(x, 6, 1, 1); ctx.fillRect(x, 9, 1, 1); }
        for(let y=6; y<=9; y++) { ctx.fillRect(6, y, 1, 1); ctx.fillRect(9, y, 1, 1); }
        ctx.fillStyle = '#ff4444'; ctx.fillRect(7,7,2,2);
        // Resplandor
        ctx.fillStyle = '#aa6666';
        ctx.fillRect(5,7,1,1); ctx.fillRect(10,7,1,1); ctx.fillRect(7,5,1,1); ctx.fillRect(7,10,1,1);
    });
}