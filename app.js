/**
 * Nebula IPTV - Fast, Lightweight, Responsive Live TV Player
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const DEFAULT_PLAYLIST = 'https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/Bangladesh/LiveTV.json';
  const FAVORITES_STORAGE_KEY = 'nebula-favorite-channels';
  const FAVORITES_GROUP = 'favorites';
  const PREFERRED_GROUPS = ['News', 'Sports', 'Entertainment', 'Movies', 'Kids', 'Music', 'Religious', 'Documentary'];
  const PLAYER_IDLE_TIMEOUT = 2500;

  // DOM Elements
  const player = document.getElementById('player');
  const playerShell = document.getElementById('playerShell');
  const centerPlayBtn = document.getElementById('centerPlayBtn');
  const playerCaption = document.getElementById('playerCaption');
  const currentChannelEl = document.getElementById('currentChannel');
  const currentChannelGroupEl = document.getElementById('currentChannelGroup');
  const topbarChannelEl = document.getElementById('topbarChannel');
  const playerSpinner = document.getElementById('playerSpinner');
  const playerError = document.getElementById('playerError');
  const playerErrorText = document.getElementById('playerErrorText');
  const playerRetryBtn = document.getElementById('playerRetryBtn');
  const unmutePrompt = document.getElementById('unmutePrompt');
  const playToggleBtn = document.getElementById('playToggleBtn');
  const muteToggleBtn = document.getElementById('muteToggleBtn');
  const pipBtn = document.getElementById('pipBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const timeDisplay = document.getElementById('timeDisplay');
  const timelineContainer = document.getElementById('timelineContainer');
  const progressFill = document.getElementById('progressFill');

  // Sidebar DOM
  const channelListEl = document.getElementById('channelList');
  const channelMetaEl = document.getElementById('channelMeta');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryPicker = document.getElementById('categoryPicker');
  const categoryToggleBtn = document.getElementById('categoryToggleBtn');
  const selectedCategoryLabel = document.getElementById('selectedCategoryLabel');
  const categoryMenu = document.getElementById('categoryMenu');

  // Topbar DOM
  const reloadBtn = document.getElementById('reloadBtn');

  // State
  let channels = [];
  let selectedChannel = null;
  let hls = null;
  let activeQuery = '';
  let activeGroup = 'all';
  let favoriteUrls = loadFavorites();
  let loadToken = 0;
  let renderToken = 0;
  let imageObserver = null;
  let idleTimer = null;
  let isChannelSwitching = false;

  // ---------------------------------------------------------------------------
  // Favorites Management
  // ---------------------------------------------------------------------------
  function loadFavorites() {
    try {
      const data = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
      return new Set(Array.isArray(data) ? data.filter((u) => typeof u === 'string' && u) : []);
    } catch {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteUrls)));
    } catch {}
  }

  function isFavorite(channel) {
    return channel && favoriteUrls.has(channel.url);
  }

  function toggleFavorite(channel) {
    if (!channel || !channel.url) return;
    if (favoriteUrls.has(channel.url)) {
      favoriteUrls.delete(channel.url);
    } else {
      favoriteUrls.add(channel.url);
    }
    saveFavorites();
    updateCategoryMenuCounts();
    renderChannels();
  }

  function pruneFavorites() {
    const channelUrls = new Set(channels.map((c) => c.url));
    let changed = false;
    favoriteUrls.forEach((url) => {
      if (!channelUrls.has(url)) {
        favoriteUrls.delete(url);
        changed = true;
      }
    });
    if (changed) saveFavorites();
  }

  // ---------------------------------------------------------------------------
  // URL & Stream Utilities
  // ---------------------------------------------------------------------------
  function normalizeUrl(url) {
    const trimmed = (url || '').trim();
    if (!trimmed) return trimmed;
    try {
      const parsed = new URL(trimmed);
      if ((parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') && parsed.pathname.includes('/blob/')) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts[2] === 'blob') {
          return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`;
        }
      }
    } catch {}
    return trimmed;
  }

  function isLikelyLiveTvUrl(url) {
    const val = (url || '').trim();
    if (!val) return false;
    const lower = val.toLowerCase();
    // Exclude static download video files
    if (/\.(mp4|mkv|avi|mov|wmv|webm|flv|mpeg|mpg|3gp|m4v)(\?.*)?$/i.test(lower)) return false;
    return /\.m3u8?(\?.*)?$/i.test(lower) || /(?:^|[/?&])(hls|playlist|live|stream)(?:[/?&]|$)/i.test(lower);
  }

  function firstString(obj, keys) {
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------------------------------------------------------------------------
  // Playlist Parsing (JSON & M3U / M3U8)
  // ---------------------------------------------------------------------------
  function parseChannels(text) {
    return new Promise((resolve) => {
      const trimmed = text.trim();
      if (!trimmed) return resolve([]);

      // 1. JSON Playlist Feed
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsedJson = JSON.parse(trimmed);
          const results = [];
          const stack = [{ value: parsedJson, parentGroup: null }];

          while (stack.length) {
            const { value, parentGroup } = stack.pop();

            if (Array.isArray(value)) {
              for (let i = value.length - 1; i >= 0; i--) {
                stack.push({ value: value[i], parentGroup });
              }
              continue;
            }

            if (!value || typeof value !== 'object') continue;

            const group = firstString(value, ['group', 'group_title', 'group-title', 'category', 'country']) || parentGroup;
            const name = firstString(value, ['name', 'title', 'channel', 'channel_name', 'channelName']);
            const url = firstString(value, ['url', 'link', 'stream', 'stream_url', 'streamUrl', 'm3u8']);
            const logo = firstString(value, ['logo', 'tvg-logo', 'tvgLogo', 'logo_url', 'logoUrl', 'image']);

            if (name && url && isLikelyLiveTvUrl(url)) {
              results.push({ name, url: normalizeUrl(url), logo, group: group || 'General' });
              continue;
            }

            const children = value.channels || value.items || value.data || value.playlist;
            if (children && typeof children === 'object') {
              stack.push({ value: children, parentGroup: group });
              continue;
            }

            const entries = Object.entries(value);
            for (let i = entries.length - 1; i >= 0; i--) {
              const [key, child] = entries[i];
              if (child && typeof child === 'object') {
                stack.push({ value: child, parentGroup: group || key });
              }
            }
          }

          if (results.length) return resolve(results);
        } catch {}
      }

      // 2. M3U / M3U8 Playlist
      const lines = text.split(/\r?\n/);
      const items = [];
      let currentItem = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF')) {
          const info = line.substring(line.indexOf(':') + 1);
          const commaIdx = info.lastIndexOf(',');
          const attrs = commaIdx >= 0 ? info.substring(0, commaIdx) : info;
          const name = commaIdx >= 0 ? info.substring(commaIdx + 1).trim() : 'Live Channel';

          const capture = (key) => {
            const m = attrs.match(new RegExp(`${key}="([^"]*)"`, 'i'));
            return m ? m[1].trim() : undefined;
          };

          currentItem = {
            name: name || 'Live Channel',
            logo: capture('tvg-logo') || capture('logo'),
            group: capture('group-title') || capture('group') || 'General'
          };
        } else if (!line.startsWith('#') && currentItem) {
          currentItem.url = normalizeUrl(line);
          if (isLikelyLiveTvUrl(currentItem.url)) {
            items.push(currentItem);
          }
          currentItem = null;
        }
      }

      resolve(items);
    });
  }

  // ---------------------------------------------------------------------------
  // Category Groups & Sorting
  // ---------------------------------------------------------------------------
  function compareGroups(a, b) {
    const ai = PREFERRED_GROUPS.findIndex((g) => g.toLowerCase() === String(a).toLowerCase());
    const bi = PREFERRED_GROUPS.findIndex((g) => g.toLowerCase() === String(b).toLowerCase());
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return String(a).localeCompare(String(b));
  }

  function getUniqueGroups() {
    const set = new Set();
    channels.forEach((c) => {
      if (c.group && c.group.trim()) set.add(c.group.trim());
    });
    return Array.from(set).sort(compareGroups);
  }

  function getGroupCount(group) {
    if (group === 'all') return channels.length;
    if (group === FAVORITES_GROUP) {
      return channels.filter((c) => favoriteUrls.has(c.url)).length;
    }
    return channels.filter((c) => c.group === group).length;
  }

  function getGroupLabel(group) {
    if (group === 'all') return 'All channels';
    if (group === FAVORITES_GROUP) return '★ Favorites';
    return group;
  }

  // ---------------------------------------------------------------------------
  // Filtered Channels
  // ---------------------------------------------------------------------------
  function getFilteredChannels() {
    const query = activeQuery.toLowerCase().trim();
    return channels.filter((channel) => {
      const matchQuery = !query || `${channel.name} ${channel.group}`.toLowerCase().includes(query);
      const matchGroup =
        activeGroup === 'all'
          ? true
          : activeGroup === FAVORITES_GROUP
          ? isFavorite(channel)
          : channel.group === activeGroup;
      return matchQuery && matchGroup;
    });
  }

  // ---------------------------------------------------------------------------
  // Category Dropdown UI
  // ---------------------------------------------------------------------------
  function renderCategoryMenu() {
    if (!categoryMenu) return;
    const groups = ['all', FAVORITES_GROUP, ...getUniqueGroups()];
    const fragment = document.createDocumentFragment();

    groups.forEach((group) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-item ${group === activeGroup ? 'is-selected' : ''}`;
      btn.dataset.group = group;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', group === activeGroup ? 'true' : 'false');

      const count = getGroupCount(group);
      btn.innerHTML = `
        <span>${escapeHtml(getGroupLabel(group))}</span>
        <span class="cat-item-count">${count}</span>
      `;
      fragment.appendChild(btn);
    });

    categoryMenu.replaceChildren(fragment);
    updateCategoryToggleLabel();
  }

  function updateCategoryToggleLabel() {
    if (selectedCategoryLabel) {
      selectedCategoryLabel.textContent = getGroupLabel(activeGroup);
    }
  }

  function updateCategoryMenuCounts() {
    if (!categoryMenu) return;
    const items = categoryMenu.querySelectorAll('.category-item');
    items.forEach((item) => {
      const grp = item.dataset.group;
      const countEl = item.querySelector('.cat-item-count');
      if (countEl && grp) {
        countEl.textContent = getGroupCount(grp);
      }
    });
  }

  function toggleCategoryDropdown(forceState) {
    if (!categoryPicker) return;
    const isOpen = typeof forceState === 'boolean' ? forceState : !categoryPicker.classList.contains('is-open');
    categoryPicker.classList.toggle('is-open', isOpen);
    if (categoryToggleBtn) {
      categoryToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  function selectCategory(group) {
    activeGroup = group;
    toggleCategoryDropdown(false);
    updateCategoryToggleLabel();

    if (categoryMenu) {
      const items = categoryMenu.querySelectorAll('.category-item');
      items.forEach((item) => {
        const isSelected = item.dataset.group === activeGroup;
        item.classList.toggle('is-selected', isSelected);
        item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    }

    renderChannels();
  }

  // ---------------------------------------------------------------------------
  // Channel List Rendering & Lazy Logos
  // ---------------------------------------------------------------------------
  function setupImageObserver() {
    if (imageObserver) {
      imageObserver.disconnect();
      imageObserver = null;
    }

    if ('IntersectionObserver' in window) {
      imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              imageObserver.unobserve(img);
            }
          });
        },
        { rootMargin: '240px' }
      );
    }
  }

  function createChannelCard(channel) {
    const entry = document.createElement('div');
    entry.className = 'channel-entry';

    const isCurrentActive = selectedChannel && selectedChannel.url === channel.url;
    const isFav = isFavorite(channel);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `channel-card-btn ${isCurrentActive ? 'is-active' : ''}`;
    btn.dataset.url = channel.url;
    btn.title = channel.name;

    // Thumb
    const thumb = document.createElement('div');
    thumb.className = 'channel-thumb';

    if (channel.logo) {
      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.dataset.src = channel.logo;
      img.onerror = () => {
        thumb.innerHTML = `<span class="thumb-fallback">TV</span>`;
      };
      if (imageObserver) {
        imageObserver.observe(img);
      } else {
        img.src = channel.logo;
      }
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = `<span class="thumb-fallback">TV</span>`;
    }

    // Text Group
    const textGroup = document.createElement('div');
    textGroup.className = 'channel-text-group';
    textGroup.innerHTML = `
      <span class="channel-name">${escapeHtml(channel.name)}</span>
      <span class="channel-category">${escapeHtml(channel.group || 'Live TV')}</span>
    `;

    // Star Button
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = `btn-fav ${isFav ? 'is-favorite' : ''}`;
    favBtn.dataset.favUrl = channel.url;
    favBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
    favBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    `;

    btn.appendChild(thumb);
    btn.appendChild(textGroup);
    btn.appendChild(favBtn);
    entry.appendChild(btn);

    return entry;
  }

  function renderChannels() {
    const currentToken = ++renderToken;
    const filtered = getFilteredChannels();
    const count = filtered.length;

    if (channelMetaEl) {
      channelMetaEl.textContent = `${count} ${count === 1 ? 'channel' : 'channels'}`;
    }

    if (!count) {
      channelListEl.innerHTML = `
        <div class="channel-empty-box">
          <p>No channels found${activeGroup === FAVORITES_GROUP ? ' in favorites' : ''}.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      fragment.appendChild(createChannelCard(filtered[i]));
    }

    channelListEl.replaceChildren(fragment);
  }

  function updateActiveChannelCard() {
    if (!channelListEl) return;
    const cards = channelListEl.querySelectorAll('.channel-card-btn');
    cards.forEach((card) => {
      const match = selectedChannel && card.dataset.url === selectedChannel.url;
      card.classList.toggle('is-active', match);
    });
  }

  // ---------------------------------------------------------------------------
  // Player & HLS Stream Engine (Instant Play, Zero Loading Delay)
  // ---------------------------------------------------------------------------
  const HLS_FAST_CONFIG = {
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 20,
    maxBufferLength: 8,             // 8s buffer allows playback to begin immediately
    maxMaxBufferLength: 16,
    maxBufferSize: 30 * 1000 * 1000,
    maxBufferHole: 0.5,
    highBufferWatchdogPeriod: 1,
    startFragPrefetch: true,        // Prefetch first chunk instantly
    liveSyncDurationCount: 2,
    liveMaxLatencyDurationCount: 4,
    startLevel: -1,                 // Auto-detect optimal bitrate
    capLevelToPlayerSize: true,
    testBandwidth: false
  };

  function showSpinner(show) {
    if (playerSpinner) {
      playerSpinner.classList.toggle('is-buffering', Boolean(show));
    }
  }

  function showError(msg) {
    showSpinner(false);
    if (playerError) {
      playerError.hidden = false;
      if (playerErrorText) playerErrorText.textContent = msg || 'Stream offline';
    }
  }

  function hideError() {
    if (playerError) playerError.hidden = true;
  }

  function showUnmutePrompt(show) {
    if (unmutePrompt) unmutePrompt.hidden = !show;
  }

  function playStream(url) {
    if (!url) return;
    hideError();
    showSpinner(true);

    if (hls) {
      hls.destroy();
      hls = null;
    }

    player.removeAttribute('src');
    player.load();

    if (window.Hls && Hls.isSupported()) {
      hls = new Hls(HLS_FAST_CONFIG);
      hls.attachMedia(player);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(url);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        attemptAutoPlay();
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        showSpinner(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        showSpinner(false);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else {
          showError('Stream is unavailable or format not supported');
        }
      });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari / iOS)
      player.src = url;
      attemptAutoPlay();
    } else {
      player.src = url;
      attemptAutoPlay();
    }

    revealPlayerControls();
  }

  function attemptAutoPlay() {
    const promise = player.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          showSpinner(false);
          updatePlayPauseButton();
          showUnmutePrompt(player.muted);
        })
        .catch((err) => {
          // If browser policy blocked unmuted sound, instantly mute and play!
          if (err.name === 'NotAllowedError') {
            player.muted = true;
            updateMuteButton();
            showUnmutePrompt(true);
            player.play().catch(() => {});
          }
        });
    }
  }

  function setInitialChannel(channel) {
    if (!channel) return;
    selectedChannel = channel;
    updateActiveChannelCard();

    // Display metadata without auto-playing audio/video
    if (currentChannelEl) currentChannelEl.textContent = channel.name;
    if (currentChannelGroupEl) currentChannelGroupEl.textContent = channel.group || 'Live TV';
    if (topbarChannelEl) topbarChannelEl.textContent = channel.name;

    showSpinner(false);
    updatePlayPauseButton();
    if (centerPlayBtn) centerPlayBtn.hidden = false;
    revealPlayerControls();
  }

  function selectChannel(channel) {
    if (!channel || (selectedChannel && selectedChannel.url === channel.url && !player.paused)) {
      return;
    }
    selectedChannel = channel;
    updateActiveChannelCard();

    // Update player labels
    if (currentChannelEl) currentChannelEl.textContent = channel.name;
    if (currentChannelGroupEl) currentChannelGroupEl.textContent = channel.group || 'Live TV';
    if (topbarChannelEl) topbarChannelEl.textContent = channel.name;

    if (centerPlayBtn) centerPlayBtn.hidden = true;
    playStream(channel.url);
  }

  // ---------------------------------------------------------------------------
  // Player Controls & Idle Fading
  // ---------------------------------------------------------------------------
  function updatePlayPauseButton() {
    if (!playToggleBtn) return;
    const isPaused = player.paused || player.ended;
    playToggleBtn.classList.toggle('is-paused', isPaused);
    playToggleBtn.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
  }

  function updateMuteButton() {
    if (!muteToggleBtn) return;
    const isMuted = player.muted || player.volume === 0;
    muteToggleBtn.classList.toggle('is-muted', isMuted);
    muteToggleBtn.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
    if (!isMuted) showUnmutePrompt(false);
  }

  function revealPlayerControls() {
    if (!playerShell) return;
    playerShell.classList.remove('is-idle');
    clearTimeout(idleTimer);
    if (!player.paused) {
      idleTimer = setTimeout(() => {
        if (!player.paused) {
          playerShell.classList.add('is-idle');
        }
      }, PLAYER_IDLE_TIMEOUT);
    }
  }

  // ---------------------------------------------------------------------------
  // Playlist Loader
  // ---------------------------------------------------------------------------
  async function loadPlaylist(sourceUrl) {
    const url = normalizeUrl(sourceUrl || DEFAULT_PLAYLIST);
    const token = ++loadToken;

    if (channelMetaEl) channelMetaEl.textContent = 'Loading...';
    channelListEl.innerHTML = `
      <div class="channel-empty-box"><p>Loading playlist...</p></div>
    `;

    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (token !== loadToken) return;

      const parsed = await parseChannels(text);
      if (token !== loadToken) return;

      channels = parsed;
      pruneFavorites();
      activeGroup = 'all';

      renderCategoryMenu();
      setupImageObserver();
      renderChannels();

      if (channels.length > 0) {
        setInitialChannel(channels[0]);
      } else {
        selectedChannel = null;
        if (currentChannelEl) currentChannelEl.textContent = 'No channels found';
        if (currentChannelGroupEl) currentChannelGroupEl.textContent = 'Empty playlist';
        showError('No playable channels found in this playlist');
      }
    } catch (err) {
      if (token !== loadToken) return;
      channels = [];
      selectedChannel = null;
      renderCategoryMenu();
      renderChannels();
      showError(`Unable to load playlist: ${err.message || 'Check URL'}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------
  function attachEventListeners() {
    // Player Events
    player.addEventListener('play', () => {
      updatePlayPauseButton();
      showSpinner(false);
      if (centerPlayBtn) centerPlayBtn.hidden = true;
      revealPlayerControls();
    });

    player.addEventListener('pause', () => {
      updatePlayPauseButton();
      if (centerPlayBtn) centerPlayBtn.hidden = false;
      revealPlayerControls();
    });

    player.addEventListener('ended', () => {
      updatePlayPauseButton();
      if (centerPlayBtn) centerPlayBtn.hidden = false;
      revealPlayerControls();
    });

    player.addEventListener('waiting', () => showSpinner(true));
    player.addEventListener('canplay', () => showSpinner(false));
    player.addEventListener('playing', () => {
      showSpinner(false);
      if (centerPlayBtn) centerPlayBtn.hidden = true;
    });
    player.addEventListener('volumechange', updateMuteButton);

    // Center big play button
    centerPlayBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!hls && !player.src && selectedChannel) {
        playStream(selectedChannel.url);
      } else if (player.paused) {
        player.play().catch(() => {});
      }
    });

    // Activity tracking for control fadeout
    ['mousemove', 'pointerdown', 'touchstart'].forEach((evt) => {
      playerShell?.addEventListener(evt, revealPlayerControls, { passive: true });
    });

    // Unmute Prompt
    unmutePrompt?.addEventListener('click', () => {
      player.muted = false;
      player.volume = 1;
      updateMuteButton();
      showUnmutePrompt(false);
    });

    // Play/Pause button
    playToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!hls && !player.src && selectedChannel) {
        playStream(selectedChannel.url);
      } else if (player.paused) {
        player.play().catch(() => {});
      } else {
        player.pause();
      }
      updatePlayPauseButton();
    });

    // Mute button
    muteToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      player.muted = !player.muted;
      updateMuteButton();
    });

    // Retry Button
    playerRetryBtn?.addEventListener('click', () => {
      if (selectedChannel) playStream(selectedChannel.url);
    });

    // Picture-in-Picture
    pipBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (player.requestPictureInPicture) {
          await player.requestPictureInPicture();
        }
      } catch {}
    });
    if (!document.pictureInPictureEnabled && pipBtn) {
      pipBtn.style.display = 'none';
    }

    // Fullscreen
    fullscreenBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = playerShell || player;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFs = Boolean(document.fullscreenElement);
      fullscreenBtn?.classList.toggle('is-fullscreen', isFs);
      revealPlayerControls();
    });

    // Channel List click delegation
    channelListEl?.addEventListener('click', (e) => {
      // Star favorite button
      const favBtn = e.target.closest('[data-fav-url]');
      if (favBtn) {
        e.stopPropagation();
        const ch = channels.find((c) => c.url === favBtn.dataset.favUrl);
        if (ch) toggleFavorite(ch);
        return;
      }

      // Channel card button
      const card = e.target.closest('[data-url]');
      if (card) {
        const ch = channels.find((c) => c.url === card.dataset.url);
        if (ch) selectChannel(ch);
      }
    });

    // Search Input
    searchInput?.addEventListener('input', (e) => {
      activeQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.hidden = !activeQuery;
      }
      renderChannels();
    });

    clearSearchBtn?.addEventListener('click', () => {
      searchInput.value = '';
      activeQuery = '';
      clearSearchBtn.hidden = true;
      searchInput.focus();
      renderChannels();
    });

    // Category Dropdown
    categoryToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCategoryDropdown();
    });

    categoryMenu?.addEventListener('click', (e) => {
      const opt = e.target.closest('.category-item');
      if (opt && opt.dataset.group) {
        selectCategory(opt.dataset.group);
      }
    });

    document.addEventListener('click', (e) => {
      if (categoryPicker && !categoryPicker.contains(e.target)) {
        toggleCategoryDropdown(false);
      }
    });

    // Topbar Reload
    reloadBtn?.addEventListener('click', () => {
      loadPlaylist(DEFAULT_PLAYLIST);
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        toggleCategoryDropdown(false);
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        playToggleBtn?.click();
      } else if (e.key === 'm') {
        muteToggleBtn?.click();
      } else if (e.key === 'f') {
        fullscreenBtn?.click();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const filtered = getFilteredChannels();
        if (!filtered.length) return;
        const currentIdx = filtered.findIndex((c) => selectedChannel && c.url === selectedChannel.url);
        let nextIdx = 0;
        if (e.key === 'ArrowDown') {
          nextIdx = currentIdx + 1 < filtered.length ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx - 1 >= 0 ? currentIdx - 1 : filtered.length - 1;
        }
        selectChannel(filtered[nextIdx]);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // App Initialization
  // ---------------------------------------------------------------------------
  function init() {
    attachEventListeners();
    loadPlaylist(DEFAULT_PLAYLIST);
  }

  init();
})();
