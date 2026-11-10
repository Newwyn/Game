// ============================================================
// Hiệu ứng điểm ảnh pixelfx (Patch, MIT — src/vendor/pixelfx/LICENSE) dùng chung cho mọi kỹ năng
//   spawnPixelFx('melee/sword-slash', { view })                    -> gắn vào nhân vật (đi theo, quay theo hướng mặt)
//   spawnPixelFx('impacts/ground-slam', { pos: {x, z}, flip })     -> đặt tại 1 chỗ trên sân
//   tuỳ chọn: palette ('gold' | tên trong PAL | mảng màu) · until: () => true thì hiệu ứng lặp tự tắt (mờ dần)
//             scale (cỡ so với nhân vật cao 44 px) · seed · front: chỉ vẽ lớp trước · opts: tuỳ chọn riêng của hiệu ứng
//             follow: false -> gắn hình bóng của view nhưng đứng yên tại chỗ
//             bare: hiệu ứng vẽ lại thân nhân vật (VD status/rage) -> chỉ đưa khung hình bóng, không đưa màu
// Mỗi hiệu ứng vẽ vào khung điểm ảnh nhỏ theo từng nhịp -> 2 tấm phẳng (sau / trước nhân vật), phóng to giữ nét (NearestFilter).
// Người đứng giữa của hiệu ứng = hình bóng thật của nhân vật (actorOf) -> hạt / viền ôm đúng dáng.
// Thêm hiệu ứng: import file trong src/vendor/pixelfx/fx/<loại>/<tên>.js vào LIB bên dưới.
// ============================================================
import * as THREE from 'three';
import { createFrame, clearFrame, createFx, composite, PAL } from '../vendor/pixelfx/core/index.js';
import { addAnim } from './vfx.js';
import { GROUND_Y } from '../config.js';
import * as swordSlash from '../vendor/pixelfx/fx/melee/sword-slash.js';
import * as hitSpark from '../vendor/pixelfx/fx/impacts/hit-spark.js';
import * as rage from '../vendor/pixelfx/fx/status/rage.js';
import * as exclamation from '../vendor/pixelfx/fx/ui/exclamation.js';
import * as bluntHit from '../vendor/pixelfx/fx/impacts/blunt-hit.js';
import * as groundSlam from '../vendor/pixelfx/fx/impacts/ground-slam.js';
import * as stunned from '../vendor/pixelfx/fx/status/stunned.js';
import * as forceField from '../vendor/pixelfx/fx/scifi/force-field.js';
import * as thunderclap from '../vendor/pixelfx/fx/lightning/thunderclap.js';
import * as zapHit from '../vendor/pixelfx/fx/lightning/zap-hit.js';
import * as critHit from '../vendor/pixelfx/fx/impacts/crit-hit.js';
import * as doubleSlash from '../vendor/pixelfx/fx/melee/double-slash.js';
import * as blinkOut from '../vendor/pixelfx/fx/arcane/blink-out.js';
import * as blinkIn from '../vendor/pixelfx/fx/arcane/blink-in.js';
import * as smokeBomb from '../vendor/pixelfx/fx/explosions/smoke-bomb.js';
import * as heal from '../vendor/pixelfx/fx/holy/heal.js';
import * as resurrection from '../vendor/pixelfx/fx/holy/resurrection.js';
import * as leafStorm from '../vendor/pixelfx/fx/nature/leaf-storm.js';
import * as featherBurst from '../vendor/pixelfx/fx/holy/feather-burst.js';
import * as haste from '../vendor/pixelfx/fx/status/haste.js';
import * as hawkSight from './pixelfx-custom/hawk-sight.js';   // tự vẽ theo phong cách pixelfx
import * as castFlash from './pixelfx-custom/cast-flash.js';   // tự vẽ: loé ra đòn đánh xa
import * as waterHit from './pixelfx-custom/water-hit.js';     // tự vẽ: Giọt Thủy Vũ (Nerissa)
import * as ripples from '../vendor/pixelfx/fx/water/ripples.js';
import * as meteor from '../vendor/pixelfx/fx/fire/meteor.js';
import * as frostBreath from '../vendor/pixelfx/fx/ice/frost-breath.js';
import * as blizzardW from '../vendor/pixelfx/fx/weather/blizzard.js';
import * as stormW from '../vendor/pixelfx/fx/weather/storm.js';
import * as tornado from '../vendor/pixelfx/fx/nature/tornado.js';
import * as voidOrb from '../vendor/pixelfx/fx/shadow/void-orb.js';
import * as electrified from '../vendor/pixelfx/fx/lightning/electrified.js';
import * as fireball from '../vendor/pixelfx/fx/fire/fireball.js';
import * as divineShield from '../vendor/pixelfx/fx/holy/divine-shield.js';
import * as waterAura from './pixelfx-custom/water-aura.js';   // tự vẽ: Thủy Vũ Hoàn (Nerissa múa)
import * as thrust from '../vendor/pixelfx/fx/melee/thrust.js';
import * as clawSwipe from '../vendor/pixelfx/fx/melee/claw-swipe.js';
import * as smallExplosion from '../vendor/pixelfx/fx/explosions/small-explosion.js';
import * as bigExplosion from '../vendor/pixelfx/fx/explosions/big-explosion.js';
import * as flamePillar from '../vendor/pixelfx/fx/fire/flame-pillar.js';
import * as fireRing from '../vendor/pixelfx/fx/fire/fire-ring.js';
import * as spellCharge from '../vendor/pixelfx/fx/arcane/spell-charge.js';
import * as scytheReap from '../vendor/pixelfx/fx/melee/scythe-reap.js';
import * as darkExplosion from '../vendor/pixelfx/fx/shadow/dark-explosion.js';
import * as curse from '../vendor/pixelfx/fx/shadow/curse.js';
import * as quake from '../vendor/pixelfx/fx/nature/quake.js';
import * as heavyLanding from '../vendor/pixelfx/fx/impacts/heavy-landing.js';
import * as uppercut from '../vendor/pixelfx/fx/melee/uppercut.js';
import * as splash from '../vendor/pixelfx/fx/water/splash.js';
import * as waveCrash from '../vendor/pixelfx/fx/water/wave-crash.js';
import * as iceShatter from '../vendor/pixelfx/fx/ice/ice-shatter.js';
import * as acidSplash from '../vendor/pixelfx/fx/nature/acid-splash.js';
import * as poisonCloud from '../vendor/pixelfx/fx/nature/poison-cloud.js';
import * as healingBloom from '../vendor/pixelfx/fx/nature/healing-bloom.js';
import * as thorns from '../vendor/pixelfx/fx/nature/thorns.js';

