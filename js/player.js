// Player Controller with Reload, Footstep Audio, Secret Wall Pushing, and Screen Shake
class Player {
    constructor(camera, levelManager, weaponManager) {
        this.camera = camera;
        this.level = levelManager;
        this.weapons = weaponManager;

        this.position = camera.position;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.isGrounded = true;

        this.pitch = 0;
        this.yaw = 0;

        // Player Stats
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 50;
        this.maxArmor = 100;
        this.score = 0;
        this.keys = { red: false, gold: false };

        this.headBobTimer = 0;
        this.lastFootstepTime = 0;
        this.isDead = false;

        this.setupControls();
    }

    setupControls() {
        const canvas = document.getElementById('webgl-canvas');

        canvas.addEventListener('click', () => {
            if (!this.isDead) {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== canvas || this.isDead) return;

            const sensitivity = 0.0022;
            this.yaw -= e.movementX * sensitivity;
            this.pitch -= e.movementY * sensitivity;

            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.x = this.pitch;
            euler.y = this.yaw;
            this.camera.quaternion.setFromEuler(euler);
        });

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousedown', (e) => {
            if (document.pointerLockElement === canvas && e.button === 0) {
                this.weapons.isFiring = true;
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.weapons.isFiring = false;
        });
    }

    onKeyDown(e) {
        if (this.isDead) return;
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
            case 'ShiftLeft': case 'ShiftRight': this.isSprinting = true; break;
            case 'Space':
                if (this.isGrounded) {
                    this.velocity.y = 7.5;
                    this.isGrounded = false;
                }
                break;
            case 'KeyR': this.weapons.reload(); break;
            case 'KeyE': this.interactDoorOrSecret(); break;
            case 'Digit1': this.weapons.switchWeapon(1); break;
            case 'Digit2': this.weapons.switchWeapon(2); break;
            case 'Digit3': this.weapons.switchWeapon(3); break;
            case 'Digit4': this.weapons.switchWeapon(4); break;
            case 'Digit5': this.weapons.switchWeapon(5); break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.isSprinting = false; break;
        }
    }

    interactDoorOrSecret() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        // Check Doors first
        const doorIntersects = raycaster.intersectObjects(this.level.doors.map(d => d.mesh));
        if (doorIntersects.length > 0 && doorIntersects[0].distance < 4.0) {
            const doorMesh = doorIntersects[0].object;
            const doorObj = this.level.doors.find(d => d.mesh === doorMesh);

            if (doorObj && !doorObj.isOpen) {
                if (doorObj.type === 'red' && !this.keys.red) {
                    this.showMessage("LOCKED! REQUIRES RED KEYCARD");
                    audioFX.playHurt();
                    return;
                }
                if (doorObj.type === 'gold' && !this.keys.gold) {
                    this.showMessage("LOCKED! REQUIRES MASTER GOLD KEY");
                    audioFX.playHurt();
                    return;
                }

                doorObj.isOpen = true;
                doorMesh.position.y += 4.0;
                this.showMessage("DOOR OPENED");
                audioFX.playPickup();
                return;
            }
        }

        // Check Secret Walls next
        const secretIntersects = raycaster.intersectObjects(this.level.secretWalls.map(s => s.mesh));
        if (secretIntersects.length > 0 && secretIntersects[0].distance < 4.0) {
            const wallMesh = secretIntersects[0].object;
            const secObj = this.level.secretWalls.find(s => s.mesh === wallMesh);

            if (secObj && !secObj.isOpen && !secObj.isMoving) {
                secObj.isMoving = true;
                this.level.secretsFound++;
                document.getElementById('secrets-found').innerText = this.level.secretsFound;

                this.showMessage("YOU FOUND A SECRET AREA!");
                audioFX.playSecretFanfare();

                const flash = document.getElementById('secret-flash');
                flash.classList.add('active');
                setTimeout(() => flash.classList.remove('active'), 500);
            }
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        if (this.armor > 0) {
            const absorbed = Math.min(this.armor, amount * 0.6);
            this.armor -= absorbed;
            amount -= absorbed;
        }

        this.health -= amount;
        audioFX.playHurt();

        const overlay = document.getElementById('overlay-flash');
        overlay.classList.add('hurt');
        setTimeout(() => overlay.classList.remove('hurt'), 150);

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }

    addHealth(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.flashPickup();
        audioFX.playPickup();
    }

    addAmmo(amount) {
        const w = this.weapons.getCurrentWeapon();
        if (w.type !== 'melee') {
            w.reserveAmmo = Math.min(w.maxAmmo || 200, w.reserveAmmo + amount);
        }
        this.flashPickup();
        audioFX.playPickup();
    }

    flashPickup() {
        const overlay = document.getElementById('pickup-flash');
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 200);
    }

    showMessage(text) {
        const msg = document.getElementById('game-message');
        msg.innerText = text;
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), 2000);
    }

    update(delta) {
        if (this.isDead) return;

        const speed = (this.isSprinting ? 12 : 7.5) * delta;
        this.velocity.x -= this.velocity.x * 10 * delta;
        this.velocity.z -= this.velocity.z * 10 * delta;

        this.velocity.y -= 25 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            forward.y = 0; forward.normalize();
            this.velocity.addScaledVector(forward, this.direction.z * speed * 30);
        }
        if (this.moveLeft || this.moveRight) {
            const side = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            side.y = 0; side.normalize();
            this.velocity.addScaledVector(side, this.direction.x * speed * 30);
        }

        const oldPos = this.position.clone();
        this.position.x += this.velocity.x * delta;
        this.position.z += this.velocity.z * delta;

        const playerRadius = 0.6;
        const playerBox = new THREE.Box3(
            new THREE.Vector3(this.position.x - playerRadius, 0.2, this.position.z - playerRadius),
            new THREE.Vector3(this.position.x + playerRadius, 3.2, this.position.z + playerRadius)
        );

        const nearbyWalls = this.level.getNearbyWallBoxes(this.position.x, this.position.z);
        for (let i = 0; i < nearbyWalls.length; i++) {
            if (playerBox.intersectsBox(nearbyWalls[i])) {
                this.position.x = oldPos.x;
                this.position.z = oldPos.z;
                break;
            }
        }

        this.position.y += this.velocity.y * delta;
        if (this.position.y <= 1.8) {
            this.position.y = 1.8;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        for (let i = 0; i < this.level.pickups.length; i++) {
            const p = this.level.pickups[i];
            if (!p.collected && this.position.distanceToSquared(p.pos) < 2.25) {
                p.collected = true;
                p.mesh.visible = false;
                if (p.type === 'H') {
                    this.addHealth(30);
                    this.showMessage("+30 HEALTH PACK");
                } else if (p.type === 'A') {
                    this.addAmmo(40);
                    this.showMessage("+40 AMMO CRATE");
                } else if (p.type === 'K1') {
                    this.keys.red = true;
                    document.getElementById('key-red').classList.remove('locked');
                    document.getElementById('key-red').classList.add('unlocked');
                    this.showMessage("ACQUIRED RED KEYCARD!");
                    audioFX.playPickup();
                } else if (p.type === 'K2') {
                    this.keys.gold = true;
                    document.getElementById('key-gold').classList.remove('locked');
                    document.getElementById('key-gold').classList.add('unlocked');
                    this.showMessage("ACQUIRED MASTER GOLD KEY!");
                    audioFX.playPickup();
                }
            }
        }

        const isMoving = (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) && this.isGrounded;
        if (isMoving) {
            this.headBobTimer += delta * 12;
            this.camera.position.y = 1.8 + Math.sin(this.headBobTimer) * 0.06;

            // Trigger Footstep audio on down-stride
            const now = Date.now();
            if (Math.sin(this.headBobTimer) < -0.8 && now - this.lastFootstepTime > 300) {
                this.lastFootstepTime = now;
                audioFX.playFootstep();
            }
        } else {
            this.camera.position.y = 1.8;
        }

        this.weapons.update(delta, isMoving);
    }
}
