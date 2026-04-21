import * as THREE from 'three';

export class Player {
    constructor(camera, uiElement, canvasElement) {
        this.camera = camera;
        this.uiElement = uiElement;
        this.canvas = canvasElement;
        
        this.SPEED = 15; // Velocidad de movimiento libre (muy rápida para construir)
        
        // Estado de teclas (compartido entre teclado y botones del celular)
        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
        
        // Rotación
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isLocked = false; // Para el mouse en PC

        // Empezar un poco arriba para ver el suelo
        this.camera.position.set(50, 10, 50);

        this.initPCControls();
        this.initMobileButtons();
        this.initMobileLook();
    }

    // --- CONTROLES PC (Teclado y Mouse) ---
    initPCControls() {
        document.addEventListener('mousemove', (e) => {
            if (!this.isLocked) return;
            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= e.movementX * 0.002;
            this.euler.x -= e.movementY * 0.002;
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            this.camera.quaternion.setFromEuler(this.euler);
        });

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key in this.keys) this.keys[key] = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = true;
            if (e.code === 'Space') { this.keys.space = true; e.preventDefault(); }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key in this.keys) this.keys[key] = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = false;
            if (e.code === 'Space') this.keys.space = false;
        });

        this.uiElement.addEventListener('click', () => this.canvas.requestPointerLock());
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.canvas;
            this.uiElement.style.display = this.isLocked ? 'none' : 'flex';
        });
    }

    // --- CONTROLES MÓVIL (Botones en pantalla) ---
    initMobileButtons() {
        const mapBtnToKey = {
            'btn-w': 'w', 'btn-a': 'a', 'btn-s': 's', 'btn-d': 'd',
            'btn-space': 'space', 'btn-shift': 'shift'
        };

        Object.entries(mapBtnToKey).forEach(([id, key]) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            // Usamos pointerdown/pointerup porque funciona igual para dedo y ratón
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault(); // Evita scroll del celular
                this.keys[key] = true;
            });
            
            // Si el dedo sale del botón mientras presiona, que también se suelte
            btn.addEventListener('pointerup', () => this.keys[key] = false);
            btn.addEventListener('pointerleave', () => this.keys[key] = false);
            btn.addEventListener('pointercancel', () => this.keys[key] = false);
        });
    }

    // --- CONTROLES MÓVIL (Arrastrar para mirar) ---
    initMobileLook() {
        let isTouching = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener('pointerdown', (e) => {
            // Solo rotar si NO está tocando un botón (clase 'no-look' en el HTML)
            if (!e.target.closest('.no-look')) {
                isTouching = true;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!isTouching) return;
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;

            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= deltaX * 0.005; // Un poco más sensible que el ratón
            this.euler.x -= deltaY * 0.005;
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            this.camera.quaternion.setFromEuler(this.euler);

            lastX = e.clientX;
            lastY = e.clientY;
        });

        window.addEventListener('pointerup', () => isTouching = false);
        window.addEventListener('pointercancel', () => isTouching = false);
    }

    // --- BUCLE DE ACTUALIZACIÓN ---
    update(delta) {
        // EJES ABSOLUTOS (Sin importar hacia dónde mires)
        if (this.keys.a) this.camera.position.x -= this.SPEED * delta;
        if (this.keys.d) this.camera.position.x += this.SPEED * delta;
        if (this.keys.w) this.camera.position.z -= this.SPEED * delta;
        if (this.keys.s) this.camera.position.z += this.SPEED * delta;
        if (this.keys.space) this.camera.position.y += this.SPEED * delta;
        if (this.keys.shift) this.camera.position.y -= this.SPEED * delta;
    }
}