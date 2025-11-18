!function(){if(window.MORIKNUS_PLAYER)return;let e={};window.MORIKNUS_PLAYER=e;let i={},t={},a={isLightOff:!1,isChapterSelectorOpen:!1,allSeriesEpisodes:[],episodes:{data:[],page:1,sort:"number",filter:""},recommendations:{data:[],page:1,sort:"newest",filter:""},jadwalTimerInterval:null};function n(e){let i=document.querySelector(`[data-tab="${e}"]`),t=document.getElementById(`${e}Tab`);i&&(i.style.display="none"),t&&(t.style.display="none")}function r(){a.isChapterSelectorOpen=!a.isChapterSelectorOpen,t.chapterDropdown.style.display=a.isChapterSelectorOpen?"block":"none"}function o(){a.isLightOff=!a.isLightOff,t.lightOverlay.style.display=a.isLightOff?"block":"none",t.container.style.zIndex=a.isLightOff?13:""}async function d(e){if(!Array.isArray(e)||0===e.length)return[];let t=[],a=i.websiteURL.replace(/\/$/,"");for(let n of e)if("string"==typeof n&&""!==n.trim())try{let r=`${a}/feeds/posts/default/-/${encodeURIComponent(n)}?alt=json&max-results=150&cache_bust=${new Date().getTime()}`,o=await fetch(r);if(!o.ok)throw Error(`HTTP error! status: ${o.status}`);let d=await o.json();d.feed&&d.feed.entry&&t.push(...d.feed.entry)}catch(s){console.error(`Error fetching posts for label ${n}:`,s)}let l=Array.from(new Map(t.map(e=>[e.id.$t,e])).values());return l.map(e=>{let i=(e.category||[]).map(e=>e.term);return{id:e.id.$t,title:e.title.$t,url:(e.link.find(e=>"alternate"===e.rel)||{}).href||"#",thumb:(e.media$thumbnail||{}).url||"https://placehold.co/300x169/e0e0e0/333?text=No+Image",date:new Date(e.published.$t),labels:i}})}async function s(){t.episodeContent&&(t.episodeContent.innerHTML='<div class="loadingVidioPlayerHHC">Memuat episode...</div>',a.episodes.data=await d(i.labelEpisode),H(1))}async function l(){t.recommendationContent&&(t.recommendationContent.innerHTML='<div class="loadingVidioPlayerHHC">Memuat rekomendasi...</div>',a.recommendations.data=await d(i.labelRekomendasi),p(1))}async function c(){a.allSeriesEpisodes=await d([i.labelSeriIni]),u(a.allSeriesEpisodes,"number"),function e(){if(t.chapterDropdown){if(0===a.allSeriesEpisodes.length){t.chapterDropdown.innerHTML='<div class="loadingVidioPlayerHHC">Tidak ada chapter.</div>';return}t.chapterDropdown.innerHTML=a.allSeriesEpisodes.map(e=>{let i=e.title,t=i.replace(/.*?(?:Vol\.?\s*\d+\s*)?((?:Ep\.?|Episode|Ch\.?|Chapter)\s*\d+).*/i,"$1");return`<div onclick="window.MORIKNUS_PLAYER.openLink('${e.url}')">${t}</div>`}).join("")}}(),function i(){if(0===a.allSeriesEpisodes.length)return;let n=window.location.pathname,r=a.allSeriesEpisodes.findIndex(e=>{try{return new URL(e.url).pathname===n}catch(i){return!1}});if(-1===r){console.warn("Episode saat ini tidak ditemukan dalam daftar seri.");return}if(r>0&&t.prevBtn){let o=a.allSeriesEpisodes[r-1].url;t.prevBtn.disabled=!1,t.prevBtn.onclick=()=>e.openLink(o)}if(r<a.allSeriesEpisodes.length-1&&t.nextBtn){let d=a.allSeriesEpisodes[r+1].url;t.nextBtn.disabled=!1,t.nextBtn.onclick=()=>e.openLink(d)}}()}function H(e=1){a.episodes.page=e;!function e(t,a,n,r,o,d){if(!a||!n)return;if(0===t.length){a.innerHTML=`<div class="loadingVidioPlayerHHC">Tidak ada ${o} ditemukan.</div>`,n.innerHTML="";return}let s=i.episodesPerPage||5,l=Math.ceil(t.length/s);r.page=Math.min(Math.max(1,r.page),l);let c=(r.page-1)*s,H=t.slice(c,c+s),p=document.createElement("div");p.className="listContainerVidioPlayerHHC";let v=new Date;p.innerHTML=H.map(e=>{var i;let t=e.thumb.replace(/\/s\d+(-c)?\//,"/s300-c/"),a=(i=e.date).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})+" WIB",n=!1,r=`onclick="window.MORIKNUS_PLAYER.openLink('${e.url}')"`,o="",d="",s=`Rilis: ${a}`;return(e.labels.includes("Jadwal")||e.date>v)&&(n=!0,r="",d="is-scheduled",s=`Jadwal: ${a}`,o=`
                <div class="scheduledOverlayVidioPlayerHHC">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                        <path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586V7z"></path>
                    </svg>
                    <span>TERJADWAL</span>
                </div>`),`
            <div class="listItemVidioPlayerHHC ${d}" ${r}>
                <div class="listItemThumb">
                    ${o}
                    <img src="${t}" alt="${e.title}" onerror="this.src='https://placehold.co/160x90/e0e0e0/333?text=Error'">
                </div>
                <div class="listItemContent">
                    <div class="listItemTitle">${e.title}</div>
                    <div class="listItemDate">${s}</div>
                </div>
            </div>`}).join(""),a.innerHTML="",a.appendChild(p),m(l,r.page,n,d)}(v(a.episodes.data,a.episodes.filter,a.episodes.sort),t.episodeContent,t.episodePagination,a.episodes,"episodes",H)}function p(e=1){a.recommendations.page=e;!function e(t,a,n,r,o,d){if(!a||!n)return;if(0===t.length){a.innerHTML=`<div class="loadingVidioPlayerHHC">Tidak ada ${o} ditemukan.</div>`,n.innerHTML="";return}let s=i.recommendationsPerPage||6,l=Math.ceil(t.length/s);r.page=Math.min(Math.max(1,r.page),l);let c=(r.page-1)*s,H=t.slice(c,c+s),p=document.createElement("div");p.className="gridContainerVidioPlayerHHC",p.innerHTML=H.map(e=>{let i=e.thumb.replace(/\/s\d+(-c)?\//,"/s300-c/"),t=e.date.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});return`
            <div class="gridItemVidioPlayerHHC" onclick="window.MORIKNUS_PLAYER.openLink('${e.url}')">
                <div class="gridImageWrapperVidioPlayerHHC">
                    <img class="gridImageVidioPlayerHHC" src="${i}" alt="${e.title}" onerror="this.src='https://placehold.co/300x169/e0e0e0/333?text=Error'">
                </div>
                <div class="gridContentVidioPlayerHHC">
                    <h3 class="gridTitleVidioPlayerHHC">${e.title}</h3>
                    <div class="gridDateVidioPlayerHHC">${t}</div>
                </div>
            </div>`}).join(""),a.innerHTML="",a.appendChild(p),m(l,r.page,n,d)}(v(a.recommendations.data,a.recommendations.filter,a.recommendations.sort),t.recommendationContent,t.recommendationPagination,a.recommendations,"recommendations",p)}function v(e,i,t){let a=e;if(i){let n=i.toLowerCase();a=e.filter(e=>e.title.toLowerCase().includes(n))}return u(a,t)}function u(e,i){return[...e].sort((e,t)=>{if("newest"===i)return t.date-e.date;if("oldest"===i)return e.date-t.date;if("number"===i){let a=y(e.title),n=y(t.title);return a!==n?a-n:t.date-e.date}return 0})}function y(e){let i=e.match(/(?:episode|ep\.?|chapter|ch\.?|vol\.?|part|pt\.?)\s*(\d+)/i);if(i&&i[1])return parseInt(i[1],10);let t=e.match(/(\d+)$/);if(t&&t[1])return parseInt(t[1],10);let a=e.match(/(\d+)/);return a&&a[1]?parseInt(a[1],10):0}function m(e,i,t,a){if(e<=1){t.innerHTML="";return}let n="",r=a.name,o="renderEpisodeList"===r?"ep":"rec",d=e=>`moriknus_page_${o}_${e}`;n+=`<button class="paginationBtnVidioPlayerHHC" id="${d(1)}" ${1===i?"disabled":""}>&#8249;&#8249;</button>`,n+=`<button class="paginationBtnVidioPlayerHHC" id="${d(i-1)}" ${1===i?"disabled":""}>&#8249;</button>`,n+=`<span class="paginationInfoVidioPlayerHHC">${i} / ${e}</span>`,n+=`<button class="paginationBtnVidioPlayerHHC" id="${d(i+1)}" ${i===e?"disabled":""}>&#8250;</button>`,n+=`<button class="paginationBtnVidioPlayerHHC" id="${d(e)}" ${i===e?"disabled":""}>&#8250;&#8250;</button>`,t.innerHTML=n,t.querySelector(`#${d(1)}`).addEventListener("click",()=>a(1)),t.querySelector(`#${d(i-1)}`).addEventListener("click",()=>a(i-1)),t.querySelector(`#${d(i+1)}`).addEventListener("click",()=>a(i+1)),t.querySelector(`#${d(e)}`).addEventListener("click",()=>a(e))}e.init=function(e){if(!e){console.error("Konfigurasi postingan tidak diberikan ke init().");return}if(i=e,t.container=document.getElementById("videoContainerVidioPlayerHHC"),!t.container){console.error("Elemen player (videoContainerVidioPlayerHHC) tidak ditemukan.");return}if(!0===i.useJadwal&&i.jadwalRilis){let d=new Date(i.jadwalRilis),v=new Date;if(d>v){!function e(a){t.container.innerHTML="",i.enableDarkMode&&t.container.classList.add("drK");let n=a.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})+" WIB",r=`
            <div class="jadwalBlockVidioPlayerHHC">
                <h2>Episode Ini Belum Rilis</h2>
                <p>Akan Tayang Tanggal</p>
                <!-- Menampilkan tanggal statis, BUKAN countdown -->
                <div id="jadwalTanggalRilisHHC">${n}</div> 
                <p style="font-size: 14px; color: #888;">Silakan kembali lagi nanti.</p>
            </div>
        `;t.container.innerHTML=r}(d);return}}t.container.innerHTML=`
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
        `,function e(){let i=e=>document.querySelector(e);t={container:i("#videoContainerVidioPlayerHHC"),playerWrapper:i("#videoPlayerWrapper"),lightOverlay:document.getElementById("turnOffLightOverlayVidioPlayerHHC"),prevBtn:i("#prevBtn"),nextBtn:i("#nextBtn"),chapterBtn:i("#chapterSelectorBtn"),chapterDropdown:i("#chapterSelectorDropdown"),lightSwitchBtn:i("#lightSwitchBtn"),tabNav:i("#tabNavVidioPlayerHHC"),tabContents:i("#tabContentsVidioPlayerHHC"),infoTab:i("#infoTab"),episodesTab:i("#episodesTab"),episodeContent:i("#episodeContentVidioPlayerHHC"),episodePagination:i("#episodePaginationVidioPlayerHHC"),episodeSearch:i("#episodeSearchVidioPlayerHHC"),episodeSortButtons:i("#episodesTab .sortButtonsVidioPlayerHHC"),recommendationsTab:i("#recommendationsTab"),recommendationContent:i("#recommendationContentVidioPlayerHHC"),recommendationPagination:i("#recommendationPaginationVidioPlayerHHC"),recommendationSearch:i("#recommendationSearchVidioPlayerHHC"),recommendationSortButtons:i("#recommendationsTab .sortButtonsVidioPlayerHHC"),charactersTab:i("#charactersTab"),reviewsTab:i("#reviewsTab")}}(),i.enableDarkMode&&t.container.classList.add("drK"),!i.enableLightSwitch&&t.lightSwitchBtn&&(t.lightSwitchBtn.style.display="none"),i.enableEpisodeList||n("episodes"),i.enableRecommendationList||n("recommendations"),i.enableCharacterTab||n("characters"),i.enableReviewTab||n("reviews"),function e(){if(!t.playerWrapper)return;let a="";a="youtube"===i.videoType?`<iframe class="videoPlayerVidioPlayerHHC" src="${i.videoURL}" allowfullscreen frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`:"direct"===i.videoType?`<video class="videoPlayerVidioPlayerHHC" src="${i.videoURL}" controls playsinline preload="metadata"></video>`:'<div class="loadingVidioPlayerHHC">Error: Tipe video tidak didukung.</div>',t.playerWrapper.innerHTML=a}(),function e(){if(!t.infoTab)return;let a=e=>e?String(e).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]):"";t.infoTab.innerHTML=`
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Sinopsis</div>
                <div class="infoValueVidioPlayerHHC">${a(i.infoSynopsis)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Penerjemah</div>
                <div class="infoValueVidioPlayerHHC">${a(i.infoTranslator)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Status</div>
                <div class="infoValueVidioPlayerHHC">${a(i.infoStatus)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Genre</div>
                <div class="infoValueVidioPlayerHHC">${a(i.infoGenre)}</div>
            </div>
            <div class="infoItemVidioPlayerHHC">
                <div class="infoLabelVidioPlayerHHC">Tahun</div>
                <div class="infoValueVidioPlayerHHC">${a(i.infoYear)}</div>
            </div>
        `}(),function e(){if(!t.charactersTab)return;if(!i.enableCharacterTab||!i.dataKarakter||0===i.dataKarakter.length){t.charactersTab.innerHTML='<div class="loadingVidioPlayerHHC">DATA TIDAK MUNCUL...</div>';return}let a=i.dataKarakter;Array.isArray(i.dataKarakter)&&(a='<div class="characterGridVidioPlayerHHC">'+i.dataKarakter.map(e=>`
                <div class="characterItemVidioPlayerHHC">
                    <img class="characterImageVidioPlayerHHC" src="${e.img}" alt="${e.name}">
                    <div class="characterInfoVidioPlayerHHC">
                        <div class="characterNameVidioPlayerHHC" title="${e.name}">${e.name}</div>
                        <div class="characterRoleVidioPlayerHHC" title="${e.role}">${e.role}</div>
                    </div>
                </div>
            `).join("")+"</div>"),t.charactersTab.innerHTML=a}(),t.reviewsTab&&(t.reviewsTab.innerHTML=i.enableReviewTab?i.dataReview:'<div class="loadingVidioPlayerHHC">DATA TIDAK MUNCUL...</div>'),i.enableEpisodeList&&s(),i.enableRecommendationList&&l(),c(),t.tabNav&&t.tabNav.addEventListener("click",function(e){e.target.classList.contains("tabBtnVidioPlayerHHC")&&!e.target.classList.contains("activeVidioPlayerHHC")&&function e(i){t.tabContents.querySelectorAll(".tabContentVidioPlayerHHC").forEach(e=>{e.classList.remove("activeVidioPlayerHHC")}),t.tabNav.querySelectorAll(".tabBtnVidioPlayerHHC").forEach(e=>{e.classList.remove("activeVidioPlayerHHC")});let a=document.querySelector(`[data-tab="${i}"]`),n=document.getElementById(`${i}Tab`);a&&a.classList.add("activeVidioPlayerHHC"),n&&n.classList.add("activeVidioPlayerHHC")}(e.target.dataset.tab)}),t.chapterBtn&&t.chapterBtn.addEventListener("click",r),t.lightSwitchBtn&&t.lightSwitchBtn.addEventListener("click",o),document.addEventListener("click",function(e){a.isChapterSelectorOpen&&t.chapterBtn&&!t.chapterBtn.contains(e.target)&&t.chapterDropdown&&!t.chapterDropdown.contains(e.target)&&r()}),t.container.addEventListener("contextmenu",e=>e.preventDefault()),t.episodeSearch&&t.episodeSearch.addEventListener("input",()=>{a.episodes.filter=t.episodeSearch.value,H(1)}),t.recommendationSearch&&t.recommendationSearch.addEventListener("input",()=>{a.recommendations.filter=t.recommendationSearch.value,p(1)}),t.episodeSortButtons&&t.episodeSortButtons.addEventListener("click",e=>{e.target.classList.contains("sortBtnVidioPlayerHHC")&&!e.target.classList.contains("activeVidioPlayerHHC")&&(t.episodeSortButtons.querySelector(".activeVidioPlayerHHC").classList.remove("activeVidioPlayerHHC"),e.target.classList.add("activeVidioPlayerHHC"),a.episodes.sort=e.target.dataset.sort,H(1))}),t.recommendationSortButtons&&t.recommendationSortButtons.addEventListener("click",e=>{e.target.classList.contains("sortBtnVidioPlayerHHC")&&!e.target.classList.contains("activeVidioPlayerHHC")&&(t.recommendationSortButtons.querySelector(".activeVidioPlayerHHC").classList.remove("activeVidioPlayerHHC"),e.target.classList.add("activeVidioPlayerHHC"),a.recommendations.sort=e.target.dataset.sort,p(1))})},e.openLink=function(e){window.open(e,"_self")}}();
