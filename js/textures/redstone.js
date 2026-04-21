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

export function createRedstoneBlockTexture() {
    return makeCanvas(ctx => {
        // Base roja intensa
        ctx.fillStyle = '#b20000'; ctx.fillRect(0,0,16,16);
        // Bordes y detalles oscuros (estilo bloque minral)
        ctx.fillStyle = '#800000';
        ctx.fillRect(0,0,16,1); ctx.fillRect(0,15,16,1); // Arriba/Abajo
        ctx.fillRect(0,0,1,16); ctx.fillRect(15,0,1,16); // Izq/Der
        // Patrón central
        ctx.fillRect(7,0,2,16); ctx.fillRect(0,7,16,2);
        // Sombras adicionales
        drawPixels(ctx, '#600000', [[4,4],[11,4],[4,11],[11,11],[7,7],[8,7],[7,8],[8,8]]);
    });
}