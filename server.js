const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// CLASS DEFINITIONS - Assassin Prototype
// ============================================================
const ORB_COST = 1000; // 1 Orb = 1000 Energy
const TEST_MODE = true; // Set to true to fight NPC Dummy
const MAX_SQUAD_SIZE = 1; // 1 member for testing

const CLASS_DEFS = {
    assassin: {
        name: 'Assassin', emoji: '🥷', color: '#1e293b',
        maxHp: 1200, maxMp: 5000, pAtk: 250, mAtk: 0, pDef: 50, mDef: 50,
        crit: 350, critDmg: 500, acc: 1000, dodge: 200, pen: 150, block: 50, lifesteal: 0,
        mpAtk: 200, mpSec: 100,
        atkSpeed: 800, range: 'melee', atkRange: 1.8, moveSpeed: 0.025,
        skills: [
            { name: 'Phi Tiêu', orbCost: 1, cooldown: 7000, castTime: 0, type: 'projectile', multiplier: 1.5, castRange: 10, dash: false },
            { name: 'Đột Kích', orbCost: 2, cooldown: 7000, castTime: 0, type: 'melee_strike', multiplier: 2.5, castRange: 1.8, dash: true },
            { name: 'Tàng Hình', orbCost: 3, cooldown: 10000, castTime: 0, type: 'stealth', multiplier: 0, dash: false }
        ],
        passives: [
            { name: 'Đánh Lén', type: 'backstab_crit', value: 0.50 }
        ]
    },
    monster_tank: {
        name: 'Tanker', emoji: '🛡️', color: '#eab308',
        maxHp: 5000, maxMp: 1000, pAtk: 150, mAtk: 0, pDef: 300, mDef: 200,
        crit: 50, critDmg: 200, acc: 900, dodge: 50, pen: 0, block: 400, lifesteal: 0,
        mpAtk: 100, mpSec: 50,
        atkSpeed: 1500, range: 'melee', atkRange: 1.8, moveSpeed: 0.025,
        skills: [], passives: []
    },
    monster_archer: {
        name: 'Xạ Thủ', emoji: '🏹', color: '#ef4444',
        maxHp: 3000, maxMp: 1000, pAtk: 250, mAtk: 0, pDef: 100, mDef: 100,
        crit: 150, critDmg: 500, acc: 1100, dodge: 100, pen: 300, block: 50, lifesteal: 0,
        mpAtk: 150, mpSec: 50,
        atkSpeed: 1000, range: 'ranged', atkRange: 10, moveSpeed: 0.025,
        skills: [], passives: []
    },
    monster_supporter: {
        name: 'Hỗ Trợ', emoji: '🪄', color: '#22c55e',
        maxHp: 3000, maxMp: 1000, pAtk: 0, mAtk: 120, pDef: 100, mDef: 200,
        crit: 100, critDmg: 300, acc: 1000, dodge: 100, pen: 0, block: 50, lifesteal: 0,
        mpAtk: 300, mpSec: 150,
        atkSpeed: 1200, range: 'ranged', atkRange: 6, moveSpeed: 0.025,
        skills: [], passives: []
    },
    monster_dummy: {
        name: 'Cọc Gỗ (Test)', emoji: '🪵', color: '#78350f',
        maxHp: 9999999, maxMp: 1, pAtk: 0, mAtk: 0, pDef: 500, mDef: 500,
        crit: 0, critDmg: 0, acc: 0, dodge: 0, pen: 0, block: 0, lifesteal: 0,
        mpAtk: 0, mpSec: 0,
        atkSpeed: 999999, range: 'melee', atkRange: 1.8, moveSpeed: 0,
        skills: [], passives: []
    }
};

// We will use 1 Assassins if TEST_MODE is active
const SQUAD_ORDER = TEST_MODE ? ['assassin'] : ['assassin', 'assassin', 'assassin', 'assassin'];

