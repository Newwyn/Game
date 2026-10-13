const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Client được Vite build vào dist/ (chạy `npm run build` hoặc `npm start`).
// Khi phát triển, dùng `npm run dev` và mở http://localhost:5173 (Vite tự reload khi sửa code).
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));
app.get('/', (req, res) => {
    res.status(503).send('Chưa có bản build client. Hãy chạy <code>npm start</code> (build + chạy) hoặc <code>npm run dev</code> rồi mở http://localhost:5173');
});

// ============================================================
// CLASS DEFINITIONS - Assassin Prototype
// ============================================================
const ORB_COST = 1000; // 1 Orb = 1000 Energy
const CRIT_BASE = 1.5;  // hệ số chí mạng gốc (cộng thêm Crit DMG)
const TEST_MODE = true; // Set to true to fight NPC Dummy
const MAX_SQUAD_SIZE = 1; // 1 member for testing

const CLASS_DEFS = {
    assassin: {
        name: 'Jessica', title: 'Lôi Ám', className: 'Sát Thủ', emoji: '🥷', color: '#1e293b',
        // Lối chơi COMBO BỘC PHÁ: đánh thường vừa phải; Bùa gắn Ấn -> Tàng Hình -> Đột Kích nổ to
        maxHp: 1200, maxMp: 5000, pAtk: 220, mAtk: 0, pDef: 50, mDef: 50,
        crit: 350, critDmg: 500, acc: 1000, dodge: 200, pen: 150, block: 50, lifesteal: 0,
        mpAtk: 200, mpSec: 100,
        atkSpeed: 800, range: 'melee', atkRange: 2.4, moveSpeed: 0.01,
        autoHitFrame: 3, // Frame index where damage occurs
        skills: [
            { name: 'Phóng Bùa', orbCost: 1, cooldown: 7000, castTime: 0, type: 'projectile', multiplier: 1.5, castRange: 10, dash: false, hitFrame: 3, backstep: 5 },
            { name: 'Đột Kích', orbCost: 2, cooldown: 7000, castTime: 0, type: 'melee_strike', multiplier: 2.5, castRange: 2.4, dash: true, hitFrame: 3 },
            { name: 'Tàng Hình', orbCost: 3, cooldown: 10000, castTime: 0, type: 'stealth', multiplier: 0, dash: false, hitFrame: 2 } // 5s, không bị phá khi ra đòn; Đột Kích lúc tàng hình chắc chắn chí mạng
        ],
        passives: [
            { name: 'Đánh Lén', type: 'backstab_crit', value: 0.50 } // +50% tỉ lệ chí mạng khi đánh sau lưng hoặc đang tàng hình
        ]
    },
    // Rok (Thiết Hộ) — class CHIẾN BINH: khiên lớn, đứng đầu hàng giữ quái, máu & thủ cao, đánh chậm
    warrior: {
        name: 'Rok', title: 'Thiết Hộ', className: 'Chiến Binh', emoji: '🛡️', color: '#475569',
        maxHp: 3200, maxMp: 5000, pAtk: 150, mAtk: 0, pDef: 220, mDef: 160,
        crit: 80, critDmg: 500, acc: 1000, dodge: 50, pen: 50, block: 250, lifesteal: 0,
        mpAtk: 220, mpSec: 110,
        atkSpeed: 1200, range: 'melee', atkRange: 2.4, moveSpeed: 0.01,
        autoHitFrame: 3,
        skills: [
            // Sư Tử Gầm (niệm nhanh): linh hồn sư tử gầm vang — mọi quái trong 9 đơn vị phải đánh Rok trong 4 giây
            //   và bị -10% P.DEF / M.DEF trong thời gian đó
            { name: 'Sư Tử Gầm', orbCost: 1, cooldown: 9000, castTime: 0, type: 'taunt', radius: 9, duration: 4000, defDown: 0.1, multiplier: 0, hitFrame: 2 },
            // Đẩy Khiên (niệm nhanh): húc khiên vào quái trước mặt (mục tiêu đang đánh), hất văng nó ra sau
            //   xa bằng cú nhảy lùi của Jessica (5 đơn vị) + sát thương nhẹ; đáp đất xong còn bị CHOÁNG 1 giây
            { name: 'Đẩy Khiên', orbCost: 2, cooldown: 8000, castTime: 0, type: 'knockback', castRange: 2.6, multiplier: 1.0, push: 5, knockTime: 450, stun: 1000, hitFrame: 2 },
            // Dựng Khiên (niệm nhanh): khiên ánh sáng ĐỠ MỌI ĐÒN vào Rok trong 5 giây (đứng yên, không đánh)
            //   + cả đội +20% P.DEF và +20% M.DEF trong lúc khiên dựng. Dùng Kỹ năng 1/2 -> khiên tự hạ.
            { name: 'Dựng Khiên', orbCost: 3, cooldown: 15000, castTime: 0, type: 'guard', duration: 5000, teamDef: 0.2, multiplier: 0, hitFrame: 2 },
        ],
        passives: [
            { name: 'Ý Chí Thép', type: 'low_hp_block', threshold: 0.3, value: 250 } // máu < 30%: +25% chặn đòn
        ]
    },
    monster_tank: {
        name: 'Tanker', emoji: '🛡️', color: '#eab308',
        maxHp: 5000, maxMp: 1000, pAtk: 150, mAtk: 0, pDef: 300, mDef: 200,
        crit: 50, critDmg: 200, acc: 900, dodge: 50, pen: 0, block: 400, lifesteal: 0,
        mpAtk: 100, mpSec: 50,
        atkSpeed: 1500, range: 'melee', atkRange: 2.4, moveSpeed: 0.01,
        skills: [], passives: []
    },
    monster_archer: {
        name: 'Xạ Thủ', emoji: '🏹', color: '#ef4444',
        maxHp: 3000, maxMp: 1000, pAtk: 250, mAtk: 0, pDef: 100, mDef: 100,
        crit: 150, critDmg: 500, acc: 1100, dodge: 100, pen: 300, block: 50, lifesteal: 0,
        mpAtk: 150, mpSec: 50,
        atkSpeed: 1000, range: 'ranged', atkRange: 10, moveSpeed: 0.01,
        skills: [], passives: []
    },
    monster_supporter: {
        name: 'Hỗ Trợ', emoji: '🪄', color: '#22c55e',
        maxHp: 3000, maxMp: 1000, pAtk: 0, mAtk: 120, pDef: 100, mDef: 200,
        crit: 100, critDmg: 300, acc: 1000, dodge: 100, pen: 0, block: 50, lifesteal: 0,
        mpAtk: 300, mpSec: 150,
        atkSpeed: 1200, range: 'ranged', atkRange: 6, moveSpeed: 0.01,
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
const SQUAD_ORDER = TEST_MODE ? ['assassin', 'warrior'] : ['assassin', 'warrior', 'assassin', 'warrior'];

// ============================================================
// GAME STATE
// ============================================================
let rooms = {};

// ------------------------------------------------------------
// TỐC ĐỘ TRẬN: x1.0 / x1.5 / x2.0
// Chỉ số trong CLASS_DEFS được chỉnh cho mức x1.5 (BASE_SPEED). Mỗi phòng có "đồng hồ trận" (room.clock, ms)
// chạy nhanh/chậm theo tốc độ: hồi chiêu, tốc đánh, hiệu ứng, di chuyển, hồi mana đều theo đồng hồ này.
// ------------------------------------------------------------
const GAME_SPEEDS = [1, 1.5, 2];
const BASE_SPEED = 1.5;
const DEFAULT_SPEED = 1;
const timeScaleOf = (room) => (room.speed ?? DEFAULT_SPEED) / BASE_SPEED;
let waitingPlayer = null;

function createSquad(side, disabled = []) {
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

    let order = SQUAD_ORDER.filter(c => !disabled.includes(c));
    if (order.length === 0) order = [SQUAD_ORDER[0]];
    return order.map((classId, index) => {
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
            // Ấn: -15% P.DEF
            stats.pDef = Math.floor(stats.pDef * 0.85);
        }
        if (ef.type === 'taunted' && ef.defDown) {
            // Sư Tử Gầm: bị khiếp sợ -> giảm thủ
            stats.pDef = Math.floor(stats.pDef * (1 - ef.defDown));
            stats.mDef = Math.floor(stats.mDef * (1 - ef.defDown));
        }
        if (ef.type === 'guard_aura') {
            // Dựng Khiên của Chiến Binh: cả đội cứng hơn
            stats.pDef = Math.floor(stats.pDef * (1 + (ef.value ?? 0.2)));
            stats.mDef = Math.floor(stats.mDef * (1 + (ef.value ?? 0.2)));
        }
        if (ef.type === 'fortress') {
            // Thành Trì: cả đội cứng cáp hơn (giảm sát thương tính ở calculateDamage)
        }
        if (ef.type === 'stealth') {
            // Tàng hình: +20% P.ATK, +10% tốc đánh
            stats.pAtk = Math.floor(stats.pAtk * 1.2);
            stats.atkSpeed = Math.floor(stats.atkSpeed * 0.9);
        }
    });

    // Nội tại Ý Chí Thép (Chiến Binh): máu thấp -> tăng chặn đòn
    for (const p of def?.passives ?? []) {
        if (p.type === 'low_hp_block' && member.maxHp > 0 && member.hp / member.maxHp < p.threshold) stats.block += p.value;
    }

    return { stats, base };
}

// ============================================================
// COMBAT PIPELINE (Base -> Crit -> Block -> Mitigation -> Final)
// ============================================================
/** Kẻ tấn công đứng SAU LƯNG mục tiêu? (mục tiêu luôn quay mặt về phía phe địch) */
function isBehind(attacker, target) {
    return target.side === 'right' ? attacker.x > target.x : attacker.x < target.x;
}

/** Cộng thêm tỉ lệ chí mạng từ nội tại (‰) */
function passiveCritBonus(attacker, target, now) {
    const def = CLASS_DEFS[attacker.classId];
    let bonus = 0;
    for (const p of def?.passives ?? []) {
        if (p.type !== 'backstab_crit') continue;
        const stealthed = attacker.statusEffects?.some(ef => ef.type === 'stealth' && ef.endTime > now);
        if (stealthed || isBehind(attacker, target)) bonus += p.value * 1000;
    }
    return bonus;
}

function calculateDamage(attacker, target, skillMultiplier = 1.0, now, opts = {}) {
    const atkEff = getEffectiveStats(attacker, now).stats;
    const tgtEff = getEffectiveStats(target, now).stats;

    // 1. DETERMINE TYPE (Physical vs Magical)
    const isMagical = attacker.classId === 'monster_supporter';
    const activeAtk = isMagical ? atkEff.mAtk : atkEff.pAtk;
    const activeDef = isMagical ? tgtEff.mDef : tgtEff.pDef;

    // 2. HIT/DODGE CHECK
    // Né thật = né của mục tiêu trừ phần CHÍNH XÁC VƯỢT 100% của kẻ tấn công
    // (VD: Sát Thủ né 20% gặp Xạ Thủ chính xác 110% -> còn 10%; gặp quái chính xác 90% -> giữ 20%)
    const dodgeChance = Math.max(0, tgtEff.dodge - Math.max(0, atkEff.acc - 1000)) / 1000;
    if (Math.random() < dodgeChance) {
        return { damage: 0, isMiss: true, isBlock: false, isCrit: false };
    }

    // 3. BASE DAMAGE CALCULATION
    let damage = activeAtk * skillMultiplier;

    // 4. CRITICAL STRIKE CHECK
    // Chí mạng: nhân (1.5 + Crit DMG). VD Crit DMG 50% -> x2.0
    const critChance = (atkEff.crit + passiveCritBonus(attacker, target, now)) / 1000;
    let isCrit = false;
    if (opts.forceCrit || Math.random() < critChance) {
        isCrit = true;
        damage *= (CRIT_BASE + (atkEff.critDmg / 1000));
    }

    // 5. BLOCK CHECK (Only if not Crit)
    let isBlock = false;
    if (!isCrit) {
        const blockChance = tgtEff.block / 1000;
        if (Math.random() < blockChance) {
            isBlock = true;
            damage *= 0.5; // Block reduces damage by 50%
        }
    }

    // 6. ARMOR/DEFENSE MITIGATION
    const penetration = atkEff.pen / 1000;
    const effectiveDef = activeDef * (1 - penetration);
    const mitigation = effectiveDef / (effectiveDef + 300); // DR Formula: Def / (Def + K)
    
    // 7. FINAL DAMAGE PIPELINE
    // Dựng Khiên: đỡ toàn bộ đòn đánh
    if (target.statusEffects?.some(ef => ef.type === 'guard' && ef.endTime > now)) {
        return { damage: 0, isMiss: false, isBlock: true, isCrit: false, guarded: true };
    }
    // Thành Trì: giảm sát thương nhận
    const fort = target.statusEffects?.find(ef => ef.type === 'fortress' && ef.endTime > now);
    if (fort) damage *= 1 - (fort.reduce ?? 0.3);

    const finalDamage = Math.max(1, Math.floor(damage * (1 - mitigation)));

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
    // Khoảng cách 2D (x, z) — nhân vật giờ đi lại tự do trên mặt phẳng
    const distTo = (m) => Math.hypot(attacker.x - m.x, (attacker.z || 0) - (m.z || 0));
    let closest = alive[0];
    let closestDist = distTo(closest);
    alive.forEach(m => {
        const dist = distTo(m);
        if (dist < closestDist) {
            closestDist = dist;
            closest = m;
        }
    });
    return closest;
}

// ============================================================
// GIỚI HẠN ĐẤU TRƯỜNG
// ============================================================
const ARENA_BOUNDS = { minX: -48, maxX: 48, minZ: -13, maxZ: 13 };

function clampToArena(member) {
    member.x = Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, member.x));
    member.z = Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, member.z));
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
            lastTick: Date.now(),
            speed: DEFAULT_SPEED, clock: Date.now(),
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
            lastTick: Date.now(),
            speed: DEFAULT_SPEED, clock: Date.now(),
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

    socket.on('setSpeed', (data) => {
        const room = rooms[socket.roomId];
        if (!room || !room.players[socket.id] || !GAME_SPEEDS.includes(data?.speed)) return;
        room.speed = data.speed;
        io.to(socket.roomId).emit('speedChanged', { speed: room.speed });
    });

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
        } else if (data.type === 'toggleMember') {
            // Bật / tắt 1 nhân vật ra trận (để test riêng từng nhân vật). Luôn giữ ít nhất 1 người.
            const cls = data.value;
            if (!SQUAD_ORDER.includes(cls)) return;
            const off = new Set(player.disabledClasses ?? []);
            if (off.has(cls)) off.delete(cls); else off.add(cls);
            if (SQUAD_ORDER.every(c => off.has(c))) return; // không cho tắt hết
            player.disabledClasses = [...off];
            const room = rooms[roomId];
            player.squad = createSquad(player.side, player.disabledClasses);
            // Phe địch: xoá mục tiêu / khiêu khích trỏ vào đội hình cũ
            Object.values(room.players).forEach(p => p.squad.forEach(m => {
                m.targetIndex = -1; m.lockedTargetIndex = -1;
                if (p !== player) m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'taunted');
            }));
            if (room.winner) { room.winner = null; room.status = 'active'; startBattleLoop(roomId); }
            io.to(roomId).emit('squadResized', { playerId: socket.id, newSquad: player.squad });
            socket.emit('memberToggles', { disabled: player.disabledClasses });
            broadcastState(roomId);
        }
    });

    socket.on('debugEnemyAction', (data) => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room) return;

        const cid = socket.id;
        const opponentId = Object.keys(room.players).find(id => id !== cid);
        if (!opponentId) return;

        if (data.type === 'godMode') {
            // Bất tử cho phe quái (giữ nguyên khi triệu hồi lại quái)
            room.enemyGodMode = !!data.value;
            room.players[opponentId].debugGodMode = room.enemyGodMode;
            return;
        }
        const DUMMY_TYPES = ['spawnDummy', 'addDummy', 'removeDummy'];
        if (data.type === 'spawnStandard' || DUMMY_TYPES.includes(data.type)) {
            // Reset player targets
            room.players[cid].squad.forEach(m => {
                m.targetIndex = -1;
                m.lockedTargetIndex = -1;
                m.state = 'idle';
            });

            const opp = room.players[opponentId];
            if (DUMMY_TYPES.includes(data.type)) {
                // Cọc gỗ bất tử để test. Thêm / bớt từng cọc, mỗi cọc cách nhau DUMMY_GAP;
                // máu đặt sẵn khác nhau (100%, 85%, 70%...) để thử các kỹ năng chọn mục tiêu theo máu.
                const DUMMY_GAP = 3, MAX_DUMMIES = 8;
                const current = opp.squad.every(m => m.classId === 'monster_dummy') ? opp.squad.length : 0;
                let count = data.type === 'spawnDummy' ? 1 : current + (data.type === 'addDummy' ? 1 : -1);
                count = Math.max(1, Math.min(MAX_DUMMIES, count));
                opp.debugGodMode = true;
                const def = CLASS_DEFS['monster_dummy'];
                opp.squad = Array.from({ length: count }, (_, i) => {
                    const hp = Math.round(def.maxHp * Math.max(0.1, 1 - 0.15 * i));
                    return {
                        classId: 'monster_dummy', name: `${def.name} ${i + 1}`, emoji: def.emoji, color: def.color,
                        hp, maxHp: def.maxHp, mp: 0, maxMp: def.maxMp,
                        pAtk: def.pAtk, mAtk: def.mAtk, pDef: def.pDef, mDef: def.mDef,
                        crit: def.crit, critDmg: def.critDmg, acc: def.acc, dodge: def.dodge, pen: def.pen, block: def.block, lifesteal: def.lifesteal,
                        mpAtk: def.mpAtk, mpSec: def.mpSec,
                        atkSpeed: def.atkSpeed, atkRange: def.atkRange, range: def.range, moveSpeed: def.moveSpeed,
                        alive: true, x: 25 + i * DUMMY_GAP, y: 0, z: 0, side: 'right',
                        state: 'idle', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: 0,
                        skillCooldowns: [], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: []
                    };
                });
            } else {
                opp.debugGodMode = !!room.enemyGodMode; // quái thường: theo nút Bất Tử phe địch
                opp.squad = createSquad('right');
            }

            if (room.winner) {
                room.winner = null;
                room.status = 'active';
                startBattleLoop(roomId);
            }

            io.to(roomId).emit('squadResized', { playerId: opponentId, newSquad: opp.squad });
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
        
        if (room.interval) {
            clearInterval(room.interval);
            room.interval = null;
        }

        // Restart logic
        Object.values(room.players).forEach(p => {
            p.squad = createSquad(p.side, p.disabledClasses);
        });
        room.status = 'starting';
        room.countdown = 3;
        room.lastTick = Date.now();
        room.winner = null;
        
        io.to(roomId).emit('battleStart', { roomId, players: room.players, classDefs: CLASS_DEFS });
        // Pause UI should close
        io.to(roomId).emit('pauseState', { paused: false, isBotMatch: room.isBotMatch });

        // CRITICAL FIX: Restart the battle loop!
        startBattleLoop(roomId);
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket.id) waitingPlayer = null;
        if (socket.roomId && rooms[socket.roomId]) {
            if (rooms[socket.roomId].interval) {
                clearInterval(rooms[socket.roomId].interval);
            }
            io.to(socket.roomId).emit('opponentDisconnected');
            delete rooms[socket.roomId];
        }
    });
});

