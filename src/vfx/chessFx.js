// ============================================================
// HIỆU ỨNG KỲ VƯƠNG — Leon (chessmaster) & 6 quân cờ ánh sáng
// ============================================================
// Gồm:
//   - Đòn đánh thường của Leon (búng quân cờ ánh sáng), Tượng (tia phép tím), Hậu (tia sáng trắng-vàng)
//   - 18 sự kiện chessFx: summon, command, pawnSlash, castle, knightJump, fork,
//     drain, drainEnd, bind, crown, judgeStart, judgeSlam, orb, orbTick, orbGone,
//     dance, board, promote, sacrifice, checkmate
import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { game } from '../state.js';
import { GROUND_Y, gameTimeout, gameNow } from '../config.js';
import { spawnPixelFx, pixelLayer, pixelMod } from './pixelFx.js';
import { cameraRig } from '../core/cameraRig.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import castleUrl from '../assets/world3d/meshy/bld_chesscastle.glb?url';
import warTableUrl from '../assets/sprites/chess_wartable.webp';
import hillUrl from '../assets/world3d/meshy/prop_chesshill.glb?url';
import swordUrl from '../assets/world3d/meshy/prop_chesssword.glb?url';
import {
    addAnim, fxPlane, glowTexture, ringTexture, sparkTexture,
    easeOut, spawnHitSpark, spawnShockwave, spawnRisingSparkles,
    spawnSlashVfx, spawnDashLine, spawnHealLight, spawnRisingGlyph,
} from './vfx.js';

const FLOOR_Y = GROUND_Y + 0.04;
const GOLD_BRIGHT = 0xfef08a;
const GOLD_MAIN = 0xfacc15;
const GOLD_DEEP = 0xeab308;
const VIOLET_LIGHT = 0xe9d5ff;
const VIOLET_MAIN = 0xa855f7;
const WHITE_GOLD = 0xfffbeb;

const TEX = new Map();
const activeDrains = new Map();
const activeJudges = new Map();
const activeOrbs = new Map();
const activeDances = new Map();   // Hậu đang múa Vũ Điệu Quang Cầu: vòng quả cầu sau lưng chờ bắn
const activeCrowns = new WeakMap();
const boardByTeam = new Map();
let boardMesh = null;
let boardMode = null;

function makeTex(key, w, h, draw) {
    if (TEX.has(key)) return TEX.get(key);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    TEX.set(key, t);
    return t;
}

function pieceKey(casterId, summonIdx) {
    return `${casterId ?? 'c'}:${summonIdx ?? 0}`;
}

const PIECE_SYMBOL = {
    pawn: '♟',
    rook: '♜',
    knight: '♞',
    bishop: '♝',
    king: '♚',
    queen: '♛',
};

// ---------- Các texture thủ tục (lưu cache) ----------

/** Quân cờ ánh sáng nhỏ khi Leon búng đòn đánh thường */
function chessFlickTexture() {
    return makeTex('chessFlick', 96, 96, (ctx) => {
        ctx.translate(48, 48);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.55, '#fef08a');
        g.addColorStop(1, 'rgba(234,179,8,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fffbeb';
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 3;
        ctx.font = 'bold 52px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('♟', 0, 3);
        ctx.fillText('♟', 0, 3);
    });
}

/** Tia phép của Tượng (tím) hoặc Hậu (trắng-vàng) */
function pieceBoltTexture(kind) {
    const violet = kind === 'bishop';
    return makeTex(`bolt_${kind}`, 128, 48, (ctx) => {
        ctx.translate(64, 24);
        const g = ctx.createLinearGradient(-56, 0, 56, 0);
        g.addColorStop(0, violet ? 'rgba(124,58,237,0)' : 'rgba(234,179,8,0)');
        g.addColorStop(0.4, violet ? '#9333ea' : '#facc15');
        g.addColorStop(0.8, violet ? '#e9d5ff' : '#fef9c3');
        g.addColorStop(1, '#ffffff');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(58, 0);
        ctx.lineTo(12, -13);
        ctx.lineTo(-56, 0);
        ctx.lineTo(12, 13);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-32, 0);
        ctx.lineTo(52, 0);
        ctx.stroke();
    });
}

/** Ô cờ triệu hồi dưới đất khi quân cờ ra sân */
function summonSquareTexture(royal = false) {
    return makeTex(royal ? 'sumSqRoyal' : 'sumSqGold', 256, 256, (ctx) => {
        ctx.translate(128, 128);
        const col = royal ? '#e9d5ff' : '#fef08a';
        const glow = royal ? '#a855f7' : '#eab308';
        ctx.shadowColor = glow;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = col;
        ctx.lineWidth = 5;

        // Vòng tròn ngoại tiếp + hình vuông xoay 45° kiểu ô cờ
        ctx.beginPath();
        ctx.arc(0, 0, 106, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-72, -72, 144, 144);
        ctx.fillStyle = royal ? 'rgba(192,132,252,0.22)' : 'rgba(250,204,21,0.22)';
        ctx.fillRect(-72, -72, 72, 72);
        ctx.fillRect(0, 0, 72, 72);
        ctx.restore();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-68, -68, 136, 136);
    });
}

/** Dấu nước cờ trên đầu quân vừa nhận lệnh */
function commandMarkerTexture(wing = 'guard', piece = 'pawn') {
    const sym = PIECE_SYMBOL[piece] ?? '♟';
    return makeTex(`cmd_${wing}_${sym}`, 128, 128, (ctx) => {
        ctx.translate(64, 58);
        const strike = wing === 'strike';
        ctx.shadowColor = strike ? '#a855f7' : '#eab308';
        ctx.shadowBlur = 12;

        // Khung thoi ánh sáng
        ctx.fillStyle = strike ? '#6b21a8' : '#b45309';
        ctx.strokeStyle = strike ? '#f3e8ff' : '#fef9c3';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.lineTo(40, -4);
        ctx.lineTo(0, 36);
        ctx.lineTo(-40, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mũi tên nhỏ chỉ xuống dưới
        ctx.fillStyle = strike ? '#f3e8ff' : '#fef08a';
        ctx.beginPath();
        ctx.moveTo(-10, 42);
        ctx.lineTo(10, 42);
        ctx.lineTo(0, 56);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sym, 0, -2);
    });
}

/** Khiên hình tường thành (Nhập Thành của Xe & Thí Quân) */
function castleWallTexture() {
    return makeTex('castleWall', 192, 224, (ctx) => {
        ctx.translate(96, 112);
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;
        const g = ctx.createLinearGradient(0, -90, 0, 96);
        g.addColorStop(0, 'rgba(254,249,195,0.92)');
        g.addColorStop(0.5, 'rgba(250,204,21,0.65)');
        g.addColorStop(1, 'rgba(161,98,7,0.85)');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;

        // Đỉnh tường thành có 3 lỗ châu mai kiểu quân Xe
        ctx.beginPath();
        ctx.moveTo(-68, -82);
        ctx.lineTo(-40, -82);
        ctx.lineTo(-40, -60);
        ctx.lineTo(-16, -60);
        ctx.lineTo(-16, -82);
        ctx.lineTo(16, -82);
        ctx.lineTo(16, -60);
        ctx.lineTo(40, -60);
        ctx.lineTo(40, -82);
        ctx.lineTo(68, -82);
        ctx.lineTo(62, 24);
        ctx.quadraticCurveTo(0, 92, 0, 96);
        ctx.quadraticCurveTo(0, 92, -62, 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đường gạch ngang thân thành
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 3;
        for (const y of [-28, 4, 36]) {
            ctx.beginPath();
            ctx.moveTo(-48, y);
            ctx.lineTo(48, y);
            ctx.stroke();
        }
    });
}

/** Vương miện vàng nhỏ trên đầu đồng đội (Vương Miện của Vua) */
function crownTexture() {
    return makeTex('goldCrown', 128, 96, (ctx) => {
        ctx.translate(64, 54);
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        const g = ctx.createLinearGradient(0, -36, 0, 26);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, '#fef08a');
        g.addColorStop(1, '#d97706');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.moveTo(-42, 22);
        ctx.lineTo(-48, -18);
        ctx.lineTo(-22, 2);
        ctx.lineTo(0, -34);
        ctx.lineTo(22, 2);
        ctx.lineTo(48, -18);
        ctx.lineTo(42, 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đai đế + 3 viên ngọc
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-40, 14, 80, 7);
        for (const [gx, gy, col] of [[-26, 6, '#38bdf8'], [0, 4, '#ef4444'], [26, 6, '#38bdf8']]) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

/** Quả cầu ánh sáng trắng-vàng của Hậu */
function queenOrbTexture() {
    return makeTex('queenOrb', 128, 128, (ctx) => {
        ctx.translate(64, 64);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.38, '#fef9c3');
        g.addColorStop(0.72, 'rgba(250,204,21,0.75)');
        g.addColorStop(1, 'rgba(234,179,8,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 58, 0, Math.PI * 2);
        ctx.fill();

        // Ngôi sao 4 cánh loé giữa tâm cầu
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 2);
            ctx.beginPath();
            ctx.moveTo(0, -48);
            ctx.quadraticCurveTo(5, -6, 0, 0);
            ctx.quadraticCurveTo(-5, -6, 0, -48);
            ctx.fill();
            ctx.restore();
        }
    });
}

/** Thanh đại kiếm ánh sáng (dùng cho Phán Quyết của Vua và Chiếu Tướng) */
function giantSwordTexture() {
    return makeTex('giantSword', 256, 768, (ctx) => {
        ctx.translate(128, 384);
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 28;

        // Quầng hào quang dọc thân kiếm
        const aura = ctx.createLinearGradient(-70, 0, 70, 0);
        aura.addColorStop(0, 'rgba(250,204,21,0)');
        aura.addColorStop(0.5, 'rgba(254,240,138,0.55)');
        aura.addColorStop(1, 'rgba(250,204,21,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(-70, -340, 140, 680);

        // Lưỡi kiếm ánh sáng (mũi nhọn hướng xuống dưới ở y = +356)
        const blade = ctx.createLinearGradient(-28, 0, 28, 0);
        blade.addColorStop(0, '#fde047');
        blade.addColorStop(0.5, '#ffffff');
        blade.addColorStop(1, '#eab308');
        ctx.fillStyle = blade;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-26, -190);
        ctx.lineTo(26, -190);
        ctx.lineTo(32, 230);
        ctx.lineTo(0, 356);
        ctx.lineTo(-32, 230);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sống kiếm vàng rực ở giữa
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -185);
        ctx.lineTo(0, 320);
        ctx.stroke();

        // Chắn tay hình cánh vàng (crossguard)
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, -172);
        ctx.lineTo(106, -212);
        ctx.lineTo(88, -176);
        ctx.lineTo(0, -152);
        ctx.lineTo(-88, -176);
        ctx.lineTo(-106, -212);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Chuôi kiếm + quả cầu ngọc trên đỉnh
        ctx.fillStyle = '#a16207';
        ctx.fillRect(-10, -295, 20, 105);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -312, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
}

/** Mặt bàn cờ ánh sáng phủ toàn sân (mode: 'king' | 'queen' | 'both') */
function boardTexture(mode = 'king') {
    return makeTex(`chessBoard_${mode}`, 512, 256, (ctx, w, h) => {
        const cols = 16;
        const rows = 8;
        const cw = w / cols;
        const ch = h / rows;
        const isBoth = mode === 'both';
        const isQueen = mode === 'queen';

        const lightCell = isBoth
            ? 'rgba(250, 204, 21, 0.34)'
            : isQueen
            ? 'rgba(216, 180, 254, 0.32)'
            : 'rgba(250, 204, 21, 0.32)';
        const darkCell = isBoth
            ? 'rgba(192, 132, 252, 0.28)'
            : isQueen
            ? 'rgba(245, 243, 255, 0.08)'
            : 'rgba(254, 249, 195, 0.07)';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? lightCell : darkCell;
                ctx.fillRect(c * cw, r * ch, cw, ch);
            }
        }

        // Đường kẻ lưới mảnh phát sáng
        ctx.strokeStyle = isQueen ? 'rgba(233, 213, 255, 0.35)' : 'rgba(254, 240, 138, 0.38)';
        ctx.lineWidth = 1.5;
        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * cw, 0);
            ctx.lineTo(c * cw, h);
            ctx.stroke();
        }
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * ch);
            ctx.lineTo(w, r * ch);
            ctx.stroke();
        }

        // Viền bàn cờ rực sáng
        ctx.strokeStyle = isBoth ? '#facc15' : isQueen ? '#e9d5ff' : '#fde047';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, w - 6, h - 6);
        if (isBoth) {
            ctx.strokeStyle = '#d8b4fe';
            ctx.lineWidth = 3;
            ctx.strokeRect(10, 10, w - 20, h - 20);
        }
    });
}

