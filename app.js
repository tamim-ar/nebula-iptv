const DEFAULT_PLAYLIST = 'https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/Bangladesh/LiveTV.json';
const STORAGE_KEY = 'nebula-static-playlist';
const RENDER_BATCH_SIZE = 24;
const PREFERRED_GROUP_ORDER = ['News', 'Sports', 'Movies', 'Kids', 'Religious', 'Music', 'Documentary'];

const player = document.getElementById('player');
const currentChannelEl = document.getElementById('currentChannel');
const currentChannelDetailEl = document.getElementById('currentChannelDetail');
const channelListEl = document.getElementById('channelList');
const channelMetaEl = document.getElementById('channelMeta');
const searchInputEl = document.getElementById('searchInput');
const groupFilterEl = document.getElementById('groupFilter');
const categoryDropdownEl = document.getElementById('categoryDropdown');
const categoryPickerEl = document.getElementById('categoryPicker');
const categoryToggleBtn = document.getElementById('categoryToggleBtn');
const categoryMenuEl = document.getElementById('categoryMenu');
const selectedCategoryLabelEl = document.getElementById('selectedCategoryLabel');
const playlistUrlInputEl = document.getElementById('playlistUrlInput');
const settingsModalEl = document.getElementById('settingsModal');
const playToggleBtn = document.getElementById('playToggleBtn');
const muteToggleBtn = document.getElementById('muteToggleBtn');
const volumeRangeEl = document.getElementById('volumeRange');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const progressFillEl = document.getElementById('progressFill');
const progressKnobEl = document.getElementById('progressKnob');
const settingsModal = window.bootstrap && settingsModalEl ? new bootstrap.Modal(settingsModalEl) : null;

let channels = [];
let selectedChannel = null;
let hls = null;
let activeQuery = '';
let activeGroup = 'all';
let loadToken = 0;
let renderToken = 0;
let imageObserver = null;
let lastNonZeroVolume = 1;

function normalizeUrl(url) {
  const value = (url || '').trim();
  if (!value) return value;

  try {
    const parsed = new URL(value);
    if ((parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') && parsed.pathname.includes('/blob/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[2] === 'blob') {
        return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`;
      }
    }
  } catch {
    return value;
  }

  return value;
}

function firstString(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function parseChannels(text) {
  return new Promise((resolve) => {
    const trimmed = text.trim();
    if (!trimmed) {
      resolve([]);
      return;
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const data = JSON.parse(trimmed);
        const items = [];
        const stack = [{ value: data, fallbackGroup: null }];

        const step = () => {
          const start = performance.now();
          while (stack.length && performance.now() - start < 12) {
            const { value, fallbackGroup } = stack.pop();

            if (Array.isArray(value)) {
              for (let index = value.length - 1; index >= 0; index -= 1) {
                stack.push({ value: value[index], fallbackGroup });
              }
              continue;
            }

            if (!value || typeof value !== 'object') continue;

            const group = firstString(value, ['group', 'group_title', 'group-title', 'category', 'country']) || fallbackGroup;
            const name = firstString(value, ['name', 'title', 'channel', 'channel_name', 'channelName']);
            const url = firstString(value, ['url', 'link', 'stream', 'stream_url', 'streamUrl', 'm3u8']);
            const logo = firstString(value, ['logo', 'tvg-logo', 'tvgLogo', 'logo_url', 'logoUrl', 'image']);

            if (name && url) {
              items.push({ name, url: normalizeUrl(url), logo, group });
              continue;
            }

            const childList = value.channels || value.items || value.data || value.playlist;
            if (childList && typeof childList === 'object') {
              stack.push({ value: childList, fallbackGroup: group });
              continue;
            }

            const entries = Object.entries(value);
            for (let index = entries.length - 1; index >= 0; index -= 1) {
              const [key, child] = entries[index];
              if (child && typeof child === 'object') {
                stack.push({ value: child, fallbackGroup: group || key });
              }
            }
          }

          if (stack.length) {
            requestAnimationFrame(step);
          } else {
            resolve(items);
          }
        };

        step();
        return;
      } catch {
        // Fall through to M3U parsing.
      }
    }

    const lines = text.split(/\r?\n/);
    const parsed = [];
    let current = null;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF')) {
        const info = line.substring(line.indexOf(':') + 1);
        const commaIdx = info.lastIndexOf(',');
        const attrs = commaIdx >= 0 ? info.substring(0, commaIdx) : info;
        const name = commaIdx >= 0 ? info.substring(commaIdx + 1).trim() : 'Unnamed';
        const capture = (key) => {
          const match = attrs.match(new RegExp(`${key}="([^"]*)"`, 'i'));
          return match ? match[1].trim() : undefined;
        };

        current = {
          name,
          logo: capture('tvg-logo'),
          group: capture('group-title'),
        };
      } else if (!line.startsWith('#') && current) {
        current.url = normalizeUrl(line);
        parsed.push(current);
        current = null;
      }
    }

    resolve(parsed);
  });
}

