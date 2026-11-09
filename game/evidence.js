// ============================================================
// 🔎 SỔ CHỨNG CỨ (chương 1) — gom chứng cứ qua các ải + điều tra trên bản đồ, rồi TRÌNH LÊN NHÀ VUA trước ải 18
//   pr.evidence = { <id>: true } · pr.flags.trial_score = số câu đúng (lần trình đầu tiên)
//   Nguồn chứng cứ: stage (thắng lần đầu ải đó, mức Cốt truyện) hoặc clue (điều tra vật trên bản đồ — game/world.js, type 'clue')
//   Mọi thứ ở đây là hàm thuần, server.js / game/world.js gọi.
// ============================================================
const EVIDENCE = [
    { id: 'courier_knot', icon: '🪢', name: 'Dây buộc công văn', stage: 'c1-02', desc: 'Sợi dây buộc túi công văn tên Goblin đánh rơi giữa ruộng cháy — thắt kiểu nút quân dụng.',
        comment: ['assassin', 'Nút này lính mới học trong tuần đầu nhập ngũ. Goblin thì không.'] },
    { id: 'cart_tracks', icon: '🛞', name: 'Vết bánh xe bọc sắt', clue: 'clue_wheel', needNo: 3, hint: 'Đường mòn trong Rừng Sương có vết gì đó rất sâu…', desc: 'Vết bánh xe bọc sắt in sâu trong bùn Rừng Sương — loại xe chở hàng của quân đội.',
        comment: ['assassin', 'Bánh xe bọc sắt. Goblin không có tiền mua thứ này đâu.'] },
    { id: 'lot_numbers', icon: '📦', name: 'Số lô trên hòm linh kiện', stage: 'c1-04', desc: 'Dòng số khắc trên bản lề hòm linh kiện quân đội Valoria, tìm thấy trong mỏ đá bỏ hoang.',
        comment: ['warrior', 'Giữ lại. Nhìn cái hòm thôi thì chưa nói được gì — nhưng số lô thì nói được.'] },
    { id: 'wolf_collar', icon: '⛓️', name: 'Vòng cổ khắc thánh huy', stage: 'c1-05', desc: 'Chiếc vòng cổ siết vào con sói đầu đàn. Mặt trong khắc thánh huy Varkos.',
        comment: ['warrior', 'Thánh Dũng Khí… trên cổ một con sói bị ép đánh tới chết.'] },
    { id: 'withdraw_order', icon: '📜', name: 'Quân lệnh rút quân', stage: 'c1-06', desc: 'Bản sao lệnh rút đơn vị khỏi trạm canh trước khi Goblin tấn công — dấu bộ chỉ huy, chữ ký Đại tướng Valdric.',
        comment: ['warrior', 'Chữ ký này tôi nhận ra. Ước gì tôi không nhận ra.'] },
    { id: 'fake_arrows', icon: '🏹', name: 'Mũi tên giả kiểu Elf', clue: 'clue_arrows', needNo: 6, hint: 'Tro tàn quanh trạm canh có thể còn giấu thứ gì đó…', desc: 'Tên gắn lông kiểu Elf nhưng mũi sắt cùng dấu xưởng với linh kiện dưới mỏ. Nhiều mũi còn mới, chưa từng được bắn.',
        comment: ['assassin', 'Lông chim Elf, mũi sắt Valoria. Vụng như một lời nói dối học thuộc.'] },
    { id: 'target_board', icon: '🗺️', name: 'Bảng khoanh mục tiêu', stage: 'c1-08', desc: 'Bảng khoanh tròn giếng nước, kho lương, trạm gác — kèm dòng chỉ dẫn “để lại vật chứng Elf tại nơi tấn công”.',
        comment: ['priest', 'Họ tính trước cả chỗ đặt “bằng chứng”… để người ta căm ghét tộc Elf.'] },
    { id: 'broker_token', icon: '🪙', name: 'Thẻ thanh toán người môi giới', stage: 'c1-09', desc: 'Đồng thẻ Jessica nhận khi hộ tống hàng cho kẻ trung gian. Có mã thanh toán riêng.',
        comment: ['assassin', 'Đừng nhìn tôi như thế. Ừ, của tôi. Giữ nó làm chứng đi.'] },
    { id: 'land_letter', icon: '✉️', name: 'Thư hứa cấp đất', stage: 'c1-10', desc: 'Thư hứa cấp đất cho Skarn kèm lịch nhận hàng, ghi tên sĩ quan Morwen.',
        comment: ['warrior', 'Morwen… Hồi trước anh ta là người đầu tiên xung phong đi cứu đồn Bắc.'] },
    { id: 'skarn_ledger', icon: '📒', name: 'Sổ tay của Skarn', clue: 'clue_ledger', needNo: 10, hint: 'Kho đá giam Skarn ở Ashford… hắn có giấu gì không?', desc: 'Sổ tay Skarn giấu dưới phiến đá kho giam: ghi từng chuyến hàng nhận, đối chiếu được với số lô.',
        comment: ['assassin', 'Hắn ghi nợ còn cẩn thận hơn thợ pha thuốc. Tốt cho chúng ta.'] },
    { id: 'muster_order', icon: '📯', name: 'Lệnh tập kết hành lang đông', stage: 'c1-11', desc: 'Lệnh tập kết quân tiến về hành lang đông, “đáp trả các cuộc tập kích ở biên giới”.',
        comment: ['me', 'Họ dùng chính chuyện ở Ashford để mở màn chiến tranh.'] },
    { id: 'daren_statement', icon: '📝', name: 'Lời khai gốc của Daren', stage: 'c1-12', desc: 'Bản lời khai gốc của Lyra do lính trẻ Daren chép — không hề có lời thú nhận làm gián điệp.',
        comment: ['archer', 'Ít ra vẫn còn một người trong quân đội các ngươi biết viết sự thật.'] },
    { id: 'propaganda', icon: '📰', name: 'Áp phích tuyên truyền', clue: 'clue_poster', needNo: 13, hint: 'Khắp kinh thành dán đầy áp phích…', desc: 'Áp phích vẽ Elf cầm đuốc đốt làng — in cùng xưởng với giấy công văn của bộ chỉ huy.',
        comment: ['archer', 'Họ vẽ tai ta dài quá. Và ta chưa từng đốt cái làng nào.'] },
    { id: 'riot_schedule', icon: '🗓️', name: 'Lịch gây rối', stage: 'c1-14', desc: 'Lịch phân công kẻ kích động, có kế hoạch vu cho nhà cứu tế chứa chấp Elf.',
        comment: ['assassin', 'Chúng làm việc còn ngăn nắp hơn tôi.'] },
    { id: 'burn_order', icon: '🔥', name: 'Lệnh đốt hồ sơ', stage: 'c1-15', desc: 'Lệnh đốt kho lưu trữ tìm thấy trên người Morwen, kèm chìa khóa kho.',
        comment: ['warrior', 'Người ta chỉ đốt giấy khi giấy nói thật.'] },
    { id: 'export_slip', icon: '🧾', name: 'Phiếu xuất linh kiện', stage: 'c1-16', desc: 'Bản ghi xuất linh kiện cho đơn vị của Morwen — Đại tướng Valdric phê chuẩn. Khớp số lô trong mỏ.',
        comment: ['corvin', 'Hai người giữ sổ đã xác nhận dấu. Không ai nói “giả chữ ký” được nữa.'] },
    { id: 'grain_transfer', icon: '🌾', name: 'Lệnh điều chuyển lương', stage: 'c1-16', desc: 'Lệnh chuyển lương cứu trợ biên giới vào kho chuẩn bị chiến tranh — trong khi báo cáo gửi nhà vua ghi “đã giao đủ”.',
        comment: ['priest', 'Họ đói thật. Vậy mà phần lương còn lại cũng bị lấy nốt.'] },
];
const BY_ID = Object.fromEntries(EVIDENCE.map(e => [e.id, e]));

