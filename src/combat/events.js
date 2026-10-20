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
    spawnLightning, spawnLightningBurst, spawnShockwave, spawnImpact, spawnAtlasFx,
    spawnRoarHit,
    spawnArrow, spawnArcArrow, spawnMissileArrow, spawnWindHit, spawnLightOrb, spawnLightBurst, spawnHealLight, spawnAngel, spawnReviveLight, spawnPierceWind, spawnChargeWind, spawnBigArrowBlast,
} from '../vfx/vfx.js';
import { SEAL_DURATION_MS, timeState, gameTimeout, gameNow } from '../config.js';
import {
    spawnFireball, spawnFireExplosion, spawnFireHit, spawnIgnarHit, spawnSkyFireball, spawnMeteorImpact, spawnFireBolt, spawnFirePillar,
    spawnPillarHit, spawnSummonCircle, spawnFireWings, spawnPalmFlash,
    spawnBurnField, pulseBurn, spawnGroundSlam, spawnPillarCircle,
} from '../vfx/fireFx.js';
import {
    spawnReaperDashTrail, spawnReaperDashHit, spawnScytheSlash, spawnReapUp, spawnReapSlam, spawnCleave, spawnDeathMarkCast,
    spawnExecution, spawnShieldShatterZ, spawnHourglass, spawnSouls, spawnReaperSummon, spawnReaperWings, spawnPhantomScythe, spawnJudgement,
} from '../vfx/zerithFx.js';
import {
    spawnBrakkLeapDust, spawnBrakkSlam, spawnStompWave, spawnFallImpact, spawnPunchHit, spawnUppercut, spawnGiantTransform,
    spawnBrakkShieldPop, spawnBloodSurge, spawnBrakkHeal, spawnBattleCry, spawnCryIcon,
} from '../vfx/brakkFx.js';
import {
    ELEM_COLOR, spawnBookFlash, spawnStormStart, spawnElemBolt, spawnElemHit, spawnMeteor, spawnIceHit,
    spawnChainLightning, spawnZap, spawnTornado, spawnFireBoltBlast,
    spawnHasteBurst, spawnWardPop, spawnGolemSummon, spawnGolemCrumble, spawnFistDash, spawnBlizzardRoar, spawnSkyStrike,
    spawnIceBlockDrop, spawnGrowingOrb, spawnSolarBeam, spawnRainCloud, spawnCloudStrike, spawnRainHeal,
    spawnPalmEcho, spawnInhale, spawnBreath, spawnFistFlame,
} from '../vfx/elemFx.js';
import { onGemPicked } from './elemGems.js';
import { spawnLinkPulse } from '../vfx/linkFx.js';
import {
    spawnTalismanShot, spawnTalismanImpact, spawnThunderSlash, spawnThunderX, spawnStealthBurst, spawnShadowRing,
    spawnDashStreak, spawnSparkBurst, spawnDodgeIcon, spawnResetIcon,
} from '../vfx/jessicaFx.js';
import { spawnRokRoar, spawnTauntIcon, spawnRokBash, spawnRokQuake, spawnGoldRing, spawnBuffIcon, spawnHealCross } from '../vfx/rokFx.js';
import {
    spawnWaterBolt, spawnSplash, spawnDanceStart, spawnHealRain, spawnNote, spawnNoteMark,
    spawnCleanseChains, spawnOrbDrain, spawnWaterShieldPop, spawnOrbGift,
} from '../vfx/nerissaFx.js';

setVfxClock(gameNow); // đếm ngược Ấn theo đồng hồ trận

const UP = new THREE.Vector3(0, 1, 0);

function damageType({ dodged, isMiss, isCrit, isBlock, isMagic }, forceCrit = false) {
    if (dodged || isMiss) return 'miss';
    if (isCrit || forceCrit) return 'crit';
    if (isBlock) return 'block';
    return isMagic ? 'magic' : 'normal';   // sát thương phép: số xanh dương, vật lý: số đỏ
}

