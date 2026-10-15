// ============================================================
// CAMERA RIG — 2 chế độ góc nhìn + zoom + rung màn hình
// ============================================================
//   'combat'  : góc NGANG (nhìn từ bên hông, hơi chúc xuống) — khung hình ôm cả hai phe để dễ theo dõi trận
//   'explore' : góc CHÉO ~48° kiểu Tree of Savior — dành cho bản đồ thế giới khi đi lại (sau này)
// Đổi chế độ: cameraRig.setMode('combat' | 'explore') — camera chuyển mượt, không giật.
import { settings } from './settings.js';
import * as THREE from 'three';
import { camera, renderer, scene } from './scene.js';

export const CAMERA_MODES = {
    combat:  { pitchDeg: 14, fov: 38, lookHeight: 1.3, minDist: 13, maxDist: 30, margin: 4 },
    explore: { pitchDeg: 48, fov: 42, lookHeight: 0.8, baseDist: 15 },
};

const ZOOM_MIN = 0.6, ZOOM_MAX = 1.6;
const FOLLOW_SHARPNESS = 5;   // càng lớn càng bám sát
const BLEND_SHARPNESS = 4;    // tốc độ chuyển giữa 2 chế độ

let mode = 'combat';
const listeners = new Set();
const target = new THREE.Vector3();
const focus = new THREE.Vector3();
let targetDist = CAMERA_MODES.combat.minDist;
let dist = targetDist;
let pitch = THREE.MathUtils.degToRad(CAMERA_MODES.combat.pitchDeg);
let zoom = 1, zoomTarget = 1;
// Nâng khung hình (VD: Thần Hộ Vệ hiện trên đầu Rok) — cộng vào độ cao điểm nhìn + lùi xa thêm chút
let lift = 0, liftTarget = 0, liftRate = 3;
const shake = { intensity: 0, until: 0 };
// Zoom mở màn: camera bắt đầu xa rồi lướt vào (hệ số nhân khoảng cách)
const intro = { from: 1, t: 1, duration: 1 };
let introFactor = 1;

function cfg() { return CAMERA_MODES[mode]; }

function placeCamera() {
    const d = dist * zoom * introFactor * (1 + lift * 0.1);
    camera.position.set(
        focus.x,
        focus.y + lift + Math.sin(pitch) * d,
        focus.z + Math.cos(pitch) * d,
    );
    camera.lookAt(focus.x, focus.y + lift, focus.z);
}

/** Khoảng cách cần lùi để khung hình rộng `width` (theo trục x) vừa màn hình */
function distanceToFit(width) {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hTan = Math.tan(vfov / 2) * camera.aspect;
    return (width / 2) / hTan;
}

export const cameraRig = {
    getMode: () => mode,

    setMode(next) {
        if (!CAMERA_MODES[next] || next === mode) return;
        mode = next;
        listeners.forEach(fn => fn(mode));
    },

    /** Đăng ký nghe đổi chế độ (VD: ẩn cây cối gần camera khi nhìn ngang) */
    onModeChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** Chế độ explore: bám theo một điểm (nhân vật / đội hình) */
    setTarget(x, z) {
        target.set(x, cfg().lookHeight, z);
        if (mode === 'explore') targetDist = cfg().baseDist;
    },

    /** Chế độ combat: ôm khung từ minX..maxX (theo trục ngang), z là độ sâu trung bình */
    frame(minX, maxX, z) {
        const c = cfg();
        target.set((minX + maxX) / 2, c.lookHeight, z);
        if (mode === 'combat') {
            const want = distanceToFit(maxX - minX + c.margin * 2);
            targetDist = THREE.MathUtils.clamp(want, c.minDist, c.maxDist);
        }
    },

    /** Đặt camera ngay lập tức (không trượt) — dùng khi bắt đầu trận */
    snapTo(x, z = 0) {
        const c = cfg();
        target.set(x, c.lookHeight, z);
        focus.copy(target);
        pitch = THREE.MathUtils.degToRad(c.pitchDeg);
        targetDist = dist = c.minDist ?? c.baseDist;
        camera.fov = c.fov;
        camera.updateProjectionMatrix();
        placeCamera();
    },

    /** Nâng khung hình lên `h` đơn vị (0 = bình thường), chuyển mượt */
    setLift(h, rate = 3) { liftTarget = h; liftRate = rate; },   // rate: tốc độ đuổi theo (lớn = nhanh)

    zoomBy(factor) {
        zoomTarget = THREE.MathUtils.clamp(zoomTarget * factor, ZOOM_MIN, ZOOM_MAX);
    },

    /** Rung màn hình dạng offset: không làm lệch vị trí camera thật */
    shake(intensity = 0.2, durationMs = 200) {
        if (!settings.shake) return;   // tắt rung màn hình (Tạm dừng -> Cài đặt)
        shake.intensity = Math.max(shake.intensity, intensity);
        shake.until = Math.max(shake.until, performance.now() + durationMs);
    },

    reset() { shake.intensity = 0; shake.until = 0; intro.t = 1; introFactor = 1; },

    /** Mở màn trận: bắt đầu xa gấp `from` lần rồi lướt vào trong `duration` giây */
    introZoom(from = 2.6, duration = 1.5) {
        intro.from = from; intro.duration = duration; intro.t = 0;
        introFactor = from;
        placeCamera();
    },

    update(dt) {
        const c = cfg();
        const kFollow = 1 - Math.exp(-FOLLOW_SHARPNESS * dt);
        const kBlend = 1 - Math.exp(-BLEND_SHARPNESS * dt);
        focus.lerp(target, kFollow);
        dist += (targetDist - dist) * kFollow;
        pitch += (THREE.MathUtils.degToRad(c.pitchDeg) - pitch) * kBlend;
        zoom += (zoomTarget - zoom) * (1 - Math.exp(-10 * dt));
        lift += (liftTarget - lift) * (1 - Math.exp(-liftRate * dt));
        if (intro.t < 1) {
            intro.t = Math.min(1, intro.t + dt / intro.duration);
            const e = 1 - Math.pow(1 - intro.t, 3); // chậm dần khi tới gần
            introFactor = intro.from + (1 - intro.from) * e;
        }
        if (Math.abs(camera.fov - c.fov) > 0.01) {
            camera.fov += (c.fov - camera.fov) * kBlend;
            camera.updateProjectionMatrix();
        }
        placeCamera();
    },

    /** Render một frame, cộng offset rung chỉ trong lúc vẽ rồi gỡ ra */
    render() {
        let ox = 0, oy = 0;
        if (performance.now() < shake.until) {
            ox = (Math.random() - 0.5) * shake.intensity;
            oy = (Math.random() - 0.5) * shake.intensity;
        } else {
            shake.intensity = 0;
        }
        camera.position.x += ox; camera.position.y += oy;
        renderer.render(scene, camera);
        camera.position.x -= ox; camera.position.y -= oy;
    },
};