// Đối chất trước nhà vua (trước ải 18): mỗi câu chọn 1 chứng cứ — accept: các chứng cứ được tính là đúng
const QUESTIONS = [
    { id: 'q1', text: 'Vũ khí trong tay Goblin từ đâu ra?', accept: ['lot_numbers', 'export_slip', 'skarn_ledger'] },
    { id: 'q2', text: 'Ai ra lệnh bỏ trống biên giới trước khi Goblin tấn công?', accept: ['withdraw_order'] },
    { id: 'q3', text: 'Ai dựng chuyện tộc Elf tấn công Valoria?', accept: ['target_board', 'fake_arrows', 'propaganda'] },
    { id: 'q4', text: 'Lương cứu trợ cho biên giới đã đi đâu?', accept: ['grain_transfer'] },
];
const TRIAL_REWARD = { diamond: 10, gold: 500 };   // mỗi câu đúng (chỉ lần trình đầu tiên)

const has = (pr, id) => !!pr.evidence?.[id];
function give(pr, id) {
    if (!BY_ID[id] || has(pr, id)) return null;
    pr.evidence ??= {};
    pr.evidence[id] = true;
    return BY_ID[id];
}
/** Thắng lần đầu ải (Cốt truyện) -> các chứng cứ của ải đó (mới nhận) */
function grantStage(pr, stageId) {
    return EVIDENCE.filter(e => e.stage === stageId).map(e => give(pr, e.id)).filter(Boolean);
}
/** Điều tra vật trên bản đồ (type 'clue') */
const clueEvidence = (clueId) => EVIDENCE.find(e => e.clue === clueId) ?? null;
function collectClue(pr, clueId) {
    const e = clueEvidence(clueId);
    return e ? give(pr, e.id) : null;
}

