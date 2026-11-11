// ============================================================
// Bản đồ 3D — khung nhìn (HD-2D: cảnh khối 3D thu nhỏ + nhân vật tranh 2D)
//   createView(host) -> { setMap(id), frame(state), pick(clientX, clientY), setQuality(q), resize(), ready }
//   world.js vẫn giữ toàn bộ luật đi theo ô / nói chuyện / lối ra; ở đây chỉ vẽ.
//   Chất lượng: 'high' (tối góc GTAO + loá nhẹ) · 'low' (máy yếu / điện thoại: bỏ GTAO, bóng nhỏ hơn)
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { HorizontalTiltShiftShader } from 'three/examples/jsm/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/examples/jsm/shaders/VerticalTiltShiftShader.js';
import { MAPS } from '../world/maps.js';
import { TERRAIN } from '../world/terrain3d.js';
import { LAYOUTS } from './layouts.js';
import { buildScene } from './build.js';
import { uTime, uHeroPos, uCamPos, uSeeThrough, uQuality } from './assets.js';

const ROW = { down: 0, left: 1, right: 2, up: 3 };
const CHAR_H = 1.55;

const GradeShader = {
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(0.299,0.587,0.114));
        c = mix(vec3(l), c, 1.12); c *= vec3(1.045, 1.005, 0.925); c = (c - 0.5) * 1.06 + 0.5;
        vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 0.85;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }`,
};

/** Có chạy được WebGL không (để world.js tự quay về bản đồ phẳng nếu không) */
export function webglOK() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function createView(host) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;   // bóng đổ vẽ lại thưa (mỗi vài khung / khi máy quay đi), đỡ nặng
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.className = 'wd-3d-canvas';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 220);
    const hemi = new THREE.HemisphereLight(0xffe8cc, 0x5c6d38, 1.05);
    const sun = new THREE.DirectionalLight(0xffcb88, 2.55);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.032;
    const rim = new THREE.DirectionalLight(0xffdfaa, 0.55);   // viền sáng ấm buổi chiều từ phía ngược nắng
    scene.add(hemi, sun, sun.target, rim, rim.target);
    const sprites = new THREE.Group(); scene.add(sprites);   // nhân vật / đồ vật tranh 2D — ẩn khi tính tối góc

    // ---------- hậu kỳ ----------
    class VisPass extends Pass { constructor(v) { super(); this.v = v; this.needsSwap = false; } render() { sprites.visible = this.v; } }
    let composer, gtao, bloom, hts, vts, quality = null;
    function buildComposer(q) {
        composer?.dispose?.();
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        gtao = null;
        if (q === 'high') {
            gtao = new GTAOPass(scene, camera, 800, 450);
            gtao.blendIntensity = 0.85;
            gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.5, scale: 1.1, samples: 8 });
            composer.addPass(new VisPass(false)); composer.addPass(gtao); composer.addPass(new VisPass(true));
            bloom = new UnrealBloomPass(new THREE.Vector2(800, 450), 0.22, 0.6, 0.88);
            composer.addPass(bloom);
        }
        composer.addPass(new OutputPass());
        composer.addPass(new ShaderPass(GradeShader));
        hts = new ShaderPass(HorizontalTiltShiftShader); vts = new ShaderPass(VerticalTiltShiftShader);
        composer.addPass(hts); composer.addPass(vts);
        resize();
    }
    let resScale = 1;   // tự giảm độ phân giải vẽ khi máy vẫn không kịp ở mức Nhẹ
    const applyRes = () => { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1) * resScale); resize(); };
    function setQuality(q) {
        if (q === quality) return;
        quality = q; resScale = 1; perf.reset();
        uQuality.value = q === 'high' ? 1.0 : 0.0;
        applyRes();
        const s = q === 'high' ? 2048 : 1024;
        sun.shadow.mapSize.set(s, s); sun.shadow.map?.dispose(); sun.shadow.map = null;
        sun.shadow.radius = q === 'high' ? 4 : 1.5;
        buildComposer(q);
    }
    function resize() {
        const w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h); composer?.setSize(w, h);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        if (hts) { hts.uniforms.h.value = 2.4 / w; vts.uniforms.v.value = 2.4 / h; hts.uniforms.r.value = vts.uniforms.r.value = 0.5; }
    }

    // ---------- bản đồ ----------
    let cur = null, mapId = null, building = null, snapCam = true;
    const cache = new Map();   // id -> scene đã dựng (giữ lại, quay lại không phải dựng lại)
    async function setMap(id) {
        if (id === mapId && cur) return;
        mapId = id;
        building = (async () => {
            if (!cache.has(id)) cache.set(id, buildScene(id, MAPS[id], TERRAIN[id], LAYOUTS[id] ?? { items: [] }));
            const built = await cache.get(id);
            if (mapId !== id) return;
            if (cur) scene.remove(cur.group);
            cur = built; scene.add(cur.group);
            const st = LAYOUTS[id]?.style ?? {};
            const sky = new THREE.Color(st.sky ?? 0xc9d9b0);
            scene.background = sky;
            const [fc, fn, ff] = st.fog ?? [0xc9d2a8, 30, 62];
            scene.fog = new THREE.Fog(fc, fn, ff);
            sun.color.setHex(st.sun ?? 0xffd29a); sun.intensity = st.sunI ?? 2.4;
            hemi.intensity = st.hemi ?? 1.0;
            snapCam = true; perf.reset();
        })();
        await building;
    }

    // ---------- tranh 2D: nhân vật, đồ vật, dấu ! ? ----------
    const loader = new THREE.TextureLoader();
    const texBase = new Map();
    const baseTex = (url) => { if (!texBase.has(url)) { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipMapLinearFilter; texBase.set(url, t); } return texBase.get(url); };
    const shadowGeo = new THREE.CircleGeometry(0.34, 18), shadowMat = new THREE.MeshBasicMaterial({ color: 0x1a1408, transparent: true, opacity: 0.32, depthWrite: false });
    const actors = new Map();
    function actor(key, url) {
        let a = actors.get(key);
        if (a && a.url === url) return a;
        if (a) { sprites.remove(a.g); actors.delete(key); }
        const tex = baseTex(url).clone();
        const mat = new THREE.SpriteMaterial({ map: tex, alphaTest: 0.4 });
        let dz = null, bits = null;
        if (key.startsWith('dz:')) {   // ✨ tan pixel (src/ui/world.js: dissolves) — ô 8px tắt dần từ đầu xuống chân, viền ô sáng lên
            dz = { uDz: { value: 0 }, uGrid: { value: new THREE.Vector2(32, 48) }, uRows: { value: 4 } };
            mat.onBeforeCompile = (sh) => {
                Object.assign(sh.uniforms, dz);
                sh.fragmentShader = 'uniform float uDz; uniform vec2 uGrid; uniform float uRows;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
                    vec2 dzCell = floor(vMapUv * uGrid);
                    float dzN = fract(sin(dot(dzCell, vec2(127.1, 311.7))) * 43758.5453);
                    float dzTh = dzN * 0.55 + (1.0 - fract(vMapUv.y * uRows)) * 0.25;
                    if (uDz > dzTh + 0.12) discard;
                    if (uDz > dzTh) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.93, 0.7), 0.85);`);
            };
            mat.customProgramCacheKey = () => 'dissolve';
            const n = 26, pos = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 0.8; pos[i * 3 + 1] = 0.2 + Math.random() * CHAR_H * 0.9; pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3; }
            const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            bits = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe9a8, size: 0.09, transparent: true, depthWrite: false, opacity: 0 }));
        }
        const sp = new THREE.Sprite(mat);
        sp.center.set(0.5, 0.03);
        const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.025;
        const g = new THREE.Group(); g.add(sp, sh); if (bits) g.add(bits); sprites.add(g);
        a = { g, sp, sh, tex, url, seen: 0, dz, bits };
        if (key === 'me') {   // bóng mờ của nhân vật chính: vẫn thấy khi bị nhà / tường / cây che
            a.ghost = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.4, depthTest: false, depthWrite: false, transparent: true, opacity: 0.42 }));
            a.ghost.center.set(0.5, 0.03); a.ghost.renderOrder = 20; g.add(a.ghost);
        }
        actors.set(key, a);
        return a;
    }
    const labels = new Map();
    function label(txt, color) {
        const k = txt + color;
        if (!labels.has(k)) {
            const c = document.createElement('canvas'); c.width = c.height = 64;
            const g = c.getContext('2d'); g.font = '900 54px Outfit, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 8; g.strokeStyle = '#1e293b'; g.strokeText(txt, 32, 34); g.fillStyle = color; g.fillText(txt, 32, 34);
            const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
            labels.set(k, new THREE.SpriteMaterial({ map: t, depthTest: false }));
        }
        return labels.get(k);
    }
    const marks = new Map();
    function mark(key, txt, color) {
        let s = marks.get(key);
        if (!s) { s = new THREE.Sprite(); s.scale.set(0.62, 0.62, 1); s.renderOrder = 10; sprites.add(s); marks.set(key, s); }
        s.material = label(txt, color);
        return s;
    }
    let frameNo = 0;

    // chấm vàng chỉ đường
    const dotGeo = new THREE.CircleGeometry(0.1, 10), dotMat = new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.85, depthWrite: false });
    const dots = [];

    // ---------- mỗi khung hình ----------
    const camWant = new THREE.Vector3(), camLook = new THREE.Vector3();
    let last = performance.now(), t = 0, seeAlpha = 1;
    /**
     * state: { focus:{x,z}, actors:[{key, url, meta, x, z, lift, face, col, hidden}], items:[{key, url, meta, cell, x, z, size, bob}],
     *          marks:[{key, x, z, txt, color}], beacon:{x,z}|null, route:[{x,z}] }
     */
    function frame(state) {
        const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; uTime.value = t;
        frameNo++;
        if (!cur) return;
        let meX = state.focus.x, meZ = state.focus.z, meLift = 0;
        const mapHeights = MAPS[mapId]?.heights;
        // nhân vật (h: độ cao bậc 0..2, nâng nhân vật + bóng dưới chân lên h * 0.45 ô; lúc nhảy bóng nhỏ lại)
        for (const s of state.actors) {
            if (!s.url || !s.meta) continue;
            const hLvl = Number(s.h ?? (s.key === 'me' ? state.focus?.h : null) ?? mapHeights?.[Math.floor(s.z)]?.[Math.floor(s.x)]) || 0;
            const elev = hLvl * 0.45;
            const lift = s.lift ?? 0;
            if (s.key === 'me') { meX = s.x; meZ = s.z; meLift = lift + elev; }
            const a = actor(s.key, s.url);
            a.seen = frameNo;
            a.g.visible = !s.hidden;
            const { cols = 3, rows = 4, cw, ch } = s.meta;
            a.tex.repeat.set(1 / cols, 1 / rows);
            a.tex.offset.set(s.col / cols, 1 - ((ROW[s.face] ?? 0) + 1) / rows);
            const charH = s.charH ?? CHAR_H;
            a.sp.scale.set(charH * cw / ch, charH, 1);
            a.sp.position.y = lift;
            if (a.ghost) { a.ghost.scale.copy(a.sp.scale); a.ghost.position.copy(a.sp.position); }
            const jumpAmt = Math.max(lift, Math.abs(hLvl - Math.round(hLvl)) * 0.9);
            a.sh.scale.setScalar(1 - Math.min(0.55, jumpAmt * 0.55));
            if (a.dz) {
                const p = s.dissolve ?? 0;
                a.dz.uDz.value = p; a.dz.uGrid.value.set(cols * cw / 8, rows * ch / 8); a.dz.uRows.value = rows;
                a.sh.scale.setScalar(Math.max(0.01, 1 - p));
                a.bits.position.y = p * p * 1.6; a.bits.scale.set(1 + p, 1, 1 + p); a.bits.material.opacity = p > 0 ? Math.min(1, p * 4) * (1 - p) : 0;
            }
            a.g.position.set(s.x, elev, s.z);
        }
        // đồ vật (ô trong items.webp)
        for (const s of state.items) {
            const a = actor('it:' + s.key, s.url);
            a.seen = frameNo; a.g.visible = true;
            const { cols, rows, cw, ch } = s.meta;
            a.tex.repeat.set(1 / cols, 1 / rows);
            a.tex.offset.set((s.cell % cols) / cols, 1 - (Math.floor(s.cell / cols) + 1) / rows);
            const h = s.size;
            a.sp.scale.set(h * cw / ch, h, 1);
            a.sp.position.y = s.bob ? Math.sin(t * 3.3) * 0.06 : 0;
            a.sh.scale.setScalar(s.size * 0.8);
            const itemElev = (Number(s.h ?? mapHeights?.[Math.floor(s.z)]?.[Math.floor(s.x)]) || 0) * 0.45;
            a.g.position.set(s.x, itemElev, s.z);
        }
        for (const [k, a] of actors) if (a.seen !== frameNo) {
            sprites.remove(a.g); a.tex.dispose(); actors.delete(k);
            if (a.dz) { a.sp.material.dispose(); a.bits.geometry.dispose(); a.bits.material.dispose(); }
        }
        // dấu ! ? và mũi tên mục tiêu
        const seenM = new Set();
        for (const m of state.marks) { const s = mark(m.key, m.txt, m.color); s.visible = true; s.position.set(m.x, (m.y ?? 2.15) + Math.sin(t * 3.2) * 0.08, m.z); seenM.add(m.key); }
        if (state.beacon) { const s = mark('beacon', '▼', '#ffe066'); s.visible = true; s.position.set(state.beacon.x, 2.85 + Math.sin(t * 4) * 0.15, state.beacon.z); seenM.add('beacon'); }
        for (const [k, s] of marks) if (!seenM.has(k)) s.visible = false;
        // đường đi
        const route = state.route ?? [];
        while (dots.length < route.length) { const d = new THREE.Mesh(dotGeo, dotMat); d.rotation.x = -Math.PI / 2; sprites.add(d); dots.push(d); }
        dots.forEach((d, i) => { d.visible = i < route.length; if (d.visible) d.position.set(route[i].x, 0.05, route[i].z); });
        dotMat.opacity = 0.55 + Math.sin(t * 6) * 0.3;
        // hoạt cảnh của cảnh (nước, cối xay, nấm sáng, sương, khói, bướm, chim...)
        for (const f of cur.anim) f(t);
        // máy quay chéo bám nhân vật (giữ trong khoảng bản đồ để không lộ quá nhiều phần ngoài)
        const m = MAPS[mapId];
        const fx = Math.max(7, Math.min(m.cols - 7, state.focus.x)), fz = Math.max(3, Math.min(m.rows - 2, state.focus.z));
        camWant.set(fx, 15.5, fz + 14.2);
        if (snapCam) { camera.position.copy(camWant); snapCam = false; } else camera.position.lerp(camWant, 1 - Math.exp(-dt * 5));
        camLook.set(camera.position.x, 0.6, camera.position.z - 14.2);
        camera.lookAt(camLook);
        // cập nhật vị trí nhân vật & camera cho shader nhìn xuyên vật che (occlusion fade ~0,2 giây)
        const seeOff = typeof location !== 'undefined' && new URLSearchParams(location.search).get('seeThrough') === 'off';
        const wantSee = seeOff ? 0 : 1;
        seeAlpha += (wantSee - seeAlpha) * Math.min(1, dt * 8);
        uSeeThrough.value = seeAlpha;
        uHeroPos.value.lerp(camLook.set(meX, 0.8 + meLift, meZ), Math.min(1, dt * 14));
        uCamPos.value.copy(camera.position);
        sun.position.set(fx - 15, 19, fz - 8); sun.target.position.set(fx, 0, fz);
        rim.position.set(fx + 14, 11, fz - 14); rim.target.position.set(fx, 0, fz);
        if (++shadowTick >= 3 || camera.position.distanceToSquared(lastShadowAt) > 0.04) { renderer.shadowMap.needsUpdate = true; shadowTick = 0; lastShadowAt.copy(camera.position); }
        if (host.clientWidth && host.clientHeight) composer.render();
        perf.sample(now);
    }
    let shadowTick = 0;
    const lastShadowAt = new THREE.Vector3(1e9, 0, 0);
    // ---------- tự hạ chất lượng khi máy không kịp (đo trung bình 3 giây, bỏ qua lúc mới vào bản đồ / tab ẩn) ----------
    let onAuto = null;
    const perf = {
        t0: 0, n: 0, last: 0, skipUntil: 0,
        reset() { this.t0 = 0; this.n = 0; this.skipUntil = performance.now() + 2500; },
        sample(now) {
            if (!autoQ || document.hidden || now < this.skipUntil) { this.t0 = 0; this.n = 0; return; }
            if (now - this.last > 250) { this.t0 = 0; this.n = 0; }   // vừa bị khựng / tab ẩn -> đo lại
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
    let autoQ = false;
    /** auto = true: cho phép tự hạ chất lượng; cb(kiểu, fps) báo lại cho world.js */
    function setAuto(auto, cb) { autoQ = auto; onAuto = cb; perf.reset(); }

    // bấm chuột / chạm -> ô dưới đất
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    function pick(clientX, clientY) {
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
        ray.setFromCamera(ndc, camera);
        if (!ray.ray.intersectPlane(plane, hit)) return null;
        return { x: Math.floor(hit.x), y: Math.floor(hit.z) };
    }

    /** chụp ảnh khung 3D (chỉ để kiểm tra khi chạy thử) */
    const snapshot = (q = 0.85) => { composer.render(); return renderer.domElement.toDataURL('image/jpeg', q); };
    setQuality('high');
    return { setMap, frame, pick, setQuality, setAuto, resize, snapshot, get building() { return building; }, get mapId() { return mapId; }, canvas: renderer.domElement };
}