// ------------------------------------------------------------
// ĐÁNH THƯỜNG: Leon (búng quân cờ), Tượng (tia tím), Hậu (tia trắng-vàng)
// ------------------------------------------------------------
export function spawnChessFlick(from, to, { duration = 0.22, onHit } = {}) {
    const g = new THREE.Group();
    const halo = fxPlane(glowTexture(), 1.15, 1.15, { color: GOLD_MAIN, opacity: 0.55 });
    const piece = fxPlane(chessFlickTexture(), 0.78, 0.78, { additive: false });
    g.add(halo, piece);
    const dx = to.x - from.x;
    const y0 = from.y ?? 1.15;
    const dy = (to.y ?? 0.95) - y0;
    const z0 = (from.z ?? 0) + 0.55;
    const z1 = (to.z ?? 0) + 0.6;
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(
            from.x + dx * p,
            y0 + dy * p + Math.sin(p * Math.PI) * 0.28,
            z0 + (z1 - z0) * p,
        );
        piece.rotation.z = p * 8 * (dx < 0 ? -1 : 1);
        if (p >= 1 && !hit) {
            hit = true;
            spawnHitSpark({ x: to.x, y: 0, z: to.z }, { count: 6, color: GOLD_BRIGHT, size: 0.85 });
            onHit?.();
        }
    });
}

function spawnPieceBolt(kind, from, to, { duration = 0.22, onHit } = {}) {
    const violet = kind === 'bishop';
    const g = new THREE.Group();
    const halo = fxPlane(glowTexture(), 1.3, 0.9, { color: violet ? VIOLET_MAIN : GOLD_MAIN, opacity: 0.5 });
    const bolt = fxPlane(pieceBoltTexture(kind), 1.25, 0.48, { additive: true });
    g.add(halo, bolt);
    const dx = to.x - from.x;
    const y0 = from.y ?? 1.15;
    const dy = (to.y ?? 0.95) - y0;
    const z0 = (from.z ?? 0) + 0.55;
    const z1 = (to.z ?? 0) + 0.6;
    g.rotation.z = Math.atan2(dy, dx);
    let hit = false;
    addAnim(g, duration, (p, fx) => {
        fx.mesh.position.set(from.x + dx * p, y0 + dy * p, z0 + (z1 - z0) * p);
        if (p >= 1 && !hit) {
            hit = true;
            spawnHitSpark({ x: to.x, y: 0, z: to.z }, { count: 6, color: violet ? VIOLET_LIGHT : GOLD_BRIGHT, size: 0.9 });
            onHit?.();
        }
    });
}

export function spawnBishopBolt(from, to, opts = {}) {
    spawnPieceBolt('bishop', from, to, opts);
}

export function spawnQueenBolt(from, to, opts = {}) {
    spawnPieceBolt('queen', from, to, opts);
}

/** Leon vung tay ra lệnh / gọi quân */
export function spawnChessCast(casterView, skillType = 'chess_guard') {
    if (!casterView) return;
    const pos = casterView.position;
    const royal = skillType === 'chess_royal';
    const sq = fxPlane(summonSquareTexture(royal), royal ? 3.2 : 2.5, royal ? 3.2 : 2.5, { opacity: 0.9 });
    sq.rotation.x = -Math.PI / 2;
    sq.position.set(pos.x, FLOOR_Y, pos.z ?? 0);
    addAnim(sq, 0.75, (p, fx) => {
        const s = 0.65 + easeOut(p) * 0.55;
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.rotation.z = p * 1.2;
        fx.mesh.material.opacity = 0.9 * (1 - p);
    });
    spawnRisingSparkles(pos, { count: 8, color: royal ? VIOLET_LIGHT : GOLD_BRIGHT, radius: 0.9 });
}

// ------------------------------------------------------------
// 1. `summon`: Quân cờ xuất hiện với chớp sáng trên mặt đất
// ------------------------------------------------------------
export function spawnChessSummon(x, z, { piece = 'pawn' } = {}) {
    const tx = x ?? 0;
    const tz = z ?? 0;
    const royal = piece === 'king' || piece === 'queen';
    const sq = fxPlane(summonSquareTexture(royal), royal ? 3.6 : 2.6, royal ? 3.6 : 2.6, { opacity: 0.95 });
    sq.rotation.x = -Math.PI / 2;
    sq.position.set(tx, FLOOR_Y, tz);
    addAnim(sq, 0.85, (p, fx) => {
        const s = 0.5 + easeOut(p) * 0.65;
        fx.mesh.scale.set(s, s, 1);
        fx.mesh.rotation.z = p * 1.4;
        fx.mesh.material.opacity = p < 0.15 ? p / 0.15 : (1 - p) / 0.85;
    });

    // Cột sáng ngắn bùng lên từ ô cờ
    const h = royal ? 4.4 : 3.2;
    const pillar = fxPlane(sparkTexture(), royal ? 1.5 : 1.1, h, { color: royal ? WHITE_GOLD : GOLD_BRIGHT });
    pillar.position.set(tx, GROUND_Y + h * 0.5, tz + 0.45);
    addAnim(pillar, 0.55, (p, fx) => {
        fx.mesh.scale.set(1.2 - p * 0.7, 0.6 + easeOut(p) * 0.5, 1);
        fx.mesh.material.opacity = (1 - p) * 0.9;
    });

    const flash = fxPlane(glowTexture(), royal ? 3.2 : 2.4, royal ? 3.2 : 2.4, { color: royal ? GOLD_MAIN : GOLD_BRIGHT });
    flash.position.set(tx, GROUND_Y + 0.9, tz + 0.5);
    addAnim(flash, 0.4, (p, fx) => {
        const s = 0.6 + easeOut(p) * 1.4;
        fx.mesh.scale.setScalar(s);
        fx.mesh.material.opacity = 0.85 * (1 - p);
    });

    const sym = PIECE_SYMBOL[piece] ?? '♟';
    spawnRisingGlyph({ x: tx, y: 0, z: tz }, sym, '#fffbeb', royal ? '#a855f7' : '#eab308');
    spawnRisingSparkles({ x: tx, y: 0, z: tz }, { count: royal ? 14 : 9, color: GOLD_BRIGHT, radius: 1.0 });
}

// ------------------------------------------------------------
// 2. `command`: Dấu nước cờ trên đầu quân hành động
// ------------------------------------------------------------
export function spawnChessCommand(summonView, { wing = 'guard', piece = 'pawn', fallbackPos = null } = {}) {
    const basePos = summonView?.position ?? fallbackPos ?? { x: 0, z: 0 };
    const tex = commandMarkerTexture(wing, piece);
    const marker = fxPlane(tex, 0.95, 0.95, { additive: false, opacity: 0 });
    const h0 = (summonView?.height ?? 2.2) + (summonView?.sprite?.lift ?? 0) + 0.65;
    addAnim(marker, 0.95, (p, fx) => {
        const cur = summonView?.position ?? basePos;
        const pop = p < 0.18 ? easeOut(p / 0.18) * 1.25 : 1.25 - 0.25 * Math.min(1, (p - 0.18) * 3);
        fx.mesh.position.set(cur.x, GROUND_Y + h0 + (summonView?._lift ?? 0) + Math.sin(p * 10) * 0.08, (cur.z ?? 0) + 0.7);
        fx.mesh.scale.setScalar(pop);
        fx.mesh.material.opacity = p > 0.7 ? (1 - p) / 0.3 : 1;
    });
    spawnShockwave(basePos, { color: wing === 'strike' ? VIOLET_MAIN : GOLD_MAIN, radius: 2.2, life: 0.45 });
}

// ------------------------------------------------------------
// 3. `pawnSlash` (Bắt Chéo) & `castle` (Nhập Thành)
// ------------------------------------------------------------
export function spawnPawnSlash(pawnView, targetViews = [], { fallbackPos = null } = {}) {
    const dir = pawnView?.facingLeft ? -1 : 1;
    const targets = targetViews.length ? targetViews : (fallbackPos ? [{ position: fallbackPos }] : (pawnView ? [pawnView] : []));
    targets.forEach((tv) => {
        const pos = tv?.position ?? fallbackPos ?? { x: 0, z: 0 };
        spawnSlashVfx(pos, { dir, style: 'crit', size: 1.35, angle: -0.78 });
        spawnSlashVfx(pos, { dir: -dir, style: 'blade', size: 1.15, angle: -0.65 });
    });
    if (pawnView) {
        const sh = fxPlane(castleWallTexture(), 1.35, 1.55, { color: GOLD_BRIGHT, opacity: 0.85 });
        addAnim(sh, 0.55, (p, fx) => {
            const cur = pawnView.position;
            fx.mesh.position.set(cur.x, GROUND_Y + 1.05, (cur.z ?? 0) + 0.65);
            fx.mesh.scale.setScalar(0.85 + easeOut(p) * 0.35);
            fx.mesh.material.opacity = 0.85 * (1 - p);
        });
    }
}

export function spawnChessCastle(rookView, allyView, { fallbackPos = null } = {}) {
    const dest = allyView?.position ?? rookView?.position ?? fallbackPos ?? { x: 0, z: 0 };
    if (rookView && allyView) {
        const tx = dest.x + (rookView.facingLeft ? -0.9 : 0.9);
        const tz = dest.z ?? 0;
        if (rookView.leapTo) rookView.leapTo(tx, tz, { duration: 0.32, height: 1.4 });
        else rookView.teleport?.(tx, tz, false);
    }
    const recipients = [rookView, allyView].filter(Boolean);
    if (!recipients.length && fallbackPos) recipients.push({ position: fallbackPos });
    recipients.forEach((v) => {
        const wall = fxPlane(castleWallTexture(), 1.9, 2.2, { additive: false, opacity: 0 });
        const glow = fxPlane(glowTexture(), 2.6, 2.6, { color: GOLD_MAIN, opacity: 0.6 });
        const g = new THREE.Group();
        wall.position.z = 0.02;
        g.add(glow, wall);
        addAnim(g, 0.95, (p, fx) => {
            const cur = v.position ?? dest;
            const s = p < 0.2 ? 0.6 + easeOut(p / 0.2) * 0.5 : 1.1 + p * 0.15;
            fx.mesh.position.set(cur.x, GROUND_Y + 1.25, (cur.z ?? 0) + 0.7);
            fx.mesh.scale.setScalar(s);
            const op = p < 0.15 ? p / 0.15 : (1 - p) / 0.85;
            wall.material.opacity = 0.92 * op;
            glow.material.opacity = 0.55 * op;
        });
        spawnShockwave(v.position ?? dest, { color: GOLD_MAIN, radius: 2.5, life: 0.5 });
    });
}

// ------------------------------------------------------------
// 4. `knightJump` (Nhảy chữ L) & `fork` (Chiếu Đôi kéo 2 địch)
// ------------------------------------------------------------
export function spawnKnightJump(knightView, { x, z } = {}) {
    const from = {
        x: knightView?.position?.x ?? (x ?? 0) - 3,
        z: knightView?.position?.z ?? (z ?? 0),
    };
    const to = {
        x: x ?? from.x + (knightView?.facingLeft ? -3 : 3),
        z: z ?? from.z,
    };
    // Điểm gãy góc vuông chữ L
    const dz = to.z - from.z;
    const corner = {
        x: to.x,
        z: Math.abs(dz) > 0.6 ? from.z : from.z + 1.45,
    };

    // Vẽ 2 nhánh đường chữ L trên mặt đất + 3 ô cờ tại điểm đầu, góc chữ L, điểm đáp
    spawnDashLine({ x: from.x, y: 0.2, z: from.z }, { x: corner.x, y: 0.2, z: corner.z }, 0.25);
    spawnDashLine({ x: corner.x, y: 0.2, z: corner.z }, { x: to.x, y: 0.2, z: to.z }, 0.25);
    for (const pt of [from, corner, to]) {
        const sq = fxPlane(summonSquareTexture(false), 1.6, 1.6, { opacity: 0.85 });
        sq.rotation.x = -Math.PI / 2;
        sq.position.set(pt.x, FLOOR_Y, pt.z);
        addAnim(sq, 0.65, (p, fx) => {
            fx.mesh.scale.setScalar(0.7 + easeOut(p) * 0.45);
            fx.mesh.material.opacity = 0.85 * (1 - p);
        });
    }

    if (knightView) {
        knightView.facingLeft = to.x < from.x;
        if (knightView.leapTo) knightView.leapTo(to.x, to.z, { duration: 0.34, height: 1.85 });
        else knightView.teleport?.(to.x, to.z, false);
        knightView.playAction?.('leap');
    }
    gameTimeout(() => {
        spawnShockwave(to, { color: GOLD_MAIN, radius: 2.4, life: 0.45 });
        spawnHitSpark({ x: to.x, y: 0, z: to.z }, { count: 8, color: GOLD_BRIGHT, size: 1.1 });
    }, 320);
}

