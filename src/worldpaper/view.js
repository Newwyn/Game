// ============================================================
// ✂️ Bản đồ mô hình giấy cắt dán — Khung nhìn riêng cho Làng Ashford
//   Giữ nguyên giao diện createView(host) của src/world3d/view.js để world.js hoán đổi mượt.
//   Luật đi theo ô, nói chuyện, nhặt đồ, sự kiện... vẫn nằm trọn ở src/ui/world.js.
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAPS } from '../world/maps.js';
import { EXTRA } from '../world/mapsExtra.js';
import { TERRAIN } from '../world/terrain3d.js';
import { LAYOUTS } from '../world3d/layouts.js';
import { rng, heroSheet, drawMarker, paintAshfordGround, buildAshfordAtlases } from './art.js';

const DAY_KEYS = [
    [0.00, [1.00, 1.00, 1.00]],
    [0.50, [1.00, 1.00, 1.00]],
    [0.60, [1.08, 0.98, 0.82]],
    [0.68, [1.12, 0.80, 0.66]],
    [0.74, [0.52, 0.62, 0.98]],
    [0.92, [0.46, 0.56, 0.95]],
    [0.97, [0.95, 0.82, 0.80]],
    [1.00, [1.00, 1.00, 1.00]],
];
const FIXED_HOUR = { noon: 0.25, gold: 0.6, sunset: 0.68, night: 0.85, dawn: 0.97 };
function dayTint(nowMs) {
    const h = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hour') : null;
    if (h === 'off') return [1, 1, 1];
    const f = FIXED_HOUR[h] ?? ((nowMs / 1000 / 60 / 24) % 1);
    let i = 0; while (i < DAY_KEYS.length - 2 && f >= DAY_KEYS[i + 1][0]) i++;
    const [a, ca] = DAY_KEYS[i], [b, cb] = DAY_KEYS[i + 1];
    const k = Math.min(1, Math.max(0, (f - a) / Math.max(1e-6, b - a)));
    return ca.map((v, j) => v + (cb[j] - v) * k);
}

const ROW = { down: 0, left: 1, right: 2, up: 3 };
const CHAR_H = 1.62;
const H_STEP = 0.45;
const M = 8;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

