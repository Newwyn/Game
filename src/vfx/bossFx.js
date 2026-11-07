import * as THREE from 'three';
import { addAnim } from './vfx.js';

export function spawnBossBanner(pos, name) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(50,0,10,0.85)'; ctx.fillRect(0, 0, 768, 96);
    ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#fff0e5'; ctx.fillText(name, 384, 62);
    const map = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
    sprite.position.set(pos.x, (pos.y ?? 0) + 3.6, pos.z);
    sprite.scale.set(7, 0.875, 1);
    addAnim(sprite, 1.5, (p) => { sprite.material.opacity = Math.min(1, (1 - p) * 5); });
}

export function spawnBossWarning(shape, seconds) {
    const line = shape.kind === 'line';
    const length = line ? Math.hypot(shape.toX - shape.x, shape.toZ - shape.z) : 0;
    const geometry = line ? new THREE.PlaneGeometry(Math.max(0.01, length), shape.width) : new THREE.CircleGeometry(shape.radius, 64);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xff243e, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(line ? (shape.x + shape.toX) / 2 : shape.x, -0.43, line ? (shape.z + shape.toZ) / 2 : shape.z);
    if (line) mesh.rotation.z = -Math.atan2(shape.toZ - shape.z, shape.toX - shape.x);
    addAnim(mesh, seconds, p => { mesh.material.opacity = 0.18 + p * 0.38; });
    if (!line) {
        const edge = new THREE.Mesh(new THREE.RingGeometry(shape.radius - 0.08, shape.radius, 64), mesh.material.clone());
        edge.rotation.copy(mesh.rotation); edge.position.copy(mesh.position); edge.position.y += 0.02;
        addAnim(edge, seconds, () => { edge.material.opacity = 0.85; });
    }
    const fill = mesh.clone(); fill.geometry = geometry.clone(); fill.material = mesh.material.clone();
    fill.position.y += 0.01;
    addAnim(fill, seconds, p => { fill.scale.set(Math.max(0.01, p), line ? 1 : Math.max(0.01, p), 1); fill.material.opacity = 0.35; });
}
