// ============================================================
// CUTOUT CHARACTER VIEW — nhân vật 2D nhìn nghiêng, gắn xương kiểu Spine (cutout animation)
// ============================================================
// Nhân vật = các mảnh tranh phẳng (đầu, thân, tay, chân...) lấy từ MỘT ảnh "bảng mảnh rời" (atlas),
// mỗi mảnh gắn vào một khớp (pivot). Động tác = xoay các khớp quanh trục z (mặt phẳng 2D).
//
// Dữ liệu rig (xem characters/cutout/*.js):
//   image   : URL ảnh atlas (nền trong suốt)
//   origin  : [x, y] điểm giữa hai bàn chân trong "tư thế lắp ráp" (pixel)
//   heightPx: chiều cao nhân vật trong tư thế lắp ráp (pixel) — quy đổi sang đơn vị game bằng visual.height
//   parts   : { tên: { rect:[x,y,w,h], pivot:[x,y], pos:[x,y], angle?, parent?, z, shade? } }
//     rect  : vùng của mảnh trong atlas
//     pivot : điểm khớp TRONG atlas (vd: vai của mảnh cánh tay)
//     pos   : vị trí điểm khớp đó trong tư thế lắp ráp (cùng hệ toạ độ với origin)
//     angle : xoay mảnh (độ, ngược chiều kim đồng hồ) để về tư thế gốc (tay/chân buông thẳng)
//     z     : thứ tự vẽ (lớn hơn = gần camera hơn)
//     shade : nhân màu (0..1) — làm tối tay/chân phía xa
//     scale / flipX : phóng to-thu nhỏ / lật gương riêng mảnh đó
//     skins : { tên: {rect, pivot, angle?, scale?} } các hình thay thế nhau, skin = hình mặc định
// Nhân vật trong atlas phải nhìn sang PHẢI; nhìn trái thì lật gương.
import * as THREE from 'three';
import { CharacterView } from './CharacterView.js';
import { GROUND_Y, gameNow } from '../config.js';
import { makePalmFire, makeFireGuardian, makeFireShield } from '../vfx/fireFx.js';
import { jessicaBoltTexture } from '../vfx/jessicaFx.js';
import { makeReaperGuardian, makeReaperAura, makeDeathMarkIcon } from '../vfx/zerithFx.js';
import { makeGiantAura, makeImmuneCrown, makeBrakkBubble } from '../vfx/brakkFx.js';
import { makeWaterBubble, makeGoddessAura, makeNoteHalo, makeDanceRing, spawnManaRise } from '../vfx/nerissaFx.js';
import { makeIceBlock, makeWardDome, makeSparkAura } from '../vfx/elemFx.js';
import { makeLightShield } from '../vfx/seraphineFx.js';
import {
    spawnFootDust, makeTalismanMesh, spawnLightning,
    makeThunderAura, updateThunderAura, surgeThunderAura, spawnAuraFlame, makeEyeGlow, updateEyeGlow,
    getHexDomeTexture, getMiniShieldTexture, getWindRibbonTexture, getBoltTexture, getHolyBubbleTexture, getWingTexture, seraSprite, spawnRisingSparkles, getGuardianTexture, getWindSpiritTexture,
} from '../vfx/vfx.js';

const FADE = 0.08;
const HIT_FLASH_SECONDS = 0.07;
const LOCOMOTION_CLIP = { idle: 'idle', ready: 'ready', stunned: 'stunned', guarding: 'guard', dead: 'dead', move: 'move', cast: 'cast', fall: 'fall', victory: 'victoryIdle', channel: 'channel', beam: 'beam' };
const STILL_SPEED = 0.6; // server báo 'moving' nhưng thực tế đứng yên (VD lúc đếm ngược) -> đứng thủ thế
const TAU = Math.PI * 2;
const GIANT_SCALE = 1.25;   // Brakk dạng Khổng Lồ: cả người to thêm 25% (mảnh khổng lồ vốn đã bè hơn)
const Z_STEP = 0.02; // khoảng cách theo trục z giữa các lớp mảnh (dùng depth test để xếp lớp)

const texCache = new Map();
function loadTexture(url) {
    if (!texCache.has(url)) {
        const tex = new THREE.TextureLoader().load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        texCache.set(url, tex);
    }
    return texCache.get(url);
}

let blobTexture = null;
function getBlobTexture() {
    if (blobTexture) return blobTexture;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.5)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    blobTexture = new THREE.CanvasTexture(c);
    return blobTexture;
}

/**
 * Dựng cây mảnh từ dữ liệu rig.
 * @returns {{ root: THREE.Group, parts: Record<string, THREE.Group>, materials: THREE.Material[], skins: object }}
 */
export function buildCutout(rig, texture, unitsPerPx) {
    const imgW = rig.atlasSize[0], imgH = rig.atlasSize[1];
    const root = new THREE.Group();
    root.name = 'cutout_root';
    const parts = {};
    const materials = [];

    // Toạ độ lắp ráp (pixel, y hướng xuống) -> đơn vị game (y hướng lên, gốc ở chân)
    const toLocal = ([x, y]) => new THREE.Vector3((x - rig.origin[0]) * unitsPerPx, (rig.origin[1] - y) * unitsPerPx, 0);

    // Tạo khớp trước, nối cha-con sau (thứ tự khai báo không quan trọng)
    const skins = {};
    const makeArt = (p, z) => {
        const [x, y, w, h] = p.rect;
        const geo = new THREE.PlaneGeometry(w * unitsPerPx, h * unitsPerPx);
        const u0 = x / imgW, u1 = (x + w) / imgW;
        const v0 = 1 - (y + h) / imgH, v1 = 1 - y / imgH;
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2));

        // alphaToCoverage + MSAA: mép mảnh mịn mà vẫn ghi depth -> thứ tự lớp đúng theo z,
        // không phụ thuộc thứ tự sắp xếp vật thể trong suốt (tránh lỗi khi nhiều nhân vật chồng nhau)
        const mat = new THREE.MeshBasicMaterial({
            map: texture, alphaToCoverage: true, side: THREE.DoubleSide,
            fog: false, // sương mù của cảnh làm nhân vật bạc màu, mất chi tiết khi camera lùi xa
        });
        const shade = p.shade ?? 1;
        mat.color.setScalar(shade);
        mat.userData.baseShade = shade;
        materials.push(mat);

        const mesh = new THREE.Mesh(geo, mat);
        // Mảnh được đặt sao cho điểm pivot trong atlas trùng gốc khớp, rồi lật/phóng `scale`, xoay `angle`
        mesh.position.set((x + w / 2 - p.pivot[0]) * unitsPerPx, -(y + h / 2 - p.pivot[1]) * unitsPerPx, 0);
        const art = new THREE.Group();
        art.rotation.z = THREE.MathUtils.degToRad(p.angle ?? 0);
        const sc = p.scale ?? 1;
        const sx = sc * (p.sx ?? 1); // sx: nới rộng theo chiều ngang (mảnh vẽ hơi gầy so với ảnh mẫu)
        art.scale.set(p.flipX ? -sx : sx, sc, 1);
        art.add(mesh);
        art.position.z = z * Z_STEP;
        return art;
    };

    // Tạo khớp trước, nối cha-con sau (thứ tự khai báo không quan trọng)
    for (const [name, p] of Object.entries(rig.parts)) {
        const joint = new THREE.Group();
        joint.name = name;
        parts[name] = joint;
        if (p.rect) joint.add(makeArt(p, p.z ?? 0));
        // Mảnh có nhiều "da" thay thế nhau (bàn tay nắm/xoè/kết ấn, biểu cảm mắt...)
        if (p.skins) {
            skins[name] = {};
            for (const [skinName, sp] of Object.entries(p.skins)) {
                const art = makeArt({ shade: p.shade, ...sp }, sp.z ?? p.z ?? 0);
                art.name = `${name}:${skinName}`;
                art.visible = skinName === p.skin;
                skins[name][skinName] = art;
                joint.add(art);
            }
        }
    }
    for (const [name, p] of Object.entries(rig.parts)) {
        const joint = parts[name];
        const local = toLocal(p.pos);
        const parent = p.parent ? parts[p.parent] : null;
        if (parent) {
            const pp = toLocal(rig.parts[p.parent].pos);
            joint.position.copy(local.sub(pp));
            parent.add(joint);
        } else {
            joint.position.copy(local);
            root.add(joint);
        }
    }
    return { root, parts, materials, skins };
}

/** Đổi "da" của một mảnh (vd setSkin(skins, 'handN', 'seal')) */
export function setSkin(skins, part, name) {
    const set = skins[part];
    if (!set || !set[name]) return;
    for (const [k, art] of Object.entries(set)) art.visible = k === name;
}