const LIB = {
    'melee/sword-slash': swordSlash, 'impacts/hit-spark': hitSpark, 'status/rage': rage, 'ui/exclamation': exclamation,
    'impacts/blunt-hit': bluntHit, 'impacts/ground-slam': groundSlam, 'status/stunned': stunned,
    'scifi/force-field': forceField, 'lightning/thunderclap': thunderclap,
    'lightning/zap-hit': zapHit, 'impacts/crit-hit': critHit, 'melee/double-slash': doubleSlash,
    'arcane/blink-out': blinkOut, 'arcane/blink-in': blinkIn, 'explosions/smoke-bomb': smokeBomb,
    'holy/heal': heal, 'holy/resurrection': resurrection, 'nature/leaf-storm': leafStorm, 'holy/feather-burst': featherBurst, 'status/haste': haste, 'custom/hawk-sight': hawkSight, 'custom/cast-flash': castFlash, 'custom/water-hit': waterHit, 'water/ripples': ripples, 'fire/meteor': meteor,
    'ice/frost-breath': frostBreath, 'weather/blizzard': blizzardW, 'weather/storm': stormW, 'nature/tornado': tornado,
    'shadow/void-orb': voidOrb, 'lightning/electrified': electrified, 'fire/fireball': fireball, 'holy/divine-shield': divineShield, 'custom/water-aura': waterAura, 'melee/thrust': thrust, 'melee/claw-swipe': clawSwipe,
    'explosions/small-explosion': smallExplosion, 'explosions/big-explosion': bigExplosion, 'fire/flame-pillar': flamePillar,
    'fire/fire-ring': fireRing, 'arcane/spell-charge': spellCharge,
    'melee/scythe-reap': scytheReap, 'shadow/dark-explosion': darkExplosion, 'shadow/curse': curse, 'nature/quake': quake, 'impacts/heavy-landing': heavyLanding, 'melee/uppercut': uppercut, 'water/splash': splash, 'water/wave-crash': waveCrash, 'ice/ice-shatter': iceShatter, 'nature/acid-splash': acidSplash, 'nature/poison-cloud': poisonCloud, 'nature/healing-bloom': healingBloom, 'nature/thorns': thorns,
};

