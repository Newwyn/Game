// ============================================================
// CHARACTER VIEW — lớp cơ sở cho "phần hình" của một nhân vật
// ============================================================
// Ý tưởng: logic trận đấu (server, sự kiện skill, HUD) KHÔNG biết nhân vật được vẽ bằng
// thế nào. Nó chỉ gọi các hàm chung:
//
//   view.syncFromServer(member, players, playerId)   — mỗi gói stateUpdate
//   view.update(dt, camera)                          — mỗi frame render
//   view.playAction('attack' | 'throw' | 'vanish' | 'appear' | 'stealth', { hitFrame, onHit, onComplete })
//   view.flashHit(), view.teleport(x, z), view.startLunge(dir)
//
// Lớp con chỉ cần hiện thực phần "vẽ":
//   - CutoutCharacterView : 2D nhìn nghiêng, ghép mảnh + gắn xương (mọi nhân vật)
//   - PlaceholderCharacterView : hình tròn tạm cho lớp chưa khai báo trong registry
//
import * as THREE from 'three';
import { createBarSprite, updateBarSprite } from './bars.js';
import { SERVER_TICK_MS, GROUND_Y, timeState, gameNow } from '../config.js';

const LUNGE_DURATION = 0.25; // giây
const LUNGE_DISTANCE = 0.4;

