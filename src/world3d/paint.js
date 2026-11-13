// ============================================================
// Bản đồ 3D — KIỂU "TRANH VẼ TAY" (bản thử 12/11/2026, bật bằng ?paint=1)
//   Học cách làm từ Painted Valley của @blendi (mã MIT, https://patch.gg/blendi/painted-valley), viết lại cho góc nhìn từ trên xuống của game:
//   - Tán cây = nhiều CỤM, mỗi cụm là một quả cầu gồm các "chùm lá" (thẻ phẳng cắt theo hình lá), tô sáng như một quả cầu:
//     phía có nắng xanh vàng, phía khuất xanh lam đậm; mỗi chùm lá lệch tông một chút như nét cọ.
//   - Cỏ = hàng vạn ngọn mảnh, gốc đậm ngọn sáng, lay theo gió.
//   - Lớp hoàn thiện Kuwahara gom màu thành mảng như nét cọ, CHỪA nhân vật (nhân vật ghi alpha = 0).
// ============================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { uTime, uHeroPos, uCamPos, uSeeThrough, patchMaterial, PAINT } from './assets.js';

export { PAINT };

const TAU = Math.PI * 2;
const V3 = THREE.Vector3;
const SUN = new V3(-15, 19, -8).normalize();   // cùng hướng với đèn mặt trời trong view.js
const lin = (hex) => { const c = new THREE.Color(hex); return new V3(c.r, c.g, c.b); };   // màu sRGB -> tuyến tính cho shader