// ============================================================
// BATTLE ENGINE
// ============================================================
function startBattleLoop(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.interval) {
        clearInterval(room.interval);
        room.interval = null;
    }

    const tickRate = 50; // 50ms per tick

    room.interval = setInterval(() => {
        const currentRoom = rooms[roomId];
        if (!currentRoom || currentRoom.winner) {
            if (currentRoom && currentRoom.interval) {
                clearInterval(currentRoom.interval);
                currentRoom.interval = null;
            }
            return;
        }

        // Đồng hồ trận: chỉ chạy khi trận đang diễn ra, nhanh/chậm theo tốc độ phòng
        const realNow = Date.now();
        const realDt = Math.min(250, realNow - (room.lastReal ?? realNow));
        room.lastReal = realNow;
        if (room.clock == null) room.clock = realNow;
        const ts = timeScaleOf(room);
        if (room.status === 'active') room.clock += realDt * ts;
        const now = room.clock;

        // COUNTDOWN PHASE (giây thật)
        if (room.status === 'starting') {
            if (realNow - room.lastTick >= 1000) {
                room.lastTick = realNow;
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
                    // Prioritize Skill 2 -> 1 -> 0 (đang Dựng Khiên thì AUTO không tự hạ khiên)
                    const guarding = member.statusEffects.some(ef => ef.type === 'guard' && ef.endTime > now);
                    for (let i = 2; i >= 0; i--) {
                        if (guarding) continue;
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
                member.mp = Math.min(member.maxMp, member.mp + (member.mpSec / 20) * ts); // mpSec mỗi 1000ms, tick 50ms

                const def = CLASS_DEFS[member.classId];

                // CHOÁNG: đứng im, không đánh, không niệm (bị ngắt niệm)
                if (member.statusEffects.some(ef => ef.type === 'stun' && ef.endTime > now)) {
                    member.state = 'stunned';
                    member.castingSkillId = null;
                    return;
                }
                if (member.state === 'stunned') member.state = 'idle';

                // BỊ HẤT VĂNG (Đẩy Khiên): đang bay ra sau, chưa làm gì được
                if (member.statusEffects.some(ef => ef.type === 'knocked' && ef.endTime > now)) {
                    member.state = 'idle';
                    return;
                }

                // DỰNG KHIÊN: đứng yên giữ khiên, không di chuyển / đánh.
                // Nếu người chơi ra lệnh Kỹ năng 1 hoặc 2 -> cho dùng (khiên sẽ tự hạ khi kỹ năng thi triển)
                if (member.statusEffects.some(ef => ef.type === 'guard' && ef.endTime > now)) {
                    const wantsOther = member.queuedSkills.some(i => i !== 2 &&
                        (playerData.debugNoMana || (member.mp >= def.skills[i].orbCost * ORB_COST && now >= member.skillCooldowns[i])));
                    if (!wantsOther) {
                        member.queuedSkills = member.queuedSkills.filter(i => i !== 2 || !def.skills[i] || def.skills[i].type !== 'guard');
                        member.state = 'guarding';
                        return;
                    }
                }
                if (member.state === 'guarding') member.state = 'idle';

                // FIND TARGET - respect locked target from dash
                let target;
                const taunt = member.statusEffects.find(ef => ef.type === 'taunted' && ef.endTime > now);
                const taunter = taunt ? opponentData.squad[taunt.sourceIndex] : null;
                if (taunter && taunter.alive && canBeTargeted(taunter, now)) {
                    target = taunter; // bị Khiêu Khích: buộc đánh người khiêu khích
                } else if (member.lockedTargetIndex >= 0 && opponentData.squad[member.lockedTargetIndex]?.alive) {
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
                        const isSelfBuff = ['stealth', 'self_buff', 'taunt', 'fortress', 'guard'].includes(skillDef.type);
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
                            member.x += dirX * member.moveSpeed * tickRate * ts;
                            member.z += dirZ * member.moveSpeed * tickRate * ts;
                            clampToArena(member);
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

                if (!target) { if (member.state === 'moving') member.state = 'idle'; return; } // không còn mục tiêu

                // NORMAL MOVEMENT & ATTACK
                const dx = target.x - member.x;
                const dz = target.z - member.z;
                const dist2D = Math.sqrt(dx * dx + dz * dz);

                if (dist2D > member.atkRange) {
                    member.state = 'moving';
                    const dirX = dx / dist2D;
                    const dirZ = dz / dist2D;
                    member.x += dirX * member.moveSpeed * tickRate * ts;
                    member.z += dirZ * member.moveSpeed * tickRate * ts;
                    clampToArena(member);
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
    const now = room.clock ?? Date.now();
    
    let effects = [];
    let isSpecialBackstab = false;

    const isStealth = member.statusEffects.some(ef => ef.type === 'stealth' && now < ef.endTime);

    // Đang Dựng Khiên mà dùng kỹ năng khác -> hạ khiên (mất luôn buff thủ của cả đội)
    let guardBroken = false;
    if (skillDef.type !== 'guard' && member.statusEffects.some(ef => ef.type === 'guard' && ef.endTime > now)) {
        endGuard(room.players[casterId].squad, casterIdx);
        guardBroken = true;
    }

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

            // Thứ tự lướt chém: máu NHIỀU trước -> máu ÍT sau; kết thúc (đứng lại) ở mục tiêu máu ít nhất
            sealedTargets.sort((a, b) => (b.member.hp - a.member.hp) || (a === finalTargetObj ? 1 : b === finalTargetObj ? -1 : 0));
            const last = sealedTargets.indexOf(finalTargetObj);
            if (last !== sealedTargets.length - 1) { sealedTargets.splice(last, 1); sealedTargets.push(finalTargetObj); }

            const finalTarget = finalTargetObj.member;
            
            // Teleport behind final target
            const dir = room.players[casterId].side === 'left' ? 1 : -1;
            member.x = finalTarget.x + (2.0 * dir); 
            member.z = finalTarget.z; 
            member.lockedTargetIndex = finalTargetObj.index;

            // Damage ALL sealed targets in the chain
            const chainHits = [];
            sealedTargets.forEach(obj => {
                const target = obj.member;
                const multiplier = skillDef.multiplier * 1.8; // Strong backstab for all sealed
                const result = calculateDamage(member, target, multiplier, now, { forceCrit: isStealth });
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
                member.x = target.x + (2.0 * dir); 
                member.z = target.z; 
                member.lockedTargetIndex = opponentData.squad.indexOf(target);
                
                const result = calculateDamage(member, target, skillDef.multiplier, now, { forceCrit: isStealth });
                const dmg = result.damage;
                if (!opponentData.debugGodMode) {
                    target.hp = Math.max(0, target.hp - dmg);
                    if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
                }
                effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
            }
        }
    } else if (skillDef.type === 'taunt') {
        // Khiêu Khích: quái trong bán kính phải đánh người dùng
        opponentData.squad.forEach((enemy, i) => {
            if (!enemy.alive || Math.hypot(enemy.x - member.x, (enemy.z || 0) - (member.z || 0)) > skillDef.radius) return;
            enemy.statusEffects = enemy.statusEffects.filter(ef => ef.type !== 'taunted');
            enemy.statusEffects.push({ type: 'taunted', endTime: now + skillDef.duration, sourceIndex: casterIdx, defDown: skillDef.defDown ?? 0 });
            enemy.lockedTargetIndex = -1;
            effects.push({ targetIndex: i, taunted: true });
        });
    } else if (skillDef.type === 'shield_bash') {
        const target = (member.targetIndex >= 0 && opponentData.squad[member.targetIndex]?.alive)
            ? opponentData.squad[member.targetIndex] : findBestTarget(member, opponentData.squad, now);
        if (target) {
            // lao sát mục tiêu
            const dir = Math.sign(target.x - member.x) || 1;
            member.x = target.x - dir * 1.6;
            member.z = target.z;
            clampToArena(member);
            const result = calculateDamage(member, target, skillDef.multiplier, now);
            if (!opponentData.debugGodMode) {
                target.hp = Math.max(0, target.hp - result.damage);
                if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
            }
            target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'stun');
            target.statusEffects.push({ type: 'stun', endTime: now + skillDef.stun });
            effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: result.damage, isCrit: result.isCrit, isBlock: result.isBlock, stunned: true });
        }
    } else if (skillDef.type === 'knockback') {
        // Quái trước mặt Rok: mục tiêu đang đánh, không có thì quái gần nhất
        let target = (member.targetIndex >= 0 && opponentData.squad[member.targetIndex]?.alive)
            ? opponentData.squad[member.targetIndex] : findBestTarget(member, opponentData.squad, now);
        if (target) {
            const ti = opponentData.squad.indexOf(target);
            const result = calculateDamage(member, target, skillDef.multiplier, now);
            if (!opponentData.debugGodMode) {
                target.hp = Math.max(0, target.hp - result.damage);
                if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
            }
            const dir = Math.sign(target.x - member.x) || (member.side === 'left' ? 1 : -1);
            const fromX = target.x;
            target.x += dir * skillDef.push;
            clampToArena(target);
            target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'knocked');
            target.statusEffects.push({ type: 'knocked', endTime: now + skillDef.knockTime });
            if (skillDef.stun) {
                // đáp đất xong bị choáng thêm `stun` ms
                target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'stun');
                target.statusEffects.push({ type: 'stun', endTime: now + skillDef.knockTime + skillDef.stun });
            }
            target.lastAttackTime = now; // đáp xuống rồi mới đánh tiếp
            effects.push({ targetIndex: ti, damage: result.damage, isCrit: result.isCrit, isBlock: result.isBlock, isMiss: result.isMiss,
                knockback: true, fromX, toX: target.x, toZ: target.z });
        }
    } else if (skillDef.type === 'guard') {
        endGuard(room.players[casterId].squad, casterIdx);
        member.statusEffects.push({ type: 'guard', endTime: now + skillDef.duration });
        effects.push({ targetIndex: casterIdx, ally: true });
        // Cả đội +20% P.DEF / M.DEF trong lúc khiên dựng
        room.players[casterId].squad.forEach((ally, i) => {
            if (!ally.alive) return;
            ally.statusEffects.push({ type: 'guard_aura', endTime: now + skillDef.duration, value: skillDef.teamDef ?? 0.2, sourceIndex: casterIdx });
            if (i !== casterIdx) effects.push({ targetIndex: i, ally: true, aura: true });
        });
    } else if (skillDef.type === 'fortress') {
        // Thành Trì: cả đội (còn sống) nhận hiệu ứng giảm sát thương
        room.players[casterId].squad.forEach((ally, i) => {
            if (!ally.alive) return;
            ally.statusEffects = ally.statusEffects.filter(ef => ef.type !== 'fortress');
            ally.statusEffects.push({ type: 'fortress', endTime: now + skillDef.duration, reduce: skillDef.reduce });
            effects.push({ targetIndex: i, ally: true });
        });
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
        // Nhảy lùi trước khi quăng (Phóng Bùa): lùi ra xa phía địch `backstep` đơn vị
        if (skillDef.backstep) {
            const foe = findLowestHpTarget(opponentData.squad, now) ?? opponentData.squad.find(m => m.alive);
            const away = foe ? Math.sign(member.x - foe.x) || (member.side === 'left' ? -1 : 1) : (member.side === 'left' ? -1 : 1);
            member.x += away * skillDef.backstep;
            clampToArena(member);
        }
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
        newX: member.x, newZ: member.z, effects, isBackstab: isSpecialBackstab, guardBroken
    });
}

/** Hạ khiên của Chiến Binh `casterIdx`: bỏ hiệu ứng guard + buff thủ nó phát cho cả đội */
function endGuard(squad, casterIdx) {
    const rok = squad[casterIdx];
    if (rok) rok.statusEffects = rok.statusEffects.filter(ef => ef.type !== 'guard');
    squad.forEach(ally => {
        ally.statusEffects = ally.statusEffects.filter(ef => !(ef.type === 'guard_aura' && ef.sourceIndex === casterIdx));
    });
}

function broadcastState(roomId) {
    if (!rooms[roomId]) return;
    const room = rooms[roomId];
    const now = room.clock ?? Date.now();
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
    io.to(roomId).emit('stateUpdate', { players: enrichedPlayers, clock: now, speed: room.speed ?? DEFAULT_SPEED, timeScale: timeScaleOf(room) });
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
