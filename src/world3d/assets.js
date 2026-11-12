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
// kiểu TRANH VẼ TAY (src/world3d/paint.js)
export const PAINT = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('paint') ?? 1) : 0;   // người chơi duyệt 12/11: BẬT sẵn, ?paint=0 để xem kiểu cũ
export const uQuality = { value: 1.0 };                               // 1 = high, 0 = low (giảm bớt hiệu ứng phụ khi máy yếu)

// bộ Nature (xanh ngọc) -> tông ấm như tranh nền của game
const RECOLOR = {
    grass: 0x7cb342, leafsGreen: 0x4f9a3a, leafsDark: 0x2f6b34, woodBark: 0x7a5233, woodBarkDark: 0x5e3e26, dirt: 0x8f6440,
    wood: 0xa8743f, woodDark: 0x7d5230, woodInner: 0xe2cda4, stone: 0xa7a396, stoneDark: 0x85827a, leafsFall: 0xd9822b,
};
const SWAY = { grass: 0.5, leafsGreen: 0.05, leafsDark: 0.05, leafsFall: 0.05 };
// đổi màu ô đỏ (mái) trong bảng màu bộ thị trấn
const ROOF = { brown: [150, 92, 58], straw: [196, 152, 84], blue: [64, 112, 196], red: null, slate: [92, 98, 112] };

// Chi tiết nhà kiểu tranh vẽ (12/11/2026, học cách Painted Valley vẽ nhà): hàng ngói trên mái dốc, ván gỗ dọc, hàng đá so le, vệt ố vôi cũ —
// vẽ thẳng trong shader từ toạ độ thế giới của mặt tường / mái, không cần hình dán.
const DETAIL_GLSL = `
  { vec3 fn = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    vec3 tg = normalize(cross(fn, vec3(0.0, 1.0, 0.0)) + vec3(0.0001, 0.0, 0.0));
    float du = dot(vWorldPos, tg);
    vec3 dc = diffuseColor.rgb; float dmx = max(dc.r, max(dc.g, dc.b)), dmn = min(dc.r, min(dc.g, dc.b)); float dsat = (dmx - dmn) / max(dmx, 0.001);
    float ay = abs(fn.y);
    if (ay > 0.25 && ay < 0.93) {                       // mái dốc: hàng ngói so le, mỗi viên một tông, hàng trên đổ bóng xuống hàng dưới
      float rowf = vWorldPos.y * 5.5; float row = floor(rowf); float fy = fract(rowf);
      float cu = du * 3.4 + mod(row, 2.0) * 0.5; float fu = fract(cu);
      float hh = fract(sin(floor(cu) * 12.9898 + row * 78.233) * 43758.5453);
      float sh = 1.0 + (hh - 0.5) * 0.24;
      sh *= mix(0.78, 1.06, smoothstep(0.0, 0.35, fy));
      sh *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.08, fu));
      diffuseColor.rgb *= sh;
    } else if (ay <= 0.25) {
      if (dsat > 0.28 && dc.r > dc.b) {                 // gỗ: ván dọc
        float cu = du * 4.2; float fu = fract(cu);
        float hh = fract(sin(floor(cu) * 91.7) * 43758.5453);
        diffuseColor.rgb *= (1.0 + (hh - 0.5) * 0.16) * (1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.07, fu)));
      } else if (dsat < 0.2) {                          // đá: hàng đá so le
        float rowf = vWorldPos.y * 2.8; float row = floor(rowf); float fy = fract(rowf);
        float cu = du * 1.7 + mod(row, 2.0) * 0.5; float fu = fract(cu);
        float hh = fract(sin(floor(cu) * 12.9898 + row * 78.233) * 43758.5453);
        diffuseColor.rgb *= (1.0 + (hh - 0.5) * 0.18) * (1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.06, fu))) * (1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.1, fy)));
      }
      float stn = sin(du * 1.3 + vWorldPos.y * 0.7) * sin(du * 0.37 - vWorldPos.y * 2.1);   // vệt ố loang
      diffuseColor.rgb *= 1.0 - 0.08 * smoothstep(0.2, 0.9, stn);
    } else if (dsat < 0.17 && dmx > 0.2) {              // mặt phẳng màu đá: ĐÁ LÁT kiểu phố cổ châu Âu — viên so le, mạch vữa sẫm, mỗi viên một tông
      vec2 cq = vWorldPos.xz * vec2(2.5, 3.3); float crow = floor(cq.y);
      cq.x += mod(crow, 2.0) * 0.5 + fract(sin(crow * 17.3) * 43.7) * 0.3;
      vec2 cf = fract(cq) - 0.5; float ch2 = fract(sin(floor(cq.x) * 12.9898 + crow * 78.233) * 43758.5453);
      float cd = length(max(abs(cf) - vec2(0.27, 0.25), 0.0));
      float mortar = smoothstep(0.11, 0.2, cd);
      float tone = 1.0 + (ch2 - 0.5) * 0.34 + (fract(ch2 * 7.13) - 0.5) * 0.10;
      diffuseColor.rgb *= mix(tone * vec3(1.0, 0.985, 0.95 + fract(ch2 * 3.7) * 0.08), vec3(0.58, 0.56, 0.55), mortar);
      diffuseColor.rgb *= 1.0 - cf.y * 0.12;            // viên đá hơi vồng: nửa trên sáng hơn
    } else if (dc.r > dc.g && dc.g > dc.b && dsat > 0.25 && dsat < 0.62) {   // đường đất: sỏi nhỏ + vệt bánh xe mờ
      vec2 pq = vWorldPos.xz * 6.0; vec2 pi2 = floor(pq); vec2 pf = fract(pq) - 0.5;
      float ph = fract(sin(dot(pi2, vec2(12.9898, 78.233))) * 43758.5453);
      float peb = (1.0 - smoothstep(0.10, 0.2, length(pf - (vec2(fract(ph * 5.3), fract(ph * 9.1)) - 0.5) * 0.5))) * step(0.72, ph);
      diffuseColor.rgb *= 1.0 + peb * 0.22 - 0.06 * smoothstep(0.3, 0.9, sin(vWorldPos.x * 0.8 + vWorldPos.z * 0.5) * sin(vWorldPos.z * 1.9));
    }
  }`;

