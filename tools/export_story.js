// ============================================================
// Xuất lời thoại cốt truyện ĐANG CÓ TRONG GAME ra file dễ đọc (để người viết truyện xem / sửa)
//   node tools/export_story.js          -> docs/LOI_THOAI_CHUONG_1_TRONG_GAME.md
// Nguồn: game/story.js (intro, pre, post, branch, ending) + tên ải ở game/chapter1.js.
// {cau}/{Cau} -> [cậu/cô] · {ten}/{Ten} -> [Tên] · {anh} -> [anh/chị] · {chang} -> [chàng trai/cô gái] · {ban} -> [cậu bạn/cô bạn]
// ============================================================
const fs = require('fs');
const path = require('path');
const S = require('../game/story');
const CH1 = require('../game/chapter1');

const TOK = { cau: 'cậu/cô', anh: 'anh/chị', chang: 'chàng trai/cô gái', ban: 'cậu bạn/cô bạn' };
const fill = (t) => String(t).replace(/\{(\w+)\}/g, (m, k) => {
    if (/^ten$/i.test(k)) return '[Tên]';
    const v = TOK[k.toLowerCase()];
    if (!v) return m;
    return `[${k[0] === k[0].toUpperCase() ? v[0].toUpperCase() + v.slice(1) : v}]`;
});
const who = (id) => (id === 'me' ? '[Tên]' : S.SPEAKERS[id]?.name || id);
const block = (lines) => (lines ?? []).map(([id, t]) => (id === 'sys' ? `> *${fill(t)}*` : `**${who(id)}:** ${fill(t)}`)).join('\n\n');

const out = [
    '# LỜI THOẠI CHƯƠNG 1 — ĐÚNG NHƯ TRONG GAME',
    '',
    `*Tự xuất từ \`game/story.js\` bằng \`node tools/export_story.js\` (${new Date().toLocaleDateString('vi-VN')}). Muốn sửa câu nào: ghi chú ngay trong file này rồi báo Claude — đừng sửa thẳng code.*`,
    '',
    '*Chữ nghiêng = dẫn truyện / hướng dẫn. [cậu/cô], [Tên]… tự đổi theo nhân vật chính Nam / Nữ và tên người chơi đặt.*',
    '',
    '## Mở đầu — giấc mơ', '', block(S.intro.prologue), '', block(S.intro.sealed), '',
    '## Tỉnh dậy ở miếu đổ', '', block(S.intro.wake), '',
];
for (const st of CH1.stages) {
    out.push(`## Ải ${st.no}. ${st.name}`, '', '### Trước trận', '', block(S.pre[st.no]) || '*(không có)*', '', '### Sau khi thắng lần đầu', '', block(S.post[st.no]) || '*(không có)*', '');
}
out.push('## Kết chương 1', '', block(S.ending), '');
for (const b of CH1.branches) {
    const k = b.id.split('-')[1];
    out.push(`## Nhánh ${k.toUpperCase()}. ${b.name}`, '', '### Trước trận', '', block(S.branch[k]?.pre) || '*(không có)*', '', '### Sau khi thắng lần đầu', '', block(S.branch[k]?.post) || '*(không có)*', '');
}
const file = path.join(__dirname, '..', 'docs', 'LOI_THOAI_CHUONG_1_TRONG_GAME.md');
fs.writeFileSync(file, out.join('\n'), 'utf8');
console.log('Đã xuất', file);
