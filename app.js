const DEFAULT_PLAYLIST = 'https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/Bangladesh/LiveTV.json';
const STORAGE_KEY = 'nebula-static-playlist';
const RENDER_BATCH_SIZE = 24;

const player = document.getElementById('player');
const currentChannelEl = document.getElementById('currentChannel');
const currentChannelDetailEl = document.getElementById('currentChannelDetail');
const channelListEl = document.getElementById('channelList');
const channelMetaEl = document.getElementById('channelMeta');
const statusBadgeEl = document.getElementById('statusBadge');
const searchInputEl = document.getElementById('searchInput');
const groupFilterEl = document.getElementById('groupFilter');
const categoryDropdownEl = document.getElementById('categoryDropdown');
const playlistUrlInputEl = document.getElementById('playlistUrlInput');
const settingsModalEl = document.getElementById('settingsModal');
const settingsModal = window.bootstrap && settingsModalEl ? new bootstrap.Modal(settingsModalEl) : null;

let channels = [];
let selectedChannel = null;
let hls = null;
let activeQuery = '';
let activeGroup = 'all';
let loadToken = 0;
let renderToken = 0;
let imageObserver = null;

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

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = channel.name;

  item.appendChild(thumb);
  item.appendChild(label);
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
  currentChannelDetailEl.textContent = `${channel.group || 'General'} - ${channel.name}`;
}

function setChannel(channel, shouldRender = true) {
  selectedChannel = channel;
  updateChannelDisplay(channel);
  playChannel(channel.url);

  if (shouldRender) {
    renderChannels();
  }
}

function playChannel(url) {
  if (!url) return;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  player.removeAttribute('src');

  if (window.Hls && Hls.isSupported()) {
    hls = new Hls({ enableWorker: true });
    hls.loadSource(url);
    hls.attachMedia(player);
  } else {
    player.src = url;
  }

  player.play().catch(() => {});
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
  }, { root: channelListEl, rootMargin: '220px' });
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

async function loadPlaylist(url) {
  const source = normalizeUrl(url || DEFAULT_PLAYLIST);
  const token = ++loadToken;
  renderToken += 1;

  if (statusBadgeEl) {
    statusBadgeEl.textContent = 'Loading';
    statusBadgeEl.className = 'status-pill badge bg-warning text-dark';
  }

  if (channelMetaEl) channelMetaEl.textContent = 'Loading...';
  showListMessage('Loading channels...');

  try {
    const response = await fetch(source, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    if (token !== loadToken) return;

    const parsed = await parseChannels(text);
    if (token !== loadToken) return;

    channels = parsed.filter((channel) => channel.name && channel.url);
    const groups = ['all', ...new Set(channels.map((channel) => channel.group).filter(Boolean))];
    if (!groups.includes(activeGroup)) activeGroup = 'all';

    populateGroupOptions(groupFilterEl, groups, 'All groups');
    populateGroupOptions(categoryDropdownEl, groups, 'All categories');
    setupImageObserver();

    if (channels.length) {
      setChannel(channels[0], false);
    } else {
      selectedChannel = null;
      currentChannelEl.textContent = 'No channels found.';
      currentChannelDetailEl.textContent = 'Try another playlist source.';
    }

    renderChannels();

    if (statusBadgeEl) {
      statusBadgeEl.textContent = 'Live';
      statusBadgeEl.className = 'status-pill badge bg-success text-white';
    }
  } catch (error) {
    if (token !== loadToken) return;

    channels = [];
    selectedChannel = null;
    currentChannelEl.textContent = error.message || 'Unable to load playlist.';
    currentChannelDetailEl.textContent = 'Check the playlist URL and try again.';
    setChannelMeta('All', 0);
    showListMessage('Unable to load channels. Check the playlist URL and try again.');

    if (statusBadgeEl) {
      statusBadgeEl.textContent = 'Error';
      statusBadgeEl.className = 'status-pill badge bg-danger text-white';
    }
  }
}

function currentPlaylistUrl() {
  return normalizeUrl((playlistUrlInputEl && playlistUrlInputEl.value) || DEFAULT_PLAYLIST) || DEFAULT_PLAYLIST;
}

function initialize() {
  const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_PLAYLIST;
  playlistUrlInputEl.value = saved;
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
    activeGroup = event.target.value;
    renderChannels();
  });
}

if (categoryDropdownEl) {
  categoryDropdownEl.addEventListener('change', (event) => {
    activeGroup = event.target.value;
    renderChannels();
  });
}

channelListEl.addEventListener('click', (event) => {
  const el = event.target.closest('[data-url]');
  if (!el) return;

  const channel = channels.find((entry) => entry.url === el.dataset.url);
  if (channel) setChannel(channel);
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
