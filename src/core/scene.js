// ============================================================
// SCENE / CAMERA / RENDERER
// ============================================================
import * as THREE from 'three';

export const scene = new THREE.Scene();
// Bầu trời: dải màu từ xanh nhạt (trên) xuống vàng ấm (đường chân trời) — thấy rõ khi camera nhìn ngang
const SKY_TOP = '#8fbfe0', SKY_HORIZON = '#f2dfbd';
function createSkyTexture() {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(0.75, SKY_HORIZON);
    g.addColorStop(1, SKY_HORIZON);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
scene.background = createSkyTexture();

export const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
// Vị trí camera do core/cameraRig.js điều khiển (góc chéo cố định bám theo nhân vật)

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Ánh sáng kiểu "chiều nắng ấm" (tham khảo Tree of Savior): trời vàng nhạt, phản xạ xanh lá từ mặt đất.
scene.add(new THREE.HemisphereLight(0xfff2dc, 0x4f6e38, 1.35));
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
export const dirLight = new THREE.DirectionalLight(0xfff1d6, 1.9);
dirLight.position.set(-4, 10, 6);
scene.add(dirLight);

// Sương mù cùng màu chân trời để mặt đất xa tan dần vào bầu trời
scene.fog = new THREE.Fog(SKY_HORIZON, 28, 70);

// ------------------------------------------------------------
// Mặt đất cỏ "vẽ tay" (texture sinh bằng canvas, lặp lại)
// ------------------------------------------------------------
function createGrassTexture() {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#5f8a3c';
    ctx.fillRect(0, 0, size, size);

    // Pseudo-random cố định để texture giống nhau mỗi lần tải
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const blob = (x, y, r, color) => {
        // vẽ 9 lần (lệch ±size) để texture lặp liền mạch
        for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
            const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
            g.addColorStop(0, color);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
        }
    };
    const patches = ['rgba(120,165,70,0.35)', 'rgba(78,118,48,0.3)', 'rgba(140,170,80,0.25)', 'rgba(96,120,58,0.3)'];
    for (let i = 0; i < 70; i++) blob(rand() * size, rand() * size, 30 + rand() * 70, patches[i % patches.length]);
    // Lối đất nhạt
    for (let i = 0; i < 10; i++) blob(rand() * size, rand() * size, 20 + rand() * 30, 'rgba(170,150,100,0.35)');
    // Ngọn cỏ + hoa nhỏ
    for (let i = 0; i < 450; i++) {
        const x = rand() * size, y = rand() * size;
        ctx.strokeStyle = rand() > 0.5 ? 'rgba(160,200,90,0.35)' : 'rgba(55,90,35,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rand() - 0.5) * 4, y - 4 - rand() * 5); ctx.stroke();
    }
    const flowers = ['#fff4c2', '#ffd1dc', '#ffffff', '#ffe27a'];
    for (let i = 0; i < 18; i++) {
        ctx.fillStyle = flowers[i % flowers.length];
        ctx.beginPath(); ctx.arc(rand() * size, rand() * size, 1.6 + rand() * 1.2, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(18, 11.5);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 140), // rộng hơn đấu trường để không thấy mép
    new THREE.MeshLambertMaterial({ map: createGrassTexture() })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.userData.persistent = true;
scene.add(ground);

/** Gắn canvas vào DOM và tự co giãn theo cửa sổ */
export function mountRenderer(container) {
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/** Xoá mọi object không đánh dấu persistent (dùng khi dựng lại trận) */
export function clearDynamicObjects() {
    scene.children
        .filter(obj => !obj.userData.persistent && !obj.isLight)
        .forEach(obj => scene.remove(obj));
}
