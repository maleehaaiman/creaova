import React, { useState, useEffect } from 'react';
import { Save, User, Video, Camera, Tag, FileText, CheckCircle2, X } from 'lucide-react';

const InstagramIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

import { api } from '../services/api';

export default function CreatorProfileEditor({ currentUser, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    bio: '',
    niche: 'Tech & AI',
    profile_image: '',
    instagram: '',
    youtube: '',
    tiktok: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please choose an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Please choose an image smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const source = new window.Image();
      source.onload = () => {
        const size = Math.min(source.naturalWidth, source.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const context = canvas.getContext('2d');
        context.drawImage(
          source,
          (source.naturalWidth - size) / 2,
          (source.naturalHeight - size) / 2,
          size,
          size,
          0,
          0,
          320,
          320
        );
        setFormData((current) => ({
          ...current,
          profile_image: canvas.toDataURL('image/jpeg', 0.82)
        }));
        setErrorMsg('');
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getCurrentUser();
        if (data.profile) {
          setFormData({
            bio: data.profile.bio || '',
            niche: data.profile.niche || 'Tech & AI',
            profile_image: data.profile.profile_image || '',
            instagram: data.profile.instagram || '',
            youtube: data.profile.youtube || '',
            tiktok: data.profile.tiktok || ''
          });
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.updateCreatorProfile(formData);
      setSuccessMsg('Creator profile updated successfully in MySQL!');
      if (onProfileUpdated) onProfileUpdated(res.creator);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update creator profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="content-section profile-section" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 24px 60px' }}>
      <div className="glass-panel" style={{ padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(236, 72, 153, 0.2)',
            padding: '10px',
            borderRadius: '12px',
            color: '#f472b6'
          }}>
            <User size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Manage Creator Profile</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Updating records in <code style={{ color: '#f472b6' }}>creator_profiles</code> (user_id: {currentUser?.id})
            </p>
          </div>
        </div>

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '12px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            <CheckCircle2 size={18} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Niche & Profile Photo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Content Niche
              </label>
              <div style={{ position: 'relative' }}>
                <Tag size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
                <select
                  className="input-field"
                  style={{ paddingLeft: '42px', appearance: 'none' }}
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                >
                  <option value="Tech & AI">Tech & AI</option>
                  <option value="Fashion & Style">Fashion & Style</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Fitness & Health">Fitness & Health</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Travel & Food">Travel & Food</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Profile Photo
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '2px solid rgba(244,114,182,0.65)'
                }}>
                  {formData.profile_image ? (
                    <img src={formData.profile_image} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={28} color="var(--text-dim)" />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                    <Camera size={17} />
                    Choose photo
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  </label>
                  {formData.profile_image && (
                    <button
                      type="button"
                      className="btn-secondary"
                      title="Remove profile photo"
                      onClick={() => setFormData((current) => ({ ...current, profile_image: '' }))}
                    >
                      <X size={17} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '8px' }}>
                Choose a photo and it will be cropped to a square avatar.
              </p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Creator Bio
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
              <textarea
                rows={4}
                className="input-field"
                style={{ paddingLeft: '42px', resize: 'vertical' }}
                placeholder="Share your passion, content focus, audience demographics and collaboration interests..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
          </div>

          {/* Social Handles */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '10px' }}>Social Accounts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Instagram Handle
              </label>
              <div style={{ position: 'relative' }}>
                <InstagramIcon size={18} color="#f472b6" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                  placeholder="@yourname"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                YouTube Channel
              </label>
              <div style={{ position: 'relative' }}>
                <YoutubeIcon size={18} color="#fca5a5" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                  placeholder="Channel Name or @handle"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                TikTok Handle
              </label>
              <div style={{ position: 'relative' }}>
                <Video size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#67e8f9' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                  placeholder="@yourname"
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: 'fit-content', marginTop: '12px' }}
          >
            <Save size={18} />
            {loading ? 'Saving to Database...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </section>
  );
}
