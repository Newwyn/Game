// ============================================================
// DRAG-CAST — Hệ thống kéo thả kỹ năng chọn điểm trên sân (dùng chung)
// ============================================================
// Bất kỳ kỹ năng nào có `dragTarget: { range, radius, radii, color, ... }` trên skillDef
// đều tự động kích hoạt chế độ kéo thả:
//   · Giữ nút kỹ năng + kéo >= 10px ra sân: hiện vòng vùng tác dụng + bóng xem trước theo con trỏ (chuột & cảm ứng).
//   · Kéo ra ngoài tầm thi triển -> vòng chuyển đỏ và kẹp ở mép tầm tối đa.
//   · Thả trên sân -> gửi { point: { x, z } } cùng lệnh dùng kỹ năng (trận không bị dừng).
//   · Thả lại lên nút kỹ năng -> huỷ (không tốn Orb).
//   · Bấm nhanh không kéo -> dùng kỹ năng bình thường (không gửi point, server tự chọn điểm).
import * as THREE from 'three';
import { GROUND_Y } from '../config.js';
import { scene, camera, renderer } from '../core/scene.js';
import { game, myId, getView } from '../state.js';

// Khớp với ARENA_BOUNDS trên server.js
const ARENA_BOUNDS = { minX: -48, maxX: 48, minZ: -13, maxZ: 13 };

const DRAG_THRESHOLD_PX = 10;
const OUT_OF_RANGE_COLOR = 0xef4444;
const DEFAULT_COLOR = 0xfacc15;
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y);
const _raycaster = new THREE.Raycaster();
const _hit = new THREE.Vector3();

// Bộ tuỳ biến giao diện kéo thả theo `skillDef.type` (hero tự đăng ký, dragCast không hardcode hero cụ thể)
const _customizers = new Map();
export function registerDragCustomizer(skillType, fn) {
    _customizers.set(skillType, fn);
}

let _ringTex = null;
function previewRingTexture() {
    if (_ringTex) return _ringTex;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 74, 128, 128, 126);
    g.addColorStop(0, 'rgba(255,255,255,0.03)');
    g.addColorStop(0.76, 'rgba(255,255,255,0.14)');
    g.addColorStop(0.92, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.stroke();
    _ringTex = new THREE.CanvasTexture(c);
    return _ringTex;
}

let _rangeTex = null;
function rangeRingTexture() {
    if (_rangeTex) return _rangeTex;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(128, 128, 122, 0, Math.PI * 2);
    ctx.stroke();
    _rangeTex = new THREE.CanvasTexture(c);
    return _rangeTex;
}

function makeDefaultGhostMesh() {
    const tex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const ctx = c.getContext('2d');
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(54, 16, 20, 96);
        ctx.fillRect(28, 40, 72, 18);
        return new THREE.CanvasTexture(c);
    })();
    const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0.72,
        side: THREE.DoubleSide,
        fog: false,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), mat);
    m.position.y = 0.95;
    m.userData.isVfx = true;
    return m;
}

function ensurePreviewGroup() {
    const areaMat = new THREE.MeshBasicMaterial({
        map: previewRingTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.75,
        side: THREE.DoubleSide,
        fog: false,
    });
    const areaRing = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), areaMat);
    areaRing.rotation.x = -Math.PI / 2;
    areaRing.position.y = 0.04;
    areaRing.userData.isVfx = true;

    const rangeMat = new THREE.MeshBasicMaterial({
        map: rangeRingTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.35,
        side: THREE.DoubleSide,
        fog: false,
    });
    const rangeRing = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rangeMat);
    rangeRing.rotation.x = -Math.PI / 2;
    rangeRing.position.y = GROUND_Y + 0.03;
    rangeRing.visible = false;
    rangeRing.userData.isVfx = true;

    const group = new THREE.Group();
    group.visible = false;
    group.userData.isVfx = true;
    group.add(areaRing);

    return { group, areaRing, rangeRing, ghost: null, ghostKey: null };
}

