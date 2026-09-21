import React from 'react';
import { ArrowLeft, ExternalLink, Package, ShoppingBag } from 'lucide-react';

export default function AffiliateProductDetail({ product, onBack }) {
  return (
    <section className="full-page-view affiliate-detail-view">
      <div className="detail-toolbar"><button type="button" className="icon-back-button" onClick={onBack} aria-label="Back" title="Back"><ArrowLeft size={20} /></button><span>Affiliate product</span></div>
      <div className="affiliate-detail-shell">
        <div className="affiliate-detail-image">{product.product_image ? <img src={product.product_image} alt={product.product_name} /> : <Package size={44} />}</div>
          <div className="affiliate-detail-copy"><p className="profile-kicker">{product.company_name || 'Brand offer'}{product.category ? ` · ${product.category}` : ''}</p><h1>{product.product_name}</h1><p>{product.description || product.commission_details || 'Affiliate product available for creator partnerships.'}</p><a className="btn-primary" href={product.affiliate_link} target="_blank" rel="noreferrer"><ShoppingBag size={17} />Open affiliate link <ExternalLink size={15} /></a></div>
      </div>
    </section>
  );
}
