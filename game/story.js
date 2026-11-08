// ============================================================
// CỐT TRUYỆN (P4) — lời thoại chương 1 tộc Người (theo CHUONG_1_TOC_NGUOI.md)
//   · intro: mở màn (đấu thần → bị phong ấn → tỉnh dậy ở Ashford)
//   · pre[n] / post[n]: trước khi vào ải n / sau khi thắng ải n lần đầu (mức Cốt truyện)
//   · ending: kết chương (sau ải 20)
// Mỗi câu: [người nói, lời]. Người nói: id anh hùng (warrior/assassin/priest/archer), npc (mira, borin, ...), kẻ địch, 'me' (nhân vật chính),
// 'voice' (giọng nói bí ẩn), 'sys' (dẫn truyện).
// ============================================================

const SPEAKERS = {
    warrior: { name: 'Rok', portrait: 'warrior' },
    assassin: { name: 'Jessica', portrait: 'assassin' },
    priest: { name: 'Seraphine', portrait: 'priest' },
    archer: { name: 'Lyra', portrait: 'archer' },
    me: { name: '???', emoji: '✴️', me: true },   // nhân vật chính: tên + chân dung lấy theo hồ sơ Nam / Nữ (server.js điền)
    stranger: { name: 'Cô gái áo tím', portrait: 'assassin' },
    voice: { name: 'Giọng nói', emoji: '🌌' },
    sys: { name: '', emoji: '📜' },
    mira: { name: 'Bà Mira', art: 'mira', emoji: '👵' },
    borin: { name: 'Bác Borin', art: 'borin', emoji: '🧔' },
    lena: { name: 'Cô Lena', art: 'lena', emoji: '👩‍🍳' },
    elise: { name: 'Công chúa Elise', art: 'elise', emoji: '👸' },
    corvin: { name: 'Lão Corvin', art: 'corvin', emoji: '🧙' },
    king: { name: 'Vua Aldric II', emoji: '🤴' },
    goblin: { name: 'Goblin', emoji: '👺' },
    skarn: { name: 'Skarn Răng Sắt', emoji: '👹' },
    morwen: { name: 'Morwen', emoji: '🗡️' },
    valdric: { name: 'Đại tướng Valdric', emoji: '🔥' },
    varkos: { name: 'Thánh Varkos', emoji: '⚔️' },
};

const intro = {
    prologue: [
        ['sys', 'Rất lâu về trước… trên nền trời vỡ vụn.'],
        ['voice', 'Ngươi vẫn chưa chịu khuất phục sao?'],
        ['me', 'Thế giới này không thuộc về các ngươi.'],
        ['sys', 'Hãy ra lệnh cho các chiến binh — bấm vào kỹ năng của họ!'],
    ],
    sealed: [
        ['voice', 'Ngủ đi… cho đến khi thế giới cần ngươi.'],
        ['sys', 'Ánh sáng trắng nuốt chửng tất cả.'],
    ],
    wake: [
        ['sys', 'Ngoại ô làng Ashford — biên giới Vương quốc Valoria.'],
        ['warrior', 'Này! {Cau} còn sống không? Đống đổ nát này cháy cả đêm rồi.'],
        ['warrior', 'Ta là Rok, đội trưởng tuần tra biên giới. Trên tay {cau} có một dấu ấn lạ… {Cau} là ai?'],
        ['me', '…Ta không nhớ gì cả. Chỉ nhớ mỗi cái tên: {ten}.'],
        ['warrior', 'Được rồi, {ten}. Làng Ashford ở phía tây — về đó trước, Bà Mira sẽ biết phải làm gì.'],
        ['sys', 'Đi bằng phím mũi tên / W A S D (hoặc phím ảo), nút A (E / Enter) để nói chuyện, nút B (Space) để nhảy. Đi về phía tây tới làng Ashford.'],
    ],
};