function getFilteredChannels() {
  const q = activeQuery.toLowerCase().trim();
  return channels.filter((channel) => {
    const haystack = `${channel.name || ''} ${channel.group || ''}`.toLowerCase();
    const matchesQuery = !q || haystack.includes(q);
    const matchesGroup = activeGroup === 'all' || channel.group === activeGroup;
    return matchesQuery && matchesGroup;
  });
}

function setChannelMeta(label, total) {
  if (!channelMetaEl) return;
  const countText = `${total} channel${total === 1 ? '' : 's'}`;
  channelMetaEl.textContent = `${label} - ${countText}`;
  channelMetaEl.title = channelMetaEl.textContent;
}

function showListMessage(message) {
  const item = document.createElement('div');
  item.className = 'list-message';
  item.textContent = message;
  channelListEl.replaceChildren(item);
}

function createFallbackThumb() {
  const fallback = document.createElement('div');
  fallback.className = 'thumb-fallback';
  fallback.textContent = 'TV';
  return fallback;
}

function createChannelItem(channel) {
  const isActive = selectedChannel && selectedChannel.url === channel.url;
  const group = channel.group || 'General';
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `channel-item${isActive ? ' active' : ''}`;
  item.dataset.url = channel.url;
  item.title = channel.name;
  item.setAttribute('aria-pressed', isActive ? 'true' : 'false');

  const thumb = document.createElement('div');
  thumb.className = 'thumb';

  if (channel.logo) {
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.dataset.src = channel.logo;
    img.onerror = () => {
      thumb.replaceChildren(createFallbackThumb());
    };
    thumb.appendChild(img);

    if (imageObserver) {
      imageObserver.observe(img);
    } else {
      img.src = channel.logo;
      img.removeAttribute('data-src');
    }
  } else {
    thumb.appendChild(createFallbackThumb());
  }

  const copy = document.createElement('span');
  copy.className = 'channel-copy';

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = channel.name;

  const groupEl = document.createElement('span');
  groupEl.className = 'channel-group';
  groupEl.textContent = group;

  copy.appendChild(label);
  copy.appendChild(groupEl);

  item.appendChild(thumb);
  item.appendChild(copy);
  return item;
}

function renderChannels() {
  const token = ++renderToken;

  requestAnimationFrame(() => {
    if (token !== renderToken) return;

    const filtered = getFilteredChannels();
    const total = filtered.length;
    setChannelMeta(activeGroup === 'all' ? 'All' : activeGroup, total);

    if (!total) {
      showListMessage('No channels found.');
      return;
    }

    channelListEl.replaceChildren();
    let index = 0;

    const renderBatch = () => {
      if (token !== renderToken) return;

      const end = Math.min(index + RENDER_BATCH_SIZE, total);
      const frag = document.createDocumentFragment();

      for (let cursor = index; cursor < end; cursor += 1) {
        frag.appendChild(createChannelItem(filtered[cursor]));
      }

      channelListEl.appendChild(frag);
      index = end;

      if (index < total) {
        window.setTimeout(renderBatch, 16);
      }
    };

    renderBatch();
  });
}

function updateChannelDisplay(channel) {
  if (!channel) return;
  currentChannelEl.textContent = channel.name;
  currentChannelDetailEl.textContent = channel.group || 'Live TV';
}

function syncActiveChannelItem() {
  const items = channelListEl.querySelectorAll('.channel-item');
  for (const item of items) {
    const isActive = selectedChannel && item.dataset.url === selectedChannel.url;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
}

function setChannel(channel, shouldRender = false) {
  selectedChannel = channel;
  updateChannelDisplay(channel);
  syncActiveChannelItem();
  playChannel(channel.url);

  if (shouldRender) {
    renderChannels();
  }
}

function updatePlayButton() {
  if (!playToggleBtn) return;
  const isPlaying = !player.paused && !player.ended;
  playToggleBtn.classList.toggle('is-playing', isPlaying);
  playToggleBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
}

function triggerVolumePulse() {
  if (!muteToggleBtn) return;
  muteToggleBtn.classList.remove('volume-pulse');
  void muteToggleBtn.offsetWidth;
  muteToggleBtn.classList.add('volume-pulse');
}

function updateVolumeUI(animate = false) {
  const isMuted = player.muted || player.volume === 0;
  const visibleVolume = isMuted ? 0 : player.volume;
  const volumePercent = `${Math.round(visibleVolume * 100)}%`;

  if (muteToggleBtn) {
    muteToggleBtn.classList.toggle('is-muted', isMuted);
    muteToggleBtn.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
    muteToggleBtn.title = isMuted ? 'Unmute' : 'Mute';
  }

  if (volumeRangeEl) {
    volumeRangeEl.value = String(visibleVolume);
    volumeRangeEl.style.setProperty('--volume-percent', volumePercent);
    volumeRangeEl.classList.toggle('is-muted', isMuted);
    volumeRangeEl.setAttribute('aria-valuetext', isMuted ? 'Muted' : `${volumePercent} volume`);
  }

  if (animate) {
    triggerVolumePulse();
  }
}

function updateProgress() {
  if (!progressFillEl || !progressKnobEl) return;

  let progress = 0.34;
  if (Number.isFinite(player.duration) && player.duration > 0) {
    progress = Math.min(Math.max(player.currentTime / player.duration, 0), 1);
  }

  const percent = `${progress * 100}%`;
  progressFillEl.style.width = percent;
  progressKnobEl.style.left = percent;
}

function playChannel(url) {
  if (!url) return;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  player.removeAttribute('src');
  player.load();

  if (window.Hls && Hls.isSupported()) {
    hls = new Hls({ enableWorker: true });
    hls.loadSource(url);
    hls.attachMedia(player);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      player.play().catch(() => {});
      updatePlayButton();
    });
  } else {
    player.src = url;
    player.play().catch(() => {});
  }

  updateProgress();
  updatePlayButton();
}