export class CutoutCharacterView extends CharacterView {
    /**
     * @param {object} visual {
     *   rig, clips(parts, height) => AnimationClip[], height, anims, shadowSize,
     *   skinKeys?   : { clip: [[giây, mảnh, da], ...] }   đổi bàn tay / mắt theo clip
     *   defaultSkins?: { mảnh: da }
     *   secondary?  : { khớp: {speed, fall, gravity, sway, phase, limit, stiff, damp} }  tóc/vạt áo đung đưa
     *   blink?      : true -> tự chớp mắt (mảnh 'eye' có da 'blink')
     * }
     */
    constructor(member, classDef, isMyTeam, visual) {
        super(member, classDef, isMyTeam);
        this.def = visual;
        const rig = visual.rig;
        const height = visual.height ?? 2.9;
        const unitsPerPx = height / rig.heightPx;
        this.height = height;
        this.unitsPerPx = unitsPerPx;

        // root -> stand (đặt chân xuống đất, nghiêng theo camera) -> flip (lật trái/phải) -> mảnh
        this.stand = new THREE.Group();
        this.stand.position.y = GROUND_Y;
        this.flip = new THREE.Group();
        this.stand.add(this.flip);
        this.root.add(this.stand);

        this.texture = loadTexture(rig.image);
        const { root, parts, materials, skins } = buildCutout(rig, this.texture, unitsPerPx);
        this.flip.add(root);
        // Nhuộm màu tạm (VD Lyra dùng tạm hình Jessica cho tới khi có tranh riêng)
        if (visual.tint != null) {
            const tint = new THREE.Color(visual.tint);
            for (const m of materials) { m.color.multiply(tint); m.userData.baseColor = m.color.clone(); }
        }
        this.parts = parts;
        this.materials = materials;
        this.skins = skins;
        this._giantParts = Object.keys(skins).filter(k => skins[k].giant);   // Brakk: mảnh có dạng khổng lồ
        this.cutoutRoot = root;
        this.squashOnDeath = false;

        // Đồ cầm tay phụ (VD lá bùa trên tay xa lúc ném): bật/tắt bằng skinKeys như bàn tay ('on' / 'off')
        for (const prop of visual.props ?? []) {
            const joint = parts[prop.joint];
            if (!joint) continue;
            const mesh = prop.make();
            mesh.position.set(prop.offset?.[0] ?? 0, prop.offset?.[1] ?? 0, prop.z ?? 0.05);
            mesh.rotation.z = prop.angle ?? 0;
            mesh.material.userData.baseShade = 1;
            this.materials.push(mesh.material);
            const off = new THREE.Group();
            joint.add(mesh, off);
            this.skins[prop.name] = { on: mesh, off };
            setSkin(this.skins, prop.name, 'off');
        }
        // Dây cung vẽ bằng code (Xạ Thủ): 'pull' là "da" giả để skinKeys bật/tắt trạng thái kéo dây
        if (rig.bowString) {
            const on = new THREE.Object3D(), off = new THREE.Object3D();
            root.add(on, off);
            this.skins.pull = { on, off };
            setSkin(this.skins, 'pull', 'off');
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
            this._string = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.9, fog: false }));
            this._string.frustumCulled = false;
            root.add(this._string);
        }
        // Đẩy cả nhân vật ra trước vòng tầm đánh / bóng một chút
        root.position.z = 0.05;

        const shadowSize = visual.shadowSize ?? 1.3;
        this.shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(shadowSize, shadowSize * 0.5),
            new THREE.MeshBasicMaterial({ map: getBlobTexture(), transparent: true, depthWrite: false })
        );
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.y = GROUND_Y + 0.015;
        this.root.add(this.shadow);

        // Vòng ấn chú dưới chân khi vận chiêu
        this.magicCircle = new THREE.Mesh(
            new THREE.PlaneGeometry(2.6, 2.6),
            new THREE.MeshBasicMaterial({
                map: getMagicCircleTexture(), transparent: true, opacity: 0, depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );
        this.magicCircle.rotation.x = -Math.PI / 2;
        this.magicCircle.position.y = GROUND_Y + 0.03;
        this.magicCircle.visible = false;
        if (visual.circleTint) this.magicCircle.material.color.set(visual.circleTint);
        this.root.add(this.magicCircle);

        this.setBarHeight(GROUND_Y + height + 0.35);

        // Hào quang sấm tím khi tàng hình (Sát Thủ): quầng sau lưng + mắt phát sáng + tia sét nhỏ quanh người
        // Jessica bản 3: hào quang tàng hình vẽ bằng tranh (visual.stealthFx = jessicaFx.makeStealthAura) thay bản code
        if (visual.stealthFx) {
            this._sAura = visual.stealthFx(height);
            this._sAura.group.visible = false;
            this.root.add(this._sAura.group);
            this._auraK = 0;
            this._bigBoltTimer = 0.4;
        }
        if (visual.stealthAura && !visual.stealthFx) {
            this.aura = makeThunderAura(height);
            this.aura.visible = false;
            this.aura.position.y = 0;
            this.stand.add(this.aura); // trong 'stand' (không lật) để vòng sét dưới chân nằm đúng mặt đất
            if (parts.eye) {
                this.eyeGlow = makeEyeGlow(0.42);
                this.eyeGlow.position.z = 0.25;
                this.eyeGlow.visible = false;
                parts.eye.add(this.eyeGlow);
            }
            this._auraK = 0;
            this._boltTimer = 0;
            this._flameTimer = 0;
            this._bigBoltTimer = 0.4;
        }

        // Phù Thủy lửa: quả cầu lửa lơ lửng trên lòng bàn tay (chỉ hiện khi bàn tay đang ngửa)
        if (visual.palmFire && parts[visual.palmFire.joint]) {
            this.palmFire = makePalmFire();
            const [px, py] = visual.palmFire.offset;
            this.palmFire.group.position.set(px * unitsPerPx, -py * unitsPerPx, 0.3);
            parts[visual.palmFire.joint].add(this.palmFire.group);
        }

        this.mixer = new THREE.AnimationMixer(root);
        this.actions = {};
        visual.clips(parts, height).forEach(c => { this.actions[c.name] = this.mixer.clipAction(c); });
        this.mixer.addEventListener('finished', (e) => {
            if (this._oneShot?.action === e.action) this._oneShot.finished = true;
        });
        this._current = null;
        this._oneShot = null;
        this._locomotion = 'idle';
        this._flashTime = 0;
        this._death = 0;
        this._victory = false;
        this._intro = null;
        this._time = Math.random() * 10;
        this._blink = { next: 1.5 + Math.random() * 2.5, left: 0 };

        // Mảnh đung đưa: lưu trạng thái lò xo
        this._secondary = Object.entries(visual.secondary ?? {})
            .filter(([name]) => parts[name])
            .map(([name, cfg]) => ({ joint: parts[name], cfg, angle: 0, vel: 0 }));
        this._prevX = this.root.position.x;
        this._prevLift = 0;
        this._lift = 0; // độ cao nhân vật so với mặt đất (lúc rơi xuống đầu trận)
        this._speed = 0; // tốc độ di chuyển đang hiển thị (đơn vị/giây, đã làm mượt)
        this._prevPos = this.root.position.clone();
        this._dustTimer = 0;

        this.setLocomotion('idle');
        this._applySkins();
    }

    // ------------------------------------------------------------
    // Animation
    // ------------------------------------------------------------
    _fadeTo(action, loop) {
        action.reset();
        action.enabled = true;
        action.setEffectiveWeight(1);
        if (loop) action.setLoop(THREE.LoopRepeat, Infinity);
        else { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
        const prev = this._oneShot?.action ?? this._current;
        if (prev && prev !== action) action.crossFadeFrom(prev, FADE, false);
        action.play();
        // Mọi động tác khác còn đang chạy (kể cả động tác một-lần đã xong nhưng còn "giữ" tư thế cuối)
        // phải mờ dần về 0 — nếu không chúng cộng dồn vào tư thế mới và làm méo dáng đứng mãi mãi.
        for (const other of Object.values(this.actions)) {
            if (other !== action && other !== prev && other.isScheduled() && other.getEffectiveWeight() > 0) other.fadeOut(FADE);
        }
    }

    _clipFor(state) {
        let name = LOCOMOTION_CLIP[state] ?? (state?.startsWith('dance') && this.actions[state] ? state : 'idle');
        // Di chuyển: chậm thì chạy (khớp bước chân theo tốc độ), nhanh thì lướt kiểu ninja
        const loco = this.def.locomotion;
        if (state === 'move' && this._speed < STILL_SPEED) name = this.actions.ready ? 'ready' : 'idle';
        else if (state === 'move' && loco) name = this._speed > loco.dashSpeed && this.actions[loco.dashClip] ? loco.dashClip : loco.runClip;
        if (this._victory && (state === 'idle' || state === 'ready')) name = 'victoryIdle';
        return this.actions[name] ?? this.actions.idle;
    }

    setLocomotion(state) {
        this._locomotion = state;
        // Động tác "nhẹ" (trúng đòn) nhường cho chạy / vận chiêu / chết
        if (this._oneShot?.soft && state !== 'idle') this._interruptOneShot();
        if (this._oneShot || this._intro) return;
        const action = this._clipFor(state);
        if (!action || action === this._current) return;
        this._fadeTo(action, true);
        this._current = action;
    }

    /** Đang diễn động tác không được ngắt (động tác "nhẹ" như trúng đòn thì không tính) */
    get isBusy() { return !!this._intro || (!!this._oneShot && !this._oneShot.soft); }

    /** hold = lặp động tác cho tới khi có động tác khác (VD gồng Thần Tiễn) */
    playAction(name, { onHit, onComplete, soft = false, hold = false } = {}) {
        const cfg = this.def.anims?.[name];
        const action = this.actions[cfg?.clip ?? name];
        if (!action) return super.playAction(name, { onHit, onComplete });
        this._interruptOneShot();
        this._fadeTo(action, hold);
        this._oneShot = { action, hitTime: cfg?.hitTime ?? 0, onHit, onComplete, hitFired: !onHit, soft, hold };
        return true;
    }

    /** Thả động tác đang giữ (hold) tên `name` -> về động tác theo trạng thái (VD Elarion thôi chưởng SolarBeam) */
    releaseHold(name) {
        const s = this._oneShot;
        if (s && s.action === this.actions[this.def.anims?.[name]?.clip ?? name]) this._interruptOneShot();
    }

    _fireHit() {
        const s = this._oneShot;
        if (s && !s.hitFired) { s.hitFired = true; s.onHit?.(); }
    }

    _finishOneShot() {
        const s = this._oneShot;
        if (!s) return;
        this._fireHit();
        this._oneShot = null;
        s.onComplete?.(); // có thể phát ngay động tác kế tiếp (VD biến mất -> xuất hiện); _fadeTo sẽ làm mờ động tác cũ
        if (!this._oneShot) {
            const prev = s.action;
            this._current = null;
            this.setLocomotion(this._locomotion);
            if (this._current && prev !== this._current) this._current.crossFadeFrom(prev, FADE * 1.5, false);
        }
    }

    _interruptOneShot() {
        for (let guard = 0; this._oneShot && guard < 5; guard++) this._finishOneShot();
    }

    // ------------------------------------------------------------
    // Chuỗi vào trận: rơi từ trên cao (lộn nhào + vệt lướt) -> đáp đất (bụi + rung) -> thở chờ
    // ------------------------------------------------------------
    /**
     * @param {{ delay?: number, height?: number, duration?: number, onStart?: Function, onLand?: Function }} opts
     */
    playIntro({ delay = 0, height = 9, duration = 0.42, onStart, onLand } = {}) {
        if (!this.actions.fall || !this.actions.land) { onLand?.(this); return false; }
        this._interruptOneShot();
        this._intro = { t: -delay, height, duration, onStart, onLand, started: false };
        this.stand.visible = false;
        this.shadow.visible = false;
        return true;
    }

    _updateIntro(dt) {
        const it = this._intro;
        it.t += dt;
        if (it.t < 0) return;
        if (!it.started) {
            it.started = true;
            this.stand.visible = true;
            this.shadow.visible = true;
            this._fadeTo(this.actions.fall, true);
            this._current = this.actions.fall;
            it.onStart?.(this);
        }
        const p = Math.min(1, it.t / it.duration);
        this._lift = it.height * (1 - p * p); // rơi nhanh dần
        // Lộn một vòng về phía trước rồi tiếp đất thẳng người
        const spin = 1 - Math.pow(1 - p, 2.2);
        if (this.parts.hips) this.parts.hips.rotation.z = -TAU * spin;
        if (p >= 1) {
            this._lift = 0;
            if (this.parts.hips) this.parts.hips.rotation.z = 0;
            this._intro = null;
            // _current vẫn là 'fall' để 'land' hoà mờ từ nó (nếu không, 'fall' chạy mãi và cộng dồn vào mọi tư thế)
            this.playAction('land');
            it.onLand?.(this);
        }
    }

    /** Thắng trận: nhảy ăn mừng rồi giữ tư thế giơ phi tiêu */
    celebrate() {
        if (!this.member.alive) return;
        this._victory = true;
        if (!this.playAction('victory')) this.setLocomotion('idle');
    }

    /** Trúng đòn: giật người (không chặn đòn đánh / kỹ năng tiếp theo) */
    playHurt() {
        if (this.isBusy || this._oneShot || !this.member.alive || !this.actions.hurt) return;
        if (this._locomotion !== 'idle' && this._locomotion !== 'ready') return; // đang chạy / vận chiêu thì chỉ nháy sáng
        this.playAction('hurt', { soft: true });
    }

    // ------------------------------------------------------------
    // Đổi hình bàn tay / mắt + chớp mắt
    // ------------------------------------------------------------
    _activeClip() {
        const a = this._oneShot?.action ?? this._current;
        return a ? { name: a.getClip().name, time: a.time } : { name: 'idle', time: 0 };
    }

    _applySkins() {
        if (!Object.keys(this.skins).length) return;
        const want = { ...(this.def.defaultSkins ?? {}) };
        const { name, time } = this._activeClip();
        for (const [t, part, skin] of this.def.skinKeys?.[name] ?? []) if (t <= time) want[part] = skin;
        if (this.def.blink && want.eye === 'open' && this._blink.left > 0) want.eye = 'blink';
        // Hiệu ứng đang có -> đổi da (VD Golem: Hào Quang Sét -> nắm đấm sét)
        if (this.def.effectSkins) {
            const now = gameNow();
            for (const [eff, map] of Object.entries(this.def.effectSkins)) {
                if (this.member.statusEffects?.some(e => e.type === eff && e.endTime > now)) Object.assign(want, map);
            }
        }
        // Brakk — Thần Lực Khổng Lồ: mọi mảnh có da 'giant' đổi sang dạng khổng lồ (cùng bộ xương / động tác)
        // (hết khổng lồ: trả mọi mảnh về 'normal' — bàn tay / mắt theo da của động tác)
        for (const part of this._giantParts ?? []) want[part] = this._giantOn ? 'giant' : (want[part] ?? 'normal');
        for (const [part, skin] of Object.entries(want)) setSkin(this.skins, part, skin);
    }

    _updateBlink(dt) {
        const b = this._blink;
        if (b.left > 0) { b.left -= dt; return; }
        b.next -= dt;
        if (b.next <= 0) {
            b.left = 0.11;
            b.next = 2.2 + Math.random() * 3; // thỉnh thoảng chớp 2 lần liền
            if (Math.random() < 0.2) b.next = 0.25;
        }
    }

    // ------------------------------------------------------------
    // Tóc tết / ruy băng / vạt áo: lò xo theo quán tính
    // ------------------------------------------------------------
    _updateSecondary(dt) {
        if (!this._secondary.length || dt <= 0) return;
        const vx = (this.root.position.x - this._prevX) / dt;
        const vy = (this._lift - this._prevLift) / dt;
        this._prevX = this.root.position.x;
        this._prevLift = this._lift;
        const forward = THREE.MathUtils.clamp(vx * (this.facingLeft ? -1 : 1), -30, 30);
        const falling = Math.max(0, -vy);
        const h = Math.min(dt, 1 / 30);
        for (const s of this._secondary) {
            const c = s.cfg;
            // Góc của các khớp cha (so với thân) -> bù lại để mảnh luôn rủ xuống theo trọng lực
            let parentAngle = 0;
            for (let o = s.joint.parent; o && o !== this.cutoutRoot; o = o.parent) parentAngle += o.rotation.z;
            let target = -(c.gravity ?? 0.7) * wrapAngle(parentAngle)
                + (c.speed ?? 0) * Math.abs(forward)
                + (c.fall ?? 0) * falling
                + (c.sway ?? 0) * Math.sin(this._time * 2.1 + (c.phase ?? 0));
            if (c.limit) target = THREE.MathUtils.clamp(target, c.limit[0], c.limit[1]);
            s.vel += (target - s.angle) * (c.stiff ?? 50) * h;
            s.vel *= Math.exp(-(c.damp ?? 7) * h);
            s.angle += s.vel * h;
            s.joint.rotation.z = s.angle;
        }
    }

    /** Mảnh lơ lửng nhấp nhô lên xuống (VD Sách Nguyên Tố của Elarion) — visual.floatParts: { khớp: {amp, period} } */
    _updateFloat() {
        const fp = this.def.floatParts;
        if (!fp) return;
        for (const [name, c] of Object.entries(fp)) {
            const j = this.parts[name];
            if (!j) continue;
            j.userData.baseY ??= j.position.y;
            j.position.y = j.userData.baseY + Math.sin(this._time * Math.PI * 2 / (c.period ?? 2)) * (c.amp ?? 0.02) * this.height;
        }
    }

    // ------------------------------------------------------------
    // Tốc độ thật trên màn hình -> chọn chạy / lướt, chỉnh nhịp bước chân cho khỏi "trượt"
    // ------------------------------------------------------------
    _updateLocomotion(dt) {
        if (dt <= 0) return;
        const p = this.root.position;
        const v = Math.hypot(p.x - this._prevPos.x, p.z - this._prevPos.z) / dt;
        this._prevPos.copy(p);
        this._speed += (Math.min(v, 40) - this._speed) * Math.min(1, dt * 8);

        const loco = this.def.locomotion;
        if (this._oneShot || this._intro || this._locomotion !== 'move') {
            if (this._current) this._current.timeScale = 1;
            return;
        }
        const want = this._clipFor('move');
        if (want && want !== this._current) {
            this._fadeTo(want, true);
            this._current = want;
        }
        if (!loco) return;
        if (want === this.actions[loco.runClip]) {
            want.timeScale = THREE.MathUtils.clamp(this._speed / loco.runSpeed, 0.6, 1.6);
        } else if (want === this.actions[loco.dashClip]) {
            want.timeScale = 1;
            // Lướt: bụi bay sau gót
            this._dustTimer -= dt;
            if (this._dustTimer <= 0 && this.member.alive) {
                this._dustTimer = 0.09;
                spawnFootDust(this.root.position, this.facingLeft ? 1 : -1);
            }
        }
    }

    // ------------------------------------------------------------
    // Hiển thị
    // ------------------------------------------------------------
    /** Đang tàng hình? (đọc hiệu ứng từ server theo đồng hồ trận) */
    get isStealthed() {
        const now = gameNow();
        return !!this.member.alive && !!this.member.statusEffects?.some(e => e.type === 'stealth' && e.endTime > now);
    }

    _updateAura(dt) {
        if (this._sAura) {
            const on = this.isStealthed && this.root.visible;
            this._auraK += ((on ? 1 : 0) - this._auraK) * Math.min(1, dt * 8);
            const k = this._auraK;
            this._sAura.group.visible = k > 0.02;
            if (k <= 0.02) return;
            this._sAura.update(dt, k, this._time, this._lift ?? 0);
            if (on) {
                this._bigBoltTimer -= dt;
                if (this._bigBoltTimer <= 0) { this._bigBoltTimer = 0.5 + Math.random() * 0.5; this._sAura.surge(); }
            }
            return;
        }
        if (!this.aura) return;
        const on = this.isStealthed && this.root.visible;
        this._auraK += ((on ? 1 : 0) - this._auraK) * Math.min(1, dt * 8);
        const k = this._auraK;
        const show = k > 0.02;
        this.aura.visible = show;
        if (this.eyeGlow) this.eyeGlow.visible = show;
        if (!show) return;
        updateThunderAura(this.aura, this._time, k, dt);
        if (this.eyeGlow) updateEyeGlow(this.eyeGlow, this._time, k);
        if (!on) return;
        const p = this.root.position, h = this.height, base = GROUND_Y + this._lift;
        // lưỡi lửa sét bốc lên liên tục
        this._flameTimer -= dt;
        while (this._flameTimer <= 0) {
            this._flameTimer += 0.025;
            spawnAuraFlame({ x: p.x, z: p.z }, h);
        }
        // tia sét lách tách quanh người (nhiều, dày)
        this._boltTimer -= dt;
        while (this._boltTimer <= 0) {
            this._boltTimer += 0.02 + Math.random() * 0.03;
            const cy = base + h * (0.15 + Math.random() * 0.75);
            const a = Math.random() * Math.PI * 2;
            const r0 = 0.35 + Math.random() * 0.3, r1 = r0 + 0.45 + Math.random() * 0.5;
            const from = { x: p.x + Math.cos(a) * r0, y: cy + Math.sin(a) * r0 * 0.9, z: p.z };
            const to = { x: p.x + Math.cos(a + 0.6) * r1, y: cy + Math.sin(a + 0.6) * r1 * 0.9, z: p.z };
            spawnLightning(from, to, { width: 0.38 + Math.random() * 0.2, life: 0.12 + Math.random() * 0.06 });
        }
        // nhịp lớn: một tia sét dài từ đất vọt lên quá đầu + hào quang bùng sáng
        this._bigBoltTimer -= dt;
        if (this._bigBoltTimer <= 0) {
            this._bigBoltTimer = 0.45 + Math.random() * 0.5;
            const side = Math.random() < 0.5 ? -1 : 1;
            spawnLightning(
                { x: p.x + side * (0.3 + Math.random() * 0.3), y: base, z: p.z },
                { x: p.x + side * (0.1 + Math.random() * 0.4), y: base + h * 1.2, z: p.z },
                { width: 0.75, life: 0.2 },
            );
            surgeThunderAura(this.aura);
        }
    }

    // ------------------------------------------------------------
    // Hiệu ứng trạng thái chung: choáng (sao xoay trên đầu), Thành Trì (vòng khiên vàng dưới chân)
    // ------------------------------------------------------------
    _updateStatusFx(dt) {
        const now = gameNow();
        const effs = this.member.statusEffects ?? [];
        const alive = this.member.alive;
        // đang bay vì bị Đẩy Khiên thì chưa hiện sao choáng (đáp đất mới choáng)
        const stunned = alive && effs.some(e => e.type === 'stun' && e.endTime > now) && !effs.some(e => e.type === 'knocked' && e.endTime > now);
        const fort = alive && effs.some(e => e.type === 'fortress' && e.endTime > now);
        // Dựng Khiên: Thần Hộ Vệ trên đầu + vòm lục giác (độ sáng theo máu khiên còn lại)
        const guardEf = alive ? effs.find(e => e.type === 'guard' && e.endTime > now) : null;
        const guard = !!guardEf;
        this._guardPulse = Math.max(0, (this._guardPulse ?? 0) - dt * 3);
        this._guardFrac = guardEf?.maxHp ? Math.max(0, guardEf.hp / guardEf.maxHp) : 1;
        this._updateIronGuard(dt, guard);
        // Thần Phong Giáng Thế (Lyra): bay lơ lửng + Vệ Thần Gió bên cạnh; gồng Thần Tiễn -> Vệ Thần cùng kéo căng cung
        const wind = alive && effs.some(e => e.type === 'windspirit' && e.endTime > now);
        const charging = alive && this.member.state === 'casting' && this.classDef?.skills?.[this.member.castingSkillId]?.type === 'charged_shot';
        // Thánh Niệm (Tu Sĩ): bay lên niệm + Hộ vệ ánh sáng sau lưng
        const praying = alive && effs.some(e => e.type === 'praying' && e.endTime > now);
        // Đêm Tử Thần (Zerith): bay lơ lửng + Hộ Vệ Thần Chết sau lưng + hào quang đỏ thẫm
        const night = alive && effs.some(e => e.type === 'reaper_form' && e.endTime > now);
        this._updateWindSpirit(dt, wind || praying || night, charging);
        this._updateReaperNight(dt, night);
        this._updateReaperGhost(dt);
        // Brakk: dạng Khổng Lồ (to dần + hào quang rồng lửa, 5s đầu có vương miện miễn khống chế) + vòm khiên vảy rồng
        if (this._giantParts.length) {
            const giantEf = alive ? effs.find(e => e.type === 'giant_form' && e.endTime > now) : null;
            this._updateGiant(dt, giantEf, now);
            this._updateBrakkShield(dt, alive ? effs.find(e => e.type === 'brakk_shield' && e.endTime > now && e.hp > 0) : null);
            this._updateLoneDragon(dt, alive && effs.some(e => e.type === 'lone_dragon' && e.endTime > now));
        }
        // Thủy Vũ (Nerissa): giáp nước (bong bóng) · hào quang Thủy Thần · nốt nhạc bay vòng · MP bay lên khi được Sóng Triều
        this._updateWaterFx(dt, alive ? effs : [], now);
        // Tam Nguyên (Elarion): đóng băng (lớp băng phủ người) · Giáp Băng Sét · Hào Quang Sét của Golem
        this._updateElemFx(dt, alive ? effs : [], now);
        // Ấn Tử (thiên phú Phán Quyết Tử Thần của Zerith) trên đầu mục tiêu
        this._updateDeathMark(dt, alive && effs.some(e => e.type === 'death_mark' && e.endTime > now));
        this._updatePrayGuardian(dt, praying);
        // Phù Thủy lửa: cầu lửa trên tay + Hộ Vệ Thần Lửa (Hỏa Thần Giáng Lâm)
        if (this.palmFire) {
            const show = alive && this.skins.handF?.palm?.visible !== false;
            this.palmFire.group.visible = show;
            if (show) this.palmFire.update(dt);
            const ward = alive && effs.some(e => e.type === 'fire_ward' && e.endTime > now && e.hp > 0);   // Giáp Lửa (thiên phú 2)
            this._updateFireGuardian(dt, alive && effs.some(e => e.type === 'fire_god' && e.endTime > now), ward);
        }
        this._updatePrayLoop(praying);
        // Khiên Ánh Sáng (bong bóng; đang niệm thì mọc cánh) + hào quang Thánh Niệm của đồng đội
        const holy = alive ? effs.find(e => e.type === 'holy_shield' && e.endTime > now && e.hp > 0) : null;
        this._updateHolyShield(dt, holy);
        this._updateBlessAura(dt, alive && effs.some(e => e.type === 'pray_blessing' && e.endTime > now));
        // Đồng đội được Dựng Khiên của Chiến Binh bảo hộ (+20% thủ): 3 khiên nhỏ bay vòng quanh người
        const aura = alive && !guard && effs.some(e => e.type === 'guard_aura' && e.endTime > now);
        this._updateOrbitShields(dt, aura);
        // Gió dẫn đường (Thần Phong Giáng Thế của Lyra, +chính xác): vệt gió ngọc bay vòng quanh người
        this._updateWindAura(dt, alive && effs.some(e => e.type === 'wind_blessing' && e.endTime > now));
        // Sấm phù trợ (Tàng Hình của Jessica, +né tránh): tia sét tím nháy quanh người
        this._updateThunderAura(dt, alive && effs.some(e => e.type === 'thunder_blessing' && e.endTime > now));
        if (stunned && !this._stars) {
            this._stars = new THREE.Group();
            const tex = getStarTexture();
            for (let i = 0; i < 4; i++) {
                const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
                s.scale.set(0.38, 0.38, 1);
                this._stars.add(s);
            }
            this.root.add(this._stars);
        }
        if (this._stars) {
            this._stars.visible = stunned;
            if (stunned) {
                this._stars.position.set(0, GROUND_Y + this.height + 0.1, 0.3);
                this._stars.children.forEach((s, i) => {
                    const a = this._time * 5 + (i / 4) * Math.PI * 2;
                    s.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.12, Math.sin(a) * 0.3);
                });
            }
        }
        if (fort && !this._fortRing) {
            this._fortRing = new THREE.Mesh(
                new THREE.PlaneGeometry(2.2, 2.2),
                new THREE.MeshBasicMaterial({ map: getFortressTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
            );
            this._fortRing.rotation.x = -Math.PI / 2;
            this._fortRing.position.y = GROUND_Y + 0.04;
            this.root.add(this._fortRing);
        }
        if (this._fortRing) {
            this._fortRing.visible = fort;
            if (fort) {
                this._fortRing.rotation.z += dt * 0.9;
                this._fortRing.material.opacity = 0.65 + 0.25 * Math.sin(this._time * 4);
            }
        }
    }

    /**
     * AURA THIẾT VỆ (Dựng Khiên): vòm lục giác vàng lớn bao quanh người + vòng ấn dưới đất + đốm sáng bay lên.
     * Mờ vào / mờ ra theo trạng thái guard; trúng đòn thì cả vòm loé sáng (onGuardHit).
     */
    _updateIronGuard(dt, on) {
        // Rok bản 3: KHIÊN THẦN vẽ bằng tranh (visual.guardFx = rokFx.makeDivineShield) thay Thần Hộ Vệ + vòm lục giác
        if (this.def.guardFx) {
            if (!this._guardFx && !on) return;
            this._guardFx ??= this._makeGuardFx();
            this._guardFx.update(dt, { on, frac: this._guardFrac ?? 1, dir: this.facingLeft ? -1 : 1 });
            if (on) {
                this._guardSpark = (this._guardSpark ?? 0) - dt;
                if (this._guardSpark <= 0) { this._guardSpark = 0.5; spawnRisingSparkles(this.root.position, { count: 3, color: 0xffd36b, radius: 1.3 }); }
            }
            return;
        }
        if (on && !this._ironDome) {
            const g = new THREE.Group();
            const domeMat = new THREE.MeshBasicMaterial({ map: getHexDomeTexture(), transparent: true, depthWrite: false,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, color: 0xd9a33a, opacity: 0 });
            const dome = new THREE.Mesh(new THREE.SphereGeometry(1.85, 40, 16, 0, TAU, 0, Math.PI / 2), domeMat);
            dome.scale.set(1, 1.35, 0.75);
            g.add(dome);
            const ring = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: getFortressTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
            g.add(ring);
            g.position.y = GROUND_Y;
            this.root.add(g);
            // THẦN HỘ VỆ: linh ảnh vị thần cầm khiên lớn hiện phía trên-sau Rok (lớp thường + lớp cộng sáng)
            const deity = new THREE.Group();
            const mkD = (additive) => new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.5), new THREE.MeshBasicMaterial({
                map: getGuardianTexture(), transparent: true, depthWrite: false, fog: false, opacity: 0,
                blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, color: additive ? 0xffd27a : 0xffffff }));
            const dBase = mkD(false), dGlow = mkD(true);
            dGlow.scale.setScalar(1.04); dGlow.position.z = 0.01;
            deity.add(dBase, dGlow);
            deity.position.set(-0.15, GROUND_Y + this.height + 0.35, -0.6);
            this.stand.add(deity);
            this._ironDome = { group: g, dome, ring, deity, dBase, dGlow, k: 0, spark: 0 };
        }
        const D = this._ironDome;
        if (!D) return;
        D.k += ((on ? 1 : 0) - D.k) * Math.min(1, dt * (on ? 5 : 9));
        D.group.visible = D.deity.visible = D.k > 0.02;
        if (!D.group.visible) return;
        const pulse = this._guardPulse ?? 0;
        const frac = 0.35 + 0.65 * (this._guardFrac ?? 1); // khiên càng mất máu càng mờ
        D.dome.material.opacity = (0.42 + 0.12 * Math.sin(this._time * 3) + 0.2 * pulse) * D.k * frac;
        // thần hộ vệ: bay lên từ người Rok, lơ lửng nhẹ, loé sáng khi khiên đỡ đòn / phát nổ
        const rise = 1 - Math.pow(1 - D.k, 2);
        D.deity.position.y = GROUND_Y + this.height * (0.6 + 0.4 * rise) + 1.35 + Math.sin(this._time * 2) * 0.06;
        D.deity.scale.setScalar(0.7 + 0.3 * rise + 0.05 * pulse);
        D.dBase.material.opacity = 0.88 * D.k;
        D.dGlow.material.opacity = (0.14 + 0.06 * Math.sin(this._time * 4) + 0.25 * pulse) * D.k;
        D.dome.material.map.offset.x = (this._time * 0.05) % 1;
        const grow = 0.75 + 0.25 * D.k;
        D.group.scale.set(grow * (1 + 0.04 * pulse), grow * (1 + 0.04 * pulse), grow);
        D.ring.material.opacity = 0.8 * D.k;
        D.ring.rotation.z -= dt * 0.6;
        if (on) {
            D.spark -= dt;
            if (D.spark <= 0) { D.spark = 0.35; spawnRisingSparkles(this.root.position, { count: 4, color: 0xffd36b, radius: 1.3 }); }
        }
    }

    _updateWindSpirit(dt, on, charging) {
        this._hover = (this._hover ?? 0) + ((on ? 0.75 : 0) - (this._hover ?? 0)) * Math.min(1, dt * 7); // bay lên ~0.5s (khớp lock của server)
        // thanh máu bay lên theo (không đè lên đầu lúc lơ lửng)
        if (Math.abs(this._hover - (this._barHover ?? 0)) > 0.01) { this._barHover = this._hover; this.setBarHeight(GROUND_Y + this.height + 0.35 + this._hover); }
        on = on && this.member.statusEffects?.some(e => e.type === 'windspirit' && e.endTime > gameNow()); // Vệ Thần Gió chỉ khi có windspirit
        // Lyra bản 3: Vệ Thần Gió + vòng gió dưới chân vẽ bằng tranh (visual.windFx = lyraFx.makeWindSpirit) thay bản canvas
        if (this.def.windFx) {
            if (!this._windFx && !on) return;
            if (!this._windFx) {
                this._windFx = this.def.windFx(this.height);
                this.flip.add(this._windFx.group);
                this.root.add(this._windFx.ground);
            }
            this._windFx.update(dt, { on, charging, lift: this._hover ?? 0, time: this._time });
            return;
        }
        if (on && !this._wind) {
            const g = new THREE.Group();
            const mk = (drawn, additive) => new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.3), new THREE.MeshBasicMaterial({
                map: getWindSpiritTexture(drawn), transparent: true, depthWrite: false, fog: false, opacity: 0,
                blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
            const relaxed = mk(false, true), drawn = mk(true, true);
            g.add(relaxed, drawn);
            g.position.set(-0.9, GROUND_Y + this.height * 0.75, -0.35); // sau lưng, cao hơn Lyra một chút
            this.flip.add(g);
            // xoáy gió dưới chân (đang bay)
            const ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: getHexDomeTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: 0x5eead4, opacity: 0 }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = GROUND_Y + 0.05;
            this.root.add(ring);
            this._wind = { g, relaxed, drawn, ring, k: 0, c: 0 };
        }
        const W = this._wind;
        if (!W) return;
        W.k += ((on ? 1 : 0) - W.k) * Math.min(1, dt * 5);
        W.c += ((charging ? 1 : 0) - W.c) * Math.min(1, dt * 4);
        W.g.visible = W.ring.visible = W.k > 0.02;
        if (!W.g.visible) return;
        W.g.position.y = GROUND_Y + this.height * 0.75 + (this._hover ?? 0) + Math.sin(this._time * 2.2) * 0.08;
        W.g.scale.setScalar(0.8 + 0.2 * W.k + 0.08 * W.c);
        W.relaxed.material.opacity = 0.8 * W.k * (1 - W.c);
        W.drawn.material.opacity = 0.9 * W.k * W.c;
        W.ring.material.opacity = 0.5 * W.k;
        W.ring.rotation.z += dt * 2.5;
    }

    /** Niệm: giữ động tác 'pray' suốt lúc niệm (sau mỗi lần hồi máu / khiên thì quay lại niệm); hết niệm thì thả */
    _updatePrayLoop(praying) {
        if (!this.actions.pray) return;
        const s = this._oneShot;
        if (praying) {
            if (!s && !this._intro) this.playAction('pray', { hold: true });
        } else if (s?.hold && s.action === this.actions.pray) {
            this._interruptOneShot();
        }
    }

    /** Hộ vệ ánh sáng: tu sĩ thiên thần trong suốt chắp tay niệm sau lưng + cột sáng mờ */
    _updatePrayGuardian(dt, on) {
        // Seraphine bản 3: Hộ Vệ Thiên Sứ + vòng thánh vẽ bằng tranh (visual.prayFx = seraphineFx.makeSeraphGuardian)
        if (this.def.prayFx) {
            if (!this._prayFx && !on) return;
            if (!this._prayFx) {
                this._prayFx = this.def.prayFx(this.height);
                this.flip.add(this._prayFx.group);
                this.root.add(this._prayFx.ground);
            }
            this._prayFx.update(dt, { on, lift: this._hover ?? 0, time: this._time });
            return;
        }
        if (on && !this._prayG) {
            const g = new THREE.Group();
            const body = seraSprite('guardian', this.height * 1.25, { opacity: 0 });
            g.add(body);
            g.position.set(-1.05, GROUND_Y + this.height * 0.62, -0.4);
            this.flip.add(g);
            const ring = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: getFortressTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: 0xfacc15, opacity: 0 }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = GROUND_Y + 0.05;
            this.root.add(ring);
            this._prayG = { g, body, ring, k: 0 };
        }
        const P = this._prayG;
        if (!P) return;
        P.k += ((on ? 1 : 0) - P.k) * Math.min(1, dt * 4);
        P.g.visible = P.ring.visible = P.k > 0.02;
        if (!P.g.visible) return;
        P.g.position.y = GROUND_Y + this.height * 0.62 + (this._hover ?? 0) + Math.sin(this._time * 1.6) * 0.1;
        P.body.material.opacity = 0.62 * P.k * (0.85 + 0.15 * Math.sin(this._time * 3));
        P.ring.material.opacity = 0.55 * P.k;
        P.ring.rotation.z += dt * 1.2;
    }

    /** Khiên Ánh Sáng: bong bóng vàng bao quanh người; khiên lúc niệm có thêm đôi cánh. Mờ dần theo máu khiên còn lại */
    _updateHolyShield(dt, ef) {
        // Seraphine bản 3: bong bóng khiên + đôi cánh vẽ bằng tranh (art/seraphine/fx2) — trên MỌI đồng đội được che
        if (ef && !this._holyFx) { this._holyFx = makeLightShield(this.height); this.root.add(this._holyFx.group); }
        if (this._holyFx) {
            const L = this._holyFx;
            L.k = (L.k ?? 0) + ((ef ? 1 : 0) - (L.k ?? 0)) * Math.min(1, dt * 6);
            L.w = (L.w ?? 0) + ((ef?.winged ? 1 : 0) - (L.w ?? 0)) * Math.min(1, dt * 5);
            const frac = ef?.maxHp ? Math.max(0.25, ef.hp / ef.maxHp) : 0.5;
            L.update(dt, { k: L.k, w: L.w, frac, lift: (this._hover ?? 0) + (this._lift ?? 0), time: this._time });
            return;
        }
        if (ef && !this._holy) {
            const g = new THREE.Group();
            const bubble = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.9), new THREE.MeshBasicMaterial({ map: getHolyBubbleTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }));
            bubble.userData.sharedTexture = true;
            const wingMat = () => new THREE.MeshBasicMaterial({ map: getWingTexture(), transparent: true, depthWrite: false, fog: false, opacity: 0, side: THREE.DoubleSide });
            const wl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), wingMat());
            const wr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), wingMat());
            wl.userData.sharedTexture = wr.userData.sharedTexture = true;
            wl.scale.x = -1;
            g.add(wl, wr, bubble);
            this.root.add(g);
            this._holy = { g, bubble, wl, wr, k: 0, w: 0 };
        }
        const H = this._holy;
        if (!H) return;
        H.k += ((ef ? 1 : 0) - H.k) * Math.min(1, dt * 6);
        H.w += ((ef?.winged ? 1 : 0) - H.w) * Math.min(1, dt * 5);
        H.g.visible = H.k > 0.02;
        if (!H.g.visible) return;
        const frac = ef?.maxHp ? Math.max(0.25, ef.hp / ef.maxHp) : 0.5;
        const lift = this._hover ?? 0;
        H.g.position.set(0, GROUND_Y + this.height * 0.48 + lift, 0.45);
        H.bubble.material.opacity = H.k * (0.55 + 0.35 * frac) * (0.9 + 0.1 * Math.sin(this._time * 4));
        const flap = Math.sin(this._time * 5) * 0.18;
        H.wl.position.set(-0.75, 0.35, -0.6); H.wr.position.set(0.75, 0.35, -0.6);
        H.wl.rotation.z = 0.25 + flap; H.wr.rotation.z = -0.25 - flap;
        H.wl.material.opacity = H.wr.material.opacity = H.k * H.w * 0.95;
        const sc = 0.6 + 0.4 * H.w;
        H.wl.scale.set(-sc, sc, 1); H.wr.scale.set(sc, sc, 1);
    }

    /** Hào quang Thánh Niệm (đồng đội được Tu Sĩ buff sát thương): vòng sáng vàng dưới chân + đốm sáng bay lên */
    _updateBlessAura(dt, on) {
        if (on && !this._bless) {
            const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: getFortressTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: 0xfde047, opacity: 0 }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = GROUND_Y + 0.06;
            this.root.add(ring);
            this._bless = { ring, k: 0, t: 0 };
        }
        const B = this._bless;
        if (!B) return;
        B.k += ((on ? 1 : 0) - B.k) * Math.min(1, dt * 5);
        B.ring.visible = B.k > 0.02;
        if (!B.ring.visible) return;
        B.ring.material.opacity = 0.6 * B.k * (0.8 + 0.2 * Math.sin(this._time * 5));
        B.ring.rotation.z -= dt * 1.5;
        if (on && (B.t -= dt) <= 0) { B.t = 0.6; spawnRisingSparkles(this.position, { count: 3, color: 0xfde68a, radius: 0.6 }); }
    }

    /** Dây cung: nối 2 chốt cung; đang kéo ('pull' on) -> gấp về điểm kẹp của tay gần + mũi tên đặt trên dây */
    _updateBowString() {
        const bs = this.def.rig.bowString;
        if (!bs || !this._string) return;
        const u = this.unitsPerPx, root = this.cutoutRoot;
        root.updateMatrixWorld(true);
        const toRoot = (joint, [x, y]) => root.worldToLocal(this.parts[joint].localToWorld(new THREE.Vector3(x * u, -y * u, 0)));
        const a = toRoot(bs.joint, bs.tips[0]), b = toRoot(bs.joint, bs.tips[1]);
        const pulling = this.skins.pull?.on.visible;
        const grip = toRoot(bs.joint, [0, 0]);
        let mid = a.clone().lerp(b, 0.5);
        if (pulling) mid = toRoot(bs.pullJoint, bs.pull);
        const z = grip.z + 0.03;
        const pos = this._string.geometry.attributes.position;
        pos.setXYZ(0, a.x, a.y, z); pos.setXYZ(1, mid.x, mid.y, z); pos.setXYZ(2, b.x, b.y, z);
        pos.needsUpdate = true;
        const arrow = this.parts[bs.arrow];
        if (arrow) {
            arrow.visible = !!pulling;
            if (pulling) {
                arrow.position.set(mid.x, mid.y, 0);
                arrow.rotation.set(0, 0, Math.atan2(grip.y - mid.y, grip.x - mid.x));
            }
        }
    }

    /** Vị trí thế giới của Vệ Thần Gió (để bắn tên ra), null nếu không có */
    /** Hộ Vệ Thần Lửa: hiện khi có Hỏa Thần, bay sau lưng Ignar */
    _updateFireGuardian(dt, on, ward = false) {
        if (on && !this.fireGuardian) {
            this.fireGuardian = makeFireGuardian();
            this.root.add(this.fireGuardian.group);
            this.fireGuardian.roar();
        }
        // Khiên Lửa riêng của Ignar (+M.DEF, kháng khống chế): khi Hỏa Thần giáng lâm hoặc Giáp Lửa (thiên phú 2)
        const shield = on || ward;
        if (shield && !this.fireShield) { this.fireShield = makeFireShield(); this.root.add(this.fireShield.group); }
        if (this.fireShield && !shield) { this.fireShield.dispose(); this.fireShield = null; }
        if (this.fireShield) { this.fireShield.update(dt); this.fireShield.group.position.y = GROUND_Y + 0.4 + (this._lift ?? 0); }
        if (!this.fireGuardian) return;
        if (!on) { this.fireGuardian.dispose(); this.fireGuardian = null; return; }
        this.fireGuardian.update(dt, { x: 0, z: 0 }, this.facingLeft);
        this.fireGuardian.group.position.y += (this._lift ?? 0);
    }

    /** Đêm Tử Thần: Hộ Vệ Thần Chết bay sau lưng Zerith + hào quang dưới chân */
    _updateGiant(dt, ef, now) {
        const on = !!ef;
        this._giantK = (this._giantK ?? 0) + ((on ? 1 : 0) - (this._giantK ?? 0)) * Math.min(1, dt * 6);
        this._giantOn = on || this._giantK > 0.5;   // đổi da ở giữa lúc phình to / teo lại
        const sc = 1 + (GIANT_SCALE - 1) * this._giantK;
        this.stand.scale.set(sc, sc, sc);
        if (Math.abs(sc - (this._giantSc ?? 1)) > 0.005) { this._giantSc = sc; this.setBarHeight(GROUND_Y + this.height * sc + 0.35); }
        if (on && !this._giantAura) {
            this._giantAura = makeGiantAura();
            this.root.add(this._giantAura.group);
            this._immuneCrown = makeImmuneCrown();
            this.root.add(this._immuneCrown.mesh);
        }
        if (!this._giantAura) return;
        if (!on && this._giantK < 0.03) {
            this._giantAura.dispose(); this._giantAura = null;
            this._immuneCrown.dispose(); this._immuneCrown = null;
            this._giantOn = false;
            return;
        }
        this._giantAura.update(dt, this._giantK, sc);
        this._giantAura.group.position.set(0, GROUND_Y + (this._lift ?? 0), 0);
        const immune = on && now < (ef.immuneUntil ?? 0);
        this._crownK = (this._crownK ?? 0) + ((immune ? 1 : 0) - (this._crownK ?? 0)) * Math.min(1, dt * 6);
        this._immuneCrown.update(dt, this._crownK);
        this._immuneCrown.mesh.position.set(0, GROUND_Y + this.height * sc + 0.75 + (this._lift ?? 0), 0.5);
    }

    /** Độc Long (Brakk chỉ còn 1 mình): hào quang rồng lửa (nhạt hơn lúc Khổng Lồ; đang Khổng Lồ thì dùng luôn hào quang đó) */
    _updateLoneDragon(dt, on) {
        const show = on && !this._giantAura;
        if (show && !this._loneAura) { this._loneAura = makeGiantAura(); this._loneK = 0; this.root.add(this._loneAura.group); }
        if (!this._loneAura) return;
        this._loneK += ((show ? 1 : 0) - this._loneK) * Math.min(1, dt * 5);
        if (!show && this._loneK < 0.03) { this._loneAura.dispose(); this._loneAura = null; return; }
        this._loneAura.update(dt, this._loneK * 0.7, this._giantSc ?? 1);
        this._loneAura.group.position.set(0, GROUND_Y + (this._lift ?? 0), 0);
    }

    _updateBrakkShield(dt, ef) {
        if (ef && !this._brakkBubble) {
            this._brakkBubble = makeBrakkBubble(this.height * 1.1);
            this.root.add(this._brakkBubble.group);
            this._bubbleK = 0;
        }
        if (!this._brakkBubble) return;
        this._bubbleK += ((ef ? 1 : 0) - this._bubbleK) * Math.min(1, dt * 8);
        if (!ef && this._bubbleK < 0.03) { this._brakkBubble.dispose(); this._brakkBubble = null; return; }
        const frac = ef?.maxHp ? Math.max(0, ef.hp / ef.maxHp) : 0;
        this._brakkBubble.update(dt, this._bubbleK, frac, this._giantSc ?? 1);
        this._brakkBubble.group.position.set(0, GROUND_Y + (this._lift ?? 0), 0);
    }

    /** Tam Nguyên: hiệu ứng bám người — tạo khi cần, mờ dần rồi bỏ */
    _updateElemFx(dt, effs, now) {
        const fade = (key, on, make, rate = 8) => {
            let o = this[key];
            if (on && !o) { o = this[key] = make(); o.k = 0; this.root.add(o.group); }
            if (!o) return null;
            o.k += ((on ? 1 : 0) - o.k) * Math.min(1, dt * rate);
            if (!on && o.k < 0.03) { o.dispose(); this[key] = null; return null; }
            o.group.position.set(0, GROUND_Y + (this._lift ?? 0), 0);
            return o;
        };
        const frozen = effs.some(e => e.type === 'frozen' && e.endTime > now) && effs.some(e => e.type === 'stun' && e.endTime > now);
        const ice = fade('_iceBlock', frozen, () => makeIceBlock(this.height), 14);
        ice?.update(dt, ice.k);
        const ward = effs.find(e => e.type === 'storm_ward' && e.endTime > now);
        const dome = fade('_wardDome', !!ward, () => makeWardDome(this.height));
        dome?.update(dt, dome.k, ward?.maxHp ? Math.max(0, ward.hp / ward.maxHp) : 0);
        // Tốc Lôi (Elarion) / tay có sét (Golem — Hào Quang Sét): sét lách tách quanh người
        const spark = effs.some(e => (e.type === 'storm_self' || e.type === 'golem_haste') && e.endTime > now);
        const sa = fade('_sparkAura', spark, () => makeSparkAura(this.height), 6);
        sa?.update(dt, sa.k, this.position);
    }

    /** Thủy Vũ: mọi hiệu ứng bám người — tạo khi cần, mờ dần rồi bỏ khi hết */
    _updateWaterFx(dt, effs, now) {
        const fade = (key, on, make, rate = 8) => {
            let o = this[key];
            if (on && !o) { o = this[key] = make(); o.k = 0; this.root.add(o.group); }
            if (!o) return null;
            o.k += ((on ? 1 : 0) - o.k) * Math.min(1, dt * rate);
            if (!on && o.k < 0.03) { o.dispose(); this[key] = null; return null; }
            o.group.position.set(0, GROUND_Y + (this._lift ?? 0), 0);
            return o;
        };
        // giáp nước (Hòa Âm 1+2): bong bóng, sáng theo máu giáp còn lại
        const ws = effs.find(e => e.type === 'water_shield' && e.endTime > now && e.hp > 0);
        const bubble = fade('_waterBubble', !!ws, () => makeWaterBubble(this.height));
        bubble?.update(dt, bubble.k, ws?.maxHp ? Math.max(0, ws.hp / ws.maxHp) : 0);
        // Thủy Thần Vũ: Thủy Thần hiện ra sau lưng rồi giữ suốt điệu múa (chỉ trên người Nerissa)
        const god = effs.some(e => e.type === 'dance_god' && e.endTime > now);
        const aura = fade('_goddessAura', god, makeGoddessAura, 5);
        if (aura) { aura.group.scale.x = this.facingLeft ? -1 : 1; aura.update(dt, aura.k); }
        // Sóng Triều: vòng thủy triều dưới chân · Lưu Thủy: vòng hoa sen (múa cả 2: hoa sen)
        const flow = effs.some(e => e.type === 'dance_flow' && e.endTime > now);
        const tide = !flow && effs.some(e => e.type === 'dance_tide' && e.endTime > now);
        const tr = fade('_tideRing', tide, () => makeDanceRing('tideRing'), 5);
        tr?.update(dt, tr.k);
        const lr = fade('_lotusRing', flow, () => makeDanceRing('lotusRing'), 5);
        lr?.update(dt, lr.k);
        // cả 3 điệu: nốt nhạc bay vòng quanh người
        const all3 = effs.length > 0 && this.member?.danceKey === '123';
        const halo = fade('_noteHalo', all3, makeNoteHalo, 5);
        halo?.update(dt, halo.k);
        // Sóng Triều: MP bay lên từng nhịp
        if (effs.some(e => e.type === 'tide_mana' && e.endTime > now)) {
            this._manaTick = (this._manaTick ?? Math.random()) - dt;
            if (this._manaTick <= 0) { this._manaTick = 1.6; spawnManaRise(this.position, { size: 1.1, opacity: 0.55 }); }
        } else this._manaTick = null;
    }

    _updateReaperNight(dt, on) {
        if (on && !this.reaperGuardian) {
            this.reaperGuardian = makeReaperGuardian();
            this.root.add(this.reaperGuardian.group);
            this._reaperAura = makeReaperAura(this.height);
            this.root.add(this._reaperAura.group);
            this._reaperK = 0;
        }
        if (!this.reaperGuardian) return;
        this._reaperK += ((on ? 1 : 0) - this._reaperK) * Math.min(1, dt * 5);
        if (!on && this._reaperK < 0.03) {
            this.reaperGuardian.dispose(); this.reaperGuardian = null;
            this._reaperAura.dispose(); this._reaperAura = null;
            return;
        }
        const back = this.facingLeft ? 1 : -1;
        this.reaperGuardian.update(dt, this.facingLeft, { alpha: this._reaperK });
        // bản tranh (sprite): Thần Chết đầy đủ áo choàng -> lùi xa + bay cao hơn để không bị Zerith che khuất
        const far = this.sprite ? 1.95 : 1.35, up = this.sprite ? 0.55 : 0.15;
        this.reaperGuardian.group.position.set(back * far, GROUND_Y + up + (this._hover ?? 0) + (this._lift ?? 0), -0.4);
        this._reaperAura.update(dt, this._reaperK);
        // hào quang (đáy = lửa hồn dưới chân) nâng theo nửa độ bay: vẫn bao quanh người mà không rời hẳn mặt đất
        this._reaperAura.group.position.set(0, GROUND_Y + (this._hover ?? 0) * 0.5, 0);
    }

    /** Linh Hồn Báo Thù: Zerith đã gục, linh hồn Thần Chết (mờ, tím nhạt) bay tới chém địch */
    _updateReaperGhost(dt) {
        const until = this.member.ghostUntil ?? 0;
        const on = until > gameNow();   // còn cả khi Zerith đã được hồi sinh (đánh chung)
        if (on && !this.reaperGhost) {
            this.reaperGhost = makeReaperGuardian({ height: 3.0, ghost: true });
            this.root.add(this.reaperGhost.group);
            this._ghostK = 0;
            this._ghostX = 0; this._ghostZ = 0;
        }
        if (!this.reaperGhost) return;
        this._ghostK += ((on ? 1 : 0) - this._ghostK) * Math.min(1, dt * 4);
        if (!on && this._ghostK < 0.03) { this.reaperGhost.dispose(); this.reaperGhost = null; return; }
        const tx = (this.member.ghostX ?? this.root.position.x) - this.root.position.x;
        const tz = (this.member.ghostZ ?? this.root.position.z) - this.root.position.z;
        const prevX = this._ghostX;
        this._ghostX += (tx - this._ghostX) * Math.min(1, dt * 7);
        this._ghostZ += (tz - this._ghostZ) * Math.min(1, dt * 7);
        if (Math.abs(this._ghostX - prevX) > 0.002) this._ghostFaceLeft = this._ghostX < prevX;
        this.reaperGhost.update(dt, this._ghostFaceLeft ?? this.facingLeft, { alpha: this._ghostK });
        this.reaperGhost.group.position.set(this._ghostX, GROUND_Y + 0.4, this._ghostZ - 0.2);
    }

    /** Ấn Tử lơ lửng trên đầu */
    _updateDeathMark(dt, on) {
        if (on && !this._deathMark) {
            this._deathMark = makeDeathMarkIcon();
            this.root.add(this._deathMark.group);
        }
        if (!this._deathMark) return;
        if (!on) { this._deathMark.dispose(); this._deathMark = null; return; }
        this._deathMark.update(dt);
        this._deathMark.group.position.set(0, GROUND_Y + this.height + 0.55 + (this._lift ?? 0) + (this._hover ?? 0), 0.5);
    }

    /** Vệ Thần Gió (bản tranh) kéo cung bắn phụ một nhịp */
    windSpiritShoot() { this._windFx?.shoot(); }

    windSpiritPos() {
        if (this._windFx) return this._windFx.shotPoint();
        if (!this._wind?.g.visible) return null;
        const v = new THREE.Vector3(); this._wind.g.getWorldPosition(v); v.x += (this.facingLeft ? -1 : 1) * 0.8; return v;
    }

    /** 3 khiên nhỏ phát sáng bay vòng quanh người (đồng đội đang được Rok bảo hộ) */
    _updateOrbitShields(dt, on) {
        if (on && !this._orbit) {
            const g = new THREE.Group();
            for (let i = 0; i < 3; i++) {
                const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: getMiniShieldTexture(), transparent: true, depthWrite: false, fog: false, opacity: 0 }));
                sp.scale.set(0.5, 0.62, 1);
                g.add(sp);
            }
            const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: getFortressTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }));
            halo.rotation.x = -Math.PI / 2; halo.position.y = GROUND_Y + 0.03;
            this.root.add(halo);
            this.root.add(g);
            this._orbit = { group: g, halo, k: 0 };
        }
        const O = this._orbit;
        if (!O) return;
        O.k += ((on ? 1 : 0) - O.k) * Math.min(1, dt * 6);
        O.group.visible = O.halo.visible = O.k > 0.02;
        if (!O.group.visible) return;
        const h = this.height;
        O.group.children.forEach((sp, i) => {
            const a = this._time * 2.2 + (i / 3) * TAU;
            const r = 0.95 * (0.6 + 0.4 * O.k);
            sp.position.set(Math.cos(a) * r, GROUND_Y + h * (0.42 + 0.1 * Math.sin(a * 1.5 + i)), Math.sin(a) * r * 0.7 + 0.05);
            sp.material.opacity = O.k * (0.75 + 0.25 * Math.sin(a)); // phía sau người mờ hơn
            sp.material.rotation = Math.sin(a) * 0.25;
        });
        O.halo.material.opacity = 0.45 * O.k;
        O.halo.rotation.z += dt * 0.8;
    }

    /** Vệt gió đặc trưng của Gió dẫn đường: 3 dải gió lưỡi liềm xoáy quanh người ở 3 độ cao + quầng gió dưới chân */
    _updateWindAura(dt, on) {
        if (on && !this._windAura) {
            const g = new THREE.Group();
            for (let i = 0; i < 3; i++) {
                const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: getWindRibbonTexture(), transparent: true, depthWrite: false,
                    fog: false, opacity: 0, blending: THREE.AdditiveBlending }));
                sp.scale.set(1.5, 0.56, 1);
                g.add(sp);
            }
            const ring = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: getWindRibbonTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = GROUND_Y + 0.05;
            this.root.add(ring, g);
            this._windAura = { group: g, ring, k: 0 };
        }
        const W = this._windAura;
        if (!W) return;
        W.k += ((on ? 1 : 0) - W.k) * Math.min(1, dt * 5);
        W.group.visible = W.ring.visible = W.k > 0.02;
        if (!W.group.visible) return;
        const h = this.height, lift = this._hover ?? 0;
        W.group.children.forEach((sp, i) => {
            const a = this._time * (3.2 + i * 0.5) + (i / 3) * TAU;
            const r = 0.85 + 0.1 * i;
            const y = GROUND_Y + lift + h * (0.2 + i * 0.28) + Math.sin(this._time * 2 + i) * 0.08;
            sp.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.55 + 0.05);
            // dải gió nghiêng theo hướng xoáy; phía sau người mờ hơn
            sp.material.rotation = Math.cos(a) * 0.5;
            sp.material.opacity = W.k * (0.55 + 0.4 * (0.5 + 0.5 * Math.sin(a)));
            const sc = 1 + 0.15 * Math.sin(this._time * 6 + i);
            sp.scale.set(1.5 * sc * (0.7 + 0.3 * Math.abs(Math.sin(a))), 0.56 * sc, 1);
        });
        W.ring.position.y = GROUND_Y + 0.05 + lift * 0;
        W.ring.rotation.z -= dt * 3;
        W.ring.material.opacity = 0.5 * W.k;
    }

    /** Sấm phù trợ: 4 tia sét nhỏ nháy ngẫu nhiên quanh người (đổi chỗ / hình mỗi ~0.09s) + quầng tím dưới chân */
    _updateThunderAura(dt, on) {
        if (on && !this._thunder) {
            const g = new THREE.Group();
            for (let i = 0; i < 4; i++) {
                // tia sét tím vẽ bằng tranh (art/jessica/fx2, ô "bolt") — Sấm phù trợ của Jessica
                const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: jessicaBoltTexture(), transparent: true, depthWrite: false,
                    fog: false, opacity: 0 }));
                sp.scale.set(0.36, 0.72, 1);
                g.add(sp);
            }
            const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: getFortressTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0, color: 0xb07cff }));
            glow.rotation.x = -Math.PI / 2; glow.position.y = GROUND_Y + 0.04;
            this.root.add(glow, g);
            this._thunder = { group: g, glow, k: 0, t: 0 };
        }
        const S = this._thunder;
        if (!S) return;
        S.k += ((on ? 1 : 0) - S.k) * Math.min(1, dt * 6);
        S.group.visible = S.glow.visible = S.k > 0.02;
        if (!S.group.visible) return;
        S.t -= dt;
        const h = this.height, lift = this._hover ?? 0;
        if (S.t <= 0) {
            S.t = 0.07 + Math.random() * 0.06;
            S.group.children.forEach((sp, i) => {
                const show = Math.random() < 0.7;
                const a = Math.random() * TAU;
                sp.scale.setScalar(1); sp.scale.set(0.36 * (0.8 + Math.random() * 0.5), 0.72 * (0.8 + Math.random() * 0.5), 1);
                sp.position.set(Math.cos(a) * (0.55 + Math.random() * 0.35), GROUND_Y + lift + h * (0.15 + Math.random() * 0.7), Math.sin(a) * 0.35 + 0.1);
                sp.material.rotation = (Math.random() - 0.5) * 1.2;
                const s = 0.7 + Math.random() * 0.6;
                sp.scale.set(0.32 * s, 0.8 * s, 1);
                sp.userData.on = show;
            });
        }
        S.group.children.forEach(sp => { sp.material.opacity = sp.userData.on ? S.k * (0.7 + 0.3 * Math.random()) : 0; });
        S.glow.material.opacity = S.k * (0.3 + 0.15 * Math.sin(this._time * 20));
        S.glow.rotation.z += dt * 2;
    }

    /** Khiên Dựng Khiên phát nổ: thần hộ vệ + vòm loé sáng mạnh (Khiên Thần: nổ sóng; lần cuối `final`: vỡ tan) */
    onGuardBurst(final = false) {
        this._guardPulse = 1.6;
        if (this.def.guardFx) { this._guardFx ??= this._makeGuardFx(); if (final) this._guardFx.shatter(); else this._guardFx.pulse(); }
    }

    /** Đòn đánh bị khiên ánh sáng đỡ: khiên bùng sáng một nhịp */
    onGuardHit() { this._guardPulse = 1; this._guardFx?.hit(); }

    /** Dựng Khiên: Khiên Thần hiện ra đúng mốc cắm khiên (events.js gọi ở onHit của guardStart) */
    raiseDivineShield() {
        if (!this.def.guardFx) return;
        this._guardFx ??= this._makeGuardFx();
        this._guardFx.raise();
    }

    _makeGuardFx() {
        const fx = this.def.guardFx();
        this.root.add(fx.group);
        return fx;
    }

    setOpacity(value) {
        for (const m of this.materials) m.opacity = value;
        this.shadow.material.opacity = value;
    }

    flashHit() {
        this._flashTime = HIT_FLASH_SECONDS;
        for (const m of this.materials) m.color.setScalar(1.9);
        this.playHurt();
    }

    /** Mesh phi tiêu nhỏ cắt từ atlas (dùng cho đạn bay) — null nếu rig không có */
    /** Mesh cắt từ atlas theo rig.extras[name] (VD 'planted' = khiên cắm đất của Rok); null nếu không có */
    createExtraMesh(name) {
        const spec = this.def.rig.extras?.[name];
        if (!spec) return null;
        const [x, y, w, h] = spec.rect;
        const [imgW, imgH] = this.def.rig.atlasSize;
        const s = (spec.scale ?? 1) * this.unitsPerPx;
        const geo = new THREE.PlaneGeometry(w * s, h * s);
        const u0 = x / imgW, u1 = (x + w) / imgW, v0 = 1 - (y + h) / imgH, v1 = 1 - y / imgH;
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2));
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        mesh.userData.sharedTexture = true;
        if (this.facingLeft) mesh.scale.x = -1;
        return mesh;
    }

    createProjectileMesh() {
        if (this.def.projectile === 'talisman') {
            const m = makeTalismanMesh(0.62);
            m.userData.alongPath = true;   // bay thẳng, mũi bùa hướng về mục tiêu (không xoay vòng)
            m.userData.trail = 0x8b5cf6;   // vệt sáng tím phía sau
            return m;
        }
        const spec = this.def.rig.extras?.projectile;
        if (!spec) return null;
        const [x, y, w, h] = spec.rect;
        const [imgW, imgH] = this.def.rig.atlasSize;
        const s = (spec.scale ?? 1) * this.unitsPerPx;
        const geo = new THREE.PlaneGeometry(w * s, h * s);
        const u0 = x / imgW, u1 = (x + w) / imgW, v0 = 1 - (y + h) / imgH, v1 = 1 - y / imgH;
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2));
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide }));
        mesh.userData.spin = this.facingLeft ? 22 : -22; // xoay tít (rad/giây)
        mesh.userData.sharedTexture = true;
        return mesh;
    }

    /**
     * Dư ảnh: bản sao tư thế hiện tại, phủ màu `tint`, đặt ở (x, z), tự mờ dần.
     * Dùng cho Đột Kích (lướt chém) — gọi trong lúc nhân vật đang ẩn cũng được.
     */
    makeGhost(x, z, { tint = this.def.ghostTint ?? 0xa8dcff, faceLeft = this.facingLeft, opacity = 0.6, life = 0.38 } = {}) {
        this.flip.scale.x = faceLeft ? -1 : 1;
        const holder = new THREE.Group();
        holder.position.set(x, 0, z - 0.05);
        const copy = this.stand.clone(true);
        copy.traverse(o => {
            if (!o.isMesh) return;
            const m = o.material.clone();
            m.alphaToCoverage = false;
            m.transparent = true;
            m.depthWrite = false;
            m.alphaTest = 0.05;
            m.color.set(tint);
            m.opacity = opacity;
            o.material = m;
            o.userData.sharedTexture = true;
        });
        copy.visible = true;
        holder.add(copy);
        return { object: holder, life, opacity };
    }

    /**
     * Nhảy tới vị trí mới theo đường vòng cung (VD nhảy lùi khi Phóng Bùa).
     * Giữ nguyên hướng mặt; trong lúc nhảy bỏ qua vị trí server.
     */
    leapTo(x, z, { duration = 0.55, height = 1.1, flip = 0, flipFrom = 0.12, flipTo = 0.62, path = null, apex = 0.5 } = {}) {
        // flip: số vòng lộn (dương = lộn ngửa ra sau), xoay trong khoảng [flipFrom, flipTo] của cú nhảy
        // path: (p 0..1) => {x, z, lift} — tự vẽ đường bay (VD bị Brakk túm nhấc qua đầu rồi quật xuống)
        this._leap = { from: this.basePos.clone(), to: new THREE.Vector3(x, 0, z), t: 0, duration, height, flip, flipFrom, flipTo, path, apex };
        this.posLocked = true;
    }

    _updateLeap(dt) {
        const L = this._leap;
        L.t += dt;
        const p = Math.min(1, L.t / L.duration);
        const e = 1 - (1 - p) * (1 - p); // chậm dần khi tới gần chỗ đáp
        if (L.path) {
            const r = L.path(p);
            this.basePos.set(r.x, 0, r.z);
            this._lift = r.lift ?? 0;
        } else {
            this.basePos.lerpVectors(L.from, L.to, e);
            // apex > 0.5: bay lên chậm, rơi xuống NHANH dần (cú đập có lực); 0.5 = parabol đều
            if (L.apex === 0.5) this._lift = L.height * 4 * p * (1 - p);
            else if (p < L.apex) { const q = p / L.apex; this._lift = L.height * (1 - (1 - q) * (1 - q)); }
            else { const q = (p - L.apex) / (1 - L.apex); this._lift = L.height * (1 - q * q); }
        }
        this.root.position.x = this.basePos.x;
        this.root.position.z = this.basePos.z;
        if (L.flip && this.parts.hips) {
            const f = THREE.MathUtils.clamp((p - L.flipFrom) / (L.flipTo - L.flipFrom), 0, 1);
            const ef = f * f * (3 - 2 * f); // nhanh ở giữa vòng lộn
            this.parts.hips.rotation.z = TAU * L.flip * ef;
        }
        if (p >= 1) {
            this._leap = null;
            this._lift = 0;
            if (this.parts.hips) this.parts.hips.rotation.z = 0;
            this.teleport(L.to.x, L.to.z, false);
        }
    }

    /** Bật vòng ấn chú dưới chân trong `seconds` giây (kết ấn nhanh) */
    flashMagicCircle(seconds = 0.6) { this._circleTimer = seconds; }

    updateVisual(dt, camera) {
        this._time += dt;
        // Chỉ nhìn trái/phải (side view). Nhân vật trong atlas nhìn sang phải.
        this.flip.scale.x = this.facingLeft ? -1 : 1;

        // Nghiêng mặt phẳng nhân vật về phía camera (quan trọng ở góc chéo; góc ngang gần như đứng thẳng)
        const dir = camera.getWorldDirection(new THREE.Vector3());
        const pitch = Math.asin(THREE.MathUtils.clamp(-dir.y, -1, 1));
        this.stand.rotation.x = -pitch;

        if (this._intro) this._updateIntro(dt);
        else if (this._leap) this._updateLeap(dt);
        this.stand.position.y = GROUND_Y + this._lift + (this._hover ?? 0);
        const shadowScale = 1 - Math.min(0.7, (this._lift + (this._hover ?? 0)) / 10);
        this.shadow.scale.setScalar(shadowScale);

        this._updateLocomotion(dt);
        this.mixer.update(dt);
        this._updateBowString();
        const s = this._oneShot;
        if (s && !s.hitFired && s.action.time >= s.hitTime) this._fireHit();
        if (s?.finished && this._oneShot === s) this._finishOneShot();

        this._updateBlink(dt);
        this._applySkins();
        this._updateSecondary(dt);
        this._updateFloat();

        // Vòng ấn chú khi vận chiêu
        this._circleTimer = Math.max(0, (this._circleTimer ?? 0) - dt);
        const casting = this.member.alive && ((this._locomotion === 'cast' && !this._oneShot) || this._circleTimer > 0);
        const mc = this.magicCircle;
        const op = mc.material.opacity + ((casting ? 0.9 : 0) - mc.material.opacity) * Math.min(1, dt * 10);
        mc.material.opacity = op;
        mc.visible = op > 0.01;
        mc.rotation.z += dt * 1.6;
        mc.scale.setScalar(0.92 + 0.08 * Math.sin(this._time * 6));

        // Chết: ngã nằm (xoay 90° quanh chân)
        const dead = !this.member.alive;
        this._death += ((dead ? 1 : 0) - this._death) * Math.min(1, dt * 8);
        this.cutoutRoot.rotation.z = this._death * (Math.PI / 2) * 0.95; // ngã ngửa ra sau
        this.cutoutRoot.position.y = this._death * 0.15;

        this._updateAura(dt);
        this._updateStatusFx(dt);

        if (this._flashTime > 0) {
            this._flashTime -= dt;
            if (this._flashTime <= 0) for (const m of this.materials) { if (m.userData.baseColor) m.color.copy(m.userData.baseColor); else m.color.setScalar(m.userData.baseShade); }
        }
    }

    dispose() {
        // Texture atlas dùng chung giữa các nhân vật: không dispose
        super.dispose();
    }
}

function wrapAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
}

let starTexture = null;
function getStarTexture() {
    if (starTexture) return starTexture;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.translate(32, 32); ctx.fillStyle = '#ffe066'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 26, a = (i / 10) * TAU - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    starTexture = new THREE.CanvasTexture(c); starTexture.colorSpace = THREE.SRGBColorSpace;
    return starTexture;
}
let lightShieldTexture = null;
/** Khiên ánh sáng: hình bầu dục viền sáng, lưới lục giác mờ, chữ thập ở giữa */
function getLightShieldTexture() {
    if (lightShieldTexture) return lightShieldTexture;
    const c = document.createElement('canvas'); c.width = 256; c.height = 384;
    const ctx = c.getContext('2d');
    ctx.translate(128, 192);
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 170);
    g.addColorStop(0, 'rgba(255,240,200,0.10)'); g.addColorStop(0.75, 'rgba(255,220,140,0.28)'); g.addColorStop(1, 'rgba(255,200,90,0.7)');
    ctx.save(); ctx.scale(1, 1.45);
    ctx.beginPath(); ctx.arc(0, 0, 118, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,236,170,1)'; ctx.shadowColor = 'rgba(255,190,60,1)'; ctx.shadowBlur = 16; ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.stroke();
    ctx.restore();
    // lưới lục giác
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, 112, 162, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(255,230,160,0.35)'; ctx.lineWidth = 1.5;
    const r = 18;
    for (let y = -200; y < 200; y += r * 1.5) for (let x = -150; x < 150; x += r * 1.732) {
        const ox = ((Math.round((y + 200) / (r * 1.5))) % 2) * r * 0.866;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](x + ox + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95); }
        ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
    // chữ thập
    ctx.fillStyle = 'rgba(255,245,200,0.9)'; ctx.shadowColor = 'rgba(255,190,60,1)'; ctx.shadowBlur = 14;
    ctx.fillRect(-7, -70, 14, 140); ctx.fillRect(-48, -14, 96, 14);
    lightShieldTexture = new THREE.CanvasTexture(c); lightShieldTexture.colorSpace = THREE.SRGBColorSpace;
    return lightShieldTexture;
}

