/* Offline Network Status Banner & Automatic Background Synchronization */
(function(window, document) {
    'use strict';

    function updateNetworkBanner() {
        const banner = document.getElementById('offlineStatusBanner');
        const bannerText = document.getElementById('offlineBannerText');
        if (!banner || !bannerText) return;

        const isEn = (window.getLang ? window.getLang() : 'te') === 'en';

        if (!navigator.onLine) {
            banner.className = 'offline-status-banner';
            bannerText.innerHTML = isEn 
                ? '<strong>You are currently offline.</strong> Displaying cached health scheme data from Service Worker local memory.' 
                : '<strong>మీరు ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నారు.</strong> స్థానికంగా భద్రపరిచిన పథకాల సమాచారాన్ని చూపిస్తున్నాం.';
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }

    async function forceSyncOfflineCache() {
        const banner = document.getElementById('offlineStatusBanner');
        const bannerText = document.getElementById('offlineBannerText');
        const refreshBtn = document.getElementById('offlineRefreshBtn');
        const isEn = (window.getLang ? window.getLang() : 'te') === 'en';

        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = `⏳ ${isEn ? 'Syncing...' : 'సింక్ అవుతోంది...'}`;
        }

        try {
            // Force fetch latest scheme dataset from server and sync with Firestore local cache
            const resp = await fetch('/offline-cache?force_sync=' + Date.now(), { cache: 'no-store' });
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.schemes_list) {
                    if (window.SmartGovEnhanced) {
                        window.SmartGovEnhanced.saveOfflineData(data);
                    }
                    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({ type: 'CACHE_ALL_AUDIO' });
                    }
                }
                if (banner && bannerText) {
                    banner.className = 'offline-status-banner online-restored';
                    bannerText.innerHTML = isEn
                        ? '✅ <strong>Local cache synced with Firestore successfully!</strong> Fresh data loaded.'
                        : '✅ <strong>సరికొత్త డేటాతో కాష్ సింక్ అయింది!</strong> నవీకరించిన సమాచారం లోడ్ అయింది.';
                }
                setTimeout(() => {
                    if (banner) banner.style.display = 'none';
                }, 3500);
            } else {
                throw new Error('Sync failed');
            }
        } catch (err) {
            if (bannerText) {
                bannerText.innerHTML = isEn
                    ? '⚠️ <strong>Unable to sync with Firestore.</strong> Please check your internet connection and try again.'
                    : '⚠️ <strong>సింక్ చేయడం వీలుకాలేదు.</strong> దయచేసి మీ ఇంటర్నెట్ కనెక్షన్ సరిచూసుకుని మళ్లీ ప్రయత్నించండి.';
            }
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = `🔄 ${isEn ? 'Sync Now' : 'రీఫ్రెష్ & సింక్'}`;
            }
        }
    }

    async function checkNetworkAndSync() {
        if (navigator.onLine) {
            await forceSyncOfflineCache();
        } else {
            updateNetworkBanner();
        }
    }

    window.updateNetworkBanner = updateNetworkBanner;
    window.forceSyncOfflineCache = forceSyncOfflineCache;
    window.checkNetworkAndSync = checkNetworkAndSync;

    window.addEventListener('online', checkNetworkAndSync);
    window.addEventListener('offline', updateNetworkBanner);

    window.addEventListener('load', () => {
        updateNetworkBanner();
    });
})(window, document);