/** Bật hiệu ứng pixelfx cho Rok (thử nghiệm 11/2026) — ?rokFx=old để xem bản cũ */
export const ROK_PIXEL = typeof location === 'undefined' || new URLSearchParams(location.search).get('rokFx') !== 'old';
export const pixelMod = (name) => LIB[name];
/** Jessica (thử nghiệm 11/2026) — ?jessFx=old để xem bản cũ */
/** Seraphine / Lyra (thử nghiệm 11/2026) — ?seraFx=old / ?lyraFx=old để xem bản cũ */
const q = (k) => typeof location === 'undefined' || new URLSearchParams(location.search).get(k) !== 'old';
export const SERA_PIXEL = q('seraFx'), LYRA_PIXEL = q('lyraFx'), IGNAR_PIXEL = q('ignarFx');
/** 6 nhân vật còn lại (11/2026): ?<tên>Fx=old để xem bản cũ */
export const ZERITH_PIXEL = q('zerithFx'), BRAKK_PIXEL = q('brakkFx'), NERISSA_PIXEL = q('nerissaFx'), ELARION_PIXEL = q('elarionFx'), GRIX_PIXEL = q('grixFx'), SYLVA_PIXEL = q('sylvaFx');
export const JESS_PIXEL = typeof location === 'undefined' || new URLSearchParams(location.search).get('jessFx') !== 'old';

/** hiệu ứng lấy chỗ trúng đòn làm gốc (không phải chân) -> spawnPixelFx tự nâng lên ngang ngực */
const CENTERED = new Set(['lightning/zap-hit']);

export const ACTOR_H = 44;   // nhân vật cao 44 điểm ảnh (bằng nhân vật mẫu của thư viện)
const actorCache = new WeakMap();

/** Hình bóng nhân vật cho pixelfx (khung idle1 trong atlas, thu nhỏ 44 px cao, chân ở (0, 0)); null nếu chưa tải */
export function actorOf(view) {
    const sp = view?.sprite;
    const f = sp?.meta?.frames?.idle1 ?? sp?.meta?.frames?.[Object.keys(sp?.meta?.frames ?? {})[0]];
    const img = view?._spTex?.image;
    if (!f || !img || !(img.naturalWidth || img.width)) return null;
    const hit = actorCache.get(view);
    if (hit?.img === img) return hit.A;
    const [sx, sy, sw, sh] = f.rect;
    const k = ACTOR_H / sh, w = Math.max(4, Math.round(sw * k)), h = ACTOR_H;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const data = new Uint8Array(w * h), pixels = new Uint32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        if (d[i * 4 + 3] < 128) continue;
        data[i] = 1;
        pixels[i] = ((255 << 24) | (d[i * 4 + 2] << 16) | (d[i * 4 + 1] << 8) | d[i * 4]) >>> 0;
    }
    const ox = Math.round((f.org?.[0] ?? sw / 2) * k);
    const A = { mask: { w, h, data }, pixels, x: -ox, y: -h, w, h, k: 2, head: [0, -h], chest: [0, -Math.round(h * 0.6)] };
    actorCache.set(view, { img, A });
    return A;
}

/** Hình bóng "trơn": giữ khung (vị trí đầu / chân / viền) nhưng không có màu -> hiệu ứng vẽ lại thân (rung, ửng đỏ)
 *  không chồng 1 bản điểm ảnh thô lên hình nét cao của nhân vật */
const bareCache = new WeakMap();
function bareOf(A) {
    if (!A) return null;
    if (!bareCache.has(A)) bareCache.set(A, { ...A, pixels: new Uint32Array(A.pixels.length) });
    return bareCache.get(A);
}

const paletteOf = (p) => (typeof p === 'string' ? PAL[p] : p);

/**
 * Lớp vẽ 1 hiệu ứng: { group, step(dt), stop(), done() }. group: chân hiệu ứng ở (0, 0, 0), cỡ 1 px = height / 44.
 */