function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Một chùm lá, trắng trên đen: kênh xanh lá = chỗ có lá, kênh đỏ = lá đó tô sáng cỡ nào */
function leafTexture() {
    const size = 256, canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d'), random = mulberry(77);
    g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
    const leaf = (x, y, angle, len) => {
        const wid = len * (0.38 + random() * 0.18);
        g.fillStyle = `rgb(${120 + Math.floor(random() * 135)},255,0)`;
        g.save(); g.translate(x, y); g.rotate(angle);
        g.beginPath(); g.moveTo(-len / 2, 0); g.quadraticCurveTo(-len * 0.05, -wid, len / 2, 0); g.quadraticCurveTo(-len * 0.05, wid, -len / 2, 0); g.fill();
        g.restore();
    };
    for (let i = 0; i < 34; i++) {
        const a = (i / 34) * TAU * 2 + random() * 0.6, d = 20 + random() * 76;
        leaf(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, a + (random() - 0.5) * 1.5, 30 + random() * 26);
    }
    for (let i = 0; i < 10; i++) leaf(128 + (random() - 0.5) * 70, 128 + (random() - 0.5) * 70, random() * TAU, 32 + random() * 20);
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// vòng tròn mờ 50% quanh nhân vật khi vật che khuất (giống patchMaterial trong assets.js)
const OCCLUDE = `
  if (uSeeThrough > 0.01 && vWorld.y > 0.32) {
    vec3 ch = uHeroPos - uCamPos; vec3 cp = vWorld - uCamPos;
    float tProj = dot(cp, ch) / max(dot(ch, ch), 0.001);
    if (tProj > 0.12 && tProj < 0.985) {
      float dist = length(cp - ch * tProj) / tProj; float rOuter = 2.3;
      if (dist < rOuter) {
        float k = uSeeThrough * smoothstep(0.985, 0.9, tProj);
        float inside = 1.0 - smoothstep(rOuter * 0.45, rOuter, dist);
        // (13/11) tán cây chỉ mờ 50% và vẫn ghi độ sâu -> nhân vật đứng sau cây vẫn bị che ("kẹt cái cây"). Lõi vòng tròn bỏ hẳn điểm ảnh, mép mờ dần.
        float f = inside * k;
        if (f > 0.6) discard;
        gl_FragColor.a *= mix(1.0, 0.25, f / 0.6);
      }
    }
  }`;
const CLOUD = `
  { vec2 cUv = vWorld.xz * 0.075 + vec2(uTime * 0.018, uTime * 0.009);
    float cN = sin(cUv.x * 2.3 + cos(cUv.y * 1.9)) * cos(cUv.y * 2.1 - sin(cUv.x * 1.7));
    gl_FragColor.rgb *= 1.0 - smoothstep(0.15, 0.75, cN) * 0.13; }`;

const leafVertex = `
  attribute vec3 aBall; attribute vec3 aRand;
  uniform float uTime;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vBall; varying vec3 vRand;
  #include <fog_pars_vertex>
  void main() {
    mat4 m = modelMatrix * instanceMatrix;
    vec4 w = m * vec4(position, 1.0);
    // lá rung nhẹ theo gió, mỗi chùm một nhịp
    float ph = uTime * 1.3 + w.x * 0.6 + w.z * 0.45 + aRand.y * 6.28;
    w.x += sin(ph) * 0.035; w.z += cos(ph * 0.8) * 0.025; w.y += sin(ph * 1.7) * 0.012;
    vWorld = w.xyz; vUv = uv; vRand = aRand;
    vBall = normalize(mat3(m) * aBall);
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const RAMP = `
  vec3 ramp(float tone) {
    vec3 col = mix(uC0, uC1, smoothstep(0.30, 0.42, tone));
    col = mix(col, uC2, smoothstep(0.54, 0.66, tone));
    col = mix(col, uC3, smoothstep(0.80, 0.90, tone));
    return col;
  }`;
const leafFragment = `
  uniform sampler2D tLeaf; uniform float uTime; uniform vec3 uSun, uHeroPos, uCamPos, uC0, uC1, uC2, uC3; uniform float uSeeThrough;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vBall; varying vec3 vRand;
  #include <fog_pars_fragment>
  ${RAMP}
  void main() {
    vec4 leaf = texture2D(tLeaf, vUv);
    if (leaf.g < 0.45) discard;
    // mỗi cụm tô sáng như một quả cầu; mỗi chùm lá, mỗi chiếc lá lệch một tông như nét cọ
    float tone = dot(normalize(vBall), uSun) * 0.5 + 0.5;
    tone = tone * mix(0.72, 1.0, vRand.z) + 0.08 + (vRand.x - 0.5) * 0.30 + (leaf.r / max(leaf.g, 0.05) - 0.75) * 0.42;
    gl_FragColor = vec4(ramp(tone) * 2.1, 1.0);   // x2.1: cùng độ sáng với vật được đèn mặt trời chiếu
    ${CLOUD}
    ${OCCLUDE}
    #include <fog_fragment>
  }`;
const coreFragment = `
  uniform sampler2D tLeaf; uniform float uTime; uniform vec3 uSun, uHeroPos, uCamPos, uC0, uC1, uC2, uC3; uniform float uSeeThrough;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vBall; varying vec3 vRand;
  #include <fog_pars_fragment>
  ${RAMP}
  void main() {
    // lõi tán: tối hơn một tông (bên trong tán cây), vẫn chia mảng sáng / khuất
    float n = sin(vWorld.x * 7.0 + vWorld.y * 5.0) * sin(vWorld.z * 6.3 - vWorld.y * 4.0);
    float tone = dot(normalize(vBall), uSun) * 0.5 + 0.5;
    tone = tone * mix(0.7, 0.95, vRand.z) + n * 0.10 - 0.08;
    gl_FragColor = vec4(ramp(min(tone, 0.74)) * 1.9, 1.0);
    ${CLOUD}
    ${OCCLUDE}
    #include <fog_fragment>
  }`;

/** Dựng hình một kiểu tán: { leaves, core } (hai BufferGeometry), cây đứng ở gốc toạ độ, cao khoảng 1 đơn vị */
function growCrown(seed, o) {
    const random = mulberry(seed);
    const pos = [], uv = [], ball = [], rnd = [], idx = [];
    const cores = [];
    const crownC = new V3(0, o.y, 0);
    const clumps = [];
    if (o.pine) {   // thông: các tầng lá nhỏ dần lên ngọn
        const tiers = 5;
        for (let t = 0; t < tiers; t++) {
            const f = t / (tiers - 1), yy = 0.34 + f * 0.86, rr = o.r * (1 - f * 0.86), cr = o.clump * (1 - f * 0.5);
            const ring = t === tiers - 1 ? 1 : Math.max(3, 5 - t);
            for (let i = 0; i < ring; i++) {
                const a = (i / ring) * TAU + t * 0.9 + random() * 0.4, d = ring === 1 ? 0 : rr * 0.7;
                clumps.push({ c: new V3(Math.cos(a) * d, yy + (random() - 0.5) * 0.05, Math.sin(a) * d), r: cr * (0.9 + random() * 0.25), z: 0.35 + random() * 0.65 });
            }
        }
    } else for (let i = 0; i < o.clumps; i++) {
        const a = (i / o.clumps) * TAU + random() * 0.8, top = i === 0;
        const d = top ? 0 : o.r * (0.45 + random() * 0.4);
        const c = new V3(Math.cos(a) * d, o.y + (top ? o.r * 0.42 : (random() - 0.35) * o.r * 0.55), Math.sin(a) * d);
        clumps.push({ c, r: o.clump * (top ? 1.15 : 0.82 + random() * 0.36), z: 0.35 + random() * 0.65 });
    }
    const X = new V3(), Yv = new V3(), n = new V3(), p = new V3();
    for (const cl of clumps) {
        const out = cl.c.clone().sub(crownC); if (out.lengthSq() < 1e-4) out.set(0, 1, 0); out.normalize();
        for (let k = 0; k < o.cards; k++) {
            // hướng chùm lá: ưu tiên nửa trên (nhìn từ trên xuống thấy nóc tán)
            const u = random() * TAU, v = Math.acos(1 - random() * 1.45);
            n.set(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u));
            p.copy(cl.c).addScaledVector(n, cl.r * (0.72 + random() * 0.22));
            // thẻ phẳng vuông góc với hướng n, xoay ngẫu nhiên
            X.set(-n.z, 0, n.x); if (X.lengthSq() < 1e-4) X.set(1, 0, 0); X.normalize();
            Yv.crossVectors(n, X).normalize();
            const roll = random() * TAU, cs = Math.cos(roll), sn = Math.sin(roll), s = cl.r * (0.78 + random() * 0.4);
            const ex = X.clone().multiplyScalar(cs).addScaledVector(Yv, sn).multiplyScalar(s), ey = X.clone().multiplyScalar(-sn).addScaledVector(Yv, cs).multiplyScalar(s);
            const b = n.clone().multiplyScalar(0.62).addScaledVector(out, 0.38).normalize();
            const r3 = [random(), random(), cl.z], base = pos.length / 3;
            for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
                pos.push(p.x + ex.x * sx + ey.x * sy, p.y + ex.y * sx + ey.y * sy, p.z + ex.z * sx + ey.z * sy);
                uv.push(sx * 0.5 + 0.5, sy * 0.5 + 0.5); ball.push(b.x, b.y, b.z); rnd.push(...r3);
            }
            idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
        // lõi cụm: quả cầu thô, tô theo pháp tuyến cầu
        const g = new THREE.IcosahedronGeometry(cl.r * 0.8, 1);
        const gp = g.attributes.position, gb = new Float32Array(gp.count * 3), gr = new Float32Array(gp.count * 3);
        for (let i = 0; i < gp.count; i++) {
            n.fromBufferAttribute(gp, i).normalize().multiplyScalar(0.62).addScaledVector(out, 0.38).normalize();
            gb.set([n.x, n.y, n.z], i * 3); gr.set([0.5, 0.5, cl.z], i * 3);
        }
        g.translate(cl.c.x, cl.c.y, cl.c.z);
        g.setAttribute('aBall', new THREE.BufferAttribute(gb, 3)); g.setAttribute('aRand', new THREE.BufferAttribute(gr, 3));
        g.deleteAttribute('normal');
        cores.push(g.index ? g.toNonIndexed() : g);
    }
    const leaves = new THREE.BufferGeometry();
    leaves.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    leaves.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    leaves.setAttribute('aBall', new THREE.Float32BufferAttribute(ball, 3));
    leaves.setAttribute('aRand', new THREE.Float32BufferAttribute(rnd, 3));
    leaves.setIndex(idx);
    return { leaves, core: mergeGeometries(cores) };
}

const KINDS = {
    round: [
        { y: 0.74, r: 0.40, clump: 0.25, clumps: 7, cards: 13, trunk: 0.5 },    // tán tròn đầy
        { y: 0.82, r: 0.34, clump: 0.23, clumps: 6, cards: 12, trunk: 0.6 },    // cao, thon
        { y: 0.66, r: 0.46, clump: 0.24, clumps: 8, cards: 12, trunk: 0.42 },   // thấp, xoè rộng
    ],
    pine: [
        { y: 0.7, r: 0.36, clump: 0.2, cards: 9, trunk: 0.36, pine: true },
        { y: 0.7, r: 0.30, clump: 0.18, cards: 9, trunk: 0.42, pine: true },
    ],
};
KINDS.apple = [KINDS.round[2]];
const PALETTES = {
    green: ['#173f3d', '#2b6a3c', '#55a03a', '#a6d24c'],
    autumn: ['#4a2a22', '#8a4a22', '#cf7a24', '#f2b83e'],
    dark: ['#10302f', '#1f5038', '#3c7f3a', '#7fb548'],
    pine: ['#0e2b30', '#1a4a3c', '#2c7446', '#69a84e'],
    apple: ['#1b4638', '#2f703a', '#5fa83c', '#b2d850'],
};

/** Tên mô hình cây của bộ Kenney -> [kiểu tán, bảng màu] của cây vẽ tay (để cả game chỉ còn MỘT kiểu cây) */
export function treeStyleOf(key) {
    const pine = /pine|cone|tall/i.test(key);
    const pal = /fall/i.test(key) ? 'autumn' : /_dark/i.test(key) ? 'dark' : pine ? 'pine' : 'green';
    return [pine ? 'pine' : 'round', pal];
}

let LEAF_TEX = null;
/**
 * Trồng cây kiểu tranh vẽ. spots: [x, z, cỡ, gần?, kiểu = 'round' | 'pine' | 'apple', bảng màu = 'green' | 'dark' | 'autumn' | 'pine' | 'apple']
 *   cây "gần" (trong vùng chơi) có đủ chùm lá, cây xa chỉ có lõi tán cho nhẹ.
 */
export function paintTrees(group, spots) {
    if (!spots.length) return;
    const tLeaf = LEAF_TEX ??= leafTexture();
    const woodMat = patchMaterial(new THREE.MeshLambertMaterial({ color: 0x6a4a30 }), { sway: 0, occlude: true, cloud: true });
    const appleMat = patchMaterial(new THREE.MeshLambertMaterial({ color: 0xe23b2e }), { sway: 0, occlude: true, cloud: false });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Yax = new V3(0, 1, 0), v1 = new V3(), v2 = new V3();
    const random = mulberry(4242);
    const buckets = new Map();
    spots.forEach((sp, i) => {
        const type = KINDS[sp[4]] ? sp[4] : 'round', pal = PALETTES[sp[5]] ? sp[5] : (type === 'pine' ? 'pine' : type === 'apple' ? 'apple' : 'green');
        const ki = i % KINDS[type].length, k = `${type}|${pal}|${ki}|${Math.floor(sp[0] / 10)},${Math.floor(sp[1] / 10)}`;   // + khoảnh 10×10 ô -> cây ngoài màn hình không phải vẽ
        if (!buckets.has(k)) buckets.set(k, { type, pal, ki, list: [] });
        buckets.get(k).list.push(sp);
    });
    const put = (geo, mat, list, shadow) => {
        const im = new THREE.InstancedMesh(geo, mat, list.length);
        list.forEach((m, k) => im.setMatrixAt(k, m));
        im.castShadow = shadow; im.receiveShadow = false; im.computeBoundingSphere(); if (im.boundingSphere) im.boundingSphere.radius += 0.8;
        group.add(im); return im;
    };
    const shared = new Map();
    for (const { type, pal, ki, list } of buckets.values()) {
        const kind = KINDS[type][ki], cols = PALETTES[pal].map(lin);
        const sk = `${type}|${pal}|${ki}`;
        const uniforms = () => ({
            ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
            tLeaf: { value: tLeaf }, uTime, uHeroPos, uCamPos, uSeeThrough, uSun: { value: SUN },
            uC0: { value: cols[0] }, uC1: { value: cols[1] }, uC2: { value: cols[2] }, uC3: { value: cols[3] },
        });
        if (!shared.has(sk)) {
            const g2 = growCrown(100 + ki * 17 + (type === 'pine' ? 50 : 0), kind);
            const tr = new THREE.CylinderGeometry(type === 'pine' ? 0.035 : 0.045, type === 'pine' ? 0.06 : 0.075, kind.trunk + 0.2, 7); tr.translate(0, (kind.trunk + 0.2) / 2 - 0.05, 0);
            shared.set(sk, { ...g2, trunk: tr,
                leafMat: new THREE.ShaderMaterial({ vertexShader: leafVertex, fragmentShader: leafFragment, uniforms: uniforms(), side: THREE.DoubleSide, transparent: true, fog: true }),
                coreMat: new THREE.ShaderMaterial({ vertexShader: leafVertex, fragmentShader: coreFragment, uniforms: uniforms(), transparent: true, fog: true }) });
        }
        const { leaves, core, trunk, leafMat, coreMat } = shared.get(sk);
        const mats = list.map(([x, z, sc]) => m4.clone().compose(v1.set(x, 0, z), q.setFromAxisAngle(Yax, random() * TAU), v2.set(sc, sc * (0.92 + random() * 0.2), sc)));
        put(core, coreMat, mats, true);
        put(trunk, woodMat, mats, true).receiveShadow = true;
        const nearMats = mats.filter((_, i) => list[i][3] !== false);
        if (nearMats.length) { const lv = put(leaves, leafMat, nearMats, false); lv.renderOrder = 2; lv.userData.noAO = true; }   // (13/11) tấm lá trong suốt bị lớp tối góc coi là vật đặc -> vệt tối góc cạnh quanh tán cây
        if (type === 'apple') {   // táo đỏ lấp ló trên tán
            const ball = new THREE.IcosahedronGeometry(0.045, 1), pts = [];
            const ar = mulberry(77 + ki);
            for (let i = 0; i < 11; i++) {
                const u = ar() * TAU, v = 0.35 + ar() * 1.15;
                pts.push(new V3(Math.sin(v) * Math.cos(u), Math.cos(v) * 0.75, Math.sin(v) * Math.sin(u)).multiplyScalar(kind.r * 1.02).add(new V3(0, kind.y + 0.02, 0)));
            }
            const all = [];
            for (const m of mats) for (const pt of pts) all.push(m.clone().multiply(new THREE.Matrix4().makeTranslation(pt.x, pt.y, pt.z)));
            put(ball, appleMat, all, false).renderOrder = 3;
        }
    }
}

/**
 * Cỏ kiểu nét cọ: mỗi bụi 6 ngọn mảnh, gốc đậm ngọn sáng. tiles: [x, z, y, tông 0..1] (toạ độ ô), perTile: số bụi mỗi ô.
 */
export function paintGrass(group, tiles, perTile = 7, bright = 1) {
    if (!tiles.length) return;
    const random = mulberry(909);
    const blades = [];
    for (let b = 0; b < 6; b++) {
        const a = random() * TAU, d = random() * 0.2, h = 0.19 + random() * 0.16, w = 0.04 + random() * 0.03;
        const lean = (random() - 0.5) * 0.14, la = random() * TAU, face = random() * TAU;
        const bx = Math.cos(a) * d, bz = Math.sin(a) * d, fx = Math.cos(face) * w, fz = Math.sin(face) * w, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
        const g = new THREE.BufferGeometry();
        // 5 đỉnh: 2 gốc, 2 lưng chừng, 1 ngọn (ngọn nghiêng theo lean)
        const P = [bx - fx, 0, bz - fz, bx + fx, 0, bz + fz, bx - fx * 0.7 + lx * 0.4, h * 0.55, bz - fz * 0.7 + lz * 0.4, bx + fx * 0.7 + lx * 0.4, h * 0.55, bz + fz * 0.7 + lz * 0.4, bx + lx, h, bz + lz];
        const C = [0.4, 0.4, 0.82, 0.82, 1.4].flatMap(c => [c, c, c]);
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(15).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
        g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
        blades.push(g);
    }
    const geo = mergeGeometries(blades);
    const mat = patchMaterial(new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }), { sway: 0.6, occlude: false, cloud: true });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Yax = new V3(0, 1, 0), v1 = new V3(), v2 = new V3(), col = new THREE.Color();
    // (12/11/2026) tối ưu KHÔNG đổi hình: chia cỏ theo khoảnh 8×8 ô, mỗi khoảnh một lưới riêng -> khoảnh ngoài màn hình không phải vẽ
    for (const cell of chunkTiles(tiles)) {
    const im = new THREE.InstancedMesh(geo, mat, cell.length * perTile);
    let k = 0;
    for (const [x, z, y, tone, size = 1] of cell) for (let j = 0; j < perTile; j++, k++) {   // size: cỡ cỏ riêng của ô (trận đấu nhìn gần -> cỏ nhỏ)
        const s = (0.8 + random() * 0.75) * size;
        m4.compose(v1.set(x + random(), y, z + random()), q.setFromAxisAngle(Yax, random() * TAU), v2.set(s, s * (0.8 + random() * 0.5), s));
        im.setMatrixAt(k, m4);
        // hai tông cỏ của đồng (đậm / sáng) pha theo mảng lớn + lệch ngẫu nhiên từng bụi
        const t = Math.min(1, Math.max(0, tone + (random() - 0.5) * 0.5));
        im.setColorAt(k, col.setHSL(0.275 - t * 0.055, 0.52 + t * 0.1, (0.30 + t * 0.17) * bright));
    }
    im.receiveShadow = true; im.castShadow = false; im.computeBoundingSphere(); if (im.boundingSphere) im.boundingSphere.radius += 0.6;
    group.add(im);
    }
    paintFlowers(group, tiles, bright);
}

/** Gom ô theo khoảnh size×size */
function chunkTiles(list, size = 8) {
    const cells = new Map();
    for (const t of list) { const k = `${Math.floor(t[0] / size)},${Math.floor(t[1] / size)}`; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(t); }
    return [...cells.values()];
}

/** Hoa dại (học từ Painted Valley): từng đốm hoa nhỏ trắng / vàng / hồng / tím mọc thành đám trong cỏ, lay theo gió */
function paintFlowers(group, tiles, bright = 1) {
    const random = mulberry(1717), spots = [];
    for (const [x, z, y, , size = 1] of tiles) {
        const cluster = Math.sin(x * 0.9 + z * 0.4) * Math.cos(z * 0.7 - x * 0.3);
        const n = cluster > 0.35 ? 3 : random() < 0.1 ? 1 : 0;
        const hue = cluster > 0.6 ? 0 : cluster > 0.45 ? 1 : Math.floor(random() * 4);
        for (let j = 0; j < n; j++) spots.push([x + random(), y, z + random(), size, (hue + (random() < 0.25 ? 1 : 0)) % 4]);
    }
    if (!spots.length) return;
    const head = new THREE.CircleGeometry(0.055, 6); head.rotateX(-Math.PI / 2 + 0.5); head.translate(0, 0.25, 0);
    const hc = new Float32Array(head.attributes.position.count * 3).fill(1); hc.set([1.5, 1.4, 0.6], 0);   // nhuỵ vàng ở giữa
    head.setAttribute('color', new THREE.BufferAttribute(hc, 3));
    const stem = new THREE.BufferGeometry();
    stem.setAttribute('position', new THREE.Float32BufferAttribute([-0.008, 0, 0, 0.008, 0, 0, 0, 0.25, 0], 3));
    stem.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    stem.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
    stem.setAttribute('color', new THREE.Float32BufferAttribute([0.2, 0.5, 0.15, 0.2, 0.5, 0.15, 0.3, 0.6, 0.2], 3));
    stem.setIndex([0, 1, 2]);
    const geo = mergeGeometries([head, stem]);
    const mat = patchMaterial(new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }), { sway: 0.6, occlude: false, cloud: true });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Yax = new V3(0, 1, 0), v1 = new V3(), v2 = new V3(), col = new THREE.Color();
    const HUES = [[0.0, 0.0, 0.97], [0.14, 0.95, 0.62], [0.93, 0.7, 0.72], [0.75, 0.55, 0.7]];   // trắng · vàng · hồng · tím
    const cells = new Map();
    for (const sp of spots) { const k = `${Math.floor(sp[0] / 8)},${Math.floor(sp[2] / 8)}`; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(sp); }
    for (const cell of cells.values()) {
    const im = new THREE.InstancedMesh(geo, mat, cell.length);
    cell.forEach(([x, y, z, size, hue], k) => {
        const sc = (0.9 + random() * 0.6) * size;
        m4.compose(v1.set(x, y, z), q.setFromAxisAngle(Yax, random() * TAU), v2.set(sc, sc * (0.8 + random() * 0.5), sc));
        im.setMatrixAt(k, m4);
        const [h, sa, l] = HUES[hue];
        im.setColorAt(k, col.setHSL(h, sa, Math.min(1, l * bright)));
    });
    im.receiveShadow = true; im.computeBoundingSphere(); if (im.boundingSphere) im.boundingSphere.radius += 0.6;
    group.add(im);
    }
}

/** Hạt bồ công anh / bụi sáng bay theo gió quanh một vùng (box: [x0, z0, x1, z1], y0..y1). Trả về hàm cập nhật (t). */
export function paintSeeds(group, box, { count = 70, y0 = 0.4, y1 = 3.2, color = 0xffffff, size = 0.07, follow = false } = {}) {
    const random = mulberry(555), pos = new Float32Array(count * 3), seeds = [];
    for (let i = 0; i < count; i++) seeds.push([random(), random(), random(), 0.25 + random() * 0.5, random() * TAU]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.75, depthWrite: false, fog: false, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 4;
    group.add(pts);
    return (t) => {
        let [x0, z0, x1, z1] = box;
        if (follow) { const h = uHeroPos.value; x0 = h.x - 11; x1 = h.x + 11; z0 = h.z - 9; z1 = h.z + 7; }
        const w = x1 - x0, d = z1 - z0;
        for (let i = 0; i < count; i++) {
            const [a, b, c, v, ph] = seeds[i];
            const fx = ((a + t * v * 0.02) % 1 + 1) % 1, fz = ((c + t * v * 0.006) % 1 + 1) % 1;
            pos[i * 3] = x0 + (follow ? ((fx * w + x0 * 0) % w) : fx * w);
            pos[i * 3 + 1] = y0 + (y1 - y0) * (0.5 + 0.5 * Math.sin(t * 0.35 * v + ph)) * b + Math.sin(t * 1.3 + ph) * 0.08;
            pos[i * 3 + 2] = z0 + fz * d + Math.sin(t * 0.5 + ph) * 0.3;
        }
        geo.attributes.position.needsUpdate = true;
    };
}

/** Nền trời vẽ tay sau sân đấu: chuyển màu từ chân trời nhạt lên đỉnh trời xanh, kèm quầng sáng ấm phía mặt trời */
export function paintBackSky(group, { zenith = '#4a97df', horizon = '#dff1f6', glow = '#fff3d6' } = {}) {
    const mat = new THREE.ShaderMaterial({
        depthWrite: false, fog: false,
        uniforms: { uZ: { value: lin(zenith) }, uH: { value: lin(horizon) }, uG: { value: lin(glow) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uZ, uH, uG; varying vec2 vUv;
          void main(){ float h = smoothstep(0.0, 0.85, vUv.y);
            vec3 c = mix(uH, uZ, pow(h, 0.8));
            c = mix(c, uG, (1.0 - smoothstep(0.0, 0.55, distance(vUv, vec2(0.22, 0.2)))) * 0.55);
            gl_FragColor = vec4(c * 1.35, 1.0); }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(190, 60), mat);
    mesh.position.set(0, 22, -47); mesh.renderOrder = -10; mesh.frustumCulled = false;
    group.add(mesh);
}

/** Không khí HẦM NGỤC / HANG: các luồng sáng rọi chéo từ trên xuống + bụi sáng lơ lửng + quầng lửa đuốc. kind: 'warm' (đuốc, mỏ) | 'cold' (hầm mộ, tháp) */
export function paintDungeon(group, kind = 'warm', seedNo = 1, cave = true) {
    const random = mulberry(seedNo * 13 + 5);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256;
    const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    const shaftTex = new THREE.CanvasTexture(cv);
    const dot = document.createElement('canvas'); dot.width = dot.height = 64;
    const dg = dot.getContext('2d'), rg = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.35, 'rgba(255,255,255,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    dg.fillStyle = rg; dg.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(dot);
    const tone = kind === 'cold' ? 0x9fc4ff : 0xffc98a, fire = kind === 'cold' ? 0x8fd0ff : 0xffa040;
    const shafts = [], glows = [];
    for (let i = 0; i < 6; i++) {
        const mat = new THREE.MeshBasicMaterial({ map: shaftTex, color: tone, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2 + random() * 1.6, 9), mat);
        m.position.set(-18 + i * 7.2 + (random() - 0.5) * 3, 4.2, -6.4 - random() * 1.5); m.rotation.z = -0.32 - random() * 0.1; m.renderOrder = 3; m.frustumCulled = false;
        group.add(m); shafts.push({ mat, ph: random() * TAU, base: 0.24 + random() * 0.14 });
    }
    for (let i = 0; i < 7; i++) {   // quầng lửa đuốc dọc tường sau
        const mat = new THREE.SpriteMaterial({ map: glowTex, color: fire, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        const sp = new THREE.Sprite(mat); sp.position.set(-19.5 + i * 6.5, (cave ? 2.1 : 3.4) + random() * 0.4, cave ? -6.9 : -6.6); sp.scale.setScalar(2.6); sp.renderOrder = 3;
        group.add(sp); glows.push({ sp, mat, ph: random() * TAU });
    }
    // nhũ đá rủ từ trần + măng đá dưới chân tường: khung cảnh hang động (hình nón tối màu, có mặt sáng mặt khuất)
    const rockMat = new THREE.MeshLambertMaterial({ color: kind === 'cold' ? 0x4a5670 : 0x5e4a3c, flatShading: true });
    const cone = new THREE.ConeGeometry(0.5, 1, 6), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v1 = new V3(), v2 = new V3();
    const rocks = new THREE.InstancedMesh(cone, rockMat, cave ? 46 : 0);
    for (let i = 0; i < (cave ? 46 : 0); i++) {
        const hang = i < 28, x = -23 + random() * 46, hgt = hang ? 1.2 + random() * 2.6 : 0.7 + random() * 1.5;
        m4.compose(v1.set(x, hang ? 8.6 - hgt / 2 : hgt / 2, hang ? -6.2 - random() * 3 : -6.3 - random() * 1.2), q.setFromEuler(e.set(hang ? Math.PI : 0, random() * 6, (random() - 0.5) * 0.15)), v2.set(0.7 + random() * 0.9, hgt, 0.7 + random() * 0.9));
        rocks.setMatrixAt(i, m4);
    }
    rocks.frustumCulled = false; if (cave) group.add(rocks);
    // pha lê phát sáng mọc thành cụm (mỏ: lam ngọc · hầm mộ: tím lam)
    const crysMat = new THREE.MeshBasicMaterial({ color: kind === 'cold' ? 0xa9b8ff : 0x6fe0ff, fog: false });
    const crys = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.3, 0), crysMat, 30);
    for (let c = 0; c < (cave ? 6 : 0); c++) {
        const cx = -19 + c * 7.6 + (random() - 0.5) * 3, cz = -6.5 - random() * 0.8;
        for (let j = 0; j < 5; j++) {
            const hgt = 0.8 + random() * 1.5;
            m4.compose(v1.set(cx + (random() - 0.5) * 1.1, hgt * 0.3, cz + (random() - 0.5) * 0.5), q.setFromEuler(e.set((random() - 0.5) * 0.7, random() * 6, (random() - 0.5) * 0.7)), v2.set(0.55 + random() * 0.4, hgt, 0.55 + random() * 0.4));
            crys.setMatrixAt(c * 5 + j, m4);
        }
        const gm = new THREE.SpriteMaterial({ map: glowTex, color: kind === 'cold' ? 0x8f9cff : 0x4fd0ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        const gs = new THREE.Sprite(gm); gs.position.set(cx, 0.9, cz + 0.3); gs.scale.setScalar(4.2); gs.renderOrder = 3; group.add(gs);
        glows.push({ sp: gs, mat: gm, ph: random() * TAU, slow: true });
    }
    crys.frustumCulled = false; if (cave) group.add(crys);
    const dust = paintSeeds(group, [-22, -8, 22, 6], { count: 110, y0: 0.3, y1: 5, color: tone, size: 0.09 });
    return (t) => {
        dust(t * 0.6);
        for (const s2 of shafts) s2.mat.opacity = s2.base * (0.8 + 0.2 * Math.sin(t * 0.5 + s2.ph));
        for (const gl of glows) {
            if (gl.slow) { gl.mat.opacity = 0.42 + 0.16 * Math.sin(t * 1.4 + gl.ph); continue; }   // pha lê: thở chậm
            const f = 0.8 + 0.2 * Math.sin(t * 9 + gl.ph) * Math.sin(t * 5.3 + gl.ph * 2); gl.mat.opacity = 0.62 * f; gl.sp.scale.setScalar(2.4 + f * 0.5);
        }
    };
}

/** Lớp hoàn thiện: lọc Kuwahara (gom màu thành mảng phẳng như nét cọ, giữ mép). Điểm ảnh có alpha < 0.5 (nhân vật) được giữ nguyên. */
export const PaintShader = {
    uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(800, 450) }, uRad: { value: 3 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uRad; varying vec2 vUv;
      void main(){
        vec4 c0 = texture2D(tDiffuse, vUv);
        if (c0.a < 0.5) { gl_FragColor = vec4(c0.rgb, 1.0); return; }
        vec2 px = 1.0 / uRes; vec3 best = c0.rgb; float bestVar = 1e9;
        for (int q = 0; q < 4; q++) {
          vec2 dir = vec2(q == 0 || q == 2 ? -1.0 : 1.0, q < 2 ? -1.0 : 1.0);
          vec3 m = vec3(0.0), m2 = vec3(0.0); float n = 0.0;
          for (int j = 0; j < 3; j++) for (int i = 0; i < 3; i++) {
            vec4 s = texture2D(tDiffuse, vUv + dir * vec2(float(i), float(j)) * px * (uRad * 0.5));
            float wgt = step(0.5, s.a);
            m += s.rgb * wgt; m2 += s.rgb * s.rgb * wgt; n += wgt;
          }
          if (n < 1.0) continue;
          m /= n; vec3 v = abs(m2 / n - m * m); float var = v.r + v.g + v.b;
          if (var < bestVar) { bestVar = var; best = m; }
        }
        gl_FragColor = vec4(best, 1.0); }`,
};

