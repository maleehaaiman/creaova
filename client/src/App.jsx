import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CreatorDirectory from './components/CreatorDirectory';
import ProfileManager from './components/ProfileManager';
import MarketplaceOverview from './components/MarketplaceOverview';
import AffiliateLinks from './components/AffiliateLinks';
import PublicProfile from './components/PublicProfile';
import MessageInterface from './components/MessageInterface';
import AffiliateProductDetail from './components/AffiliateProductDetail';
import PaymentCheckout from './components/PaymentCheckout';
import AuthModal from './components/AuthModal';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'marketplace' | 'my-profile'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [marketplaceSection, setMarketplaceSection] = useState('brands');
  const [accountPanel, setAccountPanel] = useState(null); // 'profile' | 'settings' | 'privacy'
  const [messageTarget, setMessageTarget] = useState(null);
  const [detailView, setDetailView] = useState(null);
  const [detailHistory, setDetailHistory] = useState([]);
  const [profileReturnState, setProfileReturnState] = useState(null);
  const [paymentRefreshToken, setPaymentRefreshToken] = useState(0);

  const getProfileImage = (accountUser) => {
    if (!accountUser) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';
    const profile = accountUser.profile || {};
    return profile.profile_image || profile.logo || profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${accountUser.name || 'user'}`;
  };

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
    setAccountPanel(null);
    setMessageTarget(null);
    setDetailView(null);
    setDetailHistory([]);
  };

  const openDetail = (nextView) => {
    setDetailHistory((history) => detailView ? [...history, detailView] : history);
    setDetailView(nextView);
  };

  const goBack = () => {
    setDetailHistory((history) => {
      const previous = history[history.length - 1];
      setDetailView(previous || null);
      return history.slice(0, -1);
    });
  };

  const openProfileWorkspace = () => {
    setProfileReturnState({ activeTab, marketplaceSection });
    setAccountPanel(null);
    setActiveTab('my-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeProfileWorkspace = () => {
    const previous = profileReturnState || { activeTab: 'explore', marketplaceSection: 'brands' };
    setActiveTab(previous.activeTab);
    setMarketplaceSection(previous.marketplaceSection);
    setProfileReturnState(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchAccount = () => {
    handleLogout();
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    if (messageTarget) {
      const target = messageTarget;
      setMessageTarget(null);
      setDetailHistory([]);
      setDetailView({ type: 'messages', target });
    } else if (userData.role === 'creator') {
      setActiveTab('my-profile');
    } else {
      setActiveTab('marketplace');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm('Delete your account permanently? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await api.deleteAccount();
      localStorage.removeItem('creova_token');
      setUser(null);
      setActiveTab('explore');
      setAccountPanel(null);
      setSelectedCreator(null);
      alert('Your account has been deleted.');
    } catch (err) {
      alert(err.message || 'Failed to delete account.');
    }
  };

  const handleOpenMessage = (target) => {
    if (!user) {
      setMessageTarget(target);
      setIsAuthOpen(true);
      return;
    }
    openDetail({ type: 'messages', target });
  };

  const handleOpenPublicProfile = (profile) => {
    openDetail({ type: 'profile', profile });
  };

  const handleOpenProduct = (product) => {
    openDetail({ type: 'product', product });
  };

  const handleOpenPayment = (collaboration) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    openDetail({ type: 'payment', collaboration });
  };

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Request a refund for this payment?')) return;
    try {
      await api.refundPayment(paymentId);
      setPaymentRefreshToken((value) => value + 1);
    } catch (error) {
      window.alert(error.message || 'Refund could not be requested.');
    }
  };

  const handleOpenActivity = (section) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setMessageTarget(null);
    setMarketplaceSection(section === 'messages' ? 'messages' : 'notifications');
    setActiveTab('marketplace');
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!detailView && <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAccountPanel={(panel) => setAccountPanel(panel)}
        onOpenActivity={handleOpenActivity}
      />}

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {detailView?.type === 'profile' && <PublicProfile profile={detailView.profile} user={user} onBack={goBack} onMessage={handleOpenMessage} onOpenProduct={handleOpenProduct} />}
        {detailView?.type === 'product' && <AffiliateProductDetail product={detailView.product} onBack={goBack} />}
        {detailView?.type === 'messages' && <MessageInterface user={user} target={detailView.target} onBack={goBack} />}
        {detailView?.type === 'payment' && <PaymentCheckout user={user} collaboration={detailView.collaboration} onBack={goBack} onComplete={() => setPaymentRefreshToken((value) => value + 1)} />}
        <div style={{ display: detailView ? 'none' : 'block' }}>
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
                handleOpenPublicProfile({ ...creator, role: 'creator' });
                if (user?.role === 'brand') api.recordCreatorView(creator.user_id || creator.id).catch(() => {});
              }}
              onMessageCreator={handleOpenMessage}
              onSelectBrand={handleOpenPublicProfile}
              onMessageBrand={handleOpenMessage}
            />
          </div>
        )}

        {/* Creator Profile Management Tab */}
        {activeTab === 'my-profile' && user && (
          <>
            <ProfileManager
              currentUser={user}
              onProfileUpdated={(updatedUser) => setUser(updatedUser)}
              onBack={closeProfileWorkspace}
            />
            <AffiliateLinks currentUser={user} />
          </>
        )}

        {/* Marketplace & Brand Deals Overview */}
        {activeTab === 'marketplace' && (
          <MarketplaceOverview
            user={user}
            initialSubTab={marketplaceSection}
            onMessageProfile={handleOpenMessage}
            onOpenProfile={handleOpenPublicProfile}
            onOpenPayment={handleOpenPayment}
            onRefund={handleRefund}
            refreshToken={paymentRefreshToken}
            messageTarget={messageTarget}
          />
        )}
        </div>
      </main>

      {/* Footer */}
      {!detailView && <footer className="site-footer" style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-dim)',
        background: 'rgba(10, 13, 20, 0.9)'
      }}>
        <div>Creova Creator & Brand Marketplace</div>
      </footer>}

      {user && accountPanel && (
        <div className="modal-overlay" onClick={() => setAccountPanel(null)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            {accountPanel === 'profile' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <button type="button" className="icon-back-button account-panel-back" onClick={() => setAccountPanel(null)} aria-label="Back" title="Back"><ArrowLeft size={18} /></button>
                  <img
                    src={getProfileImage(user)}
                    alt={user.name}
                    style={{ width: '74px', height: '74px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.7)' }}
                  />
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{user.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                    <span className="badge-niche" style={{ marginTop: '8px', display: 'inline-block' }}>{user.role}</span>
                  </div>
                </div>
                <div className="account-menu-list">
                  <button type="button" className="account-menu-item" onClick={openProfileWorkspace}>Profile <span>View your information and affiliate links</span></button>
                  <button type="button" className="account-menu-item" onClick={handleSwitchAccount}>Switch Account <span>Sign in with another account</span></button>
                  <button type="button" className="account-menu-item" onClick={handleLogout}>Logout <span>End this session</span></button>
                  <button type="button" className="account-menu-item account-menu-danger" onClick={handleDeleteAccount}>Delete Account <span>Permanently remove this account</span></button>
                </div>
              </>
            )}

            {accountPanel === 'settings' && (
              <>
                <button type="button" className="icon-back-button" onClick={() => setAccountPanel('profile')} aria-label="Back" title="Back"><ArrowLeft size={18} /></button>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '16px' }}>Account Settings</h3>
                <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
                  <button className="btn-secondary" onClick={() => setAccountPanel('privacy')}>Read Privacy Policy</button>
                  <button className="btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setAccountPanel('profile')}>Back</button>
                </div>
              </>
            )}

            {accountPanel === 'privacy' && (
              <>
                <button type="button" className="icon-back-button" onClick={() => setAccountPanel('profile')} aria-label="Back" title="Back"><ArrowLeft size={18} /></button>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '16px' }}>Privacy Policy</h3>
                <div style={{ display: 'grid', gap: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <p>Creova respects your privacy and only uses your account information to provide creator and brand collaboration features.</p>
                  <p>We store your profile details, messages, campaign activity, and account information to power discovery, communication, and collaboration workflows.</p>
                  <p>You can manage your account and delete it at any time from the settings menu. Deleting your account removes your profile information and account record from the platform.</p>
                  <p>We do not sell personal data. We use secure authentication and access controls to protect your information.</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '22px' }}>
                  <button className="btn-secondary" onClick={() => setAccountPanel('settings')}>Back</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
