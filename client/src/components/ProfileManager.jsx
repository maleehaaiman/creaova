import React, { useEffect, useMemo, useState } from 'react';
import { AtSign, BarChart3, Building2, Camera, Check, Globe, Image, Mail, MessageCircle, Save, ShieldCheck, Tag, User, Users } from 'lucide-react';
import { api } from '../services/api';

const creatorDefaults = { bio: '', niche: 'Tech & AI', profile_image: '', instagram: '', youtube: '', tiktok: '' };
const brandDefaults = { company_name: '', description: '', website: '', logo: '' };

function readSquareImage(file, onReady) {
  const reader = new FileReader();
  reader.onload = () => {
    const source = new window.Image();
    source.onload = () => {
      const size = Math.min(source.naturalWidth, source.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const context = canvas.getContext('2d');
      context.drawImage(source, (source.naturalWidth - size) / 2, (source.naturalHeight - size) / 2, size, size, 0, 0, 320, 320);
      onReady(canvas.toDataURL('image/jpeg', 0.82));
    };
    source.src = reader.result;
  };
  reader.readAsDataURL(file);
}

export default function ProfileManager({ currentUser, onProfileUpdated }) {
  const [profile, setProfile] = useState(currentUser?.role === 'brand' ? brandDefaults : creatorDefaults);
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [createdAt, setCreatedAt] = useState(currentUser?.created_at || '');
  const [stats, setStats] = useState({ profileViews: 0, messages: 0, collaborations: 0, applications: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isBrand = currentUser?.role === 'brand';
  const roleLabel = isBrand ? 'Brand account' : 'Creator account';

  useEffect(() => {
    let mounted = true;
    api.getCurrentUser().then((data) => {
      if (!mounted) return;
      setDisplayName(data.user?.name || '');
      setEmail(data.user?.email || '');
      setCreatedAt(data.user?.created_at || '');
      setProfile(data.profile || (data.user?.role === 'brand' ? brandDefaults : creatorDefaults));
      setStats(data.stats || { profileViews: 0, messages: 0, collaborations: 0, applications: 0 });
    }).catch((err) => {
      if (mounted) setError(err.message || 'Could not load your profile.');
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const fields = isBrand
    ? [displayName, profile.company_name, profile.description, profile.website]
    : [displayName, profile.bio, profile.niche, profile.profile_image, profile.instagram, profile.youtube, profile.tiktok];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const updateProfile = (key, value) => setProfile((current) => ({ ...current, [key]: value }));

  const handleImage = (event, key) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Choose an image file smaller than 5 MB.');
      return;
    }
    readSquareImage(file, (image) => {
      updateProfile(key, image);
      setError('');
    });
    event.target.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const account = await api.updateCurrentUser({ name: displayName });
      const result = isBrand
        ? await api.updateBrandProfile(profile)
        : await api.updateCreatorProfile(profile);
      setMessage('Profile changes saved. Your public profile is up to date.');
      if (onProfileUpdated) onProfileUpdated(account.user);
      if (result) setProfile(result.brand || result.creator || profile);
    } catch (err) {
      setError(err.message || 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = useMemo(() => createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently', [createdAt]);

  if (loading) return <section className="content-section profile-section"><div className="profile-loading">Loading your profile...</div></section>;

  return (
    <section className="content-section profile-section">
      <div className="profile-workspace">
        <div className="profile-heading">
          <div>
            <p className="profile-kicker">Account workspace</p>
            <h2>Manage your profile</h2>
            <p className="profile-intro">Keep your identity and public {isBrand ? 'brand presence' : 'creator presence'} ready for the next collaboration.</p>
          </div>
          <div className="profile-status"><ShieldCheck size={16} /> {roleLabel}</div>
        </div>

        {message && <div className="profile-notice profile-notice-success"><Check size={17} />{message}</div>}
        {error && <div className="profile-notice profile-notice-error">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-trace-card">
              <div className="profile-progress-ring" style={{ '--progress': `${completion}%` }}>
                <strong>{completion}%</strong>
              </div>
              <h3>Profile readiness</h3>
              <p>{completion === 100 ? 'Everything is ready to publish.' : 'Add a few details to make your profile easier to trust.'}</p>
            </div>
            <div className="profile-trace-list">
              <div><span>Account</span><strong>Active</strong></div>
              <div><span>Member since</span><strong>{formattedDate}</strong></div>
              <div><span>Profile status</span><strong>Ready to manage</strong></div>
            </div>
            <div className="profile-metrics">
              <div><BarChart3 size={16} /><span>{isBrand ? 'Applications received' : 'Brand profile views'}</span><strong>{isBrand ? stats.applications : stats.profileViews}</strong></div>
              <div><MessageCircle size={16} /><span>Messages</span><strong>{stats.messages}</strong></div>
              <div><Users size={16} /><span>Collaborations</span><strong>{stats.collaborations}</strong></div>
            </div>
          </aside>

          <div className="profile-form-column">
            <div className="profile-card">
              <div className="profile-card-heading"><User size={18} /><div><h3>Account identity</h3><p>This is how you appear across Creova.</p></div></div>
              <label className="profile-field">
                <span>Display name</span>
                <div className="profile-input-wrap"><User size={16} /><input className="input-field" value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} required /></div>
              </label>
              <label className="profile-field">
                <span>Email address</span>
                <div className="profile-input-wrap"><Mail size={16} /><input className="input-field" value={email} readOnly /></div>
              </label>
            </div>

            <div className="profile-card">
              <div className="profile-card-heading"><Building2 size={18} /><div><h3>{isBrand ? 'Brand details' : 'Creator details'}</h3><p>These details are shown to potential collaborators.</p></div></div>

              {isBrand ? (
                <>
                  <label className="profile-field"><span>Company name</span><div className="profile-input-wrap"><Building2 size={16} /><input className="input-field" value={profile.company_name || ''} onChange={(event) => updateProfile('company_name', event.target.value)} placeholder="Your company or studio" /></div></label>
                  <label className="profile-field"><span>Website</span><div className="profile-input-wrap"><Globe size={16} /><input className="input-field" type="url" value={profile.website || ''} onChange={(event) => updateProfile('website', event.target.value)} placeholder="https://yourbrand.com" /></div></label>
                  <label className="profile-field"><span>About the brand</span><textarea className="input-field" rows={5} value={profile.description || ''} onChange={(event) => updateProfile('description', event.target.value)} placeholder="Tell creators what your brand stands for and what you are building." /></label>
                  <div className="profile-photo-row"><div className="profile-avatar">{profile.logo ? <img src={profile.logo} alt="Brand logo preview" /> : <Building2 size={26} />}</div><label className="btn-secondary profile-upload"><Camera size={16} />Choose logo<input type="file" accept="image/*" onChange={(event) => handleImage(event, 'logo')} /></label></div>
                </>
              ) : (
                <>
                  <label className="profile-field"><span>Content niche</span><div className="profile-input-wrap"><Tag size={16} /><select className="input-field" value={profile.niche || 'Tech & AI'} onChange={(event) => updateProfile('niche', event.target.value)}><option>Tech & AI</option><option>Fashion & Style</option><option>Lifestyle</option><option>Gaming</option><option>Fitness & Health</option><option>Beauty</option><option>Travel & Food</option></select></div></label>
                  <label className="profile-field"><span>Creator bio</span><textarea className="input-field" rows={5} value={profile.bio || ''} onChange={(event) => updateProfile('bio', event.target.value)} placeholder="Share your focus, audience, and collaboration interests." /></label>
                  <div className="profile-photo-row"><div className="profile-avatar">{profile.profile_image ? <img src={profile.profile_image} alt="Profile preview" /> : <User size={26} />}</div><label className="btn-secondary profile-upload"><Camera size={16} />Choose photo<input type="file" accept="image/*" onChange={(event) => handleImage(event, 'profile_image')} /></label></div>
                  <div className="profile-social-grid"><label className="profile-field"><span>Instagram</span><div className="profile-input-wrap"><AtSign size={16} /><input className="input-field" value={profile.instagram || ''} onChange={(event) => updateProfile('instagram', event.target.value)} placeholder="@yourname" /></div></label><label className="profile-field"><span>YouTube</span><div className="profile-input-wrap"><Image size={16} /><input className="input-field" value={profile.youtube || ''} onChange={(event) => updateProfile('youtube', event.target.value)} placeholder="Channel name" /></div></label><label className="profile-field"><span>TikTok</span><div className="profile-input-wrap"><AtSign size={16} /><input className="input-field" value={profile.tiktok || ''} onChange={(event) => updateProfile('tiktok', event.target.value)} placeholder="@yourname" /></div></label></div>
                </>
              )}
            </div>

            <div className="profile-save-row"><span><ShieldCheck size={15} /> Changes are saved to your account.</span><button type="submit" className="btn-primary" disabled={saving}><Save size={17} />{saving ? 'Saving...' : 'Save changes'}</button></div>
          </div>
        </form>
      </div>
    </section>
  );
}