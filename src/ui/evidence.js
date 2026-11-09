// ============================================================
// 🔎 ĐỐI CHẤT TRƯỚC NHÀ VUA (trước ải 18) — khung chọn chứng cứ cho 4 câu hỏi
//   presentationHTML(state) -> chuỗi HTML (src/ui/world.js chèn vào lớp phủ như câu đố, tự lo click):
//   state = { title, intro, questions:[{id,text}], evidence:[{id,icon,name,desc}], answers:{qid:evId}, active:qid|null, result:null|{correct,total,lines} }
//   Nút: data-ev-q (chọn câu) · data-ev-pick (chọn chứng cứ) · data-ev-submit · data-ev-cancel · data-ev-continue
// ============================================================
import '../styles/evidence.css';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NAMES = { elise: 'Elise', valdric: 'Valdric', king: 'Nhà vua', warrior: 'Rok', assassin: 'Jessica', priest: 'Sera', archer: 'Lyra' };

export function presentationHTML(st, speakers = {}) {
    const ev = Object.fromEntries((st.evidence ?? []).map(e => [e.id, e]));
    if (st.result) {
        const r = st.result;
        const stars = '★'.repeat(r.correct) + '☆'.repeat(Math.max(0, r.total - r.correct));
        return `<div class="cp-confirm-backdrop"><div class="ev-box" role="dialog" aria-label="${esc(st.title)}">
            <h3>⚖️ ${esc(st.title)}</h3>
            <div class="ev-score"><b>Thuyết phục ${r.correct}/${r.total}</b><span>${stars}</span></div>
            <div class="ev-lines">${(r.lines ?? []).map(([who, t]) => `<p><b>${esc(speakers[who]?.name ?? NAMES[who] ?? who)}:</b> ${esc(t)}</p>`).join('')}</div>
            ${st.rewardText ? `<p class="ev-reward">🎁 ${esc(st.rewardText)}</p>` : ''}
            <div class="ev-actions"><button class="ev-btn main" data-ev-continue>Vào đại sảnh ⚔️</button></div>
        </div></div>`;
    }
    const all = (st.questions ?? []).every(q => st.answers?.[q.id]);
    const qRows = (st.questions ?? []).map((q, i) => {
        const pick = ev[st.answers?.[q.id]];
        return `<button class="ev-q${st.active === q.id ? ' on' : ''}${pick ? ' done' : ''}" data-ev-q="${esc(q.id)}">
            <span class="ev-q-no">${i + 1}</span><span class="ev-q-text">${esc(q.text)}</span>
            <span class="ev-chip">${pick ? `${esc(pick.icon)} ${esc(pick.name)}` : 'Chọn chứng cứ…'}</span></button>`;
    }).join('');
    const picker = st.active ? `<div class="ev-picker">
        <p class="ev-hint">Chọn chứng cứ cho câu ${(st.questions.findIndex(q => q.id === st.active)) + 1}:</p>
        ${(st.evidence ?? []).length ? `<div class="ev-cards">${st.evidence.map(e => `<button class="ev-card${st.answers?.[st.active] === e.id ? ' on' : ''}" data-ev-pick="${esc(e.id)}" title="${esc(e.desc)}">
            <span class="ev-ic">${esc(e.icon)}</span><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></button>`).join('')}</div>`
            : '<p class="ev-empty">Bạn chưa có chứng cứ nào… (thắng các ải và điều tra trên bản đồ để thu thập)</p>'}
    </div>` : '';
    return `<div class="cp-confirm-backdrop"><div class="ev-box" role="dialog" aria-label="${esc(st.title)}">
        <h3>⚖️ ${esc(st.title)}</h3>
        <p class="ev-intro">${esc(st.intro)}</p>
        <div class="ev-qs">${qRows}</div>
        ${picker}
        <div class="ev-actions">
            <button class="ev-btn" data-ev-cancel>Để sau</button>
            <button class="ev-btn main" data-ev-submit ${all ? '' : 'disabled'}>Trình lên nhà vua</button>
        </div>
    </div></div>`;
}
