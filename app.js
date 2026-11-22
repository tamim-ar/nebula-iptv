/**
 * Nebula IPTV - Fast, Ultra-Lightweight, Dark-Themed Live TV Streaming Web Application
 * Web version of the Nebula IPTV Android app
 * Developer: Tamim Ahasan Rijon (https://github.com/tamim-ar)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Supported Regions Definition (38 Regions)
  // Bangladesh pinned at top, followed by 37 regions sorted alphabetically A-Z
  // ---------------------------------------------------------------------------
  const SUPPORTED_REGIONS = [
    { id: 'bd', name: 'Bangladesh', flag: '🇧🇩', liveTv: 'Bangladesh', iptvOrg: 'countries/bd.m3u' },
    { id: 'ara', name: 'Arabic', flag: '🇸🇦', liveTv: 'Arabic', iptvOrg: 'languages/ara.m3u' },
    { id: 'ar', name: 'Argentina', flag: '🇦🇷', liveTv: null, iptvOrg: 'countries/ar.m3u' },
    { id: 'au', name: 'Australia', flag: '🇦🇺', liveTv: null, iptvOrg: 'countries/au.m3u' },
    { id: 'bh', name: 'Bahrain', flag: '🇧🇭', liveTv: 'Bahrain', iptvOrg: 'countries/bh.m3u' },
    { id: 'br', name: 'Brazil', flag: '🇧🇷', liveTv: 'Brazil', iptvOrg: 'countries/br.m3u' },
    { id: 'ca', name: 'Canada', flag: '🇨🇦', liveTv: 'Canada', iptvOrg: 'countries/ca.m3u' },
    { id: 'cn', name: 'China', flag: '🇨🇳', liveTv: 'China', iptvOrg: 'countries/cn.m3u' },
    { id: 'coll', name: 'Collection', flag: '📁', liveTv: 'Collection', iptvOrg: null },
    { id: 'eg', name: 'Egypt', flag: '🇪🇬', liveTv: 'Egypt', iptvOrg: 'countries/eg.m3u' },
    { id: 'fr', name: 'France', flag: '🇫🇷', liveTv: 'France', iptvOrg: 'countries/fr.m3u' },
    { id: 'de', name: 'Germany', flag: '🇩🇪', liveTv: null, iptvOrg: 'countries/de.m3u' },
    { id: 'in', name: 'India', flag: '🇮🇳', liveTv: 'India', iptvOrg: 'countries/in.m3u' },
    { id: 'id', name: 'Indonesia', flag: '🇮🇩', liveTv: 'Indonesia', iptvOrg: 'countries/id.m3u' },
    { id: 'il', name: 'Israel', flag: '🇮🇱', liveTv: 'Israel', iptvOrg: 'countries/il.m3u' },
    { id: 'it', name: 'Italy', flag: '🇮🇹', liveTv: 'Italy', iptvOrg: 'countries/it.m3u' },
    { id: 'jp', name: 'Japan', flag: '🇯🇵', liveTv: null, iptvOrg: 'countries/jp.m3u' },
    { id: 'my', name: 'Malaysia', flag: '🇲🇾', liveTv: 'Malaysia', iptvOrg: 'countries/my.m3u' },
    { id: 'mx', name: 'Mexico', flag: '🇲🇽', liveTv: 'Mexico', iptvOrg: 'countries/mx.m3u' },
    { id: 'mix', name: 'Mixed', flag: '🔀', liveTv: 'Mixed', iptvOrg: null },
    { id: 'np', name: 'Nepal', flag: '🇳🇵', liveTv: 'Nepal', iptvOrg: 'countries/np.m3u' },
    { id: 'pk', name: 'Pakistan', flag: '🇵🇰', liveTv: 'Pakistan', iptvOrg: 'countries/pk.m3u' },
    { id: 'pe', name: 'Peru', flag: '🇵🇪', liveTv: 'Peru', iptvOrg: 'countries/pe.m3u' },
    { id: 'pt', name: 'Portugal', flag: '🇵🇹', liveTv: 'Portugal', iptvOrg: 'countries/pt.m3u' },
    { id: 'qa', name: 'Qatar', flag: '🇶🇦', liveTv: null, iptvOrg: 'countries/qa.m3u' },
    { id: 'ru', name: 'Russia', flag: '🇷🇺', liveTv: 'Russia', iptvOrg: 'countries/ru.m3u' },
    { id: 'sa', name: 'Saudi Arabia', flag: '🇸🇦', liveTv: null, iptvOrg: 'countries/sa.m3u' },
    { id: 'kr', name: 'South Korea', flag: '🇰🇷', liveTv: null, iptvOrg: 'countries/kr.m3u' },
    { id: 'es', name: 'Spain', flag: '🇪🇸', liveTv: 'Spain', iptvOrg: 'countries/es.m3u' },
    { id: 'spe', name: 'Special Excess', flag: '⭐', liveTv: 'SpecialExcess', iptvOrg: null },
    { id: 'th', name: 'Thailand', flag: '🇹🇭', liveTv: 'Thailand', iptvOrg: 'countries/th.m3u' },
    { id: 'tr', name: 'Turkey', flag: '🇹🇷', liveTv: 'Turkey', iptvOrg: 'countries/tr.m3u' },
    { id: 'ae', name: 'UAE', flag: '🇦🇪', liveTv: null, iptvOrg: 'countries/ae.m3u' },
    { id: 'uk', name: 'UK', flag: '🇬🇧', liveTv: 'UK', iptvOrg: 'countries/uk.m3u' },
    { id: 'us', name: 'USA', flag: '🇺🇸', liveTv: 'USA', iptvOrg: 'countries/us.m3u' },
    { id: 've', name: 'Venezuela', flag: '🇻🇪', liveTv: 'Venezuela', iptvOrg: 'countries/ve.m3u' },
    { id: 'vn', name: 'Vietnam', flag: '🇻🇳', liveTv: 'Vietnam', iptvOrg: 'countries/vn.m3u' },
    { id: 'world', name: 'Worldwide', flag: '🌐', liveTv: 'Worldwide', iptvOrg: 'index.m3u' }
  ];

  // Preferred category order for display
  const PREFERRED_CATEGORIES = [
    'General', 'News', 'Sports', 'Entertainment', 'Movies', 'Music',
    'Kids', 'Animation', 'Documentary', 'Religious', 'Business', 'Culture', 'Live Events'
  ];

  // Storage Keys
  const STORAGE_KEYS = {
    COUNTRY: 'nebula_country',
    FAVORITES: 'nebula_favorites',
    SOURCES: 'nebula_sources',
    CUSTOM_SOURCES: 'nebula_custom_sources'
  };

  // Vibrant Gradient Palettes for Monogram Fallback Badges
  const MONOGRAM_GRADIENTS = [
    'linear-gradient(135deg, #7C4DFF 0%, #448AFF 100%)',
    'linear-gradient(135deg, #9D75FF 0%, #E040FB 100%)',
    'linear-gradient(135deg, #FF3358 0%, #FF6E40 100%)',
    'linear-gradient(135deg, #00C853 0%, #64DD17 100%)',
    'linear-gradient(135deg, #00B0FF 0%, #00E5FF 100%)',
    'linear-gradient(135deg, #651FFF 0%, #3D5AFE 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #FF5722 100%)',
    'linear-gradient(135deg, #00BFA5 0%, #1DE9B6 100%)'
  ];

  // ---------------------------------------------------------------------------
  // 2. Application State
  // ---------------------------------------------------------------------------
  const state = {
    activeTab: 'all', // 'all' | 'favorites' | 'settings'
    selectedCountry: loadSelectedCountry(),
    enabledSources: loadEnabledSources(),
    customSources: loadCustomSources(),
    favorites: loadFavorites(), // Array of full channel objects
    channels: [], // Loaded channels for active country
    currentCategory: 'All',
    searchQuery: '',
    favSearchQuery: '',
    selectedChannel: null,
    isPlaying: false,
    isMuted: false,
    channelMemoryCache: new Map(), // countryName -> channels[]
    hls: null,
    idleTimer: null,
    currentChannelIndex: -1,
    activeFetchToken: 0
  };

  // ---------------------------------------------------------------------------
  // 3. DOM Elements
  // ---------------------------------------------------------------------------
  const elements = {
    // Nav items
    railItems: document.querySelectorAll('.rail-item'),
    mobileNavBtns: document.querySelectorAll('.mobile-nav-btn'),
    railFavCount: document.getElementById('railFavCount'),
    mobileFavCount: document.getElementById('mobileFavCount'),

    // Views
    viewAll: document.getElementById('viewAll'),
    viewFavorites: document.getElementById('viewFavorites'),
    viewSettings: document.getElementById('viewSettings'),

    // Video Player
    playerShell: document.getElementById('playerShell'),
    player: document.getElementById('player'),
    prevBtn: document.getElementById('prevBtn'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    nextBtn: document.getElementById('nextBtn'),
    playerSpinner: document.getElementById('playerSpinner'),
    playerError: document.getElementById('playerError'),
    playerErrorText: document.getElementById('playerErrorText'),
    playerRetryBtn: document.getElementById('playerRetryBtn'),
    bottomBar: document.getElementById('bottomBar'),
    playerChannelTitle: document.getElementById('playerChannelTitle'),
    muteBtn: document.getElementById('muteBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),

    // All Tab Controls
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    countryPickerBtn: document.getElementById('countryPickerBtn'),
    countryFlagEmoji: document.getElementById('countryFlagEmoji'),
    countryLabel: document.getElementById('countryLabel'),
    categoryPickerBtn: document.getElementById('categoryPickerBtn'),
    categoryLabel: document.getElementById('categoryLabel'),
    categoryMenu: document.getElementById('categoryMenu'),
    refreshFeedsBtn: document.getElementById('refreshFeedsBtn'),
    allChannelsCount: document.getElementById('allChannelsCount'),
    allChannelsList: document.getElementById('allChannelsList'),
    allEmptyState: document.getElementById('allEmptyState'),
    allEmptyTitle: document.getElementById('allEmptyTitle'),
    allEmptyDesc: document.getElementById('allEmptyDesc'),
    allEmptyActionBtn: document.getElementById('allEmptyActionBtn'),

    // Favorites Tab
    favSearchInput: document.getElementById('favSearchInput'),
    clearFavSearchBtn: document.getElementById('clearFavSearchBtn'),
    favChannelsCount: document.getElementById('favChannelsCount'),
    favChannelsList: document.getElementById('favChannelsList'),
    favEmptyState: document.getElementById('favEmptyState'),
    browseAllBtn: document.getElementById('browseAllBtn'),

    // Settings Tab
    sourceMergeStatusBadge: document.getElementById('sourceMergeStatusBadge'),
    sourceMergeStatusText: document.getElementById('sourceMergeStatusText'),
    toggleIptvOrg: document.getElementById('toggleIptvOrg'),
    toggleLiveTvCollector: document.getElementById('toggleLiveTvCollector'),
    addSourceBtn: document.getElementById('addSourceBtn'),
    customSourcesList: document.getElementById('customSourcesList'),
    noCustomSourcesNotice: document.getElementById('noCustomSourcesNotice'),

    // Country Modal
    countryModal: document.getElementById('countryModal'),
    closeCountryModalBtn: document.getElementById('closeCountryModalBtn'),
    countrySearchInput: document.getElementById('countrySearchInput'),
    pinnedCountrySection: document.getElementById('pinnedCountrySection'),
    pinnedCountryList: document.getElementById('pinnedCountryList'),
    alphaCountryList: document.getElementById('alphaCountryList'),
    noCountriesFound: document.getElementById('noCountriesFound'),
    countryModalSubtitle: document.getElementById('countryModalSubtitle'),

    // Add Custom Source Modal
    addSourceModal: document.getElementById('addSourceModal'),
    closeAddSourceModalBtn: document.getElementById('closeAddSourceModalBtn'),
    cancelAddSourceBtn: document.getElementById('cancelAddSourceBtn'),
    addSourceForm: document.getElementById('addSourceForm'),
    customSourceName: document.getElementById('customSourceName'),
    customSourceUrl: document.getElementById('customSourceUrl'),
    customSourceScope: document.getElementById('customSourceScope'),
    addSourceError: document.getElementById('addSourceError')
  };

  // ---------------------------------------------------------------------------
  // 4. Persistence Helpers (localStorage)
  // ---------------------------------------------------------------------------
  function loadSelectedCountry() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUNTRY);
      if (saved && SUPPORTED_REGIONS.some((r) => r.name === saved)) {
        return saved;
      }
    } catch {}
    return 'Bangladesh';
  }

  function saveSelectedCountry(countryName) {
    try {
      localStorage.setItem(STORAGE_KEYS.COUNTRY, countryName);
    } catch {}
  }

  function loadEnabledSources() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SOURCES) || '{}');
      return {
        iptvOrg: typeof saved.iptvOrg === 'boolean' ? saved.iptvOrg : true,
        liveTvCollector: typeof saved.liveTvCollector === 'boolean' ? saved.liveTvCollector : true
      };
    } catch {
      return { iptvOrg: true, liveTvCollector: true };
    }
  }

  function saveEnabledSources() {
    try {
      localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(state.enabledSources));
    } catch {}
  }

  function loadCustomSources() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_SOURCES) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveCustomSources() {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_SOURCES, JSON.stringify(state.customSources));
    } catch {}
  }

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // 5. Utility Functions & Normalization
  // ---------------------------------------------------------------------------
  function normalizeUrl(url) {
    if (!url) return '';
    let trimmed = url.trim();
    try {
      const parsed = new URL(trimmed);
      // GitHub blob to raw normalization
      if ((parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') && parsed.pathname.includes('/blob/')) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts[2] === 'blob') {
          return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`;
        }
      }
      return parsed.href;
    } catch {
      return trimmed;
    }
  }

  function getCleanStreamKey(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname}`.toLowerCase();
    } catch {
      return url.trim().toLowerCase();
    }
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getInitials(name) {
    if (!name) return 'TV';
    const words = name.replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return (words[0] || 'TV').substring(0, 2).toUpperCase();
  }

  function getGradientForName(name) {
    let hash = 0;
    const str = name || 'Nebula';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % MONOGRAM_GRADIENTS.length;
    return MONOGRAM_GRADIENTS[idx];
  }

  /**
   * Normalizes category names:
   * Semicolon-separated categories like "News;General" -> "News"
   * Empty or "Undefined" -> "General"
   * Standardizes shared category names
   */
  function normalizeCategory(rawGroup) {
    if (!rawGroup || typeof rawGroup !== 'string') return 'General';
    let group = rawGroup.trim();
    if (!group || group.toLowerCase() === 'undefined' || group.toLowerCase() === 'unknown') {
      return 'General';
    }

    // Split multi-category e.g. "News;General" or "Animation;Kids"
    const segments = group.split(';').map((s) => s.trim()).filter(Boolean);
    if (segments.length === 0) return 'General';

    // Search through segments to match standard categories
    for (const seg of segments) {
      const lower = seg.toLowerCase();
      if (lower.includes('news')) return 'News';
      if (lower.includes('sport')) return 'Sports';
      if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film')) return 'Movies';
      if (lower.includes('music')) return 'Music';
      if (lower.includes('kid') || lower.includes('cartoon') || lower.includes('animat')) return 'Kids';
      if (lower.includes('documentary') || lower.includes('doc') || lower.includes('history')) return 'Documentary';
      if (lower.includes('entertain') || lower.includes('drama') || lower.includes('series') || lower.includes('comedy')) return 'Entertainment';
      if (lower.includes('religio') || lower.includes('islam') || lower.includes('quran') || lower.includes('christian')) return 'Religious';
      if (lower.includes('business') || lower.includes('finance') || lower.includes('econom')) return 'Business';
      if (lower.includes('culture') || lower.includes('education') || lower.includes('science')) return 'Culture';
      if (lower.includes('event')) return 'Live Events';
      if (lower.includes('weather')) return 'Weather';
      if (lower.includes('family')) return 'Family';
      if (lower.includes('lifestyle') || lower.includes('travel')) return 'Lifestyle';
    }

    // Default to clean title-cased first segment
    const first = segments[0];
    if (first.toLowerCase() === 'undefined' || first.toLowerCase() === 'general') return 'General';
    return first.charAt(0).toUpperCase() + first.slice(1);
  }

  // ---------------------------------------------------------------------------
  // 6. Unified Feed Parsers
  // ---------------------------------------------------------------------------

  /**
   * Parses LiveTVCollector JSON feed format
   */
  function parseLiveTvCollectorJson(text, countryName) {
    try {
      const data = JSON.parse(text);
      const channels = [];

      // Format: { channels: { "GroupName": [ { name, logo, group, url } ] } }
      if (data && typeof data === 'object') {
        const rootChannels = data.channels || data;

        if (Array.isArray(rootChannels)) {
          for (const item of rootChannels) {
            if (item && item.name && item.url) {
              channels.push({
                name: String(item.name).trim(),
                url: normalizeUrl(item.url),
                logo: item.logo ? String(item.logo).trim() : null,
                group: normalizeCategory(item.group || 'General'),
                country: countryName,
                source: 'LiveTVCollector'
              });
            }
          }
        } else if (typeof rootChannels === 'object') {
          for (const [groupKey, list] of Object.entries(rootChannels)) {
            if (Array.isArray(list)) {
              for (const item of list) {
                if (item && item.name && item.url) {
                  channels.push({
                    name: String(item.name).trim(),
                    url: normalizeUrl(item.url),
                    logo: item.logo ? String(item.logo).trim() : null,
                    group: normalizeCategory(item.group || groupKey || 'General'),
                    country: countryName,
                    source: 'LiveTVCollector'
                  });
                }
              }
            }
          }
        }
      }
      return channels;
    } catch {
      return [];
    }
  }

  /**
   * Unified M3U/M3U8 Parser
   * Skips #EXTVLCOPT lines, extracts tvg-logo, group-title, and channel name
   */
  function parseM3uPlaylist(text, countryName, sourceName = 'iptv-org') {
    const lines = text.split(/\r?\n/);
    const channels = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip VLC option lines
      if (line.startsWith('#EXTVLCOPT:')) continue;

      if (line.startsWith('#EXTINF:')) {
        const info = line.substring(line.indexOf(':') + 1);
        const commaIdx = info.lastIndexOf(',');
        const attrs = commaIdx >= 0 ? info.substring(0, commaIdx) : info;
        const name = commaIdx >= 0 ? info.substring(commaIdx + 1).trim() : 'Live Channel';

        const captureAttr = (key) => {
          const m = attrs.match(new RegExp(`${key}="([^"]*)"`, 'i'));
          return m ? m[1].trim() : null;
        };

        const rawLogo = captureAttr('tvg-logo') || captureAttr('logo');
        const rawGroup = captureAttr('group-title') || captureAttr('group') || 'General';

        currentItem = {
          name: name || 'Live Channel',
          logo: rawLogo,
          group: normalizeCategory(rawGroup),
          country: countryName,
          source: sourceName
        };
      } else if (!line.startsWith('#') && currentItem) {
        currentItem.url = normalizeUrl(line);
        if (currentItem.url && !/\.(mp4|mkv|avi|mov|flv|webm)(\?.*)?$/i.test(currentItem.url)) {
          channels.push(currentItem);
        }
        currentItem = null;
      }
    }

    return channels;
  }

  /**
   * Unified parser handling both JSON and M3U based on text content
   */
  function parseUnifiedFeed(text, countryName, sourceName) {
    const trimmed = (text || '').trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return parseLiveTvCollectorJson(trimmed, countryName);
    }
    return parseM3uPlaylist(trimmed, countryName, sourceName);
  }

  // ---------------------------------------------------------------------------
  // 7. Feed Fetching, Merging & Deduplication
  // ---------------------------------------------------------------------------

  /**
   * Checks which regions are supported by the currently enabled sources
   */
  function getSupportedRegionsForCurrentSources() {
    const { iptvOrg, liveTvCollector } = state.enabledSources;
    const hasCustom = state.customSources.some((s) => s.enabled);

    return SUPPORTED_REGIONS.filter((region) => {
      let supported = false;
      if (liveTvCollector && region.liveTv) supported = true;
      if (iptvOrg && region.iptvOrg) supported = true;
      if (hasCustom) {
        const customMatches = state.customSources.some(
          (cs) => cs.enabled && (cs.countryScope === 'all' || cs.countryScope === region.name)
        );
        if (customMatches) supported = true;
      }
      return supported;
    });
  }

  /**
   * Fetches feeds in parallel, merges, deduplicates by stream URL, and caches results
   */
  async function loadChannelsForCountry(countryName, forceRefresh = false) {
    const fetchToken = ++state.activeFetchToken;

    // Check memory cache first unless force refresh requested
    if (!forceRefresh && state.channelMemoryCache.has(countryName)) {
      state.channels = state.channelMemoryCache.get(countryName);
      renderCategoriesDropdown();
      renderAllChannels();
      return;
    }

    const region = SUPPORTED_REGIONS.find((r) => r.name === countryName);
    if (!region) {
      state.channels = [];
      renderCategoriesDropdown();
      renderAllChannels();
      return;
    }

    // Check if any source is enabled
    const { iptvOrg, liveTvCollector } = state.enabledSources;
    const activeCustom = state.customSources.filter(
      (cs) => cs.enabled && (cs.countryScope === 'all' || cs.countryScope === countryName)
    );

    if (!iptvOrg && !liveTvCollector && activeCustom.length === 0) {
      state.channels = [];
      renderCategoriesDropdown();
      renderAllChannels();
      return;
    }

    elements.allChannelsCount.textContent = 'Loading channels...';
    elements.allChannelsList.innerHTML = '';
    elements.allEmptyState.hidden = true;

    const fetchPromises = [];

    // 1. LiveTVCollector Feed
    if (liveTvCollector && region.liveTv) {
      const liveTvUrl = `https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/${encodeURIComponent(region.liveTv)}/LiveTV.json`;
      fetchPromises.push(
        fetch(liveTvUrl, { cache: forceRefresh ? 'reload' : 'default' })
          .then((r) => (r.ok ? r.text() : ''))
          .then((text) => parseLiveTvCollectorJson(text, countryName))
          .catch(() => [])
      );
    }

    // 2. iptv-org Feed
    if (iptvOrg && region.iptvOrg) {
      const iptvOrgUrl = `https://iptv-org.github.io/iptv/${region.iptvOrg}`;
      fetchPromises.push(
        fetch(iptvOrgUrl, { cache: forceRefresh ? 'reload' : 'default' })
          .then((r) => (r.ok ? r.text() : ''))
          .then((text) => parseM3uPlaylist(text, countryName, 'iptv-org'))
          .catch(() => [])
      );
    }

    // 3. Matching Custom Sources
    for (const cs of activeCustom) {
      fetchPromises.push(
        fetch(cs.url, { cache: forceRefresh ? 'reload' : 'default' })
          .then((r) => (r.ok ? r.text() : ''))
          .then((text) => parseUnifiedFeed(text, countryName, cs.name))
          .catch(() => [])
      );
    }

    try {
      const results = await Promise.all(fetchPromises);
      if (fetchToken !== state.activeFetchToken) return; // Stale request discarded

      const mergedList = [];
      const seenUrlKeys = new Set();

      for (const channelList of results) {
        for (const ch of channelList) {
          const key = getCleanStreamKey(ch.url);
          if (!key || seenUrlKeys.has(key)) continue;
          seenUrlKeys.add(key);
          mergedList.push(ch);
        }
      }

      // Sort alphabetically by channel name
      mergedList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      state.channels = mergedList;
      state.channelMemoryCache.set(countryName, mergedList);

      // Auto-select or retain category
      state.currentCategory = 'All';
      elements.categoryLabel.textContent = 'All';

      renderCategoriesDropdown();
      renderAllChannels();
    } catch {
      if (fetchToken !== state.activeFetchToken) return;
      state.channels = [];
      renderCategoriesDropdown();
      renderAllChannels();
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Video Player & Playback Logic
  // ---------------------------------------------------------------------------
  function initPlayer() {
    // Media error handling
    elements.player.addEventListener('error', () => {
      showPlayerError('Stream is offline or format unsupported');
    });

    elements.player.addEventListener('waiting', () => {
      elements.playerSpinner.hidden = false;
    });

    elements.player.addEventListener('playing', () => {
      elements.playerSpinner.hidden = true;
      elements.playerError.hidden = true;
      state.isPlaying = true;
      updatePlayPauseButton(true);
      resetIdleTimer();
      updateActiveChannelHighlights();
    });

    elements.player.addEventListener('pause', () => {
      state.isPlaying = false;
      updatePlayPauseButton(false);
      showPlayerControls();
    });

    // Retry Button
    elements.playerRetryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.selectedChannel) {
        playChannel(state.selectedChannel);
      }
    });

    // Center Controls
    elements.playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
    });

    elements.prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playAdjacentChannel(-1);
    });

    elements.nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playAdjacentChannel(1);
    });

    // Bottom Controls
    elements.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });

    elements.fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen();
    });

    // Auto-hide controls interaction
    const userInteractEvents = ['mousemove', 'pointerdown', 'touchstart', 'keydown'];
    userInteractEvents.forEach((evt) => {
      elements.playerShell.addEventListener(evt, () => {
        showPlayerControls();
        if (state.isPlaying) {
          resetIdleTimer();
        }
      });
    });

    // Keyboard Shortcuts (Desktop)
    window.addEventListener('keydown', handleKeyboardShortcuts);
  }

  function playChannel(channel) {
    if (!channel || !channel.url) return;
    state.selectedChannel = channel;

    // Update bottom bar title
    elements.playerChannelTitle.textContent = channel.name;
    elements.playerError.hidden = true;
    elements.playerSpinner.hidden = false;

    // Update index in currently rendered list
    const currentList = state.activeTab === 'favorites' ? getFilteredFavorites() : getFilteredChannels();
    state.currentChannelIndex = currentList.findIndex((c) => c.url === channel.url);

    // Destroy existing Hls instance
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }

    const streamUrl = channel.url;

    // Check HLS.js support
    if (window.Hls && window.Hls.isSupported() && !/\.(mp4|webm)(\?.*)?$/i.test(streamUrl)) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });

      state.hls = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(elements.player);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        elements.player.play().catch(() => {
          // Autoplay policy: try muted
          elements.player.muted = true;
          state.isMuted = true;
          updateMuteButton(true);
          elements.player.play().catch(() => {});
        });
      });

      hls.on(window.Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              showPlayerError('Stream is offline or unreachable');
              break;
          }
        }
      });
    } else if (elements.player.canPlayType('application/vnd.apple.mpegurl') || /\.(mp4|webm)(\?.*)?$/i.test(streamUrl)) {
      // Native Safari / HTML5 video fallback
      elements.player.src = streamUrl;
      elements.player.play().catch(() => {
        elements.player.muted = true;
        state.isMuted = true;
        updateMuteButton(true);
        elements.player.play().catch(() => {});
      });
    } else {
      showPlayerError('Your browser cannot play this live stream format');
    }

    updateActiveChannelHighlights();
  }

  function showPlayerError(message) {
    elements.playerSpinner.hidden = true;
    elements.playerErrorText.textContent = message || 'Stream is offline or unreachable';
    elements.playerError.hidden = false;
    showPlayerControls();
  }

  function togglePlayPause() {
    if (elements.player.paused) {
      elements.player.play().catch(() => {});
    } else {
      elements.player.pause();
    }
  }

  function updatePlayPauseButton(playing) {
    const iconPlay = elements.playPauseBtn.querySelector('.icon-play');
    const iconPause = elements.playPauseBtn.querySelector('.icon-pause');
    if (iconPlay && iconPause) {
      iconPlay.hidden = playing;
      iconPause.hidden = !playing;
    }
  }

  function toggleMute() {
    state.isMuted = !elements.player.muted;
    elements.player.muted = state.isMuted;
    updateMuteButton(state.isMuted);
  }

  function updateMuteButton(muted) {
    const iconUnmuted = elements.muteBtn.querySelector('.icon-unmuted');
    const iconMuted = elements.muteBtn.querySelector('.icon-muted');
    if (iconUnmuted && iconMuted) {
      iconUnmuted.hidden = muted;
      iconMuted.hidden = !muted;
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (elements.playerShell.requestFullscreen) {
        elements.playerShell.requestFullscreen();
      } else if (elements.playerShell.webkitRequestFullscreen) {
        elements.playerShell.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    const iconEnter = elements.fullscreenBtn.querySelector('.icon-fs-enter');
    const iconExit = elements.fullscreenBtn.querySelector('.icon-fs-exit');
    if (iconEnter && iconExit) {
      iconEnter.hidden = isFs;
      iconExit.hidden = !isFs;
    }
  });

  function playAdjacentChannel(offset) {
    const list = state.activeTab === 'favorites' ? getFilteredFavorites() : getFilteredChannels();
    if (list.length === 0) return;

    let idx = state.currentChannelIndex;
    if (idx === -1 && state.selectedChannel) {
      idx = list.findIndex((c) => c.url === state.selectedChannel.url);
    }

    let nextIdx = idx + offset;
    if (nextIdx < 0) nextIdx = list.length - 1;
    if (nextIdx >= list.length) nextIdx = 0;

    playChannel(list[nextIdx]);
  }

  function resetIdleTimer() {
    clearTimeout(state.idleTimer);
    elements.playerShell.classList.remove('controls-hidden');
    state.idleTimer = setTimeout(() => {
      if (state.isPlaying && elements.playerError.hidden) {
        elements.playerShell.classList.add('controls-hidden');
      }
    }, 3500);
  }

  function showPlayerControls() {
    clearTimeout(state.idleTimer);
    elements.playerShell.classList.remove('controls-hidden');
  }

  function handleKeyboardShortcuts(e) {
    // Ignore when typing inside input or textarea or select
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }

    if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      playAdjacentChannel(-1);
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      playAdjacentChannel(1);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. All Tab UI & Channel List Rendering
  // ---------------------------------------------------------------------------
  function getFilteredChannels() {
    const query = state.searchQuery.toLowerCase().trim();
    const category = state.currentCategory;

    return state.channels.filter((ch) => {
      const matchCat = category === 'All' || ch.group === category;
      if (!matchCat) return false;
      if (!query) return true;
      return ch.name.toLowerCase().includes(query) || (ch.group && ch.group.toLowerCase().includes(query));
    });
  }

  function renderAllChannels() {
    const filtered = getFilteredChannels();
    const totalCount = state.channels.length;

    // Check if all sources disabled
    const { iptvOrg, liveTvCollector } = state.enabledSources;
    const hasCustom = state.customSources.some((s) => s.enabled);
    if (!iptvOrg && !liveTvCollector && !hasCustom) {
      elements.allChannelsCount.textContent = '0 Channels';
      elements.allChannelsList.innerHTML = '';
      elements.allEmptyState.hidden = false;
      elements.allEmptyTitle.textContent = 'All Sources Disabled';
      elements.allEmptyDesc.textContent = 'Enable iptv-org, LiveTVCollector, or a custom feed in Settings to browse channels.';
      elements.allEmptyActionBtn.textContent = 'Open Settings';
      elements.allEmptyActionBtn.onclick = () => switchTab('settings');
      return;
    }

    if (totalCount === 0) {
      elements.allChannelsCount.textContent = '0 Channels';
      elements.allChannelsList.innerHTML = '';
      elements.allEmptyState.hidden = false;
      elements.allEmptyTitle.textContent = 'No Channels in Region';
      elements.allEmptyDesc.textContent = `No stream feeds available for ${state.selectedCountry} under active sources.`;
      elements.allEmptyActionBtn.textContent = 'Select Another Region';
      elements.allEmptyActionBtn.onclick = () => openCountryModal();
      return;
    }

    if (filtered.length === 0) {
      elements.allChannelsCount.textContent = `0 of ${totalCount} Channels`;
      elements.allChannelsList.innerHTML = '';
      elements.allEmptyState.hidden = false;
      elements.allEmptyTitle.textContent = 'No Matching Channels';
      elements.allEmptyDesc.textContent = 'No channels match your current search query or category filter.';
      elements.allEmptyActionBtn.textContent = 'Clear Filter';
      elements.allEmptyActionBtn.onclick = () => {
        state.searchQuery = '';
        state.currentCategory = 'All';
        elements.searchInput.value = '';
        elements.clearSearchBtn.hidden = true;
        elements.categoryLabel.textContent = 'All';
        renderCategoriesDropdown();
        renderAllChannels();
      };
      return;
    }

    elements.allEmptyState.hidden = true;
    elements.allChannelsCount.textContent = `${filtered.length} Channels`;

    const frag = document.createDocumentFragment();
    for (const channel of filtered) {
      frag.appendChild(createChannelCard(channel));
    }
    elements.allChannelsList.innerHTML = '';
    elements.allChannelsList.appendChild(frag);

    updateActiveChannelHighlights();
  }

  function createChannelCard(channel) {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.setAttribute('role', 'listitem');
    card.dataset.url = channel.url;

    const isFav = isFavorite(channel);

    // Left Logo / Monogram
    const logoWrap = document.createElement('div');
    logoWrap.className = 'channel-logo-wrap';

    if (channel.logo) {
      const img = document.createElement('img');
      img.className = 'channel-logo-img';
      img.src = channel.logo;
      img.alt = channel.name;
      img.loading = 'lazy';
      img.onerror = () => {
        img.remove();
        renderMonogram(logoWrap, channel.name);
      };
      logoWrap.appendChild(img);
    } else {
      renderMonogram(logoWrap, channel.name);
    }

    // Middle Info: Name + Category
    const infoWrap = document.createElement('div');
    infoWrap.className = 'channel-info-wrap';

    const titleRow = document.createElement('div');
    titleRow.className = 'channel-title-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'channel-name';
    nameSpan.textContent = channel.name;
    titleRow.appendChild(nameSpan);

    // Playing Equalizer Indicator
    const eq = document.createElement('div');
    eq.className = 'equalizer-indicator';
    eq.hidden = true;
    eq.innerHTML = '<span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>';
    titleRow.appendChild(eq);

    const metaLabel = document.createElement('span');
    metaLabel.className = 'channel-meta-label';
    metaLabel.textContent = channel.group || 'General';

    infoWrap.appendChild(titleRow);
    infoWrap.appendChild(metaLabel);

    // Right Gold Favorite Star Toggle Button
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = `fav-btn ${isFav ? 'is-favorite' : ''}`;
    favBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    favBtn.title = isFav ? 'Unfavorite' : 'Favorite';
    favBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `;

    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(channel);
      favBtn.classList.toggle('is-favorite');
      const nowFav = favBtn.classList.contains('is-favorite');
      favBtn.title = nowFav ? 'Unfavorite' : 'Favorite';
      favBtn.setAttribute('aria-label', nowFav ? 'Remove from favorites' : 'Add to favorites');
    });

    card.appendChild(logoWrap);
    card.appendChild(infoWrap);
    card.appendChild(favBtn);

    card.addEventListener('click', () => {
      playChannel(channel);
    });

    return card;
  }

  function renderMonogram(container, name) {
    const mono = document.createElement('div');
    mono.className = 'channel-monogram';
    mono.textContent = getInitials(name);
    mono.style.background = getGradientForName(name);
    container.appendChild(mono);
  }

  function updateActiveChannelHighlights() {
    const curUrl = state.selectedChannel ? state.selectedChannel.url : null;
    const cards = document.querySelectorAll('.channel-card');
    cards.forEach((card) => {
      const match = curUrl && card.dataset.url === curUrl;
      card.classList.toggle('is-playing', match);
      const eq = card.querySelector('.equalizer-indicator');
      if (eq) eq.hidden = !match;
    });
  }

  // ---------------------------------------------------------------------------
  // 10. Category Dropdown (All Tab - No Favorites)
  // ---------------------------------------------------------------------------
  function renderCategoriesDropdown() {
    const categoriesMap = new Map();
    for (const ch of state.channels) {
      const cat = ch.group || 'General';
      categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + 1);
    }

    // Sort categories: preferred first, then alphabetical
    const sortedCats = Array.from(categoriesMap.keys()).sort((a, b) => {
      const ai = PREFERRED_CATEGORIES.indexOf(a);
      const bi = PREFERRED_CATEGORIES.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    elements.categoryMenu.innerHTML = '';

    // "All" Category Item
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `dropdown-item ${state.currentCategory === 'All' ? 'is-active' : ''}`;
    allBtn.innerHTML = `<span>All</span><span class="dropdown-item-badge">${state.channels.length}</span>`;
    allBtn.addEventListener('click', () => {
      state.currentCategory = 'All';
      elements.categoryLabel.textContent = 'All';
      closeCategoryMenu();
      renderCategoriesDropdown();
      renderAllChannels();
    });
    elements.categoryMenu.appendChild(allBtn);

    // Each Category (Strictly NO Favorites entry!)
    for (const cat of sortedCats) {
      const count = categoriesMap.get(cat);
      const catBtn = document.createElement('button');
      catBtn.type = 'button';
      catBtn.className = `dropdown-item ${state.currentCategory === cat ? 'is-active' : ''}`;
      catBtn.innerHTML = `<span>${escapeHtml(cat)}</span><span class="dropdown-item-badge">${count}</span>`;
      catBtn.addEventListener('click', () => {
        state.currentCategory = cat;
        elements.categoryLabel.textContent = cat;
        closeCategoryMenu();
        renderCategoriesDropdown();
        renderAllChannels();
      });
      elements.categoryMenu.appendChild(catBtn);
    }
  }

  function toggleCategoryMenu() {
    const isHidden = elements.categoryMenu.hidden;
    if (isHidden) {
      openCategoryMenu();
    } else {
      closeCategoryMenu();
    }
  }

  function openCategoryMenu() {
    elements.categoryMenu.hidden = false;
    elements.categoryPickerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeCategoryMenu() {
    elements.categoryMenu.hidden = true;
    elements.categoryPickerBtn.setAttribute('aria-expanded', 'false');
  }

  // ---------------------------------------------------------------------------
  // 11. Favorites Tab UI & Management
  // ---------------------------------------------------------------------------
  function isFavorite(channel) {
    if (!channel || !channel.url) return false;
    return state.favorites.some((f) => f.url === channel.url);
  }

  function toggleFavorite(channel) {
    if (!channel || !channel.url) return;
    const idx = state.favorites.findIndex((f) => f.url === channel.url);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
    } else {
      state.favorites.push({
        name: channel.name,
        url: channel.url,
        logo: channel.logo || null,
        group: channel.group || 'General',
        country: channel.country || state.selectedCountry,
        source: channel.source || 'IPTV'
      });
    }
    saveFavorites();
    updateFavoriteBadges();

    // Re-render Favorites tab if currently active
    if (state.activeTab === 'favorites') {
      renderFavorites();
    }
  }

  function updateFavoriteBadges() {
    const count = state.favorites.length;
    elements.railFavCount.textContent = count;
    elements.railFavCount.hidden = count === 0;
    elements.mobileFavCount.textContent = count;
    elements.mobileFavCount.hidden = count === 0;
  }

  function getFilteredFavorites() {
    const q = state.favSearchQuery.toLowerCase().trim();
    if (!q) return state.favorites;
    return state.favorites.filter((ch) => {
      return (
        ch.name.toLowerCase().includes(q) ||
        (ch.group && ch.group.toLowerCase().includes(q)) ||
        (ch.country && ch.country.toLowerCase().includes(q))
      );
    });
  }

  function renderFavorites() {
    const filtered = getFilteredFavorites();
    const totalCount = state.favorites.length;

    elements.favChannelsCount.textContent = `${totalCount} Favorites`;

    if (totalCount === 0) {
      elements.favChannelsList.innerHTML = '';
      elements.favEmptyState.hidden = false;
      return;
    }

    elements.favEmptyState.hidden = true;

    if (filtered.length === 0) {
      elements.favChannelsList.innerHTML = `
        <div class="modal-empty-notice">
          <p>No favorite channels match your search.</p>
        </div>
      `;
      return;
    }

    const frag = document.createDocumentFragment();
    for (const channel of filtered) {
      frag.appendChild(createChannelCard(channel));
    }
    elements.favChannelsList.innerHTML = '';
    elements.favChannelsList.appendChild(frag);

    updateActiveChannelHighlights();
  }

  // ---------------------------------------------------------------------------
  // 12. Country Picker Modal (Searchable, Bangladesh Pinned, A-Z Sorted)
  // ---------------------------------------------------------------------------
  function openCountryModal() {
    elements.countrySearchInput.value = '';
    elements.countryModal.hidden = false;
    elements.countryModal.classList.add('is-open');
    renderCountryModalList('');
    setTimeout(() => elements.countrySearchInput.focus(), 50);
  }

  function closeCountryModal() {
    elements.countryModal.hidden = true;
    elements.countryModal.classList.remove('is-open');
  }

  function renderCountryModalList(filterText = '') {
    const query = filterText.toLowerCase().trim();
    const availableRegions = getSupportedRegionsForCurrentSources();

    elements.countryModalSubtitle.textContent = `${availableRegions.length} Regions Available`;

    // 1. Pinned Bangladesh
    const bdRegion = availableRegions.find((r) => r.name === 'Bangladesh');
    elements.pinnedCountryList.innerHTML = '';

    if (bdRegion && (!query || bdRegion.name.toLowerCase().includes(query))) {
      elements.pinnedCountrySection.hidden = false;
      elements.pinnedCountryList.appendChild(createCountryOption(bdRegion));
    } else {
      elements.pinnedCountrySection.hidden = true;
    }

    // 2. Remaining A-Z Regions
    const remainingRegions = availableRegions
      .filter((r) => r.name !== 'Bangladesh')
      .sort((a, b) => a.name.localeCompare(b.name));

    const matchedRemaining = remainingRegions.filter((r) => !query || r.name.toLowerCase().includes(query));

    elements.alphaCountryList.innerHTML = '';
    for (const region of matchedRemaining) {
      elements.alphaCountryList.appendChild(createCountryOption(region));
    }

    const hasMatches = (!elements.pinnedCountrySection.hidden && bdRegion) || matchedRemaining.length > 0;
    elements.noCountriesFound.hidden = hasMatches;
  }

  function createCountryOption(region) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = region.name === state.selectedCountry;
    btn.className = `country-option-item ${isSelected ? 'is-selected' : ''}`;

    let sourceNote = '';
    if (state.enabledSources.liveTvCollector && state.enabledSources.iptvOrg) {
      sourceNote = region.liveTv && region.iptvOrg ? '2 sources' : region.liveTv ? 'LiveTV' : 'iptv-org';
    }

    btn.innerHTML = `
      <div class="country-item-left">
        <span class="country-item-emoji">${region.flag}</span>
        <span class="country-item-name">${escapeHtml(region.name)}</span>
      </div>
      ${sourceNote ? `<span class="country-item-badge">${sourceNote}</span>` : ''}
    `;

    btn.addEventListener('click', () => {
      selectCountry(region.name);
      closeCountryModal();
    });

    return btn;
  }

  function selectCountry(countryName) {
    if (state.selectedCountry === countryName) return;
    state.selectedCountry = countryName;
    saveSelectedCountry(countryName);

    const region = SUPPORTED_REGIONS.find((r) => r.name === countryName);
    if (region) {
      elements.countryFlagEmoji.textContent = region.flag;
      elements.countryLabel.textContent = region.name;
    }

    // Load feeds for the selected country
    loadChannelsForCountry(countryName);
  }

  // ---------------------------------------------------------------------------
  // 13. Settings Tab: Source Management & Custom Sources
  // ---------------------------------------------------------------------------
  function initSettingsView() {
    // Built-in toggles
    elements.toggleIptvOrg.checked = state.enabledSources.iptvOrg;
    elements.toggleLiveTvCollector.checked = state.enabledSources.liveTvCollector;

    updateSourceMergeStatus();

    elements.toggleIptvOrg.addEventListener('change', () => {
      state.enabledSources.iptvOrg = elements.toggleIptvOrg.checked;
      saveEnabledSources();
      updateSourceMergeStatus();
      handleSourcesChanged();
    });

    elements.toggleLiveTvCollector.addEventListener('change', () => {
      state.enabledSources.liveTvCollector = elements.toggleLiveTvCollector.checked;
      saveEnabledSources();
      updateSourceMergeStatus();
      handleSourcesChanged();
    });

    // Populate country scope options in Add Custom Source modal
    elements.customSourceScope.innerHTML = '<option value="all">All Countries (Merge)</option>';
    for (const region of SUPPORTED_REGIONS) {
      const opt = document.createElement('option');
      opt.value = region.name;
      opt.textContent = `${region.flag} ${region.name}`;
      elements.customSourceScope.appendChild(opt);
    }

    // Add Source Modal handlers
    elements.addSourceBtn.addEventListener('click', () => {
      openAddSourceModal();
    });

    elements.closeAddSourceModalBtn.addEventListener('click', () => {
      closeAddSourceModal();
    });

    elements.cancelAddSourceBtn.addEventListener('click', () => {
      closeAddSourceModal();
    });

    elements.addSourceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveNewCustomSource();
    });

    renderCustomSourcesList();
  }

  function openAddSourceModal() {
    elements.customSourceName.value = '';
    elements.customSourceUrl.value = '';
    elements.customSourceScope.value = 'all';
    elements.addSourceError.hidden = true;
    elements.addSourceError.textContent = '';
    elements.addSourceModal.hidden = false;
    elements.addSourceModal.classList.add('is-open');
    setTimeout(() => elements.customSourceName.focus(), 50);
  }

  function closeAddSourceModal() {
    elements.addSourceModal.hidden = true;
    elements.addSourceModal.classList.remove('is-open');
    elements.addSourceError.hidden = true;
    elements.addSourceError.textContent = '';
  }

  function updateSourceMergeStatus() {
    const { iptvOrg, liveTvCollector } = state.enabledSources;
    const customActiveCount = state.customSources.filter((s) => s.enabled).length;

    let activeBuiltinCount = 0;
    if (iptvOrg) activeBuiltinCount++;
    if (liveTvCollector) activeBuiltinCount++;

    const totalActive = activeBuiltinCount + customActiveCount;

    if (totalActive >= 2) {
      elements.sourceMergeStatusText.textContent = `Merged Active (${totalActive} Sources)`;
      elements.sourceMergeStatusBadge.style.color = 'var(--accent-purple-light)';
    } else if (totalActive === 1) {
      const activeName = iptvOrg ? 'iptv-org' : liveTvCollector ? 'LiveTVCollector' : 'Custom Source';
      elements.sourceMergeStatusText.textContent = `Single Source (${activeName})`;
      elements.sourceMergeStatusBadge.style.color = 'var(--text-main)';
    } else {
      elements.sourceMergeStatusText.textContent = 'All Sources Disabled';
      elements.sourceMergeStatusBadge.style.color = 'var(--live-red)';
    }
  }

  function handleSourcesChanged() {
    // Clear in-memory cache to guarantee fresh merge with current source toggles
    state.channelMemoryCache.clear();

    // Verify if currently selected country is still supported
    const supported = getSupportedRegionsForCurrentSources();
    if (supported.length > 0) {
      const exists = supported.some((r) => r.name === state.selectedCountry);
      if (!exists) {
        state.selectedCountry = supported[0].name;
        saveSelectedCountry(state.selectedCountry);
        const r = SUPPORTED_REGIONS.find((reg) => reg.name === state.selectedCountry);
        if (r) {
          elements.countryFlagEmoji.textContent = r.flag;
          elements.countryLabel.textContent = r.name;
        }
      }
    }

    loadChannelsForCountry(state.selectedCountry, true);
  }

  function saveNewCustomSource() {
    const name = elements.customSourceName.value.trim();
    const url = elements.customSourceUrl.value.trim();
    const scope = elements.customSourceScope.value;

    if (!name) {
      showAddSourceError('Please provide a source name');
      return;
    }

    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      showAddSourceError('Please enter a valid HTTP or HTTPS stream URL');
      return;
    }

    const newSource = {
      id: 'src_' + Date.now(),
      name,
      url,
      countryScope: scope,
      enabled: true
    };

    state.customSources.push(newSource);
    saveCustomSources();
    renderCustomSourcesList();
    updateSourceMergeStatus();
    closeAddSourceModal();

    // Reload channels to merge new source
    handleSourcesChanged();
  }

  function showAddSourceError(msg) {
    elements.addSourceError.textContent = msg;
    elements.addSourceError.hidden = false;
  }

  function renderCustomSourcesList() {
    elements.customSourcesList.innerHTML = '';
    const sources = state.customSources;

    if (sources.length === 0) {
      elements.noCustomSourcesNotice.hidden = false;
      return;
    }

    elements.noCustomSourcesNotice.hidden = true;

    for (const src of sources) {
      const card = document.createElement('div');
      card.className = 'source-card';

      const scopeText = src.countryScope === 'all' ? 'All Countries (Merge)' : src.countryScope;

      card.innerHTML = `
        <div class="source-info">
          <div class="source-header-row">
            <span class="source-name">${escapeHtml(src.name)}</span>
            <span class="badge-scope">${escapeHtml(scopeText)}</span>
          </div>
          <p class="source-desc">${escapeHtml(src.url)}</p>
        </div>
        <div class="custom-card-actions">
          <label class="toggle-switch">
            <input type="checkbox" ${src.enabled ? 'checked' : ''} aria-label="Toggle custom source" />
            <span class="toggle-slider"></span>
          </label>
          <button type="button" class="delete-source-btn" aria-label="Delete source" title="Delete custom source">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
            </svg>
          </button>
        </div>
      `;

      // Toggle switch
      const toggle = card.querySelector('input[type="checkbox"]');
      toggle.addEventListener('change', () => {
        src.enabled = toggle.checked;
        saveCustomSources();
        updateSourceMergeStatus();
        handleSourcesChanged();
      });

      // Delete button
      const delBtn = card.querySelector('.delete-source-btn');
      delBtn.addEventListener('click', () => {
        state.customSources = state.customSources.filter((s) => s.id !== src.id);
        saveCustomSources();
        renderCustomSourcesList();
        updateSourceMergeStatus();
        handleSourcesChanged();
      });

      elements.customSourcesList.appendChild(card);
    }
  }

  // ---------------------------------------------------------------------------
  // 14. Tab Navigation (All, Favorites, Settings)
  // ---------------------------------------------------------------------------
  function switchTab(tabName) {
    if (state.activeTab === tabName) return;
    state.activeTab = tabName;

    // Update rail items
    elements.railItems.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === tabName);
    });

    // Update mobile bottom bar
    elements.mobileNavBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === tabName);
    });

    // Update views
    elements.viewAll.classList.toggle('is-active', tabName === 'all');
    elements.viewAll.hidden = tabName !== 'all';

    elements.viewFavorites.classList.toggle('is-active', tabName === 'favorites');
    elements.viewFavorites.hidden = tabName !== 'favorites';

    elements.viewSettings.classList.toggle('is-active', tabName === 'settings');
    elements.viewSettings.hidden = tabName !== 'settings';

    if (tabName === 'favorites') {
      renderFavorites();
    } else if (tabName === 'all') {
      updateActiveChannelHighlights();
    }
  }

  // ---------------------------------------------------------------------------
  // 15. Setup Global Event Listeners & Initialize
  // ---------------------------------------------------------------------------
  function setupEventListeners() {
    // Navigation Rail & Mobile Bottom Bar
    elements.railItems.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    elements.mobileNavBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Search: All Tab
    elements.searchInput.addEventListener('input', () => {
      state.searchQuery = elements.searchInput.value;
      elements.clearSearchBtn.hidden = !state.searchQuery;
      renderAllChannels();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.hidden = true;
      renderAllChannels();
      elements.searchInput.focus();
    });

    // Search: Favorites Tab
    elements.favSearchInput.addEventListener('input', () => {
      state.favSearchQuery = elements.favSearchInput.value;
      elements.clearFavSearchBtn.hidden = !state.favSearchQuery;
      renderFavorites();
    });

    elements.clearFavSearchBtn.addEventListener('click', () => {
      elements.favSearchInput.value = '';
      state.favSearchQuery = '';
      elements.clearFavSearchBtn.hidden = true;
      renderFavorites();
      elements.favSearchInput.focus();
    });

    elements.browseAllBtn.addEventListener('click', () => {
      switchTab('all');
    });

    // Country Picker Trigger
    elements.countryPickerBtn.addEventListener('click', () => {
      openCountryModal();
    });

    elements.closeCountryModalBtn.addEventListener('click', () => {
      closeCountryModal();
    });

    elements.countrySearchInput.addEventListener('input', () => {
      renderCountryModalList(elements.countrySearchInput.value);
    });

    // Category Dropdown Trigger
    elements.categoryPickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCategoryMenu();
    });

    // Close category dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!elements.categoryPickerBtn.contains(e.target) && !elements.categoryMenu.contains(e.target)) {
        closeCategoryMenu();
      }
    });

    // Refresh Button with 360-degree spin animation
    elements.refreshFeedsBtn.addEventListener('click', () => {
      elements.refreshFeedsBtn.classList.remove('is-spinning');
      void elements.refreshFeedsBtn.offsetWidth; // Force reflow for restart
      elements.refreshFeedsBtn.classList.add('is-spinning');

      state.channelMemoryCache.delete(state.selectedCountry);
      loadChannelsForCountry(state.selectedCountry, true);

      setTimeout(() => {
        elements.refreshFeedsBtn.classList.remove('is-spinning');
      }, 750);
    });

    // Close modal on backdrop click
    elements.countryModal.addEventListener('click', (e) => {
      if (e.target === elements.countryModal) closeCountryModal();
    });

    elements.addSourceModal.addEventListener('click', (e) => {
      if (e.target === elements.addSourceModal) closeAddSourceModal();
    });

    // Keyboard ESC to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCountryModal();
        closeAddSourceModal();
        closeCategoryMenu();
      }
    });
  }

  function initApp() {
    // Set initial country flag & label
    const region = SUPPORTED_REGIONS.find((r) => r.name === state.selectedCountry) || SUPPORTED_REGIONS[0];
    state.selectedCountry = region.name;
    elements.countryFlagEmoji.textContent = region.flag;
    elements.countryLabel.textContent = region.name;

    updateFavoriteBadges();
    initPlayer();
    initSettingsView();
    setupEventListeners();

    // Initial feed fetch
    loadChannelsForCountry(state.selectedCountry);
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
