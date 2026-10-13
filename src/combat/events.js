// ============================================================
// SỰ KIỆN CHIẾN ĐẤU TỪ SERVER -> ANIMATION + VFX
// ============================================================
// File này chỉ nói "nhân vật làm hành động gì, trúng đòn lúc nào".
// Còn hành động đó trông ra sao là việc của CharacterView (CutoutCharacterView).
import * as THREE from 'three';
import { socket } from '../net/socket.js';
import { game, getView, opponentIdOf } from '../state.js';
import { cameraRig } from '../core/cameraRig.js';
import { buildBattleScene, rebuildSquad, syncState } from './battleScene.js';
import {
    spawnDamageNumber, spawnSlashVfx, spawnBackstabVfx,
    spawnProjectile, spawnAoeExplosion, spawnSealVfx, spawnLandingDust,
    spawnSmokeBurst, spawnDashLine, spawnTalismanHit, spawnHandFlash,
    spawnRisingGlyph, spawnRisingSparkles, spawnGhost, spawnHitSpark, setVfxClock,
    spawnLightning, spawnLightningBurst, spawnShockwave, spawnTauntMark, spawnImpact, spawnAtlasFx,
    spawnLionRoar, spawnShieldPush,
} from '../vfx/vfx.js';
import { SEAL_DURATION_MS, timeState, gameTimeout, gameNow } from '../config.js';

setVfxClock(gameNow); // đếm ngược Ấn theo đồng hồ trận

const UP = new THREE.Vector3(0, 1, 0);

function damageType({ dodged, isCrit, isBlock }, forceCrit = false) {
    if (dodged) return 'miss';
    if (isCrit || forceCrit) return 'crit';
    if (isBlock) return 'block';
    return 'normal';
}

// ------------------------------------------------------------
// Đánh thường
// ------------------------------------------------------------
function onAutoAttack(data) {
    const attackerView = getView(data.attackerId, data.attackerIndex);
    const attacker = game.roomData?.players?.[data.attackerId];
    if (!attackerView || !attacker) return;

    attackerView.startLunge(attackerView.facingLeft ? -1 : 1); // lao về phía đang nhìn (kể cả khi đứng sau lưng địch)

    const onHit = () => {
        const target = getView(data.targetId, data.targetIndex);
        if (!target) return;
        spawnDamageNumber(target.position, data.damage, damageType(data));
        if (!data.dodged && data.isBlock && data.damage === 0 && target.onGuardHit) {
            // đòn bị Dựng Khiên đỡ hoàn toàn
            target.onGuardHit();
            spawnHitSpark(target.position, { count: 6, color: 0xffe08a, size: 0.9 });
            return;
        }
        if (!data.dodged) {
            const dir = attackerView.facingLeft ? -1 : 1;
            // Sát Thủ ĐANG TÀNG HÌNH (Kỹ năng 3): chém sấm tím đen; bình thường: nhát chém thường
            const isAssassin = attacker.squad?.[data.attackerIndex]?.classId === 'assassin';
            if (isAssassin && attackerView.isStealthed) {
                if (data.isCrit) spawnBackstabVfx(target.position, { dir, style: 'voidCrit', size: 1.0 });
                else spawnSlashVfx(target.position, { dir, style: 'void' });
            } else if (attacker.squad?.[data.attackerIndex]?.classId === 'warrior') {
                // Rok: nhát BỔ DỌC bằng kiếm — vệt thép sáng gần thẳng đứng, to rõ
                if (data.isCrit) spawnBackstabVfx(target.position, { dir, style: 'crit', size: 1.1 });
                else spawnSlashVfx(target.position, { dir, style: 'blade', size: 1.15, angle: -1.15 });
                cameraRig.shake(0.08, 80);
            } else {
                const size = isAssassin ? 1 : 0.75; // quái: vệt nhỏ hơn cho đỡ rối
                if (data.isCrit) spawnBackstabVfx(target.position, { dir, style: 'crit', size: size + 0.05 });
                else spawnSlashVfx(target.position, { dir, size });
            }
            target.flashHit();
        }
    };

    // Đang diễn skill thì không ngắt — chỉ bắn hit ngay
    if (attackerView.isBusy) { onHit(); return; }

    const classId = attacker.squad[data.attackerIndex]?.classId;
    const hitFrame = game.classDefs?.[classId]?.autoHitFrame;
    attackerView.playAction('attack', { hitFrame, onHit });
}

