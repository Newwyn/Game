const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const P = require('./progression'); // Level · Bậc · Tộc · chỉ số riêng class · cấp kỹ năng

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Client được Vite build vào dist/ (chạy `npm run build` hoặc `npm start`).
// Khi phát triển, dùng `npm run dev` và mở http://localhost:5173 (Vite tự reload khi sửa code).
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));
app.get('/', (req, res) => {
    res.status(503).send('Chưa có bản build client. Hãy chạy <code>npm start</code> (build + chạy) hoặc <code>npm run dev</code> rồi mở http://localhost:5173');
});

// ============================================================
// CLASS DEFINITIONS - Assassin Prototype
// ============================================================
const ORB_COST = 1000; // 1 Orb = 1000 Energy
const START_MP = 1500; // mọi tướng vào trận có sẵn 1,5 Orb (tộc Human +0,5 Orb)
const CRIT_BASE = 1.5;  // hệ số chí mạng gốc (cộng thêm Crit DMG)
const TEST_MODE = true; // Set to true to fight NPC Dummy
const MAX_SQUAD_SIZE = 1; // 1 member for testing

const CLASS_DEFS = {
    assassin: {
        name: 'Jessica', title: 'Lôi Ám', className: 'Sát Thủ', emoji: '🥷', color: '#1e293b', dmgType: 'physical',
        classGroup: 'assassin', race: 'human',
        // Lối chơi COMBO BỘC PHÁ: đánh thường vừa phải; Bùa gắn Ấn -> Tàng Hình -> Đột Kích nổ to
        maxHp: 1200, maxMp: 5000, pAtk: 220, mAtk: 0, pDef: 50, mDef: 50,
        crit: 350, critDmg: 500, acc: 1000, dodge: 200, pen: 150, block: 50, lifesteal: 0,
        threat: 100, // Khiêu khích: mọi nhân vật / quái như nhau (chỉ hiệu ứng như Sư Tử Gầm mới ép mục tiêu)
        mpAtk: 200, mpSec: 100,
        atkSpeed: 800, range: 'melee', atkRange: 2.4, moveSpeed: 0.01,
        autoHitFrame: 3, // Frame index where damage occurs
        autoImpact: 180, // ms: nhát chém chạm (clip attack 0.18s)
        skills: [
            { name: 'Phóng Bùa', orbCost: 0, cooldown: 7000, castTime: 0, type: 'projectile', multiplier: 1.5, castRange: 10, dash: false, hitFrame: 3, backstep: 5, lock: 800 },
            { name: 'Đột Kích', orbCost: 2, cooldown: 7000, castTime: 0, type: 'melee_strike', multiplier: 2.5, castRange: 2.4, dash: true, hitFrame: 3, killReset: 1000 }, // chém chết -> hồi chiêu chỉ còn 1s
            { name: 'Tàng Hình', orbCost: 2, cooldown: 10000, castTime: 0, type: 'stealth', multiplier: 0, dash: false, hitFrame: 2, lock: 600, teamDodgeUp: 200 } // 5s, không bị phá khi ra đòn; Đột Kích lúc tàng hình chắc chắn chí mạng
        ],
        // 2 THIÊN PHÚ — cơ bản chỉ có 3 kỹ năng. Thiên phú 1 mở ở Lv20 (cấp 1→3 theo bậc S/SS/SSS),
        // thiên phú 2 mở ở Lv40 (cấp 1→2 theo bậc SS/SSS). `levels` = số liệu theo cấp thiên phú (xem progression.js)
        passives: [
            // Thiên phú 1 — Đánh Lén: +tỉ lệ chí mạng khi đánh sau lưng hoặc đang tàng hình
            //   + Bóng Ẩn: máu tụt xuống 50% (1 lần mỗi trận) -> tàng hình 2s, tự nhảy ra SAU LƯNG đối thủ YẾU MÁU NHẤT
            { name: 'Đánh Lén', type: 'backstab_crit', talent: 1, levels: { value: [0.3, 0.4, 0.5] },
              shadowStep: { threshold: 0.5, duration: 2000, behind: 1.6 },
              desc: '+{value%} tỉ lệ chí mạng khi đánh sau lưng hoặc đang tàng hình · máu còn 50% (1 lần/trận): tàng hình 2s, nhảy ra sau lưng đối thủ yếu máu nhất' },
            // Thiên phú 2 — Sát Ý: đòn đánh trúng đối thủ DƯỚI 50% máu -> CHỈ ĐÒN ĐÓ +sát thương, rồi hồi 10s
            { name: 'Sát Ý', type: 'kill_intent_trigger', cooldown: 10000, talent: 2, stat: 'killIntent',
              levels: { value: [200, 350] },
              desc: 'Đòn đánh trúng đối thủ dưới 50% máu: đòn đó +{value‰} sát thương. Hồi 10s' },
        ]
    },
    // Rok (Thiết Hộ) — class CHIẾN BINH: khiên lớn, đứng đầu hàng giữ quái, máu & thủ cao, đánh chậm
    warrior: {
        name: 'Rok', title: 'Thiết Hộ', className: 'Chiến Binh', emoji: '🛡️', color: '#475569', dmgType: 'physical',
        classGroup: 'warrior', race: 'dragon',
        maxHp: 3200, maxMp: 5000, pAtk: 150, mAtk: 0, pDef: 220, mDef: 160,
        crit: 80, critDmg: 500, acc: 1000, dodge: 50, pen: 50, block: 250, lifesteal: 0,
        threat: 100,
        mpAtk: 220, mpSec: 110,
        atkSpeed: 1200, range: 'melee', atkRange: 2.4, moveSpeed: 0.01,
        autoHitFrame: 3,
        autoImpact: 240, // ms: nhát bổ kiếm chạm (clip attack 0.24s)
        skills: [
            // ---- Chỉ số kỹ năng CẤP 1 (sau này nâng cấp sẽ tăng hệ số) ----
            // Rok là Chiến Binh giữ quái: sát thương kỹ năng ở mức VỪA ĐỦ, ~1/4 – 1/3 đòn bộc phá của Jessica.
            //   P.ATK 150 -> 0.8x = 120 gốc (quái thủ 100: ~91 · Tanker thủ 300: ~62 sau giáp)
            // Sư Tử Gầm (niệm nhanh): linh hồn sư tử gầm vang — GÂY SÁT THƯƠNG DIỆN RỘNG 0.8x lên mọi quái trong 9 đơn vị,
            //   buộc chúng đánh Rok 4 giây và -10% P.DEF / M.DEF
            { name: 'Sư Tử Gầm', orbCost: 1, cooldown: 9000, castTime: 0, type: 'taunt', radius: 9, duration: 4000, defDown: 0.1, multiplier: 0.8, hitFrame: 2, impact: 480, lock: 950 },
            // Đẩy Khiên (niệm nhanh): húc khiên vào quái trước mặt (mục tiêu đang đánh), hất văng nó ra sau
            //   xa bằng cú nhảy lùi của Jessica (5 đơn vị); SÁT THƯƠNG ĐƠN 1.6x (240 gốc: ~182 quái thủ 100 · ~123 Tanker);
            //   đáp đất xong còn bị CHOÁNG 1 giây
            //   Đối thủ RƠI XUỐNG ĐẤT -> địa chấn nhẹ: choáng 0.5s mọi đối thủ khác quanh chỗ rơi (3 đơn vị, không gây sát thương)
            { name: 'Đẩy Khiên', orbCost: 2, cooldown: 8000, castTime: 0, type: 'knockback', castRange: 2.6, multiplier: 1.6, push: 5, knockTime: 450, stun: 1000,
              quakeRadius: 3, quakeStun: 500, hitFrame: 2, impact: 220, lock: 600 },
            // Dựng Khiên (niệm nhanh): THẦN HỘ VỆ hiện trên đầu Rok, dựng khiên có 600 MÁU KHIÊN (~19% máu Rok, tối đa 5 giây)
            //   - Sát thương vào Rok trừ vào máu khiên trước; khiên vỡ thì phần dư mới trừ máu Rok
            //   - Cứ mỗi 100 máu khiên mất đi -> khiên PHÁT NỔ lan ra: 0.5x (75 gốc) lên mọi quái trong 4.5 đơn vị
            //     (khiên chịu đủ 600 = 6 lần nổ ≈ 340 lên quái thủ 100 / 230 lên Tanker; 3 quái đánh dồn ~2–3 giây là vỡ)
            //   - Các lần nổ cách nhau tối thiểu 0.25 giây (đòn dồn dập thì nổ nối tiếp, không chồng lên nhau)
            //   - Mỗi lần nổ làm quái trúng CHOÁNG NHẸ 0.5 giây
            //   - Khiên kết thúc vì BẤT KỲ lý do nào (hết giờ / vỡ / Rok dùng Kỹ năng 1-2) -> NỔ THÊM 1 LẦN CUỐI
            //   - Cả đội +20% P.DEF / M.DEF khi khiên còn. Rok đứng thủ; dùng Kỹ năng 1/2 -> khiên tự hạ.
            //   (bản mạnh) khiên = 20% máu tối đa của Rok, 6s, nổ mỗi 1/6 máu khiên ×0.8 (5.5 đơn vị), mỗi lần nổ hồi cả đội 2.5% máu,
            //   cả đội +35% P.DEF/M.DEF; choáng mỗi lần nổ vẫn 0.5s
            { name: 'Dựng Khiên', orbCost: 3, cooldown: 15000, castTime: 0, type: 'guard', duration: 6000, teamDef: 0.35,
              shieldPct: 0.2, burstCount: 6, burstMultiplier: 0.8, burstRadius: 5.5, burstGap: 250, burstStun: 500, burstHeal: 0.025, multiplier: 0, hitFrame: 2, lock: 300 },
            //   - Mỗi lần khiên nổ TRÚNG quái -> cả đội (kể cả Rok) hồi 1.5% máu tối đa (cấp kỹ năng tăng tới ~2%; 6-7 lần nổ ≈ 10-13% máu)
        ],
        passives: [
            // Thiên phú 1 — Ý Chí Thép + DÂY LIÊN KẾT: vào trận Rok nối dây với đồng đội có ATK cao nhất (P.ATK hoặc M.ATK theo kiểu đánh).
            //   Cả Rok và người được nối: máu < 30% -> +chặn đòn; lần đầu tụt dưới 30% -> 5s mỗi giây hồi 3% máu (hồi 10s).
            //   Dây còn: chỉ số thiên phú 1 & 2 trên RIÊNG Rok ×2. 1 trong 2 chết -> đứt dây, cả trận không nối lại.
            { name: 'Ý Chí Thép', type: 'low_hp_block', threshold: 0.3, regen: 0.03, regenTime: 5000, cooldown: 10000, talent: 1, levels: { value: [150, 200, 250] },
              desc: 'Vào trận nối dây với đồng đội ATK cao nhất. Rok & người được nối: máu dưới 30% -> +{value‰} chặn đòn, kèm 5s hồi 3% máu mỗi giây (hồi 10s). Còn dây: thiên phú 1 & 2 của Rok ×2. 1 trong 2 chết -> đứt dây' },
            // Thiên phú 2 — Kiên Cường: nhận đủ 10 đòn -> bật 10s (giảm sát thương nhận & thời gian bị choáng), hết thì hồi 15s.
            //   Người được nối dây cũng có (tự đếm đòn của mình)
            //   GÁNH ĐÒN: còn dây -> người được nối chỉ nhận 50% sát thương, Rok gánh 50% còn lại (khiên của Rok hứng trước)
            { name: 'Kiên Cường', type: 'tenacity_trigger', hits: 10, duration: 10000, cooldown: 15000, talent: 2, stat: 'tenacity',
              share: 0.5, levels: { value: [150, 250] },
              desc: 'Rok & người được nối dây: nhận đủ 10 đòn -> bật 10s: giảm {value‰} sát thương nhận & thời gian bị khống chế. Hết thì hồi 15s. Còn dây: người được nối chỉ nhận 50% sát thương, Rok gánh phần còn lại' },
        ]
    },
    // Lyra (Phong Tiễn) — class XẠ THỦ: bắn xa hàng sau, sát thương VẬT LÝ đều tay, mỏng máu
    archer: {
        name: 'Lyra', title: 'Phong Tiễn', className: 'Cung Thủ', emoji: '🏹', color: '#0f766e', dmgType: 'physical',
        classGroup: 'archer', race: 'elf',
        maxHp: 1000, maxMp: 5000, pAtk: 200, mAtk: 0, pDef: 40, mDef: 60,
        crit: 250, critDmg: 500, acc: 1100, dodge: 120, pen: 0, block: 0, lifesteal: 0, // xuyên giáp đến từ thiên phú (50%)
        threat: 100,
        mpAtk: 200, mpSec: 100,
        atkSpeed: 900, range: 'ranged', atkRange: 11, moveSpeed: 0.01,
        autoHitFrame: 2,
        autoImpact: 400, // ms: nhả tên 0.2s + tên bay 0.2s
        skills: [
            // Tiễn Gió Chớp (niệm nhanh): nhảy lên bắn 1 mũi tên gió vào MỤC TIÊU ĐANG NHẮM — CHẮC CHẮN CHÍ MẠNG,
            //   +50% xuyên giáp (cộng thiên phú 50% = XUYÊN TOÀN BỘ GIÁP), đẩy lùi 2 đơn vị (không choáng).
            //   Hạ gục mục tiêu -> hoàn Orb + hồi chiêu ngay.
            { name: 'Tiễn Gió Chớp', orbCost: 1, cooldown: 6000, castTime: 0, type: 'snipe', castRange: 13, multiplier: 1.2,
              penBonus: 0.5, push: 2, knockTime: 300, backstep: 3, hitFrame: 2, impact: 540, lock: 800 },
            // Thần Phong Giáng Thế (niệm nhanh): Vệ Thần Gió hiện ra bắn phụ cùng Lyra trong 8 giây;
            //   Lyra BAY LÊN (né được kỹ năng đánh dưới đất), +30% tốc đánh, +20% P.ATK, tầm đánh 11 -> 19 (tầm xa nhất chỉ có khi bật kỹ năng này),
            //   +30% tỉ lệ chí mạng, +20% sát thương chí mạng. Cả đội +20% chính xác.
            { name: 'Thần Phong Giáng Thế', orbCost: 2, cooldown: 16000, castTime: 0, type: 'wind_spirit', duration: 8000,
              atkSpeedUp: 0.3, atkUp: 0.2, rangeUp: 8, critUp: 300, critDmgUp: 200, teamAccUp: 200, spiritMultiplier: 0.5, multiplier: 0, hitFrame: 2, impact: 380, lock: 1000 },
            // Thần Tiễn Phá Thiên (NIỆM LÂU 2 giây): gồng cung (có Vệ Thần thì cùng gồng) -> 6 mũi tên hiện ra sau lưng
            //   xếp vòng cung rồi phóng như TÊN LỬA tới NGẪU NHIÊN mọi quái đang có (mỗi quái ít nhất 1 mũi),
            //   mỗi mũi ×0.7 (dồn 1 mục tiêu = ×4.2), không bị đỡ.
            //   Có Vệ Thần: thêm 4 mũi ×0.5 (tổng 10 mũi). Bị CHOÁNG khi đang gồng -> mất chiêu.
            { name: 'Thần Tiễn Phá Thiên', orbCost: 3, cooldown: 18000, castTime: 2000, type: 'charged_shot', castRange: 19,
              arrows: 6, multiplier: 0.7, spiritArrows: 4, spiritMultiplier: 0.5, hitFrame: 2,
              impact: 160, formTime: 300, arrowGap: 70, arcFlight: 300, lock: 800 },
        ],
        passives: [
            // Thiên phú 1 — Phong Tiễn: (a) cứ 3 mũi tên thường -> 1 mũi tên gió XUYÊN mọi quái phía trước (Vệ Thần cũng bắn, ×0.5 của Lyra)
            //                            (b) MỌI mũi tên Lyra (và Vệ Thần) bắn ra — đánh thường hay kỹ năng — xuyên giáp
            { name: 'Phong Tiễn', type: 'wind_pierce', every: 3, range: 14, talent: 1, levels: { multiplier: [0.6, 0.7, 0.8], pen: [0.3, 0.4, 0.5] },
              desc: 'Cứ 3 mũi tên thường -> 1 mũi gió xuyên mọi quái {multiplier} · mọi mũi tên xuyên {pen%} giáp' },
            // Thiên phú 2 — Ưng Nhãn: mục tiêu càng xa sát thương càng cao (tối đa ở tầm 17+, tức là khi bật Thần Phong Giáng Thế)
            { name: 'Ưng Nhãn', type: 'hawk_eye', talent: 2, stat: 'hawkEye', levels: { value: [150, 250] },
              desc: 'Kỹ năng 1-2-3 (không tính đánh thường & mũi gió xuyên): mục tiêu càng xa sát thương càng cao, tối đa +{value‰} ở tầm 17+' },
        ]
    },
    // Seraphine (Thánh Quang) — class TU SĨ: hồi máu / khiên / niệm buff cả đội, sát thương PHÉP
    priest: {
        name: 'Seraphine', title: 'Thánh Quang', className: 'Tu Sĩ', emoji: '✨', color: '#ca8a04', dmgType: 'magic',
        classGroup: 'priest', race: 'human',
        maxHp: 1100, maxMp: 5000, pAtk: 0, mAtk: 180, pDef: 45, mDef: 90,
        crit: 100, critDmg: 500, acc: 1000, dodge: 100, pen: 0, block: 0, lifesteal: 0,
        threat: 100,
        mpAtk: 220, mpSec: 140,
        atkSpeed: 1000, range: 'ranged', atkRange: 9, moveSpeed: 0.01,
        autoHitFrame: 2,
        autoImpact: 470, // ms: phóng cầu sáng 0.22s + bay 0.25s
        skills: [
            // Thánh Quang Trị Liệu: hồi ×2.0 M.ATK cho đồng đội YẾU MÁU NHẤT (đầu trận chưa ai mất máu -> tướng NHIỀU máu nhất) + giải choáng.
            //   Đang NIỆM: hồi ×2 lượng cho CẢ ĐỘI + giải mọi hiệu ứng bất lợi, có thiên thần nhỏ bay tới; hồi chiêu 3s
            { name: 'Thánh Quang Trị Liệu', orbCost: 1, cooldown: 6000, castTime: 0, type: 'heal', heal: 2.0, castRange: 99,
              prayCooldown: 3000, angelFlight: 450, multiplier: 0, hitFrame: 2, impact: 300, lock: 650 },
            // Khiên Ánh Sáng: khiên ×2.0 M.ATK trong 5s cho đồng đội YẾU MÁU NHẤT (đầu trận -> tướng NHIỀU máu nhất).
            //   Đang NIỆM: khiên ×2 cho CẢ ĐỘI (mọc cánh) + 20% thủ + giảm 30% thời gian bị khống chế; hồi chiêu 5s.
            //   Riêng Tu Sĩ còn khiên cánh thì KHÔNG bị choáng (vỡ khiên mới bị choáng / ngắt niệm)
            { name: 'Khiên Ánh Sáng', orbCost: 2, cooldown: 12000, castTime: 0, type: 'holy_shield', shieldHp: 2.0, duration: 5000, castRange: 99,
              prayCooldown: 5000, prayDefUp: 0.2, prayCcResist: 0.3, multiplier: 0, hitFrame: 2, impact: 280, lock: 600 },
            // Thánh Niệm: bay lên niệm 10s (chỉ choáng mới ngắt) cùng Hộ vệ ánh sáng; cả đội +20% sát thương (vật lý/phép theo từng người);
            //   dùng xong hồi ngay Kỹ năng 1 & 2, trong lúc niệm hồi chiêu 2 kỹ năng đó còn 3s / 5s
            { name: 'Thánh Niệm', orbCost: 3, cooldown: 20000, castTime: 0, type: 'pray', duration: 10000, dmgUp: 0.2, prayHeal: 0.2, prayHealEvery: 1000, castRange: 99,
              multiplier: 0, hitFrame: 2, impact: 450, lock: 700 },
        ],
        passives: [
            // Thiên phú 1 — Ân Điển: +% hồi máu & khiên · hồi máu / khiên giải mọi hiệu ứng bất lợi ·
            //   khi Niệm: cả đội +10% P.DEF/M.DEF, Tu Sĩ hồi thêm 450 MP/giây
            { name: 'Ân Điển', type: 'grace', talent: 1, defUp: 0.1, prayMp: 600, levels: { value: [0.10, 0.15, 0.20] },
              desc: '+{value%} hồi máu & khiên · hồi máu/khiên giải mọi hiệu ứng bất lợi · khi Niệm: cả đội +10% thủ, Tu Sĩ +600 MP/giây' },
            // Thiên phú 2 — Thiên Thần Hộ Mệnh: đồng đội chết -> thiên thần nhỏ bay tới xác hồi sinh (hồi 30s)
            { name: 'Thiên Thần Hộ Mệnh', type: 'guardian_revive', talent: 2, cooldown: 30000, flight: 1200, invuln: 2000, levels: { value: [0.3, 0.5] },
              desc: 'Đồng đội chết -> thiên thần nhỏ bay tới hồi sinh với {value%} máu + 2 giây BẤT TỬ (miễn mọi sát thương). Hồi 30s' },
        ]
    },
    // Ignar (Hỏa Ngục) — class PHÙ THỦY: đứng hàng sau, sát thương PHÉP diện rộng, ném cầu lửa
    mage: {
        name: 'Ignar', title: 'Hỏa Ngục', className: 'Phù Thủy', emoji: '🔥', color: '#b91c1c', dmgType: 'magic',
        classGroup: 'mage', race: 'human',
        maxHp: 950, maxMp: 5000, pAtk: 0, mAtk: 220, pDef: 35, mDef: 70,
        crit: 150, critDmg: 500, acc: 1000, dodge: 80, pen: 100, block: 0, lifesteal: 0,
        threat: 100,
        mpAtk: 200, mpSec: 120,
        atkSpeed: 1100, range: 'ranged', atkRange: 15, moveSpeed: 0.01,
        autoHitFrame: 2,
        autoImpact: 480, // ms: ném (0.25s) + cầu lửa bay (0.23s)
        skills: [
            // Thiên Hỏa Cầu: giơ tay gọi quả cầu lửa lớn trên trời -> rơi xuống chỗ quái ĐÔNG nhất, nổ diện rộng
            //   chạm đất ×2.0 (bán kính 5.5) -> để lại BIỂN LỬA cháy thêm 3 lần ×0.3 (mỗi 0.6s)
            { name: 'Thiên Hỏa Cầu', orbCost: 1, cooldown: 7000, castTime: 1000, godCast: 0, godTwinChance: 0.8, type: 'sky_fireball', castRange: 18, multiplier: 2.0, radius: 5.5,
              burnTicks: 3, burnMultiplier: 0.3, burnGap: 600, impact: 950, lock: 750 },
            // Cột Lửa Phá Ma: bắn cục lửa xuống đất -> cột lửa bùng 7 lần (mỗi 0.4s, ×0.45 diện rộng),
            //   mỗi lần trúng -5% M.DEF (tối đa 5 lần = -25%), giữ 10s
            //   Ignar chưởng xuống đất (0.25s) -> vòng phép hiện ở chỗ quái 1s -> cột lửa bùng (bán kính 5)
            { name: 'Cột Lửa Phá Ma', orbCost: 2, cooldown: 14000, castTime: 1000, godCast: 0, godCircleTime: 400, godDmgUp: 0.25, type: 'fire_pillar', castRange: 18, hits: 7, tickMultiplier: 0.45,
              radius: 5, tickGap: 400, mDefDown: 0.05, maxStacks: 5, breakDuration: 10000, circleTime: 1000, impact: 1250, lock: 650 },
            // Hỏa Thần Giáng Lâm (GỒNG 1.5s): Hộ Vệ Thần Lửa chiến đấu cùng 15s, +25% M.ATK.
            //   Đánh thường -> Hỏa Chưởng diện rộng; cứ 3 đòn nhảy lên chưởng TẤT CẢ quái (choáng 0.5s, hồi chiêu KN1 & KN2 -1s)
            //   Khiên Lửa (riêng Ignar): +30% M.DEF, -40% thời gian bị khống chế
            { name: 'Hỏa Thần Giáng Lâm', orbCost: 3, cooldown: 25000, castTime: 1500, type: 'fire_god', duration: 15000, mAtkUp: 0.25,
              mDefUp: 0.3, ccResist: 0.4,
              guardianMultiplier: 0.5, guardianEvery: 1500, palmMultiplier: 1.1, splashMultiplier: 0.6, splashRadius: 2.5,
              volleyEvery: 3, volleyMultiplier: 1.3, volleyStun: 500, cdReduce: 1000, impact: 300, lock: 600 },
        ],
        passives: [
            // Thiên phú 1 — Thiên Hỏa Song Tinh: +M.ATK; Thiên Hỏa Cầu có 50% rơi thêm quả thứ 2 (70% sức mạnh)
            { name: 'Thiên Hỏa Song Tinh', type: 'twin_meteor', chance: 0.5, ratio: 0.7, pillarExtra: 3, talent: 1, levels: { mAtkUp: [0.08, 0.12, 0.16] },
              desc: '+{mAtkUp%} M.ATK · Thiên Hỏa Cầu có 50% rơi thêm quả thứ 2 (70% sức mạnh) · Cột Lửa Phá Ma bùng thêm 3 lần' },
            // Thiên phú 2 — Hỏa Tốc: lúc Hỏa Thần giáng lâm +tốc đánh
            //   + GIÁP LỬA: máu tụt dưới 50% -> khiên lửa riêng cho Ignar 10s (máu khiên theo % máu tối đa, +30% M.DEF, −40% khống chế, +1 Orb);
            //     vừa bật: hất văng đối thủ quanh mình ra xa · khiên hết (vỡ / hết giờ): nổ choáng 1s xung quanh, +1 Orb. Hồi 25s (tính từ lúc bật)
            { name: 'Hỏa Tốc', type: 'fire_haste', talent: 2, stat: 'fireHaste',
              ward: { threshold: 0.5, duration: 10000, cooldown: 25000, mDefUp: 0.3, ccResist: 0.4, pushRadius: 4, push: 3.5, knockTime: 350, stunRadius: 4.5, stun: 1000, orbs: 1 },
              levels: { value: [200, 300], wardPct: [0.3, 0.4] },
              desc: 'Lúc Hỏa Thần giáng lâm: +{value‰} tốc đánh · Máu dưới 50%: GIÁP LỬA 10s (khiên {wardPct%} máu, +30% M.DEF, −40% khống chế, +1 Orb), vừa bật hất văng đối thủ xung quanh, khiên hết thì nổ choáng 1s xung quanh và +1 Orb. Hồi 25s' },
        ]
    },
    // Zerith (U Minh) — class SÁT THỦ (nhánh PHÉP), tộc Devil: lưỡi hái tử thần, sát thương PHÉP, lướt xuyên / hất tung / hóa Thần Chết
    reaper: {
        name: 'Zerith', title: 'U Minh', className: 'Sát Thủ', emoji: '💀', color: '#6d28d9', dmgType: 'magic',
        classGroup: 'assassin', race: 'devil',
        maxHp: 1150, maxMp: 5000, pAtk: 0, mAtk: 210, pDef: 50, mDef: 60,
        crit: 250, critDmg: 500, acc: 1000, dodge: 160, pen: 120, block: 30, lifesteal: 0,
        threat: 100,
        mpAtk: 200, mpSec: 100,
        atkSpeed: 850, range: 'melee', atkRange: 2.8, moveSpeed: 0.01,
        autoHitFrame: 3,
        autoImpact: 220, // ms: nhát liềm bổ xuống chạm (clip attack 0.22s)
        skills: [
            // Lưỡi Hái Xuyên Hồn: chỉ dùng khi quái đã TRONG TẦM ĐÁNH; lướt thẳng về phía trước 1 quãng CỐ ĐỊNH 15 đơn vị
            //   (xuyên qua hàng trước, tới được chỗ tướng đánh xa đứng sau như Lyra), chém mọi quái trên đường lướt ×1.6.
            //   Lúc Đêm Tử Thần: lướt lần 1 (tốn Orb) -> hồi chiêu NGAY + 5 giây được lướt lần 2 MIỄN PHÍ (tự bấm);
            //   lướt lần 2 xong mới hồi chiêu bình thường
            { name: 'Lưỡi Hái Xuyên Hồn', orbCost: 0, cooldown: 7000, castTime: 0, type: 'reaper_dash', castRange: 2.8, dashLen: 15, multiplier: 1.6,
              width: 1.6, dashTime: 380, echoWindow: 5000, impact: 120, lock: 560 },
            // Lưỡi Hái Hất Hồn (niệm 0.7s — triệu hồi LƯỠI HÁI KHỔNG LỒ): lưỡi hái lớn quét từ dưới lên — quái phía trước trong 3.5 đơn vị
            //   trúng ×2.2 và bị HẤT TUNG 1 giây (không làm gì được).
            //   Lúc Đêm Tử Thần: KHÔNG CẦN NIỆM (lưỡi hái hiện ra ngay), phạm vi RỘNG 6 đơn vị, quét lên rồi BỔ XUỐNG thêm ×1.2
            { name: 'Lưỡi Hái Hất Hồn', orbCost: 2, cooldown: 10000, castTime: 700, formCast: 0, type: 'reaper_scythe', castRange: 3.2, radius: 3.5, formRadius: 6,
              multiplier: 2.2, knockup: 1000, slamMultiplier: 1.2, slamDelay: 550, impact: 150, formImpact: 300, lock: 700 },
            // Đêm Tử Thần (niệm 1s): gọi HỘ VỆ THẦN CHẾT chiến đấu cùng 10s (cứ chém đủ 2 nhát -> 50% TỰ DÙNG Lưỡi Hái Hất Hồn,
            //   không tốn gì: hất tung quái quanh mục tiêu rồi chém bổ xuống), Zerith bay lơ lửng:
            //   +20% sát thương, +30% tốc đánh, −40% thời gian bị khống chế, KHÔNG THỂ CHẾT (máu tối thiểu 1).
            //   Đánh thường chém lan (×0.5 quái quanh mục tiêu 3 đơn vị); Hộ Vệ chém ×0.6 mỗi 1.2s;
            //   Kỹ năng 1 lướt 2 lần, Kỹ năng 2 bổ xuống thêm 1 lần
            { name: 'Đêm Tử Thần', orbCost: 3, cooldown: 25000, castTime: 1000, type: 'reaper_night', duration: 10000, dmgUp: 0.2,
              atkSpeedUp: 0.3, ccResist: 0.4, guardianMultiplier: 0.6, guardianEvery: 1200, cleaveMultiplier: 0.5, cleaveRadius: 3,
              guardianReapEvery: 2, guardianReapChance: 0.5, guardianReapRadius: 4.5,
              impact: 250, lock: 800 },
        ],
        passives: [
            // Thiên phú 1 — Phán Quyết Tử Thần: vào giao tranh (và mỗi 15s) gắn Ấn Tử lên TẤT CẢ nhân vật phe địch.
            //   Lưỡi Hái Hất Hồn LÚC ĐÊM TỬ THẦN lên mục tiêu có Ấn Tử: PHÁ SẠCH KHIÊN. Máu chạm NGƯỠNG TỬ (bất kỳ đòn nào) -> THẦN CHẾT PHÁN QUYẾT:
            //   nhấc mục tiêu lên không trung (không bị đánh / chọn / dính hiệu ứng) -> chém: có khiên -> vỡ khiên rơi xuống, không khiên -> chết.
            //   Xong thì mất Ấn Tử, chờ lượt gắn sau. Phán quyết: nhấc 1.1s, chém, rơi 0.5s
            { name: 'Phán Quyết Tử Thần', type: 'death_judgement', talent: 1, every: 15000, duration: 15000, range: 9, liftTime: 1100, fallTime: 500,
              levels: { value: [0.05, 0.07, 0.10], healCut: [0.20, 0.275, 0.35] },
              desc: 'Vào giao tranh và mỗi 15s gắn Ấn Tử lên TẤT CẢ đối thủ: −{healCut%} hồi máu nhận được · Lưỡi Hái Hất Hồn lúc Đêm Tử Thần phá sạch khiên · máu chạm NGƯỠNG TỬ {value%} -> Thần Chết nhấc lên không trung phán quyết: có khiên thì vỡ khiên rơi xuống, không khiên thì chết' },
            // Thiên phú 2 — Linh Hồn Báo Thù: lần đầu gục ngã -> hóa linh hồn Thần Chết chiến đấu tiếp 7s (1 lần mỗi trận)
            { name: 'Linh Hồn Báo Thù', type: 'reaper_avenger', talent: 2, duration: 7000, every: 900, multiplier: 1.2, splash: 0.5, splashRadius: 2.5,
              levels: { value: [0.6, 0.8] },
              desc: 'Lần đầu gục ngã: linh hồn Thần Chết (bất tử) hiện ra chiến đấu 7s với {value%} sức mạnh — được hồi sinh thì Zerith đánh chung với nó (1 lần mỗi trận)' },
        ]
    },
    // Nerissa (Thủy Vũ) — class TU SĨ (vũ công nước), tộc Elf, sát thương PHÉP: 3 ĐIỆU MÚA chạy SONG SONG được,
    //   mỗi tổ hợp điệu múa có hiệu ứng riêng. Lúc múa: không đánh thường, lượn qua lại ±1.5 đơn vị (vị trí thật di chuyển).
    //   Hồi chiêu kỹ năng 1 & 3 tính từ lúc điệu múa KẾT THÚC (múa đủ hoặc bị ngắt); bị choáng -> mọi điệu múa dừng.
    dancer: {
        name: 'Nerissa', title: 'Thủy Vũ', className: 'Tu Sĩ', emoji: '🌊', color: '#0891b2', dmgType: 'magic',
        classGroup: 'priest', race: 'elf',
        maxHp: 1050, maxMp: 5000, pAtk: 0, mAtk: 170, pDef: 45, mDef: 100,
        crit: 80, critDmg: 500, acc: 1000, dodge: 140, pen: 0, block: 0, lifesteal: 0,
        threat: 100,
        mpAtk: 200, mpSec: 150,
        atkSpeed: 1000, range: 'ranged', atkRange: 8, moveSpeed: 0.01,
        autoHitFrame: 2,
        autoImpact: 420, // ms: quất lụa 0.24s + giọt nước bay 0.18s
        danceSway: 1.5, danceDepth: 0.7, danceCycle: 3000,   // lượn qua lại ±1.5 (ngang) ±0.7 (sâu), 1 vòng 3s
        skills: [
            // Vũ Khúc Sóng Triều: múa 5s — cả đội (kể cả Nerissa) TĂNG TỐC HỒI MP +400/600/800/1000 MP mỗi giây theo bậc
            //   (múa đủ 5s = mỗi người thêm 2/3/4/5 Orb). Hồi 10s sau khi múa xong / bị ngắt
            { name: 'Vũ Khúc Sóng Triều', orbCost: 2, cooldown: 10000, castTime: 0, type: 'dance_tide', duration: 5000,
              manaPerSec: 400, byRank: { manaPerSec: [400, 600, 800, 1000] }, castRange: 99, impact: 300, lock: 350, active: 'dance_tide' },
            // Lưu Thủy Hồi Xuân: cần ít nhất 1 Orb; cứ 0.5s ĐỐT 0.5 Orb -> hồi cả đội ×0.35 M.ATK + 1% máu tối đa.
            //   Múa tới khi HẾT ORB thì dừng. KHÔNG hồi chiêu (đang múa thì không dùng lại được)
            { name: 'Lưu Thủy Hồi Xuân', orbCost: 0, minOrbs: 1, cooldown: 0, castTime: 0, type: 'dance_flow', drainEvery: 500, drainMp: 500,
              heal: 0.35, healPct: 0.01, castRange: 99, impact: 300, lock: 350, active: 'dance_flow' },
            // Thủy Thần Vũ: múa 10s — cả đội +20% MÁU TỐI ĐA (hồi phần tăng), +30% lượng hồi máu nhận, +20% ATK (P.ATK & M.ATK),
            //   kháng hiệu ứng: Nerissa 100%, đồng đội 50%. Hồi 12s sau khi múa xong / bị ngắt.
            //   CẢ 3 ĐIỆU MÚA cùng lúc: mỗi 1s bắn nốt nhạc — đối thủ: ×0.4 phép + −15% M.DEF 3s;
            //   đồng đội: +10% sát thương PHÉP 3s + 50% giải 1 hiệu ứng khống chế ngẫu nhiên
            { name: 'Thủy Thần Vũ', orbCost: 4, cooldown: 12000, castTime: 0, type: 'dance_god', duration: 10000,
              hpUp: 0.2, healUp: 0.3, atkUp: 0.2, selfCc: 1.0, teamCc: 0.5,
              noteEvery: 1000, noteMultiplier: 0.4, noteMdefDown: 0.15, noteAmp: 0.1, noteTime: 3000, noteCleanse: 0.5,
              teamOrbs: 2,   // vừa vào điệu: cả đội (kể cả Nerissa) +2 Orb ngay
              castRange: 99, impact: 400, lock: 450, active: 'dance_god' },
        ],
        passives: [
            // Thiên phú 1 — Hòa Âm Thủy Vũ: mỗi tổ hợp điệu múa có thêm hiệu ứng
            //   1+2: cả đội có GIÁP NƯỚC 6/8/10% máu, giáp tự hồi 1% máu mỗi giây trong lúc tổ hợp còn chạy
            //   2+3: mỗi đối thủ mất 0.15 Orb mỗi giây (tối đa 2 Orb mỗi lần tổ hợp) — Sóng Triều của tu sĩ nước bên kia luôn hồi nhanh hơn
            //   1+3: phe ta +15% tốc đánh, phe địch −10% tốc đánh
            //   1+2+3: cả đội +1 Orb ngay (1 lần mỗi trận; cấp tối đa 2 lần)
            { name: 'Hòa Âm Thủy Vũ', type: 'water_harmony', talent: 1, shieldRegen: 0.01, drainPerSec: 150, drainMax: 2000, hasteUp: 0.15, slow: 0.1,
              levels: { shield: [0.06, 0.08, 0.10], gifts: [1, 1, 2] },
              desc: 'Múa 1+2: cả đội giáp nước {shield%} máu (tự hồi 1%/giây) · 2+3: mỗi đối thủ mất 0,15 Orb/giây (tối đa 2 Orb) · 1+3: phe ta +15% tốc đánh, phe địch −10% · 1+2+3: cả đội +1 Orb ngay ({gifts} lần/trận)' },
            // Thiên phú 2 — Triều Dâng: đối thủ gục -> cả đội +1 Orb ngay; Nerissa tự hồi MP nhanh hơn
            { name: 'Triều Dâng', type: 'tide_surge', talent: 2, orbs: 1, levels: { value: [0.25, 0.40] },
              desc: 'Đối thủ gục -> cả đội +1 Orb ngay · Nerissa hồi MP nhanh hơn {value%}' },
        ]
    },
    // Elarion (Tam Nguyên) — class PHÙ THỦY, tộc Elf, pháp sư nguyên tố kiểu Invoker.
    //   NGỌC NGUYÊN TỐ (Hỏa / Băng / Lôi) lơ lửng quanh pháp sư: cứ 3s rơi 1 viên ngẫu nhiên (1 hệ không rơi quá 2 lần liền),
    //   tối đa 5 viên, mỗi viên sống 8 giây GIỜ THẬT. Bấm vào ngọc -> vào 3 ô ngọc (viên thứ 4 đẩy viên cũ nhất ra).
    //   KN1 Sách Nguyên Tố (1 Orb, không hồi chiêu): đọc 3 viên đang giữ -> tạo phép tương ứng vào nút KN2 (MẤT 3 viên). KN2: phép vừa ghép.
    //   KN3 Bão Nguyên Tố: ngọc trên sân bổ sung ngay cho đủ 7 viên, trong 7s cứ bớt là tung thêm cho đủ 7.
    elementalist: {
        name: 'Elarion', title: 'Tam Nguyên', className: 'Phù Thủy', emoji: '🔮', color: '#7c3aed', dmgType: 'magic',
        classGroup: 'mage', race: 'elf',
        maxHp: 1000, maxMp: 5000, pAtk: 0, mAtk: 240, pDef: 40, mDef: 75,
        crit: 100, critDmg: 500, acc: 1000, dodge: 80, pen: 0, block: 0, lifesteal: 0,
        threat: 100,
        mpAtk: 200, mpSec: 150,
        atkSpeed: 1050, range: 'ranged', atkRange: 14, moveSpeed: 0.01,
        autoHitFrame: 2,
        autoImpact: 380, // ms: vung tay 0.22s + tia nguyên tố bay 0.16s
        gemEvery: 3000, gemLife: 8000, gemMax: 5, gemHold: 3, gemMaxRun: 2,
        skills: [
            // Sách Nguyên Tố: tốn 1 Orb, KHÔNG hồi chiêu — đọc 3 viên đang giữ -> phép vào nút KN2
            { name: 'Sách Nguyên Tố', orbCost: 1, cooldown: 0, castTime: 0, type: 'elem_book', castRange: 99, impact: 200, lock: 300 },
            // nút KN2: phép đang giữ (thay bằng phép trong `spells` mỗi lần ghép) — chưa ghép hoặc vừa dùng xong thì trống
            { name: 'Chưa có phép', orbCost: 0, cooldown: 0, castTime: 0, type: 'elem_spell', spell: null, castRange: 99, impact: 0, lock: 0 },
            // Bão Nguyên Tố: dùng xong +2 Orb ngay (thực tốn 1 Orb), hồi 10s
            { name: 'Bão Nguyên Tố', orbCost: 3, cooldown: 10000, castTime: 0, type: 'elem_storm', duration: 7000, fill: 7, orbGain: 2, castRange: 99,
              impact: 300, lock: 450, active: 'elem_storm' },
        ],
        // 10 phép: ghép 3 viên (không cần đúng thứ tự). recipe: f = Hỏa, i = Băng, b = Lôi
        spells: {
            // Thiên Thạch: rơi vào chỗ đông đối thủ (chạm đất LUÔN CHÍ MẠNG) -> LĂN CHẬM thẳng về phía địch (tầm lướt Zerith) -> vệt lửa 2 lần.
            //   (ý đồ ẩn) Lốc Xoáy đẩy đối thủ va vào thiên thạch đang lăn -> thêm sát thương va chạm
            meteor: { name: 'Thiên Thạch', recipe: 'fff', orbCost: 3, cooldown: 14000, multiplier: 2.8, radius: 4, impact: 800, lock: 600,
                rollLen: 15, rollTime: 3000, rollWidth: 1.6, rollMultiplier: 0.8, crashMultiplier: 1.2, trailTicks: 2, trailGap: 1000, trailMultiplier: 0.4, trailTime: 3500 },
            // Băng Phong: khối băng thành hình trên đầu địch 1,5s -> rơi: cả đội địch ×1.1 (băng) + −20% tốc đánh 3s;
            //   vỡ ra 5 khối nhỏ văng xuống (×0.35, hiệu ứng tính chung) · mỗi đối thủ có cơ hội bị đóng băng theo bậc
            frost: { name: 'Băng Phong', recipe: 'iii', orbCost: 3, cooldown: 12000, multiplier: 1.1, shards: 5, shardMultiplier: 0.35, shardRadius: 1.6,
                form: 1500, fall: 300, slow: 0.2, slowTime: 3000, impact: 400, lock: 600,
                freezeChance: 0.2, freezeTime: 1000, byRank: { freezeChance: [0.2, 0.25, 0.3, 0.4], freezeTime: [1000, 1300, 1600, 2000] } },
            // Lôi Xích: nảy qua tối đa 5 đối thủ, sau đó mỗi lần 50% nảy tiếp (được trúng lại), −M.DEF 5s (không cộng dồn)
            chain: { name: 'Lôi Xích', recipe: 'bbb', orbCost: 2, cooldown: 13000, multiplier: 1.5, bounces: 5, extraChance: 0.5, extraMax: 10,
                bounceRange: 9, bounceGap: 120, mDefDown: 0.1, debuffTime: 5000, byRank: { mDefDown: [0.10, 0.12, 0.13, 0.15] }, impact: 300, lock: 500 },
            golem: { name: 'Nguyên Tố Hợp Nhất', recipe: 'fib', orbCost: 5, cooldown: 25000, duration: 20000, impact: 600, lock: 900,
                hpMult: 4.67, atkMult: 1.1, pDefMult: 6, mDefMult: 2.3 },   // máu = 4,67× máu Elarion · ATK = 1,1× M.ATK Elarion
            // Giáp Băng Sét: khiên 25% máu cho Elarion + đồng đội yếu máu nhất 6s; ai đánh trúng người có giáp bị sét giật + choáng
            ward: { name: 'Giáp Băng Sét', recipe: 'iib', orbCost: 2, cooldown: 15000, duration: 6000, shieldPct: 0.25, impact: 300, lock: 500,
                counterMultiplier: 0.4, counterStun: 500, counterEvery: 1000 },
            tornado: { name: 'Lốc Xoáy', recipe: 'bbi', orbCost: 2, cooldown: 16000, multiplier: 1.1, length: 12, width: 1.8, travel: 900,
                push: 4, knockTime: 450, impact: 300, lock: 500 },
            // Hơi Nước Bỏng: niệm 2s -> mây mưa giông 7s (Elarion đứng thi triển: không đánh / chạy; vẫn nhặt ngọc; dùng kỹ năng khác thì ngắt)
            //   mưa: phe ta hồi máu mỗi giây (đầy máu thì hồi MP) · sét: mỗi giây đánh 1 đối thủ ngẫu nhiên, choáng 0,5s
            steam: { name: 'Hơi Nước Bỏng', recipe: 'ffi', orbCost: 3, cooldown: 14000, castTime: 2000, duration: 7000, every: 1000,
                heal: 0.3, healPct: 0.015, manaPerSec: 200, strikeMultiplier: 0.7, strikeStun: 500, impact: 0, lock: 0 },
            // Hỏa Lôi Cầu: quả cầu hiện ở 1 điểm cố định phía trước Elarion (cách 12 ô ~ hàng trước địch), to dần 2s rồi nổ TẠI CHỖ:
            //   đối thủ đứng trong vùng nổ: sát thương + choáng 0,5s + mất 1 Orb
            firebolt: { name: 'Hỏa Lôi Cầu', recipe: 'ffb', orbCost: 2, cooldown: 12000, multiplier: 2.0, radius: 3.5, stun: 500, grow: 2000, orbBurn: 1,
                distance: 12, teamOrbs: 1, selfOrbs: 2, impact: 300, lock: 500 },   // nổ: cả đội +1 Orb, riêng Elarion +2
            // Băng Hoại Hỏa Thiên (SolarBeam kiểu Kamehameha): dồn lực 0,7s -> đứng yên chưởng tia băng-hỏa 10s thẳng tới CUỐI BẢN ĐỒ
            //   (ngắm hướng có nhiều đối thủ nhất, lệch tối đa ~26°; người đang bay không dính). Mỗi giây, mọi đối thủ trong tia:
            //   Băng ×iceMultiplier (không tăng) + 1 tầng Hàn Khí + giảm tốc đánh · Hỏa ×fireMultiplier, mỗi giây +1 tầng (+3% sát thương lửa);
            //   đủ 5 tầng: tia lửa to ra (tia rộng hơn), sát thương lửa thêm +30%. Bị choáng / dùng kỹ năng khác thì ngắt
            beams: { name: 'Băng Hoại Hỏa Thiên', recipe: 'iif', orbCost: 3, cooldown: 14000, duration: 10000, every: 1000,
                iceMultiplier: 0.3, fireMultiplier: 0.42, fireRamp: 0.03, fireMax: 5, maxBonus: 0.3,
                slow: 0.15, slowTime: 1500, width: 1.6, widthMax: 2.3, maxAngle: 0.45, impact: 700, lock: 700 },
            // Tốc Lôi: riêng Elarion 10s — mỗi đòn đánh thường chưởng 2 lần, +25% tốc đánh;
            //   cứ 5 đòn -> cả đội (kể cả Elarion) +5% tốc đánh 10s (cộng dồn tối đa 5 lần)
            haste: { name: 'Tốc Lôi', recipe: 'bbf', orbCost: 2, cooldown: 13000, duration: 10000, atkSpeedUp: 0.25, every: 5,
                teamUp: 0.05, teamTime: 10000, teamMax: 5, orbRegen: 2, impact: 300, lock: 500 },
        },
        passives: [
            // Thiên phú 1 — Cộng Hưởng Nguyên Tố: nhặt ngọc -> hệ đó +1 tầng (tối đa 3), 5s, nhặt cùng hệ thì làm mới
            //   Hỏa: +ATK · Băng: hồi % máu mỗi giây · Lôi: +tốc đánh
            { name: 'Cộng Hưởng Nguyên Tố', type: 'elem_attune', talent: 1, maxStacks: 3, duration: 5000,
              levels: { fire: [0.04, 0.05, 0.06], ice: [0.003, 0.004, 0.005], bolt: [0.04, 0.05, 0.06], orb: [0.10, 0.15, 0.20] },
              desc: 'Nhặt ngọc: mỗi tầng Hỏa +{fire%} ATK · Băng hồi {ice%} máu/giây · Lôi +{bolt%} tốc đánh & +{orb%} tốc độ hồi Orb (tối đa 3 tầng mỗi hệ, 5s, nhặt cùng hệ thì làm mới)' },
            // Thiên phú 2 — Thiên Tài Nguyên Tố: mỗi lần ghép phép bằng Sách -> 40% (cấp tối đa 70%) phép kế tiếp giảm 1 Orb
            { name: 'Thiên Tài Nguyên Tố', type: 'elem_genius', talent: 2, discount: 1,
              levels: { value: [0.40, 0.70] },
              desc: 'Mỗi lần ghép phép bằng Sách Nguyên Tố: {value%} phép kế tiếp giảm 1 Orb' },
        ]
    },
    // Golem Nguyên Tố — do Nguyên Tố Hợp Nhất (Elarion) gọi ra 20s. Là nhân vật bình thường trên sân (bị đánh, nhận buff,
    //   tính thắng thua) nhưng không có thẻ HUD, không được hồi sinh. Chỉ số tính theo pháp sư lúc gọi (xem summonGolem).
    //   Cứ 2 đòn đánh thường -> dùng 1 kỹ năng ngẫu nhiên đang sẵn sàng (mỗi kỹ năng hồi 10s); bị choáng lúc niệm thì mất kỹ năng.
    elem_golem: {
        name: 'Golem Nguyên Tố', title: 'Triệu hồi', className: 'Triệu Hồi', emoji: '🗿', color: '#64748b', dmgType: 'magic', summon: true,
        maxHp: 3500, maxMp: 0, pAtk: 0, mAtk: 170, pDef: 240, mDef: 170,
        crit: 50, critDmg: 500, acc: 1000, dodge: 0, pen: 0, block: 100, lifesteal: 0,
        threat: 120, mpAtk: 0, mpSec: 0,
        atkSpeed: 1400, range: 'melee', atkRange: 2.8, moveSpeed: 0.01,
        autoHitFrame: 2, autoImpact: 300,
        skills: [
            // Nộ Lửa: lùi về phía đồng minh -> niệm 1s -> lướt chậm 8 ô đấm lửa: ×1.8 + hất tung 1s, cả đội địch −10% M.DEF 5s
            { name: 'Nộ Lửa', orbCost: 0, cooldown: 10000, castTime: 0, type: 'golem_fist', castRange: 99, backLen: 3, backTime: 500, channel: 1000,
              dashLen: 8, dashTime: 1200, width: 1.8, multiplier: 1.8, knockup: 1000, mDefDown: 0.1, debuffTime: 5000, impact: 0, lock: 2800 },
            // Bão Tuyết: niệm 2s hút khí lạnh -> đứng phun bão tuyết 6s: mỗi giây ×0.5 mọi đối thủ + 1 tầng Hàn Khí
            { name: 'Bão Tuyết', orbCost: 0, cooldown: 10000, castTime: 2000, type: 'golem_blizzard', castRange: 99, ticks: 6, tickGap: 1000,
              tickMultiplier: 0.5, impact: 300, lock: 6300 },
            // Hào Quang Sét: niệm 1s -> sét đánh vào tay: +25% tốc đánh 5s, mỗi đòn đánh giật TOÀN BỘ đối thủ (50% choáng 0,5s)
            { name: 'Hào Quang Sét', orbCost: 0, cooldown: 10000, castTime: 1000, type: 'golem_aura', castRange: 99, duration: 5000,
              atkSpeedUp: 0.25, multiplier: 0.45, stunChance: 0.5, stun: 500, impact: 300, lock: 600 },
        ],
        passives: []
    },
    // Brakk (Cuồng Đấu) — class CHIẾN BINH (đô vật), tộc Dragon: máu trâu, quật / dậm đất / hoá khổng lồ.
    //   Mọi kỹ năng tốn Orb + MÁU (hpCost × máu tối đa, không bao giờ tự làm chết: tối thiểu còn 1 máu)
    wrestler: {
        name: 'Brakk', title: 'Cuồng Đấu', className: 'Chiến Binh', emoji: '🐉', color: '#dc2626', dmgType: 'physical',
        classGroup: 'warrior', race: 'dragon',
        maxHp: 4000, maxMp: 5000, pAtk: 180, mAtk: 0, pDef: 180, mDef: 140,
        crit: 100, critDmg: 500, acc: 1000, dodge: 50, pen: 80, block: 100, lifesteal: 0,
        threat: 100,
        mpAtk: 220, mpSec: 110,
        atkSpeed: 1150, range: 'melee', atkRange: 2.4, moveSpeed: 0.01,
        autoHitFrame: 2,
        autoImpact: 200, // ms: cú đấm chạm (clip attack 0.2s)
        skills: [
            // Bá Vương Quật: túm quái trước mặt (trong 2.6 đơn vị), nhảy vọt lên rồi QUẬT xuống đất ở 1 điểm CỐ ĐỊNH phía trước (4 đơn vị),
            //   Brakk đứng lại chỗ đó. Diễn ~1s (nhảy cao, quật ở 0.85s). Mục tiêu ×1.8 + CHOÁNG 1s; chấn động lúc chạm đất ×1.0 lên mọi quái khác trong 3 đơn vị.
            //   Lúc Khổng Lồ: +30% sát thương, chấn động rộng 4.5 đơn vị
            { name: 'Bá Vương Quật', orbCost: 1, hpCost: 0.04, cooldown: 8000, castTime: 0, type: 'brakk_grab', castRange: 2.6, leap: 4,
              multiplier: 1.8, stun: 1000, aoeMultiplier: 1.0, radius: 3, giantDmgUp: 0.3, giantRadius: 4.5, impact: 850, lock: 1300 },
            // Chấn Địa (niệm 1s): bật CAO rồi DẬM xuống (chạm đất 0.6s) — ×1.4 mọi quái trong 4 đơn vị, HẤT TUNG 1s; Brakk được KHIÊN = 25% máu HIỆN CÓ (10s).
            //   Khiên cộng dồn với khiên thiên phú 1 thành 1 lớp dày hơn, dùng lại thì làm mới 10s.
            //   Lúc Khổng Lồ: quái rơi xuống đất chịu thêm ×0.8
            { name: 'Chấn Địa', orbCost: 2, hpCost: 0.06, cooldown: 12000, castTime: 1000, type: 'brakk_stomp', radius: 4, multiplier: 1.4,
              knockup: 1000, shieldPct: 0.25, shieldTime: 10000, fallMultiplier: 0.8, impact: 600, lock: 1050 },
            // Thần Lực Khổng Lồ (niệm nhanh 0.5s): hoá KHỔNG LỒ 10s — +50% máu tối đa (hồi đúng phần tăng), +40% P.DEF/M.DEF, +25% sát thương;
            //   5 giây đầu MIỄN MỌI HIỆU ỨNG bất lợi (choáng, hất tung, đẩy lùi, khiêu khích...).
            //   Đánh thường ĐẦU TIÊN và cứ sau 3 đòn thường: MÓC NGƯỢC ×1.3 hất tung 0.8s + hất văng 3 đơn vị
            { name: 'Thần Lực Khổng Lồ', orbCost: 3, hpCost: 0.08, cooldown: 25000, castTime: 500, type: 'brakk_giant', duration: 10000,
              hpUp: 0.5, defUp: 0.4, dmgUp: 0.25, ccImmune: 5000, upliftEvery: 3, upliftMultiplier: 1.3, upliftPush: 3, upliftTime: 800,
              impact: 300, lock: 800 },
        ],
        passives: [
            // Thiên phú 1 — Khí Thế Đấu Trường: phe địch dùng đủ 5 chiêu -> Brakk hồi máu (hồi 10s);
            //   phe mình (kể cả Brakk) dùng đủ 5 chiêu -> khiên (hồi 20s, 10s, cộng dồn với khiên Chấn Địa)
            //   Đồng đội (không tính Brakk) tụt dưới 50% máu -> Brakk tự HÉT LỚN khiêu khích TẤT CẢ đối thủ 3s (không gây sát thương, hồi 10s)
            { name: 'Khí Thế Đấu Trường', type: 'brakk_rally', talent: 1, enemyCasts: 5, allyCasts: 5, healCooldown: 10000, shieldCooldown: 20000,
              shieldTime: 10000, shoutThreshold: 0.5, shoutTaunt: 3000, shoutCooldown: 10000,
              levels: { heal: [0.08, 0.10, 0.12], shield: [0.10, 0.12, 0.15] },
              desc: 'Phe địch dùng đủ 5 chiêu -> hồi {heal%} máu (hồi 10s) · phe mình dùng đủ 5 chiêu -> khiên {shield%} máu 10s, cộng dồn khiên Chấn Địa (hồi 20s) · đồng đội dưới 50% máu -> hét lớn khiêu khích TẤT CẢ đối thủ 3s (hồi 10s)' },
            // Thiên phú 2 — Long Huyết Bất Khuất: máu tụt dưới 50% -> Brakk hồi 25% máu, đồng đội hồi 10%, cả đội +1 Orb, GIẢI MỌI HIỆU ỨNG BẤT LỢI (hồi 20s)
            //   Độc Long: đồng đội đã gục hết, chỉ còn 1 mình Brakk trên sân -> sát thương ×2 (loneDmg +100%)
            { name: 'Long Huyết Bất Khuất', type: 'brakk_blood', talent: 2, threshold: 0.5, cooldown: 20000, loneDmg: 1.0,
              levels: { value: [0.25, 0.30], team: [0.10, 0.15], orbs: [1, 2] },
              desc: 'Máu dưới 50%: Brakk hồi {value%} máu, đồng đội hồi {team%}, cả đội +{orbs} Orb và được giải mọi hiệu ứng bất lợi. Hồi 20s · Chỉ còn 1 mình Brakk trên sân: sát thương ×2' },
        ]
    },
    monster_tank: {
        name: 'Tanker', emoji: '🛡️', color: '#eab308',
        maxHp: 6500, maxMp: 1000, pAtk: 200, mAtk: 0, pDef: 320, mDef: 220,
        crit: 60, critDmg: 300, acc: 950, dodge: 50, pen: 50, block: 300, lifesteal: 0,
        threat: 100, mpAtk: 100, mpSec: 50,
        atkSpeed: 1500, range: 'melee', atkRange: 2.4, moveSpeed: 0.01,
        skills: [], passives: []
    },
    monster_archer: {
        name: 'Xạ Thủ', emoji: '🏹', color: '#ef4444',
        maxHp: 4200, maxMp: 1000, pAtk: 290, mAtk: 0, pDef: 120, mDef: 120,
        crit: 180, critDmg: 500, acc: 1100, dodge: 100, pen: 300, block: 50, lifesteal: 0,
        threat: 100, mpAtk: 150, mpSec: 50,
        atkSpeed: 1000, range: 'ranged', atkRange: 15, moveSpeed: 0.01,
        skills: [], passives: []
    },
    monster_supporter: {
        name: 'Hỗ Trợ', emoji: '🪄', color: '#22c55e', dmgType: 'magic',
        maxHp: 4000, maxMp: 1000, pAtk: 0, mAtk: 240, pDef: 140, mDef: 240,
        crit: 100, critDmg: 300, acc: 1000, dodge: 100, pen: 100, block: 50, lifesteal: 0,
        threat: 100, mpAtk: 300, mpSec: 150,
        atkSpeed: 1200, range: 'ranged', atkRange: 10, moveSpeed: 0.01,
        skills: [], passives: []
    },
    monster_dummy: {
        name: 'Cọc Gỗ (Test)', emoji: '🪵', color: '#78350f',
        maxHp: 9999999, maxMp: 1, pAtk: 0, mAtk: 0, pDef: 500, mDef: 500,
        crit: 0, critDmg: 0, acc: 0, dodge: 0, pen: 0, block: 0, lifesteal: 0,
        threat: 0, mpAtk: 0, mpSec: 0,
        atkSpeed: 999999, range: 'melee', atkRange: 1.8, moveSpeed: 0,
        skills: [], passives: []
    }
};

// We will use 1 Assassins if TEST_MODE is active
// Elarion ('elementalist'): đang dùng HÌNH TẠM (chờ tranh — art/elarion/PROMPTS.md)
const SQUAD_ORDER = ['assassin', 'warrior', 'archer', 'priest', 'mage', 'reaper', 'wrestler', 'dancer', 'elementalist'];

// ============================================================
// GAME STATE
// ============================================================
let rooms = {};

// ------------------------------------------------------------
// TỐC ĐỘ TRẬN: x1.0 / x1.5 / x2.0
// Chỉ số trong CLASS_DEFS được chỉnh cho mức x1.5 (BASE_SPEED). Mỗi phòng có "đồng hồ trận" (room.clock, ms)
// chạy nhanh/chậm theo tốc độ: hồi chiêu, tốc đánh, hiệu ứng, di chuyển, hồi mana đều theo đồng hồ này.
// ------------------------------------------------------------
const GAME_SPEEDS = [1, 1.5, 2];
const BASE_SPEED = 1.5;
const DEFAULT_SPEED = 1;
const timeScaleOf = (room) => (room.speed ?? DEFAULT_SPEED) / BASE_SPEED;
let waitingPlayer = null;

/** Thiên phú ĐÃ MỞ của nhân vật (số liệu theo cấp thiên phú). Quái: không có */
function passivesOf(member) {
    return member.passives ?? [];
}
function talentOf(member, type) {
    return passivesOf(member).find(p => p.type === type) ?? null;
}

/** Kỹ năng của nhân vật đã nhân theo cấp kỹ năng (bậc) — dùng thay cho CLASS_DEFS[...].skills */
function skillsOf(member) {
    return member.skills ?? CLASS_DEFS[member.classId]?.skills ?? [];
}

/** Gán chỉ số nền theo level / bậc / tộc lên nhân vật (giữ tỉ lệ máu hiện tại nếu đang trong trận) */
function applyProgress(member, hero) {
    const def = CLASS_DEFS[member.classId];
    const st = P.computeStats(def, hero);
    const hpRatio = member.maxHp ? member.hp / member.maxHp : 1;
    Object.assign(member, st);
    member.hp = Math.max(member.alive === false ? 0 : 1, Math.round(st.maxHp * hpRatio));
    member.level = hero.level; member.rank = hero.rank; member.rankName = P.RANKS[hero.rank].name;
    member.skillLevel = hero.rank + 1;
    member.race = def.race;
    member.skills = P.scaleSkills(def.skills ?? [], hero.rank);
    // Elarion: 10 phép (nhân theo bậc như kỹ năng) — phép đang ghép được chép vào nút KN2
    if (def.spells) member.spells = Object.fromEntries(Object.entries(def.spells).map(([k, sp]) =>
        [k, { ...P.scaleSkills([sp], hero.rank)[0], key: k, type: 'elem_spell', spell: k, castTime: sp.castTime ?? 0, castRange: 99 }]));
    // Thiên phú: chỉ những cái đã mở (Lv20 / Lv40), số liệu theo cấp; chỉ số riêng (Kiên Cường / Sát Ý / Ưng Nhãn) lấy từ thiên phú
    member.passives = P.resolveTalents(def.passives ?? [], hero.level, hero.rank);
    member.talentLevels = P.talentLevels(hero.level, hero.rank);
    for (const k of P.UNIQUE_KEYS) member[k] = 0;
    for (const p of member.passives) if (p.stat) member[p.stat] = p.value;   // thiên phú cấp chỉ số (Kiên Cường, Sát Ý, Ưng Nhãn, Hỏa Tốc)
}

// ------------------------------------------------------------
// QUÁI THEO CẤP: chỉ số Lv1 ở CLASS_DEFS (trâu hơn nhân vật một chút), mỗi cấp tăng theo ĐÚNG tỉ lệ
// tăng trung bình của các nhân vật cùng cấp (kèm bậc tương ứng: Lv21-40 = S, 41-59 = SS, 60 = SSS)
// -> quái luôn mạnh hơn nhân vật cùng cấp một chút, dù nhân vật lên cấp thế nào.
// ------------------------------------------------------------
const MONSTER_SQUAD = [['monster_tank', 25, 0], ['monster_archer', 30, -3], ['monster_supporter', 30, 3]];
const monsterRankFor = (L) => (L >= 60 ? 3 : L > 40 ? 2 : L > 20 ? 1 : 0);
const _mScale = {};
function monsterScale(level) {
    const L = Math.max(1, Math.min(P.MAX_LEVEL, level | 0));
    if (_mScale[L]) return _mScale[L];
    const keys = { maxHp: ['maxHp'], atk: ['pAtk', 'mAtk'], pDef: ['pDef'], mDef: ['mDef'] };
    const out = {};
    for (const [k, list] of Object.entries(keys)) {
        let sum = 0, n = 0;
        for (const id of SQUAD_ORDER) {
            const d = CLASS_DEFS[id];
            const a = P.computeStats(d, { level: 1, rank: 0 }), b = P.computeStats(d, { level: L, rank: monsterRankFor(L) });
            const v0 = Math.max(...list.map(x => a[x] ?? 0)), v1 = Math.max(...list.map(x => b[x] ?? 0));
            if (v0 > 0) { sum += v1 / v0; n++; }
        }
        out[k] = n ? sum / n : 1;
    }
    // thủ tăng chậm hơn (×0.6) để cấp cao không quá lì (công thức giảm sát thương Def/(Def+300))
    out.pDef = 1 + (out.pDef - 1) * 0.6; out.mDef = 1 + (out.mDef - 1) * 0.6;
    out.crit = 1 + (L - 1) * 0.004;   // chí mạng / chính xác / xuyên tăng nhẹ
    return (_mScale[L] = out);
}
function createMonsterSquad(level = 1) {
    const sc = monsterScale(level);
    const rank = monsterRankFor(level);
    return MONSTER_SQUAD.map(([classId, x, z]) => {
        const def = CLASS_DEFS[classId];
        const hp = Math.round(def.maxHp * sc.maxHp);
        return {
            classId, name: def.name, emoji: def.emoji, color: def.color,
            level, rank, rankName: P.RANKS[rank].name,
            hp, maxHp: hp, mp: 0, maxMp: def.maxMp,
            pAtk: Math.round(def.pAtk * sc.atk), mAtk: Math.round(def.mAtk * sc.atk),
            pDef: Math.round(def.pDef * sc.pDef), mDef: Math.round(def.mDef * sc.mDef),
            crit: Math.round(def.crit * sc.crit), critDmg: def.critDmg, acc: Math.round(def.acc * Math.min(1.15, sc.crit)), dodge: def.dodge,
            pen: Math.round(def.pen * sc.crit), block: def.block, lifesteal: def.lifesteal,
            mpAtk: def.mpAtk, mpSec: def.mpSec,
            atkSpeed: def.atkSpeed, atkRange: def.atkRange, range: def.range, moveSpeed: def.moveSpeed,
            alive: true, x, y: 0, z, side: 'right', state: 'moving', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: 0,
            skillCooldowns: [0, 0, 0], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: []
        };
    });
}
/** Chế độ ĐẤU: mọi nhân vật Lv60 SSS */
const MAX_HEROES = () => Object.fromEntries(SQUAD_ORDER.map(id => [id, { level: P.MAX_LEVEL, rank: P.MAX_RANK }]));
/** Đội hình phe quái / phe 2P theo chế độ phòng */
function enemySquadFor(room) {
    if (room.mode === 'duel_hero') return createSquad('right', room.enemyDisabled ?? [], MAX_HEROES());
    return createMonsterSquad(room.mode === 'test' ? (room.monsterLevel ?? 1) : P.MAX_LEVEL);
}
/** Đội hình phe mình theo chế độ phòng */
function mySquadFor(room, p) {
    return createSquad(p.side, p.disabledClasses, room.mode === 'test' ? progressOf(p.progressKey).heroes : MAX_HEROES());
}

function createSquad(side, disabled = [], heroes = null) {
    const startX = side === 'left' ? -30 : 30;
    const direction = side === 'left' ? 1 : -1;

    if (TEST_MODE && side === 'right' && !heroes) return createMonsterSquad(1);

    let order = SQUAD_ORDER.filter(c => !disabled.includes(c));
    if (order.length === 0) order = [SQUAD_ORDER[0]];
    return order.map((classId, index) => {
        const def = CLASS_DEFS[classId];
        // Đội hình: cận chiến đứng trước, đánh xa đứng sau (tầm càng xa đứng càng lùi)
        let xOffset = def.atkRange >= 6 ? -direction * (2 + def.atkRange * 0.5) : index * 0.5 * direction;

        const m = {
            classId, name: def.name, emoji: def.emoji, color: def.color,
            hp: def.maxHp, maxHp: def.maxHp, mp: 0, maxMp: def.maxMp,
            pAtk: def.pAtk, mAtk: def.mAtk, pDef: def.pDef, mDef: def.mDef,
            crit: def.crit, critDmg: def.critDmg, acc: def.acc, dodge: def.dodge, pen: def.pen, block: def.block, lifesteal: def.lifesteal,
            mpAtk: def.mpAtk, mpSec: def.mpSec,
            atkSpeed: def.atkSpeed, atkRange: def.atkRange, range: def.range, moveSpeed: def.moveSpeed,
            alive: true, x: startX + xOffset, y: 0, z: (index - 1.5) * 1.8, side,
            state: 'moving', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: 0,
            skillCooldowns: [0, 0, 0], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: []
        };
        applyProgress(m, heroes?.[classId] ?? { level: 1, rank: 0 });
        m.hp = m.maxHp;
        // Mọi tướng vào trận có sẵn 1,5 Orb; tộc Human — Thích Nghi: cộng thêm MP
        m.mp = START_MP;
        if (P.RACE_DEFS[def.race]?.trait.key === 'human_adapt') m.mp += P.RACE_DEFS[def.race].trait.value;
        m.mp = Math.min(m.maxMp, m.mp);
        return m;
    });
}

// ------------------------------------------------------------
// Tiến trình người chơi (level, bậc, vật phẩm) — lưu theo clientId (trình duyệt), ghi ra data/progress.json
// ------------------------------------------------------------
const PROGRESS = P.loadAll();
const HERO_IDS = () => [...SQUAD_ORDER];   // nhân vật chơi được (không gồm quái, Golem triệu hồi, nhân vật đang làm)

// ------------------------------------------------------------
// CHỌN ĐỘI HÌNH trước trận: 1..MAX_SQUAD nhân vật, nhớ lựa chọn lần trước (lưu trong tiến trình)
// ------------------------------------------------------------
const MAX_SQUAD = 4;
const MODES = ['test', 'duel_monster', 'duel_hero'];
/** Danh sách nhân vật được chọn -> danh sách bị tắt (createSquad dùng) */
function pickToDisabled(pick) {
    const ok = (pick ?? []).filter(c => SQUAD_ORDER.includes(c));
    const sel = ok.length ? ok : SQUAD_ORDER.slice(0, MAX_SQUAD);
    return SQUAD_ORDER.filter(c => !sel.includes(c));
}
function squadSelectPayload(key, mode = 'test') {
    const pr = progressOf(key);
    const duel = mode !== 'test';
    const disabled = pickToDisabled(duel ? pr.duelPick : pr.squadPick);
    const enemyDisabled = pickToDisabled(pr.duelEnemyPick);
    return {
        min: 1, max: MAX_SQUAD, mode, dual: mode === 'duel_hero',
        selected: SQUAD_ORDER.filter(c => !disabled.includes(c)),
        enemySelected: SQUAD_ORDER.filter(c => !enemyDisabled.includes(c)),
        heroes: SQUAD_ORDER.map(id => {
            const def = CLASS_DEFS[id], h = duel ? { level: P.MAX_LEVEL, rank: P.MAX_RANK } : pr.heroes[id];
            const st = P.computeStats(def, h);
            return {
                id, name: def.name, title: def.title, className: def.className, emoji: def.emoji, color: def.color,
                race: P.RACE_DEFS[def.race]?.name ?? '', raceEmoji: P.RACE_DEFS[def.race]?.emoji ?? '',
                level: h.level, rankName: P.RANKS[h.rank].name, rank: h.rank, dmgType: def.dmgType,
                hp: st.maxHp, atk: Math.max(st.pAtk ?? 0, st.mAtk ?? 0), range: def.atkRange,
                skills: def.skills.map(sk => sk.name),
            };
        }),
    };
}
function progressOf(key) {
    const pr = PROGRESS[key] ??= P.defaultProgress(HERO_IDS());
    for (const id of HERO_IDS()) pr.heroes[id] ??= { level: 1, rank: 0, exp: 0 };
    pr.items ??= {};
    return pr;
}
/** Điền số liệu vào mô tả thiên phú: {value%} (tỉ lệ ×100) · {value‰} (phần nghìn -> %) · {key} (số thường) */
function fillTalentDesc(desc, r) {
    return (desc ?? '').replace(/\{(\w+)(%|‰)?\}/g, (_, k, u) => {
        const v = r[k];
        if (v == null) return '?';
        if (u === '%') return `${Math.round(v * 100)}%`;
        if (u === '‰') return `${+(v / 10).toFixed(1)}%`;
        return `×${v}`;
    });
}
/** Thông tin 2 thiên phú cho tool / HUD: đã mở chưa, cấp hiện tại / tối đa, mô tả theo cấp (chưa mở thì xem cấp 1) */
function talentInfo(def, h) {
    const lv = P.talentLevels(h.level, h.rank);
    return (def.passives ?? []).filter(p => p.talent && !p.hidden).map(p => {
        const l = lv[p.talent] || 0;
        const r = { ...p };
        for (const [k, arr] of Object.entries(p.levels ?? {})) r[k] = arr[Math.max(1, Math.min(l || 1, arr.length)) - 1];
        return { slot: p.talent, name: p.name, level: l, max: P.TALENT_MAX[p.talent], unlockAt: P.TALENT_UNLOCK[p.talent], desc: fillTalentDesc(p.desc, r) };
    });
}

/** Gói gửi cho client: tiến trình + chỉ số xem trước của từng nhân vật + bảng tra (bậc, tộc, class, vật phẩm) */
function progressPayload(key) {
    const pr = progressOf(key);
    const heroes = {};
    for (const id of HERO_IDS()) {
        const def = CLASS_DEFS[id], h = pr.heroes[id];
        const g = P.CLASS_GROWTH[def.classGroup];
        heroes[id] = {
            ...h, name: def.name, title: def.title, rankName: P.RANKS[h.rank].name, skillLevel: h.rank + 1, cap: P.RANKS[h.rank].cap,
            expNext: P.expToNext(h.level), stats: P.computeStats(def, h),
            race: def.race, classGroup: def.classGroup,
            talents: talentInfo(def, h),
            rankCheck: P.checkRankUp(h, pr.items),
        };
    }
    return { heroes, items: pr.items, meta: { ranks: P.RANKS, races: P.RACE_DEFS, classes: P.CLASS_GROWTH, itemDefs: P.ITEMS, maxLevel: P.MAX_LEVEL } };
}

// ============================================================
// EFFECTIVE STATS ENGINE (Buff/Debuff applied dynamically)
// ============================================================
function getEffectiveStats(member, now) {
    const def = CLASS_DEFS[member.classId];
    const stats = {
        pAtk: member.pAtk,
        mAtk: member.mAtk,
        pDef: member.pDef,
        mDef: member.mDef,
        crit: member.crit,
        critDmg: member.critDmg,
        acc: member.acc,
        dodge: member.dodge,
        pen: member.pen,
        block: member.block,
        atkSpeed: member.atkSpeed,
        moveSpeed: member.moveSpeed,
        mpAtk: member.mpAtk,
        threat: def?.threat ?? 100,
        lifesteal: member.lifesteal ?? 0,
    };
    for (const k of P.UNIQUE_KEYS) stats[k] = member[k] ?? 0;
    // Thiên phú 2 có điều kiện: Kiên Cường chỉ có tác dụng khi đang BẬT (sau 10 đòn), Sát Ý chỉ khi đang trong 10s bật
    const tal = passivesOf(member);
    const on = (type) => member.statusEffects?.some(ef => ef.type === type && ef.endTime > now);
    if (tal.some(p => p.type === 'tenacity_trigger') && !on('tenacity_on')) stats.tenacity = 0;
    if (tal.some(p => p.type === 'kill_intent_trigger') && !on('kill_intent')) stats.killIntent = 0;
    // Thiên phú Thiên Hỏa Song Tinh: +M.ATK cố định
    const twin = tal.find(p => p.type === 'twin_meteor');
    if (twin) stats.mAtk = Math.floor(stats.mAtk * (1 + (twin.mAtkUp ?? 0)));

    // Chỉ số NỀN của nhân vật (đã gồm level / bậc / tộc, chưa có buff trong trận) để HUD so sánh
    const base = { ...stats };
    for (const k of P.UNIQUE_KEYS) base[k] = member[k] ?? 0; // HUD: giá trị chỉ số riêng (kể cả khi chưa bật)

    // Apply status effects
    member.statusEffects.forEach(ef => {
        if (now >= ef.endTime) return; // expired

        if (ef.type === 'seal') {
            // Ấn: -15% P.DEF
            stats.pDef = Math.floor(stats.pDef * 0.85);
        }
        if (ef.type === 'taunted' && ef.defDown) {
            // Sư Tử Gầm: bị khiếp sợ -> giảm thủ
            stats.pDef = Math.floor(stats.pDef * (1 - ef.defDown));
            stats.mDef = Math.floor(stats.mDef * (1 - ef.defDown));
        }
        if (ef.type === 'fire_god') {
            // Hỏa Thần Giáng Lâm: +M.ATK; thiên phú Hỏa Tốc: +tốc đánh
            stats.mAtk = Math.floor(stats.mAtk * (1 + (ef.mAtkUp ?? 0)));
            stats.mDef = Math.floor(stats.mDef * (1 + (ef.mDefUp ?? 0)));   // Khiên Lửa
            if (member.fireHaste) stats.atkSpeed = Math.floor(stats.atkSpeed / (1 + member.fireHaste / 1000));
        }
        if (ef.type === 'water_god') {
            // Thủy Thần Vũ (Nerissa): +ATK cả đội (máu tối đa cộng thẳng vào maxHp)
            stats.pAtk = Math.floor(stats.pAtk * (1 + (ef.atkUp ?? 0)));
            stats.mAtk = Math.floor(stats.mAtk * (1 + (ef.atkUp ?? 0)));
        }
        if (ef.type === 'note_break') stats.mDef = Math.floor(stats.mDef * (1 - (ef.value ?? 0)));     // nốt nhạc: −M.DEF
        // Elarion: Cộng Hưởng Hỏa (+ATK) / Lôi (+tốc đánh) · Lôi Xích & Nộ Lửa (−M.DEF) · Băng Phong & Bão Tuyết (−tốc đánh) · Tốc Lôi
        if (ef.type === 'attune_fire') { const k = 1 + (ef.per ?? 0) * (ef.stacks ?? 0); stats.pAtk = Math.floor(stats.pAtk * k); stats.mAtk = Math.floor(stats.mAtk * k); }
        if (ef.type === 'attune_bolt') stats.atkSpeed = Math.floor(stats.atkSpeed / (1 + (ef.per ?? 0) * (ef.stacks ?? 0)));
        if (ef.type === 'chain_break' || ef.type === 'golem_break') stats.mDef = Math.floor(stats.mDef * (1 - (ef.value ?? 0)));
        if (ef.type === 'frost_slow' || ef.type === 'beam_slow') stats.atkSpeed = Math.floor(stats.atkSpeed * (1 + (ef.value ?? 0)));
        if (ef.type === 'frost_stack') stats.atkSpeed = Math.floor(stats.atkSpeed * (1 + (ef.per ?? 0) * (ef.stacks ?? 0)));
        if (ef.type === 'storm_haste') stats.atkSpeed = Math.floor(stats.atkSpeed / (1 + (ef.value ?? 0) * (ef.stacks ?? 1)));   // Tốc Lôi: cả đội (cộng dồn)
        if (ef.type === 'storm_self' || ef.type === 'golem_haste') stats.atkSpeed = Math.floor(stats.atkSpeed / (1 + (ef.value ?? 0)));
        if (ef.type === 'chill') stats.atkSpeed = Math.floor(stats.atkSpeed * (1 + (ef.per ?? 0) * (ef.stacks ?? 0)));   // Hàn Khí
        if (ef.type === 'tide_haste') stats.atkSpeed = Math.floor(stats.atkSpeed / (1 + (ef.value ?? 0)));   // Hòa Âm 1+3: phe ta nhanh hơn
        if (ef.type === 'tide_slow') stats.atkSpeed = Math.floor(stats.atkSpeed * (1 + (ef.value ?? 0)));    // Hòa Âm 1+3: phe địch chậm lại
        if (ef.type === 'fire_ward' && ef.hp > 0) {
            // Giáp Lửa (thiên phú 2 Ignar): +M.DEF khi còn khiên
            stats.mDef = Math.floor(stats.mDef * (1 + (ef.mDefUp ?? 0)));
        }
        if (ef.type === 'giant_form') {
            // Thần Lực Khổng Lồ (Brakk): +P.DEF/M.DEF (sát thương +25% tính ở calculateDamage, máu tối đa cộng thẳng vào maxHp)
            stats.pDef = Math.floor(stats.pDef * (1 + (ef.defUp ?? 0)));
            stats.mDef = Math.floor(stats.mDef * (1 + (ef.defUp ?? 0)));
        }
        if (ef.type === 'reaper_form') {
            // Đêm Tử Thần: +tốc đánh (sát thương +20% tính ở calculateDamage)
            stats.atkSpeed = Math.floor(stats.atkSpeed / (1 + (ef.atkSpeedUp ?? 0)));
        }
        if (ef.type === 'mdef_break' && ef.stacks) {
            // Cột Lửa Phá Ma: giảm M.DEF theo số lần trúng
            stats.mDef = Math.floor(stats.mDef * (1 - Math.min(ef.maxStacks ?? 5, ef.stacks) * (ef.per ?? 0.05)));
        }
        if (ef.type === 'windspirit') {
            // Thần Phong Giáng Thế: +tốc đánh, +P.ATK
            stats.atkSpeed = Math.floor(stats.atkSpeed / (1 + (ef.atkSpeedUp ?? 0.3)));
            stats.pAtk = Math.floor(stats.pAtk * (1 + (ef.atkUp ?? 0.2)));
            stats.crit += ef.critUp ?? 0;
            stats.critDmg += ef.critDmgUp ?? 0;
        }
        if (ef.type === 'thunder_blessing') {
            // Sấm phù trợ (Tàng Hình của Sát Thủ): đồng đội +né tránh
            stats.dodge += ef.dodgeUp ?? 0;
        }
        if (ef.type === 'wind_blessing') {
            // Gió phù trợ (Thần Phong Giáng Thế của Xạ Thủ): cả đội +chính xác
            stats.acc += ef.accUp ?? 0;
        }
        if (ef.type === 'pray_blessing' && ef.defUp) {
            // Thánh Niệm + Ân Điển: cả đội +thủ
            stats.pDef = Math.floor(stats.pDef * (1 + ef.defUp));
            stats.mDef = Math.floor(stats.mDef * (1 + ef.defUp));
        }
        if (ef.type === 'holy_shield' && (ef.hp > 0 || ef.dormant) && ef.defUp) {
            // Khiên cánh (lúc niệm): +thủ
            stats.pDef = Math.floor(stats.pDef * (1 + ef.defUp));
            stats.mDef = Math.floor(stats.mDef * (1 + ef.defUp));
        }
        if (ef.type === 'guard_aura') {
            // Dựng Khiên của Chiến Binh: cả đội cứng hơn
            stats.pDef = Math.floor(stats.pDef * (1 + (ef.value ?? 0.2)));
            stats.mDef = Math.floor(stats.mDef * (1 + (ef.value ?? 0.2)));
        }
        if (ef.type === 'fortress') {
            // Thành Trì: cả đội cứng cáp hơn (giảm sát thương tính ở calculateDamage)
        }
        if (ef.type === 'stealth') {
            // Tàng hình: +20% P.ATK, +10% tốc đánh (chỉ trúng đòn diện rộng — xem calculateDamage)
            stats.pAtk = Math.floor(stats.pAtk * 1.2);
            stats.atkSpeed = Math.floor(stats.atkSpeed * 0.9);
        }
    });

    // Ý Chí Thép (Rok + người được nối dây): máu thấp -> tăng chặn đòn (Rok còn dây: ×2)
    const iw = ironWillOf(member);
    if (iw && member.maxHp > 0 && member.hp / member.maxHp < iw.t.threshold) stats.block += iw.t.value * iw.mult;
    // Kiên Cường đang bật (Rok hoặc người được nối dây): giá trị lưu trên hiệu ứng (Rok còn dây: ×2)
    const tenOn = member.statusEffects.find(ef => ef.type === 'tenacity_on' && ef.endTime > now && ef.value != null);
    if (tenOn) stats.tenacity = tenOn.value;
    stats.tenacityCap = Math.max(P.STAT_CAPS.tenacity.cap, tenOn?.cap ?? 0);

    // GIỚI HẠN TRÊN: phần vượt chuyển sang chỉ số khác (chí mạng dư -> sát thương chí mạng, né dư -> chính xác, chặn dư -> Kiên Cường)
    for (const [k, c] of Object.entries(P.STAT_CAPS)) {
        if ((stats[k] ?? 0) > c.cap) {
            if (c.overflow) stats[c.overflow] = (stats[c.overflow] ?? 0) + (stats[k] - c.cap);
            stats[k] = c.cap;
        }
    }
    if (stats.tenacity > stats.tenacityCap) stats.tenacity = stats.tenacityCap;
    return { stats, base };
}

/** Thời gian khống chế sau khi trừ Kiên Cường của mục tiêu */
function ccTime(target, ms, now) {
    if (ccImmune(target, now)) return 0;   // Thần Lực Khổng Lồ: 5 giây đầu miễn khống chế
    const st = getEffectiveStats(target, now).stats;
    const ten = Math.min(st.tenacityCap ?? P.STAT_CAPS.tenacity.cap, st.tenacity ?? 0);
    const holy = target.statusEffects?.find(ef => ef.type === 'holy_shield' && ef.endTime > now && (ef.hp > 0 || ef.dormant) && ef.ccResist);
    const fire = target.statusEffects?.find(ef => ef.type === 'fire_god' && ef.endTime > now && ef.ccResist);   // Khiên Lửa
    const night = target.statusEffects?.find(ef => ef.type === 'reaper_form' && ef.endTime > now && ef.ccResist); // Đêm Tử Thần
    const ward = target.statusEffects?.find(ef => ef.type === 'fire_ward' && ef.endTime > now && ef.hp > 0 && ef.ccResist); // Giáp Lửa
    const wgod = target.statusEffects?.find(ef => ef.type === 'water_god' && ef.endTime > now && ef.ccResist);     // Thủy Thần Vũ
    return Math.round(ms * (1 - ten / 1000) * (1 - (holy?.ccResist ?? 0)) * (1 - (fire?.ccResist ?? 0)) * (1 - (night?.ccResist ?? 0)) * (1 - (ward?.ccResist ?? 0)) * (1 - Math.min(1, wgod?.ccResist ?? 0)));
}

// ============================================================
// COMBAT PIPELINE (Base -> Crit -> Block -> Mitigation -> Final)
// ============================================================
/** Kẻ tấn công đứng SAU LƯNG mục tiêu? (mục tiêu luôn quay mặt về phía phe địch) */
function isBehind(attacker, target) {
    return target.side === 'right' ? attacker.x > target.x : attacker.x < target.x;
}

// ============================================================
// KHIÊN — luật chung cho mọi loại khiên (Dựng Khiên của Chiến Binh, Khiên Ánh Sáng của Tu Sĩ, sau này thêm...)
//   · Mỗi người chỉ có 1 khiên HỨNG SÁT THƯƠNG. Được thêm khiên khi đang có khiên -> giữ khiên NHIỀU MÁU HƠN,
//     khiên còn lại thành "dormant": mất máu khiên nhưng VẪN giữ hiệu ứng buff (vd +thủ, kháng choáng, cánh miễn choáng) tới hết thời gian.
//   · Khiên ĐẶC TRƯNG (signature, vd Dựng Khiên của Chiến Binh) luôn được dùng, bất kể máu khiên khác nhiều hơn.
// ============================================================
const SHIELD_TYPES = new Set(['guard', 'holy_shield', 'brakk_shield', 'fire_ward', 'water_shield', 'storm_ward']);
const isSignatureShield = (ef) => ef.type === 'guard';

/** Khiên đang hứng sát thương (null nếu không có) */
function activeShield(target, now) {
    let best = null;
    for (const ef of target.statusEffects ?? []) {
        if (!SHIELD_TYPES.has(ef.type) || ef.dormant || !(ef.hp > 0) || ef.endTime <= now) continue;
        if (!best || (isSignatureShield(ef) && !isSignatureShield(best)) || (isSignatureShield(ef) === isSignatureShield(best) && ef.hp > best.hp)) best = ef;
    }
    return best;
}

/** Cho mục tiêu thêm 1 khiên theo luật trên. Trả về true nếu khiên mới là khiên hứng sát thương. */
function addShield(target, ef, now) {
    const makeDormant = (e) => { e.dormant = true; e.hp = 0; };
    // dọn khiên cùng loại đã hết hạn / đã vỡ mà không còn buff
    target.statusEffects = target.statusEffects.filter(e => !(e.type === ef.type && (e.endTime <= now || (!e.dormant && !(e.hp > 0)))));
    const cur = activeShield(target, now);
    let wins;
    if (!cur) wins = true;
    else if (isSignatureShield(ef) && !isSignatureShield(cur)) wins = true;
    else if (isSignatureShield(cur) && !isSignatureShield(ef)) wins = false;
    else wins = ef.hp > cur.hp;
    if (wins && cur) makeDormant(cur);
    if (!wins) makeDormant(ef);
    target.statusEffects.push(ef);
    return wins;
}


/** Cộng thêm tỉ lệ chí mạng từ nội tại (‰) */
function passiveCritBonus(attacker, target, now) {
    let bonus = 0;
    for (const p of passivesOf(attacker)) {
        if (p.type !== 'backstab_crit') continue;
        const stealthed = attacker.statusEffects?.some(ef => ef.type === 'stealth' && ef.endTime > now);
        if (stealthed || isBehind(attacker, target)) bonus += p.value * 1000;
    }
    return bonus;
}

function calculateDamage(attacker, target, skillMultiplier = 1.0, now, opts = {}) {
    const atkEff = getEffectiveStats(attacker, now).stats;
    const tgtEff = getEffectiveStats(target, now).stats;

    // 1. DETERMINE TYPE (Physical vs Magical)
    // Loại sát thương: theo kỹ năng (opts.dmgType) hoặc theo class (dmgType), mặc định VẬT LÝ
    const isMagical = (opts.dmgType ?? CLASS_DEFS[attacker.classId]?.dmgType) === 'magic';
    // Kỹ năng đánh DƯỚI ĐẤT (ground) không trúng mục tiêu đang bay (VD Lyra khi có Vệ Thần Gió)
    if (opts.ground && isAirborne(target, now)) return { damage: 0, isMiss: true, isBlock: false, isCrit: false, isMagic: isMagical };
    // Đang bị Thần Chết phán quyết (trên không) / vừa hồi sinh (Thiên Thần Hộ Mệnh, 2s): miễn mọi sát thương
    if (isJudged(target, now) || hasReviveGuard(target, now)) return { damage: 0, isMiss: true, isBlock: false, isCrit: false, isMagic: isMagical, immune: true };
    // TÀNG HÌNH (mọi kỹ năng tàng hình): chỉ trúng đòn DIỆN RỘNG (AOE); đòn đơn mục tiêu trượt
    if (!opts.aoe && isStealthed(target, now)) return { damage: 0, isMiss: true, isBlock: false, isCrit: false, isMagic: isMagical, stealthMiss: true };
    // Hơi Nước Bỏng (Elarion): kẻ đứng trong mây đánh trượt thêm
    const blind = attacker.statusEffects?.find(ef => ef.type === 'steam_blind' && ef.endTime > now);
    if (blind && Math.random() < (blind.value ?? 0)) return { damage: 0, isMiss: true, isBlock: false, isCrit: false, isMagic: isMagical, blinded: true };
    const activeAtk = isMagical ? atkEff.mAtk : atkEff.pAtk;
    const activeDef = isMagical ? tgtEff.mDef : tgtEff.pDef;

    // 2. HIT/DODGE CHECK
    // Né thật = né của mục tiêu trừ phần CHÍNH XÁC VƯỢT 100% của kẻ tấn công
    // (VD: Sát Thủ né 20% gặp Xạ Thủ chính xác 110% -> còn 10%; gặp quái chính xác 90% -> giữ 20%)
    const dodgeChance = Math.max(0, tgtEff.dodge - Math.max(0, atkEff.acc - 1000)) / 1000;
    if (Math.random() < dodgeChance) {
        // Tộc Elf — Linh Mẫn: né được đòn -> đòn đánh kế tiếp mạnh hơn
        if (raceTrait(target)?.key === 'elf_agile') target.elfReady = true;
        return { damage: 0, isMiss: true, isBlock: false, isCrit: false, isMagic: isMagical };
    }
    // Giáp Băng Sét (Elarion): đánh trúng -> bị sét giật lại
    if (!opts.noCounter && attacker !== target) wardCounter(attacker, target, now);

    // 3. BASE DAMAGE CALCULATION
    let damage = activeAtk * skillMultiplier;

    // 4. CRITICAL STRIKE CHECK
    // Chí mạng: nhân (1.5 + Crit DMG). VD Crit DMG 50% -> x2.0
    const critChance = (atkEff.crit + passiveCritBonus(attacker, target, now)) / 1000;
    let isCrit = false;
    if (opts.forceCrit || Math.random() < critChance) {
        isCrit = true;
        let critMult = CRIT_BASE + (atkEff.critDmg / 1000);
        // Tộc Dragon — Vảy Rồng: phần sát thương chí mạng nhận vào giảm 25%
        const scale = raceTrait(target)?.key === 'dragon_scale' ? raceTrait(target).value : 0;
        if (scale) critMult = 1 + (critMult - 1) * (1 - scale);
        damage *= critMult;
    }

    // Thiên phú Sát Ý: đánh trúng quái dưới 50% máu (và không đang hồi) -> bật; đòn kích hoạt cũng được cộng
    const kiT = talentOf(attacker, 'kill_intent_trigger');
    let killIntent = 0;   // Sát Ý: chỉ 1 đòn
    if (kiT && target.maxHp > 0 && target.hp / target.maxHp < 0.5 && now >= (attacker.killIntentReadyAt ?? 0)) {
        killIntent = attacker.killIntent ?? 0;
        attacker.killIntentReadyAt = now + kiT.cooldown;
        attacker.statusEffects.push({ type: 'kill_intent', endTime: now + 600, duration: 600 });   // loé biểu tượng trên HUD
    }
    // ---- Chỉ số riêng của class (người đánh) ----
    if (killIntent) damage *= 1 + killIntent / 1000;   // Sát Ý (1 đòn)
    if (atkEff.hawkEye && opts.isSkill && !opts.noHawk) {                                                                  // Ưng Nhãn: chỉ kỹ năng 1-2-3
        const d = Math.hypot(target.x - attacker.x, (target.z || 0) - (attacker.z || 0));
        damage *= 1 + (atkEff.hawkEye / 1000) * Math.min(1, d / 17);
    }
    if (atkEff.spellAmp && opts.isSkill) damage *= 1 + atkEff.spellAmp / 1000;                                             // Cộng Hưởng Phép
    // ---- Đặc tính tộc (người đánh) ----
    const at = raceTrait(attacker);
    if (at?.key === 'elf_agile' && attacker.elfReady) { damage *= 1 + at.value; attacker.elfReady = false; }
    if (at?.key === 'devil_pact' && attacker.maxHp > 0 && attacker.hp / attacker.maxHp < 0.3) damage *= 1 + at.value;
    if (at?.key === 'goblin_opportunist' && target.statusEffects?.some(ef => (ef.type === 'stun' || ef.type === 'knocked') && ef.endTime > now)) damage *= 1 + at.value;

    // 5. BLOCK CHECK (Only if not Crit)
    let isBlock = false;
    if (!isCrit && !opts.noBlock) {
        const blockChance = tgtEff.block / 1000;
        if (Math.random() < blockChance) {
            isBlock = true;
            damage *= 0.5; // Block reduces damage by 50%
        }
    }

    // 6. ARMOR/DEFENSE MITIGATION
    const arrowPen = talentOf(attacker, 'wind_pierce')?.pen ?? 0;   // Phong Tiễn: mọi mũi tên xuyên giáp
    const penetration = Math.min(1, atkEff.pen / 1000 + arrowPen + (opts.penBonus ?? 0));
    const effectiveDef = activeDef * (1 - penetration);
    const mitigation = effectiveDef / (effectiveDef + 300); // DR Formula: Def / (Def + K)
    
    // 7. FINAL DAMAGE PIPELINE
    // Thành Trì: giảm sát thương nhận
    const fort = target.statusEffects?.find(ef => ef.type === 'fortress' && ef.endTime > now);
    if (fort) damage *= 1 - (fort.reduce ?? 0.3);
    // Thánh Niệm: đồng đội của Tu Sĩ +sát thương (vật lý hay phép theo từng người)
    const bless = attacker.statusEffects?.find(ef => ef.type === 'pray_blessing' && ef.endTime > now);
    if (bless) damage *= 1 + (bless.dmgUp ?? 0);
    // Đêm Tử Thần (Zerith): +sát thương
    const night = reaperForm(attacker, now);
    if (night) damage *= 1 + (night.dmgUp ?? 0);
    // Nốt nhạc của Nerissa: +sát thương PHÉP
    if (isMagical) { const amp = attacker.statusEffects?.find(ef => ef.type === 'note_amp' && ef.endTime > now); if (amp) damage *= 1 + (amp.value ?? 0); }
    // Thần Lực Khổng Lồ (Brakk): +sát thương
    const giant = giantForm(attacker, now);
    if (giant) damage *= 1 + (giant.dmgUp ?? 0);
    // Độc Long (Brakk chỉ còn 1 mình trên sân): sát thương ×2
    const lone = attacker.statusEffects?.find(ef => ef.type === 'lone_dragon' && ef.endTime > now);
    if (lone) damage *= 1 + (lone.value ?? 1);
    // Kiên Cường (Chiến Binh): giảm sát thương nhận
    if (tgtEff.tenacity) damage *= 1 - Math.min(tgtEff.tenacityCap ?? P.STAT_CAPS.tenacity.cap, tgtEff.tenacity) / 1000;

    let finalDamage = Math.max(1, Math.floor(damage * (1 - mitigation)));
    // Kiên Cường (Rok, thiên phú 2): người được Rok nối dây chỉ nhận phần còn lại — Rok gánh `share` sát thương thay
    let shared = 0;
    const guard = linkGuardOf(target);
    if (guard && finalDamage > 1) {
        shared = Math.floor(finalDamage * guard.share);
        finalDamage -= shared;
        later(opts.delay ?? 0, () => shareToRok(guard.rok, shared, target));
    }

    // KHIÊN: chỉ 1 khiên hứng sát thương (khiên nhiều máu hơn / khiên đặc trưng như Dựng Khiên của Chiến Binh).
    // Khiên yếu hơn chỉ còn hiệu ứng buff (dormant), không hứng sát thương.
    // Phán Quyết Tử Thần: đòn của Zerith lên mục tiêu có Ấn Tử của mình -> phá sạch khiên trước khi tính
    //   -> CHỈ Lưỡi Hái Hất Hồn (kỹ năng 2) lúc Đêm Tử Thần (kỹ năng 3) mới phá (opts.breakShield)
    if (opts.breakShield && deathMarkOf(attacker, target, now)) wipeShields(target, now);
    const shield = activeShield(target, now);
    if (shield) {
        const absorbed = Math.min(shield.hp, finalDamage);
        shield.hp -= absorbed;
        if (shield.type === 'guard') shield.absorbed += absorbed;
        const rest = finalDamage - absorbed;
        return { damage: rest, absorbed, isMiss: false, isBlock: rest === 0 || isBlock, isCrit, isMagic: isMagical, guarded: shield.type === 'guard', shared };
    }

    return { damage: finalDamage, isMiss: false, isBlock, isCrit, isMagic: isMagical, shared };
}

/** Đặc tính tộc của nhân vật (null với quái) */
function raceTrait(m) {
    return P.RACE_DEFS[CLASS_DEFS[m.classId]?.race]?.trait ?? null;
}

/** Đang bay (Thần Phong Giáng Thế) -> né kỹ năng đánh dưới đất */
function isAirborne(m, now) {
    return m.statusEffects?.some(ef => (ef.type === 'windspirit' || ef.type === 'praying' || ef.type === 'reaper_form') && ef.endTime > now);
}

/** Tầm đánh hiện tại (Thần Phong Giáng Thế cộng thêm tầm) */
function attackRangeOf(m, now) {
    const w = m.statusEffects?.find(ef => ef.type === 'windspirit' && ef.endTime > now);
    return m.atkRange + (w?.rangeUp ?? 0);
}

/** Đang tàng hình (Tàng Hình của Jessica, Bóng Ẩn của thiên phú Đánh Lén, sau này các kỹ năng tàng hình khác) */
function isStealthed(m, now) {
    return !!m.statusEffects?.some(ef => ef.type === 'stealth' && ef.endTime > now);
}
function canBeTargeted(m, now) {
    if (!m.alive) return false;
    if (isJudged(m, now)) return false;   // đang bị Thần Chết nhấc lên không trung
    if (m.hp - (m.pendingDmg || 0) <= 0 && !reaperForm(m, now)) return false; // đã trúng đòn chí tử đang bay tới -> bỏ qua, đánh con khác (Đêm Tử Thần: không chết)
    const stealthInfo = m.statusEffects.find(ef => ef.type === 'stealth');
    return !(stealthInfo && stealthInfo.endTime > now);
}

function findLowestHpTarget(enemySquad, now) {
    const alive = enemySquad.filter(m => canBeTargeted(m, now));
    if (alive.length === 0) return null;

    if (Math.random() < 0.05) {
        // 5% chance to aim at any random targetable enemy
        return alive[Math.floor(Math.random() * alive.length)];
    }

    let lowestHp = Math.min(...alive.map(m => m.hp));
    const lowestHpEnemies = alive.filter(m => m.hp === lowestHp);
    
    // Pick a random one from the lowest HP enemies
    return lowestHpEnemies[Math.floor(Math.random() * lowestHpEnemies.length)];
}

// ------------------------------------------------------------
// CHỌN MỤC TIÊU: ưu tiên quái / tướng TRONG TẦM ĐÁNH, gần nhất trước.
//   - Mục tiêu đang đánh còn trong tầm -> giữ nguyên (không đổi lung tung).
//   - Không ai trong tầm -> chạy tới con GẦN NHẤT (giữ mục tiêu cũ nếu nó chỉ xa hơn < TARGET_STICKY đơn vị).
//   - Khiêu khích của mọi nhân vật như nhau; chỉ HIỆU ỨNG (Sư Tử Gầm...) mới ép phải đánh 1 người (xử lý trong vòng lặp trận).
// ------------------------------------------------------------
const TARGET_STICKY = 1.5;
function findBestTarget(attacker, enemySquad, now, current = null) {
    const alive = enemySquad.filter(m => canBeTargeted(m, now));
    if (alive.length === 0) return null;
    const dist = (m) => Math.hypot(attacker.x - m.x, (attacker.z || 0) - (m.z || 0));
    const range = (attacker.atkRange != null ? attackRangeOf(attacker, now) : 2.4) + 0.3;
    const keep = current && alive.includes(current) ? current : null;
    if (keep && dist(keep) <= range) return keep;
    let best = alive[0];
    alive.forEach(m => { if (dist(m) < dist(best)) best = m; });
    if (keep && keep !== best && dist(best) > range && dist(keep) <= dist(best) + TARGET_STICKY) return keep;
    return best;
}

// ============================================================
// GIỚI HẠN ĐẤU TRƯỜNG
// ============================================================
const ARENA_BOUNDS = { minX: -48, maxX: 48, minZ: -13, maxZ: 13 };

function clampToArena(member) {
    member.x = Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, member.x));
    member.z = Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, member.z));
}

// ============================================================
// SOCKET HANDLING
// ============================================================
io.on('connection', (socket) => {
    console.log(`[CONNECTION] New client connected: ${socket.id}`);
    // Mã người chơi cố định theo trình duyệt (client gửi kèm khi kết nối) -> giữ level / bậc / vật phẩm
    const cid = String(socket.handshake.auth?.clientId ?? '').slice(0, 64);
    socket.progressKey = /^[\w-]{6,64}$/.test(cid) ? cid : socket.id;
    socket.emit('progressUpdate', progressPayload(socket.progressKey));

    // ---------- TIẾN TRÌNH (luồng thật, ngoài trận): dùng vật phẩm EXP, kiểm tra & đột phá bậc ----------
    const afterProgress = (classId) => {
        P.saveAll(PROGRESS);
        const room = rooms[socket.roomId];
        const player = room?.players[socket.id];
        if (player) {
            // áp ngay chỉ số mới lên nhân vật đang trong trận (giữ tỉ lệ máu)
            player.squad.forEach(m => { if (!classId || m.classId === classId) applyProgress(m, progressOf(socket.progressKey).heroes[m.classId]); });
            broadcastState(socket.roomId);
        }
        socket.emit('progressUpdate', progressPayload(socket.progressKey));
    };
    socket.on('useItem', ({ classId, itemId, count = 1 } = {}) => {
        const pr = progressOf(socket.progressKey);
        const hero = pr.heroes[classId], item = P.ITEMS[itemId];
        if (!hero || !item?.exp) return;
        const n = Math.max(1, Math.min(99, count | 0));
        if ((pr.items[itemId] ?? 0) < n) return socket.emit('progressMsg', { ok: false, text: `Không đủ ${item.name}` });
        if (hero.level >= P.RANKS[hero.rank].cap) return socket.emit('progressMsg', { ok: false, text: hero.rank >= P.MAX_RANK
            ? `${CLASS_DEFS[classId].name} đã đạt level tối đa` : `${CLASS_DEFS[classId].name} đã đầy EXP ở Lv${hero.level} — cần đột phá lên bậc ${P.RANKS[hero.rank + 1].name} trước` });
        pr.items[itemId] -= n;
        const up = P.addExp(hero, item.exp * n);
        socket.emit('progressMsg', { ok: true, text: `${CLASS_DEFS[classId].name} +${item.exp * n} EXP${up ? ` · lên ${up} level` : ''}` });
        afterProgress(classId);
    });
    socket.on('rankUp', ({ classId } = {}) => {
        const pr = progressOf(socket.progressKey);
        const hero = pr.heroes[classId];
        if (!hero) return;
        const r = P.rankUp(hero, pr.items);
        socket.emit('progressMsg', r.ok
            ? { ok: true, text: `${CLASS_DEFS[classId].name} đột phá lên bậc ${r.rank}! Kỹ năng lên Lv${hero.rank + 1}` }
            : { ok: false, text: `Chưa đủ điều kiện: ${r.missing.join(' · ')}` });
        afterProgress(classId);
    });
    // ---------- BẢNG TOOL TEST: chỉnh thẳng, không cần điều kiện ----------
    socket.on('debugProgress', (data = {}) => {
        if (rooms[socket.roomId]?.mode && rooms[socket.roomId].mode !== 'test') return;   // ĐẤU: không có tool
        const pr = progressOf(socket.progressKey);
        const ids = data.classId === 'all' ? HERO_IDS() : [data.classId];
        for (const id of ids) {
            const h = pr.heroes[id];
            if (!h) continue;
            if (data.level != null) h.level = Math.max(1, Math.min(P.MAX_LEVEL, data.level | 0));
            if (data.addLevel) h.level = Math.max(1, Math.min(P.MAX_LEVEL, h.level + (data.addLevel | 0)));
            if (data.rank != null) h.rank = Math.max(0, Math.min(P.MAX_RANK, data.rank | 0));
            if (data.preset != null) { // mốc nhanh: 0 = Lv1 Thường · 1 = Lv20 S · 2 = Lv40 SS · 3 = Lv60 SSS
                const k = Math.max(0, Math.min(3, data.preset | 0));
                h.level = [1, 20, 40, 60][k]; h.rank = k;
            }
            h.exp = 0;
        }
        if (data.giveItems) for (const [id, n] of Object.entries({ exp_small: 20, exp_big: 5, stone_s: 3, stone_ss: 3, stone_sss: 3 })) pr.items[id] = (pr.items[id] ?? 0) + n;
        if (data.clearItems) pr.items = {};
        afterProgress(data.classId === 'all' ? null : data.classId);
    });
    if (TEST_MODE) {
        // AUTO-START with NPC
        const roomId = `room_test_${Date.now()}`;
        const p1 = socket.id;
        const npcId = 'npc_monster';
        const lastPick = pickToDisabled(progressOf(socket.progressKey).squadPick);

        rooms[roomId] = {
            id: roomId,
            status: 'menu', // menu (chọn chế độ) -> selecting (chọn đội hình) -> starting (đếm ngược) -> active / paused
            mode: 'test',   // test (có tool) · duel_monster (Đấu với quái) · duel_hero (Đấu 1P vs 2P) — ĐẤU: Lv60 SSS, không có tool
            monsterLevel: 1,
            isBotMatch: true,
            players: {
                [p1]: { side: 'left', squad: createSquad('left', lastPick, progressOf(socket.progressKey).heroes), autoMode: false, progressKey: socket.progressKey, disabledClasses: lastPick },
                [npcId]: { 
                    side: 'right', 
                    squad: createSquad('right'), 
                    autoMode: false,
                    isNPC: true
                }
            },
            winner: null,
            countdown: 3,
            lastTick: Date.now(),
            speed: DEFAULT_SPEED, clock: Date.now(),
        };

        socket.join(roomId);
        socket.roomId = roomId;

        socket.emit('battleStart', { roomId, players: rooms[roomId].players, classDefs: CLASS_DEFS, mode: 'menu' });
        socket.emit('mainMenu', {});   // chọn chế độ: Test / Đấu
    } else if (waitingPlayer) {
        const roomId = `room_${Date.now()}`;
        const p1 = waitingPlayer;
        const p2 = socket.id;

        rooms[roomId] = {
            id: roomId,
            status: 'starting',
            isBotMatch: false,
            players: {
                [p1]: { side: 'left', squad: createSquad('left'), autoMode: false },
                [p2]: { side: 'right', squad: createSquad('right'), autoMode: false }
            },
            winner: null,
            countdown: 3,
            lastTick: Date.now(),
            speed: DEFAULT_SPEED, clock: Date.now(),
        };

        io.sockets.sockets.get(p1)?.join(roomId);
        socket.join(roomId);
        if (io.sockets.sockets.get(p1)) io.sockets.sockets.get(p1).roomId = roomId;
        socket.roomId = roomId;

        io.to(roomId).emit('battleStart', { roomId, players: rooms[roomId].players, classDefs: CLASS_DEFS });
        waitingPlayer = null;
        startBattleLoop(roomId);
    } else {
        waitingPlayer = socket.id;
        socket.emit('waiting', { message: 'Đang chờ đối thủ...' });
    }

    socket.on('setSpeed', (data) => {
        const room = rooms[socket.roomId];
        if (!room || !room.players[socket.id] || !GAME_SPEEDS.includes(data?.speed)) return;
        room.speed = data.speed;
        io.to(socket.roomId).emit('speedChanged', { speed: room.speed });
    });

    socket.on('toggleAuto', (data) => {
        const roomId = socket.roomId;
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            rooms[roomId].players[socket.id].autoMode = data.autoMode;
        }
    });
    // Tự động riêng 1 tướng (nút AUTO trên thẻ): AUTO MODE cả đội đang tắt vẫn để tướng này tự dùng kỹ năng
    socket.on('toggleMemberAuto', (data = {}) => {
        const team = rooms[socket.roomId]?.players[socket.id];
        const m = team?.squad[data.memberIndex | 0];
        if (!m || m.summon) return;
        m.autoOn = !!data.value;
    });

    socket.on('queueSkill', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;

        const playerData = rooms[roomId].players[socket.id];
        if (!playerData) return;

        const member = playerData.squad[data.memberIndex];
        const skillIndex = data.skillIndex;
        if (!member || !member.alive || skillIndex === undefined || member.summon) return;

        if (member.queuedSkills.includes(skillIndex)) {
            // Toggle off: Remove from queue
            member.queuedSkills.splice(member.queuedSkills.indexOf(skillIndex), 1);
        } else {
            // Add to queue
            member.queuedSkills.push(skillIndex);
        }
    });

    // Elarion: bấm vào viên ngọc nguyên tố của mình
    socket.on('pickGem', (data = {}) => {
        const room = rooms[socket.roomId];
        if (!room || room.status !== 'active' || room.winner || !room.players[socket.id]) return;
        curRoom = room;
        pickGem(room, socket.id, data.memberIndex | 0, data.gemId, room.clock ?? Date.now());
    });

    socket.on('debugAction', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        if (rooms[roomId].mode !== 'test') return;   // ĐẤU: không có tool
        const player = rooms[roomId].players[socket.id];
        if (!player) return;

        if (data.type === 'fillMana') {
            player.squad.forEach(m => m.mp = m.maxMp);
        } else if (data.type === 'noMana') {
            player.debugNoMana = !!data.value;
            // Bật "Dùng skill miễn phí": mọi kỹ năng sẵn sàng ngay (xoá hồi chiêu đang chạy)
            if (player.debugNoMana) player.squad.forEach(m => { m.skillCooldowns = m.skillCooldowns.map(() => 0); });
        } else if (data.type === 'godMode') {
            player.debugGodMode = !!data.value;
        } else if (data.type === 'kill') {
            // Test: hạ gục ngay 1 nhân vật phe mình (thử hồi sinh của Tu Sĩ)
            const m = player.squad.find(x => x.classId === data.value && x.alive);
            if (m) { curRoom = rooms[roomId]; m.pendingDmg = 0; m.hp = 0; killMember(m, player.squad); broadcastState(roomId); }   // (Zerith: kích hoạt Linh Hồn Báo Thù)
        } else if (data.type === 'elemSpell') {
            // Test: đặt thẳng 1 phép của Elarion vào nút KN2 (bỏ hồi chiêu phép đó)
            const now = rooms[roomId].clock ?? Date.now();
            player.squad.forEach(m => {
                if (m.classId !== 'elementalist' || !m.spells?.[data.value]) return;
                m.spellCd ??= {}; m.spellCd[data.value] = 0;
                setSpell(m, data.value, now);
            });
        } else if (data.type === 'toggleMember') {
            // Bật / tắt 1 nhân vật ra trận (để test riêng từng nhân vật). Luôn giữ ít nhất 1 người.
            const cls = data.value;
            if (!SQUAD_ORDER.includes(cls)) return;
            const off = new Set(player.disabledClasses ?? []);
            if (off.has(cls)) off.delete(cls); else off.add(cls);
            if (SQUAD_ORDER.every(c => off.has(c))) return socket.emit('progressMsg', { ok: false, text: 'Phải còn ít nhất 1 nhân vật trong trận' });
            if (SQUAD_ORDER.filter(c => !off.has(c)).length > MAX_SQUAD) return socket.emit('progressMsg', { ok: false, text: `Tối đa ${MAX_SQUAD} nhân vật — tắt bớt 1 người trước` });
            player.disabledClasses = [...off];
            const room = rooms[roomId];
            player.squad = mySquadFor(room, player);
            room.pending = [];
            // Phe địch: xoá mục tiêu / khiêu khích trỏ vào đội hình cũ
            Object.values(room.players).forEach(p => p.squad.forEach(m => {
                m.targetIndex = -1; m.lockedTargetIndex = -1;
                if (p !== player) m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'taunted');
            }));
            if (room.winner) { room.winner = null; room.status = 'active'; startBattleLoop(roomId); }
            io.to(roomId).emit('squadResized', { playerId: socket.id, newSquad: player.squad });
            socket.emit('memberToggles', { disabled: player.disabledClasses });
            broadcastState(roomId);
        }
    });

    socket.on('debugEnemyAction', (data) => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room || room.mode !== 'test') return;   // ĐẤU: không có tool
        if (data.type === 'monsterLevel') {
            // Tool phe quái: đổi cấp quái (dựng lại 3 quái với chỉ số mới)
            room.monsterLevel = Math.max(1, Math.min(P.MAX_LEVEL, (data.set ?? (room.monsterLevel ?? 1) + (data.add ?? 0)) | 0));
            socket.emit('monsterLevel', { level: room.monsterLevel });
            const oppId = Object.keys(room.players).find(id => id !== socket.id);
            const opp = room.players[oppId];
            if (opp && !opp.squad.every(m => m.classId === 'monster_dummy')) {
                room.players[socket.id].squad.forEach(m => { m.targetIndex = -1; m.lockedTargetIndex = -1; });
                opp.squad = createMonsterSquad(room.monsterLevel);
                opp.debugGodMode = !!room.enemyGodMode;
                room.pending = [];
                if (room.winner) { room.winner = null; room.status = 'active'; startBattleLoop(roomId); }
                io.to(roomId).emit('squadResized', { playerId: oppId, newSquad: opp.squad });
                broadcastState(roomId);
            }
            return;
        }


        const cid = socket.id;
        const opponentId = Object.keys(room.players).find(id => id !== cid);
        if (!opponentId) return;

        if (data.type === 'godMode') {
            // Bất tử cho phe quái (giữ nguyên khi triệu hồi lại quái)
            room.enemyGodMode = !!data.value;
            room.players[opponentId].debugGodMode = room.enemyGodMode;
            return;
        }
        const DUMMY_TYPES = ['spawnDummy', 'addDummy', 'removeDummy'];
        if (data.type === 'spawnStandard' || DUMMY_TYPES.includes(data.type)) {
            // Reset player targets
            room.players[cid].squad.forEach(m => {
                m.targetIndex = -1;
                m.lockedTargetIndex = -1;
                m.state = 'idle';
            });

            const opp = room.players[opponentId];
            if (DUMMY_TYPES.includes(data.type)) {
                // Cọc gỗ bất tử để test. Thêm / bớt từng cọc, mỗi cọc cách nhau DUMMY_GAP;
                // máu đặt sẵn khác nhau (100%, 85%, 70%...) để thử các kỹ năng chọn mục tiêu theo máu.
                const DUMMY_GAP = 3, MAX_DUMMIES = 8;
                const current = opp.squad.every(m => m.classId === 'monster_dummy') ? opp.squad.length : 0;
                let count = data.type === 'spawnDummy' ? 1 : current + (data.type === 'addDummy' ? 1 : -1);
                count = Math.max(1, Math.min(MAX_DUMMIES, count));
                opp.debugGodMode = true;
                const def = CLASS_DEFS['monster_dummy'];
                opp.squad = Array.from({ length: count }, (_, i) => {
                    const hp = Math.round(def.maxHp * Math.max(0.1, 1 - 0.15 * i));
                    return {
                        classId: 'monster_dummy', name: `${def.name} ${i + 1}`, emoji: def.emoji, color: def.color,
                        hp, maxHp: def.maxHp, mp: 0, maxMp: def.maxMp,
                        pAtk: def.pAtk, mAtk: def.mAtk, pDef: def.pDef, mDef: def.mDef,
                        crit: def.crit, critDmg: def.critDmg, acc: def.acc, dodge: def.dodge, pen: def.pen, block: def.block, lifesteal: def.lifesteal,
                        mpAtk: def.mpAtk, mpSec: def.mpSec,
                        atkSpeed: def.atkSpeed, atkRange: def.atkRange, range: def.range, moveSpeed: def.moveSpeed,
                        alive: true, x: 25 + i * DUMMY_GAP, y: 0, z: 0, side: 'right',
                        state: 'idle', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: 0,
                        skillCooldowns: [], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: []
                    };
                });
            } else {
                opp.debugGodMode = !!room.enemyGodMode; // quái thường: theo nút Bất Tử phe địch
                opp.squad = createMonsterSquad(room.monsterLevel ?? 1);
            }

            if (room.winner) {
                room.winner = null;
                room.status = 'active';
                startBattleLoop(roomId);
            }

            io.to(roomId).emit('squadResized', { playerId: opponentId, newSquad: opp.squad });
            broadcastState(roomId);
        }
    });

    // ---------- CHỌN ĐỘI HÌNH (1-4 nhân vật) -> xác nhận mới vào trận ----------
    // ---------- CHỌN CHẾ ĐỘ: Test / Đấu với quái / Đấu với tướng ----------
    const stopLoop = (room) => { if (room.interval) { clearInterval(room.interval); room.interval = null; } };
    socket.on('chooseMode', (data = {}) => {
        const room = rooms[socket.roomId];
        if (!room || !room.players[socket.id] || !MODES.includes(data.mode)) return;
        stopLoop(room);
        room.mode = data.mode;
        room.status = 'selecting';
        socket.emit('squadSelect', squadSelectPayload(socket.progressKey, room.mode));
    });
    socket.on('backToMenu', () => {
        const room = rooms[socket.roomId];
        if (!room || !room.players[socket.id]) return;
        stopLoop(room);
        room.status = 'menu';
        room.winner = null;
        room.pending = [];
        io.to(socket.roomId).emit('pauseState', { paused: false, isBotMatch: room.isBotMatch });
        socket.emit('mainMenu', {});
    });

    // ---------- CHỌN ĐỘI HÌNH (1-4 nhân vật; Đấu với tướng: thêm đội 2P) -> xác nhận mới vào trận ----------
    socket.on('confirmSquad', (data = {}) => {
        const room = rooms[socket.roomId];
        const player = room?.players[socket.id];
        if (!room || !player || room.status !== 'selecting') return;
        const clean = (list) => [...new Set((list ?? []).filter(c => SQUAD_ORDER.includes(c)))].slice(0, MAX_SQUAD);
        const pick = clean(data.classes);
        if (pick.length < 1) return socket.emit('squadSelectError', { text: 'Chọn ít nhất 1 nhân vật' });
        const enemyPick = clean(data.enemyClasses);
        if (room.mode === 'duel_hero' && enemyPick.length < 1) return socket.emit('squadSelectError', { text: '2P: chọn ít nhất 1 nhân vật' });
        const pr = progressOf(socket.progressKey);
        if (room.mode === 'test') pr.squadPick = pick; else pr.duelPick = pick;
        if (room.mode === 'duel_hero') pr.duelEnemyPick = enemyPick;
        P.saveAll(PROGRESS);
        player.disabledClasses = pickToDisabled(pick);
        room.enemyDisabled = room.mode === 'duel_hero' ? pickToDisabled(enemyPick) : [];
        const npc = Object.values(room.players).find(p => p !== player);
        player.squad = mySquadFor(room, player);
        if (npc) {
            npc.squad = enemySquadFor(room);
            npc.autoMode = room.mode === 'duel_hero';   // đội 2P do AI điều khiển
        }
        if (room.mode !== 'test') {
            // ĐẤU: tắt mọi tool test
            player.debugNoMana = false; player.debugGodMode = false; room.enemyGodMode = false;
            if (npc) npc.debugGodMode = false;
        }
        room.pending = [];
        room.status = 'starting';
        room.countdown = 3;
        room.lastTick = Date.now();
        room.winner = null;
        io.to(socket.roomId).emit('battleStart', { roomId: socket.roomId, players: room.players, classDefs: CLASS_DEFS, mode: room.mode });
        socket.emit('memberToggles', { disabled: player.disabledClasses });
        if (room.mode === 'test') socket.emit('monsterLevel', { level: room.monsterLevel ?? 1 });
        startBattleLoop(socket.roomId);
    });

    socket.on('togglePause', () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        
        if (room.status === 'paused') {
            room.status = room.previousStatus || 'active';
            room.lastTick = Date.now(); // Prevent countdown jump
        } else if (room.status === 'active' || room.status === 'starting') {
            room.previousStatus = room.status;
            room.status = 'paused';
        }
        
        io.to(roomId).emit('pauseState', { paused: room.status === 'paused', isBotMatch: room.isBotMatch });
    });

    socket.on('requestReset', () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        
        if (room.interval) {
            clearInterval(room.interval);
            room.interval = null;
        }

        // Restart logic
        Object.values(room.players).forEach(p => {
            p.squad = room.isBotMatch ? (p.isNPC ? enemySquadFor(room) : mySquadFor(room, p))
                : createSquad(p.side, p.disabledClasses, p.progressKey ? progressOf(p.progressKey).heroes : null);
            room.pending = [];
        });
        room.status = room.isBotMatch ? 'selecting' : 'starting';   // đấu thử: chọn lại đội hình trước khi vào trận
        room.countdown = 3;
        room.lastTick = Date.now();
        room.winner = null;
        
        io.to(roomId).emit('battleStart', { roomId, players: room.players, classDefs: CLASS_DEFS, mode: room.mode });
        if (room.isBotMatch) {
            room.interval && clearInterval(room.interval); room.interval = null;
            io.to(roomId).emit('pauseState', { paused: false, isBotMatch: true });
            socket.emit('squadSelect', squadSelectPayload(socket.progressKey, room.mode));
            return;
        }
        // Pause UI should close
        io.to(roomId).emit('pauseState', { paused: false, isBotMatch: room.isBotMatch });

        // CRITICAL FIX: Restart the battle loop!
        startBattleLoop(roomId);
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket.id) waitingPlayer = null;
        if (socket.roomId && rooms[socket.roomId]) {
            if (rooms[socket.roomId].interval) {
                clearInterval(rooms[socket.roomId].interval);
            }
            io.to(socket.roomId).emit('opponentDisconnected');
            delete rooms[socket.roomId];
        }
    });
});

// ============================================================
// BATTLE ENGINE
// ============================================================
function startBattleLoop(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.interval) {
        clearInterval(room.interval);
        room.interval = null;
    }

    const tickRate = 50; // 50ms per tick

    room.interval = setInterval(() => {
        const currentRoom = rooms[roomId];
        if (!currentRoom || currentRoom.winner) {
            if (currentRoom && currentRoom.interval) {
                clearInterval(currentRoom.interval);
                currentRoom.interval = null;
            }
            return;
        }

        // Đồng hồ trận: chỉ chạy khi trận đang diễn ra, nhanh/chậm theo tốc độ phòng
        const realNow = Date.now();
        const realDt = Math.min(250, realNow - (room.lastReal ?? realNow));
        room.lastReal = realNow;
        if (room.clock == null) room.clock = realNow;
        const ts = timeScaleOf(room);
        if (room.status === 'active') room.clock += realDt * ts;
        const now = room.clock;
        curRoom = room;
        if (room.status === 'active') runPending(room, now);

        // COUNTDOWN PHASE (giây thật)
        if (room.status === 'starting') {
            if (realNow - room.lastTick >= 1000) {
                room.lastTick = realNow;
                io.to(roomId).emit('countdown', { count: room.countdown > 0 ? room.countdown : 'START' });
                room.countdown--;
                if (room.countdown < -1) {
                    room.status = 'active';
                }
            }
            broadcastState(roomId);
            return; // Skip physics during countdown
        }

        // PAUSE TICK
        if (room.status === 'paused' && room.isBotMatch) {
            return; // Stop processing frame if playing against bot and paused
        }

        const playerIds = Object.keys(room.players);

        playerIds.forEach(playerId => {
            const playerData = room.players[playerId];
            const opponentId = playerIds.find(id => id !== playerId);
            const opponentData = room.players[opponentId];

            // 1. AUTO MODE: AI chiến thuật chọn KỸ NĂNG PHÙ HỢP TÌNH HUỐNG (mỗi lần 1 kỹ năng, xét lại mỗi 0.3s)
            //    Tự động cả đội (nút AUTO MODE) hoặc từng tướng (nút AUTO trên thẻ — member.autoOn)
            if (opponentData) {
                playerData.squad.forEach((member, idx) => {
                    if (!(playerData.autoMode || member.autoOn)) return;
                    if (!member.alive || member.queuedSkills.length > 0 || member.state === 'casting') return;
                    if (now < (member.actionUntil ?? 0)) return; // đang diễn chiêu: chờ diễn xong (buff / hiệu ứng mới có) rồi mới tính tiếp
                    if (now < (member.aiNext ?? 0)) return;
                    member.aiNext = now + 300;
                    const pick = autoChooseSkill(member, idx, playerData, opponentData, now);
                    if (pick >= 0) member.queuedSkills.push(pick);
                });
            }

            // 2. BATTLE LOGIC (Movement & Combat)
            playerData.squad.forEach((member, memberIndex) => {
                // Linh Hồn Báo Thù (Zerith): linh hồn Thần Chết chiến đấu đủ 7s — kể cả khi Zerith đã được hồi sinh (đánh chung)
                processReaperGhost(roomId, playerId, memberIndex, opponentId, now);
                if (!member.alive) return;

                // Khiên của Dựng Khiên: nổ theo lượng máu khiên đã mất, vỡ khi hết máu
                processGuardShield(roomId, playerId, memberIndex, opponentId, now);
                // Hộ Vệ Thần Lửa (Hỏa Thần Giáng Lâm): tự ném cầu lửa
                processFireGuardian(roomId, playerId, memberIndex, opponentId, now);
                // Hộ Vệ Thần Chết (Đêm Tử Thần): chém mục tiêu của Zerith
                processReaperGuardian(roomId, playerId, memberIndex, opponentId, now);
                // Brakk: hết Khổng Lồ -> trả máu tối đa; 5s đầu Khổng Lồ -> gỡ mọi hiệu ứng bất lợi
                processBrakk(roomId, playerId, memberIndex, now);
                // Nerissa: điệu múa (đốt Orb hồi máu, nốt nhạc, giáp nước, hút Orb...) + hết giờ thì dừng
                processDance(roomId, playerId, memberIndex, opponentId, now);
                // Elarion: ngọc nguyên tố rơi / tan, Bão Nguyên Tố, AI nhặt ngọc · Golem: hết giờ, hào quang sét
                processElementalist(roomId, playerId, memberIndex, opponentId, now);
                if (!member.alive) return;   // Golem vừa tan
                // Rok: dây liên kết + Ý Chí Thép (hồi máu theo giây) · Ignar: Giáp Lửa hết -> nổ choáng
                processIronWill(roomId, playerId, memberIndex, now);
                processFireWard(roomId, playerId, memberIndex, opponentId, now);
                // Đang bị Thần Chết phán quyết: lơ lửng, không làm gì, không nhận hiệu ứng mới
                if (processJudged(member, now)) return;

                // Cleanup expired status effects
                member.statusEffects = member.statusEffects.filter(ef => ef.endTime > now);

                // Mana Regen over time (Passive)
                // Triều Dâng (Nerissa): tự hồi MP nhanh hơn · Vũ Khúc Sóng Triều: cả đội cộng thêm MP mỗi giây
                const surge = talentOf(member, 'tide_surge');
                let mpGain = member.mpSec * (1 + (surge?.value ?? 0)) * orbRegenMult(member, now);
                for (const ef of member.statusEffects) if (ef.type === 'tide_mana' && ef.endTime > now) mpGain += ef.manaPerSec;
                member.mp = Math.min(member.maxMp, member.mp + (mpGain / 20) * ts); // mpSec mỗi 1000ms, tick 50ms
                // Ân Điển: đang Thánh Niệm -> hồi thêm MP
                const praying = isPraying(member, now);
                const grace = praying ? talentOf(member, 'grace') : null;
                if (grace) member.mp = Math.min(member.maxMp, member.mp + (grace.prayMp / 20) * ts);
                // Thánh Niệm: mỗi 1s hồi máu nhẹ cho cả đội (×prayHeal M.ATK, cộng Ân Điển)
                if (praying && now >= (member.prayHealAt ?? 0)) {
                    const pr = skillsOf(member).find(sk => sk.type === 'pray');
                    if (pr?.prayHeal) {
                        if (member.prayHealAt) {
                            const g = talentOf(member, 'grace');
                            const amount = Math.round(getEffectiveStats(member, now).stats.mAtk * pr.prayHeal * (1 + (g?.value ?? 0)));
                            const heals = [];
                            playerData.squad.forEach((a, i) => {
                                if (!a.alive) return;
                                heals.push({ targetIndex: i, heal: healUnit(a, amount, now) });
                            });
                            io.to(roomId).emit('prayHeal', { casterId: playerId, casterIdx: memberIndex, heals });
                        }
                        member.prayHealAt = now + (pr.prayHealEvery ?? 1000);
                    }
                } else if (!praying) member.prayHealAt = 0;
                // Tu Sĩ đang niệm còn khiên cánh -> miễn choáng
                if (praying && member.statusEffects.some(ef => ef.type === 'holy_shield' && ef.winged && (ef.hp > 0 || ef.dormant) && ef.endTime > now))
                    member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'stun');

                const def = CLASS_DEFS[member.classId];

                // CHOÁNG: đứng im, không đánh, không niệm (bị ngắt niệm)
                if (member.statusEffects.some(ef => ef.type === 'stun' && ef.endTime > now)) {
                    if (member.castingSkillId != null) {
                        // bị ngắt niệm: mất chiêu, hồi chiêu tính từ lúc bị ngắt
                        const broken = skillsOf(member)[member.castingSkillId];
                        if (!playerData.debugNoMana && broken) member.skillCooldowns[member.castingSkillId] = now + broken.cooldown;
                    }
                    if (isPraying(member, now)) endPray(playerData.squad, memberIndex, roomId, playerId, 'stun'); // bị choáng -> ngắt niệm
                    if (isDancing(member, now)) endDances(roomId, playerId, memberIndex, opponentId, now, 'stun');   // Nerissa: dừng mọi điệu múa
                    if (rainOf(member, now)) endRain(room, playerId, memberIndex, 'stun');   // Elarion: ngắt mưa giông
                    if (beamOf(member, now)) endBeam(room, playerId, memberIndex, 'stun');   // Elarion: ngắt SolarBeam
                    member.state = 'stunned';
                    member.castingSkillId = null;
                    return;
                }
                if (member.state === 'stunned') member.state = 'idle';

                // BỊ HẤT VĂNG (Đẩy Khiên): đang bay ra sau, chưa làm gì được
                if (member.statusEffects.some(ef => ef.type === 'knocked' && ef.endTime > now)) {
                    member.state = 'idle';
                    return;
                }

                // ĐANG DIỄN ĐỘNG TÁC KỸ NĂNG: đứng yên, không đánh / chạy / ra chiêu khác cho tới khi diễn xong
                if (now < (member.actionUntil ?? 0)) {
                    member.state = 'acting';
                    return;
                }
                if (member.state === 'acting') member.state = 'idle';

                // ĐANG MÚA (Nerissa): không đánh thường; lượn qua lại; vẫn dùng được các điệu múa khác (không cần tầm)
                if (isDancing(member, now)) {
                    const i = member.queuedSkills.find(k => DANCE_TYPES.has(skillsOf(member)[k]?.type));
                    if (i != null && foeInReach(member, skillsOf(member)[i]?.type, opponentData?.squad, now)) {
                        const sd = skillsOf(member)[i];
                        const cost = skillCostOf(member, i, now);
                        const need = Math.max(cost, (sd.minOrbs ?? 0) * ORB_COST);
                        if ((playerData.debugNoMana || member.mp >= need) && (playerData.debugNoMana || now >= member.skillCooldowns[i]) && !danceOn(member, sd.type, now)) {
                            member.queuedSkills.splice(member.queuedSkills.indexOf(i), 1);
                            if (!playerData.debugNoMana) member.mp -= cost;
                            executeSkill(roomId, playerId, memberIndex, opponentId, i);
                        }
                    }
                    member.queuedSkills = member.queuedSkills.filter(k => DANCE_TYPES.has(skillsOf(member)[k]?.type));
                    danceMove(member, ts * tickRate, now);
                    member.state = 'dancing';
                    return;
                }
                if (member.state === 'dancing') member.state = 'idle';

                // ĐANG THI TRIỂN MƯA GIÔNG (Elarion): đứng yên, không đánh / chạy; dùng kỹ năng khác thì ngắt
                if (rainOf(member, now)) {
                    const wants = member.queuedSkills.some(k => skillUsable(member, k) && (playerData.debugNoMana ||
                        (member.mp >= skillCostOf(member, k, now) && now >= member.skillCooldowns[k])));
                    if (wants) endRain(room, playerId, memberIndex, 'skill');
                    else { member.state = 'channeling'; return; }
                }
                if (member.state === 'channeling') member.state = 'idle';

                // ĐANG CHƯỞNG SOLARBEAM (Elarion — Băng Hoại Hỏa Thiên): đứng yên, không đánh / chạy; dùng kỹ năng khác thì ngắt
                if (beamOf(member, now)) {
                    const wants = member.queuedSkills.some(k => skillUsable(member, k) && (playerData.debugNoMana ||
                        (member.mp >= skillCostOf(member, k, now) && now >= member.skillCooldowns[k])));
                    if (wants) endBeam(room, playerId, memberIndex, 'skill');
                    else { member.state = 'beaming'; return; }
                }
                if (member.state === 'beaming') member.state = 'idle';

                // THÁNH NIỆM (Tu Sĩ): bay lên đứng niệm — không chạy / đánh thường; chỉ dùng được Kỹ năng 1 & 2 (không cần tầm)
                if (isPraying(member, now)) {
                    member.state = 'praying';
                    const i = member.queuedSkills.find(k => k === 0 || k === 1);
                    if (i != null) {
                        const sd = skillsOf(member)[i];
                        const cost = skillCostOf(member, i, now);
                        if ((playerData.debugNoMana || member.mp >= cost) && (playerData.debugNoMana || now >= member.skillCooldowns[i])) {
                            member.queuedSkills.splice(member.queuedSkills.indexOf(i), 1);
                            if (!playerData.debugNoMana) member.mp -= cost;
                            executeSkill(roomId, playerId, memberIndex, opponentId, i);
                        }
                    }
                    return;
                }
                if (member.state === 'praying') member.state = 'idle';

                // DỰNG KHIÊN: đứng yên giữ khiên, không di chuyển / đánh.
                // Nếu người chơi ra lệnh Kỹ năng 1 hoặc 2 -> cho dùng (khiên sẽ tự hạ khi kỹ năng thi triển)
                if (member.statusEffects.some(ef => ef.type === 'guard' && ef.endTime > now)) {
                    const wantsOther = member.queuedSkills.some(i => i !== 2 &&
                        (playerData.debugNoMana || (member.mp >= skillsOf(member)[i].orbCost * ORB_COST && now >= member.skillCooldowns[i])));
                    if (!wantsOther) {
                        member.queuedSkills = member.queuedSkills.filter(i => i !== 2 || !def.skills[i] || def.skills[i].type !== 'guard');
                        member.state = 'guarding';
                        return;
                    }
                }
                if (member.state === 'guarding') member.state = 'idle';

                // FIND TARGET - respect locked target from dash
                let target;
                const taunt = member.statusEffects.find(ef => ef.type === 'taunted' && ef.endTime > now);
                const taunter = taunt ? opponentData.squad[taunt.sourceIndex] : null;
                if (taunter && taunter.alive && canBeTargeted(taunter, now)) {
                    target = taunter; // bị Khiêu Khích: buộc đánh người khiêu khích
                } else if (member.lockedTargetIndex >= 0 && opponentData.squad[member.lockedTargetIndex]?.alive) {
                    target = opponentData.squad[member.lockedTargetIndex];
                    if (!canBeTargeted(target, now)) {
                        member.lockedTargetIndex = -1;
                        target = findBestTarget(member, opponentData.squad, now);
                    }
                } else {
                    member.lockedTargetIndex = -1; // Clear lock if target is dead
                    target = findBestTarget(member, opponentData.squad, now, opponentData.squad[member.targetIndex]);
                }
                const targetIdx = target ? opponentData.squad.indexOf(target) : -1;
                member.targetIndex = targetIdx;

                // CHECK SKILL QUEUE & CASTING
                if (member.state === 'casting') {
                    if (now >= member.castEndTime) {
                        // EXECUTING CASTED SKILL
                        executeSkill(roomId, playerId, memberIndex, opponentId, member.castingSkillId);
                        member.state = 'idle';
                        member.castingSkillId = null;
                    }
                    return; // Can't move or attack while casting
                }

                // Thiên phú Phán Quyết Tử Thần: vào giao tranh / mỗi 15s gắn Ấn Tử (động tác chỉ tay ngắn)
                if (processDeathJudgement(roomId, playerId, memberIndex, opponentId, now)) return;
                // Thiên phú Khí Thế Đấu Trường (Brakk): đồng đội nguy hiểm -> hét lớn khiêu khích tất cả đối thủ
                if (processBrakkShout(roomId, playerId, memberIndex, opponentId, now)) return;

                // If not casting, check if we should start casting a queued skill
                if (member.queuedSkills.length > 0) {
                    // kỹ năng đầu hàng đợi DÙNG ĐƯỢC (Elarion: Sách cần đủ 3 viên ngọc, nút phép cần có phép)
                    // điệu múa / Tàng Hình: phải có đối thủ trong tầm (foeInReach) — chưa gặp thì lệnh nằm chờ, vẫn tiến lên
                    const canUse = (k) => skillUsable(member, k) && foeInReach(member, skillsOf(member)[k]?.type, opponentData?.squad, now);
                    const skillIdxToCast = member.queuedSkills.find(canUse) ?? member.queuedSkills[0];
                    const skillDef = skillsOf(member)[skillIdxToCast];
                    const cost = skillCostOf(member, skillIdxToCast, now);

                    // If enough mana (or debugNoMana) and off cooldown (or debugNoMana)
                    const hasEnoughMana = canUse(skillIdxToCast) && (playerData.debugNoMana || member.mp >= Math.max(cost, (skillDef.minOrbs ?? 0) * ORB_COST));
                    const isOffCooldown = (playerData.debugNoMana || now >= member.skillCooldowns[skillIdxToCast]) && !danceOn(member, skillDef.type, now);
                    if (hasEnoughMana && isOffCooldown) {
                        const isSelfBuff = ['stealth', 'self_buff', 'taunt', 'fortress', 'guard', 'wind_spirit', 'heal', 'holy_shield', 'pray', 'fire_god', 'reaper_night', 'brakk_stomp', 'brakk_giant', 'dance_tide', 'dance_flow', 'dance_god', 'elem_book', 'elem_spell', 'elem_storm'].includes(skillDef.type);
                        const reqRange = skillDef.castRange !== undefined ? skillDef.castRange : attackRangeOf(member, now);
                        
                        const dx = target ? target.x - member.x : 0;
                        const dz = target ? target.z - member.z : 0;
                        const dist2D = target ? Math.sqrt(dx * dx + dz * dz) : 0;

                        if (!target && !isSelfBuff) {
                            // wait for target
                        } else if (target && dist2D > reqRange && !isSelfBuff) {
                            // move to range to cast
                            member.state = 'moving';
                            const dirX = dx / dist2D;
                            const dirZ = dz / dist2D;
                            member.x += dirX * member.moveSpeed * tickRate * ts;
                            member.z += dirZ * member.moveSpeed * tickRate * ts;
                            clampToArena(member);
                            holdFormation(member, playerData.squad);
                            return; 
                        } else {
                            member.queuedSkills.splice(member.queuedSkills.indexOf(skillIdxToCast), 1); // Dequeue
                            if (!playerData.debugNoMana) member.mp -= cost;
                            // hồi chiêu = gồng + diễn + hồi (executeSkill đặt lại chính xác lúc diễn xong;
                            // trong lúc gồng / diễn HUD giữ nguyên số đầy, diễn xong mới đếm)
                            const castMs = castTimeOf(member, skillDef, now);
                            if (!playerData.debugNoMana) member.skillCooldowns[skillIdxToCast] = now + castMs + (skillDef.lock ?? 0) + skillDef.cooldown;

                            if (castMs > 0) {
                                member.state = 'casting';
                                member.castingSkillId = skillIdxToCast;
                                member.castEndTime = now + castMs;
                                io.to(roomId).emit('castStart', { 
                                    casterId: playerId, casterIdx: memberIndex, 
                                    skillIdx: skillIdxToCast, castTime: castMs 
                                });
                                return; // Stop here, now we are casting
                            } else {
                                // Instant cast
                                executeSkill(roomId, playerId, memberIndex, opponentId, skillIdxToCast);
                                return; // Skill cast takes priority over attack this tick
                            }
                        }
                    }
                }

                if (!target) { if (member.state === 'moving') member.state = 'idle'; return; } // không còn mục tiêu

                // NORMAL MOVEMENT & ATTACK
                const dx = target.x - member.x;
                const dz = target.z - member.z;
                const dist2D = Math.sqrt(dx * dx + dz * dz);

                if (dist2D > attackRangeOf(member, now)) {
                    member.state = 'moving';
                    const dirX = dx / dist2D;
                    const dirZ = dz / dist2D;
                    member.x += dirX * member.moveSpeed * tickRate * ts;
                    member.z += dirZ * member.moveSpeed * tickRate * ts;
                    clampToArena(member);
                    holdFormation(member, playerData.squad);
                } else {
                    const effAtkSpeed = getEffectiveStats(member, now).stats.atkSpeed;
                    // Đánh xa bị cận chiến áp sát: lùi lại giữa 2 phát bắn (thả diều)
                    if (now - member.lastAttackTime < effAtkSpeed * 0.85 && kiteAway(member, opponentData.squad, tickRate * ts, now)) {
                        member.state = 'moving';
                        return;
                    }
                    member.state = 'attacking';
                    if (now - member.lastAttackTime >= effAtkSpeed && brakkUplift(roomId, playerId, memberIndex, opponentId, targetIdx, now)) {
                        member.lastAttackTime = now;   // Khổng Lồ: đòn thường đầu tiên / sau mỗi 3 đòn -> móc ngược hất tung
                    } else if (now - member.lastAttackTime >= effAtkSpeed && fireGodAttack(roomId, playerId, memberIndex, opponentId, targetIdx, now)) {
                        member.lastAttackTime = now;   // Hỏa Thần: đánh thường thành Hỏa Chưởng / chưởng toàn thể
                    } else if (now - member.lastAttackTime >= effAtkSpeed) {
                        const result = calculateDamage(member, target, 1.0, now);
                        
                        if (result.isMiss) {
                            io.to(roomId).emit('autoAttack', {
                                attackerId: playerId, attackerIndex: memberIndex,
                                targetId: opponentId, targetIndex: targetIdx, damage: 0, dodged: true
                            });
                        } else {
                            const dmg = result.damage;
                            
                            dealDamage(target, dmg, opponentData, def.autoImpact ?? 180, executeHook(member, target)); // lúc nhát chém / mũi tên chạm
                            
                            // Mana from attack
                            member.mp = Math.min(member.maxMp, member.mp + member.mpAtk * orbRegenMult(member, now));
                            
                            // Lifesteal (unused for now)
                            if (member.lifesteal > 0) healUnit(member, dmg * member.lifesteal / 1000, now);

                            io.to(roomId).emit('autoAttack', {
                                attackerId: playerId, attackerIndex: memberIndex,
                                targetId: opponentId, targetIndex: targetIdx, damage: dmg, 
                                isBlock: result.isBlock, isCrit: result.isCrit, absorbed: result.absorbed || 0, isMagic: result.isMagic
                            });
                        }
                        member.lastAttackTime = now;
                        golemAfterAuto(roomId, playerId, memberIndex, opponentId, now);   // Golem: Hào Quang Sét giật · cứ 2 đòn -> 1 kỹ năng
                        elemAfterAuto(roomId, playerId, memberIndex, opponentId, targetIdx, now);   // Elarion — Tốc Lôi: chưởng 2 lần
                        archerExtraShots(roomId, playerId, memberIndex, opponentId, targetIdx, now);
                        reaperCleave(roomId, playerId, memberIndex, opponentId, targetIdx, now);
                    }
                }
            });
        });

        broadcastState(roomId);
        checkWinCondition(roomId);
    }, tickRate);
}

// ============================================================
// AI AUTO — chọn kỹ năng theo tình huống thay vì cứ đủ mana là bấm
// ============================================================
// Trả về chỉ số kỹ năng (0/1/2) nên dùng NGAY, hoặc -1 = chờ (để dành Orb cho combo / chưa có lý do dùng).
function autoChooseSkill(member, idx, playerData, opponentData, now) {
    const def = CLASS_DEFS[member.classId];
    if (!def?.skills?.length || member.summon) return -1;   // Golem tự dùng kỹ năng theo đòn đánh
    const orbs = playerData.debugNoMana ? 99 : member.mp / ORB_COST;
    const ready = (i) => (playerData.debugNoMana || member.mp >= Math.max(skillCostOf(member, i, now), (skillsOf(member)[i]?.minOrbs ?? 0) * ORB_COST))
        && now >= member.skillCooldowns[i] && !danceOn(member, skillsOf(member)[i]?.type, now)
        && foeInReach(member, skillsOf(member)[i]?.type, opponentData.squad, now);   // múa / Tàng Hình: chỉ khi đã gặp đối thủ
    const cdLeft = (i) => Math.max(0, member.skillCooldowns[i] - now);
    const has = (m, type, minLeft = 0) => m.statusEffects.some(ef => ef.type === type && ef.endTime > now + minLeft);
    const dist = (a, b) => Math.hypot(a.x - b.x, (a.z || 0) - (b.z || 0));
    const enemies = opponentData.squad.filter(m => m.alive);
    const targetable = enemies.filter(m => canBeTargeted(m, now));
    if (targetable.length === 0) return -1;
    const allies = playerData.squad;
    // quái ĐANG ĐÁNH đồng đội số i: nhắm vào người đó VÀ đã áp sát trong tầm đánh (quái còn đang chạy tới thì chưa tính)
    const attackersOf = (i) => enemies.filter(e => e.targetIndex === i && allies[i]?.alive && dist(e, allies[i]) <= (e.atkRange ?? 2) + 1);
    const nearest = targetable.reduce((d, e) => Math.min(d, dist(e, member)), Infinity);
    const hpPct = (m) => m.hp / m.maxHp;
    const beingHit = attackersOf(idx).length;

    if (member.classId === 'assassin') {
        // Jessica: combo Bùa (gắn Ấn) -> [Tàng Hình] -> Đột Kích chí mạng lên các quái có Ấn
        const stealthed = has(member, 'stealth');
        const sealed = targetable.filter(m => has(m, 'seal', 1000));        // Ấn còn > 1s
        const lowSealed = sealed.some(m => hpPct(m) < 0.35);
        // 1. Nguy hiểm: máu thấp và đang bị đánh -> Tàng Hình (không thể bị chọn) hoặc nhảy lùi phóng bùa
        if (hpPct(member) < 0.35 && beingHit > 0 && !stealthed) {
            if (ready(2)) return 2;
            if (ready(0)) return 0;
        }
        // 2. Đang tàng hình: Đột Kích chắc chắn chí mạng nếu có Ấn; chưa có Ấn thì phóng 2 lá bùa
        if (stealthed) {
            if (sealed.length && ready(1)) return 1;
            if (!sealed.length && ready(0)) return 0;
            return -1;
        }
        // 3. Có Ấn + đủ 5 Orb + Tàng Hình sẵn sàng -> mở combo bằng Tàng Hình (lần sau sẽ Đột Kích)
        if (sealed.length && ready(2) && orbs >= 4) return 2;   // Tàng Hình 2 + Đột Kích 2
        // 4. Đột Kích khi đáng: nhiều quái có Ấn, có quái Ấn sắp chết, hoặc Tàng Hình còn hồi lâu (không chờ nữa)
        //    hoặc Ấn sắp hết (< 2.5s) — không để phí Ấn chỉ vì chờ đủ Orb cho combo
        const sealEndingSoon = sealed.some(m => !has(m, 'seal', 2500));
        if (sealed.length && ready(1) && (sealed.length >= 2 || lowSealed || sealEndingSoon || cdLeft(2) > 4000 || orbs >= 4)) return 1;
        // 5. Chưa ai có Ấn (hoặc Ấn sắp hết) -> Phóng Bùa; giữ ít nhất 2 Orb sau khi ném nếu combo sắp sẵn sàng
        if (!sealed.length && ready(0)) return 0;   // Phóng Bùa không tốn Orb: hồi xong là ném
        return -1;
    }

    if (member.classId === 'warrior') {
        // Rok: giữ quái khỏi đồng đội, dựng khiên khi bị đánh dồn, đẩy quái đang đè đồng đội yếu
        const guarding = has(member, 'guard');
        if (guarding) return -1;                       // không tự hạ khiên
        if (nearest > skillsOf(member)[0].radius) return -1; // đầu trận / quái còn xa: giữ Orb, chạy lên chặn trước đã
        const tauntDef = skillsOf(member)[0], guardDef = skillsOf(member)[2], pushDef = skillsOf(member)[1];
        const inRoar = targetable.filter(e => dist(e, member) <= tauntDef.radius);
        const inBurst = targetable.filter(e => dist(e, member) <= guardDef.burstRadius);
        // quái đang đánh đồng đội KHÁC Rok
        const peel = enemies.filter(e => e.targetIndex >= 0 && e.targetIndex !== idx && allies[e.targetIndex]?.alive);
        const allyInDanger = allies.some((a, i) => i !== idx && a.alive && hpPct(a) < 0.5 && attackersOf(i).length > 0);
        // 1. Dựng Khiên: chỉ khi ĐÃ GIAO CHIẾN sát người (có quái trong vùng nổ khiên):
        //    bị ≥2 quái đánh, hoặc máu < 60% đang bị đánh, hoặc đồng đội nguy hiểm và ≥2 quái quanh Rok (khiên nổ trúng nhiều)
        const contact = targetable.some(e => dist(e, member) <= 3);   // đã có quái áp sát (đánh nhau thật)
        if (ready(2) && contact && inBurst.length >= 1 &&
            (beingHit >= 2 || (hpPct(member) < 0.6 && beingHit >= 1) || (allyInDanger && inBurst.length >= 2))) return 2;
        // 2. Sư Tử Gầm: kéo quái đang đánh đồng đội về mình, hoặc ≥2 quái trong vùng chưa bị gầm (sát thương diện rộng)
        const roarable = inRoar.filter(e => !has(e, 'taunted', 800));
        const peelInRange = peel.filter(e => dist(e, member) <= tauntDef.radius);
        //    (gầm lấy sát thương diện rộng chỉ khi dư Orb — luôn chừa 3 Orb cho Dựng Khiên nếu khiên sắp hồi xong)
        const spareForAoe = orbs >= 4 || cdLeft(2) > 5000;
        if (ready(0) && (peelInRange.length >= 1 || (roarable.length >= 2 && spareForAoe))) return 0;
        // 3. Đẩy Khiên: quái cận chiến đang đè đồng đội yếu, hoặc quái trước mặt khi dư Orb (không để dành cho Dựng Khiên sắp hồi)
        const meleePeel = peel.find(e => dist(e, member) <= pushDef.castRange + 1.5);
        const saveForGuard = cdLeft(2) < 2500 && orbs < 5;
        if (ready(1) && meleePeel) return 1;
        const front = opponentData.squad[member.targetIndex];
        if (ready(1) && !saveForGuard && orbs >= 4 && front?.alive && dist(front, member) <= pushDef.castRange + 0.5) return 1;
        return -1;
    }

    if (member.classId === 'archer') {
        // Lyra: gọi Vệ Thần Gió trước -> trong lúc bay thì gồng Thần Tiễn (khi không bị đánh để khỏi bị ngắt)
        //       -> Tiễn Gió Chớp ưu tiên kết liễu (hoàn Orb + hồi chiêu)
        const spirit = has(member, 'windspirit', 2500);
        const snipeDef = skillsOf(member)[0];
        const inRange = targetable.filter(e => dist(e, member) <= snipeDef.castRange);
        const pAtk = member.pAtk * (spirit ? 1.2 : 1);
        const aim = opponentData.squad[member.targetIndex];
        const killable = aim?.alive && canBeTargeted(aim, now) && aim.hp <= pAtk * snipeDef.multiplier * 2 * 0.85;
        if (ready(0) && killable) return 0;                                    // kết liễu được -> bắn ngay
        if (ready(1) && inRange.length && !has(member, 'windspirit')) return 1;  // gọi Vệ Thần
        // gồng Thần Tiễn khi an toàn (không bị đánh), quái đã vào tầm giao chiến; ưu tiên lúc có Vệ Thần / nhiều quái
        if (ready(2) && beingHit === 0 && nearest <= 20 && (spirit || cdLeft(1) > 6000 || targetable.length >= 3)) return 2;
        if (ready(0) && inRange.length && (orbs >= 4 || (cdLeft(2) > 4000 && cdLeft(1) > 4000))) return 0;
        return -1;
    }

    if (member.classId === 'mage') {
        // Ignar: Hỏa Thần khi quái đã vào giao tranh và mình không bị đánh (gồng 1.5s dễ bị ngắt)
        //        -> Cột Lửa phá giáp phép trước -> Thiên Hỏa Cầu nổ lên giáp đã vỡ
        const god = has(member, 'fire_god');
        const sky = skillsOf(member)[0], pil = skillsOf(member)[1];
        const inSky = targetable.filter(e => dist(e, member) <= sky.castRange);
        const inPil = targetable.filter(e => dist(e, member) <= pil.castRange);
        if (ready(2) && !god && beingHit === 0 && nearest <= 18) return 2;
        if (ready(1) && inPil.length) return 1;
        const broken = inSky.some(e => has(e, 'mdef_break'));
        if (ready(0) && inSky.length && (god || broken || orbs >= 4 || cdLeft(1) > 4000)) return 0;
        return -1;
    }

    if (member.classId === 'reaper') {
        // Zerith: áp sát -> hóa Thần Chết (Đêm Tử Thần) -> hất tung cụm quái trước mặt -> lướt xuyên (cũng dùng để áp sát)
        const night = has(member, 'reaper_form');
        const dashDef = skillsOf(member)[0], sc = skillsOf(member)[1];
        const inFront = targetable.filter(e => dist(e, member) <= sc.radius + 0.4);
        const inReach = nearest <= dashDef.castRange + 0.5;
        // đường lướt có đáng không: xuyên ≥ 2 quái, hoặc tới được tướng đánh xa / quái yếu máu ở hàng sau
        const plan = inReach ? planReaperDash(member, opponentData.squad, dashDef, now) : null;
        const worth = plan && (plan.hits.length >= 2 || (plan.end && (isRanged(plan.end) || plan.end.hp / plan.end.maxHp < 0.4)));
        if (ready(0) && inReach && has(member, 'reaper_echo')) return 0;       // lướt lần 2 miễn phí
        if (!night && ready(2) && nearest <= 5) return 2;
        if (ready(1) && inFront.length && (inFront.length >= 2 || night || orbs >= 4 || cdLeft(2) > 6000)) return 1;
        if (ready(0) && inReach && worth) return 0;   // Lưỡi Hái Xuyên Hồn không tốn Orb
        return -1;
    }

    if (member.classId === 'priest') {
        // Seraphine: niệm khi đội gặp nguy (và mình không bị đánh) -> trong lúc niệm xả khiên + hồi máu cả đội;
        //   bình thường hồi máu người yếu, khiên người đang bị đánh dồn / người chắn đòn lúc vào giao tranh
        const praying = isPraying(member, now);
        const alive = allies.filter(a => a.alive);
        const minPct = Math.min(...alive.map(hpPct));
        const avgPct = alive.reduce((t, a) => t + hpPct(a), 0) / Math.max(1, alive.length);
        const engaged = alive.reduce((t, a) => t + attackersOf(allies.indexOf(a)).length, 0);
        const shielded = (a) => !!activeShield(a, now);
        if (praying) {
            if (ready(1) && engaged > 0 && alive.some(a => !shielded(a))) return 1;
            if (ready(0) && minPct < 0.92) return 0;
            return -1;
        }
        if (ready(2) && beingHit === 0 && engaged >= 2 && (avgPct < 0.7 || minPct < 0.45 || orbs >= 5)) return 2;
        if (ready(0) && minPct < 0.6) return 0;
        const tank = supportTarget(allies)?.m;
        if (ready(1) && engaged > 0 && tank && !shielded(tank) && (hpPct(tank) < 0.75 || attackersOf(allies.indexOf(tank)).length >= 2)
            && (orbs >= 5 || cdLeft(2) > 4000)) return 1;
        return -1;
    }

    if (member.classId === 'dancer') {
        // Nerissa: Thủy Thần Vũ khi đã giao tranh -> Sóng Triều nạp Orb -> Lưu Thủy hồi máu (chờ ≥ 2 Orb để không bật / tắt liên tục)
        const tide = has(member, 'dance_tide'), flow = has(member, 'dance_flow'), god = has(member, 'dance_god');
        const alive = allies.filter(a => a.alive);
        const minPct = Math.min(...alive.map(hpPct));
        const engaged = alive.reduce((t, a) => t + attackersOf(allies.indexOf(a)).length, 0);
        if (!god && ready(2) && (engaged > 0 || nearest <= 12)) return 2;
        if (!tide && ready(0) && (god || orbs < 3 || engaged > 0 || nearest <= 14)) return 0;
        if (!flow && ready(1) && member.mp >= 2 * ORB_COST && (minPct < 0.85 || (tide && god))) return 1;
        return -1;
    }

    if (member.classId === 'elementalist') {
        // Elarion: phép đang giữ hợp tình huống -> dùng · đủ 3 viên ghép ra phép tốt hơn -> đọc Sách · đang giao tranh, dư Orb -> Bão Nguyên Tố
        const room = curRoom;
        const oppId = Object.keys(room.players).find(id => room.players[id] === opponentData);
        const pid = Object.keys(room.players).find(id => room.players[id] === playerData);
        if (rainOf(member, now) || beamOf(member, now)) return -1;   // đang mưa giông / chưởng SolarBeam: để phép chạy hết
        const c = elemContext(room, pid, idx, oppId, now);
        const spellOk = member.spell && ready(1) && skillUsable(member, 1) && elemSpellScore(member.spell, c, now) > 0;
        if (spellOk) return 1;
        // phép đang giữ vẫn tốt và hết hồi chiêu (chỉ đang chờ đủ Orb) -> giữ lại, không tốn Orb ghép phép khác
        const holdGood = member.spell && now >= member.skillCooldowns[1] && elemSpellScore(member.spell, c, now) > 0;
        if (!holdGood && (member.held?.length ?? 0) === 3 && ready(0) && skillUsable(member, 0)) {
            const k = SPELL_BY_RECIPE[recipeOf(member.held)];
            if (k && k !== member.spell && elemSpellScore(k, c, now) > 0) return 0;
        }
        if (ready(2) && c.engaged && (orbs >= 5 || (orbs >= 4 && (member.gems?.length ?? 0) < 2))) return 2;
        return -1;
    }

    if (member.classId === 'wrestler') {
        // Brakk: máu quá thấp (< 15%) thì không đốt máu dùng chiêu (chờ thiên phú / hồi máu);
        //   áp sát -> Khổng Lồ -> Chấn Địa khi đông quái quanh mình / đang bị đánh -> Bá Vương Quật quái trước mặt
        if (hpPct(member) < 0.15) return -1;
        const giant = has(member, 'giant_form');
        const grab = skillsOf(member)[0], stomp = skillsOf(member)[1];
        const around = targetable.filter(e => dist(e, member) <= stomp.radius);
        const front = opponentData.squad[member.targetIndex];
        const frontOk = front?.alive && canBeTargeted(front, now) && dist(front, member) <= grab.castRange + 0.3;
        if (!giant && ready(2) && nearest <= 4) return 2;
        if (ready(1) && around.length && (around.length >= 2 || beingHit >= 2 || hpPct(member) < 0.7 || giant || orbs >= 5)) return 1;
        if (ready(0) && frontOk && (giant || orbs >= 4 || cdLeft(2) > 6000 || hpPct(front) < 0.3)) return 0;
        return -1;
    }

    // Lớp khác (chưa có AI riêng): ưu tiên kỹ năng mạnh nhất đang sẵn sàng
    for (let i = skillsOf(member).length - 1; i >= 0; i--) if (ready(i)) return i;
    return -1;
}

// ------------------------------------------------------------
// TU SĨ: chọn mục tiêu, giải hiệu ứng, niệm, hồi sinh
// ------------------------------------------------------------
function isPraying(m, now) {
    return !!m.statusEffects?.some(ef => ef.type === 'praying' && ef.endTime > now);
}
/** Đồng đội cần hỗ trợ nhất: yếu máu nhất (theo %); nếu chưa ai mất máu -> tướng nhiều máu nhất (người chắn đòn) */
function supportTarget(squad) {
    const alive = squad.map((m, i) => ({ m, i })).filter(o => o.m.alive);
    if (!alive.length) return null;
    const hurt = alive.filter(o => o.m.hp < o.m.maxHp);
    if (!hurt.length) return alive.sort((a, b) => b.m.maxHp - a.m.maxHp)[0];
    return hurt.sort((a, b) => a.m.hp / a.m.maxHp - b.m.hp / b.m.maxHp)[0];
}
/** Giải hiệu ứng bất lợi: 'stun' = chỉ choáng, 'all' = choáng + hất văng + mọi hiệu ứng đánh dấu debuff */
const DEBUFFS = ['stun', 'knocked', 'seal', 'taunted'];
function cleanse(m, mode = 'all') {
    const kill = mode === 'stun' ? ['stun', 'frozen'] : DEBUFFS;
    // noCleanse: dấu không giải được (Ấn Tử của Zerith — giảm hồi máu, Tu Sĩ không xoá được)
    m.statusEffects = m.statusEffects.filter(ef => ef.noCleanse || (!kill.includes(ef.type) && !(mode === 'all' && ef.debuff)));
}
/** Kết thúc / ngắt Thánh Niệm: bỏ trạng thái niệm + buff cả đội của Tu Sĩ này */
function endPray(squad, casterIdx, roomId, playerId, reason) {
    const m = squad[casterIdx];
    m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'praying');
    squad.forEach(a => { a.statusEffects = a.statusEffects.filter(ef => !(ef.type === 'pray_blessing' && ef.sourceIndex === casterIdx)); });
    if (roomId) io.to(roomId).emit('prayEnd', { casterId: playerId, casterIdx, reason });
}
/** Thiên phú Thiên Thần Hộ Mệnh: đồng đội vừa chết -> Tu Sĩ còn sống (hết hồi) gửi thiên thần tới hồi sinh */
function onAllyDeath(dead, squad) {
    if (dead.summon) return;   // Golem triệu hồi: không được hồi sinh
    const now = curRoom?.clock ?? Date.now();
    const idx = squad.indexOf(dead);
    if (idx < 0) return;
    const pi = squad.findIndex(m => m.alive && m !== dead && talentOf(m, 'guardian_revive') && now >= (m.reviveReadyAt ?? 0));
    if (pi < 0) return;
    const priest = squad[pi], t = talentOf(priest, 'guardian_revive');
    priest.reviveReadyAt = now + t.cooldown;
    const roomId = curRoom?.id;
    const playerId = curRoom && Object.keys(curRoom.players).find(id => curRoom.players[id].squad === squad);
    if (roomId) io.to(roomId).emit('reviveStart', { casterId: playerId, casterIdx: pi, targetIdx: idx, flight: t.flight });
    later(t.flight, () => {
        if (dead.alive || !curRoom || curRoom.winner) return;
        dead.alive = true; dead.state = 'idle';
        dead.hp = Math.max(1, Math.round(dead.maxHp * t.value));
        dead.pendingDmg = 0; dead.queuedSkills = [];
        // Ấn Tử (noCleanse) KHÔNG mất khi hồi sinh — chỉ hết theo thời gian
        dead.statusEffects = dead.statusEffects.filter(ef => ef.noCleanse && ef.endTime > (curRoom?.clock ?? Date.now()) && ef.type !== 'judged');
        // Thiên Thần Hộ Mệnh: 2 giây bất tử ngay sau khi sống lại
        const tNow = curRoom?.clock ?? Date.now();
        if (t.invuln) dead.statusEffects.push({ type: 'revive_guard', endTime: tNow + t.invuln, duration: t.invuln });
        dead.actionUntil = 0; dead.castingSkillId = null;
        if (roomId) io.to(roomId).emit('revived', { casterId: playerId, casterIdx: pi, targetIdx: idx, hp: dead.hp });
    });
}

/** Thời gian diễn động tác của kỹ năng (ms trận) — khớp độ dài animation phía client */
function skillLock(skillDef, member, opponentData, now) {
    if (skillDef.type === 'melee_strike') {
        // khuỵu biến mất 0.32s -> mỗi mục tiêu bị Ấn 1 nhát (0.15s) -> hiện ra chém kết (0.46s)
        const sealed = opponentData.squad.filter(m => m.alive && m.statusEffects.some(ef => ef.type === 'seal' && now < ef.endTime)).length;
        return 380 + Math.max(1, sealed) * 150 + 460;
    }
    // Zerith lúc Đêm Tử Thần: Lưỡi Hái Hất Hồn bổ xuống thêm -> diễn lâu hơn
    if (skillDef.type === 'reaper_scythe' && reaperForm(member, now)) return skillDef.formImpact + skillDef.slamDelay + 350;
    return skillDef.lock ?? 0;
}

/** opts.free: dùng MIỄN PHÍ (không tốn Orb / máu, không đổi hồi chiêu) — VD Brakk còn 1 mình tự hoá khổng lồ */
function executeSkill(roomId, casterId, casterIdx, opponentId, skillIdx, opts = {}) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const skillDef = skillsOf(member)[skillIdx];
    const playerIds = Object.keys(room.players);
    const actualOpponentId = playerIds.find(id => id !== casterId); 
    const opponentData = room.players[actualOpponentId];
    const now = room.clock ?? Date.now();
    
    let effects = [];
    const extra = {};   // dữ liệu riêng cho hình ảnh (vị trí cầu lửa, cột lửa...)
    let isSpecialBackstab = false;
    curRoom = room;

    // Diễn động tác: đứng yên tới hết `lock`; HỒI CHIÊU bắt đầu tính sau khi diễn xong
    const lock = skillLock(skillDef, member, opponentData, now);
    member.actionUntil = now + lock;
    // đang Thánh Niệm: Kỹ năng 1 & 2 hồi chiêu ngắn (prayCooldown)
    let cdMs = (isPraying(member, now) && skillDef.prayCooldown) ? skillDef.prayCooldown : skillDef.cooldown;
    if (!room.players[casterId].debugNoMana && !opts.free) member.skillCooldowns[skillIdx] = now + lock + cdMs;
    if (opts.free) extra.free = true;

    const isStealth = member.statusEffects.some(ef => ef.type === 'stealth' && now < ef.endTime);

    // Đang Dựng Khiên mà dùng kỹ năng khác -> hạ khiên (mất luôn buff thủ của cả đội)
    let guardBroken = false;
    if (skillDef.type !== 'guard' && member.statusEffects.some(ef => ef.type === 'guard' && ef.endTime > now)) {
        guardBurst(roomId, casterId, casterIdx, actualOpponentId, now, true); // khiên hạ -> nổ lần cuối
        endGuard(room.players[casterId].squad, casterIdx);
        guardBroken = true;
    }

    // Brakk: kỹ năng tốn thêm MÁU (không bao giờ tự làm chết)
    if (skillDef.hpCost && !room.players[casterId].debugNoMana && !opts.free) {
        const cost = Math.round(member.maxHp * skillDef.hpCost);
        member.hp = Math.max(1, member.hp - cost);
        extra.hpCost = cost;
        checkBrakkBlood(member);
    }

    // Dash logic: Chain Dash through all sealed enemies
    if (skillDef.dash) {
        const sealedTargets = opponentData.squad
            .map((m, i) => ({ member: m, index: i }))
            .filter(obj => obj.member.alive && obj.member.statusEffects.some(ef => ef.type === 'seal' && now < ef.endTime));

        if (sealedTargets.length > 0) {
            // Determine Final Target: Lowest HP among sealed
            let finalTargetObj = sealedTargets[0];
            sealedTargets.forEach(obj => {
                if (obj.member.hp < finalTargetObj.member.hp) {
                    finalTargetObj = obj;
                } else if (obj.member.hp === finalTargetObj.member.hp) {
                    // Random tie-break
                    if (Math.random() > 0.5) finalTargetObj = obj;
                }
            });

            // Thứ tự lướt chém: máu NHIỀU trước -> máu ÍT sau; kết thúc (đứng lại) ở mục tiêu máu ít nhất
            sealedTargets.sort((a, b) => (b.member.hp - a.member.hp) || (a === finalTargetObj ? 1 : b === finalTargetObj ? -1 : 0));
            const last = sealedTargets.indexOf(finalTargetObj);
            if (last !== sealedTargets.length - 1) { sealedTargets.splice(last, 1); sealedTargets.push(finalTargetObj); }

            const finalTarget = finalTargetObj.member;
            
            // Teleport behind final target
            const dir = room.players[casterId].side === 'left' ? 1 : -1;
            member.x = finalTarget.x + (2.0 * dir); 
            member.z = finalTarget.z; 
            member.lockedTargetIndex = finalTargetObj.index;

            // Damage ALL sealed targets in the chain
            const chainHits = [];
            sealedTargets.forEach(obj => {
                const target = obj.member;
                const multiplier = skillDef.multiplier * 1.8; // Strong backstab for all sealed
                const result = calculateDamage(member, target, multiplier, now, { forceCrit: isStealth });
                const dmg = result.damage;
                // lướt chém lần lượt: vanish 320ms -> mỗi nhát cách 150ms
                if (dealDamage(target, dmg, opponentData, 380 + chainHits.length * 150)) extra.killed = true;
                chainHits.push({ targetIndex: obj.index, damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
            });

            effects = chainHits; // Use the chain as the effects
            isSpecialBackstab = true;
        } else {
            // Fallback: Dash behind best target (no seal bonus)
            const target = findBestTarget(member, opponentData.squad, now);
            if (target) {
                const dir = room.players[casterId].side === 'left' ? 1 : -1;
                member.x = target.x + (2.0 * dir); 
                member.z = target.z; 
                member.lockedTargetIndex = opponentData.squad.indexOf(target);
                
                const result = calculateDamage(member, target, skillDef.multiplier, now, { forceCrit: isStealth });
                const dmg = result.damage;
                if (dealDamage(target, dmg, opponentData, 380)) extra.killed = true;
                effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
            }
        }
    } else if (skillDef.type === 'taunt') {
        // Khiêu Khích: quái trong bán kính phải đánh người dùng
        opponentData.squad.forEach((enemy, i) => {
            if (!enemy.alive || Math.hypot(enemy.x - member.x, (enemy.z || 0) - (member.z || 0)) > skillDef.radius) return;
            enemy.statusEffects = enemy.statusEffects.filter(ef => ef.type !== 'taunted');
            enemy.statusEffects.push({ type: 'taunted', endTime: now + skillDef.duration, sourceIndex: casterIdx, defDown: skillDef.defDown ?? 0, by: member.name ?? 'Rok' });
            enemy.lockedTargetIndex = -1;
            // sát thương diện rộng của tiếng gầm
            const result = calculateDamage(member, enemy, skillDef.multiplier, now, { aoe: true });
            // sóng gầm bung ở 0.42s rồi lan ra: xa trúng sau
            const tauntDist = Math.hypot(enemy.x - member.x, (enemy.z || 0) - (member.z || 0));
            if (!result.isMiss) dealDamage(enemy, result.damage, opponentData, (skillDef.impact ?? 0) + tauntDist * 45);
            effects.push({ targetIndex: i, taunted: true, damage: result.damage, isCrit: result.isCrit, isBlock: result.isBlock, isMiss: result.isMiss,
                dist: Math.hypot(enemy.x - member.x, (enemy.z || 0) - (member.z || 0)) });
        });
    } else if (skillDef.type === 'shield_bash') {
        const target = (member.targetIndex >= 0 && opponentData.squad[member.targetIndex]?.alive)
            ? opponentData.squad[member.targetIndex] : findBestTarget(member, opponentData.squad, now);
        if (target) {
            // lao sát mục tiêu
            const dir = Math.sign(target.x - member.x) || 1;
            member.x = target.x - dir * 1.6;
            member.z = target.z;
            clampToArena(member);
            const result = calculateDamage(member, target, skillDef.multiplier, now);
            dealDamage(target, result.damage, opponentData, skillDef.impact ?? 0);
            target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'stun');
            target.statusEffects.push({ type: 'stun', endTime: now + (skillDef.impact ?? 0) + ccTime(target, skillDef.stun, now) });
            effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: result.damage, isCrit: result.isCrit, isBlock: result.isBlock, stunned: true });
        }
    } else if (skillDef.type === 'knockback') {
        // Quái trước mặt Rok: mục tiêu đang đánh, không có thì quái gần nhất
        let target = (member.targetIndex >= 0 && opponentData.squad[member.targetIndex]?.alive)
            ? opponentData.squad[member.targetIndex] : findBestTarget(member, opponentData.squad, now);
        if (target) {
            const ti = opponentData.squad.indexOf(target);
            const result = calculateDamage(member, target, skillDef.multiplier, now);
            dealDamage(target, result.damage, opponentData, skillDef.impact ?? 0);
            const dir = Math.sign(target.x - member.x) || (member.side === 'left' ? 1 : -1);
            const fromX = target.x;
            if (!ccImmune(target, now)) target.x += dir * skillDef.push;   // Khổng Lồ: không bị đẩy
            clampToArena(target);
            target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'knocked');
            // khựng lại từ lúc khiên sắp chạm -> bay ra sau -> đáp đất mới bị choáng
            const hitAt = now + (skillDef.impact ?? 0);
            target.statusEffects.push({ type: 'knocked', endTime: hitAt + skillDef.knockTime });
            if (skillDef.stun) {
                target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'stun');
                target.statusEffects.push({ type: 'stun', endTime: hitAt + skillDef.knockTime + ccTime(target, skillDef.stun, now) });
            }
            target.lastAttackTime = now; // đáp xuống rồi mới đánh tiếp
            // rơi xuống đất -> địa chấn nhẹ: choáng các đối thủ khác quanh chỗ rơi
            if (skillDef.quakeRadius && !result.isMiss) {
                const lx = target.x, lz = target.z || 0;
                later((skillDef.impact ?? 0) + skillDef.knockTime, () => {
                    const t = curRoom?.clock ?? now;
                    const hit = [];
                    opponentData.squad.forEach((e, i) => {
                        if (e === target || !e.alive || isJudged(e, t)) return;
                        if (Math.hypot(e.x - lx, (e.z || 0) - lz) > skillDef.quakeRadius) return;
                        applyStun(e, skillDef.quakeStun, t);
                        hit.push(i);
                    });
                    io.to(roomId).emit('rokFx', { kind: 'quake', casterId, casterIdx, targetId: actualOpponentId, x: lx, z: lz, radius: skillDef.quakeRadius, stunned: hit });
                });
            }
            effects.push({ targetIndex: ti, damage: result.damage, isCrit: result.isCrit, isBlock: result.isBlock, isMiss: result.isMiss,
                knockback: true, fromX, toX: target.x, toZ: target.z });
        }
    } else if (skillDef.type === 'snipe') {
        // Tiễn Gió Chớp: bắn MỤC TIÊU ĐANG NHẮM, chắc chắn chí mạng + xuyên giáp, đẩy lùi; hạ gục -> hoàn Orb + hồi chiêu
        const cur = opponentData.squad[member.targetIndex];
        const target = (cur?.alive && canBeTargeted(cur, now)) ? cur : findBestTarget(member, opponentData.squad, now);
        if (target) {
            const ti = opponentData.squad.indexOf(target);
            // bật nhảy lùi ra xa mục tiêu `backstep` đơn vị rồi bắn giữa không trung
            if (skillDef.backstep) {
                const away = Math.sign(member.x - target.x) || (member.side === 'left' ? -1 : 1);
                member.x += away * skillDef.backstep;
                clampToArena(member);
            }
            const eff = hitTarget(member, target, ti, opponentData, skillDef.multiplier, now,
                { forceCrit: true, penBonus: skillDef.penBonus, delay: skillDef.impact });
            const dir = Math.sign(target.x - member.x) || (member.side === 'left' ? 1 : -1);
            if (!eff.killed && !eff.isMiss && !ccImmune(target, now)) {
                target.x += dir * skillDef.push;
                clampToArena(target);
                target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'knocked');
                target.statusEffects.push({ type: 'knocked', endTime: now + (skillDef.impact ?? 0) + skillDef.knockTime });
                eff.knockback = true;
            }
            eff.toX = target.x; eff.toZ = target.z;
            if (eff.killed) {
                // hạ gục: hoàn lại Orb + hồi chiêu ngay
                if (!room.players[casterId].debugNoMana) member.mp = Math.min(member.maxMp, member.mp + skillDef.orbCost * ORB_COST);
                member.skillCooldowns[skillIdx] = now + (skillDef.lock ?? 0); // hồi chiêu ngay khi diễn xong
                eff.reset = true;
            }
            effects.push(eff);
        }
    } else if (skillDef.type === 'wind_spirit') {
        // Giơ cung gọi Vệ Thần (0.38s) -> Vệ Thần hiện ra, Lyra bay lên -> bay xong (lock) mới bắt đầu bắn.
        // 8 giây hiệu lực tính từ lúc bay lên xong.
        const squad = room.players[casterId].squad;
        later(skillDef.impact ?? 0, () => {
            const endTime = now + (skillDef.lock ?? 0) + skillDef.duration;
            member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'windspirit');
            member.statusEffects.push({ type: 'windspirit', endTime, duration: skillDef.duration,
                atkSpeedUp: skillDef.atkSpeedUp, atkUp: skillDef.atkUp, rangeUp: skillDef.rangeUp,
                critUp: skillDef.critUp, critDmgUp: skillDef.critDmgUp });
            // cả đội (còn sống) được gió dẫn đường: +chính xác
            squad.forEach(ally => {
                if (!ally.alive) return;
                ally.statusEffects = ally.statusEffects.filter(ef => ef.type !== 'wind_blessing');
                ally.statusEffects.push({ type: 'wind_blessing', endTime, duration: skillDef.duration, accUp: skillDef.teamAccUp ?? 0 });
            });
        });
        effects.push({ targetIndex: casterIdx, ally: true });
    } else if (skillDef.type === 'charged_shot') {
        // Thần Tiễn Phá Thiên (sau 2 giây gồng): loạt tên rơi NGẪU NHIÊN xuống các quái trong tầm.
        // Mỗi mũi chọn lại mục tiêu (quái chết giữa loạt thì mũi sau rơi sang con khác).
        const hasSpirit = member.statusEffects.some(ef => ef.type === 'windspirit' && ef.endTime > now);
        const volley = [];
        for (let k = 0; k < skillDef.arrows; k++) volley.push({ role: 'lyra', mult: skillDef.multiplier });
        if (hasSpirit) for (let k = 0; k < skillDef.spiritArrows; k++) volley.push({ role: 'spirit', mult: skillDef.spiritMultiplier });
        // tên lửa đuổi theo MỌI quái đang có (không giới hạn tầm): quái nào chưa trúng mũi nào được ưu tiên trước
        const pool = () => opponentData.squad.filter(m => canBeTargeted(m, now));
        const hitCount = new Map();
        volley.forEach((shot, order) => {
            const list = pool();
            if (!list.length) return;
            const fresh = list.filter(m => !hitCount.has(m));
            const from = fresh.length ? fresh : list;
            const t = from[Math.floor(Math.random() * from.length)];
            hitCount.set(t, (hitCount.get(t) ?? 0) + 1);
            const ti = opponentData.squad.indexOf(t);
            // mũi thứ `order` rời dây ở 0.16s + order×60ms, bay vòng cung ARC_FLIGHT ms
            // nhả dây (impact) -> xếp hàng sau lưng (formTime) -> phóng lần lượt (arrowGap) -> bay (arcFlight)
            const delay = (skillDef.impact ?? 0) + (skillDef.formTime ?? 0) + order * (skillDef.arrowGap ?? 60) + (skillDef.arcFlight ?? 450);
            effects.push({ ...hitTarget(member, t, ti, opponentData, shot.mult, now, { noBlock: true, delay }), role: shot.role, order });
        });
    } else if (skillDef.type === 'sky_fireball') {
        // ---- Thiên Hỏa Cầu: cầu lửa lớn rơi xuống chỗ quái đông nhất (nổ lúc impact). Thiên phú: 50% rơi thêm quả 2 (70%) ----
        const c = bestCluster(member, opponentData.squad, skillDef.castRange, skillDef.radius, now);
        if (c) {
            const burn = { ticks: skillDef.burnTicks, gap: skillDef.burnGap };
            // 1 quả cầu: nổ chính lúc `at`, rồi biển lửa cháy `burnTicks` lần (mỗi burnGap)
            const drop = (x, z, at, power, kind, radius) => {
                later(at, () => fireAoe(roomId, casterId, casterIdx, actualOpponentId, x, z, radius, skillDef.multiplier * power, kind));
                for (let k = 1; k <= skillDef.burnTicks; k++)
                    later(at + k * skillDef.burnGap, () => fireAoe(roomId, casterId, casterIdx, actualOpponentId, x, z, radius, skillDef.burnMultiplier * power, 'burn'));
            };
            extra.balls = [{ x: c.x, z: c.z, at: skillDef.impact, radius: skillDef.radius, burn }];
            drop(c.x, c.z, skillDef.impact, 1, 'meteor', skillDef.radius);
            // quả cầu nhỏ: thiên phú 1 (50%); lúc Hỏa Thần tăng lên godTwinChance (80%) — chưa có thiên phú vẫn có 50% lúc Hỏa Thần
            const twinT = talentOf(member, 'twin_meteor');
            const god = inFireGod(member, now);
            const twin = twinT ?? (god ? { chance: 0.5, ratio: 0.7 } : null);
            const chance = twinT && god ? (skillDef.godTwinChance ?? twinT.chance) : twin?.chance;
            if (twin && Math.random() < chance) {
                const x2 = c.x + (Math.random() - 0.5) * 3, z2 = c.z + (Math.random() - 0.5) * 2, at2 = skillDef.impact + 320, r2 = skillDef.radius * 0.75;
                extra.balls.push({ x: x2, z: z2, at: at2, second: true, radius: r2, burn });
                drop(x2, z2, at2, twin.ratio, 'meteor2', r2);
            }
        }
    } else if (skillDef.type === 'fire_pillar') {
        // ---- Cột Lửa Phá Ma: cột lửa bùng `hits` lần tại chỗ quái, mỗi lần trúng -> +1 tầng phá giáp phép ----
        const c = bestCluster(member, opponentData.squad, skillDef.castRange, skillDef.radius, now);
        if (c) {
            // lúc Hỏa Thần: vòng phép hiện nhanh hơn (godCircleTime) và cột lửa mạnh hơn (+godDmgUp)
            const god = inFireGod(member, now);
            const circleTime = god ? skillDef.godCircleTime : skillDef.circleTime;
            const impact = skillDef.impact - skillDef.circleTime + circleTime;
            const tickMult = skillDef.tickMultiplier * (god ? 1 + skillDef.godDmgUp : 1);
            const hits = skillDef.hits + (talentOf(member, 'twin_meteor')?.pillarExtra ?? 0);   // Thiên Hỏa Song Tinh: +3 lần bùng
            extra.pillar = { x: c.x, z: c.z, at: impact, hits, gap: skillDef.tickGap, radius: skillDef.radius, circleTime, empowered: god };
            for (let k = 0; k < hits; k++) {
                later(impact + k * skillDef.tickGap, () => fireAoe(roomId, casterId, casterIdx, actualOpponentId, c.x, c.z,
                    skillDef.radius, tickMult, 'pillar', (enemy) => {
                        const t = curRoom?.clock ?? now;
                        let b = enemy.statusEffects.find(ef => ef.type === 'mdef_break' && ef.endTime > t);
                        if (!b) { b = { type: 'mdef_break', stacks: 0, per: skillDef.mDefDown, maxStacks: skillDef.maxStacks }; enemy.statusEffects.push(b); }
                        b.stacks = Math.min(skillDef.maxStacks, b.stacks + 1);
                        b.endTime = t + skillDef.breakDuration; b.duration = skillDef.breakDuration;
                    }));
            }
        }
    } else if (skillDef.type === 'fire_god') {
        // ---- Hỏa Thần Giáng Lâm (đã gồng xong): hộ vệ hiện ra, 15s tính từ lúc diễn xong ----
        later(skillDef.impact ?? 0, () => {
            const t = curRoom?.clock ?? now;
            member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'fire_god');
            member.statusEffects.push({ type: 'fire_god', endTime: now + lock + skillDef.duration, duration: skillDef.duration,
                mAtkUp: skillDef.mAtkUp, mDefUp: skillDef.mDefUp, ccResist: skillDef.ccResist, count: 0, nextThrow: t + 900 });
        });
        effects.push({ targetIndex: casterIdx, ally: true });
    } else if (skillDef.type === 'reaper_dash') {
        // ---- Lưỡi Hái Xuyên Hồn: chọn ĐƯỜNG LƯỚT tốt nhất (tối đa dashLen): xuyên được nhiều quái nhất,
        //      ưu tiên đích là tướng đánh xa / yếu máu ở hàng sau; dừng ngay SAU LƯNG mục tiêu cuối (không lướt lố) ----
        const plan = planReaperDash(member, opponentData.squad, skillDef, now);
        const from = { x: member.x, z: member.z || 0 };
        const to = plan.to;
        const len = Math.hypot(to.x - from.x, to.z - from.z) || 1;
        const ux = (to.x - from.x) / len, uz = (to.z - from.z) / len;
        plan.hits.forEach(({ e, i, along }) => {
            const delay = Math.round(skillDef.impact + skillDef.dashTime * Math.max(0, Math.min(1, along / len)));
            effects.push({ ...hitTarget(member, e, i, opponentData, skillDef.multiplier, now, { delay, aoe: true }), delay, seg: 0 });
        });
        extra.path = [{ fromX: from.x, fromZ: from.z, toX: to.x, toZ: to.z, at: skillDef.impact, time: skillDef.dashTime }];
        member.x = to.x; member.z = to.z;
        clampToArena(member);
        // lướt xong: tự chọn lại mục tiêu GẦN NHẤT (không khoá mục tiêu cũ)
        member.lockedTargetIndex = -1;
        member.targetIndex = plan.end ? opponentData.squad.indexOf(plan.end) : -1;
    } else if (skillDef.type === 'reaper_scythe') {
        // ---- Lưỡi Hái Hất Hồn: lưỡi hái khổng lồ quét lên, hất tung quái phía trước (Đêm Tử Thần: hiện ngay + bổ xuống thêm) ----
        const squad = opponentData.squad;
        const cur = squad[member.targetIndex];
        const target = cur?.alive ? cur : findBestTarget(member, squad, now);
        const dir = target ? (Math.sign(target.x - member.x) || 1) : (member.side === 'left' ? 1 : -1);
        const form = !!reaperForm(member, now);
        const impact = form ? skillDef.formImpact : skillDef.impact;
        const slamAt = impact + skillDef.slamDelay;
        squad.forEach((e, i) => {
            if (!e.alive) return;   // diện rộng: trúng cả người tàng hình
            const fx = (e.x - member.x) * dir;
            if (fx < -1 || Math.hypot(e.x - member.x, (e.z || 0) - (member.z || 0)) > (form ? skillDef.formRadius : skillDef.radius)) return;
            // Đêm Tử Thần: Lưỡi Hái Hất Hồn PHÁ SẠCH KHIÊN mục tiêu mang Ấn Tử (cả nhát hất lên lẫn nhát bổ xuống)
            const eff = hitTarget(member, e, i, opponentData, skillDef.multiplier, now, { delay: impact, aoe: true, breakShield: form });
            if (!eff.isMiss) later(impact, () => knockUp(e, skillDef.knockup));
            effects.push({ ...eff, knockup: !eff.isMiss });
            if (form) effects.push({ ...hitTarget(member, e, i, opponentData, skillDef.slamMultiplier, now, { delay: slamAt, noBlock: true, aoe: true, breakShield: true }), slam: true });
        });
        extra.dir = dir; extra.form = form; extra.impact = impact; extra.slamAt = slamAt; extra.radius = form ? skillDef.formRadius : skillDef.radius;
    } else if (skillDef.type === 'reaper_night') {
        // ---- Đêm Tử Thần (đã niệm xong): Hộ Vệ Thần Chết hiện ra, Zerith bay lên; 10s tính từ lúc diễn xong ----
        later(skillDef.impact ?? 0, () => {
            const t = curRoom?.clock ?? now;
            member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'reaper_form');
            member.statusEffects.push({ type: 'reaper_form', endTime: now + lock + skillDef.duration, duration: skillDef.duration,
                dmgUp: skillDef.dmgUp, atkSpeedUp: skillDef.atkSpeedUp, ccResist: skillDef.ccResist, nextSlash: t + 700 });
            member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'stun' && ef.type !== 'knockup');
        });
        effects.push({ targetIndex: casterIdx, ally: true });
    } else if (skillDef.type === 'brakk_grab') {
        // ---- Bá Vương Quật: túm quái trước mặt -> nhảy vọt -> quật xuống 1 điểm cố định phía trước (leap) ----
        const squad = opponentData.squad;
        const cur = squad[member.targetIndex];
        const target = (cur?.alive && canBeTargeted(cur, now)) ? cur : findBestTarget(member, squad, now);
        const dir = target ? (Math.sign(target.x - member.x) || 1) : (member.side === 'left' ? 1 : -1);
        const giant = !!giantForm(member, now);
        const fromX = member.x, fromZ = member.z || 0;
        member.x += dir * skillDef.leap;
        clampToArena(member);
        const landX = member.x, landZ = member.z || 0;
        const slamX = landX + dir * 1.3;   // mục tiêu bị quật nằm ngay trước mặt Brakk
        const mult = skillDef.multiplier * (giant ? 1 + skillDef.giantDmgUp : 1);
        const aoeMult = skillDef.aoeMultiplier * (giant ? 1 + skillDef.giantDmgUp : 1);
        const radius = giant ? skillDef.giantRadius : skillDef.radius;
        let grabbed = null;
        if (target) {
            const ti = squad.indexOf(target);
            const carry = ccTime(target, 1000, now) > 0;   // mục tiêu đang miễn khống chế (Khổng Lồ) -> không túm được, chỉ ăn đòn
            const tFromX = target.x, tFromZ = target.z || 0;
            if (carry) {
                target.x = slamX; target.z = landZ;
                clampToArena(target);
                // bị túm bay lên: không làm gì được tới lúc chạm đất, chạm đất CHOÁNG thêm `stun`
                target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'grabbed');
                target.statusEffects.push({ type: 'grabbed', endTime: now + skillDef.impact, debuff: true });
                target.statusEffects.push({ type: 'stun', endTime: now + skillDef.impact + ccTime(target, skillDef.stun, now) });
                target.lockedTargetIndex = -1;
            }
            const eff = hitTarget(member, target, ti, opponentData, mult, now, { delay: skillDef.impact, noBlock: true });
            grabbed = { ...eff, grab: carry, fromX: tFromX, fromZ: tFromZ, toX: target.x, toZ: target.z || 0, stunned: carry };
            effects.push(grabbed);
            member.lockedTargetIndex = -1;
            member.targetIndex = ti;
        }
        // chấn động lúc chạm đất: mọi quái khác quanh điểm quật
        const cx = target && grabbed?.grab ? target.x : landX + dir * 1.3;
        squad.forEach((e, i) => {
            if (!e.alive || e === target) return;
            if (Math.hypot(e.x - cx, (e.z || 0) - landZ) > radius) return;
            effects.push({ ...hitTarget(member, e, i, opponentData, aoeMult, now, { delay: skillDef.impact, aoe: true }), shock: true });
        });
        extra.leap = { fromX, fromZ, toX: landX, toZ: landZ };
        extra.slam = { x: cx, z: landZ };
        extra.dir = dir; extra.giant = giant; extra.radius = radius; extra.impact = skillDef.impact;
    } else if (skillDef.type === 'brakk_stomp') {
        // ---- Chấn Địa (đã niệm): nhảy lên dậm xuống, hất tung quanh mình + khiên theo máu HIỆN CÓ ----
        const giant = !!giantForm(member, now);
        const ku = skillDef.knockup;
        opponentData.squad.forEach((e, i) => {
            if (!e.alive || Math.hypot(e.x - member.x, (e.z || 0) - (member.z || 0)) > skillDef.radius) return;
            const eff = hitTarget(member, e, i, opponentData, skillDef.multiplier, now, { delay: skillDef.impact, aoe: true });
            const up = !eff.isMiss && ccTime(e, ku, now) > 0;
            if (!eff.isMiss) later(skillDef.impact, () => knockUp(e, ku));
            effects.push({ ...eff, knockup: up });
            // Khổng Lồ: rơi xuống đất chịu thêm sát thương
            if (giant && up) effects.push({ ...hitTarget(member, e, i, opponentData, skillDef.fallMultiplier, now,
                { delay: skillDef.impact + ccTime(e, ku, now), noBlock: true, aoe: true }), fall: true });
        });
        const amount = Math.round(member.hp * skillDef.shieldPct);
        later(skillDef.impact, () => {
            const t = curRoom?.clock ?? now;
            brakkShield(member, amount, skillDef.shieldTime, t, true);
        });
        extra.shield = amount; extra.giant = giant; extra.radius = skillDef.radius; extra.impact = skillDef.impact; extra.knockup = ku;
    } else if (skillDef.type === 'brakk_giant') {
        // ---- Thần Lực Khổng Lồ: hoá khổng lồ 10s (tính từ lúc diễn xong), 5s đầu miễn mọi hiệu ứng bất lợi ----
        later(skillDef.impact ?? 0, () => {
            const t = curRoom?.clock ?? now;
            endGiant(member);   // dùng lại khi đang khổng lồ: trả máu cũ trước rồi tính lại
            const bonus = Math.round(member.maxHp * skillDef.hpUp);
            member.maxHp += bonus;
            member.hp = Math.min(member.maxHp, member.hp + bonus);
            member.giantBonus = bonus;
            member.statusEffects.push({ type: 'giant_form', endTime: now + lock + skillDef.duration, duration: skillDef.duration,
                defUp: skillDef.defUp, dmgUp: skillDef.dmgUp, immuneUntil: now + lock + skillDef.ccImmune, autos: 0,
                every: skillDef.upliftEvery, upliftMultiplier: skillDef.upliftMultiplier, push: skillDef.upliftPush, upTime: skillDef.upliftTime });
            cleanse(member, 'all');
            member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'knockup' && ef.type !== 'grabbed');
        });
        extra.duration = skillDef.duration; extra.immune = skillDef.ccImmune;
        effects.push({ targetIndex: casterIdx, ally: true });
    } else if (skillDef.type === 'elem_book') {
        // ---- Elarion: Sách Nguyên Tố đọc 3 viên đang giữ -> phép vào nút KN2 (mất 3 viên) ----
        const key = SPELL_BY_RECIPE[recipeOf(member.held ?? [])];
        if ((member.held?.length ?? 0) >= 3 && key) {
            extra.recipe = [...member.held];
            member.held = [];
            setSpell(member, key, now);
            extra.spell = key; extra.spellName = member.spells[key].name;
        }
    } else if (skillDef.type === 'elem_spell') {
        // ---- Elarion: phép đang giữ ----
        member.spellCd ??= {};
        member.spellCd[skillDef.spell] = now + lock + skillDef.cooldown;
        member.spellDiscount = false;
        castElemSpell(room, casterId, casterIdx, actualOpponentId, skillDef, now, effects, extra);
        clearSpell(member);   // dùng xong là mất phép — phải ghép lại bằng Sách
    } else if (skillDef.type === 'elem_storm') {
        // ---- Elarion: Bão Nguyên Tố — ngọc trên sân đủ 7 viên ngay, 7s cứ bớt là tung thêm ----
        member.gems ??= [];
        putEffect(member, { type: 'elem_storm', endTime: now + skillDef.duration, duration: skillDef.duration, fill: skillDef.fill });   // ngọc luôn đủ 7 viên trong 7s
        const ts = timeScaleOf(room);
        while (member.gems.length < skillDef.fill) if (!spawnGem(member, now, ts, true)) break;
        member.stormNext = now + 120;
        extra.duration = skillDef.duration;
        // +2 Orb ngay (thực tốn 1 Orb)
        if (skillDef.orbGain) {
            if (!room.players[casterId].debugNoMana) member.mp = Math.min(member.maxMp, member.mp + skillDef.orbGain * ORB_COST);
            extra.orbGain = skillDef.orbGain;
        }
    } else if (skillDef.type?.startsWith('golem_')) {
        castGolemSkill(room, casterId, casterIdx, actualOpponentId, skillDef, now, effects, extra);
    } else if (DANCE_TYPES.has(skillDef.type)) {
        // ---- Nerissa: bắt đầu 1 điệu múa (chạy song song với các điệu đang múa) ----
        startDance(roomId, casterId, casterIdx, actualOpponentId, skillIdx, now);
        extra.danceKey = member.danceKey;
        // Thủy Thần Vũ: cả đội +2 Orb ngay
        if (skillDef.teamOrbs) {
            const team = room.players[casterId];
            team.squad.forEach(a => { if (a.alive && !a.summon && !team.debugNoMana) a.mp = Math.min(a.maxMp, a.mp + skillDef.teamOrbs * ORB_COST); });
            io.to(roomId).emit('waterFx', { kind: 'gift', casterId, casterIdx, orbs: skillDef.teamOrbs });
        }
        effects.push({ targetIndex: casterIdx, ally: true });
    } else if (skillDef.type === 'heal' || skillDef.type === 'holy_shield') {
        // ---- Tu Sĩ: hồi máu / khiên. Bình thường 1 người (yếu máu nhất; đầu trận -> nhiều máu nhất), đang niệm -> cả đội ×2 ----
        const squad = room.players[casterId].squad;
        const praying = isPraying(member, now);
        const grace = talentOf(member, 'grace');
        const boost = (1 + (grace?.value ?? 0)) * (praying ? 2 : 1);
        const mAtk = getEffectiveStats(member, now).stats.mAtk;
        const targets = praying ? squad.map((m, i) => ({ m, i })).filter(o => o.m.alive) : [supportTarget(squad)].filter(Boolean);
        // đang niệm: thiên thần nhỏ bay tới từng người rồi mới hồi
        const delay = (skillDef.impact ?? 0) + (praying ? (skillDef.angelFlight ?? 0) : 0);
        targets.forEach(({ m, i }, k) => {
            const d = delay + (praying ? k * 90 : 0);
            if (skillDef.type === 'heal') {
                const amount = Math.round(mAtk * skillDef.heal * boost);
                later(d, () => {
                    if (!m.alive) return;
                    healUnit(m, amount, curRoom?.clock ?? now);
                    cleanse(m, praying || !!grace ? 'all' : 'stun');
                });
                effects.push({ targetIndex: i, ally: true, heal: Math.round(amount * (1 - healCutOf(m, now))), angel: praying });   // số hiện = đã trừ Ấn Tử
            } else {
                const hp = Math.round(mAtk * skillDef.shieldHp * boost);
                later(d, () => {
                    if (!m.alive) return;
                    const t = curRoom?.clock ?? now;
                    addShield(m, { type: 'holy_shield', endTime: t + skillDef.duration, duration: skillDef.duration, hp, maxHp: hp,
                        winged: praying, defUp: praying ? skillDef.prayDefUp : 0, ccResist: praying ? skillDef.prayCcResist : 0 }, t);
                    if (grace) cleanse(m, 'all');
                });
                effects.push({ targetIndex: i, ally: true, shield: hp, winged: praying });
            }
        });
    } else if (skillDef.type === 'pray') {
        // ---- Thánh Niệm: bay lên niệm (bắt đầu lúc giơ gậy xong) ----
        const squad = room.players[casterId].squad;
        const grace = talentOf(member, 'grace');
        member.skillCooldowns[0] = now; member.skillCooldowns[1] = now;   // hồi ngay Kỹ năng 1 & 2
        later(skillDef.impact ?? 0, () => {
            const t = curRoom?.clock ?? now;
            const end = t + skillDef.duration;
            member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'praying');
            member.statusEffects.push({ type: 'praying', endTime: end, duration: skillDef.duration });
            squad.forEach(a => {
                if (!a.alive) return;
                a.statusEffects = a.statusEffects.filter(ef => !(ef.type === 'pray_blessing' && ef.sourceIndex === casterIdx));
                a.statusEffects.push({ type: 'pray_blessing', endTime: end, duration: skillDef.duration, dmgUp: skillDef.dmgUp,
                    defUp: grace?.defUp ?? 0, sourceIndex: casterIdx });
            });
        });
        effects.push({ targetIndex: casterIdx, ally: true, pray: true });
    } else if (skillDef.type === 'guard') {
        endGuard(room.players[casterId].squad, casterIdx);
        const gHp = Math.round(skillDef.shieldPct ? member.maxHp * skillDef.shieldPct : skillDef.shieldHp);
        addShield(member, { type: 'guard', endTime: now + skillDef.duration,
            hp: gHp, maxHp: gHp, absorbed: 0, bursts: 0, burstEvery: gHp / (skillDef.burstCount ?? 6) }, now);   // khiên đặc trưng: luôn dùng khiên của Chiến Binh
        effects.push({ targetIndex: casterIdx, ally: true });
        // Cả đội +20% P.DEF / M.DEF trong lúc khiên dựng
        room.players[casterId].squad.forEach((ally, i) => {
            if (!ally.alive) return;
            ally.statusEffects.push({ type: 'guard_aura', endTime: now + skillDef.duration, value: skillDef.teamDef ?? 0.2, sourceIndex: casterIdx });
            if (i !== casterIdx) effects.push({ targetIndex: i, ally: true, aura: true });
        });
    } else if (skillDef.type === 'fortress') {
        // Thành Trì: cả đội (còn sống) nhận hiệu ứng giảm sát thương
        room.players[casterId].squad.forEach((ally, i) => {
            if (!ally.alive) return;
            ally.statusEffects = ally.statusEffects.filter(ef => ef.type !== 'fortress');
            ally.statusEffects.push({ type: 'fortress', endTime: now + skillDef.duration, reduce: skillDef.reduce });
            effects.push({ targetIndex: i, ally: true });
        });
    } else if (skillDef.type === 'stealth') {
        member.statusEffects = member.statusEffects.filter(ef => ef.type !== 'stealth'); // Reset timer if casted again
        member.statusEffects.push({ type: 'stealth', endTime: now + 5000 });
        effects.push({ targetIndex: casterIdx, isStealth: true });
        // Sấm phù trợ: các đồng đội KHÁC +20% né tránh trong lúc Jessica tàng hình
        room.players[casterId].squad.forEach((ally, i) => {
            if (i === casterIdx || !ally.alive) return;
            ally.statusEffects = ally.statusEffects.filter(ef => ef.type !== 'thunder_blessing');
            ally.statusEffects.push({ type: 'thunder_blessing', endTime: now + 5000, dodgeUp: skillDef.teamDodgeUp ?? 200 });
        });
    } else if (skillDef.type === 'aoe_damage') {
        opponentData.squad.forEach((enemy, i) => {
            if (enemy.alive) {
                const result = calculateDamage(member, enemy, skillDef.multiplier, now);
                const dmg = result.damage;
                
                dealDamage(enemy, dmg, opponentData, skillDef.impact ?? 0);
                effects.push({ targetIndex: i, damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
            }
        });
    } else if (skillDef.type === 'projectile') {
        // Nhảy lùi trước khi quăng (Phóng Bùa): lùi ra xa phía địch `backstep` đơn vị
        if (skillDef.backstep) {
            const foe = findLowestHpTarget(opponentData.squad, now) ?? opponentData.squad.find(m => m.alive);
            const away = foe ? Math.sign(member.x - foe.x) || (member.side === 'left' ? -1 : 1) : (member.side === 'left' ? -1 : 1);
            member.x += away * skillDef.backstep;
            clampToArena(member);
        }
        const createHit = (target) => {
            const result = calculateDamage(member, target, skillDef.multiplier, now);
            const dmg = result.damage;
            
            // APPLY SEAL
            target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'seal');
            target.statusEffects.push({ type: 'seal', endTime: now + 7000 });

            // bùa bay: quăng ở 0.42s (nhảy lùi) / 0.2s (tại chỗ), mỗi lá cách 120ms, bay 200ms
            dealDamage(target, dmg, opponentData, (skillDef.backstep ? 420 : 200) + 200 + effects.length * 120);
            effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: dmg, isCrit: result.isCrit, isBlock: result.isBlock });
        };

        if (isStealth) {
            let targetable = opponentData.squad.filter(m => canBeTargeted(m, now));
            if (targetable.length > 0) {
                targetable.sort((a, b) => a.hp === b.hp ? Math.random() - 0.5 : a.hp - b.hp);
                createHit(targetable[0]); // First lowest
                if (targetable.length > 1) {
                    createHit(targetable[1]); // Second lowest
                } else {
                    createHit(targetable[0]); // If only 1 exists, hit it twice
                }
            }
        } else {
            const target = findLowestHpTarget(opponentData.squad, now);
            if (target) createHit(target);
        }
    }

    // Đột Kích (Jessica) chém chết -> hồi chiêu chỉ còn killReset (1s) sau khi diễn xong
    if (extra.killed && skillDef.killReset && !room.players[casterId].debugNoMana) {
        member.skillCooldowns[skillIdx] = now + lock + skillDef.killReset;
        extra.reset = true;
    }
    // Thiên phú Thiên Tài Nguyên Tố (Elarion): ghép phép bằng Sách -> có thể giảm 1 Orb cho phép kế tiếp
    if (skillDef.type === 'elem_book' && extra.spell) {
        const gt = talentOf(member, 'elem_genius');
        if (gt && Math.random() < gt.value) { member.spellDiscount = true; extra.genius = true; }
    }
    io.to(roomId).emit('skillExecuted', {
        casterId, casterIdx, skillIdx, type: skillDef.type, dash: skillDef.dash, hp: member.hp, maxHp: member.maxHp, 
        newX: member.x, newZ: member.z, effects, isBackstab: isSpecialBackstab, guardBroken, ...extra
    });
    // Thiên phú Khí Thế Đấu Trường (Brakk): đếm chiêu của 2 phe
    brakkRallyCount(room, casterId, now);
    // Elarion: đồng đội dùng 5 kỹ năng / đối thủ dùng 10 kỹ năng -> +1 ngọc ngẫu nhiên
    elemGemGift(room, casterId, casterIdx, now);
}

// ============================================================
// LOGIC THEO ANIMATION: sát thương / hiệu ứng chỉ xảy ra đúng lúc đòn CHẠM (khớp với hình phía client)
//   impact (ms trận): từ lúc ra chiêu tới lúc chạm      lock (ms): thời gian diễn động tác (đứng yên, không đánh)
//   Hồi chiêu và thời lượng buff bắt đầu tính SAU KHI diễn xong động tác.
// ============================================================
let curRoom = null; // phòng đang xử lý (đặt ở đầu mỗi tick / executeSkill)
/** Hẹn 1 việc sau `delay` ms trận (0 = làm ngay) */
function later(delay, fn) {
    if (!curRoom || !(delay > 0)) return fn();
    (curRoom.pending ??= []).push({ at: (curRoom.clock ?? Date.now()) + delay, fn });
}
/** Chạy các việc đã tới giờ */
function runPending(room, now) {
    if (!room.pending?.length) return;
    const due = room.pending.filter(p => p.at <= now);
    if (!due.length) return;
    room.pending = room.pending.filter(p => p.at > now);
    const prev = curRoom; curRoom = room;
    due.sort((a, b) => a.at - b.at).forEach(p => p.fn(now));
    curRoom = prev;
}
/** Trừ máu lúc đòn chạm. Trả về true nếu đòn này (cộng các đòn đang bay) sẽ hạ gục mục tiêu */
/** Thiên phú Kiên Cường: đếm đòn nhận vào, đủ số đòn -> bật trong `duration` */
function onHitTaken(target) {
    const src = rokTalentFor(target, 'tenacity_trigger');   // Rok hoặc người được Rok nối dây
    const t = src?.t;
    if (!t || !target.alive) return;
    const now = curRoom?.clock ?? Date.now();
    if (now < (target.tenacityReadyAt ?? 0)) return; // đang bật hoặc đang hồi: không đếm
    target.hitsTaken = (target.hitsTaken ?? 0) + 1;
    if (target.hitsTaken >= t.hits) {
        target.hitsTaken = 0;
        target.statusEffects.push({ type: 'tenacity_on', endTime: now + t.duration, duration: t.duration,
            value: t.value * src.mult, cap: src.mult > 1 ? 500 : undefined });
        target.tenacityReadyAt = now + t.duration + (t.cooldown ?? 0);
    }
}

function dealDamage(target, dmg, oppData, delay = 0, after) {
    if (dmg > 0) later(delay, () => onHitTaken(target));
    if (oppData.debugGodMode || !(dmg > 0)) { if (after) later(delay, after); return false; }
    target.pendingDmg = (target.pendingDmg || 0) + dmg;
    const willKill = target.hp - target.pendingDmg <= 0 && !reaperForm(target, curRoom?.clock ?? Date.now());
    later(delay, () => {
        target.pendingDmg = Math.max(0, (target.pendingDmg || 0) - dmg);
        const tt = curRoom?.clock ?? Date.now();
        if (target.alive && !isJudged(target, tt) && !hasReviveGuard(target, tt)) {
            let hp = target.hp - dmg;
            // Đêm Tử Thần: Zerith không thể chết (máu tối thiểu 1)
            if (hp <= 0 && reaperUndying(target)) hp = 1;
            target.hp = Math.max(0, hp);
            if (target.hp === 0) killMember(target, oppData.squad);
            else afterHpLoss(target);
        }
        after?.();
    });
    return willKill;
}

/** Gây sát thương 1 phát lên mục tiêu (tôn trọng bất tử debug), trả về effect cho client. opts.delay = ms tới lúc chạm */
function hitTarget(attacker, target, targetIndex, oppData, multiplier, now, opts = {}) {
    const r = calculateDamage(attacker, target, multiplier, now, { isSkill: true, ...opts });
    const killed = !r.isMiss && dealDamage(target, r.damage, oppData, opts.delay ?? 0, r.isMiss ? null : executeHook(attacker, target));
    // hút máu (Devil...) lúc đòn chạm
    const ls = getEffectiveStats(attacker, now).stats.lifesteal ?? 0;
    if (!r.isMiss && ls > 0 && r.damage > 0) later(opts.delay ?? 0, () => { if (attacker.alive) healUnit(attacker, r.damage * ls / 1000, curRoom?.clock ?? now); });
    return { targetIndex, damage: r.damage, isCrit: r.isCrit, isBlock: r.isBlock, isMiss: r.isMiss, isMagic: r.isMagic, absorbed: r.absorbed || 0, killed };
}

/**
 * Xạ Thủ sau mỗi đòn đánh thường:
 *   - Vệ Thần Gió (đang có Thần Phong Giáng Thế) bắn phụ 1 mũi vào cùng mục tiêu (×spiritMultiplier)
 *   - Nội tại Phong Tiễn: cứ `every` mũi -> 1 mũi tên gió XUYÊN mọi quái phía trước (Vệ Thần cũng bắn mũi xuyên ×0.5)
 */
function archerExtraShots(roomId, casterId, casterIdx, opponentId, targetIdx, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const def = CLASS_DEFS[member.classId];
    const passive = talentOf(member, 'wind_pierce');
    if (!passive) return;
    const opp = room.players[opponentId];
    const spirit = member.statusEffects.find(ef => ef.type === 'windspirit' && ef.endTime > now);
    const spiritDef = skillsOf(member).find(sk => sk.type === 'wind_spirit');
    const shots = [];
    const target = opp.squad[targetIdx];
    if (spirit && target?.alive) {
        shots.push({ by: 'spirit', kind: 'single', effects: [hitTarget(member, target, targetIdx, opp, spiritDef.spiritMultiplier, now,
            { delay: 120 + shots.length * 110 + 200 })] });
    }
    member.autoCount = (member.autoCount ?? 0) + 1;
    if (member.autoCount % passive.every === 0) {
        const dir = target ? (Math.sign(target.x - member.x) || 1) : (member.side === 'left' ? 1 : -1);
        const line = () => opp.squad
            .map((e, i) => ({ e, i }))
            .filter(({ e }) => e.alive && (e.x - member.x) * dir > -0.5 && Math.abs(e.x - member.x) <= passive.range);
        // mũi gió xuyên quét ngang 14 đơn vị trong 320ms: quái xa trúng sau
        const sweep = (k) => ({ e }) => 120 + k * 110 + (Math.abs(e.x - member.x) / passive.range) * 320;
        let k = shots.length;
        shots.push({ by: 'lyra', kind: 'pierce', dir, effects: line().map(o => hitTarget(member, o.e, o.i, opp, passive.multiplier, now, { delay: sweep(k)(o), aoe: true, noHawk: true })) });
        k = shots.length;
        if (spirit) shots.push({ by: 'spirit', kind: 'pierce', dir, effects: line().map(o => hitTarget(member, o.e, o.i, opp, passive.multiplier * 0.5, now, { delay: sweep(k)(o), aoe: true, noHawk: true })) });
    }
    if (shots.length) io.to(roomId).emit('archerShots', { casterId, casterIdx, targetIndex: targetIdx, shots });
}

// ============================================================
// PHÙ THỦY LỬA (Ignar)
// ============================================================
/** Choáng `ms` (đã trừ Kiên Cường); không rút ngắn choáng dài hơn đang có */
function applyStun(enemy, ms, now) {
    const end = now + ccTime(enemy, ms, now);
    const cur = enemy.statusEffects.find(ef => ef.type === 'stun' && ef.endTime > now);
    if (!cur) enemy.statusEffects.push({ type: 'stun', endTime: end });
    else cur.endTime = Math.max(cur.endTime, end);
}
// ------------------------------------------------------------
// ĐỘI HÌNH & THẢ DIỀU cho tướng đánh xa (tầm >= 6)
// ------------------------------------------------------------
const isRanged = (m) => (m.atkRange ?? 0) >= 6;
/** Đánh xa không tiến lên trước hàng cận chiến của đội mình (giữ khoảng cách 2 đơn vị phía sau) */
function holdFormation(member, squad) {
    if (!isRanged(member)) return;
    const dir = member.side === 'left' ? 1 : -1;
    const front = squad.filter(m => m.alive && m !== member && !isRanged(m));
    if (!front.length) return;
    const frontX = dir > 0 ? Math.max(...front.map(m => m.x)) : Math.min(...front.map(m => m.x));
    const limit = frontX - dir * 2;
    if ((member.x - limit) * dir > 0) member.x = limit;
}
/** Quái / tướng cận chiến áp sát (< 40% tầm, tối thiểu 4) -> lùi về phía sau. Trả về true nếu đã lùi */
const KITE_ENABLED = false;   // tắt: tướng đánh xa KHÔNG tự bỏ chạy khi bị áp sát (sau này sẽ có kỹ năng riêng để tránh áp sát)
function kiteAway(member, enemies, step, now) {
    if (!KITE_ENABLED) return false;
    if (!isRanged(member) || now < (member.actionUntil ?? 0)) return false;
    if (member.statusEffects.some(ef => (ef.type === 'knocked' || ef.type === 'stun') && ef.endTime > now)) return false;
    const keep = Math.max(4, member.atkRange * 0.4);
    const close = enemies.find(e => e.alive && !isRanged(e) && Math.hypot(e.x - member.x, (e.z || 0) - (member.z || 0)) < keep);
    if (!close) return false;
    const back = member.side === 'left' ? -1 : 1;
    if (Math.abs(member.x + back * 2) > ARENA_BOUNDS.maxX - 1) return false;   // sát mép sân: đứng đánh
    member.x += back * member.moveSpeed * step * 0.85;
    clampToArena(member);
    return true;
}

/** Thời gian niệm thật: KN1 & KN2 của Ignar niệm TRUNG BÌNH (1s), lúc Hỏa Thần thì niệm NHANH (godCast) */
function castTimeOf(member, skillDef, now) {
    if (skillDef.godCast != null && member.statusEffects?.some(ef => ef.type === 'fire_god' && ef.endTime > now)) return skillDef.godCast;
    if (skillDef.formCast != null && reaperForm(member, now)) return skillDef.formCast;   // Đêm Tử Thần: Lưỡi Hái Hất Hồn không cần niệm
    return skillDef.castTime ?? 0;
}
const inFireGod = (m, now) => m.statusEffects?.some(ef => ef.type === 'fire_god' && ef.endTime > now);
/** Điểm rơi tốt nhất: quanh con quái (trong tầm `range` của người dùng) có nhiều quái nhất trong bán kính `radius` */
function bestCluster(member, squad, range, radius, now) {
    const list = squad.filter(m => canBeTargeted(m, now));
    if (!list.length) return null;
    const near = list.filter(m => Math.hypot(m.x - member.x, (m.z || 0) - (member.z || 0)) <= range);
    const pool = near.length ? near : list;
    let best = null, bestN = -1;
    for (const c of pool) {
        const group = list.filter(m => Math.hypot(m.x - c.x, (m.z || 0) - (c.z || 0)) <= radius);
        const n = group.length;
        if (n > bestN) {
            bestN = n;
            // tâm = trung bình nhóm (kéo về phía con chính để chắc trúng nó)
            const gx = group.reduce((t, m) => t + m.x, 0) / n, gz = group.reduce((t, m) => t + (m.z || 0), 0) / n;
            best = { x: (gx + c.x) / 2, z: (gz + (c.z || 0)) / 2 };
        }
    }
    return best;
}
/** Nổ diện rộng tại (x, z): sát thương phép lên mọi quái trong bán kính, báo client 'fireHits' để vẽ nổ + số sát thương */
function fireAoe(roomId, casterId, casterIdx, opponentId, x, z, radius, mult, kind, onHit) {
    const room = rooms[roomId];
    const member = room?.players[casterId]?.squad[casterIdx];
    const opp = room?.players[opponentId];
    if (!member || !opp) return;
    const now = room.clock ?? Date.now();
    const effects = [];
    opp.squad.forEach((e, i) => {
        if (!e.alive || Math.hypot(e.x - x, (e.z || 0) - z) > radius) return;
        const eff = hitTarget(member, e, i, opp, mult, now, { noBlock: true, aoe: true });
        if (!eff.isMiss) onHit?.(e);
        effects.push(eff);
    });
    io.to(roomId).emit('fireHits', { casterId, casterIdx, kind, x, z, radius, effects });
}
/** Đánh thường lúc Hỏa Thần giáng lâm. Trả về false nếu không có Hỏa Thần (đánh thường bình thường) */
function fireGodAttack(roomId, casterId, casterIdx, opponentId, targetIdx, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const god = member.statusEffects.find(ef => ef.type === 'fire_god' && ef.endTime > now);
    if (!god) return false;
    const sk = skillsOf(member).find(s => s.type === 'fire_god');
    const opp = room.players[opponentId];
    const target = opp.squad[targetIdx];
    if (!target?.alive) return false;
    god.count = (god.count ?? 0) + 1;
    member.mp = Math.min(member.maxMp, member.mp + member.mpAtk);
    if (god.count % sk.volleyEvery === 0) {
        // Chưởng toàn thể: nhảy lên chưởng cầu lửa vào MỌI quái (sát thương đơn, choáng 0.5s); KN1 & KN2 hồi nhanh 1s
        const IMPACT = 300 + 280;   // nhảy (0.3s) + cầu lửa bay
        const effects = [];
        opp.squad.forEach((e, i) => {
            if (!canBeTargeted(e, now)) return;
            const delay = IMPACT + effects.length * 50;
            const eff = hitTarget(member, e, i, opp, sk.volleyMultiplier, now, { delay });
            if (!eff.isMiss) later(delay, () => { if (e.alive) applyStun(e, sk.volleyStun, curRoom?.clock ?? now); });
            effects.push({ ...eff, delay });
        });
        for (const i of [0, 1]) member.skillCooldowns[i] = Math.max(0, (member.skillCooldowns[i] ?? 0) - sk.cdReduce);
        member.actionUntil = now + 650;
        io.to(roomId).emit('fireGod', { casterId, casterIdx, kind: 'volley', effects });
    } else {
        // Hỏa Chưởng: quả cầu lửa xoáy vào mục tiêu, nổ lan quái xung quanh
        const IMPACT = 200 + 260;
        const effects = [hitTarget(member, target, targetIdx, opp, sk.palmMultiplier, now, { delay: IMPACT })];
        opp.squad.forEach((e, i) => {
            if (i === targetIdx || !e.alive || Math.hypot(e.x - target.x, (e.z || 0) - (target.z || 0)) > sk.splashRadius) return;
            effects.push(hitTarget(member, e, i, opp, sk.splashMultiplier, now, { delay: IMPACT, noBlock: true, aoe: true }));
        });
        io.to(roomId).emit('fireGod', { casterId, casterIdx, kind: 'palm', targetIndex: targetIdx, effects });
    }
    return true;
}
/** Hộ Vệ Thần Lửa: mỗi `guardianEvery` ms ném 1 quả cầu lửa vào mục tiêu của Ignar */
function processFireGuardian(roomId, casterId, casterIdx, opponentId, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const god = member.statusEffects.find(ef => ef.type === 'fire_god' && ef.endTime > now);
    if (!god || now < (god.nextThrow ?? 0)) return;
    const opp = room.players[opponentId];
    let target = opp.squad[member.targetIndex];
    if (!target || !canBeTargeted(target, now)) target = findBestTarget(member, opp.squad, now);
    if (!target) return;
    const sk = skillsOf(member).find(s => s.type === 'fire_god');
    god.nextThrow = now + sk.guardianEvery;
    const ti = opp.squad.indexOf(target);
    const eff = hitTarget(member, target, ti, opp, sk.guardianMultiplier, now, { delay: 520 });
    io.to(roomId).emit('fireGod', { casterId, casterIdx, kind: 'guardian', targetIndex: ti, effects: [eff] });
}

/** Một lần nổ của khiên Dựng Khiên: sát thương + choáng nhẹ mọi quái quanh Rok; final = lần nổ kết thúc khiên */
function guardBurst(roomId, casterId, casterIdx, opponentId, now, final = false) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const guard = member.statusEffects.find(ef => ef.type === 'guard' && ef.maxHp);
    const skillDef = skillsOf(member).find(s => s.type === 'guard');
    const opp = room.players[opponentId];
    const effects = [];
    opp.squad.forEach((enemy, i) => {
        if (!enemy.alive || Math.hypot(enemy.x - member.x, (enemy.z || 0) - (member.z || 0)) > skillDef.burstRadius) return;
        const result = calculateDamage(member, enemy, skillDef.burstMultiplier, now, { aoe: true });
        if (!result.isMiss) {
            if (!opp.debugGodMode) {
                enemy.hp = Math.max(0, enemy.hp - result.damage);
                if (enemy.hp === 0) killMember(enemy, opp.squad);
                else afterHpLoss(enemy);
            }
            // choáng nhẹ (không rút ngắn choáng dài hơn đang có)
            const stunEnd = now + ccTime(enemy, skillDef.burstStun ?? 0, now);
            const cur = enemy.statusEffects.find(ef => ef.type === 'stun' && ef.endTime > now);
            if (!cur) enemy.statusEffects.push({ type: 'stun', endTime: stunEnd });
            else cur.endTime = Math.max(cur.endTime, stunEnd);
        }
        effects.push({ targetIndex: i, damage: result.damage, isCrit: result.isCrit, isBlock: result.isBlock, isMiss: result.isMiss, stunned: !result.isMiss });
    });
    // khiên nổ trúng quái -> cả đội hồi máu (theo % máu tối đa của từng người)
    const heals = [];
    if (skillDef.burstHeal && effects.some(e => !e.isMiss)) {
        room.players[casterId].squad.forEach((a, i) => {
            if (!a.alive) return;
            const amount = healUnit(a, Math.round(a.maxHp * skillDef.burstHeal), now);
            if (amount > 0) heals.push({ targetIndex: i, heal: amount });
        });
    }
    io.to(roomId).emit('guardBurst', { casterId, casterIdx, effects, heals, final, burst: guard?.bursts ?? 0, shieldHp: guard?.hp ?? 0, shieldMax: guard?.maxHp ?? 0 });
}

/**
 * Dựng Khiên: mỗi `burstEvery` máu khiên mất đi -> 1 lần nổ (cách nhau tối thiểu burstGap).
 * Khiên hết máu (sau khi nổ hết các lần còn nợ) hoặc hết giờ -> nổ lần cuối rồi hạ khiên.
 */
function processGuardShield(roomId, casterId, casterIdx, opponentId, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const guard = member.statusEffects.find(ef => ef.type === 'guard' && ef.maxHp);
    if (!guard) return;
    const skillDef = skillsOf(member).find(s => s.type === 'guard');
    const pending = () => guard.absorbed >= (guard.burstEvery ?? skillDef.burstEvery) * (guard.bursts + 1);
    const expired = guard.endTime <= now;
    if (!expired && pending() && now - (guard.lastBurst ?? -1e9) >= (skillDef.burstGap ?? 0)) {
        guard.bursts++;
        guard.lastBurst = now;
        guardBurst(roomId, casterId, casterIdx, opponentId, now);
    }
    if (expired || (guard.hp <= 0 && !pending())) {
        guardBurst(roomId, casterId, casterIdx, opponentId, now, true);
        endGuard(room.players[casterId].squad, casterIdx);
        if (member.state === 'guarding') member.state = 'idle';
    }
}

/** Hạ khiên của Chiến Binh `casterIdx`: bỏ hiệu ứng guard + buff thủ nó phát cho cả đội */
function endGuard(squad, casterIdx) {
    const rok = squad[casterIdx];
    if (rok) rok.statusEffects = rok.statusEffects.filter(ef => ef.type !== 'guard');
    squad.forEach(ally => {
        ally.statusEffects = ally.statusEffects.filter(ef => !(ef.type === 'guard_aura' && ef.sourceIndex === casterIdx));
    });
}

// ============================================================
// SÁT THỦ U MINH (Zerith)
// ============================================================
/**
 * Lưỡi Hái Xuyên Hồn — tính đường lướt: thử lướt về phía TỪNG đối thủ trong tầm lướt, chấm điểm:
 *   +10 mỗi quái trúng trên đường · +6 nếu đích là tướng đánh xa · +5×(máu đã mất của đích) · +0.3×độ sâu
 *   Đích = quái trên đường XA NHẤT; dừng sau lưng nó 1.6 đơn vị (tối đa dashLen, trong sân).
 *   Không có ai trong tầm lướt -> lướt thẳng hết dashLen về phía quái gần nhất.
 */
function planReaperDash(member, squad, sk, now) {
    const from = { x: member.x, z: member.z || 0 };
    const list = squad.map((e, i) => ({ e, i })).filter(o => canBeTargeted(o.e, now));
    const all = squad.map((e, i) => ({ e, i })).filter(o => o.e.alive);   // đường lướt là đòn diện rộng: trúng cả người tàng hình
    const lineHits = (ux, uz, maxLen) => all.map(o => {
        const px = o.e.x - from.x, pz = (o.e.z || 0) - from.z;
        return { ...o, along: px * ux + pz * uz, lat: Math.abs(px * uz - pz * ux) };
    }).filter(h => h.along >= -0.6 && h.along <= maxLen + 0.6 && h.lat <= sk.width);
    const clampPt = (p) => ({ x: Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, p.x)), z: Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, p.z)) });
    let best = null;
    for (const c of list) {
        const dx = c.e.x - from.x, dz = (c.e.z || 0) - from.z, d = Math.hypot(dx, dz);
        if (d < 0.01 || d > sk.dashLen) continue;
        const ux = dx / d, uz = dz / d;
        const hits = lineHits(ux, uz, sk.dashLen);
        const far = hits.reduce((a, h) => (h.along > a.along ? h : a), hits[0]);
        const endAlong = Math.min(sk.dashLen, far.along + 1.6);
        const score = hits.length * 10 + (isRanged(far.e) ? 6 : 0) + 5 * (1 - far.e.hp / far.e.maxHp) + 0.3 * endAlong;
        if (!best || score > best.score) best = { score, ux, uz, endAlong, hits, end: far.e };
    }
    if (!best) {
        // không ai trong tầm lướt: lướt thẳng hết quãng về phía quái gần nhất (hoặc về phía trước)
        const near = list.sort((a, b) => Math.hypot(a.e.x - from.x, (a.e.z || 0) - from.z) - Math.hypot(b.e.x - from.x, (b.e.z || 0) - from.z))[0];
        let ux = member.side === 'left' ? 1 : -1, uz = 0;
        if (near) { const dx = near.e.x - from.x, dz = (near.e.z || 0) - from.z, d = Math.hypot(dx, dz) || 1; ux = dx / d; uz = dz / d; }
        best = { ux, uz, endAlong: sk.dashLen, hits: lineHits(ux, uz, sk.dashLen), end: near?.e ?? null };
    }
    const to = clampPt({ x: from.x + best.ux * best.endAlong, z: from.z + best.uz * best.endAlong });
    // đích bị ép vào trong sân -> tính lại quái trúng theo đường thật
    const len = Math.hypot(to.x - from.x, to.z - from.z) || 1;
    const hits = lineHits((to.x - from.x) / len, (to.z - from.z) / len, len);
    return { to, hits, end: best.end, score: best.score ?? 0 };
}

/** MP cần để dùng kỹ năng `idx` (Zerith: lướt lần 2 lúc Đêm Tử Thần miễn phí) */
function skillCostOf(member, idx, now) {
    const sk = skillsOf(member)[idx];
    if (!sk) return Infinity;
    if (sk.type === 'reaper_dash' && member.statusEffects?.some(ef => ef.type === 'reaper_echo' && ef.endTime > now)) return 0;
    // Thiên Tài Nguyên Tố (Elarion): ghép bằng Sách trúng thiên phú -> phép kế tiếp giảm 1 Orb
    if (sk.type === 'elem_spell' && member.spellDiscount) return Math.max(0, sk.orbCost - (talentOf(member, 'elem_genius')?.discount ?? 1)) * ORB_COST;
    return sk.orbCost * ORB_COST;
}
/**
 * Hồi máu cho 1 nhân vật (mọi nguồn hồi máu đi qua đây). Ấn Tử của Zerith: giảm lượng hồi (healCut).
 * Trả về lượng máu thực sự hồi (đã giảm, chưa tính tràn).
 */
function healUnit(m, amount, now = curRoom?.clock ?? Date.now()) {
    if (!m.alive || !(amount > 0)) return 0;
    const wg = m.statusEffects?.find(ef => ef.type === 'water_god' && ef.endTime > now);   // Thủy Thần Vũ: +hồi máu nhận
    const v = Math.round(amount * (1 + (wg?.healUp ?? 0)) * (1 - healCutOf(m, now)));
    m.hp = Math.min(m.maxHp, m.hp + v);
    return v;
}
/** Tỉ lệ giảm hồi máu đang chịu (Ấn Tử) */
function healCutOf(m, now) {
    return Math.max(0, ...(m.statusEffects ?? []).filter(ef => ef.type === 'death_mark' && ef.endTime > now).map(ef => ef.healCut ?? 0));
}
/** Hiệu ứng Đêm Tử Thần đang có (null nếu không) */
function reaperForm(m, now) {
    return m?.statusEffects?.find(ef => ef.type === 'reaper_form' && ef.endTime > now) ?? null;
}
/**
 * Thiên phú Đánh Lén (Jessica) — Bóng Ẩn: máu tụt tới ngưỡng (50%) lần đầu trong trận -> tàng hình 2s
 * và nhảy ra SAU LƯNG đối thủ yếu máu nhất (khoá mục tiêu đó).
 */
function checkShadowStep(m) {
    if (!m.alive || m.shadowUsed) return;
    const t = passivesOf(m).find(p => p.type === 'backstab_crit' && p.shadowStep);
    if (!t || m.hp / m.maxHp > t.shadowStep.threshold) return;
    const at = locate(m);
    if (!at) return;
    const room = curRoom, now = room.clock ?? Date.now();
    const oppId = Object.keys(room.players).find(id => id !== at.pid);
    const opp = room.players[oppId];
    const foes = opp.squad.map((e, i) => ({ e, i })).filter(o => o.e.alive);
    if (!foes.length) return;
    m.shadowUsed = true;
    const weak = foes.sort((a, b) => a.e.hp / a.e.maxHp - b.e.hp / b.e.maxHp)[0];
    const dir = m.side === 'left' ? 1 : -1;   // "sau lưng" địch = phía bên kia so với đội mình
    const fromX = m.x, fromZ = m.z || 0;
    m.x = weak.e.x + dir * t.shadowStep.behind; m.z = weak.e.z || 0;
    clampToArena(m);
    m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'stealth' || ef.endTime > now + t.shadowStep.duration);
    if (!m.statusEffects.some(ef => ef.type === 'stealth')) m.statusEffects.push({ type: 'stealth', endTime: now + t.shadowStep.duration, duration: t.shadowStep.duration, shadow: true });
    m.lockedTargetIndex = weak.i; m.targetIndex = weak.i;
    // các đòn đơn đang nhắm vào Jessica: bỏ khoá mục tiêu
    opp.squad.forEach(e => { if (e.lockedTargetIndex === at.idx) e.lockedTargetIndex = -1; });
    io.to(room.id).emit('shadowStep', { casterId: at.pid, casterIdx: at.idx, fromX, fromZ, toX: m.x, toZ: m.z, targetId: oppId, targetIndex: weak.i, duration: t.shadowStep.duration });
}
/** Tìm người chơi + vị trí trong đội của 1 nhân vật (phòng đang xử lý) */
function locate(m) {
    for (const [pid, p] of Object.entries(curRoom?.players ?? {})) {
        const i = p.squad.indexOf(m);
        if (i >= 0) return { pid, idx: i };
    }
    return null;
}
function sendReaperFx(roomId, data) {
    if (process.env.LOC_DEBUG) console.log('[reaperFx]', Date.now(), data.kind, JSON.stringify(data.effects?.map(e => e.damage) ?? data.damage ?? ''));
    io.to(roomId).emit('reaperFx', data);
}
const emitReaper = (data) => { if (curRoom?.id) sendReaperFx(curRoom.id, data); };
/** Đêm Tử Thần chặn đòn chí tử -> giữ 1 máu (đồng hồ cát hiện tối đa 1 lần / 1.2s) */
function reaperUndying(m) {
    const now = curRoom?.clock ?? Date.now();
    const f = reaperForm(m, now);
    if (!f) return false;
    if (now - (f.undyingAt ?? -1e9) > 1200) {
        f.undyingAt = now;
        const at = locate(m);
        if (at) emitReaper({ kind: 'undying', casterId: at.pid, casterIdx: at.idx });
    }
    return true;
}
/** Nhân vật gục: Thiên Thần Hộ Mệnh của Tu Sĩ + Linh Hồn Báo Thù của Zerith */
function killMember(target, squad) {
    target.alive = false; target.state = 'dead';
    target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'judged');
    target.wardOn = false;   // Giáp Lửa mất theo
    // Elarion gục: tắt SolarBeam / mưa giông đang thi triển
    if (target.statusEffects.some(ef => ef.type === 'elem_beam' || ef.type === 'elem_rain')) {
        const at = locate(target);
        if (at && curRoom) { endBeam(curRoom, at.pid, at.idx, 'dead'); endRain(curRoom, at.pid, at.idx, 'dead'); }
    }
    breakRokLink(target, squad);
    onDancerDeathHooks(target, squad);
    onAllyDeath(target, squad);
    const t = talentOf(target, 'reaper_avenger');
    if (t && !target.avengerUsed) {
        const now = curRoom?.clock ?? Date.now();
        target.avengerUsed = true;
        target.ghostUntil = now + t.duration;
        target.ghostNext = now + 700;
        target.ghostPower = t.value;
        target.ghostX = target.x; target.ghostZ = target.z || 0;
        const at = locate(target);
        if (at) emitReaper({ kind: 'ghostStart', casterId: at.pid, casterIdx: at.idx, x: target.x, z: target.ghostZ, duration: t.duration });
    }
}
/** Ấn Tử của `attacker` đang gắn trên `target` (null nếu không) */
function deathMarkOf(attacker, target, now) {
    if (!attacker?.classId || attacker.classId !== 'reaper') return null;
    return target.statusEffects?.find(ef => ef.type === 'death_mark' && ef.endTime > now && ef.owner === attacker.side) ?? null;
}
/** Phá sạch mọi khiên của mục tiêu (khiên đặc trưng của Chiến Binh vỡ -> nổ lần cuối như bình thường) */
function wipeShields(target, now) {
    let broke = false;
    for (const ef of target.statusEffects) {
        if (!SHIELD_TYPES.has(ef.type) || ef.endTime <= now) continue;
        if (ef.hp > 0) broke = true;
        ef.hp = 0;
        if (ef.type !== 'guard') ef.dormant = false;
    }
    if (!broke) return;
    const at = locate(target);
    if (at) emitReaper({ kind: 'shatter', targetId: at.pid, targetIndex: at.idx });
}
/** Sau đòn của Zerith: mục tiêu có Ấn Tử mà máu dưới ngưỡng -> kết liễu */
function executeHook(attacker, target) {
    // (cũ) kết liễu ngay khi Zerith đánh. Giờ: chạm NGƯỠNG TỬ bằng BẤT KỲ đòn nào -> Thần Chết phán quyết (checkJudgement)
    return null;
}
/** Thiên phú Phán Quyết Tử Thần: vào giao tranh (có địch trong tầm) và mỗi `every` ms gắn Ấn Tử lên TẤT CẢ đối thủ. true = vừa gắn (đang diễn) */
function processDeathJudgement(roomId, casterId, casterIdx, opponentId, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const t = talentOf(member, 'death_judgement');
    if (!t || now < (member.markNext ?? 0)) return false;
    const opp = room.players[opponentId];
    const dist = (e) => Math.hypot(e.x - member.x, (e.z || 0) - (member.z || 0));
    if (!opp.squad.some(e => canBeTargeted(e, now) && dist(e) <= t.range)) return false;   // chưa đụng độ
    member.markNext = now + t.every;
    const targetIndices = [];
    opp.squad.forEach((e, i) => {
        if (isJudged(e, now)) return;   // đang bị phán quyết: không nhận thêm hiệu ứng
        e.statusEffects = e.statusEffects.filter(ef => !(ef.type === 'death_mark' && ef.owner === member.side));
        if (!e.alive) return;
        e.statusEffects.push({ type: 'death_mark', endTime: now + 350 + t.duration, duration: t.duration, execute: t.value, healCut: t.healCut ?? 0, owner: member.side, debuff: true, noCleanse: true });
        targetIndices.push(i);
    });
    member.actionUntil = now + 500;
    member.state = 'acting';
    sendReaperFx(roomId, { kind: 'mark', casterId, casterIdx, targetId: opponentId, targetIndices });
    return true;
}
/** Hất tung 1 mục tiêu `ms` (đã trừ kháng khống chế) */
function knockUp(e, ms) {
    if (!e.alive) return;
    const t = curRoom?.clock ?? Date.now();
    const dur = ccTime(e, ms, t);
    e.statusEffects = e.statusEffects.filter(ef => ef.type !== 'knockup');
    e.statusEffects.push({ type: 'knockup', endTime: t + dur, duration: dur, debuff: true });
    applyStun(e, ms, t);
}
/** Đêm Tử Thần: đánh thường chém lan quái quanh mục tiêu */
function reaperCleave(roomId, casterId, casterIdx, opponentId, targetIdx, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    if (!reaperForm(member, now)) return;
    const sk = skillsOf(member).find(s => s.type === 'reaper_night');
    const opp = room.players[opponentId];
    const target = opp.squad[targetIdx];
    if (!target || !sk) return;
    const effects = [];
    opp.squad.forEach((e, i) => {
        if (i === targetIdx || !e.alive || Math.hypot(e.x - target.x, (e.z || 0) - (target.z || 0)) > sk.cleaveRadius) return;
        effects.push(hitTarget(member, e, i, opp, sk.cleaveMultiplier, now, { delay: CLASS_DEFS.reaper.autoImpact, noBlock: true, aoe: true }));
    });
    sendReaperFx(roomId, { kind: 'cleave', casterId, casterIdx, targetId: opponentId, targetIndex: targetIdx, effects });
}
/** Hộ Vệ Thần Chết: mỗi `guardianEvery` ms chém mục tiêu của Zerith */
function processReaperGuardian(roomId, casterId, casterIdx, opponentId, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const form = reaperForm(member, now);
    if (!form || now < (form.nextSlash ?? 0)) return;
    const opp = room.players[opponentId];
    let target = opp.squad[member.targetIndex];
    if (!target || !canBeTargeted(target, now)) target = findBestTarget(member, opp.squad, now);
    if (!target) return;
    const sk = skillsOf(member).find(s => s.type === 'reaper_night');
    const ti = opp.squad.indexOf(target);
    // cứ chém đủ 2 nhát -> 50% Hộ Vệ TỰ DÙNG Lưỡi Hái Hất Hồn (miễn phí): hất tung quái quanh mục tiêu rồi chém bổ xuống
    if ((form.slashes ?? 0) > 0 && form.slashes % sk.guardianReapEvery === 0 && !form.reapDone?.[form.slashes] && Math.random() < sk.guardianReapChance) {
        (form.reapDone ??= {})[form.slashes] = true;
        const reap = skillsOf(member).find(s => s.type === 'reaper_scythe');
        const IMPACT = 420, SLAM = 980;
        const effects = [];
        opp.squad.forEach((e, i) => {
            if (!e.alive || Math.hypot(e.x - target.x, (e.z || 0) - (target.z || 0)) > sk.guardianReapRadius) return;
            const eff = hitTarget(member, e, i, opp, reap.multiplier, now, { delay: IMPACT, aoe: true });
            if (!eff.isMiss) later(IMPACT, () => knockUp(e, reap.knockup));
            effects.push({ ...eff, knockup: !eff.isMiss });
            effects.push({ ...hitTarget(member, e, i, opp, reap.slamMultiplier, now, { delay: SLAM, noBlock: true, aoe: true }), slam: true });
        });
        form.nextSlash = now + SLAM + sk.guardianEvery * 0.6;
        sendReaperFx(roomId, { kind: 'guardianReap', casterId, casterIdx, targetId: opponentId, targetIndex: ti, x: target.x, z: target.z || 0,
            radius: sk.guardianReapRadius, impact: IMPACT, slamAt: SLAM, effects });
        return;
    }
    form.nextSlash = now + sk.guardianEvery;
    form.slashes = (form.slashes ?? 0) + 1;
    const eff = hitTarget(member, target, ti, opp, sk.guardianMultiplier, now, { delay: 380 });
    sendReaperFx(roomId, { kind: 'guardian', casterId, casterIdx, targetId: opponentId, targetIndex: ti, pose: form.slashes % 3, effects: [eff] });
}
/** Linh Hồn Báo Thù: linh hồn Thần Chết bay tới mục tiêu chém (×multiplier × sức mạnh), lan quái quanh */
function processReaperGhost(roomId, casterId, casterIdx, opponentId, now) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    if (!member.ghostUntil) return;
    if (now >= member.ghostUntil) {
        member.ghostUntil = 0;
        sendReaperFx(roomId, { kind: 'ghostEnd', casterId, casterIdx });
        return;
    }
    if (now < (member.ghostNext ?? 0)) return;
    const t = talentOf(member, 'reaper_avenger');
    const opp = room.players[opponentId];
    const probe = { x: member.ghostX ?? member.x, z: member.ghostZ ?? member.z };
    const target = findBestTarget({ ...member, ...probe }, opp.squad, now);
    if (!t || !target) return;
    member.ghostNext = now + t.every;
    const dir = Math.sign(target.x - probe.x) || 1;
    member.ghostX = target.x - dir * 1.6; member.ghostZ = target.z || 0;
    const ti = opp.squad.indexOf(target);
    const p = member.ghostPower ?? t.value;
    const effects = [hitTarget(member, target, ti, opp, t.multiplier * p, now, { delay: 380 })];
    opp.squad.forEach((e, i) => {
        if (e === target || !e.alive || Math.hypot(e.x - target.x, (e.z || 0) - (target.z || 0)) > t.splashRadius) return;
        effects.push(hitTarget(member, e, i, opp, t.splash * p, now, { delay: 380, noBlock: true, aoe: true }));
    });
    sendReaperFx(roomId, { kind: 'ghost', casterId, casterIdx, targetId: opponentId, targetIndex: ti, x: member.ghostX, z: member.ghostZ, effects });
}

// ============================================================
// CUỒNG ĐẤU (Brakk) — Chiến Binh đô vật
// ============================================================
/** Hiệu ứng Thần Lực Khổng Lồ đang có (null nếu không) */
function giantForm(m, now) {
    return m?.statusEffects?.find(ef => ef.type === 'giant_form' && ef.endTime > now) ?? null;
}
/** Đang miễn mọi khống chế / hiệu ứng bất lợi (5 giây đầu Khổng Lồ) */
function ccImmune(m, now) {
    if (m?.summon) return true;   // Golem Nguyên Tố: không dính khống chế / hiệu ứng nào
    const g = giantForm(m, now);
    return !!g && now < (g.immuneUntil ?? 0);
}
const emitBrakk = (data) => { if (curRoom?.id) io.to(curRoom.id).emit('brakkFx', data); };
/** Hết Khổng Lồ (hoặc dùng lại): trả phần máu tối đa đã cộng */
function endGiant(m) {
    if (!m.giantBonus) return;
    m.maxHp = Math.max(1, m.maxHp - m.giantBonus);
    m.hp = Math.min(m.hp, m.maxHp);
    m.giantBonus = 0;
    m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'giant_form');
}
/** Mỗi tick: hết giờ Khổng Lồ -> thu máu lại; còn trong 5s miễn nhiễm -> gỡ mọi hiệu ứng bất lợi vừa dính */
function processBrakk(roomId, casterId, casterIdx, now) {
    const m = rooms[roomId].players[casterId].squad[casterIdx];
    if (m.classId !== 'wrestler') return;
    if (m.giantBonus && !giantForm(m, now)) {
        endGiant(m);
        io.to(roomId).emit('brakkFx', { kind: 'giantEnd', casterId, casterIdx, hp: m.hp, maxHp: m.maxHp });
    }
    if (ccImmune(m, now) && m.statusEffects.some(ef => DEBUFFS.includes(ef.type) || (ef.debuff && !ef.noCleanse) || ef.type === 'knockup' || ef.type === 'grabbed')) {
        cleanse(m, 'all');
        m.statusEffects = m.statusEffects.filter(ef => ef.noCleanse || (ef.type !== 'knockup' && ef.type !== 'grabbed'));
    }
    // Long Huyết Bất Khuất — Độc Long: đồng đội gục hết, chỉ còn 1 mình Brakk trên sân -> sát thương ×2
    const blood = talentOf(m, 'brakk_blood');
    const squad = rooms[roomId].players[casterId].squad;
    const alone = !!blood?.loneDmg && m.alive && squad.length > 1 && squad.every(a => a === m || !a.alive);
    if (alone) {
        let ef = m.statusEffects.find(e => e.type === 'lone_dragon');
        if (!ef) { ef = { type: 'lone_dragon', value: blood.loneDmg, endTime: now + 300 }; m.statusEffects.push(ef); }
        ef.endTime = now + 300;
        if (!m.loneOn) { m.loneOn = true; io.to(roomId).emit('brakkFx', { kind: 'lone', casterId, casterIdx, value: blood.loneDmg }); }
        // Độc Long: vừa còn 1 mình -> tự hoá Khổng Lồ MIỄN PHÍ; đang Khổng Lồ rồi thì làm mới thời gian (1 lần mỗi lần bị bỏ lại 1 mình)
        if (!m.loneGiantDone && now >= (m.actionUntil ?? 0) && m.state !== 'casting' && !m.statusEffects.some(e => e.type === 'grabbed' && e.endTime > now)) {
            m.loneGiantDone = true;
            const gi = skillsOf(m).findIndex(sk => sk.type === 'brakk_giant');
            const g = giantForm(m, now);
            if (g) {
                const sk = skillsOf(m)[gi];
                g.endTime = now + (sk?.duration ?? g.duration ?? 10000);
                io.to(roomId).emit('brakkFx', { kind: 'giantRefresh', casterId, casterIdx, duration: sk?.duration ?? 10000 });
            } else if (gi >= 0) {
                const oppId = Object.keys(rooms[roomId].players).find(id => id !== casterId);
                m.queuedSkills = m.queuedSkills.filter(k => k !== gi);
                executeSkill(roomId, casterId, casterIdx, oppId, gi, { free: true });
            }
        }
    } else {
        if (m.loneOn) m.statusEffects = m.statusEffects.filter(e => e.type !== 'lone_dragon');
        m.loneOn = false;
        m.loneGiantDone = false;
    }
}
/**
 * Khiên Brakk: CỘNG DỒN vào khiên Brakk đang có (1 lớp dày hơn). refresh=true (Chấn Địa) -> làm mới thời gian;
 * thiên phú chỉ cộng máu khiên (chưa có khiên thì tạo mới `ms`).
 */
function brakkShield(m, amount, ms, now, refresh) {
    if (!m.alive || !(amount > 0)) return 0;
    const old = m.statusEffects.find(ef => ef.type === 'brakk_shield' && ef.endTime > now);
    const hp = (old?.hp ?? 0) + amount;
    const endTime = old && !refresh ? old.endTime : now + ms;
    m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'brakk_shield');
    addShield(m, { type: 'brakk_shield', endTime, duration: ms, hp, maxHp: hp }, now);
    return hp;
}
/** Khổng Lồ: đánh thường ĐẦU TIÊN và sau mỗi `every` đòn thường -> móc ngược hất tung + hất văng. true = đã đánh thay đòn thường */
function brakkUplift(roomId, casterId, casterIdx, opponentId, targetIdx, now) {
    const room = rooms[roomId];
    const m = room.players[casterId].squad[casterIdx];
    const g = giantForm(m, now);
    if (!g) return false;
    const opp = room.players[opponentId];
    const target = opp.squad[targetIdx];
    if (!target?.alive) return false;
    const turn = (g.autos ?? 0) % ((g.every ?? 3) + 1) === 0;
    g.autos = (g.autos ?? 0) + 1;
    if (!turn) return false;
    const impact = CLASS_DEFS.wrestler.autoImpact;
    const eff = hitTarget(m, target, targetIdx, opp, g.upliftMultiplier ?? 1.3, now, { delay: impact, noBlock: true });
    m.mp = Math.min(m.maxMp, m.mp + m.mpAtk);
    const fromX = target.x, fromZ = target.z || 0;
    let up = false;
    if (!eff.isMiss && !eff.killed && ccTime(target, g.upTime, now) > 0) {
        up = true;
        const dir = Math.sign(target.x - m.x) || (m.side === 'left' ? 1 : -1);
        target.x += dir * (g.push ?? 3);
        clampToArena(target);
        later(impact, () => knockUp(target, g.upTime));
        target.lockedTargetIndex = -1;
    }
    io.to(roomId).emit('brakkFx', { kind: 'uplift', casterId, casterIdx, targetId: opponentId, targetIndex: targetIdx,
        effects: [{ ...eff, knockup: up, fromX, fromZ, toX: target.x, toZ: target.z || 0 }], upTime: g.upTime, impact });
    return true;
}
/** Thiên phú Long Huyết Bất Khuất: máu tụt dưới ngưỡng -> hồi máu Brakk + đồng đội, +Orb, giải mọi hiệu ứng bất lợi cả đội */
function checkBrakkBlood(m) {
    if (!m?.alive) return;
    const t = talentOf(m, 'brakk_blood');
    if (!t || m.hp / m.maxHp >= t.threshold) return;
    const now = curRoom?.clock ?? Date.now();
    if (now < (m.bloodReadyAt ?? 0)) return;
    const at = locate(m);
    if (!at) return;
    m.bloodReadyAt = now + t.cooldown;
    const team = curRoom.players[at.pid];
    const heals = [];
    team.squad.forEach((a, i) => {
        if (!a.alive) return;
        cleanse(a, 'all');   // Ấn Tử (noCleanse) vẫn giữ
        a.statusEffects = a.statusEffects.filter(ef => ef.noCleanse || (ef.type !== 'knockup' && ef.type !== 'grabbed'));
        const heal = healUnit(a, a.maxHp * (a === m ? t.value : t.team), now);
        if (!team.debugNoMana) a.mp = Math.min(a.maxMp, a.mp + (t.orbs ?? 1) * ORB_COST);
        heals.push({ targetIndex: i, heal });
    });
    emitBrakk({ kind: 'blood', casterId: at.pid, casterIdx: at.idx, heals, orbs: t.orbs ?? 1 });
}
/**
 * Thiên phú Khí Thế Đấu Trường — Tiếng Hét Bảo Hộ: có đồng đội (không tính Brakk) dưới 50% máu và hết hồi
 * -> Brakk gầm lên khiêu khích TẤT CẢ đối thủ còn sống (không gây sát thương). true = vừa hét (đang diễn).
 */
function processBrakkShout(roomId, casterId, casterIdx, opponentId, now) {
    const room = rooms[roomId];
    const m = room.players[casterId].squad[casterIdx];
    const t = talentOf(m, 'brakk_rally');
    if (!t?.shoutTaunt || now < (m.shoutReadyAt ?? 0)) return false;
    const squad = room.players[casterId].squad;
    const hurt = squad.findIndex(a => a !== m && a.alive && a.hp / a.maxHp < t.shoutThreshold);
    if (hurt < 0) return false;
    const opp = room.players[opponentId];
    const targetIndices = [];
    opp.squad.forEach((e, i) => {
        if (!e.alive || ccImmune(e, now)) return;   // địch đang miễn khống chế (Khổng Lồ) thì không bị khiêu khích
        e.statusEffects = e.statusEffects.filter(ef => ef.type !== 'taunted');
        e.statusEffects.push({ type: 'taunted', endTime: now + 300 + ccTime(e, t.shoutTaunt, now), duration: t.shoutTaunt,
            sourceIndex: casterIdx, by: m.name ?? 'Brakk', debuff: true });
        e.lockedTargetIndex = -1;
        targetIndices.push(i);
    });
    if (!targetIndices.length) return false;
    m.shoutReadyAt = now + t.shoutCooldown;
    m.actionUntil = now + 550;   // gầm ngắn (clip roar)
    m.state = 'acting';
    io.to(roomId).emit('brakkFx', { kind: 'shout', casterId, casterIdx, targetId: opponentId, targetIndices, allyIndex: hurt, duration: t.shoutTaunt });
    return true;
}

/** Thiên phú Khí Thế Đấu Trường: mỗi chiêu được dùng -> đếm cho mọi Brakk trong phòng (phe địch -> hồi máu, phe mình -> khiên) */
function brakkRallyCount(room, casterId, now) {
    for (const [pid, p] of Object.entries(room.players)) {
        p.squad.forEach((m, idx) => {
            const t = talentOf(m, 'brakk_rally');
            if (!t || !m.alive) return;
            if (pid === casterId) {
                if (now < (m.rallyShieldAt ?? 0)) return;   // đang hồi: không đếm
                m.allyCasts = (m.allyCasts ?? 0) + 1;
                if (m.allyCasts < t.allyCasts) return;
                m.allyCasts = 0;
                m.rallyShieldAt = now + t.shieldCooldown;
                const amount = Math.round(m.maxHp * t.shield);
                const total = brakkShield(m, amount, t.shieldTime, now, false);
                io.to(room.id).emit('brakkFx', { kind: 'rallyShield', casterId: pid, casterIdx: idx, shield: amount, total });
            } else {
                if (now < (m.rallyHealAt ?? 0)) return;
                m.enemyCasts = (m.enemyCasts ?? 0) + 1;
                if (m.enemyCasts < t.enemyCasts) return;
                m.enemyCasts = 0;
                m.rallyHealAt = now + t.healCooldown;
                const heal = healUnit(m, m.maxHp * t.heal, now);
                io.to(room.id).emit('brakkFx', { kind: 'rallyHeal', casterId: pid, casterIdx: idx, heal });
            }
        });
    }
}

// ============================================================
// HIỆU ỨNG SAU KHI MẤT MÁU (mọi nguồn sát thương): Bóng Ẩn, Long Huyết, Giáp Lửa, Thần Chết phán quyết
// ============================================================
function afterHpLoss(m) {
    checkShadowStep(m);
    checkBrakkBlood(m);
    checkFireWard(m);
    checkJudgement(m);
}
const hasReviveGuard = (m, now) => !!m?.statusEffects?.some(ef => ef.type === 'revive_guard' && ef.endTime > now);
function isJudged(m, now) {
    return !!m?.statusEffects?.some(ef => ef.type === 'judged' && ef.endTime > now);
}

// ------------------------------------------------------------
// ROK — dây liên kết + Ý Chí Thép + Kiên Cường dùng chung
// ------------------------------------------------------------
/** Dây của Rok còn không (Rok & người được nối đều sống, chưa từng đứt) */
function rokLinkAlive(rok, squad) {
    return !rok.linkBroken && rok.linkIdx >= 0 && rok.alive && !!squad[rok.linkIdx]?.alive;
}
/**
 * Thiên phú `type` của Rok áp lên `m`: chính Rok (×2 khi còn dây) hoặc người được Rok nối dây (×1).
 * Trả về { t: thiên phú (số liệu theo cấp), mult } hoặc null.
 */
function rokTalentFor(m, type) {
    const own = talentOf(m, type);
    const at = locate(m);
    const squad = at ? curRoom.players[at.pid].squad : null;
    if (own) return { t: own, mult: squad && rokLinkAlive(m, squad) ? 2 : 1, rok: m };
    if (!squad) return null;
    const rok = squad.find(r => r !== m && talentOf(r, type) && r.linkIdx === at.idx && rokLinkAlive(r, squad));
    return rok ? { t: talentOf(rok, type), mult: 1, rok } : null;
}
const ironWillOf = (m) => rokTalentFor(m, 'low_hp_block');
/** Người được Rok (có thiên phú 2 Kiên Cường) nối dây -> { rok, share }; không thì null */
function linkGuardOf(m) {
    const src = rokTalentFor(m, 'tenacity_trigger');
    if (!src || src.rok === m || !src.rok.alive || !(src.t.share > 0)) return null;
    return { rok: src.rok, share: src.t.share };
}
/** Rok gánh `amount` sát thương thay người được nối dây: khiên của Rok hứng trước, Kiên Cường đang bật thì giảm tiếp */
function shareToRok(rok, amount, ally) {
    if (!rok.alive || !(amount > 0) || !curRoom) return;
    const now = curRoom.clock ?? Date.now();
    const at = locate(rok);
    if (!at) return;
    const team = curRoom.players[at.pid];
    const st = getEffectiveStats(rok, now).stats;
    let dmg = amount;
    if (st.tenacity) dmg *= 1 - Math.min(st.tenacityCap ?? P.STAT_CAPS.tenacity.cap, st.tenacity) / 1000;
    dmg = Math.max(1, Math.floor(dmg));
    let absorbed = 0;
    const shield = activeShield(rok, now);
    if (shield) {
        absorbed = Math.min(shield.hp, dmg);
        shield.hp -= absorbed;
        if (shield.type === 'guard') shield.absorbed += absorbed;
        dmg -= absorbed;
    }
    if (dmg > 0) dealDamage(rok, dmg, team, 0);
    io.to(curRoom.id).emit('rokFx', { kind: 'share', casterId: at.pid, casterIdx: at.idx, linkIdx: team.squad.indexOf(ally), damage: dmg, absorbed });
}
/** 1 trong 2 người của dây chết -> đứt dây vĩnh viễn trong trận */
function breakRokLink(target, squad) {
    const ti = squad.indexOf(target);
    squad.forEach((rok, ri) => {
        if (rok.linkBroken || !(rok.linkIdx >= 0)) return;
        if (rok !== target && rok.linkIdx !== ti) return;
        rok.linkBroken = true;
        const at = locate(rok);
        if (at && curRoom?.id) io.to(curRoom.id).emit('rokFx', { kind: 'linkBreak', casterId: at.pid, casterIdx: ri, linkIdx: rok.linkIdx });
    });
}
/** Mỗi tick: Rok vào trận chọn người nối dây; Ý Chí Thép tụt dưới 30% -> 5s hồi máu theo giây (hồi 10s) */
function processIronWill(roomId, pid, idx, now) {
    const squad = rooms[roomId].players[pid].squad;
    const m = squad[idx];
    if (talentOf(m, 'low_hp_block') && m.linkIdx === undefined && m.alive) {
        // đồng đội có ATK cao nhất (P.ATK hoặc M.ATK theo kiểu đánh)
        const atk = (a) => (CLASS_DEFS[a.classId]?.dmgType === 'magic' ? a.mAtk : a.pAtk) ?? 0;
        let best = -1;
        squad.forEach((a, i) => { if (a !== m && a.alive && (best < 0 || atk(a) > atk(squad[best]))) best = i; });
        m.linkIdx = best;
        if (best >= 0) io.to(roomId).emit('rokFx', { kind: 'link', casterId: pid, casterIdx: idx, linkIdx: best });
    }
    if (!m.alive) return;
    const src = ironWillOf(m);
    if (!src) return;
    const { t, mult } = src;
    if (m.maxHp > 0 && m.hp / m.maxHp < t.threshold && now >= (m.ironReadyAt ?? 0)) {
        m.ironReadyAt = now + t.cooldown;
        m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'iron_regen');
        m.statusEffects.push({ type: 'iron_regen', endTime: now + t.regenTime + 50, duration: t.regenTime, regen: t.regen * mult, next: now + 1000, block: t.value * mult });
        io.to(roomId).emit('rokFx', { kind: 'ironWill', casterId: pid, casterIdx: idx });
    }
    const ef = m.statusEffects.find(e => e.type === 'iron_regen' && e.endTime > now);
    if (ef && now >= ef.next) {
        ef.next += 1000;
        const heal = healUnit(m, m.maxHp * ef.regen, now);
        if (heal > 0) io.to(roomId).emit('rokFx', { kind: 'ironHeal', casterId: pid, casterIdx: idx, heal });
    }
}

// ------------------------------------------------------------
// IGNAR — Giáp Lửa (thiên phú 2)
// ------------------------------------------------------------
function checkFireWard(m) {
    if (!m?.alive) return;
    const t = talentOf(m, 'fire_haste');
    const w = t?.ward;
    if (!w || m.hp / m.maxHp >= w.threshold) return;
    const now = curRoom?.clock ?? Date.now();
    if (now < (m.wardReadyAt ?? 0) || m.wardOn) return;
    const at = locate(m);
    if (!at) return;
    m.wardReadyAt = now + w.cooldown;
    m.wardOn = true;
    const hp = Math.round(m.maxHp * (t.wardPct ?? 0.3));
    m.statusEffects = m.statusEffects.filter(ef => ef.type !== 'fire_ward');
    addShield(m, { type: 'fire_ward', endTime: now + w.duration, duration: w.duration, hp, maxHp: hp, mDefUp: w.mDefUp, ccResist: w.ccResist }, now);
    const team = curRoom.players[at.pid];
    if (!team.debugNoMana) m.mp = Math.min(m.maxMp, m.mp + (w.orbs ?? 1) * ORB_COST);
    // vừa bật: hất văng đối thủ quanh mình ra xa
    const oppId = Object.keys(curRoom.players).find(id => id !== at.pid);
    const opp = curRoom.players[oppId];
    const pushed = [];
    opp.squad.forEach((e, i) => {
        if (!e.alive || isJudged(e, now) || Math.hypot(e.x - m.x, (e.z || 0) - (m.z || 0)) > w.pushRadius) return;
        if (ccImmune(e, now)) return;
        const dir = Math.sign(e.x - m.x) || (m.side === 'left' ? 1 : -1);
        const fromX = e.x;
        e.x += dir * w.push;
        clampToArena(e);
        e.statusEffects = e.statusEffects.filter(ef => ef.type !== 'knocked');
        e.statusEffects.push({ type: 'knocked', endTime: now + w.knockTime });
        e.lockedTargetIndex = -1;
        pushed.push({ targetIndex: i, fromX, toX: e.x, toZ: e.z || 0 });
    });
    io.to(curRoom.id).emit('fireWard', { kind: 'on', casterId: at.pid, casterIdx: at.idx, shield: hp, targetId: oppId, pushed, knockTime: w.knockTime });
}
/** Giáp Lửa hết (vỡ / hết giờ / bị phá) -> nổ choáng xung quanh, +1 Orb */
function processFireWard(roomId, pid, idx, oppId, now) {
    const m = rooms[roomId].players[pid].squad[idx];
    if (!m.wardOn) return;
    const ef = m.statusEffects.find(e => e.type === 'fire_ward' && e.endTime > now && e.hp > 0);
    if (ef && m.alive) return;
    m.wardOn = false;
    m.statusEffects = m.statusEffects.filter(e => e.type !== 'fire_ward');
    if (!m.alive) return;
    const w = talentOf(m, 'fire_haste').ward;
    const team = rooms[roomId].players[pid];
    if (!team.debugNoMana) m.mp = Math.min(m.maxMp, m.mp + (w.orbs ?? 1) * ORB_COST);
    const opp = rooms[roomId].players[oppId];
    const stunned = [];
    opp.squad.forEach((e, i) => {
        if (!e.alive || isJudged(e, now) || Math.hypot(e.x - m.x, (e.z || 0) - (m.z || 0)) > w.stunRadius) return;
        applyStun(e, w.stun, now);
        stunned.push(i);
    });
    io.to(roomId).emit('fireWard', { kind: 'off', casterId: pid, casterIdx: idx, targetId: oppId, stunned, radius: w.stunRadius });
}

// ------------------------------------------------------------
// ZERITH — Thần Chết phán quyết (Ấn Tử chạm ngưỡng tử)
// ------------------------------------------------------------
const _judgeKeep = new WeakMap();   // hiệu ứng được giữ lại trong lúc bị phán quyết (không nhận hiệu ứng mới)
function checkJudgement(target) {
    if (!target?.alive || !curRoom) return;
    const now = curRoom.clock ?? Date.now();
    if (isJudged(target, now) || reaperForm(target, now)) return;
    if (hasReviveGuard(target, now)) return;   // 2 giây bất tử sau hồi sinh (Sera) kháng luôn phán quyết
    const mark = target.statusEffects.find(ef => ef.type === 'death_mark' && ef.endTime > now);
    if (!mark || target.hp / target.maxHp >= mark.execute) return;
    const tAt = locate(target);
    if (!tAt) return;
    const team = curRoom.players[tAt.pid];
    // Zerith (chủ Ấn) — lấy thời gian phán quyết từ thiên phú của Zerith
    const cAt = Object.entries(curRoom.players).find(([id]) => id !== tAt.pid);
    const zIdx = cAt ? cAt[1].squad.findIndex(z => talentOf(z, 'death_judgement')) : -1;
    const tal = zIdx >= 0 ? talentOf(cAt[1].squad[zIdx], 'death_judgement') : null;
    const lift = tal?.liftTime ?? 1100, fall = tal?.fallTime ?? 500;
    target.statusEffects = target.statusEffects.filter(ef => ef !== mark && ef.type !== 'stun' && ef.type !== 'knockup' && ef.type !== 'knocked');
    target.statusEffects.push({ type: 'judged', endTime: now + lift + fall, duration: lift + fall, noCleanse: true });
    _judgeKeep.set(target, new Set(target.statusEffects));
    target.judgePos = { x: target.x, z: target.z || 0 };
    target.castingSkillId = null; target.queuedSkills = [];
    target.state = 'judged';
    const roomId = curRoom.id;
    emitReaper({ kind: 'judgeStart', casterId: cAt?.[0], casterIdx: zIdx, targetId: tAt.pid, targetIndex: tAt.idx, lift, fall });
    later(lift, () => {
        if (!target.alive) return;
        const t = curRoom?.clock ?? now;
        const shielded = target.statusEffects.some(ef => SHIELD_TYPES.has(ef.type) && ef.endTime > t && ef.hp > 0);
        let killed = false;
        if (shielded) {
            for (const ef of target.statusEffects) if (SHIELD_TYPES.has(ef.type)) { ef.hp = 0; if (ef.type !== 'guard') ef.dormant = false; }
        } else if (!team.debugGodMode) {
            const left = target.hp;
            target.hp = 0;
            killMember(target, team.squad);
            killed = left;
        }
        io.to(roomId).emit('reaperFx', { kind: 'judgeSlash', casterId: cAt?.[0], casterIdx: zIdx, targetId: tAt.pid, targetIndex: tAt.idx, shielded, killed: !!killed, damage: killed || 0 });
    });
    later(lift + fall, () => {
        target.statusEffects = target.statusEffects.filter(ef => ef.type !== 'judged');
        _judgeKeep.delete(target);
        if (target.judgePos) { target.x = target.judgePos.x; target.z = target.judgePos.z; target.judgePos = null; }
        if (target.alive && target.state === 'judged') target.state = 'idle';
        target.lastAttackTime = curRoom?.clock ?? now;
    });
}
/** Mỗi tick: người đang bị phán quyết -> bỏ mọi hiệu ứng mới dính vào, giữ chỗ, không hành động. true = đang bị phán quyết */
function processJudged(m, now) {
    if (!isJudged(m, now)) return false;
    const keep = _judgeKeep.get(m);
    if (keep) m.statusEffects = m.statusEffects.filter(ef => keep.has(ef));
    if (m.judgePos) { m.x = m.judgePos.x; m.z = m.judgePos.z; }
    m.state = 'judged';
    return true;
}

// ============================================================
// THỦY VŨ (Nerissa) — 3 điệu múa song song
// ============================================================
const DANCE_TYPES = new Set(['dance_tide', 'dance_flow', 'dance_god']);
const DANCE_NUM = { dance_tide: 1, dance_flow: 2, dance_god: 3 };
// Kỹ năng tự buff phải GẶP ĐỐI THỦ mới dùng được: các điệu múa (Nerissa), Tàng Hình (Jessica)
//   -> có đối thủ (còn sống) trong tầm bắn của Lyra quanh người dùng. Chưa gặp: lệnh nằm chờ, nhân vật vẫn tiến lên.
const NEED_FOE_TYPES = new Set(['dance_tide', 'dance_flow', 'dance_god', 'stealth']);
const foeReach = () => CLASS_DEFS.archer.atkRange;
function foeInReach(member, skillType, oppSquad, now) {
    if (!NEED_FOE_TYPES.has(skillType)) return true;
    const r = foeReach();
    return (oppSquad ?? []).some(e => e.alive && !isJudged(e, now) && Math.hypot(e.x - member.x, (e.z || 0) - (member.z || 0)) <= r);
}
/** Hệ số tốc độ hồi Orb (MP mỗi giây + MP mỗi đòn): Elarion — Tốc Lôi ×2, mỗi tầng Cộng Hưởng Lôi +10/15/20% */
function orbRegenMult(m, now) {
    let k = 1;
    for (const ef of m.statusEffects ?? []) {
        if (ef.endTime <= now) continue;
        if (ef.type === 'storm_self' && ef.orbRegen) k *= ef.orbRegen;
        else if (ef.type === 'attune_bolt' && ef.orb) k *= 1 + ef.orb * (ef.stacks ?? 0);
    }
    return k;
}
const danceOn = (m, type, now) => DANCE_TYPES.has(type) && !!m.statusEffects?.some(ef => ef.type === type && ef.endTime > now);
function isDancing(m, now) { return !!m?.statusEffects?.some(ef => DANCE_TYPES.has(ef.type) && ef.endTime > now); }
/** '1' / '12' / '123'... theo các điệu đang múa */
function danceKeyOf(m, now) {
    return ['dance_tide', 'dance_flow', 'dance_god'].filter(t => danceOn(m, t, now)).map(t => DANCE_NUM[t]).join('');
}
/** Lượn qua lại quanh điểm bắt đầu múa (vị trí THẬT di chuyển — quái phải đuổi theo) */
function danceMove(m, dtMs, now) {
    const def = CLASS_DEFS[m.classId];
    m.danceAnchor ??= { x: m.x, z: m.z || 0 };
    m.dancePhase = (m.dancePhase ?? 0) + (dtMs / (def.danceCycle ?? 3000)) * Math.PI * 2;
    const ph = m.dancePhase;
    m.x = m.danceAnchor.x + (def.danceSway ?? 1.5) * Math.sin(ph);
    m.z = m.danceAnchor.z + (def.danceDepth ?? 0.7) * Math.sin(ph * 2);
    clampToArena(m);
}
const ctxOf = (roomId, pid, idx, oppId) => {
    const room = rooms[roomId];
    return { room, team: room.players[pid], m: room.players[pid].squad[idx], opp: room.players[oppId], key: `${pid}:${idx}` };
};
function startDance(roomId, pid, idx, oppId, skillIdx, now) {
    const { team, m, key } = ctxOf(roomId, pid, idx, oppId);
    const sk = skillsOf(m)[skillIdx];
    if (!isDancing(m, now)) { m.danceAnchor = { x: m.x, z: m.z || 0 }; m.dancePhase = 0; }
    const NEVER = now + 1e9;
    const end = sk.duration ? now + sk.duration : NEVER;
    m.statusEffects = m.statusEffects.filter(ef => ef.type !== sk.type);
    m.statusEffects.push({ type: sk.type, endTime: end, duration: sk.duration ?? 0, skillIdx, start: now, next: now });
    // hồi chiêu tính từ lúc múa xong -> trong lúc múa khoá nút (endDance đặt lại thời điểm thật)
    if (!team.debugNoMana) m.skillCooldowns[skillIdx] = NEVER;
    const allies = team.squad.filter(a => a.alive && !a.summon);   // Golem triệu hồi không nhận buff
    if (sk.type === 'dance_tide') {
        allies.forEach(a => {
            a.statusEffects = a.statusEffects.filter(ef => !(ef.type === 'tide_mana' && ef.src === key));
            a.statusEffects.push({ type: 'tide_mana', endTime: end, duration: sk.duration, manaPerSec: sk.manaPerSec, src: key, srcIdx: idx });
        });
    } else if (sk.type === 'dance_god') {
        allies.forEach(a => {
            endWaterGod(a, key);
            const bonus = Math.round(a.maxHp * sk.hpUp);
            a.maxHp += bonus; a.hp = Math.min(a.maxHp, a.hp + bonus);
            a.statusEffects.push({ type: 'water_god', endTime: end, duration: sk.duration, atkUp: sk.atkUp, healUp: sk.healUp,
                ccResist: a === m ? sk.selfCc : sk.teamCc, hpBonus: bonus, src: key, srcIdx: idx });
        });
        if (sk.selfCc >= 1) cleanse(m, 'all');
    }
    m.danceKey = danceKeyOf(m, now);
}
/** Trả phần máu tối đa của Thủy Thần Vũ (do Nerissa `src` phát) */
function endWaterGod(a, src) {
    for (const ef of a.statusEffects) {
        if (ef.type !== 'water_god' || (src && ef.src !== src)) continue;
        a.maxHp = Math.max(1, a.maxHp - (ef.hpBonus ?? 0));
        a.hp = Math.min(a.hp, a.maxHp);
        ef.hpBonus = 0;
    }
    a.statusEffects = a.statusEffects.filter(ef => !(ef.type === 'water_god' && (!src || ef.src === src)));
}
/** Dừng 1 điệu múa (hết giờ / hết Orb / bị ngắt): gỡ buff đồng đội, hồi chiêu bắt đầu đếm */
function endDance(roomId, pid, idx, oppId, type, now, reason) {
    const { team, m, key } = ctxOf(roomId, pid, idx, oppId);
    const ef = m.statusEffects.find(e => e.type === type);
    if (!ef) return;
    m.statusEffects = m.statusEffects.filter(e => e !== ef);
    const sk = skillsOf(m)[ef.skillIdx];
    if (!team.debugNoMana) m.skillCooldowns[ef.skillIdx] = now + (sk?.cooldown ?? 0);
    team.squad.forEach(a => {
        if (type === 'dance_tide') a.statusEffects = a.statusEffects.filter(e => !(e.type === 'tide_mana' && e.src === key));
        if (type === 'dance_god') endWaterGod(a, key);
    });
    m.danceKey = danceKeyOf(m, now);
    io.to(roomId).emit('waterFx', { kind: 'danceEnd', casterId: pid, casterIdx: idx, dance: DANCE_NUM[type], reason, danceKey: m.danceKey });
}
function endDances(roomId, pid, idx, oppId, now, reason) {
    for (const t of DANCE_TYPES) endDance(roomId, pid, idx, oppId, t, now, reason);
}
/** Gục: dừng múa · Triều Dâng: đối thủ gục -> phe có Nerissa +Orb */
function onDancerDeathHooks(target, squad) {
    if (!curRoom) return;
    const now = curRoom.clock ?? Date.now();
    endWaterGod(target, null);   // gục: trả phần máu tối đa của Thủy Thần Vũ (hồi sinh không giữ buff)
    const at = locate(target);
    if (at && isDancing(target, now)) {
        const oppId = Object.keys(curRoom.players).find(id => id !== at.pid);
        endDances(curRoom.id, at.pid, at.idx, oppId, now, 'dead');
    }
    for (const [pid, p] of Object.entries(curRoom.players)) {
        if (p.squad === squad) continue;
        p.squad.forEach((n, i) => {
            const t = talentOf(n, 'tide_surge');
            if (!t || !n.alive) return;
            p.squad.forEach(a => { if (a.alive && !p.debugNoMana) a.mp = Math.min(a.maxMp, a.mp + (t.orbs ?? 1) * ORB_COST); });
            io.to(curRoom.id).emit('waterFx', { kind: 'surge', casterId: pid, casterIdx: i, orbs: t.orbs ?? 1 });
        });
    }
}
/** Mỗi tick: điệu múa của Nerissa */
function processDance(roomId, pid, idx, oppId, now) {
    const { team, m, opp, key } = ctxOf(roomId, pid, idx, oppId);
    if (!m.statusEffects.some(ef => DANCE_TYPES.has(ef.type))) return;
    if (!m.alive) return endDances(roomId, pid, idx, oppId, now, 'dead');
    // hết giờ
    for (const ef of [...m.statusEffects]) if (DANCE_TYPES.has(ef.type) && ef.endTime <= now) endDance(roomId, pid, idx, oppId, ef.type, now, 'time');
    const tide = danceOn(m, 'dance_tide', now), flow = danceOn(m, 'dance_flow', now), god = danceOn(m, 'dance_god', now);
    m.danceKey = danceKeyOf(m, now);
    const allies = team.squad.filter(a => a.alive);
    const foes = opp.squad.filter(e => e.alive && !isJudged(e, now));
    const sks = skillsOf(m);
    // ---- Lưu Thủy: đốt Orb hồi máu cả đội ----
    if (flow) {
        const ef = m.statusEffects.find(e => e.type === 'dance_flow');
        const sk = sks[ef.skillIdx];
        if (now >= ef.next) {
            ef.next = now + sk.drainEvery;
            const debugEnd = team.debugNoMana && now - ef.start >= 5000;
            if ((!team.debugNoMana && m.mp < sk.drainMp) || debugEnd) {
                endDance(roomId, pid, idx, oppId, 'dance_flow', now, 'mana');
            } else {
                if (!team.debugNoMana) m.mp -= sk.drainMp;
                const mAtk = getEffectiveStats(m, now).stats.mAtk;
                const heals = allies.map(a => ({ targetIndex: team.squad.indexOf(a), heal: healUnit(a, mAtk * sk.heal + a.maxHp * sk.healPct, now) }));
                io.to(roomId).emit('waterFx', { kind: 'flowHeal', casterId: pid, casterIdx: idx, heals });
            }
        }
    }
    // ---- cả 3 điệu: nốt nhạc mỗi 1s ----
    const godEf = m.statusEffects.find(e => e.type === 'dance_god' && e.endTime > now);
    const godSk = godEf && sks[godEf.skillIdx];
    if (tide && flow && god && godSk) {
        if (now >= (m.noteNext ?? 0)) {
            m.noteNext = now + godSk.noteEvery;
            const effects = foes.map(e => {
                const i = opp.squad.indexOf(e);
                const eff = hitTarget(m, e, i, opp, godSk.noteMultiplier, now, { delay: 350, aoe: true, noBlock: true });
                e.statusEffects = e.statusEffects.filter(ef => ef.type !== 'note_break');
                e.statusEffects.push({ type: 'note_break', endTime: now + godSk.noteTime, duration: godSk.noteTime, value: godSk.noteMdefDown, debuff: true });
                return eff;
            });
            const CC = ['stun', 'knockup', 'knocked', 'taunted', 'grabbed'];
            const allyNotes = allies.map(a => {
                a.statusEffects = a.statusEffects.filter(ef => ef.type !== 'note_amp');
                a.statusEffects.push({ type: 'note_amp', endTime: now + godSk.noteTime, duration: godSk.noteTime, value: godSk.noteAmp });
                const ccs = a.statusEffects.filter(ef => CC.includes(ef.type) && ef.endTime > now && !ef.noCleanse);
                let cleansed = null;
                if (ccs.length && Math.random() < godSk.noteCleanse) {
                    const pick = ccs[Math.floor(Math.random() * ccs.length)];
                    a.statusEffects = a.statusEffects.filter(ef => ef !== pick);
                    // hất tung / túm đi kèm choáng -> gỡ luôn choáng của nó
                    if (pick.type === 'knockup' || pick.type === 'grabbed' || pick.type === 'knocked') a.statusEffects = a.statusEffects.filter(ef => ef.type !== 'stun');
                    cleansed = pick.type;
                }
                return { targetIndex: team.squad.indexOf(a), cleansed };
            });
            io.to(roomId).emit('waterFx', { kind: 'notes', casterId: pid, casterIdx: idx, targetId: oppId, effects, allies: allyNotes });
        }
    } else m.noteNext = 0;
    // ---- Thiên phú 1: Hòa Âm Thủy Vũ ----
    const h = talentOf(m, 'water_harmony');
    if (!h) return;
    const ts = timeScaleOf(rooms[roomId]);
    // 1+2: giáp nước cả đội, tự hồi
    if (tide && flow) {
        allies.forEach(a => {
            const max = Math.round(a.maxHp * h.shield);
            let ef = a.statusEffects.find(e => e.type === 'water_shield' && e.src === key);
            if (!ef) {
                ef = { type: 'water_shield', endTime: now + 1500, duration: 1500, hp: max, maxHp: max, src: key };
                addShield(a, ef, now);
                if (!a.statusEffects.includes(ef)) a.statusEffects.push(ef);
                io.to(roomId).emit('waterFx', { kind: 'shield', casterId: pid, casterIdx: idx, targetIndex: team.squad.indexOf(a), shield: max });
            }
            ef.endTime = now + 1500;
            ef.maxHp = max;
            if (!ef.dormant) ef.hp = Math.min(max, (ef.hp ?? 0) + a.maxHp * h.shieldRegen * 0.05 * ts);
        });
    }
    // 2+3: hút Orb đối thủ (tối đa drainMax mỗi lần tổ hợp)
    if (flow && god) {
        m.drainSession ??= {};
        foes.forEach(e => {
            const ei = opp.squad.indexOf(e);
            const done = m.drainSession[ei] ?? 0;
            if (done >= h.drainMax || e.mp <= 0) return;
            const d = Math.min(e.mp, h.drainPerSec * 0.05 * ts, h.drainMax - done);
            e.mp -= d;
            m.drainSession[ei] = done + d;
            if (Math.floor((done + d) / 500) > Math.floor(done / 500)) io.to(roomId).emit('waterFx', { kind: 'drain', casterId: pid, casterIdx: idx, targetId: oppId, targetIndex: opp.squad.indexOf(e) });
        });
    } else m.drainSession = null;
    // 1+3: phe ta nhanh, phe địch chậm
    if (tide && god) {
        allies.forEach(a => { a.statusEffects = a.statusEffects.filter(e => e.type !== 'tide_haste'); a.statusEffects.push({ type: 'tide_haste', endTime: now + 300, value: h.hasteUp }); });
        foes.forEach(e => { e.statusEffects = e.statusEffects.filter(x => x.type !== 'tide_slow'); e.statusEffects.push({ type: 'tide_slow', endTime: now + 300, value: h.slow, debuff: true }); });
    }
    // 1+2+3: cả đội +1 Orb ngay (giới hạn số lần mỗi trận)
    if (tide && flow && god && !m.giftThisCombo && (m.giftsUsed ?? 0) < (h.gifts ?? 1)) {
        m.giftsUsed = (m.giftsUsed ?? 0) + 1;
        m.giftThisCombo = true;
        allies.forEach(a => { if (!team.debugNoMana) a.mp = Math.min(a.maxMp, a.mp + ORB_COST); });
        io.to(roomId).emit('waterFx', { kind: 'gift', casterId: pid, casterIdx: idx, orbs: 1 });
    }
    if (!(tide && flow && god)) m.giftThisCombo = false;
}

// ============================================================
// TAM NGUYÊN (Elarion) — Ngọc Nguyên Tố · Sách Nguyên Tố · Bão Nguyên Tố · 10 phép · Golem Nguyên Tố
// ============================================================
const ELEMS = ['f', 'i', 'b'];                                   // Hỏa / Băng / Lôi
const ELEM_KEY = { f: 'fire', i: 'ice', b: 'bolt' };
/** Công thức không cần đúng thứ tự: 3 viên -> chuỗi đã sắp ('fib', 'ffi'...) */
const recipeOf = (els) => [...els].sort((a, b) => ELEMS.indexOf(a) - ELEMS.indexOf(b)).join('');
const SPELL_BY_RECIPE = Object.fromEntries(Object.entries(CLASS_DEFS.elementalist.spells).map(([k, sp]) => [recipeOf(sp.recipe.split('')), k]));
const emitElem = (roomId, data) => io.to(roomId).emit('elemFx', data);
/** Chỗ ngọc lơ lửng PHÍA TRÊN pháp sư (lệch so với vị trí pháp sư, tính từ mặt đất): hàng dưới 5 ô, hàng trên 4 ô (Bão Nguyên Tố) */
const GEM_SLOTS = (() => {
    const out = [];
    [-1.8, -0.9, 0, 0.9, 1.8].forEach(x => out.push({ ox: x, oy: Math.round((3.7 - 0.12 * Math.abs(x)) * 100) / 100, oz: 0.6 }));
    [-1.35, -0.45, 0.45, 1.35].forEach(x => out.push({ ox: x, oy: Math.round((4.6 - 0.1 * Math.abs(x)) * 100) / 100, oz: 0.6 }));
    return out;
})();
const stormOn = (m, now) => m.statusEffects?.find(e => e.type === 'elem_storm' && e.endTime > now) ?? null;

/** Rơi 1 viên ngọc ngẫu nhiên (1 hệ không rơi quá gemMaxRun lần liền). Sống gemLife ms GIỜ THẬT (đổi ra giờ trận theo tốc độ) */
function spawnGem(m, now, ts, storm = false) {
    const def = CLASS_DEFS.elementalist;
    const used = new Set(m.gems.map(g => g.slot));
    const free = GEM_SLOTS.map((_, i) => i).filter(i => !used.has(i));
    if (!free.length) return null;
    const inner = free.filter(i => i < 5);
    const pool = inner.length ? inner : free;
    const slot = pool[Math.floor(Math.random() * pool.length)];
    const hist = m.gemHist ?? [];
    const run = def.gemMaxRun;
    let opts = ELEMS;
    if (hist.length >= run && hist.slice(-run).every(e => e === hist[hist.length - 1])) opts = ELEMS.filter(e => e !== hist[hist.length - 1]);
    const el = opts[Math.floor(Math.random() * opts.length)];
    m.gemHist = [...hist, el].slice(-run);
    const g = { id: (m.gemSeq = (m.gemSeq ?? 0) + 1), el, slot, ...GEM_SLOTS[slot], born: now, end: now + def.gemLife * ts, storm };
    m.gems.push(g);
    return g;
}

/** Ngọc từ kỹ năng: ĐỒNG ĐỘI dùng đủ 5 kỹ năng / ĐỐI THỦ dùng đủ 10 kỹ năng -> +1 ngọc ngẫu nhiên lên khay của Elarion.
 *  Không tính kỹ năng của chính Elarion và của nhân vật triệu hồi (Golem). Khay đầy (9 ô) thì giữ lượt, có chỗ là ra ngọc */
const GEM_GIFT = { ally: 5, foe: 10 };
function elemGemGift(room, casterId, casterIdx, now) {
    const caster = room.players[casterId]?.squad[casterIdx];
    if (!caster || caster.summon) return;
    const ts = timeScaleOf(room);
    for (const [pid, p] of Object.entries(room.players)) {
        p.squad.forEach((m, idx) => {
            if (m.classId !== 'elementalist' || !m.alive || m === caster) return;
            const side = pid === casterId ? 'ally' : 'foe';
            const key = side === 'ally' ? 'giftAlly' : 'giftFoe';
            m[key] = Math.min(GEM_GIFT[side], (m[key] ?? 0) + 1);
            if (m[key] < GEM_GIFT[side]) return;
            m.gems ??= [];
            const g = spawnGem(m, now, ts);
            if (!g) return;   // khay đầy: giữ lượt
            m[key] = 0;
            g.gift = side;
            emitElem(room.id, { kind: 'gemGift', casterId: pid, casterIdx: idx, gemId: g.id, el: g.el, from: side, sourceId: casterId, sourceIdx: casterIdx });
        });
    }
}

/** Nhặt ngọc: bay vào 3 ô ngọc (viên thứ 4 đẩy viên cũ nhất ra) · thiên phú 1: +1 tầng hệ đó, làm mới 5s */
function pickGem(room, pid, idx, gemId, now) {
    const m = room.players[pid]?.squad[idx];
    if (!m || m.classId !== 'elementalist' || !m.alive || !m.gems) return false;
    const g = m.gems.find(x => x.id === gemId && x.end > now);
    if (!g) return false;
    m.gems = m.gems.filter(x => x !== g);
    m.held.push(g.el);
    const pushed = m.held.length > CLASS_DEFS.elementalist.gemHold ? m.held.shift() : null;
    const t = talentOf(m, 'elem_attune');
    if (t) {
        const type = 'attune_' + ELEM_KEY[g.el];
        let ef = m.statusEffects.find(e => e.type === type && e.endTime > now);
        if (!ef) { ef = { type, stacks: 0 }; m.statusEffects = m.statusEffects.filter(e => e.type !== type); m.statusEffects.push(ef); }
        ef.stacks = Math.min(t.maxStacks, ef.stacks + 1);
        ef.per = t[ELEM_KEY[g.el]];
        if (g.el === 'b') ef.orb = t.orb ?? 0;   // Lôi: + tốc độ hồi Orb mỗi tầng
        ef.endTime = now + t.duration; ef.duration = t.duration;
    }
    emitElem(room.id, { kind: 'pick', casterId: pid, casterIdx: idx, gemId, el: g.el, held: [...m.held], pushed });
    return true;
}

/** Kỹ năng dùng được ngay về mặt điều kiện riêng (ngoài Orb / hồi chiêu): Sách cần đủ 3 viên, nút phép cần có phép */
function skillUsable(m, idx) {
    if (m.classId !== 'elementalist') return true;
    const sk = skillsOf(m)[idx];
    if (sk?.type === 'elem_book') return (m.held?.length ?? 0) >= 3 && !!SPELL_BY_RECIPE[recipeOf(m.held)];
    if (sk?.type === 'elem_spell') return !!m.spell;
    return true;
}

/** Nút KN2 trở về trống ("Chưa có phép") — phép chỉ dùng được 1 lần, dùng xong phải ghép lại */
function clearSpell(m) {
    m.spell = null;
    m.skills[1] = { ...CLASS_DEFS.elementalist.skills[1] };
}
/** Đặt phép `key` vào nút KN2 (giữ hồi chiêu riêng của từng phép) */
function setSpell(m, key, now) {
    const sp = m.spells?.[key];
    if (!sp) return;
    m.spell = key;
    m.skills[1] = { ...sp };
    m.spellCd ??= {};
    m.skillCooldowns[1] = Math.max(now, m.spellCd[key] ?? 0);
}

/** Mỗi tick: ngọc rơi / tan, Bão Nguyên Tố bổ sung ngọc, Băng hồi máu, AI nhặt ngọc · Golem: hết giờ thì tan, hào quang sét */
function processElementalist(roomId, pid, idx, oppId, now) {
    const room = rooms[roomId];
    const team = room.players[pid];
    const m = team.squad[idx];
    if (m.classId === 'elem_golem') return processGolem(roomId, pid, idx, oppId, now);
    if (m.classId !== 'elementalist') return;
    const def = CLASS_DEFS.elementalist;
    const ts = timeScaleOf(room);
    m.gems ??= []; m.held ??= [];
    if (m.gems.some(g => g.end <= now)) m.gems = m.gems.filter(g => g.end > now);
    const storm = stormOn(m, now);
    if (storm) {
        if (m.gems.length < (storm.fill ?? 7) && now >= (m.stormNext ?? 0)) { spawnGem(m, now, ts, true); m.stormNext = now + 120; }
    } else if (now >= (m.gemNext ?? 0)) {
        if (m.gemNext && m.gems.length < def.gemMax) spawnGem(m, now, ts);
        m.gemNext = now + def.gemEvery;
    }
    // Hơi Nước Bỏng: mưa hồi máu + sét đánh mỗi giây
    processRain(room, pid, idx, oppId, now);
    // Băng Hoại Hỏa Thiên: chưởng SolarBeam — sát thương mỗi giây
    processBeam(room, pid, idx, oppId, now);
    // Cộng Hưởng Băng: hồi % máu mỗi giây theo số tầng
    const ice = m.statusEffects.find(e => e.type === 'attune_ice' && e.endTime > now);
    if (ice && m.hp < m.maxHp) healUnit(m, m.maxHp * (ice.per ?? 0) * ice.stacks / 20 * ts, now);
    // Tự đánh / phe máy: AI tự nhặt ngọc theo công thức hợp tình huống
    if ((team.autoMode || m.autoOn) && room.players[oppId]) elemAiPick(room, pid, idx, oppId, now);
}

/** Đóng băng = choáng (đứng im, bị ngắt niệm) + lớp băng phủ người. Trả về thời gian thật sự bị đóng băng */
function applyFreeze(e, ms, now) {
    if (!e.alive) return 0;
    const dur = ccTime(e, ms, now);
    if (dur <= 0) return 0;
    applyStun(e, ms, now);
    e.statusEffects = e.statusEffects.filter(x => x.type !== 'frozen');
    e.statusEffects.push({ type: 'frozen', endTime: now + dur, duration: dur, debuff: true });
    return dur;
}
/** Thêm / làm mới 1 hiệu ứng (không cộng dồn) */
function putEffect(m, ef) {
    m.statusEffects = m.statusEffects.filter(x => x.type !== ef.type);
    m.statusEffects.push(ef);
}
const foesOf = (opp, now) => opp.squad.map((e, i) => ({ e, i })).filter(o => o.e.alive && !isJudged(o.e, now));
const distXZ = (a, x, z) => Math.hypot(a.x - x, (a.z || 0) - z);

/** Giáp Băng Sét: ai đánh trúng pháp sư (khi còn hiệu lực) bị sét giật + choáng — mỗi người tối đa 1 lần / counterEvery */
function wardCounter(attacker, mage, now) {
    const ward = mage.statusEffects?.find(e => e.type === 'storm_ward' && e.endTime > now);
    if (!ward || !attacker?.alive || !mage.alive || !curRoom) return;
    const at = locate(attacker), mt = locate(mage);
    if (!at || !mt || at.pid === mt.pid) return;
    ward.hitAt ??= {};
    const key = at.pid + ':' + at.idx;
    if (now < (ward.hitAt[key] ?? 0)) return;
    ward.hitAt[key] = now + (ward.every ?? 1000);
    const room = curRoom;
    later(1, () => {
        const t = room.clock ?? now;
        if (!attacker.alive) return;
        const eff = hitTarget(mage, attacker, at.idx, room.players[at.pid], ward.counter ?? 0.3, t, { noCounter: true, aoe: true });
        if (!eff.isMiss) applyStun(attacker, ward.counterStun ?? 500, t);
        emitElem(room.id, { kind: 'shock', casterId: mt.pid, casterIdx: mt.idx, targetId: at.pid, targetIndex: at.idx, effect: eff });
    });
}

/** Tầng HÀN KHÍ: mọi sát thương BĂNG (của bất kỳ ai) cộng 1 tầng — mỗi tầng −2% tốc đánh, giữ 5s; đủ 5 tầng -> đóng băng 1,5s.
 *  Bị giải hiệu ứng (mọi cách) thì mất tầng, đếm lại. Trả về thời gian đóng băng nếu vừa đủ tầng (0 nếu chưa) */
const CHILL = { per: 0.02, time: 5000, max: 5, freeze: 1500 };
function addChill(e, now, n = 1) {
    if (!e?.alive || e.summon) return 0;
    const cur = e.statusEffects.find(x => x.type === 'chill' && x.endTime > now);
    const stacks = (cur?.stacks ?? 0) + n;
    if (stacks >= CHILL.max) {
        e.statusEffects = e.statusEffects.filter(x => x.type !== 'chill');
        return applyFreeze(e, CHILL.freeze, now);
    }
    putEffect(e, { type: 'chill', stacks, per: CHILL.per, endTime: now + CHILL.time, duration: CHILL.time, debuff: true });
    return 0;
}
/** Đòn băng: sát thương + Hàn Khí (eff.frozen / eff.chill để client vẽ) */
function iceHit(m, e, i, opp, mult, now, opts = {}) {
    const eff = hitTarget(m, e, i, opp, mult, now, { aoe: true, ...opts });
    if (!eff.isMiss) {
        const fr = addChill(e, now);
        if (fr) eff.frozen = fr;
        eff.chill = e.statusEffects.find(x => x.type === 'chill')?.stacks ?? 0;
    }
    return eff;
}

/** Tung phép đang giữ ở nút KN2 */
function castElemSpell(room, pid, idx, oppId, sp, now, effects, extra) {
    const team = room.players[pid], opp = room.players[oppId];
    const m = team.squad[idx];
    const roomId = room.id;
    const side = m.side === 'left' ? 1 : -1;   // hướng về phía phe địch
    const cur = opp.squad[m.targetIndex];
    const target = (cur?.alive && canBeTargeted(cur, now)) ? cur : findBestTarget(m, opp.squad, now);
    const base = { casterId: pid, casterIdx: idx, targetId: oppId, spell: sp.key };
    extra.spell = sp.key;
    switch (sp.key) {
        case 'meteor': {
            // rơi vào chỗ đông đối thủ nhất -> lăn CHẬM (tầm lướt Zerith) -> vệt lửa (2 lần)
            const pt = bestCluster(m, opp.squad, 99, sp.radius, now) ?? (target ? { x: target.x, z: target.z || 0 } : null);
            if (!pt) return;
            const x0 = pt.x, z0 = pt.z;
            // lăn thẳng TỚI (về phía sau đội địch)
            const xEnd = Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, x0 + side * sp.rollLen));
            extra.meteor = { x: x0, z: z0, xEnd, fall: sp.impact, rollTime: sp.rollTime, trailTime: sp.trailTime, radius: sp.radius, width: sp.rollWidth };
            later(sp.impact, () => {
                const t = room.clock;
                // chạm đất: LUÔN CHÍ MẠNG (lăn / vệt lửa / va chạm thì bình thường)
                const hits = foesOf(opp, t).filter(o => distXZ(o.e, x0, z0) <= sp.radius).map(o => hitTarget(m, o.e, o.i, opp, sp.multiplier, t, { aoe: true, forceCrit: true }));
                emitElem(roomId, { ...base, kind: 'meteorHit', x: x0, z: z0, effects: hits });
            });
            // thiên thạch đang lăn: lưu lại để Lốc Xoáy đẩy đối thủ va vào thì tính thêm sát thương
            const ball = { team: pid, caster: m, x0, z0, xEnd, start: now + sp.impact, end: now + sp.impact + sp.rollTime, width: sp.rollWidth, crash: sp.crashMultiplier, hit: new Set() };
            (room.meteors ??= []).push(ball);
            later(sp.impact + sp.rollTime + 50, () => { room.meteors = (room.meteors ?? []).filter(b => b !== ball); });
            const steps = 20;
            for (let k = 1; k <= steps; k++) later(sp.impact + sp.rollTime * k / steps, () => {
                const t = room.clock;
                const a = x0 + (xEnd - x0) * (k - 1) / steps, b = x0 + (xEnd - x0) * k / steps;
                const lo = Math.min(a, b) - 0.9, hi = Math.max(a, b) + 0.9;
                const hits = foesOf(opp, t).filter(o => !ball.hit.has(o.e) && o.e.x >= lo && o.e.x <= hi && Math.abs((o.e.z || 0) - z0) <= sp.rollWidth)
                    .map(o => { ball.hit.add(o.e); return hitTarget(m, o.e, o.i, opp, sp.rollMultiplier, t, { aoe: true }); });
                if (hits.length) emitElem(roomId, { ...base, kind: 'rollHit', effects: hits });
            });
            for (let k = 1; k <= sp.trailTicks; k++) later(sp.impact + sp.rollTime + k * sp.trailGap - 500, () => {
                const t = room.clock;
                const lo = Math.min(x0, xEnd) - 0.5, hi = Math.max(x0, xEnd) + 0.5;
                const hits = foesOf(opp, t).filter(o => o.e.x >= lo && o.e.x <= hi && Math.abs((o.e.z || 0) - z0) <= sp.rollWidth)
                    .map(o => hitTarget(m, o.e, o.i, opp, sp.trailMultiplier, t, { aoe: true }));
                if (hits.length) emitElem(roomId, { ...base, kind: 'trailHit', effects: hits });
            });
            break;
        }
        case 'frost': {
            // khối băng thành hình trên đầu đội địch 1,5s -> rơi xuống: cả đội địch trúng -> vỡ ra 5 khối nhỏ văng xuống
            const pt = bestCluster(m, opp.squad, 99, 6, now) ?? (target ? { x: target.x, z: target.z || 0 } : null);
            if (!pt) return;
            const land = sp.impact + sp.form + sp.fall;
            const frozenOnce = new Set();   // cơ hội đóng băng: tính 1 lần mỗi đối thủ cho cả chiêu
            const chill = (e, eff, t) => {
                if (eff.isMiss) return;
                putEffect(e, { type: 'frost_slow', endTime: t + sp.slowTime, duration: sp.slowTime, value: sp.slow, debuff: true });
                if (!frozenOnce.has(e)) {
                    frozenOnce.add(e);
                    if (Math.random() < sp.freezeChance) { const fr = applyFreeze(e, sp.freezeTime, t); if (fr) eff.frozen = fr; }
                }
            };
            const shards = [];
            const foesNow = foesOf(opp, now);
            for (let k = 0; k < sp.shards; k++) {
                const o = foesNow.length ? foesNow[Math.floor(Math.random() * foesNow.length)].e : null;
                const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 2.5;
                shards.push(o && Math.random() < 0.7 ? { x: o.x + (Math.random() - 0.5), z: (o.z || 0) + (Math.random() - 0.5) * 0.6 }
                    : { x: pt.x + Math.cos(a) * r, z: pt.z + Math.sin(a) * r * 0.5 });
            }
            extra.frost = { x: pt.x, z: pt.z, form: sp.form, fall: sp.fall, start: sp.impact, shards };
            later(land, () => {
                const t = room.clock;
                const hits = foesOf(opp, t).map(o => { const eff = iceHit(m, o.e, o.i, opp, sp.multiplier, t); chill(o.e, eff, t); return eff; });
                emitElem(roomId, { ...base, kind: 'frostHit', x: pt.x, z: pt.z, effects: hits });
            });
            shards.forEach((p, k) => later(land + 350 + k * 70, () => {
                const t = room.clock;
                const hits = foesOf(opp, t).filter(o => distXZ(o.e, p.x, p.z) <= sp.shardRadius)
                    .map(o => { const eff = iceHit(m, o.e, o.i, opp, sp.shardMultiplier, t); chill(o.e, eff, t); return eff; });
                emitElem(roomId, { ...base, kind: 'shardHit', x: p.x, z: p.z, effects: hits });
            }));
            break;
        }
        case 'chain': {
            // sét nảy qua tối đa 5 đối thủ (gần nhau nhất); sau đó mỗi lần 50% nảy tiếp sang đối thủ khác (được trúng lại)
            if (!target) return;
            const list = [target];
            const near = (from, pool) => pool.map(e => ({ e, d: Math.hypot(e.x - from.x, (e.z || 0) - (from.z || 0)) }))
                .filter(o => o.d <= sp.bounceRange).sort((a, b) => a.d - b.d)[0]?.e;
            while (list.length < sp.bounces) {
                const next = near(list[list.length - 1], opp.squad.filter(e => canBeTargeted(e, now) && !list.includes(e)));
                if (!next) break;
                list.push(next);
            }
            for (let extraN = 0; extraN < sp.extraMax && Math.random() < sp.extraChance; extraN++) {
                const last = list[list.length - 1];
                const next = near(last, opp.squad.filter(e => canBeTargeted(e, now) && e !== last));
                if (!next) break;
                list.push(next);
            }
            list.forEach((e, k) => {
                const i = opp.squad.indexOf(e);
                const delay = sp.impact + k * sp.bounceGap;
                const eff = hitTarget(m, e, i, opp, sp.multiplier, now, { delay });
                eff.delay = delay;
                if (!eff.isMiss) later(delay, () => {
                    const t = room.clock;
                    if (e.alive) putEffect(e, { type: 'chain_break', endTime: t + sp.debuffTime, duration: sp.debuffTime, value: sp.mDefDown, debuff: true });
                });
                effects.push(eff);
            });
            extra.chain = list.map(e => opp.squad.indexOf(e));
            break;
        }
        case 'golem':
            later(sp.impact, () => summonGolem(room, pid, idx, sp, room.clock));
            extra.golem = { x: m.x + side * 2.5, z: m.z || 0 };
            break;
        case 'ward': {
            // khiên 25% máu cho Elarion + đồng đội yếu máu nhất 6s; ai đánh trúng người có giáp bị sét giật + choáng (tới hết 6s)
            const end = now + (sp.lock ?? 0) + sp.duration;
            const ally = team.squad.filter(a => a.alive && a !== m && !a.summon).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
            extra.shields = [];
            [m, ally].filter(Boolean).forEach(a => {
                const hp = Math.round(a.maxHp * sp.shieldPct);
                a.statusEffects = a.statusEffects.filter(e => e.type !== 'storm_ward');
                addShield(a, { type: 'storm_ward', hp, maxHp: hp, endTime: end, duration: sp.duration,
                    counter: sp.counterMultiplier, counterStun: sp.counterStun, every: sp.counterEvery, hitAt: {}, ownerIdx: idx }, now);
                extra.shields.push({ targetIndex: team.squad.indexOf(a), shield: hp });
            });
            break;
        }
        case 'tornado': {
            // lốc xoáy bay thẳng tới: sát thương + đẩy lùi mọi đối thủ trên đường (va vào Thiên Thạch đang lăn -> thêm sát thương)
            let ux = side, uz = 0;
            if (target) { const dx = target.x - m.x, dz = (target.z || 0) - (m.z || 0), d = Math.hypot(dx, dz); if (d > 0.1) { ux = dx / d; uz = dz / d; } }
            const x0 = m.x + ux * 0.8, z0 = (m.z || 0) + uz * 0.8;
            extra.tornado = { x0, z0, ux, uz, length: sp.length, travel: sp.travel, width: sp.width };
            foesOf(opp, now).forEach(({ e, i }) => {
                const rx = e.x - x0, rz = (e.z || 0) - z0;
                const along = rx * ux + rz * uz, perp = Math.abs(-rx * uz + rz * ux);
                if (along < -0.6 || along > sp.length || perp > sp.width) return;
                const delay = sp.impact + Math.max(0, along) / sp.length * sp.travel;
                const eff = hitTarget(m, e, i, opp, sp.multiplier, now, { delay, aoe: true });
                eff.delay = delay;
                if (!eff.isMiss) later(delay, () => {
                    const t = room.clock;
                    if (!e.alive || ccImmune(e, t)) return;
                    const fromX = e.x, fromZ = e.z || 0;
                    e.x += ux * sp.push; e.z = (e.z || 0) + uz * sp.push;
                    clampToArena(e);
                    putEffect(e, { type: 'knocked', endTime: t + sp.knockTime });
                    e.lastAttackTime = t;
                    emitElem(roomId, { ...base, kind: 'push', targetIndex: i, fromX, fromZ, toX: e.x, toZ: e.z, time: sp.knockTime });
                    later(sp.knockTime * 0.7, () => meteorCrash(room, e, i, opp, fromX, fromZ));
                });
                effects.push(eff);
            });
            break;
        }
        case 'steam': {
            // (đã niệm 2s) mây mưa giông 7s: Elarion đứng thi triển — mưa hồi máu phe ta, sét đánh ngẫu nhiên đối thủ
            const foes = foesOf(opp, now);
            const allies = team.squad.filter(a => a.alive);
            const cx = (avg(foes.map(o => o.e.x)) ?? m.x) * 0.5 + avg(allies.map(a => a.x)) * 0.5;
            putEffect(m, { type: 'elem_rain', endTime: now + sp.duration, duration: sp.duration, next: now + sp.every, every: sp.every,
                heal: sp.heal, healPct: sp.healPct, manaPerSec: sp.manaPerSec, strike: sp.strikeMultiplier, stun: sp.strikeStun });
            extra.rain = { x: cx, z: 0, duration: sp.duration };
            break;
        }
        case 'firebolt': {
            // quả cầu hỏa lôi hiện ở điểm cố định phía trước (cách Elarion `distance` ô), to dần 2s rồi nổ tại chỗ
            const pt = { x: Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, m.x + side * sp.distance)), z: m.z || 0 };
            extra.firebolt = { x: pt.x, z: pt.z, grow: sp.grow, start: sp.impact, radius: sp.radius };
            later(sp.impact + sp.grow, () => {
                const t = room.clock;
                const hits = foesOf(opp, t).filter(o => distXZ(o.e, pt.x, pt.z) <= sp.radius).map(o => {
                    const eff = hitTarget(m, o.e, o.i, opp, sp.multiplier, t, { aoe: true });
                    if (!eff.isMiss) {
                        applyStun(o.e, sp.stun, t);
                        if (!opp.debugNoMana) { const lost = Math.min(o.e.mp, sp.orbBurn * ORB_COST); o.e.mp -= lost; eff.orbLost = lost / ORB_COST; }
                    }
                    return eff;
                });
                emitElem(roomId, { ...base, kind: 'fireboltHit', x: pt.x, z: pt.z, radius: sp.radius, effects: hits });
                // nổ: cả đội +1 Orb, riêng Elarion +2
                const gains = [];
                team.squad.forEach((a, i) => {
                    if (!a.alive || a.summon) return;
                    const n = a === m ? (sp.selfOrbs ?? 2) : (sp.teamOrbs ?? 1);
                    if (!team.debugNoMana) a.mp = Math.min(a.maxMp, a.mp + n * ORB_COST);
                    gains.push({ i, orbs: n });
                });
                emitElem(roomId, { ...base, kind: 'teamOrb', gains });
            });
            break;
        }
        case 'beams': {
            // dồn lực (impact) -> đứng yên chưởng SolarBeam băng-hỏa `duration` ms; sát thương mỗi giây do processBeam
            const aim = beamAim(m, foesOf(opp, now).map(o => o.e), sp, side, now, target);
            const start = now + sp.impact;
            putEffect(m, { type: 'elem_beam', start, endTime: start + sp.duration, duration: sp.duration, next: start + sp.every / 2, every: sp.every,
                ux: aim.ux, uz: aim.uz, tick: 0, ice: sp.iceMultiplier, fire: sp.fireMultiplier, ramp: sp.fireRamp, max: sp.fireMax, maxBonus: sp.maxBonus,
                slow: sp.slow, slowTime: sp.slowTime, width: sp.width, widthMax: sp.widthMax });
            extra.beam = { ux: aim.ux, uz: aim.uz, charge: sp.impact, duration: sp.duration, every: sp.every, max: sp.fireMax, len: beamLength(m, aim) };
            break;
        }
        case 'haste': {
            // riêng Elarion: đánh thường chưởng 2 lần + tốc đánh; cứ 5 đòn -> cả đội +tốc đánh (cộng dồn)
            putEffect(m, { type: 'storm_self', endTime: now + (sp.impact ?? 0) + sp.duration, duration: sp.duration, value: sp.atkSpeedUp,
                every: sp.every, teamUp: sp.teamUp, teamTime: sp.teamTime, teamMax: sp.teamMax, autos: 0, orbRegen: sp.orbRegen ?? 2 });   // + hồi Orb ×2
            break;
        }
    }
}
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/** Lốc Xoáy đẩy đối thủ va vào Thiên Thạch đang lăn (của phe mình) -> sát thương va chạm (mỗi quả 1 lần / người) */
function meteorCrash(room, e, i, opp, fromX, fromZ) {
    const t = room.clock;
    if (!e.alive) return;
    for (const b of room.meteors ?? []) {
        if (t < b.start || t > b.end || b.crashed?.has(e)) continue;
        if (room.players[b.team] === opp) continue;
        const p = Math.min(1, (t - b.start) / (b.end - b.start));
        const bx = b.x0 + (b.xEnd - b.x0) * p;
        const lo = Math.min(fromX, e.x, bx) , hi = Math.max(fromX, e.x, bx);
        const crossed = Math.abs(e.x - bx) <= 1.6 || (bx >= Math.min(fromX, e.x) - 1 && bx <= Math.max(fromX, e.x) + 1);
        if (!crossed || hi - lo > 12 || Math.abs((e.z || 0) - b.z0) > b.width + 0.8) continue;
        (b.crashed ??= new Set()).add(e);
        const eff = hitTarget(b.caster, e, i, opp, b.crash, t, { aoe: true });
        emitElem(room.id, { kind: 'meteorCrash', casterId: b.team, targetId: Object.keys(room.players).find(id => room.players[id] === opp), x: bx, z: b.z0, effects: [eff] });
    }
}

// ------------------------------------------------------------
// GOLEM NGUYÊN TỐ — nhân vật triệu hồi (đứng cuối đội hình, không thẻ HUD, không hồi sinh)
// ------------------------------------------------------------
function summonGolem(room, pid, idx, sp, now) {
    const team = room.players[pid];
    const m = team.squad[idx];
    if (!m?.alive || room.winner) return -1;
    const gdef = CLASS_DEFS.elem_golem;
    let slot = team.squad.findIndex(x => x.classId === 'elem_golem' && x.ownerIdx === idx);
    if (slot >= 0 && team.squad[slot].alive) vanishGolem(room, pid, slot, 'replaced');
    const st = getEffectiveStats(m, now).stats;
    const side = m.side === 'left' ? 1 : -1;
    const hp = Math.round(m.maxHp * sp.hpMult);
    const g = {
        classId: 'elem_golem', name: gdef.name, emoji: gdef.emoji, color: gdef.color,
        summon: true, summonId: (room.summonSeq = (room.summonSeq ?? 0) + 1), ownerIdx: idx,
        level: m.level, rank: m.rank, rankName: m.rankName, skillLevel: m.skillLevel,
        hp, maxHp: hp, mp: 0, maxMp: 0,
        pAtk: 0, mAtk: Math.round(st.mAtk * sp.atkMult), pDef: Math.round(m.pDef * sp.pDefMult), mDef: Math.round(m.mDef * sp.mDefMult),
        crit: gdef.crit, critDmg: gdef.critDmg, acc: gdef.acc, dodge: gdef.dodge, pen: m.pen ?? 0, block: gdef.block, lifesteal: 0,
        mpAtk: 0, mpSec: 0, atkSpeed: gdef.atkSpeed, atkRange: gdef.atkRange, range: gdef.range, moveSpeed: gdef.moveSpeed,
        alive: true, x: m.x + side * 2.5, y: 0, z: m.z || 0, side,
        state: 'idle', targetIndex: -1, lockedTargetIndex: -1, lastAttackTime: now,
        skillCooldowns: [0, 0, 0], queuedSkills: [], castingSkillId: null, castEndTime: 0, statusEffects: [],
        skills: P.scaleSkills(gdef.skills, m.rank ?? 0), passives: [], talentLevels: { 1: 0, 2: 0 },
        summonEnd: now + sp.duration, golemAutos: 0, actionUntil: now + 700,
    };
    for (const k of P.UNIQUE_KEYS) g[k] = 0;
    clampToArena(g);
    if (slot >= 0) team.squad[slot] = g; else { slot = team.squad.length; team.squad.push(g); }
    emitElem(room.id, { kind: 'golemSummon', casterId: pid, casterIdx: idx, golemIdx: slot, x: g.x, z: g.z, duration: sp.duration });
    return slot;
}
/** Golem tan biến (hết giờ / bị gọi Golem mới thay) — không tính là bị hạ gục */
function vanishGolem(room, pid, slot, reason) {
    const g = room.players[pid]?.squad[slot];
    if (!g || !g.alive) return;
    g.alive = false; g.hp = 0; g.state = 'dead'; g.vanished = true;
    g.queuedSkills = []; g.castingSkillId = null; g.statusEffects = [];
    emitElem(room.id, { kind: 'golemEnd', casterId: pid, golemIdx: slot, reason });
}
/** Golem KHÔNG nhận buff / debuff nào (kể cả khống chế), trừ Ấn Tử của Zerith (và phán quyết của nó) + hiệu ứng của chính Golem */
const GOLEM_KEEP = new Set(['death_mark', 'judged', 'golem_haste', 'golem_breath']);
/** Mỗi tick (Golem): hết 20s thì tan · bỏ mọi hiệu ứng không được nhận */
function processGolem(roomId, pid, idx, oppId, now) {
    const room = rooms[roomId];
    const g = room.players[pid].squad[idx];
    if (!g.alive) return;
    if (now >= (g.summonEnd ?? Infinity)) return vanishGolem(room, pid, idx, 'time');
    if (g.statusEffects.some(e => !GOLEM_KEEP.has(e.type))) g.statusEffects = g.statusEffects.filter(e => GOLEM_KEEP.has(e.type));
}
/** Golem sau mỗi đòn đánh thường: Hào Quang Sét -> giật toàn bộ đối thủ · cứ 2 đòn -> 1 kỹ năng ngẫu nhiên đang sẵn sàng */
function golemAfterAuto(roomId, pid, idx, oppId, now) {
    const room = rooms[roomId];
    const g = room.players[pid].squad[idx];
    if (g.classId !== 'elem_golem') return;
    const charged = g.statusEffects.find(e => e.type === 'golem_haste' && e.endTime > now);
    const opp = room.players[oppId];
    if (charged && opp) {
        const hits = foesOf(opp, now).map(o => {
            const eff = hitTarget(g, o.e, o.i, opp, charged.multiplier, now, { aoe: true, delay: 250 });
            if (!eff.isMiss && Math.random() < charged.stunChance) { later(250, () => applyStun(o.e, charged.stun, room.clock)); eff.stunned = true; }
            return eff;
        });
        emitElem(roomId, { kind: 'golemShock', casterId: pid, casterIdx: idx, targetId: oppId, effects: hits });
    }
    g.golemAutos = (g.golemAutos ?? 0) + 1;
    if (g.golemAutos < 2 || g.queuedSkills.length) return;
    const ready = skillsOf(g).map((_, i) => i).filter(i => now >= (g.skillCooldowns[i] ?? 0));
    if (!ready.length) return;
    g.queuedSkills.push(ready[Math.floor(Math.random() * ready.length)]);
    g.golemAutos = 0;
}
/** Kỹ năng của Golem (sau khi niệm xong) */
function castGolemSkill(room, pid, idx, oppId, sk, now, effects, extra) {
    const opp = room.players[oppId];
    const g = room.players[pid].squad[idx];
    const roomId = room.id;
    const side = g.side === 'left' ? 1 : -1;
    const cur = opp.squad[g.targetIndex];
    const target = (cur?.alive && canBeTargeted(cur, now)) ? cur : findBestTarget(g, opp.squad, now);
    const base = { casterId: pid, casterIdx: idx, targetId: oppId };
    const clampX = (x) => Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, x));
    const clampZ = (z) => Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, z));
    if (sk.type === 'golem_fist') {
        // Nộ Lửa: lùi về phía đồng minh -> niệm 1s -> lướt chậm tới đấm lửa: hất tung mọi đối thủ trên đường; cả đội địch −M.DEF
        const bx = clampX(g.x - side * sk.backLen), bz = g.z || 0;
        const ax = g.x, az = g.z || 0;
        for (let k = 1; k <= 5; k++) later(sk.backTime * k / 5, () => { if (g.alive) { g.x = ax + (bx - ax) * k / 5; } });
        const t0 = sk.backTime + sk.channel;
        // hướng lướt: tới mục tiêu (tính lúc bắt đầu lướt)
        let ux = side, uz = 0;
        if (target) { const dx = target.x - bx, dz = (target.z || 0) - bz, d = Math.hypot(dx, dz); if (d > 0.1) { ux = dx / d; uz = dz / d; } }
        const x1 = clampX(bx + ux * sk.dashLen), z1 = clampZ(bz + uz * sk.dashLen);
        const len = Math.hypot(x1 - bx, z1 - bz) || 1;
        extra.fist = { backX: bx, backZ: bz, backTime: sk.backTime, channel: sk.channel, fromX: bx, fromZ: bz, toX: x1, toZ: z1, time: sk.dashTime };
        g.actionUntil = now + t0 + sk.dashTime + 150;
        for (let k = 1; k <= 8; k++) later(t0 + sk.dashTime * k / 8, () => { if (g.alive) { g.x = bx + (x1 - bx) * k / 8; g.z = bz + (z1 - bz) * k / 8; } });
        later(t0, () => {
            const t = room.clock;
            const hits = [];
            foesOf(opp, t).forEach(({ e, i }) => {
                const rx = e.x - bx, rz = (e.z || 0) - bz;
                const along = (rx * (x1 - bx) + rz * (z1 - bz)) / len, perp = Math.abs(-rx * (z1 - bz) + rz * (x1 - bx)) / len;
                if (along < -0.5 || along > len + 1 || perp > sk.width) return;
                const delay = Math.max(0, Math.min(len, along)) / len * sk.dashTime;
                const eff = hitTarget(g, e, i, opp, sk.multiplier, t, { delay, aoe: true });
                eff.delay = delay;
                if (!eff.isMiss) later(delay, () => knockUp(e, sk.knockup));
                hits.push(eff);
            });
            foesOf(opp, t).forEach(({ e }) => putEffect(e, { type: 'golem_break', endTime: t + sk.debuffTime, duration: sk.debuffTime, value: sk.mDefDown, debuff: true }));
            emitElem(roomId, { ...base, kind: 'fistDash', fromX: bx, fromZ: bz, toX: x1, toZ: z1, time: sk.dashTime, effects: hits });
        });
    } else if (sk.type === 'golem_blizzard') {
        // Bão Tuyết (đã niệm 2s hút khí lạnh): đứng phun bão tuyết 6s — mỗi giây ×0.35 mọi đối thủ + 1 tầng Hàn Khí
        putEffect(g, { type: 'golem_breath', endTime: now + sk.impact + sk.ticks * sk.tickGap, duration: sk.ticks * sk.tickGap });
        extra.blizzard = { ticks: sk.ticks, gap: sk.tickGap, start: sk.impact };
        for (let k = 1; k <= sk.ticks; k++) later(sk.impact + (k - 1) * sk.tickGap + 300, () => {
            const t = room.clock;
            if (!g.alive) return;
            const hits = foesOf(opp, t).map(o => iceHit(g, o.e, o.i, opp, sk.tickMultiplier, t));
            emitElem(roomId, { ...base, kind: 'blizzardTick', tick: k, effects: hits });
        });
    } else if (sk.type === 'golem_aura') {
        // Hào Quang Sét (đã niệm 1s): sét đánh vào tay -> +25% tốc đánh 5s, mỗi đòn giật toàn bộ đối thủ
        putEffect(g, { type: 'golem_haste', endTime: now + sk.impact + sk.duration, duration: sk.duration, value: sk.atkSpeedUp,
            multiplier: sk.multiplier, stunChance: sk.stunChance, stun: sk.stun });
        extra.aura = { duration: sk.duration };
    }
}

/** Elarion — Tốc Lôi: mỗi đòn đánh thường chưởng thêm 1 lần · cứ 5 đòn -> cả đội +tốc đánh (cộng dồn) */
function elemAfterAuto(roomId, pid, idx, oppId, targetIdx, now) {
    const room = rooms[roomId];
    const m = room.players[pid].squad[idx];
    if (m.classId !== 'elementalist') return;
    const st = m.statusEffects.find(e => e.type === 'storm_self' && e.endTime > now);
    if (!st) return;
    const opp = room.players[oppId];
    const target = opp?.squad[targetIdx];
    if (target?.alive) {
        const r = calculateDamage(m, target, 1.0, now);
        const delay = 160;
        if (!r.isMiss) dealDamage(target, r.damage, opp, (CLASS_DEFS.elementalist.autoImpact ?? 0) + delay, executeHook(m, target));
        emitElem(roomId, { kind: 'echoHit', casterId: pid, casterIdx: idx, targetId: oppId, targetIndex: targetIdx,
            effect: { targetIndex: targetIdx, damage: r.damage, isCrit: r.isCrit, isBlock: r.isBlock, isMiss: r.isMiss, absorbed: r.absorbed || 0, isMagic: r.isMagic, delay } });
    }
    st.autos = (st.autos ?? 0) + 1;
    if (st.autos % st.every) return;
    const allies = [];
    room.players[pid].squad.forEach((a, i) => {
        if (!a.alive || a.summon) return;
        const cur = a.statusEffects.find(e => e.type === 'storm_haste' && e.endTime > now);
        putEffect(a, { type: 'storm_haste', stacks: Math.min(st.teamMax, (cur?.stacks ?? 0) + 1), value: st.teamUp, endTime: now + st.teamTime, duration: st.teamTime });
        allies.push(i);
    });
    emitElem(roomId, { kind: 'teamHaste', casterId: pid, casterIdx: idx, allies });
}
/** Hơi Nước Bỏng đang thi triển (Elarion đứng yên) */
const rainOf = (m, now) => m.statusEffects?.find(e => e.type === 'elem_rain' && e.endTime > now) ?? null;
function endRain(room, pid, idx, reason) {
    const m = room.players[pid]?.squad[idx];
    if (!m) return;
    const had = m.statusEffects.some(e => e.type === 'elem_rain');
    m.statusEffects = m.statusEffects.filter(e => e.type !== 'elem_rain');
    if (had) emitElem(room.id, { kind: 'rainEnd', casterId: pid, casterIdx: idx, reason });
}
/** Mỗi giây lúc mưa giông: phe ta hồi máu (đầy máu thì hồi MP), sét đánh 1 đối thủ ngẫu nhiên + choáng */
function processRain(room, pid, idx, oppId, now) {
    const team = room.players[pid], opp = room.players[oppId];
    const m = team.squad[idx];
    const rain = rainOf(m, now);
    if (!rain || now < rain.next) return;
    rain.next += rain.every;
    const mAtk = getEffectiveStats(m, now).stats.mAtk;
    const heals = [];
    team.squad.forEach((a, i) => {
        if (!a.alive) return;
        if (a.hp >= a.maxHp) {
            if (a.summon || !a.maxMp) return;
            const mp = team.debugNoMana ? 0 : Math.max(0, Math.min(a.maxMp - a.mp, rain.manaPerSec));
            a.mp += mp;
            heals.push({ targetIndex: i, mana: Math.round(mp) });
        } else heals.push({ targetIndex: i, heal: healUnit(a, mAtk * rain.heal + a.maxHp * rain.healPct, now) });
    });
    let strike = null;
    const foes = opp ? foesOf(opp, now) : [];
    if (foes.length) {
        const o = foes[Math.floor(Math.random() * foes.length)];
        strike = hitTarget(m, o.e, o.i, opp, rain.strike, now, { aoe: true, delay: 150 });
        if (!strike.isMiss) later(150, () => applyStun(o.e, rain.stun, room.clock));
    }
    emitElem(room.id, { kind: 'rainTick', casterId: pid, casterIdx: idx, targetId: oppId, heals, strike });
}

/** Băng Hoại Hỏa Thiên đang chưởng (Elarion đứng yên — kể cả lúc dồn lực) */
const beamOf = (m, now) => m.statusEffects?.find(e => e.type === 'elem_beam' && e.endTime > now) ?? null;
/** Đối thủ `e` nằm trong tia chưởng từ (x0, z0) theo hướng (ux, uz), nửa bề rộng `width`, dài `len` */
function inBeam(e, x0, z0, ux, uz, width, len) {
    const rx = e.x - x0, rz = (e.z || 0) - z0;
    const along = rx * ux + rz * uz, perp = Math.abs(-rx * uz + rz * ux);
    return along >= -0.6 && along <= len + 1 && perp <= width;
}
/** Hướng chưởng: lệch tối đa maxAngle so với phía địch, quét trúng nhiều đối thủ đứng dưới đất nhất (ưu tiên mục tiêu hiện tại, ít lệch) */
function beamAim(m, foes, sp, side, now, target = null) {
    const ground = foes.filter(e => !isAirborne(e, now));
    const x0 = m.x, z0 = m.z || 0;
    const clampA = (a) => Math.max(-sp.maxAngle, Math.min(sp.maxAngle, a));
    const angs = [0, ...ground.map(e => clampA(Math.atan2((e.z || 0) - z0, Math.max(0.5, (e.x - x0) * side))))];
    let best = null;
    for (const a of angs) {
        const ux = Math.cos(a) * side, uz = Math.sin(a);
        const count = ground.filter(e => inBeam(e, x0, z0, ux, uz, sp.width, 999)).length;
        const score = count * 10 + (target && ground.includes(target) && inBeam(target, x0, z0, ux, uz, sp.width, 999) ? 3 : 0) - Math.abs(a);
        if (!best || score > best.score) best = { ux, uz, count, score };
    }
    return best;
}
/** Độ dài tia: từ Elarion thẳng tới mép bản đồ (+2 ô ra ngoài) */
function beamLength(m, { ux, uz }) {
    const M = 2, x0 = m.x, z0 = m.z || 0;
    const tx = ux > 0.01 ? (ARENA_BOUNDS.maxX + M - x0) / ux : ux < -0.01 ? (ARENA_BOUNDS.minX - M - x0) / ux : Infinity;
    const tz = uz > 0.01 ? (ARENA_BOUNDS.maxZ + M - z0) / uz : uz < -0.01 ? (ARENA_BOUNDS.minZ - M - z0) / uz : Infinity;
    return Math.max(4, Math.min(tx, tz, 120));
}
function endBeam(room, pid, idx, reason) {
    const m = room.players[pid]?.squad[idx];
    if (!m) return;
    const had = m.statusEffects.some(e => e.type === 'elem_beam');
    m.statusEffects = m.statusEffects.filter(e => e.type !== 'elem_beam');
    if (had) emitElem(room.id, { kind: 'beamEnd', casterId: pid, casterIdx: idx, reason });
}
/** Mỗi giây lúc chưởng: mọi đối thủ (dưới đất) trong tia — Băng (Hàn Khí + giảm tốc đánh) + Hỏa (tăng dần, đủ 5 tầng: tia to, +30%) */
function processBeam(room, pid, idx, oppId, now) {
    const team = room.players[pid], opp = room.players[oppId];
    const m = team.squad[idx];
    const b = m.statusEffects.find(e => e.type === 'elem_beam');
    if (!b) return;
    if (now >= b.endTime) return endBeam(room, pid, idx, 'time');
    if (now < b.next || !opp) return;
    b.next += b.every;
    b.tick = (b.tick ?? 0) + 1;
    const stacks = Math.min(b.max, b.tick);
    const big = stacks >= b.max;
    const fireMult = b.fire * (1 + b.ramp * stacks + (big ? b.maxBonus : 0));
    const width = big ? b.widthMax : b.width;
    const len = beamLength(m, b);
    const ice = [], fire = [];
    foesOf(opp, now).forEach(({ e, i }) => {
        if (isAirborne(e, now) || !inBeam(e, m.x, m.z || 0, b.ux, b.uz, width, len)) return;   // đang bay: tia đi bên dưới
        const ei = iceHit(m, e, i, opp, b.ice, now, { ground: true });
        if (!ei.isMiss) putEffect(e, { type: 'beam_slow', endTime: now + b.slowTime, duration: b.slowTime, value: b.slow, debuff: true });
        ice.push(ei);
        const ef = hitTarget(m, e, i, opp, fireMult, now, { aoe: true, ground: true, delay: 150 });
        ef.delay = 150;
        fire.push(ef);
    });
    emitElem(room.id, { kind: 'beamTick', casterId: pid, casterIdx: idx, targetId: oppId, tick: b.tick, stacks, big, bonus: Math.round((fireMult / b.fire - 1) * 100), ice, fire });
}

// ------------------------------------------------------------
// AI của Elarion: chọn phép hợp tình huống -> nhặt đúng ngọc -> đọc Sách -> tung phép
// ------------------------------------------------------------
function elemContext(room, pid, idx, oppId, now) {
    const team = room.players[pid], opp = room.players[oppId];
    const m = team.squad[idx];
    const foes = opp.squad.filter(e => canBeTargeted(e, now));
    const dist = (a, b) => Math.hypot(a.x - b.x, (a.z || 0) - (b.z || 0));
    const cluster = (r) => foes.reduce((best, c) => Math.max(best, foes.filter(e => dist(e, c) <= r).length), 0);
    const side = m.side === 'left' ? 1 : -1;
    const front = foes.length ? foes.reduce((a, b) => ((b.x - a.x) * side < 0 ? b : a)) : null;
    return {
        m, team, opp, foes, orbs: team.debugNoMana ? 99 : m.mp / ORB_COST,
        cluster4: cluster(4), frontCluster: front ? foes.filter(e => dist(e, front) <= 3.5).length : 0,
        attackers: foes.filter(e => e.targetIndex === idx && dist(e, m) <= (e.atkRange ?? 2) + 1).length,
        meleeNear: foes.some(e => (e.atkRange ?? 2) < 6 && dist(e, m) <= 5),
        alliesFighting: team.squad.filter(a => a.alive && !a.summon && a.state === 'attacking').length,
        engaged: foes.some(e => team.squad.some(a => a.alive && dist(a, e) <= (a.atkRange ?? 2) + 2)),
        golemAlive: team.squad.some(a => a.classId === 'elem_golem' && a.alive && a.ownerIdx === idx),
        alliesHurt: team.squad.filter(a => a.alive && !a.summon && a.hp / a.maxHp < 0.75).length >= 2,
        beamLine: m.spells?.beams ? beamAim(m, foes, m.spells.beams, side, now).count : 0,   // số đối thủ (dưới đất) 1 tia SolarBeam quét trúng
        boltZone: foes.filter(e => Math.hypot(e.x - (m.x + side * (m.spells?.firebolt?.distance ?? 12)), (e.z || 0) - (m.z || 0)) <= (m.spells?.firebolt?.radius ?? 3.5) + 0.5).length,
        hpPct: m.hp / m.maxHp,
    };
}
function elemSpellScore(key, c, now) {
    const m = c.m;
    const sp = m.spells?.[key];
    if (!sp || !c.foes.length) return 0;
    if ((m.spellCd?.[key] ?? 0) > now + 1500) return 0;        // còn hồi lâu
    if (c.orbs + 1.5 < sp.orbCost) return 0;                    // còn thiếu nhiều Orb
    switch (key) {
        case 'golem': return !c.golemAlive && c.engaged && c.orbs >= 4 ? 100 : 0;
        case 'ward': return c.hpPct < 0.6 || c.attackers >= 2 ? 85 : c.attackers >= 1 ? 30 : 0;
        case 'tornado': return c.meleeNear ? 70 : 0;
        case 'meteor': return c.cluster4 >= 2 ? 40 + 15 * c.cluster4 : 20;
        case 'frost': return c.foes.length >= 3 ? 48 : c.foes.length >= 2 ? 36 : 18;
        case 'chain': return c.foes.length >= 3 ? 46 : c.foes.length >= 2 ? 38 : 24;
        case 'steam': return c.meleeNear ? 0 : c.alliesHurt ? 58 : c.engaged ? 34 : 0;   // mưa giông: đứng thi triển 7s -> tránh lúc bị áp sát
        case 'firebolt': return c.boltZone >= 2 ? 48 : c.boltZone ? 34 : 0;   // chỉ dùng khi có đối thủ quanh điểm nổ (12 ô phía trước)
        case 'beams': return c.beamLine >= 3 ? 60 : c.beamLine >= 2 ? 50 : c.beamLine ? 26 : 0;   // chưởng 7s: càng nhiều đối thủ thẳng hàng càng tốt
        case 'haste': return c.engaged ? 40 : 0;
    }
    return 0;
}
/** Cần nhặt thêm những viên nào để 3 ô ngọc thành `recipe` (đẩy ra ít viên cũ nhất); null = ngọc trên sân không đủ */
function gemPlan(held, recipe, gems) {
    const count = (arr) => arr.reduce((o, e) => (o[e] = (o[e] || 0) + 1, o), {});
    const avail = count(gems.map(g => g.el));
    for (let k = 0; k <= 3; k++) {
        if (held.length + k < 3) continue;
        const keep = held.slice(Math.max(0, held.length + k - 3));
        const need = count(recipe);
        let ok = true;
        for (const e of keep) { if (!need[e]) { ok = false; break; } need[e]--; }
        if (!ok) continue;
        const list = Object.entries(need).flatMap(([e, n]) => Array(n).fill(e));
        if (list.length !== k) continue;
        const use = count(list);
        if (Object.entries(use).every(([e, n]) => (avail[e] ?? 0) >= n)) return list;
    }
    return null;
}
/** Phép AI muốn ghép (đã tính khả năng có đủ ngọc). null = chưa có gì đáng làm */
function elemAiPlan(room, pid, idx, oppId, now) {
    const c = elemContext(room, pid, idx, oppId, now);
    const m = c.m;
    const ranked = Object.keys(m.spells ?? {}).map(k => ({ k, s: elemSpellScore(k, c, now) + Math.random() * 6 })).filter(o => o.s > 0).sort((a, b) => b.s - a.s);
    // phép đang giữ còn dùng được và vẫn tốt -> không cần ghép phép khác
    for (const { k } of ranked) {
        const recipe = m.spells[k].recipe.split('');
        const plan = gemPlan(m.held, recipe, m.gems ?? []);
        if (plan) return { key: k, recipe, plan, c };
    }
    return null;
}
function elemAiPick(room, pid, idx, oppId, now) {
    const m = room.players[pid].squad[idx];
    if (now < (m.aiPickAt ?? 0) || !m.gems?.length) return;
    m.aiPickAt = now + 450;
    const c = elemContext(room, pid, idx, oppId, now);
    // phép đang giữ vẫn tốt và hết hồi chiêu -> chưa cần nhặt ngọc cho phép khác
    if (m.spell && now >= (m.skillCooldowns[1] ?? 0) && elemSpellScore(m.spell, c, now) > 0 && m.held.length === 3) return;
    // đã đủ 3 viên ghép ra phép đáng dùng -> chờ đọc Sách, không nhặt nữa
    if (m.held.length === 3) {
        const k = SPELL_BY_RECIPE[recipeOf(m.held)];
        const holdReady = m.spell && now >= (m.skillCooldowns[1] ?? 0) && elemSpellScore(m.spell, c, now) > 0;
        if (k && !(k === m.spell && holdReady) && elemSpellScore(k, c, now) > 0) return;
    }
    // giữ mục tiêu đã chọn (tránh đổi ý liên tục): tối đa 5s, hoặc tới khi hết khả thi / hết hợp lý
    let want = m.aiWant;
    const plan = want && now < want.until && elemSpellScore(want.key, c, now) > 0 ? gemPlan(m.held, want.recipe, m.gems) : null;
    if (!plan) {
        const p = elemAiPlan(room, pid, idx, oppId, now);
        if (!p) { m.aiWant = null; return; }
        want = m.aiWant = { key: p.key, recipe: p.recipe, until: now + 5000 };
    }
    const todo = plan ?? gemPlan(m.held, want.recipe, m.gems);
    if (!todo?.length) return;
    // phép muốn ghép chính là phép đang giữ và còn dùng được -> chưa cần
    if (want.key === m.spell && now >= (m.skillCooldowns[1] ?? 0)) return;
    const g = m.gems.find(x => x.el === todo[0]);
    if (g) pickGem(room, pid, idx, g.id, now);
}

function broadcastState(roomId) {
    if (!rooms[roomId]) return;
    curRoom = rooms[roomId];   // getEffectiveStats cần biết đội hình (dây liên kết của Rok)
    const room = rooms[roomId];
    const now = room.clock ?? Date.now();
    // Build a payload with effective stats for each member
    const enrichedPlayers = {};
    Object.entries(rooms[roomId].players).forEach(([pid, pdata]) => {
        enrichedPlayers[pid] = {
            ...pdata,
            squad: pdata.squad.map(m => {
                const { stats, base } = getEffectiveStats(m, now);
                return { ...m, effectiveStats: stats, baseStats: base };
            })
        };
    });
    io.to(roomId).emit('stateUpdate', { players: enrichedPlayers, clock: now, speed: room.speed ?? DEFAULT_SPEED, timeScale: timeScaleOf(room) });
}

function checkWinCondition(roomId) {
    const room = rooms[roomId];
    if (!room || room.winner) return;
    // Phân định NGAY khi 1 bên hết nhân vật còn sống (linh hồn / hộ vệ không tính).
    // Cả 2 bên cùng chết trong cùng 1 nhịp -> HOÀ.
    const ids = Object.keys(room.players);
    const dead = ids.filter(id => room.players[id].squad.every(m => !m.alive));
    if (!dead.length) return;
    if (dead.length >= 2) {
        room.winner = 'draw';
        io.to(roomId).emit('battleEnd', { draw: true, winnerId: null, loserId: null });
        return;
    }
    const loserId = dead[0];
    const winnerId = ids.find(id => id !== loserId);
    room.winner = winnerId;
    io.to(roomId).emit('battleEnd', { winnerId, loserId });
}

server.listen(PORT, () => {
    console.log(`Legend of Capsules is running at http://localhost:${PORT}`);
});