/**
 * Gắn hiệu ứng cho vật liệu:
 *  - amp > 0: đung đưa theo gió (cỏ, hoa, tán cây, lúa)
 *  - occlude = true: khoét vòng tròn dither mềm mép quanh nhân vật khi vật che khuất camera
 *  - cloud = true: bóng mây nhẹ trôi chậm trên bề mặt
 */
export function patchMaterial(mat, { sway = 0, occlude = true, cloud = true, detail = false, fadeTo = 0.5, fadeR = 2.3 } = {}) {
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
            + (detail ? sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + DETAIL_GLSL) : sh.fragmentShader).replace('#include <dithering_fragment>', `#include <dithering_fragment>
          ${PAINT ? `{ // tranh vẽ: ít tông, chuyển tông gọn (sáng / vừa / khuất), chỗ khuất ngả lam
            float pl = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
            float st = pl * 6.0; float pb = (floor(st) + smoothstep(0.3, 0.7, fract(st)) + 0.5) / 6.5;
            gl_FragColor.rgb *= pb / max(pl, 0.0001);
            gl_FragColor.rgb = mix(gl_FragColor.rgb * vec3(0.80, 0.93, 1.20), gl_FragColor.rgb, smoothstep(0.06, 0.30, pl)); }` : ''}
          ${occlude ? `if (uSeeThrough > 0.01 && vWorldPos.y > 0.32) {
            vec3 ch = uHeroPos - uCamPos;
            float chLen2 = dot(ch, ch);
            vec3 cp = vWorldPos - uCamPos;
            float tProj = dot(cp, ch) / max(chLen2, 0.001);
            if (tProj > 0.12 && tProj < 0.985) {
              // (12/11/2026, lần 2) người chơi: "mờ 50% thì đúng rồi, nhưng muốn nó là cái VÒNG TRÒN quanh người"
              //   -> đo khoảng lệch so với tia camera->nhân vật rồi quy về độ sâu của nhân vật (chia tProj): trên màn hình ra đúng
              //      MỘT hình tròn cố định quanh người, mép gọn; trong vòng vật che còn 50%, có viền sáng mảnh cho rõ hình vòng
              // (12/11, lần 3) người chơi: KHÔNG có viền vòng, chỉ là vùng tròn mờ dịu kiểu blur: giữa còn 50%, ra mép tan dần
              float dist = length(cp - ch * tProj) / tProj;
              float rOuter = ${fadeR.toFixed(2)};
              if (dist < rOuter) {
                float k = uSeeThrough * smoothstep(0.985, 0.9, tProj);
                float inside = 1.0 - smoothstep(rOuter * 0.45, rOuter, dist);
                gl_FragColor.a *= mix(1.0, ${fadeTo.toFixed(2)}, inside * k);
              }
            }
          }` : ''}
          ${occlude && fadeTo < 0.45 ? `// (12/11) MÁI NHÀ: cắt mở cả vùng tròn quanh nhân vật (tính theo mặt đất), không chỉ phần che đúng người -> đi trong hẻm vẫn thấy lối, thấy vật cản hai bên
          if (uSeeThrough > 0.01 && vWorldPos.y > 1.2) {
            // chiếu mảnh mái theo tia nhìn xuống mặt đất: nếu nó che một điểm trong vòng tròn quanh nhân vật thì cắt mở -> luôn lộ ra MỘT VÒNG MẶT ĐẤT quanh người
            vec3 cr = vWorldPos - uCamPos; float tg = (uHeroPos.y + 0.1 - uCamPos.y) / min(cr.y, -0.001);
            vec2 gp = uCamPos.xz + cr.xz * tg - uHeroPos.xz;
            float cut = (1.0 - smoothstep(2.6, 3.8, length(gp * vec2(1.0, 1.25)))) * step(1.0, tg);
            gl_FragColor.a = min(gl_FragColor.a, mix(1.0, ${fadeTo.toFixed(2)}, cut * uSeeThrough));
          }` : ''}
          ${cloud ? `vec2 cUv = vWorldPos.xz * 0.075 + vec2(uTime * 0.018, uTime * 0.009);
          float cN = sin(cUv.x * 2.3 + cos(cUv.y * 1.9)) * cos(cUv.y * 2.1 - sin(cUv.x * 1.7));
          gl_FragColor.rgb *= 1.0 - smoothstep(0.15, 0.75, cN) * 0.11;` : ''}`);
    };
    if (occlude && SEE_SMOOTH) mat.transparent = true;   // cần cho độ trong thật quanh nhân vật (vẫn ghi độ sâu như vật đặc)
    mat.customProgramCacheKey = () => `w3d_${sway.toFixed(3)}_${occlude ? 1 : 0}_${cloud ? 1 : 0}_${PAINT}_${detail ? 1 : 0}_${fadeTo}_${fadeR}`;
    return mat;
}