const TiltShiftWarmShader = {
    uniforms: {
        tDiffuse: { value: null },
        uRes: { value: new THREE.Vector2(1, 1) },
        uFocusY: { value: 0.45 },
        uStrength: { value: 1 },
        uRadius: { value: 13 },
        uTime: { value: 0 },
        uDay: { value: new THREE.Vector3(1, 1, 1) },
        uSamples: { value: 36 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uFocusY, uStrength, uRadius, uTime, uSamples; uniform vec3 uDay; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
            float amt = smoothstep(0.14, 0.52, abs(vUv.y - uFocusY)) * uStrength;
            vec3 col;
            if (amt < 0.02 || uSamples < 2.0) {
                col = texture2D(tDiffuse, vUv).rgb;
            } else {
                vec3 acc = vec3(0.0);
                int maxS = int(uSamples);
                for (int i = 0; i < 36; i++) {
                    if (i >= maxS) break;
                    float fi = float(i);
                    float rad = sqrt((fi + 0.5) / uSamples);
                    float a = fi * 2.39996323;
                    acc += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * rad * amt * uRadius / uRes).rgb;
                }
                col = acc / uSamples;
            }
            // tông giấy ấm thủ công + nhuộm dịu theo giờ trong ngày (giữ màu giấy tươi)
            col *= mix(vec3(1.0), uDay, 0.42) * vec3(1.05, 1.0, 0.92);
            vec2 q = vUv - 0.5;
            col *= 1.0 - dot(q, q) * 0.56;
            col += (hash(vUv * uRes + uTime) - 0.5) * 0.010;
            gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }`,
};

export function webglOK() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { return false; }
}

/**
 * Tạo khung nhìn mô hình giấy cắt dán cho Làng Ashford.
 * @param {HTMLElement} host Phần tử chứa canvas
 */
export function createView(host) {
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'wd-3d-canvas wd-paper-canvas';
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#a89b66');
    scene.fog = new THREE.Fog('#c8bd8a', 36, 74);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200);
    const hemi = new THREE.HemisphereLight('#fff4e0', '#c9a777', 1.75);
    const sun = new THREE.DirectionalLight('#ffdfae', 2.45);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 });
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.025;
    scene.add(hemi, sun, sun.target);

    const sprites = new THREE.Group();
    scene.add(sprites);

    // Uniform chung cho gió lùa và hiệu ứng nhìn xuyên vật cản trước nhân vật
    const uTime = { value: 0 };
    const uHeroPos = { value: new THREE.Vector3(19.5, 0.8, 15.5) };
    const uCamPos = { value: new THREE.Vector3(19.5, 15, 30) };
    const uSeeThrough = { value: 1.0 };

    const disposables = [];
    const trackTex = (t) => { disposables.push(t); return t; };
    const trackMat = (m) => { disposables.push(m); return m; };
    const trackGeo = (g) => { disposables.push(g); return g; };

    const makeTex = (cv, nearest = false) => {
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        if (nearest) { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; }
        return trackTex(t);
    };

    const patchPaperMat = (mat, { occlude = false } = {}) => {
        mat.onBeforeCompile = (sh) => {
            sh.uniforms.uTime = uTime;
            sh.uniforms.uHeroPos = uHeroPos;
            sh.uniforms.uCamPos = uCamPos;
            sh.uniforms.uSeeThrough = uSeeThrough;
            sh.vertexShader = 'attribute float aSway;\nuniform float uTime;\nvarying vec3 vWorldPos;\n'
                + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
                    vec4 swp = modelMatrix * vec4(transformed, 1.0);
                    if (aSway > 0.0001) {
                        transformed.x += sin(uTime * 1.55 + swp.x * 0.45 + swp.z * 0.35) * aSway;
                        transformed.z += cos(uTime * 1.2 + swp.x * 0.35) * aSway * 0.45;
                    }
                    vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
            if (occlude) {
                sh.fragmentShader = 'uniform vec3 uHeroPos;\nuniform vec3 uCamPos;\nuniform float uSeeThrough;\nvarying vec3 vWorldPos;\n'
                    + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
                        if (uSeeThrough > 0.01 && vWorldPos.y > 0.30) {
                            vec3 ch = uHeroPos - uCamPos;
                            float chLen2 = dot(ch, ch);
                            vec3 cp = vWorldPos - uCamPos;
                            float tProj = dot(cp, ch) / max(chLen2, 0.001);
                            if (tProj > 0.12 && tProj < 0.985) {
                                float dist = length(cp - ch * tProj) / tProj;
                                float rOuter = 2.35;
                                if (dist < rOuter) {
                                    float k = uSeeThrough * smoothstep(0.985, 0.90, tProj);
                                    float inside = 1.0 - smoothstep(rOuter * 0.42, rOuter, dist);
                                    if (inside * k > 0.78) discard;
                                    gl_FragColor.a *= mix(1.0, 0.28, inside * k);
                                }
                            }
                        }`);
            }
        };
        mat.customProgramCacheKey = () => `paper_${occlude ? 'occ' : 'solid'}`;
        return mat;
    };

    // ---------- Hậu kỳ (Tilt-Shift + MSAA + Warm Tone) ----------
    let composer = null, tiltPass = null, quality = null, resScale = 1, fit = 1, zoom = 0.96;
    const onWheel = (e) => {
        e.preventDefault();
        zoom = clampN(zoom * (e.deltaY > 0 ? 1.07 : 0.935), 0.65, 1.22);
    };
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    function buildComposer(q) {
        if (composer) {
            composer.renderTarget1?.dispose?.();
            composer.renderTarget2?.dispose?.();
            composer.dispose?.();
        }
        const w = Math.max(2, host.clientWidth), h = Math.max(2, host.clientHeight);
        const webgl2 = renderer.capabilities.isWebGL2;
        const rt = new THREE.WebGLRenderTarget(w, h, {
            type: webgl2 ? THREE.HalfFloatType : THREE.UnsignedByteType,
            samples: webgl2 && q === 'high' ? 4 : 0,
        });
        composer = new EffectComposer(renderer, rt);
        composer.addPass(new RenderPass(scene, camera));
        tiltPass = new ShaderPass(TiltShiftWarmShader);
        tiltPass.uniforms.uSamples.value = q === 'high' ? 36 : 12;
        composer.addPass(tiltPass);
        composer.addPass(new OutputPass());
        resize();
    }

    const applyRes = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1) * resScale;
        renderer.setPixelRatio(dpr);
        composer?.setPixelRatio?.(dpr);
        resize();
    };

    function setQuality(q) {
        if (q === quality) return;
        quality = q; resScale = 1; perf.reset();
        const s = q === 'high' ? 2048 : 1024;
        sun.shadow.mapSize.set(s, s);
        sun.shadow.map?.dispose(); sun.shadow.map = null;
        sun.shadow.radius = q === 'high' ? 3.2 : 1.5;
        buildComposer(q);
        applyRes();
        if (cur?.lights) for (const l of cur.lights) l.visible = q === 'high';
    }

    function resize() {
        const w = Math.max(2, host.clientWidth), h = Math.max(2, host.clientHeight);
        if (!host.clientWidth || !host.clientHeight) return;
        const dpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1) * resScale;
        renderer.setSize(w, h, false);
        composer?.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        fit = clampN(1.3 / Math.max(0.4, camera.aspect), 1, 1.75);
        if (tiltPass) {
            tiltPass.uniforms.uRes.value.set(w * dpr, h * dpr);
            tiltPass.uniforms.uRadius.value = 13 * dpr * clampN(Math.min(w, h) / 800, 0.5, 1.15);
        }
    }

    // ---------- Trình dựng cảnh Ashford ----------
    let cur = null, mapId = null, building = null, snapCam = true;
    let atlases = null;
    const cache = new Map();
    const ashfordObjById = new Map();
    for (const o of [...(MAPS.ashford?.objects ?? []), ...(EXTRA.ashford ?? [])]) {
        if (o?.id) ashfordObjById.set(o.id, o);
    }

    function makeBlobTex() {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d');
        const gr = g.createRadialGradient(32, 32, 4, 32, 32, 30);
        gr.addColorStop(0, 'rgba(30, 22, 10, 0.42)');
        gr.addColorStop(0.55, 'rgba(30, 22, 10, 0.18)');
        gr.addColorStop(1, 'rgba(30, 22, 10, 0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        return makeTex(c);
    }

    function makeHeightCardboardTex() {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = '#8fa54f'; g.fillRect(0, 0, 128, 128);
        g.strokeStyle = '#f3ead2'; g.lineWidth = 10; g.strokeRect(5, 5, 118, 118);
        g.strokeStyle = 'rgba(90, 108, 48, 0.35)'; g.lineWidth = 2;
        for (let i = 0; i < 40; i++) {
            const x = ((i * 73) % 108) + 10, y = ((i * 47) % 108) + 10;
            g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 7); g.moveTo(x, y); g.lineTo(x + 3, y - 6); g.stroke();
        }
        return makeTex(c);
    }

    function buildCardGeo(cell, { h, x = 0, y = 0, z = 0, rotY = 0, rotX = 0, sway = 0, flipX = false }) {
        const w = h * (cell.w / cell.h);
        const geo = new THREE.PlaneGeometry(w, h);
        const uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) {
            const u = uv.getX(i), v = uv.getY(i);
            const nu = flipX ? THREE.MathUtils.lerp(cell.u1, cell.u0, u) : THREE.MathUtils.lerp(cell.u0, cell.u1, u);
            const nv = THREE.MathUtils.lerp(cell.v0, cell.v1, v);
            uv.setXY(i, nu, nv);
        }
        geo.translate(0, h / 2 - h * cell.padBottom, 0);
        const pos = geo.attributes.position;
        const swayArr = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
            const py = pos.getY(i);
            swayArr[i] = py > 0.05 ? sway * clampN(py / Math.max(0.2, h), 0, 1.3) : 0;
        }
        geo.setAttribute('aSway', new THREE.BufferAttribute(swayArr, 1));
        if (rotX) geo.rotateX(rotX);
        if (rotY) geo.rotateY(rotY);
        geo.translate(x, y, z);
        return geo;
    }

    function buildAshfordScene() {
        const id = 'ashford';
        const map = MAPS[id];
        const terrain = TERRAIN[id];
        const layout = LAYOUTS[id] ?? { items: [], detailItems: [] };
        const cols = map.cols, rows = map.rows;
        const W = cols + 2 * M, H = rows + 2 * M;
        const r = rng(20261120);
        const rr = (a, b) => a + r() * (b - a);

        atlases ??= buildAshfordAtlases(20261120);
        const group = new THREE.Group();
        const anim = [];
        const lights = [];
        const pickables = [];

        // 1. Mặt bàn + Đế bìa cứng + Tấm giấy bản đồ
        const tableGeo = trackGeo(new THREE.PlaneGeometry(360, 360));
        const tableMat = trackMat(new THREE.MeshStandardMaterial({ color: '#a89b66', roughness: 1 }));
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.rotation.x = -Math.PI / 2; table.position.y = -0.18; table.receiveShadow = true;
        group.add(table);

        const slabGeo = trackGeo(new THREE.BoxGeometry(W, 0.14, H));
        const slabMat = trackMat(new THREE.MeshStandardMaterial({ color: '#dcc99e', roughness: 0.95 }));
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.set(cols / 2, -0.075, rows / 2); slab.receiveShadow = true;
        group.add(slab);

        const gPxW = 3072, gPxH = Math.round(gPxW * H / W);
        const gCanvas = paintAshfordGround({ map, terrain, layout, W: gPxW, H: gPxH, M, r });
        const gTex = makeTex(gCanvas);
        const groundGeo = trackGeo(new THREE.PlaneGeometry(W, H));
        const groundMat = trackMat(new THREE.MeshStandardMaterial({ map: gTex, roughness: 1 }));
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(cols / 2, 0, rows / 2);
        ground.receiveShadow = true;
        group.add(ground);
        pickables.push(ground);

        // 2. Bậc nhảy xếp lớp giấy cắt (MAPS.ashford.heights)
        const heights = map.heights ?? [];
        const hAt = (x, z) => (x >= 0 && z >= 0 && x < cols && z < rows ? (heights[z]?.[x] ?? 0) : 0);
        let maxH = 0;
        for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) if (hAt(x, z) > maxH) maxH = hAt(x, z);
        if (maxH > 0) {
            const topTex = makeHeightCardboardTex();
            const rimMat = trackMat(new THREE.MeshStandardMaterial({ color: '#d5bd91', roughness: 0.95 }));
            const capMat = trackMat(new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.95 }));
            const slabGeos = [], capGeos = [];
            for (let lv = 1; lv <= maxH; lv++) {
                for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) {
                    if (hAt(x, z) < lv) continue;
                    const yBase = (lv - 1) * H_STEP;
                    const gSide = new THREE.BoxGeometry(0.96, H_STEP - 0.04, 0.96);
                    gSide.translate(x + 0.5, yBase + (H_STEP - 0.04) / 2, z + 0.5);
                    slabGeos.push(gSide);
                    const gCap = new THREE.BoxGeometry(1.0, 0.05, 1.0);
                    gCap.translate(x + 0.5, yBase + H_STEP - 0.025, z + 0.5);
                    capGeos.push(gCap);
                }
            }
            if (slabGeos.length) {
                const mSide = new THREE.Mesh(trackGeo(mergeGeometries(slabGeos, false)), rimMat);
                mSide.castShadow = mSide.receiveShadow = true;
                group.add(mSide);
            }
            if (capGeos.length) {
                const mCap = new THREE.Mesh(trackGeo(mergeGeometries(capGeos, false)), capMat);
                mCap.castShadow = mCap.receiveShadow = true;
                group.add(mCap);
                pickables.push(mCap);
            }
        }

        // Lưới phủ chặn rải cây tự động
        const inside = (x, z) => x >= 0 && z >= 0 && x < cols && z < rows;
        const cover = new Uint8Array(cols * rows);
        const coverRect = (x0, z0, x1, z1) => {
            const ax = Math.max(0, Math.floor(x0)), bx = Math.min(cols - 1, Math.floor(x1));
            const az = Math.max(0, Math.floor(z0)), bz = Math.min(rows - 1, Math.floor(z1));
            for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) cover[x + z * cols] = 1;
        };
        const gapSet = new Set((map.gaps ?? []).map(([x, y]) => `${x},${y}`));
        const stoneSet = new Set((map.stones ?? []).map(([x, y]) => `${x},${y}`));
        const isSpecialTile = (x, z) => inside(x, z) && (gapSet.has(`${x},${z}`) || stoneSet.has(`${x},${z}`) || hAt(x, z) > 0);
        for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) if (isSpecialTile(x, z)) coverRect(x, z, x + 1, z + 1);

        // Chuẩn bị mảng gộp hình theo từng atlas
        const treeGeos = [], buildingGeos = [], propGeos = [], shadowGeos = [];
        const addShadow = (x, z, rx, rz, y = 0.015) => {
            const sg = new THREE.CircleGeometry(1, 14);
            sg.rotateX(-Math.PI / 2);
            sg.scale(rx, 1, rz);
            sg.translate(x, y, z);
            shadowGeos.push(sg);
        };
        const addTree = (cellKey, x, z, h, cross = true) => {
            const cell = atlases.trees.cells[cellKey];
            const y = hAt(Math.floor(x), Math.floor(z)) * H_STEP;
            const yaw = (cross ? rr(0.32, 0.72) * (r() < 0.5 ? -1 : 1) : 0);
            treeGeos.push(buildCardGeo(cell, { h, x, y, z, rotY: yaw, sway: 0.065 }));
            if (cross) treeGeos.push(buildCardGeo(cell, { h, x, y, z, rotY: yaw + Math.PI / 2, sway: 0.065 }));
            addShadow(x + 0.15, z + 0.25, h * 0.36, h * 0.24, y + 0.015);
        };
        const addBuilding = (cellKey, x, z, h, rotY = 0) => {
            const cell = atlases.buildings.cells[cellKey];
            const y = hAt(Math.floor(x), Math.floor(z)) * H_STEP;
            buildingGeos.push(buildCardGeo(cell, { h, x, y, z, rotY, rotX: -0.05, sway: 0 }));
            addShadow(x + 0.2, z + 0.4, h * (cell.w / cell.h) * 0.44, h * 0.22, y + 0.014);
        };
        const addProp = (cellKey, x, z, h, opts = {}) => {
            const cell = atlases.props.cells[cellKey];
            const y = (opts.y ?? hAt(Math.floor(x), Math.floor(z)) * H_STEP);
            propGeos.push(buildCardGeo(cell, { h, x, y, z, rotY: opts.rotY ?? 0, rotX: opts.rotX ?? 0, sway: opts.sway ?? 0, flipX: !!opts.flipX }));
            if (opts.shadow !== false) addShadow(x + 0.08, z + 0.12, h * (cell.w / cell.h) * 0.38, h * 0.18, y + 0.013);
        };

        // 3. Công trình & đồ chi tiết đặt tay từ LAYOUTS.ashford
        const chimneySpots = [];
        const roofPerches = [];
        const treePerches = [];

        const FLAT = new Set(['dirtPatch', 'steppingStones', 'butterflies', 'fireflies', 'groundFog', 'smoke', 'chickens', 'clothesline']);
        const posOf = (it) => {
            if (it[0] === 'model') return [it[2], it[3]];
            if (Array.isArray(it[1])) return it[1];
            if (it[1] && typeof it[1] === 'object') return [it[1].x ?? it[1].x0, it[1].z ?? it[1].z0];
            return [it[1], it[2]];
        };
        const isWalkable = (it) => { const [x, z] = posOf(it); return map.grid?.[Math.floor(z)]?.[Math.floor(x)] === '.'; };
        const onSpecial = (it) => { const [x, z] = posOf(it); return isSpecialTile(Math.floor(x), Math.floor(z)); };
        const details = (layout.detailItems ?? []).filter(it => !onSpecial(it) && (FLAT.has(it[0]) || !isWalkable(it)));
        const allItems = [...(layout.items ?? []), ...details];

        const chickenSpots = [];
        const butterflySpots = [];

        for (const it of allItems) {
            const [kind, ...args] = it;
            if (kind === 'plaza') {
                const [px, pz, rad] = args;
                coverRect(px - rad, pz - rad, px + rad, pz + rad);
            } else if (kind === 'house') {
                const { x0, z0, x1, z1, roof = 'red' } = args[0];
                const cx = (x0 + x1) / 2, cz = z1 - 0.85;
                const cellKey = roof === 'brown' ? 'house_brown' : (x0 > 20 ? 'house_stone' : 'house_red');
                addBuilding(cellKey, cx, cz, 3.85);
                coverRect(x0 - 0.4, z0 - 0.4, x1 + 0.4, z1 + 0.3);
                chimneySpots.push([cx + 1.05, 3.65, cz]);
                roofPerches.push([cx, 3.35, cz + 0.08]);
            } else if (kind === 'model') {
                const [mkey, mx, mz, opts = {}] = args;
                if (opts.cover) coverRect(...opts.cover);
                if (mkey === 'meshy/bld_chiefhouse') {
                    addBuilding('chiefhouse', mx, mz + 1.05, 4.1);
                    chimneySpots.push([mx + 1.15, 3.85, mz + 1.05]);
                    roofPerches.push([mx, 3.6, mz + 1.1]);
                } else if (mkey === 'meshy/bld_smithy') {
                    addBuilding('smithy', mx, mz + 1.15, 3.95);
                    chimneySpots.push([mx + 1.25, 3.7, mz + 1.15]);
                    const fl = new THREE.PointLight('#ff9a3c', 7.5, 8.5, 1.8);
                    fl.position.set(mx + 1.35, 1.25, mz + 1.65);
                    group.add(fl); lights.push(fl);
                } else if (mkey === 'meshy/bld_tavern') {
                    addBuilding('tavern', mx, mz + 0.95, 4.35);
                    chimneySpots.push([mx - 1.35, 3.95, mz + 0.95]);
                    roofPerches.push([mx, 3.75, mz + 1.0]);
                    const tl = new THREE.PointLight('#ffd06e', 8, 9.5, 1.7);
                    tl.position.set(mx, 1.75, mz + 1.7);
                    group.add(tl); lights.push(tl);
                } else if (mkey === 'survival/signpost') addProp('signpost', mx, mz, 1.55);
                else if (mkey === 'survival/barrel') addProp('barrel', mx, mz, 1.05);
                else if (mkey === 'survival/box') addProp('crate', mx, mz, 0.98);
                else if (mkey === 'survival/box-large') addProp('crate_large', mx, mz, 1.1);
                else if (mkey === 'survival/resource-stone') addProp('stone_pile', mx, mz, 0.95);
                else if (mkey === 'nature/crop_pumpkin') addProp('pumpkin', mx, mz, 0.95);
                else if (mkey === 'town/cart') addProp('cart', mx, mz, 1.35);
                else if (mkey === 'town/cart-high') addProp('cart_high', mx, mz, 1.45);
                else if (mkey === 'graveyard/bench') addProp('bench', mx, mz, 0.95, { rotY: (opts.r ?? 0) * 0.25 });
                else if (mkey.includes('mushroom_red')) addProp('mushroom_red', mx, mz, 0.85, { sway: 0.02 });
                else if (mkey.includes('mushroom_tan')) addProp('mushroom_tan', mx, mz, 0.85, { sway: 0.02 });
                else if (mkey === 'nature/rock_largeA') addProp('rock_large', mx, mz, 1.15);
                else if (mkey === 'nature/rock_smallFlatA') addProp('rock_flat', mx, mz, 0.82);
                else if (mkey === 'nature/rock_smallC') addProp('rock_small', mx, mz, 0.85);
                else if (mkey === 'nature/log') addProp('log', mx, mz, 0.85);
            } else if (kind === 'well') {
                addBuilding('well', args[0], args[1], 2.5);
                coverRect(args[0] - 0.9, args[1] - 0.9, args[0] + 0.9, args[1] + 0.9);
            } else if (kind === 'board') {
                addBuilding('board', args[0], args[1], 2.1);
                coverRect(args[0] - 0.8, args[1] - 0.5, args[0] + 0.8, args[1] + 0.5);
            } else if (kind === 'anvil') {
                addProp('anvil', args[0], args[1], 1.1);
            } else if (kind === 'fence') {
                const [a, b, styleName = 'simple'] = args;
                const fk = /plank/i.test(String(styleName)) ? 'fence_planks' : 'fence_simple';
                const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
                const steps = Math.max(1, Math.round(len / 0.92));
                const ang = Math.atan2(-dz, dx);
                const rotY = Math.abs(Math.sin(ang)) > 0.7 ? Math.PI / 2 : 0;
                for (let i = 0; i <= steps; i++) {
                    const fx = a[0] + dx * (i / steps), fz = a[1] + dz * (i / steps);
                    addProp(fk, fx, fz, 1.0, { rotY });
                }
            } else if (kind === 'flowerbed') {
                const [x0, z0, x1, z1] = args;
                coverRect(x0, z0, x1, z1);
                for (let z = z0 + 0.35; z <= z1 - 0.15; z += 0.52) {
                    for (let x = x0 + 0.35; x <= x1 - 0.15; x += 0.52) {
                        addProp('flower' + Math.floor(r() * 3), x + rr(-0.08, 0.08), z + rr(-0.06, 0.06), rr(0.75, 0.98), { sway: 0.03 });
                    }
                }
            } else if (kind === 'gardenPatch') {
                const [x0, z0, x1, z1] = args;
                coverRect(x0, z0, x1, z1);
                const cx = (x0 + x1) / 2;
                for (let z = z0 + 0.38; z < z1 - 0.1; z += 0.52) {
                    addBuilding('garden_crops', cx, z, 0.9);
                }
            } else if (kind === 'lamp') {
                const [lx, lz] = args;
                addProp('lamp', lx, lz, 2.2);
                const pl = new THREE.PointLight('#ffd27a', 3.5, 5.5, 1.8);
                pl.position.set(lx, 1.85, lz + 0.1);
                group.add(pl); lights.push(pl);
            } else if (kind === 'tavernTable') {
                addProp('tavern_table', args[0], args[1], 1.15);
            } else if (kind === 'shopSign') {
                addProp(args[2] === 'forge' ? 'sign_forge' : 'sign_tavern', args[0], args[1], 1.6);
            } else if (kind === 'flowerPot') {
                const fl = String(args[2] ?? '');
                const pk = fl.includes('yellow') ? 'pot_yellow' : fl.includes('purple') ? 'pot_purple' : 'pot_red';
                addProp(pk, args[0], args[1], 0.85, { sway: 0.015 });
            } else if (kind === 'forgeProps') {
                addProp('forge_props', args[0], args[1], 1.2);
            } else if (kind === 'woodpile') {
                addProp('woodpile', args[0], args[1], 1.0);
            } else if (kind === 'scarecrow') {
                addProp('scarecrow', args[0], args[1], 1.85, { sway: 0.025 });
            } else if (kind === 'veggieBasket') {
                addProp('veggie_basket', args[0], args[1], 0.88);
            } else if (kind === 'sack') {
                addProp('sacks', args[0], args[1], 0.95);
            } else if (kind === 'clothesline') {
                const [a, b] = args;
                const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
                const rotY = Math.abs(b[1] - a[1]) > Math.abs(b[0] - a[0]) ? Math.PI / 2 : 0;
                addProp('clothesline', mx, mz, 1.45, { rotY, sway: 0.03 });
            } else if (kind === 'haystack') {
                addProp('haystack', args[0], args[1], 1.25 * (args[2] ?? 1) * 1.15);
            } else if (kind === 'stall') {
                addBuilding('stall', args[0], args[1], 2.2);
                coverRect(args[0] - 0.8, args[1] - 0.5, args[0] + 0.8, args[1] + 0.5);
            } else if (kind === 'butterflies') {
                butterflySpots.push(...args[0]);
            } else if (kind === 'chickens') {
                chickenSpots.push(...args[0]);
            }
        }

        // Cây táo nhiệm vụ / hái quả trên bản đồ Ashford (world.js ẩn sprite 2D để 3D/Giấy tự vẽ cây táo)
        const appleSeen = new Set();
        for (const o of [...(map.objects ?? []), ...(EXTRA.ashford ?? [])]) {
            if ((o.sprite === 'i_appletree' || o.sprite === 'i_oak') && !appleSeen.has(o.id)) {
                appleSeen.add(o.id);
                addTree(o.sprite === 'i_appletree' ? 'apple' : 'round2', o.x + 0.5, o.y + 0.5, 2.95, true);
                coverRect(o.x, o.y, o.x + 1, o.y + 1);
            }
        }

        // 4. Rải cây, bụi, hoa giấy cắt dọc rừng rìa bản đồ theo TERRAIN.ashford
        const tileAt = (x, z) => terrain[Math.max(0, Math.min(rows - 1, z))]?.[Math.max(0, Math.min(cols - 1, x))] ?? 'g';
        for (let z = -M + 1; z < rows + M - 1; z++) for (let x = -M + 1; x < cols + M - 1; x++) {
            const ins = inside(x, z);
            let t = tileAt(x, z);
            if (!ins) {
                const d = Math.max(x < 0 ? -x : x - cols + 1, z < 0 ? -z : z - rows + 1);
                if (t === 'b' || t === 's') t = 'g';
                if (t !== 'p' && d > 2 && r() < Math.min(0.82, d * 0.14)) t = 't';
            }
            if (ins && cover[x + z * cols]) continue;
            const cx = x + 0.5, cz = z + 0.5;
            if (t === 't') {
                if (!ins && r() < 0.36) continue;
                const tx = cx + rr(-0.22, 0.22), tz = cz + rr(-0.22, 0.22);
                const th = rr(3.15, 4.35);
                let tk = 'round' + Math.floor(r() * 4);
                if (ins && (x * 7 + z * 13) % 9 === 0) tk = 'apple';
                else if (!ins && r() < 0.26) tk = 'pine';
                addTree(tk, tx, tz, th, true);
                if (x >= -1 && x < cols + 1 && z >= -1 && z < rows + 1) treePerches.push([tx, th * 0.72, tz]);
                if (r() < 0.35) addProp('bush' + Math.floor(r() * 4), cx + rr(-0.4, 0.4), cz + rr(-0.3, 0.4), rr(1.0, 1.35), { sway: 0.03 });
            } else if (t === 'b') {
                const bh = rr(1.05, 1.48);
                const bk = r() < 0.25 ? 'rock_small' : 'bush' + Math.floor(r() * 4);
                addProp(bk, cx, cz, bh, { sway: bk.startsWith('bush') ? 0.03 : 0 });
                if (r() < 0.55) addProp('bush' + Math.floor(r() * 4), cx + rr(-0.35, 0.35), cz + 0.18, bh * 0.82, { sway: 0.03 });
            } else if (t === 'g' && ins && map.grid?.[z]?.[x] === '#' && r() < 0.22) {
                addProp('flower' + Math.floor(r() * 3), cx + rr(-0.3, 0.3), cz + rr(-0.3, 0.3), rr(0.68, 0.92), { sway: 0.025 });
            }
        }

        // Gộp toàn bộ thẻ tĩnh thành 4 mesh / 4 draw call duy nhất
        const flushMerged = (geos, canvasTex, { occlude = false, transparent = false, castShadow = true } = {}) => {
            if (!geos.length) return;
            const merged = trackGeo(mergeGeometries(geos, false));
            const mat = trackMat(patchPaperMat(new THREE.MeshStandardMaterial({
                map: canvasTex,
                alphaTest: 0.45,
                transparent,
                side: THREE.DoubleSide,
                roughness: 0.96,
            }), { occlude }));
            const mesh = new THREE.Mesh(merged, mat);
            mesh.castShadow = castShadow;
            mesh.receiveShadow = false;
            if (transparent) mesh.renderOrder = 2;
            group.add(mesh);
        };

        if (shadowGeos.length) {
            const bTex = makeBlobTex();
            const sMat = trackMat(new THREE.MeshBasicMaterial({ map: bTex, transparent: true, depthWrite: false, opacity: 0.82 }));
            const sMesh = new THREE.Mesh(trackGeo(mergeGeometries(shadowGeos, false)), sMat);
            sMesh.renderOrder = 1;
            group.add(sMesh);
        }
        flushMerged(propGeos, makeTex(atlases.props.canvas), { occlude: false, transparent: false, castShadow: true });
        flushMerged(buildingGeos, makeTex(atlases.buildings.canvas), { occlude: true, transparent: true, castShadow: false });
        flushMerged(treeGeos, makeTex(atlases.trees.canvas), { occlude: true, transparent: true, castShadow: false });

        // 5. Sinh hoạt làng quê bằng thẻ giấy (mèo, chó, vịt, gà, bướm, chim, khói bếp, lá bay)
        const critterTex = makeTex(atlases.critters.canvas);
        const critterMat = trackMat(new THREE.MeshStandardMaterial({
            map: critterTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.96,
        }));
        const critterGeos = new Map();
        const getCritterGeo = (key, h) => {
            const gk = `${key}_${h.toFixed(2)}`;
            if (!critterGeos.has(gk)) {
                critterGeos.set(gk, trackGeo(buildCardGeo(atlases.critters.cells[key], { h })));
            }
            return critterGeos.get(gk);
        };
        const isBlocked = (x, z) => map.grid?.[Math.floor(z)]?.[Math.floor(x)] === '#';

        // Mèo, chó, vịt cố định + rải nhẹ quanh bãi cỏ
        const groundCritters = [
            ['cat', 28.2, 16.5], ['cat', 12.2, 8.8], ['dog', 29.4, 9.2], ['dog', 11.2, 19.5],
            ['duck', 4.5, 12.2], ['duck', 4.8, 12.8],
        ];
        for (let i = 0; i < 4; i++) {
            for (let tries = 0; tries < 60; tries++) {
                const cx = 2 + Math.floor(r() * (cols - 4)), cz = 2 + Math.floor(r() * (rows - 4));
                if (map.grid?.[cz]?.[cx] === '.' && tileAt(cx, cz) === 'g' && !groundCritters.some(c => Math.hypot(c[1] - cx, c[2] - cz) < 4)) {
                    groundCritters.push([i % 2 ? 'dog' : 'cat', cx + 0.5, cz + 0.5]); break;
                }
            }
        }
        const roaming = groundCritters.map(([kind, hx, hz], i) => {
            const h = kind === 'dog' ? 0.85 : kind === 'duck' ? 0.62 : 0.72;
            const m = new THREE.Mesh(getCritterGeo(kind, h), critterMat);
            m.position.set(hx, 0, hz); m.castShadow = true; group.add(m);
            return { m, kind, hx, hz, ph: i * 1.7, scareAt: -10, sx: 1, sz: 0 };
        });

        const chickens = chickenSpots.map(([hx, hz], i) => {
            const m = new THREE.Mesh(getCritterGeo(i % 2 ? 'chicken_b' : 'chicken_w', 0.62), critterMat);
            m.position.set(hx, 0, hz); m.castShadow = true; group.add(m);
            return { m, hx, hz, ph: i * 2.3 };
        });

        const butterflies = butterflySpots.map(([hx, hz], i) => {
            const m = new THREE.Mesh(getCritterGeo('butterfly' + (i % 3), 0.36), critterMat);
            m.position.set(hx, 0.85, hz); group.add(m);
            return { m, hx, hz, ph: i * 1.9 };
        });

        const perches = [...roofPerches.slice(0, 4), ...treePerches.filter((_, i) => i % 6 === 0).slice(0, 6)];
        const birds = perches.map(([px, py, pz], i) => {
            const m = new THREE.Mesh(getCritterGeo('bird', 0.52), critterMat);
            m.position.set(px, py, pz); group.add(m);
            return { m, px, py, pz, ph: i * 2.1 };
        });

        const smokeMat = trackMat(new THREE.MeshBasicMaterial({ map: critterTex, transparent: true, depthWrite: false, opacity: 0.72 }));
        const smokeGeo = getCritterGeo('smoke', 0.75);
        const puffs = [];
        for (const [cx, cy, cz] of chimneySpots.slice(0, 5)) {
            for (let k = 0; k < 2; k++) {
                const m = new THREE.Mesh(smokeGeo, smokeMat);
                group.add(m);
                puffs.push({ m, cx, cy, cz, off: k * 0.5 + rr(0, 0.2), sp: rr(0.24, 0.35) });
            }
        }

        const leaves = Array.from({ length: 16 }, (_, i) => {
            const m = new THREE.Mesh(getCritterGeo('leaf' + (i % 2), 0.36), critterMat);
            group.add(m);
            return { m, x: 20, y: -1, z: 12, ph: i * 1.37, sp: rr(0.65, 1.15) };
        });

        anim.push((t, dt) => {
            const hx = uHeroPos.value.x, hz = uHeroPos.value.z;
            for (const c of roaming) {
                const dHero = Math.hypot(hx - c.hx, hz - c.hz);
                if (dHero < 2.8 && t - c.scareAt > 3.5) {
                    c.scareAt = t;
                    const len = Math.max(0.2, dHero);
                    c.sx = (c.hx - hx) / len; c.sz = (c.hz - hz) / len;
                }
                const dtS = t - c.scareAt;
                let nx, nz;
                if (dtS >= 0 && dtS < 2.2) {
                    const p = Math.sin((dtS / 2.2) * Math.PI);
                    nx = c.hx + c.sx * p * 1.1; nz = c.hz + c.sz * p * 1.1;
                } else {
                    const a = t * 0.55 + c.ph;
                    nx = c.hx + Math.cos(a) * 0.28; nz = c.hz + Math.sin(a * 0.8) * 0.24;
                }
                if (!isBlocked(nx, nz)) { nx = c.hx; nz = c.hz; }
                c.m.scale.x = nx < c.m.position.x - 0.002 ? 1 : nx > c.m.position.x + 0.002 ? -1 : c.m.scale.x;
                c.m.position.set(nx, Math.abs(Math.sin(t * 4.2 + c.ph)) * 0.04, nz);
            }
            for (const ch of chickens) {
                const peck = Math.sin(t * 5.5 + ch.ph) > 0.72 ? -0.22 : 0;
                const a = t * 0.45 + ch.ph;
                ch.m.position.set(ch.hx + Math.cos(a) * 0.22, Math.abs(Math.sin(t * 6 + ch.ph)) * 0.03, ch.hz + Math.sin(a) * 0.16);
                ch.m.rotation.z = peck;
                ch.m.scale.x = Math.sin(a) >= 0 ? 1 : -1;
            }
            for (const b of butterflies) {
                const dist = Math.hypot(hx - b.hx, hz - b.hz);
                const lift = dist < 3.2 ? (3.2 - dist) * 0.35 : 0;
                const a = t * 1.5 + b.ph;
                b.m.position.set(b.hx + Math.cos(a) * 0.55, 0.72 + lift + Math.sin(t * 3 + b.ph) * 0.2, b.hz + Math.sin(a * 0.7) * 0.45);
                b.m.scale.set(0.65 + Math.abs(Math.sin(t * 14 + b.ph)) * 0.5, 1, 1);
            }
            for (const b of birds) {
                b.m.position.set(b.px, b.py + Math.abs(Math.sin(t * 3.4 + b.ph)) * 0.05, b.pz);
                b.m.rotation.z = Math.sin(t * 1.8 + b.ph) * 0.08;
            }
            for (const p of puffs) {
                const cy = ((t * p.sp + p.off) % 1);
                p.m.position.set(p.cx + Math.sin(cy * 5 + p.off) * 0.22, p.cy + cy * 1.9, p.cz);
                const s = (0.35 + cy * 0.9) * (1 - cy * 0.35);
                p.m.scale.setScalar(s);
            }
            leaves.forEach((l, i) => {
                if (quality === 'low' && i >= 8) { l.m.visible = false; return; }
                l.m.visible = true;
                if (l.y < 0.08) { l.x = uHeroPos.value.x + rr(-12, 12); l.z = uHeroPos.value.z + rr(-9, 7); l.y = rr(3.5, 6.8); }
                l.y -= dt * l.sp;
                l.m.position.set(l.x + Math.sin(t * 1.7 + l.ph) * 0.55, l.y, l.z);
                l.m.rotation.set(t * l.sp + l.ph, t * 0.8 + l.ph, Math.sin(t * 2 + l.ph));
            });
        });

        for (const l of lights) l.visible = quality === 'high';
        return { group, anim, lights, pickables };
    }

    async function setMap(id) {
        if (id === mapId && cur) return;
        mapId = id;
        building = (async () => {
            if (id !== 'ashford') {
                console.warn('[worldpaper] chỉ hỗ trợ bản đồ ashford, nhận:', id);
                return;
            }
            if (!cache.has(id)) cache.set(id, buildAshfordScene());
            const built = cache.get(id);
            if (mapId !== id) return;
            if (cur) scene.remove(cur.group);
            cur = built;
            scene.add(cur.group);
            for (const l of cur.lights) l.visible = quality === 'high';
            snapCam = true;
            perf.reset();
        })();
        await building;
    }

    // ---------- Nhân vật & Đồ vật viền giấy kem (heroSheet) ----------
    const sheetCache = new Map();
    function paperSheetTex(url, meta) {
        if (sheetCache.has(url)) return sheetCache.get(url);
        const ph = document.createElement('canvas'); ph.width = ph.height = 8;
        const tex = new THREE.CanvasTexture(ph);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = renderer.capabilities.isWebGL2 ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
        tex.generateMipmaps = renderer.capabilities.isWebGL2;
        const pad = 14, scale = 4;
        const cw = (meta?.cw ?? 65) * scale + pad * 2, ch = (meta?.ch ?? 96) * scale + pad * 2;
        const entry = { tex, ratio: cw / ch, padBottom: pad / ch, loaded: false };
        sheetCache.set(url, entry);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (!sheetCache.has(url)) return;
            const sh = heroSheet(img, meta, scale, pad, 8);
            tex.image = sh.canvas;
            tex.needsUpdate = true;
            entry.ratio = sh.cellW / sh.cellH;
            entry.padBottom = pad / sh.cellH;
            entry.loaded = true;
        };
        img.src = url;
        return entry;
    }

    let questAtlasTex = null;
    const getQuestAtlasTex = () => {
        atlases ??= buildAshfordAtlases(20261120);
        questAtlasTex ??= makeTex(atlases.quest.canvas);
        return questAtlasTex;
    };

    const shadowGeo = trackGeo(new THREE.CircleGeometry(0.36, 18));
    const shadowMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x261a08, transparent: true, opacity: 0.30, depthWrite: false }));
    const actors = new Map();

    function ensureActor(key, url, meta) {
        let a = actors.get(key);
        if (a && a.url === url) return a;
        if (a) {
            sprites.remove(a.g);
            a.tex.dispose();
            a.sp.material.dispose();
            a.ghost?.material?.dispose();
            if (a.bits) { a.bits.geometry.dispose(); a.bits.material.dispose(); }
            actors.delete(key);
        }
        const sh = paperSheetTex(url, meta);
        const tex = sh.tex.clone();
        tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, alphaTest: 0.42 });
        let dz = null, bits = null;
        if (key.startsWith('dz:')) {
            dz = { uDz: { value: 0 }, uGrid: { value: new THREE.Vector2(32, 48) }, uRows: { value: 4 } };
            mat.onBeforeCompile = (shader) => {
                Object.assign(shader.uniforms, dz);
                shader.fragmentShader = 'uniform float uDz; uniform vec2 uGrid; uniform float uRows;\n'
                    + shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
                        vec2 dzCell = floor(vMapUv * uGrid);
                        float dzN = fract(sin(dot(dzCell, vec2(127.1, 311.7))) * 43758.5453);
                        float dzTh = dzN * 0.55 + (1.0 - fract(vMapUv.y * uRows)) * 0.25;
                        if (uDz > dzTh + 0.12) discard;
                        if (uDz > dzTh) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.93, 0.7), 0.85);`);
            };
            mat.customProgramCacheKey = () => 'paper_dissolve';
            const n = 26, pos = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 0.8; pos[i * 3 + 1] = 0.2 + Math.random() * CHAR_H * 0.9; pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3; }
            const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            bits = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe9a8, size: 0.09, transparent: true, depthWrite: false, opacity: 0 }));
        }
        const sp = new THREE.Sprite(mat);
        sp.center.set(0.5, sh.padBottom);
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.024;
        const g = new THREE.Group();
        g.add(sp, shadow);
        if (bits) g.add(bits);
        sprites.add(g);
        a = { g, sp, sh: shadow, tex, url, shRef: sh, seen: 0, dz, bits };
        if (!dz) {
            a.ghost = new THREE.Sprite(new THREE.SpriteMaterial({
                map: tex, alphaTest: 0.42, depthTest: true, depthFunc: THREE.GreaterDepth,
                depthWrite: false, transparent: true, opacity: key === 'me' ? 0.36 : 0.28,
            }));
            a.ghost.center.set(0.5, sh.padBottom);
            a.ghost.renderOrder = 20;
            g.add(a.ghost);
        }
        actors.set(key, a);
        return a;
    }

    function ensureQuestCutout(key, qKey) {
        let a = actors.get(key);
        if (a && a.qKey === qKey) return a;
        if (a) {
            sprites.remove(a.g);
            a.tex.dispose();
            a.sp.material.dispose();
            actors.delete(key);
        }
        const qTex = getQuestAtlasTex();
        const cell = atlases.quest.cells[qKey];
        const tex = qTex.clone();
        tex.needsUpdate = true;
        tex.repeat.set(cell.u1 - cell.u0, cell.v1 - cell.v0);
        tex.offset.set(cell.u0, cell.v0);
        const mat = new THREE.SpriteMaterial({ map: tex, alphaTest: 0.42 });
        const sp = new THREE.Sprite(mat);
        sp.center.set(0.5, cell.padBottom);
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.022;
        const g = new THREE.Group();
        g.add(sp, shadow);
        sprites.add(g);
        a = { g, sp, sh: shadow, tex, qKey, cell, seen: 0 };
        actors.set(key, a);
        return a;
    }

    function questKeyFor(s) {
        if (s.key.endsWith(':sp')) return 'i_spark';
        const obj = ashfordObjById.get(s.key);
        const sp = obj?.sprite;
        if (!sp) return null;
        if (sp === 'chest') return s.cell === 1 ? 'chest_open' : 'chest';
        if (sp === 'board') return 'daily_board';
        if (sp === 'ledger') return 'ledger';
        if (atlases?.quest.cells[sp]) return sp;
        return null;
    }

    const labels = new Map();
    function labelMat(txt, color) {
        const k = txt + color;
        if (!labels.has(k)) {
            const c = document.createElement('canvas'); c.width = c.height = 64;
            const g = c.getContext('2d');
            g.font = '900 52px Outfit, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 8; g.strokeStyle = '#f6e9cd'; g.strokeText(txt, 32, 34);
            g.fillStyle = color; g.fillText(txt, 32, 34);
            const t = trackTex(new THREE.CanvasTexture(c));
            t.colorSpace = THREE.SRGBColorSpace;
            labels.set(k, trackMat(new THREE.SpriteMaterial({ map: t, depthTest: false })));
        }
        return labels.get(k);
    }
    const marks = new Map();
    function getMark(key, txt, color) {
        let s = marks.get(key);
        if (!s) { s = new THREE.Sprite(); s.scale.set(0.64, 0.64, 1); s.renderOrder = 15; sprites.add(s); marks.set(key, s); }
        s.material = labelMat(txt, color);
        return s;
    }

    // Chấm vàng & vòng tròn mục tiêu cắt giấy khi đi tự động
    const dotGeo = trackGeo(new THREE.CircleGeometry(0.11, 12));
    const dotMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xfef0b8, transparent: true, opacity: 0.88, depthWrite: false }));
    const dots = [];
    const markerTex = makeTex(drawMarker());
    const markerGeo = trackGeo(new THREE.PlaneGeometry(1.15, 1.15));
    const markerMat = trackMat(new THREE.MeshBasicMaterial({ map: markerTex, color: 0xfff6dc, transparent: true, depthWrite: false, opacity: 0 }));
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.05;
    sprites.add(marker);

    // ---------- Vòng vẽ từng khung ----------
    const camWant = new THREE.Vector3(), camLook = new THREE.Vector3(), proj = new THREE.Vector3();
    let frameNo = 0, last = performance.now(), t = 0, seeAlpha = 1;
    let shadowTick = 0;
    const lastShadowAt = new THREE.Vector3(1e9, 0, 0);

    function frame(state) {
        const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
        t += dt; uTime.value = t; frameNo++;
        if (!cur) return;

        const tint = dayTint(Date.now());
        if (tiltPass) {
            tiltPass.uniforms.uDay.value.set(tint[0], tint[1], tint[2]);
            tiltPass.uniforms.uTime.value = t % 10;
        }

        let meX = state.focus.x, meZ = state.focus.z, meLift = 0;
        const mapHeights = MAPS[mapId]?.heights;

        for (const s of state.actors) {
            if (!s.url || !s.meta) continue;
            const hLvl = Number(s.h ?? (s.key === 'me' ? state.focus?.h : null) ?? mapHeights?.[Math.floor(s.z)]?.[Math.floor(s.x)]) || 0;
            const elev = hLvl * H_STEP;
            const lift = s.key === 'me' && hLvl ? Math.max(0, (s.lift ?? 0) - hLvl * 0.35) : (s.lift ?? 0);
            if (s.key === 'me') { meX = s.x; meZ = s.z; meLift = lift + elev; }

            const a = ensureActor(s.key, s.url, s.meta);
            a.seen = frameNo;
            a.g.visible = !s.hidden;
            if (a.shRef.loaded && a.tex.image !== a.shRef.tex.image) {
                a.tex.image = a.shRef.tex.image;
                a.tex.needsUpdate = true;
                a.sp.center.set(0.5, a.shRef.padBottom);
                if (a.ghost) a.ghost.center.set(0.5, a.shRef.padBottom);
            }
            const { cols = 3, rows = 4, cw, ch } = s.meta;
            a.tex.repeat.set(1 / cols, 1 / rows);
            a.tex.offset.set(s.col / cols, 1 - ((ROW[s.face] ?? 0) + 1) / rows);
            const charH = s.charH ?? CHAR_H;
            a.sp.scale.set(charH * a.shRef.ratio, charH, 1);
            a.sp.position.y = lift;
            const moving = s.key === 'me' && s.col !== 1 && !s.hidden && lift < 0.08;
            a.sp.material.rotation = moving ? Math.sin(t * 16) * 0.045 : 0;
            if (a.ghost) {
                a.ghost.scale.copy(a.sp.scale);
                a.ghost.position.copy(a.sp.position);
                a.ghost.material.rotation = a.sp.material.rotation;
            }
            const jumpAmt = Math.max(lift, Math.abs(hLvl - Math.round(hLvl)) * 0.9);
            a.sh.scale.setScalar(1 - Math.min(0.55, jumpAmt * 0.55));
            if (a.dz) {
                const p = s.dissolve ?? 0;
                a.dz.uDz.value = p; a.dz.uGrid.value.set(cols * cw / 8, rows * ch / 8); a.dz.uRows.value = rows;
                a.sh.scale.setScalar(Math.max(0.01, 1 - p));
                a.bits.position.y = p * p * 1.6; a.bits.scale.set(1 + p, 1, 1 + p);
                a.bits.material.opacity = p > 0 ? Math.min(1, p * 4) * (1 - p) : 0;
            }
            a.g.position.set(s.x, elev, s.z);
        }

        // Đồ vật & vật phẩm nhiệm vụ
        for (const s of state.items) {
            const qKey = questKeyFor(s);
            const itemElev = (Number(s.h ?? mapHeights?.[Math.floor(s.z)]?.[Math.floor(s.x)]) || 0) * H_STEP;
            if (qKey) {
                const a = ensureQuestCutout('it:' + s.key, qKey);
                a.seen = frameNo; a.g.visible = true;
                const h = s.key.endsWith(':sp') ? (s.size ?? 0.45) * 1.15 : Math.max(0.75, (s.size ?? 1) * 1.05);
                a.sp.scale.set(h * (a.cell.w / a.cell.h), h, 1);
                a.sp.position.y = s.bob ? Math.sin(t * 3.3) * 0.07 : 0;
                a.sh.scale.setScalar(s.key.endsWith(':sp') ? 0.01 : Math.max(0.45, (s.size ?? 1) * 0.72));
                a.g.position.set(s.x, itemElev, s.z);
                continue;
            }
            const a = ensureActor('it:' + s.key, s.url, s.meta);
            a.seen = frameNo; a.g.visible = true;
            if (a.shRef.loaded && a.tex.image !== a.shRef.tex.image) {
                a.tex.image = a.shRef.tex.image;
                a.tex.needsUpdate = true;
                a.sp.center.set(0.5, a.shRef.padBottom);
            }
            const { cols, rows } = s.meta;
            a.tex.repeat.set(1 / cols, 1 / rows);
            a.tex.offset.set((s.cell % cols) / cols, 1 - (Math.floor(s.cell / cols) + 1) / rows);
            a.sp.scale.set(s.size * a.shRef.ratio, s.size, 1);
            a.sp.position.y = s.bob ? Math.sin(t * 3.3) * 0.06 : 0;
            a.sh.scale.setScalar((s.size ?? 1) * 0.75);
            a.g.position.set(s.x, itemElev, s.z);
        }

        for (const [k, a] of actors) {
            if (a.seen !== frameNo) {
                sprites.remove(a.g); a.tex.dispose(); a.sp.material.dispose();
                a.ghost?.material?.dispose();
                if (a.bits) { a.bits.geometry.dispose(); a.bits.material.dispose(); }
                actors.delete(k);
            }
        }

        // Dấu ! ? & mũi tên nhiệm vụ
        const seenM = new Set();
        for (const m of state.marks) {
            const s = getMark(m.key, m.txt, m.color);
            s.visible = true; s.position.set(m.x, (m.y ?? 2.25) + Math.sin(t * 3.2) * 0.08, m.z);
            seenM.add(m.key);
        }
        if (state.beacon) {
            const s = getMark('beacon', '▼', '#ffe066');
            s.visible = true; s.position.set(state.beacon.x, 2.95 + Math.sin(t * 4) * 0.14, state.beacon.z);
            seenM.add('beacon');
        }
        for (const [k, s] of marks) if (!seenM.has(k)) s.visible = false;

        // Đường đi & vòng đánh dấu điểm tới
        const route = state.route ?? [];
        while (dots.length < route.length) {
            const dMesh = new THREE.Mesh(dotGeo, dotMat);
            dMesh.rotation.x = -Math.PI / 2; sprites.add(dMesh); dots.push(dMesh);
        }
        dots.forEach((dMesh, i) => {
            dMesh.visible = i < route.length;
            if (dMesh.visible) {
                const ry = (Number(mapHeights?.[Math.floor(route[i].z)]?.[Math.floor(route[i].x)]) || 0) * H_STEP + 0.04;
                dMesh.position.set(route[i].x, ry, route[i].z);
            }
        });
        dotMat.opacity = 0.55 + Math.sin(t * 6) * 0.25;

        if (route.length) {
            const dest = route[route.length - 1];
            const my = (Number(mapHeights?.[Math.floor(dest.z)]?.[Math.floor(dest.x)]) || 0) * H_STEP + 0.045;
            marker.visible = true;
            marker.position.set(dest.x, my, dest.z);
            marker.rotation.z = t * 1.25;
            markerMat.opacity = 0.85;
        } else {
            markerMat.opacity = Math.max(0, markerMat.opacity - dt * 4);
            marker.visible = markerMat.opacity > 0.01;
        }

        for (const f of cur.anim) f(t, dt);

        // Máy quay bám nhân vật + giữ vùng nét Tilt-Shift vào nhân vật
        const m = MAPS[mapId];
        const fx = clampN(state.focus.x, 7, m.cols - 7), fz = clampN(state.focus.z, 3, m.rows - 2);
        camWant.set(fx, 15.2 * zoom * fit, fz + 14.8 * zoom * fit);
        if (snapCam) { camera.position.copy(camWant); snapCam = false; }
        else camera.position.lerp(camWant, 1 - Math.exp(-dt * 5));
        camLook.set(camera.position.x, 0.55, camera.position.z - 14.8 * zoom * fit);
        camera.lookAt(camLook);

        const seeOff = typeof location !== 'undefined' && new URLSearchParams(location.search).get('seeThrough') === 'off';
        seeAlpha += ((seeOff ? 0 : 1) - seeAlpha) * Math.min(1, dt * 8);
        uSeeThrough.value = seeAlpha;
        uHeroPos.value.lerp(camLook.set(meX, 0.82 + meLift, meZ), Math.min(1, dt * 14));
        uCamPos.value.copy(camera.position);

        if (tiltPass) {
            proj.copy(uHeroPos.value).project(camera);
            tiltPass.uniforms.uFocusY.value = clampN(proj.y * 0.5 + 0.5, 0.24, 0.72);
        }

        // Nắng chiếu chếch từ phía trước-trái để mặt trước các tấm giấy dựng đứng luôn rạng rỡ
        sun.position.set(fx - 9, 20, fz + 11);
        sun.target.position.set(fx, 0, fz);
        if (++shadowTick >= 3 || camera.position.distanceToSquared(lastShadowAt) > 0.04) {
            renderer.shadowMap.needsUpdate = true; shadowTick = 0; lastShadowAt.copy(camera.position);
        }
        if (host.clientWidth && host.clientHeight) composer.render();
        perf.sample(now);
    }

    // ---------- Tự hạ chất lượng khi máy yếu ----------
    let onAuto = null, autoQ = false;
    const perf = {
        t0: 0, n: 0, last: 0, skipUntil: 0,
        reset() { this.t0 = 0; this.n = 0; this.skipUntil = performance.now() + 2500; },
        sample(now) {
            if (!autoQ || document.hidden || now < this.skipUntil) { this.t0 = 0; this.n = 0; return; }
            if (now - this.last > 250) { this.t0 = 0; this.n = 0; }
            this.last = now;
            if (!this.t0) { this.t0 = now; this.n = 0; return; }
            this.n++;
            if (now - this.t0 < 3000) return;
            const fps = this.n * 1000 / (now - this.t0);
            this.t0 = 0; this.n = 0;
            if (fps >= 48) return;
            if (quality === 'high') { setQuality('low'); onAuto?.('low', fps); }
            else if (resScale > 0.6) { resScale = Math.max(0.6, resScale - 0.15); applyRes(); this.skipUntil = now + 1500; onAuto?.('res', fps); }
        },
    };
    const setAuto = (auto, cb) => { autoQ = auto; onAuto = cb; perf.reset(); };

    // ---------- Bấm chọn ô (raycast bậc cao trước, rồi mặt phẳng đất) ----------
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    function pick(clientX, clientY) {
        const r = renderer.domElement.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        ndc.set((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
        ray.setFromCamera(ndc, camera);
        if (cur?.pickables?.length) {
            const hits = ray.intersectObjects(cur.pickables, false);
            if (hits.length) {
                const p = hits[0].point;
                return { x: Math.floor(p.x), y: Math.floor(p.z) };
            }
        }
        if (!ray.ray.intersectPlane(plane, hit)) return null;
        return { x: Math.floor(hit.x), y: Math.floor(hit.z) };
    }

    const snapshot = (q = 0.85) => { composer.render(); return renderer.domElement.toDataURL('image/jpeg', q); };
    const hsv = new THREE.Vector3();
    function heroScreen() {
        hsv.copy(uHeroPos.value).project(camera);
        const el = renderer.domElement;
        return { x: (hsv.x * 0.5 + 0.5) * el.clientWidth, y: (-hsv.y * 0.5 + 0.5) * el.clientHeight, el };
    }

    function dispose() {
        renderer.domElement.removeEventListener('wheel', onWheel);
        for (const a of actors.values()) {
            a.tex.dispose(); a.sp.material.dispose();
            a.ghost?.material?.dispose();
            if (a.bits) { a.bits.geometry.dispose(); a.bits.material.dispose(); }
        }
        actors.clear();
        for (const e of sheetCache.values()) e.tex.dispose();
        sheetCache.clear();
        for (const m of labels.values()) { m.map?.dispose(); m.dispose(); }
        labels.clear();
        for (const d of disposables) d?.dispose?.();
        disposables.length = 0;
        sun.shadow.map?.dispose();
        composer?.renderTarget1?.dispose?.();
        composer?.renderTarget2?.dispose?.();
        composer?.dispose?.();
        renderer.dispose();
        renderer.domElement.remove();
        cache.clear();
        cur = null;
    }

    setQuality('high');
    return {
        setMap, frame, pick, setQuality, setAuto, resize, snapshot, heroScreen, dispose,
        get building() { return building; },
        get mapId() { return mapId; },
        canvas: renderer.domElement,
    };
}