function screenToGround(clientX, clientY) {
    const el = renderer?.domElement;
    if (!el || !camera) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const ndcX = ((clientX - r.left) / r.width) * 2 - 1;
    const ndcY = -((clientY - r.top) / r.height) * 2 + 1;
    _raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    return _raycaster.ray.intersectPlane(GROUND_PLANE, _hit) ? _hit : null;
}

function clampArenaXZ(x, z) {
    return {
        x: Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, x)),
        z: Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, z)),
    };
}

function resolveDragSpec(member, skillIdx, skillDef) {
    const cfg = skillDef?.dragTarget;
    if (!cfg) return null;
    const base = {
        range: cfg.range ?? skillDef.castRange ?? 14,
        radius: cfg.radius ?? cfg.radii?.[0] ?? 3,
        color: cfg.color ?? DEFAULT_COLOR,
        extraPayload: null,
        ghostKey: skillDef.type ?? 'default',
        createGhost: null,
    };
    const customizer = _customizers.get(skillDef.type);
    return customizer ? { ...base, ...customizer({ member, skillIdx, skillDef }) } : base;
}

let _installed = false;
let _suppressClickBtn = null;
let _suppressUntil = 0;
let _cancelActive = null;

export function cancelDragCast() {
    _cancelActive?.();
}

export function consumeDragClickSuppression(btn) {
    if (_suppressClickBtn && performance.now() <= _suppressUntil && (!btn || _suppressClickBtn === btn)) {
        _suppressClickBtn = null;
        return true;
    }
    return false;
}