// ---------- MÂY (12/11/2026: người chơi muốn có mây trên trời) ----------
/** Một đám mây tích: chồng các quả cầu, đáy phẳng; tô 3 tông phẳng — đỉnh trắng, thân khuất lam nhạt, đáy xám ấm */
function cloudTexture(seed) {
    const W = 512, H = 256, canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d'), random = mulberry(seed);
    const base = H * 0.8, puffs = [];
    const n = 9 + Math.floor(random() * 5);
    for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, mid = 1 - Math.abs(u - 0.5) * 2;
        const r = 26 + mid * 44 + random() * 18;
        puffs.push([W * (0.12 + u * 0.76) + (random() - 0.5) * 20, base - r * (0.55 + random() * 0.5) - mid * 26, r]);
    }
    for (let i = 0; i < 5; i++) { const r = 30 + random() * 30; puffs.push([W * (0.3 + random() * 0.4), base - 70 - random() * 60, r]); }
    const blobs = (dx, dy, k) => { g.beginPath(); for (const [x, y, r] of puffs) { g.moveTo(x + dx + r * k, y + dy); g.arc(x + dx, y + dy, r * k, 0, TAU); } g.fill(); };
    g.save(); g.beginPath(); g.rect(0, 0, W, base); g.clip();   // đáy phẳng
    g.fillStyle = '#ffffff'; blobs(0, 0, 1);
    g.fillRect(W * 0.14, base - 30, W * 0.72, 30);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#cfdcf0'; blobs(10, 34, 0.86);                       // thân khuất: lam nhạt
    g.fillStyle = '#b4c2da'; g.fillRect(0, base - 16, W, 16);           // đáy: xám lam
    g.fillStyle = '#ffffff'; blobs(-6, -10, 0.62);                      // mảng sáng trên đỉnh từng ụ
    g.restore();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/**
 * Mây trôi TRÊN bản đồ nhìn từ trên xuống: vài đám thưa bay ngang ở tầng thấp, tự mờ đi khi tới gần nhân vật để không che chỗ đang chơi.
 * Trả về hàm cập nhật (t) để đưa vào danh sách anim.
 */