export function pixelLayer(mod, { height = 2.9, scale = 1, actor = null, palette, seed, flip = false, front = false, soft = 0, opts = {} } = {}) {
    const [W, H] = mod.meta.size, [OX, OY] = mod.meta.origin;
    const pad = 4, fw = W + pad * 2, fh = H + pad * 2;
    const layers = front ? ['front'] : ['back', 'front'];
    const group = new THREE.Group();
    const L = {};
    for (const k of layers) {
        const c = document.createElement('canvas'); c.width = fw; c.height = fh;
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
        const u = (height / ACTOR_H) * scale;
        mesh.scale.set(fw * u, fh * u, 1);
        mesh.position.set((fw / 2 - OX - pad) * u * (flip ? -1 : 1), (OY + pad - fh / 2) * u, k === 'back' ? -0.25 : 0.35);
        mesh.renderOrder = k === 'back' ? 1 : 3;
        group.add(mesh);
        L[k] = { c, tex, mesh, frame: createFrame(fw, fh, flip ? -(W - OX) - pad : -OX - pad, -OY - pad), img: new ImageData(fw, fh) };
    }
    // soft (0..1): hiệu ứng thời tiết vẽ cả NỀN TRỜI -> làm mép khung mờ dần + màu tối trong suốt, để không thành 1 tấm chữ nhật trên sân
    let mask = null;
    if (soft) {
        mask = new Float32Array(fw * fh);
        const e = 0.22;
        for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
            const ex = Math.min(x / (fw * e), (fw - 1 - x) / (fw * e), 1), ey = Math.min(y / (fh * e), (fh - 1 - y) / (fh * e * 0.5), 1);
            mask[y * fw + x] = Math.max(0, ex) * Math.max(0, ey);
        }
    }
    const o = { x: 0, y: 0, flip, ...(seed != null ? { seed } : {}), ...(actor ? { actor } : {}), ...(palette ? { palette: paletteOf(palette) } : {}), ...opts };
    const fx = createFx(mod, o);
    return {
        group,
        step(dt) {
            fx.update(dt);
            for (const k of layers) {
                const l = L[k], f = clearFrame(l.frame);
                fx.draw(f, k);
                composite(f, l.img.data, null);
                if (mask) {
                    const d = l.img.data;
                    for (let i = 0, n = mask.length; i < n; i++) {
                        const j = i * 4;
                        if (!d[j + 3]) continue;
                        const lum = (d[j] * 0.3 + d[j + 1] * 0.55 + d[j + 2] * 0.15) / 255;
                        const k = mask[i] * Math.min(1, Math.max(0, (lum - 0.42 * soft) / 0.35));
                        d[j + 3] = d[j + 3] * k;
                    }
                }
                l.c.getContext('2d').putImageData(l.img, 0, 0);
                l.tex.needsUpdate = true;
            }
        },
        stop: () => fx.stop(),
        done: () => fx.done(),
        meta: mod.meta,
    };
}

/**
 * Phát 1 hiệu ứng trong trận. view: gắn vào nhân vật (đi theo + dùng hình bóng của nó) · pos: đặt cố định trên sân.
 * Hiệu ứng lặp (meta.loop) chạy tới khi until() trả true (hoặc hết `maxLife` giây) rồi mờ dần.
 */
export function spawnPixelFx(name, { view = null, pos = null, flip, until = null, maxLife = 12, height, delay = 0, bare = false, lift, follow = true, getPos = null, ...rest } = {}) {
    const mod = LIB[name];
    if (!mod) { console.warn('pixelFx: chưa nạp', name); return null; }
    const go = () => {
        const h = height ?? view?.height ?? 2.9;
        const f = flip ?? (view ? !!view.facingLeft : false);
        const A = view ? actorOf(view) : null;
        const layer = pixelLayer(mod, { height: h, actor: bare ? bareOf(A) : A, flip: f, ...rest });
        const g = layer.group;
        // hiệu ứng có gốc ở GIỮA (chỗ trúng đòn, VD zap-hit) thay vì ở chân -> nâng lên ngang ngực
        const up = lift ?? (CENTERED.has(name) ? h * 0.45 : 0);
        const place = () => {
            // getPos(): bám 1 điểm thế giới mỗi khung (VD miệng Golem, lòng bàn tay) — y tuyệt đối = gốc hiệu ứng
            const q = getPos?.();
            if (q) { g.position.set(q.x, q.y, q.z ?? 0); return; }
            const p = (!follow && pos) ? pos : (view?.position ?? pos);
            g.position.set(p.x, GROUND_Y + up + (view?._lift ?? 0) + (view?._hover ?? 0), (p.z ?? 0));
        };
        place();
        let age = 0;
        addAnim(g, maxLife + 1, (p, fx, dt = 0) => {
            age += dt;
            if (getPos || (follow && view && view.root?.parent)) place();   // follow: false -> đứng yên chỗ bắt đầu (người lướt đi không kéo theo)
            if (until && until()) layer.stop();
            if (age >= maxLife) layer.stop();
            if (dt > 0) layer.step(dt);
            if (layer.done()) fx.life = fx.age;   // xong -> vfx.js gỡ + giải phóng
        });
        return layer;
    };
    if (delay > 0) { setTimeout(go, delay * 1000); return null; }
    return go();
}