function setupImageObserver() {
  if (imageObserver) {
    imageObserver.disconnect();
    imageObserver = null;
  }

  if (!('IntersectionObserver' in window)) return;

  imageObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const img = entry.target;
      const src = img.dataset && img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
      imageObserver.unobserve(img);
    }
  }, { rootMargin: '260px' });
}

function compareGroups(a, b) {
  const aIndex = PREFERRED_GROUP_ORDER.findIndex((group) => group.toLowerCase() === String(a).toLowerCase());
  const bIndex = PREFERRED_GROUP_ORDER.findIndex((group) => group.toLowerCase() === String(b).toLowerCase());

  if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
  if (aIndex >= 0) return -1;
  if (bIndex >= 0) return 1;
  return String(a).localeCompare(String(b));
}

function buildGroups() {
  const groupSet = new Set(channels.map((channel) => channel.group).filter(Boolean));
  return ['all', ...Array.from(groupSet).sort(compareGroups)];
}

function populateGroupOptions(select, groups, allLabel) {
  if (!select) return;

  const fragment = document.createDocumentFragment();
  for (const group of groups) {
    const option = document.createElement('option');
    option.value = group;
    option.textContent = group === 'all' ? allLabel : group;
    fragment.appendChild(option);
  }

  select.replaceChildren(fragment);
  select.value = groups.includes(activeGroup) ? activeGroup : 'all';
}

function categoryLabel(group) {
  return group === 'all' ? 'All categories' : group;
}

function closeCategoryMenu() {
  if (!categoryPickerEl || !categoryToggleBtn) return;
  categoryPickerEl.classList.remove('open');
  categoryToggleBtn.setAttribute('aria-expanded', 'false');
}