export function spawnKnightFork(knightView, pulledList = []) {
    const center = {
        x: knightView?.position?.x ?? 0,
        z: knightView?.position?.z ?? 0,
    };
    spawnShockwave(center, { color: GOLD_MAIN, radius: 3.4, life: 0.55 });
    pulledList.forEach((item) => {
        const tv = item.view;
        const from = {
            x: tv?.position?.x ?? (item.x ?? center.x) + 2.5,
            z: tv?.position?.z ?? (item.z ?? center.z),
        };
        const to = {
            x: item.x ?? center.x,
            z: item.z ?? center.z,
        };
        // Đường dây ánh sáng kéo mục tiêu về phía Mã
        spawnDashLine({ x: from.x, y: 0.85, z: from.z }, { x: center.x, y: 0.85, z: center.z }, 0.85);
        if (tv) {
            if (tv.leapTo) tv.leapTo(to.x, to.z, { duration: 0.26, height: 0.6 });
            else tv.teleport?.(to.x, to.z, false);
        }
        spawnHitSpark({ x: to.x, y: 0, z: to.z }, { count: 7, color: GOLD_BRIGHT, size: 1.0 });
    });
}

// ------------------------------------------------------------
// 5. `drain` / `drainEnd` (Hút Hồn — soul-drain) & `bind` (Trói Buộc — grasping-hands)
// ------------------------------------------------------------
export function startBishopDrain(casterId, summonIdx, bishopView, targetView, {
    mode = 'orb',
    duration = 4000,
    fallbackPos = null,
} = {}) {
    endBishopDrain(casterId, summonIdx, bishopView);
    const key = pieceKey(casterId, summonIdx);
    const durMs = Math.max(300, duration ?? 4000);
    const durSec = durMs / 1000;
    const isHp = mode === 'hp';
    const palette = isHp ? 'blood' : 'arcane';
    const soulColors = isHp
        ? ['#3a0a14', '#d42a30', '#ff9a8a', '#ffffff']
        : ['#2b1252', '#9a48ec', '#ecc8ff', '#ffffff'];

    if (bishopView) {
        bishopView.playAction?.('cast', { hold: true });
        bishopView.flashMagicCircle?.(durSec);
    }

    const state = { bishopView, stopped: false, layer: null };
    activeDrains.set(key, state);

    const sc = 0.95;
    const h = bishopView?.height ?? 2.3;
    const u = (h / 44) * sc;
    // Tinh thể thu hồn của soul-drain nằm ở (0, -50) px từ gốc, luồng hồn kéo từ x ≈ +125 px về 0
    state.layer = spawnPixelFx('shadow/soul-drain', {
        view: bishopView,
        pos: bishopView?.position ?? targetView?.position ?? fallbackPos ?? { x: 0, z: 0 },
        bare: true,
        palette,
        scale: sc,
        maxLife: durSec,
        opts: { soul: soulColors },
        flip: (targetView?.position?.x ?? 1) < (bishopView?.position?.x ?? 0),
        getPos: () => {
            const bp = bishopView?.position ?? fallbackPos ?? { x: 0, z: 0 };
            const tp = targetView?.position ?? { x: bp.x + 4, z: bp.z };
            const flip = tp.x < bp.x;
            const staffX = bp.x + (flip ? -0.55 : 0.55);
            const staffY = GROUND_Y + 1.25 + (bishopView?._lift ?? 0);
            return { x: staffX, y: staffY - 50 * u, z: ((bp.z ?? 0) + (tp.z ?? 0)) * 0.5 + 0.45 };
        },
        until: () => state.stopped || (bishopView ? bishopView.member?.alive === false : false),
    });

    gameTimeout(() => {
        if (activeDrains.get(key) === state) endBishopDrain(casterId, summonIdx);
    }, durMs + 120);

    return state;
}

export function endBishopDrain(casterId, summonIdx, bishopView = null) {
    const key = pieceKey(casterId, summonIdx);
    const state = activeDrains.get(key);
    const view = bishopView ?? state?.bishopView;
    if (state) {
        state.stopped = true;
        state.layer?.stop?.();
        activeDrains.delete(key);
    }
    if (view) {
        view.releaseHold?.('cast');
        view.releaseHold?.('charge');
    }
}

export function spawnBishopBind(targetView, { duration = 2000, bishopView = null, fallbackPos = null } = {}) {
    if (bishopView) {
        bishopView.playAction?.('skill');
        bishopView.flashMagicCircle?.(0.7);
    }
    const durSec = Math.max(0.5, (duration ?? 2000) / 1000);
    return spawnPixelFx('shadow/grasping-hands', {
        view: targetView,
        pos: targetView?.position ?? fallbackPos ?? { x: 0, z: 0 },
        palette: 'shadow',
        scale: 1.05,
        maxLife: durSec,
    });
}

// ------------------------------------------------------------
// 6. `crown` (Vương Miện), `judgeStart` & `judgeSlam` (Phán Quyết của Vua)
// ------------------------------------------------------------
export function spawnKingCrown(targetViews = [], { duration = 8000, kingView = null } = {}) {
    if (kingView) {
        kingView.playAction?.('skill');
        spawnShockwave(kingView.position, { color: GOLD_MAIN, radius: 3.8, life: 0.6 });
    }
    const durSec = Math.max(0.5, (duration ?? 8000) / 1000);
    const tex = crownTexture();
    targetViews.forEach((tv) => {
        if (!tv) return;
        activeCrowns.get(tv)?.stop?.();
        const g = new THREE.Group();
        const glow = fxPlane(glowTexture(), 1.25, 1.0, { color: GOLD_MAIN, opacity: 0.5 });
        const crown = fxPlane(tex, 0.88, 0.66, { additive: false });
        crown.position.z = 0.02;
        g.add(glow, crown);
        let stopped = false;
        activeCrowns.set(tv, { stop: () => { stopped = true; g.visible = false; } });
        addAnim(g, durSec, (p, fx) => {
            if (stopped || tv.member?.alive === false) {
                fx.mesh.visible = false;
                return;
            }
            const pos = tv.position;
            const h = (tv.height ?? 2.2) + (tv.sprite?.lift ?? 0) + (tv._lift ?? 0) + 0.65 + Math.sin(p * durSec * 4.5) * 0.06;
            fx.mesh.position.set(pos.x, GROUND_Y + h, (pos.z ?? 0) + 0.68);
            const fade = p < 0.06 ? p / 0.06 : p > 0.9 ? (1 - p) / 0.1 : 1;
            crown.material.opacity = fade;
            glow.material.opacity = 0.5 * fade;
        });
    });
}

// ---- Thanh gươm ánh sáng 3D của Vua (17/11/2026, người chơi yêu cầu): lúc Vua niệm Phán Quyết các MẢNH gươm bay tới ghép dần thành 1 thanh gươm
//   khổng lồ dựng đứng trên đầu Vua; hết niệm thì chém sập xuống đất phía trước. Dựng bằng khối, vật liệu vàng cộng sáng (không cần mô hình ngoài).
const SWORD_LEN = 10.5;      // chiều dài gốc của gươm ghép khối (dự phòng)
const JUDGE_SWORD = 11;      // gươm Phán Quyết dài chừng này
const MATE_SWORD = 16;       // gươm Chiếu Tướng dài chừng này
function buildLightSword() {
    const g = new THREE.Group();
    const mat = (c, o = 0.92) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const parts = [];
    const add = (geo, m, y, x = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, 0); mesh.renderOrder = 3; g.add(mesh); parts.push(mesh); return mesh; };
    add(new THREE.OctahedronGeometry(0.42), mat(0xfff3c4), 0);                                   // đốc gươm
    add(new THREE.CylinderGeometry(0.16, 0.2, 1.3, 8), mat(0xd9a520), 0.85);                     // chuôi
    add(new THREE.BoxGeometry(3.0, 0.34, 0.5), mat(0xffd166), 1.65);                             // chắn tay
    add(new THREE.OctahedronGeometry(0.34), mat(0xfff3c4), 1.65, -1.6);
    add(new THREE.OctahedronGeometry(0.34), mat(0xfff3c4), 1.65, 1.6);
    const N = 6, segH = (SWORD_LEN - 3.4) / N;
    for (let i = 0; i < N; i++) {                                                               // lưỡi gươm: N đoạn thuôn dần
        const w0 = 1.15 - i * 0.11, w1 = 1.15 - (i + 1) * 0.11;
        const geo = new THREE.CylinderGeometry(w1 / 2, w0 / 2, segH * 0.96, 4, 1); geo.scale(1, 1, 0.22); geo.rotateY(Math.PI / 4);
        add(geo, mat(i % 2 ? 0xffe08a : 0xffc93c), 1.9 + segH * (i + 0.5));
        add(new THREE.BoxGeometry(0.07, segH * 0.96, 0.3), mat(0xffffff, 0.9), 1.9 + segH * (i + 0.5));   // sống gươm sáng trắng
    }
    const tip = new THREE.ConeGeometry(0.26, 1.5, 4); tip.scale(1, 1, 0.22); tip.rotateY(Math.PI / 4);
    add(tip, mat(0xfff3c4), 1.9 + segH * N + 0.75);
    // mỗi mảnh nhớ chỗ đúng + chỗ bay tới từ đâu + lúc bắt đầu ghép (từ đốc lên mũi)
    parts.forEach((m, i) => {
        const a = i * 2.399, r = 5 + (i % 4) * 1.4;
        m.userData = { home: m.position.clone(), from: new THREE.Vector3(Math.cos(a) * r, m.position.y + ((i % 3) - 1) * 2.5, Math.sin(a) * r * 0.6), t0: (i / parts.length) * 0.78, spin: (i % 2 ? 1 : -1) * (3 + i % 3) };
        m.visible = false;
    });
    g.userData.parts = parts;
    return g;
}
// ---- Mô hình gươm của Vua (Meshy, 17/11/2026): gươm ngà-vàng có vương miện ở đốc. Nạp 1 lần lúc vào game; chuẩn hoá thành hình học dài 1 đơn vị,
//   ĐỐC ở gốc toạ độ, lưỡi chạy theo +Y. Chưa nạp xong (hoặc nạp lỗi) thì makeKingSword dùng tạm thanh gươm ghép khối ở trên.
let SWORD_BASE = null;   // { geo, map }
const SWORD_LOADER = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
SWORD_LOADER.loadAsync(swordUrl).then((gltf) => {
    gltf.scene.updateMatrixWorld(true);
    let mesh = null;
    gltf.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    if (!mesh) return;
    // toạ độ đỉnh (mô hình nén dạng số nguyên) -> số thực, đã nhân ma trận của nút
    const src = mesh.geometry.attributes.position, n = src.count, P = new Float32Array(n * 3), v = new THREE.Vector3();
    const box = new THREE.Box3();
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(src, i).applyMatrix4(mesh.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; box.expandByPoint(v); }
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    // trục dài nhất = trục lưỡi gươm; đưa nó về Y
    const ax = size.x >= size.y && size.x >= size.z ? 0 : size.y >= size.z ? 1 : 2;
    const o1 = (ax + 1) % 3, o2 = (ax + 2) % 3;                      // 2 trục còn lại (giữ đúng chiều tay phải: ax -> Y, o1 -> Z, o2 -> X)
    const lo = box.min.getComponent(ax), len = size.getComponent(ax) || 1;
    // đầu nào là MŨI: đầu có tiết diện hẹp hơn (đốc có vương miện to bè, mũi nhọn)
    let wLo = 0, wHi = 0;
    for (let i = 0; i < n; i++) {
        const t = (P[i * 3 + ax] - lo) / len, w = Math.hypot(P[i * 3 + o1] - c.getComponent(o1), P[i * 3 + o2] - c.getComponent(o2));
        if (t < 0.04) wLo = Math.max(wLo, w); else if (t > 0.96) wHi = Math.max(wHi, w);
    }
    const tipHigh = wHi < wLo;
    const Q = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        const t = (P[i * 3 + ax] - lo) / len, p1 = (P[i * 3 + o1] - c.getComponent(o1)) / len, p2 = (P[i * 3 + o2] - c.getComponent(o2)) / len;
        // mũi ở đầu thấp -> quay 180° quanh trục Z mới (đổi dấu Y và X) để không lật mặt tam giác
        Q[i * 3] = tipHigh ? p2 : -p2; Q[i * 3 + 1] = tipHigh ? t : 1 - t; Q[i * 3 + 2] = p1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(Q, 3));
    if (mesh.geometry.attributes.uv) geo.setAttribute('uv', mesh.geometry.attributes.uv);
    if (mesh.geometry.index) geo.setIndex(mesh.geometry.index);
    geo.computeBoundingSphere();
    SWORD_BASE = { geo, map: mesh.material.map ?? null };
}).catch(e => { console.warn('[chessFx] không nạp được mô hình gươm của Vua — dùng gươm ghép khối', e); });

