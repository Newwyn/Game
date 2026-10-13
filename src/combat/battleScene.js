// ============================================================
// BATTLE SCENE — dựng trận, đồng bộ trạng thái server, điều khiển camera
// ============================================================
import { scene, camera, clearDynamicObjects } from '../core/scene.js';
import { cameraRig } from '../core/cameraRig.js';
import { game, myId, forEachView } from '../state.js';

import { createCharacterView } from '../characters/registry.js';
import { clearVfx, spawnDashStreak, spawnLandingDust } from '../vfx/vfx.js';


function createSquadViews(playerId, squad) {
    const isMine = playerId === myId();
    game.views[playerId] = squad.map(member => {
        const view = createCharacterView(member, game.classDefs[member.classId], isMine);
        view.isLocalPlayer = isMine;
        scene.add(view.root);
        return view;
    });
}

function disposeAllViews() {
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
        playerData.squad.forEach((member, i) => views[i]?.syncFromServer(member, players, playerId));
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
    updateCamera();
}