// ------------------------------------------------------------
// Skill
// ------------------------------------------------------------
function onSkillExecuted(data) {
    if (!game.roomData?.players) return;
    const caster = getView(data.casterId, data.casterIdx);
    const opponentId = opponentIdOf(data.casterId);

    const classId = game.roomData.players[data.casterId]?.squad[data.casterIdx]?.classId;
    const skillDef = game.classDefs?.[classId]?.skills[data.skillIdx];
    const hitFrame = skillDef?.hitFrame;

    const processHit = (effect) => {
        const target = getView(opponentId, effect.targetIndex);
        if (!target) return;
        spawnDamageNumber(target.position, effect.damage, damageType(effect, data.isBackstab));
        const dir = caster?.facingLeft ? -1 : 1;
        if (data.type === 'projectile') {
            spawnTalismanHit(target.position);
            target.flashHit();
        } else if (data.type !== 'melee_strike') { // Đột Kích tự vẽ nhát chém của nó
            if (data.isBackstab || effect.isCrit) spawnBackstabVfx(target.position, { dir });
            else spawnSlashVfx(target.position, { dir });
            target.flashHit();
        }
        if (data.type === 'projectile') spawnSealVfx(target, SEAL_DURATION_MS); // bùa của Jessica gắn Ấn
    };

    // Không tìm thấy nhân vật ra chiêu (hiếm) -> vẫn hiện sát thương
    if (!caster && data.type !== 'stealth') { data.effects.forEach(processHit); return; }

    switch (data.type) {
        case 'taunt':
            warriorTaunt(caster, data, opponentId);
            break;
        case 'shield_bash':
            warriorBash(caster, data, opponentId, hitFrame);
            break;
        case 'knockback':
            warriorPush(caster, data, opponentId, hitFrame);
            break;
        case 'fortress':
            warriorFortress(caster, data);
            break;
        case 'guard':
            warriorGuard(caster);
            break;
        case 'melee_strike':
            meleeStrike(caster, data, hitFrame, processHit);
            break;
        case 'projectile':
            throwProjectiles(caster, data, opponentId, hitFrame, processHit);
            break;
        case 'stealth':
            // Kết ấn, nhắm mắt -> khói bùng quanh người -> lúc đó mới mờ dần (tàng hình)
            if (caster) {
                caster.opacityOverride = 1; // giữ rõ người trong lúc kết ấn (server đã bật tàng hình ngay)
                const done = () => { caster.opacityOverride = null; };
                caster.flashMagicCircle?.(0.55);
                spawnRisingSparkles(caster.position);
                const vanishFx = () => {
                    spawnSmokeBurst(caster.position, 16, 1.0);
                    spawnRisingGlyph(caster.position, '隠');
                    done();
                };
                const hasAnim = caster.playAction('stealth', { onHit: vanishFx, onComplete: done });
                if (!hasAnim) vanishFx();
            }
            break;
        case 'aoe_damage':
            data.effects.forEach(processHit);
            spawnAoeExplosion(caster.position.x, caster.position.z);
            break;
        default:
            if (data.dash) genericDash(caster, data, opponentId, processHit);
            else data.effects.forEach(processHit);
    }
}

/**
 * Đột Kích: khuỵu thấp -> phụt khói biến mất -> lướt chém lần lượt từng mục tiêu bị Ấn
 * (server đã xếp: máu NHIỀU trước, máu ÍT nhất sau cùng) -> dừng lại sau lưng mục tiêu cuối, quay lại chém.
 * Mỗi chặng lướt để lại dư ảnh + vệt sáng; mỗi mục tiêu trúng một nhát chém chéo.
 */
