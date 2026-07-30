// Procedural Canvas Texture Generator for Wolfenstein 3D Web Edition
const TextureGen = {
    cache: {},

    // Helper: Create a Canvas element
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return { canvas, ctx: canvas.getContext('2d') };
    },

    // 1. Stone Wall with Brick Mortar & Moss/Cracks
    createStoneWall() {
        if (this.cache.stoneWall) return this.cache.stoneWall;
        const { canvas, ctx } = this.createCanvas(512, 512);

        // Base dark grey background
        ctx.fillStyle = '#2b2b2e';
        ctx.fillRect(0, 0, 512, 512);

        // Brick pattern setup
        const rows = 16;
        const cols = 8;
        const rowH = 512 / rows;
        const colW = 512 / cols;

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#151517';

        for (let r = 0; r < rows; r++) {
            const offset = (r % 2 === 0) ? 0 : colW / 2;
            for (let c = -1; c <= cols; c++) {
                const x = c * colW + offset;
                const y = r * rowH;

                // Random stone shade variation
                const shade = Math.floor(45 + Math.random() * 40);
                const rG = shade + Math.floor(Math.random() * 8);
                const bG = shade + Math.floor(Math.random() * 12);
                ctx.fillStyle = `rgb(${shade},${rG},${bG})`;
                ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

                // Texture noise inside stone
                for (let i = 0; i < 40; i++) {
                    const nx = x + Math.random() * colW;
                    const ny = y + Math.random() * rowH;
                    const size = Math.random() * 4 + 1;
                    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)';
                    ctx.fillRect(nx, ny, size, size);
                }

                // Mortar lines
                ctx.strokeRect(x, y, colW, rowH);
            }
        }

        // Add some green moss patches
        ctx.fillStyle = 'rgba(40, 70, 30, 0.35)';
        for (let i = 0; i < 15; i++) {
            const mx = Math.random() * 512;
            const my = Math.random() * 512;
            const mr = Math.random() * 40 + 10;
            ctx.beginPath();
            ctx.arc(mx, my, mr, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.cache.stoneWall = texture;
        return texture;
    },

    // 2. Castle Flag / Eagle Banner Wall
    createBannerWall() {
        if (this.cache.bannerWall) return this.cache.bannerWall;
        const { canvas, ctx } = this.createCanvas(512, 512);

        // Start with base stone wall canvas
        const baseTexture = this.createStoneWall();
        ctx.drawImage(baseTexture.image, 0, 0);

        // Draw Gothic Crimson Banner
        const bx = 128;
        const by = 40;
        const bw = 256;
        const bh = 400;

        ctx.fillStyle = '#8b0000';
        ctx.fillRect(bx, by, bw, bh);

        // Banner gold border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 8;
        ctx.strokeRect(bx, by, bw, bh);

        // Banner Emblem: Gold Circle with Eagle Crest
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(256, 200, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.font = 'bold 50px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 256, 200);

        // Banner fringe bottom
        ctx.fillStyle = '#d4af37';
        for (let x = bx; x < bx + bw; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, by + bh);
            ctx.lineTo(x + 8, by + bh + 25);
            ctx.lineTo(x + 16, by + bh);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.cache.bannerWall = texture;
        return texture;
    },

    // 3. Heavy Iron Gate Door
    createIronDoor() {
        if (this.cache.ironDoor) return this.cache.ironDoor;
        const { canvas, ctx } = this.createCanvas(512, 512);

        // Dark metallic background
        ctx.fillStyle = '#1a1a1d';
        ctx.fillRect(0, 0, 512, 512);

        // Outer Frame
        ctx.fillStyle = '#3a3a40';
        ctx.fillRect(0, 0, 512, 30);
        ctx.fillRect(0, 482, 512, 30);
        ctx.fillRect(0, 0, 30, 512);
        ctx.fillRect(482, 0, 30, 512);

        // Iron Bars & Rivets
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#4a4a50';
        for (let x = 60; x < 480; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 30);
            ctx.lineTo(x, 482);
            ctx.stroke();

            // Rivets
            ctx.fillStyle = '#8a8a95';
            ctx.beginPath();
            ctx.arc(x, 60, 6, 0, Math.PI * 2);
            ctx.arc(x, 256, 6, 0, Math.PI * 2);
            ctx.arc(x, 450, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Lock Mechanism Box
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(236, 226, 60, 60);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(266, 250, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(263, 250, 6, 18);

        const texture = new THREE.CanvasTexture(canvas);
        this.cache.ironDoor = texture;
        return texture;
    },

    // 4. Dungeon Floor Stone Tile
    createFloorTile() {
        if (this.cache.floorTile) return this.cache.floorTile;
        const { canvas, ctx } = this.createCanvas(256, 256);

        ctx.fillStyle = '#1c1c1e';
        ctx.fillRect(0, 0, 256, 256);

        // Grid lines
        ctx.strokeStyle = '#0d0d0f';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 256, 256);
        ctx.strokeRect(0, 0, 128, 128);
        ctx.strokeRect(128, 128, 128, 128);

        // Subtle noise
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.1)';
            ctx.fillRect(x, y, 3, 3);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.cache.floorTile = texture;
        return texture;
    },

    // 5. Dungeon Ceiling Wooden Beams
    createCeilingTile() {
        if (this.cache.ceilingTile) return this.cache.ceilingTile;
        const { canvas, ctx } = this.createCanvas(256, 256);

        ctx.fillStyle = '#150f0a';
        ctx.fillRect(0, 0, 256, 256);

        // Wood grain
        ctx.fillStyle = '#261b12';
        for (let y = 0; y < 256; y += 32) {
            ctx.fillRect(0, y, 256, 28);
        }

        ctx.strokeStyle = '#0a0704';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.cache.ceilingTile = texture;
        return texture;
    },

    // 6. BJ Blazkowicz Animated HUD Avatar Expressions
    renderAvatarFace(canvas, healthPercent, isFiring, isHurt) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 64, 64);

        // Background Box
        ctx.fillStyle = '#221915';
        ctx.fillRect(0, 0, 64, 64);

        // Skin Tone
        ctx.fillStyle = isHurt ? '#e06060' : '#f0b080';
        ctx.fillRect(16, 12, 32, 40);

        // Hair (Blonde Retro Hair cut)
        ctx.fillStyle = '#d4a030';
        ctx.fillRect(14, 8, 36, 10);
        ctx.fillRect(12, 12, 6, 12);
        ctx.fillRect(46, 12, 6, 12);

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, 24, 8, 6);
        ctx.fillRect(36, 24, 8, 6);

        ctx.fillStyle = '#2060b0'; // Blue pupils
        const pupilOffset = isFiring ? 0 : (Math.sin(Date.now() * 0.003) > 0 ? 2 : -2);
        ctx.fillRect(22 + pupilOffset, 25, 4, 4);
        ctx.fillRect(38 + pupilOffset, 25, 4, 4);

        // Eyebrows
        ctx.fillStyle = '#a07020';
        if (isFiring) {
            ctx.beginPath();
            ctx.moveTo(18, 20); ctx.lineTo(28, 23);
            ctx.moveTo(46, 20); ctx.lineTo(36, 23);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#a07020';
            ctx.stroke();
        } else {
            ctx.fillRect(19, 21, 10, 2);
            ctx.fillRect(35, 21, 10, 2);
        }

        // Nose
        ctx.fillStyle = '#c08060';
        ctx.fillRect(30, 30, 4, 8);

        // Mouth
        ctx.fillStyle = '#501010';
        if (isFiring) {
            ctx.fillRect(24, 42, 16, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(26, 43, 12, 2);
        } else if (healthPercent < 30) {
            ctx.fillRect(24, 44, 16, 4);
        } else {
            ctx.fillRect(26, 43, 12, 2);
        }

        // Blood stains at low health
        if (healthPercent < 60) {
            ctx.fillStyle = 'rgba(160, 0, 0, 0.7)';
            ctx.fillRect(22, 28, 4, 12);
        }
        if (healthPercent < 30) {
            ctx.fillStyle = 'rgba(180, 0, 0, 0.85)';
            ctx.fillRect(36, 36, 8, 10);
            ctx.fillRect(18, 40, 6, 8);
        }
    }
};
