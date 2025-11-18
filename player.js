(function() {
    //
    // --- "MESIN" PLAYER MORIKNUS v6 (File 3) ---
    // Diletakkan di Tema Blogger (sebelum </body>)
    //
    
    // 1. Lindungi dari eksekusi ganda
    if (window.MORIKNUS_PLAYER) return;

    // 2. Buat objek "Mesin" global
    const PLAYER = {};
    window.MORIKNUS_PLAYER = PLAYER;

    // 3. Definisikan variabel internal "Mesin"
    let CONFIG = {};
    let elements = {};
    let state = {
        isLightOff: false,
        isChapterSelectorOpen: false,
        allSeriesEpisodes: [],
        episodes: { data: [], page: 1, sort: 'number', filter: '' },
        recommendations: { data: [], page: 1, sort: 'newest', filter: '' },
        jadwalTimerInterval: null
    };
    
    // 4. Fungsi Inisialisasi Utama (Dipanggil oleh File 2)
    PLAYER.init = function(postingConfig) {
        if (!postingConfig) {
            console.error("Konfigurasi postingan tidak diberikan ke init().");
            return;
        }
        CONFIG = postingConfig;
        
        elements.container = document.getElementById('videoContainerVidioPlayerHHC');
        if (!elements.container) {
            console.error("Elemen player (videoContainerVidioPlayerHHC) tidak ditemukan.");
            return;
        }

        // --- (PERBAIKAN) PENGECEKAN JADWAL ---
        // Cek jadwal SEBELUM memuat player
        if (CONFIG.useJadwal === true && CONFIG.jadwalRilis) {
            const tanggalRilis = new Date(CONFIG.jadwalRilis);
            const sekarang = new Date();
            
            if (tanggalRilis > sekarang) {
                // Belum rilis! Blokir halaman dan hentikan.
                blockPageForSchedule(tanggalRilis);
                return; // HENTIKAN eksekusi player
            }
        }
        
        // --- Jika sudah rilis, lanjutkan memuat player ---
        buildPlayerHTML();
        cacheInternalElements();
        applyConfigSettings();
        loadVideoPlayer();
        loadInfoTab();
        loadCharacterTab();
        loadReviewTab();

        if (CONFIG.enableEpisodeList) loadEpisodes();
        if (CONFIG.enableRecommendationList) loadRecommendations();
        loadAllEpisodesForChapter(); 

        attachEventListeners();
    };

    // 5. Fungsi Internal Mesin

    // (BARU) Blokir Halaman (Sesuai Permintaan)
    function blockPageForSchedule(tanggalRilis) {
        elements.container.innerHTML = ''; 
        if (CONFIG.enableDarkMode) {
            elements.container.classList.add('drK');
        }

        // Format tanggal rilis yang diminta
        const dateString = tanggalRilis.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' WIB'; // Asumsi zona waktu +07:00 adalah WIB

        const blockHTML = `
            <div class="jadwalBlockVidioPlayerHHC">
                <h2>Episode Ini Belum Rilis</h2>
                <p>Akan Tayang Tanggal</p>
                <!-- Menampilkan tanggal statis, BUKAN countdown -->
                <div id="jadwalTanggalRilisHHC">${dateString}</div> 
                <p style="font-size: 14px; color: #888;">Silakan kembali lagi nanti.</p>
            </div>
        `;
        elements.container.innerHTML = blockHTML;
    }

    // (BARU) Membangun HTML Player
    function buildPlayerHTML() {
        elements.container.innerHTML = `
            <div class="videoPlayerWrapperVidioPlayerHHC" id="videoPlayerWrapper"></div>
            <div class="videoInfoVidioPlayerHHC">
                <div class="buttonsContainerVidioPlayerHHC">
                    <div class="navButtonsVidioPlayerHHC" id="navButtonsVidioPlayerHHC" style="position: relative;">
                        <button class="navBtnVidioPlayerHHC" id="prevBtn" disabled>Prev</button>
                        <button class="navBtnVidioPlayerHHC" id="chapterSelectorBtn">Select Chapter</button>
                        <button class="navBtnVidioPlayerHHC" id="nextBtn" disabled>Next</button>
                        <button class="videoControlBtnVidioPlayerHHC" id="lightSwitchBtn" title="Turn Off Light">
                            <svg class="line" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                                <path d="M8.30011 18.0399V16.8799C6.00011 15.4899 4.11011 12.7799 4.11011 9.89993C4.11011 4.94993 8.66011 1.06993 13.8001 2.18993C16.0601 2.68993 18.0401 4.18993 19.0701 6.25993C21.1601 10.4599 18.9601 14.9199 15.7301 16.8699V18.0299C15.7301 18.3199 15.8401 18.9899 14.7701 18.9899H9.26011C8.16011 18.9999 8.30011 18.5699 8.30011 18.0399Z"></path>
                                <path d="M8.5 22C10.79 21.35 13.21 21.35 15.5 22"></path>
                            </svg>
                        </button>
                        <div id="chapterSelectorDropdown" class="chapterSelectorDropdown" style="display: none;">
                            <div class="loadingVidioPlayerHHC">Memuat chapter...</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tabsContainerVidioPlayerHHC">
                <div class="tabNavVidioPlayerHHC" id="tabNavVidioPlayerHHC">
                    <button class="tabBtnVidioPlayerHHC activeVidioPlayerHHC" data-tab="info">Informasi</button>
                    <button class="tabBtnVidioPlayerHHC" data-tab="episodes">Episode</button>
                    <button class="tabBtnVidioPlayerHHC" data-tab="recommendations">Rekomendasi</button>
                    <button class="tabBtnVidioPlayerHHC" data-tab="characters">Karakter</button>
                    <button class="tabBtnVidioPlayerHHC" data-tab="reviews">Review</button>
                </div>
                <div id="tabContentsVidioPlayerHHC">
                    <div class="tabContentVidioPlayerHHC activeVidioPlayerHHC" id="infoTab"></div>
                    <div class="tabContentVidioPlayerHHC" id="episodesTab">
                        <div class="searchAndSortContainerVidioPlayerHHC">
                            <input class="searchInputVidioPlayerHHC" id="episodeSearchVidioPlayerHHC" placeholder="Cari episode...">
                            <div class="sortButtonsVidioPlayerHHC">
                                <button class="sortBtnVidioPlayerHHC activeVidioPlayerHHC" data-sort="number">Urut Nomor</button>
                                <button class="sortBtnVidioPlayerHHC" data-sort="newest">Terbaru</button>
                                <button class="sortBtnVidioPlayerHHC" data-sort="oldest">Terlama</button>
                            </div>
                        </div>
                        <div id="episodeContentVidioPlayerHHC" class="loadingVidioPlayerHHC">Memuat episode...</div>
                        <div class="paginationVidioPlayerHHC" id="episodePaginationVidioPlayerHHC"></div>
                    </div>
                    <div class="tabContentVidioPlayerHHC" id="recommendationsTab">
                        <div class="searchAndSortContainerVidioPlayerHHC">
                            <input class="searchInputVidioPlayerHHC" id="recommendationSearchVidioPlayerHHC" placeholder="Cari rekomendasi...">
                            <div class="sortButtonsVidioPlayerHHC">
                                <button class="sortBtnVidioPlayerHHC activeVidioPlayerHHC" data-sort="newest">Terbaru</button>
                                <button class="sortBtnVidioPlayerHHC" data-sort="oldest">Terlama</button>
                            </div>
                        </div>
                        <div id="recommendationContentVidioPlayerHHC" class="loadingVidioPlayerHHC">Memuat rekomendasi...</div>
                        <div class="paginationVidioPlayerHHC" id="recommendationPaginationVidioPlayerHHC"></div>
                    </div>
                    <div class="tabContentVidioPlayerHHC" id="charactersTab"></div>
                    <div class="tabContentVidioPlayerHHC" id="reviewsTab"></div>
                </div>
            </div>
        `;
    }

    function cacheInternalElements() {
        const $ = (selector) => document.querySelector(selector);
        elements = {
            container: $('#videoContainerVidioPlayerHHC'),
            playerWrapper: $('#videoPlayerWrapper'),
            lightOverlay: document.getElementById('turnOffLightOverlayVidioPlayerHHC'),
            prevBtn: $('#prevBtn'),
            nextBtn: $('#nextBtn'),
            chapterBtn: $('#chapterSelectorBtn'),
            chapterDropdown: $('#chapterSelectorDropdown'),
            lightSwitchBtn: $('#lightSwitchBtn'),
            tabNav: $('#tabNavVidioPlayerHHC'),
            tabContents: $('#tabContentsVidioPlayerHHC'),
            infoTab: $('#infoTab'),
            episodesTab: $('#episodesTab'),
            episodeContent: $('#episodeContentVidioPlayerHHC'),
            episodePagination: $('#episodePaginationVidioPlayerHHC'),
            episodeSearch: $('#episodeSearchVidioPlayerHHC'),
            episodeSortButtons: $('#episodesTab .sortButtonsVidioPlayerHHC'),
            recommendationsTab: $('#recommendationsTab'),
            recommendationContent: $('#recommendationContentVidioPlayerHHC'),
            recommendationPagination: $('#recommendationPaginationVidioPlayerHHC'),
            recommendationSearch: $('#recommendationSearchVidioPlayerHHC'),
            recommendationSortButtons: $('#recommendationsTab .sortButtonsVidioPlayerHHC'),
            charactersTab: $('#charactersTab'),
            reviewsTab: $('#reviewsTab')
        };
    }

    function applyConfigSettings() {
        if (CONFIG.enableDarkMode) {
            elements.container.classList.add('drK');
        }
        if (!CONFIG.enableLightSwitch) {
            if (elements.lightSwitchBtn) elements.lightSwitchBtn.style.display = 'none';
        }
        if (!CONFIG.enableEpisodeList) hideTab('episodes');
        if (!CONFIG.enableRecommendationList) hideTab('recommendations');
        if (!CONFIG.enableCharacterTab) hideTab('characters');
        if (!CONFIG.enableReviewTab) hideTab('reviews');
    }
    
    function hideTab(tabName) {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabButton) tabButton.style.display = 'none';
        if (tabContent) tabContent.style.display = 'none';
    }

    function loadVideoPlayer() {
        if (!elements.playerWrapper) return;
        let playerHTML = '';
        if (CONFIG.videoType === 'youtube') {
            playerHTML = `<iframe class="videoPlayerVidioPlayerHHC" src="${CONFIG.videoURL}" allowfullscreen frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
        } else if (CONFIG.videoType === 'direct') {
            playerHTML = `<video class="videoPlayerVidioPlayerHHC" src="${CONFIG.videoURL}" controls playsinline preload="metadata"></video>`;
        } else {
            playerHTML = '<div class="loadingVidioPlayerHHC">Error: Tipe video tidak didukung.</div>';
        }
        elements.playerWrapper.innerHTML = playerHTML;
    }

    function loadInfoTab() {
        if (!elements.infoTab) return;
        const escapeHTML = (str) => str ? String(str).replace(/[&<>"']/g, match => ({'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;'})[match]) : '';
        elements.infoTab.innerHTML = `
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Sinopsis</div>
                <div class="infoValueVidioPlayerHHC">${escapeHTML(CONFIG.infoSynopsis)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Penerjemah</div>
                <div class="infoValueVidioPlayerHHC">${escapeHTML(CONFIG.infoTranslator)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Status</div>
                <div class="infoValueVidioPlayerHHC">${escapeHTML(CONFIG.infoStatus)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Genre</div>
                <div class="infoValueVidioPlayerHHC">${escapeHTML(CONFIG.infoGenre)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Tahun</div>
                <div class="infoValueVidioPlayerHHC">${escapeHTML(CONFIG.infoYear)}</div>
            </div>
        `;
    }

    function loadCharacterTab() {
        if (!elements.charactersTab) return;
        if (!CONFIG.enableCharacterTab || !CONFIG.dataKarakter || CONFIG.dataKarakter.length === 0) {
            elements.charactersTab.innerHTML = '<div class="loadingVidioPlayerHHC">DATA TIDAK MUNCUL...</div>';
            return;
        }
        
        let charHTML = CONFIG.dataKarakter;
        if (Array.isArray(CONFIG.dataKarakter)) {
            charHTML = '<div class="characterGridVidioPlayerHHC">' + CONFIG.dataKarakter.map(char => `
                <div class="characterItemVidioPlayerHHC">
                    <img class="characterImageVidioPlayerHHC" src="${char.img}" alt="${char.name}">
                    <div class="characterInfoVidioPlayerHHC">
                        <div class="characterNameVidioPlayerHHC" title="${char.name}">${char.name}</div>
                        <div class="characterRoleVidioPlayerHHC" title="${char.role}">${char.role}</div>
                    </div>
                </div>
            `).join('') + '</div>';
        }
        elements.charactersTab.innerHTML = charHTML;
    }
    
    function loadReviewTab() {
        if (!elements.reviewsTab) return;
        elements.reviewsTab.innerHTML = CONFIG.enableReviewTab ? CONFIG.dataReview : '<div class="loadingVidioPlayerHHC">DATA TIDAK MUNCUL...</div>';
    }

    function attachEventListeners() {
        if (elements.tabNav) {
            elements.tabNav.addEventListener('click', function(e) {
                if (e.target.classList.contains('tabBtnVidioPlayerHHC') && !e.target.classList.contains('activeVidioPlayerHHC')) {
                    switchTab(e.target.dataset.tab);
                }
            });
        }
        
        if (elements.chapterBtn) elements.chapterBtn.addEventListener('click', toggleChapterSelector);
        if (elements.lightSwitchBtn) elements.lightSwitchBtn.addEventListener('click', turnOffLight);

        document.addEventListener('click', function(e) {
            if (state.isChapterSelectorOpen && elements.chapterBtn && !elements.chapterBtn.contains(e.target) && elements.chapterDropdown && !elements.chapterDropdown.contains(e.target)) {
                toggleChapterSelector();
            }
        });

        elements.container.addEventListener('contextmenu', event => event.preventDefault());

        if (elements.episodeSearch) elements.episodeSearch.addEventListener('input', () => { state.episodes.filter = elements.episodeSearch.value; renderEpisodeList(1); });
        if (elements.recommendationSearch) elements.recommendationSearch.addEventListener('input', () => { state.recommendations.filter = elements.recommendationSearch.value; renderRecommendationList(1); });
        
        if (elements.episodeSortButtons) elements.episodeSortButtons.addEventListener('click', (e) => {
            if(e.target.classList.contains('sortBtnVidioPlayerHHC') && !e.target.classList.contains('activeVidioPlayerHHC')) {
                elements.episodeSortButtons.querySelector('.activeVidioPlayerHHC').classList.remove('activeVidioPlayerHHC');
                e.target.classList.add('activeVidioPlayerHHC');
                state.episodes.sort = e.target.dataset.sort;
                renderEpisodeList(1);
            }
        });
        if (elements.recommendationSortButtons) elements.recommendationSortButtons.addEventListener('click', (e) => {
            if(e.target.classList.contains('sortBtnVidioPlayerHHC') && !e.target.classList.contains('activeVidioPlayerHHC')) {
                elements.recommendationSortButtons.querySelector('.activeVidioPlayerHHC').classList.remove('activeVidioPlayerHHC');
                e.target.classList.add('activeVidioPlayerHHC');
                state.recommendations.sort = e.target.dataset.sort;
                renderRecommendationList(1);
            }
        });
    }

    function switchTab(tabName) {
        elements.tabContents.querySelectorAll('.tabContentVidioPlayerHHC').forEach(content => {
            content.classList.remove('activeVidioPlayerHHC');
        });
        elements.tabNav.querySelectorAll('.tabBtnVidioPlayerHHC').forEach(btn => {
            btn.classList.remove('activeVidioPlayerHHC');
        });
        
        const newTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const newTabContent = document.getElementById(`${tabName}Tab`);
        if (newTabBtn) newTabBtn.classList.add('activeVidioPlayerHHC');
        if (newTabContent) newTabContent.classList.add('activeVidioPlayerHHC');
    }

    function toggleChapterSelector() {
        state.isChapterSelectorOpen = !state.isChapterSelectorOpen;
        elements.chapterDropdown.style.display = state.isChapterSelectorOpen ? 'block' : 'none';
    }

    function turnOffLight() {
        state.isLightOff = !state.isLightOff;
        elements.lightOverlay.style.display = state.isLightOff ? 'block' : 'none';
        elements.container.style.zIndex = state.isLightOff ? 13 : '';
    }

    async function fetchData(labels) {
        if (!Array.isArray(labels) || labels.length === 0) return [];
        let allPosts = [];
        const maxResults = 150;
        const baseUrl = CONFIG.websiteURL.replace(/\/$/, '');

        for (const label of labels) {
            if (typeof label !== 'string' || label.trim() === '') continue;
            try {
                const url = `${baseUrl}/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json&max-results=${maxResults}&cache_bust=${new Date().getTime()}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (data.feed && data.feed.entry) {
                    allPosts.push(...data.feed.entry);
                }
            } catch (error) {
                console.error(`Error fetching posts for label ${label}:`, error);
            }
        }
        const uniquePosts = Array.from(new Map(allPosts.map(post => [post.id.$t, post])).values());
        
        return uniquePosts.map(post => {
            const labels = (post.category || []).map(cat => cat.term);
            return {
                id: post.id.$t,
                title: post.title.$t,
                url: (post.link.find(link => link.rel === 'alternate') || {}).href || '#',
                thumb: (post.media$thumbnail || {}).url || 'https://placehold.co/300x169/e0e0e0/333?text=No+Image',
                date: new Date(post.published.$t),
                labels: labels
            };
        });
    }

    async function loadEpisodes() {
        if(!elements.episodeContent) return;
        elements.episodeContent.innerHTML = '<div class="loadingVidioPlayerHHC">Memuat episode...</div>';
        state.episodes.data = await fetchData(CONFIG.labelEpisode);
        renderEpisodeList(1);
    }

    async function loadRecommendations() {
        if(!elements.recommendationContent) return;
        elements.recommendationContent.innerHTML = '<div class="loadingVidioPlayerHHC">Memuat rekomendasi...</div>';
        state.recommendations.data = await fetchData(CONFIG.labelRekomendasi);
        renderRecommendationList(1);
    }

    async function loadAllEpisodesForChapter() {
        state.allSeriesEpisodes = await fetchData([CONFIG.labelSeriIni]);
        sortData(state.allSeriesEpisodes, 'number');
        populateChapterSelector();
        findCurrentEpisode();
    }
    
    function renderEpisodeList(page = 1) {
        state.episodes.page = page;
        let dataToRender = filterAndSortData(state.episodes.data, state.episodes.filter, state.episodes.sort);
        renderListLayout(dataToRender, elements.episodeContent, elements.episodePagination, state.episodes, 'episodes', renderEpisodeList);
    }
    
    function renderRecommendationList(page = 1) {
        state.recommendations.page = page;
        let dataToRender = filterAndSortData(state.recommendations.data, state.recommendations.filter, state.recommendations.sort);
        renderGridLayout(dataToRender, elements.recommendationContent, elements.recommendationPagination, state.recommendations, 'recommendations', renderRecommendationList);
    }

    function filterAndSortData(data, filter, sort) {
        let filteredData = data;
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredData = data.filter(post => post.title.toLowerCase().includes(searchTerm));
        }
        return sortData(filteredData, sort);
    }

    function sortData(data, method) {
        return [...data].sort((a, b) => {
            if (method === 'newest') return b.date - a.date;
            if (method === 'oldest') return a.date - b.date;
            if (method === 'number') {
                const numA = extractEpisodeNumber(a.title);
                const numB = extractEpisodeNumber(b.title);
                if (numA !== numB) return numA - numB;
                return b.date - a.date;
            }
            return 0;
        });
    }
    
    function extractEpisodeNumber(title) {
        const match = title.match(/(?:episode|ep\.?|chapter|ch\.?|vol\.?|part|pt\.?)\s*(\d+)/i);
        if (match && match[1]) return parseInt(match[1], 10);
        const endMatch = title.match(/(\d+)$/);
        if (endMatch && endMatch[1]) return parseInt(endMatch[1], 10);
        const firstMatch = title.match(/(\d+)/);
        if (firstMatch && firstMatch[1]) return parseInt(firstMatch[1], 10);
        return 0;
    }
    
    function getFormattedDate(dateObj) {
         return dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' WIB';
    }

    function renderListLayout(data, contentEl, paginationEl, stateObject, type, onPageChangeCallback) {
        if (!contentEl || !paginationEl) return;
        if (data.length === 0) {
            contentEl.innerHTML = `<div class="loadingVidioPlayerHHC">Tidak ada ${type} ditemukan.</div>`;
            paginationEl.innerHTML = '';
            return;
        }

        const perPage = CONFIG.episodesPerPage || 5;
        const totalPages = Math.ceil(data.length / perPage);
        stateObject.page = Math.min(Math.max(1, stateObject.page), totalPages);
        const start = (stateObject.page - 1) * perPage;
        const end = start + perPage;
        const paginatedPosts = data.slice(start, end);

        const container = document.createElement('div');
        container.className = 'listContainerVidioPlayerHHC';
        const sekarang = new Date();
        
        container.innerHTML = paginatedPosts.map(post => {
            const safeThumb = post.thumb.replace(/\/s\d+(-c)?\//, '/s300-c/');
            const dateString = getFormattedDate(post.date);
            
            let isScheduled = false;
            let onClickAction = `onclick="window.MORIKNUS_PLAYER.openLink('${post.url}')"`;
            let scheduledHTML = '';
            let scheduledClass = '';
            let dateLabel = `Rilis: ${dateString}`;

            if (post.labels.includes('Jadwal') || post.date > sekarang) {
                isScheduled = true;
                onClickAction = '';
                scheduledClass = 'is-scheduled';
                dateLabel = `Jadwal: ${dateString}`;
                scheduledHTML = `
                <div class="scheduledOverlayVidioPlayerHHC">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                        <path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586V7z"></path>
                    </svg>
                    <span>TERJADWAL</span>
                </div>`;
            }

            return `
            <div class="listItemVidioPlayerHHC ${scheduledClass}" ${onClickAction}>
                <div class="listItemThumb">
                    ${scheduledHTML}
                    <img src="${safeThumb}" alt="${post.title}" onerror="this.src='https://placehold.co/160x90/e0e0e0/333?text=Error'">
                </div>
                <div class="listItemContent">
                    <div class="listItemTitle">${post.title}</div>
                    <div class="listItemDate">${dateLabel}</div>
                </div>
            </div>`;
        }).join('');

        contentEl.innerHTML = '';
        contentEl.appendChild(container);
        renderPagination(totalPages, stateObject.page, paginationEl, onPageChangeCallback);
    }

    function renderGridLayout(data, contentEl, paginationEl, stateObject, type, onPageChangeCallback) {
        if (!contentEl || !paginationEl) return;
        if (data.length === 0) {
            contentEl.innerHTML = `<div class="loadingVidioPlayerHHC">Tidak ada ${type} ditemukan.</div>`;
            paginationEl.innerHTML = '';
            return;
        }

        const perPage = CONFIG.recommendationsPerPage || 6;
        const totalPages = Math.ceil(data.length / perPage);
        stateObject.page = Math.min(Math.max(1, stateObject.page), totalPages);
        const start = (stateObject.page - 1) * perPage;
        const end = start + perPage;
        const paginatedPosts = data.slice(start, end);

        const container = document.createElement('div');
        container.className = 'gridContainerVidioPlayerHHC';

        container.innerHTML = paginatedPosts.map(post => {
            const safeThumb = post.thumb.replace(/\/s\d+(-c)?\//, '/s300-c/');
            const dateString = post.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            
            return `
            <div class="gridItemVidioPlayerHHC" onclick="window.MORIKNUS_PLAYER.openLink('${post.url}')">
                <div class="gridImageWrapperVidioPlayerHHC">
                    <img class="gridImageVidioPlayerHHC" src="${safeThumb}" alt="${post.title}" onerror="this.src='https://placehold.co/300x169/e0e0e0/333?text=Error'">
                </div>
                <div class="gridContentVidioPlayerHHC">
                    <h3 class="gridTitleVidioPlayerHHC">${post.title}</h3>
                    <div class="gridDateVidioPlayerHHC">${dateString}</div>
                </div>
            </div>`;
        }).join('');

        contentEl.innerHTML = '';
        contentEl.appendChild(container);
        renderPagination(totalPages, stateObject.page, paginationEl, onPageChangeCallback);
    }
    
    PLAYER.openLink = function(url) {
        window.open(url, '_self');
    }

    function renderPagination(totalPages, currentPage, containerEl, onPageClickCallback) {
        if (totalPages <= 1) {
            containerEl.innerHTML = '';
            return;
        }
        
        let html = '';
        const callbackName = onPageClickCallback.name;
        const type = callbackName === 'renderEpisodeList' ? 'ep' : 'rec';
        const id = (page) => `moriknus_page_${type}_${page}`;

        html += `<button class="paginationBtnVidioPlayerHHC" id="${id(1)}" ${currentPage === 1 ? 'disabled' : ''}>&#8249;&#8249;</button>`;
        html += `<button class="paginationBtnVidioPlayerHHC" id="${id(currentPage - 1)}" ${currentPage === 1 ? 'disabled' : ''}>&#8249;</button>`;
        html += `<span class="paginationInfoVidioPlayerHHC">${currentPage} / ${totalPages}</span>`;
        html += `<button class="paginationBtnVidioPlayerHHC" id="${id(currentPage + 1)}" ${currentPage === totalPages ? 'disabled' : ''}>&#8250;</button>`;
        html += `<button class="paginationBtnVidioPlayerHHC" id="${id(totalPages)}" ${currentPage === totalPages ? 'disabled' : ''}>&#8250;&#8250;</button>`;

        containerEl.innerHTML = html;
        
        containerEl.querySelector(`#${id(1)}`).addEventListener('click', () => onPageClickCallback(1));
        containerEl.querySelector(`#${id(currentPage - 1)}`).addEventListener('click', () => onPageClickCallback(currentPage - 1));
        containerEl.querySelector(`#${id(currentPage + 1)}`).addEventListener('click', () => onPageClickCallback(currentPage + 1));
        containerEl.querySelector(`#${id(totalPages)}`).addEventListener('click', () => onPageClickCallback(totalPages));
    }

    function populateChapterSelector() {
        if (!elements.chapterDropdown) return;
        if (state.allSeriesEpisodes.length === 0) {
            elements.chapterDropdown.innerHTML = '<div class="loadingVidioPlayerHHC">Tidak ada chapter.</div>';
            return;
        }

        elements.chapterDropdown.innerHTML = state.allSeriesEpisodes.map(post => {
            const title = post.title;
            const formattedTitle = title.replace(/.*?(?:Vol\.?\s*\d+\s*)?((?:Ep\.?|Episode|Ch\.?|Chapter)\s*\d+).*/i, '$1');
            return `<div onclick="window.MORIKNUS_PLAYER.openLink('${post.url}')">${formattedTitle}</div>`;
        }).join('');
    }

    function findCurrentEpisode() {
        if (state.allSeriesEpisodes.length === 0) return;
        const currentPath = window.location.pathname;
        const currentIndex = state.allSeriesEpisodes.findIndex(post => {
            try { return new URL(post.url).pathname === currentPath; } 
            catch (e) { return false; }
        });

        if (currentIndex === -1) {
            console.warn('Episode saat ini tidak ditemukan dalam daftar seri.');
            return;
        }

        if (currentIndex > 0 && elements.prevBtn) {
            const prevUrl = state.allSeriesEpisodes[currentIndex - 1].url;
            elements.prevBtn.disabled = false;
            elements.prevBtn.onclick = () => PLAYER.openLink(prevUrl);
        }

        if (currentIndex < state.allSeriesEpisodes.length - 1 && elements.nextBtn) {
            const nextUrl = state.allSeriesEpisodes[currentIndex + 1].url;
            elements.nextBtn.disabled = false;
            elements.nextBtn.onclick = () => PLAYER.openLink(nextUrl);
        }
    }

})(); // Menutup IIFE
//]]>
</script>
