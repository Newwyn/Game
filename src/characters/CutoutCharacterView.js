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
import {
    spawnFootDust, makeTalismanMesh, spawnLightning,
    makeThunderAura, updateThunderAura, surgeThunderAura, spawnAuraFlame, makeEyeGlow, updateEyeGlow,
    getHexDomeTexture, getMiniShieldTexture, spawnRisingSparkles,
} from '../vfx/vfx.js';

const FADE = 0.08;
const HIT_FLASH_SECONDS = 0.07;
const LOCOMOTION_CLIP = { idle: 'idle', ready: 'ready', stunned: 'stunned', guarding: 'guard', dead: 'dead', move: 'move', cast: 'cast', fall: 'fall', victory: 'victoryIdle' };
const STILL_SPEED = 0.6; // server báo 'moving' nhưng thực tế đứng yên (VD lúc đếm ngược) -> đứng thủ thế
const TAU = Math.PI * 2;
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
        this.parts = parts;
        this.materials = materials;
        this.skins = skins;
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
        if (visual.stealthAura) {
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
        let name = LOCOMOTION_CLIP[state] ?? 'idle';
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

    playAction(name, { onHit, onComplete, soft = false } = {}) {
        const cfg = this.def.anims?.[name];
        const action = this.actions[cfg?.clip ?? name];
        if (!action) return super.playAction(name, { onHit, onComplete });
        this._interruptOneShot();
        this._fadeTo(action, false);
        this._oneShot = { action, hitTime: cfg?.hitTime ?? 0, onHit, onComplete, hitFired: !onHit, soft };
        return true;
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
        // Dựng Khiên: khiên ánh sáng lớn trước mặt
        const guard = alive && effs.some(e => e.type === 'guard' && e.endTime > now);
        if (guard && !this._guardShield) {
            const g = new THREE.Group();
            const mk = (w, h, color, op) => {
                const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
                    new THREE.MeshBasicMaterial({ map: getLightShieldTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color, opacity: op }));
                g.add(m); return m;
            };
            this._gsGlow = mk(2.6, 3.9, 0xffb347, 0.5);
            this._gsCore = mk(2.0, 3.3, 0xfff1c2, 0.9);
            this._gsCore.position.z = 0.02;
            g.position.set(1.25, GROUND_Y + this.height * 0.5, 0.75);
            g.rotation.y = -0.55; // nghiêng như tấm khiên dựng trước người
            this.flip.add(g);
            this._guardShield = g;
            this._guardPulse = 1;
        }
        if (this._guardShield) {
            this._guardPulse = Math.max(0, (this._guardPulse ?? 0) - dt * 3);
            const k = this._guardK = (this._guardK ?? 0) + ((guard ? 1 : 0) - (this._guardK ?? 0)) * Math.min(1, dt * 10);
            this._guardShield.visible = k > 0.02;
            if (this._guardShield.visible) {
                const pulse = 0.85 + 0.15 * Math.sin(this._time * 6) + 0.6 * this._guardPulse;
                this._gsCore.material.opacity = 0.85 * k * Math.min(1.4, pulse);
                this._gsGlow.material.opacity = 0.5 * k * pulse;
                const s = (0.6 + 0.4 * k) * (1 + 0.08 * this._guardPulse);
                this._guardShield.scale.set(s, s, 1);
                this._gsCore.material.map.offset.y = 0;
            }
        }
        this._updateIronGuard(dt, guard);
        // Đồng đội được Dựng Khiên của Chiến Binh bảo hộ (+20% thủ): 3 khiên nhỏ bay vòng quanh người
        const aura = alive && !guard && effs.some(e => e.type === 'guard_aura' && e.endTime > now);
        this._updateOrbitShields(dt, aura);
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
        if (on && !this._ironDome) {
            const g = new THREE.Group();
            const domeMat = new THREE.MeshBasicMaterial({ map: getHexDomeTexture(), transparent: true, depthWrite: false,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, color: 0xffd78a, opacity: 0 });
            const dome = new THREE.Mesh(new THREE.SphereGeometry(1.85, 40, 16, 0, TAU, 0, Math.PI / 2), domeMat);
            dome.scale.set(1, 1.35, 0.75);
            g.add(dome);
            const ring = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: getFortressTexture(),
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
            g.add(ring);
            g.position.y = GROUND_Y;
            this.root.add(g);
            this._ironDome = { group: g, dome, ring, k: 0, spark: 0 };
        }
        const D = this._ironDome;
        if (!D) return;
        D.k += ((on ? 1 : 0) - D.k) * Math.min(1, dt * 8);
        D.group.visible = D.k > 0.02;
        if (!D.group.visible) return;
        const pulse = this._guardPulse ?? 0;
        D.dome.material.opacity = (0.55 + 0.15 * Math.sin(this._time * 3) + 0.6 * pulse) * D.k;
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

    /** Đòn đánh bị khiên ánh sáng đỡ: khiên bùng sáng một nhịp */
    onGuardHit() { this._guardPulse = 1; }

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
    leapTo(x, z, { duration = 0.55, height = 1.1, flip = 0, flipFrom = 0.12, flipTo = 0.62 } = {}) {
        // flip: số vòng lộn (dương = lộn ngửa ra sau), xoay trong khoảng [flipFrom, flipTo] của cú nhảy
        this._leap = { from: this.basePos.clone(), to: new THREE.Vector3(x, 0, z), t: 0, duration, height, flip, flipFrom, flipTo };
        this.posLocked = true;
    }

    _updateLeap(dt) {
        const L = this._leap;
        L.t += dt;
        const p = Math.min(1, L.t / L.duration);
        const e = 1 - (1 - p) * (1 - p); // chậm dần khi tới gần chỗ đáp
        this.basePos.lerpVectors(L.from, L.to, e);
        this.root.position.x = this.basePos.x;
        this.root.position.z = this.basePos.z;
        this._lift = L.height * 4 * p * (1 - p);
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
        this.stand.position.y = GROUND_Y + this._lift;
        const shadowScale = 1 - Math.min(0.7, this._lift / 10);
        this.shadow.scale.setScalar(shadowScale);

        this._updateLocomotion(dt);
        this.mixer.update(dt);
        const s = this._oneShot;
        if (s && !s.hitFired && s.action.time >= s.hitTime) this._fireHit();
        if (s?.finished && this._oneShot === s) this._finishOneShot();

        this._updateBlink(dt);
        this._applySkins();
        this._updateSecondary(dt);

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
            if (this._flashTime <= 0) for (const m of this.materials) m.color.setScalar(m.userData.baseShade);
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
