// Enemy Manager with Uber-Soldat Boss, German Voice Barks, and Explosive Barrel Collisions
class EnemyManager {
    constructor(scene, levelManager, player) {
        this.scene = scene;
        this.level = levelManager;
        this.player = player;
        this.enemies = [];

        this.initEnemies();
    }

    initEnemies() {
        this.level.spawnPositions.enemies.forEach((spawn, idx) => {
            const enemy = this.createEnemyMesh(spawn.type, spawn.pos, idx);
            this.enemies.push(enemy);
        });
    }

    createEnemyMesh(typeStr, pos, id) {
        const group = new THREE.Group();
        group.position.copy(pos);

        let color, hp, speed, attackDamage, isBoss = false, isMutant = false;

        if (typeStr === 'E1') { // Guard Soldier
            color = 0x556b2f; hp = 50; speed = 3.5; attackDamage = 10;
        } else if (typeStr === 'E2') { // SS Officer
            color = 0x111111; hp = 90; speed = 4.5; attackDamage = 18;
        } else if (typeStr === 'BOSS') { // Cybernetic Uber-Soldat Boss
            color = 0x334455; hp = 400; speed = 2.2; attackDamage = 35; isBoss = true;
        } else { // Mutant Monster
            color = 0x8b0000; hp = 150; speed = 2.8; attackDamage = 25; isMutant = true;
        }

        const scaleMultiplier = isBoss ? 1.8 : 1.0;

        // Body Cylinder Mesh
        const bodyGeo = new THREE.CylinderGeometry(0.5 * scaleMultiplier, 0.5 * scaleMultiplier, 2.4 * scaleMultiplier, 12);
        const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.2 * scaleMultiplier;
        group.add(body);

        // Head Box Mesh with glowing eyes
        const headGeo = new THREE.BoxGeometry(0.5 * scaleMultiplier, 0.5 * scaleMultiplier, 0.5 * scaleMultiplier);
        const headMat = new THREE.MeshStandardMaterial({ color: isBoss ? 0x222222 : (isMutant ? 0x440000 : 0xf0b080) });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.6 * scaleMultiplier;
        group.add(head);

        // Glowing red eyes
        const eyeGeo = new THREE.SphereGeometry(0.08 * scaleMultiplier, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
        const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
        eye1.position.set(-0.15 * scaleMultiplier, 2.65 * scaleMultiplier, 0.25 * scaleMultiplier);
        eye2.position.set(0.15 * scaleMultiplier, 2.65 * scaleMultiplier, 0.25 * scaleMultiplier);
        group.add(eye1);
        group.add(eye2);

        this.scene.add(group);

        return {
            id: id,
            group: group,
            type: typeStr,
            isBoss: isBoss,
            hp: hp,
            maxHp: hp,
            speed: speed,
            attackDamage: attackDamage,
            state: 'PATROL',
            lastAttackTime: 0,
            patrolDir: new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize(),
            isDead: false
        };
    }

    takeDamage(enemy, damage) {
        if (enemy.isDead) return;

        enemy.hp -= damage;
        enemy.state = 'CHASE';

        if (enemy.isBoss) {
            document.getElementById('boss-bar-container').classList.remove('hidden');
            const pct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
            document.getElementById('boss-bar-inner').style.width = `${pct}%`;
        }

        if (enemy.hp <= 0) {
            enemy.hp = 0;
            enemy.isDead = true;
            enemy.state = 'DEAD';

            enemy.group.rotation.x = Math.PI / 2;
            enemy.group.position.y = 0.3;

            if (enemy.isBoss) {
                document.getElementById('boss-bar-container').classList.add('hidden');
                this.player.score += 2500;
                this.player.showMessage("UBER-SOLDAT BOSS DEFEATED! +2500 PTS");
            } else {
                this.player.score += (enemy.type === 'E3' ? 500 : (enemy.type === 'E2' ? 300 : 100));
                this.player.showMessage(`ENEMY KILLED!`);
            }

            this.level.createPickup(enemy.group.position.x, enemy.group.position.z, Math.random() > 0.5 ? 'A' : 'H');
        }
    }

    update(delta) {
        const playerPos = this.player.position;

        this.enemies.forEach(enemy => {
            if (enemy.isDead) return;

            const enemyPos = enemy.group.position;
            const distToPlayer = enemyPos.distanceTo(playerPos);

            enemy.group.lookAt(playerPos.x, enemyPos.y, playerPos.z);

            if (enemy.state === 'PATROL') {
                if (distToPlayer < 15) {
                    enemy.state = 'CHASE';
                    audioFX.playGermanBark();

                    if (enemy.isBoss) {
                        document.getElementById('boss-bar-container').classList.remove('hidden');
                        this.player.showMessage("WARNING: UBER-SOLDAT ENGAGED!");
                    }
                } else {
                    enemyPos.addScaledVector(enemy.patrolDir, enemy.speed * 0.4 * delta);
                }
            } else if (enemy.state === 'CHASE') {
                if (distToPlayer < (enemy.isBoss ? 4.5 : 3.0)) {
                    enemy.state = 'ATTACK';
                } else {
                    const dir = new THREE.Vector3().subVectors(playerPos, enemyPos);
                    dir.y = 0;
                    dir.normalize();
                    enemyPos.addScaledVector(dir, enemy.speed * delta);
                }
            } else if (enemy.state === 'ATTACK') {
                if (distToPlayer > (enemy.isBoss ? 5.5 : 3.5)) {
                    enemy.state = 'CHASE';
                } else {
                    const now = Date.now();
                    const cd = enemy.isBoss ? 600 : 1000;
                    if (now - enemy.lastAttackTime > cd) {
                        enemy.lastAttackTime = now;
                        this.player.takeDamage(enemy.attackDamage);
                    }
                }
            }
        });
    }

    checkWeaponHits(raycaster, damage, isSplash = false, splashRadius = 0) {
        // Check Enemies
        this.enemies.forEach(enemy => {
            if (enemy.isDead) return;

            if (isSplash) {
                const dist = enemy.group.position.distanceTo(this.player.position);
                if (dist < splashRadius) {
                    this.takeDamage(enemy, damage * (1 - dist / splashRadius));
                }
            } else {
                const intersects = raycaster.intersectObject(enemy.group, true);
                if (intersects.length > 0 && intersects[0].distance < 30) {
                    this.takeDamage(enemy, damage);
                }
            }
        });

        // Check Explosive Barrels
        this.level.barrels.forEach(b => {
            if (b.isExploded) return;
            const intersects = raycaster.intersectObject(b.mesh);
            if (intersects.length > 0 && intersects[0].distance < 25) {
                b.hp -= damage;
                if (b.hp <= 0) {
                    b.isExploded = true;
                    b.mesh.visible = false;
                    audioFX.playExplosion();

                    // Area Splash Damage from Barrel Explosion
                    const barrelPos = b.pos;
                    if (this.player.position.distanceTo(barrelPos) < 6.0) {
                        this.player.takeDamage(40);
                    }
                    this.enemies.forEach(e => {
                        if (!e.isDead && e.group.position.distanceTo(barrelPos) < 6.0) {
                            this.takeDamage(e, 100);
                        }
                    });
                }
            }
        });
    }
}
