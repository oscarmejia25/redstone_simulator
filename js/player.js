import * as THREE from 'three';

export class Player {
    constructor(camera, uiElement, canvasElement) {
        this.camera = camera; this.uiElement = uiElement; this.canvas = canvasElement;
        this.SPEED = 15; this.isPaused = false; this.isLocked = false; 
        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.camera.position.set(50, 10, 50);
        this.initPCControls(); this.initMobileButtons(); this.initMobileLook();
    }

    initPCControls() {
        document.addEventListener('mousemove', (e) => {
            if (!this.isLocked || this.isPaused) return;
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
        this.uiElement.addEventListener('click', () => { this.isPaused = false; this.canvas.requestPointerLock(); });
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.canvas;
            if (!this.isLocked) this.isPaused = true;
            this.uiElement.style.display = this.isLocked ? 'none' : 'flex';
        });
    }

    initMobileButtons() {
        const map = { 'btn-w': 'w', 'btn-a': 'a', 'btn-s': 's', 'btn-d': 'd', 'btn-space': 'space', 'btn-shift': 'shift' };
        Object.entries(map).forEach(([id, key]) => {
            const btn = document.getElementById(id); if (!btn) return;
            const start = (e) => { e.stopPropagation(); this.keys[key] = true; };
            const end = () => this.keys[key] = false;
            btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', end);
            btn.addEventListener('pointerleave', end); btn.addEventListener('pointercancel', end);
        });
    }

    initMobileLook() {
        let isTouching = false, lastX = 0, lastY = 0;
        this.canvas.addEventListener('pointerdown', (e) => { if (!this.isPaused) { isTouching = true; lastX = e.clientX; lastY = e.clientY; }});
        window.addEventListener('pointermove', (e) => {
            if (!isTouching || this.isPaused) return;
            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= (e.clientX - lastX) * 0.005; this.euler.x -= (e.clientY - lastY) * 0.005;
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            this.camera.quaternion.setFromEuler(this.euler); lastX = e.clientX; lastY = e.clientY;
        });
        const stop = () => isTouching = false;
        window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop);
    }

    update(delta) {
        if (this.isPaused) return;
        const yaw = this.euler.y; 
        const forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
        let moveX = 0, moveZ = 0;
        if (this.keys.w) { moveX += forwardX; moveZ += forwardZ; }
        if (this.keys.s) { moveX -= forwardX; moveZ -= forwardZ; }
        if (this.keys.d) { moveX += rightX; moveZ += rightZ; }
        if (this.keys.a) { moveX -= rightX; moveZ -= rightZ; }
        if (moveX !== 0 || moveZ !== 0) { const l = Math.sqrt(moveX * moveX + moveZ * moveZ); moveX /= l; moveZ /= l; }
        this.camera.position.x += moveX * this.SPEED * delta;
        this.camera.position.z += moveZ * this.SPEED * delta;
        if (this.keys.space) this.camera.position.y += this.SPEED * delta;
        if (this.keys.shift) this.camera.position.y -= this.SPEED * delta;
    }
}