import * as THREE from 'three';

export class Player {
    constructor(camera, uiElement, canvasElement, getBlockFn) {
        this.camera = camera;
        this.uiElement = uiElement;
        this.canvas = canvasElement;
        this.getBlock = getBlockFn; // <-- RECIBE LA FUNCIÓN DEL MUNDO
        
        // Dimensiones
        this.EYE_HEIGHT = 1.6;
        this.PLAYER_WIDTH = 0.3; // 0.3 a cada lado del centro (Total: 0.6, un poco menos de 1 bloque para no pegarse a las paredes)
        this.HEAD_SPACE = 0.2;   // Espacio vacío arriba de los ojos
        
        // Físicas
        this.velocity = new THREE.Vector3();
        this.GRAVITY = 25;
        this.JUMP_FORCE = 9;
        this.FLY_SPEED = 10;
        this.WALK_SPEED = 6;
        
        // Estado
        this.isLocked = false;
        this.isFlying = false;
        this.canJump = true; 
        this.lastSpaceTime = 0;
        
        // Teclas
        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

        this.camera.position.set(50, this.EYE_HEIGHT + 1, 50); // Nace sobre el pasto (Y=0 del bloque + 1 del bloque + 1.6 ojos)

        this.initEvents();
    }

    initEvents() {
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

            if (e.code === 'Space') {
                const now = Date.now();
                if (now - this.lastSpaceTime < 300) {
                    this.isFlying = !this.isFlying;
                    this.velocity.y = 0;
                }
                this.lastSpaceTime = now;
                this.keys.space = true; 
                e.preventDefault();
            }
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

    // NUEVA FUNCIÓN: Comprueba si la caja invisible del jugador choca con algún bloque sólido
    checkCollision(x, y, z) {
        // Calcular los extremos de la caja del jugador (X, Z a los lados; Y desde los pies hasta la cabeza)
        const minX = Math.floor(x - this.PLAYER_WIDTH);
        const maxX = Math.floor(x + this.PLAYER_WIDTH);
        const minY = Math.floor(y - this.EYE_HEIGHT);       // Pies
        const maxY = Math.floor(y + this.HEAD_SPACE);       // Cabeza
        const minZ = Math.floor(z - this.PLAYER_WIDTH);
        const maxZ = Math.floor(z + this.PLAYER_WIDTH);

        // Revisar todos los bloques que ocupan ese espacio
        for (let bx = minX; bx <= maxX; bx++) {
            for (let by = minY; by <= maxY; by++) {
                for (let bz = minZ; bz <= maxZ; bz++) {
                    const block = this.getBlock(bx, by, bz);
                    // 0 es AIRE. Si es cualquier otra cosa (Pasto 1, Piedra 2), hay colisión
                    if (block !== 0) return true;
                }
            }
        }
        return false;
    }

    update(delta) {
        if (!this.isLocked) return;

        // 1. Dirección de la vista
        const rawForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const rawRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const forward = new THREE.Vector3(rawForward.x, 0, rawForward.z);
        const right = new THREE.Vector3(rawRight.x, 0, rawRight.z);
        if (forward.length() > 0.01) forward.normalize();
        if (right.length() > 0.01) right.normalize();

        // 2. Movimiento Horizontal
        const speed = this.isFlying ? this.FLY_SPEED : this.WALK_SPEED;
        this.velocity.x = 0; this.velocity.z = 0;
        if (this.keys.w) { this.velocity.x += forward.x; this.velocity.z += forward.z; }
        if (this.keys.s) { this.velocity.x -= forward.x; this.velocity.z -= forward.z; }
        if (this.keys.d) { this.velocity.x += right.x; this.velocity.z += right.z; }
        if (this.keys.a) { this.velocity.x -= right.x; this.velocity.z -= right.z; }
        if (this.velocity.x !== 0 || this.velocity.z !== 0) this.velocity.normalize().multiplyScalar(speed);

        // 3. Movimiento Vertical
        if (this.isFlying) {
            if (this.keys.space) this.velocity.y = this.FLY_SPEED;
            else if (this.keys.shift) this.velocity.y = -this.FLY_SPEED;
            else this.velocity.y = 0;
        } else {
            this.velocity.y -= this.GRAVITY * delta;
            if (this.keys.space && this.canJump) {
                this.velocity.y = this.JUMP_FORCE;
                this.canJump = false;
            }
        }

        // 4. APLICAR FÍSICAS Y COLISIONES SEPARADAS POR EJES (Permite deslizarse por las paredes)

        // EJE X
        let nextX = this.camera.position.x + this.velocity.x * delta;
        // Limites del mundo (Muros invisibles)
        if (nextX - this.PLAYER_WIDTH >= 0 && nextX + this.PLAYER_WIDTH <= 100) {
            if (!this.checkCollision(nextX, this.camera.position.y, this.camera.position.z)) {
                this.camera.position.x = nextX; // Si no choca, moverse
            } else {
                this.velocity.x = 0; // Si choca, frenar
            }
        } else { this.velocity.x = 0; }

        // EJE Z
        let nextZ = this.camera.position.z + this.velocity.z * delta;
        if (nextZ - this.PLAYER_WIDTH >= 0 && nextZ + this.PLAYER_WIDTH <= 100) {
            if (!this.checkCollision(this.camera.position.x, this.camera.position.y, nextZ)) {
                this.camera.position.z = nextZ;
            } else {
                this.velocity.z = 0;
            }
        } else { this.velocity.z = 0; }

        // EJE Y
        let nextY = this.camera.position.y + this.velocity.y * delta;
        if (nextY > 500) nextY = 500; // Techo de seguridad

        if (this.isFlying) {
            // Volando: Solo frenar si chocas con el suelo o techo
            if (!this.checkCollision(this.camera.position.x, nextY, this.camera.position.z)) {
                this.camera.position.y = nextY;
            } else {
                if (this.velocity.y < 0) this.camera.position.y = Math.floor(nextY - this.EYE_HEIGHT) + 1 + this.EYE_HEIGHT;
                this.velocity.y = 0;
            }
        } else {
            // Caminando: Gravedad y saltos
            if (!this.checkCollision(this.camera.position.x, nextY, this.camera.position.z)) {
                this.camera.position.y = nextY;
                this.canJump = false; // Está en el aire
            } else {
                // CHOCÓ CONTRA ALGO EN Y
                if (this.velocity.y < 0) {
                    // Estaba cayendo: Aterrizar suavemente sobre el bloque
                    // Calculamos exactamente la altura de la cara superior del bloque que nos frenó
                    const feetY = nextY - this.EYE_HEIGHT;
                    const topOfBlock = Math.floor(feetY) + 1;
                    this.camera.position.y = topOfBlock + this.EYE_HEIGHT;
                    this.canJump = true; // Toca suelo, puede saltar
                } else if (this.velocity.y > 0) {
                    // Estaba subiendo: Golpeó la cabeza con un bloque
                    this.velocity.y = 0;
                }
                this.velocity.y = 0;
            }
        }
    }
}