const CHAIN_STEP_MS = 150;   // thời gian trận giữa hai nhát
function meleeStrike(caster, data, hitFrame, processHit) {
    caster.teleport(caster.basePos.x, caster.basePos.z, true); // đứng yên, không trượt theo server
    const opponentId = opponentIdOf(data.casterId);
    const chest = (p) => ({ x: p.x, y: 0.75, z: p.z ?? 0 });
    const hits = data.effects
        .map(effect => ({ effect, view: getView(opponentId, effect.targetIndex) }))
        .filter(h => h.view);
    const ghostAt = (x, z, faceLeft, opacity = 0.55) => {
        const g = caster.makeGhost?.(x, z, { faceLeft, opacity });
        if (g) spawnGhost(g.object, g.life, g.opacity);
    };

    const dashChain = () => {
        spawnSmokeBurst(caster.position, 12, 0.6);
        // tư thế lướt chém (cho dư ảnh), rồi ẩn người thật
        caster.playAction('dashStrike');
        caster.opacityOverride = 0;
        caster.opacity = 0;

        let from = { x: caster.position.x, z: caster.position.z };
        hits.forEach((h, i) => {
            gameTimeout(() => {
                const tp = h.view.position;
                const faceLeft = tp.x < from.x;
                // chặng lướt: dừng TRƯỚC mục tiêu một chút để nhát chém nằm trên người nó
                const stopX = tp.x + (faceLeft ? 0.9 : -0.9);
                spawnLightning(chest(from), chest({ x: stopX, z: tp.z }), { width: 0.7, life: 0.28 });
                spawnDashLine(chest(from), chest({ x: stopX, z: tp.z }));
                for (let k = 1; k <= 3; k++) {
                    const f = k / 3;
                    gameTimeout(() => ghostAt(from.x + (stopX - from.x) * f, from.z + ((tp.z ?? 0) - from.z) * f, faceLeft, 0.25 + 0.15 * k), k * 18);
                }
                gameTimeout(() => {
                    spawnSlashVfx(tp, { dir: faceLeft ? -1 : 1, style: 'void', size: 1.15 });
                    h.view.flashHit();
                    processHit(h.effect);
                    cameraRig.shake(0.12, 90);
                }, 60);
                from = { x: stopX, z: tp.z ?? 0 };
            }, i * CHAIN_STEP_MS);
        });

        gameTimeout(() => {
            const last = hits[hits.length - 1]?.view;
            spawnLightning(chest(from), chest({ x: data.newX, z: data.newZ }), { width: 0.7, life: 0.28 });
            spawnDashLine(chest(from), chest({ x: data.newX, z: data.newZ }));
            caster.teleport(data.newX, data.newZ, false);
            caster.opacityOverride = null;
            caster.opacity = 1;
            spawnSmokeBurst({ x: data.newX, z: data.newZ }, 8, 0.5);
            // Hiện ra SAU LƯNG mục tiêu cuối (máu ít nhất) -> quay lại chém kết liễu
            if (last) caster.facingLeft = last.position.x < data.newX;
            caster.playAction('appear', {
                hitFrame,
                onHit: () => {
                    if (!last) return;
                    const dir = caster.facingLeft ? -1 : 1;
                    spawnLightningBurst(last.position, { count: 6, size: 1.4 });
                    if (data.isBackstab) { spawnBackstabVfx(last.position, { dir, style: 'voidCrit', size: 1.35 }); cameraRig.shake(0.35, 280); }
                    else { spawnSlashVfx(last.position, { dir, style: 'void', size: 1.3 }); cameraRig.shake(0.18, 150); }
                    last.flashHit();
                },
            });
        }, hits.length * CHAIN_STEP_MS + 60);
    };

    const hasAnim = caster.playAction('vanish', { onComplete: dashChain });
    if (!hasAnim) dashChain();
}

// ------------------------------------------------------------
// Chiến Binh (Rok)
// ------------------------------------------------------------
/** Sư Tử Gầm: giơ kiếm hét lớn -> linh hồn sư tử vàng gầm lao ra, quái bị khiêu khích hiện dấu "!" (và -10% thủ) */
function warriorTaunt(caster, data, opponentId) {
    caster.playAction('taunt', {
        onHit: () => {
            spawnLionRoar(caster.position, caster.facingLeft ? -1 : 1, { radius: 9 });
            cameraRig.shake(0.3, 420);
            data.effects.forEach(e => { const v = getView(opponentId, e.targetIndex); if (v) spawnTauntMark(v); });
        },
    });
}

