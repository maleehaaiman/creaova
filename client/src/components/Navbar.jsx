import React, { useState } from 'react';
import { ArrowRight, Bell, Menu, MessageCircle, X } from 'lucide-react';

export default function Navbar({ user, activeTab, setActiveTab, onOpenAuth, onLogout, onOpenAccountPanel, onOpenActivity }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const goTo = (tab) => { setActiveTab(tab); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openAuth = () => { setMenuOpen(false); onOpenAuth(); };
  const profileImage = user?.profile?.profile_image || user?.profile?.logo || user?.profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`;

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <button type="button" className="site-logo" onClick={() => goTo('explore')} aria-label="Go to Creova home">Creova</button>
        <nav className="desktop-nav" aria-label="Primary">
          <button type="button" className={activeTab === 'explore' ? 'nav-link is-active' : 'nav-link'} onClick={() => goTo('explore')}>Creators</button>
          <button type="button" className={activeTab === 'marketplace' ? 'nav-link is-active' : 'nav-link'} onClick={() => goTo('marketplace')}>Marketplace</button>
        </nav>
        <div className="nav-activity" aria-label="Activity">
          <button type="button" className="nav-icon-button" aria-label="Messages" title="Messages" onClick={() => onOpenActivity('messages')}>
            <MessageCircle size={17} />
          </button>
          <button type="button" className="nav-icon-button" aria-label="Notifications" title="Notifications" onClick={() => onOpenActivity('notifications')}>
            <Bell size={17} />
          </button>
        </div>
        <div className="nav-actions">
          {user ? <>
            <button type="button" style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', padding: 0, border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer' }} aria-label="Open profile menu" onClick={() => onOpenAccountPanel('profile')}>
              <img src={profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          </> : <>
            <button type="button" className="nav-login" onClick={openAuth}>Log in</button>
            <button type="button" className="nav-start" onClick={openAuth}>Get Started <ArrowRight /></button>
          </>}
        </div>
        <button type="button" className="nav-burger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>
      <nav id="mobile-menu" className={menuOpen ? 'mobile-menu is-open' : 'mobile-menu'} aria-label="Mobile">
        <button type="button" onClick={() => goTo('explore')}>Creators</button>
        <button type="button" onClick={() => goTo('marketplace')}>Marketplace</button>
        <div className="mobile-divider" />
        {user ? (
          <>
            <button type="button" onClick={() => onOpenAccountPanel('profile')}>Profile</button>
            <button type="button" onClick={() => { onLogout(); openAuth(); }}>Switch Account</button>
            <button type="button" className="mobile-start" onClick={onLogout}>Log out <ArrowRight /></button>
          </>
        ) : (
          <button type="button" onClick={openAuth}>Log in</button>
        )}
      </nav>
    </header>
  );
}