function toggleCategoryMenu() {
  if (!categoryPickerEl || !categoryToggleBtn) return;
  const isOpen = categoryPickerEl.classList.toggle('open');
  categoryToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function syncCategoryMenu() {
  if (selectedCategoryLabelEl) {
    selectedCategoryLabelEl.textContent = categoryLabel(activeGroup);
  }

  if (!categoryMenuEl) return;

  const options = categoryMenuEl.querySelectorAll('.category-option');
  for (const option of options) {
    const isActive = option.dataset.group === activeGroup;
    option.classList.toggle('active', isActive);
    option.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
}

function renderCategoryMenu(groups) {
  if (!categoryMenuEl) return;

  const fragment = document.createDocumentFragment();
  for (const group of groups) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'category-option';
    option.role = 'option';
    option.dataset.group = group;
    option.textContent = categoryLabel(group);
    fragment.appendChild(option);
  }

  categoryMenuEl.replaceChildren(fragment);
  syncCategoryMenu();
}

function setActiveGroup(group) {
  activeGroup = group;
  if (categoryDropdownEl) categoryDropdownEl.value = group;
  if (groupFilterEl) groupFilterEl.value = group;
  syncCategoryMenu();
  renderChannels();
}

async function loadPlaylist(url) {
  const source = normalizeUrl(url || DEFAULT_PLAYLIST);
  const token = ++loadToken;
  renderToken += 1;

  if (channelMetaEl) channelMetaEl.textContent = 'Loading channels...';
  showListMessage('Loading channels...');

  try {
    const response = await fetch(source, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    if (token !== loadToken) return;

    const parsed = await parseChannels(text);
    if (token !== loadToken) return;

    channels = parsed.filter((channel) => channel.name && channel.url);
    const groups = buildGroups();
    if (!groups.includes(activeGroup)) activeGroup = 'all';

    populateGroupOptions(groupFilterEl, groups, 'All groups');
    populateGroupOptions(categoryDropdownEl, groups, 'All categories');
    renderCategoryMenu(groups);
    setupImageObserver();

    if (channels.length) {
      setChannel(channels[0], false);
    } else {
      selectedChannel = null;
      currentChannelEl.textContent = 'No channels found.';
      currentChannelDetailEl.textContent = 'Try another playlist source.';
    }

    renderChannels();
  } catch (error) {
    if (token !== loadToken) return;

    channels = [];
    selectedChannel = null;
    currentChannelEl.textContent = error.message || 'Unable to load playlist.';
    currentChannelDetailEl.textContent = 'Check the playlist URL and try again.';
    setChannelMeta('All', 0);
    renderCategoryMenu(['all']);
    showListMessage('Unable to load channels. Check the playlist URL and try again.');
  }
}

function currentPlaylistUrl() {
  return normalizeUrl((playlistUrlInputEl && playlistUrlInputEl.value) || DEFAULT_PLAYLIST) || DEFAULT_PLAYLIST;
}

function initializePlayerControls() {
  player.controls = false;
  player.volume = 1;
  player.muted = false;
  lastNonZeroVolume = 1;
  if (volumeRangeEl) {
    volumeRangeEl.value = '1';
  }

  playToggleBtn?.addEventListener('click', () => {
    if (player.paused || player.ended) {
      player.play().catch(() => {});
    } else {
      player.pause();
    }
    updatePlayButton();
  });

  muteToggleBtn?.addEventListener('click', () => {
    if (player.muted || player.volume === 0) {
      player.volume = lastNonZeroVolume || 1;
      player.muted = false;
    } else {
      lastNonZeroVolume = player.volume || lastNonZeroVolume;
      player.muted = true;
    }
    updateVolumeUI(true);
  });

  volumeRangeEl?.addEventListener('input', (event) => {
    const nextVolume = Number(event.target.value);
    player.volume = nextVolume;
    player.muted = nextVolume === 0;
    if (nextVolume > 0) {
      lastNonZeroVolume = nextVolume;
    }
    updateVolumeUI(true);
  });

  fullscreenBtn?.addEventListener('click', () => {
    const target = document.getElementById('playerShell') || player;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => {});
    }
  });

  player.addEventListener('play', updatePlayButton);
  player.addEventListener('pause', updatePlayButton);
  player.addEventListener('ended', updatePlayButton);
  player.addEventListener('volumechange', () => updateVolumeUI());
  player.addEventListener('timeupdate', updateProgress);
  player.addEventListener('loadedmetadata', updateProgress);
  updatePlayButton();
  updateVolumeUI();
  updateProgress();
}

function initialize() {
  const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_PLAYLIST;
  playlistUrlInputEl.value = saved;
  initializePlayerControls();
  loadPlaylist(saved);
}

if (searchInputEl) {
  searchInputEl.addEventListener('input', (event) => {
    activeQuery = event.target.value;
    renderChannels();
  });
}

if (groupFilterEl) {
  groupFilterEl.addEventListener('change', (event) => {
    setActiveGroup(event.target.value);
  });
}

if (categoryDropdownEl) {
  categoryDropdownEl.addEventListener('change', (event) => {
    setActiveGroup(event.target.value);
  });
}

categoryToggleBtn?.addEventListener('click', toggleCategoryMenu);

categoryMenuEl?.addEventListener('click', (event) => {
  const option = event.target.closest('.category-option');
  if (!option) return;

  setActiveGroup(option.dataset.group);
  closeCategoryMenu();
});

document.addEventListener('click', (event) => {
  if (!categoryPickerEl || categoryPickerEl.contains(event.target)) return;
  closeCategoryMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCategoryMenu();
});

channelListEl.addEventListener('click', (event) => {
  const el = event.target.closest('[data-url]');
  if (!el) return;

  const channel = channels.find((entry) => entry.url === el.dataset.url);
  if (channel) setChannel(channel, false);
});

document.getElementById('reloadBtn').addEventListener('click', () => {
  const url = currentPlaylistUrl();
  localStorage.setItem(STORAGE_KEY, url);
  playlistUrlInputEl.value = url;
  loadPlaylist(url);
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  if (settingsModal) settingsModal.show();
});

document.getElementById('savePlaylistBtn').addEventListener('click', () => {
  const url = currentPlaylistUrl();
  localStorage.setItem(STORAGE_KEY, url);
  playlistUrlInputEl.value = url;
  if (settingsModal) settingsModal.hide();
  loadPlaylist(url);
});

document.getElementById('resetPlaylistBtn').addEventListener('click', () => {
  playlistUrlInputEl.value = DEFAULT_PLAYLIST;
});

initialize();