/** Đập Khiên: lướt sát mục tiêu, đẩy khiên ra -> va chạm mạnh + choáng (sao xoay trên đầu do view tự vẽ) */
function warriorBash(caster, data, opponentId, hitFrame) {
    const dist = Math.abs((data.newX ?? caster.basePos.x) - caster.basePos.x);
    if (dist > 0.2 && caster.leapTo) caster.leapTo(data.newX, data.newZ ?? caster.basePos.z, { duration: 0.18, height: 0 });
    else caster.teleport(data.newX ?? caster.basePos.x, data.newZ ?? caster.basePos.z);
    caster.playAction('bash', {
        hitFrame,
        onHit: () => {
            data.effects.forEach(e => {
                const t = getView(opponentId, e.targetIndex);
                if (!t) return;
                spawnImpact(t.position);
                spawnDamageNumber(t.position, e.damage, damageType(e));
                t.flashHit();
            });
            cameraRig.shake(0.3, 220);
        },
    });
}

/**
 * Đẩy Khiên: Rok húc khiên về trước -> quái trước mặt bị hất văng ra sau (server đã dời nó đi `push` đơn vị),
 * bay vòng cung thấp, cày bụi khi đáp.
 */
function warriorPush(caster, data, opponentId, hitFrame) {
    // giữ quái tại chỗ tới lúc khiên chạm (server đã dời nó ra xa)
    data.effects.forEach(e => {
        const t = getView(opponentId, e.targetIndex);
        if (t && e.knockback) t.teleport(t.basePos.x, t.basePos.z, true);
    });
    caster.playAction('bash', {
        hitFrame,
        onHit: () => {
            data.effects.forEach(e => {
                const t = getView(opponentId, e.targetIndex);
                if (!t) return;
                spawnImpact(t.position);
                spawnDamageNumber(t.position, e.damage, damageType({ ...e, dodged: e.isMiss }));
                t.flashHit();
                if (e.knockback && t.leapTo) {
                    spawnDashLine({ x: t.position.x, y: 0.6, z: t.position.z }, { x: e.toX, y: 0.6, z: e.toZ ?? t.position.z });
                    t.leapTo(e.toX, e.toZ ?? t.basePos.z, { duration: 0.42, height: 0.8 });
                    gameTimeout(() => { spawnLandingDust(t.position, 10); cameraRig.shake(0.12, 120); }, 420);
                }
            });
            spawnShieldPush(caster.position, caster.facingLeft ? -1 : 1);
            cameraRig.shake(0.35, 240);
        },
    });
}

/** Dựng Khiên: giơ khiên lên rồi dựng thế thủ; khiên ánh sáng lớn do view tự vẽ suốt 5 giây */
function warriorGuard(caster) {
    caster.playAction('guardStart', {
        onHit: () => {
            spawnShockwave(caster.position, { color: 0xffd25a, radius: 3, life: 0.45 });
            spawnHitSpark(caster.position, { count: 10, color: 0xffe08a, size: 1.2 });
            cameraRig.shake(0.15, 160);
        },
    });
}

/** Thành Trì: cắm khiên xuống đất -> khiên phát sáng + sóng vàng, cả đội nhận vòng bảo hộ */
function warriorFortress(caster, data) {
    caster.playAction('fortress', {
        onHit: () => {
            const f = caster.facingLeft ? -1 : 1;
            const mesh = caster.createExtraMesh?.('planted');
            if (mesh) spawnAtlasFx(mesh, { x: caster.position.x + 0.9 * f, y: 0.25, z: caster.position.z }, { life: 1.3 });
            spawnShockwave(caster.position, { color: 0xffd25a, radius: 6, life: 0.7 });
            spawnLandingDust(caster.position, 10);
            cameraRig.shake(0.2, 200);
        },
    });
}

