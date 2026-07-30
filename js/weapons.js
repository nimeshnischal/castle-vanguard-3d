// Weapon Manager with Original IP Weapon Names
class WeaponManager {
    constructor(scene) {
        this.scene = scene;

        this.weapons = {
            1: { id: 1, name: 'COMBAT BLADE', clipAmmo: Infinity, reserveAmmo: Infinity, clipSize: Infinity, damage: 35, fireRate: 350, type: 'melee' },
            2: { id: 2, name: 'TACTICAL PISTOL', clipAmmo: 8, reserveAmmo: 40, clipSize: 8, damage: 25, fireRate: 280, type: 'semi' },
            3: { id: 3, name: 'STORM SMG', clipAmmo: 30, reserveAmmo: 120, clipSize: 30, damage: 18, fireRate: 110, type: 'auto' },
            4: { id: 4, name: 'ROCKET LAUNCHER', clipAmmo: 1, reserveAmmo: 4, clipSize: 1, damage: 150, fireRate: 1200, type: 'rocket' },
            5: { id: 5, name: 'FLAMETHROWER', clipAmmo: 50, reserveAmmo: 150, clipSize: 50, damage: 14, fireRate: 80, type: 'flame' }
        };

        this.currentId = 3;
        this.isFiring = false;
        this.isReloading = false;
        this.lastFireTime = 0;
        this.recoilOffset = 0;
        this.swayAngle = 0;

        this.canvas = document.getElementById('weapon-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.muzzleLight = new THREE.PointLight(0xffaa00, 0, 15);
        if (this.scene) {
            this.scene.add(this.muzzleLight);
        }
    }

    getCurrentWeapon() {
        return this.weapons[this.currentId];
    }

    switchWeapon(id) {
        if (this.weapons[id] && !this.isReloading) {
            this.currentId = id;
            return true;
        }
        return false;
    }

    reload() {
        const w = this.getCurrentWeapon();
        if (w.type === 'melee' || this.isReloading) return;
        if (w.clipAmmo === w.clipSize || w.reserveAmmo <= 0) return;

        this.isReloading = true;
        audioFX.playReload();

        setTimeout(() => {
            const needed = w.clipSize - w.clipAmmo;
            const added = Math.min(needed, w.reserveAmmo);
            w.clipAmmo += added;
            w.reserveAmmo -= added;
            this.isReloading = false;
        }, 1000);
    }

    canFire() {
        const w = this.getCurrentWeapon();
        const now = Date.now();
        if (this.isReloading) return false;
        if (now - this.lastFireTime < w.fireRate) return false;
        if (w.type !== 'melee' && w.clipAmmo <= 0) {
            audioFX.playEmptyClick();
            document.getElementById('reload-prompt').classList.remove('hidden');
            return false;
        }
        document.getElementById('reload-prompt').classList.add('hidden');
        return true;
    }

    fire(cameraPos, cameraDir) {
        if (!this.canFire()) return null;

        const w = this.getCurrentWeapon();
        this.lastFireTime = Date.now();
        this.recoilOffset = 18;

        if (w.type !== 'melee') {
            w.clipAmmo--;
        }

        if (this.muzzleLight && cameraPos) {
            this.muzzleLight.position.copy(cameraPos).addScaledVector(cameraDir, 1.2);
            this.muzzleLight.intensity = 3.5;
            setTimeout(() => { this.muzzleLight.intensity = 0; }, 50);
        }

        switch (w.id) {
            case 1: audioFX.playKnife(); break;
            case 2: audioFX.playPistol(); break;
            case 3: audioFX.playSMG(); break;
            case 4: audioFX.playExplosion(); break;
            case 5: audioFX.playFlame(); break;
        }

        const ch = document.getElementById('crosshair');
        ch.classList.add('firing');
        setTimeout(() => ch.classList.remove('firing'), 80);

        return w;
    }

    update(delta, isMoving) {
        if (this.recoilOffset > 0) {
            this.recoilOffset -= delta * 100;
            if (this.recoilOffset < 0) this.recoilOffset = 0;
        }

        if (isMoving) {
            this.swayAngle += delta * 8;
        } else {
            this.swayAngle = 0;
        }

        this.render();
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const w = this.getCurrentWeapon();
        const centerX = this.canvas.width / 2 + Math.sin(this.swayAngle) * 8;
        const centerY = this.canvas.height - 20 + Math.abs(Math.cos(this.swayAngle)) * 5 + this.recoilOffset + (this.isReloading ? 80 : 0);

        ctx.save();
        ctx.translate(centerX, centerY);

        const isMuzzleFlash = (Date.now() - this.lastFireTime) < 50 && w.type !== 'melee';

        switch (w.id) {
            case 1: this.drawKnife(ctx); break;
            case 2: this.drawPistol(ctx, isMuzzleFlash); break;
            case 3: this.drawMP40(ctx, isMuzzleFlash); break;
            case 4: this.drawPanzerfaust(ctx, isMuzzleFlash); break;
            case 5: this.drawFlamethrower(ctx, isMuzzleFlash); break;
        }

        ctx.restore();
    }

    drawKnife(ctx) {
        ctx.fillStyle = '#f0b080';
        ctx.fillRect(-20, -50, 25, 70);

        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(-8, -50);
        ctx.lineTo(-2, -110);
        ctx.lineTo(12, -100);
        ctx.lineTo(5, -50);
        ctx.fill();
    }

    drawPistol(ctx, isFlash) {
        ctx.fillStyle = '#4a3b32';
        ctx.fillRect(-12, -40, 24, 60);

        ctx.fillStyle = '#222';
        ctx.fillRect(-8, -80, 16, 45);
        ctx.fillStyle = '#444';
        ctx.fillRect(-5, -110, 10, 35);

        if (isFlash) this.drawMuzzleFlash(ctx, 0, -120, 25);
    }

    drawMP40(ctx, isFlash) {
        ctx.fillStyle = '#f0b080';
        ctx.fillRect(-30, -45, 22, 60);
        ctx.fillRect(8, -35, 22, 60);

        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(-10, -115, 20, 85);
        ctx.fillStyle = '#333';
        ctx.fillRect(-4, -145, 8, 40);
        ctx.fillRect(-6, -90, 12, 55);

        if (isFlash) this.drawMuzzleFlash(ctx, 0, -160, 40);
    }

    drawPanzerfaust(ctx, isFlash) {
        ctx.fillStyle = '#556b2f';
        ctx.fillRect(-18, -130, 36, 120);

        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(0, -130, 22, 0, Math.PI, true);
        ctx.fill();

        if (isFlash) this.drawMuzzleFlash(ctx, 0, -155, 70);
    }

    drawFlamethrower(ctx, isFlash) {
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(-15, -110, 30, 90);
        ctx.fillStyle = '#222';
        ctx.fillRect(-8, -135, 16, 30);

        if (isFlash || (this.isFiring && Date.now() - this.lastFireTime < 120)) {
            const grad = ctx.createRadialGradient(0, -160, 5, 0, -160, 45);
            grad.addColorStop(0, '#ffff00');
            grad.addColorStop(0.4, '#ff6600');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, -160, 45 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMuzzleFlash(ctx, x, y, radius) {
        const grad = ctx.createRadialGradient(x, y, 3, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffcc00');
        grad.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
