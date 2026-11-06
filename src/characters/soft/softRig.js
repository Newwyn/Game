// ============================================================
// KHUNG XƯƠNG MỀM (thử nghiệm) — nâng cấp nhân vật 2D ghép mảnh cho "mượt kiểu Spine"
// ============================================================
// Dựng trên buildCutout (cùng dữ liệu rig cũ), thêm 3 thứ:
//   1. Mảnh UỐN CONG được: tóc, áo choàng, khăn... thay tấm phẳng bằng lưới nhiều ô, mỗi khung bẻ cong lưới
//      quanh điểm khớp (đầu mảnh đứng yên, đuôi mảnh cong nhiều nhất).
//   2. LÒ XO quán tính: mảnh mềm tự đung đưa theo chuyển động của người (dừng lại thì tóc / áo còn lắc thêm).
//   3. ĐỔI MÀU (skin) bằng shader: vải đỏ -> màu khác, giáp bạc -> vàng / thép đen..., không cần vẽ lại.
import * as THREE from 'three';
import { buildCutout } from '../CutoutCharacterView.js';

// ---------- Màu skin dùng chung (shader đọc trực tiếp, đổi là thấy ngay) ----------
// cloth*: chỉ áp lên điểm ảnh màu ĐỎ đậm (vải áo choàng / khăn) — viền vàng, da, tóc giữ nguyên
// metal*: chỉ áp lên điểm ảnh gần như XÁM (giáp bạc) của các mảnh giáp
export function makeSkinUniforms() {
    return {
        uClothHue: { value: 0 },          // xoay sắc độ vải đỏ (0..1 vòng màu)
        uClothSat: { value: 1 },
        uClothVal: { value: 1 },
        uMetalTint: { value: new THREE.Color(1, 1, 1) },
        uMetalMix: { value: 0 },          // 0 = bạc gốc, 1 = phủ hẳn màu tint
        uMetalVal: { value: 1 },
    };
}
export function makeWeaponUniforms() {
    return {
        uBladeTint: { value: new THREE.Color(1, 1, 1) },
        uBladeMix: { value: 0 },
        uBladeGlow: { value: new THREE.Color(0, 0, 0) },
        uTime: { value: 0 },
    };
}

const HSV_GLSL = /* glsl */`
vec3 sr_rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));
vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;
return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 sr_hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);
return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
`;

/** Gắn shader đổi màu vào vật liệu của một mảnh. kind: 'cloth' | 'armor' | 'weapon' | 'plain' */
function patchMaterial(mat, kind, skinU, weaponU) {
    if (kind === 'plain') return;
    mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, skinU, kind === 'weapon' ? weaponU : {});
        let head = `${HSV_GLSL}
uniform float uClothHue, uClothSat, uClothVal, uMetalMix, uMetalVal; uniform vec3 uMetalTint;`;
        if (kind === 'weapon') head += 'uniform vec3 uBladeTint, uBladeGlow; uniform float uBladeMix, uTime;';
        let body = `
{
  vec3 hsv = sr_rgb2hsv(diffuseColor.rgb);`;
        // vải đỏ (chỉ áo choàng / khăn — da thuộc nâu ở giày, đai không bị đổi): sắc độ gần 0 (đỏ), đậm màu
        if (kind === 'cloth') body += `
  float red = (1.0 - smoothstep(0.03, 0.075, min(hsv.x, 1.0 - hsv.x))) * smoothstep(0.35, 0.55, hsv.y);
  vec3 cloth = sr_hsv2rgb(vec3(fract(hsv.x + uClothHue), clamp(hsv.y * uClothSat, 0., 1.), hsv.z * uClothVal));
  diffuseColor.rgb = mix(diffuseColor.rgb, cloth, red);`;
        if (kind === 'armor' || kind === 'weapon') body += `
  // giáp bạc: gần như không màu
  float grey = 1.0 - smoothstep(0.12, 0.26, hsv.y);
  float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  vec3 tinted = uMetalTint * (0.25 + 1.05 * lum) * uMetalVal;
  diffuseColor.rgb = mix(diffuseColor.rgb, tinted, grey * uMetalMix);`;
        if (kind === 'weapon') body += `
  float g2 = 1.0 - smoothstep(0.12, 0.3, hsv.y);
  vec3 bt = uBladeTint * (0.35 + 1.0 * lum);
  diffuseColor.rgb = mix(diffuseColor.rgb, bt, g2 * uBladeMix);
  float pulse = 0.75 + 0.25 * sin(uTime * 6.0);
  diffuseColor.rgb += uBladeGlow * g2 * pulse;`;
        body += '\n}\n';
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>\n${head}`)
            .replace('#include <map_fragment>', `#include <map_fragment>\n${body}`);
    };
    mat.customProgramCacheKey = () => `softrig-${kind}`;
}

