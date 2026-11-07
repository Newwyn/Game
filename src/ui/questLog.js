// ============================================================
// 📜 BẢNG NHIỆM VỤ (QUEST LOG) & THEO DÕI NHIỆM VỤ (TRACKER)
// Pure HTML-string builders — không gắn listener, không giữ state toàn cục.
// Mọi sự kiện click được uỷ quyền qua các thuộc tính data-ql-*.
// ============================================================

const STATE_ORDER = { active: 0, offered: 1, locked: 2, done: 3 };

const STATE_LABEL = {
    active: 'Đang làm',
    offered: 'Chưa nhận',
    locked: 'Chưa mở',
    done: 'Đã xong'
};

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
    const isMain = type === 'main';
    return `<span class="ql-tag ${isMain ? 'ql-tag-main' : 'ql-tag-side'}">${isMain ? 'CHÍNH TUYẾN' : 'PHỤ'}</span>`;
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
    if (tab === 'main') {
        return list
            .filter(q => q && q.type === 'main')
            .sort((a, b) => (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9));
    }
    if (tab === 'side') {
        return list
            .filter(q => q && q.type === 'side')
            .sort((a, b) => (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9));
    }
    // mặc định: 'active' (cả chính tuyến + phụ đang làm)
    return list.filter(q => q && q.state === 'active');
}

/**
 * Khung theo dõi nhiệm vụ nhỏ ở góc trên bên phải màn bản đồ thế giới (dưới thanh top bar).
 * @param {object|null} quest - Nhiệm vụ đang theo dõi hoặc null
 * @returns {string} HTML string
 */
export function trackerHTML(quest) {
    if (!quest) {
        return `<aside class="ql-tracker ql-tracker-empty" aria-label="Theo dõi nhiệm vụ">
            <span class="ql-trk-empty-text">Chưa theo dõi nhiệm vụ nào</span>
            <button type="button" class="ql-btn ql-trk-open" data-ql-open>📜 Nhiệm vụ (J)</button>
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
            ${hasProg ? `<span class="ql-trk-prog">${have}/${need}</span>` : ''}
        </div>
        ${hasProg ? `<div class="ql-trk-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>` : ''}
        <div class="ql-trk-actions">
            ${canGo ? `<button type="button" class="ql-btn ql-btn-go ql-trk-go" data-ql-go="${esc(quest.id)}">🧭 Tự đi tới</button>` : ''}
            <button type="button" class="ql-btn ql-trk-open" data-ql-open>📜 Nhiệm vụ (J)</button>
        </div>
    </aside>`;
}

/**
 * Bảng nhiệm vụ đầy đủ (modal kiểu sách / cẩm nang hành trình).
 * @param {Array<object>} quests - Danh sách nhiệm vụ từ server
 * @param {{ tab?: 'active'|'main'|'side', sel?: string|null, tracked?: string|null }} [opts]
 * @returns {string} HTML string
 */
export function questLogHTML(quests = [], { tab = 'active', sel = null, tracked = null } = {}) {
    const safeQuests = Array.isArray(quests) ? quests : [];
    const curTab = (tab === 'main' || tab === 'side' || tab === 'active') ? tab : 'active';

    const counts = {
        active: safeQuests.filter(q => q && q.state === 'active').length,
        main: safeQuests.filter(q => q && q.type === 'main').length,
        side: safeQuests.filter(q => q && q.type === 'side').length
    };

    const filtered = filterQuests(safeQuests, curTab);
    const current = filtered.find(q => q.id === sel) ?? filtered[0] ?? null;

    const tabsMeta = [
        ['active', 'Đang làm', counts.active],
        ['main', 'Chính tuyến', counts.main],
        ['side', 'Phụ', counts.side]
    ];

    const listHTML = filtered.length
        ? filtered.map(q => {
            const isSel = current && q.id === current.id;
            const isTracked = tracked != null && q.id === tracked;
            const icon = q.type === 'main' ? '⭐' : '◆';
            const stateCls = `ql-state-${esc(q.state || 'active')}`;
            return `<button type="button" class="ql-row ${stateCls}${isSel ? ' is-selected' : ''}${q.state === 'done' ? ' is-done' : ''}" data-ql-sel="${esc(q.id)}">
                <span class="ql-row-icon ${q.type === 'main' ? 'is-main' : 'is-side'}" aria-hidden="true">${icon}</span>
                <span class="ql-row-main">
                    <span class="ql-row-title-line">
                        <b class="ql-row-title">${esc(q.title)}</b>
                        ${isTracked ? `<span class="ql-row-pin" title="Đang theo dõi">📌</span>` : ''}
                    </span>
                    <small class="ql-row-sub">${rowSubText(q)}</small>
                </span>
            </button>`;
        }).join('')
        : `<div class="ql-empty">Chưa có nhiệm vụ nào ở mục này</div>`;

    let detailHTML = `<div class="ql-detail-empty">
        <span class="ql-empty-illust" aria-hidden="true">📖</span>
        <p>Chưa có nhiệm vụ nào ở mục này</p>
    </div>`;

    if (current) {
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
                    <span class="ql-obj-label">Mục tiêu hiện tại</span>
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
                        ${listHTML}
                    </div>
                </section>
                <section class="ql-right" aria-label="Chi tiết nhiệm vụ">
                    ${detailHTML}
                </section>
            </div>
        </div>
    </div>`;
}
