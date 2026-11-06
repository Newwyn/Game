// ============================================================
// VẼ TRANH BẰNG CODEX (công cụ tạo ảnh của Codex) — chạy song song được
//   node tools/codex_draw.js <file_ra.png> "<đề bài tiếng Anh>"
// Codex không ghi được vào thư mục dự án (sandbox Windows chặn) nhưng ảnh vẫn nằm trong ~/.codex/generated_images/…
// -> đọc đường dẫn Codex in ra (hoặc ảnh mới nhất trong thư mục phiên của nó) rồi chép sang <file_ra.png>.
// ============================================================
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let [out, prompt, refImage] = process.argv.slice(2);   // refImage (tuỳ chọn): ảnh mẫu gửi kèm
if (prompt?.startsWith('@')) prompt = fs.readFileSync(prompt.slice(1), 'utf8').trim();   // đề bài đọc từ file
if (!out || !prompt) { console.error('Dùng: node tools/codex_draw.js <file_ra.png> "<đề bài>"'); process.exit(1); }
const GEN = path.join(os.homedir(), '.codex', 'generated_images');
const t0 = Date.now();
const cwd = path.join(__dirname, '..', '.team', 'art');
fs.mkdirSync(cwd, { recursive: true });
const full = `Use your image generation tool to create exactly ONE image: ${prompt}\nDo not try to save it into the workspace. When done, reply with only the full path of the generated PNG file.`;
// đề bài gửi qua stdin ('-'): tránh shell cắt câu theo dấu cách (Windows cần shell để chạy codex.cmd)
const args = ['exec', '-C', `"${cwd}"`, '-s', 'read-only', '-'];
if (refImage) args.push('--image', `"${path.resolve(refImage)}"`);   // đề bài (stdin '-') đứng TRƯỚC --image
const p = spawn('codex', args, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
p.stdin.end(full);
let log = '';
p.stdout.on('data', d => { log += d; });
p.stderr.on('data', d => { log += d; });
p.on('close', () => {
    const found = [...log.matchAll(/([A-Za-z]:[\\/][^\s`'"]*generated_images[\\/][^\s`'"]+\.png)/g)].map(m => m[1]);
    let src = found.reverse().find(f => fs.existsSync(f));
    if (!src && fs.existsSync(GEN)) {   // dự phòng: ảnh mới nhất tạo sau lúc bắt đầu
        const all = [];
        for (const d of fs.readdirSync(GEN)) {
            const dir = path.join(GEN, d);
            if (!fs.statSync(dir).isDirectory()) continue;
            for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) { const fp = path.join(dir, f); const t = fs.statSync(fp).mtimeMs; if (t > t0) all.push([t, fp]); }
        }
        if (all.length === 1) src = all[0][1];
    }
    if (!src) { console.error('KHÔNG THẤY ẢNH:', out, '\n', log.slice(-800)); process.exit(2); }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(src, out);
    console.log('OK', out, Math.round((Date.now() - t0) / 1000) + 's');
});