/** Thay tấm phẳng của mảnh bằng lưới nhiều ô (giữ nguyên toạ độ ảnh), trả về dữ liệu để bẻ cong */
function subdivide(mesh, segX, segY) {
    const old = mesh.geometry;
    const { width, height } = old.parameters;
    const uv = old.getAttribute('uv').array; // [u0,v1, u1,v1, u0,v0, u1,v0]
    const geo = new THREE.PlaneGeometry(width, height, segX, segY);
    const u0 = uv[0], u1 = uv[2], v0 = uv[5], v1 = uv[1];
    const uvs = geo.getAttribute('uv');
    for (let i = 0; i < uvs.count; i++) uvs.setXY(i, u0 + (u1 - u0) * uvs.getX(i), v0 + (v1 - v0) * uvs.getY(i));
    old.dispose();
    mesh.geometry = geo;
    return { mesh, rest: geo.getAttribute('position').array.slice() };
}

/**
 * Dựng nhân vật mềm.
 * @param rig      dữ liệu rig cũ (VD ROK2_RIG)
 * @param soft     cấu hình: { kinds: {mảnh: 'cloth'|'armor'|'weapon'}, bend: {mảnh: {...}} }
 */
export function buildSoftRig(rig, texture, height, soft) {
    const unitsPerPx = height / rig.heightPx;
    const built = buildCutout(rig, texture, unitsPerPx);
    const skinU = makeSkinUniforms(), weaponU = makeWeaponUniforms();

    // vật liệu từng mảnh -> loại đổi màu
    for (const [name, joint] of Object.entries(built.parts)) {
        const kind = soft.kinds?.[name] ?? 'plain';
        joint.traverse(o => { if (o.isMesh && joint === findJoint(o, built.parts)) patchMaterial(o.material, kind, skinU, weaponU); });
    }

    // mảnh uốn cong
    const benders = [];
    for (const [name, cfg] of Object.entries(soft.bend ?? {})) {
        const joint = built.parts[name];
        if (!joint) continue;
        const art = joint.children.find(c => c.isGroup && !c.name.includes(':')) ?? joint.children[0];
        const mesh = art?.children.find(c => c.isMesh);
        if (!mesh) continue;
        const sd = subdivide(mesh, cfg.seg?.[0] ?? 6, cfg.seg?.[1] ?? 10);
        // điểm khớp trong toạ độ của lưới = gốc của art -> (-mesh.position)
        const px = -mesh.position.x, py = -mesh.position.y;
        // hướng "dọc mảnh": từ khớp ra phía xa nhất của lưới (chuẩn hoá theo độ dài)
        let maxD = 0, dir = new THREE.Vector2(0, -1);
        for (let i = 0; i < sd.rest.length; i += 3) {
            const dx = sd.rest[i] - px, dy = sd.rest[i + 1] - py, d = Math.hypot(dx, dy);
            if (d > maxD) { maxD = d; dir.set(dx, dy).normalize(); }
        }
        if (cfg.dir) dir.set(cfg.dir[0], cfg.dir[1]).normalize();
        benders.push({
            name, joint, art, mesh, rest: sd.rest, px, py, len: maxD, dir, cfg,
            // lò xo: góc cong theta, vận tốc omega
            theta: 0, omega: 0, wave: Math.random() * 6.28,
            lastPos: null, lastVel: new THREE.Vector2(), lastRot: null,
        });
    }
    return { ...built, unitsPerPx, skinU, weaponU, benders, height };
}

