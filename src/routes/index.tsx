import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Tv, Search, Settings as SettingsIcon, Loader2, X, PlayCircle } from "lucide-react";
import { parseM3U, type Channel } from "@/lib/m3u";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEFAULT_PLAYLIST = "https://iptv-org.github.io/iptv/raw/bd.m3u";
const STORAGE_KEY = "iptv:playlist-url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nebula IPTV — Modern Web Player" },
      { name: "description", content: "Stream live IPTV channels from any M3U playlist in a beautiful, fast web player." },
    ],
  }),
  component: Index,
});

function Index() {
  const [playlistUrl, setPlaylistUrl] = useState(DEFAULT_PLAYLIST);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("All");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_PLAYLIST;
    setPlaylistUrl(saved);
    setDraftUrl(saved);
  }, []);

  useEffect(() => {
    if (!playlistUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(playlistUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parseM3U(text);
        setChannels(parsed);
        setSelected(parsed[0] ?? null);
      })
      .catch((e) => !cancelled && setError(e.message || "Failed to load playlist"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [playlistUrl]);

  const groups = useMemo(() => {
    const s = new Set<string>();
    channels.forEach((c) => c.group && s.add(c.group));
    return ["All", ...Array.from(s).sort()];
  }, [channels]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return channels.filter((c) => {
      if (group !== "All" && c.group !== group) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [channels, query, group]);

  const savePlaylist = () => {
    const url = draftUrl.trim();
    if (!url) return;
    localStorage.setItem(STORAGE_KEY, url);
    setPlaylistUrl(url);
    setSettingsOpen(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Tv className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="truncate text-lg font-bold gradient-text sm:text-xl">Nebula IPTV</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search channels…"
                className="w-56 pl-9 md:w-72"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Settings">
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels…"
              className="pl-9"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_360px]">
        {/* Player */}
        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl glass aspect-video">
            {selected ? (
              <VideoPlayer src={selected.url} />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <div className="text-center">
                  <PlayCircle className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-2 text-sm">Select a channel to start watching</p>
                </div>
              </div>
            )}
          </div>
          {selected && (
            <div className="flex min-w-0 items-center gap-3 rounded-xl glass p-3">
              {selected.logo ? (
                <img
                  src={selected.logo}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg bg-secondary object-contain p-1"
                  onError={(e) => ((e.currentTarget.style.display = "none"))}
                />
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary">
                  <Tv className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{selected.name}</h2>
                {selected.group && (
                  <p className="truncate text-xs text-muted-foreground">{selected.group}</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Channel list */}
        <aside className="rounded-2xl glass overflow-hidden flex flex-col max-h-[calc(100vh-7rem)] min-h-[400px]">
          <div className="border-b border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Channels</h3>
              <span className="text-xs text-muted-foreground">{filtered.length}</span>
            </div>
            {groups.length > 1 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {groups.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroup(g)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                      group === g
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="grid place-items-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {error && (
              <div className="p-4 text-sm text-destructive">Error: {error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No channels found.</div>
            )}
            <ul className="divide-y divide-border">
              {filtered.map((c, i) => {
                const active = selected?.url === c.url;
                return (
                  <li key={`${c.url}-${i}`}>
                    <button
                      onClick={() => setSelected(c)}
                      className={`grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 p-3 text-left transition-colors ${
                        active ? "bg-primary/15" : "hover:bg-secondary/60"
                      }`}
                    >
                      {c.logo ? (
                        <img
                          src={c.logo}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded-md bg-secondary object-contain p-0.5"
                          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                        />
                      ) : (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary">
                          <Tv className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        {c.group && (
                          <div className="truncate text-xs text-muted-foreground">{c.group}</div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </main>

      {/* Settings modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl glass p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">Playlist URL (M3U)</label>
              <Input
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
              />
              <p className="text-xs text-muted-foreground">
                Paste any public M3U/M3U8 playlist URL. It's saved locally in your browser.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraftUrl(DEFAULT_PLAYLIST)}>
                Reset
              </Button>
              <Button onClick={savePlaylist}>Save & Load</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
