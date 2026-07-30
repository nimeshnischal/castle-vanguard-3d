// Level Manager with Secret Push-Walls, Explosive Barrels, and Boss Arena
class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 4;
        this.wallHeight = 4;
        this.mapWidth = 20;
        this.mapHeight = 20;

        this.walls = [];
        this.doors = [];
        this.secretWalls = [];
        this.barrels = [];
        this.torches = [];
        this.pickups = [];

        this.secretsFound = 0;
        this.totalSecrets = 2;

        // Grid Map: 
        // 1 = Stone Wall, 2 = Banner Wall, 3 = Red Door, 4 = Gold Door, 5 = Secret Push Wall
        // B = Explosive Barrel, BOSS = Uber-Soldat Boss Spawn
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 'P', 0, 'B', 1, 0, 0, 0, 1, 0, 'E1', 0, 0, 0, 1, 0, 0, 0, 'K1', 1],
            [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
            [1, 0, 'H', 0, 3, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3, 0, 0, 0, 'A', 1],
            [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 'B', 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 0, 0, 2, 0, 2, 0, 0, 1, 1, 0, 1, 5, 1, 1],
            [1, 0, 1, 'E2', 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 'E1', 0, 0, 'H', 0, 1],
            [1, 0, 1, 0, 'A', 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 'H', 0, 1, 0, 1],
            [1, 0, 1, 1, 0, 1, 0, 1, 'BOSS', 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 'E3', 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1],
            [1, 0, 0, 1, 0, 0, 0, 1, 1, 3, 1, 1, 0, 0, 0, 1, 'A', 0, 0, 1],
            [1, 0, 'H', 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 'H', 0, 1],
            [1, 0, 'B', 0, 0, 1, 0, 1, 1, 2, 1, 1, 0, 1, 5, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0, 1, 0, 1, 'K2', 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 'A', 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 'EXIT', 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];

        this.spawnPositions = {
            player: new THREE.Vector3(6, 1.8, 6),
            enemies: [],
        };
    }

    buildLevel() {
        const stoneTex = TextureGen.createStoneWall();
        const bannerTex = TextureGen.createBannerWall();
        const ironDoorTex = TextureGen.createIronDoor();
        const floorTex = TextureGen.createFloorTile();
        const ceilingTex = TextureGen.createCeilingTile();

        floorTex.repeat.set(10, 10);
        ceilingTex.repeat.set(10, 10);

        const floorGeo = new THREE.PlaneGeometry(this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
        const floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.set((this.mapWidth * this.tileSize) / 2, 0, (this.mapHeight * this.tileSize) / 2);
        this.scene.add(floorMesh);

        const ceilingMat = new THREE.MeshLambertMaterial({ map: ceilingTex });
        const ceilingMesh = new THREE.Mesh(floorGeo, ceilingMat);
        ceilingMesh.rotation.x = Math.PI / 2;
        ceilingMesh.position.set((this.mapWidth * this.tileSize) / 2, this.wallHeight, (this.mapHeight * this.tileSize) / 2);
        this.scene.add(ceilingMesh);

        const wallGeo = new THREE.BoxGeometry(this.tileSize, this.wallHeight, this.tileSize);
        const stoneMat = new THREE.MeshLambertMaterial({ map: stoneTex });
        const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });

        let torchCount = 0;

        for (let r = 0; r < this.mapHeight; r++) {
            for (let c = 0; c < this.mapWidth; c++) {
                const cell = this.grid[r][c];
                const x = c * this.tileSize + this.tileSize / 2;
                const z = r * this.tileSize + this.tileSize / 2;

                if (cell === 1 || cell === 2) {
                    const mat = (cell === 2) ? bannerMat : stoneMat;
                    const wall = new THREE.Mesh(wallGeo, mat);
                    wall.position.set(x, this.wallHeight / 2, z);
                    this.scene.add(wall);

                    const bbox = new THREE.Box3().setFromObject(wall);
                    this.walls.push({ bbox, r, c });

                    if (torchCount < 6 && Math.random() < 0.2) {
                        this.createWallTorch(x, z);
                        torchCount++;
                    }
                } else if (cell === 5) {
                    // Secret Push Wall
                    const wall = new THREE.Mesh(wallGeo, stoneMat);
                    wall.position.set(x, this.wallHeight / 2, z);
                    this.scene.add(wall);

                    const secObj = {
                        mesh: wall,
                        isMoving: false,
                        isOpen: false,
                        gridPos: { r, c },
                        bbox: new THREE.Box3().setFromObject(wall)
                    };
                    this.secretWalls.push(secObj);
                    this.walls.push({ bbox: secObj.bbox, r, c, secret: secObj });
                } else if (cell === 3 || cell === 4) {
                    const doorGeo = new THREE.BoxGeometry(this.tileSize, this.wallHeight, 0.4);
                    const doorMat = new THREE.MeshLambertMaterial({ map: ironDoorTex });
                    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
                    doorMesh.position.set(x, this.wallHeight / 2, z);
                    this.scene.add(doorMesh);

                    const doorObj = {
                        mesh: doorMesh,
                        type: cell === 3 ? 'red' : 'gold',
                        isOpen: false,
                        gridPos: { r, c },
                        bbox: new THREE.Box3().setFromObject(doorMesh)
                    };
                    this.doors.push(doorObj);
                    this.walls.push({ bbox: doorObj.bbox, r, c, door: doorObj });
                } else if (cell === 'B') {
                    this.createBarrel(x, z);
                } else if (cell === 'P') {
                    this.spawnPositions.player.set(x, 1.8, z);
                } else if (typeof cell === 'string' && (cell.startsWith('E') || cell === 'BOSS')) {
                    this.spawnPositions.enemies.push({
                        type: cell,
                        pos: new THREE.Vector3(x, 0, z)
                    });
                } else if (cell === 'H' || cell === 'A' || cell === 'K1' || cell === 'K2') {
                    this.createPickup(x, z, cell);
                }
            }
        }
    }

    createBarrel(x, z) {
        const geo = new THREE.CylinderGeometry(0.6, 0.6, 1.6, 12);
        const mat = new THREE.MeshLambertMaterial({ color: 0xaa2211 }); // Hazardous Red
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0.8, z);
        this.scene.add(mesh);

        this.barrels.push({
            mesh: mesh,
            hp: 20,
            pos: new THREE.Vector3(x, 0.8, z),
            isExploded: false
        });
    }

    createWallTorch(x, z) {
        const torchGroup = new THREE.Group();
        torchGroup.position.set(x, 2.2, z);

        const flameGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(0, 0.4, 0);
        torchGroup.add(flame);

        const fireLight = new THREE.PointLight(0xff7700, 1.8, 10);
        fireLight.position.set(0, 0.4, 0);
        torchGroup.add(fireLight);

        this.scene.add(torchGroup);
        this.torches.push({ light: fireLight, flame: flame });
    }

    createPickup(x, z, type) {
        let geo, mat;
        if (type === 'H') {
            geo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
            mat = new THREE.MeshLambertMaterial({ color: 0xdd2222 });
        } else if (type === 'A') {
            geo = new THREE.BoxGeometry(0.7, 0.5, 0.5);
            mat = new THREE.MeshLambertMaterial({ color: 0x228822 });
        } else {
            geo = new THREE.TorusGeometry(0.3, 0.08, 6, 12);
            mat = new THREE.MeshStandardMaterial({ color: type === 'K1' ? 0xff2222 : 0xffd700 });
        }

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0.8, z);
        this.scene.add(mesh);

        this.pickups.push({
            mesh: mesh,
            type: type,
            pos: new THREE.Vector3(x, 0.8, z),
            collected: false
        });
    }

    getNearbyWallBoxes(playerX, playerZ) {
        const pR = Math.floor(playerZ / this.tileSize);
        const pC = Math.floor(playerX / this.tileSize);
        const nearby = [];

        for (let w of this.walls) {
            if (Math.abs(w.r - pR) <= 1 && Math.abs(w.c - pC) <= 1) {
                if ((!w.door || !w.door.isOpen) && (!w.secret || !w.secret.isOpen)) {
                    nearby.push(w.bbox);
                }
            }
        }
        return nearby;
    }

    update(delta) {
        const time = Date.now() * 0.004;
        for (let i = 0; i < this.torches.length; i++) {
            const t = this.torches[i];
            t.light.intensity = 1.6 + Math.sin(time + i) * 0.3;
        }

        // Secret Wall Sliding Animation
        for (let i = 0; i < this.secretWalls.length; i++) {
            const sec = this.secretWalls[i];
            if (sec.isMoving) {
                sec.mesh.position.z += delta * 2.0;
                sec.bbox.setFromObject(sec.mesh);
                if (sec.mesh.position.z >= (sec.gridPos.r * this.tileSize + this.tileSize / 2 + 4.0)) {
                    sec.isMoving = false;
                    sec.isOpen = true;
                }
            }
        }

        for (let i = 0; i < this.pickups.length; i++) {
            const p = this.pickups[i];
            if (!p.collected) {
                p.mesh.rotation.y += delta * 1.5;
            }
        }
    }
}