/** Gói cho client (tab 🔎 Chứng cứ trong sổ nhiệm vụ) */
function journal(pr) {
    const list = EVIDENCE.map(e => {
        const got = has(pr, e.id);
        return { id: e.id, icon: got ? e.icon : '❔', name: got ? e.name : '???', desc: got ? e.desc : '',
            from: e.stage ? `Ải ${Number(e.stage.slice(3))}` : 'Điều tra', got,
            hint: got ? null : (e.hint ?? `Có thể tìm thấy ở ải ${Number(e.stage.slice(3))}`), comment: got ? { who: e.comment[0], text: e.comment[1] } : null };
    });
    return { count: list.filter(x => x.got).length, total: list.length, list };
}

/** Khung đối chất (chỉ chứng cứ đã có) */
function trialPayload(pr) {
    return {
        title: 'Đối chất trước nhà vua',
        intro: 'Elise: Mỗi câu hỏi, hãy chọn MỘT chứng cứ. Valdric sẽ chối bất cứ thứ gì không đủ chắc chắn.',
        questions: QUESTIONS.map(q => ({ id: q.id, text: q.text })),
        evidence: EVIDENCE.filter(e => has(pr, e.id)).map(e => ({ id: e.id, icon: e.icon, name: e.name, desc: e.desc })),
        answers: {}, active: null, result: null,
    };
}

/** Trình chứng cứ -> { correct, total, lines, rewards } — thưởng chỉ lần đầu */
function present(pr, answers = {}) {
    let correct = 0;
    const lines = [];
    for (const q of QUESTIONS) {
        const pick = answers[q.id];
        const ok = has(pr, pick) && q.accept.includes(pick);
        if (ok) correct++;
    }
    const first = pr.flags?.trial_score == null;
    pr.flags ??= {};
    if (first) pr.flags.trial_score = correct;
    if (correct === QUESTIONS.length) lines.push(
        ['elise', 'Số lô, phiếu xuất, quân lệnh, lệnh điều chuyển lương — từng mắt xích đều có người làm chứng.'],
        ['valdric', '…'],
        ['king', 'Đại tướng. Ngài không có gì để nói sao?'],
        ['valdric', 'Có. Nhưng không phải với những người ngồi đủ ấm để tranh luận dùng con dấu nào.']);
    else if (correct >= 2) lines.push(
        ['elise', 'Phần lớn đã rõ. Chỗ còn thiếu, tôi xin làm chứng bằng chính sổ sách nhà cứu tế.'],
        ['valdric', 'Vài tờ giấy và lời một kẻ đánh thuê. Điện hạ định treo cổ một vị tướng bằng thứ đó?'],
        ['king', 'Trẫm không treo cổ ai. Trẫm muốn nghe ngài giải thích.']);
    else lines.push(
        ['elise', 'Chứng cứ còn rời rạc… nhưng người dân Ashford không phải chuyện bịa.'],
        ['valdric', 'Toàn suy đoán. Điện hạ đang để tình cảm dẫn đường.'],
        ['king', 'Có lẽ. Nhưng trẫm sẽ không ký lệnh xuất quân trong đêm nay.']);
    const rewards = first ? { diamond: TRIAL_REWARD.diamond * correct, gold: TRIAL_REWARD.gold * correct } : { diamond: 0, gold: 0 };
    return { correct, total: QUESTIONS.length, lines, rewards, first };
}

module.exports = { EVIDENCE, QUESTIONS, TRIAL_REWARD, grantStage, clueEvidence, collectClue, journal, trialPayload, present, has };
