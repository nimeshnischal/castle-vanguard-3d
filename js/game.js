// Optimized Game Orchestrator with Boss Logic, Reload HUD, and Muzzle Flash Light Integration
class WolfensteinGame {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.scene = new THREE.Scene();

        this.scene.fog = new THREE.FogExp2(0x0a0806, 0.045);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1.0);

        const ambLight = new THREE.AmbientLight(0x554433, 1.4);
        this.scene.add(ambLight);

        this.level = new LevelManager(this.scene);
        this.level.buildLevel();

        this.weapons = new WeaponManager(this.scene);
        this.player = new Player(this.camera, this.level, this.weapons);
        this.enemies = new EnemyManager(this.scene, this.level, this.player);

        this.player.position.copy(this.level.spawnPositions.player);

        this.clock = new THREE.Clock();
        this.isPaused = true;
        this.difficulty = 'medium';

        this.avatarCanvas = document.getElementById('avatar-canvas');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.lastHudUpdate = 0;

        this.setupEvents();
        this.setupUI();
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !this.isPaused && !this.player.isDead) {
                this.handlePlayerFire();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            }
        });
    }

    setupUI() {
        document.getElementById('btn-start').addEventListener('click', () => {
            audioFX.init();
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('hud-layer').classList.remove('hidden');
            this.isPaused = false;
            this.canvas.requestPointerLock();
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.getAttribute('data-diff');
            });
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            document.getElementById('pause-screen').classList.add('hidden');
            this.isPaused = false;
            this.canvas.requestPointerLock();
        });

        document.getElementById('btn-restart').addEventListener('click', () => window.location.reload());
        document.getElementById('btn-retry').addEventListener('click', () => window.location.reload());
        document.getElementById('btn-play-again').addEventListener('click', () => window.location.reload());

        document.getElementById('toggle-audio').addEventListener('change', (e) => {
            audioFX.enabled = e.target.checked;
        });
    }

    togglePause() {
        if (this.player.isDead) return;
        this.isPaused = !this.isPaused;
        const pauseScreen = document.getElementById('pause-screen');
        if (this.isPaused) {
            pauseScreen.classList.remove('hidden');
            document.exitPointerLock();
        } else {
            pauseScreen.classList.add('hidden');
            this.canvas.requestPointerLock();
        }
    }

    handlePlayerFire() {
        const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const weapon = this.weapons.fire(this.camera.position, camDir);
        if (!weapon) return;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        if (weapon.type === 'rocket') {
            this.enemies.checkWeaponHits(raycaster, weapon.damage, true, 8.0);
        } else {
            this.enemies.checkWeaponHits(raycaster, weapon.damage);
        }
    }

    updateHUD() {
        document.getElementById('hud-health-num').innerText = Math.max(0, Math.floor(this.player.health));
        document.getElementById('hud-health-bar').style.width = `${Math.max(0, this.player.health)}%`;

        document.getElementById('hud-armor-num').innerText = Math.floor(this.player.armor);
        document.getElementById('hud-armor-bar').style.width = `${Math.floor(this.player.armor)}%`;

        document.getElementById('score-val').innerText = String(this.player.score).padStart(6, '0');

        const currentW = this.weapons.getCurrentWeapon();
        document.getElementById('hud-weapon-name').innerText = currentW.name;
        document.getElementById('hud-ammo-clip').innerText = currentW.type === 'melee' ? '∞' : currentW.clipAmmo;
        document.getElementById('hud-ammo-reserve').innerText = currentW.type === 'melee' ? '∞' : currentW.reserveAmmo;

        const now = Date.now();
        if (now - this.lastHudUpdate > 100) {
            this.lastHudUpdate = now;
            TextureGen.renderAvatarFace(this.avatarCanvas, this.player.health, this.weapons.isFiring, false);
            this.renderMinimap();
        }
    }

    renderMinimap() {
        const ctx = this.minimapCanvas.getContext('2d');
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, w, h);

        const scale = w / (this.level.mapWidth * this.level.tileSize);

        ctx.fillStyle = '#4a3b2c';
        for (let r = 0; r < this.level.mapHeight; r++) {
            for (let c = 0; c < this.level.mapWidth; c++) {
                if (this.level.grid[r][c] === 1 || this.level.grid[r][c] === 2) {
                    ctx.fillRect(c * this.level.tileSize * scale, r * this.level.tileSize * scale, this.level.tileSize * scale, this.level.tileSize * scale);
                }
            }
        }

        ctx.fillStyle = '#ff2222';
        for (let i = 0; i < this.enemies.enemies.length; i++) {
            const e = this.enemies.enemies[i];
            if (!e.isDead) {
                const ex = e.group.position.x * scale;
                const ez = e.group.position.z * scale;
                ctx.fillRect(ex - (e.isBoss ? 4 : 2), ez - (e.isBoss ? 4 : 2), e.isBoss ? 8 : 4, e.isBoss ? 8 : 4);
            }
        }

        const px = this.player.position.x * scale;
        const pz = this.player.position.z * scale;
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(px - 3, pz - 3, 6, 6);
    }

    checkWinCondition() {
        const playerPos = this.player.position;
        if (playerPos.x > 70 && playerPos.z > 70) {
            this.isPaused = true;
            document.exitPointerLock();
            document.getElementById('victory-screen').classList.remove('hidden');
            document.getElementById('victory-stats').innerHTML = `
                <p>FINAL SCORE: ${this.player.score}</p>
                <p>SECRETS FOUND: ${this.level.secretsFound} / ${this.level.totalSecrets}</p>
                <p>HEALTH REMAINING: ${Math.floor(this.player.health)}%</p>
                <p>ENEMIES DEFEATED: ${this.enemies.enemies.filter(e => e.isDead).length} / ${this.enemies.enemies.length}</p>
            `;
        }
    }

    checkGameOver() {
        if (this.player.isDead) {
            this.isPaused = true;
            document.exitPointerLock();
            document.getElementById('gameover-screen').classList.remove('hidden');
            document.getElementById('death-stats').innerHTML = `
                <p>FINAL SCORE: ${this.player.score}</p>
                <p>SECRETS FOUND: ${this.level.secretsFound} / ${this.level.totalSecrets}</p>
                <p>KILLS: ${this.enemies.enemies.filter(e => e.isDead).length}</p>
            `;
        }
    }

    startLoop() {
        const loop = () => {
            requestAnimationFrame(loop);

            const delta = Math.min(this.clock.getDelta(), 0.05);

            if (!this.isPaused && !this.player.isDead) {
                if (this.weapons.isFiring && this.weapons.getCurrentWeapon().type === 'auto') {
                    this.handlePlayerFire();
                }

                this.level.update(delta);
                this.player.update(delta);
                this.enemies.update(delta);
                this.updateHUD();

                this.checkWinCondition();
                this.checkGameOver();
            }

            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new WolfensteinGame();
    game.startLoop();
});
