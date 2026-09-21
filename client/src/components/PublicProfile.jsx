import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Link2, MessageCircle, Package, Play, Plus, Save, ShoppingBag, Video } from 'lucide-react';
import { api } from '../services/api';

function Avatar({ profile, size = 96 }) {
  const image = profile.profile_image || profile.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || profile.company_name || 'profile'}`;
  return <img src={image} alt={profile.name || profile.company_name || 'Profile'} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.2)', background: '#202020' }} />;
}

export default function PublicProfile({ profile, user, onBack, onMessage, onOpenProduct }) {
  const isBrand = profile.role === 'brand' || Boolean(profile.company_name);
  const [affiliateItems, setAffiliateItems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [affiliateNotice, setAffiliateNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = isBrand
          ? await api.getPublicBrandAffiliateProducts(profile.user_id || profile.id)
          : await api.getPublicCreatorAffiliateLinks(profile.user_id || profile.id);
        setAffiliateItems(isBrand ? result.products || [] : result.links || []);
        if (isBrand && user?.role === 'creator') {
          const mine = await api.getMyAffiliateLinks();
          setSavedIds(new Set((mine.links || []).map((item) => Number(item.id))));
        }
      } catch (error) {
        console.error('Could not load public affiliate links:', error);
        setAffiliateItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    }, [isBrand, profile.id, profile.user_id, user?.id]);

  const addProduct = async (event, productId) => {
    event.stopPropagation();
    if (user?.role !== 'creator') return;
    setSavingId(productId);
    setAffiliateNotice('');
    try {
      await api.saveAffiliateLink(productId);
      setSavedIds((ids) => new Set([...ids, Number(productId)]));
      setAffiliateNotice('Product added to your affiliate products.');
    } catch (error) {
      setAffiliateNotice(error.message || 'Could not add this product.');
    } finally {
      setSavingId(null);
    }
  };

  const displayName = profile.name || profile.company_name || 'Profile';
  const socials = [
    profile.instagram && { label: 'Instagram', value: profile.instagram, href: `https://instagram.com/${profile.instagram.replace('@', '')}`, icon: Link2 },
    profile.youtube && { label: 'YouTube', value: profile.youtube, href: profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`, icon: Play },
    profile.tiktok && { label: 'TikTok', value: profile.tiktok, href: `https://tiktok.com/@${profile.tiktok.replace('@', '')}`, icon: Video }
  ].filter(Boolean);

  return (
    <section className="full-page-view public-profile-view">
      <div className="detail-toolbar"><button type="button" className="icon-back-button" onClick={onBack} aria-label="Back" title="Back"><ArrowLeft size={20} /></button><span>Public profile</span></div>
      <div className="public-profile-shell">
        <header className="public-profile-header">
          <Avatar profile={profile} />
          <div className="public-profile-heading"><p className="profile-kicker">{isBrand ? 'Brand account' : 'Creator account'}</p><h1>{displayName}</h1><p>{isBrand ? profile.email || 'Brand partner' : profile.niche || 'Creator'}</p></div>
          {user && Number(user.id) !== Number(profile.user_id || profile.id) && <button type="button" className="btn-primary public-profile-message" onClick={() => onMessage(profile)}><MessageCircle size={17} />Message</button>}
        </header>

        <div className="public-profile-grid">
          <div className="public-profile-main">
            <div className="profile-card"><h2>{isBrand ? 'About the brand' : 'About the creator'}</h2><p className="public-profile-copy">{profile.description || profile.bio || 'No public information has been added yet.'}</p></div>
            {isBrand && profile.website && <div className="profile-card public-link-card"><GlobeLink href={profile.website} label="Visit website" /></div>}
            {socials.length > 0 && <div className="profile-card"><h2>Connected social accounts</h2><div className="public-social-grid">{socials.map(({ label, value, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={17} /><span><strong>{label}</strong><small>{value}</small></span><ExternalLink size={14} /></a>)}</div></div>}
            <div className="profile-card"><h2>Public activity</h2><div className="public-stat-grid"><div><strong>{profile.profile_views || 0}</strong><span>Profile views</span></div><div><strong>{profile.collaborations || 0}</strong><span>Collaborations</span></div><div><strong>{profile.campaigns || 0}</strong><span>Campaigns</span></div></div></div>
          </div>
          <aside className="public-profile-side"><div className="profile-card affiliate-public-card"><div className="profile-card-heading"><ShoppingBag size={18} /><div><h2>Affiliate Products</h2><p>{isBrand ? 'Products provided by this brand.' : 'Products this creator has added.'}</p></div></div>{affiliateNotice && <div className="profile-notice profile-notice-success">{affiliateNotice}</div>}{loading ? <p className="affiliate-muted">Loading affiliate products...</p> : affiliateItems.length === 0 ? <p className="affiliate-muted">No public affiliate products yet.</p> : <div className="public-affiliate-list">{affiliateItems.map((item) => { const added = savedIds.has(Number(item.id)); return <div className="public-affiliate-item" key={item.id} onClick={() => onOpenProduct(item)} role="button" tabIndex={0}><div className="public-affiliate-image">{item.product_image ? <img src={item.product_image} alt="" /> : <Package size={20} />}</div><span><strong>{item.product_name}</strong><small>{item.company_name || displayName}</small>{item.description && <small>{item.description}</small>}</span>{isBrand ? user?.role === 'creator' ? <button type="button" className={added ? 'btn-secondary' : 'btn-primary'} onClick={(event) => added ? event.stopPropagation() : addProduct(event, item.id)} disabled={savingId === item.id}>{added ? <><Save size={14} />Added ✓</> : <><Plus size={14} />Add</>}</button> : <span className="affiliate-muted">Creator only</span> : <ExternalLink size={15} />}</div>; })}</div>}</div></aside>
        </div>
      </div>
    </section>
  );
}

function GlobeLink({ href, label }) {
  return <a className="public-website-link" href={href} target="_blank" rel="noreferrer"><Link2 size={16} />{label}<ExternalLink size={15} /></a>;
}
