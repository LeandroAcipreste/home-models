import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import mobileHomeVideo from "../../../video/video-home-page-mobile.mp4";

const MOBILE_HERO_STREAM = "/streams/home-mobile/index.m3u8";

type MobileHomePageProps = {
  onVideoFinished?: () => void;
};

export default function MobileHomePage({ onVideoFinished }: MobileHomePageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "metadata";

    const play = () => {
      void video.play().catch(() => {
        onVideoFinished?.();
      });
    };

    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = MOBILE_HERO_STREAM;
      video.load();
      play();
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(MOBILE_HERO_STREAM);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => play());
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        hls?.destroy();
        hls = null;
        video.src = mobileHomeVideo;
        video.load();
        play();
      });
      return () => hls?.destroy();
    }

    video.src = mobileHomeVideo;
    video.load();
    play();
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [onVideoFinished]);

  return (
    <div className="mobile-home relative flex min-h-dvh w-full flex-col overflow-hidden bg-white">
      <div
        className={`absolute inset-0 bg-white transition-opacity duration-300 ${isVideoReady ? "opacity-0" : "opacity-100"}`}
        aria-hidden
      />
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${isVideoReady ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => setIsVideoReady(true)}
        onEnded={onVideoFinished}
        onError={onVideoFinished}
      />
    </div>
  );
}
