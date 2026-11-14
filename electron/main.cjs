// (14/11/2026) Bản cài Windows: mở máy chủ game ngay trong ứng dụng (cổng trống, chỉ trong máy), lưu tiến trình ở
//   %APPDATA%\Legend of Capsules\data, hiện game trong cửa sổ riêng. Chạy thử: npm run app · Dựng bộ cài: npm run dist (ra release/)
const { app, BrowserWindow, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');

app.setName('Legend of Capsules');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('force_high_performance_gpu');

let window;
let gameUrl;
let server;
let startupError;

function focusWindow() {
    if (!window || window.isDestroyed()) return;
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
}

function showStatus(message) {
    const escaped = String(message).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
    return window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(
        `<!doctype html><html><head><meta charset="utf-8"><title>Legend of Capsules</title>
        <style>body{margin:40px;background:#0b1020;color:#e2e8f0;font:16px system-ui}h1{font-size:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style>
        </head><body><h1>Legend of Capsules</h1><pre>${escaped}</pre></body></html>`));
}

function freePort() {
    return new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once('error', reject);
        probe.listen(0, '127.0.0.1', () => {
            const port = probe.address().port;
            probe.close(error => error ? reject(error) : resolve(port));
        });
    });
}

async function waitForServer(url) {
    const deadline = Date.now() + 30000;
    let lastError;
    while (Date.now() < deadline) {
        if (startupError) throw startupError;
        if (window.isDestroyed()) throw new Error('Window closed');
        try {
            await new Promise((resolve, reject) => {
                const request = http.get(url, response => {
                    response.resume();
                    if (response.statusCode === 200) resolve();
                    else reject(new Error(`Server returned HTTP ${response.statusCode}. Thiếu bản dựng giao diện (chạy npm run build).`));
                });
                request.setTimeout(1000, () => request.destroy(new Error('Server request timed out')));
                request.once('error', reject);
            });
            return;
        } catch (error) { lastError = error; }
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new Error(`Server did not become ready: ${lastError?.message || 'timeout'}`);
}

/** Cửa sổ mới (window.open): trang CỦA GAME (vd. app Tool thử tool.html) mở ngay trong ứng dụng — cùng phiên với game nên
 *  Tool điều khiển được game (kênh BroadcastChannel 'loc-tool'); trang web ngoài mới mở bằng trình duyệt của máy. */
function openHandler({ url }) {
    if (gameUrl && url.startsWith(new URL(gameUrl).origin)) {
        return { action: 'allow', overrideBrowserWindowOptions: {
            title: 'Legend of Capsules — Tool thử', autoHideMenuBar: true, backgroundColor: '#0b1020', minWidth: 420, minHeight: 480,
            webPreferences: { backgroundThrottling: false, contextIsolation: true, nodeIntegration: false },
        } };
    }
    if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(console.error);
    return { action: 'deny' };
}
// cửa sổ con (Tool) mở thêm cửa sổ nữa cũng theo cùng luật
app.on('web-contents-created', (_e, contents) => contents.setWindowOpenHandler(openHandler));

async function start() {
    window = new BrowserWindow({
        width: 560, height: 320, backgroundColor: '#0b1020',
        title: 'Legend of Capsules', autoHideMenuBar: true,
        webPreferences: { backgroundThrottling: false, contextIsolation: true, nodeIntegration: false },
    });
    window.webContents.setWindowOpenHandler(openHandler);
    window.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;
        if (input.key === 'F11') {
            event.preventDefault();
            if (!input.isAutoRepeat) window.setFullScreen(!window.isFullScreen());
        } else if (input.key === 'F5') {
            event.preventDefault();
            window.webContents.reload();
        }
    });
    try {
        await showStatus('Đang khởi động game…');
        process.env.PORT = String(await freePort());
        process.env.LOC_HOST = '127.0.0.1';   // máy chủ chỉ mở trong máy -> Windows không bật hộp hỏi tường lửa
        process.env.LOC_DATA_DIR = path.join(app.getPath('userData'), 'data');   // %APPDATA%\Legend of Capsules\data
        fs.mkdirSync(process.env.LOC_DATA_DIR, { recursive: true });
        server = require('../server.js');
        server.on('error', error => { startupError = error; });
        gameUrl = `http://127.0.0.1:${process.env.PORT}/`;
        await waitForServer(gameUrl);
        window.setMinimumSize(960, 600);
        window.setSize(1280, 800);
        window.center();
        await window.loadURL(gameUrl);
    } catch (error) {
        console.error(error);
        if (!window.isDestroyed()) await showStatus(`Không mở được game. Hãy chụp màn hình này gửi người làm game.\n\n${error.stack || error}`).catch(console.error);
    }
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', focusWindow);
    app.on('activate', focusWindow);
    app.on('window-all-closed', () => app.quit());
    app.on('before-quit', () => { if (server?.listening) server.close(); });
    app.whenReady().then(start).catch(console.error);
}