// ============================================================
// GAME STATE
// ============================================================
let rooms = {};
let waitingPlayer = null;

function createSquad(side) {
    const startX = side === 'left' ? -30 : 30;
    const direction = side === 'left' ? 1 : -1;

    if (TEST_MODE && side === 'right') {
        const monsters = ['monster_tank', 'monster_archer', 'monster_supporter'];
        return monsters.map((classId, index) => {
            const def = CLASS_DEFS[classId];
            let xPos = classId === 'monster_tank' ? 25 : 30;
            let zPos = 0;
            if (classId === 'monster_archer') zPos = -3;
            if (classId === 'monster_supporter') zPos = 3;
            
            return {
                classId, name: def.name, emoji: def.emoji, color: def.color,
                hp: def.maxHp, maxHp: def.maxHp, mp: 0, maxMp: def.maxMp,
                pAtk: def.pAtk, mAtk: def.mAtk, pDef: def.pDef, mDef: def.mDef, 
                crit: def.crit, critDmg: def.critDmg, acc: def.acc, dodge: def.dodge, pen: def.pen, block: def.block, lifesteal: def.lifesteal,
                mpAtk: def.mpAtk, mpSec: def.mpSec,
                atkSpeed: def.atkSpeed, atkRange: def.atkRange, range: def.range, moveSpeed: def.moveSpeed,
                alive: true, x: xPos, y: 0, z: zPos, side, state: 'moving', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: 0,
                skillCooldowns: [0, 0, 0], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: []
            };
        });
    }

    return SQUAD_ORDER.map((classId, index) => {
        const def = CLASS_DEFS[classId];
        let xOffset = index * 1.5 * direction;

        return {
            classId, name: def.name, emoji: def.emoji, color: def.color,
            hp: def.maxHp, maxHp: def.maxHp, mp: 0, maxMp: def.maxMp,
            pAtk: def.pAtk, mAtk: def.mAtk, pDef: def.pDef, mDef: def.mDef,
            crit: def.crit, critDmg: def.critDmg, acc: def.acc, dodge: def.dodge, pen: def.pen, block: def.block, lifesteal: def.lifesteal,
            mpAtk: def.mpAtk, mpSec: def.mpSec,
            atkSpeed: def.atkSpeed, atkRange: def.atkRange, range: def.range, moveSpeed: def.moveSpeed,
            alive: true, x: startX + xOffset, y: 0, z: (index - 1.5) * 1.8, side,
            state: 'moving', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: 0,
            skillCooldowns: [0, 0, 0], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: []
        };
    });
}

// ============================================================
// EFFECTIVE STATS ENGINE (Buff/Debuff applied dynamically)
// ============================================================
function getEffectiveStats(member, now) {
    const def = CLASS_DEFS[member.classId];
    const stats = {
        pAtk: member.pAtk,
        mAtk: member.mAtk,
        pDef: member.pDef,
        mDef: member.mDef,
        crit: member.crit,
        critDmg: member.critDmg,
        acc: member.acc,
        dodge: member.dodge,
        pen: member.pen,
        block: member.block,
        atkSpeed: member.atkSpeed,
        moveSpeed: member.moveSpeed,
        mpAtk: member.mpAtk,
    };

    // Base values (from CLASS_DEFS) for comparison
    const base = {
        pAtk: def.pAtk,
        mAtk: def.mAtk,
        pDef: def.pDef,
        mDef: def.mDef,
        crit: def.crit,
        critDmg: def.critDmg,
        acc: def.acc,
        dodge: def.dodge,
        pen: def.pen,
        block: def.block,
        atkSpeed: def.atkSpeed,
        moveSpeed: def.moveSpeed,
        mpAtk: def.mpAtk,
    };

    // Apply status effects
    member.statusEffects.forEach(ef => {
        if (now >= ef.endTime) return; // expired

        if (ef.type === 'seal') {
            // Seal debuff: -10% Physical DEF
            stats.pDef = Math.floor(stats.pDef * 0.9);
        }
        if (ef.type === 'stealth') {
            // Stealth buff: +10% P.ATK, +10% attack speed (lower delay)
            stats.pAtk = Math.floor(stats.pAtk * 1.1);
            stats.atkSpeed = Math.floor(stats.atkSpeed * 0.9);
        }
    });

    return { stats, base };
}

