/* In-App Government Portal Viewer Overlay Component (Rural-Friendly Present Tab Navigation) */
(function(window, document) {
    'use strict';

    let _isPortalFrameOpen = false;
    let _watchdogTimer = null;

    function getActiveLanguage() {
        if (typeof window.getLang === 'function') return window.getLang();
        return document.documentElement.lang || 'te';
    }

    function openInAppPortal(url, titleStr) {
        if (!url || !url.startsWith('http')) return;

        _isPortalFrameOpen = true;
        window._isPortalFrameOpen = true;

        const isEn = getActiveLanguage() === 'en';
        const currentQuery = document.getElementById('searchInput')?.value || '';
        const currentScheme = window.currentSchemeName || null;
        const currentFilter = window.activeFilter || 'all';
        const currentScroll = window.scrollY || 0;

        const saveState = {
            schemeName: currentScheme,
            activeFilter: currentFilter,
            searchQuery: currentQuery,
            scrollY: currentScroll,
            inPortalFrame: true,
            timestamp: Date.now()
        };

        try {
            sessionStorage.setItem('smartgov_visit_website_state', JSON.stringify(saveState));
            const isValidScheme = currentScheme && currentScheme !== 'undefined';
            const targetHash = isValidScheme ? ('#scheme=' + encodeURIComponent(currentScheme)) : (window.location.hash && !window.location.hash.includes('undefined') ? window.location.hash : '');
            history.pushState(saveState, '', targetHash || window.location.pathname);
        } catch (e) {}

        let overlay = document.getElementById('inAppPortalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'inAppPortalOverlay';
            document.body.appendChild(overlay);
        }

        let hostname = url;
        try {
            const u = new URL(url);
            hostname = u.hostname.replace(/^www\./, '');
        } catch (e) {}

        const returnText = isEn ? '⬅️ Back to Scheme' : '⬅️ వెనక్కి (SmartGovAI)';
        const reloadText = isEn ? '🔄 Reload' : '🔄 రీలోడ్';
        const directText = isEn ? '🌐 Open Full Site' : '🌐 పూర్తి సైట్';
        const loadingMsg = isEn ? 'Connecting to Official Government Portal in present tab...' : 'అధికారిక ప్రభుత్వ పోర్టల్ ప్రస్తుత ట్యాబ్‌లో లోడ్ అవుతోంది...';
        const fallbackNotice = isEn 
            ? 'If the official government site restricts in-page display due to security policies, click to enter directly:' 
            : 'భద్రతా నిబంధనల వల్ల ప్రభుత్వ సైట్ ఇక్కడ రాకపోతే, నేరుగా తెరవడానికి ఇక్కడ నొక్కండి:';
        const enterDirectText = isEn ? 'Open Official Portal Directly ↗️' : 'అధికారిక పోర్టల్‌ను నేరుగా తెరవండి ↗️';

        const safeTitle = titleStr || (currentScheme || 'Government Portal');
        const proxyUrl = `/api/proxy-portal?url=${encodeURIComponent(url)}&lang=${isEn ? 'en' : 'te'}`;

        overlay.innerHTML = `
            <div class="portal-overlay-header">
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:nowrap; overflow:hidden;">
                    <button type="button" class="portal-return-btn" id="portalBackBtn" aria-label="${returnText}">
                        ${returnText}
                    </button>
                    <div class="portal-overlay-title" title="${window.escapeHtml ? window.escapeHtml(safeTitle) : safeTitle}">
                        🏛️ <span>${window.escapeHtml ? window.escapeHtml(safeTitle) : safeTitle}</span>
                        <span style="font-size:0.8rem; font-family:monospace; opacity:0.85; margin-left:6px;">🔒 ${hostname}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button type="button" class="portal-ctrl-btn" id="portalReloadBtn" title="${reloadText}">
                        ${reloadText}
                    </button>
                    <a href="${window.escapeHtml ? window.escapeHtml(url) : url}" target="_top" class="portal-ctrl-btn" id="portalDirectBtn" title="${directText}" style="text-decoration:none;">
                        ${directText}
                    </a>
                </div>
            </div>

            <div class="portal-overlay-body" style="position:relative; flex:1; width:100%; height:calc(100% - 56px); background:#f8fafc;">
                <div id="portalLoader" class="portal-overlay-loader" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8fafc; z-index:2; gap:12px; transition:opacity 0.3s ease;">
                    <div class="spinner" style="width:42px; height:42px; border:4px solid #cbd5e1; border-top-color:#0d5c4d; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                    <div style="font-size:0.95rem; font-weight:700; color:#0d5c4d;">${loadingMsg}</div>
                    <div style="font-size:0.82rem; color:#64748b;">${hostname}</div>
                </div>

                <div id="portalFallbackBanner" style="display:none; position:absolute; top:0; left:0; right:0; background:#fffbeb; border-bottom:1.5px solid #fef3c7; padding:8px 16px; z-index:3; align-items:center; justify-content:space-between; font-size:0.85rem; color:#92400e; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <span>⚠️ ${fallbackNotice}</span>
                    <a href="${window.escapeHtml ? window.escapeHtml(url) : url}" target="_top" style="color:#b45309; font-weight:700; text-decoration:underline; margin-left:12px;">
                        ${enterDirectText}
                    </a>
                </div>

                <iframe id="portalOverlayFrame" class="portal-overlay-frame" src="${proxyUrl}" title="Official Government Portal" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" style="width:100%; height:100%; border:none; background:#ffffff;"></iframe>
            </div>
        `;

        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const iframe = document.getElementById('portalOverlayFrame');
        const loader = document.getElementById('portalLoader');
        const banner = document.getElementById('portalFallbackBanner');

        // Back button click
        const backBtn = document.getElementById('portalBackBtn');
        if (backBtn) {
            backBtn.onclick = function() {
                window.closeInAppPortal();
            };
        }

        // Reload button click
        const reloadBtn = document.getElementById('portalReloadBtn');
        if (reloadBtn) {
            reloadBtn.onclick = function() {
                if (loader) {
                    loader.style.display = 'flex';
                    loader.style.opacity = '1';
                }
                if (iframe) {
                    iframe.src = proxyUrl + '&_r=' + Date.now();
                }
            };
        }

        // Direct button save state before leaving
        const directBtn = document.getElementById('portalDirectBtn');
        if (directBtn) {
            directBtn.onclick = function() {
                try {
                    sessionStorage.setItem('smartgov_visit_website_state', JSON.stringify(saveState));
                } catch (e) {}
            };
        }

        // When iframe loads
        if (iframe) {
            iframe.onload = function() {
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        if (loader) loader.style.display = 'none';
                    }, 300);
                }
            };
        }

        // Watchdog timer: If iframe is blocked by X-Frame-Options or takes > 6 seconds
        if (_watchdogTimer) clearTimeout(_watchdogTimer);
        _watchdogTimer = setTimeout(function() {
            if (_isPortalFrameOpen && banner) {
                banner.style.display = 'flex';
            }
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    if (loader) loader.style.display = 'none';
                }, 300);
            }
        }, 6000);
    }

    function hidePortalOverlayAndRestore(specificState) {
        if (_watchdogTimer) {
            clearTimeout(_watchdogTimer);
            _watchdogTimer = null;
        }

        const overlay = document.getElementById('inAppPortalOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
        document.body.style.overflow = '';

        let targetState = specificState;
        if (!targetState) {
            try {
                const saved = sessionStorage.getItem('smartgov_visit_website_state');
                if (saved) targetState = JSON.parse(saved);
            } catch (e) {}
        }

        if (targetState && typeof window.restoreStateFromNavigation === 'function') {
            window.restoreStateFromNavigation(targetState);
        } else if (window.currentSchemeName && window.schemesCatalog && window.schemesCatalog[window.currentSchemeName]) {
            if (typeof window.displayResult === 'function') {
                window.displayResult(window.schemesCatalog[window.currentSchemeName], true);
            }
        }
    }

    function closeInAppPortal() {
        if (!_isPortalFrameOpen) return;
        _isPortalFrameOpen = false;
        window._isPortalFrameOpen = false;

        // If history has the inPortalFrame state, go back which triggers popstate
        if (window.history.state && window.history.state.inPortalFrame) {
            window.history.back();
        } else {
            hidePortalOverlayAndRestore();
        }
    }

    // Handle browser back button (popstate)
    window.addEventListener('popstate', function(e) {
        if (_isPortalFrameOpen) {
            _isPortalFrameOpen = false;
            window._isPortalFrameOpen = false;
            hidePortalOverlayAndRestore(e.state);
        }
    });

    // Listen for close message from inside iframe (e.g. fallback page)
    window.addEventListener('message', function(e) {
        if (e.data === 'SMARTGOV_CLOSE_PORTAL' || (e.data && e.data.type === 'SMARTGOV_CLOSE_PORTAL')) {
            closeInAppPortal();
        }
    });

    window.openInAppPortal = openInAppPortal;
    window.closeInAppPortal = closeInAppPortal;
    window.hidePortalOverlayAndRestore = hidePortalOverlayAndRestore;

})(window, document);
