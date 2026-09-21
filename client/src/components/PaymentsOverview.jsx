import React from 'react';
import { ArrowRight, CreditCard, IndianRupee, Receipt, RotateCcw } from 'lucide-react';

const amount = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value || 0));
const statusLabel = (status) => String(status || 'PENDING').replace('_', ' ');

export default function PaymentsOverview({ user, payments, onOpenPayment, onRefund }) {
  const isBrand = user?.role === 'brand';
  const total = payments.filter((payment) => ['PAID', 'PROCESSING', 'RELEASED'].includes(payment.status)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pending = payments.filter((payment) => ['PENDING', 'PROCESSING'].includes(payment.status)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const released = payments.filter((payment) => payment.status === 'RELEASED').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const refunded = payments.filter((payment) => payment.status === 'REFUNDED').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paidCount = payments.filter((payment) => ['PAID', 'PROCESSING', 'RELEASED'].includes(payment.status)).length;

  return (
    <section className="content-section payments-section">
      <div className="profile-workspace">
        <div className="profile-heading"><div><p className="profile-kicker">Financial workspace</p><h2>{isBrand ? 'Payments' : 'Earnings'}</h2><p className="profile-intro">{isBrand ? 'Review collaboration payments and provider transaction records.' : 'Track paid collaborations, pending earnings, and released funds.'}</p></div><div className="profile-status"><CreditCard size={16} /> {isBrand ? 'Brand payments' : 'Creator earnings'}</div></div>
        <div className="payment-summary-grid"><div className="profile-card"><span>{isBrand ? 'Total spent' : 'Total earnings'}</span><strong>{amount(total)}</strong></div><div className="profile-card"><span>{isBrand ? 'Pending payments' : 'Pending earnings'}</span><strong>{amount(pending)}</strong></div><div className="profile-card"><span>{isBrand ? 'Completed payments' : 'Released earnings'}</span><strong>{amount(isBrand ? total - refunded : released)}</strong></div><div className="profile-card"><span>{isBrand ? 'Refunded amount' : 'Paid collaborations'}</span><strong>{isBrand ? amount(refunded) : paidCount}</strong></div></div>
        <div className="affiliate-list-heading"><div><h3>Payment history</h3><p>Only payments associated with your collaborations are shown.</p></div></div>
        {payments.length === 0 ? <div className="profile-card affiliate-empty">No collaboration payments yet.</div> : <div className="payment-history-list">{payments.map((payment) => <article className="profile-card payment-history-row" key={payment.id}><div className="payment-history-icon"><Receipt size={18} /></div><div className="payment-history-copy"><strong>{isBrand ? payment.creator_name || 'Creator' : payment.company_name || 'Brand'}</strong><span>{payment.campaign_title || `Collaboration #${payment.collaboration_id}`}</span><small>{payment.transaction_reference ? `Transaction: ${payment.transaction_reference}` : 'Transaction pending'}</small></div><div className="payment-history-value"><strong>{amount(payment.amount, payment.currency || 'INR')}</strong><span className={`payment-status payment-status-${String(payment.status).toLowerCase()}`}>{statusLabel(payment.status)}</span><small>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Not paid'}</small></div><div className="payment-history-actions">{payment.status === 'PENDING' && isBrand && <button type="button" className="btn-primary" onClick={() => onOpenPayment(payment)}><IndianRupee size={15} />Pay Now</button>}{isBrand && ['PAID', 'PROCESSING', 'RELEASED'].includes(payment.status) && <button type="button" className="btn-secondary" onClick={() => onRefund(payment.id)}><RotateCcw size={15} />Refund</button>}<ArrowRight size={16} /></div></article>)}</div>}
      </div>
    </section>
  );
}
