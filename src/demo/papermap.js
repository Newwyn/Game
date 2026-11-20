// Bản thử: bản đồ ngoài map kiểu "mô hình giấy cắt dán" + nhân vật đi lại.
// Trang đứng riêng (demo-map.html), không đụng tới game chính.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import heroUrl from '../assets/overworld/hero_m.webp';
import heroMeta from '../assets/overworld/hero_m.json';
import * as art from './paperart.js';

const rand = art.rng(20261120);
const rr = (a, b) => a + rand() * (b - a);

// ---- kích thước thế giới (đơn vị: "ô") ----
const X0 = -28, Z0 = -20, GW = 56, GD = 36;           // tấm giấy nền
const WALK = { x0: -20, x1: 20, z0: -14.5, z1: 12.5 };  // vùng đi được
const RIVER_HALF = 1.6, PATH_HALF = 0.95;
const BRIDGE = { x: -2.5, z0: 4.7, z1: 9.1, half: 1.0 };

const curvePts = (pts, n) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)))
    .getSpacedPoints(n).map(p => [p.x, p.z]);
const RIVER = curvePts([[-30, 6.3], [-18, 6.6], [-8, 7.0], [2, 6.6], [9, 7.2], [13.5, 5.2], [15, 1.6], [17.5, -1], [22, -1.6], [30, -1.2]], 220);
const PATHS = [
    curvePts([[-2.5, 17], [-2.5, 9], [-2.5, 4], [-1.6, 0.5], [0.8, -3.5], [2.6, -7.5], [3.2, -11]], 120),
    curvePts([[-1.4, 0], [3, 0.6], [7.5, -0.6], [11.5, -3.2], [13, -6.5]], 70),
];

function distPolyline(pts, x, z) {
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
        const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
        const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        const d = Math.hypot(x - ax - dx * t, z - az - dz * t);
        if (d < best) best = d;
    }
    return best;
}
const distRiver = (x, z) => distPolyline(RIVER, x, z);
const distPath = (x, z) => Math.min(distPolyline(PATHS[0], x, z), distPolyline(PATHS[1], x, z));
const onBridge = (x, z) => Math.abs(x - BRIDGE.x) < BRIDGE.half - 0.15 && z > BRIDGE.z0 - 0.3 && z < BRIDGE.z1 + 0.3;

// ---- khung vẽ ----
const canvas = document.getElementById('paper-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#9c8f5e');
const camera = new THREE.PerspectiveCamera(30, 1, 1, 200);

scene.add(new THREE.HemisphereLight('#fff4e0', '#c9a777', 1.75));
const sun = new THREE.DirectionalLight('#ffdfae', 2.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -26; sun.shadow.camera.right = 26; sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0006; sun.shadow.radius = 3.5;
scene.add(sun, sun.target);

const tex = (cv) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
};