function calculateDamage(attacker, target, skillMultiplier = 1.0, now) {
    const atkEff = getEffectiveStats(attacker, now).stats;
    const tgtEff = getEffectiveStats(target, now).stats;

    // Use Physical or Magical based on attacker's primary type
    const isMagical = attacker.classId === 'monster_supporter';
    const activeAtk = isMagical ? atkEff.mAtk : atkEff.pAtk;
    const activeDef = isMagical ? tgtEff.mDef : tgtEff.pDef;

    // 1. Dodge Check
    const dodgeChance = Math.max(0, tgtEff.dodge - atkEff.acc) / 1000;
    if (Math.random() < dodgeChance) {
        return { damage: 0, isMiss: true, isBlock: false, isCrit: false };
    }

    // 2. Base Damage from effective stats
    let rawDamage = activeAtk * skillMultiplier;

    // 3. Crit Check
    const critChance = atkEff.crit / 1000;
    let isCrit = false;
    if (Math.random() < critChance) {
        isCrit = true;
        rawDamage *= (2.0 + (atkEff.critDmg / 1000));
    }

    // 4. Block Check (Only if not Crit)
    let isBlock = false;
    if (!isCrit) {
        const blockChance = tgtEff.block / 1000;
        if (Math.random() < blockChance) {
            isBlock = true;
            rawDamage *= 0.5;
        }
    }

    // 5. PEN & DEF mitigation
    const effectiveDef = activeDef * (1 - atkEff.pen / 1000);
    const mitigation = effectiveDef / (effectiveDef + 300);
    const finalDamage = Math.max(1, Math.floor(rawDamage * (1 - mitigation)));

    return { damage: finalDamage, isMiss: false, isBlock, isCrit };
}

function canBeTargeted(m, now) {
    if (!m.alive) return false;
    const stealthInfo = m.statusEffects.find(ef => ef.type === 'stealth');
    return !(stealthInfo && stealthInfo.endTime > now);
}

function findLowestHpTarget(enemySquad, now) {
    const alive = enemySquad.filter(m => canBeTargeted(m, now));
    if (alive.length === 0) return null;

    if (Math.random() < 0.05) {
        // 5% chance to aim at any random targetable enemy
        return alive[Math.floor(Math.random() * alive.length)];
    }

    let lowestHp = Math.min(...alive.map(m => m.hp));
    const lowestHpEnemies = alive.filter(m => m.hp === lowestHp);
    
    // Pick a random one from the lowest HP enemies
    return lowestHpEnemies[Math.floor(Math.random() * lowestHpEnemies.length)];
}

function findBestTarget(attacker, enemySquad, now) {
    const alive = enemySquad.filter(m => canBeTargeted(m, now));
    if (alive.length === 0) return null;
    let closest = alive[0];
    let closestDist = Math.abs(attacker.x - closest.x);
    alive.forEach(m => {
        const dist = Math.abs(attacker.x - m.x);
        if (dist < closestDist) {
            closestDist = dist;
            closest = m;
        }
    });
    return closest;
}

