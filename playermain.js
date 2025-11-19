(function() {
    if (window.MORIKNUS_ENGINE) return;
    window.MORIKNUS_ENGINE = {};
    const ENGINE = window.MORIKNUS_ENGINE;

    let CONFIG = {};
    let elements = {};
    let state = {
        allEpisodes: [], 
        currentSeason: "All",
        searchQuery: ""
    };

    // --- FUNGSI UTILITAS ---
    const escapeHTML = (str) => str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]) : '';
    function extractNumber(t) { const m = t.match(/(\d+)/); return m ? parseInt(m[0]) : 9999; }
    function isFuture(dateStr) { if (!dateStr) return false; return new Date(dateStr) > new Date(); }
    function prettyDate(dateStr) { 
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    }

    // --- INISIALISASI ---
    ENGINE.init = function(userConfig) {
        CONFIG = userConfig;
        elements.container = document.getElementById('moriknusContainer');
        
        if (!elements.container) return;
        if (CONFIG.enableDarkMode) elements.container.classList.add('drK');

        // Router Halaman
        switch (CONFIG.pageType) {
            case 'series-detail': renderSeriesDetail(); break;
            case 'series-player': renderSeriesPlayer(); break;
            case 'movie-detail':  renderMovieDetail(); break; // Logic sama dengan series detail
            case 'movie-player':  renderMoviePlayer(); break;
        }
    };

    // ============================================================
    // 1. HALAMAN UTAMA SERIES (DETAIL)
    // ============================================================
    async function renderSeriesDetail() {
        // Render Header (Tombol scroll ke episode)
        renderHeaderUI("Mulai Nonton", null);
        
        // Render Pengumuman
        renderAnnouncement();

        // Render Container Episode
        renderEpisodeContainer();

        // Fetch & Render Episode
        state.allEpisodes = await fetchData(CONFIG.labels); 
        setupEpisodeFilters();
        refreshEpisodeList();
    }

    // ============================================================
    // 2. HALAMAN PLAYER SERIES
    // ============================================================
    async function renderSeriesPlayer() {
        if (CONFIG.jadwalRilis && isFuture(CONFIG.jadwalRilis)) {
            renderBlockScreen(CONFIG.jadwalRilis);
            return;
        }
        renderPlayerBox(true);
        renderSynopsisBelow();
        setupPlayerNavigation();
    }

    // ============================================================
    // 3. HALAMAN UTAMA MOVIE (DETAIL)
    // ============================================================
    function renderMovieDetail() {
        // Render Header (Tombol buka link player)
        renderHeaderUI("Nonton Sekarang", CONFIG.playerLink);
        
        // Render Pengumuman (Movie juga punya pengumuman sekarang)
        renderAnnouncement();
    }

    // ============================================================
    // 4. HALAMAN PLAYER MOVIE
    // ============================================================
    function renderMoviePlayer() {
        if (CONFIG.jadwalRilis && isFuture(CONFIG.jadwalRilis)) {
            renderBlockScreen(CONFIG.jadwalRilis);
            return;
        }
        renderPlayerBox(false); // Tanpa navigasi episode
        renderSynopsisBelow();
    }

    // ============================================================
    // KOMPONEN UI & LOGIKA HELPER
    // ============================================================

    function renderAnnouncement() {
        if (CONFIG.announcement && CONFIG.announcement.enable) {
            const annDiv = document.createElement('div');
            annDiv.className = 'announcementBar';
            annDiv.innerHTML = `<span>📢</span> ${escapeHTML(CONFIG.announcement.text)}`;
            
            // Insert di dalam container, sebelum elemen pertama
            elements.container.insertBefore(annDiv, elements.container.firstChild);
        }
    }

    function renderHeaderUI(btnText, playerUrl) {
        const info = CONFIG.info;
        let tableHTML = '';
        if (info.extra) {
            tableHTML = '<div class="infoTable">';
            for (const [k, v] of Object.entries(info.extra)) {
                tableHTML += `<div class="infoCell"><span>${k}</span><b>${v}</b></div>`;
            }
            tableHTML += '</div>';
        }

        const castHTML = info.cast ? info.cast.map(c => `
            <div class="castCard">
                <img src="${c.img}" onerror="this.src='https://placehold.co/80'">
                <div>${c.name}</div>
                <span>${c.role}</span>
            </div>
        `).join('') : '';

        // Action Button Logic
        let btnAction = '';
        if (playerUrl) {
            // Movie: Buka Link
            btnAction = `window.open('${playerUrl}', '_self')`;
        } else {
            // Series: Scroll ke Episode
            btnAction = "document.querySelector('.epsArea').scrollIntoView({behavior:'smooth'})";
        }

        const html = `
        <div class="detailHeader">
            <div class="detailPoster"><img src="${info.poster}"></div>
            <div class="detailInfo">
                <div class="mainTitle">${info.title}</div>
                <div class="subTitle">${info.originalTitle || ''}</div>
                ${tableHTML}
                <div class="synopsisBox">${info.synopsis}</div>
                <div class="actionArea">
                    <button class="actionBtn" onclick="${btnAction}">▶ ${btnText}</button>
                </div>
            </div>
        </div>
        <div class="castArea">
            <div class="secTitle">Pemeran</div>
            <div class="castRow">${castHTML}</div>
        </div>`;
        
        // Append to container. Note: Announcement is prepended later if exists.
        elements.container.insertAdjacentHTML('beforeend', html);
    }

    function renderEpisodeContainer() {
        const epsArea = document.createElement('div');
        epsArea.className = 'epsArea';
        
        let seasonOptionsHTML = '';
        if (CONFIG.seasonTags && CONFIG.seasonTags.length > 0) {
            seasonOptionsHTML = `<select id="seasonSelect" class="seasonSelect">
                <option value="All">Semua Season</option>
                ${CONFIG.seasonTags.map(tag => `<option value="${tag}">${tag}</option>`).join('')}
            </select>`;
        }

        epsArea.innerHTML = `
            <div class="secTitle">Daftar Episode</div>
            <div class="epsControls">
                ${seasonOptionsHTML}
                <input type="text" id="epsSearch" class="epsSearchInput" placeholder="Cari episode (Contoh: Episode 5)...">
            </div>
            <div id="epsList" class="epsList"><div class="loadingVidioPlayerHHC">Memuat data...</div></div>
        `;
        elements.container.appendChild(epsArea);
    }

    function setupEpisodeFilters() {
        const searchInput = document.getElementById('epsSearch');
        const seasonSelect = document.getElementById('seasonSelect');

        if (searchInput) searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            refreshEpisodeList();
        });

        if (seasonSelect) seasonSelect.addEventListener('change', (e) => {
            state.currentSeason = e.target.value;
            refreshEpisodeList();
        });
    }

    function refreshEpisodeList() {
        const listEl = document.getElementById('epsList');
        if (!listEl) return;

        // Filter
        let filtered = state.allEpisodes.filter(post => {
            const matchSearch = post.title.toLowerCase().includes(state.searchQuery.toLowerCase());
            let matchSeason = true;
            if (state.currentSeason !== "All") {
                matchSeason = post.labels.includes(state.currentSeason);
            }
            return matchSearch && matchSeason;
        });

        // Sortir
        filtered.sort((a, b) => extractNumber(a.title) - extractNumber(b.title));

        if (filtered.length === 0) {
            listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#777;">Tidak ada episode ditemukan.</div>';
            return;
        }

        // Render HTML
        listEl.innerHTML = filtered.map(post => {
            if (window.location.href.includes(post.url)) return ''; 

            const epNum = extractNumber(post.title);
            const datePublished = new Date(post.published).toLocaleDateString('id-ID');
            
            // JADWAL OTOMATIS
            const scheduleTime = CONFIG.schedules ? CONFIG.schedules[epNum] : null;
            let isLocked = false;
            let dateDisplay = datePublished;
            let clickAction = `onclick="window.open('${post.url}', '_self')"`;
            let itemClass = "epsItem";
            let lockBadge = "";

            if (scheduleTime && isFuture(scheduleTime)) {
                isLocked = true;
                itemClass += " locked";
                clickAction = "";
                dateDisplay = prettyDate(scheduleTime);
                lockBadge = `<span class="lockTag">TERJADWAL</span>`;
            }

            return `
            <div class="${itemClass}" ${clickAction}>
                <div class="epsNumBox">${epNum}</div>
                <div class="epsMeta">
                    <div class="epsTitle">${post.title}</div>
                    <div class="epsDate">${lockBadge} ${isLocked ? 'Tayang:' : 'Rilis:'} ${dateDisplay}</div>
                </div>
                <div style="color:var(--main-color);font-size:12px;">${isLocked ? '🔒' : '▶ Putar'}</div>
            </div>`;
        }).join('');
    }

    function renderPlayerBox(withNav) {
        let navHTML = '';
        if (withNav) {
            navHTML = `
            <div class="navPlayer">
                <button class="npBtn" id="btnPrev" disabled>❮ Sebelumnya</button>
                <button class="npBtn" id="btnNext" disabled>Selanjutnya ❯</button>
            </div>`;
        }
        
        let embed = '';
        if (CONFIG.videoSource.type === 'youtube') {
            embed = `<iframe src="${CONFIG.videoSource.url}" allowfullscreen frameborder="0"></iframe>`;
        } else {
            embed = `<video src="${CONFIG.videoSource.url}" controls></video>`;
        }

        elements.container.innerHTML = `
            <div class="playerFrame">${embed}</div>
            ${navHTML}
        `;
    }

    function renderSynopsisBelow() {
        if (CONFIG.info && CONFIG.info.synopsis) {
            const syn = document.createElement('div');
            syn.className = 'videoInfoVidioPlayerHHC';
            syn.innerHTML = `<b style="display:block;margin-bottom:5px;">Info Video:</b> ${CONFIG.info.synopsis}`;
            elements.container.appendChild(syn);
        }
    }

    async function setupPlayerNavigation() {
        const allEps = await fetchData(CONFIG.labels);
        
        let contextEps = allEps;
        if (CONFIG.currentSeason) {
            const seasonLabel = CONFIG.currentSeason; 
            contextEps = allEps.filter(ep => ep.labels.includes(seasonLabel));
            if (contextEps.length === 0) contextEps = allEps; 
        }

        contextEps.sort((a, b) => extractNumber(a.title) - extractNumber(b.title));
        
        const currentPath = window.location.pathname.split('.html')[0];
        const idx = contextEps.findIndex(p => p.url.includes(currentPath));

        if (idx !== -1) {
            const prevBtn = document.getElementById('btnPrev');
            const nextBtn = document.getElementById('btnNext');

            if (idx > 0) {
                prevBtn.disabled = false;
                prevBtn.onclick = () => window.open(contextEps[idx - 1].url, '_self');
            }
            if (idx < contextEps.length - 1) {
                nextBtn.disabled = false;
                nextBtn.onclick = () => window.open(contextEps[idx + 1].url, '_self');
            }
        }
    }

    function renderBlockScreen(dateStr) {
        const dateObj = new Date(dateStr);
        const readable = dateObj.toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'}) + ' WIB';
        elements.container.innerHTML = `
            <div class="blockedScreen">
                <h2>🔒 Konten Terkunci</h2>
                <div class="jadwalTime">Tayang pada: ${readable}</div>
                <p>Silakan kembali lagi saat jadwal tayang.</p>
                <button class="actionBtn" style="margin-top:20px;background:#d32f2f;" onclick="history.back()">Kembali</button>
            </div>
        `;
    }

    async function fetchData(labels) {
        if (!Array.isArray(labels) || labels.length === 0) return [];
        const url = `${CONFIG.websiteURL.replace(/\/$/, '')}/feeds/posts/default/-/${encodeURIComponent(labels[0])}?alt=json&max-results=150`;
        try {
            const r = await fetch(url);
            const d = await r.json();
            return d.feed.entry.map(e => ({
                title: e.title.$t,
                url: e.link.find(l => l.rel === 'alternate').href,
                published: e.published.$t,
                labels: (e.category || []).map(c => c.term)
            }));
        } catch { return []; }
    }

})(); 