export class CharacterView {
    constructor(member, classDef, isMyTeam) {
        this.member = member;
        this.classDef = classDef;
        this.isMyTeam = isMyTeam;
        this.isLocalPlayer = false; // gán từ ngoài: nhân vật thuộc người chơi đang xem

        this.root = new THREE.Group();
        this.root.userData.view = this;

        // Vị trí: basePos là vị trí đang hiển thị (nội suy), targetPos là vị trí server báo
        this.basePos = new THREE.Vector3(member.x, 0, member.z || 0);
        this.targetPos = this.basePos.clone();
        this.posLocked = false;
        this.lungeX = 0;
        this._lunge = null;

        // Hướng mặt: nhân vật 2D chỉ lật trái/phải (facingLeft); faceDir giữ hướng đầy đủ (x, z)
        this.facingLeft = member.side === 'right'; // phe phải nhìn sang trái ngay từ đầu (cả lúc rơi xuống mở màn)
        this.faceDir = new THREE.Vector2(this.facingLeft ? -1 : 1, 0);
        this._lastServerX = member.x;
        this._lastServerZ = member.z || 0;

        /** Chết thì ép dẹt (hình tạm). Nhân vật ghép mảnh tự diễn ngã nên tắt cờ này */
        this.squashOnDeath = true;

        // Độ mờ (tàng hình / chết)
        this.opacity = 1;
        this.opacityOverride = null;

        // Thanh máu + thanh vận chiêu
        this.hpBar = createBarSprite('#22c55e');
        this.hpBar.position.y = 3.0;
        this.root.add(this.hpBar);
        this.castBar = createBarSprite('#facc15');
        this.castBar.position.y = 3.2;
        this.castBar.visible = false;
        this.root.add(this.castBar);
        // Thanh MÁU KHIÊN (Dựng Khiên của Chiến Binh) nằm ngay trên thanh máu
        this.shieldBar = createBarSprite('#fcd34d');
        this.shieldBar.scale.set(1.5, 0.12, 1);
        this.shieldBar.position.y = 3.17;
        this.shieldBar.visible = false;
        this.root.add(this.shieldBar);

        // Vòng tầm đánh dưới chân
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(classDef.atkRange, classDef.atkRange + 0.1, 32),
            new THREE.MeshBasicMaterial({
                color: isMyTeam ? '#22c55e' : '#ff4444',
                transparent: true, opacity: 0.3, side: THREE.DoubleSide,
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = GROUND_Y + 0.02;
        this.root.add(ring);

        this.root.position.copy(this.basePos);
    }

    // ------------------------------------------------------------
    // Lớp con override các hàm dưới đây
    // ------------------------------------------------------------

    /** Áp độ mờ 0..1 lên phần hình */
    setOpacity(_value) {}

    /** Nháy trắng khi trúng đòn */
    flashHit() {}

    /** Animation lặp theo trạng thái: 'idle' | 'move' | 'cast' | 'dead' */
    setLocomotion(_state) {}

    /** Cập nhật phần hình mỗi frame (billboard, animator, mixer...) */
    updateVisual(_dt, _camera) {}

    /** Đang diễn một animation one-shot (skill/đòn đánh) không được ngắt */
    get isBusy() { return false; }

    /**
     * Phát animation một lần. Mặc định (không có animation): bắn hit và kết thúc ngay.
     * @returns {boolean} true nếu thực sự có animation
     */
    playAction(_name, { onHit, onComplete } = {}) {
        onHit?.();
        onComplete?.();
        return false;
    }

    // ------------------------------------------------------------
    // Phần dùng chung
    // ------------------------------------------------------------

    /** Vị trí đang hiển thị (dùng để đặt VFX, số sát thương) */
    get position() { return this.root.position; }

    syncFromServer(member, players, playerId) {
        this.member = member;
        this.targetPos.set(member.x, 0, member.z);

        // Hướng mặt: khi đánh/cast thì nhìn về mục tiêu; khi di chuyển thì theo hướng đi.
        // Ngưỡng nhỏ để dao động từ server không làm nhân vật quay qua quay lại.
        const dx = member.x - this._lastServerX;
        const dz = (member.z || 0) - this._lastServerZ;
        const opponent = Object.entries(players).find(([id]) => id !== playerId)?.[1];
        const target = opponent && member.targetIndex >= 0 ? opponent.squad[member.targetIndex] : null;
        if (this.posLocked) {
            // đang nhảy / lướt theo kịch bản: giữ hướng mặt, không quay theo vị trí server
        } else if ((member.state === 'attacking' || member.state === 'casting') && target) {
            this._setFacing(target.x - member.x, (target.z || 0) - (member.z || 0), 0.05);
        } else if (member.state === 'moving') {
            this._setFacing(dx, dz, 0.02);
        }
        this._lastServerX = member.x;
        this._lastServerZ = member.z || 0;

        // Animation lặp theo trạng thái ('attacking' = đứng chờ hồi đòn -> idle;
        // nhát chém chỉ phát khi có sự kiện autoAttack)
        // gục khi đang giữ 1 động tác (VD Golem đang phun bão tuyết) -> bỏ động tác đó để ngã xuống
        if (!member.alive && this._oneShot?.hold) this._interruptOneShot?.();
        if (!this.isBusy) {
            if (!member.alive) this.setLocomotion('dead');
            else if (member.state === 'moving') this.setLocomotion('move');
            else if (member.state === 'casting') this.setLocomotion('cast');
            else if (member.state === 'attacking') this.setLocomotion('ready');
            else if (member.state === 'stunned' || member.state === 'judged') this.setLocomotion('stunned');   // judged: bị Thần Chết nhấc lên
            else if (member.state === 'guarding') this.setLocomotion('guarding'); // đứng thủ thế giữa các đòn
            else if (member.state === 'channeling') this.setLocomotion('channel');   // Elarion: đứng thi triển Mưa Giông
            else if (member.state === 'beaming') this.setLocomotion('beam');         // Elarion: chưởng SolarBeam (Băng Hoại Hỏa Thiên)
            else if (member.state === 'dancing') this.setLocomotion('dance' + (member.danceKey || '1'));   // Thủy Vũ: điệu theo tổ hợp 1/12/123...
            else this.setLocomotion('idle');
        }

        // Thanh máu
        const nowM = gameNow();
        const mark = member.statusEffects?.find(ef => ef.type === 'death_mark' && ef.endTime > nowM);   // Ấn Tử: vạch ngưỡng tử
        updateBarSprite(this.hpBar, member.maxHp > 0 ? member.hp / member.maxHp : 0, mark?.execute ?? 0);

        // Thanh vận chiêu
        const now = gameNow();
        const shield = member.alive && member.statusEffects?.find(ef => (ef.type === 'guard' || ef.type === 'holy_shield' || ef.type === 'brakk_shield' || ef.type === 'fire_ward' || ef.type === 'water_shield') && ef.endTime > now && ef.maxHp && ef.hp > 0);
        this.shieldBar.visible = !!shield;
        if (shield) updateBarSprite(this.shieldBar, shield.hp / shield.maxHp);
        const castDef = this.classDef.skills?.[member.castingSkillId];
        if (member.alive && member.state === 'casting' && member.castEndTime > now && castDef?.castTime > 0) {
            this.castBar.visible = true;
            updateBarSprite(this.castBar, 1 - (member.castEndTime - now) / castDef.castTime);
        } else {
            this.castBar.visible = false;
        }

        // Chết: ẩn thanh máu (+ ép dẹt với hình tạm)
        this.hpBar.visible = member.alive;
        const squash = !member.alive && this.squashOnDeath;
        this.root.scale.set(1, squash ? 0.4 : 1, 1);
        this.root.position.y = squash ? -0.35 : 0;
    }

    _setFacing(dx, dz, threshold) {
        if (Math.hypot(dx, dz) < threshold) return;
        this.faceDir.set(dx, dz).normalize();
        if (Math.abs(dx) > threshold) this.facingLeft = dx < 0;
    }

    /** Đặt độ cao thanh máu / thanh vận chiêu theo chiều cao nhân vật */
    setBarHeight(y) {
        this.hpBar.position.y = y;
        if (this.shieldBar) this.shieldBar.position.y = y + 0.17;
        this.castBar.position.y = y + 0.2;
    }


    /** Dịch chuyển tức thời (dash). lock = true: giữ nguyên chỗ, bỏ qua vị trí server cho tới khi mở khoá */
    teleport(x, z, lock = false) {
        this.basePos.set(x, 0, z);
        if (!lock) this.targetPos.set(x, 0, z);
        this.posLocked = lock;
    }

    /** Hiệu ứng lao tới khi đánh: chỉ là offset, không ghi đè vị trí thật */
    startLunge(direction) {
        this._lunge = { t: 0, direction };
    }

    update(realDt, camera) {
        // Vị trí bám theo server dùng thời gian thật; động tác / lao tới / mờ dần theo tốc độ trận
        const dt = realDt * timeState.scale;
        // Lao tới
        if (this._lunge) {
            this._lunge.t += dt / LUNGE_DURATION;
            const t = Math.min(1, this._lunge.t);
            this.lungeX = this._lunge.direction * Math.sin(t * Math.PI) * LUNGE_DISTANCE;
            if (this._lunge.t >= 1) { this._lunge = null; this.lungeX = 0; }
        }

        // Nội suy vị trí độc lập FPS (≈ 15% mỗi tick server như bản cũ)
        if (!this.posLocked) {
            const k = 1 - Math.pow(0.85, (realDt * 1000) / SERVER_TICK_MS);
            this.basePos.x += (this.targetPos.x - this.basePos.x) * k;
            this.basePos.z += (this.targetPos.z - this.basePos.z) * k;
        }
        this.root.position.x = this.basePos.x + this.lungeX;
        this.root.position.z = this.basePos.z;

        // Độ mờ: chết 0.25, tàng hình (phe mình 0.3 / phe địch 0) — fade mượt
        const m = this.member;
        const isStealth = m.alive && m.statusEffects?.some(ef => ef.type === 'stealth');
        let target = 1;
        if (!m.alive) target = 0.25;
        else if (isStealth) target = this.isLocalPlayer ? 0.5 : 0; // phe mình vẫn thấy mờ mờ (để thấy hào quang)
        if (this.opacityOverride != null) target = this.opacityOverride;
        this.opacity += (target - this.opacity) * (1 - Math.pow(0.9, dt * 60));
        this.setOpacity(this.opacity);

        // Địch tàng hình: ẩn hẳn (kể cả thanh máu) khi đã mờ hết
        this.root.visible = !(isStealth && !this.isLocalPlayer && this.opacity < 0.02);

        this.updateVisual(dt, camera);
    }

    dispose() {
        this.root.removeFromParent();
        this.root.traverse(obj => {
            obj.geometry?.dispose?.();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(mat => {
                if (!mat) return;
                // Texture dùng chung (atlas) không dispose ở đây — chỉ CanvasTexture riêng
                if (mat.map?.isCanvasTexture) mat.map.dispose();
                mat.dispose?.();
            });
        });
    }
}
