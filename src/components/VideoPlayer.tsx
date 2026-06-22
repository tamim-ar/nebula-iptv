import { useEffect, useRef } from "react";
import Hls from "hls.js";

export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    const isM3U8 = /\.m3u8(\?|$)/i.test(src);

    if (isM3U8 && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }

    video.play().catch(() => {});

    return () => {
      if (hls) hls.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      autoPlay
      className="h-full w-full bg-black"
    />
  );
}
