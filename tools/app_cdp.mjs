// Điều khiển bản ứng dụng (Electron) của game qua cổng gỡ lỗi: bấm CHUỘT THẬT (Input.dispatchMouseEvent), gõ phím, chụp màn hình.
//   node tools/app_cdp.mjs <cổng> <lệnh> [<lệnh> ...]
// Lệnh:  text=<chữ>        bấm phần tử nhìn thấy có chứa chữ đó (ưu tiên nút / phần tử nhỏ nhất)
//        css=<selector>    bấm phần tử theo selector
//        xy=<x>,<y>        bấm toạ độ
//        key=<phím>        nhấn 1 phím (vd key=i, key=Escape)
//        wait=<ms>         chờ
//        shot=<file.png>[@tỉ lệ]   chụp màn hình
//        eval=<js>         chạy biểu thức, in kết quả
//        errors            in lỗi console đã gom từ lúc nối
//        tab=<chuỗi trong url>     chuyển sang trang khác của ứng dụng (mặc định: trang game)
import fs from 'node:fs';
const [port, ...cmds] = process.argv.slice(2);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targets = async () => (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
function connect(wsUrl) {
    const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const errors = [];
    ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 300));
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('ERR ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300));
    };
    const ready = new Promise(r => ws.onopen = r);
    const send = async (method, params = {}) => { await ready; return new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }); };
    return { send, errors, close: () => ws.close() };
}
async function pick(match) {
    for (let k = 0; k < 40; k++) {
        try { const t = (await targets()).find(x => x.type === 'page' && (match ? x.url.includes(match) : /127\.0\.0\.1:\d+\/(\?.*)?$/.test(x.url))); if (t) return t; } catch {}
        await sleep(500);
    }
    throw new Error('không thấy trang ' + (match ?? 'game'));
}
let page = connect((await pick()).webSocketDebuggerUrl);
await page.send('Runtime.enable');
const evalJs = async (expression) => {
    const r = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) return 'LỖI JS: ' + (r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
    return r.result?.result?.value;
};
const clickAt = async (x, y) => {
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'])
        await page.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
};
const FIND = (how, v) => `(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight; };
    let el;
    if (${JSON.stringify(how)} === 'css') el = [...document.querySelectorAll(${JSON.stringify(v)})].find(vis);
    else {
        const all = [...document.querySelectorAll('button, [role=button], a, .card, div, span, li')].filter(e => vis(e) && e.innerText && e.innerText.includes(${JSON.stringify(v)}));
        all.sort((a, b) => a.innerText.length - b.innerText.length);
        el = all.find(e => e.tagName === 'BUTTON') ?? all[0];
    }
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, tag: el.tagName, text: (el.innerText || '').slice(0, 40).replace(/\\s+/g, ' ') };
})()`;
for (const c of cmds) {
    const i = c.indexOf('='), op = i < 0 ? c : c.slice(0, i), arg = i < 0 ? '' : c.slice(i + 1);
    if (op === 'wait') await sleep(+arg);
    else if (op === 'text' || op === 'css') {
        let at = null;
        for (let k = 0; k < 20 && !at; k++) { at = await evalJs(FIND(op, arg)); if (!at) await sleep(500); }
        if (!at) { console.log(`KHÔNG THẤY ${op}=${arg}`); continue; }
        await clickAt(at.x, at.y); console.log(`bấm ${op}=${arg} @${Math.round(at.x)},${Math.round(at.y)} <${at.tag}> "${at.text}"`);
    } else if (op === 'xy') { const [x, y] = arg.split(',').map(Number); await clickAt(x, y); console.log('bấm', x, y); }
    else if (op === 'key') {
        const code = arg.length === 1 ? 'Key' + arg.toUpperCase() : arg;
        for (const type of ['keyDown', 'keyUp']) await page.send('Input.dispatchKeyEvent', { type, key: arg, code, text: type === 'keyDown' && arg.length === 1 ? arg : undefined, windowsVirtualKeyCode: arg.length === 1 ? arg.toUpperCase().charCodeAt(0) : (arg === 'Escape' ? 27 : arg === 'Enter' ? 13 : 0) });
        console.log('phím', arg);
    } else if (op === 'shot') {
        const [file, sc] = arg.split('@');
        const r = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
        if (!r.result?.data) { console.log('CHỤP LỖI', JSON.stringify(r.error ?? r).slice(0, 200)); continue; }
        fs.writeFileSync(file, Buffer.from(r.result.data, 'base64')); console.log('chụp ->', file, sc ? '' : '');
    } else if (op === 'eval') console.log('=>', JSON.stringify(await evalJs(arg)));
    else if (op === 'errors') console.log(page.errors.length ? page.errors.join('\n') : '(không có lỗi console)');
    else if (op === 'tab') { page.close(); page = connect((await pick(arg)).webSocketDebuggerUrl); await page.send('Runtime.enable'); console.log('sang trang', arg); }
    else console.log('lệnh lạ', c);
}
page.close();
