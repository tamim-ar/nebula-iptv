const DEFAULT_PLAYLIST = 'https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/Bangladesh/LiveTV.json';
const STORAGE_KEY = 'nebula-static-playlist';

const player = document.getElementById('player');
const currentChannelEl = document.getElementById('currentChannel');
const currentChannelDetailEl = document.getElementById('currentChannelDetail');
const channelListEl = document.getElementById('channelList');
const channelMetaEl = document.getElementById('channelMeta');
const statusBadgeEl = document.getElementById('statusBadge');
const searchInputEl = document.getElementById('searchInput');
const groupFilterEl = document.getElementById('groupFilter');
const playlistUrlInputEl = document.getElementById('playlistUrlInput');
const settingsModalEl = document.getElementById('settingsModal');
const playerShellEl = document.getElementById('playerShell');
const settingsModal = new bootstrap.Modal(settingsModalEl);

let channels = [];
let selectedChannel = null;
let hls = null;
let visibleCount = 120;
let activeQuery = '';
let activeGroup = 'all';
let loadToken = 0;

function normalizeUrl(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if ((parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') && parsed.pathname.includes('/blob/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[2] === 'blob') {
        return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`;
      }
    }
  } catch {}
  return url;
}

function parseChannels(text) {
  return new Promise((resolve) => {
    const trimmed = text.trim();
    if (!trimmed) {
      resolve([]);
      return;
    }

    if (trimmed.startsWith('{')) {
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
            if (value && typeof value === 'object') {
              if (value.channels && typeof value.channels === 'object') {
                stack.push({ value: value.channels, fallbackGroup });
                continue;
              }
              const name = typeof value.name === 'string' ? value.name : null;
              const url = typeof value.url === 'string' ? value.url : null;
              const logo = typeof value.logo === 'string' ? value.logo : null;
              const group = typeof value.group === 'string' ? value.group : fallbackGroup;
              if (name && url) {
                items.push({ name, url, logo, group });
                continue;
              }
              const entries = Object.entries(value);
              for (let index = entries.length - 1; index >= 0; index -= 1) {
                const [key, child] = entries[index];
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
      } catch {}
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
          const m = attrs.match(new RegExp(`${key}="([^"]*)"`, 'i'));
          return m ? m[1] : undefined;
        };
        current = { name, logo: capture('tvg-logo'), group: capture('group-title') };
      } else if (!line.startsWith('#') && current) {
        current.url = line;
        parsed.push(current);
        current = null;
      }
    }
    resolve(parsed);
  });
}

function getFilteredChannels() {
  const query = activeQuery.toLowerCase().trim();
  return channels.filter((channel) => {
    const matchesQuery = !query || channel.name.toLowerCase().includes(query);
    const matchesGroup = activeGroup === 'all' || channel.group === activeGroup;
    return matchesQuery && matchesGroup;
  });
}

function renderChannels() {
  requestAnimationFrame(() => {
    const filtered = getFilteredChannels();
    const shown = filtered.slice(0, visibleCount);
    channelMetaEl.textContent = `${filtered.length} visible • ${channels.length} total`;

    if (!filtered.length) {
      channelListEl.innerHTML = '<div class="text-slate-400 text-sm">No channels found.</div>';
      return;
    }

    channelListEl.innerHTML = shown.map((channel) => {
      const active = selectedChannel && selectedChannel.url === channel.url;
      return `
        <button class="list-group-item list-group-item-action bg-slate-950/70 border border-white/10 text-start channel-item ${active ? 'active' : ''}" data-url="${channel.url}">
          <div class="d-flex align-items-center gap-3">
            <div class="flex-shrink-0">
              ${channel.logo ? `<img src="${channel.logo}" alt="" loading="lazy" decoding="async" class="rounded" style="width:40px;height:40px;object-fit:contain;background:#0f172a;" onerror="this.style.display='none'" />` : '<div class="rounded d-flex align-items-center justify-content-center" style="width:40px;height:40px;background:#0f172a"><span class="text-slate-400">TV</span></div>'}
            </div>
            <div class="min-w-0">
              <div class="fw-semibold text-slate-100">${channel.name}</div>
              <div class="text-xs text-slate-400">${channel.group || 'General'}</div>
            </div>
          </div>
        </button>
      `;
    }).join('');

    if (shown.length < filtered.length) {
      channelListEl.insertAdjacentHTML('beforeend', '<div class="text-center py-2"><button id="loadMoreBtn" class="btn btn-sm btn-outline-light">Load more</button></div>');
      document.getElementById('loadMoreBtn').addEventListener('click', () => {
        visibleCount += 80;
        renderChannels();
      });
    }
  });
}

