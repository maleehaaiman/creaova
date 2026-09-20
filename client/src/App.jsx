import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CreatorDirectory from './components/CreatorDirectory';
import ProfileManager from './components/ProfileManager';
import MarketplaceOverview from './components/MarketplaceOverview';
import AuthModal from './components/AuthModal';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'marketplace' | 'my-profile'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [marketplaceSection, setMarketplaceSection] = useState('campaigns');

  // Load user on startup if token exists
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('creova_token');
      if (token) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.warn('Stored token invalid or expired:', err.message);
          localStorage.removeItem('creova_token');
        }
      }
    }
    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('creova_token');
    setUser(null);
    setActiveTab('explore');
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'creator') {
      setActiveTab('my-profile');
    } else {
      setActiveTab('marketplace');
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenActivity={(section) => {
          if (!user) {
            setIsAuthOpen(true);
            return;
          }
          setMarketplaceSection(section);
          setActiveTab('marketplace');
        }}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* Landing Hero Section */}
        {activeTab === 'explore' && !selectedCreator && (
          <HeroSection
            onGetStarted={() => setIsAuthOpen(true)}
            onExploreCreators={() => {
              const element = document.getElementById('creators-directory');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* Creator Directory View */}
        {activeTab === 'explore' && (
          <div id="creators-directory">
            <CreatorDirectory
              currentUser={user}
              onSelectCreator={(creator) => {
                setSelectedCreator(creator);
                if (user?.role === 'brand') api.recordCreatorView(creator.user_id || creator.id).catch(() => {});
              }}
            />
          </div>
        )}

        {/* Creator Detail View Modal */}
        {selectedCreator && (
          <div className="modal-overlay" onClick={() => setSelectedCreator(null)}>
            <div
              className="glass-panel"
              style={{ width: '100%', maxWidth: '600px', padding: '36px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <img
                  src={selectedCreator.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCreator.name}`}
                  alt={selectedCreator.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #6366f1', objectFit: 'cover' }}
                />
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>{selectedCreator.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedCreator.email}</p>
                  <span className="badge-niche" style={{ display: 'inline-block', marginTop: '6px' }}>
                    {selectedCreator.niche || 'Creator'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '8px' }}>About Creator</h4>
                <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {selectedCreator.bio || 'No bio specified.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                {selectedCreator.instagram && (
                  <div style={{ background: 'rgba(236,72,153,0.1)', padding: '10px 14px', borderRadius: '8px', color: '#f472b6' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Instagram</div>
                    <div style={{ fontWeight: 600 }}>@{selectedCreator.instagram.replace('@', '')}</div>
                  </div>
                )}
                {selectedCreator.youtube && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '8px', color: '#fca5a5' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>YouTube</div>
                    <div style={{ fontWeight: 600 }}>{selectedCreator.youtube}</div>
                  </div>
                )}
                {selectedCreator.tiktok && (
                  <div style={{ background: 'rgba(6,182,212,0.1)', padding: '10px 14px', borderRadius: '8px', color: '#67e8f9' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>TikTok</div>
                    <div style={{ fontWeight: 600 }}>@{selectedCreator.tiktok.replace('@', '')}</div>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <button onClick={() => setSelectedCreator(null)} className="btn-secondary">
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Creator Profile Management Tab */}
        {activeTab === 'my-profile' && user && (
          <ProfileManager
            currentUser={user}
            onProfileUpdated={(updatedUser) => setUser(updatedUser)}
          />
        )}

        {/* Marketplace & Brand Deals Overview */}
        {activeTab === 'marketplace' && (
          <MarketplaceOverview user={user} initialSubTab={marketplaceSection} />
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer" style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-dim)',
        background: 'rgba(10, 13, 20, 0.9)'
      }}>
        <div>Creova Creator & Brand Marketplace</div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