// ------------------------------------------------------------
// Hiệu ứng RA ĐÒN của đánh thường cho MỌI nhân vật / quái (người dùng yêu cầu 11/2026: "giống Rok với Jess")
//   cận chiến: vệt chém lưỡi liềm quanh người (Brakk / Golem: cú đấm phóng · sói: vết cào)
//   đánh xa / phép: "loé ra đòn" ở bàn tay (tự vẽ, src/vfx/pixelfx-custom/cast-flash.js)
//   màu: theo nhân vật; quái lấy theo màu classDef.color. Rok / Jessica có hiệu ứng riêng (events.js) nên bỏ qua ở đây.
// ------------------------------------------------------------
export const SWING_PIXEL = q('swingFx');
const HERO_SWING = {
    reaper: ['melee/sword-slash', 'blood'], wrestler: ['melee/thrust', 'lava'], elem_golem: null,
    priest: ['custom/cast-flash', 'holy'], mage: ['custom/cast-flash', 'fire'], archer: ['custom/cast-flash', 'cyber'],
    dancer: null, alchemist: ['custom/cast-flash', 'poison'], summoner: ['custom/cast-flash', 'leaf'],
    sylva_eagle: ['custom/cast-flash', 'gold'], elementalist: ['custom/cast-flash', 'arcane'],
};
const hexToRgb = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const rampCache = new Map();
/** Dải 8 màu tối -> màu gốc -> trắng từ 1 màu (cho quái) */
export function rampOf(hex) {
    if (rampCache.has(hex)) return rampCache.get(hex);
    const [r, g, b] = hexToRgb(hex), out = [];
    for (let i = 0; i < 8; i++) {
        const t = i / 7;
        if (t < 0.55) { const k = 0.25 + (t / 0.55) * 0.75; out.push(toHex(r * k, g * k, b * k)); }
        else { const k = (t - 0.55) / 0.45; out.push(toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k)); }
    }
    rampCache.set(hex, out);
    return out;
}
/** Gọi đúng lúc đòn đánh thường ra (khung ra đòn). member: thành viên server, def: classDefs[classId], palette: ghi đè màu */
export function autoSwingFx(view, member, def, { palette } = {}) {
    if (!SWING_PIXEL || !view || !member) return;
    const cls = member.classId;
    if (cls === 'warrior' || cls === 'assassin') return;
    if (HERO_SWING[cls] === null) return;
    let pick = HERO_SWING[cls];
    if (!pick) {
        const wolf = /wolf/.test(def?.art ?? cls) || /^sylva_(wolf|bear)/.test(cls);
        const col = rampOf(def?.color ?? member.color ?? '#94a3b8');
        pick = wolf ? ['melee/claw-swipe', null] : [def?.range === 'ranged' ? 'custom/cast-flash' : 'melee/sword-slash', col];
    }
    const [name, pal] = pick;
    spawnPixelFx(name, { view, follow: false, pos: { x: view.position.x, z: view.position.z }, palette: palette ?? pal ?? undefined, seed: (member.index ?? 0) + 3, scale: name === 'custom/cast-flash' ? 1.5 : 1 });
}

/** Hiệu ứng điểm ảnh BAY theo đường thẳng (Lốc Xoáy): from -> to trong `time` giây, xong mờ dần */
export function spawnPixelMover(name, { from, to, time = 1, height = 2.9, scale = 1, palette, seed, flip = false, lift = 0, getPos = null } = {}) {
    const mod = LIB[name];
    if (!mod) return null;
    const layer = pixelLayer(mod, { height, scale, palette, seed, flip });
    const g = layer.group;
    let age = 0;
    addAnim(g, time + 1, (p, fx, dt = 0) => {
        age += dt;
        const k = Math.min(1, age / time);
        const q = getPos?.();   // bám theo 1 điểm (VD nắm đấm Golem) nếu có
        if (q) g.position.set(q.x, q.y, q.z ?? 0);
        else g.position.set(from.x + (to.x - from.x) * k, GROUND_Y + lift, (from.z ?? 0) + ((to.z ?? 0) - (from.z ?? 0)) * k);
        if (age >= time) layer.stop();
        if (dt > 0) layer.step(dt);
        if (layer.done()) fx.life = fx.age;
    });
    return layer;
}
