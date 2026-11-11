// ============================================================
// 📜 BẢNG NHIỆM VỤ (QUEST LOG) & THEO DÕI NHIỆM VỤ (TRACKER)
// Pure HTML-string builders — không gắn listener, không giữ state toàn cục.
// Mọi sự kiện click được uỷ quyền qua các thuộc tính data-ql-*.
// 5 thẻ: Chính tuyến · Phụ · Nhánh · Ẩn (chỉ cái đã tìm ra) · Hằng ngày (+ 🔎 Chứng cứ) — dữ liệu: game/quests.js (qlog)
// ============================================================

const STATE_ORDER = { active: 0, offered: 1, locked: 2, done: 3 };

const STATE_LABEL = {
    active: 'Đang làm',
    offered: 'Chưa nhận',
    locked: 'Chưa mở',
    done: 'Đã xong'
};
// loại nhiệm vụ -> [nhãn, lớp màu, biểu tượng dòng]
const TYPE = {
    main: ['CHÍNH TUYẾN', 'main', '⭐'],
    side: ['PHỤ', 'side', '◆'],
    branch: ['NHÁNH', 'branch', '❖'],
    hidden: ['ẨN', 'hidden', '🔮'],
};
const QUEST_TABS = ['main', 'side', 'branch', 'hidden'];

/**
 * Escape chuỗi văn bản từ server trước khi chèn vào HTML.
 * @param {unknown} s
 * @returns {string}
 */
export function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function tagHTML(type) {
    const [label, cls] = TYPE[type] ?? TYPE.side;
    return `<span class="ql-tag ql-tag-${cls}">${label}</span>`;
}

function rowSubText(q) {
    if (!q) return '';
    if (q.state === 'done') return '✔ Đã xong';
    if (q.state === 'locked') {
        return q.needNo != null ? `🔒 Mở sau ải ${esc(q.needNo)}` : `🔒 ${esc(q.obj || 'Chưa mở')}`;
    }
    if (q.state === 'offered') {
        return q.giver ? `Chưa nhận — gặp ${esc(q.giver)}` : 'Chưa nhận';
    }
    const prog = q.progress && q.progress.need > 0
        ? ` (${Number(q.progress.have) || 0}/${Number(q.progress.need) || 0})`
        : '';
    return `${esc(q.obj || '')}${prog}`;
}

function filterQuests(quests, tab) {
    const list = Array.isArray(quests) ? quests : [];
    return list
        .filter(q => q && q.type === tab)
        .sort((a, b) => (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9));   // xong thì xuống cuối
}

/**
 * Khung theo dõi nhiệm vụ nhỏ ở góc trên bên phải màn bản đồ thế giới (dưới thanh top bar).
 * @param {object|null} quest - Nhiệm vụ đang theo dõi hoặc null
 * @param {object|null} daily - việc hôm nay (qlog.daily) -> nút mở thẻ Hằng ngày
 * @returns {string} HTML string
 */
