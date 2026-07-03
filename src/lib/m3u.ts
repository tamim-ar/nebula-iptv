export type Channel = {
  name: string;
  logo?: string;
  group?: string;
  url: string;
  tvgId?: string;
};

export function normalizePlaylistUrl(url: string): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com" || parsed.hostname === "www.github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[2] === "blob") {
        const owner = parts[0];
        const repo = parts[1];
        const ref = parts[3];
        const path = parts.slice(4).join("/");
        return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
      }
    }
  } catch {
    // Ignore invalid URLs and fall back to the original value.
  }

  return url;
}

export function parsePlaylist(text: string): Channel[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{")) {
    try {
      const payload = JSON.parse(trimmed) as unknown;
      return parseJsonPlaylist(payload);
    } catch {
      // Fall back to M3U parsing if the content is not valid JSON.
    }
  }

  return parseM3U(text);
}

function parseJsonPlaylist(payload: unknown, fallbackGroup?: string): Channel[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => parseJsonPlaylist(entry, fallbackGroup));
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (record.channels && typeof record.channels === "object") {
      return parseJsonPlaylist(record.channels, fallbackGroup);
    }

    const name = typeof record.name === "string" ? record.name : undefined;
    const url = typeof record.url === "string" ? record.url : undefined;
    const logo = typeof record.logo === "string" ? record.logo : undefined;
    const group = typeof record.group === "string" ? record.group : fallbackGroup;
    const tvgId = typeof record.tvgId === "string" ? record.tvgId : undefined;

    if (name && url) {
      return [
        {
          name,
          logo,
          group,
          url,
          tvgId,
        },
      ];
    }

    return Object.entries(record).flatMap(([key, value]) =>
      parseJsonPlaylist(value, group ?? key),
    );
  }

  return [];
}

export function parseM3U(text: string): Channel[] {
  const lines = text.split(/\r?\n/);
  const channels: Channel[] = [];
  let current: Partial<Channel> | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF")) {
      const info = line.substring(line.indexOf(":") + 1);
      const commaIdx = info.lastIndexOf(",");
      const attrs = commaIdx >= 0 ? info.substring(0, commaIdx) : info;
      const name = commaIdx >= 0 ? info.substring(commaIdx + 1).trim() : "Unnamed";
      const get = (k: string) => {
        const m = attrs.match(new RegExp(`${k}="([^"]*)"`, "i"));
        return m ? m[1] : undefined;
      };
      current = {
        name,
        logo: get("tvg-logo"),
        group: get("group-title"),
        tvgId: get("tvg-id"),
      };
    } else if (!line.startsWith("#") && current) {
      current.url = line;
      channels.push(current as Channel);
      current = null;
    }
  }
  return channels;
}