// ============================================================
// SOCKET HANDLING
// ============================================================
io.on('connection', (socket) => {
    console.log(`[CONNECTION] New client connected: ${socket.id}`);
    if (TEST_MODE) {
        // AUTO-START with NPC
        const roomId = `room_test_${Date.now()}`;
        const p1 = socket.id;
        const npcId = 'npc_monster';

        rooms[roomId] = {
            id: roomId,
            status: 'starting', // starting, active, paused
            isBotMatch: true,
            players: {
                [p1]: { side: 'left', squad: createSquad('left'), autoMode: false },
                [npcId]: { 
                    side: 'right', 
                    squad: createSquad('right'), 
                    autoMode: false,
                    isNPC: true
                }
            },
            winner: null,
            countdown: 3,
            lastTick: Date.now()
        };

        socket.join(roomId);
        socket.roomId = roomId;

        socket.emit('battleStart', { roomId, players: rooms[roomId].players, classDefs: CLASS_DEFS });
        startBattleLoop(roomId);
    } else if (waitingPlayer) {
        const roomId = `room_${Date.now()}`;
        const p1 = waitingPlayer;
        const p2 = socket.id;

        rooms[roomId] = {
            id: roomId,
            status: 'starting',
            isBotMatch: false,
            players: {
                [p1]: { side: 'left', squad: createSquad('left'), autoMode: false },
                [p2]: { side: 'right', squad: createSquad('right'), autoMode: false }
            },
            winner: null,
            countdown: 3,
            lastTick: Date.now()
        };

        io.sockets.sockets.get(p1)?.join(roomId);
        socket.join(roomId);
        if (io.sockets.sockets.get(p1)) io.sockets.sockets.get(p1).roomId = roomId;
        socket.roomId = roomId;

        io.to(roomId).emit('battleStart', { roomId, players: rooms[roomId].players, classDefs: CLASS_DEFS });
        waitingPlayer = null;
        startBattleLoop(roomId);
    } else {
        waitingPlayer = socket.id;
        socket.emit('waiting', { message: 'Đang chờ đối thủ...' });
    }

    socket.on('toggleAuto', (data) => {
        const roomId = socket.roomId;
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            rooms[roomId].players[socket.id].autoMode = data.autoMode;
        }
    });

    socket.on('queueSkill', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;

        const playerData = rooms[roomId].players[socket.id];
        if (!playerData) return;

        const member = playerData.squad[data.memberIndex];
        const skillIndex = data.skillIndex;
        if (!member || !member.alive || skillIndex === undefined) return;

        if (member.queuedSkills.includes(skillIndex)) {
            // Toggle off: Remove from queue
            member.queuedSkills.splice(member.queuedSkills.indexOf(skillIndex), 1);
        } else {
            // Add to queue
            member.queuedSkills.push(skillIndex);
        }
    });

    socket.on('debugAction', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const player = rooms[roomId].players[socket.id];
        if (!player) return;

        if (data.type === 'fillMana') {
            player.squad.forEach(m => m.mp = m.maxMp);
        } else if (data.type === 'noMana') {
            player.debugNoMana = !!data.value;
        } else if (data.type === 'godMode') {
            player.debugGodMode = !!data.value;
        }
    });

    socket.on('debugEnemyAction', (data) => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room) return;

        const cid = socket.id;
        const opponentId = Object.keys(room.players).find(id => id !== cid);
        if (!opponentId) return;

        if (data.type === 'spawnStandard' || data.type === 'spawnDummy') {
            // Reset player targets
            room.players[cid].squad.forEach(m => {
                m.targetIndex = -1;
                m.lockedTargetIndex = -1;
                m.state = 'idle';
            });

            if (data.type === 'spawnDummy') {
                room.players[opponentId].debugGodMode = true; // Immortal dummy
                const def = CLASS_DEFS['monster_dummy'];
                room.players[opponentId].squad = [{
                    classId: 'monster_dummy', name: def.name, emoji: def.emoji, color: def.color,
                    hp: def.maxHp, maxHp: def.maxHp, mp: 0, maxMp: def.maxMp,
                    pAtk: def.pAtk, mAtk: def.mAtk, pDef: def.pDef, mDef: def.mDef,
                    crit: def.crit, critDmg: def.critDmg, acc: def.acc, dodge: def.dodge, pen: def.pen, block: def.block, lifesteal: def.lifesteal,
                    mpAtk: def.mpAtk, mpSec: def.mpSec,
                    atkSpeed: def.atkSpeed, atkRange: def.atkRange, range: def.range, moveSpeed: def.moveSpeed,
                    alive: true, x: 25, y: 0, z: 0, side: 'right',
                    state: 'idle', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: 0,
                    skillCooldowns: [], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: []
                }];
            } else {
                room.players[opponentId].debugGodMode = false; // Normal monsters
                room.players[opponentId].squad = createSquad('right');
            }

            io.to(roomId).emit('squadResized', { playerId: opponentId, newSquad: room.players[opponentId].squad });
            broadcastState(roomId);
        }
    });

    socket.on('togglePause', () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        
        if (room.status === 'paused') {
            room.status = room.previousStatus || 'active';
            room.lastTick = Date.now(); // Prevent countdown jump
        } else if (room.status === 'active' || room.status === 'starting') {
            room.previousStatus = room.status;
            room.status = 'paused';
        }
        
        io.to(roomId).emit('pauseState', { paused: room.status === 'paused', isBotMatch: room.isBotMatch });
    });

    socket.on('requestReset', () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        
        // Restart logic
        Object.values(room.players).forEach(p => {
            p.squad = createSquad(p.side);
        });
        room.status = 'starting';
        room.countdown = 3;
        room.lastTick = Date.now();
        room.winner = null;
        
        io.to(roomId).emit('battleStart', { roomId, players: room.players, classDefs: CLASS_DEFS });
        // Pause UI should close
        io.to(roomId).emit('pauseState', { paused: false, isBotMatch: room.isBotMatch });
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket.id) waitingPlayer = null;
        if (socket.roomId && rooms[socket.roomId]) {
            io.to(socket.roomId).emit('opponentDisconnected');
            delete rooms[socket.roomId];
        }
    });
});

