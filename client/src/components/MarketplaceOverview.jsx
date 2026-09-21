import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Bell, Briefcase, CreditCard, Handshake, MessageSquare, RefreshCw,
  Search, Send, Users
} from 'lucide-react';
import { api } from '../services/api';
import PaymentsOverview from './PaymentsOverview';

export default function MarketplaceOverview({ user, initialSubTab = 'brands', onMessageProfile, onOpenProfile, messageTarget, onOpenPayment, onRefund, refreshToken }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  // Data states
  const [brands, setBrands] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [creators, setCreators] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadActiveTabData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'brands') {
        const res = await api.getBrands();
        setBrands(res.brands || []);
      } else if (activeSubTab === 'creators') {
        const res = await api.getCreators();
        setCreators(res.creators || []);
      } else if (activeSubTab === 'collaborations') {
        if (user) {
          const [res, paymentRes] = await Promise.all([api.getCollaborations(), api.getPayments()]);
          setCollaborations(res.collaborations || []);
          setPayments(paymentRes.payments || []);
        }
      } else if (activeSubTab === 'payments') {
        if (user) {
          const res = await api.getPayments();
          setPayments(res.payments || []);
        }
      } else if (activeSubTab === 'messages') {
        if (user) {
          const res = await api.getConversations();
          const list = res.conversations || [];
          setConversations(list);
          if (!selectedConversation && !messageTarget && list.length > 0) {
            const first = list[0];
            const next = {
              ...first,
              id: first.contact_id,
              user_id: first.contact_id,
              name: first.contact_name,
              role: first.contact_role,
              contact_id: first.contact_id,
              contact_name: first.contact_name,
              contact_role: first.contact_role
            };
            setSelectedConversation(next);
          }
        }
      } else if (activeSubTab === 'notifications' && user) {
        const res = await api.getNotifications();
        setNotifications(res.notifications || []);
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
    if (initialSubTab !== 'messages' || !messageTarget) return;
    setSelectedConversation({
      ...messageTarget,
      id: messageTarget.user_id || messageTarget.id,
      user_id: messageTarget.user_id || messageTarget.id,
      name: messageTarget.name || messageTarget.company_name || 'Profile',
      contact_name: messageTarget.name || messageTarget.company_name || 'Profile',
      contact_role: messageTarget.role || (messageTarget.company_name ? 'brand' : 'creator'),
      contact_id: messageTarget.user_id || messageTarget.id
    });
  }, [initialSubTab, messageTarget]);

  useEffect(() => {
    loadActiveTabData();
  }, [activeSubTab, user, refreshToken]);

  const loadChatHistory = async (contact) => {
    if (!contact || !user) return;
    const contactId = contact.user_id || contact.contact_id || contact.id;
    try {
      const res = await api.getChatHistory(contactId);
      setChatMessages(res.messages || []);
    } catch (err) {
      console.error('Error loading chat history:', err);
      setChatMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !user || !newMessage.trim()) return;
    const receiverId = selectedConversation.user_id || selectedConversation.contact_id || selectedConversation.id;
    try {
      await api.sendMessage({ receiver_id: receiverId, message: newMessage.trim() });
      setNewMessage('');
      await loadChatHistory(selectedConversation);
      const res = await api.getConversations();
      setConversations(res.conversations || []);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'messages' && selectedConversation) {
      loadChatHistory(selectedConversation);
    }
  }, [activeSubTab, selectedConversation, user]);

  const modules = [
    { id: 'brands', title: 'Brands', icon: Briefcase, color: '#ffffff' },
    { id: 'creators', title: 'Creators', icon: Users, color: '#ffffff' },
    { id: 'collaborations', title: 'Collaborations', icon: Handshake, color: '#ffffff' }
  ];
  if (user) modules.push({ id: 'payments', title: user.role === 'brand' ? 'Payments' : 'Earnings', icon: CreditCard, color: '#ffffff' });

  const selectedContactName = selectedConversation?.contact_name || selectedConversation?.name || 'Conversation';
  const visibleConversations = conversations.filter((conversation) => (
    conversation.contact_name || ''
  ).toLowerCase().includes(conversationSearch.toLowerCase()));

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

      {activeSubTab === 'brands' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {brands.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Briefcase size={36} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <h4>No brands registered yet</h4>
            </div>
          ) : (
            brands.map((brand) => (
              <div key={brand.id} className="glass-card" onClick={() => onOpenProfile && onOpenProfile({ ...brand, name: brand.company_name || 'Brand', role: 'brand' })} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                  <img src={brand.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${brand.company_name || 'Brand'}`} alt={brand.company_name || 'Brand'} style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{brand.company_name || 'Brand'}</h3>
                    <span className="badge-brand">Brand</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{brand.description || 'No brand description yet.'}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '18px' }}>
                  {brand.website && (
                    <a href={brand.website} onClick={(event) => event.stopPropagation()} target="_blank" rel="noreferrer" style={{ color: '#8b5cf6' }}>
                      Visit Website
                    </a>
                  )}
                  <button
                    className="btn-secondary"
                    onClick={(event) => { event.stopPropagation(); onMessageProfile && onMessageProfile({ ...brand, name: brand.company_name || 'Brand', role: 'brand' }); }}
                    style={{ marginLeft: 'auto', padding: '8px 12px' }}
                    aria-label={`Message ${brand.company_name || 'brand'}`}
                    title={`Message ${brand.company_name || 'brand'}`}
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'creators' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {creators.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Users size={36} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <h4>No creators registered yet</h4>
            </div>
          ) : (
            creators.map((creator) => (
              <div key={creator.id} className="glass-card marketplace-creator-card" onClick={() => onOpenProfile && onOpenProfile({ ...creator, role: 'creator' })} style={{ padding: '24px' }}>
                <div className="marketplace-creator-head"><img src={creator.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`} alt={creator.name} /><div><h3>{creator.name}</h3><span className="badge-niche">{creator.niche || 'Creator'}</span></div></div>
                <p>{creator.bio || 'No bio specified yet.'}</p>
                {creator.instagram && <p style={{ marginTop: '10px', color: '#f472b6' }}>@{creator.instagram.replace('@', '')}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
                  <button
                    className="btn-secondary"
                    onClick={(event) => { event.stopPropagation(); onMessageProfile && onMessageProfile({ ...creator, role: 'creator' }); }}
                    style={{ padding: '8px 12px' }}
                    aria-label={`Message ${creator.name}`}
                    title={`Message ${creator.name}`}
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'collaborations' && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          {!user ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Sign in to access collaborations</h4>
            </div>
          ) : (
            <div>
              {collaborations.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>No active collaborations yet.</div>
              ) : (
                collaborations.map((col) => (
                  <div key={col.id} className="activity-row collaboration-row" style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600 }}>{col.campaign_title || `Collaboration #${col.id}`}</div>
                    <div style={{ fontSize: '0.85rem', color: '#34d399' }}>Agreed Amount: ${col.agreed_amount || '0.00'}</div>
                    {(() => {
                      const payment = payments.find((item) => Number(item.collaboration_id) === Number(col.id));
                      return <div className="collaboration-payment-inline"><span>Payment: {payment ? `${payment.currency || 'INR'} ${payment.amount}` : `${col.currency || 'INR'} ${col.agreed_amount || '0.00'}`}</span><span className={`payment-status payment-status-${String(payment?.status || 'PENDING').toLowerCase()}`}>{payment?.status || 'PENDING'}</span>{user.role === 'brand' && (!payment || payment.status === 'PENDING') && <button type="button" className="btn-primary" onClick={() => onOpenPayment && onOpenPayment(payment || col)}>Pay Now</button>}</div>;
                    })()}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'payments' && <PaymentsOverview user={user} payments={payments} onOpenPayment={onOpenPayment} onRefund={onRefund} />}

      {activeSubTab === 'messages' && (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          {!user ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Sign in to access messages</h4>
            </div>
          ) : (
            <div className="instagram-dm" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', minHeight: '640px' }}>
              <div className="instagram-dm-sidebar" style={{ borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(12,15,22,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input
                    className="input-field"
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                    placeholder="Search"
                    aria-label="Search conversations"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px 12px' }}
                  />
                </div>

                <div style={{ overflowY: 'auto', maxHeight: '560px' }}>
                  {visibleConversations.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', padding: '24px 18px' }}>No conversations yet.</div>
                  ) : (
                    visibleConversations.map((conversation) => {
                      const active = selectedConversation && (selectedConversation.contact_id || selectedConversation.id) === (conversation.contact_id || conversation.id);
                      return (
                        <button
                          key={conversation.contact_id || conversation.id}
                          type="button"
                          onClick={() => {
                            const item = { ...conversation, id: conversation.contact_id, user_id: conversation.contact_id, name: conversation.contact_name, role: conversation.contact_role };
                            setSelectedConversation(item);
                            loadChatHistory(item);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            border: 0,
                            cursor: 'pointer',
                            background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                            color: '#fff',
                            textAlign: 'left',
                            borderBottom: '1px solid rgba(255,255,255,0.04)'
                          }}
                        >
                          <img
                            src={conversation.profile_image || conversation.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.contact_name || 'user'}`}
                            alt=""
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', background: '#252525' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conversation.contact_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conversation.contact_role === 'brand' ? 'Brand' : 'Creator'}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="instagram-dm-thread" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(8,10,16,0.7)' }}>
                {selectedConversation ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedConversation(null)}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                          aria-label="Back to conversations"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <img
                          src={selectedConversation.profile_image || selectedConversation.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedContactName}`}
                          alt=""
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', background: '#252525' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700 }}>{selectedContactName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedConversation.contact_role === 'brand' ? 'Brand' : 'Creator'}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(5,7,12,0.3)' }}>
                      {chatMessages.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>No messages yet. Start the conversation.</div>
                      ) : (
                        chatMessages.map((chat) => {
                          const mine = Number(chat.sender_id) === Number(user.id);
                          return (
                            <div key={chat.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                              <div
                                style={{
                                  maxWidth: '72%',
                                  padding: '12px 14px',
                                  borderRadius: mine ? '18px 18px 0 18px' : '18px 18px 18px 0',
                                  background: mine ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                                  color: '#fff',
                                  lineHeight: 1.5,
                                  boxShadow: mine ? '0 10px 24px rgba(99,102,241,0.28)' : 'none'
                                }}
                              >
                                {chat.message}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(12,15,22,0.8)' }}>
                      <input
                        className="input-field"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px' }}
                      />
                      <button type="button" className="btn-primary" onClick={handleSendMessage} style={{ padding: '10px 16px' }}>
                        <Send size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'notifications' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Bell size={19} />
            <h3 style={{ fontSize: '1.2rem' }}>Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="activity-empty">You are all caught up.</div>
          ) : (
            <div className="activity-feed">
              {notifications.map((notification) => (
                <div key={notification.id} className={`activity-row${notification.is_read ? '' : ' is-unread'}`}>
                  <div className="activity-avatar"><Bell size={16} /></div>
                  <div className="activity-copy">
                    <div>{notification.title}</div>
                    <p>{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