// ---- mặt đất ----
const obstacles = [];   // {x, z, r}: chỗ nhân vật không đi xuyên qua
const placed = [];      // mọi vật đã đặt, để các vật không đè lên nhau
{
    const W = 3072, H = Math.round(W * GD / GW), ppu = W / GW;
    const cv = art.paintGround({
        W, H, ppu, r: rand, x0: X0, z0: Z0, gw: GW, gd: GD,
        px: (x) => (x - X0) * ppu, pz: (z) => (z - Z0) * ppu,
        river: RIVER, riverHalf: RIVER_HALF, paths: PATHS, pathHalf: PATH_HALF,
        free: (x, z) => distRiver(x, z) > RIVER_HALF + 0.5 && distPath(x, z) > PATH_HALF + 0.3,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), new THREE.MeshStandardMaterial({ map: tex(cv), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(X0 + GW / 2, 0, Z0 + GD / 2);
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);
    // mặt bàn bên dưới, lộ ra ngoài mép tấm giấy
    const table = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#a59866', roughness: 1 }));
    table.rotation.x = -Math.PI / 2; table.position.y = -0.06; table.receiveShadow = true;
    scene.add(table);
}

// ---- miếng giấy dựng đứng ----
function cutMat(cv) {
    return new THREE.MeshStandardMaterial({ map: tex(cv), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
}
// tấm giấy cao h, chân chạm đất (padBottom: phần viền trống dưới chân hình, tính theo tỉ lệ)
function card(mat, h, padBottom = 0.03) {
    const img = mat.map.image, w = h * img.width / img.height;
    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, h / 2 - h * padBottom, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
}

const treeMats = [];
for (const pal of art.TREE_PALS) for (let i = 0; i < 2; i++) treeMats.push(cutMat(art.drawRoundTree(pal, rand)));
const pineMats = [cutMat(art.drawPine(rand)), cutMat(art.drawPine(rand))];
const fanMats = art.FAN_PALS.map(p => cutMat(art.drawFanBush(p, rand)));
const flowerMats = [cutMat(art.drawFlowerBush(rand)), cutMat(art.drawFlowerBush(rand, '#f6c659', '#c9472e')), cutMat(art.drawFlowerBush(rand, '#f3e8d2', '#f0b04a'))];
const reedMats = [cutMat(art.drawReeds(rand)), cutMat(art.drawReeds(rand))];
const rockMats = [cutMat(art.drawRock(rand)), cutMat(art.drawRock(rand)), cutMat(art.drawRock(rand))];
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const swayers = [];
// cây: 2 tấm cắm chéo chữ thập
function addTree(x, z, mat, h, solid = true) {
    const g = new THREE.Group();
    const a = card(mat, h), b = card(mat, h);
    b.rotation.y = Math.PI / 2;
    g.add(a, b);
    g.position.set(x, 0, z);
    g.rotation.y = rr(0.35, 0.75) * (rand() < 0.5 ? -1 : 1);
    scene.add(g);
    swayers.push({ g, x, z, cards: [a, b], solidMat: mat, fadeMat: null, fade: 1, ph: rand() * 6.28, amp: rr(0.012, 0.024) });
    placed.push({ x, z, r: 1.5 });
    if (solid) obstacles.push({ x, z, r: 0.45 });
    return g;
}
// bụi: 2–3 lớp giấy xếp so le trước sau
function addLayered(x, z, mats, h, layers = 2) {
    const g = new THREE.Group();
    for (let i = 0; i < layers; i++) {
        const m = card(pick(mats), h * rr(0.75, 1.05));
        m.position.set((i - (layers - 1) / 2) * h * rr(0.5, 0.8), 0, i * 0.22);
        m.rotation.y = rr(-0.18, 0.18);
        g.add(m);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    placed.push({ x, z, r: 0.9 });
    return g;
}
function addSingle(x, z, mat, h, solidR = 0) {
    const m = card(mat, h);
    m.position.set(x, 0, z);
    m.rotation.y = rr(-0.25, 0.25);
    scene.add(m);
    placed.push({ x, z, r: 0.8 });
    if (solidR) obstacles.push({ x, z, r: solidR });
    return m;
}

const clearOf = (x, z, gap) => placed.every(p => Math.hypot(p.x - x, p.z - z) > p.r + gap);
function scatter(count, minPath, minRiver, gap, fn, area = { x0: X0 + 1, x1: X0 + GW - 1, z0: Z0 + 1, z1: Z0 + GD - 1.5 }) {
    let made = 0;
    for (let tries = 0; made < count && tries < count * 60; tries++) {
        const x = rr(area.x0, area.x1), z = rr(area.z0, area.z1);
        if (distPath(x, z) < minPath || distRiver(x, z) < RIVER_HALF + minRiver || !clearOf(x, z, gap)) continue;
        if (Math.hypot(x - 3.2, z + 13.2) < 4.2) continue;   // chừa chỗ cho ngôi nhà
        fn(x, z); made++;
    }
}

// nhà ở cuối đường + đèn cửa sổ
{
    const house = card(cutMat(art.drawHouse(rand)), 5.6);
    house.position.set(3.2, 0, -13.2);
    scene.add(house);
    placed.push({ x: 3.2, z: -13.2, r: 3.6 });
    for (const dx of [-2.2, 0, 2.2]) obstacles.push({ x: 3.2 + dx, z: -13.2, r: 1.5 });
    const lamp = new THREE.PointLight('#ffc45a', 14, 9, 1.6);
    lamp.position.set(3.2, 1.4, -11.6);
    scene.add(lamp);
}

// vài cụm xếp tay cho giống bố cục ảnh mẫu
addTree(-6.2, 9.8, treeMats[0], 4.6); addTree(1.6, 10.6, treeMats[5], 4.2); addTree(-9.5, -1.5, pineMats[0], 5.0);
addTree(-11.6, -5.2, pineMats[1], 4.4); addTree(1.2, 3.4, treeMats[2], 4.8); addTree(-5.6, -3.2, treeMats[6], 4.4);
addTree(5.6, -4.6, treeMats[1], 4.6); addTree(8.4, 2.6, treeMats[4], 4.9);
addLayered(-8.6, 3.2, fanMats, 1.5, 3); addLayered(4.6, 3.6, fanMats, 1.3, 2); addLayered(-0.2, -7.2, fanMats, 1.3, 2);

scatter(44, 2.3, 1.6, 1.2, (x, z) => addTree(x, z, pick(treeMats), rr(3.8, 5.2)));
scatter(9, 2.3, 1.6, 1.2, (x, z) => addTree(x, z, pick(pineMats), rr(4.2, 5.4)));
scatter(26, 1.5, 0.8, 0.5, (x, z) => addLayered(x, z, fanMats, rr(1.1, 1.6), rand() < 0.4 ? 3 : 2));
scatter(30, 1.3, 0.7, 0.4, (x, z) => addLayered(x, z, flowerMats, rr(0.9, 1.3), 2));
scatter(16, 1.5, 0.9, 0.5, (x, z) => addSingle(x, z, pick(rockMats), rr(0.7, 1.1), 0.5));
// lau sậy mọc sát 2 bờ sông
for (let i = 8; i < RIVER.length - 8; i += 7) {
    const [x, z] = RIVER[i], [x2, z2] = RIVER[i + 1];
    const tl = Math.hypot(x2 - x, z2 - z) || 1, nx = -(z2 - z) / tl, nz = (x2 - x) / tl, side = rand() < 0.5 ? 1 : -1;
    const px = x + nx * side * (RIVER_HALF + rr(0.45, 0.9)), pz = z + nz * side * (RIVER_HALF + rr(0.45, 0.9));
    if (distPath(px, pz) < 1.6 || !clearOf(px, pz, 0.2) || rand() < 0.3) continue;
    addSingle(px, pz, pick(reedMats), rr(1.3, 1.9));
}

// cừu
const sheepMat = cutMat(art.drawSheep(rand));
const sheep = [[-7.4, 1.2], [-6.0, 2.0], [9.6, -2.2]].map(([x, z], i) => {
    const m = card(sheepMat, 1.15); m.position.set(x, 0, z); if (i === 1) m.scale.x = -1;
    scene.add(m); obstacles.push({ x, z, r: 0.55 });
    return { m, ph: i * 2.1 };
});

// cầu gỗ
{
    const len = BRIDGE.z1 - BRIDGE.z0;
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(BRIDGE.half * 2, len), new THREE.MeshStandardMaterial({ map: tex(art.drawDeck(rand)), roughness: 1 }));
    deck.rotation.x = -Math.PI / 2; deck.position.set(BRIDGE.x, 0.1, (BRIDGE.z0 + BRIDGE.z1) / 2);
    deck.castShadow = true; deck.receiveShadow = true;
    scene.add(deck);
    const postMat = cutMat(art.drawPost(rand));
    for (let i = 0; i <= 4; i++) for (const side of [-1, 1]) {
        const p = card(postMat, 1.25);
        p.position.set(BRIDGE.x + side * (BRIDGE.half + 0.12), 0, BRIDGE.z0 + i * len / 4);
        p.rotation.y = side * 0.25;
        scene.add(p);
    }
}

// vịt bơi theo dòng sông (không chui qua gầm cầu)
const duckMat = cutMat(art.drawDuck(rand));
const riverIdx = (x) => RIVER.findIndex(p => p[0] >= x);
const ducks = [[riverIdx(-17), riverIdx(-6), 0.5], [riverIdx(-14), riverIdx(-5), -0.6], [riverIdx(1), riverIdx(9), 0.4], [riverIdx(2), riverIdx(11), -0.5]]
    .map(([a, b, off], i) => {
        const m = card(duckMat, 0.78, 0.12); scene.add(m);
        return { m, a, b, off, t: a + (b - a) * rand(), dir: i % 2 ? 1 : -1, ph: rand() * 6 };
    });

// lá rơi
const leafMats = ['#e98a2c', '#d9602b', '#f0b04a'].map(c => new THREE.MeshStandardMaterial({ map: tex(art.drawLeaf(c)), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
const leaves = Array.from({ length: 16 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), leafMats[i % 3]);
    m.castShadow = true; scene.add(m);
    return { m, x: 0, z: 0, y: -1, ph: rand() * 6, sp: rr(0.7, 1.3) };
});

// vòng đánh dấu điểm tới
const marker = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3),
    new THREE.MeshBasicMaterial({ map: tex(art.drawMarker()), transparent: true, depthWrite: false, opacity: 0 }));
marker.rotation.x = -Math.PI / 2; marker.position.y = 0.16;
scene.add(marker);

// ---- nhân vật (dùng hình nhân vật bản đồ có sẵn của game) ----
const hero = { x: -2.5, z: 11.2, face: 'up', moving: false, step: 0, stepT: 0, target: null, stuck: 0, best: Infinity, mesh: null, tex: null };
const ROW = { down: 0, left: 1, right: 2, up: 3 };
const HERO_H = 1.9, SPEED = 4.2, HERO_R = 0.32;
{
    const img = new Image();
    img.onload = () => {
        const sh = art.heroSheet(img, heroMeta);
        const t = tex(sh.canvas);
        t.repeat.set(1 / heroMeta.cols, 1 / heroMeta.rows);
        const w = HERO_H * sh.cellW / sh.cellH;
        const geo = new THREE.PlaneGeometry(w, HERO_H);
        geo.translate(0, HERO_H / 2 - HERO_H * 0.045, 0);
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
        m.castShadow = true;
        m.rotation.x = -0.22;   // hơi ngả về phía máy quay cho dễ nhìn
        scene.add(m);
        hero.mesh = m; hero.tex = t;
    };
    img.src = heroUrl;
}

function walkable(x, z) {
    if (x < WALK.x0 || x > WALK.x1 || z < WALK.z0 || z > WALK.z1) return false;
    if (distRiver(x, z) < RIVER_HALF + 0.15 && !onBridge(x, z)) return false;
    // 2 bên lan can cầu: không bước ngang ra khỏi cầu xuống nước
    for (const o of obstacles) if (Math.hypot(o.x - x, o.z - z) < o.r + HERO_R) return false;
    return true;
}

const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- điều khiển ----
const keys = new Set();
const KEYMAP = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
addEventListener('keydown', (e) => { const k = KEYMAP[e.code]; if (k) { keys.add(k); hero.target = null; e.preventDefault(); } });
addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys.delete(k); });
addEventListener('blur', () => keys.clear());

const ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let down = null, markerT = 0;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) { down = null; return; }
    down = null;
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(groundPlane, hit)) return;
    const ok = walkable(hit.x, hit.z);
    marker.position.x = hit.x; marker.position.z = hit.z;
    marker.material.color.set(ok ? '#fff6dc' : '#d8452e');
    markerT = 1;
    hero.target = ok ? { x: hit.x, z: hit.z } : null;
    hero.stuck = 0; hero.best = Infinity;
});

