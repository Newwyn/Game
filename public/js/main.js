import * as THREE from 'three';

// ============================================================
// SCENE SETUP
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 18);
camera.lookAt(0, -1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('game-container').appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(2, 10, 5);
scene.add(dirLight);

const groundGeo = new THREE.PlaneGeometry(100, 30);
const groundMat = new THREE.MeshPhongMaterial({ color: 0x2d5016, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);

const gridHelper = new THREE.GridHelper(100, 100, 0x3a6b1f, 0x244c0d);
gridHelper.position.y = -0.49;
scene.add(gridHelper);

// ============================================================
// STATE
// ============================================================
const socket = io();
let roomData = null;
let classDefs = null;
let isAuto = false;
let capsules = {};
let cameraTargetX = 0;
let cameraTargetWide = false;
let mySide = 'left'; // Default to left

// Audio context
let audioCtx;
function playBeep(freq, type, duration) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const os = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    os.type = type; os.frequency.value = freq;
    os.connect(gain); gain.connect(audioCtx.destination);
    os.start(); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    os.stop(audioCtx.currentTime + duration);
}

// Consts
const ORB_COST = 1000;

// ============================================================
// ANIMATION HELPERS
// ============================================================
class SpriteAnimator {
    constructor(texture, cols, rows, fps = 10, material = null) {
        this.texture = texture;
        this.cols = cols;
        this.rows = rows;
        this.fps = fps;
        this.material = material; // Reference to ShaderMaterial if used
        this.frameWidth = 1 / cols;
        this.frameHeight = 1 / rows;
        
        this.texture.repeat.set(this.frameWidth, this.frameHeight);
        this.texture.wrapS = THREE.RepeatWrapping;
        this.currentFrame = 0;
        this.totalFramesInRow = cols;
        this.elapsed = 0;
        this.isFlip = false;
        this.currentRow = -1;

        this.updateUniforms();
    }

    updateUniforms() {
        const uvRow = (this.rows - 1) - this.currentRow;
        const offsetX = this.currentFrame * this.frameWidth;
        const offsetY = uvRow * this.frameHeight;

        if (this.material && this.material.uniforms.uvOffset) {
            this.material.uniforms.uvOffset.value.set(offsetX, offsetY);
            this.material.uniforms.uvRepeat.value.set(this.frameWidth, this.frameHeight);
        } else {
            this.texture.offset.set(offsetX, offsetY);
            this.texture.repeat.set(this.frameWidth, this.frameHeight);
        }
    }

    setRow(rowIdx, totalFrames = null, fps = null, loop = true, onComplete = null) {
        if (this.currentRow !== rowIdx || this.isTransient) {
            this.currentRow = rowIdx;
            this.currentFrame = 0;
            this.totalFramesInRow = totalFrames || this.cols;
            if (fps) this.fps = fps;
            this.isTransient = !loop;
            this.onComplete = onComplete;
            this.updateUniforms();
        }
    }

    switchSheet(newTexture, cols, rows) {
        if (this.texture === newTexture) return;
        this.texture = newTexture;
        if (this.material) this.material.uniforms.map.value = newTexture;
        this.cols = cols;
        this.rows = rows;
        this.frameWidth = 1 / cols;
        this.frameHeight = 1 / rows;
        this.currentFrame = 0;
        this.elapsed = 0;
        this.updateUniforms();
    }

    update(dt) {
        this.elapsed += dt;
        if (this.elapsed >= 1 / this.fps) {
            this.elapsed = 0;
            const nextFrame = this.currentFrame + 1;
            
            if (nextFrame >= this.totalFramesInRow) {
                if (this.isTransient) {
                    if (this.onComplete) this.onComplete();
                    this.isTransient = false;
                    return;
                }
                this.currentFrame = 0;
            } else {
                this.currentFrame = nextFrame;
            }
            this.updateUniforms();
        }
    }

    setFlip(flip) {
        this.isFlip = flip;
    }
}

// ============================================================
// CHROMA KEY SHADER
// ============================================================
function createChromaKeyMaterial(texture, keyColor = new THREE.Color(1, 0, 1)) {
    return new THREE.ShaderMaterial({
        uniforms: {
            map: { value: texture },
            keyColor: { value: keyColor },
            similarity: { value: 0.40 }, // Balanced similarity
            smoothness: { value: 0.05 },
            opacity: { value: 1.0 },
            uvOffset: { value: new THREE.Vector2(0, 0) },
            uvRepeat: { value: new THREE.Vector2(1, 1) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D map;
            uniform vec3 keyColor;
            uniform float similarity;
            uniform float smoothness;
            uniform float opacity;
            uniform vec2 uvOffset;
            uniform vec2 uvRepeat;
            varying vec2 vUv;

            void main() {
                // APPLY SAFE UV INSET (Padding) to avoid edge bleeding
                vec2 safeVuv = vUv * 0.90 + 0.05; 
                vec2 animatedUv = safeVuv * uvRepeat + uvOffset;
                
                vec4 texColor = texture2D(map, animatedUv);
                
                float diff = distance(texColor.rgb, keyColor);
                float mask = smoothstep(similarity, similarity + smoothness, diff);
                
                gl_FragColor = vec4(texColor.rgb, texColor.a * mask * opacity);
                if (gl_FragColor.a < 0.1) discard;
            }
        `,
        transparent: true
    });
}

// Load textures
const loader = new THREE.TextureLoader();
const assassinMainTex = loader.load('assets/assassin_main.png');
const assassinExtraTex = loader.load('assets/assassin_extra.png');
assassinMainTex.magFilter = THREE.NearestFilter;
assassinMainTex.minFilter = THREE.NearestFilter;
assassinExtraTex.magFilter = THREE.NearestFilter;
assassinExtraTex.minFilter = THREE.NearestFilter;

// ============================================================
// CAPSULE CREATION & VFX
// ============================================================
function createCharTexture(emoji, color, label, isMyTeam) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(64, 70, 45, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(48, 52, 18, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(46, 62, 12, 0, Math.PI * 2); ctx.arc(82, 62, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#facc15'; // Yellow eyes for assassin
    ctx.beginPath(); ctx.arc(50, 62, 5, 0, Math.PI * 2); ctx.arc(78, 62, 5, 0, Math.PI * 2); ctx.fill();

    // Ninja mask line
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 75, 88, 10);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, 64, 135);

    if (isMyTeam) {
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(64, 70, 48, 0, Math.PI * 2); ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

function createBarSprite(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 128, 16);
    ctx.fillStyle = color; ctx.fillRect(2, 2, 124, 12);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 0.18, 1);
    sprite.userData = { canvas, ctx, texture, color };
    return sprite;
}

function updateBarSprite(sprite, percent) {
    const { ctx, texture, color } = sprite.userData;
    ctx.clearRect(0, 0, 128, 16);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 128, 16);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 128, 16);
    ctx.fillStyle = color;
    ctx.fillRect(2, 2, 124 * Math.max(0, Math.min(1, percent)), 12);
    texture.needsUpdate = true;
}


function createCapsuleGroup(memberData, classDef, isMyTeam) {
    const group = new THREE.Group();
    
    if (memberData.classId === 'assassin') {
        const tex = assassinMainTex.clone();
        tex.needsUpdate = true;
        const mat = createChromaKeyMaterial(tex);
        const geo = new THREE.PlaneGeometry(1, 1);
        const body = new THREE.Mesh(geo, mat);
        body.scale.set(3.5, 3.5, 1); // Increased scale
        body.position.y = 1.6;
        group.add(body);
        group.userData.body = body;
        group.userData.mainTex = tex;
        group.userData.extraTex = assassinExtraTex.clone();
        group.userData.animator = new SpriteAnimator(tex, 6, 4, 12, mat); 
        group.userData.lastX = memberData.x;
    } else {
        const tex = createCharTexture(classDef.emoji, memberData.color, memberData.name, isMyTeam);
        const mat = new THREE.SpriteMaterial({ map: tex });
        const body = new THREE.Sprite(mat);
        body.scale.set(1.8, 2.2, 1); body.position.y = 1;
        group.add(body); group.userData.body = body;
    }

    const hpBar = createBarSprite('#22c55e'); hpBar.position.y = 3.0; group.add(hpBar); group.userData.hpBar = hpBar;
    
    const castBar = createBarSprite('#facc15'); castBar.position.y = 3.2; castBar.visible = false;
    group.add(castBar); group.userData.castBar = castBar;

    group.position.set(memberData.x, 0, memberData.z || 0);
    group.userData.memberData = memberData;

    // Visual Attack Range Indicator
    const rangeGeo = new THREE.RingGeometry(classDef.atkRange, classDef.atkRange + 0.1, 32);
    const rangeMat = new THREE.MeshBasicMaterial({ 
        color: isMyTeam ? '#22c55e' : '#ff4444', 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const rangeMesh = new THREE.Mesh(rangeGeo, rangeMat);
    rangeMesh.rotation.x = -Math.PI / 2; // Flat on ground
    rangeMesh.position.y = 0.05;
    group.add(rangeMesh);

    return group;
}

// ============================================================
// VFX
// ============================================================
let damageNumbers = [];
let effects = [];

function spawnDamageNumber(x, y, z, value, type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = type === 'crit' ? '900 42px Outfit' : '900 28px Outfit';
    ctx.textAlign = 'center';
    
    if (type === 'heal') ctx.fillStyle = '#22c55e';
    else if (type === 'crit') ctx.fillStyle = '#fb923c';
    else if (type === 'block') ctx.fillStyle = '#94a3b8';
    else if (type === 'miss') ctx.fillStyle = '#f8fafc';
    else ctx.fillStyle = '#ef4444'; 
    
    ctx.strokeStyle = '#000'; ctx.lineWidth = type === 'crit' ? 6 : 4;
    
    let text = `-${value}`;
    if (type === 'miss') text = 'MISS';
    else if (type === 'heal') text = `+${value}`;
    else if (type === 'block') text = `BLOCK -${value}`;
    
    ctx.strokeText(text, 64, 44); ctx.fillText(text, 64, 44);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    
    if (type === 'crit') sprite.scale.set(3.0, 1.5, 1);
    else if (type === 'miss' || type === 'block') sprite.scale.set(2.0, 1.0, 1);
    else sprite.scale.set(1.8, 0.9, 1);
    
    sprite.position.set(x + (Math.random() - 0.5) * 0.5, y + 3, z + 0.5);
    scene.add(sprite);
    damageNumbers.push({ sprite, life: 1.2, vy: type === 'crit' ? 0.06 : 0.04 });
}

function spawnShadowTrail(x, y, z, tx, tz) {
    // A simple line or ghost sprite to show dash
    const mat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
    const points = [new THREE.Vector3(x, y+1, z), new THREE.Vector3(tx, y+1, tz)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    effects.push({ mesh: line, life: 1.0, type: 'line' });
}

function spawnAoeExplosion(x, z) {
    const geo = new THREE.CircleGeometry(3, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(geo, mat);
    circle.rotation.x = -Math.PI/2;
    circle.position.set(x, 0.1, z);
    scene.add(circle);
    effects.push({ mesh: circle, life: 1.0, type: 'expand' });
}

function spawnSlashVfx(x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(20, 100); ctx.quadraticCurveTo(64, 64, 108, 20); ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3, 3, 1);
    sprite.position.set(x, y + 1, z);
    sprite.rotation.z = Math.random() * Math.PI;
    scene.add(sprite);
    effects.push({ mesh: sprite, life: 0.5, type: 'fade' });
}

function spawnProjectile(from, to, color) {
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    scene.add(mesh);
    
    const duration = 0.4;
    let elapsed = 0;
    const interval = setInterval(() => {
        elapsed += 0.05;
        const t = elapsed / duration;
        mesh.position.lerpVectors(from, to, t);
        if (t >= 1) {
            clearInterval(interval);
            scene.remove(mesh);
        }
    }, 50);
}

function updateVfx() {
    damageNumbers = damageNumbers.filter(dn => {
        dn.life -= 0.02;
        dn.sprite.position.y += dn.vy;
        dn.sprite.material.opacity = Math.max(0, dn.life);
        if (dn.life <= 0) { scene.remove(dn.sprite); return false; }
        return true;
    });

    effects = effects.filter(fx => {
        fx.life -= 0.05;
        if(fx.type === 'line') fx.mesh.material.opacity = fx.life * 0.5;
        if(fx.type === 'fade') fx.mesh.material.opacity = fx.life * 2;
        if(fx.type === 'expand') {
            fx.mesh.scale.setScalar(1 + (1 - fx.life) * 2);
            fx.mesh.material.opacity = fx.life * 0.8;
        }
        if (fx.life <= 0) { scene.remove(fx.mesh); return false; }
        return true;
    });
}

function spawnSealVfx(targetGroup, duration) {
    // If target already has a seal, just reset it
    if (targetGroup.userData.activeSeal) {
        targetGroup.userData.activeSeal.startTime = Date.now();
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw an "Ấn" symbol
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(64, 64, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ebf4ff'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center';
    ctx.fillText('印', 64, 85); 

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2, 2, 1);
    
    const timeCanvas = document.createElement('canvas');
    timeCanvas.width = 64; timeCanvas.height = 32;
    const tCtx = timeCanvas.getContext('2d');
    const tTex = new THREE.CanvasTexture(timeCanvas);
    const tSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tTex, transparent: true }));
    tSprite.scale.set(1.5, 0.75, 1);
    
    const group = new THREE.Group();
    group.add(sprite);
    group.add(tSprite);
    tSprite.position.y = -0.8;
    
    targetGroup.add(group);
    group.position.y = 4;
    
    const sealData = { startTime: Date.now() };
    targetGroup.userData.activeSeal = sealData;
    
    const interval = setInterval(() => {
        const remaining = ((duration - (Date.now() - sealData.startTime)) / 1000).toFixed(1);
        if (remaining <= 0) {
            clearInterval(interval);
            targetGroup.remove(group);
            targetGroup.userData.activeSeal = null;
        } else {
            tCtx.clearRect(0, 0, 64, 32);
            tCtx.fillStyle = '#fff'; tCtx.font = 'bold 24px Arial'; tCtx.textAlign = 'center';
            tCtx.fillText(`${remaining}s`, 32, 24);
            tTex.needsUpdate = true;
        }
    }, 100);
}

let attackAnims = [];
function triggerAttackAnim(group, direction) {
    attackAnims.push({ group, originalX: group.position.x, phase: 'forward', progress: 0, direction });
}
function updateAttackAnims() {
    attackAnims = attackAnims.filter(anim => {
        anim.progress += 0.2;
        if (anim.phase === 'forward') {
            anim.group.position.x = anim.originalX + anim.direction * Math.sin(anim.progress) * 0.4;
            if (anim.progress >= Math.PI / 2) { anim.phase = 'back'; anim.progress = 0; }
        } else {
            anim.group.position.x = anim.originalX + anim.direction * Math.cos(anim.progress) * 0.4;
            if (anim.progress >= Math.PI / 2) { anim.group.position.x = anim.originalX; return false; }
        }
        return true;
    });
}

// ============================================================
// BUILD SCENE
// ============================================================
function buildBattleScene(data) {
    // CLEANUP: Reset ALL game state
    Object.values(capsules).forEach(playerCapsules => {
        playerCapsules.forEach(group => scene.remove(group));
    });
    // Remove all sprites (labels, seals, slashes, damage numbers)
    const objectsToRemove = scene.children.filter(c => c.isSprite || c.isGroup && c !== capsules && c.children.length > 0);
    objectsToRemove.forEach(obj => { if(obj.userData.ground) return; scene.remove(obj); });
    
    capsules = {};
    damageNumbers = [];
    effects = [];
    attackAnims = [];
    cameraTargetWide = false; 

    roomData = data; classDefs = data.classDefs;
    const cid = socket.id;

    Object.entries(data.players).forEach(([playerId, playerData]) => {
        const isMyTeam = (playerId === cid);
        capsules[playerId] = [];
        playerData.squad.forEach((member) => {
            const group = createCapsuleGroup(member, classDefs[member.classId], isMyTeam);
            scene.add(group); capsules[playerId].push(group);
        });
        if (isMyTeam) mySide = playerData.side;
    });

    const isNPC = cid && cid.startsWith('npc');
    const myLabel = createTeamLabel(isNPC ? '👹 QUÁI VẬT' : '⭐ ĐỘI CỦA BẠN', '#00d4ff');
    myLabel.position.set(mySide === 'left' ? -25 : 25, 3, -1); scene.add(myLabel);
    
    // Check if opponent is NPC
    const opponentId = Object.keys(data.players).find(id => id !== cid) || 'opponent';
    const opponentData = data.players[opponentId];
    const isOpponentNPC = opponentData ? opponentData.isNPC : false;
    const enemyLabel = createTeamLabel(isOpponentNPC ? '👹 QUÁI VẬT (DUMMY)' : '👹 ĐỐI THỦ', '#ff4444');
    enemyLabel.position.set(mySide === 'left' ? 25 : -25, 3, -1); scene.add(enemyLabel);

    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    document.getElementById('combat-hud').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
    
    // Update Badge text
    const badge = document.querySelector('.top-label');
    if (badge) {
        const hasNPC = Object.values(data.players).some(p => p.isNPC);
        badge.textContent = hasNPC ? '🛡️ TEST MODE / NPC' : '⚔️ PVP BATTLE';
    }

    // Set initial camera position: focus only on player's team
    camera.position.x = mySide === 'left' ? -30 : 30;
    cameraTargetX = mySide === 'left' ? -30 : 30;

    // Force hide extra HUD cards immediately
    updateHUD(data.players);
}

// ============================================================
// UPDATE LOGIC
// ============================================================
function updateHUD(players) {
    const cid = socket.id;
    if (!cid || !players[cid]) return;
    const squad = players[cid].squad;
    const now = Date.now();

    squad.forEach((member, i) => {
        const card = document.getElementById(`member-${i}`);
        if (!card) return;
        card.style.display = 'flex'; 

        // HP
        const hpFill = card.querySelector('.hp-fill');
        hpFill.style.width = member.maxHp > 0 ? `${(member.hp/member.maxHp)*100}%` : '0%';
        
        // Orbs
        const orbs = member.mp / ORB_COST;
        const fullOrbs = Math.floor(orbs);
        const remainder = orbs - fullOrbs;
        
        const orbBar = document.getElementById(`orb-bar-${i}`);
        if (orbBar) {
            Array.from(orbBar.children).forEach((orb, idx) => {
                if (idx < fullOrbs) orb.style.setProperty('--fill-pct', '100%');
                else if (idx === fullOrbs) orb.style.setProperty('--fill-pct', `${remainder*100}%`);
                else orb.style.setProperty('--fill-pct', '0%');
            });
        }

            // Skills
            const def = classDefs[member.classId];
            for(let s=0; s<3; s++) {
                const btn = document.getElementById(`btn-${i}-${s}`);
                if(!btn) continue;
                
                const cost = def.skills[s].orbCost;
                let isReady = false;
                let isQueued = member.queuedSkills.includes(s);

                // Cooldown text
                const cdOverlay = btn.querySelector('.cd-overlay') || createCdOverlay(btn);
                const remainingCd = Math.max(0, (member.skillCooldowns[s] - now) / 1000);
                if (remainingCd > 0) {
                    cdOverlay.style.display = 'flex';
                    cdOverlay.textContent = remainingCd.toFixed(1) + 's';
                } else {
                    cdOverlay.style.display = 'none';
                }

                // Queue numbers
                const qNum = btn.querySelector('.queue-num');
                const qIdx = member.queuedSkills.indexOf(s);
                if (qIdx !== -1) {
                    qNum.style.display = 'flex';
                    qNum.textContent = qIdx + 1;
                } else {
                    qNum.style.display = 'none';
                }

            if (!member.alive) {
                btn.className = 'skill-btn disabled' + (s===2?' ultimate':'');
            } else {
                if (member.mp >= cost * ORB_COST && now > member.skillCooldowns[s]) {
                    isReady = true;
                }
                
                let cls = 'skill-btn';
                if(s===2) cls += ' ultimate';
                if(isReady) cls += ' ready';
                if(isQueued) cls += ' queued';
                if(!isReady && !isQueued) cls += ' disabled';
                btn.className = cls;
            }
        }
    });

    // Update left and right stat panels
    let leftHTML = '';
    let rightHTML = '';
    
    Object.keys(players).forEach(pId => {
        const pd = players[pId];
        pd.squad.forEach(member => {
            if (member.alive) {
                const html = getStatPanelHTML(member);
                if (pd.side === 'left') leftHTML += html;
                else rightHTML += html;
            }
        });
    });

    const leftContainer = document.getElementById('left-stats');
    if (leftContainer) leftContainer.innerHTML = leftHTML;
    
    const rightContainer = document.getElementById('right-stats');
    if (rightContainer) rightContainer.innerHTML = rightHTML;

    // Hide other cards for Squad Size 1
    for (let i = squad.length; i < 4; i++) {
        const card = document.getElementById(`member-${i}`);
        if (card) card.style.display = 'none';
    }

    // Auto Btn update
    const autoBtn = document.getElementById('btn-auto');
    if (autoBtn && players[cid]) {
        if(players[cid].autoMode) {
            autoBtn.textContent = 'AUTO MODE: ON';
            autoBtn.classList.add('active');
        } else {
            autoBtn.textContent = 'AUTO MODE: OFF';
            autoBtn.classList.remove('active');
        }
    }
}

function createTeamLabel(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.roundRect(0, 0, 512, 128, 20);
    ctx.fill();
    ctx.font = '700 48px Outfit';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(10, 2.5, 1);
    return sprite;
}

function createCdOverlay(parent) {
    const div = document.createElement('div');
    div.className = 'cd-overlay';
    div.style.position = 'absolute';
    div.style.top = '0'; div.style.left = '0'; div.style.right = '0'; div.style.bottom = '0';
    div.style.background = 'rgba(0,0,0,0.6)';
    div.style.display = 'none'; div.style.alignItems = 'center'; div.style.justifyContent = 'center';
    div.style.fontSize = '12px'; div.style.fontWeight = '900'; div.style.color = '#fff';
    div.style.borderRadius = '8px';
    parent.appendChild(div);
    return div;
}

function updateSceneFromState(players) {
    const now = Date.now();
    Object.entries(players).forEach(([playerId, playerData]) => {
        if (!capsules[playerId]) return;
        playerData.squad.forEach((member, i) => {
            const group = capsules[playerId][i];
            if (!group) return;

            const prevX = group.position.x;
            group.position.x += (member.x - group.position.x) * 0.15;
            group.position.z += (member.z - group.position.z) * 0.15;

            // Handle Character Animation and Flip
            if (group.userData.animator) {
                const animator = group.userData.animator;
                
                // Flip logic
                const dx = member.x - group.userData.lastX;
                if (Math.abs(dx) > 0.001) animator.setFlip(dx < 0);
                group.userData.lastX = member.x;
                group.userData.body.scale.x = animator.isFlip ? -3.5 : 3.5;

                // Handle Billboarding
                group.userData.body.quaternion.copy(camera.quaternion);

                // Handle Opacity for Stealth
                const isStealth = member.statusEffects.some(ef => ef.type === 'stealth');
                if (animator.material) {
                    const targetOpacity = isStealth ? (playerId === socket.id ? 0.3 : 0.0) : 1.0;
                    animator.material.uniforms.opacity.value += (targetOpacity - animator.material.uniforms.opacity.value) * 0.1;
                }

                // Priority for transient skill animations
                if (!animator.isTransient) {
                    animator.switchSheet(group.userData.mainTex, 6, 4);
                    if (member.state === 'moving') animator.setRow(1, 6, 12); 
                    else if (member.state === 'attacking') animator.setRow(2, 5, 12); 
                    else if (member.state === 'casting') animator.setRow(3, 5, 12); 
                    else animator.setRow(0, 4, 8); // Idle: 4 frames
                }
                
                animator.update(0.016);
            }

            updateBarSprite(group.userData.hpBar, member.hp / member.maxHp);

            if (member.state === 'casting' && member.castEndTime > now) {
                const def = classDefs[member.classId].skills[member.castingSkillId];
                if(def && def.castTime > 0) {
                    group.userData.castBar.visible = true;
                    // Approximaite progression just based on end time relative to full cast param. 
                    // To be precise we need start time, but we can fake it:
                    const timeRemaining = member.castEndTime - now;
                    // Wait, we don't have start time in member state. Let's assume progress based on a local cast property if needed,
                    // Actually, simpler: just let server pass start time, or just pulse the cast bar.
                    // For now, let's just make it a yellow bar that flashes
                    updateBarSprite(group.userData.castBar, 1 - (timeRemaining / 2000)); 
                }
            } else {
                group.userData.castBar.visible = false;
            }

            if (!member.alive) {
                group.userData.body.material.opacity = 0.25;
                group.userData.castBar.visible = false;
                group.userData.hpBar.visible = false;
                group.scale.set(1, 0.4, 1);
                group.position.y = -0.35;
                group.visible = true;
            } else {
                const isStealth = member.statusEffects.some(ef => ef.type === 'stealth');
                if (isStealth) {
                    if (playerId === socket.id) {
                        group.userData.body.material.opacity = 0.3;
                        group.visible = true;
                    } else {
                        group.visible = false; // invisible to opponent
                    }
                } else {
                    group.userData.body.material.opacity = 1;
                    group.visible = true;
                }
            }
        });
    });

    if (socket.id && players[socket.id]) {
        const myAlive = players[socket.id].squad.filter(m => m.alive);
        const opponentId = Object.keys(players).find(id => id !== socket.id);
        const enemyAlive = opponentId && players[opponentId] ? players[opponentId].squad.filter(m => m.alive) : [];

        if (myAlive.length > 0) {
            const myAvgX = myAlive.reduce((sum, m) => sum + m.x, 0) / myAlive.length;

            // Auto-detect proximity: if closest enemy is within 15 units, go wide
            if (!cameraTargetWide && enemyAlive.length > 0) {
                const enemyAvgX = enemyAlive.reduce((sum, m) => sum + m.x, 0) / enemyAlive.length;
                const teamDist = Math.abs(myAvgX - enemyAvgX);
                if (teamDist < 20) {
                    cameraTargetWide = true;
                }
            }

            if (cameraTargetWide) {
                // Center camera between both teams
                if (enemyAlive.length > 0) {
                    const enemyAvgX = enemyAlive.reduce((sum, m) => sum + m.x, 0) / enemyAlive.length;
                    cameraTargetX = (myAvgX + enemyAvgX) / 2;
                } else {
                    cameraTargetX = myAvgX * 0.4;
                }
            } else {
                // Focus on player's team
                cameraTargetX = myAvgX;
            }
        }
    }
}

// ============================================================
// STAT PANEL UI
// ============================================================
function getStatPanelHTML(member) {
    const s = member;
    const eff = member.effectiveStats || {};
    const base = member.baseStats || {};

    // Helper: returns colored <b> tag based on comparison
    function cv(label, effVal, baseVal, suffix = '', format = null) {
        const val = format ? format(effVal) : effVal;
        let color = '#94a3b8'; // default grey
        if (effVal > baseVal) color = '#4ade80'; // green = buffed
        else if (effVal < baseVal) color = '#ef4444'; // red = debuffed
        return `<div style="display:flex; justify-content:space-between;"><span>${label}</span> <b style="color:${color}">${val}${suffix}</b></div>`;
    }

    // Active status effects label
    let statusHTML = '';
    const now = Date.now();
    if (s.statusEffects && s.statusEffects.length > 0) {
        const activeEffects = s.statusEffects.filter(ef => now < ef.endTime);
        if (activeEffects.length > 0) {
            const tags = activeEffects.map(ef => {
                const remaining = ((ef.endTime - now) / 1000).toFixed(1);
                if (ef.type === 'seal') return `<span style="color:#ef4444;font-size:11px;">🔴 Ấn (${remaining}s)</span>`;
                if (ef.type === 'stealth') return `<span style="color:#4ade80;font-size:11px;">🟢 Tàng Hình (${remaining}s)</span>`;
                return `<span style="font-size:11px;">${ef.type} (${remaining}s)</span>`;
            });
            statusHTML = `<div style="margin-top:6px;padding:4px 6px;background:rgba(0,0,0,0.3);border-radius:6px;">${tags.join(' ')}</div>`;
        }
    }

    return `
        <div class="stat-panel-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <b style="font-size:16px;">${s.name}</b>
            </div>
            <div style="font-size:12px; line-height:1.9;">
                ${cv('P.ATK', eff.pAtk ?? s.pAtk, base.pAtk ?? s.pAtk)}
                ${cv('M.ATK', eff.mAtk ?? s.mAtk, base.mAtk ?? s.mAtk)}
                <div style="display:flex; justify-content:space-between;"><span>HP</span> <b style="color:#ef4444">${Math.floor(s.hp)}/${s.maxHp}</b></div>
                ${cv('P.DEF', eff.pDef ?? s.pDef, base.pDef ?? s.pDef)}
                ${cv('M.DEF', eff.mDef ?? s.mDef, base.mDef ?? s.mDef)}
                <hr style="border:0; border-top:1px solid #334155; margin:6px 0;">
                ${cv('Crit Rate', eff.crit ?? s.crit, base.crit ?? s.crit, '%', v => (v/10))}
                ${cv('Crit DMG', eff.critDmg ?? s.critDmg, base.critDmg ?? s.critDmg, '%', v => '+' + (v/10))}
                ${cv('Dodge', eff.dodge ?? s.dodge, base.dodge ?? s.dodge, '%', v => (v/10))}
                ${cv('Block', eff.block ?? s.block, base.block ?? s.block, '%', v => (v/10))}
                ${cv('Penetration', eff.pen ?? s.pen, base.pen ?? s.pen, '%', v => (v/10))}
                ${cv('Accuracy', eff.acc ?? s.acc, base.acc ?? s.acc, '%', v => (v/10))}
                <hr style="border:0; border-top:1px solid #334155; margin:6px 0;">
                ${cv('Tốc đánh (ms)', eff.atkSpeed ?? s.atkSpeed, base.atkSpeed ?? s.atkSpeed)}
                ${cv('Speed (Move)', eff.moveSpeed ?? s.moveSpeed, base.moveSpeed ?? s.moveSpeed)}
                ${cv('MP Recov/Atk', eff.mpAtk ?? s.mpAtk, base.mpAtk ?? s.mpAtk)}
            </div>
            ${statusHTML}
        </div>
    `;
}

// SOCKET EVENTS
// ============================================================
socket.on('connect', () => { console.log('Connected with ID:', socket.id); });
socket.on('waiting', (data) => { document.getElementById('loading-text').textContent = data.message; });
socket.on('battleStart', (data) => { buildBattleScene(data); });
socket.on('stateUpdate', (data) => {
    roomData = { ...roomData, players: data.players };
    updateSceneFromState(data.players); updateHUD(data.players);
});

socket.on('autoAttack', (data) => {
    const atkGrp = capsules[data.attackerId]?.[data.attackerIndex];
    const tgtGrp = capsules[data.targetId]?.[data.targetIndex];
    if (atkGrp && roomData && roomData.players[data.attackerId]) {
        triggerAttackAnim(atkGrp, roomData.players[data.attackerId].side === 'left' ? 1 : -1);
    }
    if (tgtGrp) {
        let type = 'normal';
        if (data.dodged) type = 'miss';
        else if (data.isCrit) type = 'crit';
        else if (data.isBlock) type = 'block';
        spawnDamageNumber(tgtGrp.position.x, tgtGrp.position.y, tgtGrp.position.z, data.damage, type);
        if (!data.dodged) spawnSlashVfx(tgtGrp.position.x, tgtGrp.position.y, tgtGrp.position.z);
    }
});

socket.on('skillExecuted', (data) => {
    if (!roomData || !roomData.players) return;
    const memberGrp = capsules[data.casterId]?.[data.casterIdx];
    const actualOpponentId = Object.keys(roomData.players).find(id => id !== data.casterId);
    
    const processHit = (effect) => {
        const tgtGrp = capsules[actualOpponentId]?.[effect.targetIndex];
        if (tgtGrp) {
            let type = 'normal';
            if (effect.isCrit || data.isBackstab) type = 'crit';
            else if (effect.isBlock) type = 'block';
            spawnDamageNumber(tgtGrp.position.x, tgtGrp.position.y, tgtGrp.position.z, effect.damage, type);
            
            if (data.type !== 'projectile') {
                if (data.isBackstab || effect.isCrit) spawnBackstabVfx(tgtGrp.position.x, tgtGrp.position.y, tgtGrp.position.z);
                else spawnSlashVfx(tgtGrp.position.x, tgtGrp.position.y, tgtGrp.position.z);
            }
            if (data.skillIdx === 0) spawnSealVfx(tgtGrp, 7000);
        }
    };

    if (data.type === 'melee_strike' && memberGrp && memberGrp.userData.animator) {
        // ASSASSIN SKILL 2 (Shadow Blink)
        const animator = memberGrp.userData.animator;
        animator.switchSheet(memberGrp.userData.extraTex, 4, 4);
        animator.setRow(2, 4, 15, false); // Vanish
        memberGrp.userData.body.material.opacity = 0.7;

        setTimeout(() => {
            memberGrp.position.set(data.newX, 0, data.newZ);
            animator.setRow(3, 4, 15, false, () => {
                memberGrp.userData.body.material.opacity = 1;
            });
            spawnSlashVfx(data.newX, 1, data.newZ);
            data.effects.forEach(processHit);
        }, 200);

    } else if (data.type === 'projectile' && memberGrp) {
        // ASSASSIN SKILL 1 (Throwing)
        if (memberGrp.userData.animator) {
            memberGrp.userData.animator.switchSheet(memberGrp.userData.extraTex, 4, 4);
            memberGrp.userData.animator.setRow(0, 4, 15, false);
        }

        data.effects.forEach((effect, idx) => {
            const tgtGrp = capsules[actualOpponentId]?.[effect.targetIndex];
            if (tgtGrp) {
                setTimeout(() => {
                    spawnProjectile(memberGrp.position.clone().add(new THREE.Vector3(0,1,0)), tgtGrp.position.clone().add(new THREE.Vector3(0,1,0)), '#facc15');
                    setTimeout(() => processHit(effect), 400);
                }, idx * 250);
            }
        });

    } else if (data.dash && memberGrp) {
        // Generic Dash (for non-Assassins or fallback)
        if (data.effects.length > 1) {
            data.effects.forEach((effect, i) => {
                setTimeout(() => {
                    const stepTgt = capsules[actualOpponentId]?.[effect.targetIndex];
                    if (stepTgt) {
                        memberGrp.position.x = stepTgt.position.x;
                        memberGrp.position.z = stepTgt.position.z;
                        processHit(effect);
                    }
                    if (i === data.effects.length - 1) {
                        setTimeout(() => {
                            memberGrp.position.x = data.newX;
                            memberGrp.position.z = data.newZ;
                        }, 100);
                    }
                }, i * 150);
            });
        } else {
            memberGrp.position.x = data.newX;
            memberGrp.position.z = data.newZ;
            data.effects.forEach(processHit);
        }
    } else if (data.type === 'stealth' && memberGrp) {
        spawnAoeExplosion(memberGrp.position.x, memberGrp.position.z);
    } else {
        data.effects.forEach(processHit);
    }

    if (data.type === 'aoe_damage' && memberGrp) {
        spawnAoeExplosion(memberGrp.position.x, memberGrp.position.z);
    }

    if (memberGrp) memberGrp.userData.castBar.visible = false;
});

socket.on('countdown', (data) => {
    const overlay = document.getElementById('countdown-overlay');
    const textEl = document.getElementById('countdown-text');
    overlay.style.display = 'flex';
    if (data.count === 'START') {
        textEl.textContent = 'CHIẾN!';
        playBeep(800, 'square', 0.5);
        setTimeout(() => overlay.style.display = 'none', 1000);
        // Camera will auto-zoom when teams get close (proximity-based)
    } else {
        textEl.textContent = data.count;
        playBeep(400, 'square', 0.1);
    }
});

socket.on('pauseState', (data) => {
    const pauseMenu = document.getElementById('pause-menu');
    if (data.paused && data.isBotMatch) {
        pauseMenu.style.display = 'flex';
    } else if (data.paused && !data.isBotMatch) {
        // Just blur screen for online matches
        document.getElementById('game-container').style.filter = 'blur(5px)';
        const btn = document.getElementById('btn-pause');
        if (btn) btn.textContent = '▶ Tiếp tục trận';
    } else {
        pauseMenu.style.display = 'none';
        document.getElementById('game-container').style.filter = 'none';
        const btn = document.getElementById('btn-pause');
        if (btn) btn.textContent = '⏸ PAUSE';
    }
});

socket.on('squadResized', (data) => {
    const pId = data.playerId;
    const newSquad = data.newSquad;
    
    // Remove all old capsules for this player
    if (capsules[pId]) {
        capsules[pId].forEach(group => scene.remove(group));
        capsules[pId] = [];
    }

    // Creating new capsules
    if (roomData && classDefs) {
        const isMyTeam = (pId === socket.id);
        newSquad.forEach((member) => {
            const group = createCapsuleGroup(member, classDefs[member.classId], isMyTeam);
            scene.add(group);
            capsules[pId].push(group);
        });
    }
});

function spawnBackstabVfx(x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#7e22ce'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(10, 110); ctx.lineTo(118, 18); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(10, 110); ctx.lineTo(118, 18); ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(5, 5, 1);
    sprite.position.set(x, y + 1, z);
    scene.add(sprite);
    effects.push({ mesh: sprite, life: 0.8, type: 'fade' });
}


socket.on('battleEnd', (data) => {
    const cid = socket.id;
    const resultEl = document.getElementById('battle-result');
    resultEl.style.display = 'flex';
    resultEl.querySelector('.result-text').textContent = data.winnerId === cid ? '🏆 CHIẾN THẮNG!' : '💀 THẤT BẠI!';
    resultEl.querySelector('.result-text').style.color = data.winnerId === cid ? '#ffd700' : '#ef4444';
});

// ============================================================
// UI INPUTS
// ============================================================
window.queueSkill = function(memberIndex, skillIndex) {
    socket.emit('queueSkill', { memberIndex, skillIndex });
    // Resume audio context purely based on user interaction to avoid warnings
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
};

window.toggleAuto = function() {
    isAuto = !isAuto;
    socket.emit('toggleAuto', { autoMode: isAuto });
};

window.togglePause = function() {
    socket.emit('togglePause');
};

window.requestReset = function() {
    socket.emit('requestReset');
};

// ============================================================
// DEBUG CONTROLS
// ============================================================
let debugNoManaState = false;
let debugGodModeState = false;

window.debugFillMana = function() {
    socket.emit('debugAction', { type: 'fillMana' });
};

window.debugToggleNoMana = function() {
    debugNoManaState = !debugNoManaState;
    const btn = document.getElementById('btn-debug-no-mana');
    if (btn) {
        btn.classList.toggle('active', debugNoManaState);
        btn.innerHTML = `✨ Dùng Skill Miễn Phí: ${debugNoManaState ? 'ON' : 'OFF'}`;
    }
    socket.emit('debugAction', { type: 'noMana', value: debugNoManaState });
};

window.debugToggleGodMode = function() {
    debugGodModeState = !debugGodModeState;
    const btn = document.getElementById('btn-debug-god-mode');
    if (btn) {
        btn.classList.toggle('active', debugGodModeState);
        btn.innerHTML = `🛡️ Bất Tử (Bỏ Qua Sát Thương): ${debugGodModeState ? 'ON' : 'OFF'}`;
    }
    socket.emit('debugAction', { type: 'godMode', value: debugGodModeState });
};

window.debugSpawnEnemy = function(type) {
    socket.emit('debugEnemyAction', { type: type });
};

// ============================================================
// LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    camera.position.x += (cameraTargetX - camera.position.x) * 0.05;
    camera.lookAt(camera.position.x, 0, 0);
    updateVfx(); updateAttackAnims();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});
// ============================================================
// DRAGGABLE UI HELPERS
// ============================================================
function makeDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        el.style.cursor = 'grabbing';
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
        el.style.right = 'auto'; // Disable right-anchor if dragging
        el.style.bottom = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        el.style.cursor = 'grab';
    }
}

// Apply draggability
const dragTargets = ['debug-controls', 'enemy-debug-controls', 'left-stats', 'right-stats'];
dragTargets.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.style.cursor = 'grab';
        makeDraggable(el);
    }
});

animate();