export function paintMapClouds(group, cols, rows) {
    // (12/11/2026, lần 2) người chơi thấy mây ra HÌNH VUÔNG (tấm phẳng lộ mép) -> mỗi đám mây giờ là một chùm đốm tròn mềm, mép tan dần, không còn tấm chữ nhật nào
    const random = mulberry(31337), clouds = [];
    const dot = document.createElement('canvas'); dot.width = dot.height = 128;
    const dg = dot.getContext('2d'), rg = dg.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.6)'); rg.addColorStop(0.8, 'rgba(255,255,255,0.15)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    dg.fillStyle = rg; dg.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(dot);
    const count = Math.max(4, Math.round((cols * rows) / 260));
    for (let i = 0; i < count; i++) {
        const mat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, depthWrite: false, depthTest: false, fog: false, opacity: 0 });
        const g = new THREE.Group(), n = 5 + Math.floor(random() * 4), w = 3.2 + random() * 2.4;
        for (let k = 0; k < n; k++) {
            const sp = new THREE.Sprite(mat), u = (k + 0.5) / n - 0.5, sz = (1.6 + random() * 1.5) * (1 - Math.abs(u) * 0.8);
            sp.position.set(u * w * 2, (random() - 0.3) * 0.5 + (1 - Math.abs(u) * 2) * 0.35, (random() - 0.5) * 0.8); sp.scale.set(sz * 1.5, sz, 1); sp.renderOrder = 6;
            g.add(sp);
        }
        g.traverse(o => { o.frustumCulled = false; });
        group.add(g);
        clouds.push({ g, mat, x0: random() * (cols + 30) - 15, z: random() * (rows + 10) - 5, y: 5.2 + random() * 1.6, v: 0.16 + random() * 0.14, max: 0.34 + random() * 0.14 });
    }
    const span = cols + 30;
    return (t) => {
        const cam = uCamPos.value, hero = uHeroPos.value;
        for (const c of clouds) {
            const x = ((c.x0 + t * c.v) % span + span) % span - 15;
            c.g.position.set(x, c.y, c.z);
            // điểm trên mặt đất mà đám mây che (theo tia nhìn của máy quay) — gần nhân vật thì mờ hẳn
            const k = c.y / Math.max(0.5, cam.y - c.y);
            const gx = x + (x - cam.x) * k, gz = c.z + (c.z - cam.z) * k;
            const d = Math.hypot(gx - hero.x, gz - hero.z);
            const edge = Math.min(1, Math.min(x + 15, span - 15 - x) / 4);
            c.mat.opacity = c.max * Math.min(1, Math.max(0, (d - 6) / 4)) * Math.max(0, edge);
        }
    };
}