export function trackerHTML(quest, daily = null) {
    const dailyBtn = daily ? `<button type="button" class="ql-btn ql-trk-daily${daily.tasks.every(t => t.done) ? ' is-done' : ''}" data-ql-daily title="Việc hôm nay">📅 Hôm nay ${daily.tasks.filter(t => t.done).length}/${daily.tasks.length}</button>` : '';
    if (!quest) {
        return `<aside class="ql-tracker ql-tracker-empty" aria-label="Theo dõi nhiệm vụ">
            <span class="ql-trk-empty-text">Chưa theo dõi nhiệm vụ nào</span>
            <button type="button" class="ql-btn ql-trk-open" data-ql-open>📜 Nhiệm vụ (J)</button>${dailyBtn}
        </aside>`;
    }

    const hasProg = quest.progress && Number(quest.progress.need) > 0;
    const have = hasProg ? Math.max(0, Number(quest.progress.have) || 0) : 0;
    const need = hasProg ? Math.max(1, Number(quest.progress.need) || 1) : 1;
    const pct = hasProg ? Math.min(100, Math.round((have / need) * 100)) : 0;
    const canGo = Boolean(quest.target);

    return `<aside class="ql-tracker" aria-label="Theo dõi nhiệm vụ">
        <div class="ql-trk-head">
            ${tagHTML(quest.type)}
            <b class="ql-trk-title" title="${esc(quest.title)}">${esc(quest.title)}</b>
        </div>
        <div class="ql-trk-obj">
            <span class="ql-trk-obj-text">${esc(quest.obj || '')}</span>
            ${hasProg ? `<span class="ql-trk-prog">${quest.type === 'main' ? 'Bước ' : ''}${have}/${need}</span>` : ''}
        </div>
        ${hasProg ? `<div class="ql-trk-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>` : ''}
        <div class="ql-trk-actions">
            ${canGo ? `<button type="button" class="ql-btn ql-btn-go ql-trk-go" data-ql-go="${esc(quest.id)}">🧭 Tự đi tới</button>` : ''}
            <button type="button" class="ql-btn ql-trk-open" data-ql-open>📜 Nhiệm vụ (J)</button>${dailyBtn}
        </div>
    </aside>`;
}

const hms = (ms) => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} phút` : `${m} phút`; };
/** Thẻ Hằng ngày: 4 việc + thanh tiến độ, bên phải là tổng thưởng trong ngày */
function dailyHTML(daily) {
    const done = daily.tasks.filter(t => t.done).length, got = done * daily.each + (daily.bonusGot ? daily.bonus : 0);
    const list = daily.tasks.map(t => {
        const pct = Math.min(100, Math.round((t.have / Math.max(1, t.need)) * 100));
        return `<div class="ql-row ql-daily-row${t.done ? ' is-done' : ''}">
            <span class="ql-row-icon" aria-hidden="true">${t.done ? '✅' : t.fight ? '⚔️' : '🧺'}</span>
            <span class="ql-row-main">
                <span class="ql-row-title-line"><b class="ql-row-title">${esc(t.text)}</b><span class="ql-daily-count">${t.have}/${t.need}</span></span>
                <span class="ql-prog-bar" role="progressbar" aria-valuenow="${t.have}" aria-valuemin="0" aria-valuemax="${t.need}"><i style="width:${pct}%"></i></span>
                <small class="ql-row-sub">${t.done ? `Đã nhận +${daily.each} Kim Cương` : `Thưởng: +${daily.each} Kim Cương`}</small>
            </span>
        </div>`;
    }).join('');
    const detail = `<div class="ql-detail-content">
        <div class="ql-detail-meta"><span class="ql-tag ql-tag-daily">HẰNG NGÀY</span><span class="ql-status-pill">${done}/${daily.tasks.length} việc</span></div>
        <h3 class="ql-detail-title">📅 Việc hôm nay</h3>
        <p class="ql-desc">Mỗi ngày có ${daily.tasks.length} việc nhỏ, làm ở đâu cũng được. Xong việc nào Kim Cương về ngay việc đó, không cần bấm nhận.</p>
        <div class="ql-obj-box${done === daily.tasks.length ? ' is-done' : ''}">
            <div class="ql-obj-head"><span class="ql-obj-label">Kim Cương hôm nay</span><b class="ql-obj-count">${got} / ${daily.total}</b></div>
            <div class="ql-prog-bar" role="progressbar" aria-valuenow="${got}" aria-valuemin="0" aria-valuemax="${daily.total}"><i style="width:${Math.round(got / daily.total * 100)}%"></i></div>
            <div class="ql-obj-text">${daily.bonusGot ? `Đã xong cả ${daily.tasks.length} việc: +${daily.bonus} Kim Cương thưởng thêm.` : `Xong cả ${daily.tasks.length} việc được thêm +${daily.bonus} Kim Cương.`}</div>
        </div>
        <div class="ql-reward">⏰ Việc mới sau <b>${esc(hms(daily.resetIn))}</b> (05:00 sáng mỗi ngày).</div>
    </div>`;
    return { list, detail };
}

/**
 * Bảng nhiệm vụ đầy đủ (modal kiểu sách / cẩm nang hành trình).
 * @param {Array<object>} quests - Danh sách nhiệm vụ (chính tuyến + phụ + nhánh + ẩn đã tìm ra)
 * @param {{ tab?: string, sel?: string|null, tracked?: string|null, evidence?: object|null, qlog?: object|null }} [opts]
 * @returns {string} HTML string
 */