/** Vật liệu của gươm mô hình: giữ tranh gốc, tự phát sáng (không ăn đèn / bóng / sương), chỉ vẽ phần từ đốc tới `uReveal` (0..1 dọc lưỡi), mép đang hiện rực vàng */
function swordMaterial(uni, { shell = false } = {}) {
    const m = new THREE.MeshBasicMaterial(shell
        ? { color: 0xffc247, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }
        : { map: SWORD_BASE.map, color: new THREE.Color(1.12, 1.1, 1.04), transparent: true, opacity: 1, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
        sh.uniforms.uReveal = uni.uReveal;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vBladeY;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBladeY = position.y;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBladeY;\nuniform float uReveal;')
            .replace('#include <dithering_fragment>', `#include <dithering_fragment>
                if (vBladeY > uReveal) discard;
                float edgeGlow = smoothstep(uReveal - 0.05, uReveal, vBladeY) * step(uReveal, 0.999);
                gl_FragColor.rgb += vec3(1.0, 0.82, 0.35) * edgeGlow * 1.6;`);
    };
    return m;
}

/**
 * THANH GƯƠM CỦA VUA — chỗ DUY NHẤT tạo gươm (Phán Quyết + Chiếu Tướng đều gọi hàm này).
 * Trả về THREE.Group: gốc toạ độ ở ĐỐC gươm, lưỡi gươm chạy theo trục +Y của nhóm, dài `len` đơn vị. userData.len = chiều dài.
 * Mô hình Meshy đã nạp: userData.model = true (assembleSword cho hiện dần từ đốc tới mũi). Chưa nạp: gươm ghép khối (userData.parts).
 */
function makeKingSword(len = SWORD_LEN) {
    if (!SWORD_BASE) {
        const g = buildLightSword();
        g.scale.setScalar(len / SWORD_LEN);
        g.userData.len = len;
        return g;
    }
    const g = new THREE.Group();
    const uni = { uReveal: { value: 0 } };
    const body = new THREE.Mesh(SWORD_BASE.geo, swordMaterial(uni));
    body.scale.setScalar(len);
    body.renderOrder = 3;
    const shell = new THREE.Mesh(SWORD_BASE.geo, swordMaterial(uni, { shell: true }));   // vỏ sáng vàng phồng ra quanh gươm
    shell.scale.set(len * 1.22, len * 1.008, len * 2.4);
    shell.position.y = -len * 0.004;
    shell.renderOrder = 4;
    const halo = fxPlane(glowTexture(), len * 0.55, len * 1.2, { color: GOLD_MAIN, opacity: 0 });   // quầng sáng mềm sau lưng gươm
    halo.position.set(0, len * 0.5, -0.2);
    for (const o of [body, shell]) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; }
    g.add(halo, body, shell);
    g.userData = { model: true, len, uni, halo, k: 0, shardAt: 0, flashed: false };
    return g;
}
/** Làm mờ cả thanh gươm (f = 0 rõ .. 1 mất hẳn) */
function fadeSword(g, f) {
    g.traverse(o => {
        if (!o.material) return;
        const m = o.material;
        if (m.userData.baseOpacity == null) { m.userData.baseOpacity = m.opacity ?? 1; m.transparent = true; }
        m.opacity = m.userData.baseOpacity * Math.max(0, 1 - f);
    });
}
const SHARD_GEO = new THREE.OctahedronGeometry(0.16);
/** 1 mảnh vàng bay từ ngoài vào, nhập vào mép gươm đang hiện (điểm `to` trong hệ toạ độ sân) */
function spawnSwordShard(to, spread) {
    const a = Math.random() * Math.PI * 2, r = spread * (0.6 + Math.random() * 0.6);
    const from = new THREE.Vector3(to.x + Math.cos(a) * r, to.y + (Math.random() - 0.35) * spread, to.z + Math.sin(a) * r * 0.5);
    const m = new THREE.Mesh(SHARD_GEO, new THREE.MeshBasicMaterial({ color: Math.random() < 0.4 ? 0xfffbe6 : GOLD_BRIGHT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.userData.sharedGeometry = true;
    m.scale.set(0.6 + Math.random() * 0.9, 1.4 + Math.random() * 1.6, 0.5);
    const spin = (Math.random() - 0.5) * 16;
    addAnim(m, 0.3 + Math.random() * 0.12, (p, fx) => {
        const e = p * p;   // càng gần càng nhanh (bị hút vào)
        fx.mesh.position.lerpVectors(from, to, e);
        fx.mesh.rotation.set(p * spin, p * spin * 0.7, p * spin * 0.4);
        fx.mesh.material.opacity = p < 0.2 ? p / 0.2 : p > 0.9 ? (1 - p) / 0.1 : 1;
    });
}
/**
 * k = 0..1 tiến độ ghép gươm. Gươm mô hình: hiện dần từ đốc tới mũi, mép đang hiện rực sáng, các mảnh vàng bay vào nhập ở mép; đủ (k = 1) thì loé sáng 1 lần.
 * Gươm ghép khối (dự phòng): các mảnh bay vào chỗ.
 */
function assembleSword(g, k) {
    const U = g.userData;
    if (U.model) {
        k = Math.min(1, Math.max(0, k));
        U.uni.uReveal.value = k >= 1 ? 2 : k;
        U.halo.material.opacity = 0.26 * k;
        const now = performance.now();
        if (k > U.k && k < 1 && g.parent && now >= U.shardAt) {
            U.shardAt = now + 26;
            const edge = g.localToWorld(new THREE.Vector3(0, k * U.len, 0));
            for (let i = 0; i < 2; i++) spawnSwordShard(edge, Math.max(2.4, U.len * 0.32));
        }
        if (k >= 1 && !U.flashed && U.k < 1 && U.k > 0 && g.parent) {
            // ghép xong: loé sáng dọc cả thanh gươm
            U.flashed = true;
            const mid = g.localToWorld(new THREE.Vector3(0, U.len * 0.5, 0));
            const flash = fxPlane(glowTexture(), U.len * 0.9, U.len * 1.5, { color: WHITE_GOLD, opacity: 0.95 });
            flash.position.set(mid.x, mid.y, mid.z + 0.3);
            flash.rotation.z = g.rotation.z;
            addAnim(flash, 0.32, (p, fx) => { fx.mesh.scale.set(0.5 + easeOut(p) * 0.9, 1, 1); fx.mesh.material.opacity = 0.95 * (1 - p); });
            spawnHitSpark({ x: mid.x, y: mid.y - GROUND_Y - 0.75, z: mid.z }, { count: 14, color: GOLD_BRIGHT, size: 1.6 });
        }
        U.k = k;
        return;
    }
    if (!U.parts) return;
    for (const m of U.parts) {
        const u = m.userData, q = Math.min(1, Math.max(0, (k - u.t0) / 0.22)), e = 1 - Math.pow(1 - q, 3);
        m.visible = q > 0;
        m.position.lerpVectors(u.from, u.home, e);
        m.rotation.y = (1 - e) * u.spin;
        m.scale.setScalar(0.3 + 0.7 * e);
    }
}

export function startKingJudge(casterId, summonIdx, kingView, { duration = 3000 } = {}) {
    endKingJudge(casterId, summonIdx);
    const key = pieceKey(casterId, summonIdx);
    const durMs = Math.max(300, duration ?? 3000);
    const durSec = durMs / 1000;

    if (kingView) {
        kingView.playAction?.('charge', { hold: true });
        kingView.flashMagicCircle?.(durSec);
        kingView._bigJumpUntil = gameNow() + durMs + 700;   // camera nâng + lùi (cơ chế sẵn có của cú nhảy cao) để thấy trọn thanh gươm dựng trên đầu Vua
    }

    const g = new THREE.Group();
    const aura = fxPlane(glowTexture(), 3.2, 3.6, { color: GOLD_MAIN, opacity: 0.65 });
    g.add(aura);
    const sword = makeKingSword(JUDGE_SWORD);   // gươm 3D hiện dần trên đầu Vua (đốc ở dưới, mũi chĩa lên trời)
    scene.add(sword);

    let stopped = false;
    const state = {
        kingView,
        sword,
        keepSword: false,   // spawnKingJudgeSlam nhận thanh gươm để chém; niệm bị ngắt thì gươm tan
        stop: () => {
            stopped = true;
            g.visible = false;
            if (!state.keepSword) sword.removeFromParent();
            kingView?.releaseHold?.('charge');
        },
    };
    activeJudges.set(key, state);

    addAnim(g, durSec, (p, fx) => {
        if (stopped || (kingView && kingView.member?.alive === false)) {
            fx.mesh.visible = false;
            return;
        }
        const pos = kingView?.position ?? { x: 0, z: 0 };
        fx.mesh.position.set(pos.x, GROUND_Y + 1.5, (pos.z ?? 0) + 0.55);
        const pulse = 1 + 0.25 * p + 0.08 * Math.sin(p * durSec * 14);
        aura.scale.setScalar(pulse);
        sword.position.set(pos.x, GROUND_Y + 2.6, (pos.z ?? 0) - 0.4);
        assembleSword(sword, p / 0.88);   // ghép xong trước lúc chém 1 nhịp: loé sáng rồi mới bổ xuống
    });

    gameTimeout(() => {
        if (activeJudges.get(key) === state) endKingJudge(casterId, summonIdx);
    }, durMs + 100);

    return state;
}

export function endKingJudge(casterId, summonIdx) {
    const key = pieceKey(casterId, summonIdx);
    const state = activeJudges.get(key);
    if (state) {
        state.stop();
        activeJudges.delete(key);
    }
}

export function spawnKingJudgeSlam(casterId, summonIdx, kingView, { x, z } = {}) {
    const judge = activeJudges.get(pieceKey(casterId, summonIdx));
    if (judge) judge.keepSword = true;
    endKingJudge(casterId, summonIdx);
    const kp = kingView?.position ?? { x: (x ?? 0) - 2, z: z ?? 0 };
    const dir = x != null && Math.abs(x - kp.x) > 0.1 ? Math.sign(x - kp.x) : (kingView?.facingLeft ? -1 : 1);
    // thanh gươm 3D: đủ mảnh rồi quật sập xuống đất phía trước (xoay quanh đốc gươm), chạm đất thì loé sáng rồi tan
    const sword = judge?.sword ?? makeKingSword(JUDGE_SWORD);
    if (!sword.parent) { sword.position.set(kp.x, GROUND_Y + 2.6, (kp.z ?? 0) - 0.4); scene.add(sword); }
    assembleSword(sword, 1);
    const t0 = performance.now();
    const swing = () => {
        if (!sword.parent) return;
        const t = (performance.now() - t0) / 1000;
        const k = Math.min(1, t / 0.2), e = k * k;                      // quật nhanh dần
        sword.rotation.z = -dir * e * 1.62;                               // ~93 độ: lưỡi gươm đập xuống mặt đất
        if (t > 0.2) {
            const f = Math.min(1, (t - 0.2) / 0.55);
            fadeSword(sword, f);
            if (f >= 1) { sword.removeFromParent(); return; }
        }
        requestAnimationFrame(swing);
    };
    swing();
    gameTimeout(() => { cameraRig?.shake?.(0.55, 320); }, 200);
    const tx = x ?? kp.x + dir * 3.2;
    const tz = z ?? kp.z ?? 0;

    if (kingView) {
        kingView.facingLeft = dir < 0;
        kingView.playAction?.('slam');
    }

    // Nhát chém đại kiếm ánh sáng bổ dọc xuống mặt đất trước mặt Vua
    spawnSlashVfx({ x: tx, y: 0.4, z: tz }, { dir, style: 'crit', size: 2.6, angle: -1.1 });
    spawnPixelFx('impacts/ground-slam', {
        pos: { x: tx, z: tz },
        flip: dir < 0,
        palette: 'gold',
        scale: 0.95,
        maxLife: 1.6,
    });
    spawnShockwave({ x: tx, z: tz }, { color: GOLD_MAIN, radius: 4.5, life: 0.55 });
    spawnHitSpark({ x: tx, y: 0, z: tz }, { count: 14, color: GOLD_BRIGHT, size: 1.6 });
}

// ------------------------------------------------------------
// 7. `orb` / `orbTick` / `orbGone` & `dance` / `danceShot` (Quang Cầu & Vũ Điệu Quang Cầu của Hậu) — làm lại 17/11/2026
//   Quả cầu = hiệu ứng pixelfx "Arcane orb" (quả cầu thuỷ tinh có lõi sáng + 2 vòng sáng xoay quanh) tô bảng màu TRẮNG-VÀNG,
//   dưới đất 1 quầng sáng tròn mềm đúng bán kính gây sát thương (2,5), mỗi nhịp gây sát thương thì phập phồng + 1 gợn sáng loang ra.
//   Vũ điệu: quả cũ bay về sau lưng Hậu xếp thành vòng xoay; mỗi phát bắn 1 quả rời vòng thành vệt sáng tới mục tiêu rồi nổ sáng ở đó.
// ------------------------------------------------------------
const ORB_PAL = ['#6a3fb0', '#b48a2c', '#e0b64a', '#ffd670', '#ffe9a6', '#fff6d6', '#ffffff', '#ffffff'];   // trắng-vàng sáng, viền ngoài cùng ánh tím (nổi trên bàn cờ vàng)
const ORB_Y = 1.15;            // tâm quả cầu cao chừng này so với mặt đất
const ORB_PX = 2.9 / 44;       // 1 điểm ảnh của pixelLayer (cỡ chuẩn) = chừng này đơn vị sân
const ORB_CORE_GEO = new THREE.SphereGeometry(1, 18, 12);
const ORB_CY = 52;             // tâm quả cầu của "Arcane orb" nằm trên gốc hiệu ứng 52 điểm ảnh (bán kính 17)

/** 1 quả cầu ánh sáng: { group (tâm quả cầu ở gốc nhóm), step(dt) } — bán kính ~17 × ORB_PX × scale */
function makeLightOrb(scale = 0.5, seed = 1) {
    const g = new THREE.Group();
    const mod = pixelMod('arcane/arcane-orb');
    let layer = null;
    if (mod) {
        layer = pixelLayer(mod, { palette: ORB_PAL, seed, scale });
        layer.group.position.y = -ORB_CY * ORB_PX * scale;
        g.add(layer.group);
        layer.step(0.016);
    }
    const halo = fxPlane(glowTexture(), 3.4 * scale, 3.4 * scale, { color: GOLD_BRIGHT, opacity: 0.4 });
    halo.position.z = -0.05;
    // lõi cầu ĐẶC trắng-vàng (khối 3D thật) nằm trong lớp điểm ảnh -> nhìn từ góc nào cũng là 1 quả cầu sáng rõ
    const R = 17 * ORB_PX * scale * 0.86;
    const ball = (color, k, opacity, side = THREE.FrontSide) => {
        const m = new THREE.Mesh(ORB_CORE_GEO, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, fog: false, depthWrite: false, side }));
        m.userData.sharedGeometry = true;
        m.scale.setScalar(R * k);
        m.position.z = -0.03;
        m.renderOrder = 2;
        return m;
    };
    // viền tím sẫm (mặt sau của khối lớn hơn 1 chút) -> quả cầu nổi rõ trên bàn cờ vàng nhạt; thân vàng tươi; tâm trắng nóng
    g.add(halo, ball(0x5b21b6, 1.2, 0.95, THREE.BackSide), ball(0xffd84a, 1, 1), ball(0xfff8dc, 0.62, 1));
    return { group: g, halo, step: (dt) => { if (dt > 0) layer?.step(dt); } };
}

/** Quầng tròn trên mặt đất đúng bán kính quả cầu: lòng tím sẫm trong mờ (để nổi trên bàn cờ vàng lẫn nền cỏ), mép trắng-vàng sáng (mép ở 92% bán kính tấm) */
function orbHaloTexture() {
    return makeTex('queenOrbHalo3', 256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, 'rgba(255,248,214,0.55)');
        g.addColorStop(0.22, 'rgba(170,120,255,0.50)');
        g.addColorStop(0.6, 'rgba(70,26,150,0.62)');
        g.addColorStop(0.86, 'rgba(60,20,140,0.80)');
        g.addColorStop(0.9, 'rgba(255,255,255,1)');
        g.addColorStop(0.93, 'rgba(255,236,150,1)');
        g.addColorStop(0.96, 'rgba(90,40,180,0.85)');
        g.addColorStop(1, 'rgba(90,40,170,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
    });
}
/** Tấm phẳng nằm trên mặt đất (xoay ngửa) */
function floorPlane(tex, size, opts) {
    const m = fxPlane(tex, size, size, opts);
    m.rotation.x = -Math.PI / 2;
    return m;
}

