// ============================================================
// BATTLE SCENE — dựng trận, đồng bộ trạng thái server, điều khiển camera
// ============================================================
import { scene, camera, renderer, clearDynamicObjects } from '../core/scene.js';
import { warmFlipbooks } from '../vfx/flipbook.js';
import { cameraRig } from '../core/cameraRig.js';
import { game, myId, forEachView } from '../state.js';
import { gameNow } from '../config.js';

import { createCharacterView } from '../characters/registry.js';
import { clearVfx, spawnDashStreak, spawnLandingDust } from '../vfx/vfx.js';
import { makeRokTether } from '../vfx/linkFx.js';
import { updateElemGems, clearElemGems } from './elemGems.js';


function makeView(playerId, member) {
    const isMine = playerId === myId();
    const view = createCharacterView(member, game.classDefs[member.classId], isMine);
    view.isLocalPlayer = isMine;
    view._summonId = member.summonId ?? null;
    scene.add(view.root);
    return view;
}
function createSquadViews(playerId, squad) {
    game.views[playerId] = squad.map(member => makeView(playerId, member));
}

function disposeAllViews() {
    clearElemGems();
    forEachView(view => view.dispose());
    game.views = {};
}

/** Dựng lại toàn bộ trận khi server gửi battleStart (cả lúc chơi lại) */
export function buildBattleScene(data) {
    disposeAllViews();
    clearVfx();
    clearDynamicObjects();
    cameraRig.reset();
    cameraRig.setMode('combat'); // vào trận luôn dùng góc ngang
    game.cameraEngaged = false;

    game.roomData = data;
    game.classDefs = data.classDefs;
    const me = myId();

    Object.entries(data.players).forEach(([playerId, playerData]) => {
        createSquadViews(playerId, playerData.squad);
        if (playerId === me) game.mySide = playerData.side;
    });

    // Camera bắt đầu ngay chỗ đội hình của mình
    const mySquad = data.players[me]?.squad ?? [];
    if (mySquad.length) {
        cameraRig.snapTo(
            mySquad.reduce((s, m) => s + m.x, 0) / mySquad.length,
            mySquad.reduce((s, m) => s + (m.z || 0), 0) / mySquad.length,
        );
    }
    playBattleIntro(me);
    // tải sẵn atlas hiệu ứng lên card đồ hoạ trong lúc đếm ngược (khỏi khựng lần đầu tung kỹ năng)
    try { warmFlipbooks(renderer); } catch (e) { console.warn('warmFlipbooks', e); }
}

/**
 * Mở màn (trong lúc đếm ngược 3-2-1): camera từ xa lướt vào, từng nhân vật rơi từ trên cao xuống
 * kèm vệt lướt, đáp đất tung bụi + rung nhẹ, rồi đứng thở chờ hiệu lệnh.
 */
function playBattleIntro(me) {
    cameraRig.introZoom(2.6, 1.6);
    let order = 0;
    const ids = Object.keys(game.views).sort((a, b) => (a === me ? -1 : b === me ? 1 : 0));
    for (const id of ids) {
        game.views[id].forEach((view) => {
            if (!view.playIntro || !view.member.alive) return;
            view.playIntro({
                delay: 0.45 + order++ * 0.16,
                onStart: (v) => spawnDashStreak(v, 9),
                onLand: (v) => {
                    spawnLandingDust(v.position);
                    cameraRig.shake(id === me ? 0.18 : 0.1, 160);
                },
            });
        });
    }
}

/** Server đổi số thành viên (debug triệu hồi quái) */
export function rebuildSquad(playerId, newSquad) {
    game.views[playerId]?.forEach(view => view.dispose());
    if (!game.classDefs) return;
    createSquadViews(playerId, newSquad);
}

