// ============================================================
// Tạo file Word GDD từ DOCUMENTATION.md
//   node tools/make_gdd_docx.js   ->  Legend_of_Capsules_Game_Design_Document.docx
// Sửa nội dung ở DOCUMENTATION.md rồi chạy lại lệnh này — không sửa tay file Word.
// Hỗ trợ: tiêu đề #..###, đoạn văn, **đậm**, *nghiêng*, `code`, danh sách -, 1., bảng |..|, khối ```code```, trích dẫn >.
// ============================================================
const fs = require('fs');
const path = require('path');
const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
    AlignmentType, LevelFormat, BorderStyle, Footer, PageNumber, TableOfContents, PageBreak,
} = require('docx');

const ROOT = path.join(__dirname, '..');
const md = fs.readFileSync(path.join(ROOT, 'DOCUMENTATION.md'), 'utf8').replace(/\r/g, '');
const OUT = path.join(ROOT, 'Legend_of_Capsules_Game_Design_Document.docx');

const FONT = 'Arial';
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - MARGIN * 2; // A4, lề 2cm
const ACCENT = '1F3A5F';

/** "**đậm** *nghiêng* `code` [chữ](link)" -> TextRun[] */
function runs(text, base = {}) {
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // link -> chữ
    const out = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
        if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), font: FONT, ...base }));
        const t = m[0];
        if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, ...base }));
        else if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), font: 'Consolas', color: '7A2E0E', ...base }));
        else out.push(new TextRun({ text: t.slice(1, -1), italics: true, font: FONT, ...base }));
        last = m.index + t.length;
    }
    if (last < text.length) out.push(new TextRun({ text: text.slice(last), font: FONT, ...base }));
    return out;
}

const border = { style: BorderStyle.SINGLE, size: 4, color: 'B8C4D6' };
function table(rows) {
    const cells = rows.map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    const head = cells[0];
    const body = cells.slice(2); // bỏ dòng :---
    const n = head.length;
    // cột cuối (mô tả) rộng hơn khi bảng có cột "Mô tả"/"Tác dụng"
    const weights = head.map((h, i) => (i === n - 1 && n <= 4 ? 2.2 : 1));
    const sum = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map(w => Math.floor(CONTENT_W * w / sum));
    widths[n - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
    const cell = (text, i, isHead) => new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        borders: { top: border, bottom: border, left: border, right: border },
        shading: isHead ? { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: runs(text, isHead ? { bold: true, color: 'FFFFFF', size: 18 } : { size: 18 }) })],
    });
    return new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: widths,
        rows: [
            new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, i, true)) }),
            ...body.map(r => new TableRow({ children: Array.from({ length: n }, (_, i) => cell(r[i] ?? '', i, false)) })),
        ],
    });
}

const children = [];
const lines = md.split('\n');
let i = 0, title = null, listNo = 0, prevNumbered = false;
while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {                       // khối code / sơ đồ
        const block = [];
        for (i++; i < lines.length && !lines[i].startsWith('```'); i++) block.push(lines[i]);
        i++;
        block.forEach(b => children.push(new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: 'F2F4F7', color: 'auto' },
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: b || ' ', font: 'Consolas', size: 16 })],
        })));
        children.push(new Paragraph({ children: [] }));
        continue;
    }
    if (line.startsWith('|')) {                          // bảng
        const rows = [];
        while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
        children.push(table(rows));
        children.push(new Paragraph({ children: [] }));
        continue;
    }
    i++;
    if (!/^\d+\. /.test(line) && line.trim()) prevNumbered = false;
    if (!line.trim() || line.trim() === '---') continue;
    if (/^## 📌 MỤC LỤC/.test(line)) {                  // mục lục tự động thay cho danh sách link
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'MỤC LỤC', font: FONT })] }));
        children.push(new TableOfContents('Mục lục', { hyperlink: true, headingStyleRange: '1-2' }));
        while (i < lines.length && /^\d+\. \[/.test(lines[i])) i++;
        children.push(new Paragraph({ children: [new PageBreak()] }));
        continue;
    }
    let m;
    if ((m = line.match(/^# (.*)/))) { title = m[1].replace(/^📖\s*/, ''); continue; }
    if ((m = line.match(/^## (.*)/))) { children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(m[1]) })); continue; }
    if ((m = line.match(/^### (.*)/))) { children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(m[1]) })); continue; }
    if ((m = line.match(/^> ?(.*)/))) { children.push(new Paragraph({ children: runs(m[1], { italics: true, color: '555555' }) })); continue; }
    if ((m = line.match(/^(\s*)- (.*)/))) {
        children.push(new Paragraph({ numbering: { reference: 'bullets', level: m[1].length >= 2 ? 1 : 0 }, children: runs(m[2]) }));
        continue;
    }
    if ((m = line.match(/^\d+\. (.*)/))) {
        if (!prevNumbered) listNo++; // danh sách mới -> đánh số lại từ 1
        prevNumbered = true;
        children.push(new Paragraph({ numbering: { reference: 'numbers', level: 0, instance: listNo }, children: runs(m[1]) }));
        continue;
    }
    children.push(new Paragraph({ children: runs(line) }));
}

const cover = [
    new Paragraph({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LEGEND OF CAPSULES', bold: true, size: 56, color: ACCENT, font: FONT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'Tài liệu thiết kế & kỹ thuật (Game Design Document)', size: 30, font: FONT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: 'Phiên bản 3.0 — 13/10/2026', size: 22, color: '666666', font: FONT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'github.com/Newwyn/Game', size: 22, color: '666666', font: FONT })] }),
    new Paragraph({ children: [new PageBreak()] }),
];

const doc = new Document({
    creator: 'Legend of Capsules', title: title || 'Legend of Capsules GDD',
    features: { updateFields: true }, // Word tự cập nhật Mục lục khi mở file
    styles: {
        default: { document: { run: { font: FONT, size: 21 } } },
        paragraphStyles: [
            { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 30, bold: true, color: ACCENT, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
            { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 25, bold: true, color: '2E5C8A', font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
        ],
    },
    numbering: {
        config: [
            { reference: 'bullets', levels: [
                { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            ] },
            { reference: 'numbers', levels: [
                { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            ] },
        ],
    },
    sections: [{
        properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Legend of Capsules — GDD v3.0 · Trang ', size: 16, color: '888888', font: FONT }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888', font: FONT }),
        ] })] }) },
        children: [...cover, ...children],
    }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync(OUT, buf); console.log('Đã tạo', path.basename(OUT)); });