function findJoint(obj, parts) {
    for (let o = obj.parent; o; o = o.parent) if (parts[o.name] === o) return o;
    return null;
}

const _wp = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
/**
 * Cập nhật lò xo + bẻ cong lưới. Gọi mỗi khung SAU khi đặt tư thế (đã updateMatrixWorld).
 * facing: 1 nhìn phải, -1 nhìn trái (lật cả người)
 */
export function updateBenders(rigObj, dt, time, facing = 1) {
    if (dt <= 0) return;
    dt = Math.min(dt, 1 / 30);
    for (const b of rigObj.benders) {
        const c = b.cfg;
        b.joint.getWorldPosition(_wp);
        b.joint.getWorldQuaternion(_q);
        const worldRot = _e.setFromQuaternion(_q).z * facing;
        if (!b.lastPos) { b.lastPos = _wp.clone(); b.lastRot = worldRot; }
        const vx = (_wp.x - b.lastPos.x) / dt * facing, vy = (_wp.y - b.lastPos.y) / dt;
        const ax = (vx - b.lastVel.x) / dt, ay = (vy - b.lastVel.y) / dt;
        let dRot = worldRot - b.lastRot;
        dRot = Math.atan2(Math.sin(dRot), Math.cos(dRot));
        const angVel = dRot / dt;
        b.lastPos.copy(_wp); b.lastVel.set(vx, vy); b.lastRot = worldRot;

        // Lực: lò xo kéo về thế nghỉ (+ trọng lực giữ mảnh rủ xuống khi người nghiêng), quán tính đẩy ngược chiều gia tốc
        const rest = -(c.gravity ?? 0) * Math.atan2(Math.sin(worldRot), Math.cos(worldRot));
        const k = c.stiff ?? 60, d = c.damp ?? 7;
        const push = -(ax * (c.inertiaX ?? 0.02)) + ay * (c.inertiaY ?? 0) - angVel * (c.spin ?? 0.05) - vx * (c.drag ?? 0);
        const acc = -k * (b.theta - rest) - d * b.omega + push * k * 0.05;
        b.omega += acc * dt;
        b.theta += b.omega * dt;
        const lim = c.limit ?? [-1, 1];
        if (b.theta < lim[0]) { b.theta = lim[0]; b.omega *= -0.3; }
        if (b.theta > lim[1]) { b.theta = lim[1]; b.omega *= -0.3; }

        // gợn sóng (áo choàng / khăn bay): sóng chạy từ gốc ra đuôi, mạnh hơn khi đang chạy
        const speed = Math.min(1, Math.hypot(vx, vy) / 4);
        const waveAmp = (c.wave ?? 0) * (0.35 + speed);
        const breath = (c.breath ?? 0) * Math.sin(time * 2.2 + b.wave);

        bend(b, b.theta + breath, waveAmp, time * (c.waveSpeed ?? 7) + b.wave, c.pow ?? 1.6, c.waveLen ?? 2.2);
    }
}

/** Bẻ cong lưới: điểm cách khớp t (0..1 theo chiều dọc mảnh) xoay quanh khớp góc angle * t^pow (+ sóng) */
function bend(b, angle, waveAmp, phase, pow, waveLen) {
    const pos = b.mesh.geometry.getAttribute('position');
    const arr = pos.array, rest = b.rest;
    const dx0 = b.dir.x, dy0 = b.dir.y;
    for (let i = 0; i < arr.length; i += 3) {
        const rx = rest[i] - b.px, ry = rest[i + 1] - b.py;
        const along = Math.max(0, (rx * dx0 + ry * dy0) / b.len);
        const t = Math.min(1, along);
        const a = angle * Math.pow(t, pow) + waveAmp * t * Math.sin(phase - t * waveLen * 3.1416);
        const ca = Math.cos(a), sa = Math.sin(a);
        arr[i] = b.px + rx * ca - ry * sa;
        arr[i + 1] = b.py + rx * sa + ry * ca;
    }
    pos.needsUpdate = true;
}