/** Gói stateUpdate (20 lần/giây): chỉ cập nhật "đích", việc vẽ do updateViews() lo */
export function syncState(players) {
    Object.entries(players).forEach(([playerId, playerData]) => {
        const views = game.views[playerId];
        if (!views) return;
        playerData.squad.forEach((member, i) => {
            // nhân vật triệu hồi (Golem Nguyên Tố của Elarion): thêm vào cuối đội / thay Golem cũ cùng chỗ
            if (member.summon && (!views[i] || views[i]._summonId !== member.summonId)) {
                if (!member.alive && !views[i]) return;
                views[i]?.dispose();
                views[i] = makeView(playerId, member);
                if (member.classId === 'elem_golem' && views[i].playAction) views[i].playAction('summon');   // trồi lên từ vòng triệu hồi
                else views[i].playIntro?.({ delay: 0 });
            }
            const v = views[i];
            if (!v) return;
            v.syncFromServer(member, players, playerId);
            // Golem tan / bị hạ: ẩn sau khi diễn xong lúc gục
            if (member.summon) {
                if (member.alive) v._goneAt = 0;
                else if (!v._goneAt) v._goneAt = performance.now() + (member.vanished ? 250 : 1600);
                v.root.visible = member.alive || performance.now() < v._goneAt;
            }
        });
    });
}

// Hai phe cách nhau dưới khoảng này (theo trục x) thì camera combat ôm cả hai phe
const ENGAGE_DISTANCE = 26;

function aliveViews(playerId) {
    return game.views[playerId]?.filter(v => v.member.alive) ?? [];
}

/**
 * Combat (góc ngang): lúc hai phe còn xa thì bám đội mình; khi áp sát thì ôm khung cả hai phe.
 * Explore (góc chéo): bám trung tâm đội hình mình.
 */
function updateCamera() {
    const me = myId();
    const mine = aliveViews(me);
    if (mine.length === 0) return;
    const avgZ = mine.reduce((s, v) => s + v.position.z, 0) / mine.length;
    // Có Thần Hộ Vệ (Dựng Khiên) đang hiện -> nâng khung hình để thấy trọn vị thần trên đầu Rok
    const now = gameNow();
    const all = Object.values(game.views).flat();
    // Brakk nhảy vọt cao (Bá Vương Quật / Chấn Địa): nâng + lùi camera để thấy trọn cú nhảy
    const bigJump = all.some(v => (v._bigJumpUntil ?? 0) > now);
    cameraRig.setLift(bigJump ? 3.6 : all.some(v => v.member.alive && v.member.statusEffects?.some(e => e.type === 'guard' && e.endTime > now)) ? 1.5 : 0, bigJump ? 7 : 3);

    if (cameraRig.getMode() === 'explore') {
        const x = mine.reduce((s, v) => s + v.position.x, 0) / mine.length;
        cameraRig.setTarget(x, avgZ);
        return;
    }

    const opponentId = Object.keys(game.views).find(id => id !== me);
    const enemies = aliveViews(opponentId);
    let group = mine;
    if (enemies.length) {
        const gap = Math.min(...mine.flatMap(a => enemies.map(b => Math.abs(a.position.x - b.position.x))));
        if (gap < ENGAGE_DISTANCE) game.cameraEngaged = true;
        if (game.cameraEngaged) group = mine.concat(enemies);
    }
    const xs = group.map(v => v.position.x);
    cameraRig.frame(Math.min(...xs), Math.max(...xs), avgZ);
}

/** Mỗi frame render */
export function updateViews(dt) {
    forEachView(view => view.update(dt, camera));
    updateElemGems(dt);
    updateTethers(dt);
    updateCamera();
}

// Dây liên kết của Rok (thiên phú Ý Chí Thép): vẽ khi server báo linkIdx, mờ dần khi đứt
const tethers = new Map();   // view của Rok -> tether
function updateTethers(dt) {
    const seen = new Set();
    forEachView((v) => {
        const m = v.member;
        if (!(m?.linkIdx >= 0)) return;
        const pid = Object.keys(game.views).find(id => game.views[id].includes(v));
        const other = game.views[pid]?.[m.linkIdx];
        if (!other) return;
        let tt = tethers.get(v);
        const on = !m.linkBroken && m.alive && other.member?.alive;
        if (!tt && !on) return;
        if (!tt) { tt = makeRokTether(); scene.add(tt.group); tethers.set(v, tt); }
        seen.add(v);
        const ya = (v._lift ?? 0) + 0.9, yb = (other._lift ?? 0) + (other._hover ?? 0) + 0.9;
        const k = tt.update(dt, v.position, other.position, ya, yb, on);
        if (!on && k < 0.03) { tt.dispose(); tethers.delete(v); tt.dead = true; }
    });
    for (const [v, tt] of tethers) if (!seen.has(v)) { tt.dispose(); tethers.delete(v); }
}

