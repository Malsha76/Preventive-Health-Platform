import React, { useRef, useEffect } from "react";
import "./HeroVideoBackground.css";

// Local file (optional): place hospital-hero.mp4 in front-end/public/videos/
const LOCAL_VIDEO = `${process.env.PUBLIC_URL}/videos/hospital-hero.mp4`;
// Free stock: doctor in hospital corridor (Pexels – free for personal/educational use)
const REMOTE_VIDEO =
  "https://videos.pexels.com/video-files/7550920/7550920-sd_640_360_25fps.mp4";

/**
 * Full-width hospital-themed hero background with subtle 3D depth.
 * Uses local video when available; falls back to Pexels CDN.
 */
export default function HeroVideoBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("error", () => {
      if (video.dataset.fallbackApplied) return;
      video.dataset.fallbackApplied = "true";
      if (video.src !== REMOTE_VIDEO) {
        video.src = REMOTE_VIDEO;
        tryPlay();
      }
    });

    tryPlay();
  }, []);

  return (
    <div className="hero-video-bg" aria-hidden="true">
      <div className="hero-video-bg__scene">
        <video
          ref={videoRef}
          className="hero-video-bg__video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={LOCAL_VIDEO} type="video/mp4" />
          <source src={REMOTE_VIDEO} type="video/mp4" />
        </video>
      </div>

      {/* Hospital-themed gradient + depth overlay */}
      <div className="hero-video-bg__overlay" />

      {/* Floating 3D medical shapes */}
      <div className="hero-video-bg__shapes">
        <div className="hero-shape hero-shape--cross" />
        <div className="hero-shape hero-shape--ring" />
        <div className="hero-shape hero-shape--dna" />
        <div className="hero-shape hero-shape--pulse" />
      </div>

      {/* Soft grid for clinical / tech feel */}
      <div className="hero-video-bg__grid" />
    </div>
  );
}
