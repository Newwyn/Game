// ============================================================
// FrameSpriteView — nhân vật kiểu SPRITE (mỗi khung là 1 hình vẽ trọn thân)
// ------------------------------------------------------------
// Chạy y như CutoutCharacterView (bộ khung xương vẫn chạy ẨN): mốc ra đòn (hitTime), onComplete, đang bận,
// rơi vào trận, chết, hiệu ứng trạng thái, lửa trên tay... giữ nguyên. Chỉ phần HÌNH đổi thành 1 mặt phẳng
// lấy khung trong atlas (cắt sát từng khung) theo clip đang chạy — bảng visual.sprite.clips (mẫu: sprite/ignarSprite.js).
// Dùng cho MỌI nhân vật: visual.sprite = { image, meta, idle: {A,B,C}, defaultIdle, clips, lean?, fire? }
//   clips[clip].mode: strike (khung ra đòn = hitTime) · clip (trải theo clip) · hold (vào thế rồi lặp) · once · loop · still (1 khung + thở)
//   clips[clip].noSpin: tranh đã vẽ sẵn vòng lộn (VD Phóng Bùa của Jessica) -> bỏ xoay lộn của khung xương
//   fire (tuỳ chọn, chỉ nhân vật có lửa / vật trên tay như Ignar): { palmOffset, gatherOffset } + clips[].fire / gather
// Điểm gắn từng khung (mũi kiếm, đầu cung, tay cầm lụa...): view.pointWorld(tên) -> toạ độ thế giới, null nếu khung không có.
// Lưu ý: KHÔNG đặt tên SpriteCharacterView.js (cap_nhat_github.bat đang xoá tên đó).
// ============================================================
import * as THREE from 'three';
import { CutoutCharacterView } from './CutoutCharacterView.js';

const texCache = new Map();
// trạng thái đứng / di chuyển -> tên clip (như CutoutCharacterView)
const LOCO_CLIP = { stunned: 'stunned', guarding: 'guard', cast: 'cast', fall: 'fall', victory: 'victoryIdle', channel: 'channel', beam: 'beam' };
function spriteTexture(url) {
    if (!texCache.has(url)) {
        const tex = new THREE.TextureLoader().load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        texCache.set(url, tex);
    }
    return texCache.get(url);
}

/** Cách đứng chọn bằng URL (?ignarIdle=A|B|C) — để so trong trận */
function idleMode(sprite, key) {
    try {
        const v = new URLSearchParams(location.search).get(key)?.toUpperCase();
        if (v && sprite.idle[v]) return v;
    } catch { /* không có location (chạy ngoài trình duyệt) */ }
    return sprite.defaultIdle;
}

export class FrameSpriteView extends CutoutCharacterView {
    constructor(member, classDef, isMyTeam, visual) {
        super(member, classDef, isMyTeam, visual);
        const sp = visual.sprite;
        this.sprite = sp;
        const meta = sp.meta;
        this._idle = sp.idle[idleMode(sp, visual.spriteIdleParam ?? 'idle')];
        this._lean = new Set(sp.lean ?? []);
        this._hitOf = {};
        for (const a of Object.values(visual.anims ?? {})) if (a.clip && a.hitTime != null) this._hitOf[a.clip] = a.hitTime;
        this._drawnDeath = !!sp.clips?.dead?.drawnDeath;
        const AS = meta.atlasScale ?? 1;
        this._palmOff = (sp.fire?.palmOffset ?? [0, 0]).map(v => v * AS);
        this._gatherOff = (sp.fire?.gatherOffset ?? [0, 0]).map(v => v * AS);

        // Ẩn mảnh khung xương (vẫn chạy để giữ mốc + vị trí hông cho nhún / nhảy)
        for (const m of this.materials) m.visible = false;

        // Chiều cao như bản khung xương: chân -> đỉnh tóc của khung đứng (trung vị)
        const tops = Object.keys(meta.frames).filter(k => /^idle\d/.test(k)).map(k => meta.frames[k].top).sort((a, b) => a - b);
        this._u = this.height / tops[tops.length >> 1];

        // cutoutRoot (ngã khi chết) -> spin (ở độ cao hông: lộn nhào lúc rơi vào trận, nhún / nhảy) -> lean (quanh chân) -> mặt phẳng
        const hips = this.parts.hips;
        this._hipsRest = hips ? hips.position.clone() : new THREE.Vector3();
        this._torsoRest = this.parts.torso ? this.parts.torso.rotation.z : 0;
        this._spin = new THREE.Group();
        this._spin.position.set(this._hipsRest.x, this._hipsRest.y, 0);
        this._leanG = new THREE.Group();
        this._leanG.position.set(-this._hipsRest.x, -this._hipsRest.y, 0);
        this._spin.add(this._leanG);
        this.cutoutRoot.add(this._spin);

        this._spTex = spriteTexture(sp.image);
        const geo = new THREE.PlaneGeometry(1, 1);
        const mat = new THREE.MeshBasicMaterial({ map: this._spTex, alphaToCoverage: true, side: THREE.DoubleSide, fog: false });
        mat.userData.baseShade = 1;
        this.materials.push(mat);
        this._spMesh = new THREE.Mesh(geo, mat);
        this._spMesh.frustumCulled = false;
        this._spMesh.userData.isSprite = true;
        this._leanG.add(this._spMesh);

        // Lửa trên tay: chuyển từ bàn tay khung xương sang sprite
        if (this.palmFire) this._leanG.add(this.palmFire.group);
        // Mắt phát sáng lúc tàng hình gắn vào mắt khung xương (ẩn) -> lệch chỗ trên tranh: bỏ (tranh đã có mắt tím)
        if (this.eyeGlow) { this.eyeGlow.parent?.remove(this.eyeGlow); this.eyeGlow = null; }

        this._frame = '';
        this._clipName = '';
        this._clipT = 0;
        this._idleT = 0;
        this._setFrame(this._idle.frames[0]);
    }