let fortressTexture = null;
function getFortressTexture() {
    if (fortressTexture) return fortressTexture;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.translate(128, 128);
    ctx.strokeStyle = 'rgba(255, 210, 90, 0.95)'; ctx.shadowColor = 'rgba(255,180,40,1)'; ctx.shadowBlur = 12;
    ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 112, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.stroke();
    // 6 hình khiên nhỏ quanh vòng
    for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate((i / 6) * TAU); ctx.translate(0, -101);
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, -6); ctx.lineTo(7, 6); ctx.lineTo(0, 12); ctx.lineTo(-7, 6); ctx.lineTo(-9, -6); ctx.closePath();
        ctx.fillStyle = 'rgba(255,225,140,0.95)'; ctx.fill();
        ctx.restore();
    }
    fortressTexture = new THREE.CanvasTexture(c); fortressTexture.colorSpace = THREE.SRGBColorSpace;
    return fortressTexture;
}

let magicCircleTexture = null;
function getMagicCircleTexture() {
    if (magicCircleTexture) return magicCircleTexture;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.translate(128, 128);
    ctx.strokeStyle = 'rgba(255, 214, 120, 0.95)';
    ctx.shadowColor = 'rgba(255, 190, 80, 1)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 118, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.stroke();
    // Ngôi sao 4 cánh như phi tiêu
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? 98 : 34;
        const a = (i / 8) * TAU - Math.PI / 2;
        ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.stroke();
    // Chấm "chữ cổ" quanh vòng
    ctx.fillStyle = 'rgba(255, 230, 160, 0.95)';
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        ctx.save(); ctx.rotate(a); ctx.translate(0, -109);
        ctx.fillRect(-4, -3, i % 3 ? 4 : 8, 6);
        ctx.restore();
    }
    magicCircleTexture = new THREE.CanvasTexture(c);
    magicCircleTexture.colorSpace = THREE.SRGBColorSpace;
    return magicCircleTexture;
}
