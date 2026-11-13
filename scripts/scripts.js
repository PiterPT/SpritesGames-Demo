/**
 * ============================================================================
 * GUARDIÃO DAS RUNAS - MOTOR DE ANIMAÇÃO POR IMAGENS (ORDEM ALFABÉTICA)
 * ============================================================================
 * Como configurar as tuas imagens:
 * Em ANIM_CONFIG.states, define para cada estado (IDLE, WALK, RUN, ATTACK):
 *   - folder: pasta onde estão as imagens (ex: 'sprites/')
 *   - startImage: nome do ficheiro inicial (ex: 'idle_01.png')
 *   - endImage: nome do ficheiro final (ex: 'idle_04.png')
 *   - allFiles: lista dos ficheiros disponíveis nessa pasta.
 *
 * O ImageSequenceLoader filtra automaticamente todos os ficheiros cujo nome
 * esteja entre `startImage` e `endImage` e ordena-os alfabeticamente
 * (usando ordenação natural, ex: frame_2 antes de frame_10).
 */

const ANIM_CONFIG = {
    frameWidth: 96,
    frameHeight: 96,
    states: {
        IDLE: {
            row: 0,
            folder: 'sprites/NarutoOnline/Outdoor/',
            startImage: '22.png',
            endImage: '24.png',
            // Coloca aqui os nomes dos ficheiros da pasta (ou deixe o filtro selecionar entre início e fim)
            allFiles: [
                '22.png',
                '23.png',
                '24.png'
                

            ],
            fps: 6,
            loop: true,
            label: 'PARADO (Idle)',
            cssClass: 'idle'
        },
        WALK: {
            row: 1,
            folder: 'sprites/NarutoOnline/Outdoor/',
            startImage: '28.png',
            endImage: '32.png',
            allFiles: [
                '28.png',
                '29.png',
                '30.png',
                '31.png',
                '32.png'
                
            ],
            fps: 10,
            loop: true,
            label: 'ANDANDO (Walk)',
            cssClass: 'walk'
        },
        RUN: {
            row: 2,
            folder: 'sprites/NarutoOnline/Outdoor/',
            startImage: '50.png',
            endImage: '56.png',
            allFiles: [
                '50.png',
                '51.png',
                '52.png',
                '53.png',
                '54.png',
                '55.png',
                '56.png'

            ],
            fps: 16,
            loop: true,
            label: 'CORRENDO (Run)',
            cssClass: 'run'
        },
        ATTACK: {
            row: 3,
            folder: 'sprites/NarutoOnline/Battle/',
            startImage: '0.png',
            endImage: '4.png',
            allFiles: [
                '0.png',
                '1.png',
                '2.png',
                '3.png',
                '4.png'
            ],
            fps: 18,
            loop: false,
            label: 'ATACANDO (Attack)',
            cssClass: 'attack'
        }
    }
};

/**
 * 1. CARREGADOR DE SEQUÊNCIAS DE IMAGENS POR ORDEM ALFABÉTICA
 * Filtra as imagens entre `startImage` e `endImage` e ordena-as alfabeticamente.
 * Caso alguma imagem ainda não exista na pasta local, gera um placeholder visual
 * com o nome do ficheiro para não quebrar o jogo durante os testes.
 */
class ImageSequenceLoader {
    constructor() {
        this.sequences = {}; // { IDLE: [{ name, img, loaded }], ... }
        this.maxCols = 1;
        this.initAllSequences();
    }

    // Ordenação alfabética natural (ex: img2.png antes de img10.png)
    naturalCompare(a, b) {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    }

    resolveOrderedFiles(stateCfg) {
        const { startImage, endImage, allFiles } = stateCfg;

        // Garante que início e fim estão incluídos na lista de candidatos
        const candidates = Array.from(new Set([startImage, ...allFiles, endImage]));

        // Filtra apenas os ficheiros que estão alfabeticamente entre startImage e endImage
        const filtered = candidates.filter(fileName => {
            return this.naturalCompare(fileName, startImage) >= 0 &&
                   this.naturalCompare(fileName, endImage) <= 0;
        });

        // Ordena alfabeticamente do início ao fim
        filtered.sort((a, b) => this.naturalCompare(a, b));
        return filtered;
    }