    /** Đổi khung: mặt phẳng đúng cỡ khung (atlas cắt sát), gốc = tâm đứng dưới chân */
    _setFrame(name) {
        if (name === this._frame) return;
        const meta = this.sprite.meta, f = meta.frames[name];
        if (!f) return;
        this._frame = name;
        const [W, H] = meta.size, [x, y, w, h] = f.rect, [ox, oy] = f.org, u = this._u;
        const x0 = -ox * u, x1 = (w - ox) * u, y1 = oy * u, y0 = (oy - h) * u;
        const g = this._spMesh.geometry;
        g.attributes.position.array.set([x0, y1, 0, x1, y1, 0, x0, y0, 0, x1, y0, 0]);
        g.attributes.position.needsUpdate = true;
        g.attributes.uv.array.set([x / W, 1 - y / H, (x + w) / W, 1 - y / H, x / W, 1 - (y + h) / H, (x + w) / W, 1 - (y + h) / H]);
        g.attributes.uv.needsUpdate = true;
    }

    /** Chọn khung theo clip đang chạy (khung xương ẩn) -> { frame, cfg, n (thứ tự khung trong clip, từ 1) } */
    _pickFrame(dt) {
        let { name, time } = this._activeClip();
        // khung xương không có clip cho trạng thái này (VD Jessica không có 'stunned') nhưng tranh có -> dùng tranh
        const loco = LOCO_CLIP[this._locomotion];
        const sub = !this._oneShot && loco && loco !== name && !this.actions[loco] && this.sprite.clips?.[loco];
        if (sub) name = loco;
        if (name !== this._clipName) { this._clipName = name; this._clipT = 0; } else this._clipT += dt;
        if (sub) time = this._clipT;
        const cfg = this.sprite.clips?.[name];
        if (cfg) {
            const fr = cfg.frames, n = fr.length, t = this._clipT;
            let k = 0;
            if (cfg.mode === 'strike') {
                const dur = this.actions[name]?.getClip().duration ?? 0.6;
                const h = Math.min(this._hitOf[name] ?? dur * 0.4, dur * 0.9);
                const pre = cfg.release - 1, post = n - pre;
                k = time < h ? Math.min(pre - 1, Math.floor(time / (h / pre)))
                    : pre + Math.min(post - 1, Math.floor((time - h) / ((dur - h) / post)));
            } else if (cfg.mode === 'clip') {
                const dur = cfg.dur ?? (this.actions[name]?.getClip().duration || 1);
                k = Math.min(n - 1, Math.floor(((time % dur) / dur) * n + 1e-6));
            } else if (cfg.mode === 'hold') {
                if (t < cfg.introTime) return { frame: cfg.intro[Math.min(cfg.intro.length - 1, Math.floor(t / (cfg.introTime / cfg.intro.length)))], cfg, n: 0 };
                k = Math.floor((t - cfg.introTime) * cfg.fps) % n;
            } else if (cfg.mode === 'still') {
                // thủ thế / đứng riêng: 1 khung (hoặc vài khung chậm) + thở bằng code
                k = cfg.fps ? Math.floor(t * cfg.fps) % n : 0;
            } else if (cfg.mode === 'once') {
                k = Math.min(n - 1, Math.floor(t * cfg.fps));
            } else {   // loop
                k = Math.floor(t * cfg.fps) % n;
            }
            return { frame: fr[Math.max(0, k)], cfg, n: Math.max(0, k) + 1 };
        }
        // khung đứng (đếm lại từ khung đầu mỗi lần quay về đứng)
        if (this._clipT === 0) this._idleT = 0;
        this._idleT += dt;
        const I = this._idle;
        const frame = I.frames.length === 1 ? I.frames[0] : I.frames[Math.floor(this._idleT * I.fps + 1e-6) % I.frames.length];
        return { frame, cfg: null, n: 0, lean: this._lean.has(name) };
    }

