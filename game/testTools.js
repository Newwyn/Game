const C = require('./campaign');
const A = require('./account');
const EV = require('./evidence');
const G = require('./gear');
const WD = require('./world');
const ST = require('./stamina');
const P = require('../progression');
const allowed = server => server === 'guest' || server === 'test';
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : min));
const named = obj => Object.entries(obj).map(([id, v]) => ({ id, name: v.name }));
function catalog(heroes) {
    return { chapters: C.CHAPTERS.map(c => ({ id: c.id, name: c.name,
        stages: c.stages.map(({ id, no, name }) => ({ id, no, name })), branches: c.branches.map(({ id, name }) => ({ id, name })) })),
        heroes, items: named(P.ITEMS), gearSets: named(G.SETS), gearSlots: G.SLOTS, rarities: G.RARITIES, scenes: named(WD.SCENES) };
}
function clearThrough(pr, stages) {
    for (const s of stages) {
        pr.campaign.cleared.story[s.id] = true;
        EV.grantStage(pr, s.id);
        for (const hero of s.joins ?? []) if (!pr.owned.includes(hero)) pr.owned.push(hero);
    }
    delete pr.account;
    A.ensureAccount(pr);
    pr.player ??= { gender: 'm', name: 'Kael' };
    pr.story.prologue = pr.story.wake = true;
}
function apply(pr, d, heroIds) {
    const bad = text => ({ ok: false, text });
    const stages = C.CHAPTERS.flatMap(c => c.stages);
    switch (d.op) {
        case 'stageJump': {
            const index = stages.findIndex(s => s.id === d.stageId);
            if (index < 0) return bad('Ải không tồn tại');
            for (const s of stages.slice(index)) for (const diff of C.DIFFS) delete pr.campaign.cleared[diff][s.id];
            clearThrough(pr, stages.slice(0, index));
            WD.syncReports(pr);   // các ải đã qua coi như đã về báo lại
            break;
        }
        case 'unlockChapter': {
            const index = C.CHAPTERS.findIndex(c => c.id === d.chapter);
            if (index < 0) return bad('Chương không tồn tại');
            const chapters = C.CHAPTERS.slice(0, index + 1);
            clearThrough(pr, chapters.flatMap(c => c.stages));
            for (const c of chapters) {
                for (const s of [...c.stages, ...c.branches]) {
                    pr.campaign.cleared.story[s.id] = true;
                    pr.campaign.cleared.hard[s.id] = true;
                }
                for (const b of c.branches) if (b.flag) pr.flags[b.flag] = true;
            }
            pr.account.level = Math.max(20, pr.account.level);
            WD.syncReports(pr);
            break;
        }
        case 'heroes': case 'hero': {
            if (d.op === 'hero' && !heroIds.includes(d.id)) return bad('Anh hùng không tồn tại');
            for (const id of d.op === 'hero' ? [d.id] : heroIds) {
                const h = pr.heroes[id];
                if (d.level != null) h.level = clamp(d.level, 1, 60);
                if (d.rank != null) h.rank = clamp(d.rank, 0, 3);
                h.exp = 0;
            }
            if (d.op === 'heroes' && d.ownAll === true) pr.owned = [...heroIds];
            break;
        }
        case 'account': pr.account.level = clamp(d.level, 1, A.TABLE.maxLevel); pr.account.exp = 0; break;
        case 'wallet':
            for (const k of ['gold', 'diamond', 'stone']) if (d[k] != null) pr.wallet[k] = clamp(pr.wallet[k] + clamp(d[k], -1e9, 1e9), 0, 1e9);
            if (d.stamina === 'full') pr.stamina = ST.defaultStamina(Date.now());
            break;
        case 'item':
            if (!Object.hasOwn(P.ITEMS, d.id)) return bad('Vật phẩm không tồn tại');
            pr.items[d.id] = clamp((pr.items[d.id] ?? 0) + clamp(d.count, 1, 999), 0, 1e9);
            break;
        case 'gear': {
            if (d.set != null && !Object.hasOwn(G.SETS, d.set)) return bad('Bộ đồ không tồn tại');
            if (d.slot != null && !G.SLOTS.includes(d.slot)) return bad('Vị trí đồ không hợp lệ');
            const level = G.LEVELS.reduce((best, n) => Math.abs(n - clamp(d.level, 10, 60)) < Math.abs(best - clamp(d.level, 10, 60)) ? n : best, 10);
            let count = 0;
            for (let i = 0; i < clamp(d.count ?? 1, 1, 100); i++) for (const slot of d.slot ? [d.slot] : d.set ? G.SET_SLOTS : G.SLOTS) {
                if (G.addItem(pr, G.createItem(Math.random, { slot, level, rarity: clamp(d.rarity, 0, 4), set: d.set }, G.newId(pr)))) count++;
            }
            return { ok: count > 0, text: count ? `Đã nhận ${count} món đồ` : 'Túi đồ đã đầy' };
        }
        case 'evidenceAll': pr.evidence = Object.fromEntries(EV.EVIDENCE.map(e => [e.id, true])); break;
        case 'teleport': {
            if (!Object.hasOwn(WD.SCENES, d.scene)) return bad('Khu vực không tồn tại');
            const scene = WD.SCENES[d.scene];
            const need = WD.AREAS[scene.area].needNo;
            const index = scene.needStage ? stages.findIndex(s => s.id === scene.needStage) + 1 : need;
            clearThrough(pr, stages.slice(0, Math.max(need, index)));
            Object.assign(WD.ensureWorld(pr), { ...WD.sceneSpawn(d.scene), scene: d.scene });
            pr.world.teleportVersion = (pr.world.teleportVersion ?? 0) + 1;
            break;
        }
        default: return bad('Thao tác không hợp lệ');
    }
    return { ok: true, text: 'Đã cập nhật tiến trình' };
}
module.exports = { allowed, clamp, catalog, apply };
