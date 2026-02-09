import React from "react";
import "./LeaderProfile.css";

export type LeaderCardProps = {
  name: string;
  title: string;
  img: string;
  video: string;
  href: string;
  label: string;
  quote?: string;
};

export const LeaderCard = ({
  name,
  title,
  img,
  video,
  href,
  label,
  quote
}: LeaderCardProps) => {

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.classList.add("video-active");

    const videoEl = card.querySelector("video") as HTMLVideoElement | null;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (videoEl) {
      videoEl.style.opacity = "1";
      if (!prefersReduced) {
        videoEl.play().catch(() => {});
      }
    }
  };

  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.classList.remove("video-active");

    const videoEl = card.querySelector("video") as HTMLVideoElement | null;
    if (videoEl) {
      try { videoEl.pause(); } catch {}
      videoEl.currentTime = 0;
      videoEl.style.opacity = "0";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.location.href = href;
    }
  };

  return (
    <div
      className="CMBanner"
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => (window.location.href = href)}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <img
        src={img}
        alt={name}
        className="CMPhoto"
        loading="lazy"
      />

      <video
        className="CMVideo"
        muted
        loop
        playsInline
        poster={img}
        aria-hidden="true"
      >
        <source src={video} type="video/mp4" />
      </video>

      <div className="Leader-file">
        <h3>{name}</h3>
        <h5>{title}</h5>
      </div>

      <p className="Quote-en">"{quote}"</p>
    </div>
  );
};