/** Mây tích lớn đứng SAU sân đấu (nhìn ngang): vài đám trắng trên nền trời, trôi rất chậm. Toạ độ theo ô (sẽ được nhân tỉ lệ cùng cảnh). */
export function paintBackClouds(group, seedNo = 1) {
    const random = mulberry(seedNo * 7 + 3), clouds = [];
    for (let i = 0; i < 8; i++) {
        const mat = new THREE.MeshBasicMaterial({ map: cloudTexture(500 + (i % 4)), transparent: true, depthWrite: false, fog: false, opacity: 0.96 });
        const w = 16 + random() * 16, mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), mat);
        const c = { mesh, x0: -58 + (i / 8) * 116 + (random() - 0.5) * 8, y: 5.5 + random() * 5 + (i % 2) * 2.5, z: -30 - random() * 9, v: 0.05 + random() * 0.05 };
        mesh.position.set(c.x0, c.y, c.z); mesh.renderOrder = -5; mesh.frustumCulled = false;
        group.add(mesh); clouds.push(c);
    }
    return (t) => { for (const c of clouds) c.mesh.position.x = ((c.x0 + t * c.v + 66) % 132 + 132) % 132 - 66; };
}

// ---------- NƯỚC kiểu tranh vẽ (12/11/2026) ----------
/**
 * Mặt nước: hai tông lam (nông / sâu) theo khoảng cách tới bờ, các vệt sáng phản chiếu trời trôi chậm, lấp lánh nắng, viền bọt trắng mảnh sát bờ.
 * mask: Uint8Array (W×H) — 255 ở ô nước; ox, oz: toạ độ thế giới của góc trái trên mặt nạ.
 */
