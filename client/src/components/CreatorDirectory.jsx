import React, { useState, useEffect } from 'react';
import { Search, Video, ExternalLink, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const NICHES = ['All Niches', 'Tech & AI', 'Fashion & Style', 'Lifestyle', 'Gaming', 'Fitness & Health', 'Beauty'];

export default function CreatorDirectory({ onSelectCreator }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('All Niches');

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedNiche !== 'All Niches') params.niche = selectedNiche;

      const data = await api.getCreators(params);
      setCreators(data.creators || []);
    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [search, selectedNiche]);

  return (
    <section className="content-section directory-section" style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px 60px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Creator <span className="text-gradient">Directory</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Discover top content creators across top niches
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '600px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '42px' }}
              placeholder="Search by creator name, bio or niche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Refresh Button */}
          <button onClick={fetchCreators} className="btn-secondary" title="Refresh list">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Niche Filter Pills */}
      <div className="filter-pills" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '28px' }}>
        {NICHES.map((niche) => (
          <button
            key={niche}
            onClick={() => setSelectedNiche(niche)}
            style={{
              background: selectedNiche === niche ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.04)',
              border: selectedNiche === niche ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: selectedNiche === niche ? '#fff' : 'var(--text-muted)',
              padding: '8px 18px',
              borderRadius: '20px',
              fontWeight: 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            {niche}
          </button>
        ))}
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '12px', color: '#818cf8' }} />
          <div>Loading creators...</div>
        </div>
      ) : creators.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UserCheck size={48} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No creators found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            No registered creator profiles match your current search criteria.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {creators.map((creator) => (
            <div key={creator.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <img
                    src={creator.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`}
                    alt={creator.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(99, 102, 241, 0.4)',
                      background: '#1a1d2d'
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>{creator.name}</h3>
                    <span className="badge-niche" style={{ display: 'inline-block', marginTop: '4px' }}>
                      {creator.niche || 'General Content'}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.5',
                  marginBottom: '20px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {creator.bio || 'No bio specified yet.'}
                </p>

                {/* Social Handles */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {creator.instagram && (
                    <a
                      href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(236, 72, 153, 0.1)',
                        color: '#f472b6',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        textDecoration: 'none'
                      }}
                    >
                      <InstagramIcon size={14} />
                      @{creator.instagram.replace('@', '')}
                    </a>
                  )}

                  {creator.youtube && (
                    <a
                      href={`https://youtube.com/${creator.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#fca5a5',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        textDecoration: 'none'
                      }}
                    >
                      <YoutubeIcon size={14} />
                      {creator.youtube}
                    </a>
                  )}

                  {creator.tiktok && (
                    <a
                      href={`https://tiktok.com/@${creator.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(6, 182, 212, 0.1)',
                        color: '#67e8f9',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        textDecoration: 'none'
                      }}
                    >
                      <Video size={14} />
                      @{creator.tiktok.replace('@', '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectCreator(creator)}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                View Full Profile
                <ExternalLink size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
