// ============================================================
// ÂM THANH TỔNG HỢP (Web Audio API) — không cần file âm thanh
// ============================================================
let audioCtx = null;

function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

/** Trình duyệt chỉ cho bật âm thanh sau thao tác của người dùng */
export function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

export function playBeep(freq, type = 'square', duration = 0.1) {
    const ac = ctx();
    if (ac.state === 'suspended') ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ac.currentTime + duration);
    osc.stop(ac.currentTime + duration);
}