// ============================================================
// BATTLE ENGINE
// ============================================================
function startBattleLoop(roomId) {
    const tickRate = 50; // 50ms per tick

    const interval = setInterval(() => {
        const room = rooms[roomId];
        if (!room || room.winner) { clearInterval(interval); return; }

        const now = Date.now();

        // COUNTDOWN PHASE
        if (room.status === 'starting') {
            if (now - room.lastTick >= 1000) {
                room.lastTick = now;
                io.to(roomId).emit('countdown', { count: room.countdown > 0 ? room.countdown : 'START' });
                room.countdown--;
                if (room.countdown < -1) {
                    room.status = 'active';
                }
            }
            broadcastState(roomId);
            return; // Skip physics during countdown
        }

        // PAUSE TICK
        if (room.status === 'paused' && room.isBotMatch) {
            return; // Stop processing frame if playing against bot and paused
        }

        const playerIds = Object.keys(room.players);

        playerIds.forEach(playerId => {
            const playerData = room.players[playerId];
            const opponentId = playerIds.find(id => id !== playerId);
            const opponentData = room.players[opponentId];

            // 1. AUTO MODE LOGIC (Queueing)
            if (playerData.autoMode) {
                playerData.squad.forEach(member => {
                    if (!member.alive) return;
                    const def = CLASS_DEFS[member.classId];
                    // Prioritize Skill 2 -> 1 -> 0
                    for (let i = 2; i >= 0; i--) {
                        if (member.mp >= def.skills[i].orbCost * ORB_COST && now > member.skillCooldowns[i]) {
                            if (!member.queuedSkills.includes(i)) {
                                member.queuedSkills.push(i);
                            }
                        }
                    }
                });
            }

            // 2. BATTLE LOGIC (Movement & Combat)
            playerData.squad.forEach((member, memberIndex) => {
                if (!member.alive) return;

                // Cleanup expired status effects
                member.statusEffects = member.statusEffects.filter(ef => ef.endTime > now);

                // Mana Regen over time (Passive)
                member.mp = Math.min(member.maxMp, member.mp + (member.mpSec / 20)); // mpSec is per 1000ms, tick is 50ms

                const def = CLASS_DEFS[member.classId];

                // FIND TARGET - respect locked target from dash
                let target;
                if (member.lockedTargetIndex >= 0 && opponentData.squad[member.lockedTargetIndex]?.alive) {
                    target = opponentData.squad[member.lockedTargetIndex];
                    if (!canBeTargeted(target, now)) {
                        member.lockedTargetIndex = -1;
                        target = findBestTarget(member, opponentData.squad, now);
                    }
                } else {
                    member.lockedTargetIndex = -1; // Clear lock if target is dead
                    target = findBestTarget(member, opponentData.squad, now);
                }
                const targetIdx = target ? opponentData.squad.indexOf(target) : -1;
                member.targetIndex = targetIdx;

                // CHECK SKILL QUEUE & CASTING
                if (member.state === 'casting') {
                    if (now >= member.castEndTime) {
                        // EXECUTING CASTED SKILL
                        executeSkill(roomId, playerId, memberIndex, opponentId, member.castingSkillId);
                        member.state = 'idle';
                        member.castingSkillId = null;
                    }
                    return; // Can't move or attack while casting
                }

                // If not casting, check if we should start casting a queued skill
                if (member.queuedSkills.length > 0) {
                    const skillIdxToCast = member.queuedSkills[0]; // Peek
                    const skillDef = def.skills[skillIdxToCast];
                    const cost = skillDef.orbCost * ORB_COST;

                    // If enough mana (or debugNoMana) and off cooldown (or debugNoMana)
                    const hasEnoughMana = playerData.debugNoMana || member.mp >= cost;
                    const isOffCooldown = playerData.debugNoMana || now >= member.skillCooldowns[skillIdxToCast];
                    if (hasEnoughMana && isOffCooldown) {
                        const isSelfBuff = skillDef.type === 'stealth' || skillDef.type === 'self_buff';
                        const reqRange = skillDef.castRange !== undefined ? skillDef.castRange : member.atkRange;
                        
                        const dx = target ? target.x - member.x : 0;
                        const dz = target ? target.z - member.z : 0;
                        const dist2D = target ? Math.sqrt(dx * dx + dz * dz) : 0;

                        if (!target && !isSelfBuff) {
                            // wait for target
                        } else if (target && dist2D > reqRange && !isSelfBuff) {
                            // move to range to cast
                            member.state = 'moving';
                            const dirX = dx / dist2D;
                            const dirZ = dz / dist2D;
                            member.x += dirX * member.moveSpeed * tickRate;
                            member.z += dirZ * member.moveSpeed * tickRate;
                            return; 
                        } else {
                            member.queuedSkills.shift(); // Dequeue
                            if (!playerData.debugNoMana) member.mp -= cost;
                            if (!playerData.debugNoMana) member.skillCooldowns[skillIdxToCast] = now + skillDef.cooldown;

                            if (skillDef.castTime > 0) {
                                member.state = 'casting';
                                member.castingSkillId = skillIdxToCast;
                                member.castEndTime = now + skillDef.castTime;
                                io.to(roomId).emit('castStart', { 
                                    casterId: playerId, casterIdx: memberIndex, 
                                    skillIdx: skillIdxToCast, castTime: skillDef.castTime 
                                });
                                return; // Stop here, now we are casting
                            } else {
                                // Instant cast
                                executeSkill(roomId, playerId, memberIndex, opponentId, skillIdxToCast);
                                return; // Skill cast takes priority over attack this tick
                            }
                        }
                    }
                }

                if (!target) return; // If no target and didn't cast self buff, wait

                // NORMAL MOVEMENT & ATTACK
                const dx = target.x - member.x;
                const dz = target.z - member.z;
                const dist2D = Math.sqrt(dx * dx + dz * dz);

                if (dist2D > member.atkRange) {
                    member.state = 'moving';
                    const dirX = dx / dist2D;
                    const dirZ = dz / dist2D;
                    member.x += dirX * member.moveSpeed * tickRate;
                    member.z += dirZ * member.moveSpeed * tickRate;
                } else {
                    member.state = 'attacking';
                    const effAtkSpeed = getEffectiveStats(member, now).stats.atkSpeed;
                    if (now - member.lastAttackTime >= effAtkSpeed) {
                        const result = calculateDamage(member, target, 1.0, now);
                        
                        if (result.isMiss) {
                            io.to(roomId).emit('autoAttack', {
                                attackerId: playerId, attackerIndex: memberIndex,
                                targetId: opponentId, targetIndex: targetIdx, damage: 0, dodged: true
                            });
                        } else {
                            const dmg = result.damage;
                            
                            if (!opponentData.debugGodMode) {
                                target.hp = Math.max(0, target.hp - dmg);
                                if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
                            }
                            
                            // Mana from attack
                            member.mp = Math.min(member.maxMp, member.mp + member.mpAtk);
                            
                            // Lifesteal (unused for now)
                            if (member.lifesteal > 0) member.hp = Math.min(member.maxHp, member.hp + (dmg * member.lifesteal / 1000));

                            io.to(roomId).emit('autoAttack', {
                                attackerId: playerId, attackerIndex: memberIndex,
                                targetId: opponentId, targetIndex: targetIdx, damage: dmg, 
                                isBlock: result.isBlock, isCrit: result.isCrit
                            });
                        }
                        member.lastAttackTime = now;
                    }
                }
            });
        });

        broadcastState(roomId);
        checkWinCondition(roomId);
    }, tickRate);
}

