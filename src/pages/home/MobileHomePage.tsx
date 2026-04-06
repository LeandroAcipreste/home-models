import { useEffect, useRef } from "react";
import mobileHomeVideo from "../../../video/video-home-page-mobile.mp4";
type MobileHomePageProps = {
  onVideoFinished?: () => void;
};

export default function MobileHomePage({ onVideoFinished }: MobileHomePageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => {
      onVideoFinished?.();
    });
  }, [onVideoFinished]);

  return (
    <div className="mobile-home relative flex min-h-dvh w-full flex-col overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={mobileHomeVideo}
        muted
        playsInline
        preload="auto"
        onEnded={onVideoFinished}
        onError={onVideoFinished}
      />
    </div>
  );
}