const chestOf = (v, dy = 1.0) => ({ x: v.position.x, y: v.position.y + dy, z: v.position.z });
/** Điểm bắn tên của Xạ Thủ: trước ngực, theo hướng mặt, cộng độ cao đang bay */
const bowPoint = (v) => ({ x: v.position.x + (v.facingLeft ? -0.6 : 0.6), y: 1.15 + (v._lift ?? 0) + (v._hover ?? 0), z: v.position.z });
/** Hiện số sát thương của 1 effect lên view (kể cả phần khiên hứng) */
function showHit(target, e, { fx = true, size = 1 } = {}) {
    if (!target) return;
    if (e.absorbed > 0) { target.onGuardHit?.(); spawnDamageNumber(target.position, e.absorbed, 'absorb'); if (!e.damage) return; }
    spawnDamageNumber(target.position, e.damage, damageType(e));
    if (e.isMiss) return;
    if (fx) spawnWindHit(target.position, { size });
    target.flashHit();
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
        if (!data.dodged && data.absorbed > 0) {
            // máu khiên (Dựng Khiên) hứng đòn: số vàng ◆, khiên loé sáng; xuyên qua khiên thì hiện thêm sát thương thật
            target.onGuardHit?.();
            spawnDamageNumber(target.position, data.absorbed, 'absorb');
            spawnHitSpark(target.position, { count: 6, color: 0xffe08a, size: 0.9 });
            if (data.damage === 0) return;
        }
        spawnDamageNumber(target.position, data.damage, damageType(data));
        if (!data.dodged) {
            const dir = attackerView.facingLeft ? -1 : 1;
            // Sát Thủ ĐANG TÀNG HÌNH (Kỹ năng 3): chém sấm tím đen; bình thường: nhát chém thường
            const isAssassin = attacker.squad?.[data.attackerIndex]?.classId === 'assassin';
            if (isAssassin && (attackerView.isStealthed || data.isCrit)) {
                // Jessica: tàng hình -> vệt chém sấm tím; chí mạng -> chém chữ X sấm (tranh jessicaFx)
                if (data.isCrit) spawnThunderX(target.position, { dir, size: 1.7 });
                else spawnThunderSlash(target.position, { dir, size: 1.5 });
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

    // Tu Sĩ: giơ gậy phóng cầu ánh sáng (sát thương phép), số hiện khi cầu chạm
    if (attacker.squad?.[data.attackerIndex]?.classId === 'priest') {
        const fire = () => {
            const target = getView(data.targetId, data.targetIndex);
            if (!target) return;
            spawnLightOrb(staffPoint(attackerView), chestOf(target, 0.95), { duration: 0.25, onHit: () => {
                showHit(target, { ...data, isMiss: data.dodged }, { fx: false });
                if (!data.dodged) spawnLightBurst(target.position, { size: 0.9 });
            } });
        };
        if (attackerView.isBusy) { fire(); return; }
        attackerView.playAction('attack', { onHit: fire });
        return;
    }

    // Phù Thủy lửa: ném quả cầu lửa từ lòng bàn tay, số hiện khi cầu chạm
    if (attacker.squad?.[data.attackerIndex]?.classId === 'mage') {
        const fire = () => {
            const target = getView(data.targetId, data.targetIndex);
            if (!target) return;
            spawnFireball(palmPoint(attackerView), chestOf(target, 0.95), { duration: 0.23, size: 0.75, onHit: () => {
                showHit(target, { ...data, isMiss: data.dodged }, { fx: false });
                if (!data.dodged) spawnIgnarHit(target.position);
            } });
        };
        if (attackerView.isBusy) { fire(); return; }
        attackerView.playAction('attack', { onHit: fire });
        return;
    }

    // Zerith: vung liềm bổ xuống — vệt liềm tím, sát thương phép
    if (attacker.squad?.[data.attackerIndex]?.classId === 'reaper') {
        const fire = () => {
            const target = getView(data.targetId, data.targetIndex);
            if (!target) return;
            showHit(target, { ...data, isMiss: data.dodged }, { fx: false });
            if (data.dodged) return;
            spawnScytheSlash(target.position, attackerView.facingLeft ? -1 : 1, { crit: data.isCrit });
            if (data.isCrit) cameraRig.shake(0.1, 90);
        };
        if (attackerView.isBusy) { fire(); return; }
        attackerView.playAction('attack', { onHit: fire });
        return;
    }

    // Brakk: cú đấm thẳng — tia lửa ở ngực mục tiêu (Khổng Lồ: to hơn, rung mạnh hơn)
    if (attacker.squad?.[data.attackerIndex]?.classId === 'wrestler') {
        const giant = !!attackerView._giantOn;
        const fire = () => {
            const target = getView(data.targetId, data.targetIndex);
            if (!target) return;
            showHit(target, { ...data, isMiss: data.dodged }, { fx: false });
            if (data.dodged) return;
            spawnPunchHit(target.position, attackerView.facingLeft ? -1 : 1, { crit: data.isCrit, giant });
            cameraRig.shake(giant ? 0.12 : 0.07, 80);
        };
        if (attackerView.isBusy) { fire(); return; }
        attackerView.playAction('attack', { onHit: fire });
        return;
    }

    // Elarion: phóng tia nguyên tố (màu theo viên ngọc giữ gần nhất) · Golem: đấm đá nặng
    const aClass = attacker.squad?.[data.attackerIndex]?.classId;
    if (aClass === 'elementalist' || aClass === 'elem_golem') {
        const held = attacker.squad[data.attackerIndex].held ?? [];
        const el = held[held.length - 1] ?? 'b';
        const fire = () => {
            const target = getView(data.targetId, data.targetIndex);
            if (!target) return;
            if (aClass === 'elem_golem') {
                showHit(target, { ...data, isMiss: data.dodged }, { fx: false });
                if (!data.dodged) { spawnPunchHit(target.position, attackerView.facingLeft ? -1 : 1, { crit: data.isCrit, giant: true }); cameraRig.shake(0.08, 80); }
                return;
            }
            spawnElemBolt(attackerView.parts?.handN ? handOf(attackerView) : chestOf(attackerView, 1.3), chestOf(target, 1.0), el, { onHit: () => {
                showHit(target, { ...data, isMiss: data.dodged }, { fx: false });
                if (!data.dodged) spawnElemHit(target.position, el);
            } });
        };
        if (attackerView.isBusy) { fire(); return; }
        attackerView.playAction('attack', { onHit: fire });
        return;
    }

    // Nerissa: vung dải lụa bắn giọt nước (sát thương phép), số hiện khi giọt nước chạm
    if (attacker.squad?.[data.attackerIndex]?.classId === 'dancer') {
        const fire = () => {
            const target = getView(data.targetId, data.targetIndex);
            if (!target) return;
            spawnWaterBolt(ribbonPoint(attackerView), chestOf(target, 1.0), { duration: 0.2, onHit: () => {
                showHit(target, { ...data, isMiss: data.dodged }, { fx: false });
                if (!data.dodged) spawnSplash(target.position, { size: data.isCrit ? 1.4 : 1.0 });
            } });
        };
        if (attackerView.isBusy) { fire(); return; }
        attackerView.playAction('attack', { onHit: fire });
        return;
    }

    // Xạ Thủ: nhả tên tại khoảnh khắc ra đòn, sát thương hiện khi mũi tên tới nơi
    if (attacker.squad?.[data.attackerIndex]?.classId === 'archer') {
        const fire = () => {
            const target = getView(data.targetId, data.targetIndex);
            if (!target) return;
            spawnArrow(bowPoint(attackerView), chestOf(target, 0.95), { duration: 0.2, size: 0.8, onHit: () => {
                showHit(target, { ...data, isMiss: data.dodged }, { size: 0.8 });
            } });
        };
        if (attackerView.isBusy) { fire(); return; }
        attackerView.playAction('attack', { onHit: fire });
        return;
    }

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
            spawnTalismanImpact(target.position);   // bùa trúng: loé -> vỡ -> hiện vòng Ấn (tranh jessicaFx)
            target.flashHit();
        } else if (data.type !== 'melee_strike') { // Đột Kích tự vẽ nhát chém của nó
            if (data.isBackstab || effect.isCrit) spawnBackstabVfx(target.position, { dir });
            else spawnSlashVfx(target.position, { dir });
            target.flashHit();
        }
        if (data.type === 'projectile') spawnSealVfx(target, SEAL_DURATION_MS); // bùa của Jessica gắn Ấn
    };

    // Đột Kích chém chết -> hồi chiêu chỉ còn 1s
    if (data.reset && caster) gameTimeout(() => spawnResetIcon(caster), 950);
    // Brakk: chiêu tốn máu -> số cam "♥ -x" trên đầu
    if (data.hpCost > 0 && caster) spawnDamageNumber(caster.position, data.hpCost, 'hpcost');
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
            warriorGuard(caster, data);
            break;
        case 'snipe':
            archerSnipe(caster, data, opponentId);
            break;
        case 'wind_spirit':
            caster.playAction('windCall', { onHit: () => {
                spawnChargeWind(caster.position, 0.5);
                spawnRisingSparkles(caster.position, { count: 18, color: 0x5eead4, radius: 1.2 });
                cameraRig.shake(0.12, 160);
            } });
            break;
        case 'charged_shot':
            archerRelease(caster, data, opponentId);
            break;
        case 'sky_fireball':
            // giơ tay gọi cầu lửa (0.35s) -> cầu lửa rơi, chạm đất đúng lúc server nổ (b.at); nổ + số do 'fireHits'
            caster.playAction('summon', { onHit: () => {
                (data.balls ?? []).forEach(b => spawnSkyFireball(b.x, b.z, {
                    duration: Math.max(0.2, (b.at - 350) / 1000), size: b.second ? 3.0 : 4.0, radius: b.radius ?? 5.5,
                    onLand: () => spawnBurnField(b.x, b.z, { radius: b.radius ?? 5.5, life: ((b.burn?.ticks ?? 3) * (b.burn?.gap ?? 600) + 350) / 1000 }),
                }));
            } });
            break;
        case 'fire_pillar':
            // chưởng xuống đất (0.25s) -> vòng phép hiện ở chỗ quái circleTime -> cột lửa bùng
            caster.playAction('bolt', { onHit: () => {
                const pl = data.pillar;
                if (!pl) return;
                spawnGroundSlam(caster.position, caster.facingLeft ? -1 : 1);
                cameraRig.shake(0.1, 120);
                const wait = (pl.circleTime ?? 1000) / 1000;
                spawnPillarCircle(pl.x, pl.z, { radius: pl.radius ?? 5, time: wait });
                gameTimeout(() => {
                    spawnFirePillar(pl.x, pl.z, { hits: pl.hits, gap: pl.gap / 1000, radius: pl.radius ?? 5 });
                    cameraRig.shake(0.16, 200);
                }, wait * 1000);
            } });
            break;
        case 'fire_god':
            caster.playAction('summon');
            spawnFireWings(caster.position, { dir: caster.facingLeft ? -1 : 1 });
            cameraRig.shake(0.2, 220);
            break;
        case 'heal':
        case 'holy_shield':
            priestSupport(caster, data);
            break;
        case 'reaper_dash':
            reaperDash(caster, data, opponentId);
            break;
        case 'reaper_scythe':
            reaperScythe(caster, data, opponentId);
            break;
        case 'reaper_night':
            // hóa Thần Chết: giơ tay gọi -> cánh tử thần bung, Hộ Vệ hiện ra (view tự vẽ theo trạng thái reaper_form)
            caster.playAction('summon', { onHit: () => {
                spawnReaperWings(caster.position, caster.facingLeft ? -1 : 1);
                spawnReaperSummon(caster.position, { life: 0.9, aura: false });
                cameraRig.shake(0.22, 240);
            } });
            break;
        case 'brakk_grab':
            brakkGrab(caster, data, opponentId);
            break;
        case 'brakk_stomp':
            brakkStomp(caster, data, opponentId);
            break;
        case 'brakk_giant':
            // hoá Khổng Lồ: ưỡn ngực gầm -> rồng lửa bốc lên, cả người phình to (view tự đổi da theo trạng thái giant_form)
            caster.playAction('roar', { onHit: () => {
                spawnGiantTransform(caster.position, caster.facingLeft ? -1 : 1);
                cameraRig.shake(0.3, 300);
            } });
            break;
        case 'elem_book':
            // Sách Nguyên Tố: đọc 3 viên -> vòng chữ vàng bay lên từ trang sách
            caster.playAction('book');
            spawnBookFlash(caster.position, data.recipe ?? [], caster.parts?.book ? bookOf(caster) : null);
            break;
        case 'elem_storm':
            caster.playAction('storm');
            spawnStormStart(caster.position);
            cameraRig.shake(0.12, 180);
            // Bão Nguyên Tố: +2 Orb ngay
            if (data.orbGain) gameTimeout(() => { spawnOrbGift(caster.position); spawnRisingGlyph(caster.position, `+${data.orbGain}◆`, '#e9d5ff', '#7c3aed'); }, 300);
            break;
        case 'elem_spell':
            elemSpell(caster, data, opponentId);
            break;
        case 'golem_fist':
        case 'golem_blizzard':
        case 'golem_aura':
            golemSkill(caster, data, opponentId);
            break;
        case 'dance_tide':
        case 'dance_flow':
        case 'dance_god': {
            // Nerissa vào điệu múa: xoay người -> vòng sóng lụa + ấn dưới chân (múa tiếp do trạng thái 'dancing')
            const dance = { dance_tide: 1, dance_flow: 2, dance_god: 3 }[data.type];
            const go = () => {
                spawnDanceStart(caster.position, dance, caster.facingLeft ? -1 : 1);
                if (dance === 3) cameraRig.shake(0.12, 180);
            };
            if (!caster.playAction('spin', { onHit: go })) go();
            break;
        }
        case 'pray':
            caster.playAction('raise', { onHit: () => {
                spawnHealLight(caster.position, { big: true });
                spawnShockwave(caster.position, { color: 0xfde68a, radius: 4, life: 0.6 });
                cameraRig.shake(0.12, 160);
            } });
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
                    spawnStealthBurst(caster.position, { size: 2.6 });   // khói sấm tím bùng (tranh jessicaFx)
                    done();
                    // Sấm phù trợ: đồng đội khác +né -> cánh sét bật trên đầu
                    const squad = game.roomData?.players?.[data.casterId]?.squad ?? [];
                    squad.forEach((m, i) => {
                        if (i === data.casterIdx || !m?.alive) return;
                        const v = getView(data.casterId, i);
                        if (v) spawnDodgeIcon(v, { delay: 0.05 + i * 0.05 });
                    });
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
    const hits = data.effects
        .map(effect => ({ effect, view: getView(opponentId, effect.targetIndex) }))
        .filter(h => h.view);
    const ghostAt = (x, z, faceLeft, opacity = 0.55) => {
        const g = caster.makeGhost?.(x, z, { faceLeft, opacity });
        if (g) spawnGhost(g.object, g.life, g.opacity);
    };

    const dashChain = () => {
        spawnStealthBurst(caster.position, { size: 2.0 });   // biến mất trong khói sấm
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
                spawnDashStreak(from, { x: stopX, z: tp.z });   // vệt lướt sấm (tranh jessicaFx)
                for (let k = 1; k <= 3; k++) {
                    const f = k / 3;
                    gameTimeout(() => ghostAt(from.x + (stopX - from.x) * f, from.z + ((tp.z ?? 0) - from.z) * f, faceLeft, 0.25 + 0.15 * k), k * 18);
                }
                gameTimeout(() => {
                    spawnThunderSlash(tp, { dir: faceLeft ? -1 : 1, size: 1.6 });
                    h.view.flashHit();
                    processHit(h.effect);
                    cameraRig.shake(0.12, 90);
                }, 60);
                from = { x: stopX, z: tp.z ?? 0 };
            }, i * CHAIN_STEP_MS);
        });

        gameTimeout(() => {
            const last = hits[hits.length - 1]?.view;
            spawnDashStreak(from, { x: data.newX, z: data.newZ });
            caster.teleport(data.newX, data.newZ, false);
            caster.opacityOverride = null;
            caster.opacity = 1;
            spawnShadowRing({ x: data.newX, z: data.newZ }, { radius: 1.2, life: 0.6 });   // hiện ra từ bóng tối
            // Hiện ra SAU LƯNG mục tiêu cuối (máu ít nhất) -> quay lại chém kết liễu
            if (last) caster.facingLeft = last.position.x < data.newX;
            caster.playAction('appear', {
                hitFrame,
                onHit: () => {
                    if (!last) return;
                    const dir = caster.facingLeft ? -1 : 1;
                    spawnSparkBurst(last.position, { size: 1.5 });
                    if (data.isBackstab) { spawnThunderX(last.position, { dir, size: 2.1 }); cameraRig.shake(0.35, 280); }
                    else { spawnThunderSlash(last.position, { dir, size: 1.8 }); cameraRig.shake(0.18, 150); }
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
/** Sư Tử Gầm: giơ kiếm hét lớn -> linh hồn sư tử vàng lao ra gầm (tranh rokFx), quái bị khiêu khích hiện dấu sư tử "!" (và -10% thủ) */
function warriorTaunt(caster, data, opponentId) {
    caster.playAction('taunt', {
        onHit: () => {
            spawnRokRoar(caster, { radius: 9 });
            cameraRig.shake(0.45, 520);   // sư tử khổng lồ: rung mạnh hơn
            data.effects.forEach(e => {
                const v = getView(opponentId, e.targetIndex);
                if (!v) return;
                spawnTauntIcon(v);
                // sóng gầm lan tới quái nào thì quái đó trúng đòn (xa trúng sau)
                gameTimeout(() => {
                    spawnDamageNumber(v.position, e.damage, damageType({ ...e, dodged: e.isMiss }));
                    if (e.isMiss) return;
                    spawnRoarHit(v.position);
                    v.flashHit();
                }, 60 + (e.dist ?? 3) * 45);
            });
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
            spawnRokBash(caster);
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
            spawnRokBash(caster);
            cameraRig.shake(0.35, 240);
        },
    });
}

// ------------------------------------------------------------
// Xạ Thủ (Lyra)
// ------------------------------------------------------------
/** Tiễn Gió Chớp: bật nhảy lộn trên không -> mũi tên gió chớp lao cực nhanh -> chí mạng + đẩy lùi; hạ gục -> hồi chiêu */
function archerSnipe(caster, data, opponentId) {
    // bật nhảy LÙI ra sau (không lộn), bắn giữa không trung; khói bung lúc bật lên và lúc đáp
    const startX = caster.basePos.x, startZ = caster.basePos.z;
    const toX = data.newX ?? startX, toZ = data.newZ ?? startZ;
    const WIND_SMOKE = { hue: 0.47, sat: 0.35, light: 0.72, height: 0.9 };   // khói gió trắng ngọc, sát đất
    spawnSmokeBurst({ x: startX, z: startZ }, 16, 0.9, WIND_SMOKE);
    spawnLandingDust({ x: startX, y: 0, z: startZ }, 10);
    if (Math.abs(toX - startX) > 0.2) {
        spawnHitSpark({ x: startX, y: 0, z: startZ }, { count: 8, color: 0xb6fff0, size: 1.0 });   // gió bật dưới chân
        gameTimeout(() => spawnSmokeBurst({ x: (startX + toX) / 2, z: (startZ + toZ) / 2 }, 6, 0.5, WIND_SMOKE), 160);
    }
    caster.leapTo(toX, toZ, { duration: 0.62, height: 1.7 });
    gameTimeout(() => { spawnLandingDust(caster.position, 12); spawnSmokeBurst(caster.position, 10, 0.7, WIND_SMOKE); }, 620);
    caster.playAction('snipe', { onHit: () => {
        data.effects.forEach(e => {
            const t = getView(opponentId, e.targetIndex);
            if (!t) return;
            // giữ quái tại chỗ tới khi tên chạm (server đã đẩy nó ra sau)
            t.teleport(t.basePos.x, t.basePos.z, true);
            spawnArrow(bowPoint(caster), chestOf(t, 0.95), { duration: 0.12, size: 1.5, onHit: () => {
                showHit(t, e, { size: 1.5 });
                spawnImpact(t.position, { size: 1.1, color: 0xb6fff0 });
                cameraRig.shake(0.2, 160);
                if (e.knockback && t.leapTo) t.leapTo(e.toX, e.toZ ?? t.basePos.z, { duration: 0.28, height: 0.4 });
                else t.teleport(e.toX ?? t.basePos.x, e.toZ ?? t.basePos.z);
                if (e.reset) spawnRisingGlyph(caster.position, '↺', '#ccfbf1', '#0f766e');   // hạ gục -> hồi chiêu
            } });
        });
    } });
}

/**
 * Thần Tiễn Phá Thiên: (đã gồng 2 giây) nhả dây -> loạt tên hiện ra SAU LƯNG xếp thành vòng cung (Vệ Thần cũng có vòng riêng)
 * -> lần lượt phóng đi như TÊN LỬA, bẻ lái đuổi theo ngẫu nhiên các quái (server chọn; mỗi quái ít nhất 1 mũi).
 * Nhịp khớp server: nhả 0.16s, xếp hàng 0.3s, mỗi mũi cách 70ms, lao tới trong 0.3s.
 */
const MISSILE_FORM = 0.3, MISSILE_GAP_MS = 70, MISSILE_FLIGHT = 0.3;
function archerRelease(caster, data, opponentId) {
    caster.playAction('release', { onHit: () => {
        const dir = caster.facingLeft ? -1 : 1;
        const shots = data.effects.filter(e => e.role === 'lyra' || e.role === 'spirit').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const lyraShots = shots.filter(e => e.role === 'lyra'), spiritShots = shots.filter(e => e.role === 'spirit');
        const back = { x: caster.position.x - dir * 0.5, y: 1.0 + (caster._hover ?? 0), z: caster.position.z };
        const sp = caster.windSpiritPos?.() ?? { x: back.x, y: back.y + 1.6, z: back.z };
        cameraRig.shake(0.2, 160);
        spawnHitSpark(caster.position, { count: 12, color: 0xb6fff0, size: 1.3 });
        // vòng cung sau lưng: từ chếch trên-trước (~70°) vòng qua đỉnh xuống sau lưng (~200°), quay theo hướng nhìn
        const arcSlots = (list, center, radius) => list.map((e, i) => {
            const f = list.length > 1 ? i / (list.length - 1) : 0.5;
            const deg = 70 + f * 130;
            const r = deg * Math.PI / 180;
            const ang = dir > 0 ? r : Math.PI - r;    // lật theo hướng nhìn
            return { e, ang, pos: { x: center.x + Math.cos(ang) * radius, y: center.y + Math.sin(ang) * radius, z: center.z } };
        });
        const slots = [...arcSlots(lyraShots, back, 1.7), ...arcSlots(spiritShots, sp, 1.1)];
        slots.forEach(({ e, ang, pos }) => {
            const t = getView(opponentId, e.targetIndex);
            if (!t) return;
            const spirit = e.role === 'spirit';
            const k = e.order ?? 0;
            const yOff = 0.6 + Math.random() * 0.5;
            // xuất hiện lần lượt trong lúc xếp hàng, rồi phóng theo thứ tự
            const appear = (k / Math.max(1, shots.length)) * MISSILE_FORM * 0.8;
            gameTimeout(() => {
                spawnMissileArrow(pos, ang, () => chestOf(t, yOff), {
                    hold: MISSILE_FORM - appear + (k * MISSILE_GAP_MS) / 1000, flight: MISSILE_FLIGHT,
                    size: spirit ? 1.1 : 1.35, color: spirit ? 0xa5f3fc : 0x5eead4, z: pos.z,
                    onHit: () => {
                        showHit(t, e, { size: spirit ? 0.9 : 1.15 });
                        spawnImpact(t.position, { size: 0.7, color: spirit ? 0xa5f3fc : 0xb6fff0 });
                        if (k === shots.length - 1) { spawnBigArrowBlast(t.position, { radius: 2 }); cameraRig.shake(0.35, 260); }
                        else cameraRig.shake(0.07, 60);
                    },
                });
            }, appear * 1000);
        });
    } });
}

/** Lòng bàn tay Phù Thủy lửa (chỗ quả cầu lửa) */
function palmPoint(v) {
    if (v.palmFire) { const p = new THREE.Vector3(); v.palmFire.group.getWorldPosition(p); return { x: p.x, y: p.y, z: p.z }; }
    return { x: v.position.x + (v.facingLeft ? -0.8 : 0.8), y: 1.5 + (v._lift ?? 0), z: v.position.z };
}

/** Bàn tay cầm lụa của Nerissa (chỗ giọt nước bắn ra) */
function ribbonPoint(v) {
    const w = v.pointWorld?.('ribbon');
    if (w) return { x: w.x, y: w.y, z: w.z + 0.2 };
    const h = v.parts?.handN;
    if (h) { const p = new THREE.Vector3(); h.getWorldPosition(p); return { x: p.x + (v.facingLeft ? -0.35 : 0.35), y: p.y, z: p.z + 0.2 }; }
    return { x: v.position.x + (v.facingLeft ? -0.7 : 0.7), y: 1.4 + (v._lift ?? 0), z: v.position.z };
}

// ------------------------------------------------------------
// Tam Nguyên (Elarion) + Golem Nguyên Tố
// ------------------------------------------------------------
/** Hiện số / hiệu ứng trúng đòn cho danh sách effect (e.delay = ms trận tới lúc chạm) */
function elemHits(effects, targetId, { fx = null, lift = 0 } = {}) {
    (effects ?? []).forEach(e => gameTimeout(() => {
        const t = getView(targetId, e.targetIndex);
        if (!t) return;
        showHit(t, e, { fx: false });
        if (e.isMiss) return;
        fx?.(t, e);
        if (lift && t.leapTo && t.member?.alive !== false) t.leapTo(t.basePos.x, t.basePos.z, { duration: lift, height: 2.4 });
    }, e.delay ?? 0));
}
/** Điểm thế giới của 1 khớp trên hình (VD bàn tay / Sách của Elarion); không có thì ước lượng trước ngực */
function jointPoint(v, joint, { dx = 0, dy = 0 } = {}) {
    const w = v.pointWorld?.(joint);   // nhân vật sprite: điểm gắn đánh dấu trên khung đang hiện
    if (w) return { x: w.x + (v.facingLeft ? -dx : dx), y: w.y + dy, z: w.z };
    const j = v.parts?.[joint];
    if (j) { const p = new THREE.Vector3(); j.getWorldPosition(p); return { x: p.x + (v.facingLeft ? -dx : dx), y: p.y + dy, z: p.z + 0.2 }; }
    return { x: v.position.x + (v.facingLeft ? -0.6 : 0.6), y: 1.4 + (v._lift ?? 0), z: v.position.z };
}
/** Lòng bàn tay gần (Elarion chưởng / Golem nắm đấm) */
const handOf = (v) => jointPoint(v, 'handN', { dy: -0.1 });
/** Miệng Golem (phun bão tuyết) */
const mouthOf = (v) => (v.parts?.mouth ? jointPoint(v, 'mouth') : { x: v.position.x + (v.facingLeft ? -1.2 : 1.2), y: 3.2, z: v.position.z });
/** Golem: nắm đấm băng phía trước (lao đấm / giật sét) · lõi ngực (sét trời giáng xuống) */
const frontFistOf = (v) => (v.parts?.handF ? jointPoint(v, 'handF') : handOf(v));
const coreOf = (v) => (v.parts?.core ? jointPoint(v, 'core') : chestOf(v, 1.6));
const breaths = new Map();   // view Golem -> luồng bão tuyết đang phun (tắt khi Golem gục / tan)
/** Giữa Sách Nguyên Tố (phép bốc lên từ trang sách) */
const bookOf = (v) => jointPoint(v, 'book', { dy: 0.1 });
const rainClouds = new Map();   // view Elarion -> mây mưa giông đang hiện
const solarBeams = new Map();   // view Elarion -> SolarBeam đang chưởng (Băng Hoại Hỏa Thiên)
/** Giữa 2 lòng bàn tay (chưởng SolarBeam), nhích ra trước 1 chút */
function palmsOf(v) {
    const a = jointPoint(v, 'handN'), b = v.parts?.handF ? jointPoint(v, 'handF') : a;
    return { x: (a.x + b.x) / 2 + (v.facingLeft ? -0.28 : 0.28), y: (a.y + b.y) / 2 - 0.05, z: Math.max(a.z, b.z) };
}
/** Tắt SolarBeam đang hiện của Elarion (hết giờ / bị ngắt / gục) + thả tư thế giữ tia */
function endSolarBeam(caster, h = null) {
    const cur = solarBeams.get(caster);
    if (!cur || (h && cur !== h)) return;
    cur.stop();
    solarBeams.delete(caster);
    caster.releaseHold?.('beam');
    caster.releaseHold?.('beamCharge');
}
function elemSpell(caster, data, opponentId) {
    const dir = caster.facingLeft ? -1 : 1;
    if (data.spell !== 'beams') caster.playAction('spell');
    switch (data.spell) {
        case 'meteor':
            if (data.meteor) spawnMeteor(data.meteor);
            gameTimeout(() => cameraRig.shake(0.28, 260), data.meteor?.fall ?? 800);
            break;
        case 'frost':
            // khối băng thành hình trên đầu đội địch -> rơi -> vỡ ra các khối nhỏ
            if (data.frost) {
                spawnIceBlockDrop(data.frost);
                gameTimeout(() => cameraRig.shake(0.25, 240), (data.frost.start ?? 0) + (data.frost.form ?? 1500) + (data.frost.fall ?? 300));
            }
            break;
        case 'chain': {
            const pts = [handOf(caster), ...(data.chain ?? []).map(i => getView(opponentId, i)).filter(Boolean).map(v => chestOf(v, 1.0))];
            gameTimeout(() => spawnChainLightning(pts, 0.12), 300);
            elemHits(data.effects, opponentId, { fx: (t) => spawnElemHit(t.position, 'b') });
            break;
        }
        case 'ward':
            // khiên cho Elarion + đồng đội yếu máu nhất
            (data.shields ?? []).forEach(sh => {
                const v = getView(data.casterId, sh.targetIndex);
                if (!v) return;
                spawnWardPop(v.position, v.height ?? 2.4);
                spawnDamageNumber(v.position, sh.shield, 'shield');
            });
            break;
        case 'tornado':
            if (data.tornado) gameTimeout(() => spawnTornado(data.tornado), 300);
            elemHits(data.effects, opponentId);
            break;
        case 'steam': {
            // mây mưa giông che trận (tắt sớm khi bị ngắt — 'rainEnd')
            if (!data.rain) break;
            rainClouds.get(caster)?.stop();
            const c = spawnRainCloud(data.rain);
            rainClouds.set(caster, c);
            gameTimeout(() => { if (rainClouds.get(caster) === c) rainClouds.delete(caster); }, data.rain.duration ?? 7000);
            break;
        }
        case 'firebolt':
            if (data.firebolt) {
                spawnGrowingOrb(data.firebolt);
                gameTimeout(() => cameraRig.shake(0.2, 220), (data.firebolt.start ?? 0) + (data.firebolt.grow ?? 2000));
            }
            break;
        case 'beams': {
            // khum 2 tay về hông dồn lực -> HA! đẩy 2 lòng bàn tay giữ tia SolarBeam băng-hỏa tới cuối bản đồ (tắt khi 'beamEnd')
            const b = data.beam;
            if (!b) break;
            caster.facingLeft = b.ux < 0;
            const alive = () => !!game.roomData?.players?.[data.casterId]?.squad?.[data.casterIdx]?.alive && caster.root.visible;
            endSolarBeam(caster);
            const h = spawnSolarBeam({ getOrigin: () => palmsOf(caster), ux: b.ux, uz: b.uz, len: b.len, charge: (b.charge ?? 700) / 1000,
                duration: (b.duration ?? 7000) / 1000, alive });
            solarBeams.set(caster, h);
            caster.playAction('beamCharge', { onComplete: () => { if (solarBeams.get(caster) === h && alive()) caster.playAction('beam', { hold: true }); } });
            gameTimeout(() => { if (solarBeams.get(caster) === h) cameraRig.shake(0.32, 280); }, b.charge ?? 700);
            gameTimeout(() => endSolarBeam(caster, h), (b.charge ?? 700) + (b.duration ?? 7000) + 500);   // dự phòng nếu lỡ mất 'beamEnd'
            break;
        }
        case 'haste':
            spawnHasteBurst(caster.position);
            break;
    }
}
function golemSkill(caster, data, opponentId) {
    const dir = caster.facingLeft ? -1 : 1;
    if (data.type === 'golem_fist' && data.fist) {
        // lùi về phía đồng minh -> gồng 1s (lửa bốc tay) -> lướt đấm (hiệu ứng lướt do 'fistDash')
        const f = data.fist;
        if (caster.leapTo) caster.leapTo(f.backX, f.backZ, { duration: f.backTime / 1000, height: 0.6 });
        gameTimeout(() => {
            caster.playAction?.('charge', { hold: true });
            spawnFistFlame(() => (caster.member?.alive === false ? null : handOf(caster)), (f.channel ?? 1000) / 1000);
            spawnRisingSparkles(caster.position, { count: 12, color: 0xff7a1a, radius: 1.4 });
        }, f.backTime);
    } else if (data.type === 'golem_blizzard') {
        // chúi tới há miệng phun bão tuyết suốt thời gian phun, xong thì đứng thẳng lại
        const dur = (data.blizzard?.ticks ?? 6) * (data.blizzard?.gap ?? 1000);
        const alive = () => !!game.roomData?.players?.[data.casterId]?.squad?.[data.casterIdx]?.alive && caster.root.visible;
        caster.playAction('breath', { hold: true });
        gameTimeout(() => { if (alive()) caster.playAction?.('breathEnd'); }, dur);
        breaths.get(caster)?.stop();
        breaths.set(caster, spawnBreath(mouthOf(caster), dir, dur / 1000, { getMouth: () => mouthOf(caster), alive }));
        spawnBlizzardRoar(caster.position, dir);
    } else if (data.type === 'golem_aura') {
        // giơ nắm đấm lên trời -> sét đánh trúng tay (nắm đấm hoá sét suốt Hào Quang Sét)
        caster.playAction('aura', { onHit: () => { spawnSkyStrike(coreOf(caster)); cameraRig.shake(0.22, 220); } });
    }
}
function onElemFx(d) {
    const caster = getView(d.casterId, d.casterIdx);
    switch (d.kind) {
        case 'pick':
            onGemPicked(d);
            break;
        case 'meteorHit':
            elemHits(d.effects, d.targetId, { fx: (t) => spawnFireHit(t.position, { size: 1.4 }) });
            break;
        case 'rollHit':
        case 'trailHit':
            elemHits(d.effects, d.targetId, { fx: (t) => spawnFireHit(t.position) });
            break;
        case 'meteorCrash':
            // Lốc Xoáy đẩy đối thủ va vào thiên thạch đang lăn
            spawnFireBoltBlast(d.x, d.z, 2);
            cameraRig.shake(0.18, 180);
            elemHits(d.effects, d.targetId, { fx: (t) => spawnFireHit(t.position, { size: 1.5 }) });
            break;
        case 'frostHit':
        case 'shardHit':
            elemHits(d.effects, d.targetId, { fx: (t) => spawnIceHit(t.position) });
            break;
        case 'beamTick': {
            // SolarBeam mỗi giây: đòn băng (Hàn Khí, giảm tốc đánh) + đòn lửa (tăng dần; đủ 5 tầng tia lửa to hẳn)
            const h = caster && solarBeams.get(caster);
            h?.setStacks(d.stacks ?? 0, !!d.big);
            h?.pulse();
            cameraRig.shake(d.big ? 0.15 : 0.08, 140);
            elemHits(d.ice, d.targetId, { fx: (t, e) => (e.frozen ? spawnIceHit(t.position) : spawnHitSpark(t.position, { count: 5, color: ELEM_COLOR.i, size: 0.8 })) });
            elemHits(d.fire, d.targetId, { fx: (t) => spawnFireHit(t.position, { size: d.big ? 1.35 : 1 }) });
            break;
        }
        case 'beamEnd':
            if (caster) endSolarBeam(caster);
            break;
        case 'gemGift': {
            // đồng đội dùng 5 / đối thủ dùng 10 kỹ năng -> 1 luồng nguyên tố bay từ người vừa dùng kỹ năng về Elarion (+1 ngọc lên khay)
            const src = getView(d.sourceId, d.sourceIdx);
            if (caster && src) spawnElemBolt(chestOf(src, 1.2), chestOf(caster, 2.1), d.el, { duration: 0.4 });
            break;
        }
        case 'rainTick':
            (d.heals ?? []).forEach(h => {
                const v = getView(d.casterId, h.targetIndex);
                if (!v) return;
                if (h.heal > 0) spawnDamageNumber(v.position, h.heal, 'heal');
                spawnRainHeal(v.position, !h.heal);
            });
            if (d.strike) {
                const t = getView(d.targetId, d.strike.targetIndex);
                if (t) { spawnCloudStrike(t.position, caster && rainClouds.get(caster)); elemHits([d.strike], d.targetId); }
            }
            break;
        case 'rainEnd':
            if (caster) { rainClouds.get(caster)?.stop(); rainClouds.delete(caster); }
            break;
        case 'teamOrb':
            // Hỏa Lôi Cầu nổ: cả đội +1 Orb, riêng Elarion +2
            (d.gains ?? []).forEach(g => {
                const v = getView(d.casterId, g.i);
                if (!v) return;
                spawnOrbGift(v.position);
                spawnRisingGlyph(v.position, `+${g.orbs}◆`, '#e9d5ff', '#7c3aed');
            });
            break;
        case 'fireboltHit':
            spawnFireBoltBlast(d.x, d.z, d.radius);
            elemHits(d.effects, d.targetId, { fx: (t, e) => { if (e.orbLost) spawnRisingGlyph(t.position, '−◆', '#c4b5fd', '#6d28d9'); } });
            break;
        case 'echoHit': {
            // Tốc Lôi: chưởng thứ 2
            const t = getView(d.targetId, d.targetIndex);
            if (caster && t) gameTimeout(() => spawnPalmEcho(handOf(caster), chestOf(t, 1.0), { onHit: () => { showHit(t, d.effect, { fx: false }); if (!d.effect.isMiss) spawnElemHit(t.position, 'b'); } }), d.effect?.delay ?? 160);
            break;
        }
        case 'teamHaste':
            (d.allies ?? []).forEach(i => { const v = getView(d.casterId, i); if (v) spawnHasteBurst(v.position); });
            break;
        case 'push': {
            // Lốc Xoáy: hất văng ra sau (server đã dời vị trí)
            const t = getView(d.targetId, d.targetIndex);
            if (t?.leapTo) t.leapTo(d.toX, d.toZ, { duration: (d.time ?? 450) / 1000, height: 1.2 });
            break;
        }
        case 'shock': {
            // Giáp Băng Sét: sét giật kẻ vừa đánh
            const t = getView(d.targetId, d.targetIndex);
            if (caster && t) spawnZap(chestOf(caster, 1.2), chestOf(t, 1.0));
            if (t && d.effect) showHit(t, d.effect, { fx: false });
            break;
        }
        case 'golemSummon':
            spawnGolemSummon(d.x, d.z);
            cameraRig.shake(0.22, 240);
            break;
        case 'golemEnd': {
            const g = getView(d.casterId, d.golemIdx);
            if (g) { spawnGolemCrumble(g.position); breaths.get(g)?.stop(); breaths.delete(g); }
            break;
        }
        case 'fistDash':
            if (caster?.leapTo) caster.leapTo(d.toX, d.toZ, { duration: d.time / 1000, height: 0 });
            caster?.playAction?.('dash');
            spawnFistDash({ fromX: d.fromX, fromZ: d.fromZ, toX: d.toX, toZ: d.toZ, time: d.time, getFist: caster?.parts?.handF ? () => frontFistOf(caster) : null });
            elemHits(d.effects, d.targetId, { lift: 0.95, fx: (t) => spawnFireHit(t.position, { size: 1.3 }) });
            break;
        case 'golemShock':
            // tay có sét: mỗi đòn giật toàn bộ đối thủ
            (d.effects ?? []).forEach(e => { const t = getView(d.targetId, e.targetIndex); if (caster && t) gameTimeout(() => spawnZap(frontFistOf(caster), chestOf(t, 1.0)), 200); });
            elemHits((d.effects ?? []).map(e => ({ ...e, delay: e.delay ?? 250 })), d.targetId);
            break;
        case 'blizzardTick':
            elemHits(d.effects, d.targetId, { fx: (t, e) => (e.frozen ? spawnIceHit(t.position) : spawnHitSpark(t.position, { count: 4, color: ELEM_COLOR.i, size: 0.6 })) });
            break;
    }
}

/** Thủy Vũ (Nerissa): hồi máu Lưu Thủy · nốt nhạc · giáp nước · hút Orb · tặng Orb · Triều Dâng · dừng múa */
function onWaterFx(d) {
    const caster = getView(d.casterId, d.casterIdx);
    const team = (id, fn) => (game.roomData?.players?.[id]?.squad ?? []).forEach((m, i) => { const v = getView(id, i); if (v && m.alive) fn(v, i); });
    switch (d.kind) {
        case 'flowHeal':
            // Lưu Thủy: mưa nước hồi máu trên từng đồng đội
            d.heals.forEach(h => {
                const v = getView(d.casterId, h.targetIndex);
                if (!v) return;
                if (h.heal > 0) spawnDamageNumber(v.position, h.heal, 'heal');
                spawnHealRain(v.position);
            });
            break;
        case 'notes': {
            // Cả 3 điệu: nốt nhạc bay tới từng đối thủ (sát thương + giảm thủ phép) và từng đồng đội (tăng sát thương phép, giải khống chế)
            if (!caster) break;
            const from = { x: caster.position.x, y: 0, z: caster.position.z };
            d.effects.forEach((e, k) => {
                const t = getView(d.targetId, e.targetIndex);
                if (!t) return;
                spawnNote(from, () => t.position, { kind: k, onHit: () => {
                    showHit(t, e, { fx: false });
                    if (!e.isMiss) spawnNoteMark(t.position, false);
                } });
            });
            (d.allies ?? []).forEach(a => {
                const t = getView(d.casterId, a.targetIndex);
                if (!t || t === caster) { if (t && a.cleansed) spawnCleanseChains(t.position); return; }
                spawnNote(from, () => t.position, { ally: true, onHit: () => {
                    spawnNoteMark(t.position, true);
                    if (a.cleansed) spawnCleanseChains(t.position);
                } });
            });
            break;
        }
        case 'shield': {
            const v = getView(d.casterId, d.targetIndex);
            if (v) { spawnWaterShieldPop(v.position, { height: v.height ?? 2.9 }); spawnDamageNumber(v.position, d.shield, 'shield'); }
            break;
        }
        case 'drain': {
            // Hòa Âm 2+3: Orb bị hút khỏi đối thủ
            const t = getView(d.targetId, d.targetIndex);
            if (t) spawnOrbDrain(t.position);
            break;
        }
        case 'gift':
        case 'surge':
            // Hòa Âm 1+2+3 / Triều Dâng: cả đội +Orb
            team(d.casterId, v => { spawnOrbGift(v.position); if (d.orbs > 1) spawnRisingGlyph(v.position, `+${d.orbs}◆`, '#bae6fd', '#0284c7'); });
            if (caster && !(d.orbs > 1)) spawnRisingGlyph(caster.position, '◆', '#bae6fd', '#0284c7');
            break;
        case 'danceEnd':
            // dừng 1 điệu: nước bắn nhẹ (bị ngắt: bắn mạnh hơn)
            if (caster) spawnSplash(caster.position, { size: d.reason === 'stun' || d.reason === 'dead' ? 1.6 : 1.0, ground: true });
            break;
    }
}

/** Nổ lửa diện rộng (Thiên Hỏa Cầu chạm đất / mỗi nhịp Cột Lửa): hình nổ + số sát thương */
function onFireHits(d) {
    const opponentId = opponentIdOf(d.casterId);
    if (d.kind === 'meteor' || d.kind === 'meteor2') {
        spawnMeteorImpact(d.x, d.z, { size: d.kind === 'meteor' ? 4.4 : 3.3, radius: d.radius });
        cameraRig.shake(d.kind === 'meteor' ? 0.24 : 0.15, 200);
    }
    if (d.kind === 'burn') pulseBurn(d.x, d.z, { radius: d.radius });
    const now = gameNow();
    d.effects.forEach(e => {
        const t = getView(opponentId, e.targetIndex);
        if (!t) return;
        showHit(t, e, { fx: false });
        if (d.kind === 'pillar' && !e.isMiss) {
            const icon = now - (t._breakIconAt ?? -1e9) > 900;   // biểu tượng phá giáp: không chồng liên tục
            if (icon) t._breakIconAt = now;
            spawnPillarHit(t.position, { stackBreak: icon });
        } else if (!e.isMiss) spawnIgnarHit(t.position, { size: d.kind === 'burn' ? 0.7 : 1.2 });
    });
}

/** Hỏa Thần Giáng Lâm: Hỏa Chưởng / chưởng toàn thể / Hộ Vệ ném cầu lửa */
function onFireGod(d) {
    const caster = getView(d.casterId, d.casterIdx);
    if (!caster) return;
    const opponentId = opponentIdOf(d.casterId);
    const dir = caster.facingLeft ? -1 : 1;
    const viewOf = (e) => getView(opponentId, e.targetIndex);
    if (d.kind === 'palm') {
        caster.playAction('palm', { onHit: () => {
            const from = palmPoint(caster);
            spawnPalmFlash(from, dir);
            const t = getView(opponentId, d.targetIndex);
            if (!t) return;
            spawnFireball(from, chestOf(t, 0.95), { duration: 0.26, size: 1.1, swirl: true, onHit: () => {
                spawnFireExplosion(t.position, { size: 1.9, life: 0.45 });
                d.effects.forEach(e => { const v = viewOf(e); if (v) showHit(v, e, { fx: false }); });
            } });
        } });
    } else if (d.kind === 'volley') {
        caster.playAction('volley', { onHit: () => {
            const from = palmPoint(caster);
            spawnPalmFlash(from, dir, { size: 1.6 });
            cameraRig.shake(0.12, 120);
            d.effects.forEach((e, k) => {
                const t = viewOf(e);
                if (!t) return;
                gameTimeout(() => spawnFireball(palmPoint(caster), chestOf(t, 1.0), { duration: 0.28, size: 1.0, swirl: true, onHit: () => {
                    showHit(t, e, { fx: false });
                    if (!e.isMiss) spawnIgnarHit(t.position, { size: 1.3 });
                } }), k * 50);
            });
        } });
    } else if (d.kind === 'guardian') {
        const g = caster.fireGuardian;
        g?.throwPose();
        gameTimeout(() => {
            const t = getView(opponentId, d.targetIndex);
            if (!t) return;
            const from = g ? g.handPoint() : palmPoint(caster);
            spawnFireball(from, chestOf(t, 1.0), { duration: 0.3, size: 0.9, onHit: () => {
                const e = d.effects[0];
                showHit(t, e, { fx: false });
                if (!e.isMiss) spawnIgnarHit(t.position);
            } });
        }, 220);
    }
}

// ------------------------------------------------------------
// Sát Thủ U Minh (Zerith)
// ------------------------------------------------------------
/**
 * Lưỡi Hái Xuyên Hồn: lướt xuyên qua mục tiêu theo từng chặng server gửi (data.path), để lại vệt tím + dư ảnh;
 * mỗi quái trên đường trúng đúng lúc Zerith lướt qua (e.delay).
 */
function reaperDash(caster, data, opponentId) {
    const path = data.path ?? [];
    if (!path.length) { caster.teleport(data.newX, data.newZ); return; }
    caster.teleport(caster.basePos.x, caster.basePos.z, true);   // giữ chỗ, lướt theo chặng
    caster.playAction('dash', { hold: true });
    path.forEach((seg) => {
        gameTimeout(() => {
            const left = seg.toX < seg.fromX;
            caster.facingLeft = left;
            spawnSmokeBurst({ x: seg.fromX, z: seg.fromZ }, 8, 0.55);
            spawnReaperDashTrail({ x: seg.fromX, z: seg.fromZ }, { x: seg.toX, z: seg.toZ });
            caster.leapTo(seg.toX, seg.toZ, { duration: seg.time / 1000, height: 0.15 });
            for (let k = 1; k <= 3; k++) {
                const f = k / 4;
                gameTimeout(() => {
                    const g = caster.makeGhost?.(seg.fromX + (seg.toX - seg.fromX) * f, seg.fromZ + (seg.toZ - seg.fromZ) * f, { faceLeft: left, opacity: 0.25 + 0.12 * k });
                    if (g) spawnGhost(g.object, g.life, g.opacity);
                }, (seg.time * f));
            }
        }, seg.at);
    });
    data.effects.forEach(e => {
        gameTimeout(() => {
            const t = getView(opponentId, e.targetIndex);
            if (!t) return;
            const seg = path[e.seg ?? 0];
            showHit(t, e, { fx: false });
            if (!e.isMiss) { spawnReaperDashHit(t.position, seg && seg.toX < seg.fromX ? -1 : 1); cameraRig.shake(0.1, 80); }
        }, e.delay ?? 0);
    });
    const last = path[path.length - 1];
    if (data.echo) gameTimeout(() => spawnRisingGlyph(caster.position, '↺', '#e9d5ff', '#6d28d9'), last.at + last.time);   // lướt lần 2 miễn phí
    gameTimeout(() => {
        spawnSmokeBurst({ x: last.toX, z: last.toZ }, 6, 0.45);
        caster._interruptOneShot?.();
        // quay lại nhìn về phía quái
        const foes = (game.views?.[opponentId] ?? []).filter(v => v?.member?.alive);
        if (foes.length) {
            const near = foes.reduce((a, b) => (Math.abs(b.position.x - last.toX) < Math.abs(a.position.x - last.toX) ? b : a));
            caster.facingLeft = near.position.x < last.toX;
        }
    }, last.at + last.time + 60);
}

/**
 * Lưỡi Hái Hất Hồn: LƯỠI HÁI KHỔNG LỒ (đã hiện dần trong lúc niệm — castStart) quét từ dưới lên, quái bay lên rồi rơi xuống.
 * Đêm Tử Thần: không niệm — lưỡi hái hiện ngay, quét lên rồi BỔ XUỐNG thêm 1 nhát. Nhịp khớp server: data.impact / data.slamAt (ms).
 */
function reaperScythe(caster, data, opponentId) {
    const dir = data.dir ?? (caster.facingLeft ? -1 : 1);
    caster.facingLeft = dir < 0;
    const impact = data.impact ?? 150;
    let ph = caster._phantom;
    caster._phantom = null;
    if (!ph) ph = spawnPhantomScythe(() => caster.position, dir, { formTime: Math.max(0.1, (impact - 120) / 1000) });
    if (data.form) ph.expectSlam();
    const front = () => ({ x: caster.position.x + dir * 1.6, z: caster.position.z });
    const size = 3.2 * Math.max(1, (data.radius ?? 3.5) / 3.5);   // Đêm Tử Thần: phạm vi rộng hơn -> vệt chém to hơn
    gameTimeout(() => ph.swing(), Math.max(0, impact - 110));
    gameTimeout(() => caster.playAction('reap', { onHit: () => {
        spawnReapUp(front(), dir, { size });
        if (data.form) spawnShockwave(caster.position, { color: 0xa855f7, radius: data.radius ?? 6, life: 0.5 });
        cameraRig.shake(0.25, 220);
        data.effects.filter(e => !e.slam).forEach(e => {
            const t = getView(opponentId, e.targetIndex);
            if (!t) return;
            showHit(t, e, { fx: false });
            if (e.isMiss) return;
            spawnReaperDashHit(t.position, dir);
            if (e.knockup && t.leapTo && t.member?.alive !== false) t.leapTo(t.basePos.x, t.basePos.z, { duration: 0.95, height: 2.4 });
        });
    } }), Math.max(0, impact - 150));
    if (!data.form) return;
    // bổ xuống: clip 'slam' chạm ở 0.2s, lưỡi hái lớn bổ cùng lúc
    const slamAt = data.slamAt ?? impact + 550;
    gameTimeout(() => ph.slam(), slamAt - 110);
    gameTimeout(() => caster.playAction('slam', { onHit: () => {
        spawnReapSlam(front(), dir, { size });
        cameraRig.shake(0.38, 280);
        data.effects.filter(e => e.slam).forEach(e => {
            const t = getView(opponentId, e.targetIndex);
            if (t) { showHit(t, e, { fx: false }); if (!e.isMiss) spawnHitSpark(t.position, { count: 8, color: 0xfb7185, size: 1.2 }); }
        });
    } }), slamAt - 200);
}

// ------------------------------------------------------------
// Cuồng Đấu (Brakk)
// ------------------------------------------------------------
/**
 * Bá Vương Quật: vồ túm mục tiêu (0.12s) -> nhảy vọt tới điểm quật (0.24–0.8s), mục tiêu bị nhấc qua đầu
 * -> quật cắm xuống đất đúng lúc server tính sát thương (data.impact) -> hố nứt + chấn động lan.
 */
function brakkGrab(caster, data, opponentId) {
    const dir = data.dir ?? (caster.facingLeft ? -1 : 1);
    caster.facingLeft = dir < 0;
    const impact = data.impact ?? 850;
    const leap = data.leap;
    const sc = caster._giantSc ?? 1;
    caster.teleport(caster.basePos.x, caster.basePos.z, true);   // giữ chỗ, nhảy theo nhịp động tác
    caster._bigJumpUntil = gameNow() + impact + 300;               // camera nâng lên theo cú nhảy
    caster.playAction('grab');
    // nhảy VỌT CAO (lên chậm, rơi xuống nhanh dần) -> cú quật có lực
    if (leap) gameTimeout(() => {
        spawnBrakkLeapDust({ x: leap.fromX, z: leap.fromZ }, dir);
        caster.leapTo(leap.toX, leap.toZ, { duration: Math.max(0.2, (impact - 260) / 1000), height: 5.2 * sc, apex: 0.66 });
    }, 260);
    // mục tiêu bị túm: đi theo Brakk, nằm trên đầu Brakk, rồi bị quật cắm xuống trước mặt
    const main = data.effects.find(e => e.grab);
    const tv = main && getView(opponentId, main.targetIndex);
    if (tv?.leapTo && tv.member?.alive !== false) {
        const start = 120, dur = (impact - start) / 1000;
        gameTimeout(() => {
            const from = { x: tv.basePos.x, z: tv.basePos.z };
            const up = (k) => k * k * (3 - 2 * k);
            tv.leapTo(main.toX, main.toZ, { duration: dur, flip: -1, flipFrom: 0.55, flipTo: 1.0, path: (p) => {
                const cx = caster.root.position.x + dir * 0.15, cz = caster.root.position.z;
                const lift0 = (caster._lift ?? 0) + 2.3 * (caster._giantSc ?? 1);
                if (p < 0.22) { const k = up(p / 0.22); return { x: from.x + (cx - from.x) * k, z: from.z + (cz - from.z) * k, lift: lift0 * k }; }
                if (p < 0.82) return { x: cx, z: cz, lift: lift0 };
                const k = up((p - 0.82) / 0.18);
                return { x: cx + (main.toX - cx) * k, z: cz + (main.toZ - cz) * k, lift: lift0 * (1 - k) };
            } });
        }, start);
    }
    gameTimeout(() => {
        const at = data.slam ?? { x: caster.position.x + dir * 1.3, z: caster.position.z };
        spawnBrakkSlam(at, { size: data.giant ? 1.35 : 1, dir, radius: data.radius ?? 3, giant: data.giant });
        cameraRig.shake(data.giant ? 0.5 : 0.38, 320);
        data.effects.forEach(e => {
            const t = getView(opponentId, e.targetIndex);
            if (!t) return;
            showHit(t, e, { fx: false });
            if (!e.isMiss) spawnHitSpark(t.position, { count: e.grab ? 10 : 6, color: 0xffb347, size: e.grab ? 1.3 : 1 });
        });
    }, impact);
}

/** Chấn Địa (đã niệm): nhảy lên dậm xuống — vòng lửa + gai đá, quái bay lên rồi rơi (Khổng Lồ: rơi xuống ăn thêm sát thương) */
function brakkStomp(caster, data, opponentId) {
    const impact = data.impact ?? 600;
    caster.teleport(caster.basePos.x, caster.basePos.z, true);
    caster._bigJumpUntil = gameNow() + impact + 300;
    caster.playAction('stomp');
    // khuỵu lấy đà (0.1s) -> bật CAO tại chỗ -> rơi nhanh dần, chạm đất đúng lúc server tính sát thương
    gameTimeout(() => {
        spawnBrakkLeapDust(caster.position, caster.facingLeft ? -1 : 1);
        caster.leapTo(caster.basePos.x, caster.basePos.z, { duration: Math.max(0.2, (impact - 100) / 1000), height: 4.8 * (caster._giantSc ?? 1), apex: 0.64 });
    }, 100);
    gameTimeout(() => {
        spawnStompWave(caster.position, { radius: data.radius ?? 4, giant: data.giant });
        cameraRig.shake(data.giant ? 0.45 : 0.35, 300);
        if (data.shield > 0) {
            spawnBrakkShieldPop(caster.position, { height: 3.2 * (caster._giantSc ?? 1) });
            spawnDamageNumber(caster.position, data.shield, 'shield');
        }
        data.effects.filter(e => !e.fall).forEach(e => {
            const t = getView(opponentId, e.targetIndex);
            if (!t) return;
            showHit(t, e, { fx: false });
            if (e.isMiss) return;
            spawnHitSpark(t.position, { count: 6, color: 0xffb347 });
            if (e.knockup && t.leapTo && t.member?.alive !== false) t.leapTo(t.basePos.x, t.basePos.z, { duration: (data.knockup ?? 1000) / 1000, height: 2.4 });
        });
    }, impact);
    // Khổng Lồ: quái rơi xuống đất chịu thêm sát thương
    data.effects.filter(e => e.fall).forEach(e => gameTimeout(() => {
        const t = getView(opponentId, e.targetIndex);
        if (!t) return;
        showHit(t, e, { fx: false });
        spawnFallImpact(t.position);
    }, impact + (data.knockup ?? 1000)));
}

/** Sự kiện riêng của Rok: dây liên kết, Ý Chí Thép, địa chấn của Đẩy Khiên */
function onRokFx(d) {
    const v = getView(d.casterId, d.casterIdx);
    switch (d.kind) {
        case 'link':
        case 'linkBreak': {
            const o = d.linkIdx != null ? getView(d.casterId, d.linkIdx) : null;
            [v, o].filter(Boolean).forEach(x => spawnHitSpark(x.position, { count: d.kind === 'link' ? 8 : 12, color: 0xffd36b, size: 1.1 }));
            if (d.kind === 'linkBreak' && v && o) {
                const mid = { x: (v.position.x + o.position.x) / 2, z: (v.position.z + o.position.z) / 2 };
                spawnHitSpark({ x: mid.x, y: 0.2, z: mid.z }, { count: 14, color: 0xffe08a, size: 1.4 });
                spawnRisingGlyph({ x: mid.x, y: 0, z: mid.z }, '✕', '#fde68a', '#92400e');
            }
            break;
        }
        case 'share': {
            // Kiên Cường: Rok gánh đòn thay người được nối dây — số vàng trên Rok + đốm sáng chạy dọc dây về Rok
            if (!v) break;
            if (d.damage > 0) spawnDamageNumber(v.position, d.damage, 'share');
            if (d.absorbed > 0) spawnDamageNumber(v.position, d.absorbed, 'absorb');
            const o = d.linkIdx != null ? getView(d.casterId, d.linkIdx) : null;
            if (o) spawnLinkPulse(o, v);
            break;
        }
        case 'ironWill':
            if (v) { spawnRisingGlyph(v.position, '鋼', '#fde68a', '#b45309'); spawnRisingSparkles(v.position, { count: 12, color: 0xfcd34d, radius: 0.9 }); }
            break;
        case 'ironHeal':
            if (v && d.heal > 0) { spawnDamageNumber(v.position, d.heal, 'heal'); spawnHealLight(v.position); spawnHealCross(v); }
            break;
        case 'quake': {
            // đối thủ bị hất văng rơi xuống: địa chấn nhẹ, choáng xung quanh
            const at = { x: d.x, z: d.z };
            spawnRokQuake(at, { radius: d.radius ?? 3 });
            spawnLandingDust(at, 14);
            cameraRig.shake(0.18, 200);
            break;
        }
    }
}

/** Giáp Lửa (thiên phú 2 Ignar): bật -> hất văng đối thủ quanh mình; hết -> nổ choáng xung quanh */
function onFireWard(d) {
    const v = getView(d.casterId, d.casterIdx);
    if (!v) return;
    if (d.kind === 'on') {
        spawnFireWings(v.position, { dir: v.facingLeft ? -1 : 1 });
        spawnShockwave(v.position, { color: 0xff7a1a, radius: 4, life: 0.5 });
        spawnDamageNumber(v.position, d.shield, 'shield');
        cameraRig.shake(0.2, 220);
        (d.pushed ?? []).forEach(e => {
            const t = getView(d.targetId, e.targetIndex);
            if (t?.leapTo) t.leapTo(e.toX, e.toZ, { duration: (d.knockTime ?? 350) / 1000, height: 1.0 });
            if (t) spawnIgnarHit(t.position);
        });
    } else {
        spawnFireExplosion(v.position, { size: 3.2 });
        spawnShockwave(v.position, { color: 0xff4d1a, radius: d.radius ?? 4.5, life: 0.6 });
        cameraRig.shake(0.3, 260);
    }
}

/** Sự kiện riêng của Brakk: móc ngược (Khổng Lồ), Long Huyết, Khí Thế Đấu Trường, hết Khổng Lồ */
function onBrakkFx(d) {
    const caster = getView(d.casterId, d.casterIdx);
    switch (d.kind) {
        case 'uplift': {
            if (!caster) break;
            const dir = caster.facingLeft ? -1 : 1;
            const fire = () => (d.effects ?? []).forEach(e => {
                const t = getView(d.targetId, e.targetIndex);
                if (!t) return;
                showHit(t, e, { fx: false });
                if (e.isMiss) return;
                spawnUppercut(t.position, dir);
                cameraRig.shake(0.25, 220);
                if (e.knockup && t.leapTo && t.member?.alive !== false) t.leapTo(e.toX, e.toZ, { duration: (d.upTime ?? 800) / 1000, height: 2.8 });
            });
            if (caster.isBusy) { fire(); break; }
            caster.playAction('uplift', { onHit: fire });
            break;
        }
        case 'shout': {
            // Tiếng Hét Bảo Hộ: đồng đội nguy hiểm -> Brakk gầm lên, dấu "!" hiện trên đầu mọi đối thủ bị khiêu khích
            if (!caster) break;
            const foes = (d.targetIndices ?? []).map(i => getView(d.targetId, i)).filter(Boolean);
            if (foes.length) {
                const near = foes.reduce((a, b) => (Math.abs(b.position.x - caster.position.x) < Math.abs(a.position.x - caster.position.x) ? b : a));
                caster.facingLeft = near.position.x < caster.position.x;
            }
            const cry = () => {
                spawnBattleCry(caster.position, caster.facingLeft ? -1 : 1, { height: caster.height * (caster._giantSc ?? 1) });
                cameraRig.shake(0.2, 260);
                foes.forEach((v, k) => gameTimeout(() => spawnCryIcon(v, { life: (d.duration ?? 3000) / 1000, y: v.height + 0.35 }), 200 + k * 70));
            };
            if (!caster.playAction('roar', { onHit: cry })) cry();
            break;
        }
        case 'blood':
            if (caster) { spawnBloodSurge(caster.position); cameraRig.shake(0.15, 200); spawnRisingGlyph(caster.position, '龍', '#fed7aa', '#c2410c'); }
            (d.heals ?? []).forEach((h, k) => gameTimeout(() => {
                const v = getView(d.casterId, h.targetIndex);
                if (!v) return;
                spawnBrakkHeal(v.position, { orb: true });
                if (h.heal > 0) spawnDamageNumber(v.position, h.heal, 'heal');
            }, 150 + k * 80));
            break;
        case 'lone':
            // Độc Long: đồng đội gục hết -> Brakk gầm lên, máu rồng bốc cháy, sát thương ×2
            if (!caster) break;
            caster.playAction('roar', { onHit: () => {
                spawnBloodSurge(caster.position);
                spawnRisingGlyph(caster.position, '×2', '#fecaca', '#b91c1c');
                cameraRig.shake(0.22, 260);
            } });
            break;
        case 'giantRefresh':
            // Độc Long khi đang Khổng Lồ: làm mới thời gian Thần Lực Khổng Lồ
            if (!caster) break;
            spawnGiantTransform(caster.position, caster.facingLeft ? -1 : 1);
            spawnRisingGlyph(caster.position, '⟳', '#fde68a', '#b45309');
            cameraRig.shake(0.2, 220);
            break;
        case 'rallyShield':
            if (caster) { spawnBrakkShieldPop(caster.position, { height: 3.2 * (caster._giantSc ?? 1) }); spawnDamageNumber(caster.position, d.shield, 'shield'); }
            break;
        case 'rallyHeal':
            if (caster) { spawnBrakkHeal(caster.position); if (d.heal > 0) spawnDamageNumber(caster.position, d.heal, 'heal'); }
            break;
        case 'giantEnd':
            if (caster) spawnSmokeBurst(caster.position, 10, 0.9, { hue: 0.05, sat: 0.5, light: 0.3 });
            break;
    }
}

/** Sự kiện riêng của Zerith: Ấn Tử, kết liễu, phá khiên, bất tử, chém lan, Hộ Vệ chém, linh hồn báo thù */
function onReaperFx(d) {
    const caster = d.casterId != null ? getView(d.casterId, d.casterIdx) : null;
    const target = d.targetId != null ? getView(d.targetId, d.targetIndex) : null;
    const dir = caster ? (caster.facingLeft ? -1 : 1) : 1;
    const hits = (list, delay, fx) => gameTimeout(() => (list ?? []).forEach(e => {
        const t = getView(d.targetId, e.targetIndex);
        if (!t) return;
        showHit(t, e, { fx: false });
        if (!e.isMiss) fx?.(t);
    }), delay);
    switch (d.kind) {
        case 'judgeStart': {
            // Ấn Tử chạm ngưỡng tử: Thần Chết hiện sau lưng, nhấc mục tiêu lên không trung từ từ -> (judgeSlash) chém -> rơi xuống
            if (!target) break;
            const lift = (d.lift ?? 1100) / 1000, fall = (d.fall ?? 500) / 1000;
            const gx = caster ? (caster.position.x < target.position.x ? 1 : -1) : (target.facingLeft ? 1 : -1);   // Thần Chết đứng phía phe Zerith
            const at = { x: target.basePos.x, z: target.basePos.z };
            spawnJudgement(at, gx, { lift, fall, height: 3.8 });
            spawnRisingGlyph(target.position, '☠', '#fecdd3', '#7e22ce');
            const H = 3.0;
            target.teleport(at.x, at.z, true);
            target.leapTo(at.x, at.z, { duration: lift + fall, path: (p) => {
                const t = p * (lift + fall);
                if (t < lift) { const q = t / lift; return { x: at.x, z: at.z, lift: H * q * q * (3 - 2 * q) + 0.08 * Math.sin(t * 18) }; }
                const q = (t - lift) / fall;
                return { x: at.x, z: at.z, lift: H * (1 - q * q) };
            } });
            target._judgedUntil = gameNow() + (d.lift + d.fall);
            break;
        }
        case 'judgeSlash':
            if (target) {
                const ex = target.facingLeft ? 1 : -1;
                const at = { x: target.position.x, y: target._lift ?? 0, z: target.position.z };
                spawnExecution({ x: at.x, y: at.y, z: at.z }, ex);
                cameraRig.shake(0.4, 300);
                if (d.shielded) gameTimeout(() => { spawnShieldShatterZ(at); spawnRisingGlyph(target.position, '◇', '#e9d5ff', '#6d28d9'); }, 170);
                else if (d.killed) gameTimeout(() => { spawnDamageNumber(target.position, d.damage ?? 0, 'crit'); spawnRisingGlyph(target.position, '☠', '#fecdd3', '#9f1239'); target.flashHit(); }, 180);
            }
            break;
        case 'mark': {
            // Phán Quyết Tử Thần: chỉ tay -> Ấn Tử bay lên đầu TẤT CẢ đối thủ
            const views = (d.targetIndices ?? [d.targetIndex]).map(i => getView(d.targetId, i)).filter(Boolean);
            if (!caster || !views.length) break;
            const near = views.reduce((a, b) => (Math.abs(b.position.x - caster.position.x) < Math.abs(a.position.x - caster.position.x) ? b : a));
            caster.facingLeft = near.position.x < caster.position.x;
            caster.playAction('mark', { onHit: () => views.forEach((v, k) => gameTimeout(() => spawnDeathMarkCast(v), k * 60)) });
            break;
        }
        case 'execute':
            if (target) {
                const ex = caster ? (target.position.x < caster.position.x ? -1 : 1) : 1;
                spawnExecution(target.position, ex);
                gameTimeout(() => {
                    spawnDamageNumber(target.position, d.damage ?? 0, 'crit');
                    spawnRisingGlyph(target.position, '☠', '#fecdd3', '#9f1239');
                    target.flashHit();
                }, 180);
                cameraRig.shake(0.45, 320);
            }
            break;
        case 'shatter':
            if (target) spawnShieldShatterZ(target.position);
            break;
        case 'undying':
            if (caster) spawnHourglass(caster.position, { y: 3.4 + (caster._hover ?? 0) });
            break;
        case 'cleave':
            if (target) gameTimeout(() => spawnCleave(target.position, dir), 200);
            hits(d.effects, 220, (t) => spawnReaperDashHit(t.position, dir, { size: 0.9 }));
            break;
        case 'guardian': {
            const g = caster?.reaperGuardian;
            g?.slash(d.pose === 2 ? 1 : 0);
            gameTimeout(() => { if (target) spawnScytheSlash(target.position, dir, { size: 1.9 }); }, 360);
            hits(d.effects, 380);
            break;
        }
        case 'guardianReap': {
            // Hộ Vệ tự dùng Lưỡi Hái Hất Hồn: giương liềm -> quét hất tung quái quanh mục tiêu -> chém bổ xuống
            const g = caster?.reaperGuardian;
            g?.reap();
            const at = { x: d.x, z: d.z };
            const gd = caster ? (d.x < caster.position.x ? -1 : 1) : 1;
            const size = 3.2 * (d.radius ?? 4.5) / 3.5;
            gameTimeout(() => {
                spawnReapUp(at, gd, { size });
                cameraRig.shake(0.22, 200);
                d.effects.filter(e => !e.slam).forEach(e => {
                    const t = getView(d.targetId, e.targetIndex);
                    if (!t) return;
                    showHit(t, e, { fx: false });
                    if (e.isMiss) return;
                    spawnReaperDashHit(t.position, gd);
                    if (e.knockup && t.leapTo && t.member?.alive !== false) t.leapTo(t.basePos.x, t.basePos.z, { duration: 0.95, height: 2.4 });
                });
            }, d.impact ?? 420);
            gameTimeout(() => {
                spawnReapSlam(at, gd, { size });
                cameraRig.shake(0.35, 260);
                d.effects.filter(e => e.slam).forEach(e => {
                    const t = getView(d.targetId, e.targetIndex);
                    if (t) { showHit(t, e, { fx: false }); if (!e.isMiss) spawnHitSpark(t.position, { count: 8, color: 0xfb7185, size: 1.2 }); }
                });
            }, d.slamAt ?? 980);
            break;
        }
        case 'ghost': {
            const g = caster?.reaperGhost;
            g?.slash(Math.random() < 0.5 ? 1 : 0);
            gameTimeout(() => { if (target) { spawnScytheSlash(target.position, d.x < target.position.x ? 1 : -1, { size: 1.8 }); cameraRig.shake(0.08, 80); } }, 360);
            hits(d.effects, 380);
            break;
        }
        case 'ghostStart':
            if (caster) {
                spawnSouls(caster.position, dir, { size: 2.2, life: 1.0 });
                spawnReaperSummon(caster.position, { life: 1.0, aura: false, size: 3 });
                spawnRisingGlyph(caster.position, '☠', '#e9d5ff', '#6d28d9');
            }
            break;
        case 'ghostEnd':
            if (caster) spawnSmokeBurst({ x: caster.member?.ghostX ?? caster.position.x, z: caster.member?.ghostZ ?? caster.position.z }, 12, 0.8);
            break;
    }
}

/** Đầu gậy phép của Tu Sĩ (điểm phóng phép) */
const staffPoint = (v) => ({ x: v.position.x + (v.facingLeft ? -0.75 : 0.75), y: 2.0 + (v._lift ?? 0) + (v._hover ?? 0), z: v.position.z });

/**
 * Tu Sĩ hồi máu / khiên. Bình thường: ánh sáng rọi xuống 1 người. Đang niệm: thiên thần nhỏ bay tới từng người
 * (khớp server: hồi ở impact + angelFlight, mỗi người cách 90ms).
 */
function priestSupport(caster, data) {
    const angel = data.effects.some(e => e.angel || e.winged);
    const clip = data.type === 'heal' ? 'heal' : 'shield';
    caster.playAction(clip, { onHit: () => {
        data.effects.forEach((e, k) => {
            const t = getView(data.casterId, e.targetIndex);
            if (!t) return;
            const land = () => {
                if (data.type === 'heal') {
                    spawnHealLight(t.position, { big: angel });
                    spawnDamageNumber(t.position, e.heal, 'heal');
                } else {
                    spawnHealLight(t.position, { big: false });
                    spawnDamageNumber(t.position, e.shield, 'shield');
                }
            };
            if (angel) {
                gameTimeout(() => spawnAngel(staffPoint(caster), () => chestOf(t, 1.6), { duration: 0.45, onArrive: land }), k * 90);
            } else land();
        });
    } });
}

/** Thiên phú Thiên Thần Hộ Mệnh: thiên thần bay tới xác đồng đội rồi hồi sinh */
function onReviveStart(data) {
    const priest = getView(data.casterId, data.casterIdx), dead = getView(data.casterId, data.targetIdx);
    if (!priest || !dead) return;
    spawnAngel(staffPoint(priest), () => chestOf(dead, 1.2), { duration: (data.flight ?? 1200) / 1000, size: 1.3 });
}
function onRevived(data) {
    const v = getView(data.casterId, data.targetIdx);
    if (!v) return;
    spawnReviveLight(v.position);
    spawnDamageNumber(v.position, data.hp, 'heal');
    cameraRig.shake(0.15, 200);
}

/** Mũi tên phụ sau đòn đánh thường của Xạ Thủ: Vệ Thần bắn phụ + mũi tên gió xuyên (nội tại Phong Tiễn) */
function onArcherShots(data) {
    const lyra = getView(data.casterId, data.casterIdx);
    if (!lyra) return;
    const opponentId = opponentIdOf(data.casterId);
    data.shots.forEach((shot, k) => {
        gameTimeout(() => {
            const from = shot.by === 'spirit' ? (lyra.windSpiritPos?.() ?? bowPoint(lyra)) : bowPoint(lyra);
            if (shot.kind === 'single') {
                const e = shot.effects[0];
                const t = getView(opponentId, e.targetIndex);
                if (t) spawnArrow(from, chestOf(t, 1.0), { duration: 0.2, size: 0.8, color: 0xb6fff0, onHit: () => showHit(t, e, { size: 0.7 }) });
                return;
            }
            // mũi tên gió xuyên: quét ngang, trúng lần lượt theo khoảng cách
            spawnPierceWind(from, shot.dir, 14, { scale: shot.by === 'spirit' ? 0.8 : 1 });
            shot.effects.forEach(e => {
                const t = getView(opponentId, e.targetIndex);
                if (!t) return;
                const d = Math.abs(t.position.x - from.x);
                gameTimeout(() => showHit(t, e, { size: 1 }), (d / 14) * 320);
            });
        }, 120 + k * 110);
    });
}

/** Khiên của Dựng Khiên phát nổ (mỗi 100 máu khiên mất): nổ vàng lan ra, quái trong vùng trúng đòn */
function onGuardBurst(data) {
    const rok = getView(data.casterId, data.casterIdx);
    if (!rok) return;
    const opponentId = opponentIdOf(data.casterId);
    // Khiên Thần nổ sóng (lần CUỐI — khiên hết giờ / vỡ / bị hạ: vỡ tan) + sóng vàng loang tới bán kính nổ
    rok.onGuardBurst?.(data.final);
    spawnGoldRing(rok.position, { radius: 5.5, life: 0.5 });
    spawnHitSpark(rok.position, { count: 8, color: 0xffe08a, size: 1.3 });
    cameraRig.shake(data.final ? 0.4 : 0.28, data.final ? 320 : 240);
    data.effects.forEach(e => {
        const v = getView(opponentId, e.targetIndex);
        if (!v) return;
        gameTimeout(() => {
            spawnDamageNumber(v.position, e.damage, damageType({ ...e, dodged: e.isMiss }));
            if (e.isMiss) return;
            spawnImpact(v.position, { size: 1.0, color: 0xffe08a });
            v.flashHit();
        }, 90);
    });
    // khiên nổ trúng quái -> cả đội hồi máu (số xanh nhỏ + đốm sáng vàng)
    (data.heals ?? []).forEach(h => {
        const v = getView(data.casterId, h.targetIndex);
        if (!v) return;
        gameTimeout(() => {
            spawnDamageNumber(v.position, h.heal, 'heal');
            spawnHealCross(v);
            spawnRisingSparkles(v.position, { count: 4, color: 0xffe08a, radius: 0.5 });
        }, 140);
    });
}

/**
 * Dựng Khiên: giơ khiên lên trời rồi cắm xuống (mốc 0,14s) -> KHIÊN THẦN hiện trước Rok (view tự vẽ suốt thời gian khiên,
 * rokFx.makeDivineShield), sóng vàng trên đất, khiên nhỏ "+thủ" bật trên đầu cả đội
 */
function warriorGuard(caster, data) {
    caster.playAction('guardStart', {
        onHit: () => {
            caster.raiseDivineShield?.();
            spawnGoldRing(caster.position, { radius: 3, life: 0.45 });
            spawnHitSpark(caster.position, { count: 10, color: 0xffe08a, size: 1.2 });
            cameraRig.shake(0.15, 160);
            (data?.effects ?? []).filter(e => e.ally).forEach((e, i) => {
                const v = getView(data.casterId, e.targetIndex);
                if (v) spawnBuffIcon(v, { delay: 0.05 + i * 0.06 });
            });
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
                // bùa bay ra từ đúng bàn tay ném (khung ném của sprite có điểm "hand"); không có thì từ ngực
                const hand = caster.pointWorld?.('hand');
                const from = hand ? new THREE.Vector3(hand.x, hand.y, hand.z) : caster.position.clone().add(UP);
                if (!hand) from.y += caster._lift ?? 0; // đang ở trên không
                const to = target.position.clone().add(UP);
                if (caster.def?.projectile === 'talisman') spawnTalismanShot(from, to, { duration: 0.2 });
                else spawnProjectile(from, to, '#facc15', 0.2, caster.createProjectileMesh?.()); // bay nhanh
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
    socket.on('guardBurst', onGuardBurst);
    socket.on('archerShots', onArcherShots);
    socket.on('reviveStart', onReviveStart);
    socket.on('fireHits', onFireHits);
    // Thánh Niệm: mỗi giây hồi máu nhẹ cả đội (số xanh nhỏ + đốm sáng)
    socket.on('prayHeal', (d) => d.heals.forEach(h => {
        const v = getView(d.casterId, h.targetIndex);
        if (!v) return;
        spawnDamageNumber(v.position, h.heal, 'heal');
        spawnRisingSparkles(v.position, { count: 5, color: 0xfde68a, radius: 0.5 });
    }));
    socket.on('fireGod', onFireGod);
    // Thiên phú Đánh Lén — Bóng Ẩn: Jessica (máu còn 50%) phụt khói biến mất, nhảy ra sau lưng đối thủ yếu máu nhất
    socket.on('shadowStep', (d) => {
        const v = getView(d.casterId, d.casterIdx);
        if (!v) return;
        spawnSmokeBurst({ x: d.fromX, z: d.fromZ }, 14, 0.8);
        spawnRisingGlyph(v.position, '隠');
        const t = getView(d.targetId, d.targetIndex);
        if (t) v.facingLeft = t.position.x < d.toX;
        if (v.leapTo) v.leapTo(d.toX, d.toZ, { duration: 0.35, height: 1.4 });
        else v.teleport(d.toX, d.toZ);
        gameTimeout(() => spawnSmokeBurst({ x: d.toX, z: d.toZ }, 8, 0.5), 350);
    });
    socket.on('reaperFx', onReaperFx);
    socket.on('brakkFx', onBrakkFx);
    socket.on('rokFx', onRokFx);
    socket.on('fireWard', onFireWard);
    socket.on('waterFx', onWaterFx);
    socket.on('elemFx', onElemFx);
    socket.on('revived', onRevived);
    // Bắt đầu niệm (VD Thần Tiễn của Lyra gồng 2 giây): gió hút quanh người
    socket.on('castStart', onCastStart);
}

/** Bắt đầu niệm / gồng: động tác giữ + vòng phép dưới chân */
function onCastStart(data) {
    const v = getView(data.casterId, data.casterIdx);
    const classId = game.roomData?.players?.[data.casterId]?.squad?.[data.casterIdx]?.classId;
    const def = game.classDefs?.[classId]?.skills?.[data.skillIdx];
    if (v && (def?.type === 'sky_fireball' || def?.type === 'fire_pillar')) {
        // Ignar niệm KN1 / KN2 (1s): gồng nhẹ, vòng lửa nhỏ dưới chân
        v.playAction?.('charge', { hold: true });
        spawnSummonCircle(v.position, { life: (data.castTime ?? 1000) / 1000 + 0.1, size: 2.6 });
        return;
    }
    if (v && def?.type === 'reaper_scythe') {
        // Zerith niệm Lưỡi Hái Hất Hồn: giơ liềm, vòng ấn tím dưới chân, LƯỠI HÁI KHỔNG LỒ hiện dần trước mặt
        const castMs = data.castTime ?? 700;
        v.playAction?.('charge', { hold: true });
        spawnReaperSummon(v.position, { life: castMs / 1000 + 0.1, size: 2.6, aura: false });
        const ph = spawnPhantomScythe(() => v.position, v.facingLeft ? -1 : 1, { formTime: castMs / 1000 });
        v._phantom?.cancel();
        v._phantom = ph;
        gameTimeout(() => { if (v._phantom === ph) { ph.cancel(); v._phantom = null; } }, castMs + 700);   // bị ngắt niệm
        return;
    }
    if (v && def?.type === 'reaper_night') {
        // gồng Đêm Tử Thần (1s): vòng ấn tử thần + hào quang tím dưới chân
        v.playAction?.('charge', { hold: true });
        spawnReaperSummon(v.position, { life: (data.castTime ?? 1000) / 1000 + 0.1 });
        return;
    }
    if (v && (def?.type === 'brakk_stomp' || def?.type === 'brakk_giant')) {
        // Brakk niệm Chấn Địa (1s) / Thần Lực Khổng Lồ (0.5s): hạ trọng tâm gồng cơ, lửa bốc quanh chân
        v.playAction?.('charge', { hold: true });
        v.flashMagicCircle?.((data.castTime ?? 1000) / 1000);
        spawnRisingSparkles(v.position, { count: 12, color: 0xff8c2a, radius: 1.0 });
        return;
    }
    if (v && def?.type === 'fire_god') {
        // gồng Hỏa Thần: hạ người, vòng triệu hồi + hào quang lửa dưới chân
        v.playAction?.('charge', { hold: true });
        spawnSummonCircle(v.position, { life: (data.castTime ?? 1500) / 1000 + 0.1 });
        return;
    }
    // Elarion niệm Hơi Nước Bỏng (2s) · Golem hút khí lạnh (Bão Tuyết) / gồng sét (Hào Quang Sét)
    const live = game.roomData?.players?.[data.casterId]?.squad?.[data.casterIdx]?.skills?.[data.skillIdx];
    if (v && live?.type === 'elem_spell') {
        v.playAction?.('cast', { hold: true });   // niệm: kết ấn trước Sách đang mở
        v.flashMagicCircle?.((data.castTime ?? 2000) / 1000);
        spawnRisingSparkles(v.position, { count: 14, color: 0x94a3b8, radius: 1.2 });
        return;
    }
    if (v && def?.type === 'golem_blizzard') { v.playAction?.('inhale', { hold: true }); spawnInhale(mouthOf(v), v.facingLeft ? -1 : 1, (data.castTime ?? 2000) / 1000); return; }
    if (v && def?.type === 'golem_aura') { v.flashMagicCircle?.((data.castTime ?? 1000) / 1000); spawnRisingSparkles(v.position, { count: 10, color: 0xb784ff, radius: 1 }); return; }
    if (!v || def?.type !== 'charged_shot') return;
    v.playAction?.('cast', { hold: true });   // kéo căng dây, giữ nguyên tới lúc nhả
    spawnChargeWind(v.position, (data.castTime ?? 2000) / 1000, { y: 1.1 + (v._hover ?? 0) });
}

/** Dùng cho công cụ xem thử hiệu ứng (tools/fx-brakk.html, fx-ignar.html...) — gọi thẳng hàm xử lý sự kiện với dữ liệu giả */
export const __fxTest = { onSkillExecuted, onAutoAttack, onBrakkFx, onReaperFx, onRokFx, onGuardBurst, onFireWard, onWaterFx, onElemFx, onFireHits, onFireGod, onCastStart };