export function initDragCast({ onCast, onQuickTap } = {}) {
    if (_installed) return;
    _installed = true;

    let preview = null;
    let active = null;

    const getPreview = () => {
        if (!preview) preview = ensurePreviewGroup();
        if (preview.group.parent !== scene) scene.add(preview.group);
        if (preview.rangeRing.parent !== scene) scene.add(preview.rangeRing);
        return preview;
    };

    const setGhost = (pv, spec) => {
        if (pv.ghost && pv.ghostKey === spec.ghostKey) return;
        if (pv.ghost) {
            pv.group.remove(pv.ghost);
            pv.ghost = null;
        }
        pv.ghostKey = spec.ghostKey;
        pv.ghost = spec.createGhost ? spec.createGhost(spec) : makeDefaultGhostMesh();
        if (pv.ghost) pv.group.add(pv.ghost);
    };

    const hidePreview = () => {
        if (!preview) return;
        preview.group.visible = false;
        preview.rangeRing.visible = false;
    };

    const finishDrag = (suppressClick) => {
        if (!active) return;
        const { btn } = active;
        btn.classList.remove('dragging-skill', 'drag-cancel');
        hidePreview();
        if (suppressClick) {
            _suppressClickBtn = btn;
            _suppressUntil = performance.now() + 250;
        }
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        active = null;
    };

    const isOverButton = (btn, x, y) => {
        const rect = btn.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const updateVisual = (e) => {
        if (!active) return;
        const { memberIndex, skillIndex, btn } = active;
        const pid = myId();
        const m = game.roomData?.players?.[pid]?.squad?.[memberIndex];
        const sd = m?.skills?.[skillIndex] ?? game.classDefs?.[m?.classId]?.skills?.[skillIndex];
        const spec = resolveDragSpec(m, skillIndex, sd);
        if (!m || !m.alive || !spec) { hidePreview(); return; }

        const overBtn = isOverButton(btn, e.clientX, e.clientY);
        active.overButton = overBtn;
        btn.classList.toggle('drag-cancel', overBtn);

        const pv = getPreview();
        if (overBtn) {
            pv.group.visible = false;
            pv.rangeRing.visible = false;
            return;
        }

        const groundPt = screenToGround(e.clientX, e.clientY);
        if (!groundPt) return;

        const view = getView(pid, memberIndex);
        const cx = view?.position?.x ?? m.x ?? 0;
        const cz = view?.position?.z ?? m.z ?? 0;
        const maxR = spec.range ?? 14;
        const dx = groundPt.x - cx;
        const dz = groundPt.z - cz;
        const dist = Math.hypot(dx, dz);
        const outOfRange = dist > maxR && dist > 0.001;
        const clamped = clampArenaXZ(
            outOfRange ? cx + (dx / dist) * maxR : groundPt.x,
            outOfRange ? cz + (dz / dist) * maxR : groundPt.z,
        );

        active.lastPoint = clamped;
        active.lastSpec = spec;

        const colorHex = outOfRange ? OUT_OF_RANGE_COLOR : (spec.color ?? DEFAULT_COLOR);
        setGhost(pv, spec);
        pv.group.visible = true;
        pv.group.position.set(clamped.x, GROUND_Y, clamped.z);
        const r = Math.max(0.5, spec.radius ?? 3);
        pv.areaRing.scale.set(r, r, 1);
        pv.areaRing.material.color.setHex(colorHex);
        pv.areaRing.material.opacity = outOfRange ? 0.85 : 0.72;
        if (pv.ghost?.material) {
            pv.ghost.material.color.setHex(outOfRange ? OUT_OF_RANGE_COLOR : (spec.ghostTint ?? spec.color ?? 0xffffff));
            pv.ghost.material.opacity = outOfRange ? 0.45 : 0.68;
        }
        pv.rangeRing.visible = true;
        pv.rangeRing.position.set(cx, GROUND_Y + 0.03, cz);
        pv.rangeRing.scale.set(maxR, maxR, 1);
        pv.rangeRing.material.color.setHex(colorHex);
    };

    const onMove = (e) => {
        if (!active || e.pointerId !== active.pointerId) return;
        const moved = Math.hypot(e.clientX - active.startX, e.clientY - active.startY);
        if (!active.dragging && moved >= DRAG_THRESHOLD_PX) {
            active.dragging = true;
            active.btn.classList.add('dragging-skill');
        }
        if (active.dragging) updateVisual(e);
    };

    const onUp = (e) => {
        if (!active || e.pointerId !== active.pointerId) return;
        const state = active;
        if (!state.dragging) {
            finishDrag(true);
            onQuickTap?.(state.memberIndex, state.skillIndex);
            return;
        }
        updateVisual(e);
        const canceled = state.overButton || !state.lastPoint;
        const extra = canceled ? null : (state.lastSpec?.extraPayload?.() ?? {});
        const pt = state.lastPoint;
        const mIdx = state.memberIndex;
        const sIdx = state.skillIndex;
        finishDrag(true);
        if (!canceled && pt) onCast?.(mIdx, sIdx, pt, extra);
    };

    const onCancel = (e) => {
        if (!active || e.pointerId !== active.pointerId) return;
        finishDrag(false);
    };
    _cancelActive = () => finishDrag(false);
    window.addEventListener('blur', () => finishDrag(false));

    document.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const btn = e.target?.closest?.('#combat-hud [data-skill]');
        if (!btn || btn.disabled) return;
        const [memberIndex, skillIndex] = (btn.dataset.skill ?? '').split(',').map(Number);
        if (!Number.isFinite(memberIndex) || !Number.isFinite(skillIndex)) return;
        const m = game.roomData?.players?.[myId()]?.squad?.[memberIndex];
        const sd = m?.skills?.[skillIndex] ?? game.classDefs?.[m?.classId]?.skills?.[skillIndex];
        if (!m?.alive || !sd?.dragTarget) return;

        if (active) finishDrag(false);
        active = {
            pointerId: e.pointerId,
            btn,
            memberIndex,
            skillIndex,
            sd,
            startX: e.clientX,
            startY: e.clientY,
            dragging: false,
            overButton: true,
            lastPoint: null,
            lastSpec: null,
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onCancel);
    });
}