    initAllSequences() {
        Object.keys(ANIM_CONFIG.states).forEach(stateKey => {
            const cfg = ANIM_CONFIG.states[stateKey];
            const orderedNames = this.resolveOrderedFiles(cfg);

            if (orderedNames.length > this.maxCols) {
                this.maxCols = orderedNames.length;
            }

            this.sequences[stateKey] = orderedNames.map((fileName, idx) => {
                const entry = {
                    name: fileName,
                    path: cfg.folder + fileName,
                    img: new Image(),
                    loaded: false,
                    error: false,
                    fallbackCanvas: this.createFallbackSprite(stateKey, fileName, idx, orderedNames.length)
                };

                entry.img.onload = () => {
                    entry.loaded = true;
                };
                entry.img.onerror = () => {
                    entry.error = true;
                    console.warn(`[Sprites] Imagem não encontrada: ${entry.path} (a usar placeholder até adicionares o ficheiro).`);
                };
                entry.img.src = entry.path;

                return entry;
            });
        });
    }

    // Placeholder visual caso o utilizador abra o jogo antes de colocar os PNGs na pasta
    createFallbackSprite(stateKey, fileName, idx, total) {
        const c = document.createElement('canvas');
        c.width = ANIM_CONFIG.frameWidth;
        c.height = ANIM_CONFIG.frameHeight;
        const ctx = c.getContext('2d');

        const colors = {
            IDLE: '#38bdf8',
            WALK: '#34d399',
            RUN: '#fbbf24',
            ATTACK: '#fb7185'
        };
        const color = colors[stateKey] || '#94a3b8';

        // Fundo e borda tracejada
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.beginPath();
        ctx.roundRect(14, 14, 68, 68, 12);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Indicador animado de progresso do frame
        const offset = Math.sin((idx / Math.max(1, total)) * Math.PI * 2) * 4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(48, 42 + offset, 12, 0, Math.PI * 2);
        ctx.fill();

        // Nome do ficheiro esperado
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fileName, 48, 72);

        return c;
    }

    getFrame(stateKey, frameIndex) {
        const seq = this.sequences[stateKey];
        if (!seq || seq.length === 0) return null;
        const safeIdx = frameIndex % seq.length;
        return seq[safeIdx];
    }

    getFrameCount(stateKey) {
        const seq = this.sequences[stateKey];
        return seq ? seq.length : 1;
    }
}

/**
 * 2. GESTOR DE ENTRADAS (TECLADO E RATO)
 * Mapeia WASD, Setas, Shift e Clique Esquerdo, sincronizando com o HUD.
 */
class InputManager {
    constructor(canvasElement) {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shift: false
        };
        this.mouseDown = false;
        this.attackTriggered = false;

        this.bindEvents(canvasElement);
    }

    bindEvents(canvas) {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            this.handleKey(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this.handleKey(e.code, false);
        });

        window.addEventListener('blur', () => {
            this.keys = { up: false, down: false, left: false, right: false, shift: false };
            this.mouseDown = false;
            this.updateHUD();
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseDown = true;
                this.attackTriggered = true;
                this.updateHUD();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
                this.updateHUD();
            }
        });

        // Controles Touch Mobile
        document.querySelectorAll('.touch-btn').forEach(btn => {
            const code = btn.getAttribute('data-key');
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleKey(code, true);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleKey(code, false);
            });
        });

        const touchShift = document.getElementById('touch-shift');
        if (touchShift) {
            touchShift.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys.shift = !this.keys.shift;
                this.updateHUD();
            });
        }

        const touchAttack = document.getElementById('touch-attack');
        if (touchAttack) {
            touchAttack.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mouseDown = true;
                this.attackTriggered = true;
                this.updateHUD();
            });
            touchAttack.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mouseDown = false;
                this.updateHUD();
            });
        }
    }

    handleKey(code, isPressed) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = isPressed;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = isPressed;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = isPressed;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = isPressed;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = isPressed;
                break;
        }
        this.updateHUD();
    }

    consumeAttackTrigger() {
        if (this.attackTriggered) {
            this.attackTriggered = false;
            return true;
        }
        return false;
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;
        if (this.keys.left) dx -= 1;
        if (this.keys.right) dx += 1;
        if (this.keys.up) dy -= 1;
        if (this.keys.down) dy += 1;

        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.sqrt(2);
            dx *= inv;
            dy *= inv;
        }
        return { dx, dy, isMoving: dx !== 0 || dy !== 0 };
    }

    updateHUD() {
        document.getElementById('key-up').classList.toggle('active', this.keys.up);
        document.getElementById('key-down').classList.toggle('active', this.keys.down);
        document.getElementById('key-left').classList.toggle('active', this.keys.left);
        document.getElementById('key-right').classList.toggle('active', this.keys.right);
        document.getElementById('key-shift').classList.toggle('active', this.keys.shift);
        document.getElementById('mouse-visual').classList.toggle('active', this.mouseDown);
    }
}

