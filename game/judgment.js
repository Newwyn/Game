// Thời gian tính theo đồng hồ trận; các số cân bằng Phán Quyết tập trung ở đây.
const STAGE_TIME_LIMIT_MS = 180000;
const JUDGMENT = {
    name: 'Thánh Hỏa Phán Quyết', casts: 3, gapMs: 1500, durationMs: 5000,
    shieldPct: { story: 0.05, hard: 0.20, hell: 0.25 },
    blast: { story: 0.60, hard: 0.85, hell: 'kill' },
    ccMultiplier: 3, ccFlat: 0.05, stunMs: 2500, brokenMs: 4000,
    vulnerability: 0.25, shieldEventMs: 100, timerEventMs: 1000,
    pillarStunMs: 1500, sealMs: 2000,
    slamMs: 900,   // hết giờ niệm: Valdric nhảy vút lên rồi bổ xuống giữa đội địch — nổ khi chạm đất
};
const difficulty = diff => Object.hasOwn(JUDGMENT.shieldPct, diff) ? diff : 'story';
const shieldDamage = (damage, max, cc) => Math.round(Math.max(0, damage) * (cc ? JUDGMENT.ccMultiplier : 1) + (cc ? max * JUDGMENT.ccFlat : 0));
const blastDamage = (maxHp, diff) => JUDGMENT.blast[difficulty(diff)] === 'kill' ? maxHp : Math.round(maxHp * JUDGMENT.blast[difficulty(diff)]);
const nextCast = count => Math.min(JUDGMENT.casts, (count || 0) + 1);
const ultimateReady = count => count >= JUDGMENT.casts;
module.exports = { STAGE_TIME_LIMIT_MS, JUDGMENT, difficulty, shieldDamage, blastDamage, nextCast, ultimateReady };
