// ============================================================
// Bản đồ 3D — nạp mô hình (Kenney CC0, đã đóng gói bằng tools/pack_world3d.mjs vào src/assets/world3d/<bộ>/<tên>.glb)
//   proto('nature/tree_oak') -> [{ geo, mat }]: hình đã gộp biến đổi của các node con, dùng chung cho InstancedMesh
//   Biến thể màu: 'town/roof-high-gable@brown' — đổi các ô màu đỏ trong bảng màu của bộ thị trấn (mái nhà) sang nâu / xanh / rơm
// ============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const URLS = import.meta.glob('../assets/world3d/**/*.glb', { query: '?url', import: 'default', eager: true });   // chỉ là đường dẫn, mô hình tải khi cần
export const uTime = { value: 0 };   // thời gian chung cho cỏ cây lay gió
export const uHeroPos = { value: new THREE.Vector3(0, -999, 0) };     // tâm nhân vật chính (thế giới)
export const uCamPos = { value: new THREE.Vector3(0, 20, 20) };       // vị trí camera
const SEE_SMOOTH = typeof location === 'undefined' || new URLSearchParams(location.search).get('seeThrough') !== 'off';
export const uSeeThrough = { value: 1.0 };                            // 0..1: bật nhìn xuyên vật che (?seeThrough=off để tắt)
export const uQuality = { value: 1.0 };                               // 1 = high, 0 = low (giảm bớt hiệu ứng phụ khi máy yếu)

// bộ Nature (xanh ngọc) -> tông ấm như tranh nền của game
const RECOLOR = {
    grass: 0x7cb342, leafsGreen: 0x4f9a3a, leafsDark: 0x2f6b34, woodBark: 0x7a5233, woodBarkDark: 0x5e3e26, dirt: 0x8f6440,
    wood: 0xa8743f, woodDark: 0x7d5230, woodInner: 0xe2cda4, stone: 0xa7a396, stoneDark: 0x85827a, leafsFall: 0xd9822b,
};
const SWAY = { grass: 0.5, leafsGreen: 0.05, leafsDark: 0.05, leafsFall: 0.05 };
// đổi màu ô đỏ (mái) trong bảng màu bộ thị trấn
const ROOF = { brown: [150, 92, 58], straw: [196, 152, 84], blue: [64, 112, 196], red: null, slate: [92, 98, 112] };

/**
 * Gắn hiệu ứng cho vật liệu:
 *  - amp > 0: đung đưa theo gió (cỏ, hoa, tán cây, lúa)
 *  - occlude = true: khoét vòng tròn dither mềm mép quanh nhân vật khi vật che khuất camera
 *  - cloud = true: bóng mây nhẹ trôi chậm trên bề mặt
 */
export function patchMaterial(mat, { sway = 0, occlude = true, cloud = true } = {}) {
    if (mat.userData?._patched) return mat;
    mat.userData = { ...(mat.userData ?? {}), _patched: true };
    mat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = uTime;
        sh.uniforms.uHeroPos = uHeroPos;
        sh.uniforms.uCamPos = uCamPos;
        sh.uniforms.uSeeThrough = uSeeThrough;
        sh.vertexShader = 'uniform float uTime;\nvarying vec3 vWorldPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec4 swp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          #else
            vec4 swp = modelMatrix * vec4(position, 1.0);
          #endif
          ${sway > 0 ? `float shh = max(position.y, 0.0);
          float swx = sin(uTime * 1.6 + swp.x * 0.55 + swp.z * 0.35) * ${sway.toFixed(3)} * shh * shh;
          float swz = cos(uTime * 1.2 + swp.x * 0.4) * ${(sway * 0.6).toFixed(3)} * shh * shh;
          transformed.x += swx;
          transformed.z += swz;
          swp.x += swx; swp.z += swz;` : ''}
          vWorldPos = swp.xyz;`);
        sh.fragmentShader = 'uniform float uTime;\nuniform vec3 uHeroPos;\nuniform vec3 uCamPos;\nuniform float uSeeThrough;\nvarying vec3 vWorldPos;\n'
            + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
          ${occlude ? `if (uSeeThrough > 0.01 && vWorldPos.y > 0.32) {
            vec3 ch = uHeroPos - uCamPos;
            float chLen2 = dot(ch, ch);
            vec3 cp = vWorldPos - uCamPos;
            float tProj = dot(cp, ch) / max(chLen2, 0.001);
            if (tProj > 0.12 && tProj < 0.985) {
              vec3 closest = uCamPos + ch * tProj;
              vec3 diff = (vWorldPos - closest) * vec3(0.95, 0.68, 0.95);
              float dist = length(diff);
              float rOuter = 3.1;
              if (dist < rOuter) {
                // (12/11/2026) người chơi: "mờ chưa tới, thích mờ kiểu trong mờ 50%, không phải chấm lưới"
                //   -> mờ MỊN bằng độ trong thật (vật liệu transparent), giữa vòng còn 50% vật che, mép vòng tan dần
                float edge = smoothstep(0.9, rOuter, dist);
                float depthFade = smoothstep(0.985, 0.88, tProj);
                gl_FragColor.a *= mix(1.0, mix(0.5, 1.0, edge), uSeeThrough * depthFade);
              }
            }
          }` : ''}
          ${cloud ? `vec2 cUv = vWorldPos.xz * 0.075 + vec2(uTime * 0.018, uTime * 0.009);
          float cN = sin(cUv.x * 2.3 + cos(cUv.y * 1.9)) * cos(cUv.y * 2.1 - sin(cUv.x * 1.7));
          gl_FragColor.rgb *= 1.0 - smoothstep(0.15, 0.75, cN) * 0.11;` : ''}`);
    };
    if (occlude && SEE_SMOOTH) mat.transparent = true;   // cần cho độ trong thật quanh nhân vật (vẫn ghi độ sâu như vật đặc)
    mat.customProgramCacheKey = () => `w3d_${sway.toFixed(3)}_${occlude ? 1 : 0}_${cloud ? 1 : 0}`;
    return mat;
}

