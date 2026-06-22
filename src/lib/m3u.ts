export type Channel = {
  name: string;
  logo?: string;
  group?: string;
  url: string;
  tvgId?: string;
};

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