export function spawnQueenOrb(id, x, z, { duration = 10000, radius = 2.5 } = {}) {
    const key = String(id ?? '0');
    removeQueenOrb(key, false);

    const tx = x ?? 0;
    const tz = z ?? 0;
    const durSec = Math.max(0.5, (duration ?? 10000) / 1000);

    const g = new THREE.Group();
    const ground = floorPlane(orbHaloTexture(), (radius * 2) / 0.92, { additive: false, color: 0xffffff, opacity: 0 });
    ground.position.set(0, FLOOR_Y - GROUND_Y, 0);
    const orb = makeLightOrb(0.5, (Number(id) || 0) % 17 + 1);
    orb.group.position.set(0, ORB_Y, -0.55);   // lùi ra sau 1 chút: đối thủ đứng đúng chỗ đó vẫn hiện trước quả cầu
    g.add(ground, orb.group);
    g.position.set(tx, GROUND_Y, tz);

    const entry = {
        id: key,
        x: tx,
        z: tz,
        group: g,
        pulse: 0,
        stopped: false,
        age: 0,
        fadeAt: null,       // tuổi lúc bắt đầu tan (mờ dần 0,3 giây)
        stop: () => {
            entry.stopped = true;
            g.visible = false;
        },
    };
    activeOrbs.set(key, entry);

    addAnim(g, durSec + 0.8, (p, fx, dt = 0.016) => {
        if (entry.stopped) {
            fx.life = fx.age;
            return;
        }
        orb.step(dt);
        entry.age = fx.age;
        entry.pulse = Math.max(0, entry.pulse - dt * 2.6);
        const born = Math.min(1, fx.age / 0.3), e = easeOut(born);
        const gone = entry.fadeAt == null ? 0 : Math.min(1, (fx.age - entry.fadeAt) / 0.3);
        const k = e * (1 - gone);
        orb.group.position.y = ORB_Y + Math.sin(fx.age * 2.6) * 0.08;
        orb.group.scale.setScalar((0.4 + 0.6 * e) * (1 + 0.16 * entry.pulse) * (1 - 0.5 * gone));
        orb.group.visible = gone < 0.95;
        orb.halo.material.opacity = (0.34 + 0.3 * entry.pulse) * k;
        ground.scale.setScalar((0.6 + 0.4 * e) * (1 + 0.05 * entry.pulse));
        ground.material.opacity = (0.9 + 0.1 * entry.pulse) * k;
        if (gone >= 1) { entry.stopped = true; fx.life = fx.age; }
    });

    return entry;
}

/** `orbTick`: quả cầu vừa gây sát thương -> phập phồng nhẹ + 1 gợn sáng mảnh loang ra tới mép bán kính */
export function tickQueenOrb(id, { radius = 2.5 } = {}) {
    const entry = activeOrbs.get(String(id ?? '0'));
    if (!entry) return;
    entry.pulse = 1;
    const ripple = floorPlane(ringTexture(), radius * 2 * (128 / 104), { color: WHITE_GOLD, opacity: 0 });
    ripple.position.set(entry.x, FLOOR_Y + 0.02, entry.z);
    addAnim(ripple, 0.5, (p, fx) => {
        fx.mesh.scale.setScalar(0.25 + 0.75 * easeOut(p));
        fx.mesh.material.opacity = 0.7 * (1 - p) * Math.min(1, p * 8);
    });
}

export function removeQueenOrb(id, burst = true) {
    const key = String(id ?? '0');
    const entry = activeOrbs.get(key);
    if (!entry) return;
    activeOrbs.delete(key);
    if (!burst) { entry.stop(); return; }
    // hết giờ: mờ dần + 1 chớp sáng nhỏ
    entry.fadeAt = entry.age ?? 0;
    const flash = fxPlane(glowTexture(), 1.6, 1.6, { color: GOLD_BRIGHT, opacity: 0.7 });
    flash.position.set(entry.x, GROUND_Y + ORB_Y, entry.z + 0.3);
    addAnim(flash, 0.3, (p, fx) => {
        fx.mesh.scale.setScalar(0.7 + easeOut(p) * 0.8);
        fx.mesh.material.opacity = 0.7 * (1 - p);
    });
}

/** Tâm vòng quả cầu sau lưng Hậu + chỗ của quả thứ i lúc `t` giây (vòng đứng, quay đều) */
const DANCE_R = 1.25;
function danceSlot(queenView, fallback, i, n, t) {
    const q = queenView?.position ?? fallback ?? { x: 0, z: 0 };
    const dir = queenView?.facingLeft ? -1 : 1;
    const h = queenView?.height ?? 2.4;
    const a = (i / Math.max(1, n)) * Math.PI * 2 + t * 2.4;
    return { x: q.x - dir * 0.55 + Math.cos(a) * DANCE_R, y: GROUND_Y + h * 0.62 + Math.sin(a) * DANCE_R, z: (q.z ?? 0) - 0.25 };
}

/**
 * `dance` (lúc bắt đầu niệm): thu các quả đang nằm trên sân (recalled) về sau lưng Hậu, thêm cho đủ `count` quả, xếp thành vòng xoay chờ bắn.
 * Từng phát bắn do `danceShot` -> fireQueenDanceShot.
 */
export function spawnQueenDance(casterId, summonIdx, queenView, { recalled = [], count = 2, castTime = 1000, gap = 250, fallbackPos = null } = {}) {
    const key = pieceKey(casterId, summonIdx);
    activeDances.get(key)?.stop();
    const total = Math.max(1, count ?? 2);
    const lifeSec = ((castTime ?? 1000) + total * (gap ?? 250)) / 1000 + 0.6;
    if (queenView) {
        queenView.playAction?.('skill');
        queenView.flashMagicCircle?.(lifeSec - 0.6);
    }
    // chỗ các quả cũ đang nằm -> bay về từ đó; quả thêm thì hiện ra ngay cạnh Hậu
    const starts = [];
    recalled.forEach((id) => {
        const ex = activeOrbs.get(String(id));
        if (ex) starts.push({ x: ex.x, y: GROUND_Y + ORB_Y, z: ex.z });
        removeQueenOrb(id, false);
    });
    const holder = new THREE.Group();
    const orbs = [];
    for (let i = 0; i < total; i++) {
        const o = makeLightOrb(0.3, i + 3);
        const q = queenView?.position ?? fallbackPos ?? { x: 0, z: 0 };
        const from = starts[i] ?? { x: q.x, y: GROUND_Y + (queenView?.height ?? 2.4) * 0.6, z: q.z ?? 0 };
        orbs.push({ ...o, from, fresh: !starts[i], fired: false, pos: { ...from } });
        holder.add(o.group);
    }
    const state = {
        orbs, holder, queenView, stopped: false,
        stop: () => { state.stopped = true; holder.visible = false; },
    };
    activeDances.set(key, state);
    const GATHER = Math.min(0.55, (castTime ?? 1000) / 1000 * 0.6);   // giây: bay về xong trước khi phát đầu rời vòng
    addAnim(holder, lifeSec, (p, fx, dt = 0.016) => {
        const dead = queenView && queenView.member?.alive === false;
        if (state.stopped || dead || orbs.every(o => o.fired)) {
            if (activeDances.get(key) === state) activeDances.delete(key);
            fx.life = fx.age;
            return;
        }
        const t = fx.age, u = easeOut(Math.min(1, t / GATHER));
        orbs.forEach((o, i) => {
            if (o.fired) return;
            const s = danceSlot(queenView, fallbackPos, i, total, t);
            o.pos.x = o.from.x + (s.x - o.from.x) * u;
            o.pos.y = o.from.y + (s.y - o.from.y) * u + Math.sin(u * Math.PI) * (o.fresh ? 0 : 1.2);   // quả cũ bay vồng lên rồi về vòng
            o.pos.z = o.from.z + (s.z - o.from.z) * u;
            o.group.position.set(o.pos.x, o.pos.y, o.pos.z);
            o.group.scale.setScalar(o.fresh ? 0.2 + 0.8 * u : 1 - 0.0 * u);
            o.step(dt);
        });
    });
    return state;
}

/**
 * `danceShot`: quả thứ `n` rời vòng sau lưng Hậu, lao thành VỆT SÁNG tới (x, z) trong `flight` ms rồi nổ sáng ở đó (onHit: hiện số sát thương).
 * Quả Quang Cầu mới ở chỗ đó do sự kiện `orb` của máy chủ tạo ngay sau.
 */