function updateChannelDisplay(channel) {
  if (!channel) return;
  currentChannelEl.textContent = channel.name;
  currentChannelDetailEl.textContent = `${channel.group || 'General'} • ${channel.name}`;
}

function setChannel(channel) {
  selectedChannel = channel;
  updateChannelDisplay(channel);
  playChannel(channel.url);
  renderChannels();
}

function playChannel(url) {
  if (!url) return;
  if (hls) {
    hls.destroy();
    hls = null;
  }
  if (window.Hls && Hls.isSupported()) {
    hls = new Hls({ enableWorker: true });
    hls.loadSource(url);
    hls.attachMedia(player);
  } else {
    player.src = url;
  }
  player.play().catch(() => {});
}

async function loadPlaylist(url) {
  const token = ++loadToken;
  visibleCount = 120;
  statusBadgeEl.textContent = 'Loading';
  statusBadgeEl.className = 'status-pill badge bg-warning text-dark';
  channelListEl.innerHTML = '<div class="text-slate-400 text-sm">Loading channels…</div>';
  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (token !== loadToken) return;
    const parsed = await parseChannels(text);
    if (token !== loadToken) return;
    channels = parsed;
    if (channels.length) {
      setChannel(channels[0]);
    } else {
      currentChannelEl.textContent = 'No channels found.';
    }
    const groups = ['all', ...new Set(channels.map((channel) => channel.group).filter(Boolean))];
    groupFilterEl.innerHTML = groups.map((group) => `<option value="${group}">${group === 'all' ? 'All groups' : group}</option>`).join('');
    renderChannels();
    statusBadgeEl.textContent = 'Live';
    statusBadgeEl.className = 'status-pill badge bg-emerald-600 text-white';
  } catch (error) {
    if (token !== loadToken) return;
    currentChannelEl.textContent = error.message || 'Unable to load playlist.';
    statusBadgeEl.textContent = 'Error';
    statusBadgeEl.className = 'status-pill badge bg-danger text-white';
  }
}

function initialize() {
  const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_PLAYLIST;
  playlistUrlInputEl.value = saved;
  loadPlaylist(normalizeUrl(saved));
}

searchInputEl.addEventListener('input', (event) => {
  activeQuery = event.target.value;
  visibleCount = 120;
  renderChannels();
});
groupFilterEl.addEventListener('change', (event) => {
  activeGroup = event.target.value;
  visibleCount = 120;
  renderChannels();
});
channelListEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-url]');
  if (!button) return;
  const channel = channels.find((entry) => entry.url === button.dataset.url);
  if (channel) setChannel(channel);
});
document.getElementById('reloadBtn').addEventListener('click', () => {
  const url = normalizeUrl(playlistUrlInputEl.value || DEFAULT_PLAYLIST);
  localStorage.setItem(STORAGE_KEY, url);
  loadPlaylist(url);
});
document.getElementById('settingsBtn').addEventListener('click', () => settingsModal.show());
document.getElementById('savePlaylistBtn').addEventListener('click', () => {
  const url = normalizeUrl(playlistUrlInputEl.value.trim());
  localStorage.setItem(STORAGE_KEY, url);
  settingsModal.hide();
  loadPlaylist(url);
});
document.getElementById('resetPlaylistBtn').addEventListener('click', () => {
  playlistUrlInputEl.value = DEFAULT_PLAYLIST;
});

initialize();