export function paintWater(W, H, mask, ox, oz, tint = 0x4f9ab0) {
    const tex = new THREE.DataTexture(mask, W, H, THREE.RedFormat);
    tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
    const base = new THREE.Color(tint);
    const deep = lin('#2a6fa8').lerp(new V3(base.r, base.g, base.b), 0.35), shallow = lin('#7fd0d2').lerp(new V3(base.r, base.g, base.b), 0.25);
    const mat = new THREE.ShaderMaterial({
        transparent: true, fog: true, depthWrite: false,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), tMask: { value: tex }, uTime, uBox: { value: new THREE.Vector4(ox, oz, W, H) }, uDeep: { value: deep }, uShallow: { value: shallow } },
        vertexShader: `varying vec3 vWorld;
          #include <fog_pars_vertex>
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform sampler2D tMask; uniform float uTime; uniform vec4 uBox; uniform vec3 uDeep, uShallow; varying vec3 vWorld;
          #include <fog_pars_fragment>
          float wn(vec2 p) { return sin(p.x * 1.7 + sin(p.y * 1.3 + uTime * 0.35)) * cos(p.y * 2.1 - sin(p.x * 0.9 - uTime * 0.25)); }
          void main() {
            vec2 uv = (vWorld.xz - uBox.xy) / uBox.zw;
            float m = texture2D(tMask, uv).r;                       // 0 = đất, 1 = giữa vùng nước; ~0,5 = mép bờ
            vec3 col = mix(uShallow, uDeep, smoothstep(0.55, 1.0, m)) * 1.9;
            // vệt sáng trời phản chiếu: mảng lớn trôi chậm, cắt gọn như nét cọ
            float band = wn(vWorld.xz * 0.9 + vec2(uTime * 0.05, 0.0));
            col = mix(col, vec3(1.55, 1.85, 2.0), smoothstep(0.55, 0.62, band) * 0.32);
            col = mix(col, uDeep * 1.3, smoothstep(0.5, 0.58, -band) * 0.25);
            // lấp lánh nắng
            float gl = wn(vWorld.xz * 5.5 + vec2(uTime * 0.4, uTime * 0.2)) * wn(vWorld.zx * 4.1 - vec2(uTime * 0.3));
            col += vec3(2.2) * smoothstep(0.72, 0.8, gl);
            // viền bọt sát bờ, nhấp nhô theo sóng
            float sh = m + wn(vWorld.xz * 3.0) * 0.035 + sin(uTime * 1.1 + vWorld.x * 2.0 + vWorld.z * 1.7) * 0.02;
            float foam = smoothstep(0.50, 0.55, sh) * (1.0 - smoothstep(0.60, 0.66, sh));
            col = mix(col, vec3(2.3), foam * 0.85);
            gl_FragColor = vec4(col, 0.93);
            #include <fog_fragment>
          }`,
    });
    return mat;
}