const pre = {
    1: [['mira', 'Goblin lại kéo tới cổng làng!'], ['warrior', '{Cau} cứ đứng sau ta, {ten}.'], ['me', '(Có một sợi dây vô hình nối ta với Rok… như thể ta có thể ra lệnh.)'], ['sys', 'Bấm vào ô kỹ năng của anh hùng để ra lệnh.']],
    2: [['warrior', 'Ruộng lúa đang cháy… Khoan, có mai phục!'], ['stranger', 'Đông thế này mà chỉ có hai người? Để ta giúp một tay.'], ['sys', 'Kỹ năng tốn Orb — năng lượng tích dần khi đánh. Cô gái áo tím chiến đấu cùng đội trong trận này.']],
    3: [['priest', 'Thảo dược quý mọc sâu trong Rừng Sương. Mọi người đi cùng ta nhé?'], ['assassin', 'Sói ở đây không bình thường. Mắt chúng đỏ quạch.'], ['sys', 'Đã mở AUTO: các anh hùng tự dùng kỹ năng khi đủ Orb. Seraphine chiến đấu cùng đội trong trận này.']],
    4: [['warrior', 'Goblin đào trộm ở mỏ đá cũ. Chúng tìm gì ở đó?']],
    5: [['assassin', 'Con sói đầu đàn kia… có vòng cổ phát sáng.'], ['priest', 'Ma thuật trói buộc. Ai đó đang điều khiển nó!']],
    6: [['warrior', 'Trạm canh bị đốt. Cẩn thận bẫy.']],
    7: [['priest', 'Đầm lầy đầy khí độc. Ta sẽ giải độc cho mọi người — cố đứng gần ta.']],
    8: [['mira', 'Bọn chúng bắt dân làng về trại! Xin hãy cứu họ!']],
    9: [['warrior', 'Đêm nay chúng sẽ tấn công tổng lực. Giữ vững đội hình!']],
    10: [['skarn', 'Lũ người các ngươi phá hỏng việc làm ăn của ta!'], ['warrior', 'Việc làm ăn? Ai trả tiền cho ngươi?']],
    11: [['assassin', 'Đường Vương Đạo… lính đào ngũ chặn cầu. Kinh thành rối loạn thật rồi.']],
    12: [['priest', 'Trạm gác bắt một cô gái Elf, bảo là gián điệp.'], ['assassin', 'Nhìn cô ta không giống gián điệp. Cứu trước, hỏi sau.']],
    13: [['sys', 'Kinh thành Valoria — khu chợ.'], ['archer', 'Ta chỉ đi tìm em gái… sao họ lại đổ cho tộc Elf?']],
    14: [['assassin', 'Gã mặc đồ Elf kia… dáng đi là lính Valoria. Theo hắn!']],
    15: [['morwen', 'Rok. Đội trưởng tuần tra năm nào giờ thành kẻ phản bội.'], ['warrior', 'Morwen… ngươi theo Đại tướng thật sao?']],
    16: [['corvin', 'Lính Đại tướng đang đốt sách trong thư viện! Cứu lấy những trang về Thất Thánh!']],
    17: [['priest', 'Nhà thờ là nơi của phe hòa bình… họ dám bắt cả các nữ tu?']],
    18: [['elise', 'Phụ vương đang ở đại sảnh. Đại tướng đã cho cận vệ vây kín.']],
    19: [['warrior', 'Tường thành đang cháy. Chiến binh lửa — Huy Hiệu đã thức tỉnh họ.']],
    20: [['valdric', 'Tộc Người phải mạnh nhất. Chiến tranh là con đường duy nhất!'], ['priest', 'Ngươi dựng chuyện các tộc khác tấn công để ép nhà vua tuyên chiến.'], ['valdric', 'Huy Hiệu Lửa Chiến sẽ cho các ngươi thấy sức mạnh thật sự!']],
};