export function questLogHTML(quests = [], { tab = 'main', sel = null, tracked = null, evidence = null, qlog = null, notebook = null } = {}) {
    const safeQuests = Array.isArray(quests) ? quests : [];
    const daily = qlog?.daily ?? null, hidden = qlog?.hidden ?? null;
    const curTab = QUEST_TABS.includes(tab) || (tab === 'daily' && daily) || (tab === 'evidence' && evidence) || (tab === 'notes' && notebook) ? tab : 'main';
    const open = (t) => safeQuests.filter(q => q && q.type === t && q.state !== 'done' && q.state !== 'locked').length;

    const filtered = QUEST_TABS.includes(curTab) ? filterQuests(safeQuests, curTab) : [];
    const current = filtered.find(q => q.id === sel) ?? filtered[0] ?? null;

    const tabsMeta = [
        ['main', 'Chính tuyến', qlog?.main && qlog.main.i < qlog.main.total ? `${qlog.main.i}/${qlog.main.total}` : open('main')],
        ['side', 'Phụ', open('side')],
        ['branch', 'Nhánh', open('branch')],
        ['hidden', 'Ẩn', hidden ? `${hidden.found}/${hidden.total}` : open('hidden')],
        ...(daily ? [['daily', 'Hằng ngày', `${daily.tasks.filter(t => t.done).length}/${daily.tasks.length}`]] : []),
        ...(evidence ? [['evidence', '🔎 Chứng cứ', `${evidence.count}/${evidence.total}`]] : []),
        ...(notebook ? [['notes', '📓 Ghi chép', `${notebook.have}/${notebook.total}`]] : [])
    ];

    let listHTML = filtered.length
        ? filtered.map(q => {
            const isSel = current && q.id === current.id;
            const isTracked = tracked != null && q.id === tracked;
            const [, cls, icon] = TYPE[q.type] ?? TYPE.side;
            const stateCls = `ql-state-${esc(q.state || 'active')}`;
            return `<button type="button" class="ql-row ${stateCls}${isSel ? ' is-selected' : ''}${q.state === 'done' ? ' is-done' : ''}" data-ql-sel="${esc(q.id)}">
                <span class="ql-row-icon is-${cls}" aria-hidden="true">${icon}</span>
                <span class="ql-row-main">
                    <span class="ql-row-title-line">
                        <b class="ql-row-title">${esc(q.title)}</b>
                        ${isTracked ? `<span class="ql-row-pin" title="Đang theo dõi">📌</span>` : ''}
                    </span>
                    <small class="ql-row-sub">${rowSubText(q)}</small>
                </span>
            </button>`;
        }).join('')
        : `<div class="ql-empty">${curTab === 'hidden' ? 'Chưa tìm ra nhiệm vụ ẩn nào. Hãy thử làm những việc lạ quanh bản đồ…' : 'Chưa có nhiệm vụ nào ở mục này'}</div>`;
    if (curTab === 'hidden' && hidden) listHTML = `<div class="ql-hidden-count">🔮 Đã tìm ra <b>${hidden.found} / ${hidden.total}</b> nhiệm vụ ẩn</div>${listHTML}`;

    let detailHTML = `<div class="ql-detail-empty">
        <span class="ql-empty-illust" aria-hidden="true">${curTab === 'hidden' ? '🔮' : '📖'}</span>
        <p>${curTab === 'hidden' ? 'Nhiệm vụ ẩn không có dấu chỉ trên bản đồ. Tìm ra cái nào, nó mới hiện ở đây.' : 'Chưa có nhiệm vụ nào ở mục này'}</p>
        ${curTab === 'hidden' && qlog?.titles?.length ? `<p class="ql-titles">🏅 Danh hiệu: ${qlog.titles.map(t => `<b>${esc(t)}</b>`).join(' · ')}</p>` : ''}
    </div>`;

    // 🔎 Sổ chứng cứ (game/evidence.js -> worldState.evidence): danh sách bên trái, chi tiết bên phải
    let evList = null;
    if (curTab === 'evidence') {
        const items = evidence.list ?? [];
        const cur = items.find(e => e.id === sel) ?? items.find(e => e.got) ?? items[0] ?? null;
        evList = items.map(e => `<button type="button" class="ql-row ql-ev-row${e.got ? '' : ' is-missing'}${cur && e.id === cur.id ? ' is-selected' : ''}" data-ql-sel="${esc(e.id)}">
            <span class="ql-row-icon" aria-hidden="true">${esc(e.icon)}</span>
            <span class="ql-row-main"><span class="ql-row-title-line"><b class="ql-row-title">${esc(e.name)}</b></span>
            <small class="ql-row-sub">${esc(e.got ? e.from : e.hint ?? '')}</small></span></button>`).join('');
        detailHTML = cur ? `<div class="ql-detail-content">
            <div class="ql-detail-meta"><span class="ql-status-pill">${cur.got ? '✓ Đã có' : '🔒 Chưa tìm thấy'}</span><span class="ql-tracked-pill">${esc(cur.from)}</span></div>
            <h3 class="ql-detail-title"><span class="ql-ev-big">${esc(cur.icon)}</span> ${esc(cur.name)}</h3>
            ${cur.got ? `<p class="ql-desc">${esc(cur.desc)}</p>` : `<p class="ql-desc"><i>${esc(cur.hint ?? '')}</i></p>`}
            ${cur.comment ? `<div class="ql-obj-box"><div class="ql-obj-head"><span class="ql-obj-label">${esc(cur.comment.who === 'me' ? 'Bạn' : ({ warrior: 'Rok', assassin: 'Jessica', priest: 'Sera', archer: 'Lyra', corvin: 'Lão Corvin' })[cur.comment.who] ?? cur.comment.who)}</span></div><div class="ql-obj-text">“${esc(cur.comment.text)}”</div></div>` : ''}
            <div class="ql-reward">⚖️ Chứng cứ sẽ dùng khi đối chất trước nhà vua (trước ải 18). Đã có <b>${evidence.count}/${evidence.total}</b>.</div>
        </div>` : detailHTML;
    }
    // 📓 Ghi chép (game/gather.js -> worldState.notebook): biển chỉ đường, bia mộ, phiến đá… đã đọc trên bản đồ; chưa đọc hiện ???
    if (curTab === 'notes') {
        const items = notebook.list ?? [];
        const cur = items.find(n => n.id === sel) ?? items.find(n => n.read) ?? items[0] ?? null;
        evList = `<div class="ql-hidden-count">📓 Đã đọc <b>${notebook.have} / ${notebook.total}</b> ghi chép</div>` + items.map(n => `<button type="button" class="ql-row ql-ev-row${n.read ? '' : ' is-missing'}${cur && n.id === cur.id ? ' is-selected' : ''}" data-ql-sel="${esc(n.id)}">
            <span class="ql-row-icon" aria-hidden="true">${n.read ? '📜' : '❔'}</span>
            <span class="ql-row-main"><span class="ql-row-title-line"><b class="ql-row-title">${esc(n.title)}</b></span>
            <small class="ql-row-sub">${esc(n.where)}</small></span></button>`).join('');
        detailHTML = cur ? `<div class="ql-detail-content">
            <div class="ql-detail-meta"><span class="ql-status-pill">${cur.read ? '✓ Đã đọc' : '🔒 Chưa tìm thấy'}</span><span class="ql-tracked-pill">${esc(cur.where)}</span></div>
            <h3 class="ql-detail-title">${esc(cur.title)}</h3>
            ${cur.read ? cur.lines.map(t => `<p class="ql-desc">${esc(t)}</p>`).join('') : `<p class="ql-desc"><i>Có một thứ đọc được ở ${esc(cur.where)}. Tìm biển gỗ, bia đá, tờ giấy dán… rồi bấm A để đọc.</i></p>`}
            <div class="ql-reward">📓 Ghi chép kể chuyện về vùng đất này. Vài tờ còn chỉ chỗ rương ẩn hoặc dạy công thức nấu ăn.</div>
        </div>` : detailHTML;
    }
    // 📅 việc hằng ngày
    if (curTab === 'daily') {
        const d = dailyHTML(daily);
        evList = d.list; detailHTML = d.detail;
    }

    if (current && QUEST_TABS.includes(curTab)) {
        const hasProg = current.progress && Number(current.progress.need) > 0;
        const have = hasProg ? Math.max(0, Number(current.progress.have) || 0) : 0;
        const need = hasProg ? Math.max(1, Number(current.progress.need) || 1) : 1;
        const pct = hasProg ? Math.min(100, Math.round((have / need) * 100)) : 0;

        const isTracked = tracked != null && current.id === tracked;
        const canTrack = (current.state === 'active' || current.state === 'offered') && !isTracked;
        const canGo = !!current.target && current.state !== 'done' && current.state !== 'locked';
        const stLabel = STATE_LABEL[current.state] ?? '';

        const objText = current.state === 'locked' && current.needNo != null
            ? `🔒 Mở sau ải ${esc(current.needNo)}`
            : esc(current.obj || '');
        const stepText = current.step ? `Bước ${Number(current.step.i) || 1} / ${Number(current.step.total) || 1}` : current.type === 'main' && hasProg ? 'Số bước đã xong' : 'Mục tiêu hiện tại';

        detailHTML = `<div class="ql-detail-content">
            <div class="ql-detail-meta">
                ${tagHTML(current.type)}
                ${stLabel ? `<span class="ql-status-pill ql-status-${esc(current.state)}">${esc(stLabel)}</span>` : ''}
                ${isTracked ? `<span class="ql-tracked-pill">📌 Đang theo dõi</span>` : ''}
            </div>
            <h3 class="ql-detail-title">${esc(current.title)}</h3>
            ${current.giver ? `<div class="ql-giver">Người giao: <b>${esc(current.giver)}</b></div>` : ''}
            ${current.desc ? `<p class="ql-desc">${esc(current.desc)}</p>` : ''}
            <div class="ql-obj-box ${current.state === 'done' ? 'is-done' : ''}${current.state === 'locked' ? ' is-locked' : ''}">
                <div class="ql-obj-head">
                    <span class="ql-obj-label">${stepText}</span>
                    ${hasProg ? `<b class="ql-obj-count">${have} / ${need}</b>` : ''}
                </div>
                <div class="ql-obj-text">${objText}</div>
                ${hasProg ? `<div class="ql-prog-bar" role="progressbar" aria-valuenow="${have}" aria-valuemin="0" aria-valuemax="${need}">
                    <i style="width:${pct}%"></i>
                </div>` : ''}
            </div>
            ${current.reward ? `<div class="ql-reward">🎁 Thưởng: <b>${esc(current.reward)}</b></div>` : ''}
            <div class="ql-detail-actions">
                ${canTrack ? `<button type="button" class="ql-btn ql-btn-track" data-ql-track="${esc(current.id)}">📌 Theo dõi</button>` : ''}
                ${canGo ? `<button type="button" class="ql-btn ql-btn-go" data-ql-go="${esc(current.id)}">🧭 Tự đi tới</button>` : ''}
            </div>
        </div>`;
    }

    return `<div class="cp-confirm-backdrop ql-backdrop" data-ql-close>
        <div class="ql-book" role="dialog" aria-modal="true" aria-label="Sổ nhiệm vụ">
            <header class="ql-header">
                <div class="ql-header-title">
                    <span class="ql-header-icon" aria-hidden="true">📜</span>
                    <div>
                        <h2>SỔ NHIỆM VỤ</h2>
                        <small>Hành trình &amp; ủy thác quanh vùng đất</small>
                    </div>
                </div>
                <button type="button" class="ql-close" data-ql-close aria-label="Đóng">✕</button>
            </header>
            <div class="ql-columns">
                <section class="ql-left" aria-label="Danh sách nhiệm vụ">
                    <nav class="ql-tabs" role="tablist">
                        ${tabsMeta.map(([k, label, cnt]) => `<button type="button" role="tab" aria-selected="${curTab === k}" class="ql-tab${curTab === k ? ' is-active' : ''}" data-ql-tab="${k}">
                            <span class="ql-tab-label">${esc(label)}</span>
                            <span class="ql-tab-badge">${cnt}</span>
                        </button>`).join('')}
                    </nav>
                    <div class="ql-list">
                        ${evList ?? listHTML}
                    </div>
                </section>
                <section class="ql-right" aria-label="Chi tiết nhiệm vụ">
                    ${detailHTML}
                </section>
            </div>
        </div>
    </div>`;
}
