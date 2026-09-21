import React, { useEffect, useState } from 'react';
import { Edit3, ExternalLink, Link2, Package, Plus, Save, Trash2, Users } from 'lucide-react';
import { api } from '../services/api';

const emptyProduct = {
  product_name: '',
  product_image: '',
  description: '',
  category: '',
  affiliate_link: '',
  commission_details: ''
};

function readImage(file, onRead) {
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      onRead(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function ProductImage({ product, size = 64 }) {
  return product.product_image ? (
    <img src={product.product_image} alt="" style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', background: '#202020' }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 10, display: 'grid', placeItems: 'center', color: '#aaa', background: '#202020' }}><Package size={22} /></div>
  );
}

export default function AffiliateLinks({ currentUser }) {
  const isBrand = currentUser?.role === 'brand';
  const [products, setProducts] = useState([]);
  const [savedLinks, setSavedLinks] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadLinks = async () => {
    setLoading(true);
    setError('');
    try {
      if (isBrand) {
        const result = await api.getBrandAffiliateProducts();
        setProducts(result.products || []);
      } else {
        const [available, mine] = await Promise.all([api.getAffiliateProducts(), api.getMyAffiliateLinks()]);
        setProducts(available.products || []);
        setSavedLinks(mine.links || []);
      }
    } catch (err) {
      setError(err.message || 'Could not load affiliate links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [isBrand]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const createProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');
    try {
      if (editingProduct) {
        await api.updateAffiliateProduct(editingProduct.id, form);
      } else {
        await api.createAffiliateProduct(form);
      }
      setForm(emptyProduct);
      setEditingProduct(null);
      setNotice(editingProduct ? 'Affiliate product updated.' : 'Affiliate product added. Creators can now discover it.');
      await loadLinks();
    } catch (err) {
      setError(err.message || 'Could not add affiliate product.');
    } finally {
      setSaving(false);
    }
  };

  const saveLink = async (productId) => {
    try {
      await api.saveAffiliateLink(productId);
      setNotice('Link saved to your affiliate links.');
      await loadLinks();
    } catch (err) {
      setError(err.message || 'Could not save this link.');
    }
  };

  const removeLink = async (productId) => {
    try {
      await api.unsaveAffiliateLink(productId);
      setNotice('Link removed from your affiliate links.');
      await loadLinks();
    } catch (err) {
      setError(err.message || 'Could not remove this link.');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Remove this affiliate product?')) return;
    try {
      await api.deleteAffiliateProduct(productId);
      setNotice('Affiliate product removed.');
      await loadLinks();
    } catch (err) {
      setError(err.message || 'Could not remove this product.');
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setForm({
      product_name: product.product_name || '',
      product_image: product.product_image || '',
      description: product.description || '',
      category: product.category || '',
      affiliate_link: product.affiliate_link || '',
      commission_details: product.commission_details || ''
    });
    window.scrollTo({ top: 260, behavior: 'smooth' });
  };

  const savedIds = new Set(savedLinks.map((link) => Number(link.id)));

  return (
    <section className="content-section affiliate-section">
      <div className="profile-workspace">
        <div className="profile-heading">
          <div>
            <p className="profile-kicker">Commerce tools</p>
            <h2>{isBrand ? 'Affiliate Products' : 'My Affiliate Products'}</h2>
            <p className="profile-intro">{isBrand ? 'Provide products that creators can discover and add.' : 'Add products provided by brands to your affiliate section.'}</p>
          </div>
          <div className="profile-status"><Link2 size={16} /> {isBrand ? 'Brand products' : 'Creator links'}</div>
        </div>

        {notice && <div className="profile-notice profile-notice-success">{notice}</div>}
        {error && <div className="profile-notice profile-notice-error">{error}</div>}

        {isBrand && (
          <form className="profile-card affiliate-create-card" onSubmit={createProduct}>
            <div className="profile-card-heading"><Plus size={18} /><div><h3>{editingProduct ? 'Edit affiliate product' : 'Create an affiliate product'}</h3><p>Add a product photo, description, destination link, and optional category.</p></div></div>
            <div className="affiliate-form-grid">
              <label className="profile-field"><span>Product name</span><input className="input-field" required value={form.product_name} onChange={(event) => updateForm('product_name', event.target.value)} placeholder="Wireless headphones" /></label>
              <label className="profile-field"><span>Affiliate link</span><input className="input-field" required type="url" value={form.affiliate_link} onChange={(event) => updateForm('affiliate_link', event.target.value)} placeholder="https://yourbrand.com/partner-link" /></label>
              <label className="profile-field"><span>Short description</span><textarea className="input-field" rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="A concise product description for creators." /></label>
              <label className="profile-field"><span>Category / product information</span><input className="input-field" value={form.category} onChange={(event) => updateForm('category', event.target.value)} placeholder="Audio, beauty, fashion..." /></label>
              <label className="profile-field"><span>Commission / offer details</span><textarea className="input-field" rows={3} value={form.commission_details} onChange={(event) => updateForm('commission_details', event.target.value)} placeholder="20% commission, valid through December" /></label>
              <div className="profile-field"><span>Product photo</span><div className="affiliate-photo-input"><ProductImage product={form} size={76} /><label className="btn-secondary profile-upload"><Package size={16} />Choose photo<input type="file" accept="image/*" onChange={(event) => { readImage(event.target.files?.[0], (image) => updateForm('product_image', image)); event.target.value = ''; }} /></label></div></div>
            </div>
            <div className="profile-save-row"><span><Users size={15} /> New products are visible to creators.</span><div style={{ display: 'flex', gap: '8px' }}>{editingProduct && <button type="button" className="btn-secondary" onClick={() => { setEditingProduct(null); setForm(emptyProduct); }}>Cancel</button>}<button type="submit" className="btn-primary" disabled={saving}><Save size={17} />{saving ? 'Saving...' : editingProduct ? 'Save product' : 'Add product'}</button></div></div>
          </form>
        )}

        <div className="affiliate-list-heading"><div><h3>{isBrand ? 'Your affiliate products' : 'Available affiliate products'}</h3><p>{isBrand ? 'Manage products provided to creators.' : 'Add products provided by brands to your account.'}</p></div><button type="button" className="btn-secondary" onClick={loadLinks}>Refresh</button></div>
        {loading ? <div className="profile-loading">Loading affiliate links...</div> : products.length === 0 ? <div className="profile-card affiliate-empty">No affiliate products are available yet.</div> : <div className="affiliate-product-grid">{products.map((product) => {
          const saved = savedIds.has(Number(product.id));
          return <article className="profile-card affiliate-product-card" key={product.id}>
            <div className="affiliate-product-top"><ProductImage product={product} size={72} /><div><h3>{product.product_name}</h3><p>{product.company_name || 'Your brand'}</p></div></div>
            {product.description && <p className="affiliate-details">{product.description}</p>}
            {product.category && <span className="affiliate-category">{product.category}</span>}
            {product.commission_details && <p className="affiliate-details">{product.commission_details}</p>}
            <div className="affiliate-product-meta"><span>{Number(product.saves_count || 0)} creator saves</span><a href={product.affiliate_link} target="_blank" rel="noreferrer" aria-label={`Open ${product.product_name} affiliate link`} title="Open affiliate link"><ExternalLink size={16} /></a></div>
            {isBrand ? <div style={{ display: 'flex', gap: '8px' }}><button type="button" className="btn-secondary" onClick={() => editProduct(product)}><Edit3 size={16} />Edit</button><button type="button" className="btn-danger" onClick={() => deleteProduct(product.id)}><Trash2 size={16} />Remove</button></div> : <button type="button" className={saved ? 'btn-secondary' : 'btn-primary'} onClick={() => saved ? removeLink(product.id) : saveLink(product.id)}>{saved ? <><Save size={16} />Added ✓</> : <><Plus size={16} />Add</>}</button>}
          </article>;
        })}</div>}

        {!isBrand && <><div className="affiliate-list-heading"><div><h3>My Affiliate Products</h3><p>Products you added from brand profiles.</p></div></div>{savedLinks.length === 0 ? <div className="profile-card affiliate-empty">You have not added any brand products yet.</div> : <div className="affiliate-product-grid">{savedLinks.map((link) => <article className="profile-card affiliate-product-card" key={`saved-${link.id}`}><div className="affiliate-product-top"><ProductImage product={link} size={60} /><div><h3>{link.product_name}</h3><p>{link.company_name || 'Brand'}</p></div></div>{link.description && <p className="affiliate-details">{link.description}</p>}<p className="affiliate-details">Added {new Date(link.saved_at).toLocaleDateString()}</p><a className="btn-primary" href={link.affiliate_link} target="_blank" rel="noreferrer"><ExternalLink size={16} />View Product</a></article>)}</div>}</>}
      </div>
    </section>
  );
}