export function fireQueenDanceShot(casterId, summonIdx, queenView, { n = 1, x = 0, z = 0, flight = 200, onHit = null, fallbackPos = null } = {}) {
    const state = activeDances.get(pieceKey(casterId, summonIdx));
    let o = state?.orbs.find((q, i) => !q.fired && i === (n ?? 1) - 1) ?? state?.orbs.find(q => !q.fired);
    if (o) { o.fired = true; state.holder.remove(o.group); }
    else {
        // không còn vòng (vào trận giữa chừng...): bắn thẳng từ chỗ Hậu
        const q = queenView?.position ?? fallbackPos ?? { x: 0, z: 0 };
        o = { ...makeLightOrb(0.3, n + 3), pos: { x: q.x, y: GROUND_Y + 1.6, z: q.z ?? 0 } };
    }
    const from = { ...o.pos }, to = { x: x ?? 0, y: GROUND_Y + ORB_Y, z: z ?? 0 };
    const dur = Math.max(0.08, (flight ?? 200) / 1000);
    const len = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) || 1;
    // vệt sáng: 1 dải sáng kéo dài sau quả cầu, nằm dọc theo hướng bay
    const streak = fxPlane(glowTexture(), 1, 0.5, { color: WHITE_GOLD, opacity: 0.9 });
    const g = new THREE.Group();
    g.add(streak, o.group);
    o.group.position.set(0, 0, 0);
    o.group.scale.setScalar(1.15);
    let age = 0, done = false, puffT = 0;
    addAnim(g, dur + 0.05, (p, fx, dt = 0.016) => {
        age += dt;
        const u = Math.min(1, age / dur), e = u * u * (3 - 2 * u) * 0.4 + u * 0.6;
        const px = from.x + (to.x - from.x) * e, py = from.y + (to.y - from.y) * e + Math.sin(e * Math.PI) * 0.5, pz = from.z + (to.z - from.z) * e;
        g.position.set(px, py, pz + 0.3);
        const ang = Math.atan2(to.y - from.y, to.x - from.x);
        const tail = Math.min(len * e, 3.2);
        streak.scale.set(Math.max(0.3, tail), 1, 1);
        streak.rotation.z = ang;
        streak.position.set(-Math.cos(ang) * tail * 0.5, -Math.sin(ang) * tail * 0.5, -0.02);
        o.step(dt);
        puffT += dt;
        if (puffT > 0.03) {
            puffT = 0;
            const puff = fxPlane(glowTexture(), 0.5, 0.5, { color: GOLD_BRIGHT, opacity: 0.5 });
            puff.position.set(px, py, pz + 0.28);
            addAnim(puff, 0.3, (q, f2) => { f2.mesh.scale.setScalar(1 + q * 1.3); f2.mesh.material.opacity = 0.5 * (1 - q); });
        }
        if (u >= 1 && !done) {
            done = true;
            // nổ sáng ở đích: chớp trắng-vàng + tia lửa điểm ảnh + 1 gợn sáng trên đất
            const flash = fxPlane(glowTexture(), 2.6, 2.6, { color: WHITE_GOLD, opacity: 0.95 });
            flash.position.set(to.x, to.y, to.z + 0.35);
            addAnim(flash, 0.26, (q, f2) => { f2.mesh.scale.setScalar(0.5 + easeOut(q) * 1.1); f2.mesh.material.opacity = 0.95 * (1 - q); });
            spawnPixelFx('impacts/hit-spark', { pos: { x: to.x, z: to.z }, palette: 'holy', scale: 0.9 });
            const ripple = floorPlane(ringTexture(), 5 * (128 / 104), { color: GOLD_BRIGHT, opacity: 0 });
            ripple.position.set(to.x, FLOOR_Y + 0.02, to.z);
            addAnim(ripple, 0.4, (q, f2) => { f2.mesh.scale.setScalar(0.2 + 0.8 * easeOut(q)); f2.mesh.material.opacity = 0.8 * (1 - q); });
            onHit?.();
            fx.life = fx.age;
        }
    });
}

const BOARD_W = 56, BOARD_D = 24, BOARD_COLS = 14, BOARD_ROWS = 6;
function boardMaterial() {
    return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uMix: { value: 0 },
            uGold: { value: new THREE.Color(0xffc93c) }, uViolet: { value: new THREE.Color(0xb46bff) },
            uGrid: { value: new THREE.Vector2(BOARD_COLS, BOARD_ROWS) }, uSize: { value: new THREE.Vector2(BOARD_W, BOARD_D) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `
            varying vec2 vUv; uniform float uTime, uReveal, uMix; uniform vec3 uGold, uViolet; uniform vec2 uGrid, uSize;
            float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            void main(){
                vec2 g = vUv * uGrid, cell = floor(g), f = fract(g);
                vec2 w = (vUv - 0.5) * uSize;                      // toạ độ sân (đơn vị game)
                float r = length(w * vec2(1.0, 1.6));              // khoảng cách tới tâm (bầu dục theo sân)
                float chk = mod(cell.x + cell.y, 2.0);
                // ô cờ: ô sáng / ô tối, mỗi ô nhấp nháy lệch pha + sóng sáng lan từ tâm ra
                float tw = 0.5 + 0.5 * sin(uTime * 1.7 + hash(cell) * 6.283);
                float wave = smoothstep(0.0, 1.0, 1.0 - abs(fract(r * 0.07 - uTime * 0.22) - 0.5) * 2.0);
                float inner = smoothstep(0.0, 0.10, f.x) * smoothstep(0.0, 0.10, f.y) * smoothstep(0.0, 0.10, 1.0 - f.x) * smoothstep(0.0, 0.10, 1.0 - f.y);
                float tile = inner * mix(0.10, 0.50, chk) * (0.6 + 0.4 * tw) + inner * wave * 0.30;
                // đường lưới + vệt sáng chạy dọc đường
                vec2 d = min(f, 1.0 - f);
                float lx = 1.0 - smoothstep(0.0, 0.045, d.x), ly = 1.0 - smoothstep(0.0, 0.07, d.y);
                float runX = pow(0.5 + 0.5 * sin(g.y * 2.2 - uTime * 3.0 + cell.x * 1.7), 6.0);
                float runY = pow(0.5 + 0.5 * sin(g.x * 2.2 + uTime * 2.4 + cell.y * 2.3), 6.0);
                float line = lx * (0.55 + 1.2 * runX) + ly * (0.55 + 1.2 * runY);
                // nút giao sáng như đinh trận
                float node = (1.0 - smoothstep(0.0, 0.16, length(d * vec2(1.0, 1.5)))) * (0.6 + 0.4 * tw);
                // vòng trận ở giữa: 2 vòng xoay + nan hoa
                float ang = atan(w.y * 1.6, w.x);
                float ring1 = 1.0 - smoothstep(0.0, 0.22, abs(r - 7.5));
                float ring2 = (1.0 - smoothstep(0.0, 0.14, abs(r - 5.6))) * step(0.35, fract(ang * 1.9099 + uTime * 0.25));
                float ring3 = (1.0 - smoothstep(0.0, 0.10, abs(r - 9.2))) * step(0.55, fract(ang * 3.8197 - uTime * 0.18));
                float spokes = (1.0 - smoothstep(0.0, 0.05, abs(fract(ang * 1.2732 + uTime * 0.05) - 0.5))) * smoothstep(5.6, 6.0, r) * (1.0 - smoothstep(7.2, 7.5, r));
                float sigil = ring1 * 0.9 + ring2 * 0.8 + ring3 * 0.6 + spokes * 0.5;
                // viền bàn cờ sáng + mờ dần ra mép sân
                vec2 e = min(vUv, 1.0 - vUv) * uSize;
                float border = (1.0 - smoothstep(0.0, 0.18, abs(min(e.x, e.y) - 0.9))) * 0.9;
                float fade = smoothstep(0.0, 2.2, min(e.x, e.y));
                // mở ra từ tâm
                float open = 1.0 - smoothstep(uReveal * 34.0 - 3.0, uReveal * 34.0, r);
                float front = (1.0 - smoothstep(0.0, 1.2, abs(r - uReveal * 34.0))) * (1.0 - uReveal) * 1.6;
                // màu: vàng (Vua) <-> tím (Hậu); cả hai thì ô sáng vàng, ô tối tím
                vec3 both = mix(uViolet, uGold, chk);
                vec3 base = uMix < 0.5 ? mix(uGold, both, uMix * 2.0) : mix(both, uViolet, (uMix - 0.5) * 2.0);
                vec3 hot = mix(base, vec3(1.0, 0.97, 0.85), 0.55);
                vec3 col = base * tile + hot * (line * 0.8 + node * 0.9 + sigil * 0.8 + border) + hot * front;
                float a = (tile + line * 0.5 + node * 0.6 + sigil * 0.7 + border) * fade * open + front * fade;
                gl_FragColor = vec4(col * fade * max(open, front), clamp(a, 0.0, 1.0));
            }`,
    });
}

// ---- Thành trì hào quang quanh bàn cờ (17/11/2026): bàn cờ thành 1 "trận đồ" 3D của 2 phe —
//   ô cờ nổi khối, tường thành + tháp canh bằng ánh sáng ở 2 đầu sân và phía sau (phe trái vàng, phe phải tím), cột sáng ở tháp, vạch giữa sân.
//   Phía gần camera để trống cho khỏi che nhân vật. Tất cả là khối trong suốt cộng sáng, không đổ bóng, không cản gì.
const FORT_TIME = { value: 0 };
function fortMaterial(color, height, gain = 1) {
    return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: FORT_TIME, uColor: { value: new THREE.Color(color) }, uH: { value: height }, uGain: { value: gain } },
        vertexShader: `varying vec3 vP; varying vec3 vN;
            void main(){ vP = position; vN = normal; vec4 p = vec4(position, 1.0);
            #ifdef USE_INSTANCING
            p = instanceMatrix * p;
            #endif
            gl_Position = projectionMatrix * modelViewMatrix * p; }`,
        fragmentShader: `
            varying vec3 vP; varying vec3 vN; uniform float uTime, uH, uGain; uniform vec3 uColor;
            void main(){
                float h = clamp(vP.y / uH, 0.0, 1.0);
                float body = mix(0.20, 0.03, h);                                   // đậm ở chân, nhạt dần lên đỉnh
                float brick = (1.0 - smoothstep(0.0, 0.06, abs(fract(vP.y * 1.6) - 0.5) - 0.42)) * 0.0
                    + (1.0 - smoothstep(0.02, 0.05, fract(vP.y * 1.25))) * 0.22;   // mạch gạch ngang
                float sweep = pow(0.5 + 0.5 * sin(vP.y * 2.4 - uTime * 2.2 + (vP.x + vP.z) * 0.35), 8.0) * 0.5;   // vệt sáng chạy lên
                float top = smoothstep(0.90, 1.0, h) * 0.55;                        // viền đỉnh sáng
                float rim = pow(1.0 - abs(vN.y), 2.0) * 0.08;
                float a = (body + brick * 0.6 + sweep * 0.7 + top * 0.7 + rim) * uGain;
                vec3 col = mix(uColor, vec3(1.0, 0.97, 0.88), top + sweep * 0.6);
                gl_FragColor = vec4(col * a, a);
            }`,
    });
}
// ---- Sa bàn chiến trận (17/11/2026, người chơi yêu cầu): THÀNH của phe Leon (mô hình Meshy) ở đầu sân phía đội mình + đồi đất đá cắm cờ quanh mép sân.
//   Mô hình nạp 1 lần rồi nhân bản; đặt vào nhóm `deco` nên trồi lên cùng tường hào quang. Chỉ đặt phía SAU và 2 đầu sân để không che nhân vật.
const WAR_LOADER = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const WAR_CACHE = new Map();
function warModel(url, height) {
    if (!WAR_CACHE.has(url)) WAR_CACHE.set(url, WAR_LOADER.loadAsync(url).then(g => {
        const root = g.scene, box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
        root.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);   // chân chạm đất, tâm ở giữa
        root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.material.fog = false; } });
        const wrap = new THREE.Group(); wrap.add(root); wrap.userData.h = size.y || 1;
        return wrap;
    }).catch(e => { console.warn('[chessFx] không nạp được mô hình sa bàn', e); return null; }));
    return WAR_CACHE.get(url).then(base => { if (!base) return null; const m = base.clone(true); m.scale.setScalar(height / base.userData.h); return m; });
}
function addWarTable(deco, side = -1) {
    const hx = BOARD_W / 2, hz = BOARD_D / 2, s = side < 0 ? -1 : 1;
    const put = (url, h, x, z, ry = 0) => warModel(url, h).then(m => { if (!m || !deco.parent) return; m.position.set(x, 0, z); m.rotation.y = ry; deco.add(m); });
    put(castleUrl, 9, s * (hx - 13), -hz + 1.0, s < 0 ? 0.5 : -0.5);          // thành phe Leon: góc sau, quay mặt vào sân
    put(hillUrl, 3.4, -s * (hx - 6), -hz + 2.5, 0.6);                           // đồi phía đối thủ
    put(hillUrl, 2.6, -s * 9, -hz + 0.5, -0.9);
    put(hillUrl, 2.2, s * 4, -hz + 0.2, 2.2);
    put(hillUrl, 2.8, -s * (hx - 1.5), 2.5, 1.7);
}

