// Chạy nhiều lượt vẽ Codex, tối đa N lượt cùng lúc: node tools/codex_batch.js <jobs.json> [N=3]
// jobs.json: [{ "out": "đường/dẫn.png", "prompt": "..." | "@file.txt", "image"?: "ảnh mẫu.png" }, ...] — bỏ qua job đã có file ra
const { spawn } = require('child_process');
const fs = require('fs');
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).filter(j => !fs.existsSync(j.out));
const N = Number(process.argv[3] ?? 3);
let running = 0, i = 0, ok = 0, fail = 0;
function next() {
    while (running < N && i < jobs.length) {
        const j = jobs[i++];
        running++;
        const p = spawn(process.execPath, [__dirname + '/codex_draw.js', j.out, j.prompt, ...(j.image ? [j.image] : [])], { stdio: ['ignore', 'pipe', 'pipe'] });
        let log = '';
        p.stdout.on('data', d => { log += d; }); p.stderr.on('data', d => { log += d; });
        p.on('close', (code) => {
            running--;
            if (code === 0) ok++; else fail++;
            console.log(code === 0 ? 'OK  ' : 'FAIL', j.out, code === 0 ? '' : log.slice(-300).replace(/\s+/g, ' '));
            if (i >= jobs.length && running === 0) console.log(`XONG: ${ok} ảnh, lỗi ${fail}`);
            next();
        });
    }
    if (!jobs.length) console.log('Không có việc');
}
next();
