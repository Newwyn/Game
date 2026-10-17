// ============================================================
// ĐỘNG TÁC GOLEM NGUYÊN TỐ — 1 hình liền, cử động bằng cả thân
// ============================================================
// body: góc nghiêng cả người quanh bàn chân (âm = chồm tới trước, dương = ngả ra sau)
// hips: [dx, dy] dịch cả người (theo chiều cao) · sq: [sx, sy] phồng / dẹp (nhún, gồng, hít vào)
// Kỹ năng: Nộ Lửa (gồng -> lao đấm), Bão Tuyết (hít vào phồng người -> chồm tới phun), Hào Quang Sét (ngửa đón sét -> nện xuống).
import { buildPoseClip } from './poseClip.js';

const BASE = { hips: [0, 0], body: 0, sq: [1, 1] };
const pose = (o) => ({ ...BASE, ...o });

const IDLE = pose({ body: -0.01 });
const IDLE_IN = pose({ body: -0.015, sq: [1.012, 0.985] });          // thở
const READY = pose({ body: -0.04, sq: [1.01, 0.99] });
const READY_IN = pose({ body: -0.05, hips: [0, -0.004], sq: [1.025, 0.975] });

// Đi: bước nặng — nghiêng lắc + nhún mỗi bước
const WALK = [
    pose({ body: -0.06, hips: [0, -0.01], sq: [1.03, 0.97] }),
    pose({ body: -0.02, hips: [0, 0.012], sq: [0.99, 1.015] }),
    pose({ body: -0.07, hips: [0, -0.01], sq: [1.03, 0.97] }),
    pose({ body: -0.03, hips: [0, 0.012], sq: [0.99, 1.015] }),
];

// Đấm thường: ngả ra sau lấy đà -> chồm tới nện
const PUNCH_WIND = pose({ body: 0.08, hips: [-0.03, 0], sq: [0.98, 1.03] });
const PUNCH_HIT = pose({ body: -0.16, hips: [0.06, -0.01], sq: [1.05, 0.95] });
const PUNCH_END = pose({ body: -0.1, hips: [0.04, 0], sq: [1.02, 0.98] });

// Nộ Lửa: gồng (thu người, rung) -> lao đấm (chồm hẳn tới trước)
const CHARGE = pose({ body: 0.1, hips: [-0.03, -0.02], sq: [1.05, 0.93] });
const CHARGE_B = pose({ body: 0.12, hips: [-0.035, -0.02], sq: [1.06, 0.92] });
const DASH = pose({ body: -0.22, hips: [0.04, 0], sq: [1.04, 0.97] });
const DASH_B = pose({ body: -0.19, hips: [0.04, 0.012], sq: [1.0, 1.0] });

// Bão Tuyết: hít vào (ngửa, phồng người) -> chồm tới phun
const INHALE = pose({ body: 0.1, hips: [-0.01, 0], sq: [1.04, 1.05] });
const INHALE_B = pose({ body: 0.13, hips: [-0.015, 0], sq: [1.06, 1.07] });
const BREATH = pose({ body: -0.12, hips: [0.02, 0], sq: [1.02, 0.97] });
const BREATH_B = pose({ body: -0.14, hips: [0.025, -0.003], sq: [1.03, 0.96] });

// Hào Quang Sét: ngửa người đón sét -> nện xuống
const AURA_UP = pose({ body: 0.12, sq: [0.97, 1.06] });
const AURA_HIT = pose({ body: -0.1, hips: [0.02, -0.01], sq: [1.06, 0.93] });

const HURT = pose({ body: 0.08, hips: [-0.03, 0], sq: [0.98, 1.01] });
const STUN_A = pose({ body: 0.04, sq: [1.01, 0.99] });
const STUN_B = pose({ body: -0.05, sq: [0.99, 1.01] });
const DEAD = pose({ body: -0.35, hips: [0.05, -0.05], sq: [1.08, 0.85] });
const SUMMON = pose({ hips: [0, -0.35], body: 0.05, sq: [1.1, 0.75] });   // trồi lên từ vòng triệu hồi

export function golemClips(parts, height) {
    const c = (name, times, poses) => buildPoseClip(name, times, poses, parts, height);
    const shake = (a, b, n, T) => { const t = [], p = []; for (let i = 0; i <= n; i++) { t.push((T * i) / n); p.push(i % 2 ? b : a); } return [t, p]; };
    return [
        c('idle', [0, 1.4, 2.8], [IDLE, IDLE_IN, IDLE]),
        c('ready', [0, 1.1, 2.2], [READY, READY_IN, READY]),
        c('move', [0, 0.25, 0.5, 0.75, 1.0], [...WALK, WALK[0]]),
        c('attack', [0, 0.18, 0.3, 0.42, 0.7], [READY, PUNCH_WIND, PUNCH_HIT, PUNCH_END, READY]),   // đấm (hit 0.3)
        c('charge', ...shake(CHARGE, CHARGE_B, 8, 1.0)),                                             // gồng nắm đấm lửa (rung, giữ)
        c('dash', [0, 0.3, 0.6, 0.9, 1.2, 1.45], [DASH, DASH_B, DASH, DASH_B, DASH, READY]),          // lao đấm 1,2s
        c('inhale', [0, 0.5, 1.0], [INHALE, INHALE_B, INHALE]),                                       // hít khí lạnh (giữ)
        c('breath', ...shake(BREATH, BREATH_B, 6, 0.6)),                                              // phun bão tuyết (giữ)
        c('breathEnd', [0, 0.35], [BREATH, READY]),
        c('aura', [0, 0.3, 0.42, 0.8], [READY, AURA_UP, AURA_HIT, READY]),                            // đón sét (hit 0.4)
        c('summon', [0, 0.35, 0.65, 0.9], [SUMMON, pose({ hips: [0, 0.03], sq: [0.95, 1.06] }), pose({ sq: [1.05, 0.95] }), READY]),
        c('hurt', [0, 0.06, 0.2, 0.45], [IDLE, HURT, pose({ body: 0.05 }), IDLE]),
        c('stunned', ...shake(STUN_A, STUN_B, 4, 0.8)),
        c('victory', [0, 0.3, 0.45, 0.8], [IDLE, AURA_UP, AURA_HIT, READY]),
        c('victoryIdle', [0, 1.1, 2.2], [READY, READY_IN, READY]),
        c('dead', [0, 1], [DEAD, DEAD]),
    ];
}

export const DEFAULT_SKINS = {};
export const SKIN_KEYS = {};
export const SECONDARY = {};
export const LOCOMOTION = { runSpeed: 4, dashSpeed: 99, runClip: 'move', dashClip: 'move' };