/** Phóng Bùa: quăng lá bùa tại hitFrame (mỗi lá cách nhau 250ms, bay 400ms); trúng thì gắn Ấn lên mục tiêu */
function throwProjectiles(caster, data, opponentId, hitFrame, processHit) {
    const shoot = () => {
        const f = caster.facingLeft ? -1 : 1;
        spawnHandFlash({ x: caster.position.x + 0.55 * f, y: 1.15 + (caster._lift ?? 0), z: caster.position.z });
        data.effects.forEach((effect, idx) => {
            const target = getView(opponentId, effect.targetIndex);
            if (!target) return;
            gameTimeout(() => {
                const from = caster.position.clone().add(UP);
                from.y += caster._lift ?? 0; // đang ở trên không
                spawnProjectile(from, target.position.clone().add(UP), '#facc15', 0.2, caster.createProjectileMesh?.()); // bay nhanh
                gameTimeout(() => processHit(effect), 200);
            }, idx * 120);
        });
    };
    // Server đã cho nhân vật lùi lại (newX): nhảy lùi rồi quăng giữa không trung; không lùi được thì quăng tại chỗ
    const leapDist = Math.abs((data.newX ?? caster.basePos.x) - caster.basePos.x);
    if (leapDist > 0.3 && caster.leapTo) {
        // lộn mèo 1 vòng ra sau thật nhanh (0.07–0.36s), quăng bùa lúc vừa bung người (0.42s), đáp đất ở 0.58s
        caster.leapTo(data.newX, data.newZ ?? caster.basePos.z, { duration: 0.62, height: 2.1, flip: 1, flipFrom: 0.12, flipTo: 0.6 });
        gameTimeout(() => spawnLandingDust(caster.position, 8), 620);
        caster.playAction('throw', { hitFrame, onHit: shoot });
    } else if (!caster.playAction('throwStand', { hitFrame, onHit: shoot })) {
        caster.teleport(data.newX ?? caster.basePos.x, data.newZ ?? caster.basePos.z);
        caster.playAction('throw', { hitFrame, onHit: shoot });
    }
}

/** Lướt chuỗi cho nhân vật không có animation riêng */
function genericDash(caster, data, opponentId, processHit) {
    if (data.effects.length <= 1) {
        caster.teleport(data.newX, data.newZ);
        data.effects.forEach(processHit);
        return;
    }
    data.effects.forEach((effect, i) => {
        gameTimeout(() => {
            const step = getView(opponentId, effect.targetIndex);
            if (step) {
                caster.teleport(step.position.x, step.position.z, true);
                processHit(effect);
            }
            if (i === data.effects.length - 1) {
                gameTimeout(() => caster.teleport(data.newX, data.newZ), 100);
            }
        }, i * 150);
    });
}

// ------------------------------------------------------------
// Đăng ký
// ------------------------------------------------------------
/**
 * @param {object} hooks callback cho UI: { onBattleStart, onState, onWaiting }
 */
export function registerCombatEvents(hooks = {}) {
    socket.on('connect', () => console.log('Connected with ID:', socket.id));
    socket.on('waiting', (data) => hooks.onWaiting?.(data));

    socket.on('battleStart', (data) => {
        buildBattleScene(data);
        hooks.onBattleStart?.(data);
    });

    socket.on('stateUpdate', (data) => {
        if (data.clock != null) {
            timeState.clock = data.clock;
            timeState.recvAt = performance.now();
            if (data.speed && data.speed !== timeState.speed) { timeState.speed = data.speed; hooks.onSpeed?.(data.speed); }
            timeState.scale = data.timeScale ?? timeState.scale;
        }
        game.roomData = { ...game.roomData, players: data.players };
        syncState(data.players);
        hooks.onState?.(data.players);
    });

    socket.on('autoAttack', onAutoAttack);
    socket.on('skillExecuted', onSkillExecuted);
    socket.on('speedChanged', (data) => {
        timeState.speed = data.speed;
        timeState.scale = data.speed / 1.5;
        hooks.onSpeed?.(data.speed);
    });
    socket.on('battleEnd', (data) => {
        game.views[data.winnerId]?.forEach(view => view.celebrate?.());
    });
    socket.on('squadResized', (data) => rebuildSquad(data.playerId, data.newSquad));
}