/**
 * 3. ENTIDADES DO JOGO: PARTÍCULAS E ALVOS DE TREINO
 */
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class TrainingDummy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 22;
        this.hp = 3;
        this.maxHp = 3;
        this.hitFlash = 0;
        this.wobble = 0;
        this.respawnTimer = 0;
    }

    hit(dirX) {
        if (this.respawnTimer > 0) return false;
        this.hp--;
        this.hitFlash = 0.22;
        this.wobble = dirX * 0.45;
        if (this.hp <= 0) {
            this.respawnTimer = 2.5;
            return true;
        }
        return false;
    }

    update(dt) {
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.wobble *= Math.pow(0.05, dt);
        if (this.respawnTimer > 0) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.hp = this.maxHp;
                this.hitFlash = 0.3;
            }
        }
    }

    draw(ctx) {
        if (this.respawnTimer > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 12, 16, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 18, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.wobble);

        // Poste
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-4, -10, 8, 28);

        // Corpo
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#b45309';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-14, -26, 28, 24, 6);
        ctx.fill();
        ctx.stroke();

        // Alvo
        ctx.fillStyle = this.hitFlash > 0 ? '#f43f5e' : '#fef3c7';
        ctx.beginPath();
        ctx.arc(0, -14, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(0, -14, 3, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#d97706';
        ctx.beginPath();
        ctx.arc(0, -34, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Barra de vida
        const barW = 32;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(this.x - barW / 2, this.y - 52, barW, 5);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(this.x - barW / 2, this.y - 52, barW * (this.hp / this.maxHp), 5);
    }
}

/**
 * 4. MOTOR PRINCIPAL DO JOGO
 */
class SpriteGameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.loader = new ImageSequenceLoader();
        this.input = new InputManager(this.canvas);

        // Visualizador da Sequência de Imagens no HUD
        this.previewCanvas = document.getElementById('sheetPreviewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.previewCanvas.width = ANIM_CONFIG.frameWidth * this.loader.maxCols;
        this.previewCanvas.height = ANIM_CONFIG.frameHeight * 4;

        // Estado do Jogador
        this.player = {
            x: 0,
            y: 0,
            facing: 1, // 1 = Direita, -1 = Esquerda
            state: 'IDLE',
            frameIndex: 0,
            frameTimer: 0,
            isAttacking: false,
            attackHitChecked: false,
            scale: 1.55,
            dustTimer: 0
        };

        this.particles = [];
        this.dummies = [];
        this.score = 0;

        // Métricas de FPS
        this.lastTime = performance.now();
        this.fpsTimer = 0;
        this.framesCount = 0;
        this.currentFps = 60;

        this.setupUI();
        this.resize();
        this.spawnDummies();

        window.addEventListener('resize', () => this.resize());
        requestAnimationFrame((t) => this.loop(t));
    }

    setupUI() {
        const toggleBtn = document.getElementById('toggle-sheet-btn');
        const wrapper = document.getElementById('sheet-preview-wrapper');
        toggleBtn.addEventListener('click', () => {
            wrapper.classList.toggle('collapsed');
            toggleBtn.textContent = wrapper.classList.contains('collapsed') ? 'Mostrar' : 'Ocultar';
        });
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        if (this.player.x === 0 && this.player.y === 0) {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2;
        } else {
            this.player.x = Math.max(40, Math.min(this.canvas.width - 40, this.player.x));
            this.player.y = Math.max(60, Math.min(this.canvas.height - 60, this.player.y));
        }
    }

    spawnDummies() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const offsets = [
            { x: -180, y: -60 },
            { x: 180, y: -60 },
            { x: -150, y: 110 },
            { x: 150, y: 110 }
        ];
        this.dummies = offsets.map(o => new TrainingDummy(
            Math.max(70, Math.min(this.canvas.width - 70, cx + o.x)),
            Math.max(90, Math.min(this.canvas.height - 130, cy + o.y))
        ));
    }

    setPlayerState(newState) {
        if (this.player.state === newState) return;
        this.player.state = newState;
        this.player.frameIndex = 0;
        this.player.frameTimer = 0;
        this.updateStateHUD();
    }

    updateStateHUD() {
        const cfg = ANIM_CONFIG.states[this.player.state];
        const badge = document.getElementById('state-badge');
        const text = document.getElementById('state-text');
        badge.className = `state-badge ${cfg.cssClass}`;
        text.textContent = cfg.label;
    }

    update(dt) {
        const move = this.input.getMovementVector();
        const wantsAttack = this.input.consumeAttackTrigger() || (this.input.mouseDown && !this.player.isAttacking);

        if (wantsAttack && !this.player.isAttacking) {
            this.player.isAttacking = true;
            this.player.attackHitChecked = false;
            this.setPlayerState('ATTACK');
        }

        if (move.dx < 0) this.player.facing = 1;
        if (move.dx > 0) this.player.facing = -1;

        const totalFrames = this.loader.getFrameCount(this.player.state);

        if (this.player.isAttacking) {
            const slideSpeed = 65;
            this.player.x += move.dx * slideSpeed * dt;
            this.player.y += move.dy * slideSpeed * dt;

            // Impacto a meio da animação de ataque
            const impactFrame = Math.floor(totalFrames / 2);
            if (this.player.frameIndex === impactFrame && !this.player.attackHitChecked) {
                this.player.attackHitChecked = true;
                this.performSwordHitCheck();
            }
        } else if (move.isMoving) {
            if (this.input.keys.shift) {
                this.setPlayerState('RUN');
                const runSpeed = 320;
                this.player.x += move.dx * runSpeed * dt;
                this.player.y += move.dy * runSpeed * dt;

                this.player.dustTimer -= dt;
                if (this.player.dustTimer <= 0) {
                    this.player.dustTimer = 0.07;
                    this.particles.push(new Particle(
                        this.player.x - this.player.facing * 12,
                        this.player.y + 22,
                        -move.dx * 40 + (Math.random() - 0.5) * 30,
                        -15 - Math.random() * 20,
                        '#fbbf24',
                        5,
                        0.38
                    ));
                }
            } else {
                this.setPlayerState('WALK');
                const walkSpeed = 165;
                this.player.x += move.dx * walkSpeed * dt;
                this.player.y += move.dy * walkSpeed * dt;
            }
        } else {
            this.setPlayerState('IDLE');
        }

        // Limites da Arena
        const marginX = 45;
        const marginTop = 85;
        const marginBottom = 115;
        this.player.x = Math.max(marginX, Math.min(this.canvas.width - marginX, this.player.x));
        this.player.y = Math.max(marginTop, Math.min(this.canvas.height - marginBottom, this.player.y));

        // Avanço dos Frames ordenados alfabeticamente
        const anim = ANIM_CONFIG.states[this.player.state];
        const currentTotalFrames = this.loader.getFrameCount(this.player.state);
        const frameDuration = 1 / anim.fps;
        this.player.frameTimer += dt;

        if (this.player.frameTimer >= frameDuration) {
            this.player.frameTimer -= frameDuration;
            this.player.frameIndex++;

            if (this.player.frameIndex >= currentTotalFrames) {
                if (anim.loop) {
                    this.player.frameIndex = 0;
                } else {
                    this.player.isAttacking = false;
                    this.player.frameIndex = 0;
                    if (move.isMoving) {
                        this.setPlayerState(this.input.keys.shift ? 'RUN' : 'WALK');
                    } else {
                        this.setPlayerState('IDLE');
                    }
                }
            }
        }

        // Atualiza Partículas e Alvos
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);
        this.dummies.forEach(d => d.update(dt));

        // Atualiza Telemetria no HUD
        const curAnim = ANIM_CONFIG.states[this.player.state];
        const activeCount = this.loader.getFrameCount(this.player.state);
        const activeFrame = this.loader.getFrame(this.player.state, this.player.frameIndex);

        document.getElementById('frame-val').textContent = `${this.player.frameIndex + 1} / ${activeCount}`;
        document.getElementById('dir-val').textContent = this.player.facing === 1 ? 'DIR →' : '← ESQ';
        document.getElementById('sheet-coords').textContent = `[L${curAnim.row}, F${this.player.frameIndex}]`;
        if (activeFrame) {
            document.getElementById('current-file-name').textContent = activeFrame.name;
        }
    }

    performSwordHitCheck() {
        const hitCenterX = this.player.x + this.player.facing * 48;
        const hitCenterY = this.player.y - 5;
        const hitRadius = 56;

        for (let i = 0; i < 10; i++) {
            const ang = (Math.random() - 0.5) * 2.2 + (this.player.facing === 1 ? 0 : Math.PI);
            const spd = 80 + Math.random() * 140;
            this.particles.push(new Particle(
                hitCenterX,
                hitCenterY,
                Math.cos(ang) * spd,
                Math.sin(ang) * spd,
                '#fb7185',
                4.5,
                0.3
            ));
        }

        this.dummies.forEach(dummy => {
            const dist = Math.hypot(dummy.x - hitCenterX, dummy.y - hitCenterY);
            if (dist <= hitRadius + dummy.radius) {
                const destroyed = dummy.hit(this.player.facing);
                for (let i = 0; i < 14; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const s = 60 + Math.random() * 160;
                    this.particles.push(new Particle(
                        dummy.x,
                        dummy.y - 12,
                        Math.cos(a) * s,
                        Math.sin(a) * s,
                        destroyed ? '#fbbf24' : '#ffffff',
                        5,
                        0.45
                    ));
                }
                if (destroyed) {
                    this.score++;
                    document.getElementById('score-display').textContent = `Alvos: ${this.score}`;
                }
            }
        });
    }

    drawArena() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, Math.max(w, h) * 0.75);
        bgGrad.addColorStop(0, '#1e293b');
        bgGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const gridSize = 48;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = (w / 2) % gridSize; x < w; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for (let y = (h / 2) % gridSize; y < h; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 130, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, 105, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Use WASD ou Setas para andar • Segure SHIFT para correr • Clique Esquerdo para atacar os alvos', w / 2, h / 2 + 165);
    }

    drawPlayer() {
        const ctx = this.ctx;
        const frameEntry = this.loader.getFrame(this.player.state, this.player.frameIndex);
        if (!frameEntry) return;

        const source = frameEntry.loaded ? frameEntry.img : frameEntry.fallbackCanvas;
        const fw = ANIM_CONFIG.frameWidth;
        const fh = ANIM_CONFIG.frameHeight;

        const dw = fw * this.player.scale;
        const dh = fh * this.player.scale;

        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.scale(this.player.facing, 1);

        // Sombra suave sob o personagem
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(source, -dw / 2, -dh * 0.72, dw, dh);
        ctx.restore();
    }

    drawSheetPreview() {
        const wrapper = document.getElementById('sheet-preview-wrapper');
        if (wrapper.classList.contains('collapsed')) return;

        const ctx = this.previewCtx;
        const fw = ANIM_CONFIG.frameWidth;
        const fh = ANIM_CONFIG.frameHeight;

        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        const stateKeys = Object.keys(ANIM_CONFIG.states);
        stateKeys.forEach((key) => {
            const cfg = ANIM_CONFIG.states[key];
            const seq = this.loader.sequences[key] || [];
            seq.forEach((entry, colIdx) => {
                const x = colIdx * fw;
                const y = cfg.row * fh;

                ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, fw, fh);

                const src = entry.loaded ? entry.img : entry.fallbackCanvas;
                ctx.drawImage(src, x, y, fw, fh);
            });
        });

        // Destaca o frame atual em execução
        const curAnim = ANIM_CONFIG.states[this.player.state];
        const hx = this.player.frameIndex * fw;
        const hy = curAnim.row * fh;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.strokeRect(hx + 3, hy + 3, fw - 6, fh - 6);
    }

    loop(now) {
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;

        this.framesCount++;
        this.fpsTimer += dt;
        if (this.fpsTimer >= 0.5) {
            this.currentFps = Math.round(this.framesCount / this.fpsTimer);
            document.getElementById('fps-val').textContent = this.currentFps;
            this.framesCount = 0;
            this.fpsTimer = 0;
        }

        this.update(dt);
        this.drawArena();

        const renderList = [
            ...this.dummies.map(d => ({ y: d.y, draw: () => d.draw(this.ctx) })),
            { y: this.player.y, draw: () => this.drawPlayer() }
        ];
        renderList.sort((a, b) => a.y - b.y);
        renderList.forEach(item => item.draw());

        this.particles.forEach(p => p.draw(this.ctx));
        this.drawSheetPreview();

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.onload = () => {
    new SpriteGameEngine();
};