// ---------- HANG MỎ SỐNG ĐỘNG (12/11/2026): tối như đêm, chỉ sáng quanh ĐÈN DẦU; lâu lâu DƠI bay qua, ĐÁ rơi từ trần ----------
/**
 * lamps: [[x, y, z], ...] vị trí ngọn đèn (toạ độ ô của cảnh). Trả về hàm cập nhật (t).
 *   - mỗi đèn: 1 đèn điểm thật (chiếu vách + nền + đồ vật), quầng sáng, vũng sáng trên nền; ngọn lửa chập chờn
 *   - dơi: cứ 7–16 giây một đàn 2–5 con vỗ cánh bay ngang phía trên
 *   - đá rơi: cứ 9–20 giây vài viên rơi từ trần xuống chân vách, nảy rồi nằm lại, có bụi bốc lên
 */
export function paintMineLife(group, lamps, { deep = false, scale = 2.6 } = {}) {
    const random = mulberry(deep ? 771 : 313);
    const dot = document.createElement('canvas'); dot.width = dot.height = 64;
    const dg = dot.getContext('2d'), rg = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    dg.fillStyle = rg; dg.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(dot);
    const lights = [];
    for (const [x, y, z] of lamps) {
        const light = new THREE.PointLight(0xffb060, 1, 9 * scale, 1.5);
        light.position.set(x, y, z + 0.5); group.add(light);
        const gm = new THREE.SpriteMaterial({ map: glowTex, color: 0xffa040, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        const glow = new THREE.Sprite(gm); glow.position.set(x, y, z + 0.3); glow.scale.setScalar(2.2); glow.renderOrder = 3; group.add(glow);
        const pm = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xff9838, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), pm); pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.03, z + 2.2); pool.renderOrder = 1; group.add(pool);
        lights.push({ light, gm, glow, pm, ph: random() * TAU, base: 44 + random() * 8 });
    }
    // quặng / pha lê phát sáng lam nhè nhẹ (không chiếu sáng thật, chỉ là quầng)
    const dust = paintSeeds(group, [-22, -8, 22, 6], { count: 70, y0: 0.3, y1: 4.5, color: 0xffd9a8, size: 0.06 });

    // ----- dơi -----
    const batMat = new THREE.MeshBasicMaterial({ color: 0x0b0a10, side: THREE.DoubleSide, fog: false });
    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.42, 0.1, -0.05, 0.3, -0.02, 0.16, 0, 0, 0, 0.3, -0.02, 0.16, 0.08, 0, 0.2], 3));
    const bodyGeo = new THREE.OctahedronGeometry(0.09, 0); bodyGeo.scale(1, 0.8, 1.8);
    const bats = [];
    for (let i = 0; i < 5; i++) {
        const g = new THREE.Group(), body = new THREE.Mesh(bodyGeo, batMat), wl = new THREE.Mesh(wingGeo, batMat), wr = new THREE.Mesh(wingGeo, batMat);
        wr.scale.x = -1; g.add(body, wl, wr); g.visible = false; g.traverse(o => { o.frustumCulled = false; });
        group.add(g); bats.push({ g, wl, wr, off: random() * TAU, dy: (random() - 0.5) * 0.9, dz: (random() - 0.5) * 1.6, lag: i * 0.9 + random() * 0.5 });
    }
    let batAt = 4 + random() * 5, batDir = 1, batN = 3, batY = 4.2, batSpeed = 7;

    // ----- đá rơi -----
    const rockGeo = new THREE.IcosahedronGeometry(0.14, 0), rockMat = new THREE.MeshLambertMaterial({ color: 0x7a7066, flatShading: true });
    const rocks = [];
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(rockGeo, rockMat); m.visible = false; m.frustumCulled = false; group.add(m); rocks.push({ m, vy: 0, vx: 0, t: 0, live: false, wait: 0 }); }
    const puffs = [];
    for (let i = 0; i < 4; i++) {
        const pm = new THREE.SpriteMaterial({ map: glowTex, color: 0x9a8f80, transparent: true, opacity: 0, depthWrite: false, fog: false });
        const sp = new THREE.Sprite(pm); sp.visible = false; sp.renderOrder = 2; group.add(sp); puffs.push({ sp, pm, t: 9 });
    }
    let rockAt = 6 + random() * 6, last = 0;

    return (t) => {
        const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
        dust(t * 0.5);
        // đèn dầu chập chờn
        for (const L of lights) {
            const f = 0.86 + 0.09 * Math.sin(t * 7.3 + L.ph) + 0.05 * Math.sin(t * 13.1 + L.ph * 2.3);
            L.light.intensity = L.base * f; L.gm.opacity = 0.75 * f; L.glow.scale.setScalar(2.0 + f * 0.4); L.pm.opacity = 0.38 * f;
        }
        // dơi
        if (t > batAt) {
            const span = 54, u = (t - batAt) * batSpeed;
            let any = false;
            bats.forEach((b, i) => {
                if (i >= batN) { b.g.visible = false; return; }
                const x = -27 + (u - b.lag * 2.2);
                if (x < -27 || x > 27) { b.g.visible = false; if (x <= 27) any = true; return; }
                any = true; b.g.visible = true;
                b.g.position.set(batDir * x, batY + b.dy + Math.sin(t * 2.2 + b.off) * 0.35, -5.6 + b.dz);
                b.g.rotation.y = batDir > 0 ? Math.PI / 2 : -Math.PI / 2;
                const flap = Math.sin(t * 22 + b.off) * 0.9;
                b.wl.rotation.z = flap; b.wr.rotation.z = -flap;
            });
            if (!any && u > span) { batAt = t + 7 + random() * 9; batDir = random() < 0.5 ? -1 : 1; batN = 2 + Math.floor(random() * 4); batY = 3.4 + random() * 1.4; batSpeed = 6 + random() * 3; }
        }
        // đá rơi
        if (t > rockAt) {
            rockAt = t + 9 + random() * 11;
            const x0 = -19 + random() * 38, n = 2 + Math.floor(random() * 4);
            let k = 0;
            for (const r of rocks) {
                if (r.live || k >= n) continue;
                r.live = true; r.wait = k * 0.18 + random() * 0.15; r.t = 0; r.vy = 0; r.vx = (random() - 0.5) * 1.2; r.bounced = 0;
                r.m.position.set(x0 + (random() - 0.5) * 1.6, 5.0, -6.1 - random() * 0.9); r.m.scale.setScalar(0.6 + random() * 1.1); r.m.visible = false; k++;
            }
        }
        for (const r of rocks) {
            if (!r.live) continue;
            if (r.wait > 0) { r.wait -= dt; continue; }
            r.m.visible = true; r.t += dt; r.vy -= 16 * dt;
            r.m.position.y += r.vy * dt; r.m.position.x += r.vx * dt; r.m.rotation.x += dt * 6; r.m.rotation.z += dt * 4;
            const floor = 0.1 * r.m.scale.x;
            if (r.m.position.y <= floor) {
                r.m.position.y = floor;
                if (!r.bounced) { const pf = puffs.find(q => q.t > 1.2); if (pf) { pf.t = 0; pf.sp.visible = true; pf.sp.position.set(r.m.position.x, 0.25, r.m.position.z + 0.2); } }
                r.bounced++; r.vy = r.bounced < 3 ? -r.vy * 0.32 : 0; r.vx *= 0.5;
            }
            if (r.t > 7) { r.m.scale.multiplyScalar(1 - dt * 2); if (r.m.scale.x < 0.05) { r.live = false; r.m.visible = false; } }   // nằm một lúc rồi biến mất dần
        }
        for (const pf of puffs) {
            if (pf.t > 1.2) { pf.sp.visible = false; continue; }
            pf.t += dt; const k = pf.t / 1.2;
            pf.sp.scale.setScalar(0.8 + k * 2.2); pf.pm.opacity = 0.55 * (1 - k); pf.sp.position.y = 0.25 + k * 0.6;
        }
    };
}
