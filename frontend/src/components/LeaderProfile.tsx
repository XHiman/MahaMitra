import React from "react";
import "./LeaderProfile.css"

const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  const target = e.currentTarget as HTMLDivElement;
  target.style.transform = "scale(1.05)";
  target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  target.classList.add('video-active');
  const video = target.querySelector('video') as HTMLVideoElement | null;
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (video) {
    video.style.opacity = '1';
    if (!prefersReduced) video.play().catch(() => {});
  }
}

const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  const target = e.currentTarget as HTMLDivElement;
  target.style.transform = "scale(1)";
  target.style.boxShadow = "none";
  target.classList.remove('video-active');
  const video = target.querySelector('video') as HTMLVideoElement | null;
  if (video) {
    try { video.pause(); } catch (_) {}
    video.currentTime = 0;
    video.style.opacity = '0';
  }
}

const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, href: string) => {
  const key = e.key;
  if (key === 'Enter' || key === ' ') {
    e.preventDefault();
    window.location.href = href;
  }
}

function LeaderProfile() {
  return (
    <div className="leader-profile">
      <h2>Leader Profile</h2>
      <div className="Profile">
            <div className="CMBanner" role="button" tabIndex={0} aria-label="Open CM page for Shri. Devendra Fadnavis" onClick={() => window.location.href='/CM-Page'} onKeyDown={(e) => handleKeyDown(e, '/CM-Page')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <img src="/cm.jpg" alt="Shri. Devendra Fadnavis" className="CMPhoto"/>
                <video className="CMVideo" muted loop playsInline poster="/cm.jpg" aria-hidden="true">
                  <source src="/videos/fadnavis.mp4" type="video/mp4" />
                </video>
                <h3>Shri. Devendra Fadnavis</h3>
                <h5>Hon. CM, Maharashtra</h5>
                {/* <p className="Quote-mr">'मित्रा' या आमच्या संस्थेमार्फत आम्ही जास्तीत जास्त व्यावसायिकांशी संवाद साधत आहोत.</p> */}
                <p className="Quote-en">" With MITRA we are engaging with more businesses and industries. "</p>
            </div>
            <div className="CMBanner" role="button" tabIndex={0} aria-label="Open DyCM1 page for Shri. Eknath Shinde" onClick={() => window.location.href='/DyCM1-Page'} onKeyDown={(e) => handleKeyDown(e, '/DyCM1-Page')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <img src="/dycmES.jpg" alt="Shri. Eknath Shinde" className="CMPhoto" />
                <video className="CMVideo" muted loop playsInline poster="/dycmES.jpg" aria-hidden="true">
                  <source src="/videos/fadnavis.mp4" type="video/mp4" />
                </video>
                <h3>Shri. Eknath Shinde</h3>
                <h5>Hon. DCM, Maharashtra</h5>
                <p className="Quote-en">" With MITRA we are engaging with more businesses and industries. "</p>
            </div>
            <div className="CMBanner" role="button" tabIndex={0} aria-label="Open DyCM2 page for Smt. Sunitra Pawar" onClick={() => window.location.href='/DyCM2-Page'} onKeyDown={(e) => handleKeyDown(e, '/DyCM2-Page')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <img src="/dycmSP.jpg" alt="Smt. Sunetra Pawar" className="CMPhoto"/>
                <video className="CMVideo" muted loop playsInline poster="/dycmAP.jpg" aria-hidden="true">
                  <source src="/videos/fadnavis.mp4" type="video/mp4" />
                </video>
                <h3>Smt. Sunitra Pawar</h3>
                <h5>Hon. DCM, Maharashtra</h5>
                <p className="Quote-en">" With MITRA we are engaging with more businesses and industries. "</p>
            </div>
      </div>
    </div>
  )
}

export default LeaderProfile