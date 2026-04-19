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

function createTeamLabel(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
    ctx.fillStyle = color; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(text, 128, 32); ctx.fillText(text, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(4, 0.75, 1);
    return sprite;
}

function createCapsuleGroup(memberData, classDef, isMyTeam) {
    const group = new THREE.Group();
    const tex = createCharTexture(classDef.emoji, memberData.color, memberData.name, isMyTeam);
    const mat = new THREE.SpriteMaterial({ map: tex });
    const body = new THREE.Sprite(mat);
    body.scale.set(1.8, 2.2, 1); body.position.y = 1;
    group.add(body); group.userData.body = body;

    const hpBar = createBarSprite('#22c55e'); hpBar.position.y = 2.5; group.add(hpBar); group.userData.hpBar = hpBar;
    
    const castBar = createBarSprite('#facc15'); castBar.position.y = 2.7; castBar.visible = false;
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

            group.position.x += (member.x - group.position.x) * 0.15;
            group.position.z += (member.z - group.position.z) * 0.15;

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
                    if (playerId === myId) {
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

    if (myId && players[myId]) {
        const myAlive = players[myId].squad.filter(m => m.alive);
        const opponentId = Object.keys(players).find(id => id !== myId);
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
    return `
        <div class="stat-panel-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <b style="font-size:18px;">${member.name}</b>
            </div>
            <div style="font-size:13px; line-height:1.8;">
                <div style="display:flex; justify-content:space-between;"><span>ATK</span> <b style="color:#fbbf24">${s.atk}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>HP</span> <b style="color:#ef4444">${Math.floor(s.hp)}/${s.maxHp}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>DEF</span> <b style="color:#94a3b8">${s.def}</b></div>
                <hr style="border:0; border-top:1px solid #334155; margin:8px 0;">
                <div style="display:flex; justify-content:space-between;"><span>Crit Rate</span> <b>${s.crit/10}%</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Crit DMG</span> <b>+${s.critDmg/10}%</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Dodge</span> <b>${s.dodge/10}%</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Block</span> <b>${s.block/10}%</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Penetration</span> <b>${s.pen/10}%</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Accuracy</span> <b>${s.acc/10}%</b></div>
                <hr style="border:0; border-top:1px solid #334155; margin:8px 0;">
                <div style="display:flex; justify-content:space-between;"><span>Speed (Move)</span> <b>${s.moveSpeed}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>MP Recov/Atk</span> <b>${s.mpAtk}</b></div>
            </div>
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
            
            if (data.skillIdx === 0) {
                spawnSealVfx(tgtGrp, 7000);
            }
        }
    };

    if (data.dash && memberGrp) {
        if (data.effects.length > 1) {
            // Sequential Dash Animation
            data.effects.forEach((effect, i) => {
                setTimeout(() => {
                    const stepTgt = capsules[actualOpponentId]?.[effect.targetIndex];
                    if (stepTgt) {
                        memberGrp.position.x = stepTgt.position.x;
                        memberGrp.position.z = stepTgt.position.z;
                        processHit(effect);
                    }
                    // On final step, move to behind the target
                    if (i === data.effects.length - 1) {
                        setTimeout(() => {
                            memberGrp.position.x = data.newX;
                            memberGrp.position.z = data.newZ;
                        }, 100);
                    }
                }, i * 150); // 150ms between dashes
            });
        } else {
            // Immediate jump (1 target or fallback)
            memberGrp.position.x = data.newX;
            memberGrp.position.z = data.newZ;
            data.effects.forEach(processHit);
        }
    } else if (data.type === 'projectile' && memberGrp) {
        data.effects.forEach((effect, idx) => {
            const tgtGrp = capsules[actualOpponentId]?.[effect.targetIndex];
            if (tgtGrp) {
                setTimeout(() => {
                    spawnProjectile(memberGrp.position.clone().add(new THREE.Vector3(0,1,0)), tgtGrp.position.clone().add(new THREE.Vector3(0,1,0)), '#facc15');
                    setTimeout(() => processHit(effect), 400); // 400ms sync with projectile duration
                }, idx * 250); // delay second projectile by 250ms
            }
        });
    } else if (data.type === 'stealth' && memberGrp) {
        // Small puff of smoke for stealth activation
        spawnAoeExplosion(memberGrp.position.x, memberGrp.position.z);
    } else {
        // Standard non-dash skills
        data.effects.forEach(processHit);
    }

    if (data.type === 'aoe_damage' && memberGrp) {
        spawnAoeExplosion(memberGrp.position.x, memberGrp.position.z);
    }

    if(memberGrp) {
        // Hide cast bar
        memberGrp.userData.castBar.visible = false;
    }
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
animate();
