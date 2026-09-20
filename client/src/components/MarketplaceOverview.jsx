import React, { useState, useEffect } from 'react';
import { 
  Briefcase, FileText, Handshake, MessageSquare, Bell,
  Plus, RefreshCw, ExternalLink, Users
} from 'lucide-react';
import { api } from '../services/api';

export default function MarketplaceOverview({ user, initialSubTab = 'campaigns' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  
  // Data states
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', budget: '', deadline: '' });
  const [applyMsg, setApplyMsg] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const loadActiveTabData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'campaigns') {
        const res = await api.getCampaigns();
        setCampaigns(res.campaigns || []);
      } else if (activeSubTab === 'applications') {
        if (user) {
          const res = await api.getMyApplications();
          setApplications(res.applications || []);
        }
      } else if (activeSubTab === 'collaborations') {
        if (user) {
          const res = await api.getCollaborations();
          setCollaborations(res.collaborations || []);
        }
      } else if (activeSubTab === 'messages') {
        if (user) {
          const res = await api.getConversations();
          setMessages(res.conversations || []);
        }
      } else if (activeSubTab === 'notifications') {
        if (user) {
          const res = await api.getNotifications();
          setNotifications(res.notifications || []);
        }
      } else if (activeSubTab === 'creators') {
        const res = await api.getCreators();
        setCreators(res.creators || []);
      }
    } catch (err) {
      console.error(`Error loading ${activeSubTab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    loadActiveTabData();
  }, [activeSubTab, user]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.createCampaign(newCampaign);
      setNewCampaign({ title: '', description: '', budget: '', deadline: '' });
      loadActiveTabData();
    } catch (err) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  const handleApply = async (campaignId) => {
    try {
      await api.applyToCampaign({ campaign_id: campaignId, message: applyMsg });
      setSelectedCampaignId(null);
      setApplyMsg('');
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    }
  };

  const modules = [
    { id: 'campaigns', title: 'Brand Collaborations', table: 'campaigns', icon: Briefcase, color: '#ffffff' },
    { id: 'creators', title: 'Creators', table: 'creator_profiles', icon: Users, color: '#ffffff' },
    { id: 'applications', title: 'Applications', table: 'campaign_applications', icon: FileText, color: '#ffffff' },
    { id: 'collaborations', title: 'Collaborations', table: 'collaborations', icon: Handshake, color: '#ffffff' },
    { id: 'messages', title: 'Messages', table: 'messages', icon: MessageSquare, color: '#ffffff' },
    { id: 'notifications', title: 'Notifications', table: 'notifications', icon: Bell, color: '#ffffff' }
  ];

  return (
    <section className="content-section marketplace-section" style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Creova <span className="text-gradient">Marketplace Hub</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Explore campaigns, applications, messaging, payouts, and brand deals
          </p>
        </div>

        <button onClick={loadActiveTabData} className="btn-secondary">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Module Navigation Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '32px'
      }}>
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeSubTab === mod.id;

          return (
            <div
              key={mod.id}
              onClick={() => setActiveSubTab(mod.id)}
              className="glass-card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderColor: isActive ? mod.color : 'rgba(255,255,255,0.06)',
                background: isActive ? `${mod.color}15` : 'rgba(22, 27, 42, 0.6)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{
                  background: `${mod.color}20`,
                  color: mod.color,
                  padding: '8px',
                  borderRadius: '8px'
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{mod.title}</h3>
            </div>
          );
        })}
      </div>

      {/* Main Content Area per Tab */}
      {activeSubTab === 'campaigns' && (
        <div>
          {/* Create Campaign for Brands */}
          {user?.role === 'brand' && (
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="#6366f1" />
                Launch New Brand Campaign
              </h3>
              <form onSubmit={handleCreateCampaign} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Campaign Title (e.g. Summer Tech Launch)"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Budget ($ e.g. 1500.00)"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                />
                <input
                  type="date"
                  className="input-field"
                  value={newCampaign.deadline}
                  onChange={(e) => setNewCampaign({ ...newCampaign, deadline: e.target.value })}
                />
                <textarea
                  className="input-field"
                  style={{ gridColumn: '1 / -1' }}
                  placeholder="Campaign Description & Creator Requirements..."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                />
                <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1', width: 'fit-content' }}>
                  Post Campaign
                </button>
              </form>
            </div>
          )}

          {/* List Open Campaigns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {campaigns.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
                <Briefcase size={36} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
                <h4>No campaigns posted yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Sign in as a Brand to post the first campaign offer.
                </p>
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="badge-creator" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)' }}>
                        {c.status || 'open'}
                      </span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        ${parseFloat(c.budget || 0).toLocaleString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{c.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      By {c.company_name || 'Verified Brand'}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                      {c.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  {user?.role === 'creator' && (
                    <button onClick={() => setSelectedCampaignId(c.id)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Apply Now
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Creator Directory Tab */}
      {activeSubTab === 'creators' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {creators.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Users size={36} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <h4>No creators registered yet</h4>
            </div>
          ) : (
            creators.map((creator) => (
              <div key={creator.id} className="glass-card marketplace-creator-card" style={{ padding: '24px' }}>
                <div className="marketplace-creator-head"><img src={creator.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`} alt={creator.name} /><div><h3>{creator.name}</h3><span className="badge-niche">{creator.niche || 'Creator'}</span></div></div>
                <p>{creator.bio || 'No bio specified yet.'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Other Tabs */}
      {['applications', 'collaborations', 'messages', 'notifications'].includes(activeSubTab) && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          {!user ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Sign in to access {modules.find(m => m.id === activeSubTab)?.title}</h4>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>
                {modules.find(m => m.id === activeSubTab)?.title}
              </h3>

              {activeSubTab === 'applications' && (
                <div>
                  {applications.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>No applications submitted yet.</div>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.campaign_title || `Campaign #${app.campaign_id}`}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{app.message}</div>
                        </div>
                        <span className="badge-niche">{app.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'collaborations' && (
                <div>
                  {collaborations.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>No active collaborations yet.</div>
                  ) : (
                    collaborations.map((col) => (
                      <div key={col.id} className="activity-row collaboration-row">
                        <div style={{ fontWeight: 600 }}>{col.campaign_title || `Collaboration #${col.id}`}</div>
                        <div style={{ fontSize: '0.85rem', color: '#34d399' }}>Agreed Amount: ${col.agreed_amount || '0.00'}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'notifications' && (
                <div className="activity-feed">
                  {notifications.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>No notifications found.</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={n.is_read ? 'activity-row' : 'activity-row is-unread'}>
                        <div className="activity-avatar"><Bell size={16} /></div>
                        <div className="activity-copy"><div>{n.title}</div><p>{n.message}</p></div>
                        {!n.is_read && <span className="activity-dot" />}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'messages' && (
                <div className="activity-feed">
                  {messages.length === 0 ? (
                    <div className="activity-empty">No conversations yet. Your messages will appear here.</div>
                  ) : messages.map((conversation) => (
                    <div key={conversation.contact_id} className="activity-row message-row">
                      <div className="activity-avatar"><MessageSquare size={16} /></div>
                      <div className="activity-copy"><div>{conversation.contact_name}</div><p>{conversation.contact_role === 'brand' ? 'Brand' : 'Creator'} · Open conversation</p></div>
                      <ExternalLink size={15} className="activity-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Application Modal */}
      {selectedCampaignId && (
        <div className="modal-overlay" onClick={() => setSelectedCampaignId(null)}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Apply to Campaign</h3>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Why are you a great fit for this campaign?..."
              value={applyMsg}
              onChange={(e) => setApplyMsg(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedCampaignId(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleApply(selectedCampaignId)} className="btn-primary">Submit Application</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
