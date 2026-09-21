import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, ExternalLink, XCircle } from 'lucide-react';
import { api } from '../services/api';

const money = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value || 0));

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Secure payment interface could not load.'));
    document.body.appendChild(script);
  });
}

export default function PaymentCheckout({ collaboration, user, onBack, onComplete }) {
  const [status, setStatus] = useState('ready');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  const startPayment = async () => {
    setStatus('creating');
    setError('');
    try {
      const order = await api.createPaymentOrder(collaboration.collaboration_id || collaboration.id);
      if (!order.checkout?.publicKey || order.checkout.provider !== 'razorpay') throw new Error('Payment provider is not configured for checkout.');
      await loadRazorpay();
      setStatus('processing');
      const checkout = new window.Razorpay({
        key: order.checkout.publicKey,
        amount: order.checkout.amount,
        currency: order.checkout.currency,
        name: 'Creova',
        description: collaboration.campaign_title || 'Collaboration payment',
        order_id: order.checkout.providerOrderId,
        handler: async (response) => {
          try {
            setStatus('verifying');
            const verified = await api.verifyPayment({ payment_id: response.razorpay_payment_id, order_id: response.razorpay_order_id, signature: response.razorpay_signature });
            setPayment(verified.payment);
            setStatus('success');
            onComplete?.(verified.payment);
          } catch (verifyError) {
            setError(verifyError.message || 'Payment verification failed.');
            setStatus('failed');
          }
        },
        modal: { ondismiss: () => setStatus('ready') }
      });
      checkout.on('payment.failed', (failure) => { setError(failure.error?.description || 'Payment was declined.'); setStatus('failed'); });
      checkout.open();
    } catch (createError) {
      setError(createError.message || 'Could not start payment.');
      setStatus('failed');
    }
  };

  const title = collaboration.campaign_title || `Collaboration #${collaboration.collaboration_id || collaboration.id}`;
  const creator = collaboration.creator_name || 'Creator';
  const value = payment?.amount || collaboration.amount || collaboration.agreed_amount;
  const currency = payment?.currency || collaboration.currency || 'INR';

  return <section className="full-page-view payment-checkout-view"><div className="detail-toolbar"><button type="button" className="icon-back-button" onClick={onBack} aria-label="Back" title="Back"><ArrowLeft size={20} /></button><span>Collaboration payment</span></div><div className="payment-checkout-shell"><div className="payment-checkout-card"><CreditCard size={28} /><p className="profile-kicker">Secure checkout</p><h1>{status === 'success' ? 'Payment successful' : status === 'failed' ? 'Payment failed' : 'Pay collaboration'}</h1><div className="payment-checkout-details"><div><span>Creator</span><strong>{creator}</strong></div><div><span>Campaign</span><strong>{title}</strong></div><div><span>Amount</span><strong>{money(value, currency)}</strong></div></div>{status === 'success' && <div className="payment-result payment-result-success"><CheckCircle2 size={20} /><span>Payment verified by the provider.<small>Transaction: {payment.transaction_reference}<br />Paid on: {new Date(payment.paid_at || Date.now()).toLocaleDateString()}</small></span></div>}{status === 'failed' && <div className="payment-result payment-result-failed"><XCircle size={20} /><span>{error || 'Payment was not completed.'}</span></div>}{status !== 'success' && status !== 'processing' && status !== 'verifying' && <button type="button" className="btn-primary payment-start-button" onClick={startPayment} disabled={status === 'creating'}><CreditCard size={17} />{status === 'creating' ? 'Creating payment...' : status === 'failed' ? 'Retry Payment' : 'Pay Now'}</button>}{(status === 'processing' || status === 'verifying') && <p className="payment-processing">{status === 'verifying' ? 'Verifying payment with the provider...' : 'Complete payment in the secure provider window...'}</p>}{status === 'success' && <button type="button" className="btn-primary payment-start-button" onClick={onBack}>Back to collaboration</button>}{error && status !== 'failed' && <p className="payment-inline-error">{error}</p>}<a className="payment-security-note" href="https://razorpay.com" target="_blank" rel="noreferrer">Secure provider checkout <ExternalLink size={13} /></a></div></div></section>;
}