function executeSkill(roomId, casterId, casterIdx, opponentId, skillIdx) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const skillDef = CLASS_DEFS[member.classId].skills[skillIdx];
    const playerIds = Object.keys(room.players);
    const actualOpponentId = playerIds.find(id => id !== casterId); 
    const opponentData = room.players[actualOpponentId];
    const now = Date.now();
    
    let effects = [];
    let isSpecialBackstab = false;

    const isStealth = member.statusEffects.some(ef => ef.type === 'stealth' && now < ef.endTime);

    // Dash logic: Chain Dash through all sealed enemies
    if (skillDef.dash) {
        const sealedTargets = opponentData.squad
            .map((m, i) => ({ member: m, index: i }))
            .filter(obj => obj.member.alive && obj.member.statusEffects.some(ef => ef.type === 'seal' && now < ef.endTime));

        if (sealedTargets.length > 0) {
            // Determine Final Target: Lowest HP among sealed
            let finalTargetObj = sealedTargets[0];
            sealedTargets.forEach(obj => {
                if (obj.member.hp < finalTargetObj.member.hp) {
                    finalTargetObj = obj;
                } else if (obj.member.hp === finalTargetObj.member.hp) {
                    // Random tie-break
                    if (Math.random() > 0.5) finalTargetObj = obj;
                }
            });

            const finalTarget = finalTargetObj.member;
            
            // Teleport behind final target
            const dir = room.players[casterId].side === 'left' ? 1 : -1;
            member.x = finalTarget.x + (1.5 * dir); 
            member.z = finalTarget.z; 
            member.lockedTargetIndex = finalTargetObj.index;

            // Damage ALL sealed targets in the chain
            const chainHits = [];
            sealedTargets.forEach(obj => {
                const target = obj.member;
                const multiplier = skillDef.multiplier * 1.8; // Strong backstab for all sealed
                const result = calculateDamage(member, target, multiplier, now);
                const dmg = result.damage;
                
                if (!opponentData.debugGodMode) {
                    target.hp = Math.max(0, target.hp - dmg);
                    if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
                }
                chainHits.push({ targetIndex: obj.index, damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
            });

            effects = chainHits; // Use the chain as the effects
            isSpecialBackstab = true;
        } else {
            // Fallback: Dash behind best target (no seal bonus)
            const target = findBestTarget(member, opponentData.squad, now);
            if (target) {
                const dir = room.players[casterId].side === 'left' ? 1 : -1;
                member.x = target.x + (1.5 * dir); 
                member.z = target.z; 
                member.lockedTargetIndex = opponentData.squad.indexOf(target);
                
                const result = calculateDamage(member, target, skillDef.multiplier, now);
                const dmg = result.damage;
                if (!opponentData.debugGodMode) {
                    target.hp = Math.max(0, target.hp - dmg);
                    if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
                }
                effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
            }
        }
    } else if (skillDef.type === 'stealth') {
        member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'stealth'); // Reset timer if casted again
        member.statusEffects.push({ type: 'stealth', endTime: now + 5000 });
        effects.push({ targetIndex: casterIdx, isStealth: true });
    } else if (skillDef.type === 'aoe_damage') {
        opponentData.squad.forEach((enemy, i) => {
            if (enemy.alive) {
                const result = calculateDamage(member, enemy, skillDef.multiplier, now);
                const dmg = result.damage;
                
                if (!opponentData.debugGodMode) {
                    enemy.hp = Math.max(0, enemy.hp - dmg);
                    if (enemy.hp === 0) { enemy.alive = false; enemy.state = 'dead'; }
                }
                effects.push({ targetIndex: i, damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
            }
        });
    } else if (skillDef.type === 'projectile') {
        const createHit = (target) => {
            const result = calculateDamage(member, target, skillDef.multiplier, now);
            const dmg = result.damage;
            
            // APPLY SEAL
            target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'seal');
            target.statusEffects.push({ type: 'seal', endTime: now + 7000 });

            if (!opponentData.debugGodMode) {
                target.hp = Math.max(0, target.hp - dmg);
                if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
            }
            effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
        };

        if (isStealth) {
            let targetable = opponentData.squad.filter(m => canBeTargeted(m, now));
            if (targetable.length > 0) {
                targetable.sort((a, b) => a.hp === b.hp ? Math.random() - 0.5 : a.hp - b.hp);
                createHit(targetable[0]); // First lowest
                if (targetable.length > 1) {
                    createHit(targetable[1]); // Second lowest
                } else {
                    createHit(targetable[0]); // If only 1 exists, hit it twice
                }
            }
        } else {
            const target = findLowestHpTarget(opponentData.squad, now);
            if (target) createHit(target);
        }
    }

    io.to(roomId).emit('skillExecuted', {
        casterId, casterIdx, skillIdx, type: skillDef.type, dash: skillDef.dash, 
        newX: member.x, newZ: member.z, effects, isBackstab: isSpecialBackstab
    });
}

function broadcastState(roomId) {
    if (!rooms[roomId]) return;
    const now = Date.now();
    // Build a payload with effective stats for each member
    const enrichedPlayers = {};
    Object.entries(rooms[roomId].players).forEach(([pid, pdata]) => {
        enrichedPlayers[pid] = {
            ...pdata,
            squad: pdata.squad.map(m => {
                const { stats, base } = getEffectiveStats(m, now);
                return { ...m, effectiveStats: stats, baseStats: base };
            })
        };
    });
    io.to(roomId).emit('stateUpdate', { players: enrichedPlayers });
}

function checkWinCondition(roomId) {
    const room = rooms[roomId];
    if (!room || room.winner) return;

    Object.keys(room.players).forEach(playerId => {
        const allDead = room.players[playerId].squad.every(m => !m.alive);
        if (allDead) {
            const winnerId = Object.keys(room.players).find(id => id !== playerId);
            room.winner = winnerId;
            io.to(roomId).emit('battleEnd', { winnerId, loserId: playerId });
        }
    });
}

server.listen(PORT, () => {
    console.log(`Legend of Capsules is running at http://localhost:${PORT}`);
});
