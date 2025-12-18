(function() {
    'use strict';

    if (window.MK_ENGINE) return;
    window.MK_ENGINE = {};

    // --- State Management ---
    const STATE = {
        config: {},
        episodes: [],
        currentTab: 'episodes'
    };

    // --- Utilities ---
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    
    const Utils = {
        formatDate: (dateStr) => {
            if(!dateStr) return "-";
            return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        },
        isLocked: (scheduleDate) => {
            if (!scheduleDate) return false;
            return new Date(scheduleDate) > new Date();
        },
        extractEpNum: (str) => {
            const match = str.match(/Episode\s+(\d+)/i) || str.match(/Ep\s+(\d+)/i);
            return match ? parseInt(match[1]) : 999;
        }
    };

    // --- Core Initialization ---
    window.MK_ENGINE.init = function(pageConfig) {
        STATE.config = { ...MORIKNUS_CONFIG, ...pageConfig };
        const container = $('#mk-app');
        
        if (!container) return console.error("Container #mk-app not found!");
        
        // Set Theme
        document.body.setAttribute('data-theme', STATE.config.ui.defaultTheme);
        if(STATE.config.enableDarkMode) document.body.setAttribute('data-theme', 'dark');

        // Route Page Type
        switch (STATE.config.pageType) {
            case 'detail-series': renderDetailSeries(container); break;
            case 'detail-movie': renderDetailMovie(container); break;
            case 'player-series': renderPlayerSeries(container); break;
            case 'player-movie': renderPlayerMovie(container); break;
        }

        // Render Global Announcement
        if(STATE.config.announcement?.enable) {
            renderAnnouncement(container, STATE.config.announcement.text);
        }
    };

    // ==========================================================
    // RENDERERS
    // ==========================================================

    // 1. DETAIL SERIES
    async function renderDetailSeries(container) {
        const info = STATE.config.info;
        
        // Header
        const headerHTML = buildHeader(info, true, false);
        
        // Tabs & Content Area
        const contentHTML = `
            <div class="mk-tabs">
                <button class="mk-tab-btn active" onclick="MK_ENGINE.switchTab('episodes')">📺 ${STATE.config.text.episodes}</button>
                <button class="mk-tab-btn" onclick="MK_ENGINE.switchTab('trailer')">🎬 Trailer</button>
                <button class="mk-tab-btn" onclick="MK_ENGINE.switchTab('info')">ℹ️ Info</button>
            </div>
            
            <div id="tab-episodes" class="mk-tab-content">
                <div class="mk-controls">
                    <input type="text" id="mk-search" placeholder="Cari episode..." onkeyup="MK_ENGINE.filterEpisodes(this.value)" 
                    style="width:100%; padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-main); margin-bottom:15px;">
                </div>
                <div id="mk-ep-list" class="mk-ep-grid">Loading...</div>
            </div>

            <div id="tab-trailer" class="mk-tab-content mk-hidden">
                <div class="mk-player-box">
                    <iframe src="${STATE.config.trailerURL || ''}" allowfullscreen></iframe>
                </div>
            </div>

            <div id="tab-info" class="mk-tab-content mk-hidden">
                <div class="mk-synopsis">${info.synopsis}</div>
                <!-- Cast Grid could go here -->
            </div>
        `;

        container.innerHTML = headerHTML + contentHTML;

        // Fetch Data
        await fetchEpisodes();
    }

    // 2. DETAIL MOVIE
    function renderDetailMovie(container) {
        const info = STATE.config.info;
        // Header with "Watch Now" button
        const headerHTML = buildHeader(info, false, true);
        
        // Additional Movie Info
        const bodyHTML = `
            <div style="margin-top:30px;">
                <h3 style="margin-bottom:10px;">Sinopsis</h3>
                <div class="mk-synopsis">${info.synopsis}</div>
                
                ${STATE.config.trailerURL ? `
                <h3 style="margin-bottom:10px; margin-top:20px;">Trailer</h3>
                <div class="mk-player-box">
                    <iframe src="${STATE.config.trailerURL}" allowfullscreen></iframe>
                </div>` : ''}
            </div>
        `;

        container.innerHTML = headerHTML + bodyHTML;
    }

    // 3. PLAYER SERIES
    async function renderPlayerSeries(container) {
        const isLocked = STATE.config.jadwalRilis && Utils.isLocked(STATE.config.jadwalRilis);

        if (isLocked) {
            container.innerHTML = buildLockedScreen(STATE.config.jadwalRilis);
            return;
        }

        const playerHTML = `
            <div class="mk-player-box">
                <iframe src="${STATE.config.videoSource.url}" allowfullscreen></iframe>
            </div>
            <div class="mk-btn-group" style="justify-content:space-between; margin-bottom:20px;">
                <button id="btn-prev" class="mk-btn mk-btn-secondary" disabled>❮ Prev</button>
                <button class="mk-btn mk-btn-primary" onclick="location.href='${STATE.config.detailPageURL}'">≡ Daftar Episode</button>
                <button id="btn-next" class="mk-btn mk-btn-secondary" disabled>Next ❯</button>
            </div>
            <div class="mk-synopsis">
                <b>Sedang Memutar:</b> Episode ini. <br>
                ${STATE.config.info?.synopsis || ''}
            </div>
        `;

        container.innerHTML = playerHTML;
        setupNavigation(); // Setup Prev/Next
    }

    // 4. PLAYER MOVIE
    function renderPlayerMovie(container) {
        const isLocked = STATE.config.jadwalRilis && Utils.isLocked(STATE.config.jadwalRilis);
        
        if (isLocked) {
            container.innerHTML = buildLockedScreen(STATE.config.jadwalRilis);
            return;
        }

        const playerHTML = `
            <div class="mk-player-box">
                <iframe src="${STATE.config.videoSource.url}" allowfullscreen></iframe>
            </div>
            <div class="mk-synopsis">
                <h3>${STATE.config.info?.title || 'Movie'}</h3>
                ${STATE.config.info?.synopsis || ''}
            </div>
            <div class="mk-btn-group">
                 <a href="${STATE.config.urls?.report}" target="_blank" class="mk-btn mk-btn-danger">🚨 Lapor Error</a>
                 <a href="${STATE.config.urls?.trakter}" target="_blank" class="mk-btn mk-btn-trakteer">🎁 Dukung Kami</a>
            </div>
        `;
        container.innerHTML = playerHTML;
    }

    // ==========================================================
    // HELPERS & UI BUILDERS
    // ==========================================================

    function buildHeader(info, isSeries, showPlayBtn) {
        let statsHTML = '';
        if(info.extra) {
            statsHTML = Object.entries(info.extra).map(([k,v]) => 
                `<div class="mk-stat-item"><span>${k}</span><b>${v}</b></div>`
            ).join('');
        }

        let actionBtn = '';
        if(showPlayBtn && STATE.config.playerLink) {
            actionBtn = `<a href="${STATE.config.playerLink}" class="mk-btn mk-btn-primary">▶ Nonton Film</a>`;
        } else if (isSeries) {
            actionBtn = `<button class="mk-btn mk-btn-primary" onclick="document.querySelector('.mk-tabs').scrollIntoView({behavior:'smooth'})">↓ Lihat Episode</button>`;
        }

        return `
        <div class="mk-header">
            <div class="mk-header-bg" style="background-image:url('${info.poster}')"></div>
            <div class="mk-poster"><img src="${info.poster}" alt="${info.title}"></div>
            <div class="mk-info">
                <h1 class="mk-title">${info.title}</h1>
                <div class="mk-meta">${info.originalTitle || ''}</div>
                <div class="mk-stats-grid">${statsHTML}</div>
                <div class="mk-btn-group">
                    ${actionBtn}
                    <a href="${STATE.config.urls?.trakter}" target="_blank" class="mk-btn mk-btn-trakteer">🎁 Donasi</a>
                </div>
            </div>
        </div>`;
    }

    function buildLockedScreen(date) {
        return `
        <div style="text-align:center; padding:50px 20px; background:var(--bg-card); border-radius:12px; border:1px solid var(--danger);">
            <div style="font-size:3rem;">🔒</div>
            <h2>Konten Terkunci</h2>
            <p>Akan tayang pada: <b>${Utils.formatDate(date)} WIB</b></p>
            <button onclick="history.back()" class="mk-btn mk-btn-secondary" style="margin-top:20px;">Kembali</button>
        </div>`;
    }

    function renderAnnouncement(container, text) {
        const div = document.createElement('div');
        div.className = 'mk-announce';
        div.innerHTML = `<span>📢</span> <div>${text}</div>`;
        container.insertBefore(div, container.firstChild);
    }

    // --- Logic Fetch Data (Blogger Feed) ---
    async function fetchEpisodes() {
        const labels = STATE.config.labels;
        if(!labels || !labels.length) return;

        const feedUrl = `${STATE.config.websiteURL}/feeds/posts/default/-/${encodeURIComponent(labels[0])}?alt=json&max-results=150`;
        const listContainer = $('#mk-ep-list');

        try {
            const res = await fetch(feedUrl);
            const data = await res.json();
            
            STATE.episodes = data.feed.entry.map(e => ({
                title: e.title.$t,
                url: e.link.find(l => l.rel === 'alternate').href,
                published: e.published.$t,
                epNum: Utils.extractEpNum(e.title.$t)
            })).sort((a,b) => a.epNum - b.epNum); // Sort 1, 2, 3...

            renderEpisodeList(STATE.episodes);

        } catch(e) {
            listContainer.innerHTML = `<div style="padding:20px;text-align:center;">Gagal memuat episode.</div>`;
            console.error(e);
        }
    }

    window.MK_ENGINE.filterEpisodes = (query) => {
        const filtered = STATE.episodes.filter(ep => ep.title.toLowerCase().includes(query.toLowerCase()));
        renderEpisodeList(filtered);
    }

    function renderEpisodeList(list) {
        const container = $('#mk-ep-list');
        if(!list.length) { container.innerHTML = "Tidak ada episode."; return; }

        container.innerHTML = list.map(ep => {
            // Cek Jadwal
            const customSchedule = STATE.config.schedules ? STATE.config.schedules[ep.epNum] : null;
            const isLocked = customSchedule ? Utils.isLocked(customSchedule) : false;
            const displayDate = customSchedule ? Utils.formatDate(customSchedule) : Utils.formatDate(ep.published);
            
            // Badge Logic
            let badge = '';
            if(isLocked) badge = `<span class="mk-badge locked">Terjadwal</span>`;
            
            const clickAttr = isLocked ? '' : `onclick="window.location.href='${ep.url}'"`;
            const lockedClass = isLocked ? 'locked' : '';

            return `
            <div class="mk-ep-card ${lockedClass}" ${clickAttr}>
                ${badge}
                <div class="mk-ep-num">#${ep.epNum}</div>
                <div class="mk-ep-info">
                    <div class="mk-ep-title">${ep.title}</div>
                    <div class="mk-ep-date">${isLocked ? 'Tayang:' : 'Rilis:'} ${displayDate}</div>
                </div>
                <div>${isLocked ? '🔒' : '▶'}</div>
            </div>`;
        }).join('');
    }

    // --- Logic Navigation Player ---
    async function setupNavigation() {
        // Fetch ulang feed untuk tahu next/prev link
        const labels = STATE.config.labels;
        if(!labels) return;

        // Logic fetch sama dengan diatas (simplified)
        const feedUrl = `${STATE.config.websiteURL}/feeds/posts/default/-/${encodeURIComponent(labels[0])}?alt=json&max-results=150`;
        try {
            const res = await fetch(feedUrl);
            const data = await res.json();
            const eps = data.feed.entry.map(e => ({
                url: e.link.find(l => l.rel === 'alternate').href,
                epNum: Utils.extractEpNum(e.title.$t)
            })).sort((a,b) => a.epNum - b.epNum);

            // Find current index
            const currentUrl = window.location.href.split('?')[0]; // remove query params
            const idx = eps.findIndex(e => e.url.includes(currentUrl) || currentUrl.includes(e.url));

            const btnPrev = $('#btn-prev');
            const btnNext = $('#btn-next');

            if(idx > 0) {
                btnPrev.disabled = false;
                btnPrev.onclick = () => window.location.href = eps[idx-1].url;
            }
            if(idx < eps.length - 1 && idx !== -1) {
                btnNext.disabled = false;
                btnNext.onclick = () => window.location.href = eps[idx+1].url;
            }

        } catch(e) { console.log("Nav error", e); }
    }

    // --- Tab Switcher ---
    window.MK_ENGINE.switchTab = (tabName) => {
        $$('.mk-tab-content').forEach(el => el.classList.add('mk-hidden'));
        $(`#tab-${tabName}`).classList.remove('mk-hidden');
        $$('.mk-tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    };

})();