    _updateSprite(dt) {
        const { frame, cfg, n, lean } = this._pickFrame(dt);
        this._setFrame(frame);
        const dead = this._clipName === 'dead';

        // nhún / nhảy / lộn nhào theo hông khung xương ẩn (không cho lún xuống đất)
        const hips = this.parts.hips;
        if (hips) {
            const dx = lean ? hips.position.x - this._hipsRest.x : 0;
            const dy = dead || cfg?.noLift ? 0 : Math.max(0, hips.position.y - this._hipsRest.y);
            this._spin.position.set(this._hipsRest.x + dx, this._hipsRest.y + dy, 0);
            this._spin.rotation.z = cfg?.noSpin ? 0 : hips.rotation.z;   // noSpin: tranh đã vẽ sẵn vòng lộn
        }
        // nghiêng người (động tác chưa có tấm riêng)
        this._leanG.rotation.z = lean && this.parts.torso ? (this.parts.torso.rotation.z - this._torsoRest) * 0.6 : 0;
        // thở bằng code (cách đứng C / clip 'still'): gốc ở chân nên không trượt chân
        const breathing = cfg ? cfg.mode === 'still' : this._idle.breath;
        const br = breathing ? Math.sin((cfg ? this._clipT : this._idleT) * Math.PI) : 0;
        this._spMesh.scale.set(1 - 0.004 * br, 1 + 0.012 * br, 1);

        // lửa trên tay (chỉ nhân vật có cấu hình fire)
        const fire = this.sprite.fire ? this.palmFire : null;
        if (fire) {
            const f = this.sprite.meta.frames[frame];
            const hand = f.hand ?? [0, -this.sprite.meta.frames[frame].top * 0.5, 0, -this.sprite.meta.frames[frame].top * 0.5];
            const baseShow = fire.group.visible;            // khung xương ẩn đã tính (ngửa tay / còn sống)
            let show = baseShow, scale = 1;
            let px = hand[0] + this._palmOff[0], py = hand[1] + this._palmOff[1];
            if (cfg) {
                const palmUp = cfg.fire === 'all' || (cfg.fire ?? []).includes(n);
                const gather = (cfg.gather ?? []).includes(n);
                show = this.member.alive && (palmUp || gather);
                if (gather) { px = hand[0] + this._gatherOff[0]; py = hand[1] + this._gatherOff[1]; scale = 1.25; }
                else if (!palmUp) { px = hand[2]; py = hand[3]; }   // lửa đã rời tay: điểm cầu lửa bay ra = bàn tay xa
            }
            const s = this._spMesh.scale, u = this._u;
            fire.group.position.set(px * u * s.x, -py * u * s.y, 0.3);
            fire.group.scale.setScalar(scale);
            fire.group.visible = show;
            if (show && !baseShow && dt > 0) fire.update(dt);
        }
    }

    /** Điểm gắn `name` của khung đang hiện (đánh dấu trong sprite_spec "points") -> toạ độ thế giới; null nếu không có */
    pointWorld(name) {
        const f = this.sprite.meta.frames[this._frame];
        const p = f?.pts?.[name];
        if (!p) return null;
        const s = this._spMesh.scale, u = this._u;
        const v = new THREE.Vector3(p[0] * u * s.x, -p[1] * u * s.y, 0.2);
        return this._leanG.localToWorld(v);
    }

    /** Dư ảnh (lướt): mặt phẳng sprite dùng hình học riêng để giữ đúng khung lúc tạo (khung sau đổi không ảnh hưởng) */
    makeGhost(x, z, opts) {
        const g = super.makeGhost(x, z, opts);
        g.object.traverse(o => { if (o.isMesh && o.userData.isSprite) o.geometry = o.geometry.clone(); else if (o.isMesh && !o.material.visible) o.visible = false; });
        return g;
    }

    // cầu lửa bay ra từ đúng khung ra đòn: cập nhật khung trước khi báo trúng (events.js đọc vị trí lửa trên tay)
    _fireHit() {
        this._updateSprite(0);
        super._fireHit();
    }

    updateVisual(dt, camera) {
        super.updateVisual(dt, camera);
        // gục đã vẽ sẵn nằm ra đất -> bỏ xoay ngã 90° của khung xương
        if (this._drawnDeath) { this.cutoutRoot.rotation.z = 0; this.cutoutRoot.position.y = 0; }
        this._updateSprite(dt);
    }
}