function buildChessFort() {
    const g = new THREE.Group();
    g.rotation.x = Math.PI / 2;   // bàn cờ nằm (xoay -90°) -> xoay ngược lại để khối đứng thẳng
    const hx = BOARD_W / 2, hz = BOARD_D / 2;
    const GOLD = 0xffc93c, VIOLET = 0xb46bff;
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.renderOrder = 1; g.add(m); return m; };
    // 1) ô cờ nổi khối: các ô SÁNG nhô lên thành bệ thấp, sáng lệch nhịp
    const cw = BOARD_W / BOARD_COLS, cd = BOARD_D / BOARD_ROWS;
    for (const side of [-1, 1]) {
        const mat = fortMaterial(side < 0 ? GOLD : VIOLET, 0.22, 0.55);
        const slab = new THREE.BoxGeometry(cw * 0.92, 0.22, cd * 0.92); slab.translate(0, 0.11, 0);
        const cells = [];
        for (let c = 0; c < BOARD_COLS; c++) for (let r = 0; r < BOARD_ROWS; r++)
            if ((c + r) % 2 === 1 && (side < 0 ? c < BOARD_COLS / 2 : c >= BOARD_COLS / 2)) cells.push([c, r]);
        const inst = new THREE.InstancedMesh(slab, mat, cells.length);
        const M = new THREE.Matrix4();
        cells.forEach(([c, r], i) => inst.setMatrixAt(i, M.makeTranslation(-hx + (c + 0.5) * cw, 0, hz - (r + 0.5) * cd)));
        inst.renderOrder = 1; g.add(inst);
    }
    // 2) tường thành: phía sau (z âm) chia đôi 2 màu + 2 đầu sân; có lỗ châu mai
    const wall = (len, h, color, x, z, alongX) => {
        const mat = fortMaterial(color, h + 0.7);
        const body = new THREE.BoxGeometry(alongX ? len : 0.7, h, alongX ? 0.7 : len); body.translate(0, h / 2, 0);
        add(body, mat, x, 0, z);
        const n = Math.max(2, Math.round(len / 2.2));
        for (let i = 0; i < n; i++) {   // răng thành
            const t = -len / 2 + (i + 0.5) * (len / n);
            const merlon = new THREE.BoxGeometry(alongX ? len / n * 0.55 : 0.8, 0.7, alongX ? 0.8 : len / n * 0.55); merlon.translate(0, h + 0.35, 0);
            add(merlon, mat, x + (alongX ? t : 0), 0, z + (alongX ? 0 : t));
        }
    };
    wall(hx - 2, 2.4, GOLD, -hx / 2 - 0.5, -hz, true);
    wall(hx - 2, 2.4, VIOLET, hx / 2 + 0.5, -hz, true);
    wall(BOARD_D - 5, 2.4, GOLD, -hx, -1.5, false);
    wall(BOARD_D - 5, 2.4, VIOLET, hx, -1.5, false);
    // 3) tháp canh hình quân Xe ở 2 góc sau + cổng thành giữa tường sau; cột sáng trên tháp
    const tower = (x, z, color, h = 5.2, r = 1.5) => {
        const mat = fortMaterial(color, h + 1);
        const shaft = new THREE.CylinderGeometry(r * 0.82, r, h, 12, 1, true); shaft.translate(0, h / 2, 0);
        add(shaft, mat, x, 0, z);
        const crown = new THREE.CylinderGeometry(r * 1.12, r * 0.9, 0.9, 12, 1, true); crown.translate(0, h + 0.45, 0);
        add(crown, mat, x, 0, z);
        for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2, t = new THREE.BoxGeometry(0.55, 0.6, 0.35); t.translate(0, h + 1.2, 0);
            const m = add(t, mat, x + Math.cos(a) * r * 1.05, 0, z + Math.sin(a) * r * 1.05); m.rotation.y = -a + Math.PI / 2;
        }
        const beamMat = fortMaterial(color, 16, 0.8);
        const beam = new THREE.CylinderGeometry(0.16, 0.5, 16, 8, 1, true); beam.translate(0, 8, 0);
        add(beam, beamMat, x, h, z);
    };
    tower(-hx, -hz, GOLD); tower(hx, -hz, VIOLET);
    tower(-hx, hz - 2.5, GOLD, 3.2, 1.1); tower(hx, hz - 2.5, VIOLET, 3.2, 1.1);
    tower(-1.6, -hz, GOLD, 3.6, 1.0); tower(1.6, -hz, VIOLET, 3.6, 1.0);   // 2 trụ cổng giữa
    // 4) vạch ranh giới 2 phe giữa sân: màn sáng thấp
    const mid = new THREE.PlaneGeometry(BOARD_D - 1, 1.1); mid.rotateY(Math.PI / 2); mid.translate(0, 0.55, 0);
    add(mid, fortMaterial(0xfff3c4, 1.1), 0, 0, 0);
    return g;
}

// ---- Sa bàn tranh vẽ: lớp phủ mặt sân. Chỗ tối của tranh thì trong suốt (thấy cỏ), chỗ sáng là hào quang vàng; có Hậu thì ngả tím nhẹ.
const WAR_W = 68, WAR_D = 45.3;   // bàn cờ trong tranh chiếm ~65% bề ngang -> phủ x ±22, z ±10
let _warTex = null;
function warTableMaterial() {
    if (!_warTex) { _warTex = new THREE.TextureLoader().load(warTableUrl); _warTex.anisotropy = 8; }
    return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
        uniforms: { uMap: { value: _warTex }, uTime: { value: 0 }, uReveal: { value: 0 }, uMix: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `
            varying vec2 vUv; uniform sampler2D uMap; uniform float uTime, uReveal, uMix;
            void main(){
                vec2 uv = vUv; if (uv.x < 0.185) uv.x = 1.0 - uv.x;   // bỏ toà thành vẽ phẳng ở đầu trái (nhìn nghiêng thì xấu): soi gương phần đồi núi bên phải sang
                vec4 t = texture2D(uMap, uv);
                float lum = max(t.r, max(t.g, t.b));
                vec2 c = (vUv - 0.5) * vec2(1.0, 0.667);
                float r = length(c) * 2.0;                                  // 0 ở tâm, ~1 ở vòng sáng
                float open = 1.0 - smoothstep(uReveal * 1.25 - 0.12, uReveal * 1.25, r);   // mở dần từ tâm ra
                float front = (1.0 - smoothstep(0.0, 0.05, abs(r - uReveal * 1.25))) * (1.0 - uReveal);
                float pulse = 0.92 + 0.08 * sin(uTime * 1.6 + r * 9.0);
                vec3 col = t.rgb * pulse * 1.15;
                col = mix(col, col.brg * vec3(1.25, 0.8, 1.35), uMix * 0.45);   // có Hậu: ngả tím nhẹ
                float a = clamp(lum * 1.7, 0.0, 0.96) * open + front * 0.8;
                gl_FragColor = vec4(col + vec3(1.0, 0.85, 0.4) * front, a);
            }`,
    });
}

// ------------------------------------------------------------
// 8. `board`: Bàn cờ ánh sáng phủ toàn sân khi còn Vua hoặc Hậu
// ------------------------------------------------------------
export function updateChessBoard(casterId, { king = false, queen = false, side = -1 } = {}) {
    const key = String(casterId ?? 'default');
    if (king || queen) {
        boardByTeam.set(key, { king: !!king, queen: !!queen });
    } else {
        boardByTeam.delete(key);
    }

    let anyKing = false;
    let anyQueen = false;
    for (const st of boardByTeam.values()) {
        if (st.king) anyKing = true;
        if (st.queen) anyQueen = true;
    }

    if (!anyKing && !anyQueen) {
        if (boardMesh) {
            boardMesh.userData.castle?.removeFromParent();
            boardMesh.removeFromParent();
            boardMesh = null;
            boardMode = null;
        }
        return null;
    }

    const mode = anyKing && anyQueen ? 'both' : anyQueen ? 'queen' : 'king';
    if (!boardMesh) {
        // (17/11/2026, người chơi chốt) SA BÀN = 1 bức tranh Codex vẽ theo ảnh mẫu của người chơi (art/leon/fx2/fx-wartable.png): bàn cờ 16x8 ô,
        //   thành phe Leon ở đầu sân, núi đồi, vòng sáng — trải phẳng trên mặt sân như 1 lớp hào quang vàng. Phe Leon ở bên phải thì lật ngang.
        boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(WAR_W, WAR_D), warTableMaterial());
        boardMesh.rotation.x = -Math.PI / 2;
        boardMesh.scale.x = side > 0 ? -1 : 1;
        boardMesh.position.set(0, GROUND_Y + 0.03, 0);
        boardMesh.renderOrder = 0;
        boardMesh.userData.born = performance.now();
        boardMesh.onBeforeRender = () => {
            const u = boardMesh?.material.uniforms; if (!u) return;
            const t = (performance.now() - boardMesh.userData.born) / 1000;
            u.uTime.value = t;
            u.uReveal.value = Math.min(1, t / 1.4);
            u.uMix.value += (boardMesh.userData.mix - u.uMix.value) * 0.06;
        };
        boardMesh.material.uniforms.uMix.value = mode === 'queen' ? 1 : mode === 'both' ? 0.5 : 0;
        // Thành hào quang 3D bay lơ lửng ở đầu sân phe Leon (người chơi yêu cầu 17/11): mô hình Meshy phủ ánh vàng cộng sáng, nhấp nhô + xoay nhẹ
        const born = performance.now(), sgn = side > 0 ? 1 : -1;
        warModel(castleUrl, 7.5).then(m => {
            if (!m || !boardMesh || boardMesh.userData.born !== born) return;
            m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ map: o.material.map ?? null, color: 0xffd166, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); o.renderOrder = 2; } });
            m.position.set(sgn * 25, GROUND_Y + 2.2, -5.5);
            m.rotation.y = sgn < 0 ? 0.55 : -0.55;
            m.onBeforeRender = null;
            const base = m.scale.x;
            const tick = () => {
                if (!m.parent) return;
                const t = (performance.now() - born) / 1000, k = Math.min(1, t / 1.2);
                m.position.y = GROUND_Y + 2.2 + Math.sin(t * 1.3) * 0.35;
                m.rotation.y = (sgn < 0 ? 0.55 : -0.55) + Math.sin(t * 0.5) * 0.12;
                m.scale.setScalar(base * (0.2 + 0.8 * k));
                requestAnimationFrame(tick);
            };
            scene.add(m); boardMesh.userData.castle = m; tick();
        });
        scene.add(boardMesh);
        boardMesh.material.uniforms.uMix.value = mode === 'queen' ? 1 : mode === 'both' ? 0.5 : 0;
    } else if (!boardMesh.parent) scene.add(boardMesh);
    boardMesh.userData.mix = mode === 'queen' ? 1 : mode === 'both' ? 0.5 : 0;
    boardMode = mode;
    return boardMesh;
}

// ------------------------------------------------------------
// 9. `promote` (Phong Cấp), `sacrifice` (Thí Quân), `checkmate` (Chiếu Tướng)
// ------------------------------------------------------------
export function spawnPawnPromote(pawnView, { to = 'queen', fallbackPos = null } = {}) {
    const pos = {
        x: pawnView?.position?.x ?? fallbackPos?.x ?? 0,
        z: pawnView?.position?.z ?? fallbackPos?.z ?? 0,
    };
    spawnHealLight(pos, { big: true });
    spawnShockwave(pos, { color: to === 'queen' ? VIOLET_MAIN : GOLD_MAIN, radius: 3.4, life: 0.65 });
    spawnRisingGlyph(pos, to === 'queen' ? '♛' : '♚', '#ffffff', to === 'queen' ? '#a855f7' : '#eab308');
}

export function spawnChessSacrifice(allyViews = [], { casterView = null } = {}) {
    const list = allyViews.length ? allyViews : (casterView ? [casterView] : []);
    list.forEach((v) => {
        if (!v) return;
        const sh = fxPlane(castleWallTexture(), 1.65, 1.9, { additive: false, opacity: 0.9 });
        addAnim(sh, 0.75, (p, fx) => {
            const cur = v.position;
            fx.mesh.position.set(cur.x, GROUND_Y + 1.15, (cur.z ?? 0) + 0.68);
            fx.mesh.scale.setScalar(0.8 + easeOut(p) * 0.45);
            fx.mesh.material.opacity = 0.9 * (1 - p);
        });
        spawnRisingSparkles(v.position, { count: 6, color: GOLD_BRIGHT, radius: 0.75 });
    });
    if (casterView) {
        spawnRisingGlyph(casterView.position, '+0.5◆', '#fef08a', '#ca8a04');
    }
}