const post = {
    1: [['warrior', '{Cau}… vừa ra lệnh cho ta? Và ta làm theo như thể đã quen từ lâu.'], ['me', 'Ta cũng không hiểu. Chỉ biết… ta nhìn thấy trận đánh rõ hơn.']],
    2: [['warrior', 'Cô là ai? Đánh giỏi thật.'], ['stranger', 'Ta tên Jessica. Thế thôi — đừng hỏi thêm.'], ['assassin', 'Nhưng {cau} kia… ra lệnh trận đánh cũng ra gì đấy. Ta đi cùng một đoạn vậy.'], ['sys', 'JESSICA gia nhập đội! Thân thế của cô vẫn còn là một bí ẩn…']],
    3: [['priest', 'Đủ thảo dược rồi! Cảm ơn mọi người… và cảm ơn {cau}, {ten}.'], ['priest', 'Lũ sói này bị dồn ra từ sâu trong rừng — có kẻ đứng sau. Ta sẽ đi cùng mọi người.'], ['sys', 'SERAPHINE gia nhập đội!']],
    4: [['warrior', 'Chúng đào tìm quặng xanh — loại dùng để rèn vũ khí.'], ['sys', 'Đã mở độ khó KHÓ cho các ải đã qua.']],
    5: [['priest', 'Vòng cổ vỡ rồi. Con sói chỉ là một con vật bị lợi dụng…']],
    6: [['warrior', 'Trong đống tro có trang bị còn dùng được.'], ['sys', 'Đã mở TRANG BỊ: bấm 🎒 để mặc đồ cho anh hùng.']],
    7: [['priest', 'Khí độc tan rồi. Mọi người ổn chứ?']],
    8: [['mira', 'Dân làng về đủ cả. Già không biết lấy gì cảm ơn.']],
    9: [['warrior', 'Làng giữ được. Nhưng chúng sẽ quay lại với thủ lĩnh.']],
    10: [['skarn', 'Khụ… Người của các ngươi… trả tiền cho bọn ta. Vàng có dấu ấn… kinh thành.'], ['warrior', 'Dấu ấn của quân đội Valoria…'], ['sys', 'Đã mở LÒ RÈN (cường hoá). Đường lên kinh thành đã mở.']],
    11: [['assassin', 'Lính đào ngũ nói Đại tướng đang tuyển quân ồ ạt.']],
    12: [['archer', 'Ta là Lyra. Cảm ơn… ta nợ các người một mạng.'], ['archer', 'Ta đi tìm em gái — con bé mất tích gần biên giới. Cho ta đi cùng nhé.'], ['sys', 'LYRA gia nhập đội! Giờ có thể ra trận 4 người.']],
    13: [['priest', 'Có kẻ hô “Elf tấn công!” giữa chợ… cả đội bị truy nã rồi.']],
    14: [['assassin', 'Mật thám mặc đồ Elf — đúng là lính Valoria. Ai đó muốn dân chúng căm ghét tộc Elf.']],
    15: [['morwen', 'Đại tướng… có Huy Hiệu… ngươi không thắng nổi đâu, Rok.'], ['sys', 'Đã mở HẦM NGỤC ĐỒ BỘ tộc Người.']],
    16: [['corvin', 'Các ngươi cứu được vài trang… có một danh sách — Thất Thánh. Một cái tên đã bị gạch.'], ['sys', 'Đã mở HẦM NGỤC TRANG SỨC.']],
    17: [['priest', 'Các nữ tu an toàn rồi. Phe hòa bình vẫn còn hy vọng.']],
    18: [['elise', 'Phụ vương đã tỉnh lại một chút. Đại tướng rút lên tường thành.']],
    19: [['warrior', 'Valdric ở ngay phía trước.']],
    20: [['valdric', 'Không thể nào… Huy Hiệu…'], ['sys', 'Huy Hiệu Lửa Chiến vỡ tan.']],
};

const ending = [
    ['voice', 'Hòa bình chỉ khiến các ngươi yếu đi…'],
    ['varkos', 'Nhưng ngươi — kẻ mang dấu ấn — ta đã thấy ngươi.'],
    ['king', 'Ta… đã suýt đưa cả vương quốc vào chiến tranh. Lệnh tuyên chiến bị huỷ.'],
    ['elise', 'Cảm ơn các bạn. Nhưng kẻ đứng sau vẫn còn đó. Xin hãy sang vùng Elf — tìm em gái Lyra và manh mối về Thất Thánh.'],
    ['sys', 'HẾT CHƯƠNG 1 · Đã mở CỬA HÀNG ANH HÙNG và CHƯƠNG 2 — Tiếng Gọi Rừng Thiêng (vùng Elf). Đi qua cổng phía đông kinh thành để tới rừng Sylvaren.'],
];

// chương 2 (vùng Elf): game/story2.js
const C2 = require('./story2');
Object.assign(SPEAKERS, C2.SPEAKERS2);
const BOOK = { c1: { pre, post, ending }, c2: { pre: C2.pre, post: C2.post, ending: C2.ending } };

/** Lời thoại theo id ải chính (c1-01..c1-20, c2-01..c2-20) */
function stageNo(id) {
    const m = /^c\d-(\d\d)$/.exec(id ?? '');
    return m ? Number(m[1]) : null;
}
const bookOf = (id) => BOOK[String(id ?? '').slice(0, 2)] ?? null;
const preFor = (id) => bookOf(id)?.pre[stageNo(id)] ?? null;
const postFor = (id) => bookOf(id)?.post[stageNo(id)] ?? null;
/** Lời kết chương nếu `id` là ải cuối (ải 20) của chương */
const endingFor = (id) => (stageNo(id) === 20 ? bookOf(id)?.ending ?? null : null);
/** Toàn bộ lời trước ải, khoá theo id ải ("c1-03": [...]) — gửi client */
const allPre = () => Object.fromEntries(Object.entries(BOOK).flatMap(([ch, b]) => Object.entries(b.pre).map(([n, l]) => [`${ch}-${String(n).padStart(2, '0')}`, l])));

module.exports = { SPEAKERS, intro, pre, post, ending, preFor, postFor, endingFor, allPre, stageNo };