export function addSway(mat, amp) {
    return patchMaterial(mat, { sway: amp, occlude: true, cloud: true });
}

const loader = new GLTFLoader();
const protos = new Map();      // khoá 'bộ/tên' -> parts gốc
const variants = new Map();    // 'bộ/tên@biến thể' -> parts
const mats = new Map();        // 'bộ:tên vật liệu' -> material đã chỉnh
const loading = new Map();

function fixMaterial(kit, mat) {
    const key = kit + ':' + mat.name;
    if (mats.has(key)) return mats.get(key);
    const m = mat.clone();
    m.metalness = 0; m.roughness = 0.9;
    if (RECOLOR[m.name] != null) m.color.setHex(RECOLOR[m.name]);
    const sway = SWAY[m.name] ?? (m.name.startsWith('flower') ? 0.22 : 0);
    if (sway > 0 || m.name === 'grass') m.side = THREE.DoubleSide;
    patchMaterial(m, { sway, occlude: true, cloud: true });
    if (m.map) { m.map.magFilter = THREE.NearestFilter; m.map.colorSpace = THREE.SRGBColorSpace; }
    mats.set(key, m);
    return m;
}

async function loadOne(key) {
    if (protos.has(key)) return;
    if (!loading.has(key)) {
        const url = URLS[`../assets/world3d/${key}.glb`];
        if (!url) { console.warn('[world3d] thiếu mô hình', key); protos.set(key, []); return; }
        loading.set(key, (async () => {
            const g = await loader.loadAsync(url);
            g.scene.updateMatrixWorld(true);
            const kit = key.split('/')[0], parts = [];
            g.scene.traverse(o => {
                if (!o.isMesh) return;
                const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld);
                parts.push({ geo, mat: fixMaterial(kit, o.material) });
            });
            protos.set(key, parts);
        })().catch(e => { console.warn('[world3d] lỗi nạp', key, e); protos.set(key, []); }));
    }
    await loading.get(key);
}
/** Nạp trước danh sách mô hình (khoá có thể kèm @biến thể) */
export async function loadModels(keys) {
    await Promise.all([...new Set(keys.map(k => k.split('@')[0]))].map(loadOne));
}

const texVariant = new Map();
function recolorTexture(tex, rgb) {
    const id = tex.uuid + rgb.join(',');
    if (texVariant.has(id)) return texVariant.get(id);
    const img = tex.image, c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let k = 0; k < a.length; k += 4) {
        const R = a[k], G = a[k + 1], B = a[k + 2];
        if (R > 150 && R > G * 1.5 && R > B * 1.4) { const l = (R + G + B) / 3 / 110; a[k] = Math.min(255, rgb[0] * l); a[k + 1] = Math.min(255, rgb[1] * l); a[k + 2] = Math.min(255, rgb[2] * l); }
    }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.flipY = tex.flipY; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
    texVariant.set(id, t);
    return t;
}
/** Lấy hình mẫu: 'bộ/tên' hoặc 'bộ/tên@brown|blue|straw|slate|red' (đã nạp bằng loadModels) */
export function proto(key) {
    if (protos.has(key)) return protos.get(key);
    if (variants.has(key)) return variants.get(key);
    const [base, v] = key.split('@');
    const parts = protos.get(base);
    if (!parts) return [];
    const rgb = ROOF[v];
    const out = !rgb ? parts : parts.map(p => {
        if (!p.mat.map) return p;
        const mk = p.mat.uuid + '@' + v;
        if (!mats.has(mk)) {
            const m = p.mat.clone();
            m.map = recolorTexture(p.mat.map, rgb);
            m.userData = {};
            patchMaterial(m, { sway: 0, occlude: true, cloud: true });
            mats.set(mk, m);
        }
        return { geo: p.geo, mat: mats.get(mk) };
    });
    variants.set(key, out);
    return out;
}
