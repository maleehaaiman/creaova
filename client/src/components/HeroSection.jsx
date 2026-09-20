import React, { useEffect, useRef } from 'react';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4';
const POSTER_URL = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp';

const Arrow = () => (
  <svg className="hero-arrow" viewBox="0 0 12 10" fill="none" aria-hidden="true">
    <path d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HeroSection({ onGetStarted, onExploreCreators }) {
  const videoA = useRef(null);
  const videoB = useRef(null);

  useEffect(() => {
    const currentVideo = videoA.current;
    const nextVideo = videoB.current;
    if (!currentVideo || !nextVideo) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentVideo.removeAttribute('autoplay');
      currentVideo.pause();
      nextVideo.pause();
      try { currentVideo.currentTime = 0; } catch { /* Video metadata may not be ready. */ }
      return undefined;
    }
    let active = currentVideo;
    let standby = nextVideo;
    let swapping = false;
    let swapTimer;
    const fadeDuration = 0.9;
    const play = (video) => video.play().catch(() => {});
    const tick = () => {
      if (swapping || !active.duration || active.duration - active.currentTime > fadeDuration) return;
      swapping = true;
      const outgoing = active;
      standby.currentTime = 0;
      play(standby);
      standby.classList.add('is-active');
      outgoing.classList.remove('is-active');
      [active, standby] = [standby, outgoing];
      swapTimer = window.setTimeout(() => {
        outgoing.pause();
        outgoing.currentTime = 0;
        swapping = false;
      }, fadeDuration * 1000 + 100);
    };
    play(currentVideo);
    currentVideo.addEventListener('timeupdate', tick);
    nextVideo.addEventListener('timeupdate', tick);
    return () => {
      currentVideo.removeEventListener('timeupdate', tick);
      nextVideo.removeEventListener('timeupdate', tick);
      window.clearTimeout(swapTimer);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    root.classList.add('hero-anim');
    const timer = window.setTimeout(() => root.classList.add('hero-ready'), 90);
    return () => {
      window.clearTimeout(timer);
      root.classList.remove('hero-anim', 'hero-ready');
    };
  }, []);

  return (
    <section className="hero-stage">
      <div className="hero-bg" role="img" aria-label="A violet dot-matrix globe rotating against a starfield">
        <video ref={videoA} className="hero-video is-active" muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" poster={POSTER_URL}>
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <video ref={videoB} className="hero-video" muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" poster={POSTER_URL}>
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </div>
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-inner">
        <h1>
          <span className="hero-line"><span>Creator-brand</span></span>
          <span className="hero-line"><span>commerce</span></span>
        </h1>
        <p className="hero-subtitle">
          Find the right creators, launch high-impact campaigns,<br />
          and manage every collaboration in one place.<br />
          Built for brands and creators ready to grow together.
        </p>
        <div className="hero-ctas">
          <button type="button" className="hero-btn hero-btn-primary" onClick={onGetStarted}>
            Get Started <Arrow />
          </button>
          <button type="button" className="hero-btn hero-btn-ghost" onClick={onExploreCreators}>
            Explore Creators <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}