export function spawnCheckmate({
    kingView = null,
    queenView = null,
    enemyViews = [],
    lift = 1500,
    onImpact = null,
} = {}) {
    const liftMs = Math.max(200, lift ?? 1500);
    const liftSec = liftMs / 1000;

    if (queenView) {
        queenView.playAction?.('skill');
        queenView.flashMagicCircle?.(liftSec);
    }
    if (kingView) {
        kingView.playAction?.('charge', { hold: true });
        kingView.flashMagicCircle?.(liftSec);
        kingView._bigJumpUntil = gameNow() + liftMs + 900;   // camera nâng + lùi để thấy thanh gươm trên cao
    }

    // Tâm bên đối thủ để thanh đại kiếm ánh sáng giáng xuống
    let cx = 6;
    let cz = 0;
    if (enemyViews.length) {
        cx = enemyViews.reduce((s, v) => s + (v.position?.x ?? 0), 0) / enemyViews.length;
        cz = enemyViews.reduce((s, v) => s + (v.position?.z ?? 0), 0) / enemyViews.length;
    } else if (kingView) {
        cx = kingView.position.x + (kingView.facingLeft ? -6 : 6);
        cz = kingView.position.z ?? 0;
    }

    // Vòng ấn đại kiếm dưới đất bên phe địch
    const sigil = fxPlane(summonSquareTexture(true), 7.5, 7.5, { opacity: 0 });
    sigil.rotation.x = -Math.PI / 2;
    sigil.position.set(cx, FLOOR_Y, cz);
    addAnim(sigil, liftSec + 0.65, (p, fx) => {
        fx.mesh.rotation.z = p * 2.5;
        fx.mesh.scale.setScalar(0.75 + 0.35 * Math.min(1, p * 1.4));
        fx.mesh.material.opacity = p < 0.12 ? p / 0.12 : p > 0.78 ? (1 - p) / 0.22 : 0.9;
    });

    // Nâng các đối thủ lên không trung suốt `lift` ms
    enemyViews.forEach((ev) => {
        if (!ev) return;
        const ring = fxPlane(ringTexture(), 2.2, 2.2, { color: VIOLET_LIGHT, opacity: 0.85 });
        ring.rotation.x = -Math.PI / 2;
        addAnim(ring, liftSec, (p, fx) => {
            const liftH = Math.sin(Math.min(1, p / 0.85) * (Math.PI / 2)) * 2.1 * (p > 0.88 ? (1 - p) / 0.12 : 1);
            ev._lift = Math.max(ev._lift ?? 0, liftH);
            fx.mesh.position.set(ev.position.x, GROUND_Y + liftH + 0.1, ev.position.z ?? 0);
            fx.mesh.material.opacity = 0.85 * (1 - p * 0.4);
        });
    });

    // Thanh gươm 3D của Vua (makeKingSword): hiện trên cao phía trên đội hình địch, MŨI CHÚC XUỐNG, các mảnh ghép dần suốt lúc nâng (`lift`);
    //   0,22 giây cuối cả thanh lao xuống, mũi gươm cắm đất đúng lúc máy chủ gây sát thương, rồi tan
    const L = MATE_SWORD;
    const sword = makeKingSword(L);
    sword.rotation.z = Math.PI;                       // lưỡi (+Y của nhóm) quay xuống đất
    const HOVER_Y = GROUND_Y + L + 4.5;               // đốc gươm lúc treo trên cao (mũi còn cách đất 4,5)
    const STAB_Y = GROUND_Y + L - 1.2;                // đốc gươm lúc mũi đã cắm xuống đất
    const DROP = Math.min(0.22, liftSec * 0.4);
    const glow = fxPlane(glowTexture(), 5.5, L + 4, { color: GOLD_MAIN, opacity: 0 });
    const holder = new THREE.Group();
    holder.add(glow);
    scene.add(sword);
    assembleSword(sword, 0);
    const totalLife = liftSec + 0.8;
    let impacted = false;

    addAnim(holder, totalLife, (p, fx) => {
        const t = p * totalLife;
        let y = HOVER_Y, fade = 0;
        if (t <= liftSec - DROP) {
            assembleSword(sword, Math.min(1, t / Math.max(0.05, liftSec - DROP)));
            y = HOVER_Y + Math.sin(t * 5) * 0.12;      // lơ lửng nhè nhẹ lúc đang ghép
        } else if (t <= liftSec) {
            assembleSword(sword, 1);
            const u = (t - (liftSec - DROP)) / DROP;
            y = HOVER_Y + (STAB_Y - HOVER_Y) * u * u;  // lao xuống nhanh dần
        } else {
            assembleSword(sword, 1);
            y = STAB_Y;
            fade = Math.min(1, (t - liftSec - 0.25) / 0.5);
            if (!impacted) {
                impacted = true;
                kingView?.releaseHold?.('charge');
                kingView?.playAction?.('slam');
                enemyViews.forEach((ev) => { if (ev) ev._lift = 0; });
                spawnShockwave({ x: cx, z: cz }, { color: GOLD_MAIN, radius: 9.5, life: 0.75 });
                spawnPixelFx('impacts/ground-slam', {
                    pos: { x: cx, z: cz },
                    palette: 'gold',
                    scale: 1.35,
                    maxLife: 1.8,
                });
                spawnHitSpark({ x: cx, y: 0, z: cz }, { count: 18, color: GOLD_BRIGHT, size: 2.0 });
                spawnPixelFx('nature/quake', { pos: { x: cx, z: cz }, scale: 1.2, maxLife: 1.4 });   // đất nứt + bụi
                cameraRig?.shake?.(0.6, 380);
                onImpact?.();
            }
        }
        sword.position.set(cx, y, cz);
        if (fade > 0) fadeSword(sword, fade);
        glow.position.set(cx, y - L * 0.5, cz - 0.3);
        glow.material.opacity = 0.3 * Math.min(1, t / 0.4) * (1 - Math.max(0, fade));
        if (p >= 1 || fade >= 1) { sword.removeFromParent(); fx.life = fx.age; }
    });
}

// ------------------------------------------------------------
// 10. HÀO QUANG QUÂN CHÚA (17/11/2026): Vua và Hậu luôn có hào quang quanh mình suốt lúc còn trên sân.
//   Vua: quầng vàng ấm quanh thân, ấn hoàng gia xoay chậm dưới chân, vài đốm vàng bay lên, vương miện ánh sáng mờ trên đầu.
//   Hậu: quầng trắng-vàng ánh tím, vòng sáng dưới chân, 3 quả cầu sáng nhỏ bay vòng quanh.
//   syncRoyalAuras() (gọi khi có sự kiện cờ) bật 1 bộ quét: cứ 0,4 giây tìm quân chúa còn sống chưa có hào quang thì gắn.
//   Mỗi hào quang bám theo quân, tự tắt khi quân gục / bị thay (phong cấp dùng lại ô) / ra khỏi sân; clearChessFx gỡ hết.
//   Rẻ: mỗi quân ~9 tấm phẳng / khối cố định, không cấp phát gì trong vòng lặp. Độ đậm theo cài đặt hiệu ứng (vật liệu isVfx do addAnim gắn).
// ------------------------------------------------------------
const ROYAL_AURA = { chess_king: 'king', chess_queen: 'queen' };
const royalAuras = new Map();   // view -> { stop() }
let auraScan = null;            // { stopped }
const AURA_ORB_GEO = new THREE.SphereGeometry(1, 12, 8);

function makeRoyalAura(view, kind) {
    const h = view.height ?? 2.6;
    const g = new THREE.Group();
    const king = kind === 'king';
    // ấn / vòng sáng dưới chân
    const sigil = king
        ? fxPlane(summonSquareTexture(true), h * 1.5, h * 1.5, { additive: false, opacity: 0.9 })
        : fxPlane(orbHaloTexture(), h * 1.35, h * 1.35, { additive: false, opacity: 0.85 });
    sigil.rotation.x = -Math.PI / 2;
    sigil.position.y = FLOOR_Y - GROUND_Y + 0.01;
    const floorGlow = fxPlane(glowTexture(), h * 1.3, h * 1.3, { color: king ? GOLD_MAIN : VIOLET_MAIN, opacity: king ? 0.3 : 0.26 });
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = FLOOR_Y - GROUND_Y;
    // quầng sáng mềm quanh thân (nằm SAU lưng quân để không che hình)
    const body = fxPlane(glowTexture(), h * 0.95, h * 1.25, { color: king ? 0xffc93c : 0xfff4d0, opacity: 0.26 });
    body.position.set(0, h * 0.5, -0.3);
    const tint = king ? null : fxPlane(glowTexture(), h * 0.7, h * 0.95, { color: VIOLET_MAIN, opacity: 0.16 });
    if (tint) tint.position.set(0, h * 0.55, -0.32);
    g.add(floorGlow, sigil, body);
    if (tint) g.add(tint);
    // Vua: vương miện ánh sáng mờ lơ lửng ngay trên đầu (sau lưng thanh máu) + đốm vàng bay lên
    let crown = null;
    const motes = [];
    if (king) {
        crown = fxPlane(crownTexture(), h * 0.34, h * 0.26, { opacity: 0.5 });
        crown.position.set(0, h * 1.0, -0.25);
        g.add(crown);
        for (let i = 0; i < 6; i++) {
            const m = fxPlane(glowTexture(), 0.2, 0.2, { color: GOLD_BRIGHT, opacity: 0 });
            m.userData.a = i * 1.047 + 0.3; m.userData.r = h * (0.3 + (i % 3) * 0.09); m.userData.ph = i / 6;
            motes.push(m); g.add(m);
        }
    } else {
        // Hậu: 3 quả cầu sáng nhỏ bay vòng quanh người
        for (let i = 0; i < 3; i++) {
            const o = new THREE.Mesh(AURA_ORB_GEO, new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.95, fog: false, depthWrite: false }));
            o.userData.sharedGeometry = true;
            o.scale.setScalar(0.1);
            const gl = fxPlane(glowTexture(), 0.55, 0.55, { color: i === 1 ? VIOLET_LIGHT : GOLD_BRIGHT, opacity: 0.6 });
            const w = new THREE.Group(); w.add(gl, o);
            w.userData.ph = (i / 3) * Math.PI * 2; w.userData.y = h * (0.35 + i * 0.18);
            motes.push(w); g.add(w);
        }
    }
    g.traverse(o => { if (o.isMesh) o.renderOrder = 1; });
    const entry = { stopped: false, stop: () => { entry.stopped = true; g.visible = false; } };
    let k = 0;
    addAnim(g, 1e7, (p, fx, dt = 0.016) => {
        const m = view.member;
        const gone = entry.stopped || !m || m.alive === false || ROYAL_AURA[m.classId] !== kind || (view.root && !view.root.parent);
        k += ((gone ? 0 : 1) - k) * Math.min(1, dt * 5);
        if (gone && k < 0.03) { royalAuras.delete(view); fx.life = fx.age; return; }
        const t = fx.age, pos = view.position;
        g.visible = !entry.stopped && view.root?.visible !== false && !view._voidVanished;
        g.position.set(pos.x, GROUND_Y + (view._lift ?? 0) + (view._hover ?? 0), pos.z ?? 0);
        const breath = 0.5 + 0.5 * Math.sin(t * 1.7);
        sigil.rotation.z = t * (king ? 0.35 : -0.5);
        sigil.material.opacity = (king ? 0.95 : 0.85) * k * (0.85 + 0.15 * breath);
        floorGlow.material.opacity = (king ? 0.3 : 0.26) * k;
        body.material.opacity = (0.36 + 0.12 * breath) * k;
        body.scale.setScalar(1 + 0.05 * breath);
        if (tint) tint.material.opacity = (0.3 + 0.1 * (1 - breath)) * k;
        if (king) {
            crown.material.opacity = (0.38 + 0.16 * breath) * k;
            crown.position.y = h * 1.0 + 0.05 * Math.sin(t * 2.1);
            for (const mo of motes) {
                const q = (t * 0.32 + mo.userData.ph) % 1;   // 0 -> 1: từ chân bay lên quá vai
                mo.position.set(Math.cos(mo.userData.a + q * 1.6) * mo.userData.r, 0.15 + q * h * 0.9, Math.sin(mo.userData.a + q * 1.6) * mo.userData.r * 0.6 + 0.1);
                mo.material.opacity = 0.75 * k * Math.sin(q * Math.PI);
            }
        } else {
            for (const w of motes) {
                const a = t * 1.3 + w.userData.ph;
                w.position.set(Math.cos(a) * h * 0.42, w.userData.y + Math.sin(t * 2 + w.userData.ph) * 0.12, Math.sin(a) * h * 0.3);
                w.children[0].material.opacity = 0.55 * k;
                w.children[1].material.opacity = 0.95 * k;
            }
        }
    });
    return entry;
}

/** Gọi khi có sự kiện cờ (gọi quân, phong cấp, bàn cờ đổi...): bật bộ quét gắn hào quang cho Vua / Hậu đang ở trên sân */
export function syncRoyalAuras() {
    if (auraScan && !auraScan.stopped) { auraScan.acc = 1; return; }
    const scan = auraScan = { stopped: false, acc: 1 };
    addAnim(new THREE.Group(), 1e7, (p, fx, dt = 0.016) => {
        if (scan.stopped) { fx.life = fx.age; return; }
        scan.acc += dt;
        if (scan.acc < 0.4) return;
        scan.acc = 0;
        for (const list of Object.values(game.views ?? {})) for (const v of list ?? []) {
            const kind = v?.member?.alive ? ROYAL_AURA[v.member.classId] : null;
            if (kind && !royalAuras.has(v)) royalAuras.set(v, makeRoyalAura(v, kind));
        }
    });
}

export function clearChessFx() {
    for (const a of royalAuras.values()) a.stop();
    royalAuras.clear();
    if (auraScan) { auraScan.stopped = true; auraScan = null; }
    for (const st of activeDrains.values()) {
        st.stopped = true;
        st.layer?.stop?.();
    }
    activeDrains.clear();
    for (const st of activeJudges.values()) st.stop();
    activeJudges.clear();
    for (const orb of activeOrbs.values()) orb.stop();
    activeOrbs.clear();
    for (const st of activeDances.values()) st.stop();
    activeDances.clear();
    boardByTeam.clear();
    if (boardMesh) {
        boardMesh.userData.castle?.removeFromParent();
        boardMesh.removeFromParent();
        boardMesh = null;
        boardMode = null;
    }
}