export function addSway(mat, amp) {
    return patchMaterial(mat, { sway: amp, occlude: true, cloud: true });
}

const RICH_KITS = new Set(['village', 'qnature', 'dungeon']);
const loader = new GLTFLoader();
const protos = new Map();      // khoá 'bộ/tên' -> parts gốc
const variants = new Map();    // 'bộ/tên@biến thể' -> parts
const mats = new Map();        // 'bộ:tên vật liệu' -> material đã chỉnh
const loading = new Map();

function fixMaterial(kit, mat, roofPart = false) {
    const key = kit + ':' + mat.name + (roofPart ? ':roof' : '');
    if (mats.has(key)) return mats.get(key);
    const m = mat.clone();
    m.metalness = 0; m.roughness = 0.9;
    if (RICH_KITS.has(kit)) {   // bộ có hình dán thật (Quaternius, KayKit — CC0): giữ hình dán mịn, không tô lại màu, không vẽ thêm ngói / gạch bằng code
        m.vertexColors = false;   // màu đỉnh của bộ này là mặt nạ cho shader riêng của tác giả, không phải màu
        if (m.map) { m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = 4; }
        if (kit === 'village') m.side = THREE.DoubleSide;
        if (m.transparent || m.alphaTest > 0) { m.transparent = false; m.alphaTest = 0.5; m.side = THREE.DoubleSide; }
        // (12/11) người chơi: đi trong góc hẹp bị mái che, không thấy đường và vật cản -> MÁI NGÓI quanh nhân vật mờ gần hết (15%), vòng rộng hơn; tường vẫn mờ 50%
        const roof = kit === 'village' && (roofPart || /RoundTiles/i.test(m.name));
        patchMaterial(m, { sway: kit === 'qnature' && /leav|leaf|grass|flower/i.test(m.name) ? 0.05 : 0, occlude: true, cloud: true, detail: false, ...(roof ? { fadeTo: 0.1, fadeR: 3.4 } : {}) });
        mats.set(key, m);
        return m;
    }
    if (RECOLOR[m.name] != null) m.color.setHex(RECOLOR[m.name]);
    const sway = SWAY[m.name] ?? (m.name.startsWith('flower') ? 0.22 : 0);
    if (sway > 0 || m.name === 'grass') m.side = THREE.DoubleSide;
    patchMaterial(m, { sway, occlude: true, cloud: true, detail: !!PAINT && (kit === 'town' || kit === 'castle' || kit === 'graveyard') });
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
                parts.push({ geo, mat: fixMaterial(kit, o.material, /\/(Roof_|Prop_Chimney)/.test(key)) });   // mọi mảnh của mô hình MÁI (ngói, xà gỗ, đầu hồi) + ống khói: cùng cắt mở quanh nhân vật
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
            patchMaterial(m, { sway: 0, occlude: true, cloud: true, detail: !!PAINT });
            mats.set(mk, m);
        }
        return { geo: p.geo, mat: mats.get(mk) };
    });
    variants.set(key, out);
    return out;
}