let zoom = 1, fit = 1;
canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(0.6, Math.min(1.12, zoom * (e.deltaY > 0 ? 1.08 : 0.93))); }, { passive: false });

// ---- hậu kỳ: mờ xa–gần kiểu chụp mô hình tí hon + tông ấm ----
const TiltShift = {
    uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uFocusY: { value: 0.45 }, uStrength: { value: 1 }, uRadius: { value: 14 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uFocusY, uStrength, uRadius, uTime; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
            float amt = smoothstep(0.13, 0.50, abs(vUv.y - uFocusY)) * uStrength;
            vec3 col;
            if (amt < 0.02) col = texture2D(tDiffuse, vUv).rgb;
            else {
                vec3 acc = vec3(0.0);
                for (int i = 0; i < 36; i++) {
                    float fi = float(i), rad = sqrt((fi + 0.5) / 36.0), a = fi * 2.39996323;
                    acc += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * rad * amt * uRadius / uRes).rgb;
                }
                col = acc / 36.0;
            }
            col *= vec3(1.05, 1.0, 0.92);
            vec2 q = vUv - 0.5;
            col *= 1.0 - dot(q, q) * 0.6;
            col += (hash(vUv * uRes + uTime) - 0.5) * 0.012;
            gl_FragColor = vec4(col, 1.0);
        }`,
};
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const tilt = new ShaderPass(TiltShift);
composer.addPass(tilt);
composer.addPass(new OutputPass());

let blurOn = true;
const blurBtn = document.getElementById('btn-blur');
blurBtn.addEventListener('click', () => {
    blurOn = !blurOn;
    blurBtn.textContent = 'Làm mờ xa–gần: ' + (blurOn ? 'Bật' : 'Tắt');
    blurBtn.setAttribute('aria-pressed', String(blurOn));
});

function resize() {
    const w = Math.max(2, innerWidth), h = Math.max(2, innerHeight), dpr = Math.min(devicePixelRatio || 1, 2);   // cửa sổ bị thu về 0 (ẩn) vẫn không lỗi
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    tilt.uniforms.uRes.value.set(w * dpr, h * dpr);
    tilt.uniforms.uRadius.value = 15 * dpr * clampN(Math.min(w, h) / 800, 0.45, 1.2);
    fit = clampN(1.3 / camera.aspect, 1, 2.2);   // màn hình dọc: lùi máy quay ra để vẫn thấy đủ bề ngang
}
addEventListener('resize', resize);
resize();

// ---- vòng lặp ----
const camTarget = new THREE.Vector3(hero.x, 0, 7);
const proj = new THREE.Vector3();
let last = performance.now(), time = 0;

function moveHero(dt) {
    let dx = 0, dz = 0;
    if (keys.size) {
        dx = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0);
        dz = (keys.has('d') ? 1 : 0) - (keys.has('u') ? 1 : 0);
    } else if (hero.target) {
        dx = hero.target.x - hero.x; dz = hero.target.z - hero.z;
        if (Math.hypot(dx, dz) < 0.12) { hero.target = null; dx = dz = 0; }
    }
    const len = Math.hypot(dx, dz);
    let moved = false;
    if (len > 0) {
        const step = Math.min(SPEED * dt, hero.target && !keys.size ? len : Infinity);
        const sx = dx / len * step, sz = dz / len * step;
        // thử đi thẳng; vướng thì trượt theo 1 chiều
        for (const [mx, mz] of [[sx, sz], [sx, 0], [0, sz]]) {
            if ((mx || mz) && walkable(hero.x + mx, hero.z + mz)) { hero.x += mx; hero.z += mz; moved = true; break; }
        }
        hero.face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz > 0 ? 'down' : 'up');
        if (hero.target && !keys.size) {
            // không tiến gần đích thêm được nữa (vướng cây, đá, sông) thì dừng hẳn, không đứng giậm chân
            const left = Math.hypot(hero.target.x - hero.x, hero.target.z - hero.z);
            if (left < hero.best - 0.02) { hero.best = left; hero.stuck = 0; }
            else if ((hero.stuck += dt) > 0.3) { hero.target = null; moved = false; }
        }
    }
    hero.moving = moved;
    if (moved) { hero.stepT += dt; if (hero.stepT > 0.16) { hero.stepT = 0; hero.step++; } }
}

function update(dt) {
    time += dt;
    moveHero(dt);

    if (hero.mesh) {
        const col = hero.moving ? (hero.step % 2 ? 0 : 2) : 1, row = ROW[hero.face];
        hero.tex.offset.set(col / heroMeta.cols, 1 - (row + 1) / heroMeta.rows);
        const hop = hero.moving ? Math.abs(Math.sin(time * 19)) * 0.1 : 0;
        hero.mesh.position.set(hero.x, (onBridge(hero.x, hero.z) ? 0.12 : 0) + hop, hero.z);
        hero.mesh.rotation.z = hero.moving ? Math.sin(time * 19) * 0.05 : 0;
    }

    // máy quay bám theo nhân vật
    const k = 1 - Math.exp(-dt * 4);
    camTarget.x += (clampN(hero.x, -9.5, 9.5) - camTarget.x) * k;
    camTarget.z += (clampN(hero.z, -6, 8.5) - camTarget.z) * k;
    camera.position.set(camTarget.x, 15 * zoom * fit, camTarget.z + 17 * zoom * fit);
    camera.lookAt(camTarget.x, 0.6, camTarget.z);
    sun.target.position.copy(camTarget);
    sun.position.set(camTarget.x - 9, 20, camTarget.z + 11);

    for (const s of swayers) {
        s.g.rotation.z = Math.sin(time * 0.9 + s.ph) * s.amp;
        // cây đứng chắn trước nhân vật: làm mờ để vẫn thấy nhân vật
        const dz = s.z - hero.z, covers = dz > 0.4 && dz < 5.5 && Math.abs(s.x - hero.x) < 1.7;
        const want = covers ? 0.3 : 1;
        if (want === 1 && s.fade === 1) continue;
        s.fade += (want - s.fade) * (1 - Math.exp(-dt * 7));
        if (Math.abs(s.fade - want) < 0.01) s.fade = want;
        if (s.fade < 1 && !s.fadeMat) { s.fadeMat = s.solidMat.clone(); s.fadeMat.transparent = true; s.fadeMat.alphaTest = 0.12; }
        const m = s.fade < 1 ? s.fadeMat : s.solidMat;
        if (s.fade < 1) m.opacity = s.fade;
        for (const c of s.cards) c.material = m;
    }
    for (const s of sheep) s.m.position.y = Math.max(0, Math.sin(time * 1.3 + s.ph) - 0.93) * 1.6;
    for (const d of ducks) {
        d.t += d.dir * dt * 2.2;
        if (d.t > d.b) { d.t = d.b; d.dir = -1; } else if (d.t < d.a) { d.t = d.a; d.dir = 1; }
        const i = Math.floor(d.t), f = d.t - i, p = RIVER[i], q = RIVER[Math.min(i + 1, RIVER.length - 1)];
        const tx = q[0] - p[0], tz = q[1] - p[1], tl = Math.hypot(tx, tz) || 1;
        d.m.position.set(p[0] + tx * f - tz / tl * d.off, 0.02 + Math.sin(time * 2.4 + d.ph) * 0.03, p[1] + tz * f + tx / tl * d.off);
        d.m.scale.x = d.dir > 0 ? -1 : 1;   // hình gốc quay mặt sang trái
        d.m.rotation.z = Math.sin(time * 2.4 + d.ph) * 0.05;
    }
    for (const l of leaves) {
        if (l.y < 0.05) { l.x = camTarget.x + rr(-14, 14); l.z = camTarget.z + rr(-11, 8); l.y = rr(3, 7); }
        l.y -= dt * l.sp;
        l.m.position.set(l.x + Math.sin(time * 1.6 + l.ph) * 0.6, l.y, l.z);
        l.m.rotation.set(time * l.sp + l.ph, time * 0.7 + l.ph, Math.sin(time * 2 + l.ph));
    }
    if (markerT > 0) {
        markerT = hero.target ? 1 : Math.max(0, markerT - dt * 1.6);
        marker.material.opacity = markerT * 0.9;
        marker.rotation.z = time * 1.2;
    }

    // vùng nét nằm ngang chỗ nhân vật đứng
    proj.set(hero.x, 0.8, hero.z).project(camera);
    tilt.uniforms.uFocusY.value = clampN(proj.y * 0.5 + 0.5, 0.25, 0.7);
    tilt.uniforms.uStrength.value += ((blurOn ? 1 : 0) - tilt.uniforms.uStrength.value) * (1 - Math.exp(-dt * 8));
    tilt.uniforms.uTime.value = time % 10;

    composer.render();
}
function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt);
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// để kiểm tra khi thử: xem trạng thái + tua thời gian từng bước
window.__paperDemo = { hero, camera, scene, walkable, tick: (sec) => { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); } };
